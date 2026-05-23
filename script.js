class SolarGamesEngine {
    constructor() {
        this.coins = 0; 
        this.globalTime = 90 * 60; 
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
            else if(i===3) { m.uiType = 'MASTERMIND'; m.desc="خزنة الألوان: 4 أرقام (أخضر=مكانه صح، برتقالي=موجود لكن مكانه غلط)."; m.ans=[3,7,1,9]; m.hint="💡 تفاعلي: الكود هو 3719. | 📝 كتابي: لا يمكنك البوح به."; }
            else if(i===4) { m.uiType = 'MATCH'; m.desc="تطابق الأشكال: 20 شريحة فلكية."; m.data=['🪐','☄️','🌑','🔭','🛸','🛰️','🌌','🌠','🚀','👨‍🚀']; m.hint="💡 تفاعلي: احفظ الأماكن ووجهني. | 📝 كتابي: يزيد ولا ينقص."; }
            else if(i===5) { m.uiType = 'ASTROLABE'; m.desc="الأسطرلاب الفلكي: طابق الـ 3 حلقات لزاوية 0."; m.hint="💡 تفاعلي: خل المؤشرات كلها متجهة للأعلى. | 📝 كتابي: يرتد لك من الجدار."; }
            else if(i===6) { m.uiType = 'RUNES'; m.desc="الرموز الحجرية: ابحث عن الرمز الصحيح."; m.data=16; m.ans=7; m.hint="💡 تفاعلي: الصف الثاني، الرمز الأخير مختلف بشعرة. | 📝 كتابي: يمتص السوائل."; }
            else if(i===7) { m.uiType = 'SCALES'; m.desc="الميزان الروماني: اختر أوزان مجموعها 150."; m.data=[50,70,30,80,20]; m.target=150; m.hint="💡 تفاعلي: 70 + 80. | 📝 كتابي: يأتي غداً."; }
            else if(i===8) { m.uiType = 'RADAR_ROUNDS'; m.desc="الرادار المعتم: 3 راوندات تصاعدية (الوميض يصير أسرع)."; m.hint="💡 تفاعلي: ركز في مكان الوميض الخاطف. | 📝 كتابي: تقطعه لتفي به."; }
            else if(i===9) { m.uiType = 'KEYPAD'; m.desc="لوحة الأرقام: أدخل التسلسل 7-3-9."; m.ans='739'; m.hint="💡 تفاعلي: 739. | 📝 كتابي: لغته السكوت."; }
            else if(i===10) { m.uiType = 'GEARS'; m.desc="التروس الميكانيكية: طابق الأسنان للأعلى."; m.ans=[0,0,0]; m.hint="💡 تفاعلي: دورها كلها لين تصير بوضع عمودي. | 📝 كتابي: قشرتها هشة."; }
            else if(i===11) { m.uiType = 'MORSE'; m.desc="شفرة مورس: ترجم الومضات واكتب الكود."; m.ans='SOS'; m.hint="💡 تفاعلي: SOS. | 📝 كتابي: تنشفك وتتبلل."; }
            else if(i===12) { m.uiType = 'HEX'; m.desc="صل الخلايا السداسية لتكوين مسار مستقيم."; m.ans=[3,4,5]; m.hint="💡 تفاعلي: المسار الأوسط بالكامل. | 📝 كتابي: ترسم العالم."; }
            else if(i===13) { m.uiType = 'WEIGHTS'; m.desc="أوزان الخيمياء: مجموع 140g."; m.data=[40,60,80,20,50]; m.target=140; m.hint="💡 تفاعلي: 60 + 80. | 📝 كتابي: تعرف بها الوقت."; }
            else if(i===14) { m.uiType = 'SLIDERS'; m.desc="لوحة الألوان: ادمج الأحمر 212 والأخضر 175."; m.data=[{label:'RED',max:255},{label:'GRN',max:255}]; m.ans=[212, 175]; m.hint="💡 تفاعلي: الأحمر 212 والأخضر 175. | 📝 كتابي: يمطر."; }
            else if(i===15) { m.uiType = 'MAZE'; m.desc="المتاهة العمياء: خطوة غلط ترجعك للصفر."; m.data=36; m.ans=[0,6,12,13,14,20,26]; m.hint="💡 تفاعلي: تحت مرتين، يمين مرتين، تحت مرتين. | 📝 كتابي: صيفي ولذيذ."; }
            else if(i===16) { m.uiType = 'CRYPTEX'; m.desc="الكريبتكس الأسطواني: فك شفرة كلمة CDE (+2 إزاحة)."; m.ans='EFG'; m.hint="💡 تفاعلي: EFG. | 📝 كتابي: يثبت الأشياء."; }
            else if(i===17) { m.uiType = 'SHELLS'; m.desc="خفة اليد: 3 راوندات، الكور تزيد وتسرع."; m.hint="💡 تفاعلي: ركز على الكورة اللي تطلع فيها النجمة. | 📝 كتابي: أداة الكتابة."; }
            else if(i===18) { m.uiType = 'BARCODE'; m.desc="الباركود البصري: ارسم الخطوط الناقصة."; m.ans=[2,5,7]; m.hint="💡 تفاعلي: اضغط العمود الثالث والسادس والثامن. | 📝 كتابي: يتبعك بالشمس."; }
            else if(i===19) { m.uiType = 'RADIO'; m.desc="موجة التردد: دور البكرة لين تصير الموجة ناعمة (199)."; m.ans=199; m.hint="💡 تفاعلي: التردد 199. | 📝 كتابي: تدل على الشمال."; }
            else if(i===20) { m.uiType = 'LIGHTS_OUT'; m.desc="إطفاء الأنوار: أطفئ جميع المصابيح الـ 9."; m.data=9; m.hint="💡 تفاعلي: انقر على الزوايا ثم المنتصف. | 📝 كتابي: لا تُرى."; }
            else if(i===21) { m.uiType = 'ANOMALY'; m.desc="الشذوذ الدقيق: 36 رمز متشابه، واحد فقط يختلف."; m.ans=22; m.hint="💡 تفاعلي: الرمز (𖤌) في الصف الرابع، العمود الخامس. | 📝 كتابي: تخاف من الماء."; }
            else if(i===22) { m.uiType = 'DNA'; m.desc="شريط DNA: طابق الروابط (A=T, C=G)."; m.ans=['T','G','A','C']; m.hint="💡 تفاعلي: T ثم G ثم A ثم C. | 📝 كتابي: تكبر كلما أخذت منها."; }
            else if(i===23) { m.uiType = 'PIPES'; m.desc="شبكة الأنابيب: دورها لربط البداية بالنهاية."; m.hint="💡 تفاعلي: خلها كلها خطوط أفقية (━). | 📝 كتابي: يقرصك ببطنك."; }
            else if(i===24) { m.uiType = 'SLIDING'; m.desc="اللوحة المنزلقة: رتب الأرقام 1-8."; m.ans='123456780'; m.hint="💡 تفاعلي: رتبها تصاعدياً 1 لـ 8 والفراغ بالاخير. | 📝 كتابي: ينادونك به."; }
            else if(i===25) { m.uiType = 'MAGIC_SQUARE'; m.desc="المربع السحري: غير الأرقام ليصبح المجموع 15 بكل اتجاه."; m.ans=[8,1,6,3,5,7,4,9,2]; m.hint="💡 تفاعلي: 8-1-6 بالصف الأول، 3-5-7 بالثاني، 4-9-2 بالثالث. | 📝 كتابي: تتركها وراءك."; }
            else if(i===26) { m.uiType = 'HEATMAP'; m.desc="البصمة الحرارية: أدخل من الأسخن للأبرد."; m.ans=[8,4,9,1]; m.hint="💡 تفاعلي: 8، 4، 9، 1. | 📝 كتابي: قطرات من السماء."; }
            else if(i===27) { m.uiType = 'MATRIX'; m.desc="النص الساقط: التقط كلمة SOLAR وهي تسقط."; m.hint="💡 تفاعلي: اضغط على كلمة SOLAR الخضراء. | 📝 كتابي: افتح يا..."; }
            else if(i===28) { m.uiType = 'ELEVATOR'; m.desc="لوحة المصعد: اصعد للأدوار 3، 1، 5."; m.ans=[3,1,5]; m.hint="💡 تفاعلي: اضغط 3 ثم 1 ثم 5. | 📝 كتابي: مدينة تاريخية."; }
            else if(i===29) { m.uiType = 'INPUT'; m.desc="معادلة جدار الحماية: (10 * 5) + 50."; m.ans='100'; m.hint="💡 تفاعلي: اكتب 100. | 📝 كتابي: تذوب لتضيء."; }
            else if(i===30) { m.uiType = 'BOSS'; m.desc="MASTER BREACH: فعل المفاتيح واكتب GOLDEN."; m.ans='GOLDEN'; m.hint="💡 تفاعلي: فعل القواطع واكتب GOLDEN | 📝 كتابي: معدن أصفر نفيس."; }

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

    // المُولد البصري الجبار (يغطي جميع الحالات بدون أي أزرار ميتة)
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
                    row.append(txt, pegsContainer); history.prepend(row); mboxes.forEach(b => b.value = '');
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

            case 'ASTROLABE':
                let astro = document.createElement('div'); astro.className = 'astrolabe';
                let r1 = document.createElement('div'); r1.className = 'astro-ring astro-r1'; let m1=document.createElement('div'); m1.className='astro-marker'; r1.appendChild(m1);
                let r2 = document.createElement('div'); r2.className = 'astro-ring astro-r2'; let m2=document.createElement('div'); m2.className='astro-marker'; r2.appendChild(m2);
                let r3 = document.createElement('div'); r3.className = 'astro-ring astro-r3'; let m3=document.createElement('div'); m3.className='astro-marker'; r3.appendChild(m3);
                astro.append(r1, r2, r3); innerStage.appendChild(astro);
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

            case 'RUNES':
            case 'ANOMALY':
                let rnWrap = document.createElement('div'); rnWrap.style.cssText = 'display:grid; grid-template-columns:repeat(6, 60px); gap:10px;';
                let isAnomaly = p.uiType === 'ANOMALY';
                let rCount = isAnomaly ? 36 : 16;
                if(!isAnomaly) rnWrap.style.gridTemplateColumns = 'repeat(4, 70px)';
                for(let i=0; i<rCount; i++) {
                    let b = document.createElement('div'); b.className = 'stone-btn'; 
                    if(isAnomaly) { b.style.width='60px'; b.style.height='60px'; b.style.fontSize='2rem'; b.innerText = (i === p.ans) ? '𖤌' : '𖤍'; }
                    else { b.innerText = 'Ⱄ'; }
                    b.onclick = () => { 
                        if(i === p.ans) this.winInteractive(); else this.failRoom(); 
                    };
                    rnWrap.appendChild(b);
                }
                innerStage.appendChild(rnWrap);
                break;

            case 'CRYPTEX':
                let cryWrap = document.createElement('div'); cryWrap.className = 'cryptex-wrap';
                this.stageState.chars = ['A','B','C'];
                for(let i=0; i<3; i++) {
                    let col = document.createElement('div'); col.className = 'cryptex-col';
                    let btnUp = document.createElement('div'); btnUp.className='cryp-btn'; btnUp.innerText='▲';
                    let charBox = document.createElement('div'); charBox.className='cryp-char'; charBox.innerText=this.stageState.chars[i];
                    let btnDn = document.createElement('div'); btnDn.className='cryp-btn'; btnDn.innerText='▼';
                    
                    const updateChar = (dir) => {
                        let code = this.stageState.chars[i].charCodeAt(0) + dir;
                        if(code > 90) code = 65; if(code < 65) code = 90;
                        this.stageState.chars[i] = String.fromCharCode(code);
                        charBox.innerText = this.stageState.chars[i];
                    };
                    btnUp.onclick = () => updateChar(1); btnDn.onclick = () => updateChar(-1);
                    col.append(btnUp, charBox, btnDn); cryWrap.appendChild(col);
                }
                innerStage.appendChild(cryWrap);
                innerStage.appendChild(generateSubmitButton(() => {
                    if(this.stageState.chars.join('') === p.ans) this.winInteractive(); else this.failRoom();
                }));
                break;

            case 'SHELLS':
                let shWrap = document.createElement('div'); shWrap.className = 'balls-container';
                innerStage.appendChild(shWrap);
                this.stageState.round = 1;
                
                const playShells = () => {
                    shWrap.innerHTML = '';
                    let ballCount = this.stageState.round === 1 ? 3 : (this.stageState.round === 2 ? 4 : 5);
                    let balls = [];
                    let targetIdx = Math.floor(Math.random() * ballCount);
                    
                    for(let i=0; i<ballCount; i++) {
                        let b = document.createElement('div'); b.className = 'shell-ball'; b.style.left = (i * 80) + 'px';
                        b.dataset.pos = i;
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
                    
                    // إخفاء النجمة ثم الخلط
                    this.stageState.playing = true;
                    setTimeout(() => {
                        balls.forEach(b => b.innerText = '');
                        let shuffles = 0;
                        let maxShuffles = this.stageState.round * 5 + 5;
                        let speed = 400 - (this.stageState.round * 50);
                        
                        let iv = setInterval(() => {
                            let i1 = Math.floor(Math.random() * ballCount);
                            let i2 = Math.floor(Math.random() * ballCount);
                            let tempLeft = balls[i1].style.left;
                            balls[i1].style.left = balls[i2].style.left;
                            balls[i2].style.left = tempLeft;
                            shuffles++;
                            if(shuffles > maxShuffles) { clearInterval(iv); this.stageState.playing = false; }
                        }, speed);
                    }, 2000);
                };
                playShells();
                break;

            case 'BARCODE':
                let bcWrap = document.createElement('div'); bcWrap.className = 'barcode-visual';
                let pattern = [1,0,1,0,0,1,0,1,0,1];
                this.stageState.arr = [1,0,0,0,0,0,0,0,0,1]; // الحالة الحالية
                for(let i=0; i<10; i++) {
                    let bar = document.createElement('div'); bar.className = 'bc-bar';
                    if(this.stageState.arr[i] === 0) bar.classList.add('missing');
                    bar.onclick = () => {
                        bar.classList.toggle('missing');
                        this.stageState.arr[i] = bar.classList.contains('missing') ? 0 : 1;
                    };
                    bcWrap.appendChild(bar);
                }
                innerStage.appendChild(bcWrap);
                innerStage.appendChild(generateSubmitButton(() => {
                    if(JSON.stringify(this.stageState.arr) === JSON.stringify(pattern)) this.winInteractive(); else this.failRoom();
                }));
                break;

            case 'RADIO':
                let rdWrap = document.createElement('div'); rdWrap.style.width='100%'; rdWrap.style.display='flex'; rdWrap.style.flexDirection='column'; rdWrap.style.alignItems='center';
                let rWave = document.createElement('div'); rWave.className = 'radio-wave';
                let rLine = document.createElement('div'); rLine.className = 'wave-line'; rWave.appendChild(rLine);
                let rKnob = document.createElement('div'); rKnob.className = 'radio-knob';
                let rTick = document.createElement('div'); rTick.className = 'radio-tick'; rKnob.appendChild(rTick);
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

            case 'DNA':
                let dnaWrap = document.createElement('div'); dnaWrap.className = 'dna-wrap';
                let bases = ['A','C','G','T'];
                this.stageState.arr = ['A','A','A','A'];
                ['T','G','A','C'].forEach((target, i) => {
                    let row = document.createElement('div'); row.className = 'dna-row';
                    let left = document.createElement('div'); left.className = 'dna-base dna-fixed'; left.innerText = (target==='T'?'A':(target==='G'?'C':(target==='A'?'T':'G')));
                    let right = document.createElement('div'); right.className = 'dna-base dna-clickable'; right.innerText = 'A';
                    right.onclick = () => {
                        let idx = bases.indexOf(right.innerText);
                        idx = (idx + 1) % 4; right.innerText = bases[idx];
                        this.stageState.arr[i] = bases[idx];
                        if(JSON.stringify(this.stageState.arr) === JSON.stringify(p.ans)) setTimeout(()=>this.winInteractive(), 300);
                    };
                    row.append(left, right); dnaWrap.appendChild(row);
                });
                innerStage.appendChild(dnaWrap);
                break;

            case 'PIPES':
                let pipeWrap = document.createElement('div'); pipeWrap.className = 'pipes-grid';
                let pipeChars = ['┗','━','┛','┃','╋','┃','┏','━','┓'];
                this.stageState.arr = [0,90,0, 90,0,90, 0,90,0];
                for(let i=0; i<9; i++) {
                    let cell = document.createElement('div'); cell.className = 'pipe-cell'; cell.innerText = pipeChars[i];
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

            case 'SLIDING':
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
                            // Prevent crossing rows
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

            case 'MAGIC_SQUARE':
                let msWrap = document.createElement('div'); msWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:5px;';
                let msGrid = [8,1,6, 3,0,7, 4,9,2];
                for(let i=0; i<9; i++) {
                    let cell = document.createElement('div'); cell.className = 'box-lux'; 
                    cell.innerText = msGrid[i];
                    if(i===4) {
                        cell.style.color='var(--gold)'; cell.style.borderColor='var(--gold)';
                        cell.onclick = () => {
                            msGrid[i] = msGrid[i] >= 9 ? 1 : msGrid[i]+1; cell.innerText = msGrid[i];
                            if(msGrid[i] == p.ans) setTimeout(()=>this.winInteractive(), 300);
                        };
                    }
                    msWrap.appendChild(cell);
                }
                innerStage.appendChild(msWrap);
                break;

            case 'HEATMAP':
                let htWrap = document.createElement('div'); htWrap.className = 'heat-grid';
                let hmColors = {8:'#ff0000', 4:'#ff8800', 9:'#ffcc00', 1:'#ffff66'}; 
                [1,2,3,4,5,6,7,8,9].forEach(n => {
                    let b = document.createElement('button'); b.className = 'heat-btn'; b.innerText = n;
                    b.style.background = hmColors[n] ? hmColors[n] : '#333';
                    b.onclick = () => {
                        this.stageState.arr.push(n);
                        if(this.stageState.arr.length === p.ans.length) {
                            if(JSON.stringify(this.stageState.arr) === JSON.stringify(p.ans)) this.winInteractive();
                            else { this.failRoom(); this.setupStage(); }
                        }
                    };
                    htWrap.appendChild(b);
                });
                innerStage.appendChild(htWrap);
                break;

            case 'MATRIX':
                let mxWrap = document.createElement('div'); mxWrap.className = 'matrix-screen';
                innerStage.appendChild(mxWrap);
                this.stageState.timer = setInterval(() => {
                    let word = document.createElement('div'); word.className = 'matrix-word';
                    let isTarget = Math.random() > 0.8;
                    word.innerText = isTarget ? p.ans : (Math.random().toString(36).substring(2, 7).toUpperCase());
                    word.style.left = Math.random() * 90 + '%'; word.style.top = '-20px';
                    if(isTarget) word.style.color = '#fff'; // تلميح بسيط للعين
                    word.onclick = () => { if(isTarget) this.winInteractive(); else this.failRoom(); };
                    mxWrap.appendChild(word);
                    let pos = -20;
                    let fall = setInterval(() => {
                        pos += 5; word.style.top = pos + 'px';
                        if(pos > 200) { clearInterval(fall); word.remove(); }
                    }, 50);
                }, 1000);
                break;

            case 'ELEVATOR':
                let elWrap = document.createElement('div'); elWrap.className = 'elevator-panel';
                [1,2,3,4,5,6].forEach(n => {
                    let b = document.createElement('div'); b.className = 'elevator-btn'; b.innerText = n;
                    b.onclick = () => {
                        b.classList.add('active'); setTimeout(()=>b.classList.remove('active'), 300);
                        if(p.ans[this.stageState.clicks] === n) {
                            this.stageState.clicks++;
                            if(this.stageState.clicks === p.ans.length) setTimeout(()=>this.winInteractive(), 300);
                        } else { this.failRoom(); this.setupStage(); }
                    };
                    elWrap.appendChild(b);
                });
                innerStage.appendChild(elWrap);
                break;

            case 'RADAR_ROUNDS':
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
                    let speed = this.stageState.round === 1 ? 1500 : (this.stageState.round === 2 ? 1000 : 500);
                    this.stageState.timer = setInterval(() => {
                        cells[targetIdx].style.background = '#00ff66';
                        setTimeout(() => cells[targetIdx].style.background = 'transparent', speed/2);
                    }, speed);
                };
                startRadarRound();
                break;

            case 'BOSS':
                let bWrap = document.createElement('div'); bWrap.style.cssText='display:flex; gap:20px; margin-bottom:30px;';
                for(let i=0; i<3; i++) { let sw = document.createElement('div'); sw.className='switch-lux'; sw.innerText='OFF'; sw.onclick=()=> { sw.classList.toggle('active'); sw.innerText = sw.classList.contains('active')?'ON':'OFF'; }; bWrap.appendChild(sw); }
                let bInp = document.createElement('input'); bInp.type='text'; bInp.className='cyber-input'; bInp.placeholder='MASTER PASSWORD';
                let bBtn = document.createElement('button'); bBtn.className='btn-execute'; bBtn.innerText='🔥 INITIATE MASTER HACK 🔥'; bBtn.style.background='#ff0000'; bBtn.style.color='#fff'; bBtn.style.borderColor='#fff';
                bBtn.onclick = () => {
                    let allSwitchesOn = Array.from(bWrap.children).every(s=>s.classList.contains('active'));
                    if(allSwitchesOn && bInp.value.trim().toUpperCase() === p.ans) this.winInteractive(); else this.failRoom();
                };
                innerStage.append(bWrap, bInp, bBtn);
                break;

            default:
                createInputBlock('ENTER DECODE SEQUENCE...', p.ans || '');
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
