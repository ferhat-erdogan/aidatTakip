/* ========================================================
   AİDAT TAKİP SİSTEMİ - ANA UYGULAMA
   ======================================================== */

let config = null;
let dbUnits = {};
let dbPayments = {};
let activeBlock = null;
let activeUnitIdx = null;
let currentOwnership = 'owner';

const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();
const currentDay = now.getDate();
const monthNames = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

async function initApp() {
    try {
        showLoader(true);
        
        const isAuth = await checkAuth();
        if (!isAuth) {
            window.location.href = 'login.html';
            return;
        }
        
        const setupComplete = await isSetupComplete();
        if (!setupComplete) {
            window.location.href = 'config.html';
            return;
        }
        
        const settings = await getSystemSettings();
        if (!settings) {
            showErrorToast('Sistem ayarları yüklenemedi!');
            return;
        }
        
        config = {
            site: settings.site_adi,
            blks: settings.bloklar || [],
            units: settings.toplam_daire,
            pRow: settings.kat_daire_sayisi,
            aidatDay: settings.aidat_gunu
        };
        
        await loadData();
        
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('appMain').classList.remove('hidden');
        document.getElementById('displaySiteName').innerText = config.site;
        document.getElementById('displayAidatDay').innerHTML = `AİDAT GÜNÜ: ${config.aidatDay}. GÜN`;
        
        renderBlocks();
        startAutoRefreshSession();
        
    } catch (error) {
        console.error('Uygulama başlatma hatası:', error);
        showErrorToast('Uygulama başlatılamadı!');
    } finally {
        showLoader(false);
    }
}

async function loadData() {
    try {
        const units = await getAllUnits();
        dbUnits = {};
        units.forEach(unit => { dbUnits[unit.unit_key] = unit; });
        
        const payments = await getAllPayments();
        dbPayments = {};
        payments.forEach(payment => {
            if (!dbPayments[payment.unit_key]) dbPayments[payment.unit_key] = [];
            dbPayments[payment.unit_key].push(payment);
        });
    } catch (error) {
        console.error('Veri yükleme hatası:', error);
        throw error;
    }
}

function renderBlocks() {
    activeBlock = null;
    const container = document.getElementById('viewBlocks');
    if (!container) return;
    
    container.innerHTML = '';
    document.getElementById('viewBlocks').classList.remove('hidden');
    document.getElementById('viewUnits').classList.add('hidden');
    document.getElementById('navBack').classList.add('hidden');
    
    if (window.location.hash !== "") history.replaceState(null, "", " ");
    
    config.blks.forEach(block => {
        const div = document.createElement('div');
        div.className = "flex justify-between items-center p-6 bg-white/5 border border-white/5 rounded-2xl active:scale-95 transition-all cursor-pointer";
        div.innerHTML = `<div class="font-black text-xl italic">${block} BLOK</div><i class="fa-solid fa-chevron-right text-[#7cfc00]"></i>`;
        div.onclick = () => renderUnits(block);
        container.appendChild(div);
    });
}

