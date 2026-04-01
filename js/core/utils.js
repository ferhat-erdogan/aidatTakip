/* ========================================================
   AİDAT TAKİP SİSTEMİ - YARDIMCI FONKSİYONLAR
   ======================================================== */

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params.entries()) {
        result[key] = value;
    }
    return result;
}

function getUrlParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

const MONTH_NAMES = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

function getMonthName(month) {
    return MONTH_NAMES[month] || "Bilinmiyor";
}

function generateUnitKey(block, number) {
    return `${block}_${number}`;
}

function parseUnitKey(unitKey) {
    const parts = unitKey.split('_');
    return { block: parts[0], number: parts[1] };
}

function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
}

function formatDateTime(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function cleanPhoneNumber(phone) {
    return phone.replace(/\D/g, '');
}

function formatPhoneForWhatsApp(phone) {
    const cleaned = cleanPhoneNumber(phone);
    if (cleaned.length >= 10) {
        return '90' + cleaned.slice(-10);
    }
    return cleaned;
}

function clearInput(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.value = '';
}

function setInputValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) element.value = value || '';
}

function showElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.classList.remove('hidden');
}

function hideElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.classList.add('hidden');
}

function toggleElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.classList.toggle('hidden');
}

function getCurrentDateInfo() {
    const now = new Date();
    return {
        year: now.getFullYear(),
        month: now.getMonth(),
        day: now.getDate(),
        date: now
    };
}

function getDaysDifference(targetDate) {
    const now = new Date();
    const diffTime = targetDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function generateRandomId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function safeJsonStringify(obj) {
    try {
        return JSON.stringify(obj);
    } catch (e) {
        console.error('JSON stringify hatası:', e);
        return null;
    }
}

function safeJsonParse(str) {
    try {
        return JSON.parse(str);
    } catch (e) {
        console.error('JSON parse hatası:', e);
        return null;
    }
}
