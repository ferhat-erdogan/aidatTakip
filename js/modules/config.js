/* ========================================================
   AİDAT TAKİP SİSTEMİ - CONFIG MODÜLÜ
   Sistem yapılandırma işlemleri
   ======================================================== */

// Bu modül, sistem ayarları ve yapılandırma ile ilgili
// ek fonksiyonları içerecektir.
// Ana işlemler supabase.js içinde tanımlıdır.
// Gerektiğinde buraya özel konfigürasyon fonksiyonları eklenebilir.

/**
 * Sistem ayarlarını kontrol eder
 * @returns {Promise<boolean>}
 */
async function checkSystemConfig() {
    try {
        const settings = await getSystemSettings();
        return settings !== null;
    } catch (error) {
        console.error('Sistem config kontrol hatası:', error);
        return false;
    }
}

/**
 * Sistem ayarlarını sıfırlar (admin işlemi)
 * @returns {Promise<boolean>}
 */
async function resetSystemConfig() {
    try {
        const sb = getSupabase();
        if (!sb) return false;
        
        const { error } = await sb
            .from('sistem_ayarlari')
            .update({ kurulum_tamami: false })
            .eq('id', 1);
        
        if (error) throw error;
        
        return true;
    } catch (error) {
        console.error('Sistem sıfırlama hatası:', error);
        return false;
    }
}
