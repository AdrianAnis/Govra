package program

import (
	"context"
	"errors"
	"math"
	"sort"
	"time"
)

const (
	scheduleTolerance = 10.0
	monthsInTrend     = 6
	percentScale      = 100.0
	secondsPerHour    = 3600.0
	roundingFactor    = 10.0
)

var wib = time.FixedZone("WIB", 7*60*60)

type OpdInfo struct {
	ID         string
	Code       string
	Slug       string
	Name       string
	Categories []string
}

type ProgramFact struct {
	ID          string
	OpdCode     string
	Start       time.Time
	End         time.Time
	Pagu        float64
	Realization float64
	Current     float64
}

type UpdateFact struct {
	ProgramID string
	Progress  float64
	At        time.Time
}

type IssueFact struct {
	OpdCode     string
	CreatedAt   time.Time
	RespondedAt *time.Time
	ResolvedAt  *time.Time
}

type AnalyticsFacts struct {
	Opds     []OpdInfo
	Programs []ProgramFact
	Updates  []UpdateFact
	Issues   []IssueFact
}

type MonthlyPoint struct {
	Month             string   `json:"month"`
	IssuesReceived    int      `json:"issues_received"`
	IssuesResolved    int      `json:"issues_resolved"`
	AvgResponseHours  *float64 `json:"avg_response_hours"`
	ProkerActive      int      `json:"proker_active"`
	ProkerCompleted   int      `json:"proker_completed"`
	ProkerAvgProgress *float64 `json:"proker_avg_progress"`
}

type OpdAnalytics struct {
	Opd         OpdRef           `json:"opd"`
	Categories  []string         `json:"categories"`
	Indicators  []IndicatorValue `json:"indicators"`
	ProkerTotal int              `json:"proker_total"`
	IssuesTotal int              `json:"issues_total"`
	Monthly     []MonthlyPoint   `json:"monthly"`
}

var ErrOpdNotFound = errors.New("opd tidak ditemukan")

type progressIndex map[string][]UpdateFact

func newProgressIndex(updates []UpdateFact) progressIndex {
	index := make(progressIndex)
	for _, update := range updates {
		index[update.ProgramID] = append(index[update.ProgramID], update)
	}
	for id := range index {
		list := index[id]
		sort.Slice(list, func(i, j int) bool { return list[i].At.Before(list[j].At) })
	}
	return index
}

func (p progressIndex) at(programID string, moment time.Time) float64 {
	value := 0.0
	for _, update := range p[programID] {
		if update.At.After(moment) {
			break
		}
		value = update.Progress
	}
	return value
}

func (p progressIndex) now(program ProgramFact, moment, now time.Time) float64 {
	value := p.at(program.ID, moment)
	if !moment.Before(now) && program.Current > value {
		return program.Current
	}
	return value
}

func round1(value float64) float64 {
	return math.Round(value*roundingFactor) / roundingFactor
}

func pointer(value float64) *float64 {
	rounded := round1(value)
	return &rounded
}

func percentOf(part, whole int) *float64 {
	if whole == 0 {
		return nil
	}
	return pointer(float64(part) / float64(whole) * percentScale)
}

func onTrack(program ProgramFact, progress float64, now time.Time) bool {
	if progress >= percentScale {
		return true
	}
	if now.After(program.End) {
		return false
	}
	total := program.End.Sub(program.Start).Hours()
	if total <= 0 {
		return true
	}
	elapsed := now.Sub(program.Start).Hours()
	expected := math.Min(math.Max(elapsed/total, 0), 1) * percentScale
	return progress >= expected-scheduleTolerance
}

func averageResponseHours(issues []IssueFact) (*float64, int) {
	var total float64
	count := 0
	for _, issue := range issues {
		if issue.RespondedAt == nil {
			continue
		}
		total += issue.RespondedAt.Sub(issue.CreatedAt).Seconds() / secondsPerHour
		count++
	}
	if count == 0 {
		return nil, 0
	}
	return pointer(total / float64(count)), count
}

func buildIndicators(programs []ProgramFact, issues []IssueFact, progress progressIndex, now time.Time) []IndicatorValue {
	completed, started, onSchedule := 0, 0, 0
	var pagu, realization float64
	budgeted := 0
	for _, program := range programs {
		current := progress.now(program, now, now)
		if current >= percentScale {
			completed++
		}
		if !program.Start.After(now) {
			started++
			if onTrack(program, current, now) {
				onSchedule++
			}
		}
		if program.Pagu > 0 {
			pagu += program.Pagu
			realization += program.Realization
			budgeted++
		}
	}
	resolved := 0
	for _, issue := range issues {
		if issue.ResolvedAt != nil {
			resolved++
		}
	}
	response, responded := averageResponseHours(issues)
	var absorption *float64
	if pagu > 0 {
		absorption = pointer(realization / pagu * percentScale)
	}
	return []IndicatorValue{
		{Code: "KETUNTASAN_PROKER", Label: "Ketuntasan proker", Unit: "PERCENT", Value: percentOf(completed, len(programs)), SampleSize: len(programs)},
		{Code: "KETEPATAN_JADWAL", Label: "Ketepatan jadwal", Unit: "PERCENT", Value: percentOf(onSchedule, started), SampleSize: started},
		{Code: "RESPONSIVITAS", Label: "Responsivitas", Unit: "HOURS", Value: response, SampleSize: responded},
		{Code: "PENYELESAIAN_ISU", Label: "Penyelesaian isu", Unit: "PERCENT", Value: percentOf(resolved, len(issues)), SampleSize: len(issues)},
		{Code: "PENYERAPAN_ANGGARAN", Label: "Penyerapan anggaran", Unit: "PERCENT", Value: absorption, SampleSize: budgeted},
	}
}

