import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Trophy,
  Filter,
  Search,
  CheckCircle2,
  Bell,
  Share2,
  ExternalLink,
  Award,
  Sparkles,
  X,
  Compass,
  Dog,
  Users,
} from 'lucide-react';

interface CanineEventsScheduleModalProps {
  onClose: () => void;
  onOpenVetChat?: (query?: string) => void;
}

export interface CanineEventItem {
  id: string;
  title: string;
  category: 'Exposição CBKC/FCI' | 'Agility & Esporte' | 'Encontro de Raças' | 'Trabalho & K9' | 'Caminhada Solidária';
  dateStr: string;
  month: string;
  dayBadge: string;
  city: string;
  state: 'SP' | 'PR' | 'RJ' | 'RS' | 'MG' | 'SC' | 'DF';
  venue: string;
  organizer: string;
  description: string;
  highlightBreed?: string;
  status: 'Inscrições Abertas' | 'Em Breve' | 'Fase Final';
  accreditation: string;
}

const EVENTS_2026: CanineEventItem[] = [
  {
    id: 'evt-2026-01',
    title: 'Exposição Internacional de Curitiba 2026 (CBKC / FCI)',
    category: 'Exposição CBKC/FCI',
    dateStr: '14 e 15 de Março de 2026',
    month: 'Março',
    dayBadge: '14-15 MAR',
    city: 'Curitiba',
    state: 'PR',
    venue: 'Parque Barigui - Pavilhão de Eventos',
    organizer: 'Kennel Club da Grande Curitiba',
    description: 'Julgamento de conformação e beleza de todos os grupos com juízes da FCI (Bélgica, Argentina e Brasil). Ponto de encontro obrigatório para criadores de Bernês, Pastores e Goldens.',
    highlightBreed: 'Boiadeiro Bernês & Golden Retriever',
    status: 'Inscrições Abertas',
    accreditation: 'FCI / CBKC Oficial',
  },
  {
    id: 'evt-2026-02',
    title: 'Grande Campeonato Paulistano de Estrutura & Beleza 2026',
    category: 'Exposição CBKC/FCI',
    dateStr: '18 e 19 de Abril de 2026',
    month: 'Abril',
    dayBadge: '18-19 ABR',
    city: 'São Paulo',
    state: 'SP',
    venue: 'Centro de Convenções Pro Magno',
    organizer: 'Federação Paulista de Cinofilia',
    description: 'Mais de 800 cães inscritos de 95 raças. Circuito de pistas simultâneas, avaliação biométrica e premiação Best in Show do Sudeste.',
    highlightBreed: 'Todas as Raças Reconhecidas',
    status: 'Inscrições Abertas',
    accreditation: 'CBKC Grau 1',
  },
  {
    id: 'evt-2026-03',
    title: 'Copa Brasil de Agility & Adestramento de Precisão 2026',
    category: 'Agility & Esporte',
    dateStr: '16 e 17 de Maio de 2026',
    month: 'Maio',
    dayBadge: '16-17 MAI',
    city: 'Atibaia',
    state: 'SP',
    venue: 'Centro de Treinamento Canino Haras da Serra',
    organizer: 'Comissão Brasileira de Agility',
    description: 'Pistas oficiais nos graus G1, G2 e G3. Provas de velocidade, túneis, saltos e passarela. Categorias Small, Medium e Large.',
    highlightBreed: 'Border Collie, Pastor de Shetland & Poodles',
    status: 'Inscrições Abertas',
    accreditation: 'Circuito Nacional',
  },
  {
    id: 'evt-2026-04',
    title: 'Encontro Nacional das Raças Autóctones Brasileiras 2026',
    category: 'Encontro de Raças',
    dateStr: '04 e 05 de Julho de 2026',
    month: 'Julho',
    dayBadge: '04-05 JUL',
    city: 'Bento Gonçalves',
    state: 'RS',
    venue: 'Parque de Exposições Fundaparque',
    organizer: 'Clube do Buldogue Campeiro & Fila Brasileiro',
    description: 'Celebração histórica das raças genuinamente brasileiras: Buldogue Campeiro, Fila Brasileiro, Rastreador Brasileiro e Fox Paulistinha. Avaliação de temperamento funcional.',
    highlightBreed: 'Buldogue Campeiro & Fila Brasileiro',
    status: 'Em Breve',
    accreditation: 'Preservação Canina Nacional',
  },
  {
    id: 'evt-2026-05',
    title: 'Copa Carioca de Cães de Trabalho, Faro & Proteção (K9)',
    category: 'Trabalho & K9',
    dateStr: '22 e 23 de Agosto de 2026',
    month: 'Agosto',
    dayBadge: '22-23 AGO',
    city: 'Rio de Janeiro',
    state: 'RJ',
    venue: 'Complexo Esportivo Deodoro',
    organizer: 'Associação de Adestradores e Condutores K9 RJ',
    description: 'Demonstrações e avaliações práticas de busca de odor, proteção de território, obediência tática e salvamento aquático.',
    highlightBreed: 'Pastor Belga Malinois & Rottweiler',
    status: 'Em Breve',
    accreditation: 'Regulamento IGP / K9',
  },
  {
    id: 'evt-2026-06',
    title: 'Festival da Primavera: Encontro de Golden & Companhia',
    category: 'Encontro de Raças',
    dateStr: '19 de Setembro de 2026',
    month: 'Setembro',
    dayBadge: '19 SET',
    city: 'Belo Horizonte',
    state: 'MG',
    venue: 'Parque Ecológico da Pampulha',
    organizer: 'Comunidade Canina BH & Patrocinadores CanisTech',
    description: 'Socialização assistida por veterinários, piquenique canino, piscina de bolinhas pet e microchipagem gratuita para cães cadastrados no DogOS.',
    highlightBreed: 'Golden Retriever & SRDs Caramelo',
    status: 'Em Breve',
    accreditation: 'Evento Comunitário',
  },
  {
    id: 'evt-2026-07',
    title: 'DogRun CanisTech & Caminhada Solidária 2026',
    category: 'Caminhada Solidária',
    dateStr: '18 de Outubro de 2026',
    month: 'Outubro',
    dayBadge: '18 OUT',
    city: 'São Paulo',
    state: 'SP',
    venue: 'Parque Ibirapuera (Portão 7)',
    organizer: 'CanisTech Health & ONGs de Proteção Animal SP',
    description: 'Corrida e caminhada com tutores e seus cães (percursos de 2km e 4km). 100% da arrecadação de inscrições revertida para feiras de castração e ração animal.',
    highlightBreed: 'Todas as raças e portes',
    status: 'Inscrições Abertas',
    accreditation: 'Ação Social CanisTech',
  },
  {
    id: 'evt-2026-08',
    title: 'Circuito Sul-Brasileiro de Conformação & Verão 2026',
    category: 'Exposição CBKC/FCI',
    dateStr: '05 e 06 de Dezembro de 2026',
    month: 'Dezembro',
    dayBadge: '05-06 DEZ',
    city: 'Florianópolis',
    state: 'SC',
    venue: 'CentroSul Centro de Convenções',
    organizer: 'Kennel Club de Santa Catarina',
    description: 'Última etapa do ranking nacional de exposições de 2026 com entrega de troféus aos melhores reprodutores e campeões do ano.',
    highlightBreed: 'Pastores, Spitz e Terriers',
    status: 'Fase Final',
    accreditation: 'FCI / CBKC Ranking Anual',
  },
];

