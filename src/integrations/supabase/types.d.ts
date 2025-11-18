export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Temporary lightweight types until the auto-generated types.ts is available.
// When src/integrations/supabase/types.ts is created by the backend, this .d.ts
// can be removed safely.
export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>
  };
};
