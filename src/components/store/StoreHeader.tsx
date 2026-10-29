import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { MapPin, Menu, Search, ShoppingCart, ChevronRight } from "lucide-react";
import { listProducts } from "@/lib/store.functions";
import { useCart } from "@/lib/cart";
import { searchProducts } from "@/lib/search";
import { brl } from "@/lib/format";
import { withRetry } from "@/lib/retry";

type Hit = Awaited<ReturnType<typeof listProducts>>[number];
let catalogCache: Promise<Hit[]> | null = null;

function SearchBox() {
  const fetchAll = useServerFn(listProducts);
  const navigate = useNavigate();
  const [all, setAll] = useState<Hit[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const hits = searchProducts(all, q).slice(0, 8);

  const load = () => {
    catalogCache ??= withRetry(() => fetchAll()).catch((e) => { catalogCache = null; throw e; });
    catalogCache.then(setAll).catch(() => {});
  };
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const go = (slug: string) => { setOpen(false); setQ(""); navigate({ to: "/p/$slug", params: { slug } }); };

  return (
    <div ref={box} className="relative min-w-0 flex-1">
      <form
        onSubmit={(e) => { e.preventDefault(); if (hits[0]) go(hits[0].slug); }}
        className="flex h-9 items-center gap-2 rounded-sm bg-background px-3 shadow-sm"
      >
        <Search className="h-4 w-4 shrink-0 text-ml-muted" />
        <input
          value={q}
          onFocus={() => { load(); setOpen(true); }}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          placeholder="Estou buscando..."
          aria-label="Buscar produtos"
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-ml-text outline-none placeholder:text-ml-muted"
        />
      </form>
      {open && q.trim() && (
        <div className="absolute inset-x-0 top-10 z-50 max-h-[70vh] overflow-y-auto rounded-sm bg-background shadow-lg">
          {hits.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ml-muted">Nenhum produto encontrado</p>
          ) : (
            hits.map((h) => (
              <button key={h.id} type="button" onClick={() => go(h.slug)} className="flex w-full items-center gap-3 border-b border-ml-muted/10 px-3 py-2 text-left hover:bg-ml-gray">
                <img src={h.images[0]} alt="" className="h-10 w-10 shrink-0 object-contain" />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 text-sm text-ml-text">{h.title}</span>
                  <span className="text-sm font-semibold text-ml-text">{brl(Number(h.price))}</span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function StoreHeader() {
  const count = useCart().reduce((s, i) => s + i.qty, 0);
  return (
    <header className="relative z-40 bg-ml-yellow font-ml">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-3 py-2">
        <Link to="/" className="shrink-0">
          <img src="/site/images/logo__small@2x.png" alt="Mercado Livre" className="h-9 w-11 object-contain" />
        </Link>
        <SearchBox />
        <Menu className="h-6 w-6 shrink-0 text-ml-text" strokeWidth={1.5} />
        <Link to="/carrinho" aria-label="Carrinho" className="relative shrink-0">
          <ShoppingCart className="h-6 w-6 text-ml-text" strokeWidth={1.5} />
          {count > 0 && (
            <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-ml-blue px-1 text-[10px] font-semibold text-background">{count}</span>
          )}
        </Link>
      </div>
      <div className="mx-auto flex max-w-5xl items-center gap-2 border-t border-ml-text/10 px-3 py-2 text-sm text-ml-text/80">
        <MapPin className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">Informe seu CEP</span>
        <ChevronRight className="h-4 w-4 shrink-0" />
      </div>
    </header>
  );
}

export function Stars({ value, className = "h-3.5 w-3.5" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-ml-blue">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className={className} aria-hidden>
          <defs>
            <linearGradient id={`g${i}-${value}`}>
              <stop offset={`${Math.max(0, Math.min(1, value - i + 1)) * 100}%`} stopColor="currentColor" />
              <stop offset="0" stopColor="currentColor" stopOpacity="0.25" />
            </linearGradient>
          </defs>
          <path
            fill={`url(#g${i}-${value})`}
            d="M12 2l2.9 6.9L22 9.6l-5.5 4.8L18.2 22 12 18.3 5.8 22l1.7-7.6L2 9.6l7.1-.7z"
          />
        </svg>
      ))}
    </span>
  );
}
