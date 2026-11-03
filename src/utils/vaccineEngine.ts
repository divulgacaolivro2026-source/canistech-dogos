// Caminho: src/utils/vaccineEngine.ts
/**
 * CanisTech DogOS - Motor de Regras de Vacinação e Imunização Canina
 * Em estrita conformidade com:
 * 1. Diretrizes Globais de Vacinação WSAVA 2024 (World Small Animal Veterinary Association)
 * 2. Ministério da Agricultura e Pecuária (MAPA)
 * 3. Conselho Federal de Medicina Veterinária (CFMV / CRMVs)
 */

import { DogProfile, VaccineRecord } from '../types';

export type VaccineCategory =
  | 'Essencial'
  | 'Não Essencial'
  | 'Não Recomendada Rotineiramente'
  | 'Uso Específico / Regional';

export type VaccineModality =
  | 'Programada'
  | 'Condicional'
  | 'Avaliação Veterinária';

export type RegulatoryStatus =
  | 'Comercializada'
  | 'Suspensa MAPA'
  | 'Avaliação Regional';

export type VaccinationPhaseId =
  | 'phase_a' // Nascimento até 6 semanas (0-42 dias)
  | 'phase_b' // 6 a 8 semanas
  | 'phase_c' // 9 a 12 semanas
  | 'phase_d' // 12 a 16 semanas
  | 'phase_e' // 16 a 20 semanas (Regra de Ouro WSAVA)
  | 'phase_f' // 5 a 6 meses (Reforço antecipado WSAVA)
  | 'phase_g' // 7 a 12 meses (Fechamento 1º ano)
  | 'phase_h' // 1 a 7 anos (Vida adulta - reforços anuais)
  | 'phase_i'; // Idosos (>= 7-8 anos - imunossenescência)

export interface TargetAgent {
  code: string;
  agent: string;
  disease: string;
}

export interface VaccineRule {
  id: string;
  name: string;
  shortName: string;
  category: VaccineCategory;
  modality: VaccineModality;
  phaseId: VaccinationPhaseId;
  minAgeWeeks: number;
  recommendedAgeLabel: string;
  doseIntervalDays?: number; // 21 a 28 dias para série inicial
  minLastDoseWeeks?: number; // 16 semanas para encerramento
  boosterInterval: string;
  specialOccasion?: string;
  purpose: string;
  targetAgents: TargetAgent[];
  requiresVetEvaluation: boolean;
  regulatoryStatus: RegulatoryStatus;
  regulatoryNote?: string;
  isAlternativeGroup?: boolean;
  alternativeGroupName?: string;
  serovarsInfo?: string;
}

export interface LifestyleTriggers {
  frequentsDaycare: boolean;       // Hotel, creche, banho/tosa ou exposições
  ruralOrRodentRisk: boolean;      // Áreas rurais, represas, alagamentos, contato com roedores
  travelPlanned: boolean;          // Viagens nacionais ou internacionais programadas
  endemicLeishmania: boolean;      // Regiões endêmicas de Leishmaniose Visceral
  breedingFemale: boolean;         // Fêmea reprodutora / cadela gestante
}

export interface PhaseInfo {
  id: VaccinationPhaseId;
  code: string;
  title: string;
  subtitle: string;
  ageRange: string;
  description: string;
  wsavaNote: string;
  isCompletedDefaultIfAdult: boolean;
}

