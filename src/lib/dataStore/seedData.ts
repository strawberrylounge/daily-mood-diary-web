import { formatDateToYMD, getLatestAssessableMonth } from "@/utils/date";
import type { DailyRecord } from "@/types/record";
import {
  ASSESSMENT_QUESTIONS,
  calculateAssessmentScore,
  type MonthlyAssessment,
} from "@/types/assessment";

const DAYS_BACK = 150;
const RECORD_PROBABILITY = 0.7;
const MONTHS_BACK = 5;

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const chance = (p: number) => Math.random() < p;

const roundHalf = (n: number) => Math.round(n * 2) / 2;

function buildRecord(date: Date): DailyRecord {
  const isDown = chance(0.35);
  const isMixed = chance(0.1);

  return {
    id: crypto.randomUUID(),
    record_date: formatDateToYMD(date),
    mood_up_score: !isDown || isMixed ? randInt(0, 4) : null,
    mood_down_score: isDown || isMixed ? randInt(-4, -1) : null,
    anxiety_score: randInt(-4, 4),
    anger_score: randInt(-4, 4),
    interest_score: randInt(-4, 4),
    activity_score: randInt(-4, 4),
    thought_speed_score: randInt(-4, 4),
    thought_content_score: randInt(-4, 4),
    sleep_hours: roundHalf(4 + Math.random() * 5),
    weight: chance(0.6) ? Math.round((58 + (Math.random() * 3 - 1.5)) * 10) / 10 : null,
    has_menstruation: chance(0.1),
    has_binge_eating: chance(0.1),
    has_physical_pain: chance(0.15),
    has_panic_attack: chance(0.08),
    has_exercise: chance(0.3),
    has_crying: chance(0.12),
    has_alcohol: chance(0.15) ? randInt(1, 3) : 0,
    notes: null,
    created_at: date.toISOString(),
  };
}

function buildRecords(): DailyRecord[] {
  const records: DailyRecord[] = [];
  const today = new Date();

  for (let i = 0; i < DAYS_BACK; i++) {
    if (!chance(RECORD_PROBABILITY)) continue;
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    records.push(buildRecord(date));
  }

  return records;
}

function buildAssessments(): MonthlyAssessment[] {
  const assessments: MonthlyAssessment[] = [];
  const [latestYear, latestMonth] = getLatestAssessableMonth()
    .split("-")
    .map(Number);

  // 말일이 지난 달만 평가 데이터를 만든다
  for (let i = 0; i < MONTHS_BACK; i++) {
    const monthDate = new Date(latestYear, latestMonth - 1 - i, 1);
    const answers: Record<string, string> = {};

    ASSESSMENT_QUESTIONS.forEach((question) => {
      answers[question.id] =
        question.options[randInt(0, question.options.length - 1)].id;
    });

    assessments.push({
      id: crypto.randomUUID(),
      assessment_month: formatDateToYMD(monthDate),
      total_score: calculateAssessmentScore(answers),
      answers,
      created_at: monthDate.toISOString(),
    });
  }

  return assessments;
}

export type DemoData = {
  records: DailyRecord[];
  assessments: MonthlyAssessment[];
};

export function generateSeedData(): DemoData {
  return {
    records: buildRecords(),
    assessments: buildAssessments(),
  };
}
