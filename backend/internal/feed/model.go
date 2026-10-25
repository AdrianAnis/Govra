package feed

import "time"

type MediaType string

const (
	MediaImage MediaType = "IMAGE"
	MediaVideo MediaType = "VIDEO"
	MediaReel  MediaType = "REEL"
)

type FeedItem struct {
	ID           string    `json:"id"`
	AuthorID     string    `json:"author_id"`
	AuthorName   string    `json:"author_name"`
	AuthorAvatar string    `json:"author_avatar,omitempty"`
	ReportID     string    `json:"report_id,omitempty"`
	IssueID      string    `json:"issue_id,omitempty"`
	IssueTitle   string    `json:"issue_title,omitempty"`
	IssueUrgency string    `json:"issue_urgency,omitempty"`
	Content      string    `json:"content"`
	MediaType    MediaType `json:"media_type"`
	MediaURL     string    `json:"media_url"`
	LikesCount   int       `json:"likes_count"`
	SharesCount  int       `json:"shares_count"`
	IsLiked      bool      `json:"is_liked"`
	CreatedAt    time.Time `json:"created_at"`
}

type CreateFeedRequest struct {
	ReportID  string    `json:"report_id,omitempty"`
	IssueID   string    `json:"issue_id,omitempty"`
	Content   string    `json:"content"`
	MediaType MediaType `json:"media_type"`
	MediaURL  string    `json:"media_url"`
}
