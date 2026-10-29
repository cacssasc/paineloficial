const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Every typed word must appear in the title (accent/case-insensitive); titles starting with the query rank first. */
export function searchProducts<T extends { title: string }>(items: T[], query: string): T[] {
  const q = norm(query.trim());
  if (!q) return [];
  const words = q.split(/\s+/);
  return items
    .filter((i) => { const t = norm(i.title); return words.every((w) => t.includes(w)); })
    .sort((a, b) => Number(norm(b.title).startsWith(q)) - Number(norm(a.title).startsWith(q)));
}
