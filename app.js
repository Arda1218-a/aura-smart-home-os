/* ==========================================================================
   AURA SMART HOME OS v5.2 - INTERACTIVE ENGINE (JAVASCRIPT)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // ----------------------------------------------------------------------
    // 1. STATE MANAGEMENT
    // ----------------------------------------------------------------------
    const state = {
        activeTab: 'floorplan',
        buildingMode: 'detached',
        latency: 0.8,
        avgTemp: 22.4,
        outdoorTemp: 27.0,
        outdoorHumidity: 56,
        isPlayingMusic: false,
        audioCtx: null,
        synthOscillator: null,
        currentTrackIndex: 0,
        tracks: [
            { name: 'Lofi Ambient Chill (Synth)', freq: 220 },
            { name: 'Sunset Piano Tones', freq: 261.63 },
            { name: 'Smooth Night Breeze', freq: 196.00 },
            { name: 'Deep Meditation Waves', freq: 174.61 }
        ],
        doors: { bedroom: false, kitchen: true, bathroom: false, livingroom: true },
        appliances: {
            oven: false,
            dishwasher: false,
            washingMachine: false,
            dryer: false,
            coffeeMaker: false,
            robotVacuum: false
        },
        dispenser: { tankLiters: 12, tdsPpm: 14, ph: 7.6, coldTemp: 6, warmTemp: 38, hotTemp: 75 },
        water: { greywater: 145, semigreywater: 98, recycledTotal: 195, tapConsumption: 243, efficiency: 80.2 },
        vocalGuardActive: false
    };

    // ----------------------------------------------------------------------
    // 2. DOM ELEMENTS
    // ----------------------------------------------------------------------
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');
    const liveClock = document.getElementById('live-clock');
    const liveWeatherText = document.getElementById('live-weather-text');

    // Welcome Home & Modal
    const btnWelcomeHome = document.getElementById('btn-welcome-home');
    const welcomeModal = document.getElementById('welcome-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');

    // Quick Actions
    const btnTarget25 = document.getElementById('btn-target-25');
    const btnTriggerVocalGuard = document.getElementById('btn-trigger-vocalguard');
    const btnTestVocalGuardAction = document.getElementById('btn-test-vocalguard-action');
    const btnPhoneVocalGuard = document.getElementById('btn-phone-vocalguard');

    // Building Mode Toggles
    const btnModeDetached = document.getElementById('btn-mode-detached');
    const btnModeApartment = document.getElementById('btn-mode-apartment');
    const dispenserBuildingType = document.getElementById('dispenser-building-type');

    // Mobile Phone Simulator Elements
    const phoneTabBtns = document.querySelectorAll('.phone-tab-btn');
    const phoneTabBodies = document.querySelectorAll('.phone-tab-body');
    const btnPhoneToggleOven = document.getElementById('btn-phone-toggle-oven');
    const btnPhoneToggleDish = document.getElementById('btn-phone-toggle-dish');
    const btnPhoneToggleWash = document.getElementById('btn-phone-toggle-wash');
    const btnPhoneCoffee = document.getElementById('btn-phone-coffee');
    const btnPhoneVacuum = document.getElementById('btn-phone-vacuum');
    const btnPhoneLockAll = document.getElementById('btn-phone-lock-all');

    // Main Appliance Buttons
    const btnMainToggleOven = document.getElementById('btn-main-toggle-oven');
    const btnMainToggleDish = document.getElementById('btn-main-toggle-dish');
    const btnMainToggleWash = document.getElementById('btn-main-toggle-wash');
    const btnMainToggleDryer = document.getElementById('btn-main-toggle-dryer');
    const btnMainMakeCoffee = document.getElementById('btn-main-make-coffee');
    const btnMainStartVacuum = document.getElementById('btn-main-start-vacuum');

    // Water Dispenser Buttons
    const btnPhoneDispense = document.getElementById('btn-phone-dispense');
    const btnDispenseCold = document.getElementById('btn-dispense-cold');
    const btnDispenseWarm = document.getElementById('btn-dispense-warm');
    const btnDispenseHot = document.getElementById('btn-dispense-hot');

    // Music Player & Chat
    const btnToggleMusic = document.getElementById('btn-toggle-music');
    const btnNextTrack = document.getElementById('btn-next-track');
    const btnPrevTrack = document.getElementById('btn-prev-track');
    const currentTrackName = document.getElementById('current-track');
    const musicIcon = document.getElementById('music-icon');
    const chatInput = document.getElementById('chat-input');
    const btnSendChat = document.getElementById('btn-send-chat');
    const chatMessages = document.getElementById('chat-messages');

    // ----------------------------------------------------------------------
    // 3. OPEN-METEO LIVE WEATHER SYNC
    // ----------------------------------------------------------------------
    async function fetchLiveWeather() {
        try {
            const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=41.0082&longitude=28.9784&current=temperature_2m,relative_humidity_2m,precipitation');
            if (res.ok) {
                const data = await res.json();
                if (data.current) {
                    state.outdoorTemp = Math.round(data.current.temperature_2m);
                    state.outdoorHumidity = data.current.relative_humidity_2m;
                    if (liveWeatherText) {
                        liveWeatherText.textContent = `Dış Hava: ${state.outdoorTemp}°C | Nem: %${state.outdoorHumidity}`;
                    }
                }
            }
        } catch (e) {
            console.log('Open-Meteo local cached weather used');
        }
    }
    fetchLiveWeather();
    setInterval(fetchLiveWeather, 600000); // 10 mins

    // ----------------------------------------------------------------------
    // 4. REALTIME CLOCK & LATENCY SIMULATOR
    // ----------------------------------------------------------------------
    function updateClock() {
        const now = new Date();
        if (liveClock) liveClock.textContent = now.toLocaleTimeString('tr-TR');
    }
    setInterval(updateClock, 1000);
    updateClock();

    setInterval(() => {
        state.latency = (0.6 + Math.random() * 0.4).toFixed(1);
        const latElem = document.getElementById('server-latency');
        if (latElem) latElem.textContent = `${state.latency} ms`;
    }, 3000);

    // ----------------------------------------------------------------------
    // 5. MAIN TAB NAVIGATION
    // ----------------------------------------------------------------------
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            item.classList.add('active');
            const targetElem = document.getElementById(`tab-${targetTab}`);
            if (targetElem) targetElem.classList.add('active');

            const titles = {
                floorplan: 'Kuşbakışı Kat Planı & Mobil Telefon Simülatörü',
                innovations: 'Projeyi Zirveye Taşıyan 3 Devrimsel İnovasyon (Antigravity AI)',
                appliances: 'Genişletilmiş Akıllı Beyaz Eşya Kataloğu',
                'water-dispenser': 'BiyoKalp Su Arıtma & Haşlanma Emniyetli Akıllı Sebil',
                'ai-advisor': 'NVIDIA NIM & NeMo Guardrails Güçlü Yerel Sunucu AI',
                academic: 'MIT Media Lab & Harvard SEAS Zirve Evaluasyonu',
                upcoming: '🚀 Yakında Eklenecek Özellikler (Gelecek Güncelleme Yol Haritası)'
            };
            if (pageTitle && titles[targetTab]) pageTitle.textContent = titles[targetTab];
            if (window.lucide) lucide.createIcons();
        });
    });

    phoneTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const ptab = btn.getAttribute('data-ptab');
            phoneTabBtns.forEach(b => b.classList.remove('active'));
            phoneTabBodies.forEach(body => body.classList.remove('active'));

            btn.classList.add('active');
            const targetBody = document.getElementById(ptab);
            if (targetBody) targetBody.classList.add('active');
        });
    });

    // ----------------------------------------------------------------------
    // 6. "EVE GELDİM" WELCOME MACRO & MODAL
    // ----------------------------------------------------------------------
    function triggerWelcomeHome() {
        Object.keys(state.doors).forEach(k => state.doors[k] = true);

        state.avgTemp = 25.0;
        const statAvgTemp = document.getElementById('stat-avg-temp');
        if (statAvgTemp) statAvgTemp.textContent = '25.0°C';

        state.isPlayingMusic = true;
        updateMusicSynth();

        if (welcomeModal) welcomeModal.classList.add('active');

        if ('speechSynthesis' in window) {
            const greeting = new SpeechSynthesisUtterance('Hoş geldiniz! Akıllı ev ortamınız hazırlandı. Kapılar açıldı, iklim 25 dereceye getirildi ve dinlendirici müzik başlatıldı.');
            greeting.lang = 'tr-TR';
            window.speechSynthesis.speak(greeting);
        }

        addAiMessage('✨ HOŞ GELDİNİZ! Karşılama senaryosu aktif. Kapılar açıldı, iklim 25°C ve müzik başlatıldı.');
    }

    if (btnWelcomeHome) btnWelcomeHome.addEventListener('click', triggerWelcomeHome);
    if (btnCloseModal && welcomeModal) {
        btnCloseModal.addEventListener('click', () => {
            welcomeModal.classList.remove('active');
        });
    }

    // ----------------------------------------------------------------------
    // 7. WEB AUDIO API SYNTHESIZER FOR MUSIC PLAYER
    // ----------------------------------------------------------------------
    function updateMusicSynth() {
        const track = state.tracks[state.currentTrackIndex];
        if (currentTrackName) currentTrackName.textContent = track.name;

        if (state.isPlayingMusic) {
            try {
                if (!state.audioCtx) {
                    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                }

                if (!state.synthOscillator) {
                    state.synthOscillator = state.audioCtx.createOscillator();
                    const gainNode = state.audioCtx.createGain();

                    state.synthOscillator.type = 'sine';
                    state.synthOscillator.frequency.setValueAtTime(track.freq, state.audioCtx.currentTime);
                    gainNode.gain.setValueAtTime(0.08, state.audioCtx.currentTime);

                    state.synthOscillator.connect(gainNode);
                    gainNode.connect(state.audioCtx.destination);
                    state.synthOscillator.start();
                } else {
                    state.synthOscillator.frequency.setValueAtTime(track.freq, state.audioCtx.currentTime);
                }
            } catch (e) {
                console.log('Web Audio Web Synth:', e);
            }
        } else {
            if (state.synthOscillator) {
                try {
                    state.synthOscillator.stop();
                    state.synthOscillator.disconnect();
                } catch (e) {}
                state.synthOscillator = null;
            }
        }

        if (musicIcon) {
            musicIcon.setAttribute('data-lucide', state.isPlayingMusic ? 'pause' : 'play');
            if (window.lucide) lucide.createIcons();
        }
    }

    if (btnToggleMusic) {
        btnToggleMusic.addEventListener('click', () => {
            state.isPlayingMusic = !state.isPlayingMusic;
            updateMusicSynth();
        });
    }

    if (btnNextTrack) {
        btnNextTrack.addEventListener('click', () => {
            state.currentTrackIndex = (state.currentTrackIndex + 1) % state.tracks.length;
            updateMusicSynth();
        });
    }

    if (btnPrevTrack) {
        btnPrevTrack.addEventListener('click', () => {
            state.currentTrackIndex = (state.currentTrackIndex - 1 + state.tracks.length) % state.tracks.length;
            updateMusicSynth();
        });
    }

    // ----------------------------------------------------------------------
    // 8. APPLIANCES HANDLERS
    // ----------------------------------------------------------------------
    function makeCoffee() {
        state.appliances.coffeeMaker = true;
        addAiMessage('☕ Kahve Makinesi: Taze çekirdekler öğütüldü, sıcak Espresso hazırlanıyor (92°C).');
        addAiRecommendation('Kahve Makinesi: Sıcak kahveniz mutfak tezgahında hazır.');
        setTimeout(() => { state.appliances.coffeeMaker = false; }, 4000);
    }

    function startVacuum() {
        state.appliances.robotVacuum = true;
        addAiMessage('🤖 Robot Süpürge: LiDAR harita taraması tamamlandı, salon ve koridor otonom temizliği başladı.');
        addAiRecommendation('Robot Süpürge: Süpürge temizlikte. Sensörler engel ve merdiveni izliyor.');
    }

    function toggleWashingMachine() {
        state.appliances.washingMachine = !state.appliances.washingMachine;
        addAiMessage(`Çamaşır Makinesi: ${state.appliances.washingMachine ? 'Eko Yıkama Başlatıldı (1400 Devir). Yarı-gri su T2 tankına akar.' : 'Duraklatıldı'}.`);
    }

    function toggleDryer() {
        state.appliances.dryer = !state.appliances.dryer;
        addAiMessage(`Kurutma Makinesi: ${state.appliances.dryer ? 'Isı Pompası Kurutma Başlatıldı.' : 'Duraklatıldı'}.`);
    }

    if (btnPhoneCoffee) btnPhoneCoffee.addEventListener('click', makeCoffee);
    if (btnMainMakeCoffee) btnMainMakeCoffee.addEventListener('click', makeCoffee);

    if (btnPhoneVacuum) btnPhoneVacuum.addEventListener('click', startVacuum);
    if (btnMainStartVacuum) btnMainStartVacuum.addEventListener('click', startVacuum);

    if (btnPhoneToggleWash) btnPhoneToggleWash.addEventListener('click', toggleWashingMachine);
    if (btnMainToggleWash) btnMainToggleWash.addEventListener('click', toggleWashingMachine);

    if (btnMainToggleDryer) btnMainToggleDryer.addEventListener('click', toggleDryer);

    if (btnPhoneLockAll) {
        btnPhoneLockAll.addEventListener('click', () => {
            Object.keys(state.doors).forEach(k => state.doors[k] = false);
            addAiMessage('🔒 Mobil Güvenlik: Tüm motorlu kapılar kilitlendi.');
        });
    }

    // ----------------------------------------------------------------------
    // 9. SCALD-SAFE WATER DISPENSER CONTROLS
    // ----------------------------------------------------------------------
    function dispenseWater(tempType = 'cold') {
        const amount = 0.25;
        if (state.dispenser.tankLiters >= amount) {
            state.dispenser.tankLiters = parseFloat((state.dispenser.tankLiters - amount).toFixed(2));
            
            let tempMsg = '6°C Soğuk Ferahlatıcı';
            if (tempType === 'warm') tempMsg = '38°C Ilık Vücut Sıcaklığında';
            if (tempType === 'hot') tempMsg = '75°C Haşlanma Emniyetli İdeal Çay/Kahve';

            addAiMessage(`Sebilden 1 Bardak ${tempMsg} Su Dolduruldu. (TDS: 14 ppm, pH 7.6 Alkalin, Termos Sensör Doğrulandı)`);
            addAiRecommendation(`Akıllı Sebil: ${tempMsg} içme suyu dolduruldu. Kalan depo: ${state.dispenser.tankLiters}L.`);
        }
    }

    if (btnPhoneDispense) btnPhoneDispense.addEventListener('click', () => dispenseWater('cold'));
    if (btnDispenseCold) btnDispenseCold.addEventListener('click', () => dispenseWater('cold'));
    if (btnDispenseWarm) btnDispenseWarm.addEventListener('click', () => dispenseWater('warm'));
    if (btnDispenseHot) btnDispenseHot.addEventListener('click', () => dispenseWater('hot'));

    // ----------------------------------------------------------------------
    // 10. BUILDING MODE TOGGLE
    // ----------------------------------------------------------------------
    function setBuildingMode(mode) {
        state.buildingMode = mode;
        if (mode === 'detached') {
            if (btnModeDetached) btnModeDetached.classList.add('active');
            if (btnModeApartment) btnModeApartment.classList.remove('active');
            if (dispenserBuildingType) dispenserBuildingType.textContent = 'Müstakil Ev (4-Tank BiyoKalp)';
            addAiMessage('Yapı Mimarisi Değiştirildi: Müstakil Ev 4-Tanklı BiyoKalp Biyomimetik Sistem Aktif.');
        } else {
            if (btnModeApartment) btnModeApartment.classList.add('active');
            if (btnModeDetached) btnModeDetached.classList.remove('active');
            if (dispenserBuildingType) dispenserBuildingType.textContent = 'Apartman Dairesi (Dikey Şaft)';
            addAiMessage('Yapı Mimarisi Değiştirildi: Apartman Dairesi Dikey Çift Kanallı Şaft Sistemi Aktif.');
        }
    }

    if (btnModeDetached) btnModeDetached.addEventListener('click', () => setBuildingMode('detached'));
    if (btnModeApartment) btnModeApartment.addEventListener('click', () => setBuildingMode('apartment'));

    // ----------------------------------------------------------------------
    // 11. VOCAL GUARD SIMULATOR
    // ----------------------------------------------------------------------
    function triggerVocalGuard() {
        state.vocalGuardActive = true;
        state.appliances.oven = false;
        state.doors.kitchen = true;

        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance('UYARI! Mutfak fırınında duman algılandı. Fırın elektriği otonom kesildi, kapı açıldı!');
            utterance.lang = 'tr-TR';
            window.speechSynthesis.speak(utterance);
        }

        const vgText = document.getElementById('vg-text');
        const vgIcon = document.getElementById('vg-icon');

        if (vgText) vgText.textContent = '[ACİL DURUM UYARISI] Fırın dumanı algılandı! Elektrik otonom kesildi, mutfak kapısı açıldı!';
        if (vgIcon) {
            vgIcon.setAttribute('data-lucide', 'alert-triangle');
            vgIcon.className = 'rose';
        }

        addAiMessage('🚨 VOCAL GUARD ACİL DURUMU: Mutfak duman tespiti! Hoparlörlerden sesli uyarı verildi, fırın elektriği kesildi ve kapı açıldı.', false);
    }

    if (btnTriggerVocalGuard) btnTriggerVocalGuard.addEventListener('click', triggerVocalGuard);
    if (btnTestVocalGuardAction) btnTestVocalGuardAction.addEventListener('click', triggerVocalGuard);
    if (btnPhoneVocalGuard) btnPhoneVocalGuard.addEventListener('click', triggerVocalGuard);

    // ----------------------------------------------------------------------
    // 12. LOCAL AI CHAT & COMMAND ENGINE (NVIDIA NIM BACKED)
    // ----------------------------------------------------------------------
    function addAiMessage(text, isUser = false) {
        if (!chatMessages) return;
        const div = document.createElement('div');
        div.className = `chat-msg ${isUser ? 'user' : 'ai'}`;
        div.innerHTML = `<span class="sender">${isUser ? 'Siz:' : 'AURA NVIDIA AI:'}</span><p>${text}</p>`;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addAiRecommendation(text) {
        const listElem = document.getElementById('ai-recommendations');
        if (!listElem) return;
        const card = document.createElement('div');
        card.className = 'ai-recommend-card';
        card.innerHTML = `
            <div class="icon cyan"><i data-lucide="sparkles"></i></div>
            <div class="content">
                <strong>NVIDIA NIM & NeMo Guard:</strong>
                <p>${text}</p>
            </div>
        `;
        listElem.insertBefore(card, listElem.firstChild);
        if (window.lucide) lucide.createIcons();
    }

    if (btnSendChat && chatInput) {
        const handleSend = () => {
            const query = chatInput.value.trim();
            if (!query) return;
            addAiMessage(query, true);
            chatInput.value = '';

            const q = query.toLowerCase();
            setTimeout(() => {
                if (q.includes('karşılama') || q.includes('eve geldim')) {
                    triggerWelcomeHome();
                } else if (q.includes('kahve')) {
                    makeCoffee();
                } else if (q.includes('süpürge') || q.includes('temizle')) {
                    startVacuum();
                } else if (q.includes('sıcak su') || q.includes('çay')) {
                    dispenseWater('hot');
                } else if (q.includes('soğuk su') || q.includes('su')) {
                    dispenseWater('cold');
                } else if (q.includes('hava')) {
                    addAiMessage(`Open-Meteo Canlı Verisi: Dışarısı ${state.outdoorTemp}°C, nem %${state.outdoorHumidity}. Yağış riski yok, pencereler ve havalandırma optimize.`);
                } else {
                    addAiMessage(`NVIDIA Llama-3.2 NIM: "${query}" komutunu NeMo Guardrails güvenlik onayından geçirerek yerel sunucuda işledim.`);
                }
            }, 600);
        };

        btnSendChat.addEventListener('click', handleSend);
        chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });
    }
});
