import { createClient } from '@supabase/supabase-js';

// Ortam değişkenine bakmıyoruz bile, adresi doğrudan taşa yazıyoruz!
const supabaseUrl = 'https://fesbupehxponusbwlewj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);