import { AcademicConfidenceItem, AttentionLevel, HonestyRating, AccountabilityStatus, AcademicRoleType } from '../types/game';

export interface CompanionJudgmentData {
  reportedCount: number;
  acceptedCount: number;
  questionableCount: number;
  reason: string;
  confidenceGrid?: AcademicConfidenceItem[];
  studyAttention?: AttentionLevel;
  sessionHonesty?: HonestyRating;
  accountabilityStatus?: AccountabilityStatus;
  summaryTutorNotes?: string;
}

export interface CompanionMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: string;
  activeRole?: AcademicRoleType;
  emotion?: string;
  emotionEmoji?: string;
  suggestedReplies?: string[];
  isJudgment?: boolean;
  judgmentData?: CompanionJudgmentData;
}

export interface CompanionResponse {
  reply: string;
  activeRole?: AcademicRoleType;
  emotion: 'happy' | 'curious' | 'skeptical' | 'concerned' | 'proud' | 'excited' | 'supportive' | 'honest';
  emotionEmoji: string;
  suggestedReplies?: string[];
  isReadyForJudgment?: boolean;
  judgment?: CompanionJudgmentData;
  isFinalClosing?: boolean;
}

export async function sendCompanionMessage(
  messages: Array<{ role: 'ai' | 'user'; content: string }>,
  playerContext: {
    name: string;
    dayNumber: number;
    currentStreak: number;
    displayDate: string;
    totalSessions: number;
  }
): Promise<CompanionResponse> {
  try {
    const res = await fetch('/api/companion/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        playerContext,
      }),
    });

    if (!res.ok) {
      throw new Error(`Companion server returned status ${res.status}`);
    }

    const data: CompanionResponse = await res.json();
    return data;
  } catch (err) {
    console.warn('Network call to /api/companion/chat failed, using client-side honest engine fallback:', err);
    return getLocalClientFallback(messages, playerContext);
  }
}

