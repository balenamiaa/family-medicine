// SM-2 Spaced Repetition Algorithm
// Based on the SuperMemo SM-2 algorithm with response time integration

export interface ReviewCard {
  questionIndex: number;
  easeFactor: number; // Starting at 2.5
  interval: number; // Days until next review
  repetitions: number; // Number of successful reviews
  nextReviewDate: number; // Timestamp
  lastAnsweredCorrect: boolean;
  lastReviewDate: number;
  averageResponseTimeMs?: number; // Rolling average response time
  totalResponses?: number; // Count for calculating average
}

export interface SpacedRepetitionData {
  cards: Record<number, ReviewCard>;
  reviewHistory: ReviewHistoryEntry[];
}

export interface ReviewHistoryEntry {
  questionIndex: number;
  timestamp: number;
  correct: boolean;
  responseTimeMs?: number;
  quality?: Quality;
  prevCard?: ReviewCard | null;
}

const STORAGE_KEY = "medcram_spaced_repetition";
const DEFAULT_RESPONSE_TIME_MS = 15000; // 15 seconds as baseline

// Quality ratings for SM-2
// 0: Complete blackout - no recall at all
// 1: Incorrect - but recognized the answer when shown
// 2: Incorrect - but upon seeing answer, felt familiar
// 3: Correct - but required significant effort to recall
// 4: Correct - with some hesitation
// 5: Perfect - instant recall with confidence
export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Determines quality based on correctness and response time.
 * Uses the card's historical average response time as a baseline.
 */
export function qualityFromResponse(
  correct: boolean,
  responseTimeMs: number,
  averageResponseTimeMs: number = DEFAULT_RESPONSE_TIME_MS
): Quality {
  if (!correct) {
    // Incorrect answers: differentiate between complete failure and partial recall
    // If they answered quickly (wrong), it's a complete blackout (0)
    // If they took time thinking (wrong), they had some familiarity (1)
    if (responseTimeMs < averageResponseTimeMs * 0.5) {
      return 0; // Quick wrong answer - complete blackout
    }
    return 1; // Slow wrong answer - had some memory but couldn't retrieve
  }

  // Correct answers: differentiate by response speed
  const ratio = responseTimeMs / averageResponseTimeMs;

  if (ratio < 0.5) {
    return 5; // Very fast - perfect recall
  } else if (ratio < 0.8) {
    return 4; // Somewhat fast - good recall with minor hesitation
  } else if (ratio < 1.2) {
    return 4; // Around average - normal recall
  } else if (ratio < 2.0) {
    return 3; // Slow - correct but difficult
  } else {
    return 3; // Very slow - significant struggle
  }
}

/**
 * Legacy function for backwards compatibility.
 * Prefer qualityFromResponse when response time is available.
 */
export function qualityFromCorrectness(correct: boolean, hesitation: boolean = false): Quality {
  if (!correct) return 1;
  if (hesitation) return 3;
  return 4;
}

export function calculateNextReview(
  card: ReviewCard | null,
  quality: Quality
): ReviewCard {
  const now = Date.now();

  if (!card) {
    // New card
    card = {
      questionIndex: -1,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReviewDate: now,
      lastAnsweredCorrect: false,
      lastReviewDate: now,
    };
  }

  let { easeFactor, interval, repetitions } = card;

  if (quality < 3) {
    // Incorrect - reset repetitions
    repetitions = 0;
    interval = 1; // Review tomorrow
  } else {
    // Correct
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor (minimum 1.3)
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const nextReviewDate = now + interval * 24 * 60 * 60 * 1000;

  return {
    ...card,
    easeFactor,
    interval,
    repetitions,
    nextReviewDate,
    lastAnsweredCorrect: quality >= 3,
    lastReviewDate: now,
  };
}

function resolveKey(storageKey?: string): string {
  return storageKey ?? STORAGE_KEY;
}

export function getStoredData(storageKey?: string): SpacedRepetitionData {
  if (typeof window === "undefined") {
    return { cards: {}, reviewHistory: [] };
  }

  try {
    const stored = localStorage.getItem(resolveKey(storageKey));
    if (stored) {
      return JSON.parse(stored) as SpacedRepetitionData;
    }
  } catch (error) {
    console.warn("[SpacedRepetition] Failed to parse stored data:", error);
  }

  return { cards: {}, reviewHistory: [] };
}

export function saveData(data: SpacedRepetitionData, storageKey?: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(resolveKey(storageKey), JSON.stringify(data));
  } catch (error) {
    console.error("[SpacedRepetition] Failed to save data:", error);
    // Could be storage quota exceeded
    if (error instanceof Error && error.name === "QuotaExceededError") {
      // Try to free up space by trimming history
      data.reviewHistory = data.reviewHistory.slice(-500);
      try {
        localStorage.setItem(resolveKey(storageKey), JSON.stringify(data));
        console.info("[SpacedRepetition] Trimmed history to save space");
      } catch {
        console.error("[SpacedRepetition] Still unable to save after trimming");
      }
    }
  }
}

