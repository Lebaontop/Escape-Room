class SolarGamesEngine {
    constructor() {
        this.coins = 0; 
        this.globalTime = 90 * 60; // 1:30:00 (الوقت العام)
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
            if(e.target.tagName==='BUTTON' || e.target.classList.contains('simon-box') || e.target.classList.contains('flip-card') || e.target.classList.contains('stone-btn') || e.target.closest('.channel-card') || e.target.classList.contains('wire-lux') || e.target.classList.contains('astro-ring') || e.target.classList.contains('cryp-btn') || e.target.classList.contains('bc-bar') || e.target.classList.contains('dna-clickable') || e.target.classList.contains('pipe-cell') || e.target.classList.contains('slide-tile') || e.target.classList.contains('heat-btn') || e.target.classList.contains('elevator-btn') || e.target.classList.contains('matrix-word') || e.target.classList.contains('cyber-valve') || e.target.classList.contains('cyber-weight')){ 
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
            
            // ============== الأبواب الصعبة الجديدة ==============
            else if(i===6) { m.uiType = 'HARD_6'; m.desc="شبكة الدوائر الكهربائية (مستوى متقدم): قم بتوصيل جميع المسارات ببعضها لتكوين دائرة مغلقة تماماً دون أي أطراف مفتوحة."; m.hint="💡 تفاعلي: اجعل الزوايا تتقابل لتشكل مربعاً مغلقاً. | 📝 كتابي: يمتص السوائل."; }
            else if(i===13) { m.uiType = 'HARD_13'; m.desc="كاسر الشفرات (Mastermind متقدم): استنتج ترتيب 4 ألوان مختلفة تماماً في 8 محاولات."; m.ans=[2,0,1,3]; m.hint="💡 تفاعلي: اللون الأول أحمر، والأخير ذهبي. | 📝 كتابي: تعرف بها الوقت."; }
            else if(i===17) { m.uiType = 'HARD_17'; m.desc="الميزان المعتم: قم بتفعيل أعمدة الطاقة المخفية لتصل الكتلة الإجمالية لـ 100%."; m.data=[25, 45, 10, 30, 20]; m.target=100; m.hint="💡 تفاعلي: فعل العمود الأول، الثالث، والرابع. | 📝 كتابي: أداة الكتابة."; }
            else if(i===19) { m.uiType = 'HARD_19'; m.desc="قرص التشفير المزدوج: أدر الحلقة الداخلية مرتين لفك تشفير كلمة السر."; m.ans='GOLD'; m.hint="💡 تفاعلي: الكلمة الناتجة هي GOLD. | 📝 كتابي: تدل على الشمال."; }
            else if(i===21) { m.uiType = 'HARD_21'; m.desc="الفسيفساء المتشابكة: رتب المربعات بشكل تصاعدي من 1 إلى 8، ويكون الفراغ في النهاية."; m.ans='123456780'; m.hint="💡 تفاعلي: رتب الصف العلوي أولاً (1, 2, 3). | 📝 كتابي: تخاف من الماء."; }
            else if(i===25) { m.uiType = 'HARD_25'; m.desc="نبضات التوهج: فك تشفير ومضات الإشارة (طويل وقصير) لترجمتها."; m.ans='SUN'; m.hint="💡 تفاعلي: الكلمة المترجمة هي SUN. | 📝 كتابي: تتركها وراءك."; }
            else if(i===27) { m.uiType = 'HARD_27'; m.desc="المصفوفة الدوارة: احفظ النمط המضيء. الشبكة ستدور 90 درجة قبل السماح لك بالإدخال."; m.hint="💡 تفاعلي: الأماكن ستتحرك للزاوية العلوية اليمنى. | 📝 كتابي: افتح يا..."; }
            else if(i===29) { m.uiType = 'HARD_29'; m.desc="المنفذ الرقمي: حول القيمة السداسية عشرية 0x1A إلى النظام العشري."; m.ans='26'; m.hint="💡 تفاعلي: الرقم هو 26. | 📝 كتابي: تذوب لتضيء."; }
            // ====================================================

            else if(i===7) { m.uiType = 'SCALES'; m.desc="الميزان الروماني: اختر أوزان مجموعها 150."; m.data=[50,70,30,80,20]; m.target=150; m.hint="💡 تفاعلي: 70 + 80. | 📝 كتابي: يأتي غداً."; }
            else if(i===8) { m.uiType = 'RADAR_ROUNDS'; m.desc="الرادار المعتم (3 راوندات): تصاعدي (5x5, 7x7, 9x9)."; m.hint="💡 تفاعلي: ركز في المنتصف دايماً. | 📝 كتابي: تقطعه لتفي به."; }
            else if(i===9) { m.uiType = 'PAPYRUS'; m.desc="لفافة البردي: اقرأ النص السري."; m.ans='AMUN'; m.hint="💡 تفاعلي: الكلمة AMUN. | 📝 كتابي: لغته السكوت."; }
            else if(i===10) { m.uiType = 'ASTRO_CLOCK'; m.desc="الساعة الفلكية: قم بتسوية الحلقات الثلاث (شمس، قمر، نجم) للأعلى."; m.ans=[0,0,0]; m.hint="💡 تفاعلي: دورها كلها لفوق (الساعة 12). | 📝 كتابي: قشرتها هشة."; }
            else if(i===11) { m.uiType = 'NEON_NODES'; m.desc="الشبكة السيبرانية: اربط الأطراف العلوية فقط."; m.data=12; m.ans=[0,1,2,3]; m.hint="💡 تفاعلي: الصف الأول كامل. | 📝 كتابي: تنشفك وتتبلل."; }
            else if(i===12) { m.uiType = 'JUGS'; m.desc="دوارق الخيمياء: احصل على 4 لتر من (8, 5, 3)."; m.hint="💡 تفاعلي: املأ الـ 5، صب في 3، يبقى 2.. | 📝 كتابي: ترسم العالم."; }
            else if(i===14) { m.uiType = 'SLIDING_PUZZLE'; m.desc="الجدارية المكسورة: رتب القطع (1-8)."; m.hint="💡 تفاعلي: رتبها تصاعدياً 1 لـ 8. | 📝 كتابي: يمطر."; }
            else if(i===15) { m.uiType = 'BLIND_MAZE'; m.desc="متاهة المينوتور: 6x6 معتمة. خطوة غلط ترجعك للصفر."; m.data=36; m.ans=[0,6,12,13,14,20,26,32,33,34,35]; m.hint="💡 تفاعلي: تحت 3 مرات، يمين مرتين... | 📝 كتابي: صيفي ولذيذ."; }
            else if(i===16) { m.uiType = 'CAESAR'; m.desc="تشفير دافنشي: أزح كلمة ABC بمقدار +3."; m.ans='DEF'; m.hint="💡 تفاعلي: الكلمة DEF. | 📝 كتابي: يثبت الأشياء."; }
            else if(i===18) { m.uiType = 'BARCODE'; m.desc="الباركود الممزق: 2, 4, 8, ؟"; m.ans='16'; m.hint="💡 تفاعلي: 16. | 📝 كتابي: يتبعك بالشمس."; }
            else if(i===20) { m.uiType = 'LIGHTS_OUT'; m.desc="معبد الشعلات: أطفئ جميع النيران (3x3)."; m.data=9; m.hint="💡 تفاعلي: الأطراف ثم المنتصف. | 📝 كتابي: لا تُرى."; }
            else if(i===22) { m.uiType = 'DNA'; m.desc="فك شفرة الحمض: A=T, C=G."; m.ans='TGCA'; m.hint="💡 تفاعلي: TGCA. | 📝 كتابي: تكبر كلما أخذت منها."; }
            else if(i===23) { m.uiType = 'PIPES'; m.desc="الأنابيب القديمة: صل البداية بالنهاية."; m.hint="💡 تفاعلي: دور الأنابيب لتكون خط مستقيم. | 📝 كتابي: يقرصك ببطنك."; }
            else if(i===24) { m.uiType = 'KEYPAD'; m.desc="خزنة الكيبورد: أدخل 4321."; m.ans='4321'; m.hint="💡 تفاعلي: 4321. | 📝 كتابي: ينادونك به."; }
            else if(i===26) { m.uiType = 'HEATMAP'; m.desc="البصمة الحرارية: من الأسخن للأبرد."; m.ans='8491'; m.hint="💡 تفاعلي: 8491. | 📝 كتابي: قطرات من السماء."; }
            else if(i===28) { m.uiType = 'ELEVATOR'; m.desc="المصعد: انزل للدور السفلي (B3)."; m.ans='B3'; m.hint="💡 تفاعلي: B3. | 📝 كتابي: مدينة تاريخية."; }
            else if(i===30) { m.uiType = 'BOSS'; m.desc="العرش الذهبي: فعل الـ 3 مفاتيح واكتب GOLDEN."; m.ans='GOLDEN'; m.hint="💡 تفاعلي: GOLDEN | 📝 كتابي: معدن أصفر نفيس."; }

            m.txtQ = riddles[i-1].q;
            m.txtA = riddles[i-1].a;
            mechanics.push(m);
        }
        return mechanics;
    }

    toggleGlobalTimer() { 
        this.playSound('click'); this.isTimerRunning = !this.isTimerRunning; 
        this.showToast(this.isTimerRunning ? "تم تشغيل العداد العام" : "تم إيقاف العداد العام");
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
        document.getElementById('puzzle-global-timer').innerText = `${h}:${m}:${s}`;
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
        
        stage.innerHTML = `<div class="lux-panel" id="lux-inner-stage" style="width:100%; min-height:400px; background:#050505; border:2px solid #D4AF37; border-radius:8px; padding:20px; box-shadow:inset 0 0 20px #000; position:relative; overflow:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center;"></div>`;
        const innerStage = document.getElementById('lux-inner-stage');
        this.stageState = { clicks: 0, arr: [], val: 0, attempts: 0, playing: true, timer: null };

        const generateSubmitButton = (callback) => {
            let btn = document.createElement('button'); btn.className = 'btn-execute'; btn.innerText = 'تأكيد (Execute)'; 
            btn.style.cssText = 'background: linear-gradient(180deg, #222, #000); color: var(--gold); border: 2px solid var(--gold); padding: 15px 30px; font-size: 1.2rem; font-weight: bold; border-radius: 6px; cursor: pointer; transition: 0.3s; margin-top:20px; width: 100%; max-width: 400px;';
            btn.onclick = callback; return btn;
        };

        const createInputBlock = (placeholder, ans) => {
            let wrap = document.createElement('div'); wrap.style.cssText = 'width:100%; display:flex; flex-direction:column; align-items:center;';
            let inp = document.createElement('input'); inp.type = 'text'; inp.className = 'cyber-input'; inp.placeholder = placeholder;
            inp.style.cssText = 'background: #000; border: 2px solid var(--gold); color: var(--gold); padding: 15px; font-size: 1.8rem; text-align: center; width: 100%; max-width: 400px; outline: none; box-shadow: inset 0 0 20px rgba(212,175,55,0.2); letter-spacing: 5px; font-family: monospace; border-radius: 8px; text-transform: uppercase;';
            wrap.append(inp, generateSubmitButton(() => { if(inp.value.trim().toUpperCase() == ans) this.winInteractive(); else this.failRoom(); }));
            innerStage.appendChild(wrap);
        };

        switch(p.uiType) {

            // ================== الأبواب الـ 8 الصعبة الجديدة ==================
            case 'HARD_6': {
                let grid = document.createElement('div');
                grid.style.cssText = 'display:grid; grid-template-columns:repeat(4, 70px); gap:6px; background:#000; padding:15px; border:2px solid #D4AF37; border-radius:8px; box-shadow:0 0 20px rgba(212,175,55,0.2);';
                let nodes = [];
                for(let i=0; i<16; i++) {
                    let node = document.createElement('div'); let isLine = Math.random() > 0.5;
                    node.style.cssText = `width:70px; height:70px; background:#111; display:flex; justify-content:center; align-items:center; cursor:pointer; font-size:2.5rem; color:#D4AF37; border:1px solid #333; transition:transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); user-select:none;`;
                    node.innerText = isLine ? '━' : '┏';
                    let rot = [0, 90, 180, 270][Math.floor(Math.random()*4)];
                    node.style.transform = `rotate(${rot}deg)`; node.dataset.rot = rot; node.dataset.type = isLine ? 'line' : 'corner';
                    node.onclick = () => {
                        this.playSound('click'); let r = (parseInt(node.dataset.rot) + 90) % 360;
                        node.dataset.rot = r; node.style.transform = `rotate(${r}deg)`;
                        let win = nodes.every(n => { if(n.dataset.type === 'line') return [0, 180].includes(parseInt(n.dataset.rot)); return [0, 90, 180, 270].includes(parseInt(n.dataset.rot)); });
                        if(win) setTimeout(() => this.winInteractive(), 400);
                    };
                    nodes.push(node); grid.appendChild(node);
                }
                innerStage.appendChild(grid);
                break;
            }

            case 'HARD_13': {
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:20px; width:100%;';
                let inputsGrid = document.createElement('div'); inputsGrid.style.cssText = 'display:flex; gap:15px;';
                let colors = ['#D4AF37', '#ff3333', '#00ccff', '#555555']; let mboxes = [];
                for(let i=0; i<4; i++) {
                    let poly = document.createElement('div');
                    poly.style.cssText = 'width:60px; height:70px; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); background:#111; cursor:pointer; transition:0.3s; border: 2px solid #555; display:flex; justify-content:center; align-items:center;';
                    poly.dataset.val = -1;
                    poly.onclick = () => {
                        this.playSound('click'); let v = (parseInt(poly.dataset.val) + 1) % colors.length;
                        poly.dataset.val = v; poly.style.background = colors[v]; poly.style.boxShadow = `0 0 15px ${colors[v]}`;
                    };
                    inputsGrid.appendChild(poly); mboxes.push(poly);
                }
                let history = document.createElement('div'); history.style.cssText = 'display:flex; flex-direction:column; gap:10px; width:100%; max-width:350px; max-height:160px; overflow-y:auto; padding:10px; background:rgba(0,0,0,0.5); border-radius:8px; border:1px solid #222; margin-top:10px;';
                let btn = generateSubmitButton(() => {
                    let guess = mboxes.map(b => parseInt(b.dataset.val)); if(guess.includes(-1)) return;
                    this.stageState.attempts++; if(this.stageState.attempts > 8) { this.failRoom(); this.setupStage(); return; }
                    let row = document.createElement('div'); row.style.cssText = 'display:flex; align-items:center; justify-content:space-between; background:#0a0a0a; padding:10px; border:1px solid #333; border-radius:4px;';
                    let pegWrap = document.createElement('div'); pegWrap.style.cssText = 'display:flex; gap:8px;';
                    guess.forEach(g => { let p=document.createElement('div'); p.style.cssText=`width:15px;height:15px;border-radius:2px;background:${colors[g]};`; pegWrap.appendChild(p); });
                    let resultWrap = document.createElement('div'); resultWrap.style.cssText = 'display:flex; gap:5px;'; let exact = 0;
                    for(let i=0; i<4; i++) {
                        let resDot = document.createElement('div'); resDot.style.cssText = 'width:12px; height:12px; border-radius:50%; border:1px solid #555;';
                        if(guess[i] === p.ans[i]) { resDot.style.background = '#00ff66'; exact++; }
                        else if(p.ans.includes(guess[i])) { resDot.style.background = '#D4AF37'; } else { resDot.style.background = '#ff3333'; }
                        resultWrap.appendChild(resDot);
                    }
                    row.append(pegWrap, resultWrap); history.prepend(row);
                    if(exact === 4) this.winInteractive(); else this.playSound('error');
                });
                wrap.append(inputsGrid, btn, history); innerStage.appendChild(wrap);
                break;
            }

            case 'HARD_17': {
                let meterWrap = document.createElement('div'); meterWrap.style.cssText = 'display:flex; align-items:flex-end; gap:15px; height:200px; padding-bottom:10px; border-bottom:4px solid #D4AF37; margin-bottom:30px;';
                let bars = [];
                p.data.forEach((val) => {
                    let col = document.createElement('div');
                    col.style.cssText = `width: 50px; height: ${val * 3}px; background: #111; border: 2px solid #333; position: relative; cursor: pointer; transition: 0.3s; box-shadow: inset 0 -10px 20px rgba(0,0,0,0.8); border-radius: 4px 4px 0 0; overflow: hidden;`;
                    let glow = document.createElement('div'); glow.style.cssText = 'position: absolute; bottom: 0; width: 100%; height: 0%; background: linear-gradient(0deg, #D4AF37, transparent); transition: 0.4s ease-out; opacity: 0;'; col.appendChild(glow);
                    col.dataset.val = val; col.dataset.active = "false";
                    col.onclick = () => {
                        this.playSound('click'); let isActive = col.dataset.active === "true"; col.dataset.active = !isActive;
                        glow.style.height = !isActive ? '100%' : '0%'; glow.style.opacity = !isActive ? '1' : '0'; col.style.borderColor = !isActive ? '#D4AF37' : '#333';
                        let sum = bars.reduce((acc, b) => acc + (b.dataset.active === "true" ? parseInt(b.dataset.val) : 0), 0);
                        if(sum === p.target) setTimeout(()=>this.winInteractive(), 500);
                    };
                    bars.push(col); meterWrap.appendChild(col);
                });
                innerStage.appendChild(meterWrap);
                let lbl = document.createElement('div'); lbl.style.cssText = 'color: #888; font-family: monospace; letter-spacing: 2px;'; lbl.innerText = 'ENERGY DISTRIBUTION MATRIX'; innerStage.appendChild(lbl);
                break;
            }

            case 'HARD_19': {
                let wheelCont = document.createElement('div'); wheelCont.style.cssText = 'position:relative; width:280px; height:280px; display:flex; justify-content:center; align-items:center; margin-bottom:30px; border-radius:50%; background: radial-gradient(circle, #111, #000); box-shadow: 0 0 40px rgba(0,0,0,0.9);';
                let outerRing = document.createElement('div'); outerRing.style.cssText = 'position:absolute; width:100%; height:100%; border-radius:50%; border:2px dashed #555; display:flex; justify-content:center; align-items:center;';
                let innerRing = document.createElement('div'); innerRing.style.cssText = 'position:absolute; width:70%; height:70%; border-radius:50%; background:#0a0a0a; border:4px solid #D4AF37; display:flex; justify-content:center; align-items:center; cursor:pointer; transition:transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 20px rgba(212,175,55,0.15);';
                let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; let rOut = 120, rIn = 80;
                for(let i=0; i<26; i++) {
                    let angle = (i * 360 / 26) * (Math.PI/180);
                    let oChar = document.createElement('div'); oChar.innerText=chars[i]; oChar.style.cssText=`position:absolute; left:${rOut*Math.cos(angle)+130}px; top:${rOut*Math.sin(angle)+130}px; color:#666; font-family:monospace; font-weight:bold; font-size:14px;`;
                    let iChar = document.createElement('div'); iChar.innerText=chars[i]; iChar.style.cssText=`position:absolute; left:${rIn*Math.cos(angle)+90}px; top:${rIn*Math.sin(angle)+90}px; transform:rotate(${i*360/26}deg); color:#D4AF37; font-family:monospace; font-weight:bold; font-size:16px;`;
                    outerRing.appendChild(oChar); innerRing.appendChild(iChar);
                }
                let rotation = 0; innerRing.onclick = () => { this.playSound('click'); rotation += (360/26); innerRing.style.transform = `rotate(${rotation}deg)`; };
                wheelCont.append(outerRing, innerRing); innerStage.appendChild(wheelCont);
                createInputBlock('DECODE "IQNF"...', p.ans);
                break;
            }

            case 'HARD_21': {
                let board = document.createElement('div'); board.style.cssText = 'display:grid; grid-template-columns:repeat(3, 85px); gap:4px; background:#222; padding:8px; border:2px solid #555; border-radius:6px; box-shadow: 0 15px 25px rgba(0,0,0,0.9);';
                let state = [1,2,3,4,6,8,7,5,0]; 
                const drawBoard = () => {
                    board.innerHTML = '';
                    state.forEach((num, index) => {
                        let tile = document.createElement('div'); 
                        if(num === 0) { tile.style.cssText = 'width:85px; height:85px; background:transparent; border:1px dashed #444; border-radius:4px;'; } else {
                            tile.style.cssText = 'width:85px; height:85px; background:linear-gradient(135deg, #D4AF37, #8a7322); display:flex; justify-content:center; align-items:center; font-size:2.5rem; font-weight:bold; color:#000; cursor:pointer; border-radius:4px; box-shadow: inset 0 0 10px rgba(0,0,0,0.3); transition: 0.2s; user-select:none;';
                            tile.innerText = num;
                            tile.onclick = () => {
                                let zeroIdx = state.indexOf(0); let valid = [zeroIdx-1, zeroIdx+1, zeroIdx-3, zeroIdx+3];
                                if(zeroIdx%3 === 0 && index === zeroIdx-1) return; if(zeroIdx%3 === 2 && index === zeroIdx+1) return;
                                if(valid.includes(index)) { this.playSound('click'); state[zeroIdx] = num; state[index] = 0; drawBoard(); if(state.join('') === p.ans) setTimeout(()=>this.winInteractive(), 300); }
                            };
                        } board.appendChild(tile);
                    });
                }; drawBoard(); innerStage.appendChild(board);
                break;
            }

            case 'HARD_25': {
                let lensCont = document.createElement('div'); lensCont.style.cssText = 'width: 150px; height: 150px; border-radius: 50%; background: #000; border: 8px solid #222; margin: 30px auto; display:flex; justify-content:center; align-items:center; box-shadow: 0 10px 30px rgba(0,0,0,0.8);';
                let lensCore = document.createElement('div'); lensCore.style.cssText = 'width: 60px; height: 60px; border-radius: 50%; background: #050505; transition: all 0.1s; box-shadow: inset 0 0 20px #000;';
                lensCont.appendChild(lensCore); innerStage.appendChild(lensCont);
                createInputBlock('TRANSLATE SIGNAL...', p.ans);
                const flash = (dur) => { lensCore.style.background = '#D4AF37'; lensCore.style.boxShadow = '0 0 60px #D4AF37, inset 0 0 10px #fff'; setTimeout(()=> { lensCore.style.background = '#050505'; lensCore.style.boxShadow = 'inset 0 0 20px #000'; }, dur); }
                let seq = [200,200,200, 800, 200,200,600, 800, 600,200]; let step = 0;
                this.stageState.timer = setInterval(() => { flash(seq[step]); step++; if(step >= seq.length) step = 0; }, 1200);
                break;
            }

            case 'HARD_27': {
                let rotContainer = document.createElement('div'); rotContainer.style.cssText = 'width:280px; height:280px; transition:transform 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55); margin-bottom:40px;';
                let grid = document.createElement('div'); grid.style.cssText = 'display:grid; grid-template-columns:repeat(4, 1fr); width:100%; height:100%; gap:6px; padding:8px; background:#111; border:2px solid #D4AF37; border-radius:8px; box-shadow: 0 0 30px rgba(212,175,55,0.1);';
                let cells = [];
                for(let i=0; i<16; i++) {
                    let cell = document.createElement('div'); cell.style.cssText = 'background:#000; border:1px solid #333; border-radius:4px; transition:0.2s; cursor:pointer;';
                    cell.onclick = () => {
                        if(this.stageState.playing) return; this.playSound('click'); cell.style.background = '#D4AF37'; cell.style.boxShadow = '0 0 15px #D4AF37'; this.stageState.arr.push(i);
                        if(this.stageState.arr.length === 4) {
                            let correct = [12, 9, 6, 3]; let sortedInput = [...this.stageState.arr].sort((a,b)=>a-b); let sortedAns = [...correct].sort((a,b)=>a-b);
                            if(JSON.stringify(sortedInput) === JSON.stringify(sortedAns)) { this.winInteractive(); } else { this.failRoom(); setTimeout(()=>this.setupStage(), 1000); }
                        }
                    }; cells.push(cell); grid.appendChild(cell);
                }
                rotContainer.appendChild(grid); innerStage.appendChild(rotContainer);
                setTimeout(() => {
                    [0, 5, 10, 15].forEach(i => { cells[i].style.background = '#fff'; cells[i].style.boxShadow = '0 0 20px #fff'; }); this.playSound('success');
                    setTimeout(() => { cells.forEach(c => { c.style.background = '#000'; c.style.boxShadow = 'none'; }); rotContainer.style.transform = 'rotate(90deg)'; this.stageState.playing = false; }, 2000);
                }, 800);
                break;
            }

            case 'HARD_29': {
                let termDisp = document.createElement('div'); termDisp.style.cssText = 'font-size:3.5rem; color:#D4AF37; font-family:monospace; margin:30px 0; border:2px solid #333; padding:20px 50px; background:#050505; border-radius:4px; box-shadow: inset 0 0 20px #000, 0 10px 20px rgba(0,0,0,0.5); letter-spacing: 5px; position:relative; overflow:hidden;';
                let scanline = document.createElement('div'); scanline.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:2px; background:rgba(212,175,55,0.5); opacity:0.5; pointer-events:none;'; termDisp.appendChild(scanline);
                let valTxt = document.createElement('span'); valTxt.innerText = '0x1A'; termDisp.appendChild(valTxt); innerStage.appendChild(termDisp);
                let pos = 0; this.stageState.timer = setInterval(() => { pos += 2; if(pos > 100) pos = 0; scanline.style.top = pos + '%'; }, 50);
                createInputBlock('DECIMAL VALUE...', p.ans);
                break;
            }

            // ================== الأبواب الأصلية (بدون أي تعديل أو حذف) ==================

            case 'WIRES': {
                let wWrap = document.createElement('div'); wWrap.style.cssText = 'width:100%; display:flex; flex-direction:column; align-items:center;';
                p.data.forEach((c, i) => {
                    let w = document.createElement('div'); w.className = 'wire-lux'; w.style.backgroundColor = c;
                    w.style.cssText += `width:100%; max-width:500px; height:35px; margin:10px 0; border-radius:18px; cursor:pointer; border:2px solid #111; box-shadow:0 8px 15px rgba(0,0,0,0.9), inset 0 3px 8px rgba(255,255,255,0.4); transition:0.3s; position:relative;`;
                    w.innerHTML = `<div style="position:absolute; width:15px; height:15px; background:#555; border-radius:50%; top:8px; left:15px; box-shadow:inset 0 0 5px #000;"></div><div style="position:absolute; width:15px; height:15px; background:#555; border-radius:50%; top:8px; right:15px; box-shadow:inset 0 0 5px #000;"></div>`;
                    w.onclick = () => {
                        w.style.opacity = '0.2'; w.style.pointerEvents = 'none'; w.style.borderStyle = 'dashed';
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
                let smGrid = document.createElement('div'); smGrid.style.cssText = 'display:grid; grid-template-columns:repeat(4, 80px); gap:15px; margin:20px auto; justify-content:center;';
                let boxes = [];
                for(let i=0; i<p.data; i++) {
                    let b = document.createElement('div'); b.style.cssText = 'width:80px; height:80px; background:#050505; border:2px solid #222; border-radius:8px; cursor:pointer; box-shadow:inset 0 0 15px #000, 0 5px 10px rgba(0,0,0,0.8); transition:0.1s;';
                    b.onclick = () => {
                        if(!this.stageState.playing) return;
                        if(this.stageState.sequence[this.stageState.clicks] === i) {
                            b.style.background = 'var(--gold)'; b.style.borderColor = '#fff'; b.style.boxShadow = '0 0 30px var(--gold)'; setTimeout(()=>{b.style.background = '#050505'; b.style.borderColor = '#222'; b.style.boxShadow = 'inset 0 0 15px #000, 0 5px 10px rgba(0,0,0,0.8)';}, 150);
                            this.stageState.clicks++;
                            if(this.stageState.clicks === this.stageState.sequence.length) {
                                this.stageState.round++;
                                if(this.stageState.round > 3) this.winInteractive(); else setTimeout(()=>playRound(), 800);
                            }
                        } else { this.failRoom(); this.setupStage(); }
                    };
                    smGrid.appendChild(b); boxes.push(b);
                }
                innerStage.appendChild(smGrid);
                this.stageState.round = 1;
                const playRound = () => {
                    this.stageState.playing = false; this.stageState.clicks = 0;
                    let count = this.stageState.round === 1 ? 5 : (this.stageState.round === 2 ? 7 : 10);
                    this.stageState.sequence = Array.from({length: count}, () => Math.floor(Math.random() * p.data));
                    let step = 0;
                    let iv = setInterval(() => {
                        if(step < count) {
                            boxes[this.stageState.sequence[step]].style.background = 'var(--gold)'; boxes[this.stageState.sequence[step]].style.borderColor = '#fff'; boxes[this.stageState.sequence[step]].style.boxShadow = '0 0 30px var(--gold)'; this.playSound('click');
                            setTimeout(()=> {boxes[this.stageState.sequence[step-1]].style.background = '#050505'; boxes[this.stageState.sequence[step-1]].style.borderColor = '#222'; boxes[this.stageState.sequence[step-1]].style.boxShadow = 'inset 0 0 15px #000, 0 5px 10px rgba(0,0,0,0.8)';}, 300);
                            step++;
                        } else { clearInterval(iv); this.stageState.playing = true; }
                    }, 500);
                };
                setTimeout(()=>playRound(), 500);
                break;
            }

            case 'MASTERMIND': {
                let container = document.createElement('div'); container.style.cssText = 'display:flex; flex-direction:column; align-items:center;';
                let inputs = document.createElement('div'); inputs.style.cssText = 'display:flex; gap:15px; justify-content:center;';
                let mboxes = [];
                for(let i=0; i<4; i++) { let inp = document.createElement('input'); inp.type='number'; inp.style.cssText = 'width:70px; height:80px; background:#000; border:2px solid #444; color:var(--gold); font-size:2.5rem; text-align:center; border-radius:8px; outline:none; font-family:monospace; box-shadow:inset 0 0 15px #000; transition:0.3s;'; inp.maxLength=1; inputs.appendChild(inp); mboxes.push(inp); }
                let btn = generateSubmitButton(() => {
                    let guess = mboxes.map(b => parseInt(b.value));
                    if(guess.some(isNaN)) return;
                    this.stageState.attempts++;
                    if(this.stageState.attempts > 8) { this.failRoom(); this.setupStage(); return; }
                    
                    let row = document.createElement('div'); row.style.cssText = 'display:flex; align-items:center; gap:20px; background:#0a0a0a; padding:10px 20px; border:1px solid #333; border-radius:6px; width:80%; justify-content:space-between; margin-bottom:10px;';
                    let txt = document.createElement('div'); txt.style.cssText = 'font-family:monospace; font-size:1.5rem; color:#fff; letter-spacing:5px;'; txt.innerText = guess.join(' ');
                    let tempAns = [...p.ans], tempGuess = [...guess];
                    let pegsContainer = document.createElement('div'); pegsContainer.style.cssText = 'display:flex; gap:8px;';
                    let pegs = [];
                    for(let i=0; i<4; i++) { if(tempGuess[i] === tempAns[i]) { pegs.push('#00ff66'); tempAns[i]=null; tempGuess[i]=-1; } }
                    for(let i=0; i<4; i++) { if(tempGuess[i] !== -1 && tempAns.includes(tempGuess[i])) { pegs.push('#ffa500'); tempAns[tempAns.indexOf(tempGuess[i])]=null; } }
                    while(pegs.length < 4) pegs.push('#ff3333'); 
                    
                    pegs.forEach(c => { let peg = document.createElement('div'); peg.style.cssText = `width:20px; height:20px; border-radius:50%; background:${c}; border:1px solid #555;`; pegsContainer.appendChild(peg); });
                    row.append(txt, pegsContainer); history.prepend(row); mboxes.forEach(b => b.value = '');
                    if(pegs.every(c=>c==='#00ff66')) this.winInteractive();
                }, 'Check Code');
                let history = document.createElement('div'); history.style.cssText = 'display:flex; flex-direction:column; gap:10px; width:100%; max-height:180px; overflow-y:auto; align-items:center; padding:10px; background:rgba(0,0,0,0.5); border-radius:8px; border:1px solid #222; margin-top:15px;';
                container.append(inputs, btn, history); innerStage.appendChild(container);
                break;
            }

            case 'MATCH': {
                let crdGrid = document.createElement('div'); crdGrid.style.cssText = 'display:grid; grid-template-columns:repeat(5, 70px); gap:15px; margin:20px auto; justify-content:center; perspective:1000px;';
                let symbols = [...p.data, ...p.data].sort(() => Math.random() - 0.5);
                let flipped = [];
                symbols.forEach((sym) => {
                    let card = document.createElement('div'); card.style.cssText = 'width:70px; height:70px; perspective:1000px; cursor:pointer; position:relative;';
                    let inner = document.createElement('div'); inner.style.cssText = 'width:100%; height:100%; transition:transform 0.5s; transform-style:preserve-3d; position:absolute;';
                    let front = document.createElement('div'); front.style.cssText = 'width:100%; height:100%; position:absolute; backface-visibility:hidden; background:#111; border:2px solid #333; border-radius:8px; box-shadow:0 5px 10px rgba(0,0,0,0.8); background-image:repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), repeating-linear-gradient(45deg, #000 25%, #111 25%, #111 75%, #000 75%, #000); background-position:0 0, 10px 10px; background-size:20px 20px;';
                    let back = document.createElement('div'); back.style.cssText = 'width:100%; height:100%; position:absolute; backface-visibility:hidden; background:var(--dark-gold); transform:rotateY(180deg); box-shadow:0 0 20px var(--gold); border:2px solid var(--gold); border-radius:8px; display:flex; justify-content:center; align-items:center; font-size:35px;'; back.innerText = sym;
                    inner.append(front, back); card.appendChild(inner);
                    card.onclick = () => {
                        if(inner.style.transform === 'rotateY(180deg)' || flipped.length >= 2) return;
                        inner.style.transform = 'rotateY(180deg)'; flipped.push({c:inner, s:sym});
                        if(flipped.length === 2) {
                            setTimeout(() => {
                                if(flipped[0].s === flipped[1].s) { this.stageState.clicks+=2; if(this.stageState.clicks === 20) this.winInteractive(); }
                                else { flipped[0].c.style.transform = 'rotateY(0deg)'; flipped[1].c.style.transform = 'rotateY(0deg)'; }
                                flipped = [];
                            }, 500);
                        }
                    };
                    crdGrid.appendChild(card);
                });
                innerStage.appendChild(crdGrid);
                break;
            }

            case 'COMPASS': {
                let cmp = document.createElement('div'); cmp.style.cssText = 'width:200px; height:200px; border-radius:50%; background:radial-gradient(circle, #222, #000); border:8px solid #333; position:relative; box-shadow:0 0 30px #000; display:flex; justify-content:center; align-items:center; cursor:pointer; transition:transform 0.3s;';
                let ndl = document.createElement('div'); ndl.style.cssText = 'width:4px; height:180px; background:linear-gradient(to bottom, #ff3333 50%, #fff 50%); position:absolute;';
                let cnt = document.createElement('div'); cnt.style.cssText = 'width:20px; height:20px; background:#D4AF37; border-radius:50%; position:absolute; box-shadow:0 0 10px #000;';
                cmp.append(ndl, cnt);
                let angle = 0;
                cmp.onclick = () => {
                    angle = (angle + 45) % 360; cmp.style.transform = `rotate(${angle}deg)`;
                    if(angle === p.ans) setTimeout(()=>this.winInteractive(), 500);
                };
                innerStage.appendChild(cmp);
                break;
            }

            case 'ASTROLABE': {
                let astWrap = document.createElement('div'); astWrap.style.cssText = 'position: relative; width: 250px; height: 250px; display:flex; justify-content:center; align-items:center; border-radius:50%; border:10px solid #222; background:radial-gradient(circle, #111, #000); box-shadow:0 0 30px rgba(212,175,55,0.3);';
                let r1 = document.createElement('div'); r1.style.cssText = 'position:absolute; border-radius:50%; border:4px dashed var(--gold); transition:transform 0.5s; cursor:pointer; display:flex; justify-content:center; align-items:flex-start; width:230px; height:230px; border-color:var(--gold);'; let m1=document.createElement('div'); m1.style.cssText = 'width:15px; height:15px; background:#fff; border-radius:50%; margin-top:-8px; box-shadow:0 0 10px #fff;'; r1.appendChild(m1);
                let r2 = document.createElement('div'); r2.style.cssText = 'position:absolute; border-radius:50%; border:4px dashed var(--gold); transition:transform 0.5s; cursor:pointer; display:flex; justify-content:center; align-items:flex-start; width:160px; height:160px; border-color:#aaa;'; let m2=document.createElement('div'); m2.style.cssText = 'width:15px; height:15px; background:#fff; border-radius:50%; margin-top:-8px; box-shadow:0 0 10px #fff;'; r2.appendChild(m2);
                let r3 = document.createElement('div'); r3.style.cssText = 'position:absolute; border-radius:50%; border:4px dashed var(--gold); transition:transform 0.5s; cursor:pointer; display:flex; justify-content:center; align-items:flex-start; width:90px; height:90px; border-color:#8a7322;'; let m3=document.createElement('div'); m3.style.cssText = 'width:15px; height:15px; background:#fff; border-radius:50%; margin-top:-8px; box-shadow:0 0 10px #fff;'; r3.appendChild(m3);
                astWrap.append(r1, r2, r3); innerStage.appendChild(astWrap);
                let angles = [90, 180, 270];
                [r1, r2, r3].forEach((r, i) => {
                    r.style.transform = `rotate(${angles[i]}deg)`;
                    r.onclick = () => {
                        angles[i] = (angles[i] + 45) % 360;
                        r.style.transform = `rotate(${angles[i]}deg)`;
                        if(angles.every(a => a === 0)) setTimeout(()=>this.winInteractive(), 500);
                    };
                });
                break;
            }

            case 'SCALES': {
                let sclWrap = document.createElement('div'); sclWrap.style.cssText = 'display:flex; gap:20px; align-items:flex-end; height:150px; border-bottom:4px solid var(--gold); padding-bottom:10px; width:100%; max-width:500px; justify-content:center;';
                p.data.forEach((w) => {
                    let btn = document.createElement('div');
                    btn.style.cssText = 'width:60px; background:linear-gradient(135deg, #eee, #888); border:2px solid #555; text-align:center; font-weight:bold; color:#000; cursor:pointer; transition:0.3s; clip-path:polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%); display:flex; align-items:flex-end; justify-content:center; padding-bottom:10px; box-shadow:0 10px 15px #000;';
                    btn.innerText = w; btn.style.height = (w + 40) + 'px';
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
                let rdWrap = document.createElement('div'); rdWrap.style.cssText = 'display:grid; gap:2px; background:rgba(0,255,100,0.1); border:2px solid #00ff66; padding:5px; border-radius:50%; width:300px; height:300px; overflow:hidden; position:relative; box-shadow:inset 0 0 20px rgba(0,255,100,0.2);';
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
                    let speed = this.stageState.round === 1 ? 1200 : (this.stageState.round === 2 ? 800 : 400);
                    this.stageState.timer = setInterval(() => {
                        cells[targetIdx].style.background = '#00ff66';
                        setTimeout(() => cells[targetIdx].style.background = 'transparent', speed/2);
                    }, speed);
                };
                startRadarRound();
                break;
            }

            case 'PAPYRUS': {
                let papy = document.createElement('div'); papy.style.cssText = "font-family:'Rajdhani',monospace; font-size:3rem; color:#3e3124; background:#e3d2b2; padding:20px 40px; border:4px solid #a68962; border-radius:5px; font-weight:bold; letter-spacing:10px; margin-bottom:30px;";
                papy.innerText = 'AMUN'; innerStage.appendChild(papy);
                createInputBlock('Translate Hieroglyphs...', p.ans);
                break;
            }

            case 'ASTRO_CLOCK': {
                let astWrap = document.createElement('div'); astWrap.style.cssText = 'position:relative; width:250px; height:250px; display:flex; justify-content:center; align-items:center;';
                let r1 = document.createElement('div'); r1.style.cssText = 'position:absolute; width:220px; height:220px; border-radius:50%; border:3px solid #D4AF37; cursor:pointer; display:flex; justify-content:center; transition:transform 0.5s;'; r1.innerHTML = '<div style="font-size:2rem; margin-top:-15px; background:#000;">☀️</div>';
                let r2 = document.createElement('div'); r2.style.cssText = 'position:absolute; width:150px; height:150px; border-radius:50%; border:3px solid #aaa; cursor:pointer; display:flex; justify-content:center; transition:transform 0.5s;'; r2.innerHTML = '<div style="font-size:1.5rem; margin-top:-10px; background:#000;">🌙</div>';
                let r3 = document.createElement('div'); r3.style.cssText = 'position:absolute; width:80px; height:80px; border-radius:50%; border:3px solid #8a7322; cursor:pointer; display:flex; justify-content:center; transition:transform 0.5s;'; r3.innerHTML = '<div style="font-size:1.2rem; margin-top:-8px; background:#000;">⭐</div>';
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
            }

            case 'NEON_NODES': {
                let neonWrap = document.createElement('div'); neonWrap.style.cssText = 'display:flex; flex-wrap:wrap; gap:10px; width:250px; justify-content:center;';
                for(let i=0; i<p.data; i++) {
                    let n = document.createElement('div'); n.style.cssText = 'width:50px; height:50px; background:#111; border:2px solid #333; border-radius:50%; display:flex; justify-content:center; align-items:center; cursor:pointer; color:#555; transition:0.3s; font-weight:bold;'; n.innerText = i;
                    n.onclick = () => {
                        n.classList.toggle('active');
                        n.style.background = n.classList.contains('active') ? '#00ff66' : '#111';
                        n.style.color = n.classList.contains('active') ? '#000' : '#555';
                        n.style.boxShadow = n.classList.contains('active') ? '0 0 15px #00ff66' : 'none';
                        let actives = Array.from(neonWrap.children).map((x,idx)=>x.classList.contains('active')?idx:-1).filter(x=>x!==-1);
                        if(actives.length === p.ans.length && p.ans.every(a=>actives.includes(a))) setTimeout(()=>this.winInteractive(), 300);
                    };
                    neonWrap.appendChild(n);
                }
                innerStage.appendChild(neonWrap);
                break;
            }

            case 'JUGS': {
                let jugWrap = document.createElement('div'); jugWrap.style.cssText = 'display:flex; gap:20px; align-items:flex-end; height:150px;';
                let caps = [8, 5, 3];
                let vols = [8, 0, 0];
                let selected = -1;
                const renderJugs = () => {
                    jugWrap.innerHTML = '';
                    caps.forEach((cap, i) => {
                        let j = document.createElement('div'); j.style.cssText = 'width:60px; background:linear-gradient(90deg, #5c4033, #3e2723); border:2px solid #222; border-radius:0 0 8px 8px; position:relative; overflow:hidden; cursor:pointer; box-shadow:0 5px 10px #000; transition:0.2s;'; j.style.height = (cap * 20 + 40) + 'px';
                        if(i === selected) j.style.borderColor = 'var(--gold)';
                        let w = document.createElement('div'); w.style.cssText = 'position:absolute; bottom:0; width:100%; background:rgba(0,200,255,0.6); transition:height 0.3s;'; w.style.height = (vols[i] / cap * 100) + '%';
                        j.appendChild(w);
                        let lbl = document.createElement('div'); lbl.style.cssText = 'position:absolute; width:100%; text-align:center; color:#fff; font-weight:bold; top:10px; z-index:2; text-shadow:0 0 5px #000;'; lbl.innerText = `${vols[i]}/${cap}`;
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
            }

            case 'SLIDING_PUZZLE': {
                let pzWrap = document.createElement('div'); pzWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:4px; background:#222; padding:8px; border:2px solid #555; border-radius:6px; box-shadow:0 15px 25px rgba(0,0,0,0.9);';
                let tiles = [1,2,3,4,5,6,7,0,8]; 
                const renderPuzzle = () => {
                    pzWrap.innerHTML = '';
                    tiles.forEach((t, i) => {
                        let cell = document.createElement('div'); 
                        if(t === 0) { cell.style.cssText = 'width:80px; height:80px; background:transparent; border:1px dashed #444; border-radius:4px;'; }
                        else { 
                            cell.style.cssText = 'width:80px; height:80px; background:linear-gradient(135deg, #D4AF37, #8a7322); display:flex; justify-content:center; align-items:center; font-size:2.5rem; font-weight:bold; color:#000; cursor:pointer; border-radius:4px; box-shadow:inset 0 0 10px rgba(0,0,0,0.3); transition:0.2s; user-select:none;';
                            cell.innerText = t; 
                        }
                        cell.onclick = () => {
                            let emptyIdx = tiles.indexOf(0);
                            let validMoves = [emptyIdx-1, emptyIdx+1, emptyIdx-3, emptyIdx+3];
                            if(emptyIdx%3 === 0 && i === emptyIdx-1) return;
                            if(emptyIdx%3 === 2 && i === emptyIdx+1) return;
                            if(validMoves.includes(i)) {
                                this.playSound('click');
                                tiles[emptyIdx] = t; tiles[i] = 0; renderPuzzle();
                                if(tiles.join('') === '123456780') setTimeout(()=>this.winInteractive(), 300);
                            }
                        };
                        pzWrap.appendChild(cell);
                    });
                };
                renderPuzzle(); innerStage.appendChild(pzWrap);
                break;
            }

            case 'BLIND_MAZE': {
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
            }

            case 'CAESAR': {
                let txtDisp16 = document.createElement('div'); txtDisp16.style.cssText = 'font-family:monospace; font-size:3rem; color:var(--gold); text-shadow:0 0 20px var(--gold); background:#000; border:2px solid #333; padding:10px 30px; border-radius:8px; margin-bottom:20px; letter-spacing:5px; text-align:center;'; txtDisp16.innerText = 'ABC';
                innerStage.appendChild(txtDisp16);
                createInputBlock('ENTER DECODE SEQUENCE...', p.ans);
                break;
            }

            case 'BARCODE': {
                let txtDisp18 = document.createElement('div'); txtDisp18.style.cssText = 'font-family:monospace; font-size:3rem; color:var(--gold); text-shadow:0 0 20px var(--gold); background:#000; border:2px solid #333; padding:10px 30px; border-radius:8px; margin-bottom:20px; letter-spacing:5px; text-align:center;'; txtDisp18.innerText = '2, 4, 8, ?';
                innerStage.appendChild(txtDisp18);
                createInputBlock('ENTER DECODE SEQUENCE...', p.ans);
                break;
            }

            case 'LIGHTS_OUT': {
                let loWrap = document.createElement('div'); loWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:5px;';
                let cells = [];
                for(let i=0; i<p.data; i++) {
                    let c = document.createElement('div'); c.style.cssText = 'width:80px; height:80px; background:var(--gold); border:2px solid #fff; border-radius:8px; cursor:pointer; box-shadow:0 0 30px var(--gold); transition:0.1s;'; c.classList.add('pulse'); 
                    c.onclick = () => {
                        c.classList.toggle('pulse'); c.style.background = c.classList.contains('pulse') ? 'var(--gold)' : '#050505'; c.style.boxShadow = c.classList.contains('pulse') ? '0 0 30px var(--gold)' : 'inset 0 0 15px #000';
                        let r = Math.floor(i/3), cl = i%3;
                        let tg = (idx) => { cells[idx].classList.toggle('pulse'); cells[idx].style.background = cells[idx].classList.contains('pulse') ? 'var(--gold)' : '#050505'; cells[idx].style.boxShadow = cells[idx].classList.contains('pulse') ? '0 0 30px var(--gold)' : 'inset 0 0 15px #000'; };
                        if(r > 0) tg(i-3); if(r < 2) tg(i+3);
                        if(cl > 0) tg(i-1); if(cl < 2) tg(i+1);
                        if(cells.every(cell => !cell.classList.contains('pulse'))) setTimeout(() => this.winInteractive(), 300);
                    };
                    cells.push(c); loWrap.appendChild(c);
                }
                innerStage.appendChild(loWrap);
                break;
            }

            case 'DNA': {
                let dnaWrap = document.createElement('div'); dnaWrap.style.cssText = 'display:flex; flex-direction:column; gap:10px; align-items:center;';
                let bases = ['A','C','G','T']; this.stageState.arr = ['A','A','A','A'];
                ['T','G','A','C'].forEach((target, i) => {
                    let row = document.createElement('div'); row.style.cssText = 'display:flex; gap:20px; position:relative;';
                    let line = document.createElement('div'); line.style.cssText = 'position:absolute; width:40px; height:2px; background:#333; top:24px; left:25px; z-index:0;';
                    let left = document.createElement('div'); left.style.cssText = 'width:50px; height:50px; border-radius:50%; background:#111; border:2px solid #444; display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:1.5rem; color:#666; z-index:1;'; left.innerText = (target==='T'?'A':(target==='G'?'C':(target==='A'?'T':'G')));
                    let right = document.createElement('div'); right.style.cssText = 'width:50px; height:50px; border-radius:50%; background:#000; border:2px solid var(--gold); display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:1.5rem; color:var(--gold); cursor:pointer; z-index:1; box-shadow:inset 0 0 10px var(--gold);'; right.innerText = 'A';
                    right.onclick = () => { this.playSound('click'); let idx = bases.indexOf(right.innerText); idx = (idx + 1) % 4; right.innerText = bases[idx]; this.stageState.arr[i] = bases[idx]; };
                    row.append(line, left, right); dnaWrap.appendChild(row);
                });
                innerStage.appendChild(dnaWrap);
                innerStage.appendChild(generateSubmitButton(() => { if(JSON.stringify(this.stageState.arr) === JSON.stringify(p.ans.split(''))) this.winInteractive(); else this.failRoom(); }));
                break;
            }

            case 'PIPES': {
                let pipeWrap = document.createElement('div'); pipeWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); background:#111; padding:10px; border:4px solid #222; border-radius:8px;';
                let pipeChars = ['┗','━','┛','┃','╋','┃','┏','━','┓'];
                this.stageState.arr = [0,90,0, 90,0,90, 0,90,0];
                for(let i=0; i<9; i++) {
                    let cell = document.createElement('div'); cell.style.cssText = `width:80px; height:80px; background:#050505; border:1px solid #1a1a1a; display:flex; justify-content:center; align-items:center; font-size:3.5rem; color:var(--gold); cursor:pointer; transition:transform 0.2s; text-shadow:0 0 10px var(--gold); transform:rotate(${this.stageState.arr[i]}deg);`; cell.innerText = pipeChars[i];
                    cell.onclick = () => {
                        this.playSound('click');
                        this.stageState.arr[i] = (this.stageState.arr[i] + 90) % 360;
                        cell.style.transform = `rotate(${this.stageState.arr[i]}deg)`;
                        if(this.stageState.arr.every(a => a === 0)) setTimeout(()=>this.winInteractive(), 500);
                    };
                    pipeWrap.appendChild(cell);
                }
                innerStage.appendChild(pipeWrap);
                break;
            }

            case 'KEYPAD': {
                let kWrap = document.createElement('div'); kWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:10px; background:#111; padding:20px; border-radius:8px; border:2px solid #333;';
                let kDisp = document.createElement('div'); kDisp.style.cssText = 'grid-column:span 3; height:60px; background:#000; border:2px solid var(--gold); color:var(--gold); display:flex; justify-content:center; align-items:center; font-size:2rem; font-family:monospace; letter-spacing:8px; margin-bottom:10px;';
                kDisp.innerText='_ _ _ _'; kWrap.appendChild(kDisp);
                let padNums = [1,2,3,4,5,6,7,8,9,'*',0,'#'];
                padNums.forEach((n) => {
                    let btn = document.createElement('div'); btn.style.cssText = 'width:80px; height:60px; background:linear-gradient(180deg,#333,#111); border:1px solid #555; border-radius:4px; display:flex; justify-content:center; align-items:center; color:#fff; font-size:1.5rem; font-weight:bold; cursor:pointer; box-shadow:0 4px 6px #000;';
                    btn.innerText = n;
                    btn.onclick = () => {
                        if(typeof n === 'number') {
                            this.playSound('click'); btn.style.transform='translateY(2px)'; setTimeout(()=>btn.style.transform='translateY(0)', 100);
                            this.stageState.val = (this.stageState.val || '') + n;
                            kDisp.innerText = this.stageState.val.padEnd(p.ans.length,'_');
                            if(this.stageState.val === p.ans) { setTimeout(()=>this.winInteractive(), 300); }
                            else if(this.stageState.val.length >= p.ans.length) { this.failRoom(); this.setupStage(); }
                        }
                    };
                    kWrap.appendChild(btn);
                });
                innerStage.appendChild(kWrap);
                break;
            }

            case 'HEATMAP': {
                let htWrap = document.createElement('div'); htWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:10px; background:#111; padding:20px; border-radius:10px;';
                let hmColors = {8:'#ff0000', 4:'#ff8800', 9:'#ffcc00', 1:'#ffff66'}; 
                [1,2,3,4,5,6,7,8,9].forEach(n => {
                    let b = document.createElement('button'); b.style.cssText = 'width:80px; height:80px; border:none; border-radius:6px; font-size:2rem; font-weight:bold; color:#fff; text-shadow:0 0 5px #000; cursor:pointer;'; b.innerText = n; b.style.background = hmColors[n] ? hmColors[n] : '#333';
                    if(hmColors[n]) b.style.boxShadow = `inset 0 0 30px ${hmColors[n]}`;
                    b.onclick = () => {
                        this.playSound('click'); this.stageState.arr.push(n);
                        if(this.stageState.arr.length === p.ans.length) {
                            if(this.stageState.arr.join('') === p.ans) this.winInteractive();
                            else { this.failRoom(); this.setupStage(); }
                        }
                    };
                    htWrap.appendChild(b);
                });
                innerStage.appendChild(htWrap);
                createInputBlock('أدخل الرمز...', p.ans);
                break;
            }

            case 'ELEVATOR': {
                let elWrap = document.createElement('div'); elWrap.style.cssText = 'display:grid; grid-template-columns:repeat(2, 70px); gap:15px;';
                ['3','4','1','2','B1','B2','B3'].forEach(n => {
                    let b = document.createElement('div'); b.style.cssText = 'width:70px; height:70px; border-radius:50%; background:radial-gradient(circle, #eee, #ccc); border:2px solid #999; box-shadow:0 5px 5px rgba(0,0,0,0.5), inset 0 0 5px #fff; display:flex; justify-content:center; align-items:center; font-size:1.8rem; font-weight:bold; color:#333; cursor:pointer;'; b.innerText = n;
                    b.onclick = () => {
                        this.playSound('click'); b.style.background = '#aaa'; setTimeout(()=>b.style.background = 'radial-gradient(circle, #eee, #ccc)', 300);
                        if(n === p.ans) setTimeout(()=>this.winInteractive(), 300); else this.failRoom();
                    }; elWrap.appendChild(b);
                });
                innerStage.appendChild(elWrap);
                break;
            }

            case 'BOSS': {
                let bWrap = document.createElement('div'); bWrap.style.cssText='display:flex; gap:20px; margin-bottom:30px;';
                for(let i=0; i<3; i++) { 
                    let sw = document.createElement('div'); sw.style.cssText = 'position:relative; width:80px; height:120px; background:#111; border:2px solid #333; border-radius:8px; cursor:pointer; color:#555; text-align:center; padding-top:80px; font-weight:bold;'; sw.innerHTML = `<div style="position: absolute; top: 15px; width: 60px; left: 8px; height: 50px; background: #050505; border-radius: 4px; box-shadow: inset 0 5px 10px #000; transition: 0.3s;"></div>OFF`;
                    sw.onclick = () => {
                        this.playSound('click'); sw.classList.toggle('active'); 
                        if(sw.classList.contains('active')){ sw.style.color = '#D4AF37'; sw.innerHTML = `<div style="position: absolute; top: 55px; width: 60px; left: 8px; height: 50px; background: #D4AF37; border-radius: 4px; box-shadow: 0 0 20px #D4AF37; transition: 0.3s;"></div>ON`; } 
                        else { sw.style.color = '#555'; sw.innerHTML = `<div style="position: absolute; top: 15px; width: 60px; left: 8px; height: 50px; background: #050505; border-radius: 4px; box-shadow: inset 0 5px 10px #000; transition: 0.3s;"></div>OFF`; }
                    };
                    bWrap.appendChild(sw); 
                }
                let bInp = document.createElement('input'); bInp.type='text'; bInp.style.cssText = 'background:#000; border:2px solid var(--gold); color:var(--gold); padding:15px; font-size:1.8rem; text-align:center; width:100%; max-width:400px; outline:none; box-shadow:inset 0 0 20px rgba(212,175,55,0.2); letter-spacing:5px; font-family:monospace; border-radius:8px; margin-bottom:20px; text-transform:uppercase;'; bInp.placeholder='MASTER PASSWORD';
                let bBtn = generateSubmitButton(() => { let allSwitchesOn = Array.from(bWrap.children).every(s=>s.classList.contains('active')); if(allSwitchesOn && bInp.value.trim().toUpperCase() === p.ans) this.winInteractive(); else this.failRoom(); }, '🔥 INITIATE MASTER HACK 🔥'); bBtn.style.background='#ff0000'; bBtn.style.color='#fff'; bBtn.style.borderColor='#fff';
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
            this.showToast('تم اختراق الروم بنجاح! +15 بيانات', '#00ff66');
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
        this.showToast('تم تخطي الروم إجبارياً!', '#00ff66');
        this.returnToLobby();
    }

    returnToLobby() { 
        if(this.stageState.timer) clearInterval(this.stageState.timer);
        this.playSound('click'); this.switchScreen('lobby'); this.renderLobby(); 
    }
}

// السطر الأهم لتشغيل اللعبة، ولا تلمسه أبداً
const game = new SolarGamesEngine();
