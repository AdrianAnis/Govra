package program

import (
	"context"
	"errors"
	"fmt"
	"math"
	"time"
)

type ScorecardIndicator struct {
	Code        string  `json:"code"`
	Name        string  `json:"name"`
	Value       float64 `json:"value"`
	Unit        string  `json:"unit"`
	Description string  `json:"description"`
}

type Scorecard struct {
	OverallScore int                  `json:"overall_score"`
	Indicators   []ScorecardIndicator `json:"indicators"`
	Period       string               `json:"period"`
}

type Service interface {
	GetRegion(ctx context.Context) (*Region, error)
	ListDistricts(ctx context.Context) ([]District, error)
	ListGoals(ctx context.Context) ([]Goal, error)
	ListOpds(ctx context.Context) ([]Opd, error)
	GetOpdBySlug(ctx context.Context, slug string) (*Opd, error)
	ListPrograms(ctx context.Context, opdSlug, status, districtID, q string) ([]Program, error)
	GetProgramByCode(ctx context.Context, code string) (*Program, error)
	CreateProgram(ctx context.Context, req CreateProgramRequest, role string) (*Program, error)
	ApproveProgram(ctx context.Context, code string) error
	AddUpdate(ctx context.Context, code string, req CreateUpdateRequest, author string) error
	GetScorecard(ctx context.Context) (*Scorecard, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetRegion(ctx context.Context) (*Region, error) {
	return s.repo.GetRegion(ctx)
}

func (s *service) ListDistricts(ctx context.Context) ([]District, error) {
	return s.repo.ListDistricts(ctx)
}

func (s *service) ListGoals(ctx context.Context) ([]Goal, error) {
	return s.repo.ListGoals(ctx)
}

func (s *service) ListOpds(ctx context.Context) ([]Opd, error) {
	return s.repo.ListOpds(ctx)
}

func (s *service) GetOpdBySlug(ctx context.Context, slug string) (*Opd, error) {
	return s.repo.GetOpdBySlug(ctx, slug)
}

func (s *service) ListPrograms(ctx context.Context, opdSlug, status, districtID, q string) ([]Program, error) {
	return s.repo.ListPrograms(ctx, opdSlug, status, districtID, q)
}

func (s *service) GetProgramByCode(ctx context.Context, code string) (*Program, error) {
	p, err := s.repo.GetProgramByCode(ctx, code)
	if err != nil {
		return nil, err
	}
	p.Status = s.calculateStatus(p.StartDate, p.EndDate, p.Progress)
	return p, nil
}

func (s *service) calculateStatus(startStr, endStr string, progress float64) ProgramStatus {
	start, err1 := time.Parse("2006-01-02", startStr)
	end, err2 := time.Parse("2006-01-02", endStr)
	if err1 != nil || err2 != nil {
		return StatusSesuaiJadwal
	}
	now := time.Now()
	if progress >= 100 {
		return StatusSelesai
	}
	if now.Before(start) && progress == 0 {
		return StatusBelumDimulai
	}
	if now.After(end) && progress < 100 {
		return StatusMelewatiTenggat
	}
	totalDuration := end.Sub(start).Hours()
	if totalDuration <= 0 {
		return StatusSesuaiJadwal
	}
	elapsed := now.Sub(start).Hours()
	expected := math.Min(math.Max(elapsed/totalDuration, 0), 1) * 100
	if progress >= expected-10 {
		return StatusSesuaiJadwal
	}
	return StatusTerlambat
}

func (s *service) CreateProgram(ctx context.Context, req CreateProgramRequest, role string) (*Program, error) {
	if req.Code == "" || req.Name == "" {
		return nil, errors.New("kode dan nama program wajib diisi")
	}
	approval := "APPROVED"
	if role == "kepala_daerah" {
		approval = "PROPOSED"
	}
	p := &Program{
		Code:           req.Code,
		Name:           req.Name,
		Description:    req.Description,
		OpdID:          req.OpdID,
		GoalID:         req.GoalID,
		DistrictID:     req.DistrictID,
		StartDate:      req.StartDate,
		EndDate:        req.EndDate,
		Status:         StatusBelumDimulai,
		ApprovalStatus: approval,
		Progress:       0,
		Budget: ProgramBudget{
			Pagu:        req.BudgetPagu,
			Realization: 0,
			Percentage:  0,
		},
	}
	for i, mTitle := range req.MilestoneStr {
		p.Milestones = append(p.Milestones, ProgramMilestone{
			ID:          fmt.Sprintf("m-%d", i+1),
			Title:       mTitle,
			TargetDate:  req.EndDate,
			IsCompleted: false,
		})
	}
	if err := s.repo.CreateProgram(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *service) ApproveProgram(ctx context.Context, code string) error {
	return s.repo.ApproveProgram(ctx, code)
}

func (s *service) AddUpdate(ctx context.Context, code string, req CreateUpdateRequest, author string) error {
	u := &ProgramUpdate{
		Title:               req.Title,
		Content:             req.Content,
		ProgressPercentage:  req.ProgressPercentage,
		DocumentationPhotos: req.DocumentationPhotos,
		CreatedBy:           author,
	}
	return s.repo.AddUpdate(ctx, code, u)
}

func (s *service) GetScorecard(ctx context.Context) (*Scorecard, error) {
	return &Scorecard{
		OverallScore: 86,
		Period:       "2025–2030",
		Indicators: []ScorecardIndicator{
			{Code: "KETUNTASAN", Name: "Ketuntasan Proker", Value: 85.5, Unit: "%", Description: "Persentase proker selesai dari yang sudah melewati tenggat"},
			{Code: "KETEPATAN", Name: "Ketepatan Jadwal", Value: 88.0, Unit: "%", Description: "Persentase proker yang sesuai jadwal atau selesai"},
			{Code: "RESPONSIVITAS", Name: "Responsivitas Tanggapan", Value: 18.5, Unit: "Jam", Description: "Median waktu respon dinas terhadap laporan diteruskan"},
			{Code: "PENYELESAIAN", Name: "Penyelesaian Isu Warga", Value: 82.0, Unit: "%", Description: "Isu selesai yang dikonfirmasi warga"},
			{Code: "ANGGARAN", Name: "Penyerapan Anggaran", Value: 79.4, Unit: "%", Description: "Realisasi anggaran dibandingkan pagu"},
		},
	}, nil
}
