// Caminho: src/services/goldAndPrivacyService.ts
import {
  clearUserSession,
  getRegisteredAccounts,
  isSeniorAdmin,
  computeSha256Hex,
  computeSha256HexSync,
  sanitizeXss,
  sanitizeSafeDisplay,
  logAuditEvent,
} from './authService';
import { TrainingCertificateRecord, LgpdConsentRecord } from '../types';

export const MAX_GOLD_SLOTS = 200;
export const GOLD_DURATION_DAYS = 90; // 3 meses de validade
const GOLD_STORAGE_KEY = 'canistech_gold_memberships_v2_hashed';
const LEGACY_GOLD_STORAGE_KEY = 'canistech_gold_memberships_v1';
const ACCOUNTS_REGISTRY_KEY = 'canistech_accounts_registry_v3';
const LGPD_CONSENT_STORAGE_KEY = 'canistech_lgpd_consent_v1';

export const LGPD_POLICY_VERSION = 'v2026.4-LGPD-CFMV-CDC';

export const DPO_CONTACT_INFO = {
  dpoName: 'Comitê de Governança e Proteção de Dados CanisTech (DPO)',
  dpoEmail: 'dpo.privacidade@canistech.net.br',
  legalBasis: 'Art. 7º, I, Art. 8º e Art. 18 (Incisos I a IX) da Lei Federal nº 13.709/2018 (LGPD) e Art. 41 (Encarregado DPO)',
  slaResponse: 'Atendimento imediato para Portabilidade/Exclusão automatizada e até 15 dias para requisições formais (Art. 19, II LGPD)',
};

export interface GoldMembershipRecord {
  email: string;
  userName: string;
  /** Hash SHA-256 da credencial (NUNCA persiste senha em texto puro no localStorage) */
  accessPasswordHash: string;
  /** Campo efêmero retornado apenas em memória no instante da geração para cópia única pelo tutor */
  accessPassword?: string;
  donationAmountBrl: number;
  activatedAt: string;
  expiresAt: string;
  isUnlockedWithPassword: boolean;
  status: 'active' | 'expired' | 'voluntarily_left';
}

export interface GoldSlotsSummary {
  maxSlots: number;
  activeCount: number;
  remainingSlots: number;
  isFull: boolean;
  activeMembers: GoldMembershipRecord[];
  totalGoldDonations: number;
  totalDonationsBrl: number;
}

export interface UserGoldStatus {
  record: GoldMembershipRecord | null;
  isActive: boolean;
  isUnlocked: boolean;
  daysRemaining: number;
  isSeniorBypass: boolean;
}

function hashGoldCredentialSync(email: string, rawToken: string): string {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedToken = rawToken.trim().toUpperCase();
  return computeSha256HexSync(`GOLD_CREDENTIAL::${normalizedEmail}::${normalizedToken}::CANISTECH_SALT_V2`);
}

export async function hashGoldCredentialWebCrypto(email: string, rawToken: string): Promise<string> {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedToken = rawToken.trim().toUpperCase();
  return computeSha256Hex(`GOLD_CREDENTIAL::${normalizedEmail}::${normalizedToken}::CANISTECH_SALT_V2`);
}

