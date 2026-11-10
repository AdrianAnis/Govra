package ai

import (
	"context"
	"testing"

	"govra/internal/platform/catalog"
)

func TestClassifyReport_WithoutKeyIsUnregistered(t *testing.T) {
	res, err := NewClient("", "").ClassifyReport(context.Background(), "Jalan berlubang", "Ada lubang besar", "A", "B")
	if err != nil {
		t.Fatalf("classify: %v", err)
	}
	if !res.IsUnregisteredOpd || res.OpdCode != catalog.Unregistered || res.Confidence != 0 {
		t.Errorf("tanpa AI harus belum ditentukan, bukan menebak dinas: %+v", res)
	}
}

func TestCatalog_EveryCategoryBelongsToKnownOpd(t *testing.T) {
	seen := map[string]bool{}
	for _, category := range catalog.Categories() {
		if _, ok := catalog.FindOpd(category.OpdCode); !ok {
			t.Errorf("kategori %s merujuk dinas tak dikenal %s", category.Code, category.OpdCode)
		}
		if seen[category.ID] || seen[category.Code] {
			t.Errorf("kode atau id ganda: %s", category.Code)
		}
		seen[category.ID], seen[category.Code] = true, true
	}
	for _, opd := range catalog.Opds() {
		found := false
		for _, category := range catalog.Categories() {
			found = found || category.OpdCode == opd.Code
		}
		if !found {
			t.Errorf("dinas %s belum punya kategori", opd.Code)
		}
	}
}
