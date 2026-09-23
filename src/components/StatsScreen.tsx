import React from 'react';
import { useGame } from '../context/GameContext';
import { 
  BarChart2, 
  PieChart, 
  Flame, 
  Trophy, 
  Zap, 
  BookOpen, 
  ArrowLeft, 
  Calendar,
  CheckCircle2
} from 'lucide-react';

export const StatsScreen: React.FC = () => {
  const { player, campaignDays, setActiveScreen } = useGame();

  // Subject statistics
  const subjectCounts: Record<string, number> = {};
  player.sessions.forEach((s) => {
    subjectCounts[s.subject] = (subjectCounts[s.subject] || 0) + 1;
  });

  const sortedSubjects = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1]);
  const totalCompletedDays = campaignDays.filter(d => d.sessionCount > 0).length;
  const currentXpInLevel = player.xp % 10;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8 select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveScreen('home')}
              className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-gamer font-black text-neutral-100 tracking-wider">
              CAREER STATISTICS
            </h1>
          </div>
          <p className="text-xs font-mono-stat text-neutral-400 mt-1">
            Comprehensive breakdown of sessions, progression, streaks, and subject distribution
          </p>
        </div>

        {/* Player Level Badge */}
        <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-2xl flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-mono-stat text-neutral-500 uppercase">Current Tier</div>
            <div className="font-gamer font-bold text-sm text-neutral-100">Level {player.level} Scholar</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-gamer font-black text-lg">
            {player.level}
          </div>
        </div>
      </div>

      {/* 4 Core Pillars Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-mono-stat text-neutral-500 uppercase">TOTAL SESSIONS</span>
          <div className="text-3xl font-gamer font-black text-neutral-100">{player.totalSessions}</div>
          <span className="text-[11px] font-mono-stat text-blue-400">100% Genuine</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-mono-stat text-neutral-500 uppercase">LIFETIME POINTS</span>
          <div className="text-3xl font-gamer font-black text-amber-400">{player.totalPoints}</div>
          <span className="text-[11px] font-mono-stat text-neutral-500">1 Session = 1 Pt</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-mono-stat text-neutral-500 uppercase">CURRENT STREAK</span>
          <div className="text-3xl font-gamer font-black text-orange-400">{player.currentStreak} Days</div>
          <span className="text-[11px] font-mono-stat text-neutral-500">Best: {player.bestStreak} Days</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-mono-stat text-neutral-500 uppercase">CAMPAIGN PROGRESS</span>
          <div className="text-3xl font-gamer font-black text-emerald-400">{totalCompletedDays}/60</div>
          <span className="text-[11px] font-mono-stat text-neutral-500">{Math.round((totalCompletedDays / 60) * 100)}% Complete</span>
        </div>
      </div>

      {/* SECTION 25: STUDY SESSIONS BY SUBJECT */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <h3 className="font-gamer font-bold text-base text-neutral-100 uppercase tracking-wide">
              Study Sessions by Subject
            </h3>
          </div>
          <span className="text-xs font-mono-stat text-neutral-400">
            {sortedSubjects.length} unique subject{sortedSubjects.length > 1 ? 's' : ''}
          </span>
        </div>

        {sortedSubjects.length === 0 ? (
          <div className="text-center py-6 text-neutral-500 text-xs font-mono-stat">
            No subject sessions recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedSubjects.map(([subj, count]) => {
              const percent = player.totalSessions > 0 ? Math.round((count / player.totalSessions) * 100) : 0;
              return (
                <div key={subj} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono-stat">
                    <span className="font-gamer font-bold text-neutral-200">{subj}</span>
                    <span className="text-neutral-400">
                      <strong className="text-blue-400 font-gamer">{count}</strong> sessions ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[11px] font-mono-stat text-neutral-500 italic pt-2">
          “Every subject gives exactly 1 Point + 1 XP per genuine session. No subject is worth more points.”
        </p>
      </div>

      {/* XP & Level Progression System Detail */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
          <Zap className="w-4 h-4 text-purple-400" />
          <h3 className="font-gamer font-bold text-base text-neutral-100 uppercase tracking-wide">
            Level & Progression Tier
          </h3>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono-stat">
            <span className="text-neutral-300 font-gamer">Level {player.level} → Level {player.level + 1}</span>
            <span className="text-neutral-400">{currentXpInLevel} / 10 XP</span>
          </div>
          <div className="w-full bg-neutral-950 h-3 rounded-full overflow-hidden border border-neutral-800">
            <div 
              className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${(currentXpInLevel / 10) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono-stat text-neutral-500 pt-1">
            <span>Formula: 1 completed session = 1 XP. Every 10 XP = +1 Level.</span>
            <span>Total XP: {player.xp}</span>
          </div>
        </div>
      </div>

    </div>
  );
};
