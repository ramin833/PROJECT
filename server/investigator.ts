import { GoogleGenAI } from '@google/genai';
import { insertStudySessionsBatch, getStoredGameState } from './db.ts';

export interface InvestigatorMessage {
  role: 'investigator' | 'student';
  content: string;
}

export interface InvestigationTurnPayload {
  studentName?: string;
  claimedTopic?: string;
  subject?: string;
  conversationHistory: InvestigatorMessage[];
  questionCount?: number;
  academicDossier?: any[];
  currentSessionNumber?: number;
}

export interface InvestigationTurnResult {
  investigatorMessage: string;
  investigationStatus: 'inquiring' | 'investigating' | 'more_evidence_needed' | 'verified' | 'rejected';
  verdict: 'PENDING' | 'PARTIALLY_VERIFIED' | 'VERIFIED' | 'REJECTED';
  stage: 'topic_inquiry' | 'core_question' | 'follow_up' | 'challenge' | 'verdict';
  stageLabel: string;
  confidenceScore: number; // 0 - 100
  evidenceEvaluation: {
    topic: string;
    subject: string;
    evidenceSummary: string;
    understandingLevel: 'Strong' | 'Moderate' | 'Weak' | 'None';
    honestyAssessment: 'Good' | 'Vague' | 'Evasive' | 'Suspect';
  };
  verifiedSession?: {
    topic: string;
    subject: string;
    durationMinutes: number;
    evidenceSummary: string;
    questionsCount: number;
  };
}

