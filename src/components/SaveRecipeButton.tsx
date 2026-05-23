"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Session, User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { Preferences, Recipe } from "@/types/recipe";

type Props = {
  recipe: Recipe;
  preferences?: Preferences;
};

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "duplicate" }
  | { kind: "error"; msg: string }
  | { kind: "anon" }; // 未登录

export function SaveRecipeButton({ recipe, preferences }: Props) {
  const [state, setState] = useState<SaveState>({ kind: "idle" });
  const [authReady, setAuthReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      setAuthed(!!data.user);
      setAuthReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange(
      (_e: string, session: Session | null) => {
        setAuthed(!!session?.user);
      }
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSave = async () => {
    if (!authed) {
      setState({ kind: "anon" });
      return;
    }
    setState({ kind: "saving" });
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe, preferences }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      setState({ kind: "saved" });
    } catch (e) {
      setState({ kind: "error", msg: e instanceof Error ? e.message : "保存失败" });
    }
  };

  if (!authReady) {
    return (
      <div className="save-wrap">
        <button className="save-btn" disabled>
          …
        </button>
      </div>
    );
  }

  return (
    <div className="save-wrap">
      <button
        className="save-btn"
        type="button"
        onClick={onSave}
        disabled={state.kind === "saving" || state.kind === "saved"}
      >
        {state.kind === "saving"
          ? "保存中…"
          : state.kind === "saved"
            ? "✓ 已保存"
            : "♡ 保存到我的菜谱本"}
      </button>
      {state.kind === "saved" && (
        <Link className="save-link" href="/me">
          查看菜谱本 →
        </Link>
      )}
      {state.kind === "anon" && (
        <div className="save-hint">
          <Link
            className="save-link"
            href={`/login?redirect=${encodeURIComponent("/")}`}
          >
            登录后即可保存 →
          </Link>
        </div>
      )}
      {state.kind === "error" && <div className="save-err">{state.msg}</div>}
    </div>
  );
}
