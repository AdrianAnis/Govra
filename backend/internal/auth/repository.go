package auth

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
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
	r := &repository{
		db:    database,
		users: make(map[string]*User),
		otps:  make(map[string]*OTPVerification),
	}
	r.seedDefaultUsers()
	return r
}

func (r *repository) seedDefaultUsers() {
	r.users["admin@kotacontoh.go.id"] = &User{
		ID:           "u0000000-0000-0000-0000-000000000001",
		Email:        "admin@kotacontoh.go.id",
		DisplayName:  "Administrator Utama",
		Role:         RoleAdmin,
		Status:       "ACTIVE",
		PasswordHash: "$2a$10$7EqJtq98hPqEX7fNZaFWoO.81bkyXfHj4c.1lY01v04f7V2oU6w.2",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	r.users["dinas@kotacontoh.go.id"] = &User{
		ID:           "u0000000-0000-0000-0000-000000000002",
		Email:        "dinas@kotacontoh.go.id",
		DisplayName:  "Petugas DBM-SDA",
		Role:         RoleDinas,
		OpdID:        "e0000000-0000-0000-0000-000000000001",
		Status:       "ACTIVE",
		PasswordHash: "$2a$10$7EqJtq98hPqEX7fNZaFWoO.81bkyXfHj4c.1lY01v04f7V2oU6w.2",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
}

func (r *repository) CreateUser(ctx context.Context, u *User) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.users[u.Email]; exists {
		return errors.New("email sudah terdaftar")
	}
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	u.CreatedAt = time.Now()
	u.UpdatedAt = time.Now()
	r.users[u.Email] = u
	return nil
}

func (r *repository) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	u, ok := r.users[email]
	if !ok {
		return nil, errors.New("pengguna tidak ditemukan")
	}
	return u, nil
}

func (r *repository) GetUserByID(ctx context.Context, id string) (*User, error) {
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
	r.mu.Lock()
	defer r.mu.Unlock()
	if otp.ID == "" {
		otp.ID = uuid.New().String()
	}
	otp.CreatedAt = time.Now()
	r.otps[otp.ID] = otp
	return nil
}

func (r *repository) GetLatestOTP(ctx context.Context, email, purpose string) (*OTPVerification, error) {
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
	r.mu.Lock()
	defer r.mu.Unlock()
	otp, ok := r.otps[id]
	if !ok {
		return errors.New("kode otp tidak ditemukan")
	}
	otp.Attempts++
	return nil
}
