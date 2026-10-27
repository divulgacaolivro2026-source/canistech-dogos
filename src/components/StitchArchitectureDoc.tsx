import React from 'react';
import {
  FileText,
  MapPin,
  ShieldCheck,
  Dna,
  HeartPulse,
  Activity,
  Layers,
  CheckCircle2,
  X,
  Palette,
  Sparkles,
} from 'lucide-react';

interface StitchArchitectureDocProps {
  onClose: () => void;
}

export const StitchArchitectureDoc: React.FC<StitchArchitectureDocProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-[#E07A5F]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading">
                Dossiê de Arquitetura de Produto & Sistema Visual CanisTech
              </h2>
              <p className="text-xs text-slate-400">
                Especificação Stitch (stitch.withgoogle.com) → Transição Funcional AI Studio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-8 text-xs text-slate-700 leading-relaxed">
          {/* 1. Arquitetura de Informação */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-heading font-bold text-sm">
              <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs">
                1
              </span>
              <h3>Arquitetura de Informação & Mapa do Ecossistema CanisTech</h3>
            </div>
            <p>
              A estrutura da plataforma foi projetada em camadas concêntricas centradas no paciente canino (DogOS), expandindo-se para a rede comunitária, o marketplace local e a reprodução assistida responsável.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900">Núcleo Individual (DogOS)</h4>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                  <li>Carteira de Identidade Digital (RG Pet)</li>
                  <li>Escore Corporal ECC/BCS (WSAVA 1-9)</li>
                  <li>Curva Evolutiva de Massa Corporal</li>
                  <li>Agenda Preventiva (V10, Raiva, Nexgard)</li>
                  <li>Nutrição calibrada e exercícios</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900">Camada de Conhecimento & Risco</h4>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                  <li>Central de Toxicidade Canina em tempo real</li>
                  <li>Enciclopédia de Raças & Clima Brasileiro</li>
                  <li>Semiotécnica de Urgência & Sintomas</li>
                  <li>Assistente Veterinário IA 24h</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900">Rede Comunitária & Ylove</h4>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                  <li>Ylove Pet (Cruzamento com laudo auditado)</li>
                  <li>Mapa Canino Interativo do Brasil</li>
                  <li>Feira Virtual de Adoção Responsável</li>
                  <li>Concurso Cão da Semana (Votação)</li>
                  <li>Diretório de Clínicas 24h & Especialistas</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 2. Sistema Visual Kinetic Canine */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-heading font-bold text-sm">
              <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs">
                2
              </span>
              <h3>Sistema Visual Diferenciado: "Kinetic Canine & Clinical Health"</h3>
            </div>
            <p>
              Rejeição deliberada de clichês infantis de pet shop (patas caricatas, fundos coloridos primários, estética de desenho animado). O CanisTech adota uma linguagem de healthtech veterinária contemporânea:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900">Paleta Cromática</h4>
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#0F172A] border"></span>
                    <span><strong>Dark Slate (#0F172A):</strong> Autoridade, contraste e tipografia clínica.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#E07A5F] border"></span>
                    <span><strong>Warm Ochre (#E07A5F):</strong> Vitalidade canina e ações prioritárias.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#2A9D8F] border"></span>
                    <span><strong>Sage Herb Health (#2A9D8F):</strong> Laudos aprovados, vacinas em dia e COI seguro.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#E76F51] border"></span>
                    <span><strong>Bio Coral (#E76F51):</strong> Alertas de toxicidade e emergência.</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900">Tipografia & Geometria</h4>
                <div className="space-y-1 text-[11px] text-slate-600">
                  <p>• <strong>Display / Títulos:</strong> Plus Jakarta Sans com tracking negativo (-0.015em).</p>
                  <p>• <strong>Corpo & Dados:</strong> Inter com numerais tabulares (tabular-nums).</p>
                  <p>• <strong>Códigos & Identificadores:</strong> JetBrains Mono para microchip e lotes.</p>
                  <p>• <strong>Raio de Borda:</strong> 12px a 16px para contenção sem excesso arredondado.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Tratamento de Áreas Sensíveis & Compliance */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-heading font-bold text-sm">
              <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs">
                3
              </span>
              <h3>Diretrizes Éticas e Compliance Veterinário (CFMV nº 1.069 & 1.321)</h3>
            </div>
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2 text-slate-700">
              <p>
                <strong>1. Reprodução Assistida (Ylove Pet):</strong> Não funciona como classificado aberto. Exige obrigatoriamente laudos negativos de brucelose canina, raio-x oficial de displasia coxofemoral (HD) e painel genético de DNA antes de qualquer liberação de contato.
              </p>
              <p>
                <strong>2. Triagem e Conteúdo de Saúde:</strong> Todo diagnóstico ou sugestão vem acompanhado de aviso explícito de que não substitui a consulta presencial nem a emissão de laudo por médico veterinário legalmente habilitado no CRMV.
              </p>
              <p>
                <strong>3. Monetização Transparente:</strong> Anúncios e produtos de parceiros são etiquetados com selos evidentes ("Patrocinado / Parceiro Homologado"), sem interferência na legibilidade das tabelas de saúde e toxicidade.
              </p>
            </div>
          </section>

          {/* 4. Roteiro Stitch para AI Studio */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-heading font-bold text-sm">
              <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs">
                4
              </span>
              <h3>Roteiro de Transição Funcional para o Google AI Studio</h3>
            </div>
            <div className="space-y-2 text-slate-600">
              <div className="flex gap-2">
                <span className="font-bold text-slate-900">Fase 1 (Estrutura de Componentes):</span>
                <span>Isolar o DogOS, o visualizador WSAVA, o mapa vetorial do Brasil e o chat de triagem em módulos reativos.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-900">Fase 2 (Motor de Cálculo Biométrico):</span>
                <span>Fórmulas automáticas de MER (kcal/dia) = 70 * (peso^0.75) * fator reprodutivo e WSAVA BCS (1-9).</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-900">Fase 3 (Disparo & Integrações):</span>
                <span>Formatadores de mensagem para WhatsApp, exportação de PDF A4 oficial e API de triagem assistida por IA.</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Fechar Especificações
          </button>
        </div>
      </div>
    </div>
  );
};
