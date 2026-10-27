import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  AlertTriangle,
  PhoneCall,
  ShieldAlert,
  Bot,
  User,
  CheckCircle2,
  X,
  Stethoscope,
  Syringe,
  Brain,
  Apple,
  Activity,
  ChevronRight,
  Info,
  Clock,
  ExternalLink,
  Flame,
  MessageCircle,
} from 'lucide-react';
import { DogProfile } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isEmergencyAlert?: boolean;
  topic?: string;
  recommendationLevel?: 'rotina' | 'alerta' | 'urgente';
}

interface VetChatAssistantProps {
  activeDog: DogProfile;
  initialQuery?: string;
  onClose: () => void;
}

export type TopicId = 'digestivo' | 'pele' | 'vacina' | 'comportamento' | 'nutricao' | 'emergencia';

interface TopicCategory {
  id: TopicId;
  label: string;
  iconName: string;
  colorClass: string;
  badgeClass: string;
  description: string;
  preQuestions: string[];
}

export const TOPIC_CATEGORIES: TopicCategory[] = [
  {
    id: 'digestivo',
    label: 'Sintomas Digestivos',
    iconName: 'Activity',
    colorClass: 'bg-amber-100 text-amber-800 border-amber-200',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
    description: 'Vômitos, diarreia, ingestão de grama, gases e falta de apetite',
    preQuestions: [
      'Meu cão está vomitando espuma branca ou amarelada: o que pode ser e o que fazer?',
      'Fezes pastosas com muco há mais de 24h: quando devo levar ao hospital?',
      'Cão comeu grama e depois vomitou: isso é normal ou sinal de gastrite?',
      'Ele recusa a ração seca há 2 dias mas continua ativo: qual a conduta inicial?',
    ],
  },
  {
    id: 'pele',
    label: 'Problemas de Pele & Alergias',
    iconName: 'ShieldAlert',
    colorClass: 'bg-rose-100 text-rose-800 border-rose-200',
    badgeClass: 'bg-rose-50 text-rose-900 border-rose-300',
    description: 'Coceira intensa, dermatites, DAPP por pulgas, queda de pêlo e otite',
    preQuestions: [
      'Meu cão se coça muito na base da cauda e tem falhas no pêlo (suspeita de DAPP)',
      'Ouvido com secreção escura, cheiro forte e cão balançando a cabeça (otite?)',
      'Pele da barriga com bolinhas vermelhas após passeio na grama',
      'Queda excessiva de pêlos com descamação e caspa: banhos terapêuticos ajudam?',
    ],
  },
  {
    id: 'vacina',
    label: 'Vacinação & Profilaxia',
    iconName: 'Syringe',
    colorClass: 'bg-blue-100 text-blue-800 border-blue-200',
    badgeClass: 'bg-blue-50 text-blue-900 border-blue-300',
    description: 'Calendário de V10, Raiva, Giárdia, atrasos de reforço e reações pós-dose',
    preQuestions: [
      'A dose da vacina V10 atrasou 20 dias: preciso reiniciar o protocolo?',
      'Cão ficou sonolento e com inchaço leve no local da vacina: é reação esperada?',
      'Filhote: quantos dias após a 3ª dose da V10 ele pode passear na rua com segurança?',
      'Qual a diferença entre a vacina V8 e a V10 para a realidade do Brasil?',
    ],
  },
  {
    id: 'comportamento',
    label: 'Comportamento & Ansiedade',
    iconName: 'Brain',
    colorClass: 'bg-purple-100 text-purple-800 border-purple-200',
    badgeClass: 'bg-purple-50 text-purple-900 border-purple-300',
    description: 'Ansiedade de separação, latidos excessivos, medo de trovão e fogos',
    preQuestions: [
      'Cão chora, uiva e morde portas quando fica sozinho em casa (ansiedade de separação)',
      'Como proteger e acalmar o cão durante queima de fogos de artifício ou tempestades?',
      'Meu cão começou a rosnar quando alguém se aproxima da tigela de ração (guarda de recursos)',
      'Como gastar a energia mental de um cão ativo em dias de chuva?',
    ],
  },
  {
    id: 'nutricao',
    label: 'Nutrição & Toxicidade',
    iconName: 'Apple',
    colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    description: 'Alimentos proibidos, cálculo hídrico, suplementação articular e rações',
    preQuestions: [
      'Meu cão ingeriu chocolate, cebola ou uvas: qual o risco e a conduta imediata?',
      'Como calcular a quantidade exata de água e ração diária ideal para o peso dele?',
      'Quais frutas e petiscos naturais são 100% seguros para cães?',
      'Suplementação com Condroitina e Glucosamina realmente protege articulações?',
    ],
  },
  {
    id: 'emergencia',
    label: 'Emergências & Trauma 24h',
    iconName: 'AlertTriangle',
    colorClass: 'bg-red-100 text-red-900 border-red-300',
    badgeClass: 'bg-red-50 text-red-950 border-red-400',
    description: 'Convulsão, envenenamento por chumbinho, torção gástrica e atropelamento',
    preQuestions: [
      '🚨 Meu cão está tendo uma convulsão agora: primeiros socorros imediatos!',
      '🚨 Suspeita de torção de estômago (barriga inchada e ânsia de vômito sem sair nada)',
      '🚨 Ingestão acidental de veneno de rato (chumbinho): protocolo nos primeiros minutos',
      '🚨 Cão engasgado com ossos ou brinquedo: como fazer a manobra de desengasgo?',
    ],
  },
];

