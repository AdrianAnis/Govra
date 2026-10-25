package program

import (
	"context"
	"errors"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"govra/internal/platform/db"
)

type Repository interface {
	GetRegion(ctx context.Context) (*Region, error)
	ListDistricts(ctx context.Context) ([]District, error)
	ListGoals(ctx context.Context) ([]Goal, error)
	ListOpds(ctx context.Context) ([]Opd, error)
	GetOpdBySlug(ctx context.Context, slug string) (*Opd, error)
	ListPrograms(ctx context.Context, opdSlug, status, districtID, q string) ([]Program, error)
	GetProgramByCode(ctx context.Context, code string) (*Program, error)
	CreateProgram(ctx context.Context, p *Program) error
	ApproveProgram(ctx context.Context, code string) error
	AddUpdate(ctx context.Context, code string, u *ProgramUpdate) error
}

type repository struct {
	db        *db.Database
	mu        sync.RWMutex
	region    *Region
	districts []District
	goals     []Goal
	opds      []Opd
	programs  map[string]*Program
}

func NewRepository(database *db.Database) Repository {
	r := &repository{
		db:       database,
		programs: make(map[string]*Program),
	}
	r.seedData()
	return r
}

func (r *repository) seedData() {
	r.region = &Region{
		ID:        "a0000000-0000-0000-0000-000000000001",
		Code:      "KOTA-SIMULASI",
		Name:      "Kota Contoh",
		HeadLabel: "Wali Kota",
		Center:    GeoPoint{Lat: -6.2088, Lng: 106.8456},
		PolygonGeoJSON: map[string]interface{}{
			"type": "Polygon",
			"coordinates": [][][]float64{
				{{106.80, -6.25}, {106.90, -6.25}, {106.90, -6.15}, {106.80, -6.15}, {106.80, -6.25}},
			},
		},
	}

	r.districts = []District{
		{
			ID:       "b0000000-0000-0000-0000-000000000001",
			RegionID: "a0000000-0000-0000-0000-000000000001",
			Name:     "Kecamatan Tengah",
			Point:    GeoPoint{Lat: -6.2000, Lng: 106.8400},
			PolygonGeoJSON: map[string]interface{}{
				"type": "Polygon",
				"coordinates": [][][]float64{
					{{106.82, -6.22}, {106.86, -6.22}, {106.86, -6.18}, {106.82, -6.18}, {106.82, -6.22}},
				},
			},
			Villages: []Village{
				{
					ID:         "c0000000-0000-0000-0000-000000000001",
					DistrictID: "b0000000-0000-0000-0000-000000000001",
					Name:       "Kelurahan Gambir",
					Point:      GeoPoint{Lat: -6.1950, Lng: 106.8350},
				},
				{
					ID:         "c0000000-0000-0000-0000-000000000002",
					DistrictID: "b0000000-0000-0000-0000-000000000001",
					Name:       "Kelurahan Kebon Sirih",
					Point:      GeoPoint{Lat: -6.2050, Lng: 106.8450},
				},
			},
		},
		{
			ID:       "b0000000-0000-0000-0000-000000000002",
			RegionID: "a0000000-0000-0000-0000-000000000001",
			Name:     "Kecamatan Utara",
			Point:    GeoPoint{Lat: -6.1600, Lng: 106.8400},
			PolygonGeoJSON: map[string]interface{}{
				"type": "Polygon",
				"coordinates": [][][]float64{
					{{106.82, -6.18}, {106.86, -6.18}, {106.86, -6.14}, {106.82, -6.14}, {106.82, -6.18}},
				},
			},
			Villages: []Village{
				{
					ID:         "c0000000-0000-0000-0000-000000000003",
					DistrictID: "b0000000-0000-0000-0000-000000000002",
					Name:       "Kelurahan Ancol",
					Point:      GeoPoint{Lat: -6.1550, Lng: 106.8350},
				},
				{
					ID:         "c0000000-0000-0000-0000-000000000004",
					DistrictID: "b0000000-0000-0000-0000-000000000002",
					Name:       "Kelurahan Sunter",
					Point:      GeoPoint{Lat: -6.1650, Lng: 106.8450},
				},
			},
		},
	}

	r.goals = []Goal{
		{ID: "d0000000-0000-0000-0000-000000000001", Code: "SAS-01", Name: "Infrastruktur Mantap dan Berkelanjutan"},
		{ID: "d0000000-0000-0000-0000-000000000002", Code: "SAS-02", Name: "Kesehatan dan Kesejahteraan Masyarakat"},
		{ID: "d0000000-0000-0000-0000-000000000003", Code: "SAS-03", Name: "Kota Tanggap dan Bersih"},
	}

	r.opds = []Opd{
		{ID: "e0000000-0000-0000-0000-000000000001", Code: "DBM-SDA", Name: "Dinas Bina Marga & SDA", Slug: "bina-marga-sda", TotalProker: 12, Score: 88},
		{ID: "e0000000-0000-0000-0000-000000000002", Code: "DLHK", Name: "Dinas Lingkungan Hidup & Kebersihan", Slug: "lingkungan-hidup", TotalProker: 8, Score: 82},
		{ID: "e0000000-0000-0000-0000-000000000003", Code: "DISHUB", Name: "Dinas Perhubungan", Slug: "perhubungan", TotalProker: 6, Score: 90},
	}

	sampleProg := &Program{
		ID:             "p0000000-0000-0000-0000-000000000001",
		Code:           "PRG-2025-001",
		Name:           "Rekonstruksi & Pelebaran Jalan Protokol",
		Description:    "Pembangunan dan peningkatan kualitas jalan protokol utama dan perbaikan drainase terintegrasi.",
		OpdID:          "e0000000-0000-0000-0000-000000000001",
		OpdCode:        "DBM-SDA",
		OpdName:        "Dinas Bina Marga & SDA",
		GoalID:         "d0000000-0000-0000-0000-000000000001",
		GoalCode:       "SAS-01",
		DistrictID:     "b0000000-0000-0000-0000-000000000001",
		DistrictName:   "Kecamatan Tengah",
		StartDate:      "2025-01-01",
		EndDate:        "2025-12-31",
		Status:         StatusSesuaiJadwal,
		ApprovalStatus: "APPROVED",
		Progress:       75.0,
		Expected:       70.0,
		Budget: ProgramBudget{
			Pagu:        12500000000,
			Realization: 9500000000,
			Percentage:  76.0,
		},
		Milestones: []ProgramMilestone{
			{ID: "m1", Title: "Perencanaan dan AMDAL", TargetDate: "2025-03-31", IsCompleted: true},
			{ID: "m2", Title: "Pengerukan Drainase", TargetDate: "2025-06-30", IsCompleted: true},
			{ID: "m3", Title: "Pengaspalan Hotmix Tahap 1", TargetDate: "2025-09-30", IsCompleted: true},
			{ID: "m4", Title: "Finishing Marka & Trotoar", TargetDate: "2025-12-31", IsCompleted: false},
		},
		Updates: []ProgramUpdate{
			{
				ID:                  "u1",
				Title:               "Penyelesaian Pengecoran Jalur Tengah",
				Content:             "Pengecoran beton mutu tinggi jalur tengah sepanjang 3 KM telah selesai 100% dan siap diaspal.",
				ProgressPercentage:  75,
				DocumentationPhotos: []string{"https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80"},
				CreatedBy:           "Dinas Bina Marga",
				CreatedAt:           time.Now().Add(-48 * time.Hour),
			},
		},
		RelatedIssues: 4,
		CreatedAt:     time.Now().Add(-180 * 24 * time.Hour),
	}
	r.programs[sampleProg.Code] = sampleProg
}

