export function KpiCard({ label, value, detail, tone = "default" }: { label: string; value: string; detail: string; tone?: "default" | "warning" | "success" }) {
  return (
    <article className={`kpi-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}
