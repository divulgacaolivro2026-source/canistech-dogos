import React, { useState } from 'react';
import { DogProfile, BreedGroup, LifeStage, DogBloodType, AuthUser } from '../types';
import {
  Sparkles,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Activity,
  Utensils,
  Droplet,
  Heart,
  Dna,
} from 'lucide-react';

interface DogRegistrationModalProps {
  onClose: () => void;
  onSaveDog: (newDog: DogProfile) => void;
  currentUser?: AuthUser | null;
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

export const DogRegistrationModal: React.FC<DogRegistrationModalProps> = ({
  onClose,
  onSaveDog,
  currentUser,
}) => {
  const [name, setName] = useState<string>('');
  const [breed, setBreed] = useState<string>('Golden Retriever');
  const [birthDate, setBirthDate] = useState<string>('2023-05-10');
  const [gender, setGender] = useState<'Macho' | 'Fêmea'>('Macho');
  const [neutered, setNeutered] = useState<boolean>(false);
  const [weight, setWeight] = useState<string>('31.5');
  const [microchip, setMicrochip] = useState<string>(() => '981098' + Math.floor(100000 + Math.random() * 900000));
  const [bloodType, setBloodType] = useState<DogBloodType>('Não informado');
  const [tutorName, setTutorName] = useState<string>(() => currentUser?.name || 'Mariana Silveira');
  const [tutorPhone, setTutorPhone] = useState<string>('(11) 98765-4321');
  const [city, setCity] = useState<string>('São Paulo');
  const [state, setState] = useState<string>('SP');

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

  // Sincroniza faixa de peso ideal com a fase biológica
  let idealMin = benchmark.min;
  let idealMax = benchmark.max;
  if (calculatedLifeStage === 'filhote') {
    idealMin = Math.round(benchmark.min * 0.40 * 10) / 10;
    idealMax = Math.round(benchmark.max * 0.55 * 10) / 10;
  } else if (calculatedLifeStage === 'adolescente') {
    idealMin = Math.round(benchmark.min * 0.75 * 10) / 10;
    idealMax = Math.round(benchmark.max * 0.88 * 10) / 10;
  }

  const idealAvg = (idealMin + idealMax) / 2;
  const ratio = weightNum / idealAvg;

  // Estimate WSAVA BCS from 1 to 9
  let estimatedBcs = 5;
  if (ratio <= 0.7) estimatedBcs = 2;
  else if (ratio <= 0.85) estimatedBcs = 3;
  else if (ratio <= 0.95) estimatedBcs = 4;
  else if (ratio <= 1.08) estimatedBcs = 5;
  else if (ratio <= 1.20) estimatedBcs = 6;
  else if (ratio <= 1.35) estimatedBcs = 7;
  else estimatedBcs = 8;

  // MER: 70 * weight^0.75 * factor
  const baseRer = 70 * Math.pow(weightNum, 0.75);
  const factor = neutered ? 1.4 : 1.6;
  const dailyMer = Math.round(baseRer * factor);
  // Estimate grams of super premium kibble (~3.6 kcal/g)
  const dailyGrams = Math.round(dailyMer / 3.6);
  // Water: 55 ml/kg
  const dailyWater = Math.round(weightNum * 55);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newDog: DogProfile = {
      id: 'dog-' + Date.now(),
      ownerEmail: currentUser?.email || 'local',
      name: name.trim(),
      breed,
      breedGroup: benchmark.group,
      birthDate,
      ageYears: years,
      ageMonths: months,
      lifeStage: calculatedLifeStage,
      gender,
      neutered,
      microchip: microchip.trim() || ('981098' + Math.floor(100000 + Math.random() * 900000)),
      rgNumber: `${state}-${Math.floor(1000 + Math.random() * 9000)}-${name.toUpperCase().slice(0, 4)}`,
      tutorName: tutorName.trim() || currentUser?.name || 'Tutor Responsável',
      tutorPhone: tutorPhone.trim() || '(11) 99999-9999',
      tutorEmail: currentUser?.email || '',
      city: city.trim() || 'São Paulo',
      state,
      currentWeight: weightNum,
      idealWeightMin: idealMin,
      idealWeightMax: idealMax,
      AdultBaseWeightMin: benchmark.min,
      AdultBaseWeightMax: benchmark.max,
      bcsScore: estimatedBcs,
      bloodType,
      photoUrl:
        breed === 'Golden Retriever'
          ? '/src/assets/images/canistech_golden_thor_1792283197894.jpg'
          : breed === 'Boiadeiro Bernês'
          ? '/src/assets/images/canistech_berner_kiara_1792283197962.jpg'
          : '/src/assets/images/canistech_caramelo_pacoca_1792283198351.jpg',
      dietGramsPerDay: dailyGrams,
      dietPortions: 2,
      dailyWaterMl: dailyWater,
      dailyExerciseMin: benchmark.exercise,
      cognitiveMin: 25,
      supplements: 'Fórmula preventiva equilibrada CanisTech',
      allergies: ['Nenhuma alergia relatada no cadastro inicial'],
      anatomicRisk: `Monitoramento biométrico padrão para a raça ${breed}`,
    };

    onSaveDog(newDog);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-heading">
              Cadastrar Novo Cão no DogOS
            </h2>
            <p className="text-xs text-slate-500">
              Gere a Carteira de Identidade Digital (RG Pet), QR Tag e cálculo biométrico de IMC
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Row 1: Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nome do Cão:</label>
              <input
                type="text"
                required
                placeholder="Ex: Luke, Maya, Bob..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Raça:</label>
              <select
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900"
              >
                {Object.keys(BREED_WEIGHT_BENCHMARKS).map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Birth, Gender, Neutered, Weight */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nascimento:</label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sexo:</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'Macho' | 'Fêmea')}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-none"
              >
                <option value="Macho">Macho</option>
                <option value="Fêmea">Fêmea</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Castrado?</label>
              <select
                value={neutered ? 'sim' : 'nao'}
                onChange={(e) => setNeutered(e.target.value === 'sim')}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-none"
              >
                <option value="nao">Não Castrado</option>
                <option value="sim">Castrado</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Peso Atual (kg):</label>
              <input
                type="number"
                step="0.1"
                required
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 outline-none"
              />
            </div>
          </div>