func (r *repository) GetRegion(ctx context.Context) (*Region, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.region, nil
}

func (r *repository) ListDistricts(ctx context.Context) ([]District, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.districts, nil
}

func (r *repository) ListGoals(ctx context.Context) ([]Goal, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.goals, nil
}

func (r *repository) ListOpds(ctx context.Context) ([]Opd, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.opds, nil
}

func (r *repository) GetOpdBySlug(ctx context.Context, slug string) (*Opd, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, o := range r.opds {
		if o.Slug == slug {
			return &o, nil
		}
	}
	return nil, errors.New("opd tidak ditemukan")
}

func (r *repository) ListPrograms(ctx context.Context, opdSlug, status, districtID, q string) ([]Program, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []Program
	for _, p := range r.programs {
		if p.ApprovalStatus != "APPROVED" {
			continue
		}
		if opdSlug != "" {
			opd, _ := r.GetOpdBySlug(ctx, opdSlug)
			if opd != nil && p.OpdID != opd.ID {
				continue
			}
		}
		if status != "" && string(p.Status) != status {
			continue
		}
		if districtID != "" && p.DistrictID != districtID {
			continue
		}
		if q != "" && !strings.Contains(strings.ToLower(p.Name), strings.ToLower(q)) {
			continue
		}
		list = append(list, *p)
	}
	return list, nil
}

func (r *repository) GetProgramByCode(ctx context.Context, code string) (*Program, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	p, ok := r.programs[code]
	if !ok {
		return nil, errors.New("program kerja tidak ditemukan")
	}
	return p, nil
}

func (r *repository) CreateProgram(ctx context.Context, p *Program) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if p.ID == "" {
		p.ID = uuid.New().String()
	}
	p.CreatedAt = time.Now()
	r.programs[p.Code] = p
	return nil
}

func (r *repository) ApproveProgram(ctx context.Context, code string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	p, ok := r.programs[code]
	if !ok {
		return errors.New("program kerja tidak ditemukan")
	}
	p.ApprovalStatus = "APPROVED"
	return nil
}

func (r *repository) AddUpdate(ctx context.Context, code string, u *ProgramUpdate) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	p, ok := r.programs[code]
	if !ok {
		return errors.New("program kerja tidak ditemukan")
	}
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	u.CreatedAt = time.Now()
	p.Updates = append([]ProgramUpdate{*u}, p.Updates...)
	if u.ProgressPercentage > int(p.Progress) {
		p.Progress = float64(u.ProgressPercentage)
	}
	return nil
}
