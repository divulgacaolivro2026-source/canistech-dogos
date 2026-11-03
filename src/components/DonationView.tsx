import React, { useState } from 'react';
import {
  Heart,
  QrCode,
  Copy,
  CheckCircle2,
  ShieldCheck,
  Award,
  Sparkles,
  Users,
  Server,
  Stethoscope,
  ExternalLink,
  CreditCard,
  Building,
  HelpCircle,
  FileCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { DonationRecord } from '../types';

interface DonationViewProps {
  onNavigateToAdoption?: () => void;
  onOpenVetChat?: (query?: string) => void;
}

const INITIAL_DONORS: DonationRecord[] = [
  {
    id: 'don-1',
    donorName: 'Mariana & Rafael Silveira',
    dogHonored: 'Thor (Golden Retriever)',
    amount: 150,
    date: 'Hoje, às 14:22',
    message: 'A CanisTech salvou o Thor quando ele quase ingeriu chocolate. Essa plataforma merece continuar 100% gratuita!',
    isMonthly: true,
    tier: 'diamante',
  },
  {
    id: 'don-2',
    donorName: 'Dra. Carolina Mendes (CRMV-SP)',
    dogHonored: 'Maya & Pipoca',
    amount: 100,
    date: 'Ontem',
    message: 'Como médica veterinária, apoio com orgulho a precisão clínica e o rigor preventivo deste projeto.',
    isMonthly: true,
    tier: 'ouro',
  },
  {
    id: 'don-3',
    donorName: 'Clube dos Amigos do Vira-Lata',
    dogHonored: 'Paçoca (Caramelo)',
    amount: 50,
    date: 'Há 2 dias',
    message: 'Para ajudar nos resgates de cães de rua e na feira de adoção responsável.',
    isMonthly: false,
    tier: 'prata',
  },
  {
    id: 'don-4',
    donorName: 'Eduardo G. Albuquerque',
    dogHonored: 'Zeus (Rottweiler)',
    amount: 80,
    date: 'Há 3 dias',
    message: 'Excelente trabalho na enciclopédia de raças e conscientização de calor.',
    isMonthly: false,
    tier: 'prata',
  },
  {
    id: 'don-5',
    donorName: 'Beatriz Vasconcelos',
    dogHonored: 'Amora (Shih Tzu)',
    amount: 30,
    date: 'Há 4 dias',
    message: 'Muito carinho por essa equipe. Todo mês estarei aqui apoiando.',
    isMonthly: true,
    tier: 'bronze',
  },
];

const PRESET_AMOUNTS = [
  { value: 15, label: 'R$ 15', desc: 'Alimenta 1 cão resgatado por 3 dias' },
  { value: 30, label: 'R$ 30', desc: '1 Dose de vacina V10 para abrigo parceiro' },
  { value: 50, label: 'R$ 50', desc: 'Microchip e registro sanitário completo' },
  { value: 100, label: 'R$ 100', desc: 'Subsídio para castração social preventiva' },
  { value: 200, label: 'R$ 200', desc: 'Custeio de servidores e IA 24h por 1 semana' },
];

export const DonationView: React.FC<DonationViewProps> = ({
  onNavigateToAdoption,
  onOpenVetChat,
}) => {
  const [frequency, setFrequency] = useState<'once' | 'monthly'>('monthly');
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao'>('pix');

  // Donor form
  const [donorName, setDonorName] = useState<string>('');
  const [donorEmail, setDonorEmail] = useState<string>('');
  const [dogHonored, setDogHonored] = useState<string>('');
  const [donorMessage, setDonorMessage] = useState<string>('');

  // UI States
  const [copiedPix, setCopiedPix] = useState<boolean>(false);
  const [donationSuccess, setDonationSuccess] = useState<boolean>(false);
  const [donorList, setDonorList] = useState<DonationRecord[]>(INITIAL_DONORS);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);

  // Calculated amount
  const finalAmount = isCustom ? parseFloat(customAmount) || 0 : selectedAmount;

  // Fake PIX key and payload
  const pixKey = 'contato@canistech.net.br';
  const pixCode = `00020126580014br.gov.bcb.pix0136${pixKey}520400005303986540${finalAmount.toFixed(
    2
  )}5802BR5925CANISTECH SAUDE CANINA6009SAO PAULO62070503***6304${Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()}`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleConfirmDonation = (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount <= 0) return;

    const newRecord: DonationRecord = {
      id: `don-${Date.now()}`,
      donorName: donorName.trim() || 'Apoiador Anônimo',
      dogHonored: dogHonored.trim() || undefined,
      amount: finalAmount,
      date: 'Agora mesmo',
      message: donorMessage.trim() || 'Apoiando a saúde e longevidade dos cães do Brasil!',
      isMonthly: frequency === 'monthly',
      tier:
        finalAmount >= 150
          ? 'diamante'
          : finalAmount >= 80
          ? 'ouro'
          : finalAmount >= 40
          ? 'prata'
          : 'bronze',
    };

    setDonorList([newRecord, ...donorList]);
    setDonationSuccess(true);
  };

  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-6 space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-[#1E293B] rounded-3xl p-6 md:p-10 text-white relative overflow-hidden shadow-xl border border-slate-700">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#E07A5F]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-[#E07A5F] border border-white/10">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Fundo de Sustentabilidade & Assistência Canina</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black font-heading tracking-tight leading-tight">
            Mantenha o CanisTech Vivo, Independente e 100% Gratuito
          </h1>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            Não cobramos assinaturas de tutores e nem vendemos dados. Sua contribuição custeia servidores de alta disponibilidade, desenvolvimento de IA veterinária preventiva para emergências e suporte direto a abrigos e cães resgatados no Brasil.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              100% Auditado & Transparente
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              <Server className="w-4 h-4 text-blue-400" />
              Infraestrutura Cloud & IA 24h
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              <Users className="w-4 h-4 text-[#E07A5F]" />
              +1.200 Cães Apoiados
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Budget & Transparency Live Progress */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Meta Mensal de Manutenção Operacional (Outubro/2025)
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900 font-heading font-mono">
                R$ 9.480,00
              </span>
              <span className="text-xs text-slate-500 font-medium">
                arrecadados da meta de R$ 12.000,00 (79%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5" />
              Faltam apenas R$ 2.520 para fechar o mês
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-[#2A9D8F] to-[#E07A5F] rounded-full transition-all duration-1000"
            style={{ width: '79%' }}
          />
        </div>

        {/* Transparent Allocation Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-blue-600" />
                45% Servidores & IA 24h
              </span>
              <span className="font-mono text-slate-500 font-semibold">R$ 4.266</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Custeio de servidores em nuvem, banco de dados criptografado e processamento da IA de orientação e bem-estar preventivo.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-red-500" />
                35% Resgates & Abrigos
              </span>
              <span className="font-mono text-slate-500 font-semibold">R$ 3.318</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Compra direta de sacos de ração super premium, vacinas V10 e curativos para ONGs parceiras no Brasil.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                20% Castrações Sociais
              </span>
              <span className="font-mono text-slate-500 font-semibold">R$ 1.896</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Mutirões gratuitos de esterilização e microchipagem para tutores em comunidades de vulnerabilidade social.
            </p>
          </div>
        </div>
      </div>

      {/* Main Contribution Center: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Choose amount, type, payment */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-bold text-[#E07A5F] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100">
              Central Segura de Apoio
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading">
              Faça Sua Contribuição
            </h2>
            <p className="text-xs text-slate-500">
              Escolha o valor e a modalidade. Qualquer quantia transforma diretamente a vida de cães brasileiros.
            </p>
          </div>

          {/* Frequency Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setFrequency('monthly')}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                frequency === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E07A5F]" />
              <span>Padrinho Mensal (Recorrente)</span>
            </button>
            <button
              type="button"
              onClick={() => setFrequency('once')}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                frequency === 'once'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-slate-500" />
              <span>Apoio Pontual Único</span>
            </button>
          </div>

          {/* Amount Cards */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Selecione o valor do apoio:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PRESET_AMOUNTS.map((preset) => {
                const isSelected = !isCustom && selectedAmount === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(preset.value);
                      setIsCustom(false);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="font-black text-base font-heading font-mono">
                      {preset.label}
                    </div>
                    <p
                      className={`text-[10px] mt-1 leading-tight line-clamp-2 ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {preset.desc}
                    </p>
                  </button>
                );
              })}

              {/* Custom amount card */}
              <button
                type="button"
                onClick={() => setIsCustom(true)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isCustom
                    ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                }`}
              >
                <div className="font-bold text-sm font-heading">Outro Valor</div>
                <p
                  className={`text-[10px] mt-1 ${
                    isCustom ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  Você define quanto deseja doar
                </p>
              </button>
            </div>

            {isCustom && (
              <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 animate-in fade-in">
                <span className="font-bold text-slate-700 text-sm">R$</span>
                <input
                  type="number"
                  min="5"
                  step="5"
                  placeholder="Digite o valor (ex: 75)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-slate-900 outline-none"
                />
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Forma de Pagamento:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'pix'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>PIX Instantâneo (Sem Taxas)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cartao')}
                className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'cartao'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Cartão de Crédito</span>
              </button>
            </div>
          </div>

          {/* Donor Information Form */}
          <form onSubmit={handleConfirmDonation} className="space-y-4 pt-2 border-t border-slate-100 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Seu Nome / Razão:</label>
                <input
                  type="text"
                  placeholder="Ex: Beatriz Lima ou Anônimo"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">E-mail para Recibo:</label>
                <input
                  type="email"
                  placeholder="seu@email.com.br"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Em homenagem ao seu cão (opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Em memória do Pipoca"
                  value={dogHonored}
                  onChange={(e) => setDogHonored(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mensagem no Mural (opcional):
                </label>
                <input
                  type="text"
                  placeholder="Deixe uma palavra de carinho..."
                  value={donorMessage}
                  onChange={(e) => setDonorMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-slate-800"
                />
              </div>
            </div>

            {/* PIX Interactive Module */}
            {paymentMethod === 'pix' && (
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <strong className="text-emerald-950 font-bold">Chave PIX Oficial CanisTech</strong>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-800">
                    Valor: R$ {finalAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-emerald-100 shadow-xs">
                  {/* Clean SVG Vector QR Code */}
                  <div className="w-28 h-28 bg-white p-2 rounded-lg border border-slate-200 flex flex-col items-center justify-center shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                      <rect width="100" height="100" fill="white" />
                      <path
                        fill="currentColor"
                        d="M10 10h30v30H10zm6 6v18h18V16zm4 4h10v10H20zm40-10h30v30H60zm6 6v18h18V16zm4 4h10v10H70zM10 60h30v30H10zm6 6v18h18V66zm4 4h10v10H20zm45-6h10v10H65zm15 0h10v10H80zm-15 15h10v15H65zm15 5h10v10H80zm-35-15h10v10H45zm0-25h10v10H45zm15 0h10v10H60z"
                      />
                    </svg>
                  </div>

                  <div className="space-y-2 flex-1 w-full">
                    <div className="text-[11px] text-slate-600">
                      <span className="block font-semibold text-slate-800">
                        Chave CNPJ / E-mail:
                      </span>
                      <code className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {pixKey}
                      </code>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
                    >
                      {copiedPix ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                          <span>Código PIX Copiado com Sucesso!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar Código PIX Copia e Cola</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-slate-500 text-center">
                      Abra o app do seu banco, escolha "PIX Copia e Cola" e confirme.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Credit Card Simulated Secure Form */}
            {paymentMethod === 'cartao' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Transação Criptografada SSL 256-bit
                  </span>
                  <span className="font-mono text-slate-500">Valor: R$ {finalAmount.toFixed(2)}</span>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Número do Cartão de Crédito"
                    defaultValue="•••• •••• •••• 4242"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Validade (MM/AA)"
                      defaultValue="12/28"
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono outline-none"
                    />
                    <input
                      type="text"
                      placeholder="CVV"
                      defaultValue="891"
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={finalAmount <= 0}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Heart className="w-4 h-4 text-[#E07A5F] fill-current" />
              <span>
                Confirmar Apoio {frequency === 'monthly' ? 'Mensal' : 'Pontual'} de R${' '}
                {finalAmount.toFixed(2)}
              </span>
            </button>
          </form>

          {donationSuccess && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 space-y-2 animate-in zoom-in-95">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Muito obrigado de todo o coração canino! 🐾</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Sua contribuição foi registrada com sucesso e adicionada ao mural público de benfeitores. Você receberá a prestação de contas periódica em seu e-mail.
              </p>
              <button
                onClick={() => setShowCertificateModal(true)}
                className="mt-2 text-xs font-bold text-emerald-900 hover:underline flex items-center gap-1"
              >
                <span>Baixar Certificado Digital de Apoiador Oficial</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Donor Wall & Social Proof */}
        <div className="lg:col-span-5 space-y-6">
          {/* Benfeitores Mural */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#E07A5F]" />
                <h3 className="font-bold text-slate-900 font-heading text-base">
                  Mural dos Benfeitores Caninos
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {donorList.length} doações recentes
              </span>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {donorList.map((donor) => (
                <div
                  key={donor.id}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900">{donor.donorName}</span>
                      {donor.isMonthly && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                          Padrinho
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-xs font-mono text-emerald-700">
                      R$ {donor.amount.toFixed(2)}
                    </span>
                  </div>

                  {donor.dogHonored && (
                    <div className="text-[11px] text-[#E07A5F] font-semibold flex items-center gap-1">
                      <span>🐾</span>
                      <span>{donor.dogHonored}</span>
                    </div>
                  )}

                  {donor.message && (
                    <p className="text-[11px] text-slate-600 italic leading-snug">
                      "{donor.message}"
                    </p>
                  )}

                  <div className="text-[10px] text-slate-400 text-right">{donor.date}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Direct Rescue Impact Card */}
          <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-3xl p-6 space-y-3 shadow-sm border border-emerald-800">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">
              Impacto Direto
            </span>
            <h4 className="font-bold font-heading text-lg text-white">
              Conheça a Feira Virtual de Adoção
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              O CanisTech mantém parceria com 14 abrigos em SP, RJ, MG e PR. Conheça cães castrados, vacinados e prontos para encontrar um lar responsável.
            </p>
            {onNavigateToAdoption && (
              <button
                onClick={onNavigateToAdoption}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Ver Cães Disponíveis para Adoção</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-200 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-slate-500" />
          <h3 className="font-bold text-slate-900 font-heading text-lg">
            Perguntas Frequentes sobre Doações & Transparência
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-1">
            <strong className="text-slate-900 block font-semibold">
              Como sei que o dinheiro vai realmente para a plataforma e os cães?
            </strong>
            <p>
              Publicamos mensalmente relatórios com notas fiscais de servidores em nuvem, recibos de compra de rações e laudos de castrações de cães de abrigos parceiros.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-1">
            <strong className="text-slate-900 block font-semibold">
              Posso cancelar meu apadrinhamento mensal quando quiser?
            </strong>
            <p>
              Sim! Sem burocracia ou fidelidade. Você pode pausar ou cancelar a qualquer momento diretamente pelo e-mail ou solicitando pelo nosso chat veterinário.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-1">
            <strong className="text-slate-900 block font-semibold">
              Recebo comprovante ou certificado de doação?
            </strong>
            <p>
              Sim. Ao confirmar o apoio, você pode baixar o Certificado Oficial de Benfeitor Canino com selo digital e número de registro comemorativo.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-1">
            <strong className="text-slate-900 block font-semibold">
              Por que a plataforma CanisTech não cobra mensalidade dos tutores?
            </strong>
            <p>
              Acreditamos que todo cão no Brasil — de raça pura ou vira-lata caramelo — tem direito a um prontuário digital com alerta preventivo de saúde e cálculos de IMC.
            </p>
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center text-xl">
                🏆
              </div>
              <h3 className="font-bold text-lg text-slate-900 font-heading">
                Certificado Oficial de Benfeitor Canino
              </h3>
              <p className="text-xs text-slate-500">
                Certificamos que <strong>{donorName || 'Apoiador Amigo'}</strong> contribuiu ativamente para a manutenção da infraestrutura de saúde canina e apoio animal no Brasil.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1 text-center font-mono">
              <div>REGISTRO: CANISTECH-BENFEITOR-{Date.now().toString().slice(-6)}</div>
              <div>HOMENAGEM: {dogHonored || 'A todos os cães resgatados'}</div>
              <div>AUTENTICAÇÃO: CFMV-PREV-2025-V2</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  alert('Certificado enviado para o seu e-mail e salvo no histórico.');
                  setShowCertificateModal(false);
                }}
                className="flex-1 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                Salvar Comprovante
              </button>
              <button
                onClick={() => setShowCertificateModal(false)}
                className="py-2.5 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
