"use client";

import { useEffect, useRef, useState } from "react";
import { INGREDIENTS } from "@/data/ingredients";
import { MEALS, STAPLES, TASTES } from "@/data/rules";
import { Sprout } from "@/components/Sprout";
import { LoadingScene } from "@/components/LoadingScene";
import { RecipeCard } from "@/components/RecipeCard";
import { SafetyWarning } from "@/components/SafetyWarning";
import { ModeToggle } from "@/components/ModeToggle";
import { DemoBanner } from "@/components/DemoBanner";
import type { Ingredient, Meal, Recipe } from "@/types/recipe";

export default function Page() {
  const [selected, setSelected] = useState<Ingredient[]>([]);
  const [customText, setCustomText] = useState("");
  const [meal, setMeal] = useState<Meal>("午餐");
  const [taste, setTaste] = useState<string>("家常");
  const [staple, setStaple] = useState<string>("要（低 GI）");

  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<{ title: string; hint: string } | null>(null);
  const [streamedChars, setStreamedChars] = useState(0);

  const resultRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (recipe && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [recipe]);

  const isSelected = (name: string) => selected.some((s) => s.name === name);

  const toggle = (item: Ingredient) => {
    setSelected((prev) =>
      prev.some((s) => s.name === item.name)
        ? prev.filter((s) => s.name !== item.name)
        : [...prev, item]
    );
  };

  const removeSel = (name: string) =>
    setSelected((prev) => prev.filter((s) => s.name !== name));

  const addCustom = () => {
    const v = customText.trim();
    if (!v) return;
    if (!isSelected(v)) {
      setSelected((prev) => [
        ...prev,
        { name: v, friendly: "mod", note: "自定义食材，按适量处理" },
      ]);
    }
    setCustomText("");
  };

  const classifyError = (e: unknown): { title: string; hint: string } => {
    const msg = e instanceof Error ? e.message : String(e);
    if (e instanceof DOMException && e.name === "AbortError") {
      return { title: "AI 响应超时", hint: "等了 35 秒还没接到完整食谱，请再点一次。" };
    }
    if (/Failed to fetch|NetworkError|net::/.test(msg)) {
      return { title: "网络连接失败", hint: "检查网络是否通畅，然后再试一次。" };
    }
    if (/HTTP 429/i.test(msg)) {
      return { title: "你点得太频繁了", hint: "为避免免费 AI 额度被刷爆，每分钟最多 3 次、每天 30 次。稍等再点。" };
    }
    if (/RESOURCE_EXHAUSTED|quota/i.test(msg)) {
      return { title: "AI 服务限流了", hint: "Gemini 免费额度可能已用尽，稍等 1 分钟再点。" };
    }
    if (/401|403|API_KEY_INVALID/i.test(msg)) {
      return { title: "Gemini API key 无效", hint: "请检查 .env.local 里的 GEMINI_API_KEY。" };
    }
    if (/非 JSON|Unexpected token|JSON/.test(msg)) {
      return { title: "AI 返回格式错乱", hint: "再点一次通常就好；多次失败请反馈。" };
    }
    if (/stream ended/.test(msg)) {
      return { title: "AI 流被截断", hint: "数据没传完，请再点一次。" };
    }
    return { title: "锅有点糊了", hint: `AI 没接住，请再点一次。技术细节：${msg.slice(0, 80)}` };
  };

  const generate = async () => {
    setError(null);
    setRecipe(null);
    setStreamedChars(0);
    setLoading(true);
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 35000);
    try {
      const res = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: selected, meal, taste, staple }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalRecipe: Recipe | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const evt = JSON.parse(line) as
            | { type: "start" }
            | { type: "chunk"; received: number }
            | { type: "done"; recipe: Recipe }
            | { type: "error"; message: string };
          if (evt.type === "chunk") setStreamedChars(evt.received);
          else if (evt.type === "done") finalRecipe = evt.recipe;
          else if (evt.type === "error") throw new Error(evt.message);
        }
      }

      if (!finalRecipe) throw new Error("stream ended without recipe");
      setRecipe(finalRecipe);
    } catch (e) {
      setError(classifyError(e));
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  return (
    <div className="gl-root">
      <div className="gl-bg" />
      <DemoBanner />
      <main className="gl-shell">
        <ModeToggle />
        <header className="brand">
          <div className="family">基于中 · 美 · 日三国权威糖尿病指南</div>
          <div className="logo-row">
            <Sprout />
            <h1 className="logo">GlucoLens</h1>
          </div>
          <div className="logo-cn">控糖灶</div>
          <div className="slogan">有什么 · 做什么 · 吃得稳</div>
          <p className="subhead">家里有什么食材？按循证指南给你一道控糖友好的菜。</p>
        </header>

        <section className="card">
          <div className="step-tag">
            <span className="step-no">STEP 01</span>
            <span className="step-name">食材选择 · RULE ENGINE</span>
          </div>

          <div className="legend">
            <span className="lg">
              <i className="d ok" />
              控糖友好
            </span>
            <span className="lg">
              <i className="d mod" />
              适量食用
            </span>
            <span className="lg">
              <i className="d caution" />
              建议慎用
            </span>
          </div>

          {Object.entries(INGREDIENTS).map(([cat, list]) => (
            <div className="cat-block" key={cat}>
              <div className="cat-title">{cat}</div>
              <div className="chips">
                {list.map((item) => (
                  <button
                    key={item.name}
                    className={`chip ${item.friendly} ${isSelected(item.name) ? "on" : ""}`}
                    onClick={() => toggle(item)}
                    title={item.note}
                    type="button"
                  >
                    <i className={`d ${item.friendly}`} />
                    {item.name}
                    <span className="tip">{item.note}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="custom-row">
            <input
              className="custom-input"
              placeholder="家里还有别的？例如：豆芽、海带…"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addCustom();
              }}
            />
            <button className="add-btn" onClick={addCustom} type="button">
              ＋ 加入
            </button>
          </div>

          {selected.length > 0 && (
            <div className="selected-area">
              <div className="selected-label">已选 {selected.length} 样：</div>
              <div className="sel-chips">
                {selected.map((s) => (
                  <button
                    key={s.name}
                    className={`sel-chip ${s.friendly}`}
                    onClick={() => removeSel(s.name)}
                    type="button"
                  >
                    <i className={`d ${s.friendly}`} />
                    {s.name}
                    <span className="x">×</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="card">
          <div className="step-tag">
            <span className="step-no">STEP 02</span>
            <span className="step-name">偏好</span>
          </div>

          <div className="seg-row">
            <span className="seg-label">餐次</span>
            <div className="seg">
              {MEALS.map((m) => (
                <button
                  key={m}
                  className={`seg-btn ${meal === m ? "on" : ""}`}
                  onClick={() => setMeal(m)}
                  type="button"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="seg-row">
            <span className="seg-label">口味</span>
            <div className="seg">
              {TASTES.map((t) => (
                <button
                  key={t}
                  className={`seg-btn ${taste === t ? "on" : ""}`}
                  onClick={() => setTaste(t)}
                  type="button"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="seg-row">
            <span className="seg-label">主食</span>
            <div className="seg">
              {STAPLES.map((s) => (
                <button
                  key={s}
                  className={`seg-btn ${staple === s ? "on" : ""}`}
                  onClick={() => setStaple(s)}
                  type="button"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        {!loading && (
          <>
            <SafetyWarning variant="pre-generate" />
            <button className="fire-btn" onClick={generate} type="button">
              开火，为我配一餐 <span className="fire-emoji">🔥</span>
            </button>
          </>
        )}

        {loading && <LoadingScene streamedChars={streamedChars} />}

        {error && !loading && (
          <div className="error-box">
            <div className="error-title">{error.title}</div>
            <div className="error-hint">{error.hint}</div>
            <button className="retry" onClick={generate} type="button">
              ↻ 再试一次
            </button>
          </div>
        )}

        {recipe && !loading && <RecipeCard recipe={recipe} onRegenerate={generate} ref={resultRef} />}

        <footer className="foot">
          <div className="motto">看得清 · 配得稳 · 吃得安心</div>
          <div className="foot-sig">
            GlucoLens · 控糖灶　|　循证规则引擎 · 不替代临床诊疗
          </div>
        </footer>
      </main>
    </div>
  );
}
