import React, { useState, useRef, useEffect } from "react";

/* ============================================================
   GlucoLens · 控糖灶  —  V1
   三层架构：规则层（食材控糖属性库 + 控糖硬规则）
            AI 层（Claude 在规则约束内生成个性化食谱）
            趣味层（原创 jellycat 风炒菜动画 + 专业 loading 文案）
   ============================================================ */

/* ---------- 规则层：食材控糖属性库 ----------
   friendly: "ok"(控糖友好) | "mod"(适量食用) | "caution"(建议慎用) */
const INGREDIENTS = {
  主食: [
    { name: "燕麦", friendly: "ok", note: "高纤维，平稳血糖" },
    { name: "藜麦", friendly: "ok", note: "高蛋白低 GI，优质主食" },
    { name: "荞麦面", friendly: "ok", note: "低 GI，膳食纤维丰富" },
    { name: "糙米", friendly: "mod", note: "低 GI 主食优选，仍需控量" },
    { name: "全麦面包", friendly: "mod", note: "比白面包友好，看清配料表" },
    { name: "红薯", friendly: "mod", note: "GI 中等，需计入主食量" },
    { name: "玉米", friendly: "mod", note: "整粒为佳，适量食用" },
    { name: "白米饭", friendly: "caution", note: "高 GI，建议减量或换糙米" },
    { name: "白面条", friendly: "caution", note: "精制碳水升糖快，建议替换" },
    { name: "馒头", friendly: "caution", note: "高 GI，建议减量" },
    { name: "土豆", friendly: "caution", note: "淀粉高，宜替部分主食并减量" },
  ],
  蛋白质: [
    { name: "鸡蛋", friendly: "ok", note: "优质蛋白，平稳血糖" },
    { name: "鸡胸肉", friendly: "ok", note: "高蛋白低脂" },
    { name: "鱼肉", friendly: "ok", note: "优质蛋白，含健康脂肪" },
    { name: "虾", friendly: "ok", note: "高蛋白低脂" },
    { name: "豆腐", friendly: "ok", note: "植物蛋白，低 GI" },
    { name: "瘦牛肉", friendly: "ok", note: "优质蛋白，适量" },
    { name: "瘦猪肉", friendly: "ok", note: "去肥部分，适量" },
  ],
  蔬菜: [
    { name: "西兰花", friendly: "ok", note: "高纤维，控糖友好" },
    { name: "菠菜", friendly: "ok", note: "低热量高纤维" },
    { name: "黄瓜", friendly: "ok", note: "水分高，几乎不升糖" },
    { name: "番茄", friendly: "ok", note: "低 GI，富含番茄红素" },
    { name: "茄子", friendly: "ok", note: "高纤维，少油为宜" },
    { name: "青椒", friendly: "ok", note: "维 C 高，低糖" },
    { name: "蘑菇", friendly: "ok", note: "低热量，鲜味替盐" },
    { name: "白菜", friendly: "ok", note: "高纤维，百搭" },
    { name: "芹菜", friendly: "ok", note: "高纤维，助饱腹" },
    { name: "豆角", friendly: "ok", note: "纤维丰富" },
    { name: "洋葱", friendly: "ok", note: "适量，带天然甜味" },
    { name: "胡萝卜", friendly: "mod", note: "熟食 GI 偏高，适量" },
    { name: "南瓜", friendly: "mod", note: "偏甜，适量并计入碳水" },
  ],
  "水果·其他": [
    { name: "蓝莓", friendly: "ok", note: "低 GI 莓果，抗氧化" },
    { name: "草莓", friendly: "ok", note: "低糖莓果，适量" },
    { name: "橄榄油", friendly: "ok", note: "健康油脂，适量" },
    { name: "醋", friendly: "ok", note: "餐前少量有助平稳血糖" },
    { name: "大蒜", friendly: "ok", note: "调味去盐好帮手" },
    { name: "生姜", friendly: "ok", note: "提味，几乎不升糖" },
    { name: "苹果", friendly: "mod", note: "带皮吃，控量" },
    { name: "香蕉", friendly: "mod", note: "偏熟升糖快，少量为宜" },
  ],
};

/* 控糖硬规则：既是产品底线，也原样喂给 AI 当约束 */
const HARD_RULES = [
  "低 GI 优先，严格控制精制碳水与游离糖：不加白糖/蜂蜜，少勾芡。",
  "保证足量非淀粉类蔬菜与高膳食纤维。",
  "优质蛋白适量、健康油脂为主、少油少盐。",
  "若含高 GI 食材（白米饭/白面条/馒头/土豆等），必须在 tips 里给出减量或替换建议。",
  "真实可做、好吃、贴近中国家庭日常。",
];

const FRIENDLY_LABEL = { ok: "控糖友好", mod: "适量食用", caution: "建议慎用" };

const LOADING_LINES = [
  "正在翻炒你的食材…",
  "检查升糖指数 (GI)…",
  "平衡碳水与膳食纤维…",
  "悄悄藏起精制糖…",
  "调一勺控糖小心机…",
  "装盘中…",
];

const MEALS = ["早餐", "午餐", "晚餐"];
const TASTES = ["清淡", "家常", "微辣", "不限"];
const STAPLES = ["要（低 GI）", "不要"];

