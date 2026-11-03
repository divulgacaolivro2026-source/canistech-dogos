// Caminho: src/utils/vaccineBookletPdfGenerator.ts
import { jsPDF } from 'jspdf';
import { DogProfile } from '../types';
import { ScheduledDoseItem } from './vaccineEngine';
import {
  formatRgcCpf,
  generateQrMatrix,
  generateRgcSecurityHash,
  generateBookletSecurityHash,
  getDogPhotoUrl,
} from './qrCodeGenerator';

export const RGC_OFFICIAL_SUBTITLE =
  'SISTEMA NACIONAL CANISTECH • REGISTRO PARTICULAR DE IDENTIFICAÇÃO E BIOMETRIA CANINA (RGC)';

export const MANDATORY_BOOKLET_LEGAL_CLAUSE =
  'Caderneta de organização sanitária gerada pelo sistema CanisTech DogOS. A validade clínica, sanitária e legal de cada imunização registrada neste documento depende exclusivamente da fixação física do selo original do frasco vacinal (lote/validade), assinatura e carimbo presencial de Médico Veterinário inscrito no CRMV, isentando a plataforma de responsabilidade por anotações manuais ou atos clínicos.';

/**
 * Desenha a Bandeira do Brasil oficial em vetor nítido no jsPDF
 */
function drawBrazilFlagVector(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  // Retângulo Verde (#009c3b)
  doc.setFillColor(0, 156, 59);
  doc.setDrawColor(218, 165, 32); // Borda Dourada sutil
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 0.8, 0.8, 'FD');

  // Losango Amarelo (#ffdf00)
  doc.setFillColor(255, 223, 0);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w * 0.42;
  const ry = h * 0.38;

  doc.triangle(cx, cy - ry, cx + rx, cy, cx, cy + ry, 'F');
  doc.triangle(cx, cy - ry, cx - rx, cy, cx, cy + ry, 'F');

  // Círculo Azul Celeste (#002776)
  doc.setFillColor(0, 39, 118);
  const rCircle = h * 0.23;
  doc.circle(cx, cy, rCircle, 'F');

  // Faixa Branca Central
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.line(cx - rCircle * 0.85, cy + rCircle * 0.15, cx + rCircle * 0.85, cy - rCircle * 0.15);
}

/**
 * Interface interna para os itens de doses diagramados
 */
export interface BookletDoseSlot {
  number: number;
  title: string;
  phase: string;
  agents: string;
  date: string;
  nextDate: string;
  lot?: string;
}

/**
 * Constrói a lista estruturada das 32 doses da vida inteira do cão
 * (16 na Carteirinha 01 e 16 na Carteirinha 02)
 */
