export type Friendly = "ok" | "mod" | "caution";

export type SourceCode = "CN" | "ADA" | "JDS";

export type Ingredient = {
  name: string;
  friendly: Friendly;
  note: string;
  /** 已知血糖生成指数（如有），用整数表示 */
  gi?: number;
  /** 该条标注的循证来源 */
  sources?: SourceCode[];
};

export type Meal = "早餐" | "午餐" | "晚餐";

export type Preferences = {
  meal: Meal;
  taste: string;
  staple: string;
  ingredients: Ingredient[];
};

export type RuleId =
  | "diversity"
  | "energy"
  | "staple"
  | "veg-protein"
  | "low-fat-salt-sugar"
  | "meal-order"
  | "regular-meal"
  | "carb-quantify";

export type RuleCheck = {
  id: RuleId;
  /** 是否符合该条规则 */
  passed: boolean;
  /** 简短理由：为什么算 pass / fail */
  reason: string;
};

export type Recipe = {
  dishName: string;
  dishNameEn?: string;
  /** 明确克数，不是模糊文字 */
  carbsGrams: number;
  /** 升糖负荷估算 */
  glycemicLoad: "low" | "medium" | "high";
  /** 升糖指数估算（菜肴整体） */
  gi?: "low" | "medium" | "high";
  why?: string;
  nutrition?: {
    carbs: string;
    fiber: string;
    protein: string;
    fat: string;
    calories: string;
  };
  ingredients: { name: string; amount: string }[];
  steps: string[];
  /** 推荐进餐顺序：每项一条，按顺序排列 */
  mealOrder: string[];
  /** 8 条硬规则的合规检查 */
  rulesCheck: RuleCheck[];
  tips?: string[];
  afterMeal?: string;
};
