package feed_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"govra/internal/feed"
	pauth "govra/internal/platform/auth"
	"govra/internal/platform/db"
	"govra/internal/platform/httpx"
)

func setupFeedApp() (*fiber.App, feed.Service, *pauth.TokenManager) {
	database, _ := db.New("", "", "")
	repo := feed.NewRepository(database)
	svc := feed.NewService(repo)
	handler := feed.NewHandler(svc)
	tm := pauth.NewTokenManager("test-jwt-secret-key-at-least-32-chars-long")

	app := fiber.New(fiber.Config{
		ErrorHandler: httpx.ErrorHandler,
	})
	app.Use(httpx.RequestIDMiddleware())
	app.Use(pauth.AuthMiddleware(tm))
	handler.RegisterRoutes(app)
	return app, svc, tm
}

func TestListAndCreateFeed(t *testing.T) {
	app, _, tm := setupFeedApp()
	pelaporToken, _ := tm.Generate("warga-1", "warga1@example.com", "Rian", "pelapor", "")

	listReq := httptest.NewRequest(http.MethodGet, "/feeds?tab=trending", nil)
	listResp, err := app.Test(listReq)
	if err != nil {
		t.Fatalf("failed list feeds: %v", err)
	}
	if listResp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", listResp.StatusCode)
	}

	createBody, _ := json.Marshal(feed.CreateFeedRequest{
		Content:   "Tumpukan sampah di pinggir jalan sudah dibersihkan warga dan dinas terkait!",
		MediaType: feed.MediaImage,
		MediaURL:  "https://example.com/clean.jpg",
	})
	createReq := httptest.NewRequest(http.MethodPost, "/feeds", bytes.NewReader(createBody))
	createReq.Header.Set("Content-Type", "application/json")
	createReq.Header.Set("Authorization", "Bearer "+pelaporToken)

	createResp, err := app.Test(createReq)
	if err != nil {
		t.Fatalf("failed create feed: %v", err)
	}
	if createResp.StatusCode != fiber.StatusCreated {
		t.Fatalf("expected 201, got %d", createResp.StatusCode)
	}
}

func TestLikeAndShareFeed(t *testing.T) {
	app, _, tm := setupFeedApp()
	pelaporToken, _ := tm.Generate("warga-1", "warga1@example.com", "Rian", "pelapor", "")

	likeReq := httptest.NewRequest(http.MethodPost, "/feeds/fd-001/like", nil)
	likeReq.Header.Set("Authorization", "Bearer "+pelaporToken)
	likeResp, err := app.Test(likeReq)
	if err != nil {
		t.Fatalf("failed like feed: %v", err)
	}
	if likeResp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", likeResp.StatusCode)
	}

	shareReq := httptest.NewRequest(http.MethodPost, "/feeds/fd-001/share", nil)
	shareResp, err := app.Test(shareReq)
	if err != nil {
		t.Fatalf("failed share feed: %v", err)
	}
	if shareResp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", shareResp.StatusCode)
	}
}

func TestSupportAndCommentFeed(t *testing.T) {
	app, _, tm := setupFeedApp()
	pelaporToken, _ := tm.Generate("warga-1", "warga1@example.com", "Rian", "pelapor", "")

	supportReq := httptest.NewRequest(http.MethodPost, "/feeds/fd-001/support", nil)
	supportReq.Header.Set("Authorization", "Bearer "+pelaporToken)
	supportResp, err := app.Test(supportReq)
	if err != nil {
		t.Fatalf("failed support feed: %v", err)
	}
	if supportResp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", supportResp.StatusCode)
	}

	supListReq := httptest.NewRequest(http.MethodGet, "/feeds/fd-001/supporters", nil)
	supListResp, err := app.Test(supListReq)
	if err != nil {
		t.Fatalf("failed list supporters: %v", err)
	}
	if supListResp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", supListResp.StatusCode)
	}

	commentBody, _ := json.Marshal(feed.CreateCommentRequest{
		Content: "Ayo kawal terus sampai selesai!",
	})
	commentReq := httptest.NewRequest(http.MethodPost, "/feeds/fd-001/comments", bytes.NewReader(commentBody))
	commentReq.Header.Set("Content-Type", "application/json")
	commentReq.Header.Set("Authorization", "Bearer "+pelaporToken)

	commentResp, err := app.Test(commentReq)
	if err != nil {
		t.Fatalf("failed add comment: %v", err)
	}
	if commentResp.StatusCode != fiber.StatusCreated {
		t.Fatalf("expected 201, got %d", commentResp.StatusCode)
	}

	listCmReq := httptest.NewRequest(http.MethodGet, "/feeds/fd-001/comments", nil)
	listCmResp, err := app.Test(listCmReq)
	if err != nil {
		t.Fatalf("failed list comments: %v", err)
	}
	if listCmResp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", listCmResp.StatusCode)
	}
}
