import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { loadStripe, type Stripe, type StripeElementStyle } from "@stripe/stripe-js";
import { CardNumberElement, CardExpiryElement, CardCvcElement, Elements, useStripe, useElements } from "@stripe/react-stripe-js";
import { LockKeyhole, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStripePublicConfig } from "@/lib/stripe.functions";

export type ConfirmCard = (secret: string, billing: { name: string; email: string }) => Promise<void>;

export function SecureCardFields({ onConfirmReady }: { onConfirmReady: (confirm: ConfirmCard | null) => void }) {
  const getConfig = useServerFn(getStripePublicConfig);
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setFailed(false);
    async function init() {
      try {
        const { publishableKey } = await getConfig();
        if (!publishableKey) throw new Error("Stripe unavailable");
        const client = await loadStripe(publishableKey, { locale: "pt-BR" });
        if (!client) throw new Error("Stripe unavailable");
        if (active) setStripe(client);
      } catch {
        if (active) setFailed(true);
      }
    }
    void init();
    return () => { active = false; };
  }, [getConfig, attempt]);

  return (
    <div className="border-t border-ml-muted/20 px-4 py-5">
      {failed ? (
        <div role="alert" className="space-y-3 text-sm text-ml-muted">
          <p>Não foi possível abrir os campos seguros do cartão.</p>
          <Button type="button" variant="outline" onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</Button>
        </div>
      ) : stripe ? (
        <Elements stripe={stripe} options={{ locale: "pt-BR" }}>
          <CardInputs onConfirmReady={onConfirmReady} />
        </Elements>
      ) : (
        <p role="status" className="flex min-h-14 items-center gap-2 text-sm text-ml-muted">
          <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" />Abrindo campos seguros…
        </p>
      )}
      <p className="mt-4 flex items-center gap-2 text-xs text-ml-muted">
        <LockKeyhole className="h-4 w-4 shrink-0" />Dados do cartão protegidos pela Stripe
      </p>
    </div>
  );
}

function CardInputs({ onConfirmReady }: { onConfirmReady: (confirm: ConfirmCard | null) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 20000);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!stripe || !elements || !ready["number"] || !ready["expiry"] || !ready["cvc"]) return;
    onConfirmReady(async (secret, billing) => {
      const card = elements.getElement(CardNumberElement);
      if (!card) throw new Error("Preencha os dados do cartão.");
      const result = await stripe.confirmCardPayment(secret, { payment_method: { card, billing_details: billing } });
      if (result.error) throw new Error(result.error.message || "Não foi possível aprovar o cartão.");
    });
    return () => onConfirmReady(null);
  }, [stripe, elements, ready, onConfirmReady]);
  // Stripe iframes cannot inherit CSS. Resolve existing theme tokens after mounting.
  const style = useMemo<StripeElementStyle>(() => {
    const theme = getComputedStyle(document.documentElement);
    // Elements rejects modern CSS color syntax (including OKLCH).
    // Let the browser convert the existing tokens to Stripe-compatible sRGB.
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const color = (token: string) => {
      if (!context) return undefined;
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = theme.getPropertyValue(token).trim();
      context.fillRect(0, 0, 1, 1);
      const pixel = context.getImageData(0, 0, 1, 1).data;
      return `#${Array.from(pixel).slice(0, 3).map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
    };
    const text = color("--ml-text");
    const muted = color("--ml-muted");
    const invalid = color("--destructive");
    return {
      base: {
        ...(text ? { color: text } : {}),
        fontFamily: "Arial, sans-serif",
        fontSize: "16px",
        "::placeholder": muted ? { color: muted } : {},
      },
      invalid: invalid ? { color: invalid } : {},
    };
  }, []);
  const options = { style };
  const onChange = (name: string) => (event: { error?: { message: string } | undefined }) => {
    setErrors((values) => ({ ...values, [name]: event.error?.message ?? "" }));
  };
  const onReady = (name: string) => () => setReady((values) => ({ ...values, [name]: true }));
  const fieldClass = "flex min-h-14 items-center rounded-md border border-ml-muted/40 bg-background px-4 [&_.StripeElement]:w-full [&:has(.StripeElement--focus)]:border-ml-blue [&:has(.StripeElement--focus)]:ring-1 [&:has(.StripeElement--focus)]:ring-ml-blue";
  return (
    <div className="space-y-4">
      <div>
        <p id="card-number-label" className="mb-2 text-[15px]">Número do cartão</p>
        <div className={fieldClass} role="group" aria-labelledby="card-number-label">
          <CardNumberElement options={{ ...options, showIcon: true, placeholder: "1234 1234 1234 1234" }} onReady={onReady("number")} onChange={onChange("number")} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p id="card-expiry-label" className="mb-2 text-[15px]">Validade</p>
          <div className={fieldClass} role="group" aria-labelledby="card-expiry-label">
            <CardExpiryElement options={options} onReady={onReady("expiry")} onChange={onChange("expiry")} />
          </div>
        </div>
        <div>
          <p id="card-cvc-label" className="mb-2 text-[15px]">Código de segurança</p>
          <div className={fieldClass} role="group" aria-labelledby="card-cvc-label">
            <CardCvcElement options={options} onReady={onReady("cvc")} onChange={onChange("cvc")} />
          </div>
        </div>
      </div>
      {Object.values(errors).filter(Boolean).map((message) => <p key={message} role="alert" className="text-sm text-destructive">{message}</p>)}
      {!(ready["number"] && ready["expiry"] && ready["cvc"]) && <p role={timedOut ? "alert" : "status"} className="text-xs text-ml-muted">{timedOut ? "A Stripe não carregou os campos. Atualize a página e tente novamente." : "Carregando cartão…"}</p>}
    </div>
  );
}