import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PageHeader, Tag } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/catalogos/")({
  component: CatalogList,
});

function CatalogList() {
  const navigate = useNavigate();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-catalogs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("catalogs").select("id, slug, title, active, catalog_products(count)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <PageHeader
        title="Catálogos"
        description="Agrupe produtos em uma página de lista com link próprio."
        actions={<Button asChild size="sm"><Link to="/admin/catalogos/$id" params={{ id: "novo" }}><Plus className="h-4 w-4" />Novo catálogo</Link></Button>}
      />
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Catálogo</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Produtos</th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((c) => (
              <tr key={c.id} onClick={() => navigate({ to: "/admin/catalogos/$id", params: { id: c.id } })} className="cursor-pointer hover:bg-muted/40">
                <td className="px-4 py-3">
                  <p className="font-medium">{c.title}</p>
                  <p className="font-admin-mono text-xs text-muted-foreground">/c/{c.slug}</p>
                </td>
                <td className="px-4 py-3">{c.active ? <Tag tone="green">Visível</Tag> : <Tag>Oculto</Tag>}</td>
                <td className="px-4 py-3 text-right tabular-nums">{c.catalog_products[0]?.count ?? 0}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Copiar link" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/c/${c.slug}`); toast.success("Link copiado"); }}><Copy className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild><a href={`/c/${c.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <p className="p-6 text-center text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && data.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nenhum catálogo ainda.</p>}
      </div>
    </div>
  );
}
