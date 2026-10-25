package auth

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"time"

	"golang.org/x/crypto/bcrypt"
	"govra/internal/platform/auth"
	"govra/internal/platform/email"
)

type Service interface {
	Register(ctx context.Context, req RegisterRequest) (*AuthResponse, error)
	Login(ctx context.Context, req LoginRequest) (*AuthResponse, error)
	SendOTP(ctx context.Context, emailAddress, purpose string) error
	VerifyOTP(ctx context.Context, req VerifyOTPRequest) error
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

func (s *service) Register(ctx context.Context, req RegisterRequest) (*AuthResponse, error) {
	if len(req.Password) < 8 {
		return nil, errors.New("kata sandi minimal 8 karakter")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	u := &User{
		Email:        req.Email,
		PasswordHash: string(hash),
		DisplayName:  req.DisplayName,
		Role:         RolePelapor,
		Status:       "ACTIVE",
		Phone:        req.Phone,
	}
	if err := s.repo.CreateUser(ctx, u); err != nil {
		return nil, err
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
	otp, err := s.repo.GetLatestOTP(ctx, req.Email, req.Purpose)
	if err != nil {
		return errors.New("kode verifikasi salah atau sudah kedaluwarsa")
	}
	if time.Now().After(otp.ExpiresAt) {
		return errors.New("kode verifikasi sudah kedaluwarsa")
	}
	if otp.Attempts >= 5 {
		return errors.New("batas percobaan kode verifikasi telah habis")
	}
	if otp.Code != req.Code {
		_ = s.repo.IncrementOTPAttempts(ctx, otp.ID)
		return errors.New("kode verifikasi salah")
	}
	return s.repo.MarkOTPUsed(ctx, otp.ID)
}

func (s *service) ResetPassword(ctx context.Context, req ResetPasswordRequest) error {
	if len(req.NewPassword) < 8 {
		return errors.New("kata sandi baru minimal 8 karakter")
	}
	err := s.VerifyOTP(ctx, VerifyOTPRequest{
		Email:   req.Email,
		Code:    req.Code,
		Purpose: "PASSWORD_RESET",
	})
	if err != nil {
		return err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	return s.repo.UpdatePassword(ctx, req.Email, string(hash))
}

func (s *service) GetProfile(ctx context.Context, userID string) (*User, error) {
	return s.repo.GetUserByID(ctx, userID)
}
