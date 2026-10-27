import { AuthUser, AuthProvider, RegisteredAccount, SecurityAuditLog } from '../types';

const STORAGE_KEY = 'canistech_auth_user_session';
const ACCOUNTS_STORAGE_KEY = 'canistech_accounts_registry_v3';
const AUDIT_STORAGE_KEY = 'canistech_security_audit_logs';

/**
 * Contas estritas com privilégios de Administrador Sênior
 */
export const SENIOR_ADMIN_EMAILS = [
  'instrutorleonardosenai@gmail.com',
  'construtividade.design@gmail.com',
] as const;

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
    name: 'Administrador Sênior 01',
    email: 'instrutorleonardosenai@gmail.com',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    role: 'admin' as const,
  },
  {
    name: 'Administrador Sênior 02',
    email: 'construtividade.design@gmail.com',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
    role: 'admin' as const,
  },
];

export const DEFAULT_FACEBOOK_ACCOUNTS = [
  {
    name: 'Tutor Responsável CanisTech',
    email: 'tutor.corporativo@canistech.com.br',
    photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
    role: 'tutor' as const,
  },
];

const INITIAL_REGISTERED_ACCOUNTS: RegisteredAccount[] = [
  {
    id: 'usr-admin-1',
    name: 'Administrador Sênior 01',
    email: 'instrutorleonardosenai@gmail.com',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    provider: 'google',
    role: 'admin',
    createdAt: '2026-01-15T08:00:00.000Z',
    lastLoginAt: '2026-10-19T09:00:00.000Z',
    loginCount: 42,
    isSeniorAdmin: true,
    status: 'active',
  },
  {
    id: 'usr-admin-2',
    name: 'Administrador Sênior 02',
    email: 'construtividade.design@gmail.com',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
    provider: 'google',
    role: 'admin',
    createdAt: '2026-01-10T10:30:00.000Z',
    lastLoginAt: '2026-10-19T08:45:00.000Z',
    loginCount: 68,
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
 * Salva a sessão autenticada no localStorage e registra auditoria
 */
export function saveUserSession(user: AuthUser): void {
  try {
    if (isSeniorAdmin(user.email)) {
      user.role = 'admin';
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    recordUserLogin(user);
    logAuditEvent({
      userEmail: user.email,
      action: 'AUTH_SESSION_ESTABLISHED',
      provider: user.provider,
      ipMock: '189.40.112.45 (CanisTech Network)',
      status: 'SUCCESS',
      details: `Sessão iniciada via ${user.provider.toUpperCase()} (${user.role === 'admin' ? 'Sênior Admin' : 'Tutor'})`,
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
 * Autentica o usuário via Google com controle de privilégios sênior
 */
export function loginWithGoogle(params?: {
  name?: string;
  email?: string;
  photoUrl?: string;
}): AuthUser {
  const account = DEFAULT_GOOGLE_ACCOUNTS[0];
  const email = params?.email || account.email;
  const isSenior = isSeniorAdmin(email);

  const user: AuthUser = {
    id: `usr-google-${Date.now()}`,
    name: params?.name || account.name,
    email: email,
    photoUrl: params?.photoUrl || account.photoUrl,
    provider: 'google',
    role: isSenior ? 'admin' : 'tutor',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    accessToken: `ya29.canistech-shielded-token-${Math.random().toString(36).substring(2, 12)}`,
  };

  saveUserSession(user);
  return user;
}

/**
 * Autentica o usuário via Facebook com controle de privilégios sênior
 */
export function loginWithFacebook(params?: {
  name?: string;
  email?: string;
  photoUrl?: string;
}): AuthUser {
  const account = DEFAULT_FACEBOOK_ACCOUNTS[0];
  const email = params?.email || account.email;
  const isSenior = isSeniorAdmin(email);

  const user: AuthUser = {
    id: `usr-fb-${Date.now()}`,
    name: params?.name || account.name,
    email: email,
    photoUrl: params?.photoUrl || account.photoUrl,
    provider: 'facebook',
    role: isSenior ? 'admin' : 'tutor',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    accessToken: `EAAB.canistech-shielded-token-${Math.random().toString(36).substring(2, 12)}`,
  };

  saveUserSession(user);
  return user;
}
