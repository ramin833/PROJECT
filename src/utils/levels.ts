export interface LevelTier {
  level: number;
  title: string;
  minPoints: number;
  nextPoints: number;
}

export const LEVEL_TIERS: LevelTier[] = [
  { level: 1, title: 'The Beginner', minPoints: 0, nextPoints: 25 },
  { level: 2, title: 'The Starter', minPoints: 25, nextPoints: 60 },
  { level: 3, title: 'The Initiate', minPoints: 60, nextPoints: 100 },
  { level: 4, title: 'The Grinder', minPoints: 100, nextPoints: 150 },
  { level: 5, title: 'The Builder', minPoints: 150, nextPoints: 210 },
  { level: 6, title: 'The Disciplined', minPoints: 210, nextPoints: 280 },
  { level: 7, title: 'The Warrior', minPoints: 280, nextPoints: 360 },
  { level: 8, title: 'The Consistent', minPoints: 360, nextPoints: 450 },
  { level: 9, title: 'The Challenger', minPoints: 450, nextPoints: 550 },
  { level: 10, title: 'The Focused', minPoints: 550, nextPoints: 675 },
  { level: 11, title: 'The Determined', minPoints: 675, nextPoints: 825 },
  { level: 12, title: 'The Elite', minPoints: 825, nextPoints: 1000 },
  { level: 13, title: 'The Veteran', minPoints: 1000, nextPoints: 1200 },
  { level: 14, title: 'The Master', minPoints: 1200, nextPoints: 1425 },
  { level: 15, title: 'The Expert', minPoints: 1425, nextPoints: 1675 },
  { level: 16, title: 'The Specialist', minPoints: 1675, nextPoints: 1950 },
  { level: 17, title: 'The Champion', minPoints: 1950, nextPoints: 2250 },
  { level: 18, title: 'The Grandmaster', minPoints: 2250, nextPoints: 2600 },
  { level: 19, title: 'The Legend', minPoints: 2600, nextPoints: 3000 },
  { level: 20, title: 'The Unstoppable', minPoints: 3000, nextPoints: 3500 },
];

export interface LevelInfo {
  level: number;
  title: string;
  currentPoints: number;
  minPointsForLevel: number;
  nextLevelPoints: number;
  pointsInCurrentLevel: number;
  pointsNeededForLevel: number;
  percentage: number;
  isMaxTier: boolean;
}

export function getLevelInfo(points: number): LevelInfo {
  const safePoints = Math.max(0, points);

  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    const tier = LEVEL_TIERS[i];
    if (safePoints >= tier.minPoints) {
      if (tier.level >= 20) {
        // Unstoppable max tier
        const inLevel = safePoints - tier.minPoints;
        const needed = tier.nextPoints - tier.minPoints;
        return {
          level: 20,
          title: 'The Unstoppable',
          currentPoints: safePoints,
          minPointsForLevel: tier.minPoints,
          nextLevelPoints: tier.nextPoints,
          pointsInCurrentLevel: inLevel,
          pointsNeededForLevel: needed,
          percentage: Math.min(100, Math.round((inLevel / needed) * 100)),
          isMaxTier: true,
        };
      }

      const pointsNeeded = tier.nextPoints - tier.minPoints;
      const inLevel = safePoints - tier.minPoints;
      return {
        level: tier.level,
        title: tier.title,
        currentPoints: safePoints,
        minPointsForLevel: tier.minPoints,
        nextLevelPoints: tier.nextPoints,
        pointsInCurrentLevel: inLevel,
        pointsNeededForLevel: pointsNeeded,
        percentage: Math.min(100, Math.round((inLevel / pointsNeeded) * 100)),
        isMaxTier: false,
      };
    }
  }

  // Fallback to Level 1
  return {
    level: 1,
    title: 'The Beginner',
    currentPoints: 0,
    minPointsForLevel: 0,
    nextLevelPoints: 25,
    pointsInCurrentLevel: 0,
    pointsNeededForLevel: 25,
    percentage: 0,
    isMaxTier: false,
  };
}
