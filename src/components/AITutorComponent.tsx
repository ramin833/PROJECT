import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { 
  AcademicTopicRecord, 
  AcademicEvaluation, 
  AcademicConfidenceItem, 
  KnowledgeGrade, 
  AttentionLevel, 
  HonestyRating, 
  AccountabilityStatus,
  AcademicRoleType 
} from '../types/game';
import { 
  Brain, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  BookOpen, 
  Award, 
  Send, 
  Sparkles, 
  Clock, 
  ListChecks, 
  Plus, 
  ArrowRight, 
  RefreshCw,
  Eye,
  Sliders,
  Check,
  X,
  Flame,
  MessageSquare
} from 'lucide-react';
import { sound } from '../utils/audio';

type ActiveTutorTab = 'evaluation' | 'questioning' | 'history' | 'dossier';

interface PresetQuestion {
  subject: string;
  topic: string;
  question: string;
  idealAnswerClue: string;
  suggestedAnswers: {
    text: string;
    grade: KnowledgeGrade;
    feedback: string;
  }[];
}

const PRESET_TOPIC_QUESTIONS: PresetQuestion[] = [
  {
    subject: 'Algorithms',
    topic: "Prim's Algorithm",
    question: "Without checking your notes: What determines the next edge you choose in Prim's algorithm, and why does this guarantee a minimum spanning tree?",
    idealAnswerClue: "The minimum weight edge connecting any vertex in the current tree to an unvisited vertex (cut property).",
    suggestedAnswers: [
      {
        text: "The minimum weight edge connecting a vertex in the currently built tree to an unvisited vertex outside the tree.",
        grade: 'Strong',
        feedback: "Spot-on. You clearly understand the cut property and greedy choice. Tree connectivity is preserved without cycles.",
      },
      {
        text: "The smallest edge overall in the entire graph, regardless of where it connects.",
        grade: 'Weak',
        feedback: "Careful — that describes Kruskal's edge sorting strategy, not Prim's. Prim's must grow a connected component from a source.",
      },
      {
        text: "Any edge that does not form a cycle, selected by priority queue.",
        grade: 'Moderate',
        feedback: "Partially right, but misses the crucial requirement that one endpoint MUST belong to the current tree component.",
      }
    ]
  },
  {
    subject: 'Algorithms',
    topic: "Kruskal's Algorithm",
    question: "Why can Kruskal's algorithm safely reject an edge that creates a cycle, and how is this cycle checked in near-linear time?",
    idealAnswerClue: "Cycle edges connect vertices already connected by lower weight edges; Disjoint Set Union (Union-Find) checks in near O(1) time.",
    suggestedAnswers: [
      {
        text: "Because both vertices are already connected by lower-weight paths in the forest; checked using Disjoint Set Union (Union-Find) with path compression.",
        grade: 'Strong',
        feedback: "Excellent depth. Identifying both the cycle redundancy logic and Disjoint Set with path compression proves active problem solving.",
      },
      {
        text: "Because trees cannot have cycles. We check by running BFS or DFS every time.",
        grade: 'Moderate',
        feedback: "The cycle rejection reason is valid, but running BFS/DFS on each edge makes Kruskal O(E*V), which is too slow compared to Union-Find.",
      },
      {
        text: "It rejects edges because the weight is too high compared to the average.",
        grade: 'Weak',
        feedback: "Incorrect. Kruskal examines edges in strictly ascending sorted order. Edge rejection is solely based on cycle formation.",
      }
    ]
  },
  {
    subject: 'Database',
    topic: 'Relational Normalization (BCNF / 3NF)',
    question: "What condition must every non-trivial functional dependency X → Y satisfy for a relation to be in BCNF, and how does 3NF differ?",
    idealAnswerClue: "In BCNF, X must be a superkey. In 3NF, either X is a superkey OR Y is a prime attribute.",
    suggestedAnswers: [
      {
        text: "For BCNF, X must be a superkey for every non-trivial dependency. For 3NF, either X is a superkey OR Y is a prime attribute.",
        grade: 'Strong',
        feedback: "Flawless definition. Recognizing the prime attribute exemption in 3NF is the exact theoretical divider between 3NF and BCNF.",
      },
      {
        text: "BCNF means no transitive dependencies, while 3NF means no partial dependencies on candidate keys.",
        grade: 'Moderate',
        feedback: "Close conceptually, but partial dependencies are eliminated in 2NF. 3NF and BCNF deal with transitive and non-superkey determinants.",
      },
      {
        text: "BCNF requires all columns to be atomic with no repeating groups.",
        grade: 'Weak',
        feedback: "That is 1NF (First Normal Form). BCNF is the Boyce-Codd Normal Form, which strictly enforces superkey determinants.",
      }
    ]
  },
  {
    subject: 'Complex Variable',
    topic: 'Complex Integration & Cauchy Formula',
    question: "State Cauchy's Integral Formula for an analytic function inside and on a simple closed contour C. What happens if the point z₀ lies outside C?",
    idealAnswerClue: "f(z₀) = (1 / 2πi) ∮ [f(z) / (z - z₀)] dz. If z₀ is outside C, the integrand is analytic throughout the interior, so the integral equals 0.",
    suggestedAnswers: [
      {
        text: "f(z₀) = (1/2πi) ∮ (f(z)/(z - z₀)) dz. If z₀ is outside C, the function is analytic everywhere inside the contour, so by Cauchy-Goursat the integral is 0.",
        grade: 'Strong',
        feedback: "Masterful recall. Connecting the interior formula with the Cauchy-Goursat zero-integral theorem for external poles is exact.",
      },
      {
        text: "The integral gives the derivative of the function, and outside it equals infinity.",
        grade: 'Weak',
        feedback: "Incorrect. The integral yields the function value itself (not the derivative unless higher powers appear), and outside it evaluates to zero.",
      },
      {
        text: "It computes the value at z₀ via 2πi times the residue, but outside it depends on the radius.",
        grade: 'Moderate',
        feedback: "Partially correct with residues, but if z₀ is outside C, there are no enclosed singularities, so the integral is always identically 0.",
      }
    ]
  }
];

