package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"strings"
	"time"

	"govra/internal/platform/catalog"
)

type Client struct {
	apiKey     string
	model      string
	httpClient *http.Client
}

type ModerationResult struct {
	IsViolation    bool    `json:"is_violation"`
	ViolationType  string  `json:"violation_type"`
	Confidence     float64 `json:"confidence"`
	Reason         string  `json:"reason"`
	Topic          string  `json:"topic"`
	EstimatedOpd   string  `json:"estimated_opd"`
	SuggestedTitle string  `json:"suggested_title"`
}

type SimilarityResult struct {
	TopicSimilarity    float64 `json:"topic_similarity"`
	LocationSimilarity float64 `json:"location_similarity"`
	TotalSimilarity    float64 `json:"total_similarity"`
	IsSimilar          bool    `json:"is_similar"`
}

type TriageResult struct {
	OpdCode           string  `json:"opd_code"`
	OpdName           string  `json:"opd_name"`
	CategoryCode      string  `json:"category_code"`
	CategoryName      string  `json:"category_name"`
	Confidence        float64 `json:"confidence"`
	SafetyRisk        string  `json:"safety_risk"`
	IsSensitive       bool    `json:"is_sensitive"`
	IsUnregisteredOpd bool    `json:"is_unregistered_opd"`
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

func unregisteredResult(title, action string) *TriageResult {
	return &TriageResult{
		OpdCode:           catalog.Unregistered,
		OpdName:           "Belum Ditentukan",
		CategoryName:      "Belum Ditentukan",
		SafetyRisk:        "NONE",
		IsUnregisteredOpd: true,
		Summary:           title,
		RecommendedAction: action,
	}
}

func (c *Client) ClassifyReport(ctx context.Context, title, description, district, village string) (*TriageResult, error) {
	prompt := fmt.Sprintf(`Anda adalah AI Triage Pengaduan Pemerintah Daerah Kota.
Baca judul dan deskripsi pengaduan warga, lalu pilih SATU kategori yang paling tepat dari daftar resmi berikut. Dinas penanggung jawab otomatis mengikuti kategori yang dipilih.

Daftar dinas dan kategori resmi:
%s
Panduan memilih:
- Pilih berdasarkan masalah utama yang dialami warga, bukan lokasinya.
- Banjir yang disebabkan saluran tersumbat masuk DRAINASE-TERSUMBAT; banjir besar, longsor, atau kondisi darurat masuk BENCANA-ALAM.
- Jika ada nyawa terancam atau korban, tetapkan safety_risk "HIGH" dan is_sensitive true.
- Jika pengaduan TIDAK masuk wewenang satu pun kategori di atas (misalnya sengketa tanah antarwarga, KTP/akta, pajak, gaji, izin usaha, tindak kriminal, urusan sekolah), isi category_code "%s" dan is_unregistered_opd true.

Judul: %s
Deskripsi Masalah: %s
Lokasi: Kecamatan %s, Kelurahan %s

Keluarkan HANYA JSON tanpa markdown:
{
  "category_code": "salah satu kode kategori di atas atau %s",
  "confidence": 0.0 sampai 1.0,
  "safety_risk": "NONE" atau "LOW" atau "MEDIUM" atau "HIGH",
  "is_sensitive": false,
  "is_unregistered_opd": false,
  "summary": "Ringkasan padat laporan maksimal 150 karakter",
  "recommended_action": "Rekomendasi tindakan singkat untuk Admin Pusat"
}`, catalog.Prompt(), catalog.Unregistered, title, description, district, village, catalog.Unregistered)

	raw, err := c.generateContent(ctx, geminiRequest{
		Contents: []geminiContent{
			{Parts: []geminiPart{{Text: prompt}}},
		},
	})
	if err != nil {
		return unregisteredResult(title, "Klasifikasi AI belum tersedia. Mohon tentukan dinas tujuan secara manual."), nil
	}

	var res TriageResult
	if err := json.Unmarshal([]byte(cleanJSON(raw)), &res); err != nil {
		return unregisteredResult(title, "Klasifikasi AI belum tersedia. Mohon tentukan dinas tujuan secara manual."), nil
	}

	category, known := catalog.FindCategory(res.CategoryCode)
	if !known || res.IsUnregisteredOpd {
		result := unregisteredResult(res.Summary, "Laporan ini tidak masuk ke dinas manapun yang terdaftar. Mohon tentukan dinas tujuan secara manual oleh Admin Pusat.")
		result.Confidence = res.Confidence
		result.SafetyRisk = normalizeRisk(res.SafetyRisk)
		result.IsSensitive = res.IsSensitive
		if result.Summary == "" {
			result.Summary = title
		}
		return result, nil
	}

	opd, _ := catalog.FindOpd(category.OpdCode)
	res.OpdCode = opd.Code
	res.OpdName = opd.Name
	res.CategoryCode = category.Code
	res.CategoryName = category.Name
	res.IsUnregisteredOpd = false
	res.SafetyRisk = normalizeRisk(res.SafetyRisk)
	res.Confidence = math.Min(1, math.Max(0, res.Confidence))
	if res.Summary == "" {
		res.Summary = title
	}
	return &res, nil
}

func normalizeRisk(risk string) string {
	switch strings.ToUpper(strings.TrimSpace(risk)) {
	case "LOW", "MEDIUM", "HIGH":
		return strings.ToUpper(strings.TrimSpace(risk))
	}
	return "NONE"
}

func (c *Client) TranscribeAudio(ctx context.Context, audioBase64, mimeType string) (string, error) {
	if mimeType == "" {
		mimeType = "audio/webm"
	}
	if idx := strings.Index(mimeType, ";"); idx != -1 {
		mimeType = strings.TrimSpace(mimeType[:idx])
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
	if c.apiKey == "" || c.apiKey == "test-gemini-key" || strings.HasPrefix(c.apiKey, "mock") {
		return "{}", errors.New("gemini api key not configured")
	}

	candidateModels := []string{c.model, "gemini-3-flash-preview", "gemini-3.5-flash", "gemini-2.5-flash"}
	data, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	var lastErr error
	for _, m := range candidateModels {
		if m == "" {
			continue
		}
		url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", m, c.apiKey)
		req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(data))
		if err != nil {
			lastErr = err
			continue
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := c.httpClient.Do(req)
		if err != nil {
			lastErr = err
			continue
		}

		bodyBytes, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			lastErr = err
			continue
		}

		if resp.StatusCode >= 400 {
			lastErr = fmt.Errorf("gemini api error on %s status %d: %s", m, resp.StatusCode, string(bodyBytes))
			continue
		}

		var gResp geminiResponse
		if err := json.Unmarshal(bodyBytes, &gResp); err != nil {
			lastErr = err
			continue
		}
		if len(gResp.Candidates) == 0 || len(gResp.Candidates[0].Content.Parts) == 0 {
			lastErr = errors.New("empty response from gemini")
			continue
		}
		return gResp.Candidates[0].Content.Parts[0].Text, nil
	}

	if lastErr != nil {
		return "", lastErr
	}
	return "", errors.New("all gemini candidate models failed")
}

func cleanJSON(s string) string {
	s = strings.TrimSpace(s)
	s = strings.TrimPrefix(s, "```json")
	s = strings.TrimPrefix(s, "```")
	s = strings.TrimSuffix(s, "```")
	return strings.TrimSpace(s)
}

func (c *Client) CheckContentModeration(ctx context.Context, text string) (*ModerationResult, error) {
	if c.apiKey == "" {
		return &ModerationResult{
			IsViolation:   false,
			ViolationType: "NONE",
			Confidence:    0.0,
			Topic:         "Umum",
		}, nil
	}
	prompt := fmt.Sprintf(`Anda adalah AI Content Moderation & Triage untuk Sistem Pengaduan Warga Kota Bandung (Govra).
Tugas Anda adalah memeriksa teks laporan warga apakah mengandung:
1. SARA (Ujaran kebencian, diskriminasi/penghinaan suku, agama, ras, antargolongan)
2. PORNOGRAFI (Konten seksual, vulgar, asusila, pornografi, pelecehan seksual)
3. GIBBERISH / TEKS TIDAK JELAS (Ketikan acak keyboard smashing seperti 'asdfghjkl', 'qwertyuiop', 'aaaaaaa', spam tanpa makna yang bukan pengaduan publik nyata)

Teks laporan yang diperiksa:
"%s"

Aturan evaluasi:
- Jika terdeteksi SARA, PORNOGRAFI, atau GIBBERISH dengan confidence > 0.8 (80%%):
  "is_violation": true,
  "violation_type": "SARA" atau "PORNOGRAPHY" atau "GIBBERISH",
  "confidence": angka 0.81 sampai 1.0,
  "reason": "Penjelasan santun dalam Bahasa Indonesia mengapa laporan ini terindikasi melanggar pedoman dan tidak dapat dilanjutkan.",
  "topic": "",
  "estimated_opd": "",
  "suggested_title": ""

- Jika aman (tidak ada pelanggaran atau confidence <= 0.8):
  "is_violation": false,
  "violation_type": "NONE",
  "confidence": angka 0.0 sampai 0.2,
  "reason": "",
  "topic": "Salah satu dari: Jalan & Jembatan, Sampah & Lingkungan, Penerangan Jalan & Dishub, Ketertiban Umum, Kesehatan Lingkungan, Drainase & Banjir, Kebencanaan",
  "estimated_opd": "Salah satu dari: DBM-SDA, DLHK, DISHUB, SATPOL-PP, DINKES, BPBD",
  "suggested_title": "Judul singkat maksimal 60 karakter yang merangkum masalah"

Keluarkan HANYA format JSON murni tanpa markdown triple backticks.`, text)

	raw, err := c.generateContent(ctx, geminiRequest{
		Contents: []geminiContent{
			{Parts: []geminiPart{{Text: prompt}}},
		},
	})
	if err != nil {
		return &ModerationResult{
			IsViolation:   false,
			ViolationType: "NONE",
			Confidence:    0.0,
			Topic:         "Umum",
		}, nil
	}

	cleaned := cleanJSON(raw)
	var res ModerationResult
	if err := json.Unmarshal([]byte(cleaned), &res); err != nil {
		return &ModerationResult{
			IsViolation:   false,
			ViolationType: "NONE",
			Confidence:    0.0,
			Topic:         "Umum",
		}, nil
	}
	return &res, nil
}

func CalculateLocationSimilarity(lat1, lng1, lat2, lng2 float64) float64 {
	if (lat1 == 0 && lng1 == 0) || (lat2 == 0 && lng2 == 0) {
		return 0.55
	}
	d := haversineDistanceMeters(lat1, lng1, lat2, lng2)
	if d <= 100 {
		return 1.0
	}
	if d <= 300 {
		return 0.90
	}
	if d <= 600 {
		return 0.80
	}
	if d <= 1000 {
		return 0.65
	}
	if d <= 1500 {
		return 0.52
	}
	if d <= 2500 {
		return 0.35
	}
	return 0.10
}

func CalculateTopicSimilarity(topic1, desc1, topic2, desc2 string) float64 {
	t1 := strings.ToLower(strings.TrimSpace(topic1))
	t2 := strings.ToLower(strings.TrimSpace(topic2))
	if t1 != "" && t2 != "" && t1 == t2 {
		return 0.90
	}
	words1 := extractKeywords(desc1)
	words2 := extractKeywords(desc2)
	if len(words1) == 0 || len(words2) == 0 {
		return 0.50
	}
	matchCount := 0
	set2 := make(map[string]bool)
	for _, w := range words2 {
		set2[w] = true
	}
	for _, w := range words1 {
		if set2[w] {
			matchCount++
		}
	}
	unionCount := len(words1) + len(words2) - matchCount
	if unionCount <= 0 {
		return 0.0
	}
	jaccard := float64(matchCount) / float64(unionCount)
	return math.Min(1.0, 0.40+(jaccard*1.2))
}

func EvaluateSimilarity(topicSim, locSim float64) SimilarityResult {
	total := (topicSim * 0.5) + (locSim * 0.5)
	isSimilar := topicSim > 0.50 && locSim > 0.50 && total > 0.80
	return SimilarityResult{
		TopicSimilarity:    topicSim,
		LocationSimilarity: locSim,
		TotalSimilarity:    total,
		IsSimilar:          isSimilar,
	}
}

func haversineDistanceMeters(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371000
	dLat := (lat2 - lat1) * (math.Pi / 180.0)
	dLon := (lon2 - lon1) * (math.Pi / 180.0)
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*(math.Pi/180.0))*math.Cos(lat2*(math.Pi/180.0))*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

func extractKeywords(text string) []string {
	stopWords := map[string]bool{
		"yang": true, "di": true, "dan": true, "ini": true, "itu": true,
		"ke": true, "dari": true, "untuk": true, "pada": true, "adalah": true,
		"ada": true, "karena": true, "saat": true, "oleh": true, "dengan": true,
		"saya": true, "kami": true, "bisa": true, "sudah": true, "telah": true,
	}
	fields := strings.Fields(strings.ToLower(text))
	var result []string
	for _, f := range fields {
		clean := strings.Trim(f, `.,!?:;'"()[]{}*-/`)
		if len(clean) >= 3 && !stopWords[clean] {
			result = append(result, clean)
		}
	}
	return result
}
