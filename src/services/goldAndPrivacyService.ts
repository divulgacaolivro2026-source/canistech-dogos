// Caminho: src/services/goldAndPrivacyService.ts
import { clearUserSession, getRegisteredAccounts, isSeniorAdmin } from './authService';
import { TrainingCertificateRecord } from '../types';

export const MAX_GOLD_SLOTS = 200;
export const GOLD_DURATION_DAYS = 90; // 3 meses de validade
const GOLD_STORAGE_KEY = 'canistech_gold_memberships_v1';
const ACCOUNTS_REGISTRY_KEY = 'canistech_accounts_registry_v3';

export interface GoldMembershipRecord {
  email: string;
  userName: string;
  accessPassword: string;
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

function loadRawMemberships(): GoldMembershipRecord[] {
  try {
    const raw = localStorage.getItem(GOLD_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRawMemberships(list: GoldMembershipRecord[]): void {
  try {
    localStorage.setItem(GOLD_STORAGE_KEY, JSON.stringify(list));
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

  // Preserva bypass para contas de Administrador Sênior
  if (isSeniorAdmin(normalized)) {
    return {
      record: {
        email: normalized,
        userName: 'Administrador Sênior',
        accessPassword: 'GOLD-MASTER-ADMIN',
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

  const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const accessPassword = `GOLD-${randomCode}`;
  const now = new Date();
  const expires = new Date(now.getTime() + GOLD_DURATION_DAYS * 24 * 60 * 60 * 1000);

  const newRecord: GoldMembershipRecord = {
    email: normalized,
    userName,
    accessPassword,
    donationAmountBrl: Number(amountBrl),
    activatedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    isUnlockedWithPassword: false,
    status: 'active',
  };

  const all = loadRawMemberships().filter(
    (m) => !(m.email === normalized && m.status === 'active')
  );
  all.unshift(newRecord);
  saveRawMemberships(all);

  return newRecord;
}

export function validateGoldPassword(email: string, inputPassword: string): boolean {
  const normalized = email.toLowerCase().trim();
  const cleanPass = inputPassword.trim().toUpperCase();
  const list = loadRawMemberships();

  // Bypass para administradores sêniores
  if (isSeniorAdmin(normalized)) {
    return true;
  }

  const idx = list.findIndex(
    (m) =>
      m.email === normalized &&
      m.status === 'active' &&
      m.accessPassword.toUpperCase() === cleanPass
  );

  if (idx === -1) return false;

  list[idx].isUnlockedWithPassword = true;
  saveRawMemberships(list);
  return true;
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

// Portabilidade LGPD: Baixa todos os dados que o usuário cadastrou na plataforma
export function exportAllUserDataJson(email: string): void {
  const normalized = email.toLowerCase().trim();
  const vaultRaw = localStorage.getItem(`canistech_vault_${normalized}`);
  const goldStatus = getUserGoldStatus(normalized);
  const accounts = getRegisteredAccounts().filter((a) => a.email === normalized);

  const exportBundle = {
    exportedAt: new Date().toISOString(),
    platform: 'CanisTech Digital Systems',
    ownerEmail: normalized,
    accountProfile: accounts[0] || null,
    goldMembership: goldStatus.record,
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

// Direito ao Esquecimento LGPD: Retira todos os dados do usuário da plataforma e libera vaga
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

  // 3. Remove progressos e certificados de adestramento vinculados
  Object.keys(localStorage).forEach((key) => {
    if (
      key.startsWith('canistech_training_progress_') ||
      key.startsWith('canistech_training_cert_')
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
export function generateTrainingCertificateAuthCode(): string {
  const chars = '0123456789ABCDEF';
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CERT-CT-2026-${part1}-${part2}`;
}

export function saveTrainingCertificate(cert: TrainingCertificateRecord): void {
  try {
    const key = `canistech_training_cert_${cert.tutorEmail.trim().toLowerCase()}_${cert.dogId}`;
    localStorage.setItem(key, JSON.stringify(cert));
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

