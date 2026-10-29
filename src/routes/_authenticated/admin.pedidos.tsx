import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { PageHeader, Stat, Tag } from "@/components/admin/ui";
import { PAYMENT_LABELS, type PaymentMethod } from "@/lib/payment";
import { brl } from "@/lib/format";
import { pickUtms } from "@/lib/utm";

type Status = Database["public"]["Enums"]["order_status"];
const labels: Record<Status, string> = { gerado: "Gerado", pago: "Pago", recusado: "Recusado" };
const tones = { gerado: "blue", pago: "green", recusado: "red" } as const;

export const Route = createFileRoute("/_authenticated/admin/pedidos")({
  head: () => ({ meta: [
    { title: "Pedidos e campanhas | Painel da loja" },
    { name: "description", content: "Gerencie pedidos, pagamentos e a origem das campanhas da sua loja." },
    { property: "og:title", content: "Pedidos e campanhas | Painel da loja" },
    { property: "og:description", content: "Gerencie pedidos, pagamentos e a origem das campanhas da sua loja." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: Orders,
});

function Orders() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Status | "todos">("todos");
  const [open, setOpen] = useState<string | null>(null);
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function setStatus(id: string, status: Status) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error("Não foi possível atualizar"); return; }
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  }

  const count = (s: Status) => data.filter((o) => o.status === s).length;
  const paidTotal = data.filter((o) => o.status === "pago").reduce((a, o) => a + Number(o.total), 0);
  const list = filter === "todos" ? data : data.filter((o) => o.status === filter);

  return (
    <div>
      <PageHeader title="Pedidos" description="Pedidos gerados, pagos e recusados, com os dados de entrega." />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Gerados" value={count("gerado")} />
        <Stat label="Pagos" value={count("pago")} />
        <Stat label="Recusados" value={count("recusado")} />
        <Stat label="Receita paga" value={`R$ ${brl(paidTotal)}`} />
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="flex gap-1 overflow-x-auto border-b p-1.5">
          {(["todos", "gerado", "pago", "recusado"] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors ${filter === s ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {s === "todos" ? "Todos" : labels[s]}
              <span className="ml-1.5 font-admin-mono text-xs text-muted-foreground">{s === "todos" ? data.length : count(s)}</span>
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Pedido</th>
                <th className="px-4 py-2.5 font-medium">Cliente</th>
                <th className="hidden px-4 py-2.5 font-medium md:table-cell">Produto</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Total</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((o) => (
                <Fragment key={o.id}>
                  <tr onClick={() => setOpen(open === o.id ? null : o.id)} className="cursor-pointer transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <p className="font-admin-mono text-xs font-medium">#{o.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-[12rem] truncate font-medium">{o.customer_name}</p>
                      <p className="max-w-[12rem] truncate text-xs text-muted-foreground">{o.email}</p>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <p className="max-w-[16rem] truncate">{o.product_title}</p>
                      <p className="text-xs text-muted-foreground">{o.variant_name ? `${o.variant_name} · ` : ""}{o.quantity} un.</p>
                    </td>
                    <td className="px-4 py-3"><Tag tone={tones[o.status]}>{labels[o.status]}</Tag></td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">R$ {brl(Number(o.total))}</td>
                    <td className="pr-3"><ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open === o.id ? "rotate-180" : ""}`} /></td>
                  </tr>
                  {open === o.id && (
                    <tr className="bg-muted/20">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="space-y-0.5">
                            <p className="mb-1 text-xs font-medium text-muted-foreground">Cliente</p>
                            <p>{o.customer_name}</p>
                            <p>{o.email}</p>
                            {o.phone && <p>{o.phone}</p>}
                            {o.cpf && <p className="font-admin-mono text-xs">CPF {o.cpf}</p>}
                            <p className="pt-1 text-xs text-muted-foreground">Pagamento: {PAYMENT_LABELS[o.payment_method as PaymentMethod]}</p>
                            <div className="pt-2">
                              <p className="mb-1 text-xs font-medium text-muted-foreground">Origem da campanha</p>
                              {Object.keys(pickUtms((o.utm_parameters ?? {}) as Record<string, unknown>)).length ? (
                                <dl className="space-y-1 text-xs">
                                  {Object.entries(pickUtms((o.utm_parameters ?? {}) as Record<string, unknown>)).map(([key, value]) => (
                                    <div key={key}><dt className="text-muted-foreground">{key}</dt><dd className="break-all">{value}</dd></div>
                                  ))}
                                </dl>
                              ) : <p className="text-xs text-muted-foreground">Sem UTM registrada</p>}
                            </div>
                            {Array.isArray(o.items) && o.items.length > 1 && (
                              <div className="pt-2">
                                <p className="mb-1 text-xs font-medium text-muted-foreground">Itens</p>
                                {(o.items as { title: string; variant_name: string | null; quantity: number }[]).map((it, k) => (
                                  <p key={k} className="text-xs">{it.quantity}× {it.title}{it.variant_name ? ` · ${it.variant_name}` : ""}</p>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <p className="mb-1 text-xs font-medium text-muted-foreground">Endereço</p>
                            <p>{o.street}, {o.number}{o.complement ? ` - ${o.complement}` : ""}</p>
                            <p>{o.neighborhood}</p>
                            <p>{o.city}/{o.state} · <span className="font-admin-mono text-xs">CEP {o.cep}</span></p>
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-medium text-muted-foreground">Alterar status</p>
                            <div className="inline-flex rounded-md border p-0.5">
                              {(["gerado", "pago", "recusado"] as const).map((s) => (
                                <button key={s} onClick={() => setStatus(o.id, s)} className={`rounded px-2.5 py-1 text-xs transition-colors ${o.status === s ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>{labels[s]}</button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {isLoading && <p className="p-6 text-center text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && list.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nenhum pedido.</p>}
      </div>
    </div>
  );
}
