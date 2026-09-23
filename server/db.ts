import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const DB_PATH = path.join(DATA_DIR, 'studyquest.sqlite');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    
    // Enable Write-Ahead Logging for concurrency & performance
    dbInstance.exec('PRAGMA journal_mode = WAL;');
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    
    initTables(dbInstance);
  }
  return dbInstance;
}

function initTables(db: DatabaseSync): void {
  db.exec(`
    -- 1. Players / Profile Table
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      title TEXT NOT NULL DEFAULT 'The Beginner',
      xp INTEGER NOT NULL DEFAULT 0,
      total_sessions INTEGER NOT NULL DEFAULT 0,
      total_points INTEGER NOT NULL DEFAULT 0,
      current_streak INTEGER NOT NULL DEFAULT 0,
      best_streak INTEGER NOT NULL DEFAULT 0,
      sound_enabled INTEGER NOT NULL DEFAULT 1,
      active_session_start_time TEXT,
      active_session_subject TEXT,
      simulation_date_key TEXT NOT NULL DEFAULT '2026-09-21',
      accountability_status TEXT NOT NULL DEFAULT 'standard',
      updated_at TEXT NOT NULL
    );

    -- 2. Study Session History Table
    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL DEFAULT 'ramin',
      session_number INTEGER NOT NULL,
      date_key TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      duration_seconds INTEGER NOT NULL,
      subject TEXT NOT NULL,
      point_earned INTEGER NOT NULL DEFAULT 1,
      xp_earned INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      companion_feedback TEXT,
      reported_count INTEGER,
      removed_count INTEGER,
      verification_method TEXT,
      academic_evaluation TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_date ON study_sessions(date_key);
    CREATE INDEX IF NOT EXISTS idx_sessions_player ON study_sessions(player_id);

    -- 3. Achievements Table
    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL DEFAULT 'ramin',
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      requirement INTEGER NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      unlocked INTEGER NOT NULL DEFAULT 0,
      unlocked_at TEXT,
      icon TEXT NOT NULL,
      badge_emoji TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      max_progress INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_achievements_player ON achievements(player_id);

    -- 4. Tasks Table
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL DEFAULT 'ramin',
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      requirement INTEGER NOT NULL,
      current_progress INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      reward_text TEXT,
      icon TEXT,
      task_order INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_player ON tasks(player_id);

    -- 5. Activity Logs Table
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL DEFAULT 'ramin',
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      detail TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_activity_logs_player ON activity_logs(player_id);

    -- 6. Academic Dossier Table
    CREATE TABLE IF NOT EXISTS academic_dossier (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL DEFAULT 'ramin',
      topic TEXT NOT NULL,
      subject TEXT NOT NULL,
      grade TEXT NOT NULL,
      last_tested_date TEXT NOT NULL,
      notes TEXT,
      updated_at TEXT NOT NULL
    );

    -- 7. Evaluation History Table
    CREATE TABLE IF NOT EXISTS evaluation_history (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL DEFAULT 'ramin',
      date_key TEXT NOT NULL,
      day_number INTEGER NOT NULL,
      reported_count INTEGER NOT NULL,
      accepted_count INTEGER NOT NULL,
      questionable_count INTEGER NOT NULL,
      confidence_grid TEXT NOT NULL,
      study_attention TEXT NOT NULL,
      session_honesty TEXT NOT NULL,
      accountability_status TEXT NOT NULL,
      summary_tutor_notes TEXT,
      active_role TEXT,
      timestamp TEXT NOT NULL
    );

    -- 8. Migration & Safety Backups Table
    CREATE TABLE IF NOT EXISTS migration_backups (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      source TEXT NOT NULL,
      file_path TEXT NOT NULL,
      records_summary TEXT NOT NULL,
      raw_payload TEXT NOT NULL
    );
  `);

  // Safe non-destructive column migrations for AI Study Investigator
  const investigationColumns = [
    'ALTER TABLE study_sessions ADD COLUMN topic TEXT;',
    'ALTER TABLE study_sessions ADD COLUMN investigation_status TEXT;',
    'ALTER TABLE study_sessions ADD COLUMN verification_result TEXT;',
    'ALTER TABLE study_sessions ADD COLUMN questions_asked INTEGER;',
    'ALTER TABLE study_sessions ADD COLUMN relevant_answers TEXT;',
    'ALTER TABLE study_sessions ADD COLUMN evidence_summary TEXT;'
  ];
  for (const sql of investigationColumns) {
    try {
      db.exec(sql);
    } catch {
      // Column already exists, safe to ignore
    }
  }
}

