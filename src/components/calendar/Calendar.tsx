"use client";

import { useEffect, useState } from "react";
import ReactCalendar from "react-calendar";

import Modal from "@/components/common/Modal";
import SidePanel from "@/components/common/SidePanel";
import RecordForm from "@/components/record/RecordForm";

import { useIsMounted } from "@/hooks/useIsMounted";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useDataStore } from "@/lib/dataStore";
import { formatDateToYMD } from "@/utils/date";

import IconChevron from "@/assets/icons/chevron.svg";
import IconChevronDouble from "@/assets/icons/chevron-double.svg";

import styles from "./Calendar.module.scss";

export default function Calendar() {
  const dataStore = useDataStore();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [panelKey, setPanelKey] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [recordedDates, setRecordedDates] = useState<Set<string>>(new Set());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  // 홈은 정적 프리렌더 라우트라 달력을 서버에서 렌더하면 "오늘"이 빌드 시점으로 굳는다.
  // (비활성 타일뿐 아니라 --now 하이라이트, 처음 열리는 달까지 전부 빌드 날짜 기준이 된다)
  const isMounted = useIsMounted();

  useEffect(() => {
    let cancelled = false;

    const loadRecordedDates = async () => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data, error } = await dataStore.getRecordedDates(
        formatDateToYMD(threeMonthsAgo),
      );

      if (cancelled) return;

      if (error) {
        console.error("기록 날짜를 불러오지 못했습니다:", error);
        return;
      }

      setRecordedDates(new Set(data ?? []));
    };

    loadRecordedDates();

    return () => {
      cancelled = true;
    };
  }, [refreshTrigger, dataStore]);

  const handleDayClick = (date: Date) => {
    // 탭을 자정 너머까지 열어둔 경우 렌더 시점의 판정이 낡을 수 있어 클릭 때 다시 확인한다
    if (isFutureDate(date)) return;
    setSelectedDate(date);
    setPanelKey((k) => k + 1);
    setIsPanelOpen(true);
  };

  const isFutureDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() > today.getTime();
  };

  const handleClose = () => setIsPanelOpen(false);

  const title = selectedDate?.toLocaleDateString("ko-KR") ?? "";
  const content = selectedDate && (
    <RecordForm
      key={panelKey}
      date={selectedDate}
      onClose={handleClose}
      onRecordChange={() => setRefreshTrigger((t) => t + 1)}
    />
  );

  return (
    <>
      <div className={styles.container}>
        {isMounted ? (
          <ReactCalendar
            onClickDay={handleDayClick}
            tileDisabled={({ date, view }) =>
              view === "month" && isFutureDate(date)
            }
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
        ) : (
          <div className={styles.placeholder} />
        )}
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
