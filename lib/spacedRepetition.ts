// Simplified SM-2 Spaced Repetition Algorithm

export interface ReviewCard {
  questionIndex: number;
  easeFactor: number; // Starting at 2.5
  interval: number; // Days until next review
  repetitions: number; // Number of successful reviews
  nextReviewDate: number; // Timestamp
  lastAnsweredCorrect: boolean;
  lastReviewDate: number;
}

export interface SpacedRepetitionData {
  cards: Record<number, ReviewCard>;
  reviewHistory: ReviewHistoryEntry[];
}

export interface ReviewHistoryEntry {
  questionIndex: number;
  timestamp: number;
  correct: boolean;
}

const STORAGE_KEY = "medcram_spaced_repetition";

// Quality ratings for SM-2
// 0-2: Incorrect (needs immediate review)
// 3: Correct with difficulty
// 4: Correct with hesitation
// 5: Perfect recall
export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

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

export function getStoredData(): SpacedRepetitionData {
  if (typeof window === "undefined") {
    return { cards: {}, reviewHistory: [] };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as SpacedRepetitionData;
    }
  } catch {
    // Ignore errors
  }

  return { cards: {}, reviewHistory: [] };
}

export function saveData(data: SpacedRepetitionData): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable
  }
}

export function recordAnswer(
  questionIndex: number,
  correct: boolean
): SpacedRepetitionData {
  const data = getStoredData();
  const quality = qualityFromCorrectness(correct);

  const existingCard = data.cards[questionIndex] || null;
  const updatedCard = calculateNextReview(
    existingCard ? { ...existingCard, questionIndex } : null,
    quality
  );
  updatedCard.questionIndex = questionIndex;

  data.cards[questionIndex] = updatedCard;
  data.reviewHistory.push({
    questionIndex,
    timestamp: Date.now(),
    correct,
  });

  // Keep only last 1000 history entries
  if (data.reviewHistory.length > 1000) {
    data.reviewHistory = data.reviewHistory.slice(-1000);
  }

  saveData(data);
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

export function clearAllData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