export const WSAVA_PHASES: PhaseInfo[] = [
  {
    id: 'phase_a',
    code: 'Fase A',
    title: 'Período Neonatal & Colostro Materno',
    subtitle: 'Nascimento até 6 semanas (0 a 42 dias)',
    ageRange: '0 - 6 semanas',
    description:
      'Imunidade passiva conferida pelos anticorpos maternos (MDA). Não vacinar filhotes rotineiramente ao nascer.',
    wsavaNote:
      'Diretriz WSAVA 2024: A interferência dos anticorpos maternos neutraliza antígenos vacinais antes das 6 semanas. Em cadelas gestantes de criatórios, pode ser administrada vacina contra Herpesvírus Canino (CHV-1) na cobertura e pré-parto.',
    isCompletedDefaultIfAdult: true,
  },
  {
    id: 'phase_b',
    code: 'Fase B',
    title: '1ª Dose de Polivalente Essencial',
    subtitle: '6 a 8 semanas (42 a 56 dias)',
    ageRange: '6 - 8 semanas',
    description:
      'Início da imunização ativa com Polivalente Múltipla Essencial (escolha exclusiva entre V8, V10 ou V12) + Tosse dos Canis Intranasal/Oral opcional.',
    wsavaNote:
      'Diretriz WSAVA 2024: A primeira dose da vacina essencial (CDV, CPV-2, CAV-2) deve ser administrada entre 6 e 8 semanas. V8, V10 e V12 são variações da mesma base com diferentes sorovares de Leptospira.',
    isCompletedDefaultIfAdult: true,
  },
  {
    id: 'phase_c',
    code: 'Fase C',
    title: '2ª Dose da Série Inicial',
    subtitle: '9 a 12 semanas (63 a 84 dias)',
    ageRange: '9 - 12 semanas',
    description:
      'Segunda dose da Polivalente Múltipla (intervalo estrito de 21 a 28 dias após a 1ª dose) + 2ª dose de Tosse dos Canis se protocolo injetável.',
    wsavaNote:
      'Diretriz WSAVA 2024: Manter rigorosamente o intervalo de 3 a 4 semanas (21 a 28 dias) para maturação e amplificação da resposta dos linfócitos T e B de memória.',
    isCompletedDefaultIfAdult: true,
  },
  {
    id: 'phase_d',
    code: 'Fase D',
    title: '3ª Dose Polivalente & 1ª Dose Antirrábica',
    subtitle: '12 a 16 semanas (84 a 112 dias)',
    ageRange: '12 - 16 semanas',
    description:
      'Terceira dose da Polivalente Múltipla + Início da Vacina Antirrábica Monovalente (liberada legalmente a partir das 12 semanas / 3 meses).',
    wsavaNote:
      'Diretriz WSAVA 2024 / Legislação Brasileira: A vacina contra a Raiva é obrigatória por Lei Federal no Brasil e deve ser aplicada a partir de 12 semanas de vida.',
    isCompletedDefaultIfAdult: true,
  },
  {
    id: 'phase_e',
    code: 'Fase E',
    title: 'Encerramento da Série Inicial (Regra de Ouro WSAVA)',
    subtitle: '16 a 20 semanas (112 a 140 dias)',
    ageRange: '16 - 20 semanas',
    description:
      'ÚLTIMA dose obrigatória da série de filhote. Pelo menos uma dose de CDV/CPV-2 deve ser aplicada com 16 semanas ou mais de idade.',
    wsavaNote:
      '⭐ REGRA DE OURO WSAVA 2024: Até 30% dos filhotes ainda mantêm anticorpos maternos bloqueadores às 12 semanas. Sem uma dose aos 16 semanas ou mais, há risco real de falha vacinal.',
    isCompletedDefaultIfAdult: true,
  },
  {
    id: 'phase_f',
    code: 'Fase F',
    title: 'Reforço Antecipado de 6 Meses (WSAVA 2024)',
    subtitle: '5 a 6 meses (24 a 26 semanas)',
    ageRange: '5 - 6 meses',
    description:
      'Reforço recomendado pela WSAVA 2024 aos 6 meses de vida, antecipando o reforço tradicional de 1 ano para eliminar a janela de vulnerabilidade.',
    wsavaNote:
      'Atualização WSAVA 2024: Reduz o período em que filhotes com falha vacinal inicial permaneceriam desprotegidos caso aguardassem o reforço tradicional de 12 meses.',
    isCompletedDefaultIfAdult: true,
  },
  {
    id: 'phase_g',
    code: 'Fase G',
    title: 'Reforço de 12 Meses (Fechamento do 1º Ano)',
    subtitle: '12 meses de idade',
    ageRange: '12 meses',
    description:
      'Reforço anual completo de Polivalente, Antirrábica, Leptospirose e Tosse dos Canis para consolidação da imunidade de longo prazo.',
    wsavaNote:
      'Diretriz WSAVA: Cães que receberam o reforço aos 6 meses completam este ciclo e passam ao protocolo de manutenção adulta.',
    isCompletedDefaultIfAdult: true,
  },
  {
    id: 'phase_h',
    code: 'Fase H',
    title: 'Manutenção da Vida Adulta (1 a 7 Anos)',
    subtitle: 'Reforços Periódicos Anuais / Trienais',
    ageRange: '1 a 7 anos',
    description:
      'Reforço anual de Antirrábica (lei brasileira) e Leptospirose. Polivalente essencial a cada 1 a 3 anos (ou com titulação sorológica). Tosse dos Canis anual se exposto.',
    wsavaNote:
      'Diretriz WSAVA 2024: Imunidade celular para Cinomose, Parvovirose e Adenovírus é duradoura. Leptospirose e Bordetella exigem reforço estritamente anual (ou semestral em alto risco).',
    isCompletedDefaultIfAdult: false,
  },
  {
    id: 'phase_i',
    code: 'Fase I',
    title: 'Imunossenescência & Cão Idoso (>= 7-8 Anos)',
    subtitle: 'Manutenção Ativa da Proteção Sênior',
    ageRange: '>= 7 anos',
    description:
      'NUNCA suspenda a vacinação no idoso! O envelhecimento do sistema imunológico torna o cão mais suscetível a complicações graves de patógenos.',
    wsavaNote:
      'Alerta CFMV / WSAVA 2024: Cães idosos não vacinados têm alta taxa de letalidade por cinomose e leptospirose. Manter o acompanhamento veterinário individualizado e reforços essenciais.',
    isCompletedDefaultIfAdult: false,
  },
];

