package whatsapp

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	"github.com/gofiber/fiber/v2"
)

type sentMessage struct {
	target  string
	message string
}

type fakeSender struct {
	mu   sync.Mutex
	sent []sentMessage
}

func (f *fakeSender) Send(_ context.Context, target, message string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.sent = append(f.sent, sentMessage{target: target, message: message})
	return nil
}

func (f *fakeSender) count() int {
	f.mu.Lock()
	defer f.mu.Unlock()
	return len(f.sent)
}

type fakeFinder struct {
	recipients []Recipient
	phone      string
}

func (f fakeFinder) ByIssue(context.Context, string) ([]Recipient, error) {
	return f.recipients, nil
}

func (f fakeFinder) PhoneByUser(context.Context, string) (string, error) {
	return f.phone, nil
}

func TestProgressMessage(t *testing.T) {
	msg := ProgressMessage("https://govra.web.id/", "GVR-2611-ABCD", "Jalan Rusak", "DIPROSES", "Tim lapangan sudah meninjau lokasi.")
	for _, want := range []string{"GVR-2611-ABCD", "Jalan Rusak", "*Diproses*", "Tim lapangan", "https://govra.web.id/pelapor/laporan/GVR-2611-ABCD"} {
		if !strings.Contains(msg, want) {
			t.Errorf("pesan tidak memuat %q:\n%s", want, msg)
		}
	}
	long := ProgressMessage("https://govra.web.id", "GVR-1", "", "SELESAI", strings.Repeat("a", 500))
	if strings.Contains(long, strings.Repeat("a", 400)) || !strings.Contains(long, "...") {
		t.Error("catatan panjang harus dipotong")
	}
}

func TestClientSend(t *testing.T) {
	var gotAuth, gotTarget string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		_ = r.ParseForm()
		gotTarget = r.Form.Get("target")
		if r.Form.Get("message") == "tolak" {
			_, _ = w.Write([]byte(`{"status":false,"reason":"invalid token"}`))
			return
		}
		_, _ = w.Write([]byte(`{"status":true}`))
	}))
	defer server.Close()

	client := NewClient("rahasia")
	client.endpoint = server.URL
	if err := client.Send(context.Background(), "6281234567890", "halo"); err != nil {
		t.Fatalf("Send: %v", err)
	}
	if gotAuth != "rahasia" || gotTarget != "6281234567890" {
		t.Errorf("header atau target salah: %q %q", gotAuth, gotTarget)
	}
	err := client.Send(context.Background(), "6281234567890", "tolak")
	if err == nil || strings.Contains(err.Error(), "rahasia") {
		t.Errorf("galat harus ada dan tidak boleh memuat token: %v", err)
	}
	if err := NewClient("").Send(context.Background(), "6281234567890", "halo"); err != ErrNotConfigured {
		t.Errorf("tanpa token harus ErrNotConfigured, dapat %v", err)
	}
}

func newWebhookApp(secret string) (*fiber.App, *fakeSender) {
	sender := &fakeSender{}
	app := fiber.New()
	NewWebhook(sender, secret, "https://govra.web.id").RegisterRoutes(app)
	return app, sender
}

func post(t *testing.T, app *fiber.App, url, body string) int {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, url, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request: %v", err)
	}
	defer resp.Body.Close()
	return resp.StatusCode
}

func TestWebhook_RepliesWithTemplate(t *testing.T) {
	app, sender := newWebhookApp("kunci")
	status := post(t, app, WebhookPath+"?secret=kunci", `{"sender":"081234567890","message":"kapan jalan saya diperbaiki?"}`)
	if status != fiber.StatusOK || sender.count() != 1 {
		t.Fatalf("status=%d terkirim=%d", status, sender.count())
	}
	if sender.sent[0].target != "6281234567890" || !strings.Contains(sender.sent[0].message, "tidak menerima pesan") {
		t.Errorf("balasan salah: %+v", sender.sent[0])
	}
}

func TestWebhook_RejectsWithoutSecret(t *testing.T) {
	app, sender := newWebhookApp("kunci")
	if status := post(t, app, WebhookPath, `{"sender":"081234567890","message":"hai"}`); status != fiber.StatusUnauthorized {
		t.Errorf("tanpa secret status=%d, want 401", status)
	}
	if status := post(t, app, WebhookPath+"?secret=salah", `{"sender":"081234567890","message":"hai"}`); status != fiber.StatusUnauthorized {
		t.Errorf("secret salah status=%d, want 401", status)
	}
	closed, closedSender := newWebhookApp("")
	if status := post(t, closed, WebhookPath+"?secret=", `{"sender":"081234567890","message":"hai"}`); status != fiber.StatusUnauthorized {
		t.Errorf("secret kosong harus menolak semua, status=%d", status)
	}
	if sender.count() != 0 || closedSender.count() != 0 {
		t.Error("tidak boleh ada balasan terkirim")
	}
}

func TestWebhook_IgnoresGroupsSelfAndLimitsReplies(t *testing.T) {
	app, sender := newWebhookApp("kunci")
	url := WebhookPath + "?secret=kunci"
	post(t, app, url, `{"sender":"120363000000@g.us","message":"hai","member":"6281234567890"}`)
	post(t, app, url, `{"sender":"081234567890","message":"hai","isgroup":"true"}`)
	post(t, app, url, `{"sender":"081234567890","device":"6281234567890","message":"hai"}`)
	post(t, app, url, `{"sender":"081234567890","message":"   "}`)
	if sender.count() != 0 {
		t.Fatalf("grup, pesan sendiri, dan pesan kosong harus diabaikan, terkirim=%d", sender.count())
	}
	for i := 0; i < 6; i++ {
		post(t, app, url, `{"sender":"081298765432","message":"hai"}`)
	}
	if sender.count() != replyLimit {
		t.Errorf("balasan dibatasi %d per pengirim, terkirim=%d", replyLimit, sender.count())
	}
}

func TestNotifier_SendsToEveryRecipient(t *testing.T) {
	sender := &fakeSender{}
	notifier := &Notifier{
		sender: sender,
		finder: fakeFinder{recipients: []Recipient{
			{Code: "GVR-1", Title: "Jalan Rusak", Phone: "6281111111111"},
			{Code: "GVR-2", Title: "Jalan Rusak", Phone: "6282222222222"},
		}, phone: "6283333333333"},
		webURL:  "https://govra.web.id",
		enabled: func() bool { return true },
	}
	notifier.deliverIssueStatus("issue-1", "DITERUSKAN", "")
	notifier.deliverReportReceived("user-1", "GVR-9", "Banjir")
	if sender.count() != 3 {
		t.Fatalf("terkirim=%d, want 3", sender.count())
	}
	if !strings.Contains(sender.sent[2].message, "sudah kami terima") || sender.sent[2].target != "6283333333333" {
		t.Errorf("konfirmasi laporan salah: %+v", sender.sent[2])
	}

	var disabled *Notifier
	disabled.NotifyIssueStatus(context.Background(), "x", "SELESAI", "")
	if (&Notifier{}).active() {
		t.Error("notifier kosong tidak boleh aktif")
	}
}
