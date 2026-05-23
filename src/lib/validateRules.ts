import type { Preferences, Recipe, RuleCheck, RuleId } from "@/types/recipe";

/**
 * 服务端规则校验 —— 覆盖 AI 自报 rulesCheck，杜绝"全部 8/8"sycophancy。
 *
 * 设计原则：
 * - 能确定性判断的（如关键词黑名单、数值类型），server 说了算
 * - 难确定性判断的（如热量结构、餐次时机），fall back 到 AI 自评，但 reason 加 "(AI 自评)" 后缀
 * - 任何冲突：server fail > AI pass
 */

const SUGAR_BLACKLIST = [
  "白糖", "冰糖", "蔗糖", "果糖糖浆", "玉米糖浆", "蜂蜜", "炼乳", "糖浆", "甜面酱",
  "奶茶", "可乐", "雪碧", "汽水", "果汁", "甜饮料",
  "炸", "油炸", "酥脆", "薯条", "薯片", "蛋糕", "饼干", "曲奇", "蜜饯", "果脯",
  "巧克力", "糖果", "棒棒糖",
  "烤冷面", "麻辣烫汤底",
];

const HEAVY_FAT_BLACKLIST = ["猪油", "黄油", "棕榈油", "椰子油", "黄油"];

const VEGETABLE_KEYWORDS = [
  "西兰花", "菠菜", "黄瓜", "番茄", "茄子", "青椒", "蘑菇", "白菜", "芹菜", "豆角",
  "洋葱", "胡萝卜", "南瓜", "生菜", "苦瓜", "莴苣", "茼蒿", "韭菜", "豆芽", "海带",
  "紫菜", "莲藕", "竹笋", "芦笋", "山药",
];

const PROTEIN_KEYWORDS = [
  "鸡蛋", "鸡胸", "鸡腿", "鸭", "鹅", "牛肉", "猪肉", "羊肉", "鱼", "三文鱼", "鲭鱼",
  "鲈鱼", "鳕鱼", "沙丁鱼", "秋刀鱼", "虾", "蟹", "贝", "豆腐", "豆干", "黄豆",
  "黑豆", "红腰豆", "鹰嘴豆", "扁豆", "毛豆", "杏仁", "核桃",
];

const WHOLE_GRAIN_KEYWORDS = [
  "燕麦", "藜麦", "荞麦", "糙米", "大麦", "青稞", "黑米", "小米", "全麦",
];

const REFINED_CARB_KEYWORDS = ["白米", "白面", "白面条", "馒头", "白吐司"];

function joinIngredientText(recipe: Recipe): string {
  const parts: string[] = [];
  for (const it of recipe.ingredients) parts.push(it.name, it.amount);
  for (const st of recipe.steps) parts.push(st);
  if (recipe.dishName) parts.push(recipe.dishName);
  return parts.join(" ");
}

function joinUserIngredientText(prefs: Preferences): string {
  return prefs.ingredients.map((i) => i.name).join(" ");
}

function containsAny(text: string, keywords: string[]): string | null {
  for (const k of keywords) if (text.includes(k)) return k;
  return null;
}

type Verdict = { passed: boolean; reason: string; deterministic: boolean };

