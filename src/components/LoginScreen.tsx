import React, { useState } from 'react';
import { AuthUser, AuthProvider } from '../types';
import {
  DEFAULT_GOOGLE_ACCOUNTS,
  DEFAULT_FACEBOOK_ACCOUNTS,
  loginWithGoogle,
  loginWithFacebook,
} from '../services/authService';
import { getGoldSlotsSummary } from '../services/goldAndPrivacyService';
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  HeartPulse,
  Dna,
  CalendarClock,
  FileText,
  AlertCircle,
  Sparkles,
  ArrowRight,
  UserCheck,
  X,
  Stethoscope,
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
  emergencyScanNotice?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  emergencyScanNotice,
}) => {
  const [selectedProviderModal, setSelectedProviderModal] = useState<AuthProvider | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [customEmail, setCustomEmail] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [showCustomForm, setShowCustomForm] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [goldSummary, setGoldSummary] = useState(() => getGoldSlotsSummary());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleQuickLoginGoogle = (account: typeof DEFAULT_GOOGLE_ACCOUNTS[0]) => {
    setIsLoading(true);
    showToast(`Autenticando via Google: ${account.email}...`);
    setTimeout(() => {
      const user = loginWithGoogle({
        name: account.name,
        email: account.email,
        photoUrl: account.photoUrl,
      });
      setIsLoading(false);
      setSelectedProviderModal(null);
      onLoginSuccess(user);
    }, 800);
  };

  const handleCustomGoogleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      showToast('Por favor, informe um e-mail do Google válido.');
      return;
    }
    setIsLoading(true);
    showToast(`Conectando conta Google: ${customEmail}...`);
    setTimeout(() => {
      const user = loginWithGoogle({
        name: customName || customEmail.split('@')[0],
        email: customEmail,
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      });
      setIsLoading(false);
      setSelectedProviderModal(null);
      onLoginSuccess(user);
    }, 800);
  };

  const handleQuickLoginFacebook = (account: typeof DEFAULT_FACEBOOK_ACCOUNTS[0]) => {
    setIsLoading(true);
    showToast(`Autenticando via Facebook: ${account.name}...`);
    setTimeout(() => {
      const user = loginWithFacebook({
        name: account.name,
        email: account.email,
        photoUrl: account.photoUrl,
      });
      setIsLoading(false);
      setSelectedProviderModal(null);
      onLoginSuccess(user);
    }, 800);
  };

  const handleCustomFacebookLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) {
      showToast('Por favor, informe seu e-mail ou telefone cadastrado no Facebook.');
      return;
    }
    setIsLoading(true);
    showToast(`Conectando conta Facebook: ${customEmail}...`);
    setTimeout(() => {
      const user = loginWithFacebook({
        name: customName || customEmail.split('@')[0],
        email: customEmail.includes('@') ? customEmail : `${customEmail}@facebook.com`,
        photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80',
      });
      setIsLoading(false);
      setSelectedProviderModal(null);
      onLoginSuccess(user);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-orange-500 selection:text-white">
      {/* Background Decorative Gradients, Panoramic Watermark & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"></div>
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20 dark:opacity-15 mix-blend-luminosity pointer-events-none"
        style={{ backgroundImage: `url('/dogs-panorama-bg.png')` }}
      ></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Minimal Navigation Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-orange-600/30">
            C
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white font-heading block leading-none">
              CanisTech
            </span>
            <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">
              DogOS Biometria & Histórico
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-full backdrop-blur-md">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Acesso Protegido • Gestão Cinófila</span>
        </div>
      </header>

      {/* Main Login Gate Content */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex-1 flex flex-col justify-center">
        {emergencyScanNotice && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/50 text-amber-200 flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/40">
                Acesso Restrito ao Dossiê de Emergência
              </span>
              <p className="text-xs sm:text-sm font-bold text-white">
                {emergencyScanNotice}
              </p>
            </div>
          </div>
        )}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Platform Presentation & Trust Bento */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-orange-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Plataforma de Gestão Cinófila e Biometria</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-heading tracking-tight leading-tight">
                SISTEMA INTEGRADO DE GESTÃO BIOMÉTRICA, BEM-ESTAR PREVENTIVO & HISTÓRICO DO PET
              </h1>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
                O <strong>CanisTech DogOS</strong> centraliza o histórico do seu animal, registro biométrico com emissão da Cédula RGC/CIN, controle inteligente de vacinas com avisos de 7 dias e mapeamento territorial por raça.
              </p>
            </div>

            {/* Bento Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xs space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-slate-200">Cédula RGC & Dossiê A4</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Emissão da Cédula de Identificação Canina (RGC/CIN) com QR code de autenticidade e dossiê de rotina do pet.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xs space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-slate-200">Alertas de Vacina 7d</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Notificações preventivas com 7 dias de antecedência para reforços vacinais e profilaxias periódicas.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xs space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Dna className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-slate-200">Biometria & Parâmetros</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Acompanhamento da curva de peso ideal, escore corporal e histórico alimentar preventivo.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xs space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-slate-200">Orientação & Bem-Estar</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Diretrizes de bem-estar, guia de toxicidade alimentar e rede de suporte credenciada.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Strict Google & Facebook Auth Card */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6 relative">
              {/* Badge */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
                    Acesso Obrigatório
                  </span>
                  <h2 className="text-xl font-bold text-white font-heading">
                    Entrar na Plataforma
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
                  OAuth 2.0 Seguro
                </span>
              </div>

              <div className="p-3.5 bg-slate-950/70 border border-slate-800/90 rounded-2xl text-xs text-slate-400 leading-relaxed flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  Para garantir o sigilo dos prontuários e o histórico médico dos pets, o acesso à plataforma é permitido <strong className="text-slate-200">exclusivamente via login com Google ou Facebook</strong>.
                </p>
              </div>

              {/* Painel de Telemetria em Tempo Real: Clube Gold de Adestramento (200 Vagas / 90 Dias) */}
              <div className="p-4 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold text-sm">⭐</span>
                    <div>
                      <h4 className="text-xs font-bold text-amber-300 tracking-tight">
                        Clube Gold de Adestramento
                      </h4>
                      <p className="text-[10px] text-slate-400 font-sans">
                        CanisTech Digital Systems
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      goldSummary.remainingSlots > 20
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : goldSummary.remainingSlots > 0
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-red-500/10 text-red-300 border-red-500/30'
                    }`}
                  >
                    {goldSummary.remainingSlots > 0
                      ? `${goldSummary.remainingSlots} vagas restantes`
                      : 'Lotação Máxima (200/200)'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-mono">
                    <span className="text-slate-300">
                      Usuários Ativos: <strong className="text-white font-bold">{goldSummary.activeCount}</strong> de {goldSummary.maxSlots}
                    </span>
                    <span className="text-amber-400 font-bold">
                      {Math.round((goldSummary.activeCount / goldSummary.maxSlots) * 100)}% ocupado
                    </span>
                  </div>

                  {/* Barra de Progresso Visual de Lotação */}
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700/60">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        goldSummary.remainingSlots > 40
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                          : goldSummary.remainingSlots > 10
                          ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                          : 'bg-gradient-to-r from-rose-500 to-red-500'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(4, (goldSummary.activeCount / goldSummary.maxSlots) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5 text-[10px] text-slate-400">
                  <span>⏱ Válido por 3 meses (90 dias)</span>
                  <span className="text-slate-400 font-medium">Liberação rotativa ao sair</span>
                </div>
              </div>

              {/* Main Provider Buttons */}
              <div className="space-y-3 pt-1">
                {/* 1. Official Google Login Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomForm(false);
                    setSelectedProviderModal('google');
                  }}
                  className="w-full flex items-center justify-center gap-3.5 bg-white hover:bg-slate-50 text-slate-900 font-semibold text-sm px-5 py-3.5 rounded-2xl shadow-md transition-all active:scale-[0.98] border border-slate-200 hover:border-slate-300 group cursor-pointer"
                >
                  {/* Official Google 'G' 4-Color SVG Logo */}
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="font-heading">Continuar com o Google</span>
                </button>

                {/* 2. Official Facebook Login Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomForm(false);
                    setSelectedProviderModal('facebook');
                  }}
                  className="w-full flex items-center justify-center gap-3.5 bg-[#1877F2] hover:bg-[#166fe5] text-white font-semibold text-sm px-5 py-3.5 rounded-2xl shadow-md transition-all active:scale-[0.98] border border-blue-600/40 cursor-pointer"
                >
                  {/* Official Facebook 'f' SVG Logo */}
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="font-heading">Continuar com o Facebook</span>
                </button>
              </div>

              {/* Quick direct selection shortcut for immediate access */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 block text-center">
                  Acesso rápido verificado para tutores CanisTech:
                </span>
                <div className="flex flex-col gap-2">
                  {DEFAULT_GOOGLE_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleQuickLoginGoogle(acc)}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 transition-colors flex items-center justify-between group text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={acc.photoUrl}
                          alt={acc.name}
                          className="w-7 h-7 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                            <span>{acc.name}</span>
                            {acc.role === 'admin' && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-mono">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {acc.email}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold group-hover:bg-slate-700 flex items-center gap-1">
                        <span>Google</span>
                        <ArrowRight className="w-3 h-3 text-orange-400" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Compliance & Security Footer */}
              <div className="pt-2 text-[10px] text-slate-500 text-center leading-relaxed">
                Ao entrar no CanisTech, você concorda com nossos{' '}
                <span className="text-slate-400 underline cursor-pointer">Termos de Uso Corporativos</span> e{' '}
                <span className="text-slate-400 underline cursor-pointer">Conformidade LGPD</span>.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 border-t border-slate-900 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span>© 2026 CanisTech Digital Systems — Plataforma de Gestão Cinófila e Biometria. Todos os direitos reservados.</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Uso Informativo e de Gestão (Não Substitui Consulta Veterinária)</span>
          <span>•</span>
          <span>Segurança 256-bit SSL</span>
          <span>•</span>
          <span>Conformidade LGPD</span>
        </div>
      </footer>

      {/* Modal: Google Account Selector & Auth Prompt */}
      {selectedProviderModal === 'google' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-2 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-xs">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-heading">
                    Fazer login com o Google
                  </h3>
                  <p className="text-xs text-slate-500">
                    Selecione sua conta para acessar o <strong>CanisTech DogOS</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProviderModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Account List */}
            {!showCustomForm ? (
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-600">
                  Contas Google disponíveis:
                </span>
                <div className="space-y-2">
                  {DEFAULT_GOOGLE_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleQuickLoginGoogle(acc)}
                      className="w-full text-left p-3 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-between group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={acc.photoUrl}
                          alt={acc.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-sm text-slate-900 group-hover:text-blue-600">
                            {acc.name}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            {acc.email}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-blue-600 group-hover:underline">
                        Entrar
                      </span>
                    </button>
                  ))}
                </div>

                {/* Option to type custom Google account */}
                <button
                  type="button"
                  onClick={() => setShowCustomForm(true)}
                  className="w-full py-2.5 text-center text-xs font-semibold text-slate-600 hover:text-slate-900 border border-dashed border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  + Usar outra conta Google
                </button>
              </div>
            ) : (
              /* Custom Google Account Form */
              <form onSubmit={handleCustomGoogleLogin} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Seu Nome Completo:
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Ex: Dra. Camila Miranda"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    E-mail da sua Conta Google (@gmail.com):
                  </label>
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="seu.nome@gmail.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    Voltar às contas
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50"
                  >
                    {isLoading ? 'Autenticando...' : 'Confirmar e Entrar'}
                  </button>
                </div>
              </form>
            )}

            {/* Google Disclaimer */}
            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-center">
              Para prosseguir, o Google compartilhará seu nome, endereço de e-mail e foto do perfil com o CanisTech DogOS.
            </div>
          </div>
        </div>
      )}

      {/* Modal: Facebook Account Selector & Auth Prompt */}
      {selectedProviderModal === 'facebook' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-2 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1877F2] text-white flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-heading">
                    Continuar com o Facebook
                  </h3>
                  <p className="text-xs text-slate-500">
                    Faça login no <strong>CanisTech</strong> usando sua conta do Facebook
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProviderModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Account List */}
            {!showCustomForm ? (
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-600">
                  Contas do Facebook identificadas:
                </span>
                <div className="space-y-2">
                  {DEFAULT_FACEBOOK_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleQuickLoginFacebook(acc)}
                      className="w-full text-left p-3 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex items-center justify-between group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={acc.photoUrl}
                          alt={acc.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-sm text-slate-900 group-hover:text-blue-700">
                            {acc.name}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            {acc.email}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#1877F2] group-hover:underline">
                        Conectar
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowCustomForm(true)}
                  className="w-full py-2.5 text-center text-xs font-semibold text-slate-600 hover:text-slate-900 border border-dashed border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  + Entrar com outra conta do Facebook
                </button>
              </div>
            ) : (
              /* Custom Facebook Form */
              <form onSubmit={handleCustomFacebookLogin} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nome no Facebook:
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Seu nome exibido no Facebook"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    E-mail ou Telefone do Facebook:
                  </label>
                  <input
                    type="text"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="email@exemplo.com ou telefone"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    Voltar às contas
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
                  >
                    {isLoading ? 'Autenticando...' : 'Conectar Facebook'}
                  </button>
                </div>
              </form>
            )}

            {/* Facebook Disclaimer */}
            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-center">
              O CanisTech receberá acesso ao seu nome e foto do perfil público e endereço de e-mail de acordo com a Meta Platform Terms.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
