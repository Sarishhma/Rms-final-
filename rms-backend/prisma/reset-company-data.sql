-- ============================================================================
-- reset-company-data.sql — wipe ONE company's operational data, keep its
-- master data. Other companies are never touched. No TRUNCATE, no CASCADE.
--
--   ┌─────────────────────────────────────────────────────────────────────┐
--   │  CHOOSE THE COMPANY on the `v_company_id :=` line below.             │
--   │  Find it first:  SELECT id, name, slug FROM "Company";               │
--   └─────────────────────────────────────────────────────────────────────┘
--
-- PRESERVED for the chosen company (rows kept; DiningTable is only reset to a
-- clean state):
--   Company, User, DiningTable, Category, Subcategory,
--   MenuItem, MenuVariant, MenuAddon, KitchenStation
--   — including all kitchenStationId routing assignments + the default station.
--
-- DELETED for the chosen company only:
--   Orders / OrderItems / KOT tickets & items / Bills / Payments / Refunds,
--   Shifts & cash-drawer events, Customers, Audit logs, Idempotency keys,
--   Number sequences (this company's order/KOT/bill counters reset to 1),
--   Tax config, Table groups & splits, Daily stock, Refresh tokens (forces
--   re-login), and the entire Inventory module.
--
-- PostgreSQL. One atomic DO block (all-or-nothing). Deletes run child→parent so
-- every RESTRICT foreign key is satisfied — needs only normal write privileges.
-- ============================================================================

DO $$
DECLARE
  -- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼  SET THE TARGET COMPANY HERE  ▼▼▼▼▼▼▼▼▼▼▼▼▼▼
  v_company_id text := '00000000-0000-0000-0000-000000000000';
  -- or resolve by slug instead of pasting the id:
  --   v_company_id text := (SELECT id FROM "Company" WHERE slug = 'demo-company');
  -- ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
  cid text := v_company_id;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Company" WHERE id = cid) THEN
    RAISE EXCEPTION 'Company % does not exist — aborting, nothing deleted.', cid;
  END IF;

  -- Reset this company's dining tables: detach from soon-deleted orders and
  -- clear any orphaned OCCUPIED/BILLED status. (Only mutation to a kept table;
  -- drop this statement if you want table status left as-is.)
  UPDATE "DiningTable"
     SET "activeOrderId" = NULL, "status" = 'AVAILABLE'
   WHERE "companyId" = cid;

  -- ── Orders / KOT / Billing (children first) ──────────────────────────────
  DELETE FROM "OrderItemAddon"  WHERE "orderItemId" IN (SELECT id FROM "OrderItem" WHERE "orderId" IN (SELECT id FROM "Order" WHERE "companyId" = cid));
  DELETE FROM "KotItem"         WHERE "kotTicketId" IN (SELECT id FROM "KotTicket" WHERE "companyId" = cid);
  DELETE FROM "BillSplit"       WHERE "billId"      IN (SELECT id FROM "Bill"      WHERE "companyId" = cid);
  DELETE FROM "Refund"          WHERE "companyId" = cid;
  DELETE FROM "Payment"         WHERE "companyId" = cid;
  DELETE FROM "CashDrawerEvent" WHERE "companyId" = cid;
  DELETE FROM "OrderItem"       WHERE "orderId"     IN (SELECT id FROM "Order" WHERE "companyId" = cid);
  DELETE FROM "KotTicket"       WHERE "companyId" = cid;
  DELETE FROM "Bill"            WHERE "companyId" = cid;
  DELETE FROM "TableGroupMember" WHERE "tableGroupId" IN (SELECT id FROM "TableGroup" WHERE "companyId" = cid);
  DELETE FROM "TableSplit"      WHERE "companyId" = cid;
  DELETE FROM "TableGroup"      WHERE "companyId" = cid;
  DELETE FROM "Shift"           WHERE "companyId" = cid;
  DELETE FROM "Order"           WHERE "companyId" = cid;
  DELETE FROM "Customer"        WHERE "companyId" = cid;

  -- ── Stock snapshots tied to the menu ─────────────────────────────────────
  DELETE FROM "DailyStock"           WHERE "companyId" = cid;
  DELETE FROM "InventoryTransaction" WHERE "companyId" = cid;

  -- ── Inventory module (children first) ────────────────────────────────────
  DELETE FROM "StockMovement"           WHERE "companyId" = cid;
  DELETE FROM "StockBalance"            WHERE "companyId" = cid;
  DELETE FROM "StockBatch"              WHERE "companyId" = cid;
  DELETE FROM "InventoryAdjustmentItem" WHERE "adjustmentId" IN (SELECT id FROM "InventoryAdjustment" WHERE "companyId" = cid);
  DELETE FROM "InventoryPurchaseItem"   WHERE "purchaseId"   IN (SELECT id FROM "InventoryPurchase"   WHERE "companyId" = cid);
  DELETE FROM "StockOutItem"            WHERE "stockOutId"   IN (SELECT id FROM "StockOut"            WHERE "companyId" = cid);
  DELETE FROM "InventoryAdjustment"     WHERE "companyId" = cid;
  DELETE FROM "InventoryPurchase"       WHERE "companyId" = cid;
  DELETE FROM "StockOut"                WHERE "companyId" = cid;
  DELETE FROM "InventoryItem"           WHERE "companyId" = cid;
  DELETE FROM "InventoryUnitConversion" WHERE "companyId" = cid;
  DELETE FROM "InventorySupplier"       WHERE "companyId" = cid;
  DELETE FROM "InventoryUnit"           WHERE "companyId" = cid;
  DELETE FROM "InventorySetting"        WHERE "companyId" = cid;

  -- ── Misc company-scoped state ────────────────────────────────────────────
  DELETE FROM "AuditLog"       WHERE "companyId" = cid;
  DELETE FROM "IdempotencyKey" WHERE "companyId" = cid;
  DELETE FROM "NumberSequence" WHERE "companyId" = cid;
  DELETE FROM "TaxConfig"      WHERE "companyId" = cid;
  DELETE FROM "RefreshToken"   WHERE "userId" IN (SELECT id FROM "User" WHERE "companyId" = cid);

  RAISE NOTICE 'Operational data wiped for company %; master data preserved.', cid;
END $$;
