import { StudySession, ActivityLog } from '../types/game';
import { CAMPAIGN_START } from './campaign';

/**
 * Generate a 27-session demo state matching the Section 17 & 18 profile example:
 * - RAMIN
 * - Level 4
 * - 27 XP (27 / 30 XP)
 * - 27 Total Sessions, 27 Total Points
 * - Current Streak: 4 days
 * - Best Streak: 12 days
 * - Days Completed: 18 / 60
 */
export function generate27SessionDemo(): { sessions: StudySession[]; activityLogs: ActivityLog[] } {
  const sessions: StudySession[] = [];
  const activityLogs: ActivityLog[] = [];
  const subjects = ['Algorithms', 'Database', 'Complex Variable', 'Programming', 'Other'];

  const [startYear, startMonth, startDay] = CAMPAIGN_START.split('-').map(Number);
  let sessionNumber = 1;

  // 18 completed days across the first 22 days
  // Days 1 to 12 completed (12 day streak - Best Streak: 12 days!)
  // Day 13 missed
  // Days 14 to 17 completed
  // Day 18 missed
  // Days 19 to 22 completed (4 day streak - Current Streak: 4 days!)
  const dayIndices = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, // 12 days
    13, 14, 15, 16, // 4 days
    18, 19, 20, 21 // 4 days
  ]; // Total 20 candidate days, we pick 18 days with sessions

  const completedDays = dayIndices.slice(0, 18);

  // Distribute 27 sessions across these 18 days
  let countRemaining = 27;

  completedDays.forEach((dayOffset, i) => {
    const dayDate = new Date(startYear, startMonth - 1, startDay + dayOffset);
    const y = dayDate.getFullYear();
    const m = String(dayDate.getMonth() + 1).padStart(2, '0');
    const d = String(dayDate.getDate()).padStart(2, '0');
    const dateKey = `${y}-${m}-${d}`;

    const sessionsForDay = i < 9 ? 1 : (i === 17 ? countRemaining : (countRemaining > (18 - i) ? 2 : 1));
    countRemaining -= sessionsForDay;

    for (let s = 0; s < sessionsForDay; s++) {
      const sessNum = sessionNumber++;
      const hour = 9 + s * 3;
      const startTime = new Date(startYear, startMonth - 1, startDay + dayOffset, hour, 15, 0).toISOString();
      const endTime = new Date(startYear, startMonth - 1, startDay + dayOffset, hour, 45, 0).toISOString();
      const subject = subjects[sessNum % subjects.length];

      sessions.push({
        id: `sess-${sessNum}`,
        sessionNumber: sessNum,
        dateKey,
        startTime,
        endTime,
        durationMinutes: 30,
        durationSeconds: 1800,
        subject,
        pointEarned: 1,
        xpEarned: 1,
        notes: `Study block on ${subject}`,
      });
    }
  });

  // Recent activity logs
  activityLogs.push(
    {
      id: 'act-1',
      type: 'session',
      title: '📚 Study Session',
      detail: '+1 Point • +1 XP (Complex Variable)',
      timestamp: new Date(2026, 9, 12, 16, 0).toISOString(),
    },
    {
      id: 'act-2',
      type: 'session',
      title: '📚 Study Session',
      detail: '+1 Point • +1 XP (Algorithms)',
      timestamp: new Date(2026, 9, 12, 12, 0).toISOString(),
    },
    {
      id: 'act-3',
      type: 'day_complete',
      title: '🟢 Day Complete',
      detail: 'Day 22 of 60 saved. Streak extended to 4 days.',
      timestamp: new Date(2026, 9, 12, 12, 1).toISOString(),
    },
    {
      id: 'act-4',
      type: 'level_up',
      title: '⚡ Level Up',
      detail: 'Reached Level 4 (27 Total XP)',
      timestamp: new Date(2026, 9, 12, 12, 2).toISOString(),
    }
  );

  return { sessions, activityLogs };
}
