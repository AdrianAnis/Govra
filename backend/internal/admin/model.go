package admin

import "time"

type OpdProductivity struct {
	OpdID                  string  `json:"opd_id"`
	OpdCode                string  `json:"opd_code"`
	OpdName                string  `json:"opd_name"`
	TotalAssignedIssues    int     `json:"total_assigned_issues"`
	ResolvedIssues         int     `json:"resolved_issues"`
	InProgressIssues       int     `json:"in_progress_issues"`
	OverdueIssues          int     `json:"overdue_issues"`
	SlaComplianceRate      float64 `json:"sla_compliance_rate"`
	AvgResolutionTimeHours float64 `json:"avg_resolution_time_hours"`
	ProgramProgressAvg     float64 `json:"program_progress_avg"`
	ProductivityScore      float64 `json:"productivity_score"`
	Rank                   int     `json:"rank"`
}

type GovernmentExecutiveSummary struct {
	Date                     string            `json:"date"`
	AutomatedTasksCount      int               `json:"automated_tasks_count"`
	HoursSavedCount          float64           `json:"hours_saved_count"`
	CitizenSatisfactionIndex float64           `json:"citizen_satisfaction_index"`
	UrgentHotspots           []string          `json:"urgent_hotspots"`
	BottleneckAlerts         []string          `json:"bottleneck_alerts"`
	RecommendedActionPlan    []string          `json:"recommended_action_plan"`
	MonthlyChartData         []MonthlyTrend    `json:"monthly_chart_data"`
	GeneratedAt              time.Time         `json:"generated_at"`
}

type MonthlyTrend struct {
	Month             string  `json:"month"`
	ResolvedReports   int     `json:"resolved_reports"`
	ProkerProgressAvg float64 `json:"proker_progress_avg"`
	SlaCompliance     float64 `json:"sla_compliance"`
}

type AdminOverview struct {
	TotalIssues     int     `json:"total_issues"`
	ActiveIssues    int     `json:"active_issues"`
	ResolvedIssues  int     `json:"resolved_issues"`
	UrgentIssues    int     `json:"urgent_issues"`
	SlaCompliance   float64 `json:"sla_compliance"`
	TotalPrograms   int     `json:"total_programs"`
	AverageProgress float64 `json:"average_progress"`
}
