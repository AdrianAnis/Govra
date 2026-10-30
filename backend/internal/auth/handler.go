package auth

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
	g := app.Group("/auth")
	g.Post("/register", h.Register)
	g.Post("/verify-registration", h.VerifyRegistration)
	g.Post("/login", h.Login)
	g.Post("/send-otp", h.SendOTP)
	g.Post("/verify-otp", h.VerifyOTP)
	g.Post("/forgot-password", h.ForgotPassword)
	g.Post("/reset-password", h.ResetPassword)

	app.Get("/me", h.GetMe)
	app.Get("/me/export", h.ExportMyData)
}

func (h *Handler) Register(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "BAD_REQUEST", "Format permintaan tidak valid")
	}
	res, err := h.service.Register(c.Context(), req)
	if err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "REGISTER_FAILED", err.Error())
	}
	return c.Status(fiber.StatusOK).JSON(res)
}

func (h *Handler) VerifyRegistration(c *fiber.Ctx) error {
	var req VerifyOTPRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "BAD_REQUEST", "Format permintaan tidak valid")
	}
	if err := h.service.VerifyRegisterOTP(c.Context(), req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "VERIFY_FAILED", err.Error())
	}
	return c.JSON(fiber.Map{
		"verified": true,
		"message":  "Akun berhasil diaktifkan. Silakan masuk.",
	})
}

func (h *Handler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "BAD_REQUEST", "Format permintaan tidak valid")
	}
	res, err := h.service.Login(c.Context(), req)
	if err != nil {
		return httpx.NewAppError(fiber.StatusUnauthorized, "LOGIN_FAILED", err.Error())
	}
	return c.JSON(res)
}

func (h *Handler) SendOTP(c *fiber.Ctx) error {
	var req SendOTPRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "BAD_REQUEST", "Format permintaan tidak valid")
	}
	if err := h.service.SendOTP(c.Context(), req.Email, req.Purpose); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "SEND_OTP_FAILED", err.Error())
	}
	return c.JSON(fiber.Map{"message": "Kode OTP berhasil dikirimkan ke email anda"})
}

func (h *Handler) VerifyOTP(c *fiber.Ctx) error {
	var req VerifyOTPRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "BAD_REQUEST", "Format permintaan tidak valid")
	}
	if err := h.service.VerifyOTP(c.Context(), req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "INVALID_OTP", err.Error())
	}
	return c.JSON(fiber.Map{"verified": true})
}

func (h *Handler) ForgotPassword(c *fiber.Ctx) error {
	var req ForgotPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "BAD_REQUEST", "Format permintaan tidak valid")
	}
	res, err := h.service.ForgotPassword(c.Context(), req.Email)
	if err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "FORGOT_PASSWORD_FAILED", err.Error())
	}
	return c.JSON(res)
}

func (h *Handler) ResetPassword(c *fiber.Ctx) error {
	var req ResetPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "BAD_REQUEST", "Format permintaan tidak valid")
	}
	if err := h.service.ResetPassword(c.Context(), req); err != nil {
		return httpx.NewAppError(fiber.StatusBadRequest, "RESET_FAILED", err.Error())
	}
	return c.JSON(fiber.Map{"message": "Kata sandi berhasil diperbarui"})
}

func (h *Handler) GetMe(c *fiber.Ctx) error {
	role := auth.CurrentRole(c)
	if role == "anon" {
		return httpx.NewAppError(fiber.StatusUnauthorized, "UNAUTHORIZED", "Wajib login")
	}
	userID := auth.CurrentUserID(c)
	user, err := h.service.GetProfile(c.Context(), userID)
	if err != nil {
		return httpx.NewAppError(fiber.StatusNotFound, "USER_NOT_FOUND", "Data profil tidak ditemukan")
	}
	return c.JSON(fiber.Map{
		"id":           user.ID,
		"email":        user.Email,
		"display_name": user.DisplayName,
		"role":         user.Role,
		"opd_id":       user.OpdID,
		"phone":        user.Phone,
	})
}

func (h *Handler) ExportMyData(c *fiber.Ctx) error {
	role := auth.CurrentRole(c)
	if role == "anon" {
		return httpx.NewAppError(fiber.StatusUnauthorized, "UNAUTHORIZED", "Wajib login")
	}
	userID := auth.CurrentUserID(c)
	user, err := h.service.GetProfile(c.Context(), userID)
	if err != nil {
		return httpx.NewAppError(fiber.StatusNotFound, "USER_NOT_FOUND", "Data profil tidak ditemukan")
	}
	return c.JSON(fiber.Map{
		"profile": user,
		"reports": []string{},
	})
}
