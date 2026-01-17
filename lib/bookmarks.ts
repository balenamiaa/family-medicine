// Bookmark system for flagging questions

import { getStoredValue, setStoredValue } from "./utils";

const BOOKMARKS_KEY = "medcram_bookmarks";

export interface BookmarkData {
  questionIndices: number[];
  createdAt: Record<number, number>; // questionIndex -> timestamp
}

function createEmptyBookmarks(): BookmarkData {
  return {
    questionIndices: [],
    createdAt: {},
  };
}

function resolveKey(storageKey?: string): string {
  return storageKey ?? BOOKMARKS_KEY;
}

export function getBookmarks(storageKey?: string): BookmarkData {
  return getStoredValue<BookmarkData>(resolveKey(storageKey), createEmptyBookmarks());
}

export function saveBookmarks(data: BookmarkData, storageKey?: string): void {
  setStoredValue(resolveKey(storageKey), data);
}

export function isBookmarked(questionIndex: number, storageKey?: string): boolean {
  const data = getBookmarks(storageKey);
  return data.questionIndices.includes(questionIndex);
}

export function toggleBookmark(questionIndex: number, storageKey?: string): boolean {
  const data = getBookmarks(storageKey);
  const isCurrentlyBookmarked = data.questionIndices.includes(questionIndex);

  if (isCurrentlyBookmarked) {
    data.questionIndices = data.questionIndices.filter((i) => i !== questionIndex);
    delete data.createdAt[questionIndex];
  } else {
    data.questionIndices.push(questionIndex);
    data.createdAt[questionIndex] = Date.now();
  }

  saveBookmarks(data, storageKey);
  return !isCurrentlyBookmarked;
}

export function clearAllBookmarks(storageKey?: string): void {
  saveBookmarks(createEmptyBookmarks(), storageKey);
}

export function getBookmarkCount(storageKey?: string): number {
  return getBookmarks(storageKey).questionIndices.length;
}

export function getBookmarkedIndices(storageKey?: string): number[] {
  return getBookmarks(storageKey).questionIndices;
}
