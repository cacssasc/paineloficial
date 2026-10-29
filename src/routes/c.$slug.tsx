import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { withRetry } from "@/lib/retry";
import { ArrowDownUp, Heart, SlidersHorizontal, Zap } from "lucide-react";
import { useState } from "react";
import { getCatalogBySlug } from "@/lib/store.functions";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader, Stars } from "@/components/store/StoreHeader";
import { discountPct, splitPrice } from "@/lib/format";

export const Route = createFileRoute("/c/$slug")({
  loader: async ({ params }) => {
    const data = await withRetry(() => getCatalogBySlug({ data: { slug: params.slug } }));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.catalog.title} | Mercado Livre` : "Catálogo indisponível";
    const d = loaderData ? `Ofertas em ${loaderData.catalog.title} com frete grátis.` : "Catálogo não encontrado.";
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background font-ml">
      <StoreHeader />
      <p className="p-8 text-center text-ml-text">Este catálogo não está disponível.</p>
    </div>
  ),
  component: CatalogPage,
});

function CatalogPage() {
  const { catalog, products } = Route.useLoaderData();
  const [sort, setSort] = useState<"rel" | "asc" | "desc">("rel");
  const list = [...products].sort((a, b) =>
    sort === "asc" ? Number(a.price) - Number(b.price) : sort === "desc" ? Number(b.price) - Number(a.price) : 0,
  );

  return (
    <div className="min-h-screen bg-ml-gray font-ml text-ml-text">
      <StoreHeader />
      <div className="mx-auto grid max-w-xl grid-cols-2 border-b border-ml-muted/15 bg-background py-3 text-ml-blue">
        <button
          onClick={() => setSort(sort === "rel" ? "asc" : sort === "asc" ? "desc" : "rel")}
          className="flex items-center justify-center gap-2 border-r border-ml-muted/20"
        >
          <ArrowDownUp className="h-4 w-4" />
          {sort === "rel" ? "Ordenar" : sort === "asc" ? "Menor preço" : "Maior preço"}
        </button>
        <button className="flex items-center justify-center gap-2">
          <SlidersHorizontal className="h-4 w-4" /> Filtrar
        </button>
      </div>
      <main className="mx-auto max-w-xl">
        <h1 className="px-4 py-5 text-xl font-semibold">{catalog.title}</h1>
        <ul className="space-y-0.5">
          {list.map((p) => {
            const price = Number(p.price);
            const old = p.old_price != null ? Number(p.old_price) : null;
            const off = discountPct(price, old);
            const cur = splitPrice(price);
            const o = old ? splitPrice(old) : null;
            const inst = splitPrice(price / Math.max(1, p.installments));
            return (
              <li key={p.id}>
                <Link to="/p/$slug" params={{ slug: p.slug }} className="flex gap-3 bg-background p-3">
                  <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-md bg-ml-gray">
                    <img src={p.images[0]} alt={p.title} className="h-full w-full object-contain mix-blend-multiply" />
                    <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background text-ml-blue">
                      <Heart className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <p className="line-clamp-2 leading-snug">{p.title}</p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-ml-muted">
                      <Stars value={Number(p.rating)} />
                      {p.subtitle && <span className="truncate">({p.subtitle})</span>}
                    </p>
                    {o && <p className="mt-1 text-sm text-ml-muted line-through">R$ {o.int}<sup>{o.cents}</sup></p>}
                    <p className="text-2xl font-light">
                      R$ {cur.int}<sup className="text-xs">{cur.cents}</sup>
                      {off > 0 && <span className="ml-2 text-sm font-normal text-ml-green">{off}% OFF</span>}
                    </p>
                    <p className="text-sm">
                      em <span className="text-ml-green">{p.installments}x R$ {inst.int}<sup className="text-[9px]">{inst.cents}</sup> sem juros</span>
                    </p>
                    {p.free_shipping && <p className="mt-2 text-sm font-semibold text-ml-green">Frete grátis</p>}
                    <p className="mt-2 flex items-center gap-1 text-sm text-ml-muted">
                      Enviado pelo <Zap className="h-3.5 w-3.5 fill-ml-green text-ml-green" />
                      <span className="font-semibold italic text-ml-green">FULL</span>
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
        {list.length === 0 && <p className="p-6 text-center text-ml-muted">Nenhum produto neste catálogo.</p>}
      </main>
      <StoreFooter />
    </div>
  );
}
