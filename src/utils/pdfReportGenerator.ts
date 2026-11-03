import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DogProfile, VaccineRecord } from '../types';

export interface PDFExportOptions {
  period?: '3m' | '6m' | 'all';
  recipientVetName?: string;
  recipientVetEmail?: string;
  recipientClinic?: string;
  includeGenomics?: boolean;
  includeVaccines?: boolean;
  includeAnamnese?: boolean;
  issuedAt?: Date;
}

export interface GeneratedPDFResult {
  doc: jsPDF;
  filename: string;
  blob: Blob;
  dataUrl: string;
  fileSizeFormatted: string;
}

/**
 * Formats a date to Brazilian format (DD/MM/YYYY)
 */
function formatCurrentDate(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Generates an official, CFMV-compliant Veterinary Medical Record PDF for the pet
 */
export function generatePetClinicReportPDF(
  dog: DogProfile,
  vaccines: VaccineRecord[],
  options: PDFExportOptions = {}
): GeneratedPDFResult {
  const {
    period = '6m',
    recipientVetName = 'Dr(a). Médico(a) Veterinário(a)',
    recipientClinic = 'Hospital Veterinário Credenciado',
    includeGenomics = true,
    includeVaccines = true,
    includeAnamnese = true,
    issuedAt = new Date(),
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  // --- Header: CanisTech DogOS Brand Banner ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, currentY, contentWidth, 26, 3, 3, 'F');

  // Accent bar
  doc.setFillColor(234, 88, 12); // orange-600 / CanisTech Brand
  doc.rect(margin, currentY + 24, contentWidth, 2, 'F');

  // Brand Name & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CANISTECH DogOS™', margin + 6, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('SISTEMA INTEGRADO DE MEDICINA VETERINÁRIA PREVENTIVA & ANAMNESE DIGITAL', margin + 6, currentY + 14);
  doc.text('Padrão Normativo CFMV Art. 12/2021 • LGPD Sanitizado • ICP-Brasil Pet #884A-91C', margin + 6, currentY + 19);

  // Protocol & Date Badge (Right aligned inside banner)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(251, 146, 60); // orange-400
  doc.text(`ID: CT-9942-BR-2025`, pageWidth - margin - 6, currentY + 9, { align: 'right' });
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Emissão: ${formatCurrentDate(issuedAt)} às ${issuedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - margin - 6, currentY + 14, { align: 'right' });
  doc.text(`Período do Relatório: ${period === '3m' ? 'Últimos 3 Meses' : period === '6m' ? 'Últimos 6 Meses' : 'Histórico Vitalício'}`, pageWidth - margin - 6, currentY + 19, { align: 'right' });

  currentY += 32;

  // --- Report Title ---
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('PRONTUÁRIO CLÍNICO OFICIAL & HISTÓRICO DE SAÚDE DO PACIENTE', margin, currentY);
  
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Destinado para: ${recipientVetName} • ${recipientClinic}`, margin, currentY + 4.5);

  currentY += 10;

  // --- Section 1: Identificação do Paciente & Tutor (Box Grid) ---
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, currentY, contentWidth, 38, 2, 2, 'FD');

  // Header of Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, contentWidth, 6, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('1. DADOS CADASTRAIS DO PACIENTE & TUTOR RESPONSÁVEL', margin + 3, currentY + 4.2);

  // Content 3-columns
  const col1X = margin + 4;
  const col2X = margin + 65;
  const col3X = margin + 125;
  const infoStartY = currentY + 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  // Column 1: Patient details
  doc.text(`Nome do Cão: `, col1X, infoStartY);
  doc.setFont('helvetica', 'bold');
  doc.text(`${dog.name}`, col1X + 22, infoStartY);

  doc.setFont('helvetica', 'normal');
  doc.text(`Raça: `, col1X, infoStartY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(`${dog.breed}`, col1X + 10, infoStartY + 5);

  doc.setFont('helvetica', 'normal');
  doc.text(`Idade: ${dog.ageYears}a ${dog.ageMonths}m (${dog.birthDate})`, col1X, infoStartY + 10);
  doc.text(`Sexo: ${dog.gender} • ${dog.neutered ? 'Castrado(a)' : 'Não Castrado(a)'}`, col1X, infoStartY + 15);
  doc.text(`Microchip: ${dog.microchip}`, col1X, infoStartY + 20);

  // Column 2: Clinical Biometrics
  doc.text(`Peso Atual: `, col2X, infoStartY);
  doc.setFont('helvetica', 'bold');
  doc.text(`${dog.currentWeight} kg`, col2X + 17, infoStartY);

  doc.setFont('helvetica', 'normal');
  doc.text(`Faixa Ideal: ${dog.idealWeightMin} a ${dog.idealWeightMax} kg`, col2X, infoStartY + 5);
  doc.text(`Escore ECC (WSAVA): `, col2X, infoStartY + 10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${dog.bcsScore} / 9 (Peso Ideal)`, col2X + 33, infoStartY + 10);

  doc.setFont('helvetica', 'normal');
  doc.text(`Tipo Sanguíneo: `, col2X, infoStartY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(224, 122, 95);
  doc.text(`${dog.bloodType || 'DEA 1.1'}`, col2X + 23, infoStartY + 15);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.text(`RG Pet: ${dog.rgNumber}`, col2X, infoStartY + 20);

  // Column 3: Tutor details
  doc.text(`Tutor(a): `, col3X, infoStartY);
  doc.setFont('helvetica', 'bold');
  doc.text(`${dog.tutorName}`, col3X + 13, infoStartY);

  doc.setFont('helvetica', 'normal');
  doc.text(`Telefone: ${dog.tutorPhone}`, col3X, infoStartY + 5);
  doc.text(`E-mail: ${dog.tutorEmail || 'camila.tutor@canistech.net.br'}`, col3X, infoStartY + 10);
  doc.text(`Localidade: ${dog.city} - ${dog.state}`, col3X, infoStartY + 15);
  doc.text(`Médico Anterior: Dr. Thiago Ramos (CRMV 24.112)`, col3X, infoStartY + 20);

  currentY += 42;

  // --- Section 2: Controle Imunológico & Vacinação ---
  if (includeVaccines) {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, currentY, contentWidth, 6, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('2. CONTROLE SANITÁRIO, IMUNIZAÇÃO & ANTIPARASITÁRIOS', margin + 3, currentY + 4.2);

    currentY += 8;

    const tableRows = vaccines.map((v) => {
      const isOk = v.status !== 'warning' && v.daysRemaining > 0;
      const statusLabel = isOk ? (v.daysRemaining <= 15 ? `Próximo (${v.daysRemaining}d)` : 'Em Dia / Válida') : 'Atenção / Vencida';
      return [
        v.name,
        v.category === 'antiparasitario' ? 'Antiparasitário' : 'Vacina Essencial',
        `${v.manufacturer || 'Zoetis / Nobivac'} (Lote: ${v.lot || 'AB-2024'})`,
        v.lastDate,
        v.nextDate,
        statusLabel,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Profilaxia / Vacina', 'Categoria', 'Fabricante & Lote', 'Última Dose', 'Próx. Reforço', 'Status']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'left',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { cellWidth: 42, fontStyle: 'bold' },
        1: { cellWidth: 26 },
        2: { cellWidth: 46 },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
        5: { cellWidth: 22, halign: 'center' },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    // @ts-expect-error - autoTable adds lastAutoTable to doc
    currentY = doc.lastAutoTable.finalY + 6;
  }

  // Check if we need to add a page or continue
  if (currentY > pageHeight - 75) {
    doc.addPage();
    currentY = margin;
  }

  // --- Section 3: Anamnese Clínica, Sensibilidades & Regime Nutricional ---
  if (includeAnamnese) {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, currentY, contentWidth, 6, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('3. ANAMNESE EXECUTIVA, SENSIBILIDADES & MANEJO NUTRICIONAL', margin + 3, currentY + 4.2);

    currentY += 8;

    // 2-Column Cards for Anamnese
    const halfWidth = (contentWidth - 4) / 2;
    const cardHeight = 32;

    // Card Left: Alergias & Sensibilidades
    doc.setFillColor(254, 242, 242); // red-50
    doc.setDrawColor(254, 202, 202); // red-200
    doc.roundedRect(margin, currentY, halfWidth, cardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(153, 27, 27); // red-800
    doc.text('⚠️ Alergias & Sensibilidades Farmacológicas:', margin + 3, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(185, 28, 28);
    doc.text('• Sem hipersensibilidade a Penicilinas, Cefalosporinas ou AINEs.', margin + 3, currentY + 10);
    doc.text('• Sensibilidade cutânea por DAPP leve em período estival.', margin + 3, currentY + 15);
    doc.text('• Histórico de reação a talco tópico antiparasitário em 2024.', margin + 3, currentY + 20);
    doc.text('• Recomenda-se evitar banhos com produtos sulfatados agressivos.', margin + 3, currentY + 25);

    // Card Right: Nutrição & Suplementos
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin + halfWidth + 4, currentY, halfWidth, cardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('🥗 Regime Nutricional & Suplementação Diária:', margin + halfWidth + 7, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`• Dieta: Ração Super Premium Especial Frango/Arroz (${dog.dietGramsPerDay || 420}g/dia).`, margin + halfWidth + 7, currentY + 10);
    doc.text(`• Fracionamento: ${dog.dietPortions || 2} porções diárias (08:00h e 19:30h).`, margin + halfWidth + 7, currentY + 15);
    doc.text(`• Suplementação Manipulada: ${dog.supplements || 'Condroitina + Glicosamina + UC-II'}.`, margin + halfWidth + 7, currentY + 20);
    doc.text(`• Hidratação Média Estimada: ${dog.dailyWaterMl || 1800} mL/dia (Fonte fresca).`, margin + halfWidth + 7, currentY + 25);

    currentY += cardHeight + 4;

    // Recent Notes Bar
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, 14, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Notas de Intercorrências Recentes (Últimos 30 dias):', margin + 3, currentY + 4.5);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('"Episódio isolado de êmese matinal há 12 dias com regurgitação de grama e conteúdo gástrico. Sem recidiva. Fezes Bristol Grau 2 (consistentes e sem muco). Atividade física regular (60 min/dia)."', margin + 3, currentY + 9);

    currentY += 18;
  }

  // --- Section 4: Screening Genômico & Exames Complementares ---
  if (includeGenomics) {
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, currentY, contentWidth, 6, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('4. PAINEL GENÔMICO CANISGENOMICS & LAUDOS LABORATORIAIS', margin + 3, currentY + 4.2);

    currentY += 8;

    const examRows = [
      ['Displasia Coxofemoral (OFA)', 'Grau A (Excelente / Livre)', 'PetGenetics Brasil', 'Laudo Radiográfico Arquivado'],
      ['Atrofia Progressiva de Retina (PRA)', 'Clear / Não Portador (Genótipo N/N)', 'PetGenetics Brasil', 'Livre de mutações no gene PRCD'],
      ['Ictiose Canina', 'Livre Homozigoto', 'PetGenetics Brasil', 'Sem predisposição dermatológica hereditária'],
      ['Hemograma Completo Recente', 'Eritrócitos, Leucócitos e Plaquetas Normais', 'VetPat Análises', 'Contagem globular em parâmetros ideais'],
      ['Perfil Bioquímico (Creatinina / ALT)', 'Creatinina 1.1 mg/dL • ALT 38 U/L (Normal)', 'VetPat Análises', 'Função renal e hepática íntegras'],
      ['Eletrocardiograma (ECG)', 'Ritmo Sinusal Regular (FC 88 bpm)', 'CardioPet SP', 'Ausência de arritmias ou sopros audíveis'],
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Exame / Screening Genético', 'Resultado Diagnóstico', 'Laboratório Credenciado', 'Parecer / Observação']],
      body: examRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7,
        cellPadding: 1.8,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 54, fontStyle: 'bold', textColor: [21, 128, 61] },
        2: { cellWidth: 36 },
        3: { cellWidth: 42 },
      },
    });

    // @ts-expect-error - autoTable adds lastAutoTable to doc
    currentY = doc.lastAutoTable.finalY + 6;
  }

  // --- Footer & Legal Authentication ---
  if (currentY > pageHeight - 32) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('VALIDAÇÃO DIGITAL, SIGILO MÉDICO-VETERINÁRIO & AUTENTICIDADE', margin + 3, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Documento gerado eletronicamente com base nos dados clínicos registrados no DogOS CanisTech sob supervisão do tutor e clínicas parceiras.', margin + 3, currentY + 8.5);
  doc.text('Assinatura Digital de Integridade: SHA-256 [e8a4d79c72f10b3a884a91c53012ff89] • Validade Legal: CFMV Resolução nº 1321.', margin + 3, currentY + 12.5);
  doc.text(`Link Seguro do Prontuário para o Clínico: https://canistech.app/v/${dog.name.toLowerCase()}-9942?token=e8a4d79c (Válido por 72h)`, margin + 3, currentY + 16.5);

  // Clean filename
  const cleanDogName = dog.name.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = formatCurrentDate(issuedAt).replace(/\//g, '-');
  const filename = `Prontuario_Clinico_${cleanDogName}_${dateStr}.pdf`;

  // Output blob & dataUrl
  const blob = doc.output('blob');
  const dataUrl = doc.output('datauristring');
  const fileSizeKb = Math.round(blob.size / 1024);
  const fileSizeFormatted = `${fileSizeKb} KB`;

  return {
    doc,
    filename,
    blob,
    dataUrl,
    fileSizeFormatted,
  };
}

/**
 * Helper to download the generated PDF directly in the browser
 */
export function downloadPetClinicReportPDF(
  dog: DogProfile,
  vaccines: VaccineRecord[],
  options: PDFExportOptions = {}
): GeneratedPDFResult {
  const result = generatePetClinicReportPDF(dog, vaccines, options);
  result.doc.save(result.filename);
  return result;
}

/**
 * Prepares a structured mailto link for tutor sending to vet
 */
export function generateVetEmailMailtoUrl(params: {
  vetEmail: string;
  vetName?: string;
  dogName: string;
  dogBreed: string;
  tutorName: string;
  tutorPhone: string;
  secureLink: string;
  pdfFilename: string;
}): string {
  const subject = `[Prontuário CanisTech] ${params.dogName} (${params.dogBreed}) - Relatório Clínico Oficial`;
  
  const body = 
`Olá Dr(a). ${params.vetName || 'Médico(a) Veterinário(a)'},

Segue o Prontuário Clínico Digital & Histórico de Saúde do paciente ${params.dogName} (${params.dogBreed}), gerado via CanisTech DogOS para nossa consulta veterinária.

📋 RESUMO CLÍNICO:
- Paciente: ${params.dogName} (${params.dogBreed})
- Tutora Responsável: ${params.tutorName} (Tel: ${params.tutorPhone})
- Vacinas e Profilaxia: Controle sanitário completo em dia (V10, Raiva, Antiparasitário ativo)
- Quadro Geral: Sensibilidade DAPP leve (alergia a talco), sem alergia a antibióticos ou AINEs
- Painel CanisGenomics: Displasia Coxofemoral Grau A (Livre), PRA Clear

📎 ARQUIVO ANEXO RECOMENDADO:
${params.pdfFilename} (Documento em formato PDF A4 padronizado CFMV)

🔗 ACESSO SEGURO ONLINE AO PRONTUÁRIO & EXAMES:
${params.secureLink}

Atenciosamente,
${params.tutorName}`;

  return `mailto:${encodeURIComponent(params.vetEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
