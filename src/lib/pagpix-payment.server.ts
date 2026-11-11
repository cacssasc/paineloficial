type PagPixTransaction = {
  id: string;
  status: "PENDING" | "PAID" | "EXPIRED" | "FAILED" | "REFUNDED" | "CHARGEBACK";
  pix_status: "generating" | "ready" | "paid" | "expired" | "failed";
  amount_cents: number;
  pix?: { copy_paste?: string | null; expires_at?: string | null } | null;
};

function apiKey() {
  const key = process.env["PAGPIXHUB_API_KEY"];
  if (!key) throw new Error("Pix indisponível. Configure PAGPIXHUB_API_KEY no ambiente do servidor.");
  return key;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`https://pagpixhub.com/api/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.json().catch(() => null) as ({ error?: { message?: string } } & T) | null;
  if (!response.ok) {
    console.error("PagPix Hub request failed", { status: response.status, message: body?.error?.message });
    throw new Error(response.status === 422 ? "A PagPix Hub recusou os dados desta cobrança Pix." : "Não foi possível iniciar o Pix. Tente novamente.");
  }
  return body as T;
}

export function createPagPixCharge(input: {
  amountCents: number; orderId: string; customer: { name: string; email: string; cpf: string; phone: string };
}) {
  return request<PagPixTransaction>("/transactions", {
    method: "POST",
    headers: { "Idempotency-Key": `order:${input.orderId}` },
    body: JSON.stringify({
      amount_cents: input.amountCents,
      method: "pix",
      customer: {
        name: input.customer.name,
        email: input.customer.email,
        ...(input.customer.cpf ? { cpf: input.customer.cpf.replace(/\D/g, "") } : {}),
        ...(input.customer.phone ? { phone: input.customer.phone.replace(/\D/g, "") } : {}),
      },
      description: `Pedido ${input.orderId}`,
      external_reference: input.orderId,
      metadata: { order_id: input.orderId, integration: "paineloficial" },
      expires_in: 1800,
    }),
  });
}

export function getPagPixTransaction(id: string) {
  return request<PagPixTransaction>(`/transactions/${encodeURIComponent(id)}`);
}

export type { PagPixTransaction };

