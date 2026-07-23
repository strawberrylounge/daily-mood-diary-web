"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import { formatDateToYMD } from "@/utils/date";
import type { DailyRecord } from "@/types/record";

import styles from "./stats.module.scss";

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
            "통계를 불러오지 못했습니다."
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
            (r) => r.mood_down_score != null
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
              ? moodDown.reduce(
                  (sum, r) => sum + (r.mood_down_score ?? 0),
                  0
                ) / moodDown.length
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
      <div className={styles.changeValueRow}>
        <span className={styles.changeValue}>{current}일</span>
        {hasPrev && diff !== 0 && (
          <span
            className={`${styles.changeBadge} ${
              diff > 0 ? styles.changeUp : styles.changeDown
            }`}
          >
            {diff > 0 ? "▲" : "▼"} {Math.abs(diff)}
          </span>
        )}
        {!hasPrev && <span className={styles.noComparison}>-</span>}
      </div>
    );
  };

  return (
    <main id="content" className={styles.page}>
      <div className="inner">
        <h1 className={styles.title}>기분 추세</h1>
        <p className={styles.subtitle}>최근 6개월 기록을 기반으로 한 통계</p>

        <div className={styles.chartPlaceholder}>
          그래프 영역 (chart.js 연동 예정)
        </div>

        <h2 className={styles.sectionTitle}>월별 통계</h2>

        {loading && <p className={styles.empty}>불러오는 중...</p>}
        {error && <p className={styles.errorText}>{error}</p>}

        {!loading && !error && monthlyStats.length === 0 && (
          <p className={styles.empty}>아직 기록이 없습니다.</p>
        )}

        {!loading &&
          !error &&
          monthlyStats.map((stat, index) => {
            const prevStat = monthlyStats[index + 1];
            return (
              <div key={stat.month} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.monthText}>
                    {formatMonth(stat.month)}
                  </span>
                  <span className={styles.countText}>
                    {stat.recordCount}일 기록됨
                  </span>
                </div>

                <div className={styles.changeSection}>
                  <p className={styles.changeSectionTitle}>
                    지난 달 대비 증감
                  </p>
                  <div className={styles.changeGrid}>
                    {CHANGE_ITEMS.map(({ key, label }) => (
                      <div key={key} className={styles.changeItem}>
                        <span className={styles.changeLabel}>{label}</span>
                        {renderChange(
                          stat[key] as number,
                          prevStat ? (prevStat[key] as number) : undefined
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.statsGrid}>
                  {stat.avgMoodUp !== null && (
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>기분 Up 평균</span>
                      <span className={styles.statValue}>
                        {stat.avgMoodUp.toFixed(1)}
                      </span>
                    </div>
                  )}
                  {stat.avgMoodDown !== null && (
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>기분 Down 평균</span>
                      <span className={styles.statValue}>
                        {stat.avgMoodDown.toFixed(1)}
                      </span>
                    </div>
                  )}
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>불안</span>
                    <span className={styles.statValue}>
                      {stat.avgAnxiety.toFixed(1)}
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>짜증/분노</span>
                    <span className={styles.statValue}>
                      {stat.avgAnger.toFixed(1)}
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>관심/흥미</span>
                    <span className={styles.statValue}>
                      {stat.avgInterest.toFixed(1)}
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>활동량</span>
                    <span className={styles.statValue}>
                      {stat.avgActivity.toFixed(1)}
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>생각의 속도/양</span>
                    <span className={styles.statValue}>
                      {stat.avgThoughtSpeed.toFixed(1)}
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>생각의 내용</span>
                    <span className={styles.statValue}>
                      {stat.avgThoughtContent.toFixed(1)}
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>수면 시간</span>
                    <span className={styles.statValue}>
                      {stat.avgSleepHours.toFixed(1)}h
                    </span>
                  </div>
                  {stat.avgWeight !== null && (
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>체중</span>
                      <span className={styles.statValue}>
                        {stat.avgWeight.toFixed(1)}kg
                      </span>
                    </div>
                  )}
                  {stat.totalScore > 0 && (
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>월말평가 총점</span>
                      <span className={styles.statValue}>
                        {stat.totalScore}점
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </main>
  );
}
