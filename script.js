class SolarGamesEngine {
    constructor() {
        this.coins = 0; 
        this.globalTime = 90 * 60; 
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
    
    showToast(msg, color = 'var(--gold)') {
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
            if(e.target.tagName==='BUTTON' || e.target.classList.contains('interactive-element')) { 
                this.initAudio(); this.playSound('click'); 
            } 
        }); 
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
            
            if(i===1) { m.uiType = 'WIRES'; m.desc="اقطع 3 أسلاك محددة."; m.data=['#D4AF37','#ff3333','#333','#fff','#D4AF37','#00ccff','#333','#ff3333']; m.ans=[2,5,7]; m.hint="💡 تفاعلي: الاحمر، اسود، ازرق. | 📝 كتابي: يعتم كلما زاد."; }
            else if(i===2) { m.uiType = 'SIMON'; m.desc="الذاكرة البصرية: تتبع الأنماط المضيئة وكررها (3 جولات)."; m.data=4; m.hint="💡 تفاعلي: ركز وكرر الترتيب. | 📝 كتابي: يذوب في الحرارة."; }
            else if(i===3) { m.uiType = 'MASTERMIND'; m.desc="الاستنتاج: أدخل 4 أرقام. (أخضر=صحيح، برتقالي=مكان خطأ، أحمر=غير موجود)."; m.ans=[3,7,1,9]; m.hint="💡 تفاعلي: الكود هو 3**9. | 📝 كتابي: لا يمكنك البوح به."; }
            else if(i===4) { m.uiType = 'MATCH'; m.desc="التطابق: اقلب البطاقات وطابق 10 أزواج."; m.data=['🪐','☄️','🌑','🔭','🛸','🛰️','🌌','🌠','🚀','👨‍🚀']; m.hint="💡 تفاعلي: احفظ الأماكن. | 📝 كتابي: يزيد ولا ينقص."; }
            else if(i===5) { m.uiType = 'COMPASS'; m.desc="توجيه البوصلة: اضبط الزوايا الثلاث لتتجه نحو المسار المخفي."; m.ans=[135, 225, 45]; m.hint="💡 تفاعلي: أسفل، أسفل يمين، أعلى. | 📝 كتابي: يرتد لك من الجدار."; }
            else if(i===6) { m.uiType = 'SCALES'; m.desc="الميزان: قم بتفعيل الأوزان الصحيحة ليصل المجموع إلى 150 بالضبط."; m.data=[50,70,30,80,20]; m.target=150; m.hint="💡 تفاعلي: 70 + 80. | 📝 كتابي: يأتي غداً."; }
            else if(i===7) { m.uiType = 'MAGIC_SQUARE'; m.desc="المربع السحري: أدخل الأرقام من 1 إلى 9 في الشبكة بحيث يكون مجموع كل صف وعمود يساوي 15."; m.hint="💡 تفاعلي: الرقم 5 في المنتصف. | 📝 كتابي: تقطعه لتفي به."; }
            else if(i===8) { m.uiType = 'SLIDER'; m.desc="اللوحة المكسورة: رتب القطع الخشبية المبعثرة بالترتيب التصاعدي."; m.hint="💡 تفاعلي: رتبها من 1 إلى 8. | 📝 كتابي: لغته السكوت."; }
            
            // الباب 9 المعقد (الأسلاك العشرة)
            else if(i===9) { m.uiType = 'HARDCORE_WIRES'; m.desc="لوحة التحكم المعقدة: 10 أسلاك أمامك. عليك توصيل 5 أسلاك وقطع 5 أسلاك أخرى بدقة متناهية لتجاوز النظام."; m.hint="💡 تفاعلي: وصل (الأزرق، الأخضر، الأسود، البنفسجي، السماوي)، واقطع الباقي. | 📝 كتابي: قشرتها هشة."; }
            
            else if(i===10) { m.uiType = 'PATTERN_LOCK'; m.desc="القفل النمطي: اضغط على النقاط بالتسلسل الصحيح لرسم رمز الدخول (حرف Z)."; m.ans=[0,1,2,4,6,7,8]; m.hint="💡 تفاعلي: ارسم حرف Z بالإنجليزية. | 📝 كتابي: تنشفك وتتبلل."; }
            else if(i===11) { m.uiType = 'JUGS'; m.desc="الكيمياء: انقل السوائل بين الدوارق (8 لتر، 5 لتر، 3 لتر) لتحصل على 4 لتر."; m.hint="💡 تفاعلي: املأ الـ 5 ثم صب في الـ 3. | 📝 كتابي: ترسم العالم."; }
            else if(i===12) { m.uiType = 'BLIND_MAZE'; m.desc="المتاهة العمياء: هناك مسار واحد آمن في الشبكة. خطأ واحد يعيدك للصفر."; m.ans=[0,6,12,13,14,20,26,32,33,34,35]; m.hint="💡 تفاعلي: انزل 3 مربعات ثم يمين. | 📝 كتابي: صيفي ولذيذ."; }
            else if(i===13) { m.uiType = 'CRYPTEX'; m.desc="شفرة قيصر: حرك الأحرف السبعة للوصول لكلمة (ECLIPSE)."; m.ans='ECLIPSE'; m.hint="💡 تفاعلي: الكلمة هي ECLIPSE. | 📝 كتابي: يثبت الأشياء."; }
            else if(i===14) { m.uiType = 'SHARDS'; m.desc="من أنا (3 جولات): اكشف الشظايا لتعرف اسم الشاعر."; m.hint="💡 تفاعلي: المتنبي، عنترة، البدر. | 📝 كتابي: أداة الكتابة."; }
            else if(i===15) { m.uiType = 'CONSTELLATION'; m.desc="كوكبة النجوم: 5 نجوم في السماء، اضغط عليها بالترتيب الصحيح لفتح البوابة."; m.ans=[2, 4, 0, 3, 1]; m.hint="💡 تفاعلي: ابدأ من النجمة السفلية يمين. | 📝 كتابي: تدل على الشمال."; }
            else if(i===16) { m.uiType = 'VIRTUAL_PIANO'; m.desc="البيانو الكلاسيكي: اعزف النوتات الأربعة السرية بالترتيب لفتح القفل الصوتي."; m.ans=[0, 2, 4, 0]; m.hint="💡 تفاعلي: دو، مي، صول، دو (C, E, G, C). | 📝 كتابي: لا تُرى."; }
            else if(i===17) { m.uiType = 'TIMELINE'; m.desc="تايم لاين المونتاج: اسحب مسارات الفيديو والصوت لتتزامن بنسبة 100%."; m.hint="💡 تفاعلي: المسار الأول 15، الثاني 45. | 📝 كتابي: تخاف من الماء."; }
            else if(i===18) { m.uiType = 'DNA'; m.desc="الحمض النووي: اضغط لتغيير القواعد، طابق A مع T، و C مع G للتركيبة المخفية."; m.ans='TGCA'; m.hint="💡 تفاعلي: الحل هو TGCA. | 📝 كتابي: تكبر كلما أخذت منها."; }
            else if(i===19) { m.uiType = 'KEYPAD'; m.desc="اللوحة الرقمية: أدخل الرمز السري المتناثر في الغرفة."; m.ans='1936'; m.hint="💡 تفاعلي: الكود هو 1936. | 📝 كتابي: ينادونك به."; }
            
            // الباب 20 الملحمي (القضية الكبرى)
            else if(i===20) { m.uiType = 'EPIC_DETECTIVE'; m.desc="ملف القضية الأسود (5 مراحل): ستستغرق هذه القضية منك وقتاً طويلاً. ابحث عن الأدلة داخل اللعبة، وخارجها في رومات السيرفر، لتعرف القاتل الحقيقي."; m.hint="💡 تفاعلي: اقرأ النصوص بتركيز شديد وابحث في الديسكورد. | 📝 كتابي: تتركها وراءك."; }

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
        
        let displays = ['global-timer-display', 'market-time', 'puzzle-global-timer'];
        displays.forEach(id => {
            let el = document.getElementById(id);
            if(el) {
                el.innerText = `${h}:${m}:${s}`;
                if(id !== 'market-time') el.style.color = this.timeFrozen ? '#00ccff' : '#fff';
            }
        });
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

    toggleMarket(show) {
        this.playSound('click'); 
        const m = document.getElementById('market-modal');
        if(show) { 
            m.classList.remove('hidden'); 
            this.updateCoinsUI(); 
            this.updateGlobalTimerUI(); 
        } else {
            m.classList.add('hidden');
        }
    }
    
    buyHint(type) {
        this.playSound('click');
        if(!this.activeGate) { this.showToast('يجب أن تكون داخل روم!', '#ff3333'); return; }
        
        if(type === 'coins') {
            if(this.coins >= 60) { 
                this.coins -= 60; 
                this.showToast('تم فك التشفير بنجاح!'); 
                this.displayHint(); 
            } else { this.showToast('بيانات غير كافية!', '#ff3333'); }
        } else if (type === 'time') {
            if(this.globalTime > 300) { 
                this.globalTime -= 300; 
                this.showToast('تم الشراء بخصم 5 دقائق!'); 
                this.displayHint(); 
            } else { this.showToast('الوقت لا يكفي!', '#ff3333'); }
        }
        this.updateCoinsUI(); 
        this.updateGlobalTimerUI();
    }

    buyFreeze() {
        this.playSound('click');
        if(this.coins >= 40) {
            if(this.timeFrozen) { this.showToast('مجمد مسبقاً!', '#ff3333'); return; }
            this.coins -= 40; 
            this.timeFrozen = true; 
            this.updateGlobalTimerUI(); 
            this.showToast('❄️ تم تجميد الحماية!', '#00ccff');
            
            setTimeout(() => { 
                this.timeFrozen = false; 
                this.updateGlobalTimerUI(); 
                this.showToast('انتهى التجميد!', '#ff3333'); 
            }, 120000); 
            
        } else { this.showToast('بيانات غير كافية!', '#ff3333'); }
        this.updateCoinsUI();
    }

    displayHint() {
        this.toggleMarket(false);
        const hd = document.getElementById('hint-display');
        const hintParts = this.activeGate.hint.split('|');
        
        let interactiveHint = hintParts[0] ? hintParts[0].replace('💡 تفاعلي:', '').trim() : 'لا يوجد تلميح للعبة.';
        let textHint = hintParts[1] ? hintParts[1].replace('📝 كتابي:', '').trim() : 'لا يوجد تلميح للغز.';
        
        hd.innerHTML = `
            <div style="border-bottom:1px solid var(--gold); padding-bottom:10px; margin-bottom:10px; color:var(--gold);">
                <strong style="color:#fff;">تلميح اللعبة التفاعلية:</strong><br>${interactiveHint}
            </div>
            <div style="color:var(--gold);">
                <strong style="color:#fff;">تلميح اللغز الكتابي:</strong><br>${textHint}
            </div>
        `;
        hd.classList.remove('hidden');
    }

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
        
        for(let i=1; i<=20; i++) {
            let btn = document.createElement('div'); 
            let isSolved = this.solvedGates.has(i);
            let isLocked = i !== 1 && !this.solvedGates.has(i - 1); 
            let isNext = !isSolved && !isLocked; 
            
            btn.className = `channel-card ${isSolved ? 'solved' : ''} ${isLocked ? 'locked' : ''} ${isNext ? 'unlocked-next' : ''}`;
            btn.classList.add('interactive-element');
            
            let info = document.createElement('div'); 
            info.className = 'channel-info';
            
            let title = document.createElement('h3'); 
            title.innerText = `CHANNEL-${i.toString().padStart(2, '0')}`;
            
            let status = document.createElement('span'); 
            status.className = 'channel-status';
            
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
        
        const hd = document.getElementById('hint-display');
        hd.classList.add('hidden');
        hd.innerHTML = '';
        
        document.getElementById('puzzle-title').innerHTML = `<span style="color:#aaa;">🔊</span> # CHANNEL-${id.toString().padStart(2,'0')}`;

        this.setupStage(); 
        this.switchScreen('puzzle');
    }

    clearTimers() {
        if(this.stageState && this.stageState.timer) {
            clearInterval(this.stageState.timer);
            clearTimeout(this.stageState.timer);
            this.stageState.timer = null;
        }
        if(this.stageState && this.stageState.animFrame) {
            cancelAnimationFrame(this.stageState.animFrame);
            this.stageState.animFrame = null;
        }
    }

    setupStage() {
        this.clearTimers();
        const p = this.activeGate;
        document.getElementById('int-desc').innerText = p.desc;
        
        const stage = document.getElementById('interactive-stage');
        stage.innerHTML = `<div class="lux-panel" id="lux-inner-stage" style="width:100%; min-height:400px; background:#050505; border:2px solid #D4AF37; border-radius:8px; padding:20px; box-shadow:inset 0 0 20px #000; position:relative; overflow:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center;"></div>`;
        const innerStage = document.getElementById('lux-inner-stage');
        
        this.stageState = { clicks: 0, arr: [], val: 0, attempts: 0, playing: true, timer: null, animFrame: null };

        const generateSubmitButton = (callback, text = 'تأكيد (Execute)') => {
            let btn = document.createElement('button'); 
            btn.className = 'btn-execute interactive-element'; 
            btn.innerText = text; 
            btn.style.cssText = 'background: linear-gradient(180deg, #222, #000); color: var(--gold); border: 2px solid var(--gold); padding: 15px 30px; font-size: 1.2rem; font-weight: bold; border-radius: 6px; cursor: pointer; transition: 0.3s; margin-top:20px; width: 100%; max-width: 400px; z-index:10;';
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
            inp.style.cssText = 'background: #000; border: 2px solid var(--gold); color: var(--gold); padding: 15px; font-size: 1.8rem; text-align: center; width: 100%; max-width: 400px; outline: none; box-shadow: inset 0 0 20px rgba(212,175,55,0.2); letter-spacing: 2px; font-family: monospace; border-radius: 8px; margin-top:20px;';
            
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
                let smGrid = document.createElement('div'); smGrid.style.cssText = 'display:grid; grid-template-columns:repeat(2, 100px); gap:15px; justify-content:center;';
                let colors = ['#ff3333', '#00ff66', '#00ccff', '#D4AF37']; let boxes = [];
                for(let i=0; i<4; i++) {
                    let b = document.createElement('div'); b.className = 'interactive-element';
                    b.style.cssText = `width:100px; height:100px; background:#111; border:4px solid #333; border-radius:12px; cursor:pointer; transition:0.1s; box-shadow:inset 0 0 15px #000;`;
                    b.onclick = () => {
                        if(!this.stageState.playing) return;
                        if(this.stageState.sequence[this.stageState.clicks] === i) {
                            b.style.background = colors[i]; b.style.borderColor = '#fff'; b.style.boxShadow = `0 0 30px ${colors[i]}`; 
                            setTimeout(()=>{ b.style.background = '#111'; b.style.borderColor = '#333'; b.style.boxShadow = 'inset 0 0 15px #000'; }, 200);
                            this.stageState.clicks++;
                            if(this.stageState.clicks === this.stageState.sequence.length) {
                                this.stageState.round++;
                                if(this.stageState.round > 3) setTimeout(() => this.winInteractive(), 500); else setTimeout(()=>playRound(), 1000);
                            }
                        } else { this.failRoom(); setTimeout(() => this.setupStage(), 800); }
                    }; smGrid.appendChild(b); boxes.push(b);
                } innerStage.appendChild(smGrid); this.stageState.round = 1;
                const playRound = () => {
                    this.stageState.playing = false; this.stageState.clicks = 0;
                    let count = this.stageState.round === 1 ? 4 : (this.stageState.round === 2 ? 6 : 8);
                    this.stageState.sequence = Array.from({length: count}, () => Math.floor(Math.random() * 4));
                    let step = 0;
                    this.stageState.timer = setInterval(() => {
                        if(step < count) {
                            let idx = this.stageState.sequence[step];
                            boxes[idx].style.background = colors[idx]; boxes[idx].style.borderColor = '#fff'; boxes[idx].style.boxShadow = `0 0 30px ${colors[idx]}`; this.playSound('click');
                            setTimeout(()=> { boxes[idx].style.background = '#111'; boxes[idx].style.borderColor = '#333'; boxes[idx].style.boxShadow = 'inset 0 0 15px #000'; }, 300);
                            step++;
                        } else { clearInterval(this.stageState.timer); this.stageState.playing = true; }
                    }, 600);
                }; setTimeout(()=>playRound(), 800); break;
            }

            case 'MASTERMIND': {
                let container = document.createElement('div'); container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap: 15px; width:100%; max-width:400px;';
                let inputs = document.createElement('div'); inputs.style.cssText = 'display:flex; gap:15px; justify-content:center; margin-bottom:10px;';
                let mboxes = [];
                for(let i=0; i<4; i++) { 
                    let inp = document.createElement('input'); inp.type='number'; inp.className = 'interactive-element';
                    inp.style.cssText = 'width:60px; height:70px; background:#000; border:2px solid var(--gold); color:var(--gold); font-size:2.5rem; text-align:center; border-radius:8px; outline:none; font-family:monospace; box-shadow:inset 0 0 15px rgba(212,175,55,0.2);'; 
                    inp.maxLength=1; inputs.appendChild(inp); mboxes.push(inp); 
                }
                let historyWrap = document.createElement('div');
                historyWrap.style.cssText = 'display:flex; flex-direction:column; gap:8px; width:100%; height:160px; overflow-y:auto; background:#111; padding:10px; border-radius:8px; border:2px solid #333;';
                let btn = generateSubmitButton(() => {
                    let guess = mboxes.map(b => parseInt(b.value));
                    if(guess.some(isNaN)) return;
                    this.stageState.attempts++;
                    let tempAns = [...p.ans]; let tempGuess = [...guess]; let pegs = [];
                    for(let i=0; i<4; i++) { if(tempGuess[i] === tempAns[i]) { pegs.push('#00ff66'); tempAns[i]=null; tempGuess[i]=-1; } }
                    for(let i=0; i<4; i++) { if(tempGuess[i] !== -1 && tempAns.includes(tempGuess[i])) { pegs.push('#ffa500'); tempAns[tempAns.indexOf(tempGuess[i])]=null; } }
                    while(pegs.length < 4) pegs.push('#ff3333'); 
                    let hRow = document.createElement('div'); hRow.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:8px 15px; background:#222; border-radius:6px; border:1px solid #444;';
                    let hNums = document.createElement('div'); hNums.innerText = guess.join(' '); hNums.style.cssText = 'color:#fff; font-size:1.5rem; font-family:monospace; letter-spacing:5px;';
                    let hPegs = document.createElement('div'); hPegs.style.cssText = 'display:flex; gap:8px;';
                    pegs.forEach(c => { let pg = document.createElement('div'); pg.style.cssText = `width:18px; height:18px; border-radius:50%; background:${c}; border:1px solid #111; box-shadow:0 0 5px ${c};`; hPegs.appendChild(pg); });
                    hRow.append(hNums, hPegs); historyWrap.prepend(hRow); mboxes.forEach(b => b.value = '');
                    if(pegs.every(c=>c==='#00ff66') && pegs.length===4) { setTimeout(()=>this.winInteractive(), 500); } else if (this.stageState.attempts >= 8) { this.failRoom(); setTimeout(()=>this.setupStage(), 1000); }
                }, 'فحص الكود');
                container.append(inputs, historyWrap, btn); innerStage.appendChild(container); break;
            }

            case 'MATCH': {
                let crdGrid = document.createElement('div'); crdGrid.style.cssText = 'display:grid; grid-template-columns:repeat(5, 60px); gap:10px; justify-content:center; perspective:1000px;';
                let symbols = [...p.data, ...p.data].sort(() => Math.random() - 0.5); let flipped = [];
                symbols.forEach((sym) => {
                    let card = document.createElement('div'); card.className = 'interactive-element'; card.style.cssText = 'width:60px; height:60px; perspective:1000px; cursor:pointer; position:relative;';
                    let inner = document.createElement('div'); inner.style.cssText = 'width:100%; height:100%; transition:transform 0.4s; transform-style:preserve-3d; position:absolute;';
                    let front = document.createElement('div'); front.style.cssText = 'width:100%; height:100%; position:absolute; backface-visibility:hidden; background:#111; border:2px solid #444; border-radius:6px;';
                    let back = document.createElement('div'); back.style.cssText = 'width:100%; height:100%; position:absolute; backface-visibility:hidden; background:var(--gold); transform:rotateY(180deg); display:flex; justify-content:center; align-items:center; font-size:25px; border-radius:6px; color:#000; border:2px solid #fff;'; back.innerText = sym;
                    inner.append(front, back); card.appendChild(inner);
                    card.onclick = () => {
                        if(inner.style.transform === 'rotateY(180deg)' || flipped.length >= 2) return;
                        inner.style.transform = 'rotateY(180deg)'; flipped.push({c:inner, s:sym});
                        if(flipped.length === 2) {
                            setTimeout(() => {
                                if(flipped[0].s === flipped[1].s) { this.stageState.clicks += 2; if(this.stageState.clicks === 20) this.winInteractive(); } else { flipped[0].c.style.transform = 'rotateY(0deg)'; flipped[1].c.style.transform = 'rotateY(0deg)'; }
                                flipped = [];
                            }, 600);
                        }
                    }; crdGrid.appendChild(card);
                }); innerStage.appendChild(crdGrid); break;
            }

            case 'COMPASS': { 
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:flex; gap:30px;'; let angles = [0, 0, 0];
                for(let i=0; i<3; i++) {
                    let cmp = document.createElement('div'); cmp.className = 'interactive-element'; cmp.style.cssText = 'width:100px; height:100px; border-radius:50%; background:radial-gradient(circle, #222, #000); border:4px solid var(--gold); position:relative; display:flex; justify-content:center; align-items:center; cursor:pointer; transition:transform 0.3s; box-shadow:0 0 20px rgba(212,175,55,0.2);';
                    let ndl = document.createElement('div'); ndl.style.cssText = 'width:4px; height:80px; background:linear-gradient(to bottom, #ff3333 50%, #fff 50%); position:absolute; border-radius:2px;';
                    let center = document.createElement('div'); center.style.cssText = 'width:12px; height:12px; background:var(--gold); border-radius:50%; z-index:2;';
                    cmp.append(ndl, center);
                    cmp.onclick = () => { angles[i] = (angles[i] + 45) % 360; cmp.style.transform = `rotate(${angles[i]}deg)`; if(angles[0]===p.ans[0] && angles[1]===p.ans[1] && angles[2]===p.ans[2]) { setTimeout(()=>this.winInteractive(), 500); } };
                    wrap.appendChild(cmp);
                } innerStage.appendChild(wrap); break;
            }

            case 'SCALES': {
                let sclWrap = document.createElement('div'); sclWrap.style.cssText = 'display:flex; gap:20px; align-items:flex-end; height:150px; border-bottom: 4px solid var(--gold); padding-bottom:10px; width: 100%; max-width: 500px; justify-content:center; margin-top:50px; position:relative;';
                let balanceNeedle = document.createElement('div'); balanceNeedle.style.cssText = 'position:absolute; bottom:-20px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:10px solid transparent; border-right:10px solid transparent; border-bottom:15px solid #ff3333; transition:transform 0.3s;';
                sclWrap.appendChild(balanceNeedle);
                p.data.forEach((w) => {
                    let btn = document.createElement('div'); btn.className = 'interactive-element'; btn.style.cssText = 'width:60px; background:linear-gradient(to bottom, #ccc, #888); border:2px solid #555; text-align:center; font-weight:bold; color:#000; cursor:pointer; display:flex; align-items:flex-end; justify-content:center; padding-bottom:10px; transition:0.2s; border-radius:4px 4px 0 0; box-shadow:0 -5px 10px rgba(0,0,0,0.5);'; btn.innerText = w + 'kg'; btn.style.height = (w + 40) + 'px';
                    btn.onclick = () => {
                        btn.classList.toggle('active'); btn.style.background = btn.classList.contains('active') ? 'linear-gradient(to bottom, var(--gold), #8a7322)' : 'linear-gradient(to bottom, #ccc, #888)'; btn.style.transform = btn.classList.contains('active') ? 'translateY(-10px)' : 'translateY(0)';
                        let sum = Array.from(sclWrap.children).reduce((acc, el, idx) => acc + (el.classList && el.classList.contains('active') ? p.data[idx-1] : 0), 0);
                        let tilt = ((sum - p.target) / p.target) * 45; balanceNeedle.style.transform = `translateX(-50%) rotate(${Math.max(-45, Math.min(45, tilt))}deg)`;
                        if(sum === p.target) { balanceNeedle.style.borderBottomColor = '#00ff66'; setTimeout(()=>this.winInteractive(), 500); } else { balanceNeedle.style.borderBottomColor = '#ff3333'; }
                    }; sclWrap.appendChild(btn);
                }); innerStage.appendChild(sclWrap); break;
            }

            case 'MAGIC_SQUARE': {
                let msWrap = document.createElement('div'); msWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:10px; background:#111; padding:20px; border-radius:12px; border:2px solid var(--gold); box-shadow:0 10px 30px rgba(212,175,55,0.2);';
                let inputs = [];
                for(let i=0; i<9; i++) {
                    let inp = document.createElement('input'); inp.type = 'number'; inp.className = 'interactive-element';
                    inp.style.cssText = 'width:80px; height:80px; background:#000; border:2px solid #444; color:#fff; font-size:2.5rem; text-align:center; border-radius:8px; outline:none; transition:0.2s;';
                    inp.onfocus = () => inp.style.borderColor = 'var(--gold)'; inp.onblur = () => inp.style.borderColor = '#444';
                    inputs.push(inp); msWrap.appendChild(inp);
                }
                let btn = generateSubmitButton(() => {
                    let vals = inputs.map(inp => parseInt(inp.value));
                    if(vals.includes(NaN) || new Set(vals).size !== 9 || vals.some(v => v < 1 || v > 9)) { this.failRoom(); return; }
                    let lines = [ [0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6] ];
                    let win = lines.every(line => (vals[line[0]] + vals[line[1]] + vals[line[2]]) === 15);
                    if(win) { inputs.forEach(inp => { inp.style.background = 'var(--gold)'; inp.style.color = '#000'; }); setTimeout(()=>this.winInteractive(), 800); } else this.failRoom();
                }, 'تأكيد التوازن');
                innerStage.append(msWrap, btn); break;
            }

            case 'SLIDER': {
                let pzWrap = document.createElement('div'); pzWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:4px; background:#222; padding:8px; border:2px solid #555; border-radius:6px; box-shadow:0 15px 25px rgba(0,0,0,0.9);';
                let tiles = [1,2,3,4,5,6,7,0,8]; 
                const renderPuzzle = () => {
                    pzWrap.innerHTML = '';
                    tiles.forEach((t, i) => {
                        let cell = document.createElement('div'); cell.className = 'interactive-element';
                        if(t === 0) { cell.style.cssText = 'width:80px; height:80px; background:transparent; border:1px dashed #444; border-radius:4px;'; } 
                        else { cell.style.cssText = 'width:80px; height:80px; background:linear-gradient(135deg, var(--gold), #8a7322); display:flex; justify-content:center; align-items:center; font-size:2.5rem; font-weight:bold; color:#000; cursor:pointer; border-radius:4px; box-shadow:inset 0 0 10px rgba(0,0,0,0.3); transition:0.1s; user-select:none; border:1px solid #fff;'; cell.innerText = t; }
                        cell.onclick = () => {
                            let emptyIdx = tiles.indexOf(0); let validMoves = [emptyIdx-1, emptyIdx+1, emptyIdx-3, emptyIdx+3];
                            if(emptyIdx%3 === 0 && i === emptyIdx-1) return; if(emptyIdx%3 === 2 && i === emptyIdx+1) return;
                            if(validMoves.includes(i)) { tiles[emptyIdx] = t; tiles[i] = 0; renderPuzzle(); if(tiles.join('') === '123456780') setTimeout(()=>this.winInteractive(), 400); }
                        }; pzWrap.appendChild(cell);
                    });
                }; renderPuzzle(); innerStage.appendChild(pzWrap); break;
            }

            // --- الباب 9: الأسلاك الـ 10 المعقدة ---
            case 'HARDCORE_WIRES': {
                let hwWrap = document.createElement('div'); hwWrap.style.cssText = 'display:flex; flex-direction:column; gap:8px; width:100%; max-width:500px; background:#111; padding:20px; border-radius:12px; border:3px solid #333; box-shadow:0 15px 30px rgba(0,0,0,0.9);';
                
                let colors = ['#ff3333', '#00ccff', '#00ff66', '#ffff00', '#ffffff', '#333333', '#800080', '#ffa500', '#00ffff', '#ffc0cb'];
                let names = ['أحمر', 'أزرق', 'أخضر', 'أصفر', 'أبيض', 'أسود', 'بنفسجي', 'برتقالي', 'سماوي', 'وردي'];
                
                // 0: Idle, 1: Connected, -1: Cut
                let states = new Array(10).fill(0);
                // Correct ans: Connect (1,2,5,6,8). Cut (0,3,4,7,9).
                let correctStates = [-1, 1, 1, -1, -1, 1, 1, -1, 1, -1]; 
                
                colors.forEach((col, i) => {
                    let row = document.createElement('div'); row.style.cssText = 'display:flex; align-items:center; gap:15px; background:#050505; padding:8px 15px; border-radius:6px; border:1px solid #222;';
                    
                    let wireDisp = document.createElement('div');
                    wireDisp.style.cssText = `flex-grow:1; height:15px; background:${col}; border-radius:8px; border:1px solid #000; box-shadow:inset 0 2px 5px rgba(255,255,255,0.3); transition:0.3s; position:relative; overflow:hidden;`;
                    
                    let btnCut = document.createElement('button'); btnCut.className = 'interactive-element'; btnCut.innerHTML = '✂️ قطع';
                    btnCut.style.cssText = 'background:#440000; color:#ff3333; border:1px solid #ff3333; padding:5px 10px; border-radius:4px; cursor:pointer; font-weight:bold;';
                    
                    let btnConn = document.createElement('button'); btnConn.className = 'interactive-element'; btnConn.innerHTML = '🔌 توصيل';
                    btnConn.style.cssText = 'background:#003300; color:#00ff66; border:1px solid #00ff66; padding:5px 10px; border-radius:4px; cursor:pointer; font-weight:bold;';
                    
                    const updateWireVisual = () => {
                        btnCut.style.background = states[i] === -1 ? '#ff3333' : '#440000'; btnCut.style.color = states[i] === -1 ? '#fff' : '#ff3333';
                        btnConn.style.background = states[i] === 1 ? '#00ff66' : '#003300'; btnConn.style.color = states[i] === 1 ? '#000' : '#00ff66';
                        
                        if(states[i] === -1) { wireDisp.style.opacity = '0.3'; wireDisp.style.borderStyle = 'dashed'; } 
                        else if(states[i] === 1) { wireDisp.style.opacity = '1'; wireDisp.style.boxShadow = `0 0 15px ${col}`; wireDisp.style.borderStyle = 'solid'; } 
                        else { wireDisp.style.opacity = '1'; wireDisp.style.boxShadow = 'inset 0 2px 5px rgba(255,255,255,0.3)'; wireDisp.style.borderStyle = 'solid'; }
                    };
                    
                    btnCut.onclick = () => { states[i] = -1; updateWireVisual(); };
                    btnConn.onclick = () => { states[i] = 1; updateWireVisual(); };
                    
                    row.append(wireDisp, btnCut, btnConn); hwWrap.appendChild(row);
                });
                
                let checkBtn = generateSubmitButton(() => {
                    if(states.includes(0)) { this.showToast('قم بتحديد حالة جميع الأسلاك العشرة أولاً!', '#ffa500'); return; }
                    if(JSON.stringify(states) === JSON.stringify(correctStates)) { setTimeout(()=>this.winInteractive(), 500); } 
                    else { this.failRoom(); setTimeout(()=>this.setupStage(), 1000); }
                }, 'تنفيذ الأمر (EXECUTE)');
                
                innerStage.append(hwWrap, checkBtn); break;
            }

            case 'PATTERN_LOCK': {
                let pWrap = document.createElement('div'); pWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:20px; background:#111; padding:30px; border-radius:15px; border:2px solid #333; position:relative;';
                let dots = []; let currentLine = [];
                for(let i=0; i<9; i++) {
                    let dot = document.createElement('div'); dot.className = 'interactive-element'; dot.style.cssText = 'width:80px; height:80px; background:#222; border-radius:50%; display:flex; justify-content:center; align-items:center; cursor:pointer; border:4px solid #444; transition:0.2s; box-shadow:inset 0 0 10px #000;';
                    let innerDot = document.createElement('div'); innerDot.style.cssText = 'width:20px; height:20px; background:#555; border-radius:50%; transition:0.2s;'; dot.appendChild(innerDot);
                    dot.onclick = () => {
                        if(currentLine.includes(i)) return;
                        currentLine.push(i); innerDot.style.background = 'var(--gold)'; innerDot.style.boxShadow = '0 0 15px var(--gold)'; dot.style.borderColor = 'var(--gold)';
                        if(currentLine.length === p.ans.length) {
                            if(JSON.stringify(currentLine) === JSON.stringify(p.ans)) { setTimeout(()=>this.winInteractive(), 500); } 
                            else { this.failRoom(); setTimeout(()=>this.setupStage(), 800); }
                        }
                    }; dots.push(dot); pWrap.appendChild(dot);
                } innerStage.appendChild(pWrap); break;
            }

            case 'JUGS': {
                let jugWrap = document.createElement('div'); jugWrap.style.cssText = 'display:flex; gap:30px; align-items:flex-end; height:180px; padding-bottom:20px; border-bottom:4px solid #333;';
                let caps = [8, 5, 3]; let vols = [8, 0, 0]; let selected = -1;
                const renderJugs = () => {
                    jugWrap.innerHTML = '';
                    caps.forEach((cap, i) => {
                        let j = document.createElement('div'); j.className = 'interactive-element'; j.style.cssText = 'width:70px; background:rgba(255,255,255,0.1); border:3px solid #666; border-radius:0 0 10px 10px; position:relative; overflow:hidden; cursor:pointer; transition:0.2s;'; j.style.height = (cap * 15 + 50) + 'px'; 
                        if(i === selected) { j.style.borderColor = 'var(--gold)'; j.style.transform = 'translateY(-10px)'; j.style.boxShadow = '0 10px 20px rgba(212,175,55,0.3)'; }
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
                        if(p.ans[this.stageState.clicks] === i) { c.style.background = 'var(--gold)'; c.style.boxShadow = '0 0 10px var(--gold)'; this.stageState.clicks++; if(this.stageState.clicks === p.ans.length) setTimeout(()=>this.winInteractive(), 400); } 
                        else { this.failRoom(); setTimeout(() => this.setupStage(), 800); }
                    }; bmWrap.appendChild(c);
                }
                let startMarker = document.createElement('div'); startMarker.innerText = 'START ↓'; startMarker.style.color = '#fff'; startMarker.style.marginBottom = '10px'; let endMarker = document.createElement('div'); endMarker.innerText = 'END ↓'; endMarker.style.color = '#fff'; endMarker.style.marginTop = '10px';
                innerStage.append(startMarker, bmWrap, endMarker); break;
            }

            case 'CRYPTEX': {
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:flex; gap:10px; margin-top:20px; background:#111; padding:20px; border-radius:12px; border:2px solid #333; box-shadow:0 20px 40px rgba(0,0,0,0.8);';
                let startWord = ['L','J','S','P','W','Z','L']; let current = [...startWord]; let alph = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                for(let i=0; i<7; i++) {
                    let col = document.createElement('div'); col.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:8px;';
                    let btnUp = document.createElement('button'); btnUp.className = 'interactive-element'; btnUp.innerText = '▲'; btnUp.style.cssText = 'background:#222; color:var(--gold); border:1px solid #555; cursor:pointer; padding:8px 15px; border-radius:4px; font-size:1.2rem;';
                    let btnDn = document.createElement('button'); btnDn.className = 'interactive-element'; btnDn.innerText = '▼'; btnDn.style.cssText = 'background:#222; color:var(--gold); border:1px solid #555; cursor:pointer; padding:8px 15px; border-radius:4px; font-size:1.2rem;';
                    let disp = document.createElement('div'); disp.style.cssText = 'width:50px; height:60px; background:linear-gradient(to bottom, #e3d2b2, #c4a976); border:2px solid #5c4a2a; display:flex; justify-content:center; align-items:center; font-size:2rem; font-weight:bold; color:#3e3124; font-family:monospace; border-radius:4px; box-shadow:inset 0 5px 10px rgba(0,0,0,0.2);'; disp.innerText = current[i];
                    const shift = (dir) => { let idx = alph.indexOf(current[i]); current[i] = alph[((idx + dir) % 26 + 26) % 26]; disp.innerText = current[i]; };
                    btnUp.onclick = () => shift(1); btnDn.onclick = () => shift(-1);
                    col.append(btnUp, disp, btnDn); wrap.appendChild(col);
                }
                let btn = generateSubmitButton(() => { if(current.join('') === p.ans) this.winInteractive(); else this.failRoom(); }, 'فتح القفل الأسطواني');
                innerStage.append(wrap, btn); break;
            }

            case 'SHARDS': {
                this.stageState.round = 1;
                let poets = [ { clues: ['سيف الدولة', 'أبو الطيب', 'الخيل والليل', 'قتلني شعري'], ans: 'المتنبي' }, { clues: ['عبس', 'الفروسية', 'جاهلي', 'عبلة'], ans: 'عنترة' }, { clues: ['مهندس الكلمة', 'زمان الصمت', 'البدر', 'أرفض المسافة'], ans: 'بدر بن عبدالمحسن' } ];
                let roundDisp = document.createElement('h3'); roundDisp.style.cssText = 'color:var(--gold); margin-bottom:20px; font-size:1.8rem; border-bottom:2px solid #333; padding-bottom:10px;';
                let mirWrap = document.createElement('div'); mirWrap.style.cssText = 'display:flex; flex-wrap:wrap; width:400px; gap:15px; justify-content:center; margin-bottom:30px;';
                let inp = createInputBlock('اسم الشاعر...', '');
                const loadRound = () => {
                    roundDisp.innerText = `-- الجولة ${this.stageState.round} من 3 --`; mirWrap.innerHTML = ''; inp.value = '';
                    poets[this.stageState.round-1].clues.forEach(clue => {
                        let shard = document.createElement('div'); shard.className = 'shard-btn interactive-element'; shard.style.cssText = 'width:180px; height:80px; background:linear-gradient(135deg, #1a1a1a, #0a0a0a); border:2px solid #444; display:flex; justify-content:center; align-items:center; text-align:center; font-weight:bold; font-size:1.2rem; cursor:pointer; color:transparent; transition:0.3s; clip-path: polygon(10% 0, 100% 10%, 90% 100%, 0 90%); user-select:none; box-shadow:0 10px 20px rgba(0,0,0,0.5);';
                        shard.onclick = () => { shard.style.color = '#000'; shard.innerText = clue; shard.style.background = 'linear-gradient(135deg, var(--gold), #fff)'; shard.style.borderColor = '#fff'; }; mirWrap.appendChild(shard);
                    });
                };
                inp.oninput = () => { if(inp.value.trim().replace(/\s+/g, '') === poets[this.stageState.round-1].ans.replace(/\s+/g, '')) { this.playSound('success'); this.stageState.round++; if(this.stageState.round > 3) setTimeout(()=>this.winInteractive(), 500); else setTimeout(()=>loadRound(), 800); } };
                innerStage.lastChild.lastChild.style.display = 'none'; innerStage.insertBefore(roundDisp, innerStage.firstChild); innerStage.insertBefore(mirWrap, innerStage.children[1]); loadRound(); break;
            }

            case 'CONSTELLATION': {
                let cWrap = document.createElement('div'); cWrap.style.cssText = 'position:relative; width:400px; height:400px; background:radial-gradient(circle at center, #1a1a2e, #0f0f1a); border:2px solid var(--gold); border-radius:8px; box-shadow:0 0 30px rgba(212,175,55,0.2); overflow:hidden;';
                let positions = [ {t:100, l:200}, {t:300, l:320}, {t:320, l:80}, {t:150, l:80}, {t:80, l:300} ]; 
                let clicks = [];
                positions.forEach((pos, i) => {
                    let star = document.createElement('div'); star.className = 'interactive-element'; star.style.cssText = `position:absolute; width:15px; height:15px; background:#fff; border-radius:50%; top:${pos.t}px; left:${pos.l}px; cursor:pointer; box-shadow:0 0 10px #fff; transition:0.3s; z-index:2;`;
                    star.onclick = () => {
                        if(clicks.includes(i)) return;
                        clicks.push(i); star.style.background = 'var(--gold)'; star.style.boxShadow = '0 0 20px var(--gold)'; star.style.transform = 'scale(1.5)';
                        if(clicks.length === 5) { if(JSON.stringify(clicks) === JSON.stringify(p.ans)) setTimeout(()=>this.winInteractive(), 500); else { this.failRoom(); setTimeout(()=>this.setupStage(), 800); } }
                    }; cWrap.appendChild(star);
                }); innerStage.appendChild(cWrap); break;
            }

            case 'VIRTUAL_PIANO': {
                let pWrap = document.createElement('div'); pWrap.style.cssText = 'display:flex; position:relative; background:#111; padding:20px; border-radius:12px; border:4px solid #222; box-shadow:0 20px 40px rgba(0,0,0,0.8); height:250px;';
                let whiteKeys = []; let seq = [];
                for(let i=0; i<7; i++) {
                    let wk = document.createElement('div'); wk.className = 'interactive-element'; wk.style.cssText = 'width:60px; height:100%; background:linear-gradient(to bottom, #fff, #eee); border:1px solid #ccc; border-radius:0 0 6px 6px; cursor:pointer; box-shadow:inset 0 -5px 5px rgba(0,0,0,0.2); transition:0.1s; display:flex; align-items:flex-end; justify-content:center; padding-bottom:10px; font-weight:bold; color:#555;'; wk.innerText = ['C','D','E','F','G','A','B'][i];
                    wk.onmousedown = () => { wk.style.background = '#ddd'; wk.style.transform = 'translateY(2px)'; seq.push(i); if(seq.length === p.ans.length) { if(JSON.stringify(seq) === JSON.stringify(p.ans)) setTimeout(()=>this.winInteractive(), 400); else { this.failRoom(); seq = []; } } };
                    wk.onmouseup = wk.onmouseleave = () => { wk.style.background = 'linear-gradient(to bottom, #fff, #eee)'; wk.style.transform = 'translateY(0)'; };
                    pWrap.appendChild(wk); whiteKeys.push(wk);
                }
                [1, 2, 4, 5, 6].forEach((pos) => { 
                    let bk = document.createElement('div'); bk.className = 'interactive-element'; bk.style.cssText = `position:absolute; width:40px; height:60%; background:linear-gradient(to bottom, #222, #000); border:1px solid #111; border-radius:0 0 4px 4px; left:${20 + pos*60 - 20}px; top:20px; z-index:2; cursor:pointer; box-shadow:2px 2px 5px rgba(0,0,0,0.5);`;
                    bk.onmousedown = () => { bk.style.background = '#333'; this.failRoom(); seq = []; }; bk.onmouseup = bk.onmouseleave = () => { bk.style.background = 'linear-gradient(to bottom, #222, #000)'; };
                    pWrap.appendChild(bk);
                }); innerStage.appendChild(pWrap); break;
            }

            case 'TIMELINE': {
                let ccWrap = document.createElement('div'); ccWrap.style.cssText = 'width:100%; max-width:600px; display:flex; flex-direction:column; gap:20px; background:#111; padding:30px; border-radius:12px; border:2px solid #333; margin-bottom:20px; box-shadow:0 20px 40px rgba(0,0,0,0.9); position:relative;';
                let targets = [15, 80, 45, 90, 20]; let sliders = [];
                let syncDisp = document.createElement('div'); syncDisp.style.cssText = 'color:var(--gold); font-family:monospace; font-size:2rem; text-align:center; margin-bottom:15px; font-weight:bold;'; syncDisp.innerText = 'SYNC: 0%';
                let marker = document.createElement('div'); marker.style.cssText = 'position:absolute; width:2px; height:100%; background:rgba(255,255,255,0.2); left:50%; top:0; pointer-events:none; z-index:0;'; ccWrap.append(marker, syncDisp);
                let colors = ['#00ccff', '#ff3333', '#00ff66', '#ff00ff', '#ffff00'];
                ['V1. Main', 'A1. Voice', 'A2. Music', 'V2. B-Roll', 'FX. Sound'].forEach((lbl, i) => {
                    let tRow = document.createElement('div'); tRow.style.cssText = 'display:flex; align-items:center; gap:15px; height:40px; position:relative; z-index:2;';
                    let tName = document.createElement('div'); tName.style.cssText = 'width:90px; color:#aaa; font-size:0.9rem; font-weight:bold; text-align:right; font-family:monospace;'; tName.innerText = lbl;
                    let sWrap = document.createElement('div'); sWrap.style.cssText = 'flex-grow:1; height:100%; background:#050505; border:1px solid #222; border-radius:4px; position:relative; display:flex; align-items:center;';
                    let s = document.createElement('input'); s.type = 'range'; s.min = 0; s.max = 100; s.value = 50; s.className = 'interactive-element'; s.style.cssText = `-webkit-appearance: none; width:100%; background:transparent; outline:none; cursor:pointer; position:absolute; z-index:5;`;
                    let style = document.createElement('style'); style.innerHTML = `input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 30px; width: 60px; border-radius: 4px; background: ${colors[i]}; cursor: pointer; border: 2px solid #fff; opacity: 0.8; }`; innerStage.appendChild(style);
                    s.oninput = () => { let diff = 0; sliders.forEach((sl, idx) => { diff += Math.abs(sl.value - targets[idx]); }); let sync = Math.max(0, 100 - (diff / 2.5)); syncDisp.innerText = `SYNC: ${Math.floor(sync)}%`; if(sync >= 98) { syncDisp.innerText = 'SYNC: 100%'; syncDisp.style.color = '#00ff66'; setTimeout(()=>this.winInteractive(), 800); } };
                    sliders.push(s); sWrap.appendChild(s); tRow.append(tName, sWrap); ccWrap.appendChild(tRow);
                }); innerStage.appendChild(ccWrap); break;
            }

            case 'DNA': {
                let dnaWrap = document.createElement('div'); dnaWrap.style.cssText = 'display:flex; flex-direction:column; gap:15px; align-items:center; margin-bottom:30px;';
                let bases = ['A','C','G','T']; this.stageState.arr = ['A','A','A','A'];
                let leftStrand = ['A', 'C', 'T', 'G']; let ansArray = ['T', 'G', 'A', 'C'];
                leftStrand.forEach((base, i) => {
                    let row = document.createElement('div'); row.style.cssText = 'display:flex; gap:30px; position:relative;';
                    let line = document.createElement('div'); line.style.cssText = 'position:absolute; width:60px; height:4px; background:#333; top:28px; left:30px; z-index:0;';
                    let left = document.createElement('div'); left.style.cssText = 'width:60px; height:60px; border-radius:50%; background:#111; border:2px solid #555; display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:2rem; color:#888; z-index:1; box-shadow:inset 0 0 10px #000;'; left.innerText = base;
                    let right = document.createElement('div'); right.className = 'interactive-element'; right.style.cssText = 'width:60px; height:60px; border-radius:50%; background:#000; border:2px solid var(--gold); display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:2rem; color:var(--gold); cursor:pointer; z-index:1; box-shadow:0 0 15px rgba(212,175,55,0.4); user-select:none;'; right.innerText = 'A';
                    right.onclick = () => { let idx = bases.indexOf(right.innerText); idx = (idx + 1) % 4; right.innerText = bases[idx]; this.stageState.arr[i] = bases[idx]; };
                    row.append(line, left, right); dnaWrap.appendChild(row);
                });
                let btn = generateSubmitButton(() => { if(JSON.stringify(this.stageState.arr) === JSON.stringify(ansArray)) this.winInteractive(); else this.failRoom(); }, 'دمج السلسلة (MERGE)');
                innerStage.append(dnaWrap, btn); break;
            }

            case 'KEYPAD': {
                let kWrap = document.createElement('div'); kWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:15px; background:#111; padding:30px; border-radius:12px; border:2px solid #333; box-shadow:0 20px 40px rgba(0,0,0,0.8);';
                // اصلاح التوسيط
                let kDisp = document.createElement('div'); kDisp.style.cssText = 'grid-column:span 3; height:70px; background:#000; border:2px solid var(--gold); color:var(--gold); display:flex; justify-content:center; align-items:center; font-size:2.5rem; font-family:monospace; letter-spacing:15px; margin-bottom:15px; border-radius:6px; box-shadow:inset 0 0 20px rgba(212,175,55,0.2); white-space:nowrap; overflow:hidden; padding-left:15px;';
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

            // --- الباب 20 (القضية الكبرى من 5 راوندات ملحمية) ---
            case 'EPIC_DETECTIVE': {
                this.stageState.round = 1;
                
                let storyCard = document.createElement('div'); 
                storyCard.style.cssText = 'width:100%; max-width:650px; background:#1a1a1a; padding:30px; border-radius:8px; border-right:6px solid var(--gold); color:#ddd; font-size:1.4rem; line-height:2; box-shadow:inset 0 0 30px #000; margin-bottom:20px; font-family:"Traditional Arabic", serif; text-align:right; direction:rtl; transition:0.3s;';
                
                let qTitle = document.createElement('h3'); 
                qTitle.style.cssText = 'color:var(--gold); margin-bottom:15px; font-size:1.6rem; text-align:right; width:100%; max-width:650px; direction:rtl;';
                
                let inputContainer = document.createElement('div'); 
                inputContainer.style.width = '100%';
                
                const loadRound = () => {
                    inputContainer.innerHTML = '';
                    
                    if(this.stageState.round === 1) {
                        storyCard.innerHTML = `<strong>التقرير الأولي:</strong><br>تم العثور على ملف القضية الأسود مقفلاً. للبدء في التحقيق، عليك العثور على الكود السري المكون من 4 أحرف إنجليزية. <strong>(اذهب إلى رومات الديسكورد وابحث عن الكود المخفي في رسالة الدعم الفني).</strong>`;
                        qTitle.innerText = `الراوند 1: فك تشفير الملف.`;
                        let inp = createInputBlock('أدخل الكود (مثال: ECHO)...', 'ECHO'); // الكود ECHO
                        inp.oninput = () => { if(inp.value.trim().toUpperCase() === 'ECHO') { this.playSound('success'); this.stageState.round++; loadRound(); } };
                        innerStage.lastChild.lastChild.style.display = 'none'; inputContainer.appendChild(innerStage.lastChild);
                    }
                    else if(this.stageState.round === 2) {
                        storyCard.innerHTML = `<strong>شهادة الحارس:</strong><br>"كنت أقف في حديقة الفندق ليلاً، كانت السماء صافية تماماً والـ<span class="case-word interactive-element" data-ans="1">نجوم</span> ساطعة، فجأة سمعت صراخاً، ركضت للداخل وتركت مظلتي التي كنت أحتمي بها من الـ<span class="case-word interactive-element" data-ans="1">مطر</span> الغزير بالخارج. وعندما دخلت الغرفة كانت <span class="case-word interactive-element" data-ans="0">مظلمة</span>."`;
                        qTitle.innerText = `الراوند 2: هناك تناقض مستحيل في الشهادة. اضغط (Click) على الكلمتين المتناقضتين بالظبط.`;
                        
                        let selectedWords = new Set();
                        storyCard.querySelectorAll('.case-word').forEach((el, index) => {
                            el.style.cssText = 'color:var(--gold); cursor:pointer; text-decoration:underline dashed #555; padding:0 5px;';
                            el.onclick = () => {
                                if(selectedWords.has(index)) { selectedWords.delete(index); el.style.background = 'transparent'; el.style.color = 'var(--gold)'; }
                                else { selectedWords.add(index); el.style.background = 'var(--gold)'; el.style.color = '#000'; }
                                
                                if(selectedWords.size === 2) {
                                    if(selectedWords.has(0) && selectedWords.has(1)) { this.playSound('success'); this.stageState.round++; loadRound(); } 
                                    else { this.failRoom(); selectedWords.clear(); storyCard.querySelectorAll('.case-word').forEach(w => { w.style.background = 'transparent'; w.style.color = 'var(--gold)'; }); }
                                }
                            };
                        });
                    }
                    else if(this.stageState.round === 3) {
                        storyCard.innerHTML = `<strong>الاستجواب:</strong><br>3 مشتبه بهم: (أحمد، خالد، سعد).<br>- أحمد يقول: "سعد هو القاتل".<br>- خالد يقول: "أنا لم أقتل أحداً".<br>- سعد يقول: "أحمد يكذب".<br><br><strong>ملاحظة:</strong> واحد فقط من الثلاثة يقول الحقيقة!`;
                        qTitle.innerText = `الراوند 3: استنتج من هو القاتل؟`;
                        let btnWrap = document.createElement('div'); btnWrap.style.cssText = 'display:flex; gap:15px; justify-content:center; width:100%; direction:rtl;';
                        ['أحمد', 'خالد', 'سعد'].forEach((suspect, i) => {
                            let btn = document.createElement('button'); btn.className = 'interactive-element'; btn.innerText = suspect; btn.style.cssText = 'padding:15px 30px; background:#222; color:var(--gold); border:2px solid #555; border-radius:6px; cursor:pointer; font-weight:bold; font-size:1.2rem;';
                            // الحل: خالد هو القاتل. لو خالد صادق (ما قتل) وأحمد كاذب وسعد كاذب (أحمد ما يكذب)، تناقض.
                            // الوحيد اللي يخلي عبارة وحدة صح هو أن (سعد يقول الحقيقة أن أحمد يكذب)، وخالد كاذب (يعني هو القاتل).
                            btn.onclick = () => { if(i === 1) { this.playSound('success'); this.stageState.round++; loadRound(); } else { this.failRoom(); } };
                            btnWrap.appendChild(btn);
                        });
                        inputContainer.appendChild(btnWrap);
                    }
                    else if(this.stageState.round === 4) {
                        storyCard.innerHTML = `<strong>الرسالة المشفرة:</strong><br>وجدنا في جيب القاتل (خالد) ملاحظة تقول: "الغرفة رقم 10110". هذا الرقم بنظام الباينري (الثنائي).`;
                        qTitle.innerText = `الراوند 4: حول الرقم الثنائي إلى عشري لمعرفة رقم الغرفة الصحيح.`;
                        let inp = createInputBlock('أدخل رقم الغرفة...', '22'); // 10110 in binary is 22
                        inp.oninput = () => { if(inp.value.trim() === '22' || inp.value.trim() === '٢٢') { this.playSound('success'); this.stageState.round++; loadRound(); } };
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
                let defaultMsg = document.createElement('div'); defaultMsg.style.cssText = "color:var(--gold); font-family:monospace; font-size:1.5rem;"; defaultMsg.innerText = "Error: Protocol Missing"; innerStage.appendChild(defaultMsg); break;
        }
    }

    winInteractive() {
        this.clearTimers();
        this.stageState.playing = false;
        this.playSound('success'); 
        
        document.getElementById('interactive-stage-container').classList.add('hidden');
        document.getElementById('puzzle-desc').innerText = this.activeGate.txtQ;
        document.getElementById('text-stage').classList.remove('hidden');
        document.getElementById('input-area').classList.remove('hidden');
        
        setTimeout(() => document.getElementById('user-input').focus(), 100);
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
    }

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
        this.showToast('تم تخطي الروم إجبارياً!', '#00ff66'); 
        this.returnToLobby();
    }

    returnToLobby() { 
        this.clearTimers();
        this.stageState.playing = false;
        this.playSound('click'); 
        this.switchScreen('lobby'); 
        this.renderLobby(); 
    }
}

// تشغيل المحرك
const game = new SolarGamesEngine();
