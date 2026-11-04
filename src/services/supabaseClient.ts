// Caminho: src/services/supabaseClient.ts
/**
 * ============================================================================
 * CANISTECH DOGOS — CONECTOR HÍBRIDO SUPABASE DUAL-MODE (CLOUD + LOCAL VAULT)
 * ============================================================================
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DogProfile, VaccineRecord, LgpdConsentRecord, AuditLogEntry } from '../types';

export interface SupabaseDualModeStatus {
  mode: 'SUPABASE_CLOUD' | 'LOCAL_SECURE_VAULT';
  isCloudConfigured: boolean;
  supabaseUrl: string | null;
  lastSyncAt: string | null;
}

const ENV_URL = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_SUPABASE_URL?.trim().replace(/\/+$/, '');
const ENV_KEY = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_SUPABASE_ANON_KEY?.trim();

const envOk = Boolean(
  ENV_URL &&
    ENV_URL.startsWith('https://') &&
    !ENV_URL.includes('seu-projeto') &&
    ENV_KEY
);

export const SUPABASE_URL = envOk ? ENV_URL! : 'https://cfkwuzyzrpstcihmtrje.supabase.co';
export const SUPABASE_ANON_KEY = envOk ? ENV_KEY! : 'sb_publishable_rNA5M-wQT9mVPXqnh7h0JQ_63n9Y1hH';

export function isSupabaseCloudConfigured(): boolean {
  return Boolean(
    SUPABASE_URL &&
      SUPABASE_ANON_KEY &&
      SUPABASE_URL.startsWith('https://') &&
      !SUPABASE_URL.includes('seu-projeto.supabase.co')
  );
}

/**
 * Cliente oficial Supabase JS (com Auth PKCE, Database e Storage)
 */
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

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
 * Evita colisão de chave primária (TEXT PRIMARY KEY) entre diferentes tutores
 * quando sincronizam os cães/vacinas iniciais de demonstração (ex: dog-thor)
 */
function scopeCloudRecordId(rawId: string, ownerId?: string): string {
  if (!ownerId || !rawId) return rawId;
  const prefix = ownerId.slice(0, 8);
  if (rawId.startsWith(`${prefix}_`)) return rawId;
  if (rawId === 'dog-thor' || rawId === 'dog-luna' || rawId === 'dog-max' || /^vac-\d+$/.test(rawId) || rawId.startsWith('vac-v')) {
    return `${prefix}_${rawId}`;
  }
  return rawId;
}

function unscopeCloudDogId(cloudId: string, ownerId?: string): string {
  if (!ownerId || !cloudId) return cloudId;
  const prefix = `${ownerId.slice(0, 8)}_`;
  return cloudId.startsWith(prefix) ? cloudId.slice(prefix.length) : cloudId;
}

