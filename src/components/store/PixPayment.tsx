import { Banknote, Info, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/format";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function PixPayment({ orderId, total, code, expiresAt }: { orderId: string; total?: number | undefined; code?: string; expiresAt?: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const remaining = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / 1000)) : null;
  const expired = remaining === 0;
  async function copy() {
    if (!code || expired) return;
    try { await navigator.clipboard.writeText(code); toast.success("Código Pix copiado"); }
    catch { toast.error("Não foi possível copiar. Selecione o código para copiá-lo."); }
  }
  return (
    <div className="min-h-screen bg-ml-gray font-ml text-ml-text">
      <main className="mx-auto max-w-xl px-4 pb-10 pt-4">
        <div className="mb-10 flex justify-end"><Button asChild variant="ghost" size="icon" className="text-ml-muted"><Link to="/" aria-label="Voltar à loja"><X className="size-6!" /></Link></Button></div>
        <section className="relative rounded-md bg-background pt-10 text-center">
          <div className="absolute -top-8 left-1/2 grid size-16 -translate-x-1/2 place-items-center rounded-full border-4 border-ml-green bg-background text-ml-green"><Banknote className="size-9" /></div>
          <p className="px-4 text-base text-ml-muted">Falta só um passo!</p>
          <h1 className="px-5 pb-5 pt-2 text-2xl font-semibold leading-snug">{total != null ? `Pague R$ ${brl(total)} via Pix para garantir sua compra` : "Pague via Pix para garantir sua compra"}</h1>
          <div className="flex min-h-12 flex-wrap items-center justify-center gap-2 rounded-b-md bg-ml-yellow px-3 py-2 text-sm font-semibold" aria-live="polite">
            {remaining != null ? <>{expired ? "Seu código Pix expirou" : <>Seu código vence em minutos! <span className="rounded-sm bg-background px-2 py-1 tabular-nums">{String(Math.floor(remaining / 60)).padStart(2, "0")}</span>:<span className="rounded-sm bg-background px-2 py-1 tabular-nums">{String(remaining % 60).padStart(2, "0")}</span></>}</> : "Aguardando a geração do código Pix"}
          </div>
        </section>
        <section className="mt-4 rounded-md border border-ml-muted/15 bg-background">
          <h2 className="border-b border-ml-muted/20 px-4 py-4 text-xl font-semibold">Instruções de pagamento</h2>
          <div className="space-y-4 p-4">
            <ol className="list-decimal space-y-3 pl-6 text-base"><li className="pl-1">Acesse seu Internet Banking ou app de pagamentos.</li><li className="pl-1">Escolha pagar via Pix.</li><li className="pl-1">Cole o código abaixo.</li></ol>
            <div className="flex min-h-14 items-center gap-2 rounded-md border border-ml-muted/25 px-3">
              <span className="min-w-0 flex-1 truncate select-all text-ml-muted">{code || "Código Pix ainda não disponível"}</span>
              <Button variant="ghost" disabled={!code || expired} onClick={copy} className="shrink-0 text-ml-blue hover:text-ml-blue">Copiar</Button>
            </div>
            <div className="flex gap-3 rounded-md border-l-4 border-ml-blue bg-ml-gray p-4"><Info className="mt-0.5 size-5 shrink-0 text-ml-blue" /><p className="text-sm">Confirmaremos a data de entrega quando o pagamento for aprovado.</p></div>
            <Button disabled={!code || expired} onClick={copy} className="h-12 w-full bg-ml-blue text-base text-background hover:bg-ml-blue/90">Copiar código</Button>
            <Button asChild variant="ghost" className="h-12 w-full text-base text-ml-blue hover:text-ml-blue"><Link to="/pedido/$id" params={{ id: orderId }}>Ver meu pedido</Link></Button>
          </div>
        </section>
      </main>
    </div>
  );
}