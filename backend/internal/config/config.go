package config

import (
	"os"
)

type Config struct {
	Port                 string
	DatabaseURL          string
	SupabaseURL          string
	SupabaseAnonKey      string
	SupabaseServiceKey   string
	SupabaseJWTSecret    string
	BFFSharedKey         string
	ResendAPIKey         string
	GeminiAPIKeyTriage   string
	GeminiAPIKeyAsst     string
	GeminiModel          string
}

func getEnv(key, fallback string) string {
	val := os.Getenv(key)
	if val == "" {
		return fallback
	}
	return val
}

func Load() *Config {
	return &Config{
		Port:               getEnv("PORT", "8080"),
		DatabaseURL:        getEnv("DATABASE_URL", ""),
		SupabaseURL:        getEnv("SUPABASE_URL", ""),
		SupabaseAnonKey:    getEnv("SUPABASE_ANON_KEY", ""),
		SupabaseServiceKey: getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),
		SupabaseJWTSecret:  getEnv("SUPABASE_JWT_SECRET", "super-secret-jwt-key-minimum-32-chars-long"),
		BFFSharedKey:       getEnv("BFF_SHARED_KEY", ""),
		ResendAPIKey:       getEnv("RESEND_API_KEY", ""),
		GeminiAPIKeyTriage: getEnv("GEMINI_API_KEY_TRIAGE", ""),
		GeminiAPIKeyAsst:   getEnv("GEMINI_API_KEY_ASSISTANT", ""),
		GeminiModel:        getEnv("GEMINI_MODEL", "gemini-2.5-flash"),
	}
}
