CREATE SCHEMA IF NOT EXISTS app;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS app.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'pelapor' CHECK (role IN ('pelapor', 'dinas', 'admin', 'kepala_daerah')),
    opd_id UUID,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING')),
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE IF EXISTS app.profiles ADD COLUMN IF NOT EXISTS opd_id UUID;
ALTER TABLE IF EXISTS app.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE IF EXISTS app.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE IF EXISTS app.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE IF EXISTS app.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE IF EXISTS app.profiles DROP CONSTRAINT IF EXISTS app_profiles_status_check;

CREATE TABLE IF NOT EXISTS app.otp_verifications (
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

ALTER TABLE IF EXISTS app.otp_verifications ADD COLUMN IF NOT EXISTS token TEXT;
ALTER TABLE IF EXISTS app.otp_verifications ADD COLUMN IF NOT EXISTS pending_payload JSONB;
ALTER TABLE IF EXISTS app.otp_verifications ADD COLUMN IF NOT EXISTS send_count INT NOT NULL DEFAULT 1;
ALTER TABLE IF EXISTS app.otp_verifications ADD COLUMN IF NOT EXISTS lock_level INT NOT NULL DEFAULT 0;
ALTER TABLE IF EXISTS app.otp_verifications ADD COLUMN IF NOT EXISTS lock_until TIMESTAMPTZ;
ALTER TABLE IF EXISTS app.otp_verifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_app_otp_email_purpose ON app.otp_verifications (email, purpose);
CREATE INDEX IF NOT EXISTS idx_app_otp_token ON app.otp_verifications (token);
CREATE INDEX IF NOT EXISTS idx_app_otp_created_at ON app.otp_verifications (created_at DESC);

CREATE TABLE IF NOT EXISTS app.auth_rate_limits (
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

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles' AND table_type = 'BASE TABLE') THEN
        INSERT INTO app.profiles (id, email, password_hash, display_name, role, opd_id, status, phone, avatar_url, created_at, updated_at)
        SELECT id, email, password_hash, display_name, role, opd_id, status, phone, avatar_url, created_at, updated_at
        FROM public.profiles
        ON CONFLICT (email) DO UPDATE 
        SET password_hash = EXCLUDED.password_hash,
            display_name = EXCLUDED.display_name,
            role = EXCLUDED.role,
            status = EXCLUDED.status,
            updated_at = EXCLUDED.updated_at;
            
        DROP TABLE public.profiles CASCADE;
    ELSIF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        DROP VIEW public.profiles CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'otp_verifications' AND table_type = 'BASE TABLE') THEN
        INSERT INTO app.otp_verifications (id, email, code, purpose, token, pending_payload, attempts, send_count, lock_level, lock_until, expires_at, is_used, created_at, updated_at)
        SELECT id, email, code, purpose, token, pending_payload, attempts, send_count, lock_level, lock_until, expires_at, is_used, created_at, updated_at
        FROM public.otp_verifications
        ON CONFLICT (id) DO NOTHING;
        
        DROP TABLE public.otp_verifications CASCADE;
    ELSIF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'otp_verifications') THEN
        DROP VIEW public.otp_verifications CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'auth_rate_limits' AND table_type = 'BASE TABLE') THEN
        INSERT INTO app.auth_rate_limits (id, identifier, action, attempts, lock_level, lock_until, last_attempt_at, created_at, updated_at)
        SELECT id, identifier, action, attempts, lock_level, lock_until, last_attempt_at, created_at, updated_at
        FROM public.auth_rate_limits
        ON CONFLICT (identifier, action) DO NOTHING;
        
        DROP TABLE public.auth_rate_limits CASCADE;
    ELSIF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'auth_rate_limits') THEN
        DROP VIEW public.auth_rate_limits CASCADE;
    END IF;
END $$;

CREATE OR REPLACE VIEW public.profiles AS SELECT * FROM app.profiles;
CREATE OR REPLACE VIEW public.otp_verifications AS SELECT * FROM app.otp_verifications;
CREATE OR REPLACE VIEW public.auth_rate_limits AS SELECT * FROM app.auth_rate_limits;

ALTER TABLE app.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.auth_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_profiles" ON app.profiles;
CREATE POLICY "allow_all_profiles" ON app.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_otp_verifications" ON app.otp_verifications;
CREATE POLICY "allow_all_otp_verifications" ON app.otp_verifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_auth_rate_limits" ON app.auth_rate_limits;
CREATE POLICY "allow_all_auth_rate_limits" ON app.auth_rate_limits FOR ALL USING (true) WITH CHECK (true);

GRANT USAGE ON SCHEMA app TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA app TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA app TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA app TO postgres, anon, authenticated, service_role;

GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.otp_verifications TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.auth_rate_limits TO postgres, anon, authenticated, service_role;

ALTER ROLE authenticator SET pgrst.db_schemas = 'public, app';
NOTIFY pgrst, 'reload config';
