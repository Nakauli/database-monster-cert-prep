interface ProgressCardsProps {
  totalExams: number;
  bestScore: number;
  latestScore: number;
  averageScore: number;
  mistakeCount: number;
}

export function ProgressCards({
  totalExams,
  bestScore,
  latestScore,
  averageScore,
  mistakeCount,
}: ProgressCardsProps) {
  const cards = [
    ["Total exams", totalExams, "Saved attempts"],
    ["Best score", `${bestScore}%`, "Personal record"],
    ["Latest score", `${latestScore}%`, "Most recent signal"],
    ["Average", `${averageScore}%`, "Across all attempts"],
    ["Mistakes", mistakeCount, "Questions to repair"],
  ];

  return (
    <section className="progress-card-grid" aria-label="Progress summary">
      {cards.map(([label, value, detail]) => (
        <article className="progress-card" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
          <small>{detail}</small>
        </article>
      ))}
    </section>
  );
}

