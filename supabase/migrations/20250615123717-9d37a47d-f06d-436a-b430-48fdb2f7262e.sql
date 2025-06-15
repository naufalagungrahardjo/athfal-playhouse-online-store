
-- Enable RLS if not yet enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow each user to delete their own row based on auth.uid() matching id
CREATE POLICY "User can delete own account"
  ON public.users
  FOR DELETE
  USING (id = auth.uid());
