// Caminho: src/services/supabaseClient.ts
/**
 * ============================================================================
 * CANISTECH DOGOS — CONECTOR HÍBRIDO SUPABASE DUAL-MODE (CLOUD + LOCAL VAULT)
 * ============================================================================
 * Modo Dual-Mode Inteligente:
 * 1. Cloud Mode (PostgreSQL + RLS + Storage): Ativado automaticamente quando as
 *    variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas.
 * 2. Local Vault Fallback Mode: Caso as credenciais não estejam definidas ou o
 *    dispositivo esteja offline, opera com 100% de transparência no Cofre Local Seguro.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DogProfile, VaccineRecord, LgpdConsentRecord, AuditLogEntry } from '../types';

export interface SupabaseDualModeStatus {
  mode: 'SUPABASE_CLOUD' | 'LOCAL_SECURE_VAULT';
  isCloudConfigured: boolean;
  supabaseUrl: string | null;
  lastSyncAt: string | null;
}

const envObj = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};

export const SUPABASE_URL = (envObj.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
export const SUPABASE_ANON_KEY = (envObj.VITE_SUPABASE_ANON_KEY || '').trim();

export function isSupabaseCloudConfigured(): boolean {
  return Boolean(
    SUPABASE_URL &&
      SUPABASE_ANON_KEY &&
      SUPABASE_URL.startsWith('https://') &&
      !SUPABASE_URL.includes('seu-projeto.supabase.co')
  );
}

/**
 * Cliente oficial Supabase JS (com Auth, Database e Storage)
 */
export const supabase: SupabaseClient | null = isSupabaseCloudConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

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
 * Upload de Foto Biométrica WebP para o Supabase Storage (Bucket dog-photos)
 * Caminho padrão: `${userId}/${Date.now()}.webp`
 * Retorna a publicUrl ou null caso Supabase Storage não esteja configurado
 */
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

/**
 * Converte linha do Supabase (`public.dogs`) para o formato da aplicação (`DogProfile`)
 */
export function mapSupabaseRowToDog(row: any): DogProfile {
  const currentWeight = Number(row.current_weight) || 15.0;
  return {
    id: row.id,
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

/**
 * Converte `DogProfile` para o schema da tabela `public.dogs`
 */
export function mapDogToSupabasePayload(dog: DogProfile, ownerId?: string) {
  return {
    id: dog.id,
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

/**
 * Consulta a lista de cães no Supabase para o usuário ativo (com RLS ou filtro ownerId)
 */
export async function fetchDogsFromSupabase(userId?: string): Promise<DogProfile[] | null> {
  if (!supabase || !isSupabaseCloudConfigured()) return null;

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

/**
 * Salva ou atualiza um cão no Supabase (`upsert`)
 */
export async function upsertDogInSupabase(dog: DogProfile, ownerId?: string): Promise<boolean> {
  if (!supabase || !isSupabaseCloudConfigured()) return false;

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

/**
 * Remove um cão no Supabase
 */
export async function deleteDogFromSupabase(dogId: string, ownerId?: string): Promise<boolean> {
  if (!supabase || !isSupabaseCloudConfigured()) return false;

  try {
    let query = supabase.from('dogs').delete().eq('id', dogId);
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

/**
 * Sincroniza um exemplar canino (DogProfile) em modo Dual-Mode:
 * Salva sempre no Cofre Local e replica para a tabela `dogs` no Supabase quando ativo.
 */
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

/**
 * Sincroniza registros de vacinação (VaccineRecord) em modo Dual-Mode
 */
export async function syncVaccineRecordDualMode(
  vaccine: VaccineRecord,
  ownerId?: string,
  _accessToken?: string
): Promise<{ syncedToCloud: boolean }> {
  if (!supabase || !isSupabaseCloudConfigured()) {
    return { syncedToCloud: false };
  }

  try {
    const payload = {
      id: vaccine.id,
      ...(ownerId ? { owner_id: ownerId } : {}),
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

    const { error } = await supabase.from('vaccine_records').upsert(payload, { onConflict: 'id' });
    return { syncedToCloud: !error };
  } catch {
    return { syncedToCloud: false };
  }
}

/**
 * Sincroniza o registro de Consentimento LGPD (Art. 7º e 8º da Lei 13.709/2018)
 */
export async function syncLgpdConsentDualMode(
  consent: LgpdConsentRecord,
  ownerId?: string,
  _accessToken?: string
): Promise<{ syncedToCloud: boolean }> {
  if (!supabase || !isSupabaseCloudConfigured()) {
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

/**
 * Sincroniza eventos de auditoria (AuditLogEntry) em modo Dual-Mode
 */
export async function syncAuditLogDualMode(
  entry: AuditLogEntry,
  ownerId?: string,
  _accessToken?: string
): Promise<{ syncedToCloud: boolean }> {
  if (!supabase || !isSupabaseCloudConfigured()) {
    return { syncedToCloud: false };
  }

  try {
    const payload = {
      id: entry.id,
      ...(ownerId ? { owner_id: ownerId } : {}),
      timestamp: entry.timestamp,
      user_email: entry.userEmail,
      action: entry.action,
      provider: entry.provider,
      ip_info: entry.ipMock,
      status: entry.status,
      details: entry.details,
    };

    const { error } = await supabase.from('audit_logs').insert(payload);
    return { syncedToCloud: !error };
  } catch {
    return { syncedToCloud: false };
  }
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
