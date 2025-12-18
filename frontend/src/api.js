export async function ping() {
  const r = await fetch("/api/health");
  if (!r.ok) throw new Error("backend not reachable");
  return r.json();
}