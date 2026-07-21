import { createClient } from '@supabase/supabase-js';

// 1. Ortam değişkenini alıyoruz
let rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fesbupehxponusbwlewj.supabase.co';

// 2. Eğer URL içinde kaç tane /rest/v1 geçerse geçsin hepsini söküp atıyoruz:
rawUrl = rawUrl.replace(/\/rest\/v1/g, '').replace(/\/$/, '');

// 3. Anon Key
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 4. Saf ve temiz domain ile istemciyi başlatıyoruz
export const supabase = createClient(rawUrl, supabaseAnonKey);