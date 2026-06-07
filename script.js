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
            if(e.target.tagName==='BUTTON' || e.target.classList.contains('simon-box') || e.target.closest('.channel-card') || e.target.classList.contains('shard-btn') || e.target.classList.contains('case-word') || e.target.classList.contains('cctv-cam')){ 
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
            {q: "كلما أخذت منه أكثر، تركت أكثر وراءك؟", a: "الخطوة"}
        ];

        let mechanics = [];
        for(let i=1; i<=25; i++) {
            let m = { id: i, type: `GAME_${i}` };
            
            // --- الألعاب الثابتة القديمة ---
            if(i===1) { m.uiType = 'WIRES'; m.desc="اقطع 3 أسلاك محددة."; m.data=['#D4AF37','#ff3333','#333','#fff','#D4AF37','#00ccff','#333','#ff3333']; m.ans=[2,5,7]; m.hint="💡 تفاعلي: الاحمر اسود ازرق. | 📝 كتابي: يعتم كلما زاد."; }
            else if(i===2) { m.uiType = 'SIMON'; m.desc="تتبع الأنماط: 3 جولات متتالية."; m.data=16; m.hint="💡 تفاعلي: ركز ووجهني بالترتيب الصحيح. | 📝 كتابي: يذوب في الحرارة."; }
            else if(i===3) { m.uiType = 'MASTERMIND'; m.desc="خزنة الألوان: أدخل 4 أرقام."; m.ans=[3,7,1,9]; m.hint="💡 تفاعلي: الكود هو 3**9. | 📝 كتابي: لا يمكنك البوح به."; }
            else if(i===4) { m.uiType = 'MATCH'; m.desc="تطابق الأشكال: 20 شريحة."; m.data=['🪐','☄️','🌑','🔭','🛸','🛰️','🌌','🌠','🚀','👨‍🚀']; m.hint="💡 تفاعلي: احفظ الأماكن. | 📝 كتابي: يزيد ولا ينقص."; }
            else if(i===5) { m.uiType = 'COMPASS_3X'; m.desc="توجيه البوصلات الثلاث."; m.ans=[135, 225, 45]; m.hint="💡 تفاعلي: أسفل، أسفل، أعلى. | 📝 كتابي: يرتد لك من الجدار."; }
            else if(i===8) { m.uiType = 'MACRO_IMAGE'; m.desc="غرفة الظلال: الكشاف الرقمي."; m.ans='خشب'; m.hint="💡 تفاعلي: ركز على المادة. | 📝 كتابي: تقطعه لتفي به."; }
            else if(i===9) { m.uiType = 'PAPYRUS_HARD'; m.desc="لفافة البردي: اجمع الأحرف."; m.ans='SOUL CALL OLD'; m.hint="💡 تفاعلي: الكلمة هي S**L C*** **D. | 📝 كتابي: لغته السكوت."; }
            else if(i===12) { m.uiType = 'JUGS'; m.desc="دوارق الكيمياء."; m.hint="💡 تفاعلي: فكر كويس. | 📝 كتابي: ترسم العالم."; }
            else if(i===13) { m.uiType = 'HARD_SEQUENCE'; m.desc="القفل التسلسلي الأعمى."; m.hint="💡 تفاعلي: احفظ المسار. | 📝 كتابي: تعرف بها الوقت."; }
            else if(i===15) { m.uiType = 'BLIND_MAZE'; m.desc="متاهة المينوتور."; m.data=36; m.ans=[0,6,12,13,14,20,26,32,33,34,35]; m.hint="💡 تفاعلي: تحت 3 مرات. | 📝 كتابي: صيفي ولذيذ."; }
            else if(i===24) { m.uiType = 'KEYPAD_HARD'; m.desc="خزنة الكيبورد."; m.ans='1936'; m.hint="💡 تفاعلي: الكود هو 1***. | 📝 كتابي: ينادونك به."; }

            // --- الألعاب الجديدة والمعدلة (حسب طلبك الأخير) ---
            
            else if(i===6) { m.uiType = 'CCTV_GRID'; m.desc="المراقبة الأمنية: أحد الكاميرات الأربع ستعرض طيفاً غريباً لجزء من الثانية. اصطده 3 مرات."; m.hint="💡 تفاعلي: راقب الكاميرا السفلية يمين. | 📝 كتابي: كائن بحري يمتص."; }
            else if(i===7) { m.uiType = 'SWISS_SAFE'; m.desc="الخزنة السويسرية: أدر القرص لليسار ولليمين للوصول للأرقام السرية بدقة تامة."; m.ans=[30, 85, 15]; m.hint="💡 تفاعلي: 30، 85، 15. | 📝 كتابي: يأتي غداً."; }
            else if(i===10) { m.uiType = 'CRYPTO_CHART'; m.desc="لوحة التداول: أحد الأسهم الأربعة يتحرك عكس تيار السوق. اضغط عليه قبل الانهيار."; m.hint="💡 تفاعلي: السهم الثالث. | 📝 كتابي: قشرتها هشة."; }
            else if(i===11) { m.uiType = 'AUDIO_MIXER'; m.desc="استوديو الصوت: ارفع ونزل المسارات الأربعة لتطابق التردد المخفي (100, 25, 75, 0)."; m.hint="💡 تفاعلي: المسار الأول للأعلى تماماً والأخير للأسفل. | 📝 كتابي: تنشفك وتتبلل."; }
            
            else if(i===14) { m.uiType = 'LASER_ROUTE'; m.desc="توجيه الطاقة: قم بتفعيل المفاتيح الأربعة بترتيب منطقي لإيصال الطاقة للمركز."; m.ans=[0,2,3,1]; m.hint="💡 تفاعلي: جرب الأطراف أولاً. | 📝 كتابي: يمطر."; }
            
            else if(i===16) { m.uiType = 'CAESAR_INTERACTIVE'; m.desc="شفرة قيصر التفاعلية: حرك كل حرف للأعلى أو للأسفل لاستخراج الكلمة الأصلية."; m.ans='ECLIPSE'; m.hint="💡 تفاعلي: الكلمة هي ECLIPSE. | 📝 كتابي: يثبت الأشياء."; }
            
            else if(i===17) { m.uiType = 'MIRROR_ROUNDS'; m.desc="من أنا (3 جولات): اجمع التلميحات واكتب اسم الشاعر في كل جولة."; m.hint="💡 تفاعلي: المتنبي، عنترة، البدر. | 📝 كتابي: أداة الكتابة."; }
            
            else if(i===18) { m.uiType = 'POLYGRAPH'; m.desc="كشف الكذب: اضغط لتوجيه الأسئلة الأربعة للمشتبه به، وراقب أي سؤال يسبب اضطراباً في نبضه."; m.hint="💡 تفاعلي: السؤال الثالث هو الكذبة. | 📝 كتابي: يتبعك بالشمس."; }
            else if(i===19) { m.uiType = 'RADAR_PING'; m.desc="الرادار الخفي: نقطة حمراء تظهر لثانية في أحد المربعات المحيطة بالرادار. حدد مكانها."; m.hint="💡 تفاعلي: في الربع العلوي الأيسر. | 📝 كتابي: تدل على الشمال."; }
            else if(i===20) { m.uiType = 'MORSE_TAP'; m.desc="شفرة مورس: انقر لإدخال رسالة الاستغاثة (S O S) بالنقطة والشرطة (... --- ...)."; m.ans='...---...'; m.hint="💡 تفاعلي: 3 قصار، 3 طوال، 3 قصار. | 📝 كتابي: لا تُرى."; }
            
            else if(i===21) { m.uiType = 'CAPCUT_HARD'; m.desc="التايم لاين المتقدم: 5 مسارات مختلفة، حركها بدقة متناهية ليتطابق التزامن بنسبة 100%."; m.hint="💡 تفاعلي: المسار الأول 15، الثاني 45. | 📝 كتابي: تخاف من الماء."; }
            
            else if(i===22) { m.uiType = 'GEAR_SYNC'; m.desc="تزامن التروس: 3 تروس تدور بسرعات مختلفة. اضغط (اشتباك) عندما تتجه كل العلامات الحمراء للأعلى معاً."; m.hint="💡 تفاعلي: انتظر حوالي 12 ثانية لتتزامن. | 📝 كتابي: تكبر كلما أخذت منها."; }
            else if(i===23) { m.uiType = 'FINGERPRINT'; m.desc="البصمة الجنائية: طابق البصمة المركزية مع البصمة الوحيدة المطابقة لها من بين الخيارات."; m.hint="💡 تفاعلي: البصمة رقم 2. | 📝 كتابي: يقرصك ببطنك."; }
            
            else if(i===25) { m.uiType = 'DETECTIVE_CLICK'; m.desc="ملف القضية #911: اقرأ القصة جيداً، واضغط (Click) على 3 كلمات من النص تمثل تناقضاً مستحيلاً في القصة."; m.hint="💡 تفاعلي: تناقض في الوقت والطقس. | 📝 كتابي: تتركها وراءك."; }

            m.txtQ = riddles[i-1].q;
            m.txtA = riddles[i-1].a;
            mechanics.push(m);
        }
        return mechanics;
    }

    // [باقي دوال الوقت والعملات وبناء اللوبي كما هي]
    toggleGlobalTimer() { this.playSound('click'); this.isTimerRunning = !this.isTimerRunning; this.showToast(this.isTimerRunning ? "تم تشغيل العداد العام" : "تم إيقاف العداد العام"); }
    modifyGlobalTimer(secs) { this.playSound('click'); this.globalTime = Math.max(0, this.globalTime + secs); this.updateGlobalTimerUI(); }
    updateGlobalTimerUI() {
        let h = Math.floor(this.globalTime / 3600).toString().padStart(2,'0'); let m = Math.floor((this.globalTime % 3600) / 60).toString().padStart(2,'0'); let s = (this.globalTime % 60).toString().padStart(2,'0');
        let display1 = document.getElementById('global-timer-display'); let display2 = document.getElementById('market-time'); let display3 = document.getElementById('puzzle-global-timer');
        if(display1) { display1.innerText = `${h}:${m}:${s}`; display1.style.color = this.timeFrozen ? '#00ccff' : '#fff'; } if(display2) { display2.innerText = `${h}:${m}:${s}`; } if(display3) { display3.innerText = `${h}:${m}:${s}`; display3.style.color = this.timeFrozen ? '#00ccff' : '#fff'; }
    }
    addCoins(amount) { this.playSound('click'); this.coins = Math.max(0, this.coins + amount); this.updateCoinsUI(); if(amount > 0) this.showToast(`تم استخراج ${amount} بيانات!`); else this.showToast(`تم خصم ${Math.abs(amount)} بيانات!`, '#ff3333'); }
    updateCoinsUI() { document.getElementById('coin-val').innerText = this.coins; document.getElementById('market-coins').innerText = this.coins; }
    toggleMarket(show) { this.playSound('click'); const mk = document.getElementById('market-modal'); if(show) { mk.classList.remove('hidden'); this.updateCoinsUI(); this.updateGlobalTimerUI(); } else mk.classList.add('hidden'); }
    buyHint(type) {
        this.playSound('click'); if(!this.activeGate) { this.showToast('يجب أن تكون داخل روم!', '#ff3333'); return; }
        if(type === 'coins') { if(this.coins >= 60) { this.coins -= 60; this.showToast('تم فك التشفير بنجاح!'); this.displayHint(); } else { this.showToast('بيانات غير كافية!', '#ff3333'); } } 
        else if (type === 'time') { if(this.globalTime > 300) { this.globalTime -= 300; this.showToast('تم الشراء بخصم 5 دقائق!'); this.displayHint(); } else { this.showToast('الوقت لا يكفي!', '#ff3333'); } }
        this.updateCoinsUI(); this.updateGlobalTimerUI();
    }
    buyFreeze() { this.playSound('click'); if(this.coins >= 40) { if(this.timeFrozen) { this.showToast('مجمد مسبقاً!', '#ff3333'); return; } this.coins -= 40; this.timeFrozen = true; this.updateGlobalTimerUI(); this.showToast('❄️ تم تجميد الحماية!', '#00ccff'); setTimeout(() => { this.timeFrozen = false; this.updateGlobalTimerUI(); this.showToast('انتهى التجميد!', '#ff3333'); }, 120000); } else { this.showToast('بيانات غير كافية!', '#ff3333'); } this.updateCoinsUI(); }
    displayHint() {
        this.toggleMarket(false); const hd = document.getElementById('hint-display'); const hintParts = this.activeGate.hint.split('|');
        let interactiveHint = hintParts[0] ? hintParts[0].replace('💡 تفاعلي:', '').trim() : 'لا يوجد تلميح للعبة.'; let textHint = hintParts[1] ? hintParts[1].replace('📝 كتابي:', '').trim() : 'لا يوجد تلميح للغز.';
        hd.innerHTML = `<div style="border-bottom:1px solid var(--gold); padding-bottom:10px; margin-bottom:10px; color:var(--gold);"><strong style="color:#fff;">تلميح اللعبة التفاعلية:</strong><br>${interactiveHint}</div><div style="color:var(--gold);"><strong style="color:#fff;">تلميح اللغز الكتابي:</strong><br>${textHint}</div>`; hd.classList.remove('hidden');
    }
    switchScreen(id) { document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden')); document.getElementById(`screen-${id}`).classList.remove('hidden'); document.getElementById('main-nav').classList.toggle('hidden', id === 'welcome'); }
    startLobby() { this.initAudio(); this.playSound('click'); this.isTimerRunning = true; this.switchScreen('lobby'); }
    renderLobby() {
        const c = document.getElementById('gates-container'); c.innerHTML = '';
        for(let i=1; i<=25; i++) {
            let btn = document.createElement('div'); let isSolved = this.solvedGates.has(i); let isLocked = i !== 1 && !this.solvedGates.has(i - 1); let isNext = !isSolved && !isLocked; 
            btn.className = `channel-card ${isSolved ? 'solved' : ''} ${isLocked ? 'locked' : ''} ${isNext ? 'unlocked-next' : ''}`;
            let info = document.createElement('div'); info.className = 'channel-info';
            let title = document.createElement('h3'); title.innerText = `CHANNEL-${i.toString().padStart(2, '0')}`;
            let status = document.createElement('span'); status.className = 'channel-status';
            if(isNext) { status.innerText = 'BYPASS REQUIRED'; status.style.color = 'var(--gold)'; } else if(isSolved) { status.innerText = 'HACKED'; status.style.color = 'var(--green)'; } else { status.innerText = 'ENCRYPTED'; status.style.color = '#555'; }
            info.append(title, status); btn.appendChild(info);
            btn.addEventListener('click', () => { if(!isLocked) this.handleGateClick(i); }); c.appendChild(btn);
        }
    }

    handleGateClick(id) {
        if(this.solvedGates.has(id)) return;
        this.activeGate = this.gameConfig.find(x => x.id === id);
        document.getElementById('interactive-stage-container').classList.remove('hidden');
        document.getElementById('text-stage').classList.add('hidden');
        document.getElementById('input-area').classList.add('hidden');
        document.getElementById('user-input').value = '';
        const hd = document.getElementById('hint-display'); hd.classList.add('hidden'); hd.innerHTML = '';
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
            let wrap = document.createElement('div'); wrap.style.cssText = 'width:100%; display:flex; flex-direction:column; align-items:center; z-index:10;';
            let inp = document.createElement('input'); inp.type = 'text'; inp.className = 'cyber-input'; inp.placeholder = placeholder;
            inp.style.cssText = 'background: #000; border: 2px solid var(--gold); color: var(--gold); padding: 15px; font-size: 1.8rem; text-align: center; width: 100%; max-width: 400px; outline: none; box-shadow: inset 0 0 20px rgba(212,175,55,0.2); letter-spacing: 2px; font-family: monospace; border-radius: 8px; margin-top:20px;';
            wrap.append(inp, generateSubmitButton(() => { if(inp.value.trim().toUpperCase() === ans.toUpperCase()) this.winInteractive(); else this.failRoom(); }));
            innerStage.appendChild(wrap); return inp;
        };

        switch(p.uiType) {
            // [الألعاب الثابتة القديمة تم اختصار كودها هنا للحفاظ على مساحة الرد، هي نفس الكود السابق بالضبط]
            case 'WIRES': /* ...Same as before... */ break; case 'SIMON': /* ...Same... */ break; case 'MASTERMIND': /* ...Same... */ break; case 'MATCH': /* ...Same... */ break; case 'COMPASS_3X': /* ...Same... */ break; case 'MACRO_IMAGE': /* ...Same... */ break; case 'PAPYRUS_HARD': /* ...Same... */ break; case 'JUGS': /* ...Same... */ break; case 'HARD_SEQUENCE': /* ...Same... */ break; case 'BLIND_MAZE': /* ...Same... */ break; case 'KEYPAD_HARD': /* ...Same... */ break;

            // ==========================================
            // الألعاب الجديدة والمعدلة
            // ==========================================

            case 'CCTV_GRID': {
                let cctvWrap = document.createElement('div'); cctvWrap.style.cssText = 'display:grid; grid-template-columns:1fr 1fr; gap:10px; width:300px; height:300px;';
                let cams = []; let catchCount = 0;
                for(let i=0; i<4; i++) {
                    let cam = document.createElement('div'); cam.className = 'cctv-cam';
                    cam.style.cssText = 'background:#111; border:2px solid #333; position:relative; overflow:hidden; cursor:crosshair;';
                    let noise = document.createElement('div'); noise.style.cssText = 'position:absolute; width:100%; height:100%; background:repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px); opacity:0.3; pointer-events:none;';
                    let glitch = document.createElement('div'); glitch.style.cssText = 'position:absolute; width:30px; height:30px; background:#ff0000; border-radius:50%; top:50%; left:50%; transform:translate(-50%, -50%); opacity:0; pointer-events:none; box-shadow:0 0 20px #ff0000;';
                    cam.append(noise, glitch);
                    cam.onclick = () => {
                        if(glitch.style.opacity === '1') {
                            this.playSound('success'); catchCount++; glitch.style.opacity = '0';
                            if(catchCount === 3) this.winInteractive();
                        } else { this.failRoom(); catchCount = 0; }
                    };
                    cams.push(glitch); cctvWrap.appendChild(cam);
                }
                let statusMsg = document.createElement('div'); statusMsg.style.cssText = 'color:var(--gold); font-family:monospace; margin-bottom:15px; font-size:1.2rem;'; statusMsg.innerText = 'STATUS: AWAITING ANOMALY...';
                innerStage.append(statusMsg, cctvWrap);
                
                this.stageState.timer = setInterval(() => {
                    let rCam = Math.floor(Math.random() * 4);
                    cams[rCam].style.opacity = '1';
                    setTimeout(() => { cams[rCam].style.opacity = '0'; }, 600);
                }, 2000);
                break;
            }

            case 'SWISS_SAFE': {
                let sWrap = document.createElement('div'); sWrap.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:30px;';
                let dial = document.createElement('div'); dial.style.cssText = 'width:150px; height:150px; border-radius:50%; background:radial-gradient(circle, #333, #000); border:10px solid #D4AF37; display:flex; justify-content:center; position:relative; box-shadow:0 10px 30px rgba(0,0,0,0.8); transition:transform 0.2s;';
                let tick = document.createElement('div'); tick.style.cssText = 'width:6px; height:20px; background:#ff3333; position:absolute; top:0;'; dial.appendChild(tick);
                let valDisp = document.createElement('div'); valDisp.style.cssText = 'font-size:3rem; color:var(--gold); font-family:monospace; font-weight:bold;'; valDisp.innerText = '00';
                
                let controls = document.createElement('div'); controls.style.cssText = 'display:flex; gap:20px;';
                let step = 0; let currentAngle = 0;
                ['◄ LEFT', 'RIGHT ►'].forEach((dir, idx) => {
                    let btn = document.createElement('button'); btn.innerText = dir; btn.style.cssText = 'padding:10px 20px; background:#111; color:#fff; border:2px solid #555; border-radius:4px; font-size:1.2rem; cursor:pointer;';
                    btn.onclick = () => {
                        this.playSound('click');
                        currentAngle += (idx === 0 ? -5 : 5);
                        let norm = ((currentAngle % 100) + 100) % 100;
                        dial.style.transform = `rotate(${currentAngle * 3.6}deg)`; valDisp.innerText = norm.toString().padStart(2,'0');
                    };
                    controls.appendChild(btn);
                });
                
                let checkBtn = generateSubmitButton(() => {
                    let norm = ((currentAngle % 100) + 100) % 100;
                    if(norm === p.ans[step]) {
                        this.playSound('success'); step++; valDisp.style.color = '#00ff66'; setTimeout(()=>valDisp.style.color = 'var(--gold)', 500);
                        if(step === 3) this.winInteractive();
                    } else { this.failRoom(); step = 0; currentAngle = 0; dial.style.transform = `rotate(0deg)`; valDisp.innerText = '00'; }
                }, 'إدخال الرقم (ENTER)');
                
                sWrap.append(valDisp, dial, controls, checkBtn); innerStage.appendChild(sWrap);
                break;
            }

            case 'CRYPTO_CHART': {
                let chartWrap = document.createElement('div'); chartWrap.style.cssText = 'display:grid; grid-template-columns:1fr 1fr; gap:15px; width:100%; max-width:500px;';
                let fakeIdx = Math.floor(Math.random() * 4);
                for(let i=0; i<4; i++) {
                    let cBox = document.createElement('div'); cBox.style.cssText = 'background:#111; border:2px solid #333; padding:10px; border-radius:6px; cursor:pointer; text-align:center; transition:0.2s;';
                    let pathData = (i === fakeIdx) ? "M0,40 L20,30 L40,50 L60,10 L80,20 L100,5" : "M0,40 L20,50 L40,30 L60,50 L80,30 L100,45";
                    let color = (i === fakeIdx) ? "#00ff66" : "#ff3333";
                    cBox.innerHTML = `<div style="color:#aaa; margin-bottom:5px; font-family:monospace;">COIN_0${i+1}</div><svg width="100%" height="60" viewBox="0 0 100 60" preserveAspectRatio="none"><path d="${pathData}" fill="none" stroke="${color}" stroke-width="3"/></svg>`;
                    cBox.onclick = () => { if(i === fakeIdx) this.winInteractive(); else { this.failRoom(); this.setupStage(); } };
                    chartWrap.appendChild(cBox);
                }
                innerStage.appendChild(chartWrap);
                break;
            }

            case 'AUDIO_MIXER': {
                let mWrap = document.createElement('div'); mWrap.style.cssText = 'display:flex; gap:30px; align-items:center; height:200px; padding:20px; background:#111; border-radius:8px; border:2px solid #333;';
                let targets = [100, 25, 75, 0]; let sliders = [];
                for(let i=0; i<4; i++) {
                    let track = document.createElement('div'); track.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:10px; height:100%;';
                    let s = document.createElement('input'); s.type = 'range'; s.min = 0; s.max = 100; s.value = 50; s.style.cssText = 'writing-mode: bt-lr; -webkit-appearance: slider-vertical; width:8px; height:100%; cursor:pointer;';
                    s.oninput = () => { this.playSound('click'); };
                    let led = document.createElement('div'); led.style.cssText = 'width:12px; height:12px; border-radius:50%; background:#333; border:1px solid #111;';
                    track.append(s, led); mWrap.appendChild(track); sliders.push({s, led});
                }
                let checkBtn = generateSubmitButton(() => {
                    let win = true;
                    sliders.forEach((sl, i) => {
                        if(Math.abs(sl.s.value - targets[i]) < 5) { sl.led.style.background = '#00ff66'; sl.led.style.boxShadow = '0 0 10px #00ff66'; }
                        else { sl.led.style.background = '#ff3333'; win = false; }
                    });
                    if(win) setTimeout(()=>this.winInteractive(), 500); else this.failRoom();
                }, 'SYNC FREQUENCIES');
                innerStage.append(mWrap, checkBtn);
                break;
            }

            case 'LASER_ROUTE': {
                let rWrap = document.createElement('div'); rWrap.style.cssText = 'display:flex; gap:15px; margin-bottom:20px;';
                let state = [0,0,0,0]; let nodes = [];
                for(let i=0; i<4; i++) {
                    let n = document.createElement('div'); n.style.cssText = 'width:60px; height:60px; background:#111; border:2px solid #555; border-radius:8px; cursor:pointer; transition:0.3s; display:flex; justify-content:center; align-items:center; color:#555; font-weight:bold; font-size:1.5rem;'; n.innerText = i+1;
                    n.onclick = () => {
                        this.playSound('click');
                        state[i] = 1 - state[i];
                        n.style.background = state[i] ? 'var(--gold)' : '#111'; n.style.color = state[i] ? '#000' : '#555';
                        if(JSON.stringify(state) === JSON.stringify(p.ans)) setTimeout(()=>this.winInteractive(), 500);
                    };
                    nodes.push(n); rWrap.appendChild(n);
                }
                innerStage.appendChild(rWrap);
                break;
            }

            case 'CAESAR_INTERACTIVE': {
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:flex; gap:10px; margin-top:20px;';
                let startWord = ['L','J','S','P','W','Z','L']; 
                let current = [...startWord];
                let alph = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                
                for(let i=0; i<7; i++) {
                    let col = document.createElement('div'); col.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:5px;';
                    let btnUp = document.createElement('button'); btnUp.innerText = '▲'; btnUp.style.cssText = 'background:#222; color:var(--gold); border:1px solid #555; cursor:pointer; padding:5px 10px; border-radius:4px;';
                    let btnDn = document.createElement('button'); btnDn.innerText = '▼'; btnDn.style.cssText = 'background:#222; color:var(--gold); border:1px solid #555; cursor:pointer; padding:5px 10px; border-radius:4px;';
                    let disp = document.createElement('div'); disp.style.cssText = 'width:40px; height:50px; background:#000; border:2px solid var(--gold); display:flex; justify-content:center; align-items:center; font-size:1.8rem; font-weight:bold; color:#fff; font-family:monospace;'; disp.innerText = current[i];
                    
                    const shift = (dir) => {
                        this.playSound('click');
                        let idx = alph.indexOf(current[i]);
                        current[i] = alph[((idx + dir) % 26 + 26) % 26];
                        disp.innerText = current[i];
                    };
                    btnUp.onclick = () => shift(1); btnDn.onclick = () => shift(-1);
                    col.append(btnUp, disp, btnDn); wrap.appendChild(col);
                }
                
                let btn = generateSubmitButton(() => {
                    if(current.join('') === p.ans) this.winInteractive(); else this.failRoom();
                }, 'فك التشفير');
                
                innerStage.append(wrap, btn);
                break;
            }

            case 'MIRROR_ROUNDS': {
                this.stageState.round = 1;
                let poets = [
                    { clues: ['سيف الدولة', 'أبو الطيب', 'الخيل والليل', 'قتلني شعري'], ans: 'المتنبي' },
                    { clues: ['عبس', 'الفروسية', 'جاهلي', 'عبلة'], ans: 'عنترة' },
                    { clues: ['مهندس الكلمة', 'زمان الصمت', 'البدر', 'أرفض المسافة'], ans: 'بدر بن عبدالمحسن' }
                ];
                let roundDisp = document.createElement('h3'); roundDisp.style.cssText = 'color:var(--gold); margin-bottom:15px;';
                let mirWrap = document.createElement('div'); mirWrap.style.cssText = 'display:flex; flex-wrap:wrap; width:350px; gap:10px; justify-content:center; margin-bottom:20px;';
                let inp = createInputBlock('اسم الشاعر...', '');
                
                const loadRound = () => {
                    roundDisp.innerText = `-- الجولة ${this.stageState.round} من 3 --`;
                    mirWrap.innerHTML = ''; inp.value = '';
                    poets[this.stageState.round-1].clues.forEach(clue => {
                        let shard = document.createElement('div'); shard.className = 'shard-btn';
                        shard.style.cssText = 'width:160px; height:70px; background:linear-gradient(135deg, #222, #111); border:1px solid #555; display:flex; justify-content:center; align-items:center; text-align:center; font-weight:bold; cursor:pointer; color:transparent; transition:0.3s; clip-path: polygon(10% 0, 100% 10%, 90% 100%, 0 90%); user-select:none;';
                        shard.onclick = () => { shard.style.color = '#000'; shard.innerText = clue; shard.style.background = 'linear-gradient(135deg, var(--gold), #fff)'; };
                        mirWrap.appendChild(shard);
                    });
                };
                
                inp.oninput = () => {
                    if(inp.value.trim() === poets[this.stageState.round-1].ans) {
                        this.playSound('success'); this.stageState.round++;
                        if(this.stageState.round > 3) this.winInteractive(); else loadRound();
                    }
                };
                
                // remove the auto-generated execute button from createInputBlock
                innerStage.lastChild.lastChild.style.display = 'none';
                innerStage.insertBefore(roundDisp, innerStage.firstChild);
                innerStage.insertBefore(mirWrap, innerStage.children[1]);
                loadRound();
                break;
            }

            case 'POLYGRAPH': {
                let pWrap = document.createElement('div'); pWrap.style.cssText = 'width:100%; max-width:500px; display:flex; flex-direction:column; align-items:center; gap:20px;';
                let graph = document.createElement('div'); graph.style.cssText = 'width:100%; height:100px; background:#000; border:2px solid #333; overflow:hidden; position:relative; display:flex; align-items:center; box-shadow:inset 0 0 20px rgba(0,255,100,0.1);';
                let line = document.createElement('svg'); line.style.cssText = 'width:100%; height:100%;'; line.innerHTML = `<polyline points="0,50 100,50 120,20 140,80 160,50 500,50" fill="none" stroke="#00ff66" stroke-width="2"/>`;
                graph.appendChild(line);
                
                let qWrap = document.createElement('div'); qWrap.style.cssText = 'display:flex; gap:10px;';
                let targetQ = 2; // Q3
                for(let i=0; i<4; i++) {
                    let btn = document.createElement('button'); btn.innerText = `سؤال ${i+1}`; btn.style.cssText = 'padding:10px 20px; background:#111; color:#fff; border:1px solid #555; cursor:pointer;';
                    btn.onclick = () => {
                        this.playSound('click');
                        if(i === targetQ) { line.innerHTML = `<polyline points="0,50 50,50 80,10 100,90 120,0 140,100 160,50 500,50" fill="none" stroke="#ff3333" stroke-width="3"/>`; graph.style.boxShadow = 'inset 0 0 30px rgba(255,0,0,0.4)'; }
                        else { line.innerHTML = `<polyline points="0,50 100,50 120,40 140,60 160,50 500,50" fill="none" stroke="#00ff66" stroke-width="2"/>`; graph.style.boxShadow = 'inset 0 0 20px rgba(0,255,100,0.1)'; }
                        setTimeout(()=> { line.innerHTML = `<polyline points="0,50 500,50" fill="none" stroke="#00ff66" stroke-width="2"/>`; graph.style.boxShadow = 'inset 0 0 20px rgba(0,255,100,0.1)'; }, 1000);
                    };
                    qWrap.appendChild(btn);
                }
                let inp = createInputBlock('رقم السؤال الكاذب (مثال: 3)...', '3');
                pWrap.append(graph, qWrap); innerStage.insertBefore(pWrap, innerStage.lastChild);
                break;
            }

            case 'RADAR_PING': {
                let radWrap = document.createElement('div'); radWrap.style.cssText = 'position:relative; width:200px; height:200px; border-radius:50%; background:radial-gradient(circle, #003300, #000); border:4px solid #00ff66; overflow:hidden; box-shadow:0 0 30px rgba(0,255,100,0.2); margin-bottom:20px;';
                let sweep = document.createElement('div'); sweep.style.cssText = 'position:absolute; top:0; left:50%; width:50%; height:50%; background:linear-gradient(to right, rgba(0,255,100,0), rgba(0,255,100,0.8)); transform-origin:bottom left; animation: radarSpin 2s linear infinite;';
                
                let css = document.createElement('style'); css.innerHTML = `@keyframes radarSpin { 100% { transform: rotate(360deg); } }`; document.head.appendChild(css);
                let dot = document.createElement('div'); dot.style.cssText = 'position:absolute; width:10px; height:10px; background:#ff0000; border-radius:50%; top:40px; left:40px; opacity:0; box-shadow:0 0 10px #ff0000;';
                
                radWrap.append(sweep, dot); innerStage.appendChild(radWrap);
                let inp = createInputBlock('رقم الربع (1 أعلى يمين، 2 أعلى يسار...الخ)', '2');
                
                this.stageState.timer = setInterval(() => {
                    dot.style.opacity = '1'; setTimeout(() => dot.style.opacity = '0', 200);
                }, 2000);
                break;
            }

            case 'MORSE_TAP': {
                let mWrap = document.createElement('div'); mWrap.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:20px;';
                let disp = document.createElement('div'); disp.style.cssText = 'height:60px; min-width:200px; background:#000; border:2px solid var(--gold); color:#fff; font-size:2rem; letter-spacing:5px; display:flex; justify-content:center; align-items:center; font-family:monospace;';
                
                let controls = document.createElement('div'); controls.style.cssText = 'display:flex; gap:20px;';
                ['• (Short)', '— (Long)'].forEach((lbl, i) => {
                    let btn = document.createElement('button'); btn.innerText = lbl; btn.style.cssText = 'padding:15px 30px; background:#222; color:var(--gold); border:2px solid var(--gold); font-size:1.5rem; font-weight:bold; cursor:pointer; border-radius:8px;';
                    btn.onclick = () => {
                        this.playSound('click'); this.stageState.val = (this.stageState.val || '') + (i===0 ? '.' : '-');
                        disp.innerText = this.stageState.val;
                        if(this.stageState.val === p.ans) setTimeout(()=>this.winInteractive(), 500);
                        else if(this.stageState.val.length >= p.ans.length) { this.failRoom(); this.stageState.val = ''; disp.innerText = ''; }
                    };
                    controls.appendChild(btn);
                });
                mWrap.append(disp, controls); innerStage.appendChild(mWrap);
                break;
            }

            case 'CAPCUT_HARD': {
                let ccWrap = document.createElement('div'); ccWrap.style.cssText = 'width:100%; max-width:500px; display:flex; flex-direction:column; gap:15px; background:#111; padding:20px; border-radius:8px; border:1px solid #333; margin-bottom:20px;';
                let targets = [15, 80, 45, 90, 20]; let sliders = [];
                let syncDisp = document.createElement('div'); syncDisp.style.cssText = 'color:var(--gold); font-family:monospace; font-size:1.5rem; text-align:center; margin-bottom:10px;'; syncDisp.innerText = 'SYNC: 0%';
                ccWrap.appendChild(syncDisp);
                
                ['VIDEO', 'AUDIO 1', 'AUDIO 2', 'B-ROLL', 'FX'].forEach((lbl, i) => {
                    let tRow = document.createElement('div'); tRow.style.cssText = 'display:flex; align-items:center; gap:10px; height:30px;';
                    let tName = document.createElement('div'); tName.style.cssText = 'width:70px; color:#888; font-size:0.8rem; font-weight:bold;'; tName.innerText = lbl;
                    let s = document.createElement('input'); s.type = 'range'; s.min = 0; s.max = 100; s.value = 50; s.style.cssText = 'flex-grow:1; cursor:pointer;';
                    s.oninput = () => {
                        this.playSound('click');
                        let diff = 0; sliders.forEach((sl, idx) => { diff += Math.abs(sl.value - targets[idx]); });
                        let sync = Math.max(0, 100 - (diff / 2)); syncDisp.innerText = `SYNC: ${Math.floor(sync)}%`;
                        if(sync === 100) { syncDisp.style.color = '#00ff66'; setTimeout(()=>this.winInteractive(), 500); }
                    };
                    sliders.push(s); tRow.append(tName, s); ccWrap.appendChild(tRow);
                });
                innerStage.appendChild(ccWrap);
                break;
            }

            case 'GEAR_SYNC': {
                let gWrap = document.createElement('div'); gWrap.style.cssText = 'display:flex; gap:20px; margin-bottom:30px;';
                let angles = [0, 0, 0]; let speeds = [2, 3, 1.5]; // degrees per tick
                let gears = [];
                for(let i=0; i<3; i++) {
                    let g = document.createElement('div'); g.style.cssText = 'width:80px; height:80px; border-radius:50%; border:6px dashed #555; position:relative; background:radial-gradient(circle, #222, #000);';
                    let mark = document.createElement('div'); mark.style.cssText = 'position:absolute; width:10px; height:20px; background:#ff3333; top:0; left:35px; border-radius:4px;';
                    g.appendChild(mark); gears.push(g); gWrap.appendChild(g);
                }
                
                this.stageState.timer = setInterval(() => {
                    for(let i=0; i<3; i++) { angles[i] = (angles[i] + speeds[i]) % 360; gears[i].style.transform = `rotate(${angles[i]}deg)`; }
                }, 20);
                
                let btn = generateSubmitButton(() => {
                    let synced = angles.every(a => a < 15 || a > 345);
                    if(synced) this.winInteractive(); else this.failRoom();
                }, 'إشتباك (ENGAGE)');
                innerStage.append(gWrap, btn);
                break;
            }

            case 'FINGERPRINT': {
                let fWrap = document.createElement('div'); fWrap.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:20px;';
                let mainFP = document.createElement('div'); mainFP.style.cssText = 'width:100px; height:120px; border:2px solid var(--gold); border-radius:50px 50px 20px 20px; background:repeating-radial-gradient(ellipse at center, transparent, transparent 4px, var(--gold) 5px, var(--gold) 6px); box-shadow:0 0 20px rgba(212,175,55,0.3);';
                
                let suspects = document.createElement('div'); suspects.style.cssText = 'display:flex; gap:15px;';
                let targetIdx = 1; // 2nd fingerprint
                for(let i=0; i<4; i++) {
                    let sBox = document.createElement('div'); sBox.style.cssText = 'width:60px; height:80px; border:2px solid #444; border-radius:30px 30px 10px 10px; cursor:pointer; transition:0.2s;';
                    if(i === targetIdx) sBox.style.background = 'repeating-radial-gradient(ellipse at center, transparent, transparent 4px, var(--gold) 5px, var(--gold) 6px)';
                    else sBox.style.background = 'repeating-radial-gradient(ellipse at center, transparent, transparent 5px, var(--gold) 6px, var(--gold) 7px)';
                    sBox.onclick = () => { if(i === targetIdx) this.winInteractive(); else { this.failRoom(); } };
                    suspects.appendChild(sBox);
                }
                fWrap.append(mainFP, suspects); innerStage.appendChild(fWrap);
                break;
            }

            case 'DETECTIVE_CLICK': {
                let dWrap = document.createElement('div'); dWrap.style.cssText = 'width:100%; max-width:600px; background:#1a1a1a; padding:30px; border-left:5px solid var(--gold); border-radius:8px; color:#ddd; font-size:1.4rem; line-height:2; box-shadow:inset 0 0 30px #000; margin-bottom:20px; font-family:"Traditional Arabic", serif; text-align:right; direction:rtl;';
                
                dWrap.innerHTML = `أفاد المتهم في شهادته: "غادرت مكتبي الساعة <span class="case-word" data-ans="0">الخامسة عصراً</span>، وتوجهت لسيارتي، كانت السماء <span class="case-word" data-ans="1">تمطر بغزارة</span>. قمت بتشغيل <span class="case-word" data-ans="0">المذياع</span> للاستماع للأخبار، ثم توقفت عند المقهى. شربت قهوتي تحت أشعة <span class="case-word" data-ans="1">الشمس الحارقة</span>، وعدت للمنزل. في المساء، ارتديت <span class="case-word" data-ans="1">نظارتي الشمسية</span> ونزلت للقبو المظلم لأتفقد الخزنة، وهناك اكتشفت السرقة."`;
                
                let selectedWords = new Set();
                dWrap.querySelectorAll('.case-word').forEach((el, index) => {
                    el.style.cssText = 'color:var(--gold); cursor:pointer; text-decoration:underline dashed #555; padding:0 5px; transition:0.2s;';
                    el.onclick = () => {
                        this.playSound('click');
                        if(selectedWords.has(index)) { selectedWords.delete(index); el.style.background = 'transparent'; el.style.color = 'var(--gold)'; }
                        else { selectedWords.add(index); el.style.background = 'var(--gold)'; el.style.color = '#000'; }
                    };
                });
                
                let btn = generateSubmitButton(() => {
                    let targets = [];
                    dWrap.querySelectorAll('.case-word').forEach((el, i) => { if(el.dataset.ans === "1") targets.push(i); });
                    let isWin = targets.length === selectedWords.size && targets.every(t => selectedWords.has(t));
                    if(isWin) this.winInteractive(); else this.failRoom();
                }, 'تقديم الأدلة للنيابة');
                
                innerStage.append(dWrap, btn);
                break;
            }

            default:
                let defaultMsg = document.createElement('div'); defaultMsg.style.cssText = "color:#D4AF37; font-family:monospace; font-size:1.5rem;"; defaultMsg.innerText = "Error: Protocol Missing"; innerStage.appendChild(defaultMsg);
                break;
        }
    }

    winInteractive() {
        if(this.stageState.timer) clearInterval(this.stageState.timer);
        this.stageState.playing = false;
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
        this.playSound('click'); if(!this.activeGate) return;
        this.toggleAdminSidebar(false); this.solvedGates.add(this.activeGate.id);
        this.addCoins(15); this.showToast('تم تخطي الروم إجبارياً!', '#00ff66'); this.returnToLobby();
    }

    returnToLobby() { 
        if(this.stageState.timer) clearInterval(this.stageState.timer);
        this.stageState.playing = false;
        this.playSound('click'); this.switchScreen('lobby'); this.renderLobby(); 
    }
}
const game = new SolarGamesEngine();
