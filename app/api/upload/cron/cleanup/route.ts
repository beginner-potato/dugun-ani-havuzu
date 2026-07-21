import { NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase'; // Burası tam tutmuyorsa bir tane eksilt veya artır

export async function GET(request: Request) {
  try {
    // Güvenlik Önlemi: İstek gerçekten Vercel Cron sisteminden mi geliyor kontrolü
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Yetkisiz erişim denemesi' }, { status: 401 });
    }

    const simdi = new Date().toISOString();

    // 1. Süresi dolmuş VE henüz temizlenmemiş düğünleri buluyoruz
    const { data: silinecekDugunler, error: fetchError } = await supabase
      .from('dugunler')
      .select('*')
      .lte('drive_delete_at', simdi) // drive_delete_at tarihi bugünden küçük veya eşit olanlar
      .is('is_deleted', false); // Daha önce silinmemiş olanlar

    if (fetchError) throw fetchError;
    if (!silinecekDugunler || silinecekDugunler.length === 0) {
      return NextResponse.json({ success: true, message: 'Bugün temizlenecek süresi dolmuş klasör bulunamadı.' });
    }

    // 2. Her süresi dolan düğün için Drive temizliği döngüsü
    for (const dugun of silinecekDugunler) {
      
      // ⚠️ BURASI KRİTİK: İleride Google Drive entegrasyonunu bağladığımızda 
      // buraya klasörü/dosyaları silen Drive API kodunu gömeceğiz:
      // await googleDriveKlasorSil(dugun.drive_folder_id);
      
      console.log(`Drive silme işlemi tetiklendi: ${dugun.gelin_adi} & ${dugun.damat_adi}`);

      // 3. Drive'dan silme komutu başarıyla gidince Supabase'de havuzu "silindi" olarak işaretliyoruz
      await supabase
        .from('dugunler')
        .update({ is_deleted: true }) // Tablona boolean bir is_deleted sütunu ekleyebilirsin veya durumunu değiştirebilirsin
        .eq('id', dugun.id);
    }

    return NextResponse.json({ success: true, clearedCount: silinecekDugunler.length });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}