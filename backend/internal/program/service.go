package program

import (
	"context"
	"errors"
	"fmt"
	"math"
	"time"
)

type ScorecardPeriod struct {
	StartYear int `json:"start_year"`
	EndYear   int `json:"end_year"`
}

type IndicatorValue struct {
	Code       string   `json:"code"`
	Label      string   `json:"label"`
	Unit       string   `json:"unit"`
	Value      *float64 `json:"value"`
	SampleSize int      `json:"sample_size"`
}

type OpdRef struct {
	Code string `json:"code"`
	Slug string `json:"slug"`
	Name string `json:"name"`
}

type OpdScorecard struct {
	Opd        OpdRef           `json:"opd"`
	Indicators []IndicatorValue `json:"indicators"`
}

type Scorecard struct {
	Period       ScorecardPeriod  `json:"period"`
	HeadLabel    string           `json:"head_label"`
	IsSimulation bool             `json:"is_simulation"`
	Indicators   []IndicatorValue `json:"indicators"`
	ByOpd        []OpdScorecard   `json:"by_opd"`
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
		ApprovalStatus: "APPROVED",
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
	v1, v2, v3, v4, v5 := 85.5, 88.0, 18.5, 82.0, 79.4
	indicators := []IndicatorValue{
		{Code: "KETUNTASAN_PROKER", Label: "Ketuntasan proker", Unit: "PERCENT", Value: &v1, SampleSize: 12},
		{Code: "KETEPATAN_JADWAL", Label: "Ketepatan jadwal", Unit: "PERCENT", Value: &v2, SampleSize: 25},
		{Code: "RESPONSIVITAS", Label: "Responsivitas", Unit: "HOURS", Value: &v3, SampleSize: 45},
		{Code: "PENYELESAIAN_ISU", Label: "Penyelesaian isu", Unit: "PERCENT", Value: &v4, SampleSize: 38},
		{Code: "PENYERAPAN_ANGGARAN", Label: "Penyerapan anggaran", Unit: "PERCENT", Value: &v5, SampleSize: 18},
	}
	opds := []OpdScorecard{
		{
			Opd:        OpdRef{Code: "BMSDA", Slug: "dinas-bina-marga-sda", Name: "Dinas Bina Marga dan Sumber Daya Air"},
			Indicators: indicators,
		},
		{
			Opd:        OpdRef{Code: "DLHK", Slug: "dinas-lingkungan-hidup-kebersihan", Name: "Dinas Lingkungan Hidup dan Kebersihan"},
			Indicators: indicators,
		},
		{
			Opd:        OpdRef{Code: "DISHUB", Slug: "dinas-perhubungan", Name: "Dinas Perhubungan"},
			Indicators: indicators,
		},
		{
			Opd:        OpdRef{Code: "DINKES", Slug: "dinas-kesehatan", Name: "Dinas Kesehatan"},
			Indicators: indicators,
		},
		{
			Opd:        OpdRef{Code: "DISDIK", Slug: "dinas-pendidikan", Name: "Dinas Pendidikan"},
			Indicators: indicators,
		},
	}
	return &Scorecard{
		Period:       ScorecardPeriod{StartYear: 2025, EndYear: 2030},
		HeadLabel:    "Wali Kota Bandung (data simulasi)",
		IsSimulation: true,
		Indicators:   indicators,
		ByOpd:        opds,
	}, nil
}
