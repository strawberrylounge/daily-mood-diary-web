"use client";

import { useEffect, useState } from "react";

import { useDataStore } from "@/lib/dataStore";
import type { DailyRecord } from "@/types/record";
import { SCORE_RANGE, getScoreColor } from "@/utils/score";
import { formatDateToYMD } from "@/utils/date";

import GuideModal from "./GuideModal";

import styles from "./RecordForm.module.scss";

interface RecordFormProps {
  date: Date;
  onClose: () => void;
  onRecordChange?: () => void;
}

type Mode = "loading" | "view" | "edit" | "create";

const BOOLEAN_FIELDS: {
  key:
    | "has_menstruation"
    | "has_binge_eating"
    | "has_physical_pain"
    | "has_panic_attack"
    | "has_exercise"
    | "has_crying";
  emoji: string;
  label: string;
}[] = [
  { key: "has_menstruation", emoji: "\u{1F4A7}", label: "생리" },
  { key: "has_binge_eating", emoji: "\u{1F354}", label: "폭식" },
  { key: "has_physical_pain", emoji: "\u{1FA79}", label: "신체 통증" },
  { key: "has_panic_attack", emoji: "\u{1F493}", label: "공황 발작" },
  { key: "has_crying", emoji: "\u{1F622}", label: "울음" },
  { key: "has_exercise", emoji: "\u{1F3C3}", label: "운동" },
];

const BOOLEAN_STATE_KEY = {
  has_menstruation: "hasMenstruation",
  has_binge_eating: "hasBingeEating",
  has_physical_pain: "hasPhysicalPain",
  has_panic_attack: "hasPanicAttack",
  has_exercise: "hasExercise",
  has_crying: "hasCrying",
} as const;

const GUIDE_LABELS: Record<string, string> = {
  anxiety: "두려움/소심함/걱정/불안",
  anger: "짜증/분노",
  interest: "관심/흥미/즐거움/소비/계획",
  activity: "활동량",
  thoughtSpeed: "생각의 속도와 양",
  thoughtContent: "생각의 내용",
};

type ScoreKey =
  | "anxiety"
  | "anger"
  | "interest"
  | "activity"
  | "thoughtSpeed"
  | "thoughtContent";

type FormState = {
  selectedMoods: number[];
  anxiety: number | null;
  anger: number | null;
  interest: number | null;
  activity: number | null;
  thoughtSpeed: number | null;
  thoughtContent: number | null;
  sleepHours: string;
  weight: string;
  alcoholAmount: string;
  hasMenstruation: boolean;
  hasBingeEating: boolean;
  hasPhysicalPain: boolean;
  hasPanicAttack: boolean;
  hasExercise: boolean;
  hasCrying: boolean;
  notes: string;
};

const EMPTY_FORM: FormState = {
  selectedMoods: [],
  anxiety: null,
  anger: null,
  interest: null,
  activity: null,
  thoughtSpeed: null,
  thoughtContent: null,
  sleepHours: "",
  weight: "",
  alcoholAmount: "0",
  hasMenstruation: false,
  hasBingeEating: false,
  hasPhysicalPain: false,
  hasPanicAttack: false,
  hasExercise: false,
  hasCrying: false,
  notes: "",
};

const recordToForm = (record: DailyRecord): FormState => {
  const moods: number[] = [];
  if (record.mood_up_score !== null && record.mood_up_score !== undefined) {
    moods.push(record.mood_up_score);
  }
  if (record.mood_down_score !== null && record.mood_down_score !== undefined) {
    moods.push(record.mood_down_score);
  }

  return {
    selectedMoods: moods,
    anxiety: record.anxiety_score,
    anger: record.anger_score,
    interest: record.interest_score,
    activity: record.activity_score,
    thoughtSpeed: record.thought_speed_score,
    thoughtContent: record.thought_content_score,
    sleepHours: String(record.sleep_hours),
    weight: record.weight != null ? String(record.weight) : "",
    alcoholAmount: String(record.has_alcohol),
    hasMenstruation: record.has_menstruation,
    hasBingeEating: record.has_binge_eating,
    hasPhysicalPain: record.has_physical_pain,
    hasPanicAttack: record.has_panic_attack,
    hasExercise: record.has_exercise,
    hasCrying: record.has_crying,
    notes: record.notes ?? "",
  };
};

