// Caminho: src/components/OfficialRgcDocument.tsx
import React, { useState, useEffect, useRef } from 'react';
import { DogProfile } from '../types';
import {
  QrCodeSvg,
  formatRgcCpf,
  generateRgcSecurityHash,
  generateRgcSecurityHashAsync,
  getDogPhotoUrl,
  hasValidDogPhoto,
} from '../utils/qrCodeGenerator';
import {
  generateAndDownloadOfficialRgCard,
  createOfficialRgCardPdfBlobUrl,
} from '../utils/rgCardPdfGenerator';
import {
  ShieldCheck,
  AlertTriangle,
  Download,
  Printer,
  Camera,
  RefreshCw,
  Clock,
  CheckCircle2,
  Lock,
  Heart,
  X,
  FileCheck2,
} from 'lucide-react';

interface OfficialRgcDocumentProps {
  dog: DogProfile;
  onOpenEditPhoto?: () => void;
  onRenewBiennialLifeProof?: () => void;
  onUpdateDog?: (updatedDog: DogProfile) => void;
  onClose?: () => void;
  isModal?: boolean;
}

// Inline Brazilian Flag SVG for subtle 4% opacity watermark
const BrazilFlagWatermark: React.FC = () => (
  <svg
    viewBox="0 0 100 70"
    className="absolute inset-0 w-3/5 h-3/5 m-auto opacity-[0.04] pointer-events-none select-none z-0"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect width="100" height="70" fill="#009c3b" rx="4" />
    <polygon points="50,6 92,35 50,64 8,35" fill="#ffdf00" />
    <circle cx="50" cy="35" r="17.5" fill="#002776" />
    <path d="M33,37 Q50,29 67,37" stroke="#ffffff" strokeWidth="2.5" fill="none" />
  </svg>
);

