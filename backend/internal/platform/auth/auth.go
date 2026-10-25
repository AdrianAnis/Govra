package auth

import (
	"errors"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"govra/internal/platform/httpx"
)

type UserClaims struct {
	UserID      string `json:"sub"`
	Email       string `json:"email"`
	DisplayName string `json:"display_name"`
	Role        string `json:"role"`
	OpdID       string `json:"opd_id,omitempty"`
	jwt.RegisteredClaims
}

type TokenManager struct {
	secret []byte
}

func NewTokenManager(secret string) *TokenManager {
	return &TokenManager{
		secret: []byte(secret),
	}
}

func (m *TokenManager) Generate(userID, email, displayName, role, opdID string) (string, error) {
	claims := UserClaims{
		UserID:      userID,
		Email:       email,
		DisplayName: displayName,
		Role:        role,
		OpdID:       opdID,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			Issuer:    "govra-api",
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(m.secret)
}

func (m *TokenManager) Verify(tokenString string) (*UserClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &UserClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid signing method")
		}
		return m.secret, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*UserClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}
	return claims, nil
}

func AuthMiddleware(tm *TokenManager) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			c.Locals("role", "anon")
			return c.Next()
		}
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return httpx.NewAppError(fiber.StatusUnauthorized, "UNAUTHORIZED", "Format token tidak valid")
		}
		claims, err := tm.Verify(parts[1])
		if err != nil {
			return httpx.NewAppError(fiber.StatusUnauthorized, "UNAUTHORIZED", "Sesi login kedaluwarsa atau tidak valid")
		}
		c.Locals("user_id", claims.UserID)
		c.Locals("email", claims.Email)
		c.Locals("display_name", claims.DisplayName)
		c.Locals("role", claims.Role)
		c.Locals("opd_id", claims.OpdID)
		return c.Next()
	}
}

func RequireRole(allowedRoles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		roleVal, ok := c.Locals("role").(string)
		if !ok || roleVal == "" || roleVal == "anon" {
			return httpx.NewAppError(fiber.StatusUnauthorized, "UNAUTHORIZED", "Wajib masuk terlebih dahulu")
		}
		for _, r := range allowedRoles {
			if r == roleVal {
				return c.Next()
			}
		}
		return httpx.NewAppError(fiber.StatusForbidden, "FORBIDDEN", "Anda tidak memiliki hak akses untuk tindakan ini")
	}
}

func CurrentRole(c *fiber.Ctx) string {
	val, ok := c.Locals("role").(string)
	if !ok || val == "" {
		return "anon"
	}
	return val
}

func CurrentUserID(c *fiber.Ctx) string {
	val, ok := c.Locals("user_id").(string)
	if !ok {
		return ""
	}
	return val
}

func CurrentOpdID(c *fiber.Ctx) string {
	val, ok := c.Locals("opd_id").(string)
	if !ok {
		return ""
	}
	return val
}
