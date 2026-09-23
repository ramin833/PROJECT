import { Achievement, CampaignDay, StudySession } from '../types/game';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  // ─── STARTING ───
  {
    id: 'first_step',
    title: 'FIRST STEP',
    description: 'Complete your first study session.',
    requirement: 1,
    type: 'sessions',
    category: 'starting',
    unlocked: false,
    icon: 'Sprout',
    badgeEmoji: '🌱',
  },

  // ─── SESSION ACHIEVEMENTS ───
  {
    id: '10_sessions',
    title: '10 SESSIONS',
    description: 'Complete 10 total sessions.',
    requirement: 10,
    type: 'sessions',
    category: 'sessions',
    unlocked: false,
    icon: 'Zap',
    badgeEmoji: '⚡',
  },
  {
    id: '25_sessions',
    title: '25 SESSIONS',
    description: 'Complete 25 sessions.',
    requirement: 25,
    type: 'sessions',
    category: 'sessions',
    unlocked: false,
    icon: 'Flame',
    badgeEmoji: '🔥',
  },
  {
    id: '50_sessions',
    title: '50 SESSIONS',
    description: 'Complete 50 sessions.',
    requirement: 50,
    type: 'sessions',
    category: 'sessions',
    unlocked: false,
    icon: 'Dumbbell',
    badgeEmoji: '💪',
  },
  {
    id: '100_sessions',
    title: '100 SESSIONS',
    description: 'Complete 100 sessions.',
    requirement: 100,
    type: 'sessions',
    category: 'sessions',
    unlocked: false,
    icon: 'Sparkles',
    badgeEmoji: '💯',
  },
  {
    id: '250_sessions',
    title: '250 SESSIONS',
    description: 'Complete 250 sessions.',
    requirement: 250,
    type: 'sessions',
    category: 'sessions',
    unlocked: false,
    icon: 'Trophy',
    badgeEmoji: '🏆',
  },
  {
    id: '500_sessions',
    title: '500 SESSIONS',
    description: 'Complete 500 sessions.',
    requirement: 500,
    type: 'sessions',
    category: 'sessions',
    unlocked: false,
    icon: 'Crown',
    badgeEmoji: '👑',
  },

  // ─── STREAK BADGES ───
  {
    id: '3_day_streak',
    title: '3-DAY STREAK',
    description: 'Complete 3 consecutive days.',
    requirement: 3,
    type: 'streak',
    category: 'streak',
    unlocked: false,
    icon: 'Flame',
    badgeEmoji: '🔥',
  },
  {
    id: '7_day_streak',
    title: '7-DAY STREAK',
    description: 'Complete 7 consecutive days.',
    requirement: 7,
    type: 'streak',
    category: 'streak',
    unlocked: false,
    icon: 'Flame',
    badgeEmoji: '🔥🔥',
  },
  {
    id: '14_day_streak',
    title: '14-DAY STREAK',
    description: 'Complete 14 consecutive days.',
    requirement: 14,
    type: 'streak',
    category: 'streak',
    unlocked: false,
    icon: 'Flame',
    badgeEmoji: '🔥🔥🔥',
  },
  {
    id: '30_day_streak',
    title: '30-DAY STREAK',
    description: 'Complete 30 consecutive days.',
    requirement: 30,
    type: 'streak',
    category: 'streak',
    unlocked: false,
    icon: 'Shield',
    badgeEmoji: '🛡️',
  },
  {
    id: '45_day_streak',
    title: '45-DAY STREAK',
    description: 'Complete 45 consecutive days.',
    requirement: 45,
    type: 'streak',
    category: 'streak',
    unlocked: false,
    icon: 'Swords',
    badgeEmoji: '⚔️',
  },
  {
    id: '60_day_streak',
    title: '60-DAY STREAK',
    description: 'Complete 60 consecutive days.',
    requirement: 60,
    type: 'streak',
    category: 'streak',
    unlocked: false,
    icon: 'Crown',
    badgeEmoji: '👑',
  },

  // ─── JOURNEY BADGES ───
  {
    id: 'first_day',
    title: 'FIRST DAY',
    description: 'Complete Day 1.',
    requirement: 1,
    type: 'days',
    category: 'journey',
    unlocked: false,
    icon: 'Sprout',
    badgeEmoji: '🌱',
  },
  {
    id: '10_days',
    title: '10 DAYS',
    description: 'Complete 10 different calendar days.',
    requirement: 10,
    type: 'days',
    category: 'journey',
    unlocked: false,
    icon: 'Calendar',
    badgeEmoji: '🗓️',
  },
  {
    id: '25_days',
    title: '25 DAYS',
    description: 'Complete 25 days.',
    requirement: 25,
    type: 'days',
    category: 'journey',
    unlocked: false,
    icon: 'Award',
    badgeEmoji: '🏅',
  },
  {
    id: '40_days',
    title: '40 DAYS',
    description: 'Complete 40 days.',
    requirement: 40,
    type: 'days',
    category: 'journey',
    unlocked: false,
    icon: 'Medal',
    badgeEmoji: '🥇',
  },
  {
    id: '50_days',
    title: '50 DAYS',
    description: 'Complete 50 days.',
    requirement: 50,
    type: 'days',
    category: 'journey',
    unlocked: false,
    icon: 'Trophy',
    badgeEmoji: '🏆',
  },
  {
    id: '60_day_maker',
    title: '60-DAY CONSISTENCY MAKER',
    description: 'Complete all 60 journey days.',
    requirement: 60,
    type: 'days',
    category: 'journey',
    unlocked: false,
    icon: 'Crown',
    badgeEmoji: '👑',
  },
];

export function evaluateAchievements(
  currentAchievements: Achievement[],
  sessions: StudySession[],
  streak: number,
  campaignDays: CampaignDay[]
): { updated: Achievement[]; newlyUnlocked: Achievement[] } {
  const totalSessions = sessions.length;
  const completedDaysCount = campaignDays.filter(d => d.sessionCount > 0).length;

  const newlyUnlocked: Achievement[] = [];

  const updated = currentAchievements.map(ach => {
    if (ach.unlocked) return ach;

    let qualifies = false;
    switch (ach.type) {
      case 'sessions':
        qualifies = totalSessions >= ach.requirement;
        break;
      case 'streak':
        qualifies = streak >= ach.requirement;
        break;
      case 'days':
        qualifies = completedDaysCount >= ach.requirement;
        break;
    }

    if (qualifies) {
      const unlockedItem = {
        ...ach,
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      };
      newlyUnlocked.push(unlockedItem);
      return unlockedItem;
    }

    return ach;
  });

  return { updated, newlyUnlocked };
}
