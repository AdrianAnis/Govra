package db

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Database struct {
	Pool        *pgxpool.Pool
	SupabaseURL string
	SupabaseKey string
	HTTPClient  *http.Client
}

func New(databaseURL, supabaseURL, supabaseKey string) (*Database, error) {
	d := &Database{
		SupabaseURL: strings.TrimRight(supabaseURL, "/"),
		SupabaseKey: supabaseKey,
		HTTPClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}

	if databaseURL == "" || strings.Contains(databaseURL, "[PASSWORD]") {
		return d, nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return d, nil
	}
	config.MaxConns = 10
	config.MinConns = 2

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return d, nil
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return d, nil
	}
	d.Pool = pool
	return d, nil
}

func (db *Database) HasREST() bool {
	return db.SupabaseURL != "" && db.SupabaseKey != ""
}

func (db *Database) PostgRESTGet(ctx context.Context, endpoint string, dest any) error {
	if !db.HasREST() {
		return fmt.Errorf("supabase rest not configured")
	}
	url := fmt.Sprintf("%s/rest/v1/%s", db.SupabaseURL, strings.TrimLeft(endpoint, "/"))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("apikey", db.SupabaseKey)
	req.Header.Set("Authorization", "Bearer "+db.SupabaseKey)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Accept-Profile", "app")

	res, err := db.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= 400 {
		body, _ := io.ReadAll(res.Body)
		return fmt.Errorf("postgrest get error %d: %s", res.StatusCode, string(body))
	}
	return json.NewDecoder(res.Body).Decode(dest)
}

func (db *Database) PostgRESTPost(ctx context.Context, endpoint string, payload any, dest any) error {
	if !db.HasREST() {
		return fmt.Errorf("supabase rest not configured")
	}
	url := fmt.Sprintf("%s/rest/v1/%s", db.SupabaseURL, strings.TrimLeft(endpoint, "/"))
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(data))
	if err != nil {
		return err
	}
	req.Header.Set("apikey", db.SupabaseKey)
	req.Header.Set("Authorization", "Bearer "+db.SupabaseKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Content-Profile", "app")
	if dest != nil {
		req.Header.Set("Prefer", "return=representation")
	}

	res, err := db.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= 400 {
		body, _ := io.ReadAll(res.Body)
		return fmt.Errorf("postgrest post error %d: %s", res.StatusCode, string(body))
	}
	if dest != nil {
		return json.NewDecoder(res.Body).Decode(dest)
	}
	return nil
}

func (db *Database) PostgRESTPatch(ctx context.Context, endpoint string, payload any) error {
	if !db.HasREST() {
		return fmt.Errorf("supabase rest not configured")
	}
	url := fmt.Sprintf("%s/rest/v1/%s", db.SupabaseURL, strings.TrimLeft(endpoint, "/"))
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPatch, url, bytes.NewReader(data))
	if err != nil {
		return err
	}
	req.Header.Set("apikey", db.SupabaseKey)
	req.Header.Set("Authorization", "Bearer "+db.SupabaseKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Content-Profile", "app")

	res, err := db.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= 400 {
		body, _ := io.ReadAll(res.Body)
		return fmt.Errorf("postgrest patch error %d: %s", res.StatusCode, string(body))
	}
	return nil
}

func (db *Database) Close() {
	if db.Pool != nil {
		db.Pool.Close()
	}
}
