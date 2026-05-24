"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  GLUCOSE_CONTEXT_LABEL,
  type GlucoseContext,
  type GlucoseReading,
} from "@/types/glucose";

type RecipeOption = { id: string; dish_name: string };

type Props = {
  initialReadings: GlucoseReading[];
  recipeOptions: RecipeOption[];
};

type Window = 7 | 30 | 90;

function nowLocalInput(): string {
  // datetime-local 需要 'YYYY-MM-DDTHH:mm' 本地时间字符串
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function GlucoseLogger({ initialReadings, recipeOptions }: Props) {
  const [readings, setReadings] = useState<GlucoseReading[]>(initialReadings);
  const [window, setWindow] = useState<Window>(30);

  const [value, setValue] = useState("");
  const [context, setContext] = useState<GlucoseContext>("post_meal_2h");
  const [measuredAt, setMeasuredAt] = useState(nowLocalInput());
  const [recipeId, setRecipeId] = useState<string>("");
  const [note, setNote] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [open, setOpen] = useState(false);

  const recipeMap = useMemo(() => {
    const m = new Map<string, string>();
    recipeOptions.forEach((r) => m.set(r.id, r.dish_name));
    return m;
  }, [recipeOptions]);

  const { chartData, domain, ticks } = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const cutoff = now - window * dayMs;
    const data = readings
      .filter((r) => new Date(r.measured_at).getTime() >= cutoff)
      .map((r) => ({
        t: new Date(r.measured_at).getTime(),
        value: r.value_mmol,
        context: r.context,
        note: r.note,
        recipe: r.recipe_id ? recipeMap.get(r.recipe_id) : null,
      }))
      .sort((a, b) => a.t - b.t);

    // 让 X 轴始终铺满选中窗口，避免 dataMin/dataMax 把数据挤成一团
    const stepDays = window === 7 ? 1 : window === 30 ? 5 : 15;
    const tickArr: number[] = [];
    for (let d = window; d >= 0; d -= stepDays) {
      tickArr.push(now - d * dayMs);
    }

    return {
      chartData: data,
      domain: [cutoff, now] as [number, number],
      ticks: tickArr,
    };
  }, [readings, window, recipeMap]);

  const recent = readings.slice(0, 5);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setInfo("");
    const v = Number(value);
    if (!Number.isFinite(v) || v <= 0 || v > 40) {
      setErr("数值需在 0–40 mmol/L 之间");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/glucose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value_mmol: v,
          context,
          measured_at: new Date(measuredAt).toISOString(),
          recipe_id: recipeId || null,
          note: note || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      setReadings((prev) =>
        [j.reading as GlucoseReading, ...prev].sort(
          (a, b) =>
            new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()
        )
      );
      setInfo("已记录 ✓");
      setValue("");
      setNote("");
      setMeasuredAt(nowLocalInput());
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "保存失败");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("删除这条记录？")) return;
    const res = await fetch(`/api/glucose?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setReadings((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <section className="card glucose-card">
      <header className="glucose-head">
        <div>
          <h2 className="glucose-title">血糖记录</h2>
          <p className="glucose-sub">
            参考区间：餐后 2h 正常 &lt; 7.8，糖尿病控糖目标 &lt; 10.0 mmol/L
          </p>
        </div>
        <div className="glucose-windows">
          {[7, 30, 90].map((w) => (
            <button
              key={w}
              type="button"
              className={`glucose-win-btn ${window === w ? "on" : ""}`}
              onClick={() => setWindow(w as Window)}
            >
              {w} 天
            </button>
          ))}
        </div>
      </header>

      {chartData.length === 0 ? (
        <div className="glucose-empty">
          <p>最近 {window} 天还没有记录。在下方添加第一条吧。</p>
        </div>
      ) : (
        <div className="glucose-chart">
          <div className="glucose-yunit">mmol/L</div>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ top: 8, right: 12, bottom: 8, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d2" />
              <XAxis
                type="number"
                dataKey="t"
                domain={domain}
                ticks={ticks}
                allowDataOverflow={false}
                tickFormatter={(t: number) =>
                  new Date(t).toLocaleDateString("zh-CN", {
                    month: "numeric",
                    day: "numeric",
                  })
                }
                stroke="#7a6c54"
                fontSize={12}
              />
              <YAxis
                type="number"
                dataKey="value"
                domain={[0, 16]}
                ticks={[0, 4, 7.8, 10, 13]}
                stroke="#7a6c54"
                fontSize={12}
              />
              <ReferenceArea y1={3.9} y2={7.8} fill="#a3c98a" fillOpacity={0.18} />
              <ReferenceLine y={10} stroke="#c46b4d" strokeDasharray="4 4" />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as (typeof chartData)[number];
                  return (
                    <div className="glucose-tip">
                      <div className="glucose-tip-val">
                        {d.value.toFixed(1)} <span>mmol/L</span>
                      </div>
                      <div className="glucose-tip-meta">
                        {new Date(d.t).toLocaleString("zh-CN")}
                      </div>
                      <div className="glucose-tip-meta">
                        {GLUCOSE_CONTEXT_LABEL[d.context as GlucoseContext]}
                      </div>
                      {d.recipe && (
                        <div className="glucose-tip-meta">餐：{d.recipe}</div>
                      )}
                      {d.note && (
                        <div className="glucose-tip-note">{d.note}</div>
                      )}
                    </div>
                  );
                }}
              />
              <Scatter
                data={chartData}
                fill="#5d8a4a"
                stroke="#3d6230"
                strokeWidth={1}
                shape="circle"
                r={7}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      <button
        type="button"
        className="glucose-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? "− 收起" : "+ 记录一笔"}
      </button>

      {open && (
        <form onSubmit={onSubmit} className="glucose-form">
          <div className="glucose-row">
            <label className="glucose-field">
              <span>数值 (mmol/L)</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                max="40"
                required
                placeholder="如 6.8"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={busy}
              />
            </label>
            <label className="glucose-field">
              <span>测量场景</span>
              <select
                value={context}
                onChange={(e) => setContext(e.target.value as GlucoseContext)}
                disabled={busy}
              >
                {(Object.keys(GLUCOSE_CONTEXT_LABEL) as GlucoseContext[]).map((k) => (
                  <option key={k} value={k}>
                    {GLUCOSE_CONTEXT_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="glucose-row">
            <label className="glucose-field">
              <span>时间</span>
              <input
                type="datetime-local"
                required
                value={measuredAt}
                onChange={(e) => setMeasuredAt(e.target.value)}
                disabled={busy}
              />
            </label>
            <label className="glucose-field">
              <span>关联餐（可选）</span>
              <select
                value={recipeId}
                onChange={(e) => setRecipeId(e.target.value)}
                disabled={busy}
              >
                <option value="">—</option>
                {recipeOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.dish_name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="glucose-field">
            <span>备注（可选）</span>
            <input
              type="text"
              maxLength={200}
              placeholder="如：饭后散步 20 分钟"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={busy}
            />
          </label>
          <div className="glucose-actions">
            <button type="submit" className="glucose-submit" disabled={busy}>
              {busy ? "保存中…" : "保存"}
            </button>
            {info && <span className="glucose-info">{info}</span>}
            {err && <span className="glucose-err">{err}</span>}
          </div>
        </form>
      )}

      {recent.length > 0 && (
        <ul className="glucose-recent">
          {recent.map((r) => (
            <li key={r.id} className="glucose-recent-item">
              <span className="glucose-recent-val">
                {r.value_mmol.toFixed(1)}
                <small>mmol/L</small>
              </span>
              <span className="glucose-recent-ctx">
                {GLUCOSE_CONTEXT_LABEL[r.context]}
              </span>
              <span className="glucose-recent-time">
                {new Date(r.measured_at).toLocaleString("zh-CN", {
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {r.recipe_id && recipeMap.get(r.recipe_id) && (
                <span className="glucose-recent-recipe">
                  · {recipeMap.get(r.recipe_id)}
                </span>
              )}
              <button
                type="button"
                className="glucose-recent-del"
                onClick={() => onDelete(r.id)}
                aria-label="删除"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
