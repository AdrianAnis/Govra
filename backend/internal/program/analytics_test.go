package program

import (
	"context"
	"math"
	"testing"
	"time"
)

type factsRepo struct {
	Repository
	facts *AnalyticsFacts
}

func (f factsRepo) LoadAnalyticsFacts(context.Context) (*AnalyticsFacts, error) {
	return f.facts, nil
}

func at(year int, month time.Month, day, hour int) time.Time {
	return time.Date(year, month, day, hour, 0, 0, 0, wib)
}

func timePtr(value time.Time) *time.Time {
	return &value
}

func newAnalyticsService(now time.Time, facts *AnalyticsFacts) *service {
	return &service{repo: factsRepo{facts: facts}, now: func() time.Time { return now }}
}

func sampleFacts() *AnalyticsFacts {
	return &AnalyticsFacts{
		Opds: []OpdInfo{
			{ID: "o1", Code: "BM", Slug: "bina-marga", Name: "Dinas Bina Marga", Categories: []string{"Jalan"}},
			{ID: "o2", Code: "KS", Slug: "kesehatan", Name: "Dinas Kesehatan"},
		},
		Programs: []ProgramFact{
			{ID: "p1", OpdCode: "BM", Start: at(2026, 1, 1, 0), End: at(2026, 12, 31, 0), Pagu: 1000, Realization: 400},
			{ID: "p2", OpdCode: "BM", Start: at(2026, 9, 1, 0), End: at(2026, 12, 31, 0), Pagu: 1000, Realization: 600},
		},
		Updates: []UpdateFact{
			{ProgramID: "p1", Progress: 50, At: at(2026, 9, 10, 8)},
			{ProgramID: "p1", Progress: 100, At: at(2026, 10, 20, 8)},
			{ProgramID: "p2", Progress: 20, At: at(2026, 10, 25, 8)},
		},
		Issues: []IssueFact{
			{OpdCode: "BM", CreatedAt: at(2026, 10, 5, 8), RespondedAt: timePtr(at(2026, 10, 5, 12)), ResolvedAt: timePtr(at(2026, 10, 20, 8))},
			{OpdCode: "BM", CreatedAt: at(2026, 10, 6, 8), RespondedAt: timePtr(at(2026, 10, 6, 16))},
			{OpdCode: "BM", CreatedAt: at(2026, 11, 2, 8)},
		},
	}
}

func valueOf(indicators []IndicatorValue, code string) *float64 {
	for _, indicator := range indicators {
		if indicator.Code == code {
			return indicator.Value
		}
	}
	return nil
}

func near(got *float64, want float64) bool {
	return got != nil && math.Abs(*got-want) < 0.05
}

func TestOpdAnalytics_Indicators(t *testing.T) {
	svc := newAnalyticsService(at(2026, 11, 10, 9), sampleFacts())
	res, err := svc.GetOpdAnalytics(context.Background(), "bina-marga")
	if err != nil {
		t.Fatalf("analytics: %v", err)
	}
	if res.ProkerTotal != 2 || res.IssuesTotal != 3 || len(res.Categories) != 1 {
		t.Fatalf("ringkasan salah: %+v", res)
	}
	if got := valueOf(res.Indicators, "KETUNTASAN_PROKER"); !near(got, 50) {
		t.Errorf("ketuntasan proker = %v, want 50", got)
	}
	if got := valueOf(res.Indicators, "RESPONSIVITAS"); !near(got, 6) {
		t.Errorf("responsivitas = %v, want 6 jam (rata-rata 4 dan 8)", got)
	}
	if got := valueOf(res.Indicators, "PENYELESAIAN_ISU"); !near(got, 33.3) {
		t.Errorf("penyelesaian isu = %v, want 33,3", got)
	}
	if got := valueOf(res.Indicators, "PENYERAPAN_ANGGARAN"); !near(got, 50) {
		t.Errorf("penyerapan anggaran = %v, want 50", got)
	}
}