export default function RecordForm({
  date,
  onClose,
  onRecordChange,
}: RecordFormProps) {
  const dateStr = formatDateToYMD(date);
  const dataStore = useDataStore();

  const [mode, setMode] = useState<Mode>("loading");
  const [record, setRecord] = useState<DailyRecord | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openGuide, setOpenGuide] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchRecord = async () => {
      setMode("loading");
      setError(null);
      setCurrentStep(1);

      const { data, error: fetchError } = await dataStore.getRecord(dateStr);

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError);
        setForm(EMPTY_FORM);
        setMode("create");
        return;
      }

      if (data) {
        setRecord(data as DailyRecord);
        setForm(recordToForm(data as DailyRecord));
        setMode("view");
      } else {
        setRecord(null);
        setForm(EMPTY_FORM);
        setMode("create");
      }
    };

    fetchRecord();

    return () => {
      cancelled = true;
    };
  }, [dateStr, dataStore]);

  const setScore = (key: ScoreKey, value: number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleMood = (value: number) => {
    setForm((prev) => {
      if (prev.selectedMoods.includes(value)) {
        return {
          ...prev,
          selectedMoods: prev.selectedMoods.filter((m) => m !== value),
        };
      }
      if (prev.selectedMoods.length < 2) {
        return { ...prev, selectedMoods: [...prev.selectedMoods, value] };
      }
      return prev;
    });
  };

  const toggleBoolean = (key: (typeof BOOLEAN_FIELDS)[number]["key"]) => {
    const stateKey = BOOLEAN_STATE_KEY[key];
    setForm((prev) => ({ ...prev, [stateKey]: !prev[stateKey] }));
  };

  const buildPayload = () => {
    const moodUp = form.selectedMoods.filter((m) => m >= 0);
    const moodDown = form.selectedMoods.filter((m) => m < 0);

    return {
      record_date: dateStr,
      mood_up_score: moodUp.length > 0 ? moodUp[0] : null,
      mood_down_score: moodDown.length > 0 ? moodDown[0] : null,
      anxiety_score: form.anxiety ?? 0,
      anger_score: form.anger ?? 0,
      interest_score: form.interest ?? 0,
      activity_score: form.activity ?? 0,
      thought_speed_score: form.thoughtSpeed ?? 0,
      thought_content_score: form.thoughtContent ?? 0,
      sleep_hours: parseFloat(form.sleepHours) || 0,
      weight: form.weight ? parseFloat(form.weight) : null,
      has_menstruation: form.hasMenstruation,
      has_binge_eating: form.hasBingeEating,
      has_physical_pain: form.hasPhysicalPain,
      has_panic_attack: form.hasPanicAttack,
      has_exercise: form.hasExercise,
      has_crying: form.hasCrying,
      has_alcohol: parseFloat(form.alcoholAmount) || 0,
      notes: form.notes || null,
    };
  };

  const canProceedToStep2 = form.selectedMoods.length > 0;
  const canProceedToStep3 =
    form.anxiety !== null &&
    form.anger !== null &&
    form.interest !== null &&
    form.activity !== null &&
    form.thoughtSpeed !== null &&
    form.thoughtContent !== null;

  const handleNext = () => {
    if (currentStep === 1 && !canProceedToStep2) {
      setError("기분을 최소 1개 이상 선택해주세요.");
      return;
    }
    if (currentStep === 2 && !canProceedToStep3) {
      setError("모든 항목을 설정해주세요.");
      return;
    }
    setError(null);
    setCurrentStep((s) => s + 1);
  };

  const handleCreate = async () => {
    if (form.selectedMoods.length === 0) {
      setError("기분을 최소 1개 이상 선택해주세요.");
      return;
    }
    if (!form.sleepHours || parseFloat(form.sleepHours) <= 0) {
      setError("수면 시간을 입력해주세요.");
      return;
    }

    setSaving(true);
    setError(null);

    const { error: insertError } = await dataStore.createRecord(
      buildPayload(),
    );

    setSaving(false);

    if (insertError) {
      setError(insertError);
      return;
    }

    onRecordChange?.();
    onClose();
  };

  const handleUpdate = async () => {
    if (!record) return;

    if (form.selectedMoods.length === 0) {
      setError("기분을 최소 1개 이상 선택해주세요.");
      return;
    }
    if (!form.sleepHours || parseFloat(form.sleepHours) <= 0) {
      setError("수면 시간을 입력해주세요.");
      return;
    }

    setSaving(true);
    setError(null);

    const { error: updateError } = await dataStore.updateRecord(
      record.id,
      buildPayload(),
    );

    setSaving(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    setRecord((prev) => (prev ? { ...prev, ...buildPayload() } : prev));
    onRecordChange?.();
    setMode("view");
  };

  const handleDelete = async () => {
    if (!record) return;
    const confirmed = window.confirm("정말로 이 기록을 삭제하시겠습니까?");
    if (!confirmed) return;

    setSaving(true);
    setError(null);

    const { error: deleteError } = await dataStore.deleteRecord(record.id);

    setSaving(false);

    if (deleteError) {
      setError(deleteError);
      return;
    }

    onRecordChange?.();
    onClose();
  };

  const scoreField = (key: ScoreKey, label: string) => (
    <div className={styles.field} key={key}>
      <div className={styles["label-wrap"]}>
        <h4 className={styles.label}>{label}</h4>
        <button
          type="button"
          className={styles["btn-guide"]}
          onClick={() => setOpenGuide(key)}
          aria-label={`${label} 평가 기준 보기`}
        >
          ⓘ
        </button>
      </div>
      <ol className={styles["score-list"]}>
        {SCORE_RANGE.map((score) => (
          <li key={score}>
            <button
              type="button"
              className={`${styles["btn-score"]} ${
                form[key] === score ? styles.selected : ""
              }`}
              style={{ backgroundColor: getScoreColor(score) }}
              onClick={() => setScore(key, score)}
            >
              {score}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );

  const booleanToggles = (
    <div className={styles.field}>
      <h4 className={styles.label}>특이사항</h4>
      <ul className={styles["boolean-list"]}>
        {BOOLEAN_FIELDS.map(({ key, emoji, label }) => {
          const stateKey = BOOLEAN_STATE_KEY[key];
          const active = form[stateKey];
          return (
            <li key={key}>
              <button
                type="button"
                className={`btn ${styles["btn-boolean"]} ${active ? styles.selected : ""}`}
                onClick={() => toggleBoolean(key)}
              >
                <span className={styles.emoji}>{emoji}</span>
                <span>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const extraFields = (
    <div className={styles["field-wrap"]}>
      <div className={styles.field}>
        <h4 className={styles.label}>
          수면 시간(시간) <span className="text-error">*</span>
        </h4>
        <input
          className="input"
          type="number"
          value={form.sleepHours}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, sleepHours: e.target.value }))
          }
          placeholder="예: 7 또는 7.5"
          min="0"
          step="0.5"
        />
      </div>
      <div className={styles.field}>
        <h4 className={styles.label}>체중(kg)</h4>
        <input
          className="input"
          type="number"
          value={form.weight}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, weight: e.target.value }))
          }
          placeholder="예: 65.5"
          min="0"
          step="0.1"
        />
      </div>
      <div className={styles.field}>
        <h4 className={styles.label}>음주(잔)</h4>
        <input
          className="input"
          type="number"
          value={form.alcoholAmount}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, alcoholAmount: e.target.value }))
          }
          placeholder="예: 2 또는 1.5"
          min="0"
          step="0.5"
        />
      </div>

      {booleanToggles}

      <div className={styles.field}>
        <h4 className={styles.label}>메모</h4>
        <textarea
          className="textarea"
          value={form.notes}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, notes: e.target.value }))
          }
          placeholder="특이사항을 기록하세요."
          rows={4}
        />
      </div>
    </div>
  );

  if (mode === "loading") {
    return <div className={styles.container}>불러오는 중...</div>;
  }

  if (mode === "view" && record) {
    return (
      <div className={styles.container}>
        <div className={styles["view-wrap"]}>
          <div className={styles["view-row"]}>
            <h3 className={styles["view-label"]}>기분</h3>
            <div className={styles["view-value"]}>
              {form.selectedMoods.join(", ") || "-"}
            </div>
          </div>
          <div className={styles["view-row"]}>
            <h3 className={styles["view-label"]}>불안</h3>
            <div className={styles["view-value"]}>{form.anxiety}</div>
          </div>
          <div className={styles["view-row"]}>
            <h3 className={styles["view-label"]}>짜증/분노</h3>
            <div className={styles["view-value"]}>{form.anger}</div>
          </div>
          <div className={styles["view-row"]}>
            <h3 className={styles["view-label"]}>관심/흥미</h3>
            <div className={styles["view-value"]}>{form.interest}</div>
          </div>
          <div className={styles["view-row"]}>
            <h3 className={styles["view-label"]}>활동량</h3>
            <div className={styles["view-value"]}>{form.activity}</div>
          </div>
          <div className={styles["view-row"]}>
            <h3 className={styles["view-label"]}>생각의 속도/양</h3>
            <div className={styles["view-value"]}>{form.thoughtSpeed}</div>
          </div>
          <div className={styles["view-row"]}>
            <h3 className={styles["view-label"]}>생각의 내용</h3>
            <div className={styles["view-value"]}>{form.thoughtContent}</div>
          </div>
          <div className={styles["view-row"]}>
            <h3 className={styles["view-label"]}>수면 시간</h3>
            <div className={styles["view-value"]}>{form.sleepHours}시간</div>
          </div>
          {form.weight && (
            <div className={styles["view-row"]}>
              <h3 className={styles["view-label"]}>체중</h3>
              <div className={styles["view-value"]}>{form.weight}kg</div>
            </div>
          )}
          <div className={styles["view-row"]}>
            <h3 className={styles["view-label"]}>음주</h3>
            <div className={styles["view-value"]}>{form.alcoholAmount}잔</div>
          </div>
          {(form.hasMenstruation ||
            form.hasBingeEating ||
            form.hasPhysicalPain ||
            form.hasPanicAttack ||
            form.hasExercise ||
            form.hasCrying) && (
            <div className={styles["view-row"]}>
              <h3 className={styles["view-label"]}>특이사항</h3>
              <div className={styles.tags}>
                {BOOLEAN_FIELDS.filter(
                  ({ key }) => form[BOOLEAN_STATE_KEY[key]],
                ).map(({ key, label }) => (
                  <span key={key} className={styles.tag}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}
          {form.notes && (
            <div className={styles["view-row"]}>
              <h3 className={styles["view-label"]}>메모</h3>
              <div className={styles["view-value"]}>{form.notes}</div>
            </div>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.btns}>
          <button
            type="button"
            className={`btn ${styles["btn-nav"]}`}
            onClick={() => setMode("edit")}
          >
            수정하기
          </button>
          <button
            type="button"
            className={`btn ${styles["btn-nav"]} ${styles["btn-nav-danger"]}`}
            onClick={handleDelete}
            disabled={saving}
          >
            {saving ? "삭제 중..." : "삭제하기"}
          </button>
        </div>
      </div>
    );
  }

  if (mode === "edit") {
    return (
      <div className={styles.container}>
        <div className={styles.field}>
          <h4 className={styles.label}>기분(최대 2개 선택)</h4>
          <ol className={styles["score-list"]}>
            {SCORE_RANGE.map((val) => (
              <li key={val}>
                <button
                  type="button"
                  className={`btn ${styles["btn-score"]} ${
                    form.selectedMoods.includes(val) ? styles.selected : ""
                  }`}
                  style={{ backgroundColor: getScoreColor(val) }}
                  onClick={() => toggleMood(val)}
                >
                  {val}
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h3 className={styles.subtitle}>정서 반응</h3>
          <div className={styles.field}>
            {scoreField("anxiety", GUIDE_LABELS.anxiety)}
            {scoreField("anger", GUIDE_LABELS.anger)}
          </div>
          <h3 className={`${styles.subtitle} mt22`}>의욕</h3>
          <div className={styles.field}>
            {scoreField("interest", GUIDE_LABELS.interest)}
            {scoreField("activity", GUIDE_LABELS.activity)}
          </div>
          <h3 className={`${styles.subtitle} mt22`}>생각</h3>
          <div className={styles.field}>
            {scoreField("thoughtSpeed", GUIDE_LABELS.thoughtSpeed)}
            {scoreField("thoughtContent", GUIDE_LABELS.thoughtContent)}
          </div>
        </div>

        {extraFields}

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.btns}>
          <button
            type="button"
            className={`btn ${styles["btn-nav"]}`}
            onClick={() => {
              setForm(recordToForm(record!));
              setError(null);
              setMode("view");
            }}
          >
            취소
          </button>
          <button
            type="button"
            className={`btn ${styles["btn-nav"]} ${styles["btn-nav-primary"]}`}
            onClick={handleUpdate}
            disabled={saving}
          >
            {saving ? "저장 중..." : "수정 완료"}
          </button>
        </div>

        <GuideModal guideKey={openGuide} onClose={() => setOpenGuide(null)} />
      </div>
    );
  }

  // mode === "create"
  return (
    <>
      <div className={styles.container}>
        {/* STEP INDICATOR */}
        <ol className={styles["step-indicator"]}>
          {Array.from({ length: 3 }, (_, i) => i + 1).map((step) => (
            <li
              key={step}
              className={
                step === currentStep
                  ? styles.on
                  : step < currentStep
                    ? styles.done
                    : ""
              }
            >
              <span className={styles.dot} aria-hidden="true"></span>
              STEP {step}
            </li>
          ))}
        </ol>

        {currentStep === 1 && (
          <div className={styles.field}>
            <h4 className={styles.label}>기분(최대 2개 선택)</h4>
            <ol className={styles["score-list"]}>
              {SCORE_RANGE.map((val) => (
                <li key={val}>
                  <button
                    type="button"
                    className={`btn ${styles["btn-score"]} ${
                      form.selectedMoods.includes(val) ? styles.selected : ""
                    }`}
                    style={{ backgroundColor: getScoreColor(val) }}
                    onClick={() => toggleMood(val)}
                  >
                    {val}
                  </button>
                </li>
              ))}
            </ol>
            <p className={styles.hint}>
              • 혼재상태: 하루에도 여러가지 기분이 있어 한 점수로 표현할 수 없을
              때, 가장 높은 기분 점수와 가장 낮은 점수 두 개를 선택하세요.
            </p>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h3 className={styles.subtitle}>정서 반응</h3>
            <div className={styles.field}>
              {scoreField("anxiety", GUIDE_LABELS.anxiety)}
              {scoreField("anger", GUIDE_LABELS.anger)}
            </div>
            <h3 className={`${styles.subtitle} mt22`}>의욕</h3>
            <div className={styles.field}>
              {scoreField("interest", GUIDE_LABELS.interest)}
              {scoreField("activity", GUIDE_LABELS.activity)}
            </div>
            <h3 className={`${styles.subtitle} mt22`}>생각</h3>
            <div className={styles.field}>
              {scoreField("thoughtSpeed", GUIDE_LABELS.thoughtSpeed)}
              {scoreField("thoughtContent", GUIDE_LABELS.thoughtContent)}
            </div>
          </div>
        )}

        {currentStep === 3 && extraFields}

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.btns}>
          {currentStep > 1 && (
            <button
              type="button"
              className={`btn ${styles["btn-nav"]}`}
              onClick={() => {
                setError(null);
                setCurrentStep((s) => s - 1);
              }}
            >
              이전
            </button>
          )}
          {currentStep < 3 && (
            <button
              type="button"
              className={`btn ${styles["btn-nav"]} ${styles["btn-nav-primary"]}`}
              onClick={handleNext}
            >
              다음
            </button>
          )}
          {currentStep === 3 && (
            <button
              type="button"
              className={`btn ${styles["btn-nav"]} ${styles["btn-nav-primary"]}`}
              onClick={handleCreate}
              disabled={saving}
            >
              {saving ? "저장 중..." : "저장하기"}
            </button>
          )}
        </div>
      </div>
      <GuideModal guideKey={openGuide} onClose={() => setOpenGuide(null)} />
    </>
  );
}
