
-- Create a public table to store homepage partner/collaborator logos
CREATE TABLE public.collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- (Optional best practice) Add index for sorting by created_at
CREATE INDEX idx_collaborators_created_at ON public.collaborators(created_at);

-- If you need to manage permissions, add more SQL below (for now, this table is public and fully readable/editable by your Supabase project).
