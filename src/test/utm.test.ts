import { beforeEach, describe, expect, it } from "vitest";
import { captureVisitUtms, pickUtms, preserveUtms, utmSchema } from "@/lib/utm";

describe("campaign UTM attribution", () => {
  beforeEach(() => sessionStorage.clear());
  it("preserves every utm_* label across product, cart and checkout navigation", () => {
    const labels = { utm_source: "facebook", utm_medium: "cpc", utm_campaign: "aro14", utm_content: "video1", utm_term: "pneu", utm_custom: "grupo2" };
    let search: Record<string, unknown> = labels;
    for (const destination of ["/p/pneu", "/carrinho", "/comprar", "/pix/id", "/obrigado/id"]) {
      search = preserveUtms(search, { page: destination });
      expect(pickUtms(search)).toEqual(labels);
    }
  });
  it("retains attribution within the visit when a URL is untagged", () => {
    captureVisitUtms("?utm_source=google&utm_campaign=oferta");
    expect(captureVisitUtms("")).toEqual({ utm_source: "google", utm_campaign: "oferta" });
    expect(preserveUtms({}, {})).toEqual({ utm_source: "google", utm_campaign: "oferta" });
  });
  it("a new campaign replaces the old one without mixing labels", () => {
    captureVisitUtms("?utm_source=google&utm_campaign=old&utm_content=old-ad");
    expect(captureVisitUtms("?utm_source=meta&utm_campaign=new")).toEqual({ utm_source: "meta", utm_campaign: "new" });
  });
  it("does not propagate unrelated parameters or payment secrets", () => {
    expect(preserveUtms({ utm_source: "meta", email: "private", client_secret: "secret" }, { sort: "price" })).toEqual({ utm_source: "meta", sort: "price" });
    expect(utmSchema.safeParse({ email: "private" }).success).toBe(false);
  });
  it("validates campaign labels for the order without changing their values", () => {
    expect(utmSchema.parse({ utm_campaign: "Campanha São Paulo", utm_custom: "123" })).toEqual({ utm_campaign: "Campanha São Paulo", utm_custom: "123" });
  });
});