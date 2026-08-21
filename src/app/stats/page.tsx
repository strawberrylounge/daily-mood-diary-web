"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import MoodTrendChart from "@/components/stats/MoodTrendChart";

import { useIsMounted } from "@/hooks/useIsMounted";
import { useDataStore } from "@/lib/dataStore";
import {
  addMonths,
  formatDateToYMD,
  formatMonthKey,
  formatMonthLabel,
  formatMonthShortLabel,
  getMonthFirstDay,
  getMonthLastDay,
  isAssessableMonth,
} from "@/utils/date";
import { buildMoodTrend } from "@/utils/moodTrend";
import type { DailyRecord } from "@/types/record";

import IconChevron from "@/assets/icons/chevron.svg";

import styles from "./stats.module.scss";

const RANGE_OPTIONS = [
  { months: 1, label: "1개월" },
  { months: 3, label: "3개월" },
  { months: 6, label: "6개월" },
  { months: 12, label: "1년" },
] as const;

/**
 * 한 번에 받아두는 구간(개월). 기본은 1년치라 기간 탭 전환만으로는 재조회가 없고,
 * 화살표로 그보다 과거까지 거슬러 올라갔을 때만 이 단위로 구간을 넓혀 다시 받아온다.
 */
const LOAD_CHUNK_MONTHS = 12;

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
  /** 기록이 존재하는 가장 이른 월. 과거로 더 이동할 수 있는지 판단에 쓴다 */
  const [earliestMonth, setEarliestMonth] = useState<string | null>(null);
  /** 이번 달 기준으로 과거로 이동한 개월 수. 0이면 이번 달이 구간의 끝 */
  const [monthOffset, setMonthOffset] = useState(0);
  /** 지금 조회해 둔 구간의 길이(개월). 과거로 이동하다 모자라면 넓힌다 */
  const [loadMonths, setLoadMonths] = useState(LOAD_CHUNK_MONTHS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 통계도 정적 프리렌더 라우트라 서버에서 "오늘"을 읽으면 빌드 시점 날짜가 HTML에 굳는다
  const isMounted = useIsMounted();
  const currentMonth = isMounted ? formatMonthKey(new Date()) : null;

  // 보고 있는 구간: [startMonth, anchorMonth]
  const anchorMonth = currentMonth
    ? addMonths(currentMonth, -monthOffset)
    : null;
  const startMonth = anchorMonth
    ? addMonths(anchorMonth, -(rangeMonths - 1))
    : null;
  const loadedSinceMonth = currentMonth
    ? addMonths(currentMonth, -(loadMonths - 1))
    : null;

  /** 새로 보려는 구간이 조회해 둔 범위를 벗어나면 조회 구간을 한 덩어리씩 넓힌다 */
  const ensureLoadRange = (offset: number, months: number) => {
    const needed = offset + months;
    if (needed <= loadMonths) return;
    setLoadMonths(Math.ceil(needed / LOAD_CHUNK_MONTHS) * LOAD_CHUNK_MONTHS);
  };

  useEffect(() => {
    if (!loadedSinceMonth) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      // 첫 달의 "지난 달 대비 증감"까지 계산하려면 한 달 앞에서부터 받아야 한다
      const sinceDate = formatDateToYMD(
        getMonthFirstDay(addMonths(loadedSinceMonth, -1)),
      );

      const [
        { data: loadedRecords, error: recordsError },
        { data: assessments, error: assessmentsError },
        { data: earliestDate, error: earliestError },
      ] = await Promise.all([
        dataStore.getRecordsSince(sinceDate),
        dataStore.getAssessmentSummaries(),
        dataStore.getEarliestRecordDate(),
      ]);

      if (cancelled) return;

      if (recordsError || assessmentsError || earliestError) {
        setError(
          recordsError ??
            assessmentsError ??
            earliestError ??
            "통계를 불러오지 못했습니다.",
        );
        setLoading(false);
        return;
      }

      setRecords(loadedRecords ?? []);
      setEarliestMonth(earliestDate ? earliestDate.substring(0, 7) : null);
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
  }, [dataStore, loadedSinceMonth]);

  // 증감 비교를 위해 통계는 받아온 구간 전체로 계산하고, 노출만 보고 있는 구간으로 자른다
  const monthlyStats = useMemo(
    () => buildMonthlyStats(records, assessmentScores),
    [records, assessmentScores],
  );
  const statsByMonth = useMemo(
    () => new Map(monthlyStats.map((stat) => [stat.month, stat])),
    [monthlyStats],
  );

  const trendPoints = useMemo(() => {
    if (!startMonth || !anchorMonth) return [];

    // 이번 달을 보고 있으면 오늘까지, 지난 구간이면 그 달 말일까지 그린다
    const endDate =
      anchorMonth === currentMonth ? new Date() : getMonthLastDay(anchorMonth);

    return buildMoodTrend(records, getMonthFirstDay(startMonth), endDate);
  }, [records, startMonth, anchorMonth, currentMonth]);
  const hasMoodData = trendPoints.some((p) => p.mood !== null);

  const visibleStats =
    startMonth && anchorMonth
      ? monthlyStats.filter(
          (stat) => stat.month >= startMonth && stat.month <= anchorMonth,
        )
      : [];

  const canGoPrev = Boolean(
    startMonth && earliestMonth && earliestMonth < startMonth,
  );
  const canGoNext = monthOffset > 0;

  // 화살표는 보고 있는 구간 길이만큼 통째로 이동한다 (1개월이면 한 달씩, 1년이면 1년씩)
  const goPrev = () => {
    const nextOffset = monthOffset + rangeMonths;
    ensureLoadRange(nextOffset, rangeMonths);
    setMonthOffset(nextOffset);
  };
  const goNext = () => setMonthOffset(Math.max(0, monthOffset - rangeMonths));

  const changeRange = (months: number) => {
    ensureLoadRange(monthOffset, months);
    setRangeMonths(months);
  };

  const rangeLabel = (() => {
    if (!startMonth || !anchorMonth) return "";
    if (startMonth === anchorMonth) return formatMonthLabel(anchorMonth);

    const sameYear = startMonth.substring(0, 4) === anchorMonth.substring(0, 4);
    const end = sameYear
      ? formatMonthShortLabel(anchorMonth)
      : formatMonthLabel(anchorMonth);

    return `${formatMonthLabel(startMonth)} ~ ${end}`;
  })();

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
              onClick={() => changeRange(option.months)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* 구간 이동: 지난 달/지난 구간도 화살표로 되짚어 볼 수 있다 */}
        <div className={styles["range-nav"]}>
          <button
            type="button"
            className={styles["nav-btn"]}
            onClick={goPrev}
            disabled={!canGoPrev}
            aria-label="이전 기간"
          >
            <IconChevron style={{ transform: "rotate(180deg)" }} />
          </button>
          <span className={styles["range-label"]}>{rangeLabel}</span>
          <button
            type="button"
            className={styles["nav-btn"]}
            onClick={goNext}
            disabled={!canGoNext}
            aria-label="다음 기간"
          >
            <IconChevron />
          </button>
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
            <p className={styles.empty}>이 기간에는 기록이 없습니다.</p>
          )}

          {!loading &&
            !error &&
            visibleStats.map((stat) => {
              // 보고 있는 구간 밖이더라도 직전 달 기록이 있으면 증감 비교에 쓴다
              const prevStat = statsByMonth.get(addMonths(stat.month, -1));
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
