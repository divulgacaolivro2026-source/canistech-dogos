import React, { useState, useMemo, useEffect } from 'react';
import { DogProfile, WeightRecord, VaccineRecord, DailyActivityRecord } from '../types';
import { INITIAL_ACTIVITY_HISTORY } from '../data/mockData';
import { DogActivityReport } from './DogActivityReport';
import {
  calculateVaccineProximity,
  getVaccineUrgencySummary,
  formatDateBR,
  parseDateBR,
  getRelativeDateStr,
  VaccineWithProximity,
  VaccineUrgency,
  playNotificationChime,
  requestPushNotificationPermission,
  getPushPermissionStatus,
  dispatchBrowserNotification,
  generateVaccine7dEmailContent,
} from '../utils/vaccineUtils';
import { generateAndDownloadOfficialRgCard } from '../utils/rgCardPdfGenerator';
import {
  QrCode,
  Download,
  Calendar,
  Utensils,
  Activity,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  PhoneCall,
  Clock,
  Sparkles,
  ChevronRight,
  Plus,
  Dog,
  CheckCircle2,
  Send,
  Droplet,
  ExternalLink,
  Heart,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  Scale,
  Maximize2,
  Minimize2,
  Table,
  LineChart as LineChartIcon,
  Info,
  Bell,
  BellRing,
  ShieldAlert,
  AlertCircle,
  Syringe,
  MessageCircle,
  CalendarClock,
  X,
  Filter,
  Mail,
  Smartphone,
  Volume2,
  Check,
  CheckCheck,
  Eye,
  Sliders,
  Footprints,
  Brain,
  Stethoscope,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';

interface DogOSDashboardProps {
  dog?: DogProfile | null;
  dogs?: DogProfile[];
  weightHistory: WeightRecord[];
  vaccines: VaccineRecord[];
  activityHistory?: DailyActivityRecord[];
  onAddWeight: (weight: number, date: string, note?: string) => void;
  onAddActivity?: (record: DailyActivityRecord) => void;
  onNavigateToReport: () => void;
  onNavigateToToxicity: () => void;
  onOpenVetChat: (initialQuery?: string) => void;
  onNavigateToDonation?: () => void;
  onNavigateToEncyclopedia?: () => void;
  onUpdateVaccine?: (vaccine: VaccineRecord) => void;
  onAddVaccine?: (vaccine: VaccineRecord) => void;
  onOpenRegisterDog?: () => void;
}

export const DogOSDashboard: React.FC<DogOSDashboardProps> = ({
  dog,
  dogs = [],
  weightHistory,
  vaccines,
  activityHistory,
  onAddWeight,
  onAddActivity,
  onNavigateToReport,
  onNavigateToToxicity,
  onOpenVetChat,
  onNavigateToDonation,
  onNavigateToEncyclopedia,
  onUpdateVaccine,
  onAddVaccine,
  onOpenRegisterDog,
}) => {
  // Empty State if no dog is active or registered
  if (!dog) {
    return (
      <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-12 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-orange-50 dark:bg-orange-950/50 text-[#E07A5F] flex items-center justify-center mx-auto border border-orange-200 dark:border-orange-800/60 shadow-inner">
            <Dog className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E07A5F] bg-orange-100 dark:bg-orange-950/60 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800/60">
              SISTEMA INTEGRADO DE GESTÃO BIOMÉTRICA & HISTÓRICO DO PET
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-slate-900 dark:text-white">
              Nenhum Cão Cadastrado no DogOS
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
              Inicie o gerenciamento biométrico, histórico preventivo de vacinação e emissão do Registro Geral Canino (RGC Oficial) cadastrando seu primeiro pet.
            </p>
          </div>

          <div className="pt-2">
            {onOpenRegisterDog && (
              <button
                onClick={onOpenRegisterDog}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-2xl text-sm font-bold shadow-md transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Cadastrar Meu Primeiro Cão no DogOS</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 text-left text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
              <strong className="text-slate-800 dark:text-slate-200 block">Identificação RGC</strong>
              <p className="text-[11px] text-slate-500">Cédula Oficial no padrão nacional com Frente, Verso e QR Code.</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
              <strong className="text-slate-800 dark:text-slate-200 block">Alertas Preventivos</strong>
              <p className="text-[11px] text-slate-500">Avisos automáticos de 7 dias antes do vencimento vacinal.</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
              <strong className="text-slate-800 dark:text-slate-200 block">Curva Ponderal</strong>
              <p className="text-[11px] text-slate-500">Acompanhamento de peso ideal e escore corporal WSAVA.</p>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
            * A plataforma CanisTech atua na gestão biométrica e histórico de rotina do pet e jamais substitui o atendimento médico-veterinário presencial.
          </p>
        </div>
      </div>
    );
  }
  // Activity tracking local state
  const [activities, setActivities] = useState<DailyActivityRecord[]>(
    () => activityHistory || INITIAL_ACTIVITY_HISTORY
  );

  useEffect(() => {
    if (activityHistory && activityHistory.length > 0) {
      setActivities(activityHistory);
    }
  }, [activityHistory]);

  const handleAddActivityLocal = (record: DailyActivityRecord) => {
    setActivities((prev) => [record, ...prev]);
    if (onAddActivity) {
      onAddActivity(record);
    }
    triggerToast(`Exercício diário de ${dog.name} registrado com sucesso!`);
  };

  // Interactive UI states
  const [selectedBcs, setSelectedBcs] = useState<number>(dog.bcsScore);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showWeightModal, setShowWeightModal] = useState<boolean>(false);
  const [showReminderModal, setShowReminderModal] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);

  // New weight modal form state
  const [newWeightInput, setNewWeightInput] = useState<string>(dog.currentWeight.toString());
  const [newWeightNote, setNewWeightNote] = useState<string>('');

  // Exercise completed progress toggle
  const [exerciseCompleted, setExerciseCompleted] = useState<boolean>(false);

  // AI chat quick input
  const [quickAiInput, setQuickAiInput] = useState<string>('');

  // Recharts interactive weight graph states
  const [weightPeriod, setWeightPeriod] = useState<'all' | '6m' | '3m'>('all');
  const [showIdealRange, setShowIdealRange] = useState<boolean>(true);
  const [showAverage, setShowAverage] = useState<boolean>(false);
  const [chartViewMode, setChartViewMode] = useState<'chart' | 'table'>('chart');
  const [isChartExpanded, setIsChartExpanded] = useState<boolean>(false);

  // Vaccine proximity notification system states
  const [showNotificationDrawer, setShowNotificationDrawer] = useState<boolean>(false);
  const [dismissedBanner, setDismissedBanner] = useState<boolean>(false);
  const [simulatedDateOffsetDays, setSimulatedDateOffsetDays] = useState<number>(0);
  const [vaccineFilterTab, setVaccineFilterTab] = useState<'all' | 'urgent' | 'safe'>('all');
  const [showApplyVaccineModal, setShowApplyVaccineModal] = useState<VaccineWithProximity | null>(null);
  const [showAddVaccineModal, setShowAddVaccineModal] = useState<boolean>(false);

  // Form states for applying vaccine
  const [appliedLotInput, setAppliedLotInput] = useState<string>('');
  const [appliedClinicInput, setAppliedClinicInput] = useState<string>('');
  const [appliedDateInput, setAppliedDateInput] = useState<string>('');

  // Form states for adding new vaccine
  const [newVacName, setNewVacName] = useState<string>('');
  const [newVacCategory, setNewVacCategory] = useState<'vacina' | 'antiparasitario' | 'vermifugo' | 'outro'>('vacina');
  const [newVacManufacturer, setNewVacManufacturer] = useState<string>('');
  const [newVacLot, setNewVacLot] = useState<string>('');
  const [newVacLastDate, setNewVacLastDate] = useState<string>('');
  const [newVacNextDate, setNewVacNextDate] = useState<string>('');
  const [newVacDesc, setNewVacDesc] = useState<string>('');

  // 7-Day Vaccine Reminder Scheduling System States (E-mail & Push Notifications)
  const [reminderEmail, setReminderEmail] = useState<string>(
    dog.tutorEmail || 'camila.tutor@canistech.com.br'
  );
  const [reminderEmailEnabled, setReminderEmailEnabled] = useState<boolean>(true);
  const [reminderPushEnabled, setReminderPushEnabled] = useState<boolean>(true);
  const [reminderSoundEnabled, setReminderSoundEnabled] = useState<boolean>(true);
  const [reminder24hEnabled, setReminder24hEnabled] = useState<boolean>(true);
  const [pushPermission, setPushPermission] = useState<'granted' | 'denied' | 'default' | 'unsupported'>(() =>
    getPushPermissionStatus()
  );
  const [disabledReminderVacIds, setDisabledReminderVacIds] = useState<string[]>([]);
  const [reminderModalTab, setReminderModalTab] = useState<'schedule' | 'channels' | 'preview'>('schedule');
  const [previewEmailVaccine, setPreviewEmailVaccine] = useState<VaccineWithProximity | null>(null);
  const [simulatedPushAlert, setSimulatedPushAlert] = useState<{
    title: string;
    body: string;
    time: string;
    vacName: string;
  } | null>(null);

  // Reference date (real current date or simulated offset for testing)
  const referenceDate = useMemo(() => {
    const d = new Date();
    if (simulatedDateOffsetDays !== 0) {
      d.setDate(d.getDate() + simulatedDateOffsetDays);
    }
    return d;
  }, [simulatedDateOffsetDays]);

  const formattedReferenceDate = useMemo(() => {
    return formatDateBR(referenceDate);
  }, [referenceDate]);

  // Compute live proximity metrics for all vaccines of current dog based on current date
  const processedVaccines = useMemo(() => {
    const dogVacs = vaccines.filter((v) => !v.dogId || v.dogId === dog.id);
    const list = dogVacs.length > 0 ? dogVacs : vaccines;
    return list.map((v) => calculateVaccineProximity(v, referenceDate));
  }, [vaccines, dog.id, referenceDate]);

  // 7-Day reminder schedule calculations
  const scheduledVaccinesCount = useMemo(() => {
    return processedVaccines.filter((v) => !disabledReminderVacIds.includes(v.id)).length;
  }, [processedVaccines, disabledReminderVacIds]);

  const triggered7dAlerts = useMemo(() => {
    return processedVaccines.filter((v) => v.is7dAlertActive && !disabledReminderVacIds.includes(v.id));
  }, [processedVaccines, disabledReminderVacIds]);

  // Urgency summary counts
  const vaccineSummary = useMemo(() => {
    return getVaccineUrgencySummary(processedVaccines);
  }, [processedVaccines]);

  // Filtered vaccines for Module 3 display
  const filteredVaccines = useMemo(() => {
    if (vaccineFilterTab === 'urgent') {
      return processedVaccines.filter(
        (v) => v.urgency === 'overdue' || v.urgency === 'imminent' || v.urgency === 'upcoming'
      );
    }
    if (vaccineFilterTab === 'safe') {
      return processedVaccines.filter((v) => v.urgency === 'safe');
    }
    return processedVaccines;
  }, [processedVaccines, vaccineFilterTab]);

  // Filter weight records for the active dog
  const dogWeightHistory = useMemo(() => {
    const matching = weightHistory.filter((w) => w.dogId === dog.id);
    if (matching.length > 0) return matching;

    if (dog.id === 'dog-thor') {
      const legacy = weightHistory.filter((w) => !w.dogId || w.dogId === 'dog-thor');
      if (legacy.length > 0) return legacy;
    }

    return [
      {
        id: `w-${dog.id}-init`,
        dogId: dog.id,
        date: dog.birthDate ? new Date(dog.birthDate).toLocaleDateString('pt-BR') : '01/01/2025',
        weight: dog.currentWeight,
        note: 'Peso inicial registrado no cadastro DogOS',
      },
    ];
  }, [weightHistory, dog.id, dog.currentWeight, dog.birthDate]);

  // Formatted data points for Recharts
  const chartData = useMemo(() => {
    let list = [...dogWeightHistory];
    if (weightPeriod === '3m' && list.length > 3) {
      list = list.slice(-3);
    } else if (weightPeriod === '6m' && list.length > 6) {
      list = list.slice(-6);
    }

    return list.map((item, index) => {
      const prev = index > 0 ? list[index - 1] : null;
      const delta = prev ? Number((item.weight - prev.weight).toFixed(2)) : 0;

      let status: 'ideal' | 'abaixo' | 'acima' = 'ideal';
      if (item.weight < dog.idealWeightMin) status = 'abaixo';
      else if (item.weight > dog.idealWeightMax) status = 'acima';

      const parts = item.date.split('/');
      const shortDate = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : item.date;

      return {
        id: item.id,
        rawDate: item.date,
        shortDate,
        weight: item.weight,
        note: item.note || '',
        delta,
        status,
        idealMin: dog.idealWeightMin,
        idealMax: dog.idealWeightMax,
      };
    });
  }, [dogWeightHistory, weightPeriod, dog.idealWeightMin, dog.idealWeightMax]);

  // Biometric statistics
  const initialWeight = dogWeightHistory[0]?.weight ?? dog.currentWeight;
  const currentRecordedWeight = dogWeightHistory[dogWeightHistory.length - 1]?.weight ?? dog.currentWeight;
  const totalWeightDelta = Number((currentRecordedWeight - initialWeight).toFixed(2));
  const totalWeightDeltaPercent =
    initialWeight > 0 ? Number(((totalWeightDelta / initialWeight) * 100).toFixed(1)) : 0;

  const averagePeriodWeight = useMemo(() => {
    if (chartData.length === 0) return dog.currentWeight;
    const sum = chartData.reduce((acc, curr) => acc + curr.weight, 0);
    return Number((sum / chartData.length).toFixed(1));
  }, [chartData, dog.currentWeight]);

  // Dynamic Y domain with padding
  const { yDomainMin, yDomainMax } = useMemo(() => {
    if (chartData.length === 0) {
      return {
        yDomainMin: Math.max(0, Math.floor(dog.idealWeightMin - 2)),
        yDomainMax: Math.ceil(dog.idealWeightMax + 2),
      };
    }
    const allWeights = chartData.map((d) => d.weight);
    const minVal = Math.min(...allWeights, dog.idealWeightMin);
    const maxVal = Math.max(...allWeights, dog.idealWeightMax);
    const padding = Math.max(0.6, (maxVal - minVal) * 0.15);
    return {
      yDomainMin: Math.max(0, Number((minVal - padding).toFixed(1))),
      yDomainMax: Number((maxVal + padding).toFixed(1)),
    };
  }, [chartData, dog.idealWeightMin, dog.idealWeightMax]);

  const CustomWeightTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    const isLatest = data.id === chartData[chartData.length - 1]?.id;

    return (
      <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-2xl border border-slate-700/80 text-xs backdrop-blur-md min-w-[210px] z-50 animate-in fade-in duration-100">
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-slate-300 font-semibold text-[11px]">{data.rawDate}</span>
          </div>
          {isLatest && (
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/30">
              Mais recente
            </span>
          )}
        </div>

        <div className="py-2 flex items-baseline justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Peso Registrado</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-white tracking-tight">
                {data.weight.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-medium">kg</span>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                data.status === 'ideal'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : data.status === 'abaixo'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {data.status === 'ideal' ? '✓ Faixa Ideal' : data.status === 'abaixo' ? '↓ Abaixo' : '↑ Sobrepeso'}
            </span>
            {data.delta !== 0 && (
              <p
                className={`text-[10px] font-mono mt-0.5 flex items-center justify-end gap-0.5 ${
                  data.delta > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {data.delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>
                  {data.delta > 0 ? `+${data.delta.toFixed(1)} kg` : `${data.delta.toFixed(1)} kg`}
                </span>
              </p>
            )}
          </div>
        </div>

        {data.note && (
          <div className="p-1.5 bg-slate-800/80 rounded-lg text-[10px] text-slate-300 italic border border-slate-700/50 mb-1.5">
            "{data.note}"
          </div>
        )}

        <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Padrão da raça:</span>
          <span className="text-slate-300 font-semibold">{data.idealMin} - {data.idealMax} kg</span>
        </div>
      </div>
    );
  };

  const renderCustomDot = (dotProps: any) => {
    const { cx, cy, payload } = dotProps;
    if (!cx || !cy || !payload) return null;
    const isLatest = payload.id === chartData[chartData.length - 1]?.id;

    if (isLatest) {
      return (
        <g key={`dot-${payload.id}`}>
          <circle cx={cx} cy={cy} r={7} fill="#2A9D8F" fillOpacity={0.3} className="animate-pulse" />
          <circle cx={cx} cy={cy} r={5} fill="#2A9D8F" stroke="#ffffff" strokeWidth={2} />
          <circle cx={cx} cy={cy} r={2} fill="#ffffff" />
        </g>
      );
    }

    return (
      <circle
        key={`dot-${payload.id}`}
        cx={cx}
        cy={cy}
        r={3.5}
        fill="#0F172A"
        stroke="#ffffff"
        strokeWidth={1.5}
      />
    );
  };

  const triggerToast = (msg: string) => {
    setShowSuccessToast(msg);
    setTimeout(() => setShowSuccessToast(null), 3500);
  };

  // WSAVA BCS Scale labels and descriptions
  const getBcsInfo = (score: number) => {
    switch (score) {
      case 1:
      case 2:
        return { label: 'Caquético / Muito Magro', color: 'text-amber-700 bg-amber-50', desc: 'Costelas, vértebras e ossos pélvicos visíveis sem gordura palpar. Risco de desnutrição.' };
      case 3:
        return { label: 'Abaixo do Ideal', color: 'text-amber-600 bg-amber-50', desc: 'Costelas facilmente palpáveis com mínimo tecido adiposo. Silhueta acentuada.' };
      case 4:
      case 5:
        return { label: 'Escore Ideal (Ótimo)', color: 'text-emerald-700 bg-emerald-50', desc: 'Costelas facilmente palpáveis com fina cobertura de gordura. Cintura visível vista de cima e abdômen recolhido.' };
      case 6:
      case 7:
        return { label: 'Sobrepeso', color: 'text-orange-700 bg-orange-50', desc: 'Costelas palpáveis com leve pressão. Dobras de gordura no lombo e base da cauda.' };
      case 8:
      case 9:
      default:
        return { label: 'Obesidade Severa', color: 'text-red-700 bg-red-50', desc: 'Massa espessa de gordura sobre o tórax. Distensão abdominal e sobrecarga articular crítica.' };
    }
  };

  const activeBcs = getBcsInfo(selectedBcs);

  // Dynamic MER Calculation (Maintenance Energy Requirement): 70 * (weight)^0.75 * factor
  const calculateMer = (weight: number, bcs: number) => {
    const baseRer = 70 * Math.pow(weight, 0.75);
    let factor = 1.6; // adult intact
    if (dog.neutered) factor = 1.4;
    if (bcs > 5) factor -= 0.2; // weight loss deficit
    if (bcs < 4) factor += 0.2; // weight gain support
    return Math.round(baseRer * factor);
  };

  const currentMerKcal = calculateMer(dog.currentWeight, selectedBcs);

  const handleWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newWeightInput);
    if (!isNaN(val) && val > 0) {
      const today = new Date().toLocaleDateString('pt-BR');
      onAddWeight(val, today, newWeightNote || 'Pesagem manual tutor');
      setShowWeightModal(false);
      setNewWeightNote('');
      triggerToast(`Nova pesagem de ${val.toFixed(1)} kg registrada com sucesso no DogOS!`);
    }
  };

  const handleDownloadRgPdf = () => {
    triggerToast(`Gerando Carteira Oficial de Identidade Canina (RGC) de ${dog.name}...`);
    try {
      generateAndDownloadOfficialRgCard(dog);
      triggerToast(`✓ Cédula RGC de ${dog.name} gerada com sucesso para impressão!`);
    } catch (e) {
      console.error(e);
      triggerToast('Erro ao gerar documento PDF da carteirinha.');
    }
  };

  // Quick WhatsApp message trigger for vaccine renewal
  const handleSendVaccineWhatsApp = (vac: VaccineWithProximity) => {
    const text = encodeURIComponent(
      `🚨 *Lembrete Veterinário DogOS - ${dog.name}*\n\n` +
      `Olá! Gostaria de agendar a aplicação da dose preventiva:\n` +
      `• *Profilaxia:* ${vac.name}\n` +
      `• *Próxima Dose Prevista:* ${vac.nextDate} (${vac.urgencyLabel})\n` +
      `• *Fabricante/Lote:* ${vac.manufacturer} (Lote: ${vac.lot})\n` +
      `• *Paciente:* ${dog.name} (${dog.breed}, ${dog.currentWeight}kg)\n` +
      `• *Tutor(a):* ${dog.tutorName} - ${dog.tutorPhone}\n\n` +
      `Favor confirmar horários disponíveis para consulta/aplicação. Obrigado!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
    triggerToast(`Alerta de ${vac.name} pronto para envio via WhatsApp!`);
  };

  // Open apply dose modal
  const handleOpenApplyModal = (vac: VaccineWithProximity) => {
    setShowApplyVaccineModal(vac);
    setAppliedDateInput(formatDateBR(referenceDate));
    setAppliedLotInput(vac.lot || `LT-${Math.floor(1000 + Math.random() * 9000)}`);
    setAppliedClinicInput(vac.clinic || 'Hospital Veterinário Pet Care');
  };

  // Confirm dose application and update schedule
  const handleConfirmVaccineApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showApplyVaccineModal) return;

    const appDate = appliedDateInput || formatDateBR(referenceDate);
    const appDateObj = parseDateBR(appDate);

    let cycleDays = 365;
    if (showApplyVaccineModal.category === 'antiparasitario') cycleDays = 30;
    else if (showApplyVaccineModal.category === 'vermifugo') cycleDays = 90;

    const nextDateObj = new Date(appDateObj);
    nextDateObj.setDate(nextDateObj.getDate() + cycleDays);
    const nextDateStr = formatDateBR(nextDateObj);

    const updated: VaccineRecord = {
      ...showApplyVaccineModal,
      lastDate: appDate,
      nextDate: nextDateStr,
      lot: appliedLotInput.trim() || showApplyVaccineModal.lot,
      clinic: appliedClinicInput.trim() || showApplyVaccineModal.clinic,
      status: 'valid',
      daysRemaining: cycleDays,
    };

    if (onUpdateVaccine) {
      onUpdateVaccine(updated);
    }
    setShowApplyVaccineModal(null);
    triggerToast(`✓ Dose de "${updated.name}" registrada! Próximo reforço em ${nextDateStr}`);
  };

  // Add new vaccine submission
  const handleAddNewVaccineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVacName.trim()) return;

    const newVac: VaccineRecord = {
      id: `vac-${Date.now()}`,
      dogId: dog.id,
      name: newVacName.trim(),
      description: newVacDesc.trim() || 'Profilaxia preventiva cadastrada no prontuário.',
      manufacturer: newVacManufacturer.trim() || 'Laboratório Veterinário',
      lot: newVacLot.trim() || `LT-${Math.floor(1000 + Math.random() * 9000)}`,
      lastDate: newVacLastDate || formatDateBR(referenceDate),
      nextDate: newVacNextDate || getRelativeDateStr(365, referenceDate),
      daysRemaining: 365,
      status: 'valid',
      category: newVacCategory,
      clinic: 'Clínica Veterinária Morumbi',
    };

    if (onAddVaccine) {
      onAddVaccine(newVac);
    }
    setShowAddVaccineModal(false);
    setNewVacName('');
    setNewVacDesc('');
    setNewVacManufacturer('');
    setNewVacLot('');
    setNewVacLastDate('');
    setNewVacNextDate('');
    triggerToast(`Nova imunização "${newVac.name}" adicionada ao calendário!`);
  };

  // 7-Day Reminder System Handlers
  const handleRequestPushPermission = async () => {
    const res = await requestPushNotificationPermission();
    setPushPermission(res);
    if (res === 'granted') {
      if (reminderSoundEnabled) playNotificationChime();
      triggerToast('✓ Notificações Push autorizadas no seu navegador! Os lembretes de 7 dias serão entregues na tela.');
    } else if (res === 'denied') {
      triggerToast('Aviso: Permissão Push bloqueada no navegador. Habilite nas configurações do site para receber avisos.');
    } else {
      triggerToast('Modo Push Simulado ativo para demonstração.');
    }
  };

  const handleToggleVaccineReminder = (vacId: string) => {
    setDisabledReminderVacIds((prev) => {
      const exists = prev.includes(vacId);
      const updated = exists ? prev.filter((id) => id !== vacId) : [...prev, vacId];
      const vac = processedVaccines.find((v) => v.id === vacId);
      triggerToast(
        exists
          ? `✓ Lembrete de 7 dias agendado para "${vac?.name || 'vacina'}" (E-mail & Push)`
          : `Lembrete de 7 dias pausado para "${vac?.name || 'vacina'}"`
      );
      return updated;
    });
  };

  const handleTestDispatch7dReminder = (vac: VaccineWithProximity) => {
    if (reminderSoundEnabled) {
      playNotificationChime();
    }

    const title = `[DogOS CanisTech] 🔔 Alerta 7 Dias: ${vac.name}`;
    const body = `A dose da vacina ${vac.name} de ${dog.name} vence no dia ${vac.nextDate}. Agende o reforço com antecedência!`;

    let pushSent = false;
    if (reminderPushEnabled) {
      pushSent = dispatchBrowserNotification(title, {
        body,
        icon: dog.photoUrl,
      });

      setSimulatedPushAlert({
        title,
        body,
        time: 'Agora mesmo',
        vacName: vac.name,
      });
    }

    const channelsDesc = [
      reminderEmailEnabled ? `E-mail (${reminderEmail})` : null,
      reminderPushEnabled ? (pushSent ? 'Push Web Nativo' : 'Push Notificação') : null,
    ]
      .filter(Boolean)
      .join(' & ');

    triggerToast(
      `✓ Lembrete de 7 dias disparado para ${vac.name}! Enviado via ${channelsDesc || 'Canais CanisTech'}.`
    );
  };

  const handleOpenEmailPreview = (vac: VaccineWithProximity) => {
    setPreviewEmailVaccine(vac);
    setReminderModalTab('preview');
    setShowReminderModal(true);
  };

  const activeLifeStage = dog.lifeStage || (
    dog.ageYears === 0 && dog.ageMonths < 6
      ? 'filhote'
      : dog.ageYears < 1 || (dog.ageYears === 1 && dog.ageMonths <= 6)
      ? 'adolescente'
      : 'adulto'
  );

  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Toast Notification */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{showSuccessToast}</span>
        </div>
      )}

      {/* Simulated Web Push Notification Alert Banner (Modern Device Style) */}
      {simulatedPushAlert && (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-full bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 shadow-sm text-slate-950">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-bold tracking-wider uppercase text-amber-400 flex items-center gap-1 font-mono">
                  <Smartphone className="w-3 h-3" />
                  PUSH NOTIFICATION • 7 DIAS
                </span>
                <span>{simulatedPushAlert.time}</span>
              </div>
              <h4 className="text-xs font-bold text-white leading-tight">
                {simulatedPushAlert.title}
              </h4>
              <p className="text-[11px] text-slate-300 leading-snug">
                {simulatedPushAlert.body}
              </p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    const vac = processedVaccines.find((v) => v.name === simulatedPushAlert.vacName);
                    if (vac) setPreviewEmailVaccine(vac);
                    setReminderModalTab('preview');
                    setShowReminderModal(true);
                    setSimulatedPushAlert(null);
                  }}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[10px] transition-colors"
                >
                  Ver E-mail do Alerta
                </button>
                <button
                  onClick={() => setSimulatedPushAlert(null)}
                  className="px-2 py-1 text-slate-400 hover:text-white text-[10px]"
                >
                  Dispensar
                </button>
              </div>
            </div>
            <button
              onClick={() => setSimulatedPushAlert(null)}
              className="text-slate-400 hover:text-white p-1 rounded-md"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Dog Summary & Quick Actions Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <img
              src={dog.photoUrl}
              alt={dog.name}
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shadow border border-slate-200"
            />
            <span
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shadow"
              title="Prontuário Ativo e Monitorado"
            >
              ✓
            </span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-heading tracking-tight leading-none">
                {dog.name}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                {dog.breed}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold flex items-center gap-1 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Microchip Ativo
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${
                activeLifeStage === 'filhote'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : activeLifeStage === 'adolescente'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                <span>
                  {activeLifeStage === 'filhote' && '🐾 Filhote (<6m)'}
                  {activeLifeStage === 'adolescente' && '🐕 Adolescente (6-18m)'}
                  {activeLifeStage === 'adulto' && '🦮 Adulto (>18m)'}
                </span>
              </span>
              {dog.bloodType && (
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${
                  dog.bloodType.includes('Doador Universal')
                    ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
                    : 'bg-purple-50 text-purple-800 border-purple-200'
                }`} title={dog.bloodType.includes('Doador Universal') ? 'Canino Doador Universal compatível para hemotransfusões de emergência' : 'Tipagem Sanguínea Canina'}>
                  <Heart className={`w-3.5 h-3.5 ${dog.bloodType.includes('Doador Universal') ? 'text-rose-600 fill-rose-600' : 'text-purple-600'}`} />
                  <span>{dog.bloodType}</span>
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>{dog.ageYears} anos e {dog.ageMonths} meses</span>
              <span>•</span>
              <span>{dog.gender} {dog.neutered ? '(Castrado)' : '(Não Castrado)'}</span>
              <span>•</span>
              <span className="font-semibold text-slate-800">{dog.currentWeight} kg (Escore {dog.bcsScore}/9)</span>
              <span>•</span>
              <span className="text-slate-500">{dog.city}, {dog.state}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Notification Center Trigger */}
          <button
            onClick={() => setShowNotificationDrawer(true)}
            className={`relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              vaccineSummary.urgentCount > 0
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
            title="Central de Notificações de Vacinas e Lembretes"
          >
            {vaccineSummary.urgentCount > 0 ? (
              <BellRing className="w-4 h-4 text-amber-600 animate-bounce" />
            ) : (
              <Bell className="w-4 h-4 text-slate-600" />
            )}
            <span>Vacinas</span>
            {vaccineSummary.urgentCount > 0 && (
              <span className="relative flex h-5 w-5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-rose-600 text-white text-[10px] font-bold">
                  {vaccineSummary.urgentCount}
                </span>
              </span>
            )}
          </button>

          <button
            onClick={() => setShowQrModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
          >
            <QrCode className="w-4 h-4 text-slate-600" />
            <span>Acessar QR Tag</span>
          </button>
          <button
            onClick={handleDownloadRgPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-transform active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Baixar RG Pet (PDF)</span>
          </button>
          <button
            onClick={onNavigateToReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-transform active:scale-95"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Dossiê para Consulta</span>
          </button>
        </div>
      </div>

      {/* Hero Visual Notification Banner for Vaccines Proximity */}
      {vaccineSummary.urgentCount > 0 && !dismissedBanner ? (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300/80 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="relative mt-0.5 p-2 bg-amber-500 text-white rounded-xl shadow-sm shrink-0">
                <BellRing className="w-5 h-5 animate-bounce" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-600 rounded-full border-2 border-white animate-ping"></span>
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 border border-amber-400/40">
                    Sistema de Alerta Preventivo
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Data Atual: <strong>{formattedReferenceDate}</strong>
                  </span>
                </div>
                <h2 className="text-sm md:text-base font-bold text-slate-900 font-heading">
                  {vaccineSummary.urgentCount} dose(s) com proximidade de vencimento nos próximos 30 dias para {dog.name}!
                </h2>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  Para manter a imunidade de {dog.name} ativa, confira as profilaxias com datas iminentes ou próximas do reforço obrigatório:
                </p>
                {/* Urgent Vaccines Interactive Pills */}
                <div className="flex flex-wrap gap-2 pt-1.5">
                  {processedVaccines
                    .filter((v) => v.urgency === 'overdue' || v.urgency === 'imminent' || v.urgency === 'upcoming')
                    .map((vac) => (
                      <button
                        key={vac.id}
                        onClick={() => {
                          const elem = document.getElementById('agenda-preventiva');
                          if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:scale-102 ${
                          vac.urgency === 'overdue'
                            ? 'bg-rose-100 text-rose-900 border-rose-300'
                            : vac.urgency === 'imminent'
                            ? 'bg-amber-100 text-amber-950 border-amber-400 font-bold'
                            : 'bg-blue-50 text-blue-900 border-blue-300'
                        }`}
                      >
                        <Syringe className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[160px]">{vac.name}</span>
                        <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-white/70">
                          {vac.urgencyLabel}
                        </span>
                      </button>
                    ))}
                </div>

                {/* 7-Day Reminder Dispatch Notice */}
                {triggered7dAlerts.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1.5 text-[11px] font-semibold text-amber-950">
                    <BellRing className="w-3.5 h-3.5 text-amber-700 animate-bounce" />
                    <span>
                      🔔 <strong>{triggered7dAlerts.length} lembrete(s) com 7 dias de antecedência</strong> acionados e enviados via E-mail ({reminderEmail}) e Push!
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions in Banner */}
            <div className="flex flex-wrap md:flex-col lg:flex-row items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setReminderModalTab('schedule');
                  setShowReminderModal(true);
                }}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                title="Configurar agendamento de lembretes com 7 dias de antecedência"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span>Lembretes 7 Dias</span>
              </button>
              <button
                onClick={() => {
                  const elem = document.getElementById('agenda-preventiva');
                  if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Ver Agenda Completa</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (vaccineSummary.mostUrgent) {
                    handleSendVaccineWhatsApp(vaccineSummary.mostUrgent);
                  }
                }}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Agendar no WhatsApp</span>
              </button>
              <button
                onClick={() => setDismissedBanner(true)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-amber-200/40 transition-colors"
                title="Ocultar banner temporariamente"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : vaccineSummary.urgentCount > 0 && dismissedBanner ? (
        <div className="flex items-center justify-between p-2.5 px-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-medium">
            <Bell className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Existem <strong>{vaccineSummary.urgentCount} vacinas</strong> próximas do reforço para {dog.name}.
            </span>
          </div>
          <button
            onClick={() => setDismissedBanner(false)}
            className="text-amber-700 hover:text-amber-900 underline font-semibold text-xs ml-2"
          >
            Expandir alerta
          </button>
        </div>
      ) : null}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 8 cols - Clinical modules */}
        <div className="lg:col-span-8 space-y-6">
          {/* Module 1: Carteira de Identidade Canina Digital */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-orange-100 text-[#E07A5F]">
                  <FileCheck2 className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-slate-900 font-heading">
                  Carteira de Identidade Canina Digital (RG Pet)
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                CFMV DOC #{dog.rgNumber}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Photo & QR Preview */}
              <div className="md:col-span-4 flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <img
                  src={dog.photoUrl}
                  alt={dog.name}
                  className="w-16 h-16 rounded-lg object-cover shadow-xs shrink-0"
                />
                <div className="space-y-1">
                  <div
                    onClick={() => setShowQrModal(true)}
                    className="w-12 h-12 bg-white p-1 rounded-lg border border-slate-200 shadow-xs flex items-center justify-center cursor-pointer hover:border-slate-400 transition-colors"
                    title="Clique para expandir QR Tag"
                  >
                    <QrCode className="w-full h-full text-slate-800" />
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">Scan de Emergência</p>
                </div>
              </div>

              {/* Data points */}
              <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Microchip ISO</p>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-0.5 truncate">{dog.microchip}</p>
                  <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5 mt-0.5">
                    ✓ Homologado
                  </p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nascimento</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5 font-mono">{dog.birthDate}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{dog.ageYears} anos de idade</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tutor(a) Titular</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{dog.tutorName}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{dog.tutorPhone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Module 2: Escore Corporal (BCS / IMC) & Evolução de Peso com Recharts */}
          <div className={`grid grid-cols-1 ${isChartExpanded ? 'md:grid-cols-1' : 'md:grid-cols-12'} gap-6`}>
            {/* BCS / IMC WSAVA Visualizer */}
            <div className={`${isChartExpanded ? 'w-full' : 'md:col-span-5'} bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-[#E07A5F]" />
                    <h3 className="text-sm font-bold text-slate-900 font-heading">
                      Escore Corporal (ECC / BCS WSAVA)
                    </h3>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${activeBcs.color}`}>
                    Escore {selectedBcs} / 9
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed min-h-[38px]">
                  {activeBcs.desc}
                </p>

                {/* 9-Segment WSAVA Track */}
                <div className="my-4">
                  <div className="grid grid-cols-9 gap-1 h-3 rounded-full bg-slate-100 p-0.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((score) => {
                      const isSelected = selectedBcs === score;
                      let bg = 'bg-slate-200 hover:bg-slate-300';
                      if (score <= 2) bg = 'bg-amber-200';
                      else if (score === 3) bg = 'bg-amber-300';
                      else if (score === 4 || score === 5) bg = 'bg-emerald-400';
                      else if (score <= 7) bg = 'bg-orange-300';
                      else bg = 'bg-red-400';

                      return (
                        <button
                          key={score}
                          onClick={() => setSelectedBcs(score)}
                          title={`Escore ${score}`}
                          className={`rounded-sm transition-all relative ${bg} ${
                            isSelected ? 'ring-2 ring-slate-900 scale-110 z-10' : ''
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-slate-900 text-white px-1 rounded shadow">
                              {score}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-medium">
                    <span>1 (Abaixo)</span>
                    <span className="text-emerald-700 font-semibold">4 - 5 (Faixa Ótima)</span>
                    <span>9 (Obesidade)</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Gasto Energético Alvo (MER):</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {currentMerKcal} kcal/dia
                </span>
              </div>
            </div>

            {/* Recharts Interactive Weight Curve & Evolução */}
            <div className={`${isChartExpanded ? 'w-full' : 'md:col-span-7'} bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4`}>
              {/* Card Header & View Controls */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-teal-50 text-[#2A9D8F]">
                      <Activity className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-1.5">
                        <span>Curva de Peso & Evolução Temporal</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-medium bg-slate-100 text-slate-600">
                          Recharts
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {dogWeightHistory.length} registros biométricos catalogados
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* View mode toggle (Chart vs Table) */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px]">
                      <button
                        onClick={() => setChartViewMode('chart')}
                        className={`px-2 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                          chartViewMode === 'chart'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Visualização Gráfica Interativa"
                      >
                        <LineChartIcon className="w-3 h-3" />
                        <span>Gráfico</span>
                      </button>
                      <button
                        onClick={() => setChartViewMode('table')}
                        className={`px-2 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                          chartViewMode === 'table'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Tabela de Pesagens"
                      >
                        <Table className="w-3 h-3" />
                        <span>Tabela</span>
                      </button>
                    </div>

                    {/* Expand/Collapse Toggle */}
                    <button
                      onClick={() => setIsChartExpanded(!isChartExpanded)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                      title={isChartExpanded ? 'Modo normal' : 'Expandir gráfico'}
                    >
                      {isChartExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>

                    {/* Add Weight Button */}
                    <button
                      onClick={() => setShowWeightModal(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-[#E07A5F] hover:bg-orange-600 px-2.5 py-1.5 rounded-lg transition-colors shadow-xs active:scale-95"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Pesar</span>
                    </button>
                  </div>
                </div>

                {/* Quick Biometric Stats Ribbon */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Peso Atual</span>
                    <p className="text-sm font-bold font-mono text-slate-900">
                      {currentRecordedWeight.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">kg</span>
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Variação Total</span>
                    <p
                      className={`text-sm font-bold font-mono flex items-center gap-0.5 ${
                        totalWeightDelta === 0
                          ? 'text-slate-600'
                          : totalWeightDelta > 0
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {totalWeightDelta > 0 ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : totalWeightDelta < 0 ? (
                        <TrendingDown className="w-3.5 h-3.5" />
                      ) : (
                        <Minus className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {totalWeightDelta > 0 ? `+${totalWeightDelta.toFixed(1)}` : totalWeightDelta.toFixed(1)} kg
                      </span>
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Média Período</span>
                    <p className="text-sm font-bold font-mono text-slate-900">
                      {averagePeriodWeight.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">kg</span>
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {dog.lifeStage ? `Faixa Ideal (${dog.lifeStage.toUpperCase()})` : `Faixa Ideal (${activeLifeStage.toUpperCase()})`}
                    </span>
                    <p className="text-xs font-semibold text-emerald-700 font-mono flex items-center gap-1 mt-0.5">
                      ✓ {dog.idealWeightMin} - {dog.idealWeightMax} kg
                    </p>
                    {dog.AdultBaseWeightMin && dog.AdultBaseWeightMax && (activeLifeStage === 'filhote' || activeLifeStage === 'adolescente') && (
                      <span className="text-[9px] text-slate-400 block font-normal">
                        Ref. Adulto: {dog.AdultBaseWeightMin}-{dog.AdultBaseWeightMax} kg
                      </span>
                    )}
                  </div>
                </div>

                {/* Filters & Options bar (Visible on Chart mode) */}
                {chartViewMode === 'chart' && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 text-[11px]">
                    {/* Period filters */}
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Período:</span>
                      {(['3m', '6m', 'all'] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setWeightPeriod(p)}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                            weightPeriod === p
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          {p === '3m' ? 'Últimos 3M' : p === '6m' ? 'Últimos 6M' : 'Todos'}
                        </button>
                      ))}
                    </div>

                    {/* Reference Line toggles */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowIdealRange(!showIdealRange)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors border ${
                          showIdealRange
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
                        }`}
                        title="Destacar faixa ideal de peso recomendada para a raça"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Faixa Ideal ({dog.idealWeightMin}-{dog.idealWeightMax}kg)</span>
                      </button>

                      <button
                        onClick={() => setShowAverage(!showAverage)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors border ${
                          showAverage
                            ? 'bg-slate-100 text-slate-800 border-slate-300'
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                        title="Exibir linha de peso médio do período"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        <span>Média ({averagePeriodWeight}kg)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Mode 1: Interactive Recharts Line Chart */}
                {chartViewMode === 'chart' ? (
                  <div className="relative w-full py-1">
                    <div className={`w-full ${isChartExpanded ? 'h-[280px]' : 'h-[210px]'}`}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={chartData}
                          margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis
                            dataKey="shortDate"
                            stroke="#94a3b8"
                            fontSize={10}
                            tickLine={false}
                            axisLine={{ stroke: '#e2e8f0' }}
                          />
                          <YAxis
                            domain={[yDomainMin, yDomainMax]}
                            stroke="#94a3b8"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `${v}kg`}
                          />
                          <Tooltip content={<CustomWeightTooltip />} />

                          {/* Breed Target Weight Safe Zone Area */}
                          {showIdealRange && (
                            <>
                              <ReferenceArea
                                y1={dog.idealWeightMin}
                                y2={dog.idealWeightMax}
                                fill="#10b981"
                                fillOpacity={0.07}
                              />
                              <ReferenceLine
                                y={dog.idealWeightMin}
                                stroke="#10b981"
                                strokeDasharray="3 3"
                                strokeWidth={1}
                                label={{
                                  value: `Mín ${dog.idealWeightMin}kg`,
                                  position: 'insideBottomLeft',
                                  fill: '#059669',
                                  fontSize: 9,
                                  fontWeight: 600,
                                }}
                              />
                              <ReferenceLine
                                y={dog.idealWeightMax}
                                stroke="#10b981"
                                strokeDasharray="3 3"
                                strokeWidth={1}
                                label={{
                                  value: `Máx ${dog.idealWeightMax}kg`,
                                  position: 'insideTopLeft',
                                  fill: '#059669',
                                  fontSize: 9,
                                  fontWeight: 600,
                                }}
                              />
                            </>
                          )}

                          {/* Average Weight Reference Line */}
                          {showAverage && (
                            <ReferenceLine
                              y={averagePeriodWeight}
                              stroke="#64748b"
                              strokeDasharray="4 4"
                              strokeWidth={1.5}
                              label={{
                                value: `Média ${averagePeriodWeight}kg`,
                                position: 'insideRight',
                                fill: '#475569',
                                fontSize: 9,
                                fontWeight: 600,
                              }}
                            />
                          )}

                          <Line
                            type="monotone"
                            dataKey="weight"
                            stroke="#0F172A"
                            strokeWidth={2.5}
                            dot={renderCustomDot}
                            activeDot={{
                              r: 6,
                              fill: '#2A9D8F',
                              stroke: '#ffffff',
                              strokeWidth: 2,
                            }}
                            isAnimationActive={true}
                            animationDuration={600}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Hint / Helper Caption */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Info className="w-3 h-3 text-slate-400 shrink-0" />
                        Passe o cursor sobre os pontos para ver notas clínicas e variação
                      </span>
                      <span className="font-mono text-slate-500">
                        {chartData.length} pontos no gráfico
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Mode 2: Detailed Biometric Weigh-in History Table */
                  <div className="space-y-2 py-1 max-h-[260px] overflow-y-auto pr-1">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400">
                          <th className="pb-1.5">Data</th>
                          <th className="pb-1.5">Peso</th>
                          <th className="pb-1.5">Variação</th>
                          <th className="pb-1.5">Situação</th>
                          <th className="pb-1.5">Observação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {chartData.slice().reverse().map((record) => (
                          <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2 font-mono text-slate-800 font-medium whitespace-nowrap">
                              {record.rawDate}
                            </td>
                            <td className="py-2 font-mono font-bold text-slate-900 whitespace-nowrap">
                              {record.weight.toFixed(1)} kg
                            </td>
                            <td className="py-2 font-mono whitespace-nowrap">
                              {record.delta === 0 ? (
                                <span className="text-slate-400">-</span>
                              ) : record.delta > 0 ? (
                                <span className="text-amber-600 font-semibold">+{record.delta.toFixed(1)} kg</span>
                              ) : (
                                <span className="text-emerald-600 font-semibold">{record.delta.toFixed(1)} kg</span>
                              )}
                            </td>
                            <td className="py-2 whitespace-nowrap">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                  record.status === 'ideal'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : record.status === 'abaixo'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {record.status === 'ideal' ? 'Faixa Ideal' : record.status === 'abaixo' ? 'Abaixo' : 'Sobrepeso'}
                              </span>
                            </td>
                            <td className="py-2 text-[11px] text-slate-500 truncate max-w-[140px]" title={record.note}>
                              {record.note || 'Rotina'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Bottom Card Summary */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs gap-2">
                <span className="text-slate-500">
                  Faixa Estável Sincronizada ({dog.breed} • Fase {activeLifeStage}):
                </span>
                <span className="font-semibold text-slate-900 font-mono">
                  {dog.idealWeightMin} a {dog.idealWeightMax} kg
                </span>
              </div>
            </div>
          </div>

          {/* Module 3: Agenda Preventiva & Imunização - Sistema de Notificação Visual Inteligente */}
          <div
            id="agenda-preventiva"
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5 scroll-mt-24"
          >
            {/* Header: Title & Main Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-900 border border-amber-300/40">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    Agenda Preventiva & Imunização
                  </h3>
                  {vaccineSummary.urgentCount > 0 && (
                    <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full animate-pulse">
                      {vaccineSummary.urgentCount} Alertas
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Sistema de notificações visuais com cálculo dinâmico de proximidade baseado na data atual: <strong className="text-slate-700">{formattedReferenceDate}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowAddVaccineModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Nova Vacina</span>
                </button>
                <button
                  onClick={() => {
                    setReminderModalTab('schedule');
                    setShowReminderModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-semibold shadow-xs transition-colors"
                  title="Configurar avisos de 7 dias de antecedência por E-mail e Push Notifications"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                  <span>Lembretes 7 Dias</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-950 font-mono text-[10px] font-bold">
                    {scheduledVaccinesCount}/{processedVaccines.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Proximity Status Ribbon & Interactive Time Simulator */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Vencidas */}
                <div
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    vaccineSummary.overdueCount > 0
                      ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Atrasadas
                  </span>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    {vaccineSummary.overdueCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
                    )}
                    <span className="text-lg font-bold font-mono">
                      {vaccineSummary.overdueCount}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">Ação imediata</span>
                </div>

                {/* Iminentes (<=7 dias) */}
                <div
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    vaccineSummary.imminentCount > 0
                      ? 'bg-amber-50 border-amber-400 text-amber-950 font-semibold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-amber-700">
                    Iminentes (≤7 dias)
                  </span>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    {vaccineSummary.imminentCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                    )}
                    <span className="text-lg font-bold font-mono text-amber-900">
                      {vaccineSummary.imminentCount}
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-800">Urgente reforço</span>
                </div>

                {/* Próximas (<=30 dias) */}
                <div
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    vaccineSummary.upcomingCount > 0
                      ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-blue-700">
                    Próximas (≤30 dias)
                  </span>
                  <span className="block text-lg font-bold font-mono mt-0.5 text-blue-900">
                    {vaccineSummary.upcomingCount}
                  </span>
                  <span className="text-[10px] text-blue-800">Agendar este mês</span>
                </div>

                {/* Em dia */}
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-emerald-700">
                    Proteção Ativa
                  </span>
                  <span className="block text-lg font-bold font-mono mt-0.5 text-emerald-800">
                    {vaccineSummary.safeCount}
                  </span>
                  <span className="text-[10px] text-emerald-700">Imunização segura</span>
                </div>
              </div>

              {/* Simulation Bar */}
              <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-medium text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Simular data para testes de proximidade:</span>
                </span>
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[11px]">
                  <button
                    onClick={() => {
                      setSimulatedDateOffsetDays(0);
                      triggerToast(`Data de referência calibrada para Hoje (${formatDateBR(new Date())})`);
                    }}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                      simulatedDateOffsetDays === 0
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => {
                      setSimulatedDateOffsetDays(7);
                      triggerToast('Simulando avanço de +7 dias nas datas de vacinas.');
                    }}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                      simulatedDateOffsetDays === 7
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    +7 dias
                  </button>
                  <button
                    onClick={() => {
                      setSimulatedDateOffsetDays(15);
                      triggerToast('Simulando avanço de +15 dias nas datas de vacinas.');
                    }}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                      simulatedDateOffsetDays === 15
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    +15 dias
                  </button>
                  <button
                    onClick={() => {
                      setSimulatedDateOffsetDays(30);
                      triggerToast('Simulando avanço de +30 dias nas datas de vacinas.');
                    }}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                      simulatedDateOffsetDays === 30
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    +30 dias
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs">
                <button
                  onClick={() => setVaccineFilterTab('all')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    vaccineFilterTab === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todas ({processedVaccines.length})
                </button>
                <button
                  onClick={() => setVaccineFilterTab('urgent')}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                    vaccineFilterTab === 'urgent'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Atenção & Próximas</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      vaccineFilterTab === 'urgent'
                        ? 'bg-amber-700 text-white'
                        : 'bg-amber-200 text-amber-900'
                    }`}
                  >
                    {vaccineSummary.urgentCount}
                  </span>
                </button>
                <button
                  onClick={() => setVaccineFilterTab('safe')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    vaccineFilterTab === 'safe'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Em Dia ({vaccineSummary.safeCount})
                </button>
              </div>

              <span className="text-[11px] text-slate-400 font-mono">
                Exibindo {filteredVaccines.length} de {processedVaccines.length} itens
              </span>
            </div>

            {/* Vaccine Cards Responsive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredVaccines.map((v) => {
                const isUrgent = v.urgency === 'overdue' || v.urgency === 'imminent';
                return (
                  <div
                    key={v.id}
                    className={`bg-white p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between space-y-3 shadow-xs hover:shadow-md ${v.cardBorder}`}
                  >
                    <div className="space-y-2">
                      {/* Top Header: Category & Proximity Countdown Badge */}
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          {v.category === 'antiparasitario'
                            ? 'Antiparasitário'
                            : v.category === 'vermifugo'
                            ? 'Vermífugo'
                            : 'Vacina Canina'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isUrgent && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${v.badgeBg} ${v.badgeText} ${v.badgeBorder}`}
                          >
                            {v.urgencyLabel}
                          </span>
                        </div>
                      </div>

                      {/* Name & Clinical Description */}
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-snug">
                          {v.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {v.description}
                        </p>
                      </div>

                      {/* Manufacturer & Batch */}
                      <div className="text-[10px] font-mono text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                        <span className="truncate max-w-[150px] font-medium text-slate-700">
                          {v.manufacturer}
                        </span>
                        <span className="text-slate-400">Lote: {v.lot}</span>
                      </div>

                      {/* Immunization Cycle Visual Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Janela de Imunidade:</span>
                          <span className="font-mono font-semibold text-slate-700">
                            {v.progressPercent}% decorrido
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${v.progressColor}`}
                            style={{ width: `${v.progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Dates Summary */}
                      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-1 text-[11px]">
                        <div>
                          <span className="block text-[10px] text-slate-400 font-medium">Última dose:</span>
                          <span className="font-mono text-slate-600">{v.lastDate}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] text-slate-400 font-medium">Próximo reforço:</span>
                          <span
                            className={`font-mono font-bold ${
                              v.urgency === 'overdue'
                                ? 'text-rose-600'
                                : v.urgency === 'imminent'
                                ? 'text-amber-600'
                                : 'text-slate-800'
                            }`}
                          >
                            {v.nextDate}
                          </span>
                        </div>
                      </div>

                      {/* 7-Day Reminder Alert Pill */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 truncate">
                          <Bell
                            className={`w-3.5 h-3.5 shrink-0 ${
                              !disabledReminderVacIds.includes(v.id) ? 'text-amber-600' : 'text-slate-400'
                            }`}
                          />
                          <span className="text-slate-500 text-[10px]">Alerta 7d:</span>
                          <span className="font-mono font-semibold text-slate-800 text-[11px]">{v.alertDate7d}</span>
                        </div>
                        {v.is7dAlertActive ? (
                          <button
                            onClick={() => handleOpenEmailPreview(v)}
                            className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-950 border border-amber-300 font-bold text-[10px] shrink-0 hover:bg-amber-200 transition-colors flex items-center gap-1"
                            title="Lembrete de 7 dias ativo! Clique para ver e-mail"
                          >
                            <span>⚡ Disparado</span>
                          </button>
                        ) : !disabledReminderVacIds.includes(v.id) ? (
                          <button
                            onClick={() => handleToggleVaccineReminder(v.id)}
                            className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium text-[10px] shrink-0 hover:bg-emerald-100 transition-colors"
                            title="Lembrete 7d agendado (E-mail & Push). Clique para pausar"
                          >
                            ✓ Agendado
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleVaccineReminder(v.id)}
                            className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium text-[10px] shrink-0 hover:bg-slate-200 transition-colors"
                            title="Lembrete 7d pausado. Clique para ativar"
                          >
                            Pausado
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons on Card */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenApplyModal(v)}
                        className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                        title="Registrar que esta dose foi aplicada hoje"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Aplicar Dose</span>
                      </button>

                      <button
                        onClick={() => handleTestDispatch7dReminder(v)}
                        className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors"
                        title={`Testar disparo do lembrete de 7 dias (${v.alertDate7d}) por E-mail e Push`}
                      >
                        <BellRing className="w-4 h-4 text-amber-600" />
                      </button>

                      <button
                        onClick={() => handleOpenEmailPreview(v)}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 transition-colors"
                        title="Visualizar modelo do e-mail de alerta de 7 dias"
                      >
                        <Mail className="w-4 h-4 text-blue-600" />
                      </button>

                      <button
                        onClick={() => handleSendVaccineWhatsApp(v)}
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
                        title="Enviar lembrete via WhatsApp para veterinário ou tutor"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Module 4: Dieta & Exercícios Bento Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dieta */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                    <Utensils className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">
                    Dieta & Nutrição Calibrada
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Super Premium</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Fracionamento Diário</p>
                    <p className="text-[11px] text-slate-500">{dog.dietPortions} porções iguais de {Math.round(dog.dietGramsPerDay / dog.dietPortions)}g</p>
                  </div>
                  <span className="font-mono font-bold text-slate-900 text-sm">{dog.dietGramsPerDay} g/dia</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Hidratação Mínima Alvo</p>
                    <p className="text-[11px] text-slate-500">50-60 ml por kg corporal</p>
                  </div>
                  <span className="font-mono font-bold text-emerald-700 text-sm flex items-center gap-1">
                    <Droplet className="w-3.5 h-3.5" /> {(dog.dailyWaterMl / 1000).toFixed(1)} L/dia
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Suplementação Profilática</p>
                    <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{dog.supplements}</p>
                  </div>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    1 dose/dia
                  </span>
                </div>
              </div>
            </div>

            {/* Atividades & Exercícios */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-orange-100 text-[#E07A5F]">
                    <Activity className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">
                    Atividades & Exercícios
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Protocolo Raça</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Gasto Aeróbico / Caminhada</p>
                    <p className="text-[11px] text-slate-500">Passeio vigoroso matutino</p>
                  </div>
                  <span className="font-mono font-bold text-slate-900 text-sm">{dog.dailyExerciseMin} min/dia</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Enriquecimento Cognitivo</p>
                    <p className="text-[11px] text-slate-500">Tapete de farejo e mordedor</p>
                  </div>
                  <span className="font-mono font-bold text-slate-900 text-sm">{dog.cognitiveMin} min/dia</span>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                    <span>Meta de hoje:</span>
                    <span className="font-bold text-slate-900">
                      {exerciseCompleted ? '100% Concluído' : '75% Concluído'}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        exerciseCompleted ? 'bg-emerald-600 w-full' : 'bg-[#E07A5F] w-3/4'
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setExerciseCompleted(!exerciseCompleted);
                        triggerToast(
                          !exerciseCompleted
                            ? 'Meta diária de exercícios marcada como concluída!'
                            : 'Meta de exercícios reaberta.'
                        );
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-900 underline font-medium"
                    >
                      {exerciseCompleted ? 'Desmarcar' : 'Concluir meta de hoje'}
                    </button>

                    <button
                      onClick={() => {
                        const el = document.getElementById('relatorio-atividades');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
                    >
                      <span>Ver Gráficos Recharts</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Module 5: Relatório de Atividade & Exercício Semanal (Recharts Analytics) */}
          <div id="relatorio-atividades" className="scroll-mt-24">
            <DogActivityReport
              dog={dog}
              activityHistory={activities}
              onAddActivity={handleAddActivityLocal}
            />
          </div>
        </div>

        {/* Right Column: 4 cols - Assistant, Sponsors, Emergency Clinic */}
        <div className="lg:col-span-4 space-y-6">
          {/* CanisTech AI 24h Triage Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-slate-800 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                CanisTech AI 24h
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
            </div>

            <h3 className="text-base font-bold font-heading mb-1">
              Dúvida ou Sintoma do {dog.name}?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Orientação preventiva estruturada, diretrizes de bem-estar e disclaimer regulatório CFMV.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (quickAiInput.trim()) {
                  onOpenVetChat(quickAiInput);
                  setQuickAiInput('');
                }
              }}
              className="relative"
            >
              <input
                type="text"
                value={quickAiInput}
                onChange={(e) => setQuickAiInput(e.target.value)}
                placeholder="Descreva o sintoma ou dúvida..."
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder:text-slate-400 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-emerald-400 pr-9 transition-colors"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-white p-1 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Quick Topic Chips */}
            <div className="pt-3 border-t border-slate-800/80 mt-3 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Tópicos Comuns com Pré-Perguntas:
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  onClick={() => onOpenVetChat('Meu cão está vomitando espuma branca ou amarelada: o que pode ser e o que fazer?')}
                  className="p-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left transition-colors flex items-center justify-between text-slate-200"
                >
                  <span>🤢 Digestivo</span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </button>
                <button
                  onClick={() => onOpenVetChat('Meu cão se coça muito na base da cauda e tem falhas no pêlo (suspeita de DAPP)')}
                  className="p-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left transition-colors flex items-center justify-between text-slate-200"
                >
                  <span>🩺 Pele & Alergias</span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </button>
                <button
                  onClick={() => onOpenVetChat('A dose da vacina V10 atrasou 20 dias: preciso reiniciar o protocolo?')}
                  className="p-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left transition-colors flex items-center justify-between text-slate-200"
                >
                  <span>💉 Vacinação</span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </button>
                <button
                  onClick={() => onOpenVetChat('Cão chora, uiva e morde portas quando fica sozinho em casa (ansiedade de separação)')}
                  className="p-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left transition-colors flex items-center justify-between text-slate-200"
                >
                  <span>🧠 Comportamento</span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </button>
              </div>

              <button
                onClick={() => onOpenVetChat()}
                className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Abrir Chat de Triagem Completo</span>
              </button>
            </div>
          </div>

          {/* Native Sponsored Partner 1: Nutrition */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Parceiro Homologado • Patrocinado</span>
              <span className="text-emerald-700">✓ Laudo Clínico</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900">BioNutri Dermacare</h4>
                <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded">
                  -15% OFF
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fórmula hipoalergênica recomendada para a sensibilidade cutânea típica de cães da raça {dog.breed}.
              </p>
            </div>
            <button
              onClick={() => triggerToast('Cupom CANISTECH15 aplicado! Redirecionando para o parceiro seguro.')}
              className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Ver Fórmula & Cupom</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {/* Native Sponsored Partner 2: Health Plan */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Saúde Integrada Local</span>
              <span className="text-slate-600">{dog.city}</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#E07A5F] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900">Plano Vet Prev Ultra</p>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Cobertura para exames ortopédicos de displasia e pronto-socorro 24h sem carência.
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-900">
                R$ 139<span className="text-[10px] text-slate-400 font-normal">/mês</span>
              </span>
              <button
                onClick={() => triggerToast('Simulação iniciada com credenciados do seu bairro!')}
                className="px-3 py-1.5 bg-[#E07A5F] hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Simular Cobertura
              </button>
            </div>
          </div>

          {/* Emergency 24h Hospital Card */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-red-700 font-bold text-xs">
              <PhoneCall className="w-4 h-4" />
              <span>Plantão Veterinário 24h Vinculado</span>
            </div>
            <p className="text-xs font-bold text-slate-900">Hospital Veterinário Santa Inês</p>
            <p className="text-[11px] text-slate-600">A 1.2 km de distância • Prontuário DogOS integrado</p>
            <div className="pt-1">
              <a
                href="tel:1122365888"
                className="inline-flex items-center gap-1 text-xs font-bold text-red-700 hover:text-red-800 hover:underline"
              >
                <span>Ligar Agora (Emergência 24h)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Quick Encyclopedia Link Card */}
          {onNavigateToEncyclopedia && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  <BookOpen className="w-4 h-4 text-[#E07A5F]" />
                  <span>Enciclopédia de Raças</span>
                </span>
                <span className="text-[10px] bg-orange-100 text-[#E07A5F] px-1.5 py-0.5 rounded-full font-bold">
                  Clima BR
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Consulte dados técnicos, tolerância ao calor e recomendações para o perfil de {dog.breed}.
              </p>
              <button
                onClick={onNavigateToEncyclopedia}
                className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
              >
                <span>Explorar Raças & Clima</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Apoie o CanisTech Banner */}
          {onNavigateToDonation && (
            <div className="bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                <Heart className="w-4 h-4 text-rose-500 fill-current" />
                <span>Mantenha o CanisTech Gratuito</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Sua doação mantém nossos servidores, a IA 24h e o fundo de suporte a cães resgatados.
              </p>
              <button
                onClick={onNavigateToDonation}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-xs"
              >
                <span>Fazer uma Doação / Apoiar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Tag Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-center animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 font-heading">QR Tag de Emergência</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <QrCode className="w-40 h-40 mx-auto text-slate-900" />
            </div>

            <div className="text-xs space-y-1 text-slate-600">
              <p className="font-bold text-slate-900 text-sm">{dog.name} ({dog.breed})</p>
              <p>Tutor: {dog.tutorName} • {dog.tutorPhone}</p>
              <p className="font-mono text-[11px] text-slate-500">Microchip: {dog.microchip}</p>
              <div className="mt-2 p-2 bg-amber-50 rounded-lg text-amber-900 text-[11px] text-left">
                ⚠️ Alergia a talco / DAPP. Não administrar medicamentos humanos sem supervisão médica.
              </div>
            </div>

            <button
              onClick={() => {
                setShowQrModal(false);
                triggerToast('QR Tag pronta para impressão e fixação na coleira.');
              }}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Imprimir Tag para Coleira
            </button>
          </div>
        </div>
      )}

      {/* Modal: Registrar Nova Pesagem */}
      {showWeightModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 font-heading">
                Registrar Pesagem do {dog.name}
              </h3>
              <button
                onClick={() => setShowWeightModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWeightSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Peso Atual (em kg):
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newWeightInput}
                  onChange={(e) => setNewWeightInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Observações (balança de clínica, jejum, etc.):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pesado em jejum no pet shop"
                  value={newWeightNote}
                  onChange={(e) => setNewWeightNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-slate-600 text-[11px] leading-relaxed">
                Faixa ideal recomendada para {dog.breed}: <strong>{dog.idealWeightMin} a {dog.idealWeightMax} kg</strong>.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWeightModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Salvar Pesagem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Central de Agendamento de Lembretes Preventivos (Aviso de 7 Dias) */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 md:p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-950 border border-amber-300/60 shrink-0 mt-0.5">
                  <CalendarClock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 font-heading">
                      Agendamento de Lembretes • 7 Dias de Antecedência
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-300">
                      Regra Ativa: 7 Dias
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Avisos preventivos por E-mail & Notificações Push para o tutor de <strong>{dog.name}</strong> ({dog.tutorName})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReminderModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-semibold shrink-0">
              <button
                onClick={() => setReminderModalTab('schedule')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  reminderModalTab === 'schedule'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Agenda de 7 Dias ({scheduledVaccinesCount})</span>
              </button>
              <button
                onClick={() => setReminderModalTab('channels')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  reminderModalTab === 'channels'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Canais (E-mail & Push)</span>
              </button>
              <button
                onClick={() => setReminderModalTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  reminderModalTab === 'preview'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Pré-visualização do E-mail</span>
              </button>
            </div>

            {/* Tab 1: Agenda de 7 Dias por Vacina */}
            {reminderModalTab === 'schedule' && (
              <div className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
                {/* Rule explanation banner */}
                <div className="p-3 bg-amber-50/70 border border-amber-200/90 rounded-xl space-y-1 text-amber-950">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <BellRing className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Como funciona a notificação com 7 dias de antecedência:</span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    O CanisTech calcula diariamente a proximidade de cada vacina. Exatamente <strong>7 dias antes</strong> da data prevista para o reforço, o sistema dispara automaticamente um <strong>e-mail detalhado</strong> e uma <strong>push notification</strong> para que o tutor consiga agendar sem atrasar a janela de imunidade.
                  </p>
                  <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px] font-mono text-amber-800">
                    <span>Data de Referência: <strong>{formattedReferenceDate}</strong></span>
                    <span>•</span>
                    <span>Alertas Ativos Hoje: <strong>{triggered7dAlerts.length}</strong></span>
                  </div>
                </div>

                {/* Vaccines Schedule Table / List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                    <span>Imunização / Profilaxia</span>
                    <span>Data 7d / Status</span>
                  </div>

                  {processedVaccines.map((vac) => {
                    const isScheduled = !disabledReminderVacIds.includes(vac.id);
                    return (
                      <div
                        key={vac.id}
                        className={`p-3 rounded-xl border transition-all space-y-2 ${
                          vac.is7dAlertActive
                            ? 'bg-amber-50/60 border-amber-300'
                            : !isScheduled
                            ? 'bg-slate-50/60 border-slate-200 opacity-60'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{vac.name}</span>
                              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                {vac.category || 'vacina'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1">{vac.description}</p>
                          </div>

                          <div className="text-right shrink-0">
                            {vac.is7dAlertActive ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-400 font-bold text-[10px] animate-pulse">
                                ⚡ Alerta 7d Disparado!
                              </span>
                            ) : vac.is7dAlertOverdue ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 font-bold text-[10px]">
                                🚨 Vencida
                              </span>
                            ) : isScheduled ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[10px]">
                                🗓️ Agendado em {vac.daysUntil7dAlert}d
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium text-[10px]">
                                Pausado
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Dates grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono pt-1 border-t border-slate-100 text-slate-600">
                          <div>
                            <span className="block text-[10px] text-slate-400 font-sans">Próxima Dose:</span>
                            <span className="font-bold text-slate-900">{vac.nextDate}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-amber-700 font-sans font-semibold">
                              🔔 Disparo do Alerta (7d antes):
                            </span>
                            <span className="font-bold text-amber-900">{vac.alertDate7d}</span>
                          </div>
                          <div className="sm:text-right">
                            <span className="block text-[10px] text-slate-400 font-sans">Canais:</span>
                            <span className="text-slate-700 text-[10px]">E-mail & Push</span>
                          </div>
                        </div>

                        {/* Actions for this vaccine */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100/70">
                          <button
                            type="button"
                            onClick={() => handleToggleVaccineReminder(vac.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                              isScheduled
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {isScheduled ? <span>Pausar Lembrete 7d</span> : <span>✓ Ativar Lembrete 7d</span>}
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewEmailVaccine(vac);
                                setReminderModalTab('preview');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                              title="Visualizar o e-mail que o tutor receberá 7 dias antes"
                            >
                              <Eye className="w-3 h-3 text-blue-600" />
                              <span>Ver E-mail</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTestDispatch7dReminder(vac)}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
                              title="Simular disparo imediato deste alerta via E-mail e Push"
                            >
                              <Send className="w-3 h-3 text-amber-700" />
                              <span>Testar Disparo 7d</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: Canais de Disparo (E-mail & Push) */}
            {reminderModalTab === 'channels' && (
              <div className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
                {/* E-mail Channel */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Alerta por E-mail (7 Dias Antes)</h4>
                        <p className="text-[11px] text-slate-500">
                          Disparo automático de e-mail institucional com ficha da vacina e orientações.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reminderEmailEnabled}
                        onChange={(e) => setReminderEmailEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Endereço de E-mail do Tutor:
                    </label>
                    <input
                      type="email"
                      value={reminderEmail}
                      onChange={(e) => setReminderEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com.br"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-slate-900"
                    />
                    <span className="block mt-1 text-[10px] text-slate-500">
                      Tutor cadastrado: <strong>{dog.tutorName}</strong> ({dog.city}, {dog.state})
                    </span>
                  </div>
                </div>

                {/* Push Notification Channel */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-100 text-amber-900">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Web Push Notifications (Navegador & Mobile)</h4>
                        <p className="text-[11px] text-slate-500">
                          Notificação pop-up nativa na tela do tutor 7 dias antes do vencimento.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reminderPushEnabled}
                        onChange={(e) => setReminderPushEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-lg border border-slate-200">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-800 text-xs">
                        Status da Permissão Web Push:
                      </span>
                      <div className="flex items-center gap-1.5">
                        {pushPermission === 'granted' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px] border border-emerald-300">
                            ✓ Ativo e Autorizado no Navegador
                          </span>
                        ) : pushPermission === 'denied' ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 font-bold text-[10px] border border-rose-300">
                            ⚠️ Bloqueado pelo Navegador
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold text-[10px] border border-amber-300">
                            Pendente de Autorização
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRequestPushPermission}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors shadow-xs"
                    >
                      {pushPermission === 'granted' ? 'Permissão Confirmada' : 'Autorizar Push Agora'}
                    </button>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-xs text-slate-600">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reminderSoundEnabled}
                        onChange={(e) => setReminderSoundEnabled(e.target.checked)}
                        className="rounded text-slate-900"
                      />
                      <span className="flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Tocar alerta sonoro (chime sintetizado) ao disparar notificação</span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Additional Notification Preferences */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <h4 className="font-bold text-slate-900">Configurações de Antecedência Adicionais</h4>
                  
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="rounded text-slate-900 opacity-60"
                    />
                    <span>
                      <strong>Disparo Principal:</strong> Avisar 7 dias antes do vencimento (Obrigatório CanisTech)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={reminder24hEnabled}
                      onChange={(e) => setReminder24hEnabled(e.target.checked)}
                      className="rounded text-slate-900"
                    />
                    <span>Disparo complementar de emergência 24 horas antes do vencimento</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input type="checkbox" defaultChecked className="rounded text-slate-900" />
                    <span>Permitir agendamento direto com 1 clique via WhatsApp ({dog.tutorPhone})</span>
                  </label>
                </div>
              </div>
            )}

            {/* Tab 3: Pré-visualização do E-mail */}
            {reminderModalTab === 'preview' && (
              <div className="space-y-3 overflow-y-auto flex-1 pr-1 text-xs">
                {/* Vaccine preview selector */}
                <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-700">Selecione a Imunização para pré-visualizar:</span>
                  <select
                    value={previewEmailVaccine?.id || processedVaccines[0]?.id}
                    onChange={(e) => {
                      const found = processedVaccines.find((v) => v.id === e.target.value);
                      if (found) setPreviewEmailVaccine(found);
                    }}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium outline-none"
                  >
                    {processedVaccines.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} (Reforço: {v.nextDate})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Simulated Email Client Envelope */}
                {(() => {
                  const vac = previewEmailVaccine || processedVaccines[0];
                  const emailData = generateVaccine7dEmailContent(dog, vac);
                  return (
                    <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-xs bg-white">
                      {/* Email Header Metadata Bar */}
                      <div className="bg-slate-100 p-3 border-b border-slate-200 space-y-1 text-[11px] font-mono text-slate-600">
                        <div className="flex justify-between items-center text-slate-500 font-sans text-[10px] pb-1 border-b border-slate-200/60">
                          <span>Caixa de Entrada • CanisTech DogOS Mail Engine</span>
                          <span>Disparo: {vac.alertDate7d} (7 dias antes)</span>
                        </div>
                        <p>
                          <strong>De:</strong> CanisTech Alertas Preventivos &lt;notificacoes@canistech.com.br&gt;
                        </p>
                        <p>
                          <strong>Para:</strong> {dog.tutorName} &lt;{reminderEmail}&gt;
                        </p>
                        <p className="font-bold text-slate-900">
                          <strong>Assunto:</strong> {emailData.subject}
                        </p>
                      </div>

                      {/* Email Visual Body */}
                      <div className="p-5 space-y-4 font-sans">
                        {/* Email Brand Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                              🐾
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 tracking-tight text-sm">CanisTech DogOS</span>
                              <span className="block text-[10px] text-slate-400">Gestão Biométrica & Bem-Estar Preventivo</span>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                            Aviso de 7 Dias
                          </span>
                        </div>

                        {/* Email Message */}
                        <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                          <p className="font-semibold text-slate-900">
                            Olá, {dog.tutorName}!
                          </p>
                          <p>
                            Este é um lembrete preventivo programado pelo sistema <strong>DogOS CanisTech</strong>. Faltam <strong>exatamente 7 dias</strong> para a data prevista do reforço de imunização do seu cão:
                          </p>

                          {/* Highlight Card */}
                          <div className="p-3.5 bg-amber-50/60 border border-amber-300/80 rounded-xl space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">
                                  {vac.category === 'antiparasitario' ? 'Antiparasitário' : 'Vacina Canina'}
                                </span>
                                <h4 className="text-sm font-bold text-slate-900">{vac.name}</h4>
                              </div>
                              <span className="font-mono text-xs font-bold text-rose-700 bg-white px-2 py-0.5 rounded border border-amber-200">
                                Vence em 7 dias ({vac.nextDate})
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-600">{vac.description}</p>

                            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-700 pt-2 border-t border-amber-200/60">
                              <div>
                                <span className="block text-[10px] text-slate-400 font-sans">Fabricante / Lote:</span>
                                <span>{vac.manufacturer} ({vac.lot})</span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-400 font-sans">Clínica Credenciada:</span>
                                <span>{vac.clinic || 'Hospital Veterinário Pet Care'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Patient info */}
                          <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-600 flex items-center justify-between border border-slate-100">
                            <span>Paciente: <strong>{dog.name}</strong> ({dog.breed}, {dog.currentWeight}kg)</span>
                            <span className="font-mono">RG Pet #{dog.rgNumber}</span>
                          </div>

                          <p className="text-[11px] text-slate-500 italic">
                            Dica veterinária: A vacinação em dia previne a queda de títulos de anticorpos e garante a circulação protegida em parques e áreas urbanas.
                          </p>
                        </div>

                        {/* Call to Actions inside Email */}
                        <div className="pt-2 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSendVaccineWhatsApp(vac)}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Agendar no WhatsApp da Clínica</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTestDispatch7dReminder(vac)}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Disparar Este Alerta Agora (Teste)</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 shrink-0">
              <span className="text-[11px] text-slate-500">
                🔔 <strong>{scheduledVaccinesCount}</strong> de <strong>{processedVaccines.length}</strong> lembretes de 7 dias programados
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReminderModal(false);
                    triggerToast('✓ Configuração salva! Os tutores serão avisados com 7 dias de antecedência via E-mail e Push.');
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar e Ativar Agendamentos</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Flyout: Central de Notificações de Imunização */}
      {showNotificationDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-900 border border-amber-300/60">
                  <BellRing className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 font-heading">
                    Central de Alertas de Vacinas • {dog.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Data de hoje: {formattedReferenceDate} • {vaccineSummary.urgentCount} alerta(s) ativos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNotificationDrawer(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* List of Vaccines sorted by urgency */}
            <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
              {processedVaccines
                .slice()
                .sort((a, b) => a.calculatedDaysRemaining - b.calculatedDaysRemaining)
                .map((vac) => {
                  const isUrgent = vac.urgency === 'overdue' || vac.urgency === 'imminent';
                  return (
                    <div
                      key={vac.id}
                      className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                        isUrgent
                          ? 'bg-amber-50/50 border-amber-300'
                          : vac.urgency === 'upcoming'
                          ? 'bg-blue-50/40 border-blue-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{vac.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ({vac.category || 'vacina'})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{vac.description}</p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${vac.badgeBg} ${vac.badgeText} ${vac.badgeBorder}`}
                        >
                          {vac.urgencyLabel}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 pt-1 border-t border-slate-200/60">
                        <span>Última: {vac.lastDate}</span>
                        <span className="font-bold text-slate-900">Reforço: {vac.nextDate}</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                        <span className="font-mono">Disparo 7d: {vac.alertDate7d}</span>
                        {vac.is7dAlertActive ? (
                          <span className="text-amber-800 font-bold bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                            ⚡ Alerta 7d Enviado
                          </span>
                        ) : !disabledReminderVacIds.includes(vac.id) ? (
                          <span className="text-emerald-800 font-medium bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            ✓ Lembrete 7d Ativo
                          </span>
                        ) : (
                          <span className="text-slate-400">Pausado</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            setShowNotificationDrawer(false);
                            handleOpenApplyModal(vac);
                          }}
                          className="flex-1 py-1 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Marcar Aplicada</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowNotificationDrawer(false);
                            handleTestDispatch7dReminder(vac);
                          }}
                          className="py-1 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                          title="Testar disparo do lembrete de 7 dias"
                        >
                          <BellRing className="w-3 h-3 text-amber-600" />
                          <span>Testar 7d</span>
                        </button>
                        <button
                          onClick={() => handleSendVaccineWhatsApp(vac)}
                          className="py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setShowNotificationDrawer(false);
                  setReminderModalTab('schedule');
                  setShowReminderModal(true);
                }}
                className="text-xs text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg border border-amber-300 transition-colors"
              >
                <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
                <span>Configurar Agenda 7 Dias</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowNotificationDrawer(false);
                    const elem = document.getElementById('agenda-preventiva');
                    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold underline"
                >
                  Ver Agenda Completa
                </button>
                <button
                  onClick={() => setShowNotificationDrawer(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Marcar Dose como Aplicada */}
      {showApplyVaccineModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900 font-heading">
                  Registrar Aplicação de Dose
                </h3>
                <p className="text-xs text-slate-500">{showApplyVaccineModal.name}</p>
              </div>
              <button
                onClick={() => setShowApplyVaccineModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmVaccineApplication} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-[11px] text-slate-600 border border-slate-100">
                <p>
                  <strong>Paciente:</strong> {dog.name} ({dog.breed})
                </p>
                <p>
                  <strong>Fabricante:</strong> {showApplyVaccineModal.manufacturer}
                </p>
                <p>
                  Ao confirmar, o sistema registrará a dose e calculará automaticamente a data do próximo reforço (365 dias para vacinas, 30 dias para antiparasitários).
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Data de Aplicação (Hoje):
                </label>
                <input
                  type="text"
                  required
                  value={appliedDateInput}
                  onChange={(e) => setAppliedDateInput(e.target.value)}
                  placeholder="DD/MM/AAAA"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lote do Medicamento / Selo:
                </label>
                <input
                  type="text"
                  value={appliedLotInput}
                  onChange={(e) => setAppliedLotInput(e.target.value)}
                  placeholder="Ex: 489112B-2026"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Clínica / Veterinário Responsável:
                </label>
                <input
                  type="text"
                  value={appliedClinicInput}
                  onChange={(e) => setAppliedClinicInput(e.target.value)}
                  placeholder="Ex: Hospital Pet Care (CRMV-SP 24.112)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApplyVaccineModal(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmar Aplicação</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Nova Vacina / Profilaxia */}
      {showAddVaccineModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 font-heading">
                Cadastrar Nova Imunização ou Profilaxia
              </h3>
              <button
                onClick={() => setShowAddVaccineModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewVaccineSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nome da Vacina ou Profilaxia:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Vacina contra Giardíase Canina"
                  value={newVacName}
                  onChange={(e) => setNewVacName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoria:</label>
                  <select
                    value={newVacCategory}
                    onChange={(e) => setNewVacCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-900 outline-none focus:border-slate-900"
                  >
                    <option value="vacina">Vacina Canina</option>
                    <option value="antiparasitario">Antiparasitário</option>
                    <option value="vermifugo">Vermífugo</option>
                    <option value="outro">Outro Tratamento</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fabricante:</label>
                  <input
                    type="text"
                    placeholder="Ex: Zoetis / MSD / Boehringer"
                    value={newVacManufacturer}
                    onChange={(e) => setNewVacManufacturer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lote:</label>
                  <input
                    type="text"
                    placeholder="Ex: G-8890"
                    value={newVacLot}
                    onChange={(e) => setNewVacLot(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-mono text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Última Dose:</label>
                  <input
                    type="text"
                    placeholder={formattedReferenceDate}
                    value={newVacLastDate}
                    onChange={(e) => setNewVacLastDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-mono text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Data Prevista para Próxima Dose (Reforço):
                </label>
                <input
                  type="text"
                  placeholder={getRelativeDateStr(365, referenceDate)}
                  value={newVacNextDate}
                  onChange={(e) => setNewVacNextDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Descrição Clínica / Observações:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Prevenção contra cistos de giárdia e diarréias infecciosas"
                  value={newVacDesc}
                  onChange={(e) => setNewVacDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddVaccineModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Imunização</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
