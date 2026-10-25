package issue

import (
	"context"
	"errors"
	"time"
)

type MapPoint struct {
	ID            string        `json:"id"`
	Code          string        `json:"code"`
	Title         string        `json:"title"`
	OpdID         string        `json:"opd_id"`
	OpdName       string        `json:"opd_name"`
	Status        IssueStatus   `json:"status"`
	Urgency       Urgency       `json:"urgency"`
	Point         LocationPoint `json:"point"`
	AddressDetail string        `json:"address_detail"`
	CoverPhotoURL string        `json:"cover_photo_url,omitempty"`
}

type Service interface {
	ListIssues(ctx context.Context, opdID, status, q string) ([]Issue, error)
	GetIssueByID(ctx context.Context, id string) (*Issue, error)
	SupportIssue(ctx context.Context, issueID, userID string) (int, error)
	Transition(ctx context.Context, issueID string, req TransitionRequest, authorName, authorOpd string) error
	RouteIssue(ctx context.Context, issueID string, req RouteIssueRequest) error
	RejectIssue(ctx context.Context, issueID string, req RejectIssueRequest) error
	ListVerificationQueue(ctx context.Context) ([]Issue, error)
	GetMapDistribution(ctx context.Context, role, userOpdID string) ([]MapPoint, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) ListIssues(ctx context.Context, opdID, status, q string) ([]Issue, error) {
	return s.repo.ListIssues(ctx, opdID, status, q)
}

func (s *service) GetIssueByID(ctx context.Context, id string) (*Issue, error) {
	iss, err := s.repo.GetIssueByID(ctx, id)
	if err != nil {
		return nil, err
	}
	iss.IsOverdue = time.Now().After(iss.SlaDueAt) && iss.Status != StatusSelesai
	return iss, nil
}

func (s *service) SupportIssue(ctx context.Context, issueID, userID string) (int, error) {
	count, err := s.repo.SupportIssue(ctx, issueID, userID)
	if err != nil {
		return 0, err
	}
	iss, err := s.repo.GetIssueByID(ctx, issueID)
	if err == nil {
		if count >= 10 {
			iss.Urgency = UrgencyUrgent
		} else if count >= 5 {
			iss.Urgency = UrgencyTinggi
		}
	}
	return count, nil
}

func (s *service) Transition(ctx context.Context, issueID string, req TransitionRequest, authorName, authorOpd string) error {
	iss, err := s.repo.GetIssueByID(ctx, issueID)
	if err != nil {
		return err
	}
	if authorOpd != "" && iss.OpdID != authorOpd {
		return errors.New("dinas hanya berwenang menangani isu milik instansinya")
	}

	valid := s.validateTransition(iss.Status, req.TargetStatus)
	if !valid {
		return errors.New("transisi status tidak diizinkan")
	}

	if req.TargetStatus == StatusSelesai && len(req.EvidencePhotos) == 0 {
		return errors.New("penyelesaian isu wajib menyertakan minimal 1 foto bukti")
	}
	if req.TargetStatus == StatusDitolak && req.RejectionReason == "" {
		return errors.New("penolakan isu wajib menyertakan alasan penolakan")
	}

	evt := IssueEvent{
		FromStatus:     string(iss.Status),
		ToStatus:       string(req.TargetStatus),
		AuthorName:     authorName,
		Note:           req.Response,
		EvidencePhotos: req.EvidencePhotos,
	}
	if err := s.repo.AddEvent(ctx, issueID, evt); err != nil {
		return err
	}
	return s.repo.UpdateStatus(ctx, issueID, req.TargetStatus, "")
}

func (s *service) validateTransition(current, target IssueStatus) bool {
	switch current {
	case StatusDiteruskan:
		return target == StatusDiproses || target == StatusDitolak || target == StatusDialihkan
	case StatusDiproses:
		return target == StatusSelesai || target == StatusDitolak || target == StatusDialihkan
	case StatusDibukaUlang:
		return target == StatusDiproses
	default:
		return false
	}
}

func (s *service) RouteIssue(ctx context.Context, issueID string, req RouteIssueRequest) error {
	if req.OpdID == "" {
		return errors.New("opd tujuan wajib dipilih")
	}
	return s.repo.RouteIssue(ctx, issueID, req.OpdID, req.CategoryID, req.Note)
}

func (s *service) RejectIssue(ctx context.Context, issueID string, req RejectIssueRequest) error {
	evt := IssueEvent{
		ToStatus:   string(StatusDitolak),
		AuthorName: "Administrator Pusat",
		Note:       req.Reason + ": " + req.Note,
	}
	_ = s.repo.AddEvent(ctx, issueID, evt)
	return s.repo.UpdateStatus(ctx, issueID, StatusDitolak, "")
}

func (s *service) ListVerificationQueue(ctx context.Context) ([]Issue, error) {
	return s.repo.ListVerificationQueue(ctx)
}

func (s *service) GetMapDistribution(ctx context.Context, role, userOpdID string) ([]MapPoint, error) {
	opdFilter := ""
	if role == "dinas" {
		opdFilter = userOpdID
	}
	issues, err := s.repo.ListIssues(ctx, opdFilter, "", "")
	if err != nil {
		return nil, err
	}
	var points []MapPoint
	for _, iss := range issues {
		points = append(points, MapPoint{
			ID:            iss.ID,
			Code:          iss.Code,
			Title:         iss.Title,
			OpdID:         iss.OpdID,
			OpdName:       iss.OpdName,
			Status:        iss.Status,
			Urgency:       iss.Urgency,
			Point:         iss.Point,
			AddressDetail: iss.AddressDetail,
			CoverPhotoURL: iss.CoverPhotoURL,
		})
	}
	return points, nil
}
