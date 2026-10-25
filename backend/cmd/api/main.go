package main

import (
	"log"

	"govra/internal/app"
	"govra/internal/config"
)

func main() {
	cfg := config.Load()
	application, err := app.New(cfg)
	if err != nil {
		log.Fatalf("failed to initialize application: %v", err)
	}
	defer application.Close()

	if err := application.Start(); err != nil {
		log.Fatalf("server terminated: %v", err)
	}
}