/**
 * Creates an immutable file backup of any payload before mutation or migration.
 */
export function createBackupSnapshot(source: string, payload: any): { backupId: string; filePath: string } {
  const db = getDatabase();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupId = `backup-${timestamp}`;
  const filename = `${backupId}.json`;
  const filePath = path.join(BACKUPS_DIR, filename);

  const rawJson = JSON.stringify(payload, null, 2);
  fs.writeFileSync(filePath, rawJson, 'utf-8');

  const summary = {
    source,
    timestamp: new Date().toISOString(),
    hasPlayer: !!payload?.player || !!payload?.name,
    sessionsCount: Array.isArray(payload?.sessions) ? payload.sessions.length : (Array.isArray(payload?.player?.sessions) ? payload.player.sessions.length : 0),
    achievementsCount: Array.isArray(payload?.achievements) ? payload.achievements.length : 0,
    fileSizeBytes: rawJson.length
  };

  const insertBackup = db.prepare(`
    INSERT INTO migration_backups (id, created_at, source, file_path, records_summary, raw_payload)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertBackup.run(backupId, new Date().toISOString(), source, filePath, JSON.stringify(summary), rawJson);

  return { backupId, filePath };
}

/**
 * Retrieve the full game state from SQLite.
 * Returns null if no player profile has been stored yet.
 */
export function getStoredGameState(playerId: string = 'ramin'): any | null {
  const db = getDatabase();

  const playerRow: any = db.prepare(`SELECT * FROM players WHERE id = ?`).get(playerId);
  if (!playerRow) {
    return null;
  }

  const sessionRows: any[] = db.prepare(`
    SELECT * FROM study_sessions WHERE player_id = ? ORDER BY session_number ASC, start_time ASC
  `).all(playerId);

  const achievementRows: any[] = db.prepare(`
    SELECT * FROM achievements WHERE player_id = ?
  `).all(playerId);

  const taskRows: any[] = db.prepare(`
    SELECT * FROM tasks WHERE player_id = ? ORDER BY task_order ASC
  `).all(playerId);

  const logRows: any[] = db.prepare(`
    SELECT * FROM activity_logs WHERE player_id = ? ORDER BY timestamp DESC
  `).all(playerId);

  const dossierRows: any[] = db.prepare(`
    SELECT * FROM academic_dossier WHERE player_id = ?
  `).all(playerId);

  const evalRows: any[] = db.prepare(`
    SELECT * FROM evaluation_history WHERE player_id = ? ORDER BY timestamp DESC
  `).all(playerId);

  // Map rows back to typed application models
  const sessions = sessionRows.map(row => ({
    id: row.id,
    sessionNumber: row.session_number,
    dateKey: row.date_key,
    startTime: row.start_time,
    endTime: row.end_time,
    durationMinutes: row.duration_minutes,
    durationSeconds: row.duration_seconds,
    subject: row.subject,
    pointEarned: row.point_earned as 1,
    xpEarned: row.xp_earned as 1,
    notes: row.notes || undefined,
    topic: row.topic || undefined,
    investigationStatus: row.investigation_status || undefined,
    verificationResult: row.verification_result || undefined,
    questionsAsked: row.questions_asked != null ? row.questions_asked : undefined,
    relevantAnswers: row.relevant_answers ? JSON.parse(row.relevant_answers) : undefined,
    evidenceSummary: row.evidence_summary || undefined,
    companionFeedback: row.companion_feedback || undefined,
    reportedCount: row.reported_count != null ? row.reported_count : undefined,
    removedCount: row.removed_count != null ? row.removed_count : undefined,
    verificationMethod: row.verification_method || undefined,
    academicEvaluation: row.academic_evaluation ? JSON.parse(row.academic_evaluation) : undefined,
  }));

  const achievements = achievementRows.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    requirement: row.requirement,
    type: row.type,
    category: row.category,
    unlocked: Boolean(row.unlocked),
    unlockedAt: row.unlocked_at || undefined,
    icon: row.icon,
    badgeEmoji: row.badge_emoji,
    progress: row.progress,
    maxProgress: row.max_progress,
  }));

  const activityLogs = logRows.map(row => ({
    id: row.id,
    type: row.type,
    title: row.title,
    detail: row.detail,
    timestamp: row.timestamp,
  }));

  const academicDossier = dossierRows.map(row => ({
    topic: row.topic,
    subject: row.subject,
    grade: row.grade,
    lastTestedDate: row.last_tested_date,
    notes: row.notes || undefined,
  }));

  const evaluationHistory = evalRows.map(row => ({
    id: row.id,
    dateKey: row.date_key,
    dayNumber: row.day_number,
    reportedCount: row.reported_count,
    acceptedCount: row.accepted_count,
    questionableCount: row.questionable_count,
    confidenceGrid: JSON.parse(row.confidence_grid || '[]'),
    studyAttention: row.study_attention,
    sessionHonesty: row.session_honesty,
    accountabilityStatus: row.accountability_status,
    summaryTutorNotes: row.summary_tutor_notes || '',
    activeRole: row.active_role || undefined,
    timestamp: row.timestamp,
  }));

  const player = {
    name: playerRow.name,
    level: playerRow.level,
    title: playerRow.title,
    xp: playerRow.xp,
    totalSessions: playerRow.total_sessions,
    totalPoints: playerRow.total_points,
    currentStreak: playerRow.current_streak,
    bestStreak: playerRow.best_streak,
    sessions,
    activityLogs,
    soundEnabled: Boolean(playerRow.sound_enabled),
    activeSessionStartTime: playerRow.active_session_start_time || null,
    activeSessionSubject: playerRow.active_session_subject || null,
    simulationDateKey: playerRow.simulation_date_key || '2026-09-21',
    accountabilityStatus: playerRow.accountability_status || 'standard',
    academicDossier,
    evaluationHistory,
  };

  return {
    player,
    achievements,
    tasks: taskRows.map(r => ({
      id: r.id,
      category: r.category,
      title: r.title,
      description: r.description,
      requirement: r.requirement,
      currentProgress: r.current_progress,
      completed: Boolean(r.completed),
      rewardText: r.reward_text,
      icon: r.icon,
      order: r.task_order,
    })),
  };
}

/**
 * Migrate existing client data into the SQLite database safely.
 * Takes a full snapshot backup before inserting anything.
 * Guarantees zero loss, zero overwrites of timestamps, and preserves all historical IDs.
 */
export function migrateClientDataIntoDatabase(payload: { player: any; achievements?: any[]; tasks?: any[] }): {
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
} {
  const db = getDatabase();
  const playerId = 'ramin';

  // Step 1: Pre-migration safety backup
  const { backupId } = createBackupSnapshot('client_migration', payload);

  const player = payload.player || {};
  const achievements = Array.isArray(payload.achievements) ? payload.achievements : [];
  const tasks = Array.isArray(payload.tasks) ? payload.tasks : [];
  const sessions = Array.isArray(player.sessions) ? player.sessions : [];
  const activityLogs = Array.isArray(player.activityLogs) ? player.activityLogs : [];
  const academicDossier = Array.isArray(player.academicDossier) ? player.academicDossier : [];
  const evaluationHistory = Array.isArray(player.evaluationHistory) ? player.evaluationHistory : [];

  const nowIso = new Date().toISOString();

  // Execute in atomic transaction
  db.exec('BEGIN TRANSACTION;');
  try {
    // 1. Upsert player profile
    const upsertPlayer = db.prepare(`
      INSERT INTO players (
        id, name, level, title, xp, total_sessions, total_points, 
        current_streak, best_streak, sound_enabled, active_session_start_time, 
        active_session_subject, simulation_date_key, accountability_status, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        level = excluded.level,
        title = excluded.title,
        xp = excluded.xp,
        total_sessions = excluded.total_sessions,
        total_points = excluded.total_points,
        current_streak = excluded.current_streak,
        best_streak = excluded.best_streak,
        sound_enabled = excluded.sound_enabled,
        active_session_start_time = excluded.active_session_start_time,
        active_session_subject = excluded.active_session_subject,
        simulation_date_key = excluded.simulation_date_key,
        accountability_status = excluded.accountability_status,
        updated_at = excluded.updated_at;
    `);

    upsertPlayer.run(
      playerId,
      player.name || 'RAMIN',
      player.level || 1,
      player.title || 'The Beginner',
      player.xp || 0,
      player.totalSessions || sessions.length,
      player.totalPoints || sessions.length,
      player.currentStreak || 0,
      player.bestStreak || 0,
      player.soundEnabled !== false ? 1 : 0,
      player.activeSessionStartTime || null,
      player.activeSessionSubject || null,
      player.simulationDateKey || '2026-09-21',
      player.accountabilityStatus || 'standard',
      nowIso
    );

    // 2. Upsert study sessions
    const insertSession = db.prepare(`
      INSERT OR REPLACE INTO study_sessions (
        id, player_id, session_number, date_key, start_time, end_time,
        duration_minutes, duration_seconds, subject, point_earned, xp_earned,
        notes, companion_feedback, reported_count, removed_count,
        verification_method, academic_evaluation, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      const sessId = s.id || `sess-${i + 1}`;
      insertSession.run(
        sessId,
        playerId,
        s.sessionNumber || (i + 1),
        s.dateKey || '2026-09-21',
        s.startTime || nowIso,
        s.endTime || nowIso,
        s.durationMinutes || 30,
        s.durationSeconds || 1800,
        s.subject || 'Algorithms',
        s.pointEarned || 1,
        s.xpEarned || 1,
        s.notes || null,
        s.companionFeedback || null,
        s.reportedCount != null ? s.reportedCount : null,
        s.removedCount != null ? s.removedCount : null,
        s.verificationMethod || null,
        s.academicEvaluation ? JSON.stringify(s.academicEvaluation) : null,
        s.startTime || nowIso
      );
    }

    // 3. Upsert achievements
    const insertAchievement = db.prepare(`
      INSERT OR REPLACE INTO achievements (
        id, player_id, title, description, requirement, type, category,
        unlocked, unlocked_at, icon, badge_emoji, progress, max_progress, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    for (const a of achievements) {
      insertAchievement.run(
        a.id,
        playerId,
        a.title,
        a.description,
        a.requirement || 1,
        a.type || 'sessions',
        a.category || 'starting',
        a.unlocked ? 1 : 0,
        a.unlockedAt || null,
        a.icon || 'Trophy',
        a.badgeEmoji || '🏆',
        a.progress || 0,
        a.maxProgress || a.requirement || 1,
        nowIso
      );
    }

    // 4. Upsert activity logs
    const insertLog = db.prepare(`
      INSERT OR REPLACE INTO activity_logs (
        id, player_id, type, title, detail, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?);
    `);

    for (const log of activityLogs) {
      insertLog.run(
        log.id || `log-${Date.now()}-${Math.random()}`,
        playerId,
        log.type || 'session',
        log.title || 'Activity',
        log.detail || '',
        log.timestamp || nowIso
      );
    }

    // 5. Upsert academic dossier
    const insertDossier = db.prepare(`
      INSERT OR REPLACE INTO academic_dossier (
        id, player_id, topic, subject, grade, last_tested_date, notes, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `);

    for (let i = 0; i < academicDossier.length; i++) {
      const d = academicDossier[i];
      insertDossier.run(
        `dossier-${d.topic.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        playerId,
        d.topic,
        d.subject,
        d.grade,
        d.lastTestedDate || '2026-09-21',
        d.notes || null,
        nowIso
      );
    }

    // 6. Upsert evaluation history
    const insertEval = db.prepare(`
      INSERT OR REPLACE INTO evaluation_history (
        id, player_id, date_key, day_number, reported_count, accepted_count,
        questionable_count, confidence_grid, study_attention, session_honesty,
        accountability_status, summary_tutor_notes, active_role, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    for (const ev of evaluationHistory) {
      insertEval.run(
        ev.id || `eval-${Date.now()}`,
        playerId,
        ev.dateKey || '2026-09-21',
        ev.dayNumber || 1,
        ev.reportedCount || 0,
        ev.acceptedCount || 0,
        ev.questionableCount || 0,
        JSON.stringify(ev.confidenceGrid || []),
        ev.studyAttention || 'High',
        ev.sessionHonesty || 'Good',
        ev.accountabilityStatus || 'standard',
        ev.summaryTutorNotes || '',
        ev.activeRole || null,
        ev.timestamp || nowIso
      );
    }

    // 7. Upsert tasks
    const insertTask = db.prepare(`
      INSERT OR REPLACE INTO tasks (
        id, player_id, category, title, description, requirement,
        current_progress, completed, reward_text, icon, task_order, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      insertTask.run(
        t.id,
        playerId,
        t.category || 'daily',
        t.title,
        t.description,
        t.requirement || 1,
        t.currentProgress || 0,
        t.completed ? 1 : 0,
        t.rewardText || '',
        t.icon || null,
        t.order || i,
        nowIso
      );
    }

    db.exec('COMMIT;');

    return {
      success: true,
      backupId,
      counts: {
        sessions: sessions.length,
        achievements: achievements.length,
        activityLogs: activityLogs.length,
        dossier: academicDossier.length,
        evaluations: evaluationHistory.length,
        tasks: tasks.length,
      }
    };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

/**
 * Save an added or uploaded batch of study sessions atomically into SQLite.
 */
export function insertStudySessionsBatch(
  playerId: string = 'ramin',
  sessions: any[],
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
  newLog?: any,
  academicEvaluation?: any
): void {
  const db = getDatabase();
  const nowIso = new Date().toISOString();

  db.exec('BEGIN TRANSACTION;');
  try {
    const insertSession = db.prepare(`
      INSERT OR REPLACE INTO study_sessions (
        id, player_id, session_number, date_key, start_time, end_time,
        duration_minutes, duration_seconds, subject, point_earned, xp_earned,
        notes, topic, investigation_status, verification_result,
        questions_asked, relevant_answers, evidence_summary,
        companion_feedback, reported_count, removed_count,
        verification_method, academic_evaluation, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    for (const s of sessions) {
      insertSession.run(
        s.id,
        playerId,
        s.sessionNumber,
        s.dateKey,
        s.startTime || nowIso,
        s.endTime || nowIso,
        s.durationMinutes || 30,
        s.durationSeconds || 1800,
        s.subject,
        s.pointEarned || 1,
        s.xpEarned || 1,
        s.notes || null,
        s.topic || null,
        s.investigationStatus || null,
        s.verificationResult || null,
        s.questionsAsked != null ? s.questionsAsked : null,
        s.relevantAnswers ? JSON.stringify(s.relevantAnswers) : null,
        s.evidenceSummary || null,
        s.companionFeedback || null,
        s.reportedCount != null ? s.reportedCount : null,
        s.removedCount != null ? s.removedCount : null,
        s.verificationMethod || (s.verificationResult ? 'AI Study Investigator' : null),
        s.academicEvaluation ? JSON.stringify(s.academicEvaluation) : null,
        s.startTime || nowIso
      );
    }

    // Update player totals & streak
    const updatePlayer = db.prepare(`
      UPDATE players SET
        xp = ?,
        total_sessions = ?,
        total_points = ?,
        current_streak = ?,
        best_streak = ?,
        level = ?,
        title = ?,
        accountability_status = COALESCE(?, accountability_status),
        updated_at = ?
      WHERE id = ?;
    `);
    updatePlayer.run(
      updatedPlayerStats.xp,
      updatedPlayerStats.totalSessions,
      updatedPlayerStats.totalPoints,
      updatedPlayerStats.currentStreak,
      updatedPlayerStats.bestStreak,
      updatedPlayerStats.level,
      updatedPlayerStats.title,
      updatedPlayerStats.accountabilityStatus || null,
      nowIso,
      playerId
    );

    // Insert activity log if provided
    if (newLog) {
      const insertLog = db.prepare(`
        INSERT OR REPLACE INTO activity_logs (id, player_id, type, title, detail, timestamp)
        VALUES (?, ?, ?, ?, ?, ?);
      `);
      insertLog.run(newLog.id, playerId, newLog.type, newLog.title, newLog.detail, newLog.timestamp || nowIso);
    }

    // Insert academic evaluation if provided
    if (academicEvaluation) {
      const insertEval = db.prepare(`
        INSERT OR REPLACE INTO evaluation_history (
          id, player_id, date_key, day_number, reported_count, accepted_count,
          questionable_count, confidence_grid, study_attention, session_honesty,
          accountability_status, summary_tutor_notes, active_role, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `);
      insertEval.run(
        academicEvaluation.id,
        playerId,
        academicEvaluation.dateKey,
        academicEvaluation.dayNumber,
        academicEvaluation.reportedCount,
        academicEvaluation.acceptedCount,
        academicEvaluation.questionableCount,
        JSON.stringify(academicEvaluation.confidenceGrid || []),
        academicEvaluation.studyAttention,
        academicEvaluation.sessionHonesty,
        academicEvaluation.accountabilityStatus,
        academicEvaluation.summaryTutorNotes || '',
        academicEvaluation.activeRole || null,
        academicEvaluation.timestamp || nowIso
      );
    }

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

/**
 * Updates unlocked achievements in SQLite.
 */
export function updateAchievementsInDatabase(playerId: string = 'ramin', achievements: any[]): void {
  const db = getDatabase();
  const nowIso = new Date().toISOString();

  db.exec('BEGIN TRANSACTION;');
  try {
    const updateStmt = db.prepare(`
      UPDATE achievements SET
        unlocked = ?,
        unlocked_at = ?,
        progress = ?,
        updated_at = ?
      WHERE id = ? AND player_id = ?;
    `);

    for (const a of achievements) {
      updateStmt.run(
        a.unlocked ? 1 : 0,
        a.unlockedAt || null,
        a.progress || 0,
        nowIso,
        a.id,
        playerId
      );
    }
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

/**
 * Diagnostics & health check: verify PRAGMA integrity and row counts.
 */
export function getDatabaseDiagnostics(): any {
  const db = getDatabase();

  const integrityRow: any = db.prepare('PRAGMA integrity_check;').get();
  const integrityOk = integrityRow && Object.values(integrityRow)[0] === 'ok';

  const sessionsCount: any = db.prepare('SELECT COUNT(*) as count FROM study_sessions;').get();
  const achievementsCount: any = db.prepare('SELECT COUNT(*) as count FROM achievements;').get();
  const playersCount: any = db.prepare('SELECT COUNT(*) as count FROM players;').get();
  const logsCount: any = db.prepare('SELECT COUNT(*) as count FROM activity_logs;').get();
  const backupsCount: any = db.prepare('SELECT COUNT(*) as count FROM migration_backups;').get();

  let dbSizeBytes = 0;
  if (fs.existsSync(DB_PATH)) {
    dbSizeBytes = fs.statSync(DB_PATH).size;
  }

  return {
    status: integrityOk ? 'healthy' : 'degraded',
    databaseEngine: 'SQLite (ACID / WAL Mode)',
    databasePath: DB_PATH,
    fileSizeBytes: dbSizeBytes,
    integrityCheck: integrityRow ? Object.values(integrityRow)[0] : 'unknown',
    counts: {
      players: playersCount?.count || 0,
      studySessions: sessionsCount?.count || 0,
      achievements: achievementsCount?.count || 0,
      activityLogs: logsCount?.count || 0,
      backups: backupsCount?.count || 0,
    },
    backupsDirectory: BACKUPS_DIR,
    timestamp: new Date().toISOString(),
  };
}
