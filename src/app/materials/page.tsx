import {
  listMaterialPrices,
  listSpecifications
} from "@/lib/domain/master-data/specifications";

type MaterialsPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function MaterialsPage({ searchParams }: MaterialsPageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const [specifications, prices] = await Promise.all([
    listSpecifications(),
    listMaterialPrices({ search: query })
  ]);

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: 32 }}>
      <header style={{ display: "grid", gap: 8, marginBottom: 24 }}>
        <p style={{ margin: 0, color: "#475569", fontSize: 14 }}>主数据</p>
        <h1 style={{ margin: 0 }}>材料与供应商价格</h1>
        <p style={{ margin: 0, color: "#475569" }}>
          查询材料、规格、供应商、价格、单位、生效日期和导入批次。
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(240px, 1fr) auto",
          gap: 12,
          alignItems: "end",
          marginBottom: 20
        }}
      >
        <form action="/materials" style={{ display: "contents" }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 600 }}>搜索</span>
            <input
              name="q"
              defaultValue={query}
              placeholder="材料编码、规格、供应商或导入文件"
              style={{
                minHeight: 40,
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                padding: "0 12px"
              }}
            />
          </label>
          <button
            type="submit"
            style={{
              minHeight: 40,
              border: "1px solid #0f172a",
              borderRadius: 6,
              background: "#0f172a",
              color: "white",
              padding: "0 16px"
            }}
          >
            查询
          </button>
        </form>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 20
        }}
      >
        <Metric label="规格数量" value={specifications.length} />
        <Metric label="价格记录" value={prices.length} />
        <Metric
          label="活跃供应商记录"
          value={prices.filter((price) => price.supplierStatus === "active").length}
        />
      </section>

      <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left" }}>
              <TableHeader>材料类别</TableHeader>
              <TableHeader>材料编码</TableHeader>
              <TableHeader>材料名称</TableHeader>
              <TableHeader>规格</TableHeader>
              <TableHeader>供应商</TableHeader>
              <TableHeader>价格</TableHeader>
              <TableHeader>单位</TableHeader>
              <TableHeader>生效日期</TableHeader>
              <TableHeader>导入批次</TableHeader>
            </tr>
          </thead>
          <tbody>
            {prices.length > 0 ? (
              prices.map((price) => (
                <tr key={price.supplierPriceId} style={{ borderTop: "1px solid #e2e8f0" }}>
                  <TableCell>{price.materialCategory}</TableCell>
                  <TableCell>{price.materialCode}</TableCell>
                  <TableCell>{price.materialName}</TableCell>
                  <TableCell>{price.specificationName}</TableCell>
                  <TableCell>
                    {price.supplierName}
                    {price.supplierStatus !== "active" ? (
                      <span style={{ marginLeft: 6, color: "#b45309" }}>
                        {price.supplierStatus}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>{price.price}</TableCell>
                  <TableCell>{price.priceUnit}</TableCell>
                  <TableCell>{formatDate(price.effectiveDate)}</TableCell>
                  <TableCell>{price.importBatchFileName}</TableCell>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                  暂无匹配的材料价格记录。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 16 }}>
      <div style={{ color: "#64748b", fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: 12, fontSize: 13 }}>{children}</th>;
}

function TableCell({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: 12, fontSize: 14 }}>{children}</td>;
}

function formatDate(value: string) {
  return value.slice(0, 10);
}
