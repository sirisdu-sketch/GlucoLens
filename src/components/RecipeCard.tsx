"use client";

import { forwardRef } from "react";
import { HARD_RULES, SOURCES } from "@/data/rules";
import type { Companion, CompanionTiming, Recipe, SourceCode } from "@/types/recipe";
import { SafetyWarning } from "./SafetyWarning";

const TIMING_LABEL: Record<CompanionTiming, string> = {
  pre: "餐前",
  snack: "加餐",
  postMeal: "饭后",
  rejected: "不建议",
};

type Props = {
  recipe: Recipe;
  onRegenerate: () => void;
};

function complianceClass(passCount: number, total: number) {
  if (passCount === total) return "compliance";
  if (passCount >= total - 2) return "compliance partial";
  return "compliance poor";
}

function collectSources(recipe: Recipe): SourceCode[] {
  const used = new Set<SourceCode>();
  for (const rule of HARD_RULES) {
    const check = recipe.rulesCheck.find((c) => c.id === rule.id);
    if (check?.passed) {
      rule.sources.forEach((s) => used.add(s));
    }
  }
  if (used.size === 0) HARD_RULES.forEach((r) => r.sources.forEach((s) => used.add(s)));
  return Array.from(used);
}

export const RecipeCard = forwardRef<HTMLElement, Props>(function RecipeCard(
  { recipe, onRegenerate },
  ref
) {
  const passCount = recipe.rulesCheck.filter((c) => c.passed).length;
  const total = recipe.rulesCheck.length || HARD_RULES.length;
  const cls = complianceClass(passCount, total);
  const usedSources = collectSources(recipe);

  return (
    <section className="card result" ref={ref}>
      <div className="result-head">
        <div className="result-meta">YOUR DISH · 循证生成</div>
        <div className={cls} aria-label={`合规 ${passCount} / ${total}`}>
          <span className="compliance-num">{passCount}</span>
          <span className="compliance-cap">/ {total} 条规则符合</span>
        </div>
      </div>

      <h2 className="dish-name">{recipe.dishName}</h2>
      {recipe.dishNameEn && <div className="dish-en">{recipe.dishNameEn}</div>}

      {typeof recipe.palatability === "number" && (
        <div className="palatability" aria-label={`适口度 ${recipe.palatability} / 5`}>
          适口度
          <span className="stars">
            {"★".repeat(recipe.palatability)}
            <span className="dim">{"★".repeat(5 - recipe.palatability)}</span>
          </span>
        </div>
      )}

      {recipe.ingredientsSufficient === false && (
        <div className="insufficient-warn" role="note">
          <strong>食材不足：</strong>这道是当前食材能搭出的最佳版本，但还**不够均衡**——请看 tips 第一条了解还缺什么。
        </div>
      )}

      {recipe.why && <blockquote className="why">{recipe.why}</blockquote>}

      <SafetyWarning variant="post-result" />

      <div className="carb-headline">
        <span className="carb-num">{recipe.carbsGrams}</span>
        <span className="carb-unit">g 碳水（整份）</span>
        <span className={`gl-chip ${recipe.glycemicLoad}`}>GL · {recipe.glycemicLoad}</span>
      </div>

      {recipe.nutrition && (
        <div className="nutri-grid">
          <div className="nutri">
            <div className="nv">{recipe.nutrition.carbs}</div>
            <div className="nl">碳水</div>
          </div>
          <div className="nutri">
            <div className="nv">{recipe.nutrition.fiber}</div>
            <div className="nl">膳食纤维</div>
          </div>
          <div className="nutri">
            <div className="nv">{recipe.nutrition.protein}</div>
            <div className="nl">蛋白质</div>
          </div>
          <div className="nutri">
            <div className="nv">{recipe.nutrition.fat}</div>
            <div className="nl">脂肪</div>
          </div>
          <div className="nutri">
            <div className="nv">{recipe.nutrition.calories}</div>
            <div className="nl">热量</div>
          </div>
        </div>
      )}

      <div className="two-col">
        <div className="col">
          <div className="col-title">用料</div>
          <ul className="ing-list">
            {recipe.ingredients.map((it, i) => (
              <li key={i}>
                <span className="ing-name">{it.name}</span>
                <span className="ing-amt">{it.amount}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="col">
          <div className="col-title">做法</div>
          <ol className="step-list">
            {recipe.steps.map((st, i) => (
              <li key={i}>
                <span className="step-num">{i + 1}</span>
                <span>{st}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {recipe.mealOrder.length > 0 && (
        <div className="meal-order-box">
          <div className="meal-order-title">进餐顺序（降餐后血糖峰值 30-40%）</div>
          <ul className="meal-order-list">
            {recipe.mealOrder.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {recipe.companions && recipe.companions.length > 0 && (
        <CompanionsBox companions={recipe.companions} />
      )}

      <div className="rules-box">
        <div className="rules-title">循证规则合规审计 · {passCount}/{total}</div>
        <ul className="rules-list">
          {HARD_RULES.map((rule) => {
            const check = recipe.rulesCheck.find((c) => c.id === rule.id);
            const passed = check?.passed ?? false;
            return (
              <li key={rule.id} className="rule-item">
                <span className={`rule-mark ${passed ? "pass" : "fail"}`}>
                  {passed ? "✓" : "✗"}
                </span>
                <span className="rule-text">
                  <span className="rule-name">{rule.title}</span>
                  <span className="rule-reason">
                    {check?.reason ?? "本菜肴未通过此条"}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {recipe.tips && recipe.tips.length > 0 && (
        <div className="tips-box">
          <div className="tips-title">⚖️ 控糖关键提示</div>
          <ul>
            {recipe.tips.map((tp, i) => (
              <li key={i}>{tp}</li>
            ))}
          </ul>
        </div>
      )}

      {recipe.afterMeal && <div className="aftermeal">🚶 餐后：{recipe.afterMeal}</div>}

      <button className="again-btn" onClick={onRegenerate} type="button">
        ↻ 再换一道
      </button>

      <div className="sources-foot">
        {usedSources.map((code) => (
          <span className="src-line" key={code}>
            <span className="src-code">{code}</span>
            {SOURCES[code].label} · {SOURCES[code].org} · {SOURCES[code].year}
          </span>
        ))}
      </div>
    </section>
  );
});

function CompanionsBox({ companions }: { companions: Companion[] }) {
  const grouped: Record<CompanionTiming, Companion[]> = {
    pre: [],
    snack: [],
    postMeal: [],
    rejected: [],
  };
  for (const c of companions) grouped[c.timing].push(c);
  const order: CompanionTiming[] = ["pre", "snack", "postMeal", "rejected"];

  return (
    <div className="companions-box">
      <div className="companions-title">你给的其他食材怎么安排</div>
      {order.map((t) =>
        grouped[t].length === 0 ? null : (
          <div key={t} className={`companion-group ${t}`}>
            <div className="companion-group-label">{TIMING_LABEL[t]}</div>
            <ul>
              {grouped[t].map((c, i) => (
                <li key={i}>
                  <span className="companion-name">{c.name}</span>
                  {c.amount && <span className="companion-amount"> · {c.amount}</span>}
                  <span className="companion-reason"> — {c.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      )}
    </div>
  );
}
