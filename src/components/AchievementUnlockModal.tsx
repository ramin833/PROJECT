import React from 'react';
import { useGame } from '../context/GameContext';
import { Trophy, Award, Sparkles, Check, ArrowRight } from 'lucide-react';

export const AchievementUnlockModal: React.FC = () => {
  const { newlyUnlockedAchievement, closeAchievementModal, setActiveScreen } = useGame();

  if (!newlyUnlockedAchievement) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-200 select-none">
      <div className="relative w-full max-w-md bg-neutral-900 border-2 border-amber-500/80 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(245,158,11,0.3)] text-center space-y-6">
        
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Section 20 Header: 🏆 ACHIEVEMENT UNLOCKED */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-amber-400 font-gamer font-bold text-xs uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
            <Trophy className="w-4 h-4 fill-current" />
            ACHIEVEMENT UNLOCKED
          </div>
        </div>

        {/* Big Badge Icon */}
        <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-500/60 flex items-center justify-center text-amber-400 mx-auto shadow-xl shadow-amber-500/20 animate-bounce">
          <Award className="w-10 h-10" />
        </div>

        {/* Title & Message */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-gamer font-black text-neutral-100 tracking-wider">
            {newlyUnlockedAchievement.title}
          </h2>

          <p className="text-sm font-gamer font-bold text-amber-300">
            You kept showing up.
          </p>

          <p className="text-xs font-mono-stat text-neutral-400 max-w-xs mx-auto">
            {newlyUnlockedAchievement.description}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={closeAchievementModal}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-gamer font-black text-base tracking-wider shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <span>AWESOME!</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              closeAchievementModal();
              setActiveScreen('achievements');
            }}
            className="w-full py-2.5 text-xs font-gamer text-neutral-400 hover:text-neutral-200"
          >
            View All Achievements
          </button>
        </div>

      </div>
    </div>
  );
};
