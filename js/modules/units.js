/* ========================================================
   AİDAT TAKİP SİSTEMİ - UNITS MODÜLÜ
   Daire işlemleri için ek fonksiyonlar
   ======================================================== */

// Bu modül, daireler ile ilgili ek işlemleri içerecektir.
// Ana işlemler supabase.js ve app.js içinde tanımlıdır.

/**
 * Daire bilgisini getirir
 * @param {string} unitKey - Unit key
 * @returns {Promise<Object|null>}
 */
async function getUnit(unitKey) {
    try {
        const sb = getSupabase();
        if (!sb) return null;
        
        const { data, error } = await sb
            .from('daireler')
            .select('*')
            .eq('unit_key', unitKey)
            .single();
        
        if (error) throw error;
        
        return data;
    } catch (error) {
        console.error('Daire getirme hatası:', error);
        return null;
    }
}

/**
 * Tüm daireleri blok bazında gruplar
 * @returns {Promise<Object>}
 */
async function getUnitsByBlock() {
    try {
        const units = await getAllUnits();
        const grouped = {};
        
        units.forEach(unit => {
            const block = unit.unit_key.split('_')[0];
            if (!grouped[block]) grouped[block] = [];
            grouped[block].push(unit);
        });
        
        return grouped;
    } catch (error) {
        console.error('Blok gruplama hatası:', error);
        return {};
    }
}

/**
 * Daire araması yapar
 * @param {string} searchTerm - Arama terimi
 * @returns {Promise<Array>}
 */
async function searchUnits(searchTerm) {
    try {
        const sb = getSupabase();
        if (!sb) return [];
        
        const term = `%${searchTerm}%`;
        const { data, error } = await sb
            .from('daireler')
            .select('*')
            .or(`ad_soyad.ilike.${term},telefon.ilike.${term},mulk_sahibi_ad.ilike.${term},mulk_sahibi_tel.ilike.${term}`);
        
        if (error) throw error;
        
        return data || [];
    } catch (error) {
        console.error('Daire arama hatası:', error);
        return [];
    }
}
