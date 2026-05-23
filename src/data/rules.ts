import type { Friendly, RuleId, SourceCode } from "@/types/recipe";

/**
 * 三国权威指南来源
 * 完整文档置于 /source 目录，下面 label 简化引用。
 */
export const SOURCES: Record<SourceCode, { label: string; org: string; year: number }> = {
  CN: {
    label: "中国 2 型糖尿病膳食指南",
    org: "中华人民共和国国家卫生健康委员会 / 中国营养学会",
    year: 2023,
  },
  ADA: {
    label: "ADA Standards of Care · Nutrition Therapy",
    org: "American Diabetes Association",
    year: 2024,
  },
  JDS: {
    label: "糖尿病食事療法ガイドライン",
    org: "Japan Diabetes Society",
    year: 2024,
  },
};

export type HardRule = {
  id: RuleId;
  title: string;
  body: string;
  /** 给 AI 看的精确指令（量化版本） */
  aiInstruction: string;
  sources: SourceCode[];
};

/**
 * 控糖硬规则——8 条全部对应循证来源。
 * 顺序参考中国 2023 指南的 8 项原则，与 ADA / JDS 关键建议交叉验证。
 */
export const HARD_RULES: HardRule[] = [
  {
    id: "diversity",
    title: "食物多样",
    body: "每餐覆盖五大类（谷薯/蔬果/动物食品/豆奶/油脂），全天食材种类 ≥12 种。",
    aiInstruction:
      "菜肴食材必须覆盖至少 2 个食物类别（蛋白 + 蔬菜 或 全谷物 + 蛋白 + 蔬菜），单一食材不允许。",
    sources: ["CN", "ADA"],
  },
  {
    id: "energy",
    title: "能量适宜",
    body: "宏量比 蛋白 15-20% / 碳水 45-60% / 脂肪 20-35%；超重者优先减重 5-10%。",
    aiInstruction:
      "单餐目标热量 350-550 kcal（成人单顿主餐基准）；蛋白质 ≥15g；脂肪占比不超过 35%；不使用棕榈油/猪油/黄油等高饱和脂肪。",
    sources: ["CN", "ADA"],
  },
  {
    id: "staple",
    title: "主食定量·优选全谷物与低 GI",
    body: "每餐碳水 45-60g；主食以全谷物、杂豆、低 GI 食物为主；纤维 ≥14g/1000 kcal。",
    aiInstruction:
      "主食必须明确克数（生重）；优先选用全谷物（糙米/大麦/青稞/荞麦/黑米）或杂豆；如出现白米/白面/馒头，必须在 tips 给出减量或替换建议。",
    sources: ["CN", "ADA", "JDS"],
  },
  {
    id: "veg-protein",
    title: "蔬菜充足·蛋白多元",
    body: "每日非淀粉蔬菜 ≥500g（深色蔬菜过半）；蛋白来源涵盖鱼/禽/蛋/豆/低脂奶/坚果。",
    aiInstruction:
      "菜肴非淀粉蔬菜重量必须 ≥150g（单餐基准）；鼓励搭配豆类、深海鱼或坚果作为蛋白来源之一。",
    sources: ["CN", "ADA"],
  },
  {
    id: "low-fat-salt-sugar",
    title: "限饱和脂肪·限盐·禁游离糖",
    body: "禁加白糖/蜂蜜；钠 <2000mg/日；饱和脂肪 <10% 总热量；用 MUFA（橄榄油/牛油果/坚果）替换。",
    aiInstruction:
      "禁用白糖/冰糖/蜂蜜/枫糖；用橄榄油/菜籽油等富 MUFA 油；盐 ≤4g（单餐）；不勾芡或仅薄勾芡。",
    sources: ["CN", "ADA"],
  },
  {
    id: "meal-order",
    title: "进餐顺序：蔬菜 → 蛋白 → 主食",
    body: "先吃蔬菜，再吃蛋白，最后吃主食，可降低餐后血糖峰值 30-40%。",
    aiInstruction:
      "必须输出 mealOrder 数组，明确每一步先吃什么，并解释为什么这个顺序对血糖有利。",
    sources: ["CN", "JDS"],
  },
  {
    id: "regular-meal",
    title: "规律进餐·合理加餐",
    body: "三餐定时定量，避免长间隔与夜宵；用药者需配合用药时间。",
    aiInstruction:
      "在 tips 提示该餐适合的进餐时段（如午餐 11:30-13:00），并说明该餐与下一餐间隔的合理范围。",
    sources: ["CN", "ADA"],
  },
  {
    id: "carb-quantify",
    title: "碳水定量·公开估算",
    body: "明确碳水克数与 GL 估算，供用药/胰岛素剂量参考；不再使用模糊的「低/中/高」。",
    aiInstruction:
      "必须输出 carbsGrams（整数克）和 glycemicLoad（low/medium/high）；nutrition 字段全部给具体数值。",
    sources: ["ADA", "JDS"],
  },
];

export const FRIENDLY_LABEL: Record<Friendly, string> = {
  ok: "控糖友好",
  mod: "适量食用",
  caution: "建议慎用",
};

export const LOADING_LINES: string[] = [
  "正在翻炒你的食材…",
  "检查升糖指数 (GI) 与升糖负荷 (GL)…",
  "平衡碳水与膳食纤维…",
  "对照三国糖尿病指南…",
  "悄悄藏起精制糖…",
  "调一勺控糖小心机…",
  "装盘中…",
];

export const MEALS = ["早餐", "午餐", "晚餐"] as const;
export const TASTES = ["清淡", "家常", "微辣", "不限"] as const;
export const STAPLES = ["要（低 GI）", "不要"] as const;
