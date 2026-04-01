/* ========================================================
   AİDAT TAKİP SİSTEMİ - AUTH MODÜLÜ
   Giriş, çıkış, oturum kontrolü işlemleri
   ======================================================== */

/**
 * Giriş yap
 * @param {string} email - E-posta
 * @param {string} password - Şifre
 * @param {string} supabaseUrl - Supabase URL
 * @param {string} supabaseKey - Supabase anon key
 * @returns {Promise<boolean>} - Başarılı mı?
 */
async function login(email, password, supabaseUrl, supabaseKey) {
    try {
        // Supabase istemcisini başlat
        if (!initSupabase(supabaseUrl, supabaseKey)) {
            showErrorToast('Supabase bağlantısı başlatılamadı!');
            return false;
        }
        
        // Auth ile giriş yap
        const { success, error } = await signInWithEmail(email, password);
        
        if (!success) {
            let errorMsg = 'Giriş başarısız!';
            if (error === 'Invalid login credentials') {
                errorMsg = 'E-posta veya şifre hatalı!';
            } else if (error) {
                errorMsg = error;
            }
            showErrorToast(errorMsg);
            return false;
        }
        
        // Giriş başarılı, cookie'leri kaydet
        saveAuthCookies(supabaseUrl, supabaseKey);
        
        showSuccessToast('Giriş başarılı!');
        return true;
        
    } catch (error) {
        console.error('Login hatası:', error);
        showErrorToast('Giriş yapılırken bir hata oluştu!');
        return false;
    }
}

/**
 * Çıkış yap
 * @returns {Promise<boolean>} - Başarılı mı?
 */
async function logout() {
    try {
        // Supabase Auth çıkışı
        const signedOut = await signOut();
        
        // Cookie'leri temizle
        clearAuthCookies();
        
        if (signedOut) {
            showSuccessToast('Çıkış yapıldı');
        } else {
            showToast('Çıkış yapılırken sorun oluştu', 'delete');
        }
        
        return signedOut;
        
    } catch (error) {
        console.error('Logout hatası:', error);
        showErrorToast('Çıkış yapılırken hata oluştu!');
        return false;
    }
}

/**
 * Oturum kontrolü yap
 * @returns {Promise<boolean>} - Oturum aktif mi?
 */
async function checkAuth() {
    try {
        // Cookie'de URL ve key var mı?
        const { url, key } = getAuthCookies();
        if (!url || !key) {
            return false;
        }
        
        // Supabase istemcisini başlat
        if (!initSupabase(url, key)) {
            return false;
        }
        
        // Supabase Auth oturumunu kontrol et
        const hasSession = await checkAuthSession();
        
        if (!hasSession) {
            // Oturum yoksa cookie'leri temizle
            clearAuthCookies();
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('Auth kontrol hatası:', error);
        return false;
    }
}

/**
 * Giriş gerektiren sayfalarda yönlendirme yapar
 * Giriş yoksa login.html'e yönlendirir
 * @param {boolean} redirectIfNotAuth - Giriş yoksa yönlendirilsin mi?
 * @returns {Promise<boolean>} - Oturum aktif mi?
 */
async function requireAuth(redirectIfNotAuth = true) {
    const isAuthenticated = await checkAuth();
    
    if (!isAuthenticated && redirectIfNotAuth) {
        // Mevcut URL'yi parametre olarak ekleyebiliriz
        const currentPath = window.location.pathname;
        const redirectUrl = `login.html?redirect=${encodeURIComponent(currentPath)}`;
        window.location.href = redirectUrl;
        return false;
    }
    
    return isAuthenticated;
}

/**
 * Kullanıcı bilgilerini getirir
 * @returns {Promise<Object|null>} - Kullanıcı bilgileri veya null
 */
async function getUserInfo() {
    try {
        const sb = getSupabase();
        if (!sb) return null;
        
        const { data: { user }, error } = await sb.auth.getUser();
        
        if (error || !user) {
            return null;
        }
        
        return {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at
        };
        
    } catch (error) {
        console.error('Kullanıcı bilgisi alınamadı:', error);
        return null;
    }
}

/**
 * Oturum yenileme (token süresi dolmadan önce)
 * @returns {Promise<boolean>} - Başarılı mı?
 */
async function refreshSession() {
    try {
        const sb = getSupabase();
        if (!sb) return false;
        
        const { data, error } = await sb.auth.refreshSession();
        
        if (error) {
            console.error('Oturum yenileme hatası:', error);
            return false;
        }
        
        return !!data.session;
        
    } catch (error) {
        console.error('Oturum yenileme hatası:', error);
        return false;
    }
}

/**
 * Otomatik oturum yenileme başlatır
 * Her 50 dakikada bir oturumu yeniler
 */
let refreshInterval = null;

function startAutoRefreshSession() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // 50 dakikada bir yenile (token genelde 60 dk geçerli)
    refreshInterval = setInterval(async () => {
        const isAuth = await checkAuth();
        if (isAuth) {
            await refreshSession();
        }
    }, 50 * 60 * 1000);
}

function stopAutoRefreshSession() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

/**
 * Login sayfasındaki giriş işlemini yönetir
 * @param {string} email - E-posta
 * @param {string} password - Şifre
 * @param {string} supabaseUrl - Supabase URL
 * @param {string} supabaseKey - Supabase anon key
 * @returns {Promise<boolean>} - Başarılı mı?
 */
async function handleLoginForm(email, password, supabaseUrl, supabaseKey) {
    // Input kontrolü
    if (!email || !password) {
        showErrorToast('E-posta ve şifre giriniz!');
        return false;
    }
    
    if (!supabaseUrl || !supabaseKey) {
        showErrorToast('Supabase bağlantı bilgileri eksik!');
        return false;
    }
    
    // Giriş işlemi
    const success = await login(email, password, supabaseUrl, supabaseKey);
    
    if (success) {
        // Otomatik oturum yenilemeyi başlat
        startAutoRefreshSession();
        
        // Ana sayfaya yönlendir
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
    
    return success;
}

/**
 * Çıkış butonu için onay gösterir
 */
function askLogout() {
    showConfirmToast('OTURUMU KAPATMAK İSTEDİĞİNİZE EMİN MİSİNİZ?', async () => {
        await logout();
        stopAutoRefreshSession();
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 500);
    });
}
