/* ========================================================
   AİDAT TAKİP SİSTEMİ - SUPABASE YÖNETİMİ
   ======================================================== */

let supabaseClient = null;

function initSupabase(url, key) {
    try {
        if (!url || !key) return false;
        supabaseClient = window.supabase.createClient(url, key);
        return true;
    } catch (error) {
        console.error('Supabase başlatma hatası:', error);
        return false;
    }
}

function getSupabase() {
    return supabaseClient;
}

async function signInWithEmail(email, password) {
    try {
        const sb = getSupabase();
        if (!sb) return { success: false, error: 'Supabase bağlantısı yok' };
        
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) return { success: false, error: error.message };
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function checkAuthSession() {
    try {
        const sb = getSupabase();
        if (!sb) return false;
        const { data: { session }, error } = await sb.auth.getSession();
        return !error && !!session;
    } catch (error) {
        return false;
    }
}

async function signOut() {
    try {
        const sb = getSupabase();
        if (!sb) return false;
        await sb.auth.signOut();
        return true;
    } catch (error) {
        return false;
    }
}

async function getSystemSettings() {
    try {
        const sb = getSupabase();
        if (!sb) return null;
        
        const { data, error } = await sb
            .from('sistem_ayarlari')
            .select('*')
            .eq('id', 1)
            .single();
        
        if (error) {
            console.error('Sistem ayarları okuma hatası:', error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Sistem ayarları hatası:', error);
        return null;
    }
}

async function isSetupComplete() {
    const settings = await getSystemSettings();
    return settings?.kurulum_tamami === true;
}

async function completeSetup(settings) {
    try {
        const sb = getSupabase();
        if (!sb) return false;
        
        const { error } = await sb
            .from('sistem_ayarlari')
            .update({
                site_adi: settings.site_adi,
                bloklar: settings.bloklar,
                toplam_daire: settings.toplam_daire,
                kat_daire_sayisi: settings.kat_daire_sayisi,
                aidat_gunu: settings.aidat_gunu,
                telegram_token: settings.telegram_token || '',
                telegram_chat_id: settings.telegram_chat_id || '',
                tgbot_durum: settings.tgBot_durum || false,
                kurulum_tamami: true
            })
            .eq('id', 1);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Kurulum tamamlama hatası:', error);
        return false;
    }
}

async function getAllUnits() {
    try {
        const sb = getSupabase();
        if (!sb) return [];
        const { data, error } = await sb.from('daireler').select('*');
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Daireler okuma hatası:', error);
        return [];
    }
}

async function updateUnit(unitKey, unitData) {
    try {
        const sb = getSupabase();
        if (!sb) return false;
        const { error } = await sb.from('daireler').upsert({ unit_key: unitKey, ...unitData });
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Daire güncelleme hatası:', error);
        return false;
    }
}

async function getAllPayments() {
    try {
        const sb = getSupabase();
        if (!sb) return [];
        const { data, error } = await sb.from('tahsilatlar').select('*');
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Tahsilatlar okuma hatası:', error);
        return [];
    }
}

async function togglePaymentAPI(unitKey, month, year, isPaid) {
    try {
        const sb = getSupabase();
        if (!sb) return false;
        
        if (!isPaid) {
            const { error } = await sb.from('tahsilatlar').insert({ unit_key: unitKey, ay: month, yil: year });
            if (error) throw error;
        } else {
            const { error } = await sb.from('tahsilatlar').delete().eq('unit_key', unitKey).eq('ay', month).eq('yil', year);
            if (error) throw error;
        }
        return true;
    } catch (error) {
        console.error('Toggle payment error:', error);
        return false;
    }
}
