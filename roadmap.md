# Stripe setup
## UTM attribution
- [x] Preserve campaign UTMs across the storefront journey and reloads within the visit.
- [x] Store UTMs with orders and show them in the admin order details.
- [x] Test navigation in the browser and order persistence/retries with mocked payments, without a live charge.

## Payments
- [x] Connect the user's own Stripe account securely.
- [x] Prepare a signature-verifying webhook endpoint with retryable payment reconciliation.
- [x] Collect the publishable key through the secure form.
- [x] Collect the webhook signing secret through the secure form at the user's request.
- [ ] Make the webhook available at the published address (awaits publishing approval).
- [x] Create the Pix payment screen matching the reference and a guarded thank-you page.
- [x] Open Stripe-hosted secure card fields when credit card is selected; do not submit fictitious card payments.
- [x] Implement real Stripe card/Pix requests, signed payment reconciliation and verified confirmation pages.
- [x] User confirmed real Pix codes are generated with their buyer data.
- [x] Fix Stripe card fields and verify secure typing without performing a live charge.
- [ ] Verify a successful card purchase and paid-order confirmation; requires a buyer-authorized payment.