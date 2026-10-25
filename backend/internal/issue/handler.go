package issue

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
	app.Get("/issues", h.ListIssues)
	app.Get("/issues/:id", h.GetIssueDetail)
	app.Post("/issues/:id/support", auth.RequireRole("pelapor", "admin"), h.SupportIssue)

	agency := app.Group("/agency", auth.RequireRole("dinas", "admin"))
	agency.Get("/issues", h.ListAgencyIssues)
	agency.Get("/issues/:id", h.GetAgencyIssueDetail)
	agency.Post("/issues/:id/transitions", h.Transition)
	agency.Post("/issues/:id/evidence", h.UploadEvidence)

	admin := app.Group("/admin", auth.RequireRole("admin"))
	admin.Get("/verification", h.ListVerificationQueue)
	admin.Post("/issues/:id/route", h.RouteIssue)
	admin.Post("/issues/:id/reject", h.RejectIssue)

	app.Get("/map/distribution", h.GetMapDistribution)
}

func (h *Handler) ListIssues(c *fiber.Ctx) error {
	opd := c.Query("opd")
	status := c.Query("status")
	q := c.Query("q")
	list, err := h.service.ListIssues(c.Context(), opd, status, q)
	if err != nil {
		return httpx.NewAppError(fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.JSON(fiber.Map{"items": list, "total": len(list)})
}

func (h *Handler) GetIssueDetail(c *fiber.Ctx) error {
	id := c.Params("id")
	iss, err := h.service.GetIssueByID(c.Context(), id)
	if err != nil {
		return httpx.NewAppError(fiber.StatusNotFound, "NOT_FOUND", "Isu tidak ditemukan")
	}
	return c.JSON(iss)
}

func (h *Handler) SupportIssue(c *fiber.Ctx) error {
	id := c.Params("id")
	userID := auth.CurrentUserID(c)
	count, err := h.service.SupportIssue(c.Context(), id, userID)
	if err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "SUPPORT_FAILED", err.Error())
	}
	return c.JSON(fiber.Map{
		"supported":              true,
		"unique_reporters_count": count,
		"message":                "Dukungan berhasil ditambahkan untuk menaikkan urgensi penanganan isu ini",
	})
}

func (h *Handler) ListAgencyIssues(c *fiber.Ctx) error {
	opdID := auth.CurrentOpdID(c)
	status := c.Query("status")
	q := c.Query("q")
	list, err := h.service.ListIssues(c.Context(), opdID, status, q)
	if err != nil {
		return httpx.NewAppError(fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.JSON(fiber.Map{"items": list, "total": len(list)})
}

func (h *Handler) GetAgencyIssueDetail(c *fiber.Ctx) error {
	return h.GetIssueDetail(c)
}

func (h *Handler) Transition(c *fiber.Ctx) error {
	id := c.Params("id")
	var req TransitionRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "BAD_REQUEST", "Format permintaan tidak valid")
	}
	displayName, _ := c.Locals("display_name").(string)
	opdID := auth.CurrentOpdID(c)
	if err := h.service.Transition(c.Context(), id, req, displayName, opdID); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "TRANSITION_FAILED", err.Error())
	}
	return c.JSON(fiber.Map{"success": true, "target_status": req.TargetStatus})
}

func (h *Handler) UploadEvidence(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"id":  "ev-1",
		"url": "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80",
	})
}

func (h *Handler) ListVerificationQueue(c *fiber.Ctx) error {
	list, err := h.service.ListVerificationQueue(c.Context())
	if err != nil {
		return httpx.NewAppError(fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.JSON(fiber.Map{"items": list, "total": len(list)})
}

func (h *Handler) RouteIssue(c *fiber.Ctx) error {
	id := c.Params("id")
	var req RouteIssueRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "BAD_REQUEST", "Format permintaan tidak valid")
	}
	if err := h.service.RouteIssue(c.Context(), id, req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "ROUTE_FAILED", err.Error())
	}
	return c.JSON(fiber.Map{"routed": true, "issue_id": id})
}

func (h *Handler) RejectIssue(c *fiber.Ctx) error {
	id := c.Params("id")
	var req RejectIssueRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "BAD_REQUEST", "Format permintaan tidak valid")
	}
	if err := h.service.RejectIssue(c.Context(), id, req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "REJECT_FAILED", err.Error())
	}
	return c.JSON(fiber.Map{"rejected": true, "issue_id": id})
}

func (h *Handler) GetMapDistribution(c *fiber.Ctx) error {
	role := auth.CurrentRole(c)
	opdID := auth.CurrentOpdID(c)
	points, err := h.service.GetMapDistribution(c.Context(), role, opdID)
	if err != nil {
		return httpx.NewAppError(fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.JSON(fiber.Map{"points": points, "total": len(points)})
}
