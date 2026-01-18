import { studySets, users, StudySetType } from "@/db";
import {
  and,
  arrayContains,
  arrayOverlaps,
  ilike,
  inArray,
  or,
  sql,
} from "drizzle-orm";

export type StudySetSort = "relevance" | "updated" | "newest" | "cards";
export type TagMode = "any" | "all";

export interface StudySetSearchFilters {
  query: string | null;
  types: StudySetType[] | null;
  tags: string[];
  tagsMode: TagMode;
  author: string | null;
  sort: StudySetSort;
  minCards: number | null;
  maxCards: number | null;
  limit: number;
  offset: number;
}

const DEFAULT_LIMIT = 18;
const MAX_LIMIT = 60;

function parseNumber(value: string | null, fallback: number | null = null) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function parseTypes(value: string | null): StudySetType[] | null {
  if (!value) return null;
  const entries = value
    .split(",")
    .map((entry) => entry.trim().toUpperCase())
    .filter(Boolean);
  const types = entries.filter(
    (entry): entry is StudySetType => ["SYSTEM", "PUBLIC", "PRIVATE"].includes(entry)
  );
  return types.length > 0 ? types : null;
}

export function parseStudySetSearchParams(
  searchParams: URLSearchParams,
  options: { defaultSort?: StudySetSort } = {}
): StudySetSearchFilters {
  const rawQuery = searchParams.get("q");
  const rawAuthor = searchParams.get("author");
  const rawTags = searchParams.get("tags");
  const rawTypes = searchParams.get("types") ?? searchParams.get("type");

  const limitParam = parseNumber(searchParams.get("limit"), DEFAULT_LIMIT);
  const offsetParam = parseNumber(searchParams.get("offset"), 0);
  const pageParam = parseNumber(searchParams.get("page"));

  const limit = Math.min(Math.max(limitParam ?? DEFAULT_LIMIT, 6), MAX_LIMIT);
  const offset = pageParam && pageParam > 1 ? (pageParam - 1) * limit : Math.max(offsetParam ?? 0, 0);

  const tags = rawTags
    ? rawTags.split(",").map((tag) => tag.trim()).filter(Boolean)
    : [];

  const tagsMode = searchParams.get("tagsMode") === "all" ? "all" : "any";

  const sortParam = searchParams.get("sort") as StudySetSort | null;
  const sort: StudySetSort = sortParam && ["relevance", "updated", "newest", "cards"].includes(sortParam)
    ? sortParam
    : (options.defaultSort ?? (rawQuery ? "relevance" : "updated"));

  return {
    query: rawQuery?.trim() || null,
    types: parseTypes(rawTypes),
    tags,
    tagsMode,
    author: rawAuthor?.trim() || null,
    sort,
    minCards: parseNumber(searchParams.get("minCards")),
    maxCards: parseNumber(searchParams.get("maxCards")),
    limit,
    offset,
  };
}

export function buildStudySetSearchConditions(filters: StudySetSearchFilters) {
  const searchVector = sql`to_tsvector('english', coalesce(${studySets.title}, '') || ' ' || coalesce(${studySets.description}, '') || ' ' || coalesce(array_to_string(${studySets.tags}, ' '), '') || ' ' || coalesce(${users.name}, '') || ' ' || coalesce(${users.email}, ''))`;
  const hasQuery = Boolean(filters.query);
  const query = filters.query ?? "";
  const searchCondition = hasQuery
    ? sql`${searchVector} @@ websearch_to_tsquery('english', ${query})`
    : undefined;
  const rank = hasQuery
    ? sql<number>`ts_rank(${searchVector}, websearch_to_tsquery('english', ${query}))`
    : null;

  const typeCondition = filters.types && filters.types.length > 0
    ? inArray(studySets.type, filters.types)
    : undefined;

  const tagsCondition = filters.tags.length > 0
    ? (filters.tagsMode === "all"
      ? arrayContains(studySets.tags, filters.tags)
      : arrayOverlaps(studySets.tags, filters.tags))
    : undefined;

  const authorCondition = filters.author
    ? or(
      ilike(users.name, `%${filters.author}%`),
      ilike(users.email, `%${filters.author}%`)
    )
    : undefined;

  return {
    searchCondition,
    typeCondition,
    tagsCondition,
    authorCondition,
    rank,
    searchVector,
  };
}
