"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useDataStore } from "@/lib/dataStore";
import {
  ASSESSMENT_QUESTIONS,
  calculateAssessmentScore,
} from "@/types/assessment";
import {
  formatMonthLabel,
  getLatestAssessableMonth,
  isAssessableMonth,
  isValidMonthKey,
  monthKeyToFirstDay,
} from "@/utils/date";

import styles from "./assessment.module.scss";

const getFeedback = (score: number) => {
  if (score >= 80)
    return { emoji: "🎉", text: "훌륭합니다! 매우 잘 관리하고 계시네요." };
  if (score >= 60)
    return {
      emoji: "👍",
      text: "잘하고 계십니다! 조금만 더 신경쓰면 더 좋아질 거예요.",
    };
  if (score >= 40)
    return { emoji: "💪", text: "괜찮습니다. 좀 더 노력이 필요해 보여요." };
  return { emoji: "🤔", text: "관리에 더 신경을 쓰실 필요가 있어 보입니다." };
};

interface AssessmentFormProps {
  monthParam: string | null;
}

export default function AssessmentForm({ monthParam }: AssessmentFormProps) {
  const router = useRouter();
  const dataStore = useDataStore();

  const [monthKey, setMonthKey] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [existingId, setExistingId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [totalScore, setTotalScore] = useState(0);

  // 오늘 날짜에 의존하는 판별이라 하이드레이션 불일치를 피하려고 마운트 후에 처리한다
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);

      // 아직 끝나지 않은 달(말일 전)은 평가할 수 없다
      if (
        monthParam &&
        (!isValidMonthKey(monthParam) || !isAssessableMonth(monthParam))
      ) {
        setIsBlocked(true);
        setIsLoading(false);
        return;
      }

      const resolvedMonth = monthParam ?? getLatestAssessableMonth();
      setMonthKey(resolvedMonth);

      // 기존 평가가 있으면 선택했던 답변을 미리 채워둔다
      const { data, error: loadError } = await dataStore.getAssessmentForMonth(
        monthKeyToFirstDay(resolvedMonth),
      );

      if (cancelled) return;

      if (loadError) {
        setError("기존 평가를 불러오지 못했습니다.");
      } else if (data) {
        setAnswers(data.answers ?? {});
        setExistingId(data.id);
      }
      setIsLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [dataStore, monthParam]);

  const answeredCount = Object.keys(answers).length;
  const isComplete = answeredCount === ASSESSMENT_QUESTIONS.length;

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (!monthKey || !isComplete) {
      setError("모든 질문에 답해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const score = calculateAssessmentScore(answers);
    const { error: saveError } = await dataStore.saveAssessment(
      monthKeyToFirstDay(monthKey),
      score,
      answers,
      existingId,
    );

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

  if (isBlocked) {
    return (
      <main id="content" className={styles["page-assessment"]}>
        <div className={`inner ${styles["result-container"]}`}>
          <h2 className={styles.title}>아직 평가할 수 없어요</h2>
          <p className={styles["notice-text"]}>
            월말 평가는 해당 월의 마지막 날부터 할 수 있습니다.
          </p>
          <button
            type="button"
            className={`btn btn-primary ${styles["btn-close"]}`}
            onClick={handleClose}
          >
            닫기
          </button>
        </div>
      </main>
    );
  }

  if (showResult) {
    const feedback = getFeedback(totalScore);

    return (
      <main id="content" className={styles["page-assessment"]}>
        <div className={`inner ${styles["result-container"]}`}>
          <h2 className={styles.title}>평가 완료!</h2>
          <div className={styles.score}>
            {totalScore} <span className={styles["total-score"]}>/ 100점</span>
          </div>

          <div className={styles["feedback-wrap"]}>
            <p className={styles.emoji}>{feedback.emoji}</p>
            <p className={styles["feedback-text"]}>{feedback.text}</p>
          </div>

          <button
            type="button"
            className={`btn btn-primary ${styles["btn-close"]}`}
            onClick={handleClose}
          >
            닫기
          </button>
        </div>
      </main>
    );
  }

  if (isLoading || !monthKey) {
    return (
      <main id="content" className={styles["page-assessment"]}>
        <p className={styles.loading}>불러오는 중...</p>
      </main>
    );
  }

  return (
    <main id="content" className={styles["page-assessment"]}>
      <hgroup className={styles.header}>
        <h2 className={styles.title}>{formatMonthLabel(monthKey)} 월말 평가</h2>
        <p className={styles.subtitle}>
          {existingId
            ? "이전에 저장한 평가를 수정할 수 있습니다"
            : "지난 한 달 동안의 자신을 평가해보세요"}
        </p>
      </hgroup>

      <div className="inner">
        {ASSESSMENT_QUESTIONS.map((question, index) => (
          <div key={question.id} className={styles["card-question"]}>
            <hgroup>
              <span className={styles["question-number"]}>
                질문 {index + 1}
              </span>
              <h3 className={styles["question-title"]}>{question.question}</h3>
            </hgroup>

            <ul className={styles.options}>
              {question.options.map((option) => {
                const isSelected = answers[question.id] === option.id;
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      className={`${styles.option} ${
                        isSelected ? styles.selected : ""
                      }`}
                      onClick={() => handleSelectOption(question.id, option.id)}
                    >
                      <div className="radio-group" role="radiogroup">
                        <input
                          type="radio"
                          className={`radio ${isSelected ? "selected" : ""}`}
                        />
                        <label className="radio-label">{option.text}</label>
                      </div>
                      <span className={styles.score}>{option.score}점</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className={styles.footer}>
          {error && <p className={styles.error}>{error}</p>}
          <p className={styles["progress-text"]}>
            {answeredCount} / {ASSESSMENT_QUESTIONS.length} 완료
          </p>
          <button
            type="button"
            className={`btn btn-primary ${styles["btn-submit"]} ${
              !isComplete ? "disabled" : ""
            }`}
            onClick={handleSubmit}
            disabled={isSubmitting || !isComplete}
          >
            {isSubmitting ? "제출 중..." : existingId ? "수정하기" : "제출하기"}
          </button>
        </div>
      </div>
    </main>
  );
}
