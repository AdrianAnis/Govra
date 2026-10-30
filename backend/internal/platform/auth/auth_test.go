package auth_test

import (
	"testing"

	"govra/internal/platform/auth"
)

func TestTokenManagerGenerateAndVerify(t *testing.T) {
	tm := auth.NewTokenManager("test-secret-key-at-least-32-chars-long")
	token, err := tm.Generate("user-123", "user@example.com", "Budi Santoso", "pelapor", "")
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}
	if token == "" {
		t.Fatal("token should not be empty")
	}

	claims, err := tm.Verify(token)
	if err != nil {
		t.Fatalf("failed to verify token: %v", err)
	}
	if claims.UserID != "user-123" {
		t.Fatalf("expected user-123, got %s", claims.UserID)
	}
	if claims.Role != "pelapor" {
		t.Fatalf("expected pelapor, got %s", claims.Role)
	}
	if claims.DisplayName != "Budi Santoso" {
		t.Fatalf("expected Budi Santoso, got %s", claims.DisplayName)
	}
}

func TestTokenManagerInvalidSecret(t *testing.T) {
	tm1 := auth.NewTokenManager("secret-key-1-at-least-32-chars-long")
	tm2 := auth.NewTokenManager("secret-key-2-at-least-32-chars-long")

	token, err := tm1.Generate("user-123", "user@example.com", "Budi", "pelapor", "")
	if err != nil {
		t.Fatalf("generate failed: %v", err)
	}

	_, err = tm2.Verify(token)
	if err == nil {
		t.Fatal("expected verify to fail with different secret")
	}
}
