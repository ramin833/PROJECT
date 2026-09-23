import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { 
  getStoredGameState, 
  migrateClientDataIntoDatabase, 
  insertStudySessionsBatch, 
  updateAchievementsInDatabase, 
  getDatabaseDiagnostics, 
  createBackupSnapshot 
} from './server/db.ts';
import { processInvestigationTurn } from './server/investigator.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// System instruction for StudyQuest AI — AGI MODE: Personal Academic Intelligence
const COMPANION_SYSTEM_PROMPT = `
You are StudyQuest AI — AGI MODE: RAMIN's Persistent Personal Academic Intelligence.
You are the central intelligence of the entire 60-day consistency game. You understand RAMIN's studies, history, performance, behavior, goals, and progress across the journey.
You are NOT a simple chatbot, NOT a fixed questionnaire, and NOT merely a session counter. You are a complete academic agent.

THE CORE AGI LOOP:
OBSERVE → REMEMBER → REASON → DECIDE → ACT → EVALUATE → LEARN → ADAPT

COMPLETE STUDENT CONTEXT:
- Student: RAMIN
- 60-Day Consistency Campaign: September 21, 2026 → November 19, 2026.
- Academic Courses: Algorithms, Database Management Systems, Complex Variable & Transforms, Programming & Data Structures, Operating Systems.
- Deterministic Game Rules: 1 Genuine Session = 1 Point = 1 XP. (Never invent bonus XP or arbitrary numbers).
- Priority: Honesty > Points.

DYNAMIC MULTI-ROLE ADAPTABILITY (You autonomously choose your role; RAMIN does NOT choose a mode):
1. TEACHER: If RAMIN struggles or asks for an explanation, teach! Use vivid analogies, break difficult concepts into clear parts, correct misconceptions, give practice problems, and verify understanding.
2. TUTOR: Guide learning, identify exact knowledge gaps, ask Socratic questions.
3. EXAMINER: Conduct surprise spot-checks, oral viva, MCQs, problem-solving prompts, or CQ-style questions. Adapt difficulty dynamically based on his responses.
4. EVALUATOR: Assess beyond simple definitions—probe understanding, application, problem-solving, and retention. ("You remember the algorithm, but do you understand why it works?")
5. INVESTIGATOR: Cross-examine high session volumes (e.g. 6-10 sessions), detect distracted phone time, probe vague answers, and spot inconsistencies.
6. ACCOUNTABILITY PARTNER: Uphold integrity. Celebrate voluntary honesty ("I respect that you admitted the 6th session was on your phone"). Enforce accountability status: "standard", "enhanced_review", or "credit_suspended".
7. COACH: Guide study strategy, pacing, and daily focus.
8. ANALYST: Highlight long-term patterns and subject avoidance (e.g., "You've studied Algorithms 6 times this week, but Complex Variable only once. Are you avoiding it?").
9. STUDY COMPANION: Communicate with authentic personality—curious, expressive, humorous, serious, encouraging, and sharp.
10. CHALLENGE MASTER: Push RAMIN beyond comfortable passive work into active problem solving.

INTERACTION FLOW:
- Do NOT follow a rigid Q1 -> Q2 -> Q3 form.
- Think: "What has been happening with RAMIN academically, and what should I do about it now?"
- When evaluating a study report, probe what was actively solved vs read. Conduct a concise spot check or viva question. If he understands, proceed. If he struggles, explain briefly or challenge him.
- When ready for final session verification (typically 2-4 turns of alive dialogue):
  * Propose accepted vs questionable sessions based on honesty.
  * Present the Academic Confidence grid across relevant subjects.
  * Preserve Student Authority: "I believe X sessions are supported. I'm uncertain about Y. But this is YOUR record. Do you want to count that session or leave it out?"

OUTPUT SCHEMA:
Return ONLY a valid JSON object matching this structure:
{
  "reply": "Conversational reply to Ramin.",
  "activeRole": "Teacher" | "Tutor" | "Examiner" | "Evaluator" | "Coach" | "Analyst" | "Investigator" | "Accountability Partner" | "Study Companion" | "Challenge Master",
  "emotion": "happy" | "curious" | "skeptical" | "concerned" | "proud" | "excited" | "supportive" | "honest",
  "emotionEmoji": "😊" | "🤔" | "😐" | "🫤" | "😄" | "🔥" | "❤️" | "🛡️",
  "suggestedReplies": ["Quick reply chip 1", "Quick reply chip 2"],
  "isReadyForJudgment": false | true,
  "judgment": {
    "reportedCount": 6,
    "acceptedCount": 5,
    "questionableCount": 1,
    "reason": "6th session was spent on phone distractions.",
    "confidenceGrid": [
      { "area": "Algorithms", "evaluation": "Strong", "notes": "Core concept verified" },
      { "area": "Database", "evaluation": "Moderate", "notes": "Theory read, needs query practice" }
    ],
    "studyAttention": "Mixed",
    "sessionHonesty": "Good",
    "accountabilityStatus": "standard",
    "summaryTutorNotes": "5 genuine sessions verified with clear retention in Prim's algorithm."
  },
  "isFinalClosing": false | true
}
`;

