-- =====================================================
-- BELLYBOX - ADD PAYMENT METHOD FIELDS
-- Migration: 041_add_payment_method_fields.sql
-- Description: Add payment method, UPI Autopay mandate, and refund tracking fields
-- =====================================================

-- Add payment method fields to bb_subscription_groups
ALTER TABLE bb_subscription_groups
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_mandate_id TEXT,
ADD COLUMN IF NOT EXISTS mandate_status TEXT,
ADD COLUMN IF NOT EXISTS mandate_expires_at TIMESTAMPTZ;

-- Add check constraints for payment method fields
ALTER TABLE bb_subscription_groups
DROP CONSTRAINT IF EXISTS bb_subscription_groups_payment_method_check;

ALTER TABLE bb_subscription_groups
ADD CONSTRAINT bb_subscription_groups_payment_method_check
CHECK (payment_method IN ('manual', 'upi_autopay') OR payment_method IS NULL);

ALTER TABLE bb_subscription_groups
DROP CONSTRAINT IF EXISTS bb_subscription_groups_mandate_status_check;

ALTER TABLE bb_subscription_groups
ADD CONSTRAINT bb_subscription_groups_mandate_status_check
CHECK (mandate_status IN ('active', 'expired', 'cancelled', 'failed') OR mandate_status IS NULL);

-- Add indexes for payment method queries
CREATE INDEX IF NOT EXISTS idx_bb_subscription_groups_payment_method
ON bb_subscription_groups(payment_method)
WHERE payment_method IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bb_subscription_groups_mandate_status
ON bb_subscription_groups(mandate_status, mandate_expires_at)
WHERE mandate_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bb_subscription_groups_razorpay_customer
ON bb_subscription_groups(razorpay_customer_id)
WHERE razorpay_customer_id IS NOT NULL;

-- Add refund fields to bb_invoices (since payments table may not exist or may be separate)
ALTER TABLE bb_invoices
ADD COLUMN IF NOT EXISTS refund_id TEXT,
ADD COLUMN IF NOT EXISTS refund_status TEXT,
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- Add check constraint for refund status
ALTER TABLE bb_invoices
DROP CONSTRAINT IF EXISTS bb_invoices_refund_status_check;

ALTER TABLE bb_invoices
ADD CONSTRAINT bb_invoices_refund_status_check
CHECK (refund_status IN ('pending', 'processed', 'failed') OR refund_status IS NULL);

-- Add index for refund queries
CREATE INDEX IF NOT EXISTS idx_bb_invoices_refund_status
ON bb_invoices(refund_status, refunded_at)
WHERE refund_status IS NOT NULL;

-- Add comments
COMMENT ON COLUMN bb_subscription_groups.payment_method IS 'Payment method: manual or upi_autopay';
COMMENT ON COLUMN bb_subscription_groups.razorpay_customer_id IS 'Razorpay customer ID for UPI Autopay';
COMMENT ON COLUMN bb_subscription_groups.razorpay_mandate_id IS 'Razorpay UPI Autopay mandate ID';
COMMENT ON COLUMN bb_subscription_groups.mandate_status IS 'Status of UPI Autopay mandate: active, expired, cancelled, failed';
COMMENT ON COLUMN bb_subscription_groups.mandate_expires_at IS 'Expiry date of UPI Autopay mandate';

COMMENT ON COLUMN bb_invoices.refund_id IS 'Razorpay refund ID';
COMMENT ON COLUMN bb_invoices.refund_status IS 'Refund status: pending, processed, failed';
COMMENT ON COLUMN bb_invoices.refund_amount IS 'Refund amount in currency';
COMMENT ON COLUMN bb_invoices.refunded_at IS 'Timestamp when refund was processed';

