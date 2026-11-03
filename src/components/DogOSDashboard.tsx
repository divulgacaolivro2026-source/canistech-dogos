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
import { OfficialRgcDocument } from './OfficialRgcDocument';
import { formatRgcCpf, QrCodeSvg } from '../utils/qrCodeGenerator';
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
  onNavigateToVaccines?: () => void;
  onUpdateVaccine?: (vaccine: VaccineRecord) => void;
  onAddVaccine?: (vaccine: VaccineRecord) => void;
  onOpenRegisterDog?: () => void;
  onUpdateDog?: (updatedDog: DogProfile) => void;
  onOpenEditDog?: (dog: DogProfile) => void;
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
  onNavigateToVaccines,
  onUpdateVaccine,
  onAddVaccine,
  onOpenRegisterDog,
  onUpdateDog,
  onOpenEditDog,
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
  const [dismissedBanner, setDismissedBanner] = useState<boolean>(false);
  const [simulatedDateOffsetDays, setSimulatedDateOffsetDays] = useState<number>(0);
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

  // 7-Day reminder alerts
  const triggered7dAlerts = useMemo(() => {
    return processedVaccines.filter((v) => v.is7dAlertActive);
  }, [processedVaccines]);

  // Urgency summary counts
  const vaccineSummary = useMemo(() => {
    return getVaccineUrgencySummary(processedVaccines);
  }, [processedVaccines]);

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
    if (!dog) return;
    if (dog.vitalStatus === 'deceased') {
      triggerToast('Emissão de documentos bloqueada: animal com registro de óbito.');
      return;
    }
    if (!dog.photoUrl || dog.photoUrl.trim() === '' || dog.photoUrl.toLowerCase().includes('placeholder')) {
      triggerToast('Fotografia 3x4 obrigatória para emissão do RGC. Abra a edição para enviar a foto.');
      if (onOpenEditDog) onOpenEditDog(dog);
      return;
    }
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
                    if (onNavigateToVaccines) onNavigateToVaccines();
                    setSimulatedPushAlert(null);
                  }}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                >
                  Ver no Módulo de Vacinas
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
              {dog.kennelAffix && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                  Afixo: {dog.kennelAffix}
                </span>
              )}
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
          {/* Atalho Direto para a Nova Página Exclusiva de Vacinas & Imunização */}
          <button
            onClick={() => onNavigateToVaccines && onNavigateToVaccines()}
            className={`relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              vaccineSummary.urgentCount > 0
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
            title="Ir para a Página Exclusiva de Vacinas & Imunização (WSAVA 2024)"
          >
            {vaccineSummary.urgentCount > 0 ? (
              <BellRing className="w-4 h-4 text-amber-600 animate-bounce" />
            ) : (
              <Syringe className="w-4 h-4 text-emerald-600" />
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

      {/* Memorial Banner for Deceased Dogs */}
      {dog.vitalStatus === 'deceased' && (
        <div className="bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-slate-500/10 border-2 border-rose-300 dark:border-rose-800 rounded-3xl p-5 shadow-sm space-y-2 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-2xl bg-rose-600 text-white shadow-sm shrink-0">
                <Heart className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900/60 text-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-700">
                    Registro de Falecimento / Memória
                  </span>
                  <span className="text-xs text-rose-800 dark:text-rose-300 font-semibold font-mono">
                    Óbito em: {dog.deceasedDate || 'Registrado'}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white font-heading">
                  Conta e Operações Ativas de {dog.name} Encerradas
                </h2>
                <p className="text-xs text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed">
                  Em memória de {dog.name}. As operações clínicas ativas (como agendamentos, novos registros e emissões de documentos) foram finalizadas por normas de segurança. O histórico de peso, biometria e vacinas permanece arquivado com carinho para consulta.
                </p>
              </div>
            </div>
            {onOpenEditDog && (
              <button
                onClick={() => onOpenEditDog(dog)}
                className="self-start sm:self-auto px-4 py-2 bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 hover:bg-rose-50 dark:hover:bg-slate-700 text-rose-950 dark:text-rose-200 rounded-xl text-xs font-bold transition-colors"
              >
                Gerenciar Ficha do Pet
              </button>
            )}
          </div>
        </div>
      )}

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
                        onClick={() => onNavigateToVaccines && onNavigateToVaccines()}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:scale-102 cursor-pointer ${
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
                      🔔 <strong>{triggered7dAlerts.length} lembrete(s) com 7 dias de antecedência</strong> acionados e enviados via E-mail ({dog.tutorEmail || 'cadastrado'}) e Push!
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions in Banner */}
            <div className="flex flex-wrap md:flex-col lg:flex-row items-center gap-2 shrink-0">
              <button
                onClick={() => onNavigateToVaccines && onNavigateToVaccines()}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Acessar página de vacinas e lembretes de 7 dias"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span>Ver Vacinas & Lembretes</span>
              </button>
              <button
                onClick={() => onNavigateToVaccines && onNavigateToVaccines()}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Central de Imunização</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (vaccineSummary.mostUrgent) {
                    handleSendVaccineWhatsApp(vaccineSummary.mostUrgent);
                  }
                }}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Agendar no WhatsApp</span>
              </button>
              <button
                onClick={() => setDismissedBanner(true)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-amber-200/40 transition-colors cursor-pointer"
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
            onClick={() => onNavigateToVaccines && onNavigateToVaccines()}
            className="text-amber-700 hover:text-amber-900 underline font-semibold text-xs ml-2 cursor-pointer"
          >
            Abrir Central de Vacinas
          </button>
        </div>
      ) : null}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 8 cols - Clinical modules */}
        <div className="lg:col-span-8 space-y-6">
          {/* Module 1: Documento Oficial de Identificação e Biometria Canina (RGC) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4 gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-950 text-[#E07A5F]">
                  <FileCheck2 className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                    Documento Oficial de Identificação e Biometria Canina (RGC)
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Padrão Oficial Brasileiro (CIN / CPF Canino) • Proporção ISO ID-1 com QR Code e Hash de Segurança
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onOpenEditDog && (
                  <button
                    onClick={() => onOpenEditDog(dog)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    Editar Dados / Foto
                  </button>
                )}
              </div>
            </div>

            <OfficialRgcDocument
              dog={dog}
              onOpenEditPhoto={() => onOpenEditDog && onOpenEditDog(dog)}
              onRenewBiennialLifeProof={() => onOpenEditDog && onOpenEditDog(dog)}
              onUpdateDog={onUpdateDog}
            />
          </div>

          {/* Module 1B: Dossiê Genealógico • Árvore de Pedigree de 3 Gerações & Afixo do Canil */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                    Árvore Genealógica de 3 Gerações (Pedigree &amp; Afixo do Canil)
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Afixo Oficial: <strong>{dog.kennelAffix || 'Registro Particular / Não informado'}</strong> • Base para cálculo determinístico do Coeficiente de Wright (COI)
                  </p>
                </div>
              </div>
              {onOpenEditDog && (
                <button
                  onClick={() => onOpenEditDog(dog)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Editar Pedigree
                </button>
              )}
            </div>

            {dog.pedigree && (dog.pedigree.father?.name || dog.pedigree.mother?.name) ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* 1ª Geração: Exemplar Titular */}
                <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex flex-col justify-center space-y-1.5 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                    1ª GERAÇÃO • EXEMPLAR TITULAR
                  </span>
                  <p className="text-sm font-black font-heading uppercase">{dog.name}</p>
                  <p className="text-[11px] text-slate-300">{dog.breed}</p>
                  {dog.kennelAffix && (
                    <p className="text-[10px] text-emerald-400 font-semibold">
                      Canil: {dog.kennelAffix}
                    </p>
                  )}
                  <p className="text-[10px] font-mono text-slate-400">
                    RGC: {formatRgcCpf(dog.rgNumber, dog.id)}
                  </p>
                </div>

                {/* 2ª Geração: Pais (Padreador & Matriz) */}
                <div className="space-y-2 flex flex-col justify-center">
                  <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-0.5">
                    <span className="text-[9.5px] font-bold uppercase text-blue-700 dark:text-blue-400 block">
                      2ª GERAÇÃO • PAI (PADREADOR)
                    </span>
                    <strong className="text-slate-900 dark:text-white block truncate">
                      {dog.pedigree.father?.name || 'Não informado'}
                    </strong>
                    <span className="text-[10px] font-mono text-slate-500 block">
                      RG/CBKC: {dog.pedigree.father?.regNumber || dog.pedigree.father?.registrationNumber || 'N/I'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 space-y-0.5">
                    <span className="text-[9.5px] font-bold uppercase text-rose-700 dark:text-rose-400 block">
                      2ª GERAÇÃO • MÃE (MATRIZ)
                    </span>
                    <strong className="text-slate-900 dark:text-white block truncate">
                      {dog.pedigree.mother?.name || 'Não informado'}
                    </strong>
                    <span className="text-[10px] font-mono text-slate-500 block">
                      RG/CBKC: {dog.pedigree.mother?.regNumber || dog.pedigree.mother?.registrationNumber || 'N/I'}
                    </span>
                  </div>
                </div>

                {/* 3ª Geração: 4 Avós (Paternos e Maternos) */}
                <div className="grid grid-cols-1 gap-1.5">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Avô Paterno</span>
                      <strong className="text-[11px] text-slate-900 dark:text-white block truncate">
                        {dog.pedigree.paternalGrandfather?.name || 'Não informado'}
                      </strong>
                    </div>
                    <span className="text-[9.5px] font-mono text-slate-500 shrink-0">
                      {dog.pedigree.paternalGrandfather?.regNumber || dog.pedigree.paternalGrandfather?.registrationNumber || 'N/I'}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Avó Paterna</span>
                      <strong className="text-[11px] text-slate-900 dark:text-white block truncate">
                        {dog.pedigree.paternalGrandmother?.name || 'Não informado'}
                      </strong>
                    </div>
                    <span className="text-[9.5px] font-mono text-slate-500 shrink-0">
                      {dog.pedigree.paternalGrandmother?.regNumber || dog.pedigree.paternalGrandmother?.registrationNumber || 'N/I'}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Avô Materno</span>
                      <strong className="text-[11px] text-slate-900 dark:text-white block truncate">
                        {dog.pedigree.maternalGrandfather?.name || 'Não informado'}
                      </strong>
                    </div>
                    <span className="text-[9.5px] font-mono text-slate-500 shrink-0">
                      {dog.pedigree.maternalGrandfather?.regNumber || dog.pedigree.maternalGrandfather?.registrationNumber || 'N/I'}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Avó Materna</span>
                      <strong className="text-[11px] text-slate-900 dark:text-white block truncate">
                        {dog.pedigree.maternalGrandmother?.name || 'Não informado'}
                      </strong>
                    </div>
                    <span className="text-[9.5px] font-mono text-slate-500 shrink-0">
                      {dog.pedigree.maternalGrandmother?.regNumber || dog.pedigree.maternalGrandmother?.registrationNumber || 'N/I'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 dark:text-amber-200">
                <div>
                  <strong className="block">Aguardando Árvore Genealógica (3 Gerações)</strong>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    Preencha o Pedigree (Pai, Mãe e 4 Avós com RG/CBKC) no cadastro do cão para habilitar a árvore genealógica completa e o cálculo determinístico de COI no YlovePet.
                  </p>
                </div>
                {onOpenEditDog && (
                  <button
                    onClick={() => onOpenEditDog(dog)}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs shrink-0 transition-colors"
                  >
                    + Preencher Pedigree
                  </button>
                )}
              </div>
            )}
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

          {/* Módulo 3: Central de Vacinas & Imunização Canina (Atalho para Página Exclusiva) */}
          <div
            id="agenda-preventiva"
            className="bg-gradient-to-r from-emerald-900/10 via-teal-900/5 to-slate-50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 rounded-3xl p-6 border border-emerald-500/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5 scroll-mt-24"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                <Syringe className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                    Central de Vacinas & Imunização Canina
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    WSAVA 2024
                  </span>
                  {vaccineSummary.urgentCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                      {vaccineSummary.urgentCount} Alerta(s) Ativo(s)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                  Os protocolos de vacinação (V8/V10/V12, Raiva, Tosse dos Canis, alertas com 7 dias de antecedência e emissão da Carteira Física com selos 45x20mm) foram centralizados na nova página exclusiva de Vacinas.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToVaccines && onNavigateToVaccines()}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <span>Acessar Página de Vacinas</span>
              <ChevronRight className="w-4 h-4" />
            </button>
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

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 inline-block shadow-inner">
              <QrCodeSvg
                value={
                  typeof window !== 'undefined'
                    ? `${window.location.origin}/?view=dossier&dogId=${encodeURIComponent(
                        dog.id
                      )}&rgc=${encodeURIComponent(formatRgcCpf(dog.rgNumber, dog.id))}`
                    : `https://canistech.net.br/?view=dossier&dogId=${dog.id}&rgc=${formatRgcCpf(
                        dog.rgNumber,
                        dog.id
                      )}`
                }
                size={160}
                className="mx-auto"
                title={`QR Tag de Emergência: ${dog.name}`}
              />
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

          </div>
  );
};
