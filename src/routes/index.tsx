import { createFileRoute, Link } from "@tanstack/react-router";
import { listProducts } from "@/lib/store.functions";
import { withRetry } from "@/lib/retry";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { brl, discountPct } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ofertas | Mercado Livre" },
      { name: "description", content: "Produtos com os melhores preços, frete grátis e entrega rápida." },
      { property: "og:title", content: "Ofertas | Mercado Livre" },
      { property: "og:description", content: "Produtos com os melhores preços, frete grátis e entrega rápida." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => withRetry(() => listProducts()),
  component: Index,
});

function Index() {
  const products = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-ml-gray font-ml text-ml-text">
      <StoreHeader />
      <main className="mx-auto max-w-5xl p-3">
        <h1 className="mb-3 text-xl">Ofertas do dia</h1>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {products.map((p) => {
            const off = discountPct(Number(p.price), p.old_price ? Number(p.old_price) : null);
            return (
              <Link key={p.id} to="/p/$slug" params={{ slug: p.slug }} className="flex flex-col rounded-md bg-background p-3 shadow-sm">
                <img src={p.images[0]} alt={p.title} className="aspect-square w-full object-contain" />
                <p className="mt-2 line-clamp-2 text-sm">{p.title}</p>
                {p.old_price && <p className="mt-1 text-xs text-ml-muted line-through">R$ {brl(Number(p.old_price))}</p>}
                <p className="text-xl">
                  R$ {brl(Number(p.price))} {off > 0 && <span className="text-sm text-ml-green">{off}% OFF</span>}
                </p>
                {p.free_shipping && <p className="text-xs font-semibold text-ml-green">Frete grátis</p>}
              </Link>
            );
          })}
        </div>
        {products.length === 0 && <p className="text-ml-muted">Nenhum produto no momento.</p>}
      </main>
      <StoreFooter />
    </div>
  );
}
