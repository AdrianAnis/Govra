package program

import (
	"context"
	"encoding/json"
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
	programs  map[string]*Program
	region    *Region
	districts []District
	goals     []Goal
	opds      []Opd
}

func NewRepository(database *db.Database) Repository {
	r := &repository{
		db:       database,
		programs: make(map[string]*Program),
	}
	if database == nil || database.Pool == nil {
		r.seedData()
	}
	return r
}

func (r *repository) seedData() {
	r.region = &Region{
		ID:        "a0000000-0000-0000-0000-000000000001",
		Code:      "KOTA-BANDUNG",
		Name:      "Kota Bandung",
		HeadLabel: "Wali Kota Bandung",
		Center:    GeoPoint{Lat: -6.9175, Lng: 107.6191},
	}
	r.districts = []District{
		{
			ID:       "0197a000-0000-7000-8000-000000000013",
			RegionID: "a0000000-0000-0000-0000-000000000001",
			Name:     "Kecamatan Coblong",
			Point:    GeoPoint{Lat: -6.8845, Lng: 107.6155},
			Villages: []Village{
				{ID: "0197a000-0000-7000-8000-0000000000b9", DistrictID: "0197a000-0000-7000-8000-000000000013", Name: "Kelurahan Dago", Point: GeoPoint{Lat: -6.8775, Lng: 107.6185}},
			},
		},
	}
	r.goals = []Goal{
		{ID: "d0000000-0000-0000-0000-000000000001", Code: "SAS-01", Name: "Infrastruktur Mantap"},
	}
	r.opds = []Opd{
		{ID: "e0000000-0000-0000-0000-000000000001", Code: "DBM-SDA", Name: "Dinas Bina Marga & SDA", Slug: "bina-marga-sda"},
	}
	sample := &Program{
		ID:             "p0000000-0000-0000-0000-000000000001",
		Code:           "PRG-2025-001",
		Name:           "Rekonstruksi Jalan Protokol",
		ApprovalStatus: "APPROVED",
		StartDate:      "2025-01-01",
		EndDate:        "2025-12-31",
	}
	r.programs[sample.Code] = sample
}

func (r *repository) GetRegion(ctx context.Context) (*Region, error) {
	if r.db != nil && r.db.HasREST() {
		type restRegion struct {
			ID             string                 `json:"id"`
			Code           string                 `json:"code"`
			Name           string                 `json:"name"`
			HeadLabel      string                 `json:"head_label"`
			CenterLat      float64                `json:"center_lat"`
			CenterLng      float64                `json:"center_lng"`
			PolygonGeoJSON map[string]interface{} `json:"polygon_geojson,omitempty"`
		}
		var list []restRegion
		if err := r.db.PostgRESTGet(ctx, "regions?select=id,code,name,head_label,center_lat,center_lng,polygon_geojson&is_pilot=eq.true&limit=1", &list); err == nil && len(list) > 0 {
			reg := list[0]
			return &Region{
				ID:             reg.ID,
				Code:           reg.Code,
				Name:           reg.Name,
				HeadLabel:      reg.HeadLabel,
				Center:         GeoPoint{Lat: reg.CenterLat, Lng: reg.CenterLng},
				PolygonGeoJSON: reg.PolygonGeoJSON,
			}, nil
		}
	}
	if r.db != nil && r.db.Pool != nil {
		query := `SELECT id, code, name, head_label, center_lat, center_lng, polygon_geojson FROM app.regions WHERE is_pilot = true LIMIT 1`
		var reg Region
		var rawGeo []byte
		err := r.db.Pool.QueryRow(ctx, query).Scan(&reg.ID, &reg.Code, &reg.Name, &reg.HeadLabel, &reg.Center.Lat, &reg.Center.Lng, &rawGeo)
		if err == nil {
			_ = json.Unmarshal(rawGeo, &reg.PolygonGeoJSON)
			return &reg, nil
		}
	}
	r.mu.RLock()
	defer r.mu.RUnlock()
	if r.region != nil {
		return r.region, nil
	}
	return nil, errors.New("region tidak ditemukan")
}

