import { eachDateInRange } from "@/utils/date";
import type { DailyRecord } from "@/types/record";

export interface MoodTrendPoint {
  date: string; // YYYY-MM-DD
  /** 라인이 지나는 값. 혼재일은 최고~최저의 중앙값, 그 외에는 기록한 점수 */
  mood: number | null;
  /**
   * 미기록 구간을 잇는 보간선. 공백을 사이에 둔 두 기록일을 직선으로 채우고
   * 그 밖의 날은 null이라, 실제 기록 구간과 겹치지 않는다.
   */
  bridge: number | null;
  /** 혼재일의 반범위(중앙값 ± 이 값 = 최저~최고). 혼재가 아니면 undefined */
  moodSpread?: number;
  moodUp: number | null;
  moodDown: number | null;
  isMixed: boolean;
}

const toValue = (score: number | null | undefined) =>
  score === null || score === undefined ? null : score;

/**
 * 기간 내 모든 날짜에 대한 라인 차트 포인트를 만든다.
 * 기록이 없는 날도 mood: null로 채워 x축 간격이 실제 날짜 간격과 일치하게 한다.
 */
export function buildMoodTrend(
  records: DailyRecord[],
  startDate: Date,
  endDate: Date,
): MoodTrendPoint[] {
  const recordMap = new Map(records.map((r) => [r.record_date, r]));

  const points: MoodTrendPoint[] = eachDateInRange(startDate, endDate).map(
    (date) => {
      const record = recordMap.get(date);
      const moodUp = toValue(record?.mood_up_score);
      const moodDown = toValue(record?.mood_down_score);

      // 혼재 상태: 하루에 Up/Down을 모두 기록한 날
      if (moodUp !== null && moodDown !== null) {
        return {
          date,
          mood: (moodUp + moodDown) / 2,
          bridge: null,
          moodSpread: (moodUp - moodDown) / 2,
          moodUp,
          moodDown,
          isMixed: true,
        };
      }

      return {
        date,
        mood: moodUp ?? moodDown,
        bridge: null,
        moodUp,
        moodDown,
        isMixed: false,
      };
    },
  );

  fillBridges(points);

  return points;
}

/** 기록이 있는 두 날 사이가 하루 이상 비어 있으면 그 구간을 직선으로 채운다 */
function fillBridges(points: MoodTrendPoint[]) {
  let prevIndex = -1;

  points.forEach((point, index) => {
    if (point.mood === null) return;

    const gapLength = index - prevIndex;
    if (prevIndex !== -1 && gapLength > 1) {
      const from = points[prevIndex].mood!;
      const to = point.mood;

      for (let i = prevIndex; i <= index; i++) {
        points[i].bridge = from + ((to - from) * (i - prevIndex)) / gapLength;
      }
    }

    prevIndex = index;
  });
}
