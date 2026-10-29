import { BadgeCheck, Medal, MessageSquareText, Timer } from "lucide-react";
import { PAYMENT_BRANDS } from "@/lib/payment-brands";

export type StoreInfo = { name: string; logo_url: string; banner_url: string; followers: string; products_label: string; sales_label: string };

export function StoreCard({ s }: { s: StoreInfo }) {
  return (
    <section className="mt-8 border-t border-ml-muted/20 px-4 pt-8">
      <div className="overflow-hidden rounded-lg border border-ml-muted/20">
        <div className="relative h-24 bg-ml-text bg-cover bg-center" style={s.banner_url ? { backgroundImage: `url(${s.banner_url})` } : undefined}>
          <div className="absolute -bottom-9 left-3 grid h-[72px] w-[72px] place-items-center overflow-hidden rounded-full border border-ml-muted/20 bg-background shadow-sm">
            {s.logo_url ? <img src={s.logo_url} alt={s.name} className="h-full w-full object-contain" /> : <span className="text-xl font-bold">{s.name.slice(0, 2)}</span>}
          </div>
        </div>
        <div className="px-3 pb-3 pt-11">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xl">{s.name}</p>
            <button className="rounded-md bg-ml-blue-soft px-3 py-1.5 text-sm font-semibold text-ml-blue">Seguir</button>
          </div>
          <p className="flex items-center gap-1 text-sm text-ml-muted">Loja oficial do Mercado Livre <BadgeCheck className="h-4 w-4 fill-ml-blue text-background" /></p>
          <p className="mt-1 text-sm"><b>{s.followers}</b> <span className="text-ml-muted">Seguidores</span> · <b>{s.products_label}</b> <span className="text-ml-muted">Produtos</span></p>
          <p className="mt-4 flex items-center gap-1.5 font-semibold text-ml-green"><Medal className="h-4 w-4" />MercadoLíder Platinum</p>
          <p className="ml-6 text-sm text-ml-muted">É um dos melhores do site!</p>
          <div className="mt-3 grid grid-cols-5 gap-1">
            {["bg-destructive/15", "bg-ml-orange/15", "bg-ml-yellow/30", "bg-ml-green/20", "bg-ml-green"].map((c) => <span key={c} className={`h-1.5 ${c}`} />)}
          </div>
          <div className="mt-4 grid grid-cols-3 text-center text-xs text-ml-muted">
            <div><p className="text-base text-ml-text">{s.sales_label}</p>Vendas</div>
            <div><MessageSquareText className="mx-auto h-5 w-5 text-ml-green" />Bom atendimento</div>
            <div><Timer className="mx-auto h-5 w-5 text-ml-green" />Entrega no prazo</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PaymentMethods() {
  return (
    <section className="mt-8 border-t border-ml-muted/20 px-4 pt-8">
      <h2 className="text-2xl">Meios de pagamento</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {PAYMENT_BRANDS.map((b) => (
          <span key={b.name} className="grid h-10 min-w-[58px] place-items-center rounded border border-ml-muted/20 bg-background px-2.5">
            <img src={b.src} alt={b.name} title={b.name} className="max-h-[22px] w-auto max-w-[80px] object-contain" />
          </span>
        ))}
      </div>
    </section>
  );
}
