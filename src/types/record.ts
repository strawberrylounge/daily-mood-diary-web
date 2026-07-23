export type DailyRecord = {
  id: string;
  user_id?: string;
  record_date: string; // YYYY-MM-DD
  mood_up_score?: number | null; // 0~4
  mood_down_score?: number | null; // -4~-1
  anxiety_score: number; // -4~4
  anger_score: number;
  interest_score: number;
  activity_score: number;
  thought_speed_score: number;
  thought_content_score: number;
  sleep_hours: number;
  weight?: number | null;
  has_menstruation: boolean;
  has_binge_eating: boolean;
  has_physical_pain: boolean;
  has_panic_attack: boolean;
  has_exercise: boolean;
  has_crying: boolean;
  has_alcohol: number;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
};
