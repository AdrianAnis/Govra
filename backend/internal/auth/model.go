package auth

import "time"

type Role string

const (
	RolePelapor      Role = "pelapor"
	RoleDinas        Role = "dinas"
	RoleAdmin        Role = "admin"
	RoleKepalaDaerah Role = "kepala_daerah"
)

type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	DisplayName  string    `json:"display_name"`
	Role         Role      `json:"role"`
	OpdID        string    `json:"opd_id,omitempty"`
	Status       string    `json:"status"`
	Phone        string    `json:"phone,omitempty"`
	AvatarURL    string    `json:"avatar_url,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type OTPVerification struct {
	ID             string     `json:"id"`
	Email          string     `json:"email"`
	Code           string     `json:"code"`
	Purpose        string     `json:"purpose"`
	Token          string     `json:"token,omitempty"`
	PendingPayload string     `json:"pending_payload,omitempty"`
	Attempts       int        `json:"attempts"`
	SendCount      int        `json:"send_count"`
	LockLevel      int        `json:"lock_level"`
	LockUntil      *time.Time `json:"lock_until,omitempty"`
	ExpiresAt      time.Time  `json:"expires_at"`
	IsUsed         bool       `json:"is_used"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
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
