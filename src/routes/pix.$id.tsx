import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PixPayment } from "@/components/store/PixPayment";
import { useEffect } from "react";
import { useOrderPayment } from "@/lib/use-order-payment";

export const Route = createFileRoute("/pix/$id")({
  head: () => ({ meta: [
    { title: "Pagamento Pix | Loja de Pneus" },
    { name: "description", content: "Acompanhe seu pagamento Pix e as instruções para concluir sua compra." },
    { property: "og:title", content: "Pagamento Pix | Loja de Pneus" },
    { property: "og:description", content: "Instruções de pagamento do seu pedido." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: PixPage,
});

function PixPage() {
  const { id } = Route.useParams();
  const { payment, error } = useOrderPayment(id);
  const navigate = useNavigate();
  useEffect(() => {
    if (payment?.status === "pago") void navigate({ to: "/obrigado/$id", params: { id }, replace: true });
  }, [id, payment?.status, navigate]);
  if (error && !payment) return <p role="alert" className="p-8 text-center text-ml-muted">{error}</p>;
  return <PixPayment orderId={id} total={payment?.total} {...(payment?.code ? { code: payment.code } : {})} {...(payment?.expiresAt ? { expiresAt: payment.expiresAt } : {})} />;
}