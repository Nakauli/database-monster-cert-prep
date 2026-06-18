"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, ArrowsClockwise, Sparkle } from "@phosphor-icons/react";
import { useState } from "react";
import { resolveMistake } from "@/lib/storage";
import type { StoredMistake } from "@/lib/types";

interface FlashcardReviewProps {
  mistakes: StoredMistake[];
  onResolve: (questionId: string) => void;
}

export function FlashcardReview({ mistakes, onResolve }: FlashcardReviewProps) {
  // Most-missed first — the spaced-repetition priority for an imminent exam.
  const [queue, setQueue] = useState<StoredMistake[]>(() =>
    [...mistakes].sort((a, b) => b.misses - a.misses),
  );
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const card = queue[0];

  function next(newQueue: StoredMistake[]) {
    setFlipped(false);
    setQueue(newQueue);
  }

  function again() {
    if (queue.length < 2) return setFlipped(false);
    next([...queue.slice(1), queue[0]]); // send to back
  }

  function hard() {
    if (queue.length < 3) return setFlipped(false);
    const [head, ...rest] = queue;
    const at = Math.min(2, rest.length);
    next([...rest.slice(0, at), head, ...rest.slice(at)]);
  }

  function good() {
    resolveMistake(card.questionId);
    onResolve(card.questionId);
    setReviewed((n) => n + 1);
    next(queue.slice(1));
  }

  if (!card) {
    return (
      <motion.section
        className="empty-state inline-empty"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.45 }}
      >
        <Sparkle size={40} weight="fill" style={{ color: "var(--green)" }} />
        <h2>Session complete.</h2>
        <p>
          You cleared {reviewed} card{reviewed === 1 ? "" : "s"} this round. Mastered cards are
          removed from your notebook.
        </p>
      </motion.section>
    );
  }

  return (
    <section>
      <div className="sql-hint" style={{ marginBottom: 12 }}>
        {queue.length} card{queue.length === 1 ? "" : "s"} remaining · {reviewed} mastered this session
      </div>
      <div className="flashcard">
        <AnimatePresence mode="wait">
          <motion.button
            type="button"
            key={card.questionId + String(flipped)}
            className="flashcard-inner"
            style={{ width: "100%", textAlign: "left" }}
            onClick={() => setFlipped((v) => !v)}
            initial={{ opacity: 0, rotateX: flipped ? -8 : 8, y: 8 }}
            animate={{ opacity: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="flashcard-tag">{card.topic}</span>
            {!flipped ? (
              <div className="flashcard-q">{card.question}</div>
            ) : (
              <div>
                <p style={{ margin: "0 0 12px" }}>
                  <strong style={{ color: "var(--green-dark)" }}>Answer:</strong>{" "}
                  {card.correctAnswers.join(", ") || "See explanation"}
                </p>
                <div className="explanation-box" style={{ margin: 0 }}>
                  <strong>Rule to remember</strong>
                  <p>{card.explanation}</p>
                </div>
              </div>
            )}
            <span className="flashcard-hint">{flipped ? "Tap to hide" : "Tap to reveal answer"}</span>
          </motion.button>
        </AnimatePresence>
      </div>

      {flipped && (
        <motion.div className="srs-actions" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <button className="again" type="button" onClick={again}>
            <ArrowsClockwise size={15} weight="bold" /> Again
          </button>
          <button className="hard" type="button" onClick={hard}>
            Hard
          </button>
          <button className="good" type="button" onClick={good}>
            <CheckCircle size={15} weight="bold" /> Got it
          </button>
        </motion.div>
      )}
    </section>
  );
}
