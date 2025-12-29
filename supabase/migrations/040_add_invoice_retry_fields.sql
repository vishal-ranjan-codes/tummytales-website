-- =====================================================
-- BELLYBOX - ADD INVOICE RETRY TRACKING FIELDS
-- Migration: 040_add_invoice_retry_fields.sql
-- Description: Add retry_count and last_retry_at to bb_invoices for payment retry tracking
-- =====================================================

-- Add retry tracking columns to bb_invoices
ALTER TABLE bb_invoices
ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMPTZ;

-- Add index for efficient retry queries
CREATE INDEX IF NOT EXISTS idx_bb_invoices_retry_tracking
ON bb_invoices(status, last_retry_at)
WHERE status = 'pending_payment';

-- Add comment
COMMENT ON COLUMN bb_invoices.retry_count IS 'Number of payment retry attempts made';
COMMENT ON COLUMN bb_invoices.last_retry_at IS 'Timestamp of last payment retry attempt';