/* ============================================================
   原创 jellycat 风插画小组件（纯 CSS / SVG，无第三方素材）
   ============================================================ */

/* 主角：圆滚滚会笑的小炒锅 */
function HappyWok() {
  return (
    <div className="wok-wrap" aria-hidden="true">
      {/* 蒸汽软云 */}
      <div className="steam s1" />
      <div className="steam s2" />
      <div className="steam s3" />

      {/* 抛飞的食材小团子 */}
      <div className="toss toss1"><Broc /></div>
      <div className="toss toss2"><Tomato /></div>
      <div className="toss toss3"><Egg /></div>
      <div className="toss toss4"><Garlic /></div>

      {/* 锅本体 */}
      <div className="wok">
        <div className="wok-handle" />
        <div className="wok-body">
          <div className="wok-shine" />
          <div className="wok-face">
            <div className="eye left"><span /></div>
            <div className="eye right"><span /></div>
            <div className="blush bl" />
            <div className="blush br" />
            <div className="smile" />
          </div>
        </div>
      </div>

      {/* 圆乎乎小火苗 */}
      <div className="flames">
        <div className="flame f1" />
        <div className="flame f2" />
        <div className="flame f3" />
      </div>
    </div>
  );
}

/* 拟人化食材小团子 */
function Broc() {
  return (
    <div className="veg broc">
      <div className="broc-top"><i /><i /><i /></div>
      <div className="veg-body">
        <span className="dot l" /><span className="dot r" />
        <span className="mini-blush" />
      </div>
    </div>
  );
}
function Tomato() {
  return (
    <div className="veg tomato">
      <div className="tomato-stem"><i /><i /><i /></div>
      <div className="veg-body">
        <span className="dot l" /><span className="dot r" />
        <span className="mini-blush" />
      </div>
    </div>
  );
}
function Egg() {
  return (
    <div className="veg egg">
      <div className="egg-yolk" />
      <span className="dot l" /><span className="dot r" />
    </div>
  );
}
function Garlic() {
  return (
    <div className="veg garlic">
      <span className="dot l" /><span className="dot r" />
      <span className="mini-blush" />
      <i className="garlic-seam" />
    </div>
  );
}

/* 标题旁的小叶子装饰 */
function Sprout() {
  return (
    <svg className="sprout" viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
      <path d="M20 36 C20 24 20 18 20 12" stroke="#6B8560" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M20 20 C12 18 8 12 9 6 C16 6 21 11 20 20 Z" fill="#7E9B6E" />
      <path d="M20 24 C28 22 33 16 32 10 C25 10 19 15 20 24 Z" fill="#6B8560" />
    </svg>
  );
}

/* ============================================================
   主组件
   ============================================================ */
