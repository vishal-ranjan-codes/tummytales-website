#!/bin/bash
# =====================================================
# STEP 4: Repair Migration History
# Mark migrations 021-028 as reverted in Supabase
# =====================================================

echo "Repairing migration history for migrations 021-028..."

npx supabase migration repair --status reverted 021 022 023 024 025 026 027 028

echo ""
echo "Done! Check the output above for any errors."
echo ""
echo "Next step: Verify migration status with: npx supabase migration list"

