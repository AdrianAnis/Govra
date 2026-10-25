package admin

import (
	"context"
	"sort"
	"time"
)

type Service interface {
	GetProductivityRanking(ctx context.Context) ([]OpdProductivity, error)
	GetExecutiveSummary(ctx context.Context) (*GovernmentExecutiveSummary, error)
	GetOverview(ctx context.Context) (*AdminOverview, error)
}

type service struct{}

func NewService() Service {
	return &service{}
}

func (s *service) GetProductivityRanking(ctx context.Context) ([]OpdProductivity, error) {
	list := []OpdProductivity{
		{
			OpdID:                  "e0000000-0000-0000-0000-000000000003",
			OpdCode:                "DISHUB",
			OpdName:                "Dinas Perhubungan",
			TotalAssignedIssues:    45,
			ResolvedIssues:         42,
			InProgressIssues:       3,
			OverdueIssues:          0,
			SlaComplianceRate:      96.5,
			AvgResolutionTimeHours: 14.2,
			ProgramProgressAvg:     91.0,
			ProductivityScore:      94.8,
		},
		{
			OpdID:                  "e0000000-0000-0000-0000-000000000001",
			OpdCode:                "DBM-SDA",
			OpdName:                "Dinas Bina Marga & SDA",
			TotalAssignedIssues:    86,
			ResolvedIssues:         76,
			InProgressIssues:       8,
			OverdueIssues:          2,
			SlaComplianceRate:      92.0,
			AvgResolutionTimeHours: 21.0,
			ProgramProgressAvg:     85.0,
			ProductivityScore:      88.5,
		},
		{
			OpdID:                  "e0000000-0000-0000-0000-000000000002",
			OpdCode:                "DLHK",
			OpdName:                "Dinas Lingkungan Hidup & Kebersihan",
			TotalAssignedIssues:    62,
			ResolvedIssues:         51,
			InProgressIssues:       9,
			OverdueIssues:          2,
			SlaComplianceRate:      87.5,
			AvgResolutionTimeHours: 26.5,
			ProgramProgressAvg:     82.0,
			ProductivityScore:      84.2,
		},
		{
			OpdID:                  "e0000000-0000-0000-0000-000000000004",
			OpdCode:                "DINKES",
			OpdName:                "Dinas Kesehatan",
			TotalAssignedIssues:    30,
			ResolvedIssues:         27,
			InProgressIssues:       3,
			OverdueIssues:          0,
			SlaComplianceRate:      94.0,
			AvgResolutionTimeHours: 16.0,
			ProgramProgressAvg:     88.0,
			ProductivityScore:      90.1,
		},
		{
			OpdID:                  "e0000000-0000-0000-0000-000000000005",
			OpdCode:                "SATPOL-PP",
			OpdName:                "Satuan Polisi Pamong Praja",
			TotalAssignedIssues:    54,
			ResolvedIssues:         46,
			InProgressIssues:       6,
			OverdueIssues:          2,
			SlaComplianceRate:      86.0,
			AvgResolutionTimeHours: 24.0,
			ProgramProgressAvg:     79.0,
			ProductivityScore:      82.4,
		},
		{
			OpdID:                  "e0000000-0000-0000-0000-000000000006",
			OpdCode:                "BPBD",
			OpdName:                "Badan Penanggulangan Bencana Daerah",
			TotalAssignedIssues:    22,
			ResolvedIssues:         21,
			InProgressIssues:       1,
			OverdueIssues:          0,
			SlaComplianceRate:      98.0,
			AvgResolutionTimeHours: 8.5,
			ProgramProgressAvg:     94.0,
			ProductivityScore:      96.2,
		},
	}

	sort.Slice(list, func(i, j int) bool {
		return list[i].ProductivityScore > list[j].ProductivityScore
	})
	for idx := range list {
		list[idx].Rank = idx + 1
	}
	return list, nil
}

func (s *service) GetExecutiveSummary(ctx context.Context) (*GovernmentExecutiveSummary, error) {
	return &GovernmentExecutiveSummary{
		Date:                     time.Now().Format("02 January 2006"),
		AutomatedTasksCount:      412,
		HoursSavedCount:          156.5,
		CitizenSatisfactionIndex: 89.2,
		UrgentHotspots: []string{
			"Kecamatan Tengah (Kel. Gambir): Konsentrasi laporan lubang jalan akibat curah hujan tinggi",
			"Kecamatan Utara (Kel. Sunter): Peningkatan laporan lampu PJU padam di 3 titik strategis",
		},
		BottleneckAlerts: []string{
			"DLHK: Waktu respon pengangkutan sampah liar meningkat 15% pada akhir pekan, perlu penambahan ritase truk armada",
		},
		RecommendedActionPlan: []string{
			"Alokasikan anggaran pemeliharaan rutin semester II prioritas ke drainase DBM-SDA di titik rawan genangan",
			"Apresiasi Dinas Perhubungan & BPBD atas kepatuhan SLA 96%+ dalam tanggap darurat",
			"Manfaatkan hasil clustering laporan warga untuk efisiensi Musrenbang kelurahan",
		},
		MonthlyChartData: []MonthlyTrend{
			{Month: "Mei", ResolvedReports: 45, ProkerProgressAvg: 60.0, SlaCompliance: 88.0},
			{Month: "Jun", ResolvedReports: 58, ProkerProgressAvg: 68.0, SlaCompliance: 90.0},
			{Month: "Jul", ResolvedReports: 72, ProkerProgressAvg: 75.0, SlaCompliance: 91.5},
			{Month: "Agu", ResolvedReports: 84, ProkerProgressAvg: 80.0, SlaCompliance: 93.0},
			{Month: "Sep", ResolvedReports: 96, ProkerProgressAvg: 84.0, SlaCompliance: 94.2},
			{Month: "Okt", ResolvedReports: 110, ProkerProgressAvg: 88.0, SlaCompliance: 95.0},
		},
		GeneratedAt: time.Now(),
	}, nil
}

func (s *service) GetOverview(ctx context.Context) (*AdminOverview, error) {
	return &AdminOverview{
		TotalIssues:     299,
		ActiveIssues:    42,
		ResolvedIssues:  251,
		UrgentIssues:    6,
		SlaCompliance:   92.4,
		TotalPrograms:   60,
		AverageProgress: 82.5,
	}, nil
}
