package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type Client struct {
	apiKey     string
	model      string
	httpClient *http.Client
}

type TriageResult struct {
	OpdCode           string  `json:"opd_code"`
	CategoryCode      string  `json:"category_code"`
	Confidence        float64 `json:"confidence"`
	SafetyRisk        string  `json:"safety_risk"`
	IsSensitive       bool    `json:"is_sensitive"`
	Summary           string  `json:"summary"`
	RecommendedAction string  `json:"recommended_action"`
}

type geminiPart struct {
	Text       string            `json:"text,omitempty"`
	InlineData *geminiInlineData `json:"inline_data,omitempty"`
}

type geminiInlineData struct {
	MimeType string `json:"mime_type"`
	Data     string `json:"data"`
}

type geminiContent struct {
	Parts []geminiPart `json:"parts"`
}

type geminiRequest struct {
	Contents []geminiContent `json:"contents"`
}

type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

func NewClient(apiKey, model string) *Client {
	if model == "" {
		model = "gemini-2.5-flash"
	}
	return &Client{
		apiKey: apiKey,
		model:  model,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *Client) ClassifyReport(ctx context.Context, title, description, district, village string) (*TriageResult, error) {
	prompt := fmt.Sprintf(`Anda adalah AI Triage Pengaduan Pemerintah Daerah.
Tugas Anda adalah membaca judul dan penjelasan laporan warga lalu mengklasifikasikan dinas penanggung jawab.

Daftar OPD:
- DBM-SDA: Jalan berlubang, aspal rusak, jembatan, tanggul, saluran air, drainase banjir
- DLHK: Tumpukan sampah liar, limbah, pohon tumbang, pencemaran lingkungan
- DISHUB: Lampu jalan mati, rambu lalu lintas rusak, traffic light macet, parkir liar
- DINKES: Fasilitas puskesmas, wabah penyakit, sanitasi air bersih
- SATPOL-PP: Gangguan ketertiban umum, pedagang liar yang menutup akses jalan
- BPBD: Bencana alam, longsor, pohon roboh darurat, banjir bandang

Judul: %s
Deskripsi Masalah: %s
Lokasi: Kecamatan %s, Kelurahan %s

Keluarkan HANYA JSON tanpa format markdown:
{
  "opd_code": "DBM-SDA",
  "category_code": "JALAN-RUSAK",
  "confidence": 0.95,
  "safety_risk": "NONE",
  "is_sensitive": false,
  "summary": "Ringkasan padat laporan maksimal 150 karakter",
  "recommended_action": "Rekomendasi tindakan untuk admin pusat"
}`, title, description, district, village)

	raw, err := c.generateContent(ctx, geminiRequest{
		Contents: []geminiContent{
			{Parts: []geminiPart{{Text: prompt}}},
		},
	})
	if err != nil {
		return &TriageResult{
			OpdCode:           "DBM-SDA",
			CategoryCode:      "JALAN-RUSAK",
			Confidence:        0.70,
			SafetyRisk:        "NONE",
			Summary:           title,
			RecommendedAction: "Perlu verifikasi manual oleh admin",
		}, nil
	}

	cleaned := cleanJSON(raw)
	var res TriageResult
	if err := json.Unmarshal([]byte(cleaned), &res); err != nil {
		return &TriageResult{
			OpdCode:           "DBM-SDA",
			CategoryCode:      "JALAN-RUSAK",
			Confidence:        0.70,
			SafetyRisk:        "NONE",
			Summary:           title,
			RecommendedAction: "Perlu verifikasi manual oleh admin",
		}, nil
	}
	return &res, nil
}

func (c *Client) TranscribeAudio(ctx context.Context, audioBase64, mimeType string) (string, error) {
	if mimeType == "" {
		mimeType = "audio/mp3"
	}
	req := geminiRequest{
		Contents: []geminiContent{
			{
				Parts: []geminiPart{
					{
						InlineData: &geminiInlineData{
							MimeType: mimeType,
							Data:     audioBase64,
						},
					},
					{
						Text: "Transkripsikan rekaman suara laporan warga ini ke dalam Bahasa Indonesia yang akurat dan rapi. Hanya keluarkan hasil teks transkripsi tanpa komentar pembuka atau penutup.",
					},
				},
			},
		},
	}
	text, err := c.generateContent(ctx, req)
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(text), nil
}

func (c *Client) generateContent(ctx context.Context, reqBody geminiRequest) (string, error) {
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", c.model, c.apiKey)
	data, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(data))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("gemini api error status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var gResp geminiResponse
	if err := json.Unmarshal(bodyBytes, &gResp); err != nil {
		return "", err
	}
	if len(gResp.Candidates) == 0 || len(gResp.Candidates[0].Content.Parts) == 0 {
		return "", errors.New("empty response from gemini")
	}
	return gResp.Candidates[0].Content.Parts[0].Text, nil
}

func cleanJSON(s string) string {
	s = strings.TrimSpace(s)
	s = strings.TrimPrefix(s, "```json")
	s = strings.TrimPrefix(s, "```")
	s = strings.TrimSuffix(s, "```")
	return strings.TrimSpace(s)
}