func TestOpdAnalytics_Monthly(t *testing.T) {
	svc := newAnalyticsService(at(2026, 11, 10, 9), sampleFacts())
	res, err := svc.GetOpdAnalytics(context.Background(), "bina-marga")
	if err != nil {
		t.Fatalf("analytics: %v", err)
	}
	if len(res.Monthly) != monthsInTrend {
		t.Fatalf("jumlah bulan = %d, want %d", len(res.Monthly), monthsInTrend)
	}
	last := res.Monthly[len(res.Monthly)-1]
	if last.Month != "2026-11" || last.IssuesReceived != 1 || last.AvgResponseHours != nil {
		t.Errorf("bulan berjalan salah: %+v", last)
	}
	october := res.Monthly[len(res.Monthly)-2]
	if october.Month != "2026-10" || october.IssuesReceived != 2 || october.IssuesResolved != 1 {
		t.Errorf("oktober salah: %+v", october)
	}
	if !near(october.AvgResponseHours, 6) || october.ProkerCompleted != 1 || october.ProkerActive != 2 {
		t.Errorf("metrik oktober salah: %+v", october)
	}
	if !near(october.ProkerAvgProgress, 60) {
		t.Errorf("rata-rata progres oktober = %v, want 60", october.ProkerAvgProgress)
	}
	september := res.Monthly[len(res.Monthly)-3]
	if !near(september.ProkerAvgProgress, 25) || september.ProkerActive != 2 {
		t.Errorf("rata-rata progres september salah: %+v", september)
	}
}

func TestOpdAnalytics_EmptyOpdHasNoValues(t *testing.T) {
	svc := newAnalyticsService(at(2026, 11, 10, 9), sampleFacts())
	res, err := svc.GetOpdAnalytics(context.Background(), "kesehatan")
	if err != nil {
		t.Fatalf("analytics: %v", err)
	}
	for _, indicator := range res.Indicators {
		if indicator.Value != nil || indicator.SampleSize != 0 {
			t.Errorf("OPD tanpa data harus kosong: %+v", indicator)
		}
	}
	if res.Categories == nil {
		t.Error("categories harus berupa array kosong, bukan null")
	}
}

func TestOpdAnalytics_UnknownSlug(t *testing.T) {
	svc := newAnalyticsService(at(2026, 11, 10, 9), sampleFacts())
	if _, err := svc.GetOpdAnalytics(context.Background(), "tidak-ada"); err != ErrOpdNotFound {
		t.Errorf("err = %v, want ErrOpdNotFound", err)
	}
}

func TestScorecard_UsesRealOpds(t *testing.T) {
	svc := newAnalyticsService(at(2026, 11, 10, 9), sampleFacts())
	res, err := svc.GetScorecard(context.Background())
	if err != nil {
		t.Fatalf("scorecard: %v", err)
	}
	if len(res.ByOpd) != 2 || res.ByOpd[0].Opd.Slug != "bina-marga" {
		t.Fatalf("by_opd harus dari data OPD asli: %+v", res.ByOpd)
	}
	if len(res.Indicators) != 5 || len(res.ByOpd[0].Indicators) != 5 {
		t.Errorf("harus ada 5 indikator")
	}
}

func TestOpdAnalytics_UsesProgramOwnProgress(t *testing.T) {
	facts := &AnalyticsFacts{
		Opds:     []OpdInfo{{ID: "o1", Code: "BM", Slug: "bina-marga", Name: "Dinas Bina Marga"}},
		Programs: []ProgramFact{{ID: "p1", OpdCode: "BM", Start: at(2026, 1, 1, 0), End: at(2026, 12, 31, 0), Current: 45}},
	}
	svc := newAnalyticsService(at(2026, 11, 10, 9), facts)
	res, err := svc.GetOpdAnalytics(context.Background(), "bina-marga")
	if err != nil {
		t.Fatalf("analytics: %v", err)
	}
	last := res.Monthly[len(res.Monthly)-1]
	if !near(last.ProkerAvgProgress, 45) {
		t.Errorf("bulan berjalan harus memakai progres proker saat ini, dapat %v", last.ProkerAvgProgress)
	}
	if first := res.Monthly[0]; !near(first.ProkerAvgProgress, 0) {
		t.Errorf("bulan lalu tanpa riwayat harus 0, dapat %v", first.ProkerAvgProgress)
	}
}

