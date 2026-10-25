package issue

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
	"govra/internal/platform/db"
)

type Repository interface {
	ListIssues(ctx context.Context, opdID, status, q string) ([]Issue, error)
	GetIssueByID(ctx context.Context, id string) (*Issue, error)
	SaveIssue(ctx context.Context, issue *Issue) error
	SupportIssue(ctx context.Context, issueID, userID string) (int, error)
	AddEvent(ctx context.Context, issueID string, evt IssueEvent) error
	UpdateStatus(ctx context.Context, issueID string, status IssueStatus, coverPhoto string) error
	RouteIssue(ctx context.Context, issueID, opdID, categoryID, note string) error
	ListVerificationQueue(ctx context.Context) ([]Issue, error)
}

type repository struct {
	db       *db.Database
	mu       sync.RWMutex
	issues   map[string]*Issue
	supports map[string]map[string]bool
}

func NewRepository(database *db.Database) Repository {
	r := &repository{
		db:       database,
		issues:   make(map[string]*Issue),
		supports: make(map[string]map[string]bool),
	}
	r.seedIssues()
	return r
}

func (r *repository) seedIssues() {
	now := time.Now()
	sample1 := &Issue{
		ID:                   "i0000000-0000-0000-0000-000000000001",
		Code:                 "ISU-2610-001",
		Title:                "Jalan Berlubang di Dekat Bundaran Air Mancur",
		Summary:              "Lubang jalan sedalam 15 cm mengganggu kelancaran lalu lintas dan berpotensi kecelakaan",
		OpdID:                "e0000000-0000-0000-0000-000000000001",
		OpdName:              "Dinas Bina Marga & SDA",
		CategoryID:           "f0000000-0000-0000-0000-000000000001",
		CategoryName:         "Jalan Rusak & Berlubang",
		DistrictID:           "b0000000-0000-0000-0000-000000000001",
		DistrictName:         "Kecamatan Tengah",
		VillageID:            "c0000000-0000-0000-0000-000000000001",
		VillageName:          "Kelurahan Gambir",
		Point:                LocationPoint{Lat: -6.1950, Lng: 106.8350},
		AddressDetail:        "Jl. Merdeka Barat No. 12",
		Status:               StatusDiteruskan,
		Urgency:              UrgencyTinggi,
		SafetyRisk:           "PROPERTY",
		UniqueReportersCount: 6,
		SlaDueAt:             now.Add(48 * time.Hour),
		CoverPhotoURL:        "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
		Reports: []IssueMemberReport{
			{ID: "r1", Code: "GVR-2610-8F3K", Description: "Jalan berlubang besar", CreatedAt: now.Add(-24 * time.Hour)},
		},
		Events: []IssueEvent{
			{ID: "e1", ToStatus: "DITERUSKAN", AuthorName: "Sistem Triage AI", Note: "Diteruskan otomatis ke Dinas Bina Marga & SDA", CreatedAt: now.Add(-24 * time.Hour)},
		},
		AiRecommendation: "Rekomendasi AI: Teruskan ke Dinas Bina Marga & SDA (Tingkat Keyakinan 94%)",
		CreatedAt:        now.Add(-24 * time.Hour),
		UpdatedAt:        now.Add(-24 * time.Hour),
	}

	sample2 := &Issue{
		ID:                   "i0000000-0000-0000-0000-000000000002",
		Code:                 "ISU-2610-002",
		Title:                "Tumpukan Sampah Menumpuk di Bantaran Kali",
		Summary:              "Sampah rumah tangga liar menumpuk dan menimbulkan bau menyengat",
		OpdID:                "e0000000-0000-0000-0000-000000000002",
		OpdName:              "Dinas Lingkungan Hidup & Kebersihan",
		CategoryID:           "f0000000-0000-0000-0000-000000000003",
		CategoryName:         "Tumpukan Sampah Liar",
		DistrictID:           "b0000000-0000-0000-0000-000000000002",
		DistrictName:         "Kecamatan Utara",
		VillageID:            "c0000000-0000-0000-0000-000000000003",
		VillageName:          "Kelurahan Ancol",
		Point:                LocationPoint{Lat: -6.1550, Lng: 106.8350},
		AddressDetail:        "Bantaran Kali Baru RT 04/02",
		Status:               StatusMenungguVerifikasi,
		Urgency:              UrgencyNormal,
		SafetyRisk:           "NONE",
		UniqueReportersCount: 2,
		SlaDueAt:             now.Add(96 * time.Hour),
		CoverPhotoURL:        "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80",
		Events: []IssueEvent{
			{ID: "e2", ToStatus: "MENUNGGU_VERIFIKASI", AuthorName: "Sistem Triage AI", Note: "Menunggu verifikasi admin pusat", CreatedAt: now.Add(-5 * time.Hour)},
		},
		AiRecommendation: "Rekomendasi AI: Teruskan ke Dinas Lingkungan Hidup (Keyakinan 74%)",
		CreatedAt:        now.Add(-5 * time.Hour),
		UpdatedAt:        now.Add(-5 * time.Hour),
	}

	r.issues[sample1.ID] = sample1
	r.issues[sample2.ID] = sample2
}

