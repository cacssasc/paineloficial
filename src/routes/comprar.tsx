import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, MapPin, ChevronRight, Plus, Zap, Briefcase, Home, CreditCard } from "lucide-react";
import { createOrder } from "@/lib/store.functions";
import { useCart, clearCart } from "@/lib/cart";
import { Price } from "@/components/store/Price";
import { type PaymentMethod } from "@/lib/payment";
import { SecureCardFields, type ConfirmCard } from "@/components/store/SecureCardFields";
import { getOrderPayment } from "@/lib/stripe.functions";
import { Button } from "@/components/ui/button";
import pixAsset from "@/assets/pix.png.asset.json";
import { captureVisitUtms } from "@/lib/utm";

export const Route = createFileRoute("/comprar")({
  head: () => ({
    meta: [
      { title: "Finalize sua compra | Mercado Livre" },
      { name: "description", content: "Informe seu endereço de entrega e finalize a compra." },
      { property: "og:title", content: "Finalize sua compra | Mercado Livre" },
      { property: "og:description", content: "Informe seu endereço de entrega e finalize a compra." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

type Form = {
  customer_name: string; email: string; cpf: string; phone: string; cep: string; state: string;
  city: string; neighborhood: string; street: string; number: string; complement: string; info: string;
};
const empty: Form = { customer_name: "", email: "", cpf: "", phone: "", cep: "", state: "", city: "", neighborhood: "", street: "", number: "", complement: "", info: "" };

function mask(name: keyof Form, value: string) {
  let d = value.replace(/\D/g, "");
  if (name === "cep") { d = d.slice(0, 8); return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d; }
  if (name === "cpf") {
    d = d.slice(0, 11);
    return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  if (name === "phone") {
    d = d.slice(0, 11);
    if (d.length <= 2) return d;
    return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  }
  if (name === "state") return value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
  return value;
}

const radio = (on: boolean) => (
  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 bg-background ${on ? "border-ml-blue" : "border-ml-muted/50"}`}>
    {on && <span className="h-2 w-2 rounded-full bg-ml-blue" />}
  </span>
);

function PayOption({ on, onClick, icon, title, note, noteClass = "text-ml-muted" }: {
  on: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  note: string;
  noteClass?: string;
}) {
  return (
    <Button type="button" variant="ghost" aria-pressed={on} onClick={onClick} className="flex h-auto w-full justify-start gap-3 whitespace-normal rounded-none px-4 py-4 text-left font-normal hover:bg-ml-gray">
      {radio(on)}
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ml-gray">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[15px] font-medium leading-tight">{title}</span>
        <span className={`mt-1 block text-sm ${noteClass}`}>{note}</span>
      </span>
    </Button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block px-3 text-[15px]">{label}</span>
      {children}
    </label>
  );
}
const inputCls = "h-14 w-full rounded-md border border-ml-muted/40 bg-background px-4 text-base outline-none focus:border-ml-blue focus:ring-1 focus:ring-ml-blue";

function Checkout() {
  const items = useCart();
  const navigate = useNavigate();
  const router = useRouter();
  const submit = useServerFn(createOrder);
  const readPayment = useServerFn(getOrderPayment);
  const confirmCard = useRef<ConfirmCard | null>(null);
  const [cardReady, setCardReady] = useState(false);
  const onConfirmReady = useCallback((confirm: ConfirmCard | null) => { confirmCard.current = confirm; setCardReady(Boolean(confirm)); }, []);
  const checkoutAttempt = useRef<{ id: string; token: string; method: PaymentMethod } | null>(null);
  const qty = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const old = items.reduce((s, i) => s + Math.max(i.oldPrice ?? 0, i.unitPrice) * i.qty, 0);
  const installments = 10;

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [address, setAddress] = useState<Form | null>(null);
  const [noNumber, setNoNumber] = useState(false);
  const [kind, setKind] = useState<"trabalho" | "casa" | null>(null);
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("pix");

  useEffect(() => { const t = setTimeout(() => setLoading(false), 1800); return () => clearTimeout(t); }, []);

  async function onChange(name: keyof Form, raw: string) {
    const value = mask(name, raw);
    setForm((f) => ({ ...f, [name]: value }));
    if (name === "cep" && value.replace(/\D/g, "").length === 8) {
      try {
        const r = await fetch(`https://viacep.com.br/ws/${value.replace(/\D/g, "")}/json/`).then((x) => x.json());
        if (!r.erro) setForm((f) => ({ ...f, state: r.uf || f.state, city: r.localidade || f.city, neighborhood: r.bairro || f.neighborhood, street: r.logradouro || f.street }));
      } catch { /* manual entry still works */ }
    }
  }

  function saveAddress(e: React.FormEvent) {
    e.preventDefault();
    const f = { ...form, number: noNumber ? "S/N" : form.number };
    const ok = z.object({
      customer_name: z.string().trim().min(2), email: z.string().trim().email(), cep: z.string().regex(/^\d{5}-\d{3}$/),
      state: z.string().length(2), city: z.string().trim().min(2), neighborhood: z.string().trim().min(2),
      street: z.string().trim().min(2), number: z.string().trim().min(1),
    }).safeParse(f);
    if (!ok.success) { toast.error("Preencha todos os campos obrigatórios."); return; }
    setAddress(f);
    setEditing(false);
    window.scrollTo(0, 0);
  }

  async function pay() {
    if (!address) { setEditing(true); return; }
    if (busy || (method === "cartao" && !confirmCard.current)) return;
    setBusy(true);
    try {
      const complement = [address.complement, kind === "trabalho" ? "Trabalho" : kind === "casa" ? "Residencial" : "", address.info].filter(Boolean).join(" · ").slice(0, 100);
      if (!checkoutAttempt.current || checkoutAttempt.current.method !== method) {
        checkoutAttempt.current = { id: crypto.randomUUID(), token: crypto.randomUUID(), method };
      }
      const attempt = checkoutAttempt.current;
      const res = await submit({ data: {
        checkoutId: attempt.id, checkoutToken: attempt.token,
        items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.qty })),
        customer_name: address.customer_name, email: address.email, phone: address.phone, cpf: address.cpf,
        cep: address.cep, street: address.street, number: address.number, complement,
        neighborhood: address.neighborhood, city: address.city, state: address.state,
        payment_method: method,
        utm_parameters: captureVisitUtms(window.location.search),
      } });
      sessionStorage.setItem(`order-access:${res.id}`, res.token);
      if (method === "cartao") {
        if (!res.clientSecret || !confirmCard.current) throw new Error("Não foi possível abrir o pagamento.");
        await confirmCard.current(res.clientSecret, { name: address.customer_name, email: address.email });
      }
      await readPayment({ data: { id: res.id, token: res.token } });
      clearCart();
      navigate({ to: method === "pix" ? "/pix/$id" : "/obrigado/$id", params: { id: res.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível finalizar. Confira seus dados.");
      setBusy(false);
    }
  }

  if (!loading && !busy && items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background font-ml text-ml-text">
        <p>Seu carrinho está vazio</p>
        <Link to="/" className="text-ml-blue">Descobrir produtos</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background font-ml text-ml-text">
        <h1 className="mb-8 px-8 text-center text-xl">Preparando tudo para<br />sua compra</h1>
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-ml-blue border-r-transparent" />
      </div>
    );
  }

  if (editing) {
    return (
      <div className="min-h-screen bg-background pb-10 font-ml text-ml-text">
        <header className="sticky top-0 z-20 flex items-center bg-ml-yellow px-4 py-5">
          <button aria-label="Voltar" onClick={() => setEditing(false)}><ArrowLeft className="h-6 w-6 text-ml-muted" /></button>
          <h1 className="flex-1 pr-6 text-center text-lg">Adicione um endereço</h1>
        </header>
        <form onSubmit={saveAddress} className="mx-auto max-w-xl space-y-7 p-4 pt-6">
          <Field label="Nome completo"><input className={inputCls} value={form.customer_name} onChange={(e) => onChange("customer_name", e.target.value)} maxLength={120} /></Field>
          <Field label="E-mail"><input type="email" className={inputCls} value={form.email} onChange={(e) => onChange("email", e.target.value)} maxLength={200} /></Field>
          <Field label="CPF"><input inputMode="numeric" className={inputCls} value={form.cpf} onChange={(e) => onChange("cpf", e.target.value)} placeholder="000.000.000-00" /></Field>
          <Field label="CEP"><input inputMode="numeric" className={inputCls} value={form.cep} onChange={(e) => onChange("cep", e.target.value)} placeholder="00000-000" /></Field>
          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <Field label="Estado"><input className={inputCls} value={form.state} onChange={(e) => onChange("state", e.target.value)} /></Field>
            <Field label="Cidade"><input className={inputCls} value={form.city} onChange={(e) => onChange("city", e.target.value)} maxLength={100} /></Field>
          </div>
          <Field label="Bairro"><input className={inputCls} value={form.neighborhood} onChange={(e) => onChange("neighborhood", e.target.value)} maxLength={100} /></Field>
          <Field label="Rua/Avenida"><input className={inputCls} value={form.street} onChange={(e) => onChange("street", e.target.value)} maxLength={200} /></Field>
          <Field label="Número">
            <div className={`${inputCls} flex items-center gap-3`}>
              <input disabled={noNumber} className="h-full min-w-0 flex-1 bg-transparent outline-none disabled:opacity-40" value={noNumber ? "" : form.number} onChange={(e) => onChange("number", e.target.value)} maxLength={20} />
              <span className="flex items-center gap-3 whitespace-nowrap" onClick={(e) => e.preventDefault()}>
                <button type="button" onClick={() => setNoNumber(!noNumber)} className="flex items-center gap-3">
                  Sem número
                  <span className={`grid h-6 w-6 place-items-center rounded border-2 ${noNumber ? "border-ml-blue bg-ml-blue text-background" : "border-ml-muted/50"}`}>{noNumber && "✓"}</span>
                </button>
              </span>
            </div>
          </Field>
          <Field label="Complemento (opcional)"><input className={inputCls} value={form.complement} onChange={(e) => onChange("complement", e.target.value)} maxLength={60} /></Field>
          <div>
            <p className="mb-4 px-3 text-[15px]">Este é o seu trabalho ou sua casa?</p>
            <div className="flex gap-10 px-3 text-lg">
              <button type="button" onClick={() => setKind("trabalho")} className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-ml-muted/50">{kind === "trabalho" && <span className="h-3 w-3 rounded-full bg-ml-blue" />}</span>
                <Briefcase className="h-5 w-5" /> Trabalho
              </button>
              <button type="button" onClick={() => setKind("casa")} className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-ml-muted/50">{kind === "casa" && <span className="h-3 w-3 rounded-full bg-ml-blue" />}</span>
                <Home className="h-5 w-5" /> Residencial
              </button>
            </div>
          </div>
          <Field label="Telefone / WhatsApp"><input inputMode="tel" className={inputCls} value={form.phone} onChange={(e) => onChange("phone", e.target.value)} placeholder="(99) 999999999" /></Field>
          <div>
            <p className="mb-3 font-semibold">Informações adicionais deste endereço (opcional)</p>
            <textarea rows={3} maxLength={128} value={form.info} onChange={(e) => onChange("info", e.target.value)} placeholder="Descrição da fachada, pontos de referência, informações de segurança etc." className="w-full resize-none rounded-md border border-ml-muted/40 bg-background p-4 text-base outline-none focus:border-ml-blue" />
            <p className="text-right text-sm text-ml-muted">{form.info.length} / 128</p>
          </div>
          <button className="h-14 w-full rounded-md bg-ml-blue text-lg text-background">Continuar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ml-gray pb-28 font-ml text-ml-text">
      <header className="sticky top-0 z-20 flex items-center bg-ml-yellow px-4 py-4">
        <button aria-label="Voltar" onClick={() => router.history.back()} className="mr-4"><ArrowLeft className="h-6 w-6" /></button>
        <h1 className="text-lg">Finalize sua compra</h1>
      </header>
      <main className="mx-auto flex max-w-xl flex-col gap-2">
        <section className="space-y-4 bg-background p-4">
          {items.map((it) => (
            <div key={`${it.productId}-${it.variantId}`} className="flex gap-4">
              <img src={it.image} alt="" className="h-14 w-14 shrink-0 rounded border border-ml-muted/20 object-contain" />
              <div className="min-w-0">
                <h2 className="line-clamp-2 text-[15px] leading-tight">{it.title}</h2>
                <p className="text-sm text-ml-muted">{it.variantName ? `${it.variantName} · ` : ""}{it.qty} un.</p>
              </div>
            </div>
          ))}
        </section>

        <section className="bg-background p-4">
          <h3 className="mb-3 text-[17px] font-semibold">Forma de entrega</h3>
          <div className="rounded-lg border border-ml-muted/20 p-4">
            {address ? (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-ml-blue" />
                <div>
                  <p className="text-[15px] font-medium leading-snug">
                    {address.street}, {address.number}{address.complement && ` - ${address.complement}`}<br />
                    {address.neighborhood} - {address.city}/{address.state}<br />CEP {address.cep}
                  </p>
                  <p className="mt-1 text-sm text-ml-muted">{address.customer_name}{address.phone && ` - ${address.phone}`}</p>
                  <button onClick={() => { setForm(address); setEditing(true); }} className="mt-3 text-[15px] font-medium text-ml-blue">Alterar endereço</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-2 text-center">
                <MapPin className="mb-2 h-8 w-8 text-ml-muted/50" />
                <p className="mb-3 text-[15px] font-medium">Você ainda não adicionou um endereço</p>
                <button onClick={() => setEditing(true)} className="flex items-center gap-2 text-[15px] font-semibold text-ml-blue"><Plus className="h-5 w-5" />Adicionar endereço de entrega</button>
              </div>
            )}
          </div>
        </section>

        {address && (
          <section className="bg-background p-4">
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-[15px] font-medium">Envio 1</h3>
              <span className="flex items-center font-black italic text-ml-green"><Zap className="mr-0.5 h-4 w-4 fill-ml-green" />FULL</span>
            </div>
            <div className="flex items-center gap-3">
              {radio(true)}
              <div className="flex-1">
                <div className="flex justify-between"><p className="font-medium">Chegará em até 7 dias úteis</p><span className="font-bold text-ml-green">Grátis</span></div>
                <p className="text-sm text-ml-muted">Única opção disponível</p>
              </div>
            </div>
          </section>
        )}

        <section className="bg-background p-4">
          <h3 className="mb-3 text-[17px] font-semibold">Meios de pagamento</h3>
          <div className="divide-y divide-ml-muted/20 overflow-hidden rounded-lg border border-ml-muted/20">
            <PayOption
              on={method === "pix"}
              onClick={() => setMethod("pix")}
              icon={<img src={pixAsset.url} alt="" className="h-6 w-6 object-contain" />}
              title="Pix"
              note="Aprovação imediata"
            />
            <PayOption
              on={method === "cartao"}
              onClick={() => setMethod("cartao")}
              icon={<CreditCard className="h-5 w-5 text-ml-blue" />}
              title="Novo cartão de crédito"
              note={`Até ${installments} parcelas sem juros`}
              noteClass="text-ml-green"
            />
            {method === "cartao" && <SecureCardFields onConfirmReady={onConfirmReady} />}
          </div>
        </section>

        <button onClick={() => { if (address) setForm(address); setEditing(true); }} className="flex items-center justify-between bg-background p-4 text-left">
          <div>
            <h3 className="mb-3 text-[17px] font-semibold">Faturamento</h3>
            <p className="text-[15px]">{address?.customer_name || "Preencher"}{address?.cpf ? ` - CPF ${address.cpf}` : ""}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-ml-muted" />
        </button>

        <section className="bg-background p-4">
          <h3 className="mb-4 text-[17px] font-semibold">Resumo da compra</h3>
          <div className="space-y-2 text-[15px]">
            <div className="flex justify-between"><span>Produtos ({qty})</span><Price value={old > total ? old : total} /></div>
            {old > total && <div className="flex justify-between"><span>Desconto</span><span className="text-ml-green">- <Price value={old - total} /></span></div>}
            <div className="flex justify-between"><span>Frete</span><span className="text-ml-green">Grátis</span></div>
          </div>
          <div className="mt-3 flex items-end justify-between border-t border-ml-muted/20 pt-4">
            <span className="text-[17px] font-semibold">Total</span>
            <Price value={total} className="text-2xl font-semibold" />
          </div>
        </section>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ml-muted/20 bg-background p-4">
        <Button disabled={busy || (method === "cartao" && Boolean(address) && !cardReady)} onClick={pay} className="mx-auto flex h-12 w-full max-w-xl rounded-md bg-ml-blue font-semibold text-background hover:bg-ml-blue disabled:opacity-60">
          {busy ? "Finalizando..." : !address ? "Adicionar endereço" : "Pagar e finalizar"}
        </Button>
      </div>
    </div>
  );
}