/**
 * Records an answer with optional response time for better quality calculation.
 * @param questionIndex - The index of the question being answered
 * @param correct - Whether the answer was correct
 * @param responseTimeMs - Optional time taken to answer in milliseconds
 */
export function recordAnswer(
  questionIndex: number,
  correct: boolean,
  responseTimeMs?: number,
  options?: { quality?: Quality; storageKey?: string }
): SpacedRepetitionData {
  const data = getStoredData(options?.storageKey);
  const existingCard = data.cards[questionIndex] || null;

  // Calculate quality using response time if available
  let quality: Quality;
  if (options?.quality !== undefined) {
    quality = options.quality;
  } else if (responseTimeMs !== undefined && responseTimeMs > 0) {
    const avgTime = existingCard?.averageResponseTimeMs ?? DEFAULT_RESPONSE_TIME_MS;
    quality = qualityFromResponse(correct, responseTimeMs, avgTime);
  } else {
    quality = qualityFromCorrectness(correct);
  }

  const previousCard = existingCard ? { ...existingCard } : null;
  const updatedCard = calculateNextReview(
    existingCard ? { ...existingCard, questionIndex } : null,
    quality
  );
  updatedCard.questionIndex = questionIndex;

  // Update rolling average response time
  if (responseTimeMs !== undefined && responseTimeMs > 0) {
    const prevAvg = existingCard?.averageResponseTimeMs ?? DEFAULT_RESPONSE_TIME_MS;
    const prevCount = existingCard?.totalResponses ?? 0;
    const newCount = prevCount + 1;
    // Exponential moving average with more weight on recent responses
    updatedCard.averageResponseTimeMs = prevAvg * 0.7 + responseTimeMs * 0.3;
    updatedCard.totalResponses = newCount;
  }

  data.cards[questionIndex] = updatedCard;
  data.reviewHistory.push({
    questionIndex,
    timestamp: Date.now(),
    correct,
    responseTimeMs,
    quality,
    prevCard: previousCard,
  });

  // Keep only last 1000 history entries
  if (data.reviewHistory.length > 1000) {
    data.reviewHistory = data.reviewHistory.slice(-1000);
  }

  saveData(data, options?.storageKey);
  return data;
}

export function overrideLastReviewQuality(
  questionIndex: number,
  quality: Quality,
  storageKey?: string
): SpacedRepetitionData {
  const data = getStoredData(storageKey);
  const history = data.reviewHistory;

  const lastIndexFromEnd = [...history].reverse().findIndex(
    (entry) => entry.questionIndex === questionIndex
  );
  if (lastIndexFromEnd === -1) return data;

  const entryIndex = history.length - 1 - lastIndexFromEnd;
  const entry = history[entryIndex];
  if (!entry) return data;

  const baseCard = entry.prevCard ? { ...entry.prevCard, questionIndex } : null;
  if (baseCard) {
    const updatedCard = calculateNextReview(baseCard, quality);
    updatedCard.questionIndex = questionIndex;
    data.cards[questionIndex] = updatedCard;
  }

  history[entryIndex] = {
    ...entry,
    quality,
  };

  saveData(data, storageKey);
  return data;
}

export function getDueCards(data: SpacedRepetitionData): ReviewCard[] {
  const now = Date.now();
  return Object.values(data.cards)
    .filter((card) => card.nextReviewDate <= now)
    .sort((a, b) => a.nextReviewDate - b.nextReviewDate);
}

export function getFailedCards(data: SpacedRepetitionData): ReviewCard[] {
  return Object.values(data.cards)
    .filter((card) => !card.lastAnsweredCorrect)
    .sort((a, b) => b.lastReviewDate - a.lastReviewDate);
}

export function getCardsNeedingReview(data: SpacedRepetitionData): ReviewCard[] {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  return Object.values(data.cards)
    .filter((card) => !card.lastAnsweredCorrect || card.nextReviewDate <= now)
    .sort((a, b) => {
      // Prioritize: failed cards first, then by due date
      if (!a.lastAnsweredCorrect && b.lastAnsweredCorrect) return -1;
      if (a.lastAnsweredCorrect && !b.lastAnsweredCorrect) return 1;
      return a.nextReviewDate - b.nextReviewDate;
    });
}

export function getStats(data: SpacedRepetitionData) {
  const cards = Object.values(data.cards);
  const now = Date.now();

  const totalReviewed = cards.length;
  const mastered = cards.filter((c) => c.repetitions >= 3 && c.lastAnsweredCorrect).length;
  const learning = cards.filter((c) => c.repetitions > 0 && c.repetitions < 3).length;
  const struggling = cards.filter((c) => !c.lastAnsweredCorrect).length;
  const dueNow = cards.filter((c) => c.nextReviewDate <= now).length;

  return {
    totalReviewed,
    mastered,
    learning,
    struggling,
    dueNow,
  };
}

export function clearAllData(storageKey?: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(resolveKey(storageKey));
}
