export function formatDateToYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** 월말평가 버튼을 홈(캘린더)에 노출하는 기간. 말일 포함 7일 */
const HOME_ASSESSMENT_WINDOW_DAYS = 7;

/** Date -> YYYY-MM */
export function formatMonthKey(date: Date): string {
  return formatDateToYMD(date).substring(0, 7);
}

/** YYYY-MM -> YYYY-MM-01 (DB에 저장되는 assessment_month 형식) */
export function monthKeyToFirstDay(monthKey: string): string {
  return `${monthKey}-01`;
}

/** YYYY-MM 형식인지 검사 */
export function isValidMonthKey(monthKey: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey);
}

/** YYYY-MM -> 해당 월의 1일 Date (자정 기준) */
export function getMonthFirstDay(monthKey: string): Date {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

/** YYYY-MM -> 해당 월의 말일 Date (자정 기준) */
export function getMonthLastDay(monthKey: string): Date {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month, 0);
}

/** YYYY-MM에서 delta개월 이동한 월 키. delta가 음수면 과거로 */
export function addMonths(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  return formatMonthKey(new Date(year, month - 1 + delta, 1));
}

/** 오늘 자정 기준 Date */
function startOfToday(today: Date): Date {
  const date = new Date(today);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** 해당 월의 월말평가를 할 수 있는지 (말일이 되었는지) */
export function isAssessableMonth(monthKey: string, today = new Date()): boolean {
  return getMonthLastDay(monthKey).getTime() <= startOfToday(today).getTime();
}

/** 오늘 기준 평가 가능한 가장 최근 월 (아직 이번 달 말일 전이면 지난달) */
export function getLatestAssessableMonth(today = new Date()): string {
  const current = formatMonthKey(today);
  if (isAssessableMonth(current, today)) return current;
  return formatMonthKey(new Date(today.getFullYear(), today.getMonth(), 0));
}

/**
 * 홈(캘린더)에 월말평가 버튼을 노출할 대상 월.
 * 말일부터 7일 이내인 월만 반환하고, 기간이 지나면 null (이후엔 통계 페이지에서 평가)
 */
export function getHomeAssessmentMonth(today = new Date()): string | null {
  const start = startOfToday(today).getTime();

  // 이번 달(말일 당일)과 지난달(말일 + 6일까지)만 후보가 될 수 있다
  for (const monthOffset of [0, 1]) {
    const monthDate = new Date(
      today.getFullYear(),
      today.getMonth() - monthOffset,
      1,
    );
    const monthKey = formatMonthKey(monthDate);
    const lastDay = getMonthLastDay(monthKey);
    const windowEnd = new Date(lastDay);
    windowEnd.setDate(windowEnd.getDate() + HOME_ASSESSMENT_WINDOW_DAYS - 1);

    if (start >= lastDay.getTime() && start <= windowEnd.getTime()) {
      return monthKey;
    }
  }

  return null;
}

/** start ~ end(포함) 사이의 모든 날짜를 YYYY-MM-DD로 */
export function eachDateInRange(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (cursor.getTime() <= last.getTime()) {
    dates.push(formatDateToYMD(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

/** YYYY-MM -> "2025년 8월" */
export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  return `${year}년 ${parseInt(month, 10)}월`;
}

/** YYYY-MM -> "8월" */
export function formatMonthShortLabel(monthKey: string): string {
  const [, month] = monthKey.split("-");
  return `${parseInt(month, 10)}월`;
}
