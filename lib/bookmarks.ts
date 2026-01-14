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

export function getBookmarks(): BookmarkData {
  return getStoredValue<BookmarkData>(BOOKMARKS_KEY, createEmptyBookmarks());
}

export function saveBookmarks(data: BookmarkData): void {
  setStoredValue(BOOKMARKS_KEY, data);
}

export function isBookmarked(questionIndex: number): boolean {
  const data = getBookmarks();
  return data.questionIndices.includes(questionIndex);
}

export function toggleBookmark(questionIndex: number): boolean {
  const data = getBookmarks();
  const isCurrentlyBookmarked = data.questionIndices.includes(questionIndex);

  if (isCurrentlyBookmarked) {
    data.questionIndices = data.questionIndices.filter((i) => i !== questionIndex);
    delete data.createdAt[questionIndex];
  } else {
    data.questionIndices.push(questionIndex);
    data.createdAt[questionIndex] = Date.now();
  }

  saveBookmarks(data);
  return !isCurrentlyBookmarked;
}

export function clearAllBookmarks(): void {
  saveBookmarks(createEmptyBookmarks());
}

export function getBookmarkCount(): number {
  return getBookmarks().questionIndices.length;
}

export function getBookmarkedIndices(): number[] {
  return getBookmarks().questionIndices;
}
