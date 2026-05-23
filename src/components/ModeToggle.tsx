"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "glucolens-senior-mode";

export function ModeToggle() {
  const [senior, setSenior] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) === "1";
    setSenior(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.senior = senior ? "true" : "false";
    localStorage.setItem(STORAGE_KEY, senior ? "1" : "0");
  }, [senior, mounted]);

  const toggle = () => setSenior((s) => !s);

  return (
    <button
      type="button"
      className="mode-toggle"
      aria-pressed={senior}
      aria-label={senior ? "关闭长辈模式" : "开启长辈模式"}
      onClick={toggle}
    >
      <span className="mode-toggle-dot" />
      {senior ? "长辈模式 · 已开" : "长辈模式"}
    </button>
  );
}
