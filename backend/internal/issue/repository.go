package issue

import (
	"context"
	"encoding/json"
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
	if database == nil || database.Pool == nil {
		r.issues["i0000000-0000-0000-0000-000000000001"] = &Issue{
			ID:                   "i0000000-0000-0000-0000-000000000001",
			Code:                 "ISU-2026-0001",
			Title:                "Jalan Berlubang di Jl. Sudirman",
			Summary:              "Lubang sedalam 15cm membahayakan pengendara motor",
			OpdID:                "e0000000-0000-0000-0000-000000000001",
			OpdName:              "Dinas Bina Marga",
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
	if r.db != nil && r.db.Pool != nil {
		query := `UPDATE app.issues SET opd_id = $2::uuid, category_id = NULLIF($3,'')::uuid, status = 'DITERUSKAN', updated_at = now() WHERE id = $1`
		_, err := r.db.Pool.Exec(ctx, query, issueID, opdID, categoryID)
		if err != nil {
			return err
		}
		_, _ = r.db.Pool.Exec(ctx, `INSERT INTO app.issue_events (id, issue_id, from_status, to_status, note, created_at) VALUES ($1, $2, 'MENUNGGU_VERIFIKASI', 'DITERUSKAN', $3, now())`, uuid.New().String(), issueID, note)
		return nil
	}

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
		          WHERE i.status IN ('MENUNGGU_VERIFIKASI', 'DIALIHKAN') 
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
			return list, nil
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
