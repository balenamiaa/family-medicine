/**
 * Database seed script
 * Migrates questions from questions.json to the database
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, studySets, studyCards, CardType, Difficulty } from "../db/schema";
import { count } from "drizzle-orm";
import questionsData from "../questions.json";
import type {
  McqSingleContent,
  McqMultiContent,
  TrueFalseContent,
  ClozeContent,
  EmqContent,
} from "../types/studyCard";

const connectionString = process.env.STUDY_POSTGRES_PRISMA_URL;

if (!connectionString) {
  console.error("STUDY_POSTGRES_PRISMA_URL is not set");
  process.exit(1);
}

const conn = postgres(connectionString);
const db = drizzle(conn);

// Map old question type to new CardType
function mapCardType(type: string): CardType {
  const mapping: Record<string, CardType> = {
    mcq_single: "MCQ_SINGLE",
    mcq_multi: "MCQ_MULTI",
    true_false: "TRUE_FALSE",
    emq: "EMQ",
    cloze: "CLOZE",
  };
  return mapping[type] ?? "MCQ_SINGLE";
}

// Map old difficulty (1-5) to new Difficulty enum
function mapDifficulty(difficulty: number): Difficulty {
  if (difficulty <= 2) return "EASY";
  if (difficulty >= 4) return "HARD";
  return "MEDIUM";
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
  const [existingResult] = await db.select({ total: count() }).from(studyCards);
  if (existingResult.total > 0) {
    console.log(`Found ${existingResult.total} existing cards. Skipping seed.`);
    console.log("To re-seed, clear the database first or delete existing data.");
    await conn.end();
    return;
  }

  // Create a default user for anonymous/local usage
  const [user] = await db
    .insert(users)
    .values({
      email: "local@medcram.app",
      name: "Local User",
    })
    .onConflictDoNothing()
    .returning();

  // If user already exists, fetch it
  let userId: string;
  if (user) {
    userId = user.id;
    console.log(`Created user: ${user.name} (${user.id})`);
  } else {
    const { eq } = await import("drizzle-orm");
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, "local@medcram.app"));
    userId = existing.id;
    console.log(`Found existing user: ${existing.name} (${existing.id})`);
  }

  // Create the default study set
  const [studySet] = await db
    .insert(studySets)
    .values({
      userId,
      title: "Family Medicine Questions",
      description: "Comprehensive question bank for family medicine exam preparation",
      tags: ["family-medicine", "clinical", "exam-prep"],
    })
    .returning();
  console.log(`Created study set: ${studySet.title} (${studySet.id})\n`);

  // Type assertion for questions data
  const questions = (questionsData as { questions: any[] }).questions;
  console.log(`Found ${questions.length} questions to migrate...\n`);

  // Migrate questions in batches
  const batchSize = 50;
  let migrated = 0;

  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);

    await db.insert(studyCards).values(
      batch.map((q, idx) => ({
        studySetId: studySet.id,
        cardType: mapCardType(q.question_type),
        content: convertContent(q),
        difficulty: mapDifficulty(q.difficulty),
        tags: q.tags ?? [],
        orderIndex: i + idx,
      }))
    );

    migrated += batch.length;
    console.log(`Migrated ${migrated}/${questions.length} questions...`);
  }

  console.log(`\nSeed completed successfully!`);
  console.log(`- User: ${userId}`);
  console.log(`- Study Set: ${studySet.id}`);
  console.log(`- Cards: ${migrated}`);

  await conn.end();
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
