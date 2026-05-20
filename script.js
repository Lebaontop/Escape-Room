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
        
        // إعداد نظام توليد الصوت المستقل (بدون ملفات!)
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.gameConfig = this.buildPuzzles();
        this.init();
        this.setupClickSounds();
    }

    init() { this.renderLobby(); this.updateStats(); this.startTimer(); }

    // مولد الأصوات الذكي (Web Audio API)
    playSound(type) {
        if(this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain); gain.connect(this.audioCtx.destination);
        
        const now = this.audioCtx.currentTime;
        if(type === 'click') {
            osc.type = 'square'; osc.frequency.setValueAtTime(450, now);
            gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'success') {
            osc.type = 'sine'; 
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
            osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
            gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.4);
            osc.start(now); osc.stop(now + 0.4);
        } else if (type === 'error') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now);
            gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
        }
    }
    
    triggerVisualGlitch() { 
        const c = document.getElementById('main-puzzle-card'); 
        if(c) { c.classList.add('error-glitch'); setTimeout(()=>c.classList.remove('error-glitch'), 400); } 
    }
    
    setupClickSounds() { 
        document.addEventListener('click', (e) => { 
            if(e.target.tagName==='BUTTON' || e.target.closest('.wire-item') || e.target.closest('.valve-item') || e.target.closest('.mem-card') || e.target.closest('.keypad-btn') || e.target.closest('.switch-box') || e.target.classList.contains('gate-card')){ 
                this.playSound('click'); 
            } 
        }); 
    }

    // بناء الـ 30 لعبة (منوعة بين 8 أسلاك، 4 صمامات، 16 بطاقة، 9 مفاتيح، مؤشرات)
    buildPuzzles() {
        const games = [
            // 1. أسلاك (8 أسلاك)
            { type: 'WIRES', count: 8, colors: ['red','blue','green','yellow','red','black','white','red'], target: 'red', desc: "اكتشف مسار التسريب: اقطع جميع الأسلاك الحمراء فقط.", intHint: "اقطع الـ 3 أسلاك الحمراء", txtQ: "شيء كلما زاد، قلّت رؤيتك له.", txtA: "الظلام" },
            // 2. كيبورد رموز (9 أزرار)
            { type: 'KEYPAD', count: 9, icons: ['Ω','Δ','Σ','Φ','Ψ','Θ','Γ','Λ','Π'], targetSeq: ['Δ','Φ','Λ'], desc: "شفرة المرور: أدخل الرموز (المثلث، الدائرة المقطوعة، والثمانية المقلوبة).", intHint: "Δ ثم Φ ثم Λ", txtQ: "ابن الماء، وإذا وضعته في الماء مات.", txtA: "الثلج" },
            // 3. قواطع طاقة (10 قواطع)
            { type: 'SWITCHES', count: 10, target: [1,3,5,7,9], desc: "توزيع الجهد: ارفع القواطع الزوجية فقط (2, 4, 6, 8, 10).", intHint: "شغل المحولات بالأرقام الزوجية", txtQ: "شيء احتفاظك به لك، وإذا شاركته مع الناس فقدته؟", txtA: "السر" },
            // 4. مؤشرات سحب (3 مؤشرات)
            { type: 'SLIDERS', count: 3, targets: [80, 20, 50], desc: "معايرة التردد: اضبط المؤشرات على (عالي جداً، منخفض جداً، متوسط).", intHint: "اسحب الأول يمين للأخير، الثاني يسار، والثالث بالنص", txtQ: "شيء يرتفع ولا ينزل أبدًا؟", txtA: "العمر" },
            // 5. بكرات/صمامات (4 صمامات)
            { type: 'VALVES', count: 4, targetAngles: [90, 180, 270, 0], desc: "توجيه الضغط: لف الصمامات لتشير (يمين، أسفل، يسار، أعلى).", intHint: "لفة، لفتين، ثلاث لفات، ولا لفة", txtQ: "يتحدث بلا فم ويسمع بلا أذنين؟", txtA: "الصدى" },
            // 6. ذاكرة بطاقات (16 بطاقة)
            { type: 'MEMORY', count: 16, icons: ['⚙️','🔋','💻','📡','🔑','🛡️','💾','🕹️'], desc: "استعادة البيانات: طابق أزواج الملفات التالفة.", intHint: "ركز واحفظ أماكن الرموز", txtQ: "مليء بالثقوب ولكنه يحتفظ بالماء؟", txtA: "الاسفنج" },
            // 7. أسلاك (8 أسلاك)
            { type: 'WIRES', count: 8, colors: ['blue','blue','yellow','blue','black','white','blue','green'], target: 'blue', desc: "إيقاف التبريد: اقطع كافة مسارات الماء (الأزرق).", intHint: "الأسلاك الزرقاء فقط", txtQ: "دائمًا أمامك ولكن لا يمكنك رؤيته؟", txtA: "المستقبل" },
            // 8. كيبورد رموز (9 أزرار)
            { type: 'KEYPAD', count: 9, icons: ['★','♦','♥','♠','♣','✖','✔','►','◄'], targetSeq: ['★','►','✖'], desc: "مسار البوت: نجمة، ثم يمين، ثم إغلاق.", intHint: "اضغط النجمة، السهم اليمين، ثم الاكس", txtQ: "لا يمكنك الاحتفاظ به إلا بعد إعطائه؟", txtA: "الوعد" },
            // 9. قواطع طاقة (10 قواطع)
            { type: 'SWITCHES', count: 10, target: [0,4,5,9], desc: "الأطراف الأساسية: شغّل القواطع في الأطراف اليمنى واليسرى فقط.", intHint: "أول واحد يمين ويسار، واللي تحتهم مباشرة", txtQ: "إذا نطقت باسمه كسرته؟", txtA: "الصمت" },
            // 10. بكرات (4 صمامات)
            { type: 'VALVES', count: 4, targetAngles: [180, 180, 180, 180], desc: "الإغلاق التام: وجّه جميع الصمامات للأسفل.", intHint: "لف كل واحد مرتين", txtQ: "شيء يجب كسره قبل استخدامه؟", txtA: "البيضة" },
            
            // تكرار المحركات بكونفيج جديد للألغاز من 11 لـ 30
            { type: 'SLIDERS', count: 3, targets: [100, 100, 100], desc: "رفع الطاقة للحد الأقصى (Overclock).", intHint: "كلها فل يمين", txtQ: "كلما جففت شيئًا، أصبحت أكثر بللًا؟", txtA: "المنشفة" }, // 11
            { type: 'MEMORY', count: 12, icons: ['🔴','🔵','🟢','🟡','🟣','⚪'], desc: "مزامنة الألوان: طابق الدوائر الملونة.", intHint: "لعبة تطابق للـ 12 كرت", txtQ: "فيها مدن بلا منازل، وغابات بلا أشجار؟", txtA: "الخريطة" }, // 12
            { type: 'WIRES', count: 6, colors: ['black','black','black','white','black','black'], target: 'black', desc: "مسح السجل المظلم: اقطع الأسلاك السوداء الـ 5.", intHint: "كل شيء أسود اقطعه", txtQ: "لها عقارب ولكن لا تلدغ؟", txtA: "الساعة" }, // 13
            { type: 'KEYPAD', count: 9, icons: ['1','2','3','4','5','6','7','8','9'], targetSeq: ['1','5','9'], desc: "رقم قطري: اختر مساراً قطرياً من اليسار لليمين.", intHint: "1 ثم 5 ثم 9", txtQ: "يمشي بلا أرجل ويبكي بلا أعين؟", txtA: "السحاب" }, // 14
            { type: 'SWITCHES', count: 8, target: [0,1,2,3,4,5,6,7], desc: "تفعيل النظام بالكامل: ارفع الـ 8 قواطع.", intHint: "شغل كل شيء", txtQ: "أخضر من الخارج، أحمر من الداخل؟", txtA: "البطيخ" }, // 15
            { type: 'VALVES', count: 3, targetAngles: [90, 90, 90], desc: "توجيه البيانات: لف الـ 3 صمامات لليمين.", intHint: "لفة وحدة لكل صمام", txtQ: "له رأس ولا عين له؟", txtA: "المسمار" }, // 16
            { type: 'SLIDERS', count: 4, targets: [0, 25, 75, 100], desc: "تدرج هرمي: رتب المؤشرات كتصاعد سلم.", intHint: "صفر، ربع، ثلاث أرباع، فل", txtQ: "يبكي دمعًا أسود ليضيء العقول؟", txtA: "القلم" }, // 17
            { type: 'WIRES', count: 8, colors: ['yellow','cyan','yellow','purple','yellow','orange','gray','yellow'], target: 'yellow', desc: "عزل الإشارة الصفراء: اقطع الـ 4 أسلاك الصفراء.", intHint: "الأصفر فقط", txtQ: "يكبر في الصباح ويختفي في الظهيرة؟", txtA: "الظل" }, // 18
            { type: 'MEMORY', count: 16, icons: ['A','B','C','D','E','F','G','H'], desc: "طابق الحروف الإنجليزية.", intHint: "ركز وتذكر", txtQ: "دائمًا تشير للشمال ولكنها لا تتحرك؟", txtA: "البوصلة" }, // 19
            { type: 'KEYPAD', count: 9, icons: ['A','S','D','W','Q','E','Z','X','C'], targetSeq: ['W','A','S','D'], desc: "مفاتيح الحركة الأساسية للجيمنج بالترتيب.", intHint: "W, A, S, D", txtQ: "تسمعها ولكن لا تراها ولا تلمسها؟", txtA: "الريح" }, // 20
            
            { type: 'SWITCHES', count: 12, target: [1,4,7,10], desc: "نمط الشطرنج العمودي المتباعد.", intHint: "شغل العمود اللي بالنص", txtQ: "تأكل كل شيء وتخاف من الماء؟", txtA: "النار" }, // 21
            { type: 'VALVES', count: 4, targetAngles: [270, 270, 270, 270], desc: "تفريغ عكسي: وجه الصمامات لليسار.", intHint: "ثلاث لفات لكل صمام", txtQ: "كلما أخذت منه كبر؟", txtA: "الحفرة" }, // 22
            { type: 'SLIDERS', count: 3, targets: [50, 50, 50], desc: "توازن تام: ضع الجميع في المنتصف.", intHint: "النص بالضبط", txtQ: "يقرصك ولا تراه؟", txtA: "الجوع" }, // 23
            { type: 'WIRES', count: 8, colors: ['green','green','green','green','white','white','white','white'], target: 'green', desc: "حذف ملفات النظام الخضراء.", intHint: "اقطع الأخضر فقط", txtQ: "يملكه الشخص ويستخدمه الآخرون أكثر منه؟", txtA: "الاسم" }, // 24
            { type: 'KEYPAD', count: 9, icons: ['/','*','-','+','=','%','$','#','@'], targetSeq: ['#','*','+'], desc: "هاشتاق، نجمة، زائد.", intHint: "الشباك، النجمة، الزائد", txtQ: "كلما أخذت منه أكثر، تركت أكثر وراءك؟", txtA: "الخطوة" }, // 25
            { type: 'MEMORY', count: 12, icons: ['♠','♣','♥','♦','★','✖'], desc: "فك تشفير الرموز المعقدة.", intHint: "لعبة تطابق", txtQ: "يسقط ولا يتأذى أبدًا؟", txtA: "المطر" }, // 26
            { type: 'SWITCHES', count: 10, target: [0,1,2,3,4], desc: "النصف العلوي: فعّل الـ 5 قواطع العليا.", intHint: "الصف اللي فوق كله", txtQ: "كلمة من 4 حروف، إذا أكلت نصفها تموت؟", txtA: "سمسم" }, // 27
            { type: 'VALVES', count: 4, targetAngles: [90, 180, 270, 0], desc: "دوران عقارب الساعة (يمين، تحت، يسار، فوق).", intHint: "يمين، أسفل، يسار، أعلى", txtQ: "مدينة سعودية تقرأ طرديا وعكسيا نفس الشيء؟", txtA: "العلا" }, // 28
            { type: 'SLIDERS', count: 4, targets: [100, 0, 100, 0], desc: "نمط النبضة القصوى (فل، صفر، فل، صفر).", intHint: "الأول يمين، الثاني يسار، الثالث يمين، الرابع يسار", txtQ: "تحترق وتبكي لتضيء للآخرين؟", txtA: "الشمعة" }, // 29
            { type: 'KEYPAD', count: 9, icons: ['S','O','L','A','R','G','M','E','!'], targetSeq: ['S','O','L','A','R'], desc: "كلمة السر الخاصة بالنسخة.", intHint: "اضغط حروف SOLAR بالترتيب", txtQ: "المعدن النقي الذي يرمز لنسخة SOLAR؟", txtA: "الذهب" } // 30
        ];

        return games.map((g, i) => ({ id: i + 1, ...g }));
    }

    switchScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(`screen-${id}`).classList.remove('hidden');
        document.getElementById('main-nav').classList.toggle('hidden', id === 'welcome');
    }

    startLobby() { 
        this.playSound('click'); // تهيئة الصوت
        this.switchScreen('lobby'); 
    }

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
        
        // إعداد واجهة المرحلة الأولى
        document.getElementById('interactive-stage-container').classList.remove('hidden');
        document.getElementById('text-stage').classList.add('hidden');
        document.getElementById('input-area').classList.add('hidden');
        document.getElementById('user-input').value = '';

        this.setupStage(); 
        this.switchScreen('puzzle');
    }

    // بناء المرحلة التفاعلية (6 محركات بصرية مختلفة)
    setupStage() {
        const p = this.activeGate;
        document.getElementById('puzzle-title').innerText = `# ROOM-${p.id.toString().padStart(2,'0')}`;
        document.getElementById('int-desc').innerText = p.desc;
        const stage = document.getElementById('interactive-stage');
        stage.innerHTML = '';
        
        this.stageState = { active: [], step: 0, pairs: [] };
        
        if (p.type === 'WIRES') {
            stage.className = 'wires-engine';
            for(let i=0; i<p.count; i++) {
                let w = document.createElement('div'); w.className = 'wire-item'; w.style.backgroundColor = p.colors[i];
                w.onclick = () => {
                    if(w.classList.contains('cut')) return;
                    w.classList.add('cut');
                    if(p.colors[i] !== p.target) { this.failRoom("Wrong Wire Cut!"); this.setupStage(); }
                    else {
                        let allTargetCut = Array.from(document.querySelectorAll('.wire-item')).every((el, idx) => p.colors[idx] !== p.target || el.classList.contains('cut'));
                        if(allTargetCut) this.winInteractive();
                    }
                };
                stage.appendChild(w);
            }
        } 
        else if (p.type === 'VALVES') {
            stage.className = 'valves-engine';
            this.stageState.angles = Array(p.count).fill(0);
            for(let i=0; i<p.count; i++) {
                let v = document.createElement('div'); v.className = 'valve-item'; v.innerHTML = '⚙';
                v.onclick = () => {
                    this.stageState.angles[i] = (this.stageState.angles[i] + 90) % 360;
                    v.style.transform = `rotate(${this.stageState.angles[i]}deg)`;
                    if(this.stageState.angles.every((ang, idx) => ang === p.targetAngles[idx])) this.winInteractive();
                };
                stage.appendChild(v);
            }
        }
        else if (p.type === 'SLIDERS') {
            stage.className = 'sliders-engine';
            for(let i=0; i<p.count; i++) {
                let row = document.createElement('div'); row.className = 'slider-row';
                let valDisplay = document.createElement('span'); valDisplay.innerText = '0%';
                let inp = document.createElement('input'); inp.type = 'range'; inp.className = 'slider-input'; inp.min = 0; inp.max = 100; inp.value = 0;
                inp.oninput = () => { valDisplay.innerText = inp.value + '%'; this.playSound('click'); };
                row.appendChild(inp); row.appendChild(valDisplay); stage.appendChild(row);
            }
            let btn = document.createElement('button'); btn.className = 'btn-submit-sliders'; btn.innerText = "VERIFY SYNC";
            btn.onclick = () => {
                let inputs = document.querySelectorAll('.slider-input');
                let isCorrect = Array.from(inputs).every((inp, i) => Math.abs(parseInt(inp.value) - p.targets[i]) <= 5); // تسامح 5%
                if(isCorrect) this.winInteractive(); else this.failRoom("Sync Failed!");
            };
            stage.appendChild(btn);
        }
        else if (p.type === 'MEMORY') {
            stage.className = 'memory-engine';
            let icons = [...p.icons, ...p.icons].slice(0, p.count);
            icons.sort(() => Math.random() - 0.5);
            for(let i=0; i<p.count; i++) {
                let card = document.createElement('div'); card.className = 'mem-card'; card.dataset.val = icons[i]; card.innerText = icons[i];
                card.onclick = () => {
                    if(card.classList.contains('flipped') || card.classList.contains('matched') || this.stageState.pairs.length >= 2) return;
                    card.classList.add('flipped'); this.stageState.pairs.push(card);
                    if(this.stageState.pairs.length === 2) {
                        setTimeout(() => {
                            let [c1, c2] = this.stageState.pairs;
                            if(c1.dataset.val === c2.dataset.val) {
                                c1.classList.replace('flipped', 'matched'); c2.classList.replace('flipped', 'matched'); this.playSound('success');
                                if(document.querySelectorAll('.matched').length === p.count) this.winInteractive();
                            } else {
                                c1.classList.remove('flipped'); c2.classList.remove('flipped'); this.failRoom("No Match!");
                            }
                            this.stageState.pairs = [];
                        }, 600);
                    }
                };
                stage.appendChild(card);
            }
        }
        else if (p.type === 'KEYPAD') {
            stage.className = 'keypad-engine';
            for(let i=0; i<p.count; i++) {
                let btn = document.createElement('button'); btn.className = 'keypad-btn'; btn.innerText = p.icons[i];
                btn.onclick = () => {
                    btn.classList.add('pressed'); setTimeout(()=>btn.classList.remove('pressed'), 200);
                    if(p.icons[i] !== p.targetSeq[this.stageState.step]) {
                        this.failRoom("Sequence Error!"); this.stageState.step = 0;
                    } else {
                        this.stageState.step++;
                        if(this.stageState.step === p.targetSeq.length) this.winInteractive();
                    }
                };
                stage.appendChild(btn);
            }
        }
        else if (p.type === 'SWITCHES') {
            stage.className = 'switches-engine';
            for(let i=0; i<p.count; i++) {
                let box = document.createElement('div'); box.className = 'switch-box';
                box.innerHTML = `<div class="indicator"></div><small>SW-${i+1}</small>`;
                box.onclick = () => {
                    box.classList.toggle('on');
                    let actives = Array.from(document.querySelectorAll('.switch-box')).map((el, idx) => el.classList.contains('on') ? idx : -1).filter(idx => idx !== -1);
                    if(actives.length === p.target.length && p.target.every(val => actives.includes(val))) {
                        this.winInteractive();
                    } else if (actives.length > p.target.length || actives.some(val => !p.target.includes(val))) {
                        this.failRoom("Power Surge!"); this.setupStage();
                    }
                };
                stage.appendChild(box);
            }
        }
    }

    // الانتقال للمرحلة الكتابية
    winInteractive() {
        this.playSound('success'); 
        this.notify("✅ Interactive Override Successful! Bot unlocked...");
        
        document.getElementById('interactive-stage-container').classList.add('hidden');
        document.getElementById('puzzle-desc').innerText = this.activeGate.txtQ;
        document.getElementById('text-stage').classList.remove('hidden');
        document.getElementById('input-area').classList.remove('hidden');
        document.getElementById('user-input').focus();
    }

    // التحقق من اللغز الكتابي
    checkResult() {
        let answerInput = document.getElementById('user-input').value.trim();
        if (answerInput === this.activeGate.txtA) {
            this.winRoomFinal();
        } else {
            this.failRoom(`Bot: Incorrect Cipher!`);
        }
    }

    winRoomFinal() {
        this.playSound('success'); this.coins += 20;
        this.solvedGates.add(this.activeGate.id); this.notify("✅ Room Completely Unlocked!");
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
        if(!this.isTimerFrozen) this.timeLeft -= 20;
    }

    /* --- التايمر والمشرف --- */
    startTimer() {
        if(this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (!this.isPaused && !this.isTimerFrozen && this.timeLeft > 0) {
                this.timeLeft--; this.updateTimerUI();
                if (this.timeLeft <= 10 && this.timeLeft > 0) this.playSound('click'); // Ticking sound
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

        if (type === 'hint') { 
            alert(`Interactive Hint: ${this.activeGate.intHint}\n\nRiddle Answer: ${this.activeGate.txtA}`); 
        }
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
        this.winRoomFinal();
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
