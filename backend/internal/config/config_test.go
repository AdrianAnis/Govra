package config_test

import (
	"os"
	"testing"

	"govra/internal/config"
)

func TestLoadConfig(t *testing.T) {
	_ = os.Setenv("PORT", "9090")
	_ = os.Setenv("RESEND_API_KEY", "dummy-resend-key")
	_ = os.Setenv("GEMINI_API_KEY_TRIAGE", "dummy-gemini-key")
	cfg := config.Load()
	if cfg.Port != "9090" {
		t.Fatalf("expected port 9090, got %s", cfg.Port)
	}
	if cfg.ResendAPIKey != "dummy-resend-key" {
		t.Fatal("expected dummy-resend-key")
	}
	if cfg.GeminiAPIKeyTriage != "dummy-gemini-key" {
		t.Fatal("expected dummy-gemini-key")
	}
}
