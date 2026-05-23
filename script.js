/**
 * SOLAR GAMES: THE GOLDEN PROTOCOL - CORE ENGINE
 * V 3.0 - MASTER EDITION
 * يتم التحكم بجميع الواجهات البصرية المستقلة للأبواب المعقدة من خلال هذا المحرك
 */

class SolarGamesEngine {
    constructor() {
        // الأنظمة المركزية
        this.coins = 0; 
        this.globalTime = 90 * 60; // المؤقت المركزي الإجباري (ساعة ونصف)
        this.isTimerRunning = false;
        this.timeFrozen = false;
        
        // حالة اللعب
        this.activeGate = null;
        this.solvedGates = new Set();
        this.audioCtx = null;
        this.stageState = {};
        
        // التهيئة
        this.gameConfig = this.buildPuzzles();
        this.init();
        this.setupClickListeners();
        
        // حلقة المؤقت العام
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

    // ==========================================
    // نظام الصوت المدمج
    // ==========================================
    initAudio() {
        if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    }

    playSound(type) {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator(); 
        const gain = this.audioCtx.createGain();
        osc.connect(gain); 
        gain.connect(this.audioCtx.destination); 
        const now = this.audioCtx.currentTime;
        
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
    
    // ==========================================
    // واجهة المستخدم والتنبيهات
    // ==========================================
    showToast(msg, color = '#D4AF37') {
        const t = document.createElement('div'); 
        t.className = 'toast'; 
        t.innerText = msg; 
        t.style.borderRightColor = color;
        document.getElementById('toast-container').appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }

    triggerVisualGlitch() { 
        const c = document.getElementById('main-puzzle-card'); 
        if(c) { 
            c.classList.add('error-glitch'); 
            setTimeout(()=>c.classList.remove('error-glitch'), 400); 
        } 
    }
    
    setupClickListeners() { 
        document.addEventListener('click', (e) => { 
            if(e.target.tagName==='BUTTON' || e.target.classList.contains('channel-card') || e.target.hasAttribute('data-sfx')) { 
                this.initAudio(); 
                this.playSound('click'); 
            } 
        }); 
    }

    // ==========================================
    // قاعدة بيانات الألغاز (30 باب)
    // ==========================================
    buildPuzzles() {
        // قاعدة بيانات الأسئلة النصية النهائية بعد تجاوز اللغز البصري
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
            
            // الباب 4: لعبة المطابقة (تم التعديل لتكون إيموجي فاخرة بشكل أفقي)
            if(i===4) { 
                m.uiType = 'MATCH_EMOJI'; 
                m.desc="المطابقة الملكية: ابحث عن أزواج الرموز المتطابقة."; 
                m.data=['👑','💎','⚜️','🗝️','🛡️','⚔️','⚖️','⏳','🪙','🏺']; 
                m.hint="💡 تلميح: الذاكرة البصرية هي مفتاحك هنا."; 
            }
            // الأبواب الثمانية المعقدة (والمستقلة تماماً)
            else if(i===6) { m.uiType = 'UNIQUE_DOOR_6'; m.desc="مصفوفة العقد: قم بتدوير الخطوط الذهبية لتكوين اتصال مثالي في كل الزوايا."; m.hint="💡 اجعل الخطوط المركزية مستقيمة أولاً."; }
            else if(i===13) { m.uiType = 'UNIQUE_DOOR_13'; m.desc="اختراق الألوان: خمن تسلسل القطع البصرية. لا يوجد لون يتكرر."; m.ans=[1, 3, 0, 2]; m.hint="💡 ابدأ بالألوان الباردة."; }
            else if(i===17) { m.uiType = 'UNIQUE_DOOR_17'; m.desc="ميزان الكتلة: فعل الأعمدة الحجرية حتى يصل إجمالي التوهج إلى 100%."; m.data=[25, 10, 45, 30, 20]; m.target=100; m.hint="💡 عمودان من المنتصف وعمود من الطرف."; }
            else if(i===19) { m.uiType = 'UNIQUE_DOOR_19'; m.desc="عجلة الإزاحة: قم بمحاذاة الحلقة الداخلية لفك تشفير كلمة (GOLD)."; m.ans='GOLD'; m.hint="💡 دُر حركتين لليسار."; }
            else if(i===21) { m.uiType = 'UNIQUE_DOOR_21'; m.desc="الفسيفساء المتحركة: رتب القطع الذهبية تصاعدياً في الشبكة."; m.ans='123456780'; m.hint="💡 رتب الصف الأول ولن تحتاج للمسه مجدداً."; }
            else if(i===25) { m.uiType = 'UNIQUE_DOOR_25'; m.desc="شيفرة النبض: اقرأ التوهجات الصامتة لترجمة النبضات إلى الكلمة الصحيحة."; m.ans='SUN'; m.hint="💡 الكلمة من 3 حروف وتعني مصدر الضوء."; }
            else if(i===27) { m.uiType = 'UNIQUE_DOOR_27'; m.desc="الذاكرة الدوارة: احفظ النمط. ستدور اللوحة 90 درجة قبل أن تدخل إجابتك."; m.hint="💡 تخيل اللوحة مقلوبة للجانب قبل الضغط."; }
            else if(i===29) { m.uiType = 'UNIQUE_DOOR_29'; m.desc="المنفذ الرقمي: حول القيمة 0x1A إلى نظام عشري."; m.ans='26'; m.hint="💡 الرقم بين 20 و 30."; }
            // باقي الأبواب القياسية (مختصرة في التعريف)
            else {
                m.uiType = 'STANDARD_INPUT';
                m.desc = "تجاوز جدار الحماية: أدخل شيفرة التأكيد العشوائية لفتح المسار.";
                m.ans = "SOLAR";
                m.hint = "💡 الشيفرة هي SOLAR";
            }

            m.txtQ = riddles[i-1].q;
            m.txtA = riddles[i-1].a;
            mechanics.push(m);
        }
        return mechanics;
    }

    // ==========================================
    // أنظمة الإدارة والوقت (مربوطة بالمؤقت المركزي)
    // ==========================================
    toggleGlobalTimer() { 
        this.playSound('click'); this.isTimerRunning = !this.isTimerRunning; 
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
        document.getElementById('puzzle-global-timer').innerText = `${h}:${m}:${s}`;
        document.getElementById('global-timer-display').style.color = this.timeFrozen ? '#00ccff' : '#fff';
    }

    addCoins(amount) {
        this.playSound('click'); 
        this.coins = Math.max(0, this.coins + amount); 
        this.updateCoinsUI();
        if(amount > 0) this.showToast(`تم استخراج ${amount} بيانات!`); 
        else this.showToast(`تم خصم ${Math.abs(amount)} بيانات!`, '#ff3333');
    }
    
    updateCoinsUI() {
        document.getElementById('coin-val').innerText = this.coins; 
        document.getElementById('market-coins').innerText = this.coins;
    }

    // ==========================================
    // التنقل وإدارة الشاشات
    // ==========================================
    switchScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(`screen-${id}`).classList.remove('hidden');
        document.getElementById('main-nav').classList.toggle('hidden', id === 'welcome');
    }

