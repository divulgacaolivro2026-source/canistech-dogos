import React, { useState, useEffect } from 'react';
import { AuthUser, DogProfile, TrainingCertificateRecord } from '../types';
import {
  getUserGoldStatus,
  getGoldSlotsSummary,
  issueGoldPasswordAfterDonation,
  validateGoldPassword,
  leaveGoldClubAndReleaseSlot,
  getTrainingProgress,
  saveTrainingProgress,
  generateTrainingCertificateAuthCode,
  saveTrainingCertificate,
  getTrainingCertificate,
  MAX_GOLD_SLOTS,
} from '../services/goldAndPrivacyService';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  KeyRound,
  Copy,
  LogOut,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Heart,
  QrCode,
  Sparkles,
  HelpCircle,
  Volume2,
  Clock,
  Eye,
  Check,
  Flame,
  ArrowRight,
  Compass,
  Printer,
  X,
  Download,
} from 'lucide-react';

export interface DogTrainingGuideViewProps {
  currentUser?: AuthUser | null;
  activeDog?: DogProfile | null;
  dogs?: DogProfile[];
  onOpenVetChat?: (initialQuery?: string) => void;
  onNavigateToDashboard?: () => void;
}

interface TrainingModule {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  badge: string;
  estimatedTime: string;
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  imageUrl: string;
  whatToTeach: string;
  stepByStep: string[];
  learningSigns: string[];
  proTip: string;
}

