export type LifeStage = 'filhote' | 'adolescente' | 'adulto';

export type DogBloodType =
  | 'DEA 1.1 Positivo'
  | 'DEA 1.1 Negativo (Doador Universal)'
  | 'DEA 1.2'
  | 'DEA 3'
  | 'DEA 4'
  | 'DEA 5'
  | 'DEA 7'
  | 'Não informado';

export type BreedGroup =
  | 'srd'
  | 'retriever'
  | 'pastores'
  | 'companhia'
  | 'trabalho'
  | 'terrier'
  | 'primitivo'
  | 'hound'
  | string;

export interface DonationRecord {
  id: string;
  donorName: string;
  dogHonored?: string;
  amount: number;
  date: string;
  message?: string;
  isMonthly: boolean;
  tier: 'diamante' | 'ouro' | 'prata' | 'bronze';
}

export interface PedigreeAncestor {
  name: string;
  regNumber?: string; // Número de registro RG / CBKC / FCI
  registrationNumber?: string; // Alias de compatibilidade
}

export interface DogPedigree {
  // 1ª Geração: Pais
  father?: PedigreeAncestor;
  mother?: PedigreeAncestor;
  // 2ª Geração: Avós Paternos e Maternos
  paternalGrandfather?: PedigreeAncestor;
  paternalGrandmother?: PedigreeAncestor;
  maternalGrandfather?: PedigreeAncestor;
  maternalGrandmother?: PedigreeAncestor;
  // 3ª Geração: Bisavós Paternos e Maternos (8 ancestrais para Wright 3 Gerações)
  paternalGGF1?: PedigreeAncestor; // Pai do Avô Paterno
  paternalGGM1?: PedigreeAncestor; // Mãe do Avô Paterno
  paternalGGF2?: PedigreeAncestor; // Pai da Avó Paterna
  paternalGGM2?: PedigreeAncestor; // Mãe da Avó Paterna
  maternalGGF1?: PedigreeAncestor; // Pai do Avô Materno
  maternalGGM1?: PedigreeAncestor; // Mãe do Avô Materno
  maternalGGF2?: PedigreeAncestor; // Pai da Avó Materna
  maternalGGM2?: PedigreeAncestor; // Mãe da Avó Materna
}

export interface LgpdConsentRecord {
  accepted: boolean;
  timestamp: string;
  acceptedAt?: string;
  policyVersion: string;
  consentHash: string;
  userEmail?: string;
  userAgent?: string;
  dpoChannel?: string;
}

export interface DogProfile {
  id: string;
  ownerEmail?: string;         // Isolamento estrito por conta (Multi-tenant)
  name: string;                // Obrigatório
  kennelAffix?: string;        // Afixo do Canil (Ex: von CanisTech, do Vale Dourado)
  pedigree?: DogPedigree;      // Árvore Genealógica de 3 Gerações (Pais, Avós e Bisavós)
  breed: string;               // Obrigatório
  breedGroup: BreedGroup;
  birthDate: string;           // Obrigatório (YYYY-MM-DD ou DD/MM/AAAA) - Base para fase biológica
  ageYears: number;
  ageMonths: number;
  lifeStage?: LifeStage;       // Calculado dinamicamente: 'filhote' | 'adolescente' | 'adulto'
  gender: 'Macho' | 'Fêmea';   // Obrigatório
  neutered: boolean;
  currentWeight: number;       // Obrigatório (kg)
  idealWeightMin: number;      // Sincronizado com a fase biológica
  idealWeightMax: number;      // Sincronizado com a fase biológica
  AdultBaseWeightMin?: number; // Peso adulto mínimo de referência da raça
  AdultBaseWeightMax?: number; // Peso adulto máximo de referência da raça
  bcsScore: number;            // Escala WSAVA 1 a 9
  microchip: string;           // Obrigatório na ficha / Propagado automaticamente ao RG Pet
  rgNumber: string;            // Gerado automaticamente (Ex: SP-8124-THAN ou 000.000.000-CT)
  rgcNumber?: string;           // Alias de compatibilidade para Registro Geral Canino
  bloodType?: DogBloodType | string; // OPCIONAL (Requisito 5)
  photoUrl: string;            // Obrigatório (DataURL Base64 da foto real do cão)
  photo?: string;              // Alias de compatibilidade
  avatar?: string;             // Alias de compatibilidade
  imageUrl?: string;           // Alias de compatibilidade
  vitalStatus?: 'alive' | 'deceased'; // Status Vital: 'alive' (padrão) | 'deceased'
  deceasedDate?: string;       // Data de falecimento caso vitalStatus === 'deceased'
  rgcIssuedAt?: string;        // Data ISO da primeira impressão/emissão do documento
  rgcExpiresAt?: string;       // Validade de 1 ano após rgcIssuedAt
  rgcSecurityHash?: string;    // Hash único de autenticidade anti-clonagem
  city: string;                // Obrigatório
  state: string;               // Obrigatório (UF)
  tutorName: string;           // Obrigatório
  tutorCpf?: string;           // CPF opcional mascarado do tutor
  tutorPhone: string;          // Obrigatório
  tutorEmail?: string;
  dietGramsPerDay: number;
  dietPortions: number;
  dailyWaterMl: number;
  supplements: string;
  dailyExerciseMin: number;
  cognitiveMin: number;
  allergies?: string[];
  anatomicRisk?: string;
}

