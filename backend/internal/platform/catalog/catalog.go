package catalog

import (
	"fmt"
	"strings"
)

const Unregistered = "TIDAK_TERDAFTAR"

type Opd struct {
	Code  string
	ID    string
	Name  string
	Scope string
}

type Category struct {
	Code    string
	ID      string
	Name    string
	OpdCode string
	Hint    string
}

var opds = []Opd{
	{"DBM-SDA", "e0000000-0000-0000-0000-000000000001", "Dinas Bina Marga & SDA", "jalan, jembatan, drainase, gorong-gorong, sungai, tanggul"},
	{"DLHK", "e0000000-0000-0000-0000-000000000002", "Dinas Lingkungan Hidup & Kebersihan", "sampah, kebersihan, pencemaran, taman, pohon"},
	{"DISHUB", "e0000000-0000-0000-0000-000000000003", "Dinas Perhubungan", "lalu lintas, rambu, lampu jalan, parkir, angkutan umum"},
	{"DINKES", "e0000000-0000-0000-0000-000000000004", "Dinas Kesehatan", "puskesmas, posyandu, wabah penyakit, sanitasi, air bersih"},
	{"SATPOL-PP", "e0000000-0000-0000-0000-000000000005", "Satuan Polisi Pamong Praja", "ketertiban umum, PKL dan bangunan liar, perda"},
	{"BPBD", "e0000000-0000-0000-0000-000000000006", "Badan Penanggulangan Bencana Daerah", "bencana alam, banjir besar, longsor, kebakaran, darurat"},
	{"PUPR", "e0000000-0000-0000-0000-000000000007", "Dinas PUPR", "gedung pemerintah, fasilitas umum, tata ruang, permukiman"},
}

var categories = []Category{
	{"JALAN-RUSAK", "f0000000-0000-0000-0000-000000000001", "Jalan Rusak & Berlubang", "DBM-SDA", "jalan berlubang, aspal amblas, trotoar rusak"},
	{"JEMBATAN-RUSAK", "f0000000-0000-0000-0000-000000000008", "Jembatan Rusak", "DBM-SDA", "jembatan retak, ambruk, atau membahayakan"},
	{"DRAINASE-TERSUMBAT", "f0000000-0000-0000-0000-000000000002", "Saluran Air & Drainase Tersumbat", "DBM-SDA", "selokan tersumbat, gorong-gorong, genangan akibat saluran, tanggul sungai"},
	{"SAMPAH-LIAR", "f0000000-0000-0000-0000-000000000003", "Tumpukan Sampah Liar", "DLHK", "sampah menumpuk, sampah tidak diangkut, bau sampah"},
	{"PENCEMARAN-LINGKUNGAN", "f0000000-0000-0000-0000-000000000009", "Pencemaran Lingkungan", "DLHK", "limbah pabrik, pencemaran air, udara, atau bau menyengat"},
	{"POHON-TAMAN", "f0000000-0000-0000-0000-00000000000a", "Pohon & Taman Kota", "DLHK", "pohon tumbang atau rawan tumbang, taman rusak atau tak terawat"},
	{"LAMPU-JALAN", "f0000000-0000-0000-0000-000000000004", "Lampu Penerangan Jalan Padam", "DISHUB", "lampu jalan mati atau redup"},
	{"RAMBU-RUSAK", "f0000000-0000-0000-0000-000000000005", "Rambu & Traffic Light Rusak", "DISHUB", "rambu roboh, lampu lalu lintas mati"},
	{"PARKIR-LIAR", "f0000000-0000-0000-0000-00000000000b", "Parkir Liar & Angkutan", "DISHUB", "parkir sembarangan, juru parkir liar, angkot atau bus bermasalah"},
	{"FASILITAS-KESEHATAN", "f0000000-0000-0000-0000-000000000007", "Layanan Kesehatan & Faskes", "DINKES", "pelayanan puskesmas atau posyandu, ambulans, tenaga kesehatan"},
	{"WABAH-PENYAKIT", "f0000000-0000-0000-0000-00000000000c", "Wabah & Kesehatan Lingkungan", "DINKES", "DBD, diare massal, sanitasi buruk, air bersih tidak layak"},
	{"KETERTIBAN-UMUM", "f0000000-0000-0000-0000-00000000000d", "Ketertiban Umum", "SATPOL-PP", "gangguan ketertiban, tempat hiburan melanggar, miras, gepeng"},
	{"PKL-BANGUNAN-LIAR", "f0000000-0000-0000-0000-00000000000e", "PKL & Bangunan Liar", "SATPOL-PP", "pedagang kaki lima di trotoar, bangunan tanpa izin"},
	{"BENCANA-ALAM", "f0000000-0000-0000-0000-00000000000f", "Bencana Alam & Darurat", "BPBD", "banjir besar, longsor, angin kencang, pohon menimpa rumah, gempa"},
	{"KEBAKARAN", "f0000000-0000-0000-0000-000000000010", "Kebakaran & Evakuasi", "BPBD", "kebakaran, evakuasi warga, korban terjebak"},
	{"INFRASTRUKTUR-GEDUNG", "f0000000-0000-0000-0000-000000000006", "Infrastruktur & Gedung", "PUPR", "gedung layanan publik rusak, fasilitas umum fisik, tata ruang"},
}

func Opds() []Opd {
	return opds
}

func Categories() []Category {
	return categories
}

func FindOpd(code string) (Opd, bool) {
	for _, opd := range opds {
		if opd.Code == code {
			return opd, true
		}
	}
	return Opd{}, false
}

func FindCategory(code string) (Category, bool) {
	for _, category := range categories {
		if category.Code == code {
			return category, true
		}
	}
	return Category{}, false
}

func OpdUUID(code string) (string, bool) {
	opd, ok := FindOpd(code)
	return opd.ID, ok
}

func CategoryUUID(code string) (string, bool) {
	category, ok := FindCategory(code)
	return category.ID, ok
}

func Prompt() string {
	var b strings.Builder
	for _, opd := range opds {
		fmt.Fprintf(&b, "%s - %s (urusan: %s)\n", opd.Code, opd.Name, opd.Scope)
		for _, category := range categories {
			if category.OpdCode == opd.Code {
				fmt.Fprintf(&b, "  - %s: %s (%s)\n", category.Code, category.Name, category.Hint)
			}
		}
	}
	return b.String()
}