const TRAINING_MODULES: TrainingModule[] = [
  {
    id: 'step-1',
    stepNumber: 1,
    title: 'Atenção Pelo Nome e Marcador Positivo ("Sim!")',
    subtitle: 'O alicerce de toda a comunicação: foco imediato e previsibilidade de recompensa.',
    badge: 'Fundação Crítica',
    estimatedTime: '3 a 5 dias (sessões de 3 minutos, 3x ao dia)',
    difficulty: 'Iniciante',
    imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=720&q=80',
    whatToTeach:
      'Ensinar o cão que seu nome não é uma bronca, mas um convite de conexão de altíssimo valor. Paralelamente, carregar o marcador verbal positivo ("Sim!") para sinalizar o exato milissegundo em que ele acertou.',
    stepByStep: [
      '1. Carregando o Marcador: Em local calmo e sem distrações, diga "Sim!" em tom animado e entregue um pedacinho de petisco de alto valor imediatamente (em menos de 1 segundo). Repita 15 vezes seguidas sem pedir nada.',
      '2. Foco pelo Nome: Espere o cão olhar para outro lado. Diga o nome dele apenas UMA vez em tom amigável. No exato instante em que ele virar a cabeça e fizer contato visual, diga "Sim!" e premie.',
      '3. Distância Gradual: Dê um passo para o lado antes de chamar pelo nome. Quando ele virar os olhos em sua direção, marque com "Sim!" e entregue a recompensa na sua altura.',
      '4. Generalização: Pratique em diferentes cômodos da casa antes de tentar no quintal ou na rua.',
    ],
    learningSigns: [
      'Orelhas se erguem imediatamente ao ouvir o nome.',
      'Rotação veloz da cabeça e olhar fixo nos seus olhos em menos de 1 segundo.',
      'Expressão corporal receptiva com rabo abanando relaxado aguardando o marcador.',
    ],
    proTip:
      'NUNCA use o nome do cão para dar bronca ou punir. Se você associar o nome a sentimentos negativos, ele aprenderá a ignorar o chamado por autopreservação.',
  },
  {
    id: 'step-2',
    stepNumber: 2,
    title: 'Comando "Senta" (Técnica do Luring Natural)',
    subtitle: 'Ensinando a sentar voluntariamente sem empurrar a garupa do cão.',
    badge: 'Controle de Impulso',
    estimatedTime: '2 a 4 dias para fixação; 1 semana para generalizar',
    difficulty: 'Iniciante',
    imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=720&q=80',
    whatToTeach:
      'Fazer o cão apoiar a garupa no chão usando a mecânica natural do corpo através do luring (guiamento por petisco), sem nenhuma força física.',
    stepByStep: [
      '1. Isca Olfativa: Segure um petisco entre o polegar e o indicador e coloque rente à ponta do focinho do cão (não deixe ele morder ainda).',
      '2. Arco Ascendente: Mova lentamente a mão sobre a cabeça do cão, em direção à nuca dele. Para acompanhar o petisco com os olhos, ele levantará o focinho e a garupa descerá naturalmente.',
      '3. Marcador no Chão: No instante milimétrico em que a garupa tocar o solo, dispare o marcador verbal "Sim!" e abra os dedos entregando a recompensa.',
      '4. Introduzindo a Palavra: Após 15 repetições fluidas com a mão vazia fazendo o mesmo gesto, comece a dizer "Senta" 1 segundo ANTES de fazer o movimento da mão.',
    ],
    learningSigns: [
      'Senta imediatamente ao ver o sinal de mão fechada subindo suavemente.',
      'Não salta sobre a sua mão; compreende que sentar faz o petisco se abrir.',
      'Permanece sentado por alguns segundos esperando o petisco chegar até a boca.',
    ],
    proTip:
      'Jamais empurre o quadril do cão para baixo com as mãos. Cães possuem o chamado "reflexo de oposição" — se você empurrar, ele resistirá empurrando para cima.',
  },
  {
    id: 'step-3',
    stepNumber: 3,
    title: 'Comando "Deita" (Down com Relaxamento Muscular)',
    subtitle: 'Postura de submissão voluntária e autorregulação emocional.',
    badge: 'Autocontrole',
    estimatedTime: '4 a 7 dias',
    difficulty: 'Iniciante',
    imageUrl: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=720&q=80',
    whatToTeach:
      'Transição estável da posição sentada para deitada, encostando o peito e cotovelos no chão sem levantar a garupa.',
    stepByStep: [
      '1. Partida do Senta: Peça ao cão para sentar. Com um petisco cheiroso fechado nos dedos, aproxime a mão do focinho dele.',
      '2. Vetor em "L": Desça a mão verticalmente em linha reta até o chão, entre as duas patas dianteiras dele. Quando o focinho seguir a mão até o chão, deslize a mão lentamente para a frente.',
      '3. O Toque dos Cotovelos: O cão esticará o corpo para seguir o cheiro e os cotovelos tocarão o solo. Diga "Sim!" no mesmo instante e premie com a mão rente ao piso.',
      '4. Desmame da Isca: Comece a fazer o gesto apontando o dedo indicador para o chão com a mão vazia. Diga "Deita", aponte, marque o acerto e premie com a outra mão.',
    ],
    learningSigns: [
      'Desce o tronco com fluidez sem ficar em pé no meio do caminho.',
      'Apoia o peito e relaxa a musculatura das patas traseiras lateralmente.',
      'Mantém a posição mesmo quando você fica ereto em pé.',
    ],
    proTip:
      'Se o cão levantar a bunda ao tentar descer, você está deslizando a mão para a frente rápido demais. Desça primeiro na vertical até o solo e só então puxe alguns centímetros para frente.',
  },
  {
    id: 'step-4',
    stepNumber: 4,
    title: 'Comando "Fica" (Os Três Pilares: Duração, Distância e Distração)',
    subtitle: 'A regra de ouro da paciência: ensine um pilar de cada vez.',
    badge: 'Segurança Residencial',
    estimatedTime: '1 a 2 semanas (para 30s de duração com 5 passos)',
    difficulty: 'Intermediário',
    imageUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=720&q=80',
    whatToTeach:
      'Permanecer na posição indicada até que o tutor emita a palavra de liberação oficial (ex: "Livre!" ou "Ok!"). O cão aprende que sair antes da liberação cancela a recompensa.',
    stepByStep: [
      '1. Pilar 1 — Duração: Peça para sentar. Mostre a palma da mão espalmada como sinal de "pare", diga "Fica" e conte mentalmente 3 segundos com você parado colado nele. Diga "Sim!", premie e depois diga "Livre!" liberando-o.',
      '2. Pilar 2 — Distância: Aumente o desafio dando 1 único passo para trás. Volte imediatamente para a frente dele, diga "Sim!", premie no lugar e libere com "Livre!".',
      '3. Aumentando o Alcance: Vá progressivamente para 2 passos, 3 passos e 5 passos de distância, sempre RETORNANDO até ele para premiar (nunca premie de longe).',
      '4. Pilar 3 — Distração Leve: Bata palmas de leve, pule ou balance um brinquedo suavemente. Se ele mantiver a pose, premie com um Jackpot (3 petiscos seguidos).',
    ],
    learningSigns: [
      'Não se projeta para frente ao ver você dar passos para trás.',
      'Espera você voltar até ele para receber a recompensa.',
      'Aguarda o sinal sonoro de liberação ("Livre!") para se mover e levantar.',
    ],
    proTip:
      'Nunca treine Duração, Distância e Distração ao mesmo tempo. Se você for aumentar a distância (dar 5 passos), diminua o tempo de permanência para apenas 2 segundos. Conquiste um pilar por vez.',
  },
  {
    id: 'step-5',
    stepNumber: 5,
    title: 'Chamada de Emergência "Aqui / Vem" (Recall Seguro)',
    subtitle: 'O comando que salva a vida do cão em situações de perigo iminente.',
    badge: 'Salva-Vidas',
    estimatedTime: '2 a 3 semanas de repetição diária com petiscos nobres',
    difficulty: 'Intermediário',
    imageUrl: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&w=720&q=80',
    whatToTeach:
      'Voltar correndo em velocidade máxima em direção ao tutor, abandonando qualquer estímulo ou distração no caminho, e permitir que o tutor segure sua coleira.',
    stepByStep: [
      '1. O Efeito Ímã: Em um corredor fechado, mostre um petisco de cheiro forte (frango cozido ou queijo). Afaste-se correndo de costas batendo palmas e diga "Aqui!" em tom alegre e festivo.',
      '2. Acelerando a Chegada: Quando ele correr até você, segure com calma a coleira com uma mão e entregue o petisco com a outra. Segurar a coleira previne que o cão pegue a comida e fuja em disparada.',
      '3. O Jogo do Esconde-Esconde: Em casa, peça para outra pessoa segurar o cão gentilmente. Esconda-se atrás de uma porta ou sofá e chame "Thor, Aqui!". Quando ele encontrar você, faça uma festa com 5 petiscos seguidos.',
      '4. Guia Longa no Parque: No quintal ou parque com guia longa de 10 metros, chame pelo nome + "Aqui!". Recompense com festa e libere-o imediatamente para continuar farejando.',
    ],
    learningSigns: [
      'Gira o corpo em 180° e corre vigorosamente em sua direção ao ouvir "Aqui!".',
      'Permite que você segure suavemente a coleira sem tentar se esquivar.',
      'Associa o chamado a uma experiência festiva e prazerosa.',
    ],
    proTip:
      'NUNCA chame o cão para cortar as unhas, dar banho, aplicar remédio ou dar bronca. Se você fizer isso, você "envenenará" o comando e ele nunca mais voltará quando estiver solto.',
  },
  {
    id: 'step-6',
    stepNumber: 6,
    title: 'Passeio Perfeito: Andar Junto Sem Puxar a Guia (Loose Leash)',
    subtitle: 'Transforme o passeio em uma caminhada harmoniosa com guia em formato de "U".',
    badge: 'Comportamento Urbano',
    estimatedTime: '2 a 4 semanas com consistência absoluta',
    difficulty: 'Avançado',
    imageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=720&q=80',
    whatToTeach:
      'O cão aprende que puxar a guia é o botão de freio do passeio. O único jeito de avançar e farejar é manter a guia frouxa e caminhar em sintonia com o ritmo do tutor.',
    stepByStep: [
      '1. Técnica da Árvore: Comece a caminhar. No exato instante em que a guia esticar 1 milímetro, pare imediatamente e congele seus pés como uma árvore. Não dê tranco, apenas congele.',
      '2. O Ponto de Alívio: Fique imóvel. O cão tentará puxar, perceberá que não avança e olhará para trás ou dará um passo recuando. No segundo em que a guia afrouxar, marque com "Sim!" e dê um passo à frente.',
      '3. Recompensa na Posição Ideal: Mantenha petiscos no bolso. Enquanto ele estiver caminhando ao seu lado com a guia frouxa, entregue petiscos continuamente na altura da sua coxa esquerda.',
      '4. Mudança de Direção Surpresa: Em locais abertos, se ele estiver acelerando, dê meia-volta de repente e caminhe no sentido oposto chamando-o com entusiasmo.',
    ],
    learningSigns: [
      'Assim que a guia estica, ele para voluntariamente ou olha para você.',
      'A guia fica sempre frouxa balançando suavemente como a letra "U".',
      'Olha frequentemente para o seu rosto durante a caminhada para verificar o ritmo.',
    ],
    proTip:
      'Nunca permita que o cão chegue ao poste ou arbusto puxando você. Se ele puxar e conseguir cheirar, o próprio ambiente terá recompensado o puxão, reforçando o vício.',
  },
  {
    id: 'step-7',
    stepNumber: 7,
    title: 'Comando de Proteção: "Deixa" & "Solta" (Drop It / Leave It)',
    subtitle: 'Segurança alimentar absoluta contra ossos perigosos, venenos e lixo.',
    badge: 'Segurança e Saúde',
    estimatedTime: '1 a 2 semanas',
    difficulty: 'Intermediário',
    imageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=720&q=80',
    whatToTeach:
      'O comando "Deixa" ensina a não tocar em nada que esteja no chão ou na mesa. O comando "Solta" ensina a cuspir voluntariamente o que já está dentro da boca.',
    stepByStep: [
      '1. Jogo das Duas Mãos: Coloque um petisco simples fechado no punho esquerdo e mostre ao cão. Ele cheirará e lamberá sua mão. Mantenha fechada e diga "Deixa" uma única vez.',
      '2. O Desengajamento: Quando ele cansar e afastar o focinho da mão fechada por 1 segundo, diga "Sim!" e premie abrindo a OUTRA mão (que tem um petisco melhor).',
      '3. Deixa no Chão: Coloque o petisco sob a sola do seu calçado no chão. Diga "Deixa". Quando ele parar de cutucar seu tênis e olhar para você, marque com "Sim!" e dê o prêmio da sua mão.',
      '4. O "Solta" com Brinquedos: Durante um cabo-de-guerra com brinquedo, fique com a mão mole sem puxar e coloque um pedaço de carne no focinho dele dizendo "Solta". Ele abrirá a boca para a carne; pegue o brinquedo com calma e recomece a brincadeira.',
    ],
    learningSigns: [
      'Desvia o olhar de comida no chão assim que escuta "Deixa".',
      'Abre a boca voluntariamente ao comando "Solta" sem rosnar ou tentar engolir rápido.',
      'Confia plenamente que abrir mão de um item sempre traz algo melhor.',
    ],
    proTip:
      'Nunca tente arrancar o objeto à força da boca do cão com violência. Isso gera "posse de recursos" e ensinará o cão a engolir o objeto perigoso às pressas ou morder para defender.',
  },
  {
    id: 'step-8',
    stepNumber: 8,
    title: 'Comando "No Seu Lugar / Cama" (Place com Relaxamento)',
    subtitle: 'A melhor ferramenta para visitas tranquilas e momentos de refeição em família.',
    badge: 'Harmonia Doméstica',
    estimatedTime: '2 a 3 semanas para permanência longa',
    difficulty: 'Avançado',
    imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=720&q=80',
    whatToTeach:
      'O cão se dirige até a sua cama ou colchonete sob comando e permanece deitado relaxado até ser liberado, tornando-se o refúgio seguro de descompressão dele.',
    stepByStep: [
      '1. Alvo Espacial: Escolha uma caminha ou tapete com bordas definidas. Jogue um petisco sobre a cama e diga "Lugar!". Quando as 4 patas pisarem na cama, marque "Sim!".',
      '2. Exigência do Deita: Rapidamente passe a pedir que ele deite sobre a cama assim que chegar. Entregue múltiplos petiscos seguidos (um a cada 3 segundos) direto na cama.',
      '3. Associação com Mastigação: Quando ele estiver deitado na caminha, entregue um brinquedo recheável congelado ou mordedor natural seguro. O cão associará o local a relaxamento profundo.',
      '4. Distância e Campainha: Pratique pedir "Lugar" enquanto você está no sofá. Posteriormente, adicione o som da campainha do celular em volume baixo como gatilho para ele correr para a caminha.',
    ],
    learningSigns: [
      'Corre com alegria direto para o tapete ao comando "Lugar!".',
      'Deita espontaneamente com cabeça apoiada e respiração lenta.',
      'Permanece no local mesmo enquanto pessoas circulam ou tocam a campainha.',
    ],
    proTip:
      'A caminha nunca deve ser usada como "castigo". Se ele for para a caminha sentindo que foi punido, o local perderá o poder de acalmar e gerará ansiedade de isolamento.',
  },
];

