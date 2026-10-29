import { describe, expect, it } from "vitest";
import { discountPct, slugify } from "@/lib/format";

describe("store rules", () => {
  it("each product title becomes its own link slug", () => {
    expect(slugify("Pneu Wanli SP203 175/75R14 Aro 14")).toBe("pneu-wanli-sp203-175-75r14-aro-14");
  });
  it("discount badge uses old price vs current price", () => {
    expect(discountPct(99.9, 310)).toBe(68);
    expect(discountPct(100, null)).toBe(0);
  });
});
