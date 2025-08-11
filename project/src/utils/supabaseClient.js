import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hikgivgyrdfwwscmfxkr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhpa2dpdmd5cmRmd3dzY21meGtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTA0NzMsImV4cCI6MjA3MDEyNjQ3M30.wnp-rbhfAltb40c8Wv17EfKJEEBve6qY_N69xtzKvvU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);