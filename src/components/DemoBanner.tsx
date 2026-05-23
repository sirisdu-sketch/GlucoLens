"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "glucolens-banner-dismissed";

export function DemoBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) !== "1") setShow(true);
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  if (!show) return null;

  return (
    <div className="demo-banner" role="region" aria-label="作品集 demo 说明">
      <span className="demo-banner-text">
        <strong>这是求职作品 demo</strong>
        <span aria-hidden="true"> · </span>
        循证规则引擎 + Gemini AI 实验项目，<strong>不构成医疗建议</strong>，糖尿病饮食请遵医嘱。
      </span>
      <button
        className="demo-banner-x"
        type="button"
        onClick={dismiss}
        aria-label="关闭说明"
      >
        ×
      </button>
    </div>
  );
}
