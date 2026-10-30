package admin

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
	admin := app.Group("/admin", auth.RequireRole("admin"))
	admin.Get("/overview", h.GetOverview)
	admin.Get("/users", h.ListUsers)
	admin.Get("/productivity", h.GetProductivity)
	admin.Get("/executive-summary", h.GetExecutiveSummary)

	agency := app.Group("/agency", auth.RequireRole("dinas", "admin"))
	agency.Get("/stats", h.GetAgencyStats)
}

func (h *Handler) ListUsers(c *fiber.Ctx) error {
	opd := c.Query("opd")
	res, err := h.service.ListUsers(c.Context(), opd)
	if err != nil {
		return httpx.NewAppError(fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.JSON(fiber.Map{
		"items": res,
		"total": len(res),
	})
}

func (h *Handler) GetOverview(c *fiber.Ctx) error {
	res, err := h.service.GetOverview(c.Context())
	if err != nil {
		return httpx.NewAppError(fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.JSON(res)
}

func (h *Handler) GetProductivity(c *fiber.Ctx) error {
	res, err := h.service.GetProductivityRanking(c.Context())
	if err != nil {
		return httpx.NewAppError(fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.JSON(fiber.Map{
		"ranking": res,
		"total":   len(res),
	})
}

func (h *Handler) GetExecutiveSummary(c *fiber.Ctx) error {
	res, err := h.service.GetExecutiveSummary(c.Context())
	if err != nil {
		return httpx.NewAppError(fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.JSON(res)
}

func (h *Handler) GetAgencyStats(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"active_issues":       8,
		"resolved_issues":     76,
		"overdue_issues":      2,
		"sla_compliance_rate": 92.0,
		"median_response_hrs": 21.0,
	})
}
