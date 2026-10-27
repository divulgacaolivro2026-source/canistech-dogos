import React, { useState } from 'react';
import { ContestCandidate, AdoptionDog } from '../types';
import {
  Trophy,
  Heart,
  Timer,
  CheckCircle2,
  Share2,
  Sparkles,
  Search,
  Filter,
  ShieldCheck,
  Building,
} from 'lucide-react';

interface CommunityAdoptionViewProps {
  contestCandidates: ContestCandidate[];
  adoptionDogs: AdoptionDog[];
  onVoteContest: (candidateId: string) => void;
}

export const CommunityAdoptionView: React.FC<CommunityAdoptionViewProps> = ({
  contestCandidates,
  adoptionDogs,
  onVoteContest,
}) => {
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string>('all');
  const [selectedAdoptDog, setSelectedAdoptDog] = useState<AdoptionDog | null>(null);
  const [showAdoptModal, setShowAdoptModal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Adoption form
  const [adopterName, setAdopterName] = useState<string>('');
  const [adopterWhatsapp, setAdopterWhatsapp] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredAdoptions = adoptionDogs.filter((d) => {
    if (selectedSizeFilter === 'all') return true;
    return d.size.toLowerCase() === selectedSizeFilter.toLowerCase();
  });

  const handleOpenAdopt = (dog: AdoptionDog) => {
    setSelectedAdoptDog(dog);
    setShowAdoptModal(true);
  };

  const handleAdoptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAdoptModal(false);
    showToast(`Solicitação de adoção para ${selectedAdoptDog?.name} enviada à ONG ${selectedAdoptDog?.ongName}!`);
    setAdopterName('');
    setAdopterWhatsapp('');
  };

  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-6 space-y-10">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMsg}</span>
        </div>
      )}

      {/* 1. CONCURSO CÃO DA SEMANA */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#E07A5F] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100">
                Comunidade & Conexão
              </span>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                Edição Semanal #48
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-heading tracking-tight">
              Concurso Cão da Semana
            </h1>
            <p className="text-xs md:text-sm text-slate-600">
              Vote no seu pet favorito! O vencedor ganha 3 meses de nutrição bio-equilibrada CanisTech + check-up cardiológico completo.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs shrink-0 text-xs">
            <Timer className="w-5 h-5 text-[#E07A5F]" />
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Votação encerra em:</span>
              <span className="font-bold text-slate-900 font-mono">3 dias : 14h : 22m</span>
            </div>
          </div>
        </div>

        {/* Finalists Grid (3 Candidates) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contestCandidates.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="relative h-56 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={c.photoUrl}
                    alt={c.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    Finalista #{c.number}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 rounded-xl text-white">
                    <h3 className="font-bold text-lg font-heading leading-tight">{c.name}</h3>
                    <p className="text-xs text-slate-200">{c.breed} • {c.ageFormatted} • {c.location}</p>
                  </div>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  <p className="text-slate-600 italic leading-relaxed min-h-[48px]">
                    "{c.story}"
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                      <span>Votos Computados:</span>
                    </span>
                    <strong className="text-slate-900 font-mono text-sm">
                      {c.votes.toLocaleString('pt-BR')}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  onClick={() => {
                    onVoteContest(c.id);
                    showToast(`Voto registrado com sucesso para ${c.name}!`);
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-[#E07A5F] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>Votar no {c.name}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. FEIRA VIRTUAL DE ADOÇÃO RESPONSÁVEL */}
      <section className="space-y-6 pt-6 border-t border-slate-200">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                Impacto & Responsabilidade Social
              </span>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                18 ONGs Parceiras Homologadas
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 font-heading tracking-tight">
              Feira Virtual de Adoção Responsável
            </h2>
            <p className="text-xs md:text-sm text-slate-600">
              Todos os cães são entregues vacinados (V10 e Antirrábica), castrados, microchipados e com prontuário DogOS ativo.
            </p>
          </div>

          {/* Size Filter */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-semibold">
            <button
              onClick={() => setSelectedSizeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedSizeFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Todos os Portes
            </button>
            <button
              onClick={() => setSelectedSizeFilter('pequeno')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedSizeFilter === 'pequeno' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Pequeno
            </button>
            <button
              onClick={() => setSelectedSizeFilter('médio')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedSizeFilter === 'médio' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Médio
            </button>
            <button
              onClick={() => setSelectedSizeFilter('grande')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedSizeFilter === 'grande' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Grande
            </button>
          </div>
        </div>

        {/* Adoption Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredAdoptions.map((dog) => (
            <div
              key={dog.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="relative h-48 w-full rounded-xl overflow-hidden bg-slate-100">
                  <img
                    src={dog.photoUrl}
                    alt={dog.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-800 shadow-xs">
                    Porte {dog.size} ({dog.weight}kg)
                  </span>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg font-heading text-slate-900">{dog.name}</h3>
                    <p className="text-xs text-slate-500">
                      {dog.gender} • {dog.ageFormatted} • {dog.city} ({dog.state})
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ✓ Castrado
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 text-[11px]">
                  {dog.tags.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                      {t}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {dog.story}
                </p>

                <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-500">
                  ONG: <strong>{dog.ongName}</strong>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleOpenAdopt(dog)}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>Quero Adotar o {dog.name}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Adoption Form Modal */}
      {showAdoptModal && selectedAdoptDog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 font-heading">
                Manifestar Interesse de Adoção: {selectedAdoptDog.name}
              </h3>
              <button
                onClick={() => setShowAdoptModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdoptSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-[11px] text-slate-600 border border-slate-200">
                <p><strong>Cão:</strong> {selectedAdoptDog.name} • {selectedAdoptDog.city} ({selectedAdoptDog.state})</p>
                <p><strong>ONG Responsável:</strong> {selectedAdoptDog.ongName}</p>
                <p className="text-emerald-700 font-medium">✓ Acompanha suporte nutricional e prontuário DogOS ativo.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Seu Nome Completo:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mariana Silveira"
                  value={adopterName}
                  onChange={(e) => setAdopterName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">WhatsApp para Contato da ONG:</label>
                <input
                  type="tel"
                  required
                  placeholder="(11) 98765-4321"
                  value={adopterWhatsapp}
                  onChange={(e) => setAdopterWhatsapp(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-900 text-[11px] leading-relaxed border border-amber-200">
                <strong>Requisitos Éticos:</strong> Maior de 21 anos, residência telada/segura contra fugas e concordância com o Termo de Adoção Responsável.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdoptModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition-colors shadow-xs"
                >
                  Enviar Formulário à ONG
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
