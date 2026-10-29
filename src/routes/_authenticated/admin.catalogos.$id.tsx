import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUp, ArrowDown, ExternalLink, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Panel } from "@/components/admin/ui";
import { brl, slugify } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/catalogos/$id")({
  component: CatalogEditor,
});

function CatalogEditor() {
  const { id } = Route.useParams();
  const isNew = id === "novo";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [active, setActive] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products-pick"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, title, price, images, active").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data } = useQuery({
    queryKey: ["admin-catalog", id],
    enabled: !isNew,
    queryFn: async () => {
      const [c, l] = await Promise.all([
        supabase.from("catalogs").select("*").eq("id", id).single(),
        supabase.from("catalog_products").select("product_id, position").eq("catalog_id", id).order("position"),
      ]);
      if (c.error) throw c.error;
      return { catalog: c.data, links: l.data ?? [] };
    },
  });

  useEffect(() => {
    if (!data) return;
    setTitle(data.catalog.title);
    setSlug(data.catalog.slug);
    setActive(data.catalog.active);
    setSlugTouched(true);
    setSelected(data.links.map((l) => l.product_id));
  }, [data]);

  const byId = new Map(products.map((p) => [p.id, p]));
  const toggle = (pid: string) => setSelected((s) => (s.includes(pid) ? s.filter((x) => x !== pid) : [...s, pid]));
  const move = (i: number, d: -1 | 1) => setSelected((s) => {
    const a = [...s]; const j = i + d;
    if (j < 0 || j >= a.length) return s;
    const t = a[i]!; a[i] = a[j]!; a[j] = t; return a;
  });

  async function save() {
    const finalSlug = slugify(slug || title);
    if (!title.trim() || !finalSlug) { toast.error("Informe o nome do catálogo"); return; }
    setSaving(true);
    const payload = { title: title.trim(), slug: finalSlug, active };
    const res = isNew
      ? await supabase.from("catalogs").insert(payload).select("id").single()
      : await supabase.from("catalogs").update(payload).eq("id", id).select("id").single();
    if (res.error) {
      setSaving(false);
      toast.error(res.error.code === "23505" ? "Já existe um catálogo com esse link" : "Erro ao salvar");
      return;
    }
    const cid = res.data.id;
    await supabase.from("catalog_products").delete().eq("catalog_id", cid);
    if (selected.length) {
      const { error } = await supabase.from("catalog_products").insert(selected.map((product_id, position) => ({ catalog_id: cid, product_id, position })));
      if (error) { setSaving(false); toast.error("Erro ao salvar produtos"); return; }
    }
    setSaving(false);
    qc.invalidateQueries({ queryKey: ["admin-catalogs"] });
    qc.invalidateQueries({ queryKey: ["admin-catalog", cid] });
    toast.success("Catálogo salvo");
    if (isNew) navigate({ to: "/admin/catalogos/$id", params: { id: cid }, replace: true });
  }

  async function remove() {
    if (!confirm("Excluir este catálogo? Os produtos não serão apagados.")) return;
    await supabase.from("catalogs").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-catalogs"] });
    navigate({ to: "/admin/catalogos" });
  }

  const filtered = products.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-24">
      <div>
        <Link to="/admin/catalogos" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />Catálogos</Link>
        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h1 className="truncate text-xl font-semibold tracking-tight">{isNew ? "Novo catálogo" : title}</h1>
          {!isNew && <Button variant="outline" size="sm" asChild><a href={`/c/${slugify(slug)}`} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" />Ver na loja</a></Button>}
        </div>
      </div>

      <Panel title="Informações">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="space-y-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Nome (aparece no topo da lista)</span>
            <Input value={title} placeholder="Aro 14" onChange={(e) => { setTitle(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Link</span>
            <Input value={slug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }} />
            <span className="block font-admin-mono text-xs text-muted-foreground">/c/{slugify(slug || title) || "..."}</span>
          </label>
          <label className="flex items-center gap-2 self-center text-sm"><Switch checked={active} onCheckedChange={setActive} />Visível</label>
        </div>
      </Panel>

      <Panel title={`Produtos no catálogo (${selected.length})`} description="A ordem aqui é a ordem na loja.">
        {selected.length === 0 && <p className="text-sm text-muted-foreground">Selecione produtos na lista abaixo.</p>}
        <ul className="divide-y rounded-md border">
          {selected.map((pid, i) => {
            const p = byId.get(pid);
            if (!p) return null;
            return (
              <li key={pid} className="flex items-center gap-3 px-3 py-2">
                <span className="w-5 font-admin-mono text-xs text-muted-foreground">{i + 1}</span>
                <img src={p.images[0]} alt="" className="h-9 w-9 shrink-0 rounded border object-contain" />
                <span className="min-w-0 flex-1 truncate text-sm">{p.title}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggle(pid)}><X className="h-3.5 w-3.5" /></Button>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="Selecionar produtos">
        <div className="flex items-center gap-2 rounded-md border px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto..." className="h-9 border-0 px-0 shadow-none focus-visible:ring-0" />
        </div>
        <ul className="max-h-[28rem] divide-y overflow-y-auto rounded-md border">
          {filtered.map((p) => (
            <li key={p.id}>
              <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/40">
                <Checkbox checked={selected.includes(p.id)} onCheckedChange={() => toggle(p.id)} />
                <img src={p.images[0]} alt="" className="h-10 w-10 shrink-0 rounded border object-contain" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{p.title}</span>
                  <span className="text-xs text-muted-foreground">R$ {brl(Number(p.price))}{!p.active && " · oculto"}</span>
                </span>
              </label>
            </li>
          ))}
          {filtered.length === 0 && <li className="p-4 text-center text-sm text-muted-foreground">Nenhum produto.</li>}
        </ul>
      </Panel>

      <div className="sticky bottom-0 -mx-4 border-t bg-background/90 p-3 backdrop-blur md:-mx-8">
        <div className="mx-auto flex max-w-4xl justify-between gap-2">
          {!isNew ? <Button variant="ghost" className="text-destructive" onClick={remove}><Trash2 className="h-4 w-4" />Excluir</Button> : <span />}
          <Button size="sm" disabled={saving} onClick={save}>{saving ? "Salvando..." : "Salvar catálogo"}</Button>
        </div>
      </div>
    </div>
  );
}
