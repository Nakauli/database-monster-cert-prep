import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { clearExamDraft, loadExamDraft, saveExamDraft } from "@/lib/storage";

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  globalThis.window = {} as Window & typeof globalThis;
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    length: 0,
  };
});

test("saves loads and clears an exam draft", () => {
  const draft = {
    key: "timed:all:all:default",
    mode: "timed",
    questions: [],
    answers: { q1: ["A"] },
    marked: ["q2"],
    currentIndex: 3,
    secondsLeft: 120,
    startedAt: 1_771_234_000,
    savedAt: Date.now(),
  };

  saveExamDraft(draft);

  assert.deepEqual(loadExamDraft(draft.key), draft);
  clearExamDraft(draft.key);
  assert.equal(loadExamDraft(draft.key), null);
});
