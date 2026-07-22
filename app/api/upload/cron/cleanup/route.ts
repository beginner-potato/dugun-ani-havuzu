import { createClient } from '@supabase/supabase-js';
export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: Request) {
  try {
    const now = new Date().toISOString();

    // Süresi dolmuş ve hala aktif olan düğümleri bul
    const { data: expiredWeddings, error } = await supabase
      .from('dugunler')
      .select('*')
      .lt('expire_at', now)
      .neq('status', 'completed');

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!expiredWeddings || expiredWeddings.length === 0) {
      return Response.json({ success: true, message: 'Süresi dolan aktif havuz bulunamadı.' });
    }

    // Süresi dolanların durumunu 'completed' (tamamlandı) olarak güncelle
    for (const wedding of expiredWeddings) {
      await supabase
        .from('dugunler')
        .update({ status: 'completed' })
        .eq('id', wedding.id);
    }

    return Response.json({ 
      success: true, 
      closedCount: expiredWeddings.length,
      message: `${expiredWeddings.length} adet süresi dolan havuz arşive kaldırıldı.` 
    });

  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}