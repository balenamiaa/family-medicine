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
export const userRoleEnum = pgEnum("user_role", ["ADMIN", "USER"]);

export const studySetTypeEnum = pgEnum("study_set_type", ["SYSTEM", "PUBLIC", "PRIVATE"]);

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
  role: userRoleEnum("role").default("USER").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  studySets: many(studySets),
  savedSets: many(savedSets),
  cardProgress: many(cardProgress),
  reviewHistory: many(reviewHistory),
}));

// Login Tokens table (email verification codes)
export const loginTokens = pgTable("login_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("login_tokens_email_idx").on(table.email),
  index("login_tokens_expires_idx").on(table.expiresAt),
]);

// Study Sets table
export const studySets = pgTable("study_sets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  tags: text("tags").array().default([]),
  type: studySetTypeEnum("type").default("PRIVATE").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("study_sets_user_id_idx").on(table.userId),
  index("study_sets_type_idx").on(table.type),
]);

export const studySetsRelations = relations(studySets, ({ one, many }) => ({
  user: one(users, {
    fields: [studySets.userId],
    references: [users.id],
  }),
  cards: many(studyCards),
  savedBy: many(savedSets),
}));

// Saved Study Sets table (user favorites)
export const savedSets = pgTable("saved_sets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  studySetId: text("study_set_id").notNull().references(() => studySets.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("saved_sets_user_set_idx").on(table.userId, table.studySetId),
  index("saved_sets_user_idx").on(table.userId),
  index("saved_sets_set_idx").on(table.studySetId),
]);

export const savedSetsRelations = relations(savedSets, ({ one }) => ({
  user: one(users, {
    fields: [savedSets.userId],
    references: [users.id],
  }),
  studySet: one(studySets, {
    fields: [savedSets.studySetId],
    references: [studySets.id],
  }),
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
export type LoginToken = typeof loginTokens.$inferSelect;
export type NewLoginToken = typeof loginTokens.$inferInsert;
export type StudySet = typeof studySets.$inferSelect;
export type NewStudySet = typeof studySets.$inferInsert;
export type StudyCard = typeof studyCards.$inferSelect;
export type NewStudyCard = typeof studyCards.$inferInsert;
export type CardProgress = typeof cardProgress.$inferSelect;
export type NewCardProgress = typeof cardProgress.$inferInsert;
export type ReviewHistory = typeof reviewHistory.$inferSelect;
export type NewReviewHistory = typeof reviewHistory.$inferInsert;
export type SavedSet = typeof savedSets.$inferSelect;
export type NewSavedSet = typeof savedSets.$inferInsert;

export type UserRole = typeof userRoleEnum.enumValues[number];
export type StudySetType = typeof studySetTypeEnum.enumValues[number];
export type CardType = typeof cardTypeEnum.enumValues[number];
export type Difficulty = typeof difficultyEnum.enumValues[number];
