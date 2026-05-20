class MajesticEscape {
    constructor() {
        this.coins = 60;
        this.activeGate = null;
        this.timer = null;
        this.timeLeft = 5400; // 90 دقيقة
        this.isPaused = false;
        this.isTimerFrozen = false; 
        this.hasShield = false;      
        this.solvedGates = new Set();
        
        this.wireSeq = []; 
        this.safeInputs = []; this.safeTarget = [];
        this.gridState = { selections: [], step: 0, sequence: [], pairs: [] };

        // أصوات الجيمنج والديسكورد (Mechanical & Cyber)
        this.sounds = {
            beep: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'), // Mechanical Click
            error: new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'), // Cyber Error/Mute
            success: new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3') // Level Up Success
        };

        this.puzzles = this.buildPuzzles();
        this.init();
        this.setupClickSounds();
    }

    init() { this.renderLobby(); this.updateStats(); this.startTimer(); }
    
    playSound(t) { 
        if(this.sounds[t]) { 
            this.sounds[t].currentTime = 0; 
            // خفض الصوت قليلاً عشان ما يزعج بالبث
            this.sounds[t].volume = (t === 'beep') ? 0.4 : 0.7; 
            this.sounds[t].play().catch(e=>{}); 
        } 
    }
    
    triggerVisualGlitch() { const c = document.getElementById('main-puzzle-card'); if(c) { c.classList.add('error-glitch'); setTimeout(()=>c.classList.remove('error-glitch'), 400); } }
    
    setupClickSounds() { 
        document.addEventListener('click', (e) => { 
            if(e.target.tagName==='BUTTON' || e.target.classList.contains('wire') || e.target.classList.contains('grid12-btn') || e.target.classList.contains('gate-card')){ 
                this.playSound('beep'); 
            } 
        }); 
    }

    // الـ 30 لعبة المصممة للنقاش (الـ Logic) بدون ألعاب سرعة
    buildPuzzles() {
        const games = [
            { id: 1, type: 'WIRE', hint: "اقطع الأزرق فقط", desc: "Logic Bomb: لديك 4 مسارات (أحمر، أزرق، أصفر، أخضر). الشروط: إذا كان رقم الروم زوجي، ولا يوجد مسار أصفر، اقطع الأزرق. وإلا اقطع الأحمر. (ماذا تقطع؟)", ans: ["blue"], txtQ: "أحياناً الكلمات الأولى تكشف المستور في السيرفر.", txtA: "شفرة" },
            { id: 2, type: 'GRID12', mode: 'QUIZ', desc: "رسالة البوت: 'سرنا وراء لوحات الأمان، رغم أنف الرقابة.' استخرج الكلمة السرية من أوائل الكلمات.", opts: ["سور", "سرار", "سولار", "سار", "سلام", "سهم", "سد", "SOLAR", "أمان", "رقابة", "متحدث", "نظام"], ans: ["SOLAR"], hint: "الحروف الأولى (س و ل ا ر)", txtQ: "من أنا؟ آلة تمتلك ذاكرة ولا تنسى، تتحدث بصمت.", txtA: "كمبيوتر" },
            { id: 3, type: 'GRID12', mode: 'QUIZ', desc: "فخ الـ Hosts: السيرفر 1 يقول 'الثاني يكذب'. السيرفر 2 يقول 'السيرفر 3 هو الآمن'. السيرفر 3 يقول 'الأول يصدق'. من هو السيرفر الآمن؟", opts: ["السيرفر 1", "السيرفر 2", "السيرفر 3", "السيرفر 4", "السيرفر 5", "السيرفر 6", "الراوتر", "الهوست", "الدومين", "الشبكة", "جميعهم", "لا أحد"], ans: ["السيرفر 3"], hint: "إذا كان 1 يصدق، فـ 2 يكذب، و 3 ليس آمناً.. فكر بالعكس.", txtQ: "مساحة 5 جيجا ومساحة 3 جيجا. كم خطوة للنقل حتى تحصل على 4 جيجا بالضبط؟", txtA: "7 خطوات" },
            { id: 4, type: 'SAFE', hint: "15", desc: "Magic Square: إذا كان المركز يحمل الرقم 9، كم يجب أن يكون المجموع المتطابق لكل صف وعمود؟ أدخل الرقم.", ans: [0,0,1,5], txtQ: "ما هو الكود اللوني السداسي الدقيق لذهبي شركة بورش الكلاسيكية؟", txtA: "D4AF37" },
            { id: 5, type: 'GRID12', mode: 'QUIZ', desc: "Rogue User: 4 أعضاء. المخرب انضم بعد 2020، يمتلك رتبة Admin، ولا يعمل في قسم الدعم. من هو؟", opts: ["أحمد (2019، أدمن، دعم)", "خالد (2021، أدمن، برمجة)", "ياسر (2022، يوزر، دعم)", "سعد (2020، أدمن، حماية)", "فهد", "بدر", "تركي", "نواف", "سالم", "فيصل", "عمر", "علي"], ans: ["خالد (2021، أدمن، برمجة)"], hint: "2021 وأدمن", txtQ: "الإحداثيات باللعبة: ليس صف A، ولا عمود 3، ومجاور لـ C2.", txtA: "B2" },
            { id: 6, type: 'GRID12', mode: 'SEQ', desc: "ترتيب الكود المنطقي: رتب الأوامر ليعمل السكربت بشكل صحيح.", opts: ["Execute", "Format", "Delete", "Bypass", "Start", "Override", "Save", "Load", "Compile", "Run", "Exit", "Pause"], ans: ["Start", "Bypass", "Override", "Execute"], hint: "ابدأ، تخطى، اكتب فوق، نفذ.", txtQ: "Venn Diagram: أين نضع الحماية الأساسية في التقاطعات الثلاث؟", txtA: "المركز" },
            { id: 7, type: 'GRID12', mode: 'MULTI', target: 3, desc: "Glitch Art: استبعد 3 أشياء برمجية خاطئة أو غير منطقية في المعرض السريالي.", opts: ["بطة بشماغ", "شاشة", "كنب كروكس", "جوال", "تلفزيون بحوض سمك", "كيبل", "ماوس", "سيرفر", "راوتر", "كاميرا", "هاردسك", "ميكروفون"], ans: ["بطة بشماغ", "كنب كروكس", "تلفزيون بحوض سمك"], hint: "الأشياء الغريبة والمضحكة", txtQ: "الأزرار المعدلة كم عددها في اللوحة الثانية؟", txtA: "3" },
            { id: 8, type: 'GRID12', mode: 'QUIZ', desc: "Hex Match: ما هو الكود الدقيق للون الذهبي الفخم في نظام SOLAR؟", opts: ["#FFF", "#000", "#FFD700", "#D4AF37", "#CBA135", "#111", "#999", "#888", "#777", "#666", "#555", "#444"], ans: ["#D4AF37"], hint: "يبدأ بحرف D", txtQ: "أي مخرج (A, B, C, D) يؤدي له المدخل المعقد في المتاهة المتقاطعة؟", txtA: "C" },
            { id: 9, type: 'GRID12', mode: 'PAIRS', desc: "Duplicate Accounts: طابق الحسابين المتطابقين تماماً بنسبة 100%.", opts: ["Ω","Ω","Σ","Σ","Δ","Δ","Φ","Φ","Ψ","Ψ","Θ","Θ"], hint: "ركز على الحروف اليونانية", txtQ: "سيارة بورش 911، شمس، سبيكة، تاج. ما هو الرابط الذهبي؟", txtA: "SOLAR" },
            { id: 10, type: 'GRID12', mode: 'QUIZ', desc: "زوايا الـ 3D: مجسم هرمي يُعرض من الأعلى كنقطة في مربع، كيف يبدو شكله من الجانب؟", opts: ["دائرة", "مثلث", "مربع", "مستطيل", "نجمة", "خط مستقيم", "نقطة", "مخروط", "أسطوانة", "مكعب", "سداسي", "شبه منحرف"], ans: ["مثلث"], hint: "له قاعدة وجوانب مائلة", txtQ: "أي خلية في الشبكة سيضربها الليزر بعد الانعكاس الثالث؟", txtA: "A4" },
            { id: 11, type: 'GRID12', mode: 'QUIZ', desc: "Ray Tracing: ليزر ينطلق يميناً، يضرب مرآة مائلة (/)، أين يتجه؟", opts: ["أعلى", "أسفل", "يمين", "يسار", "يتوقف", "ينعكس خلفاً", "ينفجر", "أمام", "قطري", "يختفي", "A1", "A4"], ans: ["أعلى"], hint: "مرآة / تعكسه للأعلى", txtQ: "الظل الخادع: أي ظل (1، 2، 3، 4) يطابق الشكل المعقد؟", txtA: "3" },
            { id: 12, type: 'GRID12', mode: 'QUIZ', desc: "محاذاة التروس: 3 تروس (أ، ب، ج) متشابكة. إذا دار الترس (أ) لليمين، كيف سيدور الترس (ج)؟", opts: ["يمين", "يسار", "أعلى", "أسفل", "يتوقف", "ينكسر", "سريع", "بطيء", "عشوائي", "دائري", "ثابت", "متذبذب"], ans: ["يمين"], hint: "أ يمين -> ب يسار -> ج يمين", txtQ: "تشفير قيصر (Caesar Cipher) بمقدار +3 لكلمة KHOOR ماذا تعني؟", txtA: "HELLO" },
            { id: 13, type: 'GRID12', mode: 'QUIZ', desc: "الترجمة الثنائية (Binary): حول الرقم 1011 إلى النظام العشري.", opts: ["8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"], ans: ["11"], hint: "8 + 2 + 1", txtQ: "مورس الثابت: ماذا تعني النبضات (... --- ...)؟", txtA: "SOS" },
            { id: 14, type: 'GRID12', mode: 'MULTI', target: 4, desc: "كلمة السر الممزقة: استخرج حروف كلمة GOLD من القصاصات.", opts: ["G", "A", "B", "O", "X", "L", "Y", "Z", "D", "M", "N", "P"], ans: ["G", "O", "L", "D"], hint: "أربعة حروف", txtQ: "لغة الهاكرز (Leetspeak): ماذا تعني رسالة 50L4R؟", txtA: "SOLAR" },
            { id: 15, type: 'GRID12', mode: 'QUIZ', desc: "الجناس الناقص (Anagram): أعد ترتيب حروف T E N I R N E T لتكوين كلمة تقنية.", opts: ["INTRANET", "INTERNET", "ETHERNET", "TENANT", "RETENT", "NINTENDO", "TENT", "RENT", "ENTER", "NET", "TIN", "RETIN"], ans: ["INTERNET"], hint: "شبكة عالمية", txtQ: "الرسالة المحذوفة (Log File): Error 404 ___ Not Found. ما هي الكلمة الناقصة؟", txtA: "Page" },
            { id: 16, type: 'GRID12', mode: 'QUIZ', desc: "تشفير الكيبورد: الحرف الذي يقع يمين W وأسفل R في الكيبورد الإنجليزي القياسي هو:", opts: ["E", "T", "D", "F", "G", "S", "A", "Q", "Y", "H", "J", "K"], ans: ["F"], hint: "انظر للكيبورد أمامك", txtQ: "تحدي الزعيم النهائي: ما هو أثمن معدن في هذه النسخة؟", txtA: "الذهب" },
            { id: 17, type: 'WIRE', hint: "اقطع الأحمر", desc: "تفكيك القنبلة 2: إذا كان هناك مسار أحمر، اقطعه. وإلا اقطع الأخضر.", ans: ["red"], txtQ: "شيء كلما زاد، قلّت رؤيتك له. ما هو؟", txtA: "الظلام" },
            { id: 18, type: 'SAFE', hint: "2026", desc: "أدخل سنة الإصدار المتوقعة لاقتحام النظام.", ans: [2,0,2,6], txtQ: "يتحدث بلا فم ويسمع بلا أذنين؟", txtA: "الصدى" },
            { id: 19, type: 'GRID12', mode: 'QUIZ', desc: "الرابط: سيارة 911، شمس، كنز", opts: ["سرعة", "حرارة", "مال", "أصفر", "ذهبي", "أحمر", "نار", "SOLAR", "قوة", "محرك", "نور", "فضاء"], ans: ["SOLAR"], hint: "النسخة الحالية", txtQ: "لها عقارب ولكن لا تلدغ؟", txtA: "الساعة" },
            { id: 20, type: 'GRID12', mode: 'SEQ', desc: "سلسلة التايم لاين: رتب الأحداث (ولادة، طفولة، شباب، شيب)", opts: ["عصا", "زواج", "مدرسة", "مهد", "جامعة", "سيارة", "عمل", "مستشفى", "تقاعد", "طفولة", "شباب", "شيب"], ans: ["مهد", "طفولة", "شباب", "شيب"], hint: "من البداية للنهاية", txtQ: "أخضر من الخارج، أحمر من الداخل؟", txtA: "البطيخ" },
            { id: 21, type: 'GRID12', mode: 'QUIZ', desc: "تردد الروم الصوتي: اختر التردد الصحيح لإشارة الاستغاثة", opts: ["88.1", "90.5", "92.3", "95.5", "98.0", "100.1", "101.5", "103.3", "105.7", "107.9", "110.0", "112.5"], ans: ["101.5"], hint: "يبدأ بـ 101", txtQ: "يبكي دمعًا أسود ليضيء العقول؟", txtA: "القلم" },
            { id: 22, type: 'GRID12', mode: 'MULTI', target: 3, desc: "ضغط الملفات: اختر 3 أوزان مجموعها 500g", opts: ["50", "100", "150", "200", "250", "300", "350", "400", "450", "500", "550", "600"], ans: ["100", "150", "250"], hint: "100 + 150 + 250", txtQ: "تسمعها ولكن لا تراها ولا تلمسها؟", txtA: "الريح" },
            { id: 23, type: 'GRID12', mode: 'QUIZ', desc: "تناقض الألوان بالواجهة: الكلمة 'أحمر' مكتوبة بلون أزرق، ماذا تختار؟", opts: ["أحمر", "أخضر", "أصفر", "أزرق", "أسود", "أبيض", "برتقالي", "بنفسجي", "وردي", "بني", "رمادي", "سماوي"], ans: ["أزرق"], hint: "اللون لا الكلمة", txtQ: "يملكه الشخص ويستخدمه الآخرون أكثر منه؟", txtA: "الاسم" },
            { id: 24, type: 'GRID12', mode: 'QUIZ', desc: "متوالية البنج (Ping): 2، 4، 8، ... ، 32", opts: ["10", "12", "14", "16", "18", "20", "22", "24", "26", "28", "30", "34"], ans: ["16"], hint: "مضاعفات", txtQ: "يسقط ولا يتأذى أبدًا؟", txtA: "المطر" },
            { id: 25, type: 'GRID12', mode: 'PAIRS', desc: "الأيقونات المتضادة: طابق كل شيء بعكسه", opts: ["🔥","❄️","☀️","🌙","⬆️","⬇️","😊","😢","🔓","🔒","🟢","🔴"], hint: "نار وثلج", txtQ: "كلمة من 4 حروف، إذا أكلت نصفها تموت؟", txtA: "سمسم" },
            { id: 26, type: 'GRID12', mode: 'MULTI', target: 3, desc: "تتبع أخطاء السيرفر: حدد الـ 3 رومات المصابة", opts: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], ans: ["3", "7", "11"], hint: "العمود الثالث", txtQ: "تحترق وتبكي لتضيء للآخرين؟", txtA: "الشمعة" },
            { id: 27, type: 'GRID12', mode: 'SEQ', desc: "سيرفر تصاعدي: رتب البورتات تصاعدياً", opts: ["10", "40", "20", "30", "15", "25", "35", "45", "5", "50", "55", "60"], ans: ["10", "20", "30", "40"], hint: "عشرات", txtQ: "مدينة سعودية تقرأ طرديا وعكسيا نفس الشيء؟", txtA: "العلا" },
            { id: 28, type: 'GRID12', mode: 'MULTI', target: 5, desc: "مكافحة الفيروسات: حدد جميع الفيروسات (V)", opts: ["V", "O", "O", "V", "O", "O", "V", "O", "O", "V", "V", "O"], ans: ["V"], hint: "كل V", txtQ: "كلما أخذت منه أكثر، تركت أكثر وراءك؟", txtA: "الخطوة" },
            { id: 29, type: 'GRID12', mode: 'QUIZ', desc: "أوجد الكلمة المخفية في اللوجو الكبير", opts: ["نور", "ظل", "سر", "لغز", "مفتاح", "باب", "زمن", "وقت", "نهاية", "بداية", "حل", "هرب"], ans: ["سر"], hint: "سر", txtQ: "كلما أخذت منه كبر؟", txtA: "الحفرة" },
            { id: 30, type: 'GRID12', mode: 'QUIZ', desc: "تحدي الزعيم: ما هو أثمن شيء في SOLAR GAMES؟", opts: ["حديد", "نحاس", "فضة", "ألماس", "بلاتين", "برونز", "الذهب", "قصدير", "زنك", "رصاص", "تيتانيوم", "زئبق"], ans: ["الذهب"], hint: "Edition", txtQ: "ابن الماء، وإذا وضعته في الماء مات. فما هو؟", txtA: "الثلج" }
        ];

        return games.map(p => ({
            id: p.id, type: p.type, mode: p.mode, target: p.target, opts: p.opts, ans: p.ans, desc: p.desc,
            title: `# ROOM-${p.id.toString().padStart(2,'0')}`, textDesc: p.txtQ, textAns: p.txtA,
            gameHint: p.hint, textHint: `الجواب: ${p.txtA}`
        }));
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
        this.activeGate = this.puzzles.find(x => x.id === id);
        this.hasShield = false;
        this.setupPuzzleUI(); 
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
        else if(p.type === "GRID12") this.setupGrid12Game();
    }

    /* --- الألعاب التفاعلية --- */
    setupWireGame() {
        document.getElementById('game-wire').classList.remove('hidden');
        document.getElementById('wire-desc').innerText = this.activeGate.desc;
        const c = document.getElementById('wire-container'); c.innerHTML = ''; this.wireSeq = [];
        let colors = ["red", "blue", "yellow", "green"];
        let target = this.activeGate.ans;
        
        colors.forEach(col => {
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
        document.getElementById('safe-desc').innerText = this.activeGate.desc;
        const inps = document.getElementById('safe-inputs'); inps.innerHTML = ''; 
        const pad = document.getElementById('safe-keypad'); pad.innerHTML = '';
        document.getElementById('safe-history').innerHTML = '';
        this.safeTarget = this.activeGate.ans; 
        this.safeInputs = [];
        
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
        if(correctCount === 4) this.winMiniGame(); else this.failMiniGame("Password Incorrect!");
    }

    setupGrid12Game() {
        document.getElementById('game-grid12').classList.remove('hidden');
        const p = this.activeGate;
        document.getElementById('grid12-desc').innerText = p.desc;
        const c = document.getElementById('grid12-box'); c.innerHTML = '';
        const subBtn = document.getElementById('grid12-submit'); subBtn.classList.add('hidden');
        
        this.gridState = { selections: [], step: 0, pairs: [] };
        let opts = [...p.opts];
        if(p.mode !== 'SEQ') opts.sort(() => Math.random() - 0.5); 

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
            else this.failMiniGame("Wrong Answer!");
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
                this.failMiniGame("Sequence Error!"); this.setupGrid12Game();
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
                    if(c1.opt === c2.opt) {
                        c1.btn.classList.replace('selected', 'matched'); c2.btn.classList.replace('selected', 'matched');
                        this.playSound('success'); this.gridState.step += 2;
                        if(this.gridState.step === p.opts.length) this.winMiniGame();
                    } else {
                        c1.btn.classList.remove('selected'); c2.btn.classList.remove('selected'); this.failMiniGame("No Match!");
                    }
                    this.gridState.pairs = [];
                }, 500);
            }
        }
    }

    checkGrid12() {
        const p = this.activeGate;
        let selected = this.gridState.selections;
        let isCorrect = selected.length === p.ans.length && selected.every(val => p.ans.includes(val) || p.ans[0] === "V"); 
        
        if (isCorrect) this.winMiniGame();
        else { this.failMiniGame("Selection Incorrect!"); this.setupGrid12Game(); }
    }

    /* --- النجاح، الفشل، والعداد --- */
    winMiniGame() {
        this.playSound('success'); this.notify("✅ Access Granted!");
        document.getElementById('interactive-stage').classList.add('hidden');
        document.getElementById('text-stage').classList.remove('hidden');
        document.getElementById('input-area').classList.remove('hidden');
    }
    
    failMiniGame(msg = "Access Denied!") {
        this.playSound('error'); this.triggerVisualGlitch(); this.notify(msg, "error"); 
        if(!this.isTimerFrozen && !this.hasShield) this.timeLeft -= 15; // عقوبة الوقت
    }

    checkResult() {
        let answerInput = document.getElementById('user-input').value.trim();
        if (answerInput === this.activeGate.textAns) {
            this.playSound('success'); this.coins += 20;
            this.solvedGates.add(this.activeGate.id); this.notify("✅ Room Unlocked!");
            this.updateStats(); this.renderLobby(); this.switchScreen('lobby');
        } else {
            if (this.hasShield) {
                this.hasShield = false;
                this.notify("🛡️ Shield Activated! No time penalty.");
                this.playSound('success');
                return;
            }
            this.failMiniGame(`Bot: Answer Incorrect!`);
        }
    }

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

    /* --- المتجر وصلاحيات المشرف --- */
    openMarket() { document.getElementById('panel-market').classList.remove('hidden'); }
    closeMarket() { document.getElementById('panel-market').classList.add('hidden'); }
    buy(type) {
        let prices = { hint: 30, shield: 40, time: 60 };
        if (this.coins < prices[type]) return this.failMiniGame("Not enough coins!");
        if (type === 'shield' && this.hasShield) return alert("Shield already active!");

        this.coins -= prices[type]; this.playSound('success'); this.updateStats();

        if (type === 'hint') { alert(`Logic Hint: ${this.activeGate.gameHint} \n\nBot Hint: ${this.activeGate.textHint}`); }
        else if (type === 'shield') { this.hasShield = true; this.notify("Anti-Ban Shield active."); }
        else if (type === 'time') { this.timeLeft += 60; this.updateTimerUI(); this.notify("+60s Added to Stream."); }
        this.closeMarket();
    }

    toggleAdminSidebar(open) { const sidebar = document.getElementById('admin-sidebar'); open ? sidebar.classList.add('open') : sidebar.classList.remove('open'); }
    adminToggleFreeze() {
        this.isTimerFrozen = !this.isTimerFrozen;
        const btn = document.getElementById('btn-freeze');
        if(this.isTimerFrozen) { btn.innerText = "⏱️ Stream Paused ❄️"; btn.style.background = "#4a3311"; btn.style.color="#ffd700"; } 
        else { btn.innerText = "⏱️ Pause Stream (تجميد)"; btn.style.background = ""; btn.style.color=""; }
    }
    adminInstantSolveGate() {
        if(!this.activeGate) return alert("Please enter a room first!");
        this.toggleAdminSidebar(false);
        this.coins += 15; this.solvedGates.add(this.activeGate.id);
        this.notify("⚙️ Admin Override: Room Unlocked!");
        this.updateStats(); this.renderLobby(); this.switchScreen('lobby');
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
