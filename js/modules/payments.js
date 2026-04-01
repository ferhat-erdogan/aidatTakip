/* ========================================================
   AİDAT TAKİP SİSTEMİ - PAYMENTS MODÜLÜ
   Tahsilat işlemleri için ek fonksiyonlar
   ======================================================== */

// Bu modül, ödeme ve tahsilat ile ilgili ek işlemleri içerecektir.
// Ana işlemler supabase.js ve app.js içinde tanımlıdır.

/**
 * Belirli bir dairenin ödeme geçmişini getirir
 * @param {string} unitKey - Unit key
 * @returns {Promise<Array>}
 */
async function getUnitPaymentHistory(unitKey) {
    try {
        const sb = getSupabase();
        if (!sb) return [];
        
        const { data, error } = await sb
            .from('tahsilatlar')
            .select('*')
            .eq('unit_key', unitKey)
            .order('yil', { ascending: false })
            .order('ay', { ascending: false });
        
        if (error) throw error;
        
        return data || [];
    } catch (error) {
        console.error('Ödeme geçmişi hatası:', error);
        return [];
    }
}

/**
 * Belirli bir ayın ödeme durumunu getirir
 * @param {number} month - Ay (0-11)
 * @param {number} year - Yıl
 * @returns {Promise<Array>}
 */
async function getPaymentsByMonth(month, year) {
    try {
        const sb = getSupabase();
        if (!sb) return [];
        
        const { data, error } = await sb
            .from('tahsilatlar')
            .select('*')
            .eq('ay', month)
            .eq('yil', year);
        
        if (error) throw error;
        
        return data || [];
    } catch (error) {
        console.error('Ay bazlı ödeme hatası:', error);
        return [];
    }
}

/**
 * Ödeme istatistiklerini getirir
 * @returns {Promise<Object>}
 */
async function getPaymentStats() {
    try {
        const allPayments = await getAllPayments();
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const currentMonthPayments = allPayments.filter(p => p.ay === currentMonth && p.yil === currentYear);
        const totalUnits = await getAllUnits();
        
        return {
            totalPaid: currentMonthPayments.length,
            totalUnits: totalUnits.length,
            percentage: totalUnits.length > 0 ? (currentMonthPayments.length / totalUnits.length) * 100 : 0,
            thisMonth: currentMonth,
            thisYear: currentYear
        };
    } catch (error) {
        console.error('İstatistik hatası:', error);
        return {
            totalPaid: 0,
            totalUnits: 0,
            percentage: 0,
            thisMonth: new Date().getMonth(),
            thisYear: new Date().getFullYear()
        };
    }
}
