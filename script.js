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
            if(e.target.tagName==='BUTTON' || e.target.classList.contains('box-lux') || e.target.classList.contains('switch-lux') || e.target.classList.contains('valve-lux') || e.target.classList.contains('wire-lux') || e.target.classList.contains('flip-card') || e.target.classList.contains('gear-lux') || e.target.closest('.channel-card')){ 
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
            
            // تخصيص الألعاب الـ 30 بشكل فردي تماماً وبدون أي عشوائية
            if(i===1) { m.uiType = 'WIRES'; m.desc="اقطع 3 أسلاك محددة. (الأول ذهبي؟ اقطع الثالث الأسود)."; m.data=['#D4AF37','#ff3333','#333','#fff','#D4AF37','#00ccff','#333','#ff3333']; m.ans=[2,5,7]; m.hint="💡 تفاعلي: الأسود الأول، الأزرق، ثم الأحمر الأخير. | 📝 كتابي: يعتم كلما زاد (الظلام)."; }
            else if(i===2) { m.uiType = 'SIMON'; m.desc="تتبع الأنماط: 3 جولات متتالية (4 ومضات، 6، 8)."; m.data=16; m.hint="💡 تفاعلي: ركز ووجهني بالترتيب الصحيح فوراً. | 📝 كتابي: يذوب في الحرارة (الثلج)."; }
            else if(i===3) { m.uiType = 'MASTERMIND'; m.desc="خزنة الألوان: أدخل 4 أرقام (أخضر=صح، برتقالي=مكان غلط)."; m.ans=[3,7,1,9]; m.hint="💡 تفاعلي: الكود هو 3719. | 📝 كتابي: لا يمكنك البوح به (السر)."; }
            else if(i===4) { m.uiType = 'MATCH'; m.desc="تطابق الأشكال: 20 شريحة، طابق 10 أزواج."; m.data=['🦁','🐯','🦊','🐻','🐼','🐨','🐰','🐸','🐙','🐵']; m.hint="💡 تفاعلي: احفظ الأماكن ووجهني. | 📝 كتابي: يزيد ولا ينقص (العمر)."; }
            else if(i===5) { m.uiType = 'SLIDERS'; m.desc="قم بموازنة المؤشرات لتطابق الموجة (75, 40, 90, 20)."; m.data=[{label:'FREQ',max:100},{label:'AMP',max:100},{label:'PITCH',max:100},{label:'BASS',max:100}]; m.ans=[75,40,90,20]; m.hint="💡 تفاعلي: 75، 40، 90، 20. | 📝 كتابي: يرتد لك من الجدار (الصدى)."; }
            else if(i===6) { m.uiType = 'VALVES'; m.desc="ارفع الضغط لـ 150 PSI بالضبط."; m.data=[20,40,-10,50,30]; m.target=150; m.hint="💡 تفاعلي: اضغط 50 مرتين، 30، 20. | 📝 كتابي: يمتص السوائل (الاسفنج)."; }
            else if(i===7) { m.uiType = 'SWITCH_TOGGLE'; m.desc="دوائر الطاقة: كل زر يعكس حالة اللي جنبه. شغلها كلها."; m.data=4; m.hint="💡 تفاعلي: جرب الأطراف أولاً. | 📝 كتابي: يأتي غداً (المستقبل)."; }
            else if(i===8) { m.uiType = 'FLASH_RADAR'; m.desc="رادار الاختراق: راقب الشاشة، حدد موقع الوميض السريع."; m.data=25; m.ans=12; m.hint="💡 تفاعلي: الخلية رقم 13 (المنتصف تماماً). | 📝 كتابي: تقطعه لتفي به (الوعد)."; }
            else if(i===9) { m.uiType = 'KEYPAD_3X3'; m.desc="أدخل التسلسل (7-3-9)."; m.ans=[6,2,8]; m.hint="💡 تفاعلي: 7 ثم 3 ثم 9. | 📝 كتابي: لغته السكوت (الصمت)."; }
            else if(i===10) { m.uiType = 'GEARS'; m.desc="التروس الدوارة: قم بتدوير جميع التروس لتصبح بوضع عمودي (0)."; m.data=[90, 180, 270]; m.ans=[0,0,0]; m.hint="💡 تفاعلي: دورها لين تتطابق الأسنان فووق. | 📝 كتابي: قشرتها هشة (البيضة)."; }
            else if(i===11) { m.uiType = 'MORSE'; m.desc="شفرة مورس: راقب اللمبة واكتب الكلمة."; m.ans='SOS'; m.hint="💡 تفاعلي: الكلمة هي SOS. | 📝 كتابي: تنشفك وتتبلل (المنشفة)."; }
            else if(i===12) { m.uiType = 'HEX_PATH'; m.desc="اربط الخلايا من البداية للنهاية."; m.data=9; m.hint="💡 تفاعلي: خذ المسار الأوسط. | 📝 كتابي: ترسم العالم (الخريطة)."; }
            else if(i===13) { m.uiType = 'SCALES'; m.desc="الميزان: اختر أوزان مجموعها 140g."; m.data=[40,60,80,20,50]; m.target=140; m.hint="💡 تفاعلي: 60 + 80. | 📝 كتابي: تعرف بها الوقت (الساعة)."; }
            else if(i===14) { m.uiType = 'COLOR_MIX'; m.desc="دمج الألوان: R:212, G:175."; m.data=[{label:'R',max:255},{label:'G',max:255}]; m.ans=[212, 175]; m.hint="💡 تفاعلي: الأحمر 212 والأخضر 175. | 📝 كتابي: يمطر (السحاب)."; }
            else if(i===15) { m.uiType = 'DPAD_MAZE'; m.desc="توجيه أعمى: ⬆️ ⬇️ ⬅️ ➡️."; m.ans=[1,1,3,3,1]; m.hint="💡 تفاعلي: تحت، تحت، يمين، يمين، تحت. | 📝 كتابي: صيفي ولذيذ (البطيخ)."; }
            else if(i===16) { m.uiType = 'JUGS'; m.desc="دوارق السوائل: انقل السوائل لتصل لـ 4 لتر."; m.data=[8,5,3]; m.hint="💡 تفاعلي: انقل من الـ 5 للـ 3 مرات. | 📝 كتابي: يثبت الأشياء (المسمار)."; }
            else if(i===17) { m.uiType = 'CRYPTEX_WHEEL'; m.desc="عجلات الكريبتكس: أزح كلمة ABC بمقدار +3."; m.ans='DEF'; m.hint="💡 تفاعلي: الكلمة هي DEF. | 📝 كتابي: أداة الكتابة (القلم)."; }
            else if(i===18) { m.uiType = 'BARCODE_SCAN'; m.desc="أوقف الليزر عند الخط التالف."; m.ans=4; m.hint="💡 تفاعلي: الخط الخامس من فوق. | 📝 كتابي: يتبعك بالشمس (الظل)."; }
            else if(i===19) { m.uiType = 'RADIO_DIAL'; m.desc="اختراق التردد: ابحث عن التردد الصافي (199)."; m.ans=199; m.hint="💡 تفاعلي: التردد 199. | 📝 كتابي: تدل على الشمال (البوصلة)."; }
            else if(i===20) { m.uiType = 'LIGHTS_OUT'; m.desc="إطفاء الأنوار: أطفئ جميع المصابيح."; m.data=9; m.hint="💡 تفاعلي: انقر على الزوايا ثم المنتصف. | 📝 كتابي: لا تُرى (الريح)."; }
            else if(i===21) { m.uiType = 'ANOMALY'; m.desc="الشذوذ: ابحث عن الشعار المختلف."; m.data=25; m.ans=18; m.hint="💡 تفاعلي: الصف الرابع، الثالث. | 📝 كتابي: تخاف من الماء (النار)."; }
            else if(i===22) { m.uiType = 'DNA'; m.desc="شريط الـ DNA: A=T، و C=G."; m.ans='TGCA'; m.hint="💡 تفاعلي: أكتب TGCA. | 📝 كتابي: تكبر كلما أخذت منها (الحفرة)."; }
            else if(i===23) { m.uiType = 'CABLES'; m.desc="توصيل الكيابل: اربط اليسار باليمين حسب الترتيب."; m.hint="💡 تفاعلي: الأول بالثاني، الثاني بالأول. | 📝 كتابي: يقرصك ببطنك (الجوع)."; }
            else if(i===24) { m.uiType = 'SLIDING_IMG'; m.desc="لغز الصور: رتب الأرقام 1-8."; m.ans='12345678'; m.hint="💡 تفاعلي: رتبها تصاعدياً. | 📝 كتابي: ينادونك به (الاسم)."; }
            else if(i===25) { m.uiType = 'MAGIC_SQUARE'; m.desc="المربع السحري: مجموع الأطراف = 15."; m.ans='5'; m.hint="💡 تفاعلي: المنتصف هو 5. | 📝 كتابي: تتركها وراءك (الخطوة)."; }
            else if(i===26) { m.uiType = 'SHELLS'; m.desc="الأكواب: تتبع الكوب اللي تحته الكوين."; m.ans=1; m.hint="💡 تفاعلي: الكوب الأوسط. | 📝 كتابي: قطرات من السماء (المطر)."; }
            else if(i===27) { m.uiType = 'HEATMAP'; m.desc="البصمة الحرارية: من الأسخن للأبرد."; m.ans='8491'; m.hint="💡 تفاعلي: 8491. | 📝 كتابي: افتح يا... (سمسم)."; }
            else if(i===28) { m.uiType = 'MATRIX'; m.desc="النص المشفر: أوقف النص لتقرأ الكلمة."; m.ans='SOLAR'; m.hint="💡 تفاعلي: SOLAR. | 📝 كتابي: مدينة تاريخية (العلا)."; }
            else if(i===29) { m.uiType = 'ELEVATOR'; m.desc="مصعد الهروب: اضغط الأدوار 3، 1، 5."; m.ans=[2,0,4]; m.hint="💡 تفاعلي: الدور 3 ثم 1 ثم 5. | 📝 كتابي: تذوب (الشمعة)."; }
            else if(i===30) { m.uiType = 'BOSS'; m.desc="MASTER BREACH: شغل كل المفاتيح واكتب (GOLDEN)."; m.ans='GOLDEN'; m.hint="💡 تفاعلي: فعلها كلها واكتب GOLDEN | 📝 كتابي: معدن أصفر نفيس (الذهب)."; }

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

    // هنا يتم بناء الـ 30 لعبة بشكل مختلف ومستقل تماماً (المحرك الجبار)
    setupStage() {
        const p = this.activeGate;
        document.getElementById('int-desc').innerText = p.desc;
        const stage = document.getElementById('interactive-stage');
        
        stage.innerHTML = `<div class="lux-panel" id="lux-inner-stage"></div>`;
        const innerStage = document.getElementById('lux-inner-stage');
        this.stageState = { clicks: 0, arr: [], val: 0, attempts: 0 };

        const generateSubmitButton = (callback) => {
            let btn = document.createElement('button'); btn.className = 'btn-lux'; btn.innerText = 'تنفيذ الأمر (Execute)'; 
            btn.onclick = callback; return btn;
        }

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
            case 'SIMON_ROUNDS':
                let smGrid = document.createElement('div'); smGrid.className = 'grid-lux'; smGrid.style.gridTemplateColumns = `repeat(4, 80px)`;
                let boxes = [];
                for(let i=0; i<16; i++) {
                    let b = document.createElement('div'); b.className = 'box-lux'; b.style.width='80px'; b.style.height='80px'; b.style.color='transparent';
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
                    this.stageState.sequence = Array.from({length: count}, () => Math.floor(Math.random() * 16));
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
                let btn = document.createElement('button'); btn.className='btn-lux'; btn.innerText='Check Code'; btn.style.width='300px';
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

            case 'SLIDERS':
                let sWrap = document.createElement('div'); sWrap.style.cssText = 'width:100%; display:flex; flex-direction:column; align-items:center; gap:10px;';
                let sDisplay = document.createElement('div'); sDisplay.className = 'cyber-display'; sDisplay.innerText = '000'; sWrap.appendChild(sDisplay);
                let sliders = [];
                p.data.forEach(d => {
                    let r = document.createElement('div'); r.className = 'cyber-slider-wrap';
                    r.innerHTML = `<span class="cyber-slider-label">${d.label}</span>`;
                    let s = document.createElement('input'); s.type = 'range'; s.min = 0; s.max = d.max; s.value = 0; s.className = 'cyber-slider-lux';
                    s.oninput = () => { sDisplay.innerText = Math.floor(sliders.reduce((a,b)=>a+parseInt(b.value),0)/sliders.length).toString().padStart(3,'0'); };
                    r.appendChild(s); sWrap.appendChild(r); sliders.push(s);
                });
                sWrap.appendChild(generateSubmitButton(() => {
                    let vals = sliders.map(i => parseInt(i.value));
                    let correct = vals.every((v, idx) => Math.abs(v - p.ans[idx]) <= (p.data[idx].max * 0.05));
                    if(correct) this.winInteractive(); else this.failRoom();
                }));
                innerStage.appendChild(sWrap);
                break;

            case 'VALVES':
                let vWrap = document.createElement('div'); vWrap.style.cssText = 'width:100%; display:flex; flex-direction:column; align-items:center; gap:20px;';
                let vGauge = document.createElement('div'); vGauge.className = 'cyber-display'; vGauge.innerText = '0 PSI'; vWrap.appendChild(vGauge);
                let vRow = document.createElement('div'); vRow.style.cssText = 'display:flex; gap:15px; flex-wrap:wrap; justify-content:center;';
                p.data.forEach(val => {
                    let v = document.createElement('div'); v.className = 'valve-lux'; v.innerText = (val>0?'+':'')+val;
                    v.onclick = () => {
                        this.stageState.val += val; vGauge.innerText = `${this.stageState.val} PSI`;
                        if(this.stageState.val === p.target) { setTimeout(()=>this.winInteractive(), 300); }
                        else if(this.stageState.val > 250 || this.stageState.val < -50) { this.failRoom(); this.setupStage(); }
                    };
                    vRow.appendChild(v);
                });
                vWrap.appendChild(vRow); innerStage.appendChild(vWrap);
                break;

            case 'SWITCH_TOGGLE':
                let stWrap = document.createElement('div'); stWrap.style.cssText = 'display:flex; gap:20px; flex-wrap:wrap; justify-content:center;';
                let stSwitches = [];
                for(let i=0; i<p.data; i++) {
                    let sw = document.createElement('div'); sw.className = 'switch-lux'; sw.innerText = 'OFF';
                    sw.onclick = () => {
                        const toggle = (btn) => { btn.classList.toggle('active'); btn.innerText = btn.classList.contains('active') ? 'ON' : 'OFF'; };
                        toggle(sw);
                        if(i>0) toggle(stSwitches[i-1]);
                        if(i<p.data-1) toggle(stSwitches[i+1]);
                        if(stSwitches.every(b => b.classList.contains('active'))) setTimeout(()=>this.winInteractive(), 300);
                    };
                    stSwitches.push(sw); stWrap.appendChild(sw);
                }
                innerStage.appendChild(stWrap);
                break;

            case 'SWITCHES':
                let swWrap = document.createElement('div'); swWrap.style.cssText = 'display:flex; gap:20px; flex-wrap:wrap; justify-content:center;';
                p.data.forEach((val, i) => {
                    let sw = document.createElement('div'); sw.className = 'switch-lux'; sw.innerText = 'OFF';
                    sw.onclick = () => {
                        sw.classList.toggle('active'); sw.innerText = sw.classList.contains('active') ? 'ON' : 'OFF';
                        let actives = Array.from(swWrap.children).map((x,idx)=>x.classList.contains('active')?idx:-1).filter(x=>x!==-1);
                        if(p.target === 'LOGIC') {
                            if(actives.length === p.ans.length && p.ans.every(a => actives.includes(a))) { setTimeout(()=>this.winInteractive(), 300); }
                        }
                    };
                    swWrap.appendChild(sw);
                });
                innerStage.appendChild(swWrap);
                break;

            case 'FLASH_RADAR':
            case 'RADAR':
            case 'ANOMALY':
            case 'GRID':
                let rCount = (typeof p.data === 'object') ? p.data.count : (p.data || 25);
                let gWrap = document.createElement('div'); gWrap.className = 'grid-lux'; gWrap.style.gridTemplateColumns = `repeat(${Math.ceil(Math.sqrt(rCount))}, 60px)`;
                let cells = [];
                for(let i=0; i<rCount; i++) {
                    let cell = document.createElement('div'); cell.className = 'box-lux'; cell.style.width='60px'; cell.style.height='60px'; 
                    if(p.uiType === 'ANOMALY') { cell.innerText = (i===p.ans) ? '☀' : '⚙️'; }
                    cell.onclick = () => { if(i === p.ans) this.winInteractive(); else this.failRoom(); };
                    gWrap.appendChild(cell); cells.push(cell);
                }
                innerStage.appendChild(gWrap);
                
                if(p.uiType === 'FLASH_RADAR') {
                    setInterval(() => {
                        cells[p.ans].style.background = '#ff3333';
                        setTimeout(()=>cells[p.ans].style.background = '#050505', 200);
                    }, 3000);
                }
                break;

            case 'KEYPAD_3X3':
                let kWrap = document.createElement('div'); kWrap.className = 'grid-lux'; kWrap.style.gridTemplateColumns = `repeat(3, 80px)`;
                let kDisp = document.createElement('div'); kDisp.className='cyber-display'; kDisp.style.gridColumn='span 3'; kDisp.innerText='_ _ _'; kWrap.appendChild(kDisp);
                let padNums = [1,2,3,4,5,6,7,8,9];
                padNums.forEach((n, idx) => {
                    let btn = document.createElement('div'); btn.className = 'box-lux'; btn.style.width='80px'; btn.style.height='80px'; btn.innerText = n;
                    btn.onclick = () => {
                        if(p.ans[this.stageState.clicks] === idx) {
                            this.stageState.val = (this.stageState.val || '') + n;
                            kDisp.innerText = this.stageState.val.padEnd(3,'_');
                            this.stageState.clicks++;
                            if(this.stageState.clicks === p.ans.length) setTimeout(()=>this.winInteractive(), 300);
                        } else { this.failRoom(); this.setupStage(); }
                    };
                    kWrap.appendChild(btn);
                });
                innerStage.appendChild(kWrap);
                break;

            case 'GEARS':
            case 'DIALS':
                let dWrap = document.createElement('div'); dWrap.style.cssText = 'display:flex; gap:20px;';
                let isGear = p.uiType === 'GEARS';
                this.stageState.arr = Array(p.data.length || p.data).fill(isGear ? Math.floor(Math.random()*360) : 0);
                for(let i=0; i<(p.data.length || p.data); i++) {
                    let d = document.createElement('div'); 
                    if(isGear) {
                        d.className = 'gear-lux'; d.innerText = '⚙️';
                    } else {
                        d.className = 'dial-base';
                        let tick = document.createElement('div'); tick.className = 'dial-tick'; d.appendChild(tick);
                    }
                    d.style.transform = `rotate(${this.stageState.arr[i]}deg)`;
                    d.onclick = () => {
                        this.stageState.arr[i] = (this.stageState.arr[i] + 45) % 360;
                        d.style.transform = `rotate(${this.stageState.arr[i]}deg)`;
                        if(this.stageState.arr.every((v,idx) => v === (p.ans[idx] || 0))) setTimeout(()=>this.winInteractive(), 300);
                    };
                    dWrap.appendChild(d);
                }
                innerStage.appendChild(dWrap);
                break;

            case 'MORSE':
                let mBulb = document.createElement('div'); mBulb.className = 'bulb-lux'; innerStage.appendChild(mBulb);
                let mInp = document.createElement('input'); mInp.type='text'; mInp.className='cyber-input-lg'; mInp.placeholder='DECODE...';
                innerStage.append(mInp, generateSubmitButton(()=>{ if(mInp.value.toUpperCase()===p.ans) this.winInteractive(); else this.failRoom(); }));
                const flash = (duration) => { mBulb.classList.add('flash'); setTimeout(()=>mBulb.classList.remove('flash'), duration); }
                let pattern = [200,200,200, 600,600,600, 200,200,200]; // SOS
                let mStep = 0;
                setInterval(() => {
                    flash(pattern[mStep]); mStep++;
                    if(mStep >= pattern.length) mStep=0;
                }, 1000);
                break;

            case 'WEIGHTS':
                let wgtWrap = document.createElement('div'); wgtWrap.style.cssText = 'display:flex; gap:15px; flex-wrap:wrap; justify-content:center;';
                p.data.forEach((w, i) => {
                    let box = document.createElement('div'); box.className = 'cyber-weight'; box.innerText = w+'g';
                    box.onclick = () => {
                        box.classList.toggle('active');
                        let sum = Array.from(wgtWrap.children).reduce((acc, el, idx) => acc + (el.classList.contains('active') ? p.data[idx] : 0), 0);
                        if(sum === p.target) { setTimeout(()=>this.winInteractive(), 300); }
                    };
                    wgtWrap.appendChild(box);
                });
                innerStage.appendChild(wgtWrap);
                break;

            case 'INPUT':
            case 'RADIO_DIAL':
            case 'DNA':
            case 'MAGIC_SQUARE':
            case 'HEATMAP':
                let iWrap = document.createElement('div'); iWrap.style.cssText = 'width:100%; display:flex; flex-direction:column; align-items:center;';
                let inp = document.createElement('input'); inp.type = 'text'; inp.className = 'cyber-input-lg'; inp.placeholder = 'ENTER CODE...';
                iWrap.append(inp, generateSubmitButton(() => { if(inp.value.trim().toUpperCase() == p.ans) this.winInteractive(); else this.failRoom(); }));
                innerStage.appendChild(iWrap);
                break;
                
            case 'BOSS':
                let bWrap = document.createElement('div'); bWrap.style.display='flex'; bWrap.style.gap='20px'; bWrap.style.marginBottom='30px';
                for(let i=0; i<3; i++) { let sw = document.createElement('div'); sw.className='switch-lux'; sw.innerText='OFF'; sw.onclick=()=> { sw.classList.toggle('active'); sw.innerText = sw.classList.contains('active')?'ON':'OFF'; }; bWrap.appendChild(sw); }
                let bInp = document.createElement('input'); bInp.type='text'; bInp.className='cyber-input-lg'; bInp.placeholder='MASTER PASSWORD';
                let bBtn = document.createElement('button'); bBtn.className='btn-lux'; bBtn.innerText='🔥 INITIATE MASTER HACK 🔥'; bBtn.style.background='#ff0000'; bBtn.style.color='#fff'; bBtn.style.borderColor='#fff';
                bBtn.onclick = () => {
                    let allSwitchesOn = Array.from(bWrap.children).every(s=>s.classList.contains('active'));
                    if(allSwitchesOn && bInp.value.trim().toUpperCase() === p.ans) this.winInteractive(); else this.failRoom();
                };
                innerStage.append(bWrap, bInp, bBtn);
                break;
                
            default:
                // معالج احتياطي قوي يولد إدخال نصي في حال لم يتطابق النوع
                let fbWrap = document.createElement('div'); fbWrap.style.cssText = 'width:100%; display:flex; flex-direction:column; align-items:center;';
                let fInp = document.createElement('input'); fInp.type = 'text'; fInp.className = 'cyber-input-lg'; fInp.placeholder = 'BYPASS CODE...';
                fbWrap.append(fInp, generateSubmitButton(() => { if(fInp.value.trim().toUpperCase() == (p.ans||'')) this.winInteractive(); else this.failRoom(); }));
                innerStage.appendChild(fbWrap);
                break;
        }
    }

    winInteractive() {
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
        this.showToast('تم تخطي الروم من قبل الآدمن!');
        this.returnToLobby();
    }

    returnToLobby() { this.playSound('click'); this.switchScreen('lobby'); this.renderLobby(); }
}
const game = new SolarGamesEngine();