export interface WeightRecord {
  id: string;
  dogId?: string;
  date: string;
  weight: number;
  note?: string;
}

export interface VaccineRecord {
  id: string;
  dogId?: string;               // Vinculado ao cão específico (Suporte a múltiplos cães)
  name: string;
  description: string;
  manufacturer: string;
  lot: string;
  lastDate: string;            // DD/MM/AAAA
  nextDate: string;            // DD/MM/AAAA (Agendada pelo tutor)
  daysRemaining: number;
  status: 'valid' | 'warning' | 'expired' | 'overdue';
  category?: 'vacina' | 'antiparasitario' | 'vermifugo' | 'outro';
  clinic?: string;
  veterinarianCrmv?: string;
  reminderScheduled?: boolean;
}

export type PartnerCategory = 'veterinario' | 'loja_racao' | 'pet_shop';

export interface GeoPartnerLocation {
  id: string;
  name: string;
  category: PartnerCategory;
  categoryLabel: 'Veterinário / Clínica 24h' | 'Loja de Ração & Nutrição' | 'Pet Shop & Banho/Tosa';
  address: string;
  city: string;
  state: string;
  phone: string;
  whatsapp?: string;
  latitude: number;
  longitude: number;
  openingHours: string;
  crmvResp?: string;
  verifiedByAdmin: boolean;
  createdAt: string;
}

export interface TrainingCertificateRecord {
  authCode: string;            // Hash único verificável (Ex: CERT-CT-2026-9F8A-4B1C)
  dogId: string;
  dogName: string;
  dogBreed: string;
  dogPhotoUrl: string;
  tutorName: string;
  tutorEmail: string;
  issuedAt: string;            // DD/MM/AAAA HH:mm
  responsibilityAccepted: boolean;
  completedModulesCount: number;
}

export interface VaccineReminderSettings {
  enabled: boolean;
  leadDays: number; // default: 7 (avisar tutores com 7 dias de antecedência)
  channels: ('email' | 'push')[];
  tutorEmail: string;
  pushEnabled: boolean;
  additionalOneDayAlert: boolean;
  scheduledVaccineIds: string[];
  lastDispatchedAlert?: {
    vaccineName: string;
    date: string;
    channel: string;
  };
}

export interface VaccineReminderSchedule {
  vaccineId: string;
  vaccineName: string;
  category: string;
  nextDate: string;
  alertDate: string; // Exact date 7 days before nextDate
  daysUntilAlert: number;
  isAlertTriggered: boolean; // Days until next dose <= 7
  scheduled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
}

export interface ToxicItem {
  id: string;
  name: string;
  category: 'alimento' | 'medicamento' | 'planta' | 'quimico';
  dangerLevel: 'fatal' | 'severe' | 'moderate';
  toxicPrinciple: string;
  criticalDose: string;
  clinicalSymptoms: string[];
  primaryRisk: string;
  firstAidAdvice: string;
}

