import { CostWorkbench } from "@/components/workbench/CostWorkbench";

export default function WorkbenchPage() {
  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: 32 }}>
      <header style={{ display: "grid", gap: 8, marginBottom: 24 }}>
        <p style={{ margin: 0, color: "#475569", fontSize: 14 }}>成本工作台</p>
        <h1 style={{ margin: 0 }}>封装成本测算</h1>
        <p style={{ margin: 0, color: "#475569" }}>
          创建项目、维护四层成本项、刷新实时估算，并生成带快照的正式结果。
        </p>
      </header>
      <CostWorkbench />
    </main>
  );
}
