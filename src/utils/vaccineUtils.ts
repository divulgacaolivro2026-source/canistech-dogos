import { VaccineRecord, DogProfile } from '../types';

export type VaccineUrgency = 'overdue' | 'imminent' | 'upcoming' | 'safe';

export interface VaccineWithProximity extends VaccineRecord {
  calculatedDaysRemaining: number;
  urgency: VaccineUrgency;
  urgencyLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  cardBorder: string;
  progressPercent: number;
  progressColor: string;
  isTodayOrTomorrow: boolean;
  formattedLastDate: string;
  formattedNextDate: string;
  // 7-Day Reminder Scheduling Properties
  alertDate7d: string; // Exact date 7 days before next dose (DD/MM/YYYY)
  daysUntil7dAlert: number; // Positive = days until 7-day notification fires; <=0 = alert already triggered!
  is7dAlertActive: boolean; // True when within the 7-day window (0 <= daysRemaining <= 7)
  is7dAlertOverdue: boolean; // True when dose is overdue (daysRemaining < 0)
}

/**
 * Parses date string in DD/MM/YYYY or YYYY-MM-DD format into a valid Date object (at 00:00:00).
 */
export function parseDateBR(dateStr: string): Date {
  if (!dateStr) return new Date();

  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const date = new Date(y, m, d);
      date.setHours(0, 0, 0, 0);
      return date;
    }
  }

  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const date = new Date(y, m, d);
      date.setHours(0, 0, 0, 0);
      return date;
    }
  }

  const parsed = new Date(dateStr);
  parsed.setHours(0, 0, 0, 0);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Formats a Date object to DD/MM/YYYY
 */
export function formatDateBR(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Generates relative date string in DD/MM/YYYY format based on offset from a base date (defaults to today)
 */
export function getRelativeDateStr(daysOffset: number, baseDate?: Date): string {
  const d = baseDate ? new Date(baseDate) : new Date();
  d.setDate(d.getDate() + daysOffset);
  return formatDateBR(d);
}

/**
 * Calculates proximity metrics and 7-day reminder trigger dates for a single vaccine record relative to referenceDate.
 */
export function calculateVaccineProximity(
  v: VaccineRecord,
  referenceDate: Date = new Date()
): VaccineWithProximity {
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  const nextDateObj = parseDateBR(v.nextDate);
  const lastDateObj = parseDateBR(v.lastDate);

  // Exact difference in calendar days until next dose
  const diffMs = nextDateObj.getTime() - ref.getTime();
  const daysDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Calculate the 7-day reminder date (7 calendar days before next dose)
  const alert7dObj = new Date(nextDateObj);
  alert7dObj.setDate(alert7dObj.getDate() - 7);
  const alertDate7d = formatDateBR(alert7dObj);
  const daysUntil7dAlert = daysDiff - 7;
  const is7dAlertActive = daysDiff <= 7 && daysDiff >= 0;
  const is7dAlertOverdue = daysDiff < 0;

  // Total interval between last application and next due date
  const totalIntervalMs = Math.max(1, nextDateObj.getTime() - lastDateObj.getTime());
  const elapsedMs = Math.max(0, ref.getTime() - lastDateObj.getTime());
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalIntervalMs) * 100)));

  let urgency: VaccineUrgency = 'safe';
  let urgencyLabel = `Válida (${daysDiff} dias)`;
  let badgeBg = 'bg-emerald-50';
  let badgeText = 'text-emerald-800';
  let badgeBorder = 'border-emerald-200';
  let cardBorder = 'border-slate-200 hover:border-slate-300';
  let progressColor = 'bg-emerald-500';

  if (daysDiff < 0) {
    urgency = 'overdue';
    const overdueDays = Math.abs(daysDiff);
    urgencyLabel = overdueDays === 1 ? 'Atrasada há 1 dia!' : `Atrasada há ${overdueDays} dias!`;
    badgeBg = 'bg-rose-100';
    badgeText = 'text-rose-900';
    badgeBorder = 'border-rose-300';
    cardBorder = 'border-rose-300 ring-1 ring-rose-200';
    progressColor = 'bg-rose-500';
  } else if (daysDiff <= 7) {
    urgency = 'imminent';
    if (daysDiff === 0) {
      urgencyLabel = '⚡ Vence HOJE!';
    } else if (daysDiff === 1) {
      urgencyLabel = '⚡ Vence AMANHÃ!';
    } else {
      urgencyLabel = `⚡ Vence em ${daysDiff} dias`;
    }
    badgeBg = 'bg-amber-100';
    badgeText = 'text-amber-950 font-bold';
    badgeBorder = 'border-amber-400';
    cardBorder = 'border-amber-300 ring-1 ring-amber-200';
    progressColor = 'bg-amber-500';
  } else if (daysDiff <= 30) {
    urgency = 'upcoming';
    urgencyLabel = `🗓️ Vence em ${daysDiff} dias`;
    badgeBg = 'bg-blue-50';
    badgeText = 'text-blue-900';
    badgeBorder = 'border-blue-300';
    cardBorder = 'border-blue-200 hover:border-blue-300';
    progressColor = 'bg-blue-500';
  } else {
    urgency = 'safe';
    const months = Math.round(daysDiff / 30);
    urgencyLabel = months > 1 ? `✓ Em dia (~${months} meses)` : `✓ Em dia (${daysDiff} dias)`;
    badgeBg = 'bg-emerald-50';
    badgeText = 'text-emerald-800';
    badgeBorder = 'border-emerald-200';
    cardBorder = 'border-slate-200 hover:border-slate-300';
    progressColor = 'bg-emerald-500';
  }

  return {
    ...v,
    calculatedDaysRemaining: daysDiff,
    urgency,
    urgencyLabel,
    badgeBg,
    badgeText,
    badgeBorder,
    cardBorder,
    progressPercent: daysDiff < 0 ? 100 : progressPercent,
    progressColor,
    isTodayOrTomorrow: daysDiff >= 0 && daysDiff <= 1,
    formattedLastDate: formatDateBR(lastDateObj),
    formattedNextDate: formatDateBR(nextDateObj),
    alertDate7d,
    daysUntil7dAlert,
    is7dAlertActive,
    is7dAlertOverdue,
  };
}

