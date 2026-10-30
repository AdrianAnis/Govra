package app

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"govra/internal/admin"
	"govra/internal/auth"
	"govra/internal/config"
	"govra/internal/feed"
	"govra/internal/issue"
	"govra/internal/platform/ai"
	pauth "govra/internal/platform/auth"
	"govra/internal/platform/db"
	"govra/internal/platform/email"
	"govra/internal/platform/httpx"
	"govra/internal/program"
	"govra/internal/report"
)

type Application struct {
	FiberApp *fiber.App
	Config   *config.Config
	DB       *db.Database
}

func New(cfg *config.Config) (*Application, error) {
	database, err := db.New(cfg.DatabaseURL, cfg.SupabaseURL, cfg.SupabaseServiceKey)
	if err != nil {
		return nil, err
	}

	fiberApp := fiber.New(fiber.Config{
		ErrorHandler:          httpx.ErrorHandler,
		ServerHeader:          "",
		DisableStartupMessage: true,
		BodyLimit:             16 * 1024 * 1024,
	})
	fiberApp.Use(recover.New())
	fiberApp.Use(logger.New())
	fiberApp.Use(httpx.SecurityHeadersMiddleware())
	fiberApp.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization, X-BFF-Key, X-Request-Id",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))
	fiberApp.Use(httpx.RequestIDMiddleware())
	fiberApp.Use(httpx.RequireBFFKey(cfg.BFFSharedKey))

	tokenManager := pauth.NewTokenManager(cfg.SupabaseJWTSecret)
	fiberApp.Use(pauth.AuthMiddleware(tokenManager))

	emailClient := email.NewClient(cfg.ResendAPIKey, cfg.ResendFromEmail)
	aiClient := ai.NewClient(cfg.GeminiAPIKeyTriage, cfg.GeminiModel)

	authRepo := auth.NewRepository(database)
	authSvc := auth.NewService(authRepo, tokenManager, emailClient)
	authHandler := auth.NewHandler(authSvc)
	authHandler.RegisterRoutes(fiberApp)

	progRepo := program.NewRepository(database)
	progSvc := program.NewService(progRepo)
	progHandler := program.NewHandler(progSvc)
	progHandler.RegisterRoutes(fiberApp)

	repRepo := report.NewRepository(database)
	repSvc := report.NewService(repRepo, aiClient)
	repHandler := report.NewHandler(repSvc)
	repHandler.RegisterRoutes(fiberApp)

	issRepo := issue.NewRepository(database)
	issSvc := issue.NewService(issRepo)
	issHandler := issue.NewHandler(issSvc)
	issHandler.RegisterRoutes(fiberApp)

	feedRepo := feed.NewRepository(database)
	feedSvc := feed.NewService(feedRepo)
	feedHandler := feed.NewHandler(feedSvc)
	feedHandler.RegisterRoutes(fiberApp)

	adminSvc := admin.NewService(database)
	adminHandler := admin.NewHandler(adminSvc)
	adminHandler.RegisterRoutes(fiberApp)

	return &Application{
		FiberApp: fiberApp,
		Config:   cfg,
		DB:       database,
	}, nil
}

func (a *Application) Start() error {
	return a.FiberApp.Listen(":" + a.Config.Port)
}

func (a *Application) Close() {
	if a.DB != nil {
		a.DB.Close()
	}
}
