import React from 'react';
import { useGame } from '../context/GameContext';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';

export const ResetConfirmModal: React.FC = () => {
  const { isResetModalOpen, closeResetModal, resetToFreshStart } = useGame();

  if (!isResetModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200 select-none">
      <div className="relative w-full max-w-md bg-neutral-900 border-2 border-red-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(239,68,68,0.25)] space-y-6">
        
        {/* Close icon */}
        <button
          onClick={closeResetModal}
          className="absolute top-5 right-5 text-neutral-500 hover:text-neutral-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon */}
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-gamer font-black text-neutral-100 tracking-wider">
            RESET ALL PROGRESS?
          </h2>
          <p className="text-xs font-mono-stat text-neutral-400 leading-relaxed">
            This will permanently erase your sessions, points, XP, levels, streaks, achievements, statistics, and 60-Day Journey.
          </p>
        </div>

        {/* What you return to */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-center space-y-1 text-xs font-mono-stat">
          <div className="text-neutral-500 uppercase text-[10px]">You will return to:</div>
          <div className="font-gamer font-bold text-sm text-neutral-200">
            RAMIN — LEVEL 1 — THE BEGINNER
          </div>
          <div className="text-neutral-400">
            0 Sessions · 0 Points · 0 XP
          </div>
          <div className="text-red-400/80 font-bold">
            Day 1 / 60 — Not Completed
          </div>
        </div>

        {/* Buttons: CANCEL | RESET EVERYTHING */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={closeResetModal}
            className="py-3.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-gamer font-bold text-xs uppercase tracking-wider transition-colors"
          >
            CANCEL
          </button>
          
          <button
            onClick={resetToFreshStart}
            className="py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-gamer font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all active:scale-95"
          >
            RESET EVERYTHING
          </button>
        </div>

      </div>
    </div>
  );
};
