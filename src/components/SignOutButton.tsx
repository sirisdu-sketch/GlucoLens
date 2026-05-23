"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    const sb = supabaseBrowser();
    await sb.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      className="signout-btn"
      type="button"
      onClick={onClick}
      disabled={loading}
    >
      {loading ? "退出中…" : "退出"}
    </button>
  );
}
