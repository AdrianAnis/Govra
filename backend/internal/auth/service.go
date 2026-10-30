package auth

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/url"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"govra/internal/platform/auth"
	"govra/internal/platform/email"
)

type Service interface {
	Register(ctx context.Context, req RegisterRequest) (map[string]any, error)
	VerifyRegisterOTP(ctx context.Context, req VerifyOTPRequest) error
	Login(ctx context.Context, req LoginRequest) (*AuthResponse, error)
	SendOTP(ctx context.Context, emailAddress, purpose string) error
	VerifyOTP(ctx context.Context, req VerifyOTPRequest) error
	ForgotPassword(ctx context.Context, emailAddress string) (map[string]any, error)
	ResetPassword(ctx context.Context, req ResetPasswordRequest) error
	GetProfile(ctx context.Context, userID string) (*User, error)
}

type service struct {
	repo         Repository
	tokenManager *auth.TokenManager
	emailClient  *email.Client
}

func NewService(repo Repository, tm *auth.TokenManager, ec *email.Client) Service {
	return &service{
		repo:         repo,
		tokenManager: tm,
		emailClient:  ec,
	}
}

type pendingReg struct {
	DisplayName  string `json:"display_name"`
	PasswordHash string `json:"password_hash"`
	Phone        string `json:"phone"`
}

func (s *service) Register(ctx context.Context, req RegisterRequest) (map[string]any, error) {
	if len(req.DisplayName) < 2 {
		return nil, errors.New("nama lengkap minimal 2 karakter")
	}
	if len(req.Password) < 8 {
		return nil, errors.New("kata sandi minimal 8 karakter")
	}

	if existing, _ := s.repo.GetUserByEmail(ctx, req.Email); existing != nil {
		return nil, errors.New("email sudah terdaftar dalam sistem Govra. Silakan masuk atau gunakan email lain.")
	}

	if _, err := s.repo.CheckRateLimit(ctx, req.Email, "SEND_OTP"); err != nil {
		return nil, err
	}

	_, dur, err := s.repo.RecordSendOTP(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if dur != nil {
		return nil, fmt.Errorf("Anda telah meminta kode OTP sebanyak 3 kali. Mohon tunggu %d jam sebelum meminta kode kembali", int(dur.Hours()))
	}

	num, err := rand.Int(rand.Reader, big.NewInt(900000))
	if err != nil {
		return nil, err
	}
	code := fmt.Sprintf("%06d", num.Int64()+100000)

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	payloadBytes, _ := json.Marshal(pendingReg{
		DisplayName:  req.DisplayName,
		PasswordHash: string(hash),
		Phone:        req.Phone,
	})

	otp := &OTPVerification{
		Email:          req.Email,
		Code:           code,
		Purpose:        "REGISTRATION",
		PendingPayload: json.RawMessage(payloadBytes),
		Attempts:       0,
		SendCount:      1,
		ExpiresAt:      time.Now().Add(10 * time.Minute),
		IsUsed:         false,
	}
	if err := s.repo.SaveOTP(ctx, otp); err != nil {
		return nil, err
	}

	fmt.Printf("[AUTH OTP] Generated OTP for %s: %s (purpose: REGISTRATION)\n", req.Email, code)
	_ = s.emailClient.SendOTP(ctx, req.Email, code, "Pendaftaran Akun Baru Govra")

	return map[string]any{
		"message": "Kode OTP berhasil dikirimkan ke email Anda",
		"email":   req.Email,
	}, nil
}

func (s *service) VerifyRegisterOTP(ctx context.Context, req VerifyOTPRequest) error {
	if _, err := s.repo.CheckRateLimit(ctx, req.Email, "VERIFY_OTP"); err != nil {
		return err
	}

	otp, err := s.repo.GetLatestOTP(ctx, req.Email, "REGISTRATION")
	if err != nil {
		return errors.New("kode verifikasi tidak ditemukan atau sudah kedaluwarsa")
	}

	if time.Now().After(otp.ExpiresAt) {
		return errors.New("kode verifikasi sudah kedaluwarsa. Silakan minta kode baru.")
	}

	if otp.Code != req.Code {
		_ = s.repo.IncrementOTPAttempts(ctx, otp.ID)
		_, dur, _ := s.repo.RecordFailedAttempt(ctx, req.Email, "VERIFY_OTP")
		if dur != nil {
			return fmt.Errorf("kode verifikasi salah 3 kali. Akun Anda dikunci sementara selama %d jam untuk alasan keamanan", int(dur.Hours()))
		}
		return errors.New("kode verifikasi salah. Silakan periksa kembali email Anda")
	}

	var payload pendingReg
	if len(otp.PendingPayload) == 0 || string(otp.PendingPayload) == "null" {
		return errors.New("data pendaftaran tidak ditemukan. Silakan daftar kembali.")
	}
	if err := json.Unmarshal(otp.PendingPayload, &payload); err != nil {
		fmt.Printf("[AUTH VERIFY ERROR] Unmarshal pending payload failed for %s: %v | raw: %s\n", req.Email, err, string(otp.PendingPayload))
		return errors.New("data pendaftaran tidak valid")
	}

	u := &User{
		Email:        req.Email,
		PasswordHash: payload.PasswordHash,
		DisplayName:  payload.DisplayName,
		Role:         RolePelapor,
		Status:       "ACTIVE",
		Phone:        payload.Phone,
	}

	if err := s.repo.CreateUser(ctx, u); err != nil {
		return err
	}

	_ = s.repo.MarkOTPUsed(ctx, otp.ID)
	_ = s.repo.ResetRateLimit(ctx, req.Email, "VERIFY_OTP")
	_ = s.repo.ResetRateLimit(ctx, req.Email, "SEND_OTP")

	return nil
}

func (s *service) Login(ctx context.Context, req LoginRequest) (*AuthResponse, error) {
	u, err := s.repo.GetUserByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.New("email atau kata sandi salah")
	}
	if u.Status != "ACTIVE" {
		return nil, errors.New("akun anda sedang dinonaktifkan")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("email atau kata sandi salah")
	}
	if string(u.Role) == "kepala_daerah" {
		u.Role = RoleAdmin
	}
	token, err := s.tokenManager.Generate(u.ID, u.Email, u.DisplayName, string(u.Role), u.OpdID)
	if err != nil {
		return nil, err
	}
	return &AuthResponse{
		Token:   token,
		Profile: *u,
	}, nil
}

