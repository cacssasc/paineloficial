import mercadoPago from "@/assets/mercado-pago.png.asset.json";
import elo from "@/assets/elo.png.asset.json";
import visa from "@/assets/visa.png.asset.json";
import mastercard from "@/assets/mastercard.png.asset.json";
import pixLogo from "@/assets/pix-logo.png.asset.json";

/** Bandeiras exibidas na faixa "Meios de pagamento" da loja. */
export const PAYMENT_BRANDS = [
  { name: "Mercado Pago", src: mercadoPago.url },
  { name: "Elo", src: elo.url },
  { name: "Visa", src: visa.url },
  { name: "Mastercard", src: mastercard.url },
  { name: "Pix", src: pixLogo.url },
];
