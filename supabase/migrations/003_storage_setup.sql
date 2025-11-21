-- =====================================================
-- BELLYBOX - STORAGE BUCKETS & POLICIES
-- Migration: 003_storage_setup.sql
-- Description: Create storage buckets for media and documents
-- =====================================================

-- =====================================================
-- CREATE STORAGE BUCKETS
-- =====================================================

-- Vendor Media (public) - Profile images, cover images, gallery, intro videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'vendor-media',
    'vendor-media',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
);

-- Vendor Docs (private) - FSSAI certificates, KYC documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'vendor-docs',
    'vendor-docs',
    false,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
);

-- Rider Docs (private) - Driving license, Aadhaar
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'rider-docs',
    'rider-docs',
    false,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
);

-- Profile Photos (public) - User profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-photos',
    'profile-photos',
    true,
    2097152, -- 2MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- =====================================================
-- VENDOR-MEDIA BUCKET POLICIES
-- =====================================================

-- Allow public to read vendor media (for active vendors)
CREATE POLICY "vendor_media_public_read" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'vendor-media');

-- Allow vendors to upload their own media
CREATE POLICY "vendor_media_vendor_upload" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'vendor-media' AND
        auth.uid()::text = (storage.foldername(name))[1] AND
        EXISTS (
            SELECT 1 FROM vendors
            WHERE user_id = auth.uid()
        )
    );

-- Allow vendors to update their own media
CREATE POLICY "vendor_media_vendor_update" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'vendor-media' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow vendors to delete their own media; Admin can delete all
CREATE POLICY "vendor_media_vendor_delete" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'vendor-media' AND (
            auth.uid()::text = (storage.foldername(name))[1] OR
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
        )
    );

-- =====================================================
-- VENDOR-DOCS BUCKET POLICIES
-- =====================================================

-- Vendors can read their own docs; Admin can read all
CREATE POLICY "vendor_docs_read_own_or_admin" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'vendor-docs' AND (
            auth.uid()::text = (storage.foldername(name))[1] OR
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
        )
    );

-- Vendors can upload their own docs
CREATE POLICY "vendor_docs_vendor_upload" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'vendor-docs' AND
        auth.uid()::text = (storage.foldername(name))[1] AND
        EXISTS (
            SELECT 1 FROM vendors
            WHERE user_id = auth.uid()
        )
    );

-- Vendors can update their own docs
CREATE POLICY "vendor_docs_vendor_update" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'vendor-docs' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Only admin can delete vendor docs
CREATE POLICY "vendor_docs_admin_delete" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'vendor-docs' AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
    );

-- =====================================================
-- RIDER-DOCS BUCKET POLICIES
-- =====================================================

-- Riders can read their own docs; Admin can read all
CREATE POLICY "rider_docs_read_own_or_admin" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'rider-docs' AND (
            auth.uid()::text = (storage.foldername(name))[1] OR
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
        )
    );

-- Riders can upload their own docs
CREATE POLICY "rider_docs_rider_upload" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'rider-docs' AND
        auth.uid()::text = (storage.foldername(name))[1] AND
        EXISTS (
            SELECT 1 FROM riders
            WHERE user_id = auth.uid()
        )
    );

-- Riders can update their own docs
CREATE POLICY "rider_docs_rider_update" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'rider-docs' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Only admin can delete rider docs
CREATE POLICY "rider_docs_admin_delete" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'rider-docs' AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
    );

-- =====================================================
-- PROFILE-PHOTOS BUCKET POLICIES
-- =====================================================

-- Allow public to read profile photos
CREATE POLICY "profile_photos_public_read" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'profile-photos');

-- Users can upload their own profile photos
CREATE POLICY "profile_photos_user_upload" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'profile-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can update their own profile photos
CREATE POLICY "profile_photos_user_update" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'profile-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own profile photos
CREATE POLICY "profile_photos_user_delete" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'profile-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