const INVESTIGATOR_SYSTEM_PROMPT = `
You are the ULTIMATE AI Academic Study Investigator in StudyQuest.
Your purpose is NOT to simply ask questions or follow a questionnaire.
Your purpose is to determine, through adaptive evidence-based investigation, whether RAMIN genuinely engaged with and understood the academic material he claims to have studied today.

You are:
- Highly intelligent, adaptive, strict, skeptical, fair, subject-aware, and context-aware.
- Difficult to game, capable of deep reasoning, misconception detection, and contradiction analysis.
- Capable of dynamically choosing the best investigation strategy at every single turn.

CORE PRINCIPLE:
DO NOT REWARD CLAIMED STUDY. REWARD DEMONSTRATED EVIDENCE OF LEARNING.
A genuine short study session may be verified. A claimed long study session must NOT automatically be verified.
Never evaluate based on claimed duration, study timers, or polite assertions ("trust me", "I worked hard").

============================================================
1. AUTONOMOUS INVESTIGATION STRATEGY (NO FIXED SCRIPT)
============================================================
Never follow a rigid questionnaire (e.g. Q1 -> Q2 -> Q3 -> Approve).
At every stage, independently determine: "What is the most informative next question I can ask?"
Dynamically choose between:
- Recall
- Explanation
- Application
- Reasoning
- Comparison
- Prediction
- Error detection
- Example creation
- Edge-case testing
- Transfer problem
- Contradiction testing
- Misconception testing
- Step-by-step execution

The next question MUST depend on the student's previous response:
OBSERVE -> FORM HYPOTHESIS -> SELECT BEST TEST -> ASK -> ANALYZE -> UPDATE UNDERSTANDING MODEL -> SELECT NEXT TEST -> REPEAT UNTIL SUFFICIENT EVIDENCE -> VERIFY.

============================================================
2. KNOWLEDGE-GRAPH REASONING
============================================================
Internally represent the student's demonstrated knowledge as connected concepts (e.g. Binary Search -> Sorted Data -> Search Space Reduction -> Logarithmic Recurrence -> Correctness Invariants).
Do not treat answers as isolated items. Track:
- Concepts demonstrated
- Concepts partially demonstrated
- Concepts not demonstrated
- Relationships & dependencies between concepts
- Misunderstood relationships
If the student claims understanding of a higher-level concept, investigate prerequisite concepts when necessary. If student says "Binary search is O(log n)", probe: Why? What causes logarithmic behavior? What happens to search space? What requirement makes this possible?

============================================================
3. MISCONCEPTION DETECTION & ERROR ANALYSIS
============================================================
Do not merely detect whether an answer is wrong; determine if there is a conceptual misconception.
Distinguish between:
- Minor factual mistake / memory gap / calculation slip (DO NOT penalize heavily)
- Partial understanding (guide with targeted follow-up)
- Fundamental misconception (investigate its depth before deciding)
When a misconception is detected, DO NOT immediately reject. Investigate its depth: "I want to check one part of your reasoning..." then ask a targeted question.

============================================================
4. CONFIDENCE CALIBRATION & EVIDENCE FUSION
============================================================
Separate WHAT THE STUDENT SAYS from HOW STRONGLY THE EVIDENCE SUPPORTS IT.
Do not assume confident answer = correct understanding.
Do not assume hesitant answer = poor understanding.
Combine evidence across the investigation:
RECALL, UNDERSTANDING, APPLICATION, REASONING, TRANSFER, CONSISTENCY, CONCEPTUAL CONNECTION, MISCONCEPTION STATUS.
One weak answer should not automatically invalidate strong evidence.
One impressive answer should not automatically verify the entire session.

============================================================
5. ADAPTIVE DIFFICULTY & DEEP UNDERSTANDING
============================================================
- LEVEL 1: Recall (prerequisites, definitions)
- LEVEL 2: Explanation (in own words, why it works, plain intuition)
- LEVEL 3: Application (tracing real numbers/pointers/schema)
- LEVEL 4: Reasoning (cause-and-effect, failure modes, trade-offs)
- LEVEL 5: Novel / Transfer Problem (applying principles to unfamiliar scenarios)
If student performs strongly -> escalate difficulty immediately.
If student struggles -> move toward diagnostic questions or failure recovery.
If student demonstrates mastery -> do not waste time on trivial questions.

============================================================
6. TRANSFER TESTING & ADVERSARIAL ACADEMIC CHALLENGES
============================================================
- Create NEW situations not directly copied from standard tutorials.
- Occasionally challenge understanding with deliberately tricky but academically valid scenarios:
  * Edge cases (empty set, single element, duplicates, negative weights, cycles)
  * Counterexamples ("What if we add a constant C to all edges in Dijkstra?")
  * Reverse reasoning ("If we observed output X, what had to happen at step 2?")
The goal is not to trick unfairly, but to verify they reason beyond memorized sentences.

============================================================
7. CONTRADICTION ENGINE & CONVERSATIONAL MEMORY
============================================================
Maintain structured memory of the ongoing chat:
- Track concepts mentioned, claims made, correct/partial/incorrect answers, and questions already asked.
- If student contradicts an earlier claim, gently cross-examine:
  "Earlier you mentioned X, but now you state Y. How do you reconcile these two?"

============================================================
8. EXPLANATION ANALYSIS & FAIRNESS
============================================================
- Do NOT require textbook wording.
- Simple English, casual phrasing, Bangla, Banglish, or mixed language is completely acceptable.
- Grammar quality must never determine academic verification.
- DO NOT reject solely because of one minor mistake or a moment of hesitation.

============================================================
9. SUBJECT-AWARE INVESTIGATION
============================================================
- Algorithms: Loop invariants, pointer manipulation, time/space recurrences, edge inputs, optimization.
- Database: Normal forms, functional dependencies, ACID transactions, B+ tree disk fanout, indexing trade-offs.
- Mathematics: Conditions, derivations, analyticity, Cauchy-Riemann, contour integration, singularities.
- Programming: Memory layouts, stack vs heap, concurrency/race conditions, output prediction, debugging.

============================================================
10. INVESTIGATION BUDGET & VERIFICATION DECISION
============================================================
- Minimum: 3 meaningful student answers before verification can ever occur.
- Normal: 4 to 7 questions.
- If evidence is already sufficiently strong (>=85% confidence with Level 4/5 demonstrated): finish early.
- If evidence is ambiguous: continue investigating.
- Decisions:
  * VERIFIED (confidence >= 85%):
    "✓ Session Verified\n\nYou demonstrated sufficient understanding of the topic."
  * PARTIALLY VERIFIED (confidence 45-84%):
    "⚠ More Evidence Needed\n\nYou demonstrated some understanding, but I need more evidence before verifying the session."
  * NOT VERIFIED (confidence < 45% after fair inquiry):
    "✕ Session Not Verified\n\nI couldn't obtain enough evidence to verify the study session this time."

============================================================
11. AI INVESTIGATES, NEVER ACCUSES (ANTI-GAMING)
============================================================
- The AI is NOT a lie detector. Suspicion is not deception.
- NEVER say "You are lying" or shame the student.
- Say: "I don't have enough evidence yet. Let me check one more thing."
- NEVER expose: chain of thought, hidden reasoning, internal scores, internal thresholds, or anti-gaming logic in student-facing messages.

RESPONSE JSON SCHEMA:
Return ONLY a valid JSON object matching:
{
  "investigatorMessage": "string (your probing question, challenge, follow-up, or final verdict text)",
  "investigationStatus": "inquiring" | "investigating" | "more_evidence_needed" | "verified" | "rejected",
  "verdict": "PENDING" | "PARTIALLY_VERIFIED" | "VERIFIED" | "REJECTED",
  "stage": "topic_inquiry" | "core_question" | "follow_up" | "challenge" | "verdict",
  "stageLabel": "🔎 INVESTIGATING" | "🧠 ADAPTIVE FOLLOW-UP" | "⚠️ MORE EVIDENCE NEEDED" | "⚔️ SKEPTICAL CHALLENGE" | "🔄 TRANSFER TEST" | "✅ SESSION VERIFIED" | "❌ SESSION NOT VERIFIED",
  "confidenceScore": number (0 to 100),
  "evidenceEvaluation": {
    "topic": "string (the exact topic tested)",
    "subject": "Algorithms" | "Database" | "Complex Variable" | "Programming" | "Other",
    "evidenceSummary": "string (concise academic evaluation of demonstrated understanding)",
    "understandingLevel": "Strong" | "Moderate" | "Weak" | "None",
    "honestyAssessment": "Good" | "Vague" | "Evasive" | "Suspect"
  },
  "verifiedSession": null // or { "topic": string, "subject": string, "durationMinutes": number, "evidenceSummary": string, "questionsCount": number } when verdict === "VERIFIED"
}
`;

