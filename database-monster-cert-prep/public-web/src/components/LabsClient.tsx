"use client";

import { CodeAnswerWorkspace } from "@/components/CodeAnswerWorkspace";
import { CodeBlock } from "@/components/DataDisplay";
import { PageHeader } from "@/components/DesignSystem";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { labs } from "@/data/labs";

export function LabsClient() {
  return (
    <div className="app-container page-section">
      <PageHeader
        label="Hands-on SQL labs"
        title="Type the query before you reveal the answer."
        description="Each lab mirrors the local sample database. The browser checks SQL patterns only; it never executes or uploads your code."
      />

      <section className="mt-8 grid gap-6">
        {labs.map((lab, index) => (
          <Card className="overflow-hidden" key={lab.id} id={lab.id}>
            <CardHeader className="border-b bg-muted/35">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Lab {String(index + 1).padStart(2, "0")}</Badge>
                <Badge variant="outline">{lab.topic}</Badge>
              </div>
              <CardTitle className="text-2xl">{lab.title}</CardTitle>
              <CardDescription>{lab.objective}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="flex flex-col gap-4">
                <Card className="bg-muted/25">
                  <CardHeader>
                    <CardTitle className="text-base">Schema</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="overflow-x-auto text-sm text-muted-foreground"><code>{lab.schema}</code></pre>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="grid gap-2 pl-5 text-sm text-muted-foreground">
                      {lab.tasks.map((task) => <li className="list-decimal" key={task}>{task}</li>)}
                    </ol>
                  </CardContent>
                </Card>
                <CodeBlock code={lab.starter} label="Starter SQL" />
              </div>
              <CodeAnswerWorkspace
                answer={lab.answer}
                expectedPatterns={lab.expectedPatterns}
                prompt="Complete the lab query, then check for the required SQL patterns."
                rubric={lab.rubric}
                starter={lab.starter}
                title="Lab workspace"
              />
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
