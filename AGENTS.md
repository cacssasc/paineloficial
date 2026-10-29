<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Store architecture
- Storefront pages (`/`, `/p/$slug`, `/c/$slug` catalogs, `/carrinho`, `/comprar`) read via public server functions in `src/lib/store.functions.ts`; orders are inserted only server-side with the price recomputed from the database, so customers can't tamper with totals.
- Admin panel lives under `src/routes/_authenticated/admin*` and talks to the database directly with RLS; only users with the `admin` role (first signup gets it automatically) can manage data.
- The old static copy in `public/site/` is kept only for its images/fonts/logo.
- Payment choices stay in two places: `src/lib/payment.ts` (methods the checkout accepts — zod schema + labels, reused by checkout, order server function and admin panel) and `src/lib/payment-brands.ts` (brand icons shown in the storefront strip).
- The cart lives in the browser (`src/lib/cart.ts`, localStorage); one order row stores all cart lines in `orders.items`, with prices recomputed server-side.
- Stripe uses the user's own account; webhook handlers verify raw-body signatures and reconcile the latest PaymentIntent, returning retryable failures on errors. Amount, BRL currency and order linkage must match before approval.
- Card number, expiry and CVC use Stripe-hosted Elements only; never copy their values into React state, browser storage or order payloads. Stripe.js handles card confirmation and bank authentication.
- Resolve theme colors to sRGB before passing styles to Stripe Elements, because its style validator rejects OKLCH CSS tokens.
- Guest payment reads require a per-order capability token kept in the server-only order_payments table. Browser storage holds only the access token; totals, Pix codes and approval always come from server-verified Stripe state.
- Order creation uses a per-attempt UUID and Stripe idempotency key to avoid repeat charges; server-calculated stored order totals remain authoritative on retries.
- UTM attribution uses a shared allowlisted utm_* module, root search middleware and tab-session capture; checkout snapshots campaign labels onto orders at creation, preserving them on retries and payment status changes. No advertising provider tags or outbound reporting are installed by this feature.
