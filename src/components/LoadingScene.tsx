"use client";

import { useEffect, useState } from "react";
import { LOADING_LINES } from "@/data/rules";
import { HappyWok } from "./HappyWok";

type Props = {
  /** 服务端流式上报的累计字符数；未传时回退到时间估算 */
  streamedChars?: number;
};

const EXPECTED_CHARS = 2400; // 真实 Gemini 输出约 2300-2800 字符（关闭 thinking 后）

export function LoadingScene({ streamedChars }: Props) {
  const [idx, setIdx] = useState(0);
  const [timePct, setTimePct] = useState(0);

  useEffect(() => {
    const lineTimer = setInterval(
      () => setIdx((i) => (i + 1) % LOADING_LINES.length),
      1400
    );
    const start = Date.now();
    const pctTimer = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      // 关闭 thinking 后 8 秒级响应，把时间估算曲线调到 6 秒满 80%
      const eased = 1 - Math.pow(1 - Math.min(elapsed / 6, 1), 2.2);
      setTimePct(Math.min(Math.round(eased * 80), 80));
    }, 100);
    return () => {
      clearInterval(lineTimer);
      clearInterval(pctTimer);
    };
  }, []);

  // 优先用真实流式进度；流尚未开始时回落到时间估算
  const streamPct = streamedChars
    ? Math.min(Math.round((streamedChars / EXPECTED_CHARS) * 96), 96)
    : 0;
  const pct = Math.max(timePct, streamPct);

  return (
    <section className="cooking">
      <HappyWok />
      <div className="cooking-text">
        <div className="loading-line">{LOADING_LINES[idx]}</div>
        <div className="progress-wrap">
          <div
            className="progress-track"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="progress-pct">
            {streamedChars ? `已收到 ${streamedChars} 字 · ${pct}%` : `${pct}%`}
          </div>
        </div>
      </div>
    </section>
  );
}
