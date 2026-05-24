export type GlucoseContext =
  | "fasting"
  | "pre_meal"
  | "post_meal_1h"
  | "post_meal_2h"
  | "bedtime"
  | "other";

export const GLUCOSE_CONTEXT_LABEL: Record<GlucoseContext, string> = {
  fasting: "空腹",
  pre_meal: "餐前",
  post_meal_1h: "餐后 1h",
  post_meal_2h: "餐后 2h",
  bedtime: "睡前",
  other: "其他",
};

export type GlucoseReading = {
  id: string;
  user_id: string;
  recipe_id: string | null;
  value_mmol: number;
  context: GlucoseContext;
  measured_at: string;
  note: string | null;
  created_at: string;
};

export type GlucoseReadingInput = {
  value_mmol: number;
  context: GlucoseContext;
  measured_at: string;
  note?: string;
  recipe_id?: string | null;
};
