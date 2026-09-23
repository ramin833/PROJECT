import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Achievement, 
  CampaignDay, 
  PlayerState, 
  StudySession, 
  ActivityLog, 
  ActiveScreen,
  SubjectType,
  UploadResult,
  LevelUpEvent,
  GameTask,
  AcademicEvaluation,
  AcademicTopicRecord,
  AccountabilityStatus
} from '../types/game';
import { CAMPAIGN_START, generateCampaignDays, calculateStreakStats } from '../utils/campaign';
import { INITIAL_ACHIEVEMENTS, evaluateAchievements } from '../utils/achievements';
import { getLevelInfo } from '../utils/levels';
import { generate27SessionDemo } from '../utils/seed';
import { sound } from '../utils/audio';
import { evaluateAllTasks } from '../utils/tasks';
import { databaseService, DatabaseStatus, MigrationResult } from '../services/databaseService';

const STORAGE_KEY = 'studyquest_ramin_v3_clean';

export const INITIAL_ACADEMIC_DOSSIER: AcademicTopicRecord[] = [
  { topic: "Prim's Algorithm", subject: 'Algorithms', grade: 'Strong', lastTestedDate: '2026-09-21', notes: 'Demonstrates clear grasp of greedy cut edge selection' },
  { topic: "Kruskal's Algorithm", subject: 'Algorithms', grade: 'Strong', lastTestedDate: '2026-09-21', notes: 'Explains safe cycle prevention and union-find' },
  { topic: 'Relational Normalization (BCNF / 3NF)', subject: 'Database', grade: 'Moderate', lastTestedDate: '2026-09-20', notes: 'Understands functional dependencies, decomposition in progress' },
  { topic: 'Complex Integration & Cauchy Formula', subject: 'Complex Variable', grade: 'Weak', lastTestedDate: '2026-09-19', notes: 'Struggled with contour integration residues' },
];

interface CompletionRewardState {
  session: StudySession;
  isFirstToday: boolean;
  leveledUp: boolean;
  newLevel: number;
}

interface GameContextType {
  player: PlayerState;
  campaignDays: CampaignDay[];
  achievements: Achievement[];
  tasks: GameTask[];
  dailyTasks: GameTask[];
  activeScreen: ActiveScreen;
  todayCampaignDay: CampaignDay | undefined;
  todaySessions: StudySession[];
  activeSessionDuration: number;
  lastCompletionReward: CompletionRewardState | null;
  levelUpCelebration: number | null;
  newlyUnlockedAchievement: Achievement | null;
  showQuestCompleteModal: boolean;
  selectedSubject: SubjectType;
  
  // Upload modal & results (legacy / compatibility)
  isUploadModalOpen: boolean;
  uploadResult: UploadResult | null;
  openUploadModal: () => void;
  closeUploadModal: () => void;
  closeUploadResult: () => void;
  uploadSessions: (
    count: number, 
    subjectBreakdown?: Record<string, number>, 
    notes?: string, 
    verificationMeta?: { 
      reportedCount?: number; 
      removedCount?: number; 
      companionFeedback?: string;
      academicEvaluation?: AcademicEvaluation;
    }
  ) => void;
  setAccountabilityStatus: (status: AccountabilityStatus) => void;

  // AI Study Investigator (Strict, Suspicious, Automatic Session Creator)
  isInvestigatorOpen: boolean;
  openInvestigator: () => void;
  closeInvestigator: () => void;
  recordInvestigatorVerifiedSession: (data: {
    topic: string;
    subject: SubjectType;
    durationMinutes?: number;
    evidenceSummary?: string;
    questionsAsked?: number;
    relevantAnswers?: string[];
  }) => Promise<{
    success: boolean;
    session: StudySession;
    didLevelUp: boolean;
    wasFirstToday: boolean;
  }>;

  // Reset modal & feedback
  isResetModalOpen: boolean;
  resetNotice: string | null;
  openResetModal: () => void;
  closeResetModal: () => void;
  clearResetNotice: () => void;

  // Navigation & Study
  setActiveScreen: (screen: ActiveScreen) => void;
  setSelectedSubject: (subject: SubjectType) => void;
  startStudyFlow: () => void;
  beginActiveStudy: (subject: SubjectType) => void;
  completeStudySession: () => void;
  cancelActiveSession: () => void;
  closeRewardModal: () => void;
  closeLevelUpModal: () => void;
  closeAchievementModal: () => void;
  closeQuestCompleteModal: () => void;
  toggleSound: () => void;
  resetToFreshStart: () => void;
  loadDemoLevel4: () => void;
  load60DayCompletedDemo: () => void;
  setPlayerName: (name: string) => void;

