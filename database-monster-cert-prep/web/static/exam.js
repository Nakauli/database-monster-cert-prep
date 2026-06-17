(() => {
  const questions = window.EXAM_DATA;
  const totalSeconds = window.EXAM_SECONDS;
  const answers = {};
  let current = 0;
  const started = Date.now();

  const counter = document.querySelector("#counter");
  const topic = document.querySelector("#topic");
  const difficulty = document.querySelector("#difficulty");
  const text = document.querySelector("#question-text");
  const list = document.querySelector("#choice-list");
  const hint = document.querySelector("#multi-hint");
  const review = document.querySelector("#review-map");
  const timer = document.querySelector("#timer");
  const form = document.querySelector("#exam-form");

  function renderReview() {
    review.innerHTML = "";
    questions.forEach((question, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = index + 1;
      button.className = "review-dot";
      if (answers[question.id] !== undefined) button.classList.add("answered");
      if (index === current) button.classList.add("current");
      button.addEventListener("click", () => { current = index; render(); });
      review.appendChild(button);
    });
  }

  function selected(question, choice) {
    const value = answers[question.id];
    return Array.isArray(value) ? value.includes(choice) : value === choice;
  }

  function render() {
    const question = questions[current];
    counter.textContent = `Question ${current + 1} of ${questions.length}`;
    topic.textContent = question.topic;
    difficulty.textContent = question.difficulty;
    text.textContent = question.question;
    hint.textContent = question.type === "multi_select" ? "Select every correct answer." : "Select one answer.";
    list.innerHTML = "";
    question.choices.forEach((choice, index) => {
      const label = document.createElement("label");
      label.className = "choice";
      const input = document.createElement("input");
      input.type = question.type === "multi_select" ? "checkbox" : "radio";
      input.name = `question-${question.id}`;
      input.checked = selected(question, choice);
      input.addEventListener("change", () => {
        if (question.type === "multi_select") {
          const currentAnswers = new Set(Array.isArray(answers[question.id]) ? answers[question.id] : []);
          input.checked ? currentAnswers.add(choice) : currentAnswers.delete(choice);
          if (currentAnswers.size) answers[question.id] = Array.from(currentAnswers);
          else delete answers[question.id];
        } else {
          answers[question.id] = choice;
        }
        renderReview();
      });
      const badge = document.createElement("b");
      badge.textContent = String.fromCharCode(65 + index);
      const span = document.createElement("span");
      span.textContent = choice;
      label.append(input, badge, span);
      list.appendChild(label);
    });
    document.querySelector("#prev").disabled = current === 0;
    document.querySelector("#next").disabled = current === questions.length - 1;
    renderReview();
  }

  function submitExam(force = false) {
    const unanswered = questions.filter(q => answers[q.id] === undefined).length;
    if (!force && unanswered && !window.confirm(`${unanswered} question(s) are unanswered. Submit anyway?`)) return;
    document.querySelector("#answers-input").value = JSON.stringify(answers);
    document.querySelector("#elapsed-input").value = Math.floor((Date.now() - started) / 1000);
    form.submit();
  }

  document.querySelector("#prev").addEventListener("click", () => { if (current > 0) { current--; render(); } });
  document.querySelector("#next").addEventListener("click", () => { if (current < questions.length - 1) { current++; render(); } });
  document.querySelector("#submit-button").addEventListener("click", () => submitExam(false));

  const tick = window.setInterval(() => {
    const elapsed = Math.floor((Date.now() - started) / 1000);
    const remaining = Math.max(0, totalSeconds - elapsed);
    const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
    const seconds = String(remaining % 60).padStart(2, "0");
    timer.textContent = `${minutes}:${seconds}`;
    if (remaining <= 300) timer.classList.add("urgent");
    if (remaining === 0) {
      window.clearInterval(tick);
      submitExam(true);
    }
  }, 1000);

  render();
})();

