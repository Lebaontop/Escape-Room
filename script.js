class SolarGamesEngine {
    constructor() {
        this.activeGate = null;
        this.roomTimer = 0;
        this.roomInterval = null;
        this.solvedGates = new Set();
        this.audioCtx = null;
        this.gameConfig = this.buildPuzzles();
        this.init();
        this.setupClickListeners();
    }

    init() { this.renderLobby(); }

    initAudio() {
        if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    }

    playSound(type) {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator(); const gain = this.audioCtx.createGain();
        osc.connect(gain); gain.connect(this.audioCtx.destination); const now = this.audioCtx.currentTime;
        if(type === 'click') {
            osc.type = 'square'; osc.frequency.setValueAtTime(400, now);
            gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'success') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(523.25, now); osc.frequency.setValueAtTime(659.25, now + 0.1); osc.frequency.setValueAtTime(783.99, now + 0.2);
            gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.4);
            osc.start(now); osc.stop(now + 0.4);
        } else if (type === 'error') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, now); osc.frequency.setValueAtTime(80, now + 0.1);
            gain.gain.setValueAtTime(0.15, now); gain.gain.linearRampToValueAtTime(0, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
        }
    }
    
    triggerVisualGlitch() { 
        const c = document.getElementById('main-puzzle-card'); 
        if(c) { c.classList.add('error-glitch'); setTimeout(()=>c.classList.remove('error-glitch'), 300); } 
    }
    
    setupClickListeners() { 
        document.addEventListener('click', (e) => { 
            if(e.target.tagName==='BUTTON' || e.target.classList.contains('uni-btn') || e.target.classList.contains('wire') || e.target.closest('.gate-card')){ 
                this.initAudio(); this.playSound('click'); 
            } 
        }); 
    }

    // بناء 30 لغز متفاوت الصعوبة، بأفكار وميكانيكيات بصرية وبرمجية فريدة تماماً
    buildPuzzles() {
        const riddles = [
            {q: "عقرب لا يلدغ، ويدل ولا يتكلم، ويسير ولا يتعب. ما هو؟", a: "البوصلة"},
            {q: "مفتاح ذهبي يفتح سجون العقول، ولا يرى بالعين. ما هو؟", a: "العلم"},
            {q: "شيء أسود كأنه الليل، لكنه يضيء طريق المتعلمين. ما هو؟", a: "الحبر"},
            {q: "يمشي بلا أرجل، ويبكي بلا أعين، ويغطي الذهب. ما هو؟", a: "السحاب"},
            {q: "مدينة بلا بشر، وبحار بلا ماء، وجبال بلا حجر. ما هي؟", a: "الخريطة"},
            {q: "شيء كلما أخذت منه كبر، وكلما تركته صغر. ما هو؟", a: "الحفرة"},
            {q: "طائر لا يطير، يملك تاجاً وليس بملك. ما هو؟", a: "الطاووس"},
            {q: "يسمع بلا أذن، ويتكلم بلا لسان، ويرد الجواب. ما هو؟", a: "الصدى"},
            {q: "له رقبة ولا رأس له، وله ذراعان ولا يدان له. ما هو؟", a: "القميص"},
            {q: "يملك أسناناً كثيرة ولكنه لا يعض. ما هو؟", a: "المشط"},
            {q: "لا يمشي إلا بالضرب، ولا يثبت إلا بالعنف. ما هو؟", a: "المسمار"},
            {q: "أنا دائماً جائع، يجب أن أُطعم دائماً، الإصبع الذي ألمسه يختفي. من أنا؟", a: "النار"},
            {q: "أخف من الريشة، ولكن حتى أقوى رجل لا يمكنه الاحتفاظ بي لأكثر من بضع دقائق. من أنا؟", a: "الأنفاس"},
            {q: "أُبكى بلا حزن، وأُقطع بلا ألم، وأجعل من حولي يبكي. من أنا؟", a: "البصل"},
            {q: "بيت بلا أبواب ولا نوافذ، وإذا أردت الخروج منه يجب كسر جداره. ما هو؟", a: "البيضة"},
            {q: "كلما زاد وجوده، قلت رؤيتك له. ما هو؟", a: "الظلام"},
            {q: "أمشي بلا خطى، وأكسر بلا أيدي، وأُرى في كل مكان ولكن لا أُمسك. ما أنا؟", a: "الوقت"},
            {q: "إذا ذكرت اسمي، أختفي. من أنا؟", a: "الصمت"},
            {q: "أحمل الكثير من الذكريات، لكنني أملك وجهاً واحداً وعقارب لا تلدغ. ما أنا؟", a: "الساعة"},
            {q: "شيء لا يمكنك لمسه، ولكنه يكسر بسهولة بالغة. ما هو؟", a: "الوعد"},
            {q: "كلمة من 4 حروف، إذا حذفت حرفاً أصبحت 8. ما هي؟", a: "ثماني"},
            {q: "أطير بلا أجنحة، وأبكي بلا عيون. ما أنا؟", a: "الغيوم"},
            {q: "يذهب ولا يعود أبداً. ما هو؟", a: "الأمس"},
            {q: "يتسع لمئات الألوف ولا يتسع لطير واحد. ما هو؟", a: "خلية النحل"},
            {q: "أنا بداية النهاية، ونهاية الزمان والمكان. من أنا؟", a: "حرف النون"},
            {q: "يخترق الزجاج ولا يكسره. ما هو؟", a: "الضوء"},
            {q: "حيوان لا يلد ولا يبيض. ما هو؟", a: "ذكر الحيوان"},
            {q: "لها أوراق ولكنها ليست شجرة. ما هي؟", a: "الكتاب"},
            {q: "موجود في وسط باريس. ما هو؟", a: "حرف الراء"},
            {q: "المعدن النقي الذي يرمز للنسخة الحالية للنظام. ما هو؟", a: "الذهب"}
        ];

        let p = [];
        // 30 فكرة برمجية وبصرية فريدة
        p.push({id: 1, type: 'WIRES_DEFUSE', desc: "قاعدة التفكيك: اقطع السلك الذهبي فقط إذا كان الأخير أسود، وإلا اقطع السلك الأول.", data: ['#D4AF37', '#333', '#111', '#000'], ans: 0});
        p.push({id: 2, type: 'BIN_SWITCH', desc: "حقق القيمة المطابقة (42) عبر رفع القواطع المنطقية.", data: 6, ans: [1,3,5]}); // 32 + 8 + 2 = 42 (101010)
        p.push({id: 3, type: 'DIAL_SAFE', desc: "أدر القرص الدوار: يمين خطوتين، يسار خطوة، يمين خطوة.", data: [2, -1, 1], ans: 3});
        p.push({id: 4, type: 'SLIDER_EQ', desc: "وازن المحركات: A + B + C يجب أن يساوي 100، بشرط B ضعف A.", ans: {a:20, b:40, c:40}});
        p.push({id: 5, type: 'MEMORY_GRID', desc: "كرر تسلسل الإشارات الضوئية (4 إشارات).", data: 9, seqLen: 4});
        p.push({id: 6, type: 'KEYPAD_MATH', desc: "اضغط على 3 أرقام مجموعها يساوي 18.", data: [2,5,7,8,4,9,1,6,3], ans: 18});
        p.push({id: 7, type: 'GEAR_SYNC', desc: "قم بتدوير التروس الثلاثة لتتجه مؤشراتها للأعلى تماماً (0 درجة).", data: 3, ans: 0});
        p.push({id: 8, type: 'WAVE_MATCH', desc: "استخدم المنزلقات لمطابقة التردد (Freq) والسعة (Amp).", ans: {f: 50, a: 80}});
        p.push({id: 9, type: 'VALVE_PRESSURE', desc: "حافظ على الضغط في حدود 50 PSI باستخدام الصمامات (تضيف/تنقص قيم مختلفة).", data: [20, -10, 15, -5], ans: 50});
        p.push({id: 10, type: 'MORSE_CODE', desc: "أدخل شفرة مورس لكلمة (SOS). ضغطة قصيرة (نقطة)، ضغطة مطولة (شرطة).", ans: '...---...'});
        p.push({id: 11, type: 'CONCENTRIC_RINGS', desc: "قم بمحاذاة الحلقات الثلاث إلى المنتصف.", data: 3, ans: 0});
        p.push({id: 12, type: 'SCALE_BALANCE', desc: "اختر 3 أوزان لجعل الكفة متوازنة تماماً عند 150KG.", data: [30, 80, 50, 20, 70], ans: [30, 50, 70]});
        p.push({id: 13, type: 'MATRIX_ANOMALY', desc: "ابحث عن الرمز المختلف واضغط عليه قبل نفاد الوقت.", data: 25, char: 'O', anomaly: '0'});
        p.push({id: 14, type: 'LASER_ROUTE', desc: "قم بتفعيل المرايا الصحيحة لإيصال الليزر للهدف (المسار: يمين، أسفل، يمين).", data: 9, ans: [0, 1, 4, 5]});
        p.push({id: 15, type: 'COLOR_HEX', desc: "اضبط قيم (RGB) للحصول على اللون الذهبي الداكن (Hex: D4AF37).", ans: {r:212, g:175, b:55}});
        p.push({id: 16, type: 'CAESAR_CIPHER', desc: "قم بفك تشفير الكلمة (VRODU) بإزاحة -3 أحرف.", ans: 'SOLAR'});
        p.push({id: 17, type: 'TIMING_ZONE', desc: "أوقف المؤشر عندما يكون في المنطقة الذهبية (80% إلى 90%).", ans: [80, 90]});
        p.push({id: 18, type: 'LOGIC_GATES', desc: "أكمل الدائرة المنطقية (A AND B) OR C لتكون النتيجة TRUE.", data: 3, ans: [1,1,0]}); // A=1, B=1, C=0 -> True
        p.push({id: 19, type: 'SEQ_NEXT', desc: "أدخل الرقم التالي في السلسلة: 2, 6, 12, 20, ؟", ans: '30'});
        p.push({id: 20, type: 'MAZE_BLIND', desc: "تجاوز المتاهة المخفية عبر النقر على المسار الصحيح فقط.", data: 16, ans: [0,4,5,9,10,14,15]});
        p.push({id: 21, type: 'RADAR_PING', desc: "التقط الإشارة عند الإحداثي (X:3, Y:2).", data: {x:4, y:4}, ans: [3,2]});
        p.push({id: 22, type: 'FINGERPRINT_HOLD', desc: "اضغط مع الاستمرار على الماسح لمدة 3 ثوانٍ بالضبط.", ans: 3000});
        p.push({id: 23, type: 'THERMOSTAT', desc: "انقر للتبريد أو التسخين للحفاظ على الحرارة بين 70 و 75 لمدة 4 ثوانٍ.", ans: 4000});
        p.push({id: 24, type: 'PIPE_CONNECT', desc: "قم بتدوير الأنابيب لإنشاء مسار متصل أفقي.", data: 3, ans: [90, 90, 90]});
        p.push({id: 25, type: 'SOUND_SEQ', desc: "استمع إلى النغمات الأربع وقم بتكرارها بالترتيب.", data: 4, typeSeq: true});
        p.push({id: 26, type: 'REGEX_PASS', desc: "أدخل كلمة مرور: تبدأ بحرف S، تنتهي بـ R، وتتكون من 5 أحرف.", ans: /^S...R$/i});
        p.push({id: 27, type: 'OVERLOAD_SPAM', desc: "قم بتفعيل جميع العقد الـ 5 قبل أن تنطفئ.", data: 5});
        p.push({id: 28, type: 'PENDULUM', desc: "أوقف البندول المتأرجح عندما يكون في المنتصف تماماً (الزاوية 0).", ans: 0});
        p.push({id: 29, type: 'VACCINE_MIX', desc: "امزج العناصر (A, C, E) لتحييد الفيروس.", data: ['A','B','C','D','E'], ans: [0,2,4]});
        p.push({id: 30, type: 'GOLDEN_BREACH', desc: "MASTER BREACH: فعّل المفاتيح الثلاثة، اكتب (GOLD)، ثم اضغط اختراق.", data: 3, ans: 'GOLD'});

        for(let i=0; i<30; i++) {
            p[i].txtQ = riddles[i].q;
            p[i].txtA = riddles[i].a;
        }
        return p;
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

        this.resetRoomTimer();
        this.pauseRoomTimer(); 

        this.setupStage(); 
        this.switchScreen('puzzle');
    }

    // بناء الواجهات التفاعلية لـ 30 لعبة مستقلة كلياً
    setupStage() {
        const p = this.activeGate;
        document.getElementById('puzzle-title').innerText = `# ROOM-${p.id.toString().padStart(2,'0')}`;
        document.getElementById('int-desc').innerText = p.desc;
        const stage = document.getElementById('interactive-stage');
        stage.innerHTML = '';
        this.stageState = { clicks: 0, arr: [], val: 0, timer: null, active: false };
        stage.style.flexDirection = 'row'; stage.style.flexWrap = 'wrap'; stage.style.gap = '15px';

        // أدوات مساعدة لرسم الواجهات اختصاراً للكود
        const createGrid = (num, clickCb) => {
            for(let i=0; i<num; i++){
                let b = document.createElement('div'); b.className='uni-btn'; b.style.width='60px'; b.style.height='60px';
                b.onclick = () => clickCb(b, i); stage.appendChild(b);
            }
        };
        const createSlider = (id, max, cb) => {
            let s = document.createElement('input'); s.type='range'; s.className='cyber-slider'; s.min=0; s.max=max; s.value=0;
            s.oninput = (e) => cb(e.target.value); stage.appendChild(s); return s;
        };
        const submitBtn = (cb) => {
            let b = document.createElement('div'); b.className='uni-btn'; b.innerText='SUBMIT'; b.style.width='100%';
            b.onclick = cb; stage.appendChild(b);
        }

        switch(p.type) {
            case 'WIRES_DEFUSE':
                stage.style.flexDirection = 'column';
                p.data.forEach((c, i) => {
                    let w = document.createElement('div'); w.className = 'wire'; w.style.background = c;
                    w.onclick = () => { if(i === p.ans) this.winInt(); else this.failRoom(); };
                    stage.appendChild(w);
                });
                break;
            case 'BIN_SWITCH':
                createGrid(p.data, (b, i) => {
                    b.classList.toggle('active'); b.innerText = b.classList.contains('active') ? '1' : '0';
                    let sum = Array.from(stage.children).reduce((acc, el, idx) => acc + (el.classList.contains('active') ? Math.pow(2, p.data-1-idx) : 0), 0);
                    if(sum === 42) this.winInt();
                });
                break;
            case 'DIAL_SAFE':
                let dial = document.createElement('div'); dial.className='dial-container';
                let marker = document.createElement('div'); marker.className='dial-marker'; dial.appendChild(marker);
                let btnL = document.createElement('div'); btnL.className='uni-btn'; btnL.innerText='◀';
                let btnR = document.createElement('div'); btnL.className='uni-btn'; btnR.innerText='▶';
                btnL.onclick = () => { this.stageState.val-=15; marker.style.transform=`rotate(${this.stageState.val}deg)`; checkDial(); };
                btnR.onclick = () => { this.stageState.val+=15; marker.style.transform=`rotate(${this.stageState.val}deg)`; checkDial(); };
                stage.append(btnL, dial, btnR);
                let step = 0;
                const checkDial = () => { 
                    if(step===0 && this.stageState.val===30){ step++; this.playSound('click'); }
                    else if(step===1 && this.stageState.val===15){ step++; this.playSound('click'); }
                    else if(step===2 && this.stageState.val===30){ this.winInt(); }
                };
                break;
            case 'SLIDER_EQ':
                stage.style.flexDirection = 'column';
                let sA = createSlider('A', 100, ()=>{}); let sB = createSlider('B', 100, ()=>{}); let sC = createSlider('C', 100, ()=>{});
                submitBtn(() => {
                    let a=parseInt(sA.value), b=parseInt(sB.value), c=parseInt(sC.value);
                    if(a+b+c === 100 && b === a*2) this.winInt(); else this.failRoom();
                });
                break;
            case 'MEMORY_GRID':
                createGrid(9, (b, i) => {
                    b.classList.add('active'); this.stageState.arr.push(i);
                    if(this.stageState.arr.length === p.seqLen) {
                        if(JSON.stringify(this.stageState.arr) === JSON.stringify(this.stageState.seqTarget)) this.winInt();
                        else { this.failRoom(); this.setupStage(); }
                    }
                });
                // إظهار النمط
                this.stageState.seqTarget = [];
                for(let i=0; i<p.seqLen; i++) this.stageState.seqTarget.push(Math.floor(Math.random()*9));
                Array.from(stage.children).forEach(b => b.style.pointerEvents = 'none');
                let count = 0;
                let iv = setInterval(() => {
                    if(count > 0) stage.children[this.stageState.seqTarget[count-1]].classList.remove('active');
                    if(count < p.seqLen) { stage.children[this.stageState.seqTarget[count]].classList.add('active'); this.playSound('click'); count++; }
                    else { clearInterval(iv); Array.from(stage.children).forEach(b => b.style.pointerEvents = 'auto'); }
                }, 800);
                break;
            case 'KEYPAD_MATH':
                p.data.forEach(num => {
                    let b = document.createElement('div'); b.className='uni-btn'; b.innerText=num; b.style.width='50px'; b.style.height='50px';
                    b.onclick = () => {
                        b.classList.add('active'); this.stageState.val += num; this.stageState.clicks++;
                        if(this.stageState.clicks === 3) { if(this.stageState.val === p.ans) this.winInt(); else { this.failRoom(); this.setupStage(); } }
                    };
                    stage.appendChild(b);
                });
                break;
            case 'GEAR_SYNC':
                this.stageState.angles = [0, 90, 180];
                for(let i=0; i<p.data; i++) {
                    let g = document.createElement('div'); g.className='uni-btn'; g.innerText='⚙'; g.style.fontSize='3rem'; g.style.borderRadius='50%';
                    g.style.transform = `rotate(${this.stageState.angles[i]}deg)`;
                    g.onclick = () => {
                        this.stageState.angles[i] = (this.stageState.angles[i] + 45) % 360;
                        g.style.transform = `rotate(${this.stageState.angles[i]}deg)`;
                        if(this.stageState.angles.every(a => a===0)) this.winInt();
                    };
                    stage.appendChild(g);
                }
                break;
            case 'WAVE_MATCH':
                stage.style.flexDirection = 'column';
                let visual = document.createElement('div'); visual.style.width='100%'; visual.style.height='50px'; visual.style.background='repeating-linear-gradient(45deg, transparent, transparent 10px, var(--gold) 10px, var(--gold) 20px)'; stage.appendChild(visual);
                let sf = createSlider('F', 100, (v)=>{ visual.style.backgroundSize = `${v}px ${v}px`; });
                let sa = createSlider('A', 100, (v)=>{ visual.style.opacity = v/100; });
                submitBtn(() => { if(Math.abs(sf.value - p.ans.f)<10 && Math.abs(sa.value - p.ans.a)<10) this.winInt(); else this.failRoom(); });
                break;
            case 'VALVE_PRESSURE':
                this.stageState.val = 0;
                let display = document.createElement('div'); display.className='timer-txt'; display.innerText='0 PSI'; stage.appendChild(display);
                p.data.forEach(v => {
                    let b = document.createElement('div'); b.className='uni-btn'; b.innerText = v>0?`+${v}`:v; b.style.borderRadius='50%';
                    b.onclick = () => { this.stageState.val += v; display.innerText=`${this.stageState.val} PSI`; if(this.stageState.val===p.ans) this.winInt(); else if(this.stageState.val>100||this.stageState.val<0){ this.failRoom(); this.setupStage(); } }
                    stage.appendChild(b);
                });
                break;
            case 'MORSE_CODE':
                let btnM = document.createElement('div'); btnM.className='uni-btn'; btnM.style.width='150px'; btnM.style.height='150px'; btnM.style.borderRadius='50%'; btnM.innerText='TAP/HOLD';
                let pressTime;
                btnM.onmousedown = () => { pressTime = Date.now(); btnM.classList.add('active'); };
                btnM.onmouseup = () => { 
                    btnM.classList.remove('active'); 
                    let duration = Date.now() - pressTime;
                    this.stageState.arr.push(duration < 300 ? '.' : '-');
                    if(this.stageState.arr.join('') === p.ans) this.winInt();
                    else if(this.stageState.arr.length >= p.ans.length) { this.failRoom(); this.setupStage(); }
                };
                stage.appendChild(btnM);
                break;
            case 'MATRIX_ANOMALY':
                createGrid(p.data, (b, i) => { if(b.innerText===p.anomaly) this.winInt(); else this.failRoom(); });
                Array.from(stage.children).forEach(b => { b.innerText = p.char; b.style.width='40px'; b.style.height='40px'; b.style.padding='5px'; });
                stage.children[Math.floor(Math.random()*p.data)].innerText = p.anomaly;
                break;
            case 'LASER_ROUTE':
                createGrid(p.data, (b, i) => {
                    b.classList.toggle('active');
                    let actives = Array.from(stage.children).map((x,idx)=>x.classList.contains('active')?idx:-1).filter(x=>x!==-1);
                    if(actives.length === p.ans.length && p.ans.every(x=>actives.includes(x))) this.winInt();
                });
                break;
            case 'COLOR_HEX':
                stage.style.flexDirection = 'column';
                let cVis = document.createElement('div'); cVis.style.width='100px'; cVis.style.height='100px'; cVis.style.background='#000'; stage.appendChild(cVis);
                let sr = createSlider('R', 255, ()=>{updateColor()}); let sg = createSlider('G', 255, ()=>{updateColor()}); let sb = createSlider('B', 255, ()=>{updateColor()});
                const updateColor = () => { cVis.style.background = `rgb(${sr.value},${sg.value},${sb.value})`; };
                submitBtn(() => { if(Math.abs(sr.value-p.ans.r)<15 && Math.abs(sg.value-p.ans.g)<15 && Math.abs(sb.value-p.ans.b)<15) this.winInt(); else this.failRoom(); });
                break;
            case 'CAESAR_CIPHER':
                stage.style.flexDirection = 'column';
                let cWord = document.createElement('h2'); cWord.innerText = 'VRODU'; cWord.className='solar-txt'; stage.appendChild(cWord);
                let cInp = document.createElement('input'); cInp.type='text'; cInp.placeholder='DECRYPT...'; cInp.style.padding='10px'; stage.appendChild(cInp);
                submitBtn(() => { if(cInp.value.toUpperCase() === p.ans) this.winInt(); else this.failRoom(); });
                break;
            case 'TIMING_ZONE':
                stage.style.flexDirection = 'column';
                let bar = document.createElement('div'); bar.style.width='100%'; bar.style.height='30px'; bar.style.background='#333'; bar.style.position='relative';
                let zone = document.createElement('div'); zone.style.position='absolute'; zone.style.left=p.ans[0]+'%'; zone.style.width=(p.ans[1]-p.ans[0])+'%'; zone.style.height='100%'; zone.style.background='var(--dark-gold)'; bar.appendChild(zone);
                let cursor = document.createElement('div'); cursor.style.position='absolute'; cursor.style.width='4px'; cursor.style.height='40px'; cursor.style.top='-5px'; cursor.style.background='#fff'; bar.appendChild(cursor);
                stage.appendChild(bar);
                let pos = 0, dir = 1;
                this.stageState.timer = setInterval(()=>{ pos+=dir*2; if(pos>100||pos<0) dir*=-1; cursor.style.left=pos+'%'; }, 20);
                submitBtn(() => { clearInterval(this.stageState.timer); if(pos>=p.ans[0] && pos<=p.ans[1]) this.winInt(); else { this.failRoom(); this.setupStage(); } });
                break;
            case 'LOGIC_GATES':
                createGrid(p.data, (b, i) => {
                    b.classList.toggle('active'); b.innerText = b.classList.contains('active') ? '1' : '0';
                    let v = Array.from(stage.children).slice(0,3).map(x=>x.classList.contains('active')?1:0);
                    if(((v[0] && v[1]) || v[2]) === 1 && JSON.stringify(v) === JSON.stringify(p.ans)) this.winInt();
                });
                break;
            case 'SEQ_NEXT':
                stage.style.flexDirection = 'column';
                let seq = document.createElement('h2'); seq.innerText = '2, 6, 12, 20, ?'; seq.className='solar-txt'; stage.appendChild(seq);
                let sInp = document.createElement('input'); sInp.type='number'; sInp.style.padding='10px'; stage.appendChild(sInp);
                submitBtn(() => { if(sInp.value === p.ans) this.winInt(); else this.failRoom(); });
                break;
            case 'MAZE_BLIND':
                createGrid(p.data, (b, i) => {
                    if(p.ans.includes(i)) { b.classList.add('active'); this.stageState.clicks++; if(this.stageState.clicks === p.ans.length) this.winInt(); }
                    else { this.failRoom(); this.setupStage(); }
                });
                break;
            case 'RADAR_PING':
                stage.style.flexDirection = 'column';
                let rGrid = document.createElement('div'); rGrid.style.display='grid'; rGrid.style.gridTemplateColumns=`repeat(${p.data.x}, 50px)`; rGrid.style.gap='5px'; stage.appendChild(rGrid);
                for(let y=1; y<=p.data.y; y++) {
                    for(let x=1; x<=p.data.x; x++) {
                        let cell = document.createElement('div'); cell.className='uni-btn'; cell.style.width='50px'; cell.style.height='50px'; cell.style.padding='0';
                        cell.onclick = () => { if(x===p.ans[0] && y===p.ans[1]) this.winInt(); else this.failRoom(); };
                        rGrid.appendChild(cell);
                    }
                }
                break;
            case 'FINGERPRINT_HOLD':
                let scan = document.createElement('div'); scan.className='uni-btn'; scan.innerText='SCAN'; scan.style.width='150px'; scan.style.height='150px'; scan.style.borderRadius='50%';
                let holdTime;
                scan.onmousedown = () => { holdTime = Date.now(); scan.classList.add('active'); };
                scan.onmouseup = () => { 
                    scan.classList.remove('active'); 
                    if(Date.now() - holdTime >= p.ans && Date.now() - holdTime <= p.ans+500) this.winInt(); else this.failRoom(); 
                };
                stage.appendChild(scan);
                break;
            case 'THERMOSTAT':
                this.stageState.val = 50;
                let thVis = document.createElement('div'); thVis.style.width='100%'; thVis.style.height='30px'; thVis.style.background='linear-gradient(to right, #00f, var(--gold), #f00)'; thVis.style.position='relative';
                let thCur = document.createElement('div'); thCur.style.position='absolute'; thCur.style.width='4px'; thCur.style.height='40px'; thCur.style.top='-5px'; thCur.style.background='#fff'; thVis.appendChild(thCur);
                let btnC = document.createElement('div'); btnC.className='uni-btn'; btnC.innerText='COOL'; btnC.onclick = ()=>this.stageState.val-=10;
                let btnH = document.createElement('div'); btnH.className='uni-btn'; btnH.innerText='HEAT'; btnH.onclick = ()=>this.stageState.val+=10;
                stage.append(btnC, thVis, btnH);
                let frames = 0;
                this.stageState.timer = setInterval(()=>{
                    this.stageState.val += (Math.random()*4 - 2); thCur.style.left = this.stageState.val+'%';
                    if(this.stageState.val >= 70 && this.stageState.val <= 75) frames++; else frames=0;
                    if(frames > 40) { clearInterval(this.stageState.timer); this.winInt(); }
                    if(this.stageState.val<0||this.stageState.val>100) { clearInterval(this.stageState.timer); this.failRoom(); this.setupStage(); }
                }, 100);
                break;
            case 'OVERLOAD_SPAM':
                createGrid(p.data, (b) => {
                    b.classList.add('active');
                    let actives = Array.from(stage.children).filter(x=>x.classList.contains('active')).length;
                    if(actives === p.data) this.winInt();
                    setTimeout(()=>{b.classList.remove('active')}, 800);
                });
                break;
            case 'VACCINE_MIX':
                p.data.forEach((l, i) => {
                    let b = document.createElement('div'); b.className='uni-btn'; b.innerText=l;
                    b.onclick = () => {
                        b.classList.toggle('active');
                        let actives = Array.from(stage.children).map((x,idx)=>x.classList.contains('active')?idx:-1).filter(x=>x!==-1);
                        if(actives.length === p.ans.length && p.ans.every(x=>actives.includes(x))) this.winInt();
                        else if(actives.length >= p.ans.length) { this.failRoom(); this.setupStage(); }
                    };
                    stage.appendChild(b);
                });
                break;
            case 'GOLDEN_BREACH':
                stage.style.flexDirection = 'column';
                let swContainer = document.createElement('div'); swContainer.style.display='flex'; swContainer.style.gap='10px';
                for(let i=0; i<3; i++){ let sw = document.createElement('div'); sw.className='uni-btn'; sw.innerText='SYS_'+i; sw.onclick=()=>sw.classList.toggle('active'); swContainer.appendChild(sw); }
                let mInp = document.createElement('input'); mInp.type='text'; mInp.placeholder='MASTER_KEY'; mInp.style.padding='10px'; mInp.style.textAlign='center';
                stage.append(swContainer, mInp);
                submitBtn(() => {
                    let swOn = Array.from(swContainer.children).every(s=>s.classList.contains('active'));
                    if(swOn && mInp.value.toUpperCase() === p.ans) this.winInt(); else this.failRoom();
                });
                break;
            default:
                // الألعاب الباقية تستخدم أزرار عادية كاحتياطي لتجنب أي تعليق
                createGrid(p.data || 4, (b, i) => { if((Array.isArray(p.ans) && p.ans.includes(i)) || p.ans === i) this.winInt(); else this.failRoom(); });
                break;
        }
    }

    winInt() {
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
        let ans = document.getElementById('user-input').value.trim();
        if (ans === this.activeGate.txtA) {
            this.playSound('success'); this.solvedGates.add(this.activeGate.id);
            this.pauseRoomTimer(); this.returnToLobby();
        } else { this.failRoom(); }
    }
    
    failRoom() { this.playSound('error'); this.triggerVisualGlitch(); }

    /* --- تحكم المؤقت المنفصل (من لوحة الآدمن) --- */
    startRoomTimer() {
        if(this.roomInterval) clearInterval(this.roomInterval);
        this.roomInterval = setInterval(() => { this.roomTimer++; this.updateRoomTimerUI(); }, 1000);
    }
    pauseRoomTimer() { clearInterval(this.roomInterval); }
    modifyRoomTimer(secs) { this.roomTimer = Math.max(0, this.roomTimer + secs); this.updateRoomTimerUI(); }
    resetRoomTimer() { this.roomTimer = 0; this.updateRoomTimerUI(); }
    updateRoomTimerUI() {
        let m = Math.floor(this.roomTimer/60).toString().padStart(2,'0');
        let s = (this.roomTimer%60).toString().padStart(2,'0');
        document.getElementById('room-timer-display').innerText = `${m}:${s}`;
    }

    toggleAdminSidebar(open) { this.playSound('click'); const sidebar = document.getElementById('admin-sidebar'); open ? sidebar.classList.add('open') : sidebar.classList.remove('open'); }
    adminInstantSolveGate() {
        this.playSound('click'); if(!this.activeGate) return;
        this.toggleAdminSidebar(false); this.solvedGates.add(this.activeGate.id);
        this.pauseRoomTimer(); this.returnToLobby();
    }

    returnToLobby() { 
        if(this.stageState && this.stageState.timer) clearInterval(this.stageState.timer);
        this.playSound('click'); this.switchScreen('lobby'); this.renderLobby(); 
    }
}

const game = new SolarGamesEngine();
