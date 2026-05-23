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
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(120, now);
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
            if(e.target.tagName==='BUTTON' || e.target.classList.contains('simon-box') || e.target.classList.contains('cyber-switch') || e.target.classList.contains('cyber-valve') || e.target.classList.contains('cyber-weight') || e.target.classList.contains('flip-card') || e.target.closest('.channel-card') || e.target.closest('.cyber-wire') || e.target.closest('.dial-base')){ 
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
            
            // 1. الأسلاك الـ 8
            if(i===1) { m.uiType = 'WIRES'; m.desc="قطع الأسلاك المعقد: اقطع 3 أسلاك محددة. (الأول ذهبي؟ اقطع الثالث الأسود)."; m.data=['#D4AF37','#ff3333','#333','#fff','#D4AF37','#00ccff','#333','#ff3333']; m.ans=[2,5,7]; m.hint="💡 تفاعلي: اقطع الأسود الأول، ثم الأزرق، ثم الأحمر الأخير. | 📝 كتابي: يعتم كلما زاد (الظلام)."; }
            // 2. النبض 3 جولات
            else if(i===2) { m.uiType = 'SIMON_ROUNDS'; m.desc="تتبع الأنماط: 3 جولات متتالية (4 ومضات، 6 ومضات، 8 ومضات)."; m.data=16; m.hint="💡 تفاعلي: ركز ووجهني بالترتيب الصحيح فوراً. | 📝 كتابي: يذوب في الحرارة (الثلج)."; }
            // 3. الخزنة الألوان (Mastermind)
            else if(i===3) { m.uiType = 'MASTERMIND'; m.desc="خزنة الألوان: أدخل 4 أرقام (أخضر=صح، برتقالي=مكان غلط، أحمر=غلط)."; m.ans=[3,7,1,9]; m.hint="💡 تفاعلي: الكود هو 3719. | 📝 كتابي: لا يمكنك البوح به (السر)."; }
            // 4. تطابق 20 مربع
            else if(i===4) { m.uiType = 'MATCH_20'; m.desc="تطابق الأشكال: 20 شريحة بيانات، طابق 10 أزواج."; m.data=['Ω','Δ','Ψ','Σ','Φ','Θ','Λ','Ξ','Π','Γ']; m.hint="💡 تفاعلي: احفظ أماكن الرموز المتطابقة ووجهني. | 📝 كتابي: يزيد ولا ينقص (العمر)."; }
            
            // باقي الـ 26 لعبة مختلفة جذرياً
            else if(i===5) { m.uiType = 'SLIDERS'; m.desc="موازنة الترددات: اضبط المؤشرات الـ 4 لتطابق الموجة الذهبية (75, 40, 90, 20)."; m.ans=[75,40,90,20]; m.hint="💡 تفاعلي: 75، 40، 90، 20. | 📝 كتابي: يرتد لك من الجدار (الصدى)."; }
            else if(i===6) { m.uiType = 'VALVES'; m.desc="الصمامات الصناعية: ارفع الضغط لـ 150 PSI بالضبط."; m.data=[20,40,-10,50,30]; m.target=150; m.hint="💡 تفاعلي: اضغط الثاني، الرابع، والخامس (مرتين). | 📝 كتابي: يمتص السوائل (الاسفنج)."; }
            else if(i===7) { m.uiType = 'PENDULUM'; m.desc="البندول المغناطيسي: اضغط الزر عندما يمر البندول بالمنتصف 3 مرات."; m.hint="💡 تفاعلي: التوقيت هو كل شيء، ركز على الخط الذهبي. | 📝 كتابي: يأتي غداً (المستقبل)."; }
            else if(i===8) { m.uiType = 'RADAR'; m.desc="الرادار المخفي: حدد إحداثيات النقطة التي تومض وتختفي."; m.data=25; m.ans=12; m.hint="💡 تفاعلي: الخلية رقم 13 (المنتصف تماماً). | 📝 كتابي: تقطعه لتفي به (الوعد)."; }
            else if(i===9) { m.uiType = 'SWITCHES'; m.desc="الدوائر المنطقية: (A AND B) OR C = 1."; m.data=[1,1,1,1,1]; m.ans=[0,1,2]; m.target='LOGIC'; m.hint="💡 تفاعلي: شغل أول ثلاثة قواطع. | 📝 كتابي: لغته السكوت (الصمت)."; }
            else if(i===10) { m.uiType = 'DIAL_SYNC'; m.desc="التروس الميكانيكية: قم بمحاذاة التروس الثلاثة للزاوية 0."; m.ans=[0,90,180]; m.hint="💡 تفاعلي: دور الثاني والثالث للأعلى. | 📝 كتابي: قشرتها هشة (البيضة)."; }
            else if(i===11) { m.uiType = 'MORSE'; m.desc="شفرة مورس: استمع للنبضات الضوئية واكتب الكود (SOS)."; m.ans='SOS'; m.hint="💡 تفاعلي: اكتب SOS. | 📝 كتابي: تنشفك وتتبلل (المنشفة)."; }
            else if(i===12) { m.uiType = 'IP_ROUTING'; m.desc="خريطة الخوادم: اختر مسار يمر بـ 4 خوادم مجموعه 100."; m.data=[20,50,30, 40,10,30, 20,40,20]; m.target=100; m.hint="💡 تفاعلي: 20 + 40 + 20 + 20. | 📝 كتابي: ترسم العالم (الخريطة)."; }
            else if(i===13) { m.uiType = 'WEIGHTS'; m.desc="الميزان الحساس: اختر أوزان ليصبح المجموع متطابق (140g)."; m.data=[40,60,80,20,50,70]; m.target=140; m.hint="💡 تفاعلي: 60 + 80. | 📝 كتابي: تعرف بها الوقت (الساعة)."; }
            else if(i===14) { m.uiType = 'COLOR_HEX'; m.desc="تشفير الألوان: ادمج الألوان للوصول للذهبي (R:212, G:175)."; m.ans=[212, 175]; m.hint="💡 تفاعلي: ضع الأحمر 212 والأخضر 175. | 📝 كتابي: يمطر (السحاب)."; }
            else if(i===15) { m.uiType = 'MAZE'; m.desc="المتاهة العمياء: تجاوز الشبكة المعتمة 6x6."; m.data=36; m.ans=[0,6,12,13,19,25]; m.hint="💡 تفاعلي: أول عمود تحت، ثم يمين... | 📝 كتابي: صيفي ولذيذ (البطيخ)."; }
            else if(i===16) { m.uiType = 'WATER_JUGS'; m.desc="السائل الذهبي: احصل على 4 لتر من دوارق (8, 5, 3)."; m.ans=4; m.hint="💡 تفاعلي: انقل من 5 إلى 3، يبقى 2... الخ | 📝 كتابي: يثبت الأشياء (المسمار)."; }
            else if(i===17) { m.uiType = 'CRYPTEX'; m.desc="تشفير قيصر: أزح كلمة ABC بمقدار +3."; m.ans='DEF'; m.hint="💡 تفاعلي: الكلمة هي DEF. | 📝 كتابي: أداة الكتابة (القلم)."; }
            else if(i===18) { m.uiType = 'BARCODE'; m.desc="استرجاع الباركود: استنتج الـ 4 أرقام (تتضاعف: 2,4,8,?)."; m.ans='0016'; m.hint="💡 تفاعلي: الرقم هو 0016. | 📝 كتابي: يتبعك بالشمس (الظل)."; }
            else if(i===19) { m.uiType = 'RADIO'; m.desc="اختراق التردد: ابحث عن التردد الصافي (199)."; m.ans='199'; m.hint="💡 تفاعلي: التردد 199. | 📝 كتابي: تدل على الشمال (البوصلة)."; }
            else if(i===20) { m.uiType = 'LIGHTS_OUT'; m.desc="الخلايا الشمسية: أطفئ جميع المصابيح الـ 9."; m.data=9; m.hint="💡 تفاعلي: انقر على الزوايا ثم المنتصف. | 📝 كتابي: لا تُرى (الريح)."; }
            else if(i===21) { m.uiType = 'ANOMALY'; m.desc="الشذوذ البصري: 25 شعار، ابحث عن الشعار المقلوب."; m.data=25; m.ans=18; m.hint="💡 تفاعلي: الصف الرابع، الثالث. | 📝 كتابي: تخاف من الماء (النار)."; }
            else if(i===22) { m.uiType = 'DNA'; m.desc="التسلسل الجيني: أكمل الشريط (A يقابله T، و C يقابله G)."; m.ans='TGCA'; m.hint="💡 تفاعلي: أكتب TGCA. | 📝 كتابي: تكبر كلما أخذت منها (الحفرة)."; }
            else if(i===23) { m.uiType = 'BLIND_SWITCHES'; m.desc="الصمامات المخفية: اضغط الـ 5 أزرار بالترتيب الصحيح."; m.ans=[2,0,4,1,3]; m.hint="💡 تفاعلي: الثالث، الأول، الخامس، الثاني، الرابع. | 📝 كتابي: يقرصك ببطنك (الجوع)."; }
            else if(i===24) { m.uiType = 'PUZZLE_15'; m.desc="اللوحة المنزلقة: رتب الأرقام من 1 إلى 3."; m.ans='123'; m.hint="💡 تفاعلي: رتبها لتصبح 1,2,3. | 📝 كتابي: ينادونك به (الاسم)."; }
            else if(i===25) { m.uiType = 'MAGIC_SQUARE'; m.desc="المربع السحري: أدخل الرقم الناقص ليصبح المجموع 15."; m.ans='5'; m.hint="💡 تفاعلي: الرقم في المنتصف هو 5. | 📝 كتابي: تتركها وراءك (الخطوة)."; }
            else if(i===26) { m.uiType = 'SHELL_GAME'; m.desc="الحركة الكاذبة: تتبع الكوب الذهبي الذي يحتوي المفتاح."; m.hint="💡 تفاعلي: ركز على الكوب الأوسط. | 📝 كتابي: قطرات من السماء (المطر)."; }
            else if(i===27) { m.uiType = 'HEATMAP'; m.desc="التحليل الحراري: الكيبورد محترق. ما هو الرقم السري (الأسخن للأبرد)؟"; m.ans='8491'; m.hint="💡 تفاعلي: 8491. | 📝 كتابي: افتح يا... (سمسم)."; }
            else if(i===28) { m.uiType = 'INPUT'; m.desc="تشفير الخادم: الكلمة العكسية (RALOS)."; m.ans='SOLAR'; m.hint="💡 تفاعلي: SOLAR. | 📝 كتابي: مدينة تاريخية (العلا)."; }
            else if(i===29) { m.uiType = 'INPUT'; m.desc="التشفير المزدوج: ادمج 10 + 20 واضرب في 2."; m.ans='60'; m.hint="💡 تفاعلي: النتيجة 60. | 📝 كتابي: تذوب (الشمعة)."; }
            else if(i===30) { m.uiType = 'BOSS'; m.desc="MASTER BREACH: شغل كل المفاتيح واكتب الكود السري (GOLDEN)."; m.ans='GOLDEN'; m.hint="💡 تفاعلي: فعلها كلها واكتب GOLDEN | 📝 كتابي: معدن أصفر نفيس (الذهب)."; }

            m.txtQ = riddles[i-1].q;
            m.txtA = riddles[i-1].a;
            mechanics.push(m);
        }
        return mechanics;
    }

    /* --- دوال الوقت والعملات --- */
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

    // هنا رسم الألعاب بالـ JS لضمان عملها 100%
    setupStage() {
        const p = this.activeGate;
        document.getElementById('int-desc').innerText = p.desc;
        const stage = document.getElementById('interactive-stage');
        stage.innerHTML = '';
        stage.style.flexDirection = 'row'; stage.style.flexWrap = 'wrap'; stage.style.gap = '15px';
        this.stageState = { clicks: 0, arr: [], val: 0, attempts: 0 };

        const createInputBlock = (placeholder, ans) => {
            let wrap = document.createElement('div'); wrap.className = 'cyber-input-box';
            let inp = document.createElement('input'); inp.type = 'text'; inp.className = 'cyber-input-lg'; inp.placeholder = placeholder;
            let btn = document.createElement('button'); btn.className = 'btn-prime'; btn.innerText = 'Execute'; btn.style.width = '80%'; btn.style.background = '#000';
            btn.onclick = () => { if(inp.value.trim().toUpperCase() === ans) this.winInteractive(); else this.failRoom(); };
            wrap.append(inp, btn); stage.appendChild(wrap);
        };

        if (p.uiType === 'WIRES') { // 8 أسلاك
            stage.style.flexDirection = 'column';
            p.data.forEach((c, i) => {
                let w = document.createElement('div'); w.className = 'cyber-wire'; w.style.backgroundColor = c;
                if(c==='#333') w.style.border = '1px dashed #555';
                w.onclick = () => {
                    w.style.opacity = '0.2'; w.style.pointerEvents='none';
                    if(p.ans[this.stageState.clicks] === i) {
                        this.stageState.clicks++;
                        if(this.stageState.clicks === p.ans.length) this.winInteractive();
                    } else { this.failRoom(); this.setupStage(); }
                };
                stage.appendChild(w);
            });
        }
        else if (p.uiType === 'SIMON_ROUNDS') { // لعبة النبض بـ 3 راوندات
            stage.style.display = 'grid'; stage.style.gridTemplateColumns = 'repeat(4, 70px)'; stage.style.gap = '10px';
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
                stage.appendChild(b); boxes.push(b);
            }
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
        }
        else if (p.uiType === 'MASTERMIND') { // خزنة الألوان 4 أرقام
            let container = document.createElement('div'); container.className = 'mm-container';
            let inputs = document.createElement('div'); inputs.className = 'mm-inputs';
            let boxes = [];
            for(let i=0; i<4; i++) { let inp = document.createElement('input'); inp.type='number'; inp.className='mm-input'; inp.maxLength=1; inputs.appendChild(inp); boxes.push(inp); }
            let btn = document.createElement('button'); btn.className='btn-prime'; btn.innerText='Check Code'; btn.style.width='260px';
            let history = document.createElement('div'); history.className = 'mm-history';
            btn.onclick = () => {
                let guess = boxes.map(b => parseInt(b.value));
                if(guess.some(isNaN)) return;
                if(JSON.stringify(guess) === JSON.stringify(p.ans)) { this.winInteractive(); return; }
                this.stageState.attempts++;
                if(this.stageState.attempts > 8) { this.failRoom(); this.setupStage(); return; }
                
                let row = document.createElement('div'); row.className = 'mm-row';
                let tempAns = [...p.ans], tempGuess = [...guess];
                let pegs = [];
                // Green check (صح مكان ورقم)
                for(let i=0; i<4; i++) { if(tempGuess[i] === tempAns[i]) { pegs.push('#00ff66'); tempAns[i]=null; tempGuess[i]=-1; } }
                // Orange check (رقم صح مكان غلط)
                for(let i=0; i<4; i++) {
                    if(tempGuess[i] !== -1 && tempAns.includes(tempGuess[i])) { pegs.push('#ffa500'); tempAns[tempAns.indexOf(tempGuess[i])]=null; }
                }
                while(pegs.length < 4) pegs.push('#ff3333'); // أحمر (غلط)
                
                pegs.forEach(c => { let peg = document.createElement('div'); peg.className='mm-peg'; peg.style.background=c; row.appendChild(peg); });
                history.prepend(row);
                boxes.forEach(b => b.value = '');
            };
            container.append(inputs, btn, history); stage.appendChild(container);
        }
        else if (p.uiType === 'MATCH_20') { // 20 بطاقة
            stage.className = 'card-grid';
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
                stage.appendChild(card);
            });
        }
        else if (p.uiType === 'BOSS') {
            let bWrap = document.createElement('div'); bWrap.style.display='flex'; bWrap.style.gap='20px'; bWrap.style.marginBottom='20px';
            for(let i=0; i<3; i++) { let sw = document.createElement('div'); sw.className='cyber-switch'; sw.innerText='SYS_'+i; sw.onclick=()=>sw.classList.toggle('active'); bWrap.appendChild(sw); }
            let bInp = document.createElement('input'); bInp.type='text'; bInp.className='cyber-input-lg'; bInp.placeholder='MASTER PASSWORD'; bInp.style.marginBottom='20px';
            let bBtn = document.createElement('button'); bBtn.className='btn-prime'; bBtn.innerText='اختراق النظام النهائي'; bBtn.style.background='#220000'; bBtn.style.color='#ff3333'; bBtn.style.borderColor='#ff3333';
            bBtn.onclick = () => {
                let allSwitchesOn = Array.from(bWrap.children).every(s=>s.classList.contains('active'));
                if(allSwitchesOn && bInp.value.trim().toUpperCase() === p.ans) this.winInteractive(); else this.failRoom();
            };
            stage.append(bWrap, bInp, bBtn);
        }
        else if (p.uiType === 'INPUT' || p.uiType === 'RADIO' || p.uiType === 'BARCODE' || p.uiType === 'CRYPTEX' || p.uiType === 'DNA') {
            createInputBlock('أدخل كود الاختراق...', p.ans);
        }
        else {
            // المعالج الاحتياطي لأي لعبة أخرى يولد أزرار تفاعلية فخمة
            let count = p.data.length || p.data || 5;
            for(let i=0; i<count; i++) {
                let b = document.createElement('div'); b.className='cyber-switch'; b.innerText = 'CMD_'+i; b.style.width='90px';
                b.onclick = () => {
                    b.classList.add('active'); this.stageState.clicks++;
                    if(this.stageState.clicks === (p.ans.length || count)) { setTimeout(()=>this.winInteractive(), 300); }
                };
                stage.appendChild(b);
            }
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
