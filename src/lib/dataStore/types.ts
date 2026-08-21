import type { DailyRecord } from "@/types/record";
import type { MonthlyAssessment } from "@/types/assessment";

export type DailyRecordPayload = Omit<
  DailyRecord,
  "id" | "created_at" | "updated_at" | "user_id"
>;

export type AssessmentSummary = {
  assessment_month: string;
  total_score: number;
};

export interface DataStore {
  getRecordedDates(
    sinceDate: string,
  ): Promise<{ data: string[] | null; error: string | null }>;
  getRecord(
    dateStr: string,
  ): Promise<{ data: DailyRecord | null; error: string | null }>;
  createRecord(
    payload: DailyRecordPayload,
  ): Promise<{ error: string | null }>;
  updateRecord(
    id: string,
    payload: DailyRecordPayload,
  ): Promise<{ error: string | null }>;
  deleteRecord(id: string): Promise<{ error: string | null }>;
  getRecordsSince(
    sinceDate: string,
  ): Promise<{ data: DailyRecord[] | null; error: string | null }>;
  /** 가장 오래된 기록의 날짜 (기록이 없으면 null). 통계에서 과거로 더 이동할 수 있는지 판단에 쓴다 */
  getEarliestRecordDate(): Promise<{
    data: string | null;
    error: string | null;
  }>;
  getAssessmentSummaries(): Promise<{
    data: AssessmentSummary[] | null;
    error: string | null;
  }>;
  getAssessmentForMonth(month: string): Promise<{
    data: MonthlyAssessment | null;
    error: string | null;
  }>;
  saveAssessment(
    month: string,
    score: number,
    answers: Record<string, string>,
    existingId?: string,
  ): Promise<{ error: string | null }>;
}
