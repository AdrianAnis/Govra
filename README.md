<p align="center">
  <img src="frontend/public/logo.svg" alt="Govra Logo" width="280" />
</p>

<h1 align="center">Govra — Platform Transparansi & Akuntabilitas Tata Kelola Kota</h1>

<p align="center">
  <strong>Jembatan Kolaborasi Warga, Eksekusi Dinas, dan Pengawasan Pemerintah Kota Berbasis Kecerdasan Buatan & Data Riil</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.4.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Go-1.24-00ADD8?style=for-the-badge&logo=go" alt="Go" />
  <img src="https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?style=for-the-badge&logo=supabase" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/AI-Google_Gemini-4285F4?style=for-the-badge&logo=google" alt="Gemini AI" />
</p>

---

## 📌 Daftar Isi
- [Tentang Govra](#-tentang-govra)
- [Galeri Antarmuka](#-galeri-antarmuka)
- [Tiga Peran Pengguna](#-tiga-peran-pengguna)
- [Fitur Utama per Peran](#-fitur-utama-per-peran)
  - [1. Masyarakat (Warga / Pelapor)](#1-masyarakat-warga--pelapor)
  - [2. Dinas Terkait (Instansi / OPD)](#2-dinas-terkait-instansi--opd)
  - [3. Admin Pusat (Walikota & Tim Tata Kelola Kota)](#3-admin-pusat-walikota--tim-tata-kelola-kota)
- [Arsitektur & Tumpukan Teknologi](#-arsitektur--tumpukan-teknologi)
- [Standar Keamanan & Kepatuhan](#-standar-keamanan--kepatuhan)
- [Panduan Instalasi & Menjalankan Lokal](#-panduan-instalasi--menjalankan-lokal)
- [Kredensial Akun Pengujian](#-kredensial-akun-pengujian)
- [Struktur Direktori](#-struktur-direktori)

---

## 🏙️ Tentang Govra

**Govra** adalah sistem tata kelola kota terpadu (*smart civic governance platform*) yang dirancang untuk meruntuhkan sekat birokrasi antara warga dan pemerintah daerah. Govra menggabungkan sistem pengaduan aspirasi publik yang transparan dengan pengawasan realisasi program kerja strategis pemerintah kota secara *end-to-end*.

### Masalah yang Diselesaikan:
1. **Laporan Aduan Sering Hilang / Lambat Direspons**: Sistem aduan konvensional seringkali menjadi kotak hitam tanpa linimasa status yang jelas.
2. **Ketiadaan Transparansi Program Kerja & Anggaran**: Masyarakat jarang mengetahui kemajuan proyek infrastruktur kota dan bagaimana dana publik direalisasikan di lapangan.
3. **Silo Antar-Organisasi Perangkat Daerah (OPD)**: Koordinasi lintas dinas yang lambat menghambat penanganan aduan darurat warga.
4. **Disparitas Data Lapangan**: Pelaporan kemajuan proyek tanpa bukti fisik terverifikasi yang mudah diakses publik.

### Solusi Govra:
- **Triage Cerdas Berbasis AI (Google Gemini)**: Otomatisasi moderasi konten, deteksi duplikasi isu, ekstraksi suara ke teks (*speech-to-text*), dan pengelompokan laporan otomatis ke dinas yang berwenang.
- **Papan Transparansi Proker & Pagu Anggaran**: Publikasi program kerja kota lengkap dengan pagu vs realisasi anggaran, persentase kemajuan fisik, dan galeri dokumentasi foto berkala dari dinas pelaksana.
- **Isolasi Role & Transparansi Bertingkat**: Kolaborasi mulus antara 3 entitas utama (Warga, Dinas, dan Admin Pusat/Walikota).
- **Rapor Kinerja OPD Otomatis**: Penilaian kecepatan respons, kepatuhan terhadap SLA (*Service Level Agreement*), dan indeks kepuasan warga yang membentuk peringkat kinerja dinas secara objektif.

---

## 📸 Galeri Antarmuka

Berikut adalah tampilan utama antarmuka platform Govra:

### 1. Halaman Depan (Landing Page)
<p align="center">
  <img src="frontend/public/landing-page.png" alt="Landing Page Govra" width="100%" />
</p>

### 2. Halaman Laporan Masyarakat
<p align="center">
  <img src="frontend/public/laporan-masyarakat.png" alt="Halaman Laporan Masyarakat" width="100%" />
</p>

### 3. Halaman Isu Terkini
<p align="center">
  <img src="frontend/public/isu-terkini.png" alt="Halaman Isu Terkini" width="100%" />
</p>

### 4. Halaman Program Kerja Pemerintah
<p align="center">
  <img src="frontend/public/proker-pemerintah.png" alt="Program Kerja Pemerintah" width="100%" />
</p>

---

## 👥 Tiga Peran Pengguna

Sistem Govra menerapkan prinsip pemisahan peran (*separation of concerns*) yang ketat dengan tiga peran kanonikal:

```
                  ┌──────────────────────────────────────────────┐
                  │                 GOVRA PLATFORM               │
                  └───────────────────────┬──────────────────────┘
                                          │
         ┌────────────────────────────────┼────────────────────────────────┐
         ▼                                ▼                                ▼
┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
│   MASYARAKAT    │              │  DINAS TERKAIT  │              │   ADMIN PUSAT   │
│    (Pelapor)    │              │   (Instansi)    │              │   (Walikota)    │
├─────────────────┤              ├─────────────────┤              ├─────────────────┤
│ • Lapor Isu     │              │ • Disposisi SLA │              │ • Verifikasi    │
│ • Dukung & Feed │              │ • Bukti Kerja   │              │ • Buat Proker   │
│ • Pantau Proker │              │ • Update Proker │              │ • Audit & Rapor │
└─────────────────┘              └─────────────────┘              └─────────────────┘
```

1. **Masyarakat (Pelapor / Warga)**:
   Akses publik untuk menyampaikan laporan, memantau feed isu kota, memberikan dukungan/komentar, melacak status tindak lanjut aduan, dan mengawasi transparansi program kerja dinas.
2. **Dinas Terkait (Instansi / OPD Sektoral)**:
   Akses bagi dinas pelaksana (misal: Dinas Bina Marga, Dinas Lingkungan Hidup, Dinas Perhubungan) untuk menerima disposisi laporan warga, memperbarui status penanganan lapangan, serta mengunggah bukti progres program kerja yang diamanatkan walikota.
3. **Admin Pusat (Walikota & Tim Tata Kelola Kota)**:
   Pusat kendali eksekutif untuk memverifikasi dan merouting aduan, menyusun program kerja strategis kota beserta alokasi anggaran, memvalidasi bukti kemajuan dari dinas, mengawasi rapor kinerja OPD, dan memoderasi platform.

---

## ⚡ Fitur Utama per Peran

### 1. Masyarakat (Warga / Pelapor)
- **Pengajuan Aduan Cerdas & Multimoda**:
  - Pilihan visibilitas: **Publik** (tampil di linimasa warga) atau **Rahasia** (hanya terlihat oleh instansi terkait).
  - Perekam Suara ke Teks (*Speech-to-Text*) bertenaga AI untuk kemudahan melapor tanpa mengetik panjang.
  - Pengecekan Kualitas Konten Otomatis berbasis AI (memastikan laporan memiliki rincian yang memadai).
  - Geotagging & Peta Interaktif (penentuan koordinat presisi hingga tingkat kelurahan dan kecamatan).
  - Unggah foto bukti otentik dengan kompresi dan validasi berkas otomatis.
- **Feed Isu Publik & Partisipasi Warga**:
  - Fitur **Dukung Isu** (*Upvote*) untuk mengeskalasi prioritas isu bersama warga sekampung/sekelurahan.
  - Fitur **Suka** (*Like*), **Komentar**, dan **Bagikan** (*Share*) ke media sosial.
  - Pencarian dan filter isu berdasarkan status, wilayah kecamatan, dan kategori urusan.
- **Pelacakan Aduan Real-Time**:
  - Linimasa transparan dari status `Diajukan`, `Diverifikasi`, `Diproses`, hingga `Selesai`.
  - Formulir penilaian konfirmasi kepuasan (*Feedback / Dispute*) paska-penyelesaian laporan.
- **Pengawasan Program Kerja Pemerintah**:
  - Akses terbuka untuk melihat katalog proyek strategis kota.
  - Transparansi angka pagu anggaran dan realisasi pembiayaan.
  - Linimasa kemajuan bertahap dan galeri foto bukti dari dinas pelaksana.
- **Pusat Notifikasi Khusus Warga**:
  - Notifikasi terisolasi seputar perkembangan aduan pribadi, proyek baru di wilayahnya, dan respons tanggapan warga.

### 2. Dinas Terkait (Instansi / OPD)
- **Pusat Komando & Disposisi Aduan**:
  - Daftar aduan yang didelegasikan oleh Admin Pusat dengan indikator tenggat waktu penanganan (*SLA Counter*).
  - Pembaruan status penanganan bertahap disertai catatan resmi instansi.
  - Pengunggahan foto bukti tindakan lapangan (sebelum dan sesudah perbaikan).
- **Amanah Tugas Program Kerja Walikota**:
  - Halaman khusus dinas untuk melihat daftar amanah proyek strategis kota yang ditugaskan kepada dinas bersangkutan.
  - Formulir pelaporan progres kerja berkala:
    - Input persentase kemajuan fisik aktual (0 - 100%).
    - Input realisasi anggaran keuangan dengan format mata uang otomatis.
    - Unggah berkas foto dokumentasi lapangan sebagai bukti pertanggungjawaban terbuka bagi publik dan pimpinan.
- **Pemberitahuan Tugas Lapangan**:
  - Notifikasi instan saat menerima disposisi aduan baru atau penugasan mandat program kerja baru dari pimpinan daerah.

### 3. Admin Pusat (Walikota & Tim Tata Kelola Kota)
- **Meja Verifikasi & Routing Aduan**:
  - Tinjauan aduan warga sebelum dipublikasikan atau diteruskan ke dinas.
  - Deteksi kluster isu berulang (*clustering*) secara cerdas untuk mencegah duplikasi penanganan.
  - Fitur tolak aduan disertai alasan resmi yang dapat dipertanggungjawabkan.
- **Manajemen Program Kerja Strategis Kota (Proker)**:
  - Pembuatan program kerja unggulan walikota dengan rincian deskripsi, target capaian, periode pelaksanaan, dan alokasi anggaran (pagu).
  - Penunjukan dinas pelaksana penanggung jawab utama.
  - Tinjauan dan verifikasi bukti dokumentasi yang dikirimkan oleh dinas pelaksana.
- **Rapor Kinerja & Analisis Kinerja OPD**:
  - Evaluasi tingkat kepatuhan dinas terhadap SLA penanganan aduan.
  - Peringkat dinas (*leaderboard*) berdasarkan kepuasan publik dan rasio penyelesaian tugas.
  - Analisis tren keluhan per sektor urusan dan sebaran geografis wilayah.
- **Moderasi & Tata Kelola Platform**:
  - Moderasi konten warga yang melanggar norma atau mengandung data sensitif.
  - Manajemen akun kedinasan dan log audit forensik untuk akuntabilitas sistem.

---

## 🛠️ Arsitektur & Tumpukan Teknologi

Govra dibangun dengan arsitektur modern berstandar industri yang memisahkan frontend reaktif dengan backend berkecepatan tinggi:

```
┌────────────────────────────────────────────────────────┐
│                   Klien Web (Browser)                  │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / JSON
┌───────────────────────────▼────────────────────────────┐
│      Next.js 16 App Router (BFF & SSR Architecture)    │
│    React 19 • Turbopack • Tailwind CSS v4 • Radix UI   │
└─────────────┬────────────────────────────┬─────────────┘
              │ Direct Supabase SDK        │ X-BFF-Key / HMAC
┌─────────────▼────────────┐  ┌────────────▼─────────────┐
│    PostgreSQL Supabase   │  │   Golang Core Backend    │
│  Schema: app             │  │   Fiber v2 / REST Engine │
│  RLS • Storage Buckets   │  │   Domain Clean Arch      │
└─────────────┬────────────┘  └────────────┬─────────────┘
              │                            │
              └──────────────┬─────────────┘
                             │
              ┌──────────────▼─────────────┐
              │      Google Gemini AI      │
              │  Triage • OCR • Mod • STT  │
              └────────────────────────────┘
```

### Rincian Tumpukan Teknologi:
- **Frontend**:
  - **Next.js 16.4.2** (App Router, Server Components, Route Handlers, Turbopack)
  - **React 19**
  - **Tailwind CSS v4** untuk desain modern dan responsif
  - **Radix UI** & **Lucide React Icons**
  - **Leaflet & OpenStreetMap** untuk visualisasi spasial peta geografis
  - **Zod** untuk validasi skema data deklaratif
- **Backend Core**:
  - **Go 1.24** dengan **Fiber v2**
  - Arsitektur berbasis *Clean Domain-Driven Architecture* (Handler, Service, Repository)
  - Autentikasi stateless berbasis JSON Web Token (JWT) dengan *secure cookie*
  - Pola gerbang *Backend-for-Frontend (BFF)* dengan verifikasi *Shared Key* rahasia
- **Database & Penyimpanan Awan**:
  - **PostgreSQL** di **Supabase** terisolasi pada skema `app`
  - *Row Level Security (RLS)* untuk keamanan baris data
  - **Supabase Storage** untuk penyimpanan foto bukti dan dokumentasi laporan
- **Kecerdasan Buatan (AI)**:
  - **Google Gemini 1.5 Flash** untuk klasifikasi kategori aduan, penyaringan kata tidak pantas (*profanity filter*), deteksi duplikasi keluhan, dan transkripsi audio suara pelapor (*Speech-to-Text*).

---

## 🔒 Standar Keamanan & Kepatuhan

Govra mengadopsi protokol keamanan ketat sebagaimana dirumuskan pada `docs/security.md`:
1. **Zero Hardcoded Secrets**: Seluruh kredensial, kunci JWT, dan token API dikelola secara mutlak melalui *environment variables* (`.env`). Tidak ada kunci rahasia yang tertanam pada kode sumber.
2. **BFF Authentication Gateway**: Setiap pertukaran data internal antara Next.js dan backend Go divalidasi menggunakan *BFF Shared Key* rahasia via header `X-BFF-Key`.
3. **Validasi Berkas Magic Bytes**: Seluruh berkas unggahan divalidasi hingga level *magic numbers/binary headers* untuk mencegah ancaman *MIME type spoofing* dan eksekusi skrip berbahaya.
4. **Pencegahan XSS & Injeksi SQL**: Penggunaan parameterized query pada database dan sanitasi ketat pada seluruh masukan pengguna sebelum diproses.
5. **Proteksi Anti-Bot & CSRF**: Dilengkapi verifikasi Cloudflare Turnstile CAPTCHA pada formulir publik dan perlindungan *Origin Header Checking* terhadap serangan lintas situs.

---

## 🚀 Panduan Instalasi & Menjalankan Lokal

### Prasyarat Sistem:
- [Node.js](https://nodejs.org/) versi 20.x atau lebih baru
- [Go (Golang)](https://go.dev/) versi 1.22 atau 1.24
- Proyek [Supabase](https://supabase.com/) aktif (PostgreSQL & Storage)

### 1. Klon Repositori
```bash
git clone https://github.com/dinarss/govra.git
cd govra
```

### 2. Konfigurasi Lingkungan Backend (`backend/.env`)
Buat file `backend/.env` dengan menyalin contoh berikut:
```env
PORT=8080
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
JWT_SECRET=rahasia-kunci-jwt-anda-yang-panjang-dan-aman
BFF_SHARED_KEY=kunci-rahasia-bff-shared-key-anda
ENVIRONMENT=development
```

### 3. Konfigurasi Lingkungan Frontend (`frontend/.env.local`)
Buat file `frontend/.env.local` dengan variabel berikut:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
JWT_SECRET=rahasia-kunci-jwt-anda-yang-panjang-dan-aman
BFF_SHARED_KEY=kunci-rahasia-bff-shared-key-anda
GEMINI_API_KEY=AIzaSy...
```

### 4. Menjalankan Backend Go
Buka terminal baru di direktori `backend`:
```bash
cd backend
go mod download
go run cmd/api/main.go
```
Backend akan berjalan di `http://127.0.0.1:8080`.

### 5. Menjalankan Frontend Next.js
Buka terminal baru di direktori `frontend`:
```bash
cd frontend
npm install
npm run dev
```
Buka browser dan akses antarmuka Govra di `http://localhost:3000`.

---

## 🔑 Kredensial Akun Pengujian

Untuk keperluan evaluasi fitur di lingkungan pengembangan lokal, sistem telah menyediakan akun contoh siap pakai:

| Peran | Alamat Email | Kata Sandi | Keterangan Akses |
|---|---|---|---|
| **Admin Pusat / Walikota** | `admin@kotacontoh.go.id` | `Password123!` | Akses penuh verifikasi aduan, manajemen proker, kinerja OPD, dan audit |
| **Dinas PUPR / Bina Marga** | `dinas.pupr@kotacontoh.go.id` | `Password123!` | Penanganan infrastruktur jalan, drainase, dan pelaporan progres proker dinas |
| **Dinas Lingkungan Hidup** | `dinas.lh@kotacontoh.go.id` | `Password123!` | Penanganan sampah, ruang terbuka hijau, dan kebersihan kota |
| **Dinas Perhubungan** | `dinas.perhubungan@kotacontoh.go.id` | `Password123!` | Pengelolaan rambu, lampu lalu lintas, dan fasilitas transportasi |
| **Masyarakat / Warga** | `warga@kotacontoh.go.id` | `Password123!` | Pelapor aduan publik/rahasia, partisipasi feed isu, dan pengawasan proker |

---

## 📁 Struktur Direktori

```
Govra/
├── backend/                       # Core Service Golang (API REST Engine)
│   ├── cmd/api/main.go            # Titik masuk utama server backend
│   ├── internal/
│   │   ├── admin/                 # Modul administrasi & moderasi
│   │   ├── agency/                # Modul kedinasan & eksekusi tindak lanjut
│   │   ├── auth/                  # Modul autentikasi, registrasi & JWT
│   │   ├── issue/                 # Modul isu warga & feed publik
│   │   ├── platform/              # Driver database, JWT, HTTP utilities
│   │   ├── program/               # Modul program kerja strategis kota
│   │   └── report/                # Modul penerimaan aduan & lampiran
│   └── go.mod
├── frontend/                      # Aplikasi Web Next.js 16 (App Router)
│   ├── public/                    # Aset statis, ikon, dan berkas tangkapan layar
│   ├── src/
│   │   ├── app/                   # Rute halaman (App Router)
│   │   │   ├── (publik)/          # Halaman portal warga & feed isu umum
│   │   │   ├── admin/             # Portal kendali Admin Pusat / Walikota
│   │   │   ├── dinas/             # Portal operasional instansi kedinasan
│   │   │   ├── pelapor/           # Portal dashboard warga terautentikasi
│   │   │   └── pemerintah/        # Portal pengawasan proker & kinerja kota
│   │   ├── components/            # Komponen antarmuka modular
│   │   └── lib/                   # Utilitas, skema Zod, dan integrasi data
│   └── package.json
├── docs/                          # Dokumentasi arsitektur, keamanan & desain
│   ├── architecture.md
│   ├── security.md
│   └── design.md
└── README.md                      # Dokumentasi komprehensif proyek
```

---

<p align="center">
  Dibuat dengan dedikasi untuk tata kelola pemerintahan kota yang lebih transparan, akuntabel, dan berorientasi pada warga.
</p>