func (r *repository) ListDistricts(ctx context.Context) ([]District, error) {
	if r.db != nil && r.db.HasREST() {
		type restVillage struct {
			ID         string  `json:"id"`
			DistrictID string  `json:"district_id"`
			Name       string  `json:"name"`
			CenterLat  float64 `json:"center_lat"`
			CenterLng  float64 `json:"center_lng"`
		}
		type restDistrict struct {
			ID        string        `json:"id"`
			RegionID  string        `json:"region_id"`
			Name      string        `json:"name"`
			CenterLat float64       `json:"center_lat"`
			CenterLng float64       `json:"center_lng"`
			Villages  []restVillage `json:"villages"`
		}
		var restList []restDistrict
		if err := r.db.PostgRESTGet(ctx, "districts?select=id,region_id,name,center_lat,center_lng,villages(id,district_id,name,center_lat,center_lng)&order=name.asc", &restList); err == nil && len(restList) > 0 {
			list := make([]District, 0, len(restList))
			for _, rd := range restList {
				d := District{
					ID:       rd.ID,
					RegionID: rd.RegionID,
					Name:     rd.Name,
					Point:    GeoPoint{Lat: rd.CenterLat, Lng: rd.CenterLng},
					Villages: make([]Village, 0, len(rd.Villages)),
				}
				for _, rv := range rd.Villages {
					d.Villages = append(d.Villages, Village{
						ID:         rv.ID,
						DistrictID: rv.DistrictID,
						Name:       rv.Name,
						Point:      GeoPoint{Lat: rv.CenterLat, Lng: rv.CenterLng},
					})
				}
				list = append(list, d)
			}
			return list, nil
		}
	}
	if r.db != nil && r.db.Pool != nil {
		rows, err := r.db.Pool.Query(ctx, `SELECT id, region_id, name, center_lat, center_lng, polygon_geojson FROM app.districts ORDER BY name ASC`)
		if err == nil {
			defer rows.Close()
			var list []District
			for rows.Next() {
				var d District
				var rawGeo []byte
				d.Villages = make([]Village, 0)
				if err := rows.Scan(&d.ID, &d.RegionID, &d.Name, &d.Point.Lat, &d.Point.Lng, &rawGeo); err == nil {
					_ = json.Unmarshal(rawGeo, &d.PolygonGeoJSON)
					vRows, vErr := r.db.Pool.Query(ctx, `SELECT id, district_id, name, center_lat, center_lng, polygon_geojson FROM app.villages WHERE district_id = $1 ORDER BY name ASC`, d.ID)
					if vErr == nil {
						for vRows.Next() {
							var v Village
							var vRaw []byte
							if err := vRows.Scan(&v.ID, &v.DistrictID, &v.Name, &v.Point.Lat, &v.Point.Lng, &vRaw); err == nil {
								_ = json.Unmarshal(vRaw, &v.PolygonGeoJSON)
								d.Villages = append(d.Villages, v)
							}
						}
						vRows.Close()
					}
					list = append(list, d)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.districts, nil
}

func (r *repository) ListGoals(ctx context.Context) ([]Goal, error) {
	if r.db != nil && r.db.Pool != nil {
		rows, err := r.db.Pool.Query(ctx, `SELECT id, code, name, COALESCE(description,'') FROM app.goals ORDER BY code ASC`)
		if err == nil {
			defer rows.Close()
			var list []Goal
			for rows.Next() {
				var g Goal
				if err := rows.Scan(&g.ID, &g.Code, &g.Name, &g.Description); err == nil {
					list = append(list, g)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.goals, nil
}

func (r *repository) ListOpds(ctx context.Context) ([]Opd, error) {
	if r.db != nil && r.db.Pool != nil {
		query := `SELECT o.id, o.code, o.name, o.slug, COALESCE(o.phone,''), COALESCE(o.email,''), COALESCE(o.address,''), 
		          (SELECT count(*) FROM app.programs p WHERE p.opd_id = o.id) 
		          FROM app.opds o WHERE o.is_active = true ORDER BY o.name ASC`
		rows, err := r.db.Pool.Query(ctx, query)
		if err == nil {
			defer rows.Close()
			var list []Opd
			for rows.Next() {
				var o Opd
				if err := rows.Scan(&o.ID, &o.Code, &o.Name, &o.Slug, &o.Phone, &o.Email, &o.Address, &o.TotalProker); err == nil {
					o.Score = 85
					list = append(list, o)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.opds, nil
}

func (r *repository) GetOpdBySlug(ctx context.Context, slug string) (*Opd, error) {
	if r.db != nil && r.db.Pool != nil {
		query := `SELECT o.id, o.code, o.name, o.slug, COALESCE(o.phone,''), COALESCE(o.email,''), COALESCE(o.address,''), 
		          (SELECT count(*) FROM app.programs p WHERE p.opd_id = o.id) 
		          FROM app.opds o WHERE o.slug = $1`
		var o Opd
		err := r.db.Pool.QueryRow(ctx, query, slug).Scan(&o.ID, &o.Code, &o.Name, &o.Slug, &o.Phone, &o.Email, &o.Address, &o.TotalProker)
		if err == nil {
			o.Score = 85
			return &o, nil
		}
	}
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
	if r.db != nil && r.db.Pool != nil {
		query := `SELECT p.id, p.code, p.name, COALESCE(p.description,''), p.opd_id, o.code, o.name, 
		          COALESCE(p.goal_id::text,''), COALESCE(g.code,''), COALESCE(p.district_id::text,''), COALESCE(d.name,''), 
		          p.start_date::text, p.end_date::text, p.status, p.approval_status, 
		          COALESCE(p.realization_output, 0), COALESCE(p.budget_pagu, 0), COALESCE(p.budget_realization, 0), p.created_at 
		          FROM app.programs p 
		          JOIN app.opds o ON p.opd_id = o.id 
		          LEFT JOIN app.goals g ON p.goal_id = g.id 
		          LEFT JOIN app.districts d ON p.district_id = d.id 
		          WHERE p.approval_status = 'APPROVED'`
		rows, err := r.db.Pool.Query(ctx, query)
		if err == nil {
			defer rows.Close()
			var list []Program
			for rows.Next() {
				var p Program
				var statusStr string
				if err := rows.Scan(&p.ID, &p.Code, &p.Name, &p.Description, &p.OpdID, &p.OpdCode, &p.OpdName, &p.GoalID, &p.GoalCode, &p.DistrictID, &p.DistrictName, &p.StartDate, &p.EndDate, &statusStr, &p.ApprovalStatus, &p.Progress, &p.Budget.Pagu, &p.Budget.Realization, &p.CreatedAt); err == nil {
					p.Status = ProgramStatus(statusStr)
					if p.Budget.Pagu > 0 {
						p.Budget.Percentage = (p.Budget.Realization / p.Budget.Pagu) * 100
					}
					if opdSlug != "" && !strings.EqualFold(p.OpdCode, opdSlug) {
						continue
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
					list = append(list, p)
				}
			}
			return list, nil
		}
	}
	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []Program
	for _, p := range r.programs {
		if p.ApprovalStatus != "APPROVED" {
			continue
		}
		list = append(list, *p)
	}
	return list, nil
}

func (r *repository) GetProgramByCode(ctx context.Context, code string) (*Program, error) {
	if r.db != nil && r.db.Pool != nil {
		query := `SELECT p.id, p.code, p.name, COALESCE(p.description,''), p.opd_id, o.code, o.name, 
		          COALESCE(p.goal_id::text,''), COALESCE(g.code,''), COALESCE(p.district_id::text,''), COALESCE(d.name,''), 
		          p.start_date::text, p.end_date::text, p.status, p.approval_status, 
		          COALESCE(p.realization_output, 0), COALESCE(p.budget_pagu, 0), COALESCE(p.budget_realization, 0), p.created_at 
		          FROM app.programs p 
		          JOIN app.opds o ON p.opd_id = o.id 
		          LEFT JOIN app.goals g ON p.goal_id = g.id 
		          LEFT JOIN app.districts d ON p.district_id = d.id 
		          WHERE p.code = $1`
		var p Program
		var statusStr string
		err := r.db.Pool.QueryRow(ctx, query, code).Scan(&p.ID, &p.Code, &p.Name, &p.Description, &p.OpdID, &p.OpdCode, &p.OpdName, &p.GoalID, &p.GoalCode, &p.DistrictID, &p.DistrictName, &p.StartDate, &p.EndDate, &statusStr, &p.ApprovalStatus, &p.Progress, &p.Budget.Pagu, &p.Budget.Realization, &p.CreatedAt)
		if err == nil {
			p.Status = ProgramStatus(statusStr)
			if p.Budget.Pagu > 0 {
				p.Budget.Percentage = (p.Budget.Realization / p.Budget.Pagu) * 100
			}
			mRows, mErr := r.db.Pool.Query(ctx, `SELECT id, title, target_date::text, is_completed, completed_at FROM app.program_milestones WHERE program_id = $1 ORDER BY sort_order ASC`, p.ID)
			if mErr == nil {
				for mRows.Next() {
					var m ProgramMilestone
					if err := mRows.Scan(&m.ID, &m.Title, &m.TargetDate, &m.IsCompleted, &m.CompletedAt); err == nil {
						p.Milestones = append(p.Milestones, m)
					}
				}
				mRows.Close()
			}
			uRows, uErr := r.db.Pool.Query(ctx, `SELECT u.id, u.title, u.content, COALESCE(u.progress_percentage,0), u.documentation_photos, COALESCE(p.display_name, 'Dinas Terkait'), u.created_at FROM app.program_updates u LEFT JOIN app.profiles p ON u.created_by = p.id WHERE u.program_id = $1 ORDER BY u.created_at DESC`, p.ID)
			if uErr == nil {
				for uRows.Next() {
					var u ProgramUpdate
					var photosJSON []byte
					if err := uRows.Scan(&u.ID, &u.Title, &u.Content, &u.ProgressPercentage, &photosJSON, &u.CreatedBy, &u.CreatedAt); err == nil {
						_ = json.Unmarshal(photosJSON, &u.DocumentationPhotos)
						p.Updates = append(p.Updates, u)
					}
				}
				uRows.Close()
			}
			return &p, nil
		}
	}
	r.mu.RLock()
	defer r.mu.RUnlock()
	p, ok := r.programs[code]
	if !ok {
		return nil, errors.New("program kerja tidak ditemukan")
	}
	return p, nil
}

func (r *repository) CreateProgram(ctx context.Context, p *Program) error {
	if p.ID == "" {
		p.ID = uuid.New().String()
	}
	p.CreatedAt = time.Now()

	if r.db != nil && r.db.Pool != nil {
		query := `INSERT INTO app.programs (id, code, name, description, opd_id, goal_id, district_id, start_date, end_date, status, approval_status, realization_output, budget_pagu, budget_realization, created_at, updated_at) 
		          VALUES ($1, $2, $3, $4, $5::uuid, NULLIF($6, '')::uuid, NULLIF($7, '')::uuid, $8::date, $9::date, $10, $11, $12, $13, $14, $15, $16)`
		_, err := r.db.Pool.Exec(ctx, query, p.ID, p.Code, p.Name, p.Description, p.OpdID, p.GoalID, p.DistrictID, p.StartDate, p.EndDate, string(p.Status), p.ApprovalStatus, p.Progress, p.Budget.Pagu, p.Budget.Realization, p.CreatedAt, p.CreatedAt)
		if err != nil {
			return err
		}
		for i, m := range p.Milestones {
			_, _ = r.db.Pool.Exec(ctx, `INSERT INTO app.program_milestones (id, program_id, title, target_date, is_completed, sort_order) VALUES ($1, $2, $3, $4::date, $5, $6)`, uuid.New().String(), p.ID, m.Title, m.TargetDate, m.IsCompleted, i+1)
		}
		return nil
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.programs[p.Code] = p
	return nil
}

func (r *repository) ApproveProgram(ctx context.Context, code string) error {
	if r.db != nil && r.db.Pool != nil {
		query := `UPDATE app.programs SET approval_status = 'APPROVED', updated_at = now() WHERE code = $1`
		_, err := r.db.Pool.Exec(ctx, query, code)
		return err
	}

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
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	u.CreatedAt = time.Now()

	if r.db != nil && r.db.Pool != nil {
		var progID string
		var opdID string
		err := r.db.Pool.QueryRow(ctx, `SELECT id, opd_id FROM app.programs WHERE code = $1`, code).Scan(&progID, &opdID)
		if err != nil {
			return errors.New("program kerja tidak ditemukan")
		}
		photosJSON, _ := json.Marshal(u.DocumentationPhotos)
		_, err = r.db.Pool.Exec(ctx, `INSERT INTO app.program_updates (id, program_id, opd_id, title, content, progress_percentage, documentation_photos, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, u.ID, progID, opdID, u.Title, u.Content, u.ProgressPercentage, photosJSON, u.CreatedAt)
		if err != nil {
			return err
		}
		_, _ = r.db.Pool.Exec(ctx, `UPDATE app.programs SET realization_output = GREATEST(realization_output, $1), updated_at = now() WHERE id = $2`, u.ProgressPercentage, progID)
		return nil
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	p, ok := r.programs[code]
	if !ok {
		return errors.New("program kerja tidak ditemukan")
	}
	p.Updates = append([]ProgramUpdate{*u}, p.Updates...)
	if u.ProgressPercentage > int(p.Progress) {
		p.Progress = float64(u.ProgressPercentage)
	}
	return nil
}
