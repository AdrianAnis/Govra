package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"sync"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"govra/internal/platform/db"
)

type Repository interface {
	CreateUser(ctx context.Context, u *User) error
	GetUserByEmail(ctx context.Context, email string) (*User, error)
	GetUserByID(ctx context.Context, id string) (*User, error)
	UpdatePassword(ctx context.Context, email, newPasswordHash string) error
	SaveOTP(ctx context.Context, otp *OTPVerification) error
	GetLatestOTP(ctx context.Context, email, purpose string) (*OTPVerification, error)
	GetOTPByToken(ctx context.Context, token string) (*OTPVerification, error)
	MarkOTPUsed(ctx context.Context, id string) error
	IncrementOTPAttempts(ctx context.Context, id string) error
	CheckRateLimit(ctx context.Context, identifier, action string) (*AuthRateLimit, error)
	RecordFailedAttempt(ctx context.Context, identifier, action string) (int, *time.Duration, error)
	RecordSendOTP(ctx context.Context, identifier string) (int, *time.Duration, error)
	ResetRateLimit(ctx context.Context, identifier, action string) error
}

type repository struct {
	db         *db.Database
	mu         sync.RWMutex
	users      map[string]*User
	otps       map[string]*OTPVerification
	rateLimits map[string]*AuthRateLimit
}

func NewRepository(database *db.Database) Repository {
	users := make(map[string]*User)
	otps := make(map[string]*OTPVerification)
	rateLimits := make(map[string]*AuthRateLimit)

	pwdHash, _ := bcrypt.GenerateFromPassword([]byte("Password123!"), bcrypt.DefaultCost)
	seeds := []*User{
		{
			ID:           "00000000-0000-0000-0000-000000000001",
			Email:        "admin@kotacontoh.go.id",
			PasswordHash: string(pwdHash),
			DisplayName:  "Admin Pusat Kota Contoh",
			Role:         RoleAdmin,
			Status:       "ACTIVE",
		},
		{
			ID:           "00000000-0000-0000-0000-000000000002",
			Email:        "walikota@kotacontoh.go.id",
			PasswordHash: string(pwdHash),
			DisplayName:  "Bpk. Ir. H. Ahmad Dahlan",
			Role:         RoleKepalaDaerah,
			Status:       "ACTIVE",
		},
		{
			ID:           "00000000-0000-0000-0000-000000000003",
			Email:        "dbmsda@kotacontoh.go.id",
			PasswordHash: string(pwdHash),
			DisplayName:  "Dinas Bina Marga & SDA",
			Role:         RoleDinas,
			OpdID:        "b0000000-0000-0000-0000-000000000001",
			Status:       "ACTIVE",
		},
		{
			ID:           "00000000-0000-0000-0000-000000000004",
			Email:        "dlhk@kotacontoh.go.id",
			PasswordHash: string(pwdHash),
			DisplayName:  "Dinas Lingkungan Hidup & Kebersihan",
			Role:         RoleDinas,
			OpdID:        "b0000000-0000-0000-0000-000000000002",
			Status:       "ACTIVE",
		},
		{
			ID:           "00000000-0000-0000-0000-000000000005",
			Email:        "dishub@kotacontoh.go.id",
			PasswordHash: string(pwdHash),
			DisplayName:  "Dinas Perhubungan",
			Role:         RoleDinas,
			OpdID:        "b0000000-0000-0000-0000-000000000003",
			Status:       "ACTIVE",
		},
		{
			ID:           "00000000-0000-0000-0000-000000000006",
			Email:        "warga@example.com",
			PasswordHash: string(pwdHash),
			DisplayName:  "Warga Kota",
			Role:         RolePelapor,
			Status:       "ACTIVE",
		},
		{
			ID:           "00000000-0000-0000-0000-000000000007",
			Email:        "rina.pelapor@gmail.com",
			PasswordHash: string(pwdHash),
			DisplayName:  "Rina Handayani",
			Role:         RolePelapor,
			Status:       "ACTIVE",
		},
		{
			ID:           "00000000-0000-0000-0000-000000000008",
			Email:        "bmsda@example.org",
			PasswordHash: string(pwdHash),
			DisplayName:  "Staf Bina Marga",
			Role:         RoleDinas,
			OpdID:        "b0000000-0000-0000-0000-000000000001",
			Status:       "ACTIVE",
		},
		{
			ID:           "00000000-0000-0000-0000-000000000009",
			Email:        "admin@example.org",
			PasswordHash: string(pwdHash),
			DisplayName:  "Super Admin",
			Role:         RoleAdmin,
			Status:       "ACTIVE",
		},
	}
	for _, s := range seeds {
		users[s.Email] = s
	}

	return &repository{
		db:         database,
		users:      users,
		otps:       otps,
		rateLimits: rateLimits,
	}
}