func (s *service) SendOTP(ctx context.Context, emailAddress, purpose string) error {
	if _, err := s.repo.CheckRateLimit(ctx, emailAddress, "SEND_OTP"); err != nil {
		return err
	}

	_, dur, err := s.repo.RecordSendOTP(ctx, emailAddress)
	if err != nil {
		return err
	}
	if dur != nil {
		return fmt.Errorf("Anda telah meminta kode OTP sebanyak 3 kali. Mohon tunggu %d jam sebelum meminta kode kembali", int(dur.Hours()))
	}

	num, err := rand.Int(rand.Reader, big.NewInt(900000))
	if err != nil {
		return err
	}
	code := fmt.Sprintf("%06d", num.Int64()+100000)

	otp := &OTPVerification{
		Email:     emailAddress,
		Code:      code,
		Purpose:   purpose,
		Attempts:  0,
		SendCount: 1,
		ExpiresAt: time.Now().Add(10 * time.Minute),
		IsUsed:    false,
	}
	if err := s.repo.SaveOTP(ctx, otp); err != nil {
		return err
	}
	_ = s.emailClient.SendOTP(ctx, emailAddress, code, purpose)
	return nil
}

func (s *service) VerifyOTP(ctx context.Context, req VerifyOTPRequest) error {
	if _, err := s.repo.CheckRateLimit(ctx, req.Email, "VERIFY_OTP"); err != nil {
		return err
	}

	otp, err := s.repo.GetLatestOTP(ctx, req.Email, req.Purpose)
	if err != nil {
		return errors.New("kode verifikasi salah atau sudah kedaluwarsa")
	}
	if time.Now().After(otp.ExpiresAt) {
		return errors.New("kode verifikasi sudah kedaluwarsa")
	}
	if otp.Code != req.Code {
		_ = s.repo.IncrementOTPAttempts(ctx, otp.ID)
		_, dur, _ := s.repo.RecordFailedAttempt(ctx, req.Email, "VERIFY_OTP")
		if dur != nil {
			return fmt.Errorf("kode verifikasi salah 3 kali. Akun Anda dikunci sementara selama %d jam untuk alasan keamanan", int(dur.Hours()))
		}
		return errors.New("kode verifikasi salah")
	}

	_ = s.repo.MarkOTPUsed(ctx, otp.ID)
	_ = s.repo.ResetRateLimit(ctx, req.Email, "VERIFY_OTP")
	_ = s.repo.ResetRateLimit(ctx, req.Email, "SEND_OTP")
	return nil
}

