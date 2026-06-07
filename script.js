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
            if(e.target.tagName==='BUTTON' || e.target.classList.contains('simon-box') || e.target.classList.contains('flip-card') || e.target.classList.contains('stone-btn') || e.target.closest('.channel-card') || e.target.classList.contains('wire-lux') || e.target.classList.contains('astro-ring') || e.target.classList.contains('slide-tile') || e.target.classList.contains('news-word') || e.target.classList.contains('shard-btn')){ 
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
            
            // الألعاب القديمة المتبقية
            if(i===1) { m.uiType = 'WIRES'; m.desc="اقطع 3 أسلاك محددة. ."; m.data=['#D4AF37','#ff3333','#333','#fff','#D4AF37','#00ccff','#333','#ff3333']; m.ans=[2,5,7]; m.hint="💡 تفاعلي: الاحمر اسود ازرق . | 📝 كتابي: يعتم كلما زاد."; }
            else if(i===2) { m.uiType = 'SIMON'; m.desc="تتبع الأنماط: 3 جولات متتالية."; m.data=16; m.hint="💡 تفاعلي: ركز ووجهني بالترتيب الصحيح . | 📝 كتابي: يذوب في الحرارة."; }
            else if(i===3) { m.uiType = 'MASTERMIND'; m.desc="خزنة الألوان: أدخل 4 أرقام (أخضر=صح، برتقالي=مكان غلط)."; m.ans=[3,7,1,9]; m.hint="💡 تفاعلي: الكود هو 3**9. | 📝 كتابي: لا يمكنك البوح به."; }
            else if(i===4) { m.uiType = 'MATCH'; m.desc="تطابق الأشكال: 20 شريحة، طابق 10 أزواج."; m.data=['🪐','☄️','🌑','🔭','🛸','🛰️','🌌','🌠','🚀','👨‍🚀']; m.hint="💡 تفاعلي: احفظ الأماكن ووجهني. | 📝 كتابي: يزيد ولا ينقص."; }
            else if(i===5) { m.uiType = 'COMPASS_3X'; m.desc="توجيه البوصلات الثلاث: اضبط الزوايا الدقيقة ."; m.ans=[135, 225, 45]; m.hint="💡 تفاعلي: أسفل ، أسفل ، أعلى . | 📝 كتابي: يرتد لك من الجدار."; }
            else if(i===7) { m.uiType = 'SCALES'; m.desc="الميزان الروماني: اختر أوزان مجموعها ***."; m.data=[50,70,30,80,20]; m.target=150; m.hint="💡 تفاعلي: 70 + * = *. | 📝 كتابي: يأتي غداً."; }
            else if(i===9) { m.uiType = 'PAPYRUS_HARD'; m.desc="لفافة البردي: الأحرف متوزعة ومخبأة داخل رومات الألعاب، اجمعها ورتبها لتشكل الكلمة."; m.ans='SOUL CALL OLD'; m.hint="💡 تفاعلي: الكلمة هي S**L C*** **D. | 📝 كتابي: لغته السكوت."; }
            else if(i===12) { m.uiType = 'JUGS'; m.desc="دوارق الكيمياء: احصل على 4 لتر من (8, 5, 3)."; m.hint="💡 تفاعلي: فكر كويس وشد حيلك مافي مساعده | 📝 كتابي: ترسم العالم."; }
            else if(i===13) { m.uiType = 'HARD_SEQUENCE'; m.desc="القفل التسلسلي الأعمى: 9 عقد طاقة. اكتشف التسلسل السري الكامل. خطأ واحد يعيدك للصفر."; m.hint="💡 تفاعلي: احفظ مسارك جيداً في كل محاولة. | 📝 كتابي: تعرف بها الوقت."; }
            else if(i===15) { m.uiType = 'BLIND_MAZE'; m.desc="متاهة المينوتور: 6x6 معتمة. خطوة غلط ترجعك للصفر."; m.data=36; m.ans=[0,6,12,13,14,20,26,32,33,34,35]; m.hint="💡 تفاعلي: تحت 3 مرات... | 📝 كتابي: صيفي ولذيذ."; }
            else if(i===16) { m.uiType = 'CAESAR_HARD'; m.desc="تشفير دافنشي المتقدم: أزح الكلمة المشفرة بمقدار النجمة السباعية (+7)."; m.ans='ECLIPSE'; m.hint="💡 تفاعلي: الكلمة هي ECL****. | 📝 كتابي: يثبت الأشياء."; }
            else if(i===19) { m.uiType = 'HARD_COLOR_CODE'; m.desc="شفرة التوافق الصارمة: ابحث عن الترتيب اللوني الدقيق. النظام يعطيك نسبة التطابق فقط."; m.hint="💡 تفاعلي: *، ذهبي، *، أزرق، *. | 📝 كتابي: تدل على الشمال."; }
            else if(i===24) { m.uiType = 'KEYPAD_HARD'; m.desc="خزنة الكيبورد: الأرقام موزعة برومات الألعاب، ابحث عنها لفتح الخزنة."; m.ans='1936'; m.hint="💡 تفاعلي: الكود هو 1***. | 📝 كتابي: ينادونك به."; }

            // الألعاب الجديدة (12 لعبة)
            else if(i===6) { m.uiType = 'WEIRD_LINK'; m.desc="الرابط العجيب: استخرج الكلمة التي تربط بين العقد الثلاث."; m.data=['ذهب', 'صمت', 'شمس']; m.ans='أصفر'; m.hint="💡 تفاعلي: كلمة واحدة فقط تجمعهم. | 📝 كتابي: كائن بحري يمتص."; }
            else if(i===8) { m.uiType = 'MACRO_IMAGE'; m.desc="غرفة الظلال: حرك الماوس كشافاً للكشف عن الصورة المقربة جداً."; m.ans='خشب'; m.hint="💡 تفاعلي: ركز على مادة الصنع. | 📝 كتابي: تقطعه لتفي به."; }
            else if(i===10) { m.uiType = 'ASTROLABE'; m.desc="لفة العرب: حرك حلقات الإسطرلاب لتحديد الاتجاه الجغرافي للمدينة المخفية (البتراء)."; m.ans=[180, 90]; m.hint="💡 تفاعلي: الاتجاه الجغرافي. | 📝 كتابي: قشرتها هشة."; }
            else if(i===11) { m.uiType = 'FAMILY_FEUD'; m.desc="النبض العام: سألنا 100 شخص: شيء تفقده ولا يعود؟"; m.ans='الوقت'; m.hint="💡 تفاعلي: الحرف الأول من الإجابة (ا). | 📝 كتابي: تنشفك وتتبلل."; }
            else if(i===14) { m.uiType = 'DETECTIVE_ARG'; m.desc="اقنع المحقق: المتهم ادعى أنه كان نائماً في ظلام دامس الساعة 2 ظهراً عندما سمع طلقة نارية ورأى الدخان. أين الكذبة؟"; m.ans='ظلام'; m.hint="💡 تفاعلي: مكان الثغرة (كيف رأى في...؟). | 📝 كتابي: يمطر."; }
            else if(i===17) { m.uiType = 'MIRROR_IDENTITY'; m.desc="من أنا: اجمع صفات الشظايا لمعرفة الشاعر."; m.data=['عاش في الأندلس','صاحب النونيات','وزير ابن عباد','ابن زيدون']; m.ans='ابن زيدون'; m.hint="💡 تفاعلي: العصر الذي عاش فيه. | 📝 كتابي: أداة الكتابة."; }
            else if(i===18) { m.uiType = 'PORSCHE_911'; m.desc="روح 911: ارفع الـ RPM وعشق النمرة عند الرقم المثالي للأسطورة الألمانية."; m.ans=7000; m.hint="💡 تفاعلي: راقب مؤشر الحرارة. | 📝 كتابي: يتبعك بالشمس."; }
            else if(i===20) { m.uiType = 'POETRY_WEIGHT'; m.desc="الوزن الضائع: شبيه الريح وش باقي من ........ ؟"; m.ans='التجريح'; m.hint="💡 تفاعلي: القافية المطلوبة (يح). | 📝 كتابي: لا تُرى."; }
            else if(i===21) { m.uiType = 'CAPCUT_TIMELINE'; m.desc="التايم لاين: وازن طبقات الفيديو والصوت لتتطابق تماماً."; m.ans=[50,50,50]; m.hint="💡 تفاعلي: ابدأ بطبقة الصوت الأساسية. | 📝 كتابي: تخاف من الماء."; }
            else if(i===22) { m.uiType = 'SURREAL_GALLERY'; m.desc="المعرض السريالي: اضغط على البيكسل أو العنصر الشاذ في اللوحة."; m.hint="💡 تفاعلي: ابحث في الانعكاس المقلوب. | 📝 كتابي: تكبر كلما أخذت منها."; }
            else if(i===23) { m.uiType = 'MUSIC_SERVER'; m.desc="سيرفر الموسيقى: أعد توصيل كابلات البوت الصوتي (Music Bot) دون فصل المؤقت العام."; m.ans=[1,2,0]; m.hint="💡 تفاعلي: السلك الأزرق هو البداية. | 📝 كتابي: يقرصك ببطنك."; }
            else if(i===25) { m.uiType = 'NEWS_TICKER'; m.desc="أخبار عاجلة: التقط الكلمة السرية من بين الأخبار المسرعة."; m.ans='SOLAR'; m.hint="💡 تفاعلي: ركز على الكلمات باللون الأحمر. | 📝 كتابي: تتركها وراءك."; }

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
        for(let i=1; i<=25; i++) { // تم تعديلها إلى 25 باب
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
            let wrap = document.createElement('div'); wrap.style.cssText = 'width:100%; display:flex; flex-direction:column; align-items:center; z-index:10;';
            let inp = document.createElement('input'); inp.type = 'text'; inp.className = 'cyber-input'; inp.placeholder = placeholder;
            inp.style.cssText = 'background: #000; border: 2px solid var(--gold); color: var(--gold); padding: 15px; font-size: 1.8rem; text-align: center; width: 100%; max-width: 400px; outline: none; box-shadow: inset 0 0 20px rgba(212,175,55,0.2); letter-spacing: 2px; font-family: monospace; border-radius: 8px; margin-top:20px;';
            wrap.append(inp, generateSubmitButton(() => { if(inp.value.trim().toUpperCase() === ans.toUpperCase()) this.winInteractive(); else this.failRoom(); }));
            innerStage.appendChild(wrap);
            return inp;
        };

        switch(p.uiType) {

            // --- الألعاب القديمة الثابتة ---
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
                    let b = document.createElement('div'); b.style.cssText = 'width:80px; height:80px; background:#050505; border:2px solid #222; border-radius:8px; cursor:pointer; box-shadow:inset 0 0 15px #000; transition:0.1s;';
                    b.onclick = () => {
                        if(!this.stageState.playing) return;
                        if(this.stageState.sequence[this.stageState.clicks] === i) {
                            b.style.background = 'var(--gold)'; b.style.borderColor = '#fff'; b.style.boxShadow = '0 0 30px var(--gold)'; setTimeout(()=>{b.style.background = '#050505'; b.style.borderColor = '#222'; b.style.boxShadow = 'inset 0 0 15px #000';}, 150);
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
                            setTimeout(()=> {boxes[this.stageState.sequence[step-1]].style.background = '#050505'; boxes[this.stageState.sequence[step-1]].style.borderColor = '#222'; boxes[this.stageState.sequence[step-1]].style.boxShadow = 'inset 0 0 15px #000';}, 300);
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
                    let tempAns = [...p.ans], tempGuess = [...guess];
                    let pegs = [];
                    for(let i=0; i<4; i++) { if(tempGuess[i] === tempAns[i]) { pegs.push('#00ff66'); tempAns[i]=null; tempGuess[i]=-1; } }
                    for(let i=0; i<4; i++) { if(tempGuess[i] !== -1 && tempAns.includes(tempGuess[i])) { pegs.push('#ffa500'); tempAns[tempAns.indexOf(tempGuess[i])]=null; } }
                    if(pegs.every(c=>c==='#00ff66') && pegs.length===4) this.winInteractive();
                    mboxes.forEach(b => b.value = '');
                }, 'Check Code');
                container.append(inputs, btn); innerStage.appendChild(container);
                break;
            }
            case 'MATCH': {
                let crdGrid = document.createElement('div'); crdGrid.style.cssText = 'display:grid; grid-template-columns:repeat(5, 70px); gap:15px; margin:20px auto; justify-content:center; perspective:1000px;';
                let symbols = [...p.data, ...p.data].sort(() => Math.random() - 0.5);
                let flipped = [];
                symbols.forEach((sym) => {
                    let card = document.createElement('div'); card.style.cssText = 'width:70px; height:70px; perspective:1000px; cursor:pointer; position:relative;';
                    let inner = document.createElement('div'); inner.style.cssText = 'width:100%; height:100%; transition:transform 0.5s; transform-style:preserve-3d; position:absolute;';
                    let front = document.createElement('div'); front.style.cssText = 'width:100%; height:100%; position:absolute; backface-visibility:hidden; background:#111; border:2px solid #333; border-radius:8px;';
                    let back = document.createElement('div'); back.style.cssText = 'width:100%; height:100%; position:absolute; backface-visibility:hidden; background:var(--gold); transform:rotateY(180deg); display:flex; justify-content:center; align-items:center; font-size:35px; border-radius:8px;'; back.innerText = sym;
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
                    cmp.style.cssText = 'width:120px; height:120px; border-radius:50%; background:radial-gradient(circle, #222, #000); border:4px solid #333; position:relative; display:flex; justify-content:center; align-items:center; cursor:pointer; transition:transform 0.3s;';
                    let ndl = document.createElement('div'); ndl.style.cssText = 'width:4px; height:100px; background:linear-gradient(to bottom, #ff3333 50%, #fff 50%); position:absolute;';
                    cmp.append(ndl);
                    cmp.onclick = () => {
                        this.playSound('click'); angles[i] = (angles[i] + 45) % 360; cmp.style.transform = `rotate(${angles[i]}deg)`;
                        if(angles[0]===p.ans[0] && angles[1]===p.ans[1] && angles[2]===p.ans[2]) setTimeout(()=>this.winInteractive(), 500);
                    };
                    wrap.appendChild(cmp);
                }
                innerStage.appendChild(wrap);
                break;
            }
            case 'SCALES': {
                let sclWrap = document.createElement('div'); sclWrap.style.cssText = 'display:flex; gap:20px; align-items:flex-end; height:150px; border-bottom: 4px solid var(--gold); padding-bottom:10px; width: 100%; max-width: 500px; justify-content:center;';
                p.data.forEach((w) => {
                    let btn = document.createElement('div');
                    btn.style.cssText = 'width: 60px; background: #eee; border: 2px solid #555; text-align: center; font-weight: bold; color: #000; cursor: pointer; display:flex; align-items:flex-end; justify-content:center; padding-bottom:10px;';
                    btn.innerText = w; btn.style.height = (w + 40) + 'px';
                    btn.onclick = () => {
                        btn.classList.toggle('active');
                        btn.style.background = btn.classList.contains('active') ? 'var(--gold)' : '#eee';
                        let sum = Array.from(sclWrap.children).reduce((acc, el, idx) => acc + (el.classList.contains('active') ? p.data[idx] : 0), 0);
                        if(sum === p.target) setTimeout(()=>this.winInteractive(), 300);
                    };
                    sclWrap.appendChild(btn);
                });
                innerStage.appendChild(sclWrap);
                break;
            }
            case 'PAPYRUS_HARD': { 
                let papy = document.createElement('div'); papy.style.cssText = "font-family: monospace; font-size: 3rem; color: #3e3124; background: #e3d2b2; padding: 20px 40px; border: 4px solid #a68962; border-radius: 5px; font-weight:bold; letter-spacing:10px; margin-bottom:30px;";
                papy.innerText = '???'; innerStage.appendChild(papy);
                createInputBlock('ENTER THE HIDDEN PHRASE...', p.ans);
                break;
            }
            case 'JUGS': {
                let jugWrap = document.createElement('div'); jugWrap.style.cssText = 'display:flex; gap:20px; align-items:flex-end; height:150px;';
                let caps = [8, 5, 3]; let vols = [8, 0, 0]; let selected = -1;
                const renderJugs = () => {
                    jugWrap.innerHTML = '';
                    caps.forEach((cap, i) => {
                        let j = document.createElement('div'); j.style.cssText = 'width:60px; background:#3e2723; border:2px solid #222; position:relative; overflow:hidden; cursor:pointer;'; j.style.height = (cap * 20 + 40) + 'px';
                        if(i === selected) j.style.borderColor = 'var(--gold)';
                        let w = document.createElement('div'); w.style.cssText = 'position:absolute; bottom:0; width:100%; background:rgba(0,200,255,0.6); transition:height 0.3s;'; w.style.height = (vols[i] / cap * 100) + '%';
                        let lbl = document.createElement('div'); lbl.style.cssText = 'position:absolute; width:100%; text-align:center; color:#fff; font-weight:bold; top:10px; z-index:2;'; lbl.innerText = `${vols[i]}/${cap}`;
                        j.append(w, lbl);
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
                let currentStep = 0; let cells = [];
                for(let i=0; i<9; i++) {
                    let c = document.createElement('div');
                    c.style.cssText = 'width:80px; height:80px; background:#050505; border:2px solid #D4AF37; border-radius:50%; display:flex; justify-content:center; align-items:center; font-size:2rem; color:#000; cursor:pointer; font-weight:bold; transition:0.2s;';
                    c.onclick = () => {
                        this.playSound('click');
                        if(targetSeq[currentStep] === i) {
                            c.style.background = '#D4AF37'; c.innerText = currentStep + 1; c.style.pointerEvents = 'none';
                            currentStep++; if(currentStep === 9) setTimeout(()=>this.winInteractive(), 500);
                        } else {
                            this.failRoom(); currentStep = 0;
                            cells.forEach(cell => { cell.style.background = '#050505'; cell.innerText = ''; cell.style.pointerEvents = 'auto'; });
                        }
                    };
                    cells.push(c); wrap.appendChild(c);
                }
                innerStage.appendChild(wrap);
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
                let txtDisp = document.createElement('div'); txtDisp.style.cssText = 'font-family:monospace; font-size:3rem; color:var(--gold); background:#000; border:2px solid #333; padding:10px 30px; border-radius:8px; margin-bottom:20px; letter-spacing:5px;'; 
                txtDisp.innerText = 'LJSPWZL'; innerStage.appendChild(txtDisp);
                createInputBlock('ENTER DECODE SEQUENCE...', p.ans);
                break;
            }
            case 'HARD_COLOR_CODE': {
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:flex; flex-direction:column; align-items:center; width:100%;';
                let nodesWrap = document.createElement('div'); nodesWrap.style.cssText = 'display:flex; gap:15px; margin-bottom:30px;';
                let colors = ['#D4AF37', '#ff3333', '#00ccff', '#00ff66', '#ffffff', '#555555'];
                let target = [3, 0, 4, 2, 5]; let current = [0, 0, 0, 0, 0];
                for(let i=0; i<5; i++) {
                    let n = document.createElement('div');
                    n.style.cssText = `width:55px; height:55px; border-radius:8px; background:${colors[0]}; border:2px solid #333; cursor:pointer; transition:0.3s;`;
                    n.onclick = () => { this.playSound('click'); current[i] = (current[i] + 1) % colors.length; n.style.background = colors[current[i]]; };
                    nodesWrap.appendChild(n);
                }
                let btn = generateSubmitButton(() => {
                    let exact = 0; for(let i=0; i<5; i++) { if(current[i] === target[i]) exact++; }
                    if(exact === 5) this.winInteractive(); else this.failRoom();
                }, 'TEST ALIGNMENT');
                wrap.append(nodesWrap, btn); innerStage.appendChild(wrap);
                break;
            }
            case 'KEYPAD_HARD': {
                let kWrap = document.createElement('div'); kWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:10px; background:#111; padding:20px; border-radius:8px;';
                let kDisp = document.createElement('div'); kDisp.style.cssText = 'grid-column:span 3; height:60px; background:#000; border:2px solid var(--gold); color:var(--gold); display:flex; justify-content:center; align-items:center; font-size:2rem; font-family:monospace; letter-spacing:8px; margin-bottom:10px;';
                kDisp.innerText='_ _ _ _'; kWrap.appendChild(kDisp);
                [1,2,3,4,5,6,7,8,9,'*',0,'#'].forEach((n) => {
                    let btn = document.createElement('div'); btn.style.cssText = 'width:80px; height:60px; background:#333; border:1px solid #555; display:flex; justify-content:center; align-items:center; color:#fff; font-size:1.5rem; cursor:pointer;'; btn.innerText = n;
                    btn.onclick = () => {
                        if(typeof n === 'number') {
                            this.playSound('click'); this.stageState.val = (this.stageState.val || '') + n;
                            kDisp.innerText = this.stageState.val.padEnd(p.ans.length,'_');
                            if(this.stageState.val === p.ans) { setTimeout(()=>this.winInteractive(), 300); }
                            else if(this.stageState.val.length >= p.ans.length) { this.failRoom(); this.setupStage(); }
                        }
                    }; kWrap.appendChild(btn);
                });
                innerStage.appendChild(kWrap);
                break;
            }

            // --- الألعاب الجديدة (12 لعبة) ---
            
            case 'WEIRD_LINK': {
                let wWrap = document.createElement('div'); wWrap.style.cssText = 'display:flex; gap:30px; margin-bottom:30px;';
                p.data.forEach(word => {
                    let orb = document.createElement('div');
                    orb.style.cssText = 'width:100px; height:100px; border-radius:50%; border:2px solid var(--gold); background:radial-gradient(circle, #222, #000); display:flex; justify-content:center; align-items:center; color:var(--gold); font-size:1.5rem; font-weight:bold; box-shadow:0 0 20px rgba(212,175,55,0.3);';
                    orb.innerText = word; wWrap.appendChild(orb);
                });
                innerStage.appendChild(wWrap);
                createInputBlock('الرابط العجيب بينهم...', p.ans);
                break;
            }

            case 'MACRO_IMAGE': {
                let mWrap = document.createElement('div');
                mWrap.style.cssText = 'width:400px; height:300px; background:url("https://www.transparenttextures.com/patterns/wood-pattern.png") #4a3b2c; border:2px solid #333; position:relative; overflow:hidden; cursor:crosshair; box-shadow:inset 0 0 50px #000;';
                let overlay = document.createElement('div');
                overlay.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; background:#000; pointer-events:none; transition:clip-path 0.1s; clip-path:circle(0px at 50% 50%);';
                mWrap.onmousemove = (e) => {
                    const rect = mWrap.getBoundingClientRect();
                    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
                    overlay.style.clipPath = `circle(40px at ${x}px ${y}px)`;
                    overlay.style.background = 'transparent';
                    mWrap.style.boxShadow = `inset 0 0 200px rgba(0,0,0,0.9)`; 
                };
                mWrap.onmouseleave = () => { overlay.style.clipPath = 'circle(0px at 50% 50%)'; overlay.style.background = '#000'; };
                mWrap.appendChild(overlay); innerStage.appendChild(mWrap);
                createInputBlock('مادة الصنع...', p.ans);
                break;
            }

            case 'ASTROLABE': {
                let aWrap = document.createElement('div'); aWrap.style.cssText = 'position:relative; width:250px; height:250px; border-radius:50%; background:#111; border:4px solid var(--gold); display:flex; justify-content:center; align-items:center; box-shadow:0 0 30px rgba(212,175,55,0.2);';
                let angles = [0, 0]; let rings = [];
                [200, 150].forEach((size, i) => {
                    let r = document.createElement('div');
                    r.style.cssText = `position:absolute; width:${size}px; height:${size}px; border-radius:50%; border:2px dashed var(--gold); cursor:pointer; transition:transform 0.3s; display:flex; justify-content:center;`;
                    let pointer = document.createElement('div'); pointer.style.cssText = 'width:10px; height:10px; background:var(--gold); border-radius:50%; margin-top:-5px;';
                    r.appendChild(pointer);
                    r.onclick = () => {
                        this.playSound('click'); angles[i] = (angles[i] + 45) % 360; r.style.transform = `rotate(${angles[i]}deg)`;
                        if(angles[0] === p.ans[0] && angles[1] === p.ans[1]) setTimeout(()=>this.winInteractive(), 500);
                    };
                    rings.push(r); aWrap.appendChild(r);
                });
                let center = document.createElement('div'); center.style.cssText = 'width:20px; height:20px; border-radius:50%; background:var(--gold); z-index:2;'; aWrap.appendChild(center);
                innerStage.appendChild(aWrap);
                break;
            }

            case 'FAMILY_FEUD': {
                let fWrap = document.createElement('div'); fWrap.style.cssText = 'width:100%; max-width:500px; background:#000; border:4px solid #333; border-radius:10px; padding:20px;';
                let title = document.createElement('div'); title.style.cssText = 'color:var(--gold); font-size:1.5rem; text-align:center; margin-bottom:20px; font-weight:bold;'; title.innerText = p.desc;
                let board = document.createElement('div'); board.style.cssText = 'background:linear-gradient(to bottom, #111, #222); border:2px solid #444; height:60px; display:flex; justify-content:center; align-items:center; color:#fff; font-size:2rem; letter-spacing:5px; box-shadow:inset 0 0 20px #000; margin-bottom:20px;'; board.innerText = '1. --------';
                fWrap.append(title, board); innerStage.appendChild(fWrap);
                let inp = createInputBlock('إجابة الأغلبية...', p.ans);
                inp.oninput = () => { if(inp.value.trim().toUpperCase() === p.ans.toUpperCase()) { board.innerText = `1. ${p.ans}`; board.style.color = 'var(--gold)'; this.playSound('success'); setTimeout(()=>this.winInteractive(), 1000); } };
                break;
            }

            case 'DETECTIVE_ARG': {
                let dWrap = document.createElement('div'); dWrap.style.cssText = 'width:100%; max-width:600px; background:#1a1a1a; padding:30px; border-left:5px solid var(--gold); border-right:5px solid var(--gold); border-radius:8px; color:#ddd; font-size:1.2rem; line-height:1.8; box-shadow:inset 0 0 30px #000; margin-bottom:20px; font-family:monospace;';
                dWrap.innerHTML = `<strong>ملف القضية #911:</strong><br><br>المتهم ادعى أنه كان نائماً في <span style="color:#fff;">ظلام</span> دامس الساعة 2 ظهراً، عندما سمع طلقة نارية ورأى الدخان يتصاعد من النافذة المقابلة.`;
                innerStage.appendChild(dWrap);
                createInputBlock('الكلمة التي تكشف الكذبة...', p.ans);
                break;
            }

            case 'MIRROR_IDENTITY': {
                let mirWrap = document.createElement('div'); mirWrap.style.cssText = 'display:flex; flex-wrap:wrap; width:300px; gap:10px; justify-content:center; margin-bottom:20px;';
                p.data.forEach(clue => {
                    let shard = document.createElement('div'); shard.className = 'shard-btn';
                    shard.style.cssText = 'width:140px; height:80px; background:linear-gradient(135deg, #eee, #aaa); border:2px solid #555; display:flex; justify-content:center; align-items:center; text-align:center; font-weight:bold; cursor:pointer; color:transparent; transition:0.3s; clip-path: polygon(10% 0, 100% 10%, 90% 100%, 0 90%); user-select:none;';
                    shard.onclick = () => { shard.style.color = '#000'; shard.innerText = clue; shard.style.background = 'linear-gradient(135deg, var(--gold), #fff)'; };
                    mirWrap.appendChild(shard);
                });
                innerStage.appendChild(mirWrap);
                createInputBlock('اسم الشاعر...', p.ans);
                break;
            }

            case 'PORSCHE_911': {
                let dash = document.createElement('div'); dash.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:20px;';
                let gauge = document.createElement('div'); gauge.style.cssText = 'width:200px; height:100px; background:#111; border:4px solid #333; border-bottom:none; border-radius:100px 100px 0 0; position:relative; overflow:hidden; display:flex; justify-content:center; align-items:flex-end; padding-bottom:10px; box-shadow:inset 0 0 30px rgba(255,0,0,0.2);';
                let needle = document.createElement('div'); needle.style.cssText = 'width:4px; height:80px; background:#ff3333; position:absolute; bottom:0; transform-origin:bottom center; transform:rotate(-90deg); transition:transform 0.1s;';
                let rpmText = document.createElement('div'); rpmText.style.cssText = 'color:#fff; font-family:monospace; font-size:1.5rem; z-index:2;'; rpmText.innerText = '0 RPM';
                gauge.append(needle, rpmText);
                
                let rpm = 0; let rpmInterval = null;
                let revBtn = document.createElement('button'); revBtn.innerText = 'REV ENGINE'; revBtn.style.cssText = 'padding:15px 30px; background:#222; border:2px solid #555; color:#fff; cursor:pointer; font-weight:bold; font-size:1.2rem; border-radius:8px; user-select:none;';
                let shiftBtn = document.createElement('button'); shiftBtn.innerText = 'SHIFT GEAR'; shiftBtn.style.cssText = 'padding:15px 30px; background:var(--gold); border:2px solid #fff; color:#000; cursor:pointer; font-weight:bold; font-size:1.2rem; border-radius:8px;';

                const updateGauge = () => {
                    let angle = -90 + (rpm / 8000) * 180;
                    needle.style.transform = `rotate(${Math.min(90, angle)}deg)`;
                    rpmText.innerText = `${rpm} RPM`;
                    gauge.style.boxShadow = rpm >= 7000 ? 'inset 0 0 30px rgba(255,0,0,0.8)' : 'inset 0 0 30px rgba(255,0,0,0.2)';
                };

                revBtn.onmousedown = () => { this.playSound('click'); rpmInterval = setInterval(() => { rpm += 150; if(rpm > 8000) rpm = 8000; updateGauge(); }, 50); };
                revBtn.onmouseup = revBtn.onmouseleave = () => { clearInterval(rpmInterval); rpmInterval = setInterval(() => { rpm -= 200; if(rpm < 0) { rpm = 0; clearInterval(rpmInterval); } updateGauge(); }, 50); };
                
                shiftBtn.onclick = () => {
                    this.playSound('click');
                    if(rpm >= 6900 && rpm <= 7200) { this.winInteractive(); clearInterval(rpmInterval); } else { this.failRoom(); rpm = 0; updateGauge(); }
                };

                let btnWrap = document.createElement('div'); btnWrap.style.cssText = 'display:flex; gap:20px;'; btnWrap.append(revBtn, shiftBtn);
                dash.append(gauge, btnWrap); innerStage.appendChild(dash);
                break;
            }

            case 'POETRY_WEIGHT': {
                let pWrap = document.createElement('div'); pWrap.style.cssText = 'width:100%; max-width:600px; text-align:center; padding:40px 20px; background:linear-gradient(to bottom, #1a1510, #000); border:2px solid var(--gold); border-radius:10px; margin-bottom:20px; box-shadow:0 10px 30px rgba(0,0,0,0.8);';
                let verse = document.createElement('h2'); verse.style.cssText = 'color:var(--gold); font-size:2rem; line-height:1.5; font-weight:normal; font-family:"Traditional Arabic", serif; text-shadow:0 0 10px rgba(212,175,55,0.5);';
                verse.innerHTML = `شبيه الريح وش باقي من <span style="border-bottom:2px dashed #fff; padding:0 30px;"></span> ؟`;
                pWrap.appendChild(verse); innerStage.appendChild(pWrap);
                createInputBlock('الكلمة المفقودة لضبط الوزن...', p.ans);
                break;
            }

            case 'CAPCUT_TIMELINE': {
                let ccWrap = document.createElement('div'); ccWrap.style.cssText = 'width:100%; max-width:500px; display:flex; flex-direction:column; gap:15px; background:#111; padding:20px; border-radius:8px; border:1px solid #333;';
                let offsets = [10, 80, 30]; let tracks = [];
                ['VIDEO LAYER', 'AUDIO SYNC', 'EFFECTS'].forEach((lbl, i) => {
                    let tRow = document.createElement('div'); tRow.style.cssText = 'display:flex; align-items:center; gap:10px; position:relative; height:40px; background:#222; border-radius:4px; overflow:hidden;';
                    let tName = document.createElement('div'); tName.style.cssText = 'width:100px; background:#000; color:#888; font-size:0.8rem; padding:10px; font-weight:bold; text-align:center; z-index:2; height:100%; display:flex; align-items:center; justify-content:center; border-right:2px solid #444;'; tName.innerText = lbl;
                    let trackLine = document.createElement('div'); trackLine.style.cssText = 'flex-grow:1; position:relative; cursor:pointer; height:100%;';
                    let block = document.createElement('div'); block.style.cssText = `position:absolute; width:100px; height:100%; background:${i===0?'#00ccff':(i===1?'#00ff66':'#ff33ff')}; left:${offsets[i]}%; transition:left 0.2s; opacity:0.8;`;
                    trackLine.appendChild(block); tRow.append(tName, trackLine);
                    trackLine.onclick = () => { this.playSound('click'); offsets[i] = (offsets[i] + 10) % 100; block.style.left = `${offsets[i]}%`; if(offsets.every(o => o === 50)) setTimeout(()=>this.winInteractive(), 500); };
                    ccWrap.appendChild(tRow); tracks.push(block);
                });
                let marker = document.createElement('div'); marker.style.cssText = 'position:absolute; width:2px; height:100%; background:#fff; left:50%; top:0; z-index:3; pointer-events:none; box-shadow:0 0 10px #fff;'; ccWrap.style.position = 'relative'; ccWrap.appendChild(marker);
                innerStage.appendChild(ccWrap);
                break;
            }

            case 'SURREAL_GALLERY': {
                let galWrap = document.createElement('div'); galWrap.style.cssText = 'position:relative; width:400px; height:300px; background:linear-gradient(45deg, #111, #333, #000); border:10px solid #222; border-radius:2px; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.9);';
                for(let i=0; i<30; i++) {
                    let shape = document.createElement('div');
                    shape.style.cssText = `position:absolute; width:${Math.random()*50+10}px; height:${Math.random()*50+10}px; background:hsl(${Math.random()*360}, 50%, 50%); opacity:0.6; transform:rotate(${Math.random()*360}deg); top:${Math.random()*250}px; left:${Math.random()*350}px; clip-path:polygon(${Math.random()*100}% 0, 100% ${Math.random()*100}%, 0 100%); pointer-events:none;`;
                    galWrap.appendChild(shape);
                }
                let targetPixel = document.createElement('div'); targetPixel.style.cssText = 'position:absolute; width:8px; height:8px; background:var(--gold); top:30px; right:40px; cursor:pointer; box-shadow:0 0 5px var(--gold); z-index:10;';
                targetPixel.onclick = () => { this.winInteractive(); };
                galWrap.onclick = (e) => { if(e.target !== targetPixel) this.failRoom(); };
                galWrap.appendChild(targetPixel); innerStage.appendChild(galWrap);
                break;
            }

            case 'MUSIC_SERVER': {
                let srvWrap = document.createElement('div'); srvWrap.style.cssText = 'display:flex; justify-content:space-between; align-items:center; width:100%; max-width:500px; background:#0a0a0a; border:2px solid #333; padding:30px; border-radius:8px;';
                let leftCol = document.createElement('div'); leftCol.style.cssText = 'display:flex; flex-direction:column; gap:20px;';
                let rightCol = document.createElement('div'); rightCol.style.cssText = 'display:flex; flex-direction:column; gap:20px;';
                let colors = ['#00ccff', '#ff3333', '#00ff66']; let selectedLeft = null; let connections = {};
                
                for(let i=0; i<3; i++) {
                    let lNode = document.createElement('div'); lNode.style.cssText = `width:20px; height:20px; border-radius:50%; background:${colors[i]}; cursor:pointer; box-shadow:0 0 10px ${colors[i]}; border:2px solid #fff;`;
                    lNode.onclick = () => { this.playSound('click'); selectedLeft = i; Array.from(leftCol.children).forEach(c=>c.style.borderColor='#fff'); lNode.style.borderColor='var(--gold)'; };
                    leftCol.appendChild(lNode);
                    
                    let rNode = document.createElement('div'); rNode.style.cssText = `width:20px; height:20px; border-radius:50%; background:#333; cursor:pointer; border:2px solid #555; transition:0.3s;`;
                    rNode.onclick = () => {
                        if(selectedLeft !== null) {
                            this.playSound('click'); rNode.style.background = colors[selectedLeft]; rNode.style.boxShadow = `0 0 10px ${colors[selectedLeft]}`;
                            connections[selectedLeft] = i; selectedLeft = null; Array.from(leftCol.children).forEach(c=>c.style.borderColor='#fff');
                            if(Object.keys(connections).length === 3) {
                                if(connections[0]===p.ans[0] && connections[1]===p.ans[1] && connections[2]===p.ans[2]) setTimeout(()=>this.winInteractive(), 500); else { this.failRoom(); connections={}; Array.from(rightCol.children).forEach(c=>{c.style.background='#333'; c.style.boxShadow='none';}); }
                            }
                        }
                    };
                    rightCol.appendChild(rNode);
                }
                let centerText = document.createElement('div'); centerText.style.cssText = 'color:#555; font-family:monospace; font-size:2rem; font-weight:bold; text-align:center; line-height:1;'; centerText.innerHTML = 'BOT<br>▶<br>VC';
                srvWrap.append(leftCol, centerText, rightCol); innerStage.appendChild(srvWrap);
                break;
            }

            case 'NEWS_TICKER': {
                let nWrap = document.createElement('div'); nWrap.style.cssText = 'width:100%; max-width:600px; height:60px; background:#000; border-top:3px solid var(--gold); border-bottom:3px solid var(--gold); overflow:hidden; position:relative; display:flex; align-items:center;';
                let marquee = document.createElement('div'); marquee.style.cssText = 'display:flex; gap:50px; white-space:nowrap; position:absolute; left:100%; transition:left 0.1s linear; color:#fff; font-size:1.5rem; font-weight:bold; font-family:monospace;';
                nWrap.appendChild(marquee); innerStage.appendChild(nWrap);
                
                let words = ['BREAKING', 'UPDATE', 'SYSTEM', 'ERROR', 'NETWORK', 'SOLAR', 'DATA', 'BREACH', 'ALERT'];
                words.forEach(w => {
                    let s = document.createElement('span'); s.innerText = w; s.className = 'news-word';
                    if(w === 'SOLAR') { s.style.color = '#ff3333'; s.style.cursor = 'pointer'; s.onclick = () => { this.winInteractive(); }; }
                    marquee.appendChild(s);
                });
                
                let pos = 600;
                let anim = setInterval(() => {
                    if(!this.stageState.playing) { clearInterval(anim); return; }
                    pos -= 5; marquee.style.left = pos + 'px';
                    if(pos < -800) pos = 600;
                }, 20);
                this.stageState.timer = anim;
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
        this.stageState.playing = false;
        this.playSound('click'); this.switchScreen('lobby'); this.renderLobby(); 
    }
}
const game = new SolarGamesEngine();