  // Database persistence & diagnostics
  isDatabaseSynced: boolean;
  databaseStatus: DatabaseStatus | null;
  migrationResult: MigrationResult | null;
  triggerDatabaseSync: () => Promise<void>;
  exportDatabaseBackup: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved state or initialize Day 1 fresh from zero
  const [player, setPlayer] = useState<PlayerState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const levelData = getLevelInfo(parsed.totalPoints || 0);
          return {
            ...parsed,
            level: levelData.level,
            title: levelData.title,
            accountabilityStatus: parsed.accountabilityStatus || 'standard',
            academicDossier: parsed.academicDossier || [
              { topic: "Prim's Algorithm", subject: 'Algorithms', grade: 'Strong', lastTestedDate: '2026-09-21', notes: 'Demonstrates clear grasp of greedy cut edge selection' },
              { topic: "Kruskal's Algorithm", subject: 'Algorithms', grade: 'Strong', lastTestedDate: '2026-09-21', notes: 'Explains safe cycle prevention and union-find' },
              { topic: 'Relational Normalization (BCNF / 3NF)', subject: 'Database', grade: 'Moderate', lastTestedDate: '2026-09-20', notes: 'Understands functional dependencies, decomposition in progress' },
              { topic: 'Complex Integration & Cauchy Formula', subject: 'Complex Variable', grade: 'Weak', lastTestedDate: '2026-09-19', notes: 'Struggled with contour integration residues' },
            ],
            evaluationHistory: parsed.evaluationHistory || [],
          };
        } catch {
          // fallback
        }
      }
    }
    // Default initial game state: Day 1, September 21, 2026 - Completely fresh zero state
    return {
      name: 'RAMIN',
      level: 1,
      title: 'The Beginner',
      xp: 0,
      totalSessions: 0,
      totalPoints: 0,
      currentStreak: 0,
      bestStreak: 0,
      sessions: [],
      activityLogs: [
        {
          id: 'init-1',
          type: 'quest_complete',
          title: '⚔️ Quest Initialized',
          detail: '60-Day Consistency Maker: September 21, 2026. Show up every day.',
          timestamp: new Date().toISOString(),
        }
      ],
      soundEnabled: true,
      activeSessionStartTime: null,
      activeSessionSubject: null,
      simulationDateKey: CAMPAIGN_START,
      accountabilityStatus: 'standard',
      academicDossier: [
        { topic: "Prim's Algorithm", subject: 'Algorithms', grade: 'Strong', lastTestedDate: '2026-09-21', notes: 'Demonstrates clear grasp of greedy cut edge selection' },
        { topic: "Kruskal's Algorithm", subject: 'Algorithms', grade: 'Strong', lastTestedDate: '2026-09-21', notes: 'Explains safe cycle prevention and union-find' },
        { topic: 'Relational Normalization (BCNF / 3NF)', subject: 'Database', grade: 'Moderate', lastTestedDate: '2026-09-20', notes: 'Understands functional dependencies, decomposition in progress' },
        { topic: 'Complex Integration & Cauchy Formula', subject: 'Complex Variable', grade: 'Weak', lastTestedDate: '2026-09-19', notes: 'Struggled with contour integration residues' },
      ],
      evaluationHistory: [],
    };
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${STORAGE_KEY}_achievements`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_ACHIEVEMENTS;
  });

  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home');
  const [selectedSubject, setSelectedSubject] = useState<SubjectType>('Algorithms');
  const [activeSessionDuration, setActiveSessionDuration] = useState<number>(0);

  // Modals & Celebrations
  const [isInvestigatorOpen, setIsInvestigatorOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  const [lastCompletionReward, setLastCompletionReward] = useState<CompletionRewardState | null>(null);
  const [levelUpCelebration, setLevelUpCelebration] = useState<number | null>(null);
  const [newlyUnlockedAchievement, setNewlyUnlockedAchievement] = useState<Achievement | null>(null);
  const [showQuestCompleteModal, setShowQuestCompleteModal] = useState<boolean>(false);

  // Database persistence & synchronization state
  const [isDatabaseSynced, setIsDatabaseSynced] = useState<boolean>(false);
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

  // Initial Database Load & Auto-Migration from client localStorage
  useEffect(() => {
    let isMounted = true;

    async function initDatabase() {
      try {
        // Step 1: Check if server database already has stored game state
        const serverState = await databaseService.fetchGameState();

        if (serverState.exists && serverState.data) {
          // Authoritative database exists: load into state
          const dbPlayer = serverState.data.player;
          const dbAchievements = serverState.data.achievements;

          if (isMounted) {
            setPlayer(dbPlayer);
            if (Array.isArray(dbAchievements) && dbAchievements.length > 0) {
              setAchievements(dbAchievements);
            }
            setIsDatabaseSynced(true);
          }
        } else {
          // SQLite database is fresh: Safely migrate existing client data into database
          let existingPlayerToMigrate = player;
          let existingAchievementsToMigrate = achievements;

          if (typeof window !== 'undefined') {
            const rawPlayer = localStorage.getItem(STORAGE_KEY);
            const rawAch = localStorage.getItem(`${STORAGE_KEY}_achievements`);
            if (rawPlayer) {
              try { existingPlayerToMigrate = JSON.parse(rawPlayer); } catch { /* ignore */ }
            }
            if (rawAch) {
              try { existingAchievementsToMigrate = JSON.parse(rawAch); } catch { /* ignore */ }
            }
          }

          const migration = await databaseService.migrateToDatabase(
            existingPlayerToMigrate,
            existingAchievementsToMigrate
          );

          if (isMounted && migration && migration.success) {
            setMigrationResult(migration);
            setIsDatabaseSynced(true);
            console.log('[StudyQuest Database] Safe migration verified:', migration);
          }
        }

        // Fetch database diagnostics
        const status = await databaseService.fetchStatus();
        if (isMounted && status) {
          setDatabaseStatus(status);
        }
      } catch (err) {
        console.warn('[StudyQuest Database] Initialization warning:', err);
      }
    }

    initDatabase();

    return () => {
      isMounted = false;
    };
  }, []);

  // Resume active session if app was reloaded during an ongoing timer
  useEffect(() => {
    if (player.activeSessionStartTime) {
      setActiveScreen('active_study');
      if (player.activeSessionSubject) {
        setSelectedSubject(player.activeSessionSubject);
      }
    }
  }, []);

  // Timer loop for live study timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (player.activeSessionStartTime) {
      const startMs = new Date(player.activeSessionStartTime).getTime();
      const updateTimer = () => {
        const nowMs = Date.now();
        const diffSecs = Math.max(0, Math.floor((nowMs - startMs) / 1000));
        setActiveSessionDuration(diffSecs);
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setActiveSessionDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [player.activeSessionStartTime]);

  // Generate 60 campaign days dynamically
  const campaignDays = useMemo(() => {
    return generateCampaignDays(player.sessions, player.simulationDateKey);
  }, [player.sessions, player.simulationDateKey]);

  // Today's node
  const todayCampaignDay = useMemo(() => {
    return campaignDays.find(d => d.dateKey === player.simulationDateKey);
  }, [campaignDays, player.simulationDateKey]);

  // Sessions today
  const todaySessions = useMemo(() => {
    return player.sessions.filter(s => s.dateKey === player.simulationDateKey);
  }, [player.sessions, player.simulationDateKey]);

  // Streak stats
  const streakStats = useMemo(() => {
    return calculateStreakStats(campaignDays, player.simulationDateKey);
  }, [campaignDays, player.simulationDateKey]);

  // Tasks Engine: Evaluate tasks across 4 categories
  const tasks = useMemo(() => {
    return evaluateAllTasks(
      todaySessions,
      streakStats.currentStreak,
      player.totalSessions,
      campaignDays
    );
  }, [todaySessions, streakStats.currentStreak, player.totalSessions, campaignDays]);

  const dailyTasks = useMemo(() => {
    return tasks.filter(t => t.category === 'daily');
  }, [tasks]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
    } catch {
      // ignore
    }
  }, [player]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_achievements`, JSON.stringify(achievements));
    } catch {
      // ignore
    }
  }, [achievements]);

  // Evaluate achievements whenever stats update
  useEffect(() => {
    const { updated, newlyUnlocked } = evaluateAchievements(
      achievements,
      player.sessions,
      streakStats.currentStreak,
      campaignDays
    );

    if (newlyUnlocked.length > 0) {
      setAchievements(updated);
      setNewlyUnlockedAchievement(newlyUnlocked[0]);
      if (player.soundEnabled) sound.playLevelUp();
      databaseService.saveAchievements(updated).then(() => {
        setIsDatabaseSynced(true);
      });
    }
  }, [player.sessions.length, streakStats.currentStreak, campaignDays]);

  // Check 60-day quest complete
  useEffect(() => {
    const completedDays = campaignDays.filter(d => d.sessionCount > 0).length;
    if (completedDays === 60 && !showQuestCompleteModal) {
      setShowQuestCompleteModal(true);
    }
  }, [campaignDays, showQuestCompleteModal]);

  // Sound toggle
  const toggleSound = useCallback(() => {
    setPlayer(prev => {
      const next = !prev.soundEnabled;
      if (next) sound.playClick();
      return { ...prev, soundEnabled: next };
    });
  }, []);

  const setPlayerName = useCallback((name: string) => {
    setPlayer(prev => ({ ...prev, name }));
  }, []);

  // AI Study Investigator modal controls
  const openInvestigator = useCallback(() => {
    if (player.soundEnabled) sound.playClick();
    setIsInvestigatorOpen(true);
  }, [player.soundEnabled]);

  const closeInvestigator = useCallback(() => {
    setIsInvestigatorOpen(false);
  }, []);

  // Modal open/close controls (redirect legacy upload triggers to AI Study Investigator)
  const openUploadModal = useCallback(() => {
    openInvestigator();
  }, [openInvestigator]);

  const closeUploadModal = useCallback(() => {
    setIsUploadModalOpen(false);
    setIsInvestigatorOpen(false);
  }, []);

  const closeUploadResult = useCallback(() => {
    setUploadResult(null);
  }, []);

  const openResetModal = useCallback(() => {
    if (player.soundEnabled) sound.playClick();
    setIsResetModalOpen(true);
  }, [player.soundEnabled]);

  const closeResetModal = useCallback(() => {
    setIsResetModalOpen(false);
  }, []);

  const clearResetNotice = useCallback(() => {
    setResetNotice(null);
  }, []);

  /**
   * CORE NEW MECHANIC: UPLOAD TODAY'S SESSIONS
   * Logs N sessions at once with 1 Session = 1 Point = 1 XP
   */
  const uploadSessions = useCallback((
    count: number, 
    subjectBreakdown?: Record<string, number>, 
    notes?: string,
    verificationMeta?: { 
      reportedCount?: number; 
      removedCount?: number; 
      companionFeedback?: string;
      academicEvaluation?: AcademicEvaluation;
    }
  ) => {
    if (count <= 0) return;

    const wasFirstToday = todaySessions.length === 0;
    const dayNumber = todayCampaignDay?.dayNumber || 1;
    const dateKey = player.simulationDateKey;
    const now = new Date();

    // Prepare list of subjects to assign
    const subjectsToAssign: string[] = [];
    if (subjectBreakdown) {
      Object.entries(subjectBreakdown).forEach(([subj, num]) => {
        for (let i = 0; i < num; i++) {
          subjectsToAssign.push(subj);
        }
      });
    }

    const newSessionsList: StudySession[] = [];
    for (let i = 0; i < count; i++) {
      const sessNumber = player.totalSessions + i + 1;
      const subj = subjectsToAssign[i] || selectedSubject || 'General Study';
      
      const startTime = new Date(now.getTime() - (count - i) * 45 * 60 * 1000).toISOString();
      const endTime = new Date(now.getTime() - (count - i - 1) * 45 * 60 * 1000).toISOString();

      newSessionsList.push({
        id: `sess-upload-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        sessionNumber: sessNumber,
        dateKey,
        startTime,
        endTime,
        durationMinutes: 45,
        durationSeconds: 2700,
        subject: subj,
        pointEarned: 1,
        xpEarned: 1,
        notes: notes || `Batch session ${i + 1} of ${count}`,
      });
    }

    const previousPoints = player.totalPoints;
    const newTotalPoints = previousPoints + count;
    const newTotalSessions = player.totalSessions + count;
    const newTotalXp = player.xp + count;

    const prevLevelInfo = getLevelInfo(previousPoints);
    const newLevelInfo = getLevelInfo(newTotalPoints);
    const didLevelUp = newLevelInfo.level > prevLevelInfo.level;

    let levelUpData: LevelUpEvent | null = null;
    if (didLevelUp) {
      levelUpData = {
        level: newLevelInfo.level,
        title: newLevelInfo.title,
        pointsReached: newTotalPoints,
      };
    }

    // Activity logs
    const newActivities: ActivityLog[] = [
      {
        id: `act-batch-${Date.now()}`,
        type: 'session',
        title: `📚 ${count} Study Session${count > 1 ? 's' : ''} Uploaded`,
        detail: `+${count} Points • +${count} XP`,
        timestamp: new Date().toISOString(),
      }
    ];

    if (wasFirstToday) {
      newActivities.push({
        id: `act-day-${Date.now()}`,
        type: 'day_complete',
        title: `🔥 Day ${dayNumber} Complete`,
        detail: `Today's mission fulfilled! Consistency day locked.`,
        timestamp: new Date().toISOString(),
      });
    }

    if (didLevelUp) {
      newActivities.push({
        id: `act-lvl-${Date.now()}`,
        type: 'level_up',
        title: `⚡ Level Up: Level ${newLevelInfo.level} — ${newLevelInfo.title}`,
        detail: `${newTotalPoints} points reached!`,
        timestamp: new Date().toISOString(),
      });
    }

    // Update Player
    const newEval = verificationMeta?.academicEvaluation;
    setPlayer(prev => ({
      ...prev,
      level: newLevelInfo.level,
      title: newLevelInfo.title,
      xp: newTotalXp,
      totalSessions: newTotalSessions,
      totalPoints: newTotalPoints,
      accountabilityStatus: newEval?.accountabilityStatus || prev.accountabilityStatus,
      evaluationHistory: newEval ? [newEval, ...(prev.evaluationHistory || [])].slice(0, 30) : (prev.evaluationHistory || []),
      sessions: [...newSessionsList.reverse(), ...prev.sessions],
      activityLogs: [...newActivities, ...prev.activityLogs].slice(0, 50),
    }));

    // Calculate updated streak with this day complete
    const tempStreak = wasFirstToday ? (player.currentStreak + 1) : player.currentStreak;

    // Set upload result for celebration modal
    const completedTasksNow = tasks.filter(t => t.completed).length;
    setUploadResult({
      uploadedCount: count,
      reportedCount: verificationMeta?.reportedCount ?? count,
      removedCount: verificationMeta?.removedCount ?? 0,
      companionFeedback: verificationMeta?.companionFeedback,
      academicEvaluation: verificationMeta?.academicEvaluation,
      newTotalSessions,
      pointsEarned: count,
      xpEarned: count,
      wasFirstToday,
      dayNumber,
      dayDateKey: dateKey,
      levelUp: levelUpData,
      currentStreak: Math.max(1, tempStreak),
      completedTasksCount: completedTasksNow,
      timestamp: new Date().toISOString(),
    });

    // Sound and Confetti
    if (player.soundEnabled) {
      sound.playPointSound();
      sound.playSuccess();
    }

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
      });
    } catch {
      // ignore
    }

    // Trigger level up modal if leveled up
    if (didLevelUp) {
      setTimeout(() => {
        setLevelUpCelebration(newLevelInfo.level);
      }, 1000);
    }

    // Persist session batch and player state to SQLite database
    databaseService.saveStudySessions(
      newSessionsList,
      {
        xp: newTotalXp,
        totalSessions: newTotalSessions,
        totalPoints: newTotalPoints,
        currentStreak: Math.max(1, tempStreak),
        bestStreak: Math.max(player.bestStreak, tempStreak),
        level: newLevelInfo.level,
        title: newLevelInfo.title,
        accountabilityStatus: newEval?.accountabilityStatus || player.accountabilityStatus,
      },
      newActivities[0],
      newEval
    ).then(() => {
      setIsDatabaseSynced(true);
      databaseService.fetchStatus().then(st => { if (st) setDatabaseStatus(st); });
    });
  }, [
    todaySessions.length, 
    todayCampaignDay?.dayNumber, 
    player.simulationDateKey, 
    player.totalSessions, 
    player.totalPoints, 
    player.xp, 
    player.currentStreak, 
    player.soundEnabled, 
    selectedSubject
  ]);

  // Live timer study flow (if user chooses to use real-time timer)
  const startStudyFlow = useCallback(() => {
    if (player.soundEnabled) sound.playClick();
    setActiveScreen('ready');
  }, [player.soundEnabled]);

  const beginActiveStudy = useCallback((subject: SubjectType) => {
    if (player.soundEnabled) sound.playClick();
    const nowIso = new Date().toISOString();
    setSelectedSubject(subject);
    setPlayer(prev => ({
      ...prev,
      activeSessionStartTime: nowIso,
      activeSessionSubject: subject,
    }));
    setActiveScreen('active_study');
  }, [player.soundEnabled]);

  const completeStudySession = useCallback(() => {
    const startTimeIso = player.activeSessionStartTime || new Date().toISOString();
    const endTimeIso = new Date().toISOString();
    const durationSeconds = Math.max(1, activeSessionDuration);
    const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
    const subjectToRecord = player.activeSessionSubject || selectedSubject || 'General Study';

    const wasFirstToday = todaySessions.length === 0;
    const newSessionNumber = player.totalSessions + 1;

    const newSession: StudySession = {
      id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sessionNumber: newSessionNumber,
      dateKey: player.simulationDateKey,
      startTime: startTimeIso,
      endTime: endTimeIso,
      durationMinutes,
      durationSeconds,
      subject: subjectToRecord,
      pointEarned: 1,
      xpEarned: 1,
    };

    const previousPoints = player.totalPoints;
    const newTotalPoints = previousPoints + 1;
    const newTotalSessions = player.totalSessions + 1;
    const newTotalXp = player.xp + 1;

    const prevLevelInfo = getLevelInfo(previousPoints);
    const newLevelInfo = getLevelInfo(newTotalPoints);
    const didLevelUp = newLevelInfo.level > prevLevelInfo.level;

    const newActivities: ActivityLog[] = [
      {
        id: `act-${Date.now()}-1`,
        type: 'session',
        title: '📚 Study Session',
        detail: `+1 Point • +1 XP (${subjectToRecord})`,
        timestamp: endTimeIso,
      },
    ];

    if (wasFirstToday) {
      newActivities.push({
        id: `act-${Date.now()}-2`,
        type: 'day_complete',
        title: '🟢 Day Complete',
        detail: `Today's mission fulfilled! Consistency day locked.`,
        timestamp: endTimeIso,
      });
    }

    if (didLevelUp) {
      newActivities.push({
        id: `act-${Date.now()}-3`,
        type: 'level_up',
        title: `⚡ Level Up: Level ${newLevelInfo.level} — ${newLevelInfo.title}`,
        detail: `${newTotalPoints} points reached!`,
        timestamp: endTimeIso,
      });
    }

    setPlayer(prev => {
      return {
        ...prev,
        level: newLevelInfo.level,
        title: newLevelInfo.title,
        xp: newTotalXp,
        totalSessions: newTotalSessions,
        totalPoints: newTotalPoints,
        sessions: [newSession, ...prev.sessions],
        activityLogs: [...newActivities, ...prev.activityLogs].slice(0, 50),
        activeSessionStartTime: null,
        activeSessionSubject: null,
      };
    });

    setLastCompletionReward({
      session: newSession,
      isFirstToday: wasFirstToday,
      leveledUp: didLevelUp,
      newLevel: newLevelInfo.level,
    });

    if (player.soundEnabled) {
      sound.playPointSound();
      sound.playSuccess();
    }

    try {
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
      });
    } catch {
      // ignore
    }

    if (didLevelUp) {
      setTimeout(() => {
        setLevelUpCelebration(newLevelInfo.level);
      }, 1200);
    }

    // Persist completed session to SQLite database
    databaseService.saveStudySessions(
      [newSession],
      {
        xp: newTotalXp,
        totalSessions: newTotalSessions,
        totalPoints: newTotalPoints,
        currentStreak: wasFirstToday ? (player.currentStreak + 1) : player.currentStreak,
        bestStreak: Math.max(player.bestStreak, wasFirstToday ? (player.currentStreak + 1) : player.currentStreak),
        level: newLevelInfo.level,
        title: newLevelInfo.title,
        accountabilityStatus: player.accountabilityStatus,
      },
      newActivities[0]
    ).then(() => {
      setIsDatabaseSynced(true);
      databaseService.fetchStatus().then(st => { if (st) setDatabaseStatus(st); });
    });
  }, [
    player.activeSessionStartTime,
    player.activeSessionSubject,
    player.totalSessions,
    player.simulationDateKey,
    player.totalPoints,
    player.xp,
    player.soundEnabled,
    activeSessionDuration,
    selectedSubject,
    todaySessions.length,
  ]);

  const cancelActiveSession = useCallback(() => {
    setPlayer(prev => ({
      ...prev,
      activeSessionStartTime: null,
      activeSessionSubject: null,
    }));
    setActiveScreen('home');
  }, []);

  const closeRewardModal = useCallback(() => {
    if (player.soundEnabled) sound.playClick();
    setLastCompletionReward(null);
    setActiveScreen('home');
  }, [player.soundEnabled]);

  const closeLevelUpModal = useCallback(() => {
    if (player.soundEnabled) sound.playClick();
    setLevelUpCelebration(null);
  }, [player.soundEnabled]);

  const closeAchievementModal = useCallback(() => {
    setNewlyUnlockedAchievement(null);
  }, []);

  const closeQuestCompleteModal = useCallback(() => {
    setShowQuestCompleteModal(false);
  }, []);

  /**
   * RECORD INVESTIGATOR-VERIFIED STUDY SESSION
   * Automatically saves session upon successful AI cross-examination
   * Strictly grants 1 Session = 1 Point = 1 XP, advances streak if first session today,
   * updates campaign journey and persists directly to SQLite database.
   */
  const recordInvestigatorVerifiedSession = useCallback(async (data: {
    topic: string;
    subject: SubjectType;
    durationMinutes?: number;
    evidenceSummary?: string;
    questionsAsked?: number;
    relevantAnswers?: string[];
  }): Promise<{
    success: boolean;
    session: StudySession;
    didLevelUp: boolean;
    wasFirstToday: boolean;
  }> => {
    const now = new Date();
    const durationMins = data.durationMinutes || 25;
    const startTimeIso = new Date(now.getTime() - durationMins * 60000).toISOString();
    const endTimeIso = now.toISOString();

    const wasFirstToday = todaySessions.length === 0;
    const newSessionNumber = player.totalSessions + 1;

    const newSession: StudySession = {
      id: `sess-inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sessionNumber: newSessionNumber,
      dateKey: player.simulationDateKey,
      startTime: startTimeIso,
      endTime: endTimeIso,
      durationMinutes: durationMins,
      durationSeconds: durationMins * 60,
      subject: data.subject,
      pointEarned: 1,
      xpEarned: 1,
      notes: `AI Study Investigator: Verified understanding of ${data.topic}`,
      topic: data.topic,
      investigationStatus: 'VERIFIED',
      verificationResult: 'VERIFIED',
      questionsAsked: data.questionsAsked || 3,
      relevantAnswers: data.relevantAnswers || [],
      evidenceSummary: data.evidenceSummary || 'Demonstrated genuine conceptual understanding of topic under cross-examination.',
      timestamp: endTimeIso,
    };

    const previousPoints = player.totalPoints;
    const newTotalPoints = previousPoints + 1;
    const newTotalSessions = player.totalSessions + 1;
    const newTotalXp = player.xp + 1;

    const prevLevelInfo = getLevelInfo(previousPoints);
    const newLevelInfo = getLevelInfo(newTotalPoints);
    const didLevelUp = newLevelInfo.level > prevLevelInfo.level;

    const newActivities: ActivityLog[] = [
      {
        id: `act-${Date.now()}-inv`,
        type: 'session',
        title: '🔎 Verified Investigation',
        detail: `+1 Point • +1 XP (${data.topic} • ${data.subject})`,
        timestamp: endTimeIso,
      },
    ];

    if (wasFirstToday) {
      newActivities.push({
        id: `act-${Date.now()}-day`,
        type: 'day_complete',
        title: `🔥 Day ${todayCampaignDay?.dayNumber || 1} Complete!`,
        detail: `Study streak maintained: ${player.currentStreak + 1} days`,
        timestamp: endTimeIso,
      });
    }

    const tempStreak = wasFirstToday ? (player.currentStreak + 1) : player.currentStreak;

    // Update Player State
    setPlayer(prev => {
      const updatedSessions = [newSession, ...prev.sessions];
      const updatedStreak = wasFirstToday ? (prev.currentStreak + 1) : prev.currentStreak;
      const updatedBestStreak = Math.max(prev.bestStreak, updatedStreak);

      return {
        ...prev,
        totalPoints: newTotalPoints,
        totalSessions: newTotalSessions,
        xp: newTotalXp,
        level: newLevelInfo.level,
        title: newLevelInfo.title,
        currentStreak: updatedStreak,
        bestStreak: updatedBestStreak,
        sessions: updatedSessions,
        activityLogs: [...newActivities, ...prev.activityLogs].slice(0, 50),
      };
    });

    // Audio & Visual celebratory rewards
    if (player.soundEnabled) {
      sound.playPointSound();
      sound.playSuccess();
    }

    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'],
      });
    } catch {
      // ignore
    }

    if (didLevelUp) {
      setTimeout(() => {
        setLevelUpCelebration(newLevelInfo.level);
      }, 900);
    }

    // Persist verified session directly to persistent SQLite database
    try {
      await databaseService.recordInvestigatorSession({
        session: newSession,
        playerUpdate: {
          xp: newTotalXp,
          totalSessions: newTotalSessions,
          totalPoints: newTotalPoints,
          currentStreak: tempStreak,
          bestStreak: Math.max(player.bestStreak, tempStreak),
          level: newLevelInfo.level,
          title: newLevelInfo.title,
        },
        activityLog: newActivities[0]
      });
      setIsDatabaseSynced(true);
      const st = await databaseService.fetchStatus();
      if (st) setDatabaseStatus(st);
    } catch (err) {
      console.warn('Failed to immediately sync verified session with DB:', err);
    }

    return {
      success: true,
      session: newSession,
      didLevelUp,
      wasFirstToday,
    };
  }, [
    todaySessions.length,
    todayCampaignDay?.dayNumber,
    player.simulationDateKey,
    player.totalSessions,
    player.totalPoints,
    player.xp,
    player.currentStreak,
    player.bestStreak,
    player.soundEnabled,
  ]);

  /**
   * RESET EVERYTHING TO FRESH START
   * Wipes sessions, points, XP, level, streaks, achievements, statistics, and 60-Day Journey
   */
  const resetToFreshStart = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(`${STORAGE_KEY}_achievements`);
    } catch {
      // ignore
    }

    const fresh: PlayerState = {
      name: 'RAMIN',
      level: 1,
      title: 'The Beginner',
      xp: 0,
      totalSessions: 0,
      totalPoints: 0,
      currentStreak: 0,
      bestStreak: 0,
      sessions: [],
      activityLogs: [
        {
          id: 'init-fresh',
          type: 'quest_complete',
          title: '⚔️ New Quest Initialized',
          detail: 'Day 1 of 60: September 21, 2026. Show up every day.',
          timestamp: new Date().toISOString(),
        }
      ],
      soundEnabled: true,
      activeSessionStartTime: null,
      activeSessionSubject: null,
      simulationDateKey: CAMPAIGN_START,
      accountabilityStatus: 'standard',
      academicDossier: INITIAL_ACADEMIC_DOSSIER,
      evaluationHistory: [],
    };

    setPlayer(fresh);
    setAchievements(INITIAL_ACHIEVEMENTS);
    setIsResetModalOpen(false);
    setUploadResult(null);
    setLastCompletionReward(null);
    setLevelUpCelebration(null);
    setActiveScreen('home');
    setResetNotice('NEW QUEST STARTED ⚔️');

    if (player.soundEnabled) sound.playClick();

    databaseService.syncGameState(fresh, INITIAL_ACHIEVEMENTS).then(() => {
      setIsDatabaseSynced(true);
      databaseService.fetchStatus().then(st => { if (st) setDatabaseStatus(st); });
    });
  }, [player.soundEnabled]);

  const loadDemoLevel4 = useCallback(() => {
    const { sessions, activityLogs } = generate27SessionDemo();
    const demoState: PlayerState = {
      name: 'RAMIN',
      level: 3,
      title: 'The Grinder',
      xp: 27,
      totalSessions: 27,
      totalPoints: 27,
      currentStreak: 4,
      bestStreak: 12,
      sessions,
      activityLogs,
      soundEnabled: true,
      activeSessionStartTime: null,
      activeSessionSubject: null,
      simulationDateKey: '2026-10-12', // Day 22 of the campaign
      accountabilityStatus: 'standard',
      academicDossier: INITIAL_ACADEMIC_DOSSIER,
      evaluationHistory: [
        {
          id: 'eval-demo-1',
          dayNumber: 21,
          dateKey: '2026-10-11',
          reportedCount: 4,
          acceptedCount: 4,
          questionableCount: 0,
          confidenceGrid: [
            { area: 'Algorithms', evaluation: 'Strong', notes: 'Greedy algorithms verified' },
            { area: 'Database', evaluation: 'Moderate', notes: '3NF normalization checked' },
          ],
          studyAttention: 'High',
          sessionHonesty: 'Good',
          accountabilityStatus: 'standard',
          summaryTutorNotes: 'Solid recall of algorithm greedy choice property and MST cut criterion.',
          timestamp: '2026-10-11T20:30:00.000Z',
        }
      ],
    };
    setPlayer(demoState);
    setActiveScreen('home');
    if (player.soundEnabled) sound.playLevelUp();

    databaseService.syncGameState(demoState, achievements).then(() => {
      setIsDatabaseSynced(true);
      databaseService.fetchStatus().then(st => { if (st) setDatabaseStatus(st); });
    });
  }, [player.soundEnabled, achievements]);

  const load60DayCompletedDemo = useCallback(() => {
    setShowQuestCompleteModal(true);
    if (player.soundEnabled) sound.playLevelUp();
  }, [player.soundEnabled]);

  const setAccountabilityStatus = useCallback((status: AccountabilityStatus) => {
    setPlayer(prev => ({
      ...prev,
      accountabilityStatus: status,
    }));
  }, []);

  const triggerDatabaseSync = useCallback(async () => {
    const success = await databaseService.syncGameState(player, achievements, tasks);
    if (success) {
      setIsDatabaseSynced(true);
      const st = await databaseService.fetchStatus();
      if (st) setDatabaseStatus(st);
    }
  }, [player, achievements, tasks]);

  const exportDatabaseBackup = useCallback(() => {
    window.location.href = databaseService.exportBackupUrl();
  }, []);

  const value = useMemo(() => ({
    player: {
      ...player,
      currentStreak: streakStats.currentStreak,
      bestStreak: Math.max(player.bestStreak, streakStats.bestStreak),
    },
    campaignDays,
    achievements,
    tasks,
    dailyTasks,
    activeScreen,
    todayCampaignDay,
    todaySessions,
    activeSessionDuration,
    lastCompletionReward,
    levelUpCelebration,
    newlyUnlockedAchievement,
    showQuestCompleteModal,
    selectedSubject,
    isUploadModalOpen,
    uploadResult,
    openUploadModal,
    closeUploadModal,
    closeUploadResult,
    uploadSessions,
    isInvestigatorOpen,
    openInvestigator,
    closeInvestigator,
    recordInvestigatorVerifiedSession,
    setAccountabilityStatus,
    isResetModalOpen,
    resetNotice,
    openResetModal,
    closeResetModal,
    clearResetNotice,
    setActiveScreen,
    setSelectedSubject,
    startStudyFlow,
    beginActiveStudy,
    completeStudySession,
    cancelActiveSession,
    closeRewardModal,
    closeLevelUpModal,
    closeAchievementModal,
    closeQuestCompleteModal,
    toggleSound,
    resetToFreshStart,
    loadDemoLevel4,
    load60DayCompletedDemo,
    setPlayerName,
    isDatabaseSynced,
    databaseStatus,
    migrationResult,
    triggerDatabaseSync,
    exportDatabaseBackup,
  }), [
    player,
    campaignDays,
    achievements,
    tasks,
    dailyTasks,
    activeScreen,
    todayCampaignDay,
    todaySessions,
    activeSessionDuration,
    lastCompletionReward,
    levelUpCelebration,
    newlyUnlockedAchievement,
    showQuestCompleteModal,
    selectedSubject,
    isUploadModalOpen,
    uploadResult,
    isInvestigatorOpen,
    openInvestigator,
    closeInvestigator,
    recordInvestigatorVerifiedSession,
    isResetModalOpen,
    resetNotice,
    streakStats,
    openUploadModal,
    closeUploadModal,
    closeUploadResult,
    uploadSessions,
    openResetModal,
    closeResetModal,
    clearResetNotice,
    setActiveScreen,
    setSelectedSubject,
    startStudyFlow,
    beginActiveStudy,
    completeStudySession,
    cancelActiveSession,
    closeRewardModal,
    closeLevelUpModal,
    closeAchievementModal,
    closeQuestCompleteModal,
    toggleSound,
    resetToFreshStart,
    loadDemoLevel4,
    load60DayCompletedDemo,
    setPlayerName,
    isDatabaseSynced,
    databaseStatus,
    migrationResult,
    triggerDatabaseSync,
    exportDatabaseBackup,
  ]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
