import { CodeBlock, ResultTable, SchemaDisplay } from "@/components/DataDisplay";
import { SqlSandbox } from "@/components/SqlSandbox";
import type { ExamQuestion } from "@/lib/types";

interface QuestionContentProps {
  question: ExamQuestion;
  selectedAnswers: string[];
  onToggleAnswer: (answer: string) => void;
}

const typeLabel: Record<ExamQuestion["type"], string> = {
  "single-choice": "Single answer",
  "multiple-answer": "Multiple answer",
  "sql-write": "Write SQL",
};

export function QuestionContent({ question, selectedAnswers, onToggleAnswer }: QuestionContentProps) {
  return (
    <>
      <div className="question-badges" aria-label="Question metadata">
        <span>{question.topic}</span>
        <span>{question.difficulty}</span>
        <span>{typeLabel[question.type]}</span>
      </div>
      <h2 className="question-title">{question.question}</h2>
      {question.scenario && (
        <aside className="scenario-box">
          <strong>Scenario</strong>
          <p>{question.scenario}</p>
        </aside>
      )}
      {question.schema && <SchemaDisplay schemas={question.schema} />}
      {question.sampleData?.map((table, index) => <ResultTable data={table} key={`${table.table}-${index}`} />)}
      {question.code && <CodeBlock code={question.code} label={question.codeLabel} />}
      {question.outputTable && <ResultTable data={question.outputTable} />}
      {question.type === "sql-write" ? (
        <SqlSandbox
          key={question.id}
          initialSql={selectedAnswers[0] ?? question.starterSql ?? "SELECT * FROM students;"}
          expectedSql={question.expectedSql}
          onChange={(value) => onToggleAnswer(value)}
        />
      ) : (
      <fieldset className="choice-list">
        <legend>{question.type === "multiple-answer" ? "Select every correct answer." : "Select one answer."}</legend>
        {question.choices.map((choice, index) => {
          const selected = selectedAnswers.includes(choice);
          return (
            <button
              className={`choice-card ${selected ? "selected" : ""}`}
              type="button"
              key={choice}
              onClick={() => onToggleAnswer(choice)}
              aria-pressed={selected}
            >
              <span className="choice-letter" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
              <span>{choice}</span>
              <span className="choice-state">{selected ? "Selected" : ""}</span>
            </button>
          );
        })}
      </fieldset>
      )}
    </>
  );
}

