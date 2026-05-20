class SolarGamesEngine {
    constructor() {
        this.coins = 60;
        this.activeGate = null;
        this.timer = null;
        this.timeLeft = 5400; // ساعة ونص
        this.isPaused = false;
        this.isTimerFrozen = false; 
        this.hasShield = false;      
        this.solvedGates = new Set();
        
        // نظام Web Audio للصوت (يعمل بدون ملفات)
        this.audioCtx = null;
        this.gameConfig = this.buildPuzzles();
        this.init();
        this.setupClickListeners();
    }

    init() { this.renderLobby(); this.updateStats(); this.startTimer(); }

    initAudio() {
        if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    }

    playSound(type) {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain); gain.connect(this.audioCtx.destination);
        const now = this.audioCtx.currentTime;
        
        if(type === 'click') {
            osc.type = 'square'; osc.frequency.setValueAtTime(350, now);
            gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'success') {
            osc.type = 'sine'; 
            osc.frequency.setValueAtTime(523.25, now); osc.frequency.setValueAtTime(659.25, now + 0.1); osc.frequency.setValueAtTime(783.99, now + 0.2); 
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
    
    setupClickListeners() { 
        document.addEventListener('click', (e) => { 
            if(e.target.tagName==='BUTTON' || e.target.closest('.e-wire') || e.target.closest('.e-valve') || e.target.closest('.e-mem-card') || e.target.closest('.e-key-btn') || e.target.closest('.e-switch') || e.target.closest('.e-push-btn') || e.target.closest('.e-radar-cell') || e.target.classList.contains('gate-card')){ 
                this.initAudio(); this.playSound('click'); 
            } 
        }); 
    }

    // بناء 30 فكرة تفاعلية فريدة ومختلفة الأشكال لكل غرفة + الألغاز الكتابية المطلوبة!
    buildPuzzles() {
        const games = [
            // 1. أسلاك (8)
            { type: 'WIRES', count: 8, colors: ['red','blue','green','yellow','red','black','white','red'], target: 'red', desc: "اكتشف مسار التسريب: اقطع جميع الأسلاك الحمراء فقط.", intHint: "اقطع الـ 3 أسلاك الحمراء", txtQ: "شيء كلما زاد، قلّت رؤيتك له.", txtA: "الظلام" },
            // 2. كيبورد رموز فضائية (9)
            { type: 'KEYPAD', count: 9, icons: ['Ω','Δ','Σ','Φ','Ψ','Θ','Γ','Λ','Π'], targetSeq: ['Δ','Φ','Λ'], desc: "شفرة المرور: أدخل الرموز (المثلث، الدائرة المقطوعة، الثمانية المقلوبة).", intHint: "Δ ثم Φ ثم Λ", txtQ: "ابن الماء، وإذا وضعته في الماء مات.", txtA: "الثلج" },
            // 3. قواطع كهرباء (10)
            { type: 'SWITCHES', count: 10, target: [1,3,5,7,9], desc: "توزيع الجهد: ارفع القواطع الزوجية فقط.", intHint: "شغل المحولات الزوجية (2،4،6،8،10)", txtQ: "شيء احتفاظك به لك، وإذا شاركته مع الناس فقدته؟", txtA: "السر" },
            // 4. مؤشرات سحب (3)
            { type: 'SLIDERS', count: 3, targets: [80, 20, 50], desc: "معايرة التردد: اضبط المؤشرات على (عالي جداً، منخفض جداً، متوسط).", intHint: "يمين، يسار، بالنص", txtQ: "شيء يرتفع ولا ينزل أبدًا؟", txtA: "العمر" },
            // 5. بكرات حمراء (4)
            { type: 'VALVES', count: 4, targetAngles: [90, 180, 270, 0], desc: "توجيه الضغط: لف الصمامات لتشير (يمين، أسفل، يسار، أعلى).", intHint: "لفة، لفتين، ثلاث لفات، ولا لفة", txtQ: "يتحدث بلا فم ويسمع بلا أذنين؟", txtA: "الصدى" },
            // 6. ذاكرة جيمنج (16 بطاقة)
            { type: 'MEMORY', count: 16, icons: ['⚙️','🔋','💻','📡','🔑','🛡️','💾','🕹️'], desc: "استعادة البيانات: طابق أزواج الملفات التالفة.", intHint: "لعبة تطابق 16 كرت", txtQ: "مليء بالثقوب ولكنه يحتفظ بالماء؟", txtA: "الاسفنج" },
            // 7. أزرار ضغط عملاقة (3)
            { type: 'PUSH', count: 3, desc: "تفريغ الغاز: اضغط الأزرار الثلاثة لتأمين النظام.", intHint: "اضغطها كلها", txtQ: "دائمًا أمامك ولكن لا يمكنك رؤيته؟", txtA: "المستقبل" },
            // 8. كيبورد D-Pad جيمنج (4)
            { type: 'KEYPAD', count: 4, icons: ['⬆️','⬇️','⬅️','➡️'], targetSeq: ['⬆️','⬇️','⬅️','➡️'], desc: "كومبو النظام: أدخل تسلسل الاتجاهات الأساسي (فوق، تحت، يسار، يمين).", intHint: "فوق تحت يسار يمين", txtQ: "لا يمكنك الاحتفاظ به إلا بعد إعطائه؟", txtA: "الوعد" },
            // 9. رادار شبكي (16 خلية)
            { type: 'RADAR', count: 16, target: 10, desc: "التقط الهدف: حدد المربع C3 (العمود 3، الصف 3).", intHint: "الصف الثالث، العمود الثالث", txtQ: "إذا نطقت باسمه كسرته؟", txtA: "الصمت" },
            // 10. مفاتيح بيانو (7)
            { type: 'KEYPAD', count: 7, icons: ['C','D','E','F','G','A','B'], targetSeq: ['C','E','G'], desc: "عزف الشفرة: اعزف الكورد الأساسي (C ثم E ثم G).", intHint: "C E G", txtQ: "شيء يجب كسره قبل استخدامه؟", txtA: "البيضة" },
            
            // 11. أسلاك سوداءوبيضاء (6)
            { type: 'WIRES', count: 6, colors: ['black','white','black','white','black','white'], target: 'black', desc: "ألياف بصرية: دمر المسارات المظلمة (الأسود) فقط.", intHint: "الأسود הـ 3 فقط", txtQ: "كلما جففت شيئًا، أصبحت أكثر بللًا؟", txtA: "المنشفة" },
            // 12. قواطع (12 نمط شطرنج)
            { type: 'SWITCHES', count: 12, target: [0,2,4,7,9,11], desc: "نمط رقعة الشطرنج: فعّل المربعات بشكل متبادل.", intHint: "واحد شغال والثاني طافي", txtQ: "فيها مدن بلا منازل، وغابات بلا أشجار؟", txtA: "الخريطة" },
            // 13. مؤشرات صوت (4)
            { type: 'SLIDERS', count: 4, targets: [0, 33, 66, 100], desc: "توازن الصوت (Equalizer): اصنع مدرجاً تصاعدياً للمؤشرات.", intHint: "صفر، ثلث، ثلثين، فل", txtQ: "لها عقارب ولكن لا تلدغ؟", txtA: "الساعة" },
            // 14. ذاكرة هويات (12 بطاقة)
            { type: 'MEMORY', count: 12, icons: ['👤','👥','🕵️','👮','💂','👷'], desc: "مطابقة البصمات: اعثر على الهويات المتطابقة.", intHint: "لعبة تطابق 12 كرت", txtQ: "يمشي بلا أرجل ويبكي بلا أعين؟", txtA: "السحاب" },
            // 15. بكرات (3 أقفال خزنة)
            { type: 'VALVES', count: 3, targetAngles: [0, 0, 0], desc: "أقفال الخزنة: وجّه جميع البكرات للأعلى.", intHint: "لا تلفها، أو لفها لين ترجع فوق", txtQ: "أخضر من الخارج، أحمر من الداخل؟", txtA: "البطيخ" },
            // 16. كيبورد أرقام كلاسيك (9)
            { type: 'KEYPAD', count: 9, icons: ['1','2','3','4','5','6','7','8','9'], targetSeq: ['1','5','9'], desc: "رقم قطري: اختر مساراً قطرياً من اليسار لليمين.", intHint: "1 ثم 5 ثم 9", txtQ: "له رأس ولا عين له؟", txtA: "المسمار" },
            // 17. أزرار ضغط حمراء (5)
            { type: 'PUSH', count: 5, desc: "إبطال المتفجرات: اضغط جميع الأزرار بسرعة قبل التزامن.", intHint: "اضغط الـ 5 أزرار", txtQ: "يبكي دمعًا أسود ليضيء العقول؟", txtA: "القلم" },
            // 18. أسلاك القنبلة (10)
            { type: 'WIRES', count: 10, colors: ['red','yellow','blue','green','yellow','black','green','white','orange','yellow'], target: 'yellow', desc: "عزل الإشارة الصفراء: اقطع الـ 3 أسلاك الصفراء.", intHint: "الأصفر الـ 3", txtQ: "يكبر في الصباح ويختفي في الظهيرة؟", txtA: "الظل" },
            // 19. رادار بوصلة (9 خلايا)
            { type: 'RADAR', count: 9, target: 2, desc: "بوصلة السيرفر: اضغط على اتجاه الشمال الشرقي (NE).", intHint: "الزاوية اليمنى العليا", txtQ: "دائمًا تشير للشمال ولكنها لا تتحرك؟", txtA: "البوصلة" },
            // 20. كيبورد جيمنج حروف (9)
            { type: 'KEYPAD', count: 9, icons: ['A','S','D','W','Q','E','Z','X','C'], targetSeq: ['W','A','S','D'], desc: "مفاتيح الحركة: أدخل التسلسل الكلاسيكي لألعاب الـ PC.", intHint: "W, A, S, D", txtQ: "تسمعها ولكن لا تراها ولا تلمسها؟", txtA: "الريح" },
            
            // 21. قواطع الكاميرات (8)
            { type: 'SWITCHES', count: 8, target: [1,2,5,6], desc: "كاميرات المراقبة: أطفئ كاميرات الأطراف، وأبقِ المنتصف شغالة.", intHint: "شغل الـ 4 اللي بالنص فقط", txtQ: "تأكل كل شيء وتخاف من الماء؟", txtA: "النار" },
            // 22. مؤشرات ألوان (3)
            { type: 'SLIDERS', count: 3, targets: [100, 50, 0], desc: "خلط الألوان RGB: أحمر كامل، أخضر للنصف، أزرق صفر.", intHint: "أول واحد يمين، الثاني بالنص، الثالث يسار", txtQ: "كلما أخذت منه كبر؟", txtA: "الحفرة" },
            // 23. ذاكرة فيروسات (16 بطاقة)
            { type: 'MEMORY', count: 16, icons: ['🦠','🧬','🩸','🧪','💊','💉','🔬','🔭'], desc: "فيروسات متخفية: اعثر على أزواج الفيروسات المخبرية.", intHint: "لعبة تطابق", txtQ: "يقرصك ولا تراه؟", txtA: "الجوع" },
            // 24. بكرات التيتانيوم (2)
            { type: 'VALVES', count: 2, targetAngles: [90, 270], desc: "أقفال التيتانيوم: توجيه متعاكس (الأول يمين، الثاني يسار).", intHint: "الأول لفة يمين، الثاني 3 لفات", txtQ: "يملكه الشخص ويستخدمه الآخرون أكثر منه؟", txtA: "الاسم" },
            // 25. كيبورد الهاكر (9)
            { type: 'KEYPAD', count: 9, icons: ['/','*','-','+','$','#','@','!','&'], targetSeq: ['#','*','+'], desc: "مفاتيح الهاكر: هاشتاق، ثم نجمة، ثم زائد.", intHint: "الشباك، النجمة، الزائد", txtQ: "كلما أخذت منه أكثر، تركت أكثر وراءك؟", txtA: "الخطوة" },
            // 26. أسلاك بيضاء (7)
            { type: 'WIRES', count: 7, colors: ['white','black','gray','white','blue','red','white'], target: 'white', desc: "شبكة الاتصال: دمّر المسارات البيضاء لقطع الاتصال.", intHint: "الأبيض الـ 3", txtQ: "يسقط ولا يتأذى أبدًا؟", txtA: "المطر" },
            // 27. قواطع النصف (10)
            { type: 'SWITCHES', count: 10, target: [0,1,2,3,4], desc: "النصف العلوي: فعّل الـ 5 قواطع العليا فقط.", intHint: "الصف اللي فوق كله", txtQ: "كلمة من 4 حروف، إذا أكلت نصفها تموت؟", txtA: "سمسم" },
            // 28. كيبورد كواكب (9)
            { type: 'KEYPAD', count: 9, icons: ['🌍','🌕','🌞','🪐','☄️','🌌','🌠','🌟','☁️'], targetSeq: ['🌞','🌍','🌕'], desc: "ترتيب فلكي: شمس، ثم أرض، ثم قمر.", intHint: "🌞 ثم 🌍 ثم 🌕", txtQ: "مدينة سعودية تقرأ طرديا وعكسيا نفس الشيء؟", txtA: "العلا" },
            // 29. كيبورد اسم اللعبة (9)
            { type: 'KEYPAD', count: 9, icons: ['S','O','L','A','R','G','M','E','!'], targetSeq: ['S','O','L','A','R'], desc: "شفرة النظام المركزية: أدخل اسم النظام.", intHint: "S O L A R", txtQ: "تحترق وتبكي لتضيء للآخرين؟", txtA: "الشمعة" },
            // 30. زر الزعيم النهائي (1 كبير جداً)
            { type: 'PUSH', count: 1, desc: "MASTER OVERRIDE: اضغط الزر الأحمر لاقتحام النظام المركزي.", intHint: "اضغط الزر", txtQ: "المعدن النقي الذي يرمز لنسخة SOLAR؟", txtA: "الذهب" }
        ];

        return games.map((g, i) => ({ id: i + 1, ...g }));
    }

    switchScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(`screen-${id}`).classList.remove('hidden');
        document.getElementById('main-nav').classList.toggle('hidden', id === 'welcome');
    }

    startLobby() { 
        this.initAudio(); 
        this.playSound('click'); 
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
        
        document.getElementById('interactive-stage-container').classList.remove('hidden');
        document.getElementById('text-stage').classList.add('hidden');
        document.getElementById('input-area').classList.add('hidden');
        document.getElementById('user-input').value = '';

        this.setupStage(); 
        this.switchScreen('puzzle');
    }

    // بناء الواجهة التفاعلية (7 محركات تصميم مختلفة تماماً)
    setupStage() {
        const p = this.activeGate;
        document.getElementById('puzzle-title').innerText = `# ROOM-${p.id.toString().padStart(2,'0')}`;
        document.getElementById('int-desc').innerText = p.desc;
        const stage = document.getElementById('interactive-stage');
        stage.innerHTML = '';
        stage.className = ''; // ريست الكلاسات
        
        this.stageState = { active: [], step: 0, pairs: [] };
        
        if (p.type === 'WIRES') {
            stage.classList.add('eng-wires');
            for(let i=0; i<p.count; i++) {
                let w = document.createElement('div'); w.className = 'e-wire'; w.style.backgroundColor = p.colors[i];
                w.onclick = () => {
                    if(w.classList.contains('cut')) return;
                    w.classList.add('cut');
                    if(p.colors[i] !== p.target) { this.failRoom("Wrong Wire Cut!"); this.setupStage(); }
                    else {
                        let allTargetCut = Array.from(document.querySelectorAll('.e-wire')).every((el, idx) => p.colors[idx] !== p.target || el.classList.contains('cut'));
                        if(allTargetCut) this.winInteractive();
                    }
                };
                stage.appendChild(w);
            }
        } 
        else if (p.type === 'VALVES') {
            stage.classList.add('eng-valves');
            this.stageState.angles = Array(p.count).fill(0);
            for(let i=0; i<p.count; i++) {
                let v = document.createElement('div'); v.className = 'e-valve'; v.innerHTML = '⚙';
                v.onclick = () => {
                    this.stageState.angles[i] = (this.stageState.angles[i] + 90) % 360;
                    v.style.transform = `rotate(${this.stageState.angles[i]}deg)`;
                    if(this.stageState.angles.every((ang, idx) => ang === p.targetAngles[idx])) this.winInteractive();
                };
                stage.appendChild(v);
            }
        }
        else if (p.type === 'SLIDERS') {
            stage.classList.add('eng-sliders');
            for(let i=0; i<p.count; i++) {
                let row = document.createElement('div'); row.className = 'e-slider-row';
                let valDisplay = document.createElement('span'); valDisplay.innerText = '0%';
                let inp = document.createElement('input'); inp.type = 'range'; inp.className = 'e-slider-input'; inp.min = 0; inp.max = 100; inp.value = 0;
                inp.oninput = () => { valDisplay.innerText = inp.value + '%'; };
                row.appendChild(inp); row.appendChild(valDisplay); stage.appendChild(row);
            }
            let btn = document.createElement('button'); btn.className = 'btn-verify'; btn.innerText = "VERIFY SYNC";
            btn.onclick = () => {
                this.playSound('click');
                let inputs = document.querySelectorAll('.e-slider-input');
                let isCorrect = Array.from(inputs).every((inp, i) => Math.abs(parseInt(inp.value) - p.targets[i]) <= 5);
                if(isCorrect) this.winInteractive(); else { this.failRoom("Sync Failed!"); this.setupStage(); }
            };
            stage.appendChild(btn);
        }
        else if (p.type === 'MEMORY') {
            stage.classList.add('eng-memory');
            let icons = [...p.icons, ...p.icons].slice(0, p.count);
            icons.sort(() => Math.random() - 0.5);
            for(let i=0; i<p.count; i++) {
                let card = document.createElement('div'); card.className = 'e-mem-card'; card.dataset.val = icons[i]; card.innerText = icons[i];
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
            stage.classList.add('eng-keypad');
            for(let i=0; i<p.count; i++) {
                let btn = document.createElement('button'); btn.className = 'e-key-btn'; btn.innerText = p.icons[i];
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
            stage.classList.add('eng-switches');
            for(let i=0; i<p.count; i++) {
                let box = document.createElement('div'); box.className = 'e-switch';
                box.innerHTML = `<div class="ind"></div><small>SW-${i+1}</small>`;
                box.onclick = () => {
                    box.classList.toggle('on');
                    let actives = Array.from(document.querySelectorAll('.e-switch')).map((el, idx) => el.classList.contains('on') ? idx : -1).filter(idx => idx !== -1);
                    if(actives.length === p.target.length && p.target.every(val => actives.includes(val))) {
                        this.winInteractive();
                    } else if (actives.length > p.target.length || actives.some(val => !p.target.includes(val))) {
                        this.failRoom("Power Surge!"); this.setupStage();
                    }
                };
                stage.appendChild(box);
            }
        }
        else if (p.type === 'PUSH') {
            stage.classList.add('eng-push');
            for(let i=0; i<p.count; i++) {
                let btn = document.createElement('button'); btn.className = 'e-push-btn';
                if(p.count === 1) { btn.style.width = '150px'; btn.style.height = '150px'; btn.style.boxShadow = '0 15px 0 #800';}
                btn.onclick = () => {
                    btn.classList.add('locked');
                    if(document.querySelectorAll('.locked').length === p.count) this.winInteractive();
                };
                stage.appendChild(btn);
            }
        }
        else if (p.type === 'RADAR') {
            stage.classList.add('eng-radar');
            let cols = Math.sqrt(p.count);
            stage.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
            for(let i=0; i<p.count; i++) {
                let cell = document.createElement('div'); cell.className = 'e-radar-cell';
                let row = Math.floor(i / cols); let col = i % cols;
                cell.innerText = String.fromCharCode(65 + row) + (col + 1);
                cell.onclick = () => {
                    if(i === p.target) { cell.style.background = '#0f0'; cell.style.color = '#000'; this.winInteractive(); }
                    else { this.failRoom("Target Missed!"); }
                };
                stage.appendChild(cell);
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

    checkResult() {
        this.playSound('click');
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
        if(!this.isTimerFrozen) this.timeLeft -= 15;
    }

    startTimer() {
        if(this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (!this.isPaused && !this.isTimerFrozen && this.timeLeft > 0) {
                this.timeLeft--; this.updateTimerUI();
            } else if (this.timeLeft <= 0 && !this.isTimerFrozen) { this.onFail(); }
        }, 1000);
    }
    updateTimerUI() {
        let m = Math.floor(Math.max(0, this.timeLeft)/60).toString().padStart(2,'0');
        let s = (Math.max(0, this.timeLeft)%60).toString().padStart(2,'0');
        document.getElementById('timer-display').innerText = `${m}:${s}`;
    }
    onFail() { clearInterval(this.timer); this.playSound('error'); alert("Server Timeout! GAME OVER."); this.switchScreen('welcome'); }

    openMarket() { this.playSound('click'); document.getElementById('panel-market').classList.remove('hidden'); }
    closeMarket() { this.playSound('click'); document.getElementById('panel-market').classList.add('hidden'); }
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

    toggleAdminSidebar(open) { this.playSound('click'); const sidebar = document.getElementById('admin-sidebar'); open ? sidebar.classList.add('open') : sidebar.classList.remove('open'); }
    adminToggleFreeze() {
        this.playSound('click');
        this.isTimerFrozen = !this.isTimerFrozen;
        const btn = document.getElementById('btn-freeze');
        if(this.isTimerFrozen) { btn.innerText = "⏱️ Stream Paused ❄️"; btn.style.background = "#4a3311"; btn.style.color="#ffd700"; } 
        else { btn.innerText = "⏱️ Pause Stream"; btn.style.background = ""; btn.style.color=""; }
    }
    adminInstantSolveGate() {
        this.playSound('click');
        if(!this.activeGate) return alert("Please enter a room first!");
        this.toggleAdminSidebar(false);
        this.winRoomFinal();
    }
    adminModifyCoins(val) { this.playSound('click'); this.coins = Math.max(0, this.coins + val); this.updateStats(); }
    adminModifyTime(val) { this.playSound('click'); this.timeLeft = Math.max(5, this.timeLeft + val); this.updateTimerUI(); }

    returnToLobby() { this.playSound('click'); this.switchScreen('lobby'); }
    updateStats() { document.getElementById('coin-val').innerText = this.coins; }
    notify(m, t="success") {
        let c = document.getElementById('toast-container'), n = document.createElement('div'); n.className='toast';
        if(t==='error') n.style.borderRightColor='var(--discord-red)'; n.innerText = m; c.appendChild(n); setTimeout(()=>n.remove(), 3000);
    }
}
const game = new SolarGamesEngine();
