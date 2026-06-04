"use client";

import { useState } from "react";

import { CostItemTable } from "./CostItemTable";
import { CostSummaryPanel } from "./CostSummaryPanel";
import { SupplierSwitchPanel } from "./SupplierSwitchPanel";
import type { WorkbenchCostItem, WorkbenchEstimate } from "./workbenchTypes";

const defaultItems: WorkbenchCostItem[] = [
  {
    id: "main",
    costGroup: "main_material",
    itemName: "Lead Frame",
    pricingMode: "CNY_PER_K",
    price: 120,
    priceUnit: "CNY/K",
    supplierName: "Default Supplier"
  },
  {
    id: "aux",
    costGroup: "auxiliary_material",
    itemName: "Carrier Tape",
    pricingMode: "USAGE_TIMES_UNIT_PRICE",
    price: 0.5,
    priceUnit: "CNY/m",
    usage: 6,
    usageUnit: "m/K",
    supplierName: "Default Supplier"
  },
  {
    id: "process",
    costGroup: "process_outsourced_fee",
    itemName: "Plating",
    pricingMode: "CNY_PER_PIECE_TO_K",
    price: 0.02,
    priceUnit: "CNY/piece",
    supplierName: "Default Supplier"
  },
  {
    id: "overhead",
    costGroup: "overhead_allocation",
    itemName: "Monthly Allocation",
    pricingMode: "BATCH_TO_K",
    price: 500,
    priceUnit: "CNY/batch",
    batchOutputK: 10,
    supplierName: "Internal Allocation"
  }
];

export function CostWorkbench() {
  const [productName, setProductName] = useState("QFN Demo Product");
  const [version, setVersion] = useState("A");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [items, setItems] = useState(defaultItems);
  const [estimate, setEstimate] = useState<WorkbenchEstimate | null>(null);
  const [message, setMessage] = useState("");
  const [formalResult, setFormalResult] = useState("");

  async function createProject() {
    const response = await fetch("/api/cost-projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productName, version })
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "项目创建失败");
      return;
    }

    setProjectId(result.project.id);
    setMessage("项目已创建");
    await refreshEstimate(result.project.id, items);
  }

  async function refreshEstimate(currentProjectId = projectId, currentItems = items) {
    if (!currentProjectId) {
      setMessage("请先创建项目");
      return;
    }

    const response = await fetch(`/api/cost-projects/${currentProjectId}/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ costItems: currentItems })
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "估算失败");
      return;
    }

    setEstimate(result.estimate);
    setMessage("估算已刷新");
  }

  async function generateFormalResult() {
    if (!projectId) {
      setMessage("请先创建项目");
      return;
    }

    const response = await fetch(`/api/cost-projects/${projectId}/formal-results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ costItems: items })
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "正式计算失败");
      return;
    }

    setFormalResult(`正式结果 ${result.result.version}`);
    setMessage("正式结果已生成");
  }

  function updateItem(itemId: string, patch: Partial<WorkbenchCostItem>) {
    setItems((current) => current.map((item) => (
      item.id === itemId ? { ...item, ...patch } : item
    )));
  }

  function switchSupplier() {
    setItems((current) => current.map((item) => (
      item.id === "main"
        ? { ...item, supplierName: "Alternative Supplier", price: item.price }
        : item
    )));
    setMessage("已切换到 Alternative Supplier");
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <section style={{ display: "grid", gridTemplateColumns: "1fr 160px auto", gap: 12, alignItems: "end" }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 600 }}>产品名称</span>
          <input value={productName} onChange={(event) => setProductName(event.target.value)} style={inputStyle} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 600 }}>版本</span>
          <input value={version} onChange={(event) => setVersion(event.target.value)} style={inputStyle} />
        </label>
        <button type="button" onClick={createProject} style={primaryButton}>
          创建项目
        </button>
      </section>

      {message ? <p style={{ margin: 0, color: "#475569" }}>{message}</p> : null}

      <CostItemTable items={items} onChange={updateItem} />
      <SupplierSwitchPanel supplierName={items[0].supplierName ?? ""} onSwitch={switchSupplier} />

      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={() => refreshEstimate()} style={secondaryButton}>
          刷新估算
        </button>
        <button
          type="button"
          onClick={generateFormalResult}
          disabled={Boolean(estimate?.blockingIssues.length)}
          style={primaryButton}
        >
          生成正式结果
        </button>
      </div>

      <CostSummaryPanel estimate={estimate} />
      {formalResult ? <p data-testid="formal-result">{formalResult}</p> : null}
    </div>
  );
}

const inputStyle = {
  minHeight: 38,
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  padding: "0 10px"
};

const primaryButton = {
  minHeight: 38,
  border: "1px solid #0f172a",
  borderRadius: 6,
  background: "#0f172a",
  color: "white",
  padding: "0 14px"
};

const secondaryButton = {
  minHeight: 38,
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  background: "white",
  color: "#0f172a",
  padding: "0 14px"
};