function loadRawMemberships(): GoldMembershipRecord[] {
  try {
    // Migra e purga qualquer registro legado que continha texto puro
    const legacyRaw = localStorage.getItem(LEGACY_GOLD_STORAGE_KEY);
    if (legacyRaw) {
      localStorage.removeItem(LEGACY_GOLD_STORAGE_KEY);
    }

    const raw = localStorage.getItem(GOLD_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GoldMembershipRecord[];
    // Garante que nenhuma senha em texto puro permaneça em objetos carregados
    return parsed.map((item) => {
      const { accessPassword: _removedPlaintext, ...safeRest } = item;
      return safeRest;
    });
  } catch {
    return [];
  }
}

function saveRawMemberships(list: GoldMembershipRecord[]): void {
  try {
    // Sanitiza e remove estritamente qualquer campo accessPassword antes de gravar no localStorage
    const sanitizedForStorage = list.map((item) => {
      const { accessPassword: _neverStorePlaintext, ...rest } = item;
      return {
        ...rest,
        email: sanitizeSafeDisplay(rest.email).toLowerCase().trim(),
        userName: sanitizeSafeDisplay(rest.userName),
      };
    });
    localStorage.setItem(GOLD_STORAGE_KEY, JSON.stringify(sanitizedForStorage));
  } catch (e) {
    console.error('Erro ao salvar registros Gold:', e);
  }
}

// Atualiza automaticamente quem já passou de 3 meses (90 dias) e calcula vagas restantes
export function getGoldSlotsSummary(): GoldSlotsSummary {
  const now = Date.now();
  const list = loadRawMemberships();
  let changed = false;

  const updated = list.map((item) => {
    if (item.status === 'active' && new Date(item.expiresAt).getTime() <= now) {
      changed = true;
      return { ...item, status: 'expired' as const, isUnlockedWithPassword: false };
    }
    return item;
  });

  if (changed) {
    saveRawMemberships(updated);
  }

  const activeMembers = updated.filter((m) => m.status === 'active');
  const activeCount = activeMembers.length;
  const remainingSlots = Math.max(0, MAX_GOLD_SLOTS - activeCount);
  const totalGoldDonations = updated.reduce((acc, cur) => acc + (cur.donationAmountBrl || 0), 0);

  return {
    maxSlots: MAX_GOLD_SLOTS,
    activeCount,
    remainingSlots,
    isFull: remainingSlots === 0,
    activeMembers,
    totalGoldDonations,
    totalDonationsBrl: totalGoldDonations,
  };
}

export function getUserGoldStatus(email?: string | null): UserGoldStatus {
  if (!email) return { record: null, isActive: false, isUnlocked: false, daysRemaining: 0, isSeniorBypass: false };
  const normalized = email.toLowerCase().trim();

  // Preserva bypass para contas de Administrador Sênior usando apenas hash SHA-256 (zero senha em texto puro)
  if (isSeniorAdmin(normalized)) {
    const adminBypassHash = computeSha256HexSync(`SENIOR_ADMIN_BYPASS::${normalized}`);
    return {
      record: {
        email: normalized,
        userName: 'Administrador Sênior',
        accessPasswordHash: adminBypassHash,
        donationAmountBrl: 0,
        activatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + GOLD_DURATION_DAYS * 86400000).toISOString(),
        isUnlockedWithPassword: true,
        status: 'active' as const,
      },
      isActive: true,
      isUnlocked: true,
      daysRemaining: GOLD_DURATION_DAYS,
      isSeniorBypass: true,
    };
  }

  const { activeMembers } = getGoldSlotsSummary();
  const record = activeMembers.find((m) => m.email === normalized) || null;

  if (!record) {
    return { record: null, isActive: false, isUnlocked: false, daysRemaining: 0, isSeniorBypass: false };
  }

  const diffMs = new Date(record.expiresAt).getTime() - Date.now();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return {
    record,
    isActive: true,
    isUnlocked: record.isUnlockedWithPassword,
    daysRemaining,
    isSeniorBypass: false,
  };
}

export function issueGoldPasswordAfterDonation(
  email: string,
  userName: string,
  amountBrl: number
): GoldMembershipRecord {
  const normalized = email.toLowerCase().trim();
  const summary = getGoldSlotsSummary();
  const existingActive = summary.activeMembers.find((m) => m.email === normalized);

  if (!existingActive && summary.remainingSlots <= 0) {
    throw new Error(
      'Limite máximo de 200 usuários Gold atingido no momento. Aguarde a liberação de uma vaga.'
    );
  }

  if (isNaN(amountBrl) || amountBrl <= 0) {
    throw new Error('Informe um valor de doação espontânea válido para gerar sua senha de acesso.');
  }

  // Geração criptográfica de bytes aleatórios via Web Crypto API
  const randomBytes = new Uint8Array(4);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(randomBytes);
  }
  const randomCode = Array.from(randomBytes)
    .map((b) => b.toString(36).padStart(2, '0'))
    .join('')
    .substring(0, 6)
    .toUpperCase();

  const oneTimePlaintextToken = `GOLD-${randomCode}`;
  const accessPasswordHash = hashGoldCredentialSync(normalized, oneTimePlaintextToken);
  const now = new Date();
  const expires = new Date(now.getTime() + GOLD_DURATION_DAYS * 24 * 60 * 60 * 1000);

  const persistentRecord: GoldMembershipRecord = {
    email: normalized,
    userName: sanitizeSafeDisplay(userName),
    accessPasswordHash,
    donationAmountBrl: Number(amountBrl),
    activatedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    isUnlockedWithPassword: false,
    status: 'active',
  };

  const all = loadRawMemberships().filter(
    (m) => !(m.email === normalized && m.status === 'active')
  );
  all.unshift(persistentRecord);
  saveRawMemberships(all);

  // Confirmação assíncrona via Web Crypto API nativa (crypto.subtle.digest('SHA-256', ...))
  void hashGoldCredentialWebCrypto(normalized, oneTimePlaintextToken).then((webCryptoDigest) => {
    const currentList = loadRawMemberships();
    const targetIdx = currentList.findIndex((m) => m.email === normalized && m.status === 'active');
    if (targetIdx >= 0) {
      currentList[targetIdx].accessPasswordHash = webCryptoDigest;
      saveRawMemberships(currentList);
    }
  });

  // Retorna o token em memória APENAS para exibição única na UI (não fica salvo no localStorage)
  return {
    ...persistentRecord,
    accessPassword: oneTimePlaintextToken,
  };
}

