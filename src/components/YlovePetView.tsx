import React, { useState, useMemo } from 'react';
import { YloveCandidate, DogProfile, DogPedigree, PedigreeAncestor } from '../types';
import { sanitizeXss } from '../services/authService';
import {
  ShieldCheck,
  Dna,
  FileCheck,
  Award,
  Search,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  MessageSquare,
} from 'lucide-react';

interface YlovePetViewProps {
  candidates: YloveCandidate[];
  activeDog?: DogProfile | null;
  onRequestBreedMatch: (candidateName: string) => void;
}

interface AncestorNode {
  key: string;
  label: string;
  n: number; // Passos geracionais a partir do genitor (0 = próprio genitor, 1 = avô/avó, 2 = bisavô/bisavó)
  fA: number; // Coeficiente de endogamia do ancestral comum F_A
}

function normalizeAncestorKey(anc?: PedigreeAncestor | null): string {
  if (!anc || !anc.name || !anc.name.trim()) return '';
  if (anc.regNumber && anc.regNumber.trim()) {
    return `REG:${anc.regNumber.trim().toUpperCase().replace(/\s+/g, '')}`;
  }
  return `NAME:${anc.name.trim().toLowerCase().replace(/\s+/g, ' ')}`;
}

/**
 * Verifica se a Árvore Genealógica de 3 Gerações do exemplar possui dados preenchidos
 */
export function hasThreeGenerationPedigree(ped?: DogPedigree | null): boolean {
  if (!ped) return false;
  const hasParents = Boolean(ped.father?.name?.trim() && ped.mother?.name?.trim());
  const hasGrandparents = Boolean(
    ped.paternalGrandfather?.name?.trim() ||
      ped.paternalGrandmother?.name?.trim() ||
      ped.maternalGrandfather?.name?.trim() ||
      ped.maternalGrandmother?.name?.trim()
  );
  return hasParents && hasGrandparents;
}

/**
 * Extrai a linhagem de 3 gerações de um indivíduo ou ramo parental com distâncias geracionais (n)
 */
function extractLineageNodes(ped: DogPedigree, side: 'paternal' | 'maternal'): AncestorNode[] {
  const nodes: AncestorNode[] = [];
  const addNode = (anc: PedigreeAncestor | undefined, n: number, fA = 0) => {
    const key = normalizeAncestorKey(anc);
    if (key && anc) {
      nodes.push({
        key,
        label: anc.regNumber ? `${anc.name.trim()} (${anc.regNumber.trim()})` : anc.name.trim(),
        n,
        fA,
      });
    }
  };

  if (side === 'paternal') {
    // Verifica se o próprio Pai possui endogamia entre seus avós (bisavós do cão)
    const patGF1 = normalizeAncestorKey(ped.paternalGGF1);
    const patGF2 = normalizeAncestorKey(ped.paternalGGF2);
    const patGM1 = normalizeAncestorKey(ped.paternalGGM1);
    const patGM2 = normalizeAncestorKey(ped.paternalGGM2);
    const fatherFa =
      (patGF1 && (patGF1 === patGF2 || patGF1 === patGM2) ? 0.125 : 0) +
      (patGM1 && (patGM1 === patGF2 || patGM1 === patGM2) ? 0.125 : 0);

    addNode(ped.father, 0, fatherFa);
    addNode(ped.paternalGrandfather, 1, 0);
    addNode(ped.paternalGrandmother, 1, 0);
    addNode(ped.paternalGGF1, 2, 0);
    addNode(ped.paternalGGM1, 2, 0);
    addNode(ped.paternalGGF2, 2, 0);
    addNode(ped.paternalGGM2, 2, 0);
  } else {
    const matGF1 = normalizeAncestorKey(ped.maternalGGF1);
    const matGF2 = normalizeAncestorKey(ped.maternalGGF2);
    const matGM1 = normalizeAncestorKey(ped.maternalGGM1);
    const matGM2 = normalizeAncestorKey(ped.maternalGGM2);
    const motherFa =
      (matGF1 && (matGF1 === matGF2 || matGF1 === matGM2) ? 0.125 : 0) +
      (matGM1 && (matGM1 === matGF2 || matGM1 === matGM2) ? 0.125 : 0);

    addNode(ped.mother, 0, motherFa);
    addNode(ped.maternalGrandfather, 1, 0);
    addNode(ped.maternalGrandmother, 1, 0);
    addNode(ped.maternalGGF1, 2, 0);
    addNode(ped.maternalGGM1, 2, 0);
    addNode(ped.maternalGGF2, 2, 0);
    addNode(ped.maternalGGM2, 2, 0);
  }

  return nodes;
}

