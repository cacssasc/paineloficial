import { Accessibility } from "lucide-react";

const links = ["Minha conta", "Compras", "Histórico", "Ofertas", "Favoritos", "Lojas oficiais", "Categorias", "Meli+", "Contato", "Vender", "Programa de Afiliados", "Videos"];
const legal = ["Termos e condições", "Promoções", "Como cuidamos da sua privacidade"];
const legal2 = ["Acessibilidade", "Informações sobre seguros", "Blog", "Afiliados", "Tendências"];

export function StoreFooter() {
  return (
    <footer className="mt-10 border-t border-ml-muted/20 bg-background font-ml text-ml-text">
      <div className="flex items-center gap-5 bg-ml-yellow/55 px-8 py-5">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-ml-yellow shadow-md">
          <img src="/site/images/logo__small@2x.png" alt="" className="h-10 w-10 object-contain" />
        </span>
        <p className="text-xl">Compre e venda com o app!</p>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-7 border-b border-ml-muted/20 px-8 py-10">
        {links.map((l) => <li key={l}><a href="#" className="text-[15px]">{l}</a></li>)}
      </ul>
      <div className="px-8 py-8">
        <p className="flex items-center text-lg text-ml-blue">
          <a href="/auth">Entre</a>
          <span className="mx-3 h-6 w-px bg-ml-muted/30" />
          <a href="/auth">Crie a sua conta</a>
        </p>
        <p className="mt-8 text-sm leading-relaxed">
          {legal.map((l) => <a key={l} href="#" className="mr-1.5">{l}</a>)}
          <Accessibility className="mr-1.5 inline h-4 w-4" />
          {legal2.map((l) => <a key={l} href="#" className="mr-1.5">{l}</a>)}
        </p>
        <p className="mt-2 text-sm text-ml-muted">© 1999-2026. Mercado Livre Brasil Ltda.</p>
        <p className="mt-1 text-sm leading-relaxed text-ml-muted">CNPJ n.º 03.007.331/0001-41 / Av. das Nações Unidas, nº 3.003, Bonfim, Osasco/SP - CEP 06233-903 - empresa do grupo Mercado Livre.</p>
      </div>
    </footer>
  );
}
