import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar no painel" },
      { name: "description", content: "Acesso ao painel administrativo da loja." },
      { property: "og:title", content: "Entrar no painel" },
      { property: "og:description", content: "Acesso ao painel administrativo da loja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) { toast.error("E-mail ou senha incorretos."); return; }
      navigate({ to: "/admin/produtos" });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin/produtos` },
      });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      if (data.session) navigate({ to: "/admin/produtos" });
      else toast.success("Conta criada! Confirme pelo link enviado ao seu e-mail.");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-muted/30 p-4 font-admin antialiased">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-foreground text-background">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{mode === "in" ? "Entrar no painel" : "Criar conta de administrador"}</h1>
            <p className="text-sm text-muted-foreground">{mode === "in" ? "Gerencie seus produtos e pedidos." : "A primeira conta criada vira a dona do painel."}</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">E-mail</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw" className="text-xs">Senha</Label>
            <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button disabled={busy} className="w-full">
            {busy ? "Aguarde..." : mode === "in" ? "Entrar" : "Criar conta"}
          </Button>
        </form>
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground">
          {mode === "in" ? "Primeiro acesso? Criar conta" : "Já tenho conta · Entrar"}
        </button>
      </div>
    </div>
  );
}
