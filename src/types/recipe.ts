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

/** 用户给的食材里没进主菜的项的安排 */
export type CompanionTiming = "pre" | "snack" | "postMeal" | "rejected";

export type Companion = {
  name: string;
  amount?: string;
  timing: CompanionTiming;
  /** 简短说明为什么放这里 / 为什么 rejected */
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
  /** 适口度自评 1-5，AI 应诚实评估搭配的好吃程度 */
  palatability?: number;
  /**
   * 食材是否够搭出一道完整菜。false 时 AI 必须在 tips 里
   * 明确说"还缺什么"（如蛋白、蔬菜、主食），不应该硬凑。
   */
  ingredientsSufficient: boolean;
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
  /** 用户给的食材里没进主菜的项（水果/坚果/被拒绝的奶茶等） */
  companions?: Companion[];
  /** 8 条硬规则的合规检查 — 服务端验证后的最终结果，可能覆盖 AI 自报 */
  rulesCheck: RuleCheck[];
  tips?: string[];
  afterMeal?: string;
};