export interface BreedInfo {
  id: string;
  name: string;
  origin: string;
  group: BreedGroup;
  size: 'pequeno' | 'medio' | 'grande';
  weightRange: string;
  energyLevel: 'moderada' | 'alta' | 'extrema';
  heatTolerance: 'alta' | 'moderada' | 'baixa';
  housing: 'apartamento' | 'casa' | 'sitio';
  exerciseDailyMin: number;
  description: string;
  coatCareInBrazil: string;
  geneticRisks: string[];
  photoUrl: string;
}

export interface YloveCandidate {
  id: string;
  name: string;
  breed: string;
  lineage: string;
  pedigreeNumber: string;
  pedigreeOrg: 'CBKC' | 'FCI' | 'AKC';
  role: 'Macho Reprodutor' | 'Matriz Registrada';
  ageYears: number;
  city: string;
  state: string;
  weight: number;
  temperament: string;
  immunizationStatus: string;
  coiPercentage: number;
  bcsScore: number;
  estrusCycle?: string;
  certificates: {
    hipDysplasia: string; // e.g. HD-A
    elbowDysplasia?: string;
    brucellosis: string; // Negativa
    dnaPanel: string; // Embark Livre
    cardio: string; // Eletro / Eco normal
  };
  tutorName: string;
  tutorRole: string;
  photoUrl: string;
  pedigree?: DogPedigree;
}

export interface AdoptionDog {
  id: string;
  name: string;
  gender: 'Macho' | 'Fêmea';
  ageFormatted: string;
  city: string;
  state: string;
  weight: number;
  size: 'Pequeno' | 'Médio' | 'Grande';
  castrated: boolean;
  ongName: string;
  story: string;
  tags: string[];
  photoUrl: string;
}

export interface ContestCandidate {
  id: string;
  number: string;
  name: string;
  breed: string;
  ageFormatted: string;
  location: string;
  story: string;
  votes: number;
  photoUrl: string;
}

export interface PartnerSpecialist {
  id: string;
  name: string;
  category: 'hospital_24h' | 'comportamento' | 'nutrologia' | 'petshop_spa';
  categoryLabel: string;
  address: string;
  distanceKm: number;
  phone: string;
  rating: number;
  reviewsCount: number;
  description: string;
  is24hEmergency: boolean;
  hasCrmvVerified: boolean;
}

export interface AdCampaign {
  id: string;
  name: string;
  advertiser: string;
  placement: 'sidebar' | 'banner' | 'in_feed';
  impressions: number;
  clicks: number;
  ctr: number;
  monthlyRevenue: number;
  status: 'active' | 'paused';
}

export interface RegionGeoStat {
  uf: string;
  stateName: string;
  capital: string;
  xPercent: number; // for SVG visualization
  yPercent: number;
  pinColor: string;
  totalMonitoredDogs: number;
  topBreeds: { name: string; percentage: number }[];
  hospitals24hCount: number;
  specialistsCount: number;
  dominantGroup: string;
}

export type AuthProvider = 'google';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
  provider: AuthProvider;
  role: 'tutor' | 'veterinario' | 'admin';
  createdAt: string;
  lastLoginAt: string;
  accessToken?: string;
  token?: string;
}

export interface DailyActivityRecord {
  id: string;
  dogId: string;
  date: string; // YYYY-MM-DD
  dayLabel: string; // Seg, Ter, Qua, Qui, Sex, Sáb, Dom
  walkingMinutes: number;
  playMinutes: number;
  cognitiveMinutes: number;
  distanceKm: number;
  caloriesBurned: number;
  intensity: 'leve' | 'moderada' | 'intensa';
  notes?: string;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  provider: AuthProvider | 'system';
  ipMock: string;
  status: 'SUCCESS' | 'WARNING' | 'DENIED';
  details: string;
}

export type AuditLogEntry = SecurityAuditLog;

export interface RegisteredAccount {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
  provider: AuthProvider;
  role: 'tutor' | 'veterinario' | 'admin';
  createdAt: string;
  lastLoginAt: string;
  loginCount: number;
  isSeniorAdmin: boolean;
  status: 'active' | 'suspended';
}

