import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const cardTypeEnum = pgEnum("card_type", [
  "NOTE",
  "MCQ_SINGLE",
  "MCQ_MULTI",
  "TRUE_FALSE",
  "SBA",
  "CLOZE",
  "EMQ",
  "WRITTEN",
]);

export const difficultyEnum = pgEnum("difficulty", ["EASY", "MEDIUM", "HARD"]);

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  studySets: many(studySets),
  cardProgress: many(cardProgress),
  reviewHistory: many(reviewHistory),
}));

// Study Sets table
export const studySets = pgTable("study_sets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  tags: text("tags").array().default([]),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("study_sets_user_id_idx").on(table.userId),
]);

export const studySetsRelations = relations(studySets, ({ one, many }) => ({
  user: one(users, {
    fields: [studySets.userId],
    references: [users.id],
  }),
  cards: many(studyCards),
}));

// Study Cards table (polymorphic with JSONB content)
export const studyCards = pgTable("study_cards", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  studySetId: text("study_set_id").notNull().references(() => studySets.id, { onDelete: "cascade" }),
  cardType: cardTypeEnum("card_type").notNull(),
  content: jsonb("content").notNull(),
  difficulty: difficultyEnum("difficulty").default("MEDIUM").notNull(),
  tags: text("tags").array().default([]),
  orderIndex: integer("order_index").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("study_cards_study_set_id_idx").on(table.studySetId),
  index("study_cards_card_type_idx").on(table.cardType),
]);

export const studyCardsRelations = relations(studyCards, ({ one, many }) => ({
  studySet: one(studySets, {
    fields: [studyCards.studySetId],
    references: [studySets.id],
  }),
  cardProgress: many(cardProgress),
  reviewHistory: many(reviewHistory),
}));

// Card Progress table (spaced repetition data)
export const cardProgress = pgTable("card_progress", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cardId: text("card_id").notNull().references(() => studyCards.id, { onDelete: "cascade" }),
  easeFactor: real("ease_factor").default(2.5).notNull(),
  intervalDays: integer("interval_days").default(0).notNull(),
  repetitions: integer("repetitions").default(0).notNull(),
  nextReviewDate: timestamp("next_review_date").defaultNow().notNull(),
  lastReviewedAt: timestamp("last_reviewed_at"),
  totalReviews: integer("total_reviews").default(0).notNull(),
  correctReviews: integer("correct_reviews").default(0).notNull(),
  avgResponseTime: real("avg_response_time_ms"),
}, (table) => [
  uniqueIndex("card_progress_user_card_idx").on(table.userId, table.cardId),
  index("card_progress_user_review_idx").on(table.userId, table.nextReviewDate),
]);

export const cardProgressRelations = relations(cardProgress, ({ one }) => ({
  user: one(users, {
    fields: [cardProgress.userId],
    references: [users.id],
  }),
  card: one(studyCards, {
    fields: [cardProgress.cardId],
    references: [studyCards.id],
  }),
}));

// Review History table
export const reviewHistory = pgTable("review_history", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cardId: text("card_id").notNull().references(() => studyCards.id, { onDelete: "cascade" }),
  quality: integer("quality").notNull(),
  correct: boolean("correct").notNull(),
  responseTimeMs: integer("response_time_ms"),
  reviewedAt: timestamp("reviewed_at").defaultNow().notNull(),
}, (table) => [
  index("review_history_user_idx").on(table.userId, table.reviewedAt),
  index("review_history_card_idx").on(table.cardId),
]);

export const reviewHistoryRelations = relations(reviewHistory, ({ one }) => ({
  user: one(users, {
    fields: [reviewHistory.userId],
    references: [users.id],
  }),
  card: one(studyCards, {
    fields: [reviewHistory.cardId],
    references: [studyCards.id],
  }),
}));

// Type exports for use in application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type StudySet = typeof studySets.$inferSelect;
export type NewStudySet = typeof studySets.$inferInsert;
export type StudyCard = typeof studyCards.$inferSelect;
export type NewStudyCard = typeof studyCards.$inferInsert;
export type CardProgress = typeof cardProgress.$inferSelect;
export type NewCardProgress = typeof cardProgress.$inferInsert;
export type ReviewHistory = typeof reviewHistory.$inferSelect;
export type NewReviewHistory = typeof reviewHistory.$inferInsert;

export type CardType = typeof cardTypeEnum.enumValues[number];
export type Difficulty = typeof difficultyEnum.enumValues[number];