export function validateGoldPassword(email: string, inputPassword: string): boolean {
  const normalized = email.toLowerCase().trim();
  const cleanPass = inputPassword.trim().toUpperCase();
  const list = loadRawMemberships();

  // Bypass para administradores sêniores
  if (isSeniorAdmin(normalized)) {
    return true;
  }

  const candidateHash = hashGoldCredentialSync(normalized, cleanPass);

  const idx = list.findIndex(
    (m) =>
      m.email === normalized &&
      m.status === 'active' &&
      m.accessPasswordHash === candidateHash
  );

  if (idx === -1) return false;

  list[idx].isUnlockedWithPassword = true;
  saveRawMemberships(list);
  return true;
}

export async function validateGoldPasswordWebCrypto(email: string, inputPassword: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  if (isSeniorAdmin(normalized)) return true;

  const candidateHash = await hashGoldCredentialWebCrypto(normalized, inputPassword);
  const list = loadRawMemberships();
  const idx = list.findIndex(
    (m) => m.email === normalized && m.status === 'active' && m.accessPasswordHash === candidateHash
  );
  if (idx === -1) return false;

  list[idx].isUnlockedWithPassword = true;
  saveRawMemberships(list);
  return true;
}

// ==========================================
// GESTÃO DE CONSENTIMENTO LGPD (ART. 7º e 8º)
// ==========================================
export function getLgpdConsent(email?: string | null): LgpdConsentRecord | null {
  try {
    const key = email
      ? `${LGPD_CONSENT_STORAGE_KEY}_${email.toLowerCase().trim()}`
      : `${LGPD_CONSENT_STORAGE_KEY}_device`;
    const raw = localStorage.getItem(key) || localStorage.getItem(`${LGPD_CONSENT_STORAGE_KEY}_device`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LgpdConsentRecord;
    if (!parsed.accepted || !parsed.consentHash) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveLgpdConsentWithWebCrypto(email?: string | null): Promise<LgpdConsentRecord> {
  const timestamp = new Date().toISOString();
  const normalizedEmail = email ? sanitizeSafeDisplay(email).toLowerCase().trim() : 'titular-local-device';
  const payload = `LGPD_CONSENT::${normalizedEmail}::${LGPD_POLICY_VERSION}::${timestamp}::LEI_13709_2018`;
  const digest = await computeSha256Hex(payload);
  const consentHash = `LGPD-SHA256-${digest.substring(0, 24).toUpperCase()}`;

  const record: LgpdConsentRecord = {
    accepted: true,
    timestamp,
    policyVersion: LGPD_POLICY_VERSION,
    consentHash,
    userEmail: normalizedEmail,
  };

  try {
    localStorage.setItem(`${LGPD_CONSENT_STORAGE_KEY}_device`, JSON.stringify(record));
    if (email) {
      localStorage.setItem(`${LGPD_CONSENT_STORAGE_KEY}_${normalizedEmail}`, JSON.stringify(record));
    }
    logAuditEvent({
      userEmail: normalizedEmail,
      action: 'LGPD_CONSENT_GRANTED',
      provider: 'system',
      ipMock: '127.0.0.1 (LGPD Art. 8 Gate)',
      status: 'SUCCESS',
      details: `Consentimento explícito registrado (${LGPD_POLICY_VERSION}) • Hash: ${consentHash}`,
    });
  } catch (e) {
    console.error('Erro ao salvar consentimento LGPD:', e);
  }

  return record;
}

// Permite ao usuário sair quando quiser, liberando a vaga para outro
export function leaveGoldClubAndReleaseSlot(email: string): void {
  const normalized = email.toLowerCase().trim();
  const list = loadRawMemberships().map((m) =>
    m.email === normalized && m.status === 'active'
      ? { ...m, status: 'voluntarily_left' as const, isUnlockedWithPassword: false }
      : m
  );
  saveRawMemberships(list);
}

// Progresso de módulos de adestramento dominados pelo usuário
export function getTrainingProgress(email: string): string[] {
  try {
    const raw = localStorage.getItem(`canistech_training_progress_${email.trim().toLowerCase()}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTrainingProgress(email: string, stepIds: string[]): void {
  try {
    localStorage.setItem(
      `canistech_training_progress_${email.trim().toLowerCase()}`,
      JSON.stringify(stepIds)
    );
  } catch (e) {
    console.error('Erro ao salvar progresso de treino:', e);
  }
}

// Portabilidade LGPD (Art. 18, V): Baixa todos os dados que o usuário cadastrou na plataforma
export function exportAllUserDataJson(email: string): void {
  const normalized = email.toLowerCase().trim();
  const vaultRaw = localStorage.getItem(`canistech_vault_${normalized}`);
  const goldStatus = getUserGoldStatus(normalized);
  const accounts = getRegisteredAccounts().filter((a) => a.email === normalized);
  const lgpdConsent = getLgpdConsent(normalized);
  const trainingProgress = getTrainingProgress(normalized);

  const exportBundle = {
    exportedAt: new Date().toISOString(),
    platform: 'CanisTech Digital Systems • DogOS',
    regulatoryCompliance: {
      law: 'Lei Federal nº 13.709/2018 (LGPD - Art. 18, V - Portabilidade de Dados)',
      dpoContact: DPO_CONTACT_INFO,
      lgpdConsentRecord: lgpdConsent,
    },
    ownerEmail: normalized,
    accountProfile: accounts[0] || null,
    goldMembership: goldStatus.record,
    trainingProgressModules: trainingProgress,
    dogOsVault: vaultRaw ? JSON.parse(vaultRaw) : null,
  };

  const blob = new Blob([JSON.stringify(exportBundle, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Meus_Dados_CanisTech_${normalized.replace(/[^a-z0-9]/g, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Direito ao Esquecimento LGPD (Art. 18, VI): Retira todos os dados do usuário da plataforma e libera vaga
export function purgeAllUserDataFromPlatform(email: string): boolean {
  const normalized = email.toLowerCase().trim();

  // Blindagem Sênior: impede autoexclusão de credenciais mestres
  if (isSeniorAdmin(normalized)) {
    throw new Error('Contas de Administrador Sênior são blindadas contra autoexclusão de emergência.');
  }

  // 1. Libera vaga Gold e remove histórico Gold do titular
  const goldList = loadRawMemberships().filter((m) => m.email !== normalized);
  saveRawMemberships(goldList);

  // 2. Remove cofre de cães, vacinas, pesagens e atividades
  localStorage.removeItem(`canistech_vault_${normalized}`);
  localStorage.removeItem(`${LGPD_CONSENT_STORAGE_KEY}_${normalized}`);

  // 3. Remove progressos e certificados de adestramento vinculados
  Object.keys(localStorage).forEach((key) => {
    if (
      key.startsWith('canistech_training_progress_') ||
      key.startsWith('canistech_training_cert_') ||
      key.startsWith('canistech_dog_photo_')
    ) {
      if (key.includes(normalized)) {
        localStorage.removeItem(key);
      }
    }
  });

  // 4. Remove do registro de contas cadastradas
  try {
    const accounts = getRegisteredAccounts().filter((a) => a.email !== normalized);
    localStorage.setItem(ACCOUNTS_REGISTRY_KEY, JSON.stringify(accounts));
  } catch {}

  // 5. Encerra a sessão ativa
  clearUserSession();

  return true;
}

// ==========================================
// CERTIFICADOS DE CONCLUSÃO DE ADESTRAMENTO
// ==========================================
export function generateTrainingCertificateAuthCode(seed?: string): string {
  const rawSeed = `${seed || Date.now()}::${performance.now()}::CANISTECH-CERT-SHA256`;
  const digest = computeSha256HexSync(rawSeed).toUpperCase();
  return `CERT-CT-2026-${digest.slice(0, 4)}-${digest.slice(4, 8)}`;
}

export function saveTrainingCertificate(cert: TrainingCertificateRecord): void {
  try {
    const sanitizedCert: TrainingCertificateRecord = {
      ...cert,
      dogName: sanitizeSafeDisplay(cert.dogName),
      dogBreed: sanitizeSafeDisplay(cert.dogBreed),
      tutorName: sanitizeSafeDisplay(cert.tutorName),
      tutorEmail: sanitizeSafeDisplay(cert.tutorEmail),
    };
    const key = `canistech_training_cert_${sanitizedCert.tutorEmail.trim().toLowerCase()}_${sanitizedCert.dogId}`;
    localStorage.setItem(key, JSON.stringify(sanitizedCert));
  } catch (e) {
    console.error('Erro ao salvar certificado de treino:', e);
  }
}

export function getTrainingCertificate(email: string, dogId: string): TrainingCertificateRecord | null {
  try {
    const key = `canistech_training_cert_${email.trim().toLowerCase()}_${dogId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export { sanitizeXss, sanitizeSafeDisplay };

