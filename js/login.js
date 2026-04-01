/* ========================================================
   AİDAT TAKİP SİSTEMİ - LOGIN SAYFASI ÖZEL JS
   Giriş sayfasına özel JavaScript kodları
   ======================================================== */

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async function() {
    // Toast elementini kontrol et (toast.js zaten oluşturuyor ama emin olalım)
    ensureToastElement();
    
    // URL parametrelerini al
    const params = getUrlParams();
    const supabaseUrl = params.url;
    const supabaseKey = params.key;
    
    const paramErrorArea = document.getElementById('paramErrorArea');
    const loginFormArea = document.getElementById('loginFormArea');
    
    // Parametre kontrolü
    if (!supabaseUrl || !supabaseKey) {
        // Parametre yok: hata mesajı göster
        if (paramErrorArea) paramErrorArea.classList.remove('hidden');
        if (loginFormArea) loginFormArea.classList.add('hidden');
        
        showErrorToast('Bağlantı parametreleri tanımlı değil!');
        
    } else {
        // Parametreler var: Supabase bağlantısını test et
        paramErrorArea?.classList.add('hidden');
        
        // Bağlantıyı test et
        const isConnected = await testSupabaseConnectionWithParams(supabaseUrl, supabaseKey);
        
        if (isConnected) {
            // Bağlantı başarılı, formu göster
            loginFormArea?.classList.remove('hidden');
            
            // Cookie'de zaten oturum var mı kontrol et
            const { url: savedUrl, key: savedKey } = getAuthCookies();
            
            if (savedUrl === supabaseUrl && savedKey === supabaseKey) {
                // Aynı bağlantı bilgileri cookie'de var, oturum kontrolü yap
                const hasValidSession = await checkAuthSessionWithParams(supabaseUrl, supabaseKey);
                if (hasValidSession) {
                    // Oturum geçerli, direkt index'e yönlendir
                    showSuccessToast('Oturum devam ediyor, yönlendiriliyorsunuz...');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                    return;
                }
            }
            
            // Formu göster, inputları aktif et
            enableLoginForm(supabaseUrl, supabaseKey);
            
        } else {
            // Bağlantı başarısız
            paramErrorArea?.classList.remove('hidden');
            loginFormArea?.classList.add('hidden');
            showErrorToast('Supabase bağlantısı başlatılamadı! URL veya Key geçersiz.');
        }
    }
});

/**
 * Supabase bağlantısını test eder (parametrelerle)
 * @param {string} url - Supabase URL
 * @param {string} key - Supabase anon key
 * @returns {Promise<boolean>}
 */
async function testSupabaseConnectionWithParams(url, key) {
    try {
        // Geçici bir istemci oluştur
        const tempClient = window.supabase.createClient(url, key);
        
        // Sistem ayarları tablosundan bir kayıt okumayı dene
        const { data, error } = await tempClient
            .from('sistem_ayarlari')
            .select('id')
            .limit(1);
        
        if (error) {
            console.error('Bağlantı testi başarısız:', error);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Bağlantı testi hatası:', error);
        return false;
    }
}

/**
 * Oturum kontrolü yapar (parametrelerle)
 * @param {string} url - Supabase URL
 * @param {string} key - Supabase anon key
 * @returns {Promise<boolean>}
 */
async function checkAuthSessionWithParams(url, key) {
    try {
        const tempClient = window.supabase.createClient(url, key);
        const { data: { session }, error } = await tempClient.auth.getSession();
        
        if (error || !session) {
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Oturum kontrolü hatası:', error);
        return false;
    }
}

/**
 * Login formunu aktif eder
 * @param {string} supabaseUrl - Supabase URL
 * @param {string} supabaseKey - Supabase anon key
 */
function enableLoginForm(supabaseUrl, supabaseKey) {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
    
    if (!loginForm) return;
    
    // Form submit eventini temizle ve yeniden ata
    loginForm.onsubmit = async (event) => {
        event.preventDefault();
        
        const email = emailInput?.value.trim();
        const password = passwordInput?.value;
        
        if (!email || !password) {
            showErrorToast('E-posta ve şifre giriniz!');
            return;
        }
        
        // Butonu disable et ve loader göster
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.style.opacity = '0.7';
            loginBtn.style.cursor = 'not-allowed';
        }
        if (btnText) btnText.classList.add('hidden');
        if (btnLoader) btnLoader.classList.remove('hidden');
        
        showProcessToast('Giriş yapılıyor...');
        
        try {
            // Supabase istemcisini başlat
            if (!initSupabase(supabaseUrl, supabaseKey)) {
                throw new Error('Supabase bağlantısı başlatılamadı');
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
                throw new Error(errorMsg);
            }
            
            // Giriş başarılı, cookie'leri kaydet
            saveAuthCookies(supabaseUrl, supabaseKey);
            
            showSuccessToast('Giriş başarılı! Yönlendiriliyorsunuz...');
            
            // Otomatik oturum yenilemeyi başlat
            startAutoRefreshSession();
            
            // Ana sayfaya yönlendir
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
        } catch (error) {
            console.error('Login error:', error);
            showErrorToast(error.message || 'Giriş yapılırken bir hata oluştu!');
            
            // Butonu geri aktif et
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.style.opacity = '1';
                loginBtn.style.cursor = 'pointer';
            }
            if (btnText) btnText.classList.remove('hidden');
            if (btnLoader) btnLoader.classList.add('hidden');
        }
    };
    
    // Inputları aktif et
    if (emailInput) emailInput.disabled = false;
    if (passwordInput) passwordInput.disabled = false;
    if (loginBtn) loginBtn.disabled = false;
}

/**
 * Giriş yap (login.html için yardımcı fonksiyon)
 * @param {string} email - E-posta
 * @param {string} password - Şifre
 * @param {string} supabaseUrl - Supabase URL
 * @param {string} supabaseKey - Supabase anon key
 * @returns {Promise<boolean>}
 */
async function performLogin(email, password, supabaseUrl, supabaseKey) {
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
        console.error('Login error:', error);
        showErrorToast('Giriş yapılırken bir hata oluştu!');
        return false;
    }
}

// Sayfa yüklendiğinde inputların durumunu ayarla (başlangıçta disabled)
document.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    
    // Başlangıçta inputları disabled yap (parametreler kontrol edilene kadar)
    if (emailInput) emailInput.disabled = true;
    if (passwordInput) passwordInput.disabled = true;
    if (loginBtn) loginBtn.disabled = true;
});
