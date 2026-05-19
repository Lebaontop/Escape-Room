class MajesticEscape {
    constructor() {
        this.coins = 60;
        this.activeGate = null;
        this.timer = null;
        this.timeLeft = 0;
        this.isPaused = false;
        this.solvedGates = new Set();
        
        // متغير لحفظ البوابة المطلوبة قبل تحديد الوقت
        this.pendingGateId = null; 

        this.textFailCount = 0;
        this.wireSeq = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.userArrows = [];
        this.switchStates = [];
        this.userNodes = [];
        this.timingPulseId = null;
        this.timingPos = 0;
        this.timingDir = 1;
        this.timingSuccesses = 0;
        this.serverLoop = null;
        this.serverPower = 0;
        this.serverStableTime = 0;

        this.sounds = {
            beep: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
            error: new Audio('https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3'),
            success: new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'),
            tick: new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3')
        };

        this.puzzles = this.buildPuzzles();
        this.init();
        this.setupClickSounds();
    }

    init() { this.renderLobby(); this.updateStats(); }
    playSound(t) { if(this.sounds[t]) { this.sounds[t].currentTime=0; this.sounds[t].play().catch(e=>{}); } }
    triggerVisualGlitch() {
        const c = document.getElementById('main-puzzle-card');
        c.classList.add('error-glitch'); setTimeout(()=>c.classList.remove('error-glitch'), 300);
    }
    setupClickSounds() {
        document.addEventListener('click', (e) => {
            if(e.target.tagName==='BUTTON' || e.target.classList.contains('wire') || e.target.classList.contains('gate-card') || e.target.classList.contains('mem-card') || e.target.classList.contains('switch-btn') || e.target.classList.contains('node-btn')){
                this.playSound('beep');
            }
        });
    }

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

        const games = ["WIRE", "SLIDER", "MEMORY", "SAFE", "SWITCHES", "ARROWS", "TIMING", "NODES", "CIPHER", "SERVER"];
        const colors = ["red", "blue", "yellow", "green", "purple"];
        const colorNames = {"red":"أحمر", "blue":"أزرق", "yellow":"أصفر", "green":"أخضر", "purple":"بنفسجي"};
        const dirs = ["UP", "DOWN", "LEFT", "RIGHT"];
        const dirNames = {"UP":"فوق", "DOWN":"تحت", "LEFT":"يسار", "RIGHT":"يمين"};

        return Array.from({ length: 30 }, (_, i) => {
            let type = games[i % 10];
            let level = 3 + Math.floor(i / 10);
            
            let p = {
                id: i + 1, interactiveType: type, level: level,
                title: `⚠️ القطاع #${i + 1}`, desc: riddles[i].q,
                answer: riddles[i].a, hint: `الحل يتعلق بـ: ${riddles[i].a.charAt(0)}...`
            };
            
            if(type === "WIRE") {
                let targetColors = Array.from({length: level}, ()=>colors[Math.floor(Math.random()*colors.length)]);
                p.target = targetColors; p.gameHint = targetColors.map(c => colorNames[c]).join(" ➔ ");
            }
            if(type === "SLIDER") p.target = [25*Math.floor(Math.random()*5), 25*Math.floor(Math.random()*5), 25*Math.floor(Math.random()*5)];
            if(type === "MEMORY") p.target = level + 1; 
            if(type === "SAFE") p.target = Array.from({length: level + 1}, ()=>Math.floor(Math.random()*10)); 
            if(type === "SWITCHES") p.target = level + 2; 
            if(type === "ARROWS") {
                let arr = Array.from({length: level + 1}, ()=>dirs[Math.floor(Math.random()*4)]);
                p.target = arr; p.gameHint = arr.map(d => dirNames[d]).join(" ، ");
            }
            if(type === "TIMING") p.target = level - 1; 
            if(type === "NODES") p.target = Array.from({length: level + 1}, ()=>Math.floor(Math.random()*9)+1); 
            if(type === "CIPHER") {
                let words = ["SOLAR", "SYSTEM", "HACKER", "GOLDEN", "ESCAPE"];
                p.baseWord = words[i % 5]; p.shift = level;
                p.target = p.baseWord.split('').map(c => String.fromCharCode((c.charCodeAt(0) - 65 + p.shift) % 26 + 65)).join('');
            }
            return p;
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
            let div = document.createElement('div');
            div.className = `gate-card ${this.solvedGates.has(i) ? 'solved':''}`;
            div.innerHTML = `<small>SECTOR</small><h3>${i}</h3>`;
            div.onclick = () => this.handleGateClick(i);
            c.appendChild(div);
        }
    }

    // --- النافذة الجديدة لاختيار الوقت ---
    handleGateClick(id) {
        if(this.solvedGates.has(id)) return this.notify("مخترق مسبقاً!", "error");
        
        // فتح نافذة الوقت الأنيقة بدال المتصفح
        this.pendingGateId = id;
        document.getElementById('gate-time-input').value = 5; // وقت افتراضي
        document.getElementById('time-selector-modal').classList.remove('hidden');
    }

    closeTimeModal() {
        document.getElementById('time-selector-modal').classList.add('hidden');
        this.pendingGateId = null;
    }

    startGateWithTime() {
        let m = document.getElementById('gate-time-input').value;
        if(!m || m <= 0) return this.notify("الرجاء إدخال وقت صحيح!", "error");

        // إغلاق النافذة وبدء اللعبة
        this.closeTimeModal();

        this.activeGate = this.puzzles.find(x => x.id === this.pendingGateId);
        this.timeLeft = parseInt(m) * 60;
        this.textFailCount = 0; 
        
        this.setupPuzzleUI(); 
        this.startTimer(); 
        this.switchScreen('puzzle');
    }
    // ------------------------------------

    setupPuzzleUI() {
        const p = this.activeGate;
        document.getElementById('puzzle-title').innerText = p.title;
        document.getElementById('puzzle-desc').innerText = p.desc;
        document.getElementById('user-input').value = '';

        document.getElementById('text-stage').classList.add('hidden');
        document.getElementById('input-area').classList.add('hidden');
        document.getElementById('interactive-stage').classList.remove('hidden');

        document.querySelectorAll('.mini-game').forEach(el => el.classList.add('hidden'));
        document.getElementById(`game-${p.interactiveType.toLowerCase()}`).classList.remove('hidden');

        cancelAnimationFrame(this.timingPulseId);
        clearInterval(this.serverLoop);

        if(p.interactiveType === "WIRE") this.setupWireGame();
        if(p.interactiveType === "SLIDER") this.setupSliderGame();
        if(p.interactiveType === "MEMORY") this.setupMemoryGame();
        if(p.interactiveType === "SAFE") this.setupSafeGame();
        if(p.interactiveType === "SWITCHES") this.setupSwitchesGame();
        if(p.interactiveType === "ARROWS") this.setupArrowsGame();
        if(p.interactiveType === "TIMING") this.setupTimingGame();
        if(p.interactiveType === "NODES") this.setupNodesGame();
        if(p.interactiveType === "CIPHER") this.setupCipherGame();
        if(p.interactiveType === "SERVER") this.setupServerGame();
    }

    setupWireGame() {
        const c = document.getElementById('wire-container'); c.innerHTML = ''; this.wireSeq = [];
        document.getElementById('wire-hint').innerText = `التسلسل السري: ${this.activeGate.gameHint}`;
        let colorsToRender = [...this.activeGate.target];
        colorsToRender.push("purple", "orange"); 
        colorsToRender.sort(() => Math.random() - 0.5);

        colorsToRender.forEach(col => {
            let w = document.createElement('div');
            w.className = `wire`; w.style.backgroundColor = col;
            w.onclick = () => {
                if(w.classList.contains('cut')) return;
                w.classList.add('cut'); this.wireSeq.push(col);
                if(this.wireSeq[this.wireSeq.length-1] !== this.activeGate.target[this.wireSeq.length-1]){
                    this.failMiniGame("سلك خاطئ!"); this.wireSeq=[];
                    document.querySelectorAll('.wire').forEach(x=>x.classList.remove('cut'));
                } else if(this.wireSeq.length === this.activeGate.target.length) this.winMiniGame();
            };
            c.appendChild(w);
        });
    }

    setupSliderGame() { document.getElementById('slider-hint').innerText = `طابق: ض=${this.activeGate.target[0]} | ح=${this.activeGate.target[1]} | ط=${this.activeGate.target[2]}`; }
    checkSliders() {
        let v1=parseInt(document.getElementById('sl1').value), v2=parseInt(document.getElementById('sl2').value), v3=parseInt(document.getElementById('sl3').value);
        let t = this.activeGate.target;
        if(v1===t[0] && v2===t[1] && v3===t[2]) this.winMiniGame(); else this.failMiniGame("قيم غير متزامنة!");
    }

    setupMemoryGame() {
        const c = document.getElementById('memory-cards'); c.innerHTML = '';
        let icons = ['🔋','⚙️','🛡️','🔑','📡','💻','💣','⏳'];
        let used = icons.slice(0, this.activeGate.target);
        let deck = [...used, ...used].sort(()=>Math.random() - 0.5);
        this.flippedCards = []; this.matchedPairs = 0;
        deck.forEach(sym => {
            let card = document.createElement('div'); card.className = 'mem-card'; card.dataset.v = sym;
            card.onclick = () => {
                if(this.flippedCards.length<2 && !card.classList.contains('flipped')){
                    card.classList.add('flipped'); card.innerText=sym; this.flippedCards.push(card);
                    if(this.flippedCards.length===2) setTimeout(()=>this.checkMem(), 500);
                }
            }; c.appendChild(card);
        });
    }
    checkMem() {
        let [c1, c2] = this.flippedCards;
        if(c1.dataset.v === c2.dataset.v){
            c1.classList.add('matched'); c2.classList.add('matched'); this.playSound('success'); this.matchedPairs++;
            if(this.matchedPairs === this.activeGate.target) this.winMiniGame();
        } else {
            c1.classList.remove('flipped'); c2.classList.remove('flipped'); c1.innerText=''; c2.innerText='';
            this.failMiniGame();
        }
        this.flippedCards=[];
    }

    setupSafeGame() {
        const c = document.getElementById('safe-inputs'); c.innerHTML = '';
        document.getElementById('safe-history').innerHTML = '';
        for(let i=0; i<this.activeGate.target.length; i++){
            let inp = document.createElement('input'); inp.type='number'; inp.min=0; inp.max=9; inp.value=0;
            c.appendChild(inp);
        }
    }
    checkSafe() {
        let inputs = Array.from(document.getElementById('safe-inputs').children).map(x=>parseInt(x.value));
        let target = [...this.activeGate.target];
        let feedback = [], correctCount = 0;
        
        inputs.forEach((val, i) => {
            if(val === target[i]) { feedback.push('🟢'); correctCount++; target[i]=null; }
            else if(target.includes(val)) { feedback.push('🟡'); target[target.indexOf(val)]=null; }
            else feedback.push('🔴');
        });
        
        let hist = document.getElementById('safe-history');
        hist.innerHTML += `<div>${inputs.join('')} ➔ ${feedback.join('')}</div>`;
        if(correctCount === this.activeGate.target.length) this.winMiniGame();
    }

    setupSwitchesGame() {
        const c = document.getElementById('switches-grid'); c.innerHTML = '';
        this.switchStates = Array(this.activeGate.target).fill(false);
        for(let i=0; i<this.activeGate.target; i++){
            let btn = document.createElement('div'); btn.className='switch-btn';
            btn.onclick = () => {
                this.toggleSwitch(i);
                this.toggleSwitch(i-1); this.toggleSwitch(i+1);
                if(this.switchStates.every(x=>x)) this.winMiniGame();
            }; c.appendChild(btn);
        }
    }
    toggleSwitch(i) {
        if(i>=0 && i<this.switchStates.length) {
            this.switchStates[i] = !this.switchStates[i];
            let btns = document.getElementById('switches-grid').children;
            this.switchStates[i] ? btns[i].classList.add('on') : btns[i].classList.remove('on');
        }
    }

    setupArrowsGame() {
        this.userArrows = []; document.getElementById('arrow-display').innerText = '';
        document.getElementById('arrow-hint').innerText = `المسار: ${this.activeGate.gameHint}`;
    }
    addArrow(dir) {
        let map = {UP:'⬆️', DOWN:'⬇️', LEFT:'⬅️', RIGHT:'➡️'};
        if(this.userArrows.length < this.activeGate.target.length) {
            this.userArrows.push(dir); document.getElementById('arrow-display').innerText += map[dir];
        }
    }
    checkArrows() {
        if(JSON.stringify(this.userArrows) === JSON.stringify(this.activeGate.target)) this.winMiniGame();
        else { this.failMiniGame("مسار خاطئ!"); this.setupArrowsGame(); }
    }

    setupTimingGame() {
        this.timingSuccesses = 0; document.getElementById('timing-status').innerText = `التقاطات ناجحة: 0 / ${this.activeGate.target}`;
        let zone = document.getElementById('timing-zone');
        let width = 30 - (this.activeGate.level * 2);
        zone.style.width = width + '%'; zone.style.left = Math.random()*(100-width) + '%';
        
        let speed = 0.8 + (this.activeGate.level * 0.4);
        const animate = () => {
            this.timingPos += speed * this.timingDir;
            if(this.timingPos >= 98 || this.timingPos <= 0) this.timingDir *= -1;
            document.getElementById('timing-cursor').style.left = this.timingPos + '%';
            this.timingPulseId = requestAnimationFrame(animate);
        }; animate();
    }
    catchPulse() {
        let cursor = this.timingPos, zLeft = parseFloat(document.getElementById('timing-zone').style.left), zWidth = parseFloat(document.getElementById('timing-zone').style.width);
        if(cursor >= zLeft && cursor <= zLeft+zWidth) {
            this.playSound('success'); this.timingSuccesses++;
            document.getElementById('timing-status').innerText = `التقاطات ناجحة: ${this.timingSuccesses} / ${this.activeGate.target}`;
            if(this.timingSuccesses >= this.activeGate.target) { cancelAnimationFrame(this.timingPulseId); this.winMiniGame(); }
            else document.getElementById('timing-zone').style.left = Math.random()*(100-zWidth) + '%';
        } else this.failMiniGame("توقيت سيء!");
    }

    setupNodesGame() {
        const c = document.getElementById('nodes-container'); c.innerHTML = ''; this.userNodes = [];
        document.getElementById('nodes-hint').innerText = `ترتيب النقاط المطلوب: ${this.activeGate.target.join(' ➔ ')}`;
        for(let i=1; i<=9; i++){
            let btn = document.createElement('button'); btn.className = 'node-btn'; btn.innerText = i;
            btn.onclick = () => {
                if(btn.classList.contains('active')) return;
                btn.classList.add('active'); this.userNodes.push(i);
                if(this.userNodes[this.userNodes.length-1] !== this.activeGate.target[this.userNodes.length-1]){
                    this.failMiniGame("نمط خاطئ!"); this.setupNodesGame();
                } else if(this.userNodes.length === this.activeGate.target.length) this.winMiniGame();
            }; c.appendChild(btn);
        }
    }

    setupCipherGame() {
        document.getElementById('cipher-hint').innerText = `الكلمة مشفرة بإزاحة +${this.activeGate.shift} حروف للأمام.`;
        document.getElementById('cipher-text').innerText = this.activeGate.target;
        document.getElementById('cipher-input').value = '';
    }
    checkCipher() {
        let input = document.getElementById('cipher-input').value.trim().toUpperCase();
        if(input === this.activeGate.baseWord) this.winMiniGame();
        else this.failMiniGame("فك التشفير خاطئ!");
    }

    setupServerGame() {
        this.serverPower = 0; this.serverStableTime = 0;
        document.getElementById('server-level').style.width = '0%';
        document.getElementById('server-level').classList.remove('stable');
        document.getElementById('server-timer').innerText = "0.0 ثانية";
        
        let dropRate = 2 + (this.activeGate.level * 0.5); 
        
        this.serverLoop = setInterval(() => {
            this.serverPower = Math.max(0, this.serverPower - dropRate);
            document.getElementById('server-level').style.width = this.serverPower + '%';
            
            if(this.serverPower >= 40 && this.serverPower <= 60) {
                document.getElementById('server-level').classList.add('stable');
                this.serverStableTime += 0.1;
                document.getElementById('server-timer').innerText = this.serverStableTime.toFixed(1) + " ثانية";
                if(this.serverStableTime >= 3.0) { clearInterval(this.serverLoop); this.winMiniGame(); }
            } else {
                document.getElementById('server-level').classList.remove('stable');
                this.serverStableTime = 0;
                document.getElementById('server-timer').innerText = "0.0 ثانية";
            }
        }, 100);
    }
    pumpServer() { this.serverPower = Math.min(100, this.serverPower + 15); }

    winMiniGame() {
        this.playSound('success'); this.notify("✅ تم تجاوز الجدار الناري!");
        document.getElementById('interactive-stage').classList.add('hidden');
        document.getElementById('text-stage').classList.remove('hidden');
        document.getElementById('input-area').classList.remove('hidden');
    }
    
    failMiniGame(msg = "النظام يرفض التشفير!") {
        this.playSound('error'); this.triggerVisualGlitch(); this.notify(msg, "error"); this.timeLeft -= 15;
    }

    triggerGetOut() {
        clearInterval(this.timer); cancelAnimationFrame(this.timingPulseId); clearInterval(this.serverLoop);
        const screen = document.getElementById('get-out-screen'); screen.innerHTML = '';
        for(let i=0; i<80; i++) {
            let span = document.createElement('span'); span.className = 'get-out-text'; span.innerText = 'GET OUT! , NEXT';
            span.style.fontSize = (Math.random() * 2 + 1.5) + 'rem'; screen.appendChild(span);
        }
        screen.classList.remove('hidden');
        this.playSound('error'); setTimeout(() => this.playSound('error'), 300); setTimeout(() => this.playSound('error'), 600);
        setTimeout(() => {
            screen.classList.add('hidden'); this.switchScreen('lobby');
            this.notify("تم طردك من النظام بسبب تكرار المحاولات الخاطئة!", "error");
        }, 4000);
    }

    checkResult() {
        if (document.getElementById('user-input').value.trim() === this.activeGate.answer) {
            clearInterval(this.timer); this.playSound('success'); this.coins+=15;
            this.solvedGates.add(this.activeGate.id); this.notify("✅ تم الاختراق الشامل!");
            this.updateStats(); this.renderLobby(); this.switchScreen('lobby');
        } else {
            this.textFailCount++; 
            if (this.textFailCount >= 3) { this.triggerGetOut(); } 
            else { this.failMiniGame(`إجابة اللغز خاطئة! تبقّى لك ${3 - this.textFailCount} محاولات قبل الطرد.`); }
        }
    }

    startTimer() {
        clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (!this.isPaused && this.timeLeft > 0) {
                this.timeLeft--; this.updateTimerUI();
                if (this.timeLeft <= 10 && this.timeLeft > 0) this.playSound('tick');
            } else if (this.timeLeft <= 0) { this.onFail(); }
        }, 1000);
    }
    
    updateTimerUI() {
        let m = Math.floor(Math.max(0, this.timeLeft)/60).toString().padStart(2,'0');
        let s = (Math.max(0, this.timeLeft)%60).toString().padStart(2,'0');
        document.getElementById('timer-display').innerText = `${m}:${s}`;
    }

    onFail() { 
        clearInterval(this.timer); cancelAnimationFrame(this.timingPulseId); clearInterval(this.serverLoop); 
        this.playSound('error'); alert("انتهى الوقت! فشل الاختراق!"); this.switchScreen('lobby'); 
    }

    toggleAdmin() { document.getElementById('panel-admin').classList.toggle('hidden'); }
    adminUpdateCoins(v) { this.coins+=v; this.updateStats(); }
    adminUpdateTime(v) { this.timeLeft+=v; this.updateTimerUI(); }
    openMarket() { document.getElementById('panel-market').classList.remove('hidden'); }
    closeMarket() { document.getElementById('panel-market').classList.add('hidden'); }
    buy(type) {
        let cost = type==='hint'?30:60;
        if(this.coins<cost) return this.failMiniGame("رصيد غير كافٍ!");
        this.coins-=cost; this.playSound('success');
        if(type==='hint') alert(`تلميح: ${this.activeGate.hint}`); else this.timeLeft+=60;
        this.updateStats(); this.closeMarket();
    }
    returnToLobby(force = false) { 
        if(force || confirm("هل أنت متأكد من الانسحاب؟ (ستفقد تقدمك في هذا القطاع)")) { 
            clearInterval(this.timer); cancelAnimationFrame(this.timingPulseId); clearInterval(this.serverLoop); 
            this.switchScreen('lobby'); 
        } 
    }
    updateStats() { document.getElementById('coin-val').innerText = this.coins; }
    notify(m, t="success") {
        let c = document.getElementById('toast-container'), n = document.createElement('div');
        n.className='toast'; if(t==='error') n.style.borderRightColor='red';
        n.innerText = m; c.appendChild(n); setTimeout(()=>n.remove(), 3000);
    }
}
const game = new MajesticEscape();
