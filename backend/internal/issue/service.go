package issue

import (
	"context"
	"errors"
	"fmt"
)

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
	return s.repo.GetIssueByID(ctx, id)
}

func (s *service) SupportIssue(ctx context.Context, issueID, userID string) (int, error) {
	return s.repo.SupportIssue(ctx, issueID, userID)
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
	if req.TargetStatus == StatusDiproses {
		if req.StartedAt == nil || req.EstimatedCompletionAt == nil {
			return errors.New("waktu mulai dan estimasi selesai pengerjaan wajib diisi")
		}
		if !req.EstimatedCompletionAt.After(*req.StartedAt) {
			return errors.New("estimasi selesai harus lebih lambat dari waktu mulai pengerjaan")
		}
	}

	note := req.Response
	if req.TargetStatus == StatusDiproses && req.StartedAt != nil && req.EstimatedCompletionAt != nil {
		scheduleInfo := fmt.Sprintf("[JADWAL PENGERJAAN] Mulai: %s · Estimasi Selesai: %s", req.StartedAt.Format("02/01/2006 15:04"), req.EstimatedCompletionAt.Format("02/01/2006 15:04"))
		if note != "" {
			note = scheduleInfo + "\n\nCatatan: " + note
		} else {
			note = scheduleInfo
		}
	}

	evt := IssueEvent{
		FromStatus:     string(iss.Status),
		ToStatus:       string(req.TargetStatus),
		AuthorName:     authorName,
		Note:           note,
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
	opd := req.OpdID
	if opd == "" {
		opd = req.OpdCode
	}
	if opd == "" {
		return errors.New("opd tujuan wajib dipilih")
	}
	cat := req.CategoryID
	if cat == "" {
		cat = req.CategoryCode
	}
	return s.repo.RouteIssue(ctx, issueID, opd, cat, req.Note)
}

func (s *service) RejectIssue(ctx context.Context, issueID string, req RejectIssueRequest) error {
	if req.Reason == "" {
		return errors.New("alasan penolakan wajib diisi")
	}
	return s.repo.RejectIssue(ctx, issueID, req)
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
			Description:   iss.Summary,
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
