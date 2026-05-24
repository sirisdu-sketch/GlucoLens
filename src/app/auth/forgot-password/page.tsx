"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    const sb = supabaseBrowser();
    if (!sb) {
      setErr("账户功能尚未启用：Supabase 环境变量未配置");
      return;
    }

    setBusy(true);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/reset-password`,
    });
    setBusy(false);

    if (error) {
      setErr(translate(error.message));
      return;
    }
    setSent(true);
  };

  return (
    <div className="gl-root">
      <div className="gl-bg" />
      <main className="gl-shell auth-shell">
        <div className="auth-card">
          <Link className="auth-back" href="/login">
            ← 返回登录
          </Link>
          <h1 className="auth-title">重置密码</h1>

          {sent ? (
            <>
              <p className="auth-sub">
                我们已把重置链接发到 <b>{email}</b>。
              </p>
              <div className="auth-sent">
                <strong>下一步</strong>
                <p>
                  打开邮箱，点击邮件中的链接 —— 会自动跳回这里，让你设置新密码。
                </p>
              </div>
              <div className="auth-secondary" style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                >
                  ← 换个邮箱
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="auth-sub">
                输入注册时的邮箱，我们会发一封含重置链接的邮件给你。
              </p>
              <form onSubmit={onSubmit} className="auth-form">
                <label className="auth-label" htmlFor="email">邮箱</label>
                <input
                  id="email"
                  className="auth-input"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={busy}
                />
                <button type="submit" className="auth-submit" disabled={busy}>
                  {busy ? "发送中…" : "发送重置链接"}
                </button>
                {err && <div className="auth-error">{err}</div>}
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function translate(msg: string): string {
  if (/rate limit|too many|For security purposes/i.test(msg))
    return "请求太频繁，请稍后再试";
  if (/Email rate limit exceeded/i.test(msg)) return "邮件已发太多，请等 1 小时";
  if (/Unable to validate email|invalid format/i.test(msg)) return "邮箱格式不正确";
  return msg;
}
