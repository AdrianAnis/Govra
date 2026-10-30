package email

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type Client struct {
	apiKey     string
	fromEmail  string
	httpClient *http.Client
}

func NewClient(apiKey string, fromEmail ...string) *Client {
	from := ""
	if len(fromEmail) > 0 {
		from = fromEmail[0]
	}
	if from == "" {
		from = "Govra <noreply@pradatelyu.online>"
	}
	return &Client{
		apiKey:    apiKey,
		fromEmail: from,
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

func (c *Client) sendHTTP(ctx context.Context, from, toEmail, subject, htmlContent string) error {
	reqBody := resendRequest{
		From:    from,
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

	body, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 400 {
		return fmt.Errorf("status %d: %s", res.StatusCode, string(body))
	}
	return nil
}

func (c *Client) sendWithFallback(ctx context.Context, toEmail, subject, htmlContent string) error {
	from := c.fromEmail
	if from == "" {
		from = "Govra <noreply@pradatelyu.online>"
	}

	err := c.sendHTTP(ctx, from, toEmail, subject, htmlContent)
	if err == nil {
		fmt.Printf("[RESEND SUCCESS] Delivered to %s using %s\n", toEmail, from)
		return nil
	}

	errStr := err.Error()
	if (strings.Contains(errStr, "not verified") || strings.Contains(errStr, "validation_error")) && !strings.Contains(from, "pradatelyu.online") {
		fallbackFrom := "Govra <noreply@pradatelyu.online>"
		fmt.Printf("[RESEND FALLBACK] Domain %s not yet active, retrying with %s\n", from, fallbackFrom)
		fallbackErr := c.sendHTTP(ctx, fallbackFrom, toEmail, subject, htmlContent)
		if fallbackErr == nil {
			fmt.Printf("[RESEND SUCCESS] Delivered to %s using verified fallback %s\n", toEmail, fallbackFrom)
			return nil
		}
		fmt.Printf("[RESEND ERROR] Fallback failed for %s: %v\n", toEmail, fallbackErr)
		return fallbackErr
	}

	fmt.Printf("[RESEND ERROR] Failed for %s: %v\n", toEmail, err)
	return err
}

func (c *Client) SendOTP(ctx context.Context, toEmail, code, purpose string) error {
	if c.apiKey == "" || strings.HasPrefix(c.apiKey, "test-") {
		return nil
	}

	subject := "Kode Verifikasi Govra: " + code
	htmlContent := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
			<h2 style="color: #0f172a; margin-top: 0;">Verifikasi Akun Govra</h2>
			<p style="color: #334155; font-size: 16px; line-height: 1.5;">Gunakan kode verifikasi berikut untuk menyelesaikan %s:</p>
			<div style="background-color: #f1f5f9; border-radius: 6px; text-align: center; padding: 16px; margin: 24px 0;">
				<span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7;">%s</span>
			</div>
			<p style="color: #64748b; font-size: 14px; line-height: 1.5;">Kode ini berlaku selama 10 menit. Jangan berikan kode ini kepada siapa pun.</p>
			<p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">Silakan periksa kotak masuk (inbox) atau folder spam email Anda.</p>
		</div>
	`, purpose, code)

	return c.sendWithFallback(ctx, toEmail, subject, htmlContent)
}

func (c *Client) SendPasswordResetLink(ctx context.Context, toEmail, resetLink string) error {
	if c.apiKey == "" || strings.HasPrefix(c.apiKey, "test-") {
		return nil
	}

	subject := "Atur Ulang Kata Sandi Akun Govra"
	htmlContent := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
			<h2 style="color: #0f172a; margin-top: 0;">Atur Ulang Kata Sandi</h2>
			<p style="color: #334155; font-size: 16px; line-height: 1.5;">Kami menerima permintaan untuk mengatur ulang kata sandi akun Govra Anda. Klik tombol di bawah ini untuk membuat kata sandi baru:</p>
			<div style="text-align: center; margin: 32px 0;">
				<a href="%s" style="background-color: #0284c7; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 6px; display: inline-block;">Atur Ulang Kata Sandi</a>
			</div>
			<p style="color: #64748b; font-size: 14px; line-height: 1.5;">Tautan ini berlaku selama 1 jam. Jika Anda tidak meminta pengaturan ulang kata sandi, abaikan email ini.</p>
			<p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">Silakan periksa kotak masuk (inbox) atau folder spam email Anda.</p>
		</div>
	`, resetLink)

	return c.sendWithFallback(ctx, toEmail, subject, htmlContent)
}
