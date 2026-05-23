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
            if(e.target.tagName==='BUTTON' || e.target.classList.contains('box-lux') || e.target.classList.contains('stone-btn') || e.target.classList.contains('neon-node') || e.target.classList.contains('scale-weight') || e.target.classList.contains('flip-card') || e.target.closest('.channel-card')){ 
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
            else if(i===2) { m.uiType = 'SIMON'; m.desc="تتبع الأنماط: 3 جولات متتالية."; m.data=16; m.hint="💡 تفاعلي: ركز ووجهني بالترتيب الصحيح فوراً. | 📝 كتابي: يذوب في الحرارة."; }
            else if(i===3) { m.uiType = 'MASTERMIND'; m.desc="خزنة الألوان: أدخل 4 أرقام (أخضر=صح، برتقالي=مكان غلط)."; m.ans=[3,7,1,9]; m.hint="💡 تفاعلي: الكود هو 3719. | 📝 كتابي: لا يمكنك البوح به."; }
            else if(i===4) { m.uiType = 'MATCH'; m.desc="تطابق الأشكال: 20 شريحة، طابق 10 أزواج."; m.data=['🪐','☄️','🌑','🔭','🛸','🛰️','🌌','🌠','🚀','👨‍🚀']; m.hint="💡 تفاعلي: احفظ الأماكن ووجهني. | 📝 كتابي: يزيد ولا ينقص."; }
            else if(i===5) { m.uiType = 'COMPASS'; m.desc="البوصلة الفلكية: وجه الإبرة للزاوية الدقيقة 135."; m.ans=135; m.hint="💡 تفاعلي: أسفل اليمين (135 درجة). | 📝 كتابي: يرتد لك من الجدار."; }
            else if(i===6) { m.uiType = 'HARD_6'; m.desc="مصفوفة الطاقة المتقدمة: قم بتدوير الخطوط الذهبية لتكوين اتصال زاوي دقيق."; m.hint="💡 تفاعلي: ركز على الزوايا الداخلية. | 📝 كتابي: يمتص السوائل."; }
            else if(i===7) { m.uiType = 'SCALES'; m.desc="الميزان الروماني: اختر أوزان مجموعها 150."; m.data=[50,70,30,80,20]; m.target=150; m.hint="💡 تفاعلي: 70 + 80. | 📝 كتابي: يأتي غداً."; }
            else if(i===8) { m.uiType = 'RADAR_ROUNDS'; m.desc="الرادار المعتم (3 راوندات): تصاعدي (5x5, 7x7, 9x9)."; m.hint="💡 تفاعلي: ركز في المنتصف دايماً. | 📝 كتابي: تقطعه لتفي به."; }
            else if(i===9) { m.uiType = 'PAPYRUS'; m.desc="لفافة البردي: اقرأ النص السري."; m.ans='AMUN'; m.hint="💡 تفاعلي: الكلمة AMUN. | 📝 كتابي: لغته السكوت."; }
            else if(i===10) { m.uiType = 'ASTRO_CLOCK'; m.desc="الساعة الفلكية: قم بتسوية الحلقات الثلاث (شمس، قمر، نجم) للأعلى."; m.ans=[0,0,0]; m.hint="💡 تفاعلي: دورها كلها لفوق (الساعة 12). | 📝 كتابي: قشرتها هشة."; }
            else if(i===11) { m.uiType = 'NEON_NODES'; m.desc="الشبكة السيبرانية: اربط الأطراف العلوية فقط."; m.data=12; m.ans=[0,1,2,3]; m.hint="💡 تفاعلي: الصف الأول كامل. | 📝 كتابي: تنشفك وتتبلل."; }
            else if(i===12) { m.uiType = 'JUGS'; m.desc="دوارق الخيمياء: احصل على 4 لتر من (8, 5, 3)."; m.hint="💡 تفاعلي: املأ الـ 5، صب في 3، يبقى 2.. | 📝 كتابي: ترسم العالم."; }
            else if(i===13) { m.uiType = 'HARD_13'; m.desc="نظام التشفير اللوني: استنتج التسلسل الدقيق للوحدات المظلمة."; m.ans=[1,3,0,2]; m.hint="💡 تفاعلي: الذهبي أولاً. | 📝 كتابي: تعرف بها الوقت."; }
            else if(i===14) { m.uiType = 'SLIDING_PUZZLE'; m.desc="الجدارية المكسورة: رتب القطع (1-8)."; m.hint="💡 تفاعلي: رتبها تصاعدياً 1 لـ 8. | 📝 كتابي: يمطر."; }
            else if(i===15) { m.uiType = 'BLIND_MAZE'; m.desc="متاهة المينوتور: 6x6 معتمة. خطوة غلط ترجعك للصفر."; m.data=36; m.ans=[0,6,12,13,14,20,26,32,33,34,35]; m.hint="💡 تفاعلي: تحت 3 مرات، يمين مرتين... | 📝 كتابي: صيفي ولذيذ."; }
            else if(i===16) { m.uiType = 'CAESAR'; m.desc="تشفير دافنشي: أزح كلمة ABC بمقدار +3."; m.ans='DEF'; m.hint="💡 تفاعلي: الكلمة DEF. | 📝 كتابي: يثبت الأشياء."; }
            else if(i===17) { m.uiType = 'HARD_17'; m.desc="ميزان الكتلة المعتم: فعل الأعمدة الحجرية حتى تصل الكتلة لـ 100%."; m.data=[25,10,45,30,20]; m.target=100; m.hint="💡 تفاعلي: العمودان الأولان والأخير. | 📝 كتابي: أداة الكتابة."; }
            else if(i===18) { m.uiType = 'BARCODE'; m.desc="الباركود الممزق: 2, 4, 8, ؟"; m.ans='16'; m.hint="💡 تفاعلي: 16. | 📝 كتابي: يتبعك بالشمس."; }
            else if(i===19) { m.uiType = 'HARD_19'; m.desc="عجلة الإزاحة القوطية: قم بمحاذاة الحلقة الداخلية لفك التشفير."; m.ans='GOLD'; m.hint="💡 تفاعلي: الكلمة الناتجة GOLD. | 📝 كتابي: تدل على الشمال."; }
            else if(i===20) { m.uiType = 'LIGHTS_OUT'; m.desc="معبد الشعلات: أطفئ جميع النيران (3x3)."; m.data=9; m.hint="💡 تفاعلي: الأطراف ثم المنتصف. | 📝 كتابي: لا تُرى."; }
            else if(i===21) { m.uiType = 'HARD_21'; m.desc="الفسيفساء المتحركة: رتب القطع الذهبية في البيئة المعتمة."; m.ans='123456780'; m.hint="💡 تفاعلي: رتب الصف الأول ولن تمسه مجدداً. | 📝 كتابي: تخاف من الماء."; }
            else if(i===22) { m.uiType = 'DNA'; m.desc="فك شفرة الحمض: A=T, C=G."; m.ans='TGCA'; m.hint="💡 تفاعلي: TGCA. | 📝 كتابي: تكبر كلما أخذت منها."; }
            else if(i===23) { m.uiType = 'PIPES'; m.desc="الأنابيب القديمة: صل البداية بالنهاية."; m.hint="💡 تفاعلي: دور الأنابيب لتكون خط مستقيم. | 📝 كتابي: يقرصك ببطنك."; }
            else if(i===24) { m.uiType = 'KEYPAD'; m.desc="خزنة الكيبورد: أدخل 4321."; m.ans='4321'; m.hint="💡 تفاعلي: 4321. | 📝 كتابي: ينادونك به."; }
            else if(i===25) { m.uiType = 'HARD_25'; m.desc="نبضات التوهج الصامتة: فك تشفير الومضات واكتب الكلمة."; m.ans='SUN'; m.hint="💡 تفاعلي: الكلمة SUN. | 📝 كتابي: تتركها وراءك."; }
            else if(i===26) { m.uiType = 'HEATMAP'; m.desc="البصمة الحرارية: من الأسخن للأبرد."; m.ans='8491'; m.hint="💡 تفاعلي: 8491. | 📝 كتابي: قطرات من السماء."; }
            else if(i===27) { m.uiType = 'HARD_27'; m.desc="المصفوفة الدوارة: احفظ النمط. ستدور اللوحة 90 درجة."; m.hint="💡 تفاعلي: المواقع تصبح بالزاوية العلوية اليمنى. | 📝 كتابي: افتح يا..."; }
            else if(i===28) { m.uiType = 'ELEVATOR'; m.desc="المصعد: انزل للدور السفلي (B3)."; m.ans='B3'; m.hint="💡 تفاعلي: B3. | 📝 كتابي: مدينة تاريخية."; }
            else if(i===29) { m.uiType = 'HARD_29'; m.desc="المنفذ الرقمي: حول القيمة 0x1A إلى النظام العشري."; m.ans='26'; m.hint="💡 تفاعلي: 26. | 📝 كتابي: تذوب لتضيء."; }
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

    setupStage() {
        const p = this.activeGate;
        document.getElementById('int-desc').innerText = p.desc;
        const stage = document.getElementById('interactive-stage');
        
        stage.innerHTML = `<div class="lux-panel" id="lux-inner-stage"></div>`;
        const innerStage = document.getElementById('lux-inner-stage');
        this.stageState = { clicks: 0, arr: [], val: 0, attempts: 0, playing: true };

        const generateSubmitButton = (callback) => {
            let btn = document.createElement('button'); btn.className = 'btn-execute'; btn.innerText = 'تأكيد الاختراق'; 
            btn.onclick = callback; return btn;
        };

        const createInputBlock = (placeholder, ans) => {
            let wrap = document.createElement('div'); wrap.style.cssText = 'width:100%; display:flex; flex-direction:column; align-items:center;';
            let inp = document.createElement('input'); inp.type = 'text'; inp.className = 'cyber-input'; inp.placeholder = placeholder;
            wrap.append(inp, generateSubmitButton(() => { if(inp.value.trim().toUpperCase() == ans) this.winInteractive(); else this.failRoom(); }));
            innerStage.appendChild(wrap);
        };

        switch(p.uiType) {
            case 'WIRES':
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

            case 'SIMON':
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

            case 'MASTERMIND':
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
                    row.append(txt, pegsContainer);
                    history.prepend(row); mboxes.forEach(b => b.value = '');
                };
                container.append(inputs, btn, history); innerStage.appendChild(container);
                break;

            case 'MATCH':
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

            case 'COMPASS':
                let cmp = document.createElement('div'); cmp.className = 'compass-dial';
                let ndl = document.createElement('div'); ndl.className = 'compass-needle';
                let cnt = document.createElement('div'); cnt.className = 'compass-center';
                cmp.append(ndl, cnt);
                let angle = 0;
                cmp.onclick = () => {
                    angle = (angle + 45) % 360; cmp.style.transform = `rotate(${angle}deg)`;
                    if(angle === p.ans) setTimeout(()=>this.winInteractive(), 500);
                };
                innerStage.appendChild(cmp);
                break;

            case 'HARD_6':
                let grid6 = document.createElement('div');
                grid6.style.cssText = 'display:grid; grid-template-columns:repeat(4, 70px); gap:5px; background:#000; padding:10px; border:2px solid #D4AF37;';
                let nodes6 = [];
                for(let i=0; i<16; i++) {
                    let node = document.createElement('div');
                    let isLine = Math.random() > 0.5;
                    node.style.cssText = `width:70px; height:70px; background:#111; display:flex; justify-content:center; align-items:center; cursor:pointer; font-size:2rem; color:#D4AF37; border:1px solid #333; transition:transform 0.3s;`;
                    node.innerText = isLine ? '━' : '┏';
                    let rot = [0, 90, 180, 270][Math.floor(Math.random()*4)];
                    node.style.transform = `rotate(${rot}deg)`;
                    node.dataset.rot = rot;
                    node.dataset.type = isLine ? 'line' : 'corner';
                    node.onclick = () => {
                        this.playSound('click');
                        let r = (parseInt(node.dataset.rot) + 90) % 360;
                        node.dataset.rot = r;
                        node.style.transform = `rotate(${r}deg)`;
                        let win = nodes6.every(n => {
                            if(n.dataset.type === 'line') return [0, 180].includes(parseInt(n.dataset.rot));
                            return [0, 90, 180, 270].includes(parseInt(n.dataset.rot)); 
                        });
                        if(win) setTimeout(() => this.winInteractive(), 400);
                    };
                    nodes6.push(node); grid6.appendChild(node);
                }
                innerStage.appendChild(grid6);
                break;

            case 'SCALES':
                let sclWrap = document.createElement('div'); sclWrap.className = 'roman-scale';
                p.data.forEach((w) => {
                    let btn = document.createElement('div'); btn.className = 'scale-weight'; btn.innerText = w;
                    btn.style.height = (w + 40) + 'px';
                    btn.onclick = () => {
                        btn.classList.toggle('active');
                        let sum = Array.from(sclWrap.children).reduce((acc, el, idx) => acc + (el.classList.contains('active') ? p.data[idx] : 0), 0);
                        if(sum === p.target) setTimeout(()=>this.winInteractive(), 300);
                    };
                    sclWrap.appendChild(btn);
                });
                innerStage.appendChild(sclWrap);
                break;

            case 'RADAR_ROUNDS':
                let rdWrap = document.createElement('div'); rdWrap.style.cssText = 'display:grid; gap:2px; background:rgba(0,255,100,0.1); border:2px solid #00ff66; padding:5px; border-radius:50%; width:300px; height:300px; overflow:hidden; position:relative;';
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
                                clearInterval(this.stageState.timer);
                                this.playSound('click');
                                this.stageState.round++;
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

            case 'ASTRO_CLOCK':
                let astWrap = document.createElement('div'); astWrap.className = 'astro-container';
                let r1 = document.createElement('div'); r1.className = 'astro-ring astro-ring-1'; r1.innerHTML = '<div class="astro-icon">☀️</div>';
                let r2 = document.createElement('div'); r2.className = 'astro-ring astro-ring-2'; r2.innerHTML = '<div class="astro-icon">🌙</div>';
                let r3 = document.createElement('div'); r3.className = 'astro-ring astro-ring-3'; r3.innerHTML = '<div class="astro-icon">⭐</div>';
                astWrap.append(r1, r2, r3); innerStage.appendChild(astWrap);
                let angles = [90, 180, 270];
                [r1, r2, r3].forEach((r, i) => {
                    r.style.transform = `rotate(${angles[i]}deg)`;
                    r.onclick = () => {
                        angles[i] = (angles[i] + 45) % 360;
                        r.style.transform = `rotate(${angles[i]}deg)`;
                        if(angles.every(a => a === 0)) setTimeout(()=>this.winInteractive(), 300);
                    };
                });
                break;

            case 'PAPYRUS':
                let papy = document.createElement('div'); papy.className = 'papyrus-panel'; papy.innerText = '𓂀 𓁹 𓋹 𓍹 𓎬 𓏤';
                innerStage.appendChild(papy);
                createInputBlock('Translate Hieroglyphs...', p.ans);
                break;

            case 'NEON_NODES':
                let neonWrap = document.createElement('div'); neonWrap.className = 'neon-board';
                for(let i=0; i<p.data; i++) {
                    let n = document.createElement('div'); n.className = 'neon-node'; n.innerText = i;
                    n.onclick = () => {
                        n.classList.toggle('active');
                        let actives = Array.from(neonWrap.children).map((x,idx)=>x.classList.contains('active')?idx:-1).filter(x=>x!==-1);
                        if(actives.length === p.ans.length && p.ans.every(a=>actives.includes(a))) setTimeout(()=>this.winInteractive(), 300);
                    };
                    neonWrap.appendChild(n);
                }
                innerStage.appendChild(neonWrap);
                break;

            case 'JUGS':
                let jugWrap = document.createElement('div'); jugWrap.style.cssText = 'display:flex; gap:20px; align-items:flex-end; height:150px;';
                let caps = [8, 5, 3];
                let vols = [8, 0, 0];
                let selected = -1;
                const renderJugs = () => {
                    jugWrap.innerHTML = '';
                    caps.forEach((cap, i) => {
                        let j = document.createElement('div'); j.className = 'wood-barrel'; j.style.height = (cap * 20 + 40) + 'px';
                        if(i === selected) j.style.borderColor = 'var(--gold)';
                        let w = document.createElement('div'); w.className = 'water-fill'; w.style.height = (vols[i] / cap * 100) + '%';
                        j.appendChild(w);
                        let lbl = document.createElement('div'); lbl.style.cssText = 'position:absolute; width:100%; text-align:center; color:#fff; font-weight:bold; top:10px;'; lbl.innerText = `${vols[i]}/${cap}`;
                        j.appendChild(lbl);
                        j.onclick = () => {
                            if(selected === -1) { if(vols[i] > 0) selected = i; renderJugs(); }
                            else {
                                if(selected !== i) {
                                    let transfer = Math.min(vols[selected], caps[i] - vols[i]);
                                    vols[selected] -= transfer; vols[i] += transfer;
                                }
                                selected = -1; renderJugs();
                                if(vols.includes(4)) setTimeout(()=>this.winInteractive(), 300);
                            }
                        };
                        jugWrap.appendChild(j);
                    });
                };
                renderJugs(); innerStage.appendChild(jugWrap);
                break;

            case 'HARD_13':
                let wrap13 = document.createElement('div'); wrap13.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:20px;';
                let inputs13 = document.createElement('div'); inputs13.style.cssText = 'display:flex; gap:15px;';
                let cols13 = ['#D4AF37', '#8a7322', '#555555', '#222222'];
                let mboxes13 = [];
                for(let i=0; i<4; i++) {
                    let poly = document.createElement('div');
                    poly.style.cssText = 'width:60px; height:70px; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); background:#111; cursor:pointer; transition:0.3s; border: 2px solid #D4AF37;';
                    poly.dataset.val = -1;
                    poly.onclick = () => {
                        this.playSound('click');
                        let v = (parseInt(poly.dataset.val) + 1) % cols13.length;
                        poly.dataset.val = v; poly.style.background = cols13[v];
                    };
                    inputs13.appendChild(poly); mboxes13.push(poly);
                }
                let hist13 = document.createElement('div'); hist13.style.cssText = 'display:flex; flex-direction:column; gap:10px; width:100%; max-width:300px; height:120px; overflow-y:auto; background:#000; padding:10px; border:1px solid #333;';
                let btn13 = generateSubmitButton(() => {
                    let guess = mboxes13.map(b => parseInt(b.dataset.val));
                    if(guess.includes(-1)) return;
                    this.stageState.attempts++;
                    if(this.stageState.attempts > 6) { this.failRoom(); this.setupStage(); return; }
                    let exact = 0;
                    for(let i=0; i<4; i++) { if(guess[i] === p.ans[i]) exact++; }
                    let row = document.createElement('div'); row.style.cssText = 'display:flex; justify-content:space-between; color:#D4AF37; border-bottom:1px solid #333;';
                    row.innerHTML = `<span>محاولة ${this.stageState.attempts}</span><span>تطابق دقيق: ${exact}</span>`;
                    hist13.prepend(row);
                    if(exact === 4) this.winInteractive(); else this.playSound('error');
                });
                wrap13.append(inputs13, btn13, hist13); innerStage.appendChild(wrap13);
                break;

            case 'SLIDING_PUZZLE':
                let pzWrap = document.createElement('div'); pzWrap.className = 'sliding-puzzle';
                let tiles = [1,2,3,4,5,6,7,0,8]; 
                const renderPuzzle = () => {
                    pzWrap.innerHTML = '';
                    tiles.forEach((t, i) => {
                        let cell = document.createElement('div'); cell.className = 'slide-tile';
                        if(t === 0) cell.classList.add('empty'); else cell.innerText = t;
                        cell.onclick = () => {
                            let emptyIdx = tiles.indexOf(0);
                            let validMoves = [emptyIdx-1, emptyIdx+1, emptyIdx-3, emptyIdx+3];
                            if(validMoves.includes(i)) {
                                tiles[emptyIdx] = t; tiles[i] = 0; renderPuzzle();
                                if(tiles.join('') === '123456780') setTimeout(()=>this.winInteractive(), 300);
                            }
                        };
                        pzWrap.appendChild(cell);
                    });
                };
                renderPuzzle(); innerStage.appendChild(pzWrap);
                break;

            case 'BLIND_MAZE':
                let bmWrap = document.createElement('div'); bmWrap.style.cssText = 'display:grid; grid-template-columns:repeat(6, 50px); gap:2px; background:#111; padding:5px; border:2px solid #444;';
                for(let i=0; i<p.data; i++) {
                    let c = document.createElement('div'); c.style.cssText = 'height:50px; background:#050505; cursor:pointer;';
                    c.onclick = () => {
                        if(p.ans[this.stageState.clicks] === i) {
                            c.style.background = 'var(--gold)'; this.stageState.clicks++;
                            if(this.stageState.clicks === p.ans.length) setTimeout(()=>this.winInteractive(), 300);
                        } else { this.failRoom(); this.setupStage(); }
                    };
                    bmWrap.appendChild(c);
                }
                innerStage.appendChild(bmWrap);
                break;

            case 'CAESAR':
                let txtDisp16 = document.createElement('div'); txtDisp16.className='cyber-display'; txtDisp16.innerText = p.desc.split(':')[0];
                innerStage.appendChild(txtDisp16);
                createInputBlock('ENTER DECODE SEQUENCE...', p.ans);
                break;

            case 'HARD_17':
                let meterWrap = document.createElement('div'); meterWrap.style.cssText = 'display:flex; align-items:flex-end; gap:15px; height:200px; padding-bottom:10px; border-bottom:2px solid #D4AF37;';
                let bars17 = [];
                p.data.forEach((val) => {
                    let col = document.createElement('div');
                    col.style.cssText = `width:40px; height:${val*2}px; background:#111; border:1px solid #333; cursor:pointer; position:relative; overflow:hidden; transition:0.3s;`;
                    let glow = document.createElement('div'); glow.style.cssText = 'position:absolute; bottom:0; width:100%; height:0%; background:#D4AF37; transition:0.4s; opacity:0;';
                    col.appendChild(glow);
                    col.dataset.val = val; col.dataset.active = "false";
                    col.onclick = () => {
                        this.playSound('click');
                        let isActive = col.dataset.active === "true";
                        col.dataset.active = !isActive;
                        glow.style.height = !isActive ? '100%' : '0%'; glow.style.opacity = !isActive ? '1' : '0';
                        let sum = bars17.reduce((acc, b) => acc + (b.dataset.active === "true" ? parseInt(b.dataset.val) : 0), 0);
                        if(sum === p.target) setTimeout(()=>this.winInteractive(), 500);
                    };
                    bars17.push(col); meterWrap.appendChild(col);
                });
                innerStage.appendChild(meterWrap);
                break;

            case 'BARCODE':
                let txtDisp18 = document.createElement('div'); txtDisp18.className='cyber-display'; txtDisp18.innerText = p.desc.split(':')[0];
                innerStage.appendChild(txtDisp18);
                createInputBlock('ENTER DECODE SEQUENCE...', p.ans);
                break;

            case 'HARD_19':
                let wheelCont = document.createElement('div'); wheelCont.style.cssText = 'position:relative; width:250px; height:250px; display:flex; justify-content:center; align-items:center; border-radius:50%; background:#000; border:4px solid #333;';
                let innerRing = document.createElement('div'); innerRing.style.cssText = 'position:absolute; width:70%; height:70%; border-radius:50%; background:#111; border:2px solid #D4AF37; display:flex; justify-content:center; align-items:center; cursor:pointer; transition:transform 0.5s; box-shadow:0 0 15px rgba(212,175,55,0.2);';
                let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                let rIn = 70;
                for(let i=0; i<26; i+=2) { 
                    let angle = (i * 360 / 26) * (Math.PI/180);
                    let iChar = document.createElement('div'); iChar.innerText=chars[i];
                    iChar.style.cssText=`position:absolute; left:${rIn*Math.cos(angle)+75}px; top:${rIn*Math.sin(angle)+75}px; transform:rotate(${i*360/26}deg); color:#D4AF37; font-family:monospace; font-weight:bold; font-size:14px;`;
                    innerRing.appendChild(iChar);
                }
                let rot19 = 0;
                innerRing.onclick = () => { this.playSound('click'); rot19 += 45; innerRing.style.transform = `rotate(${rot19}deg)`; };
                wheelCont.appendChild(innerRing); innerStage.appendChild(wheelCont);
                createInputBlock('DECODE "IQNF"...', p.ans);
                break;

            case 'LIGHTS_OUT':
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

            case 'HARD_21':
                let board21 = document.createElement('div'); board21.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:4px; background:#111; padding:8px; border:1px solid #D4AF37;';
                let state21 = [1,2,3,4,6,8,7,5,0];
                const drawBoard21 = () => {
                    board21.innerHTML = '';
                    state21.forEach((num, index) => {
                        let tile = document.createElement('div');
                        if(num === 0) { tile.style.cssText = 'width:80px; height:80px; border:1px dashed #333;'; }
                        else {
                            tile.style.cssText = 'width:80px; height:80px; background:#000; border:1px solid #D4AF37; display:flex; justify-content:center; align-items:center; font-size:2rem; font-weight:bold; color:#D4AF37; cursor:pointer;';
                            tile.innerText = num;
                            tile.onclick = () => {
                                let zIdx = state21.indexOf(0);
                                let valid = [zIdx-1, zIdx+1, zIdx-3, zIdx+3];
                                if(zIdx%3 === 0 && index === zIdx-1) return;
                                if(zIdx%3 === 2 && index === zIdx+1) return;
                                if(valid.includes(index)) {
                                    this.playSound('click');
                                    state21[zIdx] = num; state21[index] = 0; drawBoard21();
                                    if(state21.join('') === p.ans) setTimeout(()=>this.winInteractive(), 300);
                                }
                            };
                        }
                        board21.appendChild(tile);
                    });
                };
                drawBoard21(); innerStage.appendChild(board21);
                break;

            case 'DNA':
            case 'PIPES':
            case 'KEYPAD':
                let txtDispDNA = document.createElement('div'); txtDispDNA.className='cyber-display'; txtDispDNA.innerText = p.desc.split(':')[0];
                innerStage.appendChild(txtDispDNA);
                createInputBlock('ENTER DECODE SEQUENCE...', p.ans || '');
                break;

            case 'HARD_25':
                let lensCont = document.createElement('div'); lensCont.style.cssText = 'width:120px; height:120px; border-radius:50%; background:#000; border:4px solid #333; margin-bottom:20px; display:flex; justify-content:center; align-items:center;';
                let lensCore = document.createElement('div'); lensCore.style.cssText = 'width:40px; height:40px; border-radius:50%; background:#050505; transition:all 0.1s;';
                lensCont.appendChild(lensCore); innerStage.appendChild(lensCont);
                createInputBlock('TRANSLATE SIGNAL...', p.ans);
                let seq25 = [200,200,200, 800, 200,200,600, 800, 600,200];
                let step25 = 0;
                this.stageState.timer = setInterval(() => {
                    lensCore.style.background = '#D4AF37'; lensCore.style.boxShadow = '0 0 30px #D4AF37';
                    setTimeout(()=> { lensCore.style.background = '#050505'; lensCore.style.boxShadow = 'none'; }, seq25[step25]);
                    step25++; if(step25 >= seq25.length) step25 = 0;
                }, 1200);
                break;

            case 'HEATMAP':
                let hmWrap = document.createElement('div'); hmWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:10px; background:#111; padding:20px; border-radius:10px;';
                let hmColors = {8:'#ff0000', 4:'#ff8800', 9:'#ffcc00', 1:'#ffff66'}; 
                [1,2,3,4,5,6,7,8,9].forEach(n => {
                    let b = document.createElement('div'); b.className = 'box-lux'; b.innerText = n;
                    if(hmColors[n]) b.style.boxShadow = `inset 0 0 30px ${hmColors[n]}`;
                    hmWrap.appendChild(b);
                });
                innerStage.appendChild(hmWrap);
                createInputBlock('أدخل الرمز...', p.ans);
                break;

            case 'HARD_27':
                let rotContainer = document.createElement('div'); rotContainer.style.cssText = 'width:250px; height:250px; transition:transform 0.8s; margin-bottom:20px;';
                let grid27 = document.createElement('div'); grid27.style.cssText = 'display:grid; grid-template-columns:repeat(4, 1fr); width:100%; height:100%; gap:5px; padding:5px; background:#000; border:2px solid #D4AF37;';
                let cells27 = [];
                for(let i=0; i<16; i++) {
                    let cell = document.createElement('div'); cell.style.cssText = 'background:#111; border:1px solid #333; cursor:pointer;';
                    cell.onclick = () => {
                        if(this.stageState.playing) return;
                        this.playSound('click'); cell.style.background = '#D4AF37';
                        this.stageState.arr.push(i);
                        if(this.stageState.arr.length === 4) {
                            let correct = [12, 9, 6, 3];
                            if(JSON.stringify([...this.stageState.arr].sort()) === JSON.stringify([...correct].sort())) this.winInteractive();
                            else { this.failRoom(); setTimeout(()=>this.setupStage(), 800); }
                        }
                    };
                    cells27.push(cell); grid27.appendChild(cell);
                }
                rotContainer.appendChild(grid27); innerStage.appendChild(rotContainer);
                setTimeout(() => {
                    [0, 5, 10, 15].forEach(i => cells27[i].style.background = '#fff');
                    this.playSound('success');
                    setTimeout(() => {
                        cells27.forEach(c => c.style.background = '#111');
                        rotContainer.style.transform = 'rotate(90deg)'; this.stageState.playing = false;
                    }, 1500);
                }, 800);
                break;

            case 'ELEVATOR':
                let txtDisp28 = document.createElement('div'); txtDisp28.className='cyber-display'; txtDisp28.innerText = p.desc.split(':')[0];
                innerStage.appendChild(txtDisp28);
                createInputBlock('ENTER DECODE SEQUENCE...', p.ans);
                break;

            case 'HARD_29':
                let termDisp = document.createElement('div'); termDisp.style.cssText = 'font-size:3rem; color:#D4AF37; font-family:monospace; margin-bottom:20px; border:2px solid #333; padding:20px 40px; background:#000; letter-spacing:4px; text-shadow:0 0 10px #D4AF37;';
                termDisp.innerText = '0x1A';
                innerStage.appendChild(termDisp);
                createInputBlock('DECIMAL FORMAT...', p.ans);
                break;

            case 'BOSS':
                let bWrap = document.createElement('div'); bWrap.style.display='flex'; bWrap.style.gap='20px'; bWrap.style.marginBottom='30px';
                for(let i=0; i<3; i++) { let sw = document.createElement('div'); sw.className='switch-lux'; sw.innerText='OFF'; sw.onclick=()=> { sw.classList.toggle('active'); sw.innerText = sw.classList.contains('active')?'ON':'OFF'; }; bWrap.appendChild(sw); }
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
