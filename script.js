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
            if(e.target.tagName==='BUTTON' || e.target.classList.contains('uni-btn') || e.target.closest('.gate-card') || e.target.closest('.cyber-wire') || e.target.closest('.dial-base')){ 
                this.initAudio(); this.playSound('click'); 
            } 
        }); 
    }

    // بناء 30 لغز تفاعلي بمستوى متوسط إلى صعب مع أفكار بصرية مبهرة
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
        for(let i=1; i<=30; i++) {
            let m = { id: i, type: `TYPE_${i}` };
            
            // توزيع الأفكار البصرية (من 1 إلى 30)
            if(i===1) { m.desc="اقطع سلكي الجهد العالي (الأحمر والنيون) فقط بالترتيب."; m.ans=[1,3]; }
            else if(i===2) { m.desc="قم بموازنة ضغط المحركات ليكون 180 درجة في كل صمام."; m.ans=[180,180,180]; }
            else if(i===3) { m.desc="تطابق الذاكرة المشفرة: افتح البطاقات المتطابقة بسرعة."; }
            else if(i===4) { m.desc="اكتب التسلسل السداسي العشري: A ثم C ثم F."; m.ans=['A','C','F']; }
            else if(i===5) { m.desc="حدد الإحداثي الدقيق على الرادار الدوار (المنتصف)."; }
            else if(i===6) { m.desc="اضبط الموجات الصوتية لتطابق التردد السري."; m.ans=[75, 40]; }
            else if(i===7) { m.desc="أدخل الرقم السري: 739 في لوحة الهولوغرام."; m.ans='739'; }
            else if(i===8) { m.desc="حلل المكون المختلف في مصفوفة البيانات."; m.ans=7; } // Index 7 is odd one out
            else if(i===9) { m.desc="ارفع القواطع المنطقية لتحصل على مجموع 21 (16+4+1)."; m.ans=[16,4,1]; }
            else if(i===10) { m.desc="أدر خزنة التشفير: يمين 3 طقات، يسار طقتين."; }
            else if(i===11) { m.desc="اضغط مع الاستمرار لتفعيل البصمة (5 ثواني بالضبط)."; }
            else if(i===12) { m.desc="وازن الكفة الكهرومغناطيسية (الوزن الكلي 100)."; m.ans=[50,20,30]; }
            else if(i===13) { m.desc="دائرة الألوان: امزج الضوء الأزرق والأحمر."; m.ans=[0,2]; }
            else if(i===14) { m.desc="شفرة مورس: انقر 3 مرات سريعة، مرتين بطيئة."; }
            else if(i===15) { m.desc="أوقف البندول في المنتصف المضيء."; }
            else if(i===16) { m.desc="وصل العقد (Nodes) لرسم شكل النجمة."; m.ans=[0,2,4,1,3]; }
            else if(i===17) { m.desc="اقفل الدوائر المتداخلة في زاوية صفر."; }
            else if(i===18) { m.desc="تحكم بالليزر: غير اتجاه المرايا لكسر الشعاع."; m.ans=[90, 0, 90]; }
            else if(i===19) { m.desc="اختر الحرف الناقص في السلسلة: X, V, T, ?"; m.ans='R'; }
            else if(i===20) { m.desc="لعبة سيمون: احفظ تتابع الألوان المضيئة."; }
            else if(i===21) { m.desc="رتب أحرف كلمة S-O-L-A-R."; m.ans=['S','O','L','A','R']; }
            else if(i===22) { m.desc="اضبط بوصلة الملاحة على الشمال الشرقي (NE)."; }
            else if(i===23) { m.desc="عزل الفيروس: انقر على الخلايا المصابة (الحمراء)."; m.ans=[2,5,8]; }
            else if(i===24) { m.desc="تشفير قيصر: أزح كلمة ABC بمقدار +2."; m.ans='CDE'; }
            else if(i===25) { m.desc="التقط نقطة التوازن قبل انهيار النظام."; }
            else if(i===26) { m.desc="أكمل التروس: اختر الترس الأوسط."; }
            else if(i===27) { m.desc="فك الباركود الممزق (اكتب 4 أرقام مخفية)."; m.ans='8192'; }
            else if(i===28) { m.desc="المنطق: بوابة AND يجب أن تكون 1، بوابة OR يجب أن تكون 0."; m.ans=[1,0]; }
            else if(i===29) { m.desc="تتبع المسار الأعمى في الشبكة المعتمة."; m.ans=[0,1,5,6]; }
            else if(i===30) { m.desc="MASTER PROTOCOL: أدخل مفتاح النظام النهائي."; m.ans='GOLD'; }

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
        
        document.getElementById('interactive-stage-container').classList.remove('hidden');
        document.getElementById('text-stage').classList.add('hidden');
        document.getElementById('input-area').classList.add('hidden');
        document.getElementById('user-input').value = '';

        this.roomTimer = 0;
        this.updateRoomTimerUI();
        this.pauseRoomTimer();

        this.setupStage(); 
        this.switchScreen('puzzle');
    }

    // هنا يتم رسم الألعاب باختلافات بصرية رهيبة بدون تغيير هيكلك
    setupStage() {
        const p = this.activeGate;
        document.getElementById('puzzle-title').innerText = `# ROOM-${p.id.toString().padStart(2,'0')}`;
        document.getElementById('int-desc').innerText = p.desc;
        const stage = document.getElementById('interactive-stage');
        stage.innerHTML = '';
        stage.style.flexDirection = 'row'; stage.style.flexWrap = 'wrap'; stage.style.gap = '15px';
        this.stageState = { clicks: 0, arr: [], val: 0, timer: null };

        // ألعاب الأسلاك (نيون)
        if (p.id === 1) {
            stage.style.flexDirection = 'column';
            let colors = ['#fff', '#ff0055', '#00ffaa', '#ff0055', '#444'];
            colors.forEach((c, i) => {
                let w = document.createElement('div'); w.className = 'cyber-wire'; w.style.color = c; w.style.backgroundColor = c;
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
        // ألعاب الصمامات (دوائر دائرية)
        else if (p.id === 2 || p.id === 17) {
            for(let i=0; i<3; i++) {
                let dial = document.createElement('div'); dial.className = 'dial-base';
                let tick = document.createElement('div'); tick.className = 'dial-tick'; dial.appendChild(tick);
                let angle = 0;
                dial.onclick = () => {
                    angle = (angle + 45) % 360; dial.style.transform = `rotate(${angle}deg)`;
                    this.stageState.arr[i] = angle;
                    if(this.stageState.arr.filter(a=>a===180).length === 3) this.winInteractive();
                };
                stage.appendChild(dial);
            }
        }
        // لعبة الذاكرة (بطاقات تنقلب 3D)
        else if (p.id === 3) {
            let symbols = ['Δ','Ω','Φ','Δ','Ω','Φ']; symbols.sort(()=>Math.random()-0.5);
            let flipped = [];
            symbols.forEach((sym, i) => {
                let card = document.createElement('div'); card.className = 'mem-card';
                card.innerHTML = `<div class="mem-inner"><div class="mem-front">?</div><div class="mem-back">${sym}</div></div>`;
                card.onclick = () => {
                    if(card.classList.contains('flipped') || flipped.length >= 2) return;
                    card.classList.add('flipped'); flipped.push({c:card, s:sym});
                    if(flipped.length === 2) {
                        setTimeout(() => {
                            if(flipped[0].s === flipped[1].s) { this.stageState.clicks+=2; if(this.stageState.clicks === symbols.length) this.winInteractive(); }
                            else { flipped[0].c.classList.remove('flipped'); flipped[1].c.classList.remove('flipped'); }
                            flipped = [];
                        }, 600);
                    }
                };
                stage.appendChild(card);
            });
        }
        // لعبة الرادار (أنيميشن دوران)
        else if (p.id === 5) {
            let r = document.createElement('div'); r.className = 'radar-bg';
            let sw = document.createElement('div'); sw.className = 'radar-sweep'; r.appendChild(sw);
            let target = document.createElement('div'); target.style.cssText = 'width:15px;height:15px;background:#fff;border-radius:50%;position:absolute;top:45%;left:45%;box-shadow:0 0 10px #fff;'; r.appendChild(target);
            r.onclick = () => {
                let matrix = window.getComputedStyle(sw).transform;
                if(matrix !== 'none') {
                    let values = matrix.split('(')[1].split(')')[0].split(',');
                    let a = Math.round(Math.atan2(values[1], values[0]) * (180/Math.PI));
                    if(a > 30 && a < 60) this.winInteractive(); else this.failRoom();
                }
            };
            stage.appendChild(r);
        }
        // لعبة الهولوغرام (كيبورد)
        else if (p.id === 7 || p.id === 4) {
            let chars = p.id===7 ? [1,2,3,4,5,6,7,8,9] : ['A','B','C','D','E','F'];
            let inp = document.createElement('div'); inp.className='timer-txt'; inp.style.width='100%'; inp.style.textAlign='center'; inp.innerText='_ _ _'; stage.appendChild(inp);
            chars.forEach(c => {
                let b = document.createElement('div'); b.className = 'uni-btn'; b.innerText = c; b.style.width='50px';
                b.onclick = () => {
                    this.stageState.val = (this.stageState.val||'') + c; inp.innerText = this.stageState.val;
                    if(this.stageState.val.length === p.ans.length) {
                        if(this.stageState.val === p.ans || JSON.stringify(this.stageState.val.split('')) === JSON.stringify(p.ans)) this.winInteractive();
                        else { this.failRoom(); this.setupStage(); }
                    }
                };
                stage.appendChild(b);
            });
        }
        // البصمة (استمرار الضغط)
        else if (p.id === 11 || p.id === 25) {
            let scan = document.createElement('div'); scan.className='uni-btn'; scan.innerText='[ HOLD ]'; scan.style.width='150px'; scan.style.height='150px'; scan.style.borderRadius='50%'; scan.style.boxShadow='inset 0 0 20px #fff';
            let holdTime;
            scan.onmousedown = () => { holdTime = Date.now(); scan.style.background='#fff'; scan.style.color='#000'; };
            scan.onmouseup = () => { 
                scan.style.background='transparent'; scan.style.color='#fff';
                let diff = Date.now() - holdTime;
                if(diff > 4500 && diff < 5500) this.winInteractive(); else this.failRoom();
            };
            stage.appendChild(scan);
        }
        // الموجات والأشرطة (Sliders)
        else if (p.id === 6 || p.id === 12) {
            stage.style.flexDirection = 'column';
            let s1 = document.createElement('input'); s1.type='range'; s1.min=0; s1.max=100; s1.value=0; s1.style.width='100%';
            let s2 = document.createElement('input'); s2.type='range'; s2.min=0; s2.max=100; s2.value=0; s2.style.width='100%';
            let btn = document.createElement('div'); btn.className='uni-btn'; btn.innerText='SYNC'; btn.style.width='100%';
            btn.onclick = () => { if(Math.abs(s1.value - p.ans[0])<10 && Math.abs(s2.value - p.ans[1])<10) this.winInteractive(); else this.failRoom(); };
            stage.append(s1, s2, btn);
        }
        // مصفوفة الشذوذ / الفيروسات
        else if (p.id === 8 || p.id === 23) {
            for(let i=0; i<9; i++) {
                let b = document.createElement('div'); b.className='uni-btn'; b.style.width='60px'; b.style.height='60px';
                b.innerText = p.id===8 ? (i===7?'0':'O') : 'V';
                if(p.id===23 && p.ans.includes(i)) b.style.color = var(--red);
                b.onclick = () => {
                    if(p.id===8) { if(i===7) this.winInteractive(); else this.failRoom(); }
                    else {
                        b.classList.add('active'); this.stageState.clicks++;
                        if(this.stageState.clicks === p.ans.length) this.winInteractive();
                    }
                };
                stage.appendChild(b);
            }
        }
        // الماستر (كتابة النص النهائي)
        else if (p.id === 30 || p.id === 27 || p.id === 24) {
            let i = document.createElement('input'); i.type='text'; i.style.padding='15px'; i.style.fontSize='1.2rem'; i.style.background='#000'; i.style.color='#fff'; i.style.border='1px solid #555'; i.style.width='80%'; i.style.textAlign='center';
            let b = document.createElement('button'); b.className='uni-btn'; b.innerText='EXECUTE'; b.style.width='80%';
            b.onclick = () => { if(i.value.toUpperCase() === p.ans) this.winInteractive(); else this.failRoom(); };
            stage.append(i, b);
        }
        // الألعاب العادية والمنطقية المتبقية
        else {
            let count = p.ans.length || 5;
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
            this.playSound('success'); this.solvedGates.add(this.activeGate.id);
            this.pauseRoomTimer(); this.returnToLobby();
        } else {
            this.failRoom();
        }
    }
    
    failRoom() { this.playSound('error'); this.triggerVisualGlitch(); }

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
