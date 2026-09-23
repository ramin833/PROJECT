import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { 
  Flame, 
  CheckCircle2, 
  X, 
  Sparkles, 
  ShieldAlert, 
  HelpCircle,
  Clock
} from 'lucide-react';

export const ActiveStudySession: React.FC = () => {
  const { 
    activeSessionDuration, 
    completeStudySession, 
    cancelActiveSession, 
    selectedSubject,
    player 
  } = useGame();

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [farmingWarning, setFarmingWarning] = useState(false);

  // Format seconds to MM:SS or HH:MM:SS
  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (n: number) => String(n).padStart(2, '0');

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const handleCompleteClick = () => {
    // Prevent accidental point farming (under 10 seconds check)
    if (activeSessionDuration < 10) {
      setFarmingWarning(true);
      return;
    }
    completeStudySession();
  };

  const handleForceComplete = () => {
    setFarmingWarning(false);
    completeStudySession();
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center min-h-[80vh] select-none">
      
      {/* Background Persistence Notice */}
      <div className="mb-6 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-mono-stat flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-blue-400" />
        <span>Background persistence active: You can close the app anytime and return.</span>
      </div>

      {/* Main Container */}
      <div className="w-full bg-gradient-to-b from-neutral-900 to-neutral-950 border-2 border-orange-500/40 rounded-3xl p-6 sm:p-10 shadow-[0_0_60px_rgba(249,115,22,0.15)] flex flex-col items-center text-center space-y-8 relative overflow-hidden">
        
        {/* Subtle Ambient Pulse Light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section 7 Title */}
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 text-orange-400 font-gamer font-extrabold text-xl sm:text-2xl uppercase tracking-widest animate-pulse">
            <Flame className="w-6 h-6 fill-current text-orange-500" />
            <span>STUDY SESSION ACTIVE</span>
          </div>

          <div className="text-xs font-mono-stat text-neutral-400">
            Subject: <strong className="text-neutral-200">{player.activeSessionSubject || selectedSubject}</strong>
          </div>
        </div>

        {/* LARGE ANIMATED STUDY ORB */}
        <div className="relative z-10 flex items-center justify-center my-4">
          {/* Multi-layered pulsating orb */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full flex items-center justify-center">
            {/* Outermost breathing glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 opacity-30 blur-xl animate-pulse" />
            
            {/* Outer spinning ring */}
            <div className="absolute inset-2 rounded-full border-2 border-dashed border-orange-400/50 animate-[spin_20s_linear_infinite]" />
            
            {/* Inner core orb */}
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-tr from-neutral-950 via-neutral-900 to-neutral-950 border-2 border-orange-400/80 shadow-[inset_0_0_30px_rgba(249,115,22,0.4)] flex flex-col items-center justify-center">
              
              {/* Dynamic Timer: 00:00 */}
              <div className="text-4xl sm:text-5xl font-mono-stat font-black text-neutral-100 tracking-wider">
                {formatTimer(activeSessionDuration)}
              </div>

              <div className="text-[10px] font-mono-stat text-orange-400 font-bold uppercase tracking-widest mt-1">
                IN FOCUS
              </div>
            </div>
          </div>
        </div>

        {/* Section 7 Motivational Text */}
        <div className="space-y-1 relative z-10 max-w-sm">
          <p className="text-lg sm:text-xl font-gamer font-bold text-neutral-100">
            You are studying.
          </p>
          <p className="text-sm font-mono-stat text-neutral-400">
            Stay with the task.
          </p>
        </div>

        {/* Action Buttons: COMPLETE SESSION and CANCEL SESSION */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10 pt-2">
          <button
            id="complete-session-btn"
            onClick={handleCompleteClick}
            className="w-full sm:w-auto min-w-[220px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-gamer font-black text-base tracking-wider shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>COMPLETE SESSION</span>
          </button>

          <button
            onClick={() => setShowCancelConfirm(true)}
            className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200 font-gamer text-xs tracking-wider transition-colors"
          >
            CANCEL SESSION
          </button>
        </div>

        {/* Quick rule note */}
        <p className="text-[11px] font-mono-stat text-neutral-500">
          “The length of the session does not determine points. 1 genuine session = 1 Point + 1 XP.”
        </p>

      </div>

      {/* Point Farming Confirmation Modal */}
      {farmingWarning && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-amber-500/50 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-gamer font-bold text-neutral-100">
              Quick Session Check
            </h3>
            <p className="text-xs font-mono-stat text-neutral-400">
              You started just {activeSessionDuration}s ago. A session must represent a genuine attempt to study.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setFarmingWarning(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-gamer text-neutral-200"
              >
                Keep Studying
              </button>
              <button
                onClick={handleForceComplete}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-gamer font-bold text-white"
              >
                Complete Anyway (+1 Pt)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <h3 className="text-base font-gamer font-bold text-neutral-100">
              Discard this session?
            </h3>
            <p className="text-xs font-mono-stat text-neutral-400">
              No points or XP will be recorded for this session.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-gamer text-neutral-200"
              >
                Continue Studying
              </button>
              <button
                onClick={() => {
                  setShowCancelConfirm(false);
                  cancelActiveSession();
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-gamer font-bold text-white"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
