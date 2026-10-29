import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { withRetry } from "@/lib/retry";
import { toast } from "sonner";
import { addToCart, maxQty } from "@/lib/cart";
import { useState } from "react";
import { Heart, Share2, Undo2, ShieldCheck, Award, ChevronRight, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerTrigger, DrawerContent, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { getProductBySlug, listProducts } from "@/lib/store.functions";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader, Stars } from "@/components/store/StoreHeader";
import { StoreCard, PaymentMethods } from "@/components/store/StoreCard";
import { brl, discountPct, splitPrice } from "@/lib/format";

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    const [data, all] = await Promise.all([withRetry(() => getProductBySlug({ data: { slug: params.slug } })), withRetry(() => listProducts())]);
    if (!data) throw notFound();
    return { ...data, related: all.filter((x) => x.slug !== params.slug).slice(0, 12) };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    const title = p ? `${p.title} | Mercado Livre` : "Produto indisponível";
    const desc = p ? p.description.slice(0, 155) : "Produto não encontrado.";
    const img = p?.images[0];
    const meta = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (img?.startsWith("https://")) {
      meta.push({ property: "og:image", content: img }, { name: "twitter:image", content: img });
    }
    return { meta };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background font-ml">
      <StoreHeader />
      <div className="p-8 text-center text-ml-text">
        <p className="text-lg">Este produto não está disponível.</p>
        <Link to="/" className="mt-4 inline-block text-ml-blue">Ver outros produtos</Link>
      </div>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product: p, variants, reviews, related, store } = Route.useLoaderData();
  const [img, setImg] = useState(0);
  const [variantId, setVariantId] = useState<string | null>(variants[0]?.id ?? null);
  const variant = variants.find((v) => v.id === variantId);
  const images = variant?.image_url ? [variant.image_url, ...p.images] : p.images;
  const price = variant?.price != null ? Number(variant.price) : Number(p.price);
  const old = p.old_price != null ? Number(p.old_price) : null;
  const off = discountPct(price, old);
  const { int, cents } = splitPrice(price);
  const inst = splitPrice(price / Math.max(1, p.installments));
  const reviewImages = reviews.flatMap((r) => r.images);
  const navigate = useNavigate();
  const [qty, setQtyState] = useState(1);
  const [quantityOpen, setQuantityOpen] = useState(false);
  const add = () =>
    addToCart({
      productId: p.id, variantId: variant?.id ?? null, slug: p.slug, title: p.title, variantName: variant?.name ?? null,
      image: images[0] ?? "", unitPrice: price, oldPrice: old, stock: p.stock, qty,
    });

  return (
    <div className="min-h-screen bg-background font-ml text-ml-text">
      <StoreHeader />
      <main className="mx-auto max-w-xl pb-16">
        <section className="px-4 pt-4">
          {p.brand_line && <p className="text-sm text-ml-blue">{p.brand_line}</p>}
          <div className="mt-4 flex items-center justify-between gap-2 text-sm text-ml-muted">
            <span className="truncate">
              {p.condition} <span className="mx-1">|</span> {p.sold_label}
            </span>
            <span className="flex shrink-0 items-center gap-1">
              {Number(p.rating).toFixed(1)} <Stars value={Number(p.rating)} />
              <span>({p.rating_count})</span>
            </span>
          </div>
          {p.best_seller && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-sm bg-ml-orange px-1.5 py-0.5 text-[11px] font-semibold uppercase text-background">
                Mais vendido
              </span>
              {p.best_seller_label && <span className="text-sm text-ml-blue">{p.best_seller_label}</span>}
            </div>
          )}
          <h1 className="mt-2 text-xl leading-snug">{p.title}</h1>
        </section>

        <section className="relative mt-4 px-4">
          <span className="absolute left-4 top-0 z-10 rounded-full bg-ml-gray px-3 py-1 text-sm">
            {images.length ? img + 1 : 0}/{images.length}
          </span>
          <button className="absolute right-4 top-0 z-10 grid h-10 w-10 place-items-center rounded-full bg-ml-gray text-ml-blue" aria-label="Favoritar">
            <Heart className="h-5 w-5" />
          </button>
          <div className="flex aspect-square snap-x snap-mandatory overflow-x-auto" onScroll={(e) => {
            const el = e.currentTarget;
            setImg(Math.round(el.scrollLeft / el.clientWidth));
          }}>
            {images.map((src, i) => (
              <img key={i} src={src} alt={p.title} className="h-full w-full shrink-0 snap-center object-contain" />
            ))}
          </div>
          <button className="absolute bottom-2 right-4 grid h-10 w-10 place-items-center rounded-full bg-ml-gray text-ml-blue" aria-label="Compartilhar">
            <Share2 className="h-5 w-5" />
          </button>
          <div className="mt-3 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <span key={i} className={`h-2 w-2 rounded-full ${i === img ? "bg-ml-blue" : "bg-ml-muted/30"}`} />
            ))}
          </div>
        </section>

        {variants.length > 0 && (
          <section className="mt-6 px-4">
            <p className="text-sm">
              Opção: <span className="font-semibold">{variant?.name}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => { setVariantId(v.id); setImg(0); }}
                  className={`rounded-md border px-3 py-2 text-sm ${v.id === variantId ? "border-2 border-ml-blue" : "border-ml-muted/30"}`}
                >
                  {v.image_url && <img src={v.image_url} alt="" className="mx-auto mb-1 h-10 w-10 object-contain" />}
                  {v.name}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="mt-6 px-4">
          {p.offer_of_day && (
            <span className="rounded-sm bg-ml-blue px-1.5 py-0.5 text-xs font-semibold text-background">OFERTA DO DIA</span>
          )}
          {old && old > price && <p className="mt-2 text-base text-ml-muted line-through">R$ {brl(old)}</p>}
          <div className="flex items-start gap-2">
            <p className="text-4xl font-light">
              R$ {int}<sup className="ml-0.5 text-lg">{cents}</sup>
            </p>
            {off > 0 && (
              <span className="mt-2 rounded-sm bg-ml-green px-1.5 py-0.5 text-base font-semibold text-background">{off}% OFF</span>
            )}
          </div>
          <p className="mt-1 text-base">
            em <span className="text-ml-green">{p.installments}x R$ {inst.int}<sup className="text-[10px]">{inst.cents}</sup> sem juros</span>
          </p>
          <p className="mt-1 text-sm text-ml-blue">Ver os meios de pagamento</p>
        </section>

        <section className="mt-6 px-4">
          {p.free_shipping && (
            <span className="rounded-sm bg-ml-green px-1.5 py-0.5 text-xs font-semibold text-background">FRETE GRÁTIS</span>
          )}
          <p className="mt-3 text-base"><span className="font-semibold text-ml-green">Chegará grátis</span> em até 7 dias úteis</p>
          <p className="text-sm text-ml-blue">Mais detalhes e formas de entrega</p>

          <p className="mt-6 font-semibold">Estoque disponível</p>
          <p className="flex items-center gap-1 text-sm text-ml-muted">
            Armazenado e enviado pelo <Zap className="h-4 w-4 fill-ml-green text-ml-green" />
            <span className="font-semibold italic text-ml-green">FULL</span>
          </p>
          <Drawer open={quantityOpen} onOpenChange={setQuantityOpen} shouldScaleBackground={false}>
            <DrawerTrigger asChild>
              <Button variant="ghost" className="mt-3 h-auto min-h-14 w-full justify-between bg-ml-gray px-4 py-4 text-left text-base font-normal text-ml-text hover:bg-ml-gray">
                <span className="flex flex-wrap items-baseline gap-x-1.5 whitespace-normal">Quantidade: <strong className="font-semibold">{qty}</strong> <span className="text-ml-muted/60">(+{p.stock} disponíveis)</span></span>
                <ChevronRight className="size-5! text-ml-blue" />
              </Button>
            </DrawerTrigger>
            <DrawerContent aria-describedby={undefined} className="mx-auto max-h-[75dvh] max-w-xl border-0 font-ml text-ml-text [&>div:first-child]:hidden">
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" aria-label="Fechar quantidades" className="absolute -top-12 right-3 text-background hover:bg-background/10 hover:text-background"><X className="size-6!" /></Button>
              </DrawerClose>
              <div className="shrink-0 border-b border-ml-muted/25 px-4 py-5">
                <DrawerTitle className="text-xl font-semibold tracking-normal">Escolha quantidade</DrawerTitle>
              </div>
              <div className="overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
                {Array.from({ length: maxQty(p.stock) }, (_, i) => i + 1).map((amount) => (
                  <Button key={amount} variant="ghost" aria-pressed={qty === amount} onClick={() => { setQtyState(amount); setQuantityOpen(false); }} className={`h-14 w-full rounded-none border-b border-ml-muted/25 text-lg font-normal hover:bg-ml-gray ${qty === amount ? "bg-ml-gray" : "bg-background"}`}>
                    {amount} {amount === 1 ? "unidade" : "unidades"}
                  </Button>
                ))}
              </div>
            </DrawerContent>
          </Drawer>

          <button
            onClick={() => { add(); navigate({ to: "/carrinho" }); }}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-md bg-ml-blue text-base font-semibold text-background"
          >
            Comprar agora
          </button>
          <button
            onClick={() => { add(); toast.success("Produto adicionado ao carrinho", { action: { label: "Ver carrinho", onClick: () => navigate({ to: "/carrinho" }) } }); }}
            className="mt-2 flex h-12 w-full items-center justify-center rounded-md bg-ml-blue-soft text-base font-semibold text-ml-blue"
          >
            Adicionar ao carrinho
          </button>

          <div className="mt-6 flex items-center gap-3">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ml-gray">
              <img src="/site/images/logo__small@2x.png" alt="" className="h-8 w-8 object-contain" />
            </div>
            <div className="min-w-0">
              <p>Loja oficial <span className="text-ml-blue">{store?.name || p.seller_name}</span></p>
              <p className="font-semibold">{p.seller_sales}</p>
            </div>
          </div>

          <ul className="mt-6 space-y-4 text-sm text-ml-muted">
            <li className="flex gap-3"><Undo2 className="h-5 w-5 shrink-0" /><span><span className="text-ml-blue">Devolução grátis.</span> Você tem 30 dias a partir da data de recebimento.</span></li>
            <li className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0" /><span><span className="text-ml-blue">Compra Garantida.</span> Receba o produto que está esperando ou devolvemos o dinheiro.</span></li>
            <li className="flex gap-3"><Award className="h-5 w-5 shrink-0" /><span>12 meses de garantia de fábrica.</span></li>
          </ul>
        </section>

        {p.highlights.length > 0 && (
          <section className="mt-8 border-t border-ml-muted/20 px-4 pt-8">
            <h2 className="text-2xl">O que você precisa saber sobre este produto</h2>
            <ul className="mt-4 list-disc space-y-3 pl-5 marker:text-ml-muted/60">
              {p.highlights.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          </section>
        )}

        {p.images.length > 1 && (
          <section className="mt-8 border-t border-ml-muted/20 px-4 pt-8">
            <h2 className="text-2xl">Fotos do produto</h2>
            <div className="mt-4 space-y-4">
              {p.images.slice(1).map((src, i) => <img key={i} src={src} alt="" className="w-full object-contain" />)}
            </div>
          </section>
        )}

        {p.description && (
          <section className="mt-8 border-t border-ml-muted/20 px-4 pt-8">
            <h2 className="text-2xl">Descrição</h2>
            <p className="mt-4 whitespace-pre-line text-ml-muted">{p.description}</p>
          </section>
        )}

        <PaymentMethods />

        {store && <StoreCard s={store} />}

        <section className="mt-8 border-t border-ml-muted/20 px-4 pt-8">
          <h2 className="text-2xl">Opiniões do produto</h2>
          <div className="mt-4 flex items-center gap-4">
            <span className="text-5xl font-light text-ml-blue">{Number(p.rating).toFixed(1)}</span>
            <div>
              <Stars value={Number(p.rating)} className="h-5 w-5" />
              <p className="text-sm text-ml-muted">{p.rating_count} avaliações</p>
            </div>
          </div>
          {reviewImages.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {reviewImages.map((src, i) => <img key={i} src={src} alt="" className="h-20 w-20 shrink-0 rounded-md object-cover" />)}
            </div>
          )}
          <ul className="mt-6 divide-y divide-ml-muted/20">
            {reviews.map((r) => (
              <li key={r.id} className="py-4">
                <div className="flex items-center justify-between">
                  <Stars value={r.rating} />
                  <span className="text-xs text-ml-muted">{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
                <p className="mt-2">{r.comment}</p>
                {r.images.length > 0 && (
                  <div className="mt-2 flex gap-2 overflow-x-auto">
                    {r.images.map((src, i) => <img key={i} src={src} alt="" className="h-20 w-20 shrink-0 rounded-md object-cover" />)}
                  </div>
                )}
                <p className="mt-1 text-xs text-ml-muted">{r.author}</p>
              </li>
            ))}
          </ul>
        </section>

        {related.length > 0 && (
          <section className="mt-6 border-t border-ml-muted/15 pt-5">
            <h2 className="px-4 text-xl">Quem viu este produto também comprou</h2>
            <ul className="mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
              {related.map((r) => {
                const rp = Number(r.price);
                const ro = r.old_price != null ? Number(r.old_price) : null;
                const off = discountPct(rp, ro);
                const c = splitPrice(rp);
                return (
                  <li key={r.id} className="w-40 shrink-0 snap-start">
                    <Link to="/p/$slug" params={{ slug: r.slug }} className="block overflow-hidden rounded-md border border-ml-muted/15 bg-background">
                      <div className="aspect-square bg-ml-gray">
                        <img src={r.images[0]} alt={r.title} loading="lazy" className="h-full w-full object-contain mix-blend-multiply" />
                      </div>
                      <div className="space-y-0.5 p-2.5">
                        <p className="line-clamp-2 text-sm leading-snug">{r.title}</p>
                        {ro && <p className="text-xs text-ml-muted line-through">R$ {brl(ro)}</p>}
                        <p className="text-lg font-light">
                          R$ {c.int}<sup className="text-[10px]">{c.cents}</sup>
                          {off > 0 && <span className="ml-1 text-xs font-normal text-ml-green">{off}% OFF</span>}
                        </p>
                        {r.free_shipping && <p className="text-xs font-semibold text-ml-green">Frete grátis</p>}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className="mt-4 px-4">
          <Link to="/" className="flex items-center justify-between rounded-md border border-ml-muted/20 px-4 py-4 text-ml-blue">
            Ver mais produtos <ChevronRight className="h-5 w-5" />
          </Link>
        </section>
      </main>
      <StoreFooter />
    </div>
  );
}
