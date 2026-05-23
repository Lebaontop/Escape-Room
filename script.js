class SolarGamesEngine {
    constructor() {
        this.coins = 0; 
        this.globalTime = 90 * 60; // 1:30:00
        this.isTimerRunning = false;
        this.timeFrozen = false;
        
        this.activeGate = null;
        this.solvedGates = new Set();
        this.audioCtx = null;
        
        this.gameConfig = this.buildPuzzles();
        this.init();
        this.setupClickListeners();
        
        setInterval(() => {
            if(this.isTimerRunning && !this.timeFrozen && this.globalTime > 0) {
                this.globalTime--;
                this.updateGlobalTimerUI();
            }
        }, 1000);
    }

    init() { 
        this.renderLobby(); 
        this.updateCoinsUI();
        this.updateGlobalTimerUI();
    }

    initAudio() {
        if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    }

    playSound(type) {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator(); const gain = this.audioCtx.createGain();
        osc.connect(gain); gain.connect(this.audioCtx.destination); const now = this.audioCtx.currentTime;
        if(type === 'click') {
            osc.type = 'square'; osc.frequency.setValueAtTime(350, now);
            gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'success') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(523.25, now); osc.frequency.setValueAtTime(659.25, now + 0.1); 
            gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.4);
            osc.start(now); osc.stop(now + 0.4);
        } else if (type === 'error') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, now);
            gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
        }
    }
    
    showToast(msg, color = 'var(--gold)') {
        const t = document.createElement('div'); t.className = 'toast'; t.innerText = msg; t.style.borderRightColor = color;
        document.getElementById('toast-container').appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }

    triggerVisualGlitch() { 
        const c = document.getElementById('main-puzzle-card'); 
        if(c) { c.classList.add('error-glitch'); setTimeout(()=>c.classList.remove('error-glitch'), 400); } 
    }
    
    setupClickListeners() { 
        document.addEventListener('click', (e) => { 
            if(e.target.tagName==='BUTTON' || e.target.classList.contains('box-lux') || e.target.classList.contains('stone-btn') || e.target.classList.contains('flip-card') || e.target.closest('.channel-card') || e.target.classList.contains('wire-lux') || e.target.classList.contains('simon-box') || e.target.classList.contains('astro-ring') || e.target.classList.contains('cryp-btn') || e.target.classList.contains('bc-bar') || e.target.classList.contains('dna-clickable') || e.target.classList.contains('pipe-cell') || e.target.classList.contains('slide-tile') || e.target.classList.contains('heat-btn') || e.target.classList.contains('elevator-btn') || e.target.classList.contains('matrix-word')){ 
                this.initAudio(); this.playSound('click'); 
            } 
        }); 
    }

    buildPuzzles() {
        const riddles = [
            {q: "شيء كلما زاد، قلّت رؤيتك له.", a: "الظلام"}, {q: "ابن الماء، وإذا وضعته في الماء مات.", a: "الثلج"},
            {q: "شيء احتفاظك به لك، وإذا شاركته مع الناس فقدته؟", a: "السر"}, {q: "شيء يرتفع ولا ينزل أبدًا؟", a: "العمر"},
            {q: "يتحدث بلا فم ويسمع بلا أذنين؟", a: "الصدى"}, {q: "مليء بالثقوب ولكنه يحتفظ بالماء؟", a: "الاسفنج"},
            {q: "دائمًا أمامك ولكن لا يمكنك رؤيته؟", a: "المستقبل"}, {q: "لا يمكنك الاحتفاظ به إلا بعد إعطائه؟", a: "الوعد"},
            {q: "إذا نطقت باسمه كسرته؟", a: "الصمت"}, {q: "شيء يجب كسره قبل استخدامه؟", a: "البيضة"},
            {q: "كلما جففت شيئًا، أصبحت أكثر بللًا؟", a: "المنشفة"}, {q: "فيها مدن بلا منازل، وغابات بلا أشجار؟", a: "الخريطة"},
            {q: "لها عقارب ولكن لا تلدغ؟", a: "الساعة"}, {q: "يمشي بلا أرجل ويبكي بلا أعين؟", a: "السحاب"},
            {q: "أخضر من الخارج، أحمر من الداخل؟", a: "البطيخ"}, {q: "له رأس ولا عين له؟", a: "المسمار"},
            {q: "يبكي دمعًا أسود ليضيء العقول؟", a: "القلم"}, {q: "يكبر في الصباح ويختفي في الظهيرة؟", a: "الظل"},
            {q: "دائمًا تشير للشمال ولكنها لا تتحرك؟", a: "البوصلة"}, {q: "تسمعها ولكن لا تراها ولا تلمسها؟", a: "الريح"},
            {q: "تأكل كل شيء وتخاف من الماء؟", a: "النار"}, {q: "كلما أخذت منه كبر؟", a: "الحفرة"},
            {q: "يقرصك ولا تراه؟", a: "الجوع"}, {q: "يملكه الشخص ويستخدمه الآخرون أكثر منه؟", a: "الاسم"},
            {q: "كلما أخذت منه أكثر، تركت أكثر وراءك؟", a: "الخطوة"}, {q: "يسقط ولا يتأذى أبدًا؟", a: "المطر"},
            {q: "كلمة من 4 حروف، إذا أكلت نصفها تموت؟", a: "سمسم"}, {q: "مدينة سعودية تقرأ طرديا وعكسيا نفس الشيء؟", a: "العلا"},
            {q: "تحترق وتبكي لتضيء للآخرين؟", a: "الشمعة"}, {q: "المعدن النقي الذي يرمز لنسخة الاختراق النهائي؟", a: "الذهب"}
        ];

        let mechanics = [];
        for(let i=1; i<=30; i++) {
            let m = { id: i, type: `GAME_${i}` };
            
            if(i===1) { m.uiType = 'WIRES'; m.desc="اقطع 3 أسلاك محددة. (الأول ذهبي؟ اقطع الثالث الأسود)."; m.data=['#D4AF37','#ff3333','#333','#fff','#D4AF37','#00ccff','#333','#ff3333']; m.ans=[2,5,7]; m.hint="💡 تفاعلي: الأسود الأول، الأزرق، ثم الأحمر الأخير. | 📝 كتابي: يعتم كلما زاد."; }
            else if(i===2) { m.uiType = 'SIMON'; m.desc="النبض: 3 جولات متتالية."; m.data=16; m.hint="💡 تفاعلي: ركز ووجهني للأنماط بدون أرقام. | 📝 كتابي: يذوب في الحرارة."; }
            else if(i===3) { m.uiType = 'MASTERMIND'; m.desc="خزنة الألوان: أدخل 4 أرقام (أخضر=مكانه صح، برتقالي=موجود لكن مكانه غلط)."; m.ans=[3,7,1,9]; m.hint="💡 تفاعلي: الكود هو 3719. | 📝 كتابي: لا يمكنك البوح به."; }
            else if(i===4) { m.uiType = 'MATCH'; m.desc="تطابق الأشكال: 20 شريحة فلكية."; m.data=['🪐','☄️','🌑','🔭','🛸','🛰️','🌌','🌠','🚀','👨‍🚀']; m.hint="💡 تفاعلي: احفظ الأماكن ووجهني. | 📝 كتابي: يزيد ولا ينقص."; }
            else if(i===5) { m.uiType = 'COMPASS'; m.desc="البوصلة الفلكية: وجه الإبرة للزاوية الدقيقة 135."; m.ans=135; m.hint="💡 تفاعلي: أسفل اليمين (135 درجة). | 📝 كتابي: يرتد لك من الجدار."; }
            else if(i===6) { m.uiType = 'STONE_RUNES'; m.desc="المعبد القديم: اضغط الرموز الحجرية المتطابقة."; m.data=['𐤀','𐤁','𐤂','𐤃','𐤄','𐤅']; m.ans=[1,4]; m.hint="💡 تفاعلي: الرمز الثاني والخامس. | 📝 كتابي: يمتص السوائل."; }
            else if(i===7) { m.uiType = 'SCALES'; m.desc="الميزان الروماني: اختر أوزان مجموعها 150."; m.data=[50,70,30,80,20]; m.target=150; m.hint="💡 تفاعلي: 70 + 80. | 📝 كتابي: يأتي غداً."; }
            else if(i===8) { m.uiType = 'RADAR_ROUNDS'; m.desc="الرادار المعتم (3 راوندات): تصاعدي (5x5, 7x7, 9x9)."; m.hint="💡 تفاعلي: ركز في مكان الوميض الخاطف. | 📝 كتابي: تقطعه لتفي به."; }
            else if(i===9) { m.uiType = 'PAPYRUS'; m.desc="لفافة البردي: اقرأ النص السري."; m.ans='AMUN'; m.hint="💡 تفاعلي: الكلمة AMUN. | 📝 كتابي: لغته السكوت."; }
            else if(i===10) { m.uiType = 'ASTRO_CLOCK'; m.desc="الساعة الفلكية: قم بتسوية الحلقات الثلاث (شمس، قمر، نجم) للأعلى."; m.ans=[0,0,0]; m.hint="💡 تفاعلي: دورها كلها لفوق (الساعة 12). | 📝 كتابي: قشرتها هشة."; }
            else if(i===11) { m.uiType = 'NEON_NODES'; m.desc="الشبكة السيبرانية: اربط الأطراف العلوية فقط."; m.data=12; m.ans=[0,1,2,3]; m.hint="💡 تفاعلي: الصف الأول كامل. | 📝 كتابي: تنشفك وتتبلل."; }
            else if(i===12) { m.uiType = 'JUGS'; m.desc="دوارق الخيمياء: احصل على 4 لتر من (8, 5, 3)."; m.hint="💡 تفاعلي: املأ الـ 5، صب في 3، يبقى 2.. | 📝 كتابي: ترسم العالم."; }
            else if(i===13) { m.uiType = 'SLIDERS'; m.desc="اللوحة الصناعية: اضبط التردد (75, 40, 90)."; m.data=[{label:'FREQ',max:100},{label:'AMP',max:100},{label:'PITCH',max:100}]; m.ans=[75,40,90]; m.hint="💡 تفاعلي: 75، 40، 90. | 📝 كتابي: تعرف بها الوقت."; }
            else if(i===14) { m.uiType = 'SLIDING_PUZZLE'; m.desc="الجدارية المكسورة: رتب القطع (1-8)."; m.hint="💡 تفاعلي: رتبها تصاعدياً 1 لـ 8. | 📝 كتابي: يمطر."; }
            else if(i===15) { m.uiType = 'BLIND_MAZE'; m.desc="متاهة المينوتور: 6x6 معتمة. خطوة غلط ترجعك للصفر."; m.data=36; m.ans=[0,6,12,13,14,20,26,32,33,34,35]; m.hint="💡 تفاعلي: تحت 3 مرات، يمين مرتين... | 📝 كتابي: صيفي ولذيذ."; }
            else if(i===16) { m.uiType = 'CAESAR'; m.desc="تشفير دافنشي: أزح كلمة ABC بمقدار +3."; m.ans='DEF'; m.hint="💡 تفاعلي: الكلمة DEF. | 📝 كتابي: يثبت الأشياء."; }
            else if(i===17) { m.uiType = 'SHELLS'; m.desc="الخفة: تتبع الكوب الذهبي."; m.data=3; m.ans=1; m.hint="💡 تفاعلي: الكوب اللي بالمنتصف. | 📝 كتابي: أداة الكتابة."; }
            else if(i===18) { m.uiType = 'BARCODE'; m.desc="الباركود الممزق: 2, 4, 8, ؟"; m.ans='16'; m.hint="💡 تفاعلي: 16. | 📝 كتابي: يتبعك بالشمس."; }
            else if(i===19) { m.uiType = 'RADIO'; m.desc="جهاز الإرسال العسكري: أوجد التردد الصافي."; m.ans=199; m.hint="💡 تفاعلي: التردد 199. | 📝 كتابي: تدل على الشمال."; }
            else if(i===20) { m.uiType = 'LIGHTS_OUT'; m.desc="معبد الشعلات: أطفئ جميع النيران (3x3)."; m.data=9; m.hint="💡 تفاعلي: الأطراف ثم المنتصف. | 📝 كتابي: لا تُرى."; }
            else if(i===21) { m.uiType = 'ANOMALY_RUNES'; m.desc="الشذوذ الأثري: ابحث عن الرمز المقلوب."; m.data=25; m.ans=18; m.hint="💡 تفاعلي: الصف الرابع، الثالث. | 📝 كتابي: تخاف من الماء."; }
            else if(i===22) { m.uiType = 'DNA'; m.desc="فك شفرة الحمض: A=T, C=G."; m.ans='TGCA'; m.hint="💡 تفاعلي: TGCA. | 📝 كتابي: تكبر كلما أخذت منها."; }
            else if(i===23) { m.uiType = 'PIPES'; m.desc="الأنابيب القديمة: صل البداية بالنهاية."; m.hint="💡 تفاعلي: دور الأنابيب لتكون خط مستقيم. | 📝 كتابي: يقرصك ببطنك."; }
            else if(i===24) { m.uiType = 'KEYPAD'; m.desc="خزنة الكيبورد: أدخل 4321."; m.ans='4321'; m.hint="💡 تفاعلي: 4321. | 📝 كتابي: ينادونك به."; }
            else if(i===25) { m.uiType = 'MAGIC_SQUARE'; m.desc="الرياضيات الإسلامية: المجموع 15 بكل الاتجاهات."; m.ans='5'; m.hint="💡 تفاعلي: المنتصف 5. | 📝 كتابي: تتركها وراءك."; }
            else if(i===26) { m.uiType = 'HEATMAP'; m.desc="البصمة الحرارية: من الأسخن للأبرد."; m.ans='8491'; m.hint="💡 تفاعلي: 8491. | 📝 كتابي: قطرات من السماء."; }
            else if(i===27) { m.uiType = 'MATRIX'; m.desc="النص المنسدل: أوقف الشاشة عند الكلمة."; m.ans='SOLAR'; m.hint="💡 تفاعلي: SOLAR. | 📝 كتابي: افتح يا..."; }
            else if(i===28) { m.uiType = 'ELEVATOR'; m.desc="المصعد: انزل للدور السفلي (B3)."; m.ans='B3'; m.hint="💡 تفاعلي: B3. | 📝 كتابي: مدينة تاريخية."; }
            else if(i===29) { m.uiType = 'MATH_HACK'; m.desc="معادلة الجدار الناري: (10 * 5) + 50."; m.ans='100'; m.hint="💡 تفاعلي: 100. | 📝 كتابي: تذوب لتضيء."; }
            else if(i===30) { m.uiType = 'BOSS'; m.desc="العرش الذهبي: فعل الـ 3 مفاتيح واكتب GOLDEN."; m.ans='GOLDEN'; m.hint="💡 تفاعلي: GOLDEN | 📝 كتابي: معدن أصفر نفيس."; }

            m.txtQ = riddles[i-1].q;
            m.txtA = riddles[i-1].a;
            mechanics.push(m);
        }
        return mechanics;
    }

    toggleGlobalTimer() { 
        this.playSound('click'); this.isTimerRunning = !this.isTimerRunning; 
        this.showToast(this.isTimerRunning ? "تم تشغيل العداد" : "تم إيقاف العداد");
    }
    modifyGlobalTimer(secs) { 
        this.playSound('click'); this.globalTime = Math.max(0, this.globalTime + secs); this.updateGlobalTimerUI(); 
    }
    updateGlobalTimerUI() {
        let h = Math.floor(this.globalTime / 3600).toString().padStart(2,'0');
        let m = Math.floor((this.globalTime % 3600) / 60).toString().padStart(2,'0');
        let s = (this.globalTime % 60).toString().padStart(2,'0');
        document.getElementById('global-timer-display').innerText = `${h}:${m}:${s}`;
        document.getElementById('market-time').innerText = `${h}:${m}:${s}`;
        document.getElementById('global-timer-display').style.color = this.timeFrozen ? '#00ccff' : '#fff';
    }

    addCoins(amount) {
        this.playSound('click'); this.coins = Math.max(0, this.coins + amount); this.updateCoinsUI();
        if(amount > 0) this.showToast(`تم استخراج ${amount} بيانات!`); else this.showToast(`تم خصم ${Math.abs(amount)} بيانات!`, '#ff3333');
    }
    updateCoinsUI() {
        document.getElementById('coin-val').innerText = this.coins; document.getElementById('market-coins').innerText = this.coins;
    }

    toggleMarket(show) {
        this.playSound('click'); const m = document.getElementById('market-modal');
        if(show) { m.classList.remove('hidden'); this.updateCoinsUI(); this.updateGlobalTimerUI(); } else m.classList.add('hidden');
    }
    
    buyHint(type) {
        this.playSound('click');
        if(!this.activeGate) { this.showToast('يجب أن تكون داخل روم!', '#ff3333'); return; }
        if(type === 'coins') {
            if(this.coins >= 60) { this.coins -= 60; this.showToast('تم فك التشفير بنجاح!'); this.displayHint(); } 
            else { this.showToast('بيانات غير كافية!', '#ff3333'); }
        } else if (type === 'time') {
            if(this.globalTime > 300) { this.globalTime -= 300; this.showToast('تم الشراء بخصم 5 دقائق!'); this.displayHint(); } 
            else { this.showToast('الوقت لا يكفي!', '#ff3333'); }
        }
        this.updateCoinsUI(); this.updateGlobalTimerUI();
    }

    buyFreeze() {
        this.playSound('click');
        if(this.coins >= 40) {
            if(this.timeFrozen) { this.showToast('مجمد مسبقاً!', '#ff3333'); return; }
            this.coins -= 40; this.timeFrozen = true; this.updateGlobalTimerUI(); this.showToast('❄️ تم تجميد الحماية!', '#00ccff');
            setTimeout(() => { this.timeFrozen = false; this.updateGlobalTimerUI(); this.showToast('انتهى التجميد!', '#ff3333'); }, 120000); 
        } else { this.showToast('بيانات غير كافية!', '#ff3333'); }
        this.updateCoinsUI();
    }

    displayHint() {
        this.toggleMarket(false);
        const hd = document.getElementById('hint-display');
        hd.innerHTML = this.activeGate.hint.replace('|', '<br><br>'); 
        hd.classList.remove('hidden');
    }

    switchScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(`screen-${id}`).classList.remove('hidden');
        document.getElementById('main-nav').classList.toggle('hidden', id === 'welcome');
    }

    startLobby() { this.initAudio(); this.playSound('click'); this.isTimerRunning = true; this.switchScreen('lobby'); }

    renderLobby() {
        const c = document.getElementById('gates-container'); c.innerHTML = '';
        for(let i=1; i<=30; i++) {
            let btn = document.createElement('div'); 
            let isSolved = this.solvedGates.has(i);
            let isLocked = i !== 1 && !this.solvedGates.has(i - 1); 
            let isNext = !isSolved && !isLocked; 
            btn.className = `channel-card ${isSolved ? 'solved' : ''} ${isLocked ? 'locked' : ''} ${isNext ? 'unlocked-next' : ''}`;
            
            let info = document.createElement('div'); info.className = 'channel-info';
            let title = document.createElement('h3'); title.innerText = `CHANNEL-${i.toString().padStart(2, '0')}`;
            let status = document.createElement('span'); status.className = 'channel-status';
            
            if(isNext) { status.innerText = 'BYPASS REQUIRED'; status.style.color = 'var(--gold)'; }
            else if(isSolved) { status.innerText = 'HACKED'; status.style.color = 'var(--green)'; }
            else { status.innerText = 'ENCRYPTED'; status.style.color = '#555'; }

            info.append(title, status); btn.appendChild(info);
            btn.addEventListener('click', () => { if(!isLocked) this.handleGateClick(i); });
            c.appendChild(btn);
        }
    }

    handleGateClick(id) {
        if(this.solvedGates.has(id)) return;
        this.activeGate = this.gameConfig.find(x => x.id === id);
        
        document.getElementById('interactive-stage-container').classList.remove('hidden');
        document.getElementById('text-stage').classList.add('hidden');
        document.getElementById('input-area').classList.add('hidden');
        document.getElementById('user-input').value = '';
        document.getElementById('hint-display').classList.add('hidden'); 
        document.getElementById('puzzle-title').innerHTML = `<span style="color:#aaa;">🔊</span> # CHANNEL-${id.toString().padStart(2,'0')}`;

        this.setupStage(); this.switchScreen('puzzle');
    }

    // المُولد البصري المفصول لكل لغز من الـ 30 لمنع التداخل (Block Scoping)
    setupStage() {
        const p = this.activeGate;
        document.getElementById('int-desc').innerText = p.desc;
        const stage = document.getElementById('interactive-stage');
        
        stage.innerHTML = `<div class="lux-panel" id="lux-inner-stage"></div>`;
        const innerStage = document.getElementById('lux-inner-stage');
        this.stageState = { clicks: 0, arr: [], val: 0, attempts: 0, playing: true };

        const generateSubmitButton = (callback) => {
            let btn = document.createElement('button'); btn.className = 'btn-execute'; btn.innerText = 'تأكيد (Execute)'; 
            btn.onclick = callback; return btn;
        };

        const createInputBlock = (placeholder, ans) => {
            let wrap = document.createElement('div'); wrap.style.cssText = 'width:100%; display:flex; flex-direction:column; align-items:center;';
            let inp = document.createElement('input'); inp.type = 'text'; inp.className = 'cyber-input'; inp.placeholder = placeholder;
            wrap.append(inp, generateSubmitButton(() => { if(inp.value.trim().toUpperCase() == ans) this.winInteractive(); else this.failRoom(); }));
            innerStage.appendChild(wrap);
        };

        switch(p.uiType) {
            case 'WIRES': {
                let wWrap = document.createElement('div'); wWrap.style.cssText = 'width:100%; display:flex; flex-direction:column; align-items:center;';
                p.data.forEach((c, i) => {
                    let w = document.createElement('div'); w.className = 'wire-lux'; w.style.backgroundColor = c;
                    w.onclick = () => {
                        w.classList.add('wire-cut');
                        if(p.ans[this.stageState.clicks] === i) {
                            this.stageState.clicks++;
                            if(this.stageState.clicks === p.ans.length) this.winInteractive();
                        } else { this.failRoom(); this.setupStage(); }
                    };
                    wWrap.appendChild(w);
                });
                innerStage.appendChild(wWrap);
                break;
            }
            case 'SIMON': {
                let smGrid = document.createElement('div'); smGrid.className = 'simon-grid';
                let boxes = [];
                for(let i=0; i<p.data; i++) {
                    let b = document.createElement('div'); b.className = 'simon-box';
                    b.onclick = () => {
                        if(!this.stageState.playing) return;
                        if(this.stageState.sequence[this.stageState.clicks] === i) {
                            b.classList.add('pulse'); setTimeout(()=>b.classList.remove('pulse'), 200);
                            this.stageState.clicks++;
                            if(this.stageState.clicks === this.stageState.sequence.length) {
                                this.stageState.round++;
                                if(this.stageState.round > 3) this.winInteractive(); else setTimeout(()=>playRound(), 1000);
                            }
                        } else { this.failRoom(); this.setupStage(); }
                    };
                    smGrid.appendChild(b); boxes.push(b);
                }
                innerStage.appendChild(smGrid);
                this.stageState.round = 1;
                const playRound = () => {
                    this.stageState.playing = false; this.stageState.clicks = 0;
                    let count = this.stageState.round === 1 ? 4 : (this.stageState.round === 2 ? 6 : 8);
                    this.stageState.sequence = Array.from({length: count}, () => Math.floor(Math.random() * p.data));
                    let step = 0;
                    let iv = setInterval(() => {
                        if(step < count) {
                            boxes[this.stageState.sequence[step]].classList.add('pulse'); this.playSound('click');
                            setTimeout(()=>boxes[this.stageState.sequence[step-1]].classList.remove('pulse'), 400);
                            step++;
                        } else { clearInterval(iv); this.stageState.playing = true; }
                    }, 600);
                };
                setTimeout(()=>playRound(), 500);
                break;
            }
            case 'MASTERMIND': {
                let container = document.createElement('div'); container.className = 'mm-container';
                let inputs = document.createElement('div'); inputs.className = 'mm-inputs';
                let mboxes = [];
                for(let i=0; i<4; i++) { let inp = document.createElement('input'); inp.type='number'; inp.className='mm-input'; inp.maxLength=1; inputs.appendChild(inp); mboxes.push(inp); }
                let btn = document.createElement('button'); btn.className='btn-execute'; btn.innerText='Check Code';
                let history = document.createElement('div'); history.className = 'mm-history';
                btn.onclick = () => {
                    let guess = mboxes.map(b => parseInt(b.value));
                    if(guess.some(isNaN)) return;
                    if(JSON.stringify(guess) === JSON.stringify(p.ans)) { this.winInteractive(); return; }
                    this.stageState.attempts++;
                    if(this.stageState.attempts > 8) { this.failRoom(); this.setupStage(); return; }
                    
                    let row = document.createElement('div'); row.className = 'mm-row';
                    let txt = document.createElement('div'); txt.className='mm-guess-txt'; txt.innerText = guess.join(' ');
                    let tempAns = [...p.ans], tempGuess = [...guess];
                    let pegsContainer = document.createElement('div'); pegsContainer.className = 'mm-pegs';
                    let pegs = [];
                    for(let i=0; i<4; i++) { if(tempGuess[i] === tempAns[i]) { pegs.push('#00ff66'); tempAns[i]=null; tempGuess[i]=-1; } }
                    for(let i=0; i<4; i++) { if(tempGuess[i] !== -1 && tempAns.includes(tempGuess[i])) { pegs.push('#ffa500'); tempAns[tempAns.indexOf(tempGuess[i])]=null; } }
                    while(pegs.length < 4) pegs.push('#ff3333'); 
                    
                    pegs.forEach(c => { let peg = document.createElement('div'); peg.className='mm-peg'; peg.style.background=c; pegsContainer.appendChild(peg); });
                    row.append(txt, pegsContainer); history.prepend(row); mboxes.forEach(b => b.value = '');
                };
                container.append(inputs, btn, history); innerStage.appendChild(container);
                break;
            }
            case 'MATCH': {
                let crdGrid = document.createElement('div'); crdGrid.className = 'card-grid';
                let symbols = [...p.data, ...p.data].sort(() => Math.random() - 0.5);
                let flipped = [];
                symbols.forEach((sym) => {
                    let card = document.createElement('div'); card.className = 'flip-card';
                    card.innerHTML = `<div class="flip-card-inner"><div class="flip-front"></div><div class="flip-back">${sym}</div></div>`;
                    card.onclick = () => {
                        if(card.classList.contains('flipped') || flipped.length >= 2) return;
                        card.classList.add('flipped'); flipped.push({c:card, s:sym});
                        if(flipped.length === 2) {
                            setTimeout(() => {
                                if(flipped[0].s === flipped[1].s) { this.stageState.clicks+=2; if(this.stageState.clicks === 20) this.winInteractive(); }
                                else { flipped[0].c.classList.remove('flipped'); flipped[1].c.classList.remove('flipped'); }
                                flipped = [];
                            }, 600);
                        }
                    };
                    crdGrid.appendChild(card);
                });
                innerStage.appendChild(crdGrid);
                break;
            }
            case 'COMPASS': {
                let astWrap = document.createElement('div'); astWrap.style.cssText = 'position: relative; width: 250px; height: 250px; display:flex; justify-content:center; align-items:center;';
                let cmp = document.createElement('div');
                cmp.style.cssText = 'width: 220px; height: 220px; border-radius: 50%; border: 8px solid var(--gold); background: radial-gradient(circle, #222, #000); box-shadow: 0 0 30px rgba(212,175,55,0.3), inset 0 0 30px #000; position: relative; transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; display:flex; justify-content:center; align-items:center;';
                let ndl = document.createElement('div');
                ndl.style.cssText = 'width: 6px; height: 90px; background: linear-gradient(to top, transparent 50%, var(--red) 50%); position: absolute; top: 20px; border-radius: 3px;';
                cmp.appendChild(ndl);
                astWrap.appendChild(cmp);
                let angle = 0;
                cmp.onclick = () => {
                    angle = (angle + 45) % 360; cmp.style.transform = `rotate(${angle}deg)`;
                    if(angle === p.ans) setTimeout(()=>this.winInteractive(), 500);
                };
                innerStage.appendChild(astWrap);
                break;
            }
            case 'STONE_RUNES': {
                let stnWrap = document.createElement('div'); stnWrap.style.cssText = 'display:flex; gap:15px; flex-wrap:wrap; justify-content:center; max-width:400px;';
                p.data.forEach((r, i) => {
                    let btn = document.createElement('div');
                    btn.style.cssText = 'background: #3d3b38; border: 3px solid #5a5752; color: #d4d0c9; width: 70px; height: 70px; border-radius: 10px; font-size: 1.5rem; cursor: pointer; transition: 0.2s; display:flex; justify-content:center; align-items:center; box-shadow: 0 5px 10px #000;';
                    btn.innerText = r;
                    btn.onclick = () => {
                        btn.style.background = 'var(--gold)'; btn.style.color = '#000';
                        if(p.ans.includes(i)) {
                            this.stageState.clicks++;
                            if(this.stageState.clicks === p.ans.length) setTimeout(()=>this.winInteractive(), 300);
                        } else { this.failRoom(); this.setupStage(); }
                    };
                    stnWrap.appendChild(btn);
                });
                innerStage.appendChild(stnWrap);
                break;
            }
            case 'SCALES': {
                let sclWrap = document.createElement('div');
                sclWrap.style.cssText = 'display:flex; gap:20px; align-items:flex-end; height:150px; border-bottom: 4px solid var(--gold); padding-bottom:10px; width: 100%; max-width: 500px; justify-content:center;';
                p.data.forEach((w) => {
                    let btn = document.createElement('div');
                    btn.style.cssText = 'width: 60px; background: linear-gradient(135deg, #eee, #888); border: 2px solid #555; text-align: center; font-weight: bold; color: #000; cursor: pointer; transition: 0.3s; clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%); display:flex; align-items:flex-end; justify-content:center; padding-bottom:10px; box-shadow: 0 10px 15px #000;';
                    btn.innerText = w;
                    btn.style.height = (w + 40) + 'px';
                    btn.onclick = () => {
                        btn.classList.toggle('active');
                        btn.style.background = btn.classList.contains('active') ? 'linear-gradient(135deg, var(--gold), #8a7322)' : 'linear-gradient(135deg, #eee, #888)';
                        let sum = Array.from(sclWrap.children).reduce((acc, el, idx) => acc + (el.classList.contains('active') ? p.data[idx] : 0), 0);
                        if(sum === p.target) setTimeout(()=>this.winInteractive(), 300);
                    };
                    sclWrap.appendChild(btn);
                });
                innerStage.appendChild(sclWrap);
                break;
            }
            case 'RADAR_ROUNDS': {
                let rdWrap = document.createElement('div'); 
                rdWrap.style.cssText = 'display:grid; gap:2px; background:rgba(0,255,100,0.1); border:2px solid #00ff66; padding:5px; border-radius:50%; width:300px; height:300px; overflow:hidden; position:relative; box-shadow:inset 0 0 20px rgba(0,255,100,0.2);';
                innerStage.appendChild(rdWrap);
                this.stageState.round = 1;
                const startRadarRound = () => {
                    rdWrap.innerHTML = '';
                    let dim = this.stageState.round === 1 ? 5 : (this.stageState.round === 2 ? 7 : 9);
                    let targetIdx = Math.floor(Math.random() * (dim*dim));
                    rdWrap.style.gridTemplateColumns = `repeat(${dim}, 1fr)`;
                    let cells = [];
                    for(let i=0; i<dim*dim; i++) {
                        let c = document.createElement('div'); c.style.border='1px solid rgba(0,255,100,0.2)'; c.style.cursor='pointer';
                        c.onclick = () => {
                            if(i === targetIdx) {
                                clearInterval(this.stageState.timer); this.playSound('click'); this.stageState.round++;
                                if(this.stageState.round > 3) this.winInteractive(); else startRadarRound();
                            } else { clearInterval(this.stageState.timer); this.failRoom(); this.setupStage(); }
                        };
                        rdWrap.appendChild(c); cells.push(c);
                    }
                    let speed = this.stageState.round === 1 ? 1500 : (this.stageState.round === 2 ? 1000 : 500);
                    this.stageState.timer = setInterval(() => {
                        cells[targetIdx].style.background = '#00ff66';
                        setTimeout(() => cells[targetIdx].style.background = 'transparent', speed/2);
                    }, speed);
                };
                startRadarRound();
                break;
            }
            case 'KEYPAD': {
                let kWrap = document.createElement('div'); 
                kWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:10px;';
                let kDisp = document.createElement('div'); 
                kDisp.style.cssText = 'grid-column:span 3; font-family: monospace; font-size: 2.5rem; color: var(--gold); text-align:center; background:#000; border:2px solid #333; padding:10px; border-radius:8px; margin-bottom:10px; letter-spacing:10px;';
                kDisp.innerText='_ _ _'; 
                kWrap.appendChild(kDisp);
                let padNums = [1,2,3,4,5,6,7,8,9];
                padNums.forEach((n) => {
                    let btn = document.createElement('div'); 
                    btn.style.cssText = 'width:80px; height:80px; background:#050505; border:2px solid #222; border-radius:8px; display:flex; justify-content:center; align-items:center; font-size:2rem; color:#555; cursor:pointer; font-family:monospace;';
                    btn.innerText = n;
                    btn.onclick = () => {
                        this.stageState.val = (this.stageState.val || '') + n;
                        kDisp.innerText = this.stageState.val.padEnd(p.ans.length,'_');
                        if(this.stageState.val === p.ans) { setTimeout(()=>this.winInteractive(), 300); }
                        else if(this.stageState.val.length >= p.ans.length) { this.failRoom(); this.setupStage(); }
                    };
                    kWrap.appendChild(btn);
                });
                innerStage.appendChild(kWrap);
                break;
            }
            case 'GEARS': {
                let gWrap = document.createElement('div'); gWrap.style.cssText = 'display:flex; gap:20px;';
                let angles = [90, 180, 270];
                for(let i=0; i<3; i++) {
                    let d = document.createElement('div'); 
                    d.innerText = '⚙️';
                    d.style.cssText = `font-size: 6rem; line-height: 1; color: #555; cursor: pointer; transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); text-shadow: 0 10px 20px #000; user-select: none; transform: rotate(${angles[i]}deg);`;
                    d.onclick = () => {
                        angles[i] = (angles[i] + 45) % 360;
                        d.style.transform = `rotate(${angles[i]}deg)`;
                        if(angles.every(a => a === 0)) setTimeout(()=>this.winInteractive(), 300);
                    };
                    gWrap.appendChild(d);
                }
                innerStage.appendChild(gWrap);
                break;
            }
            case 'MORSE': {
                let mBulb = document.createElement('div'); 
                mBulb.style.cssText = 'width: 100px; height: 100px; border-radius: 50%; background: #111; border: 4px solid #333; margin: 20px auto; box-shadow: inset 0 0 20px #000; transition: 0.1s;';
                innerStage.appendChild(mBulb);
                createInputBlock('DECODE SIGNAL...', p.ans);
                const flash = (duration) => { 
                    mBulb.style.background = '#fff'; mBulb.style.borderColor = '#fff'; mBulb.style.boxShadow = '0 0 50px #fff, inset 0 0 20px #fff';
                    setTimeout(()=> { mBulb.style.background = '#111'; mBulb.style.borderColor = '#333'; mBulb.style.boxShadow = 'inset 0 0 20px #000'; }, duration); 
                }
                let pattern = [200,200,200, 600,600,600, 200,200,200]; 
                let mStep = 0;
                this.stageState.timer = setInterval(() => {
                    flash(pattern[mStep]); mStep++;
                    if(mStep >= pattern.length) mStep=0;
                }, 1000);
                break;
            }
            case 'HEX': {
                let hexWrap = document.createElement('div');
                hexWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 70px); gap:15px;';
                for(let i=0; i<p.data; i++) {
                    let n = document.createElement('div');
                    n.style.cssText = 'width:70px; height:70px; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); background: #111; display:flex; justify-content:center; align-items:center; cursor:pointer; color:#555; font-weight:bold; transition:0.3s;';
                    n.innerText = i;
                    n.onclick = () => {
                        n.classList.toggle('active');
                        n.style.background = n.classList.contains('active') ? 'var(--gold)' : '#111';
                        n.style.color = n.classList.contains('active') ? '#000' : '#555';
                        let actives = Array.from(hexWrap.children).map((x,idx)=>x.classList.contains('active')?idx:-1).filter(x=>x!==-1);
                        if(actives.length === p.ans.length && p.ans.every(a=>actives.includes(a))) setTimeout(()=>this.winInteractive(), 300);
                    };
                    hexWrap.appendChild(n);
                }
                innerStage.appendChild(hexWrap);
                break;
            }
            case 'WEIGHTS': {
                let wgtWrap = document.createElement('div'); wgtWrap.style.cssText = 'display:flex; gap:15px; flex-wrap:wrap; justify-content:center;';
                p.data.forEach((w) => {
                    let box = document.createElement('div'); 
                    box.style.cssText = 'width: 80px; height: 80px; background: #111; border: 2px solid #444; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold; color: #666; cursor: pointer; clip-path: polygon(10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0 90%, 0 10%); transition: 0.3s;';
                    box.innerText = w+'g';
                    box.onclick = () => {
                        box.classList.toggle('active');
                        box.style.background = box.classList.contains('active') ? 'var(--gold)' : '#111';
                        box.style.color = box.classList.contains('active') ? '#000' : '#666';
                        let sum = Array.from(wgtWrap.children).reduce((acc, el, idx) => acc + (el.classList.contains('active') ? p.data[idx] : 0), 0);
                        if(sum === p.target) { setTimeout(()=>this.winInteractive(), 300); }
                    };
                    wgtWrap.appendChild(box);
                });
                innerStage.appendChild(wgtWrap);
                break;
            }
            case 'SLIDERS': {
                let slWrap = document.createElement('div'); slWrap.style.cssText = 'width:100%; display:flex; flex-direction:column; align-items:center; gap:10px; max-width: 500px;';
                let slDisplay = document.createElement('div'); slDisplay.className = 'cyber-display'; slDisplay.innerText = '000'; slWrap.appendChild(slDisplay);
                let sls = [];
                p.data.forEach(d => {
                    let r = document.createElement('div'); r.style.cssText = 'width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 15px; margin-bottom: 15px; background: #0a0a0a; padding: 15px; border-radius: 8px; border: 1px solid #333;';
                    r.innerHTML = `<span style="color: #888; font-weight: bold; font-family: monospace; font-size: 1.1rem; width: 80px; text-align: left;">${d.label}</span>`;
                    let s = document.createElement('input'); s.type = 'range'; s.min = 0; s.max = d.max; s.value = 0; 
                    s.style.cssText = '-webkit-appearance: none; flex-grow: 1; height: 8px; background: #000; border: 1px solid #444; border-radius: 4px; outline: none;';
                    s.oninput = () => { slDisplay.innerText = Math.floor(sls.reduce((a,b)=>a+parseInt(b.value),0)/sls.length).toString().padStart(3,'0'); };
                    r.appendChild(s); slWrap.appendChild(r); sls.push(s);
                });
                slWrap.appendChild(generateSubmitButton(() => {
                    let vals = sls.map(i => parseInt(i.value));
                    let correct = vals.every((v, idx) => Math.abs(v - p.ans[idx]) <= (p.data[idx].max * 0.05));
                    if(correct) this.winInteractive(); else this.failRoom();
                }));
                innerStage.appendChild(slWrap);
                break;
            }
            case 'MAZE': {
                let mzWrap = document.createElement('div'); mzWrap.style.cssText = `display:grid; grid-template-columns:repeat(${Math.sqrt(p.data)}, 50px); gap:2px; background:#111; padding:5px; border:2px solid #444;`;
                for(let i=0; i<p.data; i++) {
                    let c = document.createElement('div'); c.style.cssText = 'height:50px; background:#050505; cursor:pointer;';
                    c.onclick = () => {
                        if(p.ans[this.stageState.clicks] === i) {
                            c.style.background = 'var(--gold)'; this.stageState.clicks++;
                            if(this.stageState.clicks === p.ans.length) setTimeout(()=>this.winInteractive(), 300);
                        } else { this.failRoom(); this.setupStage(); }
                    };
                    mzWrap.appendChild(c);
                }
                innerStage.appendChild(mzWrap);
                break;
            }
            case 'CRYPTEX':
            case 'CAESAR': {
                let papy = document.createElement('div');
                papy.style.cssText = "font-family: 'Rajdhani', monospace; font-size: 3rem; color: #3e3124; background: #e3d2b2; padding: 20px 40px; border: 4px solid #a68962; border-radius: 5px; font-weight:bold; letter-spacing:10px; margin-bottom:30px;";
                papy.innerText = p.desc.split(':')[1] || 'DECODE';
                innerStage.appendChild(papy);
                createInputBlock('أدخل الكلمة المترجمة...', p.ans);
                break;
            }
            case 'SHELLS': {
                let shWrap = document.createElement('div'); shWrap.style.cssText = 'display:flex; gap:30px; margin-bottom:30px; position:relative; width: 300px; height: 120px; justify-content:center; align-items:center;';
                innerStage.appendChild(shWrap);
                this.stageState.round = 1;
                
                const playShells = () => {
                    shWrap.innerHTML = '';
                    let ballCount = this.stageState.round === 1 ? 3 : (this.stageState.round === 2 ? 4 : 5);
                    let balls = [];
                    let targetIdx = Math.floor(Math.random() * ballCount);
                    
                    for(let i=0; i<ballCount; i++) {
                        let b = document.createElement('div'); 
                        b.style.cssText = `position: absolute; width: 60px; height: 60px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, #ffd700, #b8860b, #554000); box-shadow: 0 10px 20px rgba(0,0,0,0.8), inset -5px -5px 15px rgba(0,0,0,0.5); cursor: pointer; transition: left 0.4s ease-in-out; display:flex; justify-content:center; align-items:center; font-size:1.5rem; color:#000; font-weight:bold; left: ${(i * 70)}px;`;
                        if(i === targetIdx) b.innerText = '⭐';
                        b.onclick = () => {
                            if(this.stageState.playing) return;
                            if(i === targetIdx) {
                                b.innerText = '⭐'; this.playSound('success'); this.stageState.round++;
                                if(this.stageState.round > 3) setTimeout(()=>this.winInteractive(), 500);
                                else setTimeout(()=>playShells(), 1000);
                            } else { b.innerText = '❌'; this.failRoom(); setTimeout(()=>this.setupStage(), 500); }
                        };
                        shWrap.appendChild(b); balls.push(b);
                    }
                    
                    this.stageState.playing = true;
                    setTimeout(() => {
                        balls.forEach(b => b.innerText = '');
                        let shuffles = 0;
                        let maxShuffles = this.stageState.round * 5 + 5;
                        let speed = 400 - (this.stageState.round * 50);
                        
                        this.stageState.timer = setInterval(() => {
                            let i1 = Math.floor(Math.random() * ballCount);
                            let i2 = Math.floor(Math.random() * ballCount);
                            let tempLeft = balls[i1].style.left;
                            balls[i1].style.left = balls[i2].style.left;
                            balls[i2].style.left = tempLeft;
                            shuffles++;
                            if(shuffles > maxShuffles) { clearInterval(this.stageState.timer); this.stageState.playing = false; }
                        }, speed);
                    }, 2000);
                };
                playShells();
                break;
            }
            case 'BARCODE': {
                let bcWrap = document.createElement('div'); 
                bcWrap.style.cssText = 'display: flex; gap: 4px; height: 120px; align-items: center; background: #fff; padding: 10px; border-radius: 4px; margin-bottom:20px;';
                let pattern = [1,0,1,0,0,1,0,1,0,1];
                this.stageState.arr = [1,0,0,0,0,0,0,0,0,1]; 
                for(let i=0; i<10; i++) {
                    let bar = document.createElement('div'); 
                    bar.style.cssText = 'width: 15px; height: 100%; background: #000; cursor: pointer; transition: 0.2s;';
                    if(this.stageState.arr[i] === 0) { bar.style.background = '#ddd'; bar.classList.add('missing'); }
                    bar.onclick = () => {
                        bar.classList.toggle('missing');
                        bar.style.background = bar.classList.contains('missing') ? '#ddd' : '#000';
                        this.stageState.arr[i] = bar.classList.contains('missing') ? 0 : 1;
                    };
                    bcWrap.appendChild(bar);
                }
                innerStage.appendChild(bcWrap);
                innerStage.appendChild(generateSubmitButton(() => {
                    if(JSON.stringify(this.stageState.arr) === JSON.stringify(pattern)) this.winInteractive(); else this.failRoom();
                }));
                break;
            }
            case 'RADIO': {
                let rdWrap = document.createElement('div'); rdWrap.style.cssText='width:100%; display:flex; flex-direction:column; alignItems:center;';
                let rWave = document.createElement('div'); rWave.style.cssText='width: 100%; max-width:400px; height: 80px; background: #000; border: 2px solid var(--gold); margin-bottom: 20px; border-radius: 4px; overflow: hidden; position: relative;';
                let rLine = document.createElement('div'); rLine.style.cssText='position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: repeating-linear-gradient(90deg, transparent, transparent 10px, var(--gold) 10px, var(--gold) 12px); opacity: 0.3; transition: 0.3s;';
                rWave.appendChild(rLine);
                let rKnob = document.createElement('div'); rKnob.style.cssText='width: 120px; height: 120px; border-radius: 50%; background: conic-gradient(#333, #111, #333, #111, #333); border: 4px solid #555; box-shadow: 0 10px 20px #000; cursor: pointer; display:flex; justify-content:center; align-items:flex-start; transition: transform 0.1s;';
                let rTick = document.createElement('div'); rTick.style.cssText='width: 6px; height: 20px; background: var(--gold); margin-top: 5px; border-radius: 3px;'; rKnob.appendChild(rTick);
                let rDisp = document.createElement('div'); rDisp.className = 'cyber-display'; rDisp.innerText = '000.0'; rDisp.style.marginTop='20px';
                
                let angle = 0;
                rKnob.onclick = () => {
                    angle += 15; rKnob.style.transform = `rotate(${angle}deg)`;
                    let freq = (angle % 360); rDisp.innerText = freq + '.0';
                    let diff = Math.abs(freq - p.ans);
                    rLine.style.background = `repeating-linear-gradient(90deg, transparent, transparent ${diff/2}px, var(--gold) ${diff/2}px, var(--gold) ${diff/2 + 2}px)`;
                    if(freq === p.ans) { rLine.style.background = 'var(--gold)'; setTimeout(()=>this.winInteractive(), 500); }
                };
                rdWrap.append(rWave, rKnob, rDisp); innerStage.appendChild(rdWrap);
                break;
            }
            case 'LIGHTS_OUT': {
                let loWrap = document.createElement('div'); loWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:5px;';
                let cells = [];
                for(let i=0; i<p.data; i++) {
                    let c = document.createElement('div'); c.className = 'simon-box pulse'; 
                    c.onclick = () => {
                        c.classList.toggle('pulse');
                        let r = Math.floor(i/3), cl = i%3;
                        if(r > 0) cells[i-3].classList.toggle('pulse'); if(r < 2) cells[i+3].classList.toggle('pulse');
                        if(cl > 0) cells[i-1].classList.toggle('pulse'); if(cl < 2) cells[i+1].classList.toggle('pulse');
                        if(cells.every(cell => !cell.classList.contains('pulse'))) setTimeout(() => this.winInteractive(), 300);
                    };
                    cells.push(c); loWrap.appendChild(c);
                }
                innerStage.appendChild(loWrap);
                break;
            }
            case 'ANOMALY': {
                let anWrap = document.createElement('div'); anWrap.style.cssText = 'display:grid; grid-template-columns:repeat(6, 60px); gap:10px;';
                for(let i=0; i<p.data; i++) {
                    let b = document.createElement('div'); b.style.cssText='width:60px; height:60px; font-size:2rem; background: #3d3b38; border: 3px solid #5a5752; color: #d4d0c9; border-radius: 10px; cursor: pointer; display:flex; justify-content:center; align-items:center;';
                    b.innerText = (i === p.ans) ? '𖤌' : '𖤍';
                    b.onclick = () => { if(i === p.ans) this.winInteractive(); else this.failRoom(); };
                    anWrap.appendChild(b);
                }
                innerStage.appendChild(anWrap);
                break;
            }
            case 'DNA': {
                let dnaWrap = document.createElement('div'); dnaWrap.style.cssText = 'display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 300px; margin-bottom:20px;';
                let bases = ['A','C','G','T'];
                this.stageState.arr = ['A','A','A','A'];
                ['T','G','A','C'].forEach((target, i) => {
                    let row = document.createElement('div'); row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; position: relative;';
                    let line = document.createElement('div'); line.style.cssText='position:absolute; top:50%; left:20%; right:20%; height:2px; background:#444; z-index:-1;';
                    let left = document.createElement('div'); left.style.cssText = 'width: 50px; height: 50px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1.5rem; border: 2px solid #222; background: #111; color: #888;';
                    left.innerText = (target==='T'?'A':(target==='G'?'C':(target==='A'?'T':'G')));
                    let right = document.createElement('div'); right.style.cssText = 'width: 50px; height: 50px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1.5rem; border: 2px solid var(--gold); background: #000; color: var(--gold); cursor: pointer; box-shadow: inset 0 0 10px var(--gold);';
                    right.innerText = 'A';
                    right.onclick = () => {
                        let idx = bases.indexOf(right.innerText);
                        idx = (idx + 1) % 4; right.innerText = bases[idx];
                        this.stageState.arr[i] = bases[idx];
                    };
                    row.append(line, left, right); dnaWrap.appendChild(row);
                });
                innerStage.appendChild(dnaWrap);
                innerStage.appendChild(generateSubmitButton(() => {
                    if(JSON.stringify(this.stageState.arr) === JSON.stringify(p.ans.split(''))) this.winInteractive(); else this.failRoom();
                }));
                break;
            }
            case 'PIPES': {
                let pipeWrap = document.createElement('div'); pipeWrap.style.cssText = 'display: grid; grid-template-columns: repeat(3, 80px); gap: 5px; background:#111; padding:10px; border:2px solid #333;';
                let pipeChars = ['┗','━','┛','┃','╋','┃','┏','━','┓'];
                this.stageState.arr = [0,90,0, 90,0,90, 0,90,0];
                for(let i=0; i<9; i++) {
                    let cell = document.createElement('div'); 
                    cell.style.cssText = 'width: 80px; height: 80px; background: #050505; border: 1px solid #222; display: flex; justify-content: center; align-items: center; font-size: 3rem; color: var(--gold); cursor: pointer; transition: transform 0.2s; user-select: none;';
                    cell.innerText = pipeChars[i];
                    cell.style.transform = `rotate(${this.stageState.arr[i]}deg)`;
                    cell.onclick = () => {
                        this.stageState.arr[i] = (this.stageState.arr[i] + 90) % 360;
                        cell.style.transform = `rotate(${this.stageState.arr[i]}deg)`;
                        if(this.stageState.arr.every(a => a === 0)) setTimeout(()=>this.winInteractive(), 500);
                    };
                    pipeWrap.appendChild(cell);
                }
                innerStage.appendChild(pipeWrap);
                break;
            }
            case 'SLIDING': {
                let pzWrap = document.createElement('div'); pzWrap.style.cssText = 'display: grid; grid-template-columns: repeat(3, 80px); gap: 2px; background: #222; padding: 5px; border: 4px solid var(--gold);';
                let tiles = [1,2,3,4,5,6,7,0,8]; 
                const renderPuzzle = () => {
                    pzWrap.innerHTML = '';
                    tiles.forEach((t, i) => {
                        let cell = document.createElement('div'); 
                        cell.style.cssText = 'width: 80px; height: 80px; background: #111; border: 1px solid #000; display:flex; justify-content:center; align-items:center; font-size:2rem; font-weight:bold; color:var(--gold); cursor:pointer; transition:0.2s;';
                        if(t === 0) { cell.style.background='transparent'; cell.style.border='none'; cell.style.cursor='default'; } 
                        else { cell.innerText = t; }
                        cell.onclick = () => {
                            let emptyIdx = tiles.indexOf(0);
                            let validMoves = [emptyIdx-1, emptyIdx+1, emptyIdx-3, emptyIdx+3];
                            if(emptyIdx%3 === 0 && i === emptyIdx-1) return;
                            if(emptyIdx%3 === 2 && i === emptyIdx+1) return;
                            
                            if(validMoves.includes(i)) {
                                tiles[emptyIdx] = t; tiles[i] = 0; renderPuzzle();
                                if(tiles.join('') === p.ans) setTimeout(()=>this.winInteractive(), 300);
                            }
                        };
                        pzWrap.appendChild(cell);
                    });
                };
                renderPuzzle(); innerStage.appendChild(pzWrap);
                break;
            }
            case 'MAGIC_SQUARE': {
                let msWrap = document.createElement('div'); msWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:5px; margin-bottom:20px;';
                let msGrid = [8,1,6, 3,0,7, 4,9,2];
                for(let i=0; i<9; i++) {
                    let cell = document.createElement('div'); cell.className = 'box-lux'; 
                    cell.innerText = msGrid[i];
                    if(i===4) {
                        cell.style.color='var(--gold)'; cell.style.borderColor='var(--gold)';
                        cell.onclick = () => {
                            msGrid[i] = msGrid[i] >= 9 ? 1 : msGrid[i]+1; cell.innerText = msGrid[i];
                        };
                    }
                    msWrap.appendChild(cell);
                }
                innerStage.appendChild(msWrap);
                innerStage.appendChild(generateSubmitButton(() => {
                    if(msGrid[4] == p.ans) this.winInteractive(); else this.failRoom();
                }));
                break;
            }
            case 'HEATMAP': {
                let htWrap = document.createElement('div'); htWrap.style.cssText = 'display: grid; grid-template-columns: repeat(3, 80px); gap: 10px; background: #111; padding: 20px; border-radius: 8px; margin-bottom:20px;';
                let hmColors = {8:'#ff0000', 4:'#ff8800', 9:'#ffcc00', 1:'#ffff66'}; 
                [1,2,3,4,5,6,7,8,9].forEach(n => {
                    let b = document.createElement('button'); b.style.cssText='width: 80px; height: 80px; border: none; border-radius: 6px; font-size: 2rem; font-weight: bold; color: #fff; text-shadow: 0 0 5px #000; cursor: pointer;';
                    b.innerText = n;
                    b.style.background = hmColors[n] ? hmColors[n] : '#333';
                    if(hmColors[n]) b.style.boxShadow = `inset 0 0 30px ${hmColors[n]}`;
                    htWrap.appendChild(b);
                });
                innerStage.appendChild(htWrap);
                createInputBlock('ENTER SEQUENCE...', p.ans.join(''));
                break;
            }
            case 'MATRIX': {
                let mxWrap = document.createElement('div'); mxWrap.style.cssText = 'width: 100%; max-width: 500px; height: 250px; background: #000; border: 2px solid #00ff66; overflow: hidden; position: relative; box-shadow: inset 0 0 20px #00ff66; margin-bottom:20px;';
                innerStage.appendChild(mxWrap);
                this.stageState.timer = setInterval(() => {
                    let word = document.createElement('div'); word.style.cssText = 'position: absolute; color: #00ff66; font-family: monospace; font-size: 1.5rem; cursor: pointer; user-select: none; font-weight: bold;';
                    let isTarget = Math.random() > 0.8;
                    word.innerText = isTarget ? p.ans : (Math.random().toString(36).substring(2, 7).toUpperCase());
                    word.style.left = Math.random() * 80 + '%'; word.style.top = '-20px';
                    if(isTarget) word.style.color = '#fff';
                    word.onclick = () => { if(isTarget) this.winInteractive(); else this.failRoom(); };
                    mxWrap.appendChild(word);
                    let pos = -20;
                    let fall = setInterval(() => {
                        pos += 5; word.style.top = pos + 'px';
                        if(pos > 250) { clearInterval(fall); word.remove(); }
                    }, 50);
                }, 800);
                break;
            }
            case 'ELEVATOR': {
                let elWrap = document.createElement('div'); elWrap.style.cssText = 'display: grid; grid-template-columns: repeat(2, 70px); gap: 15px; background: #ddd; padding: 20px; border-radius: 10px; border: 4px solid #aaa;';
                [1,2,3,4,5,6].forEach(n => {
                    let b = document.createElement('div'); b.style.cssText = 'width: 70px; height: 70px; border-radius: 50%; background: radial-gradient(circle, #eee, #ccc); border: 2px solid #999; box-shadow: 0 5px 5px rgba(0,0,0,0.5), inset 0 0 5px #fff; display: flex; justify-content: center; align-items: center; font-size: 1.8rem; font-weight: bold; color: #333; cursor: pointer;';
                    b.innerText = n;
                    b.onclick = () => {
                        b.style.boxShadow='inset 0 5px 10px rgba(0,0,0,0.5)'; b.style.color='var(--gold)'; b.style.borderColor='var(--gold)';
                        setTimeout(()=> { b.style.boxShadow='0 5px 5px rgba(0,0,0,0.5), inset 0 0 5px #fff'; b.style.color='#333'; b.style.borderColor='#999'; }, 300);
                        if(p.ans[this.stageState.clicks] === n) {
                            this.stageState.clicks++;
                            if(this.stageState.clicks === p.ans.length) setTimeout(()=>this.winInteractive(), 300);
                        } else { this.failRoom(); this.setupStage(); }
                    };
                    elWrap.appendChild(b);
                });
                innerStage.appendChild(elWrap);
                break;
            }
            case 'MATH_HACK':
            case 'PAPYRUS': {
                let txtDisp = document.createElement('div'); txtDisp.className='cyber-display'; txtDisp.innerText = p.desc.split(':')[0];
                innerStage.appendChild(txtDisp);
                createInputBlock('ENTER DECODE SEQUENCE...', p.ans);
                break;
            }
            case 'BOSS': {
                let bWrap = document.createElement('div'); bWrap.style.display='flex'; bWrap.style.gap='20px'; bWrap.style.marginBottom='30px';
                for(let i=0; i<3; i++) { 
                    let sw = document.createElement('div'); sw.style.cssText='width: 90px; height: 140px; background: #111; border: 3px solid #222; border-radius: 8px; position: relative; cursor: pointer; box-shadow: 0 10px 20px rgba(0,0,0,0.9); transition: 0.3s; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; padding-bottom: 15px; color: #555; font-weight: bold; font-size: 1.2rem;';
                    sw.innerHTML = `<div style="position: absolute; top: 15px; width: 70px; height: 55px; background: #050505; border-radius: 4px; box-shadow: inset 0 5px 10px #000; transition: 0.3s;"></div>OFF`;
                    sw.onclick = () => {
                        sw.classList.toggle('active'); 
                        if(sw.classList.contains('active')){
                            sw.style.borderColor='var(--gold)'; sw.style.color='var(--gold)'; sw.style.textShadow='0 0 10px var(--gold)';
                            sw.innerHTML = `<div style="position: absolute; top: 65px; width: 70px; height: 55px; background: var(--gold); border-radius: 4px; box-shadow: 0 0 20px var(--gold); transition: 0.3s;"></div>ON`;
                        } else {
                            sw.style.borderColor='#222'; sw.style.color='#555'; sw.style.textShadow='none';
                            sw.innerHTML = `<div style="position: absolute; top: 15px; width: 70px; height: 55px; background: #050505; border-radius: 4px; box-shadow: inset 0 5px 10px #000; transition: 0.3s;"></div>OFF`;
                        }
                    };
                    bWrap.appendChild(sw); 
                }
                let bInp = document.createElement('input'); bInp.type='text'; bInp.className='cyber-input'; bInp.placeholder='MASTER PASSWORD';
                let bBtn = document.createElement('button'); bBtn.className='btn-execute'; bBtn.innerText='🔥 INITIATE MASTER HACK 🔥'; bBtn.style.background='#ff0000'; bBtn.style.color='#fff'; bBtn.style.borderColor='#fff';
                bBtn.onclick = () => {
                    let allSwitchesOn = Array.from(bWrap.children).every(s=>s.classList.contains('active'));
                    if(allSwitchesOn && bInp.value.trim().toUpperCase() === p.ans) this.winInteractive(); else this.failRoom();
                };
                innerStage.append(bWrap, bInp, bBtn);
                break;
            }
        }
    }

    winInteractive() {
        if(this.stageState.timer) clearInterval(this.stageState.timer);
        this.playSound('success'); 
        document.getElementById('interactive-stage-container').classList.add('hidden');
        document.getElementById('puzzle-desc').innerText = this.activeGate.txtQ;
        document.getElementById('text-stage').classList.remove('hidden');
        document.getElementById('input-area').classList.remove('hidden');
        document.getElementById('user-input').focus();
    }

    checkResult() {
        this.playSound('click');
        let answerInput = document.getElementById('user-input').value.trim();
        if (answerInput === this.activeGate.txtA) {
            this.playSound('success'); 
            this.solvedGates.add(this.activeGate.id);
            this.addCoins(15);
            this.showToast('تم اختراق الروم بنجاح! +15 بيانات');
            this.returnToLobby();
        } else {
            this.failRoom();
        }
    }
    
    failRoom() { this.playSound('error'); this.triggerVisualGlitch(); }

    toggleAdminSidebar(open) { this.playSound('click'); const sidebar = document.getElementById('admin-sidebar'); open ? sidebar.classList.add('open') : sidebar.classList.remove('open'); }
    
    adminInstantSolveGate() {
        this.playSound('click');
        if(!this.activeGate) return;
        this.toggleAdminSidebar(false);
        this.solvedGates.add(this.activeGate.id);
        this.addCoins(15);
        this.showToast('تم تخطي الروم إجبارياً!');
        this.returnToLobby();
    }

    returnToLobby() { 
        if(this.stageState.timer) clearInterval(this.stageState.timer);
        this.playSound('click'); this.switchScreen('lobby'); this.renderLobby(); 
    }
}
const game = new SolarGamesEngine();
