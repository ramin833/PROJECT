import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { StudySession } from '../types/game';
import { Clock, Calendar, BookOpen, Trophy, Zap, ArrowLeft, Search, Filter, ShieldCheck, BrainCircuit } from 'lucide-react';
import { formatDisplayDateLong } from '../utils/campaign';

export const SessionHistoryScreen: React.FC = () => {
  const { player, setActiveScreen, openInvestigator } = useGame();
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const formatTime = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  const filteredSessions = player.sessions.filter((s) => {
    const matchesSubject = filterSubject === 'all' || s.subject === filterSubject;
    const matchesSearch = searchQuery === '' || 
      s.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.topic && s.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.notes && s.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.dateKey.includes(searchQuery);
    return matchesSubject && matchesSearch;
  });

  // Group by dateKey
  const groupedByDate: Record<string, StudySession[]> = {};
  filteredSessions.forEach((s) => {
    if (!groupedByDate[s.dateKey]) {
      groupedByDate[s.dateKey] = [];
    }
    groupedByDate[s.dateKey].push(s);
  });

  const dates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-6 select-none">
      
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
              SESSION HISTORY
            </h1>
          </div>
          <p className="text-xs font-mono-stat text-neutral-400 mt-1">
            Detailed log of all {player.totalSessions} genuine study sessions completed
          </p>
        </div>

        {/* Quick summary pill */}
        <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-2xl text-xs font-mono-stat">
          <span className="text-neutral-400">Total Points:</span>
          <span className="font-gamer font-bold text-amber-400">+{player.totalPoints} Pts</span>
          <span>•</span>
          <span className="text-neutral-400">Total XP:</span>
          <span className="font-gamer font-bold text-purple-400">+{player.xp} XP</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by topic, subject or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono-stat text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-500" />
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-gamer text-neutral-300 focus:outline-none focus:border-neutral-600"
          >
            <option value="all">All Subjects</option>
            <option value="Algorithms">Algorithms</option>
            <option value="Database">Database</option>
            <option value="Complex Variable">Complex Variable</option>
            <option value="Programming">Programming</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Sessions List */}
      {dates.length === 0 ? (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-12 text-center space-y-4">
          <Clock className="w-10 h-10 text-neutral-600 mx-auto" />
          <h3 className="font-gamer font-bold text-lg text-neutral-300">
            No study sessions logged yet
          </h3>
          <p className="text-xs font-mono-stat text-neutral-500 max-w-sm mx-auto">
            Test your comprehension with the AI Study Investigator to record your first verified study block.
          </p>
          <button
            onClick={openInvestigator}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-gamer font-bold text-xs tracking-wider inline-flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>START STUDY INVESTIGATION</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {dates.map((dateKey) => {
            const daySessions = groupedByDate[dateKey];
            const dateTitle = formatDisplayDateLong(dateKey);

            return (
              <div key={dateKey} className="space-y-3">
                {/* Date header */}
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <h3 className="font-gamer font-bold text-sm text-neutral-200 uppercase tracking-wide">
                      {dateTitle}
                    </h3>
                  </div>
                  <span className="text-xs font-mono-stat text-neutral-400">
                    {daySessions.length} session{daySessions.length > 1 ? 's' : ''} • +{daySessions.length} Pts
                  </span>
                </div>

                {/* Session cards for this day */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {daySessions.map((sess) => {
                    const startFormatted = formatTime(sess.startTime);
                    const endFormatted = formatTime(sess.endTime);
                    const isVerified = sess.investigationStatus === 'VERIFIED' || sess.verificationResult === 'VERIFIED';

                    return (
                      <div 
                        key={sess.id}
                        className={`bg-neutral-900/80 border rounded-2xl p-4 space-y-2 hover:border-neutral-700 transition-colors ${
                          isVerified ? 'border-emerald-500/30' : 'border-neutral-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-gamer font-bold text-xs text-blue-400">
                            SESSION #{sess.sessionNumber}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isVerified && (
                              <span className="bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-gamer font-semibold text-emerald-300 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                <span>VERIFIED</span>
                              </span>
                            )}
                            <span className="bg-neutral-950 border border-neutral-800 px-2 py-0.5 rounded text-[10px] font-gamer text-neutral-300">
                              {sess.subject}
                            </span>
                          </div>
                        </div>

                        {sess.topic && (
                          <div className="text-xs font-gamer font-semibold text-neutral-200 flex items-center gap-1.5 truncate">
                            <BookOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span className="truncate">{sess.topic}</span>
                          </div>
                        )}

                        {sess.evidenceSummary && (
                          <p className="text-[11px] font-mono-stat text-neutral-400 bg-neutral-950/60 p-2 rounded-lg border border-neutral-800/80 line-clamp-2">
                            {sess.evidenceSummary}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs font-mono-stat text-neutral-300">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-neutral-500" />
                            <span>{startFormatted} → {endFormatted}</span>
                          </div>
                          <span className="text-neutral-400">
                            {sess.durationMinutes} minutes
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60 text-[11px] font-mono-stat">
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <Trophy className="w-3 h-3" /> +1 Point
                          </span>
                          <span className="text-purple-400 font-bold flex items-center gap-1">
                            <Zap className="w-3 h-3" /> +1 XP
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

