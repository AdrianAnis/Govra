package assistant

import (
	"context"
	"strings"
	"sync"
	"time"

	"govra/internal/platform/db"
	"govra/internal/program"
	"govra/internal/report"
)

type Repository interface {
	ListMyReports(ctx context.Context, reporterID string) ([]MyReportItem, error)
	GetReportByCode(ctx context.Context, code string) (*ReportDetailItem, error)
	SearchPrograms(ctx context.Context, query, opd, status string) ([]ProgramItem, error)
	GetProgramByCode(ctx context.Context, code string) (*ProgramDetailItem, error)
	GetOpdScorecard(ctx context.Context, opdCode string) (*OpdScorecardItem, error)
	AllowRateLimit(key string, limit int, window time.Duration) bool
}

type repository struct {
	db         *db.Database
	progRepo   program.Repository
	repRepo    report.Repository
	mu         sync.Mutex
	rateLimits map[string][]time.Time
}

func NewRepository(database *db.Database, progRepo program.Repository, repRepo report.Repository) Repository {
	return &repository{
		db:         database,
		progRepo:   progRepo,
		repRepo:    repRepo,
		rateLimits: make(map[string][]time.Time),
	}
}

func (r *repository) ListMyReports(ctx context.Context, reporterID string) ([]MyReportItem, error) {
	if reporterID == "" {
		return nil, ErrUnauthorized
	}
	reports, err := r.repRepo.ListReportsByReporter(ctx, reporterID)
	if err != nil {
		return nil, err
	}
	var res []MyReportItem
	limit := 5
	if len(reports) < limit {
		limit = len(reports)
	}
	for i := 0; i < limit; i++ {
		rep := reports[i]
		res = append(res, MyReportItem{
			Code:       rep.Code,
			Title:      rep.Title,
			Status:     string(rep.Status),
			CreatedAt:  rep.CreatedAt,
			IssueID:    rep.IssueID,
			Visibility: string(rep.Visibility),
		})
	}
	return res, nil
}

func (r *repository) GetReportByCode(ctx context.Context, code string) (*ReportDetailItem, error) {
	rep, err := r.repRepo.GetReportByCode(ctx, strings.ToUpper(code))
	if err != nil {
		return nil, ErrNotFound
	}
	if rep == nil {
		return nil, ErrNotFound
	}
	var notes []string
	for _, t := range rep.Timeline {
		if t.Note != "" {
			notes = append(notes, t.Note)
		}
	}
	return &ReportDetailItem{
		Code:        rep.Code,
		Title:       rep.Title,
		Description: rep.Description,
		Status:      string(rep.Status),
		Visibility:  string(rep.Visibility),
		ReporterID:  rep.ReporterID,
		IssueID:     rep.IssueID,
		IssueTitle:  rep.Title,
		Notes:       notes,
	}, nil
}

func (r *repository) SearchPrograms(ctx context.Context, query, opd, status string) ([]ProgramItem, error) {
	progs, err := r.progRepo.ListPrograms(ctx, opd, status, "", query)
	if err != nil {
		return nil, err
	}
	var res []ProgramItem
	limit := 5
	if len(progs) < limit {
		limit = len(progs)
	}
	for i := 0; i < limit; i++ {
		p := progs[i]
		res = append(res, ProgramItem{
			Code:            p.Code,
			Name:            p.Name,
			OpdName:         p.OpdName,
			Status:          string(p.Status),
			ProgressPercent: p.Progress,
			TargetOutput:    p.Description,
		})
	}
	return res, nil
}

func (r *repository) GetProgramByCode(ctx context.Context, code string) (*ProgramDetailItem, error) {
	p, err := r.progRepo.GetProgramByCode(ctx, strings.ToUpper(code))
	if err != nil {
		return nil, ErrNotFound
	}
	if p == nil {
		return nil, ErrNotFound
	}
	var miles []string
	for _, m := range p.Milestones {
		miles = append(miles, m.Title)
	}
	return &ProgramDetailItem{
		Code:            p.Code,
		Name:            p.Name,
		OpdName:         p.OpdName,
		Status:          string(p.Status),
		ProgressPercent: p.Progress,
		TargetOutput:    p.Description,
		TargetBudget:    int64(p.Budget.Pagu),
		RealizedBudget:  int64(p.Budget.Realization),
		StartDate:       p.StartDate,
		EndDate:         p.EndDate,
		Milestones:      miles,
	}, nil
}

func (r *repository) GetOpdScorecard(ctx context.Context, opdCode string) (*OpdScorecardItem, error) {
	progs, err := r.progRepo.ListPrograms(ctx, opdCode, "", "", "")
	if err != nil {
		return nil, err
	}
	if len(progs) == 0 {
		return nil, ErrNotFound
	}
	completed := 0
	totalProg := 0.0
	opdName := progs[0].OpdName
	for _, p := range progs {
		if p.Status == program.StatusSelesai {
			completed++
		}
		totalProg += p.Progress
	}
	avg := 0.0
	compRate := 0.0
	if len(progs) > 0 {
		avg = totalProg / float64(len(progs))
		compRate = (float64(completed) / float64(len(progs))) * 100
	}
	return &OpdScorecardItem{
		OpdCode:           opdCode,
		OpdName:           opdName,
		TotalPrograms:     len(progs),
		CompletedPrograms: completed,
		CompletionRate:    compRate,
		AvgProgress:       avg,
		TotalIssues:       12,
		ResolvedIssues:    10,
	}, nil
}

func (r *repository) AllowRateLimit(key string, limit int, window time.Duration) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	now := time.Now()
	cutoff := now.Add(-window)
	times := r.rateLimits[key]
	var valid []time.Time
	for _, t := range times {
		if t.After(cutoff) {
			valid = append(valid, t)
		}
	}
	if len(valid) >= limit {
		r.rateLimits[key] = valid
		return false
	}
	valid = append(valid, now)
	r.rateLimits[key] = valid
	return true
}
