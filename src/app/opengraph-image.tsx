import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "GlucoLens · 控糖灶 — 循证糖尿病食谱生成器";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 96px",
          backgroundColor: "#F4EEE2",
          backgroundImage:
            "radial-gradient(60% 50% at 88% 6%, rgba(126,155,110,.25), transparent 70%), radial-gradient(55% 50% at 8% 96%, rgba(235,167,124,.28), transparent 70%)",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 8,
            color: "#C45628",
            fontWeight: 700,
            textTransform: "uppercase",
            marginBottom: 28,
          }}
        >
          基于中 · 美 · 日 三国权威糖尿病指南
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 24,
            color: "#3F5538",
          }}
        >
          <div style={{ fontSize: 140, fontWeight: 700, letterSpacing: -2 }}>GlucoLens</div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 500,
              letterSpacing: 18,
              color: "#6B8560",
            }}
          >
            控糖灶
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 40,
            color: "#9C3F1F",
            marginTop: 16,
            fontWeight: 500,
          }}
        >
          有什么 · 做什么 · 吃得稳
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "#5D5443",
            marginTop: 30,
            lineHeight: 1.5,
          }}
        >
          家里有什么食材？按循证指南给你一道控糖友好的菜。
          <br />
          每道菜带 8 条规则审计 + 明确碳水克数。
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 48,
            fontSize: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              background: "#E7EEDD",
              color: "#3F5538",
              padding: "10px 22px",
              borderRadius: 999,
              fontWeight: 700,
            }}
          >
            中国 2 型糖尿病膳食指南 2023
          </div>
          <div
            style={{
              display: "flex",
              background: "#F8E5D6",
              color: "#9C3F1F",
              padding: "10px 22px",
              borderRadius: 999,
              fontWeight: 700,
            }}
          >
            ADA Standards of Care 2024
          </div>
          <div
            style={{
              display: "flex",
              background: "#FBF1DC",
              color: "#9A7A22",
              padding: "10px 22px",
              borderRadius: 999,
              fontWeight: 700,
            }}
          >
            JDS 食事療法 2024
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