func TestIndicatorItems_Programs(t *testing.T) {
	facts := sampleFacts()
	facts.Programs[0].Code, facts.Programs[0].Name = "PRK-1", "Perbaikan Jalan"
	facts.Programs[1].Code, facts.Programs[1].Name = "PRK-2", "Drainase Baru"
	svc := newAnalyticsService(at(2026, 11, 10, 9), facts)
	res, err := svc.GetIndicatorItems(context.Background(), "PENYERAPAN_ANGGARAN", "bina-marga", 1, 10)
	if err != nil {
		t.Fatalf("drill: %v", err)
	}
	if res.Total != 2 || len(res.Items) != 2 || res.Items[0].Kind != "PROGRAM" || res.Items[0].Opd.Slug != "bina-marga" {
		t.Fatalf("data penyusun salah: %+v", res)
	}
	if res.Items[0].Note != "Realisasi Rp 400 dari pagu Rp 1.000." && res.Items[0].Note != "Realisasi Rp 600 dari pagu Rp 1.000." {
		t.Errorf("catatan anggaran salah: %q", res.Items[0].Note)
	}
}

func TestIndicatorItems_IssuesAndPaging(t *testing.T) {
	facts := sampleFacts()
	for i := range facts.Issues {
		facts.Issues[i].ID = "isu-" + string(rune('a'+i))
		facts.Issues[i].Title = "Isu " + string(rune('A'+i))
	}
	svc := newAnalyticsService(at(2026, 11, 10, 9), facts)
	res, err := svc.GetIndicatorItems(context.Background(), "RESPONSIVITAS", "", 1, 2)
	if err != nil {
		t.Fatalf("drill: %v", err)
	}
	if res.Total != 3 || len(res.Items) != 2 || !res.Items[0].Counted || res.Items[1].Counted == false {
		t.Fatalf("yang ikut dihitung harus di depan dan halaman dipotong: %+v", res)
	}
	last, _ := svc.GetIndicatorItems(context.Background(), "RESPONSIVITAS", "", 2, 2)
	if len(last.Items) != 1 || last.Items[0].Counted || last.Items[0].Note != "Belum ada tanggapan pertama dari Dinas." {
		t.Errorf("halaman terakhir salah: %+v", last)
	}
}

func TestIndicatorItems_UnknownIndicatorAndOpd(t *testing.T) {
	svc := newAnalyticsService(at(2026, 11, 10, 9), sampleFacts())
	if _, err := svc.GetIndicatorItems(context.Background(), "NGAWUR", "", 1, 10); err != ErrUnknownIndicator {
		t.Errorf("err = %v, want ErrUnknownIndicator", err)
	}
	res, err := svc.GetIndicatorItems(context.Background(), "PENYELESAIAN_ISU", "tidak-ada", 1, 10)
	if err != nil || res.Total != 0 || res.Items == nil {
		t.Errorf("OPD tak dikenal harus daftar kosong: %+v %v", res, err)
	}
}

func TestMethodology_HasEveryIndicator(t *testing.T) {
	doc, _ := newAnalyticsService(at(2026, 11, 10, 9), sampleFacts()).GetMethodology(context.Background())
	if len(doc.Indicators) != 5 || len(doc.Thresholds) == 0 {
		t.Errorf("metodologi tidak lengkap: %+v", doc)
	}
}
