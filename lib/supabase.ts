import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

// URL sonunda /rest/v1 veya / varsa otomatik temizler
const cleanUrl = rawUrl
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/$/, '');

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(cleanUrl, supabaseAnonKey);