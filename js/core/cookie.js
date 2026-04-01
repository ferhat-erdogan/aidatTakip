/* ========================================================
   AİDAT TAKİP SİSTEMİ - COOKIE YÖNETİMİ
   Tüm cookie işlemleri burada yönetilir
   ======================================================== */

/**
 * Cookie oluşturur veya günceller
 * @param {string} name - Cookie adı
 * @param {string} value - Cookie değeri
 * @param {number} days - Geçerlilik süresi (gün), varsayılan 36500 gün (~100 yıl)
 */
function setCookie(name, value, days = 36500) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Cookie'den değer okur
 * @param {string} name - Cookie adı
 * @returns {string|null} - Cookie değeri veya null
 */
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return decodeURIComponent(parts.pop().split(';').shift());
    }
    return null;
}

/**
 * Cookie'yi siler
 * @param {string} name - Cookie adı
 */
function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Supabase bağlantı bilgilerini cookie'ye kaydeder
 * @param {string} url - Supabase URL
 * @param {string} key - Supabase anon key
 */
function saveAuthCookies(url, key) {
    if (url) setCookie('supabase_url', url);
    if (key) setCookie('supabase_key', key);
}

/**
 * Supabase bağlantı bilgilerini cookie'den okur
 * @returns {Object} - { url, key } veya null değerler
 */
function getAuthCookies() {
    return {
        url: getCookie('supabase_url'),
        key: getCookie('supabase_key')
    };
}

/**
 * Supabase bağlantı bilgilerini cookie'den siler
 */
function clearAuthCookies() {
    deleteCookie('supabase_url');
    deleteCookie('supabase_key');
}

/**
 * Tüm cookie'leri listeler (debug için)
 * @returns {Object} - Tüm cookie'lerin key-value objesi
 */
function getAllCookies() {
    const cookies = {};
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');
    
    for (let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i].trim();
        if (cookie === '') continue;
        
        const separatorIndex = cookie.indexOf('=');
        if (separatorIndex > 0) {
            const name = cookie.substring(0, separatorIndex);
            const value = cookie.substring(separatorIndex + 1);
            cookies[name] = value;
        }
    }
    
    return cookies;
}

/**
 * Oturum kontrolü yapar (cookie'de url ve key var mı)
 * @returns {boolean} - Oturum aktif mi
 */
function hasActiveSession() {
    const { url, key } = getAuthCookies();
    return !!(url && key);
}
