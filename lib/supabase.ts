import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lhrefwohzexjeeriispb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxocmVmd29oemV4amVlcmlpc3BiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTIyMjcsImV4cCI6MjA4NzcyODIyN30.fLSCAJC0G8bul8gtvvSUh8VI2yxtbabljQsnQ6PIM0s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Spot = {
  id: string;
  user_id: string;
  name: string;
  neighborhood: string;
  style: string;
  note: string;
  address?: string;
  photo?: string;
  lat?: number;
  lng?: number;
  created_at?: string;
};
