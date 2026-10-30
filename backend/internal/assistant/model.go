package assistant

import "time"

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Messages []ChatMessage `json:"messages"`
}

type ChatSource struct {
	Kind  string `json:"kind"`
	Title string `json:"title"`
	Path  string `json:"path"`
}

type ChatReply struct {
	Reply   string       `json:"reply"`
	Sources []ChatSource `json:"sources"`
}

type MyReportItem struct {
	Code       string
	Title      string
	Status     string
	CreatedAt  time.Time
	IssueID    string
	Visibility string
}

type ReportDetailItem struct {
	Code        string
	Title       string
	Description string
	Status      string
	Visibility  string
	ReporterID  string
	IssueID     string
	IssueTitle  string
	Notes       []string
}

type ProgramItem struct {
	Code            string
	Name            string
	OpdName         string
	Status          string
	ProgressPercent float64
	TargetOutput    string
}

type ProgramDetailItem struct {
	Code            string
	Name            string
	OpdName         string
	Status          string
	ProgressPercent float64
	TargetOutput    string
	TargetBudget    int64
	RealizedBudget  int64
	StartDate       string
	EndDate         string
	Milestones      []string
}

type OpdScorecardItem struct {
	OpdCode           string
	OpdName           string
	TotalPrograms     int
	CompletedPrograms int
	CompletionRate    float64
	AvgProgress       float64
	TotalIssues       int
	ResolvedIssues    int
}