func monthStart(moment time.Time) time.Time {
	local := moment.In(wib)
	return time.Date(local.Year(), local.Month(), 1, 0, 0, 0, 0, wib)
}

func buildMonthly(programs []ProgramFact, issues []IssueFact, progress progressIndex, now time.Time) []MonthlyPoint {
	current := monthStart(now)
	points := make([]MonthlyPoint, 0, monthsInTrend)
	for offset := monthsInTrend - 1; offset >= 0; offset-- {
		begin := current.AddDate(0, -offset, 0)
		next := begin.AddDate(0, 1, 0)
		asOf := next.Add(-time.Nanosecond)
		if asOf.After(now) {
			asOf = now
		}
		point := MonthlyPoint{Month: begin.Format("2006-01")}
		var received []IssueFact
		for _, issue := range issues {
			if !issue.CreatedAt.Before(begin) && issue.CreatedAt.Before(next) {
				received = append(received, issue)
			}
			if issue.ResolvedAt != nil && !issue.ResolvedAt.Before(begin) && issue.ResolvedAt.Before(next) {
				point.IssuesResolved++
			}
		}
		point.IssuesReceived = len(received)
		point.AvgResponseHours, _ = averageResponseHours(received)
		var sum float64
		for _, program := range programs {
			if program.Start.After(asOf) {
				continue
			}
			value := progress.now(program, asOf, now)
			point.ProkerActive++
			sum += value
			if value >= percentScale {
				point.ProkerCompleted++
			}
		}
		if point.ProkerActive > 0 {
			point.ProkerAvgProgress = pointer(sum / float64(point.ProkerActive))
		}
		points = append(points, point)
	}
	return points
}

func opdRef(info OpdInfo) OpdRef {
	return OpdRef{Code: info.Code, Slug: info.Slug, Name: info.Name}
}

func filterPrograms(programs []ProgramFact, code string) []ProgramFact {
	var out []ProgramFact
	for _, program := range programs {
		if program.OpdCode == code {
			out = append(out, program)
		}
	}
	return out
}

func filterIssues(issues []IssueFact, code string) []IssueFact {
	var out []IssueFact
	for _, issue := range issues {
		if issue.OpdCode == code {
			out = append(out, issue)
		}
	}
	return out
}

func (s *service) GetScorecard(ctx context.Context) (*Scorecard, error) {
	facts, err := s.repo.LoadAnalyticsFacts(ctx)
	if err != nil {
		return nil, err
	}
	now := s.now()
	progress := newProgressIndex(facts.Updates)
	byOpd := make([]OpdScorecard, 0, len(facts.Opds))
	for _, info := range facts.Opds {
		byOpd = append(byOpd, OpdScorecard{
			Opd:        opdRef(info),
			Indicators: buildIndicators(filterPrograms(facts.Programs, info.Code), filterIssues(facts.Issues, info.Code), progress, now),
		})
	}
	return &Scorecard{
		Period:       ScorecardPeriod{StartYear: 2025, EndYear: 2030},
		HeadLabel:    "Wali Kota Bandung (data simulasi)",
		IsSimulation: true,
		Indicators:   buildIndicators(facts.Programs, facts.Issues, progress, now),
		ByOpd:        byOpd,
	}, nil
}

func (s *service) GetOpdAnalytics(ctx context.Context, slug string) (*OpdAnalytics, error) {
	facts, err := s.repo.LoadAnalyticsFacts(ctx)
	if err != nil {
		return nil, err
	}
	for _, info := range facts.Opds {
		if info.Slug != slug {
			continue
		}
		now := s.now()
		progress := newProgressIndex(facts.Updates)
		programs := filterPrograms(facts.Programs, info.Code)
		issues := filterIssues(facts.Issues, info.Code)
		categories := info.Categories
		if categories == nil {
			categories = []string{}
		}
		return &OpdAnalytics{
			Opd:         opdRef(info),
			Categories:  categories,
			Indicators:  buildIndicators(programs, issues, progress, now),
			ProkerTotal: len(programs),
			IssuesTotal: len(issues),
			Monthly:     buildMonthly(programs, issues, progress, now),
		}, nil
	}
	return nil, ErrOpdNotFound
}
