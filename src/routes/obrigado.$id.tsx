import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock3, CheckCircle2 } from "lucide-react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { Button } from "@/components/ui/button";
import { useOrderPayment } from "@/lib/use-order-payment";

export const Route = createFileRoute("/obrigado/$id")({
  head: () => ({ meta: [
    { title: "Obrigado pela compra | Loja de Pneus" },
    { name: "description", content: "Confira a confirmação de pagamento da sua compra." },
    { property: "og:title", content: "Obrigado pela compra | Loja de Pneus" },
    { property: "og:description", content: "Acompanhe a confirmação da sua compra." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: ThankYou,
});

function ThankYou() {
  const { id } = Route.useParams();
  const { payment, error } = useOrderPayment(id);
  const paid = payment?.status === "pago";
  return <div className="min-h-screen bg-ml-gray font-ml text-ml-text">
    <StoreHeader />
    <main className="mx-auto max-w-xl px-6 py-12 text-center">
      {paid ? <CheckCircle2 className="mx-auto size-16 text-ml-green" /> : <Clock3 className="mx-auto size-16 text-ml-blue" />}
      <h1 className="mt-6 text-2xl font-semibold">{paid ? "Pagamento aprovado!" : "Aguardando confirmação"}</h1>
      <p className="mt-3 text-ml-muted">{paid ? "Obrigado pela sua compra! Seu pedido foi confirmado." : error || (payment?.status === "recusado" ? "O pagamento não foi aprovado." : "Estamos verificando o pagamento com a Stripe.")}</p>
      <p className="mt-2 text-sm text-ml-muted">Pedido <span className="font-semibold text-ml-text">{id.slice(0, 8).toUpperCase()}</span></p>
      <Button asChild className="mt-8 h-12 w-full bg-ml-blue text-background hover:bg-ml-blue/90"><Link to="/pedido/$id" params={{ id }}>Ver meu pedido</Link></Button>
      <Button asChild variant="ghost" className="mt-2 h-12 w-full text-ml-blue hover:text-ml-blue"><Link to="/">Continuar comprando</Link></Button>
    </main>
  </div>;
}