func (r *repository) CreateUser(ctx context.Context, u *User) error {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	u.CreatedAt = time.Now()
	u.UpdatedAt = time.Now()

	if r.db != nil && r.db.Pool != nil {
		query := `INSERT INTO public.profiles (id, email, password_hash, display_name, role, opd_id, status, phone, created_at, updated_at) 
		          VALUES ($1, $2, $3, $4, $5, NULLIF($6, '')::uuid, $7, $8, $9, $10)`
		_, err := r.db.Pool.Exec(ctx, query, u.ID, u.Email, u.PasswordHash, u.DisplayName, string(u.Role), u.OpdID, u.Status, u.Phone, u.CreatedAt, u.UpdatedAt)
		return err
	}

	if r.db != nil && r.db.HasREST() {
		type restUser struct {
			ID           string `json:"id"`
			Email        string `json:"email"`
			PasswordHash string `json:"password_hash"`
			DisplayName  string `json:"display_name"`
			Role         string `json:"role"`
			OpdID        *string `json:"opd_id,omitempty"`
			Status       string `json:"status"`
			Phone        string `json:"phone,omitempty"`
		}
		ru := restUser{
			ID:           u.ID,
			Email:        u.Email,
			PasswordHash: u.PasswordHash,
			DisplayName:  u.DisplayName,
			Role:         string(u.Role),
			Status:       u.Status,
			Phone:        u.Phone,
		}
		if u.OpdID != "" {
			ru.OpdID = &u.OpdID
		}
		if err := r.db.PostgRESTPost(ctx, "profiles", ru, nil); err == nil {
			fmt.Printf("[AUTH DB SUCCESS] Profile saved to Supabase: %s\n", u.Email)
			r.mu.Lock()
			r.users[u.Email] = u
			r.mu.Unlock()
			return nil
		} else {
			fmt.Printf("[AUTH DB ERROR] Failed to save profile to Supabase: %v\n", err)
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.users[u.Email]; exists {
		return errors.New("email sudah terdaftar")
	}
	r.users[u.Email] = u
	return nil
}

func (r *repository) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	if r.db != nil && r.db.Pool != nil {
		query := `SELECT id, email, password_hash, display_name, role, COALESCE(opd_id::text, ''), status, COALESCE(phone, ''), COALESCE(avatar_url, ''), created_at, updated_at 
		          FROM public.profiles WHERE email = $1`
		var u User
		var roleStr string
		err := r.db.Pool.QueryRow(ctx, query, email).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.DisplayName, &roleStr, &u.OpdID, &u.Status, &u.Phone, &u.AvatarURL, &u.CreatedAt, &u.UpdatedAt)
		if err == nil {
			u.Role = Role(roleStr)
			return &u, nil
		}
	}

	if r.db != nil && r.db.HasREST() {
		var list []struct {
			ID           string    `json:"id"`
			Email        string    `json:"email"`
			PasswordHash string    `json:"password_hash"`
			DisplayName  string    `json:"display_name"`
			Role         string    `json:"role"`
			OpdID        *string   `json:"opd_id"`
			Status       string    `json:"status"`
			Phone        *string   `json:"phone"`
			AvatarURL    *string   `json:"avatar_url"`
			CreatedAt    time.Time `json:"created_at"`
			UpdatedAt    time.Time `json:"updated_at"`
		}
		endpoint := fmt.Sprintf("profiles?email=eq.%s&select=*", url.QueryEscape(email))
		if err := r.db.PostgRESTGet(ctx, endpoint, &list); err == nil && len(list) > 0 {
			res := list[0]
			u := &User{
				ID:           res.ID,
				Email:        res.Email,
				PasswordHash: res.PasswordHash,
				DisplayName:  res.DisplayName,
				Role:         Role(res.Role),
				Status:       res.Status,
				CreatedAt:    res.CreatedAt,
				UpdatedAt:    res.UpdatedAt,
			}
			if res.OpdID != nil {
				u.OpdID = *res.OpdID
			}
			if res.Phone != nil {
				u.Phone = *res.Phone
			}
			if res.AvatarURL != nil {
				u.AvatarURL = *res.AvatarURL
			}
			return u, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	u, ok := r.users[email]
	if !ok {
		return nil, errors.New("pengguna tidak ditemukan")
	}
	return u, nil
}

func (r *repository) GetUserByID(ctx context.Context, id string) (*User, error) {
	if r.db != nil && r.db.Pool != nil {
		query := `SELECT id, email, password_hash, display_name, role, COALESCE(opd_id::text, ''), status, COALESCE(phone, ''), COALESCE(avatar_url, ''), created_at, updated_at 
		          FROM public.profiles WHERE id = $1`
		var u User
		var roleStr string
		err := r.db.Pool.QueryRow(ctx, query, id).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.DisplayName, &roleStr, &u.OpdID, &u.Status, &u.Phone, &u.AvatarURL, &u.CreatedAt, &u.UpdatedAt)
		if err == nil {
			u.Role = Role(roleStr)
			return &u, nil
		}
	}

	if r.db != nil && r.db.HasREST() {
		var list []struct {
			ID           string    `json:"id"`
			Email        string    `json:"email"`
			PasswordHash string    `json:"password_hash"`
			DisplayName  string    `json:"display_name"`
			Role         string    `json:"role"`
			OpdID        *string   `json:"opd_id"`
			Status       string    `json:"status"`
			Phone        *string   `json:"phone"`
			AvatarURL    *string   `json:"avatar_url"`
			CreatedAt    time.Time `json:"created_at"`
			UpdatedAt    time.Time `json:"updated_at"`
		}
		endpoint := fmt.Sprintf("profiles?id=eq.%s&select=*", url.QueryEscape(id))
		if err := r.db.PostgRESTGet(ctx, endpoint, &list); err == nil && len(list) > 0 {
			res := list[0]
			u := &User{
				ID:           res.ID,
				Email:        res.Email,
				PasswordHash: res.PasswordHash,
				DisplayName:  res.DisplayName,
				Role:         Role(res.Role),
				Status:       res.Status,
				CreatedAt:    res.CreatedAt,
				UpdatedAt:    res.UpdatedAt,
			}
			if res.OpdID != nil {
				u.OpdID = *res.OpdID
			}
			if res.Phone != nil {
				u.Phone = *res.Phone
			}
			if res.AvatarURL != nil {
				u.AvatarURL = *res.AvatarURL
			}
			return u, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, u := range r.users {
		if u.ID == id {
			return u, nil
		}
	}
	return nil, errors.New("pengguna tidak ditemukan")
}

func (r *repository) UpdatePassword(ctx context.Context, email, newPasswordHash string) error {
	if r.db != nil && r.db.Pool != nil {
		query := `UPDATE public.profiles SET password_hash = $2, updated_at = now() WHERE email = $1`
		tag, err := r.db.Pool.Exec(ctx, query, email, newPasswordHash)
		if err == nil && tag.RowsAffected() > 0 {
			return nil
		}
	}

	if r.db != nil && r.db.HasREST() {
		endpoint := fmt.Sprintf("profiles?email=eq.%s", url.QueryEscape(email))
		if err := r.db.PostgRESTPatch(ctx, endpoint, map[string]any{"password_hash": newPasswordHash}); err == nil {
			r.mu.Lock()
			if u, ok := r.users[email]; ok {
				u.PasswordHash = newPasswordHash
			}
			r.mu.Unlock()
			return nil
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	u, ok := r.users[email]
	if !ok {
		return errors.New("pengguna tidak ditemukan")
	}
	u.PasswordHash = newPasswordHash
	return nil
}

func (r *repository) SaveOTP(ctx context.Context, otp *OTPVerification) error {
	if otp.ID == "" {
		otp.ID = uuid.New().String()
	}
	otp.CreatedAt = time.Now()
	otp.UpdatedAt = time.Now()

	if r.db != nil && r.db.Pool != nil {
		var payloadArg any = nil
		if len(otp.PendingPayload) > 0 && string(otp.PendingPayload) != "null" {
			payloadArg = otp.PendingPayload
		}
		query := `INSERT INTO public.otp_verifications (id, email, code, purpose, token, pending_payload, attempts, send_count, lock_level, lock_until, expires_at, is_used, created_at, updated_at)
		          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`
		_, _ = r.db.Pool.Exec(ctx, query, otp.ID, otp.Email, otp.Code, otp.Purpose, otp.Token, payloadArg, otp.Attempts, otp.SendCount, otp.LockLevel, otp.LockUntil, otp.ExpiresAt, otp.IsUsed, otp.CreatedAt, otp.UpdatedAt)
	}

	if r.db != nil && r.db.HasREST() {
		type restOTP struct {
			ID             string          `json:"id"`
			Email          string          `json:"email"`
			Code           string          `json:"code"`
			Purpose        string          `json:"purpose"`
			Token          string          `json:"token,omitempty"`
			PendingPayload json.RawMessage `json:"pending_payload,omitempty"`
			Attempts       int             `json:"attempts"`
			SendCount      int             `json:"send_count"`
			ExpiresAt      time.Time       `json:"expires_at"`
			IsUsed         bool            `json:"is_used"`
		}
		err := r.db.PostgRESTPost(ctx, "otp_verifications", restOTP{
			ID:             otp.ID,
			Email:          otp.Email,
			Code:           otp.Code,
			Purpose:        otp.Purpose,
			Token:          otp.Token,
			PendingPayload: otp.PendingPayload,
			Attempts:       otp.Attempts,
			SendCount:      otp.SendCount,
			ExpiresAt:      otp.ExpiresAt,
			IsUsed:         otp.IsUsed,
		}, nil)
		if err == nil {
			fmt.Printf("[AUTH DB SUCCESS] OTP saved to Supabase: %s (code: %s)\n", otp.Email, otp.Code)
		} else {
			fmt.Printf("[AUTH DB ERROR] Failed to save OTP to Supabase: %v\n", err)
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	key := fmt.Sprintf("%s:%s", otp.Email, otp.Purpose)
	r.otps[key] = otp
	if otp.Token != "" {
		r.otps[otp.Token] = otp
	}
	return nil
}

func (r *repository) GetLatestOTP(ctx context.Context, email, purpose string) (*OTPVerification, error) {
	if r.db != nil && r.db.Pool != nil {
		query := `SELECT id, email, code, purpose, COALESCE(token, ''), COALESCE(pending_payload, '{}'::jsonb), attempts, send_count, lock_level, lock_until, expires_at, is_used, created_at, updated_at
		          FROM public.otp_verifications WHERE email = $1 AND purpose = $2 AND is_used = false ORDER BY created_at DESC LIMIT 1`
		var otp OTPVerification
		err := r.db.Pool.QueryRow(ctx, query, email, purpose).Scan(&otp.ID, &otp.Email, &otp.Code, &otp.Purpose, &otp.Token, &otp.PendingPayload, &otp.Attempts, &otp.SendCount, &otp.LockLevel, &otp.LockUntil, &otp.ExpiresAt, &otp.IsUsed, &otp.CreatedAt, &otp.UpdatedAt)
		if err == nil {
			return &otp, nil
		}
	}

	if r.db != nil && r.db.HasREST() {
		var list []OTPVerification
		endpoint := fmt.Sprintf("otp_verifications?email=eq.%s&purpose=eq.%s&is_used=eq.false&order=created_at.desc&limit=1", url.QueryEscape(email), url.QueryEscape(purpose))
		if err := r.db.PostgRESTGet(ctx, endpoint, &list); err == nil && len(list) > 0 {
			return &list[0], nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	key := fmt.Sprintf("%s:%s", email, purpose)
	otp, ok := r.otps[key]
	if !ok || otp.IsUsed {
		return nil, errors.New("kode otp tidak ditemukan")
	}
	return otp, nil
}

func (r *repository) GetOTPByToken(ctx context.Context, token string) (*OTPVerification, error) {
	if r.db != nil && r.db.Pool != nil {
		query := `SELECT id, email, code, purpose, COALESCE(token, ''), COALESCE(pending_payload, '{}'::jsonb), attempts, send_count, lock_level, lock_until, expires_at, is_used, created_at, updated_at
		          FROM public.otp_verifications WHERE token = $1 AND is_used = false ORDER BY created_at DESC LIMIT 1`
		var otp OTPVerification
		err := r.db.Pool.QueryRow(ctx, query, token).Scan(&otp.ID, &otp.Email, &otp.Code, &otp.Purpose, &otp.Token, &otp.PendingPayload, &otp.Attempts, &otp.SendCount, &otp.LockLevel, &otp.LockUntil, &otp.ExpiresAt, &otp.IsUsed, &otp.CreatedAt, &otp.UpdatedAt)
		if err == nil {
			return &otp, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	otp, ok := r.otps[token]
	if !ok || otp.IsUsed {
		return nil, errors.New("token reset tidak ditemukan atau sudah digunakan")
	}
	return otp, nil
}

func (r *repository) MarkOTPUsed(ctx context.Context, id string) error {
	if r.db != nil && r.db.Pool != nil {
		query := `UPDATE public.otp_verifications SET is_used = true, updated_at = now() WHERE id = $1`
		_, _ = r.db.Pool.Exec(ctx, query, id)
	}

	if r.db != nil && r.db.HasREST() {
		endpoint := fmt.Sprintf("otp_verifications?id=eq.%s", url.QueryEscape(id))
		_ = r.db.PostgRESTPatch(ctx, endpoint, map[string]any{"is_used": true})
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	for _, o := range r.otps {
		if o.ID == id {
			o.IsUsed = true
		}
	}
	return nil
}

func (r *repository) IncrementOTPAttempts(ctx context.Context, id string) error {
	if r.db != nil && r.db.Pool != nil {
		query := `UPDATE public.otp_verifications SET attempts = attempts + 1, updated_at = now() WHERE id = $1`
		_, _ = r.db.Pool.Exec(ctx, query, id)
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	for _, o := range r.otps {
		if o.ID == id {
			o.Attempts++
		}
	}
	return nil
}

func (r *repository) CheckRateLimit(ctx context.Context, identifier, action string) (*AuthRateLimit, error) {
	now := time.Now()

	r.mu.RLock()
	key := fmt.Sprintf("%s:%s", identifier, action)
	rl, ok := r.rateLimits[key]
	r.mu.RUnlock()

	if ok && rl.LockUntil != nil && now.Before(*rl.LockUntil) {
		remaining := time.Until(*rl.LockUntil)
		hours := int(remaining.Hours())
		minutes := int(remaining.Minutes()) % 60
		if hours > 0 {
			return rl, fmt.Errorf("terlalu banyak percobaan. Silakan coba lagi dalam %d jam %d menit", hours, minutes)
		}
		return rl, fmt.Errorf("terlalu banyak percobaan. Silakan coba lagi dalam %d menit", minutes+1)
	}
	return rl, nil
}

func (r *repository) RecordFailedAttempt(ctx context.Context, identifier, action string) (int, *time.Duration, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now()
	key := fmt.Sprintf("%s:%s", identifier, action)
	rl, ok := r.rateLimits[key]
	if !ok {
		rl = &AuthRateLimit{
			ID:            uuid.New().String(),
			Identifier:    identifier,
			Action:        action,
			Attempts:      1,
			LockLevel:     0,
			LastAttemptAt: now,
		}
		r.rateLimits[key] = rl
		return 1, nil, nil
	}

	if rl.LockUntil != nil && now.After(*rl.LockUntil) {
		rl.Attempts = 0
		rl.LockUntil = nil
	}

	rl.Attempts++
	rl.LastAttemptAt = now

	if rl.Attempts >= 3 {
		mult := 1 << rl.LockLevel
		dur := time.Duration(mult) * time.Hour
		lockUntil := now.Add(dur)
		rl.LockUntil = &lockUntil
		rl.LockLevel++
		rl.Attempts = 0
		return 3, &dur, nil
	}

	return rl.Attempts, nil, nil
}

func (r *repository) RecordSendOTP(ctx context.Context, identifier string) (int, *time.Duration, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now()
	key := fmt.Sprintf("%s:SEND_OTP", identifier)
	rl, ok := r.rateLimits[key]
	if !ok {
		rl = &AuthRateLimit{
			ID:            uuid.New().String(),
			Identifier:    identifier,
			Action:        "SEND_OTP",
			Attempts:      1,
			LockLevel:     0,
			LastAttemptAt: now,
		}
		r.rateLimits[key] = rl
		return 1, nil, nil
	}

	if rl.LockUntil != nil && now.After(*rl.LockUntil) {
		rl.Attempts = 0
		rl.LockUntil = nil
	}

	rl.Attempts++
	rl.LastAttemptAt = now

	if rl.Attempts >= 3 {
		mult := 1 << rl.LockLevel
		dur := time.Duration(mult) * time.Hour
		lockUntil := now.Add(dur)
		rl.LockUntil = &lockUntil
		rl.LockLevel++
		rl.Attempts = 0
		return 3, &dur, nil
	}

	return rl.Attempts, nil, nil
}

func (r *repository) ResetRateLimit(ctx context.Context, identifier, action string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	key := fmt.Sprintf("%s:%s", identifier, action)
	delete(r.rateLimits, key)
	return nil
}