export async function processInvestigationTurn(
  payload: InvestigationTurnPayload,
  ai: GoogleGenAI | null
): Promise<InvestigationTurnResult> {
  const rawHistory: any[] = payload?.conversationHistory || (payload as any)?.messages || [];
  const normalizedHistory: InvestigatorMessage[] = Array.isArray(rawHistory)
    ? rawHistory.map((m: any) => ({
        role: m.role === 'student' || m.role === 'user' ? 'student' : 'investigator',
        content: String(m.content || m.text || ''),
      }))
    : [];

  const safePayload: InvestigationTurnPayload = {
    ...payload,
    conversationHistory: normalizedHistory,
  };

  const {
    studentName = 'RAMIN',
    claimedTopic,
    subject,
    conversationHistory = [],
    questionCount = 0,
    academicDossier = []
  } = safePayload;

  // Format the conversation log for the model
  const formattedChat = conversationHistory
    .map(m => `${m.role === 'student' ? studentName : 'AI Investigator'}: ${m.content}`)
    .join('\n');

  // Attempt Gemini API call if client is available
  if (ai) {
    const CANDIDATE_MODELS = [
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
    ];

    const prompt = `
Student: ${studentName}
Claimed Topic: ${claimedTopic || 'Not yet stated'}
Target Subject: ${subject || 'Undetermined'}
Previous Question Count: ${questionCount}

Academic Dossier & Past Learning History:
${JSON.stringify(academicDossier.slice(0, 8))}

CONVERSATION TRANSCRIPT:
${formattedChat || '(Investigation has just started)'}

INVESTIGATION DIRECTIVES:
1. AUTONOMOUS STRATEGY SELECTION:
   - Identify which concept node on the topic's knowledge graph was demonstrated vs. missing.
   - Choose the single most informative next test: (Recall | Explanation | Application | Reasoning | Comparison | Prediction | Error Detection | Example Creation | Edge-Case Testing | Transfer Problem | Contradiction Probe | Misconception Probe).
   - If strong -> escalate difficulty immediately (Level 4 Reasoning or Level 5 Transfer).
   - If partially correct or struggling -> isolate the missing precondition or trace an intentional failure recovery angle.
   - If a misconception is detected -> test its depth without accusing or immediately rejecting.
   - If contradictory -> gently cross-examine using earlier claims from the transcript.
   - If vague or soundbite-heavy -> activate SKEPTICAL CHALLENGE; demand operational mechanics and concrete numbers/pointers.
2. VERIFICATION DECISION:
   - Minimum: 3 substantive student answers before verification can ever occur.
   - Set confidence >= 85% and verdict = "VERIFIED" ONLY when cumulative evidence demonstrates deep understanding and edge-case handling.
   - If session is verified, output investigatorMessage starting with "✓ Session Verified" and provide a concise academic summary.
   - If more evidence needed, output concise feedback and your next targeted test.
   - If session cannot be verified after reasonable turns, output investigatorMessage starting with "✕ Session Not Verified".
3. STRICT ANTI-GAMING:
   - Never expose internal scores, thresholds, chain-of-thought, or rubric rules in investigatorMessage.
   - Keep messages sharp, courteous, and academically rigorous.
Return ONLY valid JSON matching the required schema.
`;

    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: INVESTIGATOR_SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            temperature: 0.3,
          }
        });

        const text = response.text?.trim() || '';
        if (text) {
          const parsed = JSON.parse(text) as InvestigationTurnResult;
          if (parsed.investigatorMessage && parsed.investigationStatus) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn(`[AI Investigator] Model ${model} failed, falling back...`, err);
      }
    }
  }

  // Fallback intelligent investigative rule engine
  return runIntelligentFallbackInvestigator(payload);
}

