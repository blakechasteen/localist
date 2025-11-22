-- Database Migration: Add Push Notification Fields to Users Table
-- Run with: psql -U localist -d localist -f backend/migrations/001_add_push_notifications.sql

BEGIN;

-- Add expo_push_token column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS expo_push_token VARCHAR(100);

-- Add notification preference columns (default TRUE)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS notifications_messages BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notifications_bulletins BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notifications_recommendations BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notifications_reviews BOOLEAN DEFAULT TRUE;

-- Set default values for existing rows
UPDATE users
SET
    notifications_messages = TRUE,
    notifications_bulletins = TRUE,
    notifications_recommendations = TRUE,
    notifications_reviews = TRUE
WHERE
    notifications_messages IS NULL
    OR notifications_bulletins IS NULL
    OR notifications_recommendations IS NULL
    OR notifications_reviews IS NULL;

COMMIT;

-- Verify migration
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN (
    'expo_push_token',
    'notifications_messages',
    'notifications_bulletins',
    'notifications_recommendations',
    'notifications_reviews'
);
