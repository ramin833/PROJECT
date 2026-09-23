import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { AchievementCategory } from '../types/game';
import { Award, Lock, CheckCircle2, ArrowLeft, Trophy, Sparkles, Crown } from 'lucide-react';

export const AchievementsScreen: React.FC = () => {
  const { achievements, player, campaignDays, setActiveScreen } = useGame();
  const [selectedCategory, setSelectedCategory] = useState<'all' | AchievementCategory>('all');

  const completedDaysCount = campaignDays.filter(d => d.sessionCount > 0).length;
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const categories: { key: 'all' | AchievementCategory; label: string; icon: string }[] = [
    { key: 'all', label: 'All Badges', icon: '🏅' },
    { key: 'starting', label: '🌱 Starting', icon: '🌱' },
    { key: 'sessions', label: '⚡ Sessions', icon: '⚡' },
    { key: 'streak', label: '🔥 Streak', icon: '🔥' },
    { key: 'journey', label: '📅 Journey', icon: '📅' },
  ];

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

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
              ACHIEVEMENT BADGES
            </h1>
          </div>
          <p className="text-xs font-mono-stat text-neutral-400 mt-1">
            Separate from level ranks. Badges commemorate specific consistency milestones and feats.
          </p>
        </div>

        {/* Counter Badge */}
        <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-2xl flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="font-gamer font-bold text-sm text-neutral-100">
            {unlockedCount} / {achievements.length} Unlocked
          </span>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.key;
          const count = cat.key === 'all' 
            ? achievements.length 
            : achievements.filter(a => a.category === cat.key).length;

          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-4 py-2 rounded-xl text-xs font-gamer font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                isActive
                  ? 'bg-neutral-100 text-neutral-900 border-neutral-100 shadow-md'
                  : 'bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 border-neutral-800'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                isActive ? 'bg-neutral-900 text-neutral-100' : 'bg-neutral-950 text-neutral-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid of achievements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredAchievements.map((ach) => {
          let currentProgress = 0;
          if (ach.type === 'sessions') currentProgress = player.totalSessions;
          if (ach.type === 'streak') currentProgress = player.currentStreak;
          if (ach.type === 'days') currentProgress = completedDaysCount;

          const percent = Math.min(100, Math.round((currentProgress / ach.requirement) * 100));
          const isLegendary = ach.id === '60_day_maker';

          return (
            <div
              key={ach.id}
              className={`rounded-3xl p-5 border-2 transition-all flex flex-col justify-between gap-4 relative overflow-hidden ${
                ach.unlocked
                  ? isLegendary
                    ? 'bg-gradient-to-br from-amber-950/40 via-neutral-900 to-neutral-900 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50'
                    : 'bg-neutral-900/90 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.12)]'
                  : isLegendary
                    ? 'bg-neutral-950 border-amber-500/20'
                    : 'bg-neutral-950/80 border-neutral-800/80 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  {/* Badge Emoji / Icon Display */}
                  <div
                    className={`w-13 h-13 rounded-2xl flex items-center justify-center font-gamer font-bold shrink-0 border text-2xl transition-transform ${
                      ach.unlocked
                        ? isLegendary
                          ? 'bg-gradient-to-br from-amber-500/30 to-yellow-500/20 border-amber-400 shadow-lg scale-105'
                          : 'bg-amber-500/20 border-amber-500/40 shadow-md'
                        : 'bg-neutral-900/80 border-neutral-800 text-neutral-600 grayscale'
                    }`}
                  >
                    {ach.unlocked ? (
                      <span>{ach.badgeEmoji || '🏅'}</span>
                    ) : (
                      <div className="relative flex items-center justify-center">
                        <span className="opacity-30">{ach.badgeEmoji || '🏅'}</span>
                        <Lock className="w-4 h-4 absolute text-neutral-500" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-gamer font-bold text-base ${
                        ach.unlocked ? (isLegendary ? 'text-amber-300' : 'text-neutral-100') : 'text-neutral-300'
                      }`}>
                        {ach.title}
                      </h3>
                      {isLegendary && (
                        <span className="text-[10px] font-mono-stat px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-bold">
                          Legendary
                        </span>
                      )}
                      {ach.unlocked && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs font-mono-stat text-neutral-400 mt-1">
                      {ach.description}
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono-stat text-neutral-500 uppercase shrink-0 pt-1">
                  {ach.category}
                </div>
              </div>

              {/* Progress Bar or Unlocked Timestamp */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-800/60 text-xs font-mono-stat">
                {ach.unlocked ? (
                  <div className="flex items-center justify-between text-emerald-400 text-[11px]">
                    <span className="flex items-center gap-1 font-bold">
                      <Sparkles className="w-3.5 h-3.5" /> BADGE CLAIMED
                    </span>
                    <span className="text-neutral-500">
                      {ach.unlockedAt ? new Date(ach.unlockedAt).toLocaleDateString() : 'Unlocked'}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                      <span>Progress</span>
                      <span>
                        {currentProgress} / {ach.requirement} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden border border-neutral-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isLegendary ? 'bg-amber-500' : 'bg-neutral-600'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
