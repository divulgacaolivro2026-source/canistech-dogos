// Caminho: src/utils/qrCodeGenerator.tsx
import React, { useMemo } from 'react';
import { DogProfile } from '../types';
import {
  signDocumentSecurityHashSync,
  signDocumentSecurityHashAsync,
  sanitizeXss,
} from '../services/authService';

// Galois Field GF(256) tables for QR Code Reed-Solomon math
const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_EXP[i + 255] = x;
    GF256_LOG[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }
})();

function gfMultiply(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
}

interface VersionSpec {
  total: number;
  ecPerBlock: number;
  g1: [number, number]; // [numBlocks, dataCodewords]
  g2: [number, number]; // [numBlocks, dataCodewords]
  align: number[];
}

const VERSION_SPECS: Record<number, { L: VersionSpec; M: VersionSpec }> = {
  1: {
    L: { total: 26, ecPerBlock: 7, g1: [1, 19], g2: [0, 0], align: [] },
    M: { total: 26, ecPerBlock: 10, g1: [1, 16], g2: [0, 0], align: [] },
  },
  2: {
    L: { total: 44, ecPerBlock: 10, g1: [1, 34], g2: [0, 0], align: [6, 18] },
    M: { total: 44, ecPerBlock: 16, g1: [1, 28], g2: [0, 0], align: [6, 18] },
  },
  3: {
    L: { total: 70, ecPerBlock: 15, g1: [1, 55], g2: [0, 0], align: [6, 22] },
    M: { total: 70, ecPerBlock: 26, g1: [1, 44], g2: [0, 0], align: [6, 22] },
  },
  4: {
    L: { total: 100, ecPerBlock: 20, g1: [1, 80], g2: [0, 0], align: [6, 26] },
    M: { total: 100, ecPerBlock: 18, g1: [2, 32], g2: [0, 0], align: [6, 26] },
  },
  5: {
    L: { total: 134, ecPerBlock: 26, g1: [1, 108], g2: [0, 0], align: [6, 30] },
    M: { total: 134, ecPerBlock: 24, g1: [2, 43], g2: [0, 0], align: [6, 30] },
  },
  6: {
    L: { total: 172, ecPerBlock: 18, g1: [2, 68], g2: [0, 0], align: [6, 34] },
    M: { total: 172, ecPerBlock: 16, g1: [4, 27], g2: [0, 0], align: [6, 34] },
  },
  7: {
    L: { total: 196, ecPerBlock: 20, g1: [2, 78], g2: [0, 0], align: [6, 22, 38] },
    M: { total: 196, ecPerBlock: 18, g1: [4, 31], g2: [0, 0], align: [6, 22, 38] },
  },
  8: {
    L: { total: 242, ecPerBlock: 24, g1: [2, 97], g2: [0, 0], align: [6, 24, 42] },
    M: { total: 242, ecPerBlock: 22, g1: [2, 38], g2: [2, 39], align: [6, 24, 42] },
  },
  9: {
    L: { total: 292, ecPerBlock: 30, g1: [2, 116], g2: [0, 0], align: [6, 26, 46] },
    M: { total: 292, ecPerBlock: 22, g1: [3, 36], g2: [2, 37], align: [6, 26, 46] },
  },
  10: {
    L: { total: 346, ecPerBlock: 18, g1: [2, 68], g2: [2, 69], align: [6, 28, 50] },
    M: { total: 346, ecPerBlock: 26, g1: [4, 43], g2: [1, 44], align: [6, 28, 50] },
  },
};

function rsGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    const root = GF256_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMultiply(poly[j], root);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsComputeRemainder(data: number[], degree: number): number[] {
  const gen = rsGeneratorPoly(degree);
  const res = new Array(degree).fill(0);
  for (const b of data) {
    const factor = b ^ res.shift();
    res.push(0);
    for (let i = 0; i < degree; i++) {
      res[i] ^= gfMultiply(gen[i], factor);
    }
  }
  return res;
}

export interface QrMatrixResult {
  size: number;
  matrix: boolean[][];
}

