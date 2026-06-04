import type { WorkbenchEstimate } from "./workbenchTypes";

export function CostSummaryPanel({ estimate }: { estimate: WorkbenchEstimate | null }) {
  const current = estimate ?? {
    mainMaterialCostK: 0,
    auxiliaryMaterialCostK: 0,
    processFeeCostK: 0,
    overheadCostK: 0,
    totalCostK: 0,
    blockingIssues: []
  };

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>成本汇总</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 8 }}>
        <Metric label="主材" value={current.mainMaterialCostK} />
        <Metric label="辅材" value={current.auxiliaryMaterialCostK} />
        <Metric label="制程" value={current.processFeeCostK} />
        <Metric label="制造费用" value={current.overheadCostK} />
        <Metric label="总成本" value={current.totalCostK} testId="total-cost" />
      </div>
      {current.blockingIssues.length > 0 ? (
        <ul style={{ margin: 0, color: "#b45309" }}>
          {current.blockingIssues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function Metric({ label, value, testId }: { label: string; value: number; testId?: string }) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12 }}>
      <div style={{ color: "#64748b", fontSize: 13 }}>{label}</div>
      <div data-testid={testId} style={{ fontSize: 22, fontWeight: 700 }}>
        {formatNumber(value)}
      </div>
    </div>
  );
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}
