"use client";

import { createClient } from "@/lib/supabase/client";
import type { ExamResult } from "@/lib/types";

export async function saveExamResult(result: ExamResult): Promise<string> {
  const supabase = createClient();
  if (!supabase) {
    throw new Error("Account storage is not configured.");
  }

  const questionAttempts = result.reviews.map((review) => ({
    question_id: review.question.id,
    topic: review.question.topic,
    difficulty: review.question.difficulty,
    is_correct: review.correct,
    selected_answers: review.selectedAnswers,
    correct_answers: review.question.correctAnswers,
    question_snapshot: review.question,
    explanation: review.question.explanation,
  }));

  const { data, error } = await supabase.rpc("save_exam_result", {
    p_exam_mode: result.mode,
    p_score: result.score,
    p_total_questions: result.total,
    p_correct_count: result.correct,
    p_time_spent_seconds: result.durationSeconds,
    p_topic_breakdown: result.topicStats,
    p_question_attempts: questionAttempts,
  });

  if (error) throw new Error(error.message);
  if (typeof data !== "string") throw new Error("The saved exam did not return an attempt ID.");
  return data;
}

