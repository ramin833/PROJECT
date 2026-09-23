import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Swords } from 'lucide-react';

export const ResetToast: React.FC = () => {
  const { resetNotice, clearResetNotice } = useGame();

  useEffect(() => {
    if (resetNotice) {
      const timer = setTimeout(() => {
        clearResetNotice();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [resetNotice, clearResetNotice]);

  if (!resetNotice) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-none select-none">
      <div className="bg-neutral-900 border-2 border-amber-500/80 px-6 py-3.5 rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.3)] flex items-center gap-3 text-neutral-100">
        <Swords className="w-5 h-5 text-amber-400 shrink-0" />
        <span className="font-gamer font-black text-sm tracking-wider uppercase">
          {resetNotice}
        </span>
      </div>
    </div>
  );
};
