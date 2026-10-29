import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Zap, ChevronRight, Minus, Plus } from "lucide-react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { Price } from "@/components/store/Price";
import { useCart, setQty, removeFromCart, maxQty } from "@/lib/cart";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho | Mercado Livre" },
      { name: "description", content: "Revise os produtos do seu carrinho antes de continuar a compra." },
      { property: "og:title", content: "Carrinho | Mercado Livre" },
      { property: "og:description", content: "Revise os produtos do seu carrinho antes de continuar a compra." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Cart,
});

function Cart() {
  const items = useCart();
  const navigate = useNavigate();
  const total = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="min-h-screen bg-ml-gray pb-56 font-ml text-ml-text">
      <StoreHeader />
      <main className="mx-auto max-w-xl p-4">
        <section className="overflow-hidden rounded-md bg-background shadow-sm">
          <h1 className="flex items-center gap-1 border-b border-ml-muted/20 px-5 py-4 text-lg font-semibold">
            Produtos <Zap className="h-5 w-5 fill-ml-green text-ml-green" />
            <span className="font-black italic text-ml-green">FULL</span>
          </h1>
          {items.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p>Seu carrinho está vazio</p>
              <Link to="/" className="mt-2 inline-block text-ml-blue">Descobrir produtos</Link>
            </div>
          ) : (
            <>
              {items.map((it) => (
                <div key={`${it.productId}-${it.variantId}`} className="flex gap-4 border-b border-ml-muted/20 px-5 py-4">
                  <img src={it.image} alt="" className="h-14 w-14 shrink-0 object-contain" />
                  <div className="min-w-0 flex-1">
                    <Link to="/p/$slug" params={{ slug: it.slug }} className="line-clamp-1">{it.title}</Link>
                    {it.variantName && <p className="text-xs text-ml-muted">{it.variantName}</p>}
                    <button onClick={() => removeFromCart(it)} className="mt-1 text-sm text-ml-blue">Excluir</button>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 rounded-md border border-ml-muted/30 px-3 py-1">
                        <button aria-label="Diminuir" disabled={it.qty <= 1} onClick={() => setQty(it, it.qty - 1)} className="text-ml-blue disabled:opacity-40"><Minus className="h-4 w-4" /></button>
                        <span className="w-6 text-center">{it.qty}</span>
                        <button aria-label="Aumentar" disabled={it.qty >= maxQty(it.stock)} onClick={() => setQty(it, it.qty + 1)} className="text-ml-blue disabled:opacity-40"><Plus className="h-4 w-4" /></button>
                      </div>
                      <Price value={it.unitPrice * it.qty} className="text-lg" />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-between px-5 py-4">
                <span>Frete</span><span className="font-semibold text-ml-green">Grátis</span>
              </div>
              <div className="bg-ml-gray/60 px-5 py-4">
                <div className="relative h-1.5 rounded-full bg-ml-green">
                  <span className="absolute -right-1 -top-[3px] h-3 w-3 rounded-full bg-ml-green" />
                </div>
                <p className="mt-3">Aproveite o frete grátis e adicione mais produtos ao carrinho!</p>
                <Link to="/" className="flex items-center text-ml-blue">Ver mais produtos Full <ChevronRight className="h-4 w-4" /></Link>
              </div>
            </>
          )}
        </section>
      </main>

      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 rounded-t-xl bg-background shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
          <div className="mx-auto max-w-xl space-y-2 p-4">
            <div className="flex justify-between"><span>Produtos ({count})</span><Price value={total} /></div>
            <div className="flex justify-between"><span>Frete</span><span className="text-ml-green">Grátis</span></div>
            <div className="flex justify-between pt-1 text-xl font-semibold"><span>Total</span><Price value={total} /></div>
            <button onClick={() => navigate({ to: "/comprar" })} className="mt-2 h-12 w-full rounded-md bg-ml-blue text-lg font-semibold text-background">
              Continuar a compra
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
