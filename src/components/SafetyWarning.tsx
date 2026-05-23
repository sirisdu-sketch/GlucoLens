type Props = {
  variant: "pre-generate" | "post-result";
};

export function SafetyWarning({ variant }: Props) {
  if (variant === "pre-generate") {
    return (
      <div className="safety-warn pre-gen" role="note">
        <strong>请先阅读：</strong>本工具基于中国 2 型糖尿病膳食指南 (2023) / ADA Standards of Care (2024) / 日本糖尿病学会食事療法 (2024) 设计，
        <strong>仅供饮食灵感参考，不替代医生、临床营养师的诊疗</strong>。糖尿病饮食请遵医嘱并结合个人血糖监测调整。
      </div>
    );
  }
  return (
    <div className="safety-warn" role="note">
      <strong>⚠️ 特别提示：</strong>
      <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
        <li>
          <strong>1 型糖尿病 / 使用胰岛素：</strong>下方碳水克数是 AI 估算值，与精确称重存在偏差，
          <strong>请以营养标签或营养师确认值打胰岛素</strong>。
        </li>
        <li>
          <strong>妊娠糖尿病：</strong>本方案未考虑叶酸/铁/钙等孕期特殊需求，请咨询产科或临床营养师。
        </li>
        <li>
          <strong>合并肾病/心血管/服用 SGLT2i：</strong>蛋白质、钠、极低碳水均有禁忌，请在专科医生指导下调整。
        </li>
      </ul>
    </div>
  );
}
