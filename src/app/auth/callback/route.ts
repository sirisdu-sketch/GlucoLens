import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const redirect = url.searchParams.get("redirect") || "/me";

  if (code) {
    const sb = supabaseServer();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) {
      const errUrl = new URL("/login", url.origin);
      errUrl.searchParams.set("err", error.message);
      return NextResponse.redirect(errUrl);
    }
  }

  return NextResponse.redirect(new URL(redirect, url.origin));
}
