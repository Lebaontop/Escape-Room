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
            gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
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
            if(e.target.tagName==='BUTTON' || e.target.classList.contains('box-lux') || e.target.classList.contains('switch-lux') || e.target.classList.contains('valve-lux') || e.target.classList.contains('wire-lux') || e.target.classList.contains('flip-card') || e.target.closest('.channel-card')){ 
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
            
            // توزيع الألعاب على الواجهات الفخمة (لا يوجد أزرار عشوائية بعد الآن)
            if(i===1) { m.uiType = 'WIRES'; m.desc="اقطع 3 أسلاك محددة. (الأول ذهبي؟ اقطع الثالث الأسود)."; m.data=['#D4AF37','#ff3333','#333','#fff','#D4AF37','#00ccff','#333','#ff3333']; m.ans=[2,5,7]; m.hint="💡 تفاعلي: الأسود الأول، الأزرق، ثم الأحمر الأخير. | 📝 كتابي: يعتم كلما زاد (الظلام)."; }
            else if(i===2) { m.uiType = 'SIMON'; m.desc="تتبع الأنماط: 3 جولات متتالية (4 ومضات، 6، 8)."; m.data=16; m.hint="💡 تفاعلي: ركز ووجهني بالترتيب الصحيح فوراً. | 📝 كتابي: يذوب في الحرارة (الثلج)."; }
            else if(i===3) { m.uiType = 'INPUT'; m.desc="خزنة الألوان: أدخل 4 أرقام ديجيتال."; m.ans='3719'; m.hint="💡 تفاعلي: الكود هو 3719. | 📝 كتابي: لا يمكنك البوح به (السر)."; }
            else if(i===4) { m.uiType = 'MATCH'; m.desc="تطابق الأشكال: 20 شريحة، طابق 10 أزواج."; m.data=['Ω','Δ','Ψ','Σ','Φ','Θ','Λ','Ξ','Π','Γ']; m.hint="💡 تفاعلي: احفظ الأماكن ووجهني. | 📝 كتابي: يزيد ولا ينقص (العمر)."; }
            else if(i===5) { m.uiType = 'SLIDERS'; m.desc="اضبط المؤشرات لتطابق الموجة (75, 40, 90, 20)."; m.data=[{label:'FREQ',max:100},{label:'AMP',max:100},{label:'PITCH',max:100},{label:'BASS',max:100}]; m.ans=[75,40,90,20]; m.hint="💡 تفاعلي: 75، 40، 90، 20. | 📝 كتابي: يرتد لك من الجدار (الصدى)."; }
            else if(i===6) { m.uiType = 'VALVES'; m.desc="ارفع الضغط لـ 150 PSI بالضبط."; m.data=[20,40,-10,50,30]; m.target=150; m.hint="💡 تفاعلي: اضغط 50 مرتين، 30، 20. | 📝 كتابي: يمتص السوائل (الاسفنج)."; }
            else if(i===7) { m.uiType = 'SWITCHES'; m.desc="البندول: اضبط القواطع للأسفل تماماً (180)."; m.data=[1,1,1]; m.ans=[0,1,2]; m.target='LOGIC'; m.hint="💡 تفاعلي: شغلها كلها. | 📝 كتابي: يأتي غداً (المستقبل)."; }
            else if(i===8) { m.uiType = 'GRID'; m.desc="حدد إحداثيات النقطة في المنتصف."; m.data=25; m.ans=12; m.hint="💡 تفاعلي: الخلية رقم 13 (المنتصف تماماً). | 📝 كتابي: تقطعه لتفي به (الوعد)."; }
            else if(i===9) { m.uiType = 'SWITCHES'; m.desc="الدوائر المنطقية: (A AND B) OR C = 1."; m.data=[1,1,1,1,1]; m.ans=[0,1,2]; m.target='LOGIC'; m.hint="💡 تفاعلي: شغل أول ثلاثة قواطع. | 📝 كتابي: لغته السكوت (الصمت)."; }
            else if(i===10) { m.uiType = 'GRID'; m.desc="التروس الميكانيكية: اختر التروس المتطابقة."; m.data=16; m.ans=5; m.hint="💡 تفاعلي: الصف الثاني، الثاني. | 📝 كتابي: قشرتها هشة (البيضة)."; }
            else if(i===11) { m.uiType = 'INPUT'; m.desc="ترجم النبضات الضوئية واكتب الكود."; m.ans='SOS'; m.hint="💡 تفاعلي: الكلمة هي SOS. | 📝 كتابي: تنشفك وتتبلل (المنشفة)."; }
            else if(i===12) { m.uiType = 'GRID'; m.desc="اختر مسار مجموعه 100."; m.data=9; m.ans=4; m.hint="💡 تفاعلي: السيرفر في المنتصف. | 📝 كتابي: ترسم العالم (الخريطة)."; }
            else if(i===13) { m.uiType = 'VALVES'; m.desc="اختر أوزان مجموعها 140g."; m.data=[40,60,80,20,50]; m.target=140; m.hint="💡 تفاعلي: 60 + 80. | 📝 كتابي: تعرف بها الوقت (الساعة)."; }
            else if(i===14) { m.uiType = 'SLIDERS'; m.desc="ادمج الألوان للوصول للذهبي (R:212, G:175)."; m.data=[{label:'RED',max:255},{label:'GREEN',max:255}]; m.ans=[212, 175]; m.hint="💡 تفاعلي: الأحمر 212 والأخضر 175. | 📝 كتابي: يمطر (السحاب)."; }
            else if(i===15) { m.uiType = 'GRID'; m.desc="المتاهة العمياء: وجهني بالأسهم الصحيحة."; m.data=16; m.ans=10; m.hint="💡 تفاعلي: الخلية قبل الأخيرة يمين. | 📝 كتابي: صيفي ولذيذ (البطيخ)."; }
            else if(i===16) { m.uiType = 'VALVES'; m.desc="احصل على 4 لتر من دوارق (8, 5, 3)."; m.data=[8,5,-3,-1]; m.target=4; m.hint="💡 تفاعلي: استخدم الـ 5 والـ (-1). | 📝 كتابي: يثبت الأشياء (المسمار)."; }
            else if(i===17) { m.uiType = 'INPUT'; m.desc="تشفير قيصر: أزح كلمة ABC بمقدار +3."; m.ans='DEF'; m.hint="💡 تفاعلي: الكلمة هي DEF. | 📝 كتابي: أداة الكتابة (القلم)."; }
            else if(i===18) { m.uiType = 'INPUT'; m.desc="استرجاع الباركود: استنتج الـ 4 أرقام (2,4,8,?)."; m.ans='0016'; m.hint="💡 تفاعلي: الرقم هو 0016. | 📝 كتابي: يتبعك بالشمس (الظل)."; }
            else if(i===19) { m.uiType = 'SLIDERS'; m.desc="اختراق التردد: ابحث عن التردد الصافي."; m.data=[{label:'FM TUNE',max:200}]; m.ans=[199]; m.hint="💡 تفاعلي: التردد 199. | 📝 كتابي: تدل على الشمال (البوصلة)."; }
            else if(i===20) { m.uiType = 'SIMON'; m.desc="الخلايا الشمسية: أطفئ جميع المصابيح."; m.data=9; m.hint="💡 تفاعلي: انقر على الزوايا ثم المنتصف. | 📝 كتابي: لا تُرى (الريح)."; }
            else if(i===21) { m.uiType = 'GRID'; m.desc="الشذوذ البصري: ابحث عن الشعار المقلوب."; m.data=25; m.ans=18; m.hint="💡 تفاعلي: الصف الرابع، الثالث. | 📝 كتابي: تخاف من الماء (النار)."; }
            else if(i===22) { m.uiType = 'INPUT'; m.desc="التسلسل الجيني: أكمل الشريط (A=T، و C=G)."; m.ans='TGCA'; m.hint="💡 تفاعلي: أكتب TGCA. | 📝 كتابي: تكبر كلما أخذت منها (الحفرة)."; }
            else if(i===23) { m.uiType = 'SWITCHES'; m.desc="الصمامات المخفية: اضغط الأزرار الفردية."; m.data=[1,1,1,1,1]; m.ans=[0,2,4]; m.target='LOGIC'; m.hint="💡 تفاعلي: الأول والثالث والخامس. | 📝 كتابي: يقرصك ببطنك (الجوع)."; }
            else if(i===24) { m.uiType = 'INPUT'; m.desc="اللوحة المنزلقة: رتب الأرقام من 1 إلى 3."; m.ans='123'; m.hint="💡 تفاعلي: اكتب 123. | 📝 كتابي: ينادونك به (الاسم)."; }
            else if(i===25) { m.uiType = 'INPUT'; m.desc="المربع السحري: الرقم الناقص في المنتصف ليصبح المجموع 15."; m.ans='5'; m.hint="💡 تفاعلي: الرقم هو 5. | 📝 كتابي: تتركها وراءك (الخطوة)."; }
            else if(i===26) { m.uiType = 'GRID'; m.desc="الحركة الكاذبة: حدد الكوب الذهبي الذي يحتوي المفتاح."; m.data=3; m.ans=1; m.hint="💡 تفاعلي: الكوب اللي في المنتصف. | 📝 كتابي: قطرات من السماء (المطر)."; }
            else if(i===27) { m.uiType = 'INPUT'; m.desc="التحليل الحراري: الكيبورد محترق. ما الرقم السري؟"; m.ans='8491'; m.hint="💡 تفاعلي: 8491. | 📝 كتابي: افتح يا... (سمسم)."; }
            else if(i===28) { m.uiType = 'INPUT'; m.desc="تشفير الخادم: الكلمة العكسية (RALOS)."; m.ans='SOLAR'; m.hint="💡 تفاعلي: SOLAR. | 📝 كتابي: مدينة تاريخية (العلا)."; }
            else if(i===29) { m.uiType = 'INPUT'; m.desc="التشفير المزدوج: ادمج 10 + 20 واضرب في 2."; m.ans='60'; m.hint="💡 تفاعلي: النتيجة 60. | 📝 كتابي: تذوب (الشمعة)."; }
            else if(i===30) { m.uiType = 'INPUT'; m.desc="MASTER BREACH: شغل كل المفاتيح واكتب (GOLDEN)."; m.ans='GOLDEN'; m.hint="💡 تفاعلي: فعلها كلها واكتب GOLDEN | 📝 كتابي: معدن أصفر نفيس (الذهب)."; }

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

    // المُولد البصري الفخم والمخصص (بدون أزرار Fallback ميتة)
    setupStage() {
        const p = this.activeGate;
        document.getElementById('int-desc').innerText = p.desc;
        const stage = document.getElementById('interactive-stage');
        
        // بناء الغلاف الفخم للغز
        stage.innerHTML = `<div class="lux-panel" id="lux-inner-stage"></div>`;
        const innerStage = document.getElementById('lux-inner-stage');
        this.stageState = { clicks: 0, arr: [], val: 0, attempts: 0 };

        const generateSubmitButton = (callback) => {
            let btn = document.createElement('button'); btn.className = 'btn-lux'; btn.innerText = 'تنفيذ الأمر (Execute)'; btn.style.marginTop = '20px';
            btn.onclick = callback; return btn;
        }

        switch(p.uiType) {
            case 'INPUT':
                let iWrap = document.createElement('div'); iWrap.style.cssText = 'width:100%; display:flex; flex-direction:column; align-items:center;';
                let inp = document.createElement('input'); inp.type = 'text'; inp.className = 'cyber-input-lg'; inp.placeholder = 'أدخل الكود...';
                iWrap.append(inp, generateSubmitButton(() => { if(inp.value.trim().toUpperCase() === p.ans) this.winInteractive(); else this.failRoom(); }));
                innerStage.appendChild(iWrap);
                break;
                
            case 'SLIDERS':
                let sWrap = document.createElement('div'); sWrap.style.cssText = 'width:100%; display:flex; flex-direction:column; align-items:center;';
                let sDisplay = document.createElement('div'); sDisplay.className = 'cyber-display'; sDisplay.innerText = '000'; sWrap.appendChild(sDisplay);
                let sliders = [];
                p.data.forEach(d => {
                    let r = document.createElement('div'); r.className = 'cyber-slider-wrap';
                    r.innerHTML = `<span class="cyber-slider-label">${d.label}</span>`;
                    let s = document.createElement('input'); s.type = 'range'; s.min = 0; s.max = d.max; s.value = 0; s.className = 'cyber-slider-lux';
                    s.oninput = (e) => { sDisplay.innerText = Math.floor((parseInt(sInputs[0].value) + (sInputs[1] ? parseInt(sInputs[1].value) : 0)) / (sInputs.length)).toString().padStart(3,'0'); };
                    r.appendChild(s); sWrap.appendChild(r); sliders.push(s);
                });
                let sInputs = sliders;
                sWrap.appendChild(generateSubmitButton(() => {
                    let vals = sInputs.map(i => parseInt(i.value));
                    let correct = vals.every((v, idx) => Math.abs(v - p.ans[idx]) <= (p.data[idx].max * 0.05));
                    if(correct) this.winInteractive(); else this.failRoom();
                }));
                innerStage.appendChild(sWrap);
                break;

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

            case 'VALVES':
                let vWrap = document.createElement('div'); vWrap.style.cssText = 'width:100%; display:flex; flex-direction:column; align-items:center;';
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

            case 'SIMON':
                let smGrid = document.createElement('div'); smGrid.className = 'grid-lux'; smGrid.style.gridTemplateColumns = `repeat(${Math.ceil(Math.sqrt(p.data))}, 80px)`;
                let boxes = [];
                for(let i=0; i<p.data; i++) {
                    let b = document.createElement('div'); b.className = 'box-lux'; b.style.width='80px'; b.style.height='80px'; b.innerText = i+1;
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

            case 'GRID':
                let gWrap = document.createElement('div'); gWrap.className = 'grid-lux'; gWrap.style.gridTemplateColumns = `repeat(${Math.ceil(Math.sqrt(p.data))}, 70px)`;
                for(let i=0; i<p.data; i++) {
                    let cell = document.createElement('div'); cell.className = 'box-lux'; cell.style.width='70px'; cell.style.height='70px'; cell.innerText = i;
                    cell.onclick = () => { if(i === p.ans) this.winInteractive(); else this.failRoom(); };
                    gWrap.appendChild(cell);
                }
                innerStage.appendChild(gWrap);
                break;

            case 'MATCH':
                let crdGrid = document.createElement('div'); crdGrid.style.cssText = 'display:grid; grid-template-columns:repeat(5, 80px); gap:15px;';
                let symbols = [...p.data, ...p.data].sort(() => Math.random() - 0.5);
                let flipped = [];
                symbols.forEach((sym) => {
                    let card = document.createElement('div'); card.className = 'flip-card';
                    card.innerHTML = `<div class="flip-card-inner"><div class="flip-front">?</div><div class="flip-back">${sym}</div></div>`;
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
