"use client";

import { useEffect, useState } from "react";
import ReactCalendar from "react-calendar";

import Modal from "@/components/common/Modal";
import SidePanel from "@/components/common/SidePanel";
import RecordForm from "@/components/record/RecordForm";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { supabase } from "@/lib/supabase";
import { formatDateToYMD } from "@/utils/date";

import IconChevron from "@/assets/icons/chevron.svg";
import IconChevronDouble from "@/assets/icons/chevron-double.svg";

import styles from "./Calendar.module.scss";

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [recordedDates, setRecordedDates] = useState<Set<string>>(new Set());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    let cancelled = false;

    const loadRecordedDates = async () => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      // TODO: 인증 연동 후 user_id로 필터링 필요 (현재는 인증 미포함)
      const { data, error } = await supabase
        .from("daily_records")
        .select("record_date")
        .gte("record_date", formatDateToYMD(threeMonthsAgo));

      if (cancelled) return;

      if (error) {
        console.error("기록 날짜를 불러오지 못했습니다:", error);
        return;
      }

      setRecordedDates(
        new Set((data ?? []).map((r) => r.record_date as string)),
      );
    };

    loadRecordedDates();

    return () => {
      cancelled = true;
    };
  }, [refreshTrigger]);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsPanelOpen(true);
  };

  const handleClose = () => setIsPanelOpen(false);

  const title = selectedDate?.toLocaleDateString("ko-KR") ?? "";
  const content = selectedDate && (
    <RecordForm
      date={selectedDate}
      onClose={handleClose}
      onRecordChange={() => setRefreshTrigger((t) => t + 1)}
    />
  );

  return (
    <>
      <div className={styles.container}>
        <ReactCalendar
          onClickDay={handleDayClick}
          locale="ko-KR"
          calendarType="gregory"
          prevLabel={<IconChevron style={{ transform: "rotate(180deg)" }} />}
          prev2Label={
            <IconChevronDouble style={{ transform: "rotate(180deg)" }} />
          }
          nextLabel={<IconChevron />}
          next2Label={<IconChevronDouble />}
          formatDay={(locale, date) => date.getDate().toString()}
          tileContent={({ date, view }) =>
            view === "month" && recordedDates.has(formatDateToYMD(date)) ? (
              <span className={styles["calendar-dot"]} />
            ) : null
          }
        />
      </div>
      {isDesktop ? (
        <SidePanel isOpen={isPanelOpen} onClose={handleClose} title={title}>
          {content}
        </SidePanel>
      ) : (
        <Modal isOpen={isPanelOpen} onClose={handleClose} title={title}>
          {content}
        </Modal>
      )}
    </>
  );
}
