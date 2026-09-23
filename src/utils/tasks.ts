import { GameTask, TaskCategory, CampaignDay, StudySession } from '../types/game';

export interface TaskDefinition {
  id: string;
  category: TaskCategory;
  title: string;
  description: string;
  requirement: number;
  rewardText: string;
  icon?: string;
  order: number;
  getProgress: (stats: {
    todaySessionsCount: number;
    currentStreak: number;
    totalSessions: number;
    completedDaysCount: number;
  }) => number;
}

export const TASK_DEFINITIONS: TaskDefinition[] = [
  // ─── ☀️ DAILY (Resets Every Day) ───
  {
    id: 'daily_show_up',
    category: 'daily',
    title: 'Show Up',
    description: 'Complete 1 study session today',
    requirement: 1,
    rewardText: '✅ Day Complete',
    icon: 'CheckCircle2',
    order: 1,
    getProgress: (stats) => stats.todaySessionsCount,
  },
  {
    id: 'daily_keep_going',
    category: 'daily',
    title: 'Keep Going',
    description: 'Complete 3 study sessions today',
    requirement: 3,
    rewardText: '🏅 Progress toward session achievements',
    icon: 'Zap',
    order: 2,
    getProgress: (stats) => stats.todaySessionsCount,
  },
  {
    id: 'daily_push_yourself',
    category: 'daily',
    title: 'Push Yourself',
    description: 'Complete 5 study sessions today',
    requirement: 5,
    rewardText: '🔥 Daily Challenge Complete',
    icon: 'Flame',
    order: 3,
    getProgress: (stats) => stats.todaySessionsCount,
  },

  // ─── 🔥 STREAK (Consecutive Days) ───
  {
    id: 'streak_3_days',
    category: 'streak',
    title: '3-Day Momentum',
    description: 'Maintain a 3-day study streak',
    requirement: 3,
    rewardText: '🔥 Streak Badge Progress',
    icon: 'Flame',
    order: 1,
    getProgress: (stats) => stats.currentStreak,
  },
  {
    id: 'streak_no_zero_week',
    category: 'streak',
    title: 'No Zero Week',
    description: 'Complete at least one session on 7 consecutive days',
    requirement: 7,
    rewardText: '⚡ Iron Discipline',
    icon: 'Flame',
    order: 2,
    getProgress: (stats) => stats.currentStreak,
  },
  {
    id: 'streak_fortnight',
    category: 'streak',
    title: 'Fortnight Focus',
    description: 'Maintain a 14-day study streak',
    requirement: 14,
    rewardText: '🛡️ Habit Lock',
    icon: 'Shield',
    order: 3,
    getProgress: (stats) => stats.currentStreak,
  },
  {
    id: 'streak_month_of_iron',
    category: 'streak',
    title: 'Month of Iron',
    description: 'Maintain a 30-day streak without missing a day',
    requirement: 30,
    rewardText: '👑 Consistency Titan',
    icon: 'Crown',
    order: 4,
    getProgress: (stats) => stats.currentStreak,
  },

  // ─── 🎯 MILESTONES (Long-term Session Goals) ───
  {
    id: 'milestone_session_hunter',
    category: 'milestones',
    title: 'Session Hunter',
    description: 'Complete 10 study sessions',
    requirement: 10,
    rewardText: '⚡ 10 Sessions Badge',
    icon: 'Target',
    order: 1,
    getProgress: (stats) => stats.totalSessions,
  },
  {
    id: 'milestone_habit_forger',
    category: 'milestones',
    title: 'Habit Forger',
    description: 'Complete 25 study sessions',
    requirement: 25,
    rewardText: '🔥 Level 2 Unlocked',
    icon: 'Target',
    order: 2,
    getProgress: (stats) => stats.totalSessions,
  },
  {
    id: 'milestone_half_century',
    category: 'milestones',
    title: 'Half-Century',
    description: 'Complete 50 study sessions',
    requirement: 50,
    rewardText: '💪 50 Sessions Badge',
    icon: 'Dumbbell',
    order: 3,
    getProgress: (stats) => stats.totalSessions,
  },
  {
    id: 'milestone_century',
    category: 'milestones',
    title: 'The Century',
    description: 'Reach 100 total study sessions',
    requirement: 100,
    rewardText: '💯 100 Sessions Badge',
    icon: 'Sparkles',
    order: 4,
    getProgress: (stats) => stats.totalSessions,
  },
  {
    id: 'milestone_grand_scholar',
    category: 'milestones',
    title: 'Grand Scholar',
    description: 'Reach 250 total study sessions',
    requirement: 250,
    rewardText: '🏆 250 Sessions Badge',
    icon: 'Trophy',
    order: 5,
    getProgress: (stats) => stats.totalSessions,
  },

  // ─── 🏆 SPECIAL (60-Day Journey Progress) ───
  {
    id: 'special_consistency_builder',
    category: 'special',
    title: 'Consistency Builder',
    description: 'Complete 7 different study days',
    requirement: 7,
    rewardText: '🗓️ Week 1 Conquered',
    icon: 'Calendar',
    order: 1,
    getProgress: (stats) => stats.completedDaysCount,
  },
  {
    id: 'special_quarter_journey',
    category: 'special',
    title: 'Quarter Journey',
    description: 'Complete 15 different study days',
    requirement: 15,
    rewardText: '⚔️ Campaign Milestone',
    icon: 'Award',
    order: 2,
    getProgress: (stats) => stats.completedDaysCount,
  },
  {
    id: 'special_halfway_hero',
    category: 'special',
    title: 'Halfway Hero',
    description: 'Complete 30 different study days',
    requirement: 30,
    rewardText: '🛡️ Halfway Sovereign',
    icon: 'Shield',
    order: 3,
    getProgress: (stats) => stats.completedDaysCount,
  },
  {
    id: 'special_final_stretch',
    category: 'special',
    title: 'Final Stretch',
    description: 'Complete 50 different study days',
    requirement: 50,
    rewardText: '🥇 50 Days Badge',
    icon: 'Trophy',
    order: 4,
    getProgress: (stats) => stats.completedDaysCount,
  },
  {
    id: 'special_60_day_legend',
    category: 'special',
    title: '60-Day Consistency Legend',
    description: 'Complete all 60 journey days',
    requirement: 60,
    rewardText: '👑 Legendary 60-Day Badge',
    icon: 'Crown',
    order: 5,
    getProgress: (stats) => stats.completedDaysCount,
  },
];

export function evaluateAllTasks(
  todaySessions: StudySession[],
  currentStreak: number,
  totalSessions: number,
  campaignDays: CampaignDay[]
): GameTask[] {
  const todaySessionsCount = todaySessions.length;
  const completedDaysCount = campaignDays.filter(d => d.sessionCount > 0).length;

  const stats = {
    todaySessionsCount,
    currentStreak,
    totalSessions,
    completedDaysCount,
  };

  return TASK_DEFINITIONS.map(def => {
    const rawProgress = def.getProgress(stats);
    const progress = Math.min(def.requirement, rawProgress);
    const completed = rawProgress >= def.requirement;

    return {
      id: def.id,
      category: def.category,
      title: def.title,
      description: def.description,
      requirement: def.requirement,
      currentProgress: progress,
      completed,
      rewardText: def.rewardText,
      icon: def.icon,
      order: def.order,
    };
  });
}
