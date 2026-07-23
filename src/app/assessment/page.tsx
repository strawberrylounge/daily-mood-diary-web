"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";
import {
  ASSESSMENT_QUESTIONS,
  type AssessmentOption,
} from "@/types/assessment";

import styles from "./assessment.module.scss";

export default function AssessmentPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, AssessmentOption>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [totalScore, setTotalScore] = useState(0);

  const handleSelectOption = (
    questionId: string,
    option: AssessmentOption
  ) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option.id }));
    setSelectedOptions((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== ASSESSMENT_QUESTIONS.length) {
      setError("모든 질문에 답해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const score = Object.values(selectedOptions).reduce(
      (sum, option) => sum + option.score,
      0
    );
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const assessmentMonth = currentMonth.toISOString().split("T")[0];

    // TODO: 인증 연동 후 user_id로 필터링/저장 필요 (현재는 인증 미포함)
    const { data: existing } = await supabase
      .from("monthly_assessments")
      .select("id")
      .eq("assessment_month", assessmentMonth)
      .maybeSingle();

    const { error: saveError } = existing
      ? await supabase
          .from("monthly_assessments")
          .update({
            total_score: score,
            answers,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
      : await supabase.from("monthly_assessments").insert({
          assessment_month: assessmentMonth,
          total_score: score,
          answers,
        });

    setIsSubmitting(false);

    if (saveError) {
      setError("평가 저장 중 오류가 발생했습니다.");
      return;
    }

    setTotalScore(score);
    setShowResult(true);
  };

  const handleClose = () => {
    router.back();
  };

  const feedback =
    totalScore >= 80
      ? { emoji: "🎉", text: "훌륭합니다! 매우 잘 관리하고 계시네요." }
      : totalScore >= 60
        ? { emoji: "👍", text: "잘하고 계십니다! 조금만 더 신경쓰면 더 좋아질 거예요." }
        : totalScore >= 40
          ? { emoji: "💪", text: "괜찮습니다. 좀 더 노력이 필요해 보여요." }
          : { emoji: "🤔", text: "관리에 더 신경을 쓰실 필요가 있어 보입니다." };

  if (showResult) {
    return (
      <main id="content" className={styles.page}>
        <div className={styles.resultContainer}>
          <h1 className={styles.resultTitle}>평가 완료!</h1>
          <p className={styles.resultScore}>{totalScore}점</p>
          <p className={styles.resultTotal}>/ 100점</p>

          <div className={styles.resultFeedback}>
            <p className={styles.feedbackEmoji}>{feedback.emoji}</p>
            <p className={styles.feedbackText}>{feedback.text}</p>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
          >
            닫기
          </button>
        </div>
      </main>
    );
  }

  return (
    <main id="content" className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>월간 셀프 평가</h1>
        <p className={styles.subtitle}>
          지난 한 달 동안의 자신을 평가해보세요
        </p>
      </div>

      <div className="inner">
        {ASSESSMENT_QUESTIONS.map((question, index) => (
          <div key={question.id} className={styles.questionCard}>
            <p className={styles.questionNumber}>질문 {index + 1}</p>
            <p className={styles.questionText}>{question.question}</p>

            <div className={styles.optionsContainer}>
              {question.options.map((option) => {
                const isSelected = answers[question.id] === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`${styles.optionButton} ${
                      isSelected ? styles.optionButtonSelected : ""
                    }`}
                    onClick={() => handleSelectOption(question.id, option)}
                  >
                    <span className={styles.optionContent}>
                      <span
                        className={`${styles.radio} ${
                          isSelected ? styles.radioSelected : ""
                        }`}
                      >
                        {isSelected && <span className={styles.radioInner} />}
                      </span>
                      <span className={styles.optionText}>{option.text}</span>
                    </span>
                    <span className={styles.optionScore}>{option.score}점</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className={styles.footer}>
          {error && <p className={styles.errorText}>{error}</p>}
          <p className={styles.progressText}>
            {Object.keys(answers).length} / {ASSESSMENT_QUESTIONS.length} 완료
          </p>
          <button
            type="button"
            className={`${styles.submitButton} ${
              Object.keys(answers).length !== ASSESSMENT_QUESTIONS.length
                ? styles.submitButtonDisabled
                : ""
            }`}
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              Object.keys(answers).length !== ASSESSMENT_QUESTIONS.length
            }
          >
            {isSubmitting ? "제출 중..." : "제출하기"}
          </button>
        </div>
      </div>
    </main>
  );
}