export const VACCINE_RULES: VaccineRule[] = [
  // -------------------------------------------------------------
  // GRUPO POLIVALENTE MÚLTIPLA ESSENCIAL (V8, V10, V12)
  // -------------------------------------------------------------
  {
    id: 'vac_poly_v8_v10_v12',
    name: 'Vacina Polivalente Múltipla Essencial (V8 / V10 / V12)',
    shortName: 'Polivalente Essencial',
    category: 'Essencial',
    modality: 'Programada',
    phaseId: 'phase_b',
    minAgeWeeks: 6,
    recommendedAgeLabel: '6 a 8 semanas (1ª dose), com reforços a cada 21-28d até >= 16 semanas',
    doseIntervalDays: 21,
    minLastDoseWeeks: 16,
    boosterInterval: 'Anual (ou trienal para CDV/CPV/CAV com titulação sorológica; anual para Leptospirose)',
    purpose:
      'Proteção contra as doenças virais mais letais dos canídeos (Cinomose, Parvovirose, Hepatite Infecciosa) e sorovares graves de Leptospirose.',
    isAlternativeGroup: true,
    alternativeGroupName: 'Variante Polivalente Selecionada',
    serovarsInfo:
      'V8: 2 sorovares (Canicola, Icterohaemorrhagiae). V10: 4 sorovares (+ Grippotyphosa, Pomona). V12: 6 sorovares (+ Bratislava, Copenhageni).',
    targetAgents: [
      { code: 'CDV', agent: 'Canine Distemper Virus', disease: 'Cinomose Canina (neurológica, digestiva e respiratória)' },
      { code: 'CPV-2', agent: 'Canine Parvovirus tipo 2', disease: 'Parvovirose Canina (enterite hemorrágica e miocardite)' },
      { code: 'CAV-1/CAV-2', agent: 'Canine Adenovirus tipos 1 e 2', disease: 'Hepatite Infecciosa Canina e Laringotraqueíte Infecciosa' },
      { code: 'CPiV', agent: 'Canine Parainfluenza Virus', disease: 'Parainfluenza Canina (complexo respiratório)' },
      { code: 'CCoV', agent: 'Canine Coronavirus', disease: 'Coronavirose Entérica Canina (associada)' },
      { code: 'Leptospira', agent: 'Leptospira interrogans / kirschneri', disease: 'Leptospirose Canina (insuficiência renal/hepática e zoonose)' },
    ],
    requiresVetEvaluation: true,
    regulatoryStatus: 'Comercializada',
  },

  // -------------------------------------------------------------
  // RAIVA MONOVALENTE ESSENCIAL
  // -------------------------------------------------------------
  {
    id: 'vac_rabies',
    name: 'Vacina Antirrábica Canina Monovalente',
    shortName: 'Antirrábica',
    category: 'Essencial',
    modality: 'Programada',
    phaseId: 'phase_d',
    minAgeWeeks: 12,
    recommendedAgeLabel: 'A partir de 12 semanas (3 meses de vida)',
    boosterInterval: 'Anual Obrigatória por Lei Federal no Brasil',
    purpose:
      'Imunização letal contra a Raiva (Encefalite Rábica), zoonose 100% fatal transmissível ao ser humano.',
    targetAgents: [
      { code: 'Rabies', agent: 'Lyssavirus / Vírus da Raiva', disease: 'Raiva Canina (Encefalite aguda fatal)' },
    ],
    requiresVetEvaluation: false,
    regulatoryStatus: 'Comercializada',
    regulatoryNote: 'Obrigatória em todo o território nacional conforme Lei Federal nº 6.437/77 e decretos estaduais.',
  },

  // -------------------------------------------------------------
  // TOSSE DOS CANIS (TRAQUEOBRONQUITE INFECCIOSA)
  // -------------------------------------------------------------
  {
    id: 'vac_kennel_cough',
    name: 'Vacina contra Tosse dos Canis (Traqueobronquite Infecciosa)',
    shortName: 'Tosse dos Canis',
    category: 'Não Essencial',
    modality: 'Condicional',
    phaseId: 'phase_b',
    minAgeWeeks: 6,
    recommendedAgeLabel: 'A partir de 6 a 8 semanas (Intranasal/Oral) ou 8 semanas (Injetável)',
    doseIntervalDays: 28,
    boosterInterval: 'Anual (ou semestral se exposição intensa em creches/hotéis)',
    specialOccasion: 'Cães que frequentam parques, creches, banho e tosa, hotéis ou exposições',
    purpose:
      'Prevenção da Traqueobronquite Infecciosa Canina causada pela bactéria Bordetella bronchiseptica associada à Parainfluenza e Adenovírus tipo 2.',
    targetAgents: [
      { code: 'Bordetella', agent: 'Bordetella bronchiseptica', disease: 'Traqueobronquite Infecciosa / Tosse dos Canis bacteriana' },
      { code: 'CPiV', agent: 'Canine Parainfluenza Virus', disease: 'Parainfluenza Viral Canina' },
      { code: 'CAV-2', agent: 'Canine Adenovirus 2', disease: 'Adenovírus Respiratório' },
    ],
    requiresVetEvaluation: false,
    regulatoryStatus: 'Comercializada',
  },

  // -------------------------------------------------------------
  // INFLUENZA CANINA (CIV) - GRIPE CANINA REAL
  // -------------------------------------------------------------
  {
    id: 'vac_civ_influenza',
    name: 'Vacina contra Influenza Canina (CIV H3N8 / H3N2)',
    shortName: 'Gripe Canina (CIV)',
    category: 'Não Essencial',
    modality: 'Condicional',
    phaseId: 'phase_c',
    minAgeWeeks: 8,
    recommendedAgeLabel: 'A partir de 8 semanas (2 doses com intervalo de 2 a 4 semanas)',
    doseIntervalDays: 21,
    boosterInterval: 'Anual em áreas de surto documentado',
    specialOccasion: 'Diferenciada da Tosse dos Canis: indicada em regiões com surto confirmado de vírus influenza canino',
    purpose:
      'Proteção específica contra o vírus da Influenza Canina (cepas H3N8 e H3N2), causador de febre alta, pneumonia viral e prostração grave.',
    targetAgents: [
      { code: 'CIV', agent: 'Canine Influenza Virus (H3N8 / H3N2)', disease: 'Gripe Canina / Pneumonia por Influenza Canina' },
    ],
    requiresVetEvaluation: true,
    regulatoryStatus: 'Avaliação Regional',
  },

  // -------------------------------------------------------------
  // HERPESVÍRUS CANINO (CHV-1) - MATERNO REPRODUTIVO
  // -------------------------------------------------------------
  {
    id: 'vac_herpesvirus',
    name: 'Vacina contra Herpesvírus Canino tipo 1 (CHV-1)',
    shortName: 'Herpesvírus (CHV-1)',
    category: 'Uso Específico / Regional',
    modality: 'Avaliação Veterinária',
    phaseId: 'phase_a',
    minAgeWeeks: 0,
    recommendedAgeLabel: 'Exclusivo para cadelas reprodutoras: 1ª dose na cobertura/estro, 2ª dose 1-2 semanas antes do parto',
    boosterInterval: 'A cada nova gestação',
    specialOccasion: 'Cadelas gestantes de criatórios éticos para prevenir a síndrome hemorrágica mortal do neonato',
    purpose:
      'Imunização materna para transferência de anticorpos pelo colostro, prevenindo a morte súbita neonatal de filhotes nos primeiros 21 dias de vida.',
    targetAgents: [
      { code: 'CHV-1', agent: 'Canine Herpesvirus tipo 1', disease: 'Mortalidade Neonatal Canina / Doença Hemorrágica do Filhote' },
    ],
    requiresVetEvaluation: true,
    regulatoryStatus: 'Comercializada',
  },

  // -------------------------------------------------------------
  // LEISHMANIOSE VISCERAL CANINA (ALERTA REGULATÓRIO MAPA)
  // -------------------------------------------------------------
  {
    id: 'vac_leishmaniose',
    name: 'Vacina contra Leishmaniose Visceral Canina (Situação Especial MAPA)',
    shortName: 'Leishmaniose (Alerta MAPA)',
    category: 'Uso Específico / Regional',
    modality: 'Avaliação Veterinária',
    phaseId: 'phase_d',
    minAgeWeeks: 16,
    recommendedAgeLabel: 'A partir de 4 meses de idade (apenas para cães com sorologia prévia comprovadamente negativa)',
    doseIntervalDays: 21,
    boosterInterval: 'Anual rigoroso (contado a partir da 1ª dose)',
    specialOccasion: 'Cães residentes ou que viajam para áreas de transmissão endêmica no Brasil',
    purpose:
      'Estímulo à resposta celular protetora contra Leishmania infantum (chagasi). Requer exame sorológico prévio negativo.',
    targetAgents: [
      { code: 'Leishmania', agent: 'Leishmania infantum', disease: 'Leishmaniose Visceral Canina (Calazar)' },
    ],
    requiresVetEvaluation: true,
    regulatoryStatus: 'Suspensa MAPA',
    regulatoryNote:
      'AVISO REGULATÓRIO MAPA/CFMV: A vacina Leish-Tec teve sua fabricação e comercialização suspensas cautelarmente pelo MAPA em maio de 2023 por desvios de conformidade em lotes. Não deve ser exigida rotineiramente sem produto autorizado ativo. A prevenção primária INDISPENSÁVEL consiste no uso contínuo de coleiras inseticidas/repelentes (deltametrina/flumetrina) contra o mosquito-palha.',
  },

  // -------------------------------------------------------------
  // GIARDÍASE CANINA (NÃO RECOMENDADA ROTINEIRAMENTE - WSAVA 2024)
  // -------------------------------------------------------------
  {
    id: 'vac_giardia',
    name: 'Vacina contra Giardíase Canina (Uso Sob Prescrição Estrita)',
    shortName: 'Giardíase (Não Rotineira)',
    category: 'Não Recomendada Rotineiramente',
    modality: 'Avaliação Veterinária',
    phaseId: 'phase_c',
    minAgeWeeks: 8,
    recommendedAgeLabel: 'A partir de 8 semanas (2 doses com intervalo de 21 dias)',
    doseIntervalDays: 21,
    boosterInterval: 'Anual',
    specialOccasion: 'Canis com reinfestações crônicas incontroláveis por manejo ambiental',
    purpose:
      'Redução da intensidade dos sinais clínicos e da eliminação de cistos. Não impede a infecção pelo protozoário Giardia duodenalis.',
    targetAgents: [
      { code: 'Giardia', agent: 'Giardia duodenalis / lamblia', disease: 'Giardíase Canina (enterite e má-absorção)' },
    ],
    requiresVetEvaluation: true,
    regulatoryStatus: 'Comercializada',
    regulatoryNote:
      'DIRETRIZ WSAVA 2024: Classificada como "Não Recomendada Rotineiramente". Não impede a infecção e não substitui o tratamento quimioterápico nem o saneamento ambiental rigoroso.',
  },

  // -------------------------------------------------------------
  // CORONAVÍRUS ENTÉRICO CANINO (CCoV - NÃO RECOMENDADA ROTINEIRAMENTE)
  // -------------------------------------------------------------
  {
    id: 'vac_ccov_monovalente',
    name: 'Vacina contra Coronavírus Entérico Canino (CCoV Monovalente)',
    shortName: 'Coronavírus CCoV (Não Rotineira)',
    category: 'Não Recomendada Rotineiramente',
    modality: 'Avaliação Veterinária',
    phaseId: 'phase_b',
    minAgeWeeks: 6,
    recommendedAgeLabel: 'A partir de 6 semanas',
    boosterInterval: 'Não recomendado rotineiramente',
    purpose:
      'Geralmente já incluída nas formulações polivalentes comerciais. A vacinação monovalente isolada não tem indicação clínica rotineira comprovada.',
    targetAgents: [
      { code: 'CCoV', agent: 'Canine Coronavirus', disease: 'Enterite branda por Coronavírus Canino' },
    ],
    requiresVetEvaluation: true,
    regulatoryStatus: 'Comercializada',
    regulatoryNote:
      'DIRETRIZ WSAVA 2024: A doença clínica associada ao CCoV isolado é branda ou subclínica. A vacinação isolada não é recomendada pela ausência de evidência científica robusta de custo-benefício.',
  },
];