const CRITICAL_KEYWORDS = [
  'convulsão',
  'convulsionando',
  'sangue',
  'hemorragia',
  'veneno',
  'chumbinho',
  'atropelado',
  'atropelamento',
  'desmaio',
  'desmaiou',
  'não respira',
  'cianose',
  'língua roxa',
  'barriga inchada',
  'torção gástrica',
  'torção de estômago',
  'paracetamol',
  'xilitol',
  'veneno de rato',
  'estricnina',
  'engasgado',
];

export const VetChatAssistant: React.FC<VetChatAssistantProps> = ({
  activeDog,
  initialQuery,
  onClose,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<TopicId>('digestivo');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-welcome',
      sender: 'assistant',
      text: `Olá! Sou a CanisTech AI 24h, a inteligência clínica veterinária integrada ao prontuário oficial de ${activeDog.name} (${activeDog.breed}, ${activeDog.currentWeight}kg, Escore Corporal ${activeDog.bcsScore}/9).

Estou calibrada com os protocolos da WSAVA, CFMV e os dados médicos do seu cão. Escolha um dos tópicos abaixo ou faça uma pergunta direta para iniciarmos a triagem.`,
      timestamp: 'Agora',
      recommendationLevel: 'rotina',
    },
  ]);

  const [input, setInput] = useState<string>(initialQuery || '');
  const [hasEmergency, setHasEmergency] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery);
    }
  }, []);

  const currentTopicCategory = TOPIC_CATEGORIES.find((t) => t.id === selectedTopic) || TOPIC_CATEGORIES[0];

  // Clinical Knowledge Generator for CanisTech AI
  const generateClinicalResponse = (query: string): { reply: string; isCritical: boolean; level: 'rotina' | 'alerta' | 'urgente' } => {
    const lower = query.toLowerCase();
    const isCritical = CRITICAL_KEYWORDS.some((kw) => lower.includes(kw));

    if (isCritical) {
      return {
        isCritical: true,
        level: 'urgente',
        reply: `🚨 CONDUTA EMERGENCIAL IMEDIATA PARA ${activeDog.name.toUpperCase()} (${activeDog.currentWeight}kg):

Pelos sintomas relatados ("${query}"), há suspeita de risco iminente à vida do animal.

1. CONVULSÃO OU DESMAIO: Mantenha a calma. Afaste móveis e objetos pontiagudos. NÃO coloque as mãos na boca do animal (risco de mordedura involuntária). Cronometre a duração do episódio e proteja a cabeça com uma toalha macia.
2. ENVENENAMENTO / CHUMBINHO: NÃO induza o vômito se o cão estiver sonolento, com salivação excessiva ou em convulsão (risco de pneumonia por aspiração). Recolha uma amostra da substância ou embalagem para levar ao médico.
3. TORÇÃO GÁSTRICA (GDV): Típico em cães de peito profundo como ${activeDog.breed}. Sinais: distensão abdominal rápida, tentativas infrutíferas de vômito e salivação espessa. Cada minuto conta para evitar necrose gástrica.

🏥 HOSPITAL VETERINÁRIO DE PRONTIDÃO 24H:
Hospital Veterinário Santa Inês / Pet Care 24h - UTI Canina Completa.
Telefone Emergência: (11) 2236-5888 / (11) 3740-4500.`,
      };
    }

    if (lower.includes('vômito') || lower.includes('vomitando') || lower.includes('espuma')) {
      return {
        isCritical: false,
        level: 'alerta',
        reply: `📋 AVALIAÇÃO CLÍNICA DE SINTOMAS DIGESTIVOS:

Para um cão da raça ${activeDog.breed} com ${activeDog.currentWeight}kg:
• Espuma branca ou amarelada: Frequentemente associada à gastrite por bile matinal (jejum prolongado) ou irritação gástrica inicial.
• Conduta de Suporte Provisória:
  1. Ofereça água fresca em pequenas quantidades (10 a 20 ml a cada 30 minutos) para evitar a desidratação sem provocar novo reflexo de vômito.
  2. Suspenda alimentos sólidos por 4 a 6 horas. Se cessar, reintroduza dieta branda pastosa (arroz cozido sem tempero com peito de frango desfiado em pequenas porções).
• SINAIS DE ALERTA PARA CONSULTA IMEDIATA: Mais de 2 episódios nas últimas 12 horas, sangue vermelho vivo ou escuro ("borra de café"), prostração ou abdômen rígido e doloroso à palpação.`,
      };
    }

    if (lower.includes('diarreia') || lower.includes('fezes') || lower.includes('pastosa')) {
      return {
        isCritical: false,
        level: 'alerta',
        reply: `📋 AVALIAÇÃO DE MOTILIDADE INTESTINAL & FEZES:

• Fezes pastosas com muco indicam comumente inflamação de cólon (colite), podendo decorrer de indiscrição alimentar, troca brusca de ração ou protozoários (como Giárdia sp.).
• Hidratação é a prioridade número um: O peso de ${activeDog.name} (${activeDog.currentWeight}kg) exige reposição eletrolítica. Monitore o turgor cutâneo (puxando a pele da nuca: deve voltar em menos de 1 segundo).
• Orientação Profilática: Colete uma amostra recente das fezes em pote limpo para o exame coproparasitológico.
• NUNCA administre antidiarreicos humanos (como loperamida) sem prescrição, pois podem causar retenção de toxinas e íleo paralítico em cães.`,
      };
    }

    if (lower.includes('coceira') || lower.includes('dapp') || lower.includes('pele') || lower.includes('pêlo') || lower.includes('alergia')) {
      return {
        isCritical: false,
        level: 'rotina',
        reply: `🩺 DERMATOLOGIA & MANEJO ALÉRGICO CANINO:

O histórico clínico de ${activeDog.name} registra: "${activeDog.allergies?.join(', ') || 'Sem alergias graves'}".
• A Dermatite Alérgica a Picada de Pulgas (DAPP) é a causa mais comum de prurido no dorso e base da cauda. Uma única picada pode manter o cão se coçando por semanas devido à saliva do ectoparasita.
• Recomendações Clínicas:
  1. Certifique-se de que o antiparasitário oral (Simparic, Bravecto ou NexGard) está rigorosamente dentro do prazo de eficácia.
  2. Evite banhos com shampoos humanos com fragrâncias artificiais. Prefira loções à base de aveia coloidal ou clorexidina a 2-3% sob orientação.
  3. Suplementação com Ômega 3 (EPA + DHA) auxilia na recomposição da barreira cutânea e reduz mediadores inflamatórios.`,
      };
    }

    if (lower.includes('ouvido') || lower.includes('otite') || lower.includes('cabeça')) {
      return {
        isCritical: false,
        level: 'alerta',
        reply: `🩺 CONDUTA CLÍNICA PARA SUSPEITA DE OTITE:

Em cães como ${activeDog.name} (${activeDog.breed}), que possuem orelhas pendulosas com canal auditivo quente e úmido:
• Balançar a cabeça e cheiro forte caracterizam infecção bacteriana ou proliferação de leveduras (Malassezia pachydermatis).
• O QUE NÃO FAZER: Nunca use cotonetes dentro do conduto auditivo (risco de empurrar secreção contra o tímpano) nem pingue soluções alcoólicas ou medicamentos que contenham aminoglicosídeos sem antes realizar otoscopia veterinária para checar a integridade da membrana timpânica.
• O QUE FAZER: Limpe apenas a porção externa da orelha com solução ceruminolítica veterinária neutra e agende consulta para citologia auricular.`,
      };
    }

    if (lower.includes('v10') || lower.includes('vacina') || lower.includes('vacinação') || lower.includes('reforço')) {
      return {
        isCritical: false,
        level: 'rotina',
        reply: `💉 PROTOCOLO DE IMUNIZAÇÃO & REFORÇO VACINAL (CFMV/WSAVA):

• Atraso de Doses no Cão Adulto: Se a vacina essencial (V8/V10 ou Raiva) atrasou poucos dias ou semanas, a recomendação veterinária padrão é aplicar uma única dose de reforço anual imediatamente, sem necessidade de reiniciar toda a série primária de filhote.
• Reações Normais Pós-Vacinais: Sonolência nas primeiras 24 horas e leve sensibilidade no sítio de injeção são esperadas devido à resposta imune e adjuvantes.
• Sinais de Hipersensibilidade Aguda: Inchaço facial (angioedema), urticária ou vômito nas primeiras 2 horas requerem retorno imediato para administração de anti-histamínico/corticoide injetável pelo veterinário.
• O CanisTech DogOS monitora as datas e envia avisos 7 dias antes para evitar atrasos na janela imunológica.`,
      };
    }

    if (lower.includes('ansiedade') || lower.includes('chora') || lower.includes('fogos') || lower.includes('sozinho') || lower.includes('latido')) {
      return {
        isCritical: false,
        level: 'rotina',
        reply: `🧠 COMPORTAMENTO & BEM-ESTAR PSICOLÓGICO CANINO:

A meta diária recomendada de estimulação cognitiva para ${activeDog.name} é de ${activeDog.cognitiveMin} minutos.
• Ansiedade de Separação:
  1. Dessensibilize os gatilhos de saída (pegar chaves, colocar sapatos) sem de fato sair de casa.
  2. Forneça brinquedos recheáveis congelados com pasta e petiscos (Kong, tapetes de lamber) momentos antes de sair para associar sua partida a algo de alto valor gastronômico.
  3. Não faça despedidas calorosas ou repreensões ao retornar.
• Medo de Fogos e Trovões: Crie uma "toca segura" em cômodo interno com cobertores, feche cortinas e use ruído branco ou música clássica para mascarar os estampidos. Consulte o veterinário sobre fitoterápicos ou feromônios sintéticos (Adaptil).`,
      };
    }

    if (lower.includes('chocolate') || lower.includes('cacau') || lower.includes('cebola') || lower.includes('uva') || lower.includes('tóxico')) {
      return {
        isCritical: true,
        level: 'urgente',
        reply: `🚨 TOXICOLOGIA VETERINÁRIA URGENTE:

• CHOCOLATE / CACAU: Contém teobromina e cafeína, alcalóides que os cães não metabolizam eficientemente. Provoca arritmias cardíacas, taquicardia, tremores e convulsões. Para ${activeDog.name} (${activeDog.currentWeight}kg), doses acima de 20g de chocolate meio amargo/puro já exigem desintoxicação.
• UVAS (FRESCAS OU PASSAS): Extremamente nefrotóxicas, podem induzir insuficiência renal aguda anúrica mesmo em quantidades mínimas.
• CEBOLA E ALHO: Contêm dissulfeto de alilpropila, que oxida a hemoglobina causando anemia hemolítica com corpúsculos de Heinz.
• CONDUTA: Conduza ao hospital veterinário o quanto antes para lavagem gástrica e administração de carvão ativado farmacêutico se a ingestão ocorreu há menos de 120 minutos.`,
      };
    }

    if (lower.includes('água') || lower.includes('hidratação') || lower.includes('caloria') || lower.includes('alimentação')) {
      return {
        isCritical: false,
        level: 'rotina',
        reply: `🥗 EQUILÍBRIO NUTRICIONAL & METABÓLICO CANINO:

Para o paciente ${activeDog.name} (${activeDog.breed}, peso: ${activeDog.currentWeight}kg):
• Necessidade Hídrica Diária: A faixa fisiológica é de 50 a 60 ml/kg/dia, totalizando ${(activeDog.dailyWaterMl / 1000).toFixed(1)} Litros de água fresca e potável diariamente.
• Dieta Atual: ${activeDog.dietGramsPerDay || 420}g de ração Super Premium dividida em ${activeDog.dietPortions || 2} porções diárias.
• Suplementação Articular: ${activeDog.supplements || 'Condroitina + Glicosamina + UC-II'} recomendada para preservação de cartilagens em cães do grupo ${activeDog.breedGroup}.`,
      };
    }

    // Default general canine clinical response
    return {
      isCritical: false,
      level: 'rotina',
      reply: `📋 PARECER DE TRIAGEM PREVENTIVA CANISTECH:

Analisando a questão com base na fisiologia de cães ${activeDog.breed} de ${activeDog.currentWeight}kg:
• O quadro descrito requer observação atenta das funções vitais do paciente: nível de energia, apetite, ingestão voluntária de água e coloração das mucosas gengivais (devem estar róseas e úmidas).
• Mantenha a rotina alimentar e registre qualquer alteração na escala fecal ou no comportamento de ${activeDog.name}.
• Se os sintomas persistirem por mais de 24 horas ou apresentarem piora no estado geral, a avaliação presencial com palpação abdominal e ausculta cardiopulmonar é indispensável.`,
    };
  };

  const handleSend = (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim()) return;

    const userMsg: Message = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const result = generateClinicalResponse(q);

    if (result.isCritical) {
      setHasEmergency(true);
    }

    setTimeout(() => {
      setIsTyping(false);
      const assistantMsg: Message = {
        id: 'ast-' + Date.now(),
        sender: 'assistant',
        text: result.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isEmergencyAlert: result.isCritical,
        recommendationLevel: result.level,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full h-[680px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 px-5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base font-heading">
                  CanisTech AI 24h • Plantão Veterinário
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.2 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>Prontuário de <strong>{activeDog.name}</strong> ({activeDog.breed})</span>
                <span>•</span>
                <span>CFMV Compliant</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar chat de triagem"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Emergency Alert Banner if Triggered */}
        {hasEmergency && (
          <div className="bg-rose-600 text-white px-4 py-2.5 text-xs flex items-center justify-between gap-3 shrink-0 animate-pulse">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>SUSPEITA DE RISCO AGUDO: Encaminhe o paciente a um pronto-socorro veterinário 24h!</span>
            </div>
            <a
              href="tel:1122365888"
              className="px-3 py-1 bg-white text-rose-700 font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs whitespace-nowrap hover:bg-slate-50 transition-colors shrink-0"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Ligar Hospital 24h</span>
            </a>
          </div>
        )}

        {/* Topic Selector Ribbon (Horizontal scrollable chips) */}
        <div className="bg-slate-100/80 border-b border-slate-200 px-3 py-2 shrink-0">
          <div className="flex items-center justify-between pb-1.5 px-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <span>Selecione o Tópico Clínico:</span>
            </span>
            <span className="text-[10px] text-slate-400">Clique para ver pré-perguntas</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {TOPIC_CATEGORIES.map((cat) => {
              const isSelected = selectedTopic === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedTopic(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {cat.id === 'digestivo' && <Activity className="w-3.5 h-3.5 text-amber-500" />}
                  {cat.id === 'pele' && <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />}
                  {cat.id === 'vacina' && <Syringe className="w-3.5 h-3.5 text-blue-500" />}
                  {cat.id === 'comportamento' && <Brain className="w-3.5 h-3.5 text-purple-500" />}
                  {cat.id === 'nutricao' && <Apple className="w-3.5 h-3.5 text-emerald-500" />}
                  {cat.id === 'emergencia' && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Pre-questions Panel (Dynamic based on selected topic) */}
        <div className="bg-amber-50/40 border-b border-amber-200/60 px-3 py-2 shrink-0 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-amber-950 font-semibold px-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-orange-600" />
              <span>Perguntas Frequentes sobre <strong>{currentTopicCategory.label}</strong>:</span>
            </span>
            <span className="text-[10px] text-amber-700 font-normal">Envio com 1 clique</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {currentTopicCategory.preQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="text-left text-[11px] p-2 rounded-xl bg-white hover:bg-amber-100/70 text-slate-800 hover:text-slate-950 border border-amber-200 transition-colors flex items-center justify-between group shadow-2xs"
              >
                <span className="line-clamp-1 pr-1 font-medium">{q}</span>
                <ChevronRight className="w-3.5 h-3.5 text-orange-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Chat History Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                  🐾
                </div>
              )}

              <div
                className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-line ${
                  m.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-br-xs shadow-xs'
                    : m.isEmergencyAlert
                    ? 'bg-red-50 text-red-950 border border-red-300 rounded-bl-xs font-medium'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-xs'
                }`}
              >
                <div>{m.text}</div>

                {/* MANDATORY CLINICAL DISCLAIMER ON EVERY AI MESSAGE */}
                {m.sender === 'assistant' && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 bg-amber-50/70 p-2.5 rounded-xl flex items-start gap-2 text-[10px] text-amber-950">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="leading-tight">
                      <strong>Aviso Regulatório CFMV:</strong> Esta orientação inteligente de triagem tem finalidade informativa e <u>NÃO substitui a consulta clínica presencial</u>, anamnese detalhada e exame físico realizados por um Médico-Veterinário com registro ativo no CRMV. Em caso de agravamento ou dúvida, consulte imediatamente o veterinário de {activeDog.name}.
                    </div>
                  </div>
                )}

                <span
                  className={`block text-[9px] mt-1.5 text-right font-mono ${
                    m.sender === 'user' ? 'text-slate-400' : 'text-slate-400'
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-2.5 items-center">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                🐾
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">CanisTech AI formulando resposta clínica...</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0.4s]"></span>
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form & Permanent Footer Disclaimer */}
        <div className="p-3 px-4 bg-white border-t border-slate-200 shrink-0 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Pergunte sobre sintomas, doses, alimentação ou comportamento de ${activeDog.name}...`}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-slate-900 focus:bg-white transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </form>

          {/* Legal CFMV Footer Bar */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-400" />
              <span>Padrão Normativo CFMV Art. 12/2021 • Anamnese & Triagem Digital</span>
            </span>
            <span className="font-semibold text-slate-500">
              Sempre consulte o Médico-Veterinário
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
