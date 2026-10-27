import React, { useState } from 'react';
import { ToxicItem, BreedInfo } from '../types';
import {
  Search,
  AlertOctagon,
  AlertTriangle,
  Info,
  ShieldAlert,
  Flame,
  Home,
  Activity,
  HeartPulse,
  Sparkles,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface ToxicityGuideViewProps {
  toxicItems: ToxicItem[];
  breeds: BreedInfo[];
  onOpenVetChat: (query?: string) => void;
  onSelectBreed: (breed: BreedInfo) => void;
}

export const ToxicityGuideView: React.FC<ToxicityGuideViewProps> = ({
  toxicItems,
  breeds,
  onOpenVetChat,
  onSelectBreed,
}) => {
  const [activeTab, setActiveTab] = useState<'toxicidade' | 'enciclopedia'>('toxicidade');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDangerFilter, setSelectedDangerFilter] = useState<'all' | 'fatal' | 'severe' | 'moderate'>('all');

  // Breed filters
  const [breedSearchQuery, setBreedSearchQuery] = useState<string>('');
  const [breedSizeFilter, setBreedSizeFilter] = useState<string>('all');
  const [breedHeatFilter, setBreedHeatFilter] = useState<string>('all');
  const [breedHousingFilter, setBreedHousingFilter] = useState<string>('all');
  const [breedCategoryFilter, setBreedCategoryFilter] = useState<string>('all');

  // Filtered toxic items
  const filteredToxic = toxicItems.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      item.name.toLowerCase().includes(q) ||
      item.toxicPrinciple.toLowerCase().includes(q) ||
      item.primaryRisk.toLowerCase().includes(q) ||
      item.clinicalSymptoms.some((s) => s.toLowerCase().includes(q));

    const matchesDanger = selectedDangerFilter === 'all' || item.dangerLevel === selectedDangerFilter;
    return matchesQuery && matchesDanger;
  });

  // Filtered breeds
  const filteredBreeds = breeds.filter((b) => {
    const q = breedSearchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      b.name.toLowerCase().includes(q) ||
      b.origin.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q) ||
      b.coatCareInBrazil.toLowerCase().includes(q);

    const matchSize = breedSizeFilter === 'all' || b.size === breedSizeFilter;
    const matchHeat = breedHeatFilter === 'all' || b.heatTolerance === breedHeatFilter;
    const matchHousing = breedHousingFilter === 'all' || b.housing === breedHousingFilter;

    let matchCategory = true;
    if (breedCategoryFilter === 'nacional') {
      matchCategory =
        b.origin.toLowerCase().includes('brasil') ||
        b.id.includes('campeiro') ||
        b.id.includes('fila') ||
        b.id.includes('srd');
    } else if (breedCategoryFilter === 'braquicefalicos') {
      matchCategory =
        b.name.includes('Buldogue') ||
        b.name.includes('Pug') ||
        b.name.includes('Shih Tzu');
    } else if (breedCategoryFilter === 'trabalho') {
      matchCategory =
        b.group === 'trabalho' ||
        b.group === 'pastores' ||
        b.name.includes('Rottweiler') ||
        b.name.includes('Malinois');
    } else if (breedCategoryFilter === 'companhia') {
      matchCategory = b.housing === 'apartamento' || b.size === 'pequeno';
    }

    return matchSearch && matchSize && matchHeat && matchHousing && matchCategory;
  });

  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Subheader Navigation Pills */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('toxicidade')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'toxicidade'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertOctagon className="w-4 h-4 text-red-600" />
            <span>Central de Toxicidade Canina</span>
          </button>
          <button
            onClick={() => setActiveTab('enciclopedia')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'enciclopedia'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-4 h-4 text-[#E07A5F]" />
            <span>Enciclopédia & Clima Brasileiro</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Revisão Farmacológica & Zoometria Canina 2025</span>
        </div>
      </div>

      {/* SECTION A: CENTRAL DE TOXICIDADE CANINA */}
      {activeTab === 'toxicidade' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <span className="text-[11px] uppercase tracking-wider font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100">
                Segurança Alimentar & Farmacêutica
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-heading tracking-tight">
                O que seu cão NÃO pode comer ou usar
              </h1>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                Mapeamento biológico de substâncias cotidianas, plantas ornamentais e medicamentos humanos incompatíveis com o metabolismo canino.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar: chocolate, cebola, remédio..."
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900 shadow-xs"
              />
            </div>
          </div>

          {/* Emergency Triage Banner */}
          <div className="bg-gradient-to-r from-red-500/10 via-slate-50 to-orange-500/10 p-4 md:p-5 rounded-2xl border border-red-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs md:text-sm text-slate-900">
                    Seu cão ingeriu algo suspeito há menos de 2 horas?
                  </span>
                  <span className="text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded">
                    URGÊNCIA
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Não induza o vômito sem supervisão veterinária. Substâncias cáusticas ou perfurantes causam lesão esofágica dupla.
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenVetChat('EMERGÊNCIA: Meu cachorro comeu algo suspeito agora pouco!')}
              className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-transform active:scale-95 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              <span>Triagem Imediata IA 24h</span>
            </button>
          </div>

          {/* Danger Level Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
            <button
              onClick={() => setSelectedDangerFilter('all')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedDangerFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Todos ({toxicItems.length})
            </button>
            <button
              onClick={() => setSelectedDangerFilter('fatal')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedDangerFilter === 'fatal'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Grau Máximo (Letal)
            </button>
            <button
              onClick={() => setSelectedDangerFilter('severe')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedDangerFilter === 'severe'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              Grau Severo (Risco Clínico)
            </button>
            <button
              onClick={() => setSelectedDangerFilter('moderate')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedDangerFilter === 'moderate'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Atenção & Risco Físico
            </button>
          </div>

          {/* Toxicity Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredToxic.map((item) => {
              let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
              let tag = 'Atenção';
              if (item.dangerLevel === 'fatal') {
                badgeColor = 'bg-red-100 text-red-900 border-red-200';
                tag = 'Emergência Letal';
              } else if (item.dangerLevel === 'severe') {
                badgeColor = 'bg-orange-100 text-orange-900 border-orange-200';
                tag = 'Risco Clínico Severo';
              }

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-slate-900 font-heading">
                        {item.name}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor} shrink-0`}>
                        {tag}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <strong>Princípio:</strong> {item.toxicPrinciple}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      <strong>Risco Primário:</strong> {item.primaryRisk}
                    </p>

                    <div>
                      <p className="text-[11px] font-bold text-slate-700 mb-1">Sinais Clínicos Típicos:</p>
                      <ul className="text-[11px] text-slate-600 space-y-0.5 list-disc list-inside">
                        {item.clinicalSymptoms.slice(0, 3).map((sym, idx) => (
                          <li key={idx} className="leading-snug">{sym}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="text-[10px] text-slate-500">
                      <strong>Dose Crítica:</strong> {item.criticalDose}
                    </div>
                    <button
                      onClick={() => onOpenVetChat(`Meu cão ingeriu ${item.name}. Qual o protocolo de urgência?`)}
                      className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Simular Conduta IA</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Semiotics of Poisoning Checklist */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-red-600 tracking-wider">
                Semiotécnica de Urgência
              </span>
              <h3 className="text-base font-bold text-slate-900 font-heading mt-0.5">
                Sintomas Típicos de Envenenamento e Intoxicação
              </h3>
              <p className="text-xs text-slate-600">
                Fique atento ao aparecimento súbito destes 6 sinais clínicos nas primeiras horas pós-ingestão:
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs font-bold text-red-600">01. Salivação</span>
                <p className="text-[11px] text-slate-600 leading-snug">Salivação espumosa abundante e náusea cáustica.</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs font-bold text-orange-600">02. Tremores</span>
                <p className="text-[11px] text-slate-600 leading-snug">Fasciculações musculares e crises convulsivas.</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs font-bold text-slate-900">03. Pupilas</span>
                <p className="text-[11px] text-slate-600 leading-snug">Midríase (dilatação extrema) sem reflexo à luz.</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs font-bold text-red-600">04. Êmese</span>
                <p className="text-[11px] text-slate-600 leading-snug">Vômito com sangue vivo ou coloração escura.</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs font-bold text-orange-600">05. Letargia</span>
                <p className="text-[11px] text-slate-600 leading-snug">Queda de sustentação, desmaio e hipotermia.</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs font-bold text-slate-900">06. Gengivas</span>
                <p className="text-[11px] text-slate-600 leading-snug">Mucosa pálida ou azulada (sinal de hipóxia grave).</p>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
              <strong>Aviso Regulatório CFMV:</strong> Este guia possui propósito educativo e preventivo. Jamais substitua o atendimento médico presencial. Não ofereça leite, óleo ou carvão ativado sem dosagem e orientação de um Médico Veterinário.
            </div>
          </div>
        </div>
      )}

      {/* SECTION B: ENCICLOPÉDIA DE RAÇAS & CLIMA BRASILEIRO */}
      {activeTab === 'enciclopedia' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#E07A5F] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100">
                Zoometria & Termorregulação Tropical
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 font-heading tracking-tight">
                Enciclopédia de Raças & Adaptação ao Clima Brasileiro
              </h2>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                Parâmetros bioclimáticos para escolha e convivência responsável no Brasil. Avalie sensibilidade a ondas de calor, tolerância ao mormaço, tipologia habitacional e gasto diário de energia.
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{filteredBreeds.length} de {breeds.length} raças catalogadas</span>
              </div>
            </div>
          </div>

          {/* Search & Interactive Filters Ribbon */}
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            {/* Direct Breed Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar raça por nome ou característica (ex: Rottweiler, Salsichinha, Buldogue Campeiro, Fila, Shih Tzu, Pug, Pinscher, Malinois, Poodle)..."
                value={breedSearchQuery}
                onChange={(e) => setBreedSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
              />
              {breedSearchQuery && (
                <button
                  onClick={() => setBreedSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Category Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Filtro rápido:</span>
              <button
                onClick={() => setBreedCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  breedCategoryFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas ({breeds.length})
              </button>
              <button
                onClick={() => setBreedCategoryFilter('nacional')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  breedCategoryFilter === 'nacional'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <span>🇧🇷 Raças Nacionais</span>
              </button>
              <button
                onClick={() => setBreedCategoryFilter('braquicefalicos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  breedCategoryFilter === 'braquicefalicos'
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100'
                }`}
              >
                <span>⚠️ Braquicefálicos (Calor Crítico)</span>
              </button>
              <button
                onClick={() => setBreedCategoryFilter('trabalho')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  breedCategoryFilter === 'trabalho'
                    ? 'bg-blue-700 text-white'
                    : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                <span>🛡️ Guarda & Trabalho</span>
              </button>
              <button
                onClick={() => setBreedCategoryFilter('companhia')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  breedCategoryFilter === 'companhia'
                    ? 'bg-purple-700 text-white'
                    : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
                }`}
              >
                <span>🏢 Apartamento & Colo</span>
              </button>
            </div>

            {/* Dropdowns for Bioclimatic Parameters */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-900">
              <span className="flex items-center gap-1.5 text-slate-700">
                <Filter className="w-3.5 h-3.5 text-[#E07A5F]" />
                Parâmetros Bioclimáticos Específicos
              </span>
              <button
                onClick={() => {
                  setBreedSearchQuery('');
                  setBreedSizeFilter('all');
                  setBreedHeatFilter('all');
                  setBreedHousingFilter('all');
                  setBreedCategoryFilter('all');
                }}
                className="text-xs text-[#E07A5F] hover:underline font-semibold"
              >
                Redefinir Filtros
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Porte Corporal:</label>
                <select
                  value={breedSizeFilter}
                  onChange={(e) => setBreedSizeFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white focus:border-slate-800"
                >
                  <option value="all">Todos os Portes</option>
                  <option value="pequeno">Porte Pequeno (até 10kg)</option>
                  <option value="medio">Porte Médio (11 a 25kg)</option>
                  <option value="grande">Porte Grande (acima de 25kg)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Tolerância ao Calor BR:</label>
                <select
                  value={breedHeatFilter}
                  onChange={(e) => setBreedHeatFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white focus:border-slate-800"
                >
                  <option value="all">Qualquer Tolerância</option>
                  <option value="alta">Alta Resistência Tropical (Adaptado)</option>
                  <option value="moderada">Moderada (Requer Sombra & Água)</option>
                  <option value="baixa">Baixa (Sensível / Risco de Choque Térmico)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Ambiente Adequado:</label>
                <select
                  value={breedHousingFilter}
                  onChange={(e) => setBreedHousingFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white focus:border-slate-800"
                >
                  <option value="all">Qualquer Moradia</option>
                  <option value="apartamento">Apartamento Climatizado</option>
                  <option value="casa">Casa com Quintal</option>
                  <option value="sitio">Sítio / Área Ampla</option>
                </select>
              </div>
            </div>
          </div>

          {/* Empty state if no breeds match */}
          {filteredBreeds.length === 0 && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto" />
              <h3 className="font-bold text-slate-900">Nenhuma raça encontrada com esses filtros</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tente ajustar a busca por nome ou redefinir os filtros de tolerância ao calor e moradia.
              </p>
              <button
                onClick={() => {
                  setBreedSearchQuery('');
                  setBreedSizeFilter('all');
                  setBreedHeatFilter('all');
                  setBreedHousingFilter('all');
                  setBreedCategoryFilter('all');
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          )}

          {/* Breed Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBreeds.map((b) => {
              const isBrazilian =
                b.origin.toLowerCase().includes('brasil') ||
                b.id.includes('campeiro') ||
                b.id.includes('fila') ||
                b.id.includes('srd');

              return (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-52 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={b.photoUrl}
                        alt={b.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />

                      {/* Weight pill */}
                      <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-800 shadow-xs flex items-center gap-1">
                        <span>⚖️</span>
                        <span>{b.weightRange}</span>
                      </div>

                      {/* Brazilian heritage badge */}
                      {isBrazilian && (
                        <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs flex items-center gap-1">
                          <span>🇧🇷</span>
                          <span>Raça Nacional</span>
                        </div>
                      )}

                      <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-slate-900/85 backdrop-blur-xs text-white p-2.5 rounded-xl text-xs">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-bold font-heading text-sm text-white">{b.name}</p>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-white/10 rounded-md">
                            {b.group}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300 truncate mt-0.5">{b.origin}</p>
                      </div>
                    </div>

                    <div className="p-4 space-y-3 text-xs">
                      <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Flame className="w-3.5 h-3.5 text-orange-500" />
                            <span>Tolerância ao Calor BR:</span>
                          </span>
                          <span
                            className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                              b.heatTolerance === 'alta'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.heatTolerance === 'moderada'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {b.heatTolerance === 'alta'
                              ? 'Alta (Adaptado)'
                              : b.heatTolerance === 'moderada'
                              ? 'Moderada'
                              : 'Baixa (Atenção Máxima)'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Home className="w-3.5 h-3.5 text-slate-500" />
                            <span>Ambiente Indicado:</span>
                          </span>
                          <strong className="text-slate-900 capitalize font-semibold">{b.housing}</strong>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Activity className="w-3.5 h-3.5 text-[#E07A5F]" />
                            <span>Exercício Diário:</span>
                          </span>
                          <strong className="text-slate-900 font-mono font-bold">{b.exerciseDailyMin} min/dia</strong>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">
                        {b.description}
                      </p>

                      <div className="p-2.5 bg-amber-50/60 rounded-xl text-[11px] text-slate-700 border border-amber-200/60 leading-snug">
                        <strong className="text-amber-900 block font-semibold mb-0.5">☀️ Manejo no Clima Tropical:</strong>
                        {b.coatCareInBrazil}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Predisposições Genéticas Notórias:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {b.geneticRisks.slice(0, 3).map((risk, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded-md border border-slate-200 truncate max-w-[190px]"
                            >
                              {risk}
                            </span>
                          ))}
                          {b.geneticRisks.length > 3 && (
                            <span className="px-1.5 py-0.5 text-[10px] text-slate-400 font-semibold">
                              +{b.geneticRisks.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 space-y-2">
                    <button
                      onClick={() => onSelectBreed(b)}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#E07A5F]" />
                      <span>Ver Ficha Biológica Completa</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                    </button>
                    <button
                      onClick={() =>
                        onOpenVetChat(
                          `Olá! Gostaria de saber mais sobre a adaptação e cuidados específicos do cão da raça ${b.name} no clima brasileiro.`
                        )
                      }
                      className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Tirar dúvidas desta raça com Vet IA</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
