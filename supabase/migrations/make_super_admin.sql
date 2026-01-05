-- Make vranjan257@gmail.com a Super Admin
-- Run this in your Supabase SQL Editor

UPDATE profiles
SET 
  is_super_admin = TRUE,
  role = 'super_admin'
WHERE email = 'vranjan257@gmail.com';

-- Verify the update
SELECT id, email, full_name, role, is_super_admin
FROM profiles
WHERE email = 'vranjan257@gmail.com';
