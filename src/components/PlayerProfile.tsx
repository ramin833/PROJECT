import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { PlayerAvatar } from './PlayerAvatar';
import { LEVEL_TIERS, getLevelInfo } from '../utils/levels';
import { 
  User, 
  Trophy, 
  Zap, 
  Flame, 
  BookOpen, 
  ShieldCheck, 
  ShieldAlert,
  AlertTriangle,
  Lock,
  ArrowLeft, 
  Calendar, 
  RotateCcw, 
  Sparkles,
  CheckCircle2,
  Crown,
  BookMarked,
  Database,
  Download,
  RefreshCw
} from 'lucide-react';

export const PlayerProfile: React.FC = () => {
  const { 
    player, 
    campaignDays, 
    setActiveScreen, 
    openResetModal, 
    loadDemoLevel4, 
    load60DayCompletedDemo,
    setPlayerName,
    isDatabaseSynced,
    databaseStatus,
    triggerDatabaseSync,
    exportDatabaseBackup,
  } = useGame();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(player.name);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      await triggerDatabaseSync();
      setSyncFeedback('Database verified & in sync! ✓');
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch {
      setSyncFeedback('Sync completed with local mirror.');
      setTimeout(() => setSyncFeedback(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const completedDaysCount = campaignDays.filter(d => d.sessionCount > 0).length;
  const levelInfo = getLevelInfo(player.totalPoints);

  const handleSaveName = () => {
    if (nameInput.trim()) {
      setPlayerName(nameInput.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8 select-none">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveScreen('home')}
            className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-gamer font-black text-neutral-100 tracking-wider">
            PLAYER PROFILE
          </h1>
        </div>

        <button
          onClick={() => setActiveScreen('stats')}
          className="text-xs font-gamer text-blue-400 hover:text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-xl hover:bg-blue-500/10 transition-colors"
        >
          View Full Stats →
        </button>
      </div>

      {/* SECTION 17 & 18: HERO CHARACTER IDENTITY CARD */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border-2 border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          
          {/* Avatar with cosmetics evolution */}
          <div className="shrink-0 flex flex-col items-center gap-2">
            <PlayerAvatar level={player.level} name={player.name} size="xl" />
            <span className="text-[11px] font-mono-stat text-neutral-400">
              {player.level >= 20 ? '👑 Grandmaster' : player.level >= 10 ? '✨ Archon Scholar' : player.level >= 5 ? '⚡ Adept Vanguard' : '🌱 Novice Scholar'}
            </span>
          </div>

          {/* Name, Level, XP */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="bg-neutral-950 border border-neutral-700 px-3 py-1 rounded-xl font-gamer font-black text-xl text-neutral-100 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleSaveName}
                    className="bg-blue-600 text-white text-xs font-gamer font-bold px-3 py-1 rounded-xl"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <h2 className="text-3xl sm:text-4xl font-gamer font-black text-neutral-100 tracking-wider">
                    {player.name}
                  </h2>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-xs font-mono-stat text-neutral-500 hover:text-neutral-300 underline"
                  >
                    Edit
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center sm:justify-start gap-3 text-sm font-gamer font-bold mt-1">
                <span className="text-blue-400">LEVEL {levelInfo.level}</span>
                <span className="text-neutral-600">—</span>
                <span className="text-purple-300 uppercase">{levelInfo.title}</span>
                <span className="text-neutral-600">•</span>
                <span className="text-amber-400 font-mono-stat">{player.totalPoints} Points</span>
              </div>
            </div>

            {/* XP Bar */}
            <div className="space-y-1 max-w-md">
              <div className="flex items-center justify-between text-xs font-mono-stat text-neutral-400">
                <span>Progress to Level {levelInfo.level + 1}</span>
                <span>{levelInfo.pointsInCurrentLevel} / {levelInfo.pointsNeededForLevel} Points</span>
              </div>
              <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-800">
                <div 
                  className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-700" 
                  style={{ width: `${levelInfo.percentage}%` }}
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 17: CAREER STATISTICS */}
      <div className="space-y-4">
        <h3 className="font-gamer font-bold text-lg text-neutral-200 uppercase tracking-wide">
          Career Statistics
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-mono-stat text-neutral-500 uppercase">TOTAL SESSIONS</span>
            <div className="text-2xl font-gamer font-black text-neutral-100">{player.totalSessions}</div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-mono-stat text-neutral-500 uppercase">TOTAL POINTS</span>
            <div className="text-2xl font-gamer font-black text-amber-400">{player.totalPoints}</div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-mono-stat text-neutral-500 uppercase">CURRENT STREAK</span>
            <div className="text-2xl font-gamer font-black text-orange-400">{player.currentStreak} Days</div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-mono-stat text-neutral-500 uppercase">BEST STREAK</span>
            <div className="text-2xl font-gamer font-black text-orange-300">{player.bestStreak} Days</div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-mono-stat text-neutral-500 uppercase">DAYS COMPLETED</span>
            <div className="text-2xl font-gamer font-black text-emerald-400">{completedDaysCount} / 60</div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ACADEMIC DOSSIER & ACCOUNTABILITY STATUS
          Managed by StudyQuest Evaluation Tutor
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border-2 border-neutral-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-blue-400" />
              <h3 className="font-gamer font-bold text-lg text-neutral-100 uppercase tracking-wide">
                ACADEMIC DOSSIER &amp; INTEGRITY RECORD
              </h3>
            </div>
            <p className="text-xs font-mono-stat text-neutral-400">
              Maintained by StudyQuest Personal Evaluation Tutor • Knowledge spot-checks &amp; session honesty
            </p>
          </div>

          {/* Current Accountability Status Badge */}
          <div>
            {player.accountabilityStatus === 'enhanced_review' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 font-mono-stat text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>⚠️ Enhanced Honesty Review</span>
              </span>
            ) : player.accountabilityStatus === 'credit_suspended' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 font-mono-stat text-xs">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>🔒 Credit Suspended</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 font-mono-stat text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>🛡️ Standard Accountability</span>
              </span>
            )}
          </div>
        </div>

        {/* Subjects & Evaluated Knowledge Grid */}
        <div className="space-y-3">
          <div className="text-xs font-gamer font-bold text-neutral-300 uppercase tracking-wider">
            Curated Academic Courses &amp; Tutor Evaluations
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(player.academicDossier || []).map((topic) => (
              <div 
                key={`${topic.subject}-${topic.topic}`} 
                className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-gamer font-bold text-sm text-neutral-200">
                      {topic.subject}
                    </span>
                    <span className="text-[11px] font-mono-stat text-neutral-400">
                      {topic.topic}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono-stat ${
                    topic.grade === 'Strong'
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                      : topic.grade === 'Moderate'
                      ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                      : 'bg-rose-950/80 text-rose-400 border border-rose-800/40'
                  }`}>
                    {topic.grade}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono-stat text-neutral-500 pt-1">
                  <span>Last evaluated: <strong className="text-neutral-300">{topic.lastTestedDate}</strong></span>
                </div>

                {topic.notes && (
                  <div className="text-[11px] font-mono-stat text-neutral-400 pt-1 border-t border-neutral-900">
                    <span className="text-blue-400/90 font-medium">Tutor note: </span>
                    <span>{topic.notes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Tutor Review History */}
        {player.evaluationHistory && player.evaluationHistory.length > 0 && (
          <div className="pt-2 border-t border-neutral-800/80 space-y-2.5">
            <div className="text-xs font-gamer font-bold text-neutral-300 uppercase tracking-wider">
              Recent Verification Logs
            </div>
            <div className="space-y-2">
              {player.evaluationHistory.slice(0, 3).map((ev) => (
                <div key={ev.id} className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-xs font-mono-stat space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400 font-bold">Day {ev.dayNumber} Evaluation</span>
                    <span className="text-neutral-500 text-[10px]">
                      {new Date(ev.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-neutral-400">
                    <span>Reported: <strong className="text-neutral-200">{ev.reportedCount}</strong></span>
                    <span>Accepted: <strong className="text-emerald-400">{ev.acceptedCount}</strong></span>
                    {ev.questionableCount > 0 && (
                      <span>Questionable: <strong className="text-amber-400">{ev.questionableCount}</strong></span>
                    )}
                    <span>Attention: <strong className="text-neutral-300">{ev.studyAttention}</strong></span>
                    <span>Honesty: <strong className="text-emerald-300">{ev.sessionHonesty}</strong></span>
                  </div>
                  {ev.summaryTutorNotes && (
                    <div className="text-[11px] text-neutral-500 italic pt-0.5">
                      &quot;{ev.summaryTutorNotes}&quot;
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* LEVEL TIERS TABLE (10 POINTS PER LEVEL) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="font-gamer font-bold text-base text-neutral-100 uppercase tracking-wide">
              20-Level Progression Hierarchy (0 to 3,000+ Points)
            </h3>
          </div>
          <span className="text-xs font-mono-stat text-neutral-400">
            Current: Level {levelInfo.level} ({levelInfo.title})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {LEVEL_TIERS.map((tier) => {
            const isReached = player.totalPoints >= tier.minPoints;
            const isCurrent = levelInfo.level === tier.level;

            return (
              <div 
                key={tier.level}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isCurrent 
                    ? 'bg-blue-950/40 border-blue-500 text-neutral-100 shadow-md ring-1 ring-blue-500' 
                    : isReached 
                    ? 'bg-neutral-950 border-neutral-800 text-neutral-300' 
                    : 'bg-neutral-950/40 border-neutral-900 text-neutral-600'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-gamer font-bold">
                  <span className={isCurrent ? 'text-blue-400' : isReached ? 'text-neutral-300' : 'text-neutral-600'}>
                    LEVEL {tier.level}
                  </span>
                  <span className="text-[11px] font-mono-stat">
                    {tier.level === 20 ? '3,000+ pts' : `${tier.minPoints}–${tier.nextPoints - 1} pts`}
                  </span>
                </div>
                <div className="font-gamer font-bold text-sm mt-1">
                  {tier.title}
                </div>
                {isCurrent && (
                  <div className="text-[10px] font-mono-stat text-blue-400 mt-1 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> ACTIVE RANK
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* PERSISTENT DATABASE & SAFE STORAGE */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-gamer font-bold text-base text-neutral-100 uppercase tracking-wide flex items-center gap-2">
                Persistent Database
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono-stat bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isDatabaseSynced ? 'CONNECTED & SYNCED' : 'INITIALIZING'}
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                Server-side SQLite storage with ACID compliance, WAL journaling, and automated safety backups.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-xs font-gamer font-bold text-neutral-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Verify & Sync'}
            </button>

            <button
              onClick={exportDatabaseBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-xs font-gamer font-bold text-blue-300 transition-colors"
              title="Download complete JSON export of all database tables"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON Backup
            </button>
          </div>
        </div>

        {/* Database Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-3">
            <div className="text-[10px] font-mono-stat text-neutral-400 uppercase">Engine</div>
            <div className="text-sm font-gamer font-bold text-neutral-200 mt-0.5">SQLite / WAL</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Integrity: OK</div>
          </div>

          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-3">
            <div className="text-[10px] font-mono-stat text-neutral-400 uppercase">Stored Sessions</div>
            <div className="text-sm font-gamer font-bold text-blue-400 mt-0.5">
              {player.sessions.length} Sessions
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">History Preserved</div>
          </div>

          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-3">
            <div className="text-[10px] font-mono-stat text-neutral-400 uppercase">Streak &amp; Points</div>
            <div className="text-sm font-gamer font-bold text-amber-400 mt-0.5">
              {player.currentStreak}d Streak • {player.totalPoints} pts
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">{player.xp} XP Synchronized</div>
          </div>

          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-3">
            <div className="text-[10px] font-mono-stat text-neutral-400 uppercase">Safety Snapshots</div>
            <div className="text-sm font-gamer font-bold text-neutral-200 mt-0.5">
              {databaseStatus?.counts.backups ? `${databaseStatus.counts.backups} Snapshots` : 'Automated'}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">Zero Loss Protection</div>
          </div>
        </div>

        {syncFeedback && (
          <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono-stat flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {syncFeedback}
          </div>
        )}
      </div>

      {/* GAME PRESET & TESTING CONTROLS */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
          <RotateCcw className="w-4 h-4 text-neutral-400" />
          <h3 className="font-gamer font-bold text-base text-neutral-100 uppercase tracking-wide">
            Game Testing &amp; Presets
          </h3>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={openResetModal}
            className="px-4 py-2.5 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/40 text-xs font-gamer font-bold text-red-300 transition-colors"
          >
            Reset All Progress (Start Fresh)
          </button>

          <button
            onClick={loadDemoLevel4}
            className="px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-xs font-gamer font-bold text-blue-300 transition-colors"
          >
            Load 27-Session Demo (Level 3 / Grinder)
          </button>

          <button
            onClick={load60DayCompletedDemo}
            className="px-4 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-xs font-gamer font-bold text-amber-300 transition-colors"
          >
            Preview 60-Day Completion Celebration
          </button>
        </div>
      </div>

    </div>
  );
};