export async function uploadDogPhotoToSupabase(
  blob: Blob,
  userId: string = 'anon'
): Promise<string | null> {
  if (!supabase || !isSupabaseCloudConfigured()) {
    return null;
  }

  try {
    const cleanUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${cleanUserId}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.webp`;

    const { data, error } = await supabase.storage
      .from('dog-photos')
      .upload(fileName, blob, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (error || !data) {
      console.warn('Supabase Storage: falha no upload direto, utilizando fallback.', error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('dog-photos')
      .getPublicUrl(fileName);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.warn('Erro ao enviar imagem ao Supabase Storage:', err);
    return null;
  }
}

export function mapSupabaseRowToDog(row: any): DogProfile {
  const currentWeight = Number(row.current_weight) || 15.0;
  const localId = unscopeCloudDogId(String(row.id || ''), row.owner_id);
  return {
    id: localId,
    name: row.name,
    breed: row.breed,
    breedGroup: 'companhia',
    kennelAffix: row.kennel_affix || undefined,
    rgNumber: row.rg_number,
    microchip: row.microchip || '',
    birthDate: row.birth_date || '2023-05-10',
    gender: row.gender || 'Macho',
    neutered: Boolean(row.neutered),
    currentWeight,
    idealWeightMin: Number(row.ideal_weight_min) || 12.0,
    idealWeightMax: Number(row.ideal_weight_max) || 18.0,
    bcsScore: Number(row.bcs_score) || 5,
    photoUrl: row.photo_url || '',
    tutorName: row.tutor_name || 'Tutor Responsável',
    tutorCpf: row.tutor_cpf || undefined,
    tutorPhone: row.tutor_phone || '(11) 99999-9999',
    tutorEmail: row.tutor_email || '',
    city: row.city || 'São Paulo',
    state: row.state || 'SP',
    pedigree: row.pedigree || {},
    rgcSecurityHash: row.rgc_security_hash || undefined,
    vitalStatus: row.vital_status || 'alive',
    ownerEmail: row.tutor_email || '',
    ageYears: row.birth_date ? Math.max(0, Math.floor((new Date().getTime() - new Date(row.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000))) : 1,
    ageMonths: 0,
    lifeStage: 'adulto',
    dietGramsPerDay: Math.round(currentWeight * 25),
    dietPortions: 2,
    dailyWaterMl: Math.round(currentWeight * 55),
    supplements: 'Fórmula preventiva equilibrada CanisTech',
    dailyExerciseMin: 45,
    cognitiveMin: 20,
    allergies: ['Nenhuma alergia relatada no cadastro inicial'],
    anatomicRisk: `Monitoramento biométrico padrão para ${row.breed || 'o cão'}`,
  };
}

export function mapDogToSupabasePayload(dog: DogProfile, ownerId?: string) {
  return {
    id: scopeCloudRecordId(dog.id, ownerId),
    ...(ownerId ? { owner_id: ownerId } : {}),
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
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function fetchDogsFromSupabase(userId?: string): Promise<DogProfile[] | null> {
  if (!supabase || !isSupabaseCloudConfigured()) return null;
  if (userId && !UUID_REGEX.test(userId)) return null;

  try {
    let query = supabase.from('dogs').select('*').order('created_at', { ascending: false });
    if (userId) {
      query = query.eq('owner_id', userId);
    }
    const { data, error } = await query;
    if (error || !data) return null;
    return data.map(mapSupabaseRowToDog);
  } catch (err) {
    console.warn('Erro ao consultar cães do Supabase:', err);
    return null;
  }
}

export async function upsertDogInSupabase(dog: DogProfile, ownerId?: string): Promise<boolean> {
  if (!supabase || !isSupabaseCloudConfigured()) return false;
  if (ownerId && !UUID_REGEX.test(ownerId)) return false;

  try {
    const payload = mapDogToSupabasePayload(dog, ownerId);
    const { error } = await supabase.from('dogs').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Erro ao upsert de cão no Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Erro na requisição Supabase dogs upsert:', err);
    return false;
  }
}

export async function deleteDogFromSupabase(dogId: string, ownerId?: string): Promise<boolean> {
  if (!supabase || !isSupabaseCloudConfigured()) return false;
  if (ownerId && !UUID_REGEX.test(ownerId)) return false;

  try {
    const cloudDogId = scopeCloudRecordId(dogId, ownerId);
    let query = supabase.from('dogs').delete().eq('id', cloudDogId);
    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    }
    const { error } = await query;
    return !error;
  } catch (err) {
    console.warn('Erro ao deletar cão no Supabase:', err);
    return false;
  }
}

export async function syncDogProfileDualMode(
  dog: DogProfile,
  ownerId?: string,
  _accessToken?: string
): Promise<{ syncedToCloud: boolean }> {
  if (!isSupabaseCloudConfigured()) {
    return { syncedToCloud: false };
  }

  const ok = await upsertDogInSupabase(dog, ownerId);
  if (ok) {
    try {
      localStorage.setItem('canistech_supabase_last_sync_v1', new Date().toISOString());
    } catch {}
    return { syncedToCloud: true };
  }
  return { syncedToCloud: false };
}

export async function syncVaccineRecordDualMode(
  vaccine: VaccineRecord,
  ownerId?: string,
  _accessToken?: string
): Promise<{ syncedToCloud: boolean }> {
  if (!supabase || !isSupabaseCloudConfigured()) {
    return { syncedToCloud: false };
  }
  if (ownerId && !UUID_REGEX.test(ownerId)) {
    return { syncedToCloud: false };
  }

  try {
    const payload = {
      id: scopeCloudRecordId(vaccine.id, ownerId),
      ...(ownerId ? { owner_id: ownerId } : {}),
      dog_id: vaccine.dogId ? scopeCloudRecordId(vaccine.dogId, ownerId) : null,
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

    const { error } = await supabase.from('vaccine_records').upsert(payload, { onConflict: 'id' });
    return { syncedToCloud: !error };
  } catch {
    return { syncedToCloud: false };
  }
}

export async function syncLgpdConsentDualMode(
  consent: LgpdConsentRecord,
  ownerId?: string,
  _accessToken?: string
): Promise<{ syncedToCloud: boolean }> {
  if (!supabase || !isSupabaseCloudConfigured()) {
    return { syncedToCloud: false };
  }
  if (ownerId && !UUID_REGEX.test(ownerId)) {
    return { syncedToCloud: false };
  }

  try {
    const payload = {
      ...(ownerId ? { owner_id: ownerId } : {}),
      user_email: consent.userEmail || 'titular_local@canistech.net.br',
      policy_version: consent.policyVersion,
      accepted_at: consent.acceptedAt,
      consent_hash: consent.consentHash,
      user_agent: consent.userAgent,
      dpo_channel: consent.dpoChannel,
    };

    const { error } = await supabase.from('lgpd_consents').insert(payload);
    return { syncedToCloud: !error };
  } catch {
    return { syncedToCloud: false };
  }
}

export async function syncAuditLogDualMode(
  entry: AuditLogEntry,
  ownerId?: string,
  _accessToken?: string
): Promise<{ syncedToCloud: boolean }> {
  if (!supabase || !isSupabaseCloudConfigured()) {
    return { syncedToCloud: false };
  }
  if (ownerId && !UUID_REGEX.test(ownerId)) {
    return { syncedToCloud: false };
  }

  try {
    const safeStatus =
      entry.status === 'SUCCESS' || entry.status === 'WARNING' || entry.status === 'REVOKED'
        ? entry.status
        : 'WARNING';

    const payload = {
      id: entry.id,
      ...(ownerId ? { owner_id: ownerId } : {}),
      timestamp: entry.timestamp,
      user_email: entry.userEmail,
      action: entry.action,
      provider: entry.provider,
      ip_info: entry.ipMock,
      status: safeStatus,
      details: entry.details,
    };

    const { error } = await supabase.from('audit_logs').insert(payload);
    return { syncedToCloud: !error };
  } catch {
    return { syncedToCloud: false };
  }
}

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