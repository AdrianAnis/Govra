package whatsapp

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const fonnteEndpoint = "https://api.fonnte.com/send"

var ErrNotConfigured = errors.New("token fonnte belum dikonfigurasi")

type Sender interface {
	Send(ctx context.Context, target, message string) error
}

type Client struct {
	token    string
	endpoint string
	http     *http.Client
}

func NewClient(token string) *Client {
	return &Client{
		token:    strings.TrimSpace(token),
		endpoint: fonnteEndpoint,
		http:     &http.Client{Timeout: 15 * time.Second},
	}
}

func (c *Client) Enabled() bool {
	return c != nil && c.token != ""
}

type fonnteResponse struct {
	Status bool   `json:"status"`
	Reason string `json:"reason"`
}

func (c *Client) Send(ctx context.Context, target, message string) error {
	if !c.Enabled() {
		return ErrNotConfigured
	}
	form := url.Values{
		"target":      {target},
		"message":     {message},
		"countryCode": {"62"},
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.endpoint, strings.NewReader(form.Encode()))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", c.token)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := c.http.Do(req)
	if err != nil {
		return errors.New("gagal menghubungi fonnte")
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		return fmt.Errorf("fonnte membalas status %d", resp.StatusCode)
	}
	var parsed fonnteResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return errors.New("balasan fonnte tidak dapat dibaca")
	}
	if !parsed.Status {
		reason := parsed.Reason
		if reason == "" {
			reason = "pengiriman ditolak"
		}
		return fmt.Errorf("fonnte menolak: %s", reason)
	}
	return nil
}