function verifyRule(
  id: RuleId,
  recipe: Recipe,
  prefs: Preferences,
  aiSelf: RuleCheck | undefined
): Verdict {
  const text = joinIngredientText(recipe);
  const userText = joinUserIngredientText(prefs);
  const fullText = `${text} ${userText}`;

  switch (id) {
    case "carb-quantify": {
      const ok =
        typeof recipe.carbsGrams === "number" &&
        Number.isInteger(recipe.carbsGrams) &&
        recipe.carbsGrams > 0 &&
        recipe.glycemicLoad !== undefined;
      return {
        passed: ok,
        reason: ok
          ? `碳水 ${recipe.carbsGrams} g 整数标注，GL ${recipe.glycemicLoad}`
          : "未返回有效的 carbsGrams（整数 > 0）或 glycemicLoad",
        deterministic: true,
      };
    }

    case "meal-order": {
      const ok = Array.isArray(recipe.mealOrder) && recipe.mealOrder.length >= 3;
      return {
        passed: ok,
        reason: ok
          ? `mealOrder 共 ${recipe.mealOrder.length} 步`
          : "mealOrder 缺失或少于 3 步（蔬菜→蛋白→主食）",
        deterministic: true,
      };
    }

    case "low-fat-salt-sugar": {
      const sugarHit = containsAny(fullText, SUGAR_BLACKLIST);
      const fatHit = containsAny(text, HEAVY_FAT_BLACKLIST);
      if (sugarHit) {
        return {
          passed: false,
          reason: `检测到禁用项「${sugarHit}」（游离糖/加工食品/炸物）`,
          deterministic: true,
        };
      }
      if (fatHit) {
        return {
          passed: false,
          reason: `检测到高饱和脂肪「${fatHit}」，应替换为橄榄油/菜籽油`,
          deterministic: true,
        };
      }
      // 无确定性证据时倾向信任 AI
      return aiSelf?.passed
        ? {
            passed: true,
            reason: `${aiSelf.reason}（AI 自评 + 服务端未检出禁用关键词）`,
            deterministic: false,
          }
        : {
            passed: false,
            reason: aiSelf?.reason ?? "AI 未明确说明该项",
            deterministic: false,
          };
    }

    case "staple": {
      const wholeGrain = containsAny(text, WHOLE_GRAIN_KEYWORDS);
      const refined = containsAny(text, REFINED_CARB_KEYWORDS);
      if (refined && !wholeGrain) {
        return {
          passed: false,
          reason: `主食为精制碳水「${refined}」，未配合全谷物或减量替换`,
          deterministic: true,
        };
      }
      // 用户明确"不要主食"时，无主食即合规
      if (prefs.staple?.includes("不要") && !wholeGrain && !refined) {
        return {
          passed: true,
          reason: "用户选择不要主食，本菜未含精制碳水",
          deterministic: true,
        };
      }
      if (wholeGrain) {
        return {
          passed: true,
          reason: `主食含全谷物「${wholeGrain}」`,
          deterministic: true,
        };
      }
      return aiSelf?.passed
        ? {
            passed: true,
            reason: `${aiSelf.reason}（AI 自评）`,
            deterministic: false,
          }
        : {
            passed: false,
            reason: aiSelf?.reason ?? "主食缺乏全谷物或低 GI 选项",
            deterministic: false,
          };
    }

    case "veg-protein": {
      const hasVeg = containsAny(text, VEGETABLE_KEYWORDS);
      const hasProtein = containsAny(text, PROTEIN_KEYWORDS);
      if (!hasVeg && !hasProtein) {
        return {
          passed: false,
          reason: "菜肴既无非淀粉蔬菜也无优质蛋白来源",
          deterministic: true,
        };
      }
      if (!hasVeg) {
        return {
          passed: false,
          reason: "缺少非淀粉蔬菜（西兰花/菠菜/番茄等任一）",
          deterministic: true,
        };
      }
      if (!hasProtein) {
        return {
          passed: false,
          reason: "缺少优质蛋白（蛋/禽/鱼/豆类等任一）",
          deterministic: true,
        };
      }
      return {
        passed: true,
        reason: `含蔬菜「${hasVeg}」+ 蛋白「${hasProtein}」`,
        deterministic: true,
      };
    }

    case "diversity": {
      let categories = 0;
      if (containsAny(text, VEGETABLE_KEYWORDS)) categories++;
      if (containsAny(text, PROTEIN_KEYWORDS)) categories++;
      if (containsAny(text, WHOLE_GRAIN_KEYWORDS)) categories++;
      if (containsAny(text, REFINED_CARB_KEYWORDS)) categories++;
      const ok = categories >= 2;
      return {
        passed: ok,
        reason: ok
          ? `识别到 ${categories} 类食物（蔬/蛋白/谷类）`
          : `仅识别到 ${categories} 类食物，未达 ≥2 类`,
        deterministic: true,
      };
    }

    case "energy": {
      const hasCalories = !!recipe.nutrition?.calories;
      const hasProtein = !!recipe.nutrition?.protein;
      const hasFat = !!recipe.nutrition?.fat;
      if (!hasCalories || !hasProtein || !hasFat) {
        return {
          passed: false,
          reason: "营养表缺失关键字段（calories/protein/fat）",
          deterministic: true,
        };
      }
      return aiSelf?.passed
        ? {
            passed: true,
            reason: `${aiSelf.reason}（AI 自评 + 营养表齐全）`,
            deterministic: false,
          }
        : {
            passed: false,
            reason: aiSelf?.reason ?? "AI 未明确说明热量结构合规性",
            deterministic: false,
          };
    }

    case "regular-meal": {
      // 难以确定性判断，信任 AI 自评
      return aiSelf?.passed
        ? {
            passed: true,
            reason: `${aiSelf.reason}（AI 自评）`,
            deterministic: false,
          }
        : {
            passed: false,
            reason: aiSelf?.reason ?? "AI 未给出餐次时间建议",
            deterministic: false,
          };
    }
  }
}

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
 * 验证并覆盖 Recipe.rulesCheck。
 * 同时根据黑名单关键词补全 companions 里的 "rejected" 项（防止 AI 漏掉）。
 */
export function validateAndPatch(recipe: Recipe, prefs: Preferences): Recipe {
  const aiMap = new Map(recipe.rulesCheck?.map((c) => [c.id, c]));
  const newChecks: RuleCheck[] = ALL_RULE_IDS.map((id) => {
    const verdict = verifyRule(id, recipe, prefs, aiMap.get(id));
    return { id, passed: verdict.passed, reason: verdict.reason };
  });

  // 用户输入里包含黑名单关键词但 AI 没标 rejected，强制补一条
  const companionNames = new Set((recipe.companions ?? []).map((c) => c.name));
  const additionalRejected = [];
  for (const ing of prefs.ingredients) {
    for (const bad of SUGAR_BLACKLIST) {
      if (ing.name.includes(bad) && !companionNames.has(ing.name)) {
        additionalRejected.push({
          name: ing.name,
          timing: "rejected" as const,
          reason: `含「${bad}」类游离糖或加工成分，对血糖管理不利，建议本餐不食用`,
        });
        break;
      }
    }
  }

  return {
    ...recipe,
    rulesCheck: newChecks,
    companions: [...(recipe.companions ?? []), ...additionalRejected],
  };
}
