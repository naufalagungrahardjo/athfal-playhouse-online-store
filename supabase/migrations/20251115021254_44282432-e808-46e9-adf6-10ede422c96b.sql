-- Add phone and address fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text;

-- Create RLS policy to allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Create RLS policy to allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (id = auth.uid());