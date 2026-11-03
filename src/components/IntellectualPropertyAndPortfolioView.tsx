import React, { useState } from 'react';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  Copy,
  ArrowLeft,
  Mail,
  Lock,
  FileText,
  Bookmark,
  Share2,
  Scale,
  Building2,
  EyeOff,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

interface IntellectualPropertyAndPortfolioViewProps {
  onBack?: () => void;
  onOpenVetChat?: (query?: string) => void;
}

export const IntellectualPropertyAndPortfolioView: React.FC<IntellectualPropertyAndPortfolioViewProps> = ({
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'termos' | 'propriedade' | 'lgpd' | 'certificacao'>('termos');
  const [copiedHash, setCopiedHash] = useState(false);

  const corporateCertificateHash =
    'SHA256: 9b2d8e4f1a5c6e7d8c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2500);
  };

  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Voltar ao Painel"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#E07A5F] bg-orange-100 dark:bg-orange-950/60 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800/60">
                Governança & Direitos Reservados
              </span>
              <span className="text-xs text-slate-400 font-mono">Lei nº 9.609/98 & LGPD 13.709/18</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white tracking-tight mt-0.5">
              Propriedade Intelectual, Termos & Conformidade LGPD
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Titularidade Corporativa Homologada</span>
          </span>
        </div>
      </div>

      {/* Corporate Identity Hero Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700/80 text-orange-400 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5" />
              <span>Titularidade & Direitos Exclusivos</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-heading tracking-tight text-white">
              CanisTech Digital Systems
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Plataforma de Gestão Cinófila, Biometria Canina e Bem-Estar Preventivo. Todos os direitos patrimoniais, marcas, logotipos, algoritmos de cálculo biométrico, formatos documentais (Cédula RGC/CIN) e metodologias de triagem de rotina pertencem exclusivamente à <strong>CanisTech Digital Systems</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Protocolo Multi-Tenant com Cofre Criptografado Local</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700">
                <Scale className="w-3.5 h-3.5 text-blue-400" />
                <span>Conformidade CFMV & LGPD</span>
              </span>
            </div>
          </div>

          <div className="lg:col-span-4 bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 space-y-3 backdrop-blur-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Certificação de Autenticidade Institucional
            </div>

            <div className="p-3 bg-slate-900 rounded-xl font-mono text-[11px] text-slate-300 break-all border border-slate-750">
              {corporateCertificateHash}
            </div>

            <button
              onClick={() => copyToClipboard(corporateCertificateHash)}
              className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copiedHash ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Hash Institucional Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Hash de Verificação</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setActiveTab('termos')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'termos'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Termos de Uso Corporativos</span>
        </button>

        <button
          onClick={() => setActiveTab('propriedade')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'propriedade'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Propriedade Intelectual & Marcas</span>
        </button>

        <button
          onClick={() => setActiveTab('lgpd')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'lgpd'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Conformidade LGPD & Privacidade</span>
        </button>

        <button
          onClick={() => setActiveTab('certificacao')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'certificacao'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Auditoria & Atos Legais</span>
        </button>
      </div>

      {/* TAB 1: TERMOS DE USO CORPORATIVOS */}
      {activeTab === 'termos' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Contrato de Licença de Uso & Condições Gerais
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-heading mt-1">
                Termos Gerais de Uso da Plataforma CanisTech DogOS
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>1. Objeto e Natureza da Plataforma</span>
                </h4>
                <p>
                  A plataforma CanisTech DogOS é um sistema digital projetado exclusivamente para a organização de histórico de rotina, biometria de acompanhamento e suporte cadastral cinófilo (RGC).
                </p>
                <p>
                  Todas as estimativas calóricas, curvas de crescimento e escores corporais seguem diretrizes públicas de bem-estar animal (WSAVA/FEDIAF) em caráter puramente informativo e de suporte aos tutores e criadores responsáveis.
                </p>
              </div>

              <div className="space-y-3 p-4 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-800/50">
                <h4 className="font-bold text-amber-900 dark:text-amber-300 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>2. Não Substituição de Consulta Veterinária (CFMV)</span>
                </h4>
                <p className="text-amber-900 dark:text-amber-200">
                  Sob nenhuma hipótese as orientações, relatórios analíticos, sugestões nutricionais ou simulações da plataforma configuram diagnóstico médico-veterinário ou prescrição farmacológica.
                </p>
                <p className="text-amber-900 dark:text-amber-200">
                  Qualquer sinal clínico, alteração comportamental, trauma ou enfermidade deve ser avaliado presencialmente por Médico Veterinário devidamente inscrito no CRMV.
                </p>
              </div>

              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <span>3. Responsabilidades do Tutor e Veracidade</span>
                </h4>
                <p>
                  O usuário é integralmente responsável pela veracidade e precisão dos dados biográficos, sanitários e documentais inseridos na plataforma.
                </p>
                <p>
                  A emissão de documentos como a Cédula de Identificação Canina (RGC) reflete estritamente os parâmetros fornecidos pelo tutor no ato do cadastramento biométrico.
                </p>
              </div>

              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-600" />
                  <span>4. Governança e Alterações Contratuais</span>
                </h4>
                <p>
                  A CanisTech Digital Systems reserva-se o direito de atualizar, aprimorar ou reconfigurar módulos funcionais, mantendo sempre a transparência e a conformidade com as leis vigentes de proteção ao consumidor e dados pessoais.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROPRIEDADE INTELECTUAL & MARCAS */}
      {activeTab === 'propriedade' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Proteção Autoral e Ativos Tecnológicos
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-heading mt-1">
                Direitos Autorais e Propriedade de Software
              </h3>
            </div>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  1. Titularidade Exclusiva da CanisTech Digital Systems
                </h4>
                <p>
                  Nos termos da Lei Federal nº 9.609 de 19 de fevereiro de 1998 (Lei do Software) e da Lei Federal nº 9.610 de 19 de fevereiro de 1998 (Direitos Autorais), todo o conjunto inventivo, incluindo interfaces visuais, layouts de documentos analíticos e de biometria, fluxos de triagem e marcas distintivas da CanisTech DogOS são de titularidade patrimonial exclusiva da CanisTech Digital Systems.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  2. Restrições e Proibições Estritas
                </h4>
                <p>
                  É expressamente vedada a reprodução total ou parcial, engenharia reversa, descompilação, distribuição comercial, sublicenciamento ou extração automatizada de dados e componentes da plataforma sem autorização prévia e expressa por escrito da CanisTech Digital Systems.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  3. Padrão Documental RGC / CIN Canina
                </h4>
                <p>
                  O modelo gráfico, formato de numeração, layout de impressão frente e verso e elementos visuais de autenticidade da Cédula de Identificação Canina (RGC) constituem criação intelectual protegida, licenciada exclusivamente para uso pessoal e identificação civil dos cães cadastrados na plataforma.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONFORMIDADE LGPD & PRIVACIDADE */}
      {activeTab === 'lgpd' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Lei Geral de Proteção de Dados (Lei nº 13.709/2018)
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-heading mt-1">
                Política de Privacidade & Blindagem de Dados Pessoais
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Lock className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white">Cofre de Dados Local</h4>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Todos os dados de animais cadastrados, vacinas, pesos e diários permanecem restritos ao ambiente do navegador do usuário, com isolamento de sessão por conta autenticada.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
                  <EyeOff className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white">Zero Compartilhamento</h4>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Não comercializamos nem cedemos dados de tutores ou cães para corretores, redes de terceiros ou brokers de publicidade externa.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white">Direito de Eliminação</h4>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  O titular da conta tem o direito inalienável de solicitar a exclusão integral e imediata do seu cadastro e de todos os seus registros a qualquer momento.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                Encarregado de Proteção de Dados (DPO)
              </h4>
              <p>
                Para exercer seus direitos como titular de dados ou esclarecer dúvidas sobre a governança de privacidade, entre em contato com nosso canal institucional de conformidade: <strong>privacidade@canistech.net.br</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CERTIFICAÇÃO & ATOS LEGAIS */}
      {activeTab === 'certificacao' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Segurança Criptográfica e Conformidade
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-heading mt-1">
                Atos Oficiais e Certificação de Autoria
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Marco Regulatório</span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">Legislação Federal Aplicada</p>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400 list-disc list-inside">
                  <li>Lei nº 9.609/1998 — Proteção da Propriedade Intelectual de Programa de Computador</li>
                  <li>Lei nº 9.610/1998 — Direitos Autorais e Conexos</li>
                  <li>Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais (LGPD)</li>
                  <li>Resoluções do CFMV nº 1.138/2016 e conexas (Código de Ética Médico-Veterinário)</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Titularidade Patrimonial</span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">CanisTech Digital Systems</p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Plataforma registrada sob salvaguarda de auditoria contínua, com criptografia simétrica de sessões e integridade de registros biométricos.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
