"use client";

import type { WorkbenchCostItem } from "./workbenchTypes";

type CostItemTableProps = {
  items: WorkbenchCostItem[];
  onChange: (itemId: string, patch: Partial<WorkbenchCostItem>) => void;
};

export function CostItemTable({ items, onChange }: CostItemTableProps) {
  const byId = Object.fromEntries(items.map((item) => [item.id, item]));

  return (
    <section style={{ display: "grid", gap: 14 }}>
      <h2 style={{ margin: 0 }}>成本项目</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        <Field
          label="主材价格"
          value={byId.main.price}
          onChange={(price) => onChange("main", { price })}
        />
        <Field
          label="辅材用量"
          value={byId.aux.usage ?? 0}
          onChange={(usage) => onChange("aux", { usage })}
        />
        <Field
          label="辅材单价"
          value={byId.aux.price}
          onChange={(price) => onChange("aux", { price })}
        />
        <Field
          label="制程单颗费用"
          value={byId.process.price}
          onChange={(price) => onChange("process", { price })}
        />
        <Field
          label="制造费用批次金额"
          value={byId.overhead.price}
          onChange={(price) => onChange("overhead", { price })}
        />
        <Field
          label="制造费用产出K"
          value={byId.overhead.batchOutputK ?? 0}
          onChange={(batchOutputK) => onChange("overhead", { batchOutputK })}
        />
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{
          minHeight: 38,
          border: "1px solid #cbd5e1",
          borderRadius: 6,
          padding: "0 10px"
        }}
      />
    </label>
  );
}
