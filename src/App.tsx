/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { HeaderHUD } from './components/HeaderHUD';
import { MainHomeScreen } from './components/MainHomeScreen';
import { ReadySessionScreen } from './components/ReadySessionScreen';
import { ActiveStudySession } from './components/ActiveStudySession';
import { CampaignMap } from './components/CampaignMap';
import { SessionHistoryScreen } from './components/SessionHistoryScreen';
import { StatsScreen } from './components/StatsScreen';
import { AchievementsScreen } from './components/AchievementsScreen';
import { TasksScreen } from './components/TasksScreen';
import { PlayerProfile } from './components/PlayerProfile';
import { SessionCompleteModal } from './components/SessionCompleteModal';
import { LevelUpModal } from './components/LevelUpModal';
import { AchievementUnlockModal } from './components/AchievementUnlockModal';
import { QuestCompleteModal } from './components/QuestCompleteModal';
import { AIStudyInvestigatorModal } from './components/AIStudyInvestigatorModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { ResetToast } from './components/ResetToast';

const GameViewport: React.FC = () => {
  const { activeScreen, isInvestigatorOpen, closeInvestigator } = useGame();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Gamer HUD */}
      <HeaderHUD />

      {/* Main Screen Router */}
      <main className="flex-1 flex flex-col">
        {activeScreen === 'home' && <MainHomeScreen />}
        {activeScreen === 'tasks' && <TasksScreen />}
        {activeScreen === 'ready' && <ReadySessionScreen />}
        {activeScreen === 'active_study' && <ActiveStudySession />}
        {activeScreen === 'journey' && <CampaignMap />}
        {activeScreen === 'history' && <SessionHistoryScreen />}
        {activeScreen === 'stats' && <StatsScreen />}
        {activeScreen === 'achievements' && <AchievementsScreen />}
        {activeScreen === 'profile' && <PlayerProfile />}
      </main>

      {/* Persistent Global Modals & Celebrations */}
      <AIStudyInvestigatorModal isOpen={isInvestigatorOpen} onClose={closeInvestigator} />
      <ResetConfirmModal />
      <ResetToast />
      <SessionCompleteModal />
      <LevelUpModal />
      <AchievementUnlockModal />
      <QuestCompleteModal />

      {/* Subtle Game Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 px-4 py-3 text-center text-xs font-mono-stat text-neutral-500 select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            🎮 <strong className="text-neutral-200">StudyQuest</strong> • 1 Genuine Session = 1 Point = 1 XP
          </span>
          <span className="text-[11px] text-neutral-500">
            60-Day Consistency Maker: September 21, 2026 → November 19, 2026
          </span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <GameProvider>
      <GameViewport />
    </GameProvider>
  );
}
