package issue

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"strings"
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
	RejectIssue(ctx context.Context, issueID string, req RejectIssueRequest) error
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
	if database == nil || database.Pool == nil {
		r.issues["i0000000-0000-0000-0000-000000000001"] = &Issue{
			ID:                   "i0000000-0000-0000-0000-000000000001",
			Code:                 "ISU-2026-0001",
			Title:                "Jalan Berlubang di Jl. Sudirman",
			Summary:              "Lubang sedalam 15cm membahayakan pengendara motor",
			OpdID:                "e0000000-0000-0000-0000-000000000001",
			OpdName:              "Dinas Bina Marga & SDA",
			CategoryID:           "f0000000-0000-0000-0000-000000000001",
			CategoryName:         "Jalan & Jembatan",
			DistrictID:           "b0000000-0000-0000-0000-000000000001",
			DistrictName:         "Kecamatan Pusat",
			VillageID:            "c0000000-0000-0000-0000-000000000001",
			VillageName:          "Kelurahan Melati",
			Point:                LocationPoint{Lat: -6.2088, Lng: 106.8456},
			AddressDetail:        "Depan Gedung Graha Mandiri",
			Status:               StatusDiteruskan,
			Urgency:              UrgencyTinggi,
			SafetyRisk:           "sedang",
			UniqueReportersCount: 5,
			SlaDueAt:             time.Now().Add(24 * time.Hour),
			CreatedAt:            time.Now().Add(-12 * time.Hour),
			UpdatedAt:            time.Now().Add(-1 * time.Hour),
		}
		r.issues["i0000000-0000-0000-0000-000000000002"] = &Issue{
			ID:                   "i0000000-0000-0000-0000-000000000002",
			Code:                 "ISU-2026-0002",
			Title:                "Tumpukan Sampah Liar di Bantaran Sungai",
			Summary:              "Sampah menumpuk berbau menyengat",
			Status:               StatusMenungguVerifikasi,
			Urgency:              UrgencyNormal,
			CreatedAt:            time.Now().Add(-2 * time.Hour),
			UpdatedAt:            time.Now().Add(-2 * time.Hour),
		}
	}
	return r
}

