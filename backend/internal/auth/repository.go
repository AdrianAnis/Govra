package auth

import (
	"context"
	"errors"
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
	MarkOTPUsed(ctx context.Context, id string) error
	IncrementOTPAttempts(ctx context.Context, id string) error
}

type repository struct {
	db    *db.Database
	mu    sync.RWMutex
	users map[string]*User
	otps  map[string]*OTPVerification
}

func NewRepository(database *db.Database) Repository {
	users := make(map[string]*User)
	otps := make(map[string]*OTPVerification)

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
		db:    database,
		users: users,
		otps:  otps,
	}
}

func (r *repository) CreateUser(ctx context.Context, u *User) error {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	u.CreatedAt = time.Now()
	u.UpdatedAt = time.Now()

	if r.db != nil && r.db.Pool != nil {
		query := `INSERT INTO app.profiles (id, email, password_hash, display_name, role, opd_id, status, phone, created_at, updated_at) 
		          VALUES ($1, $2, $3, $4, $5, NULLIF($6, '')::uuid, $7, $8, $9, $10)`
		_, err := r.db.Pool.Exec(ctx, query, u.ID, u.Email, u.PasswordHash, u.DisplayName, string(u.Role), u.OpdID, u.Status, u.Phone, u.CreatedAt, u.UpdatedAt)
		return err
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
		          FROM app.profiles WHERE email = $1`
		var u User
		var roleStr string
		err := r.db.Pool.QueryRow(ctx, query, email).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.DisplayName, &roleStr, &u.OpdID, &u.Status, &u.Phone, &u.AvatarURL, &u.CreatedAt, &u.UpdatedAt)
		if err != nil {
			return nil, errors.New("pengguna tidak ditemukan")
		}
		u.Role = Role(roleStr)
		return &u, nil
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
		          FROM app.profiles WHERE id = $1`
		var u User
		var roleStr string
		err := r.db.Pool.QueryRow(ctx, query, id).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.DisplayName, &roleStr, &u.OpdID, &u.Status, &u.Phone, &u.AvatarURL, &u.CreatedAt, &u.UpdatedAt)
		if err != nil {
			return nil, errors.New("pengguna tidak ditemukan")
		}
		u.Role = Role(roleStr)
		return &u, nil
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
		query := `UPDATE app.profiles SET password_hash = $2, updated_at = now() WHERE email = $1`
		tag, err := r.db.Pool.Exec(ctx, query, email, newPasswordHash)
		if err != nil {
			return err
		}
		if tag.RowsAffected() == 0 {
			return errors.New("pengguna tidak ditemukan")
		}
		return nil
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	u, ok := r.users[email]
	if !ok {
		return errors.New("pengguna tidak ditemukan")
	}
	u.PasswordHash = newPasswordHash
	u.UpdatedAt = time.Now()
	return nil
}

func (r *repository) SaveOTP(ctx context.Context, otp *OTPVerification) error {
	if otp.ID == "" {
		otp.ID = uuid.New().String()
	}
	otp.CreatedAt = time.Now()

	if r.db != nil && r.db.Pool != nil {
		query := `INSERT INTO app.otp_verifications (id, email, code, purpose, attempts, expires_at, is_used, created_at) 
		          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
		_, err := r.db.Pool.Exec(ctx, query, otp.ID, otp.Email, otp.Code, otp.Purpose, otp.Attempts, otp.ExpiresAt, otp.IsUsed, otp.CreatedAt)
		return err
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.otps[otp.ID] = otp
	return nil
}

func (r *repository) GetLatestOTP(ctx context.Context, email, purpose string) (*OTPVerification, error) {
	if r.db != nil && r.db.Pool != nil {
		query := `SELECT id, email, code, purpose, attempts, expires_at, is_used, created_at 
		          FROM app.otp_verifications 
		          WHERE email = $1 AND purpose = $2 AND is_used = false 
		          ORDER BY created_at DESC LIMIT 1`
		var otp OTPVerification
		err := r.db.Pool.QueryRow(ctx, query, email, purpose).Scan(&otp.ID, &otp.Email, &otp.Code, &otp.Purpose, &otp.Attempts, &otp.ExpiresAt, &otp.IsUsed, &otp.CreatedAt)
		if err != nil {
			return nil, errors.New("kode otp tidak ditemukan")
		}
		return &otp, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	var latest *OTPVerification
	for _, otp := range r.otps {
		if otp.Email == email && otp.Purpose == purpose && !otp.IsUsed {
			if latest == nil || otp.CreatedAt.After(latest.CreatedAt) {
				latest = otp
			}
		}
	}
	if latest == nil {
		return nil, errors.New("kode otp tidak ditemukan")
	}
	return latest, nil
}

func (r *repository) MarkOTPUsed(ctx context.Context, id string) error {
	if r.db != nil && r.db.Pool != nil {
		query := `UPDATE app.otp_verifications SET is_used = true WHERE id = $1`
		_, err := r.db.Pool.Exec(ctx, query, id)
		return err
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	otp, ok := r.otps[id]
	if !ok {
		return errors.New("kode otp tidak ditemukan")
	}
	otp.IsUsed = true
	return nil
}

func (r *repository) IncrementOTPAttempts(ctx context.Context, id string) error {
	if r.db != nil && r.db.Pool != nil {
		query := `UPDATE app.otp_verifications SET attempts = attempts + 1 WHERE id = $1`
		_, err := r.db.Pool.Exec(ctx, query, id)
		return err
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	otp, ok := r.otps[id]
	if !ok {
		return errors.New("kode otp tidak ditemukan")
	}
	otp.Attempts++
	return nil
}