func (r *repository) ListIssues(ctx context.Context, opdID, status, q string) ([]Issue, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []Issue
	for _, iss := range r.issues {
		if opdID != "" && iss.OpdID != opdID {
			continue
		}
		if status != "" && string(iss.Status) != status {
			continue
		}
		list = append(list, *iss)
	}
	return list, nil
}

func (r *repository) GetIssueByID(ctx context.Context, id string) (*Issue, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	iss, ok := r.issues[id]
	if !ok {
		return nil, errors.New("isu tidak ditemukan")
	}
	return iss, nil
}

func (r *repository) SaveIssue(ctx context.Context, iss *Issue) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if iss.ID == "" {
		iss.ID = uuid.New().String()
	}
	r.issues[iss.ID] = iss
	return nil
}

func (r *repository) SupportIssue(ctx context.Context, issueID, userID string) (int, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	iss, ok := r.issues[issueID]
	if !ok {
		return 0, errors.New("isu tidak ditemukan")
	}
	if r.supports[issueID] == nil {
		r.supports[issueID] = make(map[string]bool)
	}
	if !r.supports[issueID][userID] {
		r.supports[issueID][userID] = true
		iss.UniqueReportersCount++
	}
	return iss.UniqueReportersCount, nil
}

func (r *repository) AddEvent(ctx context.Context, issueID string, evt IssueEvent) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	iss, ok := r.issues[issueID]
	if !ok {
		return errors.New("isu tidak ditemukan")
	}
	if evt.ID == "" {
		evt.ID = uuid.New().String()
	}
	evt.CreatedAt = time.Now()
	iss.Events = append(iss.Events, evt)
	iss.UpdatedAt = time.Now()
	return nil
}

func (r *repository) UpdateStatus(ctx context.Context, issueID string, status IssueStatus, coverPhoto string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	iss, ok := r.issues[issueID]
	if !ok {
		return errors.New("isu tidak ditemukan")
	}
	iss.Status = status
	if coverPhoto != "" {
		iss.CoverPhotoURL = coverPhoto
	}
	iss.UpdatedAt = time.Now()
	return nil
}

func (r *repository) RouteIssue(ctx context.Context, issueID, opdID, categoryID, note string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	iss, ok := r.issues[issueID]
	if !ok {
		return errors.New("isu tidak ditemukan")
	}
	iss.OpdID = opdID
	iss.CategoryID = categoryID
	iss.Status = StatusDiteruskan
	iss.Events = append(iss.Events, IssueEvent{
		ID:         uuid.New().String(),
		FromStatus: string(StatusMenungguVerifikasi),
		ToStatus:   string(StatusDiteruskan),
		AuthorName: "Administrator Pusat",
		Note:       note,
		CreatedAt:  time.Now(),
	})
	iss.UpdatedAt = time.Now()
	return nil
}

func (r *repository) ListVerificationQueue(ctx context.Context) ([]Issue, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []Issue
	for _, iss := range r.issues {
		if iss.Status == StatusMenungguVerifikasi || iss.Status == StatusDialihkan {
			list = append(list, *iss)
		}
	}
	return list, nil
}
