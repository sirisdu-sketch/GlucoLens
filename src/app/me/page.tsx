import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";
import { GlucoseLogger } from "@/components/GlucoseLogger";
import type { Recipe } from "@/types/recipe";
import type { GlucoseReading } from "@/types/glucose";

export const dynamic = "force-dynamic";

type RecipeRow = {
  id: string;
  slug: string;
  dish_name: string;
  created_at: string;
  recipe_data: Recipe;
};

export default async function MePage() {
  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  // middleware 应该已经守过，这里再保护一次
  if (!user) {
    return (
      <div className="gl-root">
        <div className="gl-bg" />
        <main className="gl-shell">
          <p>请先 <Link href="/login">登录</Link>。</p>
        </main>
      </div>
    );
  }

  const [recipesRes, readingsRes] = await Promise.all([
    sb
      .from("saved_recipes")
      .select("id, slug, dish_name, created_at, recipe_data")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    sb
      .from("glucose_readings")
      .select("id, user_id, recipe_id, value_mmol, context, measured_at, note, created_at")
      .eq("user_id", user.id)
      .order("measured_at", { ascending: false })
      .limit(500),
  ]);

  const { data, error } = recipesRes;
  const items: RecipeRow[] = (data ?? []) as RecipeRow[];
  const readings: GlucoseReading[] = (readingsRes.data ?? []) as GlucoseReading[];
  const recipeOptions = items.map((r) => ({ id: r.id, dish_name: r.dish_name }));

  return (
    <div className="gl-root">
      <div className="gl-bg" />
      <main className="gl-shell">
        <header className="me-head">
          <div className="me-head-left">
            <Link href="/" className="me-back">
              ← 返回首页
            </Link>
            <h1 className="me-title">我的菜谱本</h1>
            <p className="me-sub">登录邮箱：{user.email}</p>
          </div>
          <SignOutButton />
        </header>

        <GlucoseLogger
          initialReadings={readings}
          recipeOptions={recipeOptions}
        />

        {error && (
          <div className="error-box">
            <div className="error-title">读取失败</div>
            <div className="error-hint">{error.message}</div>
          </div>
        )}

        {!error && items.length === 0 && (
          <section className="card">
            <p>还没有收藏的菜谱。</p>
            <p>
              <Link href="/" className="me-back">
                ← 去生成一道
              </Link>
            </p>
          </section>
        )}

        {items.length > 0 && (
          <ul className="me-list">
            {items.map((it) => {
              const r = it.recipe_data;
              const passed = r.rulesCheck?.filter((c) => c.passed).length ?? 0;
              const total = r.rulesCheck?.length ?? 8;
              return (
                <li key={it.id} className="card me-item">
                  <div className="me-item-head">
                    <h2 className="me-item-name">{it.dish_name}</h2>
                    <div className="me-item-meta">
                      <span className={`compliance ${passed === total ? "" : passed >= total - 2 ? "partial" : "poor"}`}>
                        <span className="compliance-num">{passed}</span>
                        <span className="compliance-cap">/ {total}</span>
                      </span>
                    </div>
                  </div>
                  <div className="me-item-stats">
                    <span>碳水 {r.carbsGrams} g</span>
                    <span>GL {r.glycemicLoad}</span>
                    {r.palatability && <span>适口度 {r.palatability}/5</span>}
                  </div>
                  <div className="me-item-time">
                    保存于 {new Date(it.created_at).toLocaleString("zh-CN")}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
