import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Send, 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  BookOpen, 
  BrainCircuit, 
  Clock, 
  Award, 
  RefreshCw,
  Search,
  MessageSquare
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { SubjectType, InvestigationStatus, InvestigationVerdict, InvestigatorChatMessage } from '../types/game';
import { databaseService } from '../services/databaseService';

interface AIStudyInvestigatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_TOPICS = [
  { topic: 'Binary Search', subject: 'Algorithms' as SubjectType },
  { topic: 'Merge Sort', subject: 'Algorithms' as SubjectType },
  { topic: 'B+ Tree Indexing', subject: 'Database' as SubjectType },
  { topic: 'Database Normalization (3NF vs BCNF)', subject: 'Database' as SubjectType },
  { topic: 'Cauchy-Riemann Equations', subject: 'Complex Variable' as SubjectType },
];

export const AIStudyInvestigatorModal: React.FC<AIStudyInvestigatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { player, recordInvestigatorVerifiedSession } = useGame();
  
  const [messages, setMessages] = useState<InvestigatorChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<SubjectType>('Algorithms');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<InvestigationStatus>('inquiring');
  const [verdict, setVerdict] = useState<InvestigationVerdict>('PENDING');
  const [stageLabel, setStageLabel] = useState<string>('🔎 INVESTIGATING');
  const [confidenceScore, setConfidenceScore] = useState<number>(0);
  const [verifiedSessionData, setVerifiedSessionData] = useState<any>(null);
  const [claimedTopic, setClaimedTopic] = useState<string>('');
  const [hasAutomaticallySaved, setHasAutomaticallySaved] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize or reset session when opened
  useEffect(() => {
    if (isOpen) {
      startNewInvestigation();
    }
  }, [isOpen]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const startNewInvestigation = () => {
    const welcomeMsg: InvestigatorChatMessage = {
      id: `inv-welcome-${Date.now()}`,
      role: 'investigator',
      content: `I am the **AI Study Investigator**.\n\nMy role is to verify whether you genuinely studied and comprehended the material you claim to have worked on today.\n\n**Core Principle:** I do not reward claims or study timers. I reward **evidence of genuine engagement and understanding**.\n\n• I adapt dynamically to your answers across recall, reasoning, and application\n• I investigate missing details, edge cases, and trade-offs\n• Plain explanations in your own words are valued over memorized textbook soundbites\n\n**What exact concept, problem, or mechanism did you study today?**`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stageLabel: '🔎 INVESTIGATING',
      stageBadge: 'inspect',
    };

    setMessages([welcomeMsg]);
    setInputMessage('');
    setIsProcessing(false);
    setCurrentStatus('inquiring');
    setVerdict('PENDING');
    setStageLabel('🔎 INVESTIGATING');
    setConfidenceScore(0);
    setVerifiedSessionData(null);
    setClaimedTopic('');
    setHasAutomaticallySaved(false);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText !== undefined ? customText : inputMessage).trim();
    if (!textToSend || isProcessing) return;

    const userMsg: InvestigatorChatMessage = {
      id: `student-${Date.now()}`,
      role: 'student',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsProcessing(true);

    // If first student message, treat as topic
    let topicToClaim = claimedTopic;
    if (!topicToClaim) {
      topicToClaim = textToSend.slice(0, 50);
      setClaimedTopic(topicToClaim);
    }

    try {
      // Build conversation payload for the server
      const chatHistory = updatedMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await databaseService.investigateTurn({
        studentName: player.name || 'RAMIN',
        claimedTopic: topicToClaim,
        subject: selectedSubject,
        conversationHistory: chatHistory,
        questionCount: updatedMessages.filter(m => m.role === 'investigator').length,
        academicDossier: player.academicDossier || [],
      });

      const isChallenge = res.stage === 'challenge' || (res.stageLabel && res.stageLabel.includes('CHALLENGE'));
      const isTransfer = res.stageLabel && (res.stageLabel.includes('TRANSFER') || res.stageLabel.includes('TEST'));
      const investigatorMsg: InvestigatorChatMessage = {
        id: `inv-${Date.now()}`,
        role: 'investigator',
        content: res.investigatorMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        stageLabel: res.stageLabel,
        stageBadge: 
          res.verdict === 'VERIFIED' ? 'verified' :
          res.verdict === 'REJECTED' ? 'rejected' :
          isTransfer ? 'transfer' :
          isChallenge ? 'challenge' :
          res.investigationStatus === 'more_evidence_needed' ? 'evidence_needed' : 'question',
      };

      setMessages(prev => [...prev, investigatorMsg]);
      setCurrentStatus(res.investigationStatus);
      setVerdict(res.verdict);
      setStageLabel(res.stageLabel);
      setConfidenceScore(res.confidenceScore || 50);

      // Handle Automatic Session Record on VERIFIED
      if (res.verdict === 'VERIFIED' && !hasAutomaticallySaved) {
        setHasAutomaticallySaved(true);
        const autoTopic = res.evidenceEvaluation?.topic || topicToClaim || 'Verified Study Topic';
        const autoSubject = (res.evidenceEvaluation?.subject as SubjectType) || selectedSubject;

        // Collect student answers as evidence
        const studentAnswers = updatedMessages
          .filter(m => m.role === 'student')
          .map(m => m.content);

        const saveResult = await recordInvestigatorVerifiedSession({
          topic: autoTopic,
          subject: autoSubject,
          durationMinutes: res.verifiedSession?.durationMinutes || 25,
          evidenceSummary: res.evidenceEvaluation?.evidenceSummary || 'Demonstrated genuine conceptual understanding of topic under cross-examination.',
          questionsAsked: updatedMessages.filter(m => m.role === 'investigator').length,
          relevantAnswers: studentAnswers,
        });

        setVerifiedSessionData({
          ...res.verifiedSession,
          session: saveResult.session,
          didLevelUp: saveResult.didLevelUp,
          wasFirstToday: saveResult.wasFirstToday,
        });
      }
    } catch (err: any) {
      console.error('Error during investigation turn:', err);
      const fallbackMsg: InvestigatorChatMessage = {
        id: `inv-err-${Date.now()}`,
        role: 'investigator',
        content: `I received your answer. However, I need you to explain in clear detail: **Why does this mechanism operate this way, and what fundamental constraint prevents it from failing?**`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        stageLabel: '🧠 FOLLOW-UP QUESTION',
        stageBadge: 'question',
      };
      setMessages(prev => [...prev, fallbackMsg]);
      setCurrentStatus('investigating');
      setStageLabel('🧠 FOLLOW-UP QUESTION');
    } finally {
      setIsProcessing(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      id="ai-investigator-modal" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-3xl h-[92vh] max-h-[780px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">AI Study Investigator</h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Strict Accountability
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cross-examining conceptual understanding • Automatic verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={startNewInvestigation}
              title="Reset current investigation"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Topic</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Status Bar */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Status:</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold ${
              verdict === 'VERIFIED'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : verdict === 'REJECTED'
                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                : stageLabel.includes('TRANSFER')
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : stageLabel.includes('CHALLENGE')
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse'
                : currentStatus === 'more_evidence_needed'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}>
              {stageLabel}
            </span>
          </div>

          {claimedTopic && (
            <div className="flex items-center gap-1.5 text-slate-300">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[200px]">{claimedTopic}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 hidden sm:inline flex items-center gap-1">
              <BrainCircuit className="w-3.5 h-3.5 text-blue-400" />
              Adaptive Inquiry Active
            </span>
            {confidenceScore > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Evidence Depth:</span>
                <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/50">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      confidenceScore >= 85 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                      confidenceScore >= 60 ? 'bg-blue-500' : 
                      confidenceScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${confidenceScore}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat History Panel */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => {
            const isInvestigator = msg.role === 'investigator';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isInvestigator ? 'justify-start' : 'justify-end'}`}
              >
                {isInvestigator && (
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex-shrink-0 flex items-center justify-center text-amber-300 mt-1">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  isInvestigator
                    ? 'bg-slate-800/90 border border-slate-700 text-slate-100'
                    : 'bg-blue-600 text-white border border-blue-500'
                }`}>
                  {isInvestigator && msg.stageLabel && (
                    <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-700/60 text-[11px] font-semibold">
                      <span className={`inline-flex items-center gap-1 ${
                        msg.stageBadge === 'verified' ? 'text-emerald-400 font-bold' :
                        msg.stageBadge === 'rejected' ? 'text-red-400 font-bold' :
                        msg.stageBadge === 'transfer' ? 'text-cyan-300 font-bold' :
                        msg.stageBadge === 'challenge' ? 'text-purple-300 font-bold' :
                        msg.stageBadge === 'evidence_needed' ? 'text-amber-400 font-semibold' : 'text-blue-400'
                      }`}>
                        {msg.stageLabel}
                      </span>
                      <span className="text-slate-500 ml-auto font-mono text-[10px]">{msg.timestamp}</span>
                    </div>
                  )}

                  <div className="whitespace-pre-line text-slate-200">
                    {msg.content}
                  </div>

                  {!isInvestigator && (
                    <div className="mt-1 text-right text-[10px] text-blue-200/80 font-mono">
                      {msg.timestamp}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isProcessing && (
            <div className="flex gap-3 justify-start items-center text-slate-400 text-xs py-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex-shrink-0 flex items-center justify-center text-amber-300">
                <Search className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Investigating evidence and checking conceptual mechanics...</span>
              </div>
            </div>
          )}

          {/* Automatic Verification Success Card */}
          {verdict === 'VERIFIED' && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Session Automatically Verified & Persisted to Database</span>
              </div>
              <p className="text-xs text-slate-300">
                The AI Study Investigator detected clear conceptual evidence. This session has been saved directly to your permanent history with full audit details.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Points / XP Awarded</span>
                  <span className="font-bold text-emerald-400">+1 Point • +1 XP</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Topic Verified</span>
                  <span className="font-medium text-slate-200 truncate block">{claimedTopic || 'Academic Study'}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block text-[10px]">Streak Status</span>
                  <span className="font-bold text-amber-300">Active 🔥</span>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}

          {/* Rejection notice card */}
          {verdict === 'REJECTED' && (
            <div className="mt-4 p-4 rounded-xl bg-red-950/30 border border-red-500/30 flex flex-col gap-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-red-400 font-semibold text-xs">
                <AlertCircle className="w-4 h-4" />
                <span>No Session Recorded • Study Material Not Evidenced</span>
              </div>
              <p className="text-xs text-slate-300">
                The session was not recorded into the database because genuine understanding could not be verified. Review your notes and try again when you are prepared to explain how the concept works.
              </p>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={startNewInvestigation}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try Another Topic
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills (Only shown initially to help prompt topics) */}
        {messages.length === 1 && (
          <div className="px-5 py-2 bg-slate-950/40 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
              Quick test topics:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_TOPICS.map((item) => (
                <button
                  key={item.topic}
                  onClick={() => {
                    setSelectedSubject(item.subject);
                    handleSendMessage(`I studied ${item.topic}`);
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                >
                  {item.topic}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input Area */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/90">
          <div className="flex items-end gap-2 bg-slate-950/80 border border-slate-700/80 rounded-xl p-2 focus-within:border-blue-500/80 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isProcessing || verdict === 'VERIFIED'}
              placeholder={
                verdict === 'VERIFIED'
                  ? 'Session has been verified and saved to database.'
                  : verdict === 'REJECTED'
                  ? 'Investigation concluded. Start a new investigation when ready.'
                  : messages.length <= 1
                  ? 'e.g. "I studied Binary Search today."'
                  : 'Explain the concept, step-by-step logic, or edge case in your own words...'
              }
              rows={2}
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none px-2 py-1 leading-relaxed"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isProcessing || verdict === 'VERIFIED'}
              className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-lg transition-colors flex-shrink-0"
              title="Send response (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 px-1">
            <span className="flex items-center gap-1.5">
              <span>Press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400 font-mono text-[10px]">Enter</kbd> to submit</span>
              {inputMessage.trim().length > 0 && inputMessage.trim().length < 25 && messages.length > 1 && (
                <span className="text-amber-400/90 font-mono text-[10px]">
                  (Brief answer: give concrete mechanics to avoid challenge)
                </span>
              )}
            </span>
            <span className="flex items-center gap-1 text-amber-400/90">
              <ShieldCheck className="w-3.5 h-3.5" />
              Skeptical verification: 85%+ confidence required
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
