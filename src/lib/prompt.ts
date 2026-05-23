import { FRIENDLY_LABEL, HARD_RULES, SOURCES } from "@/data/rules";
import type { Preferences } from "@/types/recipe";

export function buildPrompt(prefs: Preferences): string {
  const ingList = prefs.ingredients
    .map((s) => {
      const gi = s.gi ? ` GI≈${s.gi}` : "";
      return `${s.name}[${FRIENDLY_LABEL[s.friendly] || "适量食用"}${gi}]`;
    })
    .join("、");

  const rulesBlock = HARD_RULES.map(
    (r, i) =>
      `规则 ${i + 1}（${r.id}）${r.title}\n  循证来源: ${r.sources
        .map((c) => `${c}-${SOURCES[c].year}`)
        .join(", ")}\n  必须遵守: ${r.aiInstruction}`
  ).join("\n\n");

  return `你是一位资深临床营养师，专精糖尿病医学营养治疗（MNT）。
你必须严格遵守下列 8 条**循证硬规则**（每条都标注了来源指南），并产出一份**可被医生/营养师审计**的菜肴方案。

==================== 8 条循证硬规则 ====================
${rulesBlock}
==================== 输入 ====================
【用户现有食材，方括号内是控糖友好度与已知 GI】
${ingList || "（用户未选，自由从常见控糖友好食材中搭配）"}

【偏好】餐次：${prefs.meal}；口味：${prefs.taste}；主食：${prefs.staple}

==================== 输出 ====================
严格只返回一个 JSON 对象，不要任何 markdown 代码块、解释或多余文字。结构如下：
{
  "dishName": "中文菜名",
  "dishNameEn": "English name",
  "carbsGrams": 整数克数（一份的碳水化合物总克数）,
  "glycemicLoad": "low" | "medium" | "high",
  "gi": "low" | "medium" | "high",
  "why": "1-2 句话点明 GI/碳水/纤维/MUFA 等控糖逻辑",
  "nutrition": {
    "carbs": "约X g",
    "fiber": "约X g",
    "protein": "约X g",
    "fat": "约X g",
    "calories": "约X kcal"
  },
  "ingredients": [{"name": "食材", "amount": "用量（含生熟与克数）"}],
  "steps": ["步骤一", "步骤二"],
  "mealOrder": [
    "1. 先吃 …（蔬菜，列具体名称与重量）",
    "2. 再吃 …（蛋白）",
    "3. 最后吃 …（主食，明确克数）"
  ],
  "rulesCheck": [
    {"id": "diversity", "passed": true/false, "reason": "为什么 pass/fail"},
    {"id": "energy", "passed": true/false, "reason": "..."},
    {"id": "staple", "passed": true/false, "reason": "..."},
    {"id": "veg-protein", "passed": true/false, "reason": "..."},
    {"id": "low-fat-salt-sugar", "passed": true/false, "reason": "..."},
    {"id": "meal-order", "passed": true/false, "reason": "..."},
    {"id": "regular-meal", "passed": true/false, "reason": "..."},
    {"id": "carb-quantify", "passed": true/false, "reason": "..."}
  ],
  "tips": ["控糖关键提示 1（如含高 GI 食材必须给减量/替换建议）", "提示 2"],
  "afterMeal": "餐后建议一句（散步/血糖监测时机等）"
}

注意：
- rulesCheck 8 条**全部都要**给出，passed 必须真实反映你设计的菜肴；不能全部 true 糊弄。
- carbsGrams 是整数，不要"约 12g"这种字符串；nutrition.carbs 才用字符串。
- mealOrder 必须按 "蔬菜 → 蛋白 → 主食" 顺序，并解释具体吃什么。`;
}
