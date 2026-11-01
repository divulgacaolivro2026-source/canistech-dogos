// Caminho: src/components/VaccinationPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { DogProfile, VaccineRecord, AuthUser } from '../types';
import {
  WSAVA_PHASES,
  VACCINE_RULES,
  VaccinationPhaseId,
  LifestyleTriggers,
  ScheduledDoseItem,
  calculateDogAgeChronology,
  generateDogVaccineSchedule,
  getVaccinesDueIn7DaysCount,
  generateVaccine7dWhatsAppLink,
  generateVaccine7dEmailDetails,
} from '../utils/vaccineEngine';
import { logAuditEvent, sanitizeXss } from '../services/authService';
import {
  Syringe,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Printer,
  Download,
  Share2,
  Send,
  MessageCircle,
  Mail,
  Sparkles,
  Info,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Check,
  X,
  Dog,
  Heart,
  ExternalLink,
  RefreshCw,
  Bell,
  BellRing,
  HelpCircle,
  FileText,
  SlidersHorizontal,
  FileDown,
  Scissors,
  BookOpen,
} from 'lucide-react';
import {
  generateAndDownloadVaccineBookletPdf,
  createVaccineBookletPdfBlobUrl,
  buildLifetimeBookletDoses,
  BookletDoseSlot,
  RGC_OFFICIAL_SUBTITLE,
  MANDATORY_BOOKLET_LEGAL_CLAUSE,
} from '../utils/vaccineBookletPdfGenerator';
import {
  formatRgcCpf,
  getDogPhotoUrl,
  generateRgcSecurityHash,
  QrCodeSvg,
} from '../utils/qrCodeGenerator';

interface VaccinationPageProps {
  activeDog: DogProfile | null;
  dogs: DogProfile[];
  vaccines: VaccineRecord[];
  onUpdateVaccine?: (vaccine: VaccineRecord) => void;
  onAddVaccine?: (vaccine: VaccineRecord) => void;
  onNavigateToDashboard: () => void;
  onOpenRegisterDog: () => void;
  onOpenVetChat: (query?: string) => void;
  currentUser?: AuthUser | null;
}

