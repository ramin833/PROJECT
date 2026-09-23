import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { TaskCategory, GameTask } from '../types/game';
import { 
  CheckCircle2, 
  Circle, 
  Flame, 
  Zap, 
  Trophy, 
  Calendar, 
  Target, 
  Shield, 
  Crown, 
  ArrowLeft,
  Sparkles,
  Upload
} from 'lucide-react';

export const TasksScreen: React.FC = () => {
  const { tasks, dailyTasks, openUploadModal, setActiveScreen } = useGame();
  const [selectedCategory, setSelectedCategory] = useState<'all' | TaskCategory>('all');

  const filteredTasks = selectedCategory === 'all' 
    ? tasks 
    : tasks.filter(t => t.category === selectedCategory);

  const completedCount = tasks.filter(t => t.completed).length;
  const dailyCompletedCount = dailyTasks.filter(t => t.completed).length;

  const categories: { key: 'all' | TaskCategory; label: string; icon: string; count: number }[] = [
    { key: 'all', label: 'All Tasks', icon: '🎯', count: tasks.length },
    { key: 'daily', label: '☀️ Daily', icon: '☀️', count: tasks.filter(t => t.category === 'daily').length },
    { key: 'streak', label: '🔥 Streak', icon: '🔥', count: tasks.filter(t => t.category === 'streak').length },
    { key: 'milestones', label: '🎯 Milestones', icon: '🎯', count: tasks.filter(t => t.category === 'milestones').length },
    { key: 'special', label: '🏆 Special', icon: '🏆', count: tasks.filter(t => t.category === 'special').length },
  ];

  const getCategoryTheme = (category: TaskCategory) => {
    switch (category) {
      case 'daily':
        return {
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          progress: 'from-amber-500 to-yellow-400',
          border: 'border-amber-500/40',
        };
      case 'streak':
        return {
          badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
          progress: 'from-orange-500 to-red-500',
          border: 'border-orange-500/40',
        };
      case 'milestones':
        return {
          badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          progress: 'from-blue-500 to-indigo-500',
          border: 'border-blue-500/40',
        };
      case 'special':
        return {
          badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          progress: 'from-purple-500 to-pink-500',
          border: 'border-purple-500/40',
        };
    }
  };

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
              QUEST TASKS &amp; CHALLENGES
            </h1>
          </div>
          <p className="text-xs font-mono-stat text-neutral-400 mt-1">
            Complete daily habits, preserve streaks, and conquer long-term study milestones
          </p>
        </div>

        {/* Global Progress Indicator & Upload Quick Action */}
        <div className="flex items-center gap-3">
          <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-2xl">
            <div className="text-[10px] font-mono-stat text-neutral-500 uppercase">Tasks Completed</div>
            <div className="font-gamer font-bold text-base text-neutral-100">
              <span className="text-emerald-400">{completedCount}</span> / {tasks.length}
            </div>
          </div>

          <button
            onClick={openUploadModal}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-2xl font-gamer font-bold text-xs shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Daily Tasks Hero Banner */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">☀️</span>
              <h2 className="text-lg sm:text-xl font-gamer font-bold text-neutral-100 uppercase tracking-wide">
                Today's Daily Tasks
              </h2>
            </div>
            <p className="text-xs font-mono-stat text-neutral-400 mt-0.5">
              Reset every day with your study sessions. 1 Session = 1 Point = 1 XP.
            </p>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-xl font-mono-stat text-xs text-amber-400">
            {dailyCompletedCount} / {dailyTasks.length} Completed Today
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
          {dailyTasks.map((task, idx) => {
            const isDone = task.completed;
            return (
              <div 
                key={task.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isDone 
                    ? 'bg-neutral-950/80 border-emerald-500/50 shadow-sm shadow-emerald-500/10' 
                    : 'bg-neutral-950/40 border-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-mono-stat flex items-center justify-center text-neutral-400 font-bold">
                      {idx + 1}
                    </span>
                    <span className={`font-gamer font-bold text-sm ${isDone ? 'text-emerald-300' : 'text-neutral-200'}`}>
                      {task.title}
                    </span>
                  </div>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-neutral-600 shrink-0" />
                  )}
                </div>

                <p className="text-xs text-neutral-400 mb-3 line-clamp-1">
                  {task.description}
                </p>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono-stat text-neutral-400">
                    <span>Progress</span>
                    <span className={isDone ? 'text-emerald-400 font-bold' : 'text-neutral-300'}>
                      {task.currentProgress} / {task.requirement}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden border border-neutral-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDone ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, (task.currentProgress / task.requirement) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Reward text */}
                <div className="mt-3 pt-2 border-t border-neutral-900 flex items-center justify-between text-[10px] font-mono-stat text-neutral-500">
                  <span>Goal:</span>
                  <span className={isDone ? 'text-emerald-400 font-medium' : 'text-neutral-400'}>
                    {task.rewardText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.key;
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
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Task List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.map((task) => {
          const isDone = task.completed;
          const theme = getCategoryTheme(task.category);
          const percent = Math.min(100, Math.round((task.currentProgress / task.requirement) * 100));

          return (
            <div
              key={task.id}
              className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
                isDone 
                  ? 'bg-neutral-900/80 border-emerald-500/40 shadow-sm' 
                  : 'bg-neutral-900/40 hover:bg-neutral-900/70 border-neutral-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono-stat uppercase px-2 py-0.5 rounded-md border ${theme.badge}`}>
                      {task.category}
                    </span>
                    {isDone && (
                      <span className="text-[10px] font-mono-stat text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        COMPLETED
                      </span>
                    )}
                  </div>
                  <h3 className={`font-gamer font-bold text-base ${isDone ? 'text-emerald-300' : 'text-neutral-100'}`}>
                    {task.title}
                  </h3>
                </div>

                <div className="shrink-0 mt-1">
                  {isDone ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-500 font-mono-stat text-xs">
                      {percent}%
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-neutral-400 mb-4 font-sans">
                {task.description}
              </p>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono-stat">
                  <span className="text-neutral-400">Progress</span>
                  <span className={`font-bold ${isDone ? 'text-emerald-400' : 'text-neutral-200'}`}>
                    {task.currentProgress} / {task.requirement}
                  </span>
                </div>
                <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                      isDone ? 'from-emerald-500 to-teal-400' : theme.progress
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Reward info */}
              <div className="mt-3.5 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between text-xs font-mono-stat">
                <span className="text-neutral-500">Reward:</span>
                <span className={`font-medium ${isDone ? 'text-emerald-400' : 'text-neutral-300'}`}>
                  {task.rewardText}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rules Notice */}
      <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-4 text-center space-y-1">
        <p className="text-xs font-mono-stat text-neutral-400">
          ⭐ <strong className="text-neutral-200">Task Philosophy:</strong> Tasks do not grant bonus points. You always receive exactly 1 Session = 1 Point = 1 XP. Tasks challenge your discipline and celebrate consistency.
        </p>
      </div>

    </div>
  );
};
