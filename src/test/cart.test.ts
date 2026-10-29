import { describe, expect, it } from "vitest";
import { mergeItem, type CartItem } from "@/lib/cart";
import { searchProducts } from "@/lib/search";

const item = (o: Partial<CartItem> = {}): CartItem => ({
  productId: "a", variantId: null, slug: "a", title: "A", variantName: null, image: "", unitPrice: 10, oldPrice: null, stock: 100, qty: 1, ...o,
});

describe("cart", () => {
  it("adds different products as separate lines", () => {
    expect(mergeItem([item()], item({ productId: "b" }))).toHaveLength(2);
  });
  it("same product adds up quantity", () => {
    expect(mergeItem([item({ qty: 2 })], item({ qty: 3 }))[0]?.qty).toBe(5);
  });
  it("quantity is capped by stock", () => {
    expect(mergeItem([item({ qty: 4, stock: 5 })], item({ qty: 3, stock: 5 }))[0]?.qty).toBe(5);
  });
});

describe("search", () => {
  const list = [{ title: "Pneu Wanli Aro 14" }, { title: "Pneu Pirelli Aro 15" }];
  it("matches words in any order, ignoring accents/case", () => {
    expect(searchProducts(list, "aro 14 PNÉU")).toEqual([list[0]]);
  });
  it("empty query returns nothing", () => {
    expect(searchProducts(list, "  ")).toEqual([]);
  });
});
