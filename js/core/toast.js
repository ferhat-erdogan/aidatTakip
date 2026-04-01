/* ========================================================
   AİDAT TAKİP SİSTEMİ - TOAST BİLDİRİM SİSTEMİ
   Tüm toast bildirimleri burada yönetilir
   ======================================================== */

/**
 * Toast bildirimi gösterir
 * @param {string} msg - Gösterilecek mesaj
 * @param {string} type - Bildirim tipi: 'process', 'success', 'delete', 'confirm'
 * @param {Function} onConfirm - 'confirm' tipinde onay butonuna tıklanınca çalışacak fonksiyon
 */
function showToast(msg, type = 'process', onConfirm = null) {
    const toast = document.getElementById('toast');
    const toastMain = document.getElementById('toastMain');
    const confirmBtns = document.getElementById('confirmActionBtns');
    const toastIcon = document.getElementById('toastIcon');
    const toastMsg = document.getElementById('toastMsg');
    const btnConfirmYes = document.getElementById('btnConfirmYes');
    
    if (!toast || !toastMain || !toastIcon || !toastMsg) {
        console.error('Toast elementi bulunamadı!');
        return;
    }
    
    // Confirm butonlarını gizle, ana mesaj bölümünü göster
    if (confirmBtns) confirmBtns.classList.add('hidden');
    toastMain.classList.remove('hidden');
    
    // Toast sınıflarını temizle ve yeni tipi ekle
    toast.className = 'show';
    
    // Tip bazlı stil ve ikon ayarları
    switch (type) {
        case 'process':
            toast.classList.add('process');
            toastIcon.className = 'fa-solid fa-circle-notch fa-spin';
            break;
        case 'success':
            toast.classList.add('success');
            toastIcon.className = 'fa-solid fa-circle-check';
            break;
        case 'delete':
            toast.classList.add('delete');
            toastIcon.className = 'fa-solid fa-circle-exclamation';
            break;
        case 'confirm':
            toast.classList.add('confirm');
            toastIcon.className = 'fa-solid fa-power-off';
            if (confirmBtns && btnConfirmYes) {
                toastMain.classList.add('hidden');
                confirmBtns.classList.remove('hidden');
                btnConfirmYes.onclick = () => {
                    if (onConfirm) onConfirm();
                    closeToast();
                };
            }
            break;
        default:
            toast.classList.add('process');
            toastIcon.className = 'fa-solid fa-circle-notch fa-spin';
    }
    
    toastMsg.innerText = msg;
    
    // Confirm tipi dışında otomatik kapanma
    if (type !== 'confirm') {
        setTimeout(() => {
            closeToast();
        }, 2500);
    }
}

/**
 * Toast bildirimini kapatır
 */
function closeToast() {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.classList.remove('show', 'process', 'success', 'delete', 'confirm');
    }
}

/**
 * Kısa süreli başarı bildirimi
 * @param {string} msg - Mesaj
 */
function showSuccessToast(msg) {
    showToast(msg, 'success');
}

/**
 * Kısa süreli hata bildirimi
 * @param {string} msg - Mesaj
 */
function showErrorToast(msg) {
    showToast(msg, 'delete');
}

/**
 * Kısa süreli işlem bildirimi (yükleniyor)
 * @param {string} msg - Mesaj
 */
function showProcessToast(msg) {
    showToast(msg, 'process');
}

/**
 * Onay gerektiren bildirim
 * @param {string} msg - Mesaj
 * @param {Function} onConfirm - Onaylandığında çalışacak fonksiyon
 */
function showConfirmToast(msg, onConfirm) {
    showToast(msg, 'confirm', onConfirm);
}

/**
 * Toast elementlerini DOM'a ekler (eğer yoksa)
 * Bu fonksiyon, sayfada toast elementi yoksa oluşturur
 */
function ensureToastElement() {
    if (document.getElementById('toast')) return;
    
    const toastHtml = `
        <div id="toast">
            <div id="toastMain" class="flex items-center gap-3">
                <i id="toastIcon" class="fa-solid fa-circle-notch fa-spin"></i>
                <span id="toastMsg">...</span>
            </div>
            <div id="confirmActionBtns" class="hidden flex gap-2 w-full mt-2">
                <button id="btnConfirmYes" class="flex-1 bg-[#ff3e3e] text-white p-4 rounded-xl font-black text-[10px] uppercase active:scale-95">EVET</button>
                <button onclick="closeToast()" class="flex-1 bg-white/10 p-4 rounded-xl font-black text-[10px] uppercase active:scale-95">İPTAL</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', toastHtml);
}

// Sayfa yüklendiğinde toast elementi yoksa oluştur
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureToastElement);
    } else {
        ensureToastElement();
    }
}