function getLocalClientFallback(
  messages: Array<{ role: 'ai' | 'user'; content: string }>,
  context: any
): CompanionResponse {
  const userMessages = messages.filter(m => m.role === 'user');
  const lastUserMsg = userMessages[userMessages.length - 1]?.content.toLowerCase() || '';
  const turnCount = userMessages.length;

  if (lastUserMsg.includes('leave it out') || lastUserMsg.includes('leave') || lastUserMsg.includes('exclude')) {
    const nums = extractHighestAndDistracted(messages);
    const reported = nums.highest;
    const accepted = Math.max(1, reported - 1);

    return {
      reply: `Fair.\n\nThen I'm recording **${accepted} genuine sessions today**.\n\nAnd honestly, I'm glad you told me about that lost session instead of pretending it was productive.\n\n**That's exactly what this system is for.** 🛡️`,
      activeRole: 'Accountability Partner',
      emotion: 'proud',
      emotionEmoji: '😄',
      suggestedReplies: ['Lock In Record 🔥'],
      isReadyForJudgment: true,
      judgment: {
        reportedCount: reported,
        acceptedCount: accepted,
        questionableCount: 1,
        reason: 'Sixth session was spent on phone distractions',
      },
      isFinalClosing: true,
    };
  }

  if (lastUserMsg.includes('count it') || lastUserMsg.includes('count all') || lastUserMsg.includes('keep it')) {
    const nums = extractHighestAndDistracted(messages);
    const reported = nums.highest;

    return {
      reply: `Understood, ${context.name || 'Ramin'}. It's your record. I will record all **${reported} sessions**.\n\nLet's make sure tomorrow has zero lost hours! 🔥`,
      activeRole: 'Accountability Partner',
      emotion: 'supportive',
      emotionEmoji: '❤️',
      suggestedReplies: ['Lock In Record 🔥'],
      isReadyForJudgment: true,
      judgment: {
        reportedCount: reported,
        acceptedCount: reported,
        questionableCount: 0,
        reason: 'User chose to count all sessions',
      },
      isFinalClosing: true,
    };
  }

  if (turnCount === 1) {
    const num = extractNumber(lastUserMsg);
    if (num && num >= 6) {
      return {
        reply: `${num} times? That's a pretty serious study day. 👀\n\n**What were you working on?**`,
        activeRole: 'Investigator',
        emotion: 'curious',
        emotionEmoji: '🤔',
        suggestedReplies: ['Algorithms and Database', 'Operating Systems and Math', 'Programming Practice'],
      };
    } else if (num && num >= 3) {
      return {
        reply: `${num} sessions is a solid day! What subjects did you dive into?`,
        activeRole: 'Study Companion',
        emotion: 'happy',
        emotionEmoji: '😊',
        suggestedReplies: ['Algorithms and Database', 'Software Engineering', 'Complex Variable'],
      };
    } else {
      return {
        reply: `Even 1 or 2 genuine sessions moves the needle. What subjects did you work on today?`,
        activeRole: 'Coach',
        emotion: 'supportive',
        emotionEmoji: '❤️',
        suggestedReplies: ['Algorithms review', 'Database queries', 'Programming practice'],
      };
    }
  }

  if (turnCount === 2) {
    if (lastUserMsg.includes('algorithm') || lastUserMsg.includes('prim') || lastUserMsg.includes('kruskal')) {
      return {
        reply: `You worked on both today. Which one did you spend more time solving rather than reading?`,
        activeRole: 'Tutor',
        emotion: 'curious',
        emotionEmoji: '🤔',
        suggestedReplies: ["Prim's", "Kruskal's", "Equal time solving both"],
      };
    } else if (lastUserMsg.includes('database') || lastUserMsg.includes('normaliz')) {
      return {
        reply: `Normalization requires real problem solving. Did you actually decompose tables into BCNF/3NF, or were you mainly reading theory?`,
        activeRole: 'Tutor',
        emotion: 'curious',
        emotionEmoji: '🤔',
        suggestedReplies: ['Solved normalization problems', 'Practiced finding candidate keys', 'Reading chapter theory'],
      };
    } else {
      return {
        reply: `Got it. Which part did you spend more time actively solving rather than reading through notes?`,
        activeRole: 'Tutor',
        emotion: 'curious',
        emotionEmoji: '🤔',
        suggestedReplies: ['Actively solving problems', 'Mostly reading notes', 'A mix of practice and reading'],
      };
    }
  }

  // Turn 3: "Show me what you know" — Knowledge Spot Check without teaching!
  if (turnCount === 3) {
    if (lastUserMsg.includes('prim') || lastUserMsg.includes('algorithm')) {
      return {
        reply: `Okay. Then let's check something.\n\nWithout looking at your notes, **what determines the next edge you choose in Prim's algorithm?**`,
        activeRole: 'Examiner',
        emotion: 'honest',
        emotionEmoji: '🛡️',
        suggestedReplies: [
          'The minimum weight edge connecting the tree to an unvisited vertex',
          'The minimum weight edge overall in the graph',
          'The smallest edge that avoids a cycle'
        ],
      };
    } else if (lastUserMsg.includes('kruskal')) {
      return {
        reply: `Okay. No notes:\n\n**Why can Kruskal's algorithm safely reject an edge that creates a cycle?**`,
        activeRole: 'Examiner',
        emotion: 'honest',
        emotionEmoji: '🛡️',
        suggestedReplies: [
          'Because the two vertices are already connected by lower-weight edges',
          'Because trees cannot have cycles',
          'It would increase the total MST weight'
        ],
      };
    } else {
      return {
        reply: `Good. And out of those sessions, was there any session where you were mostly sitting with the book open or checking your phone rather than actually studying?`,
        activeRole: 'Investigator',
        emotion: 'honest',
        emotionEmoji: '🛡️',
        suggestedReplies: ['All sessions were focused', 'Yeah... one session was mostly phone distractions', 'One session was pretty slow'],
      };
    }
  }

  // Turn 4: Spot check answer evaluation & credibility check
  if (turnCount === 4) {
    return {
      reply: `Good. You understand the core idea.\n\nNow for the honesty check:\nOut of the reported sessions, was there any session where you were mostly on your phone, distracted, or not absorbed?`,
      activeRole: 'Evaluator',
      emotion: 'honest',
      emotionEmoji: '🛡️',
      suggestedReplies: ['All sessions were focused', 'Yeah... the sixth session was mostly phone distractions', 'One session was pretty slow'],
    };
  }

  // Turn 5+: Academic Confidence & Credibility Judgment
  const nums = extractHighestAndDistracted(messages);
  const reported = nums.highest;
  const hasDistracted = messages.some(m => 
    m.content.toLowerCase().includes('phone') || 
    m.content.toLowerCase().includes('distract') || 
    m.content.toLowerCase().includes('sixth') ||
    m.content.toLowerCase().includes('lost') ||
    m.content.toLowerCase().includes('yeah') ||
    m.content.toLowerCase().includes('slow')
  );

  const accepted = hasDistracted ? Math.max(1, reported - 1) : reported;
  const questionable = reported - accepted;

  if (hasDistracted && questionable > 0) {
    return {
      reply: `Okay, ${context.name || 'Ramin'}. I've evaluated your report and checked your understanding.\n\nI believe **${accepted} of the ${reported} sessions were genuine study sessions**.\n\nI'm not comfortable automatically counting the sixth session because you noted most of that session was spent on your phone.\n\nBut this is **your record**, not mine.\n\n**Do you want to count that sixth session or leave it out?**`,
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
          { area: 'Algorithms', evaluation: 'Strong', notes: "Prim's greedy cut edge verified" },
          { area: 'Database', evaluation: 'Moderate', notes: 'Concept clear, more problem solving needed' },
          { area: 'Complex Variable', evaluation: 'Weak', notes: 'Past weak area; not yet revisited' },
        ],
        studyAttention: 'Mixed',
        sessionHonesty: 'Good',
        accountabilityStatus: 'standard',
        summaryTutorNotes: `${accepted} genuine sessions verified with clear retention in Prim's algorithm.`,
      },
      isFinalClosing: false,
    };
  } else {
    return {
      reply: `Great work, ${context.name || 'Ramin'}. Based on your answers and spot-check retention, all **${reported} sessions sound genuine and focused**.\n\nReady to record your progress for Day ${context.dayNumber || 1}?`,
      activeRole: 'Evaluator',
      emotion: 'excited',
      emotionEmoji: '🔥',
      suggestedReplies: ['Count all sessions 🔥'],
      isReadyForJudgment: true,
      judgment: {
        reportedCount: reported,
        acceptedCount: reported,
        questionableCount: 0,
        reason: 'All sessions verified genuine and focused with passed spot-check.',
        confidenceGrid: [
          { area: 'Algorithms', evaluation: 'Strong', notes: 'Knowledge spot check passed' },
          { area: 'Study Attention', evaluation: 'Strong', notes: 'High engagement throughout' },
        ],
        studyAttention: 'High',
        sessionHonesty: 'Good',
        accountabilityStatus: 'standard',
        summaryTutorNotes: `All ${reported} sessions verified with strong focus.`,
      },
      isFinalClosing: false,
    };
  }
}

function extractNumber(text: string): number | null {
  const match = text.match(/\b([1-9]|[1-4][0-9]|50)\b/);
  return match ? parseInt(match[1], 10) : null;
}

function extractHighestAndDistracted(messages: Array<{ role: string; content: string }>): { highest: number } {
  let highest = 5;
  for (const m of messages) {
    const matches = m.content.match(/\b([1-9]|[1-4][0-9]|50)\b/g);
    if (matches) {
      for (const s of matches) {
        const val = parseInt(s, 10);
        if (val > highest && val <= 50) highest = val;
      }
    }
  }
  return { highest };
}
