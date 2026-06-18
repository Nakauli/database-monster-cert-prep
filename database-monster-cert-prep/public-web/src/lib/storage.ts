"use client";

import type { ExamQuestion } from "@/lib/types";

const THEME_KEY = "database-monster-theme";
const LAST_MODE_KEY = "database-monster-last-mode";
const DRAFT_PREFIX = "database-monster-exam-draft-v2:";

export interface ExamDraft {
  key: string;
  mode: string;
  questions: ExamQuestion[];
  answers: Record<string, string[]>;
  marked: string[];
  currentIndex: number;
  secondsLeft: number;
  startedAt: number;
  savedAt: number;
}

function available(): boolean {
  return typeof window !== "undefined";
}

export function getTheme(): "light" | "dark" {
  if (!available()) return "dark";
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return "dark";
}

export function setTheme(theme: "light" | "dark"): void {
  if (!available()) return;
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.dataset.theme = theme;
}

export function setLastMode(mode: string): void {
  if (!available()) return;
  localStorage.setItem(LAST_MODE_KEY, mode);
}

export function getLastMode(): string {
  if (!available()) return "diagnostic";
  return localStorage.getItem(LAST_MODE_KEY) ?? "diagnostic";
}

export function saveExamDraft(draft: ExamDraft): void {
  if (!available()) return;
  localStorage.setItem(`${DRAFT_PREFIX}${draft.key}`, JSON.stringify(draft));
}

export function loadExamDraft(key: string): ExamDraft | null {
  if (!available()) return null;
  try {
    const raw = localStorage.getItem(`${DRAFT_PREFIX}${key}`);
    if (!raw) return null;
    const draft = JSON.parse(raw) as ExamDraft;
    const oneDay = 24 * 60 * 60 * 1000;
    if (Date.now() - draft.savedAt > oneDay) {
      clearExamDraft(key);
      return null;
    }
    return draft;
  } catch {
    clearExamDraft(key);
    return null;
  }
}

export function clearExamDraft(key: string): void {
  if (!available()) return;
  localStorage.removeItem(`${DRAFT_PREFIX}${key}`);
}