          {/* Row 2.5: Microchip & Blood Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Microchip ISO 11784/11785:</span>
                <span className="text-[10px] text-slate-400 font-normal">Propagado ao RG Pet</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 981098765432100"
                value={microchip}
                onChange={(e) => setMicrochip(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tipo Sanguíneo Canino (Opcional):
              </label>
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value as DogBloodType)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-none font-medium"
              >
                <option value="Não informado">Não informado</option>
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

          {/* Real-Time Canine IMC & Biometric Estimator Box */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-[#E07A5F]" />
                Diagnóstico Biométrico & Fase Biológica
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  {calculatedLifeStage === 'filhote' && '🐾 Fase: Filhote (<6m)'}
                  {calculatedLifeStage === 'adolescente' && '🐕 Fase: Adolescente (6-18m)'}
                  {calculatedLifeStage === 'adulto' && '🦮 Fase: Adulto (>18m)'}
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    estimatedBcs >= 4 && estimatedBcs <= 5
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  Escore {estimatedBcs} / 9 (WSAVA)
                </span>
                {bloodType === 'DEA 1.1 Negativo (Doador Universal)' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                    ❤️ Doador Universal
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Peso Ideal ({calculatedLifeStage})</span>
                <strong className="text-slate-900 font-mono">{idealMin} - {idealMax} kg</strong>
                <span className="text-[9px] text-slate-400 block">Ref. Adulto: {benchmark.min}-{benchmark.max}kg</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Calorias (MER)</span>
                <strong className="text-slate-900 font-mono">{dailyMer} kcal/dia</strong>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Ração Super Premium</span>
                <strong className="text-slate-900 font-mono">{dailyGrams} g/dia</strong>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Exercício Diário</span>
                <strong className="text-slate-900 font-mono">{benchmark.exercise} min/dia</strong>
              </div>
            </div>
          </div>

          {/* Row 3: Tutor Details & Region */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nome do(a) Tutor(a):</label>
              <input
                type="text"
                required
                value={tutorName}
                onChange={(e) => setTutorName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">WhatsApp de Contato:</label>
              <input
                type="tel"
                required
                value={tutorPhone}
                onChange={(e) => setTutorPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cidade:</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-2 text-xs text-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">UF:</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-2 text-xs text-slate-900 outline-none"
                >
                  <option value="SP">SP</option>
                  <option value="RJ">RJ</option>
                  <option value="MG">MG</option>
                  <option value="PR">PR</option>
                  <option value="RS">RS</option>
                  <option value="DF">DF</option>
                  <option value="BA">BA</option>
                  <option value="CE">CE</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-sm transition-all"
            >
              Finalizar Cadastro & Emitir RG Pet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
