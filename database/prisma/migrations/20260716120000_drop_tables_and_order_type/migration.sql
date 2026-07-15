-- Drop table system + OrderType (dine-in removed; all orders are takeaway)
-- and add performance indexes on Order.
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_tableId_fkey";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "tableId";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "orderType";
DROP TABLE IF EXISTS "Table";
DROP TYPE IF EXISTS "OrderType";

CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX IF NOT EXISTS "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_customerId_createdAt_idx" ON "Order"("customerId", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