func (s *service) ForgotPassword(ctx context.Context, emailAddress string) (map[string]any, error) {
	u, err := s.repo.GetUserByEmail(ctx, emailAddress)
	if err != nil || u == nil {
		return nil, errors.New("email tidak terdaftar dalam sistem Govra")
	}

	if _, err := s.repo.CheckRateLimit(ctx, emailAddress, "SEND_OTP"); err != nil {
		return nil, err
	}

	_, dur, err := s.repo.RecordSendOTP(ctx, emailAddress)
	if err != nil {
		return nil, err
	}
	if dur != nil {
		return nil, fmt.Errorf("Anda telah meminta reset kata sandi sebanyak 3 kali. Mohon tunggu %d jam", int(dur.Hours()))
	}

	resetToken := uuid.New().String()
	num, _ := rand.Int(rand.Reader, big.NewInt(900000))
	code := fmt.Sprintf("%06d", num.Int64()+100000)

	otp := &OTPVerification{
		Email:     emailAddress,
		Code:      code,
		Purpose:   "PASSWORD_RESET",
		Token:     resetToken,
		Attempts:  0,
		SendCount: 1,
		ExpiresAt: time.Now().Add(1 * time.Hour),
		IsUsed:    false,
	}
	if err := s.repo.SaveOTP(ctx, otp); err != nil {
		return nil, err
	}

	resetLink := fmt.Sprintf("http://localhost:3000/atur-sandi?token=%s&email=%s", resetToken, url.QueryEscape(emailAddress))
	fmt.Printf("[AUTH RESET] Generated reset link for %s: %s | code: %s\n", emailAddress, resetLink, code)
	_ = s.emailClient.SendPasswordResetLink(ctx, emailAddress, resetLink)

	return map[string]any{
		"message": "Tautan atur ulang kata sandi telah dikirimkan ke email Anda",
	}, nil
}

func (s *service) ResetPassword(ctx context.Context, req ResetPasswordRequest) error {
	if len(req.NewPassword) < 8 {
		return errors.New("kata sandi baru minimal 8 karakter")
	}

	if _, err := s.repo.CheckRateLimit(ctx, req.Email, "VERIFY_OTP"); err != nil {
		return err
	}

	var otp *OTPVerification
	var err error

	if req.Token != "" {
		otp, err = s.repo.GetOTPByToken(ctx, req.Token)
	} else if req.Code != "" {
		otp, err = s.repo.GetLatestOTP(ctx, req.Email, "PASSWORD_RESET")
		if err == nil && otp.Code != req.Code {
			err = errors.New("kode tidak cocok")
		}
	} else {
		return errors.New("token atau kode verifikasi wajib disertakan")
	}

	if err != nil || otp == nil || otp.IsUsed || time.Now().After(otp.ExpiresAt) {
		_, dur, _ := s.repo.RecordFailedAttempt(ctx, req.Email, "VERIFY_OTP")
		if dur != nil {
			return fmt.Errorf("percobaan gagal 3 kali. Akun Anda dikunci sementara selama %d jam untuk alasan keamanan", int(dur.Hours()))
		}
		return errors.New("tautan atau kode reset kata sandi tidak valid atau sudah kedaluwarsa")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	if err := s.repo.UpdatePassword(ctx, req.Email, string(hash)); err != nil {
		return err
	}

	_ = s.repo.MarkOTPUsed(ctx, otp.ID)
	_ = s.repo.ResetRateLimit(ctx, req.Email, "VERIFY_OTP")
	_ = s.repo.ResetRateLimit(ctx, req.Email, "SEND_OTP")

	return nil
}

func (s *service) GetProfile(ctx context.Context, userID string) (*User, error) {
	return s.repo.GetUserByID(ctx, userID)
}
