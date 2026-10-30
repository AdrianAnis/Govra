CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.regions (
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

CREATE TABLE IF NOT EXISTS public.districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID REFERENCES public.regions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    center_lat NUMERIC(10, 7) NOT NULL,
    center_lng NUMERIC(10, 7) NOT NULL,
    polygon_geojson JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.villages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID REFERENCES public.districts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    center_lat NUMERIC(10, 7) NOT NULL,
    center_lng NUMERIC(10, 7) NOT NULL,
    polygon_geojson JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID REFERENCES public.regions(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.opds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID REFERENCES public.regions(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opd_id UUID REFERENCES public.opds(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(opd_id, slug)
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'pelapor' CHECK (role IN ('pelapor', 'dinas', 'admin', 'kepala_daerah')),
    opd_id UUID REFERENCES public.opds(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    purpose TEXT NOT NULL,
    token TEXT,
    pending_payload JSONB,
    attempts INT NOT NULL DEFAULT 0,
    send_count INT NOT NULL DEFAULT 1,
    lock_level INT NOT NULL DEFAULT 0,
    lock_until TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_email_purpose ON public.otp_verifications (email, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_token ON public.otp_verifications (token);
CREATE INDEX IF NOT EXISTS idx_otp_created_at ON public.otp_verifications (created_at DESC);

CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,
    action TEXT NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    lock_level INT NOT NULL DEFAULT 0,
    lock_until TIMESTAMPTZ,
    last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (identifier, action)
);

CREATE TABLE IF NOT EXISTS public.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
    opd_id UUID REFERENCES public.opds(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    allocated_budget NUMERIC(15, 2) NOT NULL DEFAULT 0,
    spent_budget NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ON_TRACK',
    year INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_date DATE NOT NULL,
    completed_date DATE,
    status TEXT NOT NULL DEFAULT 'PLANNED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
    opd_id UUID REFERENCES public.opds(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    percentage INT NOT NULL DEFAULT 0,
    photo_urls JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opd_id UUID REFERENCES public.opds(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    village_id UUID REFERENCES public.villages(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    lat NUMERIC(10, 7) NOT NULL,
    lng NUMERIC(10, 7) NOT NULL,
    address TEXT,
    urgency TEXT NOT NULL DEFAULT 'NORMAL',
    status TEXT NOT NULL DEFAULT 'DITERIMA',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.issue_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    note TEXT,
    evidence_urls JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL,
    tracking_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    lat NUMERIC(10, 7) NOT NULL,
    lng NUMERIC(10, 7) NOT NULL,
    address TEXT,
    audio_url TEXT,
    transcription TEXT,
    photo_urls JSONB DEFAULT '[]'::jsonb,
    visibility TEXT NOT NULL DEFAULT 'PUBLIC',
    status TEXT NOT NULL DEFAULT 'MENUNGGU_VERIFIKASI',
    ai_classification JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_feeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
    issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL,
    caption TEXT NOT NULL,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'image',
    support_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feed_supports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_id UUID REFERENCES public.community_feeds(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(feed_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.feed_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_id UUID REFERENCES public.community_feeds(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.regions (id, code, name, head_label, center_lat, center_lng, is_pilot)
VALUES ('a0000000-0000-0000-0000-000000000001', 'KOTA-SIMULASI', 'Kota Contoh', 'Wali Kota', -6.2088, 106.8456, true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, head_label = EXCLUDED.head_label;

INSERT INTO public.districts (id, region_id, name, center_lat, center_lng)
VALUES 
    ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Kecamatan Pusat', -6.2000, 106.8400),
    ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Kecamatan Utara', -6.1500, 106.8500),
    ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Kecamatan Selatan', -6.2500, 106.8300)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.villages (id, district_id, name, center_lat, center_lng)
VALUES
    ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Kelurahan Menteng Jaya', -6.2010, 106.8420),
    ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'Kelurahan Pegangsaan', -6.1990, 106.8450),
    ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'Kelurahan Ancol Baru', -6.1520, 106.8510)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.goals (id, region_id, code, name, description)
VALUES 
    ('g0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'INFRA', 'Infrastruktur Mantap dan Tangguh Bencana', 'Peningkatan jalan, jembatan, dan sistem drainase'),
    ('g0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'LINGKUNGAN', 'Kota Hijau, Bersih, dan Berkelanjutan', 'Pengelolaan sampah terpadu dan ruang terbuka hijau'),
    ('g0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'MOBILITAS', 'Transportasi Terintegrasi dan Tertib', 'Penyediaan angkutan umum andal dan manajemen lalu lintas')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO public.opds (id, region_id, code, name, slug, address, phone, email)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'DBMSDA', 'Dinas Bina Marga & Sumber Daya Air', 'dbmsda', 'Jl. Pemuda No. 10', '021-5551234', 'dbmsda@kotacontoh.go.id'),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'DLHK', 'Dinas Lingkungan Hidup & Kebersihan', 'dlhk', 'Jl. Kebersihan No. 5', '021-5555678', 'dlhk@kotacontoh.go.id'),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'DISHUB', 'Dinas Perhubungan', 'dishub', 'Jl. Merdeka No. 12', '021-5559012', 'dishub@kotacontoh.go.id')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;

INSERT INTO public.categories (id, opd_id, name, slug, description)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Jalan Rusak / Berlubang', 'jalan-rusak', 'Laporan kerusakan permukaan jalan'),
    ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Drainase & Saluran Tersumbat', 'drainase-tersumbat', 'Genangan air akibat selokan tersumbat'),
    ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'Tumpukan Sampah Liar', 'sampah-liar', 'Penumpukan sampah di luar TPS resmi'),
    ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'Lampu PJU Padam', 'pju-padam', 'Penerangan jalan umum tidak berfungsi')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;

INSERT INTO public.profiles (id, email, password_hash, display_name, role, opd_id, status, phone)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@pusat.govra.id', '$2a$10$0T6p9q4gK1zM0Y.j9r5R1Oq7XvI2v3.Qp8q4u3Q8s1W2e4R5t6y7u', 'Admin Pusat Kota Contoh', 'admin', NULL, 'ACTIVE', '08110000001'),
    ('00000000-0000-0000-0000-000000000002', 'walikota@kotacontoh.go.id', '$2a$10$0T6p9q4gK1zM0Y.j9r5R1Oq7XvI2v3.Qp8q4u3Q8s1W2e4R5t6y7u', 'Bpk. Ir. H. Ahmad Dahlan', 'kepala_daerah', NULL, 'ACTIVE', '08110000002'),
    ('00000000-0000-0000-0000-000000000003', 'dbmsda@kotacontoh.go.id', '$2a$10$0T6p9q4gK1zM0Y.j9r5R1Oq7XvI2v3.Qp8q4u3Q8s1W2e4R5t6y7u', 'Dinas Bina Marga & SDA', 'dinas', 'b0000000-0000-0000-0000-000000000001', 'ACTIVE', '08110000003'),
    ('00000000-0000-0000-0000-000000000004', 'dlhk@kotacontoh.go.id', '$2a$10$0T6p9q4gK1zM0Y.j9r5R1Oq7XvI2v3.Qp8q4u3Q8s1W2e4R5t6y7u', 'Dinas Lingkungan Hidup & Kebersihan', 'dinas', 'b0000000-0000-0000-0000-000000000002', 'ACTIVE', '08110000004'),
    ('00000000-0000-0000-0000-000000000005', 'dishub@kotacontoh.go.id', '$2a$10$0T6p9q4gK1zM0Y.j9r5R1Oq7XvI2v3.Qp8q4u3Q8s1W2e4R5t6y7u', 'Dinas Perhubungan', 'dinas', 'b0000000-0000-0000-0000-000000000003', 'ACTIVE', '08110000005'),
    ('00000000-0000-0000-0000-000000000006', 'warga@example.com', '$2a$10$0T6p9q4gK1zM0Y.j9r5R1Oq7XvI2v3.Qp8q4u3Q8s1W2e4R5t6y7u', 'Warga Kota', 'pelapor', NULL, 'ACTIVE', '081234567890'),
    ('00000000-0000-0000-0000-000000000007', 'rina.pelapor@gmail.com', '$2a$10$0T6p9q4gK1zM0Y.j9r5R1Oq7XvI2v3.Qp8q4u3Q8s1W2e4R5t6y7u', 'Rina Handayani', 'pelapor', NULL, 'ACTIVE', '081298765432'),
    ('00000000-0000-0000-0000-000000000008', 'bmsda@example.org', '$2a$10$0T6p9q4gK1zM0Y.j9r5R1Oq7XvI2v3.Qp8q4u3Q8s1W2e4R5t6y7u', 'Staf Bina Marga', 'dinas', 'b0000000-0000-0000-0000-000000000001', 'ACTIVE', '081211112222'),
    ('00000000-0000-0000-0000-000000000009', 'admin@example.org', '$2a$10$0T6p9q4gK1zM0Y.j9r5R1Oq7XvI2v3.Qp8q4u3Q8s1W2e4R5t6y7u', 'Super Admin', 'admin', NULL, 'ACTIVE', '081299998888')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, display_name = EXCLUDED.display_name, role = EXCLUDED.role;

ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_supports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_%s" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "allow_all_%s" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t, t);
    END LOOP;
END $$;

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
