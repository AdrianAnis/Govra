package assistant

import (
	"strings"
	"testing"
)

func TestBuildReply_CardsFromTags(t *testing.T) {
	st := newChatState()
	st.programs["PRK-001"] = ProgramItem{
		Code:            "PRK-001",
		Name:            "Perbaikan Jalan Poros",
		OpdName:         "Dinas Bina Marga & SDA",
		Status:          "TERLAMBAT",
		ProgressPercent: 45,
		ExpectedPercent: 60.5,
	}
	st.issues["abc-1"] = IssueItem{ID: "ABC-1", Title: "Jalan Rusak", Status: "DIPROSES", SupporterCount: 20, Area: "Kecamatan Utara"}
	st.reports["GVR-2610-AAAA"] = MyReportItem{Code: "GVR-2610-AAAA", Title: "Lampu Padam", Status: "SELESAI"}

	raw := "Halo **SobatGovra**! Ini datanya.\n[CARD:PROGRAM:PRK-001]\n[CARD:PROGRAM:PRK-999]\n[CARD:ISSUE:abc-1]\n[CARD:REPORT:gvr-2610-aaaa]\n[CARD:ACTION:login]"
	res := buildReply(raw, st)

	if strings.Contains(res.Reply, "**") || strings.Contains(res.Reply, "[CARD") {
		t.Fatalf("reply masih memuat format mentah: %q", res.Reply)
	}
	if len(res.Cards) != 4 {
		t.Fatalf("jumlah kartu = %d, want 4 (kode proker palsu harus diabaikan)", len(res.Cards))
	}
	prog := res.Cards[0]
	if prog.Type != "PROGRAM" || prog.Status != "Dalam Percepatan" || prog.StatusTone != "warn" {
		t.Fatalf("kartu proker salah: %+v", prog)
	}
	if prog.Progress == nil || *prog.Progress != 45 {
		t.Fatalf("progress kartu proker salah: %+v", prog.Progress)
	}
	if !strings.Contains(prog.Meta, "45%") || !strings.Contains(prog.Meta, "60,5%") {
		t.Fatalf("meta kartu proker salah: %q", prog.Meta)
	}
	if res.Cards[1].Badge != "Mendesak / Prioritas" || res.Cards[1].Href != "/isu/ABC-1" {
		t.Fatalf("kartu isu salah: %+v", res.Cards[1])
	}
	if res.Cards[2].StatusTone != "good" || res.Cards[2].Href != "/pelapor/laporan/GVR-2610-AAAA" {
		t.Fatalf("kartu laporan salah: %+v", res.Cards[2])
	}
	if res.Cards[3].Type != "ACTION" || res.Cards[3].Href != "/masuk" {
		t.Fatalf("kartu aksi salah: %+v", res.Cards[3])
	}
}

func TestBuildReply_NoCardForUnknownReport(t *testing.T) {
	st := newChatState()
	res := buildReply("Tidak ada. [CARD:REPORT:GVR-2610-ZZZZ]", st)
	if len(res.Cards) != 0 {
		t.Fatalf("kartu laporan tanpa data pemilik tidak boleh muncul: %+v", res.Cards)
	}
	if res.Sources == nil {
		t.Fatal("sources tidak boleh nil")
	}
}
