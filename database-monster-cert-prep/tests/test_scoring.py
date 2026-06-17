from app.scoring import is_correct_answer, score_answers


def question(question_id="QTEST", topic="Joins"):
    return {
        "id": question_id,
        "topic": topic,
        "difficulty": "medium",
        "type": "multiple_choice",
        "question": "Which join preserves the left table?",
        "choices": ["INNER JOIN", "LEFT JOIN", "CROSS JOIN", "SELF JOIN"],
        "correct_answer": "LEFT JOIN",
        "explanation": "A left join preserves all left rows.",
        "why_wrong_answers": {
            "INNER JOIN": "It keeps matches only.",
            "CROSS JOIN": "It produces every pair.",
            "SELF JOIN": "It describes joining a table to itself.",
        },
        "recommended_review": ["notes/05_joins.md", "labs/lab_03_joins.sql"],
    }


def test_exact_multi_select_matching():
    assert is_correct_answer(["A", "C"], ["C", "A"])
    assert not is_correct_answer(["A"], ["A", "C"])
    assert not is_correct_answer(["A", "B", "C"], ["A", "C"])


def test_score_answers_builds_topic_breakdown_and_details():
    questions = [question("Q1"), question("Q2")]
    report = score_answers(
        questions,
        {"Q1": "LEFT JOIN", "Q2": "INNER JOIN"},
    )
    assert report["correct"] == 1
    assert report["total"] == 2
    assert report["percentage"] == 50.0
    assert report["by_topic"]["Joins"]["correct"] == 1
    assert report["by_topic"]["Joins"]["total"] == 2
    assert report["details"][1]["is_correct"] is False
    assert report["weak_topics"][0]["topic"] == "Joins"


def test_unanswered_question_is_incorrect():
    report = score_answers([question()], {})
    assert report["correct"] == 0
    assert report["details"][0]["selected_answer"] is None

