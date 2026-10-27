import React, { useState, useMemo, useEffect } from 'react';
import { RegionGeoStat, DogProfile } from '../types';
import {
  MapPin,
  Download,
  Filter,
  RefreshCw,
  PlusCircle,
  Building2,
  Users,
  Compass,
  Search,
  CheckCircle2,
} from 'lucide-react';

export interface BrazilCanineMapProps {
  regionStats?: RegionGeoStat[];
  dogs?: DogProfile[];
  onOpenRegisterDog: () => void;
}

// Coordenadas base (em percentual do SVG) para estados brasileiros
const STATE_COORDINATES: Record<string, { x: number; y: number; name: string }> = {
  AC: { x: 18, y: 40, name: 'Acre' },
  AL: { x: 88, y: 44, name: 'Alagoas' },
  AM: { x: 32, y: 28, name: 'Amazonas' },
  AP: { x: 60, y: 16, name: 'Amapá' },
  BA: { x: 78, y: 50, name: 'Bahia' },
  CE: { x: 82, y: 28, name: 'Ceará' },
  DF: { x: 58, y: 55, name: 'Distrito Federal' },
  ES: { x: 76, y: 69, name: 'Espírito Santo' },
  GO: { x: 54, y: 58, name: 'Goiás' },
  MA: { x: 69, y: 28, name: 'Maranhão' },
  MG: { x: 67, y: 66, name: 'Minas Gerais' },
  MS: { x: 45, y: 68, name: 'Mato Grosso do Sul' },
  MT: { x: 42, y: 50, name: 'Mato Grosso' },
  PA: { x: 55, y: 30, name: 'Pará' },
  PB: { x: 89, y: 33, name: 'Paraíba' },
  PE: { x: 87, y: 37, name: 'Pernambuco' },
  PI: { x: 74, y: 35, name: 'Piauí' },
  PR: { x: 52, y: 79, name: 'Paraná' },
  RJ: { x: 72, y: 74, name: 'Rio de Janeiro' },
  RN: { x: 89, y: 30, name: 'Rio Grande do Norte' },
  RO: { x: 30, y: 48, name: 'Rondônia' },
  RR: { x: 35, y: 13, name: 'Roraima' },
  RS: { x: 48, y: 90, name: 'Rio Grande do Sul' },
  SC: { x: 55, y: 84, name: 'Santa Catarina' },
  SE: { x: 86, y: 47, name: 'Sergipe' },
  SP: { x: 60, y: 74, name: 'São Paulo' },
  TO: { x: 60, y: 42, name: 'Tocantins' },
};

// Cores determinísticas por raça conforme especificação
export function getDeterministicBreedColor(breedName: string): string {
  const norm = (breedName || '').trim().toLowerCase();
  if (norm.includes('buldogue campeiro')) {
    return '#8B4513'; // Marrom Buldogue Campeiro
  }
  if (norm.includes('rottweiler')) {
    return '#D97706'; // Âmbar/Dourado escuro Rottweiler
  }
  if (norm.includes('golden retriever')) {
    return '#F59E0B'; // Âmbar Golden Retriever
  }
  if (norm.includes('pastor') || norm.includes('shepherd')) {
    return '#2563EB'; // Azul Royal Pastores
  }
  if (
    norm.includes('srd') ||
    norm.includes('vira-lata') ||
    norm.includes('sem raça') ||
    norm.includes('misto')
  ) {
    return '#10B981'; // Esmeralda SRD
  }

  // Paleta determinística para demais raças
  const palette = [
    '#9333EA', // Roxo
    '#EC4899', // Rosa
    '#06B6D4', // Ciano
    '#E11D48', // Carmesim
    '#059669', // Verde Floresta
    '#4F46E5', // Índigo
    '#D946EF', // Magenta
    '#0284C7', // Azul Céu
    '#CA8A04', // Dourado
    '#65A30D', // Lima
    '#EA580C', // Laranja Queimado
    '#475569', // Ardósia
  ];
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = (hash << 5) - hash + norm.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % palette.length;
  return palette[index];
}

export interface CanineMapPinCluster {
  key: string;
  city: string;
  state: string;
  breed: string;
  pinColor: string;
  count: number;
  dogs: DogProfile[];
  xPercent: number;
  yPercent: number;
}

