CREATE SCHEMA IF NOT EXISTS app;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS app.regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    head_label TEXT NOT NULL DEFAULT 'Wali Kota',
    center_lat NUMERIC(10, 7) NOT NULL,
    center_lng NUMERIC(10, 7) NOT NULL,
    polygon_geojson JSONB DEFAULT '{}'::jsonb,
    is_pilot BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID REFERENCES app.regions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    center_lat NUMERIC(10, 7) NOT NULL,
    center_lng NUMERIC(10, 7) NOT NULL,
    polygon_geojson JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.villages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID REFERENCES app.districts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    center_lat NUMERIC(10, 7) NOT NULL,
    center_lng NUMERIC(10, 7) NOT NULL,
    polygon_geojson JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID REFERENCES app.regions(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.opds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID REFERENCES app.regions(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opd_id UUID REFERENCES app.opds(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('pelapor', 'dinas', 'admin', 'kepala_daerah')),
    opd_id UUID REFERENCES app.opds(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING')),
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('REGISTRATION', 'PASSWORD_RESET', 'LOGIN')),
    attempts INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID REFERENCES app.regions(id) ON DELETE CASCADE,
    opd_id UUID REFERENCES app.opds(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES app.goals(id) ON DELETE SET NULL,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    target_output TEXT,
    target_unit TEXT,
    realization_output NUMERIC DEFAULT 0,
    budget_pagu NUMERIC DEFAULT 0,
    budget_realization NUMERIC DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    district_id UUID REFERENCES app.districts(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'BELUM_DIMULAI',
    approval_status TEXT NOT NULL DEFAULT 'APPROVED' CHECK (approval_status IN ('PROPOSED', 'APPROVED', 'REJECTED')),
    proposed_by UUID REFERENCES app.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.program_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES app.programs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_date DATE NOT NULL,
    completed_at TIMESTAMPTZ,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS app.program_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES app.programs(id) ON DELETE CASCADE,
    opd_id UUID REFERENCES app.opds(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    progress_percentage INT,
    documentation_photos JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES app.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.program_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES app.programs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    region_id UUID REFERENCES app.regions(id) ON DELETE CASCADE,
    opd_id UUID REFERENCES app.opds(id) ON DELETE SET NULL,
    category_id UUID REFERENCES app.categories(id) ON DELETE SET NULL,
    district_id UUID REFERENCES app.districts(id) ON DELETE SET NULL,
    village_id UUID REFERENCES app.villages(id) ON DELETE SET NULL,
    center_lat NUMERIC(10, 7) NOT NULL,
    center_lng NUMERIC(10, 7) NOT NULL,
    status TEXT NOT NULL DEFAULT 'DITERUSKAN',
    urgency TEXT NOT NULL DEFAULT 'NORMAL' CHECK (urgency IN ('NORMAL', 'TINGGI', 'URGENT')),
    safety_risk TEXT NOT NULL DEFAULT 'NONE' CHECK (safety_risk IN ('NONE', 'PROPERTY', 'LIFE')),
    unique_reporters_count INT NOT NULL DEFAULT 1,
    sla_due_at TIMESTAMPTZ,
    first_responded_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    cover_photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    reporter_id UUID REFERENCES app.profiles(id) ON DELETE SET NULL,
    issue_id UUID REFERENCES app.issues(id) ON DELETE SET NULL,
    opd_id UUID REFERENCES app.opds(id) ON DELETE SET NULL,
    category_id UUID REFERENCES app.categories(id) ON DELETE SET NULL,
    district_id UUID REFERENCES app.districts(id) ON DELETE SET NULL,
    village_id UUID REFERENCES app.villages(id) ON DELETE SET NULL,
    title TEXT,
    description TEXT NOT NULL,
    voice_note_url TEXT,
    voice_note_transcript TEXT,
    lat NUMERIC(10, 7) NOT NULL,
    lng NUMERIC(10, 7) NOT NULL,
    address_detail TEXT,
    visibility TEXT NOT NULL DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'CONFIDENTIAL')),
    status TEXT NOT NULL DEFAULT 'DIAJUKAN',
    triage_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (triage_status IN ('PENDING', 'PROCESSED', 'FAILED', 'VERIFICATION_REQUIRED')),
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    hide_reason TEXT,
    reporter_ip TEXT,
    subnet_24 TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.report_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES app.reports(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    is_public_ok BOOLEAN NOT NULL DEFAULT false,
    is_cover BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.issue_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES app.issues(id) ON DELETE CASCADE,
    author_id UUID REFERENCES app.profiles(id) ON DELETE SET NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    note TEXT,
    evidence_photos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.issue_supports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES app.issues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES app.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(issue_id, user_id)
);

CREATE TABLE IF NOT EXISTS app.issue_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES app.issues(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES app.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.ai_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES app.reports(id) ON DELETE CASCADE,
    predicted_opd_id UUID REFERENCES app.opds(id) ON DELETE SET NULL,
    predicted_category_id UUID REFERENCES app.categories(id) ON DELETE SET NULL,
    confidence NUMERIC(5, 4),
    safety_risk TEXT,
    summary TEXT,
    is_sensitive BOOLEAN NOT NULL DEFAULT false,
    raw_response JSONB,
    admin_corrected_opd_id UUID REFERENCES app.opds(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.feeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES app.profiles(id) ON DELETE CASCADE,
    report_id UUID REFERENCES app.reports(id) ON DELETE SET NULL,
    issue_id UUID REFERENCES app.issues(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'IMAGE' CHECK (media_type IN ('IMAGE', 'VIDEO', 'REEL')),
    media_url TEXT NOT NULL,
    likes_count INT NOT NULL DEFAULT 0,
    shares_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.feed_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_id UUID REFERENCES app.feeds(id) ON DELETE CASCADE,
    user_id UUID REFERENCES app.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(feed_id, user_id)
);

CREATE TABLE IF NOT EXISTS app.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    unit TEXT NOT NULL,
    description TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES app.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION app.current_role() RETURNS text AS $$
BEGIN
    RETURN COALESCE(
        current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'role',
        (SELECT role FROM app.profiles WHERE id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid),
        'anon'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN 'anon';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION app.current_user_id() RETURNS uuid AS $$
BEGIN
    RETURN (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION app.current_opd() RETURNS uuid AS $$
BEGIN
    RETURN (SELECT opd_id FROM app.profiles WHERE id = app.current_user_id());
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

ALTER TABLE app.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.opds ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.program_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.program_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.program_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.report_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.issue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.issue_supports ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.issue_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.ai_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.feed_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS region_read_all ON app.regions;
CREATE POLICY region_read_all ON app.regions FOR SELECT USING (true);

DROP POLICY IF EXISTS district_read_all ON app.districts;
CREATE POLICY district_read_all ON app.districts FOR SELECT USING (true);

DROP POLICY IF EXISTS village_read_all ON app.villages;
CREATE POLICY village_read_all ON app.villages FOR SELECT USING (true);

DROP POLICY IF EXISTS goal_read_all ON app.goals;
CREATE POLICY goal_read_all ON app.goals FOR SELECT USING (true);

DROP POLICY IF EXISTS opd_read_all ON app.opds;
CREATE POLICY opd_read_all ON app.opds FOR SELECT USING (true);

DROP POLICY IF EXISTS category_read_all ON app.categories;
CREATE POLICY category_read_all ON app.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS program_read_all ON app.programs;
CREATE POLICY program_read_all ON app.programs FOR SELECT USING (approval_status = 'APPROVED' OR app.current_role() IN ('admin', 'dinas', 'kepala_daerah'));

DROP POLICY IF EXISTS milestone_read_all ON app.program_milestones;
CREATE POLICY milestone_read_all ON app.program_milestones FOR SELECT USING (true);

DROP POLICY IF EXISTS program_updates_read_all ON app.program_updates;
CREATE POLICY program_updates_read_all ON app.program_updates FOR SELECT USING (true);

DROP POLICY IF EXISTS program_documents_read_all ON app.program_documents;
CREATE POLICY program_documents_read_all ON app.program_documents FOR SELECT USING (true);

DROP POLICY IF EXISTS issues_read_all ON app.issues;
CREATE POLICY issues_read_all ON app.issues FOR SELECT USING (true);

DROP POLICY IF EXISTS feeds_read_all ON app.feeds;
CREATE POLICY feeds_read_all ON app.feeds FOR SELECT USING (true);

DROP POLICY IF EXISTS settings_read_all ON app.settings;
CREATE POLICY settings_read_all ON app.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS profile_read_own ON app.profiles;
CREATE POLICY profile_read_own ON app.profiles FOR SELECT USING (id = app.current_user_id() OR app.current_role() = 'admin');

DROP POLICY IF EXISTS profile_update_own ON app.profiles;
CREATE POLICY profile_update_own ON app.profiles FOR UPDATE USING (id = app.current_user_id());

DROP POLICY IF EXISTS reports_read_policy ON app.reports;
CREATE POLICY reports_read_policy ON app.reports FOR SELECT USING (
    (visibility = 'PUBLIC' AND is_hidden = false)
    OR reporter_id = app.current_user_id()
    OR (app.current_role() = 'dinas' AND opd_id = app.current_opd())
    OR app.current_role() = 'admin'
);

DROP POLICY IF EXISTS reports_insert_policy ON app.reports;
CREATE POLICY reports_insert_policy ON app.reports FOR INSERT WITH CHECK (
    reporter_id = app.current_user_id() OR reporter_id IS NULL
);

DROP POLICY IF EXISTS audit_logs_read_policy ON app.audit_logs;
CREATE POLICY audit_logs_read_policy ON app.audit_logs FOR SELECT USING (
    app.current_role() = 'admin'
);

INSERT INTO app.regions (id, code, name, head_label, center_lat, center_lng, polygon_geojson, is_pilot)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'KOTA-SIMULASI',
    'Kota Contoh',
    'Wali Kota',
    -6.2088000,
    106.8456000,
    '{"type": "Polygon", "coordinates": [[[106.80, -6.25], [106.90, -6.25], [106.90, -6.15], [106.80, -6.15], [106.80, -6.25]]]}'::jsonb,
    true
) ON CONFLICT (code) DO NOTHING;

INSERT INTO app.districts (id, region_id, name, center_lat, center_lng, polygon_geojson)
VALUES 
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Kecamatan Tengah', -6.2000000, 106.8400000, '{"type": "Polygon", "coordinates": [[[106.82, -6.22], [106.86, -6.22], [106.86, -6.18], [106.82, -6.18], [106.82, -6.22]]]}'::jsonb),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Kecamatan Utara', -6.1600000, 106.8400000, '{"type": "Polygon", "coordinates": [[[106.82, -6.18], [106.86, -6.18], [106.86, -6.14], [106.82, -6.14], [106.82, -6.18]]]}'::jsonb),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Kecamatan Selatan', -6.2400000, 106.8400000, '{"type": "Polygon", "coordinates": [[[106.82, -6.26], [106.86, -6.26], [106.86, -6.22], [106.82, -6.22], [106.82, -6.26]]]}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.villages (id, district_id, name, center_lat, center_lng, polygon_geojson)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Kelurahan Gambir', -6.1950000, 106.8350000, '{"type": "Polygon", "coordinates": [[[106.82, -6.21], [106.84, -6.21], [106.84, -6.18], [106.82, -6.18], [106.82, -6.21]]]}'::jsonb),
    ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Kelurahan Kebon Sirih', -6.2050000, 106.8450000, '{"type": "Polygon", "coordinates": [[[106.84, -6.22], [106.86, -6.22], [106.86, -6.19], [106.84, -6.19], [106.84, -6.22]]]}'::jsonb),
    ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'Kelurahan Ancol', -6.1550000, 106.8350000, '{"type": "Polygon", "coordinates": [[[106.82, -6.17], [106.84, -6.17], [106.84, -6.14], [106.82, -6.14], [106.82, -6.17]]]}'::jsonb),
    ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'Kelurahan Sunter', -6.1650000, 106.8450000, '{"type": "Polygon", "coordinates": [[[106.84, -6.18], [106.86, -6.18], [106.86, -6.15], [106.84, -6.15], [106.84, -6.18]]]}'::jsonb),
    ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', 'Kelurahan Cilandak', -6.2350000, 106.8350000, '{"type": "Polygon", "coordinates": [[[106.82, -6.25], [106.84, -6.25], [106.84, -6.22], [106.82, -6.22], [106.82, -6.25]]]}'::jsonb),
    ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003', 'Kelurahan Pondok Indah', -6.2450000, 106.8450000, '{"type": "Polygon", "coordinates": [[[106.84, -6.26], [106.86, -6.26], [106.86, -6.23], [106.84, -6.23], [106.84, -6.26]]]}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.goals (id, region_id, code, name, description)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'SAS-01', 'Infrastruktur Mantap dan Berkelanjutan', 'Pembangunan dan perbaikan fasilitas jalan, jembatan, dan drainase'),
    ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'SAS-02', 'Kesehatan dan Kesejahteraan Masyarakat', 'Peningkatan layanan faskes dan perlindungan sosial'),
    ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'SAS-03', 'Kota Tanggap dan Bersih', 'Pengelolaan persampahan modern dan mitigasi bencana')