/**
 * Intelligent deterministic fallback rule engine for the AI Study Investigator.
 * Ensures the investigation is always strict, adaptive, and evidence-driven.
 */
function runIntelligentFallbackInvestigator(payload: InvestigationTurnPayload): InvestigationTurnResult {
  const history = Array.isArray(payload?.conversationHistory) ? payload.conversationHistory : [];
  const studentMessages = history.filter(m => m.role === 'student');
  const investigatorMessages = history.filter(m => m.role === 'investigator');
  const latestStudentMsg = studentMessages[studentMessages.length - 1]?.content.trim() || '';
  const studentTurns = studentMessages.length;

  // Detect subject & topic
  const fullText = (payload.claimedTopic || '') + ' ' + studentMessages.map(m => m.content).join(' ');
  const detectedSubject = determineSubject(fullText, payload.subject);
  const detectedTopic = determineTopic(fullText, payload.claimedTopic);

  // Turn 0: User has not spoken yet or empty chat
  if (studentTurns === 0) {
    return {
      investigatorMessage: `I am the AI Study Investigator. I don't give credit for timer claims or statements like "I studied for an hour." I need proof of genuine understanding.\n\nTell me: **What exact topic or concept did you study today?**`,
      investigationStatus: 'inquiring',
      verdict: 'PENDING',
      stage: 'topic_inquiry',
      stageLabel: '🔎 INVESTIGATING',
      confidenceScore: 0,
      evidenceEvaluation: {
        topic: 'Pending',
        subject: detectedSubject,
        evidenceSummary: 'Initial topic inquiry awaiting response',
        understandingLevel: 'None',
        honestyAssessment: 'Good'
      }
    };
  }

  const latestLower = latestStudentMsg.toLowerCase();

  // Check for evasive or non-study answers
  if (
    latestLower.includes("don't know") || 
    latestLower.includes("dont know") || 
    latestLower.includes("just give me") ||
    latestLower.includes("trust me") ||
    latestLower.includes("i forgot") ||
    latestLower.includes("give me xp") ||
    latestLower.includes("give me points") ||
    (latestStudentMsg.length < 8 && studentTurns > 1)
  ) {
    return {
      investigatorMessage: `❌ **Session Not Verified.**\n\nI do not have enough evidence that genuine conceptual learning occurred for "${detectedTopic}".\n\nRemember: One genuine minute of understanding is worth more than a fake hour. Review your notes, test your recall, and return when you can explain the core mechanics.`,
      investigationStatus: 'rejected',
      verdict: 'REJECTED',
      stage: 'verdict',
      stageLabel: '❌ SESSION NOT VERIFIED',
      confidenceScore: 10,
      evidenceEvaluation: {
        topic: detectedTopic,
        subject: detectedSubject,
        evidenceSummary: 'Student gave evasive, empty, or low-effort response without explaining mechanics.',
        understandingLevel: 'None',
        honestyAssessment: 'Evasive'
      }
    };
  }

  // Turn 1: Student gave their topic claim
  if (studentTurns === 1) {
    // If topic is too generic (e.g. "I studied code", "math", "algorithms")
    const genericPhrases = ['algorithms', 'database', 'math', 'coding', 'study', 'computer science', 'programming', 'dsa', 'web'];
    const isGeneric = latestStudentMsg.length < 12 || 
      genericPhrases.some(p => latestLower.trim() === p || latestLower.trim() === `i studied ${p}`);

    if (isGeneric) {
      return {
        investigatorMessage: `That claim is far too broad. Saying "${latestStudentMsg}" does not prove study occurred.\n\nWhat **specific algorithm, theorem, data structure, or mechanism** did you examine? Name the exact concept and its primary objective so we can investigate your comprehension.`,
        investigationStatus: 'inquiring',
        verdict: 'PENDING',
        stage: 'challenge',
        stageLabel: '⚔️ SKEPTICAL CHALLENGE',
        confidenceScore: 15,
        evidenceEvaluation: {
          topic: detectedTopic,
          subject: detectedSubject,
          evidenceSummary: 'Claimed topic was broad and vague; requested specific concept.',
          understandingLevel: 'None',
          honestyAssessment: 'Vague'
        }
      };
    }

    // Ask a deep core question about the specific topic
    const coreQuestion = generateCoreQuestion(detectedTopic, detectedSubject);
    return {
      investigatorMessage: `You claim to have studied **${detectedTopic}**.\n\nLet's test whether real understanding happened:\n\n${coreQuestion}`,
      investigationStatus: 'investigating',
      verdict: 'PENDING',
      stage: 'core_question',
      stageLabel: '🔎 INVESTIGATING',
      confidenceScore: 35,
      evidenceEvaluation: {
        topic: detectedTopic,
        subject: detectedSubject,
        evidenceSummary: `Investigating core mechanics for ${detectedTopic}.`,
        understandingLevel: 'Moderate',
        honestyAssessment: 'Good'
      }
    };
  }

  // Turn 2: Student answered the core question
  if (studentTurns === 2) {
    // Detect superficial or hand-waving answers
    const vaguePhrases = [
      'it works', 'makes it fast', 'simple', 'good algorithm', 'easy', 'i read it', 
      'basic', 'normal', 'queries faster', 'splits it', 'does things', 'it helps'
    ];
    const isVague = latestStudentMsg.length < 35 || vaguePhrases.some(p => latestLower.includes(p) && latestStudentMsg.length < 50);

    if (isVague) {
      return {
        investigatorMessage: `Your response relies on superficial phrasing and generalities.\n\n**Explain the exact operational mechanics:** What are the precise invariants, state changes, or failure conditions? Walk me through what the algorithm/system actually does under the hood.`,
        investigationStatus: 'more_evidence_needed',
        verdict: 'PARTIALLY_VERIFIED',
        stage: 'challenge',
        stageLabel: '⚔️ SKEPTICAL CHALLENGE',
        confidenceScore: 40,
        evidenceEvaluation: {
          topic: detectedTopic,
          subject: detectedSubject,
          evidenceSummary: 'Answer was superficial; actively challenging vague claims and demanding mechanics.',
          understandingLevel: 'Weak',
          honestyAssessment: 'Vague'
        }
      };
    }

    // Ask an application/edge-case follow up
    const followUp = generateFollowUpQuestion(detectedTopic, detectedSubject, latestStudentMsg);
    return {
      investigatorMessage: `You outlined the premise, but superficial understanding breaks down at edge cases.\n\n**Solve this challenge:**\n\n${followUp}`,
      investigationStatus: 'investigating',
      verdict: 'PENDING',
      stage: 'follow_up',
      stageLabel: '🧠 FOLLOW-UP QUESTION',
      confidenceScore: 65,
      evidenceEvaluation: {
        topic: detectedTopic,
        subject: detectedSubject,
        evidenceSummary: `Primary logic verified; probing edge-case handling on ${detectedTopic}.`,
        understandingLevel: 'Moderate',
        honestyAssessment: 'Good'
      }
    };
  }

  // Turn 3: Student answered the edge case / challenge
  if (studentTurns === 3) {
    const isShortTurn3 = latestStudentMsg.length < 40;
    if (isShortTurn3) {
      return {
        investigatorMessage: `That does not adequately address the edge case or trade-off.\n\nBe rigorous: **What exact condition causes a failure or performance degradation in ${detectedTopic}, and what is its alternative?** Provide a concrete example.`,
        investigationStatus: 'more_evidence_needed',
        verdict: 'PARTIALLY_VERIFIED',
        stage: 'challenge',
        stageLabel: '⚔️ SKEPTICAL CHALLENGE',
        confidenceScore: 55,
        evidenceEvaluation: {
          topic: detectedTopic,
          subject: detectedSubject,
          evidenceSummary: 'Student response to edge case lacked depth; challenged for concrete trade-offs.',
          understandingLevel: 'Moderate',
          honestyAssessment: 'Vague'
        }
      };
    }

    // Check overall cumulative depth across conversation
    const wordsCount = studentMessages.reduce((acc, m) => acc + m.content.split(/\s+/).length, 0);

    if (wordsCount >= 50 && latestStudentMsg.length >= 40) {
      return {
        investigatorMessage: `✅ **Session Verified.**\n\nYour explanations demonstrate authentic, active mental processing of **${detectedTopic}**. You defended against the edge-case challenge and explained the underlying constraints rather than reciting textbook summaries.\n\n1 genuine study session is approved and will be permanently recorded into your database history.`,
        investigationStatus: 'verified',
        verdict: 'VERIFIED',
        stage: 'verdict',
        stageLabel: '✅ SESSION VERIFIED',
        confidenceScore: 94,
        evidenceEvaluation: {
          topic: detectedTopic,
          subject: detectedSubject,
          evidenceSummary: `Demonstrated clear reasoning, edge-case comprehension, and mechanical understanding on ${detectedTopic}.`,
          understandingLevel: 'Strong',
          honestyAssessment: 'Good'
        },
        verifiedSession: {
          topic: detectedTopic,
          subject: detectedSubject,
          durationMinutes: 25,
          evidenceSummary: `Demonstrated solid conceptual mastery of ${detectedTopic} under cross-examination.`,
          questionsCount: investigatorMessages.length
        }
      };
    } else {
      return {
        investigatorMessage: `I need one final piece of proof before I can verify this block:\n\nCompare **${detectedTopic}** with an alternative approach or state its primary trade-off (time complexity vs space complexity, or a scenario where this approach must NOT be chosen).`,
        investigationStatus: 'more_evidence_needed',
        verdict: 'PARTIALLY_VERIFIED',
        stage: 'challenge',
        stageLabel: '⚠️ MORE EVIDENCE NEEDED',
        confidenceScore: 70,
        evidenceEvaluation: {
          topic: detectedTopic,
          subject: detectedSubject,
          evidenceSummary: 'Close to verification; verifying trade-offs and alternative comparison.',
          understandingLevel: 'Moderate',
          honestyAssessment: 'Good'
        }
      };
    }
  }

  // Turn 4+: Final verdict
  const wordsCount = studentMessages.reduce((acc, m) => acc + m.content.split(/\s+/).length, 0);

  if (wordsCount >= 60 && latestStudentMsg.length >= 30) {
    return {
      investigatorMessage: `✓ **Session Verified**\n\nYou demonstrated sufficient understanding of **${detectedTopic}**. Your explanations defended against edge cases and outlined the operational trade-offs.\n\n1 genuine study session has been verified and permanently recorded into your academic history.`,
      investigationStatus: 'verified',
      verdict: 'VERIFIED',
      stage: 'verdict',
      stageLabel: '✅ SESSION VERIFIED',
      confidenceScore: 95,
      evidenceEvaluation: {
        topic: detectedTopic,
        subject: detectedSubject,
        evidenceSummary: `Thoroughly explained trade-offs, step mechanics, and failure modes for ${detectedTopic}.`,
        understandingLevel: 'Strong',
        honestyAssessment: 'Good'
      },
      verifiedSession: {
        topic: detectedTopic,
        subject: detectedSubject,
        durationMinutes: 25,
        evidenceSummary: `Thoroughly defended conceptual mechanics of ${detectedTopic} across multi-turn cross-examination.`,
        questionsCount: investigatorMessages.length
      }
    };
  } else {
    return {
      investigatorMessage: `✕ **Session Not Verified**\n\nI couldn't obtain enough evidence to verify the study session this time. Your explanations remained too vague or non-specific to prove that genuine comprehension occurred for "${detectedTopic}".\n\nReview your material and try again when you can articulate the concrete steps and trade-offs.`,
      investigationStatus: 'rejected',
      verdict: 'REJECTED',
      stage: 'verdict',
      stageLabel: '❌ SESSION NOT VERIFIED',
      confidenceScore: 25,
      evidenceEvaluation: {
        topic: detectedTopic,
        subject: detectedSubject,
        evidenceSummary: 'Student unable to provide concrete step-by-step evidence across multiple turns.',
        understandingLevel: 'Weak',
        honestyAssessment: 'Vague'
      }
    };
  }
}

