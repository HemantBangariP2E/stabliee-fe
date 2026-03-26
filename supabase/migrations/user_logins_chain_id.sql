-- Allow the same email (user_identifier) on multiple chains with different wallets.
-- Run in Supabase SQL editor.

ALTER TABLE user_logins ADD COLUMN IF NOT EXISTS chain_id TEXT;

-- Backfill existing rows (pick your default test network if unknown)
UPDATE user_logins SET chain_id = COALESCE(NULLIF(chain_id, ''), '84532') WHERE chain_id IS NULL OR chain_id = '';

-- If you had UNIQUE(user_identifier) only, drop it and replace with composite uniqueness:
-- ALTER TABLE user_logins DROP CONSTRAINT IF EXISTS user_logins_user_identifier_key;
-- ALTER TABLE user_logins DROP CONSTRAINT IF EXISTS user_logins_pkey; -- only if wrong
-- Then:
-- CREATE UNIQUE INDEX IF NOT EXISTS user_logins_user_identifier_chain_id_key
--   ON user_logins (lower(user_identifier), chain_id);

-- Supabase often uses unique constraints by name from the dashboard — adjust to match your table.
