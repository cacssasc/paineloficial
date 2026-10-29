import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, ShoppingBag, LayoutGrid, FileUp, Star, LogOut, ExternalLink, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel da loja" },
      { name: "description", content: "Gerencie produtos e pedidos da loja." },
      { property: "og:title", content: "Painel da loja" },
      { property: "og:description", content: "Gerencie produtos e pedidos da loja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const nav = [
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/importar", label: "Importar produtos", icon: FileUp },
  { to: "/admin/avaliacoes", label: "Avaliações", icon: Star },
  { to: "/admin/catalogos", label: "Catálogos", icon: LayoutGrid },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/admin/loja", label: "Loja", icon: Store },
] as const;

function AdminLayout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const current = nav.find((n) => path.startsWith(n.to));

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background font-admin text-foreground antialiased">
        <Sidebar collapsible="icon" className="border-r">
          <SidebarHeader className="h-14 justify-center border-b">
            <div className="flex items-center gap-2 px-1">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-foreground text-background">
                <Store className="h-4 w-4" />
              </div>
              <span className="truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">Painel da loja</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Gerenciar</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {nav.map((n) => (
                    <SidebarMenuItem key={n.to}>
                      <SidebarMenuButton asChild isActive={path.startsWith(n.to)} tooltip={n.label}>
                        <Link to={n.to}><n.icon /><span>{n.label}</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Ver loja">
                      <a href="/" target="_blank" rel="noreferrer"><ExternalLink /><span>Ver loja</span></a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t">
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:hidden">
                  <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-medium uppercase">{user.email?.[0]}</div>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} tooltip="Sair"><LogOut /><span>Sair</span></SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="min-w-0 bg-background">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-border" />
            <span className="text-sm text-muted-foreground">Painel</span>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm font-medium">{current?.label ?? "Início"}</span>
          </header>
          <main className="mx-auto w-full max-w-6xl p-4 md:p-8">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : isAdmin ? (
              <Outlet />
            ) : (
              <div className="rounded-lg border p-6 text-sm">Sua conta não tem acesso ao painel.</div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
