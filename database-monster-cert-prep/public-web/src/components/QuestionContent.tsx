import { CodeBlock, ResultTable, SchemaDisplay } from "@/components/DataDisplay";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExamQuestion } from "@/lib/types";

interface QuestionContentProps {
  question: ExamQuestion;
  selectedAnswers: string[];
  onToggleAnswer: (answer: string) => void;
}

export function QuestionContent({ question, selectedAnswers, onToggleAnswer }: QuestionContentProps) {
  return (
    <div className="exam-readable flex flex-col gap-5">
      <div className="flex flex-wrap gap-2" aria-label="Question metadata">
        <Badge>{question.topic}</Badge>
        <Badge variant="secondary">{question.difficulty}</Badge>
        <Badge variant="outline">{question.type === "multiple-answer" ? "Multiple answer" : "Single answer"}</Badge>
      </div>

      <h2 className="max-w-4xl text-2xl font-semibold leading-snug tracking-[-0.025em] text-ink sm:text-3xl">{question.question}</h2>

      {question.scenario && (
        <Alert>
          <AlertTitle>Scenario</AlertTitle>
          <AlertDescription>{question.scenario}</AlertDescription>
        </Alert>
      )}

      {question.schema && <SchemaDisplay schemas={question.schema} />}
      {question.sampleData?.map((table, index) => <ResultTable data={table} key={`${table.table}-${index}`} />)}
      {question.code && <CodeBlock code={question.code} label={question.codeLabel} />}
      {question.outputTable && <ResultTable data={question.outputTable} />}

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium text-muted-foreground">
          {question.type === "multiple-answer" ? "Select every correct answer." : "Select one answer."}
        </legend>
        {question.choices.map((choice, index) => {
          const selected = selectedAnswers.includes(choice);
          return (
            <Button
              className={cn(
                "h-auto justify-start rounded-xl border p-4 text-left text-wrap whitespace-normal",
                selected && "border-primary bg-accent text-accent-foreground shadow-[0_0_0_1px_var(--primary)]"
              )}
              type="button"
              key={choice}
              onClick={() => onToggleAnswer(choice)}
              aria-pressed={selected}
              variant="outline"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted font-mono text-xs font-bold">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="flex-1">{choice}</span>
              <span className="min-w-16 text-right text-xs font-semibold uppercase tracking-[0.06em] text-primary">
                {selected ? "Selected" : ""}
              </span>
            </Button>
          );
        })}
      </fieldset>
    </div>
  );
}
