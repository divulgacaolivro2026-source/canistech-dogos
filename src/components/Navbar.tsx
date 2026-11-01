import React from 'react';
import { DogProfile, AuthUser } from '../types';
import {
  HeartPulse,
  Plus,
  Bot,
  MapPin,
  ShieldAlert,
  Dna,
  Stethoscope,
  Heart,
  Settings,
  ChevronDown,
  FileText,
  LogOut,
  User,
  ShieldCheck,
  Calendar,
  Lock,
  Sun,
  Moon,
  Sparkles,
  BookOpen,
  Syringe,
} from 'lucide-react';
import { isSeniorAdmin } from '../services/authService';

export interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  dogs: DogProfile[];
  activeDog?: DogProfile | null;
  onSelectDog: (dogId: string) => void;
  onOpenRegisterDog: () => void;
  onOpenVetChat: () => void;
  onOpenArchitectureDoc: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onSwitchAccount?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenEventsSchedule?: () => void;
  onOpenPrivacyModal?: () => void;
  urgentVaccinesCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  dogs,
  activeDog,
  onSelectDog,
  onOpenRegisterDog,
  onOpenVetChat,
  onOpenArchitectureDoc,
  currentUser,
  onLogout,
  onSwitchAccount,
  isDarkMode,
  onToggleDarkMode,
  onOpenEventsSchedule,
  onOpenPrivacyModal,
  urgentVaccinesCount,
}) => {
  const [dogDropdownOpen, setDogDropdownOpen] = React.useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);

  const isSenior = isSeniorAdmin(currentUser?.email);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Top Emergency Triage Banner */}
      <div className="bg-red-50 dark:bg-red-950/40 border-b border-red-100 dark:border-red-900/40 text-red-900 dark:text-red-200 px-4 py-1.5 text-xs font-medium">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="hidden sm:inline font-semibold">Triagem Rápida:</span>
            <span className="truncate">Em caso de intoxicação súbita, convulsão ou trauma, busque atendimento presencial imediato.</span>
          </div>
          <button
            onClick={onOpenVetChat}
            className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors shrink-0"
          >
            <span>Chat Veterinário IA 24h</span>
            <span className="font-mono">⚡</span>
          </button>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="h-16 max-w-[1280px] mx-auto px-4 md:px-6 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-[#E07A5F] text-white flex items-center justify-center font-black tracking-tighter text-lg shadow-sm group-hover:bg-[#E07A5F] transition-colors">
              C
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-heading block leading-none">
                CanisTech
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
                DogOS Biometria & Histórico
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Single-line, unboxed, hover underline) */}
        <nav className="hidden lg:flex items-center gap-3 xl:gap-4 text-xs xl:text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`whitespace-nowrap transition-colors py-1 ${
              currentView === 'dashboard'
                ? 'text-slate-900 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-white'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Meu Cão (DogOS)
          </button>
          <button
            onClick={() => onNavigate('vacinas')}
            className={`whitespace-nowrap transition-colors py-1 flex items-center gap-1.5 ${
              currentView === 'vacinas'
                ? 'text-slate-900 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-white'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Syringe className="w-3.5 h-3.5 text-emerald-500" />
            <span>Vacinas & Imunização</span>
            {urgentVaccinesCount !== undefined && urgentVaccinesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
                {urgentVaccinesCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onNavigate('enciclopedia')}
            className={`whitespace-nowrap transition-colors py-1 flex items-center gap-1 ${
              currentView === 'enciclopedia'
                ? 'text-slate-900 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-white'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Enciclopédia de Raças</span>
            <span className="text-[10px] bg-orange-100 dark:bg-orange-950/60 text-[#E07A5F] px-1 rounded font-bold">Clima BR</span>
          </button>
          <button
            onClick={() => onNavigate('toxicidade')}
            className={`whitespace-nowrap transition-colors py-1 ${
              currentView === 'toxicidade'
                ? 'text-slate-900 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-white'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Toxicidade
          </button>
          <button
            onClick={() => onNavigate('ylove')}
            className={`whitespace-nowrap transition-colors py-1 flex items-center gap-1 ${
              currentView === 'ylove'
                ? 'text-slate-900 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-white'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Ylove Pet</span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1 rounded font-bold">Ético</span>
          </button>
          <button
            onClick={() => onNavigate('mapa')}
            className={`whitespace-nowrap transition-colors py-1 ${
              currentView === 'mapa'
                ? 'text-slate-900 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-white'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Mapa BR
          </button>
          <button
            onClick={() => onNavigate('especialistas')}
            className={`whitespace-nowrap transition-colors py-1 ${
              currentView === 'especialistas'
                ? 'text-slate-900 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-white'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Especialistas
          </button>
          <button
            onClick={() => onNavigate('comunidade')}
            className={`whitespace-nowrap transition-colors py-1 ${
              currentView === 'comunidade'
                ? 'text-slate-900 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-white'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Adoção
          </button>
          <button
            onClick={() => onNavigate('doacao')}
            className={`whitespace-nowrap transition-colors py-1 flex items-center gap-1.5 px-2 rounded-lg font-bold ${
              currentView === 'doacao'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current text-rose-500" />
            <span>Apoie / Doação</span>
          </button>

          {/* Agenda de Eventos 2026 Button */}
          {onOpenEventsSchedule && (
            <button
              onClick={onOpenEventsSchedule}
              className="whitespace-nowrap transition-colors py-1 text-slate-600 dark:text-slate-300 hover:text-orange-500 flex items-center gap-1"
            >
              <Calendar className="w-3.5 h-3.5 text-[#E07A5F]" />
              <span>Agenda 2026</span>
            </button>
          )}

          {/* Adestramento Gold */}
          <button
            onClick={() => onNavigate('adestramento')}
            className={`whitespace-nowrap transition-colors py-1 flex items-center gap-1.5 px-2.5 rounded-lg font-bold cursor-pointer ${
              currentView === 'adestramento'
                ? 'bg-amber-100 text-amber-950 dark:bg-amber-500 dark:text-slate-950 border border-amber-300 dark:border-amber-400'
                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            <span>⭐</span>
            <span>Adestramento Gold</span>
          </button>

          {/* Governança & IP: Acessível estritamente para administradores sêniores */}
          {isSenior && (
            <button
              onClick={() => onNavigate('portfolio')}
              className={`whitespace-nowrap transition-colors py-1 flex items-center gap-1 ${
                currentView === 'portfolio'
                  ? 'text-slate-900 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-white'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-500" />
              <span>Governança & IP</span>
            </button>
          )}

          {/* PAINEL ADMINISTRATIVO BLINDADO: Acessível EXCLUSIVAMENTE para administradores sêniores */}
          {isSenior && (
            <button
              onClick={() => onNavigate('admin')}
              className={`whitespace-nowrap transition-all py-1 px-2.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs ${
                currentView === 'admin'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 hover:bg-amber-200 border border-amber-300 dark:border-amber-700'
              }`}
              title="Acesso exclusivo: Administradores Sêniores Homologados"
            >
              <Lock className="w-3 h-3" />
              <span>Console Admin Sênior</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Actions (Theme Toggle + Pet Switcher + Profile) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Dark Mode Switcher */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className="p-2 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title={isDarkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
          )}

          {/* Active Dog Selector Dropdown or Empty State Button */}
          {activeDog ? (
            <div className="relative">
              <button
                onClick={() => setDogDropdownOpen(!dogDropdownOpen)}
                className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              >
                <img
                  src={activeDog.photoUrl}
                  alt={activeDog.name}
                  className="w-6 h-6 rounded-full object-cover border border-slate-300 dark:border-slate-600"
                />
                <span className="hidden sm:inline font-bold">{activeDog.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {dogDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Meus Cães Registrados
                  </div>
                  {dogs.map((dog) => (
                    <button
                      key={dog.id}
                      onClick={() => {
                        onSelectDog(dog.id);
                        setDogDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                        dog.id === activeDog.id
                          ? 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <img src={dog.photoUrl} alt={dog.name} className="w-7 h-7 rounded-full object-cover" />
                      <div className="truncate">
                        <p className="font-bold text-slate-900 dark:text-white">{dog.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{dog.breed}</p>
                      </div>
                    </button>
                  ))}
                  <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1 px-1">
                    <button
                      onClick={() => {
                        setDogDropdownOpen(false);
                        onOpenRegisterDog();
                      }}
                      className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#E07A5F] hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-lg font-semibold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Cadastrar Novo Cão</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenRegisterDog}
              className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cadastrar Cão</span>
            </button>
          )}

          {/* Primary Action Button */}
          <button
            onClick={onOpenRegisterDog}
            className="hidden sm:inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-transform active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Cão</span>
          </button>

          {/* Botão Retirar Meus Dados LGPD */}
          {onOpenPrivacyModal && (
            <button
              onClick={onOpenPrivacyModal}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
              title="Direitos LGPD: Baixar todos os dados ou solicitar exclusão definitiva"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Retirar Meus Dados (LGPD)</span>
            </button>
          )}

          {/* User Account / Profile Menu */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200"
                title={`Conectado como ${currentUser.name}`}
              >
                <div className="relative">
                  <img
                    src={currentUser.photoUrl}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-300 dark:border-slate-600"
                  />
                  {currentUser.provider === 'google' ? (
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#1877F2] text-white shadow-xs border border-white flex items-center justify-center">
                      <svg className="w-2 h-2 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                  )}
                </div>

                <span className="hidden sm:inline max-w-[100px] truncate text-slate-800 dark:text-slate-200">
                  {currentUser.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <img
                      src={currentUser.photoUrl}
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                        {currentUser.email}
                      </p>
                      <span className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        isSenior
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                          : 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}>
                        {isSenior ? '★ Administrador Sênior' : '✓ Tutor Cadastrado'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    {isSenior && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('admin');
                        }}
                        className="w-full text-left px-3 py-2 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition-colors font-bold text-xs flex items-center gap-2"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Abrir Console Sênior</span>
                      </button>
                    )}

                    {onSwitchAccount && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onSwitchAccount();
                        }}
                        className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors font-semibold text-xs flex items-center gap-2"
                      >
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>Alternar Conta / Provedor</span>
                      </button>
                    )}

                    {onOpenPrivacyModal && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenPrivacyModal();
                        }}
                        className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors font-semibold text-xs flex items-center gap-2"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                        <span>Retirar Meus Dados (LGPD)</span>
                      </button>
                    )}

                    {onLogout && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors font-semibold text-xs flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-2"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>Sair da Plataforma (Logout)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Architecture & Stitch Docs */}
          <button
            onClick={onOpenArchitectureDoc}
            title="Ver Especificações e Arquitetura Stitch"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Secondary Navigation Ribbon */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs no-scrollbar">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
            currentView === 'dashboard' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium' : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          DogOS
        </button>
        <button
          onClick={() => onNavigate('vacinas')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap flex items-center gap-1 ${
            currentView === 'vacinas' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium' : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <Syringe className="w-3 h-3 text-emerald-500" />
          <span>Vacinas</span>
          {urgentVaccinesCount !== undefined && urgentVaccinesCount > 0 && (
            <span className="px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold">
              {urgentVaccinesCount}
            </span>
          )}
        </button>
        <button
          onClick={() => onNavigate('enciclopedia')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap flex items-center gap-1 ${
            currentView === 'enciclopedia' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium' : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <span>Raças & Clima</span>
        </button>
        <button
          onClick={() => onNavigate('toxicidade')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
            currentView === 'toxicidade' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium' : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Toxicidade
        </button>
        <button
          onClick={() => onNavigate('ylove')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
            currentView === 'ylove' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium' : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Ylove Pet
        </button>
        <button
          onClick={() => onNavigate('mapa')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
            currentView === 'mapa' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium' : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Mapa Brasil
        </button>
        <button
          onClick={() => onNavigate('especialistas')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
            currentView === 'especialistas' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium' : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Especialistas
        </button>
        <button
          onClick={() => onNavigate('comunidade')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
            currentView === 'comunidade' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium' : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Adoção
        </button>
        <button
          onClick={() => onNavigate('doacao')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap font-bold flex items-center gap-1 ${
            currentView === 'doacao'
              ? 'bg-rose-600 text-white'
              : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40'
          }`}
        >
          <Heart className="w-3 h-3 fill-current" />
          <span>Doação</span>
        </button>

        {onOpenEventsSchedule && (
          <button
            onClick={onOpenEventsSchedule}
            className="px-2.5 py-1 rounded-md whitespace-nowrap text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 font-semibold flex items-center gap-1"
          >
            <Calendar className="w-3 h-3" />
            <span>Agenda 2026</span>
          </button>
        )}

        <button
          onClick={() => onNavigate('adestramento')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap font-bold flex items-center gap-1 ${
            currentView === 'adestramento'
              ? 'bg-amber-500 text-slate-950 font-black'
              : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
          }`}
        >
          <span>⭐</span>
          <span>Adestramento Gold</span>
        </button>

        {isSenior && (
          <button
            onClick={() => onNavigate('portfolio')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
              currentView === 'portfolio' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Governança & IP
          </button>
        )}

        {/* Console Sênior na navegação mobile apenas para os administradores sêniores */}
        {isSenior && (
          <button
            onClick={() => onNavigate('admin')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap font-bold flex items-center gap-1 ${
              currentView === 'admin'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
            }`}
          >
            <Lock className="w-3 h-3" />
            <span>Admin Sênior</span>
          </button>
        )}
      </div>
    </header>
  );
};
