package email

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type Client struct {
	apiKey     string
	httpClient *http.Client
}

func NewClient(apiKey string) *Client {
	return &Client{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

type resendRequest struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html"`
}

func (c *Client) SendOTP(ctx context.Context, toEmail, code, purpose string) error {
	subject := "Kode Verifikasi Govra: " + code
	htmlContent := fmt.Sprintf(`
		<div style="font-family: sans-serif; padding: 20px; color: #111;">
			<h2>Verifikasi Akun Govra</h2>
			<p>Gunakan kode verifikasi berikut untuk melanjutkan %s:</p>
			<div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 12px 0; color: #0284c7;">%s</div>
			<p>Kode ini berlaku selama 10 menit. Jangan berikan kode ini kepada siapa pun.</p>
		</div>
	`, purpose, code)

	reqBody := resendRequest{
		From:    "Govra <onboarding@resend.dev>",
		To:      []string{toEmail},
		Subject: subject,
		HTML:    htmlContent,
	}

	payload, err := json.Marshal(reqBody)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.resend.com/emails", bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")

	res, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= 400 {
		return fmt.Errorf("resend api error status %d", res.StatusCode)
	}
	return nil
}
