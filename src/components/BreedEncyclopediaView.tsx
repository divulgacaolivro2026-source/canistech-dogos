import React, { useState } from 'react';
import { BreedInfo } from '../types';
import {
  Search,
  Flame,
  Home,
  Activity,
  Filter,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Heart,
  HelpCircle,
  Dna,
} from 'lucide-react';

interface BreedEncyclopediaViewProps {
  breeds: BreedInfo[];
  onSelectBreed: (breed: BreedInfo) => void;
  onOpenVetChat: (query?: string) => void;
  onNavigateToDonation?: () => void;
}

export const BreedEncyclopediaView: React.FC<BreedEncyclopediaViewProps> = ({
  breeds,
  onSelectBreed,
  onOpenVetChat,
  onNavigateToDonation,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [heatFilter, setHeatFilter] = useState<string>('all');
  const [housingFilter, setHousingFilter] = useState<string>('all');

  const filteredBreeds = breeds.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      b.name.toLowerCase().includes(q) ||
      b.origin.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q) ||
      b.coatCareInBrazil.toLowerCase().includes(q);

    const matchSize = sizeFilter === 'all' || b.size === sizeFilter;
    const matchHeat = heatFilter === 'all' || b.heatTolerance === heatFilter;
    const matchHousing = housingFilter === 'all' || b.housing === housingFilter;

    let matchCategory = true;
    if (categoryFilter === 'nacional') {
      matchCategory =
        b.origin.toLowerCase().includes('brasil') ||
        b.id.includes('campeiro') ||
        b.id.includes('fila') ||
        b.id.includes('srd') ||
        b.id.includes('terrier-brasileiro') ||
        b.id.includes('rastreador') ||
        b.id.includes('dogue-brasileiro') ||
        b.id.includes('ovelheiro');
    } else if (categoryFilter === 'braquicefalicos') {
      matchCategory =
        b.name.includes('Buldogue') ||
        b.name.includes('Pug') ||
        b.name.includes('Shih Tzu') ||
        b.name.includes('Boxer') ||
        b.name.includes('Boston');
    } else if (categoryFilter === 'trabalho') {
      matchCategory =
        b.group === 'trabalho' ||
        b.name.includes('Rottweiler') ||
        b.name.includes('Doberman') ||
        b.name.includes('Corso');
    } else if (categoryFilter === 'pastores') {
      matchCategory = b.group === 'pastores' || b.name.includes('Pastor');
    } else if (categoryFilter === 'apartamento') {
      matchCategory = b.housing === 'apartamento' || b.size === 'pequeno';
    } else if (categoryFilter === 'alta-resistencia') {
      matchCategory = b.heatTolerance === 'alta';
    }

    return matchSearch && matchSize && matchHeat && matchHousing && matchCategory;
  });

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setSizeFilter('all');
    setHeatFilter('all');
    setHousingFilter('all');
  };

  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-700 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#E07A5F]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-[#E07A5F] border border-white/10">
              <Flame className="w-3.5 h-3.5" />
              <span>Zoometria, Genética & Termorregulação Tropical</span>
            </div>

            <h1 className="text-2xl md:text-4xl font-black font-heading tracking-tight leading-tight">
              Enciclopédia de Raças & Adaptação ao Clima Brasileiro
            </h1>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Catálogo completo de raças caninas reconhecidas (CBKC/FCI e autóctones nacionais). Avalie a tolerância a ondas de calor, sensibilidade ao mormaço, tipo de moradia ideal e predisposições genéticas conhecidas para cuidar melhor do seu pet.
            </p>
          </div>

          <div className="text-left md:text-right shrink-0 space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-xs text-emerald-200 font-bold backdrop-blur-md">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>{filteredBreeds.length} de {breeds.length} Raças Catalogadas</span>
            </div>
            {onNavigateToDonation && (
              <button
                onClick={onNavigateToDonation}
                className="block text-xs text-slate-400 hover:text-white transition-colors"
              >
                Gostou do guia? <span className="text-[#E07A5F] underline font-semibold">Apoie este projeto</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Search Dashboard */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar raça por nome ou característica (ex: Rottweiler, Salsichinha, Buldogue Campeiro, Fila, Golden, Husky, Shih Tzu, Pug, Pinscher, Malinois, Dálmata)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-bold bg-slate-200 hover:bg-slate-300 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-400 mr-1">Filtrar por:</span>
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({breeds.length})
          </button>
          <button
            onClick={() => setCategoryFilter('nacional')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              categoryFilter === 'nacional'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span>🇧🇷 Raças Nacionais BR</span>
          </button>
          <button
            onClick={() => setCategoryFilter('alta-resistencia')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              categoryFilter === 'alta-resistencia'
                ? 'bg-[#E07A5F] text-white shadow-xs'
                : 'bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100'
            }`}
          >
            <span>☀️ Alta Resistência ao Calor</span>
          </button>
          <button
            onClick={() => setCategoryFilter('braquicefalicos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              categoryFilter === 'braquicefalicos'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
            }`}
          >
            <span>⚠️ Braquicefálicos (Calor Crítico)</span>
          </button>
          <button
            onClick={() => setCategoryFilter('trabalho')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              categoryFilter === 'trabalho'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            <span>🛡️ Guarda & Trabalho</span>
          </button>
          <button
            onClick={() => setCategoryFilter('pastores')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              categoryFilter === 'pastores'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <span>🐕 Pastores & K9</span>
          </button>
          <button
            onClick={() => setCategoryFilter('apartamento')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              categoryFilter === 'apartamento'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
            }`}
          >
            <span>🏢 Apartamento Climatizado</span>
          </button>
        </div>

        {/* Detailed Dropdowns Bar */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-900">
          <span className="flex items-center gap-1.5 text-slate-700">
            <Filter className="w-3.5 h-3.5 text-[#E07A5F]" />
            Parâmetros Bioclimáticos & Morfologia
          </span>
          <button
            onClick={resetFilters}
            className="text-xs text-[#E07A5F] hover:underline font-semibold"
          >
            Redefinir Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Porte Corporal:</label>
            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white focus:border-slate-800"
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
              value={heatFilter}
              onChange={(e) => setHeatFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white focus:border-slate-800"
            >
              <option value="all">Qualquer Tolerância</option>
              <option value="alta">Alta Resistência Tropical (Adaptado)</option>
              <option value="moderada">Moderada (Requer Sombra & Hidratação)</option>
              <option value="baixa">Baixa (Sensível / Risco de Choque Térmico)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Ambiente Adequado:</label>
            <select
              value={housingFilter}
              onChange={(e) => setHousingFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white focus:border-slate-800"
            >
              <option value="all">Qualquer Moradia</option>
              <option value="apartamento">Apartamento Climatizado</option>
              <option value="casa">Casa com Quintal</option>
              <option value="sitio">Sítio / Área Ampla</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredBreeds.length === 0 && (
        <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-orange-500 mx-auto" />
          <h3 className="font-bold text-slate-900 text-base">Nenhuma raça encontrada com esses critérios</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tente remover alguns filtros ou buscar por termos mais amplos (como "pastor", "buldogue", "terrier" ou "brasil").
          </p>
          <button
            onClick={resetFilters}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Limpar Todos os Filtros
          </button>
        </div>
      )}

      {/* Breeds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBreeds.map((breed) => {
          const isBrazilian =
            breed.origin.toLowerCase().includes('brasil') ||
            breed.id.includes('campeiro') ||
            breed.id.includes('fila') ||
            breed.id.includes('srd') ||
            breed.id.includes('terrier-brasileiro') ||
            breed.id.includes('rastreador') ||
            breed.id.includes('dogue-brasileiro') ||
            breed.id.includes('ovelheiro');

          return (
            <div
              key={breed.id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Photo container */}
                <div className="relative h-56 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={breed.photoUrl}
                    alt={breed.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Weight badge */}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-800 shadow-xs flex items-center gap-1">
                    <span>⚖️</span>
                    <span>{breed.weightRange}</span>
                  </div>

                  {/* Brazilian Heritage badge */}
                  {isBrazilian && (
                    <div className="absolute top-3 right-3 bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-xs flex items-center gap-1">
                      <span>🇧🇷</span>
                      <span>Raça Nacional</span>
                    </div>
                  )}

                  {/* Title overlay */}
                  <div className="absolute bottom-3 left-3 right-3 bg-slate-900/85 backdrop-blur-xs text-white p-3 rounded-2xl text-xs">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold font-heading text-sm text-white">{breed.name}</p>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-white/10 rounded-md">
                        {breed.group}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 truncate mt-0.5">{breed.origin}</p>
                  </div>
                </div>

                {/* Details body */}
                <div className="p-5 space-y-3.5 text-xs">
                  {/* Heat and Housing specs */}
                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                        <span>Tolerância ao Calor BR:</span>
                      </span>
                      <span
                        className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] ${
                          breed.heatTolerance === 'alta'
                            ? 'bg-emerald-100 text-emerald-800'
                            : breed.heatTolerance === 'moderada'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {breed.heatTolerance === 'alta'
                          ? 'Alta (Adaptado)'
                          : breed.heatTolerance === 'moderada'
                          ? 'Moderada'
                          : 'Baixa (Atenção Máxima)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Home className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ambiente Indicado:</span>
                      </span>
                      <strong className="text-slate-900 capitalize font-semibold">{breed.housing}</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Activity className="w-3.5 h-3.5 text-[#E07A5F]" />
                        <span>Gasto Diário de Energia:</span>
                      </span>
                      <strong className="text-slate-900 font-mono font-bold">{breed.exerciseDailyMin} min/dia</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">
                    {breed.description}
                  </p>

                  <div className="p-3 bg-amber-50/70 rounded-2xl text-[11px] text-slate-700 border border-amber-200/60 leading-snug">
                    <strong className="text-amber-900 block font-semibold mb-0.5">☀️ Manejo no Clima Tropical:</strong>
                    {breed.coatCareInBrazil}
                  </div>

                  {/* Genetic Risks Tags */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Predisposições Genéticas Conhecidas:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {breed.geneticRisks.slice(0, 3).map((risk, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded-md border border-slate-200 truncate max-w-[190px]"
                        >
                          {risk}
                        </span>
                      ))}
                      {breed.geneticRisks.length > 3 && (
                        <span className="px-1.5 py-0.5 text-[10px] text-slate-400 font-semibold">
                          +{breed.geneticRisks.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0 space-y-2">
                <button
                  onClick={() => onSelectBreed(breed)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#E07A5F]" />
                  <span>Ver Ficha Biológica Completa</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                </button>
                <button
                  onClick={() =>
                    onOpenVetChat(
                      `Olá! Gostaria de saber mais sobre a adaptação, rotina de exercícios e cuidados específicos para o cão da raça ${breed.name} no clima brasileiro.`
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
  );
};
