import { getSupabaseClient } from "@/lib/supabase";
import type { DailyRecord } from "@/types/record";
import type { MonthlyAssessment } from "@/types/assessment";

import type { AssessmentSummary, DataStore } from "./types";

export const supabaseStore: DataStore = {
  async getRecordedDates(sinceDate) {
    const { data, error } = await getSupabaseClient()
      .from("daily_records")
      .select("record_date")
      .gte("record_date", sinceDate);

    if (error) return { data: null, error: error.message };
    return {
      data: (data ?? []).map((r) => r.record_date as string),
      error: null,
    };
  },

  async getRecord(dateStr) {
    const { data, error } = await getSupabaseClient()
      .from("daily_records")
      .select("*")
      .eq("record_date", dateStr)
      .maybeSingle();

    return { data: data as DailyRecord | null, error: error?.message ?? null };
  },

  async createRecord(payload) {
    const { error } = await getSupabaseClient()
      .from("daily_records")
      .insert(payload);

    return { error: error?.message ?? null };
  },

  async updateRecord(id, payload) {
    const { error } = await getSupabaseClient()
      .from("daily_records")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id);

    return { error: error?.message ?? null };
  },

  async deleteRecord(id) {
    const { error } = await getSupabaseClient()
      .from("daily_records")
      .delete()
      .eq("id", id);

    return { error: error?.message ?? null };
  },

  async getRecordsSince(sinceDate) {
    const { data, error } = await getSupabaseClient()
      .from("daily_records")
      .select("*")
      .gte("record_date", sinceDate)
      .order("record_date", { ascending: false });

    return { data: data as DailyRecord[] | null, error: error?.message ?? null };
  },

  async getAssessmentSummaries() {
    const { data, error } = await getSupabaseClient()
      .from("monthly_assessments")
      .select("assessment_month, total_score")
      .order("assessment_month", { ascending: false });

    return {
      data: data as AssessmentSummary[] | null,
      error: error?.message ?? null,
    };
  },

  async getAssessmentForMonth(month) {
    const { data, error } = await getSupabaseClient()
      .from("monthly_assessments")
      .select("*")
      .eq("assessment_month", month)
      .maybeSingle();

    return {
      data: data as MonthlyAssessment | null,
      error: error?.message ?? null,
    };
  },

  async saveAssessment(month, score, answers, existingId) {
    const { error } = existingId
      ? await getSupabaseClient()
          .from("monthly_assessments")
          .update({
            total_score: score,
            answers,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingId)
      : await getSupabaseClient().from("monthly_assessments").insert({
          assessment_month: month,
          total_score: score,
          answers,
        });

    return { error: error?.message ?? null };
  },
} satisfies DataStore;