export function generateQrMatrix(text: string, ecLevel: 'L' | 'M' = 'L'): QrMatrixResult {
  const textBytes = new TextEncoder().encode(text);

  let version = 1;
  while (version <= 10) {
    const spec = VERSION_SPECS[version][ecLevel];
    const maxDataBytes = spec.g1[0] * spec.g1[1] + spec.g2[0] * spec.g2[1];
    const countBits = version >= 10 ? 16 : 8;
    const requiredBits = 4 + countBits + textBytes.length * 8;
    if (Math.ceil(requiredBits / 8) <= maxDataBytes) break;
    version++;
  }
  if (version > 10) {
    version = 10;
  }

  const spec = VERSION_SPECS[version][ecLevel];
  const maxDataBytes = spec.g1[0] * spec.g1[1] + spec.g2[0] * spec.g2[1];

  let bits = '';
  bits += '0100'; // Byte Mode
  const countBits = version >= 10 ? 16 : 8;
  bits += textBytes.length.toString(2).padStart(countBits, '0');
  for (const b of textBytes) {
    bits += b.toString(2).padStart(8, '0');
  }

  const totalDataBits = maxDataBytes * 8;
  const termLen = Math.min(4, Math.max(0, totalDataBits - bits.length));
  bits += '0'.repeat(termLen);

  if (bits.length % 8 !== 0) {
    bits += '0'.repeat(8 - (bits.length % 8));
  }

  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < totalDataBits) {
    bits += padBytes[padIdx % 2].toString(2).padStart(8, '0');
    padIdx++;
  }

  const dataCodewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    dataCodewords.push(parseInt(bits.slice(i, i + 8), 2));
  }

  const blocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let offset = 0;

  const g1Blocks = spec.g1[0];
  const g1Size = spec.g1[1];
  for (let i = 0; i < g1Blocks; i++) {
    const blk = dataCodewords.slice(offset, offset + g1Size);
    offset += g1Size;
    blocks.push(blk);
    ecBlocks.push(rsComputeRemainder(blk, spec.ecPerBlock));
  }
  const g2Blocks = spec.g2[0];
  const g2Size = spec.g2[1];
  for (let i = 0; i < g2Blocks; i++) {
    const blk = dataCodewords.slice(offset, offset + g2Size);
    offset += g2Size;
    blocks.push(blk);
    ecBlocks.push(rsComputeRemainder(blk, spec.ecPerBlock));
  }

  const finalCodewords: number[] = [];
  const maxBlockSize = Math.max(g1Size, g2Size);
  for (let i = 0; i < maxBlockSize; i++) {
    for (let b = 0; b < blocks.length; b++) {
      if (i < blocks[b].length) {
        finalCodewords.push(blocks[b][i]);
      }
    }
  }
  for (let i = 0; i < spec.ecPerBlock; i++) {
    for (let b = 0; b < ecBlocks.length; b++) {
      finalCodewords.push(ecBlocks[b][i]);
    }
  }

  const size = version * 4 + 17;
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () => new Array(size).fill(null));
  const isFunction: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

  function setModule(r: number, c: number, val: boolean) {
    matrix[r][c] = val;
    isFunction[r][c] = true;
  }

  function placeFinder(top: number, left: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = top + r;
        const col = left + c;
        if (row < 0 || row >= size || col < 0 || col >= size) continue;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isBlack = r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          setModule(row, col, isBlack);
        } else {
          setModule(row, col, false);
        }
      }
    }
  }
  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  const alignCoords = spec.align;
  for (const r of alignCoords) {
    for (const c of alignCoords) {
      if (isFunction[r][c]) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isBlack = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
          setModule(r + dr, c + dc, isBlack);
        }
      }
    }
  }

  for (let i = 8; i < size - 8; i++) {
    if (matrix[6][i] === null) setModule(6, i, i % 2 === 0);
    if (matrix[i][6] === null) setModule(i, 6, i % 2 === 0);
  }

  setModule(size - 8, 8, true);

  for (let i = 0; i < 9; i++) {
    if (matrix[8][i] === null) {
      matrix[8][i] = false;
      isFunction[8][i] = true;
    }
    if (matrix[i][8] === null) {
      matrix[i][8] = false;
      isFunction[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    if (matrix[8][size - 1 - i] === null) {
      matrix[8][size - 1 - i] = false;
      isFunction[8][size - 1 - i] = true;
    }
    if (matrix[size - 1 - i][8] === null) {
      matrix[size - 1 - i][8] = false;
      isFunction[size - 1 - i][8] = true;
    }
  }

  let allBits = '';
  for (const cw of finalCodewords) {
    allBits += cw.toString(2).padStart(8, '0');
  }

  let bitIdx = 0;
  let upwards = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    const rows = upwards
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);
    for (const row of rows) {
      for (const c of [col, col - 1]) {
        if (!isFunction[row][c]) {
          const bitVal = bitIdx < allBits.length ? allBits[bitIdx] === '1' : false;
          matrix[row][c] = bitVal;
          bitIdx++;
        }
      }
    }
    upwards = !upwards;
  }

  // Mask 0: (r + c) % 2 === 0
  const finalMatrix = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => {
      if (isFunction[r][c]) return Boolean(matrix[r][c]);
      const inverted = (r + c) % 2 === 0;
      return inverted ? !matrix[r][c] : Boolean(matrix[r][c]);
    })
  );

  // Format bits for L, mask 0: 0x77c4 = 111011111000100
  const formatBits = (0x77c4).toString(2).padStart(15, '0');
  const formatCoordsTopLeft: [number, number][] = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = formatCoordsTopLeft[i];
    finalMatrix[r][c] = formatBits[i] === '1';
  }
  const formatCoordsSplit: [number, number][] = [
    [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8], [size - 5, 8], [size - 6, 8], [size - 7, 8],
    [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5], [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1],
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = formatCoordsSplit[i];
    finalMatrix[r][c] = formatBits[i] === '1';
  }

  return { size, matrix: finalMatrix };
}

