/* ========================================================
   AİDAT TAKİP SİSTEMİ - TELEGRAM MODÜLÜ
   Telegram yedekleme işlemleri
   ======================================================== */

/**
 * Telegram bot token ve chat ID kontrolü yapar
 * @returns {Promise<boolean>}
 */
async function checkTelegramConfig() {
    try {
        const settings = await getSystemSettings();
        if (!settings) return false;
        
        return settings.tgBot_durum && 
               settings.telegram_token && 
               settings.telegram_token !== '' &&
               settings.telegram_chat_id && 
               settings.telegram_chat_id !== '';
    } catch (error) {
        console.error('Telegram config hatası:', error);
        return false;
    }
}

/**
 * Telegram'a yedekleme gönderir (tüm verileri unit_key ile birlikte)
 * @param {Object} backupData - Yedeklenecek veri (daireler ve tahsilatlar)
 * @returns {Promise<boolean>}
 */
async function sendTelegramBackupMessage(backupData) {
    try {
        const settings = await getSystemSettings();
        if (!settings || !settings.tgBot_durum) return false;
        
        const token = settings.telegram_token;
        const chatId = settings.telegram_chat_id;
        
        if (!token || !chatId) return false;
        
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('document', blob, `Yedek_${settings.site_adi}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`);
        formData.append('caption', `📦 Otomatik Yedekleme\n📍 Site: ${settings.site_adi}\n⏰ ${new Date().toLocaleString('tr-TR')}\n\n📊 Toplam Daire: ${backupData.daireler?.length || 0}\n💰 Toplam Tahsilat: ${backupData.tahsilatlar?.length || 0}`);
        
        const response = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        return result.ok === true;
        
    } catch (error) {
        console.error('Telegram yedekleme hatası:', error);
        return false;
    }
}
