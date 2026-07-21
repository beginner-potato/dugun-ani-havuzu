import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { groomName, brideName, slug, storageDuration } = body;

    // Temiz ve benzersiz slug oluştur (Çakışma riskini sıfıra indirmek için)
    let cleanSlug = (slug || `${groomName}-${brideName}`)
      .toLowerCase()
      .trim()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');

    // Eğer slug boş kaldıysa varsayılan ver
    if (!cleanSlug) {
      cleanSlug = `dugun-${Date.now().toString().slice(-4)}`;
    }

    // Veritabanında slug kontrolü yap
    const { data: existing } = await supabase
      .from('weddings')
      .select('id')
      .eq('slug', cleanSlug)
      .maybeSingle();

    // Eğer bu slug varsa, sonuna benzersiz küçük bir rastgele sayı ekle ki asla hata vermesin!
    if (existing) {
      cleanSlug = `${cleanSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Supabase'e ekle
    const { data, error } = await supabase
      .from('weddings')
      .insert([
        {
          groom_name: groomName,
          bride_name: brideName,
          slug: cleanSlug,
          storage_duration: storageDuration || '7_days',
          status: 'active',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase Insert Error:', error);
      // Hata olsa bile kullanıcıya slug hatası yerine açıklayıcı yanıt dön
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('API Server Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Sunucu hatası' }, { status: 500 });
  }
}