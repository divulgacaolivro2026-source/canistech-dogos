import React, { useState, useEffect } from 'react';
import { AdCampaign, ContestCandidate, RegisteredAccount, SecurityAuditLog, DonationRecord } from '../types';
import {
  TrendingUp,
  DollarSign,
  Eye,
  MousePointer,
  Award,
  CheckCircle2,
  XCircle,
  Plus,
  ShieldCheck,
  FileCheck,
  Users,
  BarChart3,
  Activity,
  Search,
  Lock,
  Layers,
  Heart,
  Globe,
  ArrowUpRight,
  ShieldAlert,
  Server,
  Zap,
  Trash2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  getRegisteredAccounts,
  getAuditLogs,
  updateAccountStatus,
  deleteUserAccount,
  isSeniorAdmin,
  SENIOR_ADMIN_EMAILS,
} from '../services/authService';
import { getGoldSlotsSummary } from '../services/goldAndPrivacyService';

interface AdminPanelProps {
  campaigns: AdCampaign[];
  onToggleCampaign: (id: string) => void;
  contestCandidates: ContestCandidate[];
  onSetWinner: (candidateId: string) => void;
}

const ROI_CHART_DATA = [
  { mes: 'Mai/26', investimento: 2100, faturamento: 8200, lucro: 6100 },
  { mes: 'Jun/26', investimento: 2250, faturamento: 9400, lucro: 7150 },
  { mes: 'Jul/26', investimento: 2400, faturamento: 10600, lucro: 8200 },
  { mes: 'Ago/26', investimento: 2350, faturamento: 11100, lucro: 8750 },
  { mes: 'Set/26', investimento: 2470, faturamento: 12200, lucro: 9730 },
  { mes: 'Out/26', investimento: 2470, faturamento: 13850, lucro: 11380 },
];