function renderUnits(block) {
    activeBlock = block;
    document.getElementById('viewBlocks').classList.add('hidden');
    document.getElementById('viewUnits').classList.remove('hidden');
    document.getElementById('navBack').classList.remove('hidden');
    document.getElementById('blockTitle').innerText = block + " BLOK";
    
    const grid = document.getElementById('unitGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    let circleSize = 60;
    if (config.pRow === 2) {
        circleSize = 90;
    } else if (config.pRow === 3) {
        circleSize = 75;
    } else if (config.pRow === 4) {
        circleSize = 60;
    } else if (config.pRow === 5) {
        circleSize = 55;
    }
    
    grid.style.gridTemplateColumns = `repeat(${config.pRow}, ${circleSize}px)`;
    
    let paidCount = 0;
    
    for (let i = 1; i <= config.units; i++) {
        const unitKey = `${block}_${i}`;
        const isPaid = dbPayments[unitKey]?.some(p => p.ay === currentMonth && p.yil === currentYear);
        
        if (isPaid) paidCount++;
        
        const circle = document.createElement('div');
        circle.className = `circle ${isPaid ? 'paid' : (currentDay > config.aidatDay ? 'overdue' : '')}`;
        circle.id = `u-cell-${i}`;
        circle.innerText = i;
        circle.style.width = `${circleSize}px`;
        circle.style.height = `${circleSize}px`;
        circle.style.fontSize = `${Math.floor(circleSize * 0.4)}px`;
        circle.onclick = () => openUnitModal(i);
        grid.appendChild(circle);
    }
    
    const percentage = Math.round((paidCount / config.units) * 100);
    document.getElementById('progressBar').style.width = percentage + '%';
    document.getElementById('progressText').innerText = percentage + '%';
    
    updateAidatStatus();
}

function filterUnits() {
    const searchValue = document.getElementById('unitSearch').value.toLowerCase();
    
    for (let i = 1; i <= config.units; i++) {
        const unitKey = `${activeBlock}_${i}`;
        const unit = dbUnits[unitKey] || {};
        const cell = document.getElementById(`u-cell-${i}`);
        
        if (!cell) continue;
        
        const match = searchValue === "" ||
            (unit.ad_soyad || "").toLowerCase().includes(searchValue) ||
            (unit.telefon || "").includes(searchValue) ||
            (unit.mulk_sahibi_ad || "").toLowerCase().includes(searchValue) ||
            (unit.mulk_sahibi_tel || "").includes(searchValue);
        
        if (match) {
            cell.classList.remove('dim');
        } else {
            cell.classList.add('dim');
        }
    }
}

function openUnitModal(unitNumber) {
    activeUnitIdx = unitNumber;
    const unitKey = `${activeBlock}_${unitNumber}`;
    const unit = dbUnits[unitKey] || {};
    
    document.getElementById('modalTitle').innerText = `${activeBlock}-${unitNumber}`;
    document.getElementById('resName').value = unit.ad_soyad || '';
    document.getElementById('resPhone').value = unit.telefon || '';
    document.getElementById('ownerName').value = unit.mulk_sahibi_ad || '';
    document.getElementById('ownerPhone').value = unit.mulk_sahibi_tel || '';
    
    setOwnership(unit.mulkiyet_durumu || 'owner');
    refreshPaymentHistory(unitKey);
    updateQuickComm('res');
    updateQuickComm('owner');
    
    document.getElementById('unitModal').style.display = 'flex';
}

function refreshPaymentHistory(unitKey) {
    const container = document.getElementById('historyLog');
    if (!container) return;
    
    container.innerHTML = '';
    const payments = dbPayments[unitKey] || [];
    
    for (let i = 0; i < 12; i++) {
        let date = new Date(currentYear, currentMonth - i, 1);
        let month = date.getMonth();
        let year = date.getFullYear();
        let isPaid = payments.some(p => p.ay === month && p.yil === year);
        
        const row = document.createElement('div');
        row.className = "history-row active:bg-white/5 cursor-pointer";
        row.onclick = (e) => {
            e.stopPropagation();
            togglePayment(unitKey, month, year, isPaid);
        };
        row.innerHTML = `
            <div class="uppercase font-black text-[11px] ${isPaid ? 'text-white' : 'text-white/20'}">
                ${monthNames[month]} ${year}
            </div>
            <i class="fa-solid ${isPaid ? 'fa-circle-check text-[#7cfc00] text-2xl' : 'fa-circle-xmark text-white/5 text-2xl'}"></i>
        `;
        container.appendChild(row);
    }
}

async function togglePayment(unitKey, month, year, isPaid) {
    showProcessToast(isPaid ? "Ödeme siliniyor..." : "Ödeme kaydediliyor...");
    
    const success = await togglePaymentAPI(unitKey, month, year, isPaid);
    
    if (success) {
        if (!isPaid) {
            // Veritabanından yeni eklenen ödemeyi al
            const sb = getSupabase();
            const { data: newPayment } = await sb
                .from('tahsilatlar')
                .select('*')
                .eq('unit_key', unitKey)
                .eq('ay', month)
                .eq('yil', year)
                .single();
            
            if (!dbPayments[unitKey]) dbPayments[unitKey] = [];
            dbPayments[unitKey].push(newPayment);
            showSuccessToast("TAHSİLAT YAPILDI");
        } else {
            dbPayments[unitKey] = dbPayments[unitKey].filter(p => !(p.ay === month && p.yil === year));
            showSuccessToast("SİLİNDİ");
        }
        
        refreshPaymentHistory(unitKey);
        renderUnits(activeBlock);
        
        await sendTelegramBackup();
    } else {
        showErrorToast("İşlem başarısız!");
    }
}

async function saveUnit() {
    showProcessToast("Kaydediliyor...");
    
    const unitKey = `${activeBlock}_${activeUnitIdx}`;
    const unitData = {
        mulkiyet_durumu: currentOwnership,
        ad_soyad: document.getElementById('resName').value,
        telefon: document.getElementById('resPhone').value,
        mulk_sahibi_ad: document.getElementById('ownerName').value,
        mulk_sahibi_tel: document.getElementById('ownerPhone').value
    };
    
    const success = await updateUnit(unitKey, unitData);
    
    if (success) {
        dbUnits[unitKey] = { unit_key: unitKey, ...unitData };
        showSuccessToast("KAYDEDİLDİ");
        await sendTelegramBackup();
        setTimeout(() => closeModal('unitModal'), 600);
    } else {
        showErrorToast("Kaydedilemedi!");
    }
}

function setOwnership(type) {
    currentOwnership = type;
    
    const optOwner = document.getElementById('optOwner');
    const optTenant = document.getElementById('optTenant');
    const ownerArea = document.getElementById('ownerArea');
    
    if (optOwner && optTenant) {
        if (type === 'owner') {
            optOwner.className = "flex-1 p-2 text-center text-[10px] font-black uppercase cursor-pointer rounded-lg bg-[#7cfc00] text-black";
            optTenant.className = "flex-1 p-2 text-center text-[10px] font-black uppercase cursor-pointer rounded-lg text-white/40";
        } else {
            optOwner.className = "flex-1 p-2 text-center text-[10px] font-black uppercase cursor-pointer rounded-lg text-white/40";
            optTenant.className = "flex-1 p-2 text-center text-[10px] font-black uppercase cursor-pointer rounded-lg bg-[#7cfc00] text-black";
        }
    }
    
    if (ownerArea) {
        ownerArea.className = type === 'tenant' ? "p-5 bg-black/40 rounded-3xl border border-white/5 space-y-4" : "hidden";
    }
}

function updateQuickComm(prefix) {
    const phoneInput = document.getElementById(`${prefix}Phone`);
    const callBtn = document.getElementById(`${prefix}Call`);
    const waBtn = document.getElementById(`${prefix}WA`);
    
    if (!phoneInput || !callBtn || !waBtn) return;
    
    const phone = phoneInput.value.replace(/\D/g, '');
    
    if (phone.length >= 10) {
        const formattedPhone = '90' + phone.slice(-10);
        callBtn.className = "comm-btn active-call";
        callBtn.href = "tel:" + phone;
        waBtn.className = "comm-btn active-wa";
        waBtn.href = "https://wa.me/" + formattedPhone;
    } else {
        callBtn.className = "comm-btn opacity-10";
        waBtn.className = "comm-btn opacity-10";
        callBtn.href = "#";
        waBtn.href = "#";
    }
}

function updateAidatStatus() {
    const infoDiv = document.getElementById('aidatInfo');
    if (!infoDiv) return;
    
    let targetDate = new Date(currentYear, currentMonth, config.aidatDay);
    if (currentDay >= config.aidatDay) {
        targetDate = new Date(currentYear, currentMonth + 1, config.aidatDay);
    }
    
    const diff = Math.ceil((targetDate - now) / 86400000);
    infoDiv.innerText = `KALAN ${diff} GÜN`;
    infoDiv.className = `text-[10px] font-black ${diff <= 3 ? 'text-red-500' : 'text-[#ffb800]'}`;
}

function sendReminder() {
    const phoneInput = document.getElementById('resPhone');
    const nameInput = document.getElementById('resName');
    
    if (!phoneInput) return;
    
    const phone = phoneInput.value.replace(/\D/g, '');
    if (!phone || phone.length < 10) {
        showErrorToast("TELEFON NUMARASI GİRİLMEMİŞ!");
        return;
    }
    
    const name = nameInput?.value || 'Sakin';
    const message = `Sayın ${name}, ${activeBlock}-${activeUnitIdx} aidat ödemeniz beklemektedir.`;
    const formattedPhone = '90' + phone.slice(-10);
    
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function goBack() {
    if (window.location.hash) {
        history.back();
    } else {
        renderBlocks();
    }
}

function showLoader(show) {
    const loader = document.getElementById('loader');
    if (loader) {
        if (show) {
            loader.classList.remove('hidden');
        } else {
            loader.classList.add('hidden');
        }
    }
}

async function sendTelegramBackup() {
    const settings = await getSystemSettings();
    if (!settings || !settings.telegram_token || !settings.telegram_chat_id) {
        return;
    }
    
    const sb = getSupabase();
    if (!sb) return;
    
    // Supabase URL'yi doğrudan sb objesinden al
    const supabaseUrl = sb.supabaseUrl || 'Belirtilmemiş';
    
    const { data: { user } } = await sb.auth.getUser();
    const userEmail = user?.email || 'Bilinmiyor';
    
    const { data: allPayments, error } = await sb
        .from('tahsilatlar')
        .select('*');
    
    if (error) {
        console.error('Yedekleme için tahsilatlar alınamadı:', error);
        return;
    }
    
    const backupData = {
        signature: "AIDAT_TAKIP",
        site: config.site,
        daireler: Object.values(dbUnits),
        tahsilatlar: allPayments || []
    };
    
    const totalUnits = Object.values(dbUnits).length;
    const currentMonthPayments = allPayments?.filter(p => p.ay === currentMonth && p.yil === currentYear).length || 0;
    const totalPayments = allPayments?.length || 0;
    const paidPercentage = totalUnits > 0 ? Math.round((currentMonthPayments / totalUnits) * 100) : 0;
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const formData = new FormData();
    formData.append('chat_id', settings.telegram_chat_id);
    formData.append('document', blob, `Yedek_${config.site}_${new Date().toISOString().slice(0,10)}.json`);
    
    let caption = `──────────────\n\n`;
    caption += `🚀 ᴀɪᴅᴀᴛ ᴛᴀᴋɪᴘ sɪsᴛᴇᴍɪ ⚡ 🔻\n\n`;
    caption += `» ᴋᴜʟʟᴀɴɪᴄɪ: \`${userEmail}\`\n`;
    caption += `» ᴛᴏᴘʟᴀᴍ ʙʟᴏᴋ: \`${config.blks.length}\`\n`;
    caption += `» ᴛᴏᴘʟᴀᴍ ᴅᴀɪʀᴇ: \`${totalUnits}\`\n`;
    caption += `» ᴀɪᴅᴀᴛ ɢᴜ̈ɴᴜ̈: \`${config.aidatDay}\`\n\n`;
    caption += `──────────────\n\n`;
    caption += `📊 sɪsᴛᴇᴍ ɪsᴛᴀᴛɪsᴛɪᴋʟᴇʀɪ\n\n`;
    caption += `» ʙᴜ ᴀʏ ᴛᴀʜsɪʟᴀᴛ: \`${currentMonthPayments}\` / \`${totalUnits}\` (\`%${paidPercentage}\`)\n`;
    caption += `» ᴛᴏᴘʟᴀᴍ ᴛᴀʜsɪʟᴀᴛ: \`${totalPayments}\`\n\n`;
    caption += `──────────────\n\n`;
    caption += `📅 \`${new Date().toLocaleString('tr-TR')}\`\n\n`;
    caption += `🌐 ᴠᴇʀɪᴛᴀʙᴀɴɪ ᴀᴅʀᴇsɪ:\n\`${supabaseUrl}\`\n\n`;
    caption += `──────────────`;
    
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');
    
    try {
        await fetch(`https://api.telegram.org/bot${settings.telegram_token}/sendDocument`, {
            method: 'POST',
            body: formData
        });
    } catch (error) {
        console.error('Telegram yedekleme hatası:', error);
    }
}

function triggerImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    showConfirmToast("TÜM VERİLER SİLİNECEK! ONAYLIYOR MUSUN?", async () => {
        await finalizeImport(file);
    });
}

async function finalizeImport(file) {
    showProcessToast("Veriler işleniyor...");
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.signature !== "AIDAT_TAKIP") {
                showErrorToast("GEÇERSİZ YEDEK DOSYASI!");
                return;
            }
            
            const sb = getSupabase();
            if (!sb) throw new Error('Supabase bağlantısı yok');
            
            if (data.daireler && data.daireler.length) {
                await sb.from('daireler').upsert(data.daireler);
            }
            
            if (data.tahsilatlar && data.tahsilatlar.length) {
                await sb.from('tahsilatlar').delete().neq('unit_key', 'RESTORE_LOCK');
                await sb.from('tahsilatlar').insert(data.tahsilatlar);
            }
            
            showSuccessToast("YÜKLENDI");
            setTimeout(() => location.reload(), 1200);
            
        } catch (error) {
            console.error('Import hatası:', error);
            showErrorToast("DOSYA HATASI!");
        }
    };
    reader.readAsText(file);
}

