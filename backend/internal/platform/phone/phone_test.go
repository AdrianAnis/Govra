package phone

import "testing"

func TestNormalize(t *testing.T) {
	valid := map[string]string{
		"081234567890":      "6281234567890",
		"0812-3456-7890":    "6281234567890",
		"+62 812 3456 7890": "6281234567890",
		"6281234567890":     "6281234567890",
		"81234567890":       "6281234567890",
	}
	for input, want := range valid {
		got, ok := Normalize(input)
		if !ok || got != want {
			t.Errorf("Normalize(%q) = %q, %v; want %q", input, got, ok, want)
		}
	}
	invalid := []string{"", "abc", "0211234567", "08123", "628123", "12345678901", "0812345678901234567"}
	for _, input := range invalid {
		if got, ok := Normalize(input); ok {
			t.Errorf("Normalize(%q) = %q, want invalid", input, got)
		}
	}
}

func TestMask(t *testing.T) {
	if got := Mask("6281234567890"); got != "6281******890" {
		t.Errorf("Mask = %q", got)
	}
	if got := Mask("62"); got != "***" {
		t.Errorf("Mask short = %q", got)
	}
}
