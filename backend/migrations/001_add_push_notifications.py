"""
Database Migration: Add Push Notification Fields to Users Table

This migration adds push notification support to the User model.

New fields:
- expo_push_token: Store Expo push token for notifications
- notifications_messages: Enable/disable message notifications
- notifications_bulletins: Enable/disable bulletin notifications
- notifications_recommendations: Enable/disable recommendation notifications
- notifications_reviews: Enable/disable review response notifications

Usage:
    python backend/migrations/001_add_push_notifications.py

Or run manually:
    psql -U localist -d localist -f backend/migrations/001_add_push_notifications.sql
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from backend.database import engine


def upgrade():
    """Apply migration: Add push notification fields to users table."""
    print("🔄 Running migration: Add push notification fields to users...")

    with engine.connect() as conn:
        try:
            # Check if columns already exist
            result = conn.execute(text("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'users'
                AND column_name = 'expo_push_token';
            """))

            if result.fetchone():
                print("⚠️  Migration already applied (expo_push_token column exists)")
                return

            # Add expo_push_token column
            conn.execute(text("""
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS expo_push_token VARCHAR(100);
            """))
            print("✅ Added expo_push_token column")

            # Add notification preference columns (default TRUE)
            conn.execute(text("""
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS notifications_messages BOOLEAN DEFAULT TRUE,
                ADD COLUMN IF NOT EXISTS notifications_bulletins BOOLEAN DEFAULT TRUE,
                ADD COLUMN IF NOT EXISTS notifications_recommendations BOOLEAN DEFAULT TRUE,
                ADD COLUMN IF NOT EXISTS notifications_reviews BOOLEAN DEFAULT TRUE;
            """))
            print("✅ Added notification preference columns")

            # Commit changes
            conn.commit()

            print("✅ Migration completed successfully!")

        except Exception as e:
            print(f"❌ Migration failed: {e}")
            conn.rollback()
            raise


def downgrade():
    """Rollback migration: Remove push notification fields from users table."""
    print("🔄 Rolling back migration: Remove push notification fields...")

    with engine.connect() as conn:
        try:
            # Remove columns
            conn.execute(text("""
                ALTER TABLE users
                DROP COLUMN IF EXISTS expo_push_token,
                DROP COLUMN IF EXISTS notifications_messages,
                DROP COLUMN IF EXISTS notifications_bulletins,
                DROP COLUMN IF EXISTS notifications_recommendations,
                DROP COLUMN IF EXISTS notifications_reviews;
            """))

            # Commit changes
            conn.commit()

            print("✅ Migration rollback completed!")

        except Exception as e:
            print(f"❌ Rollback failed: {e}")
            conn.rollback()
            raise


if __name__ == "__main__":
    """Run migration when executed as script."""
    import argparse

    parser = argparse.ArgumentParser(description='Database migration: Add push notification fields')
    parser.add_argument(
        '--downgrade',
        action='store_true',
        help='Rollback this migration'
    )

    args = parser.parse_args()

    if args.downgrade:
        downgrade()
    else:
        upgrade()
