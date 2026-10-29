import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { StoreHeader } from "@/components/store/StoreHeader";

export const Route = createFileRoute("/pedido/$id")({
  head: () => ({
    meta: [
      { title: "Pedido recebido | Mercado Livre" },
      { name: "description", content: "Seu pedido foi registrado com sucesso." },
      { property: "og:title", content: "Pedido recebido | Mercado Livre" },
      { property: "og:description", content: "Seu pedido foi registrado com sucesso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Done,
});

function Done() {
  const { id } = Route.useParams();
  return (
    <div className="min-h-screen bg-ml-gray font-ml text-ml-text">
      <StoreHeader />
      <main className="mx-auto max-w-xl p-4">
        <div className="rounded-md bg-background p-6 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-ml-green" />
          <h1 className="mt-3 text-xl font-semibold">Pedido recebido!</h1>
          <p className="mt-2 text-ml-muted">Número do pedido: <b className="text-ml-text">{id.slice(0, 8).toUpperCase()}</b></p>
          <p className="mt-1 text-sm text-ml-muted">Enviaremos as próximas instruções para o seu e-mail.</p>
          <Link to="/" className="mt-6 inline-block text-ml-blue">Continuar comprando</Link>
        </div>
      </main>
    </div>
  );
}
