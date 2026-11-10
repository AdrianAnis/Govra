package program

import (
	"context"
	"errors"
	"sort"
	"strconv"
	"strings"
	"time"
)

const (
	defaultDrillLimit = 20
	maxDrillLimit     = 50
	thousandsGroup    = 3
)

var ErrUnknownIndicator = errors.New("indikator tidak dikenal")

type DrillItem struct {
	Kind    string `json:"kind"`
	Ref     string `json:"ref"`
	Title   string `json:"title"`
	Opd     OpdRef `json:"opd"`
	Counted bool   `json:"counted"`
	Note    string `json:"note"`
}

type DrillList struct {
	Indicator string      `json:"indicator"`
	Page      int         `json:"page"`
	Limit     int         `json:"limit"`
	Total     int         `json:"total"`
	Items     []DrillItem `json:"items"`
}

type MethodologyIndicator struct {
	Code        string `json:"code"`
	Label       string `json:"label"`
	Formula     string `json:"formula"`
	Description string `json:"description"`
}

type Threshold struct {
	Key   string  `json:"key"`
	Label string  `json:"label"`
	Value float64 `json:"value"`
	Unit  string  `json:"unit"`
}

type MethodologyDoc struct {
	Indicators []MethodologyIndicator `json:"indicators"`
	Thresholds []Threshold            `json:"thresholds"`
}

var methodologyDoc = MethodologyDoc{
	Indicators: []MethodologyIndicator{
		{"KETUNTASAN_PROKER", "Ketuntasan proker", "proker dengan progres 100 persen dibagi seluruh proker yang disetujui", "Seberapa banyak proker yang sudah benar-benar selesai."},
		{"KETEPATAN_JADWAL", "Ketepatan jadwal", "proker yang progresnya tidak tertinggal lebih dari 10 poin dari rencana dibagi proker yang sudah dimulai", "Seberapa banyak proker yang berjalan sesuai jadwal."},
		{"RESPONSIVITAS", "Responsivitas", "rata-rata jam dari laporan masuk sampai tanggapan pertama Dinas", "Seberapa cepat Dinas menanggapi isu warga, dalam jam."},
		{"PENYELESAIAN_ISU", "Penyelesaian isu", "isu yang sudah selesai dibagi seluruh isu yang masuk", "Seberapa banyak isu warga yang sudah selesai ditangani."},
		{"PENYERAPAN_ANGGARAN", "Penyerapan anggaran", "realisasi dibagi pagu, untuk proker yang sudah punya pagu", "Seberapa besar anggaran yang sudah terealisasi."},
	},
	Thresholds: []Threshold{
		{"PROGRAM_LATE_THRESHOLD", "Selisih progres untuk dianggap tertinggal dari jadwal", scheduleTolerance, "POINTS"},
	},
}

func (s *service) GetMethodology(context.Context) (*MethodologyDoc, error) {
	return &methodologyDoc, nil
}

func formatThousands(value float64) string {
	digits := strconv.FormatInt(int64(value+0.5), 10)
	var b strings.Builder
	for i, r := range digits {
		if i > 0 && (len(digits)-i)%thousandsGroup == 0 {
			b.WriteByte('.')
		}
		b.WriteRune(r)
	}
	return b.String()
}

func formatDecimal(value float64) string {
	return strings.Replace(strconv.FormatFloat(round1(value), 'f', -1, 64), ".", ",", 1)
}

func programItem(program ProgramFact, opd OpdRef, counted bool, note string) DrillItem {
	return DrillItem{Kind: "PROGRAM", Ref: program.Code, Title: program.Name, Opd: opd, Counted: counted, Note: note}
}

func issueItem(issue IssueFact, opd OpdRef, counted bool, note string) DrillItem {
	return DrillItem{Kind: "ISSUE", Ref: issue.ID, Title: issue.Title, Opd: opd, Counted: counted, Note: note}
}

func progressNote(current float64) string {
	return "Progres " + formatDecimal(current) + " persen."
}

