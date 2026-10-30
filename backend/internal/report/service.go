package report

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"govra/internal/platform/ai"
)

type Service interface {
	CreateReport(ctx context.Context, req CreateReportRequest, reporterID, reporterName string) (*Report, error)
	GetReportByCode(ctx context.Context, code, requesterID, role string) (*Report, error)
	ListMyReports(ctx context.Context, reporterID string) ([]Report, error)
	GetDuplicateSuggestions(ctx context.Context, query DuplicateQuery) ([]DuplicateSuggestion, error)
	TranscribeVoiceNote(ctx context.Context, audioBase64, mimeType string) (string, error)
	SubmitFeedback(ctx context.Context, code string, req FeedbackRequest) error
	CheckContent(ctx context.Context, text string) (*ai.ModerationResult, error)
}

type service struct {
	repo     Repository
	aiClient *ai.Client
}

func NewService(repo Repository, aiClient *ai.Client) Service {
	return &service{
		repo:     repo,
		aiClient: aiClient,
	}
}

func (s *service) generateCode() string {
	now := time.Now()
	b := make([]byte, 2)
	_, _ = rand.Read(b)
	randSuffix := strings.ToUpper(hex.EncodeToString(b))
	return fmt.Sprintf("GVR-%02d%02d-%s", now.Year()%100, now.Month(), randSuffix)
}

func (s *service) CreateReport(ctx context.Context, req CreateReportRequest, reporterID, reporterName string) (*Report, error) {
	if req.Description == "" && req.VoiceNoteData == "" {
		return nil, errors.New("deskripsi laporan atau rekaman suara wajib disertakan")
	}

	transcript := ""
	if req.VoiceNoteData != "" {
		t, err := s.aiClient.TranscribeAudio(ctx, req.VoiceNoteData, req.VoiceMimeType)
		if err == nil && t != "" {
			transcript = t
			if req.Description == "" {
				req.Description = t
			}
		}
	}

	if req.Title == "" {
		words := strings.Fields(req.Description)
		if len(words) > 6 {
			req.Title = strings.Join(words[:6], " ") + "..."
		} else {
			req.Title = req.Description
		}
	}

	rep := &Report{
		Code:                s.generateCode(),
		ReporterID:          reporterID,
		ReporterName:        reporterName,
		DistrictID:          req.DistrictID,
		DistrictName:        "Kecamatan Terpilih",
		VillageID:           req.VillageID,
		VillageName:         "Kelurahan Terpilih",
		Title:               req.Title,
		Description:         req.Description,
		VoiceNoteTranscript: transcript,
		Lat:                 req.Lat,
		Lng:                 req.Lng,
		AddressDetail:       req.AddressDetail,
		Visibility:          req.Visibility,
		Status:              StatusDiajukan,
		Attachments:         req.Attachments,
		Timeline: []TimelineEvent{
			{
				Status:    "DIAJUKAN",
				Title:     "Laporan Berhasil Diajukan",
				Note:      "Laporan telah tersimpan dan menunggu approval verifikasi dari Administrator Pusat.",
				CreatedAt: time.Now(),
			},
		},
	}

	topic := "Umum"
	triageRes, err := s.aiClient.ClassifyReport(ctx, rep.Title, rep.Description, rep.DistrictName, rep.VillageName)
	if err == nil && triageRes != nil {
		rep.AiOpdCode = triageRes.OpdCode
		rep.AiOpdName = triageRes.OpdName
		rep.AiCategoryCode = triageRes.CategoryCode
		rep.AiCategoryName = triageRes.CategoryName
		rep.AiConfidence = triageRes.Confidence
		rep.AiSummary = triageRes.Summary
		rep.IsUnregisteredOpd = triageRes.IsUnregisteredOpd
		topic = triageRes.CategoryCode

		if !triageRes.IsUnregisteredOpd && triageRes.OpdCode != "TIDAK_TERDAFTAR" {
			rep.OpdID = triageRes.OpdCode
			rep.OpdName = triageRes.OpdName
			rep.CategoryID = triageRes.CategoryCode
			rep.CategoryName = triageRes.CategoryName
		} else {
			rep.OpdID = ""
			rep.OpdName = "Tidak Masuk ke Dinas Manapun yang Terdaftar"
			rep.CategoryID = ""
			rep.CategoryName = "Tidak Terdaftar"
		}
	}

	issueID, _ := s.repo.FindMatchingIssueOrCluster(ctx, rep.Title, rep.Description, topic, rep.Lat, rep.Lng, rep.DistrictID, rep.VillageID, rep.OpdID, rep.CategoryID)
	if issueID != "" {
		rep.IssueID = issueID
	}

	if err := s.repo.SaveReport(ctx, rep); err != nil {
		return nil, err
	}
	return rep, nil
}

func (s *service) GetReportByCode(ctx context.Context, code, requesterID, role string) (*Report, error) {
	rep, err := s.repo.GetReportByCode(ctx, code)
	if err != nil {
		return nil, err
	}
	if rep.Visibility == VisibilityConfidential && role != "admin" && rep.ReporterID != requesterID {
		return nil, errors.New("laporan bersifat rahasia")
	}
	return rep, nil
}

func (s *service) ListMyReports(ctx context.Context, reporterID string) ([]Report, error) {
	return s.repo.ListReportsByReporter(ctx, reporterID)
}

func (s *service) GetDuplicateSuggestions(ctx context.Context, query DuplicateQuery) ([]DuplicateSuggestion, error) {
	openReps, err := s.repo.ListOpenReports(ctx)
	if err != nil {
		return nil, err
	}
	var res []DuplicateSuggestion
	for _, r := range openReps {
		topicSim := ai.CalculateTopicSimilarity(query.Title, query.Title, r.Title, r.Description)
		locSim := ai.CalculateLocationSimilarity(query.Lat, query.Lng, r.Lat, r.Lng)
		eval := ai.EvaluateSimilarity(topicSim, locSim)
		if eval.IsSimilar {
			res = append(res, DuplicateSuggestion{
				IssueID:         r.ID,
				IssueCode:       r.Code,
				Title:           r.Title,
				Summary:         r.Description,
				SimilarityScore: eval.TotalSimilarity,
				DistanceMeters:  100.0,
				ReportersCount:  2,
			})
			if len(res) >= 3 {
				break
			}
		}
	}
	return res, nil
}

func (s *service) TranscribeVoiceNote(ctx context.Context, audioBase64, mimeType string) (string, error) {
	return s.aiClient.TranscribeAudio(ctx, audioBase64, mimeType)
}

func (s *service) SubmitFeedback(ctx context.Context, code string, req FeedbackRequest) error {
	return s.repo.SaveFeedback(ctx, code, req.Confirmed, req.Note)
}

func (s *service) CheckContent(ctx context.Context, text string) (*ai.ModerationResult, error) {
	return s.aiClient.CheckContentModeration(ctx, text)
}
