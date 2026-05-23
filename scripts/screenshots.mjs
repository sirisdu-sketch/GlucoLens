import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";

const URL = process.env.TARGET || "https://glucolens-xi.vercel.app";
const OUT = "docs/screenshots";

await mkdir(OUT, { recursive: true });

console.log(`Screenshotting: ${URL}\n`);

const browser = await chromium.launch();

// =============== 桌面 ===============
const desktop = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
  locale: "zh-CN",
});
const page = await desktop.newPage();
page.setDefaultTimeout(30000);

await page.goto(URL, { waitUntil: "networkidle" });
// 关闭 demo banner 让构图更干净
await page.evaluate(() => localStorage.setItem("glucolens-banner-dismissed", "1"));
await page.reload({ waitUntil: "networkidle" });

console.log("01 home default");
await page.screenshot({ path: `${OUT}/01-home-default.png`, fullPage: true });

// 长辈模式
console.log("02 home senior mode");
await page.getByRole("button", { name: /长辈模式/ }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/02-home-senior.png`, fullPage: true });
// 切回默认
await page.getByRole("button", { name: /长辈模式/ }).click();
await page.waitForTimeout(300);

// 选食材 - 用文本匹配点击 chip
console.log("03 ingredients selected");
for (const name of ["鸡胸肉", "西兰花", "糙米", "苹果"]) {
  await page.locator(`button.chip:has-text("${name}")`).first().click();
  await page.waitForTimeout(120);
}
await page.evaluate(() => window.scrollTo({ top: 0 }));
await page.screenshot({ path: `${OUT}/03-ingredients-selected.png`, fullPage: true });

// 点开火
console.log("04 loading (mid-stream)");
await page.getByRole("button", { name: /开火/ }).click();
// 等几秒让流式 chunk 出现
await page.waitForSelector(".cooking", { state: "visible" });
await page.waitForTimeout(2500);
// 滚到 loading 区域
await page.locator(".cooking").scrollIntoViewIfNeeded();
await page.screenshot({ path: `${OUT}/04-loading.png`, fullPage: false });

// 等结果出来（最长 35s）
console.log("05 result card (full)");
await page.waitForSelector(".result", { state: "visible", timeout: 40000 });
await page.waitForTimeout(800);
await page.evaluate(() => window.scrollTo({ top: 0 }));
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/05-result-card.png`, fullPage: true });

// 规则审计单独一张
console.log("06 rules audit");
await page.locator(".rules-box").scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
const rulesBox = page.locator(".rules-box");
await rulesBox.screenshot({ path: `${OUT}/06-rules-audit.png` });

// companions 单独一张（如果有的话）
console.log("07 companions");
const comp = page.locator(".companions-box");
if (await comp.count() > 0) {
  await comp.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await comp.screenshot({ path: `${OUT}/07-companions.png` });
} else {
  console.log("  (companions box not present in this run — skipping)");
}

await desktop.close();

// =============== 手机 ===============
console.log("08 mobile (iPhone 13)");
const mobile = await browser.newContext({
  ...devices["iPhone 13"],
  locale: "zh-CN",
});
const mpage = await mobile.newPage();
mpage.setDefaultTimeout(30000);
await mpage.goto(URL, { waitUntil: "networkidle" });
await mpage.evaluate(() => localStorage.setItem("glucolens-banner-dismissed", "1"));
await mpage.reload({ waitUntil: "networkidle" });
await mpage.screenshot({ path: `${OUT}/08-mobile.png`, fullPage: true });
await mobile.close();

await browser.close();
console.log(`\nAll screenshots saved to ${OUT}/`);
