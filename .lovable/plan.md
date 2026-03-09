

# Robustness Audit: Bugs, Issues, and Recommendations

After a thorough review of the codebase, database schema, RLS policies, and application logic, here are the issues found, organized by severity.

---

## Critical Bugs

### 1. Date Range Filter Mutates Original Date Objects
**File:** `src/components/admin/orders/useOrderFilters.ts` (lines 13-14)

`dateRange.from.setHours(0,0,0,0)` mutates the original `Date` object in place. Since this runs inside `useMemo`, every re-render permanently modifies the `from`/`to` dates, causing progressively incorrect filtering and potential infinite re-render loops.

**Fix:** Clone dates before calling `setHours`:
```ts
const fromDate = new Date(dateRange.from);
fromDate.setHours(0,0,0,0);
const toDate = new Date(dateRange.to);
toDate.setHours(23,59,59,999);
```

### 2. N+1 Query Problem in Order Fetching
**File:** `src/hooks/useOrders.ts` (lines 61-76)

Orders are fetched, then each order's items are fetched individually in a `for` loop. With 100+ orders this creates 100+ sequential database calls, causing severe slowness.

**Fix:** Fetch all order items in a single query using `.in('order_id', orderIds)` and then map them to their orders in memory.

### 3. MDR Expense Created Even If Order Completion Fails
**File:** `src/hooks/useOrders.ts` (lines 126-129)

The MDR expense creation (`createMdrExpense`) is called after the status update succeeds, but if the `fetchOrders()` call after it fails, the user sees an error but the MDR expense was already created. More critically, if an order is moved to "completed" multiple times (e.g., completed → cancelled → completed), MDR expenses would be duplicated.

**Fix:** Add a check for existing MDR expenses for the same order before creating a new one, or track MDR creation on the order record.

---

## Medium Severity Issues

### 4. Order Details Page Always Shows "Awaiting Payment" Status
**File:** `src/pages/OrderDetailsPage.tsx` (line 359)

The status display is hardcoded as "Menunggu Pembayaran" / "Awaiting Payment" regardless of the actual `order.status`. Completed or cancelled orders still show this label.

**Fix:** Map `order.status` to the correct display label.

### 5. Payment Timeout Shows Even for Non-Pending Orders
**File:** `src/pages/OrderDetailsPage.tsx` (lines 148-149)

The 20-minute countdown and timeout page appear even for orders that are already completed/processing. A completed order viewed after 20 minutes shows the timeout page.

**Fix:** Only show the countdown and timeout for orders with `status === 'pending'`.

### 6. Stock Not Restored When Deleting an Order
**File:** `src/hooks/useOrders.ts` (lines 242-279)

`deleteOrder` deletes order items and the order but never restores stock if it was previously deducted. This causes permanent inventory loss.

**Fix:** Call `restore_stock_for_order` RPC before deleting, similar to how cancellation works.

### 7. CartContext Doesn't Include `is_hidden` / `is_sold_out` / `media` from DB
**File:** `src/contexts/CartContext.tsx` (lines 124-137)

The `fetchProducts` in CartContext doesn't map `is_hidden`, `is_sold_out`, or `media` fields, while `useProducts.ts` does. This inconsistency means the cart could allow adding hidden/sold-out products.

**Fix:** Align the CartContext product mapping with `useProducts.ts`.

### 8. Excessive `console.log` Statements in Production
Multiple files across hooks and contexts contain dozens of `console.log` calls that expose internal data (order details, user profiles, payment methods) to any user who opens DevTools.

**Fix:** Replace remaining `console.log` calls with the existing `logger` utility, which is environment-aware.

---

## Low Severity / Hardening

### 9. WhatsApp Number Hardcoded
**File:** `src/pages/OrderDetailsPage.tsx` (line 105)

The WhatsApp number `082120614748` is hardcoded rather than pulled from the website copy / settings. If you change your number, you'd need a code change.

### 10. No `order_items` Foreign Key Constraint on `order_id`
The `order_items.order_id` column references orders but there's no visible foreign key constraint in the schema. Orphaned order items could exist.

### 11. Payment Method Matched by `bank_name` String
**File:** `src/hooks/useOrders.ts` (line 159), `src/pages/OrderDetailsPage.tsx` (line 38)

Payment methods are matched by `bank_name` text rather than by UUID `id`. If a bank name is renamed, historical orders lose their payment method link and MDR lookup fails silently.

---

## Summary of Required Fixes

| # | Issue | Severity |
|---|-------|----------|
| 1 | Date filter mutates original dates | Critical |
| 2 | N+1 order items query | Critical (perf) |
| 3 | Duplicate MDR expenses possible | Critical |
| 4 | Hardcoded "Awaiting Payment" status | Medium |
| 5 | Timeout page shown for completed orders | Medium |
| 6 | Delete order doesn't restore stock | Medium |
| 7 | CartContext missing product fields | Medium |
| 8 | Console.log leaking data in production | Medium |
| 9 | Hardcoded WhatsApp number | Low |
| 10 | Missing FK on order_items | Low |
| 11 | Payment method matched by name not ID | Low |

---

## Implementation Plan

I would fix issues 1-8 in this pass:

1. **Fix date filter mutation** in `useOrderFilters.ts` — clone dates before `setHours`
2. **Batch order items fetch** in `useOrders.ts` — single query with `.in()` filter
3. **Deduplicate MDR expenses** in `useOrders.ts` — check for existing MDR expense for the order before creating
4. **Dynamic order status display** in `OrderDetailsPage.tsx` — map `order.status` to localized labels
5. **Conditional timeout** in `OrderDetailsPage.tsx` — only show timer for pending orders
6. **Restore stock on delete** in `useOrders.ts` — call `restore_stock_for_order` before deletion
7. **Align CartContext product mapping** — include `is_hidden`, `is_sold_out`, `media`
8. **Replace console.log with logger** across hooks

Items 9-11 are architectural and can be addressed in a follow-up.

