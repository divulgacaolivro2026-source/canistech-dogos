import React, { useState, useEffect } from 'react';
import {
  getLgpdConsent,
  saveLgpdConsentWithWebCrypto,
  LGPD_POLICY_VERSION,
  DPO_CONTACT_INFO,
} from '../services/goldAndPrivacyService';
import { LgpdConsentRecord } from '../types';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  FileCheck,
  Scale,
  Mail,
  HardDrive,
} from 'lucide-react';

export interface LgpdConsentBannerProps {
  userEmail?: string | null;
  onConsentAccepted?: (record: LgpdConsentRecord) => void;
  onDecline?: () => void;
}

export const LgpdConsentBanner: React.FC<LgpdConsentBannerProps> = ({
   userEmail,
  onConsentAccepted,
  onDecline,
}) => {
  const [consentRecord, setConsentRecord] = useState<LgpdConsentRecord | null>(() =>
    getLgpdConsent(userEmail)
  );
  const [checkedLgpd, setCheckedLgpd] = useState<boolean>(false);
  const [checkedCfmvDisclaimer, setCheckedCfmvDisclaimer] = useState<boolean>(false);
  const [isSigning, setIsSigning] = useState<boolean>(false);

  useEffect(() => {
    setConsentRecord(getLgpdConsent(userEmail));
  }, [userEmail]);

  if (consentRecord?.accepted) {
    return null;
  }

  const canAccept = checkedLgpd && checkedCfmvDisclaimer && !isSigning;

  const handleAcceptConsent = async () => {
    if (!canAccept) return;
    setIsSigning(true);
    try {
      const saved = await saveLgpdConsentWithWebCrypto(userEmail);
      setConsentRecord(saved);
      onConsentAccepted?.(saved);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lgpd-consent-title"
    >
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border-2 border-emerald-500/40 space-y-5 my-auto animate-in zoom-in-95 duration-200">
        {/* Cabeçalho Oficial */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-black uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Gate Obrigatório LGPD • Lei Federal nº 13.709/2018</span>
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                Política: {LGPD_POLICY_VERSION}
              </span>
            </div>
            <h2
              id="lgpd-consent-title"
              className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white leading-tight"
            >
              Termo de Consentimento Explícito, Soberania de Dados & Conformidade Regulatória
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Em estrito cumprimento aos <strong>Art. 7º, I e Art. 8º da LGPD</strong>, ao <strong>Código de Defesa do Consumidor (CDC)</strong> e às diretrizes éticas do <strong>CFMV / MAPA</strong>, leia e confirme seu aceite antes de utilizar o sistema <strong>CanisTech DogOS</strong>.
            </p>
          </div>
        </div>

        {/* Pilares de Conformidade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <HardDrive className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Isolamento & Soberania do Titular</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Seus dados cadastrais, fotos 3x4 (comprimidas em WebP local) e prontuários caninos permanecem sob seu controle, com direito à <strong>Portabilidade (.JSON)</strong> e <strong>Exclusão Definitiva (Art. 18, VI)</strong> a qualquer momento.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Scale className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Natureza Documental (CFMV / MAPA)</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              A Cédula RGC constitui registro particular de identificação e biometria canina. As Carteirinhas de Vacinação têm validade clínica mediante fixação física do selo vacinal original e carimbo presencial de Médico Veterinário (CRMV).
            </p>
          </div>
        </div>

        {/* Canal Oficial DPO */}
        <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-300 block">
                Canal Oficial do Encarregado de Dados (DPO - Art. 41 LGPD)
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {DPO_CONTACT_INFO.dpoName} •{' '}
                <code className="font-mono font-bold text-blue-700 dark:text-blue-300">
                  {DPO_CONTACT_INFO.dpoEmail}
                </code>
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 text-slate-600 dark:text-slate-300 shrink-0">
            Web Crypto SHA-256
          </span>
        </div>

        {/* Checkboxes de Consentimento Explícito */}
        <div className="space-y-2.5 pt-1">
          <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={checkedLgpd}
              onChange={(e) => setCheckedLgpd(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-emerald-600 rounded cursor-pointer shrink-0"
            />
            <span className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
              <strong>Aceite LGPD (Art. 7º e Art. 8º da Lei 13.709/2018):</strong> Autorizo de forma livre, informada e inequívoca o tratamento local e sincronizado dos meus dados de tutor e dos dados biométricos do(s) meu(s) cão(ães) para emissão de RGC, controle vacinal WSAVA 2024 e alertas preventivos.
            </span>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={checkedCfmvDisclaimer}
              onChange={(e) => setCheckedCfmvDisclaimer(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-emerald-600 rounded cursor-pointer shrink-0"
            />
            <span className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
              <strong>Ciência Sanitária e Clínica (CFMV / CDC):</strong> Declaro ciência de que a validade clínica, sanitária e legal de cada vacina depende exclusivamente da fixação física do selo original do frasco vacinal e carimbo/assinatura presencial de Médico Veterinário inscrito no CRMV na Carteirinha Física impressa.
            </span>
          </label>
        </div>

        {/* Botão de Confirmação com Assinatura SHA-256 */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
            <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Assinatura criptográfica SHA-256 gravada com timestamp ISO-8601</span>
          </div>

          <button
            type="button"
            disabled={!canAccept}
            onClick={handleAcceptConsent}
            className={`w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              canAccept
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 cursor-pointer'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSigning ? (
              <>
                <FileCheck className="w-4 h-4 animate-pulse" />
                <span>Assinando Hash SHA-256...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Consentimento e Acessar Plataforma</span>
              </>
            )}
          </button>
        </div>

        {onDecline && (
          <div className="text-center">
            <button
              type="button"
              onClick={onDecline}
              className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer"
            >
              Não concordo — sair da plataforma
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
