import test from "node:test";
import assert from "node:assert/strict";
import { learnTopics } from "@/data/learn-topics";
import {
  allLearnLessonEntries,
  firstLessonForTopic,
  hrefForLearnLesson,
  hrefForLearnTopic,
  hrefForReviewFile,
  learnLessonBySlug,
  learnTopicByReviewFile,
  learnTopicBySlug,
  previousAndNextLesson,
} from "@/lib/learn";

test("defines the approved learn topic groups", () => {
  assert.equal(learnTopics.length, 9);
  assert.deepEqual(
    learnTopics.map((topic) => topic.title),
    [
      "DDL - Data Definition Language",
      "DML - Data Manipulation Language",
      "DQL - Data Query Language",
      "Normalization",
      "Joins",
      "ERD & Keys",
      "Table Relationships",
      "Stored Procedures & Functions",
      "Triggers",
    ],
  );
});

test("every learn topic has detailed subtopic lessons", () => {
  for (const topic of learnTopics) {
    assert.ok(topic.slug, `${topic.title} needs a slug`);
    assert.ok(topic.reviewFile.startsWith("notes/"), `${topic.title} needs a notes review file`);
    assert.ok(topic.lessons.length >= 4, `${topic.title} needs multiple lessons`);

    for (const lesson of topic.lessons) {
      assert.ok(lesson.slug, `${topic.title} / ${lesson.title} needs a slug`);
      assert.ok(lesson.summary.length >= 20, `${topic.title} / ${lesson.title} needs a summary`);
      assert.ok(lesson.definition.length >= 40, `${topic.title} / ${lesson.title} needs a useful definition`);
      assert.ok(lesson.examWhy.length >= 40, `${topic.title} / ${lesson.title} needs exam relevance copy`);
      assert.ok(lesson.example.body.length >= 20, `${topic.title} / ${lesson.title} needs an example`);
      assert.ok(lesson.trap.length >= 30, `${topic.title} / ${lesson.title} needs a common trap`);
      assert.ok(lesson.checklist.length >= 3, `${topic.title} / ${lesson.title} needs recall checks`);
      assert.ok(lesson.practiceHref.startsWith("/practice"), `${topic.title} / ${lesson.title} needs a practice link`);
    }
  }
});

test("maps topics and lessons to stable learn URLs", () => {
  const normalization = learnTopicBySlug("normalization");

  assert.ok(normalization);
  assert.equal(firstLessonForTopic(normalization)?.slug, "why-normalization-exists");
  assert.equal(hrefForLearnTopic(normalization), "/learn/normalization/why-normalization-exists");
  assert.equal(hrefForLearnLesson("normalization", "1nf"), "/learn/normalization/1nf");
  assert.equal(learnLessonBySlug("normalization", "1nf")?.title, "1NF");
});

test("maps review files to the first lesson in each topic", () => {
  const joins = learnTopicByReviewFile("notes/05_joins.md");

  assert.equal(joins?.slug, "joins");
  assert.equal(hrefForReviewFile("notes/05_joins.md"), "/learn/joins/inner-join");
  assert.equal(hrefForReviewFile("notes/missing.md"), null);
});

test("flattens lessons and returns previous and next entries", () => {
  const entries = allLearnLessonEntries();
  const around1nf = previousAndNextLesson("normalization", "1nf");

  assert.ok(entries.length > learnTopics.length);
  assert.equal(around1nf.previous?.lesson.slug, "why-normalization-exists");
  assert.equal(around1nf.next?.lesson.slug, "2nf");
  assert.equal(previousAndNextLesson("missing", "missing").next, null);
});
