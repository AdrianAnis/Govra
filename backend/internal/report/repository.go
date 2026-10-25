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
	return &repository{
		db:      database,
		reports: make(map[string]*Report),
	}
}

func (r *repository) SaveReport(ctx context.Context, report *Report) error {
	if report.ID == "" {
		report.ID = uuid.New().String()
	}
	report.CreatedAt = time.Now()
	report.UpdatedAt = time.Now()

	if r.db != nil && r.db.Pool != nil {
		query := `INSERT INTO app.reports (id, code, reporter_id, title, description, voice_note_url, voice_note_transcript, lat, lng, address_detail, visibility, status, district_id, village_id, opd_id, category_id, created_at, updated_at) 
		          VALUES ($1, $2, NULLIF($3,'')::uuid, $4, $5, $6, $7, $8, $9, $10, $11, $12, NULLIF($13,'')::uuid, NULLIF($14,'')::uuid, NULLIF($15,'')::uuid, NULLIF($16,'')::uuid, $17, $18)`
		_, err := r.db.Pool.Exec(ctx, query, report.ID, report.Code, report.ReporterID, report.Title, report.Description, report.VoiceNoteURL, report.VoiceNoteTranscript, report.Lat, report.Lng, report.AddressDetail, string(report.Visibility), string(report.Status), report.DistrictID, report.VillageID, report.OpdID, report.CategoryID, report.CreatedAt, report.UpdatedAt)
		if err != nil {
			return err
		}
		for _, att := range report.Attachments {
			_, _ = r.db.Pool.Exec(ctx, `INSERT INTO app.report_attachments (id, report_id, file_url, mime_type, file_size, is_public_ok, is_cover, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, now())`, uuid.New().String(), report.ID, att.FileURL, att.MimeType, att.FileSize, att.PublicOK, att.IsCover)
		}
		return nil
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.reports[report.Code] = report
	return nil
}

func (r *repository) GetReportByCode(ctx context.Context, code string) (*Report, error) {
	if r.db != nil && r.db.Pool != nil {
		query := `SELECT r.id, r.code, COALESCE(r.reporter_id::text,''), COALESCE(p.display_name,'Warga'), 
		          COALESCE(r.issue_id::text,''), COALESCE(r.opd_id::text,''), COALESCE(o.name,''), 
		          COALESCE(r.category_id::text,''), COALESCE(c.name,''), 
		          COALESCE(r.district_id::text,''), COALESCE(d.name,''), 
		          COALESCE(r.village_id::text,''), COALESCE(v.name,''), 
		          COALESCE(r.title,''), r.description, COALESCE(r.voice_note_url,''), COALESCE(r.voice_note_transcript,''), 
		          r.lat, r.lng, COALESCE(r.address_detail,''), r.visibility, r.status, r.created_at, r.updated_at 
		          FROM app.reports r 
		          LEFT JOIN app.profiles p ON r.reporter_id = p.id 
		          LEFT JOIN app.opds o ON r.opd_id = o.id 
		          LEFT JOIN app.categories c ON r.category_id = c.id 
		          LEFT JOIN app.districts d ON r.district_id = d.id 
		          LEFT JOIN app.villages v ON r.village_id = v.id 
		          WHERE r.code = $1`
		var rep Report
		var visStr, statusStr string
		err := r.db.Pool.QueryRow(ctx, query, code).Scan(&rep.ID, &rep.Code, &rep.ReporterID, &rep.ReporterName, &rep.IssueID, &rep.OpdID, &rep.OpdName, &rep.CategoryID, &rep.CategoryName, &rep.DistrictID, &rep.DistrictName, &rep.VillageID, &rep.VillageName, &rep.Title, &rep.Description, &rep.VoiceNoteURL, &rep.VoiceNoteTranscript, &rep.Lat, &rep.Lng, &rep.AddressDetail, &visStr, &statusStr, &rep.CreatedAt, &rep.UpdatedAt)
		if err == nil {
			rep.Visibility = Visibility(visStr)
			rep.Status = ReportStatus(statusStr)
			aRows, aErr := r.db.Pool.Query(ctx, `SELECT id, file_url, mime_type, file_size, is_cover, is_public_ok FROM app.report_attachments WHERE report_id = $1`, rep.ID)
			if aErr == nil {
				for aRows.Next() {
					var att Attachment
					if err := aRows.Scan(&att.ID, &att.FileURL, &att.MimeType, &att.FileSize, &att.IsCover, &att.PublicOK); err == nil {
						rep.Attachments = append(rep.Attachments, att)
					}
				}
				aRows.Close()
			}
			rep.Timeline = append(rep.Timeline, TimelineEvent{
				Status:    string(rep.Status),
				Title:     "Laporan " + string(rep.Status),
				CreatedAt: rep.CreatedAt,
			})
			return &rep, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	report, ok := r.reports[code]
	if !ok {
		return nil, errors.New("laporan tidak ditemukan")
	}
	return report, nil
}

func (r *repository) ListReportsByReporter(ctx context.Context, reporterID string) ([]Report, error) {
	if r.db != nil && r.db.Pool != nil {
		query := `SELECT r.id, r.code, COALESCE(r.title,''), r.description, r.visibility, r.status, r.created_at, r.updated_at 
		          FROM app.reports r WHERE r.reporter_id = $1::uuid ORDER BY r.created_at DESC`
		rows, err := r.db.Pool.Query(ctx, query, reporterID)
		if err == nil {
			defer rows.Close()
			var list []Report
			for rows.Next() {
				var rep Report
				var visStr, statusStr string
				if err := rows.Scan(&rep.ID, &rep.Code, &rep.Title, &rep.Description, &visStr, &statusStr, &rep.CreatedAt, &rep.UpdatedAt); err == nil {
					rep.Visibility = Visibility(visStr)
					rep.Status = ReportStatus(statusStr)
					list = append(list, rep)
				}
			}
			return list, nil
		}
	}

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
	if r.db != nil && r.db.Pool != nil {
		query := `SELECT r.id, r.code, COALESCE(r.title,''), r.description, r.lat, r.lng, COALESCE(r.district_id::text,''), r.status 
		          FROM app.reports r ORDER BY r.created_at DESC LIMIT 50`
		rows, err := r.db.Pool.Query(ctx, query)
		if err == nil {
			defer rows.Close()
			var list []Report
			for rows.Next() {
				var rep Report
				var statusStr string
				if err := rows.Scan(&rep.ID, &rep.Code, &rep.Title, &rep.Description, &rep.Lat, &rep.Lng, &rep.DistrictID, &statusStr); err == nil {
					rep.Status = ReportStatus(statusStr)
					list = append(list, rep)
				}
			}
			return list, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []Report
	for _, rep := range r.reports {
		list = append(list, *rep)
	}
	return list, nil
}

func (r *repository) UpdateReportStatus(ctx context.Context, code string, status ReportStatus, note string) error {
	if r.db != nil && r.db.Pool != nil {
		query := `UPDATE app.reports SET status = $2, updated_at = now() WHERE code = $1`
		_, err := r.db.Pool.Exec(ctx, query, code, string(status))
		return err
	}

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
	if r.db != nil && r.db.Pool != nil {
		newStatus := "SELESAI"
		if !confirmed {
			newStatus = "DIBUKA_ULANG"
		}
		_, err := r.db.Pool.Exec(ctx, `UPDATE app.reports SET status = $2, updated_at = now() WHERE code = $1`, code, newStatus)
		return err
	}

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