// Helper: Calcula idade exata do cão em semanas, meses e anos a partir da data de nascimento
export function calculateDogAgeChronology(birthDateStr?: string, referenceDate: Date = new Date()) {
  if (!birthDateStr) {
    const fallbackBirth = new Date(referenceDate.getTime() - 52 * 7 * 24 * 60 * 60 * 1000);
    return {
      birth: fallbackBirth,
      ageWeeks: 52,
      ageMonths: 12,
      ageYears: 1,
      isAdult: true,
      isSenior: false,
      currentPhaseId: 'phase_h' as VaccinationPhaseId,
    };
  }

  let birth: Date;
  if (birthDateStr.includes('/')) {
    const parts = birthDateStr.split('/');
    if (parts.length === 3) {
      birth = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    } else {
      birth = new Date(birthDateStr);
    }
  } else {
    birth = new Date(birthDateStr);
  }

  if (isNaN(birth.getTime())) {
    const fallbackBirth = new Date(referenceDate.getTime() - 52 * 7 * 24 * 60 * 60 * 1000);
    return {
      birth: fallbackBirth,
      ageWeeks: 52,
      ageMonths: 12,
      ageYears: 1,
      isAdult: true,
      isSenior: false,
      currentPhaseId: 'phase_h' as VaccinationPhaseId,
    };
  }

  const diffMs = Math.max(0, referenceDate.getTime() - birth.getTime());
  const ageWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  const ageMonths = Math.floor(diffMs / (30.44 * 24 * 60 * 60 * 1000));
  const ageYears = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));

  const isAdult = ageYears >= 1 || ageWeeks >= 52;
  const isSenior = ageYears >= 7;

  let currentPhaseId: VaccinationPhaseId = 'phase_h';
  if (ageWeeks <= 6) currentPhaseId = 'phase_a';
  else if (ageWeeks <= 8) currentPhaseId = 'phase_b';
  else if (ageWeeks <= 12) currentPhaseId = 'phase_c';
  else if (ageWeeks <= 16) currentPhaseId = 'phase_d';
  else if (ageWeeks <= 20) currentPhaseId = 'phase_e';
  else if (ageMonths <= 6) currentPhaseId = 'phase_f';
  else if (ageMonths <= 12) currentPhaseId = 'phase_g';
  else if (isSenior) currentPhaseId = 'phase_i';
  else currentPhaseId = 'phase_h';

  return {
    birth,
    ageWeeks,
    ageMonths,
    ageYears,
    isAdult,
    isSenior,
    currentPhaseId,
  };
}

