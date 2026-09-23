export type SubjectType = 
  | 'Algorithms' 
  | 'Database' 
  | 'Complex Variable' 
  | 'Programming' 
  | 'Other'
  | string;

export interface StudySession {
  id: string;
  sessionNumber: number;
  dateKey: string; // YYYY-MM-DD
  startTime: string; // ISO string
  endTime: string; // ISO string
  durationMinutes: number;
  durationSeconds: number;
  subject: SubjectType;
  pointEarned: number;
  xpEarned: number;
  notes?: string;
  // AI Study Investigator Metadata
  topic?: string;
  investigationStatus?: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'REJECTED' | 'MANUAL';
  verificationResult?: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'REJECTED';
  questionsAsked?: number;
  relevantAnswers?: string[];
  evidenceSummary?: string;
  timestamp?: string;
}

export type InvestigationStatus = 'inquiring' | 'investigating' | 'more_evidence_needed' | 'verified' | 'rejected';
export type InvestigationVerdict = 'PENDING' | 'PARTIALLY_VERIFIED' | 'VERIFIED' | 'REJECTED';

export interface InvestigatorChatMessage {
  id: string;
  role: 'investigator' | 'student';
  content: string;
  timestamp: string;
  stageLabel?: string;
  stageBadge?: 'inspect' | 'question' | 'verified' | 'evidence_needed' | 'challenge' | 'transfer' | 'rejected';
}

export interface InvestigationTurnResponse {
  investigatorMessage: string;
  investigationStatus: InvestigationStatus;
  verdict: InvestigationVerdict;
  stage: 'topic_inquiry' | 'core_question' | 'follow_up' | 'challenge' | 'verdict';
  stageLabel: string;
  confidenceScore: number;
  evidenceEvaluation: {
    topic: string;
    subject: string;
    evidenceSummary: string;
    understandingLevel: 'Strong' | 'Moderate' | 'Weak' | 'None';
    honestyAssessment: 'Good' | 'Vague' | 'Evasive' | 'Suspect';
  };
  verifiedSession?: {
    topic: string;
    subject: string;
    durationMinutes: number;
    evidenceSummary: string;
    questionsCount: number;
  };
}

export type DayNodeStatus = 'locked' | 'today' | 'completed' | 'missed';

export interface CampaignDay {
  dayNumber: number; // 1 to 60
  dateKey: string; // YYYY-MM-DD
  displayDate: string; // e.g. "Sep 21"
  status: DayNodeStatus;
  sessionCount: number;
  pointsEarned: number;
  xpEarned: number;
}

export type AchievementCategory = 'starting' | 'sessions' | 'streak' | 'journey';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  requirement: number;
  type: 'sessions' | 'streak' | 'days';
  category: AchievementCategory;
  unlocked: boolean;
  unlockedAt?: string;
  icon: string;
  badgeEmoji: string;
}

export type TaskCategory = 'daily' | 'streak' | 'milestones' | 'special';

export interface GameTask {
  id: string;
  category: TaskCategory;
  title: string;
  description: string;
  requirement: number;
  currentProgress: number;
  completed: boolean;
  rewardText: string;
  icon?: string;
  order: number;
}

export interface ActivityLog {
  id: string;
  type: 'session' | 'day_complete' | 'level_up' | 'achievement' | 'quest_complete' | 'task_complete';
  title: string;
  detail: string;
  timestamp: string;
}

export interface LevelUpEvent {
  level: number;
  title: string;
  pointsReached: number;
}

export type KnowledgeGrade = 'Strong' | 'Moderate' | 'Weak';
export type AttentionLevel = 'High' | 'Mixed' | 'Low';
export type HonestyRating = 'Good' | 'Guarded' | 'Questionable';
export type AccountabilityStatus = 'standard' | 'enhanced_review' | 'credit_suspended';
export type AcademicRoleType = 
  | 'Teacher'
  | 'Tutor'
  | 'Examiner'
  | 'Evaluator'
  | 'Coach'
  | 'Analyst'
  | 'Investigator'
  | 'Accountability Partner'
  | 'Study Companion'
  | 'Challenge Master';

export interface AcademicTopicRecord {
  topic: string;
  subject: string;
  grade: KnowledgeGrade;
  lastTestedDate: string;
  notes?: string;
}

export interface AcademicConfidenceItem {
  area: string;
  evaluation: KnowledgeGrade;
  notes?: string;
}

export interface AcademicEvaluation {
  id: string;
  dateKey: string;
  dayNumber: number;
  reportedCount: number;
  acceptedCount: number;
  questionableCount: number;
  confidenceGrid: AcademicConfidenceItem[];
  studyAttention: AttentionLevel;
  sessionHonesty: HonestyRating;
  accountabilityStatus: AccountabilityStatus;
  summaryTutorNotes: string;
  activeRole?: AcademicRoleType;
  timestamp: string;
}

export interface UploadResult {
  uploadedCount: number;
  reportedCount?: number;
  removedCount?: number;
  newTotalSessions: number;
  pointsEarned: number;
  xpEarned: number;
  wasFirstToday: boolean;
  dayNumber: number;
  dayDateKey: string;
  levelUp: LevelUpEvent | null;
  currentStreak: number;
  completedTasksCount: number;
  companionFeedback?: string;
  academicEvaluation?: AcademicEvaluation;
  timestamp: string;
}

export interface UploadSessionsPayload {
  count: number;
  subjectBreakdown?: Record<string, number>;
  notes?: string;
}

export interface PlayerState {
  name: string; // "RAMIN"
  level: number; // Starts at 1
  title: string; // e.g. "The Beginner"
  xp: number; // 1 session = 1 XP
  totalSessions: number;
  totalPoints: number;
  currentStreak: number;
  bestStreak: number;
  sessions: StudySession[];
  activityLogs: ActivityLog[];
  soundEnabled: boolean;
  activeSessionStartTime: string | null; // Background persistence!
  activeSessionSubject: string | null;
  simulationDateKey: string; // "2026-09-21"
  accountabilityStatus: AccountabilityStatus;
  academicDossier: AcademicTopicRecord[];
  evaluationHistory: AcademicEvaluation[];
}

export type ActiveScreen = 
  | 'home' 
  | 'tasks'
  | 'journey' 
  | 'achievements'
  | 'history' 
  | 'stats' 
  | 'profile'
  | 'ready' 
  | 'active_study';