export const DogTrainingGuideView: React.FC<DogTrainingGuideViewProps> = ({
  currentUser,
  activeDog,
  dogs = [],
  onOpenVetChat,
  onNavigateToDashboard,
}) => {
  const [goldStatus, setGoldStatus] = useState(() => getUserGoldStatus(currentUser?.email));
  const [goldSummary, setGoldSummary] = useState(() => getGoldSlotsSummary());
  const [donationAmount, setDonationAmount] = useState<number>(25);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [inputPassword, setInputPassword] = useState<string>('');
  const [copiedPassword, setCopiedPassword] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [expandedStepId, setExpandedStepId] = useState<string | null>('step-1');
  const [completedSteps, setCompletedSteps] = useState<string[]>(() =>
    currentUser?.email ? getTrainingProgress(currentUser.email) : []
  );
  const [activeTab, setActiveTab] = useState<'trilha' | 'postura' | 'erros'>('trilha');

  // Estado do Certificado de Conclusão Cinófila
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [currentCertificate, setCurrentCertificate] = useState<TrainingCertificateRecord | null>(null);
  const [copiedAuthCode, setCopiedAuthCode] = useState<boolean>(false);

  // Atualiza status sempre que o usuário alternar ou efetuar uma ação
  useEffect(() => {
    setGoldStatus(getUserGoldStatus(currentUser?.email));
    setGoldSummary(getGoldSlotsSummary());
    if (currentUser?.email) {
      setCompletedSteps(getTrainingProgress(currentUser.email));
    }
  }, [currentUser]);

  const handleOpenCertificate = () => {
    if (!currentUser?.email) {
      showToast('Faça login primeiro para emitir e autenticar seu certificado.');
      return;
    }
    const dogId = activeDog?.id || 'pet-padrao';
    let cert = getTrainingCertificate(currentUser.email, dogId);
    if (!cert) {
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      cert = {
        authCode: generateTrainingCertificateAuthCode(),
        dogId,
        dogName: activeDog?.name || 'Canino em Treinamento',
        dogBreed: activeDog?.breed || 'Sem Raça Definida (SRD)',
        dogPhotoUrl: activeDog?.photoUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80',
        tutorName: currentUser.name || 'Tutor Responsável',
        tutorEmail: currentUser.email,
        issuedAt: dateStr,
        responsibilityAccepted: true,
        completedModulesCount: completedSteps.length,
      };
      saveTrainingCertificate(cert);
    }
    setCurrentCertificate(cert);
    setShowCertificateModal(true);
  };

  const handleCopyAuthCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedAuthCode(true);
    showToast('Código de autenticação do certificado copiado!');
    setTimeout(() => setCopiedAuthCode(false), 2500);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleCopyPassword = (pwd: string) => {
    navigator.clipboard.writeText(pwd);
    setCopiedPassword(true);
    showToast('Senha Gold copiada para a área de transferência!');
    setTimeout(() => setCopiedPassword(false), 2500);
  };

  const handleGeneratePassword = () => {
    if (!currentUser?.email) {
      showToast('Faça login primeiro para emitir sua Senha Gold.');
      return;
    }
    if (donationAmount < 1) {
      showToast('Por favor, defina um valor de apoio a partir de R$ 1,00.');
      return;
    }

    try {
      const result = issueGoldPasswordAfterDonation(
        currentUser.email,
        currentUser.name,
        donationAmount
      );
      const pwd = typeof result === 'string' ? result : (result.accessPassword || '');
      setGeneratedPassword(pwd);
      setInputPassword(pwd);
      setGoldStatus(getUserGoldStatus(currentUser.email));
      setGoldSummary(getGoldSlotsSummary());
      showToast('Apoio registrado! Sua Senha Exclusiva Gold foi gerada com sucesso.');
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'Erro ao gerar senha.');
    }
  };

  const handleUnlockWithPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.email) {
      showToast('Faça login para acessar.');
      return;
    }
    if (!inputPassword.trim()) {
      showToast('Digite sua Senha de Acesso Gold.');
      return;
    }

    const ok = validateGoldPassword(currentUser.email, inputPassword);
    if (ok) {
      setGoldStatus(getUserGoldStatus(currentUser.email));
      setGoldSummary(getGoldSlotsSummary());
      showToast('🎉 Acesso Gold desbloqueado com sucesso por 90 dias!');
    } else {
      showToast('Senha inválida, incorreta ou período de 90 dias expirado.');
    }
  };

  const handleLeaveGoldClub = () => {
    if (!currentUser?.email) return;

    const confirmed = window.confirm(
      'Tem certeza de que deseja sair da Página Gold?\n\nSua vaga será imediatamente liberada para outro tutor no limite de 200 membros e sua senha atual será cancelada.'
    );

    if (confirmed) {
      leaveGoldClubAndReleaseSlot(currentUser.email);
      setGoldStatus(getUserGoldStatus(currentUser.email));
      setGoldSummary(getGoldSlotsSummary());
      setGeneratedPassword(null);
      setInputPassword('');
      showToast('Você saiu da Página Gold. Vaga liberada com sucesso.');
    }
  };

  const toggleStepCompleted = (stepId: string) => {
    if (!currentUser?.email) return;
    const isCompleted = completedSteps.includes(stepId);
    let next: string[];
    if (isCompleted) {
      next = completedSteps.filter((id) => id !== stepId);
      showToast('Comando marcado como em treinamento.');
    } else {
      next = [...completedSteps, stepId];
      showToast('🎉 Parabéns! Mais um comando dominado pelo seu cão!');
    }
    setCompletedSteps(next);
    saveTrainingProgress(currentUser.email, next);
  };

  const isUnlocked = goldStatus.isUnlocked || goldStatus.isSeniorBypass;

  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-6 space-y-6 font-sans">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CAMADA A: PORTÃO EXCLUSIVO GOLD (SE NÃO ESTIVER DESTRAVADO COM SENHA)    */}
      {/* ========================================================================= */}
      {!isUnlocked ? (
        <div className="space-y-6">
          {/* Header do Portão */}
          <div className="bg-gradient-to-r from-slate-900 via-amber-950/80 to-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-amber-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Área Especializada Gold • 200 Vagas</span>
                </span>
                <span className="text-xs font-mono text-slate-300">
                  Validade Contínua: 3 Meses (90 Dias)
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-heading tracking-tight text-white leading-tight">
                Página Gold de Adestramento Canino Passo a Passo
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Do zero ao avançado: comandos fundamentais, postura do dono, modulação vocal, tempo de resposta e correção de vícios comportamentais com base em reforço positivo ético.
              </p>
            </div>

            {/* Telemetria de Lotação em Tempo Real */}
            <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Lotação Geral
                </span>
                <span className="text-lg font-bold font-mono text-amber-400">
                  {goldSummary.activeCount} / {MAX_GOLD_SLOTS}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">membros ativos no momento</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Vagas Livres Agora
                </span>
                <span className={`text-lg font-bold font-mono ${goldSummary.remainingSlots > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {goldSummary.remainingSlots > 0 ? `${goldSummary.remainingSlots} vagas restantes` : 'Lotação Esgotada'}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">sistema rotativo com fila justa</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Duração da Vaga
                </span>
                <span className="text-lg font-bold font-mono text-white">
                  90 Dias
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">liberação voluntária em 1 clique</span>
              </div>
            </div>
          </div>

          {/* Card Central com os 2 Passos de Acesso */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Coluna Esquerda: Explicação das Regras e Passo 1 (Doação Espontânea) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                  Como Funciona o Acesso
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-heading mt-0.5">
                  Regras Claras e Apoio Espontâneo
                </h3>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold shrink-0">
                    1
                  </div>
                  <p>
                    Para manter esta página especializada sempre no ar e com curadoria canina atualizada, o acesso é concedido mediante um <strong>apoio financeiro voluntário com o valor que você considerar justo</strong>.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold shrink-0">
                    2
                  </div>
                  <p>
                    Assim que você confirma seu apoio, nossa plataforma gera instantaneamente sua <strong>Senha Exclusiva de Acesso Gold</strong> (ex: <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono text-[11px]">GOLD-XXXXXX</code>).
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold shrink-0">
                    3
                  </div>
                  <p>
                    Seu acesso tem validade contínua de <strong>3 meses (90 dias)</strong>. Durante esse período, você pode acessar e revisar todos os 8 módulos quantas vezes quiser.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold shrink-0">
                    4
                  </div>
                  <p>
                    Quando seu cão já tiver dominado os comandos ou caso queira sair antes, você pode <strong>sair quando quiser com 1 clique</strong>, liberando imediatamente sua vaga para outro tutor da comunidade.
                  </p>
                </div>
              </div>

              {/* Formulário de Escolha do Valor Espontâneo */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Passo 1: Digite o valor espontâneo que considera justo (R$)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Sua contribuição apoia os servidores, o desenvolvimento técnico e o banco de dados cinófilo.
                  </p>
                </div>

                {/* Botões Rápidos */}
                <div className="grid grid-cols-4 gap-2">
                  {[10, 25, 50, 100].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDonationAmount(val)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        donationAmount === val
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      R$ {val}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-500">R$</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                    placeholder="Outro valor..."
                  />
                </div>

                {/* Chave PIX Institucional */}
                <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <QrCode className="w-5 h-5 text-amber-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block">
                        Chave PIX Oficial CanisTech:
                      </span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 text-xs font-semibold truncate block">
                        apoio.gold@canistech.com.br
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('apoio.gold@canistech.com.br');
                      showToast('Chave PIX copiada com sucesso!');
                    }}
                    className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-colors shrink-0"
                  >
                    Copiar PIX
                  </button>
                </div>

                <button
                  type="button"
                  disabled={goldSummary.remainingSlots <= 0}
                  onClick={handleGeneratePassword}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                    goldSummary.remainingSlots > 0
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                      : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>
                    {goldSummary.remainingSlots > 0
                      ? 'Confirmar Apoio e Gerar Minha Senha Gold'
                      : 'Vagas Esgotadas no Momento (Aguarde Liberação)'}
                  </span>
                </button>
              </div>
            </div>

            {/* Coluna Direita: Passo 2 (Exibição e Validação da Senha) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Box da Senha Gerada */}
              {generatedPassword && (
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3 animate-in zoom-in-95">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-900 bg-amber-400/80 px-2 py-0.5 rounded-full">
                      Sua Senha Pessoal Emitida
                    </span>
                    <span className="text-xs font-bold">Válida por 90 Dias</span>
                  </div>

                  <div className="p-3 bg-slate-950 text-white rounded-2xl font-mono text-center text-lg sm:text-xl font-bold tracking-widest border border-slate-800 flex items-center justify-between px-4">
                    <span>{generatedPassword}</span>
                    <button
                      onClick={() => handleCopyPassword(generatedPassword)}
                      className="text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1 font-sans cursor-pointer"
                    >
                      {copiedPassword ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-900 font-medium leading-snug">
                    Guarde sua senha com segurança. Ela foi vinculada ao seu e-mail ({currentUser?.email}) e concede acesso ilimitado à Página Gold por 3 meses.
                  </p>
                </div>
              )}

              {/* Caixa de Entrada e Desbloqueio */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                    Passo 2
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Digite sua Senha de Acesso Gold
                  </h3>
                  <p className="text-xs text-slate-500">
                    Já tem uma senha emitida nos últimos 90 dias? Digite-a abaixo para liberar a área de treino.
                  </p>
                </div>

                <form onSubmit={handleUnlockWithPassword} className="space-y-3">
                  <div>
                    <input
                      type="text"
                      required
                      value={inputPassword}
                      onChange={(e) => setInputPassword(e.target.value.toUpperCase())}
                      placeholder="Ex: GOLD-A7B2X9"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Entrar na Página Gold (Válido por 90 Dias)</span>
                  </button>
                </form>

                {goldStatus.record && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Status da sua conta:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-mono">
                        {goldStatus.isActive ? 'Registro Ativo' : 'Sem Vaga Ativa'}
                      </strong>
                    </div>
                    {goldStatus.daysRemaining > 0 && (
                      <div className="flex justify-between">
                        <span>Tempo restante:</span>
                        <strong className="text-amber-600 dark:text-amber-400 font-mono">
                          {goldStatus.daysRemaining} dias
                        </strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* CAMADA B: CONTEÚDO COMPLETO DE ADESTRAMENTO DO ZERO AO AVANÇADO          */
        /* ========================================================================= */
        <div className="space-y-6 animate-in fade-in">
          {/* Barra de Status Gold no Topo */}
          <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 rounded-2xl px-5 py-3.5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-slate-950 text-amber-400 flex items-center justify-center font-bold text-sm shadow-xs">
                ⭐
              </span>
              <div>
                <span className="font-bold text-sm block leading-tight">
                  Acesso Gold Ativo • Restam {goldStatus.daysRemaining} dias
                </span>
                <span className="text-[11px] text-slate-800 font-medium">
                  {goldStatus.isSeniorBypass
                    ? 'Bypass Administrativo Sênior Ativo (Não consome vaga pública)'
                    : `Expira em ${new Date(goldStatus.record?.expiresAt || Date.now()).toLocaleDateString('pt-BR')} • Lotação: ${goldSummary.activeCount}/200`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenVetChat?.('Gostaria de tirar uma dúvida sobre adestramento canino')}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Dúvida com IA 24h
              </button>
              {!goldStatus.isSeniorBypass && (
                <button
                  type="button"
                  onClick={handleLeaveGoldClub}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Libera sua vaga de imediato para outro tutor"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair da Página Gold e Liberar Vaga</span>
                </button>
              )}
            </div>
          </div>

          {/* Sub-navegação do Guia */}
          <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar pb-1 text-xs">
            <button
              onClick={() => setActiveTab('trilha')}
              className={`px-4 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'trilha'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Trilha dos 8 Comandos Fundamentais</span>
              <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full font-bold">
                {completedSteps.length}/8
              </span>
            </button>

            <button
              onClick={() => setActiveTab('postura')}
              className={`px-4 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'postura'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>A Postura do Dono (Linguagem, Tom & Timing)</span>
            </button>

            <button
              onClick={() => setActiveTab('erros')}
              className={`px-4 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'erros'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Erros Fatais & O Que NÃO Fazer</span>
            </button>
          </div>

          {/* TAB 1: TRILHA DOS 8 COMANDOS */}
          {activeTab === 'trilha' && (
            <div className="space-y-4">
              {/* Barra de Progresso do Cão */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Progresso de Treinamento do Pet
                  </h3>
                  <p className="text-slate-500">
                    Marque os comandos conforme seu cão for dominando a resposta imediata.
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-64">
                  <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${(completedSteps.length / TRAINING_MODULES.length) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {Math.round((completedSteps.length / TRAINING_MODULES.length) * 100)}%
                  </span>
                </div>
              </div>

              {/* Card de Homologação e Certificado Oficial */}
              {completedSteps.length === TRAINING_MODULES.length ? (
                <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-2xl p-5 border border-emerald-500/40 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                      <Award className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800">
                        8 DE 8 COMANDOS DOMINADOS • CRITÉRIO OFICIAL DE HOMOLOGAÇÃO
                      </span>
                      <h4 className="text-base font-black font-heading mt-0.5">
                        Certificado Oficial Disponível para {activeDog?.name || 'seu Cão'}!
                      </h4>
                      <p className="text-xs text-slate-300">
                        Protocolo cinófilo de reforço positivo concluído com êxito. Emita seu certificado com hash criptográfico auditável.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleOpenCertificate}
                    className="shrink-0 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>Visualizar / Emitir Certificado</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700/60 text-xs">
                  <span className="text-slate-600 dark:text-slate-300">
                    Faltam <strong>{TRAINING_MODULES.length - completedSteps.length} comando(s)</strong> para homologar o Certificado Oficial de Adestramento Canino.
                  </span>
                  <button
                    onClick={handleOpenCertificate}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                  >
                    Pré-visualizar Modelo do Certificado
                  </button>
                </div>
              )}

              {/* Lista dos 8 Módulos */}
              <div className="space-y-3">
                {TRAINING_MODULES.map((mod) => {
                  const isExpanded = expandedStepId === mod.id;
                  const isDone = completedSteps.includes(mod.id);

                  return (
                    <div
                      key={mod.id}
                      className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all ${
                        isDone
                          ? 'border-emerald-300 dark:border-emerald-800/60 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 shadow-sm'
                      }`}
                    >
                      {/* Accordion Header */}
                      <div
                        onClick={() => setExpandedStepId(isExpanded ? null : mod.id)}
                        className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStepCompleted(mod.id);
                            }}
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs transition-colors shrink-0 ${
                              isDone
                                ? 'bg-emerald-500 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 border border-slate-200 dark:border-slate-700'
                            }`}
                            title={isDone ? 'Comando dominado (clique para desmarcar)' : 'Marcar como dominado'}
                          >
                            {isDone ? <Check className="w-4 h-4" /> : mod.stepNumber}
                          </button>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.2 rounded-full border border-amber-200 dark:border-amber-800/50">
                                {mod.badge}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {mod.difficulty}
                              </span>
                              {isDone && (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                  ✓ Dominado
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate mt-0.5">
                              {mod.stepNumber}. {mod.title}
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-slate-400 shrink-0">
                          <span className="hidden md:inline text-xs text-slate-500 font-mono">
                            {mod.estimatedTime}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>

                      {/* Accordion Body */}
                      {isExpanded && (
                        <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800 space-y-5 animate-in fade-in">
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                            {/* Imagem Ilustrativa com Fallback Seguro */}
                            <div className="lg:col-span-4 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-750 bg-slate-100 dark:bg-slate-800">
                              <img
                                src={mod.imageUrl}
                                alt={mod.title}
                                onError={(e) => {
                                  // Fallback robusto se a foto não carregar
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=600&q=80';
                                }}
                                className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                              />
                              <div className="p-3 bg-slate-50 dark:bg-slate-850 text-[11px] text-slate-500 space-y-1">
                                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Tempo de Aprendizado:</span>
                                </div>
                                <p>{mod.estimatedTime}</p>
                              </div>
                            </div>

                            {/* Conteúdo Detalhado Passo a Passo */}
                            <div className="lg:col-span-8 space-y-4 text-xs">
                              <div className="space-y-1">
                                <h5 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-amber-600 dark:text-amber-400">
                                  Objetivo do Treinamento:
                                </h5>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                  {mod.whatToTeach}
                                </p>
                              </div>

                              <div className="space-y-2">
                                <h5 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                                  Como Ensinar Passo a Passo:
                                </h5>
                                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                                  {mod.stepByStep.map((step, idx) => (
                                    <p key={idx} className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                      {step}
                                    </p>
                                  ))}
                                </div>
                              </div>

                              {/* Sinais de que está aprendendo */}
                              <div className="space-y-1.5">
                                <h5 className="font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider text-[11px] flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Sinais de Que o Cão Está Aprendendo:</span>
                                </h5>
                                <ul className="space-y-1 list-disc list-inside text-slate-600 dark:text-slate-400">
                                  {mod.learningSigns.map((sign, idx) => (
                                    <li key={idx}>{sign}</li>
                                  ))}
                                </ul>
                              </div>

                              {/* Dica de Ouro ProTip */}
                              <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 rounded-xl border border-amber-200/80 dark:border-amber-800/50 text-slate-800 dark:text-amber-200 leading-relaxed flex items-start gap-2">
                                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <p>
                                  <strong>Dica Pro de Treinador:</strong> {mod.proTip}
                                </p>
                              </div>

                              <div className="pt-2 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => toggleStepCompleted(mod.id)}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                    isDone
                                      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                                      : 'bg-slate-900 text-white hover:bg-amber-500 hover:text-slate-950 dark:bg-white dark:text-slate-900'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{isDone ? 'Desmarcar Comando' : 'Marcar Este Comando Como Dominado'}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: POSTURA DO DONO */}
          {activeTab === 'postura' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                  Comunicação Interespécies
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-heading mt-0.5">
                  A Postura do Dono: Linguagem Corporal, Tom de Voz e Timing
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  80% do sucesso no adestramento não depende do cão, mas da clareza e previsibilidade com que o humano se comunica.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                {/* Pilar 1: Linguagem Corporal */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Compass className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    1. Linguagem Corporal Calma e Firme
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Cães leem microposturas antes de processar qualquer palavra. Mantenha os ombros relaxados e postura ereta.
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    <strong>Evite inclinar o tronco sobre o cão:</strong> debruçar-se para a frente é percebido pelos canídeos como um gesto de ameaça ou intimidação, gerando recuo ou excitação defensiva.
                  </p>
                </div>

                {/* Pilar 2: Modulação do Tom de Voz */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    2. Modulação do Tom de Voz
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Cada tom dispara um estado emocional neurobiológico diferente no cão:
                  </p>
                  <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                    <li>
                      <strong>Comando de Execução ("Senta", "Fica"):</strong> Tom neutro, firme e calmo, sem gritar.
                    </li>
                    <li>
                      <strong>Chamada de Retorno ("Aqui!"):</strong> Tom agudo, festivo e caloroso (estimula aproximação).
                    </li>
                    <li>
                      <strong>Marcador ("Sim!"):</strong> Curto, pontual e enérgico como um clique.
                    </li>
                  </ul>
                </div>

                {/* Pilar 3: A Regra dos 2 Segundos */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    3. A Regra de Ouro dos 2 Segundos (Timing)
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    O cérebro canino associa a recompensa ao comportamento que ele estava executando exatamente <strong>1.3 a 2.0 segundos antes</strong>.
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    Se você demorar 5 segundos para pegar o petisco da mochila depois que ele sentou, ele já terá levantado ou abanado o rabo, e você estará premiando o levantar, não o sentar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ERROS FATAIS & O QUE NÃO FAZER */}
          {activeTab === 'erros' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 tracking-wider">
                  Prevenção de Vícios
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-heading mt-0.5">
                  Os 5 Erros Fatais no Adestramento (E Por Que Devem Ser Evitados)
                </h3>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="p-4 rounded-2xl bg-red-50/70 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/40 space-y-1.5">
                  <h4 className="font-bold text-red-900 dark:text-red-300 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Erro 1: Repetir o comando várias vezes ("Senta, senta, senta!")</span>
                  </h4>
                  <p className="text-red-950/80 dark:text-red-200 leading-relaxed">
                    <strong>Por que é fatal:</strong> Cães não entendem repetição como insistência. Ao repetir várias vezes, você ensina o cão que o comando verdadeiro é a palavra dita três vezes, ou pior: que ele tem total permissão para ignorar as duas primeiras.
                  </p>
                  <p className="text-red-900 dark:text-red-300 font-semibold text-[11px]">
                    Solução: Diga a palavra apenas UMA vez. Se ele não obedecer, espere 5 segundos, reposicione o corpo e faça o gesto do luring novamente.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-red-50/70 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/40 space-y-1.5">
                  <h4 className="font-bold text-red-900 dark:text-red-300 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Erro 2: Chamar o cão para dar bronca ou punir</span>
                  </h4>
                  <p className="text-red-950/80 dark:text-red-200 leading-relaxed">
                    <strong>Por que é fatal:</strong> O cão nunca associa a bronca ao chinelo roído há 20 minutos. Ele associará a bronca ao ato de ter vindo até você quando você chamou. Resultado: na próxima vez que fugir na rua, ele fugirá para mais longe com medo de você.
                  </p>
                  <p className="text-red-900 dark:text-red-300 font-semibold text-[11px]">
                    Solução: Ir até você deve ser SEMPRE a melhor coisa que acontece na vida do cão.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-red-50/70 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/40 space-y-1.5">
                  <h4 className="font-bold text-red-900 dark:text-red-300 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Erro 3: Sessões de treino longas e exaustivas (mais de 10 minutos)</span>
                  </h4>
                  <p className="text-red-950/80 dark:text-red-200 leading-relaxed">
                    <strong>Por que é fatal:</strong> O cérebro canino processa novidades com alta queima de glicose mental. Sessões com mais de 5 a 10 minutos geram saturação cognitiva, frustração e desinteresse pelo aprendizado.
                  </p>
                  <p className="text-red-900 dark:text-red-300 font-semibold text-[11px]">
                    Solução: Treine de 3 a 5 minutos por sessão, 2 a 3 vezes por dia, sempre terminando no auge do sucesso com uma grande comemoração.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-red-50/70 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/40 space-y-1.5">
                  <h4 className="font-bold text-red-900 dark:text-red-300 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Erro 4: Treinar em local barulhento ou com distrações logo no início</span>
                  </h4>
                  <p className="text-red-950/80 dark:text-red-200 leading-relaxed">
                    <strong>Por que é fatal:</strong> Cobrar que um cão que aprendeu o "senta" na sala ontem obedeça na calçada com outros cães passando é pedir para ele falhar. O estresse de falhar repetidas vezes corrompe a confiança dele no treinamento.
                  </p>
                  <p className="text-red-900 dark:text-red-300 font-semibold text-[11px]">
                    Solução: Sala de estar silenciosa → Cozinha → Quintal sem ninguém → Calçada vazia → Parque movimentado.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Certificado Oficial de Adestramento CanisTech */}
      {showCertificateModal && currentCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-amber-300 dark:border-amber-700/60 shadow-2xl overflow-hidden my-8">
            {/* Print style overrides */}
            <style>{`
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #canistech-printable-cert, #canistech-printable-cert * {
                  visibility: visible !important;
                }
                #canistech-printable-cert {
                  position: fixed !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  margin: 0 !important;
                  padding: 28px !important;
                  background: white !important;
                  color: #0f172a !important;
                  border: 6px double #d97706 !important;
                  box-shadow: none !important;
                }
              }
            `}</style>

            {/* Top Toolbar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                  CanisTech • Certificação Cinófila Oficial
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintCertificate}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 text-slate-200 transition-colors cursor-pointer"
                  title="Imprimir ou Salvar como PDF"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>Imprimir / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCertificateModal(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Certificate Area */}
            <div
              id="canistech-printable-cert"
              className="p-6 sm:p-10 space-y-6 text-slate-900 dark:text-slate-100 bg-radial from-amber-50/40 via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-8 border-double border-amber-400/50 m-4 rounded-2xl relative"
            >
              {/* Seal Icon Background */}
              <div className="absolute top-4 right-4 text-amber-500/20 dark:text-amber-500/10 pointer-events-none">
                <Award className="w-28 h-28" />
              </div>

              {/* Certificate Header */}
              <div className="text-center space-y-2 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold uppercase tracking-widest border border-amber-300 dark:border-amber-700/60">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Registro de Habilitação & Conduta Canina
                </div>
                <h2 className="text-2xl sm:text-3xl font-black font-heading text-slate-950 dark:text-white tracking-tight uppercase">
                  Certificado de Aptidão em Adestramento
                </h2>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  CanisTech Digital Systems • Instituto de Etologia & Comportamento Positivo
                </p>
              </div>

              {/* Certificate Body & Pet Details */}
              <div className="space-y-4 text-center max-w-xl mx-auto relative z-10 pt-2">
                <div className="flex items-center justify-center gap-3">
                  <img
                    src={currentCertificate.dogPhotoUrl}
                    alt={currentCertificate.dogName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 shadow-sm"
                  />
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-slate-950 dark:text-white leading-tight">
                      {currentCertificate.dogName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {currentCertificate.dogBreed}
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  Certificamos formalmente que o canino{' '}
                  <strong className="text-slate-950 dark:text-white text-base underline decoration-amber-400 decoration-2">
                    {currentCertificate.dogName}
                  </strong>
                  , sob a condução e tutela responsável de{' '}
                  <strong className="text-slate-950 dark:text-white">{currentCertificate.tutorName}</strong> (
                  <span className="font-mono text-xs">{currentCertificate.tutorEmail}</span>), concluiu com pleno aproveitamento e
                  reforço positivo os <strong>8 Módulos Fundamentais de Adestramento e Conduta Canina</strong>.
                </p>
              </div>

              {/* Modules Completed Matrix */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/70 relative z-10">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-2 tracking-wider">
                  Grade Curricular Homologada (Reforço 100% Positivo — Sem Métodos Aversivos):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {TRAINING_MODULES.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate font-medium">{m.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Credentials & Crypto Hash */}
              <div className="pt-4 border-t border-dashed border-amber-300 dark:border-amber-800/70 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Hash Criptográfico de Autenticação Canina:
                  </span>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                      {currentCertificate.authCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyAuthCode(currentCertificate.authCode)}
                      className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                      title="Copiar Hash"
                    >
                      {copiedAuthCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Emitido em: <strong>{currentCertificate.issuedAt}</strong> • Homologação Nacional CanisTech
                  </span>
                </div>

                <div className="text-center sm:text-right space-y-1">
                  <div className="w-36 h-0.5 bg-slate-300 dark:bg-slate-700 mx-auto sm:ml-auto"></div>
                  <span className="text-[11px] font-bold block text-slate-800 dark:text-slate-200">
                    Comitê de Cinofilia & Biometria
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    CanisTech Digital Systems
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Certificado registrado e vinculado à conta do tutor.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintCertificate}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Salvar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCertificateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
