import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getOrderPayment } from "@/lib/stripe.functions";

export function useOrderPayment(id: string) {
  const readPayment = useServerFn(getOrderPayment);
  const [payment, setPayment] = useState<Awaited<ReturnType<typeof getOrderPayment>> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function refresh() {
      const token = sessionStorage.getItem(`order-access:${id}`);
      if (!token) { setError("Abra o pedido no navegador em que você fez a compra."); return; }
      try {
        const result = await readPayment({ data: { id, token } });
        if (!active) return;
        setPayment(result); setError("");
        if (result.status !== "pago" && result.providerStatus !== "canceled") timer = setTimeout(refresh, 5000);
      } catch {
        if (!active) return;
        setError("Não foi possível consultar o pagamento. Tentando novamente…");
        timer = setTimeout(refresh, 8000);
      }
    }
    void refresh();
    return () => { active = false; clearTimeout(timer); };
  }, [id, readPayment]);
  return { payment, error };
}