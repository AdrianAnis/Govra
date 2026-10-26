package report

import "time"

type Visibility string

const (
	VisibilityPublic       Visibility = "PUBLIC"
	VisibilityConfidential Visibility = "CONFIDENTIAL"
)

type ReportStatus string

const (
	StatusDiajukan   ReportStatus = "DIAJUKAN"
	StatusDiteruskan ReportStatus = "DITERUSKAN"
	StatusDiproses   ReportStatus = "DIPROSES"
	StatusSelesai    ReportStatus = "SELESAI"
	StatusDitolak    ReportStatus = "DITOLAK"
)

type Attachment struct {
	ID        string `json:"id"`
	FileURL   string `json:"file_url"`
	URL       string `json:"url,omitempty"`
	MimeType  string `json:"mime_type"`
	Mime      string `json:"mime,omitempty"`
	FileSize  int64  `json:"file_size"`
	SizeBytes int64  `json:"size_bytes,omitempty"`
	IsCover   bool   `json:"is_cover"`
	PublicOK  bool   `json:"public_ok"`
}

type TimelineEvent struct {
	Status    string    `json:"status"`
	Title     string    `json:"title"`
	Note      string    `json:"note,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type Report struct {
	ID                  string          `json:"id"`
	Code                string          `json:"code"`
	ReporterID          string          `json:"reporter_id"`
	ReporterName        string          `json:"reporter_name,omitempty"`
	IssueID             string          `json:"issue_id,omitempty"`
	OpdID               string          `json:"opd_id,omitempty"`
	OpdName             string          `json:"opd_name,omitempty"`
	CategoryID          string          `json:"category_id,omitempty"`
	CategoryName        string          `json:"category_name,omitempty"`
	DistrictID          string          `json:"district_id"`
	DistrictName        string          `json:"district_name"`
	VillageID           string          `json:"village_id"`
	VillageName         string          `json:"village_name"`
	Title               string          `json:"title"`
	Description         string          `json:"description"`
	VoiceNoteURL        string          `json:"voice_note_url,omitempty"`
	VoiceNoteTranscript string          `json:"voice_note_transcript,omitempty"`
	Lat                 float64         `json:"lat"`
	Lng                 float64         `json:"lng"`
	AddressDetail       string          `json:"address_detail,omitempty"`
	Visibility          Visibility      `json:"visibility"`
	Status              ReportStatus    `json:"status"`
	Attachments         []Attachment    `json:"attachments"`
	Timeline            []TimelineEvent `json:"timeline"`
	CreatedAt           time.Time       `json:"created_at"`
	UpdatedAt           time.Time       `json:"updated_at"`
}

type CreateReportRequest struct {
	Title         string       `json:"title"`
	Description   string       `json:"description"`
	VoiceNoteData string       `json:"voice_note_data,omitempty"`
	VoiceMimeType string       `json:"voice_mime_type,omitempty"`
	DistrictID    string       `json:"district_id"`
	VillageID     string       `json:"village_id"`
	Lat           float64      `json:"lat"`
	Lng           float64      `json:"lng"`
	AddressDetail string       `json:"address_detail,omitempty"`
	Visibility    Visibility   `json:"visibility"`
	Attachments   []Attachment `json:"attachments"`
}

type DuplicateQuery struct {
	Lat        float64 `json:"lat"`
	Lng        float64 `json:"lng"`
	DistrictID string  `json:"district_id"`
	CategoryID string  `json:"category_id"`
	Title      string  `json:"title"`
}

type DuplicateSuggestion struct {
	IssueID         string  `json:"issue_id"`
	IssueCode       string  `json:"issue_code"`
	Title           string  `json:"title"`
	Summary         string  `json:"summary"`
	SimilarityScore float64 `json:"similarity_score"`
	DistanceMeters  float64 `json:"distance_meters"`
	ReportersCount  int     `json:"reporters_count"`
}

type SpeechToTextRequest struct {
	AudioBase64 string `json:"audio_base64"`
	MimeType    string `json:"mime_type"`
}

type SpeechToTextResponse struct {
	Transcript string `json:"transcript"`
}

type FeedbackRequest struct {
	Confirmed bool   `json:"confirmed"`
	Note      string `json:"note,omitempty"`
}
