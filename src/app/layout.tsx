import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "GlucoLens · 控糖灶 — 循证糖尿病食谱生成器",
    template: "%s · GlucoLens 控糖灶",
  },
  description:
    "基于中国 / ADA / 日本三国糖尿病权威指南，按家中食材给一道低 GI 控糖菜。每道菜带 8 条循证规则审计与明确碳水克数。",
  keywords: [
    "糖尿病",
    "控糖食谱",
    "低 GI",
    "GL",
    "糖尿病饮食",
    "糖友食谱",
    "ADA",
    "T2DM",
    "妊娠糖尿病",
    "胰岛素",
  ],
  authors: [{ name: "GlucoLens" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "/",
    title: "GlucoLens · 控糖灶",
    description: "循证糖尿病食谱生成器 · 三国权威指南 · 8 条规则透明审计",
    siteName: "GlucoLens",
  },
  twitter: {
    card: "summary_large_image",
    title: "GlucoLens · 控糖灶",
    description: "循证糖尿病食谱生成器 · 三国权威指南 · 8 条规则透明审计",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#F4EEE2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
