package auth

import (
	"encoding/json"
	"errors"
	"time"
)

type Role string

const (
	RolePelapor Role = "pelapor"
	RoleDinas   Role = "dinas"
	RoleAdmin   Role = "admin"
)

type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	DisplayName  string    `json:"display_name"`
	Role         Role      `json:"role"`
	OpdID        string    `json:"opd_id,omitempty"`
	OpdName      string    `json:"opd_name,omitempty"`
	Status       string    `json:"status"`
	Phone        string    `json:"phone,omitempty"`
	AvatarURL    string    `json:"avatar_url,omitempty"`
	NIK          string    `json:"nik,omitempty"`
	Address      string    `json:"address,omitempty"`
	District     string    `json:"district,omitempty"`
	Village      string    `json:"village,omitempty"`
	Bio          string    `json:"bio,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type UpdateProfileRequest struct {
	DisplayName string `json:"display_name"`
	Phone       string `json:"phone,omitempty"`
	AvatarURL   string `json:"avatar_url,omitempty"`
	NIK         string `json:"nik,omitempty"`
	Address     string `json:"address,omitempty"`
	District    string `json:"district,omitempty"`
	Village     string `json:"village,omitempty"`
	Bio         string `json:"bio,omitempty"`
}

type OTPVerification struct {
	ID             string          `json:"id"`
	Email          string          `json:"email"`
	Code           string          `json:"code"`
	Purpose        string          `json:"purpose"`
	Token          string          `json:"token,omitempty"`
	PendingPayload json.RawMessage `json:"pending_payload,omitempty"`
	Attempts       int             `json:"attempts"`
	SendCount      int             `json:"send_count"`
	LockLevel      int             `json:"lock_level"`
	LockUntil      *time.Time      `json:"lock_until,omitempty"`
	ExpiresAt      time.Time       `json:"expires_at"`
	IsUsed         bool            `json:"is_used"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type AuthRateLimit struct {
	ID            string     `json:"id"`
	Identifier    string     `json:"identifier"`
	Action        string     `json:"action"`
	Attempts      int        `json:"attempts"`
	LockLevel     int        `json:"lock_level"`
	LockUntil     *time.Time `json:"lock_until,omitempty"`
	LastAttemptAt time.Time  `json:"last_attempt_at"`
}

type RegisterRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"display_name"`
	Phone       string `json:"phone,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type SendOTPRequest struct {
	Email   string `json:"email"`
	Purpose string `json:"purpose"`
}

type VerifyOTPRequest struct {
	Email   string `json:"email"`
	Code    string `json:"code"`
	Purpose string `json:"purpose"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

type ResetPasswordRequest struct {
	Email       string `json:"email"`
	Token       string `json:"token,omitempty"`
	Code        string `json:"code,omitempty"`
	NewPassword string `json:"new_password"`
}

type AuthResponse struct {
	Token   string `json:"token"`
	Profile User   `json:"profile"`
}

var (
	ErrInvalidPhone  = errors.New("nomor telepon tidak valid. Gunakan nomor WhatsApp aktif, contoh 081234567890")
	ErrPhoneRequired = errors.New("nomor telepon wajib diisi untuk menyelesaikan pendaftaran")
)

type OAuthLoginRequest struct {
	Email       string `json:"email"`
	Phone       string `json:"phone,omitempty"`
	DisplayName string `json:"display_name"`
	AvatarURL   string `json:"avatar_url,omitempty"`
	Provider    string `json:"provider"`
	Mode        string `json:"mode,omitempty"`
}
