package program

import (
	"context"
	"math"
	"net/url"
	"strconv"
	"strings"
	"time"
)

type restProgramRow struct {
	ID                string    `json:"id"`
	Code              string    `json:"code"`
	Name              string    `json:"name"`
	Description       *string   `json:"description"`
	OpdID             *string   `json:"opd_id"`
	GoalID            *string   `json:"goal_id"`
	DistrictID        *string   `json:"district_id"`
	TargetOutput      *string   `json:"target_output"`
	RealizationOutput *float64  `json:"realization_output"`
	BudgetPagu        *float64  `json:"budget_pagu"`
	BudgetRealization *float64  `json:"budget_realization"`
	StartDate         *string   `json:"start_date"`
	EndDate           *string   `json:"end_date"`
	Status            *string   `json:"status"`
	ApprovalStatus    *string   `json:"approval_status"`
	CreatedAt         time.Time `json:"created_at"`
}

type restOpdRow struct {
	ID   string `json:"id"`
	Code string `json:"code"`
	Name string `json:"name"`
}

func (r *repository) restPrograms(ctx context.Context, code string) ([]Program, bool) {
	endpoint := "programs?select=*&order=code.asc"
	if code != "" {
		endpoint += "&code=eq." + url.QueryEscape(code)
	}
	var rows []restProgramRow
	if err := r.db.PostgRESTGet(ctx, endpoint, &rows); err != nil {
		return nil, false
	}
	var opds []restOpdRow
	_ = r.db.PostgRESTGet(ctx, "opds?select=id,code,name", &opds)
	opdByID := make(map[string]restOpdRow, len(opds))
	for _, o := range opds {
		opdByID[o.ID] = o
	}

	programs := make([]Program, 0, len(rows))
	now := time.Now()
	for _, row := range rows {
		programs = append(programs, mapRestProgram(row, opdByID, now))
	}
	return programs, true
}

func mapRestProgram(row restProgramRow, opdByID map[string]restOpdRow, now time.Time) Program {
	p := Program{
		ID:        row.ID,
		Code:      row.Code,
		Name:      row.Name,
		CreatedAt: row.CreatedAt,
	}
	if row.Description != nil {
		p.Description = *row.Description
	}
	if row.OpdID != nil {
		p.OpdID = *row.OpdID
		if o, ok := opdByID[*row.OpdID]; ok {
			p.OpdCode = o.Code
			p.OpdName = o.Name
		}
	}
	if row.GoalID != nil {
		p.GoalID = *row.GoalID
	}
	if row.DistrictID != nil {
		p.DistrictID = *row.DistrictID
	}
	if row.StartDate != nil {
		p.StartDate = *row.StartDate
	}
	if row.EndDate != nil {
		p.EndDate = *row.EndDate
	}
	if row.ApprovalStatus != nil {
		p.ApprovalStatus = *row.ApprovalStatus
	}

	target := 100.0
	if row.TargetOutput != nil {
		if parsed, err := strconv.ParseFloat(strings.TrimSpace(*row.TargetOutput), 64); err == nil && parsed > 0 {
			target = parsed
		}
	}
	realization := 0.0
	if row.RealizationOutput != nil {
		realization = *row.RealizationOutput
	}
	progress := math.Min(100, math.Round(realization/target*100))

	start := parseProgramDate(p.StartDate, time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC))
	end := parseProgramDate(p.EndDate, time.Date(2026, 12, 31, 0, 0, 0, 0, time.UTC))
	duration := math.Max(1, float64(end.Sub(start)))
	elapsed := math.Max(0, math.Min(duration, float64(now.Sub(start))))
	expected := math.Round(elapsed / duration * 100)

	rawStatus := ""
	if row.Status != nil {
		rawStatus = strings.ToUpper(*row.Status)
	}
	status := StatusSesuaiJadwal
	switch {
	case rawStatus == "SELESAI" || progress >= 100:
		status = StatusSelesai
	case rawStatus == "BELUM_DIMULAI" || now.Before(start):
		status = StatusBelumDimulai
	case rawStatus == "MELEWATI_TENGGAT" || now.After(end):
		status = StatusMelewatiTenggat
	case rawStatus == "TERLAMBAT" || progress < expected-15:
		status = StatusTerlambat
	}

	p.Status = status
	p.Progress = progress
	p.Expected = expected
	if row.BudgetPagu != nil {
		p.Budget.Pagu = *row.BudgetPagu
	}
	if row.BudgetRealization != nil {
		p.Budget.Realization = *row.BudgetRealization
	}
	if p.Budget.Pagu > 0 {
		p.Budget.Percentage = p.Budget.Realization / p.Budget.Pagu * 100
	}
	return p
}

func parseProgramDate(value string, fallback time.Time) time.Time {
	if len(value) >= 10 {
		if parsed, err := time.Parse("2006-01-02", value[:10]); err == nil {
			return parsed
		}
	}
	return fallback
}

func (r *repository) restListPrograms(ctx context.Context, opdSlug, status, districtID, q string) ([]Program, bool) {
	all, ok := r.restPrograms(ctx, "")
	if !ok {
		return nil, false
	}
	list := make([]Program, 0, len(all))
	for _, p := range all {
		if p.ApprovalStatus != "" && p.ApprovalStatus != "APPROVED" {
			continue
		}
		if opdSlug != "" && !strings.EqualFold(p.OpdCode, opdSlug) {
			continue
		}
		if status != "" && string(p.Status) != status {
			continue
		}
		if districtID != "" && p.DistrictID != districtID {
			continue
		}
		if q != "" && !strings.Contains(strings.ToLower(p.Name), strings.ToLower(q)) {
			continue
		}
		list = append(list, p)
	}
	return list, true
}

func (r *repository) restGetProgram(ctx context.Context, code string) (*Program, bool) {
	list, ok := r.restPrograms(ctx, code)
	if !ok {
		return nil, false
	}
	if len(list) == 0 {
		return nil, false
	}
	p := list[0]
	return &p, true
}
