package config

import (
	"os"
	"strings"
)

type Config struct {
	Port               string
	DatabaseURL        string
	SupabaseURL        string
	SupabaseAnonKey    string
	SupabaseServiceKey string
	SupabaseJWTSecret  string
	BFFSharedKey       string
	ResendAPIKey       string
	ResendFromEmail    string
	GeminiAPIKeyTriage string
	GeminiAPIKeyAsst   string
	GeminiModel        string
	CORSOrigins        string
}

func loadDotEnv() {
	paths := []string{".env", "../.env", "../../.env"}
	for _, p := range paths {
		data, err := os.ReadFile(p)
		if err != nil {
			continue
		}
		lines := strings.Split(string(data), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				key := strings.TrimSpace(parts[0])
				val := strings.TrimSpace(parts[1])
				val = strings.Trim(val, `"'`)
				if os.Getenv(key) == "" {
					_ = os.Setenv(key, val)
				}
			}
		}
		break
	}
}

func getEnv(key, fallback string) string {
	val := os.Getenv(key)
	if val == "" {
		return fallback
	}
	return val
}

func Load() *Config {
	loadDotEnv()

	return &Config{
		Port:               getEnv("PORT", "8080"),
		DatabaseURL:        getEnv("DATABASE_URL", ""),
		SupabaseURL:        getEnv("SUPABASE_URL", ""),
		SupabaseAnonKey:    getEnv("SUPABASE_ANON_KEY", ""),
		SupabaseServiceKey: getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),
		SupabaseJWTSecret:  getEnv("SUPABASE_JWT_SECRET", "super-secret-jwt-key-minimum-32-chars-long"),
		BFFSharedKey:       getEnv("BFF_SHARED_KEY", ""),
		ResendAPIKey:       getEnv("RESEND_API_KEY", ""),
		ResendFromEmail:    getEnv("RESEND_FROM_EMAIL", "Govra <noreply@pradatelyu.online>"),
		GeminiAPIKeyTriage: getEnv("GEMINI_API_KEY_TRIAGE", ""),
		GeminiAPIKeyAsst:   getEnv("GEMINI_API_KEY_ASSISTANT", ""),
		GeminiModel:        getEnv("GEMINI_MODEL", "gemini-2.5-flash"),
		CORSOrigins:        getEnv("CORS_ORIGINS", "*"),
	}
}
