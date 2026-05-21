class SolarGamesEngine {
    constructor() {
        this.coins = 60;
        this.activeGate = null;
        this.roomTimer = 0;
        this.roomInterval = null;
        this.solvedGates = new Set();
        this.audioCtx = null;
        
        this.gameConfig = this.buildPuzzles();
        this.init();
        this.setupClickListeners();
    }

    init() { this.renderLobby(); document.getElementById('coin-val').innerText = this.coins; }

    initAudio() {
        if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    }

    playSound(type) {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain); gain.connect(this.audioCtx.destination);
        const now = this.audioCtx.currentTime;
        
        if(type === 'click') {
            osc.type = 'square'; osc.frequency.setValueAtTime(300, now);
            gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'success') {
            osc.type = 'sine'; 
            osc.frequency.setValueAtTime(440, now); osc.frequency.setValueAtTime(554.37, now + 0.1); 
            gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
        } else if (type === 'error') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(120, now);
            gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
        }
    }
    
    triggerVisualGlitch() { 
        const c = document.getElementById('main-puzzle-card'); 
        if(c) { c.classList.add('error-glitch'); setTimeout(()=>c.classList.remove('error-glitch'), 400); } 
    }
    
    setupClickListeners() { 
        document.addEventListener('click', (e) => { 
            if(e.target.tagName==='BUTTON' || e.target.classList.contains('uni-btn') || e.target.closest('.gate-card')){ 
                this.initAudio(); this.playSound('click'); 
            } 
        }); 
    }

    // 30 لغز تفاعلي بأشكال وأفكار مختلفة (لا يوجد تكرار)
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
            {q: "تحترق وتبكي لتضيء للآخرين؟", a: "الشمعة"}, {q: "المعدن النقي الذي يرمز لنسخة SOLAR؟", a: "الذهب"}
        ];

        let mechanics = [];
        // توليد 30 محرك تفاعلي مختلف
        for(let i=1; i<=30; i++) {
            let m = {};
            if(i===1) m = { id: 1, type: 'WIRES', desc: "اقطع الأسلاك الحمراء الثلاثة فقط.", data: ['red','blue','green','red','white','black','red'], ans: 3 };
            else if(i===2) m = { id: 2, type: 'VALVES', desc: "لف البكرات الأربع لتشير جميعها للأسفل.", data: 4, ans: 180 };
            else if(i===3) m = { id: 3, type: 'SLIDERS', desc: "اسحب المؤشرات الثلاثة للنهاية (اليمين).", data: 3, ans: 100 };
            else if(i===4) m = { id: 4, type: 'MEMORY', desc: "طابق بطاقات الكاميرات المتشابهة.", data: ['📷','📹','🎥','📽'] };
            else if(i===5) m = { id: 5, type: 'KEYPAD', desc: "أدخل شفرة المثلث ثم المربع ثم الدائرة.", data: ['▲','■','●','♦','★','✖'], ans: ['▲','■','●'] };
            else if(i===6) m = { id: 6, type: 'SWITCHES', desc: "ارفع القواطع الفردية فقط.", data: 6, ans: [0,2,4] };
            else if(i===7) m = { id: 7, type: 'PUSH', desc: "اضغط الزر الأحمر الكبير.", data: 1 };
            else if(i===8) m = { id: 8, type: 'RADAR', desc: "حدد الهدف في الخلية C3.", data: 16, ans: 10 };
            else if(i===9) m = { id: 9, type: 'NODES', desc: "وصل زوايا الشبكة.", data: 9, ans: [0,2,6,8] };
            else if(i===10) m = { id: 10, type: 'SAFE_DIAL', desc: "أدخل الرقم 5 عن طريق الأزرار (+/-).", ans: 5 };
            else if(i===11) m = { id: 11, type: 'COLOR_MIX', desc: "اختر لوني الأحمر والأصفر لتكوين البرتقالي.", data: ['Red','Blue','Yellow','Green'], ans: ['Red','Yellow'] };
            else if(i===12) m = { id: 12, type: 'VENN', desc: "اضغط على تقاطع الدوائر الثلاث.", data: 7, ans: 3 };
            else if(i===13) m = { id: 13, type: 'FINGERPRINT', desc: "امسح البصمة (اضغط 5 مرات متتالية).", ans: 5 };
            else if(i===14) m = { id: 14, type: 'DPAD', desc: "أدخل: يمين، يسار، يمين.", data: ['↑','↓','←','→'], ans: ['➡️','⬅️','➡️'] };
            else if(i===15) m = { id: 15, type: 'PIANO', desc: "اعزف النوتة 1 ثم 3 ثم 5.", data: 5, ans: [0,2,4] };
            else if(i===16) m = { id: 16, type: 'WEIGHTS', desc: "وازن الكفة باختيار 3 أوزان متساوية.", data: [10, 20, 10, 30, 10], ans: [0,2,4] };
            else if(i===17) m = { id: 17, type: 'LASER', desc: "قم بتدوير المرآتين بزاوية 90 درجة.", data: 2, ans: 90 };
            else if(i===18) m = { id: 18, type: 'FILES', desc: "حدد ملف الـ Virus للحذف.", data: ['System.sys', 'Config.ini', 'Virus.exe', 'Log.txt'], ans: 2 };
            else if(i===19) m = { id: 19, type: 'CLOCK', desc: "اضبط عقرب الساعات على 3.", data: 12, ans: 3 };
            else if(i===20) m = { id: 20, type: 'RUNES', desc: "اضغط الحجر ذو النجمة.", data: ['☾','★','✦','✧'], ans: 1 };
            else if(i===21) m = { id: 21, type: 'COMPASS', desc: "وجه البوصلة للشمال (N).", data: ['N','S','E','W'], ans: 0 };
            else if(i===22) m = { id: 22, type: 'PIXELS', desc: "نور المربعات المركزية لعمل خط عمودي.", data: 9, ans: [1,4,7] };
            else if(i===23) m = { id: 23, type: 'HEATMAP', desc: "ابحث عن النقطة الساخنة واضغطها.", data: 6, ans: 4 };
            else if(i===24) m = { id: 24, type: 'DIFFERENCE', desc: "حدد العنصر المختلف في المجموعة الثانية.", data: ['A','A','A','B'], ans: 3 };
            else if(i===25) m = { id: 25, type: 'JIGSAW', desc: "اضغط حروف S O L A R بالترتيب.", data: ['L','S','R','O','A'], ans: [1,3,0,4,2] };
            else if(i===26) m = { id: 26, type: 'BATTERY', desc: "اربط الأقطاب الموجبة (+).", data: ['+','-','-','+'], ans: [0,3] };
            else if(i===27) m = { id: 27, type: 'PRESSURE', desc: "نفّس الضغط عن طريق فتح الصمام الأخير.", data: 4, ans: [3] };
            else if(i===28) m = { id: 28, type: 'RADIO', desc: "اضبط الراديو على القناة 3.", data: 5, ans: 2 };
            else if(i===29) m = { id: 29, type: 'WAVE', desc: "طابق الموجات برفع المؤشرين للوسط.", data: 2, ans: 50 };
            else if(i===30) m = { id: 30, type: 'MASTER', desc: "MASTER OVERRIDE: فعّل النظام بكتابة YES.", ans: 'YES' };

            m.txtQ = riddles[i-1].q;
            m.txtA = riddles[i-1].a;
            mechanics.push(m);
        }
        return mechanics;
    }

    switchScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(`screen-${id}`).classList.remove('hidden');
        document.getElementById('main-nav').classList.toggle('hidden', id === 'welcome');
    }

    startLobby() { this.initAudio(); this.playSound('click'); this.switchScreen('lobby'); }

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
        
        // إعداد الغرفة وإيقاف التايمر القديم
        document.getElementById('interactive-stage-container').classList.remove('hidden');
        document.getElementById('text-stage').classList.add('hidden');
        document.getElementById('input-area').classList.add('hidden');
        document.getElementById('user-input').value = '';

        this.roomTimer = 0;
        this.updateRoomTimerUI();
        this.pauseRoomTimer(); // العداد يبدأ يدوياً من المشرف

        this.setupStage(); 
        this.switchScreen('puzzle');
    }

    // بناء الواجهات التفاعلية (HTML/CSS Factory لـ 30 لعبة)
    setupStage() {
        const p = this.activeGate;
        document.getElementById('puzzle-title').innerText = `# ROOM-${p.id.toString().padStart(2,'0')}`;
        document.getElementById('int-desc').innerText = p.desc;
        const stage = document.getElementById('interactive-stage');
        stage.innerHTML = '';
        
        this.stageState = { clicks: 0, sequence: [], active: [] };
        
        // واجهة مرنة تناسب جميع الألعاب
        stage.style.display = 'flex'; stage.style.flexWrap = 'wrap'; stage.style.gap = '15px';

        let generateButtons = (arr, clickHandler) => {
            arr.forEach((item, i) => {
                let btn = document.createElement('div'); btn.className = 'uni-btn';
                btn.style.width = '80px'; btn.style.height = '80px'; btn.innerText = item;
                btn.onclick = () => clickHandler(btn, i);
                stage.appendChild(btn);
            });
        };

        if (p.type === 'WIRES') {
            p.data.forEach((color, i) => {
                let btn = document.createElement('div'); btn.className = 'uni-btn'; btn.style.width = '100%'; btn.style.height = '30px';
                btn.style.borderLeft = `10px solid ${color}`; btn.innerText = `WIRE ${i+1}`;
                btn.onclick = () => { btn.style.opacity = '0.2'; if(color === 'red') { this.stageState.clicks++; if(this.stageState.clicks === p.ans) this.winInteractive(); } }
                stage.appendChild(btn);
            });
        }
        else if (p.type === 'VALVES') {
            this.stageState.angles = Array(p.data).fill(0);
            for(let i=0; i<p.data; i++) {
                let btn = document.createElement('div'); btn.className = 'uni-btn'; btn.innerText = '⚙'; btn.style.fontSize = '2rem'; btn.style.borderRadius='50%';
                btn.onclick = () => { this.stageState.angles[i] = (this.stageState.angles[i]+90)%360; btn.style.transform = `rotate(${this.stageState.angles[i]}deg)`; if(this.stageState.angles.every(a => a === p.ans)) this.winInteractive(); }
                stage.appendChild(btn);
            }
        }
        else if (p.type === 'SLIDERS' || p.type === 'WAVE') {
            stage.style.flexDirection = 'column';
            for(let i=0; i<p.data; i++) {
                let inp = document.createElement('input'); inp.type = 'range'; inp.min=0; inp.max=100; inp.value=0; inp.style.width='100%';
                stage.appendChild(inp);
            }
            let check = document.createElement('button'); check.className='uni-btn'; check.innerText="SYNC";
            check.onclick = () => { let vals = Array.from(stage.querySelectorAll('input')).map(i=>parseInt(i.value)); if(vals.every(v => Math.abs(v - p.ans) < 10)) this.winInteractive(); else this.failRoom(); }
            stage.appendChild(check);
        }
        else if (p.type === 'MEMORY') {
            let deck = [...p.data, ...p.data].sort(()=>Math.random()-0.5);
            generateButtons(deck, (btn, i) => {
                if(btn.style.background === 'white') return;
                btn.style.background = 'white'; btn.style.color = '#000'; this.stageState.sequence.push({btn, val: deck[i]});
                if(this.stageState.sequence.length === 2) {
                    setTimeout(() => {
                        if(this.stageState.sequence[0].val === this.stageState.sequence[1].val) { this.stageState.clicks+=2; if(this.stageState.clicks === deck.length) this.winInteractive(); }
                        else { this.stageState.sequence[0].btn.style.background = ''; this.stageState.sequence[0].btn.style.color = ''; this.stageState.sequence[1].btn.style.background = ''; this.stageState.sequence[1].btn.style.color = ''; }
                        this.stageState.sequence = [];
                    }, 500);
                }
            });
            Array.from(stage.children).forEach(b => {b.style.color='transparent';});
        }
        else if (p.type === 'SWITCHES' || p.type === 'PIXELS') {
            generateButtons(Array(p.data).fill(''), (btn, i) => {
                btn.classList.toggle('active');
                let actives = Array.from(stage.children).map((b,idx)=>b.classList.contains('active')?idx:-1).filter(idx=>idx!==-1);
                if(actives.length === p.ans.length && p.ans.every(v=>actives.includes(v))) this.winInteractive();
            });
        }
        else if (p.type === 'SAFE_DIAL') {
            let val = 0; let d = document.createElement('div'); d.className='uni-btn'; d.innerText=val; d.style.width='100px';
            let plus = document.createElement('div'); plus.className='uni-btn'; plus.innerText='+'; plus.onclick=()=>{val++; d.innerText=val; if(val===p.ans) this.winInteractive();}
            let minus = document.createElement('div'); minus.className='uni-btn'; minus.innerText='-'; minus.onclick=()=>{val--; d.innerText=val;}
            stage.append(minus, d, plus);
        }
        else if (p.type === 'MASTER') {
            let inp = document.createElement('input'); inp.placeholder="TYPE YES"; inp.style.padding="10px";
            let btn = document.createElement('button'); btn.className='uni-btn'; btn.innerText="EXECUTE"; btn.onclick=()=>{if(inp.value.toUpperCase()==='YES') this.winInteractive(); else this.failRoom();}
            stage.append(inp, btn);
        }
        else if (p.type === 'COLOR_MIX') {
            generateButtons(p.data, (btn, i) => {
                btn.classList.toggle('active');
                let actives = Array.from(stage.children).filter(b=>b.classList.contains('active')).map(b=>b.innerText);
                if(actives.length === p.ans.length && p.ans.every(v=>actives.includes(v))) this.winInteractive();
            });
        }
        else if (p.type === 'FINGERPRINT' || p.type === 'PUSH') {
            let btn = document.createElement('div'); btn.className='uni-btn'; btn.style.width='150px'; btn.style.height='150px'; btn.style.borderRadius='50%'; btn.innerText="SCAN";
            btn.onclick = () => { this.stageState.clicks++; if(this.stageState.clicks >= (p.ans||1)) this.winInteractive(); }
            stage.appendChild(btn);
        }
        else {
            // كيبوردات عادية وتسلسلات واختيارات (تغطي باقي الألعاب)
            generateButtons(p.data || Array(p.data).fill('X'), (btn, i) => {
                if(Array.isArray(p.ans)) {
                    if(p.ans[this.stageState.step] === i || p.ans[this.stageState.step] === p.data[i]) {
                        btn.classList.add('active'); this.stageState.step++;
                        if(this.stageState.step === p.ans.length) this.winInteractive();
                    } else { this.failRoom(); this.setupStage(); }
                } else {
                    if(i === p.ans) this.winInteractive(); else this.failRoom();
                }
            });
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
            this.playSound('success'); this.solvedGates.add(this.activeGate.id);
            this.pauseRoomTimer(); this.returnToLobby();
        } else {
            this.failRoom();
        }
    }
    
    failRoom() { this.playSound('error'); this.triggerVisualGlitch(); }

    /* --- التايمر الخاص بالغرفة (Room Timer) بناءً على طلبك --- */
    startRoomTimer() {
        if(this.roomInterval) clearInterval(this.roomInterval);
        this.roomInterval = setInterval(() => {
            this.roomTimer++; this.updateRoomTimerUI();
        }, 1000);
    }
    pauseRoomTimer() { clearInterval(this.roomInterval); }
    modifyRoomTimer(secs) { this.roomTimer = Math.max(0, this.roomTimer + secs); this.updateRoomTimerUI(); }
    updateRoomTimerUI() {
        let m = Math.floor(this.roomTimer/60).toString().padStart(2,'0');
        let s = (this.roomTimer%60).toString().padStart(2,'0');
        document.getElementById('room-timer-display').innerText = `${m}:${s}`;
    }

    toggleAdminSidebar(open) { this.playSound('click'); const sidebar = document.getElementById('admin-sidebar'); open ? sidebar.classList.add('open') : sidebar.classList.remove('open'); }
    adminInstantSolveGate() {
        this.playSound('click');
        if(!this.activeGate) return;
        this.toggleAdminSidebar(false);
        this.solvedGates.add(this.activeGate.id);
        this.pauseRoomTimer(); this.returnToLobby();
    }

    returnToLobby() { this.playSound('click'); this.switchScreen('lobby'); this.renderLobby(); }
}
const game = new SolarGamesEngine();
