import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { CampaignDay } from '../types/game';
import { 
  Lock, 
  Star, 
  Check, 
  X, 
  Crown, 
  Flame, 
  ArrowLeft, 
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';

export const CampaignMap: React.FC = () => {
  const { campaignDays, player, setActiveScreen } = useGame();
  const [selectedDay, setSelectedDay] = useState<CampaignDay | null>(null);

  const completedCount = campaignDays.filter(d => d.sessionCount > 0).length;
  const missedCount = campaignDays.filter(d => d.status === 'missed').length;
  const progressPercent = Math.round((completedCount / 60) * 100);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8 select-none">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveScreen('home')}
              className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-gamer font-black text-neutral-100 tracking-wider">
              60-DAY JOURNEY
            </h1>
          </div>

          <p className="text-sm font-gamer text-neutral-400 mt-1">
            Your mission is simple: <strong className="text-blue-400">Don&apos;t create a Zero Day.</strong>
          </p>

          <div className="flex items-center gap-2 text-xs font-mono-stat text-neutral-400 mt-2">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <span>September 21, 2026 → November 19, 2026</span>
          </div>
        </div>

        {/* Quest Completion Progress Indicator */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 min-w-[240px] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono-stat">
            <span className="text-neutral-400 font-gamer font-bold">Journey Progress</span>
            <span className="text-neutral-200 font-bold">{completedCount} / 60 Days</span>
          </div>
          <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500 h-full transition-all duration-700" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono-stat text-neutral-500">
            <span>{progressPercent}% Complete</span>
            <span className="flex items-center gap-1 text-orange-400">
              <Flame className="w-3 h-3" /> Streak: {player.currentStreak}d
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-6 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-3.5 text-xs font-mono-stat">
        <span className="text-neutral-500 font-bold uppercase text-[10px]">LEGEND:</span>
        
        <div className="flex items-center gap-1.5 text-emerald-400">
          <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <Check className="w-3 h-3" />
          </div>
          <span>✓ Completed</span>
        </div>

        <div className="flex items-center gap-1.5 text-amber-400">
          <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <Star className="w-3 h-3 fill-current" />
          </div>
          <span>⭐ Today</span>
        </div>

        <div className="flex items-center gap-1.5 text-red-400">
          <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/40 flex items-center justify-center">
            <X className="w-3 h-3" />
          </div>
          <span>✕ Missed</span>
        </div>

        <div className="flex items-center gap-1.5 text-neutral-400">
          <div className="w-4 h-4 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center">
            <Lock className="w-3 h-3" />
          </div>
          <span>🔒 Locked</span>
        </div>
      </div>

      {/* 60-DAY INTERACTIVE MAP GRID */}
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2.5 sm:gap-3">
        {campaignDays.map((day) => {
          const isSelected = selectedDay?.dayNumber === day.dayNumber;
          const isDay60 = day.dayNumber === 60;

          // Node styling by status
          let nodeClasses = 'bg-neutral-950 border-neutral-800 text-neutral-400 opacity-60';
          let icon = <Lock className="w-4 h-4 text-neutral-400" />;

          if (day.status === 'completed') {
            nodeClasses = 'bg-emerald-950/40 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:border-emerald-400';
            icon = <Check className="w-4 h-4 stroke-[3]" />;
          } else if (day.status === 'today') {
            nodeClasses = 'bg-amber-950/40 border-amber-400 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.35)] animate-pulse ring-2 ring-amber-400/40';
            icon = <Star className="w-4 h-4 fill-current" />;
          } else if (day.status === 'missed') {
            nodeClasses = 'bg-red-950/30 border-red-500/50 text-red-400 opacity-80';
            icon = <X className="w-4 h-4 stroke-[2.5]" />;
          }

          if (isDay60) {
            nodeClasses += ' ring-2 ring-amber-400/60 bg-gradient-to-b from-amber-950/40 to-neutral-950';
          }

          return (
            <button
              key={day.dayNumber}
              onClick={() => setSelectedDay(day)}
              className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-1.5 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${nodeClasses} ${
                isSelected ? 'ring-2 ring-white shadow-xl scale-105' : ''
              }`}
            >
              {/* Day Number */}
              <div className="font-gamer font-black text-xs sm:text-sm">
                DAY {day.dayNumber}
              </div>

              {/* Status Icon */}
              <div className="my-1">
                {isDay60 && day.status === 'completed' ? (
                  <Crown className="w-4 h-4 text-amber-400 fill-current" />
                ) : (
                  icon
                )}
              </div>

              {/* Display Date */}
              <div className="text-[10px] font-mono-stat opacity-80 truncate max-w-full">
                {day.displayDate}
              </div>

              {/* Session count bubble if completed */}
              {day.sessionCount > 0 && (
                <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-neutral-950 font-gamer font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                  {day.sessionCount}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Detail Inspector Card */}
      {selectedDay && (
        <div className="bg-neutral-900 border-2 border-neutral-700 rounded-3xl p-5 sm:p-6 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-xl font-gamer font-black text-neutral-100">
                DAY {selectedDay.dayNumber}
              </span>
              <span className="text-xs font-mono-stat text-neutral-400">
                {selectedDay.displayDate}, 2026
              </span>
            </div>

            <button
              onClick={() => setSelectedDay(null)}
              className="text-xs font-gamer text-neutral-400 hover:text-neutral-200 px-2 py-1 rounded bg-neutral-800"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
              <span className="text-[10px] font-mono-stat text-neutral-500 uppercase">Status</span>
              <div className="font-gamer font-bold text-sm capitalize text-neutral-200 mt-0.5">
                {selectedDay.status}
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
              <span className="text-[10px] font-mono-stat text-neutral-500 uppercase">Sessions</span>
              <div className="font-gamer font-bold text-sm text-blue-400 mt-0.5">
                {selectedDay.sessionCount} Completed
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
              <span className="text-[10px] font-mono-stat text-neutral-500 uppercase">Points</span>
              <div className="font-gamer font-bold text-sm text-amber-400 mt-0.5">
                +{selectedDay.pointsEarned} Pts
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
              <span className="text-[10px] font-mono-stat text-neutral-500 uppercase">XP Gained</span>
              <div className="font-gamer font-bold text-sm text-purple-400 mt-0.5">
                +{selectedDay.xpEarned} XP
              </div>
            </div>
          </div>

          {selectedDay.status === 'missed' && (
            <p className="text-xs font-mono-stat text-red-400/90 italic">
              ✕ Zero day recorded. History is never deleted so you can clearly see where consistency paused and resume your streak.
            </p>
          )}

          {selectedDay.status === 'today' && selectedDay.sessionCount === 0 && (
            <p className="text-xs font-mono-stat text-amber-400 italic">
              ⭐ Today is active! Complete 1 study session to mark DAY {selectedDay.dayNumber} as completed.
            </p>
          )}
        </div>
      )}

      {/* Bottom Philosophy quote */}
      <div className="text-center py-4 border-t border-neutral-800/80">
        <p className="text-xs font-mono-stat text-neutral-400 italic">
          “You don&apos;t need a perfect day. You need a completed day. Show up every day. Don&apos;t create a Zero Day.”
        </p>
      </div>

    </div>
  );
};
