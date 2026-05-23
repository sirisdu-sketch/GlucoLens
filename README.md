# GlucoLens · 控糖灶

三层架构的控糖食谱生成器：
- **规则层**：食材控糖属性库 + 控糖硬规则
- **AI 层**：Gemini 在规则约束内生成个性化食谱
- **趣味层**：原创 jellycat 风炒菜动画 + 专业 loading 文案

## 本地启动

```powershell
pnpm install
pnpm dev
```

浏览器打开 http://localhost:3000

## 启用 AI 调用

1. 在 https://aistudio.google.com 申请免费 Gemini API key
2. 复制 `.env.local.example` 为 `.env.local`
3. 填入 `GEMINI_API_KEY`
4. 重启 `pnpm dev`

不配 key 也能用：`/api/recipe` 会返回 mock 食谱，完整流程可演示。

## 目录结构

```
src/
  app/
    page.tsx              主页面
    layout.tsx            全局布局
    globals.css           全局样式 + jellycat 动画
    api/recipe/route.ts   AI 食谱生成接口
  data/
    ingredients.ts        食材控糖属性库（规则层）
    rules.ts              硬规则 + 文案常量
  components/
    HappyWok.tsx          炒锅 + 抛飞食材
    Ingredients.tsx       Broc / Tomato / Egg / Garlic 小插画
    Sprout.tsx            标题装饰
    LoadingScene.tsx      loading 场景组合
    RecipeCard.tsx        食谱结果卡片
  lib/
    gemini.ts             Gemini SDK 调用（含 mock 兜底）
    prompt.ts             AI prompt 模板
  types/
    recipe.ts             类型定义
```