export function generateQrSvgString(text: string, fgColor = '#0F172A', bgColor = '#FFFFFF', margin = 2): string {
  try {
    const { size, matrix } = generateQrMatrix(text);
    const totalSize = size + margin * 2;
    let path = '';

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c]) {
          const x = c + margin;
          const y = r + margin;
          path += `M${x},${y}h1v1h-1z `;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" shape-rendering="crispEdges">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <path d="${path.trim()}" fill="${fgColor}"/>
    </svg>`;
  } catch {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 33 33"><rect width="100%" height="100%" fill="#FFFFFF"/><text x="16" y="16" font-size="3" text-anchor="middle">QR</text></svg>`;
  }
}

interface QrCodeSvgProps {
  value: string;
  size?: number | string;
  className?: string;
  fgColor?: string;
  bgColor?: string;
  title?: string;
}

export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value,
  size = 120,
  className = '',
  fgColor = '#0F172A',
  bgColor = '#FFFFFF',
  title = 'QR Code de Emergência CanisTech',
}) => {
  const { totalSize, pathData } = useMemo(() => {
    try {
      const { size: matrixSize, matrix } = generateQrMatrix(value);
      const margin = 2;
      const total = matrixSize + margin * 2;
      let p = '';
      for (let r = 0; r < matrixSize; r++) {
        for (let c = 0; c < matrixSize; c++) {
          if (matrix[r][c]) {
            const x = c + margin;
            const y = r + margin;
            p += `M${x},${y}h1v1h-1z `;
          }
        }
      }
      return { totalSize: total, pathData: p.trim() };
    } catch {
      return { totalSize: 33, pathData: '' };
    }
  }, [value]);

  return (
    <svg
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      width={size}
      height={size}
      className={`inline-block select-none ${className}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <rect width="100%" height="100%" fill={bgColor} rx="2" />
      <path d={pathData} fill={fgColor} />
    </svg>
  );
};

// =========================================================================
// HELPER UTILITIES FOR RGC CARD & CPF FORMAT
// =========================================================================

/**
 * Formats RGC in standard CPF-like format: 000.000.000-CT
 */
export function formatRgcCpf(rawNumber?: string, dogId?: string): string {
  if (!rawNumber && !dogId) return '000.000.000-CT';
  const source = `${rawNumber || ''}${dogId || ''}`;
  let digits = source.replace(/\D/g, '');
  if (digits.length < 9) {
    let hash = 0;
    for (let i = 0; i < source.length; i++) {
      hash = (hash << 5) - hash + source.charCodeAt(i);
      hash |= 0;
    }
    const pseudoDigits = Math.abs(hash).toString().padStart(9, '7');
    digits = (digits + pseudoDigits).slice(0, 9);
  } else {
    digits = digits.slice(0, 9);
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-CT`;
}

/**
 * Generates an Anti-Cloning Security Hash (SHA-256) combining Dog ID, Microchip, and Issuance Date
 */
export function generateRgcSecurityHash(dogId: string, microchip: string, issuedAt: string): string {
  return signDocumentSecurityHashSync('RGC', dogId, microchip, issuedAt);
}

/**
 * Generates an Anti-Cloning Security Hash via native Web Crypto API (crypto.subtle.digest('SHA-256', ...))
 */
export async function generateRgcSecurityHashAsync(
  dogId: string,
  microchip: string,
  issuedAt: string
): Promise<string> {
  return signDocumentSecurityHashAsync('RGC', dogId, microchip, issuedAt);
}

/**
 * Generates Vaccination Booklet Security Hash via SHA-256 / Web Crypto API
 */
export function generateBookletSecurityHash(dogId: string, microchip: string, issuedAt: string): string {
  return signDocumentSecurityHashSync('BOOKLET', dogId, microchip, issuedAt);
}

export async function generateBookletSecurityHashAsync(
  dogId: string,
  microchip: string,
  issuedAt: string
): Promise<string> {
  return signDocumentSecurityHashAsync('BOOKLET', dogId, microchip, issuedAt);
}

export { sanitizeXss };

/**
 * Robust getter for dog photo across all schema variations and localStorage cache
 */
export function getDogPhotoUrl(dog?: DogProfile | null): string {
  if (!dog) return '';
  if (dog.photoUrl && dog.photoUrl.trim() !== '') return dog.photoUrl.trim();
  if (dog.photo && dog.photo.trim() !== '') return dog.photo.trim();
  if (dog.avatar && dog.avatar.trim() !== '') return dog.avatar.trim();
  if (dog.imageUrl && dog.imageUrl.trim() !== '') return dog.imageUrl.trim();

  if (typeof window !== 'undefined' && dog.id) {
    try {
      const local = localStorage.getItem(`canistech_dog_photo_${dog.id}`);
      if (local && local.trim() !== '') return local.trim();
    } catch {
      // ignore
    }
  }
  return '';
}

/**
 * Strict validator to guarantee dog has an actual photo and not an empty string or placeholder
 */
export function hasValidDogPhoto(dog?: DogProfile | null): boolean {
  const photo = getDogPhotoUrl(dog);
  if (!photo) return false;
  const l = photo.toLowerCase();
  if (
    l.includes('placeholder') ||
    l.includes('default-avatar') ||
    l === 'none' ||
    l === 'sem foto' ||
    l === 'null' ||
    l === 'undefined'
  ) {
    return false;
  }
  return true;
}
