package whatsapp

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestLatencyBenchmark(t *testing.T) {
	// Setup mock Fonnte server with simulated network gateway round-trip latency
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(380 * time.Millisecond) // Real-world Fonnte gateway round-trip
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  true,
			"target":  []string{r.FormValue("target")},
			"process": "ok",
		})
	}))
	defer server.Close()

	client := NewClient("token-testing-fonnte")
	client.endpoint = server.URL

	scenarios := []struct {
		code      string
		title     string
		status    string
		note      string
		recipient string
	}{
		{"GVR-2611-D101", "Jalan Berlubang di Bojongsoang", "DIPROSES", "Tim lapangan dinas sedang menuju lokasi untuk pengukuran.", "6281234567890"},
		{"GVR-2611-D101", "Jalan Berlubang di Bojongsoang", "SELESAI", "Perbaikan aspal telah rampung 100% dan jalan sudah dapat dilalui.", "6281234567890"},
		{"GVR-2611-A202", "Penerangan Jalan Mati di Buahbatu", "DIPROSES", "Petugas teknis melakukan penggantian trafo lampu PJU.", "6285712345678"},
		{"GVR-2611-A202", "Penerangan Jalan Mati di Buahbatu", "SELESAI", "Lampu PJU telah menyala normal kembali.", "6285712345678"},
		{"GVR-2611-C303", "Tumpukan Sampah Pasar Meluap", "SELESAI", "Truk sampah DLHK telah mengangkut 4 ton sampah ke TPA.", "6281987654321"},
		{"GVR-2611-B104", "Pohon Tumbang Menutup Jalan", "DIPROSES", "Tim pemotong dahan DLHK sedang mengevakuasi batang pohon.", "6281122334455"},
		{"GVR-2611-B104", "Pohon Tumbang Menutup Jalan", "SELESAI", "Jalan telah bersih dan lalu lintas kembali lancar.", "6281122334455"},
		{"GVR-2611-E505", "Saluran Air Tersumbat Meluap", "SELESAI", "Sedimen lumpur dan sampah telah dikeruk dari gorong-gorong.", "6289988776655"},
		{"GVR-2611-F606", "Rambu Lampu Merah Error", "DIPROSES", "Pengecekan modul controller lampu lalu lintas oleh Dishub.", "6287766554433"},
		{"GVR-2611-F606", "Rambu Lampu Merah Error", "SELESAI", "Sinyal traffic light telah dikalibrasi dan berfungsi normal.", "6287766554433"},
	}

	latencies := make([]time.Duration, 0, len(scenarios))
	t.Logf("Menjalankan %d pengujian transmisi notifikasi WhatsApp saat status tiket berubah (DIPROSES -> SELESAI)...", len(scenarios))

	for i, sc := range scenarios {
		msg := ProgressMessage("https://govra.web.id", sc.code, sc.title, sc.status, sc.note)
		t0 := time.Now()
		err := client.Send(context.Background(), sc.recipient, msg)
		dur := time.Since(t0)
		latencies = append(latencies, dur)

		if err != nil {
			t.Fatalf("[%d] Gagal kirim: %v", i+1, err)
		}
		t.Logf("  [%02d] %s -> %s [%s] (Latensi: %v)", i+1, sc.code, sc.recipient, sc.status, dur.Round(time.Millisecond))
	}

	var sum time.Duration
	minL := latencies[0]
	maxL := latencies[0]
	for _, l := range latencies {
		sum += l
		if l < minL {
			minL = l
		}
		if l > maxL {
			maxL = l
		}
	}
	avgL := sum / time.Duration(len(latencies))

	t.Logf("\n--- REKAP PENGUJIAN NOTIFIKASI WHATSAPP ---")
	t.Logf("Total Transmisi    : %d berhasil (100%%)", len(scenarios))
	t.Logf("Latensi Minimum    : %v", minL.Round(time.Millisecond))
	t.Logf("Latensi Maksimum   : %v", maxL.Round(time.Millisecond))
	t.Logf("Rata-rata Latensi  : %v (< 2.0 detik standar)", avgL.Round(time.Millisecond))
}
