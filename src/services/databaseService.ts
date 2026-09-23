import { PlayerState, Achievement, GameTask, StudySession, ActivityLog, AcademicEvaluation } from '../types/game';

export interface DatabaseStatus {
  status: 'healthy' | 'degraded';
  databaseEngine: string;
  databasePath: string;
  fileSizeBytes: number;
  integrityCheck: string;
  counts: {
    players: number;
    studySessions: number;
    achievements: number;
    activityLogs: number;
    backups: number;
  };
  backupsDirectory: string;
  timestamp: string;
}

export interface MigrationResult {
  success: boolean;
  backupId: string;
  counts: {
    sessions: number;
    achievements: number;
    activityLogs: number;
    dossier: number;
    evaluations: number;
    tasks: number;
  };
}

export const databaseService = {
  /**
   * Fetch game state from SQLite database.
   */
  async fetchGameState(): Promise<{ exists: boolean; data?: { player: PlayerState; achievements: Achievement[]; tasks: GameTask[] } }> {
    try {
      const res = await fetch('/api/db/game-state');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[DatabaseService] Failed to fetch stored state, falling back to local storage:', err);
      return { exists: false };
    }
  },

  /**
   * Migrate existing local client data to SQLite database.
   */
  async migrateToDatabase(player: PlayerState, achievements: Achievement[], tasks?: GameTask[]): Promise<MigrationResult | null> {
    try {
      const res = await fetch('/api/db/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player, achievements, tasks: tasks || [] }),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[DatabaseService] Migration request failed:', err);
      return null;
    }
  },

  /**
   * Persist a batch of newly verified/completed study sessions into SQLite.
   */
  async saveStudySessions(
    sessions: StudySession[],
    updatedPlayerStats: {
      xp: number;
      totalSessions: number;
      totalPoints: number;
      currentStreak: number;
      bestStreak: number;
      level: number;
      title: string;
      accountabilityStatus?: string;
    },
    newLog?: ActivityLog,
    academicEvaluation?: AcademicEvaluation
  ): Promise<boolean> {
    try {
      const res = await fetch('/api/db/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessions,
          updatedPlayerStats,
          newLog,
          academicEvaluation,
        }),
      });
      return res.ok;
    } catch (err) {
      console.warn('[DatabaseService] Failed to save sessions batch to database:', err);
      return false;
    }
  },

  /**
   * Update achievements in SQLite.
   */
  async saveAchievements(achievements: Achievement[]): Promise<boolean> {
    try {
      const res = await fetch('/api/db/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievements }),
      });
      return res.ok;
    } catch (err) {
      console.warn('[DatabaseService] Failed to save achievements to database:', err);
      return false;
    }
  },

  /**
   * Dual-write / state sync to SQLite.
   */
  async syncGameState(player: PlayerState, achievements: Achievement[], tasks?: GameTask[]): Promise<boolean> {
    try {
      const res = await fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player, achievements, tasks }),
      });
      return res.ok;
    } catch (err) {
      console.warn('[DatabaseService] Background sync failed:', err);
      return false;
    }
  },

  /**
   * Diagnostics & health check.
   */
  async fetchStatus(): Promise<DatabaseStatus | null> {
    try {
      const res = await fetch('/api/db/status');
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Download full database export backup.
   */
  exportBackupUrl(): string {
    return '/api/db/export';
  },

  /**
   * AI Study Investigator turn processing
   */
  async investigateTurn(payload: {
    studentName?: string;
    claimedTopic?: string;
    subject?: string;
    conversationHistory: Array<{ role: 'investigator' | 'student'; content: string }>;
    questionCount?: number;
    academicDossier?: any[];
  }) {
    const res = await fetch('/api/investigate/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Investigator turn failed with status ${res.status}`);
    return await res.json();
  },

  /**
   * Persist automatically verified study session to database
   */
  async recordInvestigatorSession(payload: {
    session: StudySession;
    playerUpdate: {
      xp: number;
      totalSessions: number;
      totalPoints: number;
      currentStreak: number;
      bestStreak: number;
      level: number;
      title: string;
    };
    activityLog?: ActivityLog;
  }) {
    const res = await fetch('/api/investigate/record-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Record session failed with status ${res.status}`);
    return await res.json();
  }
};