export const BrazilCanineMap: React.FC<BrazilCanineMapProps> = ({
  regionStats = [],
  dogs: propDogs = [],
  onOpenRegisterDog,
}) => {
  const [selectedUf, setSelectedUf] = useState<string>('TODAS');
  const [searchBreedFilter, setSearchBreedFilter] = useState<string>('');
  const [selectedClusterKey, setSelectedClusterKey] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [allVaultDogs, setAllVaultDogs] = useState<DogProfile[]>([]);

  // Carrega cães reais de todos os cofres 'canistech_vault_*' em localStorage + propDogs
  useEffect(() => {
    const dogMap = new Map<string, DogProfile>();

    // 1. Injeta cães recebidos via props
    propDogs.forEach((dog) => {
      if (dog && dog.id) {
        dogMap.set(dog.id, dog);
      }
    });

    // 2. Itera em todos os cofres multi-tenant de usuários em localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('canistech_vault_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const vault = JSON.parse(raw);
              if (vault && Array.isArray(vault.dogs)) {
                vault.dogs.forEach((d: DogProfile) => {
                  if (d && d.id) {
                    dogMap.set(d.id, d);
                  }
                });
              }
            } catch {
              // ignora item com erro
            }
          }
        }
      }
    } catch {
      // localStorage indisponível
    }

    setAllVaultDogs(Array.from(dogMap.values()));
  }, [propDogs]);

  // Agrupa cães exclusivamente por Cidade + UF + Raça
  const clusters = useMemo<CanineMapPinCluster[]>(() => {
    const groupMap = new Map<string, CanineMapPinCluster>();

    allVaultDogs.forEach((dog) => {
      const rawCity = (dog.city || 'São Paulo').trim();
      const rawState = (dog.state || 'SP').trim().toUpperCase();
      const rawBreed = (dog.breed || 'SRD (Sem Raça Definida)').trim();

      // Normaliza UF
      const uf = STATE_COORDINATES[rawState] ? rawState : 'SP';
      const key = `${rawCity.toLowerCase()}_${uf}_${rawBreed.toLowerCase()}`;
      const color = getDeterministicBreedColor(rawBreed);

      // Deslocamento determinístico sutil para cidades/raças no mesmo estado
      let strHash = 0;
      for (let i = 0; i < key.length; i++) {
        strHash = (strHash << 5) - strHash + key.charCodeAt(i);
        strHash |= 0;
      }
      const xJitter = ((Math.abs(strHash) % 7) - 3) * 1.2;
      const yJitter = ((Math.abs(strHash >> 3) % 7) - 3) * 1.2;

      const baseCoord = STATE_COORDINATES[uf] || STATE_COORDINATES['SP'];
      const xPercent = Math.min(94, Math.max(6, baseCoord.x + xJitter));
      const yPercent = Math.min(94, Math.max(6, baseCoord.y + yJitter));

      if (groupMap.has(key)) {
        const existing = groupMap.get(key)!;
        existing.count += 1;
        existing.dogs.push(dog);
      } else {
        groupMap.set(key, {
          key,
          city: rawCity,
          state: uf,
          breed: rawBreed,
          pinColor: color,
          count: 1,
          dogs: [dog],
          xPercent,
          yPercent,
        });
      }
    });

    return Array.from(groupMap.values());
  }, [allVaultDogs]);

  // Filtros aplicados
  const filteredClusters = useMemo(() => {
    return clusters.filter((c) => {
      const matchUf = selectedUf === 'TODAS' || c.state === selectedUf;
      const matchBreed =
        !searchBreedFilter ||
        c.breed.toLowerCase().includes(searchBreedFilter.toLowerCase()) ||
        c.city.toLowerCase().includes(searchBreedFilter.toLowerCase());
      return matchUf && matchBreed;
    });
  }, [clusters, selectedUf, searchBreedFilter]);

  const activeCluster = useMemo(() => {
    if (!selectedClusterKey) {
      return filteredClusters[0] || clusters[0] || null;
    }
    return clusters.find((c) => c.key === selectedClusterKey) || filteredClusters[0] || null;
  }, [selectedClusterKey, clusters, filteredClusters]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleDownloadCensus = () => {
    if (!activeCluster) return;
    showToast(
      `Exportando Censo de ${activeCluster.city}, ${activeCluster.state} — Raça: ${activeCluster.breed} em PDF...`
    );
    setTimeout(() => {
      showToast(`Censo_${activeCluster.state}_${activeCluster.city}_CanisTech.pdf gerado.`);
    }, 1200);
  };

  const totalRegisteredDogs = allVaultDogs.length;

  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Top Telemetry Live Metric Bar */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <strong className="text-emerald-800 dark:text-emerald-400 uppercase tracking-wider font-mono">
            Rede Nacional CanisTech Ativa
          </strong>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="text-slate-600 dark:text-slate-400">
            Mapeamento Biométrico Territorial Baseado em Registros Reais
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
          <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
            {totalRegisteredDogs} {totalRegisteredDogs === 1 ? 'cão cadastrado' : 'cães cadastrados'}
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
          <span className="hidden sm:inline text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full text-slate-700 dark:text-slate-300">
            {clusters.length} polos municipais ativos
          </span>
        </div>
      </div>

      {/* Section Title & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-bold text-[#E07A5F] bg-orange-50 dark:bg-orange-950/40 px-2.5 py-0.5 rounded-full border border-orange-100 dark:border-orange-800/40">
            Cartografia Cinófila & Epidemiológica Comunitária
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white font-heading tracking-tight mt-1">
            Mapa Canino do Brasil
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            Distribuição geográfica de cães com registro biométrico DogOS. Agrupamento estrito por Cidade, UF e Raça com coloração determinística por linhagem.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <span className="text-slate-400 font-semibold">UF:</span>
            <select
              value={selectedUf}
              onChange={(e) => setSelectedUf(e.target.value)}
              className="bg-transparent font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="TODAS">Todas as UFs</option>
              {Object.keys(STATE_COORDINATES).map((uf) => (
                <option key={uf} value={uf} className="dark:bg-slate-900 dark:text-white">
                  {STATE_COORDINATES[uf].name} ({uf})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar raça ou cidade..."
              value={searchBreedFilter}
              onChange={(e) => setSearchBreedFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none w-36"
            />
          </div>

          <button
            onClick={() => {
              setSelectedUf('TODAS');
              setSearchBreedFilter('');
              setSelectedClusterKey(null);
            }}
            title="Resetar filtros"
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* EMPTY STATE SE NENHUM CÃO CADASTRADO */}
      {totalRegisteredDogs === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-slate-800 shadow-sm text-center relative overflow-hidden">
          <div className="max-w-xl mx-auto space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 mx-auto flex items-center justify-center text-3xl shadow-xs">
              📍
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#E07A5F] bg-orange-50 dark:bg-orange-950/40 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800/40">
                Censo Canino em Branco
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                Nenhum cão cadastrado no mapa ainda
              </h2>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                O Mapa Canino do Brasil é 100% dinâmico e alimentado exclusivamente por cães cadastrados na plataforma. Inaugure o mapeamento geográfico e epidemiológico cadastrando o primeiro cão no DogOS!
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenRegisterDog}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Cadastrar Meu Primeiro Cão no DogOS</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* MAIN GRID: MAPA INTERATIVO (8 cols) + DETALHE CINÓFILO DO POLO (4 cols) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Box do Mapa Interativo */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[520px] relative overflow-hidden">
            {/* Legenda de Cores Determinísticas de Raça */}
            <div className="flex flex-wrap items-center gap-3 p-2.5 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-xs rounded-xl border border-slate-200/80 dark:border-slate-700/80 z-20 text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">
                Linhagens Oficiais:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#8B4513' }}></span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">Buldogue Campeiro</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#D97706' }}></span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">Rottweiler</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#F59E0B' }}></span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">Golden Retriever</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#2563EB' }}></span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">Pastores / Trabalho</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#10B981' }}></span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">SRD / Vira-lata</span>
              </div>
            </div>

            {/* Container SVG do Brasil com Geometria e Pinos */}
            <div className="relative w-full flex-1 flex items-center justify-center py-6 select-none my-auto">
              {/* Malha de fundo */}
              <svg
                className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern id="br-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                    <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#64748B" strokeWidth="0.75" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#br-grid)" />
              </svg>

              {/* Geometria Estilizada do Brasil */}
              <svg
                viewBox="0 0 600 560"
                className="w-full max-w-[480px] h-auto drop-shadow-sm transition-all"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M165,58 C215,35 290,40 340,75 C380,95 440,85 470,115 C505,145 530,190 515,225 C495,260 480,270 470,300 C450,345 425,385 400,430 C380,470 345,510 320,535 C305,550 280,510 270,470 C250,440 220,390 190,360 C160,335 120,330 90,300 C60,265 65,220 70,175 C80,120 120,80 165,58 Z"
                  className="fill-slate-100 dark:fill-slate-800/60 stroke-slate-300 dark:stroke-slate-700 hover:fill-slate-200 dark:hover:fill-slate-800 transition-colors"
                  strokeWidth="1.5"
                />
                <path d="M190,170 Q300,190 470,220" stroke="#CBD5E1" strokeDasharray="4 4" strokeWidth="1.2" />
                <path d="M260,270 Q350,300 450,330" stroke="#CBD5E1" strokeDasharray="4 4" strokeWidth="1.2" />
                <path d="M300,380 Q350,400 400,430" stroke="#CBD5E1" strokeDasharray="4 4" strokeWidth="1.2" />
                <text x="80" y="80" className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono">
                  10° S, 55° W
                </text>
                <text x="420" y="520" className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono">
                  DATUM SIRGAS2000
                </text>
              </svg>

              {/* PINOS INTERATIVOS AGRUPADOS POR CIDADE + UF + RAÇA */}
              {filteredClusters.map((cluster) => {
                const isSelected = activeCluster?.key === cluster.key;

                return (
                  <div
                    key={cluster.key}
                    style={{ top: `${cluster.yPercent}%`, left: `${cluster.xPercent}%` }}
                    onClick={() => setSelectedClusterKey(cluster.key)}
                    className="group absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                  >
                    {/* Efeito de Ping se selecionado */}
                    {isSelected && (
                      <span
                        style={{ backgroundColor: cluster.pinColor }}
                        className="absolute -inset-2 rounded-full opacity-40 animate-ping pointer-events-none"
                      />
                    )}

                    {/* Marcador Visual */}
                    <div
                      style={{ backgroundColor: cluster.pinColor }}
                      className={`relative flex items-center justify-center min-w-7 h-7 px-1.5 rounded-full text-white shadow-lg transition-transform ${
                        isSelected
                          ? 'scale-125 ring-2 ring-slate-900 dark:ring-white ring-offset-2'
                          : 'group-hover:scale-115'
                      }`}
                    >
                      <span className="text-[10px] font-bold font-mono tracking-tight">
                        {cluster.count}
                      </span>
                    </div>

                    {/* Tooltip ao Hover: Cidade, UF — Raça (Cor): X cães cadastrados */}
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-slate-900 text-white rounded-xl shadow-2xl text-left pointer-events-none z-30 text-xs border border-slate-700">
                      <p className="font-bold text-slate-100">
                        {cluster.city}, {cluster.state}
                      </p>
                      <p className="text-[11px] text-amber-300 font-semibold mt-0.5">
                        {cluster.breed}
                      </p>
                      <div className="mt-1.5 pt-1.5 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">Total mapeado:</span>
                        <span className="text-[11px] font-bold text-emerald-400 font-mono">
                          {cluster.count} {cluster.count === 1 ? 'cão cadastrado' : 'cães cadastrados'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rodapé Interno do Mapa */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span>
                Passe o cursor ou clique nos pinos para inspecionar Cidade, UF, Raça e quantitativo registrado.
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                CanisTech Cartografia Digital
              </span>
            </div>
          </div>

          {/* Card Lateral de Inteligência Cinófila do Polo Selecionado (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {activeCluster ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Polo Cinófilo Ativo
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
                      {activeCluster.city}, {activeCluster.state}
                    </h2>
                  </div>
                  <div
                    style={{ backgroundColor: activeCluster.pinColor }}
                    className="w-4 h-4 rounded-full shadow-xs"
                    title={`Cor do pino: ${activeCluster.pinColor}`}
                  />
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Linhagem / Raça Mapeada
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {activeCluster.breed}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                    {activeCluster.count} {activeCluster.count === 1 ? 'cão registrado' : 'cães registrados'} neste polo
                  </p>
                </div>

                {/* Lista dos Cães com Sigilo e RG */}
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Registros Oficiais do Polo:
                  </p>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {activeCluster.dogs.map((d) => (
                      <div
                        key={d.id}
                        className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-[11px]">
                            🐕
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {d.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Tutor: {d.tutorName}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block">
                            RGC: {d.rgNumber || 'Em emissão'}
                          </span>
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            Biometria Ativa
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Infraestrutura de Suporte */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Cobertura Preventiva Local
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    Polo homologado pelo protocolo DogOS para monitoramento sanitário, identificação por RGC e histórico contínuo do pet.
                  </p>
                </div>

                <button
                  onClick={handleDownloadCensus}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Censo do Polo (PDF)</span>
                </button>
              </div>
            ) : null}

            {/* Chamada para Cadastrar Cão */}
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-800/40 rounded-2xl p-5 space-y-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Seu cão já está no mapa?
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                O cadastro biométrico no DogOS adiciona o pino do seu município à rede de saúde pública preventiva canina nacional.
              </p>
              <button
                onClick={onOpenRegisterDog}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#E07A5F] hover:underline pt-1 cursor-pointer"
              >
                <span>+ Cadastrar cão no mapa</span>
                <span className="text-sm">→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
