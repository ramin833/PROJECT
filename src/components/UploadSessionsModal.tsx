import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { getLevelInfo } from '../utils/levels';
import { 
  sendCompanionMessage, 
  CompanionMessage, 
  CompanionResponse,
  CompanionJudgmentData
} from '../services/companionService';
import { AcademicEvaluation, AcademicRoleType } from '../types/game';
import { 
  X, 
  Send, 
  Sparkles, 
  Flame, 
  Shield, 
  ShieldCheck,
  BookOpen,
  CheckCircle2, 
  AlertCircle, 
  RotateCcw,
  Sliders,
  MessageSquare,
  ArrowRight,
  Bot,
  Brain,
  GraduationCap
} from 'lucide-react';

export const UploadSessionsModal: React.FC = () => {
  const { 
    isUploadModalOpen, 
    closeUploadModal, 
    uploadSessions, 
    player, 
    todayCampaignDay 
  } = useGame();

  // Mode: 'conversational' (The Honest Companion) or 'manual' (classic quick counter)
  const [mode, setMode] = useState<'conversational' | 'manual'>('conversational');

  // Conversational state
  const [messages, setMessages] = useState<CompanionMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [activeRole, setActiveRole] = useState<AcademicRoleType>('Accountability Partner');
  const [activeEmotion, setActiveEmotion] = useState<{ text: string; emoji: string }>({
    text: 'Curious',
    emoji: '🤔',
  });
  const [judgmentState, setJudgmentState] = useState<CompanionJudgmentData | null>(null);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [finalDecisionMade, setFinalDecisionMade] = useState(false);
  const [confirmedAcceptedCount, setConfirmedAcceptedCount] = useState<number>(0);
  const [confirmedReportedCount, setConfirmedReportedCount] = useState<number>(0);

  // Manual fallback state
  const [manualCount, setManualCount] = useState(5);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const dayNumber = todayCampaignDay?.dayNumber || 1;
  const displayDate = todayCampaignDay?.displayDate || 'September 21, 2026';

  // Initialize companion conversation on open
  useEffect(() => {
    if (isUploadModalOpen) {
      setMessages([
        {
          id: 'initial-ai-msg',
          role: 'ai',
          content: `Hey ${player.name}. Before we add today's study to your record, tell me honestly — how did today go?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          emotion: 'honest',
          emotionEmoji: '🛡️',
        }
      ]);
      setSuggestedReplies([
        'I studied 6 times today',
        'I studied 5 times today',
        '3 sessions today on Algorithms',
        'Just 1 quick session today',
      ]);
      setActiveEmotion({ text: 'Honest', emoji: '🛡️' });
      setJudgmentState(null);
      setFinalDecisionMade(false);
      setConfirmedAcceptedCount(0);
      setConfirmedReportedCount(0);
      setInputText('');
    }
  }, [isUploadModalOpen, player.name]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  if (!isUploadModalOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isAiThinking) return;

    setInputText('');

    const userMsg: CompanionMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsAiThinking(true);
    setSuggestedReplies([]);

    try {
      const response: CompanionResponse = await sendCompanionMessage(
        newHistory.map(m => ({ role: m.role, content: m.content })),
        {
          name: player.name,
          dayNumber,
          currentStreak: player.currentStreak,
          displayDate,
          totalSessions: player.totalSessions,
        }
      );

      if (response.activeRole) {
        setActiveRole(response.activeRole);
      }

      setActiveEmotion({
        text: response.emotion.charAt(0).toUpperCase() + response.emotion.slice(1),
        emoji: response.emotionEmoji || '🤖',
      });

      const aiMsg: CompanionMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        activeRole: response.activeRole,
        emotion: response.emotion,
        emotionEmoji: response.emotionEmoji,
        suggestedReplies: response.suggestedReplies,
        isJudgment: response.isReadyForJudgment,
        judgmentData: response.judgment,
      };

      setMessages(prev => [...prev, aiMsg]);

      if (response.judgment) {
        setJudgmentState(response.judgment);
        setConfirmedReportedCount(response.judgment.reportedCount);
        setConfirmedAcceptedCount(response.judgment.acceptedCount);
      }

      if (response.isFinalClosing && response.judgment) {
        setFinalDecisionMade(true);
      }

      if (response.suggestedReplies && response.suggestedReplies.length > 0) {
        setSuggestedReplies(response.suggestedReplies);
      }
    } catch (err) {
      console.error('Error during companion conversation:', err);
    } finally {
      setIsAiThinking(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleDecisionSelection = async (choice: 'leave_out' | 'count_all') => {
    if (!judgmentState) return;

    if (choice === 'leave_out') {
      const accepted = judgmentState.acceptedCount;
      const reported = judgmentState.reportedCount;
      setConfirmedAcceptedCount(accepted);
      setConfirmedReportedCount(reported);
      await handleSendMessage('Leave it out.');
    } else {
      const reported = judgmentState.reportedCount;
      setConfirmedAcceptedCount(reported);
      setConfirmedReportedCount(reported);
      await handleSendMessage('Count all sessions.');
    }
  };

  const handleFinalSubmit = () => {
    const countToSubmit = confirmedAcceptedCount > 0 ? confirmedAcceptedCount : (judgmentState?.acceptedCount || 1);
    const reported = confirmedReportedCount > 0 ? confirmedReportedCount : (judgmentState?.reportedCount || countToSubmit);
    const removed = Math.max(0, reported - countToSubmit);

    const academicEvaluation: AcademicEvaluation = {
      id: `eval-${Date.now()}`,
      dayNumber,
      dateKey: todayCampaignDay?.dateKey || player.simulationDateKey,
      timestamp: new Date().toISOString(),
      reportedCount: reported,
      acceptedCount: countToSubmit,
      questionableCount: removed,
      confidenceGrid: judgmentState?.confidenceGrid || [
        { area: 'Algorithms', evaluation: 'Strong', notes: 'Core algorithm concepts verified' },
        { area: 'Study Focus', evaluation: removed > 0 ? 'Moderate' : 'Strong', notes: removed > 0 ? 'Attention leaks identified' : 'Continuous focus maintained' },
      ],
      studyAttention: judgmentState?.studyAttention || (removed > 0 ? 'Mixed' : 'High'),
      sessionHonesty: judgmentState?.sessionHonesty || 'Good',
      accountabilityStatus: judgmentState?.accountabilityStatus || player.accountabilityStatus || 'standard',
      summaryTutorNotes: judgmentState?.reason || `${countToSubmit} genuine sessions accepted after academic verification.`,
      activeRole: activeRole || 'Accountability Partner',
    };

    uploadSessions(
      countToSubmit,
      undefined,
      `Verified via StudyQuest Evaluation Tutor`,
      {
        reportedCount: reported,
        removedCount: removed,
        companionFeedback: `Tutor evaluated ${reported} reported, verified ${countToSubmit} genuine sessions.`,
        academicEvaluation,
      }
    );
    closeUploadModal();
  };

  const handleManualSubmit = () => {
    uploadSessions(manualCount, undefined, 'Manual Quick Upload', {
      reportedCount: manualCount,
      removedCount: 0,
    });
    closeUploadModal();
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border-2 border-neutral-700 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* ─────────────────────────────────────────────────────────────
            HEADER: STUDYQUEST AI — THE HONEST COMPANION
            ───────────────────────────────────────────────────────────── */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 border border-blue-400/40 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-gamer font-bold text-base sm:text-lg text-neutral-100 tracking-wide flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-purple-400" />
                  STUDYQUEST AGI
                </h2>
                {/* Active Autonomous Academic Role Badge */}
                <span className="inline-flex items-center gap-1 text-[11px] font-mono-stat px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 font-semibold shadow-xs">
                  <span>🎯</span>
                  <span>{activeRole}</span>
                </span>
                {/* Live Emotion Badge */}
                <span className="inline-flex items-center gap-1 text-[11px] font-mono-stat px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300">
                  <span>{activeEmotion.emoji}</span>
                  <span className="capitalize">{activeEmotion.text}</span>
                </span>
              </div>
              <p className="text-[11px] font-mono-stat text-neutral-400">
                Day {dayNumber} of 60 • Autonomous Academic Intelligence &amp; Accountability Partner
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode switch */}
            <button
              onClick={() => setMode(mode === 'conversational' ? 'manual' : 'conversational')}
              className="p-1.5 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors text-xs font-gamer flex items-center gap-1"
              title={mode === 'conversational' ? 'Switch to manual counter' : 'Switch to companion chat'}
            >
              {mode === 'conversational' ? <Sliders className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
            </button>

            <button
              onClick={closeUploadModal}
              className="p-1.5 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            BODY CONTENT: CONVERSATIONAL OR MANUAL
            ───────────────────────────────────────────────────────────── */}
        {mode === 'conversational' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Messages Chat Area */}
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
              {messages.map((msg) => {
                const isAi = msg.role === 'ai';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAi ? 'items-start' : 'items-end'} gap-1`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-mono-stat text-neutral-500 px-1">
                      {isAi ? (
                        <>
                          <Shield className="w-3 h-3 text-blue-400" />
                          <span className="font-bold text-neutral-400">StudyQuest AI</span>
                          {msg.activeRole && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/30 text-purple-300 font-bold uppercase tracking-wider">
                              {msg.activeRole}
                            </span>
                          )}
                          {msg.emotionEmoji && <span>{msg.emotionEmoji}</span>}
                        </>
                      ) : (
                        <span className="font-bold text-neutral-400">{player.name}</span>
                      )}
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                        isAi
                          ? 'bg-neutral-950 border border-neutral-800 text-neutral-200 shadow-sm'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-md'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* If AI message is Judgment proposal and not yet confirmed */}
                      {msg.isJudgment && msg.judgmentData && !finalDecisionMade && (
                        <div className="mt-4 pt-3 border-t border-neutral-800/80 space-y-3">
                          {/* Academic & Credibility Evaluation Card */}
                          <div className="bg-neutral-900/90 rounded-2xl p-3.5 border border-neutral-800 text-xs font-mono-stat space-y-2.5">
                            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                              <span className="font-gamer font-bold text-neutral-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                                <span>Today&apos;s Academic Evaluation</span>
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                                Day {dayNumber}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center py-1">
                              <div className="bg-neutral-950 p-2 rounded-xl border border-neutral-800">
                                <div className="text-neutral-500 text-[10px]">Reported</div>
                                <div className="text-neutral-200 font-bold text-sm">{msg.judgmentData.reportedCount}</div>
                              </div>
                              <div className="bg-neutral-950 p-2 rounded-xl border border-neutral-800">
                                <div className="text-emerald-400 text-[10px]">Supported</div>
                                <div className="text-emerald-400 font-bold text-sm">{msg.judgmentData.acceptedCount}</div>
                              </div>
                              <div className="bg-neutral-950 p-2 rounded-xl border border-neutral-800">
                                <div className="text-amber-400 text-[10px]">Questionable</div>
                                <div className="text-amber-400 font-bold text-sm">{msg.judgmentData.questionableCount}</div>
                              </div>
                            </div>

                            {/* Academic Confidence Breakdown */}
                            {msg.judgmentData.confidenceGrid && msg.judgmentData.confidenceGrid.length > 0 && (
                              <div className="pt-2 border-t border-neutral-800/80 space-y-1.5">
                                <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                                  Academic Confidence Assessment:
                                </div>
                                <div className="space-y-1">
                                  {msg.judgmentData.confidenceGrid.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between text-[11px] bg-neutral-950/70 px-2.5 py-1.5 rounded-lg border border-neutral-800/50">
                                      <span className="text-neutral-300 font-medium">{item.area}</span>
                                      <div className="flex items-center gap-2">
                                        {item.notes && <span className="text-[10px] text-neutral-500 hidden sm:inline">{item.notes}</span>}
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          item.evaluation === 'Strong'
                                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                                            : item.evaluation === 'Moderate'
                                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                                            : 'bg-rose-950/80 text-rose-400 border border-rose-800/40'
                                        }`}>
                                          {item.evaluation}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Study Attention & Honesty Badges */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {msg.judgmentData.studyAttention && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-800/80 text-neutral-300 border border-neutral-700">
                                  Study Attention: <strong className="text-neutral-100">{msg.judgmentData.studyAttention}</strong>
                                </span>
                              )}
                              {msg.judgmentData.sessionHonesty && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-800/80 text-neutral-300 border border-neutral-700">
                                  Session Honesty: <strong className="text-emerald-300">{msg.judgmentData.sessionHonesty}</strong>
                                </span>
                              )}
                            </div>

                            {msg.judgmentData.reason && (
                              <div className="text-[11px] text-neutral-400 pt-1.5 border-t border-neutral-800/80 leading-snug">
                                💡 <span className="text-neutral-300">{msg.judgmentData.reason}</span>
                              </div>
                            )}
                          </div>

                          {/* Decision Buttons with Student Authority */}
                          <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            {msg.judgmentData.questionableCount > 0 ? (
                              <>
                                <button
                                  onClick={() => handleDecisionSelection('leave_out')}
                                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-gamer font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.01] active:scale-[0.99]"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Leave It Out (Record {msg.judgmentData.acceptedCount})</span>
                                </button>
                                <button
                                  onClick={() => handleDecisionSelection('count_all')}
                                  className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-gamer font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.99]"
                                >
                                  <span>Count It Anyway ({msg.judgmentData.reportedCount})</span>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleDecisionSelection('count_all')}
                                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-gamer font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 hover:scale-[1.01]"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Record All {msg.judgmentData.acceptedCount} Sessions</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* AI Thinking Animation */}
              {isAiThinking && (
                <div className="flex items-center gap-2 text-xs font-mono-stat text-neutral-400 p-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 animate-spin">
                    <Sparkles className="w-3 h-3" />
                  </div>
                  <span>Companion is thinking about your answer... 🤔</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* If Final Decision is Made: Show Grand Lock-In Button */}
            {finalDecisionMade ? (
              <div className="p-4 sm:p-5 bg-neutral-950 border-t border-neutral-800 space-y-3">
                <div className="rounded-2xl bg-neutral-900 border border-emerald-500/50 p-4 font-mono-stat text-xs space-y-2">
                  <div className="flex items-center justify-between text-neutral-300 font-gamer font-bold text-sm">
                    <span>TODAY&apos;S VERIFIED RECORD</span>
                    <span className="text-emerald-400">Day {dayNumber} Complete 🔥</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="bg-neutral-950 p-2 rounded-xl border border-neutral-800">
                      <div className="text-neutral-500 text-[10px]">Reported</div>
                      <div className="text-neutral-200 font-bold">{confirmedReportedCount}</div>
                    </div>
                    <div className="bg-neutral-950 p-2 rounded-xl border border-neutral-800">
                      <div className="text-emerald-400 text-[10px]">Accepted</div>
                      <div className="text-emerald-400 font-bold">{confirmedAcceptedCount}</div>
                    </div>
                    <div className="bg-neutral-950 p-2 rounded-xl border border-neutral-800">
                      <div className="text-amber-400 text-[10px]">Points &amp; XP</div>
                      <div className="text-amber-400 font-bold">+{confirmedAcceptedCount}</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleFinalSubmit}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-gamer font-black text-base uppercase tracking-wider shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  <Flame className="w-5 h-5 fill-current" />
                  <span>RECORD {confirmedAcceptedCount} SESSIONS TO STUDYQUEST</span>
                </button>
              </div>
            ) : (
              /* Input & Suggested Chips Bar */
              <div className="p-3 sm:p-4 bg-neutral-950 border-t border-neutral-800 space-y-2.5">
                
                {/* Suggested quick reply chips */}
                {suggestedReplies.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {suggestedReplies.map((replyText, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(replyText)}
                        disabled={isAiThinking}
                        className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono-stat text-neutral-300 whitespace-nowrap transition-colors active:scale-95 disabled:opacity-50"
                      >
                        {replyText}
                      </button>
                    ))}
                  </div>
                )}

                {/* Text input form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Tell the companion about your study sessions today..."
                    disabled={isAiThinking}
                    className="flex-1 bg-neutral-900 border border-neutral-800 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none transition-colors"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() || isAiThinking}
                    className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 text-white disabled:text-neutral-600 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

          </div>
        ) : (
          /* Manual Quick Counter Fallback Mode */
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <h3 className="font-gamer font-bold text-xl text-neutral-100">
                Manual Session Entry
              </h3>
              <p className="text-xs font-mono-stat text-neutral-400">
                Quick entry without companion discussion. 1 Session = 1 Point = 1 XP.
              </p>
            </div>

            <div className="flex items-center justify-center gap-6 py-4">
              <button
                onClick={() => setManualCount(prev => Math.max(1, prev - 1))}
                className="w-12 h-12 rounded-2xl bg-neutral-950 border border-neutral-800 hover:bg-neutral-800 text-xl font-gamer font-bold text-neutral-300 transition-colors flex items-center justify-center"
              >
                -
              </button>

              <div className="text-center">
                <span className="text-5xl font-gamer font-black text-neutral-100 block">
                  {manualCount}
                </span>
                <span className="text-xs font-gamer font-bold text-amber-400 uppercase mt-1 block">
                  {manualCount} Points • {manualCount} XP
                </span>
              </div>

              <button
                onClick={() => setManualCount(prev => Math.min(50, prev + 1))}
                className="w-12 h-12 rounded-2xl bg-neutral-950 border border-neutral-800 hover:bg-neutral-800 text-xl font-gamer font-bold text-neutral-300 transition-colors flex items-center justify-center"
              >
                +
              </button>
            </div>

            <button
              onClick={handleManualSubmit}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-gamer font-black text-base uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all"
            >
              Upload {manualCount} Sessions Directly
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
