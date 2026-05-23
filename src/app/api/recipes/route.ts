import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import type { Preferences, Recipe } from "@/types/recipe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SaveBody = {
  recipe: Recipe;
  preferences?: Preferences;
};

function slugify(name: string): string {
  const ts = Date.now().toString(36).slice(-5);
  const base = name
    .replace(/[\s·，,。.()（）'"！!?？]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .toLowerCase();
  return `${base || "dish"}-${ts}`;
}

export async function POST(req: Request) {
  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let body: SaveBody;
  try {
    body = (await req.json()) as SaveBody;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  if (!body.recipe?.dishName) {
    return NextResponse.json({ error: "recipe required" }, { status: 400 });
  }

  const slug = slugify(body.recipe.dishName);

  const { data, error } = await sb
    .from("saved_recipes")
    .insert({
      user_id: user.id,
      dish_name: body.recipe.dishName,
      recipe_data: body.recipe,
      preferences: body.preferences ?? null,
      slug,
      public: false,
    })
    .select("id, slug, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ saved: data });
}

export async function GET() {
  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data, error } = await sb
    .from("saved_recipes")
    .select("id, slug, dish_name, created_at, recipe_data")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data });
}
