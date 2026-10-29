export function brl(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function splitPrice(value: number) {
  const [int, cents] = brl(value).split(",");
  return { int, cents };
}

export function discountPct(price: number, old?: number | null) {
  if (!old || old <= price) return 0;
  return Math.round((1 - price / old) * 100);
}

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