ON CONFLICT (code) DO NOTHING;

INSERT INTO app.opds (id, region_id, code, name, slug, phone, email, address)
VALUES
    ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'DBM-SDA', 'Dinas Bina Marga & SDA', 'bina-marga-sda', '021-1234001', 'dbmsda@kotacontoh.go.id', 'Jl. Pemuda No. 1'),
    ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'DLHK', 'Dinas Lingkungan Hidup & Kebersihan', 'lingkungan-hidup', '021-1234002', 'dlhk@kotacontoh.go.id', 'Jl. Merdeka No. 2'),
    ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'DISHUB', 'Dinas Perhubungan', 'perhubungan', '021-1234003', 'dishub@kotacontoh.go.id', 'Jl. Veteran No. 3'),
    ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'DINKES', 'Dinas Kesehatan', 'kesehatan', '021-1234004', 'dinkes@kotacontoh.go.id', 'Jl. Sehat No. 4'),
    ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'SATPOL-PP', 'Satuan Polisi Pamong Praja', 'satpol-pp', '021-1234005', 'satpolpp@kotacontoh.go.id', 'Jl. Praja No. 5'),
    ('e0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'BPBD', 'Badan Penanggulangan Bencana Daerah', 'bpbd', '021-1234006', 'bpbd@kotacontoh.go.id', 'Jl. Siaga No. 6')
ON CONFLICT (code) DO NOTHING;

INSERT INTO app.categories (id, opd_id, code, name, description)
VALUES
    ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'JALAN-RUSAK', 'Jalan Rusak & Berlubang', 'Laporan kerusakan permukaan jalan raya'),
    ('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'DRAINASE-TERSUMBAT', 'Saluran Air & Drainase Tersumbat', 'Genangan atau penyumbatan saluran air'),
    ('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000002', 'SAMPAH-LIAR', 'Tumpukan Sampah Liar', 'Sampah berserakan di fasilitas publik'),
    ('f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000003', 'LAMPU-JALAN', 'Lampu Penerangan Jalan Padam', 'Penerangan jalan umum tidak berfungsi'),
    ('f0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000003', 'RAMBU-RUSAK', 'Rambu & Traffic Light Rusak', 'Kerusakan alat pemberi isyarat lalu lintas')
ON CONFLICT (code) DO NOTHING;

INSERT INTO app.settings (key, value, unit, description)
VALUES
    ('AI_CONFIDENCE_THRESHOLD', '0.75', 'RATIO', 'Ambang batas keyakinan klasifikasi otomatis AI'),
    ('SIMILARITY_RADIUS_METERS', '500', 'METER', 'Jarak maksimal laporan dapat digabung menjadi satu isu'),
    ('SLA_HOURS_URGENT', '24', 'JAM', 'Batas respon tanggapan pertama untuk isu urgent'),
    ('SLA_HOURS_HIGH', '72', 'JAM', 'Batas respon tanggapan pertama untuk isu tinggi'),
    ('SLA_HOURS_NORMAL', '120', 'JAM', 'Batas respon tanggapan pertama untuk isu normal')
ON CONFLICT (key) DO NOTHING;


INSERT INTO app.profiles (id, email, password_hash, display_name, role, opd_id, status, phone)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'admin@pusat.govra.id', '$2a$10$pVl/dR63gsumKnvGeIH5IeppTQzigYEcIPyxFZxvVkOmpBcliRudu', 'Administrator Utama', 'admin', NULL, 'ACTIVE', '081100000001'),
    ('a0000000-0000-0000-0000-000000000002', 'walikota@kotacontoh.go.id', '$2a$10$pVl/dR63gsumKnvGeIH5IeppTQzigYEcIPyxFZxvVkOmpBcliRudu', 'Bapak Wali Kota', 'kepala_daerah', NULL, 'ACTIVE', '081100000002'),
    ('a0000000-0000-0000-0000-000000000003', 'dbmsda@kotacontoh.go.id', '$2a$10$pVl/dR63gsumKnvGeIH5IeppTQzigYEcIPyxFZxvVkOmpBcliRudu', 'Admin Dinas Bina Marga & SDA', 'dinas', 'e0000000-0000-0000-0000-000000000001', 'ACTIVE', '081100000003'),
    ('a0000000-0000-0000-0000-000000000004', 'dlhk@kotacontoh.go.id', '$2a$10$pVl/dR63gsumKnvGeIH5IeppTQzigYEcIPyxFZxvVkOmpBcliRudu', 'Admin Dinas Lingkungan Hidup', 'dinas', 'e0000000-0000-0000-0000-000000000002', 'ACTIVE', '081100000004'),
    ('a0000000-0000-0000-0000-000000000005', 'dishub@kotacontoh.go.id', '$2a$10$pVl/dR63gsumKnvGeIH5IeppTQzigYEcIPyxFZxvVkOmpBcliRudu', 'Admin Dinas Perhubungan', 'dinas', 'e0000000-0000-0000-0000-000000000003', 'ACTIVE', '081100000005'),
    ('a0000000-0000-0000-0000-000000000006', 'warga@example.com', '$2a$10$pVl/dR63gsumKnvGeIH5IeppTQzigYEcIPyxFZxvVkOmpBcliRudu', 'Ahmad Dahlan (Warga)', 'pelapor', NULL, 'ACTIVE', '081100000006'),
    ('a0000000-0000-0000-0000-000000000007', 'rina.pelapor@gmail.com', '$2a$10$pVl/dR63gsumKnvGeIH5IeppTQzigYEcIPyxFZxvVkOmpBcliRudu', 'Rina Pelapor', 'pelapor', NULL, 'ACTIVE', '081100000007'),
    ('a0000000-0000-0000-0000-000000000008', 'bmsda@example.org', '$2a$10$pVl/dR63gsumKnvGeIH5IeppTQzigYEcIPyxFZxvVkOmpBcliRudu', 'Admin Bina Marga (Demo)', 'dinas', 'e0000000-0000-0000-0000-000000000001', 'ACTIVE', '081100000008'),
    ('a0000000-0000-0000-0000-000000000009', 'admin@example.org', '$2a$10$pVl/dR63gsumKnvGeIH5IeppTQzigYEcIPyxFZxvVkOmpBcliRudu', 'Admin Govra (Demo)', 'admin', NULL, 'ACTIVE', '081100000009')
