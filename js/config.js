/* ========================================================
   AİDAT TAKİP SİSTEMİ - CONFIG SAYFASI ÖZEL JS
   ======================================================== */

let isSubmitting = false;

document.addEventListener('DOMContentLoaded', async function() {
    ensureToastElement();
    
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
        showErrorToast('Oturum bulunamadı, lütfen giriş yapın');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }
    
    const setupComplete = await isSetupComplete();
    if (setupComplete) {
        showSuccessToast('Sistem zaten yapılandırılmış, ana sayfaya yönlendiriliyorsunuz...');
        setTimeout(() => window.location.href = 'index.html', 1500);
        return;
    }
    
    showConfigForm();
});

function showConfigForm() {
    const configFormArea = document.getElementById('configFormArea');
    if (configFormArea) configFormArea.classList.remove('hidden');
    
    const aidatGunuInput = document.getElementById('aidatGunu');
    if (aidatGunuInput) aidatGunuInput.value = '21';
    
    const tgBotDurumCheckbox = document.getElementById('tgBotDurum');
    if (tgBotDurumCheckbox) tgBotDurumCheckbox.checked = true;
}

async function handleConfigSubmit(event) {
    event.preventDefault();
    
    if (isSubmitting) return;
    isSubmitting = true;
    
    const siteAdi = document.getElementById('siteAdi')?.value.trim();
    const bloklarRaw = document.getElementById('bloklar')?.value.trim();
    const toplamDaire = parseInt(document.getElementById('toplamDaire')?.value);
    const katDaireSayisi = parseInt(document.getElementById('katDaireSayisi')?.value);
    const aidatGunu = parseInt(document.getElementById('aidatGunu')?.value);
    const telegramToken = document.getElementById('telegramToken')?.value.trim();
    const telegramChatId = document.getElementById('telegramChatId')?.value.trim();
    const tgBotDurum = document.getElementById('tgBotDurum')?.checked || false;
    
    if (!siteAdi || !bloklarRaw || !toplamDaire || !katDaireSayisi || !aidatGunu) {
        showErrorToast('Tüm zorunlu alanları doldurun!');
        isSubmitting = false;
        return;
    }
    
    const bloklar = bloklarRaw.split(',').map(b => b.trim().toUpperCase()).filter(b => b);
    if (bloklar.length === 0) {
        showErrorToast('En az bir blok belirtmelisiniz!');
        isSubmitting = false;
        return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
    }
    if (btnText) btnText.classList.add('hidden');
    if (btnLoader) btnLoader.classList.remove('hidden');
    
    showProcessToast('Kurulum yapılıyor...');
    
    try {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase bağlantısı yok');
        
        // Daireleri oluştur
        const unitsToInsert = [];
        for (const block of bloklar) {
            for (let i = 1; i <= toplamDaire; i++) {
                unitsToInsert.push({
                    unit_key: `${block}_${i}`,
                    mulkiyet_durumu: 'owner',
                    ad_soyad: '',
                    telefon: '',
                    mulk_sahibi_ad: '',
                    mulk_sahibi_tel: ''
                });
            }
        }
        
        if (unitsToInsert.length > 0) {
            const { error: unitError } = await sb.from('daireler').upsert(unitsToInsert, { onConflict: 'unit_key' });
            if (unitError) throw new Error('Daireler oluşturulamadı: ' + unitError.message);
        }
        
        // Sistem ayarlarını kaydet - sütun adları küçük harfle (tgbot_durum)
        const { error: saveError } = await sb
            .from('sistem_ayarlari')
            .update({
                site_adi: siteAdi,
                bloklar: bloklar,
                toplam_daire: toplamDaire,
                kat_daire_sayisi: katDaireSayisi,
                aidat_gunu: aidatGunu,
                telegram_token: tgBotDurum ? telegramToken : '',
                telegram_chat_id: tgBotDurum ? telegramChatId : '',
                tgbot_durum: tgBotDurum,
                kurulum_tamami: true
            })
            .eq('id', 1);
        
        if (saveError) {
            console.error('Kayıt hatası:', saveError);
            throw new Error('Sistem ayarları kaydedilemedi: ' + (saveError.message || 'Bilinmeyen hata'));
        }
        
        showSuccessToast('Kurulum başarıyla tamamlandı!');
        setTimeout(() => window.location.href = 'index.html', 1500);
        
    } catch (error) {
        console.error('Kurulum hatası:', error);
        showErrorToast(error.message || 'Kurulum sırasında bir hata oluştu!');
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
        }
        if (btnText) btnText.classList.remove('hidden');
        if (btnLoader) btnLoader.classList.add('hidden');
        isSubmitting = false;
    }
}

async function logoutAndExit() {
    showConfirmToast('Kurulumdan çıkmak istediğinize emin misiniz?', async () => {
        showProcessToast('Çıkış yapılıyor...');
        await logout();
        stopAutoRefreshSession();
        setTimeout(() => window.location.href = 'login.html', 500);
    });
}
