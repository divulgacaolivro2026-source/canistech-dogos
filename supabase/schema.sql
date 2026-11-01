-- ============================================================================
-- CANISTECH DOGOS — SUPABASE POSTGRESQL SCHEMA + ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Conformidade: LGPD (Lei 13.709/2018), CDC, CFMV e MAPA
-- Políticas RLS estritas por proprietário: auth.uid() = owner_id
-- ============================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TABELA: profiles (Titulares & Tutores Autenticados)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  cpf_masked TEXT,
  city TEXT DEFAULT 'São Paulo',
  state TEXT DEFAULT 'SP',
  avatar_url TEXT,
  gold_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() = id)
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = id);

CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = owner_id OR auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 2. TABELA: dogs (Prontuários Biométricos, RGC & Pedigree de 3 Gerações)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dogs (
  id TEXT PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  breed TEXT NOT NULL,
  kennel_affix TEXT,
  rg_number TEXT NOT NULL,
  microchip TEXT,
  birth_date TEXT,
  gender TEXT NOT NULL CHECK (gender IN ('Macho', 'Fêmea')),
  neutered BOOLEAN NOT NULL DEFAULT FALSE,
  current_weight NUMERIC(5,2) NOT NULL DEFAULT 10.0,
  ideal_weight_min NUMERIC(5,2) NOT NULL DEFAULT 8.0,
  ideal_weight_max NUMERIC(5,2) NOT NULL DEFAULT 12.0,
  bcs_score SMALLINT NOT NULL DEFAULT 5 CHECK (bcs_score BETWEEN 1 AND 9),
  photo_url TEXT, -- Imagem WebP comprimida 360x480 (~25KB - 55KB)
  tutor_name TEXT NOT NULL,
  tutor_cpf TEXT,
  tutor_phone TEXT NOT NULL,
  tutor_email TEXT,
  city TEXT NOT NULL DEFAULT 'São Paulo',
  state TEXT NOT NULL DEFAULT 'SP',
  pedigree JSONB NOT NULL DEFAULT '{}'::jsonb, -- Árvore Genealógica de 3 Gerações (Pai, Mãe, 4 Avós, 8 Bisavós)
  rgc_security_hash TEXT, -- Assinatura SHA-256 via Web Crypto API
  vital_status TEXT NOT NULL DEFAULT 'alive' CHECK (vital_status IN ('alive', 'deceased')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dogs_owner_id ON public.dogs(owner_id);
CREATE INDEX IF NOT EXISTS idx_dogs_rg_number ON public.dogs(rg_number);

ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dogs_select_own"
  ON public.dogs FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "dogs_insert_own"
  ON public.dogs FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "dogs_update_own"
  ON public.dogs FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "dogs_delete_own"
  ON public.dogs FOR DELETE
  USING (auth.uid() = owner_id);

-- ----------------------------------------------------------------------------
-- 3. TABELA: vaccine_records (Histórico Sanitário WSAVA 2024 & Lotes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vaccine_records (
  id TEXT PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  dog_id TEXT REFERENCES public.dogs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  manufacturer TEXT,
  lot TEXT,
  last_date TEXT NOT NULL,
  next_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'warning', 'expired')),
  category TEXT NOT NULL DEFAULT 'vacina' CHECK (category IN ('vacina', 'antiparasitario', 'vermifugo')),
  clinic TEXT,
  veterinarian_crmv TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vaccine_records_owner_id ON public.vaccine_records(owner_id);
CREATE INDEX IF NOT EXISTS idx_vaccine_records_dog_id ON public.vaccine_records(dog_id);

ALTER TABLE public.vaccine_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vaccine_records_select_own"
  ON public.vaccine_records FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "vaccine_records_insert_own"
  ON public.vaccine_records FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "vaccine_records_update_own"
  ON public.vaccine_records FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "vaccine_records_delete_own"
  ON public.vaccine_records FOR DELETE
  USING (auth.uid() = owner_id);

-- ----------------------------------------------------------------------------
-- 4. TABELA: lgpd_consents (Registro de Consentimento Explícito Art. 7º e 8º LGPD)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lgpd_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consent_hash TEXT NOT NULL, -- Hash criptográfico SHA-256 do termo aceito
  user_agent TEXT,
  dpo_channel TEXT NOT NULL DEFAULT 'dpo@canistech.com.br',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lgpd_consents_owner_id ON public.lgpd_consents(owner_id);

ALTER TABLE public.lgpd_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lgpd_consents_select_own"
  ON public.lgpd_consents FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "lgpd_consents_insert_own"
  ON public.lgpd_consents FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "lgpd_consents_delete_own"
  ON public.lgpd_consents FOR DELETE
  USING (auth.uid() = owner_id);

-- ----------------------------------------------------------------------------
-- 5. TABELA: audit_logs (Trilha de Auditoria de Segurança e Operações)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  provider TEXT NOT NULL,
  ip_info TEXT,
  status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'WARNING', 'REVOKED')),
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_owner_id ON public.audit_logs(owner_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select_own"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "audit_logs_insert_own"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "audit_logs_delete_own"
  ON public.audit_logs FOR DELETE
  USING (auth.uid() = owner_id);
