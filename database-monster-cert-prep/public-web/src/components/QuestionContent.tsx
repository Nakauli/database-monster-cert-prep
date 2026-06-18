import { CodeBlock, ResultTable, SchemaDisplay } from "@/components/DataDisplay";
import type { ExamQuestion } from "@/lib/types";

interface QuestionContentProps {
  question: ExamQuestion;
  selectedAnswers: string[];
  onToggleAnswer: (answer: string) => void;
}

export function QuestionContent({ question, selectedAnswers, onToggleAnswer }: QuestionContentProps) {
  return (
    <div className="exam-copy">
      <div className="question-badges" aria-label="Question metadata">
        <span>{question.topic}</span>
        <span>{question.difficulty}</span>
        <span>{question.type === "multiple-answer" ? "Multiple answer" : "Single answer"}</span>
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
    </div>
  );
}
