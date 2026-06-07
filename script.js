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
            {q: "مليء بالثقوب ولكنه يحتفظ بالماء؟", a: "الاسفنج"},
            {q: "دائمًا أمامك ولكن لا يمكنك رؤيته؟", a: "المستقبل"}, 
            {q: "لا يمكنك الاحتفاظ به إلا بعد إعطائه؟", a: "الوعد"},
            {q: "إذا نطقت باسمه كسرته؟", a: "الصمت"}, 
            {q: "شيء يجب كسره قبل استخدامه؟", a: "البيضة"},
            {q: "كلما جففت شيئًا، أصبحت أكثر بللًا؟", a: "المنشفة"}, 
            {q: "فيها مدن بلا منازل، وغابات بلا أشجار؟", a: "الخريطة"},
            {q: "لها عقارب ولكن لا تلدغ؟", a: "الساعة"}, 
            {q: "يمشي بلا أرجل ويبكي بلا أعين؟", a: "السحاب"},
            {q: "أخضر من الخارج، أحمر من الداخل؟", a: "البطيخ"}, 
            {q: "له رأس ولا عين له؟", a: "المسمار"},
            {q: "يبكي دمعًا أسود ليضيء العقول؟", a: "القلم"}, 
            {q: "يكبر في الصباح ويختفي في الظهيرة؟", a: "الظل"},
            {q: "دائمًا تشير للشمال ولكنها لا تتحرك؟", a: "البوصلة"}, 
            {q: "تسمعها ولكن لا تراها ولا تلمسها؟", a: "الريح"},
            {q: "تأكل كل شيء وتخاف من الماء؟", a: "النار"}, 
            {q: "كلما أخذت منه كبر؟", a: "الحفرة"},
            {q: "يقرصك ولا تراه؟", a: "الجوع"}, 
            {q: "يملكه الشخص ويستخدمه الآخرون أكثر منه؟", a: "الاسم"},
            {q: "كلما أخذت منه أكثر، تركت أكثر وراءك؟", a: "الخطوة"}
        ];

        let mechanics = [];
        for(let i=1; i<=25; i++) {
            let m = { id: i, type: `GAME_${i}` };
            
            if(i===1) { m.uiType = 'WIRES'; m.desc="قطع الأسلاك: اقطع 3 أسلاك محددة بالترتيب لتعطيل النظام."; m.data=['#D4AF37','#ff3333','#333','#fff','#D4AF37','#00ccff','#333','#ff3333']; m.ans=[2,5,7]; m.hint="💡 تفاعلي: الاحمر، اسود، ازرق. | 📝 كتابي: يعتم كلما زاد."; }
            else if(i===2) { m.uiType = 'SIMON'; m.desc="الذاكرة البصرية: تتبع الأنماط المضيئة وكررها (3 جولات)."; m.data=4; m.hint="💡 تفاعلي: ركز وكرر الترتيب. | 📝 كتابي: يذوب في الحرارة."; }
            else if(i===3) { m.uiType = 'MASTERMIND'; m.desc="الاستنتاج: أدخل 4 أرقام. (أخضر = صحيح، برتقالي = مكان خطأ)."; m.ans=[3,7,1,9]; m.hint="💡 تفاعلي: الكود هو 3**9. | 📝 كتابي: لا يمكنك البوح به."; }
            else if(i===4) { m.uiType = 'MATCH'; m.desc="التطابق: اقلب البطاقات وطابق 10 أزواج."; m.data=['🪐','☄️','🌑','🔭','🛸','🛰️','🌌','🌠','🚀','👨‍🚀']; m.hint="💡 تفاعلي: احفظ الأماكن. | 📝 كتابي: يزيد ولا ينقص."; }
            else if(i===5) { m.uiType = 'COMPASS'; m.desc="توجيه البوصلة: اضبط الزوايا الثلاث لتتجه نحو المسار المخفي."; m.ans=[135, 225, 45]; m.hint="💡 تفاعلي: أسفل، أسفل يمين، أعلى. | 📝 كتابي: يرتد لك من الجدار."; }
            else if(i===6) { m.uiType = 'TELESCOPE'; m.desc="التلسكوب الفضائي: اسحب (Drag) خريطة النجوم للعثور على النجم الذهبي المخفي."; m.hint="💡 تفاعلي: ابحث في الزاوية السفلية اليسرى. | 📝 كتابي: كائن بحري يمتص."; }
            else if(i===7) { m.uiType = 'SCALES'; m.desc="الميزان: قم بتفعيل الأوزان الصحيحة ليصل المجموع إلى 150 بالضبط."; m.data=[50,70,30,80,20]; m.target=150; m.hint="💡 تفاعلي: 70 + 80. | 📝 كتابي: يأتي غداً."; }
            else if(i===8) { m.uiType = 'MACRO'; m.desc="الكشاف: حرك الماوس ككشاف ضوئي لتتعرف على الصورة القريبة جداً."; m.ans='خشب'; m.hint="💡 تفاعلي: ركز على التفاصيل (خشب). | 📝 كتابي: تقطعه لتفي به."; }
            else if(i===9) { m.uiType = 'SLIDER'; m.desc="اللوحة المكسورة: رتب القطع الخشبية المبعثرة بالترتيب التصاعدي."; m.hint="💡 تفاعلي: رتبها من 1 إلى 8. | 📝 كتابي: لغته السكوت."; }
            else if(i===10) { m.uiType = 'MIXER'; m.desc="التردد الصوتي: اسحب أشرطة التحكم لتتطابق مع التردد السري (100, 25, 75, 0)."; m.hint="💡 تفاعلي: كامل، ربع، ثلاث أرباع، صفر. | 📝 كتابي: قشرتها هشة."; }
            else if(i===11) { m.uiType = 'FEUD'; m.desc="النبض العام: سألنا 100 شخص: شيء تفقده ولا يعود؟"; m.ans='الوقت'; m.hint="💡 تفاعلي: الإجابة هي (الوقت). | 📝 كتابي: تنشفك وتتبلل."; }
            else if(i===12) { m.uiType = 'JUGS'; m.desc="الكيمياء: انقل السوائل بين الدوارق (8 لتر، 5 لتر، 3 لتر) لتحصل على 4 لتر."; m.hint="💡 تفاعلي: املأ الـ 5 ثم صب في الـ 3. | 📝 كتابي: ترسم العالم."; }
            else if(i===13) { m.uiType = 'PIPES'; m.desc="توصيل الطاقة: اضغط على الأنابيب لتدويرها وتشكيل مسار متصل من اليسار لليمين."; m.hint="💡 تفاعلي: اجعل الخطوط كلها أفقية. | 📝 كتابي: تعرف بها الوقت."; }
            else if(i===14) { m.uiType = 'VAULT_DIAL'; m.desc="الخزنة السويسرية: أدر القرص لليمين إلى 30، ثم لليسار إلى 15."; m.ans=[30, 15]; m.hint="💡 تفاعلي: يمين 30، يسار 15. | 📝 كتابي: صيفي ولذيذ."; }
            else if(i===15) { m.uiType = 'BLIND_MAZE'; m.desc="المتاهة العمياء: هناك مسار واحد آمن في الشبكة. خطأ واحد يعيدك للصفر."; m.ans=[0,6,12,13,14,20,26,32,33,34,35]; m.hint="💡 تفاعلي: انزل 3 مربعات ثم يمين. | 📝 كتابي: صيفي ولذيذ."; } // Fixed text riddle reference
            else if(i===16) { m.uiType = 'CRYPTEX'; m.desc="شفرة قيصر: حرك الأحرف السبعة للوصول لكلمة (ECLIPSE)."; m.ans='ECLIPSE'; m.hint="💡 تفاعلي: الكلمة هي ECLIPSE. | 📝 كتابي: يثبت الأشياء."; }
            else if(i===17) { m.uiType = 'SHARDS'; m.desc="من أنا (3 جولات): اكشف الشظايا لتعرف اسم الشاعر."; m.hint="💡 تفاعلي: المتنبي، عنترة، البدر. | 📝 كتابي: أداة الكتابة."; }
            else if(i===18) { m.uiType = 'ENGINE_911'; m.desc="روح 911: استمر بالضغط لرفع الـ RPM وعشق النمرة عند 7000 بالضبط."; m.hint="💡 تفاعلي: افلت الزر بين 6900 و 7200. | 📝 كتابي: يتبعك بالشمس."; }
            else if(i===19) { m.uiType = 'LOCKPICK'; m.desc="كسر القفل: اضغط على الزر في اللحظة التي يمر فيها المؤشر على المنطقة الذهبية (3 مرات)."; m.hint="💡 تفاعلي: ركز على التوقيت. | 📝 كتابي: تدل على الشمال."; }
            else if(i===20) { m.uiType = 'MORSE'; m.desc="شفرة مورس: اضغط ضغطة قصيرة (•) أو طويلة (—) لكتابة استغاثة SOS (... --- ...)."; m.ans='...---...'; m.hint="💡 تفاعلي: 3 قصار، 3 طوال، 3 قصار. | 📝 كتابي: لا تُرى."; }
            else if(i===21) { m.uiType = 'TIMELINE'; m.desc="تايم لاين المونتاج: اسحب مسارات الفيديو والصوت لتتزامن بنسبة 100%."; m.hint="💡 تفاعلي: المسار الأول 15، الثاني 45. | 📝 كتابي: تخاف من الماء."; }
            else if(i===22) { m.uiType = 'DNA'; m.desc="الحمض النووي: اضغط لتغيير القواعد، طابق A مع T، و C مع G للتركيبة المخفية."; m.ans='TGCA'; m.hint="💡 تفاعلي: الحل هو TGCA. | 📝 كتابي: تكبر كلما أخذت منها."; }
            else if(i===23) { m.uiType = 'MATH_SEQ'; m.desc="السلسلة الرقمية: ما هو الرقم المفقود؟ 2, 6, 12, 20, ؟"; m.ans='30'; m.hint="💡 تفاعلي: الزيادة +4، +6، +8... | 📝 كتابي: يقرصك ببطنك."; }
            else if(i===24) { m.uiType = 'KEYPAD'; m.desc="اللوحة الرقمية: أدخل الرمز السري المتناثر في الغرفة."; m.ans='1936'; m.hint="💡 تفاعلي: الكود هو 1936. | 📝 كتابي: ينادونك به."; }
            else if(i===25) { m.uiType = 'DETECTIVE'; m.desc="ملف القضية: اقرأ القصة واضغط (Click) على 3 كلمات متناقضة لتكشف كذبة المتهم."; m.hint="💡 تفاعلي: التناقض في المطر، الشمس، والنظارة. | 📝 كتابي: تتركها وراءك."; }

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
        
        for(let i=1; i<=25; i++) {
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

            // 1. الألعاب القديمة الثابتة برمجتها بشكل نظيف
            case 'WIRES': {
                let wWrap = document.createElement('div'); 
                wWrap.style.cssText = 'width:100%; display:flex; flex-direction:column; align-items:center; gap: 15px;';
                p.data.forEach((color, i) => {
                    let w = document.createElement('div'); 
                    w.className = 'interactive-element';
                    w.style.cssText = `width:100%; max-width:400px; height:30px; background-color:${color}; border-radius:15px; cursor:pointer; border:2px solid #222; box-shadow:0 5px 10px rgba(0,0,0,0.8), inset 0 2px 5px rgba(255,255,255,0.3); transition:0.3s; position:relative;`;
                    
                    w.onclick = () => {
                        w.style.opacity = '0.2'; 
                        w.style.pointerEvents = 'none'; 
                        w.style.borderStyle = 'dashed';
                        if(p.ans[this.stageState.clicks] === i) {
                            this.stageState.clicks++;
                            if(this.stageState.clicks === p.ans.length) this.winInteractive();
                        } else { 
                            this.failRoom(); 
                            setTimeout(() => this.setupStage(), 800); 
                        }
                    };
                    wWrap.appendChild(w);
                });
                innerStage.appendChild(wWrap);
                break;
            }

            case 'SIMON': {
                let smGrid = document.createElement('div'); 
                smGrid.style.cssText = 'display:grid; grid-template-columns:repeat(2, 100px); gap:15px; justify-content:center;';
                let colors = ['#ff3333', '#00ff66', '#00ccff', '#D4AF37'];
                let boxes = [];
                
                for(let i=0; i<4; i++) {
                    let b = document.createElement('div'); 
                    b.className = 'interactive-element';
                    b.style.cssText = `width:100px; height:100px; background:#111; border:4px solid #333; border-radius:12px; cursor:pointer; transition:0.1s; box-shadow:inset 0 0 15px #000;`;
                    b.onclick = () => {
                        if(!this.stageState.playing) return;
                        if(this.stageState.sequence[this.stageState.clicks] === i) {
                            b.style.background = colors[i]; b.style.borderColor = '#fff'; b.style.boxShadow = `0 0 30px ${colors[i]}`; 
                            setTimeout(()=>{ b.style.background = '#111'; b.style.borderColor = '#333'; b.style.boxShadow = 'inset 0 0 15px #000'; }, 200);
                            
                            this.stageState.clicks++;
                            if(this.stageState.clicks === this.stageState.sequence.length) {
                                this.stageState.round++;
                                if(this.stageState.round > 3) setTimeout(() => this.winInteractive(), 500); 
                                else setTimeout(()=>playRound(), 1000);
                            }
                        } else { 
                            this.failRoom(); 
                            setTimeout(() => this.setupStage(), 800); 
                        }
                    };
                    smGrid.appendChild(b); 
                    boxes.push(b);
                }
                innerStage.appendChild(smGrid);
                this.stageState.round = 1;
                
                const playRound = () => {
                    this.stageState.playing = false; 
                    this.stageState.clicks = 0;
                    let count = this.stageState.round === 1 ? 4 : (this.stageState.round === 2 ? 6 : 8);
                    this.stageState.sequence = Array.from({length: count}, () => Math.floor(Math.random() * 4));
                    
                    let step = 0;
                    this.stageState.timer = setInterval(() => {
                        if(step < count) {
                            let idx = this.stageState.sequence[step];
                            boxes[idx].style.background = colors[idx]; boxes[idx].style.borderColor = '#fff'; boxes[idx].style.boxShadow = `0 0 30px ${colors[idx]}`; 
                            this.playSound('click');
                            setTimeout(()=> { 
                                boxes[idx].style.background = '#111'; boxes[idx].style.borderColor = '#333'; boxes[idx].style.boxShadow = 'inset 0 0 15px #000'; 
                            }, 300);
                            step++;
                        } else { 
                            clearInterval(this.stageState.timer); 
                            this.stageState.playing = true; 
                        }
                    }, 600);
                };
                setTimeout(()=>playRound(), 800);
                break;
            }

            case 'MASTERMIND': {
                let container = document.createElement('div'); 
                container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap: 20px;';
                let inputs = document.createElement('div'); 
                inputs.style.cssText = 'display:flex; gap:15px; justify-content:center;';
                let mboxes = [];
                
                for(let i=0; i<4; i++) { 
                    let inp = document.createElement('input'); 
                    inp.type='number'; 
                    inp.className = 'interactive-element';
                    inp.style.cssText = 'width:60px; height:70px; background:#000; border:2px solid var(--gold); color:var(--gold); font-size:2.5rem; text-align:center; border-radius:8px; outline:none; font-family:monospace; box-shadow:inset 0 0 15px rgba(212,175,55,0.2);'; 
                    inp.maxLength=1; 
                    inputs.appendChild(inp); 
                    mboxes.push(inp); 
                }
                
                let btn = generateSubmitButton(() => {
                    let guess = mboxes.map(b => parseInt(b.value));
                    if(guess.some(isNaN)) return;
                    
                    let tempAns = [...p.ans];
                    let tempGuess = [...guess];
                    let pegs = [];
                    
                    for(let i=0; i<4; i++) { 
                        if(tempGuess[i] === tempAns[i]) { pegs.push('#00ff66'); tempAns[i]=null; tempGuess[i]=-1; } 
                    }
                    for(let i=0; i<4; i++) { 
                        if(tempGuess[i] !== -1 && tempAns.includes(tempGuess[i])) { pegs.push('#ffa500'); tempAns[tempAns.indexOf(tempGuess[i])]=null; } 
                    }
                    
                    if(pegs.every(c=>c==='#00ff66') && pegs.length===4) {
                        this.winInteractive();
                    } else {
                        this.failRoom();
                        mboxes.forEach(b => b.value = '');
                    }
                }, 'فحص الكود');
                
                container.append(inputs, btn); 
                innerStage.appendChild(container);
                break;
            }

            case 'MATCH': {
                let crdGrid = document.createElement('div'); 
                crdGrid.style.cssText = 'display:grid; grid-template-columns:repeat(5, 60px); gap:10px; justify-content:center; perspective:1000px;';
                let symbols = [...p.data, ...p.data].sort(() => Math.random() - 0.5);
                let flipped = [];
                
                symbols.forEach((sym) => {
                    let card = document.createElement('div'); 
                    card.className = 'interactive-element';
                    card.style.cssText = 'width:60px; height:60px; perspective:1000px; cursor:pointer; position:relative;';
                    let inner = document.createElement('div'); 
                    inner.style.cssText = 'width:100%; height:100%; transition:transform 0.4s; transform-style:preserve-3d; position:absolute;';
                    let front = document.createElement('div'); 
                    front.style.cssText = 'width:100%; height:100%; position:absolute; backface-visibility:hidden; background:#111; border:2px solid #444; border-radius:6px;';
                    let back = document.createElement('div'); 
                    back.style.cssText = 'width:100%; height:100%; position:absolute; backface-visibility:hidden; background:var(--gold); transform:rotateY(180deg); display:flex; justify-content:center; align-items:center; font-size:25px; border-radius:6px; color:#000; border:2px solid #fff;'; 
                    back.innerText = sym;
                    
                    inner.append(front, back); 
                    card.appendChild(inner);
                    
                    card.onclick = () => {
                        if(inner.style.transform === 'rotateY(180deg)' || flipped.length >= 2) return;
                        inner.style.transform = 'rotateY(180deg)'; 
                        flipped.push({c:inner, s:sym});
                        
                        if(flipped.length === 2) {
                            setTimeout(() => {
                                if(flipped[0].s === flipped[1].s) { 
                                    this.stageState.clicks += 2; 
                                    if(this.stageState.clicks === 20) this.winInteractive(); 
                                } else { 
                                    flipped[0].c.style.transform = 'rotateY(0deg)'; 
                                    flipped[1].c.style.transform = 'rotateY(0deg)'; 
                                }
                                flipped = [];
                            }, 600);
                        }
                    };
                    crdGrid.appendChild(card);
                });
                innerStage.appendChild(crdGrid);
                break;
            }

            case 'COMPASS': { 
                let wrap = document.createElement('div'); 
                wrap.style.cssText = 'display:flex; gap:30px;';
                let angles = [0, 0, 0];
                
                for(let i=0; i<3; i++) {
                    let cmp = document.createElement('div'); 
                    cmp.className = 'interactive-element';
                    cmp.style.cssText = 'width:100px; height:100px; border-radius:50%; background:radial-gradient(circle, #222, #000); border:4px solid var(--gold); position:relative; display:flex; justify-content:center; align-items:center; cursor:pointer; transition:transform 0.3s; box-shadow:0 0 20px rgba(212,175,55,0.2);';
                    let ndl = document.createElement('div'); 
                    ndl.style.cssText = 'width:4px; height:80px; background:linear-gradient(to bottom, #ff3333 50%, #fff 50%); position:absolute; border-radius:2px;';
                    let center = document.createElement('div');
                    center.style.cssText = 'width:12px; height:12px; background:var(--gold); border-radius:50%; z-index:2;';
                    
                    cmp.append(ndl, center);
                    cmp.onclick = () => {
                        angles[i] = (angles[i] + 45) % 360; 
                        cmp.style.transform = `rotate(${angles[i]}deg)`;
                        if(angles[0]===p.ans[0] && angles[1]===p.ans[1] && angles[2]===p.ans[2]) {
                            setTimeout(()=>this.winInteractive(), 500);
                        }
                    };
                    wrap.appendChild(cmp);
                }
                innerStage.appendChild(wrap);
                break;
            }

            case 'TELESCOPE': {
                let tWrap = document.createElement('div');
                tWrap.style.cssText = 'width:300px; height:300px; border-radius:50%; border:10px solid #222; background:#000; overflow:hidden; position:relative; box-shadow:inset 0 0 50px rgba(0,0,0,0.9), 0 0 20px rgba(212,175,55,0.5); cursor:grab;';
                
                let sky = document.createElement('div');
                sky.style.cssText = 'width:1000px; height:1000px; background:radial-gradient(circle at 80% 80%, #1a1a2e, #0f0f1a); position:absolute; left:-350px; top:-350px; display:flex; justify-content:center; align-items:center; background-image:radial-gradient(white 1px, transparent 0); background-size:30px 30px;';
                
                let star = document.createElement('div');
                star.className = 'interactive-element';
                star.style.cssText = 'position:absolute; bottom:150px; left:150px; width:20px; height:20px; background:var(--gold); border-radius:50%; box-shadow:0 0 20px var(--gold); cursor:pointer; transition:transform 0.2s;';
                
                star.onclick = () => this.winInteractive();
                sky.appendChild(star);
                tWrap.appendChild(sky);
                
                let isDragging = false;
                let startX, startY, currentX = -350, currentY = -350;

                tWrap.onmousedown = (e) => {
                    isDragging = true;
                    tWrap.style.cursor = 'grabbing';
                    startX = e.clientX - currentX;
                    startY = e.clientY - currentY;
                };
                
                window.onmousemove = (e) => {
                    if (!isDragging) return;
                    currentX = e.clientX - startX;
                    currentY = e.clientY - startY;
                    sky.style.left = `${currentX}px`;
                    sky.style.top = `${currentY}px`;
                };
                
                window.onmouseup = () => {
                    isDragging = false;
                    tWrap.style.cursor = 'grab';
                };

                innerStage.appendChild(tWrap);
                let lbl = document.createElement('div');
                lbl.style.cssText = 'color:var(--gold); margin-top:20px; font-family:monospace; font-size:1.2rem;';
                lbl.innerText = 'DRAG TO SEARCH THE GALAXY';
                innerStage.appendChild(lbl);
                break;
            }

            case 'SCALES': {
                let sclWrap = document.createElement('div'); 
                sclWrap.style.cssText = 'display:flex; gap:20px; align-items:flex-end; height:150px; border-bottom: 4px solid var(--gold); padding-bottom:10px; width: 100%; max-width: 500px; justify-content:center; margin-top:50px; position:relative;';
                
                let balanceNeedle = document.createElement('div');
                balanceNeedle.style.cssText = 'position:absolute; bottom:-20px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:10px solid transparent; border-right:10px solid transparent; border-bottom:15px solid #ff3333; transition:transform 0.3s;';
                sclWrap.appendChild(balanceNeedle);

                p.data.forEach((w) => {
                    let btn = document.createElement('div');
                    btn.className = 'interactive-element';
                    btn.style.cssText = 'width:60px; background:linear-gradient(to bottom, #ccc, #888); border:2px solid #555; text-align:center; font-weight:bold; color:#000; cursor:pointer; display:flex; align-items:flex-end; justify-content:center; padding-bottom:10px; transition:0.2s; border-radius:4px 4px 0 0; box-shadow:0 -5px 10px rgba(0,0,0,0.5);';
                    btn.innerText = w + 'kg'; 
                    btn.style.height = (w + 40) + 'px';
                    
                    btn.onclick = () => {
                        btn.classList.toggle('active');
                        btn.style.background = btn.classList.contains('active') ? 'linear-gradient(to bottom, var(--gold), #8a7322)' : 'linear-gradient(to bottom, #ccc, #888)';
                        btn.style.transform = btn.classList.contains('active') ? 'translateY(-10px)' : 'translateY(0)';
                        
                        let sum = Array.from(sclWrap.children).reduce((acc, el, idx) => acc + (el.classList && el.classList.contains('active') ? p.data[idx-1] : 0), 0); // -1 because of needle
                        
                        let tilt = ((sum - p.target) / p.target) * 45; 
                        balanceNeedle.style.transform = `translateX(-50%) rotate(${Math.max(-45, Math.min(45, tilt))}deg)`;
                        
                        if(sum === p.target) {
                            balanceNeedle.style.borderBottomColor = '#00ff66';
                            setTimeout(()=>this.winInteractive(), 500);
                        } else {
                            balanceNeedle.style.borderBottomColor = '#ff3333';
                        }
                    };
                    sclWrap.appendChild(btn);
                });
                innerStage.appendChild(sclWrap);
                break;
            }

            case 'MACRO': {
                let mWrap = document.createElement('div');
                mWrap.style.cssText = 'width:400px; height:300px; background:url("https://www.transparenttextures.com/patterns/wood-pattern.png") #4a3b2c; border:2px solid var(--gold); position:relative; overflow:hidden; cursor:crosshair; box-shadow:0 0 30px rgba(0,0,0,0.8); border-radius:8px;';
                
                let overlay = document.createElement('div');
                overlay.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; background:#000; pointer-events:none; clip-path:circle(0px at 50% 50%); transition:clip-path 0.05s ease-out;';
                
                mWrap.onmousemove = (e) => {
                    const rect = mWrap.getBoundingClientRect();
                    const x = e.clientX - rect.left; 
                    const y = e.clientY - rect.top;
                    overlay.style.clipPath = `circle(50px at ${x}px ${y}px)`;
                };
                
                mWrap.onmouseleave = () => { 
                    overlay.style.clipPath = 'circle(0px at 50% 50%)'; 
                };
                
                mWrap.appendChild(overlay); 
                innerStage.appendChild(mWrap);
                createInputBlock('ماهية المادة (كلمة واحدة)...', p.ans);
                break;
            }

            case 'SLIDER': {
                let pzWrap = document.createElement('div'); 
                pzWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:4px; background:#222; padding:8px; border:2px solid #555; border-radius:6px; box-shadow:0 15px 25px rgba(0,0,0,0.9);';
                
                let tiles = [1,2,3,4,5,6,7,0,8]; // Solvable state
                
                const renderPuzzle = () => {
                    pzWrap.innerHTML = '';
                    tiles.forEach((t, i) => {
                        let cell = document.createElement('div'); 
                        cell.className = 'interactive-element';
                        
                        if(t === 0) { 
                            cell.style.cssText = 'width:80px; height:80px; background:transparent; border:1px dashed #444; border-radius:4px;'; 
                        } else { 
                            cell.style.cssText = 'width:80px; height:80px; background:linear-gradient(135deg, var(--gold), #8a7322); display:flex; justify-content:center; align-items:center; font-size:2.5rem; font-weight:bold; color:#000; cursor:pointer; border-radius:4px; box-shadow:inset 0 0 10px rgba(0,0,0,0.3); transition:0.1s; user-select:none; border:1px solid #fff;';
                            cell.innerText = t; 
                        }
                        
                        cell.onclick = () => {
                            let emptyIdx = tiles.indexOf(0);
                            let validMoves = [emptyIdx-1, emptyIdx+1, emptyIdx-3, emptyIdx+3];
                            
                            // Prevent row wrapping
                            if(emptyIdx%3 === 0 && i === emptyIdx-1) return;
                            if(emptyIdx%3 === 2 && i === emptyIdx+1) return;
                            
                            if(validMoves.includes(i)) {
                                tiles[emptyIdx] = t; 
                                tiles[i] = 0; 
                                renderPuzzle();
                                if(tiles.join('') === '123456780') setTimeout(()=>this.winInteractive(), 400);
                            }
                        };
                        pzWrap.appendChild(cell);
                    });
                };
                renderPuzzle(); 
                innerStage.appendChild(pzWrap);
                break;
            }

            case 'MIXER': {
                let mWrap = document.createElement('div'); 
                mWrap.style.cssText = 'display:flex; gap:30px; align-items:center; height:220px; padding:20px; background:linear-gradient(to bottom, #111, #222); border-radius:8px; border:2px solid #444; box-shadow:0 10px 20px rgba(0,0,0,0.8);';
                
                let targets = [100, 25, 75, 0]; 
                let sliders = [];
                
                for(let i=0; i<4; i++) {
                    let track = document.createElement('div'); 
                    track.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:15px; height:100%;';
                    
                    // Simple vertical range hack for compatibility
                    let sWrap = document.createElement('div');
                    sWrap.style.cssText = 'height:100%; width:20px; position:relative; background:#000; border-radius:10px; border:1px solid #333;';
                    
                    let fill = document.createElement('div');
                    fill.style.cssText = 'position:absolute; bottom:0; width:100%; background:var(--gold); border-radius:10px; transition:height 0.1s; height:50%; pointer-events:none;';
                    
                    let s = document.createElement('input'); 
                    s.type = 'range'; s.min = 0; s.max = 100; s.value = 50; 
                    s.className = 'interactive-element';
                    s.style.cssText = 'writing-mode: bt-lr; -webkit-appearance: slider-vertical; width:100%; height:100%; cursor:pointer; opacity:0; position:absolute; top:0; left:0; z-index:5;';
                    
                    let led = document.createElement('div'); 
                    led.style.cssText = 'width:15px; height:15px; border-radius:50%; background:#333; border:2px solid #111; box-shadow:inset 0 0 5px #000; transition:0.3s;';
                    
                    s.oninput = () => { 
                        fill.style.height = `${s.value}%`;
                        led.style.background = '#333'; led.style.boxShadow = 'none'; // reset led
                    };
                    
                    sWrap.append(fill, s);
                    track.append(sWrap, led); 
                    mWrap.appendChild(track); 
                    sliders.push({s, led});
                }
                
                let checkBtn = generateSubmitButton(() => {
                    let win = true;
                    sliders.forEach((sl, i) => {
                        if(Math.abs(sl.s.value - targets[i]) < 8) { 
                            sl.led.style.background = '#00ff66'; sl.led.style.boxShadow = '0 0 15px #00ff66'; 
                        } else { 
                            sl.led.style.background = '#ff3333'; sl.led.style.boxShadow = '0 0 15px #ff3333';
                            win = false; 
                        }
                    });
                    if(win) setTimeout(()=>this.winInteractive(), 600); 
                    else setTimeout(() => { sliders.forEach(sl => { sl.led.style.background = '#333'; sl.led.style.boxShadow = 'none'; }); }, 1000);
                }, 'مزامنة التردد (SYNC)');
                
                innerStage.append(mWrap, checkBtn);
                break;
            }

            case 'FEUD': {
                let fWrap = document.createElement('div'); 
                fWrap.style.cssText = 'width:100%; max-width:500px; background:linear-gradient(to bottom, #000, #111); border:4px solid #333; border-radius:12px; padding:30px; box-shadow:0 15px 30px rgba(0,0,0,0.9);';
                
                let title = document.createElement('div'); 
                title.style.cssText = 'color:var(--gold); font-size:1.5rem; text-align:center; margin-bottom:25px; font-weight:bold; line-height:1.6; text-shadow:0 0 10px rgba(212,175,55,0.5);'; 
                title.innerText = p.desc;
                
                let board = document.createElement('div'); 
                board.style.cssText = 'background:linear-gradient(to bottom, #111, #222); border:3px solid #555; height:70px; display:flex; justify-content:center; align-items:center; color:#fff; font-size:2.2rem; letter-spacing:8px; box-shadow:inset 0 0 20px #000; border-radius:8px; font-family:monospace;'; 
                board.innerText = '1. --------';
                
                fWrap.append(title, board); 
                innerStage.appendChild(fWrap);
                
                let inp = createInputBlock('إجابة الأغلبية...', p.ans);
                inp.oninput = () => { 
                    if(inp.value.trim().toUpperCase() === p.ans.toUpperCase()) { 
                        board.innerText = `1. ${p.ans}`; 
                        board.style.color = '#00ff66'; 
                        board.style.borderColor = '#00ff66';
                        this.playSound('success'); 
                        setTimeout(()=>this.winInteractive(), 1000); 
                    } 
                };
                // Hide the default submit button since we auto-check
                innerStage.lastChild.lastChild.style.display = 'none';
                break;
            }

            case 'JUGS': {
                let jugWrap = document.createElement('div'); 
                jugWrap.style.cssText = 'display:flex; gap:30px; align-items:flex-end; height:180px; padding-bottom:20px; border-bottom:4px solid #333;';
                
                let caps = [8, 5, 3]; 
                let vols = [8, 0, 0]; 
                let selected = -1;
                
                const renderJugs = () => {
                    jugWrap.innerHTML = '';
                    caps.forEach((cap, i) => {
                        let j = document.createElement('div'); 
                        j.className = 'interactive-element';
                        j.style.cssText = 'width:70px; background:rgba(255,255,255,0.1); border:3px solid #666; border-radius:0 0 10px 10px; position:relative; overflow:hidden; cursor:pointer; transition:0.2s;'; 
                        j.style.height = (cap * 15 + 50) + 'px'; // dynamic height
                        
                        if(i === selected) {
                            j.style.borderColor = 'var(--gold)';
                            j.style.transform = 'translateY(-10px)';
                            j.style.boxShadow = '0 10px 20px rgba(212,175,55,0.3)';
                        }
                        
                        let w = document.createElement('div'); 
                        w.style.cssText = 'position:absolute; bottom:0; width:100%; background:linear-gradient(to bottom, rgba(0,200,255,0.8), rgba(0,100,255,0.9)); transition:height 0.4s cubic-bezier(0.4, 0, 0.2, 1);'; 
                        w.style.height = (vols[i] / cap * 100) + '%';
                        
                        let lbl = document.createElement('div'); 
                        lbl.style.cssText = 'position:absolute; width:100%; text-align:center; color:#fff; font-weight:bold; top:10px; z-index:2; font-family:monospace; font-size:1.2rem; text-shadow:0 0 5px #000;'; 
                        lbl.innerText = `${vols[i]}/${cap}`;
                        
                        j.append(w, lbl);
                        
                        j.onclick = () => {
                            if(selected === -1) { 
                                if(vols[i] > 0) { selected = i; renderJugs(); }
                            } else {
                                if(selected !== i) {
                                    let transfer = Math.min(vols[selected], caps[i] - vols[i]);
                                    vols[selected] -= transfer; 
                                    vols[i] += transfer;
                                }
                                selected = -1; 
                                renderJugs();
                                if(vols.includes(4)) setTimeout(()=>this.winInteractive(), 500);
                            }
                        };
                        jugWrap.appendChild(j);
                    });
                };
                renderJugs(); 
                innerStage.appendChild(jugWrap);
                break;
            }

            case 'PIPES': {
                let pWrap = document.createElement('div'); 
                pWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:5px; background:#111; padding:15px; border:4px solid #333; border-radius:8px;';
                
                // 0: straight horizontal, 90: straight vertical
                let state = [90, 0, 90, 0, 90, 0, 90, 0, 90]; 
                let cells = [];
                
                for(let i=0; i<9; i++) {
                    let cell = document.createElement('div'); 
                    cell.className = 'interactive-element';
                    cell.style.cssText = `width:80px; height:80px; background:#222; border:1px solid #444; display:flex; justify-content:center; align-items:center; cursor:pointer; transition:transform 0.3s cubic-bezier(0.4,0,0.2,1); transform:rotate(${state[i]}deg);`;
                    
                    let pipe = document.createElement('div');
                    pipe.style.cssText = 'width:100%; height:20px; background:linear-gradient(to bottom, #b8860b, #ffd700, #b8860b); box-shadow:0 5px 10px rgba(0,0,0,0.5);';
                    
                    cell.appendChild(pipe);
                    cell.onclick = () => {
                        state[i] = (state[i] + 90) % 180; // only needs 2 states for straight line
                        cell.style.transform = `rotate(${state[i]}deg)`;
                        
                        // Check if middle row is connected (indices 3,4,5)
                        if(state[3] === 0 && state[4] === 0 && state[5] === 0) {
                            setTimeout(()=>this.winInteractive(), 400);
                        }
                    };
                    cells.push(cell); 
                    pWrap.appendChild(cell);
                }
                
                // Entry and Exit markers
                let container = document.createElement('div');
                container.style.cssText = 'display:flex; align-items:center; gap:10px;';
                
                let entry = document.createElement('div'); entry.innerText = 'IN ▶'; entry.style.color = '#00ff66'; entry.style.fontWeight = 'bold';
                let exit = document.createElement('div'); exit.innerText = '▶ OUT'; exit.style.color = '#ff3333'; exit.style.fontWeight = 'bold';
                
                container.append(entry, pWrap, exit);
                innerStage.appendChild(container);
                break;
            }

            case 'VAULT_DIAL': {
                let sWrap = document.createElement('div'); 
                sWrap.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:30px;';
                
                let dial = document.createElement('div'); 
                dial.style.cssText = 'width:200px; height:200px; border-radius:50%; background:radial-gradient(circle, #333, #000); border:15px solid var(--gold); display:flex; justify-content:center; position:relative; box-shadow:0 10px 40px rgba(0,0,0,0.9); transition:transform 0.1s;';
                
                let tick = document.createElement('div'); 
                tick.style.cssText = 'width:6px; height:25px; background:#ff3333; position:absolute; top:0; box-shadow:0 0 10px #ff3333;'; 
                dial.appendChild(tick);
                
                let valDisp = document.createElement('div'); 
                valDisp.style.cssText = 'font-size:3.5rem; color:var(--gold); font-family:monospace; font-weight:bold; background:#000; padding:10px 30px; border:2px solid #333; border-radius:8px;'; 
                valDisp.innerText = '00';
                
                let controls = document.createElement('div'); 
                controls.style.cssText = 'display:flex; gap:20px;';
                
                let step = 0; 
                let currentAngle = 0;
                
                ['◄ يسار', 'يمين ►'].forEach((dir, idx) => {
                    let btn = document.createElement('button'); 
                    btn.className = 'interactive-element';
                    btn.innerText = dir; 
                    btn.style.cssText = 'padding:15px 30px; background:#111; color:#fff; border:2px solid var(--gold); border-radius:6px; font-size:1.2rem; cursor:pointer; font-weight:bold;';
                    
                    btn.onclick = () => {
                        currentAngle += (idx === 0 ? -5 : 5);
                        let norm = ((currentAngle % 100) + 100) % 100;
                        dial.style.transform = `rotate(${currentAngle * 3.6}deg)`; 
                        valDisp.innerText = norm.toString().padStart(2,'0');
                    };
                    controls.appendChild(btn);
                });
                
                let checkBtn = generateSubmitButton(() => {
                    let norm = ((currentAngle % 100) + 100) % 100;
                    if(norm === p.ans[step]) {
                        this.playSound('success'); 
                        step++; 
                        valDisp.style.color = '#00ff66'; 
                        setTimeout(()=>valDisp.style.color = 'var(--gold)', 500);
                        if(step === 2) this.winInteractive();
                    } else { 
                        this.failRoom(); 
                        step = 0; currentAngle = 0; 
                        dial.style.transform = `rotate(0deg)`; 
                        valDisp.innerText = '00'; 
                    }
                }, 'إدخال (ENTER)');
                
                sWrap.append(valDisp, dial, controls, checkBtn); 
                innerStage.appendChild(sWrap);
                break;
            }

            case 'BLIND_MAZE': {
                let bmWrap = document.createElement('div'); 
                bmWrap.style.cssText = 'display:grid; grid-template-columns:repeat(6, 50px); gap:2px; background:#111; padding:5px; border:4px solid #333; border-radius:8px; box-shadow:inset 0 0 20px #000;';
                
                for(let i=0; i<36; i++) {
                    let c = document.createElement('div'); 
                    c.className = 'interactive-element';
                    c.style.cssText = 'height:50px; background:#050505; cursor:pointer; transition:0.2s; border-radius:2px;';
                    
                    c.onclick = () => {
                        if(p.ans[this.stageState.clicks] === i) {
                            c.style.background = 'var(--gold)'; 
                            c.style.boxShadow = '0 0 10px var(--gold)';
                            this.stageState.clicks++;
                            if(this.stageState.clicks === p.ans.length) setTimeout(()=>this.winInteractive(), 400);
                        } else { 
                            this.failRoom(); 
                            setTimeout(() => this.setupStage(), 800); 
                        }
                    };
                    bmWrap.appendChild(c);
                }
                
                let startMarker = document.createElement('div'); startMarker.innerText = 'START ↓'; startMarker.style.color = '#fff'; startMarker.style.marginBottom = '10px';
                let endMarker = document.createElement('div'); endMarker.innerText = 'END ↓'; endMarker.style.color = '#fff'; endMarker.style.marginTop = '10px';
                
                innerStage.append(startMarker, bmWrap, endMarker);
                break;
            }

            case 'CRYPTEX': {
                let wrap = document.createElement('div'); 
                wrap.style.cssText = 'display:flex; gap:10px; margin-top:20px; background:#111; padding:20px; border-radius:12px; border:2px solid #333; box-shadow:0 20px 40px rgba(0,0,0,0.8);';
                
                let startWord = ['L','J','S','P','W','Z','L']; 
                let current = [...startWord];
                let alph = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                
                for(let i=0; i<7; i++) {
                    let col = document.createElement('div'); 
                    col.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:8px;';
                    
                    let btnUp = document.createElement('button'); 
                    btnUp.className = 'interactive-element';
                    btnUp.innerText = '▲'; 
                    btnUp.style.cssText = 'background:#222; color:var(--gold); border:1px solid #555; cursor:pointer; padding:8px 15px; border-radius:4px; font-size:1.2rem;';
                    
                    let btnDn = document.createElement('button'); 
                    btnDn.className = 'interactive-element';
                    btnDn.innerText = '▼'; 
                    btnDn.style.cssText = 'background:#222; color:var(--gold); border:1px solid #555; cursor:pointer; padding:8px 15px; border-radius:4px; font-size:1.2rem;';
                    
                    let disp = document.createElement('div'); 
                    disp.style.cssText = 'width:50px; height:60px; background:linear-gradient(to bottom, #e3d2b2, #c4a976); border:2px solid #5c4a2a; display:flex; justify-content:center; align-items:center; font-size:2rem; font-weight:bold; color:#3e3124; font-family:monospace; border-radius:4px; box-shadow:inset 0 5px 10px rgba(0,0,0,0.2);'; 
                    disp.innerText = current[i];
                    
                    const shift = (dir) => {
                        let idx = alph.indexOf(current[i]);
                        current[i] = alph[((idx + dir) % 26 + 26) % 26];
                        disp.innerText = current[i];
                    };
                    
                    btnUp.onclick = () => shift(1); 
                    btnDn.onclick = () => shift(-1);
                    
                    col.append(btnUp, disp, btnDn); 
                    wrap.appendChild(col);
                }
                
                let btn = generateSubmitButton(() => {
                    if(current.join('') === p.ans) this.winInteractive(); 
                    else this.failRoom();
                }, 'فتح القفل الأسطواني');
                
                innerStage.append(wrap, btn);
                break;
            }

            case 'SHARDS': {
                this.stageState.round = 1;
                let poets = [
                    { clues: ['سيف الدولة', 'أبو الطيب', 'الخيل والليل', 'قتلني شعري'], ans: 'المتنبي' },
                    { clues: ['عبس', 'الفروسية', 'جاهلي', 'عبلة'], ans: 'عنترة' },
                    { clues: ['مهندس الكلمة', 'زمان الصمت', 'البدر', 'أرفض المسافة'], ans: 'بدر بن عبدالمحسن' }
                ];
                
                let roundDisp = document.createElement('h3'); 
                roundDisp.style.cssText = 'color:var(--gold); margin-bottom:20px; font-size:1.8rem; border-bottom:2px solid #333; padding-bottom:10px;';
                
                let mirWrap = document.createElement('div'); 
                mirWrap.style.cssText = 'display:flex; flex-wrap:wrap; width:400px; gap:15px; justify-content:center; margin-bottom:30px;';
                
                let inp = createInputBlock('اسم الشاعر...', '');
                
                const loadRound = () => {
                    roundDisp.innerText = `-- الجولة ${this.stageState.round} من 3 --`;
                    mirWrap.innerHTML = ''; 
                    inp.value = '';
                    
                    poets[this.stageState.round-1].clues.forEach(clue => {
                        let shard = document.createElement('div'); 
                        shard.className = 'shard-btn interactive-element';
                        shard.style.cssText = 'width:180px; height:80px; background:linear-gradient(135deg, #1a1a1a, #0a0a0a); border:2px solid #444; display:flex; justify-content:center; align-items:center; text-align:center; font-weight:bold; font-size:1.2rem; cursor:pointer; color:transparent; transition:0.3s; clip-path: polygon(10% 0, 100% 10%, 90% 100%, 0 90%); user-select:none; box-shadow:0 10px 20px rgba(0,0,0,0.5);';
                        
                        shard.onclick = () => { 
                            shard.style.color = '#000'; 
                            shard.innerText = clue; 
                            shard.style.background = 'linear-gradient(135deg, var(--gold), #fff)'; 
                            shard.style.borderColor = '#fff';
                        };
                        mirWrap.appendChild(shard);
                    });
                };
                
                inp.oninput = () => {
                    if(inp.value.trim().replace(/\s+/g, '') === poets[this.stageState.round-1].ans.replace(/\s+/g, '')) {
                        this.playSound('success'); 
                        this.stageState.round++;
                        if(this.stageState.round > 3) setTimeout(()=>this.winInteractive(), 500); 
                        else setTimeout(()=>loadRound(), 800);
                    }
                };
                
                // Hide default execute button
                innerStage.lastChild.lastChild.style.display = 'none';
                innerStage.insertBefore(roundDisp, innerStage.firstChild);
                innerStage.insertBefore(mirWrap, innerStage.children[1]);
                loadRound();
                break;
            }

            case 'ENGINE_911': {
                let dash = document.createElement('div'); 
                dash.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:30px; background:#050505; padding:40px; border-radius:20px; border:2px solid #222; box-shadow:inset 0 0 50px #000;';
                
                let gauge = document.createElement('div'); 
                gauge.style.cssText = 'width:250px; height:125px; background:radial-gradient(circle at bottom, #222, #000); border:6px solid #444; border-bottom:none; border-radius:125px 125px 0 0; position:relative; overflow:hidden; display:flex; justify-content:center; align-items:flex-end; padding-bottom:15px; box-shadow:inset 0 0 30px rgba(255,0,0,0.2);';
                
                let redline = document.createElement('div');
                redline.style.cssText = 'position:absolute; bottom:0; right:0; width:50%; height:100%; background:rgba(255,0,0,0.2); clip-path:polygon(100% 0, 100% 100%, 80% 100%); transform-origin:bottom left;';
                
                let needle = document.createElement('div'); 
                needle.style.cssText = 'width:4px; height:100px; background:#ff3333; position:absolute; bottom:0; transform-origin:bottom center; transform:rotate(-90deg); transition:transform 0.05s linear; box-shadow:0 0 10px #ff3333;';
                
                let rpmText = document.createElement('div'); 
                rpmText.style.cssText = 'color:#fff; font-family:monospace; font-size:2rem; z-index:2; font-weight:bold;'; 
                rpmText.innerText = '0 RPM';
                
                gauge.append(redline, needle, rpmText);
                
                let rpm = 0; 
                
                let revBtn = document.createElement('button'); 
                revBtn.innerText = 'HOLD TO REV'; 
                revBtn.style.cssText = 'padding:20px 40px; background:linear-gradient(to bottom, #333, #111); border:2px solid #555; color:#fff; cursor:pointer; font-weight:bold; font-size:1.5rem; border-radius:8px; user-select:none; box-shadow:0 10px 20px rgba(0,0,0,0.8); transition:0.1s;';
                
                let shiftBtn = document.createElement('button'); 
                shiftBtn.innerText = 'SHIFT GEAR'; 
                shiftBtn.style.cssText = 'padding:20px 40px; background:linear-gradient(to bottom, var(--gold), #8a7322); border:2px solid #fff; color:#000; cursor:pointer; font-weight:bold; font-size:1.5rem; border-radius:8px; box-shadow:0 10px 20px rgba(212,175,55,0.4); transition:0.1s;';

                const updateGauge = () => {
                    let angle = -90 + (rpm / 8000) * 180;
                    needle.style.transform = `rotate(${Math.min(90, Math.max(-90, angle))}deg)`;
                    rpmText.innerText = `${Math.floor(rpm)} RPM`;
                    if(rpm >= 6900 && rpm <= 7200) { rpmText.style.color = '#00ff66'; } 
                    else { rpmText.style.color = '#fff'; }
                };

                let isReving = false;
                
                const engineLoop = () => {
                    if(isReving) { rpm += 80; if(rpm > 8000) rpm = 8000; } 
                    else { rpm -= 120; if(rpm < 0) rpm = 0; }
                    updateGauge();
                    this.stageState.animFrame = requestAnimationFrame(engineLoop);
                };

                revBtn.onmousedown = () => { this.playSound('click'); isReving = true; revBtn.style.transform = 'translateY(5px)'; };
                revBtn.onmouseup = revBtn.onmouseleave = () => { isReving = false; revBtn.style.transform = 'translateY(0)'; };
                
                shiftBtn.onclick = () => {
                    this.playSound('click');
                    shiftBtn.style.transform = 'translateY(5px)';
                    setTimeout(() => shiftBtn.style.transform = 'translateY(0)', 100);
                    
                    if(rpm >= 6900 && rpm <= 7200) { 
                        cancelAnimationFrame(this.stageState.animFrame);
                        rpmText.innerText = 'PERFECT SHIFT!';
                        setTimeout(() => this.winInteractive(), 1000); 
                    } else { 
                        this.failRoom(); 
                    }
                };

                let btnWrap = document.createElement('div'); 
                btnWrap.style.cssText = 'display:flex; gap:20px;'; 
                btnWrap.append(revBtn, shiftBtn);
                dash.append(gauge, btnWrap); 
                innerStage.appendChild(dash);
                
                this.stageState.animFrame = requestAnimationFrame(engineLoop);
                break;
            }

            case 'LOCKPICK': {
                let lWrap = document.createElement('div');
                lWrap.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:40px; width:100%;';
                
                let barWrap = document.createElement('div');
                barWrap.style.cssText = 'width:400px; height:40px; background:#111; border:2px solid #444; border-radius:20px; position:relative; overflow:hidden; box-shadow:inset 0 0 20px #000;';
                
                let targetZone = document.createElement('div');
                targetZone.style.cssText = 'position:absolute; height:100%; background:rgba(212,175,55,0.4); border-left:2px solid var(--gold); border-right:2px solid var(--gold); top:0;';
                
                let pin = document.createElement('div');
                pin.style.cssText = 'position:absolute; width:10px; height:100%; background:#fff; top:0; left:0; box-shadow:0 0 10px #fff;';
                
                barWrap.append(targetZone, pin);
                
                let statusCount = document.createElement('div');
                statusCount.style.cssText = 'font-size:2rem; color:var(--gold); font-family:monospace; font-weight:bold; letter-spacing:5px;';
                statusCount.innerText = '0 / 3';
                
                let btn = generateSubmitButton(() => {
                    let pinX = parseFloat(pin.style.left);
                    let targetX = parseFloat(targetZone.style.left);
                    let targetW = parseFloat(targetZone.style.width);
                    
                    if(pinX >= targetX && pinX <= targetX + targetW) {
                        this.playSound('success');
                        this.stageState.clicks++;
                        statusCount.innerText = `${this.stageState.clicks} / 3`;
                        
                        if(this.stageState.clicks === 3) {
                            cancelAnimationFrame(this.stageState.animFrame);
                            setTimeout(() => this.winInteractive(), 500);
                        } else {
                            // reset and make harder
                            randomizeTarget();
                            speed += 1.5;
                        }
                    } else {
                        this.failRoom();
                        this.stageState.clicks = 0;
                        statusCount.innerText = '0 / 3';
                        speed = 3;
                        randomizeTarget();
                    }
                }, 'إدراج الدبوس (PUSH)');
                
                lWrap.append(barWrap, statusCount, btn);
                innerStage.appendChild(lWrap);
                
                let pos = 0; let dir = 1; let speed = 3;
                
                const randomizeTarget = () => {
                    let w = Math.random() * 40 + 40; // 40-80px width
                    let x = Math.random() * (400 - w);
                    targetZone.style.width = `${w}px`;
                    targetZone.style.left = `${x}px`;
                };
                randomizeTarget();
                
                const pinLoop = () => {
                    pos += speed * dir;
                    if(pos > 390) { pos = 390; dir = -1; }
                    if(pos < 0) { pos = 0; dir = 1; }
                    pin.style.left = `${pos}px`;
                    this.stageState.animFrame = requestAnimationFrame(pinLoop);
                };
                this.stageState.animFrame = requestAnimationFrame(pinLoop);
                
                break;
            }

            case 'MORSE': {
                let mWrap = document.createElement('div'); 
                mWrap.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:30px;';
                
                let disp = document.createElement('div'); 
                disp.style.cssText = 'height:80px; min-width:300px; background:#000; border:4px solid var(--gold); color:#fff; font-size:3rem; letter-spacing:10px; display:flex; justify-content:center; align-items:center; font-family:monospace; border-radius:8px; box-shadow:0 10px 20px rgba(0,0,0,0.8);';
                
                let info = document.createElement('div');
                info.style.cssText = 'color:#888; font-family:monospace; text-align:center;';
                info.innerText = 'S O S : (3 Shorts) (3 Longs) (3 Shorts)';

                let controls = document.createElement('div'); 
                controls.style.cssText = 'display:flex; gap:20px;';
                
                ['ضغطة قصيرة (•)', 'ضغطة طويلة (—)'].forEach((lbl, i) => {
                    let btn = document.createElement('button'); 
                    btn.className = 'interactive-element';
                    btn.innerText = lbl; 
                    btn.style.cssText = 'padding:20px 40px; background:#222; color:var(--gold); border:2px solid var(--gold); font-size:1.5rem; font-weight:bold; cursor:pointer; border-radius:8px; transition:0.1s;';
                    
                    btn.onmousedown = () => btn.style.transform = 'translateY(5px)';
                    btn.onmouseup = btn.onmouseleave = () => btn.style.transform = 'translateY(0)';

                    btn.onclick = () => {
                        this.stageState.val = (this.stageState.val || '') + (i===0 ? '.' : '-');
                        disp.innerText = this.stageState.val;
                        
                        if(this.stageState.val === p.ans) {
                            disp.style.color = '#00ff66';
                            disp.style.borderColor = '#00ff66';
                            setTimeout(()=>this.winInteractive(), 1000);
                        }
                        else if(this.stageState.val.length >= p.ans.length) { 
                            this.failRoom(); 
                            this.stageState.val = ''; 
                            setTimeout(() => disp.innerText = '', 500);
                        }
                    };
                    controls.appendChild(btn);
                });
                
                mWrap.append(info, disp, controls); 
                innerStage.appendChild(mWrap);
                break;
            }

            case 'TIMELINE': {
                let ccWrap = document.createElement('div'); 
                ccWrap.style.cssText = 'width:100%; max-width:600px; display:flex; flex-direction:column; gap:20px; background:#111; padding:30px; border-radius:12px; border:2px solid #333; margin-bottom:20px; box-shadow:0 20px 40px rgba(0,0,0,0.9); position:relative;';
                
                let targets = [15, 80, 45, 90, 20]; 
                let sliders = [];
                let syncDisp = document.createElement('div'); 
                syncDisp.style.cssText = 'color:var(--gold); font-family:monospace; font-size:2rem; text-align:center; margin-bottom:15px; font-weight:bold;'; 
                syncDisp.innerText = 'SYNC: 0%';
                
                let marker = document.createElement('div');
                marker.style.cssText = 'position:absolute; width:2px; height:100%; background:rgba(255,255,255,0.2); left:50%; top:0; pointer-events:none; z-index:0;';
                ccWrap.append(marker, syncDisp);
                
                let colors = ['#00ccff', '#ff3333', '#00ff66', '#ff00ff', '#ffff00'];
                
                ['V1. Main', 'A1. Voice', 'A2. Music', 'V2. B-Roll', 'FX. Sound'].forEach((lbl, i) => {
                    let tRow = document.createElement('div'); 
                    tRow.style.cssText = 'display:flex; align-items:center; gap:15px; height:40px; position:relative; z-index:2;';
                    
                    let tName = document.createElement('div'); 
                    tName.style.cssText = 'width:90px; color:#aaa; font-size:0.9rem; font-weight:bold; text-align:right; font-family:monospace;'; 
                    tName.innerText = lbl;
                    
                    let sWrap = document.createElement('div');
                    sWrap.style.cssText = 'flex-grow:1; height:100%; background:#050505; border:1px solid #222; border-radius:4px; position:relative; display:flex; align-items:center;';
                    
                    let s = document.createElement('input'); 
                    s.type = 'range'; s.min = 0; s.max = 100; s.value = 50; 
                    s.className = 'interactive-element';
                    
                    // Style the input to look like a clip block
                    s.style.cssText = `-webkit-appearance: none; width:100%; background:transparent; outline:none; cursor:pointer; position:absolute; z-index:5;`;
                    
                    // Insert a custom style for the thumb just for this block
                    let style = document.createElement('style');
                    style.innerHTML = `
                        input[type=range]::-webkit-slider-thumb {
                            -webkit-appearance: none;
                            height: 30px;
                            width: 60px;
                            border-radius: 4px;
                            background: ${colors[i]};
                            cursor: pointer;
                            border: 2px solid #fff;
                            opacity: 0.8;
                        }
                    `;
                    innerStage.appendChild(style);

                    s.oninput = () => {
                        let diff = 0; 
                        sliders.forEach((sl, idx) => { diff += Math.abs(sl.value - targets[idx]); });
                        let sync = Math.max(0, 100 - (diff / 2.5)); // 2.5 to make it harder
                        syncDisp.innerText = `SYNC: ${Math.floor(sync)}%`;
                        
                        if(sync >= 98) { // small forgiveness margin
                            syncDisp.innerText = 'SYNC: 100%';
                            syncDisp.style.color = '#00ff66'; 
                            setTimeout(()=>this.winInteractive(), 800); 
                        }
                    };
                    
                    sliders.push(s); 
                    sWrap.appendChild(s);
                    tRow.append(tName, sWrap); 
                    ccWrap.appendChild(tRow);
                });
                
                innerStage.appendChild(ccWrap);
                break;
            }

            case 'DNA': {
                let dnaWrap = document.createElement('div'); 
                dnaWrap.style.cssText = 'display:flex; flex-direction:column; gap:15px; align-items:center; margin-bottom:30px;';
                
                let bases = ['A','C','G','T']; 
                this.stageState.arr = ['A','A','A','A'];
                let targetDNA = ['T','G','C','A']; // so ans is A C G T -> mapped to target T G A C logically?
                // Wait, desc says match A with T, C with G.
                // Target strand: T, G, A, C
                // Correct ans: A, C, T, G (since A=T, C=G, T=A, G=C)
                let leftStrand = ['A', 'C', 'T', 'G']; // user needs to match: T, G, A, C
                let ansArray = ['T', 'G', 'A', 'C'];
                
                leftStrand.forEach((base, i) => {
                    let row = document.createElement('div'); 
                    row.style.cssText = 'display:flex; gap:30px; position:relative;';
                    
                    let line = document.createElement('div'); 
                    line.style.cssText = 'position:absolute; width:60px; height:4px; background:#333; top:28px; left:30px; z-index:0;';
                    
                    let left = document.createElement('div'); 
                    left.style.cssText = 'width:60px; height:60px; border-radius:50%; background:#111; border:2px solid #555; display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:2rem; color:#888; z-index:1; box-shadow:inset 0 0 10px #000;'; 
                    left.innerText = base;
                    
                    let right = document.createElement('div'); 
                    right.className = 'interactive-element';
                    right.style.cssText = 'width:60px; height:60px; border-radius:50%; background:#000; border:2px solid var(--gold); display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:2rem; color:var(--gold); cursor:pointer; z-index:1; box-shadow:0 0 15px rgba(212,175,55,0.4); user-select:none;'; 
                    right.innerText = 'A';
                    
                    right.onclick = () => { 
                        let idx = bases.indexOf(right.innerText); 
                        idx = (idx + 1) % 4; 
                        right.innerText = bases[idx]; 
                        this.stageState.arr[i] = bases[idx]; 
                    };
                    
                    row.append(line, left, right); 
                    dnaWrap.appendChild(row);
                });
                
                let btn = generateSubmitButton(() => { 
                    if(JSON.stringify(this.stageState.arr) === JSON.stringify(ansArray)) this.winInteractive(); 
                    else this.failRoom(); 
                }, 'دمج السلسلة (MERGE)');
                
                innerStage.append(dnaWrap, btn);
                break;
            }

            case 'MATH_SEQ': {
                let seq = document.createElement('div');
                seq.style.cssText = 'font-size: 3rem; color: var(--gold); font-family: monospace; letter-spacing: 10px; margin-bottom: 30px; text-shadow: 0 0 20px rgba(212,175,55,0.5);';
                seq.innerText = '2, 6, 12, 20, ?';
                innerStage.appendChild(seq);
                createInputBlock('الرقم المفقود...', p.ans);
                break;
            }

            case 'KEYPAD': {
                let kWrap = document.createElement('div'); 
                kWrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:15px; background:#111; padding:30px; border-radius:12px; border:2px solid #333; box-shadow:0 20px 40px rgba(0,0,0,0.8);';
                
                let kDisp = document.createElement('div'); 
                kDisp.style.cssText = 'grid-column:span 3; height:70px; background:#000; border:2px solid var(--gold); color:var(--gold); display:flex; justify-content:center; align-items:center; font-size:2.5rem; font-family:monospace; letter-spacing:15px; margin-bottom:15px; border-radius:6px; box-shadow:inset 0 0 20px rgba(212,175,55,0.2);';
                kDisp.innerText='_ _ _ _'; 
                kWrap.appendChild(kDisp);
                
                [1,2,3,4,5,6,7,8,9,'*',0,'#'].forEach((n) => {
                    let btn = document.createElement('div'); 
                    btn.className = 'interactive-element';
                    btn.style.cssText = 'width:80px; height:60px; background:linear-gradient(to bottom, #333, #111); border:1px solid #555; border-radius:6px; display:flex; justify-content:center; align-items:center; color:#fff; font-size:1.8rem; font-weight:bold; cursor:pointer; box-shadow:0 5px 10px rgba(0,0,0,0.5); user-select:none;';
                    btn.innerText = n;
                    
                    btn.onclick = () => {
                        if(typeof n === 'number') {
                            btn.style.transform='translateY(3px)'; 
                            setTimeout(()=>btn.style.transform='translateY(0)', 100);
                            
                            this.stageState.val = (this.stageState.val || '') + n;
                            kDisp.innerText = this.stageState.val.padEnd(p.ans.length,'_');
                            
                            if(this.stageState.val === p.ans) { 
                                kDisp.style.color = '#00ff66'; kDisp.style.borderColor = '#00ff66';
                                setTimeout(()=>this.winInteractive(), 500); 
                            } else if(this.stageState.val.length >= p.ans.length) { 
                                this.failRoom(); 
                                setTimeout(() => this.setupStage(), 800); 
                            }
                        }
                    }; 
                    kWrap.appendChild(btn);
                });
                innerStage.appendChild(kWrap);
                break;
            }

            case 'DETECTIVE': {
                let dWrap = document.createElement('div'); 
                dWrap.style.cssText = 'width:100%; max-width:650px; background:#1a1a1a; padding:40px; border-left:6px solid var(--gold); border-radius:8px; color:#ddd; font-size:1.6rem; line-height:2.2; box-shadow:inset 0 0 40px #000; margin-bottom:20px; font-family:"Traditional Arabic", serif; text-align:right; direction:rtl;';
                
                dWrap.innerHTML = `أفاد المتهم في شهادته: "غادرت مكتبي الساعة <span class="case-word" data-ans="0">الخامسة عصراً</span>، وتوجهت لسيارتي، كانت السماء <span class="case-word interactive-element" data-ans="1">تمطر بغزارة</span>. قمت بتشغيل <span class="case-word interactive-element" data-ans="0">المذياع</span> للاستماع للأخبار، ثم توقفت عند المقهى. شربت قهوتي تحت أشعة <span class="case-word interactive-element" data-ans="1">الشمس الحارقة</span>، وعدت للمنزل. في المساء، ارتديت <span class="case-word interactive-element" data-ans="1">نظارتي الشمسية</span> ونزلت للقبو المظلم لأتفقد الخزنة، وهناك اكتشفت السرقة."`;
                
                let selectedWords = new Set();
                
                dWrap.querySelectorAll('.case-word').forEach((el, index) => {
                    el.style.cssText = 'color:var(--gold); cursor:pointer; text-decoration:underline dashed #555; padding:0 8px; transition:0.2s; border-radius:4px;';
                    el.onclick = () => {
                        if(selectedWords.has(index)) { 
                            selectedWords.delete(index); 
                            el.style.background = 'transparent'; 
                            el.style.color = 'var(--gold)'; 
                        } else { 
                            selectedWords.add(index); 
                            el.style.background = 'var(--gold)'; 
                            el.style.color = '#000'; 
                        }
                    };
                });
                
                let btn = generateSubmitButton(() => {
                    let targets = [];
                    dWrap.querySelectorAll('.case-word').forEach((el, i) => { if(el.dataset.ans === "1") targets.push(i); });
                    
                    let isWin = targets.length === selectedWords.size && targets.every(t => selectedWords.has(t));
                    
                    if(isWin) this.winInteractive(); 
                    else {
                        this.failRoom();
                        selectedWords.clear();
                        dWrap.querySelectorAll('.case-word').forEach(el => { el.style.background = 'transparent'; el.style.color = 'var(--gold)'; });
                    }
                }, 'تقديم الأدلة للنيابة');
                
                innerStage.append(dWrap, btn);
                break;
            }

            default:
                let defaultMsg = document.createElement('div'); 
                defaultMsg.style.cssText = "color:var(--gold); font-family:monospace; font-size:1.5rem;"; 
                defaultMsg.innerText = "Error: Protocol Missing"; 
                innerStage.appendChild(defaultMsg);
                break;
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
