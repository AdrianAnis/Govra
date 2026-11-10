package program

import (
	"context"
	"math"
	"sort"
	"strconv"
	"strings"
	"time"
)

const dateLayout = "2006-01-02"

type restOpdFact struct {
	ID   string `json:"id"`
	Code string `json:"code"`
	Slug string `json:"slug"`
	Name string `json:"name"`
}

type restCategoryFact struct {
	OpdID *string `json:"opd_id"`
	Name  string  `json:"name"`
}

type restProgramFact struct {
	ID          string   `json:"id"`
	Code        string   `json:"code"`
	Name        string   `json:"name"`
	OpdID       *string  `json:"opd_id"`
	StartDate   *string  `json:"start_date"`
	EndDate     *string  `json:"end_date"`
	Pagu        *float64 `json:"budget_pagu"`
	Realization *float64 `json:"budget_realization"`
	Target      *string  `json:"target_output"`
	Output      *float64 `json:"realization_output"`
}

type restUpdateFact struct {
	ProgramID string    `json:"program_id"`
	Progress  *float64  `json:"progress_percentage"`
	CreatedAt time.Time `json:"created_at"`
}

type restIssueFact struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	OpdID       *string    `json:"opd_id"`
	CreatedAt   time.Time  `json:"created_at"`
	RespondedAt *time.Time `json:"first_responded_at"`
	ResolvedAt  *time.Time `json:"resolved_at"`
}

func parseDate(value *string, fallback time.Time) time.Time {
	if value == nil {
		return fallback
	}
	parsed, err := time.ParseInLocation(dateLayout, *value, wib)
	if err != nil {
		return fallback
	}
	return parsed
}

func currentProgress(output *float64, target *string) float64 {
	goal := percentScale
	if target != nil {
		if parsed, err := strconv.ParseFloat(strings.TrimSpace(*target), 64); err == nil && parsed > 0 {
			goal = parsed
		}
	}
	return math.Min(percentScale, math.Round(orZero(output)/goal*percentScale))
}

func orZero(value *float64) float64 {
	if value == nil {
		return 0
	}
	return *value
}

func sortOpds(opds []OpdInfo) {
	sort.Slice(opds, func(i, j int) bool { return opds[i].Name < opds[j].Name })
}

func (r *repository) LoadAnalyticsFacts(ctx context.Context) (*AnalyticsFacts, error) {
	if r.db != nil && r.db.Pool != nil {
		return r.loadFactsSQL(ctx)
	}
	if r.db != nil && r.db.HasREST() {
		return r.loadFactsREST(ctx)
	}
	return r.loadFactsMemory(), nil
}

func (r *repository) loadFactsSQL(ctx context.Context) (*AnalyticsFacts, error) {
	facts := &AnalyticsFacts{}
	byID := map[string]int{}

	opdRows, err := r.db.Pool.Query(ctx, `SELECT id::text, code, slug, name FROM app.opds WHERE is_active = true`)
	if err != nil {
		return nil, err
	}
	for opdRows.Next() {
		var info OpdInfo
		if err := opdRows.Scan(&info.ID, &info.Code, &info.Slug, &info.Name); err != nil {
			opdRows.Close()
			return nil, err
		}
		byID[info.ID] = len(facts.Opds)
		facts.Opds = append(facts.Opds, info)
	}
	opdRows.Close()

	categoryRows, err := r.db.Pool.Query(ctx, `SELECT opd_id::text, name FROM app.categories WHERE is_active = true AND opd_id IS NOT NULL ORDER BY name`)
	if err == nil {
		for categoryRows.Next() {
			var opdID, name string
			if categoryRows.Scan(&opdID, &name) == nil {
				if index, ok := byID[opdID]; ok {
					facts.Opds[index].Categories = append(facts.Opds[index].Categories, name)
				}
			}
		}
		categoryRows.Close()
	}

	programRows, err := r.db.Pool.Query(ctx, `
		SELECT p.id::text, p.code, p.name, o.code, COALESCE(p.start_date::text, ''), COALESCE(p.end_date::text, ''),
		       COALESCE(p.budget_pagu, 0)::float8, COALESCE(p.budget_realization, 0)::float8,
		       p.target_output::text, p.realization_output::float8
		FROM app.programs p JOIN app.opds o ON o.id = p.opd_id
		WHERE p.approval_status = 'APPROVED'`)
	if err != nil {
		return nil, err
	}
	now := time.Now()
	for programRows.Next() {
		var fact ProgramFact
		var start, end string
		var target *string
		var output *float64
		if err := programRows.Scan(&fact.ID, &fact.Code, &fact.Name, &fact.OpdCode, &start, &end, &fact.Pagu, &fact.Realization, &target, &output); err != nil {
			programRows.Close()
			return nil, err
		}
		fact.Start = parseDate(&start, now)
		fact.End = parseDate(&end, now)
		fact.Current = currentProgress(output, target)
		facts.Programs = append(facts.Programs, fact)
	}
	programRows.Close()

	updateRows, err := r.db.Pool.Query(ctx, `SELECT program_id::text, COALESCE(progress_percentage, 0)::float8, created_at FROM app.program_updates`)
	if err != nil {
		return nil, err
	}
	for updateRows.Next() {
		var fact UpdateFact
		if err := updateRows.Scan(&fact.ProgramID, &fact.Progress, &fact.At); err != nil {
			updateRows.Close()
			return nil, err
		}
		facts.Updates = append(facts.Updates, fact)
	}
	updateRows.Close()

	issueRows, err := r.db.Pool.Query(ctx, `
		SELECT i.id::text, i.title, o.code, i.created_at, i.first_responded_at, i.resolved_at
		FROM app.issues i JOIN app.opds o ON o.id = i.opd_id`)
	if err != nil {
		return nil, err
	}
	for issueRows.Next() {
		var fact IssueFact
		if err := issueRows.Scan(&fact.ID, &fact.Title, &fact.OpdCode, &fact.CreatedAt, &fact.RespondedAt, &fact.ResolvedAt); err != nil {
			issueRows.Close()
			return nil, err
		}
		facts.Issues = append(facts.Issues, fact)
	}
	issueRows.Close()

	sortOpds(facts.Opds)
	return facts, nil
}

