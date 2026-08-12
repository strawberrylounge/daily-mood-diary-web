"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import MoodTrendChart from "@/components/stats/MoodTrendChart";

import { useDataStore } from "@/lib/dataStore";
import {
  formatDateToYMD,
  formatMonthKey,
  formatMonthLabel,
  getRangeStartDate,
  isAssessableMonth,
} from "@/utils/date";
import { buildMoodTrend } from "@/utils/moodTrend";
import type { DailyRecord } from "@/types/record";

import styles from "./stats.module.scss";

const RANGE_OPTIONS = [
  { months: 1, label: "1개월" },
  { months: 3, label: "3개월" },
  { months: 6, label: "6개월" },
  { months: 12, label: "1년" },
] as const;

/** 항상 1년치를 받아두고 기간 전환은 클라이언트에서 잘라 쓴다 (탭 전환 시 재조회 없음) */
const MAX_RANGE_MONTHS = 12;

interface MonthlyStats {
  month: string;
  recordCount: number;
  avgMoodUp: number | null;
  avgMoodDown: number | null;
  avgAnxiety: number;
  avgAnger: number;
  avgInterest: number;
  avgActivity: number;
  avgThoughtSpeed: number;
  avgThoughtContent: number;
  avgSleepHours: number;
  avgWeight: number | null;
  bingeEatingCount: number;
  physicalPainCount: number;
  panicAttackCount: number;
  exerciseCount: number;
  cryingCount: number;
  alcoholDays: number;
  totalScore: number | null;
}

const CHANGE_ITEMS: { key: keyof MonthlyStats; label: string }[] = [
  { key: "bingeEatingCount", label: "폭식" },
  { key: "physicalPainCount", label: "신체 통증" },
  { key: "panicAttackCount", label: "공황발작" },
  { key: "exerciseCount", label: "운동" },
  { key: "cryingCount", label: "울음" },
  { key: "alcoholDays", label: "음주" },
];

function buildMonthlyStats(
  records: DailyRecord[],
  assessmentScores: Map<string, number>,
): MonthlyStats[] {
  const grouped: Record<string, DailyRecord[]> = {};
  records.forEach((record) => {
    const month = record.record_date.substring(0, 7);
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(record);
  });

  return Object.keys(grouped)
    .sort()
    .reverse()
    .map((month) => {
      const monthRecords = grouped[month];
      const count = monthRecords.length;
      const moodUp = monthRecords.filter((r) => r.mood_up_score != null);
      const moodDown = monthRecords.filter((r) => r.mood_down_score != null);
      const weighted = monthRecords.filter((r) => r.weight != null);

      const avg = (fn: (r: DailyRecord) => number) =>
        monthRecords.reduce((sum, r) => sum + fn(r), 0) / count;

      return {
        month,
        recordCount: count,
        avgMoodUp: moodUp.length
          ? moodUp.reduce((sum, r) => sum + (r.mood_up_score ?? 0), 0) /
            moodUp.length
          : null,
        avgMoodDown: moodDown.length
          ? moodDown.reduce((sum, r) => sum + (r.mood_down_score ?? 0), 0) /
            moodDown.length
          : null,
        avgAnxiety: avg((r) => r.anxiety_score),
        avgAnger: avg((r) => r.anger_score),
        avgInterest: avg((r) => r.interest_score),
        avgActivity: avg((r) => r.activity_score),
        avgThoughtSpeed: avg((r) => r.thought_speed_score),
        avgThoughtContent: avg((r) => r.thought_content_score),
        avgSleepHours: avg((r) => r.sleep_hours),
        avgWeight: weighted.length
          ? weighted.reduce((sum, r) => sum + (r.weight ?? 0), 0) /
            weighted.length
          : null,
        bingeEatingCount: monthRecords.filter((r) => r.has_binge_eating).length,
        physicalPainCount: monthRecords.filter((r) => r.has_physical_pain)
          .length,
        panicAttackCount: monthRecords.filter((r) => r.has_panic_attack).length,
        exerciseCount: monthRecords.filter((r) => r.has_exercise).length,
        cryingCount: monthRecords.filter((r) => r.has_crying).length,
        alcoholDays: monthRecords.filter((r) => r.has_alcohol > 0).length,
        totalScore: assessmentScores.get(month) ?? null,
      };
    });
}

