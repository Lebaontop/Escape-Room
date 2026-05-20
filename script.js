class MajesticEscape {
    constructor() {
        this.coins = 60;
        this.activeGate = null;
        this.timer = null;
        this.timeLeft = 0;
        this.isPaused = false;
        this.isTimerFrozen = false; 
        this.hasShield = false;      
        this.solvedGates = new Set();
        this.pendingGateId = null; 
        
        // متغيرات الألعاب الأساسية
        this.wireSeq = []; this.switchStates = []; this.userNodes = [];
        this.safeInputs = []; this.safeTarget = [];
        
        // متغيرات محرك Grid-12
        this.gridState = { selections: [], step: 0, sequence: [], pairs: [] };

        this.sounds = {
            beep: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
            error: new Audio('https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3'),
            success: new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3')
        };

        this.puzzles = this.buildPuzzles();
        this.init();
        this.setupClickSounds();
    }

    init() { this.renderLobby(); this.updateStats(); }
    playSound(t) { if(this.sounds[t]) { this.sounds[t].currentTime=0; this.sounds[t].play().catch(e=>{}); } }
    triggerVisualGlitch() { const c = document.getElementById('main-puzzle-card'); if(c) { c.classList.add('error-glitch'); setTimeout(()=>c.classList.remove('error-glitch'), 400); } }
    setupClickSounds() { document.addEventListener('click', (e) => { if(e.target.tagName==='BUTTON' || e.target.classList.contains('wire') || e.target.classList.contains('grid12-btn')){ this.playSound('beep'); } }); }

    // بناء 30 لغز و30 لعبة تفاعلية بـ 12 خيار
    buildPuzzles() {
        const riddles = [
            {q:"شيء كلما زاد، قلّت رؤيتك له. ما هو؟", a:"الظلام"}, {q:"ابن الماء، وإذا وضعته في الماء مات. فما هو؟", a:"الثلج"},
            {q:"شيء احتفاظك به لك، وإذا شاركته مع الناس فقدته؟", a:"السر"}, {q:"شيء يرتفع ولا ينزل أبدًا؟", a:"العمر"},
            {q:"يتحدث بلا فم ويسمع بلا أذنين؟", a:"الصدى"}, {q:"مليء بالثقوب ولكنه يحتفظ بالماء؟", a:"الاسفنج"},
            {q:"دائمًا أمامك ولكن لا يمكنك رؤيته؟", a:"المستقبل"}, {q:"لا يمكنك الاحتفاظ به إلا بعد إعطائه؟", a:"الوعد"},
            {q:"إذا نطقت باسمه كسرته؟", a:"الصمت"}, {q:"شيء يجب كسره قبل استخدامه؟", a:"البيضة"},
            {q:"كلما جففت شيئًا، أصبحت أكثر بللًا؟", a:"المنشفة"}, {q:"فيها مدن بلا منازل، وغابات بلا أشجار؟", a:"الخريطة"},
            {q:"لها عقارب ولكن لا تلدغ؟", a:"الساعة"}, {q:"يمشي بلا أرجل ويبكي بلا أعين؟", a:"السحاب"},
            {q:"أخضر من الخارج، أحمر من الداخل؟", a:"البطيخ"}, {q:"له رأس ولا عين له؟", a:"المسمار"},
            {q:"يبكي دمعًا أسود ليضيء العقول؟", a:"القلم"}, {q:"يكبر في الصباح ويختفي في الظهيرة؟", a:"الظل"},
            {q:"دائمًا تشير للشمال ولكنها لا تتحرك؟", a:"البوصلة"}, {q:"تسمعها ولكن لا تراها ولا تلمسها؟", a:"الريح"},
            {q:"تأكل كل شيء وتخاف من الماء؟", a:"النار"}, {q:"كلما أخذت منه كبر؟", a:"الحفرة"},
            {q:"يقرصك ولا تراه؟", a:"الجوع"}, {q:"يملكه الشخص ويستخدمه الآخرون أكثر منه؟", a:"الاسم"},
            {q:"كلما أخذت منه أكثر، تركت أكثر وراءك؟", a:"الخطوة"}, {q:"يسقط ولا يتأذى أبدًا؟", a:"المطر"},
            {q:"كلمة من 4 حروف، إذا أكلت نصفها تموت؟", a:"سمسم"}, {q:"مدينة سعودية تقرأ طرديا وعكسيا نفس الشيء؟", a:"العلا"},
            {q:"تحترق وتبكي لتضيء للآخرين؟", a:"الشمعة"}, {q:"المعدن النقي الذي يرمز لنسخة SOLAR؟", a:"الذهب"}
        ];

        // 30 لعبة بمتطلبات 12 خيار ومتوسطة الصعوبة
        const games = [
            { type: 'WIRE', hint: "الأحمر ثم الأزرق ثم الأصفر ثم الأخضر" }, // 1
            { type: 'SAFE', hint: "الشفرة: 1984" }, // 2
            { type: 'SWITCHES', hint: "فعلها جميعاً للون الأخضر بالتناوب" }, // 3
            { type: 'NODES', hint: "وصل الزوايا الأربع بالترتيب (1, 4, 9, 12)" }, // 4
            { type: 'GRID12', mode: 'QUIZ', desc: "رسائل شات: استخرج الكلمة الصحيحة", opts: ["LOL", "AFK", "BRB", "SOLAR", "GG", "WP", "NOOB", "PRO", "HACK", "PING", "LAG", "BAN"], ans: ["SOLAR"], hint: "كلمة ترتبط باسم اللعبة" }, // 5
            { type: 'GRID12', mode: 'QUIZ', desc: "الرابط العجيب: سيارة 911، شمس، كنز", opts: ["سرعة", "حرارة", "مال", "أصفر", "ذهبي", "أحمر", "نار", "SOLAR", "قوة", "محرك", "نور", "فضاء"], ans: ["SOLAR"], hint: "النسخة الحالية" }, // 6
            { type: 'GRID12', mode: 'MULTI', target: 3, desc: "أوجد الاختلاف: حدد الـ 3 مربعات المصابة", opts: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], ans: ["3", "7", "11"], hint: "عمود كامل فيه خلل" }, // 7
            { type: 'GRID12', mode: 'SEQ', desc: "سلسلة القصة: رتب الـ 4 أحداث (ولادة، طفولة، شباب، شيب)", opts: ["عصا", "زواج", "مدرسة", "مهد", "جامعة", "سيارة", "عمل", "مستشفى", "تقاعد", "طفولة", "شباب", "شيب"], ans: ["مهد", "طفولة", "شباب", "شيب"], hint: "من البداية للنهاية" }, // 8
            { type: 'GRID12', mode: 'QUIZ', desc: "تردد الراديو: اختر التردد الصحيح لإشارة الاستغاثة", opts: ["88.1", "90.5", "92.3", "95.5", "98.0", "100.1", "101.5", "103.3", "105.7", "107.9", "110.0", "112.5"], ans: ["101.5"], hint: "يبدأ بـ 101" }, // 9
            { type: 'GRID12', mode: 'PAIRS', desc: "الذاكرة البصرية: طابق الـ 6 أزواج", opts: ["💻","💻","📡","📡","🔋","🔋","🔑","🔑","⚙️","⚙️","🛡️","🛡️"], hint: "احفظ الأماكن بدقة" }, // 10
            { type: 'GRID12', mode: 'MULTI', target: 3, desc: "ميزان الكتلة: اختر 3 أوزان مجموعها 500g", opts: ["50", "100", "150", "200", "250", "300", "350", "400", "450", "500", "550", "600"], ans: ["100", "150", "250"], hint: "100 + 150 + ..." }, // 11
            { type: 'GRID12', mode: 'QUIZ', desc: "تناقض الألوان (Stroop): الكلمة 'أحمر' مكتوبة بلون أزرق، ماذا تختار؟", opts: ["أحمر", "أخضر", "أصفر", "أزرق", "أسود", "أبيض", "برتقالي", "بنفسجي", "وردي", "بني", "رمادي", "سماوي"], ans: ["أزرق"], hint: "اختر لون الخط لا الكلمة" }, // 12
            { type: 'GRID12', mode: 'QUIZ', desc: "متوالية رقمية: 2، 4، 8، ... ، 32", opts: ["10", "12", "14", "16", "18", "20", "22", "24", "26", "28", "30", "34"], ans: ["16"], hint: "الضرب في 2" }, // 13
            { type: 'GRID12', mode: 'MULTI', target: 4, desc: "البحث عن كلمة: حدد حروف كلمة GOLD", opts: ["G", "A", "B", "O", "X", "L", "Y", "Z", "D", "M", "N", "P"], ans: ["G", "O", "L", "D"], hint: "أربعة حروف" }, // 14
            { type: 'GRID12', mode: 'QUIZ', desc: "فك الشفرة الثنائية: 1010 يساوي كم؟", opts: ["2", "4", "6", "8", "10", "12", "14", "16", "18", "20", "22", "24"], ans: ["10"], hint: "نظام العد الثنائي (8+2)" }, // 15
            { type: 'GRID12', mode: 'PAIRS', desc: "الأيقونات المتضادة: طابق كل شيء بعكسه (نار/ثلج، شمس/قمر...)", opts: ["🔥","❄️","☀️","🌙","⬆️","⬇️","😊","😢","🔓","🔒","🟢","🔴"], hint: "النار مع الثلج" }, // 16
            { type: 'WIRE', hint: "الأزرق ثم الأصفر ثم البنفسجي ثم الأسود" }, // 17
            { type: 'SAFE', hint: "الشفرة: 2026" }, // 18
            { type: 'SWITCHES', hint: "الزوايا أولاً" }, // 19
            { type: 'NODES', hint: "نمط حرف Z (1,2,3,4, 7,6, 9,10,11,12)" }, // 20
            { type: 'GRID12', mode: 'QUIZ', desc: "من أكون؟ ذكي، صامت، يمتلك مفاتيح العالم", opts: ["كتاب", "قلم", "كمبيوتر", "هاتف", "خزنة", "هكر", "سيرفر", "باب", "شمس", "قمر", "نجم", "بحر"], ans: ["كمبيوتر"], hint: "آلة" }, // 21
            { type: 'GRID12', mode: 'MULTI', target: 3, desc: "تحدي الصور: اختر 3 أشياء لا تنتمي للتقنية", opts: ["ماوس", "شاشة", "تفاحة", "كيبورد", "رام", "شجرة", "سيرفر", "هاردسك", "قطة", "معالج", "راوتر", "كيبل"], ans: ["تفاحة", "شجرة", "قطة"], hint: "أشياء طبيعية" }, // 22
            { type: 'GRID12', mode: 'SEQ', desc: "خريطة النجوم: وصل الكوكبة بالترتيب الصحيح (حسب الحجم)", opts: ["⭐1", "⭐2", "⭐3", "⭐4", "⭐5", "⭐6", "⭐7", "⭐8", "⭐9", "⭐10", "⭐11", "⭐12"], ans: ["⭐1", "⭐2", "⭐3"], hint: "من 1 إلى 3" }, // 23
            { type: 'GRID12', mode: 'QUIZ', desc: "الساعة التكتيكية: أي ساعة تشير لـ 3:15؟", opts: ["12:00", "1:05", "2:10", "3:15", "4:20", "5:25", "6:30", "7:35", "8:40", "9:45", "10:50", "11:55"], ans: ["3:15"], hint: "الزاوية 90 درجة" }, // 24
            { type: 'GRID12', mode: 'MULTI', target: 5, desc: "الخلايا المصابة: نقي الفايروسات الخمسة (V)", opts: ["V", "O", "O", "V", "O", "O", "V", "O", "O", "V", "V", "O"], ans: ["V"], hint: "اضغط على كل V" }, // 25
            { type: 'GRID12', mode: 'QUIZ', desc: "المفتاح الغامض: اختر المفتاح المطابق للقفل الذهبي", opts: ["🔑1", "🔑2", "🔑3", "🔑4", "🔑5", "🔑6", "🔑7", "🔑8", "🔑9", "🔑10", "🔑11", "🔑12"], ans: ["🔑7"], hint: "رقم الحظ" }, // 26
            { type: 'GRID12', mode: 'SEQ', desc: "لوحة تحكم السيرفر: اضغط الأزرار تصاعدياً من 10 إلى 40", opts: ["10", "40", "20", "30", "15", "25", "35", "45", "5", "50", "55", "60"], ans: ["10", "20", "30", "40"], hint: "10 ثم 20..." }, // 27
            { type: 'GRID12', mode: 'PAIRS', desc: "فك التشفير البصري: طابق الرموز المتشابهة", opts: ["α","α","β","β","γ","γ","δ","δ","ε","ε","ζ","ζ"], hint: "أحرف يونانية" }, // 28
            { type: 'GRID12', mode: 'QUIZ', desc: "صورة كبيرة: استخرج الكلمة المخفية في الزاوية اليمنى", opts: ["نور", "ظل", "سر", "لغز", "مفتاح", "باب", "زمن", "وقت", "نهاية", "بداية", "حل", "هرب"], ans: ["سر"], hint: "مكونة من حرفين" }, // 29
            { type: 'GRID12', mode: 'QUIZ', desc: "تحدي الزعيم: ما هو أثمن معدن في هذا النظام؟", opts: ["حديد", "نحاس", "فضة", "ألماس", "بلاتين", "برونز", "الذهب", "قصدير", "زنك", "رصاص", "تيتانيوم", "زئبق"], ans: ["الذهب"], hint: "Golden Edition" } // 30
        ];

        return Array.from({ length: 30 }, (_, i) => {
            let p = games[i];
            return {
                id: i + 1, type: p.type, mode: p.mode, target: p.target, opts: p.opts, ans: p.ans, desc: p.desc,
                title: `⚠️ القطاع #${i + 1}`, textDesc: riddles[i].q, textAns: riddles[i].a,
                gameHint: p.hint, textHint: `الكلمة تبدأ بحرف [ ${riddles[i].a.charAt(0)} ]`
            };
        });
    }

    switchScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(`screen-${id}`).classList.remove('hidden');
        document.getElementById('main-nav').classList.toggle('hidden', id === 'welcome');
    }

    startLobby() { this.switchScreen('lobby'); }

    renderLobby() {
        const c = document.getElementById('gates-container'); c.innerHTML = '';
        for(let i=1; i<=30; i++) {
            let btn = document.createElement('button'); 
            let isLocked = i !== 1 && !this.solvedGates.has(i - 1); // نظام القفل المتسلسل
            btn.className = `gate-card ${this.solvedGates.has(i) ? 'solved':''} ${isLocked ? 'locked':''}`;
            btn.innerHTML = isLocked ? `🔒<br><h3>${i}</h3>` : `<small>SECTOR</small><h3>${i}</h3>`;
            btn.disabled = isLocked;
            
            btn.addEventListener('click', () => { if(!isLocked) this.handleGateClick(i); });
            c.appendChild(btn);
        }
    }

    handleGateClick(id) {
        if(this.solvedGates.has(id)) return this.notify("مخترق مسبقاً!", "error");
        this.pendingGateId = id;
        document.getElementById('gate-time-input').value = 5; 
        document.getElementById('time-selector-modal').classList.remove('hidden');
    }

    closeTimeModal() { document.getElementById('time-selector-modal').classList.add('hidden'); this.pendingGateId = null; }

    startGateWithTime() {
        let m = document.getElementById('gate-time-input').value;
        if(!m || m <= 0) return this.notify("وقت غير صحيح!", "error");

        this.activeGate = this.puzzles.find(x => x.id === this.pendingGateId);
        this.closeTimeModal();
        this.timeLeft = parseInt(m) * 60;
        this.textFailCount = 0; 
        this.hasShield = false;
        
        this.setupPuzzleUI(); 
        this.startTimer(); 
        this.switchScreen('puzzle');
    }

    setupPuzzleUI() {
        const p = this.activeGate;
        document.getElementById('puzzle-title').innerText = p.title;
        document.getElementById('puzzle-desc').innerText = p.textDesc;
        document.getElementById('user-input').value = '';

        document.getElementById('text-stage').classList.add('hidden');
        document.getElementById('input-area').classList.add('hidden');
        document.getElementById('interactive-stage').classList.remove('hidden');

        document.querySelectorAll('.mini-game').forEach(el => el.classList.add('hidden'));
        
        if(p.type === "WIRE") this.setupWireGame();
        else if(p.type === "SAFE") this.setupSafeGame();
        else if(p.type === "SWITCHES") this.setupSwitchesGame();
        else if(p.type === "NODES") this.setupNodesGame();
        else if(p.type === "GRID12") this.setupGrid12Game();
    }

    /* --- الألعاب المخصصة الثابتة (12 خيار) --- */
    setupWireGame() {
        document.getElementById('game-wire').classList.remove('hidden');
        const c = document.getElementById('wire-container'); c.innerHTML = ''; this.wireSeq = [];
        let colors = ["red", "blue", "yellow", "green", "purple", "orange", "cyan", "pink", "brown", "white", "gray", "black"];
        let target = ["red", "blue", "yellow", "green"]; // 4 أسلاك مطلوبة
        let renderColors = [...colors].sort(() => Math.random() - 0.5);

        renderColors.forEach(col => {
            let w = document.createElement('div'); w.className = `wire`; w.style.backgroundColor = col;
            w.onclick = () => {
                if(w.classList.contains('cut')) return;
                w.classList.add('cut'); this.wireSeq.push(col);
                if(this.wireSeq[this.wireSeq.length-1] !== target[this.wireSeq.length-1]) {
                    this.failMiniGame("سلك خاطئ!"); this.wireSeq=[]; document.querySelectorAll('.wire').forEach(x=>x.classList.remove('cut'));
                } else if(this.wireSeq.length === target.length) this.winMiniGame();
            }; c.appendChild(w);
        });
    }

    setupSafeGame() {
        document.getElementById('game-safe').classList.remove('hidden');
        const inps = document.getElementById('safe-inputs'); inps.innerHTML = ''; 
        const pad = document.getElementById('safe-keypad'); pad.innerHTML = '';
        document.getElementById('safe-history').innerHTML = '';
        this.safeTarget = [1,9,8,4]; this.safeInputs = [];
        
        for(let i=0; i<4; i++){ let d = document.createElement('input'); d.readOnly=true; inps.appendChild(d); }
        let keys = ["1","2","3","4","5","6","7","8","9","*","0","#"];
        keys.forEach(k => {
            let btn = document.createElement('button'); btn.className='safe-key'; btn.innerText=k;
            btn.onclick = () => {
                if(this.safeInputs.length < 4 && !isNaN(k)) {
                    this.safeInputs.push(parseInt(k));
                    inps.children[this.safeInputs.length-1].value = k;
                    if(this.safeInputs.length === 4) this.checkSafe();
                }
            }; pad.appendChild(btn);
        });
    }
    checkSafe() {
        let feedback = [], correctCount = 0; let tempTarget = [...this.safeTarget];
        this.safeInputs.forEach((val, i) => {
            if(val === tempTarget[i]) { feedback.push('🟢'); correctCount++; tempTarget[i]=null; }
            else if(tempTarget.includes(val)) { feedback.push('🟡'); tempTarget[tempTarget.indexOf(val)]=null; }
            else feedback.push('🔴');
        });
        document.getElementById('safe-history').innerHTML += `<div>${this.safeInputs.join('')} ➔ ${feedback.join('')}</div>`;
        this.safeInputs = []; Array.from(document.getElementById('safe-inputs').children).forEach(x=>x.value='');
        if(correctCount === 4) this.winMiniGame(); else this.failMiniGame("شفرة خاطئة!");
    }

    setupSwitchesGame() {
        document.getElementById('game-switches').classList.remove('hidden');
        const c = document.getElementById('switches-grid'); c.innerHTML = ''; this.switchStates = Array(12).fill(false);
        for(let i=0; i<12; i++){
            let btn = document.createElement('div'); btn.className='switch-btn';
            btn.onclick = () => {
                this.toggleSwitch(i); this.toggleSwitch(i-1); this.toggleSwitch(i+1);
                if(this.switchStates.every(x=>x)) this.winMiniGame();
            }; c.appendChild(btn);
        }
    }
    toggleSwitch(i) {
        if(i>=0 && i<12) {
            this.switchStates[i] = !this.switchStates[i]; let btns = document.getElementById('switches-grid').children;
            this.switchStates[i] ? btns[i].classList.add('on') : btns[i].classList.remove('on');
        }
    }

    setupNodesGame() {
        document.getElementById('game-nodes').classList.remove('hidden');
        const c = document.getElementById('nodes-container'); c.innerHTML = ''; this.userNodes = [];
        let target = [1, 4, 9, 12];
        for(let i=1; i<=12; i++){
            let btn = document.createElement('button'); btn.className = 'node-btn'; btn.innerText = i;
            btn.onclick = () => {
                if(btn.classList.contains('active')) return;
                btn.classList.add('active'); this.userNodes.push(i);
                if(this.userNodes[this.userNodes.length-1] !== target[this.userNodes.length-1]){
                    this.failMiniGame("نمط خاطئ!"); this.setupNodesGame();
                } else if(this.userNodes.length === target.length) this.winMiniGame();
            }; c.appendChild(btn);
        }
    }

    /* --- المحرك الذكي (Grid-12) يغطي أكثر من 20 لعبة مختلفة --- */
    setupGrid12Game() {
        document.getElementById('game-grid12').classList.remove('hidden');
        const p = this.activeGate;
        document.getElementById('grid12-desc').innerText = p.desc;
        const c = document.getElementById('grid12-box'); c.innerHTML = '';
        const subBtn = document.getElementById('grid12-submit'); subBtn.classList.add('hidden');
        
        this.gridState = { selections: [], step: 0, pairs: [] };
        let opts = [...p.opts];
        if(p.mode !== 'SEQ') opts.sort(() => Math.random() - 0.5); // خلط عشوائي

        opts.forEach((opt, index) => {
            let btn = document.createElement('button'); btn.className = 'grid12-btn'; btn.innerText = opt;
            btn.onclick = () => this.handleGrid12Click(btn, opt, index);
            c.appendChild(btn);
        });

        if(p.mode === 'MULTI') subBtn.classList.remove('hidden');
    }

    handleGrid12Click(btn, opt, index) {
        const p = this.activeGate;
        
        if (p.mode === 'QUIZ') {
            if (p.ans.includes(opt)) this.winMiniGame();
            else this.failMiniGame("اختيار خاطئ!");
        } 
        else if (p.mode === 'MULTI') {
            btn.classList.toggle('selected');
            if(btn.classList.contains('selected')) this.gridState.selections.push(opt);
            else this.gridState.selections = this.gridState.selections.filter(x => x !== opt);
        }
        else if (p.mode === 'SEQ') {
            if (btn.classList.contains('selected')) return;
            btn.classList.add('selected');
            if (opt !== p.ans[this.gridState.step]) {
                this.failMiniGame("تسلسل خاطئ!"); this.setupGrid12Game();
            } else {
                this.gridState.step++;
                if (this.gridState.step === p.ans.length) this.winMiniGame();
            }
        }
        else if (p.mode === 'PAIRS') {
            if(btn.classList.contains('selected') || btn.classList.contains('matched') || this.gridState.pairs.length >= 2) return;
            btn.classList.add('selected'); this.gridState.pairs.push({btn, opt});
            if(this.gridState.pairs.length === 2) {
                setTimeout(() => {
                    let [c1, c2] = this.gridState.pairs;
                    // فحص تطابق (في لعبة الذاكرة يكونون نفس الرمز، في المتضادات برمجتها تعتمد على الـ Index لكن للتبسيط طابقنا الرموز في المصفوفة)
                    if(c1.opt === c2.opt) {
                        c1.btn.classList.replace('selected', 'matched'); c2.btn.classList.replace('selected', 'matched');
                        this.playSound('success'); this.gridState.step += 2;
                        if(this.gridState.step === p.opts.length) this.winMiniGame();
                    } else {
                        c1.btn.classList.remove('selected'); c2.btn.classList.remove('selected'); this.failMiniGame();
                    }
                    this.gridState.pairs = [];
                }, 500);
            }
        }
    }

    checkGrid12() {
        const p = this.activeGate;
        let selected = this.gridState.selections;
        // فحص Multi (هل اختار الإجابات الصحيحة كلها وبدون زيادة؟)
        // للتبسيط: إذا كل اختياراته موجودة في ans وعددها يطابق
        let isCorrect = selected.length === p.ans.length && selected.every(val => p.ans.includes(val) || p.ans[0] === "V"); // استثناء للفايروس
        
        if (isCorrect) this.winMiniGame();
        else { this.failMiniGame("اختيارات غير صحيحة!"); this.setupGrid12Game(); }
    }

    // --- الانتقال والنتيجة ---
    winMiniGame() {
        this.playSound('success'); this.notify("✅ تم تجاوز الجدار التفاعلي!");
        document.getElementById('interactive-stage').classList.add('hidden');
        document.getElementById('text-stage').classList.remove('hidden');
        document.getElementById('input-area').classList.remove('hidden');
    }
    
    failMiniGame(msg = "النظام يرفض التشفير!") {
        this.playSound('error'); this.triggerVisualGlitch(); this.notify(msg, "error"); 
        if(!this.isTimerFrozen && !this.hasShield) this.timeLeft -= 10; 
    }

    checkResult() {
        let answerInput = document.getElementById('user-input').value.trim();
        if (answerInput === this.activeGate.textAns) {
            clearInterval(this.timer); this.playSound('success'); this.coins += 20;
            this.solvedGates.add(this.activeGate.id); this.notify("✅ تم اختراق القطاع بالكامل!");
            this.updateStats(); this.renderLobby(); this.switchScreen('lobby');
        } else {
            if (this.hasShield) {
                this.hasShield = false;
                this.notify("🛡️ تم استهلاك المانع! لم يُخصم وقت.");
                this.playSound('success');
                return;
            }
            this.failMiniGame(`إجابة اللغز خاطئة!`);
        }
    }

    startTimer() {
        clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (!this.isPaused && !this.isTimerFrozen && this.timeLeft > 0) {
                this.timeLeft--; this.updateTimerUI();
                if (this.timeLeft <= 10 && this.timeLeft > 0) this.playSound('tick');
            } else if (this.timeLeft <= 0 && !this.isTimerFrozen) { this.onFail(); }
        }, 1000);
    }
    updateTimerUI() {
        let m = Math.floor(Math.max(0, this.timeLeft)/60).toString().padStart(2,'0');
        let s = (Math.max(0, this.timeLeft)%60).toString().padStart(2,'0');
        document.getElementById('timer-display').innerText = `${m}:${s}`;
    }

    onFail() { clearInterval(this.timer); this.playSound('error'); alert("انتهى الوقت المقدر! فشل الاقتحام."); this.switchScreen('lobby'); }

    /* --- 🛒 المتجر السري المدمج --- */
    openMarket() { document.getElementById('panel-market').classList.remove('hidden'); }
    closeMarket() { document.getElementById('panel-market').classList.add('hidden'); }
    buy(type) {
        let prices = { hint: 30, shield: 40, time: 60 };
        if (this.coins < prices[type]) return this.failMiniGame("العملات لا تكفي!");
        if (type === 'shield' && this.hasShield) return alert("المانع نشط بالفعل!");

        this.coins -= prices[type]; this.playSound('success'); this.updateStats();

        if (type === 'hint') { 
            alert(`تلميح التحدي: ${this.activeGate.gameHint} \n\nتلميح اللغز: ${this.activeGate.textHint}`); 
        }
        else if (type === 'shield') { this.hasShield = true; this.notify("تم تفعيل مانع الطرد."); }
        else if (type === 'time') { this.timeLeft += 60; this.updateTimerUI(); this.notify("تم ضخ 60 ثانية للعداد."); }
        
        this.closeMarket();
    }

    /* --- ⚙️ لوحة المشرف --- */
    toggleAdminSidebar(open) {
        const sidebar = document.getElementById('admin-sidebar');
        open ? sidebar.classList.add('open') : sidebar.classList.remove('open');
    }
    adminToggleFreeze() {
        this.isTimerFrozen = !this.isTimerFrozen;
        const btn = document.getElementById('btn-freeze');
        if(this.isTimerFrozen) { btn.innerText = "⏱️ تجميد الوقت: مُفعّل ❄️"; btn.style.background = "#004d4d"; } 
        else { btn.innerText = "⏱️ تجميد الوقت"; btn.style.background = ""; }
    }
    adminInstantSolveGate() {
        if(!this.activeGate) return alert("لا يوجد لاعب داخل بوابة!");
        this.toggleAdminSidebar(false); clearInterval(this.timer);
        this.coins += 15; this.solvedGates.add(this.activeGate.id);
        this.notify("⚙️ تجاوز مشرف: تم فتح البوابة بالقوة!");
        this.updateStats(); this.renderLobby(); this.switchScreen('lobby');
    }
    adminModifyCoins(val) { this.coins = Math.max(0, this.coins + val); this.updateStats(); }
    adminModifyTime(val) { if(this.activeGate) { this.timeLeft = Math.max(5, this.timeLeft + val); this.updateTimerUI(); } }

    returnToLobby() { if(confirm("تأكيد الانسحاب الميداني؟")) { clearInterval(this.timer); this.switchScreen('lobby'); } }
    updateStats() { document.getElementById('coin-val').innerText = this.coins; }
    notify(m, t="success") {
        let c = document.getElementById('toast-container'), n = document.createElement('div'); n.className='toast';
        if(t==='error') n.style.borderRightColor='red'; n.innerText = m; c.appendChild(n); setTimeout(()=>n.remove(), 3000);
    }
}
const game = new MajesticEscape();
