import React, { useState, useEffect } from 'react';
import {
  DogProfile,
  WeightRecord,
  VaccineRecord,
  ToxicItem,
  BreedInfo,
  YloveCandidate,
  AdoptionDog,
  ContestCandidate,
  PartnerSpecialist,
  AdCampaign,
  RegionGeoStat,
  AuthUser,
  DailyActivityRecord,
} from './types';
import {
  INITIAL_DOGS,
  INITIAL_WEIGHT_HISTORY,
  INITIAL_VACCINES,
  INITIAL_ACTIVITY_HISTORY,
  TOXIC_DATABASE,
  BREEDS_ENCYCLOPEDIA,
  YLOVE_CANDIDATES,
  ADOPTION_DOGS,
  CONTEST_CANDIDATES,
  PARTNER_SPECIALISTS,
  INITIAL_GEO_PARTNERS,
  INITIAL_AD_CAMPAIGNS,
  REGION_GEO_STATS,
} from './data/mockData';
import { getCurrentUser, clearUserSession, isSeniorAdmin, logAuditEvent } from './services/authService';

import { Navbar } from './components/Navbar';
import { DogOSDashboard } from './components/DogOSDashboard';
import { ClinicReportView } from './components/ClinicReportView';
import { ToxicityGuideView } from './components/ToxicityGuideView';
import { YlovePetView } from './components/YlovePetView';
import { BrazilCanineMap } from './components/BrazilCanineMap';
import { CommunityAdoptionView } from './components/CommunityAdoptionView';
import { PartnersDirectoryView } from './components/PartnersDirectoryView';
import { AdminPanel } from './components/AdminPanel';
import { DogRegistrationModal } from './components/DogRegistrationModal';
import { VetChatAssistant } from './components/VetChatAssistant';
import { StitchArchitectureDoc } from './components/StitchArchitectureDoc';
import { DonationView } from './components/DonationView';
import { BreedEncyclopediaView } from './components/BreedEncyclopediaView';
import { LoginScreen } from './components/LoginScreen';
import { CanineEventsScheduleModal } from './components/CanineEventsScheduleModal';
import { IntellectualPropertyAndPortfolioView } from './components/IntellectualPropertyAndPortfolioView';
import { DogTrainingGuideView } from './components/DogTrainingGuideView';
import { UserPrivacyDataModal } from './components/UserPrivacyDataModal';
import { LgpdConsentBanner } from './components/LgpdConsentBanner';
import { VaccinationPage } from './components/VaccinationPage';
import {
  syncDogProfileDualMode,
  syncVaccineRecordDualMode,
  syncVaultWithSupabaseDualMode,
} from './services/supabaseClient';
import { Calendar, Lock, ShieldCheck, Syringe } from 'lucide-react';

interface UserVaultData {
  dogs: DogProfile[];
  activeDogId: string;
  weightHistory: WeightRecord[];
  vaccines: VaccineRecord[];
  activityHistory: DailyActivityRecord[];
}

function getUserVaultKey(email?: string): string {
  if (!email) return 'canistech_vault_guest';
  return `canistech_vault_${email.toLowerCase().trim()}`;
}

function loadUserVault(email?: string, defaultUser?: AuthUser | null): UserVaultData {
  const key = getUserVaultKey(email);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.dogs)) {
        return parsed as UserVaultData;
      }
    }
  } catch (e) {
    console.error('Erro ao ler cofre multi-tenant:', e);
  }

  // Prepara registros iniciais customizados e isolados para esta conta
  const userDogs = INITIAL_DOGS.map((dog) => {
    if (defaultUser && (dog.id === 'dog-thor' || !dog.tutorEmail)) {
      return {
        ...dog,
        tutorName: defaultUser.name,
        tutorEmail: defaultUser.email,
      };
    }
    return dog;
  });

  const initialVault: UserVaultData = {
    dogs: userDogs,
    activeDogId: userDogs.length > 0 ? userDogs[0].id : '',
    weightHistory: INITIAL_WEIGHT_HISTORY,
    vaccines: INITIAL_VACCINES,
    activityHistory: INITIAL_ACTIVITY_HISTORY,
  };

  try {
    localStorage.setItem(key, JSON.stringify(initialVault));
  } catch (e) {
    console.error('Erro ao salvar cofre multi-tenant inicial:', e);
  }

  return initialVault;
}