    startLobby() { 
        this.initAudio(); 
        this.playSound('click'); 
        this.isTimerRunning = true; 
        this.switchScreen('lobby'); 
    }

    renderLobby() {
        const c = document.getElementById('gates-container'); 
        c.innerHTML = '';
        for(let i=1; i<=30; i++) {
            let btn = document.createElement('div'); 
            let isSolved = this.solvedGates.has(i);
            let isLocked = i !== 1 && !this.solvedGates.has(i - 1); 
            let isNext = !isSolved && !isLocked; 
            
            btn.className = `channel-card ${isSolved ? 'solved' : ''} ${isLocked ? 'locked' : ''} ${isNext ? 'unlocked-next' : ''}`;
            btn.setAttribute('data-sfx', 'true');
            
            let info = document.createElement('div'); 
            info.className = 'channel-info';
            let title = document.createElement('h3'); 
            title.innerText = `CHANNEL-${i.toString().padStart(2, '0')}`;
            let status = document.createElement('span'); 
            status.className = 'channel-status';
            
            if(isNext) { status.innerText = 'BYPASS REQUIRED'; status.style.color = '#D4AF37'; }
            else if(isSolved) { status.innerText = 'HACKED'; status.style.color = '#00ff66'; }
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

    // ==========================================
    // المحرك البصري المعزول (التصميم غير المتكرر)
    // ==========================================
    setupStage() {
        const p = this.activeGate;
        document.getElementById('int-desc').innerText = p.desc;
        const stage = document.getElementById('interactive-stage');
        
        // تفريغ وتجهيز المنطقة
        stage.innerHTML = `<div class="lux-panel" id="lux-inner-stage" style="width: 100%; min-height: 400px; background: #050505; border: 2px solid #D4AF37; border-radius: 8px; padding: 20px; box-shadow: inset 0 0 20px #000; position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center;"></div>`;
        const innerStage = document.getElementById('lux-inner-stage');
        
        // تصفير الحالة
        this.stageState = { clicks: 0, arr: [], val: 0, attempts: 0, playing: true, timer: null };

        const generateSubmitButton = (callback, text = 'تأكيد (Execute)') => {
            let btn = document.createElement('button'); 
            btn.className = 'btn-execute'; 
            btn.innerText = text; 
            btn.setAttribute('data-sfx', 'true');
            btn.style.cssText = 'background: linear-gradient(180deg, #222, #000); color: #D4AF37; border: 2px solid #D4AF37; padding: 15px 30px; font-size: 1.2rem; font-weight: bold; border-radius: 6px; cursor: pointer; transition: 0.3s; margin-top:20px; width: 100%; max-width: 400px;';
            btn.onclick = callback; 
            return btn;
        };

        const generateInput = (placeholder) => {
            let inp = document.createElement('input'); 
            inp.type = 'text'; 
            inp.placeholder = placeholder;
            inp.style.cssText = 'background: #000; border: 2px solid #D4AF37; color: #D4AF37; padding: 15px; font-size: 1.8rem; text-align: center; width: 100%; max-width: 400px; outline: none; box-shadow: inset 0 0 20px rgba(212,175,55,0.2); letter-spacing: 5px; font-family: monospace; border-radius: 8px; text-transform: uppercase;';
            return inp;
        };

        // مفتاح اختيار اللعبة (Switch Logic)
        switch(p.uiType) {

            // =====================================
            // لعبة المطابقة (الباب 4) - باستخدام الإيموجي الفاخر
            // =====================================
            case 'MATCH_EMOJI': {
                let grid = document.createElement('div'); 
                // تنسيق شبكي أفقي لتجنب العرض الطولي
                grid.style.cssText = 'display: grid; grid-template-columns: repeat(5, 70px); gap: 15px; margin: 20px auto; justify-content: center; perspective: 1000px;';
                
                let symbols = [...p.data, ...p.data].sort(() => Math.random() - 0.5);
                let flipped = [];
                
                symbols.forEach((sym) => {
                    let card = document.createElement('div'); 
                    card.style.cssText = 'width: 70px; height: 70px; cursor: pointer; position: relative; transform-style: preserve-3d; transition: transform 0.5s;';
                    
                    let front = document.createElement('div');
                    front.style.cssText = 'width: 100%; height: 100%; position: absolute; backface-visibility: hidden; background: #111; border: 2px solid #333; border-radius: 8px; box-shadow: 0 5px 10px rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; background-image: radial-gradient(circle, #333 10%, transparent 10%); background-size: 10px 10px;';
                    
                    let back = document.createElement('div');
                    back.style.cssText = 'width: 100%; height: 100%; position: absolute; backface-visibility: hidden; background: #0a0a0a; border: 2px solid #D4AF37; border-radius: 8px; display: flex; justify-content: center; align-items: center; font-size: 35px; transform: rotateY(180deg); box-shadow: 0 0 15px rgba(212, 175, 55, 0.5);';
                    back.innerText = sym;
                    
                    card.append(front, back);
                    
                    card.onclick = () => {
                        if(card.style.transform === 'rotateY(180deg)' || flipped.length >= 2) return;
                        this.playSound('click');
                        card.style.transform = 'rotateY(180deg)'; 
                        flipped.push({c: card, s: sym});
                        
                        if(flipped.length === 2) {
                            setTimeout(() => {
                                if(flipped[0].s === flipped[1].s) { 
                                    this.playSound('success');
                                    this.stageState.clicks += 2; 
                                    flipped[0].c.style.opacity = '0.5';
                                    flipped[1].c.style.opacity = '0.5';
                                    if(this.stageState.clicks === 20) this.winInteractive(); 
                                } else { 
                                    flipped[0].c.style.transform = 'rotateY(0deg)'; 
                                    flipped[1].c.style.transform = 'rotateY(0deg)'; 
                                }
                                flipped = [];
                            }, 600);
                        }
                    };
                    grid.appendChild(card);
                });
                innerStage.appendChild(grid);
                break;
            }

            // =====================================
            // الباب 6: مصفوفة العقد (UNIQUE_DOOR_6)
            // تصميم بصري: خطوط متصلة في شبكة مربعة
            // =====================================
            case 'UNIQUE_DOOR_6': {
                let grid = document.createElement('div');
                grid.style.cssText = 'display:grid; grid-template-columns:repeat(4, 75px); gap:8px; background:#000; padding:15px; border:2px solid #D4AF37; border-radius:10px; box-shadow: 0 10px 30px rgba(0,0,0,0.8);';
                
                let nodes = [];
                for(let i=0; i<16; i++) {
                    let node = document.createElement('div');
                    let isLine = Math.random() > 0.5;
                    node.style.cssText = `width:75px; height:75px; background:radial-gradient(circle, #222, #050505); display:flex; justify-content:center; align-items:center; cursor:pointer; font-size:3rem; color:#D4AF37; font-weight:bold; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); user-select:none; border:1px solid #333; border-radius: 4px; text-shadow: 0 0 10px #D4AF37;`;
                    node.innerText = isLine ? '━' : '┏';
                    let rot = [0, 90, 180, 270][Math.floor(Math.random()*4)];
                    node.style.transform = `rotate(${rot}deg)`;
                    node.dataset.rot = rot;
                    node.dataset.type = isLine ? 'line' : 'corner';
                    
                    node.onclick = () => {
                        this.playSound('click');
                        let r = (parseInt(node.dataset.rot) + 90) % 360;
                        node.dataset.rot = r;
                        node.style.transform = `rotate(${r}deg)`;
                        
                        let win = nodes.every(n => {
                            if(n.dataset.type === 'line') return [0, 180].includes(parseInt(n.dataset.rot));
                            return [0, 90, 180, 270].includes(parseInt(n.dataset.rot)); // كشرط مبسط للإكمال
                        });
                        if(win) setTimeout(() => this.winInteractive(), 400);
                    };
                    nodes.push(node); 
                    grid.appendChild(node);
                }
                innerStage.appendChild(grid);
                break;
            }

            // =====================================
            // الباب 13: اختراق الألوان (UNIQUE_DOOR_13)
            // تصميم بصري: كريستالات سداسية بدلاً من المربعات
            // =====================================
            case 'UNIQUE_DOOR_13': {
                let wrap = document.createElement('div');
                wrap.style.cssText = 'display:flex; flex-direction:column; align-items:center; width:100%;';
                
                let inputsGrid = document.createElement('div'); 
                inputsGrid.style.cssText = 'display:flex; gap:15px; margin-bottom: 20px;';
                
                // لوحة ألوان فاخرة
                let colors = ['#D4AF37', '#8a7322', '#555555', '#222222']; 
                let mboxes = [];
                
                for(let i=0; i<4; i++) { 
                    let poly = document.createElement('div'); 
                    poly.style.cssText = 'width:70px; height:80px; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); background:#111; cursor:pointer; transition:0.3s; border: 2px solid #555; display:flex; justify-content:center; align-items:center;';
                    poly.dataset.val = -1;
                    poly.onclick = () => {
                        this.playSound('click');
                        let v = (parseInt(poly.dataset.val) + 1) % colors.length;
                        poly.dataset.val = v; 
                        poly.style.background = colors[v]; 
                        poly.style.boxShadow = `0 0 15px ${colors[v]}`;
                    };
                    inputsGrid.appendChild(poly); 
                    mboxes.push(poly); 
                }
                
                let history = document.createElement('div'); 
                history.style.cssText = 'display:flex; flex-direction:column; gap:10px; width:100%; max-width:400px; max-height:150px; overflow-y:auto; padding:10px; background:rgba(0,0,0,0.5); border-radius:8px; border:1px solid #222; margin-top:20px;';
                
                let btn = generateSubmitButton(() => {
                    let guess = mboxes.map(b => parseInt(b.dataset.val));
                    if(guess.includes(-1)) return;
                    this.stageState.attempts++;
                    if(this.stageState.attempts > 8) { this.failRoom(); this.setupStage(); return; }
                    
                    let row = document.createElement('div'); 
                    row.style.cssText = 'display:flex; align-items:center; justify-content:space-between; background:#0a0a0a; padding:10px; border:1px solid #333; border-radius:4px;';
                    
                    let pegWrap = document.createElement('div'); pegWrap.style.cssText = 'display:flex; gap:8px;';
                    guess.forEach(g => { 
                        let p=document.createElement('div'); 
                        p.style.cssText=`width:15px;height:15px;border-radius:2px;background:${colors[g]};`; 
                        pegWrap.appendChild(p); 
                    });
                    
                    let resultWrap = document.createElement('div'); resultWrap.style.cssText = 'display:flex; gap:5px;';
                    let exact = 0;
                    
                    for(let i=0; i<4; i++) { 
                        let resDot = document.createElement('div');
                        resDot.style.cssText = 'width:12px; height:12px; border-radius:50%; border:1px solid #555;';
                        if(guess[i] === p.ans[i]) { resDot.style.background = '#00ff66'; exact++; }
                        else if(p.ans.includes(guess[i])) { resDot.style.background = '#D4AF37'; }
                        else { resDot.style.background = '#ff3333'; }
                        resultWrap.appendChild(resDot);
                    }
                    
                    row.append(pegWrap, resultWrap); 
                    history.prepend(row);
                    
                    if(exact === 4) this.winInteractive();
                    else this.playSound('error');
                }, 'تحليل التردد (Scan)');
                
                wrap.append(inputsGrid, btn, history); 
                innerStage.appendChild(wrap);
                break;
            }

            // =====================================
            // الباب 17: ميزان الكتلة (UNIQUE_DOOR_17)
            // تصميم بصري: أعمدة طاقة تصعد وتهبط
            // =====================================
            case 'UNIQUE_DOOR_17': {
                let meterWrap = document.createElement('div');
                meterWrap.style.cssText = 'display:flex; align-items:flex-end; gap:15px; height:200px; padding-bottom:10px; border-bottom:4px solid #D4AF37; margin-bottom:30px;';
                
                let bars = [];
                p.data.forEach((val) => {
                    let col = document.createElement('div');
                    // المظهر: عمود مظلم داخله طاقة تتوهج عند التفعيل
                    col.style.cssText = `width: 50px; height: ${val * 3}px; background: #111; border: 2px solid #333; position: relative; cursor: pointer; transition: 0.3s; box-shadow: inset 0 -10px 20px rgba(0,0,0,0.8); border-radius: 4px 4px 0 0; overflow: hidden;`;
                    
                    let glow = document.createElement('div');
                    glow.style.cssText = 'position: absolute; bottom: 0; width: 100%; height: 0%; background: linear-gradient(0deg, #D4AF37, transparent); transition: 0.4s ease-out; opacity: 0;';
                    col.appendChild(glow);
                    
                    col.dataset.val = val;
                    col.dataset.active = "false";
                    
                    col.onclick = () => {
                        this.playSound('click');
                        let isActive = col.dataset.active === "true";
                        col.dataset.active = !isActive;
                        glow.style.height = !isActive ? '100%' : '0%';
                        glow.style.opacity = !isActive ? '1' : '0';
                        col.style.borderColor = !isActive ? '#D4AF37' : '#333';
                        
                        let sum = bars.reduce((acc, b) => acc + (b.dataset.active === "true" ? parseInt(b.dataset.val) : 0), 0);
                        if(sum === p.target) setTimeout(()=>this.winInteractive(), 500);
                    };
                    bars.push(col);
                    meterWrap.appendChild(col);
                });
                
                innerStage.appendChild(meterWrap);
                let lbl = document.createElement('div');
                lbl.style.cssText = 'color: #888; font-family: monospace; letter-spacing: 2px;';
                lbl.innerText = 'ENERGY DISTRIBUTION MATRIX';
                innerStage.appendChild(lbl);
                break;
            }

            // =====================================
            // الباب 19: عجلة الإزاحة (UNIQUE_DOOR_19)
            // تصميم بصري: حلقتين دائريتين بستايل قوطي/سلكي
            // =====================================
            case 'UNIQUE_DOOR_19': {
                let wheelCont = document.createElement('div'); 
                wheelCont.style.cssText = 'position:relative; width:300px; height:300px; display:flex; justify-content:center; align-items:center; margin-bottom:30px; border-radius:50%; background: radial-gradient(circle, #111, #000); box-shadow: 0 0 40px rgba(0,0,0,0.9);';
                
                let outerRing = document.createElement('div'); 
                outerRing.style.cssText = 'position:absolute; width:100%; height:100%; border-radius:50%; border:2px dashed #555; display:flex; justify-content:center; align-items:center;';
                
                let innerRing = document.createElement('div'); 
                innerRing.style.cssText = 'position:absolute; width:70%; height:70%; border-radius:50%; background:#0a0a0a; border:4px solid #D4AF37; display:flex; justify-content:center; align-items:center; cursor:pointer; transition:transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 20px rgba(212,175,55,0.15);';
                
                let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                let rOut = 130, rIn = 85;
                
                for(let i=0; i<26; i++) {
                    let angle = (i * 360 / 26) * (Math.PI/180);
                    
                    let oChar = document.createElement('div'); 
                    oChar.innerText=chars[i]; 
                    oChar.style.cssText=`position:absolute; left:${rOut*Math.cos(angle)+140}px; top:${rOut*Math.sin(angle)+140}px; color:#666; font-family:monospace; font-weight:bold; font-size:14px;`;
                    
                    let iChar = document.createElement('div'); 
                    iChar.innerText=chars[i]; 
                    iChar.style.cssText=`position:absolute; left:${rIn*Math.cos(angle)+95}px; top:${rIn*Math.sin(angle)+95}px; transform:rotate(${i*360/26}deg); color:#D4AF37; font-family:monospace; font-weight:bold; font-size:16px;`;
                    
                    outerRing.appendChild(oChar); 
                    innerRing.appendChild(iChar);
                }
                
                let rotation = 0;
                innerRing.onclick = () => { 
                    this.playSound('click');
                    rotation += (360/26); 
                    innerRing.style.transform = `rotate(${rotation}deg)`; 
                };
                
                wheelCont.append(outerRing, innerRing); 
                innerStage.appendChild(wheelCont);
                
                let inp = generateInput('DECODE "IQNF"...');
                let btn = generateSubmitButton(() => {
                    if(inp.value.trim().toUpperCase() === p.ans) this.winInteractive(); else this.failRoom();
                });
                innerStage.append(inp, btn);
                break;
            }

            // =====================================
            // الباب 21: الفسيفساء المتحركة (UNIQUE_DOOR_21)
            // تصميم بصري: مربعات بلوكات حجرية/ذهبية متلاصقة
            // =====================================
            case 'UNIQUE_DOOR_21': {
                let board = document.createElement('div'); 
                board.style.cssText = 'display:grid; grid-template-columns:repeat(3, 85px); gap:4px; background:#222; padding:8px; border:2px solid #555; border-radius:6px; box-shadow: 0 15px 25px rgba(0,0,0,0.9);';
                
                let state = [1,2,3,4,6,8,7,5,0]; // ترتيب قابل للحل
                
                const drawBoard = () => {
                    board.innerHTML = '';
                    state.forEach((num, index) => {
                        let tile = document.createElement('div'); 
                        if(num === 0) {
                            tile.style.cssText = 'width:85px; height:85px; background:transparent; border:1px dashed #444; border-radius:4px;';
                        } else {
                            tile.style.cssText = 'width:85px; height:85px; background:linear-gradient(135deg, #D4AF37, #8a7322); display:flex; justify-content:center; align-items:center; font-size:2.5rem; font-weight:bold; color:#000; cursor:pointer; border-radius:4px; box-shadow: inset 0 0 10px rgba(0,0,0,0.3); transition: 0.2s; user-select:none;';
                            tile.innerText = num;
                            tile.onclick = () => {
                                let zeroIdx = state.indexOf(0);
                                let valid = [zeroIdx-1, zeroIdx+1, zeroIdx-3, zeroIdx+3];
                                // منع الالتفاف حول الحواف
                                if(zeroIdx%3 === 0 && index === zeroIdx-1) return;
                                if(zeroIdx%3 === 2 && index === zeroIdx+1) return;
                                
                                if(valid.includes(index)) {
                                    this.playSound('click');
                                    state[zeroIdx] = num; 
                                    state[index] = 0; 
                                    drawBoard();
                                    if(state.join('') === p.ans) setTimeout(()=>this.winInteractive(), 300);
                                }
                            };
                        }
                        board.appendChild(tile);
                    });
                };
                drawBoard(); 
                innerStage.appendChild(board);
                break;
            }

            // =====================================
            // الباب 25: شيفرة النبض (UNIQUE_DOOR_25)
            // تصميم بصري: عدسة كاميرا تتوهج كعين روبوت
            // =====================================
            case 'UNIQUE_DOOR_25': {
                let lensCont = document.createElement('div');
                lensCont.style.cssText = 'width: 150px; height: 150px; border-radius: 50%; background: #000; border: 8px solid #222; margin: 30px auto; display:flex; justify-content:center; align-items:center; box-shadow: 0 10px 30px rgba(0,0,0,0.8);';
                
                let lensCore = document.createElement('div');
                lensCore.style.cssText = 'width: 60px; height: 60px; border-radius: 50%; background: #050505; transition: all 0.1s; box-shadow: inset 0 0 20px #000;';
                lensCont.appendChild(lensCore);
                innerStage.appendChild(lensCont);
                
                let inp = generateInput('TRANSLATE SIGNAL...');
                let btn = generateSubmitButton(() => {
                    if(inp.value.trim().toUpperCase() === p.ans) {
                        clearInterval(this.stageState.timer);
                        this.winInteractive(); 
                    } else this.failRoom();
                });
                innerStage.append(inp, btn);

                const flash = (dur) => { 
                    lensCore.style.background = '#D4AF37'; 
                    lensCore.style.boxShadow = '0 0 60px #D4AF37, inset 0 0 10px #fff';
                    setTimeout(()=> { 
                        lensCore.style.background = '#050505'; 
                        lensCore.style.boxShadow = 'inset 0 0 20px #000'; 
                    }, dur); 
                }
                
                // SUN = ... / ..- / -. (S: 3 short, U: 2 short 1 long, N: 1 long 1 short)
                let seq = [200,200,200, 800, 200,200,600, 800, 600,200]; 
                let step = 0;
                
                this.stageState.timer = setInterval(() => {
                    flash(seq[step]); 
                    step++;
                    if(step >= seq.length) step = 0;
                }, 1200);
                break;
            }

            // =====================================
            // الباب 27: الذاكرة الدوارة (UNIQUE_DOOR_27)
            // تصميم بصري: مصفوفة محاطة بإطار يدور بأكمله
            // =====================================
            case 'UNIQUE_DOOR_27': {
                let rotContainer = document.createElement('div'); 
                rotContainer.style.cssText = 'width:280px; height:280px; transition:transform 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55); margin-bottom:40px;';
                
                let grid = document.createElement('div');
                grid.style.cssText = 'display:grid; grid-template-columns:repeat(4, 1fr); width:100%; height:100%; gap:6px; padding:8px; background:#111; border:2px solid #D4AF37; border-radius:8px; box-shadow: 0 0 30px rgba(212,175,55,0.1);';
                
                let cells = [];
                for(let i=0; i<16; i++) {
                    let cell = document.createElement('div'); 
                    cell.style.cssText = 'background:#000; border:1px solid #333; border-radius:4px; transition:0.2s; cursor:pointer;';
                    cell.onclick = () => {
                        if(this.stageState.playing) return;
                        this.playSound('click');
                        cell.style.background = '#D4AF37'; 
                        cell.style.boxShadow = '0 0 15px #D4AF37';
                        this.stageState.arr.push(i);
                        
                        if(this.stageState.arr.length === 4) {
                            // المواقع الصحيحة بعد دوران المصفوفة 90 درجة لليمين
                            let correct = [12, 9, 6, 3]; 
                            let sortedInput = [...this.stageState.arr].sort((a,b)=>a-b);
                            let sortedAns = [...correct].sort((a,b)=>a-b);
                            
                            if(JSON.stringify(sortedInput) === JSON.stringify(sortedAns)) {
                                this.winInteractive();
                            } else { 
                                this.failRoom(); 
                                setTimeout(()=>this.setupStage(), 1000); 
                            }
                        }
                    };
                    cells.push(cell); 
                    grid.appendChild(cell);
                }
                
                rotContainer.appendChild(grid); 
                innerStage.appendChild(rotContainer);
                
                // بدء عرض النمط ثم التدوير
                setTimeout(() => {
                    [0, 5, 10, 15].forEach(i => {
                        cells[i].style.background = '#fff';
                        cells[i].style.boxShadow = '0 0 20px #fff';
                    });
                    this.playSound('success');
                    
                    setTimeout(() => {
                        cells.forEach(c => { c.style.background = '#000'; c.style.boxShadow = 'none'; });
                        rotContainer.style.transform = 'rotate(90deg)'; 
                        this.stageState.playing = false; 
                    }, 2000);
                }, 800);
                break;
            }

            // =====================================
            // الباب 29: المنفذ الرقمي (UNIQUE_DOOR_29)
            // تصميم بصري: شاشة طرفية (Terminal) خضراء/ذهبية
            // =====================================
            case 'UNIQUE_DOOR_29': {
                let termDisp = document.createElement('div'); 
                termDisp.style.cssText = 'font-size:3.5rem; color:#D4AF37; font-family:monospace; margin:30px 0; border:2px solid #333; padding:20px 50px; background:#050505; border-radius:4px; box-shadow: inset 0 0 20px #000, 0 10px 20px rgba(0,0,0,0.5); letter-spacing: 5px; position:relative; overflow:hidden;';
                
                // تأثير مسح (Scanline effect) مبرمج
                let scanline = document.createElement('div');
                scanline.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:2px; background:rgba(212,175,55,0.5); opacity:0.5; pointer-events:none;';
                termDisp.appendChild(scanline);
                
                let valTxt = document.createElement('span');
                valTxt.innerText = '0x1A';
                termDisp.appendChild(valTxt);
                
                innerStage.appendChild(termDisp);
                
                let pos = 0;
                this.stageState.timer = setInterval(() => {
                    pos += 2;
                    if(pos > 100) pos = 0;
                    scanline.style.top = pos + '%';
                }, 50);

                let inp = generateInput('DECIMAL VALUE...');
                let btn = generateSubmitButton(() => {
                    if(inp.value.trim() === p.ans) {
                        clearInterval(this.stageState.timer);
                        this.winInteractive(); 
                    } else this.failRoom();
                });
                innerStage.append(inp, btn);
                break;
            }

            // =====================================
            // الأبواب القياسية الافتراضية
            // =====================================
            default: {
                let fallbackIcon = document.createElement('div');
                fallbackIcon.innerText = '🔒';
                fallbackIcon.style.cssText = 'font-size: 5rem; margin-bottom: 20px; filter: drop-shadow(0 0 10px #D4AF37);';
                innerStage.appendChild(fallbackIcon);
                
                let inp = generateInput('ENTER OVERRIDE CODE...');
                let btn = generateSubmitButton(() => {
                    if(inp.value.trim().toUpperCase() === p.ans) this.winInteractive(); else this.failRoom();
                });
                innerStage.append(inp, btn);
                break;
            }
        }
    }

    // ==========================================
    // معالجة النجاح والفشل
    // ==========================================
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
            this.showToast('تم اختراق الروم بنجاح! +15 بيانات', '#00ff66');
            this.returnToLobby();
        } else {
            this.failRoom();
        }
    }
    
    failRoom() { 
        this.playSound('error'); 
        this.triggerVisualGlitch(); 
        this.showToast('فشل الاختراق! أعد المحاولة.', '#ff3333');
    }

    // ==========================================
    // لوحة الإدارة
    // ==========================================
    toggleAdminSidebar(open) { 
        this.playSound('click'); 
        const sidebar = document.getElementById('admin-sidebar'); 
        open ? sidebar.classList.add('open') : sidebar.classList.remove('open'); 
    }
    
    adminInstantSolveGate() {
        this.playSound('click');
        if(!this.activeGate) return;
        this.toggleAdminSidebar(false);
        this.solvedGates.add(this.activeGate.id);
        this.addCoins(15);
        this.showToast('تم تخطي الروم إجبارياً بواسطة الآدمن!', '#00ff66');
        this.returnToLobby();
    }

    returnToLobby() { 
        if(this.stageState.timer) clearInterval(this.stageState.timer);
        this.playSound('click'); 
        this.switchScreen('lobby'); 
        this.renderLobby(); 
    }
}

// تهيئة اللعبة عند تحميل الملف
const game = new SolarGamesEngine();
