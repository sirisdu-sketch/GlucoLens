"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/browser";

function LoginForm() {
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/me";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errMsg, setErrMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrMsg("");
    const sb = supabaseBrowser();
    if (!sb) {
      setStatus("error");
      setErrMsg("账户功能尚未启用（Supabase 环境变量未配置）。请稍后再试。");
      return;
    }
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
    if (error) {
      setStatus("error");
      setErrMsg(error.message);
    } else {
      setStatus("sent");
    }
  };

  return (
    <div className="auth-card">
      <Link className="auth-back" href="/">
        ← 返回首页
      </Link>
      <h1 className="auth-title">登录 / 注册</h1>
      <p className="auth-sub">
        输入邮箱，我们发一封登录链接给你。**无需密码**，点链接即登录。
      </p>

      {status === "sent" ? (
        <div className="auth-sent">
          <strong>已发送 ✉️</strong>
          <p>
            登录链接已发到 <b>{email}</b>。请去邮箱点链接（5 分钟内有效）。如果没收到检查垃圾邮件夹。
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="auth-form">
          <label className="auth-label" htmlFor="email">邮箱</label>
          <input
            id="email"
            className="auth-input"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "sending"}
          />
          <button
            type="submit"
            className="auth-submit"
            disabled={status === "sending"}
          >
            {status === "sending" ? "发送中…" : "发送登录链接"}
          </button>
          {status === "error" && (
            <div className="auth-error">{errMsg || "出错了，请稍后再试。"}</div>
          )}
        </form>
      )}

      <p className="auth-foot">
        登录后可保存生成的菜谱到「我的菜谱本」，记录餐后血糖建立个人控糖档案。
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="gl-root">
      <div className="gl-bg" />
      <main className="gl-shell auth-shell">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