function askLogout() {
    showConfirmToast('OTURUMU KAPATMAK İSTEDİĞİNİZE EMİN MİSİNİZ?', async () => {
        await logout();
        stopAutoRefreshSession();
        setTimeout(() => window.location.href = 'login.html', 500);
    });
}

window.onhashchange = () => {
    const hash = window.location.hash;
    
    if (!hash) {
        closeModal('unitModal');
        renderBlocks();
    } else if (hash === "#block") {
        closeModal('unitModal');
        if (activeBlock) {
            renderUnits(activeBlock);
        }
    }
};

window.onload = () => {
    initApp();
};

// Android geri tuşu için history yönetimi
window.history.pushState({ page: 'main' }, '', window.location.href);

window.addEventListener('popstate', function(event) {
    const modal = document.getElementById('unitModal');
    const isModalOpen = modal && modal.style.display === 'flex';
    const isUnitView = document.getElementById('viewUnits') && 
                       !document.getElementById('viewUnits').classList.contains('hidden');
    
    if (isModalOpen) {
        closeModal('unitModal');
        window.history.pushState({ page: 'main' }, '', window.location.href);
        event.preventDefault();
    } else if (isUnitView && activeBlock) {
        renderBlocks();
        window.history.pushState({ page: 'main' }, '', window.location.href);
        event.preventDefault();
    } else {
        if (confirm('Uygulamadan çıkmak istediğinize emin misiniz?')) {
            // Çıkış yap
        } else {
            window.history.pushState({ page: 'main' }, '', window.location.href);
            event.preventDefault();
        }
    }
});
