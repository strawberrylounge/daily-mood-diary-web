"use client";

import ReactCalendar from "react-calendar";

import ChevronIcon from "@/assets/icons/chevron.svg";
import ChevronDoubleIcon from "@/assets/icons/chevron-double.svg";

import styles from "./Calendar.module.scss";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function Calendar() {
  const handleChange = (value: Value) => {
    console.log(value);
  };

  return (
    <div className={styles.container}>
      <ReactCalendar
        onChange={handleChange}
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
  );
}
