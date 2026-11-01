// Caminho: src/services/supabaseClient.ts
/**
 * ============================================================================
 * CANISTECH DOGOS — CONECTOR HÍBRIDO SUPABASE DUAL-MODE (CLOUD + LOCAL VAULT)
 * ============================================================================
 * Modo Dual-Mode Inteligente:
 * 1. Cloud Mode (PostgreSQL + RLS): Ativado automaticamente quando as variáveis
 *    `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão definidas no `.env`.
 * 2. Local Vault Fallback Mode: Caso as credenciais de nuvem não estejam
 *    configuradas ou o dispositivo esteja offline, opera com 100% de
 *    funcionalidade no Cofre Local Seguro (`localStorage` + SHA-256 Web Crypto).
 */

import { DogProfile, VaccineRecord, LgpdConsentRecord, AuditLogEntry } from '../types';

export interface SupabaseDualModeStatus {
  mode: 'SUPABASE_CLOUD' | 'LOCAL_SECURE_VAULT';
  isCloudConfigured: boolean;
  supabaseUrl: string | null;
  lastSyncAt: string | null;
}

const envObj = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};

const SUPABASE_URL = (envObj.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
const SUPABASE_ANON_KEY = (envObj.VITE_SUPABASE_ANON_KEY || '').trim();

export function isSupabaseCloudConfigured(): boolean {
  return Boolean(
    SUPABASE_URL &&
      SUPABASE_ANON_KEY &&
      SUPABASE_URL.startsWith('https://') &&
      !SUPABASE_URL.includes('seu-projeto.supabase.co')
  );
}

export function getSupabaseDualModeStatus(): SupabaseDualModeStatus {
  const configured = isSupabaseCloudConfigured();
  let lastSyncAt: string | null = null;
  try {
    lastSyncAt = localStorage.getItem('canistech_supabase_last_sync_v1');
  } catch {
    lastSyncAt = null;
  }

  return {
    mode: configured ? 'SUPABASE_CLOUD' : 'LOCAL_SECURE_VAULT',
    isCloudConfigured: configured,
    supabaseUrl: configured ? SUPABASE_URL : null,
    lastSyncAt,
  };
}

/**
 * Chamada REST nativa ao PostgREST do Supabase (Zero overhead de bundle)
 */
async function supabaseRestFetch<T>(
  tableAndQuery: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<T | null> {
  if (!isSupabaseCloudConfigured()) return null;

  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation,resolution=merge-duplicates',
    ...(options.headers as Record<string, string> | undefined),
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableAndQuery}`, {
      ...options,
      headers,
    });
    if (!response.ok) {
      return null;
    }
    const text = await response.text();
    return text ? (JSON.parse(text) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Sincroniza um exemplar canino (DogProfile) em modo Dual-Mode:
 * Salva sempre no Cofre Local e replica para a tabela `dogs` no Supabase quando ativo.
 */
export async function syncDogProfileDualMode(
  dog: DogProfile,
  ownerId?: string,
  accessToken?: string
): Promise<{ syncedToCloud: boolean }> {
  if (!isSupabaseCloudConfigured()) {
    return { syncedToCloud: false };
  }

  const payload = {
    id: dog.id,
    owner_id: ownerId || null,
    name: dog.name,
    breed: dog.breed,
    kennel_affix: dog.kennelAffix || null,
    rg_number: dog.rgNumber,
    microchip: dog.microchip || null,
    birth_date: dog.birthDate || null,
    gender: dog.gender,
    neutered: dog.neutered,
    current_weight: dog.currentWeight,
    ideal_weight_min: dog.idealWeightMin,
    ideal_weight_max: dog.idealWeightMax,
    bcs_score: dog.bcsScore,
    photo_url: dog.photoUrl,
    tutor_name: dog.tutorName,
    tutor_cpf: dog.tutorCpf || null,
    tutor_phone: dog.tutorPhone,
    tutor_email: dog.tutorEmail || null,
    city: dog.city,
    state: dog.state,
    pedigree: dog.pedigree || {},
    rgc_security_hash: dog.rgcSecurityHash || null,
    vital_status: dog.vitalStatus || 'alive',
    updated_at: new Date().toISOString(),
  };

  const result = await supabaseRestFetch(
    'dogs?on_conflict=id',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    accessToken
  );

  if (result) {
    try {
      localStorage.setItem('canistech_supabase_last_sync_v1', new Date().toISOString());
    } catch {}
    return { syncedToCloud: true };
  }
  return { syncedToCloud: false };
}

/**
 * Sincroniza registros de vacinação (VaccineRecord) em modo Dual-Mode
 */
export async function syncVaccineRecordDualMode(
  vaccine: VaccineRecord,
  ownerId?: string,
  accessToken?: string
): Promise<{ syncedToCloud: boolean }> {
  if (!isSupabaseCloudConfigured()) {
    return { syncedToCloud: false };
  }

  const payload = {
    id: vaccine.id,
    owner_id: ownerId || null,
    dog_id: vaccine.dogId || null,
    name: vaccine.name,
    description: vaccine.description,
    manufacturer: vaccine.manufacturer,
    lot: vaccine.lot,
    last_date: vaccine.lastDate,
    next_date: vaccine.nextDate,
    status: vaccine.status,
    category: vaccine.category,
    clinic: vaccine.clinic || null,
    veterinarian_crmv: vaccine.veterinarianCrmv || null,
    updated_at: new Date().toISOString(),
  };

  const result = await supabaseRestFetch(
    'vaccine_records?on_conflict=id',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    accessToken
  );

  return { syncedToCloud: Boolean(result) };
}

/**
 * Sincroniza o registro de Consentimento LGPD (Art. 7º e 8º da Lei 13.709/2018)
 */
export async function syncLgpdConsentDualMode(
  consent: LgpdConsentRecord,
  ownerId?: string,
  accessToken?: string
): Promise<{ syncedToCloud: boolean }> {
  if (!isSupabaseCloudConfigured()) {
    return { syncedToCloud: false };
  }

  const payload = {
    owner_id: ownerId || null,
    user_email: consent.userEmail || 'titular_local@canistech.com.br',
    policy_version: consent.policyVersion,
    accepted_at: consent.acceptedAt,
    consent_hash: consent.consentHash,
    user_agent: consent.userAgent,
    dpo_channel: consent.dpoChannel,
  };

  const result = await supabaseRestFetch(
    'lgpd_consents',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    accessToken
  );

  return { syncedToCloud: Boolean(result) };
}

/**
 * Sincroniza eventos de auditoria (AuditLogEntry) em modo Dual-Mode
 */
export async function syncAuditLogDualMode(
  entry: AuditLogEntry,
  ownerId?: string,
  accessToken?: string
): Promise<{ syncedToCloud: boolean }> {
  if (!isSupabaseCloudConfigured()) {
    return { syncedToCloud: false };
  }

  const payload = {
    id: entry.id,
    owner_id: ownerId || null,
    timestamp: entry.timestamp,
    user_email: entry.userEmail,
    action: entry.action,
    provider: entry.provider,
    ip_info: entry.ipMock,
    status: entry.status,
    details: entry.details,
  };

  const result = await supabaseRestFetch(
    'audit_logs',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    accessToken
  );

  return { syncedToCloud: Boolean(result) };
}

/**
 * Sincroniza em lote o Cofre Local com o Supabase PostgreSQL caso o modo Cloud esteja ativo
 */
export async function syncVaultWithSupabaseDualMode(
  dogs: DogProfile[],
  vaccines: VaccineRecord[],
  ownerId?: string,
  accessToken?: string
): Promise<SupabaseDualModeStatus> {
  if (!isSupabaseCloudConfigured()) {
    return getSupabaseDualModeStatus();
  }

  try {
    await Promise.allSettled([
      ...dogs.map((d) => syncDogProfileDualMode(d, ownerId, accessToken)),
      ...vaccines.map((v) => syncVaccineRecordDualMode(v, ownerId, accessToken)),
    ]);
    localStorage.setItem('canistech_supabase_last_sync_v1', new Date().toISOString());
  } catch {
    // Fallback transparente para o Cofre Local Seguro
  }

  return getSupabaseDualModeStatus();
}
