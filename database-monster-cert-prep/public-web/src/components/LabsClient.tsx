"use client";

import { useEffect, useMemo, useState } from "react";
import { Database } from "lucide-react";
import { SchemaDisplay } from "@/components/DataDisplay";
import { PageHeader } from "@/components/DesignSystem";
import { SqlSandbox } from "@/components/SqlSandbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { labs } from "@/data/labs";
import { DATASET_TABLES } from "@/data/sql-datasets";
import { preloadSqlEngine } from "@/lib/sql-engine";
import type { SchemaTable } from "@/lib/types";

function datasetSchema(tableName: string): SchemaTable | null {
  const table = DATASET_TABLES.find((item) => item.name === tableName);
  if (!table) return null;

  return {
    table: table.name,
    columns: table.columns.map((column) => ({
      name: column.name,
      type: column.type,
      key: column.note === "PK" ? "PRIMARY KEY" : column.note === "FK" ? "FOREIGN KEY" : undefined,
      nullable: column.note === "nullable" ? true : undefined,
    })),
  };
}

function parseLabSchema(schema: string): SchemaTable[] {
  return schema.split("\n").flatMap((line) => {
    const match = line.match(/^(\w+)\((.*)\)$/);
    if (!match) return [];

    const knownSchema = datasetSchema(match[1]);
    if (knownSchema) return [knownSchema];

    return [{
      table: match[1],
      columns: match[2].split(",").map((column) => ({
        name: column.trim(),
        type: "column",
      })),
    }];
  });
}

export function LabsClient() {
  const [showSchema, setShowSchema] = useState(false);
  const [selectedLabId, setSelectedLabId] = useState(labs[0]?.id ?? "");
  const selectedLab = labs.find((lab) => lab.id === selectedLabId) ?? labs[0];
  const selectedLabSchemas = useMemo(() => selectedLab ? parseLabSchema(selectedLab.schema) : [], [selectedLab]);
  const schemas = useMemo<SchemaTable[]>(
    () =>
      DATASET_TABLES.map((table) => datasetSchema(table.name)).filter((table): table is SchemaTable => Boolean(table)),
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
            <CardContent className="grid gap-5">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lab brief</CardTitle>
                  <CardDescription>Complete these tasks in the workspace below. The table columns are shown beside the editor.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="grid gap-2 pl-5 text-sm text-muted-foreground md:grid-cols-2">
                    {selectedLab.tasks.map((task) => <li className="list-decimal" key={task}>{task}</li>)}
                  </ol>
                </CardContent>
              </Card>
              <SqlSandbox
                answer={selectedLab.answer}
                description="Run the lab against the seeded SQLite data, then check whether your output matches the reference query."
                expectedPatterns={selectedLab.expectedPatterns}
                expectedSql={selectedLab.answer}
                hints={[
                  "Use the current lab task list to decide what the query must return.",
                  "Replace every TODO comment before you run.",
                  "Check the result rows, then compare against the reference query.",
                ]}
                key={selectedLab.id}
                rubric={selectedLab.rubric}
                schema={selectedLabSchemas}
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
