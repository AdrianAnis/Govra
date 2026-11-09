package whatsapp

import (
	"context"
	"crypto/subtle"
	"encoding/json"
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
	Sender  string
	Message string
	Device  string
	Member  string
	IsGroup string
}

func rawText(raw json.RawMessage) string {
	var text string
	if err := json.Unmarshal(raw, &text); err == nil {
		return strings.TrimSpace(text)
	}
	value := strings.TrimSpace(string(raw))
	if value == "null" {
		return ""
	}
	return value
}

func parseIncoming(c *fiber.Ctx) incoming {
	if strings.Contains(strings.ToLower(c.Get(fiber.HeaderContentType)), "json") {
		var fields map[string]json.RawMessage
		if err := json.Unmarshal(c.Body(), &fields); err != nil {
			return incoming{}
		}
		return incoming{
			Sender:  rawText(fields["sender"]),
			Message: rawText(fields["message"]),
			Device:  rawText(fields["device"]),
			Member:  rawText(fields["member"]),
			IsGroup: rawText(fields["isgroup"]),
		}
	}
	return incoming{
		Sender:  strings.TrimSpace(c.FormValue("sender")),
		Message: strings.TrimSpace(c.FormValue("message")),
		Device:  strings.TrimSpace(c.FormValue("device")),
		Member:  strings.TrimSpace(c.FormValue("member")),
		IsGroup: strings.TrimSpace(c.FormValue("isgroup")),
	}
}

func isMember(value string) bool {
	switch strings.ToLower(value) {
	case "", "false", "null", "0":
		return false
	}
	return true
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
		log.Printf("whatsapp: webhook ditolak, secret tidak cocok")
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"status": "unauthorized"})
	}
	msg := parseIncoming(c)
	target, ok := phone.Normalize(msg.Sender)
	if !ok || msg.Message == "" {
		log.Printf("whatsapp: webhook diabaikan, pengirim atau pesan tidak terbaca (%s)", c.Get(fiber.HeaderContentType))
		return c.JSON(fiber.Map{"status": "ignored"})
	}
	if isMember(msg.Member) || strings.EqualFold(msg.IsGroup, "true") {
		log.Printf("whatsapp: webhook dari %s diabaikan (grup)", phone.Mask(target))
		return c.JSON(fiber.Map{"status": "ignored"})
	}
	if device, deviceOK := phone.Normalize(msg.Device); deviceOK && device == target {
		log.Printf("whatsapp: webhook dari %s diabaikan (pesan dari nomor sendiri)", phone.Mask(target))
		return c.JSON(fiber.Map{"status": "ignored"})
	}
	if !w.allowReply(target) {
		log.Printf("whatsapp: webhook dari %s dibatasi (terlalu sering)", phone.Mask(target))
		return c.JSON(fiber.Map{"status": "limited"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), replyTimeout)
	defer cancel()
	if err := w.sender.Send(ctx, target, AutoReply(w.webURL)); err != nil {
		log.Printf("whatsapp: gagal membalas %s: %v", phone.Mask(target), err)
		return c.JSON(fiber.Map{"status": "failed"})
	}
	log.Printf("whatsapp: membalas %s", phone.Mask(target))
	return c.JSON(fiber.Map{"status": "replied"})
}
