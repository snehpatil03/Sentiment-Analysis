-- Initial setup to trigger types generation
-- This creates a simple table to ensure the database schema exists

CREATE TABLE IF NOT EXISTS public._schema_init (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public._schema_init ENABLE ROW LEVEL SECURITY;

-- This is just a placeholder table to trigger the types generation
