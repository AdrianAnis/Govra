package program

import "time"

type ProgramStatus string

const (
	StatusBelumDimulai    ProgramStatus = "BELUM_DIMULAI"
	StatusSesuaiJadwal    ProgramStatus = "SESUAI_JADWAL"
	StatusTerlambat       ProgramStatus = "TERLAMBAT"
	StatusMelewatiTenggat ProgramStatus = "MELEWATI_TENGGAT"
	StatusSelesai         ProgramStatus = "SELESAI"
)

type GeoPoint struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

type Village struct {
	ID             string                 `json:"id"`
	DistrictID     string                 `json:"district_id"`
	Name           string                 `json:"name"`
	Point          GeoPoint               `json:"point"`
	PolygonGeoJSON map[string]interface{} `json:"polygon_geojson,omitempty"`
}

type District struct {
	ID             string                 `json:"id"`
	RegionID       string                 `json:"region_id"`
	Name           string                 `json:"name"`
	Point          GeoPoint               `json:"point"`
	PolygonGeoJSON map[string]interface{} `json:"polygon_geojson,omitempty"`
	Villages       []Village              `json:"villages"`
}

type Region struct {
	ID             string                 `json:"id"`
	Code           string                 `json:"code"`
	Name           string                 `json:"name"`
	HeadLabel      string                 `json:"head_label"`
	Center         GeoPoint               `json:"center"`
	PolygonGeoJSON map[string]interface{} `json:"polygon_geojson,omitempty"`
}

type Goal struct {
	ID          string `json:"id"`
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type Opd struct {
	ID          string `json:"id"`
	Code        string `json:"code"`
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Phone       string `json:"phone,omitempty"`
	Email       string `json:"email,omitempty"`
	Address     string `json:"address,omitempty"`
	TotalProker int    `json:"total_proker"`
	Score       int    `json:"score"`
}

type ProgramMilestone struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	TargetDate  string     `json:"target_date"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	IsCompleted bool       `json:"is_completed"`
}

type ProgramUpdate struct {
	ID                  string    `json:"id"`
	Title               string    `json:"title"`
	Content             string    `json:"content"`
	ProgressPercentage  int       `json:"progress_percentage"`
	DocumentationPhotos []string  `json:"documentation_photos"`
	CreatedBy           string    `json:"created_by"`
	CreatedAt           time.Time `json:"created_at"`
}

type ProgramDocument struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	FileURL  string `json:"file_url"`
	FileSize int64  `json:"file_size"`
	MimeType string `json:"mime_type"`
}

type ProgramBudget struct {
	Pagu        float64 `json:"pagu"`
	Realization float64 `json:"realization"`
	Percentage  float64 `json:"percentage"`
}

type Program struct {
	ID             string             `json:"id"`
	Code           string             `json:"code"`
	Name           string             `json:"name"`
	Description    string             `json:"description"`
	OpdID          string             `json:"opd_id"`
	OpdCode        string             `json:"opd_code"`
	OpdName        string             `json:"opd_name"`
	GoalID         string             `json:"goal_id"`
	GoalCode       string             `json:"goal_code"`
	DistrictID     string             `json:"district_id"`
	DistrictName   string             `json:"district_name"`
	StartDate      string             `json:"start_date"`
	EndDate        string             `json:"end_date"`
	Status         ProgramStatus      `json:"status"`
	ApprovalStatus string             `json:"approval_status"`
	Progress       float64            `json:"progress"`
	Expected       float64            `json:"expected_progress"`
	Budget         ProgramBudget      `json:"budget"`
	Milestones     []ProgramMilestone `json:"milestones,omitempty"`
	Updates        []ProgramUpdate    `json:"updates,omitempty"`
	Documents      []ProgramDocument  `json:"documents,omitempty"`
	RelatedIssues  int                `json:"related_issues"`
	CreatedAt      time.Time          `json:"created_at"`
}

type CreateProgramRequest struct {
	Code         string   `json:"code"`
	Name         string   `json:"name"`
	Description  string   `json:"description"`
	OpdID        string   `json:"opd_id"`
	GoalID       string   `json:"goal_id"`
	DistrictID   string   `json:"district_id"`
	StartDate    string   `json:"start_date"`
	EndDate      string   `json:"end_date"`
	BudgetPagu   float64  `json:"budget_pagu"`
	MilestoneStr []string `json:"milestones"`
}

type CreateUpdateRequest struct {
	Title               string   `json:"title"`
	Content             string   `json:"content"`
	ProgressPercentage  int      `json:"progress_percentage"`
	DocumentationPhotos []string `json:"documentation_photos"`
}
