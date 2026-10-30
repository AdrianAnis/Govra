package auth

import (
	"errors"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"govra/internal/platform/httpx"
)

type UserClaims struct {
	UserID      string `json:"sub"`
	Email       string `json:"email"`
	DisplayName string `json:"name"`
	Role        string `json:"role"`
	OpdID       string `json:"opd_id"`
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
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(m.secret)
}

func (m *TokenManager) Verify(tokenString string) (*UserClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &UserClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
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
		bffKey := c.Get("X-BFF-Key")
		expectedBFFKey := os.Getenv("BFF_SHARED_KEY")
		isBFF := bffKey != "" && expectedBFFKey != "" && bffKey == expectedBFFKey

		if authHeader == "" {
			if isBFF {
				c.Locals("role", "admin")
				c.Locals("user_id", "system-bff")
				return c.Next()
			}
			c.Locals("role", "anon")
			c.Locals("user_id", "")
			return c.Next()
		}
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			if isBFF {
				c.Locals("role", "admin")
				c.Locals("user_id", "system-bff")
				return c.Next()
			}
			return httpx.NewAppError(fiber.StatusUnauthorized, "UNAUTHORIZED", "Format token tidak valid")
		}
		claims, err := tm.Verify(parts[1])
		if err != nil {
			if isBFF {
				c.Locals("role", "admin")
				c.Locals("user_id", "system-bff")
				return c.Next()
			}
			return httpx.NewAppError(fiber.StatusUnauthorized, "UNAUTHORIZED", "Token tidak valid atau kadaluarsa")
		}
		c.Locals("user_id", claims.UserID)
		c.Locals("email", claims.Email)
		c.Locals("role", claims.Role)
		c.Locals("opd_id", claims.OpdID)
		c.Locals("claims", claims)
		return c.Next()
	}
}

func RequireRole(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRole, ok := c.Locals("role").(string)
		if !ok || userRole == "" {
			return httpx.NewAppError(fiber.StatusUnauthorized, "UNAUTHORIZED", "Autentikasi diperlukan")
		}
		for _, r := range roles {
			if userRole == r {
				return c.Next()
			}
		}
		return httpx.NewAppError(fiber.StatusForbidden, "FORBIDDEN", "Anda tidak memiliki akses ke sumber daya ini")
	}
}

func RequireAuth() fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("user_id").(string)
		if !ok || userID == "" {
			return httpx.NewAppError(fiber.StatusUnauthorized, "UNAUTHORIZED", "Autentikasi diperlukan")
		}
		return c.Next()
	}
}

func GetUserID(c *fiber.Ctx) string {
	if val, ok := c.Locals("user_id").(string); ok {
		return val
	}
	return ""
}

func GetEmail(c *fiber.Ctx) string {
	if val, ok := c.Locals("email").(string); ok {
		return val
	}
	return ""
}

func GetRole(c *fiber.Ctx) string {
	if val, ok := c.Locals("role").(string); ok {
		return val
	}
	return ""
}

func GetOpdID(c *fiber.Ctx) string {
	if val, ok := c.Locals("opd_id").(string); ok {
		return val
	}
	return ""
}

func CurrentUserID(c *fiber.Ctx) string {
	return GetUserID(c)
}

func CurrentRole(c *fiber.Ctx) string {
	val, ok := c.Locals("role").(string)
	if !ok || val == "" {
		return "anon"
	}
	return val
}

func CurrentOpdID(c *fiber.Ctx) string {
	return GetOpdID(c)
}
