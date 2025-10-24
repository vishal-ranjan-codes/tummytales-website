-- =====================================================
-- TUMMY TALES - INITIAL DATABASE SCHEMA
-- Migration: 001_initial_schema.sql
-- Description: Core tables for multi-role food delivery platform
-- =====================================================

-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

-- Address labels
CREATE TYPE address_label AS ENUM ('pg', 'home', 'office', 'kitchen');

-- Vendor status
CREATE TYPE vendor_status AS ENUM ('pending', 'active', 'unavailable', 'suspended');

-- KYC status
CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected');

-- Meal slots
CREATE TYPE meal_slot AS ENUM ('breakfast', 'lunch', 'dinner');

-- Vehicle types
CREATE TYPE vehicle_type AS ENUM ('bike', 'ev_bike', 'ev_truck', 'other');

-- Rider status
CREATE TYPE rider_status AS ENUM ('active', 'off', 'pending', 'suspended');

-- Vendor media types
CREATE TYPE vendor_media_type AS ENUM ('profile', 'cover', 'gallery', 'intro_video');

-- Vendor document types
CREATE TYPE vendor_doc_type AS ENUM ('fssai', 'kyc_id_front', 'kyc_id_back', 'other');

-- Rider document types
CREATE TYPE rider_doc_type AS ENUM ('driving_license', 'aadhaar', 'other');

-- =====================================================
-- CORE IDENTITY & GEOGRAPHY TABLES
-- =====================================================

-- Zones (Operational areas like Delhi NCR zones)
CREATE TABLE zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    polygon JSONB, -- GeoJSON polygon for zone boundaries
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for active zones
CREATE INDEX idx_zones_active ON zones(active);

-- Profiles (Extended user data linked to auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    photo_url TEXT,
    roles TEXT[] NOT NULL DEFAULT ARRAY['customer']::TEXT[], -- Array of roles: customer, vendor, rider, admin
    default_role TEXT NOT NULL DEFAULT 'customer',
    last_used_role TEXT,
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for profiles
CREATE INDEX idx_profiles_roles ON profiles USING GIN(roles);
CREATE INDEX idx_profiles_zone ON profiles(zone_id);

-- Addresses (User addresses with geocoding)
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    label address_label NOT NULL DEFAULT 'home',
    line1 TEXT NOT NULL,
    line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for addresses
CREATE INDEX idx_addresses_user ON addresses(user_id);
CREATE INDEX idx_addresses_default ON addresses(user_id, is_default);

-- =====================================================
-- VENDOR TABLES
-- =====================================================

-- Vendors (Home chef / tiffin vendor profiles)
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    slug TEXT UNIQUE,
    display_name TEXT NOT NULL,
    bio TEXT,
    fssai_no TEXT,
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    kitchen_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
    veg_only BOOLEAN NOT NULL DEFAULT false,
    capacity_breakfast INTEGER NOT NULL DEFAULT 0,
    capacity_lunch INTEGER NOT NULL DEFAULT 0,
    capacity_dinner INTEGER NOT NULL DEFAULT 0,
    status vendor_status NOT NULL DEFAULT 'pending',
    kyc_status kyc_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    rating_avg DECIMAL(3, 2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for vendors
CREATE INDEX idx_vendors_user ON vendors(user_id);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_zone ON vendors(zone_id);
CREATE INDEX idx_vendors_slug ON vendors(slug);
CREATE INDEX idx_vendors_active ON vendors(status) WHERE status = 'active';

-- Vendor Media (Public images and videos)
CREATE TABLE vendor_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    media_type vendor_media_type NOT NULL,
    url TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for vendor media
CREATE INDEX idx_vendor_media_vendor ON vendor_media(vendor_id);
CREATE INDEX idx_vendor_media_type ON vendor_media(vendor_id, media_type);

-- Vendor Documents (Private KYC/FSSAI documents)
CREATE TABLE vendor_docs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    doc_type vendor_doc_type NOT NULL,
    url TEXT NOT NULL,
    verified_by_admin BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMPTZ,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for vendor docs
CREATE INDEX idx_vendor_docs_vendor ON vendor_docs(vendor_id);

-- Meals (Menu items per slot)
CREATE TABLE meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    slot meal_slot NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    items TEXT[] NOT NULL DEFAULT '{}', -- Array of item names
    is_veg BOOLEAN NOT NULL DEFAULT true,
    image_url TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for meals
CREATE INDEX idx_meals_vendor ON meals(vendor_id);
CREATE INDEX idx_meals_vendor_slot ON meals(vendor_id, slot);
CREATE INDEX idx_meals_active ON meals(vendor_id, active);

-- Ratings (Vendor ratings - scaffold for Phase 2+)
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    consumer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID, -- Will be linked to orders table in Phase 2
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for ratings
CREATE INDEX idx_ratings_vendor ON ratings(vendor_id);
CREATE INDEX idx_ratings_consumer ON ratings(consumer_id);

-- =====================================================
-- RIDER TABLES
-- =====================================================

-- Riders (Delivery rider profiles)
CREATE TABLE riders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    vehicle_type vehicle_type NOT NULL DEFAULT 'bike',
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    status rider_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for riders
CREATE INDEX idx_riders_user ON riders(user_id);
CREATE INDEX idx_riders_zone ON riders(zone_id);
CREATE INDEX idx_riders_status ON riders(status);

-- Rider Documents (DL/Aadhaar documents)
CREATE TABLE rider_docs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
    doc_type rider_doc_type NOT NULL,
    url TEXT NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMPTZ,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for rider docs
CREATE INDEX idx_rider_docs_rider ON rider_docs(rider_id);

-- =====================================================
-- AUDIT & OPERATIONS TABLES
-- =====================================================

-- Audit Log (Track all privileged actions)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_zones_updated_at BEFORE UPDATE ON zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON meals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_riders_updated_at BEFORE UPDATE ON riders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATABASE FUNCTIONS
-- =====================================================

-- Function to auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.phone,
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update vendor rating
CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE vendors
    SET 
        rating_avg = (
            SELECT ROUND(AVG(score)::numeric, 2)
            FROM ratings
            WHERE vendor_id = NEW.vendor_id
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM ratings
            WHERE vendor_id = NEW.vendor_id
        )
    WHERE id = NEW.vendor_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update vendor rating after new rating
CREATE TRIGGER on_rating_created
    AFTER INSERT ON ratings
    FOR EACH ROW EXECUTE FUNCTION update_vendor_rating();

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION check_user_role(user_id UUID, role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id AND role = ANY(roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a role to user
CREATE OR REPLACE FUNCTION add_user_role(user_id UUID, role TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET roles = array_append(roles, role)
    WHERE id = user_id AND NOT (role = ANY(roles));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove a role from user
CREATE OR REPLACE FUNCTION remove_user_role(user_id UUID, role TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET roles = array_remove(roles, role)
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Ensure only one default address per user
CREATE UNIQUE INDEX idx_addresses_one_default_per_user 
ON addresses(user_id) 
WHERE is_default = true;

-- Ensure vendor slug is lowercase and URL-friendly
CREATE OR REPLACE FUNCTION validate_vendor_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NOT NULL AND NEW.slug !~ '^[a-z0-9-]+$' THEN
        RAISE EXCEPTION 'Vendor slug must contain only lowercase letters, numbers, and hyphens';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_vendor_slug_trigger
    BEFORE INSERT OR UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION validate_vendor_slug();

