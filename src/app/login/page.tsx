"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Tab = "login" | "signup";
type Stage = "form" | "verify";

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/me";
  const initialErr = params.get("err");

  const [tab, setTab] = useState<Tab>("login");
  const [stage, setStage] = useState<Stage>("form");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [token, setToken] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(initialErr ? translate(initialErr) : "");
  const [info, setInfo] = useState("");

  const clear = () => {
    setErr("");
    setInfo("");
  };

  const getClient = () => {
    const sb = supabaseBrowser();
    if (!sb) {
      setErr("账户功能尚未启用：Supabase 环境变量未配置");
      return null;
    }
    return sb;
  };

  // ====== 登录 ======
  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clear();
    const sb = getClient();
    if (!sb) return;
    setBusy(true);
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      if (/Email not confirmed/i.test(error.message)) {
        // 邮箱未验证：重发并跳验证页
        await sb.auth.resend({ type: "signup", email });
        setStage("verify");
        setInfo("此邮箱尚未验证。我们刚给你重发了验证码，邮件里有 一组数字 或 一个链接，任选其一即可激活。");
        return;
      }
      setErr(translate(error.message));
      return;
    }
    router.push(redirect);
    router.refresh();
  };

  // ====== 注册 ======
  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clear();
    if (password.length < 6) return setErr("密码至少 6 位");
    if (password !== password2) return setErr("两次密码不一致");

    const sb = getClient();
    if (!sb) return;
    setBusy(true);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(redirect)}`,
      },
    });
    setBusy(false);

    if (error) {
      setErr(translate(error.message));
      return;
    }
    // 如果 Supabase 关掉了「Confirm email」，signUp 直接返回 session
    if (data.session) {
      router.push(redirect);
      router.refresh();
      return;
    }
    // 否则进入验证页
    setStage("verify");
    setInfo("注册成功。请去邮箱查收验证邮件：里面有 一组数字 或 一个链接，任选其一即可激活账户。");
  };

  // ====== 用 OTP 数字码完成验证 ======
  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    clear();
    const sb = getClient();
    if (!sb) return;
    setBusy(true);
    const { error } = await sb.auth.verifyOtp({
      email,
      token: token.trim(),
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

  // ====== 重发邮件 ======
  const onResend = async () => {
    clear();
    const sb = getClient();
    if (!sb) return;
    setBusy(true);
    const { error } = await sb.auth.resend({ type: "signup", email });
    setBusy(false);
    if (error) {
      setErr(translate(error.message));
      return;
    }
    setInfo("已重新发送验证邮件，请查收。");
  };

  // ====== 渲染：验证视图 ======
  if (stage === "verify") {
    return (
      <div className="auth-card">
        <h1 className="auth-title">验证邮箱</h1>
        <p className="auth-sub">
          邮件已发到 <b>{email}</b>。两种方式任选其一：
        </p>
        <ol className="verify-hint">
          <li>
            <strong>点邮件里的链接</strong>——会自动跳回这里并完成验证（推荐）
          </li>
          <li>
            <strong>复制邮件里的数字码</strong>粘到下面（链接被邮件客户端拦截时用）
          </li>
        </ol>

        {info && <div className="auth-sent">{info}</div>}

        <form onSubmit={onVerify} className="auth-form" style={{ marginTop: 16 }}>
          <label className="auth-label" htmlFor="token">数字码</label>
          <input
            id="token"
            className="auth-input otp-input"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="粘贴邮件里完整的数字"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\s/g, ""))}
            disabled={busy}
            required
          />
          <button
            type="submit"
            className="auth-submit"
            disabled={busy || token.length < 6}
          >
            {busy ? "验证中…" : "用数字码完成验证"}
          </button>
          {err && <div className="auth-error">{err}</div>}
        </form>

        <div className="auth-secondary">
          <button type="button" className="link-btn" onClick={onResend} disabled={busy}>
            没收到邮件？重新发送
          </button>
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setStage("form");
              setToken("");
              clear();
            }}
          >
            ← 换个邮箱重新开始
          </button>
        </div>
      </div>
    );
  }

  // ====== 渲染：登录/注册 ======
  const isLogin = tab === "login";
  return (
    <div className="auth-card">
      <Link className="auth-back" href="/">
        ← 返回首页
      </Link>
      <h1 className="auth-title">{isLogin ? "登录" : "注册"}</h1>

      <div className="auth-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={isLogin}
          className={`auth-tab ${isLogin ? "on" : ""}`}
          onClick={() => {
            setTab("login");
            clear();
          }}
          type="button"
        >
          登录
        </button>
        <button
          role="tab"
          aria-selected={!isLogin}
          className={`auth-tab ${!isLogin ? "on" : ""}`}
          onClick={() => {
            setTab("signup");
            clear();
          }}
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
          {busy
            ? isLogin
              ? "登录中…"
              : "提交中…"
            : isLogin
              ? "登录"
              : "注册"}
        </button>

        {err && <div className="auth-error">{err}</div>}
      </form>

      <p className="auth-foot">
        {isLogin ? "首次使用？" : "已有账户？"}{" "}
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            setTab(isLogin ? "signup" : "login");
            clear();
          }}
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
  if (/Email not confirmed/i.test(msg)) return "邮箱尚未验证";
  if (/User already registered/i.test(msg)) return "该邮箱已注册，请直接登录";
  if (/rate limit|too many|For security purposes/i.test(msg))
    return "请求太频繁，请稍后再试（邮件服务每小时仅 4 封）";
  if (/Token has expired|Token not found|invalid/i.test(msg))
    return "验证码已过期或错误，请重新发送";
  if (/Password should be at least/i.test(msg)) return "密码至少 6 位";
  if (/Email rate limit exceeded/i.test(msg)) return "邮件已发太多，请等 1 小时";
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
