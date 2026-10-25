package report

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
	"govra/internal/platform/db"
)

type Repository interface {
	SaveReport(ctx context.Context, r *Report) error
	GetReportByCode(ctx context.Context, code string) (*Report, error)
	ListReportsByReporter(ctx context.Context, reporterID string) ([]Report, error)
	ListOpenReports(ctx context.Context) ([]Report, error)
	UpdateReportStatus(ctx context.Context, code string, status ReportStatus, note string) error
	SaveFeedback(ctx context.Context, code string, confirmed bool, note string) error
}

type repository struct {
	db      *db.Database
	mu      sync.RWMutex
	reports map[string]*Report
}

func NewRepository(database *db.Database) Repository {
	r := &repository{
		db:      database,
		reports: make(map[string]*Report),
	}
	r.seedReports()
	return r
}

func (r *repository) seedReports() {
	sample := &Report{
		ID:           "r0000000-0000-0000-0000-000000000001",
		Code:         "GVR-2610-8F3K",
		ReporterID:   "u0000000-0000-0000-0000-000000000003",
		ReporterName: "Budi Santoso",
		OpdID:        "e0000000-0000-0000-0000-000000000001",
		OpdName:      "Dinas Bina Marga & SDA",
		DistrictID:   "b0000000-0000-0000-0000-000000000001",
		DistrictName: "Kecamatan Tengah",
		VillageID:    "c0000000-0000-0000-0000-000000000001",
		VillageName:  "Kelurahan Gambir",
		Title:        "Jalan Berlubang di Depan Balai Kota",
		Description:  "Terdapat lubang berdiameter 60 cm cukup dalam yang membahayakan pengendara motor saat hujan.",
		Lat:          -6.1950,
		Lng:          106.8350,
		Visibility:   VisibilityPublic,
		Status:       StatusDiproses,
		Attachments: []Attachment{
			{
				ID:       "att-1",
				FileURL:  "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
				MimeType: "image/jpeg",
				FileSize: 1048576,
				IsCover:  true,
				PublicOK: true,
			},
		},
		Timeline: []TimelineEvent{
			{Status: "DIAJUKAN", Title: "Laporan Diajukan", Note: "Laporan berhasil diterima oleh sistem", CreatedAt: time.Now().Add(-24 * time.Hour)},
			{Status: "DITERUSKAN", Title: "Diteruskan ke Dinas Bina Marga & SDA", Note: "Hasil klasifikasi otomatis AI", CreatedAt: time.Now().Add(-20 * time.Hour)},
			{Status: "DIPROSES", Title: "Sedang Ditangani oleh Tim Reaksi Cepat", Note: "Material aspal hotmix sedang dimobilisasi ke lokasi", CreatedAt: time.Now().Add(-2 * time.Hour)},
		},
		CreatedAt: time.Now().Add(-24 * time.Hour),
		UpdatedAt: time.Now().Add(-2 * time.Hour),
	}
	r.reports[sample.Code] = sample
}

func (r *repository) SaveReport(ctx context.Context, report *Report) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if report.ID == "" {
		report.ID = uuid.New().String()
	}
	report.CreatedAt = time.Now()
	report.UpdatedAt = time.Now()
	r.reports[report.Code] = report
	return nil
}

func (r *repository) GetReportByCode(ctx context.Context, code string) (*Report, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	report, ok := r.reports[code]
	if !ok {
		return nil, errors.New("laporan tidak ditemukan")
	}
	return report, nil
}

func (r *repository) ListReportsByReporter(ctx context.Context, reporterID string) ([]Report, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []Report
	for _, rep := range r.reports {
		if rep.ReporterID == reporterID {
			list = append(list, *rep)
		}
	}
	return list, nil
}

func (r *repository) ListOpenReports(ctx context.Context) ([]Report, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []Report
	for _, rep := range r.reports {
		list = append(list, *rep)
	}
	return list, nil
}

func (r *repository) UpdateReportStatus(ctx context.Context, code string, status ReportStatus, note string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	rep, ok := r.reports[code]
	if !ok {
		return errors.New("laporan tidak ditemukan")
	}
	rep.Status = status
	rep.UpdatedAt = time.Now()
	rep.Timeline = append(rep.Timeline, TimelineEvent{
		Status:    string(status),
		Title:     "Status diubah menjadi " + string(status),
		Note:      note,
		CreatedAt: time.Now(),
	})
	return nil
}

func (r *repository) SaveFeedback(ctx context.Context, code string, confirmed bool, note string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	rep, ok := r.reports[code]
	if !ok {
		return errors.New("laporan tidak ditemukan")
	}
	statusStr := "DIBUKA_ULANG"
	title := "Penyelesaian Disanggah oleh Warga"
	if confirmed {
		statusStr = "SELESAI"
		title = "Penyelesaian Dikonfirmasi oleh Warga"
	}
	rep.Timeline = append(rep.Timeline, TimelineEvent{
		Status:    statusStr,
		Title:     title,
		Note:      note,
		CreatedAt: time.Now(),
	})
	return nil
}
