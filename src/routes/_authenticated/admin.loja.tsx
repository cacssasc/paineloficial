import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Panel } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/loja")({
  component: StoreSettings,
});

const empty = { name: "", logo_url: "", banner_url: "", followers: "", products_label: "", sales_label: "" };
type F = typeof empty;

function StoreSettings() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [f, setF] = useState<F>(empty);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setF({ name: data.name, logo_url: data.logo_url, banner_url: data.banner_url, followers: data.followers, products_label: data.products_label, sales_label: data.sales_label }); }, [data]);
  const set = (k: keyof F) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function save(): Promise<void> {
    if (!f.name.trim()) { toast.error("Informe o nome da loja"); return; }
    setBusy(true);
    const { error } = await supabase.from("store_settings").upsert({ id: 1, ...f, name: f.name.trim(), updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) { toast.error("Não foi possível salvar"); return; }
    qc.invalidateQueries({ queryKey: ["store-settings"] });
    toast.success("Loja atualizada");
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Loja" description="Nome, logo e capa exibidos na página de cada produto." actions={<Button size="sm" disabled={busy} onClick={save}>{busy ? "Salvando..." : "Salvar"}</Button>} />
      <div className="space-y-4">
        <Panel title="Identidade">
          <div className="space-y-1.5"><Label>Nome da loja</Label><Input value={f.name} onChange={set("name")} maxLength={80} /></div>
          <div className="space-y-1.5"><Label>Logo (URL da imagem)</Label><Input value={f.logo_url} onChange={set("logo_url")} placeholder="https://..." /></div>
          <div className="space-y-1.5"><Label>Capa / banner (URL da imagem)</Label><Input value={f.banner_url} onChange={set("banner_url")} placeholder="https://..." /></div>
        </Panel>
        <Panel title="Números exibidos">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5"><Label>Seguidores</Label><Input value={f.followers} onChange={set("followers")} maxLength={20} /></div>
            <div className="space-y-1.5"><Label>Produtos</Label><Input value={f.products_label} onChange={set("products_label")} maxLength={20} /></div>
            <div className="space-y-1.5"><Label>Vendas</Label><Input value={f.sales_label} onChange={set("sales_label")} maxLength={20} /></div>
          </div>
        </Panel>
        <Panel title="Prévia">
          <div className="overflow-hidden rounded-lg border">
            <div className="h-24 bg-muted bg-cover bg-center" style={f.banner_url ? { backgroundImage: `url(${f.banner_url})` } : undefined} />
            <div className="flex items-center gap-3 p-3">
              <div className="-mt-10 h-16 w-16 overflow-hidden rounded-full border-2 border-background bg-muted">
                {f.logo_url && <img src={f.logo_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <p className="font-medium">{f.name || "Nome da loja"}</p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
