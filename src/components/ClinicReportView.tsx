import React, { useState } from 'react';
import { DogProfile, VaccineRecord } from '../types';
import {
  FileText,
  Send,
  Mail,
  Download,
  Copy,
  CheckCircle2,
  Lock,
  ShieldAlert,
  Dna,
  Activity,
  Heart,
  ChevronLeft,
  ExternalLink,
  Printer,
  FileDown,
  Eye,
  Sliders,
  Check,
  Calendar,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  downloadPetClinicReportPDF,
  generatePetClinicReportPDF,
  generateVetEmailMailtoUrl,
  GeneratedPDFResult,
} from '../utils/pdfReportGenerator';

interface ClinicReportViewProps {
  dog: DogProfile;
  vaccines: VaccineRecord[];
  onBack: () => void;
}

export const ClinicReportView: React.FC<ClinicReportViewProps> = ({
  dog,
  vaccines,
  onBack,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'3m' | '6m' | 'all'>('6m');
  const [vetPhone, setVetPhone] = useState<string>('(11) 98452-1920');
  const [vetEmail, setVetEmail] = useState<string>('dr.thiago.ramos@hospitalpetsp.com.br');
  const [vetName, setVetName] = useState<string>('Dr. Thiago Ramos');
  const [clinicName, setClinicName] = useState<string>('Hospital Veterinário Pet Care SP');
  const [additionalNotes, setAdditionalNotes] = useState<string>(
    'Encaminho o prontuário para consulta de rotina, avaliação cardiológica e revisão do calendário de vacinas.'
  );

  // Inclusion options for PDF
  const [includeGenomics, setIncludeGenomics] = useState<boolean>(true);
  const [includeVaccines, setIncludeVaccines] = useState<boolean>(true);
  const [includeAnamnese, setIncludeAnamnese] = useState<boolean>(true);

  // Modals & UI States
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [showExportPdfModal, setShowExportPdfModal] = useState<boolean>(false);
  const [emailModalTab, setEmailModalTab] = useState<'form' | 'preview'>('form');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailSentReceipt, setEmailSentReceipt] = useState<{
    protocol: string;
    sentAt: string;
    to: string;
    pdfFilename: string;
  } | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const secureLink = `https://canistech.app/v/${dog.name.toLowerCase()}-9942?token=e8a4d79c&exp=72h`;

  const copySecureLink = () => {
    navigator.clipboard.writeText(secureLink);
    setCopiedLink(true);
    showToast('Link do prontuário copiado com sucesso! Válido por 72h.');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Direct PDF Download Handler
  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    showToast(`Gerando PDF A4 oficial do prontuário para ${dog.name}...`);
    try {
      const result = downloadPetClinicReportPDF(dog, vaccines, {
        period: selectedPeriod,
        recipientVetName: vetName,
        recipientClinic: clinicName,
        includeGenomics,
        includeVaccines,
        includeAnamnese,
      });
      setTimeout(() => {
        setIsGeneratingPdf(false);
        showToast(`Download concluído: ${result.filename} (${result.fileSizeFormatted})`);
      }, 500);
    } catch (err) {
      console.error(err);
      setIsGeneratingPdf(false);
      showToast('Ocorreu um erro ao gerar o arquivo PDF. Tente novamente.');
    }
  };

  // Launch WhatsApp with structured clinical summary and secure link
  const handleLaunchWhatsApp = () => {
    const cleanNumber = vetPhone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Olá Dr(a). ${vetName || 'Veterinário(a)'}, aqui está o Prontuário Clínico Digital do *${dog.name}* (${dog.breed}, ${dog.ageYears}a ${dog.ageMonths}m, ${dog.currentWeight}kg) para nossa consulta veterinária.\n\n` +
      `📋 *Resumo:* Vacinas V10 e Raiva em dia (Zoetis/Nobivac), antiparasitário ativo. Sem alergias a antibióticos. Escore corporal WSAVA ${dog.bcsScore}/9 (Ideal). Screening CanisGenomics livre de displasia (Grau A).\n\n` +
      `📎 *Dossiê Completo em PDF A4 & Laudos:* ${secureLink}\n\n` +
      `Enviado por: ${dog.tutorName} (${dog.tutorPhone})`
    );
    const url = cleanNumber ? `https://wa.me/55${cleanNumber}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(url, '_blank');
    showToast('WhatsApp iniciado com a mensagem clínica formatada!');
  };

  // Dispatch Email to Veterinarian (Simulated with transmission receipt and PDF attached)
  const handleSendEmailToVet = () => {
    if (!vetEmail || !vetEmail.includes('@')) {
      showToast('Por favor, informe um endereço de e-mail válido para o veterinário.');
      return;
    }

    setIsSendingEmail(true);
    showToast('Processando e transmitindo prontuário com anexo PDF...');

    setTimeout(() => {
      setIsSendingEmail(false);
      const generated = generatePetClinicReportPDF(dog, vaccines, {
        period: selectedPeriod,
        recipientVetName: vetName,
        recipientClinic: clinicName,
        includeGenomics,
        includeVaccines,
        includeAnamnese,
      });

      const receipt = {
        protocol: `ICP-PET-BR#${Math.floor(100000 + Math.random() * 900000)}`,
        sentAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        to: vetEmail,
        pdfFilename: generated.filename,
      };

      setEmailSentReceipt(receipt);
      showToast(`Prontuário e anexo PDF enviados com sucesso para ${vetEmail}!`);
    }, 1200);
  };

  // Open in default email client (Gmail, Outlook, etc.) via mailto:
  const handleOpenNativeMailto = () => {
    const cleanDogName = dog.name.replace(/[^a-zA-Z0-9]/g, '_');
    const pdfFilename = `Prontuario_Clinico_${cleanDogName}.pdf`;

    const mailtoUrl = generateVetEmailMailtoUrl({
      vetEmail,
      vetName,
      dogName: dog.name,
      dogBreed: dog.breed,
      tutorName: dog.tutorName,
      tutorPhone: dog.tutorPhone,
      secureLink,
      pdfFilename,
    });

    // Also download PDF so user can attach it directly if client opens
    handleDownloadPdf();
    window.location.href = mailtoUrl;
    showToast('Cliente de e-mail aberto e cópia do PDF baixada para anexar!');
  };

  // Browser Print handler
  const handlePrintReport = () => {
    window.print();
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

      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-semibold transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Voltar ao DogOS</span>
        </button>
        <div className="flex items-center gap-2 text-slate-500 bg-slate-100 px-3 py-1 rounded-full text-[11px] font-mono">
          <Lock className="w-3.5 h-3.5 text-emerald-700" />
          <span>ID Prontuário: CT-9942-BR-2025</span>
          <span>•</span>
          <span>ICP-Brasil Pet #884A-91C</span>
        </div>
      </div>

      {/* Hero Dispatch Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative overflow-hidden space-y-4 print:border-none print:shadow-none print:p-0">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-full">
                Padrão CFMV Art. 12/2021
              </span>
              <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Sincronizado em tempo real
              </span>
              <span className="text-[11px] bg-orange-50 text-orange-800 font-bold px-2.5 py-0.5 rounded-full">
                LGPD Sanitizado
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-heading tracking-tight">
              Prontuário & Relatório de Saúde para Consulta Veterinária
            </h1>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              Dossiê clínico compilado com imunização, biometria evolutiva, histórico genético CanisGenomics e notas de anamnese para envio direto ao Médico-Veterinário em formato PDF ou e-mail.
            </p>
          </div>

          {/* Quick Sharing & Export CTAs */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto shrink-0 print:hidden">
            {/* Primary Action: Export PDF */}
            <button
              onClick={() => setShowExportPdfModal(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-transform active:scale-95 whitespace-nowrap"
              title="Configurar e baixar o prontuário em formato PDF"
            >
              <FileDown className="w-4 h-4 text-orange-400" />
              <span>Exportar PDF</span>
            </button>

            {/* Email to Veterinarian */}
            <button
              onClick={() => {
                setEmailSentReceipt(null);
                setShowEmailModal(true);
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-transform active:scale-95 whitespace-nowrap"
              title="Enviar prontuário e anexo PDF diretamente para o e-mail do veterinário"
            >
              <Mail className="w-4 h-4" />
              <span>Enviar PDF por E-mail</span>
            </button>

            {/* WhatsApp Quick Dispatch */}
            <button
              onClick={handleLaunchWhatsApp}
              className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition-colors shrink-0"
              title="Compartilhar resumo clínico e link no WhatsApp"
            >
              <Send className="w-4 h-4 text-emerald-600" />
            </button>

            {/* Direct Quick PDF Download */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors shrink-0 disabled:opacity-50"
              title="Download direto do PDF A4 Oficial"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Copy Secure Link */}
            <button
              onClick={copySecureLink}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors shrink-0"
              title="Copiar Link Seguro com Token"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Regulatory Disclaimer Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2 text-[11px] text-slate-500 print:text-[10px]">
          <span>
            <strong>Sigilo Médico-Veterinário:</strong> Este documento possui valor legal de suporte diagnóstico e registro de anamnese perante a Resolução CFMV nº 1321.
          </span>
          <span className="text-slate-400 font-mono">Expiração do link seguro: 72 horas • Assinatura ICP-Pet</span>
        </div>
      </div>

      {/* Main Grid: Patient & Medical Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Patient Profile & Anamnese (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Patient Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex gap-4 items-start">
              <img
                src={dog.photoUrl}
                alt={dog.name}
                className="w-20 h-20 rounded-2xl object-cover shadow-xs border border-slate-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900 font-heading truncate">{dog.name}</h2>
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-700 font-semibold">
                    {dog.ageYears}a {dog.ageMonths}m
                  </span>
                </div>
                <p className="text-xs text-slate-500">{dog.breed}</p>
                <div className="mt-2 space-y-0.5 text-[11px] font-mono text-slate-600">
                  <p>Microchip ISO: <strong>{dog.microchip}</strong></p>
                  <p>RG Pet Oficial: <strong>{dog.rgNumber}</strong></p>
                  <p>Status: <strong>{dog.gender} ({dog.neutered ? 'Castrado' : 'Não Castrado'})</strong></p>
                </div>
              </div>
            </div>

            {/* Quick Diagnostic Metrics */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Peso Atual</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{dog.currentWeight} kg</span>
                <span className="block text-[10px] text-emerald-700 font-medium">+0.2kg (Estável)</span>
              </div>
              <div className="border-l border-slate-200">
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Escore ECC</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{dog.bcsScore} / 9</span>
                <span className="block text-[10px] text-emerald-700 font-semibold">Peso Ideal</span>
              </div>
              <div className="border-l border-slate-200">
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Tipo Sanguíneo</span>
                <span className="text-sm font-bold text-[#E07A5F] font-mono">{dog.bloodType || 'DEA 1.1'}</span>
                <span className="block text-[10px] text-slate-500">Doador Universal</span>
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-600">
              <p><strong>Tutora:</strong> {dog.tutorName} (Médica)</p>
              <p><strong>Contato Emergência:</strong> {dog.tutorPhone}</p>
              <p><strong>E-mail Cadastrado:</strong> {dog.tutorEmail || 'camila.tutor@canistech.com.br'}</p>
              <p><strong>Clínico Anterior:</strong> Dr. Thiago Ramos (CRMV-SP 24.112)</p>
            </div>
          </div>

          {/* Anamnese Executiva */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#E07A5F]" />
              <span>Anamnese Executiva para o Clínico</span>
            </h3>

            {/* Allergies */}
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl space-y-1 text-xs">
              <p className="font-bold text-red-900">Sensibilidades & Alergias Conhecidas:</p>
              <ul className="text-red-800 list-disc list-inside space-y-0.5 text-[11px]">
                <li>Sem alergias a Penicilinas, Cefalosporinas ou AINEs.</li>
                <li><strong>Sensibilidade cutânea por DAPP leve</strong> no verão passado (reação a talco antiparasitário em 2024).</li>
              </ul>
            </div>

            {/* Nutrition */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-xs">
              <p className="font-bold text-slate-900">Regime Nutricional Atual:</p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Ração Super Premium Especial Canina (Frango e Arroz Integral): <strong>{dog.dietGramsPerDay || 420}g/dia</strong> dividida em {dog.dietPortions || 2} porções (08:00 e 19:30). Suplementação articular manipulada: <strong>{dog.supplements || 'Condroitina + Glicosamina + UC-II'}</strong> matinal diária.
              </p>
            </div>

            {/* Clinical Observations */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Intercorrências Recentes Documentadas:</span>
                <span className="text-slate-400 font-normal text-[11px]">Há 12 dias</span>
              </div>
              <p className="text-slate-600 text-[11px] italic leading-relaxed">
                "Episódio isolado de êmese matinal com presença de grama e suco gástrico. Sem repetição. Fezes Bristol Canino Escala Grau 2 (cilíndricas, firmes, sem muco). Consumo hídrico ~{dog.dailyWaterMl || 1800}mL/dia."
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Immunization Table & Lab / Genetics (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Master Vaccine Table */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Controle Imunológico & Antiparasitário
                </h3>
                <p className="text-[11px] text-slate-500">Histórico de lotes, revacinações e fabricantes (incluído no PDF exportado)</p>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                ✓ 100% Em Dia
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[11px]">
                    <th className="py-2 px-2.5 font-semibold rounded-l-lg">Profilaxia</th>
                    <th className="py-2 px-2.5 font-semibold">Fabricante / Lote</th>
                    <th className="py-2 px-2.5 font-semibold">Última Dose</th>
                    <th className="py-2 px-2.5 font-semibold">Próximo Reforço</th>
                    <th className="py-2 px-2.5 font-semibold rounded-r-lg text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {vaccines.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2 px-2.5 font-bold text-slate-900">{v.name}</td>
                      <td className="py-2 px-2.5 text-[11px] font-mono text-slate-500">
                        <div>{v.manufacturer}</div>
                        <div className="text-[10px] text-slate-400">Lot: {v.lot}</div>
                      </td>
                      <td className="py-2 px-2.5 font-mono text-[11px]">{v.lastDate}</td>
                      <td className="py-2 px-2.5 font-mono text-[11px] font-semibold text-[#E07A5F]">
                        {v.nextDate}
                      </td>
                      <td className="py-2 px-2.5 text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            v.status === 'warning'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {v.daysRemaining <= 30 ? `Em ${v.daysRemaining}d` : 'Válida'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Genomic Screening & Lab Routine (Bento 2-Col) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CanisGenomics */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-emerald-700 uppercase">
                  <span>Painel Genômico</span>
                  <Dna className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-slate-900">Screening CanisGenomics</h4>
                <div className="space-y-1 text-[11px]">
                  <div className="p-1.5 bg-slate-50 rounded-lg flex justify-between">
                    <span>Displasia Coxofemoral (OFA):</span>
                    <strong className="text-emerald-700">Grau A (Excelente)</strong>
                  </div>
                  <div className="p-1.5 bg-slate-50 rounded-lg flex justify-between">
                    <span>Atrofia de Retina (PRA):</span>
                    <strong className="text-emerald-700">Clear / Não Portador</strong>
                  </div>
                  <div className="p-1.5 bg-slate-50 rounded-lg flex justify-between">
                    <span>Ictiose Canina:</span>
                    <strong className="text-emerald-700">Livre Homozigoto</strong>
                  </div>
                </div>
              </div>
              <div className="pt-2 text-[10px] text-slate-400 flex justify-between items-center">
                <span>Lab: PetGenetics BR</span>
                <span className="text-slate-900 font-semibold cursor-pointer hover:underline">Laudo Homologado</span>
              </div>
            </div>

            {/* Lab & Cardiology */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                  <span>Exames Recentes</span>
                  <Heart className="w-4 h-4 text-red-500" />
                </div>
                <h4 className="font-bold text-xs text-slate-900">Hemograma & ECG</h4>
                <div className="space-y-1 text-[11px]">
                  <div className="p-1.5 bg-slate-50 rounded-lg flex justify-between">
                    <span>Hemograma Completo:</span>
                    <strong className="text-emerald-700">Normal</strong>
                  </div>
                  <div className="p-1.5 bg-slate-50 rounded-lg flex justify-between">
                    <span>Creatinina / ALT:</span>
                    <strong className="text-emerald-700">1.1 mg/dL (Normal)</strong>
                  </div>
                  <div className="p-1.5 bg-slate-50 rounded-lg flex justify-between">
                    <span>Eletrocardiograma:</span>
                    <strong className="text-emerald-700">Ritmo Sinusal Regular</strong>
                  </div>
                </div>
              </div>
              <div className="pt-2 text-[10px] text-slate-400 flex justify-between items-center">
                <span>Lab: VetPat Análises</span>
                <span className="text-slate-900 font-semibold cursor-pointer hover:underline">Ver Exames</span>
              </div>
            </div>
          </div>

          {/* Interactive Fast Dispatch Console */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Disparo Rápido para a Clínica & Veterinário
                </h3>
                <p className="text-[11px] text-slate-500">Envie o dossiê formatado direto no WhatsApp ou e-mail do médico veterinário</p>
              </div>
              <div className="flex bg-white p-1 rounded-lg border border-slate-200 text-[11px] font-medium">
                {(['3m', '6m', 'all'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPeriod(p)}
                    className={`px-2.5 py-0.5 rounded ${
                      selectedPeriod === p ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p === '3m' ? '3 Meses' : p === '6m' ? '6 Meses' : 'Vitalício'}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs & Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
              <div className="md:col-span-5">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Telefone / WhatsApp do Veterinário:
                </label>
                <input
                  type="text"
                  value={vetPhone}
                  onChange={(e) => setVetPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  E-mail do Médico Veterinário:
                </label>
                <input
                  type="email"
                  value={vetEmail}
                  onChange={(e) => setVetEmail(e.target.value)}
                  placeholder="veterinario@clinica.com.br"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              <div className="md:col-span-3 flex items-end gap-1.5">
                <button
                  onClick={handleLaunchWhatsApp}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-xs"
                  title="Disparar resumo pelo WhatsApp"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-xs"
                  title="Enviar prontuário e PDF por e-mail"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>E-mail</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal 1: Exportar Prontuário em Formato PDF */}
      {showExportPdfModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 md:p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-900 text-white">
                  <FileDown className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-heading">
                    Exportar Prontuário em Formato PDF
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gerador de arquivo PDF oficial padrão A4 para o paciente <strong>{dog.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExportPdfModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Document Specs Card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700 font-bold text-xs shrink-0">
                  PDF
                </div>
                <div>
                  <p className="font-bold text-slate-900 font-mono text-[11px]">
                    Prontuario_Clinico_{dog.name.replace(/[^a-zA-Z0-9]/g, '_')}_2026.pdf
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Padrão CFMV Art. 12/2021 • LGPD Sanitizado • ~180 KB
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px] shrink-0 border border-emerald-300">
                ✓ Pronto para Envio
              </span>
            </div>

            {/* Export Settings */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Período do Histórico Clínico a Incluir:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '3m', label: 'Últimos 3 Meses' },
                    { id: '6m', label: 'Últimos 6 Meses' },
                    { id: 'all', label: 'Histórico Vitalício' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPeriod(p.id as any)}
                      className={`py-2 px-3 rounded-xl border text-center transition-all ${
                        selectedPeriod === p.id
                          ? 'border-slate-900 bg-slate-900 text-white font-bold'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sections to include */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Módulos Inclusos no Documento PDF:
                </label>
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeVaccines}
                      onChange={(e) => setIncludeVaccines(e.target.checked)}
                      className="rounded text-slate-900"
                    />
                    <span>
                      <strong>Tabela de Imunização:</strong> Lotes, fabricantes e datas de reforço de vacinas e antiparasitários
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeAnamnese}
                      onChange={(e) => setIncludeAnamnese(e.target.checked)}
                      className="rounded text-slate-900"
                    />
                    <span>
                      <strong>Anamnese & Nutrição:</strong> Alergias/DAPP, dosagem de ração, suplementação articular (UC-II)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeGenomics}
                      onChange={(e) => setIncludeGenomics(e.target.checked)}
                      className="rounded text-slate-900"
                    />
                    <span>
                      <strong>Screening Genômico:</strong> Laudos de Displasia Coxofemoral (OFA Grau A), PRA e Hemograma
                    </span>
                  </label>
                </div>
              </div>

              {/* Recipient Details (Optional for footer) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                    Nome do Médico Veterinário Destinatário:
                  </label>
                  <input
                    type="text"
                    value={vetName}
                    onChange={(e) => setVetName(e.target.value)}
                    placeholder="Dr(a). Nome do Veterinário"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                    Clínica / Hospital de Destino:
                  </label>
                  <input
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="Nome da Clínica"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePrintReport}
                className="px-3 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 rounded-xl transition-colors"
                title="Imprimir prontuário diretamente na impressora ou salvar pelo navegador"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowExportPdfModal(false);
                    setShowEmailModal(true);
                  }}
                  className="px-3.5 py-2 bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-orange-600" />
                  <span>Enviar por E-mail</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleDownloadPdf();
                    setShowExportPdfModal(false);
                  }}
                  disabled={isGeneratingPdf}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isGeneratingPdf ? 'Gerando PDF...' : 'Baixar Arquivo PDF (.pdf)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Envio de Prontuário em PDF ao Veterinário por E-mail */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 md:p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-2 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-600 text-white">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-heading">
                    Enviar Prontuário em PDF ao Veterinário
                  </h3>
                  <p className="text-xs text-slate-500">
                    Transmita o histórico clínico oficial do <strong>{dog.name}</strong> para o médico veterinário
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Navigation Tabs (Form vs Email Preview) */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setEmailModalTab('form')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  emailModalTab === 'form'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Dados de Envio & Anexo PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setEmailModalTab('preview')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  emailModalTab === 'preview'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Pré-visualização da Mensagem</span>
              </button>
            </div>

            {/* Receipt Confirmation State if already sent */}
            {emailSentReceipt && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2 text-emerald-950 text-xs shrink-0 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Prontuário transmitido com sucesso ao Veterinário!</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  O e-mail foi despachado para <strong>{emailSentReceipt.to}</strong> com o arquivo <strong>{emailSentReceipt.pdfFilename}</strong> anexado e link de auditoria médica criptografada.
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-emerald-700 pt-1 border-t border-emerald-200">
                  <span>Protocolo: {emailSentReceipt.protocol}</span>
                  <span>•</span>
                  <span>Horário: {emailSentReceipt.sentAt}</span>
                  <span>•</span>
                  <span>Validade Token: 72 horas</span>
                </div>
              </div>
            )}

            {/* TAB 1: Form & Attachment Details */}
            {emailModalTab === 'form' && (
              <div className="space-y-3 text-xs overflow-y-auto flex-1 pr-1">
                {/* PDF Attachment Badge */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-orange-100 text-orange-800 rounded-lg font-bold text-[10px]">
                        PDF A4
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block font-mono text-[11px]">
                          Prontuario_Clinico_{dog.name.replace(/[^a-zA-Z0-9]/g, '_')}_2026.pdf
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Anexo gerado automaticamente • Padrão CFMV Art. 12/2021 (~180 KB)
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg font-semibold text-[11px] flex items-center gap-1 shadow-2xs transition-colors shrink-0"
                      title="Baixar uma cópia do PDF no seu dispositivo"
                    >
                      <Download className="w-3 h-3 text-slate-600" />
                      <span>Baixar Cópia</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-[10px] text-slate-600 pt-1 border-t border-slate-200/60 font-mono">
                    <div>Paciente: <strong>{dog.name}</strong></div>
                    <div>Período: <strong>{selectedPeriod === '3m' ? '3 Meses' : selectedPeriod === '6m' ? '6 Meses' : 'Vitalício'}</strong></div>
                    <div>Assinatura: <strong>SHA-256 ICP-Pet</strong></div>
                  </div>
                </div>

                {/* Email Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      E-mail do Médico Veterinário / Clínica:
                    </label>
                    <input
                      type="email"
                      value={vetEmail}
                      onChange={(e) => setVetEmail(e.target.value)}
                      placeholder="veterinario@hospital.com.br"
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nome do Médico Veterinário:
                    </label>
                    <input
                      type="text"
                      value={vetName}
                      onChange={(e) => setVetName(e.target.value)}
                      placeholder="Dr(a). Thiago Ramos"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Clínica / Hospital Veterinário de Destino:
                  </label>
                  <input
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="Ex: Hospital Veterinário Pet Care SP"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assunto do E-mail (Padronizado):
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`[Prontuário CanisTech] ${dog.name} (${dog.breed}) - Relatório Clínico Oficial Homologado`}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mensagem ou Orientações Adicionais do Tutor:
                  </label>
                  <textarea
                    rows={2}
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Adicione observações para a consulta..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    O e-mail será enviado com remetente institucional do <strong>CanisTech DogOS</strong> e identificação da tutora <strong>{dog.tutorName}</strong> ({dog.tutorEmail || 'camila.tutor@canistech.com.br'}), contendo o anexo em PDF e o link de acesso criptografado de 72h.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: Email Visual Preview */}
            {emailModalTab === 'preview' && (
              <div className="space-y-3 text-xs overflow-y-auto flex-1 pr-1">
                <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-2xs bg-white">
                  {/* Email Header Bar */}
                  <div className="bg-slate-100 p-3 border-b border-slate-200 space-y-1 text-[11px] font-mono text-slate-600">
                    <p>
                      <strong>De:</strong> CanisTech Prontuário Digital &lt;prontuario@canistech.app&gt;
                    </p>
                    <p>
                      <strong>Para:</strong> {vetName} &lt;{vetEmail}&gt;
                    </p>
                    <p>
                      <strong>Cc (Tutor):</strong> {dog.tutorName} &lt;{dog.tutorEmail || 'camila.tutor@canistech.com.br'}&gt;
                    </p>
                    <p className="font-bold text-slate-900">
                      <strong>Assunto:</strong> [Prontuário CanisTech] {dog.name} ({dog.breed}) - Relatório Clínico Oficial Homologado
                    </p>
                    <p className="text-orange-700">
                      <strong>Anexo:</strong> 📎 Prontuario_Clinico_{dog.name.replace(/[^a-zA-Z0-9]/g, '_')}_2026.pdf (180 KB)
                    </p>
                  </div>

                  {/* Email Visual Body */}
                  <div className="p-5 space-y-3 text-slate-700">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-orange-600 text-white font-bold text-xs flex items-center justify-center">
                          🐾
                        </div>
                        <span className="font-bold text-slate-900 text-sm">CanisTech DogOS</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Padrão CFMV Art. 12/2021</span>
                    </div>

                    <p>
                      Olá, <strong>{vetName}</strong> ({clinicName})!
                    </p>
                    <p>
                      A tutora <strong>{dog.tutorName}</strong> está compartilhando o histórico clínico oficial do cão <strong>{dog.name}</strong> para atendimento e acompanhamento veterinário.
                    </p>

                    {/* Patient summary box */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <h4 className="font-bold text-slate-900">📋 Resumo do Paciente:</h4>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        <div>• Paciente: <strong>{dog.name}</strong> ({dog.breed})</div>
                        <div>• Idade: <strong>{dog.ageYears}a {dog.ageMonths}m</strong></div>
                        <div>• Peso Atual: <strong>{dog.currentWeight} kg</strong> (Ideal)</div>
                        <div>• Escore ECC: <strong>{dog.bcsScore}/9 (WSAVA)</strong></div>
                        <div>• Microchip: <strong>{dog.microchip}</strong></div>
                        <div>• RG Pet: <strong>{dog.rgNumber}</strong></div>
                      </div>
                      <p className="text-[11px] text-emerald-700 font-semibold pt-1 border-t border-slate-200">
                        ✓ Vacinas e antiparasitários em dia • Screening Genômico OFA Grau A livre de displasia.
                      </p>
                    </div>

                    {additionalNotes && (
                      <div className="p-2.5 bg-orange-50/50 border border-orange-200/60 rounded-xl text-[11px]">
                        <span className="font-bold text-orange-950 block">Observação do Tutor:</span>
                        <span className="text-orange-900 italic">"{additionalNotes}"</span>
                      </div>
                    )}

                    <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1">
                      <p className="font-bold text-[11px]">📎 Arquivo Anexo em PDF A4:</p>
                      <p className="text-[10px] text-slate-300">
                        O dossiê completo impresso em anexo contém a tabela de lotes de vacinas, notas da anamnese e laudos dos exames de imagem e sangue.
                      </p>
                    </div>

                    <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                      CanisTech Tecnologia Veterinária • Proteção de Dados LGPD • Validade do Token de Acesso: 72 horas
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={handleOpenNativeMailto}
                className="px-3 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Abrir no seu aplicativo de e-mail padrão com texto pré-preenchido"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Abrir no Gmail / Outlook</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-3.5 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold"
                >
                  Fechar
                </button>

                <button
                  type="button"
                  onClick={handleSendEmailToVet}
                  disabled={isSendingEmail}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingEmail ? 'Enviando Prontuário...' : 'Enviar E-mail com PDF Anexo Agora'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
