import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search, Star, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader, Panel } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/avaliacoes")({
  component: SharedReviews,
});

type Draft = { author: string; rating: number; comment: string; images: string[] };
const empty = (): Draft => ({ author: "", rating: 5, comment: "", images: [] });

function SharedReviews() {
  const qc = useQueryClient();
  const [reviews, setReviews] = useState<Draft[]>([empty()]);
  const [selected, setSelected] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, title, price, images, active, rating_count").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = products.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()));
  const allChecked = filtered.length > 0 && filtered.every((p) => selected.includes(p.id));
  const someChecked = filtered.some((p) => selected.includes(p.id));
  const toggleAll = () =>
    setSelected((s) => (allChecked ? s.filter((id) => !filtered.some((p) => p.id === id)) : [...new Set([...s, ...filtered.map((p) => p.id)])]));
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const update = (i: number, patch: Partial<Draft>) => setReviews((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  async function publish() {
    const valid = reviews.filter((r) => r.comment.trim() || r.images.length);
    if (!valid.length) { toast.error("Escreva pelo menos uma avaliação"); return; }
    if (!selected.length) { toast.error("Selecione os produtos"); return; }
    setBusy(true);
    const rows = selected.flatMap((product_id) =>
      valid.map((r) => ({ product_id, author: r.author.trim() || "Cliente", rating: r.rating, comment: r.comment.trim(), images: r.images })),
    );
    const { error } = await supabase.from("reviews").insert(rows);
    if (!error) {
      // keep the "X avaliações" count on each product in sync
      for (const pid of selected) {
        const cur = products.find((p) => p.id === pid)?.rating_count ?? 0;
        await supabase.from("products").update({ rating_count: cur + valid.length }).eq("id", pid);
      }
    }
    setBusy(false);
    if (error) { toast.error("Erro ao publicar avaliações"); return; }
    toast.success(`${valid.length} avaliação(ões) publicada(s) em ${selected.length} produto(s)`);
    setReviews([empty()]);
    qc.invalidateQueries();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-24">
      <PageHeader title="Avaliações" description="Escreva avaliações uma vez e publique em todos os produtos que você marcar." />

      <Panel title="1. Avaliações">
        <div className="space-y-3">
          {reviews.map((r, i) => (
            <ReviewCard key={i} r={r} onChange={(p) => update(i, p)} onRemove={reviews.length > 1 ? () => setReviews((x) => x.filter((_, j) => j !== i)) : undefined} />
          ))}
          <Button variant="outline" size="sm" onClick={() => setReviews((r) => [...r, empty()])}><Plus className="h-4 w-4" />Outra avaliação</Button>
        </div>
      </Panel>

      <Panel title={`2. Produtos (${selected.length} selecionados)`}>
        <div className="flex items-center gap-2 rounded-md border px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto..." className="h-9 border-0 px-0 shadow-none focus-visible:ring-0" />
        </div>
        <div className="overflow-hidden rounded-md border">
          <label className="flex cursor-pointer items-center gap-3 border-b bg-muted/40 px-3 py-2 text-sm font-medium">
            <Checkbox checked={allChecked ? true : someChecked ? "indeterminate" : false} onCheckedChange={toggleAll} />
            Marcar todos{q && " (da busca)"}
          </label>
          <ul className="max-h-[26rem] divide-y overflow-y-auto">
            {filtered.map((p) => (
              <li key={p.id}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/40">
                  <Checkbox checked={selected.includes(p.id)} onCheckedChange={() => toggle(p.id)} />
                  <img src={p.images[0]} alt="" className="h-9 w-9 shrink-0 rounded border object-contain" />
                  <span className="min-w-0 flex-1 truncate text-sm">{p.title}</span>
                </label>
              </li>
            ))}
            {filtered.length === 0 && <li className="p-4 text-center text-sm text-muted-foreground">Nenhum produto.</li>}
          </ul>
        </div>
      </Panel>

      <div className="sticky bottom-0 -mx-4 border-t bg-background/90 p-3 backdrop-blur md:-mx-8">
        <div className="mx-auto flex max-w-4xl justify-end">
          <Button size="sm" disabled={busy} onClick={publish}>{busy ? "Publicando..." : `Publicar em ${selected.length} produto(s)`}</Button>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ r, onChange, onRemove }: { r: Draft; onChange: (p: Partial<Draft>) => void; onRemove?: (() => void) | undefined }) {
  const [url, setUrl] = useState("");
  const addImg = () => { const u = url.trim(); if (!u) return; onChange({ images: [...r.images, u] }); setUrl(""); };
  return (
    <div className="space-y-3 rounded-md border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <Input value={r.author} onChange={(e) => onChange({ author: e.target.value })} placeholder="Nome (ex.: Maria)" className="h-9 max-w-xs bg-background" />
        <div className="flex">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => onChange({ rating: n })} aria-label={`${n} estrelas`}>
              <Star className={`h-5 w-5 ${n <= r.rating ? "fill-ml-blue text-ml-blue" : "text-muted-foreground/40"}`} />
            </button>
          ))}
        </div>
        {onRemove && <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={onRemove}><X className="h-4 w-4" /></Button>}
      </div>
      <Textarea value={r.comment} onChange={(e) => onChange({ comment: e.target.value })} placeholder="Comentário" rows={3} className="bg-background" />
      <div className="flex gap-2">
        <Input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImg())} placeholder="URL da foto (opcional)" className="h-9 bg-background" />
        <Button variant="outline" size="sm" onClick={addImg}>Adicionar foto</Button>
      </div>
      {r.images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {r.images.map((src, i) => (
            <div key={i} className="relative">
              <img src={src} alt="" className="h-16 w-16 rounded border object-cover" />
              <button type="button" onClick={() => onChange({ images: r.images.filter((_, j) => j !== i) })} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full border bg-background"><X className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
