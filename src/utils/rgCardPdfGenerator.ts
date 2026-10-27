// Caminho: src/utils/rgCardPdfGenerator.ts
import { jsPDF } from 'jspdf';
import { DogProfile } from '../types';

export function generateAndDownloadOfficialRgCard(dog: DogProfile): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Fundo da página A4 com guia de recorte
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 210, 297, 'F');

  // Título da Folha de Emissão
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(11, 28, 48);
  doc.text('DOCUMENTO OFICIAL DE IDENTIFICAÇÃO E BIOMETRIA CANINA (RGC)', 105, 20, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Emitido eletronicamente por CanisTech Digital Systems • www.canistech.com.br • Documento para impressão e plastificação',
    105,
    26,
    { align: 'center' }
  );

  // =========================================================================
  // FRENTE DA CARTEIRINHA (ESTILO RNI / CIN / CPF BRASILEIRO) - 92mm x 60mm
  // =========================================================================
  const frontX = 12;
  const frontY = 38;
  const cardW = 90;
  const cardH = 58;

  // Moldura externa e fundo de segurança guilloché suave
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(frontX, frontY, cardW, cardH, 3, 3, 'FD');

  // Faixa Superior Institucional Azul Marinho + Coral CanisTech
  doc.setFillColor(11, 28, 48);
  doc.roundedRect(frontX, frontY, cardW, 13, 3, 3, 'F');
  doc.rect(frontX, frontY + 10, cardW, 3, 'F');

  // Linha de destaque Laranja/Coral
  doc.setFillColor(224, 122, 95);
  doc.rect(frontX, frontY + 12.5, cardW, 1.2, 'F');

  // Logo CanisTech no Cabeçalho da Carteirinha
  doc.setFillColor(224, 122, 95);
  doc.roundedRect(frontX + 3, frontY + 2.5, 7.5, 7.5, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('CT', frontX + 6.75, frontY + 7.5, { align: 'center' });

  // Textos do Cabeçalho Oficial
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('REGISTRO NACIONAL DE IDENTIFICAÇÃO CANINA', frontX + 13, frontY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(203, 213, 225);
  doc.text('CANISTECH DOGOS • www.canistech.com.br', frontX + 13, frontY + 9.5);

  // Quadro da Foto 3x4 do Cão
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(frontX + 3.5, frontY + 16.5, 22, 27, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('IDENTIFICAÇÃO', frontX + 14.5, frontY + 28, { align: 'center' });
  doc.text('BIOMÉTRICA', frontX + 14.5, frontY + 31.5, { align: 'center' });

  // Selo de RGC abaixo da foto
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(frontX + 3.5, frontY + 45.5, 22, 8.5, 1, 1, 'F');
  doc.setFontSize(5);
  doc.setTextColor(6, 95, 70);
  doc.text('STATUS DO REGISTRO', frontX + 14.5, frontY + 48.8, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text('ATIVO / VERIFICADO', frontX + 14.5, frontY + 52.3, { align: 'center' });

  // Campos de Dados Principais (Direita da Frente)
  const colX = frontX + 28.5;

  // Nome e Número RGC
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('NOME DO ANIMAL', colX, frontY + 18.5);
  doc.text('Nº REGISTRO (RGC)', colX + 36, frontY + 18.5);

  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text((dog.name || 'NÃO INFORMADO').toUpperCase(), colX, frontY + 22.8);

  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(224, 122, 95);
  doc.text(dog.rgNumber || 'BR-000000', colX + 36, frontY + 22.5);

  // Raça e Sexo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('RAÇA / LINHAGEM', colX, frontY + 28);
  doc.text('SEXO / CONDIÇÃO', colX + 36, frontY + 28);

  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text((dog.breed || 'SRD').slice(0, 22), colX, frontY + 31.8);
  doc.text(`${dog.gender || 'Macho'} (${dog.neutered ? 'Castrado' : 'Intacto'})`, colX + 36, frontY + 31.8);

  // Nascimento e Peso/Porte com Fase Biológica
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('DATA DE NASCIMENTO / FASE', colX, frontY + 37);
  doc.text('PESO / ESCORE CORPORAL', colX + 36, frontY + 37);

  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  const phaseLabel = dog.lifeStage ? (dog.lifeStage === 'filhote' ? 'Filhote' : dog.lifeStage === 'adolescente' ? 'Adolesc.' : 'Adulto') : '';
  const birthWithPhase = phaseLabel ? `${dog.birthDate || '--'} (${phaseLabel})` : (dog.birthDate || '--/--/----');
  doc.text(birthWithPhase, colX, frontY + 40.8);
  doc.text(`${dog.currentWeight || '--'} kg (ECC ${dog.bcsScore || 5}/9)`, colX + 36, frontY + 40.8);

  // Microchip ISO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('MICROCHIP PADRÃO ISO 11784/11785', colX, frontY + 46);

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(colX, frontY + 47.2, 58, 6.8, 1, 1, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(11, 28, 48);
  doc.text(dog.microchip || 'NÃO MICROCHIPADO', colX + 2.5, frontY + 51.8);

  // =========================================================================
  // VERSO DA CARTEIRINHA (TUTOR, LOCALIDADE, QR CODE E VALIDAÇÃO)
  // =========================================================================
  const backX = 108;
  const backY = 38;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(backX, backY, cardW, cardH, 3, 3, 'FD');

  // Faixa Superior do Verso
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(backX, backY, cardW, 10, 3, 3, 'F');
  doc.rect(backX, backY + 7, cardW, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('DADOS DO TUTOR RESPONSÁVEL & VERIFICAÇÃO DIGITAL', backX + 4, backY + 6.2);

  // Dados do Tutor e Localidade
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TUTOR(A) TITULAR RESPONSÁVEL', backX + 4, backY + 15.5);
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text((dog.tutorName || 'TUTOR CADASTRADO').toUpperCase(), backX + 4, backY + 19.5);

  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CONTATO DE EMERGÊNCIA', backX + 4, backY + 25);
  doc.text('LOCALIDADE (CIDADE / UF)', backX + 36, backY + 25);

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(dog.tutorPhone || 'Não informado', backX + 4, backY + 28.8);
  doc.setFont('helvetica', 'bold');
  doc.text(`${dog.city || 'Brasil'} / ${dog.state || 'BR'}`, backX + 36, backY + 28.8);

  // Tipo Sanguíneo e Data de Emissão
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TIPO SANGUÍNEO', backX + 4, backY + 34.5);
  doc.text('EMISSÃO DO DOCUMENTO', backX + 36, backY + 34.5);

  doc.setFont('courier', 'bold');
  const bloodStr = dog.bloodType || 'Não informado';
  doc.setFontSize(bloodStr.length > 15 ? 5.8 : 7.5);
  doc.setTextColor(224, 122, 95);
  doc.text(bloodStr, backX + 4, backY + 38.2);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);
  doc.text(new Date().toLocaleDateString('pt-BR'), backX + 36, backY + 38.2);

  // Simulação Vetorial de QR Code no Canto Direito do Verso
  const qrX = backX + 67;
  const qrY = backY + 13.5;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.rect(qrX, qrY, 19, 19);
  doc.setFillColor(11, 28, 48);
  doc.rect(qrX + 1.5, qrY + 1.5, 4.5, 4.5, 'F');
  doc.rect(qrX + 13, qrY + 1.5, 4.5, 4.5, 'F');
  doc.rect(qrX + 1.5, qrY + 13, 4.5, 4.5, 'F');
  doc.rect(qrX + 7.5, qrY + 7.5, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.5);
  doc.setTextColor(100, 116, 139);
  doc.text('SCAN EMERGÊNCIA', qrX + 9.5, qrY + 21.5, { align: 'center' });

  // Rodapé MRZ (Zona Legível por Máquina estilo Passaporte / RNI)
  doc.setFillColor(241, 245, 249);
  doc.rect(backX + 0.5, backY + 43, cardW - 1, 14.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);
  const cleanName = (dog.name || 'PET').toUpperCase().replace(/[^A-Z]/g, '');
  const cleanRg = (dog.rgNumber || '000000').replace(/[^A-Z0-9]/g, '');
  doc.text(`I<BRACANISTECH<<${cleanRg}<<<<<<<<<<<<<<<`, backX + 4, backY + 48);
  doc.text(`${cleanName}<<DOGOS<<WWW.CANISTECH.COM.BR<<<<`, backX + 4, backY + 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Documento de organização biométrica e identificação. Não substitui carteira de vacinação física ou laudo veterinário.',
    backX + 45,
    backY + 55.8,
    { align: 'center' }
  );

  const safeFileName = `Carteira_RGC_${(dog.name || 'Pet').replace(/\s+/g, '_')}_CanisTech.pdf`;
  doc.save(safeFileName);
}
