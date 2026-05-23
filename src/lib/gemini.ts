import type { Recipe, RuleCheck, RuleId } from "@/types/recipe";

const GEMINI_STREAM_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent";

const ALL_RULE_IDS: RuleId[] = [
  "diversity",
  "energy",
  "staple",
  "veg-protein",
  "low-fat-salt-sugar",
  "meal-order",
  "regular-meal",
  "carb-quantify",
];

/**
 * 流式调用 Gemini，token 到达时通过 onProgress 上报累计字符数。
 * 完整文本拼装完成后返回，仍由调用方负责 JSON 解析与归一化。
 */
export async function streamGeminiText(
  prompt: string,
  onProgress: (totalChars: number) => void
): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("NO_API_KEY");
  }

  const url = `${GEMINI_STREAM_URL}?alt=sse&key=${key}`;
  // 注意：streamGenerateContent + responseMimeType=application/json 会导致 Gemini
  // 等整段 JSON 验证完成才推流（实测首 token 等 27s+）。这里只走 text 模式，
  // prompt 已显式要求纯 JSON 输出，由客户端容错解析。
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.85,
        // 关闭"thinking"内部推理，避免首 token 前长时间静默
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Gemini ${res.status}: ${await res.text().catch(() => "")}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const dataStr = trimmed.slice(5).trim();
      if (!dataStr || dataStr === "[DONE]") continue;

      try {
        const evt = JSON.parse(dataStr) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        const text =
          evt.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
        if (text) {
          accumulated += text;
          onProgress(accumulated.length);
        }
      } catch {
        // 半截 SSE 事件，忽略
      }
    }
  }

  if (buffer.trim()) {
    // tail flush — 偶尔最后一段没有以 \n 结尾
    try {
      const dataStr = buffer.trim().replace(/^data:\s*/, "");
      if (dataStr && dataStr !== "[DONE]") {
        const evt = JSON.parse(dataStr);
        const text =
          evt?.candidates?.[0]?.content?.parts
            ?.map((p: { text?: string }) => p.text ?? "")
            .join("") ?? "";
        if (text) {
          accumulated += text;
          onProgress(accumulated.length);
        }
      }
    } catch {
      // ignore
    }
  }

  return accumulated;
}

export function parseRecipeJson(text: string): unknown {
  const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const a = clean.indexOf("{");
  const b = clean.lastIndexOf("}");
  if (a === -1 || b === -1) throw new Error("Gemini 返回非 JSON 内容");
  return JSON.parse(clean.slice(a, b + 1));
}

/**
 * 容错归一化：补齐缺失字段，保证 UI 不爆炸。
 */
export function normalizeRecipe(raw: unknown): Recipe {
  const r = raw as Partial<Recipe> & Record<string, unknown>;
  const returnedChecks = Array.isArray(r.rulesCheck) ? (r.rulesCheck as RuleCheck[]) : [];
  const checkMap = new Map(returnedChecks.map((c) => [c.id, c]));
  const rulesCheck: RuleCheck[] = ALL_RULE_IDS.map(
    (id) =>
      checkMap.get(id) ?? {
        id,
        passed: false,
        reason: "AI 未返回该项检查，按未通过处理",
      }
  );

  return {
    dishName: String(r.dishName ?? "未命名菜肴"),
    dishNameEn: typeof r.dishNameEn === "string" ? r.dishNameEn : undefined,
    carbsGrams: typeof r.carbsGrams === "number" ? r.carbsGrams : 0,
    glycemicLoad: (r.glycemicLoad as Recipe["glycemicLoad"]) ?? "medium",
    gi: (r.gi as Recipe["gi"]) ?? undefined,
    why: typeof r.why === "string" ? r.why : undefined,
    nutrition: r.nutrition as Recipe["nutrition"],
    ingredients: Array.isArray(r.ingredients) ? (r.ingredients as Recipe["ingredients"]) : [],
    steps: Array.isArray(r.steps) ? (r.steps as string[]) : [],
    mealOrder: Array.isArray(r.mealOrder) ? (r.mealOrder as string[]) : [],
    rulesCheck,
    tips: Array.isArray(r.tips) ? (r.tips as string[]) : [],
    afterMeal: typeof r.afterMeal === "string" ? r.afterMeal : undefined,
  };
}

export function mockRecipe(): Recipe {
  return {
    dishName: "蒜香西兰花炒鸡胸配糙米饭",
    dishNameEn: "Garlic Broccoli with Chicken Breast & Brown Rice",
    carbsGrams: 48,
    glycemicLoad: "low",
    gi: "low",
    why: "鸡胸高蛋白、西兰花高纤维，配糙米提供慢释碳水。整体 GL 低，餐后血糖波动小。",
    nutrition: {
      carbs: "约 48 g",
      fiber: "约 8 g",
      protein: "约 35 g",
      fat: "约 12 g",
      calories: "约 450 kcal",
    },
    ingredients: [
      { name: "鸡胸肉", amount: "150 g（生重）" },
      { name: "西兰花", amount: "200 g" },
      { name: "糙米饭", amount: "50 g 生米煮熟" },
      { name: "大蒜", amount: "3 瓣" },
      { name: "橄榄油", amount: "1 茶匙（5 g）" },
      { name: "盐", amount: "≤2 g" },
    ],
    steps: [
      "鸡胸切薄片，少许盐和黑胡椒抓匀。",
      "西兰花掰小朵焯水 1 分钟，过凉沥干。",
      "热锅冷油爆香蒜末，下鸡胸快炒至变色。",
      "加入西兰花翻炒 1 分钟，盐调味即可。",
      "糙米另煮，按 1:1.5 米水比电饭煲煮 35 分钟。",
    ],
    mealOrder: [
      "1. 先吃西兰花（200 g），把胃先填一半，纤维占位降低后续升糖。",
      "2. 再吃鸡胸（150 g），蛋白质延缓胃排空。",
      "3. 最后吃糙米饭（一小碗约 100 g 熟重），慢释碳水稳血糖。",
    ],
    rulesCheck: [
      { id: "diversity", passed: true, reason: "覆盖蛋白 + 蔬菜 + 全谷物 3 类。" },
      { id: "energy", passed: true, reason: "约 450 kcal，宏量比合理。" },
      { id: "staple", passed: true, reason: "主食为低 GI 糙米，明确克数。" },
      { id: "veg-protein", passed: true, reason: "非淀粉蔬菜 200 g ≥ 150 g 单餐基准。" },
      { id: "low-fat-salt-sugar", passed: true, reason: "无糖、橄榄油（MUFA）、盐 ≤2 g。" },
      { id: "meal-order", passed: true, reason: "明确指引蔬菜 → 蛋白 → 主食。" },
      { id: "regular-meal", passed: true, reason: "适合午餐 11:30-13:00。" },
      { id: "carb-quantify", passed: true, reason: "碳水 48 g 整数标注，GL low。" },
    ],
    tips: ["不勾芡、不加糖，保留食材原味即可低 GI。", "如改用白米饭，建议减半并搭配双倍蔬菜。"],
    afterMeal: "饭后散步 15 分钟，餐后血糖更平稳。",
  };
}
