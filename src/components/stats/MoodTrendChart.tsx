"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  ErrorBar,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DotItemDotProps, TooltipContentProps } from "recharts";

import type { MoodTrendPoint } from "@/utils/moodTrend";

import styles from "./MoodTrendChart.module.scss";

// 기분 라인과 혼재 마커. 흰 배경 대비 3:1 이상, 색각 이상에서도 ΔE 21 이상으로 검증된 조합
const LINE_COLOR = "#2a78d6";
const MIXED_COLOR = "#e34948";

const DIAMOND_RADIUS = 4;

const formatFullDate = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
};

const MoodTooltip = ({ active, payload }: TooltipContentProps) => {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload as MoodTrendPoint;
  if (point.mood === null) return null;

  return (
    <div className={styles.tooltip}>
      <p className={styles["tooltip-date"]}>{formatFullDate(point.date)}</p>
      {point.isMixed ? (
        <>
          <div className={styles["tooltip-row"]}>
            <span className={styles["tooltip-key"]}>최고</span>
            <span className={styles["tooltip-value"]}>
              {point.moodUp! > 0 ? `+${point.moodUp}` : point.moodUp}
            </span>
          </div>
          <div className={styles["tooltip-row"]}>
            <span className={styles["tooltip-key"]}>최저</span>
            <span className={styles["tooltip-value"]}>{point.moodDown}</span>
          </div>
          <p className={styles["tooltip-note"]}>혼재 상태</p>
        </>
      ) : (
        <div className={styles["tooltip-row"]}>
          <span className={styles["tooltip-key"]}>기분</span>
          <span className={styles["tooltip-value"]}>
            {point.mood > 0 ? `+${point.mood}` : point.mood}
          </span>
        </div>
      )}
    </div>
  );
};

/** 일반일은 원, 혼재일은 마름모. 기록 없는 날은 아무것도 그리지 않는다 */
function MoodDot({
  cx,
  cy,
  payload,
  radius,
}: DotItemDotProps & { radius: number }) {
  const point = payload as MoodTrendPoint;
  if (cx == null || cy == null || point?.mood == null) return null;

  if (point.isMixed) {
    const r = DIAMOND_RADIUS;
    return (
      <path
        d={`M${cx} ${cy - r}L${cx + r} ${cy}L${cx} ${cy + r}L${cx - r} ${cy}Z`}
        fill={MIXED_COLOR}
        stroke="#fff"
        strokeWidth={1}
      />
    );
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={radius}
      fill={LINE_COLOR}
      stroke="#fff"
      strokeWidth={1}
    />
  );
}

interface MoodTrendChartProps {
  points: MoodTrendPoint[];
  /** 선택한 기간(개월). 눈금 간격과 점 크기를 정하는 데 쓴다 */
  months: number;
}

export default function MoodTrendChart({
  points,
  months,
}: MoodTrendChartProps) {
  const isSingleMonth = months === 1;

  // 1개월은 5일 간격, 그 이상은 월초만. 1년은 두 달에 한 번씩만 찍어야 겹치지 않는다
  const ticks = useMemo(() => {
    if (isSingleMonth) {
      return points.filter((_, index) => index % 5 === 0).map((p) => p.date);
    }

    const step = months >= 12 ? 2 : 1;
    return points
      .filter((p) => p.date.endsWith("-01"))
      .filter((_, index) => index % step === 0)
      .map((p) => p.date);
  }, [points, months, isSingleMonth]);

  const formatTick = (date: string) => {
    const [, month, day] = date.split("-").map(Number);
    return isSingleMonth ? `${day}일` : `${month}월`;
  };

  return (
    <div className={styles["chart-wrap"]}>
      <div className={styles.legend}>
        <span className={styles["legend-item"]}>
          <svg width="12" height="12" aria-hidden="true">
            <circle cx="6" cy="6" r="3.5" fill={LINE_COLOR} />
          </svg>
          하루 기분
        </span>
        <span className={styles["legend-item"]}>
          <svg width="12" height="12" aria-hidden="true">
            <path d="M6 1L11 6L6 11L1 6Z" fill={MIXED_COLOR} />
          </svg>
          혼재 (그날의 최고↔최저)
        </span>
        <span className={styles["legend-item"]}>
          <svg width="16" height="12" aria-hidden="true">
            <line
              x1="0"
              y1="6"
              x2="16"
              y2="6"
              stroke={LINE_COLOR}
              strokeOpacity={0.4}
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          </svg>
          미기록 구간
        </span>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart
          data={points}
          margin={{ top: 8, right: 10, left: -12, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="date"
            ticks={ticks}
            tickFormatter={formatTick}
            tickLine={false}
            axisLine={{ stroke: "var(--chart-grid)" }}
            tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
            interval={0}
            minTickGap={0}
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
            cursor={{ stroke: "var(--chart-axis)", strokeWidth: 1 }}
          />
          {/* 미기록 구간을 잇는 보간선. 실제 기록 구간에는 값이 없어 겹치지 않는다 */}
          <Line
            type="linear"
            dataKey="bridge"
            stroke={LINE_COLOR}
            strokeOpacity={0.4}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            connectNulls={false}
            dot={false}
            activeDot={false}
            tooltipType="none"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="mood"
            stroke={LINE_COLOR}
            strokeWidth={2}
            connectNulls={false}
            dot={(props) => (
              <MoodDot {...props} radius={isSingleMonth ? 3 : 2} />
            )}
            activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
            isAnimationActive={false}
          >
            {/* 혼재일에만 값이 있어 그 날짜에만 최고~최저 범위 막대가 그려진다 */}
            <ErrorBar
              dataKey="moodSpread"
              width={3}
              strokeWidth={1.5}
              stroke={MIXED_COLOR}
              isAnimationActive={false}
            />
          </Line>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
