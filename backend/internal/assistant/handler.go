package assistant

import (
	"errors"
	"strings"

	"github.com/gofiber/fiber/v2"
	"govra/internal/platform/httpx"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	router.Post("/assistant/messages", h.SendMessage)
}

func (h *Handler) SendMessage(c *fiber.Ctx) error {
	var req ChatRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "BAD_REQUEST", "Format permintaan tidak valid")
	}
	if len(req.Messages) == 0 || len(req.Messages) > 20 {
		return httpx.NewAppError(fiber.StatusBadRequest, "INVALID_REQUEST", "Jumlah pesan harus antara 1 sampai 20")
	}
	for _, m := range req.Messages {
		r := strings.ToUpper(m.Role)
		if r != "USER" && r != "ASSISTANT" {
			return httpx.NewAppError(fiber.StatusBadRequest, "INVALID_ROLE", "Role pesan hanya boleh USER atau ASSISTANT")
		}
		if strings.TrimSpace(m.Content) == "" {
			return httpx.NewAppError(fiber.StatusBadRequest, "EMPTY_CONTENT", "Konten pesan tidak boleh kosong")
		}
	}
	last := req.Messages[len(req.Messages)-1]
	if strings.ToUpper(last.Role) != "USER" {
		return httpx.NewAppError(fiber.StatusBadRequest, "INVALID_LAST_MESSAGE", "Pesan terakhir harus memiliki peran USER")
	}
	userID := extractUserID(c)
	ip := extractClientIP(c)
	res, err := h.service.AnswerQuestion(c.Context(), &req, userID, ip)
	if err != nil {
		return mapServiceError(err)
	}
	return c.JSON(res)
}

func extractUserID(c *fiber.Ctx) string {
	val, ok := c.Locals("user_id").(string)
	if !ok || val == "system-bff" {
		return ""
	}
	return val
}

func extractClientIP(c *fiber.Ctx) string {
	forwarded := c.Get("X-Forwarded-For")
	if forwarded != "" {
		parts := strings.Split(forwarded, ",")
		return strings.TrimSpace(parts[0])
	}
	ip := c.IP()
	if ip == "" {
		return "127.0.0.1"
	}
	return ip
}

func mapServiceError(err error) error {
	if errors.Is(err, ErrRateLimited) {
		return httpx.NewAppError(fiber.StatusTooManyRequests, "RATE_LIMITED", "Terlalu banyak permintaan. Coba lagi beberapa menit lagi.")
	}
	if errors.Is(err, ErrEmptyMessages) || errors.Is(err, ErrLastNotUser) || errors.Is(err, ErrInvalidInput) {
		return httpx.NewAppError(fiber.StatusBadRequest, "BAD_REQUEST", err.Error())
	}
	return httpx.NewAppError(fiber.StatusInternalServerError, "INTERNAL_ERROR", "Gagal memproses respons asisten")
}
