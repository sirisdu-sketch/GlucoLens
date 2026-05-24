import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * 邮件里点击链接 → 这里。
 * 参考: https://supabase.com/docs/guides/auth/server-side/email-based-auth-with-pkce-flow-for-ssr
 *
 * 邮件模板里的链接应为：
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/me
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next") || "/me";

  if (!token_hash || !type) {
    const errUrl = new URL("/login", url.origin);
    errUrl.searchParams.set("err", "链接无效或缺少参数");
    return NextResponse.redirect(errUrl);
  }

  const sb = supabaseServer();
  const { error } = await sb.auth.verifyOtp({ type, token_hash });

  if (error) {
    const errUrl = new URL("/login", url.origin);
    errUrl.searchParams.set("err", error.message);
    return NextResponse.redirect(errUrl);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
