import { AuthUser, AuthProvider, RegisteredAccount, SecurityAuditLog } from '../types';

const STORAGE_KEY = 'canistech_auth_user_session';
const ACCOUNTS_STORAGE_KEY = 'canistech_accounts_registry_v3';
const AUDIT_STORAGE_KEY = 'canistech_security_audit_logs';

// =========================================================================
// SANITIZADOR XSS & CRIPTOGRAFIA NATIVA WEB CRYPTO API (SHA-256)
// =========================================================================

/**
 * Sanitizador contra ataques XSS (Cross-Site Scripting).
 * Escapa estritamente <, >, &, ", ' em strings de texto livre antes de
 * armazenar ou renderizar em tela, SVG ou PDF.
 */
export function sanitizeXss(input?: string | null): string {
  if (input === null || input === undefined) return '';
  const str = String(input);
  // Desfaz escapes prévios para evitar dupla codificação e aplica escape estrito
  const unescaped = str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');

  return unescaped
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitiza texto para exibição segura em componentes React / PDF (jsPDF),
 * removendo tags/scripts maliciosos e escapando < e > enquanto preserva
 * acentuação e leitura limpa em documentos oficiais.
 */
export function sanitizeSafeDisplay(input?: string | null): string {
  if (input === null || input === undefined) return '';
  const sanitized = sanitizeXss(input);
  return sanitized
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

/**
 * Implementação determinística síncrona FIPS 180-4 SHA-256 (produz o mesmo digest de 64 chars hex da Web Crypto API).
 * Usada como motor síncrono imediato em conjunto com crypto.subtle.digest('SHA-256', ...).
 */
export function computeSha256HexSync(message: string): string {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  const rotr = (n: number, x: number) => (x >>> n) | (x << (32 - n));
  const bytes = new TextEncoder().encode(message);
  const bitLen = bytes.length * 8;

  const padLen = ((bytes.length + 9 + 63) & ~63);
  const padded = new Uint8Array(padLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(padLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(padLen - 4, bitLen >>> 0, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const W = new Uint32Array(64);

  for (let offset = 0; offset < padLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      W[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(7, W[i - 15]) ^ rotr(18, W[i - 15]) ^ (W[i - 15] >>> 3);
      const s1 = rotr(17, W[i - 2]) ^ rotr(19, W[i - 2]) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + W[i]) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return `${toHex(h0)}${toHex(h1)}${toHex(h2)}${toHex(h3)}${toHex(h4)}${toHex(h5)}${toHex(h6)}${toHex(h7)}`;
}

/**
 * Hashing criptográfico real via Web Crypto API nativa (crypto.subtle.digest('SHA-256', ...)).
 * Utilizado para validação de credenciais, consentimento LGPD e assinatura de documentos oficiais.
 */
export async function computeSha256Hex(message: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return computeSha256HexSync(message);
}

/**
 * Assina o Hash de Segurança da Cédula RGC ou Carteiras de Vacinação via Web Crypto API (SHA-256).
 */
export async function signDocumentSecurityHashAsync(
  docType: 'RGC' | 'BOOKLET',
  dogId: string,
  microchip: string,
  issuedAt: string
): Promise<string> {
  const payload = `${docType}::${dogId}::${microchip}::${issuedAt}::CANISTECH-SHA256-V2`;
  const digest = await computeSha256Hex(payload);
  const upper = digest.toUpperCase();
  const prefix = docType === 'RGC' ? 'SEC-CT' : 'VAC-CT';
  return `${prefix}-${upper.slice(0, 4)}-${upper.slice(4, 8)}-${upper.slice(8, 12)}`;
}

/**
 * Versão síncrona SHA-256 para renderização imediata em tela/PDF (produz o mesmo hash SHA-256).
 */
export function signDocumentSecurityHashSync(
  docType: 'RGC' | 'BOOKLET',
  dogId: string,
  microchip: string,
  issuedAt: string
): string {
  const payload = `${docType}::${dogId}::${microchip}::${issuedAt}::CANISTECH-SHA256-V2`;
  const digest = computeSha256HexSync(payload).toUpperCase();
  const prefix = docType === 'RGC' ? 'SEC-CT' : 'VAC-CT';
  return `${prefix}-${digest.slice(0, 4)}-${digest.slice(4, 8)}-${digest.slice(8, 12)}`;
}

/**
 * Contas estritas com privilégios de Administrador Sênior (Exclusivo Master)
 */
export const SENIOR_ADMIN_EMAILS: string[] = ['instrutorleonardosenai@gmail.com', 'divulgacaolivro2026@gmail.com'];

/**
 * Validação de privilégios de Administrador Sênior
 */
export function isSeniorAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return SENIOR_ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === normalized);
}

export const DEFAULT_GOOGLE_ACCOUNTS = [
  {
    name: 'Instrutor Leonardo (Admin)',
    email: 'instrutorleonardosenai@gmail.com',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    role: 'admin' as const,
  },
];

const INITIAL_REGISTERED_ACCOUNTS: RegisteredAccount[] = [
  {
    id: 'usr-admin-master',
    name: 'Instrutor Leonardo (Admin)',
    email: 'instrutorleonardosenai@gmail.com',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    provider: 'google',
    role: 'admin',
    createdAt: '2026-01-15T08:00:00.000Z',
    lastLoginAt: '2026-10-19T09:00:00.000Z',
    loginCount: 1,
    isSeniorAdmin: true,
    status: 'active',
  },
];

/**
 * Obtém os logs de auditoria de segurança persistidos localmente
 */
export function getAuditLogs(): SecurityAuditLog[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SecurityAuditLog[];
  } catch (e) {
    console.error('Erro ao ler logs de auditoria:', e);
    return [];
  }
}

/**
 * Registra um evento no log de auditoria de segurança (estritamente local)
 */
export function logAuditEvent(entry: Omit<SecurityAuditLog, 'id' | 'timestamp'>): void {
  try {
    const logs = getAuditLogs();
    const newEntry: SecurityAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    const updated = [newEntry, ...logs].slice(0, 200); // mantém últimos 200 eventos
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Erro ao registrar log de auditoria:', e);
  }
}

/**
 * Obtém todas as contas cadastradas na plataforma (estritamente local)
 */
export function getRegisteredAccounts(): RegisteredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(INITIAL_REGISTERED_ACCOUNTS));
      return INITIAL_REGISTERED_ACCOUNTS;
    }
    return JSON.parse(raw) as RegisteredAccount[];
  } catch (e) {
    console.error('Erro ao carregar contas registradas:', e);
    return INITIAL_REGISTERED_ACCOUNTS;
  }
}

