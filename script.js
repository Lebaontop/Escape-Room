class SolarGamesEngine {
    constructor() {
        this.coins = 0; // الرصيد يبدأ من صفر، كل غرفة 15
        this.globalTime = 90 * 60; // ساعة ونصف = 5400 ثانية
        this.isTimerRunning = false;
        this.timeFrozen = false;
        
        this.activeGate = null;
        this.solvedGates = new Set();
        this.audioCtx = null;
        
        this.gameConfig = this.buildPuzzles();
        this.init();
        this.setupClickListeners();
        
        // تشغيل المؤقت العام
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
            osc.type = 'square'; osc.frequency.setValueAtTime(300, now);
            gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'success') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(440, now); osc.frequency.setValueAtTime(554.37, now + 0.1); 
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
            if(e.target.tagName==='BUTTON' || e.target.classList.contains('uni-btn') || e.target.classList.contains('simon-box') || e.target.classList.contains('radar-grid-cell') || e.target.closest('.gate-card') || e.target.closest('.cyber-wire') || e.target.closest('.dial-base')){ 
                this.initAudio(); this.playSound('click'); 
            } 
        }); 
    }

    // الألغاز مع تلميحات مخصصة للسوق (تلميح للغز البصري والكتابي)
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
            
            // توزيع 30 لعبة تفاعلية تعتمد على التوجيه الصوتي
            if(i===1) { m.desc="الأسلاك الحساسة: اقطع السلك الأحمر، ثم السلك اللي تحته مباشرة."; m.ans=[1,2]; m.hint="التلميح: الأسلاك هي (الثاني ثم الثالث). جواب اللغز: عكس النور."; }
            else if(i===2) { m.desc="لعبة النبض: اتبع نمط المربعات المضيئة (احفظ التسلسل ووجهني)."; m.ans=[3, 8, 14, 5]; m.hint="التلميح: احفظ المربعات اللي تنور. جواب اللغز: يذوب في الحرارة."; }
            else if(i===3) { m.desc="القواطع الكهربائية: ارفع القواطع اللي مجموعها يساوي 25."; m.ans=[0,3,4]; m.hint="التلميح: ارفع القاطع الأول والرابع والخامس. جواب اللغز: لا يمكنك البوح به."; }
            else if(i===4) { m.desc="الخزنة الصوتية: استمع للطقات ووجهني (كم طقة يمين، كم يسار؟)"; m.ans=[45, 90, 45]; m.hint="التلميح: يمين طقة، يسار طقتين، يمين طقة. جواب اللغز: يزيد كل سنة."; }
            else if(i===5) { m.desc="الباركود الممزق: استنتج الأرقام الناقصة من التسلسل."; m.ans='4815'; m.hint="التلميح: الأرقام هي مسلسل شهير (4815). جواب اللغز: يرتد لك من الجدار."; }
            else if(i===6) { m.desc="موازنة الضغط: وجهني لأضغط الصمامات ليصبح الضغط 100 PSI."; m.ans=[20,30,50]; m.hint="التلميح: اضغط الصمام الأول، الثاني، والرابع. جواب اللغز: يمتص السوائل."; }
            else if(i===7) { m.desc="الميزان الدقيق: اختر 3 أوزان تجعل الكفة 180 جرام."; m.ans=[0,2,4]; m.hint="التلميح: الأوزان هي 50، 60، 70. جواب اللغز: يأتي غداً."; }
            else if(i===8) { m.desc="الرادار المعتم: حدد الإحداثيات اللي ظهر فيها الوميض."; m.ans=12; m.hint="التلميح: الوميض في الخلية بالمنتصف. جواب اللغز: تقطعه لتفي به."; }
            else if(i===9) { m.desc="البصمة المشفرة: اختر 3 أجزاء تكوّن بصمة متطابقة."; m.ans=[1,3,5]; m.hint="التلميح: الأجزاء هي الثاني والرابع والسادس. جواب اللغز: لغته السكوت."; }
            else if(i===10) { m.desc="دمج الألوان: اختر لونين لإنتاج اللون البرتقالي."; m.ans=[0,2]; m.hint="التلميح: الأحمر والأصفر. جواب اللغز: قشرتها هشة."; }
            else if(i===11) { m.desc="الكريبتكس: حل المعادلة السريعة لاستخراج كود التدوير (5x5+10)."; m.ans='035'; m.hint="التلميح: الكود هو 035. جواب اللغز: تنشفك وتتبلل."; }
            else if(i===12) { m.desc="خريطة الخوادم: اختر مسار يمر بـ 3 سيرفرات سرعته 150ms."; m.ans=[0,4,8]; m.hint="التلميح: اختر السيرفرات القطرية. جواب اللغز: ترسم العالم."; }
            else if(i===13) { m.desc="البوابات المنطقية: أعطني قيم (0 أو 1) لتشغيل النظام."; m.ans=[1,1,0]; m.hint="التلميح: القيم هي 1, 1, 0. جواب اللغز: تعرف به الوقت."; }
            else if(i===14) { m.desc="تشفير قيصر: أزح كلمة CDE بمقدار +2."; m.ans='EFG'; m.hint="التلميح: الكلمة EFG. جواب اللغز: يمطر."; }
            else if(i===15) { m.desc="المتاهة العمياء: وجهني بالأسهم لتجاوز المتاهة."; m.ans=[2,6,10]; m.hint="التلميح: يمين، تحت، يمين. جواب اللغز: صيفي ولذيذ."; }
            // لباقي الألعاب (16-30)، نضع نفس الآلية لضمان عدم وجود أخطاء في الـ JS
            else { 
                m.desc="تحليل النظام: استنتج النمط الصحيح من الرموز المعروضة."; 
                m.ans=[0,1,2]; 
                m.hint="التلميح: الخيارات الأولى هي الصحيحة. جواب اللغز: ركز في الحروف."; 
            }

            m.txtQ = riddles[i-1].q;
            m.txtA = riddles[i-1].a;
            mechanics.push(m);
        }
        return mechanics;
    }

    /* --- التحكم بالمؤقت العام (الساعة ونص) --- */
    toggleGlobalTimer() { 
        this.playSound('click');
        this.isTimerRunning = !this.isTimerRunning; 
        this.showToast(this.isTimerRunning ? "تم تشغيل العداد العام" : "تم إيقاف العداد العام");
    }
    modifyGlobalTimer(secs) { 
        this.playSound('click');
        this.globalTime = Math.max(0, this.globalTime + secs); 
        this.updateGlobalTimerUI(); 
    }
    updateGlobalTimerUI() {
        let h = Math.floor(this.globalTime / 3600).toString().padStart(2,'0');
        let m = Math.floor((this.globalTime % 3600) / 60).toString().padStart(2,'0');
        let s = (this.globalTime % 60).toString().padStart(2,'0');
        document.getElementById('global-timer-display').innerText = `${h}:${m}:${s}`;
        document.getElementById('market-time').innerText = `${h}:${m}:${s}`;
        if(this.timeFrozen) { document.getElementById('global-timer-display').style.color = '#00ccff'; }
        else { document.getElementById('global-timer-display').style.color = '#fff'; }
    }

    /* --- إدارة الرصيد --- */
    addCoins(amount) {
        this.playSound('click');
        this.coins += amount;
        this.updateCoinsUI();
        this.showToast(`تم إضافة ${amount} كوينز!`);
    }
    updateCoinsUI() {
        document.getElementById('coin-val').innerText = this.coins;
        document.getElementById('market-coins').innerText = this.coins;
    }

    /* --- نظام السوق (Market) --- */
    toggleMarket(show) {
        this.playSound('click');
        const m = document.getElementById('market-modal');
        if(show) { m.classList.remove('hidden'); this.updateCoinsUI(); this.updateGlobalTimerUI(); }
        else m.classList.add('hidden');
    }
    
    buyHint(type) {
        this.playSound('click');
        if(!this.activeGate) { this.showToast('يجب أن تكون داخل غرفة لتشتري تلميح!', '#ff3333'); return; }
        
        if(type === 'coins') {
            if(this.coins >= 60) {
                this.coins -= 60;
                this.showToast('تم شراء التلميح بنجاح!');
                this.displayHint();
            } else { this.showToast('رصيدك غير كافٍ!', '#ff3333'); }
        } else if (type === 'time') {
            if(this.globalTime > 300) {
                this.globalTime -= 300;
                this.showToast('تم شراء التلميح بخصم 5 دقائق!');
                this.displayHint();
            } else { this.showToast('الوقت المتبقي لا يكفي!', '#ff3333'); }
        }
        this.updateCoinsUI();
        this.updateGlobalTimerUI();
    }

    buyFreeze() {
        this.playSound('click');
        if(this.coins >= 40) {
            if(this.timeFrozen) { this.showToast('الوقت مجمد مسبقاً!', '#ff3333'); return; }
            this.coins -= 40;
            this.timeFrozen = true;
            this.updateGlobalTimerUI();
            this.showToast('❄️ تم تجميد الوقت لمدة دقيقتين!', '#00ccff');
            setTimeout(() => {
                this.timeFrozen = false;
                this.updateGlobalTimerUI();
                this.showToast('انتهى تجميد الوقت!', '#ff3333');
            }, 120000); // دقيقتين
        } else { this.showToast('رصيدك غير كافٍ!', '#ff3333'); }
        this.updateCoinsUI();
    }

    displayHint() {
        this.toggleMarket(false);
        const hd = document.getElementById('hint-display');
        hd.innerText = this.activeGate.hint;
        hd.classList.remove('hidden');
    }

    /* --- التنقل والواجهات --- */
    switchScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(`screen-${id}`).classList.remove('hidden');
        document.getElementById('main-nav').classList.toggle('hidden', id === 'welcome');
    }

    startLobby() { 
        this.initAudio(); this.playSound('click'); 
        this.isTimerRunning = true; // يبدأ العداد مع دخول اللوبي
        this.switchScreen('lobby'); 
    }

    renderLobby() {
        const c = document.getElementById('gates-container'); c.innerHTML = '';
        for(let i=1; i<=30; i++) {
            let btn = document.createElement('div'); 
            let isLocked = i !== 1 && !this.solvedGates.has(i - 1); 
            btn.className = `gate-card ${this.solvedGates.has(i) ? 'solved':''} ${isLocked ? 'locked':''}`;
            btn.innerHTML = `<h3>ROOM-${i.toString().padStart(2, '0')}</h3>`;
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
        document.getElementById('hint-display').classList.add('hidden'); // إخفاء التلميح للغرفة الجديدة

        this.setupStage(); 
        this.switchScreen('puzzle');
    }

    setupStage() {
        const p = this.activeGate;
        document.getElementById('puzzle-title').innerText = `# ROOM-${p.id.toString().padStart(2,'0')}`;
        document.getElementById('int-desc').innerText = p.desc;
        const stage = document.getElementById('interactive-stage');
        stage.innerHTML = '';
        stage.style.flexDirection = 'row'; stage.style.flexWrap = 'wrap'; stage.style.gap = '15px';
        this.stageState = { clicks: 0, arr: [], val: 0 };

        // بناء الواجهات البصرية للتفاعل الصوتي
        if (p.id === 1) { // أسلاك
            stage.style.flexDirection = 'column';
            let colors = ['#fff', '#ff0055', '#00ffaa', '#ff0055', '#444'];
            colors.forEach((c, i) => {
                let w = document.createElement('div'); w.className = 'cyber-wire'; w.style.backgroundColor = c;
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
        else if (p.id === 2) { // لعبة النبض (Simon)
            let boxes = [];
            for(let i=0; i<16; i++) {
                let b = document.createElement('div'); b.className = 'simon-box';
                b.onclick = () => {
                    if(p.ans[this.stageState.clicks] === i) {
                        b.classList.add('pulse'); setTimeout(()=>b.classList.remove('pulse'), 300);
                        this.stageState.clicks++;
                        if(this.stageState.clicks === p.ans.length) this.winInteractive();
                    } else { this.failRoom(); this.setupStage(); }
                };
                stage.appendChild(b); boxes.push(b);
            }
            // أنيميشن النبض الافتتاحي
            let step = 0;
            let iv = setInterval(() => {
                if(step < p.ans.length) {
                    let bx = boxes[p.ans[step]];
                    bx.classList.add('pulse'); this.playSound('click');
                    setTimeout(()=>bx.classList.remove('pulse'), 500);
                    step++;
                } else { clearInterval(iv); }
            }, 1000);
        }
        else if (p.id === 4) { // خزنة قرص
            let dial = document.createElement('div'); dial.className = 'dial-base';
            let tick = document.createElement('div'); tick.className = 'dial-tick'; dial.appendChild(tick);
            let angle = 0;
            dial.onclick = () => {
                angle = (angle + 45) % 360; dial.style.transform = `rotate(${angle}deg)`;
                this.stageState.arr.push(angle);
                if(this.stageState.arr.length === 3) {
                    if(JSON.stringify(this.stageState.arr) === JSON.stringify(p.ans)) this.winInteractive();
                    else { this.failRoom(); this.setupStage(); }
                }
            };
            stage.appendChild(dial);
        }
        else { // الأزرار العامة لباقي الألعاب
            let count = p.ans.length || 6;
            for(let i=0; i<count; i++) {
                let b = document.createElement('div'); b.className='uni-btn'; b.innerText = 'SYS_'+i;
                b.onclick = () => {
                    b.classList.add('active'); this.stageState.clicks++;
                    if(this.stageState.clicks === count) this.winInteractive();
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
            this.addCoins(15); // إضافة 15 كوينز لكل باب صح
            this.showToast('تم اختراق الباب بنجاح! +15 COINS');
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
        this.showToast('تم تخطي الباب من قبل الآدمن!');
        this.returnToLobby();
    }

    returnToLobby() { this.playSound('click'); this.switchScreen('lobby'); this.renderLobby(); }
}
const game = new SolarGamesEngine();
