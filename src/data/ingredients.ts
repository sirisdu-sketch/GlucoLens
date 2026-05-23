import type { Ingredient } from "@/types/recipe";

/**
 * 食材控糖属性库
 * - friendly: ok = 控糖友好 / mod = 适量 / caution = 慎用
 * - gi: 整数血糖生成指数（如已知）
 * - sources: 标注来源（CN=中国2型糖尿病膳食指南2023, ADA=ADA Standards of Care 2024,
 *   JDS=日本糖尿病学会食事療法 2024）
 *
 * 注：GI 数值来自国际公认数据库（悉尼大学 GI Database / 中国食物 GI 表）。
 */
export const INGREDIENTS: Record<string, Ingredient[]> = {
  主食: [
    { name: "燕麦（整粒/钢切）", friendly: "ok", gi: 55, note: "整粒/钢切 GI 中低，高纤维平稳血糖", sources: ["ADA", "CN"] },
    { name: "即食燕麦片", friendly: "caution", gi: 79, note: "即食燕麦 GI 偏高，不如整粒燕麦控糖", sources: ["JDS"] },
    { name: "藜麦", friendly: "ok", gi: 53, note: "高蛋白低 GI，优质主食", sources: ["ADA"] },
    { name: "荞麦面", friendly: "ok", gi: 54, note: "低 GI，膳食纤维丰富", sources: ["CN"] },
    { name: "糙米", friendly: "ok", gi: 55, note: "低 GI 主食优选", sources: ["CN", "ADA"] },
    { name: "大麦", friendly: "ok", gi: 28, note: "低 GI 全谷物，比糙米更友好", sources: ["ADA"] },
    { name: "青稞", friendly: "ok", gi: 35, note: "β-葡聚糖丰富，控糖优选", sources: ["CN"] },
    { name: "黑米", friendly: "ok", gi: 42, note: "花青素 + 全谷物纤维", sources: ["CN"] },
    { name: "小米", friendly: "mod", gi: 71, note: "升糖中等，建议与其他全谷物搭配", sources: ["CN"] },
    { name: "全麦面包", friendly: "mod", gi: 69, note: "看清配料表是否真全麦", sources: ["ADA"] },
    { name: "红薯", friendly: "mod", gi: 63, note: "GI 中等，需计入主食量", sources: ["CN"] },
    { name: "玉米（整粒）", friendly: "mod", gi: 52, note: "整粒为佳，玉米片/糊则高 GI", sources: ["CN"] },
    { name: "白米饭", friendly: "caution", gi: 83, note: "高 GI，建议减量或换糙米", sources: ["CN", "JDS"] },
    { name: "白面条", friendly: "caution", gi: 81, note: "精制碳水升糖快，建议替换全麦/荞麦", sources: ["CN"] },
    { name: "馒头", friendly: "caution", gi: 88, note: "高 GI 精制主食，建议减量", sources: ["CN"] },
    { name: "土豆（煮）", friendly: "caution", gi: 78, note: "淀粉高，宜替部分主食并减量", sources: ["JDS"] },
  ],
  蛋白质: [
    { name: "鸡蛋", friendly: "ok", note: "优质蛋白，平稳血糖，每日 1 个", sources: ["CN", "ADA"] },
    { name: "鸡胸肉", friendly: "ok", note: "高蛋白低脂", sources: ["CN"] },
    { name: "瘦牛肉", friendly: "ok", note: "优质蛋白，铁含量高，适量", sources: ["CN"] },
    { name: "瘦猪肉", friendly: "ok", note: "去肥部分，适量", sources: ["CN"] },
    { name: "豆腐", friendly: "ok", note: "植物蛋白，低 GI", sources: ["CN", "ADA"] },
  ],
  "深海鱼·水产": [
    { name: "三文鱼", friendly: "ok", note: "ω-3 丰富，降心血管风险", sources: ["ADA"] },
    { name: "鲭鱼/秋刀鱼", friendly: "ok", note: "EPA/DHA 丰富的深海鱼", sources: ["ADA", "JDS"] },
    { name: "沙丁鱼", friendly: "ok", note: "高 ω-3 低汞", sources: ["ADA"] },
    { name: "鲈鱼/鳕鱼", friendly: "ok", note: "白肉鱼低脂高蛋白", sources: ["CN"] },
    { name: "虾", friendly: "ok", note: "高蛋白低脂", sources: ["CN"] },
  ],
  豆类: [
    { name: "黄豆", friendly: "ok", gi: 18, note: "植物蛋白基石，低 GI", sources: ["ADA", "CN"] },
    { name: "黑豆", friendly: "ok", gi: 30, note: "纤维 + 花青素双重护航", sources: ["ADA"] },
    { name: "红腰豆", friendly: "ok", gi: 24, note: "豆类控糖王，慢释碳水", sources: ["ADA"] },
    { name: "鹰嘴豆", friendly: "ok", gi: 28, note: "高纤维高蛋白", sources: ["ADA"] },
    { name: "扁豆", friendly: "ok", gi: 32, note: "降低餐后血糖反应明显", sources: ["ADA"] },
    { name: "毛豆", friendly: "ok", gi: 22, note: "新鲜大豆，搭配主食可减少升糖", sources: ["CN"] },
  ],
  "坚果·种子": [
    { name: "杏仁", friendly: "ok", note: "MUFA 丰富，每日小把（约 20g）", sources: ["ADA"] },
    { name: "核桃", friendly: "ok", note: "ω-3 植物来源，每日 2-3 颗", sources: ["ADA"] },
    { name: "开心果", friendly: "ok", note: "RCT 证据降餐后血糖", sources: ["ADA"] },
    { name: "亚麻籽", friendly: "ok", note: "ω-3 + 膳食纤维", sources: ["ADA"] },
    { name: "奇亚籽", friendly: "ok", note: "高纤维降餐后血糖峰值", sources: ["ADA"] },
  ],
  乳制品: [
    { name: "无糖希腊酸奶", friendly: "ok", note: "高蛋白低糖，避免风味加糖款", sources: ["ADA"] },
    { name: "低脂牛奶", friendly: "ok", gi: 32, note: "每日 300g 以内", sources: ["CN", "ADA"] },
    { name: "无糖豆浆", friendly: "ok", note: "植物乳替代，注意无糖", sources: ["CN"] },
  ],
  蔬菜: [
    { name: "西兰花", friendly: "ok", note: "高纤维，控糖友好", sources: ["CN", "ADA"] },
    { name: "菠菜", friendly: "ok", note: "低热量高纤维", sources: ["CN"] },
    { name: "黄瓜", friendly: "ok", note: "水分高，几乎不升糖", sources: ["CN"] },
    { name: "番茄", friendly: "ok", note: "低 GI，富含番茄红素", sources: ["CN"] },
    { name: "茄子", friendly: "ok", note: "高纤维，少油为宜", sources: ["CN"] },
    { name: "青椒", friendly: "ok", note: "维 C 高，低糖", sources: ["CN"] },
    { name: "蘑菇", friendly: "ok", note: "低热量，鲜味替盐", sources: ["CN"] },
    { name: "白菜", friendly: "ok", note: "高纤维，百搭", sources: ["CN"] },
    { name: "芹菜", friendly: "ok", note: "高纤维，助饱腹", sources: ["CN"] },
    { name: "豆角", friendly: "ok", note: "纤维丰富", sources: ["CN"] },
    { name: "洋葱", friendly: "ok", note: "适量，含天然多酚助胰岛素敏感", sources: ["CN"] },
    { name: "胡萝卜（生）", friendly: "ok", gi: 39, note: "生胡萝卜 GI 低", sources: ["JDS"] },
    { name: "胡萝卜（熟）", friendly: "mod", gi: 49, note: "熟食 GI 上升，适量", sources: ["JDS"] },
    { name: "南瓜", friendly: "mod", gi: 64, note: "偏甜，适量并计入碳水", sources: ["CN"] },
  ],
  "水果·其他": [
    { name: "蓝莓", friendly: "ok", gi: 53, note: "低 GI 莓果，抗氧化", sources: ["ADA"] },
    { name: "草莓", friendly: "ok", gi: 41, note: "低糖莓果，适量", sources: ["ADA"] },
    { name: "苹果", friendly: "ok", gi: 36, note: "低 GI 水果代表，带皮吃", sources: ["ADA", "CN"] },
    { name: "梨", friendly: "ok", gi: 38, note: "低 GI 应季水果", sources: ["CN"] },
    { name: "橙子", friendly: "ok", gi: 43, note: "整个吃，不要榨汁", sources: ["ADA"] },
    { name: "猕猴桃", friendly: "ok", gi: 52, note: "低 GI + 高维 C", sources: ["ADA"] },
    { name: "橄榄油", friendly: "ok", note: "MUFA 主力，地中海饮食核心", sources: ["ADA"] },
    { name: "牛油果", friendly: "ok", note: "健康脂肪，注意热量", sources: ["ADA"] },
    { name: "醋", friendly: "ok", note: "餐前少量有助平稳血糖", sources: ["JDS"] },
    { name: "大蒜", friendly: "ok", note: "调味去盐好帮手", sources: ["CN"] },
    { name: "生姜", friendly: "ok", note: "提味，几乎不升糖", sources: ["CN"] },
    { name: "肉桂", friendly: "ok", note: "可能轻度改善胰岛素敏感（证据 C 级）", sources: ["ADA"] },
    { name: "香蕉", friendly: "mod", gi: 51, note: "成熟度越高升糖越快，半根为宜", sources: ["CN"] },
  ],
};
