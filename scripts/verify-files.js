#!/usr/bin/env node
/**
 * File Existence Verification Script
 * Checks if all required files from the implementation plan exist
 */

const fs = require('fs');
const path = require('path');

const requiredFiles = {
  'Phase 1': [
    'supabase/migrations/027_fix_cycle_boundaries.sql',
    'app/components/customer/CreditsPanel.tsx',
  ],
  'Phase 2': [
    'supabase/migrations/035_bb_pause_subscription_rpc.sql',
    'supabase/migrations/036_bb_resume_subscription_rpc.sql',
    'supabase/migrations/037_bb_cancel_subscription_rpc.sql',
    'supabase/migrations/038_bb_auto_cancel_paused_rpc.sql',
    'lib/bb-subscriptions/bb-pause-actions.ts',
    'lib/bb-subscriptions/bb-cancel-actions.ts',
    'app/components/customer/PauseSubscriptionDialog.tsx',
    'app/components/customer/ResumeSubscriptionDialog.tsx',
    'app/components/customer/CancelSubscriptionDialog.tsx',
  ],
  'Phase 3': [
    'supabase/migrations/039_job_management_rpc.sql',
    'lib/jobs/job-utils.ts',
    'lib/jobs/renewal-job.ts',
    'lib/jobs/payment-retry-job.ts',
    'lib/jobs/credit-expiry-job.ts',
    'lib/jobs/trial-completion-job.ts',
    'lib/jobs/order-generation-job.ts',
    'lib/jobs/auto-cancel-paused-job.ts',
    'app/(dashboard)/admin/jobs/page.tsx',
    'app/(dashboard)/admin/jobs/JobsClient.tsx',
    'lib/admin/job-actions.ts',
  ],
  'Phase 4': [
    'supabase/migrations/041_add_payment_method_fields.sql',
    'supabase/migrations/042_add_payment_method_to_checkout.sql',
    'lib/payments/razorpay-upi-autopay.ts',
    'lib/payments/razorpay-renewal-charge.ts',
    'lib/payments/razorpay-refund.ts',
    'app/components/customer/PaymentMethodSelector.tsx',
    'app/components/customer/PaymentRetryDialog.tsx',
    'app/(dashboard)/customer/payments/page.tsx',
    'app/(dashboard)/customer/payments/PaymentsClient.tsx',
    'lib/utils/export-orders.ts',
  ],
};

const migrations = [
  '027_fix_cycle_boundaries.sql',
  '035_bb_pause_subscription_rpc.sql',
  '036_bb_resume_subscription_rpc.sql',
  '037_bb_cancel_subscription_rpc.sql',
  '038_bb_auto_cancel_paused_rpc.sql',
  '039_job_management_rpc.sql',
  '041_add_payment_method_fields.sql',
  '042_add_payment_method_to_checkout.sql',
];

function checkFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  return fs.existsSync(fullPath);
}

function checkMigration(migrationName) {
  const migrationPath = path.join(process.cwd(), 'supabase/migrations', migrationName);
  return fs.existsSync(migrationPath);
}

console.log('=== IMPLEMENTATION VERIFICATION REPORT ===\n');

let totalFiles = 0;
let foundFiles = 0;
let missingFiles = [];

Object.entries(requiredFiles).forEach(([phase, files]) => {
  console.log(`\n${phase}:`);
  console.log('─'.repeat(50));
  
  files.forEach(file => {
    totalFiles++;
    const exists = checkFile(file);
    if (exists) {
      console.log(`  ✓ ${file}`);
      foundFiles++;
    } else {
      console.log(`  ✗ ${file} - MISSING`);
      missingFiles.push(file);
    }
  });
});

console.log('\n=== MIGRATIONS CHECK ===');
console.log('─'.repeat(50));

let totalMigrations = 0;
let foundMigrations = 0;

migrations.forEach(migration => {
  totalMigrations++;
  const exists = checkMigration(migration);
  if (exists) {
    console.log(`  ✓ ${migration}`);
    foundMigrations++;
  } else {
    console.log(`  ✗ ${migration} - MISSING`);
  }
});

console.log('\n=== SUMMARY ===');
console.log('─'.repeat(50));
console.log(`Files: ${foundFiles}/${totalFiles} found (${Math.round((foundFiles/totalFiles)*100)}%)`);
console.log(`Migrations: ${foundMigrations}/${totalMigrations} found (${Math.round((foundMigrations/totalMigrations)*100)}%)`);

if (missingFiles.length > 0) {
  console.log('\n⚠️  MISSING FILES:');
  missingFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
} else {
  console.log('\n✅ All required files found!');
}

console.log('\n=== VERIFICATION COMPLETE ===');

