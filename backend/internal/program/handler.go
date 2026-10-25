package program

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
	app.Get("/region", h.GetRegion)
	app.Get("/districts", h.ListDistricts)
	app.Get("/goals", h.ListGoals)
	app.Get("/opds", h.ListOpds)
	app.Get("/opds/:slug", h.GetOpdBySlug)

	app.Get("/programs", h.ListPrograms)
	app.Get("/programs/:code", h.GetProgramByCode)
	app.Post("/programs", auth.RequireRole("admin", "kepala_daerah"), h.CreateProgram)
	app.Post("/programs/:code/approve", auth.RequireRole("admin"), h.ApproveProgram)
	app.Post("/programs/:code/updates", auth.RequireRole("dinas", "admin"), h.AddUpdate)

	app.Get("/scorecard", h.GetScorecard)
	app.Get("/methodology", h.GetMethodology)
}

func (h *Handler) GetRegion(c *fiber.Ctx) error {
	res, err := h.service.GetRegion(c.Context())
	if err != nil {
		return httpx.NewAppError(fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.JSON(res)
}

func (h *Handler) ListDistricts(c *fiber.Ctx) error {
	res, err := h.service.ListDistricts(c.Context())
	if err != nil {
		return httpx.NewAppError(fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.JSON(res)
}

func (h *Handler) ListGoals(c *fiber.Ctx) error {
	res, err := h.service.ListGoals(c.Context())
	if err != nil {
		return httpx.NewAppError(fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.JSON(res)
}

func (h *Handler) ListOpds(c *fiber.Ctx) error {
	res, err := h.service.ListOpds(c.Context())
	if err != nil {
		return httpx.NewAppError(fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.JSON(res)
}

func (h *Handler) GetOpdBySlug(c *fiber.Ctx) error {
	slug := c.Params("slug")
	res, err := h.service.GetOpdBySlug(c.Context(), slug)
	if err != nil {
		return httpx.NewAppError(fiber.StatusNotFound, "OPD_NOT_FOUND", "OPD tidak ditemukan")
	}
	return c.JSON(res)
}

func (h *Handler) ListPrograms(c *fiber.Ctx) error {
	opd := c.Query("opd")
	status := c.Query("status")
	district := c.Query("district")
	q := c.Query("q")
	res, err := h.service.ListPrograms(c.Context(), opd, status, district, q)
	if err != nil {
		return httpx.NewAppError(fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.JSON(fiber.Map{
		"items": res,
		"total": len(res),
	})
}

func (h *Handler) GetProgramByCode(c *fiber.Ctx) error {
	code := c.Params("code")
	res, err := h.service.GetProgramByCode(c.Context(), code)
	if err != nil {
		return httpx.NewAppError(fiber.StatusNotFound, "NOT_FOUND", "Program kerja tidak ditemukan")
	}
	return c.JSON(res)
}

func (h *Handler) CreateProgram(c *fiber.Ctx) error {
	var req CreateProgramRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "BAD_REQUEST", "Format permintaan tidak valid")
	}
	role := auth.CurrentRole(c)
	res, err := h.service.CreateProgram(c.Context(), req, role)
	if err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "CREATE_FAILED", err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(res)
}

func (h *Handler) ApproveProgram(c *fiber.Ctx) error {
	code := c.Params("code")
	if err := h.service.ApproveProgram(c.Context(), code); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "APPROVE_FAILED", err.Error())
	}
	return c.JSON(fiber.Map{"approved": true, "code": code})
}

func (h *Handler) AddUpdate(c *fiber.Ctx) error {
	code := c.Params("code")
	var req CreateUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "BAD_REQUEST", "Format permintaan tidak valid")
	}
	displayName := c.Locals("display_name")
	authorStr, _ := displayName.(string)
	if authorStr == "" {
		authorStr = "Dinas Terkait"
	}
	if err := h.service.AddUpdate(c.Context(), code, req, authorStr); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "ADD_UPDATE_FAILED", err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "Dokumentasi perkembangan proker berhasil diunggah"})
}

func (h *Handler) GetScorecard(c *fiber.Ctx) error {
	res, err := h.service.GetScorecard(c.Context())
	if err != nil {
		return httpx.NewAppError(fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.JSON(res)
}

func (h *Handler) GetMethodology(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"title":       "Metodologi Rapor Kinerja Kepala Daerah Govra",
		"version":     "1.0.0",
		"description": "Perhitungan indikator transparansi berbasis tanggal pelaksanaan dan konfirmasi penyelesaian warga.",
	})
}
