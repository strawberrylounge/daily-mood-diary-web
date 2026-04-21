"use client";

import { useState } from "react";

import styles from "./RecordForm.module.scss";

interface RecordFormProps {
  date: Date;
  onClose: () => void;
}

const SCORE_RANGE = [-4, -3, -2, -1, 0, 1, 2, 3, 4];

const getScoreColor = (score: number) => {
  const colorMap: Record<number, string> = {
    "-4": "#C07060",
    "-3": "#CC8578",
    "-2": "#D89A90",
    "-1": "#E4AFA8",
    "0": "#D9A860",
    "1": "#A4BFA6",
    "2": "#8FB193",
    "3": "#7A9E7E",
    "4": "#6A8E6E",
  };
  return colorMap[score] ?? "#D9A860";
};

export default function RecordForm({ date, onClose }: RecordFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMoods, setSelectedMoods] = useState<number[]>([]);
  const [anxiety, setAnxiety] = useState<number | null>(null);
  const [anger, setAnger] = useState<number | null>(null);
  const [interest, setInterest] = useState<number | null>(null);
  const [activity, setActivity] = useState<number | null>(null);
  const [thoughtSpeed, setThoughtSpeed] = useState<number | null>(null);
  const [thoughtContent, setThoughtContent] = useState<number | null>(null);
  const [sleepHours, setSleepHours] = useState("");
  const [notes, setNotes] = useState("");

  const handleMoodClick = (value: number) => {
    if (selectedMoods.includes(value)) {
      setSelectedMoods(selectedMoods.filter((m) => m !== value));
    } else if (selectedMoods.length < 2) {
      setSelectedMoods([...selectedMoods, value]);
    }
  };

  const handleSave = () => {
    console.log("저장:", {
      date,
      selectedMoods,
      anxiety,
      anger,
      interest,
      activity,
      thoughtSpeed,
      thoughtContent,
      sleepHours,
      notes,
    });
    onClose();
  };

  const scoreRow = (
    label: string,
    value: number | null,
    setValue: (v: number) => void
  ) => (
    <div className={styles.field}>
      <p className={styles.label}>{label}</p>
      <div className={styles.scoreRow}>
        {SCORE_RANGE.map((score) => (
          <button
            key={score}
            className={`${styles.scoreBtn} ${value === score ? styles.scoreBtnSelected : ""}`}
            style={{ backgroundColor: getScoreColor(score) }}
            onClick={() => setValue(score)}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <p className={styles.stepIndicator}>{currentStep} / 3 단계</p>

      {currentStep === 1 && (
        <div className={styles.field}>
          <p className={styles.label}>기분 (최대 2개 선택)</p>
          <div className={styles.scoreRow}>
            {SCORE_RANGE.map((val) => (
              <button
                key={val}
                className={`${styles.scoreBtn} ${selectedMoods.includes(val) ? styles.scoreBtnSelected : ""}`}
                style={{ backgroundColor: getScoreColor(val) }}
                onClick={() => handleMoodClick(val)}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <>
          <p className={styles.subtitle}>정서 반응</p>
          {scoreRow("두려움/소심함/걱정/불안", anxiety, setAnxiety)}
          {scoreRow("짜증/분노", anger, setAnger)}
          <p className={styles.subtitle}>의욕</p>
          {scoreRow("관심/흥미/즐거움/소비/계획", interest, setInterest)}
          {scoreRow("활동량", activity, setActivity)}
          <p className={styles.subtitle}>생각</p>
          {scoreRow("생각의 속도와 양", thoughtSpeed, setThoughtSpeed)}
          {scoreRow("생각의 내용", thoughtContent, setThoughtContent)}
        </>
      )}

      {currentStep === 3 && (
        <>
          <div className={styles.field}>
            <p className={styles.label}>수면 시간 (시간)</p>
            <input
              className={styles.input}
              type="number"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              placeholder="예: 7 또는 7.5"
              min="0"
              step="0.5"
            />
          </div>
          <div className={styles.field}>
            <p className={styles.label}>메모 (선택사항)</p>
            <textarea
              className={styles.textarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="특이사항을 기록하세요"
              rows={4}
            />
          </div>
        </>
      )}

      <div className={styles.navBtns}>
        {currentStep > 1 && (
          <button
            className={styles.navBtn}
            onClick={() => setCurrentStep((s) => s - 1)}
          >
            이전
          </button>
        )}
        {currentStep < 3 && (
          <button
            className={`${styles.navBtn} ${styles.navBtnPrimary}`}
            onClick={() => setCurrentStep((s) => s + 1)}
          >
            다음
          </button>
        )}
        {currentStep === 3 && (
          <button
            className={`${styles.navBtn} ${styles.navBtnPrimary}`}
            onClick={handleSave}
          >
            저장하기
          </button>
        )}
      </div>
    </div>
  );
}
