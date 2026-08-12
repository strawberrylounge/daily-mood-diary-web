import type { DailyRecord } from "@/types/record";
import type { MonthlyAssessment } from "@/types/assessment";

import { generateSeedData, type DemoData } from "./seedData";
import type { DataStore } from "./types";

const STORAGE_KEY = "mood-diary-demo-v1";

function loadData(): DemoData {
  if (typeof window === "undefined") {
    return { records: [], assessments: [] };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = generateSeedData();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  return JSON.parse(raw) as DemoData;
}

function saveData(data: DemoData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const localStore: DataStore = {
  async getRecordedDates(sinceDate) {
    const { records } = loadData();
    return {
      data: records
        .filter((r) => r.record_date >= sinceDate)
        .map((r) => r.record_date),
      error: null,
    };
  },

  async getRecord(dateStr) {
    const { records } = loadData();
    return {
      data: records.find((r) => r.record_date === dateStr) ?? null,
      error: null,
    };
  },

  async createRecord(payload) {
    const data = loadData();
    const record: DailyRecord = {
      ...payload,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    data.records.push(record);
    saveData(data);
    return { error: null };
  },

  async updateRecord(id, payload) {
    const data = loadData();
    const index = data.records.findIndex((r) => r.id === id);
    if (index === -1) return { error: "기록을 찾을 수 없습니다." };

    data.records[index] = {
      ...data.records[index],
      ...payload,
      updated_at: new Date().toISOString(),
    };
    saveData(data);
    return { error: null };
  },

  async deleteRecord(id) {
    const data = loadData();
    data.records = data.records.filter((r) => r.id !== id);
    saveData(data);
    return { error: null };
  },

  async getRecordsSince(sinceDate) {
    const { records } = loadData();
    return {
      data: records
        .filter((r) => r.record_date >= sinceDate)
        .sort((a, b) => b.record_date.localeCompare(a.record_date)),
      error: null,
    };
  },

  async getAssessmentSummaries() {
    const { assessments } = loadData();
    return {
      data: assessments
        .map((a) => ({
          assessment_month: a.assessment_month,
          total_score: a.total_score,
        }))
        .sort((a, b) => b.assessment_month.localeCompare(a.assessment_month)),
      error: null,
    };
  },

  async getAssessmentForMonth(month) {
    const { assessments } = loadData();
    return {
      data: assessments.find((a) => a.assessment_month === month) ?? null,
      error: null,
    };
  },

  async saveAssessment(month, score, answers, existingId) {
    const data = loadData();

    if (existingId) {
      const index = data.assessments.findIndex((a) => a.id === existingId);
      if (index === -1) return { error: "평가를 찾을 수 없습니다." };
      data.assessments[index] = {
        ...data.assessments[index],
        total_score: score,
        answers,
        updated_at: new Date().toISOString(),
      };
    } else {
      const assessment: MonthlyAssessment = {
        id: crypto.randomUUID(),
        assessment_month: month,
        total_score: score,
        answers,
        created_at: new Date().toISOString(),
      };
      data.assessments.push(assessment);
    }

    saveData(data);
    return { error: null };
  },
} satisfies DataStore;
