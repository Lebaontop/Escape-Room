class MajesticEscape {
    constructor() {
        this.coins = 60;
        this.activeGate = null;
        this.timer = null;
        this.timeLeft = 5400; // 90 mins
        this.isPaused = false;
        this.isTimerFrozen = false; 
        this.hasShield = false;      
        this.solvedGates = new Set();
        
        // أصوات مباشرة من سيرفرات سحابية (لا تحتاج تحميل أي شيء!)
        this.sounds = {
            beep: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'), // Mechanical switch
            error: new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'), // Discord Error
            success: new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3') // Discord Join/Success
        };

        this.gameConfig = this.buildPuzzles();
        this.init();
        this.setupClickSounds();
    }

    init() { this.renderLobby(); this.updateStats(); this.startTimer(); }
    
    playSound(t) { 
        if(this.sounds[t]) { 
            this.sounds[t].currentTime = 0; 
            this.sounds[t].volume = (t === 'beep') ? 0.4 : 0.8; 
            this.sounds[t].play().catch(()=>{}); 
        } 
    }
    
    triggerVisualGlitch() { 
        const c = document.getElementById('main-puzzle-card'); 
        if(c) { c.classList.add('error-glitch'); setTimeout(()=>c.classList.remove('error-glitch'), 400); } 
    }
    
    setupClickSounds() { 
        document.addEventListener('click', (e) => { 
            if(e.target.tagName==='BUTTON' || e.target.classList.contains('item-12') || e.target.classList.contains('gate-card')){ 
                this.playSound('beep'); 
            } 
        }); 
    }

    // 30 لعبة تفاعلية بحتة (تعتمد على 12 مربع بالملي)
    buildPuzzles() {
        const games = [
            { type: 'SWITCHES', target: [0,3,8,11], desc: "Power Routing: فعّل المحولات الموجودة في الزوايا الأربع فقط.", hint: "أطراف الشبكة (1، 4، 9، 12)" }, // 1
            { type: 'WIRES', colors: ['red','blue','red','green','yellow','red','blue','red','white','black','red','orange'], targetColor: 'red', desc: "Wire Cut: اقطع جميع مسارات البيانات (الأسلاك) الحمراء.", hint: "اضغط على كل المربعات الحمراء" }, // 2
            { type: 'SEQUENCE', target: [0,1,2,3], desc: "Boot Sequence: اضغط على أول 4 عقد بالترتيب (من اليمين لليسار في الصف الأول).", hint: "الصف الأول كامل" }, // 3
            { type: 'PAIRS', icons: ['💻','💻','📡','📡','⚙️','⚙️','🛡️','🛡️','🔋','🔋','🔑','🔑'], desc: "Data Matching: طابق جميع أزواج الرموز المتشابهة.", hint: "لعبة الذاكرة، طابق الرمز باللي يشبهه" }, // 4
            { type: 'SWITCHES', target: [5,6,9,10], desc: "Core Activation: فعّل الـ 4 محولات المركزية (في المنتصف تماماً).", hint: "المربع الداخلي" }, // 5
            { type: 'WIRES', colors: ['blue','blue','yellow','blue','blue','black','blue','white','blue','cyan','blue','blue'], targetColor: 'blue', desc: "Blue Protocol: اقطع جميع الأسلاك الزرقاء لعزل الفيروس.", hint: "كل ما هو أزرق" }, // 6
            { type: 'SEQUENCE', target: [0,5,10], desc: "Diagonal Bypass: ارسم مساراً قطرياً من أعلى اليمين إلى أسفل اليسار.", hint: "الزاوية للزاوية (1, 6, 11)" }, // 7
            { type: 'SWITCHES', target: [1,3,5,7,9,11], desc: "Alternating Current: فعّل المحولات بشكل متبادل (واحد إي وواحد لا).", hint: "الأرقام الزوجية" }, // 8
            { type: 'PAIRS', icons: ['A','A','B','B','C','C','X','X','Y','Y','Z','Z'], desc: "Port Sync: طابق بورتات الحروف المتشابهة.", hint: "طابق A مع A وهكذا" }, // 9
            { type: 'SWITCHES', target: [0,1,2,3,4,7,8,11], desc: "Outer Shell: فعّل الإطار الخارجي للسيرفر (تجاهل المنتصف).", hint: "شغل كل شيء عدا الـ 4 اللي بالنص" }, // 10
            { type: 'WIRES', colors: ['green','green','green','black','green','green','white','green','green','gray','green','green'], targetColor: 'green', desc: "Green Override: اقطع كافة مسارات الأمان الخضراء.", hint: "اللون الأخضر" }, // 11
            { type: 'SEQUENCE', target: [3,7,11], desc: "Vertical Drop: فعّل العمود الأخير بالترتيب من الأعلى للأسفل.", hint: "العمود اللي عاليسار كامل" }, // 12
            { type: 'SWITCHES', target: [4,5,6,7], desc: "Middle Tier: فعّل الصف الأوسط بالكامل لتوزيع الجهد.", hint: "الصف الثاني (من 5 إلى 8)" }, // 13
            { type: 'PAIRS', icons: ['1','1','2','2','3','3','4','4','5','5','6','6'], desc: "IP Matching: طابق أرقام البوابات.", hint: "طابق الأرقام" }, // 14
            { type: 'WIRES', colors: ['black','white','black','red','black','blue','black','yellow','black','cyan','black','orange'], targetColor: 'black', desc: "Dark Web: اقطع الأسلاك السوداء فقط لقطع الاتصال المخفي.", hint: "الأسود فقط" }, // 15
            { type: 'SEQUENCE', target: [0,1,2,3, 7,6, 8,9,10,11], desc: "Z-Pattern Logic: ارسم حرف Z لتخطي الجدار الناري.", hint: "يمين، قطري يسار، يمين" }, // 16
            { type: 'SWITCHES', target: [0,1, 4,5], desc: "Top Right Quadrant: فعّل الربع العلوي الأيمن من الشبكة.", hint: "أول مربعين يمين فوق، وتحتهم" }, // 17
            { type: 'WIRES', colors: ['yellow','yellow','black','yellow','yellow','white','yellow','red','yellow','blue','yellow','yellow'], targetColor: 'yellow', desc: "Yellow Alert: اقطع الأسلاك الصفراء لإيقاف الإنذار.", hint: "الأصفر" }, // 18
            { type: 'PAIRS', icons: ['🔴','🔴','🟢','🟢','🔵','🔵','🟡','🟡','🟣','🟣','⚪','⚪'], desc: "Color Node Sync: طابق الألوان.", hint: "طابق الدوائر الملونة" }, // 19
            { type: 'SWITCHES', target: [0,2,8,10], desc: "Cross Points: فعّل نقاط التقاطع المحددة.", hint: "رقم 1 و 3 في الصف الأول، و 1 و 3 في الصف الأخير" }, // 20
            { type: 'SEQUENCE', target: [11,10,9,8], desc: "Reverse Boot: فعّل الصف الأخير بالترتيب العكسي (من اليسار لليمين).", hint: "الصف الأخير بالعكس" }, // 21
            { type: 'WIRES', colors: ['cyan','cyan','cyan','cyan','black','white','red','blue','cyan','cyan','cyan','cyan'], targetColor: 'cyan', desc: "Cyan Filter: اقطع مسارات الـ Cyan.", hint: "السماوي" }, // 22
            { type: 'SWITCHES', target: [2,5,8], desc: "Column 3: فعّل العمود الثالث لتشغيل التبريد.", hint: "العمود الثالث" }, // 23
            { type: 'PAIRS', icons: ['♠','♠','♣','♣','♥','♥','♦','♦','★','★','✖','✖'], desc: "Encrypt Keys: طابق الرموز المعقدة.", hint: "طابق الأشكال" }, // 24
            { type: 'SWITCHES', target: [1,4,7,10], desc: "Checkered Pattern: فعّل نمط الشطرنج.", hint: "2، 5، 8، 11" }, // 25
            { type: 'WIRES', colors: ['purple','purple','black','purple','purple','purple','white','purple','purple','red','purple','purple'], targetColor: 'purple', desc: "Purple Wipe: اقطع مسارات اللون البنفسجي.", hint: "البنفسجي" }, // 26
            { type: 'SEQUENCE', target: [0,4,8, 1,5,9, 2,6,10, 3,7,11], desc: "Full Scan: فعّل الشبكة عموداً عموداً بالترتيب.", hint: "من فوق لتحت لكل عمود" }, // 27
            { type: 'SWITCHES', target: [0,1,2,3,4,5,6,7,8,9,10,11], desc: "Master Power: فعّل النظام بأكمله (الـ 12 محول).", hint: "كل شيء أخضر" }, // 28
            { type: 'PAIRS', icons: ['SOLAR','SOLAR','GAMES','GAMES','ADMIN','ADMIN','ROOT','ROOT','BAN','BAN','MUTE','MUTE'], desc: "Word Match: طابق أوامر السيرفر.", hint: "الكلمات المتشابهة" }, // 29
            { type: 'SEQUENCE', target: [0,11, 3,8, 1,10, 2,9], desc: "Master Override: فعّل الأطراف المتقابلة بالترتيب لإثبات هويتك.", hint: "أول واحد وآخر واحد، ثم الزوايا الثانية" } // 30
        ];

        return games.map((g, i) => ({ id: i + 1, ...g }));
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
            let btn = document.createElement('div'); 
            let isLocked = i !== 1 && !this.solvedGates.has(i - 1); 
            btn.className = `gate-card ${this.solvedGates.has(i) ? 'solved':''} ${isLocked ? 'locked':''}`;
            btn.innerHTML = `<h3>ROOM-${i.toString().padStart(2, '0')}</h3>`;
            btn.addEventListener('click', () => { if(!isLocked) this.handleGateClick(i); });
            c.appendChild(btn);
        }
    }

    handleGateClick(id) {
        if(this.solvedGates.has(id)) return this.notify("Room already unlocked!", "error");
        this.activeGate = this.gameConfig.find(x => x.id === id);
        this.hasShield = false;
        this.setupStage(); 
        this.switchScreen('puzzle');
    }

    // المحرك التفاعلي للأكشن (12 عنصر فقط)
    setupStage() {
        const p = this.activeGate;
        document.getElementById('puzzle-title').innerText = `# ROOM-${p.id.toString().padStart(2,'0')}`;
        document.getElementById('game-desc').innerText = p.desc;
        const stage = document.getElementById('interactive-stage');
        stage.innerHTML = '';
        
        this.stageState = { active: [], step: 0, pairs: [] };
        
        // بناء الـ 12 عنصر حسب نوع اللعبة
        for(let i=0; i<12; i++) {
            let item = document.createElement('div');
            item.className = 'item-12';
            
            if(p.type === 'WIRES') {
                item.style.backgroundColor = p.colors[i];
                item.innerText = '⚡';
            } else if(p.type === 'PAIRS') {
                item.innerText = '?';
                item.dataset.val = p.icons[i];
            } else {
                item.innerText = i + 1; // ترقيم العناصر
            }

            item.onclick = () => this.handleAction(item, i, p);
            stage.appendChild(item);
        }

        // خلط الكروت إذا كانت اللعبة مطابقة
        if(p.type === 'PAIRS') {
            for (let i = stage.children.length; i >= 0; i--) {
                stage.appendChild(stage.children[Math.random() * i | 0]);
            }
        }
    }

    handleAction(item, idx, p) {
        if(p.type === 'SWITCHES') {
            item.classList.toggle('active');
            let actives = Array.from(document.querySelectorAll('.item-12')).map((el, i) => el.classList.contains('active') ? i : -1).filter(i => i !== -1);
            if(actives.length === p.target.length && p.target.every(val => actives.includes(val))) {
                this.winRoom();
            } else if (actives.length > p.target.length || actives.some(val => !p.target.includes(val))) {
                this.failRoom("Invalid Switch Activated!"); this.setupStage();
            }
        } 
        else if (p.type === 'WIRES') {
            if(item.classList.contains('cut')) return;
            item.classList.add('cut');
            let color = p.colors[idx];
            if(color !== p.targetColor) {
                this.failRoom("Wrong Wire Cut!"); this.setupStage();
            } else {
                let allCut = Array.from(document.querySelectorAll('.item-12')).every((el, i) => p.colors[i] !== p.targetColor || el.classList.contains('cut'));
                if(allCut) this.winRoom();
            }
        }
        else if (p.type === 'SEQUENCE') {
            if(item.classList.contains('active')) return;
            item.classList.add('active');
            if(idx !== p.target[this.stageState.step]) {
                this.failRoom("Sequence Error!"); this.setupStage();
            } else {
                this.stageState.step++;
                if(this.stageState.step === p.target.length) this.winRoom();
            }
        }
        else if (p.type === 'PAIRS') {
            if(item.classList.contains('active') || item.classList.contains('matched') || this.stageState.pairs.length >= 2) return;
            item.classList.add('active'); item.innerText = item.dataset.val;
            this.stageState.pairs.push({ el: item, val: item.dataset.val });
            
            if(this.stageState.pairs.length === 2) {
                setTimeout(() => {
                    let [c1, c2] = this.stageState.pairs;
                    if(c1.val === c2.val) {
                        c1.el.classList.replace('active', 'matched'); c2.el.classList.replace('active', 'matched');
                        this.playSound('success');
                        if(document.querySelectorAll('.matched').length === 12) this.winRoom();
                    } else {
                        c1.el.classList.remove('active'); c1.el.innerText = '?';
                        c2.el.classList.remove('active'); c2.el.innerText = '?';
                        this.failRoom("No Match!");
                    }
                    this.stageState.pairs = [];
                }, 500);
            }
        }
    }

    winRoom() {
        this.playSound('success'); this.coins += 20;
        this.solvedGates.add(this.activeGate.id); this.notify("✅ Room Override Successful!");
        this.updateStats(); this.renderLobby(); this.switchScreen('lobby');
    }
    
    failRoom(msg) {
        if (this.hasShield) {
            this.hasShield = false;
            this.notify("🛡️ Shield Activated! No penalty.");
            this.playSound('success');
            return;
        }
        this.playSound('error'); this.triggerVisualGlitch(); this.notify(msg, "error"); 
        if(!this.isTimerFrozen) this.timeLeft -= 15; // خصم وقت
    }

    /* --- التايمر والمشرف --- */
    startTimer() {
        if(this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (!this.isPaused && !this.isTimerFrozen && this.timeLeft > 0) {
                this.timeLeft--; this.updateTimerUI();
                if (this.timeLeft <= 10 && this.timeLeft > 0) this.playSound('beep');
            } else if (this.timeLeft <= 0 && !this.isTimerFrozen) { this.onFail(); }
        }, 1000);
    }
    updateTimerUI() {
        let m = Math.floor(Math.max(0, this.timeLeft)/60).toString().padStart(2,'0');
        let s = (Math.max(0, this.timeLeft)%60).toString().padStart(2,'0');
        document.getElementById('timer-display').innerText = `${m}:${s}`;
    }
    onFail() { clearInterval(this.timer); this.playSound('error'); alert("Server Timeout! GAME OVER."); this.switchScreen('welcome'); }

    openMarket() { document.getElementById('panel-market').classList.remove('hidden'); }
    closeMarket() { document.getElementById('panel-market').classList.add('hidden'); }
    buy(type) {
        let prices = { hint: 30, shield: 40 };
        if (this.coins < prices[type]) return this.failRoom("Not enough coins!");
        if (type === 'shield' && this.hasShield) return alert("Shield already active!");

        this.coins -= prices[type]; this.playSound('success'); this.updateStats();

        if (type === 'hint') { alert(`ADMIN HINT: ${this.activeGate.hint}`); }
        else if (type === 'shield') { this.hasShield = true; this.notify("Anti-Ban Shield active."); }
        this.closeMarket();
    }

    toggleAdminSidebar(open) { const sidebar = document.getElementById('admin-sidebar'); open ? sidebar.classList.add('open') : sidebar.classList.remove('open'); }
    adminToggleFreeze() {
        this.isTimerFrozen = !this.isTimerFrozen;
        const btn = document.getElementById('btn-freeze');
        if(this.isTimerFrozen) { btn.innerText = "⏱️ Stream Paused ❄️"; btn.style.background = "#4a3311"; btn.style.color="#ffd700"; } 
        else { btn.innerText = "⏱️ Pause Stream"; btn.style.background = ""; btn.style.color=""; }
    }
    adminInstantSolveGate() {
        if(!this.activeGate) return alert("Please enter a room first!");
        this.toggleAdminSidebar(false);
        this.winRoom();
    }
    adminModifyCoins(val) { this.coins = Math.max(0, this.coins + val); this.updateStats(); }
    adminModifyTime(val) { this.timeLeft = Math.max(5, this.timeLeft + val); this.updateTimerUI(); }

    returnToLobby() { this.switchScreen('lobby'); }
    updateStats() { document.getElementById('coin-val').innerText = this.coins; }
    notify(m, t="success") {
        let c = document.getElementById('toast-container'), n = document.createElement('div'); n.className='toast';
        if(t==='error') n.style.borderRightColor='var(--discord-red)'; n.innerText = m; c.appendChild(n); setTimeout(()=>n.remove(), 3000);
    }
}
const game = new MajesticEscape();
