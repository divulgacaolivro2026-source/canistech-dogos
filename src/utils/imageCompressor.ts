// Caminho: src/utils/imageCompressor.ts

export interface CompressedImageResult {
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  sizeKb: number;
  mimeType: string;
}

export const TARGET_WIDTH_3X4 = 360;
export const TARGET_HEIGHT_3X4 = 480;
export const DEFAULT_WEBP_QUALITY = 0.75;

/**
 * Calcula o peso real em bytes a partir de uma string DataURL Base64
 */
export function estimateDataUrlBytes(dataUrl: string): number {
  const base64Index = dataUrl.indexOf(',');
  if (base64Index === -1) return dataUrl.length;
  const base64Length = dataUrl.length - (base64Index + 1);
  return Math.round((base64Length * 3) / 4);
}

/**
 * Processa qualquer arquivo de imagem (File/Blob) via <canvas> HTML5 no client-side:
 * - Redimensiona proporcionalmente (center-crop inteligente 3x4) para 360px x 480px
 * - Comprime para image/webp com qualidade 0.75 (garantindo peso final enxuto ~25 KB a 55 KB)
 * - Elimina definitivamente o erro QuotaExceededError no localStorage e otimiza o banco Supabase
 */
export async function compressDogImageToWebp(
  fileOrDataUrl: File | Blob | string,
  quality: number = DEFAULT_WEBP_QUALITY
): Promise<CompressedImageResult> {
  const srcUrl =
    typeof fileOrDataUrl === 'string'
      ? fileOrDataUrl
      : await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem.'));
          reader.readAsDataURL(fileOrDataUrl);
        });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Não foi possível decodificar a imagem selecionada.'));
    image.src = srcUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = TARGET_WIDTH_3X4;
  canvas.height = TARGET_HEIGHT_3X4;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Contexto 2D do Canvas HTML5 indisponível neste navegador.');
  }

  // Fundo branco limpo para imagens PNG transparentes
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, TARGET_WIDTH_3X4, TARGET_HEIGHT_3X4);

  // Recorte proporcional centralizado (aspect ratio 3:4 -> 360x480)
  const targetAspect = TARGET_WIDTH_3X4 / TARGET_HEIGHT_3X4; // 0.75
  const srcWidth = img.naturalWidth || img.width || TARGET_WIDTH_3X4;
  const srcHeight = img.naturalHeight || img.height || TARGET_HEIGHT_3X4;
  const srcAspect = srcWidth / srcHeight;

  let sx = 0;
  let sy = 0;
  let sWidth = srcWidth;
  let sHeight = srcHeight;

  if (srcAspect > targetAspect) {
    // Imagem mais larga que 3x4 -> corta laterais preservando centro
    sWidth = srcHeight * targetAspect;
    sx = (srcWidth - sWidth) / 2;
  } else if (srcAspect < targetAspect) {
    // Imagem mais alta que 3x4 -> corta topo/base preservando centro-superior
    sHeight = srcWidth / targetAspect;
    sy = (srcHeight - sHeight) * 0.35;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, TARGET_WIDTH_3X4, TARGET_HEIGHT_3X4);

  let currentQuality = quality;
  let dataUrl = canvas.toDataURL('image/webp', currentQuality);

  // Caso a imagem ainda ultrapasse 55 KB por excesso de textura, ajusta qualidade suavemente
  let sizeBytes = estimateDataUrlBytes(dataUrl);
  while (sizeBytes > 55 * 1024 && currentQuality > 0.5) {
    currentQuality = Number((currentQuality - 0.07).toFixed(2));
    dataUrl = canvas.toDataURL('image/webp', currentQuality);
    sizeBytes = estimateDataUrlBytes(dataUrl);
  }

  const sizeKb = Number((sizeBytes / 1024).toFixed(1));

  return {
    dataUrl,
    width: TARGET_WIDTH_3X4,
    height: TARGET_HEIGHT_3X4,
    sizeBytes,
    sizeKb,
    mimeType: 'image/webp',
  };
}
