import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { SubjectType } from '../types/game';
import { Play, ArrowLeft, BookOpen, Check, Sparkles } from 'lucide-react';

const STANDARD_SUBJECTS: SubjectType[] = [
  'Algorithms',
  'Database',
  'Complex Variable',
  'Programming',
  'Other',
];

export const ReadySessionScreen: React.FC = () => {
  const { beginActiveStudy, setActiveScreen, selectedSubject, setSelectedSubject } = useGame();
  const [customSubject, setCustomSubject] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const handleSelect = (subj: SubjectType) => {
    setIsCustom(false);
    setSelectedSubject(subj);
  };

  const handleStart = () => {
    const finalSubject = isCustom && customSubject.trim() ? customSubject.trim() : selectedSubject;
    beginActiveStudy(finalSubject);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[75vh]">
      
      {/* Top Back Navigation */}
      <div className="w-full flex justify-start mb-6">
        <button
          onClick={() => setActiveScreen('home')}
          className="inline-flex items-center gap-2 text-xs font-gamer text-neutral-400 hover:text-neutral-200 px-3 py-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </button>
      </div>

      {/* Main Card */}
      <div className="w-full bg-neutral-900/90 border-2 border-blue-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(59,130,246,0.15)] flex flex-col items-center text-center space-y-6">
        
        {/* Glowing Indicator Icon */}
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-md">
          <BookOpen className="w-8 h-8" />
        </div>

        {/* Section 6 Text */}
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-gamer font-extrabold text-neutral-100 tracking-wide">
            Ready?
          </h2>
          <p className="text-base text-neutral-200 font-medium">
            Sit down. Open your study material.
          </p>
          <p className="text-sm font-mono-stat text-neutral-400">
            Your only job right now is to begin.
          </p>
        </div>

        {/* Section 24: WHAT ARE YOU STUDYING? */}
        <div className="w-full text-left space-y-3 pt-3 border-t border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-gamer font-bold text-neutral-300 uppercase tracking-wider">
              WHAT ARE YOU STUDYING?
            </span>
            <span className="text-[11px] font-mono-stat text-neutral-500">
              Optional
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {STANDARD_SUBJECTS.map((subj) => {
              const isSelected = !isCustom && selectedSubject === subj;
              return (
                <button
                  key={subj}
                  onClick={() => handleSelect(subj)}
                  className={`px-3 py-2 rounded-xl text-xs font-gamer font-bold transition-all border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-600/30'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  <span>{subj}</span>
                </button>
              );
            })}
          </div>

          {/* Custom subject toggle */}
          {selectedSubject === 'Other' && (
            <div className="mt-2">
              <input
                type="text"
                placeholder="Enter subject name (e.g. Linear Algebra)"
                value={customSubject}
                onChange={(e) => {
                  setCustomSubject(e.target.value);
                  setIsCustom(true);
                }}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono-stat text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <p className="text-[11px] font-mono-stat text-neutral-500 italic">
            “Every subject gives exactly 1 Point + 1 XP per genuine session.”
          </p>
        </div>

        {/* Big START SESSION Button */}
        <div className="w-full pt-2">
          <button
            id="start-session-submit-btn"
            onClick={handleStart}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-gamer font-black text-lg tracking-wider shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>START SESSION</span>
          </button>
        </div>

      </div>

    </div>
  );
};