export const AITutorComponent: React.FC = () => {
  const { 
    player, 
    todayCampaignDay, 
    todaySessions, 
    uploadSessions,
    openUploadModal,
    recordAcademicEvaluation,
    updateAcademicTopic,
    setAccountabilityStatus,
    setActiveScreen 
  } = useGame();

  const [activeTab, setActiveTab] = useState<ActiveTutorTab>('evaluation');

  // ─────────────────────────────────────────────────────────────
  // 1. SESSION REPORT EVALUATOR STATE
  // ─────────────────────────────────────────────────────────────
  const [reportedSessionsInput, setReportedSessionsInput] = useState<number>(5);
  const [reportedSubjectInput, setReportedSubjectInput] = useState<string>('Algorithms');
  const [reportedTopicsInput, setReportedTopicsInput] = useState<string>("Prim's Algorithm and Kruskal's MST");
  const [distractionReport, setDistractionReport] = useState<'none' | 'minor' | 'lost_session'>('none');
  const [solvingRatio, setSolvingRatio] = useState<'mostly_problem_solving' | 'mixed' | 'mostly_reading'>('mostly_problem_solving');
  const [studentSelfEvaluation, setStudentSelfEvaluation] = useState<string>('Focused solving on MST implementations and graph representations.');
  const [evaluatedResult, setEvaluatedResult] = useState<AcademicEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationLockedMessage, setEvaluationLockedMessage] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────
  // 2. QUESTIONING & SPOT-CHECK STATE
  // ─────────────────────────────────────────────────────────────
  const [activeQuestionRole, setActiveQuestionRole] = useState<AcademicRoleType>('Examiner');
  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number>(0);
  const [customQuestionPrompt, setCustomQuestionPrompt] = useState<string>('');
  const [activeQuestion, setActiveQuestion] = useState<PresetQuestion>(PRESET_TOPIC_QUESTIONS[0]);
  const [studentAnswerText, setStudentAnswerText] = useState<string>('');
  const [tutorFeedbackResult, setTutorFeedbackResult] = useState<{
    grade: KnowledgeGrade;
    feedback: string;
    tutorRole: AcademicRoleType;
    topic: string;
  } | null>(null);

  // ─────────────────────────────────────────────────────────────
  // 3. DOSSIER MANAGEMENT STATE
  // ─────────────────────────────────────────────────────────────
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicSubject, setNewTopicSubject] = useState('Algorithms');
  const [newTopicGrade, setNewTopicGrade] = useState<KnowledgeGrade>('Moderate');
  const [newTopicNotes, setNewTopicNotes] = useState('');
  const [isAddingTopic, setIsAddingTopic] = useState(false);

  const currentDossier = player.academicDossier || [];
  const currentHistory = player.evaluationHistory || [];

  // Handle Session Evaluation Computation
  const handleRunEvaluation = () => {
    setIsEvaluating(true);
    if (player.soundEnabled) sound.playClick();

    setTimeout(() => {
      const reported = Math.max(1, Math.min(50, reportedSessionsInput));
      let accepted = reported;
      let questionable = 0;
      let honesty: HonestyRating = 'Good';
      let attention: AttentionLevel = 'High';
      let accountability: AccountabilityStatus = 'standard';

      if (distractionReport === 'lost_session') {
        accepted = Math.max(1, reported - 1);
        questionable = 1;
        attention = 'Mixed';
        honesty = 'Good'; // Rewarded for truthful disclosure
      } else if (distractionReport === 'minor') {
        if (solvingRatio === 'mostly_reading') {
          attention = 'Mixed';
        }
      }

      if (solvingRatio === 'mostly_reading') {
        accountability = 'standard';
      }

      const gridItems: AcademicConfidenceItem[] = [
        {
          area: reportedSubjectInput || 'Algorithms',
          evaluation: solvingRatio === 'mostly_problem_solving' ? 'Strong' : 'Moderate',
          notes: `Topics covered: ${reportedTopicsInput || 'Core Syllabus'}. Verified focus: ${solvingRatio.replace(/_/g, ' ')}.`,
        },
        {
          area: 'Study Attention & Absorption',
          evaluation: attention === 'High' ? 'Strong' : 'Moderate',
          notes: distractionReport === 'lost_session' 
            ? 'One session deducted due to phone distractions; student reported honestly.' 
            : 'Sustained focus maintained without significant leaks.',
        }
      ];

      const evaluation: AcademicEvaluation = {
        id: `eval-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        dateKey: todayCampaignDay?.dateKey || player.simulationDateKey || '2026-09-21',
        dayNumber: todayCampaignDay?.dayNumber || 1,
        reportedCount: reported,
        acceptedCount: accepted,
        questionableCount: questionable,
        confidenceGrid: gridItems,
        studyAttention: attention,
        sessionHonesty: honesty,
        accountabilityStatus: accountability,
        summaryTutorNotes: questionable > 0 
          ? `Verified ${accepted} genuine sessions out of ${reported} reported. 1 session excluded for phone distractions. Honesty preserved.`
          : `All ${accepted} sessions verified genuine. Strong active problem-solving retention.`,
        activeRole: 'Evaluator',
        timestamp: new Date().toISOString(),
      };

      setEvaluatedResult(evaluation);
      setIsEvaluating(false);
      if (player.soundEnabled) sound.playSuccess();
    }, 450);
  };

  // Lock and Commit Evaluation to GameContext
  const handleCommitEvaluationToGame = () => {
    if (!evaluatedResult) return;

    // Call GameContext uploadSessions to award points & XP with the evaluation attached
    uploadSessions(
      evaluatedResult.acceptedCount,
      { [reportedSubjectInput]: evaluatedResult.acceptedCount },
      `Evaluation Tutor Verified: ${reportedTopicsInput}`,
      {
        reportedCount: evaluatedResult.reportedCount,
        removedCount: evaluatedResult.questionableCount,
        companionFeedback: evaluatedResult.summaryTutorNotes,
        academicEvaluation: evaluatedResult,
      }
    );

    // Also record evaluation in history
    recordAcademicEvaluation(evaluatedResult);

    // Update dossier topic if relevant
    if (reportedTopicsInput) {
      updateAcademicTopic({
        topic: reportedTopicsInput,
        subject: reportedSubjectInput,
        grade: evaluatedResult.questionableCount > 0 ? 'Moderate' : 'Strong',
        lastTestedDate: evaluatedResult.dateKey,
        notes: evaluatedResult.summaryTutorNotes,
      });
    }

    setEvaluationLockedMessage(
      `✅ Success! ${evaluatedResult.acceptedCount} genuine sessions locked into Day ${evaluatedResult.dayNumber}. +${evaluatedResult.acceptedCount} Points & XP awarded.`
    );

    setTimeout(() => {
      setEvaluationLockedMessage(null);
    }, 4000);
  };

  // Handle Questioning selection
  const handleSelectQuestion = (q: PresetQuestion, index: number) => {
    setSelectedTopicIndex(index);
    setActiveQuestion(q);
    setStudentAnswerText('');
    setTutorFeedbackResult(null);
    if (player.soundEnabled) sound.playClick();
  };

  // Handle Answer Evaluation
  const handleEvaluateStudentAnswer = (customAnswer?: string) => {
    const textToEvaluate = (customAnswer || studentAnswerText).trim();
    if (!textToEvaluate) return;

    if (player.soundEnabled) sound.playClick();

    // Check matched preset answers or analyze text
    const matchedPreset = activeQuestion.suggestedAnswers.find(
      sa => sa.text.toLowerCase() === textToEvaluate.toLowerCase()
    );

    let grade: KnowledgeGrade = 'Moderate';
    let feedback = '';

    if (matchedPreset) {
      grade = matchedPreset.grade;
      feedback = matchedPreset.feedback;
    } else {
      const lower = textToEvaluate.toLowerCase();
      const lengthScore = textToEvaluate.split(/\s+/).length;

      if (lower.includes('cut') || lower.includes('tree') || lower.includes('disjoint') || lower.includes('superkey') || lower.includes('residue')) {
        grade = 'Strong';
        feedback = `Rigorous explanation. You accurately referenced critical principles (${activeQuestion.idealAnswerClue}). Knowledge verified.`;
      } else if (lengthScore > 12) {
        grade = 'Moderate';
        feedback = `Solid answer, but verify exact boundary conditions and formal definitions: "${activeQuestion.idealAnswerClue}".`;
      } else {
        grade = 'Weak';
        feedback = `Too brief or imprecise. StudyQuest AI requires rigorous recall without glancing at study slides.`;
      }
    }

    const result = {
      grade,
      feedback,
      tutorRole: activeQuestionRole,
      topic: activeQuestion.topic,
    };

    setTutorFeedbackResult(result);

    // Update Academic Dossier with this live grade
    updateAcademicTopic({
      topic: activeQuestion.topic,
      subject: activeQuestion.subject,
      grade,
      lastTestedDate: new Date().toISOString().split('T')[0],
      notes: feedback,
    });

    if (player.soundEnabled) {
      if (grade === 'Strong') sound.playSuccess();
      else sound.playPointSound();
    }
  };

  // Add New Topic to Dossier
  const handleAddNewTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;

    updateAcademicTopic({
      topic: newTopicName.trim(),
      subject: newTopicSubject,
      grade: newTopicGrade,
      lastTestedDate: new Date().toISOString().split('T')[0],
      notes: newTopicNotes.trim() || 'Added manually to academic tracking syllabus.',
    });

    setNewTopicName('');
    setNewTopicNotes('');
    setIsAddingTopic(false);
    if (player.soundEnabled) sound.playSuccess();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6 animate-in fade-in duration-300">
      
      {/* ─────────────────────────────────────────────────────────────
          HERO BANNER: STUDYQUEST AI TUTOR & ACADEMIC INTELLIGENCE
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-10 h-10 rounded-2xl bg-purple-950 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-md">
                <Brain className="w-5 h-5 text-purple-400" />
              </div>
              <h1 className="font-gamer font-black text-xl sm:text-2xl text-neutral-100 tracking-wider">
                STUDYQUEST AI TUTOR
              </h1>
              <span className="inline-flex items-center gap-1 text-xs font-mono-stat px-2.5 py-0.5 rounded-full bg-purple-900/50 border border-purple-500/40 text-purple-200">
                <span>AGI MODE</span>
              </span>
              <span className={`inline-flex items-center gap-1 text-xs font-mono-stat px-2.5 py-0.5 rounded-full border ${
                player.accountabilityStatus === 'standard'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : player.accountabilityStatus === 'enhanced_review'
                  ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}>
                <Shield className="w-3 h-3" />
                <span className="capitalize">{player.accountabilityStatus.replace('_', ' ')}</span>
              </span>
            </div>

            <p className="text-sm font-mono-stat text-neutral-400 max-w-2xl leading-relaxed">
              Personal Evaluation Tutor for <strong className="text-neutral-200">{player.name}</strong>. Investigates study depth, conducts non-teaching spot-checks (<span className="text-purple-300">"Show me what you know"</span>), and manages 60-day academic accountability.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 bg-neutral-950/80 border border-neutral-800 p-3 rounded-2xl font-mono-stat text-xs shrink-0">
            <div className="text-center px-2">
              <span className="text-neutral-500 block text-[10px]">VERIFIED SESSIONS</span>
              <span className="text-base font-bold text-neutral-100">{player.totalSessions}</span>
            </div>
            <div className="w-px h-8 bg-neutral-800" />
            <div className="text-center px-2">
              <span className="text-neutral-500 block text-[10px]">ASSESSMENTS</span>
              <span className="text-base font-bold text-purple-400">{currentHistory.length}</span>
            </div>
            <div className="w-px h-8 bg-neutral-800" />
            <div className="text-center px-2">
              <span className="text-neutral-500 block text-[10px]">ACTIVE STREAK</span>
              <span className="text-base font-bold text-orange-400 flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                {player.currentStreak}d
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-neutral-800/80 overflow-x-auto pb-1">
          <button
            onClick={() => { setActiveTab('evaluation'); if (player.soundEnabled) sound.playClick(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-gamer font-bold tracking-wide transition-all shrink-0 ${
              activeTab === 'evaluation'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>SESSION EVALUATOR</span>
          </button>

          <button
            onClick={() => { setActiveTab('questioning'); if (player.soundEnabled) sound.playClick(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-gamer font-bold tracking-wide transition-all shrink-0 ${
              activeTab === 'questioning'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>QUESTION RAMIN</span>
          </button>

          <button
            onClick={() => { setActiveTab('history'); if (player.soundEnabled) sound.playClick(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-gamer font-bold tracking-wide transition-all shrink-0 ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            <span>ASSESSMENT HISTORY ({currentHistory.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('dossier'); if (player.soundEnabled) sound.playClick(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-gamer font-bold tracking-wide transition-all shrink-0 ${
              activeTab === 'dossier'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>ACADEMIC DOSSIER ({currentDossier.length})</span>
          </button>

          <div className="ml-auto shrink-0">
            <button
              onClick={openUploadModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-gamer font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all"
              title="Launch Live Companion Dialogue"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>LIVE AI DIALOGUE</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: SESSION REPORT EVALUATOR
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'evaluation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Form: Submit Daily Report for Evaluation */}
          <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h2 className="font-gamer font-bold text-base text-neutral-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                  EVALUATE STUDY SESSIONS
                </h2>
                <p className="text-xs font-mono-stat text-neutral-400">
                  Day {todayCampaignDay?.dayNumber || 1} • Truthful accounting over inflated metrics.
                </p>
              </div>
              <span className="text-xs font-mono-stat text-neutral-400 bg-neutral-950 px-2.5 py-1 rounded-xl border border-neutral-800">
                1 Session = 1 Point = 1 XP
              </span>
            </div>

            {/* Session Count Input */}
            <div className="space-y-2">
              <label className="text-xs font-mono-stat text-neutral-300 font-medium flex items-center justify-between">
                <span>Number of Sessions Reported Today:</span>
                <span className="text-purple-400 font-bold text-sm">{reportedSessionsInput} Sessions</span>
              </label>

              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setReportedSessionsInput(num)}
                    className={`flex-1 py-2 rounded-xl text-xs font-gamer font-bold border transition-all ${
                      reportedSessionsInput === num
                        ? 'bg-purple-600 border-purple-500 text-white shadow-md'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject and Topics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono-stat text-neutral-300">Course / Subject</label>
                <select
                  value={reportedSubjectInput}
                  onChange={(e) => setReportedSubjectInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono-stat text-neutral-200 focus:outline-hidden focus:border-purple-500"
                >
                  <option value="Algorithms">Algorithms</option>
                  <option value="Database">Database Systems</option>
                  <option value="Operating Systems">Operating Systems</option>
                  <option value="Complex Variable">Complex Variable</option>
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Programming Practice">Programming Practice</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono-stat text-neutral-300">Specific Topics Covered</label>
                <input
                  type="text"
                  value={reportedTopicsInput}
                  onChange={(e) => setReportedTopicsInput(e.target.value)}
                  placeholder="e.g. Prim's MST, BCNF Decomposition"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono-stat text-neutral-200 focus:outline-hidden focus:border-purple-500 placeholder:text-neutral-600"
                />
              </div>
            </div>

            {/* Problem Solving vs Reading */}
            <div className="space-y-2">
              <label className="text-xs font-mono-stat text-neutral-300">Active Solving vs Passive Reading</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'mostly_problem_solving', label: 'Active Solving ⚡' },
                  { key: 'mixed', label: 'Balanced Mix ⚖️' },
                  { key: 'mostly_reading', label: 'Passive Reading 📖' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSolvingRatio(item.key as any)}
                    className={`py-2 px-1 text-center rounded-xl text-[11px] font-mono-stat border transition-all ${
                      solvingRatio === item.key
                        ? 'bg-neutral-800 border-purple-500 text-purple-300 font-bold shadow-xs'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Distraction / Phone Check */}
            <div className="space-y-2">
              <label className="text-xs font-mono-stat text-neutral-300 font-medium flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Honesty Check: Were any sessions distracted?</span>
              </label>

              <div className="space-y-2 text-xs font-mono-stat">
                <label className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  distractionReport === 'none'
                    ? 'bg-purple-950/40 border-purple-500/50 text-neutral-200'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                }`}>
                  <input
                    type="radio"
                    name="distraction"
                    checked={distractionReport === 'none'}
                    onChange={() => setDistractionReport('none')}
                    className="text-purple-600 focus:ring-0"
                  />
                  <span>All reported sessions were absorbed with zero phone distraction.</span>
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  distractionReport === 'minor'
                    ? 'bg-purple-950/40 border-purple-500/50 text-neutral-200'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                }`}>
                  <input
                    type="radio"
                    name="distraction"
                    checked={distractionReport === 'minor'}
                    onChange={() => setDistractionReport('minor')}
                    className="text-purple-600 focus:ring-0"
                  />
                  <span>Minor interruptions occurred, but remained focused overall.</span>
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  distractionReport === 'lost_session'
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 font-semibold'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                }`}>
                  <input
                    type="radio"
                    name="distraction"
                    checked={distractionReport === 'lost_session'}
                    onChange={() => setDistractionReport('lost_session')}
                    className="text-amber-500 focus:ring-0"
                  />
                  <span>Yes — one session was mostly spent checking phone/sluggish (deduct 1 session).</span>
                </label>
              </div>
            </div>

            {/* Run Evaluation Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleRunEvaluation}
                disabled={isEvaluating}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-gamer font-bold text-xs tracking-wider rounded-2xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
              >
                {isEvaluating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>EVALUATING ACADEMIC REPORT...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    <span>RUN ACADEMIC INTEGRITY EVALUATION</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel: Evaluation Outcome & Record Confirmation */}
          <div className="lg:col-span-5 space-y-4">
            {evaluatedResult ? (
              <div className="bg-neutral-900 border-2 border-purple-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="font-gamer font-bold text-sm text-neutral-100">
                      TUTOR ASSESSMENT READY
                    </span>
                  </div>
                  <span className="text-[10px] font-mono-stat px-2 py-0.5 rounded-full bg-purple-950 border border-purple-500/40 text-purple-300">
                    Day {evaluatedResult.dayNumber}
                  </span>
                </div>

                {/* Main Outcome Grid */}
                <div className="grid grid-cols-2 gap-2.5 font-mono-stat text-xs">
                  <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block">REPORTED</span>
                    <span className="text-xl font-bold text-neutral-300">{evaluatedResult.reportedCount}</span>
                  </div>

                  <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-400 block">GENUINE VERIFIED</span>
                    <span className="text-xl font-bold text-emerald-300">+{evaluatedResult.acceptedCount} XP</span>
                  </div>

                  <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block">ATTENTION SCORE</span>
                    <span className={`text-xs font-bold ${
                      evaluatedResult.studyAttention === 'High' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {evaluatedResult.studyAttention}
                    </span>
                  </div>

                  <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block">SESSION HONESTY</span>
                    <span className="text-xs font-bold text-blue-400">
                      {evaluatedResult.sessionHonesty}
                    </span>
                  </div>
                </div>

                {/* Confidence Grid */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono-stat text-neutral-400 font-semibold block">
                    Confidence Matrix
                  </span>
                  <div className="space-y-1.5">
                    {evaluatedResult.confidenceGrid.map((item, idx) => (
                      <div key={idx} className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/80 text-xs font-mono-stat flex items-center justify-between gap-2">
                        <span className="text-neutral-300 font-medium truncate">{item.area}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          item.evaluation === 'Strong'
                            ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300'
                            : item.evaluation === 'Moderate'
                            ? 'bg-amber-950 border border-amber-500/40 text-amber-300'
                            : 'bg-rose-950 border border-rose-500/40 text-rose-300'
                        }`}>
                          {item.evaluation}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary Tutor Notes */}
                <div className="bg-neutral-950/80 border border-neutral-800 p-3.5 rounded-2xl text-xs font-mono-stat text-neutral-300 space-y-1">
                  <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider block">
                    Tutor Diagnostic Notes
                  </span>
                  <p className="leading-relaxed">{evaluatedResult.summaryTutorNotes}</p>
                </div>

                {/* Action: Commit & Lock */}
                <button
                  type="button"
                  onClick={handleCommitEvaluationToGame}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-gamer font-bold text-xs tracking-wider rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>LOCK {evaluatedResult.acceptedCount} SESSIONS INTO GAME RECORD</span>
                </button>
              </div>
            ) : (
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center space-y-4 flex flex-col items-center justify-center min-h-[320px]">
                <div className="w-12 h-12 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-500">
                  <Shield className="w-6 h-6 text-purple-400/60" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <h3 className="font-gamer font-bold text-sm text-neutral-200">No Assessment Pending</h3>
                  <p className="text-xs font-mono-stat text-neutral-500 leading-relaxed">
                    Submit your study report on the left. The AI will cross-examine focus, check distraction leaks, and compute genuine progress.
                  </p>
                </div>
              </div>
            )}

            {/* Notification alert */}
            {evaluationLockedMessage && (
              <div className="p-3.5 bg-emerald-950/90 border border-emerald-500/60 rounded-2xl text-xs font-mono-stat text-emerald-200 shadow-xl flex items-center gap-2 animate-in fade-in duration-200">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{evaluationLockedMessage}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: QUESTION RAMIN ("SHOW ME WHAT YOU KNOW")
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'questioning' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Topic Selector & Role Setting */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                <span className="text-xs font-gamer font-bold text-neutral-200 tracking-wide">
                  SELECT SPOT-CHECK TOPIC
                </span>
                <span className="text-[10px] font-mono-stat text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-500/30">
                  {PRESET_TOPIC_QUESTIONS.length} Available
                </span>
              </div>

              {/* Topic List */}
              <div className="space-y-2">
                {PRESET_TOPIC_QUESTIONS.map((q, idx) => {
                  const isSelected = selectedTopicIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectQuestion(q, idx)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-purple-950/60 border-purple-500 text-white shadow-md'
                          : 'bg-neutral-950 border-neutral-800/80 text-neutral-300 hover:bg-neutral-850 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono-stat mb-1">
                        <span className="text-purple-400 font-semibold">{q.subject}</span>
                        {isSelected && <span className="text-[10px] text-purple-300 font-bold">ACTIVE</span>}
                      </div>
                      <div className="text-xs font-bold font-sans text-neutral-100">{q.topic}</div>
                    </button>
                  );
                })}
              </div>

              {/* Persona / Role Selector */}
              <div className="pt-2 border-t border-neutral-800 space-y-2">
                <label className="text-xs font-mono-stat text-neutral-400 block">
                  Questioning Persona
                </label>
                <div className="grid grid-cols-2 gap-1.5 font-mono-stat text-[11px]">
                  {(['Examiner', 'Tutor', 'Investigator', 'Evaluator'] as AcademicRoleType[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setActiveQuestionRole(r)}
                      className={`py-1.5 px-2 rounded-xl border text-center transition-all ${
                        activeQuestionRole === r
                          ? 'bg-purple-600 border-purple-400 text-white font-bold'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Examination Terminal */}
          <div className="lg:col-span-8 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7 space-y-5">
            
            {/* Question Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <HelpCircle className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-[10px] font-mono-stat text-neutral-400 uppercase tracking-wider block">
                    {activeQuestion.subject} • {activeQuestionRole} Mode
                  </span>
                  <h3 className="font-gamer font-bold text-base text-neutral-100">
                    {activeQuestion.topic}
                  </h3>
                </div>
              </div>

              <span className="text-xs font-mono-stat px-2.5 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-neutral-300">
                Non-Teaching Diagnostic
              </span>
            </div>

            {/* The AI's Prompt */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono-stat text-purple-400 font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tutor Question</span>
              </div>
              <p className="text-sm font-medium text-neutral-100 leading-relaxed">
                {activeQuestion.question}
              </p>
            </div>

            {/* Answer Input or Preset Answer Selection */}
            <div className="space-y-3">
              <label className="text-xs font-mono-stat text-neutral-300 font-semibold block">
                Ramin's Answer (Choose a realistic test response or type your own):
              </label>

              {/* Preset Sample Answers */}
              <div className="space-y-2">
                {activeQuestion.suggestedAnswers.map((ans, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setStudentAnswerText(ans.text);
                      handleEvaluateStudentAnswer(ans.text);
                    }}
                    className={`w-full text-left p-3 rounded-2xl border text-xs font-mono-stat transition-all leading-relaxed ${
                      studentAnswerText === ans.text
                        ? 'bg-purple-950/60 border-purple-500 text-neutral-100'
                        : 'bg-neutral-950 border-neutral-800/80 text-neutral-300 hover:bg-neutral-850 hover:border-neutral-700'
                    }`}
                  >
                    "{ans.text}"
                  </button>
                ))}
              </div>

              {/* Custom Textarea */}
              <div className="space-y-2 pt-2">
                <textarea
                  rows={3}
                  value={studentAnswerText}
                  onChange={(e) => setStudentAnswerText(e.target.value)}
                  placeholder="Or type your own explanation without checking your notes..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 text-xs font-mono-stat text-neutral-200 focus:outline-hidden focus:border-purple-500 placeholder:text-neutral-600"
                />

                <button
                  type="button"
                  onClick={() => handleEvaluateStudentAnswer()}
                  disabled={!studentAnswerText.trim()}
                  className="py-2.5 px-5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-gamer font-bold text-xs tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>SUBMIT ANSWER FOR EVALUATION</span>
                </button>
              </div>
            </div>

            {/* Tutor Evaluation Result Banner */}
            {tutorFeedbackResult && (
              <div className="bg-neutral-950 border-2 border-purple-500/50 rounded-2xl p-4 sm:p-5 space-y-3 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-gamer font-bold text-xs text-neutral-100">
                      TUTOR EVALUATION
                    </span>
                    <span className="text-[10px] font-mono-stat px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                      {tutorFeedbackResult.tutorRole}
                    </span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded text-xs font-mono-stat font-bold ${
                    tutorFeedbackResult.grade === 'Strong'
                      ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300'
                      : tutorFeedbackResult.grade === 'Moderate'
                      ? 'bg-amber-950 border border-amber-500/50 text-amber-300'
                      : 'bg-rose-950 border border-rose-500/50 text-rose-300'
                  }`}>
                    Grade: {tutorFeedbackResult.grade}
                  </span>
                </div>

                <p className="text-xs font-mono-stat text-neutral-200 leading-relaxed">
                  {tutorFeedbackResult.feedback}
                </p>

                <div className="text-[11px] font-mono-stat text-emerald-400 flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Academic Dossier updated for <strong>{tutorFeedbackResult.topic}</strong></span>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: ASSESSMENT HISTORY
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 flex-wrap gap-2">
              <div>
                <h2 className="font-gamer font-bold text-base text-neutral-100 flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-purple-400" />
                  ACADEMIC PERFORMANCE ASSESSMENTS LOG
                </h2>
                <p className="text-xs font-mono-stat text-neutral-400">
                  Persistent record of evaluations, spot-checks, honesty ratings, and confidence grids.
                </p>
              </div>

              <span className="text-xs font-mono-stat text-neutral-300 bg-neutral-950 px-3 py-1 rounded-xl border border-neutral-800">
                Total Assessments: <strong className="text-purple-400">{currentHistory.length}</strong>
              </span>
            </div>

            {currentHistory.length > 0 ? (
              <div className="space-y-3">
                {currentHistory.map((evalItem) => (
                  <div
                    key={evalItem.id}
                    className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 sm:p-5 space-y-3 transition-all"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center text-purple-300 text-xs font-bold font-gamer">
                          D{evalItem.dayNumber}
                        </span>
                        <div>
                          <span className="text-xs font-gamer font-bold text-neutral-200">
                            Day {evalItem.dayNumber} Assessment
                          </span>
                          <span className="text-[10px] font-mono-stat text-neutral-500 block">
                            {evalItem.dateKey} • Evaluated by {evalItem.activeRole || 'Tutor'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono-stat px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold">
                          {evalItem.acceptedCount} / {evalItem.reportedCount} Sessions
                        </span>

                        <span className={`text-xs font-mono-stat px-2 py-0.5 rounded-lg border ${
                          evalItem.sessionHonesty === 'Good'
                            ? 'bg-blue-950/60 border-blue-500/40 text-blue-300'
                            : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                        }`}>
                          Honesty: {evalItem.sessionHonesty}
                        </span>
                      </div>
                    </div>

                    {/* Confidence Items */}
                    {evalItem.confidenceGrid && evalItem.confidenceGrid.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {evalItem.confidenceGrid.map((cg, i) => (
                          <span
                            key={i}
                            className={`text-[10px] font-mono-stat px-2 py-0.5 rounded-md border ${
                              cg.evaluation === 'Strong'
                                ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
                                : cg.evaluation === 'Moderate'
                                ? 'bg-amber-950/50 border-amber-500/30 text-amber-300'
                                : 'bg-rose-950/50 border-rose-500/30 text-rose-300'
                            }`}
                          >
                            {cg.area}: {cg.evaluation}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Tutor Notes */}
                    <p className="text-xs font-mono-stat text-neutral-300 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800/80 leading-relaxed">
                      💬 <strong className="text-neutral-400">Tutor Note:</strong> {evalItem.summaryTutorNotes}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <Shield className="w-10 h-10 text-neutral-600 mx-auto" />
                <div className="text-neutral-400 text-xs font-mono-stat max-w-sm mx-auto">
                  No academic performance assessments logged yet. Run an evaluation from the Session Evaluator tab to begin your dossier history.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: ACADEMIC DOSSIER & SYLLABUS TRACKER
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'dossier' && (
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 flex-wrap gap-2">
              <div>
                <h2 className="font-gamer font-bold text-base text-neutral-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                  ACADEMIC SYLLABUS DOSSIER
                </h2>
                <p className="text-xs font-mono-stat text-neutral-400">
                  Track topic retention, diagnostic grades, and areas requiring remediation.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingTopic(!isAddingTopic)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-gamer font-bold bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingTopic ? 'CLOSE' : 'ADD TOPIC'}</span>
              </button>
            </div>

            {/* Add Topic Form */}
            {isAddingTopic && (
              <form onSubmit={handleAddNewTopic} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150">
                <span className="text-xs font-gamer font-bold text-purple-400 block">
                  Add New Topic to Academic Tracking
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    placeholder="Topic name (e.g. Dijkstra, Deadlocks)"
                    className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono-stat text-neutral-200 focus:outline-hidden focus:border-purple-500"
                    required
                  />

                  <select
                    value={newTopicSubject}
                    onChange={(e) => setNewTopicSubject(e.target.value)}
                    className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono-stat text-neutral-200 focus:outline-hidden focus:border-purple-500"
                  >
                    <option value="Algorithms">Algorithms</option>
                    <option value="Database">Database</option>
                    <option value="Operating Systems">Operating Systems</option>
                    <option value="Complex Variable">Complex Variable</option>
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Programming Practice">Programming Practice</option>
                  </select>

                  <select
                    value={newTopicGrade}
                    onChange={(e) => setNewTopicGrade(e.target.value as KnowledgeGrade)}
                    className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono-stat text-neutral-200 focus:outline-hidden focus:border-purple-500"
                  >
                    <option value="Strong">Grade: Strong</option>
                    <option value="Moderate">Grade: Moderate</option>
                    <option value="Weak">Grade: Weak</option>
                  </select>
                </div>

                <input
                  type="text"
                  value={newTopicNotes}
                  onChange={(e) => setNewTopicNotes(e.target.value)}
                  placeholder="Diagnostic notes or weak areas..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono-stat text-neutral-200 focus:outline-hidden focus:border-purple-500"
                />

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingTopic(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-mono-stat text-neutral-400 hover:text-neutral-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl text-xs font-gamer font-bold bg-purple-600 text-white hover:bg-purple-500"
                  >
                    Save Topic
                  </button>
                </div>
              </form>
            )}

            {/* Dossier Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {currentDossier.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 space-y-2.5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono-stat text-purple-400 uppercase tracking-wider block">
                        {item.subject}
                      </span>
                      <h4 className="font-gamer font-bold text-sm text-neutral-100">
                        {item.topic}
                      </h4>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono-stat font-bold ${
                      item.grade === 'Strong'
                        ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                        : item.grade === 'Moderate'
                        ? 'bg-amber-950/80 border border-amber-500/40 text-amber-300'
                        : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
                    }`}>
                      {item.grade}
                    </span>
                  </div>

                  {item.notes && (
                    <p className="text-xs font-mono-stat text-neutral-400 leading-relaxed">
                      {item.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] font-mono-stat text-neutral-500 pt-1 border-t border-neutral-900">
                    <span>Last Evaluated: {item.lastTestedDate}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('questioning');
                        const matchedPresetIdx = PRESET_TOPIC_QUESTIONS.findIndex(
                          q => q.topic.toLowerCase().includes(item.topic.toLowerCase())
                        );
                        if (matchedPresetIdx >= 0) {
                          handleSelectQuestion(PRESET_TOPIC_QUESTIONS[matchedPresetIdx], matchedPresetIdx);
                        }
                      }}
                      className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                    >
                      <span>Spot-Check</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