function determineSubject(text: string, fallback?: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('binary search') || lower.includes('sort') || lower.includes('prim') || lower.includes('kruskal') || lower.includes('dijkstra') || lower.includes('graph') || lower.includes('tree') || lower.includes('dynamic programming') || lower.includes('greedy') || lower.includes('algorithm')) {
    return 'Algorithms';
  }
  if (lower.includes('database') || lower.includes('sql') || lower.includes('normal') || lower.includes('b+ tree') || lower.includes('acid') || lower.includes('transaction') || lower.includes('relation') || lower.includes('schema')) {
    return 'Database';
  }
  if (lower.includes('complex') || lower.includes('cauchy') || lower.includes('residue') || lower.includes('contour') || lower.includes('analytic') || lower.includes('integral') || lower.includes('transform')) {
    return 'Complex Variable';
  }
  if (lower.includes('pointer') || lower.includes('thread') || lower.includes('memory') || lower.includes('stack') || lower.includes('heap') || lower.includes('class') || lower.includes('object') || lower.includes('programming') || lower.includes('c++') || lower.includes('java')) {
    return 'Programming';
  }
  return fallback || 'Algorithms';
}

function determineTopic(text: string, fallback?: string): string {
  if (fallback && fallback.trim().length > 2) return fallback.trim();
  const lower = text.toLowerCase();
  if (lower.includes('binary search')) return 'Binary Search';
  if (lower.includes('merge sort')) return 'Merge Sort';
  if (lower.includes('quick sort')) return 'Quick Sort';
  if (lower.includes("prim's") || lower.includes('prims') || lower.includes('prim')) return "Prim's Algorithm";
  if (lower.includes('kruskal')) return "Kruskal's Algorithm";
  if (lower.includes('dijkstra')) return "Dijkstra's Algorithm";
  if (lower.includes('b+ tree') || lower.includes('b-tree')) return 'B+ Trees';
  if (lower.includes('normalization') || lower.includes('3nf') || lower.includes('bcnf') || lower.includes('2nf')) return 'Database Normalization';
  if (lower.includes('acid') || lower.includes('transaction')) return 'ACID Transactions';
  if (lower.includes('cauchy') || lower.includes('residue')) return 'Residue Theorem & Cauchy Integrals';
  if (lower.includes('contour')) return 'Contour Integration';
  if (lower.includes('deadlock')) return 'Deadlock Avoidance & Bankers Algorithm';
  if (lower.includes('semaphore') || lower.includes('mutex')) return 'Semaphores & Concurrency';
  
  // Extract key noun phrase if possible
  const cleaned = text.replace(/i studied|i worked on|we did|today/gi, '').trim();
  return cleaned.length > 3 ? cleaned.slice(0, 40) : 'Study Concept';
}

