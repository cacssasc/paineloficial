const API_BASE = "https://api.iluminypay.com";

function authHeader() {
  const publicKey = process.env["ILUMINYPAY_PUBLIC_KEY"];
  const secretKey = process.env["ILUMINYPAY_SECRET_KEY"];
  if (!publicKey || !secretKey) throw new Error("Iluminypay não configurada no servidor.");
  return `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString("base64")}`;
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      Authorization: authHeader(),
      ...init.headers,
    },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("Iluminypay API error", { path, status: response.status });
    throw new Error("Não foi possível processar o Pix. Tente novamente.");
  }
  return body as T;
}

type CreateResponse = {
  success: boolean;
  data: {
    id: string;
    amount: number;
    status: string;
    pix?: { qr_code?: string | null; expiration_date?: string | null };
  };
};

export type IluminypayTransaction = {
  id: string;
  amount: number;
  status: "PENDING" | "PAID" | "REFUNDED" | "REFUSED" | "FAILED" | string;
  paid_at?: string | null;
  metadata?: string | Record<string, unknown> | null;
  external_id?: string | null;
};

export async function createIluminypayPix(input: {
  orderId: string;
  amountInCents: number;
  customerName: string;
  email: string;
  cpf: string;
  phone: string;
  title: string;
}) {
  const postbackUrl = process.env["ILUMINYPAY_POSTBACK_URL"];
  if (!postbackUrl) throw new Error("Configure ILUMINYPAY_POSTBACK_URL no servidor.");
  const result = await api<CreateResponse>("/v1/payment-transaction/create", {
    method: "POST",
    body: JSON.stringify({
      payment_method: "pix",
      amount: input.amountInCents,
      customer: {
        name: input.customerName,
        email: input.email,
        document: { type: "cpf", number: input.cpf.replace(/\\D/g, "") },
        phone: input.phone.replace(/\\D/g, ""),
      },
      items: [{
        title: input.title.slice(0, 200),
        unit_price: input.amountInCents,
        quantity: 1,
        tangible: true,
        external_ref: input.orderId,
      }],
      pix: { expires_in_days: 1 },
      postback_url: postbackUrl,
      metadata: { order_id: input.orderId },
    }),
  });
  const tx = result?.data;
  if (!result?.success || !tx?.id || tx.amount !== input.amountInCents || !tx.pix?.qr_code) {
    throw new Error("A Illuminypay retornou uma cobrança Pix incompleta.");
  }
  return {
    transactionId: tx.id,
    status: tx.status,
    qrCode: tx.pix.qr_code,
    expiresAt: tx.pix.expiration_date ? Date.parse(tx.pix.expiration_date) : null,
  };
}

export function getIluminypayTransaction(id: string) {
  if (!/^[a-f0-9]{32}$/i.test(id)) throw new Error("Identificador de pagamento inválido.");
  return api<IluminypayTransaction>(`/v1/payment-transaction/info/${encodeURIComponent(id)}`);
}
