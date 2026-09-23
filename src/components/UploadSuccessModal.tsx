import React from 'react';
import { useGame } from '../context/GameContext';
import { CheckCircle2, Flame, ArrowRight, Shield, Sparkles } from 'lucide-react';

export const UploadSuccessModal: React.FC = () => {
  const { uploadResult, closeUploadResult } = useGame();

  if (!uploadResult) return null;

  const reported = uploadResult.reportedCount ?? uploadResult.uploadedCount;
  const accepted = uploadResult.uploadedCount;
  const removed = uploadResult.removedCount ?? Math.max(0, reported - accepted);

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200 select-none">
      <div className="relative w-full max-w-md bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 border-2 border-emerald-500/80 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(16,185,129,0.3)] text-center space-y-6">
        
        {/* Glow halo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Status */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-emerald-400 font-gamer font-bold text-xs uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            HONEST RECORD LOGGED
          </div>
          <h2 className="text-xl font-gamer font-bold text-neutral-300 uppercase tracking-wider pt-2">
            DAY {uploadResult.dayNumber} OF 60
          </h2>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            THE REQUESTED ASCII BOX: TODAY'S RECORD
            Reported: X | Accepted: Y | Removed: Z
            +Y POINTS | +Y XP | 🔥 DAY COMPLETE
            ───────────────────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-neutral-950 border-2 border-neutral-800 p-5 space-y-4 font-mono-stat text-left shadow-inner">
          <div className="text-center border-b border-neutral-800 pb-2">
            <span className="font-gamer font-bold text-sm tracking-widest text-neutral-300 uppercase">
              TODAY&apos;S RECORD
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Reported:</span>
              <span className="font-bold text-neutral-200 font-gamer text-sm">{reported}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-emerald-400">Accepted:</span>
              <span className="font-bold text-emerald-400 font-gamer text-sm">{accepted}</span>
            </div>

            {removed > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-amber-400/90">Removed:</span>
                <span className="font-bold text-amber-400 font-gamer text-sm">{removed}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-neutral-800/80 space-y-2 text-center">
            <div className="font-gamer font-bold text-base text-amber-400">
              +{uploadResult.pointsEarned} POINTS • +{uploadResult.xpEarned} XP
            </div>

            {uploadResult.wasFirstToday && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 font-gamer font-bold text-xs">
                <Flame className="w-4 h-4 fill-current" />
                <span>DAY COMPLETE 🔥</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[11px] text-neutral-500">
            <span>Current Streak:</span>
            <span className="text-orange-400 font-bold">{uploadResult.currentStreak} Days</span>
          </div>

          {/* Academic Confidence in modal */}
          {uploadResult.academicEvaluation?.confidenceGrid && (
            <div className="pt-2 border-t border-neutral-800 space-y-1 text-[11px]">
              <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider text-left">Academic Confidence:</div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {uploadResult.academicEvaluation.confidenceGrid.map((cg, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300">
                    {cg.area}: <strong className={cg.evaluation === 'Strong' ? 'text-emerald-400' : cg.evaluation === 'Moderate' ? 'text-amber-400' : 'text-rose-400'}>{cg.evaluation}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Companion Feedback Quote */}
        {uploadResult.companionFeedback && (
          <div className="text-xs font-mono-stat text-neutral-400 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800 flex items-center gap-2 text-left">
            <Shield className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{uploadResult.companionFeedback}</span>
          </div>
        )}

        {/* Button to continue */}
        <button
          onClick={closeUploadResult}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-gamer font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <span>CONTINUE QUEST</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
