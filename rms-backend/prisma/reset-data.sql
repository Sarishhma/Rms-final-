-- ============================================================================
-- reset-data.sql — wipe all operational/transactional data, keep master data.
--
-- PRESERVED (rows untouched; DiningTable is only detached from deleted orders):
--   Company, User, DiningTable, Category, Subcategory,
--   MenuItem, MenuVariant, MenuAddon, KitchenStation
--   — including every kitchenStationId routing assignment on the menu tables
--     and the company default station.
--
-- DELETED (all rows, all tenants):
--   Orders / OrderItems / KOT tickets & items / Bills / Payments / Refunds,
--   Shifts & cash-drawer events, Customers, Audit logs, Idempotency keys,
--   Number sequences (order/KOT/bill counters reset to 1), Tax config,
--   Table groups & splits, Daily stock, Refresh tokens, and the entire
--   Inventory module (units, conversions, items, suppliers, purchases,
--   stock-outs, adjustments, movements, balances, batches, settings).
--
-- PostgreSQL. Idempotent. One transaction — all-or-nothing.
-- Requires privileges to ALTER TABLE (schema owner / admin).
--
-- Scope: this resets EVERY tenant. To reset a single company instead, replace
-- the TRUNCATEs with company-filtered DELETEs (ask if you need that variant).
-- ============================================================================

BEGIN;

-- 1. DiningTable.activeOrderId is the ONLY foreign key from a preserved table
--    into deleted data. Detach it (and reset any now-orphaned table status) so
--    the wipe leaves no dangling reference behind.
UPDATE "DiningTable"
   SET "activeOrderId" = NULL,
       "status"        = 'AVAILABLE'
 WHERE "activeOrderId" IS NOT NULL
    OR "status" <> 'AVAILABLE';

-- 2. Drop that single FK for the duration of the wipe. Without this, TRUNCATE
--    would either error ("DiningTable" references "Order") or, with CASCADE,
--    truncate the preserved "DiningTable" itself. Recreated identically in 4.
ALTER TABLE "DiningTable" DROP CONSTRAINT "DiningTable_activeOrderId_fkey";

-- 3. Wipe every non-preserved table. No CASCADE: after step 2 nothing outside
--    this set references any table in it, and all inter-references are within
--    the set. RESTART IDENTITY is a no-op today (UUID PKs) but future-proofs
--    against any serial column.
TRUNCATE TABLE
  "OrderItemAddon",
  "OrderItem",
  "KotItem",
  "KotTicket",
  "BillSplit",
  "Bill",
  "Payment",
  "Refund",
  "Order",
  "CashDrawerEvent",
  "Shift",
  "AuditLog",
  "Customer",
  "NumberSequence",
  "IdempotencyKey",
  "TaxConfig",
  "RefreshToken",
  "TableGroupMember",
  "TableGroup",
  "TableSplit",
  "DailyStock",
  "InventoryTransaction",
  "InventoryPurchaseItem",
  "InventoryPurchase",
  "StockOutItem",
  "StockOut",
  "InventoryAdjustmentItem",
  "InventoryAdjustment",
  "StockMovement",
  "StockBalance",
  "StockBatch",
  "InventoryItem",
  "InventoryUnitConversion",
  "InventoryUnit",
  "InventorySupplier",
  "InventorySetting"
RESTART IDENTITY;

-- 4. Restore the DiningTable -> Order foreign key exactly as before.
ALTER TABLE "DiningTable"
  ADD CONSTRAINT "DiningTable_activeOrderId_fkey"
  FOREIGN KEY ("activeOrderId") REFERENCES "Order"("id")
  ON UPDATE CASCADE ON DELETE SET NULL;

COMMIT;