ON CONFLICT (email) DO NOTHING;

INSERT INTO app.programs (id, region_id, opd_id, goal_id, district_id, code, name, description, budget_allocated, budget_spent, start_date, end_date, status, progress_percent, expected_percent, proposal_status, proposed_by, cover_image_url)
VALUES
    ('e1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'PRG-2026-001', 'Rekonstruksi Jalan Arteri & Saluran Utama Sudirman', 'Peninggian badan jalan dan perbaikan gorong-gorong beton untuk pencegahan genangan', 4500000000, 2700000000, '2026-01-10', '2026-11-30', 'BERJALAN', 65.00, 60.00, 'APPROVED', 'a0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6'),
    ('e1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'PRG-2026-002', 'Modernisasi TPS 3R & Pengadaan Armada Truk Listrik', 'Pengembangan tempat pengolahan sampah mandiri terpadu tingkat kecamatan', 2800000000, 1120000000, '2026-02-01', '2026-09-30', 'BERJALAN', 40.00, 45.00, 'APPROVED', 'a0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b'),
    ('e1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'PRG-2026-003', 'Penerangan Jalan Pintar (Smart PJU) Berbasis IoT', 'Instalasi 400 titik tiang smart lighting dengan sensor otomatis dan CCTV monitoring', 1900000000, 1520000000, '2026-01-15', '2026-06-30', 'BERJALAN', 80.00, 75.00, 'APPROVED', 'a0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1519501025264-65ba15a82390')
ON CONFLICT (code) DO NOTHING;

INSERT INTO app.program_milestones (id, program_id, title, target_date, status)
VALUES
    ('e2000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Penyelesaian Drainase Sisi Barat', '2026-04-15', 'COMPLETED'),
    ('e2000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'Pemasangan Box Culvert Utama', '2026-07-30', 'IN_PROGRESS'),
    ('e2000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001', 'Pengaspalan Hotmix Tahap Akhir', '2026-11-15', 'PENDING'),
    ('e2000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000002', 'Konstruksi Gedung Pemilah Sampah', '2026-05-30', 'IN_PROGRESS'),
    ('e2000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000003', 'Pemasangan Tiang & Modul IoT', '2026-04-30', 'COMPLETED')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.program_updates (id, program_id, opd_id, title, description, photos_json, progress_delta, created_by)
VALUES
    ('e3000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Pengecoran Beton Gorong-gorong Tahap II Selesai', 'Pengerjaan sisi barat Jl. Sudirman mencapai 65%. Arus lalu lintas tetap dibuka 1 lajur dengan pengawalan petugas.', '["https://images.unsplash.com/photo-1541888946425-d0fbb18086f6"]'::jsonb, 15.00, 'a0000000-0000-0000-0000-000000000003'),
    ('e3000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000003', 'Uji Coba Sistem Otomatisasi Smart PJU', 'Sebanyak 320 titik lampu sudah terintegrasi ke Command Center Dishub.', '["https://images.unsplash.com/photo-1519501025264-65ba15a82390"]'::jsonb, 25.00, 'a0000000-0000-0000-0000-000000000005')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.issues (id, code, opd_id, category_id, district_id, village_id, title, summary, status, urgency, safety_risk, center_lat, center_lng, address_detail, cover_photo_url, unique_reporters_count, sla_due_at)
VALUES
    ('i0000000-0000-0000-0000-000000000001', 'ISU-2026-0001', 'e0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Jalan Berlubang di Dekat Bundaran Patung Kuda', 'Lubang sedalam 15cm membahayakan pengendara roda dua terutama saat hujan', 'DIPROSES', 'TINGGI', 'sedang', -6.2088000, 106.8456000, 'Jl. Medan Merdeka Barat No. 12', 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6', 8, now() + interval '48 hours'),
    ('i0000000-0000-0000-0000-000000000002', 'ISU-2026-0002', 'e0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'Tumpukan Sampah Menumpuk di Bantaran Kali Ancol', 'Sampah liar menumpuk dan menimbulkan bau tidak sedap serta menyumbat aliran air', 'DITERUSKAN', 'URGENT', 'tinggi', -6.1550000, 106.8350000, 'Bantaran Kali Ancol Samping Jembatan Merah', 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b', 14, now() + interval '18 hours'),
    ('i0000000-0000-0000-0000-000000000003', 'ISU-2026-0003', 'e0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000005', 'Lampu PJU Padam di Sepanjang Koridor Cilandak', 'Sebanyak 6 tiang penerangan padam total menyebabkan area gelap rawan kecelakaan', 'MENUNGGU_VERIFIKASI', 'NORMAL', 'rendah', -6.2350000, 106.8350000, 'Jl. TB Simatupang Koridor Cilandak', 'https://images.unsplash.com/photo-1519501025264-65ba15a82390', 3, now() + interval '96 hours')
ON CONFLICT (code) DO NOTHING;

INSERT INTO app.issue_events (id, issue_id, author_id, from_status, to_status, note, evidence_photos)
VALUES
    ('i1000000-0000-0000-0000-000000000001', 'i0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'MENUNGGU_VERIFIKASI', 'DITERUSKAN', 'Isu telah diverifikasi dan diteruskan ke Dinas Bina Marga & SDA', '[]'::jsonb),
    ('i1000000-0000-0000-0000-000000000002', 'i0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'DITERUSKAN', 'DIPROSES', 'Petugas UPT Pemeliharaan Jalan sedang melakukan penambalan aspal coldmix', '["https://images.unsplash.com/photo-1541888946425-d0fbb18086f6"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.reports (id, code, issue_id, reporter_id, opd_id, category_id, district_id, village_id, title, description, address_text, lat, lng, visibility, status)
VALUES
    ('r0000000-0000-0000-0000-000000000001', 'LAP-2026-0001', 'i0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Aspal Amblas di Depan Halte', 'Aspal amblas sekitar kedalaman 15cm sangat berbahaya', 'Jl. Medan Merdeka Barat No. 12', -6.2088000, 106.8456000, 'PUBLIC', 'IN_PROGRESS'),
    ('r0000000-0000-0000-0000-000000000002', 'LAP-2026-0002', 'i0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'Tumpukan Sampah Bau Menyengat di Dekat Pasar', 'Banyak sampah plastik dan sisa makanan menumpuk belum diangkut', 'Bantaran Kali Ancol', -6.1550000, 106.8350000, 'PUBLIC', 'VERIFIED')
ON CONFLICT (code) DO NOTHING;

INSERT INTO app.feeds (id, author_id, report_id, issue_id, content, media_type, media_url, likes_count, shares_count)
VALUES
    ('fd000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000006', 'r0000000-0000-0000-0000-000000000001', 'i0000000-0000-0000-0000-000000000001', 'Jalan berlubang di Jl. Medan Merdeka Barat sudah mulai ditambal oleh Dinas Bina Marga! Terima kasih respon cepatnya.', 'IMAGE', 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6', 24, 7),
    ('fd000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000007', 'r0000000-0000-0000-0000-000000000002', 'i0000000-0000-0000-0000-000000000002', 'Warga Kali Ancol kompak bantu petugas kebersihan membersihkan bantaran sungai pagi ini.', 'IMAGE', 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b', 42, 15)
ON CONFLICT (id) DO NOTHING;
