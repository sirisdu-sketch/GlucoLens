"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Tab = "login" | "signup";
type Stage = "form" | "verify-otp";

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/me";

  const [tab, setTab] = useState<Tab>("login");
  const [stage, setStage] = useState<Stage>("form");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [otp, setOtp] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const reset = () => {
    setErr("");
    setInfo("");
  };

  const supabase = () => {
    const sb = supabaseBrowser();
    if (!sb) {
      setErr("账户功能尚未启用：Supabase 环境变量未配置");
      return null;
    }
    return sb;
  };

  // === 登录：邮箱 + 密码 ===
  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    const sb = supabase();
    if (!sb) return;
    setBusy(true);
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      // 邮箱未验证 → 直接去 OTP 验证流程
      if (/Email not confirmed/i.test(error.message)) {
        setStage("verify-otp");
        setInfo("邮箱尚未验证。我们刚发了一个 6 位验证码到你邮箱，输入即可激活账户。");
        await sb.auth.resend({ type: "signup", email });
        return;
      }
      setErr(translate(error.message));
      return;
    }
    router.push(redirect);
    router.refresh();
  };

  // === 注册：邮箱 + 密码 → 发 OTP ===
  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (password.length < 6) {
      setErr("密码至少 6 位");
      return;
    }
    if (password !== password2) {
      setErr("两次输入的密码不一致");
      return;
    }
    const sb = supabase();
    if (!sb) return;
    setBusy(true);
    const { data, error } = await sb.auth.signUp({ email, password });
    setBusy(false);
    if (error) {
      setErr(translate(error.message));
      return;
    }
    // 若 Supabase 后台关闭了邮箱确认，signUp 会直接返回 session
    if (data.session) {
      router.push(redirect);
      router.refresh();
      return;
    }
    setStage("verify-otp");
    setInfo("已发送 6 位验证码到你的邮箱，5 分钟内输入即可完成注册。");
  };

  // === 验证 OTP ===
  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    const sb = supabase();
    if (!sb) return;
    setBusy(true);
    const { error } = await sb.auth.verifyOtp({
      email,
      token: otp.trim(),
      type: "signup",
    });
    setBusy(false);
    if (error) {
      setErr(translate(error.message));
      return;
    }
    router.push(redirect);
    router.refresh();
  };

  // === 重发 OTP ===
  const onResendOtp = async () => {
    reset();
    const sb = supabase();
    if (!sb) return;
    setBusy(true);
    const { error } = await sb.auth.resend({ type: "signup", email });
    setBusy(false);
    if (error) {
      setErr(translate(error.message));
      return;
    }
    setInfo("验证码已重新发送，请查收邮件。");
  };

  // ====== OTP 验证视图 ======
  if (stage === "verify-otp") {
    return (
      <div className="auth-card">
        <h1 className="auth-title">验证邮箱</h1>
        <p className="auth-sub">
          我们给 <b>{email}</b> 发了一封带 <b>6 位验证码</b> 的邮件。
        </p>
        {info && <div className="auth-sent" style={{ marginBottom: 14 }}>{info}</div>}
        <form onSubmit={onVerify} className="auth-form">
          <label className="auth-label" htmlFor="otp">验证码</label>
          <input
            id="otp"
            className="auth-input otp-input"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6 位数字"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            disabled={busy}
            required
          />
          <button type="submit" className="auth-submit" disabled={busy || otp.length !== 6}>
            {busy ? "验证中…" : "完成验证 · 登录"}
          </button>
          {err && <div className="auth-error">{err}</div>}
        </form>
        <div className="auth-secondary">
          <button type="button" className="link-btn" onClick={onResendOtp} disabled={busy}>
            没收到？重新发送验证码
          </button>
          <button type="button" className="link-btn" onClick={() => { setStage("form"); reset(); }}>
            ← 改邮箱重新开始
          </button>
        </div>
      </div>
    );
  }

  // ====== 登录 / 注册 视图 ======
  const isLogin = tab === "login";
  return (
    <div className="auth-card">
      <Link className="auth-back" href="/">← 返回首页</Link>
      <h1 className="auth-title">{isLogin ? "登录" : "注册"}</h1>

      <div className="auth-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={isLogin}
          className={`auth-tab ${isLogin ? "on" : ""}`}
          onClick={() => { setTab("login"); reset(); }}
          type="button"
        >
          登录
        </button>
        <button
          role="tab"
          aria-selected={!isLogin}
          className={`auth-tab ${!isLogin ? "on" : ""}`}
          onClick={() => { setTab("signup"); reset(); }}
          type="button"
        >
          注册新账户
        </button>
      </div>

      <form onSubmit={isLogin ? onLogin : onSignup} className="auth-form">
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

        <label className="auth-label" htmlFor="password">密码</label>
        <input
          id="password"
          className="auth-input"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          required
          minLength={6}
          placeholder={isLogin ? "你的密码" : "至少 6 位"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
        />

        {!isLogin && (
          <>
            <label className="auth-label" htmlFor="password2">再次输入密码</label>
            <input
              id="password2"
              className="auth-input"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="确认密码"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              disabled={busy}
            />
          </>
        )}

        <button type="submit" className="auth-submit" disabled={busy}>
          {busy ? (isLogin ? "登录中…" : "发送验证码…") : isLogin ? "登录" : "注册 · 发送验证码"}
        </button>

        {err && <div className="auth-error">{err}</div>}
      </form>

      <p className="auth-foot">
        {isLogin ? "首次使用？" : "已有账户？"}{" "}
        <button
          type="button"
          className="link-btn"
          onClick={() => { setTab(isLogin ? "signup" : "login"); reset(); }}
        >
          {isLogin ? "去注册 →" : "去登录 →"}
        </button>
        <br />
        登录后可保存生成的菜谱、建立个人控糖档案。
      </p>
    </div>
  );
}

function translate(msg: string): string {
  if (/Invalid login credentials/i.test(msg)) return "邮箱或密码错误";
  if (/Email not confirmed/i.test(msg)) return "邮箱尚未验证，请先输入收到的验证码";
  if (/User already registered/i.test(msg)) return "该邮箱已注册，请直接登录";
  if (/rate limit|too many/i.test(msg)) return "请求太频繁，请稍后再试";
  if (/Token has expired or is invalid/i.test(msg)) return "验证码已过期或错误，请重新发送";
  if (/Password should be at least/i.test(msg)) return "密码至少 6 位";
  return msg;
}

export default function LoginPage() {
  return (
    <div className="gl-root">
      <div className="gl-bg" />
      <main className="gl-shell auth-shell">
        <Suspense fallback={null}>
          <AuthForm />
        </Suspense>
      </main>
    </div>
  );
}