export function buildLifetimeBookletDoses(
  dog: DogProfile,
  existingDoses: ScheduledDoseItem[] = []
): { booklet1Doses: BookletDoseSlot[]; booklet2Doses: BookletDoseSlot[] } {
  const findDose = (keywords: string[]) => {
    return existingDoses.find((d) =>
      keywords.some(
        (kw) =>
          d.name.toLowerCase().includes(kw.toLowerCase()) ||
          d.ruleId.toLowerCase().includes(kw.toLowerCase())
      )
    );
  };

  const poly1 = findDose(['polivalente', 'v8', 'v10', '1ª dose']);
  const poly2 = findDose(['2ª dose']);
  const poly3 = findDose(['3ª dose']);
  const poly4 = findDose(['4ª dose', '16 semanas']);
  const rabies = findDose(['raiva', 'rabies', 'antirrábica']);
  const kennel = findDose(['tosse', 'kennel', 'traqueobronquite']);
  const giardia = findDose(['giárdia', 'giardia']);
  const corona = findDose(['corona', 'ccov']);
  const leish = findDose(['leishmania', 'leishmaniose']);
  const adultBooster = findDose(['reforço anual', 'vida adulta', 'annual']);

  // CARTEIRINHA 01 (Volume 01/02 — Primovacinação, Filhote & Jovem: 16 Doses)
  const booklet1Doses: BookletDoseSlot[] = [
    {
      number: 1,
      title: 'Polivalente Essencial (1ª Dose)',
      phase: 'Fase B (06 a 08 semanas)',
      agents: 'Cinomose, Parvovirose, Adenovírus, Leptospirose',
      date: poly1?.appliedDate || poly1?.dueDate || '06 semanas',
      nextDate: poly2?.dueDate || '08 semanas',
      lot: poly1?.lot,
    },
    {
      number: 2,
      title: 'Polivalente Essencial (2ª Dose)',
      phase: 'Fase C (10 a 12 semanas)',
      agents: 'Cinomose, Parvovirose, Hepatite Infecciosa',
      date: poly2?.appliedDate || poly2?.dueDate || '12 semanas',
      nextDate: poly3?.dueDate || '16 semanas',
      lot: poly2?.lot,
    },
    {
      number: 3,
      title: 'Polivalente Essencial (3ª Dose)',
      phase: 'Fase D (14 a 16 semanas)',
      agents: 'Encerramento da Janela de Falha Imunológica',
      date: poly3?.appliedDate || poly3?.dueDate || '16 semanas',
      nextDate: 'Reforço aos 12m',
      lot: poly3?.lot,
    },
    {
      number: 4,
      title: 'Polivalente Primária (4ª Dose / Opcional)',
      phase: 'Fase D/E (16 a 20 semanas)',
      agents: 'Reforço complementar de alta titulação',
      date: poly4?.appliedDate || poly4?.dueDate || '20 semanas',
      nextDate: 'Reforço aos 12m',
      lot: poly4?.lot,
    },
    {
      number: 5,
      title: 'Vacina Antirrábica Obrigatória',
      phase: 'Fase D/E (16 a 20 semanas)',
      agents: 'Vírus da Raiva Inativado (Lyssavirus)',
      date: rabies?.appliedDate || rabies?.dueDate || '16 semanas',
      nextDate: 'Reforço Anual (+365d)',
      lot: rabies?.lot,
    },
    {
      number: 6,
      title: 'Tosse dos Canis (Traqueobronquite)',
      phase: 'Fase C/D (Série Primária Filhote)',
      agents: 'Bordetella bronchiseptica + CPiV',
      date: kennel?.appliedDate || kennel?.dueDate || '12 semanas',
      nextDate: 'Reforço Anual (+365d)',
      lot: kennel?.lot,
    },
    {
      number: 7,
      title: 'Profilaxia contra Giardíase Canina (1ª Dose)',
      phase: 'Fase C/D (Ambientes Coletivos)',
      agents: 'Giardia lamblia inativada',
      date: giardia?.appliedDate || giardia?.dueDate || '12 semanas',
      nextDate: 'Reforço em 21 dias',
      lot: giardia?.lot,
    },
    {
      number: 8,
      title: 'Profilaxia contra Giardíase Canina (2ª Dose)',
      phase: 'Fase D (Reforço 21 dias)',
      agents: 'Giardia lamblia inativada',
      date: '15 semanas',
      nextDate: 'Reforço Anual (+365d)',
      lot: undefined,
    },
    {
      number: 9,
      title: 'Coronavirose Canina (CCoV Primária)',
      phase: 'Fase C/D (Entérica Canina)',
      agents: 'Coronavírus Canino Inativado',
      date: corona?.appliedDate || corona?.dueDate || 'Sob indicação',
      nextDate: 'Conforme avaliação',
      lot: corona?.lot,
    },
    {
      number: 10,
      title: 'Reforço de Transição Jovem (06 Meses)',
      phase: 'Fase F (Transição Juvenil)',
      agents: 'Consolidação de imunidade humoral',
      date: '06 meses de idade',
      nextDate: 'Reforço aos 12m',
      lot: undefined,
    },
    {
      number: 11,
      title: 'Reforço Semestral de Leptospirose',
      phase: 'Fase F/G (Áreas de Risco / Alagamento)',
      agents: 'Leptospira icterohaemorrhagiae, canicola',
      date: '06 meses de idade',
      nextDate: 'Reforço aos 12m',
      lot: undefined,
    },
    {
      number: 12,
      title: 'Controle Parasitário / Vermifugação 1',
      phase: 'Fase B (06 a 08 semanas)',
      agents: 'Nematódeos e Cestódeos gastrointestinais',
      date: '06 semanas',
      nextDate: 'Repetir em 15 dias',
      lot: undefined,
    },
    {
      number: 13,
      title: 'Controle Parasitário / Vermifugação 2',
      phase: 'Fase C (12 semanas)',
      agents: 'Vermifugação primária de filhote',
      date: '12 semanas',
      nextDate: 'Controle trimestral',
      lot: undefined,
    },
    {
      number: 14,
      title: 'Profilaxia de Ectoparasitas (Pulgas/Carrapatos)',
      phase: 'Fase D (Filhote & Jovem)',
      agents: 'Prevenção contra DAPE e Erliquiose',
      date: '16 semanas',
      nextDate: 'Mensal / Trimestral',
      lot: undefined,
    },
    {
      number: 15,
      title: 'Profilaxia Sanitária Complementar / Viagem',
      phase: 'Fase G (Jovem até 12 meses)',
      agents: 'Controle pré-viagem ou hospedagem',
      date: 'Conforme agenda',
      nextDate: 'Conforme evento',
      lot: undefined,
    },
    {
      number: 16,
      title: 'Exame Pré-Vacinal & Sorologia de Imunidade',
      phase: 'Fase G (Encerramento da Série Primária)',
      agents: 'Avaliação clínica geral e titulação de anticorpos',
      date: '12 meses de idade',
      nextDate: 'Vida Adulta (Vol 02)',
      lot: undefined,
    },
  ];

  // CARTEIRINHA 02 (Volume 02/02 — Vida Adulta, Ocasiões Especiais & Cão Idoso: 16 Doses)
  const booklet2Doses: BookletDoseSlot[] = [
    {
      number: 17,
      title: 'Reforço Anual Polivalente (1º Ano Adulto)',
      phase: 'Fase H (Vida Adulta - 12 a 15 meses)',
      agents: 'V8 / V10 / V12 — Manutenção essencial',
      date: adultBooster?.appliedDate || adultBooster?.dueDate || '12 a 15 meses',
      nextDate: 'Anual (+365d)',
      lot: adultBooster?.lot,
    },
    {
      number: 18,
      title: 'Reforço Anual Antirrábico (1º Ano Adulto)',
      phase: 'Fase H (Obrigatório por Lei)',
      agents: 'Vírus da Raiva Inativado',
      date: '12 meses após primária',
      nextDate: 'Anual (+365d)',
      lot: undefined,
    },
    {
      number: 19,
      title: 'Reforço Anual Tosse dos Canis (1º Ano Adulto)',
      phase: 'Fase H (Proteção Respiratória Contínua)',
      agents: 'Bordetella bronchiseptica + CPiV',
      date: '12 meses após primária',
      nextDate: 'Anual (+365d)',
      lot: undefined,
    },
    {
      number: 20,
      title: 'Reforço Anual Polivalente (2º Ano Adulto)',
      phase: 'Fase H (Adulto Pleno)',
      agents: 'V8 / V10 / V12 — Manutenção humoral',
      date: '24 meses de idade',
      nextDate: 'Anual (+365d)',
      lot: undefined,
    },
    {
      number: 21,
      title: 'Reforço Anual Antirrábico (2º Ano Adulto)',
      phase: 'Fase H (Manutenção Anual Obrigatória)',
      agents: 'Vírus da Raiva Inativado',
      date: '24 meses de idade',
      nextDate: 'Anual (+365d)',
      lot: undefined,
    },
    {
      number: 22,
      title: 'Reforço Anual Polivalente (3º Ano Adulto)',
      phase: 'Fase H (Adulto Pleno)',
      agents: 'V8 / V10 / V12 — Manutenção humoral',
      date: '36 meses de idade',
      nextDate: 'Anual (+365d)',
      lot: undefined,
    },
    {
      number: 23,
      title: 'Reforço Anual Antirrábico (3º Ano Adulto)',
      phase: 'Fase H (Manutenção Anual Obrigatória)',
      agents: 'Vírus da Raiva Inativado',
      date: '36 meses de idade',
      nextDate: 'Anual (+365d)',
      lot: undefined,
    },
    {
      number: 24,
      title: 'Reforço Anual Polivalente (4º Ano Adulto)',
      phase: 'Fase H (Adulto Pleno)',
      agents: 'V8 / V10 / V12 — Manutenção humoral',
      date: '48 meses de idade',
      nextDate: 'Anual (+365d)',
      lot: undefined,
    },
    {
      number: 25,
      title: 'Reforço Anual Antirrábico (4º Ano Adulto)',
      phase: 'Fase H (Manutenção Anual Obrigatória)',
      agents: 'Vírus da Raiva Inativado',
      date: '48 meses de idade',
      nextDate: 'Anual (+365d)',
      lot: undefined,
    },
    {
      number: 26,
      title: 'Reforço Sênior Polivalente (5º Ano em Diante)',
      phase: 'Fase I (Maturidade & Cão Idoso)',
      agents: 'V8 / V10 / V12 — Imunossenescência protegida',
      date: '60 meses de idade',
      nextDate: 'Anual (+365d)',
      lot: undefined,
    },
    {
      number: 27,
      title: 'Reforço Sênior Antirrábico (5º Ano em Diante)',
      phase: 'Fase I (Manutenção Anual Permanente)',
      agents: 'Vírus da Raiva Inativado',
      date: '60 meses de idade',
      nextDate: 'Anual (+365d)',
      lot: undefined,
    },
    {
      number: 28,
      title: 'Reforço Sênior Tosse dos Canis',
      phase: 'Fase I (Proteção do Aparelho Respiratório)',
      agents: 'Bordetella bronchiseptica + CPiV',
      date: 'Conforme rotina',
      nextDate: 'Anual (+365d)',
      lot: undefined,
    },
    {
      number: 29,
      title: 'Profilaxia Leishmaniose Visceral Canina',
      phase: 'Critério Clínico / Zona Endêmica (MAPA)',
      agents: 'Leishmania infantum / Repelentes tópicos',
      date: leish?.appliedDate || leish?.dueDate || 'Sob indicação',
      nextDate: 'Conforme protocolo',
      lot: leish?.lot,
    },
    {
      number: 30,
      title: 'Controle Parasitário / Vermifugação Anual',
      phase: 'Rotina Permanente de Biossegurança',
      agents: 'Vermífugo de amplo espectro a cada 3-6 meses',
      date: 'Rotina contínua',
      nextDate: 'Trimestral',
      lot: undefined,
    },
    {
      number: 31,
      title: 'Profilaxia Especial / Reserva Clínica 01',
      phase: 'Espaço Livre para Vacina / Profilaxia Nova',
      agents: 'Espaço regulamentar para selo e registro veterinário',
      date: '--/--/----',
      nextDate: '--/--/----',
      lot: undefined,
    },
    {
      number: 32,
      title: 'Profilaxia Especial / Reserva Clínica 02',
      phase: 'Espaço Livre para Vacina / Profilaxia Nova',
      agents: 'Espaço regulamentar para selo e registro veterinário',
      date: '--/--/----',
      nextDate: '--/--/----',
      lot: undefined,
    },
  ];

  return { booklet1Doses, booklet2Doses };
}

