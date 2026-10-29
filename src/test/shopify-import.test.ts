import { describe, expect, it } from "vitest";
import { parseShopifyRows } from "@/lib/shopify-import";

const base = {
  Handle: "pneu-a", Title: "Pneu A", "Body (HTML)": "<p>Linha 1</p> <p>Linha 2</p>", Type: "175/60 R14",
  "Option1 Value": "Default Title", "Variant Price": "99.90", "Variant Compare At Price": "358.90",
  "Image Src": "https://x/a.jpg", Status: "active", Published: "true",
};

describe("Shopify CSV import", () => {
  it("one handle becomes one product with price, old price and size text", () => {
    const [p] = parseShopifyRows([base]);
    expect(p).toMatchObject({ slug: "pneu-a", price: 99.9, old_price: 358.9, subtitle: "175/60 R14", images: ["https://x/a.jpg"], variants: [] });
    expect(p!.description).toBe("Linha 1\n\nLinha 2");
  });
  it("extra rows with the same handle add images and real variants", () => {
    const out = parseShopifyRows([
      { ...base, "Option1 Value": "Preto" },
      { Handle: "pneu-a", "Option1 Value": "Branco", "Variant Price": "120", "Image Src": "https://x/b.jpg" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]!.images).toEqual(["https://x/a.jpg", "https://x/b.jpg"]);
    expect(out[0]!.variants.map((v) => v.name)).toEqual(["Preto", "Branco"]);
  });
  it("draft products are imported hidden", () => {
    expect(parseShopifyRows([{ ...base, Status: "draft" }])[0]!.active).toBe(false);
  });
});