func (r *repository) loadFactsREST(ctx context.Context) (*AnalyticsFacts, error) {
	var opds []restOpdFact
	if err := r.db.PostgRESTGet(ctx, "opds?select=id,code,slug,name&is_active=eq.true", &opds); err != nil {
		return nil, err
	}
	var programs []restProgramFact
	if err := r.db.PostgRESTGet(ctx, "programs?select=id,code,name,opd_id,start_date,end_date,budget_pagu,budget_realization,target_output,realization_output&approval_status=eq.APPROVED", &programs); err != nil {
		return nil, err
	}
	var updates []restUpdateFact
	if err := r.db.PostgRESTGet(ctx, "program_updates?select=program_id,progress_percentage,created_at", &updates); err != nil {
		return nil, err
	}
	var issues []restIssueFact
	if err := r.db.PostgRESTGet(ctx, "issues?select=id,title,opd_id,created_at,first_responded_at,resolved_at", &issues); err != nil {
		return nil, err
	}
	var categories []restCategoryFact
	_ = r.db.PostgRESTGet(ctx, "categories?select=opd_id,name&is_active=eq.true&order=name.asc", &categories)

	facts := &AnalyticsFacts{}
	codeByID := make(map[string]string, len(opds))
	indexByID := make(map[string]int, len(opds))
	for _, opd := range opds {
		codeByID[opd.ID] = opd.Code
		indexByID[opd.ID] = len(facts.Opds)
		facts.Opds = append(facts.Opds, OpdInfo{ID: opd.ID, Code: opd.Code, Slug: opd.Slug, Name: opd.Name})
	}
	for _, category := range categories {
		if category.OpdID == nil {
			continue
		}
		if index, ok := indexByID[*category.OpdID]; ok {
			facts.Opds[index].Categories = append(facts.Opds[index].Categories, category.Name)
		}
	}
	now := time.Now()
	for _, program := range programs {
		if program.OpdID == nil {
			continue
		}
		code, ok := codeByID[*program.OpdID]
		if !ok {
			continue
		}
		facts.Programs = append(facts.Programs, ProgramFact{
			ID:          program.ID,
			Code:        program.Code,
			Name:        program.Name,
			OpdCode:     code,
			Start:       parseDate(program.StartDate, now),
			End:         parseDate(program.EndDate, now),
			Pagu:        orZero(program.Pagu),
			Realization: orZero(program.Realization),
			Current:     currentProgress(program.Output, program.Target),
		})
	}
	for _, update := range updates {
		facts.Updates = append(facts.Updates, UpdateFact{ProgramID: update.ProgramID, Progress: orZero(update.Progress), At: update.CreatedAt})
	}
	for _, issue := range issues {
		if issue.OpdID == nil {
			continue
		}
		code, ok := codeByID[*issue.OpdID]
		if !ok {
			continue
		}
		facts.Issues = append(facts.Issues, IssueFact{ID: issue.ID, Title: issue.Title, OpdCode: code, CreatedAt: issue.CreatedAt, RespondedAt: issue.RespondedAt, ResolvedAt: issue.ResolvedAt})
	}
	sortOpds(facts.Opds)
	return facts, nil
}

func (r *repository) loadFactsMemory() *AnalyticsFacts {
	r.mu.RLock()
	defer r.mu.RUnlock()
	facts := &AnalyticsFacts{}
	for _, opd := range r.opds {
		facts.Opds = append(facts.Opds, OpdInfo{ID: opd.ID, Code: opd.Code, Slug: opd.Slug, Name: opd.Name})
	}
	now := time.Now()
	for _, program := range r.programs {
		start := parseDate(&program.StartDate, now)
		facts.Programs = append(facts.Programs, ProgramFact{ID: program.ID, Code: program.Code, Name: program.Name, OpdCode: program.OpdCode, Start: start, End: parseDate(&program.EndDate, now), Current: program.Progress})
	}
	sortOpds(facts.Opds)
	return facts
}