/**
 * Registra ou atualiza uma conta autenticada no catálogo local
 */
export function recordUserLogin(user: AuthUser): void {
  try {
    const accounts = getRegisteredAccounts();
    const existingIndex = accounts.findIndex(
      (a) => a.email.toLowerCase() === user.email.toLowerCase()
    );

    const isSenior = isSeniorAdmin(user.email);
    const resolvedRole = isSenior ? 'admin' : user.role || 'tutor';

    if (existingIndex >= 0) {
      const existing = accounts[existingIndex];
      accounts[existingIndex] = {
        ...existing,
        name: user.name || existing.name,
        photoUrl: user.photoUrl || existing.photoUrl,
        lastLoginAt: new Date().toISOString(),
        loginCount: (existing.loginCount || 1) + 1,
        isSeniorAdmin: isSenior,
        role: resolvedRole,
      };
    } else {
      const newAccount: RegisteredAccount = {
        id: user.id || `usr-${Date.now()}`,
        name: user.name,
        email: user.email,
        photoUrl: user.photoUrl,
        provider: user.provider,
        role: resolvedRole,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        loginCount: 1,
        isSeniorAdmin: isSenior,
        status: 'active',
      };
      accounts.unshift(newAccount);
    }

    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Erro ao registrar conta de usuário:', e);
  }
}

/**
 * Exclui uma conta de usuário comum do catálogo e seu cofre de dados DogOS
 * Impede a exclusão das contas sêniores homologadas
 */
export function deleteUserAccount(email: string): boolean {
  try {
    if (!email || isSeniorAdmin(email)) {
      logAuditEvent({
        userEmail: email || 'desconhecido',
        action: 'ACCOUNT_DELETE_BLOCKED',
        provider: 'system',
        ipMock: '127.0.0.1 (Security Shield)',
        status: 'DENIED',
        details: `Exclusão bloqueada: a conta ${email} possui privilégios de Administrador Sênior protegidos por governança.`,
      });
      return false;
    }

    const accounts = getRegisteredAccounts();
    const updated = accounts.filter((a) => a.email.toLowerCase() !== email.toLowerCase());
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updated));

    // Exclui o cofre de dados associado a este e-mail
    const vaultKey = `canistech_vault_${email.toLowerCase().trim()}`;
    localStorage.removeItem(vaultKey);

    logAuditEvent({
      userEmail: email,
      action: 'ACCOUNT_DELETED_BY_ADMIN',
      provider: 'system',
      ipMock: '127.0.0.1 (Admin Security Console)',
      status: 'SUCCESS',
      details: `Conta ${email} e seu cofre de dados DogOS foram excluídos permanentemente pelo Administrador Sênior.`,
    });

    return true;
  } catch (e) {
    console.error('Erro ao excluir conta de usuário:', e);
    return false;
  }
}

/**
 * Atualiza o status de uma conta (ex: ativo/suspenso)
 */