func programNote(code string, program ProgramFact, current float64, now time.Time) (bool, string) {
	switch code {
	case "KETUNTASAN_PROKER":
		if current >= percentScale {
			return true, "Target tercapai, progres 100 persen."
		}
		return true, progressNote(current)
	case "KETEPATAN_JADWAL":
		if program.Start.After(now) {
			return false, "Belum dimulai."
		}
		if onTrack(program, current, now) {
			return true, "Sesuai jadwal. " + progressNote(current)
		}
		return true, "Tertinggal dari jadwal. " + progressNote(current)
	default:
		if program.Pagu <= 0 {
			return false, "Pagu belum diisi."
		}
		return true, "Realisasi Rp " + formatThousands(program.Realization) + " dari pagu Rp " + formatThousands(program.Pagu) + "."
	}
}

func issueNote(code string, issue IssueFact) (bool, string) {
	if code == "RESPONSIVITAS" {
		if issue.RespondedAt == nil {
			return false, "Belum ada tanggapan pertama dari Dinas."
		}
		hours := issue.RespondedAt.Sub(issue.CreatedAt).Seconds() / secondsPerHour
		return true, "Ditanggapi dalam " + formatDecimal(hours) + " jam."
	}
	if issue.ResolvedAt != nil {
		return true, "Sudah selesai ditangani."
	}
	return true, "Masih dalam penanganan."
}

func buildDrillItems(code string, facts *AnalyticsFacts, scope string, progress progressIndex, now time.Time) []DrillItem {
	opds := make(map[string]OpdRef, len(facts.Opds))
	for _, info := range facts.Opds {
		opds[info.Code] = opdRef(info)
	}
	var items []DrillItem
	switch code {
	case "KETUNTASAN_PROKER", "KETEPATAN_JADWAL", "PENYERAPAN_ANGGARAN":
		for _, program := range facts.Programs {
			if scope != "" && program.OpdCode != scope {
				continue
			}
			counted, note := programNote(code, program, progress.now(program, now, now), now)
			items = append(items, programItem(program, opds[program.OpdCode], counted, note))
		}
	default:
		for _, issue := range facts.Issues {
			if scope != "" && issue.OpdCode != scope {
				continue
			}
			counted, note := issueNote(code, issue)
			items = append(items, issueItem(issue, opds[issue.OpdCode], counted, note))
		}
	}
	sort.SliceStable(items, func(i, j int) bool {
		if items[i].Counted != items[j].Counted {
			return items[i].Counted
		}
		return items[i].Title < items[j].Title
	})
	return items
}

func (s *service) GetIndicatorItems(ctx context.Context, code, opdSlug string, page, limit int) (*DrillList, error) {
	if !validIndicator(code) {
		return nil, ErrUnknownIndicator
	}
	facts, err := s.repo.LoadAnalyticsFacts(ctx)
	if err != nil {
		return nil, err
	}
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = defaultDrillLimit
	}
	if limit > maxDrillLimit {
		limit = maxDrillLimit
	}
	scope := ""
	unknownOpd := false
	if opdSlug != "" {
		unknownOpd = true
		for _, info := range facts.Opds {
			if info.Slug == opdSlug {
				scope, unknownOpd = info.Code, false
			}
		}
	}
	var items []DrillItem
	if !unknownOpd {
		now := s.now()
		items = buildDrillItems(code, facts, scope, newProgressIndex(facts.Updates), now)
	}
	start := (page - 1) * limit
	end := start + limit
	if start > len(items) {
		start = len(items)
	}
	if end > len(items) {
		end = len(items)
	}
	pageItems := items[start:end]
	if pageItems == nil {
		pageItems = []DrillItem{}
	}
	return &DrillList{Indicator: code, Page: page, Limit: limit, Total: len(items), Items: pageItems}, nil
}

func validIndicator(code string) bool {
	for _, indicator := range methodologyDoc.Indicators {
		if indicator.Code == code {
			return true
		}
	}
	return false
}
