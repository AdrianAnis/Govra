package auth_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"govra/internal/auth"
	pauth "govra/internal/platform/auth"
	"govra/internal/platform/db"
	"govra/internal/platform/email"
	"govra/internal/platform/httpx"

	"github.com/gofiber/fiber/v2"
)

func setupTestApp() (*fiber.App, auth.Service, *pauth.TokenManager, auth.Repository) {
	database, _ := db.New("", "", "")
	repo := auth.NewRepository(database)
	tm := pauth.NewTokenManager("test-jwt-secret-key-at-least-32-chars-long")
	ec := email.NewClient("test-resend-key")
	svc := auth.NewService(repo, tm, ec)
	handler := auth.NewHandler(svc)

	app := fiber.New(fiber.Config{
		ErrorHandler: httpx.ErrorHandler,
	})
	app.Use(httpx.RequestIDMiddleware())
	app.Use(pauth.AuthMiddleware(tm))
	handler.RegisterRoutes(app)
	return app, svc, tm, repo
}

func TestAuthRegisterVerifyAndLogin(t *testing.T) {
	app, _, _, repo := setupTestApp()
	ctx := context.Background()

	regBody, _ := json.Marshal(auth.RegisterRequest{
		Email:       "warga.baru@example.com",
		Password:    "password123",
		DisplayName: "Ahmad Dahlan",
		Phone:       "081234567890",
	})
	req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewReader(regBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req, 5000)
	if err != nil {
		t.Fatalf("failed register request: %v", err)
	}
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	otp, err := repo.GetLatestOTP(ctx, "warga.baru@example.com", "REGISTRATION")
	if err != nil {
		t.Fatalf("failed to fetch latest otp: %v", err)
	}

	wrongVerifyBody, _ := json.Marshal(auth.VerifyOTPRequest{
		Email: "warga.baru@example.com",
		Code:  "999999",
	})
	vReq := httptest.NewRequest(http.MethodPost, "/auth/verify-registration", bytes.NewReader(wrongVerifyBody))
	vReq.Header.Set("Content-Type", "application/json")
	vResp, _ := app.Test(vReq, 5000)
	if vResp.StatusCode != fiber.StatusBadRequest {
		t.Fatalf("expected 400 for wrong code, got %d", vResp.StatusCode)
	}

	correctVerifyBody, _ := json.Marshal(auth.VerifyOTPRequest{
		Email: "warga.baru@example.com",
		Code:  otp.Code,
	})
	vReq2 := httptest.NewRequest(http.MethodPost, "/auth/verify-registration", bytes.NewReader(correctVerifyBody))
	vReq2.Header.Set("Content-Type", "application/json")
	vResp2, _ := app.Test(vReq2, 5000)
	if vResp2.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200 for correct code, got %d", vResp2.StatusCode)
	}

	loginBody, _ := json.Marshal(auth.LoginRequest{
		Email:    "warga.baru@example.com",
		Password: "password123",
	})
	loginReq := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewReader(loginBody))
	loginReq.Header.Set("Content-Type", "application/json")
	loginResp, err := app.Test(loginReq, 5000)
	if err != nil {
		t.Fatalf("failed login request: %v", err)
	}
	if loginResp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", loginResp.StatusCode)
	}

	var authRes auth.AuthResponse
	_ = json.NewDecoder(loginResp.Body).Decode(&authRes)
	if authRes.Token == "" {
		t.Fatal("expected non-empty token")
	}

	meReq := httptest.NewRequest(http.MethodGet, "/me", nil)
	meReq.Header.Set("Authorization", "Bearer "+authRes.Token)
	meResp, err := app.Test(meReq, 5000)
	if err != nil {
		t.Fatalf("failed me request: %v", err)
	}
	if meResp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", meResp.StatusCode)
	}
}

func TestForgotPasswordFlow(t *testing.T) {
	app, _, _, repo := setupTestApp()
	ctx := context.Background()

	nonExistentBody, _ := json.Marshal(auth.ForgotPasswordRequest{
		Email: "tidak.ada@example.com",
	})
	req := httptest.NewRequest(http.MethodPost, "/auth/forgot-password", bytes.NewReader(nonExistentBody))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req)
	if resp.StatusCode != fiber.StatusBadRequest {
		t.Fatalf("expected 400 for non-existent email, got %d", resp.StatusCode)
	}

	existingBody, _ := json.Marshal(auth.ForgotPasswordRequest{
		Email: "admin@kotacontoh.go.id",
	})
	req2 := httptest.NewRequest(http.MethodPost, "/auth/forgot-password", bytes.NewReader(existingBody))
	req2.Header.Set("Content-Type", "application/json")
	resp2, _ := app.Test(req2)
	if resp2.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200 for existing email, got %d", resp2.StatusCode)
	}

	otp, err := repo.GetLatestOTP(ctx, "admin@kotacontoh.go.id", "PASSWORD_RESET")
	if err != nil {
		t.Fatalf("failed to get reset otp: %v", err)
	}

	resetBody, _ := json.Marshal(auth.ResetPasswordRequest{
		Email:       "admin@kotacontoh.go.id",
		Token:       otp.Token,
		NewPassword: "NewSecretPassword123!",
	})
	resetReq := httptest.NewRequest(http.MethodPost, "/auth/reset-password", bytes.NewReader(resetBody))
	resetReq.Header.Set("Content-Type", "application/json")
	resetResp, _ := app.Test(resetReq)
	if resetResp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200 for reset password, got %d", resetResp.StatusCode)
	}

	loginBody, _ := json.Marshal(auth.LoginRequest{
		Email:    "admin@kotacontoh.go.id",
		Password: "NewSecretPassword123!",
	})
	loginReq := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewReader(loginBody))
	loginReq.Header.Set("Content-Type", "application/json")
	loginResp, _ := app.Test(loginReq)
	if loginResp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200 login with new password, got %d", loginResp.StatusCode)
	}
}

func TestRateLimitingSendOTPAndVerify(t *testing.T) {
	_, svc, _, _ := setupTestApp()
	ctx := context.Background()

	email := "ratelimit@example.com"
	for i := 0; i < 2; i++ {
		err := svc.SendOTP(ctx, email, "TEST")
		if err != nil {
			t.Fatalf("iteration %d send otp failed: %v", i, err)
		}
	}

	err := svc.SendOTP(ctx, email, "TEST")
	if err == nil {
		t.Fatal("expected 3rd attempt to trigger lockout error")
	}

	vEmail := "verify-rate@example.com"
	_ = svc.SendOTP(ctx, vEmail, "TEST")

	for i := 0; i < 2; i++ {
		_ = svc.VerifyOTP(ctx, auth.VerifyOTPRequest{
			Email:   vEmail,
			Code:    "000000",
			Purpose: "TEST",
		})
	}

	err = svc.VerifyOTP(ctx, auth.VerifyOTPRequest{
		Email:   vEmail,
		Code:    "000000",
		Purpose: "TEST",
	})
	if err == nil {
		t.Fatal("expected 3rd wrong verification to trigger lockout")
	}
}
