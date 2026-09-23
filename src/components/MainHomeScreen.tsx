import React from 'react';
import { useGame } from '../context/GameContext';
import { getLevelInfo } from '../utils/levels';
import { 
  Flame, 
  Trophy, 
  Zap, 
  CheckCircle2, 
  Circle, 
  XCircle, 
  ArrowRight, 
  Target, 
  Upload, 
  Play, 
  RotateCcw,
  Clock,
  Award,
  Lock,
  Sparkles,
  Search,
  BrainCircuit,
  ShieldCheck
} from 'lucide-react';

export const MainHomeScreen: React.FC = () => {
  const { 
    player, 
    todayCampaignDay, 
    todaySessions, 
    dailyTasks,
    achievements,
    openInvestigator,
    openResetModal,
    startStudyFlow, 
    setActiveScreen, 
    campaignDays 
  } = useGame();

  const isTodayComplete = todaySessions.length > 0;
  const completedDaysCount = campaignDays.filter(d => d.sessionCount > 0).length;
  const currentDayNum = todayCampaignDay?.dayNumber || 1;
  const levelInfo = getLevelInfo(player.totalPoints);

  const pointsToday = todaySessions.length;
  const xpToday = todaySessions.length;

  // Selected sample achievements for home screen preview (user highlighted streak, sessions, 60-day maker)
  const homeAchievements = achievements.filter(a => 
    ['7_day_streak', '100_sessions', '60_day_maker', 'first_step'].includes(a.id)
  );

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 md:py-8 flex flex-col gap-6 select-none">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER SECTION
             STUDYQUEST | RAMIN
             LEVEL X — TITLE
             X / Y POINTS
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-[11px] font-gamer font-black tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 rounded-full uppercase">
                StudyQuest
              </span>
              <span className="text-xs font-mono-stat text-neutral-400">
                1 Session = 1 Point = 1 XP
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-gamer font-black text-neutral-100 tracking-wider pt-1">
              {player.name}
            </h1>

            <div className="flex items-center justify-center sm:justify-start gap-2 text-sm font-gamer font-bold text-purple-400 pt-0.5">
              <span>LEVEL {levelInfo.level}</span>
              <span className="text-neutral-600">—</span>
              <span className="uppercase text-purple-300">{levelInfo.title}</span>
            </div>
          </div>

          {/* Points Progress */}
          <div className="sm:text-right space-y-1.5 flex flex-col items-center sm:items-end">
            <div className="text-sm font-gamer font-bold text-neutral-200">
              <span className="text-amber-400 text-lg font-black">{player.totalPoints}</span>
              <span className="text-neutral-500"> / </span>
              <span>{levelInfo.nextLevelPoints} POINTS</span>
            </div>

            <div className="w-56 bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-800">
              <div 
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-700" 
                style={{ width: `${levelInfo.percentage}%` }}
              />
            </div>

            <span className="text-[11px] font-mono-stat text-neutral-500">
              {levelInfo.pointsNeededForLevel - levelInfo.pointsInCurrentLevel} points to Level {levelInfo.level + 1}
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. TODAY & STREAK SECTION
             TODAY: SESSIONS | POINTS | XP
             🔥 CURRENT STREAK: X DAYS
          ───────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800 p-6 sm:p-7 shadow-lg space-y-5">
        
        {/* Top: Day # & Status */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
          <div>
            <div className="text-xs font-gamer font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-blue-400" />
              <span>TODAY • DAY {currentDayNum} / 60</span>
            </div>
            <p className="text-xs font-mono-stat text-neutral-400 mt-0.5">
              {todayCampaignDay?.displayDate || 'September 21, 2026'}
            </p>
          </div>

          {isTodayComplete ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-gamer font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>🔥 DAY {currentDayNum} COMPLETE</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 text-neutral-400 text-xs font-gamer font-bold">
              <Circle className="w-3.5 h-3.5 text-neutral-500" />
              <span>TODAY: NOT COMPLETED</span>
            </div>
          )}
        </div>

        {/* 3 Stats Grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
            <span className="text-3xl sm:text-4xl font-gamer font-black text-neutral-100 block">
              {todaySessions.length}
            </span>
            <span className="text-xs font-gamer font-bold text-neutral-400 uppercase mt-1 block">
              SESSIONS
            </span>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
            <span className="text-3xl sm:text-4xl font-gamer font-black text-amber-400 block">
              {pointsToday}
            </span>
            <span className="text-xs font-gamer font-bold text-neutral-400 uppercase mt-1 block">
              POINTS
            </span>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
            <span className="text-3xl sm:text-4xl font-gamer font-black text-purple-400 block">
              {xpToday}
            </span>
            <span className="text-xs font-gamer font-bold text-neutral-400 uppercase mt-1 block">
              XP
            </span>
          </div>
        </div>

        {/* Streak Bar Banner */}
        <div className="flex items-center justify-between bg-neutral-950 border border-neutral-800 rounded-2xl px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="text-[10px] font-mono-stat text-neutral-500 uppercase">Current Streak</div>
              <div className="text-xl font-gamer font-black text-orange-400">
                {player.currentStreak} DAYS
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-mono-stat text-neutral-500 uppercase">Best Streak</div>
            <div className="text-base font-gamer font-bold text-neutral-300">
              {player.bestStreak} Days
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN ACTION: 🔎 AI STUDY INVESTIGATOR
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-2">
        <button
          id="investigate-sessions-primary-btn"
          onClick={openInvestigator}
          className="w-full py-5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-gamer font-black text-lg sm:text-xl tracking-wider shadow-[0_0_40px_rgba(59,130,246,0.3)] flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          <Search className="w-6 h-6 stroke-[2.5] text-amber-300" />
          <span>START STUDY INVESTIGATION</span>
        </button>

        <p className="text-xs font-mono-stat text-neutral-400 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Strict Conceptual Verification • 1 Verified Session = 1 Point = 1 XP</span>
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. TODAY'S TASKS (DIRECT HOME SCREEN EMBED)
             ☑ Show Up             1 / 1
             ☑ Keep Going          3 / 3
             ☐ Push Yourself       3 / 5
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🎯</span>
            <h3 className="font-gamer font-bold text-sm text-neutral-100 uppercase tracking-wide">
              TODAY&apos;S TASKS
            </h3>
          </div>

          <button
            onClick={() => setActiveScreen('tasks')}
            className="text-xs font-gamer text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
          >
            <span>All Tasks ({dailyTasks.filter(t => t.completed).length}/{dailyTasks.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {dailyTasks.map((task) => {
            const isDone = task.completed;
            return (
              <div
                key={task.id}
                onClick={() => setActiveScreen('tasks')}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                  isDone
                    ? 'bg-neutral-950/80 border-emerald-500/40 hover:border-emerald-500/60'
                    : 'bg-neutral-950/40 border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isDone ? (
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-600 flex items-center justify-center">
                      <Circle className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div>
                    <div className={`font-gamer font-bold text-sm ${isDone ? 'text-emerald-300' : 'text-neutral-200'}`}>
                      {task.title}
                    </div>
                    <div className="text-[11px] font-mono-stat text-neutral-500">
                      {task.description}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-mono-stat text-xs font-bold ${isDone ? 'text-emerald-400' : 'text-neutral-400'}`}>
                    {task.currentProgress} / {task.requirement}
                  </div>
                  <div className="text-[10px] font-mono-stat text-neutral-500">
                    {task.rewardText}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. ACHIEVEMENTS PREVIEW
             🔥 7-Day Streak       🔒
             💯 100 Sessions       🔒
             👑 60-Day Maker       🔒
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🏅</span>
            <h3 className="font-gamer font-bold text-sm text-neutral-100 uppercase tracking-wide">
              ACHIEVEMENTS
            </h3>
          </div>

          <button
            onClick={() => setActiveScreen('achievements')}
            className="text-xs font-gamer text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
          >
            <span>View All ({achievements.filter(a => a.unlocked).length}/{achievements.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {homeAchievements.slice(0, 3).map((ach) => (
            <div
              key={ach.id}
              onClick={() => setActiveScreen('achievements')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                ach.unlocked
                  ? 'bg-neutral-950 border-amber-500/40 text-neutral-100'
                  : 'bg-neutral-950/40 border-neutral-800/80 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{ach.badgeEmoji || '🏅'}</span>
                <div>
                  <div className="font-gamer font-bold text-xs">
                    {ach.title}
                  </div>
                  <div className="text-[10px] font-mono-stat text-neutral-500">
                    {ach.requirement} {ach.type}
                  </div>
                </div>
              </div>

              <div>
                {ach.unlocked ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-neutral-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time timer fallback & Reset Button */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <button
          onClick={startStudyFlow}
          className="inline-flex items-center gap-1.5 text-xs font-mono-stat text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Launch live active study session timer</span>
        </button>

        <button
          onClick={openResetModal}
          className="inline-flex items-center gap-1.5 text-[11px] font-mono-stat text-neutral-600 hover:text-red-400 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset All Progress (Start Fresh)</span>
        </button>
      </div>

    </div>
  );
};
