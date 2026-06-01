# Multi-Division Sub-Product Pricing

## Goal
Let each product (e.g. "Bumi Class X") have unlimited sub-products (Lunas, Cicilan 2x, Cicilan 3x…), and each sub-product have unlimited **price divisions** (Price 1, Price 2 … Price n). The sum of divisions is the sub-product's total. Customers see/pay the **first** division; admins see and toggle the rest, and toggled-paid divisions count as revenue immediately. Buying any sub-product reduces the product's quantity.

This **extends the existing variant system** (`product_variants` = sub-products) rather than building a new one.

## How it maps to what exists
- Sub-products = `product_variants` (already wired into product page, cart, checkout).
- Installment tracking = `order_payments` (already exists: `payment_number`, `amount`, `status`, `paid_at`; `sync_order_amount_paid` trigger keeps `orders.amount_paid` in sync).
- Revenue = dashboard already scales by `amount_paid / total_amount`, so paid divisions automatically become revenue. **No analytics change needed.**

## Data model
Add one column:
- `product_variants.price_divisions jsonb default '[]'` — ordered array of integer amounts `[500000, 2500000]`. `price_divisions[0]` is the customer-facing first division; `product_variants.price` is kept equal to it for backward compatibility. The variant total = sum of the array.

## Behavior

### 1. Admin product editor (`ProductVariantManager`)
- Each sub-product row gets a **Price Divisions** editor: add/remove rows of amounts (Price 1, Price 2, …). A live "Total" shows the sum.
- On save: store the full array in `price_divisions` and set `price` = first division.
- Existing single-price variants keep working (treated as a one-division `[price]`).
- Product `stock` field stays the single shared quantity for the whole product (matches the screenshot where qty 12 is at the product level).

### 2. Storefront (`ProductMainSection`, cart)
- Sub-product buttons keep showing the **first division** as the price (unchanged), with a small "Total Rp 3.000.000 · n pembayaran" hint underneath.
- Cart line shows the first division (the amount due now). Unchanged logic.

### 3. Checkout (`useOrderProcessing`, `OrderSummary`)
- The created order's `subtotal`/`total_amount` = the **full** sub-product value (sum of all divisions) so outstanding amounts and revenue work.
- The order summary shows two lines: **Total** (e.g. 3,000,000) and **First payment due now** (e.g. 500,000).
- After inserting the order + items, call a new RPC `setup_order_payments_for_order(order_id)`.

### 4. New RPC `setup_order_payments_for_order` (SECURITY DEFINER)
- Removes any auto-created payment for the order, then for each ordered sub-product inserts one `order_payments` row per division: division 1 = `status 'paid'` (paid now), divisions 2…n = `status 'unpaid'`, with `notes` labeling the division. Non-variant / "Lunas" single-division items become a single fully-paid payment (same as today). `sync_order_amount_paid` then sets `amount_paid` to the first-division sum.

### 5. Stock RPC change
- Update `deduct_stock_for_order` / `restore_stock_for_order` so sub-product (variant) line items decrement/restore the **parent product's** `stock` (shared pool), matching "choosing a sub-product reduces the product quantity."

### 6. Admin order details (`OrderDetailsDialog`)
- Add a **Payment Divisions** panel listing each `order_payments` row: label, amount, and a **paid/unpaid toggle (Switch)**.
- Toggling updates `status` + `paid_at`; `amount_paid` and dashboard/analytics revenue update automatically (immediately, refunds/cancelled stay at 0 per existing rule).

## Technical notes
- Division amounts are treated as the exact rupiah the customer transfers (tax-inclusive); for division-based variant items the order's `tax_amount` is 0 so `total = subtotal` and `validate_order_totals` passes. Ordinary non-variant products keep their current tax behavior.
- `auto_mark_order_paid` stays for plain products; the new RPC overrides payments only for variant orders.
- Types file (`src/integrations/supabase/types.ts`) refreshes automatically after the migration.

## Files
- Migration: add `price_divisions`; create `setup_order_payments_for_order`; update `deduct_stock_for_order` & `restore_stock_for_order`.
- `src/components/admin/ProductVariantManager.tsx` — divisions editor.
- `src/hooks/useProductVariants.ts` — include `price_divisions`.
- `src/components/product/ProductMainSection.tsx` — total/first-payment hint.
- `src/hooks/useOrderProcessing.ts` — full-value order totals + RPC call.
- `src/components/checkout/OrderSummary.tsx` (+ CheckoutPage wiring) — show Total vs First payment due now.
- `src/components/admin/OrderDetailsDialog.tsx` — payment-division toggles.

## Out of scope
- No changes to analytics math, billing-notice emails, or the legacy `product_installment_plans` table.
