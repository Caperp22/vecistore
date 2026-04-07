import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Esto es lo que evita el logout al refrescar
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'veci-auth-token', // Un nombre único para tu tienda
  },
});