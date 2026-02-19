-- Add email field to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Update existing profiles with email from auth.users if available
-- (This needs to be run with service role privileges)
-- Note: Run this in the Supabase SQL editor with proper access
