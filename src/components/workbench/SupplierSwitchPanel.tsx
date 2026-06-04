export function SupplierSwitchPanel({
  supplierName,
  onSwitch
}: {
  supplierName: string;
  onSwitch: () => void;
}) {
  return (
    <section style={{ display: "grid", gap: 8 }}>
      <h2 style={{ margin: 0 }}>供应商切换</h2>
      <p style={{ margin: 0, color: "#475569" }}>当前供应商：{supplierName}</p>
      <button type="button" onClick={onSwitch} style={buttonStyle}>
        切换供应商
      </button>
    </section>
  );
}

const buttonStyle = {
  minHeight: 36,
  border: "1px solid #0f172a",
  borderRadius: 6,
  background: "#0f172a",
  color: "white",
  padding: "0 14px",
  justifySelf: "start"
};