const VOLUNTARY_DONATIONS_DATA: DonationRecord[] = [
  {
    id: 'don-01',
    donorName: 'Mariana & Rafael Silveira',
    dogHonored: 'Thor (Golden Retriever)',
    amount: 250,
    date: '19/10/2026',
    message: 'CanisTech salvou nosso Golden em um episódio tóxico. Vida longa à plataforma gratuita!',
    isMonthly: true,
    tier: 'diamante',
  },
  {
    id: 'don-02',
    donorName: 'Dra. Carolina Mendes (CRMV-SP)',
    dogHonored: 'Maya & Pipoca',
    amount: 150,
    date: '18/10/2026',
    message: 'Apoio institucional e recomendação de prontuário para meus pacientes.',
    isMonthly: true,
    tier: 'ouro',
  },
  {
    id: 'don-03',
    donorName: 'Clube do Vira-Lata Caramelo',
    dogHonored: 'Paçoca (Caramelo)',
    amount: 100,
    date: '17/10/2026',
    message: 'Para ajudar na feira de adoção e vacinação preventiva.',
    isMonthly: false,
    tier: 'prata',
  },
  {
    id: 'don-04',
    donorName: 'Canil Monteverdi (Curitiba/PR)',
    dogHonored: 'Kiara (Bernês)',
    amount: 300,
    date: '15/10/2026',
    message: 'Pela excelência no rastreamento genético CanisGenomics.',
    isMonthly: true,
    tier: 'diamante',
  },
  {
    id: 'don-05',
    donorName: 'Felipe Alcantara',
    dogHonored: 'Zeus (Rottweiler)',
    amount: 80,
    date: '12/10/2026',
    message: 'Excelente controle vacinal. O alerta de 7 dias é perfeito.',
    isMonthly: false,
    tier: 'bronze',
  },
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  campaigns,
  onToggleCampaign,
  contestCandidates,
  onSetWinner,
}) => {
  const [activeTab, setActiveTab] = useState<'geral' | 'contas' | 'roi' | 'analytics' | 'doacoes'>('geral');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showNewCampaignModal, setShowNewCampaignModal] = useState<boolean>(false);
  const [registeredAccounts, setRegisteredAccounts] = useState<RegisteredAccount[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [accountSearch, setAccountSearch] = useState<string>('');
  const [goldSummary, setGoldSummary] = useState(() => getGoldSlotsSummary());

  // New campaign state
  const [campName, setCampName] = useState<string>('');
  const [campAdvertiser, setCampAdvertiser] = useState<string>('');
  const [campRevenue, setCampRevenue] = useState<string>('1200');

  useEffect(() => {
    setRegisteredAccounts(getRegisteredAccounts());
    setAuditLogs(getAuditLogs());
    setGoldSummary(getGoldSlotsSummary());
  }, [activeTab]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const totalRevenue = campaigns
    .filter((c) => c.status === 'active')
    .reduce((acc, c) => acc + c.monthlyRevenue, 0);

  const totalDonations = VOLUNTARY_DONATIONS_DATA.reduce((acc, d) => acc + d.amount, 0);
  const totalImpressions = campaigns.reduce((acc, c) => acc + c.impressions, 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + c.clicks, 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '3.80';

  const filteredAccounts = registeredAccounts.filter(
    (acc) =>
      acc.name.toLowerCase().includes(accountSearch.toLowerCase()) ||
      acc.email.toLowerCase().includes(accountSearch.toLowerCase())
  );

  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-slate-800 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Header com indicador de blindagem sênior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Console Sênior Restrito • 256-bit Shielded</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Acesso Sênior Restrito • 2 Credenciais Autenticadas
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white font-heading tracking-tight mt-1">
            Governança Executiva & Segurança CanisTech
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
            Controle de contas autenticadas, métricas de ROI, inventário de publicidade, captação voluntária e logs de auditoria.
          </p>
        </div>

        <button
          onClick={() => setShowNewCampaignModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Campanha Patrocinada</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setActiveTab('geral')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'geral'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Visão Geral & Campanhas</span>
        </button>

        <button
          onClick={() => setActiveTab('contas')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'contas'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Contas Cadastradas ({registeredAccounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('roi')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'roi'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Investimento vs Retorno (ROI)</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Google Ads & GA4</span>
        </button>

        <button
          onClick={() => setActiveTab('doacoes')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'doacoes'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-500" />
          <span>Doações Voluntárias</span>
        </button>
      </div>

      {/* TAB 1: GERAL & CAMPANHAS */}
      {activeTab === 'geral' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Key Monetization KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Receita Mensal Ativa</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white font-mono">
                R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block">+14.2% vs mês anterior</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Impressões Totais</span>
                <Eye className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white font-mono">
                {totalImpressions.toLocaleString('pt-BR')}
              </p>
              <span className="text-[10px] text-slate-500 font-medium block">Em 3 posições não-intrusivas</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Cliques Qualificados</span>
                <MousePointer className="w-4 h-4 text-[#E07A5F]" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white font-mono">
                {totalClicks.toLocaleString('pt-BR')}
              </p>
              <span className="text-[10px] text-slate-500 font-medium block">Segmentados por raça/saúde</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">CTR Médio</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-emerald-800 dark:text-emerald-400 font-mono">
                {avgCtr}%
              </p>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block">2.4x superior ao e-commerce pet</span>
            </div>
          </div>

          {/* Telemetria e Monitoramento do Clube Gold de Adestramento (200 Vagas Rotativas) */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/15 dark:to-transparent p-5 rounded-2xl border border-amber-300 dark:border-amber-700/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                ⭐
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white font-heading">
                    Clube Gold de Adestramento
                  </h3>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-200 font-bold">
                    Limite 200 Vagas
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Ciclo de 90 dias com rotação automática, emissão instantânea de senha e doação espontânea comunitária
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-6 border-t md:border-t-0 md:border-l border-amber-200 dark:border-amber-800/80 pt-3 md:pt-0 md:pl-6 text-left">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Membros Ativos</span>
                <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {goldSummary.activeCount} <span className="text-xs text-slate-400 font-normal">/ {goldSummary.maxSlots}</span>
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Vagas Livres</span>
                <span className={`text-lg sm:text-xl font-bold font-mono ${
                  goldSummary.remainingSlots > 20
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : goldSummary.remainingSlots > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {goldSummary.remainingSlots}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Arrecadação Espontânea Total</span>
                <span className="text-lg sm:text-xl font-bold font-mono text-emerald-800 dark:text-emerald-400">
                  R$ {goldSummary.totalDonationsBrl.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Campaigns Management Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                  Campanhas de Publicidade & Parceiros Patrocinados
                </h2>
                <p className="text-xs text-slate-500">Controle de veiculação, receita contratada e status de exibição</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[11px]">
                    <th className="py-2.5 px-3 font-semibold rounded-l-lg">Campanha</th>
                    <th className="py-2.5 px-3 font-semibold">Anunciante</th>
                    <th className="py-2.5 px-3 font-semibold">Posicionamento</th>
                    <th className="py-2.5 px-3 font-semibold">Impressões</th>
                    <th className="py-2.5 px-3 font-semibold">Cliques</th>
                    <th className="py-2.5 px-3 font-semibold">CTR</th>
                    <th className="py-2.5 px-3 font-semibold">Receita/mês</th>
                    <th className="py-2.5 px-3 font-semibold rounded-r-lg text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{camp.name}</td>
                      <td className="py-2.5 px-3 text-slate-500">{camp.advertiser}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                          {camp.placement}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{camp.impressions.toLocaleString('pt-BR')}</td>
                      <td className="py-2.5 px-3 font-mono">{camp.clicks.toLocaleString('pt-BR')}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-emerald-700 dark:text-emerald-400">{camp.ctr}%</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        R$ {camp.monthlyRevenue.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            onToggleCampaign(camp.id);
                            showToast(`Status da campanha "${camp.name}" alterado.`);
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                            camp.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 hover:bg-emerald-200'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {camp.status === 'active' ? 'Ativo' : 'Pausado'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Two Column Section: Dog of the Week Publisher & Ylove Verification Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Moderação do Cão da Semana */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>Publicação: Cão da Semana</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Edição Semanal</span>
              </div>

              <div className="space-y-3">
                {contestCandidates.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={c.photoUrl} alt={c.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{c.name} ({c.breed})</h4>
                        <p className="text-[11px] text-slate-500 truncate">{c.location} • {c.votes} votos</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onSetWinner(c.id);
                        showToast(`${c.name} foi homologado e publicado como o Cão da Semana Oficial!`);
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-[#E07A5F] dark:bg-white dark:hover:bg-[#E07A5F] dark:text-slate-900 hover:text-white text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0"
                    >
                      Publicar Vencedor
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Auditoria de Laudos Ylove Pet */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                  <span>Fila de Auditoria de Laudos Ylove</span>
                </h3>
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  2 Pendentes
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Apollo Von Sternberg (Golden)</span>
                    <span className="text-[10px] text-slate-400 font-mono">CBKC #784.992-BR</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Laudos anexados: Raio-X Displasia HD-A, Sorologia Brucelose negativa, DNA Embark.
                  </p>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => showToast('Laudo de Apollo auditado e homologado com Selo CanisTech Ouro!')}
                      className="px-3 py-1 bg-emerald-700 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-800"
                    >
                      Homologar Selo Ouro
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Kiara Bellatrix (Boiadeiro Bernês)</span>
                    <span className="text-[10px] text-slate-400 font-mono">FCI #098/2021</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Laudos anexados: Displasia ED/HD 0/A, Sorologia Brucelose negativa, Ecocardiograma.
                  </p>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => showToast('Laudo de Kiara auditado e homologado com Selo CanisTech Ouro!')}
                      className="px-3 py-1 bg-emerald-700 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-800"
                    >
                      Homologar Selo Ouro
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTAS CADASTRADAS & LOGS DE AUDITORIA */}
      {activeTab === 'contas' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                  Catálogo de Contas Registradas no DogOS
                </h2>
                <p className="text-xs text-slate-500">
                  Gestão de acessos, privilégios hierárquicos e blindagem multi-tenant
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  placeholder="Filtrar por nome ou e-mail..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[11px]">
                    <th className="py-2.5 px-3 font-semibold rounded-l-lg">Usuário / Tutor</th>
                    <th className="py-2.5 px-3 font-semibold">E-mail Cadastrado</th>
                    <th className="py-2.5 px-3 font-semibold">Provedor</th>
                    <th className="py-2.5 px-3 font-semibold">Privilégio</th>
                    <th className="py-2.5 px-3 font-semibold">Acessos</th>
                    <th className="py-2.5 px-3 font-semibold">Último Login</th>
                    <th className="py-2.5 px-3 font-semibold rounded-r-lg text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredAccounts.map((acc) => {
                    const isSenior = isSeniorAdmin(acc.email);

                    return (
                      <tr key={acc.email} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <img src={acc.photoUrl} alt={acc.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{acc.name}</p>
                              {isSenior && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                                  <span>★ Administrador Sênior</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs">{acc.email}</td>
                        <td className="py-2.5 px-3">
                          <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {acc.provider}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isSenior
                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                              : 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}>
                            {isSenior ? 'Sênior Admin' : 'Tutor Registrado'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold">{acc.loginCount || 1}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                          {new Date(acc.lastLoginAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              disabled={isSenior}
                              onClick={() => {
                                const newStatus = acc.status === 'active' ? 'suspended' : 'active';
                                updateAccountStatus(acc.email, newStatus);
                                setRegisteredAccounts(getRegisteredAccounts());
                                showToast(`Conta ${acc.email} agora está ${newStatus === 'active' ? 'Ativa' : 'Suspensa'}.`);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                acc.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 hover:bg-emerald-200'
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                              } ${isSenior ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={isSenior ? 'Conta Sênior Blindada' : 'Alterar status da conta'}
                            >
                              {acc.status === 'active' ? 'Ativo' : 'Suspenso'}
                            </button>

                            {!isSenior ? (
                              <button
                                onClick={() => {
                                  const confirmed = window.confirm(
                                    `Atenção: Deseja realmente excluir permanentemente a conta ${acc.email} e todo o seu cofre de dados DogOS? Esta ação não pode ser desfeita.`
                                  );
                                  if (confirmed) {
                                    const success = deleteUserAccount(acc.email);
                                    if (success) {
                                      setRegisteredAccounts(getRegisteredAccounts());
                                      setAuditLogs(getAuditLogs());
                                      showToast(`Conta ${acc.email} e seu cofre de dados foram excluídos com sucesso.`);
                                    } else {
                                      showToast(`Erro ao excluir conta ${acc.email}.`);
                                    }
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 dark:bg-red-950/40 dark:hover:bg-red-700 transition-colors flex items-center gap-1 border border-red-200 dark:border-red-900 cursor-pointer"
                                title="Excluir Conta Permanentemente"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Excluir</span>
                              </button>
                            ) : (
                              <span
                                className="px-2 py-1 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-not-allowed"
                                title="Conta Master Blindada contra exclusão"
                              >
                                Blindada
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                  Trilha de Auditoria & Segurança em Tempo Real
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {auditLogs.length} eventos registrados localmente
              </span>
            </div>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[11px]">
                    <th className="py-2 px-3 font-semibold">Data/Hora</th>
                    <th className="py-2 px-3 font-semibold">Ação Executada</th>
                    <th className="py-2 px-3 font-semibold">Usuário</th>
                    <th className="py-2 px-3 font-semibold">IP / Origem</th>
                    <th className="py-2 px-3 font-semibold">Status</th>
                    <th className="py-2 px-3 font-semibold">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                  {auditLogs.slice(0, 20).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString('pt-BR')} - {new Date(log.timestamp).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">{log.action}</td>
                      <td className="py-2 px-3">{log.userEmail}</td>
                      <td className="py-2 px-3 text-slate-400">{log.ipMock}</td>
                      <td className="py-2 px-3">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-sans text-xs text-slate-500">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INVESTIMENTO VS RETORNO (ROI) */}
      {activeTab === 'roi' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-400">Custo Operacional Mensal</span>
              <p className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                R$ 2.470,00
              </p>
              <p className="text-[11px] text-slate-500">
                Servidores Cloud (R$ 850) + APIs de Triagem (R$ 420) + Suporte (R$ 1.200)
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-400">Receita Bruta Mensal</span>
              <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                R$ 13.850,00
              </p>
              <p className="text-[11px] text-slate-500">
                Ads Google/Parceiros (R$ 7.600) + Doações (R$ 3.850) + Parcerias (R$ 2.400)
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-400">Retorno sobre Investimento (ROI)</span>
              <p className="text-2xl font-bold font-mono text-[#E07A5F]">
                +460.7%
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Margem Líquida Saudável: R$ 11.380,00 reinvestidos no projeto
              </p>
            </div>
          </div>

          {/* Gráfico Recharts: Investimento vs Faturamento */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                  Evolução Semestral: Custo de Operação vs Retorno Comercial (2026)
                </h3>
                <p className="text-xs text-slate-500">Projeção e dados reais em Reais (R$)</p>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ROI_CHART_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="faturamento" name="Faturamento Bruto (R$)" fill="#10B981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="investimento" name="Custo Operacional (R$)" fill="#EF4444" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="lucro" name="Superávit Líquido (R$)" fill="#E07A5F" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GOOGLE ADS & GOOGLE ANALYTICS 4 */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-400">Usuários Ativos (MAU)</span>
              <p className="text-xl md:text-2xl font-bold font-mono text-slate-900 dark:text-white">48.320</p>
              <span className="text-[10px] text-emerald-600 font-semibold block">+28% tráfego orgânico</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-400">Tempo Médio na Tela</span>
              <p className="text-xl md:text-2xl font-bold font-mono text-slate-900 dark:text-white">4m 38s</p>
              <span className="text-[10px] text-slate-500 font-medium block">Alta retenção no DogOS</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-400">Taxa de Rejeição</span>
              <p className="text-xl md:text-2xl font-bold font-mono text-emerald-600">21.4%</p>
              <span className="text-[10px] text-emerald-600 font-semibold block">Excelente engajamento</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-400">CPC Médio Google Ads</span>
              <p className="text-xl md:text-2xl font-bold font-mono text-[#E07A5F]">R$ 1,42</p>
              <span className="text-[10px] text-slate-500 font-medium block">Nicho veterinário de alto valor</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
              Palavras-Chave de Alto Desempenho (Estratégia SEO & Google Ads 2026)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>"hospital veterinario 24h curitiba / sao paulo"</span>
                  <span className="text-emerald-600">CTR 6.8%</span>
                </div>
                <p className="text-[11px] text-slate-500">Volume: 32.000 buscas/mês • Intenção de emergência hospitalar imediata.</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>"calendario vacinal cachorro atrasado"</span>
                  <span className="text-emerald-600">CTR 8.4%</span>
                </div>
                <p className="text-[11px] text-slate-500">Volume: 18.500 buscas/mês • Conversão direta para uso do DogOS.</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>"meu cachorro comeu chocolate sintomas"</span>
                  <span className="text-emerald-600">CTR 11.2%</span>
                </div>
                <p className="text-[11px] text-slate-500">Volume: 45.000 buscas/mês • Entrada no Guia de Toxicidade e VetChat IA.</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>"displasia coxofemoral bernes golden laudo"</span>
                  <span className="text-emerald-600">CTR 5.9%</span>
                </div>
                <p className="text-[11px] text-slate-500">Volume: 9.800 buscas/mês • Atrai canis éticos para o módulo Ylove Pet.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DOAÇÕES VOLUNTÁRIAS */}
      {activeTab === 'doacoes' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-400">Total Arrecadado no Mês</span>
              <p className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                R$ {totalDonations.toFixed(2)}
              </p>
              <span className="text-[10px] text-emerald-600 font-semibold block">100% investido na manutenção do DogOS</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-400">Doadores Ativos</span>
              <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {VOLUNTARY_DONATIONS_DATA.length}
              </p>
              <span className="text-[10px] text-slate-500 font-medium block">60% recorrentes mensais</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-slate-400">Ticket Médio por Apoio</span>
              <p className="text-2xl font-bold font-mono text-[#E07A5F]">
                R$ {(totalDonations / VOLUNTARY_DONATIONS_DATA.length).toFixed(2)}
              </p>
              <span className="text-[10px] text-emerald-600 font-semibold block">Público altamente engajado</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
              Histórico de Doações Voluntárias Recebidas
            </h3>

            <div className="space-y-3">
              {VOLUNTARY_DONATIONS_DATA.map((d) => (
                <div
                  key={d.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 dark:text-white">{d.donorName}</strong>
                      {d.dogHonored && (
                        <span className="text-[10px] text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-full font-semibold">
                          Em homenagem a: {d.dogHonored}
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                        {d.tier}
                      </span>
                    </div>
                    {d.message && <p className="text-slate-500 dark:text-slate-400 italic">"{d.message}"</p>}
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      R$ {d.amount.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{d.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Criar Campanha */}
      {showNewCampaignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm font-heading">
                Nova Campanha / Espaço de Monetização
              </h3>
              <button
                onClick={() => setShowNewCampaignModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Título do Anúncio:</label>
                <input
                  type="text"
                  placeholder="Ex: Ração Fórmula Sênior Articular"
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Anunciante / Marca:</label>
                <input
                  type="text"
                  placeholder="Ex: RoyalPet / BioNutri"
                  value={campAdvertiser}
                  onChange={(e) => setCampAdvertiser(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Receita Mensal Estimada (R$):</label>
                <input
                  type="number"
                  value={campRevenue}
                  onChange={(e) => setCampRevenue(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewCampaignModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 font-semibold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowNewCampaignModal(false);
                  showToast(`Campanha "${campName || 'Nova Campanha'}" cadastrada com sucesso!`);
                  setCampName('');
                  setCampAdvertiser('');
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold text-xs"
              >
                Ativar Campanha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
