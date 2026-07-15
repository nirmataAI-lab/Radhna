-- Add unique constraint on Review to prevent duplicate reviews
CREATE UNIQUE INDEX "Review_customerId_foodItemId_key" ON "Review"("customerId", "foodItemId");
