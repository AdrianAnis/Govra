package feed

import "time"

type MediaType string

const (
	MediaImage MediaType = "IMAGE"
	MediaVideo MediaType = "VIDEO"
	MediaReel  MediaType = "REEL"
)

type FeedItem struct {
	ID            string    `json:"id"`
	AuthorID      string    `json:"author_id"`
	AuthorName    string    `json:"author_name"`
	AuthorAvatar  string    `json:"author_avatar,omitempty"`
	ReportID      string    `json:"report_id,omitempty"`
	ReportCode    string    `json:"report_code,omitempty"`
	IssueID       string    `json:"issue_id,omitempty"`
	IssueTitle    string    `json:"issue_title,omitempty"`
	IssueUrgency  string    `json:"issue_urgency,omitempty"`
	Status        string    `json:"status,omitempty"`
	HideReason    string    `json:"hide_reason,omitempty"`
	Location      string    `json:"location,omitempty"`
	Content       string    `json:"content"`
	MediaType     MediaType `json:"media_type"`
	MediaURL      string    `json:"media_url"`
	MediaURLs     []string  `json:"media_urls"`
	LikesCount    int       `json:"likes_count"`
	SharesCount   int       `json:"shares_count"`
	SupportCount  int       `json:"support_count"`
	CommentsCount int       `json:"comments_count"`
	IsLiked       bool      `json:"is_liked"`
	IsSupported   bool      `json:"is_supported"`
	CreatedAt     time.Time `json:"created_at"`
}

type CommentItem struct {
	ID         string    `json:"id"`
	FeedID     string    `json:"feed_id"`
	UserID     string    `json:"user_id"`
	AuthorName string    `json:"author_name"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"created_at"`
}

type SupporterItem struct {
	ID            string    `json:"id"`
	FeedID        string    `json:"feed_id"`
	UserID        string    `json:"user_id"`
	SupporterName string    `json:"supporter_name"`
	CreatedAt     time.Time `json:"created_at"`
}

type CreateFeedRequest struct {
	ReportID  string    `json:"report_id,omitempty"`
	IssueID   string    `json:"issue_id,omitempty"`
	Content   string    `json:"content"`
	MediaType MediaType `json:"media_type"`
	MediaURL  string    `json:"media_url"`
}

type CreateCommentRequest struct {
	Content string `json:"content"`
}
