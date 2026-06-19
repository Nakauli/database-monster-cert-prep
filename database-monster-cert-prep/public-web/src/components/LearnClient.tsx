"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Lightbulb, ListChecks, TriangleAlert } from "lucide-react";
import { CodeBlock } from "@/components/DataDisplay";
import { PageHeader } from "@/components/DesignSystem";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { learnTopics, type LearnLesson, type LearnTopic } from "@/data/learn-topics";
import { hrefForLearnLesson, hrefForLearnTopic, previousAndNextLesson } from "@/lib/learn";

export function LearnClient({
  selectedLesson,
  selectedTopic,
}: {
  selectedLesson: LearnLesson;
  selectedTopic: LearnTopic;
}) {
  const router = useRouter();
  const { previous, next } = previousAndNextLesson(selectedTopic.slug, selectedLesson.slug);

  return (
    <div className="app-container page-section">
      <PageHeader
        label="Learn"
        title="Read one concept. See the exam trap. Then practice it."
        description="Detailed certification notes split into small lessons so you can repair weak topics without rereading everything."
        actions={
          <>
            <Button asChild><Link href={selectedLesson.practiceHref}>Practice this lesson</Link></Button>
            {selectedLesson.labHref && <Button asChild variant="outline"><Link href={selectedLesson.labHref}>Open matching lab</Link></Button>}
          </>
        }
      />

      <section className="mt-8 grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
        <Card className="hidden max-h-[calc(100vh-7rem)] overflow-y-auto lg:sticky lg:top-24 lg:block">
          <CardHeader>
            <CardTitle className="text-base">Course outline</CardTitle>
            <CardDescription>Choose a topic, then one focused lesson.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {learnTopics.map((topic) => (
              <div className="grid gap-2" key={topic.slug}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{topic.title}</p>
                    <p className="text-xs text-muted-foreground">{topic.lessons.length} lessons</p>
                  </div>
                  {topic.slug === selectedTopic.slug && <Badge variant="secondary">Current</Badge>}
                </div>
                <div className="grid gap-1">
                  {topic.lessons.map((lesson) => {
                    const isActive = topic.slug === selectedTopic.slug && lesson.slug === selectedLesson.slug;

                    return (
                      <Link
                        className={`rounded-lg border px-3 py-2 text-sm transition hover:border-primary/45 hover:bg-accent/45 ${isActive ? "border-primary bg-accent text-ink" : "border-transparent text-muted-foreground"}`}
                        href={hrefForLearnLesson(topic.slug, lesson.slug)}
                        key={lesson.slug}
                      >
                        <span className="block font-medium">{lesson.title}</span>
                        <span className="mt-0.5 block text-xs leading-5">{lesson.summary}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card className="lg:hidden">
            <CardHeader>
              <CardTitle className="text-base">Choose lesson</CardTitle>
              <CardDescription>Pick a topic first, then the exact lesson.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Select
                value={selectedTopic.slug}
                onValueChange={(slug) => {
                  const topic = learnTopics.find((item) => item.slug === slug);
                  if (topic) router.push(hrefForLearnTopic(topic));
                }}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {learnTopics.map((topic) => <SelectItem key={topic.slug} value={topic.slug}>{topic.title}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select
                value={selectedLesson.slug}
                onValueChange={(slug) => router.push(hrefForLearnLesson(selectedTopic.slug, slug))}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {selectedTopic.lessons.map((lesson) => <SelectItem key={lesson.slug} value={lesson.slug}>{lesson.title}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/35">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Lesson reader</Badge>
                <Badge variant="outline">{selectedTopic.title}</Badge>
                <Badge variant="outline">{lessonPositionLabel(selectedTopic, selectedLesson)}</Badge>
              </div>
              <CardTitle className="text-4xl tracking-[-0.05em]">{selectedLesson.title}</CardTitle>
              <CardDescription>{selectedLesson.summary}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <LessonSection icon={<BookOpen data-icon="inline-start" />} title="Definition">
                {selectedLesson.definition}
              </LessonSection>

              <LessonSection icon={<Lightbulb data-icon="inline-start" />} title="Why it matters for the exam">
                {selectedLesson.examWhy}
              </LessonSection>

              <Card className="bg-muted/25">
                <CardHeader>
                  <CardTitle className="text-base">{selectedLesson.example.title}</CardTitle>
                  <CardDescription>{selectedLesson.example.body}</CardDescription>
                </CardHeader>
                {selectedLesson.example.code && (
                  <CardContent>
                    <CodeBlock code={selectedLesson.example.code} label="Example" />
                  </CardContent>
                )}
              </Card>

              <Alert>
                <TriangleAlert />
                <AlertTitle>Common exam trap</AlertTitle>
                <AlertDescription>{selectedLesson.trap}</AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ListChecks className="text-primary" data-icon="inline-start" />
                    Quick recall checklist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-2 md:grid-cols-3">
                    {selectedLesson.checklist.map((item) => (
                      <li className="rounded-xl border bg-muted/25 p-3 text-sm text-muted-foreground" key={item}>{item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <div className="grid gap-3 border-t pt-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
                <div>
                  {previous && (
                    <Button asChild className="w-full justify-start md:w-auto" variant="outline">
                      <Link href={hrefForLearnLesson(previous.topic.slug, previous.lesson.slug)}>
                        <ChevronLeft data-icon="inline-start" />
                        {previous.lesson.title}
                      </Link>
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  <Button asChild><Link href={selectedLesson.practiceHref}>Practice this</Link></Button>
                  {selectedLesson.labHref && <Button asChild variant="outline"><Link href={selectedLesson.labHref}>Open lab</Link></Button>}
                </div>

                <div className="flex justify-end">
                  {next && (
                    <Button asChild className="w-full justify-end md:w-auto" variant="outline">
                      <Link href={hrefForLearnLesson(next.topic.slug, next.lesson.slug)}>
                        {next.lesson.title}
                        <ChevronRight data-icon="inline-end" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function lessonPositionLabel(topic: LearnTopic, lesson: LearnLesson) {
  const index = topic.lessons.findIndex((item) => item.slug === lesson.slug);

  return index >= 0 ? `Lesson ${index + 1} of ${topic.lessons.length}` : "Lesson";
}

function LessonSection({
  children,
  icon,
  title,
}: {
  children: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{children}</p>
      </CardContent>
    </Card>
  );
}
