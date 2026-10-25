package httpx_test

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"govra/internal/platform/httpx"
)

func TestRequireBFFKey(t *testing.T) {
	app := fiber.New(fiber.Config{
		ErrorHandler: httpx.ErrorHandler,
	})
	app.Use(httpx.RequestIDMiddleware())
	app.Use(httpx.RequireBFFKey("valid-bff-secret"))

	app.Get("/test", func(c *fiber.Ctx) error {
		return c.SendString("ok")
	})

	reqUnauthorized := httptest.NewRequest(http.MethodGet, "/test", nil)
	respUnauthorized, err := app.Test(reqUnauthorized)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if respUnauthorized.StatusCode != fiber.StatusForbidden {
		t.Fatalf("expected 403, got %d", respUnauthorized.StatusCode)
	}

	reqAuthorized := httptest.NewRequest(http.MethodGet, "/test", nil)
	reqAuthorized.Header.Set("X-BFF-Key", "valid-bff-secret")
	respAuthorized, err := app.Test(reqAuthorized)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if respAuthorized.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", respAuthorized.StatusCode)
	}

	body, _ := io.ReadAll(respAuthorized.Body)
	if string(body) != "ok" {
		t.Fatalf("expected body ok, got %s", string(body))
	}
}
