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
            if(e.target.tagName==='BUTTON' || e.target.classList.contains('simon-box') || e.target.classList.contains('cyber-switch') || e.target.classList.contains('cyber-valve') || e.target.classList.contains('cyber-weight') || e.target.classList.contains('cyber-node') || e.target.closest('.channel-card') || e.target.closest('.cyber-wire') || e.target.closest('.dial-base')){ 
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
            
            if(i===1) { m.uiType = 'WIRES'; m.desc="الأسلاك الحساسة: اقطع السلك الأحمر، ثم الأزرق اللي تحته."; m.ans=[1,2]; m.data=['#fff','#ff0055','#00ccff','#ff0055']; m.hint="الثاني ثم الثالث."; }
            else if(i===2) { m.uiType = 'SIMON'; m.desc="لعبة النبض: اتبع نمط المربعات المضيئة ووجهني."; m.ans=[3, 8, 14, 5]; m.data=16; m.hint="النبضات: يمين فوق، يسار تحت، الخ."; }
            else if(i===3) { m.uiType = 'SWITCHES'; m.desc="قواطع الطاقة: ارفع القواطع اللي مجموعها يساوي 25."; m.ans=[10,5,8,5,10,2]; m.target=25; m.hint="الأول، الرابع، الخامس."; }
            else if(i===4) { m.uiType = 'DIAL'; m.desc="الخزنة الصوتية: استمع للطقات ووجهني (يمين/يسار)."; m.ans=[45, 90, 45]; m.hint="يمين 1، يسار 2، يمين 1."; }
            else if(i===5) { m.uiType = 'BARCODE'; m.desc="الباركود الممزق: استنتج الأرقام الناقصة من التسلسل."; m.ans='4815'; m.hint="التسلسل هو 4815."; }
            else if(i===6) { m.uiType = 'VALVES'; m.desc="موازنة الضغط: وجهني للصمامات ليصبح الضغط 100 PSI."; m.data=[20,30,-10,50]; m.target=100; m.hint="الأول والثاني والرابع."; }
            else if(i===7) { m.uiType = 'WEIGHTS'; m.desc="الميزان الدقيق: اختر الأوزان التي تجعل الكفة 180 جرام."; m.data=[50,60,70,80,90]; m.target=180; m.hint="50 + 60 + 70."; }
            else if(i===8) { m.uiType = 'RADAR'; m.desc="الرادار المعتم: حدد إحداثيات الوميض."; m.ans=12; m.data=25; m.hint="النقطة في المنتصف تماماً."; }
            else if(i===9) { m.uiType = 'FRAGMENTS'; m.desc="البصمة المشفرة: اختر 3 أجزاء متطابقة."; m.data=6; m.ans=[1,3,5]; m.hint="الثاني والرابع والسادس."; }
            else if(i===10) { m.uiType = 'INPUT'; m.desc="تشفير الألوان: ما هو ناتج دمج الأحمر والأصفر؟"; m.ans='برتقالي'; m.hint="اللون برتقالي."; }
            else if(i===11) { m.uiType = 'CRYPTEX'; m.desc="الكريبتكس: حل المعادلة (5x5+10) وأدخل الكود."; m.ans='035'; m.hint="035."; }
            else if(i===12) { m.uiType = 'NODES'; m.desc="خريطة الخوادم: اختر مسار من 3 سيرفرات سرعته 150."; m.data=[50,20,80, 50,50,40, 10,70,50]; m.target=150; m.hint="السيرفرات القطرية."; }
            else if(i===13) { m.uiType = 'SWITCHES'; m.desc="البوابات المنطقية: (1 AND 1) OR 0."; m.ans=[1,1,0]; m.target='LOGIC'; m.hint="شغل الأول والثاني."; }
            else if(i===14) { m.uiType = 'INPUT'; m.desc="تشفير قيصر: أزح الكلمة (CDE) بمقدار +2."; m.ans='EFG'; m.hint="EFG."; }
            else if(i===15) { m.uiType = 'MAZE'; m.desc="المتاهة العمياء: وجهني بالأسهم."; m.data=16; m.ans=[2,6,10]; m.hint="العمود الثالث."; }
            else if(i===16) { m.uiType = 'BARCODE'; m.desc="الملف السري: ما هو رقم الملف؟ (عكس 1234)."; m.ans='4321'; m.hint="4321."; }
            else if(i===17) { m.uiType = 'DIAL'; m.desc="التروس: دور الترس الثاني ليتطابق مع الأول."; m.ans=[0, 90, 0]; m.hint="الثاني زاوية 90."; }
            else if(i===18) { m.uiType = 'RADAR'; m.desc="الشذوذ: ابحث عن الرمز المختلف."; m.data=16; m.ans=7; m.hint="الصف الثاني، الأخير."; }
            else if(i===19) { m.uiType = 'SIMON'; m.desc="الذاكرة العكسية: انقر عكس النبضات."; m.data=9; m.ans=[8,7,6]; m.hint="من اليمين لليسار تحت."; }
            else if(i===20) { m.uiType = 'WEIGHTS'; m.desc="موازنة الحرارة: اختر المبردات لتصل إلى 0."; m.data=[10,-20,15,-5,10]; m.target=0; m.hint="اختر 10، -20، 10."; }
            else if(i===21) { m.uiType = 'INPUT'; m.desc="المربع السحري: الرقم الناقص في المنتصف ليصبح المجموع 15."; m.ans='5'; m.hint="الرقم 5."; }
            else if(i===22) { m.uiType = 'INPUT'; m.desc="مورس المعكوس: (.-) تصبح (-.). ما الحرف؟"; m.ans='N'; m.hint="حرف N."; }
            else if(i===23) { m.uiType = 'NODES'; m.desc="اختراق الشبكة: شغل العقد الطرفية فقط."; m.data=[1,0,1, 0,0,0, 1,0,1]; m.target='CORNERS'; m.hint="الزوايا الأربع."; }
            else if(i===24) { m.uiType = 'WIRES'; m.desc="الأسلاك المعقدة: اقطع الأول والأخير."; m.data=['#fff','#333','#333','#fff']; m.ans=[0,3]; m.hint="الأبيض فقط."; }
            else if(i===25) { m.uiType = 'INPUT'; m.desc="الكلمة العكسية: (RALOS)."; m.ans='SOLAR'; m.hint="SOLAR."; }
            else if(i===26) { m.uiType = 'VALVES'; m.desc="دوارق السوائل: كيف تحصل على 4؟"; m.data=[8,5,-3,-1]; m.target=4; m.hint="5 ناقص 1."; }
            else if(i===27) { m.uiType = 'SWITCHES'; m.desc="قواطع الطوارئ: شغل القواطع الفردية."; m.ans=[1,2,3,4]; m.target='ODD'; m.hint="الأول والثالث."; }
            else if(i===28) { m.uiType = 'BARCODE'; m.desc="التردد المفقود: أدخل 199X."; m.ans='1999'; m.hint="1999."; }
            else if(i===29) { m.uiType = 'FRAGMENTS'; m.desc="التسلسل الجيني: اختر العينات الصحيحة."; m.data=4; m.ans=[0,3]; m.hint="الأول والأخير."; }
            else if(i===30) { m.uiType = 'BOSS'; m.desc="MASTER OVERRIDE: شغل 3 مفاتيح واكتب GOLDEN."; m.ans='GOLDEN'; m.hint="شغلها كلها واكتب GOLDEN."; }

            m.txtQ = riddles[i-1].q;
            m.txtA = riddles[i-1].a;
            mechanics.push(m);
        }
        return mechanics;
    }

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

    // هنا تعديل إضافة / وخصم الكوينز من الآدمن
    addCoins(amount) {
        this.playSound('click');
        this.coins = Math.max(0, this.coins + amount); // ما ينزل تحت الصفر
        this.updateCoinsUI();
        if(amount > 0) this.showToast(`تم إضافة ${amount} كوينز!`);
        else this.showToast(`تم خصم ${Math.abs(amount)} كوينز!`, '#ff3333');
    }
    updateCoinsUI() {
        document.getElementById('coin-val').innerText = this.coins;
        document.getElementById('market-coins').innerText = this.coins;
    }

    toggleMarket(show) {
        this.playSound('click');
        const m = document.getElementById('market-modal');
        if(show) { m.classList.remove('hidden'); this.updateCoinsUI(); this.updateGlobalTimerUI(); }
        else m.classList.add('hidden');
    }
    
    buyHint(type) {
        this.playSound('click');
        if(!this.activeGate) { this.showToast('يجب أن تكون داخل روم لتشتري تلميح!', '#ff3333'); return; }
        
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
            if(this.timeFrozen) { this.showToast('الحماية مجمدة مسبقاً!', '#ff3333'); return; }
            this.coins -= 40;
            this.timeFrozen = true;
            this.updateGlobalTimerUI();
            this.showToast('❄️ تم تجميد الحماية لمدة دقيقتين!', '#00ccff');
            setTimeout(() => {
                this.timeFrozen = false;
                this.updateGlobalTimerUI();
                this.showToast('انتهى التجميد!', '#ff3333');
            }, 120000); 
        } else { this.showToast('رصيدك غير كافٍ!', '#ff3333'); }
        this.updateCoinsUI();
    }

    displayHint() {
        this.toggleMarket(false);
        const hd = document.getElementById('hint-display');
        hd.innerText = this.activeGate.hint;
        hd.classList.remove('hidden');
    }

    switchScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(`screen-${id}`).classList.remove('hidden');
        document.getElementById('main-nav').classList.toggle('hidden', id === 'welcome');
    }

    startLobby() { 
        this.initAudio(); this.playSound('click'); 
        this.isTimerRunning = true; 
        this.switchScreen('lobby'); 
    }

    // بناء قائمة الرومات (بستايل ديسكورد وحالة النور الفخم)
    renderLobby() {
        const c = document.getElementById('gates-container'); c.innerHTML = '';
        for(let i=1; i<=30; i++) {
            let btn = document.createElement('div'); 
            
            let isSolved = this.solvedGates.has(i);
            let isLocked = i !== 1 && !this.solvedGates.has(i - 1); 
            let isNext = !isSolved && !isLocked; // الروم المتاح حالياً (يشع نور)

            btn.className = `channel-card ${isSolved ? 'solved' : ''} ${isLocked ? 'locked' : ''} ${isNext ? 'unlocked-next' : ''}`;
            
            let info = document.createElement('div'); info.className = 'channel-info';
            let title = document.createElement('h3'); title.innerText = `CHANNEL-${i.toString().padStart(2, '0')}`;
            let status = document.createElement('span'); status.className = 'channel-status';
            
            if(isNext) { status.innerText = 'BYPASS REQUIRED'; status.style.color = 'var(--gold)'; }
            else if(isSolved) { status.innerText = 'HACKED'; status.style.color = 'var(--green)'; }
            else { status.innerText = 'ENCRYPTED'; status.style.color = '#555'; }

            info.append(title, status);
            btn.appendChild(info);

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

        this.setupStage(); 
        this.switchScreen('puzzle');
    }

    setupStage() {
        const p = this.activeGate;
        document.getElementById('int-desc').innerText = p.desc;
        const stage = document.getElementById('interactive-stage');
        stage.innerHTML = '';
        stage.style.flexDirection = 'row'; stage.style.flexWrap = 'wrap'; stage.style.gap = '15px';
        this.stageState = { clicks: 0, arr: [], val: 0 };

        const createInputBlock = (placeholder, ans) => {
            let wrap = document.createElement('div'); wrap.className = 'cyber-input-box';
            let inp = document.createElement('input'); inp.type = 'text'; inp.className = 'cyber-input'; inp.placeholder = placeholder;
            let btn = document.createElement('button'); btn.className = 'btn-prime'; btn.innerText = 'تأكيد الاختراق (Execute)'; btn.style.width = '80%'; btn.style.background = '#000';
            btn.onclick = () => { if(inp.value.trim().toUpperCase() === ans) this.winInteractive(); else this.failRoom(); };
            wrap.append(inp, btn); stage.appendChild(wrap);
        };

        switch(p.uiType) {
            case 'WIRES':
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
                break;
            case 'SIMON':
                for(let i=0; i<p.data; i++) {
                    let b = document.createElement('div'); b.className = 'simon-box';
                    b.onclick = () => {
                        if(p.ans[this.stageState.clicks] === i) {
                            b.classList.add('pulse'); setTimeout(()=>b.classList.remove('pulse'), 300);
                            this.stageState.clicks++;
                            if(this.stageState.clicks === p.ans.length) this.winInteractive();
                        } else { this.failRoom(); this.setupStage(); }
                    };
                    stage.appendChild(b);
                }
                break;
            case 'SWITCHES':
                p.data.forEach((val, i) => {
                    let sw = document.createElement('div'); sw.className = 'cyber-switch'; sw.innerText = 'OFF';
                    sw.onclick = () => {
                        sw.classList.toggle('active'); sw.innerText = sw.classList.contains('active') ? 'ON' : 'OFF';
                        if(p.target === 'LOGIC' || p.target === 'ODD') {
                            let actives = Array.from(stage.children).map((x,idx)=>x.classList.contains('active')?idx:-1).filter(x=>x!==-1);
                            if(actives.length === p.ans.length && p.ans.every(a => actives.includes(a))) { setTimeout(()=>this.winInteractive(), 300); }
                        } else {
                            let sum = Array.from(stage.children).reduce((acc, el, idx) => acc + (el.classList.contains('active') ? p.data[idx] : 0), 0);
                            if(sum === p.target) { setTimeout(()=>this.winInteractive(), 300); }
                        }
                    };
                    stage.appendChild(sw);
                });
                break;
            case 'DIAL':
                let dial = document.createElement('div'); dial.className = 'dial-base';
                let tick = document.createElement('div'); tick.className = 'dial-tick'; dial.appendChild(tick);
                let angle = 0;
                dial.onclick = () => {
                    angle = (angle + 45) % 360; dial.style.transform = `rotate(${angle}deg)`;
                    this.stageState.arr.push(angle);
                    if(this.stageState.arr.length === p.ans.length) {
                        if(JSON.stringify(this.stageState.arr) === JSON.stringify(p.ans)) this.winInteractive();
                        else { this.failRoom(); this.setupStage(); }
                    }
                };
                stage.appendChild(dial);
                break;
            case 'BARCODE':
                let bc = document.createElement('div');
                bc.style.cssText = 'width: 90%; height: 100px; background: repeating-linear-gradient(90deg, #000 0, #000 4px, transparent 4px, transparent 8px, #000 8px, #000 12px, transparent 12px, transparent 18px, var(--gold) 18px, var(--gold) 20px); clip-path: polygon(0 0, 100% 0, 100% 80%, 90% 100%, 80% 80%, 70% 100%, 60% 80%, 50% 100%, 40% 80%, 30% 100%, 20% 80%, 10% 100%, 0 80%); margin-bottom: 20px; border-top: 4px solid var(--gold); box-shadow: 0 10px 20px rgba(0,0,0,0.8);';
                stage.appendChild(bc);
                createInputBlock('أدخل الأرقام المفقودة...', p.ans);
                break;
            case 'VALVES':
                let gauge = document.createElement('div'); gauge.style.cssText = 'width:100%; text-align:center; font-size:2.5rem; color:var(--gold); margin-bottom:15px; font-family:monospace; text-shadow:0 0 15px var(--gold);'; gauge.innerText = '0 PSI'; stage.appendChild(gauge);
                p.data.forEach(val => {
                    let v = document.createElement('div'); v.className = 'cyber-valve'; v.innerText = (val>0?'+':'')+val;
                    v.onclick = () => {
                        this.stageState.val += val; gauge.innerText = `${this.stageState.val} PSI`;
                        if(this.stageState.val === p.target) { setTimeout(()=>this.winInteractive(), 300); }
                        else if(this.stageState.val > 200 || this.stageState.val < -50) { this.failRoom(); this.setupStage(); }
                    };
                    stage.appendChild(v);
                });
                break;
            case 'WEIGHTS':
                p.data.forEach((w, i) => {
                    let box = document.createElement('div'); box.className = 'cyber-weight'; box.innerText = w+'g';
                    box.onclick = () => {
                        box.classList.toggle('active');
                        let sum = Array.from(stage.children).reduce((acc, el, idx) => acc + (el.classList.contains('active') ? p.data[idx] : 0), 0);
                        if(sum === p.target) { setTimeout(()=>this.winInteractive(), 300); }
                    };
                    stage.appendChild(box);
                });
                break;
            case 'RADAR':
                stage.style.display = 'grid'; stage.style.gridTemplateColumns = `repeat(${Math.sqrt(p.data)}, 50px)`; stage.style.gap = '5px';
                for(let i=0; i<p.data; i++) {
                    let cell = document.createElement('div'); cell.className = 'radar-grid-cell'; cell.style.height = '50px';
                    cell.onclick = () => { if(i === p.ans) this.winInteractive(); else this.failRoom(); };
                    stage.appendChild(cell);
                }
                break;
            case 'FRAGMENTS':
                for(let i=0; i<p.data; i++) {
                    let frag = document.createElement('div'); frag.style.cssText = 'width:60px; height:60px; background:repeating-radial-gradient(circle, transparent, transparent 5px, var(--gold) 5px, var(--gold) 6px); border:1px solid #333; cursor:pointer; opacity:0.5; transition:0.3s; border-radius:10px;';
                    frag.onclick = () => {
                        frag.style.opacity = '1'; frag.style.borderColor = 'var(--gold)'; frag.classList.add('active');
                        let actives = Array.from(stage.children).map((x,idx)=>x.classList.contains('active')?idx:-1).filter(x=>x!==-1);
                        if(actives.length === p.ans.length) {
                            if(p.ans.every(a => actives.includes(a))) this.winInteractive();
                            else { this.failRoom(); this.setupStage(); }
                        }
                    };
                    stage.appendChild(frag);
                }
                break;
            case 'NODES':
                p.data.forEach((n, i) => {
                    let node = document.createElement('div'); node.className = 'cyber-node';
                    node.onclick = () => {
                        node.classList.toggle('active');
                        if(p.target === 'CORNERS') {
                            let actives = Array.from(stage.children).map((x,idx)=>x.classList.contains('active')?idx:-1).filter(x=>x!==-1);
                            let corners = [0,2,6,8];
                            if(actives.length === 4 && corners.every(c=>actives.includes(c))) setTimeout(()=>this.winInteractive(), 300);
                        } else {
                            let sum = Array.from(stage.children).reduce((acc, el, idx) => acc + (el.classList.contains('active') ? p.data[idx] : 0), 0);
                            if(sum === p.target) setTimeout(()=>this.winInteractive(), 300);
                        }
                    };
                    stage.appendChild(node);
                });
                break;
            case 'CRYPTEX':
                let wrap = document.createElement('div'); wrap.style.display='flex'; wrap.style.gap='10px'; wrap.style.marginBottom='20px';
                for(let i=0; i<3; i++) { let inp = document.createElement('input'); inp.type='number'; inp.className='cyber-input'; inp.style.width='80px'; wrap.appendChild(inp); }
                let btnC = document.createElement('button'); btnC.className='btn-prime'; btnC.innerText='فتح (Unlock)';
                btnC.onclick = () => {
                    let val = Array.from(wrap.children).map(i=>i.value).join('');
                    if(val === p.ans) this.winInteractive(); else this.failRoom();
                };
                stage.append(wrap, btnC);
                break;
            case 'MAZE':
                stage.style.display = 'grid'; stage.style.gridTemplateColumns = 'repeat(4, 60px)'; stage.style.gap = '2px';
                for(let i=0; i<p.data; i++) {
                    let cell = document.createElement('div'); cell.style.cssText = 'height:60px; background:#111; border:1px solid #222; cursor:pointer;';
                    cell.onclick = () => {
                        if(p.ans[this.stageState.clicks] === i) {
                            cell.style.background = 'var(--gold)'; this.stageState.clicks++;
                            if(this.stageState.clicks === p.ans.length) setTimeout(()=>this.winInteractive(), 300);
                        } else { this.failRoom(); this.setupStage(); }
                    };
                    stage.appendChild(cell);
                }
                break;
            case 'INPUT':
                createInputBlock('أدخل الكود...', p.ans);
                break;
            case 'BOSS':
                let bWrap = document.createElement('div'); bWrap.style.display='flex'; bWrap.style.gap='20px'; bWrap.style.marginBottom='20px';
                for(let i=0; i<3; i++) { let sw = document.createElement('div'); sw.className='cyber-switch'; sw.innerText='SYS_'+i; sw.onclick=()=>sw.classList.toggle('active'); bWrap.appendChild(sw); }
                let bInp = document.createElement('input'); bInp.type='text'; bInp.className='cyber-input'; bInp.placeholder='MASTER PASSWORD'; bInp.style.marginBottom='20px';
                let bBtn = document.createElement('button'); bBtn.className='btn-prime'; bBtn.innerText='اختراق النظام النهائي'; bBtn.style.background='#220000'; bBtn.style.color='#ff3333'; bBtn.style.borderColor='#ff3333';
                bBtn.onclick = () => {
                    let allSwitchesOn = Array.from(bWrap.children).every(s=>s.classList.contains('active'));
                    if(allSwitchesOn && bInp.value.trim().toUpperCase() === p.ans) this.winInteractive(); else this.failRoom();
                };
                stage.append(bWrap, bInp, bBtn);
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
            this.showToast('تم اختراق الروم بنجاح! +15 COINS');
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
