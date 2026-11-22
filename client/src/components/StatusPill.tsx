export function StatusPill({ status }: { status?: string }) {
  const value = (status || "active").toLowerCase().replaceAll("_", " ");
  return <span className={`status-pill ${value.replaceAll(" ", "-")}`}>{value}</span>;
}
