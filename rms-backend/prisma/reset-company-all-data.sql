-- ============================================================================
-- reset-company-all-data.sql — wipe ALL data for ONE company (Right to Forget)
--
--   ┌─────────────────────────────────────────────────────────────────────┐
--   │  CHOOSE THE COMPANY on the `v_company_id :=` line below.             │
--   │  Find it first:  SELECT id, name, slug FROM "Company";               │
--   └─────────────────────────────────────────────────────────────────────┘
--
-- DELETED for the chosen company (ALL operational AND master data):
--   1. Operational Data:
--      Orders / OrderItems / KOT tickets & items / Bills / Payments / Refunds,
--      Shifts & cash-drawer events, Customers, Audit logs, Idempotency keys,
--      Number sequences, Tax config, Table groups & splits, Daily stock,
--      Refresh tokens, and the entire Inventory module.
--      (Also cleans up cross-tenant test records created by this company's users
--       to prevent foreign key constraint violations during user deletion.)
--
--   2. Master Data & Company Record (Right to be Forgotten):
--      _StationStaff assignments, MenuAddons, MenuVariants, MenuItems,
--      Subcategories, Categories, KitchenStations, DiningTables, Users,
--      and finally the Company record itself.
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

  -- Create temp tables to track target users and orders (including cross-tenant
  -- orders/records created by this company's users in test environments)
  CREATE TEMP TABLE _target_users ON COMMIT DROP AS
  SELECT id FROM "User" WHERE "companyId" = cid;

  CREATE TEMP TABLE _target_orders ON COMMIT DROP AS
  SELECT id FROM "Order"
   WHERE "companyId" = cid
      OR "createdById" IN (SELECT id FROM _target_users);

  -- Detach dining tables from soon-to-be-deleted orders to prevent FK violations
  UPDATE "DiningTable"
     SET "activeOrderId" = NULL, "status" = 'AVAILABLE'
   WHERE "companyId" = cid OR "activeOrderId" IN (SELECT id FROM _target_orders);

  -- Null out nullable user references in other records before deleting users
  UPDATE "InventoryUnit"        SET "createdById"   = NULL WHERE "createdById"   IN (SELECT id FROM _target_users);
  UPDATE "InventoryItem"        SET "createdById"   = NULL WHERE "createdById"   IN (SELECT id FROM _target_users);
  UPDATE "InventorySupplier"    SET "createdById"   = NULL WHERE "createdById"   IN (SELECT id FROM _target_users);
  UPDATE "AuditLog"             SET "actorId"       = NULL WHERE "actorId"       IN (SELECT id FROM _target_users);
  UPDATE "Shift"                SET "closedById"    = NULL WHERE "closedById"    IN (SELECT id FROM _target_users);
  UPDATE "InventoryTransaction" SET "createdById"   = NULL WHERE "createdById"   IN (SELECT id FROM _target_users);
  UPDATE "StockMovement"        SET "createdById"   = NULL WHERE "createdById"   IN (SELECT id FROM _target_users);

  UPDATE "InventoryPurchase"
     SET "createdById"   = CASE WHEN "createdById"   IN (SELECT id FROM _target_users) THEN NULL ELSE "createdById" END,
         "postedById"    = CASE WHEN "postedById"    IN (SELECT id FROM _target_users) THEN NULL ELSE "postedById" END,
         "cancelledById" = CASE WHEN "cancelledById" IN (SELECT id FROM _target_users) THEN NULL ELSE "cancelledById" END
   WHERE "createdById" IN (SELECT id FROM _target_users)
      OR "postedById" IN (SELECT id FROM _target_users)
      OR "cancelledById" IN (SELECT id FROM _target_users);

  UPDATE "StockOut"
     SET "createdById"   = CASE WHEN "createdById"   IN (SELECT id FROM _target_users) THEN NULL ELSE "createdById" END,
         "postedById"    = CASE WHEN "postedById"    IN (SELECT id FROM _target_users) THEN NULL ELSE "postedById" END,
         "cancelledById" = CASE WHEN "cancelledById" IN (SELECT id FROM _target_users) THEN NULL ELSE "cancelledById" END
   WHERE "createdById" IN (SELECT id FROM _target_users)
      OR "postedById" IN (SELECT id FROM _target_users)
      OR "cancelledById" IN (SELECT id FROM _target_users);

  UPDATE "InventoryAdjustment"
     SET "createdById"   = CASE WHEN "createdById"   IN (SELECT id FROM _target_users) THEN NULL ELSE "createdById" END,
         "postedById"    = CASE WHEN "postedById"    IN (SELECT id FROM _target_users) THEN NULL ELSE "postedById" END,
         "cancelledById" = CASE WHEN "cancelledById" IN (SELECT id FROM _target_users) THEN NULL ELSE "cancelledById" END
   WHERE "createdById" IN (SELECT id FROM _target_users)
      OR "postedById" IN (SELECT id FROM _target_users)
      OR "cancelledById" IN (SELECT id FROM _target_users);

  -- ── Orders / KOT / Billing (children first) ──────────────────────────────
  DELETE FROM "OrderItemAddon"   WHERE "orderItemId" IN (SELECT id FROM "OrderItem" WHERE "orderId" IN (SELECT id FROM _target_orders));
  DELETE FROM "KotItem"          WHERE "kotTicketId" IN (SELECT id FROM "KotTicket" WHERE "orderId" IN (SELECT id FROM _target_orders) OR "companyId" = cid);
  DELETE FROM "BillSplit"        WHERE "billId"      IN (SELECT id FROM "Bill"      WHERE "orderId" IN (SELECT id FROM _target_orders) OR "companyId" = cid);
  DELETE FROM "Refund"           WHERE "companyId" = cid OR "processedById" IN (SELECT id FROM _target_users);
  DELETE FROM "Payment"          WHERE "companyId" = cid OR "receivedById"  IN (SELECT id FROM _target_users) OR "billId" IN (SELECT id FROM "Bill" WHERE "orderId" IN (SELECT id FROM _target_orders));
  DELETE FROM "CashDrawerEvent"  WHERE "companyId" = cid OR "actorId"       IN (SELECT id FROM _target_users);
  DELETE FROM "OrderItem"        WHERE "orderId"     IN (SELECT id FROM _target_orders);
  DELETE FROM "KotTicket"        WHERE "orderId"     IN (SELECT id FROM _target_orders) OR "companyId" = cid;
  DELETE FROM "Bill"             WHERE "orderId"     IN (SELECT id FROM _target_orders) OR "companyId" = cid;
  DELETE FROM "TableGroupMember" WHERE "tableGroupId" IN (SELECT id FROM "TableGroup" WHERE "orderId" IN (SELECT id FROM _target_orders) OR "companyId" = cid OR "combinedById" IN (SELECT id FROM _target_users));
  DELETE FROM "TableSplit"       WHERE "companyId" = cid OR "splitById" IN (SELECT id FROM _target_users) OR "sourceOrderId" IN (SELECT id FROM _target_orders) OR "newOrderId" IN (SELECT id FROM _target_orders);
  DELETE FROM "TableGroup"       WHERE "orderId"     IN (SELECT id FROM _target_orders) OR "companyId" = cid OR "combinedById" IN (SELECT id FROM _target_users);
  DELETE FROM "Shift"            WHERE "companyId" = cid OR "openedById"    IN (SELECT id FROM _target_users);
  DELETE FROM "Order"            WHERE id            IN (SELECT id FROM _target_orders);
  DELETE FROM "Customer"         WHERE "companyId" = cid;

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
  DELETE FROM "RefreshToken"   WHERE "userId" IN (SELECT id FROM _target_users);

  -- ── Master data & Company (Right to be Forgotten) ────────────────────────
  DELETE FROM "_StationStaff"   WHERE "A" IN (SELECT id FROM "KitchenStation" WHERE "companyId" = cid) OR "B" IN (SELECT id FROM _target_users);
  DELETE FROM "MenuAddon"       WHERE "companyId" = cid;
  DELETE FROM "MenuVariant"     WHERE "companyId" = cid;
  DELETE FROM "MenuItem"        WHERE "companyId" = cid;
  DELETE FROM "Subcategory"     WHERE "companyId" = cid;
  DELETE FROM "Category"        WHERE "companyId" = cid;
  DELETE FROM "KitchenStation"  WHERE "companyId" = cid;
  DELETE FROM "DiningTable"     WHERE "companyId" = cid;
  DELETE FROM "User"            WHERE id IN (SELECT id FROM _target_users);
  DELETE FROM "Company"         WHERE "id" = cid;

  DROP TABLE IF EXISTS _target_orders;
  DROP TABLE IF EXISTS _target_users;

  RAISE NOTICE 'All data (operational & master) wiped and company % deleted.', cid;
END $$;
