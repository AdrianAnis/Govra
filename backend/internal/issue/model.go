package issue

import "time"

type Urgency string

const (
	UrgencyNormal Urgency = "NORMAL"
	UrgencyTinggi Urgency = "TINGGI"
	UrgencyUrgent Urgency = "URGENT"
)

type IssueStatus string

const (
	StatusMenungguVerifikasi IssueStatus = "MENUNGGU_VERIFIKASI"
	StatusDiteruskan         IssueStatus = "DITERUSKAN"
	StatusDiproses           IssueStatus = "DIPROSES"
	StatusSelesai            IssueStatus = "SELESAI"
	StatusDitolak            IssueStatus = "DITOLAK"
	StatusDialihkan          IssueStatus = "DIALIHKAN"
	StatusDibukaUlang        IssueStatus = "DIBUKA_ULANG"
)

type LocationPoint struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

type IssueEvent struct {
	ID             string    `json:"id"`
	FromStatus     string    `json:"from_status,omitempty"`
	ToStatus       string    `json:"to_status"`
	AuthorName     string    `json:"author_name"`
	Note           string    `json:"note"`
	EvidencePhotos []string  `json:"evidence_photos,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

type IssueMemberReport struct {
	ID          string    `json:"id"`
	Code        string    `json:"code"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

type Issue struct {
	ID                   string              `json:"id"`
	Code                 string              `json:"code"`
	Title                string              `json:"title"`
	Summary              string              `json:"summary"`
	OpdID                string              `json:"opd_id"`
	OpdName              string              `json:"opd_name"`
	CategoryID           string              `json:"category_id"`
	CategoryName         string              `json:"category_name"`
	DistrictID           string              `json:"district_id"`
	DistrictName         string              `json:"district_name"`
	VillageID            string              `json:"village_id"`
	VillageName          string              `json:"village_name"`
	Point                LocationPoint       `json:"point"`
	AddressDetail        string              `json:"address_detail"`
	Status               IssueStatus         `json:"status"`
	Urgency              Urgency             `json:"urgency"`
	SafetyRisk           string              `json:"safety_risk"`
	UniqueReportersCount int                 `json:"unique_reporters_count"`
	SlaDueAt             time.Time           `json:"sla_due_at"`
	IsOverdue            bool                `json:"is_overdue"`
	CoverPhotoURL        string              `json:"cover_photo_url,omitempty"`
	Reports              []IssueMemberReport `json:"reports,omitempty"`
	Events               []IssueEvent        `json:"events"`
	AiRecommendation     string              `json:"ai_recommendation,omitempty"`
	CreatedAt            time.Time           `json:"created_at"`
	UpdatedAt            time.Time           `json:"updated_at"`
}

type TransitionRequest struct {
	TargetStatus    IssueStatus `json:"target_status"`
	Response        string      `json:"response"`
	RejectionReason string      `json:"rejection_reason,omitempty"`
	TransferReason  string      `json:"transfer_reason,omitempty"`
	EvidencePhotos  []string    `json:"evidence_photos,omitempty"`
}

type RouteIssueRequest struct {
	OpdID      string `json:"opd_id"`
	CategoryID string `json:"category_id"`
	Note       string `json:"note,omitempty"`
}

type RejectIssueRequest struct {
	Reason string `json:"reason"`
	Note   string `json:"note"`
}

type PublicationRequest struct {
	PublicOK bool `json:"public_ok"`
	IsCover  bool `json:"is_cover"`
}
