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
            
            if(i===1) { m.uiType = 'WIRES'; m.desc="شرح اللعبة: اقطع الأسلاك الثلاثة المطلوبة لتعطيل القفل، الترتيب مهم وأي خطأ يعيد التشفير."; m.data=['#D4AF37','#ff3333','#333','#fff','#D4AF37','#00ccff','#333','#ff3333']; m.ans=[2,5,7]; m.hint="💡 تلميح النظام: السلك الداكن أولاً، ثم لون السماء، وأخيراً لون الخطر. | 📝 تلميح اللغز: يغطي الأشياء بغيابه."; }
            else if(i===2) { m.uiType = 'SIMON'; m.desc="شرح اللعبة: راقب المربعات المضيئة بدقة وكرر النمط عبر 3 جولات متسارعة."; m.data=16; m.hint="💡 تلميح النظام: النمط يبدأ غالباً من الأطراف ويتجه للمركز. | 📝 تلميح اللغز: حالة فيزيائية مؤقتة للماء."; }
            else if(i===3) { m.uiType = 'MASTERMIND'; m.desc="شرح اللعبة: استنتج الكود المكون من 4 أرقام. (الأخضر=دقيق، البرتقالي=موجود بمكان آخر). 8 محاولات فقط."; m.ans=[3,7,1,9]; m.hint="💡 تلميح النظام: جرب الأرقام الفردية المتباعدة. | 📝 تلميح اللغز: إذا نطقته انتهى."; }
            else if(i===4) { m.uiType = 'MATCH'; m.desc="شرح اللعبة: الذاكرة قصيرة المدى. طابق 10 أزواج من الشرائح الفلكية المتشابهة."; m.data=['🪐','☄️','🌑','🔭','🛸','🛰️','🌌','🌠','🚀','👨‍🚀']; m.hint="💡 تلميح النظام: الرموز الدائرية متجمعة في المنتصف. | 📝 تلميح اللغز: يرافقك دائماً ويزداد."; }
            else if(i===5) { m.uiType = 'ASTROLABE'; m.desc="شرح اللعبة: قم بوزن الأسطرلاب الفلكي وتوجيه الحلقات الأربع للزاوية (0) للأعلى."; m.hint="💡 تلميح النظام: كل ضغطة تدور الحلقة 45 درجة، ابدأ بالحلقة الخارجية. | 📝 تلميح اللغز: ارتداد للصوت."; }
            
            // ============== الأبواب الصعبة الجديدة ==============
            else if(i===6) { m.uiType = 'HARD_MEMORY'; m.desc="شرح اللعبة: اختبار الذاكرة العميق. سيظهر النمط الذهبي المكون من 10 مربعات لثانيتين فقط في المصفوفة 5x5، احفظه وكرره بدقة تامة."; m.hint="💡 تلميح النظام: حاول تقسيم الشبكة في ذهنك لنصفين لتسهيل الحفظ. | 📝 تلميح اللغز: كائن بحري يمتص."; }
            else if(i===13) { m.uiType = 'HARD_SEQUENCE'; m.desc="شرح اللعبة: القفل التسلسلي الأعمى. 9 عقد طاقة. اكتشف التسلسل السري الكامل بالتجربة والخطأ. خطأ واحد يعيد تهيئة القفل بالكامل للصفر."; m.hint="💡 تلميح النظام: ابدأ العقد من المنتصف واحفظ مسارك جيداً. | 📝 تلميح اللغز: بها عقارب ثابتة."; }
            else if(i===17) { m.uiType = 'HARD_WAVES'; m.desc="شرح اللعبة: محاذاة الترددات الكمية. اضبط الموجات الثلاث (التردد، السعة، الطور) بدقة ليتطابق المجموع الكمي 100% مع السيرفر."; m.hint="💡 تلميح النظام: المؤشر الأول 73، الثاني 21، الأخير 88. | 📝 تلميح اللغز: يضيء وينتهي."; }
            else if(i===19) { m.uiType = 'HARD_COLOR_CODE'; m.desc="شرح اللعبة: شفرة التوافق الصارمة. ابحث عن الترتيب اللوني الدقيق للقنوات الخمس. النظام سيعطيك النسبة المئوية للتطابق فقط."; m.hint="💡 تلميح النظام: لا يوجد ألوان مكررة، اللون الأول أخضر. | 📝 تلميح اللغز: تشير ولا تتحرك."; }
            else if(i===21) { m.uiType = 'HARD_LOGIC'; m.desc="شرح اللعبة: البوابات المنطقية. قم بتبديل المفاتيح الأربعة لفتح القفل عبر الدائرة المعقدة. يجب أن تتوافق الإشارات لتفعيل النواة."; m.hint="💡 تلميح النظام: المفتاح الأول والثالث فعال، الثاني والرابع مطفأ. | 📝 تلميح اللغز: تخاف الماء وتأكل كل شيء."; }
            else if(i===25) { m.uiType = 'HARD_PIPES'; m.desc="شرح اللعبة: صمامات الضغط المترابطة. أدر الصمامات لتشير جميعها للأعلى. تدوير أي صمام سيؤثر ميكانيكياً على الصمامات المجاورة له (يمين، يسار، أعلى، أسفل)!"; m.hint="💡 تلميح النظام: حاول تفعيلها من الأطراف أولاً بشكل متقابل. | 📝 تلميح اللغز: خطوة."; }
            else if(i===27) { m.uiType = 'HARD_MATRIX'; m.desc="شرح اللعبة: مصفوفة الاختراق. تتبع واستخرج التسلسل الصارم (FF ➔ A1 ➔ D4 ➔ B7) من بين الشفرات الوهمية."; m.hint="💡 تلميح النظام: ابدأ من FF في الزاوية العلوية اليمنى. | 📝 تلميح اللغز: سمسم."; }
            else if(i===29) { m.uiType = 'HARD_CORE'; m.desc="شرح اللعبة: تبريد المفاعل. توازن معقد: ضغطة على عمود ترفعه وتخفض بقية الأعمدة. اجعل جميع الأعمدة عند مستوى 50% تماماً."; m.hint="💡 تلميح النظام: ركز على رفع الأعمدة المنخفضة جداً أولاً ببطء. | 📝 تلميح اللغز: شمعة."; }
            // ====================================================

            else if(i===7) { m.uiType = 'SCALES'; m.desc="شرح اللعبة: الميزان الروماني، أضف الأوزان الدقيقة للوصول لكتلة 150 المحددة."; m.data=[50,70,30,80,20]; m.target=150; m.hint="💡 تلميح النظام: استخدم وزنين فقط من الأكبر. | 📝 تلميح اللغز: زمن لم يأت بعد."; }
            else if(i===8) { m.uiType = 'RADAR_ROUNDS'; m.desc="شرح اللعبة: رادار متصاعد الصعوبة. حدد النقطة المضيئة في 3 جولات بشبكات أكبر (5x5, 7x7, 9x9)."; m.hint="💡 تلميح النظام: النقطة تظهر في النصف السفلي من الشاشة عادة. | 📝 تلميح اللغز: كلام ملزم يكسر."; }
            else if(i===9) { m.uiType = 'KEYPAD'; m.desc="شرح اللعبة: أدخل تسلسل الأرقام السري للوحة الديجيتال بالترتيب."; m.ans='739'; m.hint="💡 تلميح النظام: تنازلي من 7 ثم يقفز لرقم كبير. | 📝 تلميح اللغز: عكس الكلام."; }
            else if(i===10) { m.uiType = 'GEARS'; m.desc="شرح اللعبة: نظام تروس معقد. دور التروس الثلاثة حتى تتجه الأسنان جميعها للأعلى."; m.ans=[0,0,0]; m.hint="💡 تلميح النظام: استمر بالضغط حتى تصطف. | 📝 تلميح اللغز: شيء يكسر لتأكله."; }
            else if(i===11) { m.uiType = 'MORSE'; m.desc="شرح اللعبة: فك تشفير الإشارة الضوئية (الومضات الطويلة والقصيرة) واكتب الكلمة."; m.ans='SOS'; m.hint="💡 تلميح النظام: إشارة استغاثة عالمية مشهورة. | 📝 تلميح اللغز: تجففك وهي مبللة."; }
            else if(i===12) { m.uiType = 'HEX'; m.desc="شرح اللعبة: اربط مساراً آمناً عبر الخلايا السداسية لمرور الطاقة."; m.ans=[3,4,5]; m.hint="💡 تلميح النظام: المسار الأفقي الأوسط. | 📝 تلميح اللغز: مدن بلا سكان."; }
            else if(i===14) { m.uiType = 'SLIDERS'; m.desc="شرح اللعبة: أوزن ألوان الـ RGB للحصول على اللون الذهبي الداكن للنظام."; m.data=[{label:'RED',max:255},{label:'GRN',max:255}]; m.ans=[212, 175]; m.hint="💡 تلميح النظام: الأحمر فوق الـ 200 والأخضر 175. | 📝 تلميح اللغز: تراه في السماء."; }
            else if(i===15) { m.uiType = 'MAZE'; m.desc="شرح اللعبة: المتاهة العمياء. تتبع مساراً خفياً من الزاوية العلوية للسفلية دون لمس الفخاخ."; m.data=36; m.ans=[0,6,12,13,14,20,26,32,33,34,35]; m.hint="💡 تلميح النظام: ابدأ بالنزول 3 خطوات ثم اتجه يميناً. | 📝 تلميح اللغز: أخضر من الخارج."; }
            else if(i===16) { m.uiType = 'CRYPTEX'; m.desc="شرح اللعبة: أسطوانات التشفير. قم بإزاحة الأحرف (CDE) بمقدار 2 للأمام."; m.ans='EFG'; m.hint="💡 تلميح النظام: الحرف الذي يلي C بحرفين. | 📝 تلميح اللغز: يخترق ويثبت."; }
            else if(i===18) { m.uiType = 'BARCODE'; m.desc="شرح اللعبة: الباركود التالف. قم بتفعيل الأعمدة الصحيحة لاستكمال التسلسل البصري."; m.ans=[2,5,7]; m.hint="💡 تلميح النظام: فعل الأعمدة رقم 3 و 6 و 8. | 📝 تلميح اللغز: يتبعك ولا تلمسه."; }
            else if(i===20) { m.uiType = 'LIGHTS_OUT'; m.desc="شرح اللعبة: معبد الشعلات. اضغط لإطفاء جميع النيران، كل ضغطة تؤثر على الجوار."; m.data=9; m.hint="💡 تلميح النظام: اضغط الأطراف الأربعة أولاً. | 📝 تلميح اللغز: تحس بها ولا تراها."; }
            else if(i===22) { m.uiType = 'DNA'; m.desc="شرح اللعبة: شريط الـ DNA. طابق الروابط بشكل صحيح (A مع T، و C مع G)."; m.ans=['T','G','A','C']; m.hint="💡 تلميح النظام: التسلسل يبدأ بـ T وينتهي بـ C. | 📝 تلميح اللغز: حفرة."; }
            else if(i===23) { m.uiType = 'PIPES'; m.desc="شرح اللعبة: شبكة الأنابيب. قم بتدوير الأجزاء لتكوين مسار أفقي مستقيم."; m.hint="💡 تلميح النظام: اجعل جميع الأنابيب على شكل (━). | 📝 تلميح اللغز: الشعور بالحاجة للطعام."; }
            else if(i===24) { m.uiType = 'SLIDING'; m.desc="شرح اللعبة: اللوحة المنزلقة. قم بإزاحة الأرقام لترتيبها تصاعدياً وترك الفراغ بالنهاية."; m.ans='123456780'; m.hint="💡 تلميح النظام: ابدأ بترتيب الصف الأول (1,2,3). | 📝 تلميح اللغز: اسمك."; }
            else if(i===26) { m.uiType = 'HEATMAP'; m.desc="شرح اللعبة: البصمة الحرارية. أدخل الأرقام بالتسلسل من الأشد حرارة إلى الأبرد."; m.ans=[8,4,9,1]; m.hint="💡 تلميح النظام: ابدأ بالأحمر الغامق ثم البرتقالي. | 📝 تلميح اللغز: مطر."; }
            else if(i===28) { m.uiType = 'ELEVATOR'; m.desc="شرح اللعبة: لوحة المصعد. اضغط تسلسل الأدوار الصحيح للوصول للمنطقة السرية."; m.ans=[3,1,5]; m.hint="💡 تلميح النظام: الدور 3 ثم 1 ثم 5. | 📝 تلميح اللغز: العلا."; }
            else if(i===30) { m.uiType = 'BOSS'; m.desc="شرح اللعبة: الاختراق النهائي (MASTER BREACH). شغل مفاتيح الطاقة وأدخل كود التأكيد."; m.ans='GOLDEN'; m.hint="💡 تلميح النظام: الكود النهائي هو GOLDEN. | 📝 تلميح اللغز: معدن نفيس."; }

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

        const generateSubmitButton = (callback, text = 'تأكيد (Execute)') => {
            let btn = document.createElement('button'); btn.className = 'btn-execute'; btn.innerText = text; 
            btn.onclick = callback; return btn;
        };

        const createInputBlock = (placeholder, ans) => {
            let wrap = document.createElement('div'); wrap.style.cssText = 'width:100%; display:flex; flex-direction:column; align-items:center;';
            let inp = document.createElement('input'); inp.type = 'text'; inp.className = 'cyber-input'; inp.placeholder = placeholder;
            wrap.append(inp, generateSubmitButton(() => { if(inp.value.trim().toUpperCase() == ans) this.winInteractive(); else this.failRoom(); }));
            innerStage.appendChild(wrap);
        };

        switch(p.uiType) {

            // =================== الأبواب الصعبة الجديدة (8 أبواب) ===================

            case 'HARD_MEMORY': { // الباب 6
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

            case 'HARD_SEQUENCE': { // الباب 13
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

            case 'HARD_WAVES': { // الباب 17
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

            case 'HARD_COLOR_CODE': { // الباب 19
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:flex; flex-direction:column; align-items:center; width:100%;';
                let nodesWrap = document.createElement('div'); nodesWrap.style.cssText = 'display:flex; gap:15px; margin-bottom:30px;';
                let colors = ['#D4AF37', '#ff3333', '#00ccff', '#00ff66', '#ffffff', '#555555'];
                let target = [3, 0, 5, 2, 1]; // Green, Gold, Gray, Blue, White
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

            case 'HARD_LOGIC': { // الباب 21
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:30px; width:100%;';
                let swWrap = document.createElement('div'); swWrap.style.cssText = 'display:flex; gap:20px;';
                let state = [false, false, false, false];
                let targetState = [true, false, true, false]; 
                let switches = [];
                for(let i=0; i<4; i++) {
                    let sw = document.createElement('div');
                    sw.style.cssText = 'width:60px; height:100px; background:#111; border:2px solid #333; border-radius:6px; position:relative; cursor:pointer; box-shadow:0 5px 15px #000;';
                    let knob = document.createElement('div');
                    knob.style.cssText = 'position:absolute; width:44px; height:40px; background:linear-gradient(180deg,#444,#222); left:6px; top:10px; border-radius:4px; transition:0.3s; border:1px solid #555;';
                    sw.appendChild(knob);
                    sw.onclick = () => {
                        this.playSound('click');
                        state[i] = !state[i];
                        if(state[i]) { knob.style.top = '46px'; knob.style.background = 'linear-gradient(180deg,#D4AF37,#8a7322)'; knob.style.boxShadow = '0 -5px 10px rgba(212,175,55,0.5)'; }
                        else { knob.style.top = '10px'; knob.style.background = 'linear-gradient(180deg,#444,#222)'; knob.style.boxShadow = 'none'; }
                    };
                    swWrap.appendChild(sw); switches.push(sw);
                }
                let visualCore = document.createElement('div'); visualCore.style.cssText = 'width:150px; height:150px; background:radial-gradient(circle, #222, #000); border:4px dashed #D4AF37; border-radius:50%; display:flex; justify-content:center; align-items:center; color:#555; font-size:3rem; transition:0.5s;'; visualCore.innerText = '⚡';
                
                let btn = generateSubmitButton(() => {
                    if(JSON.stringify(state) === JSON.stringify(targetState)) {
                        visualCore.style.background = 'radial-gradient(circle, #D4AF37, #000)'; visualCore.style.color = '#fff'; visualCore.style.boxShadow = '0 0 50px #D4AF37';
                        setTimeout(()=>this.winInteractive(), 800);
                    } else { this.failRoom(); }
                }, 'POWER ON');
                wrap.append(swWrap, visualCore, btn); innerStage.appendChild(wrap);
                break;
            }

            case 'HARD_PIPES': { // الباب 25
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
                let txt = document.createElement('div'); txt.style.cssText = 'color:#888; margin-bottom:20px; text-align:center; font-family:monospace; line-height: 1.5;'; txt.innerText = 'ALIGN ALL VALVES UPWARDS.\nWARNING: VALVES ARE MECHANICALLY LINKED.';
                innerStage.append(txt, wrap);
                break;
            }

            case 'HARD_MATRIX': { // الباب 27
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:grid; grid-template-columns:repeat(4, 70px); gap:5px; background:#000; padding:10px; border:2px solid #333;';
                let codes = ['1A','B7','2C','FF','A1','D4','EE','99','00','B7','FF','A1','D4','3B','8C','4D']; 
                let requiredOrder = ['FF', 'A1', 'D4', 'B7'];
                let currentStep = 0;
                let cells = [];
                for(let i=0; i<16; i++) {
                    let c = document.createElement('div');
                    c.style.cssText = 'width:70px; height:50px; background:#111; color:#555; display:flex; justify-content:center; align-items:center; font-family:monospace; font-size:1.5rem; font-weight:bold; cursor:pointer; border:1px solid #222; transition:0.2s;';
                    c.innerText = codes[i];
                    c.onclick = () => {
                        this.playSound('click');
                        if(codes[i] === requiredOrder[currentStep]) {
                            c.style.background = 'var(--gold)'; c.style.color = '#000'; c.style.pointerEvents = 'none';
                            currentStep++;
                            if(currentStep === 4) setTimeout(()=>this.winInteractive(), 500);
                        } else {
                            this.failRoom();
                            currentStep = 0;
                            cells.forEach(cell => { cell.style.background = '#111'; cell.style.color = '#555'; cell.style.pointerEvents = 'auto'; });
                        }
                    };
                    cells.push(c); wrap.appendChild(c);
                }
                let display = document.createElement('div'); display.style.cssText = 'width:100%; max-width:300px; padding:15px; background:#0a0a0a; border:1px solid #D4AF37; margin-bottom:20px; text-align:center; color:#D4AF37; font-family:monospace; font-size:1.2rem; letter-spacing:3px; box-shadow:0 5px 15px rgba(0,0,0,0.8);';
                display.innerText = 'TARGET: FF ➔ A1 ➔ D4 ➔ B7';
                innerStage.append(display, wrap);
                break;
            }

            case 'HARD_CORE': { // الباب 29
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:flex; gap:15px; height:250px; align-items:flex-end; border-bottom:4px solid #333; padding-bottom:15px; margin-bottom:20px;';
                let vals = [20, 60, 40, 80]; 
                let bars = [];
                for(let i=0; i<4; i++) {
                    let col = document.createElement('div');
                    col.style.cssText = 'width:50px; height:100%; background:#050505; border:2px solid #555; border-radius:4px 4px 0 0; position:relative; overflow:hidden; cursor:pointer; box-shadow:0 10px 20px #000;';
                    let fill = document.createElement('div');
                    fill.style.cssText = 'position:absolute; bottom:0; width:100%; transition:0.3s;';
                    fill.style.height = vals[i] + '%';
                    fill.style.background = vals[i] === 50 ? '#00ff66' : (vals[i] > 80 ? '#ff3333' : '#D4AF37');
                    
                    col.appendChild(fill);
                    col.onclick = () => {
                        this.playSound('click');
                        for(let j=0; j<4; j++) {
                            if(j === i) vals[j] = Math.min(100, vals[j] + 20);
                            else vals[j] = Math.max(0, vals[j] - 10);
                            
                            bars[j].style.height = vals[j] + '%';
                            bars[j].style.background = vals[j] === 50 ? '#00ff66' : (vals[j] > 80 ? '#ff3333' : '#D4AF37');
                        }
                        if(vals.every(v => v === 50)) setTimeout(()=>this.winInteractive(), 500);
                    };
                    bars.push(fill); wrap.appendChild(col);
                }
                let txt = document.createElement('div'); txt.style.cssText = 'color:#888; font-family:monospace; text-align:center; font-size:1.1rem;'; txt.innerText = 'STABILIZE ALL CORES TO 50%';
                innerStage.append(wrap, txt);
                break;
            }

            // =================== الأبواب الأصلية كما هي ===================

            case 'WIRES':
                let wWrap = document.createElement('div'); wWrap.style.cssText = 'width:100%; display:flex; flex-direction:column; align-items:center;';
                p.data.forEach((c, i) => {
                    let w = document.createElement('div'); w.className = 'wire-lux'; w.style.backgroundColor = c;
                    w.onclick = () => {
                        w.classList.add('wire-cut'); w.style.pointerEvents = 'none';
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
                            b.classList.add('pulse'); setTimeout(()=>b.classList.remove('pulse'), 150);
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
                            boxes[this.stageState.sequence[step]].classList.add('pulse'); this.playSound('click');
                            setTimeout(()=>boxes[this.stageState.sequence[step-1]].classList.remove('pulse'), 300);
                            step++;
                        } else { clearInterval(iv); this.stageState.playing = true; }
                    }, 500);
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
                    if(pegs.every(c=>c==='#00ff66')) this.winInteractive();
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
                            }, 500);
                        }
                    };
                    crdGrid.appendChild(card);
                });
                innerStage.appendChild(crdGrid);
                break;

            case 'ASTROLABE':
                let astWrap = document.createElement('div'); astWrap.style.cssText = 'position: relative; width: 250px; height: 250px; display:flex; justify-content:center; align-items:center;';
                let r1 = document.createElement('div'); r1.className = 'astro-ring astro-r1'; let m1=document.createElement('div'); m1.className='astro-marker'; r1.appendChild(m1);
                let r2 = document.createElement('div'); r2.className = 'astro-ring astro-r2'; let m2=document.createElement('div'); m2.className='astro-marker'; r2.appendChild(m2);
                let r3 = document.createElement('div'); r3.className = 'astro-ring astro-r3'; let m3=document.createElement('div'); m3.className='astro-marker'; r3.appendChild(m3);
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

            case 'SCALES':
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
                    let speed = this.stageState.round === 1 ? 1200 : (this.stageState.round === 2 ? 800 : 400);
                    this.stageState.timer = setInterval(() => {
                        cells[targetIdx].style.background = '#00ff66';
                        setTimeout(() => cells[targetIdx].style.background = 'transparent', speed/2);
                    }, speed);
                };
                startRadarRound();
                break;

            case 'KEYPAD':
                let kWrap = document.createElement('div'); kWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:10px;';
                let kDisp = document.createElement('div'); kDisp.style.cssText = 'grid-column:span 3; font-family: monospace; font-size: 2.5rem; color: var(--gold); text-align:center; background:#000; border:2px solid #333; padding:10px; border-radius:8px; margin-bottom:10px; letter-spacing:10px;';
                kDisp.innerText='_ _ _'; kWrap.appendChild(kDisp);
                let padNums = [1,2,3,4,5,6,7,8,9];
                padNums.forEach((n) => {
                    let btn = document.createElement('div'); btn.style.cssText = 'width:80px; height:80px; background:#050505; border:2px solid #222; border-radius:8px; display:flex; justify-content:center; align-items:center; font-size:2rem; color:#555; cursor:pointer; font-family:monospace;';
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

            case 'GEARS':
                let gWrap = document.createElement('div'); gWrap.style.cssText = 'display:flex; gap:20px;';
                let gearAngles = [90, 180, 270];
                for(let i=0; i<3; i++) {
                    let d = document.createElement('div'); d.innerText = '⚙️';
                    d.style.cssText = `font-size: 6rem; line-height: 1; color: #555; cursor: pointer; transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); text-shadow: 0 10px 20px #000; user-select: none; transform: rotate(${gearAngles[i]}deg);`;
                    d.onclick = () => {
                        gearAngles[i] = (gearAngles[i] + 45) % 360; d.style.transform = `rotate(${gearAngles[i]}deg)`;
                        if(gearAngles.every(a => a === 0)) setTimeout(()=>this.winInteractive(), 300);
                    };
                    gWrap.appendChild(d);
                }
                innerStage.appendChild(gWrap);
                break;

            case 'MORSE':
                let mBulb = document.createElement('div'); mBulb.style.cssText = 'width: 100px; height: 100px; border-radius: 50%; background: #111; border: 4px solid #333; margin: 20px auto; box-shadow: inset 0 0 20px #000; transition: 0.1s;';
                innerStage.appendChild(mBulb); createInputBlock('DECODE SIGNAL...', p.ans);
                const flash = (duration) => { 
                    mBulb.style.background = '#fff'; mBulb.style.borderColor = '#fff'; mBulb.style.boxShadow = '0 0 50px #fff, inset 0 0 20px #fff';
                    setTimeout(()=> { mBulb.style.background = '#111'; mBulb.style.borderColor = '#333'; mBulb.style.boxShadow = 'inset 0 0 20px #000'; }, duration); 
                }
                let pattern = [200,200,200, 600,600,600, 200,200,200]; let mStep = 0;
                this.stageState.timer = setInterval(() => { flash(pattern[mStep]); mStep++; if(mStep >= pattern.length) mStep=0; }, 1000);
                break;

            case 'HEX':
                let hexWrap = document.createElement('div'); hexWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 70px); gap:15px;';
                for(let i=0; i<9; i++) {
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

            case 'SLIDERS':
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

            case 'MAZE':
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

            case 'CRYPTEX':
            case 'PAPYRUS':
                let papy = document.createElement('div'); papy.style.cssText = "font-family: 'Rajdhani', monospace; font-size: 3rem; color: #3e3124; background: #e3d2b2; padding: 20px 40px; border: 4px solid #a68962; border-radius: 5px; font-weight:bold; letter-spacing:10px; margin-bottom:30px;";
                papy.innerText = p.uiType==='PAPYRUS' ? 'AMUN' : 'CDE'; innerStage.appendChild(papy);
                createInputBlock('DECODE SCRIPT...', p.ans);
                break;

            case 'SHELLS':
                let shWrap = document.createElement('div'); shWrap.className = 'balls-container'; innerStage.appendChild(shWrap);
                this.stageState.round = 1;
                const playShells = () => {
                    shWrap.innerHTML = '';
                    let ballCount = this.stageState.round === 1 ? 3 : (this.stageState.round === 2 ? 4 : 5);
                    let balls = []; let targetIdx = Math.floor(Math.random() * ballCount);
                    for(let i=0; i<ballCount; i++) {
                        let b = document.createElement('div'); b.className = 'shell-ball'; b.style.left = (i * 70) + 'px';
                        if(i === targetIdx) b.innerText = '⭐';
                        b.onclick = () => {
                            if(this.stageState.playing) return;
                            if(i === targetIdx) { b.innerText = '⭐'; this.playSound('success'); this.stageState.round++; if(this.stageState.round > 3) setTimeout(()=>this.winInteractive(), 500); else setTimeout(()=>playShells(), 1000); }
                            else { b.innerText = '❌'; this.failRoom(); setTimeout(()=>this.setupStage(), 500); }
                        };
                        shWrap.appendChild(b); balls.push(b);
                    }
                    this.stageState.playing = true;
                    setTimeout(() => {
                        balls.forEach(b => b.innerText = ''); let shuffles = 0; let maxShuffles = this.stageState.round * 5 + 5; let speed = 400 - (this.stageState.round * 50);
                        this.stageState.timer = setInterval(() => {
                            let i1 = Math.floor(Math.random() * ballCount), i2 = Math.floor(Math.random() * ballCount);
                            let tempLeft = balls[i1].style.left; balls[i1].style.left = balls[i2].style.left; balls[i2].style.left = tempLeft;
                            shuffles++; if(shuffles > maxShuffles) { clearInterval(this.stageState.timer); this.stageState.playing = false; }
                        }, speed);
                    }, 1500);
                };
                playShells();
                break;

            case 'BARCODE':
                let bcWrap = document.createElement('div'); bcWrap.style.cssText = 'display: flex; gap: 4px; height: 120px; align-items: center; background: #fff; padding: 10px; border-radius: 4px; margin-bottom:20px;';
                let pattern = [1,0,1,0,0,1,0,1,0,1]; this.stageState.arr = [1,0,0,0,0,0,0,0,0,1]; 
                for(let i=0; i<10; i++) {
                    let bar = document.createElement('div'); bar.style.cssText = 'width: 15px; height: 100%; background: #000; cursor: pointer; transition: 0.2s;';
                    if(this.stageState.arr[i] === 0) { bar.style.background = '#ddd'; bar.classList.add('missing'); }
                    bar.onclick = () => { bar.classList.toggle('missing'); bar.style.background = bar.classList.contains('missing') ? '#ddd' : '#000'; this.stageState.arr[i] = bar.classList.contains('missing') ? 0 : 1; };
                    bcWrap.appendChild(bar);
                }
                innerStage.appendChild(bcWrap); innerStage.appendChild(generateSubmitButton(() => { if(JSON.stringify(this.stageState.arr) === JSON.stringify(pattern)) this.winInteractive(); else this.failRoom(); }));
                break;

            case 'RADIO':
                let rdWrap = document.createElement('div'); rdWrap.style.cssText='width:100%; display:flex; flex-direction:column; align-items:center;';
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

            case 'LIGHTS_OUT':
                let loWrap = document.createElement('div'); loWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:5px;';
                let loCells = [];
                for(let i=0; i<p.data; i++) {
                    let c = document.createElement('div'); c.className = 'simon-box pulse'; 
                    c.onclick = () => {
                        c.classList.toggle('pulse');
                        let r = Math.floor(i/3), cl = i%3;
                        if(r > 0) loCells[i-3].classList.toggle('pulse'); if(r < 2) loCells[i+3].classList.toggle('pulse');
                        if(cl > 0) loCells[i-1].classList.toggle('pulse'); if(cl < 2) loCells[i+1].classList.toggle('pulse');
                        if(loCells.every(cell => !cell.classList.contains('pulse'))) setTimeout(() => this.winInteractive(), 300);
                    };
                    loCells.push(c); loWrap.appendChild(c);
                }
                innerStage.appendChild(loWrap);
                break;

            case 'DNA':
                let dnaWrap = document.createElement('div'); dnaWrap.className = 'dna-wrap';
                let bases = ['A','C','G','T']; this.stageState.arr = ['A','A','A','A'];
                ['T','G','A','C'].forEach((target, i) => {
                    let row = document.createElement('div'); row.className = 'dna-row';
                    let left = document.createElement('div'); left.className = 'dna-base dna-fixed'; left.innerText = (target==='T'?'A':(target==='G'?'C':(target==='A'?'T':'G')));
                    let right = document.createElement('div'); right.className = 'dna-base dna-clickable'; right.innerText = 'A';
                    right.onclick = () => { let idx = bases.indexOf(right.innerText); idx = (idx + 1) % 4; right.innerText = bases[idx]; this.stageState.arr[i] = bases[idx]; };
                    row.append(left, right); dnaWrap.appendChild(row);
                });
                innerStage.appendChild(dnaWrap); innerStage.appendChild(generateSubmitButton(() => { if(JSON.stringify(this.stageState.arr) === JSON.stringify(p.ans)) this.winInteractive(); else this.failRoom(); }));
                break;

            case 'PIPES':
                let pipeWrap = document.createElement('div'); pipeWrap.className = 'pipes-grid';
                let pipeChars = ['┗','━','┛','┃','╋','┃','┏','━','┓']; this.stageState.arr = [0,90,0, 90,0,90, 0,90,0];
                for(let i=0; i<9; i++) {
                    let cell = document.createElement('div'); cell.className = 'pipe-cell'; cell.innerText = pipeChars[i];
                    cell.style.transform = `rotate(${this.stageState.arr[i]}deg)`;
                    cell.onclick = () => { this.stageState.arr[i] = (this.stageState.arr[i] + 90) % 360; cell.style.transform = `rotate(${this.stageState.arr[i]}deg)`; if(this.stageState.arr.every(a => a === 0)) setTimeout(()=>this.winInteractive(), 500); };
                    pipeWrap.appendChild(cell);
                }
                innerStage.appendChild(pipeWrap);
                break;

            case 'SLIDING':
                let pzWrap2 = document.createElement('div'); pzWrap2.className = 'sliding-puzzle';
                let tiles2 = [1,2,3,4,5,6,7,0,8]; 
                const renderPuzzle2 = () => {
                    pzWrap2.innerHTML = '';
                    tiles2.forEach((t, i) => {
                        let cell = document.createElement('div'); cell.className = 'slide-tile';
                        if(t === 0) { cell.classList.add('empty'); } else { cell.innerText = t; }
                        cell.onclick = () => {
                            let emptyIdx = tiles2.indexOf(0); let validMoves = [emptyIdx-1, emptyIdx+1, emptyIdx-3, emptyIdx+3];
                            if(emptyIdx%3 === 0 && i === emptyIdx-1) return; if(emptyIdx%3 === 2 && i === emptyIdx+1) return;
                            if(validMoves.includes(i)) { tiles2[emptyIdx] = t; tiles2[i] = 0; renderPuzzle2(); if(tiles2.join('') === p.ans) setTimeout(()=>this.winInteractive(), 300); }
                        };
                        pzWrap2.appendChild(cell);
                    });
                };
                renderPuzzle2(); innerStage.appendChild(pzWrap2);
                break;

            case 'HEATMAP':
                let htWrap = document.createElement('div'); htWrap.className = 'heat-grid';
                let hmColors = {8:'#ff0000', 4:'#ff8800', 9:'#ffcc00', 1:'#ffff66'}; 
                [1,2,3,4,5,6,7,8,9].forEach(n => {
                    let b = document.createElement('button'); b.className = 'heat-btn'; b.innerText = n; b.style.background = hmColors[n] ? hmColors[n] : '#333';
                    if(hmColors[n]) b.style.boxShadow = `inset 0 0 30px ${hmColors[n]}`;
                    b.onclick = () => { this.stageState.arr.push(n); if(this.stageState.arr.length === p.ans.length) { if(JSON.stringify(this.stageState.arr) === JSON.stringify(p.ans)) this.winInteractive(); else { this.failRoom(); this.setupStage(); } } };
                    htWrap.appendChild(b);
                });
                innerStage.appendChild(htWrap);
                break;

            case 'MATRIX':
                let mxWrap = document.createElement('div'); mxWrap.className = 'matrix-screen'; innerStage.appendChild(mxWrap);
                this.stageState.timer = setInterval(() => {
                    let word = document.createElement('div'); word.className = 'matrix-word';
                    let isTarget = Math.random() > 0.8; word.innerText = isTarget ? p.ans : (Math.random().toString(36).substring(2, 7).toUpperCase());
                    word.style.left = Math.random() * 80 + '%'; word.style.top = '-20px'; if(isTarget) word.style.color = '#fff';
                    word.onclick = () => { if(isTarget) this.winInteractive(); else this.failRoom(); }; mxWrap.appendChild(word);
                    let pos = -20; let fall = setInterval(() => { pos += 5; word.style.top = pos + 'px'; if(pos > 250) { clearInterval(fall); word.remove(); } }, 50);
                }, 800);
                break;

            case 'ELEVATOR':
                let elWrap = document.createElement('div'); elWrap.className = 'elevator-panel';
                [1,2,3,4,5,6].forEach(n => {
                    let b = document.createElement('div'); b.className = 'elevator-btn'; b.innerText = n;
                    b.onclick = () => {
                        b.classList.add('active'); setTimeout(()=>b.classList.remove('active'), 300);
                        if(p.ans[this.stageState.clicks] === n) { this.stageState.clicks++; if(this.stageState.clicks === p.ans.length) setTimeout(()=>this.winInteractive(), 300); } else { this.failRoom(); this.setupStage(); }
                    }; elWrap.appendChild(b);
                });
                innerStage.appendChild(elWrap);
                break;

            case 'BOSS':
                let bWrap = document.createElement('div'); bWrap.style.cssText='display:flex; gap:20px; margin-bottom:30px;';
                for(let i=0; i<3; i++) { 
                    let sw = document.createElement('div'); sw.className='switch-lux'; sw.innerHTML = `<div style="position: absolute; top: 15px; width: 70px; height: 55px; background: #050505; border-radius: 4px; box-shadow: inset 0 5px 10px #000; transition: 0.3s;"></div>OFF`;
                    sw.onclick = () => { sw.classList.toggle('active'); if(sw.classList.contains('active')){ sw.innerHTML = `<div style="position: absolute; top: 65px; width: 70px; height: 55px; background: var(--gold); border-radius: 4px; box-shadow: 0 0 20px var(--gold); transition: 0.3s;"></div>ON`; } else { sw.innerHTML = `<div style="position: absolute; top: 15px; width: 70px; height: 55px; background: #050505; border-radius: 4px; box-shadow: inset 0 5px 10px #000; transition: 0.3s;"></div>OFF`; } };
                    bWrap.appendChild(sw); 
                }
                let bInp = document.createElement('input'); bInp.type='text'; bInp.className='cyber-input-lg'; bInp.placeholder='MASTER PASSWORD';
                let bBtn = document.createElement('button'); bBtn.className='btn-execute'; bBtn.innerText='🔥 INITIATE MASTER HACK 🔥'; bBtn.style.background='#ff0000'; bBtn.style.color='#fff'; bBtn.style.borderColor='#fff';
                bBtn.onclick = () => { let allSwitchesOn = Array.from(bWrap.children).every(s=>s.classList.contains('active')); if(allSwitchesOn && bInp.value.trim().toUpperCase() === p.ans) this.winInteractive(); else this.failRoom(); };
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
