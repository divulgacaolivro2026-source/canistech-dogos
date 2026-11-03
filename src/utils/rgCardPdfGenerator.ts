// Caminho: src/utils/rgCardPdfGenerator.ts
import { jsPDF } from 'jspdf';
import { DogProfile } from '../types';
import {
  formatRgcCpf,
  generateQrMatrix,
  generateRgcSecurityHash,
  getDogPhotoUrl,
} from './qrCodeGenerator';
import { sanitizeSafeDisplay } from '../services/authService';
import { formatExactBiologicalAgeRgc } from './vaccineUtils';

export function buildOfficialRgCardPdfDoc(dog: DogProfile): {
  doc: jsPDF;
  safeFileName: string;
} {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Fundo da página A4 com guia de corte
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 210, 297, 'F');

  // Cabeçalho Oficial da Folha de Emissão (Adequação Terminológica CDC / CFMV)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(11, 28, 48);
  doc.text(
    'SISTEMA NACIONAL CANISTECH • REGISTRO PARTICULAR DE IDENTIFICAÇÃO E BIOMETRIA CANINA (RGC)',
    105,
    18,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Padrão Nacional de Segurança Cadastral • Proporção ISO ID-1 (85.6mm x 54mm) • Plastificação recomendada',
    105,
    25,
    { align: 'center' }
  );

  // Formatações oficiais
  const rgcNumberFormatted = formatRgcCpf(dog.rgNumber, dog.id);
  const now = new Date();
  const issuedDate = dog.rgcIssuedAt ? new Date(dog.rgcIssuedAt) : now;
  const expiresDate = dog.rgcExpiresAt
    ? new Date(dog.rgcExpiresAt)
    : new Date(issuedDate.getTime() + 365 * 24 * 60 * 60 * 1000);

  const issuedDateStr = !isNaN(issuedDate.getTime())
    ? issuedDate.toLocaleDateString('pt-BR')
    : now.toLocaleDateString('pt-BR');
  const expiresDateStr = !isNaN(expiresDate.getTime())
    ? expiresDate.toLocaleDateString('pt-BR')
    : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');

  const securityHash =
    dog.rgcSecurityHash ||
    generateRgcSecurityHash(dog.id, dog.microchip, dog.rgcIssuedAt || now.toISOString());

  // Foto do cão
  const dogPhoto = getDogPhotoUrl(dog);

  // =========================================================================
  // FRENTE DA CARTEIRINHA (PADRÃO CIN / CPF CANINO) - ISO ID-1: 85.6mm x 54mm
  // =========================================================================
  const cardW = 85.6;
  const cardH = 54.0;
  const gap = 10.0;
  const frontX = 14.4; // Perfeitamente centralizado: (210 - (85.6 * 2 + 10)) / 2 = 14.4mm
  const frontY = 38.0;

  // Fundo do cartão e borda externa de segurança
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(frontX, frontY, cardW, cardH, 3, 3, 'FD');

  // Moldura interna de segurança
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.roundedRect(frontX + 1, frontY + 1, cardW - 2, cardH - 2, 2.5, 2.5, 'D');

  // Faixa Superior Institucional Azul Marinho Escuro
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(frontX, frontY, cardW, 11, 3, 3, 'F');
  doc.rect(frontX, frontY + 8, cardW, 3, 'F');

  // Filete de destaque Laranja/Coral
  doc.setFillColor(224, 122, 95);
  doc.rect(frontX, frontY + 10.5, cardW, 0.9, 'F');

  // Logo CanisTech Simbólico
  doc.setFillColor(224, 122, 95);
  doc.roundedRect(frontX + 2.5, frontY + 2, 6.5, 6.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('CT', frontX + 5.75, frontY + 6.3, { align: 'center' });

  // Títulos do Cabeçalho Oficial (Adequação Terminológica CDC / CFMV)
  doc.setFontSize(5.8);
  doc.setTextColor(251, 191, 36); // Dourado / Âmbar
  doc.text('CANISTECH DIGITAL SYSTEMS • IDENTIFICAÇÃO CANINA', frontX + 11, frontY + 4.8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.5);
  doc.setTextColor(255, 255, 255);
  doc.text(
    'SISTEMA NACIONAL CANISTECH • REGISTRO PARTICULAR DE IDENTIFICAÇÃO E BIOMETRIA CANINA (RGC)',
    frontX + 11,
    frontY + 8.5,
    { maxWidth: 72 }
  );

  // Moldura da Foto 3x4 Proporcional do Cão (esquerda)
  const photoW = 20;
  const photoH = 26;
  const photoX = frontX + 3;
  const photoY = frontY + 14;

  doc.setDrawColor(100, 116, 139);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(photoX, photoY, photoW, photoH, 1, 1, 'FD');

  // Embutir a foto real se for Base64 DataURL (suporta WEBP, PNG, JPEG)
  let photoInserted = false;
  if (dogPhoto && dogPhoto.startsWith('data:image/')) {
    try {
      const format = dogPhoto.includes('webp')
        ? 'WEBP'
        : dogPhoto.includes('png')
        ? 'PNG'
        : 'JPEG';
      doc.addImage(dogPhoto, format, photoX, photoY, photoW, photoH);
      photoInserted = true;
    } catch {
      photoInserted = false;
    }
  }

  if (!photoInserted) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(100, 116, 139);
    doc.text('FOTO 3X4', photoX + photoW / 2, photoY + 12, { align: 'center' });
    doc.text('BIOMÉTRICA', photoX + photoW / 2, photoY + 15, { align: 'center' });
  }

  // Selo de Verificação sobreposto na base da foto
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.2);
  doc.roundedRect(photoX, photoY + photoH + 1.2, photoW, 6.8, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.5);
  doc.setTextColor(6, 95, 70);
  doc.text('STATUS BIOMÉTRICO', photoX + photoW / 2, photoY + photoH + 3.8, { align: 'center' });
  doc.setFontSize(5.5);
  doc.text('VERIFICADO', photoX + photoW / 2, photoY + photoH + 6.5, { align: 'center' });

  // Grid de Dados Principais (Direita da Frente)
  const colX = frontX + 26;

  // Nome do Animal e Nº Registro RGC (Estilo CPF)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(100, 116, 139);
  doc.text('NOME DO ANIMAL', colX, frontY + 15.5);
  doc.text('Nº REGISTRO (RGC)', colX + 34, frontY + 15.5);

  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text((dog.name || 'NÃO INFORMADO').toUpperCase().slice(0, 18), colX, frontY + 19.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(224, 122, 95);
  doc.text(rgcNumberFormatted, colX + 34, frontY + 19.3);

  // Raça/Linhagem (com quebra limpa maxWidth para caber integralmente) e Sexo/Condição
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(100, 116, 139);
  doc.text('RAÇA / LINHAGEM', colX, frontY + 24.5);
  doc.text('SEXO / CONDIÇÃO', colX + 34, frontY + 24.5);

  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  // Quebra proporcional de texto da raça
  doc.text(dog.breed || 'SRD', colX, frontY + 28, { maxWidth: 32 });
  doc.text(`${dog.gender || 'Macho'} (${dog.neutered ? 'Castrado' : 'Intacto'})`, colX + 34, frontY + 28);

  // Data de Nascimento e Fase Biológica (SEM PESO/ESCORE)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(100, 116, 139);
  doc.text('DATA DE NASCIMENTO', colX, frontY + 33.5);
  doc.text('FASE BIOLÓGICA / IDADE', colX + 34, frontY + 33.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text(dog.birthDate || '--/--/----', colX, frontY + 37);
  doc.setFont('helvetica', 'bold');
  const exactAgeStr = formatExactBiologicalAgeRgc(dog.birthDate, dog.lifeStage, dog.ageYears);
  doc.text(exactAgeStr, colX + 34, frontY + 37);

  // Microchip Padrão ISO 11784/11785 em Destaque
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(100, 116, 139);
  doc.text('MICROCHIP PADRÃO ISO 11784/11785', colX, frontY + 41.5);

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(colX, frontY + 42.8, 56, 5.8, 1, 1, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(dog.microchip || 'NÃO MICROCHIPADO', colX + 2, frontY + 46.8);

  // Rodapé da Frente
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `AUTH: ${securityHash.slice(0, 24)} • VÁLIDO EM TODO O TERRITÓRIO NACIONAL`,
    colX,
    frontY + 51.5
  );

  // =========================================================================
  // VERSO DA CARTEIRINHA (TUTOR, CONTATO, QR CODE E MRZ) - 86mm x 54mm
  // =========================================================================
  const backX = 110;
  const backY = 38;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(backX, backY, cardW, cardH, 3, 3, 'FD');

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.roundedRect(backX + 1, backY + 1, cardW - 2, cardH - 2, 2.5, 2.5, 'D');

  // Faixa Superior do Verso
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(backX, backY, cardW, 8.5, 3, 3, 'F');
  doc.rect(backX, backY + 6, cardW, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.2);
  doc.setTextColor(255, 255, 255);
  doc.text('CANISTECH DIGITAL SYSTEMS • DADOS DO TUTOR & VERIFICAÇÃO', backX + 3.5, backY + 5.5);

  // Dados do Tutor
  doc.setFontSize(5);
  doc.setTextColor(100, 116, 139);
  doc.text('TUTOR(A) TITULAR RESPONSÁVEL', backX + 3.5, backY + 13);
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text((dog.tutorName || 'TUTOR RESPONSÁVEL').toUpperCase().slice(0, 26), backX + 3.5, backY + 16.5);

  // Contato de Emergência e Localidade
  doc.setFontSize(5);
  doc.setTextColor(100, 116, 139);
  doc.text('CONTATO DE EMERGÊNCIA', backX + 3.5, backY + 21);
  doc.text('LOCALIDADE (CIDADE / UF)', backX + 32, backY + 21);

  doc.setFont('courier', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text(dog.tutorPhone || 'Não informado', backX + 3.5, backY + 24.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`${dog.city || 'São Paulo'} / ${dog.state || 'SP'}`, backX + 32, backY + 24.5);

  // Tipo Sanguíneo CONDICIONAL (Oculto se não preenchido ou 'Não informado')
  const hasBlood =
    dog.bloodType &&
    dog.bloodType !== 'Não informado' &&
    dog.bloodType.trim() !== '';

  if (hasBlood) {
    doc.setFontSize(5);
    doc.setTextColor(100, 116, 139);
    doc.text('TIPO SANGUÍNEO', backX + 3.5, backY + 29);
    doc.setFont('courier', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(224, 122, 95);
    doc.text(dog.bloodType || '', backX + 3.5, backY + 32.5);
  }

  // Emissão e Validade (1 Ano) + Renovação Bienal
  const datesY = hasBlood ? backY + 35.5 : backY + 29;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.8);
  doc.setTextColor(100, 116, 139);
  doc.text('EMISSÃO: ' + issuedDateStr, backX + 3.5, datesY);
  doc.setTextColor(6, 95, 70);
  doc.text('VALIDADE: ' + expiresDateStr + ' (1 ANO)', backX + 30, datesY);

  // QR Code Real Vetorial Escaneável no Verso (Apontando para Dossiê com Login)
  const qrX = backX + 64;
  const qrY = backY + 11.5;
  const qrBoxSize = 17.5;

  const emergencyScanUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?view=dossier&dogId=${encodeURIComponent(
          dog.id
        )}&rgc=${encodeURIComponent(rgcNumberFormatted)}`
      : `https://canistech.net.br/?view=dossier&dogId=${dog.id}&rgc=${rgcNumberFormatted}`;

  try {
    const { size: qrMatrixSize, matrix } = generateQrMatrix(emergencyScanUrl);
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
    doc.setDrawColor(15, 23, 42);
    doc.rect(qrX, qrY, qrBoxSize, qrBoxSize);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.2);
  doc.setTextColor(100, 116, 139);
  doc.text('SCAN EMERGÊNCIA', qrX + qrBoxSize / 2, qrY + qrBoxSize + 2.5, { align: 'center' });

  // Zona MRZ (Machine Readable Zone)
  doc.setFillColor(241, 245, 249);
  doc.rect(backX + 1, backY + 39.5, cardW - 2, 13.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(51, 65, 85);
  const cleanRg = rgcNumberFormatted.replace(/[^A-Z0-9]/g, '');
  const cleanName = (dog.name || 'PET').toUpperCase().replace(/[^A-Z]/g, '');
  doc.text(`I<BRACANISTECH<<${cleanRg}<<<<<<<<<<<<<<<`, backX + 3.5, backY + 44);
  doc.text(`${cleanName}<<DOGOS<<WWW.CANISTECH.NET.BR<<<<`, backX + 3.5, backY + 48);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.2);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Cédula Oficial CanisTech • Renovação e Prova de Vida Bienal Obrigatória a cada 2 Anos',
    backX + cardW / 2,
    backY + 51.5,
    { align: 'center' }
  );

  // Guia de corte e dobra na base da folha A4 (estritamente 1 unidade Frente e 1 unidade Verso)
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(14.4, frontY + cardH + 10, 195.6, frontY + cardH + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    '✂ Linha de corte e plastificação • Cédula Oficial Válida em Todo o Território Nacional (1 Frente / 1 Verso)',
    105,
    frontY + cardH + 14,
    { align: 'center' }
  );
  doc.setLineDashPattern([], 0);

  const safeDogName = sanitizeSafeDisplay(dog.name || 'Pet').replace(/\s+/g, '_');
  const safeFileName = `Carteira_RGC_${safeDogName}_CanisTech.pdf`;
  return { doc, safeFileName };
}

export function createOfficialRgCardPdfBlobUrl(dog: DogProfile): {
  blobUrl: string;
  safeFileName: string;
  doc: jsPDF;
} {
  const { doc, safeFileName } = buildOfficialRgCardPdfDoc(dog);
  const blobUrl = String(doc.output('bloburl'));
  return { blobUrl, safeFileName, doc };
}

export function generateAndDownloadOfficialRgCard(dog: DogProfile): void {
  const { doc, safeFileName } = buildOfficialRgCardPdfDoc(dog);
  doc.save(safeFileName);
}
