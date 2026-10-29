import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowUp, Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { slugify } from "@/lib/format";
import { Panel } from "@/components/admin/ui";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductForm = Omit<ProductRow, "id" | "created_at" | "updated_at">;
type Variant = { name: string; price: string; image_url: string };
type Review = { author: string; rating: number; comment: string; images: string[]; created_at?: string };

const empty: ProductForm = {
  slug: "", title: "", brand_line: "Conferir mais produtos de Mercado Livre", condition: "Novo", sold_label: "+100 vendidos",
  rating: 4.8, rating_count: 0, best_seller: true, best_seller_label: "", offer_of_day: true, price: 0, old_price: null,
  installments: 10, free_shipping: true, stock: 50, seller_name: "Mercado Livre", seller_sales: "+500 mil vendas",
  highlights: [], description: "", images: [], active: true, subtitle: "",
};

export const Route = createFileRoute("/_authenticated/admin/produtos/$id")({
  component: Editor,
});

function Editor() {
  const { id } = Route.useParams();
  const isNew = id === "novo";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [p, setP] = useState<ProductForm>(empty);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-product", id],
    enabled: !isNew,
    queryFn: async () => {
      const [pr, vr, rr] = await Promise.all([
        supabase.from("products").select("*").eq("id", id).single(),
        supabase.from("product_variants").select("*").eq("product_id", id).order("position"),
        supabase.from("reviews").select("*").eq("product_id", id).order("created_at", { ascending: false }),
      ]);
      if (pr.error) throw pr.error;
      return { product: pr.data, variants: vr.data ?? [], reviews: rr.data ?? [] };
    },
  });

  useEffect(() => {
    if (!data) return;
    const { id: _i, created_at: _c, updated_at: _u, ...rest } = data.product;
    setP(rest);
    setSlugTouched(true);
    setVariants(data.variants.map((v) => ({ name: v.name, price: v.price != null ? String(v.price) : "", image_url: v.image_url ?? "" })));
    setReviews(data.reviews.map((r) => ({ author: r.author, rating: r.rating, comment: r.comment, images: r.images, created_at: r.created_at })));
  }, [data]);

  const set = <K extends keyof ProductForm>(k: K, v: ProductForm[K]) => setP((s) => ({ ...s, [k]: v }));

  async function save() {
    if (!p.title.trim()) { toast.error("Informe o título"); return; }
    const slug = slugify(p.slug || p.title);
    if (!slug) { toast.error("Informe um link válido"); return; }
    setSaving(true);
    const payload = { ...p, slug, images: p.images.filter(Boolean), highlights: p.highlights.filter((h) => h.trim()), updated_at: new Date().toISOString() };
    const res = isNew
      ? await supabase.from("products").insert(payload).select("id").single()
      : await supabase.from("products").update(payload).eq("id", id).select("id").single();
    if (res.error) {
      setSaving(false);
      toast.error(res.error.code === "23505" ? "Já existe um produto com esse link" : "Erro ao salvar");
      return;
    }
    const pid = res.data.id;
    await supabase.from("product_variants").delete().eq("product_id", pid);
    const vs = variants.filter((v) => v.name.trim());
    if (vs.length) {
      await supabase.from("product_variants").insert(vs.map((v, i) => ({
        product_id: pid, name: v.name.trim(), price: v.price ? Number(v.price.replace(",", ".")) : null, image_url: v.image_url || null, position: i,
      })));
    }
    await supabase.from("reviews").delete().eq("product_id", pid);
    const rs = reviews.filter((r) => r.comment.trim() || r.images.length);
    if (rs.length) {
      await supabase.from("reviews").insert(rs.map((r) => ({
        product_id: pid, author: r.author || "Cliente", rating: r.rating, comment: r.comment, images: r.images.filter(Boolean),
        ...(r.created_at ? { created_at: r.created_at } : {}),
      })));
    }
    setSaving(false);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["admin-product", pid] });
    toast.success("Produto salvo");
    if (isNew) navigate({ to: "/admin/produtos/$id", params: { id: pid }, replace: true });
  }

  async function remove() {
    if (!confirm("Excluir este produto?")) return;
    await supabase.from("products").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    navigate({ to: "/admin/produtos" });
  }

  if (!isNew && isLoading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-24">
      <div>
        <Link to="/admin/produtos" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />Produtos</Link>
        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h1 className="truncate text-xl font-semibold tracking-tight">{isNew ? "Novo produto" : p.title}</h1>
          {!isNew && <Button variant="outline" size="sm" asChild><a href={`/p/${p.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" />Ver na loja</a></Button>}
        </div>
      </div>

      <Card title="Informações">
        <Field label="Título"><Input value={p.title} onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} /></Field>
        <Field label="Link do produto" hint={`/p/${slugify(p.slug || p.title) || "..."}`}>
          <Input value={p.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Linha acima do título"><Input value={p.brand_line} onChange={(e) => set("brand_line", e.target.value)} /></Field>
          <Field label="Condição"><Input value={p.condition} onChange={(e) => set("condition", e.target.value)} /></Field>
          <Field label="Vendidos (texto)"><Input value={p.sold_label} onChange={(e) => set("sold_label", e.target.value)} /></Field>
        </div>
        <Field label="Texto ao lado das estrelas no catálogo"><Input value={p.subtitle} placeholder="175/60 R14" onChange={(e) => set("subtitle", e.target.value)} /></Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Toggle label="Selo MAIS VENDIDO" checked={p.best_seller} onChange={(v) => set("best_seller", v)} />
          <Field label="Texto ao lado do selo"><Input value={p.best_seller_label} onChange={(e) => set("best_seller_label", e.target.value)} placeholder="1º em Pneus Aro 14" /></Field>
          <Toggle label="Visível na loja" checked={p.active} onChange={(v) => set("active", v)} />
        </div>
      </Card>

      <Card title="Preço e estoque">
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Preço (R$)"><Input type="number" step="0.01" value={p.price} onChange={(e) => set("price", Number(e.target.value))} /></Field>
          <Field label="Preço antigo (R$)"><Input type="number" step="0.01" value={p.old_price ?? ""} onChange={(e) => set("old_price", e.target.value ? Number(e.target.value) : null)} /></Field>
          <Field label="Parcelas sem juros"><Input type="number" min={1} value={p.installments} onChange={(e) => set("installments", Number(e.target.value) || 1)} /></Field>
          <Field label="Estoque exibido"><Input type="number" value={p.stock} onChange={(e) => set("stock", Number(e.target.value))} /></Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle label="OFERTA DO DIA" checked={p.offer_of_day} onChange={(v) => set("offer_of_day", v)} />
          <Toggle label="Frete grátis" checked={p.free_shipping} onChange={(v) => set("free_shipping", v)} />
        </div>
      </Card>

      <Card title="Fotos (por URL)">
        <UrlList urls={p.images} onChange={(v) => set("images", v)} big />
      </Card>

      <Card title="Variantes">
        {variants.map((v, i) => (
          <div key={i} className="grid items-end gap-2 rounded-md border p-3 sm:grid-cols-[1fr_140px_1fr_auto]">
            <Field label="Nome"><Input value={v.name} placeholder="Ex.: 175/70R14" onChange={(e) => setVariants((a) => a.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} /></Field>
            <Field label="Preço (vazio = padrão)"><Input value={v.price} onChange={(e) => setVariants((a) => a.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} /></Field>
            <Field label="URL da foto"><Input value={v.image_url} onChange={(e) => setVariants((a) => a.map((x, j) => j === i ? { ...x, image_url: e.target.value } : x))} /></Field>
            <Button variant="ghost" size="icon" onClick={() => setVariants((a) => a.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setVariants((a) => [...a, { name: "", price: "", image_url: "" }])}><Plus className="h-4 w-4" />Adicionar variante</Button>
      </Card>

      <Card title="Descrição">
        <Field label="Destaques (um por linha)">
          <Textarea rows={5} value={p.highlights.join("\n")} onChange={(e) => set("highlights", e.target.value.split("\n"))} />
        </Field>
        <Field label="Descrição completa"><Textarea rows={8} value={p.description} onChange={(e) => set("description", e.target.value)} /></Field>
      </Card>

      <Card title="Avaliações">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nota média exibida"><Input type="number" step="0.1" min={0} max={5} value={p.rating} onChange={(e) => set("rating", Number(e.target.value))} /></Field>
          <Field label="Total de avaliações exibido"><Input type="number" value={p.rating_count} onChange={(e) => set("rating_count", Number(e.target.value))} /></Field>
        </div>
        {reviews.map((r, i) => {
          const upd = (patch: Partial<Review>) => setReviews((a) => a.map((x, j) => j === i ? { ...x, ...patch } : x));
          return (
            <div key={i} className="space-y-2 rounded-md border bg-muted/20 p-3">
              <div className="grid items-end gap-2 sm:grid-cols-[1fr_120px_auto]">
                <Field label="Nome"><Input value={r.author} onChange={(e) => upd({ author: e.target.value })} /></Field>
                <Field label="Estrelas">
                  <select value={r.rating} onChange={(e) => upd({ rating: Number(e.target.value) })} className="h-9 w-full rounded-md border bg-background px-2">
                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
                  </select>
                </Field>
                <Button variant="ghost" size="icon" onClick={() => setReviews((a) => a.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <Field label="Comentário"><Textarea rows={2} value={r.comment} onChange={(e) => upd({ comment: e.target.value })} /></Field>
              <p className="text-sm text-muted-foreground">Fotos da avaliação (por URL)</p>
              <UrlList urls={r.images} onChange={(v) => upd({ images: v })} />
            </div>
          );
        })}
        <Button variant="outline" size="sm" onClick={() => setReviews((a) => [{ author: "", rating: 5, comment: "", images: [] }, ...a])}><Plus className="h-4 w-4" />Adicionar avaliação</Button>
      </Card>

      <div className="sticky bottom-0 -mx-4 border-t bg-background/90 p-3 backdrop-blur md:-mx-8">
        <div className="mx-auto flex max-w-4xl justify-between gap-2">
          {!isNew ? <Button variant="ghost" className="text-destructive" onClick={remove}><Trash2 className="h-4 w-4" />Excluir</Button> : <span />}
          <Button disabled={saving} onClick={save} size="sm">{saving ? "Salvando..." : "Salvar produto"}</Button>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return <Panel title={title}>{children}</Panel>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="block font-admin-mono text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 self-end py-2 text-sm">
      <Switch checked={checked} onCheckedChange={onChange} />
      {label}
    </label>
  );
}

function UrlList({ urls, onChange, big }: { urls: string[]; onChange: (v: string[]) => void; big?: boolean }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const items = draft.split(/\s+/).map((s) => s.trim()).filter(Boolean);
    if (!items.length) return;
    onChange([...urls, ...items]);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {urls.map((u, i) => (
          <div key={i} className={`relative overflow-hidden rounded-md border bg-muted ${big ? "h-28 w-28" : "h-20 w-20"}`}>
            <img src={u} alt="" className="h-full w-full object-contain" />
            {i === 0 && big && <span className="absolute left-1 top-1 rounded border bg-background px-1 text-[10px] font-medium">Capa</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-background/80 p-0.5">
              {i > 0 && <button title="Mover para frente" onClick={() => { const a = [...urls]; const t = a[i - 1]!; a[i - 1] = a[i]!; a[i] = t; onChange(a); }} className="p-0.5"><ArrowUp className="h-3.5 w-3.5 -rotate-90" /></button>}
              <button title="Remover" onClick={() => onChange(urls.filter((_, j) => j !== i))} className="p-0.5 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder="Cole a URL da imagem (https://...)" />
        <Button type="button" variant="outline" onClick={add}><Plus className="h-4 w-4" />Adicionar</Button>
      </div>
    </div>
  );
}
