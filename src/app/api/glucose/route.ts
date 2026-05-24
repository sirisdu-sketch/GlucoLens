import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import type { GlucoseContext, GlucoseReadingInput } from "@/types/glucose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_CONTEXTS: GlucoseContext[] = [
  "fasting",
  "pre_meal",
  "post_meal_1h",
  "post_meal_2h",
  "bedtime",
  "other",
];

export async function GET() {
  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data, error } = await sb
    .from("glucose_readings")
    .select("id, user_id, recipe_id, value_mmol, context, measured_at, note, created_at")
    .eq("user_id", user.id)
    .order("measured_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: Request) {
  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let body: GlucoseReadingInput;
  try {
    body = (await req.json()) as GlucoseReadingInput;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const value = Number(body.value_mmol);
  if (!Number.isFinite(value) || value <= 0 || value > 40) {
    return NextResponse.json(
      { error: "value_mmol 必须在 0–40 之间" },
      { status: 400 }
    );
  }
  if (!ALLOWED_CONTEXTS.includes(body.context)) {
    return NextResponse.json({ error: "context 非法" }, { status: 400 });
  }
  const measuredAt = body.measured_at ? new Date(body.measured_at) : new Date();
  if (Number.isNaN(measuredAt.getTime())) {
    return NextResponse.json({ error: "measured_at 非法" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("glucose_readings")
    .insert({
      user_id: user.id,
      recipe_id: body.recipe_id ?? null,
      value_mmol: Math.round(value * 10) / 10,
      context: body.context,
      measured_at: measuredAt.toISOString(),
      note: body.note?.trim() || null,
    })
    .select("id, user_id, recipe_id, value_mmol, context, measured_at, note, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ reading: data });
}

export async function DELETE(req: Request) {
  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  // RLS 已限制只能删自己，这里再加一道 where 当兜底
  const { error } = await sb
    .from("glucose_readings")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