export default function App() {
  const [selected, setSelected] = useState([]); // [{name,friendly,note}]
  const [customText, setCustomText] = useState("");
  const [meal, setMeal] = useState("午餐");
  const [taste, setTaste] = useState("家常");
  const [staple, setStaple] = useState("要（低 GI）");

  const [loading, setLoading] = useState(false);
  const [loadIdx, setLoadIdx] = useState(0);
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState("");

  const resultRef = useRef(null);

  /* loading 文案轮播 */
  useEffect(() => {
    if (!loading) return;
    setLoadIdx(0);
    const t = setInterval(() => setLoadIdx((i) => (i + 1) % LOADING_LINES.length), 1400);
    return () => clearInterval(t);
  }, [loading]);

  /* 出结果后平滑滚动 */
  useEffect(() => {
    if (recipe && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [recipe]);

  const isSelected = (name) => selected.some((s) => s.name === name);

  const toggle = (item) => {
    setSelected((prev) =>
      prev.some((s) => s.name === item.name)
        ? prev.filter((s) => s.name !== item.name)
        : [...prev, item]
    );
  };

  const removeSel = (name) => setSelected((prev) => prev.filter((s) => s.name !== name));

  const addCustom = () => {
    const v = customText.trim();
    if (!v) return;
    if (!isSelected(v)) {
      setSelected((prev) => [...prev, { name: v, friendly: "mod", note: "自定义食材，按适量处理" }]);
    }
    setCustomText("");
  };

  /* ---------- AI 层：构造 prompt 并调用 Claude ---------- */
  const buildPrompt = () => {
    const ingList = selected
      .map((s) => `${s.name}[${FRIENDLY_LABEL[s.friendly] || "适量食用"}]`)
      .join("、");
    const rules = HARD_RULES.map((r, i) => `${i + 1}. ${r}`).join("\n");

    return `你是一位资深临床营养师，专精糖尿病医学营养治疗（MNT）。请基于用户家中现有食材，设计一道低 GI、个性化、好吃的中式家常菜。

【用户现有食材，方括号内是该食材的控糖友好度，请据此安排用量与做法】
${ingList || "（用户未选，自由从常见控糖友好食材中搭配）"}

【偏好】餐次：${meal}；口味：${taste}；主食：${staple}

【必须遵守的控糖硬规则】
${rules}

请严格只返回一个 JSON 对象，不要任何 markdown 代码块、解释或多余文字，结构如下：
{
  "dishName": "菜名（中文）",
  "dishNameEn": "English name",
  "friendlyScore": 0到100的整数，表示这道菜对控糖的友好程度,
  "why": "为什么适合控糖，1-2句，点明 GI/碳水/纤维的逻辑",
  "nutrition": {"carbs": "约X g", "gi": "低/中/高", "fiber": "约X g", "calories": "约X kcal"},
  "ingredients": [{"name": "食材", "amount": "用量"}],
  "steps": ["步骤一", "步骤二"],
  "tips": ["控糖关键提示（含高GI食材时给减量/替换建议）", "提示二"],
  "afterMeal": "餐后小贴士一句"
}`;
  };

  const parseRecipe = (data) => {
    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
    let clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const a = clean.indexOf("{");
    const b = clean.lastIndexOf("}");
    if (a === -1 || b === -1) throw new Error("no json");
    return JSON.parse(clean.slice(a, b + 1));
  };

  const generate = async () => {
    setError("");
    setRecipe(null);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: buildPrompt() }],
        }),
      });
      const data = await res.json();
      const parsed = parseRecipe(data);
      setRecipe(parsed);
    } catch (e) {
      setError("锅有点糊了，AI 没接住——再点一次试试？");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (s) => (s >= 75 ? "var(--ok)" : s >= 50 ? "var(--mod)" : "var(--caution)");

  return (
    <div className="gl-root">
      <style>{CSS}</style>

      <div className="gl-bg" />
      <main className="gl-shell">

        {/* ---------- 品牌头部 ---------- */}
        <header className="brand">
          <div className="family">FUNDLENS FAMILY · 02</div>
          <div className="logo-row">
            <Sprout />
            <h1 className="logo">GlucoLens</h1>
          </div>
          <div className="logo-cn">控糖灶</div>
          <div className="slogan">有什么 · 做什么 · 吃得稳</div>
          <p className="subhead">告诉我你家冰箱里有什么，我替你的血糖把把关。</p>
        </header>

        {/* ---------- STEP 01 食材选择（规则层） ---------- */}
        <section className="card">
          <div className="step-tag">
            <span className="step-no">STEP 01</span>
            <span className="step-name">食材选择 · RULE ENGINE</span>
          </div>

          {/* 友好度图例 */}
          <div className="legend">
            <span className="lg"><i className="d ok" />控糖友好</span>
            <span className="lg"><i className="d mod" />适量食用</span>
            <span className="lg"><i className="d caution" />建议慎用</span>
          </div>

          {/* 分类 chips */}
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

          {/* 自定义输入 */}
          <div className="custom-row">
            <input
              className="custom-input"
              placeholder="家里还有别的？例如：豆芽、海带…"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addCustom(); }}
            />
            <button className="add-btn" onClick={addCustom} type="button">＋ 加入</button>
          </div>

          {/* 已选区 */}
          {selected.length > 0 && (
            <div className="selected-area">
              <div className="selected-label">已选 {selected.length} 样：</div>
              <div className="sel-chips">
                {selected.map((s) => (
                  <button key={s.name} className={`sel-chip ${s.friendly}`} onClick={() => removeSel(s.name)} type="button">
                    <i className={`d ${s.friendly}`} />{s.name}<span className="x">×</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ---------- STEP 02 偏好 ---------- */}
        <section className="card">
          <div className="step-tag">
            <span className="step-no">STEP 02</span>
            <span className="step-name">偏好</span>
          </div>

          <div className="seg-row">
            <span className="seg-label">餐次</span>
            <div className="seg">
              {MEALS.map((m) => (
                <button key={m} className={`seg-btn ${meal === m ? "on" : ""}`} onClick={() => setMeal(m)} type="button">{m}</button>
              ))}
            </div>
          </div>

          <div className="seg-row">
            <span className="seg-label">口味</span>
            <div className="seg">
              {TASTES.map((t) => (
                <button key={t} className={`seg-btn ${taste === t ? "on" : ""}`} onClick={() => setTaste(t)} type="button">{t}</button>
              ))}
            </div>
          </div>

          <div className="seg-row">
            <span className="seg-label">主食</span>
            <div className="seg">
              {STAPLES.map((s) => (
                <button key={s} className={`seg-btn ${staple === s ? "on" : ""}`} onClick={() => setStaple(s)} type="button">{s}</button>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- 生成按钮 ---------- */}
        {!loading && (
          <button className="fire-btn" onClick={generate} type="button">
            开火，为我配一餐 <span className="fire-emoji">🔥</span>
          </button>
        )}

        {/* ---------- 趣味层：炒菜动画 ---------- */}
        {loading && (
          <section className="cooking">
            <HappyWok />
            <div className="loading-line">{LOADING_LINES[loadIdx]}</div>
          </section>
        )}

        {/* ---------- 错误 ---------- */}
        {error && !loading && (
          <div className="error-box">
            {error}
            <button className="retry" onClick={generate} type="button">↻ 再试一次</button>
          </div>
        )}

        {/* ---------- 食谱结果卡片 ---------- */}
        {recipe && !loading && (
          <section className="card result" ref={resultRef}>
            <div className="result-head">
              <div className="result-meta">YOUR DISH · AI 生成</div>
              <div className="badge" style={{ borderColor: scoreColor(recipe.friendlyScore), color: scoreColor(recipe.friendlyScore) }}>
                <span className="badge-num">{recipe.friendlyScore}</span>
                <span className="badge-cap">控糖友好度</span>
              </div>
            </div>

            <h2 className="dish-name">{recipe.dishName}</h2>
            {recipe.dishNameEn && <div className="dish-en">{recipe.dishNameEn}</div>}

            {recipe.why && <blockquote className="why">{recipe.why}</blockquote>}

            {recipe.nutrition && (
              <div className="nutri-grid">
                <div className="nutri"><div className="nv">{recipe.nutrition.carbs}</div><div className="nl">碳水</div></div>
                <div className="nutri"><div className="nv">{recipe.nutrition.gi}</div><div className="nl">GI</div></div>
                <div className="nutri"><div className="nv">{recipe.nutrition.fiber}</div><div className="nl">膳食纤维</div></div>
                <div className="nutri"><div className="nv">{recipe.nutrition.calories}</div><div className="nl">热量</div></div>
              </div>
            )}

            <div className="two-col">
              <div className="col">
                <div className="col-title">用料</div>
                <ul className="ing-list">
                  {(recipe.ingredients || []).map((it, i) => (
                    <li key={i}><span className="ing-name">{it.name}</span><span className="ing-amt">{it.amount}</span></li>
                  ))}
                </ul>
              </div>
              <div className="col">
                <div className="col-title">做法</div>
                <ol className="step-list">
                  {(recipe.steps || []).map((st, i) => (
                    <li key={i}><span className="step-num">{i + 1}</span><span>{st}</span></li>
                  ))}
                </ol>
              </div>
            </div>

            {recipe.tips && recipe.tips.length > 0 && (
              <div className="tips-box">
                <div className="tips-title">⚖️ 控糖关键提示（规则层守底线）</div>
                <ul>
                  {recipe.tips.map((tp, i) => <li key={i}>{tp}</li>)}
                </ul>
              </div>
            )}

            {recipe.afterMeal && (
              <div className="aftermeal">🚶 餐后：{recipe.afterMeal}</div>
            )}

            <button className="again-btn" onClick={generate} type="button">↻ 再换一道</button>
          </section>
        )}

        {/* ---------- 页脚 ---------- */}
        <footer className="foot">
          <div className="motto">看得清 · 配得稳 · 吃得安心</div>
          <p className="disclaim">
            仅供健康饮食参考，不替代医生、营养师的专业诊疗意见。糖尿病饮食请遵医嘱，并结合个人血糖监测调整。
          </p>
          <div className="foot-sig">GlucoLens · 控糖灶　|　规则引擎 + AI（Claude）解读</div>
        </footer>
      </main>
    </div>
  );
}

/* ============================================================
   样式：金土治愈系。@import 必须在最前。
   ============================================================ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700&display=swap');

.gl-root{
  --bg:#F4EEE2; --bg2:#F7F1E5;
  --surface:#FCF8F0; --surface2:#FFFCF6;
  --ink:#3A342A; --ink-soft:#8A7F6E;
  --sage:#6B8560; --sage-d:#4E6644; --sage-soft:#E7EEDD;
  --line:#E8DFCC;
  --terra:#D2683E; --terra-d:#B5532E; --terra-soft:#F8E5D6;
  --peach:#EBA77C; --blush:#EDA193; --butter:#F2C868; --sky:#9FC2CB;
  --ok:#6FA05C; --mod:#D6A845; --caution:#C56450;

  position:relative;
  min-height:100vh;
  font-family:'Manrope','PingFang SC','Microsoft YaHei',sans-serif;
  color:var(--ink);
  background:var(--bg);
  -webkit-font-smoothing:antialiased;
  overflow-x:hidden;
}
.gl-root *{box-sizing:border-box;}

.gl-bg{
  position:fixed; inset:0; z-index:0; pointer-events:none;
  background:
    radial-gradient(60% 50% at 88% 6%, rgba(126,155,110,.20), transparent 70%),
    radial-gradient(55% 50% at 8% 96%, rgba(235,167,124,.22), transparent 70%),
    radial-gradient(40% 35% at 96% 88%, rgba(159,194,203,.16), transparent 70%),
    var(--bg);
}
/* 细微纸纹噪点 */
.gl-bg::after{
  content:""; position:absolute; inset:0; opacity:.5;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
}

.gl-shell{
  position:relative; z-index:1;
  max-width:560px; margin:0 auto;
  padding:40px 18px 60px;
}

/* ---------- 品牌头部 ---------- */
.brand{ text-align:center; margin-bottom:26px; }
.family{
  font-size:11px; letter-spacing:.32em; color:var(--terra);
  font-weight:700; text-transform:uppercase; margin-bottom:14px;
}
.logo-row{ display:flex; align-items:center; justify-content:center; gap:8px; }
.sprout{ transform:translateY(2px); animation:sway 3.6s ease-in-out infinite; transform-origin:bottom center; }
.logo{
  font-family:'Fraunces',serif; font-weight:600; font-size:52px;
  color:var(--sage-d); margin:0; line-height:1; letter-spacing:-.01em;
}
.logo-cn{
  font-family:'Fraunces',serif; font-weight:500; font-size:22px;
  letter-spacing:.42em; color:var(--sage); margin:6px 0 0 .42em;
}
.slogan{
  font-family:'Fraunces',serif; font-size:19px; color:var(--terra-d);
  margin-top:14px; font-weight:500;
}
.subhead{ color:var(--ink-soft); font-size:14px; margin:8px 0 0; }

/* ---------- 卡片 ---------- */
.card{
  background:var(--surface);
  border:1px solid var(--line);
  border-radius:22px;
  padding:22px 20px;
  margin-bottom:18px;
  box-shadow:0 1px 0 rgba(255,255,255,.7) inset, 0 10px 26px -18px rgba(58,52,42,.35);
}

.step-tag{ display:flex; align-items:baseline; gap:10px; margin-bottom:16px; }
.step-no{
  font-family:'Fraunces',serif; font-weight:600; font-size:13px;
  letter-spacing:.18em; color:#fff; background:var(--sage);
  padding:4px 10px; border-radius:8px;
}
.step-name{ font-size:13px; letter-spacing:.16em; color:var(--ink-soft); font-weight:600; }

/* 图例 */
.legend{
  display:flex; gap:16px; flex-wrap:wrap;
  background:var(--surface2); border:1px dashed var(--line);
  border-radius:14px; padding:11px 14px; margin-bottom:18px;
}
.lg{ display:inline-flex; align-items:center; gap:7px; font-size:12.5px; color:var(--ink-soft); }
.d{ width:9px; height:9px; border-radius:50%; display:inline-block; flex:0 0 auto; }
.d.ok{ background:var(--ok); } .d.mod{ background:var(--mod); } .d.caution{ background:var(--caution); }

.cat-block{ margin-bottom:14px; }
.cat-title{
  font-size:12.5px; color:var(--sage-d); font-weight:700;
  letter-spacing:.08em; margin-bottom:9px;
}
.chips{ display:flex; flex-wrap:wrap; gap:8px; }
.chip{
  position:relative;
  display:inline-flex; align-items:center; gap:6px;
  font-family:inherit; font-size:13.5px; color:var(--ink);
  background:var(--surface2); border:1.5px solid var(--line);
  border-radius:13px; padding:8px 12px; cursor:pointer;
  transition:transform .16s ease, box-shadow .16s ease, background .16s, border-color .16s, color .16s;
}
.chip:hover{ transform:translateY(-2px); box-shadow:0 8px 16px -10px rgba(58,52,42,.4); border-color:var(--sage); }
.chip.on{
  background:var(--sage); color:#fff; border-color:var(--sage-d);
  transform:translateY(-2px); box-shadow:0 10px 18px -10px rgba(78,102,68,.7);
}
.chip.on .d{ box-shadow:0 0 0 2px rgba(255,255,255,.55); }
.chip .tip{
  position:absolute; bottom:calc(100% + 8px); left:50%; transform:translateX(-50%) translateY(4px);
  background:var(--ink); color:#fff; font-size:11.5px; white-space:nowrap;
  padding:6px 10px; border-radius:9px; opacity:0; pointer-events:none;
  transition:opacity .18s, transform .18s; z-index:5; box-shadow:0 8px 18px -8px rgba(0,0,0,.4);
}
.chip .tip::after{ content:""; position:absolute; top:100%; left:50%; transform:translateX(-50%);
  border:5px solid transparent; border-top-color:var(--ink); }
.chip:hover .tip{ opacity:1; transform:translateX(-50%) translateY(0); }

/* 自定义输入 */
.custom-row{ display:flex; gap:9px; margin-top:16px; }
.custom-input{
  flex:1; font-family:inherit; font-size:14px; color:var(--ink);
  background:var(--surface2); border:1.5px solid var(--line);
  border-radius:13px; padding:11px 14px; outline:none;
  transition:border-color .16s, box-shadow .16s;
}
.custom-input::placeholder{ color:#b8ad99; }
.custom-input:focus{ border-color:var(--sage); box-shadow:0 0 0 3px var(--sage-soft); }
.add-btn{
  font-family:inherit; font-weight:600; font-size:14px; color:var(--sage-d);
  background:var(--sage-soft); border:1.5px solid var(--sage); border-radius:13px;
  padding:0 16px; cursor:pointer; white-space:nowrap; transition:background .16s, transform .16s;
}
.add-btn:hover{ background:#dde7d0; transform:translateY(-1px); }

/* 已选区 */
.selected-area{
  margin-top:18px; padding-top:16px; border-top:1px dashed var(--line);
}
.selected-label{ font-size:12.5px; color:var(--ink-soft); font-weight:600; margin-bottom:9px; }
.sel-chips{ display:flex; flex-wrap:wrap; gap:8px; }
.sel-chip{
  display:inline-flex; align-items:center; gap:6px; font-family:inherit; font-size:13px;
  color:var(--ink); background:var(--surface2); border:1.5px solid var(--line);
  border-radius:13px; padding:7px 11px; cursor:pointer; transition:background .15s, border-color .15s;
}
.sel-chip:hover{ border-color:var(--caution); background:#fbf0eb; }
.sel-chip .x{ color:var(--caution); font-weight:700; font-size:15px; margin-left:2px; line-height:1; }

/* segmented control */
.seg-row{ display:flex; align-items:center; gap:14px; margin-bottom:13px; }
.seg-row:last-child{ margin-bottom:0; }
.seg-label{ width:36px; flex:0 0 auto; font-size:13.5px; color:var(--ink-soft); font-weight:600; }
.seg{
  display:flex; gap:6px; background:var(--surface2); border:1px solid var(--line);
  border-radius:13px; padding:5px; flex:1; flex-wrap:wrap;
}
.seg-btn{
  flex:1; min-width:54px; font-family:inherit; font-size:13.5px; font-weight:600; color:var(--ink-soft);
  background:transparent; border:none; border-radius:9px; padding:9px 6px; cursor:pointer;
  transition:background .16s, color .16s, box-shadow .16s; white-space:nowrap;
}
.seg-btn:hover{ color:var(--terra-d); }
.seg-btn.on{ background:var(--terra); color:#fff; box-shadow:0 6px 12px -7px rgba(210,104,62,.8); }

/* ---------- 生成按钮 ---------- */
.fire-btn{
  width:100%; font-family:'Fraunces',serif; font-weight:600; font-size:19px; color:#fff;
  background:linear-gradient(135deg,var(--terra),var(--terra-d));
  border:none; border-radius:18px; padding:18px; cursor:pointer; margin-bottom:18px;
  box-shadow:0 14px 26px -12px rgba(181,83,46,.85); transition:transform .15s, box-shadow .15s;
}
.fire-btn:hover{ transform:translateY(-2px); box-shadow:0 18px 30px -12px rgba(181,83,46,.9); }
.fire-btn:active{ transform:translateY(0); }
.fire-emoji{ display:inline-block; animation:flick 1s ease-in-out infinite; }

/* ---------- 趣味层：炒菜动画 ---------- */
.cooking{
  background:var(--surface); border:1px solid var(--line); border-radius:22px;
  padding:30px 20px 26px; margin-bottom:18px; text-align:center;
  box-shadow:0 10px 26px -18px rgba(58,52,42,.35);
}
.wok-wrap{ position:relative; width:230px; height:200px; margin:0 auto 6px; }

/* 蒸汽软云 */
.steam{
  position:absolute; top:8px; width:26px; height:26px; border-radius:50%;
  background:radial-gradient(circle at 40% 35%, #fff, rgba(255,255,255,.25));
  filter:blur(1px); opacity:0;
}
.steam.s1{ left:78px; animation:steam 2.6s ease-in-out infinite; }
.steam.s2{ left:108px; animation:steam 2.6s ease-in-out .6s infinite; }
.steam.s3{ left:138px; animation:steam 2.6s ease-in-out 1.2s infinite; }

/* 炒锅 */
.wok{ position:absolute; left:50%; bottom:34px; transform:translateX(-50%);
  transform-origin:50% 80%; animation:shake 1.5s ease-in-out infinite; }
.wok-body{
  position:relative; width:158px; height:96px;
  background:radial-gradient(120% 150% at 50% 12%, #6b6357 0%, #4a443b 55%, #322e28 100%);
  border-radius:16px 16px 84px 84px / 14px 14px 96px 96px;
  box-shadow:inset 0 -10px 18px rgba(0,0,0,.4), inset 0 6px 10px rgba(255,255,255,.12),
             0 14px 22px -12px rgba(50,46,40,.7);
}
.wok-shine{
  position:absolute; top:9px; left:22px; width:64px; height:20px; border-radius:50%;
  background:linear-gradient(180deg, rgba(255,255,255,.4), rgba(255,255,255,0));
  filter:blur(.5px);
}
.wok-handle{
  position:absolute; right:-44px; top:24px; width:56px; height:15px; border-radius:8px;
  background:linear-gradient(180deg,#7a4a32,#5c3622);
  box-shadow:inset 0 2px 3px rgba(255,255,255,.25), 0 6px 10px -6px rgba(0,0,0,.5);
}
/* 锅的笑脸 */
.wok-face{ position:absolute; left:0; right:0; top:40px; }
.eye{ position:absolute; top:0; width:13px; height:15px; background:#1c1a16; border-radius:50%; }
.eye.left{ left:48px; } .eye.right{ left:96px; }
.eye span{ position:absolute; top:3px; left:3px; width:5px; height:5px; background:#fff; border-radius:50%; }
.blush{ position:absolute; top:11px; width:15px; height:9px; border-radius:50%;
  background:radial-gradient(circle, rgba(237,161,147,.85), rgba(237,161,147,0)); }
.blush.bl{ left:36px; } .blush.br{ left:106px; }
.smile{ position:absolute; top:14px; left:69px; width:22px; height:11px;
  border:0 solid transparent; border-bottom:3px solid #1c1a16; border-radius:0 0 22px 22px; }

/* 圆乎乎小火苗 */
.flames{ position:absolute; left:50%; bottom:18px; transform:translateX(-50%);
  display:flex; gap:7px; }
.flame{ width:18px; height:24px; border-radius:50% 50% 50% 50% / 64% 64% 36% 36%;
  background:linear-gradient(180deg,#F2C868,#D2683E 70%); transform-origin:bottom center; }
.flame.f1{ animation:flame 0.7s ease-in-out infinite; }
.flame.f2{ height:30px; animation:flame 0.7s ease-in-out .18s infinite; }
.flame.f3{ animation:flame 0.7s ease-in-out .36s infinite; }

/* 抛飞食材团子 */
.toss{ position:absolute; left:50%; top:60px; width:34px; height:34px; margin-left:-17px; }
.toss1{ animation:toss 2.2s ease-in-out infinite; }
.toss2{ animation:toss 2.2s ease-in-out .5s infinite; }
.toss3{ animation:toss 2.2s ease-in-out 1.0s infinite; }
.toss4{ animation:toss 2.2s ease-in-out 1.5s infinite; }

.veg{ position:relative; width:34px; height:34px; }
.veg-body{ position:absolute; inset:0; border-radius:50%; }
.veg .dot{ position:absolute; top:13px; width:4px; height:4px; background:#2a2620; border-radius:50%; z-index:3; }
.veg .dot.l{ left:11px; } .veg .dot.r{ left:19px; }
.veg .mini-blush{ position:absolute; top:18px; left:5px; width:7px; height:4px; border-radius:50%;
  background:rgba(237,161,147,.75); z-index:3; box-shadow:16px 0 0 rgba(237,161,147,.75); }

/* 西兰花 */
.broc .veg-body{ background:radial-gradient(circle at 38% 32%,#8fb27a,#5f7d4f); top:8px; height:26px; }
.broc .dot{ top:19px; } .broc .mini-blush{ top:24px; }
.broc-top{ position:absolute; top:0; left:50%; transform:translateX(-50%); display:flex; gap:1px; }
.broc-top i{ width:11px; height:11px; border-radius:50%; background:#5f7d4f; }
.broc-top i:nth-child(2){ width:13px; height:13px; margin-top:-2px; }
/* 番茄 */
.tomato .veg-body{ background:radial-gradient(circle at 36% 30%,#e8745a,#c8472f); top:5px; }
.tomato .dot{ top:17px; } .tomato .mini-blush{ top:22px; }
.tomato-stem{ position:absolute; top:0; left:50%; transform:translateX(-50%); display:flex; gap:2px; z-index:4; }
.tomato-stem i{ width:5px; height:8px; background:#5f7d4f; border-radius:60% 60% 40% 40%; }
.tomato-stem i:nth-child(2){ height:10px; }
/* 鸡蛋 */
.veg.egg{ background:radial-gradient(circle at 40% 32%,#fff,#f1ead8); border-radius:48% 48% 50% 50%/56% 56% 44% 44%;
  box-shadow:inset 0 -4px 6px rgba(0,0,0,.05); }
.egg .egg-yolk{ position:absolute; top:11px; left:50%; transform:translateX(-50%);
  width:14px; height:14px; border-radius:50%; background:radial-gradient(circle at 38% 35%,#FBD46D,#E8A640); }
.egg .dot{ top:9px; } .egg .dot.l{ left:9px; } .egg .dot.r{ left:21px; }
/* 蒜 */
.veg.garlic{ background:radial-gradient(circle at 40% 30%,#fff,#efe9df);
  border-radius:50% 50% 46% 46%/60% 60% 40% 40%; box-shadow:inset 0 -4px 6px rgba(0,0,0,.05); }
.garlic .garlic-seam{ position:absolute; top:5px; left:50%; transform:translateX(-50%);
  width:2px; height:18px; background:rgba(0,0,0,.07); border-radius:2px;
  box-shadow:-6px 1px 0 rgba(0,0,0,.05),6px 1px 0 rgba(0,0,0,.05); }

.loading-line{
  font-family:'Fraunces',serif; font-size:16px; color:var(--sage-d); font-weight:500;
  margin-top:4px; animation:fade 1.4s ease-in-out infinite;
}

/* ---------- 错误 ---------- */
.error-box{
  background:var(--terra-soft); border:1px solid var(--peach); border-radius:18px;
  padding:18px 20px; margin-bottom:18px; text-align:center; color:var(--terra-d); font-weight:500;
}
.retry{ display:block; margin:12px auto 0; font-family:inherit; font-weight:600; color:#fff;
  background:var(--terra); border:none; border-radius:11px; padding:9px 18px; cursor:pointer; }

/* ---------- 结果卡片 ---------- */
.result{ animation:floatIn .55s cubic-bezier(.2,.8,.2,1) both; }
.result-head{ display:flex; align-items:flex-start; justify-content:space-between; gap:14px; }
.result-meta{ font-size:11px; letter-spacing:.22em; color:var(--terra); font-weight:700; }
.badge{ flex:0 0 auto; width:74px; height:74px; border-radius:50%;
  border:3px solid var(--ok); display:flex; flex-direction:column; align-items:center; justify-content:center;
  background:var(--surface2); }
.badge-num{ font-family:'Fraunces',serif; font-weight:700; font-size:28px; line-height:1; }
.badge-cap{ font-size:9px; color:var(--ink-soft); margin-top:3px; letter-spacing:.04em; }
.dish-name{ font-family:'Fraunces',serif; font-weight:600; font-size:30px; color:var(--sage-d);
  margin:6px 0 2px; line-height:1.15; }
.dish-en{ font-style:italic; color:var(--ink-soft); font-size:14px; margin-bottom:14px;
  font-family:'Fraunces',serif; }
.why{ margin:0 0 18px; padding:10px 0 10px 14px; border-left:3px solid var(--sage);
  color:var(--ink); font-size:14.5px; line-height:1.6; background:var(--sage-soft);
  border-radius:0 10px 10px 0; }

.nutri-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:9px; margin-bottom:18px; }
.nutri{ background:var(--surface2); border:1px solid var(--line); border-radius:14px;
  padding:13px 6px; text-align:center; }
.nv{ font-family:'Fraunces',serif; font-weight:600; font-size:16px; color:var(--terra-d); }
.nl{ font-size:11px; color:var(--ink-soft); margin-top:3px; }

.two-col{ display:grid; grid-template-columns:1fr 1.25fr; gap:18px; margin-bottom:18px; }
.col-title{ font-family:'Fraunces',serif; font-weight:600; font-size:15px; color:var(--sage-d);
  margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid var(--line); }
.ing-list{ list-style:none; margin:0; padding:0; }
.ing-list li{ display:flex; justify-content:space-between; gap:8px; align-items:baseline;
  font-size:13.5px; padding:5px 0; border-bottom:1px dashed var(--line); }
.ing-name{ color:var(--ink); } .ing-amt{ color:var(--ink-soft); white-space:nowrap; }
.step-list{ list-style:none; margin:0; padding:0; counter-reset:s; }
.step-list li{ display:flex; gap:10px; font-size:13.5px; line-height:1.55; margin-bottom:11px; }
.step-num{ flex:0 0 auto; width:22px; height:22px; border-radius:50%; background:var(--sage);
  color:#fff; font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center; }

.tips-box{ background:#FBF1DC; border:1px solid var(--butter); border-radius:16px;
  padding:14px 16px; margin-bottom:14px; }
.tips-title{ font-weight:700; font-size:13.5px; color:#9A7A22; margin-bottom:8px; }
.tips-box ul{ margin:0; padding-left:18px; }
.tips-box li{ font-size:13.5px; color:var(--ink); line-height:1.55; margin-bottom:5px; }

.aftermeal{ background:var(--sage-soft); border-radius:13px; padding:11px 15px;
  font-size:13.5px; color:var(--sage-d); font-weight:500; margin-bottom:16px; }

.again-btn{ width:100%; font-family:inherit; font-weight:600; font-size:15px; color:var(--sage-d);
  background:transparent; border:1.5px solid var(--sage); border-radius:14px; padding:13px; cursor:pointer;
  transition:background .16s, transform .15s; }
.again-btn:hover{ background:var(--sage-soft); transform:translateY(-1px); }

/* ---------- 页脚 ---------- */
.foot{ text-align:center; margin-top:28px; }
.motto{ font-family:'Fraunces',serif; font-size:16px; color:var(--sage-d); font-weight:500;
  letter-spacing:.06em; margin-bottom:12px; }
.disclaim{ font-size:11.5px; color:var(--ink-soft); line-height:1.6; max-width:440px; margin:0 auto 12px; }
.foot-sig{ font-size:11px; color:#b3a892; letter-spacing:.04em; }

/* ---------- keyframes ---------- */
@keyframes shake{ 0%,100%{ transform:translateX(-50%) rotate(-4deg);} 50%{ transform:translateX(-50%) rotate(4deg);} }
@keyframes toss{
  0%{ transform:translateY(0) rotate(0); opacity:0; }
  12%{ opacity:1; }
  50%{ transform:translateY(-66px) rotate(190deg); opacity:1; }
  88%{ opacity:1; }
  100%{ transform:translateY(0) rotate(360deg); opacity:0; }
}
@keyframes steam{
  0%{ transform:translateY(0) scale(.6); opacity:0; }
  30%{ opacity:.85; }
  100%{ transform:translateY(-40px) scale(1.2); opacity:0; }
}
@keyframes flame{ 0%,100%{ transform:scaleY(1) scaleX(1); } 50%{ transform:scaleY(1.3) scaleX(.85); } }
@keyframes flick{ 0%,100%{ transform:rotate(-7deg) scale(1);} 50%{ transform:rotate(7deg) scale(1.12);} }
@keyframes sway{ 0%,100%{ transform:translateY(2px) rotate(-7deg);} 50%{ transform:translateY(2px) rotate(7deg);} }
@keyframes fade{ 0%,100%{ opacity:.45;} 50%{ opacity:1;} }
@keyframes floatIn{ from{ opacity:0; transform:translateY(26px);} to{ opacity:1; transform:translateY(0);} }

/* ---------- 响应式：≤420 ---------- */
@media(max-width:420px){
  .gl-shell{ padding:30px 14px 50px; }
  .logo{ font-size:42px; }
  .nutri-grid{ grid-template-columns:repeat(2,1fr); }
  .two-col{ grid-template-columns:1fr; gap:14px; }
  .dish-name{ font-size:25px; }
  .seg-label{ width:34px; }
}
`;
