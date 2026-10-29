// Turns a Shopify product export (CSV rows) into products for this store.
export type CsvRow = Record<string, string>;

export type ImportedProduct = {
  slug: string;
  title: string;
  description: string;
  subtitle: string;
  price: number;
  old_price: number | null;
  images: string[];
  active: boolean;
  variants: { name: string; price: number | null; image_url: string | null }[];
};

function num(v: string | undefined) {
  if (!v) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function htmlToText(html: string) {
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h\d)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .trim();
}

export function parseShopifyRows(rows: CsvRow[]): ImportedProduct[] {
  const byHandle = new Map<string, ImportedProduct>();
  for (const r of rows) {
    const handle = (r["Handle"] ?? "").trim();
    if (!handle) continue;
    let p = byHandle.get(handle);
    if (!p) {
      if (!r["Title"]?.trim()) continue;
      p = {
        slug: handle,
        title: r["Title"].trim(),
        description: htmlToText(r["Body (HTML)"] ?? ""),
        subtitle: (r["Type"] ?? "").trim(),
        price: num(r["Variant Price"]) ?? 0,
        old_price: num(r["Variant Compare At Price"]),
        images: [],
        active: (r["Status"] ?? "active").trim().toLowerCase() !== "draft" && (r["Published"] ?? "true").trim().toLowerCase() !== "false",
        variants: [],
      };
      byHandle.set(handle, p);
    }
    const img = (r["Image Src"] ?? "").trim();
    if (img && !p.images.includes(img)) p.images.push(img);
    const opt = [r["Option1 Value"], r["Option2 Value"], r["Option3 Value"]]
      .map((x) => (x ?? "").trim())
      .filter((x) => x && x !== "Default Title")
      .join(" / ");
    if (opt) {
      p.variants.push({
        name: opt,
        price: num(r["Variant Price"]),
        image_url: (r["Variant Image"] ?? "").trim() || null,
      });
    }
  }
  return [...byHandle.values()];
}
