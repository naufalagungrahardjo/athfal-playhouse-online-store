

## Fix: Duplicate Fund Sources in Analytics Dropdown

**Problem**: `allFundOptions` and `expFundMap` blindly merge `fundSources` and `paymentMethods`. Since `resolveFundSourceId` auto-creates fund source entries matching payment method names, entries like "Bank Hijrah" and "QRIS" appear twice.

**Fix** (single file: `AdminAnalytics.tsx`):

1. **`allFundOptions` (line 222-225)**: Filter out payment methods whose `bank_name` already exists in `fundSources`.

2. **`expFundMap` (line 215-220)**: Same deduplication — skip payment methods whose `bank_name` matches an existing fund source name.

Both changes are ~2-line additions using a `Set` of existing fund source names to skip duplicates.

