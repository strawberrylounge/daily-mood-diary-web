"use client";

import { useState } from "react";
import ReactCalendar from "react-calendar";

import Modal from "@/components/common/Modal";
import RecordForm from "@/components/record/RecordForm";
import ChevronIcon from "@/assets/icons/chevron.svg";
import ChevronDoubleIcon from "@/assets/icons/chevron-double.svg";

import styles from "./Calendar.module.scss";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className={styles.container}>
        <ReactCalendar
          onClickDay={handleDayClick}
          locale="ko-KR"
          calendarType="gregory"
          prevLabel={<ChevronIcon style={{ transform: "rotate(180deg)" }} />}
          prev2Label={
            <ChevronDoubleIcon style={{ transform: "rotate(180deg)" }} />
          }
          nextLabel={<ChevronIcon />}
          next2Label={<ChevronDoubleIcon />}
          formatDay={(locale, date) => date.getDate().toString()}
        />
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedDate?.toLocaleDateString("ko-KR") ?? ""}
      >
        {selectedDate && (
          <RecordForm
            date={selectedDate}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </Modal>
    </>
  );
}