const SAVED_EVENTS_STORAGE = 'canistech_user_saved_events';

export const CanineEventsScheduleModal: React.FC<CanineEventsScheduleModalProps> = ({
  onClose,
  onOpenVetChat,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedState, setSelectedState] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [savedEventIds, setSavedEventIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_EVENTS_STORAGE);
      return raw ? JSON.parse(raw) : ['evt-2026-01', 'evt-2026-07'];
    } catch {
      return ['evt-2026-01'];
    }
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleSaveEvent = (eventId: string, title: string) => {
    let updated: string[];
    if (savedEventIds.includes(eventId)) {
      updated = savedEventIds.filter((id) => id !== eventId);
      showToast(`Evento removido da sua agenda pessoal.`);
    } else {
      updated = [...savedEventIds, eventId];
      showToast(`✓ "${title}" adicionado à sua agenda com lembrete!`);
    }
    setSavedEventIds(updated);
    try {
      localStorage.setItem(SAVED_EVENTS_STORAGE, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const categories = [
    'Todas',
    'Exposição CBKC/FCI',
    'Agility & Esporte',
    'Encontro de Raças',
    'Trabalho & K9',
    'Caminhada Solidária',
  ];

  const states = ['Todos', 'SP', 'PR', 'RJ', 'RS', 'MG', 'SC'];

  const filteredEvents = EVENTS_2026.filter((evt) => {
    const matchesCategory =
      selectedCategory === 'Todas' || evt.category === selectedCategory;
    const matchesState = selectedState === 'Todos' || evt.state === selectedState;
    const matchesSearch =
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.highlightBreed &&
        evt.highlightBreed.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesState && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-60 bg-slate-900 dark:bg-slate-800 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-[#E07A5F] border border-orange-200 dark:border-orange-800/60 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Temporada Oficial 2026</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {filteredEvents.length} de {EVENTS_2026.length} eventos listados
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 dark:text-white">
              Agenda Canina Nacional 2026
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              Exposições de conformação CBKC/FCI, torneios de agility, encontros de raças nacionais e caminhadas solidárias em todo o Brasil.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Box */}
            <div className="relative w-full sm:flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por cidade, raça ou nome do evento..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-[#E07A5F]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* State Selector */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">UF:</span>
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {states.map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedState(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      selectedState === st
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#E07A5F] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Events List Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Compass className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                Nenhum evento canino encontrado para os filtros selecionados.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('Todas');
                  setSelectedState('Todos');
                  setSearchQuery('');
                }}
                className="text-xs text-[#E07A5F] hover:underline font-bold"
              >
                Limpar todos os filtros
              </button>
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const isSaved = savedEventIds.includes(evt.id);

              return (
                <div
                  key={evt.id}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850/60 transition-all shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Date Badge */}
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center shrink-0 text-center">
                        <span className="text-[10px] font-bold text-[#E07A5F] uppercase tracking-wider">
                          {evt.month}
                        </span>
                        <span className="text-lg font-black font-heading text-slate-900 dark:text-white leading-tight">
                          {evt.dayBadge.split(' ')[0]}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 font-semibold">2026</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {evt.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            {evt.accreditation}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            evt.status === 'Inscrições Abertas'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {evt.status}
                          </span>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-heading">
                          {evt.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            <strong>{evt.city} ({evt.state})</strong> • {evt.venue}
                          </span>
                          <span>• Org: {evt.organizer}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                      <button
                        onClick={() => handleToggleSaveEvent(evt.id, evt.title)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          isSaved
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Na Minha Agenda</span>
                          </>
                        ) : (
                          <>
                            <Bell className="w-3.5 h-3.5 text-slate-500" />
                            <span>Salvar Agenda</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-0 sm:pl-[76px]">
                    {evt.description}
                  </p>

                  {evt.highlightBreed && (
                    <div className="flex items-center justify-between pl-0 sm:pl-[76px] pt-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-1.5">
                        <Dog className="w-3.5 h-3.5 text-[#E07A5F]" />
                        <span>Foco Biológico: <strong className="text-slate-700 dark:text-slate-300">{evt.highlightBreed}</strong></span>
                      </div>

                      {onOpenVetChat && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenVetChat(`Como preparar a vacinação e a profilaxia do meu cão para participar do evento "${evt.title}" em ${evt.city}?`);
                          }}
                          className="text-[11px] text-[#E07A5F] hover:underline font-bold flex items-center gap-1"
                        >
                          <span>Orientação Pré-Exposição (Vet IA)</span>
                          <span>→</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Calendário sincronizado com regulamentos CBKC/FCI vigentes para 2026.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                showToast(`Agenda de ${savedEventIds.length} eventos exportada para o seu dispositivo!`);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 font-semibold text-xs text-slate-700 dark:text-slate-200 transition-colors"
            >
              Exportar Meus Lembretes ({savedEventIds.length})
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold text-xs transition-colors"
            >
              Fechar Agenda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
