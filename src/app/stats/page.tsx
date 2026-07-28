"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";

import { supabase } from "@/lib/supabase";
import { formatDateToYMD } from "@/utils/date";
import type { DailyRecord } from "@/types/record";

import styles from "./stats.module.scss";

const SERIES_COLOR = {
  moodUp: "#2a78d6",
  moodDown: "#e34948",
} as const;

const formatMonthShort = (month: string) => {
  const [, mon] = month.split("-");
  return `${parseInt(mon, 10)}월`;
};

const MoodTooltip = ({ active, payload, label }: TooltipContentProps) => {
  if (!active || !payload?.length) return null;

  const moodUp = payload.find((p) => p.dataKey === "moodUp")?.value;
  const moodDown = payload.find((p) => p.dataKey === "moodDown")?.value;

  return (
    <div className={styles["chart-tooltip"]}>
      <p className={styles["tooltip-month"]}>{label}</p>
      {typeof moodUp === "number" && (
        <div className={styles["tooltip-row"]}>
          <span
            className={styles["tooltip-key"]}
            style={
              { "--dot-color": SERIES_COLOR.moodUp } as React.CSSProperties
            }
          >
            기분 Up
          </span>
          <span className={styles["tooltip-value"]}>{moodUp.toFixed(1)}</span>
        </div>
      )}
      {typeof moodDown === "number" && (
        <div className={styles["tooltip-row"]}>
          <span
            className={styles["tooltip-key"]}
            style={
              { "--dot-color": SERIES_COLOR.moodDown } as React.CSSProperties
            }
          >
            기분 Down
          </span>
          <span className={styles["tooltip-value"]}>{moodDown.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
};

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
  totalScore: number;
}

const CHANGE_ITEMS: { key: keyof MonthlyStats; label: string }[] = [
  { key: "bingeEatingCount", label: "폭식" },
  { key: "physicalPainCount", label: "신체 통증" },
  { key: "panicAttackCount", label: "공황발작" },
  { key: "exerciseCount", label: "운동" },
  { key: "cryingCount", label: "울음" },
  { key: "alcoholDays", label: "음주" },
];

const formatMonth = (month: string) => {
  const [year, mon] = month.split("-");
  return `${year}년 ${parseInt(mon, 10)}월`;
};

export default function StatsPage() {
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chartData = useMemo(
    () =>
      [...monthlyStats]
        .sort((a, b) => a.month.localeCompare(b.month))
        .map((stat) => ({
          month: formatMonthShort(stat.month),
          moodUp: stat.avgMoodUp ?? undefined,
          moodDown: stat.avgMoodDown ?? undefined,
        })),
    [monthlyStats],
  );
  const hasMoodData = chartData.some(
    (d) => d.moodUp !== undefined || d.moodDown !== undefined,
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // TODO: 인증 연동 후 user_id로 필터링 필요 (현재는 인증 미포함)
      const [
        { data: records, error: recordsError },
        { data: assessments, error: assessmentsError },
      ] = await Promise.all([
        supabase
          .from("daily_records")
          .select("*")
          .gte("record_date", formatDateToYMD(sixMonthsAgo))
          .order("record_date", { ascending: false }),
        supabase
          .from("monthly_assessments")
          .select("assessment_month, total_score")
          .order("assessment_month", { ascending: false }),
      ]);

      if (cancelled) return;

      if (recordsError || assessmentsError) {
        setError(
          recordsError?.message ??
            assessmentsError?.message ??
            "통계를 불러오지 못했습니다.",
        );
        setLoading(false);
        return;
      }

      const assessmentMap = new Map<string, number>();
      (assessments ?? []).forEach((a) => {
        assessmentMap.set(a.assessment_month.substring(0, 7), a.total_score);
      });

      const grouped: Record<string, DailyRecord[]> = {};
      (records ?? []).forEach((record: DailyRecord) => {
        const month = record.record_date.substring(0, 7);
        if (!grouped[month]) grouped[month] = [];
        grouped[month].push(record);
      });

      const stats: MonthlyStats[] = Object.keys(grouped)
        .sort()
        .reverse()
        .map((month) => {
          const monthRecords = grouped[month];
          const count = monthRecords.length;
          const moodUp = monthRecords.filter((r) => r.mood_up_score != null);
          const moodDown = monthRecords.filter(
            (r) => r.mood_down_score != null,
          );
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
            bingeEatingCount: monthRecords.filter((r) => r.has_binge_eating)
              .length,
            physicalPainCount: monthRecords.filter((r) => r.has_physical_pain)
              .length,
            panicAttackCount: monthRecords.filter((r) => r.has_panic_attack)
              .length,
            exerciseCount: monthRecords.filter((r) => r.has_exercise).length,
            cryingCount: monthRecords.filter((r) => r.has_crying).length,
            alcoholDays: monthRecords.filter((r) => r.has_alcohol > 0).length,
            totalScore: assessmentMap.get(month) ?? 0,
          };
        });

      setMonthlyStats(stats);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

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
        {/* 차트 영역 */}
        <section>
          <h2 className={styles["section-title"]}>기분 추세</h2>
          <p className={styles.subtitle}>최근 6개월 기록을 기반으로 한 통계</p>

          <div className={styles["chart-wrap"]}>
            {loading && (
              <div className={styles["chart-wrap__empty"]}>불러오는 중...</div>
            )}
            {!loading && (error || !hasMoodData) && (
              <div className={styles["chart-wrap__empty"]}>
                {error
                  ? "통계를 불러오지 못했습니다."
                  : "표시할 기분 기록이 없습니다."}
              </div>
            )}
            {!loading && !error && hasMoodData && (
              <>
                <div className={styles["chart-legend"]}>
                  <span className={styles["legend-item"]}>
                    <span
                      className={styles["legend-swatch"]}
                      style={{ background: SERIES_COLOR.moodUp }}
                    />
                    기분 Up
                  </span>
                  <span className={styles["legend-item"]}>
                    <span
                      className={styles["legend-swatch"]}
                      style={{ background: SERIES_COLOR.moodDown }}
                    />
                    기분 Down
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={chartData}
                    barGap={2}
                    margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="var(--chart-grid)"
                    />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={{ stroke: "var(--chart-grid)" }}
                      tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
                    />
                    <YAxis
                      domain={[-4, 4]}
                      ticks={[-4, -2, 0, 2, 4]}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
                      width={28}
                    />
                    <ReferenceLine y={0} stroke="var(--chart-axis)" />
                    <Tooltip
                      content={(props) => <MoodTooltip {...props} />}
                      cursor={{ fill: "var(--chart-grid)", opacity: 0.3 }}
                    />
                    <Bar
                      dataKey="moodUp"
                      name="기분 Up"
                      fill={SERIES_COLOR.moodUp}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={24}
                    />
                    <Bar
                      dataKey="moodDown"
                      name="기분 Down"
                      fill={SERIES_COLOR.moodDown}
                      radius={[0, 0, 4, 4]}
                      maxBarSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        </section>

        {/* 월별 통계 */}
        <section>
          <h2 className={`mb16 ${styles["section-title"]}`}>월별 통계</h2>

          {loading && <div className={styles.empty}>불러오는 중...</div>}
          {error && <p className={styles.error}>{error}</p>}

          {!loading && !error && monthlyStats.length === 0 && (
            <p className={styles.empty}>아직 기록이 없습니다.</p>
          )}

          {!loading &&
            !error &&
            monthlyStats.map((stat, index) => {
              const prevStat = monthlyStats[index + 1];
              return (
                <div key={stat.month} className={styles["monthly-stats-wrap"]}>
                  <hgroup className={styles.header}>
                    <h3 className={styles["month-text"]}>
                      {formatMonth(stat.month)}
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
                      {stat.totalScore > 0 && (
                        <li className={styles["stat-item"]}>
                          <span className={styles["stat-label"]}>
                            월말평가 총점
                          </span>
                          <span className={styles["stat-value"]}>
                            {stat.totalScore}점
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
