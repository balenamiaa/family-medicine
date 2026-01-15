/**
 * Database seed script
 * Migrates questions from questions.json to the database
 */

import { PrismaClient, CardType, Difficulty } from "../lib/generated/prisma";
import questionsData from "../questions.json";
import type {
  McqSingleContent,
  McqMultiContent,
  TrueFalseContent,
  ClozeContent,
  EmqContent,
} from "../types/studyCard";

const prisma = new PrismaClient();

// Map old question type to new CardType
function mapCardType(type: string): CardType {
  const mapping: Record<string, CardType> = {
    mcq_single: CardType.MCQ_SINGLE,
    mcq_multi: CardType.MCQ_MULTI,
    true_false: CardType.TRUE_FALSE,
    emq: CardType.EMQ,
    cloze: CardType.CLOZE,
  };
  return mapping[type] ?? CardType.MCQ_SINGLE;
}

// Map old difficulty (1-5) to new Difficulty enum
function mapDifficulty(difficulty: number): Difficulty {
  if (difficulty <= 2) return Difficulty.EASY;
  if (difficulty >= 4) return Difficulty.HARD;
  return Difficulty.MEDIUM;
}

// Convert old question format to new content format
function convertContent(question: any): object {
  const baseContent = {
    explanation: question.explanation,
    retentionAid: question.retention_aid,
  };

  switch (question.question_type) {
    case "mcq_single":
      return {
        ...baseContent,
        questionText: question.question_text,
        options: question.options,
        correctIndex: question.correct_index,
      } satisfies McqSingleContent;

    case "mcq_multi":
      return {
        ...baseContent,
        questionText: question.question_text,
        options: question.options,
        correctIndices: question.correct_indices,
      } satisfies McqMultiContent;

    case "true_false":
      return {
        ...baseContent,
        statement: question.question_text,
        isTrue: question.is_true,
      } satisfies TrueFalseContent;

    case "cloze":
      return {
        ...baseContent,
        text: question.question_text,
        answers: question.answers,
      } satisfies ClozeContent;

    case "emq":
      return {
        ...baseContent,
        theme: question.instructions,
        options: question.options,
        items: question.premises.map((premise: string, i: number) => ({
          stem: premise,
          correctIndex: question.correct_indices[i],
        })),
      } satisfies EmqContent;

    default:
      return {
        ...baseContent,
        questionText: question.question_text ?? "",
        options: question.options ?? [],
        correctIndex: question.correct_index ?? 0,
      };
  }
}

async function main() {
  console.log("Starting database seed...\n");

  // Check if data already exists
  const existingCards = await prisma.studyCard.count();
  if (existingCards > 0) {
    console.log(`Found ${existingCards} existing cards. Skipping seed.`);
    console.log("To re-seed, clear the database first or delete existing data.");
    return;
  }

  // Create a default user for anonymous/local usage
  const user = await prisma.user.upsert({
    where: { email: "local@medcram.app" },
    update: {},
    create: {
      email: "local@medcram.app",
      name: "Local User",
    },
  });
  console.log(`Created/found user: ${user.name} (${user.id})`);

  // Create the default study set
  const studySet = await prisma.studySet.create({
    data: {
      userId: user.id,
      title: "Family Medicine Questions",
      description: "Comprehensive question bank for family medicine exam preparation",
      tags: ["family-medicine", "clinical", "exam-prep"],
    },
  });
  console.log(`Created study set: ${studySet.title} (${studySet.id})\n`);

  // Type assertion for questions data
  const questions = (questionsData as { questions: any[] }).questions;
  console.log(`Found ${questions.length} questions to migrate...\n`);

  // Migrate questions in batches
  const batchSize = 50;
  let migrated = 0;

  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);

    await prisma.studyCard.createMany({
      data: batch.map((q, idx) => ({
        studySetId: studySet.id,
        cardType: mapCardType(q.question_type),
        content: convertContent(q),
        difficulty: mapDifficulty(q.difficulty),
        tags: q.tags ?? [],
        orderIndex: i + idx,
      })),
    });

    migrated += batch.length;
    console.log(`Migrated ${migrated}/${questions.length} questions...`);
  }

  console.log(`\nSeed completed successfully!`);
  console.log(`- User: ${user.id}`);
  console.log(`- Study Set: ${studySet.id}`);
  console.log(`- Cards: ${migrated}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