function saveUserVault(email: string, vault: UserVaultData): void {
  try {
    const key = getUserVaultKey(email);
    localStorage.setItem(key, JSON.stringify(vault));
  } catch (e) {
    console.error('Erro ao persistir cofre multi-tenant:', e);
  }
}

export default function App() {
  // Authentication Gate State (Restricted to Google or Facebook login)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getCurrentUser());

  // Dark Mode Theme State with LocalStorage Persistence
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('canistech_theme_mode');
      if (stored) return stored === 'dark';
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('canistech_theme_mode', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('canistech_theme_mode', 'light');
      }
    } catch (e) {
      console.error(e);
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Multi-tenant Local Vault Data States
  const [dogs, setDogs] = useState<DogProfile[]>(() => {
    const v = loadUserVault(currentUser?.email, currentUser);
    return v.dogs;
  });
  const [activeDogId, setActiveDogId] = useState<string>(() => {
    const v = loadUserVault(currentUser?.email, currentUser);
    return v.activeDogId;
  });
  const [weightHistory, setWeightHistory] = useState<WeightRecord[]>(() => {
    const v = loadUserVault(currentUser?.email, currentUser);
    return v.weightHistory;
  });
  const [vaccines, setVaccines] = useState<VaccineRecord[]>(() => {
    const v = loadUserVault(currentUser?.email, currentUser);
    return v.vaccines;
  });
  const [activityHistory, setActivityHistory] = useState<DailyActivityRecord[]>(() => {
    const v = loadUserVault(currentUser?.email, currentUser);
    return v.activityHistory;
  });

  const [contestCandidates, setContestCandidates] = useState<ContestCandidate[]>(CONTEST_CANDIDATES);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>(INITIAL_AD_CAMPAIGNS);

  // Modals & Dog Edition State
  const [showRegisterDogModal, setShowRegisterDogModal] = useState<boolean>(false);
  const [editingDog, setEditingDog] = useState<DogProfile | null>(null);
  const [showVetChatModal, setShowVetChatModal] = useState<boolean>(false);
  const [showEventsScheduleModal, setShowEventsScheduleModal] = useState<boolean>(false);
  const [vetChatInitialQuery, setVetChatInitialQuery] = useState<string | undefined>(undefined);
  const [showArchitectureDoc, setShowArchitectureDoc] = useState<boolean>(false);
  const [selectedBreedForDetail, setSelectedBreedForDetail] = useState<BreedInfo | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);

  // Protected Emergency Scan Routing State
  const [emergencyScanNotice, setEmergencyScanNotice] = useState<string | null>(null);
  const [pendingScanTarget, setPendingScanTarget] = useState<{ dogId?: string | null; rgc?: string | null } | null>(null);

  // Processamento de URL: Roteamento Protegido do Scan de Emergência (Dossiê com Login Obrigatório)
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const viewParam = searchParams.get('view');
      const dogIdParam = searchParams.get('dogId');
      const rgcParam = searchParams.get('rgc');
      const actionParam = searchParams.get('action');

      if (viewParam === 'dossier' || actionParam === 'emergency_scan') {
        if (!currentUser) {
          setEmergencyScanNotice(
            'Acesso Restrito: Faça login como proprietário titular para visualizar o Dossiê Biométrico de Emergência deste animal.'
          );
          setPendingScanTarget({ dogId: dogIdParam, rgc: rgcParam });
        } else {
          // Usuário já está autenticado no momento do scan
          handleProcessEmergencyAccess(currentUser, dogIdParam, rgcParam);
        }
      }
    } catch (e) {
      console.error('Erro ao processar parâmetros de emergência:', e);
    }
  }, []);

  const handleProcessEmergencyAccess = (
    user: AuthUser,
    targetDogId?: string | null,
    targetRgc?: string | null
  ) => {
    const v = loadUserVault(user.email, user);
    const matchedDog =
      v.dogs.find(
        (d) =>
          (targetDogId && d.id === targetDogId) ||
          (targetRgc && (d.rgNumber === targetRgc || d.rgcNumber === targetRgc))
      ) || v.dogs[0];

    if (matchedDog) {
      const isOwner =
        !matchedDog.tutorEmail ||
        matchedDog.tutorEmail.toLowerCase() === user.email.toLowerCase() ||
        (matchedDog as any).ownerEmail?.toLowerCase() === user.email.toLowerCase();
      const isAdmin = isSeniorAdmin(user.email);

      if (isOwner || isAdmin) {
        setActiveDogId(matchedDog.id);
        setCurrentView('clinicReport');
        try {
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch {}
      } else {
        alert(
          'Acesso Negado: Apenas o tutor cadastrado ou o Administrador Sênior possui autorização para consultar este Dossiê de Emergência.'
        );
        setCurrentView('dashboard');
      }
    } else {
      setCurrentView('clinicReport');
    }
  };

  // REGRA DE ENCERRAMENTO POR ÓBITO: Se todos os cães forem falecidos, aciona obrigatoriamente o cadastro
  useEffect(() => {
    if (currentUser) {
      const aliveDogs = dogs.filter((d) => (d.vitalStatus ?? 'alive') === 'alive');
      if (dogs.length > 0 && aliveDogs.length === 0) {
        setEditingDog(null);
        setShowRegisterDogModal(true);
      }
    }
  }, [currentUser, dogs]);

  // Recarrega o cofre seguro sempre que o usuário alternar de conta
  useEffect(() => {
    if (currentUser) {
      const v = loadUserVault(currentUser.email, currentUser);
      setDogs(v.dogs);
      setActiveDogId(v.activeDogId);
      setWeightHistory(v.weightHistory);
      setVaccines(v.vaccines);
      setActivityHistory(v.activityHistory);

      // Sincronização transparente Dual-Mode (Supabase Cloud quando configurado, ou Local Vault)
      void syncVaultWithSupabaseDualMode(v.dogs, v.vaccines, currentUser.id, currentUser.token);

      // BLINDAGEM: Se tentar entrar na view admin ou portfolio sem ser Administrador Sênior, redireciona
      if ((currentView === 'admin' || currentView === 'portfolio') && !isSeniorAdmin(currentUser.email)) {
        setCurrentView('dashboard');
        logAuditEvent({
          userEmail: currentUser.email,
          action: 'ACCESS_DENIED_PROTECTED_VIEW',
          provider: currentUser.provider,
          ipMock: '127.0.0.1 (Shield Guard)',
          status: 'DENIED',
          details: 'Tentativa não autorizada de acessar área restrita à administração sênior',
        });
      }
    }
  }, [currentUser, currentView]);

  const activeDog = dogs.find((d) => d.id === activeDogId) || dogs[0] || null;

  // Contagem dinâmica de vacinas urgentes (a vencer em <= 7 dias ou vencidas)
  const urgentVaccinesCount = React.useMemo(() => {
    if (!activeDog) return 0;
    const dogVacs = vaccines.filter((v) => !v.dogId || v.dogId === activeDog.id);
    const targetVacs = dogVacs.length > 0 ? dogVacs : vaccines;
    return targetVacs.filter((v) => {
      if (v.status === 'expired' || v.status === 'warning') return true;
      if (v.daysRemaining !== undefined && v.daysRemaining <= 7) return true;
      return false;
    }).length;
  }, [vaccines, activeDog]);

  const persistCurrentVault = (overrides?: Partial<UserVaultData>) => {
    if (!currentUser) return;
    const currentVault: UserVaultData = {
      dogs,
      activeDogId,
      weightHistory,
      vaccines,
      activityHistory,
      ...overrides,
    };
    saveUserVault(currentUser.email, currentVault);
  };

  const handleLogout = () => {
    clearUserSession();
    setCurrentUser(null);
  };

  const handleSwitchAccount = () => {
    clearUserSession();
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    if (pendingScanTarget) {
      handleProcessEmergencyAccess(user, pendingScanTarget.dogId, pendingScanTarget.rgc);
      setPendingScanTarget(null);
      setEmergencyScanNotice(null);
    }
  };

  // Handler: Update existing dog profile (com ciclo de vida e encerramento por óbito)
  const handleUpdateDog = (updatedDog: DogProfile) => {
    const updatedDogs = dogs.map((d) => (d.id === updatedDog.id ? updatedDog : d));
    setDogs(updatedDogs);

    const aliveDogs = updatedDogs.filter((d) => (d.vitalStatus ?? 'alive') === 'alive');
    let nextActiveId = activeDogId;

    if (updatedDog.vitalStatus === 'deceased') {
      if (aliveDogs.length > 0) {
        nextActiveId = aliveDogs[0].id;
        setActiveDogId(nextActiveId);
      } else {
        // Bloqueio obrigatório: obriga cadastro de novo cão ativo
        setEditingDog(null);
        setShowRegisterDogModal(true);
      }
    }

    persistCurrentVault({
      dogs: updatedDogs,
      activeDogId: nextActiveId,
    });
    void syncDogProfileDualMode(updatedDog, currentUser?.id, currentUser?.token);
  };

  // Handler: Add new weigh-in
  const handleAddWeight = (newWeight: number, date: string, note?: string) => {
    const newRecord: WeightRecord = {
      id: 'w-' + Date.now(),
      dogId: activeDog.id,
      date,
      weight: newWeight,
      note,
    };
    const updatedHistory = [...weightHistory, newRecord];
    const updatedDogs = dogs.map((d) => (d.id === activeDog.id ? { ...d, currentWeight: newWeight } : d));

    setWeightHistory(updatedHistory);
    setDogs(updatedDogs);

    persistCurrentVault({
      weightHistory: updatedHistory,
      dogs: updatedDogs,
    });
  };

  // Handler: Save newly registered dog
  const handleSaveDog = (newDog: DogProfile) => {
    const updatedDogs = [newDog, ...dogs];
    setDogs(updatedDogs);
    setActiveDogId(newDog.id);
    setCurrentView('dashboard');

    persistCurrentVault({
      dogs: updatedDogs,
      activeDogId: newDog.id,
    });
    void syncDogProfileDualMode(newDog, currentUser?.id, currentUser?.token);
  };

  // Handler: Vote in Dog of the Week contest
  const handleVoteContest = (candidateId: string) => {
    setContestCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, votes: c.votes + 1 } : c))
    );
  };

  // Handler: Toggle ad campaign status
  const handleToggleCampaign = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId
          ? { ...c, status: c.status === 'active' ? 'paused' : 'active' }
          : c
      )
    );
  };

  // Handler: Set Dog of the Week winner in Admin
  const handleSetWinner = (candidateId: string) => {
    setContestCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, votes: c.votes + 50 } : c))
    );
  };

  const handleOpenVetChat = (query?: string) => {
    setVetChatInitialQuery(query);
    setShowVetChatModal(true);
  };

  // Handler: Update vaccine record (applied date / new next date)
  const handleUpdateVaccine = (updatedVaccine: VaccineRecord) => {
    const updated = vaccines.map((v) => (v.id === updatedVaccine.id ? updatedVaccine : v));
    setVaccines(updated);
    persistCurrentVault({ vaccines: updated });
    void syncVaccineRecordDualMode(updatedVaccine, currentUser?.id, currentUser?.token);
  };

  // Handler: Add new vaccine record
  const handleAddVaccine = (newVaccine: VaccineRecord) => {
    const updated = [newVaccine, ...vaccines];
    setVaccines(updated);
    persistCurrentVault({ vaccines: updated });
    void syncVaccineRecordDualMode(newVaccine, currentUser?.id, currentUser?.token);
  };

  // Handler: Add daily exercise / activity record
  const handleAddActivity = (newActivity: DailyActivityRecord) => {
    const updated = [newActivity, ...activityHistory];
    setActivityHistory(updated);
    persistCurrentVault({ activityHistory: updated });
  };

  const handleSelectDog = (id: string) => {
    setActiveDogId(id);
    persistCurrentVault({ activeDogId: id });
  };

  const isSenior = isSeniorAdmin(currentUser?.email);

  // STRICT GATE: Só poderá entrar na plataforma através do login via Google ou Facebook
  if (!currentUser) {
    return (
      <>
        <LgpdConsentBanner userEmail={undefined} />
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          emergencyScanNotice={emergencyScanNotice}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#090D16] text-[#0B1C30] dark:text-[#F1F5F9] flex flex-col font-sans transition-colors duration-200">
      {/* Gate Obrigatório de Consentimento LGPD no Primeiro Acesso */}
      <LgpdConsentBanner userEmail={currentUser.email} />
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          // BLINDAGEM: Se tentar navegar para 'admin' ou 'portfolio' sem privilégio sênior, bloqueia e redireciona
          if ((view === 'admin' || view === 'portfolio') && !isSenior) {
            logAuditEvent({
              userEmail: currentUser.email,
              action: 'BLOCKED_PROTECTED_NAVIGATION',
              provider: currentUser.provider,
              ipMock: '127.0.0.1 (Shield Router)',
              status: 'DENIED',
              details: 'Acesso bloqueado: usuário não é Administrador Sênior',
            });
            setCurrentView('dashboard');
            return;
          }
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        dogs={dogs}
        activeDog={activeDog}
        onSelectDog={handleSelectDog}
        onOpenRegisterDog={() => {
          setEditingDog(null);
          setShowRegisterDogModal(true);
        }}
        onOpenVetChat={() => handleOpenVetChat()}
        onOpenArchitectureDoc={() => setShowArchitectureDoc(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchAccount={handleSwitchAccount}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleTheme}
        onOpenEventsSchedule={() => setShowEventsScheduleModal(true)}
        onOpenPrivacyModal={() => setShowPrivacyModal(true)}
        urgentVaccinesCount={urgentVaccinesCount}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 pt-24 pb-16">
        {currentView === 'dashboard' && (
          <DogOSDashboard
            dog={activeDog}
            dogs={dogs}
            weightHistory={weightHistory}
            vaccines={vaccines}
            activityHistory={activityHistory}
            onOpenRegisterDog={() => {
              setEditingDog(null);
              setShowRegisterDogModal(true);
            }}
            onOpenEditDog={(dogToModify) => {
              setEditingDog(dogToModify);
              setShowRegisterDogModal(true);
            }}
            onUpdateDog={handleUpdateDog}
            onAddWeight={handleAddWeight}
            onAddActivity={handleAddActivity}
            onUpdateVaccine={handleUpdateVaccine}
            onAddVaccine={handleAddVaccine}
            onNavigateToReport={() => setCurrentView('clinicReport')}
            onNavigateToToxicity={() => setCurrentView('toxicidade')}
            onOpenVetChat={handleOpenVetChat}
            onNavigateToVaccines={() => {
              setCurrentView('vacinas');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToDonation={() => {
              setCurrentView('doacao');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToEncyclopedia={() => {
              setCurrentView('enciclopedia');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'vacinas' && (
          <VaccinationPage
            activeDog={activeDog}
            dogs={dogs}
            vaccines={vaccines}
            onUpdateVaccine={handleUpdateVaccine}
            onAddVaccine={handleAddVaccine}
            onNavigateToDashboard={() => {
              setCurrentView('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenRegisterDog={() => {
              setEditingDog(null);
              setShowRegisterDogModal(true);
            }}
            onOpenVetChat={handleOpenVetChat}
            currentUser={currentUser}
          />
        )}

        {currentView === 'clinicReport' && (
          activeDog ? (
            <ClinicReportView
              dog={activeDog}
              vaccines={vaccines}
              onBack={() => setCurrentView('dashboard')}
            />
          ) : (
            <div className="max-w-[1280px] mx-auto px-4 py-16 text-center space-y-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Nenhum cão cadastrado</h2>
              <p className="text-xs text-slate-500">Cadastre um cão no DogOS para visualizar e emitir seu relatório completo.</p>
              <button
                onClick={() => {
                  setEditingDog(null);
                  setShowRegisterDogModal(true);
                }}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                + Cadastrar Cão
              </button>
            </div>
          )
        )}

        {currentView === 'enciclopedia' && (
          <BreedEncyclopediaView
            breeds={BREEDS_ENCYCLOPEDIA}
            onSelectBreed={(breed) => setSelectedBreedForDetail(breed)}
            onOpenVetChat={handleOpenVetChat}
            onNavigateToDonation={() => {
              setCurrentView('doacao');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'toxicidade' && (
          <ToxicityGuideView
            toxicItems={TOXIC_DATABASE}
            breeds={BREEDS_ENCYCLOPEDIA}
            onOpenVetChat={handleOpenVetChat}
            onSelectBreed={(breed) => setSelectedBreedForDetail(breed)}
          />
        )}

        {currentView === 'doacao' && (
          <DonationView
            onNavigateToAdoption={() => {
              setCurrentView('comunidade');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenVetChat={handleOpenVetChat}
          />
        )}

        {currentView === 'ylove' && (
          <YlovePetView
            candidates={YLOVE_CANDIDATES}
            activeDog={activeDog}
            onRequestBreedMatch={(name) =>
              handleOpenVetChat(`Quero informações sobre compatibilidade de cruzamento com ${name}`)
            }
          />
        )}

        {currentView === 'mapa' && (
          <BrazilCanineMap
            regionStats={REGION_GEO_STATS}
            dogs={dogs}
            onOpenRegisterDog={() => {
              setEditingDog(null);
              setShowRegisterDogModal(true);
            }}
          />
        )}

        {currentView === 'comunidade' && (
          <CommunityAdoptionView
            contestCandidates={contestCandidates}
            adoptionDogs={ADOPTION_DOGS}
            onVoteContest={handleVoteContest}
          />
        )}

        {currentView === 'especialistas' && (
          <PartnersDirectoryView
            partners={PARTNER_SPECIALISTS}
            geoPartners={INITIAL_GEO_PARTNERS}
          />
        )}

        {currentView === 'adestramento' && (
          <DogTrainingGuideView
            currentUser={currentUser}
            activeDog={activeDog}
            dogs={dogs}
            onOpenVetChat={handleOpenVetChat}
            onNavigateToDashboard={() => {
              setCurrentView('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'portfolio' && (
          <IntellectualPropertyAndPortfolioView
            onBack={() => setCurrentView('dashboard')}
            onOpenVetChat={handleOpenVetChat}
          />
        )}

        {/* Rota Administrativa Sênior: Estritamente protegida */}
        {currentView === 'admin' && isSenior && (
          <AdminPanel
            campaigns={campaigns}
            onToggleCampaign={handleToggleCampaign}
            contestCandidates={contestCandidates}
            onSetWinner={handleSetWinner}
          />
        )}
      </main>

      {/* Breed Detail Modal */}
      {selectedBreedForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base font-heading">
                Ficha Biológica: {selectedBreedForDetail.name}
              </h3>
              <button
                onClick={() => setSelectedBreedForDetail(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <div className="h-44 w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={selectedBreedForDetail.photoUrl}
                  alt={selectedBreedForDetail.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(selectedBreedForDetail.origin.toLowerCase().includes('brasil') ||
                  selectedBreedForDetail.id.includes('campeiro') ||
                  selectedBreedForDetail.id.includes('fila') ||
                  selectedBreedForDetail.id.includes('srd')) && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    🇧🇷 Raça Autóctone Nacional
                  </span>
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedBreedForDetail.heatTolerance === 'alta'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                      : selectedBreedForDetail.heatTolerance === 'moderada'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
                  }`}
                >
                  Tolerância ao Calor: {selectedBreedForDetail.heatTolerance.toUpperCase()}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {selectedBreedForDetail.size.toUpperCase()} PORTE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div><strong>Origem:</strong> {selectedBreedForDetail.origin}</div>
                <div><strong>Faixa de Peso:</strong> {selectedBreedForDetail.weightRange}</div>
                <div><strong>Gasto Diário:</strong> {selectedBreedForDetail.exerciseDailyMin} min/dia</div>
                <div><strong>Moradia:</strong> {selectedBreedForDetail.housing}</div>
              </div>

              <div>
                <strong className="text-slate-900 dark:text-white">Adaptação ao Clima Brasileiro:</strong>
                <p className="mt-0.5 bg-amber-50/60 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-800/40 text-slate-700 dark:text-slate-300">
                  {selectedBreedForDetail.coatCareInBrazil}
                </p>
              </div>

              <div>
                <strong className="text-slate-900 dark:text-white">Predisposições Genéticas Conhecidas:</strong>
                <ul className="list-disc list-inside mt-0.5 text-slate-500 dark:text-slate-400">
                  {selectedBreedForDetail.geneticRisks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  const bName = selectedBreedForDetail.name;
                  setSelectedBreedForDetail(null);
                  handleOpenVetChat(`Gostaria de saber recomendações preventivas e rotina ideal para meu ${bName} no clima brasileiro.`);
                }}
                className="w-full sm:w-auto px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Tirar Dúvida com Vet IA</span>
              </button>
              <button
                onClick={() => setSelectedBreedForDetail(null)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white rounded-xl text-xs font-semibold"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Canine Events Schedule Modal (2026) */}
      {showEventsScheduleModal && (
        <CanineEventsScheduleModal
          onClose={() => setShowEventsScheduleModal(false)}
          onOpenVetChat={handleOpenVetChat}
        />
      )}

      {/* Global Modals */}
      {showRegisterDogModal && (
        <DogRegistrationModal
          onClose={() => {
            const aliveCount = dogs.filter((d) => (d.vitalStatus ?? 'alive') === 'alive').length;
            if (aliveCount === 0 && dogs.length > 0) return;
            setShowRegisterDogModal(false);
            setEditingDog(null);
          }}
          onSaveDog={(newDog) => {
            handleSaveDog(newDog);
            setShowRegisterDogModal(false);
            setEditingDog(null);
          }}
          onUpdateDog={(updatedDog) => {
            handleUpdateDog(updatedDog);
            setShowRegisterDogModal(false);
            setEditingDog(null);
          }}
          dogToEdit={editingDog}
          currentUser={currentUser}
          isBlockingRequired={dogs.length > 0 && dogs.filter((d) => (d.vitalStatus ?? 'alive') === 'alive').length === 0}
        />
      )}

      {showVetChatModal && (
        <VetChatAssistant
          activeDog={activeDog}
          initialQuery={vetChatInitialQuery}
          onClose={() => setShowVetChatModal(false)}
        />
      )}

      {showArchitectureDoc && (
        <StitchArchitectureDoc onClose={() => setShowArchitectureDoc(false)} />
      )}

      {showPrivacyModal && (
        <UserPrivacyDataModal
          isOpen={showPrivacyModal}
          onClose={() => setShowPrivacyModal(false)}
          currentUser={currentUser}
          onPurgeSuccess={handleLogout}
        />
      )}

      {/* Footer Blindado: Sem links administrativos públicos */}
      <footer className="w-full bg-slate-900 dark:bg-slate-950 text-white mt-auto border-t border-slate-800">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white text-slate-900 font-bold flex items-center justify-center text-sm">
                  C
                </div>
                <span className="text-lg font-bold font-heading">CanisTech</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Arquitetura clínica, cartografia biométrica e prontuário digital inteligente para saúde, longevidade e bem-estar canino.
              </p>
              <button
                onClick={() => setShowArchitectureDoc(true)}
                className="text-xs text-[#E07A5F] hover:underline font-semibold flex items-center gap-1 pt-1"
              >
                <span>Ver Dossiê de Arquitetura Stitch</span>
                <span>→</span>
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
                Ecossistema Canino
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <button onClick={() => { setCurrentView('dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-white transition-colors">
                    Meu Cão (DogOS)
                  </button>
                </li>
                <li>
                  <button onClick={() => { setCurrentView('vacinas'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-white transition-colors text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Syringe className="w-3.5 h-3.5" />
                    <span>Vacinas & Imunização (WSAVA)</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => { setCurrentView('enciclopedia'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-white transition-colors text-orange-400 font-semibold">
                    Enciclopédia de Raças & Clima BR
                  </button>
                </li>
                <li>
                  <button onClick={() => { setCurrentView('toxicidade'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-white transition-colors">
                    Guia de Alimentos & Toxicidade
                  </button>
                </li>
                <li>
                  <button onClick={() => { setCurrentView('ylove'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-white transition-colors">
                    Ylove Pet (Reprodução Ética)
                  </button>
                </li>
                <li>
                  <button onClick={() => { setCurrentView('comunidade'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-white transition-colors">
                    Feira Virtual de Adoção Responsável
                  </button>
                </li>
                <li>
                  <button onClick={() => { setCurrentView('doacao'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-white transition-colors text-rose-400 font-bold flex items-center gap-1">
                    <span>❤️ Apoie o CanisTech (Doação)</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => { setCurrentView('adestramento'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-white transition-colors text-amber-400 font-bold flex items-center gap-1">
                    <span>⭐ Adestramento Gold (200 Vagas)</span>
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
                Rede & Serviços
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <button onClick={() => { setCurrentView('mapa'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-white transition-colors">
                    Mapa Canino do Brasil
                  </button>
                </li>
                <li>
                  <button onClick={() => { setCurrentView('especialistas'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-white transition-colors">
                    Hospitais 24h & Especialistas
                  </button>
                </li>
                <li>
                  <button onClick={() => setShowEventsScheduleModal(true)} className="hover:text-white transition-colors flex items-center gap-1.5 text-orange-400 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Agenda de Exposições 2026</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => setShowPrivacyModal(true)} className="hover:text-white transition-colors flex items-center gap-1.5 text-blue-400 font-semibold cursor-pointer">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Retirar Meus Dados (LGPD)</span>
                  </button>
                </li>
                {/* Link de Governança & IP exclusivo para administradores sêniores */}
                {isSenior && (
                  <li>
                    <button
                      onClick={() => { setCurrentView('portfolio'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="hover:text-white transition-colors flex items-center gap-1.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span>Governança & Propriedade Intelectual</span>
                    </button>
                  </li>
                )}
                <li>
                  <button onClick={() => handleOpenVetChat()} className="hover:text-white transition-colors">
                    Central de Triagem IA 24h
                  </button>
                </li>
                {/* Link exclusivo para administradores sêniores no rodapé */}
                {isSenior && (
                  <li>
                    <button
                      onClick={() => { setCurrentView('admin'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 pt-1 cursor-pointer"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Console Sênior Homologado</span>
                    </button>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
                Titularidade & Compliance CFMV
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                CanisTech Digital Systems — Plataforma de Gestão Cinófila e Biometria. Protegida pelas Leis Federais nº 9.609/98, 9.610/98 e 13.709/18 (LGPD).
              </p>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                As informações e parâmetros biométricos emitidos pela plataforma têm finalidade informativa e de rotina, não substituindo a consulta, o diagnóstico presencial ou o acompanhamento por Médico Veterinário habilitado pelo CRMV/CFMV.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              © 2026 CanisTech Digital Systems — Plataforma de Gestão Cinófila e Biometria. Todos os direitos reservados.
            </div>
            <div className="flex items-center gap-4">
              <span className="text-emerald-400 font-semibold">✓ Protocolo CFMV Compliant</span>
              <span>v2.5.0 Enterprise Shield</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
