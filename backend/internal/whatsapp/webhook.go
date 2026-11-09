package whatsapp

import (
	"context"
	"crypto/subtle"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"govra/internal/platform/phone"
)

const (
	WebhookPath      = "/webhooks/fonnte"
	replyTimeout     = 15 * time.Second
	replyLimit       = 3
	replyWindow      = time.Hour
	limiterMaxSender = 5000
)

type incoming struct {
	Sender  string `json:"sender" form:"sender"`
	Message string `json:"message" form:"message"`
	Device  string `json:"device" form:"device"`
	Member  string `json:"member" form:"member"`
	IsGroup string `json:"isgroup" form:"isgroup"`
}

type Webhook struct {
	sender  Sender
	secret  string
	webURL  string
	mu      sync.Mutex
	replies map[string][]time.Time
}

func NewWebhook(sender Sender, secret, webURL string) *Webhook {
	return &Webhook{
		sender:  sender,
		secret:  secret,
		webURL:  webURL,
		replies: make(map[string][]time.Time),
	}
}

func (w *Webhook) RegisterRoutes(router fiber.Router) {
	router.Get(WebhookPath, func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})
	router.Post(WebhookPath, w.Handle)
}

func (w *Webhook) authorized(c *fiber.Ctx) bool {
	if w.secret == "" {
		return false
	}
	given := c.Query("secret")
	return subtle.ConstantTimeCompare([]byte(given), []byte(w.secret)) == 1
}

func (w *Webhook) allowReply(sender string) bool {
	w.mu.Lock()
	defer w.mu.Unlock()
	now := time.Now()
	if len(w.replies) > limiterMaxSender {
		w.replies = make(map[string][]time.Time)
	}
	var recent []time.Time
	for _, t := range w.replies[sender] {
		if now.Sub(t) < replyWindow {
			recent = append(recent, t)
		}
	}
	if len(recent) >= replyLimit {
		w.replies[sender] = recent
		return false
	}
	w.replies[sender] = append(recent, now)
	return true
}

func (w *Webhook) Handle(c *fiber.Ctx) error {
	if !w.authorized(c) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"status": "unauthorized"})
	}
	var msg incoming
	if err := c.BodyParser(&msg); err != nil {
		return c.JSON(fiber.Map{"status": "ignored"})
	}
	target, ok := phone.Normalize(msg.Sender)
	if !ok || strings.TrimSpace(msg.Message) == "" {
		return c.JSON(fiber.Map{"status": "ignored"})
	}
	if msg.Member != "" || strings.EqualFold(msg.IsGroup, "true") {
		return c.JSON(fiber.Map{"status": "ignored"})
	}
	if device, deviceOK := phone.Normalize(msg.Device); deviceOK && device == target {
		return c.JSON(fiber.Map{"status": "ignored"})
	}
	if !w.allowReply(target) {
		return c.JSON(fiber.Map{"status": "limited"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), replyTimeout)
	defer cancel()
	if err := w.sender.Send(ctx, target, AutoReply(w.webURL)); err != nil {
		log.Printf("whatsapp: gagal membalas %s: %v", phone.Mask(target), err)
		return c.JSON(fiber.Map{"status": "failed"})
	}
	return c.JSON(fiber.Map{"status": "replied"})
}