export const OfficialRgcDocument: React.FC<OfficialRgcDocumentProps> = ({
  dog,
  onOpenEditPhoto,
  onRenewBiennialLifeProof,
  onUpdateDog,
  onClose,
  isModal = false,
}) => {
  const [activeTab, setActiveTab] = useState<'both' | 'front' | 'back'>('both');
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [showPrintPreviewModal, setShowPrintPreviewModal] = useState<boolean>(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);

  // 1. Photo validation
  const dogPhoto = getDogPhotoUrl(dog);
  const hasPhoto = hasValidDogPhoto(dog);

  // 2. Vital Status validation (Deceased)
  const isDeceased = dog.vitalStatus === 'deceased';

  // 3. Issuance & Validity Calculation (1 year validity, 2 years biennial renewal)
  const [issuedAt, setIssuedAt] = useState<string>(() => dog.rgcIssuedAt || '');
  const [expiresAt, setExpiresAt] = useState<string>(() => dog.rgcExpiresAt || '');
  const [securityHash, setSecurityHash] = useState<string>(() => dog.rgcSecurityHash || '');

  useEffect(() => {
    if (!dog.rgcIssuedAt && hasPhoto && !isDeceased) {
      const now = new Date();
      const nowIso = now.toISOString();
      const expDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      const expIso = expDate.toISOString();
      const hash = generateRgcSecurityHash(dog.id, dog.microchip, nowIso);

      setIssuedAt(nowIso);
      setExpiresAt(expIso);
      setSecurityHash(hash);

      void generateRgcSecurityHashAsync(dog.id, dog.microchip, nowIso).then((webCryptoHash) => {
        setSecurityHash(webCryptoHash);
        if (onUpdateDog) {
          onUpdateDog({
            ...dog,
            rgcIssuedAt: nowIso,
            rgcExpiresAt: expIso,
            rgcSecurityHash: webCryptoHash,
          });
        }
      });
    } else {
      if (dog.rgcIssuedAt) setIssuedAt(dog.rgcIssuedAt);
      if (dog.rgcExpiresAt) setExpiresAt(dog.rgcExpiresAt);
      if (dog.rgcSecurityHash) setSecurityHash(dog.rgcSecurityHash);
    }
  }, [dog.id, dog.rgcIssuedAt, hasPhoto, isDeceased]);

  const formatDateBR = (isoStr?: string) => {
    if (!isoStr) return new Date().toLocaleDateString('pt-BR');
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString('pt-BR');
    } catch {
      return isoStr;
    }
  };

  const formattedIssuedDate = formatDateBR(issuedAt);
  const formattedExpiresDate = formatDateBR(expiresAt);

  // Check 2-year Biennial Life Proof expiration
  const twoYearsMs = 2 * 365.25 * 24 * 60 * 60 * 1000;
  const isBiennialExpired = Boolean(
    issuedAt && Date.now() - new Date(issuedAt).getTime() > twoYearsMs
  );

  const formattedRgcNumber = formatRgcCpf(dog.rgNumber, dog.id);

  // Protected Emergency Scan URL targeting Dossier with mandatory owner login
  const emergencyScanUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?view=dossier&dogId=${encodeURIComponent(
          dog.id
        )}&rgc=${encodeURIComponent(formattedRgcNumber)}`
      : `https://canistech.com.br/?view=dossier&dogId=${dog.id}&rgc=${formattedRgcNumber}`;

  const handlePrint = () => {
    if (!hasPhoto || isDeceased || isBiennialExpired) return;
    try {
      const { blobUrl } = createOfficialRgCardPdfBlobUrl({
        ...dog,
        photoUrl: dogPhoto,
        rgNumber: formattedRgcNumber,
        rgcIssuedAt: issuedAt,
        rgcExpiresAt: expiresAt,
        rgcSecurityHash: securityHash,
      });
      setPreviewBlobUrl(blobUrl);
      setShowPrintPreviewModal(true);
    } catch (err) {
      console.error('Erro ao gerar pré-visualização PDF do RGC:', err);
    }
  };

  const handleTriggerIframePrint = () => {
    try {
      if (previewIframeRef.current?.contentWindow) {
        previewIframeRef.current.contentWindow.focus();
        previewIframeRef.current.contentWindow.print();
        return;
      }
    } catch {
      // Fallback para download direto caso o ambiente bloqueie print em iframe
    }
    handleDownloadPdf();
  };

  const handleClosePrintPreview = () => {
    setShowPrintPreviewModal(false);
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
  };

  const handleDownloadPdf = () => {
    if (!hasPhoto || isDeceased || isBiennialExpired) return;
    try {
      generateAndDownloadOfficialRgCard({
        ...dog,
        photoUrl: dogPhoto,
        rgNumber: formattedRgcNumber,
        rgcIssuedAt: issuedAt,
        rgcExpiresAt: expiresAt,
        rgcSecurityHash: securityHash,
      });
    } catch (err) {
      console.error('Erro ao gerar documento PDF:', err);
    }
  };

  const handleCopySecurityHash = () => {
    if (securityHash) {
      navigator.clipboard.writeText(securityHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  return (
    <div className={`space-y-4 ${isModal ? '' : 'w-full'}`}>
      {/* Print Specific CSS Style Injection (Garante estritamente 1 folha A4 sem duplicações) */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html, body {
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden !important;
          }
          #rgc-printable-zone, #rgc-printable-zone * {
            visibility: visible !important;
          }
          #rgc-printable-zone {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            max-width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            background: #ffffff !important;
            padding: 28mm 14.4mm 0 14.4mm !important;
            margin: 0 auto !important;
            display: flex !important;
            flex-direction: row !important;
            align-items: flex-start !important;
            justify-content: center !important;
            gap: 10mm !important;
            box-sizing: border-box !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-after: avoid !important;
            break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            z-index: 999999 !important;
          }
          .rgc-card-box {
            width: 85.6mm !important;
            height: 54mm !important;
            min-width: 85.6mm !important;
            min-height: 54mm !important;
            max-width: 85.6mm !important;
            max-height: 54mm !important;
            display: flex !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* BLOCK 1: Animal Deceased Rule */}
      {isDeceased && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl flex items-start gap-3 text-rose-900 dark:text-rose-200">
          <Heart className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Emissão de Documento Bloqueada: Registro de Óbito</h4>
            <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
              Este animal possui encerramento de conta por motivo de falecimento registrado em{' '}
              <strong>{dog.deceasedDate ? formatDateBR(dog.deceasedDate) : 'data anterior'}</strong>.
              Em conformidade com as diretrizes cadastrais de segurança biológica, a emissão e impressão de novos RGCs estão canceladas.
            </p>
          </div>
        </div>
      )}

      {/* BLOCK 2: Mandatory Photo Rule (Bloqueio Sério de Emissão Sem Foto) */}
      {!isDeceased && !hasPhoto && (
        <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-700 shadow-xl space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
              <Camera className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                Identificação Biométrica Pendente
              </span>
              <h4 className="font-bold text-base font-heading">
                Fotografia 3x4 Obrigatória para Emissão do RGC
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                Para assegurar a autenticidade jurídica, integridade cadastral e padrão oficial anti-fraude do Registro Geral Canino (RGC), é indispensável o envio de uma fotografia real e nítida do animal na proporção 3x4.
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-end">
            <button
              onClick={onOpenEditPhoto}
              className="px-5 py-2.5 bg-gradient-to-r from-[#E07A5F] to-amber-500 hover:from-[#d66e53] hover:to-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Enviar Foto 3x4 no Cadastro do Animal</span>
            </button>
          </div>
        </div>
      )}

      {/* BLOCK 3: Biennial Life Proof (2 Years) Rule */}
      {!isDeceased && hasPhoto && isBiennialExpired && (
        <div className="p-5 bg-orange-50 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-800 rounded-2xl space-y-3 text-orange-950 dark:text-orange-200">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm">Prova de Vida Bienal Obrigatória (Ciclo de 2 Anos Vencido)</h4>
              <p className="text-xs text-orange-800 dark:text-orange-300 leading-relaxed">
                O Registro Geral Canino foi emitido há mais de 2 anos ({formattedIssuedDate}). Para revalidar e emitir novas vias do documento, o tutor responsável deve realizar a Atualização Cadastral e Prova de Vida Bienal confirmando que o cão segue ativo e com dados biométricos em dia.
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              onClick={onRenewBiennialLifeProof || onOpenEditPhoto}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Realizar Prova de Vida Bienal & Revalidar RGC</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Action Bar (when document is valid) */}
      {!isDeceased && hasPhoto && !isBiennialExpired && (
        <div className="no-print flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block font-heading">
                SISTEMA NACIONAL CANISTECH • REGISTRO PARTICULAR DE IDENTIFICAÇÃO E BIOMETRIA CANINA (RGC)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Autenticidade SHA-256: {securityHash.slice(0, 16)}...
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Tab Selector */}
            <div className="hidden sm:flex items-center bg-slate-200/80 dark:bg-slate-700/80 p-0.5 rounded-xl text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <button
                onClick={() => setActiveTab('both')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  activeTab === 'both' ? 'bg-white dark:bg-slate-900 shadow-xs text-slate-900 dark:text-white' : ''
                }`}
              >
                Frente e Verso
              </button>
              <button
                onClick={() => setActiveTab('front')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  activeTab === 'front' ? 'bg-white dark:bg-slate-900 shadow-xs text-slate-900 dark:text-white' : ''
                }`}
              >
                Frente
              </button>
              <button
                onClick={() => setActiveTab('back')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  activeTab === 'back' ? 'bg-white dark:bg-slate-900 shadow-xs text-slate-900 dark:text-white' : ''
                }`}
              >
                Verso
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              title="Imprimir Cédula em tamanho exato de carteira"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Cédula</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E07A5F] hover:bg-[#d66e53] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              title="Baixar em formato PDF vetorial"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF A4</span>
            </button>

            {isModal && onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* THE OFFICIAL RGC CARD (ISO ID-1: 85.6mm x 54mm Proportion) */}
      {/* ========================================================================= */}
      {!isDeceased && hasPhoto && !isBiennialExpired && (
        <div
          id="rgc-printable-zone"
          className="select-none flex flex-wrap items-center justify-center gap-6 py-2 transition-all"
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        >
          {/* --------------------------------------------------------------------- */}
          {/* FRENTE DO DOCUMENTO */}
          {/* --------------------------------------------------------------------- */}
          {(activeTab === 'both' || activeTab === 'front') && (
            <div
              className="rgc-card-box relative w-[340px] sm:w-[390px] h-[215px] sm:h-[246px] rounded-2xl overflow-hidden border-2 border-slate-900/40 shadow-xl bg-white text-slate-900 flex flex-col justify-between p-2.5 transition-all"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, #ffffff 0%, #f1f5f9 60%, #e2e8f0 100%)',
              }}
            >
              {/* Moldura Interna Dupla de Segurança */}
              <div className="absolute inset-1.5 rounded-xl border border-slate-900/20 pointer-events-none"></div>

              {/* Marca d'água da Bandeira do Brasil (4% de opacidade) */}
              <BrazilFlagWatermark />

              {/* Marca d'água Diagonal Sutil Anti-Clonagem */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-[0.05] select-none z-0">
                <span className="text-xl sm:text-2xl font-black uppercase tracking-widest -rotate-25 whitespace-nowrap text-slate-900">
                  CANISTECH OFICIAL • PROIBIDA REPRODUÇÃO
                </span>
              </div>

              {/* Cabeçalho Oficial: SISTEMA CANISTECH */}
              <div className="relative z-10 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white px-2.5 py-1.5 rounded-lg shadow-xs flex items-center justify-between border-b-2 border-[#E07A5F]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-[#E07A5F] to-amber-400 p-0.5 flex items-center justify-center font-black text-[9px] text-slate-950 shadow-xs shrink-0">
                    CT
                  </div>
                  <div className="leading-tight">
                    <p className="text-[7px] sm:text-[8px] uppercase tracking-wider font-extrabold text-amber-400">
                      CANISTECH DIGITAL SYSTEMS • IDENTIFICAÇÃO E BIOMETRIA
                    </p>
                    <p className="text-[5.8px] sm:text-[6.5px] uppercase font-semibold text-slate-200 tracking-tight">
                      SISTEMA NACIONAL CANISTECH • REGISTRO PARTICULAR DE IDENTIFICAÇÃO E BIOMETRIA CANINA (RGC)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[6.5px] font-mono text-emerald-400 font-bold uppercase block">
                    HOMOLOGADO
                  </span>
                  <span className="text-[6px] text-slate-400">CFMV/BR</span>
                </div>
              </div>

              {/* Corpo da Frente: Foto 3x4 Real + Grid de Dados */}
              <div className="relative z-10 flex-1 grid grid-cols-12 gap-2 pt-2 items-center">
                {/* Coluna Esquerda (4 cols): Foto 3x4 Proporcional */}
                <div className="col-span-4 flex flex-col items-center justify-center">
                  <div className="relative w-[82px] sm:w-[94px] h-[106px] sm:h-[120px] rounded-lg overflow-hidden border-2 border-slate-700 bg-slate-200 shadow-sm shrink-0">
                    <img
                      src={dogPhoto}
                      alt={dog.name}
                      className="w-full h-full object-cover select-none pointer-events-none rounded-lg"
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                    />
                    {/* Selo de Verificação Sobreposto na Base da Foto */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-900/70 to-transparent py-1 px-1 text-center">
                      <div className="flex items-center justify-center gap-0.5 text-[6.5px] sm:text-[7.5px] font-bold text-emerald-400 tracking-wider">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                        <span>BIOMETRIA VERIFICADA</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coluna Direita (8 cols): Dados Alinhados com Quebra Suave */}
                <div className="col-span-8 flex flex-col justify-between h-full space-y-1.5 pr-1">
                  {/* Nome e RGC */}
                  <div className="grid grid-cols-12 gap-1 pb-1 border-b border-slate-300">
                    <div className="col-span-7">
                      <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider block">
                        Nome do Animal
                      </span>
                      <p className="text-[11px] sm:text-[13px] font-black text-slate-950 uppercase truncate leading-tight font-heading">
                        {dog.name}
                      </p>
                    </div>
                    <div className="col-span-5 text-right">
                      <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider block">
                        Nº Registro (RGC)
                      </span>
                      <p className="text-[10px] sm:text-[11px] font-mono font-extrabold text-[#E07A5F] tracking-tight truncate leading-tight">
                        {formattedRgcNumber}
                      </p>
                    </div>
                  </div>

                  {/* Raça e Sexo/Condição (com Quebra de até 2 Linhas sem Cortar Texto) */}
                  <div className="grid grid-cols-12 gap-1 pb-1 border-b border-slate-300 items-start">
                    <div className="col-span-7">
                      <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider block">
                        Raça / Linhagem
                      </span>
                      <p className="text-[9px] sm:text-[10px] font-bold text-slate-900 leading-tight line-clamp-2 break-words">
                        {dog.breed}
                      </p>
                    </div>
                    <div className="col-span-5 text-right">
                      <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider block">
                        Sexo / Condição
                      </span>
                      <p className="text-[9px] sm:text-[10px] font-bold text-slate-900 truncate leading-tight">
                        {dog.gender} ({dog.neutered ? 'Castrado' : 'Intacto'})
                      </p>
                    </div>
                  </div>

                  {/* Data de Nascimento e Fase Biológica (SEM PESO/ESCORE) */}
                  <div className="grid grid-cols-12 gap-1 pb-1 border-b border-slate-300">
                    <div className="col-span-7">
                      <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider block">
                        Data de Nascimento
                      </span>
                      <p className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-900 leading-tight">
                        {dog.birthDate || '--/--/----'}
                      </p>
                    </div>
                    <div className="col-span-5 text-right">
                      <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider block">
                        Fase Biológica
                      </span>
                      <p className="text-[9px] sm:text-[9.5px] font-bold text-slate-800 uppercase leading-tight">
                        {dog.lifeStage || (dog.ageYears < 1 ? 'Filhote' : 'Adulto')} ({dog.ageYears}a)
                      </p>
                    </div>
                  </div>

                  {/* Microchip ISO em Destaque */}
                  <div className="p-1 sm:p-1.5 bg-slate-100 rounded-lg border border-slate-300 flex items-center justify-between">
                    <div>
                      <span className="text-[7px] uppercase font-bold text-slate-500 tracking-wider block">
                        Microchip Padrão ISO 11784/11785
                      </span>
                      <p className="text-[9.5px] sm:text-[10.5px] font-mono font-extrabold text-slate-950 tracking-wider truncate">
                        {dog.microchip || 'NÃO MICROCHIPADO'}
                      </p>
                    </div>
                    <div className="p-1 rounded bg-emerald-100 text-emerald-800 text-[8px] font-bold shrink-0">
                      ISO OK
                    </div>
                  </div>
                </div>
              </div>

              {/* Rodapé da Frente: Hash Criptográfico e Base Legal */}
              <div className="relative z-10 pt-1 border-t border-slate-300 flex items-center justify-between text-[7px] sm:text-[8px] text-slate-500 leading-tight">
                <span className="font-mono truncate max-w-[200px]">
                  AUTH: {securityHash.slice(0, 20)}
                </span>
                <span className="font-semibold text-slate-700 uppercase">
                  VÁLIDO EM TODO O TERRITÓRIO NACIONAL
                </span>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* VERSO DO DOCUMENTO */}
          {/* --------------------------------------------------------------------- */}
          {(activeTab === 'both' || activeTab === 'back') && (
            <div
              className="rgc-card-box relative w-[340px] sm:w-[390px] h-[215px] sm:h-[246px] rounded-2xl overflow-hidden border-2 border-slate-900/40 shadow-xl bg-white text-slate-900 flex flex-col justify-between p-2.5 transition-all"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, #ffffff 0%, #f8fafc 60%, #e2e8f0 100%)',
              }}
            >
              {/* Moldura Interna Dupla de Segurança */}
              <div className="absolute inset-1.5 rounded-xl border border-slate-900/20 pointer-events-none"></div>

              {/* Marca d'água da Bandeira do Brasil (4% de opacidade) */}
              <BrazilFlagWatermark />

              {/* Marca d'água Diagonal Sutil */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-[0.05] select-none z-0">
                <span className="text-xl sm:text-2xl font-black uppercase tracking-widest -rotate-25 whitespace-nowrap text-slate-900">
                  CANISTECH OFICIAL • PROIBIDA REPRODUÇÃO
                </span>
              </div>

              {/* Faixa Superior do Verso */}
              <div className="relative z-10 bg-slate-900 text-white px-2.5 py-1.5 rounded-lg shadow-xs flex items-center justify-between border-b-2 border-emerald-500">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[7.5px] sm:text-[8.5px] uppercase font-bold tracking-wider text-slate-200">
                    CANISTECH DIGITAL SYSTEMS • DADOS DO TUTOR &amp; VERIFICAÇÃO
                  </span>
                </div>
                <span className="text-[7px] font-mono text-emerald-400 font-bold">
                  AUTENTICAÇÃO REAL
                </span>
              </div>

              {/* Dados do Verso: Tutor, Contato, Localidade, Tipo Sanguíneo e QR Code Real */}
              <div className="relative z-10 flex-1 grid grid-cols-12 gap-2 pt-2 items-start">
                {/* Coluna Esquerda (8 cols): Tutor, Emergência, Emissão e Validade */}
                <div className="col-span-8 space-y-1.5">
                  {/* Tutor */}
                  <div className="pb-1 border-b border-slate-200">
                    <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider block">
                      Tutor(a) Titular Responsável
                    </span>
                    <p className="text-[10px] sm:text-[11.5px] font-bold text-slate-900 uppercase truncate leading-tight">
                      {dog.tutorName}
                    </p>
                  </div>

                  {/* Contato e Localidade */}
                  <div className="grid grid-cols-2 gap-1 pb-1 border-b border-slate-200">
                    <div>
                      <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider block">
                        Contato de Emergência
                      </span>
                      <p className="text-[9.5px] sm:text-[10.5px] font-mono font-bold text-slate-900 truncate leading-tight">
                        {dog.tutorPhone}
                      </p>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider block">
                        Localidade (Cidade/UF)
                      </span>
                      <p className="text-[9.5px] sm:text-[10.5px] font-bold text-slate-900 truncate leading-tight">
                        {dog.city} / {dog.state}
                      </p>
                    </div>
                  </div>

                  {/* Tipo Sanguíneo (CONDICIONAL: só exibe se preenchido e não 'Não informado') */}
                  {dog.bloodType &&
                    dog.bloodType !== 'Não informado' &&
                    dog.bloodType.trim() !== '' && (
                      <div className="pb-1 border-b border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider block">
                            Tipo Sanguíneo Canino
                          </span>
                          <p className="text-[9.5px] sm:text-[10px] font-bold text-[#E07A5F] truncate leading-tight">
                            {dog.bloodType}
                          </p>
                        </div>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                          Fator Biológico
                        </span>
                      </div>
                    )}

                  {/* Data de Emissão e Validade (1 Ano) */}
                  <div className="grid grid-cols-2 gap-1 pt-0.5">
                    <div>
                      <span className="text-[7.5px] uppercase font-bold text-slate-500 tracking-wider block">
                        Emissão (1ª Via)
                      </span>
                      <p className="text-[9.5px] font-mono font-bold text-slate-900 leading-tight">
                        {formattedIssuedDate}
                      </p>
                    </div>
                    <div>
                      <span className="text-[7.5px] uppercase font-bold text-emerald-700 tracking-wider block">
                        Validade (1 Ano)
                      </span>
                      <p className="text-[9.5px] font-mono font-extrabold text-emerald-800 leading-tight">
                        {formattedExpiresDate}
                      </p>
                    </div>
                  </div>

                  <p className="text-[7px] text-slate-400 italic leading-tight">
                    * Renovação e Prova de Vida Bienal obrigatória a cada 2 anos.
                  </p>
                </div>

                {/* Coluna Direita (4 cols): QR Code Real com Link Seguro para Dossiê com Login */}
                <div className="col-span-4 flex flex-col items-center justify-center p-1 bg-white rounded-xl border border-slate-300 shadow-xs">
                  <div className="p-1 rounded-lg bg-slate-50 border border-slate-200">
                    <QrCodeSvg
                      value={emergencyScanUrl}
                      size={68}
                      className="mx-auto"
                      title={`Scan de Emergência RGC: ${dog.name}`}
                    />
                  </div>
                  <span className="text-[7px] sm:text-[8px] font-black uppercase text-slate-800 tracking-wider mt-1 text-center block">
                    SCAN EMERGÊNCIA
                  </span>
                  <span className="text-[6px] text-slate-400 text-center leading-tight">
                    Dossiê do Proprietário
                  </span>
                </div>
              </div>

              {/* Zona MRZ (Machine Readable Zone) Perfeitamente Contida */}
              <div className="relative z-10 mt-1 bg-slate-100 p-1.5 rounded-lg border border-slate-300">
                <div className="font-mono text-[7px] sm:text-[8px] tracking-widest text-slate-700 font-bold leading-tight break-all">
                  I&lt;BRACANISTECH&lt;&lt;{formattedRgcNumber.replace(/[^A-Z0-9]/g, '')}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
                  <br />
                  {dog.name.toUpperCase().replace(/[^A-Z]/g, '')}&lt;&lt;DOGOS&lt;&lt;WWW.CANISTECH.COM.BR&lt;&lt;&lt;&lt;&lt;
                </div>
                <p className="text-[6.5px] text-slate-500 text-center mt-1 uppercase font-medium leading-none truncate">
                  Documento Oficial de Biometria Canina • CanisTech Security Guard
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security Hash Copy Tool */}
      {!isDeceased && hasPhoto && !isBiennialExpired && securityHash && (
        <div className="no-print p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400">
              Código de Autenticação Anti-Clonagem:
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {securityHash}
            </span>
          </div>
          <button
            onClick={handleCopySecurityHash}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:text-slate-900 text-[11px] font-semibold transition-colors"
          >
            {copiedHash ? '✓ Código Copiado!' : 'Copiar Hash'}
          </button>
        </div>
      )}

      {/* Modal de Pré-Visualização de Impressão Embutido (WebView / Electron / Navegador) */}
      {showPrintPreviewModal && previewBlobUrl && (
        <div className="fixed inset-0 z-[90] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                  SISTEMA NACIONAL CANISTECH • REGISTRO PARTICULAR DE IDENTIFICAÇÃO E BIOMETRIA CANINA (RGC)
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                  Pré-Visualização de Impressão • Cédula RGC (ISO ID-1 em Folha A4)
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerIframePrint}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Agora</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="px-4 py-2 bg-[#E07A5F] hover:bg-[#d66e53] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar PDF A4</span>
                </button>
                <button
                  type="button"
                  onClick={handleClosePrintPreview}
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="Fechar Pré-Visualização"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <iframe
              ref={previewIframeRef}
              src={previewBlobUrl}
              title="Pré-Visualização de Impressão RGC A4"
              className="w-full h-[78vh] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100"
            />
          </div>
        </div>
      )}
    </div>
  );
};
