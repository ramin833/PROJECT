import React from 'react';
import { useGame } from '../context/GameContext';
import { PlayerAvatar } from './PlayerAvatar';
import { Zap, Sparkles, ArrowRight, Trophy } from 'lucide-react';
import { getLevelInfo } from '../utils/levels';

export const LevelUpModal: React.FC = () => {
  const { levelUpCelebration, closeLevelUpModal, player } = useGame();

  if (!levelUpCelebration) return null;

  const levelInfo = getLevelInfo(player.totalPoints);

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-200 select-none">
      <div className="relative w-full max-w-md bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 border-2 border-purple-500/80 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(168,85,247,0.35)] text-center space-y-6">
        
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Section 16 Header: 🎉 LEVEL UP! */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-purple-400 font-gamer font-bold text-sm uppercase tracking-widest bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full">
            <Sparkles className="w-4 h-4 fill-current" />
            LEVEL UP!
          </div>
        </div>

        {/* Avatar Visual Celebration */}
        <div className="flex justify-center my-2">
          <div className="relative animate-bounce">
            <PlayerAvatar level={levelUpCelebration} name={player.name} size="xl" />
            <Sparkles className="w-8 h-8 text-amber-400 absolute -top-2 -right-2 animate-spin duration-3000" />
          </div>
        </div>

        {/* Exact format:
            🎉 LEVEL UP!
            LEVEL 2
            THE STARTER
            10 POINTS REACHED */}
        <div className="space-y-2">
          <h2 className="text-4xl sm:text-5xl font-gamer font-black text-neutral-100 tracking-wider">
            LEVEL {levelUpCelebration}
          </h2>

          <div className="text-xl sm:text-2xl font-gamer font-black text-purple-300 tracking-wide uppercase">
            {levelInfo.title}
          </div>

          <div className="inline-block font-gamer font-bold text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl">
            {player.totalPoints} POINTS REACHED
          </div>

          <p className="text-xs font-mono-stat text-neutral-400 max-w-xs mx-auto pt-1">
            Every 10 points elevates your scholar tier. More genuine sessions → higher rank.
          </p>
        </div>

        {/* Continue Button */}
        <button
          onClick={closeLevelUpModal}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-gamer font-black text-base tracking-wider shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <span>CONTINUE QUEST</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};

