import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabaseClient] VITE_SUPABASE_URL или VITE_SUPABASE_ANON_KEY не се поставени. ' +
    'Копирај .env.example во .env во frontend/ папката и пополни ги вредностите.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
