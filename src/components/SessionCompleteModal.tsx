import React from 'react';
import { useGame } from '../context/GameContext';
import { 
  Trophy, 
  Zap, 
  CheckCircle2, 
  Flame, 
  Sparkles, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const SessionCompleteModal: React.FC = () => {
  const { lastCompletionReward, closeRewardModal, player } = useGame();

  if (!lastCompletionReward) return null;

  const { session, isFirstToday } = lastCompletionReward;
  const currentLevel = player.level;
  const currentXp = player.xp;
  const xpInCurrentLevel = currentXp % 10;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      
      {/* Celebration Card */}
      <div className="relative w-full max-w-md bg-neutral-900 border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(16,185,129,0.25)] text-center space-y-6">
        
        {/* Glow Header Badge */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-lg animate-bounce">
            <Trophy className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-gamer font-black text-neutral-100 tracking-wider">
            🎉 SESSION COMPLETE!
          </h2>

          <p className="text-xs font-mono-stat text-neutral-400">
            {session.subject} • {session.durationMinutes} min genuine session
          </p>
        </div>

        {/* Reward Stat Pills: +1 POINT & +1 XP */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-neutral-950 border border-amber-500/40 rounded-2xl p-3.5 space-y-1 shadow-inner">
            <span className="text-[10px] font-mono-stat text-neutral-400 uppercase">REWARD</span>
            <div className="text-2xl font-gamer font-black text-amber-400">
              +1 POINT
            </div>
            <span className="text-[10px] font-mono-stat text-neutral-500">
              Total: {player.totalPoints} Points
            </span>
          </div>

          <div className="bg-neutral-950 border border-purple-500/40 rounded-2xl p-3.5 space-y-1 shadow-inner">
            <span className="text-[10px] font-mono-stat text-neutral-400 uppercase">EXPERIENCE</span>
            <div className="text-2xl font-gamer font-black text-purple-400">
              +1 XP
            </div>
            <span className="text-[10px] font-mono-stat text-neutral-500">
              Total: {player.xp} XP
            </span>
          </div>
        </div>

        {/* Section 8 & 12: Daily Status Logic */}
        {isFirstToday ? (
          <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-2xl p-4 text-left flex items-start gap-3">
            <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-emerald-400 font-gamer font-bold text-sm uppercase tracking-wide">
                🟢 DAY COMPLETE
              </div>
              <div className="text-xs font-mono-stat text-neutral-300 mt-0.5">
                FIRST DAY SAVED! Your 60-Day Journey has officially begun.
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-orange-950/30 border border-orange-500/40 rounded-2xl p-4 text-left flex items-start gap-3">
            <div className="p-1 rounded-lg bg-orange-500/20 text-orange-400 shrink-0 mt-0.5">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-orange-400 font-gamer font-bold text-sm uppercase tracking-wide">
                🔥 ANOTHER SESSION!
              </div>
              <div className="text-xs font-mono-stat text-neutral-300 mt-0.5">
                Bonus session logged! Extra point and XP added to your career.
              </div>
            </div>
          </div>
        )}

        {/* Level XP Bar */}
        <div className="space-y-1.5 text-left bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5">
          <div className="flex items-center justify-between text-xs font-mono-stat">
            <span className="font-gamer text-neutral-300">Level {currentLevel} Progression</span>
            <span className="text-neutral-400">{xpInCurrentLevel} / 10 XP</span>
          </div>
          <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full transition-all duration-700"
              style={{ width: `${(xpInCurrentLevel / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Continue Button */}
        <button
          id="claim-reward-btn"
          onClick={closeRewardModal}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-gamer font-black text-base tracking-wider shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <span>CONTINUE</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>

    </div>
  );
};
