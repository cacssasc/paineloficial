import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, ExternalLink, Copy, Search, FileUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Stat, Tag } from "@/components/admin/ui";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/produtos/")({
  component: ProductsList,
});

function ProductsList() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, slug, title, price, old_price, stock, images, active").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const list = data.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Produtos"
        description="Cada produto tem seu próprio link na loja."
        actions={
          <>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/importar"><FileUp className="h-4 w-4" />Importar</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/admin/produtos/$id" params={{ id: "novo" }}><Plus className="h-4 w-4" />Novo produto</Link>
          </Button>
          </>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Total" value={data.length} />
        <Stat label="Visíveis" value={data.filter((p) => p.active).length} />
        <Stat label="Ocultos" value={data.filter((p) => !p.active).length} />
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto..." className="h-8 border-0 px-0 shadow-none focus-visible:ring-0" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Produto</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Preço</th>
                <th className="hidden px-4 py-2.5 text-right font-medium md:table-cell">Estoque</th>
                <th className="w-20 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((p) => (
                <tr key={p.id} onClick={() => navigate({ to: "/admin/produtos/$id", params: { id: p.id } })} className="cursor-pointer transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <img src={p.images[0]} alt="" className="h-10 w-10 shrink-0 rounded-md border bg-background object-contain" />
                      <div className="min-w-0">
                        <p className="max-w-[18rem] truncate font-medium">{p.title}</p>
                        <p className="max-w-[18rem] truncate font-admin-mono text-xs text-muted-foreground">/p/{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.active ? <Tag tone="green">Visível</Tag> : <Tag>Oculto</Tag>}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className="font-medium">R$ {brl(Number(p.price))}</span>
                    {p.old_price && <span className="block text-xs text-muted-foreground line-through">R$ {brl(Number(p.old_price))}</span>}
                  </td>
                  <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground md:table-cell">{p.stock}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Copiar link" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/p/${p.slug}`); toast.success("Link copiado"); }}><Copy className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Abrir na loja"><a href={`/p/${p.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isLoading && <p className="p-6 text-center text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && list.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</p>}
      </div>
    </div>
  );
}