export function updateAccountStatus(email: string, status: 'active' | 'suspended'): void {
  try {
    const accounts = getRegisteredAccounts();
    const updated = accounts.map((acc) =>
      acc.email.toLowerCase() === email.toLowerCase() ? { ...acc, status } : acc
    );
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updated));
    logAuditEvent({
      userEmail: email,
      action: status === 'active' ? 'ACCOUNT_REACTIVATED' : 'ACCOUNT_SUSPENDED',
      provider: 'system',
      ipMock: '127.0.0.1 (Localhost Shield)',
      status: 'SUCCESS',
      details: `Status da conta ${email} alterado para ${status}`,
    });
  } catch (e) {
    console.error('Erro ao alterar status da conta:', e);
  }
}

/**
 * Recupera a sessão ativa do usuário no localStorage
 */
export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as AuthUser;
    // Garante que privilégio sênior reflita a regra oficial
    if (isSeniorAdmin(user.email)) {
      user.role = 'admin';
    }
    return user;
  } catch (e) {
    console.error('Erro ao carregar sessão ativa:', e);
    return null;
  }
}

/**
 * Salva a sessão autenticada no localStorage com assinatura SHA-256 (Web Crypto API) e registra auditoria
 */
export function saveUserSession(user: AuthUser): void {
  try {
    const safeUser: AuthUser = {
      ...user,
      name: sanitizeSafeDisplay(user.name),
      email: sanitizeSafeDisplay(user.email).trim(),
      role: isSeniorAdmin(user.email) ? 'admin' : user.role,
      accessToken: computeSha256HexSync(`${user.email}::${user.provider}::${user.lastLoginAt}::SESSION`),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
    recordUserLogin(safeUser);

    // Assinatura assíncrona via Web Crypto API nativa (crypto.subtle.digest('SHA-256', ...))
    void computeSha256Hex(`${safeUser.email}::${safeUser.provider}::${safeUser.lastLoginAt}::SESSION`).then(
      (digest) => {
        try {
          const current = getCurrentUser();
          if (current && current.email.toLowerCase() === safeUser.email.toLowerCase()) {
            current.accessToken = `sha256:${digest}`;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
          }
        } catch {
          // fallback silencioso
        }
      }
    );

    logAuditEvent({
      userEmail: safeUser.email,
      action: 'AUTH_SESSION_ESTABLISHED',
      provider: safeUser.provider,
      ipMock: '189.40.112.45 (CanisTech Network)',
      status: 'SUCCESS',
      details: `Sessão iniciada via ${safeUser.provider.toUpperCase()} com hash SHA-256 (${safeUser.role === 'admin' ? 'Sênior Admin' : 'Tutor'})`,
    });
  } catch (e) {
    console.error('Erro ao salvar sessão de usuário:', e);
  }
}

/**
 * Encerra a sessão do usuário (Logout)
 */
export function clearUserSession(): void {
  try {
    const current = getCurrentUser();
    if (current) {
      logAuditEvent({
        userEmail: current.email,
        action: 'AUTH_LOGOUT',
        provider: current.provider,
        ipMock: '189.40.112.45 (Local Session)',
        status: 'SUCCESS',
        details: 'Logout executado pelo usuário',
      });
    }
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Erro ao encerrar sessão:', e);
  }
}

/**
 * Autentica o usuário via Google com controle de privilégios sênior e hash SHA-256
 */
export function loginWithGoogle(params?: {
  name?: string;
  email?: string;
  photoUrl?: string;
}): AuthUser {
  const email = sanitizeSafeDisplay(params?.email || 'instrutorleonardosenai@gmail.com').trim();
  const isSenior = isSeniorAdmin(email);
  const nowIso = new Date().toISOString();

  const user: AuthUser = {
    id: `usr-google-${Date.now()}`,
    name: sanitizeSafeDisplay(params?.name || (isSenior ? 'Instrutor Leonardo (Admin)' : email.split('@')[0])),
    email: email,
    photoUrl: params?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    provider: 'google',
    role: isSenior ? 'admin' : 'tutor',
    createdAt: nowIso,
    lastLoginAt: nowIso,
    accessToken: `sha256:${computeSha256HexSync(`google::${email}::${nowIso}`)}`,
  };

  saveUserSession(user);
  return user;
}

export function buildAuthUserFromSupabaseSession(session: Session): AuthUser {
  const sbUser = session.user;
  const meta = (sbUser.user_metadata || {}) as Record<string, any>;
  const email = String(sbUser.email || meta.email || '').trim().toLowerCase();
  const nowIso = new Date().toISOString();
  const isSenior = meta.email_verified !== false && isSeniorAdmin(email);

  return {
    id: sbUser.id,
    name: sanitizeSafeDisplay(meta.full_name || meta.name || email.split('@')[0]),
    email,
    photoUrl: meta.avatar_url || meta.picture || '',
    provider: 'google',
    role: isSenior ? 'admin' : 'tutor',
    createdAt: sbUser.created_at || nowIso,
    lastLoginAt: nowIso,
    accessToken: '',
  };
}
