import { CampaignDay, StudySession } from '../types/game';

export const CAMPAIGN_START = '2026-09-21';
export const CAMPAIGN_END = '2026-11-19';
export const TOTAL_CAMPAIGN_DAYS = 60;

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDisplayDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${d}`;
}

export function formatDisplayDateLong(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[date.getMonth()]} ${d}, ${y}`;
}

/**
 * Generate all 60 campaign day nodes with exact state:
 * - 'completed': at least 1 genuine session completed that day (green/glowing)
 * - 'today': current day (⭐ highlighted strongly)
 * - 'missed': past day without a session (✕ red/dim)
 * - 'locked': future day (🔒 dark/disabled)
 */
export function generateCampaignDays(sessions: StudySession[], currentDateKey: string): CampaignDay[] {
  const days: CampaignDay[] = [];
  const [startYear, startMonth, startDay] = CAMPAIGN_START.split('-').map(Number);

  // Group sessions by dateKey
  const sessionsByDate: Record<string, StudySession[]> = {};
  for (const session of sessions) {
    if (!sessionsByDate[session.dateKey]) {
      sessionsByDate[session.dateKey] = [];
    }
    sessionsByDate[session.dateKey].push(session);
  }

  for (let i = 0; i < TOTAL_CAMPAIGN_DAYS; i++) {
    const dayDate = new Date(startYear, startMonth - 1, startDay + i);
    const dateKey = formatDateKey(dayDate);
    const displayDate = formatDisplayDate(dateKey);
    const daySessions = sessionsByDate[dateKey] || [];
    const sessionCount = daySessions.length;
    const pointsEarned = sessionCount;
    const xpEarned = sessionCount;
    const dayNumber = i + 1;

    let status: CampaignDay['status'] = 'locked';

    if (dateKey === currentDateKey) {
      status = 'today';
    } else if (dateKey < currentDateKey) {
      status = sessionCount > 0 ? 'completed' : 'missed';
    } else {
      status = 'locked';
    }

    days.push({
      dayNumber,
      dateKey,
      displayDate,
      status,
      sessionCount,
      pointsEarned,
      xpEarned,
    });
  }

  return days;
}

/**
 * Calculate Current Streak and Best Streak:
 * Current streak: number of consecutive completed calendar days ending today.
 * If today has no session yet, it counts backwards from yesterday.
 * Best streak: highest consecutive streak ever achieved.
 */
export function calculateStreakStats(days: CampaignDay[], currentDateKey: string) {
  let bestStreak = 0;
  let runningStreak = 0;

  for (const day of days) {
    const isToday = day.dateKey === currentDateKey;
    const hasCompleted = day.sessionCount > 0;

    if (hasCompleted) {
      runningStreak += 1;
      if (runningStreak > bestStreak) {
        bestStreak = runningStreak;
      }
    } else if (!isToday && day.dateKey < currentDateKey) {
      runningStreak = 0;
    }
  }

  let currentStreak = 0;
  const todayIndex = days.findIndex(d => d.dateKey === currentDateKey);

  if (todayIndex !== -1) {
    const todayHasSession = days[todayIndex].sessionCount > 0;
    if (todayHasSession) {
      currentStreak = 1;
      for (let i = todayIndex - 1; i >= 0; i--) {
        if (days[i].sessionCount > 0) {
          currentStreak += 1;
        } else {
          break;
        }
      }
    } else {
      // If today has 0 sessions, current streak is 0 (today is not completed)
      currentStreak = 0;
    }
  }

  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
  };
}