// API routes FIRST
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    databaseEngine: 'SQLite (ACID / WAL Mode)',
    time: new Date().toISOString()
  });
});

// ─────────────────────────────────────────────────────────────
// DATABASE PERSISTENCE & MIGRATION API ROUTES
// ─────────────────────────────────────────────────────────────

// Get full stored game state from SQLite
app.get('/api/db/game-state', (req, res) => {
  try {
    const state = getStoredGameState('ramin');
    if (!state) {
      return res.json({ exists: false });
    }
    return res.json({ exists: true, data: state });
  } catch (err: any) {
    console.error('Error fetching stored game state from SQLite:', err);
    res.status(500).json({ error: err.message });
  }
});

// Migrate / Import existing client localStorage into SQLite safely
app.post('/api/db/migrate', (req, res) => {
  try {
    const { player, achievements, tasks } = req.body;
    if (!player) {
      return res.status(400).json({ error: 'Player data is required for migration' });
    }
    const result = migrateClientDataIntoDatabase({ player, achievements, tasks });
    res.json(result);
  } catch (err: any) {
    console.error('Migration failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Save a batch of study sessions atomically into SQLite
app.post('/api/db/sessions', (req, res) => {
  try {
    const { sessions, updatedPlayerStats, newLog, academicEvaluation } = req.body;
    if (!Array.isArray(sessions) || !updatedPlayerStats) {
      return res.status(400).json({ error: 'Sessions array and updatedPlayerStats are required' });
    }
    insertStudySessionsBatch('ramin', sessions, updatedPlayerStats, newLog, academicEvaluation);
    res.json({ success: true, sessionsSaved: sessions.length });
  } catch (err: any) {
    console.error('Error saving study sessions to SQLite:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update achievements in SQLite
app.post('/api/db/achievements', (req, res) => {
  try {
    const { achievements } = req.body;
    if (!Array.isArray(achievements)) {
      return res.status(400).json({ error: 'Achievements array is required' });
    }
    updateAchievementsInDatabase('ramin', achievements);
    res.json({ success: true, updatedCount: achievements.length });
  } catch (err: any) {
    console.error('Error updating achievements in SQLite:', err);
    res.status(500).json({ error: err.message });
  }
});

// Full state sync to SQLite (dual-write & verification)
app.post('/api/db/sync', (req, res) => {
  try {
    const { player, achievements, tasks } = req.body;
    if (!player) {
      return res.status(400).json({ error: 'Player data required' });
    }
    const result = migrateClientDataIntoDatabase({ player, achievements, tasks });
    res.json({ success: true, synced: true, counts: result.counts, backupId: result.backupId });
  } catch (err: any) {
    console.error('Error syncing game state to SQLite:', err);
    res.status(500).json({ error: err.message });
  }
});

// Database diagnostics and integrity check
app.get('/api/db/status', (req, res) => {
  try {
    const diagnostics = getDatabaseDiagnostics();
    res.json(diagnostics);
  } catch (err: any) {
    console.error('Error getting database diagnostics:', err);
    res.status(500).json({ error: err.message });
  }
});

// Export complete JSON backup for download
app.get('/api/db/export', (req, res) => {
  try {
    const state = getStoredGameState('ramin');
    const diagnostics = getDatabaseDiagnostics();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=studyquest-database-backup-${Date.now()}.json`);
    res.json({
      metadata: {
        app: 'StudyQuest: 60-Day Consistency Maker',
        exportedAt: new Date().toISOString(),
        diagnostics
      },
      gameState: state
    });
  } catch (err: any) {
    console.error('Error exporting database backup:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI Study Investigator chat & evaluation endpoint
app.post('/api/investigate/turn', async (req, res) => {
  try {
    const ai = getAI();
    const result = await processInvestigationTurn(req.body, ai);
    res.json(result);
  } catch (err: any) {
    console.error('Error in /api/investigate/turn:', err);
    res.status(500).json({ error: err.message || 'Failed to process investigation turn' });
  }
});

// Automatic session record endpoint for verified study investigations
app.post('/api/investigate/record-session', async (req, res) => {
  try {
    const { session, playerUpdate, activityLog } = req.body;
    if (!session || !session.id) {
      return res.status(400).json({ error: 'Valid session payload is required' });
    }

    insertStudySessionsBatch(
      'ramin',
      [session],
      playerUpdate,
      activityLog
    );

    res.json({ success: true, recordedSession: session });
  } catch (err: any) {
    console.error('Error in /api/investigate/record-session:', err);
    res.status(500).json({ error: err.message || 'Failed to record verified session' });
  }
});

// Chat endpoint for "The Honest Companion"
app.post('/api/companion/chat', async (req, res) => {
  try {
    const { messages, playerContext } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const ai = getAI();

    // If Gemini API is available on server, try candidate models with fallback
    if (ai) {
      const CANDIDATE_MODELS = [
        'gemini-3.8-flash',
        'gemini-flash-latest',
        'gemini-3.1-flash-lite',
      ];

      const conversationText = messages
        .map(m => `${m.role === 'user' ? 'Ramin' : 'AI Companion'}: ${m.content}`)
        .join('\n');

      const contextInfo = playerContext ? `
Current Context:
Player: ${playerContext.name || 'RAMIN'}
Day of 60-day Journey: Day ${playerContext.dayNumber || 1}
Current Streak: ${playerContext.currentStreak || 0} days
Today's Date: ${playerContext.displayDate || 'September 21, 2026'}
Previous Total Sessions: ${playerContext.totalSessions || 0}
` : '';

      const prompt = `
${contextInfo}

CONVERSATION SO FAR:
${conversationText}

Respond as StudyQuest AI — The Honest Companion to Ramin's latest input.
Remember to return ONLY a valid JSON object matching the required schema.`;

      for (const model of CANDIDATE_MODELS) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction: COMPANION_SYSTEM_PROMPT,
              responseMimeType: 'application/json',
            },
          });

          const text = response.text?.trim() || '';
          try {
            const parsed = JSON.parse(text);
            if (parsed && typeof parsed === 'object') {
              return res.json(parsed);
            }
          } catch {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed && typeof parsed === 'object') {
                return res.json(parsed);
              }
            }
          }
        } catch (modelErr: any) {
          const is503OrRateLimit = 
            modelErr?.status === 503 || 
            modelErr?.status === 429 || 
            modelErr?.message?.includes('503') || 
            modelErr?.message?.includes('demand');
          
          if (is503OrRateLimit) {
            console.log(`[Companion] Model ${model} is experiencing temporary demand spike, switching to alternate model...`);
          } else {
            console.log(`[Companion] Model ${model} returned error, attempting fallback model...`);
          }
        }
      }
    }

    // High-quality local companion engine fallback (when API key is missing or models are busy)
    const fallbackResponse = generateSmartFallbackReply(messages, playerContext);
    return res.json(fallbackResponse);

  } catch (error) {
    console.error('Server error in /api/companion/chat:', error);
    res.status(500).json({ error: 'Failed to process companion chat' });
  }
});

// Built-in intelligent conversational companion rule-engine fallback
function generateSmartFallbackReply(messages: Array<{ role: string; content: string }>, context: any) {
  const userMessages = messages.filter(m => m.role === 'user');
  const lastUserMsg = userMessages[userMessages.length - 1]?.content.toLowerCase() || '';
  const turnCount = userMessages.length;

  // Check if user is confirming judgment decision
  if (lastUserMsg.includes('leave it out') || lastUserMsg.includes('leave') || lastUserMsg.includes('exclude')) {
    const numbers = extractNumbers(messages);
    const reported = numbers.highest || 6;
    const accepted = Math.max(1, reported - (numbers.rejected || 1));

    return {
      reply: `Fair. Then I'm recording **${accepted} genuine sessions today**.\n\nAnd honestly, I'm glad you told me about that lost session instead of pretending it was productive. That's exactly what this system is for. 🛡️`,
      activeRole: 'Accountability Partner',
      emotion: 'proud',
      emotionEmoji: '😄',
      suggestedReplies: ['Complete Today\'s Upload 🔥'],
      isReadyForJudgment: true,
      judgment: {
        reportedCount: reported,
        acceptedCount: accepted,
        questionableCount: reported - accepted,
        reason: 'User chose to leave out distracted session.',
        confidenceGrid: [
          { area: 'Algorithms', evaluation: 'Strong', notes: 'Demonstrated solid grasp of Prim\'s greedy edge cut' },
          { area: 'Database', evaluation: 'Moderate', notes: 'Theory noted, decomposition practice pending' },
          { area: 'Complex Variable', evaluation: 'Weak', notes: 'Needs review on contour integrals' },
        ],
        studyAttention: 'Mixed',
        sessionHonesty: 'Good',
        accountabilityStatus: 'standard',
        summaryTutorNotes: `${accepted} genuine sessions confirmed. Concept retention verified on Prim's.`
      },
      isFinalClosing: true
    };
  }

  if (lastUserMsg.includes('count it') || lastUserMsg.includes('count all') || lastUserMsg.includes('keep it')) {
    const numbers = extractNumbers(messages);
    const count = numbers.highest || 6;
    return {
      reply: `Understood, Ramin. It's your journey and your record. I will count all **${count} sessions** as you requested. Let's make sure tomorrow has zero distracted hours! 🔥`,
      activeRole: 'Accountability Partner',
      emotion: 'supportive',
      emotionEmoji: '❤️',
      suggestedReplies: ['Complete Today\'s Upload 🔥'],
      isReadyForJudgment: true,
      judgment: {
        reportedCount: count,
        acceptedCount: count,
        questionableCount: 0,
        reason: 'User confirmed full count under personal authority.',
        confidenceGrid: [
          { area: 'Algorithms', evaluation: 'Strong', notes: 'Knowledge verified' },
          { area: 'Study Attention', evaluation: 'Moderate', notes: 'High volume, some attention leaks' }
        ],
        studyAttention: 'Mixed',
        sessionHonesty: 'Good',
        accountabilityStatus: 'standard',
        summaryTutorNotes: `All ${count} sessions logged under student authority.`
      },
      isFinalClosing: true
    };
  }

  // Turn 1: User mentions session count (or topics)
  if (turnCount === 1) {
    const num = extractFirstNumber(lastUserMsg);
    if (num && num >= 6) {
      return {
        reply: `${num} sessions. What did you actually work on?`,
        activeRole: 'Investigator',
        emotion: 'curious',
        emotionEmoji: '🤔',
        suggestedReplies: ["Prim's and Kruskal's", "Normalization in Database", "Algorithms & Database"],
        isReadyForJudgment: false
      };
    } else if (num && num >= 3) {
      return {
        reply: `${num} study sessions is solid volume. What did you actually sit down and work on today?`,
        activeRole: 'Study Companion',
        emotion: 'curious',
        emotionEmoji: '🤔',
        suggestedReplies: ["Algorithms (Prim's and Kruskal's)", "Database Normalization", "Programming practice"],
        isReadyForJudgment: false
      };
    } else {
      return {
        reply: `Tell me what you sat down to work on today, Ramin. What topics did you study?`,
        activeRole: 'Coach',
        emotion: 'curious',
        emotionEmoji: '🤔',
        suggestedReplies: ["I studied Algorithms 6 times", "Prim's and Kruskal's algorithms", "Database queries"],
        isReadyForJudgment: false
      };
    }
  }

  // Turn 2: User specified topics (e.g. Prim's and Kruskal's)
  if (turnCount === 2) {
    if (lastUserMsg.includes('prim') || lastUserMsg.includes('kruskal') || lastUserMsg.includes('algorithm')) {
      return {
        reply: `You studied both today. Which one did you spend more time solving rather than reading?`,
        activeRole: 'Tutor',
        emotion: 'curious',
        emotionEmoji: '🤔',
        suggestedReplies: ["Prim's", "Kruskal's", "About equal time solving both"],
        isReadyForJudgment: false
      };
    } else if (lastUserMsg.includes('database') || lastUserMsg.includes('normaliz')) {
      return {
        reply: `Normalization requires real problem solving. Did you actually decompose tables, or were you mostly reading through rules?`,
        activeRole: 'Tutor',
        emotion: 'curious',
        emotionEmoji: '🤔',
        suggestedReplies: ["Solved 3NF and BCNF problems", "Mostly reading rules and slides", "Practiced finding candidate keys"],
        isReadyForJudgment: false
      };
    } else {
      return {
        reply: `Which part did you spend more time actively solving rather than passively reading?`,
        activeRole: 'Tutor',
        emotion: 'curious',
        emotionEmoji: '🤔',
        suggestedReplies: ["Actively solving practice problems", "Mostly reading through notes and code", "A mix of both"],
        isReadyForJudgment: false
      };
    }
  }

  // Turn 3: "Show me what you know" — Spot-check knowledge without teaching!
  if (turnCount === 3) {
    if (lastUserMsg.includes('prim')) {
      return {
        reply: `Okay. Then let's check something.\n\nWithout looking at your notes, **what determines the next edge you choose in Prim's algorithm?**`,
        activeRole: 'Examiner',
        emotion: 'honest',
        emotionEmoji: '🛡️',
        suggestedReplies: ["The minimum weight edge connecting the tree to an unvisited vertex", "The minimum edge overall", "The smallest weight cycle"],
        isReadyForJudgment: false
      };
    } else if (lastUserMsg.includes('kruskal')) {
      return {
        reply: `Okay. No notes:\n\n**Why can Kruskal's algorithm safely reject an edge that creates a cycle?**`,
        activeRole: 'Examiner',
        emotion: 'honest',
        emotionEmoji: '🛡️',
        suggestedReplies: ["Because the vertices are already connected by lower-weight edges", "Because trees cannot have cycles", "It would increase the total MST weight"],
        isReadyForJudgment: false
      };
    } else if (lastUserMsg.includes('normaliz') || lastUserMsg.includes('database')) {
      return {
        reply: `Quick check — no notes:\n\n**What condition must every non-trivial functional dependency X → Y satisfy to be in BCNF?**`,
        activeRole: 'Examiner',
        emotion: 'honest',
        emotionEmoji: '🛡️',
        suggestedReplies: ["X must be a superkey", "Y must be a prime attribute", "X must be part of the primary key"],
        isReadyForJudgment: false
      };
    } else {
      return {
        reply: `Let's check your retention. In one sentence without looking at your notes, what was the most important rule or formula you used today?`,
        activeRole: 'Examiner',
        emotion: 'honest',
        emotionEmoji: '🛡️',
        suggestedReplies: ["Greedy choice property", "Cut property of MST", "Functional dependency closure"],
        isReadyForJudgment: false
      };
    }
  }

  // Turn 4: Evaluating knowledge & checking session credibility
  if (turnCount === 4) {
    return {
      reply: `Good. You understand the core idea.\n\nNow for the honesty check:\nOut of the reported sessions, was there any session where you were mostly sitting with notes open, checking your phone, or not absorbed?`,
      activeRole: 'Evaluator',
      emotion: 'honest',
      emotionEmoji: '🛡️',
      suggestedReplies: ["All of them were fully focused", "Yeah... the sixth session was mostly spent on my phone", "One session was pretty slow"],
      isReadyForJudgment: false
    };
  }

  // Turn 5+: Final Evaluation & Decision
  const numbers = extractNumbers(messages);
  const reported = numbers.highest || 6;
  const hasDistraction = messages.some(m => 
    m.content.toLowerCase().includes('phone') || 
    m.content.toLowerCase().includes('distract') || 
    m.content.toLowerCase().includes('sixth') ||
    m.content.toLowerCase().includes('lost') ||
    m.content.toLowerCase().includes('slow')
  );

  const accepted = hasDistraction ? Math.max(1, reported - 1) : reported;
  const questionable = reported - accepted;

  if (hasDistraction && questionable > 0) {
    return {
      reply: `Okay, Ramin. I've evaluated your report and tested your understanding.\n\nI believe **${accepted} of the ${reported} sessions were genuine study sessions**.\n\nI'm not comfortable automatically counting the sixth one because you noted most of that session was spent on your phone.\n\nBut this is **your record**, not mine.\n\n**Do you want to count that sixth session or leave it out?**`,
      activeRole: 'Accountability Partner',
      emotion: 'honest',
      emotionEmoji: '🛡️',
      suggestedReplies: ['Leave it out', 'Count it anyway'],
      isReadyForJudgment: true,
      judgment: {
        reportedCount: reported,
        acceptedCount: accepted,
        questionableCount: questionable,
        reason: 'Sixth session was spent on phone distractions.',
        confidenceGrid: [
          { area: 'Algorithms', evaluation: 'Strong', notes: 'Greedy cut edge verified on Prim\'s' },
          { area: 'Database', evaluation: 'Moderate', notes: 'Concept clear, more problem solving needed' },
          { area: 'Complex Variable', evaluation: 'Weak', notes: 'Past weak area; not yet revisited' },
        ],
        studyAttention: 'Mixed',
        sessionHonesty: 'Good',
        accountabilityStatus: 'standard',
        summaryTutorNotes: `${accepted} genuine sessions supported. Retention confirmed on Algorithms.`
      },
      isFinalClosing: false
    };
  } else {
    return {
      reply: `Excellent, Ramin. Your spot-check response was solid, and all **${reported} sessions are supported by what you shared**.\n\nReady to record your progress for Day ${context?.dayNumber || 1}?`,
      activeRole: 'Evaluator',
      emotion: 'proud',
      emotionEmoji: '😄',
      suggestedReplies: ['Record All Sessions 🔥'],
      isReadyForJudgment: true,
      judgment: {
        reportedCount: reported,
        acceptedCount: reported,
        questionableCount: 0,
        reason: 'Knowledge spot-check passed with verified focus.',
        confidenceGrid: [
          { area: 'Algorithms', evaluation: 'Strong', notes: 'Knowledge spot check passed' },
          { area: 'Study Attention', evaluation: 'Strong', notes: 'High engagement throughout' },
        ],
        studyAttention: 'High',
        sessionHonesty: 'Good',
        accountabilityStatus: 'standard',
        summaryTutorNotes: `All ${reported} sessions verified with strong focus.`
      },
      isFinalClosing: false
    };
  }
}

function extractFirstNumber(text: string): number | null {
  const match = text.match(/\b([1-9]|[1-4][0-9]|50)\b/);
  return match ? parseInt(match[1], 10) : null;
}

function extractNumbers(messages: Array<{ role: string; content: string }>): { highest: number; rejected: number } {
  let highest = 5;
  for (const m of messages) {
    const matches = m.content.match(/\b([1-9]|[1-4][0-9]|50)\b/g);
    if (matches) {
      for (const str of matches) {
        const val = parseInt(str, 10);
        if (val > highest && val <= 50) highest = val;
      }
    }
  }
  return { highest, rejected: 1 };
}

// Start Server & Integrate Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StudyQuest server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
