import React from 'react';
import { useGame } from '../context/GameContext';
import { Crown, Trophy, Zap, Flame, BookOpen, ArrowRight } from 'lucide-react';

export const QuestCompleteModal: React.FC = () => {
  const { showQuestCompleteModal, closeQuestCompleteModal, player } = useGame();

  if (!showQuestCompleteModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-lg flex items-center justify-center p-4 animate-in zoom-in-95 duration-300 select-none overflow-y-auto">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 border-2 border-amber-400 rounded-3xl p-6 sm:p-10 shadow-[0_0_100px_rgba(251,191,36,0.4)] text-center space-y-6 my-auto">
        
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Crown Icon */}
        <div className="w-24 h-24 rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 mx-auto shadow-2xl shadow-amber-500/30 animate-bounce">
          <Crown className="w-14 h-14 fill-current" />
        </div>

        {/* Section 28 Title */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-gamer font-black text-neutral-100 tracking-wider">
            👑 CONSISTENCY MAKER COMPLETE
          </h1>

          <div className="text-2xl font-gamer font-black text-amber-400">
            60 DAYS
          </div>

          <p className="text-lg font-gamer text-neutral-200">
            You showed up.
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-left space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono-stat text-neutral-400">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Total Sessions
            </div>
            <div className="text-2xl font-gamer font-black text-neutral-100">
              {player.totalSessions}
            </div>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-left space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono-stat text-neutral-400">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> Total Points
            </div>
            <div className="text-2xl font-gamer font-black text-amber-400">
              {player.totalPoints}
            </div>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-left space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono-stat text-neutral-400">
              <Flame className="w-3.5 h-3.5 text-orange-400" /> Best Streak
            </div>
            <div className="text-2xl font-gamer font-black text-orange-400">
              {player.bestStreak} Days
            </div>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-left space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono-stat text-neutral-400">
              <Zap className="w-3.5 h-3.5 text-purple-400" /> Total XP
            </div>
            <div className="text-2xl font-gamer font-black text-purple-400">
              {player.xp} XP
            </div>
          </div>
        </div>

        {/* Final Message */}
        <div className="bg-neutral-950/80 border border-amber-500/30 rounded-2xl p-4 space-y-1 text-sm font-mono-stat text-neutral-300">
          <p className="italic">“You didn&apos;t need perfect days.”</p>
          <p className="italic">“You kept coming back.”</p>
          <p className="font-gamer font-bold text-amber-400 mt-2">Quest Complete.</p>
        </div>

        {/* Button: CONTINUE PLAYING */}
        <button
          onClick={closeQuestCompleteModal}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-gamer font-black text-base tracking-wider shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 transition-all"
        >
          <span>CONTINUE PLAYING</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
