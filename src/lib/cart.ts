import { useSyncExternalStore } from "react";

export type CartItem = {
  productId: string;
  variantId: string | null;
  slug: string;
  title: string;
  variantName: string | null;
  image: string;
  unitPrice: number;
  oldPrice: number | null;
  stock: number;
  qty: number;
};

const KEY = "ml-cart-v1";
export const MAX_QTY = 50;
const listeners = new Set<() => void>();
let cache: CartItem[] | null = null;
const EMPTY: CartItem[] = [];

export const maxQty = (stock: number) => Math.max(1, Math.min(MAX_QTY, stock || MAX_QTY));
const sameLine = (a: Pick<CartItem, "productId" | "variantId">, b: Pick<CartItem, "productId" | "variantId">) =>
  a.productId === b.productId && (a.variantId ?? null) === (b.variantId ?? null);

function read(): CartItem[] {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { cache = []; }
  return cache!;
}
function write(items: CartItem[]) {
  cache = items;
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

/** Pure merge used by addToCart: same product+variant sums quantity, capped by stock. */
export function mergeItem(items: CartItem[], item: CartItem): CartItem[] {
  const i = items.findIndex((x) => sameLine(x, item));
  if (i === -1) return [...items, { ...item, qty: Math.min(item.qty, maxQty(item.stock)) }];
  return items.map((x, j) => (j === i ? { ...x, ...item, qty: Math.min(x.qty + item.qty, maxQty(item.stock)) } : x));
}

export const addToCart = (item: CartItem) => write(mergeItem(read(), item));
export const setQty = (key: Pick<CartItem, "productId" | "variantId">, qty: number) =>
  write(read().map((x) => (sameLine(x, key) ? { ...x, qty: Math.max(1, Math.min(qty, maxQty(x.stock))) } : x)));
export const removeFromCart = (key: Pick<CartItem, "productId" | "variantId">) => write(read().filter((x) => !sameLine(x, key)));
export const clearCart = () => write([]);

export function useCart(): CartItem[] {
  return useSyncExternalStore(
    (l) => { listeners.add(l); const s = (e: StorageEvent) => { if (e.key === KEY) { cache = null; l(); } }; window.addEventListener("storage", s); return () => { listeners.delete(l); window.removeEventListener("storage", s); }; },
    read,
    () => EMPTY,
  );
}