/**
 * Desenha a Lâmina Externa (Contracapa à esquerda + Linha Central + Capa à direita)
 */
function drawExternalSheet(
  doc: jsPDF,
  dog: DogProfile,
  rgcFormatted: string,
  dogPhoto: string,
  volumeNumber: '01' | '02',
  volumeBadge: string,
  volumeSubtitle: string,
  contracapaTitle: string,
  contracapaTips: string[],
  scanUrl: string,
  securityHash: string
): void {
  const pageHeight = 210;
  const safeMargin = 6; // Safe Zone mecânica de 6mm (A4 Paisagem 297mm x 210mm)
  const foldX = 148.5; // Linha central de dobra (A4 Paisagem: 297 x 210mm)

  // -------------------------------------------------------------------------
  // CONTRACAPA (Metade Esquerda: Safe Zone 6mm -> x = 6mm a 142.5mm)
  // -------------------------------------------------------------------------
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, foldX, pageHeight, 'F');

  // Padrão de fundo geométrico sutil
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  for (let i = 12; i < foldX - 10; i += 18) {
    for (let j = 12; j < pageHeight - 10; j += 18) {
      doc.circle(i, j, 0.6, 'S');
    }
  }

  const backCardX = safeMargin;
  const backCardY = safeMargin;
  const backCardW = foldX - safeMargin * 2; // 136.5mm
  const backCardH = pageHeight - safeMargin * 2; // 198mm

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(backCardX, backCardY, backCardW, backCardH, 3, 3, 'FD');

  // Cabeçalho da Contracapa (Adequação Terminológica CDC / CFMV)
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(backCardX, backCardY, backCardW, 14, 3, 3, 'F');
  doc.rect(backCardX, backCardY + 10, backCardW, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.2);
  doc.setTextColor(251, 191, 36); // Dourado
  doc.text(RGC_OFFICIAL_SUBTITLE, backCardX + 4, backCardY + 5.5);

  doc.setFontSize(7.2);
  doc.setTextColor(255, 255, 255);
  doc.text(`${contracapaTitle} • VOL ${volumeNumber}/02`, backCardX + 4, backCardY + 10.5);

  // Box das Orientações Técnicas
  let curY = backCardY + 19;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(backCardX + 4, curY, backCardW - 8, 58, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.roundedRect(backCardX + 4, curY, backCardW - 8, 58, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text('DIRETRIZES TÉCNICAS CFMV & MAPA (WSAVA 2024)', backCardX + 7, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.6);
  doc.setTextColor(51, 65, 85);
  let tipY = curY + 12;
  contracapaTips.forEach((tip) => {
    const lines = doc.splitTextToSize(tip, backCardW - 14);
    doc.text(lines, backCardX + 7, tipY);
    tipY += lines.length * 3.4 + 2;
  });

  // Box do QR Code de Autenticidade e Prontuário
  curY = backCardY + 83;
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.3);
  doc.roundedRect(backCardX + 4, curY, backCardW - 8, 48, 2, 2, 'FD');

  const qrBoxSize = 28;
  const qrX = backCardX + 8;
  const qrY = curY + 10;

  try {
    const { size: qrMatrixSize, matrix } = generateQrMatrix(scanUrl);
    const modSize = qrBoxSize / qrMatrixSize;
    doc.setFillColor(255, 255, 255);
    doc.rect(qrX, qrY, qrBoxSize, qrBoxSize, 'F');
    doc.setFillColor(15, 23, 42);
    for (let r = 0; r < qrMatrixSize; r++) {
      for (let c = 0; c < qrMatrixSize; c++) {
        if (matrix[r][c]) {
          doc.rect(qrX + c * modSize, qrY + r * modSize, modSize, modSize, 'F');
        }
      }
    }
  } catch {
    doc.setFillColor(255, 255, 255);
    doc.rect(qrX, qrY, qrBoxSize, qrBoxSize, 'FD');
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(146, 64, 14);
  doc.text('VERIFICAÇÃO DIGITAL DO PRONTUÁRIO', backCardX + 40, curY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.6);
  doc.setTextColor(75, 85, 99);
  doc.text(
    'Aponte a câmera para autenticar este volume e acessar o histórico sanitário completo em tempo real.',
    backCardX + 40,
    curY + 14,
    { maxWidth: backCardW - 46 }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text(`PACIENTE: ${dog.name.toUpperCase()} (${dog.breed})`, backCardX + 40, curY + 24);
  doc.text(`RGC OFICIAL: ${rgcFormatted}`, backCardX + 40, curY + 29);
  doc.text(`MICROCHIP: ${dog.microchip || 'NÃO MICROCHIPADO'}`, backCardX + 40, curY + 34);

  doc.setFont('courier', 'bold');
  doc.setFontSize(5.2);
  doc.setTextColor(180, 83, 9);
  doc.text(`HASH: ${securityHash}`, backCardX + 40, curY + 41);

  // Espaço para Anotações Clínicas
  curY = backCardY + 137;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(30, 41, 59);
  doc.text('OBSERVAÇÕES VETERINÁRIAS / CONTROLE CLÍNICO:', backCardX + 5, curY);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  for (let l = 0; l < 4; l++) {
    doc.line(backCardX + 5, curY + 5 + l * 6.5, backCardX + backCardW - 5, curY + 5 + l * 6.5);
  }

  // Rodapé Oficial da Contracapa com Cláusula Legal Obrigatória (CDC / CFMV)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.2);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'USO EXCLUSIVO COM SELOS FÍSICOS (45x20mm) E CARIMBO CRMV (42x18mm) • VALIDADE NACIONAL',
    backCardX + backCardW / 2,
    backCardY + backCardH - 12.5,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.4);
  doc.setTextColor(100, 116, 139);
  const legalLinesBack = doc.splitTextToSize(MANDATORY_BOOKLET_LEGAL_CLAUSE, backCardW - 8);
  doc.text(legalLinesBack, backCardX + backCardW / 2, backCardY + backCardH - 8.5, {
    align: 'center',
  });

  // -------------------------------------------------------------------------
  // LINHA CENTRAL DE DOBRA (x = 148.5mm)
  // -------------------------------------------------------------------------
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.25);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(foldX, safeMargin, foldX, pageHeight - safeMargin);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`[ GUIA DE DOBRA CENTRAL • VINCLE AO MEIO • VOL ${volumeNumber} ]`, foldX, 4.5, {
    align: 'center',
  });
  doc.text(`[ GUIA DE DOBRA CENTRAL • VINCLE AO MEIO • VOL ${volumeNumber} ]`, foldX, pageHeight - 2.5, {
    align: 'center',
  });

  // -------------------------------------------------------------------------
  // CAPA FRONTAL (Metade Direita: Safe Zone 6mm -> x = 154.5mm a 291mm)
  // -------------------------------------------------------------------------
  const coverCardX = foldX + safeMargin;
  const coverCardY = safeMargin;
  const coverCardW = foldX - safeMargin * 2; // 136.5mm
  const coverCardH = pageHeight - safeMargin * 2; // 198mm

  // Fundo Azul Marinho Profundo da Capa (#0f172a)
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(coverCardX, coverCardY, coverCardW, coverCardH, 3, 3, 'F');

  // Moldura dourada elegante na capa
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.6);
  doc.roundedRect(coverCardX + 2, coverCardY + 2, coverCardW - 4, coverCardH - 4, 2.5, 2.5, 'D');

  doc.setDrawColor(180, 83, 9);
  doc.setLineWidth(0.2);
  doc.roundedRect(coverCardX + 3.2, coverCardY + 3.2, coverCardW - 6.4, coverCardH - 6.4, 2, 2, 'D');

  // BANDEIRA DO BRASIL NO CANTO SUPERIOR DIREITO DA CAPA
  const flagW = 18;
  const flagH = 12.6;
  const flagX = coverCardX + coverCardW - flagW - 6;
  const flagY = coverCardY + 6;
  drawBrazilFlagVector(doc, flagX, flagY, flagW, flagH);

  // Cabeçalho da Capa (Adequação Terminológica CDC / CFMV)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.7);
  doc.setTextColor(251, 191, 36); // Dourado
  doc.text(RGC_OFFICIAL_SUBTITLE, coverCardX + 6, coverCardY + 8.5, { maxWidth: coverCardW - 28 });

  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text('CARTEIRA DE ORGANIZAÇÃO SANITÁRIA', coverCardX + 6, coverCardY + 15);
  doc.text('& IMUNIZAÇÃO CANINA (WSAVA 2024)', coverCardX + 6, coverCardY + 20.5);

  // BADGE EM DESTAQUE DO VOLUME (VOLUME 01/02 ou 02/02)
  doc.setFillColor(volumeNumber === '01' ? 16 : 30, volumeNumber === '01' ? 185 : 58, volumeNumber === '01' ? 129 : 138);
  doc.roundedRect(coverCardX + 6, coverCardY + 23.5, coverCardW - 32, 5.5, 1.2, 1.2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.4);
  doc.setTextColor(255, 255, 255);
  doc.text(volumeBadge, coverCardX + 8, coverCardY + 27.2);

  // Linha divisória
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.6);
  doc.line(coverCardX + 6, coverCardY + 32, coverCardX + coverCardW - 6, coverCardY + 32);

  // Insígnia Médica / Escudo Veterinário Central
  const badgeY = coverCardY + 43;
  doc.setFillColor(30, 41, 59);
  doc.setDrawColor(52, 211, 153);
  doc.setLineWidth(0.5);
  doc.roundedRect(coverCardX + coverCardW / 2 - 28, badgeY, 56, 40, 3, 3, 'FD');

  // Cruz Veterinária estilizada em esmeralda
  doc.setFillColor(16, 185, 129);
  doc.rect(coverCardX + coverCardW / 2 - 2.5, badgeY + 5, 5, 18, 'F');
  doc.rect(coverCardX + coverCardW / 2 - 9, badgeY + 11.5, 18, 5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(255, 255, 255);
  doc.text('PROTEÇÃO IMUNOLÓGICA', coverCardX + coverCardW / 2, badgeY + 29, { align: 'center' });
  doc.setFontSize(5.2);
  doc.setTextColor(203, 213, 225);
  doc.text(volumeSubtitle, coverCardX + coverCardW / 2, badgeY + 34, { align: 'center' });

  // Subtítulo descritivo
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Caderneta Oficial de Imunização • Volume ${volumeNumber} de 02 • Espaços regulamentares de 45mm x 20mm para fixação física de selos de frascos vacinais.`,
    coverCardX + coverCardW / 2,
    badgeY + 46,
    { align: 'center', maxWidth: coverCardW - 16 }
  );

  // Card do Titular na Capa (Foto 3x4 + Dados Biométricos)
  const idCardX = coverCardX + 6;
  const idCardY = coverCardY + 104;
  const idCardW = coverCardW - 12; // 120.5mm
  const idCardH = 76;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.4);
  doc.roundedRect(idCardX, idCardY, idCardW, idCardH, 2.5, 2.5, 'FD');

  // Cabeçalho do Card do Titular
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(idCardX, idCardY, idCardW, 9, 2.5, 2.5, 'F');
  doc.rect(idCardX, idCardY + 6, idCardW, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(251, 191, 36);
  doc.text(`IDENTIFICAÇÃO OFICIAL DO PACIENTE TITULAR • VOL ${volumeNumber}`, idCardX + 4, idCardY + 6);

  // Foto 3x4
  const photoW = 24;
  const photoH = 32;
  const photoX = idCardX + 4;
  const photoY = idCardY + 12;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.roundedRect(photoX, photoY, photoW, photoH, 1, 1, 'FD');

  let photoInserted = false;
  if (dogPhoto && dogPhoto.startsWith('data:image/')) {
    try {
      const format = dogPhoto.includes('png')
        ? 'PNG'
        : dogPhoto.includes('webp')
        ? 'WEBP'
        : 'JPEG';
      doc.addImage(dogPhoto, format, photoX, photoY, photoW, photoH);
      photoInserted = true;
    } catch {
      photoInserted = false;
    }
  }

  if (!photoInserted) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text('FOTO 3x4', photoX + photoW / 2, photoY + 14, { align: 'center' });
    doc.setFontSize(4.8);
    doc.text('BIOMÉTRICA', photoX + photoW / 2, photoY + 18, { align: 'center' });
  }

  // Dados do animal
  const dataX = photoX + photoW + 4;
  let curDataY = idCardY + 15;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(dog.name.toUpperCase(), dataX, curDataY);

  curDataY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${dog.breed} • ${dog.gender || 'Macho'}`, dataX, curDataY);

  curDataY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(100, 116, 139);
  doc.text('REGISTRO GERAL CANINO (RGC):', dataX, curDataY);
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(224, 122, 95);
  doc.text(rgcFormatted, dataX + 42, curDataY);

  curDataY += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(100, 116, 139);
  doc.text('MICROCHIP ISO:', dataX, curDataY);
  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text(dog.microchip || 'NÃO MICROCHIPADO', dataX + 22, curDataY);

  curDataY += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(100, 116, 139);
  doc.text('NASCIMENTO:', dataX, curDataY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text(dog.birthDate || '--/--/----', dataX + 18, curDataY);

  // Dados do Tutor
  const tutorY = photoY + photoH + 5;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(idCardX + 4, tutorY, idCardX + idCardW - 4, tutorY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(100, 116, 139);
  doc.text('TUTOR(A) TITULAR:', idCardX + 4, tutorY + 5);
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text((dog.tutorName || 'TUTOR RESPONSÁVEL').toUpperCase(), idCardX + 27, tutorY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(100, 116, 139);
  doc.text('CONTATO / TEL:', idCardX + 4, tutorY + 10.5);
  doc.setFont('courier', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text(dog.tutorPhone || '--', idCardX + 24, tutorY + 10.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(100, 116, 139);
  doc.text('MUNICÍPIO / UF:', idCardX + 68, tutorY + 10.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${dog.city || 'São Paulo'} / ${dog.state || 'SP'}`, idCardX + 88, tutorY + 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.4);
  doc.setTextColor(100, 116, 139);
  doc.text(MANDATORY_BOOKLET_LEGAL_CLAUSE, idCardX + 4, tutorY + 15.2, {
    maxWidth: idCardW - 8,
  });
}

/**
 * Desenha uma linha de dose em 3 colunas horizontais lado a lado dentro de uma página A5:
 * - Coluna 1 (Esquerda): Número da dose, Nome da Vacina, Fase WSAVA, Data Aplicada e Próxima Dose com fonte >= 8.5pt
 * - Coluna 2 (Centro): Quadro tracejado oficial de 45mm x 20mm para colagem do selo físico do frasco vacinal
 * - Coluna 3 (Direita): Quadro dedicado de 42mm x 18mm ao lado do selo para Carimbo Físico & Rubrica CRMV (Trodat 4911 38x14mm)
 */
function drawInternalDoseRow(
  doc: jsPDF,
  pageX: number,
  pageW: number,
  rowY: number,
  rowH: number,
  dose: BookletDoseSlot,
  rowIndex: number,
  phaseColor: [number, number, number]
): void {
  const stampW = 45; // 45mm oficial do selo físico do frasco
  const stampH = 20; // 20mm oficial do selo físico do frasco
  const crmvW = 42; // 42mm dedicado para Carimbo Físico & Rubrica CRMV (Trodat 4911 38x14mm)
  const crmvH = 18; // 18mm dedicado para Carimbo Físico & Rubrica CRMV

  doc.setFillColor(
    rowIndex % 2 === 0 ? 255 : 248,
    rowIndex % 2 === 0 ? 255 : 250,
    rowIndex % 2 === 0 ? 255 : 252
  );
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.roundedRect(pageX, rowY, pageW, rowH, 1, 1, 'FD');

  // Coluna 1 (Esquerda): largura 44.5mm, fonte legível 8.5pt
  const col1X = pageX + 1.5;
  const col1MaxW = 44.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const shortTitle =
    dose.title.length > 21 ? `${dose.title.slice(0, 20)}...` : dose.title;
  doc.text(`${dose.number.toString().padStart(2, '0')}. ${shortTitle}`, col1X, rowY + 5, {
    maxWidth: col1MaxW,
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(phaseColor[0], phaseColor[1], phaseColor[2]);
  const shortPhase =
    dose.phase.length > 22 ? `${dose.phase.slice(0, 21)}...` : dose.phase;
  doc.text(shortPhase, col1X, rowY + 9.8, { maxWidth: col1MaxW });

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`APL:${dose.date}`, col1X, rowY + 14.8);

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(180, 83, 9);
  doc.text(`PRX:${dose.nextDate}`, col1X, rowY + 19.5);

  // Coluna 2 (Centro): QUADRO TRACEJADO OFICIAL DE 45mm x 20mm (Selo do Frasco)
  const stampX = pageX + 46.5;
  const stampY = rowY + 0.9;

  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(stampX, stampY, stampW, stampH, 0.8, 0.8, 'FD');
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(100, 116, 139);
  doc.text('SELO DO FRASCO', stampX + stampW / 2, stampY + 7.2, { align: 'center' });
  doc.setFontSize(4.4);
  doc.setTextColor(148, 163, 184);
  doc.text('45mm x 20mm (LOTE & VAL.)', stampX + stampW / 2, stampY + 11.2, { align: 'center' });

  if (dose.lot) {
    doc.setFont('courier', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(16, 185, 129);
    doc.text(`LOTE: ${dose.lot}`, stampX + stampW / 2, stampY + 16, { align: 'center' });
  }

  // Coluna 3 (Direita): QUADRO DEDICADO DE 42mm x 18mm AO LADO DO SELO (Carimbo Físico & Rubrica CRMV)
  const crmvX = stampX + stampW + 1.5; // 46.5 + 45 + 1.5 = 93mm (93 + 42 = 135mm <= 136.5mm)
  const crmvY = rowY + (rowH - crmvH) / 2;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.25);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(crmvX, crmvY, crmvW, crmvH, 0.8, 0.8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.6);
  doc.setTextColor(100, 116, 139);
  doc.text('CARIMBO FÍSICO & RUBRICA CRMV', crmvX + crmvW / 2, crmvY + 7.2, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.1);
  doc.setTextColor(148, 163, 184);
  doc.text('42mm x 18mm (Padrão Trodat 4911)', crmvX + crmvW / 2, crmvY + 11.5, {
    align: 'center',
  });
}

/**
 * Desenha a Lâmina Interna com 8 quadros na esquerda + 8 quadros na direita = 16 doses por lâmina
 * com Safe Zone de 6mm (padding: 6mm), selo 45x20mm e carimbo CRMV 42x18mm lado a lado.
 */
function drawInternalSheet(
  doc: jsPDF,
  dog: DogProfile,
  rgcFormatted: string,
  leftHeaderTitle: string,
  rightHeaderTitle: string,
  leftDoses: BookletDoseSlot[],
  rightDoses: BookletDoseSlot[],
  volumeCode: string
): void {
  const pageHeight = 210;
  const foldX = 148.5; // Linha central de dobra (A4 Paisagem: 297 x 210mm)
  const safeMargin = 6; // Safe Zone mecânica obrigatória de 6mm

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 297, pageHeight, 'F');

  // LINHA CENTRAL DE DOBRA (x = 148.5mm)
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(foldX, safeMargin, foldX, pageHeight - safeMargin);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.4);
  doc.setTextColor(148, 163, 184);
  doc.text(`[ GUIA DE DOBRA CENTRAL • VINCLE AO MEIO • ${volumeCode} ]`, foldX, 4.2, { align: 'center' });

  // -------------------------------------------------------------------------
  // PÁGINA INTERNA ESQUERDA (8 Doses: x = 6mm a 142.5mm, largura = 136.5mm)
  // -------------------------------------------------------------------------
  const inLeftX = safeMargin;
  const inLeftW = foldX - safeMargin * 2; // 136.5mm

  // Cabeçalho compacto do paciente
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(inLeftX, safeMargin, inLeftW, 9, 1.8, 1.8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`PACIENTE: ${dog.name.toUpperCase()}`, inLeftX + 3, safeMargin + 4.2);

  doc.setFontSize(5.5);
  doc.setTextColor(251, 191, 36);
  doc.text(`RGC: ${rgcFormatted}`, inLeftX + 60, safeMargin + 4.2);

  doc.setTextColor(203, 213, 225);
  doc.text(`CHIP: ${dog.microchip || 'NÃO MICROCHIPADO'}`, inLeftX + 96, safeMargin + 4.2);

  doc.setFontSize(4.3);
  doc.setTextColor(148, 163, 184);
  doc.text(RGC_OFFICIAL_SUBTITLE, inLeftX + 3, safeMargin + 7.7);

  // Título da Seção Esquerda
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text(leftHeaderTitle, inLeftX, 18.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Selo 45x20mm + Carimbo CRMV 42x18mm lado a lado', inLeftX + 86, 18.2);

  // Renderiza as 8 linhas na Página Esquerda
  let rowY = 19.6;
  const rowH = 21.6;

  leftDoses.slice(0, 8).forEach((dose, i) => {
    drawInternalDoseRow(doc, inLeftX, inLeftW, rowY, rowH, dose, i, [224, 122, 95]);
    rowY += rowH + 0.35;
  });

  // Cláusula Legal Obrigatória CFMV / CDC no rodapé da Página Esquerda (dentro da Safe Zone de 6mm)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.2);
  doc.setTextColor(100, 116, 139);
  doc.text(MANDATORY_BOOKLET_LEGAL_CLAUSE, inLeftX, pageHeight - safeMargin - 3.5, {
    maxWidth: inLeftW,
  });

  // -------------------------------------------------------------------------
  // PÁGINA INTERNA DIREITA (8 Doses: x = 154.5mm a 291mm, largura = 136.5mm)
  // -------------------------------------------------------------------------
  const inRightX = foldX + safeMargin;
  const inRightW = foldX - safeMargin * 2; // 136.5mm

  doc.setFillColor(30, 41, 59);
  doc.roundedRect(inRightX, safeMargin, inRightW, 9, 1.8, 1.8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`TUTOR: ${(dog.tutorName || 'TUTOR').toUpperCase().slice(0, 22)}`, inRightX + 3, safeMargin + 4.2);

  doc.setFontSize(5.5);
  doc.setTextColor(251, 191, 36);
  doc.text(`TEL: ${dog.tutorPhone || 'N/A'}`, inRightX + 75, safeMargin + 4.2);

  doc.setTextColor(203, 213, 225);
  doc.text(`LOCAL: ${dog.city || 'SP'}/${dog.state || 'SP'}`, inRightX + 108, safeMargin + 4.2);

  doc.setFontSize(4.3);
  doc.setTextColor(148, 163, 184);
  doc.text(RGC_OFFICIAL_SUBTITLE, inRightX + 3, safeMargin + 7.7);

  // Título da Seção Direita
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text(rightHeaderTitle, inRightX, 18.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Selo 45x20mm + Carimbo CRMV 42x18mm lado a lado', inRightX + 86, 18.2);

  rowY = 19.6;
  rightDoses.slice(0, 8).forEach((dose, i) => {
    drawInternalDoseRow(doc, inRightX, inRightW, rowY, rowH, dose, i, [16, 185, 129]);
    rowY += rowH + 0.35;
  });

  // Cláusula Legal Obrigatória CFMV / CDC no rodapé da Página Direita (dentro da Safe Zone de 6mm)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.2);
  doc.setTextColor(100, 116, 139);
  doc.text(MANDATORY_BOOKLET_LEGAL_CLAUSE, inRightX, pageHeight - safeMargin - 3.5, {
    maxWidth: inRightW,
  });
}

/**
 * Constrói a instância jsPDF das 2 Carteiras Oficiais de Vacinação Canina
 * (CARTEIRA 01 e CARTEIRA 02) integradas em um único PDF A4 Paisagem (4 páginas).
 */
export function buildVaccineBookletPdfDoc(
  dog: DogProfile,
  doses: ScheduledDoseItem[] = []
): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const rgcFormatted = formatRgcCpf(dog.rgNumber, dog.id);
  const dogPhoto = getDogPhotoUrl(dog);
  const now = new Date();
  const securityHash =
    dog.rgcSecurityHash ||
    generateRgcSecurityHash(dog.id, dog.microchip, dog.rgcIssuedAt || now.toISOString());

  const scanUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?view=vacinas&dogId=${encodeURIComponent(
          dog.id
        )}&rgc=${encodeURIComponent(rgcFormatted)}`
      : `https://canistech.net.br/?view=vacinas&dogId=${dog.id}&rgc=${rgcFormatted}`;

  const { booklet1Doses, booklet2Doses } = buildLifetimeBookletDoses(dog, doses);

  // =========================================================================
  // FOLHA 1: CARTEIRINHA 01 — LÂMINA EXTERNA (CONTRACAPA + CAPA)
  // =========================================================================
  const tipsVol1 = [
    '1. SÉRIE PRIMÁRIA EM FILHOTES: Administrar doses com intervalo de 2 a 4 semanas, fechando até 16-20 semanas.',
    '2. VACINAÇÃO ANTIRRÁBICA OBRIGATÓRIA: Mandatória a partir de 12-16 semanas de idade com reforço anual estrito.',
    '3. CONSOLIDAÇÃO DE FILHOTE: Evitar contato com cães não vacinados ou locais públicos até 15 dias após a última dose.',
    '4. VALIDAÇÃO POR SELO FÍSICO: Fixe sempre o selo original do frasco (45x20mm) com lote e validade autenticado por CRMV.',
  ];

  drawExternalSheet(
    doc,
    dog,
    rgcFormatted,
    dogPhoto,
    '01',
    'VOLUME 01 / 02 • PRIMOVACINAÇÃO & SÉRIE INICIAL',
    'FILHOTE, TRANSIÇÃO & VACINAS ESSENCIAIS',
    'ORIENTAÇÕES DE PRIMOVACINAÇÃO & BIOSSEGURANÇA',
    tipsVol1,
    scanUrl,
    securityHash
  );

  // =========================================================================
  // FOLHA 2: CARTEIRINHA 01 — LÂMINA INTERNA (8 SELOS ESQ + 8 SELOS DIR = 16)
  // =========================================================================
  doc.addPage('a4', 'landscape');
  drawInternalSheet(
    doc,
    dog,
    rgcFormatted,
    'SÉRIE PRIMÁRIA • FILHOTE & VACINAS ESSENCIAIS (DOSES 01 A 08)',
    'SÉRIE PRIMÁRIA & TRANSIÇÃO JOVEM (DOSES 09 A 16)',
    booklet1Doses.slice(0, 8),
    booklet1Doses.slice(8, 16),
    'VOLUME 01/02'
  );

  // =========================================================================
  // FOLHA 3: CARTEIRINHA 02 — LÂMINA EXTERNA (CONTRACAPA + CAPA)
  // =========================================================================
  doc.addPage('a4', 'landscape');
  const tipsVol2 = [
    '1. REFORÇOS DE VIDA ADULTA: Manter o reforço anual das vacinas essenciais (Polivalente e Raiva) por toda a vida.',
    '2. CONTROLE DE LEISHMANIOSE: Priorizar coleiras repelentes e exames sorológicos periódicos (alerta MAPA maio/2023).',
    '3. CONTROLE PARASITÁRIO CONTÍNUO: Vermifugação preventiva a cada 3-6 meses e proteção mensal contra pulgas/carrapatos.',
    '4. GERIATRIA CANINA: Cães sênior (>= 7 anos) necessitam de acompanhamento semestral e profilaxias personalizadas.',
  ];

  drawExternalSheet(
    doc,
    dog,
    rgcFormatted,
    dogPhoto,
    '02',
    'VOLUME 02 / 02 • REFORÇOS ANUAIS ADULTO & SÊNIOR',
    'VIDA ADULTA, SÊNIOR & CONTROLE PERMANENTE',
    'CONTROLE SANITÁRIO ADULTO & GERIATRIA CANINA',
    tipsVol2,
    scanUrl,
    securityHash
  );

  // =========================================================================
  // FOLHA 4: CARTEIRINHA 02 — LÂMINA INTERNA (8 SELOS ESQ + 8 SELOS DIR = 16)
  // =========================================================================
  doc.addPage('a4', 'landscape');
  drawInternalSheet(
    doc,
    dog,
    rgcFormatted,
    'REFORÇOS ANUAIS • VIDA ADULTA (DOSES 17 A 24)',
    'REFORÇOS SÊNIOR & OCASIÕES ESPECIAIS (DOSES 25 A 32)',
    booklet2Doses.slice(0, 8),
    booklet2Doses.slice(8, 16),
    'VOLUME 02/02'
  );

  return doc;
}

/**
 * Gera um Blob URL do PDF das Carteirinhas 01 e 02 para o Modal de Pré-Visualização de Impressão Embutido
 */
export function createVaccineBookletPdfBlobUrl(
  dog: DogProfile,
  doses: ScheduledDoseItem[] = []
): string {
  const doc = buildVaccineBookletPdfDoc(dog, doses);
  return String(doc.output('bloburl'));
}

/**
 * Gera e realiza o download direto das 2 Carteiras Oficiais de Vacinação Canina
 * (CARTEIRA 01 e CARTEIRA 02) integradas em um único PDF A4 Paisagem (4 páginas).
 */
export function generateAndDownloadVaccineBookletPdf(
  dog: DogProfile,
  doses: ScheduledDoseItem[] = []
): void {
  const doc = buildVaccineBookletPdfDoc(dog, doses);
  const cleanDogName = (dog.name || 'Pet').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Carteiras_Vacinacao_Canina_Vol1_e_Vol2_CanisTech_${cleanDogName}.pdf`);
}