export const VaccinationPage: React.FC<VaccinationPageProps> = ({
  activeDog,
  dogs,
  vaccines,
  onUpdateVaccine,
  onAddVaccine,
  onNavigateToDashboard,
  onOpenRegisterDog,
  onOpenVetChat,
  currentUser,
}) => {
  // Lifestyle Toggles (Gatilhos de Estilo de Vida & Ocasiões Especiais)
  const [lifestyle, setLifestyle] = useState<LifestyleTriggers>(() => {
    try {
      const stored = localStorage.getItem(`canistech_lifestyle_${activeDog?.id}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      frequentsDaycare: true,
      ruralOrRodentRisk: false,
      travelPlanned: false,
      endemicLeishmania: false,
      breedingFemale: activeDog?.gender === 'Fêmea' && !activeDog?.neutered,
    };
  });

  // Salva preferências de estilo de vida por cão
  useEffect(() => {
    if (activeDog?.id) {
      try {
        localStorage.setItem(`canistech_lifestyle_${activeDog.id}`, JSON.stringify(lifestyle));
      } catch {}
    }
  }, [lifestyle, activeDog?.id]);

  // Contatos do Tutor para disparos de 7 dias
  const [tutorPhoneInput, setTutorPhoneInput] = useState<string>(activeDog?.tutorPhone || '(11) 98765-4321');
  const [tutorEmailInput, setTutorEmailInput] = useState<string>(
    activeDog?.tutorEmail || currentUser?.email || 'tutor@canistech.com.br'
  );
  const [auto7dActive, setAuto7dActive] = useState<boolean>(true);

  // Estados de Interface e Filtros
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<VaccinationPhaseId | 'all'>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showNonRoutineSection, setShowNonRoutineSection] = useState<boolean>(false);
  const [showTargetAgentsModal, setShowTargetAgentsModal] = useState<boolean>(false);
  const [showPhysicalCardModal, setShowPhysicalCardModal] = useState<boolean>(false);
  const [bookletViewTab, setBookletViewTab] = useState<'all' | 'booklet1' | 'booklet2'>('all');
  const [showApplyModal, setShowApplyModal] = useState<ScheduledDoseItem | null>(null);
  const [simulatedAlertToast, setSimulatedAlertToast] = useState<string | null>(null);
  const [bookletPrintPreviewBlobUrl, setBookletPrintPreviewBlobUrl] = useState<string | null>(null);
  const bookletPrintIframeRef = React.useRef<HTMLIFrameElement | null>(null);

  // Doses concluídas manualmente (persistidas)
  const [completedDoseIds, setCompletedDoseIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(`canistech_completed_doses_${activeDog?.id}`);
      if (raw) return new Set(JSON.parse(raw));
    } catch {}
    return new Set();
  });

  const persistCompletedDose = (doseId: string, isDone: boolean) => {
    setCompletedDoseIds((prev) => {
      const next = new Set(prev);
      if (isDone) next.add(doseId);
      else next.delete(doseId);
      try {
        localStorage.setItem(`canistech_completed_doses_${activeDog?.id}`, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // V8, V10 ou V12 escolhida por dose
  const [variantByDose, setVariantByDose] = useState<Record<string, 'V8' | 'V10' | 'V12'>>(() => {
    try {
      const raw = localStorage.getItem(`canistech_variants_${activeDog?.id}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  });

  const handleSelectVariant = (doseId: string, variant: 'V8' | 'V10' | 'V12') => {
    setVariantByDose((prev) => {
      const updated = { ...prev, [doseId]: variant };
      try {
        localStorage.setItem(`canistech_variants_${activeDog?.id}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Cálculo da Cronologia e Grade Automática do Cão
  const chronology = useMemo(() => {
    return calculateDogAgeChronology(activeDog?.birthDate);
  }, [activeDog?.birthDate]);

  const scheduleDoses = useMemo(() => {
    if (!activeDog) return [];
    const base = generateDogVaccineSchedule(activeDog, lifestyle, vaccines);
    return base.map((dose) => ({
      ...dose,
      isCompleted: completedDoseIds.has(dose.id) || dose.isCompleted,
      selectedVariant: variantByDose[dose.id] || dose.selectedVariant || 'V10',
    }));
  }, [activeDog, lifestyle, vaccines, completedDoseIds, variantByDose]);

  const { booklet1Doses, booklet2Doses } = useMemo(() => {
    if (!activeDog) return { booklet1Doses: [], booklet2Doses: [] };
    return buildLifetimeBookletDoses(activeDog, scheduleDoses);
  }, [activeDog, scheduleDoses]);

  const urgentCount = useMemo(() => {
    return getVaccinesDueIn7DaysCount(scheduleDoses);
  }, [scheduleDoses]);

  const rgcFormatted = useMemo(() => {
    return formatRgcCpf(activeDog?.rgNumber, activeDog?.id);
  }, [activeDog?.rgNumber, activeDog?.id]);

  const scanUrl = useMemo(() => {
    if (!activeDog) return '';
    return typeof window !== 'undefined'
      ? `${window.location.origin}/?view=vacinas&dogId=${encodeURIComponent(
          activeDog.id
        )}&rgc=${encodeURIComponent(rgcFormatted)}`
      : `https://canistech.com.br/?view=vacinas&dogId=${activeDog.id}&rgc=${rgcFormatted}`;
  }, [activeDog, rgcFormatted]);

  const securityHash = useMemo(() => {
    if (!activeDog) return '';
    return (
      activeDog.rgcSecurityHash ||
      generateRgcSecurityHash(
        activeDog.id,
        activeDog.microchip,
        activeDog.rgcIssuedAt || new Date().toISOString()
      )
    );
  }, [activeDog]);

  const dogPhoto = useMemo(() => {
    return getDogPhotoUrl(activeDog);
  }, [activeDog]);

  // Ação Rápida: Conciliação Inteligente para Cães Adultos/Idosos
  const handleMarkPuppyPhasesCompleted = () => {
    if (!activeDog) return;
    const puppyDoses = scheduleDoses.filter((d) =>
      ['phase_a', 'phase_b', 'phase_c', 'phase_d', 'phase_e', 'phase_f', 'phase_g'].includes(d.phaseId)
    );
    const updatedSet = new Set(completedDoseIds);
    puppyDoses.forEach((d) => updatedSet.add(d.id));
    setCompletedDoseIds(updatedSet);
    try {
      localStorage.setItem(`canistech_completed_doses_${activeDog.id}`, JSON.stringify(Array.from(updatedSet)));
    } catch {}
    triggerToast(`✓ Todas as fases de filhote de ${activeDog.name} foram marcadas como concluídas com sucesso!`);
  };

  const triggerToast = (msg: string) => {
    setSimulatedAlertToast(msg);
    setTimeout(() => setSimulatedAlertToast(null), 4000);
  };

  // Disparo manual/simulado de alerta 7 dias
  const handleTriggerSimulatedAlert = (dose: ScheduledDoseItem) => {
    if (!activeDog) return;
    generateVaccine7dEmailDetails(activeDog, dose, tutorEmailInput);
    logAuditEvent({
      userEmail: currentUser?.email || activeDog.tutorEmail || 'tutor@canistech.com.br',
      action: 'VACCINE_7D_NOTIFICATION_DISPATCHED',
      provider: currentUser?.provider || 'google',
      ipMock: '127.0.0.1 (7D Alert Engine)',
      status: 'SUCCESS',
      details: `Aviso preventivo de 7 dias disparado para ${activeDog.name} (${dose.name})`,
    });
    triggerToast(`🔔 Notificação de 7 dias gerada! WhatsApp e E-mail sincronizados para ${dose.name}.`);
  };

  // Download direto das Carteirinhas em PDF A4 Paisagem (Livreto Dobrável - Vol 1 e Vol 2)
  const handleDownloadBookletPdf = () => {
    if (!activeDog) return;
    try {
      generateAndDownloadVaccineBookletPdf(activeDog, scheduleDoses);
      logAuditEvent({
        userEmail: currentUser?.email || activeDog.tutorEmail || 'tutor@canistech.com.br',
        action: 'VACCINE_BOOKLET_PDF_DOWNLOADED',
        provider: currentUser?.provider || 'google',
        ipMock: '127.0.0.1 (Booklet Engine)',
        status: 'SUCCESS',
        details: `Carteirinhas de vacinação dobráveis A4 (Vol 01 e Vol 02) baixadas para ${activeDog.name}`,
      });
      triggerToast(`✓ Carteirinhas 01 e 02 de ${activeDog.name} geradas com sucesso em PDF A4!`);
    } catch (e) {
      console.error(e);
      triggerToast('Erro ao gerar documento PDF das carteirinhas dobráveis.');
    }
  };

  // Modal de Pré-Visualização de Impressão Embutido das Carteirinhas (Solução para WebView Antigravity/Electron)
  const handlePrintPhysicalCard = () => {
    if (!activeDog) return;
    try {
      const blobUrl = createVaccineBookletPdfBlobUrl(activeDog, scheduleDoses);
      setBookletPrintPreviewBlobUrl(blobUrl);
      logAuditEvent({
        userEmail: currentUser?.email || activeDog.tutorEmail || 'tutor@canistech.com.br',
        action: 'VACCINE_BOOKLET_PRINT_PREVIEW_OPENED',
        provider: currentUser?.provider || 'google',
        ipMock: '127.0.0.1 (Embedded PDF Preview)',
        status: 'SUCCESS',
        details: `Modal de pré-visualização de impressão A4 das Carteirinhas aberto para ${activeDog.name}`,
      });
    } catch (e) {
      console.error(e);
      triggerToast('Erro ao gerar pré-visualização PDF das carteirinhas.');
    }
  };

  const handlePrintFromEmbeddedIframe = () => {
    const iframeWin = bookletPrintIframeRef.current?.contentWindow;
    if (iframeWin) {
      try {
        iframeWin.focus();
        iframeWin.print();
        return;
      } catch {
        // Fallback para download caso o WebView bloqueie print nativo
      }
    }
    handleDownloadBookletPdf();
  };

  // Filtros aplicados na lista
  const filteredDoses = useMemo(() => {
    return scheduleDoses.filter((d) => {
      if (selectedPhaseFilter !== 'all' && d.phaseId !== selectedPhaseFilter) return false;
      if (selectedCategoryFilter !== 'all' && d.category !== selectedCategoryFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = d.name.toLowerCase().includes(q);
        const matchAgent = d.targetAgents.some((a) => a.disease.toLowerCase().includes(q) || a.code.toLowerCase().includes(q));
        if (!matchName && !matchAgent) return false;
      }
      return true;
    });
  }, [scheduleDoses, selectedPhaseFilter, selectedCategoryFilter, searchQuery]);

  if (!activeDog) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <Syringe className="w-12 h-12 text-[#E07A5F] mx-auto animate-bounce" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white font-heading">
          Nenhum Cão Selecionado
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Para acessar o cronograma de imunização, diretrizes WSAVA 2024 e carteira de vacinas, selecione ou cadastre seu cão.
        </p>
        <button
          onClick={onOpenRegisterDog}
          className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
        >
          + Cadastrar Cão no DogOS
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-slate-900 dark:text-white selection:bg-[#E07A5F] selection:text-white">
      {/* ------------------------------------------------------------- */}
      {/* 2. PLANO DE FUNDO IMERSIVO COM CÃES SAUDÁVEIS BRINCANDO NA NATUREZA */}
      {/* ------------------------------------------------------------- */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Imagem de Alta Resolução Unsplash (Cães Felizes/Saudáveis ao Ar Livre) */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 dark:opacity-20 transition-all duration-700 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1920&q=80')`,
          }}
        ></div>
        {/* Camada Suave de Gradiente e Padrão de Ponto */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F8F9FA]/90 via-[#F8F9FA]/75 to-[#F8F9FA] dark:from-[#090D16]/95 dark:via-[#090D16]/85 dark:to-[#090D16]"></div>
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Toast de Simulação */}
      {simulatedAlertToast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{simulatedAlertToast}</span>
        </div>
      )}

      {/* Conteúdo Principal com Camadas Glassmorphism */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* ------------------------------------------------------------- */}
        {/* HERO SECTION: CENTRAL DE IMUNIZAÇÃO & BADGES DE DIRETRIZES */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-slate-950/75 text-white rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl backdrop-blur-md relative overflow-hidden space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Diretrizes WSAVA 2024 & MAPA/CFMV</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/30 text-[11px] font-bold font-mono">
                  {chronology.ageYears > 0 ? `${chronology.ageYears}a ${chronology.ageMonths % 12}m` : `${chronology.ageWeeks} semanas`} de vida
                </span>
                {urgentCount > 0 && (
                  <span className="px-3 py-1 rounded-full bg-rose-500/30 text-rose-300 border border-rose-400/40 text-[11px] font-black animate-pulse">
                    🔔 {urgentCount} Doses Próximas (7d)
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-heading tracking-tight leading-tight">
                CRONOGRAMA DE IMUNIZAÇÃO, PROFILAXIAS & BEM-ESTAR
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Protocolo clínico personalizado para <strong>{activeDog.name}</strong> ({activeDog.breed}), sincronizado com a curva etária, janela de superação dos anticorpos maternos e controle rígido anti-falha vacinal.
              </p>
            </div>

            {/* CTAs do Topo */}
            <div className="flex flex-wrap sm:flex-col gap-2.5 shrink-0">
              <button
                onClick={() => setShowPhysicalCardModal(true)}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-[#E07A5F] to-amber-500 hover:from-[#d66e53] hover:to-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Carteira Física (Selos 45x20mm)</span>
              </button>

              <button
                onClick={() => setShowTargetAgentsModal(true)}
                className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Tabela de Agentes & Doenças</span>
              </button>

              <button
                onClick={onNavigateToDashboard}
                className="px-4 py-2 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-colors"
              >
                <span>← Voltar ao DogOS</span>
              </button>
            </div>
          </div>

          {/* Ribbon de Identificação Rápida do Paciente */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 border-2 border-slate-700 shrink-0">
                <img
                  src={activeDog.photoUrl}
                  alt={activeDog.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-bold text-white text-sm">{activeDog.name}</p>
                <p className="text-slate-400 text-[11px]">
                  RGC: <span className="font-mono text-orange-400 font-bold">{activeDog.rgNumber}</span> • Microchip: {activeDog.microchip || 'N/I'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-300">
              <div>
                <span className="text-slate-400 block">Tutor(a) Responsável:</span>
                <strong>{activeDog.tutorName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Fase Cronológica Atual:</span>
                <span className="text-emerald-400 font-bold uppercase">{chronology.currentPhaseId.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Doses Concluídas:</span>
                <span className="font-bold text-white">{completedDoseIds.size} doses registradas</span>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 5. CONCILIAÇÃO INTELIGENTE PARA CÃES ADULTOS / IDOSOS */}
        {/* ------------------------------------------------------------- */}
        {chronology.isAdult && (
          <div className="p-5 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900/40 border border-blue-500/30 rounded-3xl backdrop-blur-md shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30 shrink-0 mt-0.5">
                <Dog className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-white font-heading">
                  Cão Adulto / Sênior Detectado ({chronology.ageYears} anos de idade)
                </h3>
                <p className="text-xs text-blue-200 leading-relaxed max-w-2xl">
                  {activeDog.name} já concluiu o período de filhote. O sistema gerou automaticamente os reforços anuais vigentes ({new Date().getFullYear()}) e permite marcar as doses iniciais de filhote como já concluídas em 1 clique.
                </p>
              </div>
            </div>

            <button
              onClick={handleMarkPuppyPhasesCompleted}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Marcar Fases de Filhote Concluídas</span>
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 6. GATILHOS DE ESTILO DE VIDA & OCASIÕES ESPECIAIS */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#E07A5F]" />
              <h3 className="font-bold text-sm sm:text-base font-heading">
                Gatilhos de Estilo de Vida & Ocasiões Especiais (Diretriz WSAVA)
              </h3>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-500">
              Personalização Ativa
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            Marque as opções que se aplicam à rotina de {activeDog.name} para calibrar as recomendações de vacinas não essenciais e alertas clínicos:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {/* Toggle 1: Hotel, Creche, Exposições */}
            <label className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              lifestyle.frequentsDaycare
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              <input
                type="checkbox"
                checked={lifestyle.frequentsDaycare}
                onChange={(e) => setLifestyle({ ...lifestyle, frequentsDaycare: e.target.checked })}
                className="rounded text-orange-600 focus:ring-orange-500 mt-1"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-xs block">Frequenta Creche / Hotel / Banho & Tosa</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-tight">
                  Ativa recomendação prioritária de Tosse dos Canis (Bordetella + CPiV).
                </span>
              </div>
            </label>

            {/* Toggle 2: Área Rural / Alagamentos */}
            <label className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              lifestyle.ruralOrRodentRisk
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              <input
                type="checkbox"
                checked={lifestyle.ruralOrRodentRisk}
                onChange={(e) => setLifestyle({ ...lifestyle, ruralOrRodentRisk: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500 mt-1"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-xs block">Área Rural / Risco de Alagamentos</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-tight">
                  Alerta para reforço rigoroso de Leptospirose (V10/V12 com até 6 sorovares).
                </span>
              </div>
            </label>

            {/* Toggle 3: Viagens Programadas */}
            <label className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              lifestyle.travelPlanned
                ? 'bg-blue-500/10 border-blue-500/40 text-blue-900 dark:text-blue-200'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              <input
                type="checkbox"
                checked={lifestyle.travelPlanned}
                onChange={(e) => setLifestyle({ ...lifestyle, travelPlanned: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500 mt-1"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-xs block">Viagens Nacionais / Internacionais</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-tight">
                  Exige conformidade estrita da vacina Antirrábica e carteira sanitária.
                </span>
              </div>
            </label>

            {/* Toggle 4: Leishmaniose Endêmica */}
            <label className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              lifestyle.endemicLeishmania
                ? 'bg-purple-500/10 border-purple-500/40 text-purple-900 dark:text-purple-200'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              <input
                type="checkbox"
                checked={lifestyle.endemicLeishmania}
                onChange={(e) => setLifestyle({ ...lifestyle, endemicLeishmania: e.target.checked })}
                className="rounded text-purple-600 focus:ring-purple-500 mt-1"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-xs block">Residência ou Viagem para Área de Leishmaniose</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-tight">
                  Ativa protocolo de repelentes inseticidas e avaliação sorológica prévia.
                </span>
              </div>
            </label>

            {/* Toggle 5: Fêmea Reprodutora */}
            {activeDog.gender === 'Fêmea' && (
              <label className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                lifestyle.breedingFemale
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-900 dark:text-rose-200'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                <input
                  type="checkbox"
                  checked={lifestyle.breedingFemale}
                  onChange={(e) => setLifestyle({ ...lifestyle, breedingFemale: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500 mt-1"
                />
                <div className="space-y-0.5">
                  <span className="font-bold text-xs block">Fêmea Reprodutora / Gestante</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-tight">
                    Ativa protocolo de Herpesvírus Canino (CHV-1) para prevenção neonatal.
                  </span>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 7. CENTRAL DE DISPARO AUTOMÁTICO 7 DIAS ANTES (WHATSAPP & E-MAIL) */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="font-bold text-sm sm:text-base font-heading">
                  Central de Notificações Automáticas 7 Dias Antes
                </h3>
                <p className="text-xs text-slate-500">
                  Disparo antecipado para que o tutor agende a aplicação veterinária sem atrasar o ciclo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Disparo 7d:
              </span>
              <button
                onClick={() => setAuto7dActive(!auto7dActive)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                  auto7dActive
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {auto7dActive ? '✓ Ativo (7 Dias Antes)' : 'Pausado'}
              </button>
            </div>
          </div>

          {/* Dados de Contato do Tutor para Disparo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-500 font-medium mb-1">WhatsApp de Recebimento:</label>
              <input
                type="text"
                value={tutorPhoneInput}
                onChange={(e) => setTutorPhoneInput(e.target.value)}
                placeholder="(DDD) 99999-9999"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">E-mail de Recebimento:</label>
              <input
                type="email"
                value={tutorEmailInput}
                onChange={(e) => setTutorEmailInput(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  const firstPending = scheduleDoses.find((d) => !d.isCompleted) || scheduleDoses[0];
                  handleTriggerSimulatedAlert(firstPending);
                }}
                className="w-full py-2 px-3 bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 border border-amber-400/40 rounded-xl font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BellRing className="w-3.5 h-3.5 text-amber-600" />
                <span>Simular Envio do Aviso de 7 Dias</span>
              </button>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 4. ALERTA REGULATÓRIO MAPA: LEISHMANIOSE VISCERAL */}
        {/* ------------------------------------------------------------- */}
        <div className="p-5 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 rounded-3xl space-y-2 text-amber-950 dark:text-amber-200 shadow-md">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                  Situação Regulatória Especial (MAPA / CFMV)
                </span>
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  Leishmaniose Visceral Canina
                </span>
              </div>
              <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-200">
                A vacina <strong>Leish-Tec</strong> teve sua fabricação e comercialização suspensas cautelarmente pelo <strong>MAPA (Ministério da Agricultura e Pecuária)</strong> em maio de 2023 devido a desvios de conformidade em lotes. Por determinação veterinária, a vacinação <strong>não deve ser listada como obrigação rotineira</strong> sem confirmação de produto ativo homologado e exame sorológico prévio negativo. O pilar preventivo primário obrigatório e mais eficaz é o uso contínuo de <strong>coleiras ou repelentes inseticidas</strong> contra o mosquito-palha (<em>Lutzomyia longipalpis</em>).
              </p>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* FILTROS E PESQUISA DE VACINAS */}
        {/* ------------------------------------------------------------- */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Seletor de Fases WSAVA */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => setSelectedPhaseFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                selectedPhaseFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              Todas as Fases
            </button>
            {WSAVA_PHASES.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPhaseFilter(p.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
                  selectedPhaseFilter === p.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {p.code} ({p.ageRange})
              </button>
            ))}
          </div>

          {/* Barra de Pesquisa */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar vacina ou doença..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* GRADE DE DOSES CRONOLÓGICAS WSAVA 2024 */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base font-heading flex items-center gap-2">
              <Syringe className="w-4 h-4 text-[#E07A5F]" />
              <span>Doses e Protocolos Programados para {activeDog.name}</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {filteredDoses.length} imunizações listadas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDoses.map((dose) => {
              const waLink = generateVaccine7dWhatsAppLink(activeDog, dose, tutorPhoneInput);
              const emailDetails = generateVaccine7dEmailDetails(activeDog, dose, tutorEmailInput);

              return (
                <div
                  key={dose.id}
                  className={`bg-white/90 dark:bg-slate-900/90 rounded-3xl p-5 border shadow-sm transition-all flex flex-col justify-between space-y-4 ${
                    dose.isCompleted
                      ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20'
                      : dose.isOverdue
                      ? 'border-rose-300 dark:border-rose-800 bg-rose-50/20'
                      : dose.isImminent7d
                      ? 'border-amber-300 dark:border-amber-700 bg-amber-50/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header do Card */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              dose.category === 'Essencial'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                : dose.category === 'Não Essencial'
                                ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                                : 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                            }`}
                          >
                            {dose.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {dose.phaseCode}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {dose.doseLabel}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm sm:text-base font-heading text-slate-900 dark:text-white leading-tight">
                          {dose.name}
                        </h4>
                      </div>

                      {/* Checkbox de Conclusão */}
                      <button
                        onClick={() => persistCompletedDose(dose.id, !dose.isCompleted)}
                        className={`p-1.5 rounded-xl border transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                          dose.isCompleted
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700 hover:text-slate-600'
                        }`}
                        title={dose.isCompleted ? 'Dose já aplicada' : 'Marcar como dose aplicada'}
                      >
                        <Check className="w-4 h-4" />
                        <span className="text-[10px] font-bold">
                          {dose.isCompleted ? 'Aplicada' : 'Pendente'}
                        </span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {dose.purpose}
                    </p>

                    {/* SELETOR EXCLUSIVO V8 / V10 / V12 (Quando aplicável) */}
                    {dose.isAlternativeGroup && (
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            Escolha da Variante Polivalente:
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            {dose.selectedVariant === 'V8' ? '2 sorovares Lepto' : dose.selectedVariant === 'V10' ? '4 sorovares Lepto' : '6 sorovares Lepto'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5">
                          {(['V8', 'V10', 'V12'] as const).map((v) => (
                            <button
                              key={v}
                              onClick={() => handleSelectVariant(dose.id, v)}
                              className={`py-1 rounded-xl text-xs font-bold transition-all ${
                                dose.selectedVariant === v
                                  ? 'bg-[#E07A5F] text-white shadow-xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>

                        <p className="text-[10px] text-slate-500 italic">
                          {dose.selectedVariant === 'V8' && 'V8: Canicola e Icterohaemorrhagiae.'}
                          {dose.selectedVariant === 'V10' && 'V10: Canicola, Icterohaemorrhagiae, Grippotyphosa e Pomona.'}
                          {dose.selectedVariant === 'V12' && 'V12: Canicola, Icterohaemorrhagiae, Grippotyphosa, Pomona, Bratislava e Copenhageni.'}
                        </p>
                      </div>
                    )}

                    {/* Datas e Prazos */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Previsão / Vencimento:</span>
                        <strong className="text-slate-900 dark:text-white font-mono text-xs">{dose.dueDate}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px]">Aviso de 7 Dias:</span>
                        <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{dose.alertDate7d}</span>
                      </div>
                    </div>

                    {/* Doenças Alvo Prevenidas */}
                    <div className="flex flex-wrap items-center gap-1">
                      {dose.targetAgents.slice(0, 4).map((ag) => (
                        <span
                          key={ag.code}
                          className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400"
                          title={`${ag.agent}: ${ag.disease}`}
                        >
                          {ag.code}
                        </span>
                      ))}
                      {dose.targetAgents.length > 4 && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          +{dose.targetAgents.length - 4} antígenos
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ações na Base do Card */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setShowApplyModal(dose)}
                      className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                      <span>Registrar Aplicação</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* WhatsApp Trigger */}
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 transition-colors"
                        title="Enviar lembrete formatado para WhatsApp do tutor"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>

                      {/* Email Trigger */}
                      <a
                        href={emailDetails.mailto}
                        className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 transition-colors"
                        title="Enviar lembrete por E-mail"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>

                      {/* Notificar / Simular */}
                      <button
                        onClick={() => handleTriggerSimulatedAlert(dose)}
                        className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 transition-colors"
                        title="Disparar aviso preventivo de 7 dias"
                      >
                        <BellRing className="w-3.5 h-3.5 text-amber-600" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SEÇÃO COLAPSÁVEL: NÃO RECOMENDADAS ROTINEIRAMENTE (WSAVA 2024) */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <button
            onClick={() => setShowNonRoutineSection(!showNonRoutineSection)}
            className="w-full flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white font-heading">
                  Vacinas Não Recomendadas Rotineiramente (Diretriz WSAVA 2024)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Giardíase e Coronavirose Entérica Canina (CCoV Monovalente).
                </p>
              </div>
            </div>
            {showNonRoutineSection ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showNonRoutineSection && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed animate-in fade-in duration-150">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                <strong className="text-slate-900 dark:text-white block">1. Vacina contra Giardíase Canina (Giardia duodenalis)</strong>
                <p>
                  A diretriz global WSAVA 2024 classifica a vacina de giárdia como "Não Recomendada Rotineiramente". A vacina tem como objetivo reduzir os sintomas clínicos e a excreção de cistos no ambiente, mas <strong>não impede a infecção pelo protozoário</strong>. O pilar indispensável é o saneamento ambiental, higiene dos bebedouros e tratamento veterinário específico sob diagnóstico coproparasitológico.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                <strong className="text-slate-900 dark:text-white block">2. Vacina Monovalente contra Coronavírus Canino (CCoV)</strong>
                <p>
                  A infecção por coronavírus entérico canino é autolimitada e de baixa morbidade quando isolada. Não há evidência clínica robusta que justifique a vacinação monovalente regular além daquela já contemplada nas formulações polivalentes comerciais.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/* MODAL 1: TABELA AUTORITATIVA DE AGENTES & DOENÇAS */}
      {/* ============================================================= */}
      {showTargetAgentsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-base font-heading">
                  Tabela Oficial: Vacinas vs Agentes Patogênicos & Doenças
                </h3>
              </div>
              <button
                onClick={() => setShowTargetAgentsModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-500 leading-relaxed">
                Mapeamento das imunizações caninas em conformidade com o <em>WSAVA Vaccination Guidelines Group (VGG 2024)</em> e farmacopeia do MAPA:
              </p>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold">
                    <tr>
                      <th className="p-3">Código</th>
                      <th className="p-3">Agente Etiológico</th>
                      <th className="p-3">Doença Prevenida</th>
                      <th className="p-3">Categoria WSAVA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="p-3 font-mono font-bold text-orange-600">CDV</td>
                      <td className="p-3">Canine Distemper Virus</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">Cinomose Canina (Fatal)</td>
                      <td className="p-3 text-emerald-600 font-bold">Essencial</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-orange-600">CPV-2</td>
                      <td className="p-3">Canine Parvovirus 2</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">Parvovirose Canina (Enterite Hemorrágica)</td>
                      <td className="p-3 text-emerald-600 font-bold">Essencial</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-orange-600">CAV-1 / CAV-2</td>
                      <td className="p-3">Canine Adenovirus 1 e 2</td>
                      <td className="p-3">Hepatite Infecciosa & Laringotraqueíte</td>
                      <td className="p-3 text-emerald-600 font-bold">Essencial</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-orange-600">Leptospira</td>
                      <td className="p-3">L. canicola, ictero, grippo, pomona</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">Leptospirose Canina (Zoonose Grave)</td>
                      <td className="p-3 text-emerald-600 font-bold">Essencial (Brasil)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-orange-600">Raiva</td>
                      <td className="p-3">Lyssavirus (Vírus da Raiva)</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">Raiva Canina (100% Letal / Zoonose)</td>
                      <td className="p-3 text-emerald-600 font-bold">Essencial / Legal</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-blue-600">Bordetella</td>
                      <td className="p-3">Bordetella bronchiseptica + CPiV</td>
                      <td className="p-3">Tosse dos Canis (Traqueobronquite)</td>
                      <td className="p-3 text-blue-600 font-bold">Não Essencial (Social)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-blue-600">CIV</td>
                      <td className="p-3">Canine Influenza Virus (H3N8/H3N2)</td>
                      <td className="p-3">Gripe Canina / Pneumonia por Influenza</td>
                      <td className="p-3 text-blue-600 font-bold">Não Essencial</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-purple-600">Leishmania</td>
                      <td className="p-3">Leishmania infantum</td>
                      <td className="p-3">Leishmaniose Visceral Canina</td>
                      <td className="p-3 text-purple-600 font-bold">Regional (Suspensa MAPA)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-bold text-purple-600">CHV-1</td>
                      <td className="p-3">Canine Herpesvirus tipo 1</td>
                      <td className="p-3">Mortalidade Neonatal do Filhote</td>
                      <td className="p-3 text-purple-600 font-bold">Específico (Cadelas)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: CARTEIRA FÍSICA DE VACINAÇÃO (LIVRETO DOBRÁVEL A4 PAISAGEM -> A5) */}
      {/* ============================================================= */}
      {showPhysicalCardModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
          <div className="bg-slate-100 dark:bg-slate-900 rounded-3xl max-w-6xl w-full p-4 sm:p-6 shadow-2xl border border-slate-300 dark:border-slate-800 space-y-4 max-h-[94vh] overflow-y-auto animate-in zoom-in-95 duration-150 flex flex-col">
            {/* Modal Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-slate-300 dark:border-slate-800 gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading flex items-center gap-2">
                    <span>Carteira Oficial de Vacinação Canina</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-400/30">
                      2 Volumes Dobráveis • 32 Selos Regulamentares
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Volume 01 (Filhote &amp; Inicial) + Volume 02 (Adulto &amp; Sênior) • 4 Lâminas A4 Paisagem (297x210mm) com linha central de dobra (148.5mm)
                  </p>
                </div>
              </div>

              {/* Action Buttons & Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Visualizer Tabs */}
                <div className="flex items-center p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs shadow-xs">
                  <button
                    type="button"
                    onClick={() => setBookletViewTab('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      bookletViewTab === 'all'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Ver Ambas as Carteirinhas (01 e 02 Completas)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookletViewTab('booklet1')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      bookletViewTab === 'booklet1'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Carteirinha 01 (Filhote &amp; Inicial - Capas + Interior)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookletViewTab('booklet2')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      bookletViewTab === 'booklet2'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Carteirinha 02 (Adulto &amp; Sênior - Capas + Interior)
                  </button>
                </div>

                {/* Primary Action Button: Baixar PDF A4 */}
                <button
                  type="button"
                  onClick={handleDownloadBookletPdf}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                  title="Baixar Carteirinhas 01 e 02 em PDF A4 Paisagem (4 páginas)"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Baixar Carteirinhas 01 e 02 (PDF A4)</span>
                </button>

                {/* Secondary Button: Imprimir A4 */}
                <button
                  type="button"
                  onClick={handlePrintPhysicalCard}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="Imprimir Carteirinhas 01 e 02 via navegador"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Imprimir Carteirinhas 01 e 02 (A4)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPhysicalCardModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Aviso de Instrução de Dobra */}
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 p-3 rounded-2xl flex items-center gap-3 text-xs text-amber-950 dark:text-amber-200 shrink-0">
              <Scissors className="w-4 h-4 text-amber-600 shrink-0" />
              <p>
                <strong>Estrutura de 2 Carteirinhas Dobráveis (Bifold A4 &rarr; A5):</strong> Cada cão possui automaticamente <strong>Carteirinha 01</strong> (Série Primária &amp; Filhote - 16 Selos) e <strong>Carteirinha 02</strong> (Reforços Anuais Adulto &amp; Sênior - 16 Selos), totalizando 32 doses completas para cobrir toda a vida do cão. Dobre cada folha ao meio na guia central (148.5mm) e insira a lâmina interna dentro da capa correspondente.
              </p>
            </div>

            {/* ZONA DE IMPRESSÃO / PRÉ-VISUALIZAÇÃO DO LIVRETO DOBRÁVEL */}
            <div id="canistech-physical-card-print" className="space-y-10 flex-1 overflow-y-auto pr-1">
              {/* ========================================================= */}
              {/* CARTEIRINHA 01 (VOLUME 01 / 02 - PRIMOVACINAÇÃO & FILHOTE) */}
              {/* ========================================================= */}
              {(bookletViewTab === 'all' || bookletViewTab === 'booklet1') && (
                <div className="space-y-6">
                  {/* Badge Identificador de Volume */}
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-800 dark:text-amber-300 text-xs font-bold print:hidden">
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-600" />
                      <span>CARTEIRINHA 01 (VOLUME 01/02) • PRIMOVACINAÇÃO, FILHOTE &amp; JOVEM (16 DOSES)</span>
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-wider bg-amber-500/20 px-2 py-0.5 rounded-md">
                      2 LÂMINAS A4 PAISAGEM &bull; DOBRADO A5
                    </span>
                  </div>

                  {/* ------------------------------------------------------- */}
                  {/* FOLHA 1: CARTEIRINHA 01 — LÂMINA EXTERNA (CONTRACAPA + CAPA) */}
                  {/* ------------------------------------------------------- */}
                  <div className="sheet-page p-[6mm] bg-white rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col md:flex-row relative min-h-[540px] print:min-h-0 print:border-none print:shadow-none">
                    {/* CONTRACAPA (Metade Esquerda: 148.5mm) */}
                    <div className="sheet-half w-full md:w-1/2 p-5 flex flex-col justify-between relative bg-slate-50 overflow-hidden rounded-l-xl">
                      {/* Fundo com Cães Felizes Brincando */}
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-multiply pointer-events-none select-none"
                        style={{
                          backgroundImage: `url('https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80')`,
                        }}
                      />

                      {/* Conteúdo da Contracapa */}
                      <div className="relative z-10 backdrop-blur-xs bg-white/92 dark:bg-slate-900/92 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-sm">
                        <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                          <span className="text-[9.5px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block font-mono leading-tight">
                            {RGC_OFFICIAL_SUBTITLE}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white font-heading mt-0.5">
                            Orientações Essenciais de Imunização &amp; Biossegurança
                          </h4>
                          <p className="text-[10px] text-slate-500">
                            Diretrizes do Grupo de Diretrizes de Vacinação WSAVA 2024
                          </p>
                        </div>

                        {/* Regras WSAVA para Filhote */}
                        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-tight">
                              <strong>Série Primária de Filhote:</strong> A última dose da polivalente deve ser aplicada entre 16 e 20 semanas para superar a interferência de anticorpos maternos.
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-tight">
                              <strong>Vacina Antirrábica Obrigatória:</strong> A imunização contra a raiva é mandatória por lei federal a partir de 12-16 semanas com reforço anual estrito.
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-tight">
                              <strong>Consolidação e Socialização:</strong> Evitar passeios na rua ou contato com cães não imunizados até 15 dias após a conclusão da 3ª ou 4ª dose primária.
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-tight">
                              <strong>Autenticação por Selo Físico:</strong> Exija sempre a fixação do selo do frasco (45x20mm) contendo lote e validade, acompanhado de carimbo físico com CRMV (42x18mm).
                            </p>
                          </div>
                        </div>

                        {/* QR Code de Autenticidade e Prontuário */}
                        <div className="p-2.5 bg-amber-500/10 dark:bg-amber-950/30 rounded-xl border border-amber-300 dark:border-amber-800 flex items-center gap-3">
                          <div className="p-1.5 bg-white rounded-lg border border-amber-200 shrink-0 shadow-xs">
                            <QrCodeSvg value={scanUrl} size={64} />
                          </div>
                          <div className="space-y-0.5 text-xs">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                              <span>VERIFICAÇÃO DIGITAL DO PRONTUÁRIO</span>
                            </div>
                            <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-snug">
                              Aponte a câmera para consultar a autenticidade e o histórico vacinal em tempo real.
                            </p>
                            <p className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
                              RGC: <strong>{rgcFormatted}</strong>
                            </p>
                            <p className="text-[8px] font-mono text-amber-700 dark:text-amber-400 truncate max-w-[210px]">
                              {securityHash}
                            </p>
                          </div>
                        </div>

                        {/* Rodapé Legal Obrigatório CFMV / CDC */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                          <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-snug">
                            {MANDATORY_BOOKLET_LEGAL_CLAUSE}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* GUIA CENTRAL DE DOBRA (148.5mm) */}
                    <div className="hidden md:flex flex-col items-center justify-between py-4 w-0 relative z-20">
                      <div className="absolute inset-y-0 w-px border-l-2 border-dashed border-slate-300 dark:border-slate-700"></div>
                      <div className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold flex items-center gap-1 shadow-xs z-10 whitespace-nowrap">
                        <Scissors className="w-3 h-3 text-slate-500" />
                        <span>DOBRA CENTRAL • VINCLE AO MEIO</span>
                      </div>
                      <div className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold flex items-center gap-1 shadow-xs z-10 whitespace-nowrap">
                        <span>PADRÃO A5 (148.5mm) • SAFE ZONE 6mm</span>
                      </div>
                    </div>

                    {/* CAPA FRONTAL (Metade Direita: 148.5mm) */}
                    <div className="sheet-half w-full md:w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-5 sm:p-6 flex flex-col justify-between relative border-l border-slate-800 rounded-r-xl">
                      {/* Moldura Dourada Interna */}
                      <div className="absolute inset-2 border-2 border-amber-500/30 rounded-2xl pointer-events-none"></div>

                      {/* Topo da Capa: Títulos + BANDEIRA DO BRASIL VETORIAL */}
                      <div className="flex items-start justify-between gap-3 relative z-10">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 block font-mono leading-tight">
                            {RGC_OFFICIAL_SUBTITLE}
                          </span>
                          <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight leading-none text-white">
                            CARTEIRA OFICIAL DE VACINAÇÃO
                          </h2>
                          <h3 className="text-base sm:text-lg font-bold text-amber-400 font-heading leading-tight">
                            &amp; IMUNIZAÇÃO CANINA
                          </h3>
                          <p className="text-[10.5px] text-emerald-400 font-medium">
                            Padrão Internacional WSAVA &bull; Diretrizes CFMV &amp; MAPA
                          </p>
                          <div className="pt-1">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md">
                              VOLUME 01 / 02 • PRIMOVACINAÇÃO &amp; SÉRIE INICIAL
                            </span>
                          </div>
                        </div>

                        {/* BANDEIRA DO BRASIL VETORIAL */}
                        <div className="flex items-center gap-2 p-1.5 bg-slate-800/90 rounded-xl border border-amber-400/40 shadow-md shrink-0">
                          <svg
                            viewBox="0 0 100 70"
                            className="w-10 h-7 rounded shadow-xs"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-label="Bandeira do Brasil"
                          >
                            <rect width="100" height="70" fill="#009c3b" rx="4" />
                            <polygon points="50,6 92,35 50,64 8,35" fill="#ffdf00" />
                            <circle cx="50" cy="35" r="17.5" fill="#002776" />
                            <path d="M33,37 Q50,29 67,37" stroke="#ffffff" strokeWidth="2.5" fill="none" />
                          </svg>
                          <div className="text-left pr-1 hidden sm:block">
                            <span className="block text-[8px] font-black uppercase tracking-wider text-amber-400">Padrão Nacional</span>
                            <span className="block text-[7px] text-slate-300 font-medium">CFMV / MAPA</span>
                          </div>
                        </div>
                      </div>

                      {/* Composição Central: Insígnia Médica */}
                      <div className="my-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-center space-y-1 relative z-10 shadow-inner">
                        <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center mx-auto shadow-md">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white font-heading">
                          PROTEÇÃO IMUNOLÓGICA &bull; CONTROLE BIOMÉTRICO PERMANENTE
                        </h4>
                        <p className="text-[9.5px] text-slate-300 max-w-sm mx-auto leading-relaxed">
                          Histórico vacinal cronológico padronizado com espaços regulamentares de 45mm x 20mm para colagem dos selos originais dos frascos e quadro 42mm x 18mm para carimbo CRMV.
                        </p>
                      </div>

                      {/* Card de Identificação do Titular na Capa */}
                      <div className="bg-white text-slate-900 p-3 rounded-2xl border-2 border-amber-400/80 shadow-xl space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            {dogPhoto ? (
                              <img
                                src={dogPhoto}
                                alt={activeDog.name}
                                className="w-16 h-22 object-cover rounded-xl border-2 border-slate-300 shadow-sm"
                              />
                            ) : (
                              <div className="w-16 h-22 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-1 text-slate-400">
                                <Dog className="w-5 h-5 mb-0.5 text-slate-400" />
                                <span className="text-[7px] font-bold uppercase">Foto 3x4</span>
                              </div>
                            )}
                            <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] shadow-sm font-bold">
                              ✓
                            </span>
                          </div>

                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-sm font-black font-heading text-slate-950 uppercase truncate">
                                {activeDog.name}
                              </h4>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                                {activeDog.breed}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9.5px] text-slate-600">
                              <div>
                                <span className="text-slate-400 block text-[8.5px]">RGC Oficial:</span>
                                <strong className="font-mono text-[#E07A5F]">{rgcFormatted}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[8.5px]">Microchip ISO:</span>
                                <strong className="font-mono truncate block">{activeDog.microchip || 'NÃO MICROCHIPADO'}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[8.5px]">Tutor(a):</span>
                                <strong className="truncate block">{activeDog.tutorName}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[8.5px]">Emergência:</span>
                                <strong className="font-mono">{activeDog.tutorPhone}</strong>
                              </div>
                            </div>

                            <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-400">
                              <span>NASC: {activeDog.birthDate || '--/--/----'}</span>
                              <span>LOCAL: {activeDog.city}/{activeDog.state}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[8.5px] text-slate-500 leading-tight pt-1 border-t border-slate-100">
                          {MANDATORY_BOOKLET_LEGAL_CLAUSE}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ------------------------------------------------------- */}
                  {/* FOLHA 2: CARTEIRINHA 01 — LÂMINA INTERNA (16 SELOS: 8 ESQ + 8 DIR) */}
                  {/* ------------------------------------------------------- */}
                  <div className="sheet-page p-[6mm] bg-white text-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col md:flex-row relative min-h-[540px] print:min-h-0 print:border-none print:shadow-none">
                    {/* PÁGINA INTERNA ESQUERDA: DOSES 01 A 08 */}
                    <div className="sheet-half w-full md:w-1/2 pr-2 flex flex-col justify-between relative bg-white">
                      <div className="space-y-2">
                        {/* Header do Paciente */}
                        <div className="p-2 rounded-xl bg-slate-900 text-white space-y-0.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Syringe className="w-4 h-4 text-emerald-400" />
                              <strong className="uppercase">{activeDog.name}</strong>
                              <span className="text-slate-400 font-mono text-[10px]">({rgcFormatted})</span>
                            </div>
                            <span className="text-[9.5px] text-amber-400 font-mono font-bold">
                              CHIP: {activeDog.microchip || 'NÃO MICROCHIPADO'}
                            </span>
                          </div>
                          <p className="text-[8.5px] text-slate-400 font-mono truncate">
                            {RGC_OFFICIAL_SUBTITLE}
                          </p>
                        </div>

                        {/* Título da Seção */}
                        <div className="border-b border-slate-200 pb-1 flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-heading">
                              Série Primária &bull; Filhote &amp; Vacinas Essenciais (Doses 01 a 08)
                            </h4>
                            <p className="text-[10px] text-slate-500">
                              3 Colunas Horizontais: Dados (11px) + Selo 45mm x 20mm + Carimbo CRMV 42mm x 18mm
                            </p>
                          </div>
                          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            WSAVA 2024
                          </span>
                        </div>

                        {/* 8 Doses da Página Esquerda (3 Colunas Horizontais Lado a Lado) */}
                        <div className="space-y-1.5">
                          {booklet1Doses.slice(0, 8).map((item) => (
                            <div
                              key={item.number}
                              className="p-1.5 rounded-xl border border-slate-200 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] items-center gap-2"
                            >
                              {/* Coluna 1 (Esquerda): Fonte >= 11px */}
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-4.5 h-4.5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold font-mono shrink-0">
                                    {item.number}
                                  </span>
                                  <strong className="text-[11px] text-slate-900 block truncate">{item.title}</strong>
                                </div>
                                <span className="text-[11px] text-[#E07A5F] font-semibold block truncate">{item.phase}</span>
                                <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-700">
                                  <span>APL: <strong className="font-mono text-slate-900">{item.date}</strong></span>
                                  <span>PRÓX: <strong className="font-mono text-amber-700">{item.nextDate}</strong></span>
                                </div>
                              </div>

                              {/* Coluna 2 (Centro): Quadro Tracejado Oficial 45mm x 20mm */}
                              <div className="w-[45mm] h-[20mm] border-2 border-dashed border-slate-400 rounded-md flex flex-col items-center justify-center p-1 bg-white shadow-2xs text-center shrink-0">
                                <span className="text-[8px] font-bold text-slate-700 uppercase tracking-tight">
                                  SELO DO FRASCO
                                </span>
                                <span className="text-[7px] text-slate-400 font-mono">
                                  45mm x 20mm (Lote/Val.)
                                </span>
                                {item.lot && (
                                  <span className="text-[8px] font-mono text-emerald-700 font-bold mt-0.5">
                                    LOTE: {item.lot}
                                  </span>
                                )}
                              </div>

                              {/* Coluna 3 (Direita): Quadro Dedicado 42mm x 18mm ao lado do selo para Carimbo Físico & Rubrica CRMV */}
                              <div className="w-[42mm] h-[18mm] border border-slate-300 rounded-md flex flex-col items-center justify-center p-1 bg-white shadow-2xs text-center shrink-0">
                                <span className="text-[7.5px] font-bold text-slate-600 uppercase tracking-tight">
                                  CARIMBO FÍSICO &amp; CRMV
                                </span>
                                <span className="text-[6.5px] text-slate-400 font-mono">
                                  42mm x 18mm (Trodat 4911)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 space-y-0.5">
                        <p className="text-[8.5px] text-slate-500 leading-tight">
                          {MANDATORY_BOOKLET_LEGAL_CLAUSE}
                        </p>
                      </div>
                    </div>

                    {/* GUIA CENTRAL DE DOBRA (148.5mm) */}
                    <div className="hidden md:flex flex-col items-center justify-between py-4 w-0 relative z-20">
                      <div className="absolute inset-y-0 w-px border-l-2 border-dashed border-slate-300 dark:border-slate-700"></div>
                      <div className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold flex items-center gap-1 shadow-xs z-10 whitespace-nowrap">
                        <Scissors className="w-3 h-3 text-slate-500" />
                        <span>DOBRA CENTRAL • VINCLE AO MEIO</span>
                      </div>
                      <div className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold flex items-center gap-1 shadow-xs z-10 whitespace-nowrap">
                        <span>PADRÃO A5 (148.5mm) • SAFE ZONE 6mm</span>
                      </div>
                    </div>

                    {/* PÁGINA INTERNA DIREITA: DOSES 09 A 16 */}
                    <div className="sheet-half w-full md:w-1/2 pl-2 flex flex-col justify-between relative bg-white border-l border-slate-100">
                      <div className="space-y-2">
                        {/* Header do Tutor */}
                        <div className="p-2 rounded-xl bg-slate-900 text-white space-y-0.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Heart className="w-4 h-4 text-rose-400" />
                              <strong className="uppercase">{activeDog.tutorName}</strong>
                              <span className="text-slate-400 font-mono text-[10px]">({activeDog.tutorPhone})</span>
                            </div>
                            <span className="text-[9.5px] text-emerald-400 font-bold">
                              LOCAL: {activeDog.city}/{activeDog.state}
                            </span>
                          </div>
                          <p className="text-[8.5px] text-slate-400 font-mono truncate">
                            {RGC_OFFICIAL_SUBTITLE}
                          </p>
                        </div>

                        {/* Título da Seção Direita */}
                        <div className="border-b border-slate-200 pb-1 flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-heading">
                              Série Primária &amp; Transição Jovem (Doses 09 a 16)
                            </h4>
                            <p className="text-[10px] text-slate-500">
                              3 Colunas Horizontais: Dados (11px) + Selo 45mm x 20mm + Carimbo CRMV 42mm x 18mm
                            </p>
                          </div>
                          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            CFMV / MAPA
                          </span>
                        </div>

                        {/* 8 Doses da Página Direita (3 Colunas Horizontais Lado a Lado) */}
                        <div className="space-y-1.5">
                          {booklet1Doses.slice(8, 16).map((item) => (
                            <div
                              key={item.number}
                              className="p-1.5 rounded-xl border border-slate-200 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] items-center gap-2"
                            >
                              {/* Coluna 1 (Esquerda): Fonte >= 11px */}
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-4.5 h-4.5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold font-mono shrink-0">
                                    {item.number}
                                  </span>
                                  <strong className="text-[11px] text-slate-900 block truncate">{item.title}</strong>
                                </div>
                                <span className="text-[11px] text-emerald-700 font-semibold block truncate">{item.phase}</span>
                                <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-700">
                                  <span>APL: <strong className="font-mono text-slate-900">{item.date}</strong></span>
                                  <span>PRÓX: <strong className="font-mono text-amber-700">{item.nextDate}</strong></span>
                                </div>
                              </div>

                              {/* Coluna 2 (Centro): Quadro Tracejado Oficial 45mm x 20mm */}
                              <div className="w-[45mm] h-[20mm] border-2 border-dashed border-slate-400 rounded-md flex flex-col items-center justify-center p-1 bg-white shadow-2xs text-center shrink-0">
                                <span className="text-[8px] font-bold text-slate-700 uppercase tracking-tight">
                                  SELO DO FRASCO
                                </span>
                                <span className="text-[7px] text-slate-400 font-mono">
                                  45mm x 20mm (Lote/Val.)
                                </span>
                                {item.lot && (
                                  <span className="text-[8px] font-mono text-emerald-700 font-bold mt-0.5">
                                    LOTE: {item.lot}
                                  </span>
                                )}
                              </div>

                              {/* Coluna 3 (Direita): Quadro Dedicado 42mm x 18mm ao lado do selo para Carimbo Físico & Rubrica CRMV */}
                              <div className="w-[42mm] h-[18mm] border border-slate-300 rounded-md flex flex-col items-center justify-center p-1 bg-white shadow-2xs text-center shrink-0">
                                <span className="text-[7.5px] font-bold text-slate-600 uppercase tracking-tight">
                                  CARIMBO FÍSICO &amp; CRMV
                                </span>
                                <span className="text-[6.5px] text-slate-400 font-mono">
                                  42mm x 18mm (Trodat 4911)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 space-y-0.5">
                        <p className="text-[8.5px] text-slate-500 leading-tight">
                          {MANDATORY_BOOKLET_LEGAL_CLAUSE}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* CARTEIRINHA 02 (VOLUME 02 / 02 - REFORÇOS ADULTO & SÊNIOR) */}
              {/* ========================================================= */}
              {(bookletViewTab === 'all' || bookletViewTab === 'booklet2') && (
                <div className="space-y-6">
                  {/* Badge Identificador de Volume */}
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold print:hidden">
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                      <span>CARTEIRINHA 02 (VOLUME 02/02) • REFORÇOS ANUAIS ADULTO, SÊNIOR &amp; GERIATRIA (16 DOSES)</span>
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded-md">
                      2 LÂMINAS A4 PAISAGEM &bull; DOBRADO A5
                    </span>
                  </div>

                  {/* ------------------------------------------------------- */}
                  {/* FOLHA 3: CARTEIRINHA 02 — LÂMINA EXTERNA (CONTRACAPA + CAPA) */}
                  {/* ------------------------------------------------------- */}
                  <div className="sheet-page p-[6mm] bg-white rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col md:flex-row relative min-h-[540px] print:min-h-0 print:border-none print:shadow-none">
                    {/* CONTRACAPA (Metade Esquerda: 148.5mm) */}
                    <div className="sheet-half w-full md:w-1/2 p-5 flex flex-col justify-between relative bg-slate-50 overflow-hidden rounded-l-xl">
                      {/* Fundo com Cães Felizes Brincando */}
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-multiply pointer-events-none select-none"
                        style={{
                          backgroundImage: `url('https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80')`,
                        }}
                      />

                      {/* Conteúdo da Contracapa */}
                      <div className="relative z-10 backdrop-blur-xs bg-white/92 dark:bg-slate-900/92 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-sm">
                        <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                          <span className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block font-mono leading-tight">
                            {RGC_OFFICIAL_SUBTITLE}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white font-heading mt-0.5">
                            Controle Sanitário Permanente, Leishmaniose &amp; Geriatria Canina
                          </h4>
                          <p className="text-[10px] text-slate-500">
                            Diretrizes WSAVA 2024 &bull; Nota Técnica MAPA Maio/2023
                          </p>
                        </div>

                        {/* Regras para Vida Adulta / Sênior */}
                        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-tight">
                              <strong>Reforços de Vida Adulta:</strong> Manter o reforço anual das vacinas essenciais (Polivalente e Raiva) por toda a vida para sustentar a memória humoral.
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-tight">
                              <strong>Prevenção de Leishmaniose:</strong> Priorizar coleiras repelentes e exames periódicos conforme norma do MAPA diante de áreas com flebótomos.
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-tight">
                              <strong>Desparasitação Contínua:</strong> Vermifugação preventiva a cada 3 a 6 meses e proteção rigorosa contra ectoparasitas (pulgas e carrapatos).
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-tight">
                              <strong>Geriatria Canina:</strong> Cães idosos (&ge; 7 anos) requerem acompanhamento semestral, monitoramento renal/hepático e profilaxias personalizadas.
                            </p>
                          </div>
                        </div>

                        {/* QR Code de Autenticidade e Prontuário */}
                        <div className="p-2.5 bg-emerald-500/10 dark:bg-emerald-950/30 rounded-xl border border-emerald-300 dark:border-emerald-800 flex items-center gap-3">
                          <div className="p-1.5 bg-white rounded-lg border border-emerald-200 shrink-0 shadow-xs">
                            <QrCodeSvg value={scanUrl} size={64} />
                          </div>
                          <div className="space-y-0.5 text-xs">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>VERIFICAÇÃO DIGITAL DO PRONTUÁRIO</span>
                            </div>
                            <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-snug">
                              Histórico de reforços da vida adulta e sênior sincronizados ao prontuário CanisTech.
                            </p>
                            <p className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
                              RGC: <strong>{rgcFormatted}</strong>
                            </p>
                            <p className="text-[8px] font-mono text-emerald-700 dark:text-emerald-400 truncate max-w-[210px]">
                              {securityHash}
                            </p>
                          </div>
                        </div>

                        {/* Rodapé Legal Obrigatório CFMV / CDC */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                          <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-snug">
                            {MANDATORY_BOOKLET_LEGAL_CLAUSE}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* GUIA CENTRAL DE DOBRA (148.5mm) */}
                    <div className="hidden md:flex flex-col items-center justify-between py-4 w-0 relative z-20">
                      <div className="absolute inset-y-0 w-px border-l-2 border-dashed border-slate-300 dark:border-slate-700"></div>
                      <div className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold flex items-center gap-1 shadow-xs z-10 whitespace-nowrap">
                        <Scissors className="w-3 h-3 text-slate-500" />
                        <span>DOBRA CENTRAL • VINCLE AO MEIO</span>
                      </div>
                      <div className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold flex items-center gap-1 shadow-xs z-10 whitespace-nowrap">
                        <span>PADRÃO A5 (148.5mm) • SAFE ZONE 6mm</span>
                      </div>
                    </div>

                    {/* CAPA FRONTAL (Metade Direita: 148.5mm) */}
                    <div className="sheet-half w-full md:w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-5 sm:p-6 flex flex-col justify-between relative border-l border-slate-800 rounded-r-xl">
                      {/* Moldura Dourada Interna */}
                      <div className="absolute inset-2 border-2 border-emerald-500/30 rounded-2xl pointer-events-none"></div>

                      {/* Topo da Capa: Títulos + BANDEIRA DO BRASIL VETORIAL */}
                      <div className="flex items-start justify-between gap-3 relative z-10">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 block font-mono leading-tight">
                            {RGC_OFFICIAL_SUBTITLE}
                          </span>
                          <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight leading-none text-white">
                            CARTEIRA OFICIAL DE VACINAÇÃO
                          </h2>
                          <h3 className="text-base sm:text-lg font-bold text-emerald-400 font-heading leading-tight">
                            &amp; IMUNIZAÇÃO CANINA
                          </h3>
                          <p className="text-[10.5px] text-emerald-300 font-medium">
                            Padrão Internacional WSAVA &bull; Diretrizes CFMV &amp; MAPA
                          </p>
                          <div className="pt-1">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950 shadow-md">
                              VOLUME 02 / 02 • REFORÇOS ANUAIS ADULTO &amp; SÊNIOR
                            </span>
                          </div>
                        </div>

                        {/* BANDEIRA DO BRASIL VETORIAL */}
                        <div className="flex items-center gap-2 p-1.5 bg-slate-800/90 rounded-xl border border-emerald-400/40 shadow-md shrink-0">
                          <svg
                            viewBox="0 0 100 70"
                            className="w-10 h-7 rounded shadow-xs"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-label="Bandeira do Brasil"
                          >
                            <rect width="100" height="70" fill="#009c3b" rx="4" />
                            <polygon points="50,6 92,35 50,64 8,35" fill="#ffdf00" />
                            <circle cx="50" cy="35" r="17.5" fill="#002776" />
                            <path d="M33,37 Q50,29 67,37" stroke="#ffffff" strokeWidth="2.5" fill="none" />
                          </svg>
                          <div className="text-left pr-1 hidden sm:block">
                            <span className="block text-[8px] font-black uppercase tracking-wider text-emerald-400">Padrão Nacional</span>
                            <span className="block text-[7px] text-slate-300 font-medium">CFMV / MAPA</span>
                          </div>
                        </div>
                      </div>

                      {/* Composição Central: Insígnia Médica */}
                      <div className="my-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-center space-y-1 relative z-10 shadow-inner">
                        <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center mx-auto shadow-md">
                          <Heart className="w-5 h-5 text-rose-400" />
                        </div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white font-heading">
                          VIDA ADULTA, SÊNIOR &bull; CONTROLE SANITÁRIO PERMANENTE
                        </h4>
                        <p className="text-[9.5px] text-slate-300 max-w-sm mx-auto leading-relaxed">
                          Histórico de imunização contínua para manutenção humoral anual, profilaxias de leishmaniose, controle parasitário e geriatria canina com espaços de 45mm x 20mm e CRMV 42mm x 18mm.
                        </p>
                      </div>

                      {/* Card de Identificação do Titular na Capa */}
                      <div className="bg-white text-slate-900 p-3 rounded-2xl border-2 border-emerald-400/80 shadow-xl space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            {dogPhoto ? (
                              <img
                                src={dogPhoto}
                                alt={activeDog.name}
                                className="w-16 h-22 object-cover rounded-xl border-2 border-slate-300 shadow-sm"
                              />
                            ) : (
                              <div className="w-16 h-22 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-1 text-slate-400">
                                <Dog className="w-5 h-5 mb-0.5 text-slate-400" />
                                <span className="text-[7px] font-bold uppercase">Foto 3x4</span>
                              </div>
                            )}
                            <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] shadow-sm font-bold">
                              ✓
                            </span>
                          </div>

                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-sm font-black font-heading text-slate-950 uppercase truncate">
                                {activeDog.name}
                              </h4>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                                {activeDog.breed}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9.5px] text-slate-600">
                              <div>
                                <span className="text-slate-400 block text-[8.5px]">RGC Oficial:</span>
                                <strong className="font-mono text-[#E07A5F]">{rgcFormatted}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[8.5px]">Microchip ISO:</span>
                                <strong className="font-mono truncate block">{activeDog.microchip || 'NÃO MICROCHIPADO'}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[8.5px]">Tutor(a):</span>
                                <strong className="truncate block">{activeDog.tutorName}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[8.5px]">Emergência:</span>
                                <strong className="font-mono">{activeDog.tutorPhone}</strong>
                              </div>
                            </div>

                            <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-400">
                              <span>NASC: {activeDog.birthDate || '--/--/----'}</span>
                              <span>LOCAL: {activeDog.city}/{activeDog.state}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[8.5px] text-slate-500 leading-tight pt-1 border-t border-slate-100">
                          {MANDATORY_BOOKLET_LEGAL_CLAUSE}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ------------------------------------------------------- */}
                  {/* FOLHA 4: CARTEIRINHA 02 — LÂMINA INTERNA (16 SELOS: 8 ESQ + 8 DIR) */}
                  {/* ------------------------------------------------------- */}
                  <div className="sheet-page p-[6mm] bg-white text-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col md:flex-row relative min-h-[540px] print:min-h-0 print:border-none print:shadow-none">
                    {/* PÁGINA INTERNA ESQUERDA: DOSES 17 A 24 */}
                    <div className="sheet-half w-full md:w-1/2 pr-2 flex flex-col justify-between relative bg-white">
                      <div className="space-y-2">
                        {/* Header do Paciente */}
                        <div className="p-2 rounded-xl bg-slate-900 text-white space-y-0.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Syringe className="w-4 h-4 text-emerald-400" />
                              <strong className="uppercase">{activeDog.name}</strong>
                              <span className="text-slate-400 font-mono text-[10px]">({rgcFormatted})</span>
                            </div>
                            <span className="text-[9.5px] text-amber-400 font-mono font-bold">
                              CHIP: {activeDog.microchip || 'NÃO MICROCHIPADO'}
                            </span>
                          </div>
                          <p className="text-[8.5px] text-slate-400 font-mono truncate">
                            {RGC_OFFICIAL_SUBTITLE}
                          </p>
                        </div>

                        {/* Título da Seção */}
                        <div className="border-b border-slate-200 pb-1 flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-heading">
                              Reforços Anuais &bull; Vida Adulta (Doses 17 a 24)
                            </h4>
                            <p className="text-[10px] text-slate-500">
                              3 Colunas Horizontais: Dados (11px) + Selo 45mm x 20mm + Carimbo CRMV 42mm x 18mm
                            </p>
                          </div>
                          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            WSAVA 2024
                          </span>
                        </div>

                        {/* 8 Doses da Página Esquerda (3 Colunas Horizontais Lado a Lado) */}
                        <div className="space-y-1.5">
                          {booklet2Doses.slice(0, 8).map((item) => (
                            <div
                              key={item.number}
                              className="p-1.5 rounded-xl border border-slate-200 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] items-center gap-2"
                            >
                              {/* Coluna 1 (Esquerda): Fonte >= 11px */}
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-4.5 h-4.5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold font-mono shrink-0">
                                    {item.number}
                                  </span>
                                  <strong className="text-[11px] text-slate-900 block truncate">{item.title}</strong>
                                </div>
                                <span className="text-[11px] text-[#E07A5F] font-semibold block truncate">{item.phase}</span>
                                <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-700">
                                  <span>APL: <strong className="font-mono text-slate-900">{item.date}</strong></span>
                                  <span>PRÓX: <strong className="font-mono text-amber-700">{item.nextDate}</strong></span>
                                </div>
                              </div>

                              {/* Coluna 2 (Centro): Quadro Tracejado Oficial 45mm x 20mm */}
                              <div className="w-[45mm] h-[20mm] border-2 border-dashed border-slate-400 rounded-md flex flex-col items-center justify-center p-1 bg-white shadow-2xs text-center shrink-0">
                                <span className="text-[8px] font-bold text-slate-700 uppercase tracking-tight">
                                  SELO DO FRASCO
                                </span>
                                <span className="text-[7px] text-slate-400 font-mono">
                                  45mm x 20mm (Lote/Val.)
                                </span>
                                {item.lot && (
                                  <span className="text-[8px] font-mono text-emerald-700 font-bold mt-0.5">
                                    LOTE: {item.lot}
                                  </span>
                                )}
                              </div>

                              {/* Coluna 3 (Direita): Quadro Dedicado 42mm x 18mm ao lado do selo para Carimbo Físico & Rubrica CRMV */}
                              <div className="w-[42mm] h-[18mm] border border-slate-300 rounded-md flex flex-col items-center justify-center p-1 bg-white shadow-2xs text-center shrink-0">
                                <span className="text-[7.5px] font-bold text-slate-600 uppercase tracking-tight">
                                  CARIMBO FÍSICO &amp; CRMV
                                </span>
                                <span className="text-[6.5px] text-slate-400 font-mono">
                                  42mm x 18mm (Trodat 4911)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 space-y-0.5">
                        <p className="text-[8.5px] text-slate-500 leading-tight">
                          {MANDATORY_BOOKLET_LEGAL_CLAUSE}
                        </p>
                      </div>
                    </div>

                    {/* GUIA CENTRAL DE DOBRA (148.5mm) */}
                    <div className="hidden md:flex flex-col items-center justify-between py-4 w-0 relative z-20">
                      <div className="absolute inset-y-0 w-px border-l-2 border-dashed border-slate-300 dark:border-slate-700"></div>
                      <div className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold flex items-center gap-1 shadow-xs z-10 whitespace-nowrap">
                        <Scissors className="w-3 h-3 text-slate-500" />
                        <span>DOBRA CENTRAL • VINCLE AO MEIO</span>
                      </div>
                      <div className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold flex items-center gap-1 shadow-xs z-10 whitespace-nowrap">
                        <span>PADRÃO A5 (148.5mm) • SAFE ZONE 6mm</span>
                      </div>
                    </div>

                    {/* PÁGINA INTERNA DIREITA: DOSES 25 A 32 */}
                    <div className="sheet-half w-full md:w-1/2 pl-2 flex flex-col justify-between relative bg-white border-l border-slate-100">
                      <div className="space-y-2">
                        {/* Header do Tutor */}
                        <div className="p-2 rounded-xl bg-slate-900 text-white space-y-0.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Heart className="w-4 h-4 text-rose-400" />
                              <strong className="uppercase">{activeDog.tutorName}</strong>
                              <span className="text-slate-400 font-mono text-[10px]">({activeDog.tutorPhone})</span>
                            </div>
                            <span className="text-[9.5px] text-emerald-400 font-bold">
                              LOCAL: {activeDog.city}/{activeDog.state}
                            </span>
                          </div>
                          <p className="text-[8.5px] text-slate-400 font-mono truncate">
                            {RGC_OFFICIAL_SUBTITLE}
                          </p>
                        </div>

                        {/* Título da Seção Direita */}
                        <div className="border-b border-slate-200 pb-1 flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-heading">
                              Reforços Sênior &amp; Ocasiões Especiais (Doses 25 a 32)
                            </h4>
                            <p className="text-[10px] text-slate-500">
                              3 Colunas Horizontais: Dados (11px) + Selo 45mm x 20mm + Carimbo CRMV 42mm x 18mm
                            </p>
                          </div>
                          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            CFMV / MAPA
                          </span>
                        </div>

                        {/* 8 Doses da Página Direita (3 Colunas Horizontais Lado a Lado) */}
                        <div className="space-y-1.5">
                          {booklet2Doses.slice(8, 16).map((item) => (
                            <div
                              key={item.number}
                              className="p-1.5 rounded-xl border border-slate-200 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] items-center gap-2"
                            >
                              {/* Coluna 1 (Esquerda): Fonte >= 11px */}
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-4.5 h-4.5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold font-mono shrink-0">
                                    {item.number}
                                  </span>
                                  <strong className="text-[11px] text-slate-900 block truncate">{item.title}</strong>
                                </div>
                                <span className="text-[11px] text-emerald-700 font-semibold block truncate">{item.phase}</span>
                                <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-700">
                                  <span>APL: <strong className="font-mono text-slate-900">{item.date}</strong></span>
                                  <span>PRÓX: <strong className="font-mono text-amber-700">{item.nextDate}</strong></span>
                                </div>
                              </div>

                              {/* Coluna 2 (Centro): Quadro Tracejado Oficial 45mm x 20mm */}
                              <div className="w-[45mm] h-[20mm] border-2 border-dashed border-slate-400 rounded-md flex flex-col items-center justify-center p-1 bg-white shadow-2xs text-center shrink-0">
                                <span className="text-[8px] font-bold text-slate-700 uppercase tracking-tight">
                                  SELO DO FRASCO
                                </span>
                                <span className="text-[7px] text-slate-400 font-mono">
                                  45mm x 20mm (Lote/Val.)
                                </span>
                                {item.lot && (
                                  <span className="text-[8px] font-mono text-emerald-700 font-bold mt-0.5">
                                    LOTE: {item.lot}
                                  </span>
                                )}
                              </div>

                              {/* Coluna 3 (Direita): Quadro Dedicado 42mm x 18mm ao lado do selo para Carimbo Físico & Rubrica CRMV */}
                              <div className="w-[42mm] h-[18mm] border border-slate-300 rounded-md flex flex-col items-center justify-center p-1 bg-white shadow-2xs text-center shrink-0">
                                <span className="text-[7.5px] font-bold text-slate-600 uppercase tracking-tight">
                                  CARIMBO FÍSICO &amp; CRMV
                                </span>
                                <span className="text-[6.5px] text-slate-400 font-mono">
                                  42mm x 18mm (Trodat 4911)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 space-y-0.5">
                        <p className="text-[8.5px] text-slate-500 leading-tight">
                          {MANDATORY_BOOKLET_LEGAL_CLAUSE}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL DE PRÉ-VISUALIZAÇÃO DE IMPRESSÃO EMBUTIDO (WEBVIEW / ELECTRON) */}
      {/* ============================================================= */}
      {bookletPrintPreviewBlobUrl && (
        <div className="fixed inset-0 z-[70] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-6xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <Printer className="w-4 h-4 text-emerald-500" />
                  <span>Pré-Visualização de Impressão A4 Paisagem • Carteirinhas 01 e 02 ({activeDog.name})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  4 Lâminas A4 Paisagem (297mm x 210mm) com Safe Zone de 6mm, Selos 45x20mm e Carimbos CRMV 42x18mm lado a lado.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintFromEmbeddedIframe}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                  <span>Imprimir Agora</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadBookletPdf}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Baixar PDF A4</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBookletPrintPreviewBlobUrl(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <iframe
              ref={bookletPrintIframeRef}
              src={bookletPrintPreviewBlobUrl}
              title="Pré-Visualização de Impressão Carteirinhas A4"
              className="w-full h-[78vh] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100"
            />
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 3: REGISTRO DE APLICAÇÃO DE DOSE */}
      {/* ============================================================= */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white font-heading">
                Registrar Aplicação de Vacina
              </h3>
              <button
                onClick={() => setShowApplyModal(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-600">
                  {showApplyModal.category}
                </span>
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  {showApplyModal.name}
                </p>
                <p className="text-slate-500 text-[11px]">{showApplyModal.doseLabel} • {showApplyModal.phaseCode}</p>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Data da Aplicação:
                </label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  id="apply-date-input"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Lote do Fabricante / Selo:
                </label>
                <input
                  type="text"
                  placeholder="Ex: LT-V10-9842"
                  id="apply-lot-input"
                  defaultValue={showApplyModal.lot || ''}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Veterinário(a) e CRMV:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Dr(a). Camila Ramos - CRMV-SP 41.289"
                  id="apply-vet-input"
                  defaultValue={showApplyModal.veterinarianCrmv || ''}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const dateVal = (document.getElementById('apply-date-input') as HTMLInputElement)?.value;
                    const lotVal = sanitizeXss((document.getElementById('apply-lot-input') as HTMLInputElement)?.value || '');
                    const vetVal = sanitizeXss((document.getElementById('apply-vet-input') as HTMLInputElement)?.value || '');

                    persistCompletedDose(showApplyModal.id, true);

                    if (onAddVaccine) {
                      onAddVaccine({
                        id: 'v-' + Date.now(),
                        dogId: activeDog.id,
                        name: showApplyModal.name,
                        description: showApplyModal.purpose,
                        manufacturer: showApplyModal.manufacturer || 'Zoetis / MSD',
                        lot: lotVal || 'LT-MANUAL',
                        lastDate: dateVal ? dateVal.split('-').reverse().join('/') : new Date().toLocaleDateString('pt-BR'),
                        nextDate: showApplyModal.dueDate,
                        daysRemaining: showApplyModal.daysUntilDue,
                        status: 'valid',
                        category: 'vacina',
                        clinic: 'Hospital Veterinário Pet Care',
                        veterinarianCrmv: vetVal || 'CRMV-SP 41.289',
                        reminderScheduled: true,
                      });
                    }

                    setShowApplyModal(null);
                    triggerToast(`✓ Dose de "${showApplyModal.name}" registrada com sucesso na carteira!`);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Salvar Aplicação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
