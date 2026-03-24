-- Add chain_id column to filter transactions by blockchain/network
-- Run this migration in your Supabase SQL editor

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS chain_id TEXT;

-- Optional: backfill existing rows with a default (e.g. Base Sepolia)
-- UPDATE transactions SET chain_id = '84532' WHERE chain_id IS NULL;
