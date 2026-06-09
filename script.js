function checkEntryCode() {
    const code = document.getElementById('entry-code').value;
    if(code === '87') {
        game.startLobby();
    } else {
        alert('الرمز السري غير صحيح!');
    }
}

class SolarGamesEngine {
    constructor() {
        this.activeGate = null;
        this.solvedGates = new Set();
        
        this.externalTimerSeconds = 60; 
        this.isTimerRunning = false;
        
        this.gameConfig = this.buildPuzzles();
        this.init();
        
        setInterval(() => {
            if(this.isTimerRunning && this.externalTimerSeconds > 0) {
                this.externalTimerSeconds--;
                this.updateTimerDisplay();
            }
        }, 1000);
    }

    init() { 
        this.renderLobby(); 
        this.updateTimerDisplay();
    }

    playSound(type) { return; }  
    
    showToast(msg, color = 'var(--apple)') {
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

    setTimer() {
        let val = document.getElementById('timer-input').value;
        let parts = val.split(':');
        if(parts.length === 2) {
            let m = parseInt(parts[0]);
            let s = parseInt(parts[1]);
            if(!isNaN(m) && !isNaN(s)) {
                this.externalTimerSeconds = (m * 60) + s;
                this.updateTimerDisplay();
                this.showToast('تم تحديث المؤقت');
            }
        }
    }

    setSpecificTimer(secs) {
        this.externalTimerSeconds = secs;
        this.updateTimerDisplay();
        this.showToast(`تم ضبط الوقت على ${secs} ثانية`);
    }
    
    toggleTimer() {
        this.isTimerRunning = !this.isTimerRunning;
    }
    
    updateTimerDisplay() {
        let m = Math.floor(this.externalTimerSeconds / 60).toString().padStart(2,'0');
        let s = (this.externalTimerSeconds % 60).toString().padStart(2,'0');
        document.getElementById('timer-display').innerText = `${m}:${s}`;
    }

    buildPuzzles() {
        const riddles = [
            {q: "شيء كلما زاد، قلّت رؤيتك له.", a: "الظلام"}, 
            {q: "ابن الماء، وإذا وضعته في الماء مات.", a: "الثلج"},
            {q: "شيء احتفاظك به لك، وإذا شاركته مع الناس فقدته؟", a: "السر"}, 
            {q: "شيء يرتفع ولا ينزل أبدًا؟", a: "العمر"},
            {q: "يتحدث بلا فم ويسمع بلا أذنين؟", a: "الصدى"}, 
            {q: "لها عقارب ولكن لا تلدغ؟", a: "الساعة"},
            {q: "مليء بالثقوب ولكنه يحتفظ بالماء؟", a: "الاسفنج"},
            {q: "لا يمكنك الاحتفاظ به إلا بعد إعطائه؟", a: "الوعد"},
            {q: "إذا نطقت باسمه كسرته؟", a: "الصمت"}, 
            {q: "كلما جففت شيئًا، أصبحت أكثر بللًا؟", a: "المنشفة"}, 
            {q: "فيها مدن بلا منازل، وغابات بلا أشجار؟", a: "الخريطة"},
            {q: "يمشي بلا أرجل ويبكي بلا أعين؟", a: "السحاب"},
            {q: "أخضر من الخارج، أحمر من الداخل؟", a: "البطيخ"}, 
            {q: "له رأس ولا عين له؟", a: "المسمار"},
            {q: "دائمًا تشير للشمال ولكنها لا تتحرك؟", a: "البوصلة"}, 
            {q: "تسمعها ولكن لا تراها ولا تلمسها؟", a: "الريح"},
            {q: "يكبر في الصباح ويختفي في الظهيرة؟", a: "الظل"}, 
            {q: "كلما أخذت منه كبر؟", a: "الحفرة"},
            {q: "يقرصك ولا تراه؟", a: "الجوع"}, 
            {q: "يملكه الشخص ويستخدمه الآخرون أكثر منه؟", a: "الاسم"}
        ];

        let mechanics = [];
        for(let i=1; i<=20; i++) {
            let m = { id: i, type: `GAME_${i}` };
            
            if(i===1) { m.uiType = 'WIRES'; m.desc="اقطع 3 أسلاك محددة."; m.data=['#8cc63f','#ff3333','#333','#fff','#00ccff','#ff3333']; m.ans=[1,3,4]; }
            else if(i===2) { m.uiType = 'SIMON'; m.desc="الذاكرة البصرية: 6 ألوان، لاحظ المربع الذي ينطفئ وكرر النمط (جولتين)."; m.data=6; }
            else if(i===3) { m.uiType = 'MASTERMIND'; m.desc="الاستنتاج: أدخل 4 أرقام. (أخضر=مكان صحيح، برتقالي=مكان خطأ، أحمر=غير موجود)."; m.ans=[3,7,1,9]; }
            else if(i===4) { m.uiType = 'MATCH'; m.desc="التطابق: اقلب البطاقات (المرقمة من 1-20) وطابق الأزواج."; m.data=['🪐','☄️','🌑','🔭','🛸','🛰️','🌌','🌠','🚀','👨‍🚀']; }
            else if(i===5) { m.uiType = 'COMPASS'; m.desc=" 45 , 225 , *** توجيه البوصلة: اضبط الزوايا الثلاث لتتجه نحو المسار المخفي."; m.ans=[135, 225, 45]; }
            else if(i===6) { m.uiType = 'SCALES'; m.desc="الميزان: قم بتفعيل الأوزان الصحيحة ليصل المجموع إلى *** بالضبط."; m.data=[50,70,30,80,20]; m.target=150; }
            else if(i===7) { m.uiType = 'TIC_TAC_TOE'; m.desc="لعبة الـ X O: اضغط لتغيير الرمز لعمل خط كامل."; m.ans=['X','','X', '','X','', 'X','','X']; }
            else if(i===8) { m.uiType = 'MINES'; m.desc="كاسحة الألغام (3 جولات): في كل جولة هناك لغم واحد عشوائي، اضغط على جميع الأرقام الآمنة لتفوز."; }
            else if(i===9) { m.uiType = 'HIDE_BOMB'; m.desc="الغميضة المتفجرة: اختاروا أرقام القنابل، ثم ابحثوا في الشبكة."; }
            else if(i===10) { m.uiType = 'ELEVATOR'; m.desc="المصعد: اضغط على الطوابق بالترتيب المخفي في السيرفر."; m.ans=[4, 1, 5]; }
            else if(i===11) { m.uiType = 'JUGS'; m.desc="الكيمياء: انقل السوائل بين الدوارق (8, 5, 3) لتحصل على 4 لتر."; }
            else if(i===12) { m.uiType = 'BLIND_MAZE'; m.desc="المتاهة العمياء: هناك مسار واحد آمن في الشبكة."; m.ans=[0,6,12,13,14,20,26,32,33,34,35]; }
            else if(i===13) { m.uiType = 'CRYPTEX'; m.desc="شفرة قيصر: حرك الأحرف (من اليسار لليمين) للوصول لكلمة (ECLIPSE)."; m.ans='ECLIPSE'; }
            else if(i===14) { m.uiType = 'SHARDS'; m.desc="من أنا (3 جولات): اكشف الشظايا لتعرف اسم الشخصية."; }
            else if(i===15) { m.uiType = 'IMAGE_CHALLENGE'; m.desc="تحدي الصور (3 جولات): تفحص الصورة واستنتج الجواب."; }
            else if(i===16) { m.uiType = 'VIRTUAL_PIANO'; m.desc="البيانو الكلاسيكي: اعزف النوتات الأربعة السرية بالترتيب لفتح القفل."; m.ans=[0, 2, 4, 0]; }
            else if(i===17) { m.uiType = 'ARROW_LOCK'; m.desc="توازن الأسهم: ادفع الكتل يميناً ويساراً لتصل النسبة لـ 100%."; }
            else if(i===18) { m.uiType = 'STORY_IMAGE'; m.desc="قصة اللوحة: اقرأ القصة وتفحص الصورة المرفقة لاستنتاج الإجابة."; m.ans='ليبا'; }
            else if(i===19) { m.uiType = 'KEYPAD'; m.desc="اللوحة الرقمية: أدخل الرمز السري المتناثر في الغرفة."; m.ans='1957'; }
            else if(i===20) { m.uiType = 'EPIC_DETECTIVE'; m.desc="ملف القضية الأسود (5 مراحل): ابحث عن الأدلة لتعرف القاتل الحقيقي."; }

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
        
        if(id === 'puzzle') {
            document.getElementById('btn-skip').classList.remove('hidden');
        } else {
            document.getElementById('btn-skip').classList.add('hidden');
        }
    }

    startLobby() { this.switchScreen('lobby'); }

    renderLobby() {
        const c = document.getElementById('gates-container'); 
        c.innerHTML = '';
        
        for(let i=1; i<=20; i++) {
            let btn = document.createElement('div'); 
            let isSolved = this.solvedGates.has(i);
            
            btn.className = `channel-card ${isSolved ? 'solved' : ''}`;
            btn.classList.add('interactive-element');
            
            let info = document.createElement('div'); 
            info.className = 'channel-info';
            
            let title = document.createElement('h3'); 
            title.innerText = `CHANNEL-${i.toString().padStart(2, '0')}`;
            
            let status = document.createElement('span'); 
            status.className = 'channel-status';
            
            if(isSolved) { status.innerText = 'HACKED'; status.style.color = 'var(--apple)'; }
            else { status.innerText = 'متاح للدخول'; status.style.color = '#ccc'; }

            info.append(title, status); 
            btn.appendChild(info);
            
            btn.addEventListener('click', () => { this.handleGateClick(i); });
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
        
        document.getElementById('puzzle-title').innerHTML = `<span style="color:#aaa;">🔊</span> # ROOM-${id.toString().padStart(2,'0')}`;

        this.setupStage(); 
        this.switchScreen('puzzle');
    }

    clearTimers() {
        if(this.stageState && this.stageState.timer) {
            clearInterval(this.stageState.timer);
            clearTimeout(this.stageState.timer);
            this.stageState.timer = null;
        }
    }

    setupStage() {
        this.clearTimers();
        const p = this.activeGate;
        document.getElementById('int-desc').innerText = p.desc;
        
        const stage = document.getElementById('interactive-stage');
        stage.innerHTML = `<div class="lux-panel" id="lux-inner-stage" style="width:100%; min-height:400px; background:#050505; border:2px solid var(--apple); border-radius:8px; padding:20px; box-shadow:inset 0 0 20px #000; position:relative; overflow:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center;"></div>`;
        const innerStage = document.getElementById('lux-inner-stage');
        
        this.stageState = { clicks: 0, arr: [], val: 0, attempts: 0, playing: true, timer: null };

        const generateSubmitButton = (callback, text = 'تأكيد (Execute)') => {
            let btn = document.createElement('button'); 
            btn.className = 'btn-execute interactive-element'; 
            btn.innerText = text; 
            btn.style.cssText = 'background: linear-gradient(180deg, #222, #000); color: var(--apple); border: 2px solid var(--apple); padding: 15px 30px; font-size: 1.2rem; font-weight: bold; border-radius: 6px; cursor: pointer; transition: 0.3s; margin-top:20px; width: 100%; max-width: 400px; z-index:10;';
            btn.onclick = callback; 
            return btn;
        };

        const createInputBlock = (placeholder, ans) => {
            let wrap = document.createElement('div'); 
            wrap.style.cssText = 'width:100%; display:flex; flex-direction:column; align-items:center; z-index:10;';
            let inp = document.createElement('input'); 
            inp.type = 'text'; 
            inp.className = 'cyber-input interactive-element'; 
            inp.placeholder = placeholder;
            wrap.append(inp, generateSubmitButton(() => { 
                if(inp.value.trim().toUpperCase() === ans.toUpperCase()) this.winInteractive(); 
                else this.failRoom(); 
            }));
            innerStage.appendChild(wrap);
            return inp;
        };

        switch(p.uiType) {
            case 'WIRES': {
                let wWrap = document.createElement('div'); wWrap.style.cssText = 'width:100%; display:flex; flex-direction:column; align-items:center; gap: 15px;';
                p.data.forEach((color, i) => {
                    let w = document.createElement('div'); w.className = 'interactive-element';
                    w.style.cssText = `width:100%; max-width:400px; height:30px; background-color:${color}; border-radius:15px; cursor:pointer; border:2px solid #222; box-shadow:0 5px 10px rgba(0,0,0,0.8), inset 0 2px 5px rgba(255,255,255,0.3); transition:0.3s;`;
                    w.onclick = () => {
                        w.style.opacity = '0.2'; w.style.pointerEvents = 'none'; w.style.borderStyle = 'dashed';
                        if(p.ans[this.stageState.clicks] === i) {
                            this.stageState.clicks++;
                            if(this.stageState.clicks === p.ans.length) this.winInteractive();
                        } else { this.failRoom(); setTimeout(() => this.setupStage(), 800); }
                    }; wWrap.appendChild(w);
                }); innerStage.appendChild(wWrap); break;
            }

            case 'SIMON': {
                let smGrid = document.createElement('div'); smGrid.style.cssText = 'display:grid; grid-template-columns:repeat(3, 100px); gap:15px; justify-content:center;';
                let colors = ['#ff3333', '#00ff66', '#00ccff', '#ffff00', '#ff00ff', '#ff8800'];
                let boxes = [];
                for(let i=0; i<6; i++) {
                    let b = document.createElement('div'); b.className = 'interactive-element';
                    b.style.cssText = `width:100px; height:100px; background:${colors[i]}; border:4px solid #fff; border-radius:12px; cursor:pointer; transition:0.1s; box-shadow:0 0 15px ${colors[i]};`;
                    b.onclick = () => {
                        if(!this.stageState.playing) return;
                        if(this.stageState.sequence[this.stageState.clicks] === i) {
                            b.style.background = '#111'; b.style.borderColor = '#333'; b.style.boxShadow = 'inset 0 0 15px #000';
                            setTimeout(()=>{ b.style.background = colors[i]; b.style.borderColor = '#fff'; b.style.boxShadow = `0 0 15px ${colors[i]}`; }, 200);
                            this.stageState.clicks++;
                            if(this.stageState.clicks === this.stageState.sequence.length) {
                                this.stageState.round++;
                                if(this.stageState.round > 2) setTimeout(() => this.winInteractive(), 500); else setTimeout(()=>playRound(), 2000);
                            }
                        } else { this.failRoom(); setTimeout(() => this.setupStage(), 800); }
                    }; smGrid.appendChild(b); boxes.push(b);
                } innerStage.appendChild(smGrid); this.stageState.round = 1;
                
                const playRound = () => {
                    this.stageState.playing = false; this.stageState.clicks = 0;
                    let count = this.stageState.round === 1 ? 4 : 6;
                    this.stageState.sequence = Array.from({length: count}, () => Math.floor(Math.random() * 6));
                    let step = 0;
                    this.stageState.timer = setInterval(() => {
                        if(step < count) {
                            let idx = this.stageState.sequence[step];
                            boxes[idx].style.background = '#111'; boxes[idx].style.borderColor = '#333'; boxes[idx].style.boxShadow = 'inset 0 0 15px #000';
                            setTimeout(()=> { boxes[idx].style.background = colors[idx]; boxes[idx].style.borderColor = '#fff'; boxes[idx].style.boxShadow = `0 0 15px ${colors[idx]}`; }, 500);
                            step++;
                        } else { clearInterval(this.stageState.timer); this.stageState.playing = true; }
                    }, 1500);
                }; setTimeout(()=>playRound(), 1000); break;
            }

            case 'MASTERMIND': {
                let container = document.createElement('div'); container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap: 15px; width:100%; max-width:500px;';
                let inputs = document.createElement('div'); inputs.style.cssText = 'display:flex; gap:15px; justify-content:center; margin-bottom:10px; direction:ltr;';
                let mboxes = [];
                for(let i=0; i<4; i++) { 
                    let inp = document.createElement('input'); inp.type='number'; inp.className = 'interactive-element';
                    inp.style.cssText = 'width:60px; height:70px; background:#000; border:2px solid var(--apple); color:var(--apple); font-size:2.5rem; text-align:center; border-radius:8px; outline:none; font-family:monospace; box-shadow:inset 0 0 15px rgba(140, 198, 63, 0.2);'; 
                    inp.maxLength=1; inputs.appendChild(inp); mboxes.push(inp); 
                }
                
                let historyWrap = document.createElement('div');
                historyWrap.style.cssText = 'display:flex; flex-direction:column; gap:8px; width:100%; height:200px; overflow-y:auto; background:#111; padding:10px; border-radius:8px; border:2px solid #333; direction:ltr;';
                
                let btn = generateSubmitButton(() => {
                    let guess = mboxes.map(b => parseInt(b.value));
                    if(guess.some(isNaN)) return;
                    this.stageState.attempts++;
                    
                    let secret = [...p.ans]; // [3, 7, 1, 9]
                    let secretMarked = [false, false, false, false];
                    let guessMarked = [false, false, false, false];
                    let resultColors = ['#ff3333', '#ff3333', '#ff3333', '#ff3333'];

                    // فحص الأخضر
                    for(let i=0; i<4; i++) {
                        if(guess[i] === secret[i]) {
                            resultColors[i] = '#00ff66';
                            secretMarked[i] = true;
                            guessMarked[i] = true;
                        }
                    }

                    // فحص البرتقالي
                    for(let i=0; i<4; i++) {
                        if(!guessMarked[i]) {
                            for(let j=0; j<4; j++) {
                                if(!secretMarked[j] && guess[i] === secret[j]) {
                                    resultColors[i] = '#ffa500';
                                    secretMarked[j] = true;
                                    guessMarked[i] = true;
                                    break;
                                }
                            }
                        }
                    }

                    let hRow = document.createElement('div'); hRow.style.cssText = 'display:flex; justify-content:center; gap:20px; padding:10px; background:#222; border-radius:6px; border:1px solid #444;';
                    for(let i=0; i<4; i++) {
                        let col = document.createElement('div'); col.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:5px;';
                        let num = document.createElement('div'); num.innerText = guess[i]; num.style.cssText = 'color:#fff; font-size:1.5rem; font-family:monospace; font-weight:bold;';
                        let peg = document.createElement('div'); peg.style.cssText = `width:15px; height:15px; border-radius:50%; background:${resultColors[i]}; border:1px solid #000; box-shadow:0 0 5px ${resultColors[i]};`;
                        col.append(num, peg);
                        hRow.appendChild(col);
                    }
                    
                    historyWrap.prepend(hRow); mboxes.forEach(b => b.value = '');
                    
                    if(guess.join('') === secret.join('')) { setTimeout(()=>this.winInteractive(), 500); } 
                    else if (this.stageState.attempts >= 8) { this.failRoom(); setTimeout(()=>this.setupStage(), 1000); }
                }, 'فحص الكود');
                
                container.append(inputs, historyWrap, btn); innerStage.appendChild(container); break;
            }

            case 'MATCH': {
                let crdGrid = document.createElement('div'); crdGrid.style.cssText = 'display:grid; grid-template-columns:repeat(5, 60px); gap:10px; justify-content:center; perspective:1000px;';
                let symbols = [...p.data, ...p.data].sort(() => Math.random() - 0.5); let flipped = [];
                symbols.forEach((sym, idx) => {
                    let card = document.createElement('div'); card.className = 'interactive-element'; card.style.cssText = 'width:60px; height:60px; perspective:1000px; cursor:pointer; position:relative;';
                    let inner = document.createElement('div'); inner.style.cssText = 'width:100%; height:100%; transition:transform 0.4s; transform-style:preserve-3d; position:absolute;';
                    
                    let front = document.createElement('div'); front.style.cssText = 'width:100%; height:100%; position:absolute; backface-visibility:hidden; background:#111; border:2px solid #444; border-radius:6px; display:flex; justify-content:center; align-items:center; font-size:1.5rem; color:#fff; font-weight:bold;'; 
                    front.innerText = idx + 1;
                    
                    let back = document.createElement('div'); back.style.cssText = 'width:100%; height:100%; position:absolute; backface-visibility:hidden; background:var(--apple); transform:rotateY(180deg); display:flex; justify-content:center; align-items:center; font-size:25px; border-radius:6px; color:#000; border:2px solid #fff;'; back.innerText = sym;
                    
                    inner.append(front, back); card.appendChild(inner);
                    card.onclick = () => {
                        if(inner.style.transform === 'rotateY(180deg)' || flipped.length >= 2) return;
                        inner.style.transform = 'rotateY(180deg)'; flipped.push({c:inner, s:sym});
                        if(flipped.length === 2) {
                            setTimeout(() => {
                                if(flipped[0].s === flipped[1].s) { this.stageState.clicks += 2; if(this.stageState.clicks === 20) this.winInteractive(); } 
                                else { flipped[0].c.style.transform = 'rotateY(0deg)'; flipped[1].c.style.transform = 'rotateY(0deg)'; }
                                flipped = [];
                            }, 600);
                        }
                    }; crdGrid.appendChild(card);
                }); innerStage.appendChild(crdGrid); break;
            }

            case 'COMPASS': { 
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:flex; gap:30px;'; let angles = [0, 0, 0];
                for(let i=0; i<3; i++) {
                    let cmp = document.createElement('div'); cmp.className = 'interactive-element'; cmp.style.cssText = 'width:100px; height:100px; border-radius:50%; background:radial-gradient(circle, #222, #000); border:4px solid var(--apple); position:relative; display:flex; justify-content:center; align-items:center; cursor:pointer; transition:transform 0.3s; box-shadow:0 0 20px rgba(140, 198, 63, 0.2);';
                    let ndl = document.createElement('div'); ndl.style.cssText = 'width:4px; height:80px; background:linear-gradient(to bottom, #ff3333 50%, #fff 50%); position:absolute; border-radius:2px;';
                    let center = document.createElement('div'); center.style.cssText = 'width:12px; height:12px; background:var(--apple); border-radius:50%; z-index:2;';
                    cmp.append(ndl, center);
                    cmp.onclick = () => { angles[i] = (angles[i] + 45) % 360; cmp.style.transform = `rotate(${angles[i]}deg)`; if(angles[0]===p.ans[0] && angles[1]===p.ans[1] && angles[2]===p.ans[2]) { setTimeout(()=>this.winInteractive(), 500); } };
                    wrap.appendChild(cmp);
                } innerStage.appendChild(wrap); break;
            }

            case 'SCALES': {
                let sclWrap = document.createElement('div'); sclWrap.style.cssText = 'display:flex; gap:20px; align-items:flex-end; height:150px; border-bottom: 4px solid var(--apple); padding-bottom:10px; width: 100%; max-width: 500px; justify-content:center; margin-top:50px; position:relative;';
                let balanceNeedle = document.createElement('div'); balanceNeedle.style.cssText = 'position:absolute; bottom:-20px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:10px solid transparent; border-right:10px solid transparent; border-bottom:15px solid #ff3333; transition:transform 0.3s;';
                sclWrap.appendChild(balanceNeedle);
                p.data.forEach((w) => {
                    let btn = document.createElement('div'); btn.className = 'interactive-element'; btn.style.cssText = 'width:60px; background:linear-gradient(to bottom, #ccc, #888); border:2px solid #555; text-align:center; font-weight:bold; color:#000; cursor:pointer; display:flex; align-items:flex-end; justify-content:center; padding-bottom:10px; transition:0.2s; border-radius:4px 4px 0 0; box-shadow:0 -5px 10px rgba(0,0,0,0.5);'; btn.innerText = w + 'kg'; btn.style.height = (w + 40) + 'px';
                    btn.onclick = () => {
                        btn.classList.toggle('active'); btn.style.background = btn.classList.contains('active') ? 'linear-gradient(to bottom, var(--apple), #5c8a24)' : 'linear-gradient(to bottom, #ccc, #888)'; btn.style.transform = btn.classList.contains('active') ? 'translateY(-10px)' : 'translateY(0)';
                        let sum = Array.from(sclWrap.children).reduce((acc, el, idx) => acc + (el.classList && el.classList.contains('active') ? p.data[idx-1] : 0), 0);
                        let tilt = ((sum - p.target) / p.target) * 45; balanceNeedle.style.transform = `translateX(-50%) rotate(${Math.max(-45, Math.min(45, tilt))}deg)`;
                        if(sum === p.target) { balanceNeedle.style.borderBottomColor = '#00ff66'; setTimeout(()=>this.winInteractive(), 500); } else { balanceNeedle.style.borderBottomColor = '#ff3333'; }
                    }; sclWrap.appendChild(btn);
                }); innerStage.appendChild(sclWrap); break;
            }

            case 'TIC_TAC_TOE': {
                let msWrap = document.createElement('div'); msWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:10px; background:#111; padding:20px; border-radius:12px; border:2px solid var(--apple); box-shadow:0 10px 30px rgba(140, 198, 63, 0.2);';
                let cells = [];
                let marks = ['', 'X', 'O'];
                for(let i=0; i<9; i++) {
                    let cell = document.createElement('div'); cell.className = 'interactive-element';
                    cell.style.cssText = 'width:80px; height:80px; background:#000; border:2px solid #444; color:#fff; font-size:3rem; font-weight:bold; display:flex; justify-content:center; align-items:center; border-radius:8px; cursor:pointer; user-select:none; transition:0.2s;';
                    cell.dataset.state = 0;
                    cell.onclick = () => {
                        let ns = (parseInt(cell.dataset.state) + 1) % 3;
                        cell.dataset.state = ns;
                        cell.innerText = marks[ns];
                        cell.style.color = ns === 1 ? 'var(--apple)' : (ns === 2 ? '#ff3333' : '#fff');
                    };
                    cells.push(cell); msWrap.appendChild(cell);
                }
                let btn = generateSubmitButton(() => {
                    let m = cells.map(c => marks[parseInt(c.dataset.state)]);
                    let win = false;
                    const lines = [ [0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6] ];
                    for(let line of lines) {
                        if(m[line[0]] !== '' && m[line[0]] === m[line[1]] && m[line[1]] === m[line[2]]) {
                            win = true; break;
                        }
                    }
                    if(win) {
                        cells.forEach(c => { c.style.background = 'var(--apple)'; c.style.color = '#000'; });
                        setTimeout(()=>this.winInteractive(), 800); 
                    } else {
                        this.failRoom();
                    }
                }, 'تأكيد تجاوز الهوست');
                innerStage.append(msWrap, btn); break;
            }

            case 'MINES': {
                let mWrap = document.createElement('div'); mWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:10px; background:#111; padding:20px; border-radius:12px; border:2px solid var(--apple);';
                let roundDisp = document.createElement('h3'); roundDisp.style.cssText = 'color:var(--apple); margin-bottom:15px; font-size:1.5rem;';
                innerStage.appendChild(roundDisp);
                
                this.stageState.round = 1;
                const loadRound = () => {
                    mWrap.innerHTML = '';
                    roundDisp.innerText = `الجولة ${this.stageState.round} من 3`;
                    let mineIndex = Math.floor(Math.random() * 9);
                    let safeClicks = 0;
                    
                    for(let i=0; i<9; i++) {
                        let cell = document.createElement('div'); cell.className = 'interactive-element';
                        cell.style.cssText = 'width:80px; height:80px; background:#222; border:2px solid #555; display:flex; justify-content:center; align-items:center; font-size:2rem; color:#fff; border-radius:8px; cursor:pointer; font-weight:bold;';
                        cell.innerText = i + 1;
                        cell.dataset.clicked = "0";
                        
                        cell.onclick = () => {
                            if(cell.dataset.clicked === "1") return;
                            cell.dataset.clicked = "1";
                            if(i === mineIndex) {
                                cell.style.background = '#ff3333'; cell.innerText = '💣';
                                this.failRoom(); setTimeout(()=>loadRound(), 1000); 
                            } else {
                                cell.style.background = '#00ff66'; cell.style.color = '#000';
                                safeClicks++;
                                if(safeClicks === 8) { 
                                    this.stageState.round++;
                                    if(this.stageState.round > 3) { setTimeout(()=>this.winInteractive(), 500); }
                                    else { setTimeout(()=>loadRound(), 1000); }
                                }
                            }
                        };
                        mWrap.appendChild(cell);
                    }
                };
                innerStage.appendChild(mWrap);
                loadRound();
                break;
            }

            case 'HIDE_BOMB': {
                let setupWrap = document.createElement('div'); setupWrap.style.cssText = 'display:flex; flex-direction:column; gap:15px; width:100%; max-width:400px;';
                let title = document.createElement('h3'); title.innerText = "إعداد القنابل السري"; title.style.color = 'var(--apple)';
                let t1 = document.createElement('input'); t1.type = 'password'; t1.placeholder = 'رقم قنبلة الفريق الأول (1-20)'; t1.style.cssText = 'padding:15px; background:#000; border:2px solid #555; color:#fff; border-radius:6px; font-size:1.2rem; text-align:center;';
                let t2 = document.createElement('input'); t2.type = 'password'; t2.placeholder = 'رقم قنبلة الفريق الثاني (1-20)'; t2.style.cssText = 'padding:15px; background:#000; border:2px solid #555; color:#fff; border-radius:6px; font-size:1.2rem; text-align:center;';
                
                let startBtn = generateSubmitButton(() => {
                    let b1 = parseInt(t1.value); let b2 = parseInt(t2.value);
                    if(b1 >= 1 && b1 <= 20 && b2 >= 1 && b2 <= 20 && b1 !== b2) {
                        setupWrap.style.display = 'none';
                        playGrid(b1, b2);
                    } else { this.showToast('أدخل أرقام صحيحة من 1 إلى 20 ومختلفة عن بعض!', '#ff3333'); }
                }, 'بدء البحث');
                setupWrap.append(title, t1, t2, startBtn);
                innerStage.appendChild(setupWrap);

                const playGrid = (bomb1, bomb2) => {
                    let grid = document.createElement('div'); grid.style.cssText = 'display:grid; grid-template-columns:repeat(5, 70px); gap:10px; background:#111; padding:20px; border-radius:12px; border:2px solid var(--apple);';
                    let safeCount = 0;
                    for(let i=1; i<=20; i++) {
                        let cell = document.createElement('div'); cell.className = 'interactive-element';
                        cell.innerText = i;
                        cell.style.cssText = 'width:70px; height:70px; background:#222; border:2px solid #555; display:flex; justify-content:center; align-items:center; font-size:1.5rem; font-weight:bold; color:#fff; border-radius:8px; cursor:pointer;';
                        cell.onclick = () => {
                            if(i === bomb1 || i === bomb2) {
                                cell.innerText = '💣'; cell.style.background = '#ff3333';
                                this.failRoom(); 
                            } else {
                                cell.innerText = '✅'; cell.style.background = '#003300'; cell.style.color = '#00ff66'; cell.style.borderColor = '#00ff66';
                                cell.style.pointerEvents = 'none';
                                safeCount++;
                                if(safeCount === 18) { setTimeout(()=>this.winInteractive(), 500); } 
                            }
                        };
                        grid.appendChild(cell);
                    }
                    let forceWinBtn = generateSubmitButton(() => { this.winInteractive(); }, 'إنهاء اللعبة (للهوست)');
                    innerStage.append(grid, forceWinBtn);
                }
                break;
            }

            case 'ELEVATOR': {
                let eWrap = document.createElement('div'); eWrap.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:20px; background:#222; padding:30px; border-radius:10px; border:4px solid #555;';
                let eDisplay = document.createElement('div'); eDisplay.style.cssText = 'width:100%; height:50px; background:#000; border:2px solid var(--apple); color:var(--apple); font-family:monospace; font-size:2rem; display:flex; justify-content:center; align-items:center; border-radius:6px; margin-bottom:10px;'; eDisplay.innerText = '---';
                let btnGrid = document.createElement('div'); btnGrid.style.cssText = 'display:grid; grid-template-columns:repeat(2, 60px); gap:15px;';
                let sequence = [];
                for(let i=6; i>=1; i--) { 
                    let btn = document.createElement('button'); btn.className = 'interactive-element';
                    btn.innerText = i; btn.style.cssText = 'width:60px; height:60px; border-radius:50%; background:radial-gradient(circle, #eee, #ccc); border:2px solid #999; font-size:1.5rem; font-weight:bold; cursor:pointer; box-shadow:0 4px 6px rgba(0,0,0,0.5);';
                    btn.onclick = () => {
                        sequence.push(i);
                        eDisplay.innerText = sequence.join(' ');
                        btn.style.background = 'var(--apple)'; setTimeout(()=>btn.style.background = 'radial-gradient(circle, #eee, #ccc)', 300);
                        if(sequence.length === 3) {
                            if(JSON.stringify(sequence) === JSON.stringify(p.ans)) { setTimeout(()=>this.winInteractive(), 500); }
                            else { this.failRoom(); sequence = []; eDisplay.style.color = '#ff3333'; eDisplay.innerText = 'خطأ'; setTimeout(()=>{ eDisplay.style.color = 'var(--apple)'; eDisplay.innerText = '---'; }, 1000); }
                        }
                    };
                    btnGrid.appendChild(btn);
                }
                eWrap.append(eDisplay, btnGrid); innerStage.appendChild(eWrap); break;
            }

            case 'JUGS': {
                let jugWrap = document.createElement('div'); jugWrap.style.cssText = 'display:flex; gap:30px; align-items:flex-end; height:180px; padding-bottom:20px; border-bottom:4px solid #333;';
                let caps = [8, 5, 3]; let vols = [8, 0, 0]; let selected = -1;
                const renderJugs = () => {
                    jugWrap.innerHTML = '';
                    caps.forEach((cap, i) => {
                        let j = document.createElement('div'); j.className = 'interactive-element'; j.style.cssText = 'width:70px; background:rgba(255,255,255,0.1); border:3px solid #666; border-radius:0 0 10px 10px; position:relative; overflow:hidden; cursor:pointer; transition:0.2s;'; j.style.height = (cap * 15 + 50) + 'px'; 
                        if(i === selected) { j.style.borderColor = 'var(--apple)'; j.style.transform = 'translateY(-10px)'; j.style.boxShadow = '0 10px 20px rgba(140, 198, 63, 0.3)'; }
                        let w = document.createElement('div'); w.style.cssText = 'position:absolute; bottom:0; width:100%; background:linear-gradient(to bottom, rgba(0,200,255,0.8), rgba(0,100,255,0.9)); transition:height 0.4s cubic-bezier(0.4, 0, 0.2, 1);'; w.style.height = (vols[i] / cap * 100) + '%';
                        let lbl = document.createElement('div'); lbl.style.cssText = 'position:absolute; width:100%; text-align:center; color:#fff; font-weight:bold; top:10px; z-index:2; font-family:monospace; font-size:1.2rem; text-shadow:0 0 5px #000;'; lbl.innerText = `${vols[i]}/${cap}`;
                        j.append(w, lbl);
                        j.onclick = () => {
                            if(selected === -1) { if(vols[i] > 0) { selected = i; renderJugs(); } } 
                            else { if(selected !== i) { let transfer = Math.min(vols[selected], caps[i] - vols[i]); vols[selected] -= transfer; vols[i] += transfer; } selected = -1; renderJugs(); if(vols.includes(4)) setTimeout(()=>this.winInteractive(), 500); }
                        }; jugWrap.appendChild(j);
                    });
                }; renderJugs(); innerStage.appendChild(jugWrap); break;
            }

            case 'BLIND_MAZE': {
                let bmWrap = document.createElement('div'); bmWrap.style.cssText = 'display:grid; grid-template-columns:repeat(6, 50px); gap:2px; background:#111; padding:5px; border:4px solid #333; border-radius:8px; box-shadow:inset 0 0 20px #000;';
                for(let i=0; i<36; i++) {
                    let c = document.createElement('div'); c.className = 'interactive-element'; c.style.cssText = 'height:50px; background:#050505; cursor:pointer; transition:0.2s; border-radius:2px;';
                    c.onclick = () => {
                        if(p.ans[this.stageState.clicks] === i) { c.style.background = 'var(--apple)'; c.style.boxShadow = '0 0 10px var(--apple)'; this.stageState.clicks++; if(this.stageState.clicks === p.ans.length) setTimeout(()=>this.winInteractive(), 400); } 
                        else { this.failRoom(); setTimeout(() => this.setupStage(), 800); }
                    }; bmWrap.appendChild(c);
                }
                let startMarker = document.createElement('div'); startMarker.innerText = 'START ↓'; startMarker.style.color = '#fff'; startMarker.style.marginBottom = '10px'; let endMarker = document.createElement('div'); endMarker.innerText = 'END ↓'; endMarker.style.color = '#fff'; endMarker.style.marginTop = '10px';
                innerStage.append(startMarker, bmWrap, endMarker); break;
            }

            case 'CRYPTEX': {
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:flex; gap:10px; margin-top:20px; background:#111; padding:20px; border-radius:12px; border:2px solid #333; box-shadow:0 20px 40px rgba(0,0,0,0.8); direction:ltr;'; 
                let startWord = ['E','A','L','I','P','Q','E']; 
                let current = [...startWord]; let alph = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                for(let i=0; i<7; i++) {
                    let col = document.createElement('div'); col.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:8px;';
                    let btnUp = document.createElement('button'); btnUp.className = 'interactive-element'; btnUp.innerText = '▲'; btnUp.style.cssText = 'background:#222; color:var(--apple); border:1px solid #555; cursor:pointer; padding:8px 15px; border-radius:4px; font-size:1.2rem;';
                    let btnDn = document.createElement('button'); btnDn.className = 'interactive-element'; btnDn.innerText = '▼'; btnDn.style.cssText = 'background:#222; color:var(--apple); border:1px solid #555; cursor:pointer; padding:8px 15px; border-radius:4px; font-size:1.2rem;';
                    let disp = document.createElement('div'); disp.style.cssText = 'width:50px; height:60px; background:linear-gradient(to bottom, #d4edda, #a5d6a7); border:2px solid #5c8a24; display:flex; justify-content:center; align-items:center; font-size:2rem; font-weight:bold; color:#155724; font-family:monospace; border-radius:4px; box-shadow:inset 0 5px 10px rgba(0,0,0,0.2);'; disp.innerText = current[i];
                    const shift = (dir) => { let idx = alph.indexOf(current[i]); current[i] = alph[((idx + dir) % 26 + 26) % 26]; disp.innerText = current[i]; };
                    btnUp.onclick = () => shift(1); btnDn.onclick = () => shift(-1);
                    col.append(btnUp, disp, btnDn); wrap.appendChild(col);
                }
                let btn = generateSubmitButton(() => { if(current.join('') === p.ans) this.winInteractive(); else this.failRoom(); }, 'فتح القفل');
                innerStage.append(wrap, btn); break;
            }

            case 'SHARDS': {
                this.stageState.round = 1;
                let poets = [ 
                    { clues: ['مختبر', 'دماء', 'ميامي', 'مسلسل جنائي'], ans: 'دكستر' }, 
                    { clues: ['عبس', 'الفروسية', 'جاهلي', 'عبلة'], ans: 'عنترة' }, 
                    { clues: ['فرنسي', 'ظهير أيسر', 'ميلان', 'لاعب الهلال'], ans: 'ثيو هرنانديز' } 
                ];
                let roundDisp = document.createElement('h3'); roundDisp.style.cssText = 'color:var(--apple); margin-bottom:20px; font-size:1.8rem; border-bottom:2px solid #333; padding-bottom:10px;';
                let mirWrap = document.createElement('div'); mirWrap.style.cssText = 'display:flex; flex-wrap:wrap; width:400px; gap:15px; justify-content:center; margin-bottom:30px;';
                let inp = createInputBlock('اسم الشخصية...', '');
                const loadRound = () => {
                    roundDisp.innerText = `-- الجولة ${this.stageState.round} من 3 --`; mirWrap.innerHTML = ''; inp.value = '';
                    poets[this.stageState.round-1].clues.forEach(clue => {
                        let shard = document.createElement('div'); shard.className = 'shard-btn interactive-element'; shard.style.cssText = 'width:180px; height:80px; background:linear-gradient(135deg, #1a1a1a, #0a0a0a); border:2px solid #444; display:flex; justify-content:center; align-items:center; text-align:center; font-weight:bold; font-size:1.2rem; cursor:pointer; color:transparent; transition:0.3s; clip-path: polygon(10% 0, 100% 10%, 90% 100%, 0 90%); user-select:none; box-shadow:0 10px 20px rgba(0,0,0,0.5);';
                        shard.onclick = () => { shard.style.color = '#000'; shard.innerText = clue; shard.style.background = 'linear-gradient(135deg, var(--apple), #fff)'; shard.style.borderColor = '#fff'; }; mirWrap.appendChild(shard);
                    });
                };
                inp.oninput = () => { if(inp.value.trim() === poets[this.stageState.round-1].ans) { this.stageState.round++; if(this.stageState.round > 3) setTimeout(()=>this.winInteractive(), 500); else setTimeout(()=>loadRound(), 800); } };
                innerStage.lastChild.lastChild.style.display = 'none'; innerStage.insertBefore(roundDisp, innerStage.firstChild); innerStage.insertBefore(mirWrap, innerStage.children[1]); loadRound(); break;
            }

            case 'IMAGE_CHALLENGE': {
                this.stageState.round = 1;
                let images = ['puzzle15_1.jpg', 'puzzle15_2.jpg', 'puzzle15_3.jpg'];
                let answers = ['رسم', 'مجلس التعاون', 'مومباي'];
                
                let roundDisp = document.createElement('h3'); roundDisp.style.cssText = 'color:var(--apple); margin-bottom:15px; font-size:1.5rem;';
                let imgWrap = document.createElement('div');
                imgWrap.style.cssText = 'width:400px; height:400px; border:4px solid var(--apple); border-radius:8px; overflow:hidden; display:flex; justify-content:center; align-items:center; background:#111; box-shadow:0 10px 30px rgba(0,0,0,0.8); margin-bottom:20px;';
                let img = document.createElement('img'); img.style.cssText = 'width:100%; height:100%; object-fit:cover;';
                imgWrap.appendChild(img);
                
                let inp = createInputBlock('أدخل الجواب...', '');
                
                const loadRound = () => {
                    roundDisp.innerText = `الصورة ${this.stageState.round} من 3`;
                    img.src = images[this.stageState.round-1];
                    img.alt = `يرجى إضافة ${images[this.stageState.round-1]}`;
                    inp.value = '';
                };
                
                inp.oninput = () => {
                    if(inp.value.trim() === answers[this.stageState.round-1]) {
                        this.stageState.round++;
                        if(this.stageState.round > 3) setTimeout(()=>this.winInteractive(), 500); else loadRound();
                    }
                };
                
                innerStage.lastChild.lastChild.style.display = 'none'; 
                innerStage.insertBefore(roundDisp, innerStage.firstChild);
                innerStage.insertBefore(imgWrap, innerStage.children[1]);
                loadRound();
                break;
            }

            case 'VIRTUAL_PIANO': {
                let pWrap = document.createElement('div'); pWrap.style.cssText = 'display:flex; position:relative; background:#111; padding:20px; border-radius:12px; border:4px solid #222; box-shadow:0 20px 40px rgba(0,0,0,0.8); height:250px; transition:0.3s;';
                let whiteKeys = []; let seq = [];
                for(let i=0; i<7; i++) {
                    let wk = document.createElement('div'); wk.className = 'interactive-element'; wk.style.cssText = 'width:60px; height:100%; background:linear-gradient(to bottom, #fff, #eee); border:1px solid #ccc; border-radius:0 0 6px 6px; cursor:pointer; box-shadow:inset 0 -5px 5px rgba(0,0,0,0.2); transition:0.1s; display:flex; align-items:flex-end; justify-content:center; padding-bottom:10px; font-weight:bold; color:#555;'; wk.innerText = ['C','D','E','F','G','A','B'][i];
                    wk.onmousedown = () => { 
                        wk.style.background = '#ddd'; wk.style.transform = 'translateY(2px)'; seq.push(i); 
                        if(seq.length === p.ans.length) { 
                            if(JSON.stringify(seq) === JSON.stringify(p.ans)) {
                                pWrap.style.borderColor = '#00ff66';
                                pWrap.style.boxShadow = '0 0 40px #00ff66';
                                setTimeout(()=>this.winInteractive(), 1000); 
                            } else { this.failRoom(); seq = []; } 
                        } 
                    };
                    wk.onmouseup = wk.onmouseleave = () => { wk.style.background = 'linear-gradient(to bottom, #fff, #eee)'; wk.style.transform = 'translateY(0)'; };
                    pWrap.appendChild(wk); whiteKeys.push(wk);
                }
                [1, 2, 4, 5, 6].forEach((pos) => { 
                    let bk = document.createElement('div'); bk.className = 'interactive-element'; bk.style.cssText = `position:absolute; width:40px; height:60%; background:linear-gradient(to bottom, #222, #000); border:1px solid #111; border-radius:0 0 4px 4px; left:${20 + pos*60 - 20}px; top:20px; z-index:2; cursor:pointer; box-shadow:2px 2px 5px rgba(0,0,0,0.5);`;
                    bk.onmousedown = () => { bk.style.background = '#333'; this.failRoom(); seq = []; }; bk.onmouseup = bk.onmouseleave = () => { bk.style.background = 'linear-gradient(to bottom, #222, #000)'; };
                    pWrap.appendChild(bk);
                }); innerStage.appendChild(pWrap); break;
            }

            case 'ARROW_LOCK': {
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:flex; flex-direction:column; gap:15px; width:100%; max-width:400px; align-items:center;';
                let target = [-2, 1, 3, -1]; 
                let state = [0, 0, 0, 0];
                
                let syncDisp = document.createElement('div');
                syncDisp.style.cssText = 'color:var(--apple); font-size:2rem; margin-bottom:10px; font-weight:bold; font-family:monospace;';
                
                const updatePercent = () => {
                    let diff = 0;
                    for(let j=0; j<4; j++) diff += Math.abs(state[j] - target[j]);
                    let percent = Math.floor(100 - (diff / 24 * 100)); 
                    syncDisp.innerText = `التطابق: ${percent}%`;
                };
                updatePercent();
                wrap.appendChild(syncDisp);
                
                for(let i=0; i<4; i++) {
                    let row = document.createElement('div'); row.style.cssText = 'display:flex; align-items:center; justify-content:center; gap:15px;';
                    let btnL = document.createElement('button'); btnL.innerText = '◀'; btnL.style.cssText = 'padding:10px 15px; background:#222; border:1px solid #555; color:var(--apple); cursor:pointer; border-radius:4px;';
                    let btnR = document.createElement('button'); btnR.innerText = '▶'; btnR.style.cssText = 'padding:10px 15px; background:#222; border:1px solid #555; color:var(--apple); cursor:pointer; border-radius:4px;';
                    
                    let track = document.createElement('div'); track.style.cssText = 'width:200px; height:30px; background:#111; position:relative; border-radius:15px; border:2px solid #333;';
                    let block = document.createElement('div'); block.style.cssText = 'width:30px; height:30px; background:var(--apple); position:absolute; left:83px; border-radius:50%; transition:0.2s; top:-2px;'; 
                    track.appendChild(block);
                    
                    btnL.onclick = () => { if(state[i] > -3) state[i]--; block.style.left = (83 + state[i]*25) + 'px'; updatePercent(); };
                    btnR.onclick = () => { if(state[i] < 3) state[i]++; block.style.left = (83 + state[i]*25) + 'px'; updatePercent(); };
                    
                    row.append(btnL, track, btnR); wrap.appendChild(row);
                }
                let check = generateSubmitButton(() => {
                    if(JSON.stringify(state) === JSON.stringify(target)) setTimeout(()=>this.winInteractive(), 500); else this.failRoom();
                }, 'تأكيد الوزن');
                wrap.appendChild(check); innerStage.appendChild(wrap); break;
            }

            case 'STORY_IMAGE': {
                let sWrap = document.createElement('div'); sWrap.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:20px; width:100%; max-width:500px;';
                
                let imgWrap = document.createElement('div'); imgWrap.style.cssText = 'width:100%; height:250px; border:4px solid var(--apple); border-radius:8px; overflow:hidden;';
                let img = document.createElement('img'); img.src = 'puzzle18.jpg'; img.alt = 'يرجى وضع ملف puzzle18.jpg'; img.style.cssText = 'width:100%; height:100%; object-fit:cover;';
                imgWrap.appendChild(img);
                
                let story = document.createElement('div'); story.style.cssText = 'background:#111; padding:20px; border-right:4px solid var(--apple); color:#ccc; font-size:1.3rem; line-height:1.8; font-family:"Traditional Arabic", serif; text-align:right; border-radius:6px;';
                story.innerText = 'تفحص الصورة جيداً واربطها بالقصة التي سردها لك الهوست. المكان أو الشخص الذي تبحث عنه هو كلمة السر.';
                
                sWrap.append(imgWrap, story); innerStage.appendChild(sWrap);
                createInputBlock('أدخل الجواب...', p.ans); break;
            }

            case 'KEYPAD': {
                let kWrap = document.createElement('div'); kWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:15px; background:#111; padding:30px; border-radius:12px; border:2px solid #333; box-shadow:0 20px 40px rgba(0,0,0,0.8);';
                let kDisp = document.createElement('div'); kDisp.style.cssText = 'grid-column:span 3; height:70px; background:#000; border:2px solid var(--apple); color:var(--apple); display:flex; justify-content:center; align-items:center; font-size:2.5rem; font-family:monospace; letter-spacing:15px; margin-bottom:15px; border-radius:6px; box-shadow:inset 0 0 20px rgba(140, 198, 63, 0.2); white-space:nowrap; overflow:hidden; padding-left:15px;';
                kDisp.innerText='_ _ _ _'; kWrap.appendChild(kDisp);
                [1,2,3,4,5,6,7,8,9,'*',0,'#'].forEach((n) => {
                    let btn = document.createElement('div'); btn.className = 'interactive-element'; btn.style.cssText = 'width:80px; height:60px; background:linear-gradient(to bottom, #333, #111); border:1px solid #555; border-radius:6px; display:flex; justify-content:center; align-items:center; color:#fff; font-size:1.8rem; font-weight:bold; cursor:pointer; box-shadow:0 5px 10px rgba(0,0,0,0.5); user-select:none;'; btn.innerText = n;
                    btn.onclick = () => {
                        if(typeof n === 'number') {
                            btn.style.transform='translateY(3px)'; setTimeout(()=>btn.style.transform='translateY(0)', 100);
                            this.stageState.val = (this.stageState.val || '') + n; kDisp.innerText = this.stageState.val.padEnd(p.ans.length,'_');
                            if(this.stageState.val === p.ans) { kDisp.style.color = '#00ff66'; kDisp.style.borderColor = '#00ff66'; setTimeout(()=>this.winInteractive(), 500); } else if(this.stageState.val.length >= p.ans.length) { this.failRoom(); setTimeout(() => this.setupStage(), 800); }
                        }
                    }; kWrap.appendChild(btn);
                }); innerStage.appendChild(kWrap); break;
            }

            case 'EPIC_DETECTIVE': {
                this.stageState.round = 1;
                
                let storyCard = document.createElement('div'); 
                storyCard.style.cssText = 'width:100%; max-width:700px; background:#1a1a1a; padding:30px; border-radius:8px; border-right:6px solid var(--apple); color:#ddd; font-size:1.8rem; line-height:2.2; box-shadow:inset 0 0 30px #000; margin-bottom:20px; font-family:"Traditional Arabic", serif; text-align:right; direction:rtl; transition:0.3s;';
                
                let qTitle = document.createElement('h3'); 
                qTitle.style.cssText = 'color:var(--apple); margin-bottom:15px; font-size:1.8rem; text-align:right; width:100%; max-width:700px; direction:rtl;';
                
                let inputContainer = document.createElement('div'); 
                inputContainer.style.width = '100%';
                
                const loadRound = () => {
                    inputContainer.innerHTML = '';
                    
                    if(this.stageState.round === 1) {
                        storyCard.innerHTML = `<strong>التقرير الأولي:</strong><br>تم العثور على ملف القضية الأسود مقفلاً. للبدء في التحقيق، عليك العثور على الكود السري المكون من 4 أحرف إنجليزية. <strong>(اذهب إلى رومات الديسكورد وابحث عن الكود المخفي في رسالة الدعم الفني).</strong>`;
                        qTitle.innerText = `الراوند 1: فك تشفير الملف.`;
                        let inp = createInputBlock('أدخل الكود (مثال: ECHO)...', 'ECHO'); 
                        inp.oninput = () => { if(inp.value.trim().toUpperCase() === 'ECHO') { this.stageState.round++; loadRound(); } };
                        innerStage.lastChild.lastChild.style.display = 'none'; inputContainer.appendChild(innerStage.lastChild);
                    }
                    else if(this.stageState.round === 2) {
                        storyCard.innerHTML = `<strong>شهادة الحارس:</strong><br>"كنت أقف في حديقة الفندق ليلاً، كانت السماء صافية تماماً والـ<span class="case-word interactive-element" data-ans="1">نجوم</span> ساطعة، فجأة سمعت صراخاً، ركضت للداخل وتركت مظلتي التي كنت أحتمي بها من الـ<span class="case-word interactive-element" data-ans="1">مطر</span> الغزير بالخارج. وعندما دخلت الغرفة كانت <span class="case-word interactive-element" data-ans="0">مظلمة</span>."`;
                        qTitle.innerText = `الراوند 2: هناك تناقض مستحيل في الشهادة. اضغط (Click) على الكلمتين المتناقضتين بالظبط.`;
                        
                        let selectedWords = new Set();
                        storyCard.querySelectorAll('.case-word').forEach((el, index) => {
                            el.style.cssText = 'color:var(--apple); cursor:pointer; text-decoration:underline dashed #555; padding:0 5px; font-size: 2rem; font-weight:bold;'; 
                            el.onclick = () => {
                                if(selectedWords.has(index)) { selectedWords.delete(index); el.style.background = 'transparent'; el.style.color = 'var(--apple)'; }
                                else { selectedWords.add(index); el.style.background = 'var(--apple)'; el.style.color = '#000'; }
                                
                                if(selectedWords.size === 2) {
                                    if(selectedWords.has(0) && selectedWords.has(1)) { this.stageState.round++; loadRound(); } 
                                    else { this.failRoom(); selectedWords.clear(); storyCard.querySelectorAll('.case-word').forEach(w => { w.style.background = 'transparent'; w.style.color = 'var(--apple)'; }); }
                                }
                            };
                        });
                    }
                    else if(this.stageState.round === 3) {
                        storyCard.innerHTML = `<strong>الاستجواب:</strong><br>3 مشتبه بهم: (أحمد، خالد، سعد).<br>- أحمد يقول: "سعد هو القاتل".<br>- خالد يقول: "أنا لم أقتل أحداً".<br>- سعد يقول: "أحمد يكذب".<br><br><strong>ملاحظة:</strong> واحد فقط من الثلاثة يقول الحقيقة!`;
                        qTitle.innerText = `الراوند 3: استنتج من هو القاتل؟`;
                        let btnWrap = document.createElement('div'); btnWrap.style.cssText = 'display:flex; gap:15px; justify-content:center; width:100%; direction:rtl;';
                        ['أحمد', 'خالد', 'سعد'].forEach((suspect, i) => {
                            let btn = document.createElement('button'); btn.className = 'interactive-element'; btn.innerText = suspect; btn.style.cssText = 'padding:15px 30px; background:#222; color:var(--apple); border:2px solid #555; border-radius:6px; cursor:pointer; font-weight:bold; font-size:1.5rem;';
                            btn.onclick = () => { if(i === 1) { this.stageState.round++; loadRound(); } else { this.failRoom(); } };
                            btnWrap.appendChild(btn);
                        });
                        inputContainer.appendChild(btnWrap);
                    }
                    else if(this.stageState.round === 4) {
                        storyCard.innerHTML = `<strong>الرسالة المشفرة:</strong><br>وجدنا في جيب القاتل (خالد) ملاحظة تقول: "الغرفة رقم 10110". هذا الرقم بنظام الباينري (الثنائي).`;
                        qTitle.innerText = `الراوند 4: حول الرقم الثنائي إلى عشري لمعرفة رقم الغرفة الصحيح.`;
                        let inp = createInputBlock('أدخل رقم الغرفة...', '22'); 
                        inp.oninput = () => { if(inp.value.trim() === '22' || inp.value.trim() === '٢٢') { this.stageState.round++; loadRound(); } };
                        innerStage.lastChild.lastChild.style.display = 'none'; inputContainer.appendChild(innerStage.lastChild);
                    }
                    else if(this.stageState.round === 5) {
                        storyCard.innerHTML = `<strong>إغلاق القضية:</strong><br>اكتملت الأدلة، القاتل هو خالد، في الغرفة رقم 22، والدافع مخفي في اسم اللعبة التي تلعبونها الآن.`;
                        qTitle.innerText = `الراوند 5 (الأخير): أدخل الرمز النهائي الـ (MASTER PASSWORD).`;
                        let inp = createInputBlock('MASTER PASSWORD...', 'SOLAR');
                        inp.oninput = () => { if(inp.value.trim().toUpperCase() === 'SOLAR') { setTimeout(()=>this.winInteractive(), 500); } };
                        innerStage.lastChild.lastChild.style.display = 'none'; inputContainer.appendChild(innerStage.lastChild);
                    }
                };
                
                innerStage.append(qTitle, storyCard, inputContainer);
                loadRound(); break;
            }

            default:
                let defaultMsg = document.createElement('div'); defaultMsg.style.cssText = "color:var(--apple); font-family:monospace; font-size:1.5rem;"; defaultMsg.innerText = "Error: Protocol Missing"; innerStage.appendChild(defaultMsg); break;
        }
    }

    winInteractive() {
        this.clearTimers();
        this.stageState.playing = false;
        
        document.getElementById('interactive-stage-container').classList.add('hidden');
        document.getElementById('puzzle-desc').innerText = this.activeGate.txtQ;
        document.getElementById('text-stage').classList.remove('hidden');
        document.getElementById('input-area').classList.remove('hidden');
        
        setTimeout(() => document.getElementById('user-input').focus(), 100);
    }

    checkResult() {
        let answerInput = document.getElementById('user-input').value.trim();
        
        if (answerInput === this.activeGate.txtA) {
            this.solvedGates.add(this.activeGate.id);
            this.showToast('تم اختراق الغرفة بنجاح!', '#00ff66');
            this.returnToLobby();
        } else {
            this.failRoom();
        }
    }
    
    failRoom() { 
        this.triggerVisualGlitch(); 
    }
    
    adminInstantSolveGate() {
        if(!this.activeGate) return;
        this.solvedGates.add(this.activeGate.id);
        this.showToast('تم تخطي الغرفة!', '#00ff66'); 
        this.returnToLobby();
    }

    returnToLobby() { 
        this.clearTimers();
        this.stageState.playing = false;
        this.switchScreen('lobby'); 
        this.renderLobby(); 
    }
}

const game = new SolarGamesEngine();