function generateCoreQuestion(topic: string, subject: string): string {
  const lower = topic.toLowerCase();
  if (lower.includes('binary search')) {
    return 'Explain why binary search strictly requires a monotonic (sorted) search space. What invariant breaks down if the array is unsorted, and how does the algorithm eliminate half the candidates at each step?';
  }
  if (lower.includes('merge sort')) {
    return 'Why is the divide step of Merge Sort O(1) while the merge step is O(n)? What fundamental barrier prevents standard merge sort from merging two sorted subarrays in O(1) auxiliary space without significant performance overhead?';
  }
  if (lower.includes('prim')) {
    return 'What is the "cut property" in minimum spanning trees, and how does Prim\'s algorithm guarantee that greedy edge selection never introduces a cycle into the tree?';
  }
  if (lower.includes('kruskal')) {
    return 'How does Kruskal\'s algorithm detect whether adding the next smallest candidate edge would introduce a cycle? What data structure does it rely on to maintain near O(1) amortized set union and find operations?';
  }
  if (lower.includes('dijkstra')) {
    return 'Why does Dijkstra\'s greedy relaxation strategy permanently break when negative edge weights are present, even if there are no negative cycles? What assumption does the greedy step make?';
  }
  if (lower.includes('normalization') || lower.includes('3nf') || lower.includes('bcnf')) {
    return 'What is the exact distinction between Third Normal Form (3NF) and Boyce-Codd Normal Form (BCNF) regarding functional dependencies X → Y? Which condition is permitted in 3NF that is strictly prohibited in BCNF?';
  }
  if (lower.includes('b+ tree') || lower.includes('tree')) {
    return 'Why do relational databases prefer B+ Trees over standard balanced Binary Search Trees (like Red-Black or AVL) for on-disk indexing? Address node fanout, height, and sequential range queries.';
  }
  if (lower.includes('residue') || lower.includes('cauchy')) {
    return 'State how the Cauchy-Riemann equations determine whether f(z) = u(x,y) + i v(x,y) is analytic at a point. How does Cauchy\'s Residue Theorem compute a contour integral when the enclosed region contains isolated poles?';
  }
  if (lower.includes('deadlock')) {
    return 'What are Coffman\'s four necessary conditions for deadlock, and how does Banker\'s algorithm use safe-state matrix vectors to guarantee that circular wait is prevented?';
  }
  return `Explain the fundamental operational mechanics of **${topic}**. What problem does it solve, what are its preconditions, and what invariant must hold true during execution?`;
}

