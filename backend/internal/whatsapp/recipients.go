package whatsapp

import (
	"context"
	"fmt"
	"net/url"
	"strings"

	"govra/internal/platform/db"
	"govra/internal/platform/phone"
)

type Recipient struct {
	Code  string
	Title string
	Phone string
}

type RecipientFinder interface {
	ByIssue(ctx context.Context, issueID string) ([]Recipient, error)
	PhoneByUser(ctx context.Context, userID string) (string, error)
}

type DBRecipients struct {
	db *db.Database
}

func NewDBRecipients(database *db.Database) *DBRecipients {
	return &DBRecipients{db: database}
}

type restReport struct {
	Code       string  `json:"code"`
	Title      string  `json:"title"`
	ReporterID *string `json:"reporter_id"`
}

type restProfile struct {
	ID    string  `json:"id"`
	Phone *string `json:"phone"`
}

func (r *DBRecipients) ByIssue(ctx context.Context, issueID string) ([]Recipient, error) {
	if r.db == nil || strings.TrimSpace(issueID) == "" {
		return nil, nil
	}
	if r.db.Pool != nil {
		return r.byIssuePool(ctx, issueID)
	}
	if r.db.HasREST() {
		return r.byIssueREST(ctx, issueID)
	}
	return nil, nil
}

func (r *DBRecipients) byIssuePool(ctx context.Context, issueID string) ([]Recipient, error) {
	rows, err := r.db.Pool.Query(ctx, `SELECT r.code, COALESCE(r.title,''), COALESCE(p.phone,'')
		FROM app.reports r JOIN app.profiles p ON p.id = r.reporter_id
		WHERE r.issue_id::text = $1 OR r.id::text = $1`, issueID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var raw []Recipient
	for rows.Next() {
		var rec Recipient
		if err := rows.Scan(&rec.Code, &rec.Title, &rec.Phone); err == nil {
			raw = append(raw, rec)
		}
	}
	return cleanRecipients(raw), nil
}

func (r *DBRecipients) byIssueREST(ctx context.Context, issueID string) ([]Recipient, error) {
	escaped := url.QueryEscape(issueID)
	var reports []restReport
	endpoint := fmt.Sprintf("reports?select=code,title,reporter_id&or=(issue_id.eq.%s,id.eq.%s)", escaped, escaped)
	if err := r.db.PostgRESTGet(ctx, endpoint, &reports); err != nil {
		return nil, err
	}
	ids := make([]string, 0, len(reports))
	seen := make(map[string]bool)
	for _, rep := range reports {
		if rep.ReporterID != nil && !seen[*rep.ReporterID] {
			seen[*rep.ReporterID] = true
			ids = append(ids, *rep.ReporterID)
		}
	}
	if len(ids) == 0 {
		return nil, nil
	}
	var profiles []restProfile
	if err := r.db.PostgRESTGet(ctx, fmt.Sprintf("profiles?select=id,phone&id=in.(%s)", strings.Join(ids, ",")), &profiles); err != nil {
		return nil, err
	}
	phones := make(map[string]string, len(profiles))
	for _, p := range profiles {
		if p.Phone != nil {
			phones[p.ID] = *p.Phone
		}
	}
	var raw []Recipient
	for _, rep := range reports {
		if rep.ReporterID == nil {
			continue
		}
		raw = append(raw, Recipient{Code: rep.Code, Title: rep.Title, Phone: phones[*rep.ReporterID]})
	}
	return cleanRecipients(raw), nil
}

func (r *DBRecipients) PhoneByUser(ctx context.Context, userID string) (string, error) {
	if r.db == nil || strings.TrimSpace(userID) == "" {
		return "", nil
	}
	if r.db.Pool != nil {
		var raw string
		err := r.db.Pool.QueryRow(ctx, `SELECT COALESCE(phone,'') FROM app.profiles WHERE id::text = $1`, userID).Scan(&raw)
		if err != nil {
			return "", err
		}
		normalized, _ := phone.Normalize(raw)
		return normalized, nil
	}
	if r.db.HasREST() {
		var profiles []restProfile
		if err := r.db.PostgRESTGet(ctx, fmt.Sprintf("profiles?select=id,phone&id=eq.%s&limit=1", url.QueryEscape(userID)), &profiles); err != nil {
			return "", err
		}
		if len(profiles) == 0 || profiles[0].Phone == nil {
			return "", nil
		}
		normalized, _ := phone.Normalize(*profiles[0].Phone)
		return normalized, nil
	}
	return "", nil
}

func cleanRecipients(raw []Recipient) []Recipient {
	seen := make(map[string]bool)
	var out []Recipient
	for _, rec := range raw {
		normalized, ok := phone.Normalize(rec.Phone)
		if !ok {
			continue
		}
		key := normalized + "|" + rec.Code
		if seen[key] {
			continue
		}
		seen[key] = true
		rec.Phone = normalized
		out = append(out, rec)
	}
	return out
}
