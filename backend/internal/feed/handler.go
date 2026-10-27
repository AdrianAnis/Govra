package feed

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
	app.Get("/feeds", h.ListFeeds)
	app.Post("/feeds", auth.RequireRole("pelapor", "admin", "dinas"), h.CreateFeed)
	app.Post("/feeds/:id/like", auth.RequireRole("pelapor", "admin", "dinas"), h.ToggleLike)
	app.Post("/feeds/:id/support", auth.RequireRole("pelapor", "admin", "dinas"), h.ToggleSupport)
	app.Get("/feeds/:id/supporters", h.ListSupporters)
	app.Get("/feeds/:id/comments", h.ListComments)
	app.Post("/feeds/:id/comments", auth.RequireRole("pelapor", "admin", "dinas"), h.AddComment)
	app.Post("/feeds/:id/share", h.ShareFeed)
}

func (h *Handler) ListFeeds(c *fiber.Ctx) error {
	userID := auth.CurrentUserID(c)
	tab := c.Query("tab", "trending")
	list, err := h.service.ListFeeds(c.Context(), userID, tab)
	if err != nil {
		return httpx.NewAppError(fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.JSON(fiber.Map{"items": list, "total": len(list)})
}

func (h *Handler) CreateFeed(c *fiber.Ctx) error {
	var req CreateFeedRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "BAD_REQUEST", "Format permintaan tidak valid")
	}
	authorID := auth.CurrentUserID(c)
	authorName, _ := c.Locals("display_name").(string)
	if authorName == "" {
		authorName = "Warga Peduli"
	}
	item, err := h.service.CreateFeed(c.Context(), req, authorID, authorName, "")
	if err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "CREATE_FEED_FAILED", err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(item)
}

func (h *Handler) ToggleLike(c *fiber.Ctx) error {
	feedID := c.Params("id")
	userID := auth.CurrentUserID(c)
	liked, count, err := h.service.ToggleLike(c.Context(), feedID, userID)
	if err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "LIKE_FAILED", err.Error())
	}
	return c.JSON(fiber.Map{"liked": liked, "likes_count": count})
}

func (h *Handler) ToggleSupport(c *fiber.Ctx) error {
	feedID := c.Params("id")
	userID := auth.CurrentUserID(c)
	userName, _ := c.Locals("display_name").(string)
	if userName == "" {
		userName = "Warga Peduli"
	}
	supported, count, err := h.service.ToggleSupport(c.Context(), feedID, userID, userName)
	if err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "SUPPORT_FAILED", err.Error())
	}
	return c.JSON(fiber.Map{"supported": supported, "support_count": count})
}

func (h *Handler) ListSupporters(c *fiber.Ctx) error {
	feedID := c.Params("id")
	list, err := h.service.ListSupporters(c.Context(), feedID)
	if err != nil {
		return httpx.NewAppError(fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.JSON(fiber.Map{"items": list, "total": len(list)})
}

func (h *Handler) ListComments(c *fiber.Ctx) error {
	feedID := c.Params("id")
	list, err := h.service.ListComments(c.Context(), feedID)
	if err != nil {
		return httpx.NewAppError(fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.JSON(fiber.Map{"items": list, "total": len(list)})
}

func (h *Handler) AddComment(c *fiber.Ctx) error {
	feedID := c.Params("id")
	var req CreateCommentRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "BAD_REQUEST", "Format permintaan tidak valid")
	}
	userID := auth.CurrentUserID(c)
	authorName, _ := c.Locals("display_name").(string)
	if authorName == "" {
		authorName = "Warga Peduli"
	}
	item, err := h.service.AddComment(c.Context(), feedID, userID, authorName, req.Content)
	if err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "COMMENT_FAILED", err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(item)
}

func (h *Handler) ShareFeed(c *fiber.Ctx) error {
	feedID := c.Params("id")
	count, err := h.service.ShareFeed(c.Context(), feedID)
	if err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "SHARE_FAILED", err.Error())
	}
	return c.JSON(fiber.Map{"shares_count": count})
}
