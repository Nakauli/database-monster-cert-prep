"use client";

import { useEffect, useMemo, useState } from "react";
import { Database } from "lucide-react";
import { CodeBlock, SchemaDisplay } from "@/components/DataDisplay";
import { PageHeader } from "@/components/DesignSystem";
import { SqlSandbox } from "@/components/SqlSandbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { labs } from "@/data/labs";
import { DATASET_TABLES } from "@/data/sql-datasets";
import { preloadSqlEngine } from "@/lib/sql-engine";
import type { SchemaTable } from "@/lib/types";

export function LabsClient() {
  const [showSchema, setShowSchema] = useState(false);
  const [selectedLabId, setSelectedLabId] = useState(labs[0]?.id ?? "");
  const selectedLab = labs.find((lab) => lab.id === selectedLabId) ?? labs[0];
  const schemas = useMemo<SchemaTable[]>(
    () =>
      DATASET_TABLES.map((table) => ({
        table: table.name,
        columns: table.columns.map((column) => ({
          name: column.name,
          type: column.type,
          key: column.note === "PK" ? "PRIMARY KEY" : column.note === "FK" ? "FOREIGN KEY" : undefined,
          nullable: column.note === "nullable" ? true : undefined,
        })),
      })),
    [],
  );

  useEffect(() => {
    preloadSqlEngine();
  }, []);

  return (
    <div className="app-container page-section">
      <PageHeader
        label="Hands-on SQL labs"
        title="Write real queries. Run them. See the rows."
        description="Each lab runs against a seeded in-browser SQLite database. Nothing leaves this tab; every run starts from a fresh copy of the practice data."
        actions={
          <Button type="button" variant="outline" onClick={() => setShowSchema((value) => !value)} aria-expanded={showSchema}>
            <Database data-icon="inline-start" />
            {showSchema ? "Hide schema" : "Browse schema"}
          </Button>
        }
      />

      {showSchema && (
        <section className="mt-6">
          <SchemaDisplay schemas={schemas} />
        </section>
      )}

      <section className="mt-8 grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
        <Card className="lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>Lab map</CardTitle>
            <CardDescription>Pick one workspace at a time.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {labs.map((lab, index) => (
              <Button
                className="h-auto justify-start rounded-xl p-3 text-left whitespace-normal"
                key={lab.id}
                onClick={() => setSelectedLabId(lab.id)}
                type="button"
                variant={selectedLab?.id === lab.id ? "secondary" : "outline"}
              >
                <span className="flex flex-col gap-1">
                  <span className="font-semibold">Lab {String(index + 1).padStart(2, "0")}: {lab.title}</span>
                  <span className="text-xs text-muted-foreground">{lab.topic}</span>
                </span>
              </Button>
            ))}
          </CardContent>
        </Card>

        {selectedLab && (
          <Card className="overflow-hidden" id={selectedLab.id}>
            <CardHeader className="border-b bg-muted/35">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Interactive lab</Badge>
                <Badge variant="outline">{selectedLab.topic}</Badge>
              </div>
              <CardTitle className="text-2xl">{selectedLab.title}</CardTitle>
              <CardDescription>{selectedLab.objective}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="flex flex-col gap-4">
                <Card className="bg-muted/25">
                  <CardHeader>
                    <CardTitle className="text-base">Schema</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="overflow-x-auto text-sm text-muted-foreground"><code>{selectedLab.schema}</code></pre>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="grid gap-2 pl-5 text-sm text-muted-foreground">
                      {selectedLab.tasks.map((task) => <li className="list-decimal" key={task}>{task}</li>)}
                    </ol>
                  </CardContent>
                </Card>
                <CodeBlock code={selectedLab.starter} label="Starter SQL" />
              </div>
              <SqlSandbox
                answer={selectedLab.answer}
                description="Run the lab against the seeded SQLite data, then check whether your output matches the reference query."
                expectedPatterns={selectedLab.expectedPatterns}
                expectedSql={selectedLab.answer}
                key={selectedLab.id}
                rubric={selectedLab.rubric}
                starter={selectedLab.starter}
                title="Lab workspace"
              />
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
