import React from 'react';
import { useGame } from '../context/GameContext';
import { ActiveScreen } from '../types/game';
import { PlayerAvatar } from './PlayerAvatar';
import { getLevelInfo } from '../utils/levels';
import { 
  Home, 
  Map, 
  Clock, 
  BarChart2, 
  Award, 
  User, 
  Volume2, 
  VolumeX, 
  Flame, 
  Search,
  CheckSquare,
  Database
} from 'lucide-react';

export const HeaderHUD: React.FC = () => {
  const { 
    player, 
    activeScreen, 
    setActiveScreen, 
    toggleSound, 
    campaignDays, 
    dailyTasks,
    openInvestigator,
    isDatabaseSynced
  } = useGame();

  const completedDaysCount = campaignDays.filter(d => d.sessionCount > 0).length;
  const dailyCompletedCount = dailyTasks.filter(t => t.completed).length;
  const levelInfo = getLevelInfo(player.totalPoints);

  const navItems: { screen: ActiveScreen; label: string; icon: React.ReactNode; badge?: string }[] = [
    { screen: 'home', label: 'HOME', icon: <Home className="w-3.5 h-3.5" /> },
    { screen: 'tasks', label: 'TASKS', icon: <CheckSquare className="w-3.5 h-3.5" />, badge: `${dailyCompletedCount}/3` },
    { screen: 'journey', label: 'JOURNEY', icon: <Map className="w-3.5 h-3.5" />, badge: `${completedDaysCount}/60` },
    { screen: 'achievements', label: 'ACHIEVEMENTS', icon: <Award className="w-3.5 h-3.5" /> },
    { screen: 'history', label: 'HISTORY', icon: <Clock className="w-3.5 h-3.5" /> },
    { screen: 'profile', label: 'PROFILE', icon: <User className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80 px-3 sm:px-6 py-2.5 transition-all select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: StudyQuest Title + RAMIN + Level & Title */}
        <div 
          onClick={() => setActiveScreen('profile')} 
          className="flex items-center gap-3 cursor-pointer group p-1 -m-1 rounded-xl hover:bg-neutral-900/60 transition-colors"
          title="Open Player Profile"
        >
          <PlayerAvatar level={player.level} name={player.name} size="md" />

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-gamer font-extrabold text-neutral-100 tracking-wider text-base group-hover:text-blue-400 transition-colors">
                StudyQuest
              </span>
              <span className="text-[11px] font-gamer font-bold text-neutral-400 bg-neutral-900 border border-neutral-800 px-1.5 py-0.2 rounded">
                {player.name}
              </span>
              <span 
                className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono-stat px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 group-hover:border-neutral-700"
                title="Database: SQLite Engine Connected (ACID WAL Mode)"
              >
                <Database className={`w-2.5 h-2.5 ${isDatabaseSynced ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span className="text-[9px]">SQLITE</span>
              </span>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-gamer font-bold text-blue-400">
                L{levelInfo.level} • {levelInfo.title}
              </span>
              {/* XP bar within current level */}
              <div 
                className="w-16 bg-neutral-800 h-1.5 rounded-full overflow-hidden border border-neutral-700/50" 
                title={`${levelInfo.pointsInCurrentLevel} / ${levelInfo.pointsNeededForLevel} points to Level ${levelInfo.level + 1}`}
              >
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-400 h-full transition-all duration-500" 
                  style={{ width: `${levelInfo.percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center: Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-neutral-900/80 border border-neutral-800 p-1 rounded-xl">
          {navItems.map((item) => {
            const isActive = activeScreen === item.screen;
            return (
              <button
                key={item.screen}
                onClick={() => setActiveScreen(item.screen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-gamer font-bold tracking-wide transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] font-mono-stat px-1 py-0.2 rounded ${
                    isActive ? 'bg-blue-700/80 text-blue-100' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Quick Investigate + Streak Badge + Sound Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick AI Investigator Button in Header */}
          <button
            onClick={openInvestigator}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-gamer font-bold shadow-sm shadow-blue-600/30 transition-all active:scale-95 border border-blue-400/30"
            title="AI Study Investigator: Cross-examine & verify study comprehension"
          >
            <Search className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">INVESTIGATE</span>
          </button>

          {/* Quick Streak Badge */}
          <div 
            onClick={() => setActiveScreen('journey')}
            className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 px-2.5 py-1.5 rounded-xl text-xs font-mono-stat cursor-pointer hover:bg-orange-500/20 transition-colors" 
            title="Current Consecutive Days Streak"
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="font-bold text-orange-400">{player.currentStreak}</span>
            <span className="text-[10px] text-orange-400/80 hidden sm:inline">DAYS</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100 transition-colors"
            title={player.soundEnabled ? 'Mute Game Sound' : 'Enable Game Sound'}
          >
            {player.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-blue-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-neutral-600" />
            )}
          </button>
        </div>

      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex md:hidden items-center justify-around gap-1 pt-2 border-t border-neutral-800/60 mt-2 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = activeScreen === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => setActiveScreen(item.screen)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-gamer font-bold tracking-wide transition-all shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
