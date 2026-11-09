package phone

import "strings"

const (
	countryPrefix = "62"
	mobilePrefix  = "628"
	minDigits     = 11
	maxDigits     = 15
)

func Normalize(raw string) (string, bool) {
	var b strings.Builder
	for _, r := range raw {
		if r >= '0' && r <= '9' {
			b.WriteRune(r)
		}
	}
	digits := b.String()
	switch {
	case strings.HasPrefix(digits, countryPrefix):
	case strings.HasPrefix(digits, "0"):
		digits = countryPrefix + digits[1:]
	case strings.HasPrefix(digits, "8"):
		digits = countryPrefix + digits
	default:
		return "", false
	}
	if !strings.HasPrefix(digits, mobilePrefix) || len(digits) < minDigits || len(digits) > maxDigits {
		return "", false
	}
	return digits, true
}

func Mask(normalized string) string {
	if len(normalized) < 7 {
		return "***"
	}
	return normalized[:4] + strings.Repeat("*", len(normalized)-7) + normalized[len(normalized)-3:]
}