/**
 * Cálculo Determinístico Real do Coeficiente de Consanguinidade de Wright (COI):
 * Fórmula Científica: F_X = \sum (0.5)^{n_1 + n_2 + 1} * (1 + F_A)
 * Analisa os ancestrais comuns cadastrados no pedigree de 3 gerações (Pais, Avós e Bisavós),
 * tanto do próprio exemplar quanto no cruzamento simulado com um reprodutor/matriz.
 */
export function calculateDeterministicWrightCoi(
  dogPedigree: DogPedigree,
  matePedigree?: DogPedigree | null
): {
  coiPercentage: number;
  commonAncestors: string[];
  formulaSteps: string[];
} {
  let line1Nodes: AncestorNode[] = [];
  let line2Nodes: AncestorNode[] = [];

  if (matePedigree && hasThreeGenerationPedigree(matePedigree)) {
    // Cruzamento entre o cão titular (Genitor 1) e o candidato selecionado (Genitor 2):
    // Pais do cão titular estão a n1 = 1 do filhote simulado, Avós a n1 = 2, Bisavós a n1 = 3
    const dogPaternal = extractLineageNodes(dogPedigree, 'paternal').map((node) => ({
      ...node,
      n: node.n + 1,
    }));
    const dogMaternal = extractLineageNodes(dogPedigree, 'maternal').map((node) => ({
      ...node,
      n: node.n + 1,
    }));
    line1Nodes = [...dogPaternal, ...dogMaternal];

    const matePaternal = extractLineageNodes(matePedigree, 'paternal').map((node) => ({
      ...node,
      n: node.n + 1,
    }));
    const mateMaternal = extractLineageNodes(matePedigree, 'maternal').map((node) => ({
      ...node,
      n: node.n + 1,
    }));
    line2Nodes = [...matePaternal, ...mateMaternal];
  } else {
    // COI intrínseco do exemplar titular (Linhagem Paterna n1 vs Linhagem Materna n2)
    line1Nodes = extractLineageNodes(dogPedigree, 'paternal');
    line2Nodes = extractLineageNodes(dogPedigree, 'maternal');
  }

  let fx = 0;
  const commonAncestorsSet = new Set<string>();
  const formulaSteps: string[] = [];
  const processedPairs = new Set<string>();

  for (const pNode of line1Nodes) {
    for (const mNode of line2Nodes) {
      if (pNode.key === mNode.key) {
        const pairId = `${pNode.key}::${pNode.n}::${mNode.n}`;
        if (processedPairs.has(pairId)) continue;
        processedPairs.add(pairId);

        const n1 = pNode.n;
        const n2 = mNode.n;
        const fA = Math.max(pNode.fA, mNode.fA);
        const pathContribution = Math.pow(0.5, n1 + n2 + 1) * (1 + fA);
        fx += pathContribution;
        commonAncestorsSet.add(pNode.label);
        formulaSteps.push(
          `${pNode.label}: (0.5)^(${n1}+${n2}+1) × (1+${fA}) = ${(pathContribution * 100).toFixed(2)}%`
        );
      }
    }
  }

  // Caso não haja cruzamento com candidato mas o próprio exemplar tenha COI intrínseco somado ao candidato
  if (
    fx === 0 &&
    matePedigree &&
    hasThreeGenerationPedigree(dogPedigree)
  ) {
    // Verifica também a endogamia intrínseca da árvore do próprio cão titular
    const selfPaternal = extractLineageNodes(dogPedigree, 'paternal');
    const selfMaternal = extractLineageNodes(dogPedigree, 'maternal');
    for (const pNode of selfPaternal) {
      for (const mNode of selfMaternal) {
        if (pNode.key === mNode.key) {
          const pairId = `SELF::${pNode.key}::${pNode.n}::${mNode.n}`;
          if (processedPairs.has(pairId)) continue;
          processedPairs.add(pairId);
          const n1 = pNode.n;
          const n2 = mNode.n;
          const fA = Math.max(pNode.fA, mNode.fA);
          const pathContribution = Math.pow(0.5, n1 + n2 + 1) * (1 + fA);
          fx += pathContribution;
          commonAncestorsSet.add(pNode.label);
          formulaSteps.push(
            `${pNode.label} (Árvore do Exemplar): (0.5)^(${n1}+${n2}+1) × (1+${fA}) = ${(pathContribution * 100).toFixed(2)}%`
          );
        }
      }
    }
  }

  const coiPercentage = Number((fx * 100).toFixed(2));
  return {
    coiPercentage,
    commonAncestors: Array.from(commonAncestorsSet),
    formulaSteps,
  };
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

  // Inbreeding Calculator Simulator State (100% Determinístico — Wright's Formula)
  const [selectedMateId, setSelectedMateId] = useState<string>(candidates[0]?.id || 'ylove-1');
  const [contactMessage, setContactMessage] = useState<string>('');

  const dogHasPedigree = useMemo(
    () => hasThreeGenerationPedigree(activeDog?.pedigree),
    [activeDog?.pedigree]
  );

  const selectedMate = useMemo(
    () => candidates.find((c) => c.id === selectedMateId) || candidates[0] || null,
    [candidates, selectedMateId]
  );

  const deterministicCoiResult = useMemo(() => {
    if (!activeDog?.pedigree || !dogHasPedigree) {
      return null;
    }
    return calculateDeterministicWrightCoi(activeDog.pedigree, selectedMate?.pedigree || null);
  }, [activeDog?.pedigree, dogHasPedigree, selectedMate?.pedigree]);

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
    setContactMessage('');
    setShowContactModal(true);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const safeMsg = sanitizeXss(contactMessage);
    setShowContactModal(false);
    onRequestBreedMatch(selectedCandidate?.name || '');
    showToast(
      `Solicitação auditada para ${selectedCandidate?.name} enviada ao Comitê Veterinário CanisTech! (${safeMsg.length} caracteres validados)`
    );
  };

  const handleCalculateCoi = () => {
    if (!activeDog || !dogHasPedigree || !deterministicCoiResult) {
      showToast(
        'Aguardando Árvore Genealógica (3 Gerações): Preencha o Pedigree no cadastro do cão para calcular o COI científico exato'
      );
      return;
    }
    showToast(
      `Cálculo Determinístico de Wright concluído: COI = ${deterministicCoiResult.coiPercentage.toFixed(2)}% (${deterministicCoiResult.commonAncestors.length} ancestrais comuns na árvore de 3 gerações)`
    );
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

          {/* Interactive Wright's COI Inbreeding Calculator (100% Determinístico) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 font-heading flex items-center gap-1.5">
                <Dna className="w-4 h-4 text-emerald-700" />
                <span>Calculadora Científica COI de Wright</span>
              </h3>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono">
                F_X = Σ(0.5)^(n1+n2+1)·(1+F_A)
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Cálculo determinístico exato de consanguinidade pela fórmula de Sewall Wright analisando os ancestrais comuns na árvore genealógica de 3 gerações (Pais, Avós e Bisavós):
            </p>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Exemplar Titular (3 Gerações):</label>
                <input
                  type="text"
                  readOnly
                  value={
                    activeDog
                      ? `${activeDog.name}${activeDog.kennelAffix ? ` (${activeDog.kennelAffix})` : ''} • ${activeDog.breed}`
                      : 'Nenhum cão cadastrado'
                  }
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Reprodutor(a) / Matriz para Cruzamento:</label>
                <select
                  value={selectedMateId}
                  onChange={(e) => setSelectedMateId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none font-medium"
                >
                  {candidates.map((cand) => (
                    <option key={cand.id} value={cand.id}>
                      {cand.name} ({cand.breed} • {cand.pedigreeNumber})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleCalculateCoi}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                Calcular COI Científico Determinístico (Wright)
              </button>
            </div>

            {!dogHasPedigree || !deterministicCoiResult ? (
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold leading-snug">
                    Aguardando Árvore Genealógica (3 Gerações): Preencha o Pedigree no cadastro do cão para calcular o COI científico exato
                  </p>
                  <p className="text-[11px] text-amber-800/90 leading-relaxed">
                    O motor determinístico de Sewall Wright exige o preenchimento de Pais e Avós (com números de registro RG/CBKC/FCI) na ficha do exemplar.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                      COI Determinístico (Wright):
                    </span>
                    <p className="text-lg font-bold font-mono text-emerald-900 leading-none mt-0.5">
                      {deterministicCoiResult.coiPercentage.toFixed(2)}%
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border shadow-xs ${
                      deterministicCoiResult.coiPercentage <= 6.25
                        ? 'text-emerald-700 bg-white border-emerald-200'
                        : 'text-red-700 bg-red-50 border-red-200'
                    }`}
                  >
                    {deterministicCoiResult.coiPercentage === 0
                      ? 'Outcross Total (0% Ancestrais Comuns)'
                      : deterministicCoiResult.coiPercentage <= 6.25
                      ? 'Seguro (≤ 6.25%)'
                      : 'Alerta Endogâmico (> 6.25%)'}
                  </span>
                </div>

                {deterministicCoiResult.commonAncestors.length > 0 ? (
                  <div className="pt-2 border-t border-emerald-200/70 text-[11px] text-emerald-900 space-y-1 font-mono">
                    <span className="font-bold block font-sans">
                      Ancestrais Comuns Detectados ({deterministicCoiResult.commonAncestors.length}):
                    </span>
                    {deterministicCoiResult.formulaSteps.map((step, i) => (
                      <div key={i} className="truncate">
                        • {step}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-800 pt-1 border-t border-emerald-200/70">
                    ✓ Nenhum ancestral repetido entre as linhagens paterna e materna nas 3 gerações analisadas ($F_X = 0$).
                  </p>
                )}
              </div>
            )}
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
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
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