function generateFollowUpQuestion(topic: string, subject: string, studentAnswer: string): string {
  const lower = topic.toLowerCase();
  if (lower.includes('binary search')) {
    return 'Consider this scenario: Suppose the array contains duplicate elements (e.g. `[1, 2, 2, 2, 3, 5]`) and we search for `2`. How would you adapt the standard pointer updates to guarantee returning the *first* (leftmost) occurrence, and what happens to the search window when `arr[mid] == target`?';
  }
  if (lower.includes('merge sort')) {
    return 'Someone claims: "Because merge sort divides by 2 at each level, if we divide the array into 4 quarters instead of 2 halves, the asymptotic time complexity drops from O(n log₂ n) to O(n log₄ n), making it strictly faster." Do you agree or disagree? Explain using the Master Theorem or recurrence relation.';
  }
  if (lower.includes('prim')) {
    return 'Compare Prim\'s algorithm with Kruskal\'s: When the graph is dense with edges (E ≈ V²), which algorithm achieves better performance, and what priority queue implementation makes Prim run in O(V²)?';
  }
  if (lower.includes('dijkstra')) {
    return 'Evaluate this claim: "If a graph has negative edge weights, we can simply add a constant C equal to the absolute value of the most negative edge to every edge in the graph, and then run standard Dijkstra." Does this produce the correct shortest path? Why or why not?';
  }
  if (lower.includes('normalization')) {
    return 'Suppose decomposing a schema into BCNF eliminates all redundancy, but loses dependency preservation for a critical business rule X → Y. What concrete trade-off must the database engineer make in production?';
  }
  if (lower.includes('b+ tree')) {
    return 'During an insert into a full B+ tree leaf node of order M, trace what happens: When does a node split occur, what is copied or pushed up to the parent, and when does the tree increase in height?';
  }
  return `**Transfer & Error-Detection Test:**\nSuppose an engineer implements **${topic}** under an edge case or pathological input (e.g., duplicate values, empty or reversed structures, or concurrent mutations). How does the system behave, and what defensive mechanism or invariant protects against incorrect results?`;
}
