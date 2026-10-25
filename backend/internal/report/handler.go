package report

import (
	"github.com/gofiber/fiber/v2"
	"govra/internal/platform/auth"
	"govra/internal/platform/httpx"
)

type Handler struct {
	service Service
}

func NewHandler(s Service) *Handler {
	return &Handler{service: s}
}

func (h *Handler) RegisterRoutes(app fiber.Router) {
	app.Post("/reports", auth.RequireRole("pelapor", "admin"), h.CreateReport)
	app.Post("/reports/duplicate-suggestions", h.GetDuplicateSuggestions)
	app.Post("/reports/speech-to-text", h.TranscribeVoiceNote)

	app.Get("/me/reports", auth.RequireRole("pelapor", "admin"), h.ListMyReports)
	app.Get("/me/reports/:code", auth.RequireRole("pelapor", "admin"), h.GetMyReport)
	app.Post("/me/reports/:code/resolution-feedback", auth.RequireRole("pelapor", "admin"), h.SubmitFeedback)
}

func (h *Handler) CreateReport(c *fiber.Ctx) error {
	var req CreateReportRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "BAD_REQUEST", "Format permintaan tidak valid")
	}
	reporterID := auth.CurrentUserID(c)
	displayName, _ := c.Locals("display_name").(string)

	rep, err := h.service.CreateReport(c.Context(), req, reporterID, displayName)
	if err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "CREATE_FAILED", err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"code":       rep.Code,
		"id":         rep.ID,
		"status":     rep.Status,
		"created_at": rep.CreatedAt,
	})
}

func (h *Handler) GetDuplicateSuggestions(c *fiber.Ctx) error {
	var req DuplicateQuery
	if err := c.BodyParser(&req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "BAD_REQUEST", "Format permintaan tidak valid")
	}
	res, err := h.service.GetDuplicateSuggestions(c.Context(), req)
	if err != nil {
		return httpx.NewAppError(fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.JSON(fiber.Map{"suggestions": res})
}

func (h *Handler) TranscribeVoiceNote(c *fiber.Ctx) error {
	var req SpeechToTextRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "BAD_REQUEST", "Format permintaan tidak valid")
	}
	transcript, err := h.service.TranscribeVoiceNote(c.Context(), req.AudioBase64, req.MimeType)
	if err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "STT_FAILED", "Gagal mentranskripsi suara: "+err.Error())
	}
	return c.JSON(SpeechToTextResponse{Transcript: transcript})
}

func (h *Handler) ListMyReports(c *fiber.Ctx) error {
	reporterID := auth.CurrentUserID(c)
	list, err := h.service.ListMyReports(c.Context(), reporterID)
	if err != nil {
		return httpx.NewAppError(fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.JSON(fiber.Map{"items": list, "total": len(list)})
}

func (h *Handler) GetMyReport(c *fiber.Ctx) error {
	code := c.Params("code")
	reporterID := auth.CurrentUserID(c)
	role := auth.CurrentRole(c)

	rep, err := h.service.GetReportByCode(c.Context(), code, reporterID, role)
	if err != nil {
		return httpx.NewAppError(fiber.StatusNotFound, "NOT_FOUND", err.Error())
	}
	return c.JSON(rep)
}

func (h *Handler) SubmitFeedback(c *fiber.Ctx) error {
	code := c.Params("code")
	var req FeedbackRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "BAD_REQUEST", "Format permintaan tidak valid")
	}
	if err := h.service.SubmitFeedback(c.Context(), code, req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "FEEDBACK_FAILED", err.Error())
	}
	return c.JSON(fiber.Map{"status": "FEEDBACK_RECORDED", "code": code})
}