func (r *repository) ListIssues(ctx context.Context, opdID, status, q string) ([]Issue, error) {
	if r.db != nil && r.db.HasREST() {
		opdNames := map[string]string{
			"e0000000-0000-0000-0000-000000000001": "Dinas Bina Marga & SDA",
			"e0000000-0000-0000-0000-000000000002": "Dinas Lingkungan Hidup & Kebersihan",
			"e0000000-0000-0000-0000-000000000003": "Dinas Perhubungan",
			"e0000000-0000-0000-0000-000000000004": "Dinas Kesehatan",
			"e0000000-0000-0000-0000-000000000005": "Satuan Polisi Pamong Praja",
			"e0000000-0000-0000-0000-000000000006": "Badan Penanggulangan Bencana Daerah",
			"e0000000-0000-0000-0000-000000000007": "Dinas PUPR",
		}

		var reports []struct {
			ID            string    `json:"id"`
			Code          string    `json:"code"`
			Title         string    `json:"title"`
			Description   string    `json:"description"`
			Status        string    `json:"status"`
			OpdID         *string   `json:"opd_id"`
			Lat           float64   `json:"lat"`
			Lng           float64   `json:"lng"`
			AddressDetail string    `json:"address_detail"`
			CreatedAt     time.Time `json:"created_at"`
		}
		_ = r.db.PostgRESTGet(ctx, "reports?order=created_at.desc", &reports)

		var attachments []struct {
			ReportID string `json:"report_id"`
			FileURL  string `json:"file_url"`
		}
		_ = r.db.PostgRESTGet(ctx, "report_attachments?limit=500", &attachments)
		photosByReport := make(map[string]string)
		for _, a := range attachments {
			if a.FileURL != "" && photosByReport[a.ReportID] == "" {
				photosByReport[a.ReportID] = a.FileURL
			}
		}

		var list []Issue
		for _, rep := range reports {
			opdStr := ""
			opdNameStr := ""
			if rep.OpdID != nil {
				opdStr = *rep.OpdID
				opdNameStr = opdNames[*rep.OpdID]
			}
			if opdID != "" && opdStr != opdID {
				continue
			}
			if status != "" && rep.Status != status {
				continue
			}
			if q != "" {
				lowerQ := strings.ToLower(q)
				if !strings.Contains(strings.ToLower(rep.Title), lowerQ) &&
					!strings.Contains(strings.ToLower(rep.AddressDetail), lowerQ) &&
					!strings.Contains(strings.ToLower(rep.Code), lowerQ) {
					continue
				}
			}
			iss := Issue{
				ID:                   rep.ID,
				Code:                 rep.Code,
				Title:                rep.Title,
				Summary:              rep.Description,
				OpdID:                opdStr,
				OpdName:              opdNameStr,
				Status:               IssueStatus(rep.Status),
				Urgency:              UrgencyNormal,
				Point:                LocationPoint{Lat: rep.Lat, Lng: rep.Lng},
				AddressDetail:        rep.AddressDetail,
				CoverPhotoURL:        photosByReport[rep.ID],
				UniqueReportersCount: 1,
				CreatedAt:            rep.CreatedAt,
				UpdatedAt:            rep.CreatedAt,
			}
			list = append(list, iss)
		}
		return list, nil
	}

	if r.db != nil && r.db.Pool != nil {
		query := `SELECT i.id, i.code, i.title, COALESCE(i.summary,''), 
		          COALESCE(i.opd_id::text,''), COALESCE(o.name,''), 
		          COALESCE(i.category_id::text,''), COALESCE(c.name,''), 
		          COALESCE(i.district_id::text,''), COALESCE(d.name,''), 
		          COALESCE(i.village_id::text,''), COALESCE(v.name,''), 
		          i.center_lat, i.center_lng, COALESCE(i.address_detail,''), 
		          i.status, i.urgency, i.safety_risk, i.unique_reporters_count, 
		          COALESCE(i.sla_due_at, now()), COALESCE(i.cover_photo_url,''), i.created_at, i.updated_at 
		          FROM app.issues i 
		          LEFT JOIN app.opds o ON i.opd_id = o.id 
		          LEFT JOIN app.categories c ON i.category_id = c.id 
		          LEFT JOIN app.districts d ON i.district_id = d.id 
		          LEFT JOIN app.villages v ON i.village_id = v.id 
		          ORDER BY i.created_at DESC`
		rows, err := r.db.Pool.Query(ctx, query)
		if err == nil {
			defer rows.Close()
			var list []Issue
			for rows.Next() {
				var iss Issue
				var statusStr, urgencyStr string
				if err := rows.Scan(&iss.ID, &iss.Code, &iss.Title, &iss.Summary, &iss.OpdID, &iss.OpdName, &iss.CategoryID, &iss.CategoryName, &iss.DistrictID, &iss.DistrictName, &iss.VillageID, &iss.VillageName, &iss.Point.Lat, &iss.Point.Lng, &iss.AddressDetail, &statusStr, &urgencyStr, &iss.SafetyRisk, &iss.UniqueReportersCount, &iss.SlaDueAt, &iss.CoverPhotoURL, &iss.CreatedAt, &iss.UpdatedAt); err == nil {
					iss.Status = IssueStatus(statusStr)
					iss.Urgency = Urgency(urgencyStr)
					if opdID != "" && iss.OpdID != opdID {
						continue
					}
					if status != "" && string(iss.Status) != status {
						continue
					}
					list = append(list, iss)
				}
			}
			return list, nil
		}
	}

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
	if r.db != nil && r.db.Pool != nil {
		query := `SELECT i.id, i.code, i.title, COALESCE(i.summary,''), 
		          COALESCE(i.opd_id::text,''), COALESCE(o.name,''), 
		          COALESCE(i.category_id::text,''), COALESCE(c.name,''), 
		          COALESCE(i.district_id::text,''), COALESCE(d.name,''), 
		          COALESCE(i.village_id::text,''), COALESCE(v.name,''), 
		          i.center_lat, i.center_lng, COALESCE(i.address_detail,''), 
		          i.status, i.urgency, i.safety_risk, i.unique_reporters_count, 
		          COALESCE(i.sla_due_at, now()), COALESCE(i.cover_photo_url,''), i.created_at, i.updated_at 
		          FROM app.issues i 
		          LEFT JOIN app.opds o ON i.opd_id = o.id 
		          LEFT JOIN app.categories c ON i.category_id = c.id 
		          LEFT JOIN app.districts d ON i.district_id = d.id 
		          LEFT JOIN app.villages v ON i.village_id = v.id 
		          WHERE i.id = $1 OR i.code = $1`
		var iss Issue
		var statusStr, urgencyStr string
		err := r.db.Pool.QueryRow(ctx, query, id).Scan(&iss.ID, &iss.Code, &iss.Title, &iss.Summary, &iss.OpdID, &iss.OpdName, &iss.CategoryID, &iss.CategoryName, &iss.DistrictID, &iss.DistrictName, &iss.VillageID, &iss.VillageName, &iss.Point.Lat, &iss.Point.Lng, &iss.AddressDetail, &statusStr, &urgencyStr, &iss.SafetyRisk, &iss.UniqueReportersCount, &iss.SlaDueAt, &iss.CoverPhotoURL, &iss.CreatedAt, &iss.UpdatedAt)
		if err == nil {
			iss.Status = IssueStatus(statusStr)
			iss.Urgency = Urgency(urgencyStr)

			eRows, eErr := r.db.Pool.Query(ctx, `SELECT e.id, COALESCE(e.from_status,''), e.to_status, COALESCE(p.display_name, 'Sistem'), COALESCE(e.note,''), e.evidence_photos, e.created_at FROM app.issue_events e LEFT JOIN app.profiles p ON e.author_id = p.id WHERE e.issue_id = $1 ORDER BY e.created_at ASC`, iss.ID)
			if eErr == nil {
				for eRows.Next() {
					var evt IssueEvent
					var evPhotosJSON []byte
					if err := eRows.Scan(&evt.ID, &evt.FromStatus, &evt.ToStatus, &evt.AuthorName, &evt.Note, &evPhotosJSON, &evt.CreatedAt); err == nil {
						_ = json.Unmarshal(evPhotosJSON, &evt.EvidencePhotos)
						iss.Events = append(iss.Events, evt)
					}
				}
				eRows.Close()
			}
			return &iss, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	iss, ok := r.issues[id]
	if !ok {
		return nil, errors.New("isu tidak ditemukan")
	}
	return iss, nil
}

func (r *repository) SaveIssue(ctx context.Context, iss *Issue) error {
	if iss.ID == "" {
		iss.ID = uuid.New().String()
	}
	iss.CreatedAt = time.Now()
	iss.UpdatedAt = time.Now()

	if r.db != nil && r.db.Pool != nil {
		query := `INSERT INTO app.issues (id, code, title, summary, opd_id, category_id, district_id, village_id, center_lat, center_lng, address_detail, status, urgency, safety_risk, unique_reporters_count, sla_due_at, cover_photo_url, created_at, updated_at) 
		          VALUES ($1, $2, $3, $4, NULLIF($5,'')::uuid, NULLIF($6,'')::uuid, NULLIF($7,'')::uuid, NULLIF($8,'')::uuid, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`
		_, err := r.db.Pool.Exec(ctx, query, iss.ID, iss.Code, iss.Title, iss.Summary, iss.OpdID, iss.CategoryID, iss.DistrictID, iss.VillageID, iss.Point.Lat, iss.Point.Lng, iss.AddressDetail, string(iss.Status), string(iss.Urgency), iss.SafetyRisk, iss.UniqueReportersCount, iss.SlaDueAt, iss.CoverPhotoURL, iss.CreatedAt, iss.UpdatedAt)
		return err
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.issues[iss.ID] = iss
	return nil
}

func (r *repository) SupportIssue(ctx context.Context, issueID, userID string) (int, error) {
	if r.db != nil && r.db.Pool != nil {
		_, _ = r.db.Pool.Exec(ctx, `INSERT INTO app.issue_supports (id, issue_id, user_id, created_at) VALUES ($1, $2, $3, now()) ON CONFLICT (issue_id, user_id) DO NOTHING`, uuid.New().String(), issueID, userID)
		var count int
		err := r.db.Pool.QueryRow(ctx, `SELECT count(*) FROM app.issue_supports WHERE issue_id = $1`, issueID).Scan(&count)
		if err == nil {
			_, _ = r.db.Pool.Exec(ctx, `UPDATE app.issues SET unique_reporters_count = $1, updated_at = now() WHERE id = $2`, count, issueID)
			return count, nil
		}
	}

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
	if evt.ID == "" {
		evt.ID = uuid.New().String()
	}
	evt.CreatedAt = time.Now()

	if r.db != nil && r.db.Pool != nil {
		photosJSON, _ := json.Marshal(evt.EvidencePhotos)
		_, err := r.db.Pool.Exec(ctx, `INSERT INTO app.issue_events (id, issue_id, from_status, to_status, note, evidence_photos, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`, evt.ID, issueID, evt.FromStatus, evt.ToStatus, evt.Note, photosJSON, evt.CreatedAt)
		return err
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	iss, ok := r.issues[issueID]
	if !ok {
		return errors.New("isu tidak ditemukan")
	}
	iss.Events = append(iss.Events, evt)
	iss.UpdatedAt = time.Now()
	return nil
}

func (r *repository) UpdateStatus(ctx context.Context, issueID string, status IssueStatus, coverPhoto string) error {
	if r.db != nil && r.db.Pool != nil {
		query := `UPDATE app.issues SET status = $2, cover_photo_url = COALESCE(NULLIF($3, ''), cover_photo_url), updated_at = now() WHERE id = $1`
		_, err := r.db.Pool.Exec(ctx, query, issueID, string(status), coverPhoto)
		return err
	}

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
	opdUUIDs := map[string]string{
		"DBM-SDA": "e0000000-0000-0000-0000-000000000001",
		"DLHK":    "e0000000-0000-0000-0000-000000000002",
		"DISHUB":  "e0000000-0000-0000-0000-000000000003",
		"DINKES":  "e0000000-0000-0000-0000-000000000004",
		"PUPR":    "e0000000-0000-0000-0000-000000000007",
	}
	targetOpdUUID := opdID
	if mapped, ok := opdUUIDs[opdID]; ok {
		targetOpdUUID = mapped
	}

	catUUIDs := map[string]string{
		"JALAN-RUSAK":          "f0000000-0000-0000-0000-000000000001",
		"DRAINASE-TERSUMBAT":   "f0000000-0000-0000-0000-000000000002",
		"SAMPAH-LIAR":          "f0000000-0000-0000-0000-000000000003",
		"LAMPU-JALAN":          "f0000000-0000-0000-0000-000000000004",
		"RAMBU-RUSAK":          "f0000000-0000-0000-0000-000000000005",
		"INFRASTRUKTUR-GEDUNG": "f0000000-0000-0000-0000-000000000006",
		"FASILITAS-KESEHATAN":  "f0000000-0000-0000-0000-000000000007",
	}
	targetCatUUID := categoryID
	if mapped, ok := catUUIDs[categoryID]; ok {
		targetCatUUID = mapped
	}

	if r.db != nil && r.db.HasREST() {
		patchPayload := map[string]any{
			"status":     "DITERUSKAN",
			"updated_at": time.Now(),
		}
		if _, err := uuid.Parse(targetOpdUUID); err == nil {
			patchPayload["opd_id"] = targetOpdUUID
		}
		if _, err := uuid.Parse(targetCatUUID); err == nil {
			patchPayload["category_id"] = targetCatUUID
		}

		var existingReport []struct {
			ID          string  `json:"id"`
			Code        string  `json:"code"`
			Title       string  `json:"title"`
			Description string  `json:"description"`
			IssueID     *string `json:"issue_id"`
			DistrictID  *string `json:"district_id"`
			VillageID   *string `json:"village_id"`
			Lat         float64 `json:"lat"`
			Lng         float64 `json:"lng"`
		}
		_ = r.db.PostgRESTGet(ctx, fmt.Sprintf("reports?id=eq.%s", url.QueryEscape(issueID)), &existingReport)

		realIssueID := issueID
		if len(existingReport) > 0 {
			rep := existingReport[0]
			if rep.IssueID != nil && *rep.IssueID != "" {
				realIssueID = *rep.IssueID
			} else {
				newIssueID := uuid.New().String()
				issueCode := "ISU-" + strings.ToUpper(rep.Code)
				if len(rep.Code) > 4 && strings.HasPrefix(rep.Code, "GVR-") {
					issueCode = "ISU-" + rep.Code[4:]
				}
				newIssuePayload := map[string]any{
					"id":                     newIssueID,
					"code":                   issueCode,
					"region_id":              "a0000000-0000-0000-0000-000000000001",
					"title":                  rep.Title,
					"summary":                rep.Description,
					"status":                 "DITERUSKAN",
					"urgency":                "NORMAL",
					"safety_risk":            "NONE",
					"unique_reporters_count": 1,
					"center_lat":             rep.Lat,
					"center_lng":             rep.Lng,
					"created_at":             time.Now(),
					"updated_at":             time.Now(),
				}
				if _, err := uuid.Parse(targetOpdUUID); err == nil {
					newIssuePayload["opd_id"] = targetOpdUUID
				}
				if _, err := uuid.Parse(targetCatUUID); err == nil {
					newIssuePayload["category_id"] = targetCatUUID
				}
				if rep.DistrictID != nil {
					newIssuePayload["district_id"] = *rep.DistrictID
				}
				if rep.VillageID != nil {
					newIssuePayload["village_id"] = *rep.VillageID
				}
				_ = r.db.PostgRESTPost(ctx, "issues", newIssuePayload, nil)
				realIssueID = newIssueID
				patchPayload["issue_id"] = newIssueID
			}
		}

		_ = r.db.PostgRESTPatch(ctx, fmt.Sprintf("issues?id=eq.%s", url.QueryEscape(realIssueID)), patchPayload)
		_ = r.db.PostgRESTPatch(ctx, fmt.Sprintf("reports?issue_id=eq.%s", url.QueryEscape(realIssueID)), patchPayload)
		_ = r.db.PostgRESTPatch(ctx, fmt.Sprintf("reports?id=eq.%s", url.QueryEscape(issueID)), patchPayload)

		_ = r.db.PostgRESTPost(ctx, "issue_events", map[string]any{
			"id":          uuid.New().String(),
			"issue_id":    realIssueID,
			"from_status": "MENUNGGU_VERIFIKASI",
			"to_status":   "DITERUSKAN",
			"note":        note,
			"created_at":  time.Now(),
		}, nil)
	}

	if r.db != nil && r.db.Pool != nil {
		query := `UPDATE app.issues SET opd_id = $2::uuid, category_id = NULLIF($3,'')::uuid, status = 'DITERUSKAN', updated_at = now() WHERE id = $1`
		_, _ = r.db.Pool.Exec(ctx, query, issueID, targetOpdUUID, targetCatUUID)
		_, _ = r.db.Pool.Exec(ctx, `UPDATE app.reports SET opd_id = $2::uuid, category_id = NULLIF($3,'')::uuid, status = 'DITERUSKAN', updated_at = now() WHERE issue_id = $1::uuid OR id = $1::uuid`, issueID, targetOpdUUID, targetCatUUID)
		_, _ = r.db.Pool.Exec(ctx, `INSERT INTO app.issue_events (id, issue_id, from_status, to_status, note, created_at) VALUES ($1, $2, 'MENUNGGU_VERIFIKASI', 'DITERUSKAN', $3, now())`, uuid.New().String(), issueID, note)
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	iss, ok := r.issues[issueID]
	if ok {
		iss.OpdID = targetOpdUUID
		iss.CategoryID = targetCatUUID
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
	}
	return nil
}

func (r *repository) RejectIssue(ctx context.Context, issueID string, req RejectIssueRequest) error {
	reasonLabels := map[string]string{
		"DUPLIKAT":             "Duplikat isu lain",
		"DATA_TIDAK_LENGKAP":   "Data tidak lengkap",
		"BUKAN_MASALAH_PUBLIK": "Bukan masalah publik",
		"SUDAH_DITANGANI":      "Sudah ditangani",
		"LAPORAN_TIDAK_BENAR":  "Laporan tidak benar",
	}

	label := reasonLabels[req.Reason]
	if label == "" {
		label = req.Reason
	}
	explanation := req.Explanation
	if explanation == "" {
		explanation = req.Note
	}
	fullReason := label
	if explanation != "" {
		fullReason = label + ": " + explanation
	}

	if r.db != nil && r.db.HasREST() {
		patchPayload := map[string]any{
			"status":      "DITOLAK",
			"hide_reason": fullReason,
			"updated_at":  time.Now(),
		}

		_ = r.db.PostgRESTPatch(ctx, fmt.Sprintf("issues?id=eq.%s", url.QueryEscape(issueID)), map[string]any{
			"status":     "DITOLAK",
			"updated_at": time.Now(),
		})
		_ = r.db.PostgRESTPatch(ctx, fmt.Sprintf("reports?issue_id=eq.%s", url.QueryEscape(issueID)), patchPayload)
		_ = r.db.PostgRESTPatch(ctx, fmt.Sprintf("reports?id=eq.%s", url.QueryEscape(issueID)), patchPayload)

		_ = r.db.PostgRESTPost(ctx, "issue_events", map[string]any{
			"id":          uuid.New().String(),
			"issue_id":    issueID,
			"from_status": "MENUNGGU_VERIFIKASI",
			"to_status":   "DITOLAK",
			"note":        fullReason,
			"created_at":  time.Now(),
		}, nil)
	}

	if r.db != nil && r.db.Pool != nil {
		_, _ = r.db.Pool.Exec(ctx, `UPDATE app.issues SET status = 'DITOLAK', updated_at = now() WHERE id = $1`, issueID)
		_, _ = r.db.Pool.Exec(ctx, `UPDATE app.reports SET status = 'DITOLAK', hide_reason = $2, updated_at = now() WHERE issue_id = $1::uuid OR id = $1::uuid`, issueID, fullReason)
		_, _ = r.db.Pool.Exec(ctx, `INSERT INTO app.issue_events (id, issue_id, from_status, to_status, note, created_at) VALUES ($1, $2, 'MENUNGGU_VERIFIKASI', 'DITOLAK', $3, now())`, uuid.New().String(), issueID, fullReason)
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	iss, ok := r.issues[issueID]
	if ok {
		iss.Status = StatusDitolak
		iss.Events = append(iss.Events, IssueEvent{
			ID:         uuid.New().String(),
			FromStatus: string(StatusMenungguVerifikasi),
			ToStatus:   string(StatusDitolak),
			AuthorName: "Administrator Pusat",
			Note:       fullReason,
			CreatedAt:  time.Now(),
		})
		iss.UpdatedAt = time.Now()
	}
	return nil
}

func (r *repository) ListVerificationQueue(ctx context.Context) ([]Issue, error) {
	if r.db != nil && r.db.HasREST() {
		var restIssues []struct {
			ID                   string    `json:"id"`
			Code                 string    `json:"code"`
			Title                string    `json:"title"`
			Summary              *string   `json:"summary"`
			OpdID                *string   `json:"opd_id"`
			CategoryID           *string   `json:"category_id"`
			DistrictID           *string   `json:"district_id"`
			VillageID            *string   `json:"village_id"`
			CenterLat            float64   `json:"center_lat"`
			CenterLng            float64   `json:"center_lng"`
			Status               string    `json:"status"`
			Urgency              string    `json:"urgency"`
			SafetyRisk           string    `json:"safety_risk"`
			UniqueReportersCount int       `json:"unique_reporters_count"`
			CoverPhotoURL        *string   `json:"cover_photo_url"`
			CreatedAt            time.Time `json:"created_at"`
			UpdatedAt            time.Time `json:"updated_at"`
		}

		opdNames := map[string]string{
			"e0000000-0000-0000-0000-000000000001": "Dinas Bina Marga & SDA",
			"e0000000-0000-0000-0000-000000000002": "Dinas Lingkungan Hidup & Kebersihan",
			"e0000000-0000-0000-0000-000000000003": "Dinas Perhubungan",
			"e0000000-0000-0000-0000-000000000004": "Dinas Kesehatan",
			"e0000000-0000-0000-0000-000000000007": "Dinas PUPR",
			"DBM-SDA":                              "Dinas Bina Marga & SDA",
			"DLHK":                                 "Dinas Lingkungan Hidup & Kebersihan",
			"DISHUB":                               "Dinas Perhubungan",
			"DINKES":                               "Dinas Kesehatan",
			"PUPR":                                 "Dinas PUPR",
		}

		opdCodes := map[string]string{
			"e0000000-0000-0000-0000-000000000001": "DBM-SDA",
			"e0000000-0000-0000-0000-000000000002": "DLHK",
			"e0000000-0000-0000-0000-000000000003": "DISHUB",
			"e0000000-0000-0000-0000-000000000004": "DINKES",
			"e0000000-0000-0000-0000-000000000007": "PUPR",
			"DBM-SDA":                              "DBM-SDA",
			"DLHK":                                 "DLHK",
			"DISHUB":                               "DISHUB",
			"DINKES":                               "DINKES",
			"PUPR":                                 "PUPR",
		}

		type clsRecord struct {
			ReportID    string  `json:"report_id"`
			Confidence  float64 `json:"confidence"`
			Summary     string  `json:"summary"`
			RawResponse struct {
				OpdCode           string  `json:"opd_code"`
				OpdName           string  `json:"opd_name"`
				CategoryCode      string  `json:"category_code"`
				CategoryName      string  `json:"category_name"`
				IsUnregisteredOpd bool    `json:"is_unregistered_opd"`
				RecommendedAction string  `json:"recommended_action"`
			} `json:"raw_response"`
		}
		var classifications []clsRecord
		_ = r.db.PostgRESTGet(ctx, "ai_classifications?order=created_at.desc&limit=100", &classifications)
		aiByReport := make(map[string]clsRecord)
		for _, c := range classifications {
			aiByReport[c.ReportID] = c
		}

		var reports []struct {
			ID          string    `json:"id"`
			Code        string    `json:"code"`
			IssueID     *string   `json:"issue_id"`
			OpdID       *string   `json:"opd_id"`
			Title       string    `json:"title"`
			Description string    `json:"description"`
			Status      string    `json:"status"`
			CreatedAt   time.Time `json:"created_at"`
		}
		_ = r.db.PostgRESTGet(ctx, "reports?order=created_at.desc&limit=200", &reports)

		var attachments []struct {
			ReportID string `json:"report_id"`
			FileURL  string `json:"file_url"`
		}
		_ = r.db.PostgRESTGet(ctx, "report_attachments?limit=500", &attachments)
		photosByReport := make(map[string][]string)
		for _, a := range attachments {
			if a.FileURL != "" {
				photosByReport[a.ReportID] = append(photosByReport[a.ReportID], a.FileURL)
			}
		}

		endpoint := "issues?status=in.(MENUNGGU_VERIFIKASI,DIALIHKAN,DIAJUKAN)&order=created_at.asc"
		_ = r.db.PostgRESTGet(ctx, endpoint, &restIssues)

		var list []Issue
		seenIssueIDs := make(map[string]bool)
		for _, item := range restIssues {
			seenIssueIDs[item.ID] = true
			iss := Issue{
				ID:                   item.ID,
				Code:                 item.Code,
				Title:                item.Title,
				Status:               IssueStatus(item.Status),
				Urgency:              Urgency(item.Urgency),
				SafetyRisk:           item.SafetyRisk,
				UniqueReportersCount: item.UniqueReportersCount,
				Point:                LocationPoint{Lat: item.CenterLat, Lng: item.CenterLng},
				CreatedAt:            item.CreatedAt,
				UpdatedAt:            item.UpdatedAt,
			}
			if item.Summary != nil {
				iss.Summary = *item.Summary
			}
			if item.CoverPhotoURL != nil {
				iss.CoverPhotoURL = *item.CoverPhotoURL
			}
			if item.OpdID != nil {
				iss.OpdID = *item.OpdID
				iss.OpdCode = opdCodes[*item.OpdID]
				iss.OpdName = opdNames[*item.OpdID]
			}

			for _, rep := range reports {
				if rep.IssueID != nil && *rep.IssueID == item.ID {
					if photos, ok := photosByReport[rep.ID]; ok {
						iss.PhotoURLs = append(iss.PhotoURLs, photos...)
					}
					if cls, ok := aiByReport[rep.ID]; ok {
						iss.AiOpdCode = cls.RawResponse.OpdCode
						iss.AiOpdName = cls.RawResponse.OpdName
						iss.AiCategoryCode = cls.RawResponse.CategoryCode
						iss.AiCategoryName = cls.RawResponse.CategoryName
						iss.AiConfidence = cls.Confidence
						iss.AiSummary = cls.Summary
						iss.IsUnregisteredOpd = cls.RawResponse.IsUnregisteredOpd
						iss.AiRecommendation = cls.RawResponse.RecommendedAction
					}
				}
			}

			if iss.AiOpdCode == "" {
				iss.AiOpdCode = "DBM-SDA"
				iss.AiOpdName = "Dinas Bina Marga & SDA"
				iss.AiCategoryCode = "JALAN-RUSAK"
				iss.AiCategoryName = "Jalan Rusak & Berlubang"
				iss.AiConfidence = 0.85
				iss.AiSummary = iss.Title
			}

			list = append(list, iss)
		}

		for _, rep := range reports {
			targetID := rep.ID
			if rep.IssueID != nil && *rep.IssueID != "" {
				targetID = *rep.IssueID
			}
			if seenIssueIDs[targetID] {
				continue
			}
			seenIssueIDs[targetID] = true

			status := IssueStatus(rep.Status)
			if rep.Status == "DIAJUKAN" {
				status = StatusMenungguVerifikasi
			}

			iss := Issue{
				ID:                   targetID,
				Code:                 rep.Code,
				Title:                rep.Title,
				Summary:              rep.Description,
				Status:               status,
				Urgency:              UrgencyNormal,
				UniqueReportersCount: 1,
				CreatedAt:            rep.CreatedAt,
				UpdatedAt:            rep.CreatedAt,
				PhotoURLs:            photosByReport[rep.ID],
			}
			if cls, ok := aiByReport[rep.ID]; ok {
				iss.AiOpdCode = cls.RawResponse.OpdCode
				iss.AiOpdName = cls.RawResponse.OpdName
				iss.AiCategoryCode = cls.RawResponse.CategoryCode
				iss.AiCategoryName = cls.RawResponse.CategoryName
				iss.AiConfidence = cls.Confidence
				iss.AiSummary = cls.Summary
				iss.IsUnregisteredOpd = cls.RawResponse.IsUnregisteredOpd
				iss.AiRecommendation = cls.RawResponse.RecommendedAction
			} else {
				iss.AiOpdCode = "DBM-SDA"
				iss.AiOpdName = "Dinas Bina Marga & SDA"
				iss.AiCategoryCode = "JALAN-RUSAK"
				iss.AiCategoryName = "Jalan Rusak & Berlubang"
				iss.AiConfidence = 0.85
				iss.AiSummary = rep.Title
			}
			if rep.OpdID != nil && *rep.OpdID != "" {
				iss.OpdID = *rep.OpdID
				iss.OpdCode = opdCodes[*rep.OpdID]
				iss.OpdName = opdNames[*rep.OpdID]
			}
			list = append(list, iss)
		}

		return list, nil
	}

	if r.db != nil && r.db.Pool != nil {
		query := `SELECT i.id, i.code, i.title, COALESCE(i.summary,''), 
		          COALESCE(i.opd_id::text,''), COALESCE(o.name,''), 
		          COALESCE(i.category_id::text,''), COALESCE(c.name,''), 
		          COALESCE(i.district_id::text,''), COALESCE(d.name,''), 
		          COALESCE(i.village_id::text,''), COALESCE(v.name,''), 
		          i.center_lat, i.center_lng, COALESCE(i.address_detail,''), 
		          i.status, i.urgency, i.safety_risk, i.unique_reporters_count, 
		          COALESCE(i.sla_due_at, now()), COALESCE(i.cover_photo_url,''), i.created_at, i.updated_at 
		          FROM app.issues i 
		          LEFT JOIN app.opds o ON i.opd_id = o.id 
		          LEFT JOIN app.categories c ON i.category_id = c.id 
		          LEFT JOIN app.districts d ON i.district_id = d.id 
		          LEFT JOIN app.villages v ON i.village_id = v.id 
		          WHERE i.status IN ('MENUNGGU_VERIFIKASI', 'DIALIHKAN', 'DIAJUKAN') 
		          ORDER BY i.created_at ASC`
		rows, err := r.db.Pool.Query(ctx, query)
		if err == nil {
			defer rows.Close()
			var list []Issue
			for rows.Next() {
				var iss Issue
				var statusStr, urgencyStr string
				if err := rows.Scan(&iss.ID, &iss.Code, &iss.Title, &iss.Summary, &iss.OpdID, &iss.OpdName, &iss.CategoryID, &iss.CategoryName, &iss.DistrictID, &iss.DistrictName, &iss.VillageID, &iss.VillageName, &iss.Point.Lat, &iss.Point.Lng, &iss.AddressDetail, &statusStr, &urgencyStr, &iss.SafetyRisk, &iss.UniqueReportersCount, &iss.SlaDueAt, &iss.CoverPhotoURL, &iss.CreatedAt, &iss.UpdatedAt); err == nil {
					iss.Status = IssueStatus(statusStr)
					iss.Urgency = Urgency(urgencyStr)
					list = append(list, iss)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

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
