"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  // 邮件链接走 /auth/confirm 完成 verifyOtp（type=recovery），随后跳回这里时已带 session
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) {
      setReady(true);
      return;
    }
    sb.auth.getUser().then((res: { data: { user: unknown } }) => {
      setHasSession(!!res.data.user);
      setReady(true);
    });
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (password.length < 6) return setErr("密码至少 6 位");
    if (password !== password2) return setErr("两次密码不一致");

    const sb = supabaseBrowser();
    if (!sb) return setErr("账户功能尚未启用");

    setBusy(true);
    const { error } = await sb.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      setErr(translate(error.message));
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.push("/me");
      router.refresh();
    }, 1200);
  };

  return (
    <div className="gl-root">
      <div className="gl-bg" />
      <main className="gl-shell auth-shell">
        <div className="auth-card">
          <h1 className="auth-title">设置新密码</h1>

          {!ready ? (
            <p className="auth-sub">加载中…</p>
          ) : !hasSession ? (
            <>
              <p className="auth-sub">
                链接已失效，或你尚未通过邮件验证。请重新发起重置流程。
              </p>
              <div className="auth-secondary" style={{ marginTop: 16 }}>
                <Link className="link-btn" href="/auth/forgot-password">
                  → 重新发送重置邮件
                </Link>
              </div>
            </>
          ) : done ? (
            <>
              <p className="auth-sub">密码已更新，正在带你去「我的菜谱本」…</p>
            </>
          ) : (
            <>
              <p className="auth-sub">输入一个新密码，至少 6 位。</p>
              <form onSubmit={onSubmit} className="auth-form">
                <label className="auth-label" htmlFor="password">新密码</label>
                <input
                  id="password"
                  className="auth-input"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  placeholder="至少 6 位"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                />

                <label className="auth-label" htmlFor="password2">再次输入</label>
                <input
                  id="password2"
                  className="auth-input"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  placeholder="确认新密码"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  disabled={busy}
                />

                <button type="submit" className="auth-submit" disabled={busy}>
                  {busy ? "更新中…" : "更新密码"}
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
  if (/should be at least/i.test(msg)) return "密码至少 6 位";
  if (/same as the old password|New password should be different/i.test(msg))
    return "新密码不能与旧密码相同";
  if (/Auth session missing|JWT expired/i.test(msg))
    return "会话已失效，请重新点击邮件中的链接";
  return msg;
}
