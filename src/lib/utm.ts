import { z } from "zod";

export type UtmParameters = Record<string, string>;
const STORAGE_KEY = "store-utm-visit-v1";
const utmKey = /^utm_[a-z0-9_]{1,64}$/i;

// Only campaign labels are accepted, never unrelated URL tokens/customer fields.
export function pickUtms(input: Record<string, unknown>): UtmParameters {
  return Object.fromEntries(Object.entries(input)
    .filter(([key, value]) => utmKey.test(key) && (typeof value === "string" || typeof value === "number") && String(value).length <= 500)
    .slice(0, 30)
    .map(([key, value]) => [key.toLowerCase(), String(value)]));
}

export const utmSchema = z.record(z.string().max(500)).refine(
  (value) => Object.keys(value).length <= 30 && Object.keys(value).every((key) => utmKey.test(key)),
  "Parâmetros de campanha inválidos",
).transform(pickUtms);

export function readVisitUtms(): UtmParameters {
  if (typeof window === "undefined") return {};
  try { return pickUtms(JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}")); }
  catch { return {}; }
}

export function captureVisitUtms(search: string): UtmParameters {
  const incoming = pickUtms(Object.fromEntries(new URLSearchParams(search)));
  const attribution = Object.keys(incoming).length ? incoming : readVisitUtms();
  if (typeof window !== "undefined" && Object.keys(incoming).length) {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution)); } catch { /* URL still carries attribution. */ }
  }
  return attribution;
}

export function preserveUtms(current: Record<string, unknown>, destination: Record<string, unknown>): Record<string, unknown> {
  const explicit = pickUtms(destination);
  // A new tagged destination starts a new campaign, not a mix of old and new labels.
  const attribution = Object.keys(explicit).length ? explicit : Object.keys(pickUtms(current)).length ? pickUtms(current) : readVisitUtms();
  return { ...attribution, ...destination };
}