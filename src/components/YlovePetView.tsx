import React, { useState } from 'react';
import { YloveCandidate, DogProfile } from '../types';
import {
  ShieldCheck,
  Dna,
  Heart,
  FileCheck,
  Award,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  BookOpen,
  MessageSquare,
} from 'lucide-react';

interface YlovePetViewProps {
  candidates: YloveCandidate[];
  activeDog?: DogProfile | null;
  onRequestBreedMatch: (candidateName: string) => void;
}

export const YlovePetView: React.FC<YlovePetViewProps> = ({
  candidates,
  activeDog,
  onRequestBreedMatch,
}) => {
  const [selectedBreed, setSelectedBreed] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');

  // Modals
  const [showManifestoModal, setShowManifestoModal] = useState<boolean>(false);
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [selectedCandidate, setSelectedCandidate] = useState<YloveCandidate | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Inbreeding Calculator Simulator State
  const [coiMother, setCoiMother] = useState<string>('Linhagem A (Avós sem parentesco)');
  const [coiFather, setCoiFather] = useState<string>('Linhagem B (Avós sem parentesco)');
  const [simulatedCoi, setSimulatedCoi] = useState<number>(1.8);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchBreed = selectedBreed === 'all' || c.breed.toLowerCase().includes(selectedBreed.toLowerCase());
    const matchRole = selectedRole === 'all' || c.role === selectedRole;
    const matchState = selectedState === 'all' || c.state === selectedState;
    return matchBreed && matchRole && matchState;
  });

  const handleOpenContact = (candidate: YloveCandidate) => {
    setSelectedCandidate(candidate);
    setShowContactModal(true);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowContactModal(false);
    showToast(`Solicitação para ${selectedCandidate?.name} enviada ao Comitê Veterinário CanisTech para auditoria de laudos!`);
  };

  const handleCalculateCoi = () => {
    // Generate realistic genetic COI estimation between 0.8% and 4.2%
    const randomCoi = (Math.random() * 2.5 + 0.9).toFixed(2);
    setSimulatedCoi(parseFloat(randomCoi));
    showToast(`Cálculo de COI Wright concluído: ${randomCoi}% (Dentro do limite ético CanisTech ≤ 6.25%)`);
  };

  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Hero Awareness & Ethical Protocol Statement */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden space-y-4">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Protocolo de Bem-Estar Canino & Reprodução Consciente</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight text-white">
              Ylove Pet: Conexão Ética para Linhagem & Preservação de Raça
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Eliminamos criadouros clandestinos e práticas abusivas. Todos os perfis exigem validação prévia de pedigree oficial (CBKC/FCI), rastreabilidade genética comprovada por DNA e laudos clínicos vigentes de displasia coxofemoral e brucelose canina.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowManifestoModal(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-600 transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-[#E07A5F]" />
              <span>Manifesto Ético</span>
            </button>
            <button
              onClick={() => showToast('Para habilitar um cão como matriz/reprodutor, anexe laudos no prontuário do cão.')}
              className="px-4 py-2.5 bg-[#E07A5F] hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <Award className="w-4 h-4" />
              <span>Habilitar Matriz / Reprodutor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900 font-heading">
              Filtros Biométricos e Genéticos de Compatibilidade
            </h2>
          </div>
          <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            ✓ 128 Cães Homologados com Laudos Ativos no Brasil
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Raça do Cão:</label>
            <select
              value={selectedBreed}
              onChange={(e) => setSelectedBreed(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none font-medium"
            >
              <option value="all">Todas as Raças Homologadas</option>
              <option value="golden">Golden Retriever</option>
              <option value="bernês">Boiadeiro Bernês</option>
              <option value="pastor">Pastor Alemão</option>
              <option value="border">Border Collie</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Papel Reprodutivo:</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none font-medium"
            >
              <option value="all">Machos Reprodutores & Matrizes</option>
              <option value="Macho Reprodutor">Macho Reprodutor</option>
              <option value="Matriz Registrada">Matriz Registrada</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Região Geográfica:</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none font-medium"
            >
              <option value="all">Todo o Brasil</option>
              <option value="SP">São Paulo (SP)</option>
              <option value="PR">Paraná (PR)</option>
              <option value="MG">Minas Gerais (MG)</option>
              <option value="RJ">Rio de Janeiro (RJ)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Listings (8 cols) + Protocol & COI Calculator (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Candidates Column (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {filteredCandidates.map((cand) => (
            <div
              key={cand.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-5"
            >
              {/* Photo & Identity Tag */}
              <div className="relative w-full md:w-56 h-56 shrink-0 rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={cand.photoUrl}
                  alt={cand.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono">
                  {cand.pedigreeNumber}
                </div>
                <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-xs flex justify-between text-[11px] font-bold text-slate-900">
                  <span>{cand.ageYears} anos • {cand.state}</span>
                  <span className="text-[#E07A5F]">{cand.role}</span>
                </div>
              </div>

              {/* Data & Laudos */}
              <div className="flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 font-heading">
                        {cand.name}
                      </h3>
                      <p className="text-xs text-slate-500">{cand.lineage} • {cand.breed}</p>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      Selo Ouro CanisTech
                    </span>
                  </div>

                  {/* Certified Badges */}
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                      ✓ Displasia: {cand.certificates.hipDysplasia}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                      ✓ {cand.certificates.brucellosis}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                      ✓ {cand.certificates.dnaPanel}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                      ✓ {cand.certificates.cardio}
                    </span>
                  </div>

                  {/* Biometric Snapshot */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 bg-slate-50 rounded-xl text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Peso</span>
                      <strong className="text-slate-900">{cand.weight} kg</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Temperamento</span>
                      <span className="text-[11px] text-slate-800 truncate block">{cand.temperament}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Consanguinidade</span>
                      <strong className="text-emerald-700">COI {cand.coiPercentage}%</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Escore BCS</span>
                      <strong className="text-slate-900">{cand.bcsScore}/9 (Ideal)</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="text-slate-500 text-[11px]">
                    Tutor / Criador: <strong>{cand.tutorName}</strong> ({cand.tutorRole})
                  </span>
                  <button
                    onClick={() => handleOpenContact(cand)}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Solicitar Contato Auditado</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Protocol Sidebar & Inbreeding COI Calculator (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Step-by-Step Safe Breeding Guide */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 font-heading flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#E07A5F]" />
              <span>Passo a Passo do Cruzamento Seguro</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <h4 className="font-bold text-slate-900">Auditoria Prévia de Laudos</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    O Comitê Veterinário CanisTech confere laudos oficiais de displasia e sorologia de brucelose antes de liberar a comunicação.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <h4 className="font-bold text-slate-900">Contrato Ético de Ninhada</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Assinatura digital do compromisso com o destino ético de 100% dos filhotes, proibição de venda em vitrines e cláusula de recompra preventiva.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <h4 className="font-bold text-slate-900">Acompanhamento Obstétrico</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Citologia vaginal, dosagem hormonal de progesterona e ultrassonografia gestacional com obstetra credenciado.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowManifestoModal(true)}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
            >
              Ver Regulamento Ético e Normas CFMV nº 1.069 →
            </button>
          </div>

          {/* Interactive Wright's COI Inbreeding Calculator */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 font-heading flex items-center gap-1.5">
                <Dna className="w-4 h-4 text-emerald-700" />
                <span>Calculadora de Coeficiente COI</span>
              </h3>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Wright's Formula
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Simule o coeficiente de endogamia genética entre seu cão e o reprodutor para evitar doenças recessivas homozigotas:
            </p>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Cão Solicitante:</label>
                <input
                  type="text"
                  readOnly
                  value={activeDog ? `${activeDog.name} (${activeDog.breed})` : 'Nenhum cão cadastrado'}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Reprodutor(a) Alvo:</label>
                <select
                  value={coiFather}
                  onChange={(e) => setCoiFather(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none"
                >
                  <option>Apollo Von Sternberg (Golden Retriever)</option>
                  <option>Kiara Bellatrix (Boiadeiro Bernês)</option>
                  <option>Odin Black Ironwood (Pastor Alemão)</option>
                </select>
              </div>

              <button
                onClick={handleCalculateCoi}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Simular Compatibilidade Genética (COI)
              </button>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800">COI Estimado:</span>
                <p className="text-lg font-bold font-mono text-emerald-900 leading-none">
                  {simulatedCoi}%
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-1 rounded-lg border border-emerald-200 shadow-xs">
                Excelente (≤ 6.25%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Manifesto Ético */}
      {showManifestoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 font-heading">
                Manifesto Ético de Reprodução Canina CanisTech
              </h3>
              <button
                onClick={() => setShowManifestoModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900">1. Intervalo Reprodutivo Biológico</h4>
                <p>
                  É terminantemente proibido cruzar a cadela em cios consecutivos. Exigimos no mínimo 1 cio completo de descanso e limite máximo de 3 a 4 ninhadas durante toda a vida fértil, com castração recomendada ao término.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900">2. Tolerância Zero a Doenças Hereditárias Previsíveis</h4>
                <p>
                  Cães portadores de displasia severa (Grau C ou inferior), problemas cardíacos congênitos graves ou colapso traqueal congênito são sumariamente descredenciados.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900">3. Responsabilidade Vitalícia pelos Filhotes</h4>
                <p>
                  Criador e tutor respondem solidariamente pela destinação dos filhotes. Proibida venda para revenda em vitrines e lojas de pet shop convencionais.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowManifestoModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Li e Concordo com os Termos Éticos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Solicitar Contato Auditado */}
      {showContactModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 font-heading">
                Abertura de Protocolo de Acasalamento: {selectedCandidate.name}
              </h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-200 text-[11px] text-slate-600">
                <p><strong>Cão Solicitante:</strong> {activeDog ? `${activeDog.name} (${activeDog.breed})` : 'Cadastro pendente'}</p>
                <p><strong>Candidato Alvo:</strong> {selectedCandidate.name} • {selectedCandidate.pedigreeNumber}</p>
                <p className="text-emerald-700 font-semibold">✓ Laudos veterinários do solicitante sincronizados do DogOS.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mensagem ao Tutor / Criador:
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Apresente brevemente o objetivo do acasalamento, planejamento do parto e laudos disponíveis..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-slate-900 resize-none"
                />
              </div>

              <div className="space-y-1 text-[11px] text-slate-600">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" required className="rounded mt-0.5" />
                  <span>Declaro que meu cão possui laudos médicos atualizados e concordo com o contrato de ninhada responsável.</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors"
                >
                  Enviar Solicitação Auditada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