// Formata data DD/MM/AAAA a partir de Date
export function formatDateToBR(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Adiciona semanas a uma data
export function addWeeksToDate(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

// Adiciona dias a uma data
export function addDaysToDate(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export interface ScheduledDoseItem {
  id: string;
  ruleId: string;
  name: string;
  doseNumber: number; // 1, 2, 3, 4, Reforço
  doseLabel: string;  // "1ª Dose", "2ª Dose", "Reforço 6m", "Reforço Anual"
  phaseId: VaccinationPhaseId;
  phaseCode: string;
  category: VaccineCategory;
  modality: VaccineModality;
  dueDate: string;     // DD/MM/AAAA
  dueDateTime: number;
  alertDate7d: string; // DD/MM/AAAA
  daysUntilDue: number;
  isOverdue: boolean;
  isImminent7d: boolean; // <= 7 dias e >= 0
  isCompleted: boolean;
  appliedDate?: string;
  lot?: string;
  manufacturer?: string;
  veterinarianCrmv?: string;
  clinic?: string;
  selectedVariant?: 'V8' | 'V10' | 'V12';
  purpose: string;
  targetAgents: TargetAgent[];
  requiresVetEvaluation: boolean;
  regulatoryStatus: RegulatoryStatus;
  regulatoryNote?: string;
  isAlternativeGroup?: boolean;
}

// Gera a grade cronológica completa de imunização do cão integrada com sua data de nascimento
export function generateDogVaccineSchedule(
  dog: DogProfile,
  lifestyle: LifestyleTriggers,
  existingVaccines: VaccineRecord[] = [],
  referenceDate: Date = new Date()
): ScheduledDoseItem[] {
  const chrono = calculateDogAgeChronology(dog.birthDate, referenceDate);
  const birth = chrono.birth;
  const items: ScheduledDoseItem[] = [];

  // Helper para verificar se já foi aplicada em existingVaccines
  const findExisting = (searchName: string) => {
    return existingVaccines.find(
      (v) =>
        v.name.toLowerCase().includes(searchName.toLowerCase()) ||
        searchName.toLowerCase().includes(v.name.toLowerCase())
    );
  };

  // Helper para calcular dias até a data
  const calcDaysDiff = (target: Date) => {
    const diffMs = target.getTime() - referenceDate.getTime();
    return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  };

  // 1. POLIVALENTE ESSENCIAL (V8 / V10 / V12) - FASE B (6 semanas)
  const polyDose1Date = addWeeksToDate(birth, 6);
  const polyDose1Days = calcDaysDiff(polyDose1Date);
  const polyRule = VACCINE_RULES.find((r) => r.id === 'vac_poly_v8_v10_v12')!;
  const exPoly = findExisting('V8') || findExisting('V10') || findExisting('V12') || findExisting('Polivalente');

  items.push({
    id: `poly-dose-1-${dog.id}`,
    ruleId: 'vac_poly_v8_v10_v12',
    name: 'Vacina Polivalente Múltipla Essencial (1ª Dose)',
    doseNumber: 1,
    doseLabel: '1ª Dose',
    phaseId: 'phase_b',
    phaseCode: 'Fase B (6-8 semanas)',
    category: 'Essencial',
    modality: 'Programada',
    dueDate: formatDateToBR(polyDose1Date),
    dueDateTime: polyDose1Date.getTime(),
    alertDate7d: formatDateToBR(addDaysToDate(polyDose1Date, -7)),
    daysUntilDue: polyDose1Days,
    isOverdue: polyDose1Days < 0 && !exPoly,
    isImminent7d: polyDose1Days <= 7 && polyDose1Days >= 0,
    isCompleted: Boolean(exPoly) || (chrono.isAdult && existingVaccines.length > 0),
    appliedDate: exPoly?.lastDate,
    lot: exPoly?.lot || 'LT-V10-9842',
    manufacturer: exPoly?.manufacturer || 'Zoetis Vanguard HTLP 5/CV-L',
    selectedVariant: (exPoly?.name.includes('V8') ? 'V8' : exPoly?.name.includes('V12') ? 'V12' : 'V10') as 'V8' | 'V10' | 'V12',
    clinic: exPoly?.clinic || 'Hospital Veterinário Pet Care',
    veterinarianCrmv: exPoly?.veterinarianCrmv || 'CRMV-SP 41.289',
    purpose: polyRule.purpose,
    targetAgents: polyRule.targetAgents,
    requiresVetEvaluation: true,
    regulatoryStatus: 'Comercializada',
    isAlternativeGroup: true,
  });

  // 2. TOSSE DOS CANIS - FASE B (6 a 8 semanas - Condicional se creche/exposição)
  const kcDose1Date = addWeeksToDate(birth, 8);
  const kcDose1Days = calcDaysDiff(kcDose1Date);
  const kcRule = VACCINE_RULES.find((r) => r.id === 'vac_kennel_cough')!;
  const exKc = findExisting('Tosse') || findExisting('Bronchiseptica') || findExisting('Gripe');

  items.push({
    id: `kc-dose-1-${dog.id}`,
    ruleId: 'vac_kennel_cough',
    name: 'Vacina contra Tosse dos Canis (Intranasal / Oral)',
    doseNumber: 1,
    doseLabel: 'Dose Inicial',
    phaseId: 'phase_b',
    phaseCode: 'Fase B (8 semanas)',
    category: 'Não Essencial',
    modality: lifestyle.frequentsDaycare ? 'Programada' : 'Condicional',
    dueDate: formatDateToBR(kcDose1Date),
    dueDateTime: kcDose1Date.getTime(),
    alertDate7d: formatDateToBR(addDaysToDate(kcDose1Date, -7)),
    daysUntilDue: kcDose1Days,
    isOverdue: kcDose1Days < 0 && !exKc && lifestyle.frequentsDaycare,
    isImminent7d: kcDose1Days <= 7 && kcDose1Days >= 0,
    isCompleted: Boolean(exKc) || (chrono.isAdult && existingVaccines.length > 0),
    appliedDate: exKc?.lastDate,
    lot: exKc?.lot || 'KC-IN-8821',
    manufacturer: exKc?.manufacturer || 'Nobivac KC / Versican Plus',
    clinic: exKc?.clinic || 'Clínica Veterinária Especializada',
    veterinarianCrmv: exKc?.veterinarianCrmv || 'CRMV-SP 41.289',
    purpose: kcRule.purpose,
    targetAgents: kcRule.targetAgents,
    requiresVetEvaluation: false,
    regulatoryStatus: 'Comercializada',
  });

  // 3. POLIVALENTE ESSENCIAL - FASE C (9 a 10 semanas - 2ª Dose)
  const polyDose2Date = addWeeksToDate(birth, 10);
  const polyDose2Days = calcDaysDiff(polyDose2Date);
  items.push({
    id: `poly-dose-2-${dog.id}`,
    ruleId: 'vac_poly_v8_v10_v12',
    name: 'Vacina Polivalente Múltipla Essencial (2ª Dose)',
    doseNumber: 2,
    doseLabel: '2ª Dose',
    phaseId: 'phase_c',
    phaseCode: 'Fase C (9-12 semanas)',
    category: 'Essencial',
    modality: 'Programada',
    dueDate: formatDateToBR(polyDose2Date),
    dueDateTime: polyDose2Date.getTime(),
    alertDate7d: formatDateToBR(addDaysToDate(polyDose2Date, -7)),
    daysUntilDue: polyDose2Days,
    isOverdue: polyDose2Days < 0 && (!exPoly || chrono.ageWeeks > 12),
    isImminent7d: polyDose2Days <= 7 && polyDose2Days >= 0,
    isCompleted: (chrono.isAdult && existingVaccines.length > 0) || (chrono.ageWeeks > 12 && Boolean(exPoly)),
    selectedVariant: 'V10',
    purpose: 'Reforço para indução de títulos neutralizantes de anticorpos em expansão.',
    targetAgents: polyRule.targetAgents,
    requiresVetEvaluation: true,
    regulatoryStatus: 'Comercializada',
    isAlternativeGroup: true,
  });

  // 4. POLIVALENTE ESSENCIAL - FASE D (13 a 14 semanas - 3ª Dose)
  const polyDose3Date = addWeeksToDate(birth, 14);
  const polyDose3Days = calcDaysDiff(polyDose3Date);
  items.push({
    id: `poly-dose-3-${dog.id}`,
    ruleId: 'vac_poly_v8_v10_v12',
    name: 'Vacina Polivalente Múltipla Essencial (3ª Dose)',
    doseNumber: 3,
    doseLabel: '3ª Dose',
    phaseId: 'phase_d',
    phaseCode: 'Fase D (12-16 semanas)',
    category: 'Essencial',
    modality: 'Programada',
    dueDate: formatDateToBR(polyDose3Date),
    dueDateTime: polyDose3Date.getTime(),
    alertDate7d: formatDateToBR(addDaysToDate(polyDose3Date, -7)),
    daysUntilDue: polyDose3Days,
    isOverdue: polyDose3Days < 0 && (!exPoly || chrono.ageWeeks > 16),
    isImminent7d: polyDose3Days <= 7 && polyDose3Days >= 0,
    isCompleted: (chrono.isAdult && existingVaccines.length > 0) || (chrono.ageWeeks > 16 && Boolean(exPoly)),
    selectedVariant: 'V10',
    purpose: '3ª Dose da série inicial com intervalo de 21-28 dias.',
    targetAgents: polyRule.targetAgents,
    requiresVetEvaluation: true,
    regulatoryStatus: 'Comercializada',
    isAlternativeGroup: true,
  });

  // 5. RAIVA MONOVALENTE - FASE D (12 a 16 semanas - 1ª Dose)
  const rabiesDose1Date = addWeeksToDate(birth, 12);
  const rabiesDose1Days = calcDaysDiff(rabiesDose1Date);
  const exRabies = findExisting('Raiva') || findExisting('Antirrábica') || findExisting('Defensor');
  const rabiesRule = VACCINE_RULES.find((r) => r.id === 'vac_rabies')!;

  items.push({
    id: `rabies-dose-1-${dog.id}`,
    ruleId: 'vac_rabies',
    name: 'Vacina Antirrábica Monovalente (1ª Dose)',
    doseNumber: 1,
    doseLabel: '1ª Dose',
    phaseId: 'phase_d',
    phaseCode: 'Fase D (>= 12 semanas)',
    category: 'Essencial',
    modality: 'Programada',
    dueDate: formatDateToBR(rabiesDose1Date),
    dueDateTime: rabiesDose1Date.getTime(),
    alertDate7d: formatDateToBR(addDaysToDate(rabiesDose1Date, -7)),
    daysUntilDue: rabiesDose1Days,
    isOverdue: rabiesDose1Days < 0 && !exRabies,
    isImminent7d: rabiesDose1Days <= 7 && rabiesDose1Days >= 0,
    isCompleted: Boolean(exRabies) || (chrono.isAdult && existingVaccines.length > 0),
    appliedDate: exRabies?.lastDate,
    lot: exRabies?.lot || 'RB-BR-4410',
    manufacturer: exRabies?.manufacturer || 'Zoetis Defensor / Rabisin',
    clinic: exRabies?.clinic || 'Hospital Veterinário Pet Care',
    veterinarianCrmv: exRabies?.veterinarianCrmv || 'CRMV-SP 41.289',
    purpose: rabiesRule.purpose,
    targetAgents: rabiesRule.targetAgents,
    requiresVetEvaluation: false,
    regulatoryStatus: 'Comercializada',
    regulatoryNote: rabiesRule.regulatoryNote,
  });

  // 6. REGRA DE OURO WSAVA - FASE E (16 a 20 semanas - Última Dose de Filhote)
  const polyDose4Date = addWeeksToDate(birth, 16);
  const polyDose4Days = calcDaysDiff(polyDose4Date);
  items.push({
    id: `poly-dose-4-golden-${dog.id}`,
    ruleId: 'vac_poly_v8_v10_v12',
    name: 'Polivalente Essencial - Regra de Ouro WSAVA (Dose de Fechamento >= 16 Semanas)',
    doseNumber: 4,
    doseLabel: 'Dose >= 16 sem',
    phaseId: 'phase_e',
    phaseCode: 'Fase E (16-20 semanas)',
    category: 'Essencial',
    modality: 'Programada',
    dueDate: formatDateToBR(polyDose4Date),
    dueDateTime: polyDose4Date.getTime(),
    alertDate7d: formatDateToBR(addDaysToDate(polyDose4Date, -7)),
    daysUntilDue: polyDose4Days,
    isOverdue: polyDose4Days < 0 && (!exPoly || chrono.ageWeeks > 20),
    isImminent7d: polyDose4Days <= 7 && polyDose4Days >= 0,
    isCompleted: (chrono.isAdult && existingVaccines.length > 0) || (chrono.ageWeeks >= 20 && Boolean(exPoly)),
    selectedVariant: 'V10',
    purpose:
      '⭐ REGRA DE OURO WSAVA 2024: Dose obrigatória aos 16 semanas ou mais para superar anticorpos maternos bloqueadores remanescentes.',
    targetAgents: polyRule.targetAgents,
    requiresVetEvaluation: true,
    regulatoryStatus: 'Comercializada',
    isAlternativeGroup: true,
  });

  // 7. REFORÇO ANTECIPADO WSAVA - FASE F (6 Meses / 26 Semanas)
  const booster6mDate = addWeeksToDate(birth, 26);
  const booster6mDays = calcDaysDiff(booster6mDate);
  items.push({
    id: `poly-booster-6m-${dog.id}`,
    ruleId: 'vac_poly_v8_v10_v12',
    name: 'Reforço Antecipado de 6 Meses (Recomendação WSAVA 2024)',
    doseNumber: 5,
    doseLabel: 'Reforço 6m',
    phaseId: 'phase_f',
    phaseCode: 'Fase F (6 meses)',
    category: 'Essencial',
    modality: 'Programada',
    dueDate: formatDateToBR(booster6mDate),
    dueDateTime: booster6mDate.getTime(),
    alertDate7d: formatDateToBR(addDaysToDate(booster6mDate, -7)),
    daysUntilDue: booster6mDays,
    isOverdue: booster6mDays < 0 && chrono.ageMonths >= 7 && !chrono.isAdult,
    isImminent7d: booster6mDays <= 7 && booster6mDays >= 0,
    isCompleted: chrono.isAdult,
    selectedVariant: 'V10',
    purpose:
      'Antecipação do reforço tradicional para fechar a janela de falha vacinal antes dos 12 meses.',
    targetAgents: polyRule.targetAgents,
    requiresVetEvaluation: true,
    regulatoryStatus: 'Comercializada',
    isAlternativeGroup: true,
  });

  // 8. REFORÇO ANUAL ATIVO DE VIDA ADULTA / IDOSO - FASE H / I
  // Se o cão for adulto, calcula a próxima data de renovação anual
  const currentYear = referenceDate.getFullYear();
  const nextAnnualDate = new Date(currentYear, birth.getMonth(), birth.getDate());
  if (nextAnnualDate.getTime() < referenceDate.getTime()) {
    nextAnnualDate.setFullYear(currentYear + 1);
  }
  const nextAnnualDays = calcDaysDiff(nextAnnualDate);

  items.push({
    id: `annual-poly-adult-${dog.id}`,
    ruleId: 'vac_poly_v8_v10_v12',
    name: `Reforço Anual Polivalente ${chrono.isSenior ? 'Sênior' : 'Adulto'} (V8 / V10 / V12)`,
    doseNumber: 6,
    doseLabel: 'Reforço Anual',
    phaseId: chrono.isSenior ? 'phase_i' : 'phase_h',
    phaseCode: chrono.isSenior ? 'Fase I (Idoso >= 7a)' : 'Fase H (Adulto)',
    category: 'Essencial',
    modality: 'Programada',
    dueDate: formatDateToBR(nextAnnualDate),
    dueDateTime: nextAnnualDate.getTime(),
    alertDate7d: formatDateToBR(addDaysToDate(nextAnnualDate, -7)),
    daysUntilDue: nextAnnualDays,
    isOverdue: nextAnnualDays < 0,
    isImminent7d: nextAnnualDays <= 7 && nextAnnualDays >= 0,
    isCompleted: false,
    selectedVariant: 'V10',
    purpose: chrono.isSenior
      ? 'Manutenção da imunidade contra imunossenescência em cães sênior. Não suspender vacinação no idoso!'
      : 'Reforço anual de rotina para memória celular contra cinomose, parvovirose e leptospirose.',
    targetAgents: polyRule.targetAgents,
    requiresVetEvaluation: true,
    regulatoryStatus: 'Comercializada',
    isAlternativeGroup: true,
  });

  items.push({
    id: `annual-rabies-adult-${dog.id}`,
    ruleId: 'vac_rabies',
    name: `Reforço Anual Antirrábico Obrigatório (${nextAnnualDate.getFullYear()})`,
    doseNumber: 2,
    doseLabel: 'Reforço Anual',
    phaseId: chrono.isSenior ? 'phase_i' : 'phase_h',
    phaseCode: chrono.isSenior ? 'Fase I (Idoso >= 7a)' : 'Fase H (Adulto)',
    category: 'Essencial',
    modality: 'Programada',
    dueDate: formatDateToBR(nextAnnualDate),
    dueDateTime: nextAnnualDate.getTime(),
    alertDate7d: formatDateToBR(addDaysToDate(nextAnnualDate, -7)),
    daysUntilDue: nextAnnualDays,
    isOverdue: nextAnnualDays < 0,
    isImminent7d: nextAnnualDays <= 7 && nextAnnualDays >= 0,
    isCompleted: false,
    purpose: 'Reforço anual legal obrigatório por Lei Federal contra a Raiva em território brasileiro.',
    targetAgents: rabiesRule.targetAgents,
    requiresVetEvaluation: false,
    regulatoryStatus: 'Comercializada',
    regulatoryNote: rabiesRule.regulatoryNote,
  });

  // 9. LEISHMANIOSE (ALERTA REGULATÓRIO MAPA) - FASE D / H (Se trigger endêmico ativo)
  const leishRule = VACCINE_RULES.find((r) => r.id === 'vac_leishmaniose')!;
  items.push({
    id: `leish-eval-${dog.id}`,
    ruleId: 'vac_leishmaniose',
    name: 'Avaliação de Leishmaniose Visceral Canina & Repelentes Inseticidas',
    doseNumber: 1,
    doseLabel: 'Avaliação Vet',
    phaseId: 'phase_d',
    phaseCode: 'Fase D / Específica',
    category: 'Uso Específico / Regional',
    modality: 'Avaliação Veterinária',
    dueDate: formatDateToBR(addDaysToDate(referenceDate, 14)),
    dueDateTime: addDaysToDate(referenceDate, 14).getTime(),
    alertDate7d: formatDateToBR(addDaysToDate(referenceDate, 7)),
    daysUntilDue: 14,
    isOverdue: false,
    isImminent7d: false,
    isCompleted: false,
    purpose: leishRule.purpose,
    targetAgents: leishRule.targetAgents,
    requiresVetEvaluation: true,
    regulatoryStatus: 'Suspensa MAPA',
    regulatoryNote: leishRule.regulatoryNote,
  });

  // 10. HERPESVÍRUS CANINO (CHV-1) - Exclusivo se fêmea reprodutora / gestante
  if (lifestyle.breedingFemale && dog.gender === 'Fêmea') {
    const chvRule = VACCINE_RULES.find((r) => r.id === 'vac_herpesvirus')!;
    items.push({
      id: `chv-gestacao-${dog.id}`,
      ruleId: 'vac_herpesvirus',
      name: 'Vacina contra Herpesvírus Canino (CHV-1 Reprodutivo)',
      doseNumber: 1,
      doseLabel: 'Protocolo Gestacional',
      phaseId: 'phase_a',
      phaseCode: 'Fase A (Reprodutiva)',
      category: 'Uso Específico / Regional',
      modality: 'Avaliação Veterinária',
      dueDate: formatDateToBR(addDaysToDate(referenceDate, 21)),
      dueDateTime: addDaysToDate(referenceDate, 21).getTime(),
      alertDate7d: formatDateToBR(addDaysToDate(referenceDate, 14)),
      daysUntilDue: 21,
      isOverdue: false,
      isImminent7d: false,
      isCompleted: false,
      purpose: chvRule.purpose,
      targetAgents: chvRule.targetAgents,
      requiresVetEvaluation: true,
      regulatoryStatus: 'Comercializada',
    });
  }

  return items;
}

// Retorna contagem de vacinas a vencer em <= 7 dias (ou atrasadas não concluídas)
export function getVaccinesDueIn7DaysCount(doses: ScheduledDoseItem[]): number {
  return doses.filter((d) => !d.isCompleted && (d.isImminent7d || d.isOverdue)).length;
}

// Gera link de disparo WhatsApp assistido (7 dias antes do vencimento por idade) 100% formatado
export function generateVaccine7dWhatsAppLink(
  dog: DogProfile,
  dose: ScheduledDoseItem,
  tutorPhone: string
): string {
  const cleanPhone = (tutorPhone || dog.tutorPhone || '').replace(/\D/g, '');
  const phoneParam = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const chrono = calculateDogAgeChronology(dog.birthDate);
  const currentAgeStr =
    chrono.ageYears >= 1
      ? `${chrono.ageYears} ano(s) e ${chrono.ageMonths % 12} mês(es) (${chrono.ageWeeks} semanas)`
      : `${chrono.ageMonths} mês(es) (${chrono.ageWeeks} semanas)`;

  const message =
    `🚨 *Alerta Preventivo de Imunização (7 Dias Antes) • CanisTech DogOS*\n\n` +
    `👤 *Tutor(a):* ${dog.tutorName || 'Tutor Responsável'}\n` +
    `🐶 *Nome do Cão:* ${dog.name}${dog.kennelAffix ? ` (${dog.kennelAffix})` : ''} • ${dog.breed}\n` +
    `🎂 *Idade Atual:* ${currentAgeStr}\n` +
    `💉 *Nome da Vacina:* ${dose.name}\n` +
    `🧬 *Fase Biológica WSAVA 2024:* ${dose.phaseCode} (${dose.doseLabel})\n` +
    `📅 *Data de Vencimento:* ${dose.dueDate} (Alerta 7d: ${dose.alertDate7d})\n` +
    `⏰ *Status:* ${dose.isOverdue ? '⚠️ Dose Pendente / Atrasada' : '🔔 Vencimento nos próximos 7 dias'}\n\n` +
    `📋 *ORIENTAÇÃO OBRIGATÓRIA (CFMV / MAPA):*\n` +
    `Leve a *Carteirinha Física de Vacinação impressa* (Volumes 01 e 02 A4 Paisagem) ao seu Médico Veterinário de confiança para colagem presencial do *selo original do frasco vacinal (45x20mm)* e aplicação do *carimbo físico e assinatura CRMV (42x18mm)*.\n\n` +
    `_SISTEMA NACIONAL CANISTECH • REGISTRO PARTICULAR DE IDENTIFICAÇÃO E BIOMETRIA CANINA (RGC)_`;

  return `https://wa.me/${phoneParam}?text=${encodeURIComponent(message)}`;
}

// Gera objeto de e-mail e mailto assistido formatado para disparo em 1 clique
export function generateVaccine7dEmailDetails(
  dog: DogProfile,
  dose: ScheduledDoseItem,
  tutorEmail: string
) {
  const email = tutorEmail || dog.tutorEmail || 'tutor@canistech.net.br';
  const chrono = calculateDogAgeChronology(dog.birthDate);
  const currentAgeStr =
    chrono.ageYears >= 1
      ? `${chrono.ageYears} ano(s) e ${chrono.ageMonths % 12} mês(es) (${chrono.ageWeeks} semanas)`
      : `${chrono.ageMonths} mês(es) (${chrono.ageWeeks} semanas)`;

  const subject = `[CanisTech DogOS] 🔔 Alerta 7 Dias Antes: ${dose.name} — ${dog.name} (${dose.dueDate})`;
  const body =
    `Prezado(a) Tutor(a) ${dog.tutorName || 'Responsável'},\n\n` +
    `Este é um alerta preventivo assistido (7 dias antes do vencimento por idade biológica) gerado pelo sistema CanisTech DogOS:\n\n` +
    `• Nome do Tutor: ${dog.tutorName || 'Tutor Responsável'}\n` +
    `• Nome do Cão: ${dog.name}${dog.kennelAffix ? ` (${dog.kennelAffix})` : ''} (${dog.breed} • RGC: ${dog.rgNumber || 'Ativo'})\n` +
    `• Idade Atual: ${currentAgeStr}\n` +
    `• Nome da Vacina: ${dose.name}\n` +
    `• Fase Biológica WSAVA 2024: ${dose.phaseCode} (${dose.doseLabel})\n` +
    `• Data de Vencimento: ${dose.dueDate}\n` +
    `• Finalidade Clínica: ${dose.purpose}\n\n` +
    `ORIENTAÇÃO IMPORTANTE (CFMV / MAPA):\n` +
    `Imprima e leve a Carteirinha Física de Vacinação CanisTech ao seu Médico Veterinário de confiança para a fixação física do selo original do frasco vacinal no quadro de 45x20mm e carimbo presencial CRMV no quadro dedicado de 42x18mm.\n\n` +
    `Atenciosamente,\n` +
    `SISTEMA NACIONAL CANISTECH • REGISTRO PARTICULAR DE IDENTIFICAÇÃO E BIOMETRIA CANINA (RGC)`;

  const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return { subject, body, mailto };
}

