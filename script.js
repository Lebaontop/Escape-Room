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
            
            if(i===1) { m.uiType = 'WIRES'; m.desc="اقطع 3 أسلاك محددة. ."; m.data=['#D4AF37','#ff3333','#333','#fff','#D4AF37','#00ccff','#333','#ff3333']; m.ans=[2,5,7]; m.hint="💡 تفاعلي: الاحمر اسود ازرق . | 📝 كتابي: يعتم كلما زاد."; }
            else if(i===2) { m.uiType = 'SIMON'; m.desc="تتبع الأنماط: 3 جولات متتالية."; m.data=16; m.hint="💡 تفاعلي: ركز ووجهني بالترتيب الصحيح . | 📝 كتابي: يذوب في الحرارة."; }
            else if(i===3) { m.uiType = 'MASTERMIND'; m.desc="خزنة الألوان: أدخل 4 أرقام (أخضر=صح، برتقالي=مكان غلط)."; m.ans=[3,7,1,9]; m.hint="💡 تفاعلي: الكود هو 3**9. | 📝 كتابي: لا يمكنك البوح به."; }
            else if(i===4) { m.uiType = 'MATCH'; m.desc="تطابق الأشكال: 20 شريحة، طابق 10 أزواج."; m.data=['🪐','☄️','🌑','🔭','🛸','🛰️','🌌','🌠','🚀','👨‍🚀']; m.hint="💡 تفاعلي: احفظ الأماكن ووجهني. | 📝 كتابي: يزيد ولا ينقص."; }
            else if(i===5) { m.uiType = 'COMPASS_3X'; m.desc="توجيه البوصلات الثلاث: اضبط الزوايا الدقيقة ."; m.ans=[135, 225, 45]; m.hint="💡 تفاعلي: أسفل ، أسفل ، أعلى . | 📝 كتابي: يرتد لك من الجدار."; }
            else if(i===6) { m.uiType = 'HARD_MEMORY'; m.desc="اختبار الذاكرة العميق: سيظهر النمط الذهبي لثانيتين فقط. كرره بدقة."; m.hint="💡 تفاعلي: قسم الشبكة في ذهنك. | 📝 كتابي: كائن بحري يمتص."; }
            else if(i===7) { m.uiType = 'SCALES'; m.desc="الميزان الروماني: اختر أوزان مجموعها ***."; m.data=[50,70,30,80,20]; m.target=150; m.hint="💡 تفاعلي: 70 + * = *. | 📝 كتابي: يأتي غداً."; }
            else if(i===8) { m.uiType = 'RADAR_ROUNDS_HARD'; m.desc="الرادار الخفي: الهدف سيومض ومضة واحدة خفيفة جداً ويختفي. ركز بشدة لتعرف موقعه."; m.hint="💡 تفاعلي: انتظر ثانيتين وسوف يومض. | 📝 كتابي: تقطعه لتفي به."; }
            else if(i===9) { m.uiType = 'PAPYRUS_HARD'; m.desc="لفافة البردي: الأحرف متوزعة ومخبأة داخل رومات الألعاب، اجمعها ورتبها لتشكل الكلمة."; m.ans='SOUL CALL OLD'; m.hint="💡 تفاعلي: الكلمة هي S**L C*** **D. | 📝 كتابي: لغته السكوت."; }
            else if(i===10) { m.uiType = 'GEARS_HARD'; m.desc="نظام التروس المعقد: تدوير ترس يؤثر على الآخرين.."; m.hint="💡 تفاعلي: التروس مرتبطة عكسياً، وازنها. | 📝 كتابي: قشرتها هشة."; }
            else if(i===11) { m.uiType = 'NEON_NODES'; m.desc="الشبكة السيبرانية: اربط حاول جرب."; m.data=12; m.ans=[0,1,2,3]; m.hint="💡 تفاعلي: يمكن صف حاول ماراح اساعدك دايم  . | 📝 كتابي: تنشفك وتتبلل."; }
            else if(i===12) { m.uiType = 'JUGS'; m.desc="دوارق الكيمياء: احصل على 4 لتر من (8, 5, 3)."; m.hint="💡 تفاعلي: فكر كويس وشد حيلك مافي مساعده | 📝 كتابي: ترسم العالم."; }
            else if(i===13) { m.uiType = 'HARD_SEQUENCE'; m.desc="القفل التسلسلي الأعمى: 9 عقد طاقة. اكتشف التسلسل السري الكامل. خطأ واحد يعيدك للصفر."; m.hint="💡 تفاعلي: احفظ مسارك جيداً في كل محاولة. | 📝 كتابي: تعرف بها الوقت."; }
            else if(i===14) { m.uiType = 'SLIDING_PUZZLE'; m.desc="الجدارية المكسورة: رتب القطع ."; m.hint="💡 تفاعلي: رتبها تصاعدياً 1 لـ 8. | 📝 كتابي: يمطر."; }
            else if(i===15) { m.uiType = 'BLIND_MAZE'; m.desc="متاهة المينوتور: 6x6 معتمة. خطوة غلط ترجعك للصفر."; m.data=36; m.ans=[0,6,12,13,14,20,26,32,33,34,35]; m.hint="💡 تفاعلي: تحت 3 مرات... | 📝 كتابي: صيفي ولذيذ."; }
            else if(i===16) { m.uiType = 'CAESAR_HARD'; m.desc="تشفير دافنشي المتقدم: أزح الكلمة المشفرة بمقدار النجمة السباعية (+7)."; m.ans='ECLIPSE'; m.hint="💡 تفاعلي: الكلمة هي ECL****. | 📝 كتابي: يثبت الأشياء."; }
            else if(i===17) { m.uiType = 'HARD_WAVES'; m.desc="محاذاة الترددات الكمية: اضبط الموجات الثلاث بدقة ليتطابق المجموع *** %."; m.hint="💡 تفاعلي: 73, **, **. | 📝 كتابي: أداة الكتابة."; }
            else if(i===18) { m.uiType = 'BARCODE_HARD'; m.desc="طابق الباركود : أدخل التردد ."; m.ans=[0,1,0,0,1,1,0,1,0,1]; m.hint="💡 تفاعلي:  باب فكر كويس . | 📝 كتابي: يتبعك بالشمس."; }
            else if(i===19) { m.uiType = 'HARD_COLOR_CODE'; m.desc="شفرة التوافق الصارمة: ابحث عن الترتيب اللوني الدقيق. النظام يعطيك نسبة التطابق فقط."; m.hint="💡 تفاعلي: *، ذهبي، *، أزرق، *. | 📝 كتابي: تدل على الشمال."; }
            else if(i===20) { m.uiType = 'LIGHTS_OUT'; m.desc="معبد الشعلات: أطفئ جميع النيران (3x3)."; m.data=9; m.hint="💡 تفاعلي: الأطراف ثم المنتصف. | 📝 كتابي: لا تُرى."; }
            else if(i===21) { m.uiType = 'PATTERN_LOCK'; m.desc="قفل النمط الأمني: ارسم النمط السري (*) عبر العقد بشكل متصل."; m.ans=[0,1,2,4,6,7,8]; m.hint="💡 تفاعلي: ارسم حرف Z. | 📝 كتابي: تخاف من الماء."; }
            else if(i===22) { m.uiType = 'DNA'; m.desc="فك شفرة الحمض: A=T, C=G."; m.ans='TGCA'; m.hint="💡 تفاعلي: TGCA. | 📝 كتابي: تكبر كلما أخذت منها."; }
            else if(i===23) { m.uiType = 'FREQUENCY_HACK'; m.desc="معايرة التردد الصوتي: وازن الـ 5 محركات حتى تتوهج النواة المركزية لأقصى درجة."; m.hint="💡 تفاعلي: حركها حتى تصبح النواة خضراء ساطعة. | 📝 كتابي: يقرصك ببطنك."; }
            else if(i===24) { m.uiType = 'KEYPAD_HARD'; m.desc="خزنة الكيبورد: الأرقام موزعة برومات الألعاب، ابحث عنها لفتح الخزنة."; m.ans='1936'; m.hint="💡 تفاعلي: الكود هو 1***. | 📝 كتابي: ينادونك به."; }
            else if(i===25) { m.uiType = 'HARD_PIPES'; m.desc="صمامات الضغط المترابطة: أدر الصمامات . كل صمام يؤثر على جيرانه المباشرين."; m.hint="💡 تفاعلي: ماراح اساعدك   . | 📝 كتابي: تتركها وراءك."; }
            else if(i===26) { m.uiType = 'HEATMAP_HARD'; m.desc="التسلسل الطيفي: انقر على المربعات بتسلسل ألوان النجوم ."; m.hint="💡 تفاعلي: أبيض، أزرق، . | 📝 كتابي: قطرات من السماء."; }
            else if(i===27) { m.uiType = 'HARD_ROTATION_25'; m.desc="المصفوفة الدوارة المتقدمة (5x5): احفظ المواقع الـ 6 المضيئة. الشبكة ستدور 180 درجة كاملة."; m.hint="💡 تفاعلي:  معكوسة  . | 📝 كتابي: افتح يا..."; }
            else if(i===28) { m.uiType = 'ELEVATOR_SEQ'; m.desc="المصعد المبرمج: هناك صور موزعة في السيرفر تساعدكم لمعرفة التسلسل."; m.ans=['B2','1','4','2','5']; m.hint="💡 تفاعلي: B2 ➔ . | 📝 كتابي: مدينة تاريخية."; }
            else if(i===29) { m.uiType = 'QUANTUM_GRID'; m.desc="التشابك الكمي: كل ضغطة تعكس حالة الصف والعمود بأكمله. اجعل الشبكة ذهبية بالكامل."; m.hint="💡 تفاعلي: اضغط على المربعات المطفأة فقط. | 📝 كتابي: تذوب لتضيء."; }
            else if(i===30) { m.uiType = 'BOSS_PATTERN'; m.desc="العرش الذهبي: فعل المفاتيح بالنمط (تشغيل، إطفاء، * ، * ، *) واكتب كلمة المرور."; m.ans='SOLAR GAME'; m.hint="💡 تفاعلي: كلم المنظم يمكن يساعدك  . | 📝 كتابي: معدن أصفر نفيس."; }

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
        let display1 = document.getElementById('global-timer-display');
        let display2 = document.getElementById('market-time');
        let display3 = document.getElementById('puzzle-global-timer');

        if(display1) { display1.innerText = `${h}:${m}:${s}`; display1.style.color = this.timeFrozen ? '#00ccff' : '#fff'; }
        if(display2) { display2.innerText = `${h}:${m}:${s}`; }
        if(display3) { display3.innerText = `${h}:${m}:${s}`; display3.style.color = this.timeFrozen ? '#00ccff' : '#fff'; }
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
        const hintParts = this.activeGate.hint.split('|');
        
        let interactiveHint = hintParts[0] ? hintParts[0].replace('💡 تفاعلي:', '').trim() : 'لا يوجد تلميح للعبة.';
        let textHint = hintParts[1] ? hintParts[1].replace('📝 كتابي:', '').trim() : 'لا يوجد تلميح للغز.';
        
        hd.innerHTML = `
            <div style="border-bottom:1px solid var(--gold); padding-bottom:10px; margin-bottom:10px; color:var(--gold);">
                <strong style="color:#fff;">تلميح اللعبة التفاعلية:</strong><br>${interactiveHint}
            </div>
            <div style="color:var(--gold);">
                <strong style="color:#fff;">تلميح اللغز الكتابي:</strong><br>${textHint}
            </div>
        `;
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
        
        // إخفاء التلميح عند الدخول 
        const hd = document.getElementById('hint-display');
        hd.classList.add('hidden');
        hd.innerHTML = '';
        
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

        const generateSubmitButton = (callback, text = 'تأكيد (Execute)') => {
            let btn = document.createElement('button'); btn.className = 'btn-execute'; btn.innerText = text; 
            btn.style.cssText = 'background: linear-gradient(180deg, #222, #000); color: var(--gold); border: 2px solid var(--gold); padding: 15px 30px; font-size: 1.2rem; font-weight: bold; border-radius: 6px; cursor: pointer; transition: 0.3s; margin-top:20px; width: 100%; max-width: 400px;';
            btn.onclick = callback; return btn;
        };

        const createInputBlock = (placeholder, ans) => {
            let wrap = document.createElement('div'); wrap.style.cssText = 'width:100%; display:flex; flex-direction:column; align-items:center;';
            let inp = document.createElement('input'); inp.type = 'text'; inp.className = 'cyber-input'; inp.placeholder = placeholder;
            inp.style.cssText = 'background: #000; border: 2px solid var(--gold); color: var(--gold); padding: 15px; font-size: 1.8rem; text-align: center; width: 100%; max-width: 400px; outline: none; box-shadow: inset 0 0 20px rgba(212,175,55,0.2); letter-spacing: 5px; font-family: monospace; border-radius: 8px; text-transform: uppercase;';
            wrap.append(inp, generateSubmitButton(() => { if(inp.value.trim().toUpperCase() === ans.toUpperCase()) this.winInteractive(); else this.failRoom(); }));
            innerStage.appendChild(wrap);
        };

        switch(p.uiType) {

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

            case 'COMPASS_3X': { 
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:flex; gap:30px;';
                let angles = [0, 0, 0];
                for(let i=0; i<3; i++) {
                    let cmp = document.createElement('div'); 
                    cmp.style.cssText = 'width:120px; height:120px; border-radius:50%; background:radial-gradient(circle, #222, #000); border:4px solid #333; position:relative; box-shadow:0 0 20px #000; display:flex; justify-content:center; align-items:center; cursor:pointer; transition:transform 0.3s;';
                    let ndl = document.createElement('div'); ndl.style.cssText = 'width:4px; height:100px; background:linear-gradient(to bottom, #ff3333 50%, #fff 50%); position:absolute;';
                    let cnt = document.createElement('div'); cnt.style.cssText = 'width:15px; height:15px; background:#D4AF37; border-radius:50%; position:absolute; box-shadow:0 0 10px #000;';
                    cmp.append(ndl, cnt);
                    cmp.onclick = () => {
                        this.playSound('click'); angles[i] = (angles[i] + 45) % 360; cmp.style.transform = `rotate(${angles[i]}deg)`;
                        if(angles[0]===p.ans[0] && angles[1]===p.ans[1] && angles[2]===p.ans[2]) setTimeout(()=>this.winInteractive(), 500);
                    };
                    wrap.appendChild(cmp);
                }
                innerStage.appendChild(wrap);
                break;
            }

            case 'HARD_MEMORY': { 
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:grid; grid-template-columns:repeat(5, 55px); gap:5px; margin-bottom:20px;';
                let cells = [];
                let target = [];
                while(target.length < 10) { let r = Math.floor(Math.random()*25); if(!target.includes(r)) target.push(r); }
                let selected = [];
                for(let i=0; i<25; i++) {
                    let c = document.createElement('div'); 
                    c.style.cssText = 'width:55px; height:55px; background:#111; border:1px solid #333; cursor:pointer; transition:0.3s; box-shadow:inset 0 0 10px #000; border-radius:4px;';
                    c.onclick = () => {
                        if(!this.stageState.playing) return;
                        this.playSound('click');
                        let idx = selected.indexOf(i);
                        if(idx > -1) { selected.splice(idx, 1); c.style.background = '#111'; c.style.boxShadow = 'inset 0 0 10px #000'; }
                        else { selected.push(i); c.style.background = '#D4AF37'; c.style.boxShadow = '0 0 15px #D4AF37'; }
                    };
                    cells.push(c); wrap.appendChild(c);
                }
                let btn = generateSubmitButton(() => {
                    if(selected.length === target.length && selected.every(val => target.includes(val))) this.winInteractive();
                    else { this.failRoom(); setTimeout(()=>this.setupStage(), 800); }
                }, 'VERIFY MEMORY');
                innerStage.append(wrap, btn);
                
                this.stageState.playing = false;
                target.forEach(i => { cells[i].style.background = '#fff'; cells[i].style.boxShadow = '0 0 20px #fff'; });
                setTimeout(() => {
                    target.forEach(i => { cells[i].style.background = '#111'; cells[i].style.boxShadow = 'inset 0 0 10px #000'; });
                    this.stageState.playing = true;
                }, 2000); 
                break;
            }

            case 'SCALES': {
                let sclWrap = document.createElement('div'); sclWrap.style.cssText = 'display:flex; gap:20px; align-items:flex-end; height:150px; border-bottom: 4px solid var(--gold); padding-bottom:10px; width: 100%; max-width: 500px; justify-content:center;';
                p.data.forEach((w) => {
                    let btn = document.createElement('div');
                    btn.style.cssText = 'width: 60px; background: linear-gradient(135deg, #eee, #888); border: 2px solid #555; text-align: center; font-weight: bold; color: #000; cursor: pointer; transition: 0.3s; clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%); display:flex; align-items:flex-end; justify-content:center; padding-bottom:10px; box-shadow: 0 10px 15px #000;';
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

            case 'RADAR_ROUNDS_HARD': { 
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
                        let c = document.createElement('div'); c.style.border='1px solid rgba(0,255,100,0.1)'; c.style.cursor='pointer'; c.style.transition='0.2s';
                        c.onclick = () => {
                            if(i === targetIdx) {
                                clearTimeout(this.stageState.timer); this.playSound('click'); this.stageState.round++;
                                if(this.stageState.round > 3) this.winInteractive(); else startRadarRound();
                            } else { clearTimeout(this.stageState.timer); this.failRoom(); this.setupStage(); }
                        };
                        rdWrap.appendChild(c); cells.push(c);
                    }
                    this.stageState.timer = setTimeout(() => {
                        cells[targetIdx].style.background = '#00ff66'; cells[targetIdx].style.boxShadow = '0 0 15px #00ff66';
                        setTimeout(() => { cells[targetIdx].style.background = 'transparent'; cells[targetIdx].style.boxShadow = 'none'; }, 150);
                    }, Math.random() * 2000 + 500);
                };
                startRadarRound();
                break;
            }

            case 'PAPYRUS_HARD': { 
                let papy = document.createElement('div'); papy.style.cssText = "font-family: 'Rajdhani', monospace; font-size: 3rem; color: #3e3124; background: #e3d2b2; padding: 20px 40px; border: 4px solid #a68962; border-radius: 5px; font-weight:bold; letter-spacing:10px; margin-bottom:30px;";
                papy.innerText = '???'; innerStage.appendChild(papy);
                createInputBlock('ENTER THE HIDDEN PHRASE...', p.ans);
                break;
            }

            case 'GEARS_HARD': { 
                let gWrap = document.createElement('div'); gWrap.style.cssText = 'display:flex; gap:25px;';
                let gearAngles = [90, 180, 270];
                let gears = [];
                for(let i=0; i<3; i++) {
                    let d = document.createElement('div');
                    d.style.cssText = `width: 90px; height: 90px; border-radius: 50%; border: 6px dashed #555; background: radial-gradient(circle, #222, #000); display: flex; justify-content: center; align-items: flex-start; cursor: pointer; transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); transform: rotate(${gearAngles[i]}deg); box-shadow: 0 0 15px #000; position:relative;`;
                    let indicator = document.createElement('div');
                    indicator.style.cssText = 'width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent; border-bottom: 25px solid #D4AF37; margin-top: -15px; filter: drop-shadow(0 0 5px #D4AF37);';
                    d.appendChild(indicator);
                    let center = document.createElement('div');
                    center.style.cssText = 'width: 20px; height: 20px; background: #555; border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); border: 2px solid #111;';
                    d.appendChild(center);
                    gears.push(d); gWrap.appendChild(d);
                }
                const updateGears = () => {
                    for(let i=0; i<3; i++) { gearAngles[i] = ((gearAngles[i] % 360) + 360) % 360; gears[i].style.transform = `rotate(${gearAngles[i]}deg)`; }
                    if(gearAngles.every(a => a === 0)) setTimeout(()=>this.winInteractive(), 500);
                };
                gears[0].onclick = () => { this.playSound('click'); gearAngles[0] += 45; gearAngles[1] -= 45; updateGears(); };
                gears[1].onclick = () => { this.playSound('click'); gearAngles[1] += 45; gearAngles[2] += 90; updateGears(); };
                gears[2].onclick = () => { this.playSound('click'); gearAngles[2] += 45; gearAngles[0] -= 90; updateGears(); };
                innerStage.appendChild(gWrap);
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

            case 'HARD_SEQUENCE': { 
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:15px;';
                let targetSeq = [...Array(9).keys()].sort(()=>Math.random() - 0.5);
                let currentStep = 0;
                let cells = [];
                for(let i=0; i<9; i++) {
                    let c = document.createElement('div');
                    c.style.cssText = 'width:80px; height:80px; background:#050505; border:2px solid #D4AF37; border-radius:50%; display:flex; justify-content:center; align-items:center; font-size:2rem; color:#000; cursor:pointer; font-weight:bold; box-shadow:inset 0 0 15px #000; transition:0.2s;';
                    c.onclick = () => {
                        this.playSound('click');
                        if(targetSeq[currentStep] === i) {
                            c.style.background = '#D4AF37'; c.innerText = currentStep + 1; c.style.pointerEvents = 'none';
                            currentStep++;
                            if(currentStep === 9) setTimeout(()=>this.winInteractive(), 500);
                        } else {
                            this.failRoom();
                            currentStep = 0;
                            cells.forEach(cell => { cell.style.background = '#050505'; cell.innerText = ''; cell.style.pointerEvents = 'auto'; });
                        }
                    };
                    cells.push(c); wrap.appendChild(c);
                }
                let txt = document.createElement('div'); txt.style.cssText = 'color:#D4AF37; margin-bottom:20px; font-family:monospace; letter-spacing:2px; font-size:1.2rem;'; txt.innerText = 'FIND THE HIDDEN SEQUENCE (1-9)';
                innerStage.append(txt, wrap);
                break;
            }

            case 'SLIDING_PUZZLE': {
                let pzWrap = document.createElement('div'); pzWrap.className = 'sliding-puzzle'; pzWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:4px; background:#222; padding:8px; border:2px solid #555; border-radius:6px; box-shadow:0 15px 25px rgba(0,0,0,0.9);';
                let tiles = [1,2,3,4,5,6,7,0,8]; 
                const renderPuzzle = () => {
                    pzWrap.innerHTML = '';
                    tiles.forEach((t, i) => {
                        let cell = document.createElement('div'); cell.className = 'slide-tile';
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

            case 'CAESAR_HARD': { 
                let txtDisp16 = document.createElement('div'); txtDisp16.style.cssText = 'font-family:monospace; font-size:3rem; color:var(--gold); text-shadow:0 0 20px var(--gold); background:#000; border:2px solid #333; padding:10px 30px; border-radius:8px; margin-bottom:20px; letter-spacing:5px; text-align:center;'; 
                txtDisp16.innerText = 'LJSPWZL';
                innerStage.appendChild(txtDisp16);
                createInputBlock('ENTER DECODE SEQUENCE...', p.ans);
                break;
            }

            case 'HARD_WAVES': {
                let wrap = document.createElement('div'); wrap.style.cssText = 'width:100%; max-width:400px; display:flex; flex-direction:column; gap:20px;';
                let disp = document.createElement('div'); disp.style.cssText = 'width:100%; height:80px; background:#000; border:2px solid #333; display:flex; justify-content:center; align-items:center; color:#D4AF37; font-family:monospace; font-size:2.5rem; letter-spacing:5px; box-shadow:inset 0 0 20px #000;';
                disp.innerText = 'ERR%';
                let targetA = 73, targetB = 21, targetC = 88;
                let sls = [];
                ['FREQ-A', 'AMP-B', 'PHASE-C'].forEach(l => {
                    let r = document.createElement('div'); r.style.cssText = 'display:flex; align-items:center; gap:15px; background:#111; padding:15px; border:1px solid #222; border-radius:4px;';
                    let lbl = document.createElement('span'); lbl.innerText = l; lbl.style.cssText = 'color:#888; width:70px; font-weight:bold; font-family:monospace;';
                    let s = document.createElement('input'); s.type='range'; s.min=0; s.max=100; s.value=50; s.style.flexGrow='1'; s.style.cursor='pointer';
                    s.oninput = () => { this.playSound('click'); }; 
                    r.append(lbl, s); wrap.appendChild(r); sls.push(s);
                });
                let btn = generateSubmitButton(() => {
                    let a = parseInt(sls[0].value), b = parseInt(sls[1].value), c = parseInt(sls[2].value);
                    let diff = Math.abs(a-targetA) + Math.abs(b-targetB) + Math.abs(c-targetC);
                    let acc = Math.max(0, 100 - diff);
                    disp.innerText = acc + '%';
                    if(acc === 100) this.winInteractive(); else this.failRoom();
                }, 'CALCULATE RESONANCE');
                innerStage.append(disp, wrap, btn);
                break;
            }

            case 'BARCODE_HARD': { 
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:flex; flex-direction:column; gap:20px; align-items:center;';
                let topBc = document.createElement('div'); topBc.style.cssText = 'display:flex; gap:4px; height:80px; background:#fff; padding:10px; border-radius:4px;';
                let botBc = document.createElement('div'); botBc.style.cssText = 'display:flex; gap:4px; height:80px; background:#fff; padding:10px; border-radius:4px;';
                let pattern = [1,0,1,1,0,0,1,0,1,0];
                this.stageState.arr = [1,0,0,0,0,0,0,0,0,1]; 
                for(let i=0; i<10; i++) {
                    let topBar = document.createElement('div'); topBar.style.cssText = `width:15px; height:100%; background:${pattern[i] ? '#000' : '#ddd'};`; topBc.appendChild(topBar);
                    let botBar = document.createElement('div'); botBar.style.cssText = 'width:15px; height:100%; cursor:pointer; transition:0.2s;';
                    if(this.stageState.arr[i] === 0) { botBar.style.background = '#ddd'; botBar.classList.add('missing'); } else { botBar.style.background = '#000'; }
                    botBar.onclick = () => { this.playSound('click'); botBar.classList.toggle('missing'); botBar.style.background = botBar.classList.contains('missing') ? '#ddd' : '#000'; this.stageState.arr[i] = botBar.classList.contains('missing') ? 0 : 1; };
                    botBc.appendChild(botBar);
                }
                wrap.append(topBc, botBc); innerStage.appendChild(wrap);
                innerStage.appendChild(generateSubmitButton(() => { if(JSON.stringify(this.stageState.arr) === JSON.stringify(p.ans)) this.winInteractive(); else this.failRoom(); }));
                break;
            }

            case 'HARD_COLOR_CODE': {
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:flex; flex-direction:column; align-items:center; width:100%;';
                let nodesWrap = document.createElement('div'); nodesWrap.style.cssText = 'display:flex; gap:15px; margin-bottom:30px;';
                let colors = ['#D4AF37', '#ff3333', '#00ccff', '#00ff66', '#ffffff', '#555555'];
                let target = [3, 0, 4, 2, 5]; 
                let current = [0, 0, 0, 0, 0];
                let nodes = [];
                for(let i=0; i<5; i++) {
                    let n = document.createElement('div');
                    n.style.cssText = `width:55px; height:55px; border-radius:8px; background:${colors[0]}; border:2px solid #333; cursor:pointer; transition:0.3s; box-shadow:0 5px 15px rgba(0,0,0,0.8);`;
                    n.onclick = () => {
                        this.playSound('click');
                        current[i] = (current[i] + 1) % colors.length;
                        n.style.background = colors[current[i]];
                    };
                    nodesWrap.appendChild(n); nodes.push(n);
                }
                let screen = document.createElement('div'); screen.style.cssText = 'width:250px; height:60px; background:#000; border:2px solid #D4AF37; margin-bottom:20px; display:flex; justify-content:center; align-items:center; color:#D4AF37; font-family:monospace; font-size:1.8rem; letter-spacing:2px; text-shadow:0 0 10px #D4AF37;'; screen.innerText = 'STATUS: WAIT';
                let btn = generateSubmitButton(() => {
                    let exact = 0;
                    for(let i=0; i<5; i++) { if(current[i] === target[i]) exact++; }
                    screen.innerText = `MATCH: ${(exact/5)*100}%`;
                    if(exact === 5) this.winInteractive(); else this.failRoom();
                }, 'TEST ALIGNMENT');
                wrap.append(screen, nodesWrap, btn); innerStage.appendChild(wrap);
                break;
            }

            case 'LIGHTS_OUT': {
                let loWrap = document.createElement('div'); loWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:5px;';
                let cells = [];
                for(let i=0; i<p.data; i++) {
                    let c = document.createElement('div'); c.className = 'simon-box pulse'; c.style.cssText = 'width:80px; height:80px; background:var(--gold); border:2px solid #fff; border-radius:8px; cursor:pointer; box-shadow:0 0 30px var(--gold); transition:0.1s;';
                    c.onclick = () => {
                        c.classList.toggle('pulse');
                        c.style.background = c.classList.contains('pulse') ? 'var(--gold)' : '#050505'; c.style.boxShadow = c.classList.contains('pulse') ? '0 0 30px var(--gold)' : 'inset 0 0 15px #000';
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

            case 'PATTERN_LOCK': {
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 60px); gap:30px; padding:30px; background:#111; border-radius:10px; border:2px solid #333; position:relative;';
                let current = []; let nodes = [];
                for(let i=0; i<9; i++) {
                    let n = document.createElement('div');
                    n.style.cssText = 'width:60px; height:60px; background:#050505; border:3px solid #555; border-radius:50%; cursor:pointer; transition:0.2s; position:relative; z-index:2;';
                    n.onclick = () => {
                        if(current.includes(i)) return; this.playSound('click');
                        n.style.background = '#D4AF37'; n.style.borderColor = '#fff'; current.push(i);
                        if(current.length === p.ans.length) {
                            if(JSON.stringify(current) === JSON.stringify(p.ans)) setTimeout(()=>this.winInteractive(), 300);
                            else { this.failRoom(); current = []; nodes.forEach(x => { x.style.background = '#050505'; x.style.borderColor = '#555'; }); }
                        }
                    };
                    nodes.push(n); wrap.appendChild(n);
                }
                innerStage.appendChild(wrap);
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

            case 'FREQUENCY_HACK': {
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:flex; gap:30px; align-items:center;';
                let sliders = document.createElement('div'); sliders.style.cssText = 'display:flex; flex-direction:column; gap:15px; width:200px;';
                let orb = document.createElement('div'); orb.style.cssText = 'width:120px; height:120px; border-radius:50%; background:#00ff66; opacity:0.1; box-shadow:0 0 50px #00ff66; transition:0.2s; border:4px solid #111;';
                let target = [30, 85, 10, 60, 95]; let inputs = [];
                for(let i=0; i<5; i++) {
                    let s = document.createElement('input'); s.type='range'; s.min=0; s.max=100; s.value=50; s.style.cursor='pointer';
                    s.oninput = () => {
                        let diff = 0; for(let j=0; j<5; j++) diff += Math.abs(parseInt(inputs[j].value) - target[j]);
                        let acc = Math.max(0, 1 - (diff / 250)); orb.style.opacity = Math.max(0.1, acc);
                        if(acc > 0.96) setTimeout(()=>this.winInteractive(), 500);
                    };
                    inputs.push(s); sliders.appendChild(s);
                }
                wrap.append(sliders, orb); innerStage.appendChild(wrap);
                break;
            }

            case 'KEYPAD_HARD': {
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

            case 'HARD_PIPES': {
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:10px;';
                let state = [0, 90, 180, 270, 90, 180, 0, 270, 90];
                let dials = [];
                for(let i=0; i<9; i++) {
                    let d = document.createElement('div');
                    d.style.cssText = `width:80px; height:80px; background:#0a0a0a; border:2px solid #D4AF37; border-radius:50%; display:flex; justify-content:center; align-items:center; cursor:pointer; transform:rotate(${state[i]}deg); transition:0.3s cubic-bezier(0.4,0,0.2,1); font-size:3rem; color:#D4AF37; box-shadow:inset 0 0 15px #000;`;
                    d.innerText = '⬆';
                    d.onclick = () => {
                        this.playSound('click');
                        let toRotate = [i];
                        if(i%3 !== 0) toRotate.push(i-1); 
                        if(i%3 !== 2) toRotate.push(i+1); 
                        if(Math.floor(i/3) !== 0) toRotate.push(i-3); 
                        if(Math.floor(i/3) !== 2) toRotate.push(i+3); 
                        
                        toRotate.forEach(idx => {
                            state[idx] = (state[idx] + 90) % 360;
                            dials[idx].style.transform = `rotate(${state[idx]}deg)`;
                        });
                        
                        if(state.every(val => val === 0)) setTimeout(()=>this.winInteractive(), 500);
                    };
                    dials.push(d); wrap.appendChild(d);
                }
                innerStage.appendChild(wrap);
                break;
            }

            case 'HEATMAP_HARD': {
                let htWrap = document.createElement('div'); htWrap.style.cssText = 'display:grid; grid-template-columns:repeat(4, 70px); gap:10px; background:#111; padding:20px; border-radius:10px;';
                let colors = ['#ffffff', '#00ccff', '#ffff66', '#ff8800', '#ff0000']; 
                let btns = [];
                for(let i=0; i<16; i++) {
                    let b = document.createElement('button'); b.style.cssText = 'width:70px; height:70px; border:none; border-radius:6px; cursor:pointer; box-shadow:inset 0 0 20px rgba(0,0,0,0.5);';
                    let colIdx = Math.floor(Math.random() * colors.length);
                    b.style.background = colors[colIdx]; b.dataset.col = colIdx;
                    b.onclick = () => {
                        this.playSound('click'); b.style.opacity = '0.2'; b.style.pointerEvents = 'none';
                        this.stageState.arr.push(parseInt(b.dataset.col));
                        if(this.stageState.arr.length === 5) {
                            if(JSON.stringify(this.stageState.arr) === JSON.stringify([0,1,2,3,4])) this.winInteractive();
                            else { this.failRoom(); this.setupStage(); }
                        }
                    };
                    htWrap.appendChild(b); btns.push(b);
                }
                innerStage.appendChild(htWrap);
                break;
            }

            case 'HARD_ROTATION_25': {
                let rotContainer = document.createElement('div'); rotContainer.style.cssText = 'width:300px; height:300px; transition:transform 1s cubic-bezier(0.68,-0.55,0.27,1.55); margin-bottom:20px;';
                let grid27 = document.createElement('div'); grid27.style.cssText = 'display:grid; grid-template-columns:repeat(5, 1fr); width:100%; height:100%; gap:4px; padding:6px; background:#000; border:2px solid #D4AF37;';
                let cells27 = []; let pattern = [2, 7, 12, 16, 18, 22]; 
                let targetPattern = pattern.map(idx => 24 - idx).sort((a,b)=>a-b);
                for(let i=0; i<25; i++) {
                    let cell = document.createElement('div'); cell.style.cssText = 'background:#111; border:1px solid #333; cursor:pointer; transition:0.2s;';
                    cell.onclick = () => {
                        if(this.stageState.playing) return; this.playSound('click'); cell.style.background = '#D4AF37'; this.stageState.arr.push(i);
                        if(this.stageState.arr.length === targetPattern.length) {
                            if(JSON.stringify([...this.stageState.arr].sort((a,b)=>a-b)) === JSON.stringify(targetPattern)) this.winInteractive();
                            else { this.failRoom(); setTimeout(()=>this.setupStage(), 800); }
                        }
                    };
                    cells27.push(cell); grid27.appendChild(cell);
                }
                rotContainer.appendChild(grid27); innerStage.appendChild(rotContainer);
                setTimeout(() => {
                    pattern.forEach(i => { cells27[i].style.background = '#fff'; cells27[i].style.boxShadow = '0 0 15px #fff'; }); this.playSound('success');
                    setTimeout(() => {
                        cells27.forEach(c => { c.style.background = '#111'; c.style.boxShadow = 'none'; });
                        rotContainer.style.transform = 'rotate(180deg)'; this.stageState.playing = false;
                    }, 2000);
                }, 800);
                break;
            }

            case 'ELEVATOR_SEQ': {
                let elWrap = document.createElement('div'); elWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 70px); gap:15px;';
                ['5','4','3','2','1','G','B1','B2','B3'].forEach(n => {
                    let b = document.createElement('div'); b.style.cssText = 'width:70px; height:70px; border-radius:50%; background:radial-gradient(circle, #eee, #ccc); border:2px solid #999; box-shadow:0 5px 5px rgba(0,0,0,0.5), inset 0 0 5px #fff; display:flex; justify-content:center; align-items:center; font-size:1.8rem; font-weight:bold; color:#333; cursor:pointer;'; b.innerText = n;
                    b.onclick = () => {
                        this.playSound('click'); b.style.background = '#aaa'; setTimeout(()=>b.style.background = 'radial-gradient(circle, #eee, #ccc)', 300);
                        if(p.ans[this.stageState.clicks] === n) { this.stageState.clicks++; if(this.stageState.clicks === p.ans.length) setTimeout(()=>this.winInteractive(), 300); } else { this.failRoom(); this.setupStage(); }
                    }; elWrap.appendChild(b);
                });
                innerStage.appendChild(elWrap);
                break;
            }

            case 'QUANTUM_GRID': {
                let qWrap = document.createElement('div'); qWrap.style.cssText = 'display:grid; grid-template-columns:repeat(4, 70px); gap:5px; background:#111; padding:10px; border:2px solid #D4AF37;';
                let state = Array(16).fill(0); [0, 5, 10, 15].forEach(i => state[i] = 1);
                let cells = [];
                const draw = () => { cells.forEach((c, i) => { c.style.background = state[i] ? '#D4AF37' : '#050505'; c.style.boxShadow = state[i] ? '0 0 15px #D4AF37' : 'none'; }); };
                for(let i=0; i<16; i++) {
                    let c = document.createElement('div'); c.style.cssText = 'width:70px; height:70px; border:1px solid #333; cursor:pointer; transition:0.3s;';
                    c.onclick = () => {
                        this.playSound('click'); let r = Math.floor(i/4), cl = i%4;
                        for(let j=0; j<16; j++) { if(Math.floor(j/4) === r || j%4 === cl) state[j] = 1 - state[j]; }
                        draw(); if(state.every(s => s === 1)) setTimeout(()=>this.winInteractive(), 500);
                    };
                    cells.push(c); qWrap.appendChild(c);
                }
                draw(); innerStage.appendChild(qWrap);
                break;
            }

            case 'BOSS_PATTERN': {
                let bWrap = document.createElement('div'); bWrap.style.cssText='display:flex; gap:15px; margin-bottom:30px;';
                let switches = [];
                for(let i=0; i<5; i++) { 
                    let sw = document.createElement('div'); sw.style.cssText = 'position:relative; width:60px; height:100px; background:#111; border:2px solid #333; border-radius:8px; cursor:pointer; color:#555; text-align:center; padding-top:70px; font-weight:bold; font-size:0.9rem;'; sw.innerHTML = `<div style="position: absolute; top: 10px; width: 45px; left: 5px; height: 40px; background: #050505; border-radius: 4px; box-shadow: inset 0 5px 10px #000; transition: 0.3s;"></div>OFF`;
                    sw.dataset.on = "0";
                    sw.onclick = () => {
                        this.playSound('click'); sw.dataset.on = sw.dataset.on === "1" ? "0" : "1"; 
                        if(sw.dataset.on === "1"){ sw.style.color = '#D4AF37'; sw.innerHTML = `<div style="position: absolute; top: 48px; width: 45px; left: 5px; height: 40px; background: #D4AF37; border-radius: 4px; box-shadow: 0 0 20px #D4AF37; transition: 0.3s;"></div>ON`; } 
                        else { sw.style.color = '#555'; sw.innerHTML = `<div style="position: absolute; top: 10px; width: 45px; left: 5px; height: 40px; background: #050505; border-radius: 4px; box-shadow: inset 0 5px 10px #000; transition: 0.3s;"></div>OFF`; }
                    };
                    switches.push(sw); bWrap.appendChild(sw); 
                }
                let bInp = document.createElement('input'); bInp.type='text'; bInp.style.cssText = 'background:#000; border:2px solid var(--gold); color:var(--gold); padding:15px; font-size:1.8rem; text-align:center; width:100%; max-width:400px; outline:none; box-shadow:inset 0 0 20px rgba(212,175,55,0.2); letter-spacing:5px; font-family:monospace; border-radius:8px; margin-bottom:20px; text-transform:uppercase;'; bInp.placeholder='MASTER PASSWORD';
                let bBtn = generateSubmitButton(() => { 
                    let target = ["1", "0", "1", "1", "0"];
                    let correctSwitches = switches.every((s, i) => s.dataset.on === target[i]);
                    if(correctSwitches && bInp.value.trim().toUpperCase() === p.ans.toUpperCase()) this.winInteractive(); else this.failRoom(); 
                }, '🔥 INITIATE MASTER HACK 🔥'); 
                bBtn.style.background='#ff0000'; bBtn.style.color='#fff'; bBtn.style.borderColor='#fff';
                innerStage.append(bWrap, bInp, bBtn);
                break;
            }

            default:
                let defaultMsg = document.createElement('div');
                defaultMsg.style.cssText = "color:#D4AF37; font-family:monospace; font-size:1.5rem;";
                defaultMsg.innerText = "Error: Protocol Missing";
                innerStage.appendChild(defaultMsg);
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
const game = new SolarGamesEngine();
