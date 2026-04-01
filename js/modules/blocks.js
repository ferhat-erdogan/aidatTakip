/* ========================================================
   AİDAT TAKİP SİSTEMİ - BLOCKS MODÜLÜ
   Blok işlemleri için ek fonksiyonlar
   ======================================================== */

// Bu modül, bloklar ile ilgili ek işlemleri içerecektir.
// Ana işlemler app.js içinde tanımlıdır.

/**
 * Blok listesini getirir
 * @returns {Promise<Array>}
 */
async function getBlocks() {
    try {
        const settings = await getSystemSettings();
        return settings?.bloklar || [];
    } catch (error) {
        console.error('Blok listesi hatası:', error);
        return [];
    }
}

/**
 * Bloktaki daire sayısını getirir
 * @param {string} block - Blok adı
 * @returns {Promise<number>}
 */
async function getUnitCountByBlock(block) {
    try {
        const units = await getAllUnits();
        return units.filter(u => u.unit_key.startsWith(`${block}_`)).length;
    } catch (error) {
        console.error('Blok daire sayısı hatası:', error);
        return 0;
    }
}

/**
 * Blok bazında ödeme istatistiklerini getirir
 * @param {string} block - Blok adı
 * @returns {Promise<Object>}
 */
async function getBlockStats(block) {
    try {
        const units = await getAllUnits();
        const blockUnits = units.filter(u => u.unit_key.startsWith(`${block}_`));
        const allPayments = await getAllPayments();
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const blockUnitKeys = blockUnits.map(u => u.unit_key);
        const blockPayments = allPayments.filter(p => 
            blockUnitKeys.includes(p.unit_key) && 
            p.ay === currentMonth && 
            p.yil === currentYear
        );
        
        return {
            block: block,
            totalUnits: blockUnits.length,
            paidUnits: blockPayments.length,
            percentage: blockUnits.length > 0 ? (blockPayments.length / blockUnits.length) * 100 : 0
        };
    } catch (error) {
        console.error('Blok istatistik hatası:', error);
        return {
            block: block,
            totalUnits: 0,
            paidUnits: 0,
            percentage: 0
        };
    }
}
