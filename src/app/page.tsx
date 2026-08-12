"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import Calendar from "@/components/calendar/Calendar";

import { useDataStore } from "@/lib/dataStore";
import {
  formatMonthShortLabel,
  getHomeAssessmentMonth,
  monthKeyToFirstDay,
} from "@/utils/date";

import styles from "./home.module.scss";

export default function Home() {
  const dataStore = useDataStore();
  // 말일부터 일주일 이내이면서 아직 평가하지 않은 월만 홈에 노출한다
  const [pendingMonth, setPendingMonth] = useState<string | null>(null);

  useEffect(() => {
    const monthKey = getHomeAssessmentMonth();
    if (!monthKey) return;

    let cancelled = false;

    const checkAssessment = async () => {
      const { data, error } = await dataStore.getAssessmentForMonth(
        monthKeyToFirstDay(monthKey),
      );

      if (cancelled || error || data) return;

      setPendingMonth(monthKey);
    };

    checkAssessment();

    return () => {
      cancelled = true;
    };
  }, [dataStore]);

  return (
    <main id="content">
      <div className="inner pt50">
        {pendingMonth && (
          <Link
            href={`/assessment?month=${pendingMonth}`}
            className={styles["btn-assessment"]}
          >
            📝 {formatMonthShortLabel(pendingMonth)} 월말 평가하기
          </Link>
        )}
        <Calendar />
      </div>
    </main>
  );
}
