package httpx

import (
	"errors"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ErrorResponse struct {
	Code      string `json:"code"`
	Message   string `json:"message"`
	RequestID string `json:"request_id"`
}

type AppError struct {
	Status  int
	Code    string
	Message string
}

func (e *AppError) Error() string {
	return e.Message
}

func NewAppError(status int, code, msg string) *AppError {
	return &AppError{
		Status:  status,
		Code:    code,
		Message: msg,
	}
}

func RequestIDMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		reqID := c.Get("X-Request-Id")
		if reqID == "" {
			reqID = uuid.New().String()
		}
		c.Locals("request_id", reqID)
		c.Set("X-Request-Id", reqID)
		return c.Next()
	}
}

func GetRequestID(c *fiber.Ctx) string {
	val, ok := c.Locals("request_id").(string)
	if !ok || val == "" {
		return uuid.New().String()
	}
	return val
}

func RequireBFFKey(expectedKey string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if expectedKey == "" {
			return c.Next()
		}
		apiKey := c.Get("X-BFF-Key")
		if apiKey != expectedKey {
			return c.Status(fiber.StatusForbidden).JSON(ErrorResponse{
				Code:      "FORBIDDEN",
				Message:   "Akses langsung ditolak, wajib lewat BFF",
				RequestID: GetRequestID(c),
			})
		}
		return c.Next()
	}
}

func ErrorHandler(c *fiber.Ctx, err error) error {
	reqID := GetRequestID(c)
	var appErr *AppError
	if errors.As(err, &appErr) {
		return c.Status(appErr.Status).JSON(ErrorResponse{
			Code:      appErr.Code,
			Message:   appErr.Message,
			RequestID: reqID,
		})
	}
	var fiberErr *fiber.Error
	if errors.As(err, &fiberErr) {
		return c.Status(fiberErr.Code).JSON(ErrorResponse{
			Code:      "HTTP_ERROR",
			Message:   fiberErr.Message,
			RequestID: reqID,
		})
	}
	return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{
		Code:      "INTERNAL_SERVER_ERROR",
		Message:   "Terjadi kesalahan internal pada server",
		RequestID: reqID,
	})
}
