import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Papa from "papaparse";
import { ArrowLeft, FileUp, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PageHeader, Panel, Tag } from "@/components/admin/ui";
import { parseShopifyRows, type CsvRow, type ImportedProduct } from "@/lib/shopify-import";
import { brl, slugify } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/importar")({
  component: ImportPage,
});

function ImportPage() {
  const qc = useQueryClient();
  const [items, setItems] = useState<ImportedProduct[]>([]);
  const [fileName, setFileName] = useState("");
  const [catalogId, setCatalogId] = useState("");
  const [updateExisting, setUpdateExisting] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ created: number; updated: number; skipped: number } | null>(null);

  const { data: catalogs = [] } = useQuery({
    queryKey: ["admin-catalogs-pick"],
    queryFn: async () => (await supabase.from("catalogs").select("id, title").order("title")).data ?? [],
  });
  const { data: existing = [] } = useQuery({
    queryKey: ["admin-product-slugs"],
    queryFn: async () => (await supabase.from("products").select("id, slug")).data ?? [],
  });
  const existingBySlug = new Map(existing.map((p) => [p.slug, p.id]));

  function onFile(file: File) {
    setDone(null);
    setFileName(file.name);
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const parsed = parseShopifyRows(res.data).map((p) => ({ ...p, slug: slugify(p.slug) || slugify(p.title) }));
        if (!parsed.length) toast.error("Nenhum produto encontrado. Use o formato de exportação do Shopify.");
        setItems(parsed);
      },
      error: () => toast.error("Não foi possível ler o arquivo"),
    });
  }

  async function runImport() {
    setBusy(true);
    let created = 0, updated = 0, skipped = 0;
    let catalogPos = 0;
    if (catalogId) {
      const { count } = await supabase.from("catalog_products").select("*", { count: "exact", head: true }).eq("catalog_id", catalogId);
      catalogPos = count ?? 0;
    }
    for (const it of items) {
      const { variants, ...fields } = it;
      const existingId = existingBySlug.get(it.slug);
      let pid: string | undefined = existingId;
      if (existingId && !updateExisting) { skipped++; }
      else if (existingId) {
        const { error } = await supabase.from("products").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", existingId);
        if (error) { skipped++; continue; }
        updated++;
      } else {
        const { data, error } = await supabase.from("products").insert({ ...fields, best_seller_label: "" }).select("id").single();
        if (error || !data) { skipped++; continue; }
        pid = data.id;
        created++;
      }
      if (!pid) continue;
      if (!existingId || updateExisting) {
        await supabase.from("product_variants").delete().eq("product_id", pid);
        if (variants.length) {
          await supabase.from("product_variants").insert(variants.map((v, i) => ({ ...v, product_id: pid!, position: i })));
        }
      }
      if (catalogId) {
        await supabase.from("catalog_products").upsert({ catalog_id: catalogId, product_id: pid, position: catalogPos++ }, { onConflict: "catalog_id,product_id", ignoreDuplicates: true });
      }
    }
    setBusy(false);
    setDone({ created, updated, skipped });
    setItems([]);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["admin-product-slugs"] });
    qc.invalidateQueries({ queryKey: ["admin-catalogs"] });
  }

  const newCount = items.filter((i) => !existingBySlug.has(i.slug)).length;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <Link to="/admin/produtos" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />Produtos</Link>
      </div>
      <PageHeader title="Importar produtos" description="Envie um arquivo .csv no formato de exportação do Shopify para cadastrar vários produtos de uma vez." />

      {done && (
        <div className="flex items-start gap-3 rounded-lg border border-ml-green/25 bg-ml-green/5 p-4 text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-ml-green" />
          <div>
            <p className="font-medium">Importação concluída</p>
            <p className="text-muted-foreground">{done.created} criados · {done.updated} atualizados · {done.skipped} ignorados</p>
            <Link to="/admin/produtos" className="mt-1 inline-block text-foreground underline underline-offset-4">Ver produtos</Link>
          </div>
        </div>
      )}

      <Panel title="1. Arquivo">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center hover:bg-muted/40">
          <FileUp className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm font-medium">{fileName || "Clique para escolher o arquivo .csv"}</span>
          <span className="text-xs text-muted-foreground">Colunas usadas: Handle, Title, Body (HTML), Type, Variant Price, Variant Compare At Price, Image Src, Option Values, Status</span>
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
        </label>
      </Panel>

      {items.length > 0 && (
        <>
          <Panel title="2. Opções">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-xs font-medium text-muted-foreground">Adicionar também a um catálogo (opcional)</span>
                <select value={catalogId} onChange={(e) => setCatalogId(e.target.value)} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                  <option value="">Nenhum</option>
                  {catalogs.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2 self-end py-2 text-sm">
                <Switch checked={updateExisting} onCheckedChange={setUpdateExisting} />
                Atualizar produtos que já existem (mesmo link)
              </label>
            </div>
          </Panel>

          <Panel title={`3. Conferir (${items.length} produtos · ${newCount} novos)`}>
            <div className="max-h-[28rem] overflow-y-auto rounded-md border">
              <table className="w-full text-sm">
                <tbody className="divide-y">
                  {items.map((p) => (
                    <tr key={p.slug}>
                      <td className="w-14 p-2"><img src={p.images[0]} alt="" className="h-10 w-10 rounded border object-contain" /></td>
                      <td className="p-2">
                        <p className="max-w-[22rem] truncate font-medium">{p.title}</p>
                        <p className="font-admin-mono text-xs text-muted-foreground">/p/{p.slug} · {p.images.length} foto(s){p.variants.length ? ` · ${p.variants.length} variante(s)` : ""}</p>
                      </td>
                      <td className="whitespace-nowrap p-2 text-right tabular-nums">R$ {brl(p.price)}</td>
                      <td className="p-2 text-right">{existingBySlug.has(p.slug) ? <Tag tone="blue">Já existe</Tag> : <Tag tone="green">Novo</Tag>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <Button disabled={busy} onClick={runImport}>{busy ? "Importando..." : `Importar ${items.length} produtos`}</Button>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