export default function StatsPage() {
  const dataStore = useDataStore();
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [assessmentScores, setAssessmentScores] = useState(
    () => new Map<string, number>(),
  );
  const [rangeMonths, setRangeMonths] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      const [
        { data: loadedRecords, error: recordsError },
        { data: assessments, error: assessmentsError },
      ] = await Promise.all([
        dataStore.getRecordsSince(
          formatDateToYMD(getRangeStartDate(MAX_RANGE_MONTHS)),
        ),
        dataStore.getAssessmentSummaries(),
      ]);

      if (cancelled) return;

      if (recordsError || assessmentsError) {
        setError(
          recordsError ?? assessmentsError ?? "통계를 불러오지 못했습니다.",
        );
        setLoading(false);
        return;
      }

      setRecords(loadedRecords ?? []);
      setAssessmentScores(
        new Map(
          (assessments ?? []).map((a) => [
            a.assessment_month.substring(0, 7),
            a.total_score,
          ]),
        ),
      );
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [dataStore]);

  // 증감 비교를 위해 통계는 받아온 1년 전체로 계산하고, 노출만 선택한 기간으로 자른다
  const monthlyStats = useMemo(
    () => buildMonthlyStats(records, assessmentScores),
    [records, assessmentScores],
  );

  const rangeStart = useMemo(
    () => getRangeStartDate(rangeMonths),
    [rangeMonths],
  );

  const trendPoints = useMemo(
    () => buildMoodTrend(records, rangeStart, new Date()),
    [records, rangeStart],
  );
  const hasMoodData = trendPoints.some((p) => p.mood !== null);

  const rangeStartMonth = formatMonthKey(rangeStart);
  const visibleStats = monthlyStats.filter(
    (stat) => stat.month >= rangeStartMonth,
  );

  const renderChange = (current: number, previous: number | undefined) => {
    const hasPrev = previous !== undefined;
    const diff = hasPrev ? current - previous : 0;

    return (
      <div className={styles["change-value-wrap"]}>
        <span className={styles["change-value"]}>{current}일</span>
        {hasPrev && diff !== 0 && (
          <span
            className={`${styles.badge} ${diff > 0 ? styles.up : styles.down}`}
          >
            {diff > 0 ? "▲" : "▼"} {Math.abs(diff)}
          </span>
        )}
        {/* {!hasPrev && <span className={styles["no-comparison"]}>-</span>} */}
      </div>
    );
  };

  return (
    <main id="content" className={styles["page-stats"]}>
      <div className="inner">
        {/* 기간 필터: 아래 차트와 월별 통계 모두에 적용된다 */}
        <div className={styles["range-tabs"]} role="tablist" aria-label="기간">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.months}
              type="button"
              role="tab"
              aria-selected={rangeMonths === option.months}
              className={`${styles["range-tab"]} ${
                rangeMonths === option.months ? styles.selected : ""
              }`}
              onClick={() => setRangeMonths(option.months)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* 차트 영역 */}
        <section>
          <h2 className={styles["section-title"]}>기분 추세</h2>
          <p className={styles.subtitle}>날짜별 기분 점수의 변화</p>

          {loading && (
            <div className={styles["chart-empty"]}>불러오는 중...</div>
          )}
          {!loading && (error || !hasMoodData) && (
            <div className={styles["chart-empty"]}>
              {error
                ? "통계를 불러오지 못했습니다."
                : "표시할 기분 기록이 없습니다."}
            </div>
          )}
          {!loading && !error && hasMoodData && (
            <MoodTrendChart points={trendPoints} months={rangeMonths} />
          )}
        </section>

        {/* 월별 통계 */}
        <section>
          <h2 className={`mb16 ${styles["section-title"]}`}>월별 통계</h2>

          {loading && <div className={styles.empty}>불러오는 중...</div>}
          {error && <p className={styles.error}>{error}</p>}

          {!loading && !error && visibleStats.length === 0 && (
            <p className={styles.empty}>아직 기록이 없습니다.</p>
          )}

          {!loading &&
            !error &&
            visibleStats.map((stat, index) => {
              // 기간 밖이더라도 바로 이전 달이 있으면 증감 비교에 쓴다
              const prevStat = monthlyStats[index + 1];
              return (
                <div key={stat.month} className={styles["monthly-stats-wrap"]}>
                  <hgroup className={styles.header}>
                    <h3 className={styles["month-text"]}>
                      {formatMonthLabel(stat.month)}
                    </h3>
                    <span className={styles["count-text"]}>
                      {stat.recordCount}일 기록됨
                    </span>
                  </hgroup>

                  <div className={styles.body}>
                    <div className={styles["change-area"]}>
                      <h4 className={styles["change-title"]}>
                        지난 달 대비 증감
                      </h4>
                      <ul className={styles["change-contents"]}>
                        {CHANGE_ITEMS.map(({ key, label }) => (
                          <li key={key} className={styles["change-item"]}>
                            <span className={styles["change-item-label"]}>
                              {label}
                            </span>
                            {renderChange(
                              stat[key] as number,
                              prevStat ? (prevStat[key] as number) : undefined,
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <ul className={styles["stats-area"]}>
                      {stat.avgMoodUp !== null && (
                        <li className={styles["stat-item"]}>
                          <span className={styles["stat-label"]}>
                            기분 Up 평균
                          </span>
                          <span className={styles["stat-value"]}>
                            {stat.avgMoodUp.toFixed(1)}
                          </span>
                        </li>
                      )}
                      {stat.avgMoodDown !== null && (
                        <li className={styles["stat-item"]}>
                          <span className={styles["stat-label"]}>
                            기분 Down 평균
                          </span>
                          <span className={styles["stat-value"]}>
                            {stat.avgMoodDown.toFixed(1)}
                          </span>
                        </li>
                      )}
                      <li className={styles["stat-item"]}>
                        <span className={styles["stat-label"]}>불안</span>
                        <span className={styles["stat-value"]}>
                          {stat.avgAnxiety.toFixed(1)}
                        </span>
                      </li>
                      <li className={styles["stat-item"]}>
                        <span className={styles["stat-label"]}>짜증/분노</span>
                        <span className={styles["stat-value"]}>
                          {stat.avgAnger.toFixed(1)}
                        </span>
                      </li>
                      <li className={styles["stat-item"]}>
                        <span className={styles["stat-label"]}>관심/흥미</span>
                        <span className={styles["stat-value"]}>
                          {stat.avgInterest.toFixed(1)}
                        </span>
                      </li>
                      <li className={styles["stat-item"]}>
                        <span className={styles["stat-label"]}>활동량</span>
                        <span className={styles["stat-value"]}>
                          {stat.avgActivity.toFixed(1)}
                        </span>
                      </li>
                      <li className={styles["stat-item"]}>
                        <span className={styles["stat-label"]}>
                          생각의 속도/양
                        </span>
                        <span className={styles["stat-value"]}>
                          {stat.avgThoughtSpeed.toFixed(1)}
                        </span>
                      </li>
                      <li className={styles["stat-item"]}>
                        <span className={styles["stat-label"]}>
                          생각의 내용
                        </span>
                        <span className={styles["stat-value"]}>
                          {stat.avgThoughtContent.toFixed(1)}
                        </span>
                      </li>
                      <li className={styles["stat-item"]}>
                        <span className={styles["stat-label"]}>수면 시간</span>
                        <span className={styles["stat-value"]}>
                          {stat.avgSleepHours.toFixed(1)}h
                        </span>
                      </li>
                      {stat.avgWeight !== null && (
                        <li className={styles["stat-item"]}>
                          <span className={styles["stat-label"]}>체중</span>
                          <span className={styles["stat-value"]}>
                            {stat.avgWeight.toFixed(1)}kg
                          </span>
                        </li>
                      )}
                      {/* 말일이 지난 달만 노출. 이미 평가했으면 점수 + 수정, 아니면 평가하기 */}
                      {(stat.totalScore !== null ||
                        isAssessableMonth(stat.month)) && (
                        <li className={styles["stat-item"]}>
                          <span className={styles["stat-label"]}>
                            월말평가 총점
                          </span>
                          <span className={styles["assessment-wrap"]}>
                            {stat.totalScore !== null && (
                              <span className={styles["stat-value"]}>
                                {stat.totalScore}점
                              </span>
                            )}
                            <Link
                              href={`/assessment?month=${stat.month}`}
                              className={styles["btn-assessment"]}
                            >
                              {stat.totalScore !== null ? "수정" : "평가하기"}
                            </Link>
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              );
            })}
        </section>
      </div>
    </main>
  );
}
