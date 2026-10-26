package report

import (
	"context"
	"errors"
	"fmt"
	"net/url"
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

	if r.db != nil && r.db.HasREST() {
		type restReport struct {
			ID                  string  `json:"id"`
			Code                string  `json:"code"`
			ReporterID          *string `json:"reporter_id,omitempty"`
			Title               string  `json:"title"`
			Description         string  `json:"description"`
			VoiceNoteTranscript string  `json:"voice_note_transcript,omitempty"`
			Lat                 float64 `json:"lat"`
			Lng                 float64 `json:"lng"`
			AddressDetail       string  `json:"address_detail,omitempty"`
			Visibility          string  `json:"visibility"`
			Status              string  `json:"status"`
			DistrictID          *string `json:"district_id,omitempty"`
			VillageID           *string `json:"village_id,omitempty"`
			OpdID               *string `json:"opd_id,omitempty"`
			CategoryID          *string `json:"category_id,omitempty"`
		}
		vis := string(report.Visibility)
		if vis == "PUBLIK" {
			vis = "PUBLIC"
		} else if vis == "RAHASIA" {
			vis = "CONFIDENTIAL"
		}
		rr := restReport{
			ID:                  report.ID,
			Code:                report.Code,
			Title:               report.Title,
			Description:         report.Description,
			VoiceNoteTranscript: report.VoiceNoteTranscript,
			Lat:                 report.Lat,
			Lng:                 report.Lng,
			AddressDetail:       report.AddressDetail,
			Visibility:          vis,
			Status:              string(report.Status),
		}
		if _, err := uuid.Parse(report.ReporterID); err == nil {
			rr.ReporterID = &report.ReporterID
		}
		if _, err := uuid.Parse(report.DistrictID); err == nil {
			rr.DistrictID = &report.DistrictID
		}
		if _, err := uuid.Parse(report.VillageID); err == nil {
			rr.VillageID = &report.VillageID
		}
		if _, err := uuid.Parse(report.OpdID); err == nil {
			rr.OpdID = &report.OpdID
		}
		if _, err := uuid.Parse(report.CategoryID); err == nil {
			rr.CategoryID = &report.CategoryID
		}
		if err := r.db.PostgRESTPost(ctx, "reports", rr, nil); err == nil {
			fmt.Printf("[REPORT DB SUCCESS] Report saved to Supabase: %s\n", report.Code)
		} else {
			fmt.Printf("[REPORT DB ERROR] Failed to save report to Supabase: %v\n", err)
		}
		for _, att := range report.Attachments {
			fileURL := att.FileURL
			if fileURL == "" {
				fileURL = att.URL
			}
			if fileURL == "" {
				continue
			}
			attID := att.ID
			if attID == "" {
				attID = uuid.New().String()
			}
			mimeType := att.MimeType
			if mimeType == "" {
				mimeType = att.Mime
			}
			if mimeType == "" {
				mimeType = "image/jpeg"
			}
			fileSize := att.FileSize
			if fileSize == 0 {
				fileSize = att.SizeBytes
			}
			type restAttachment struct {
				ID         string `json:"id"`
				ReportID   string `json:"report_id"`
				FileURL    string `json:"file_url"`
				MimeType   string `json:"mime_type"`
				FileSize   int64  `json:"file_size"`
				IsPublicOk bool   `json:"is_public_ok"`
				IsCover    bool   `json:"is_cover"`
			}
			_ = r.db.PostgRESTPost(ctx, "report_attachments", restAttachment{
				ID:         attID,
				ReportID:   report.ID,
				FileURL:    fileURL,
				MimeType:   mimeType,
				FileSize:   fileSize,
				IsPublicOk: att.PublicOK,
				IsCover:    att.IsCover,
			}, nil)
		}
	}

	if r.db != nil && r.db.Pool != nil {
		query := `INSERT INTO app.reports (id, code, reporter_id, title, description, voice_note_url, voice_note_transcript, lat, lng, address_detail, visibility, status, district_id, village_id, opd_id, category_id, created_at, updated_at) 
		          VALUES ($1, $2, NULLIF($3,'')::uuid, $4, $5, $6, $7, $8, $9, $10, $11, $12, NULLIF($13,'')::uuid, NULLIF($14,'')::uuid, NULLIF($15,'')::uuid, NULLIF($16,'')::uuid, $17, $18)`
		_, _ = r.db.Pool.Exec(ctx, query, report.ID, report.Code, report.ReporterID, report.Title, report.Description, report.VoiceNoteURL, report.VoiceNoteTranscript, report.Lat, report.Lng, report.AddressDetail, string(report.Visibility), string(report.Status), report.DistrictID, report.VillageID, report.OpdID, report.CategoryID, report.CreatedAt, report.UpdatedAt)
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.reports[report.Code] = report
	return nil
}

func (r *repository) GetReportByCode(ctx context.Context, code string) (*Report, error) {
	if r.db != nil && r.db.HasREST() {
		var list []struct {
			ID                  string    `json:"id"`
			Code                string    `json:"code"`
			ReporterID          *string   `json:"reporter_id"`
			Title               string    `json:"title"`
			Description         string    `json:"description"`
			VoiceNoteTranscript *string   `json:"voice_note_transcript"`
			Lat                 float64   `json:"lat"`
			Lng                 float64   `json:"lng"`
			AddressDetail       *string   `json:"address_detail"`
			Visibility          string    `json:"visibility"`
			Status              string    `json:"status"`
			DistrictID          *string   `json:"district_id"`
			VillageID           *string   `json:"village_id"`
			OpdID               *string   `json:"opd_id"`
			CategoryID          *string   `json:"category_id"`
			CreatedAt           time.Time `json:"created_at"`
			UpdatedAt           time.Time `json:"updated_at"`
		}
		endpoint := fmt.Sprintf("reports?code=eq.%s&limit=1", url.QueryEscape(code))
		if err := r.db.PostgRESTGet(ctx, endpoint, &list); err == nil && len(list) > 0 {
			item := list[0]
			vis := VisibilityPublic
			if item.Visibility == "CONFIDENTIAL" || item.Visibility == "RAHASIA" {
				vis = VisibilityConfidential
			}
			rep := &Report{
				ID:          item.ID,
				Code:        item.Code,
				Title:       item.Title,
				Description: item.Description,
				Lat:         item.Lat,
				Lng:         item.Lng,
				Visibility:  vis,
				Status:      ReportStatus(item.Status),
				CreatedAt:   item.CreatedAt,
				UpdatedAt:   item.UpdatedAt,
				Timeline: []TimelineEvent{
					{
						Status:    item.Status,
						Title:     "Laporan " + item.Status,
						CreatedAt: item.CreatedAt,
					},
				},
			}
			if item.ReporterID != nil {
				rep.ReporterID = *item.ReporterID
			}
			if item.VoiceNoteTranscript != nil {
				rep.VoiceNoteTranscript = *item.VoiceNoteTranscript
			}
			if item.AddressDetail != nil {
				rep.AddressDetail = *item.AddressDetail
			}
			if item.DistrictID != nil {
				rep.DistrictID = *item.DistrictID
			}
			if item.VillageID != nil {
				rep.VillageID = *item.VillageID
			}
			if item.OpdID != nil {
				rep.OpdID = *item.OpdID
			}
			if item.CategoryID != nil {
				rep.CategoryID = *item.CategoryID
			}
			if item.DistrictID != nil && *item.DistrictID != "" {
				rep.DistrictID = *item.DistrictID
				var dList []struct {
					Name string `json:"name"`
				}
				if err := r.db.PostgRESTGet(ctx, fmt.Sprintf("districts?id=eq.%s&limit=1", url.QueryEscape(*item.DistrictID)), &dList); err == nil && len(dList) > 0 {
					rep.DistrictName = dList[0].Name
				}
			}
			if item.VillageID != nil && *item.VillageID != "" {
				rep.VillageID = *item.VillageID
				var vList []struct {
					Name string `json:"name"`
				}
				if err := r.db.PostgRESTGet(ctx, fmt.Sprintf("villages?id=eq.%s&limit=1", url.QueryEscape(*item.VillageID)), &vList); err == nil && len(vList) > 0 {
					rep.VillageName = vList[0].Name
				}
			}
			var attList []struct {
				ID         string `json:"id"`
				ReportID   string `json:"report_id"`
				FileURL    string `json:"file_url"`
				MimeType   string `json:"mime_type"`
				FileSize   int64  `json:"file_size"`
				IsPublicOk bool   `json:"is_public_ok"`
				IsCover    bool   `json:"is_cover"`
			}
			attEndpoint := fmt.Sprintf("report_attachments?report_id=eq.%s", url.QueryEscape(item.ID))
			if err := r.db.PostgRESTGet(ctx, attEndpoint, &attList); err == nil {
				for _, a := range attList {
					rep.Attachments = append(rep.Attachments, Attachment{
						ID:        a.ID,
						FileURL:   a.FileURL,
						URL:       a.FileURL,
						MimeType:  a.MimeType,
						Mime:      a.MimeType,
						FileSize:  a.FileSize,
						SizeBytes: a.FileSize,
						PublicOK:  a.IsPublicOk,
						IsCover:   a.IsCover,
					})
				}
			}
			return rep, nil
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
	if r.db != nil && r.db.HasREST() {
		var list []struct {
			ID                  string    `json:"id"`
			Code                string    `json:"code"`
			ReporterID          *string   `json:"reporter_id"`
			Title               string    `json:"title"`
			Description         string    `json:"description"`
			VoiceNoteTranscript *string   `json:"voice_note_transcript"`
			Lat                 float64   `json:"lat"`
			Lng                 float64   `json:"lng"`
			AddressDetail       *string   `json:"address_detail"`
			Visibility          string    `json:"visibility"`
			Status              string    `json:"status"`
			CreatedAt           time.Time `json:"created_at"`
			UpdatedAt           time.Time `json:"updated_at"`
		}
		endpoint := "reports?order=created_at.desc"
		if reporterID != "" && reporterID != "bff-trusted" {
			endpoint = fmt.Sprintf("reports?reporter_id=eq.%s&order=created_at.desc", url.QueryEscape(reporterID))
		}
		if err := r.db.PostgRESTGet(ctx, endpoint, &list); err == nil {
			var result []Report
			for _, item := range list {
				vis := VisibilityPublic
				if item.Visibility == "CONFIDENTIAL" || item.Visibility == "RAHASIA" {
					vis = VisibilityConfidential
				}
				rep := Report{
					ID:          item.ID,
					Code:        item.Code,
					Title:       item.Title,
					Description: item.Description,
					Lat:         item.Lat,
					Lng:         item.Lng,
					Visibility:  vis,
					Status:      ReportStatus(item.Status),
					CreatedAt:   item.CreatedAt,
					UpdatedAt:   item.UpdatedAt,
				}
				if item.ReporterID != nil {
					rep.ReporterID = *item.ReporterID
				}
				if item.VoiceNoteTranscript != nil {
					rep.VoiceNoteTranscript = *item.VoiceNoteTranscript
				}
				if item.AddressDetail != nil {
					rep.AddressDetail = *item.AddressDetail
				}
				result = append(result, rep)
			}
			return result, nil
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
	if r.db != nil && r.db.HasREST() {
		var list []struct {
			ID          string  `json:"id"`
			Code        string  `json:"code"`
			Title       string  `json:"title"`
			Description string  `json:"description"`
			Lat         float64 `json:"lat"`
			Lng         float64 `json:"lng"`
			DistrictID  *string `json:"district_id"`
			Status      string  `json:"status"`
		}
		endpoint := "reports?order=created_at.desc&limit=50"
		if err := r.db.PostgRESTGet(ctx, endpoint, &list); err == nil {
			var result []Report
			for _, item := range list {
				rep := Report{
					ID:          item.ID,
					Code:        item.Code,
					Title:       item.Title,
					Description: item.Description,
					Lat:         item.Lat,
					Lng:         item.Lng,
					Status:      ReportStatus(item.Status),
				}
				if item.DistrictID != nil {
					rep.DistrictID = *item.DistrictID
				}
				result = append(result, rep)
			}
			return result, nil
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
	if r.db != nil && r.db.HasREST() {
		endpoint := fmt.Sprintf("reports?code=eq.%s", url.QueryEscape(code))
		_ = r.db.PostgRESTPatch(ctx, endpoint, map[string]any{"status": string(status)})
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
	newStatus := "SELESAI"
	if !confirmed {
		newStatus = "DIBUKA_ULANG"
	}
	if r.db != nil && r.db.HasREST() {
		endpoint := fmt.Sprintf("reports?code=eq.%s", url.QueryEscape(code))
		_ = r.db.PostgRESTPatch(ctx, endpoint, map[string]any{"status": newStatus})
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
