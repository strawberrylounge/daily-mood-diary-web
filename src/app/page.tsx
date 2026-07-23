"use client";

import Link from "next/link";

import Calendar from "@/components/calendar/Calendar";

import styles from "./home.module.scss";

export default function Home() {
  return (
    <main id="content">
      <div className="inner">
        <Link href="/assessment" className={styles.assessmentButton}>
          📝 월간 셀프 평가
        </Link>
        <Calendar />
      </div>
    </main>
  );
}
