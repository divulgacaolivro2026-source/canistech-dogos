// Caminho: src/components/DogRegistrationModal.tsx
import React, { useState } from 'react';
import { DogProfile, BreedGroup, LifeStage, DogBloodType, AuthUser, DogPedigree } from '../types';
import { formatRgcCpf } from '../utils/qrCodeGenerator';
import { compressDogImageToWebp } from '../utils/imageCompressor';
import { sanitizeSafeDisplay } from '../services/authService';
import {
  Calculator,
  Heart,
  Dna,
  Camera,
  Upload,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface DogRegistrationModalProps {
  onClose: () => void;
  onSaveDog: (newDog: DogProfile) => void;
  onUpdateDog?: (updatedDog: DogProfile) => void;
  dogToEdit?: DogProfile | null;
  currentUser?: AuthUser | null;
  isBlockingRequired?: boolean;
}

const BREED_WEIGHT_BENCHMARKS: Record<string, { min: number; max: number; group: BreedGroup; exercise: number }> = {
  'Vira-Lata (SRD Caramelo)': { min: 12, max: 22, group: 'srd', exercise: 60 },
  'Golden Retriever': { min: 28, max: 36, group: 'retriever', exercise: 75 },
  'Labrador Retriever': { min: 27, max: 38, group: 'retriever', exercise: 75 },
  'Rottweiler': { min: 35, max: 50, group: 'trabalho', exercise: 65 },
  'Buldogue Campeiro (Bordoga)': { min: 35, max: 45, group: 'trabalho', exercise: 60 },
  'Fila Brasileiro': { min: 45, max: 65, group: 'trabalho', exercise: 60 },
  'Terrier Brasileiro (Fox Paulistinha)': { min: 6.5, max: 10, group: 'terrier', exercise: 50 },
  'Rastreador Brasileiro': { min: 25, max: 35, group: 'hound', exercise: 70 },
  'Dogue Brasileiro': { min: 30, max: 42, group: 'trabalho', exercise: 60 },
  'Ovelheiro Gaúcho': { min: 18, max: 28, group: 'pastores', exercise: 90 },
  'Pastor Alemão': { min: 30, max: 40, group: 'pastores', exercise: 70 },
  'Pastor Belga Malinois': { min: 25, max: 34, group: 'pastores', exercise: 110 },
  'Border Collie': { min: 14, max: 20, group: 'pastores', exercise: 120 },
  'Pastor Australiano (Aussie)': { min: 18, max: 28, group: 'pastores', exercise: 90 },
  'Welsh Corgi Pembroke': { min: 10, max: 14, group: 'pastores', exercise: 45 },
  'Doberman': { min: 32, max: 45, group: 'trabalho', exercise: 70 },
  'Boxer': { min: 25, max: 32, group: 'trabalho', exercise: 60 },
  'Cane Corso': { min: 40, max: 52, group: 'trabalho', exercise: 60 },
  'Dogue Alemão': { min: 50, max: 80, group: 'trabalho', exercise: 45 },
  'Boiadeiro Bernês': { min: 38, max: 50, group: 'trabalho', exercise: 50 },
  'São Bernardo': { min: 60, max: 90, group: 'trabalho', exercise: 40 },
  'Akita Inu': { min: 32, max: 48, group: 'trabalho', exercise: 50 },
  'Dogo Argentino': { min: 40, max: 50, group: 'trabalho', exercise: 70 },
  'Beagle': { min: 9, max: 14, group: 'hound', exercise: 60 },
  'Basset Hound': { min: 20, max: 29, group: 'hound', exercise: 35 },
  'Dálmata': { min: 24, max: 32, group: 'hound', exercise: 75 },
  'Husky Siberiano': { min: 16, max: 27, group: 'primitivo', exercise: 90 },
  'Samoeida': { min: 20, max: 30, group: 'primitivo', exercise: 60 },
  'Chow Chow': { min: 20, max: 32, group: 'primitivo', exercise: 35 },
  'Shiba Inu': { min: 8, max: 11, group: 'primitivo', exercise: 45 },
  'American Pit Bull Terrier (Pitbull)': { min: 15, max: 30, group: 'terrier', exercise: 70 },
  'American Bully': { min: 25, max: 45, group: 'companhia', exercise: 40 },
  'Bull Terrier': { min: 22, max: 32, group: 'terrier', exercise: 60 },
  'Jack Russell Terrier': { min: 5, max: 7, group: 'terrier', exercise: 70 },
  'Yorkshire Terrier': { min: 2.5, max: 3.5, group: 'companhia', exercise: 25 },
  'Buldogue Francês': { min: 9, max: 14, group: 'companhia', exercise: 25 },
  'Pug': { min: 6.5, max: 9, group: 'companhia', exercise: 20 },
  'Shih Tzu': { min: 4.5, max: 8, group: 'companhia', exercise: 20 },
  'Lhasa Apso': { min: 5.5, max: 8.5, group: 'companhia', exercise: 25 },
  'Maltês': { min: 3, max: 4, group: 'companhia', exercise: 25 },
  'Spitz Alemão (Lulu)': { min: 2, max: 4, group: 'companhia', exercise: 30 },
  'Pinscher Miniatura': { min: 3.5, max: 5, group: 'companhia', exercise: 40 },
  'Dachshund (Salsichinha)': { min: 5, max: 9, group: 'companhia', exercise: 35 },
  'Poodle (Standard / Médio / Toy)': { min: 4, max: 24, group: 'companhia', exercise: 50 },
  'Chihuahua': { min: 1.5, max: 3, group: 'companhia', exercise: 20 },
  'Cavalier King Charles': { min: 5.5, max: 8.5, group: 'companhia', exercise: 30 },
  'Cocker Spaniel Inglês': { min: 12, max: 15, group: 'retriever', exercise: 50 },
  'Weimaraner': { min: 28, max: 38, group: 'retriever', exercise: 80 },
  'Cão de Água Português': { min: 16, max: 25, group: 'retriever', exercise: 65 },
};

const BREED_SAMPLE_PHOTOS: Record<string, string> = {
  'Golden Retriever': '/src/assets/images/canistech_golden_thor_1792283197894.jpg',
  'Boiadeiro Bernês': '/src/assets/images/canistech_berner_kiara_1792283197962.jpg',
  'Vira-Lata (SRD Caramelo)': '/src/assets/images/canistech_caramelo_pacoca_1792283198351.jpg',
  'Rottweiler': '/src/assets/images/rottweiler_guard_1792287742425.jpg',
  'Buldogue Campeiro (Bordoga)': '/src/assets/images/buldogue_campeiro_1792287717839.jpg',
  'Fila Brasileiro': '/src/assets/images/fila_brasileiro_1792287717238.jpg',
  'Pastor Belga Malinois': '/src/assets/images/pastor_belga_malinois_1792287718159.jpg',
  'Pinscher Miniatura': '/src/assets/images/pinscher_miniatura_1792287767898.jpg',
  'Poodle (Standard / Médio / Toy)': '/src/assets/images/poodle_standard_1792287783838.jpg',
  'Pug': '/src/assets/images/pug_portrait_1792287743620.jpg',
  'Shih Tzu': '/src/assets/images/shih_tzu_portrait_1792287768416.jpg',
  'Yorkshire Terrier': '/src/assets/images/yorkshire_terrier_1792287767518.jpg',
  'Dachshund (Salsichinha)': '/src/assets/images/dachshund_salsicha_1792287742384.jpg',
};

export const DogRegistrationModal: React.FC<DogRegistrationModalProps> = ({
  onClose,
  onSaveDog,
  onUpdateDog,
  dogToEdit,
  currentUser,
  isBlockingRequired = false,
}) => {
  const isEditing = Boolean(dogToEdit);

  const [name, setName] = useState<string>(() => dogToEdit?.name || '');
  const [breed, setBreed] = useState<string>(() => dogToEdit?.breed || 'Golden Retriever');
  const [birthDate, setBirthDate] = useState<string>(() => dogToEdit?.birthDate || '2023-05-10');
  const [gender, setGender] = useState<'Macho' | 'Fêmea'>('Macho');
  const [neutered, setNeutered] = useState<boolean>(() => dogToEdit?.neutered ?? false);
  const [weight, setWeight] = useState<string>(() => (dogToEdit?.currentWeight ? String(dogToEdit.currentWeight) : '31.5'));
  const [microchip, setMicrochip] = useState<string>(
    () => dogToEdit?.microchip || ('981098' + Math.floor(100000 + Math.random() * 900000))
  );
  const [bloodType, setBloodType] = useState<DogBloodType>(
    () => (dogToEdit?.bloodType as DogBloodType) || 'Não informado'
  );
  const [tutorName, setTutorName] = useState<string>(
    () => dogToEdit?.tutorName || currentUser?.name || 'Mariana Silveira'
  );
  const [tutorPhone, setTutorPhone] = useState<string>(
    () => dogToEdit?.tutorPhone || '(11) 98765-4321'
  );
  const [city, setCity] = useState<string>(() => dogToEdit?.city || 'São Paulo');
  const [state, setState] = useState<string>(() => dogToEdit?.state || 'SP');

  // Vital Status & Photo
  const [vitalStatus, setVitalStatus] = useState<'alive' | 'deceased'>(
    () => dogToEdit?.vitalStatus || 'alive'
  );
  const [deceasedDate, setDeceasedDate] = useState<string>(() => {
    if (dogToEdit?.deceasedDate) return dogToEdit.deceasedDate;
    return new Date().toISOString().slice(0, 10);
  });
  const [photoUrl, setPhotoUrl] = useState<string>(() => {
    if (dogToEdit?.photoUrl) return dogToEdit.photoUrl;
    return BREED_SAMPLE_PHOTOS['Golden Retriever'] || '/src/assets/images/canistech_golden_thor_1792283197894.jpg';
  });
  const [compressedInfo, setCompressedInfo] = useState<string | null>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState<boolean>(false);

  // Etapa 4.1: Afixo do Canil & Árvore Genealógica de 3 Gerações (Pedigree)
  const [kennelAffix, setKennelAffix] = useState<string>(() => dogToEdit?.kennelAffix || '');
  const [showPedigreeForm, setShowPedigreeForm] = useState<boolean>(() =>
    Boolean(dogToEdit?.pedigree?.father?.name || dogToEdit?.pedigree?.mother?.name)
  );
  const [fatherName, setFatherName] = useState<string>(() => dogToEdit?.pedigree?.father?.name || '');
  const [fatherReg, setFatherReg] = useState<string>(() => dogToEdit?.pedigree?.father?.regNumber || '');
  const [motherName, setMotherName] = useState<string>(() => dogToEdit?.pedigree?.mother?.name || '');
  const [motherReg, setMotherReg] = useState<string>(() => dogToEdit?.pedigree?.mother?.regNumber || '');

  const [patGFName, setPatGFName] = useState<string>(() => dogToEdit?.pedigree?.paternalGrandfather?.name || '');
  const [patGFReg, setPatGFReg] = useState<string>(() => dogToEdit?.pedigree?.paternalGrandfather?.regNumber || '');
  const [patGMName, setPatGMName] = useState<string>(() => dogToEdit?.pedigree?.paternalGrandmother?.name || '');
  const [patGMReg, setPatGMReg] = useState<string>(() => dogToEdit?.pedigree?.paternalGrandmother?.regNumber || '');

  const [matGFName, setMatGFName] = useState<string>(() => dogToEdit?.pedigree?.maternalGrandfather?.name || '');
  const [matGFReg, setMatGFReg] = useState<string>(() => dogToEdit?.pedigree?.maternalGrandfather?.regNumber || '');
  const [matGMName, setMatGMName] = useState<string>(() => dogToEdit?.pedigree?.maternalGrandmother?.name || '');
  const [matGMReg, setMatGMReg] = useState<string>(() => dogToEdit?.pedigree?.maternalGrandmother?.regNumber || '');

  const handleBreedChange = (newBreed: string) => {
    setBreed(newBreed);
    if (!photoUrl.startsWith('data:image/')) {
      const sample = BREED_SAMPLE_PHOTOS[newBreed] || BREED_SAMPLE_PHOTOS['Vira-Lata (SRD Caramelo)'];
      if (sample) setPhotoUrl(sample);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressingPhoto(true);
    try {
      const compressed = await compressDogImageToWebp(file, 0.75);
      setPhotoUrl(compressed.dataUrl);
      setCompressedInfo(`WebP ${compressed.width}×${compressed.height}px (${compressed.sizeKb} KB)`);
    } catch (err) {
      console.error('Erro ao comprimir imagem para WebP:', err);
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  // Calculate biological life stage & age
  const today = new Date();
  const bDate = new Date(birthDate);
  const diffMonths = Math.max(0, (today.getFullYear() - bDate.getFullYear()) * 12 + (today.getMonth() - bDate.getMonth()));
  const years = Math.floor(diffMonths / 12);
  const months = diffMonths % 12;

  let calculatedLifeStage: LifeStage = 'adulto';
  if (diffMonths < 6) {
    calculatedLifeStage = 'filhote';
  } else if (diffMonths < 18) {
    calculatedLifeStage = 'adolescente';
  } else {
    calculatedLifeStage = 'adulto';
  }

  // Automated Canine BMI / BCS & Nutrition calculations
  const weightNum = parseFloat(weight) || 20;
  const benchmark = BREED_WEIGHT_BENCHMARKS[breed] || { min: 15, max: 25, group: 'srd', exercise: 60 };

  let idealMin = benchmark.min;
  let idealMax = benchmark.max;
  if (calculatedLifeStage === 'filhote') {
    idealMin = Math.round(benchmark.min * 0.4 * 10) / 10;
    idealMax = Math.round(benchmark.max * 0.55 * 10) / 10;
  } else if (calculatedLifeStage === 'adolescente') {
    idealMin = Math.round(benchmark.min * 0.75 * 10) / 10;
    idealMax = Math.round(benchmark.max * 0.88 * 10) / 10;
  }

  const idealAvg = (idealMin + idealMax) / 2;
  const ratio = weightNum / idealAvg;

  let estimatedBcs = 5;
  if (ratio <= 0.7) estimatedBcs = 2;
  else if (ratio <= 0.85) estimatedBcs = 3;
  else if (ratio <= 0.95) estimatedBcs = 4;
  else if (ratio <= 1.08) estimatedBcs = 5;
  else if (ratio <= 1.2) estimatedBcs = 6;
  else if (ratio <= 1.35) estimatedBcs = 7;
  else estimatedBcs = 8;

  const baseRer = 70 * Math.pow(weightNum, 0.75);
  const factor = neutered ? 1.4 : 1.6;
  const dailyMer = Math.round(baseRer * factor);
  const dailyGrams = Math.round(dailyMer / 3.6);
  const dailyWater = Math.round(weightNum * 55);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const dogId = dogToEdit?.id || 'dog-' + Date.now();
    const formattedRgc = formatRgcCpf(dogToEdit?.rgNumber, dogId);

    const hasAnyPedigreeField = Boolean(
      fatherName.trim() ||
        motherName.trim() ||
        patGFName.trim() ||
        patGMName.trim() ||
        matGFName.trim() ||
        matGMName.trim()
    );

    const builtPedigree: DogPedigree | undefined = hasAnyPedigreeField
      ? {
          ...(dogToEdit?.pedigree || {}),
          father: fatherName.trim()
            ? { name: sanitizeSafeDisplay(fatherName.trim()), regNumber: sanitizeSafeDisplay(fatherReg.trim()) }
            : undefined,
          mother: motherName.trim()
            ? { name: sanitizeSafeDisplay(motherName.trim()), regNumber: sanitizeSafeDisplay(motherReg.trim()) }
            : undefined,
          paternalGrandfather: patGFName.trim()
            ? { name: sanitizeSafeDisplay(patGFName.trim()), regNumber: sanitizeSafeDisplay(patGFReg.trim()) }
            : undefined,
          paternalGrandmother: patGMName.trim()
            ? { name: sanitizeSafeDisplay(patGMName.trim()), regNumber: sanitizeSafeDisplay(patGMReg.trim()) }
            : undefined,
          maternalGrandfather: matGFName.trim()
            ? { name: sanitizeSafeDisplay(matGFName.trim()), regNumber: sanitizeSafeDisplay(matGFReg.trim()) }
            : undefined,
          maternalGrandmother: matGMName.trim()
            ? { name: sanitizeSafeDisplay(matGMName.trim()), regNumber: sanitizeSafeDisplay(matGMReg.trim()) }
            : undefined,
        }
      : dogToEdit?.pedigree;

    const updatedProfile: DogProfile = {
      ...(dogToEdit || {}),
      id: dogId,
      ownerEmail: currentUser?.email || dogToEdit?.ownerEmail || 'local',
      name: sanitizeSafeDisplay(name.trim()),
      kennelAffix: kennelAffix.trim() ? sanitizeSafeDisplay(kennelAffix.trim()) : undefined,
      pedigree: builtPedigree,
      breed: sanitizeSafeDisplay(breed),
      breedGroup: benchmark.group,
      birthDate,
      ageYears: years,
      ageMonths: months,
      lifeStage: calculatedLifeStage,
      gender,
      neutered,
      microchip: sanitizeSafeDisplay(microchip.trim()) || ('981098' + Math.floor(100000 + Math.random() * 900000)),
      rgNumber: formattedRgc,
      tutorName: sanitizeSafeDisplay(tutorName.trim() || currentUser?.name || 'Tutor Responsável'),
      tutorPhone: sanitizeSafeDisplay(tutorPhone.trim() || '(11) 99999-9999'),
      tutorEmail: sanitizeSafeDisplay(currentUser?.email || dogToEdit?.tutorEmail || ''),
      city: sanitizeSafeDisplay(city.trim() || 'São Paulo'),
      state: sanitizeSafeDisplay(state),
      currentWeight: weightNum,
      idealWeightMin: idealMin,
      idealWeightMax: idealMax,
      AdultBaseWeightMin: benchmark.min,
      AdultBaseWeightMax: benchmark.max,
      bcsScore: estimatedBcs,
      bloodType,
      photoUrl: photoUrl.trim(),
      vitalStatus,
      deceasedDate: vitalStatus === 'deceased' ? deceasedDate : undefined,
      dietGramsPerDay: dailyGrams,
      dietPortions: 2,
      dailyWaterMl: dailyWater,
      dailyExerciseMin: benchmark.exercise,
      cognitiveMin: 25,
      supplements: dogToEdit?.supplements || 'Fórmula preventiva equilibrada CanisTech',
      allergies: dogToEdit?.allergies || ['Nenhuma alergia relatada no cadastro inicial'],
      anatomicRisk: dogToEdit?.anatomicRisk || `Monitoramento biométrico padrão para a raça ${breed}`,
      rgcIssuedAt: dogToEdit?.rgcIssuedAt,
      rgcExpiresAt: dogToEdit?.rgcExpiresAt,
      rgcSecurityHash: dogToEdit?.rgcSecurityHash,
    };

    if (isEditing && onUpdateDog) {
      onUpdateDog(updatedProfile);
    } else {
      onSaveDog(updatedProfile);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex justify-between items-start pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                {isEditing ? `Editar Ficha Cadastral: ${dogToEdit?.name}` : 'Cadastrar Novo Cão no DogOS'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Identificação Biométrica Oficial (RGC Padrão CPF), Prova de Vida e Gestão Canina.
            </p>
          </div>
          {!isBlockingRequired && (
            <button
              onClick={onClose}
              className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Blocking Alert if applicable */}
        {isBlockingRequired && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Atenção: Cadastro Obrigatório de Cão Ativo</strong>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                Não há nenhum animal ativo cadastrado nesta conta (ou todos constam com encerramento por óbito). Para desbloquear as operações da plataforma, cadastre um animal ativo.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Seção 1: Status Vital do Animal */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                <Heart className="w-4 h-4 text-[#E07A5F]" />
                Status Vital & Ciclo de Vida
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  vitalStatus === 'alive'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                {vitalStatus === 'alive' ? '● Animal Ativo' : '† Conta Encerrada por Óbito'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Condição Vital:
                </label>
                <select
                  value={vitalStatus}
                  onChange={(e) => setVitalStatus(e.target.value as 'alive' | 'deceased')}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-medium outline-none"
                >
                  <option value="alive">Animal Ativo / Vivo (Operações normais)</option>
                  <option value="deceased">Animal Falecido (Encerrar Conta deste Cão)</option>
                </select>
              </div>

              {vitalStatus === 'deceased' && (
                <div className="animate-in fade-in duration-200">
                  <label className="block font-semibold text-rose-700 dark:text-rose-300 mb-1">
                    Data do Falecimento / Óbito:
                  </label>
                  <input
                    type="date"
                    required={vitalStatus === 'deceased'}
                    value={deceasedDate}
                    onChange={(e) => setDeceasedDate(e.target.value)}
                    className="w-full bg-rose-50/60 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 rounded-xl px-3 py-2 text-xs text-rose-900 dark:text-rose-200 font-mono outline-none"
                  />
                </div>
              )}
            </div>

            {vitalStatus === 'deceased' && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 italic">
                * Ao marcar o animal como falecido, as emissões de novos documentos e rotinas serão encerradas. Os registros históricos permanecem salvos em memória.
              </p>
            )}
          </div>

          {/* Seção 2: Foto Biométrica Obrigatória */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                <Camera className="w-4 h-4 text-emerald-600" />
                Fotografia Biométrica do Animal (Obrigatória para RGC)
              </span>
              {photoUrl && !photoUrl.includes('placeholder') ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  ✓ Foto Vinculada
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  Foto Pendente
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Preview 3x4 Proporcional */}
              <div className="relative w-20 h-24 sm:w-24 sm:h-32 rounded-xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 shrink-0 shadow-sm">
                {photoUrl ? (
                  <img src={photoUrl} alt="Foto do cão" className="w-full h-full object-cover select-none" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center text-[10px]">
                    <Camera className="w-6 h-6 mb-1" />
                    Sem Foto
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-slate-900/70 text-white text-[8px] text-center py-0.5 uppercase tracking-wider font-semibold">
                  Padrão 3x4
                </div>
              </div>

              {/* Controles de Foto */}
              <div className="space-y-2 flex-1 w-full">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fazer Upload de Foto do Cão (Compressão Automática WebP 360×480px):
                  </label>
                  <label className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 rounded-xl cursor-pointer bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs transition-colors">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {isCompressingPhoto
                        ? 'Processando e comprimindo em WebP 3x4...'
                        : compressedInfo
                        ? `✓ Otimizada: ${compressedInfo}`
                        : 'Selecionar imagem do computador...'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ou colar URL da imagem:
                  </label>
                  <input
                    type="text"
                    value={photoUrl.startsWith('data:image/') ? '(Imagem local comprimida em WebP 3x4)' : photoUrl}
                    onChange={(e) => {
                      if (!e.target.value.includes('(Imagem local')) {
                        setPhotoUrl(e.target.value);
                      }
                    }}
                    placeholder="https://exemplo.com/foto-do-pet.jpg"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 3: Dados Principais + Afixo do Canil */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome do Cão:</label>
              <input
                type="text"
                required
                placeholder="Ex: Luke, Thor, Paçoca..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Afixo do Canil (Opcional):
              </label>
              <input
                type="text"
                placeholder="Ex: von Sternberg, di Monteverdi..."
                value={kennelAffix}
                onChange={(e) => setKennelAffix(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Raça / Linhagem:</label>
              <select
                value={breed}
                onChange={(e) => handleBreedChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-slate-900"
              >
                {Object.keys(BREED_WEIGHT_BENCHMARKS).map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Seção 3B: Árvore Genealógica de 3 Gerações (Pedigree Oficial & Cálculo COI Wright) */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Dna className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  Árvore Genealógica • Pedigree de 3 Gerações (Pai, Mãe e 4 Avós)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPedigreeForm(!showPedigreeForm)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 cursor-pointer"
              >
                <span>{showPedigreeForm ? 'Ocultar Pedigree' : 'Preencher Pedigree (3 Gerações)'}</span>
                {showPedigreeForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showPedigreeForm && (
              <div className="space-y-3 pt-2 border-t border-slate-200/70 dark:border-slate-700/70 animate-in fade-in duration-150">
                <p className="text-[11px] text-slate-500">
                  Informe os nomes e números de registro (RG/CBKC/FCI) dos Pais e Avós Paternos/Maternos para exibir a Árvore Genealógica no Dossiê e habilitar o cálculo científico exato de COI (Fórmula de Wright).
                </p>

                {/* 1ª Geração: Pai e Mãe */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-400 block">
                      1ª Geração • Pai (Genitor Paterno)
                    </span>
                    <input
                      type="text"
                      placeholder="Nome do Pai (Ex: Apollo von Sternberg)"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Registro RG / CBKC / FCI (Ex: CBKC-784992)"
                      value={fatherReg}
                      onChange={(e) => setFatherReg(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-[11px] font-mono outline-none"
                    />
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-rose-700 dark:text-rose-400 block">
                      1ª Geração • Mãe (Matriz Materna)
                    </span>
                    <input
                      type="text"
                      placeholder="Nome da Mãe (Ex: Luna Golden Valley)"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Registro RG / CBKC / FCI (Ex: CBKC-712304)"
                      value={motherReg}
                      onChange={(e) => setMotherReg(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-[11px] font-mono outline-none"
                    />
                  </div>
                </div>

                {/* 2ª Geração: 4 Avós */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      2ª Geração • Avô Paterno
                    </span>
                    <input
                      type="text"
                      placeholder="Nome do Avô Paterno"
                      value={patGFName}
                      onChange={(e) => setPatGFName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Nº Registro RG/CBKC"
                      value={patGFReg}
                      onChange={(e) => setPatGFReg(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-mono outline-none"
                    />
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      2ª Geração • Avó Paterna
                    </span>
                    <input
                      type="text"
                      placeholder="Nome da Avó Paterna"
                      value={patGMName}
                      onChange={(e) => setPatGMName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Nº Registro RG/CBKC"
                      value={patGMReg}
                      onChange={(e) => setPatGMReg(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-mono outline-none"
                    />
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      2ª Geração • Avô Materno
                    </span>
                    <input
                      type="text"
                      placeholder="Nome do Avô Materno"
                      value={matGFName}
                      onChange={(e) => setMatGFName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Nº Registro RG/CBKC"
                      value={matGFReg}
                      onChange={(e) => setMatGFReg(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-mono outline-none"
                    />
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      2ª Geração • Avó Materna
                    </span>
                    <input
                      type="text"
                      placeholder="Nome da Avó Materna"
                      value={matGMName}
                      onChange={(e) => setMatGMName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Nº Registro RG/CBKC"
                      value={matGMReg}
                      onChange={(e) => setMatGMReg(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-mono outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Row: Nascimento, Sexo, Castrado, Peso */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nascimento:</label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Sexo:</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'Macho' | 'Fêmea')}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none"
              >
                <option value="Macho">Macho</option>
                <option value="Fêmea">Fêmea</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Castrado?</label>
              <select
                value={neutered ? 'sim' : 'nao'}
                onChange={(e) => setNeutered(e.target.value === 'sim')}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none"
              >
                <option value="nao">Não Castrado</option>
                <option value="sim">Castrado</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Peso Atual (kg):</label>
              <input
                type="number"
                step="0.1"
                required
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
          </div>

          {/* Microchip & Tipo Sanguíneo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Microchip ISO 11784/11785:</span>
                <span className="text-[10px] text-slate-400 font-normal">Exibido na Cédula RGC</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 981098765432100"
                value={microchip}
                onChange={(e) => setMicrochip(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo Sanguíneo Canino (Opcional):
              </label>
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value as DogBloodType)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none font-medium"
              >
                <option value="Não informado">Não informado (Ocultar no verso do RGC)</option>
                <option value="DEA 1.1 Positivo">DEA 1.1 Positivo</option>
                <option value="DEA 1.1 Negativo (Doador Universal)">DEA 1.1 Negativo (Doador Universal)</option>
                <option value="DEA 1.2">DEA 1.2</option>
                <option value="DEA 3">DEA 3</option>
                <option value="DEA 4">DEA 4</option>
                <option value="DEA 5">DEA 5</option>
                <option value="DEA 7">DEA 7</option>
              </select>
            </div>
          </div>

          {/* Biometrics Summary Box */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                <Calculator className="w-3.5 h-3.5 text-[#E07A5F]" />
                Diagnóstico Biométrico & Estimativa de Saúde
              </span>
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                  {calculatedLifeStage === 'filhote' && '🐾 Filhote'}
                  {calculatedLifeStage === 'adolescente' && '🐕 Adolescente'}
                  {calculatedLifeStage === 'adulto' && '🦮 Adulto'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  Escore {estimatedBcs}/9 WSAVA
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 block font-semibold">Faixa Ideal</span>
                <strong className="text-slate-900 dark:text-slate-100 font-mono text-[11px]">{idealMin} - {idealMax} kg</strong>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 block font-semibold">Calorias (MER)</span>
                <strong className="text-slate-900 dark:text-slate-100 font-mono text-[11px]">{dailyMer} kcal</strong>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 block font-semibold">Ração Super Prem.</span>
                <strong className="text-slate-900 dark:text-slate-100 font-mono text-[11px]">{dailyGrams} g/dia</strong>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 block font-semibold">Exercício</span>
                <strong className="text-slate-900 dark:text-slate-100 font-mono text-[11px]">{benchmark.exercise} min</strong>
              </div>
            </div>
          </div>

          {/* Dados do Tutor e Região */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome do(a) Tutor(a):</label>
              <input
                type="text"
                required
                value={tutorName}
                onChange={(e) => setTutorName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">WhatsApp de Contato:</label>
              <input
                type="tel"
                required
                value={tutorPhone}
                onChange={(e) => setTutorPhone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Cidade:</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">UF:</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none"
                >
                  <option value="SP">SP</option>
                  <option value="RJ">RJ</option>
                  <option value="MG">MG</option>
                  <option value="PR">PR</option>
                  <option value="RS">RS</option>
                  <option value="DF">DF</option>
                  <option value="BA">BA</option>
                  <option value="SC">SC</option>
                  <option value="GO">GO</option>
                  <option value="PE">PE</option>
                  <option value="CE">CE</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            {!isBlockingRequired && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold shadow-sm transition-all"
            >
              {isEditing ? 'Salvar Alterações do Cão' : 'Finalizar Cadastro & Emitir RGC'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