/**
 * Returns summary counts of vaccine urgencies and 7-day reminder statistics.
 */
export function getVaccineUrgencySummary(vaccinesWithProximity: VaccineWithProximity[]) {
  const overdue = vaccinesWithProximity.filter((v) => v.urgency === 'overdue');
  const imminent = vaccinesWithProximity.filter((v) => v.urgency === 'imminent');
  const upcoming = vaccinesWithProximity.filter((v) => v.urgency === 'upcoming');
  const safe = vaccinesWithProximity.filter((v) => v.urgency === 'safe');
  const active7dAlerts = vaccinesWithProximity.filter((v) => v.is7dAlertActive);

  return {
    total: vaccinesWithProximity.length,
    overdueCount: overdue.length,
    imminentCount: imminent.length,
    upcomingCount: upcoming.length,
    safeCount: safe.length,
    urgentCount: overdue.length + imminent.length + upcoming.length,
    active7dAlertsCount: active7dAlerts.length,
    mostUrgent: vaccinesWithProximity.slice().sort((a, b) => a.calculatedDaysRemaining - b.calculatedDaysRemaining)[0],
  };
}

/**
 * Plays a pleasant synthetic notification chime using the Web Audio API.
 * Does not require external audio files and works instantaneously.
 */
export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.28); // D6

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime + 0.12);
    osc1.stop(ctx.currentTime + 0.25);
    osc2.stop(ctx.currentTime + 0.5);
  } catch (err) {
    console.debug('Audio chime not permitted or failed:', err);
  }
}

/**
 * Requests browser push notification permission.
 */
export async function requestPushNotificationPermission(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'unsupported';
  }
}

/**
 * Checks if browser push notifications are supported and granted.
 */
export function getPushPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Dispatches a native browser push notification if permitted.
 */
export function dispatchBrowserNotification(
  title: string,
  options?: NotificationOptions
): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
      return true;
    } catch (err) {
      console.warn('Native notification failed, fall back to UI notification:', err);
    }
  }
  return false;
}

/**
 * Generates an email template preview for a 7-day vaccine reminder alert.
 */
export function generateVaccine7dEmailContent(dog: DogProfile, vaccine: VaccineRecord) {
  const subject = `[DogOS CanisTech] 🔔 Alerta 7 Dias: Reforço da vacina ${vaccine.name} de ${dog.name}`;
  const preheader = `A vacina ${vaccine.name} de ${dog.name} vence no dia ${vaccine.nextDate} (em 7 dias). Agende com antecedência!`;
  
  return {
    subject,
    preheader,
    tutorName: dog.tutorName,
    tutorEmail: dog.tutorEmail || 'tutor@canistech.com.br',
    dogName: dog.name,
    dogBreed: dog.breed,
    dogPhoto: dog.photoUrl,
    vaccineName: vaccine.name,
    vaccineCategory: vaccine.category || 'vacina',
    manufacturer: vaccine.manufacturer,
    lot: vaccine.lot,
    nextDate: vaccine.nextDate,
    clinic: vaccine.clinic || 'Hospital Veterinário Credenciado',
    leadDays: 7,
  };
}
