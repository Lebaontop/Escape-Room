/**
 * SOLAR GAMES: THE GOLDEN PROTOCOL - CORE ENGINE
 * V 4.0 - MASTER EDITION (30 UNIQUE INTERACTIVE MODULES)
 */

class SolarGamesEngine {
    constructor() {
        this.coins = 0; 
        this.globalTime = 90 * 60; // 90 دقيقة
        this.isTimerRunning = false;
        this.timeFrozen = false;
        
        this.activeGate = null;
        this.solvedGates = new Set();
        this.audioCtx = null;
        this.stageState = {};
        
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
        const osc = this.audioCtx.createOscillator(); const gain = this.audioCtx.createGain();
        osc.connect(gain); gain.connect(this.audioCtx.destination); const now = this.audioCtx.currentTime;
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
    
    showToast(msg, color = '#D4AF37') {
        const t = document.createElement('div'); t.className = 'toast'; t.innerText = msg; t.style.borderRightColor = color;
        document.getElementById('toast-container').appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }

    triggerVisualGlitch() { 
        const c = document.getElementById('main-puzzle-card'); 
        if(c) { c.classList.add('error-glitch'); setTimeout(()=>c.classList.remove('error-glitch'), 400); } 
    }
    
    setupClickListeners() { 
        document.addEventListener('click', (e) => { 
            if(e.target.tagName==='BUTTON' || e.target.classList.contains('channel-card') || e.target.hasAttribute('data-sfx')) { 
                this.initAudio(); this.playSound('click'); 
            } 
        }); 
    }

    buildPuzzles() {
        const riddles = [
            "شيء كلما زاد، قلّت رؤيتك له.", "ابن الماء، وإذا وضعته في الماء مات.", "شيء احتفاظك به لك، وإذا شاركته مع الناس فقدته؟", "شيء يرتفع ولا ينزل أبدًا؟", "يتحدث بلا فم ويسمع بلا أذنين؟",
            "مليء بالثقوب ولكنه يحتفظ بالماء؟", "دائمًا أمامك ولكن لا يمكنك رؤيته؟", "لا يمكنك الاحتفاظ به إلا بعد إعطائه؟", "إذا نطقت باسمه كسرته؟", "شيء يجب كسره قبل استخدامه؟",
            "كلما جففت شيئًا، أصبحت أكثر بللًا؟", "فيها مدن بلا منازل، وغابات بلا أشجار؟", "لها عقارب ولكن لا تلدغ؟", "يمشي بلا أرجل ويبكي بلا أعين؟", "أخضر من الخارج، أحمر من الداخل؟",
            "له رأس ولا عين له؟", "يبكي دمعًا أسود ليضيء العقول؟", "يكبر في الصباح ويختفي في الظهيرة؟", "دائمًا تشير للشمال ولكنها لا تتحرك؟", "تسمعها ولكن لا تراها ولا تلمسها؟",
            "تأكل كل شيء وتخاف من الماء؟", "كلما أخذت منه كبر؟", "يقرصك ولا تراه؟", "يملكه الشخص ويستخدمه الآخرون أكثر منه؟", "كلما أخذت منه أكثر، تركت أكثر وراءك؟",
            "يسقط ولا يتأذى أبدًا؟", "كلمة من 4 حروف، إذا أكلت نصفها تموت؟", "مدينة سعودية تقرأ طرديا وعكسيا نفس الشيء؟", "تحترق وتبكي لتضيء للآخرين؟", "المعدن النقي الذي يرمز لنسخة الاختراق النهائي؟"
        ];
        const answers = [
            "الظلام", "الثلج", "السر", "العمر", "الصدى", "الاسفنج", "المستقبل", "الوعد", "الصمت", "البيضة", "المنشفة", "الخريطة", "الساعة", "السحاب", "البطيخ", "المسمار", "القلم", "الظل", "البوصلة", "الريح", "النار", "الحفرة", "الجوع", "الاسم", "الخطوة", "المطر", "سمسم", "العلا", "الشمعة", "الذهب"
        ];

        let mechanics = [];
        for(let i=1; i<=30; i++) {
            mechanics.push({ id: i, txtQ: riddles[i-1], txtA: answers[i-1] });
        }
        return mechanics;
    }

    // ==========================================
    // أنظمة الوقت والعملات
    // ==========================================
    toggleGlobalTimer() { this.playSound('click'); this.isTimerRunning = !this.isTimerRunning; this.showToast(this.isTimerRunning ? "تم تشغيل العداد العام" : "تم إيقاف العداد العام"); }
    modifyGlobalTimer(secs) { this.playSound('click'); this.globalTime = Math.max(0, this.globalTime + secs); this.updateGlobalTimerUI(); }
    updateGlobalTimerUI() {
        let h = Math.floor(this.globalTime / 3600).toString().padStart(2,'0');
        let m = Math.floor((this.globalTime % 3600) / 60).toString().padStart(2,'0');
        let s = (this.globalTime % 60).toString().padStart(2,'0');
        document.getElementById('global-timer-display').innerText = `${h}:${m}:${s}`;
        document.getElementById('market-time').innerText = `${h}:${m}:${s}`;
        document.getElementById('puzzle-global-timer').innerText = `${h}:${m}:${s}`;
        document.getElementById('global-timer-display').style.color = this.timeFrozen ? '#00ccff' : '#fff';
    }
    addCoins(amount) { this.playSound('click'); this.coins = Math.max(0, this.coins + amount); this.updateCoinsUI(); if(amount > 0) this.showToast(`تم استخراج ${amount} بيانات!`); else this.showToast(`تم خصم ${Math.abs(amount)} بيانات!`, '#ff3333'); }
    updateCoinsUI() { document.getElementById('coin-val').innerText = this.coins; document.getElementById('market-coins').innerText = this.coins; }
    toggleMarket(show) { this.playSound('click'); const m = document.getElementById('market-modal'); if(show) { m.classList.remove('hidden'); this.updateCoinsUI(); this.updateGlobalTimerUI(); } else m.classList.add('hidden'); }
    
    buyHint(type) {
        this.playSound('click'); if(!this.activeGate) { this.showToast('يجب أن تكون داخل روم!', '#ff3333'); return; }
        if(type === 'coins') { if(this.coins >= 60) { this.coins -= 60; this.showToast('تم فك التشفير بنجاح!'); this.displayHint(); } else { this.showToast('بيانات غير كافية!', '#ff3333'); } } 
        else if (type === 'time') { if(this.globalTime > 300) { this.globalTime -= 300; this.showToast('تم الشراء بخصم 5 دقائق!'); this.displayHint(); } else { this.showToast('الوقت لا يكفي!', '#ff3333'); } }
        this.updateCoinsUI(); this.updateGlobalTimerUI();
    }
    buyFreeze() {
        this.playSound('click'); if(this.coins >= 40) { if(this.timeFrozen) { this.showToast('مجمد مسبقاً!', '#ff3333'); return; } this.coins -= 40; this.timeFrozen = true; this.updateGlobalTimerUI(); this.showToast('❄️ تم تجميد الحماية!', '#00ccff'); setTimeout(() => { this.timeFrozen = false; this.updateGlobalTimerUI(); this.showToast('انتهى التجميد!', '#ff3333'); }, 120000); } else { this.showToast('بيانات غير كافية!', '#ff3333'); } this.updateCoinsUI();
    }
    displayHint() { this.toggleMarket(false); document.getElementById('hint-display').innerHTML = "SYSTEM OVERRIDE: CLUE UNLOCKED."; document.getElementById('hint-display').classList.remove('hidden'); }

    switchScreen(id) { document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden')); document.getElementById(`screen-${id}`).classList.remove('hidden'); document.getElementById('main-nav').classList.toggle('hidden', id === 'welcome'); }
    startLobby() { this.initAudio(); this.playSound('click'); this.isTimerRunning = true; this.switchScreen('lobby'); }

    renderLobby() {
        const c = document.getElementById('gates-container'); c.innerHTML = '';
        for(let i=1; i<=30; i++) {
            let btn = document.createElement('div'); let isSolved = this.solvedGates.has(i); let isLocked = i !== 1 && !this.solvedGates.has(i - 1); let isNext = !isSolved && !isLocked; 
            btn.className = `channel-card ${isSolved ? 'solved' : ''} ${isLocked ? 'locked' : ''} ${isNext ? 'unlocked-next' : ''}`; btn.setAttribute('data-sfx', 'true');
            let info = document.createElement('div'); info.className = 'channel-info'; let title = document.createElement('h3'); title.innerText = `CHANNEL-${i.toString().padStart(2, '0')}`;
            let status = document.createElement('span'); status.className = 'channel-status';
            if(isNext) { status.innerText = 'BYPASS REQUIRED'; status.style.color = '#D4AF37'; } else if(isSolved) { status.innerText = 'HACKED'; status.style.color = '#00ff66'; } else { status.innerText = 'ENCRYPTED'; status.style.color = '#555'; }
            info.append(title, status); btn.appendChild(info); btn.addEventListener('click', () => { if(!isLocked) this.handleGateClick(i); }); c.appendChild(btn);
        }
    }

    handleGateClick(id) {
        if(this.solvedGates.has(id)) return; this.activeGate = this.gameConfig.find(x => x.id === id);
        document.getElementById('interactive-stage-container').classList.remove('hidden'); document.getElementById('text-stage').classList.add('hidden'); document.getElementById('input-area').classList.add('hidden'); document.getElementById('user-input').value = ''; document.getElementById('hint-display').classList.add('hidden'); document.getElementById('puzzle-title').innerHTML = `<span style="color:#aaa;">🔊</span> # CHANNEL-${id.toString().padStart(2,'0')}`;
        this.setupStage(); this.switchScreen('puzzle');
    }

    // ==========================================
    // المحرك البصري: 30 تصميم مستقل ومنطق منفصل تماماً
    // ==========================================
    setupStage() {
        const id = this.activeGate.id;
        const stage = document.getElementById('interactive-stage');
        stage.innerHTML = `<div id="lux-inner-stage" style="width:100%; min-height:400px; background:#050505; border:2px solid #D4AF37; border-radius:8px; padding:30px; box-shadow:inset 0 0 40px #000; position:relative; overflow:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center;"></div>`;
        const inner = document.getElementById('lux-inner-stage');
        this.stageState = { clicks: 0, arr: [], val: 0, attempts: 0, playing: true, timer: null };

        const createBtn = (text, callback) => {
            let b = document.createElement('button'); b.innerText = text; b.setAttribute('data-sfx', 'true');
            b.style.cssText = 'background:linear-gradient(180deg,#222,#000); color:#D4AF37; border:2px solid #D4AF37; padding:15px 30px; font-size:1.2rem; font-weight:bold; border-radius:4px; cursor:pointer; margin-top:25px; width:100%; max-width:400px; text-transform:uppercase; box-shadow:0 5px 15px rgba(0,0,0,0.8);';
            b.onclick = callback; return b;
        };

        const createInput = (placeholder) => {
            let i = document.createElement('input'); i.type = 'text'; i.placeholder = placeholder;
            i.style.cssText = 'background:#000; border:2px solid #D4AF37; color:#D4AF37; padding:15px; font-size:1.8rem; text-align:center; width:100%; max-width:400px; outline:none; box-shadow:inset 0 0 20px rgba(212,175,55,0.1); letter-spacing:4px; font-family:monospace; border-radius:4px; text-transform:uppercase;';
            return i;
        };

        document.getElementById('int-desc').innerText = `اختراق النظام الأمني للباب رقم ${id}`;

        switch(id) {
            case 1: { // 1. الأسلاك الأفقية (قطع بترتيب)
                let wrap = document.createElement('div'); wrap.style.cssText = 'width:100%; max-width:500px; display:flex; flex-direction:column; gap:15px;';
                let colors = ['#D4AF37','#ff3333','#444','#fff','#00ccff']; let target = [1,4,0]; // أحمر, أزرق, ذهبي
                colors.forEach((c, i) => {
                    let w = document.createElement('div'); 
                    w.style.cssText = `width:100%; height:30px; background:linear-gradient(90deg, #111, ${c}, #111); border-radius:15px; cursor:pointer; border:2px solid #222; box-shadow:0 5px 10px #000; position:relative; overflow:hidden;`;
                    w.onclick = () => {
                        this.playSound('click'); w.style.opacity='0.2'; w.style.pointerEvents='none';
                        if(target[this.stageState.clicks] === i) { this.stageState.clicks++; if(this.stageState.clicks === target.length) this.winInteractive(); } else this.failRoom();
                    }; wrap.appendChild(w);
                });
                inner.appendChild(wrap); break;
            }
            case 2: { // 2. الدوائر النابضة (سايمون)
                let grid = document.createElement('div'); grid.style.cssText = 'display:grid; grid-template-columns:repeat(3, 90px); gap:20px;';
                let nodes = []; this.stageState.seq = [4,0,8,2,6]; // تسلسل محدد
                for(let i=0; i<9; i++) {
                    let n = document.createElement('div'); 
                    n.style.cssText = 'width:90px; height:90px; border-radius:50%; background:radial-gradient(circle, #222, #000); border:3px solid #444; cursor:pointer; box-shadow:inset 0 0 15px #000; transition:0.1s;';
                    n.onclick = () => {
                        if(!this.stageState.playing) return; this.playSound('click');
                        n.style.background = '#D4AF37'; n.style.borderColor = '#fff'; n.style.boxShadow = '0 0 30px #D4AF37'; setTimeout(()=>{n.style.background='radial-gradient(circle, #222, #000)'; n.style.borderColor='#444'; n.style.boxShadow='inset 0 0 15px #000';}, 200);
                        if(this.stageState.seq[this.stageState.clicks] === i) { this.stageState.clicks++; if(this.stageState.clicks === this.stageState.seq.length) this.winInteractive(); } else { this.failRoom(); this.setupStage(); }
                    }; nodes.push(n); grid.appendChild(n);
                }
                inner.appendChild(grid);
                setTimeout(() => { this.stageState.playing = false; let step=0; let iv = setInterval(()=>{ if(step<this.stageState.seq.length){ let tg=nodes[this.stageState.seq[step]]; tg.style.background='#D4AF37'; this.playSound('click'); setTimeout(()=>tg.style.background='radial-gradient(circle, #222, #000)', 300); step++; } else { clearInterval(iv); this.stageState.playing = true; }}, 600); }, 1000);
                break;
            }
            case 3: { // 3. لوحة المفاتيح الصراف (Keypad)
                let pad = document.createElement('div'); pad.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:10px; background:#111; padding:20px; border-radius:8px; border:2px solid #333;';
                let disp = document.createElement('div'); disp.style.cssText = 'grid-column:span 3; height:60px; background:#000; border:2px solid #D4AF37; color:#D4AF37; display:flex; justify-content:center; align-items:center; font-size:2rem; font-family:monospace; letter-spacing:8px; margin-bottom:10px;';
                pad.appendChild(disp);
                [1,2,3,4,5,6,7,8,9, '*', 0, '#'].forEach(n => {
                    let b = document.createElement('div'); b.style.cssText = 'width:80px; height:60px; background:linear-gradient(180deg,#333,#111); border:1px solid #555; border-radius:4px; display:flex; justify-content:center; align-items:center; color:#fff; font-size:1.5rem; font-weight:bold; cursor:pointer; box-shadow:0 4px 6px #000;';
                    b.innerText = n;
                    b.onclick = () => {
                        this.playSound('click'); b.style.transform='translateY(2px)'; setTimeout(()=>b.style.transform='translateY(0)', 100);
                        if(typeof n === 'number') { this.stageState.val = (this.stageState.val||'') + n; disp.innerText = this.stageState.val; if(this.stageState.val === '7392') setTimeout(()=>this.winInteractive(), 300); else if(this.stageState.val.length>=4){ this.failRoom(); setTimeout(()=>this.setupStage(), 500); } }
                    }; pad.appendChild(b);
                }); inner.appendChild(pad); break;
            }
            case 4: { // 4. كروت الذاكرة الميكانيكية (لا إيموجي)
                let grid = document.createElement('div'); grid.style.cssText = 'display:grid; grid-template-columns:repeat(4, 80px); gap:15px; perspective:1000px;';
                let syms = ['⎈','⎋','⌖','⍟','⎊','⚙','◬','Ⱄ']; let deck = [...syms, ...syms].sort(()=>Math.random()-0.5); let flipped = [];
                deck.forEach(s => {
                    let c = document.createElement('div'); c.style.cssText = 'width:80px; height:80px; position:relative; transform-style:preserve-3d; transition:0.5s; cursor:pointer;';
                    let f = document.createElement('div'); f.style.cssText = 'position:absolute; width:100%; height:100%; backface-visibility:hidden; background:repeating-linear-gradient(45deg, #222, #222 10px, #111 10px, #111 20px); border:2px solid #444; border-radius:4px;';
                    let b = document.createElement('div'); b.style.cssText = 'position:absolute; width:100%; height:100%; backface-visibility:hidden; background:#0a0a0a; border:2px solid #D4AF37; transform:rotateY(180deg); display:flex; justify-content:center; align-items:center; font-size:2.5rem; color:#D4AF37; border-radius:4px; box-shadow:inset 0 0 15px rgba(212,175,55,0.2);';
                    b.innerText = s; c.append(f,b);
                    c.onclick = () => {
                        if(c.style.transform==='rotateY(180deg)' || flipped.length>=2) return; this.playSound('click'); c.style.transform='rotateY(180deg)'; flipped.push({el:c, val:s});
                        if(flipped.length===2) { setTimeout(()=>{ if(flipped[0].val===flipped[1].val){ this.playSound('success'); flipped.forEach(x=>x.el.style.opacity='0.3'); this.stageState.clicks+=2; if(this.stageState.clicks===16) this.winInteractive(); } else { flipped.forEach(x=>x.el.style.transform='rotateY(0)'); } flipped=[]; }, 600); }
                    }; grid.appendChild(c);
                }); inner.appendChild(grid); break;
            }
            case 5: { // 5. الأسطرلاب (حلقات متداخلة)
                let cont = document.createElement('div'); cont.style.cssText = 'position:relative; width:280px; height:280px; display:flex; justify-content:center; align-items:center; border-radius:50%; background:radial-gradient(circle, #1a1a1a, #000); box-shadow:0 0 30px #000; border:8px solid #222;';
                let rings = [ {s:240, c:'#D4AF37'}, {s:170, c:'#aaa'}, {s:100, c:'#8a7322'} ]; let angs = [90, 180, 270];
                rings.forEach((r,i) => {
                    let el = document.createElement('div'); el.style.cssText = `position:absolute; width:${r.s}px; height:${r.s}px; border-radius:50%; border:3px dashed ${r.c}; display:flex; justify-content:center; cursor:pointer; transition:transform 0.5s; transform:rotate(${angs[i]}deg);`;
                    let dot = document.createElement('div'); dot.style.cssText = 'width:12px; height:12px; background:#fff; border-radius:50%; margin-top:-6px; box-shadow:0 0 10px #fff;'; el.appendChild(dot);
                    el.onclick = () => { this.playSound('click'); angs[i]=(angs[i]+45)%360; el.style.transform=`rotate(${angs[i]}deg)`; if(angs.every(a=>a===0)) setTimeout(()=>this.winInteractive(), 500); };
                    cont.appendChild(el);
                }); inner.appendChild(cont); break;
            }
            case 6: { // 6. مصفوفة العقد (توصيل زوايا)
                let grid = document.createElement('div'); grid.style.cssText = 'display:grid; grid-template-columns:repeat(4, 75px); gap:8px; background:#000; padding:15px; border:2px solid #D4AF37; border-radius:10px;';
                let nodes = [];
                for(let i=0; i<16; i++) {
                    let n = document.createElement('div'); let isL = Math.random()>0.5; n.style.cssText = `width:75px; height:75px; background:radial-gradient(circle,#222,#050505); display:flex; justify-content:center; align-items:center; cursor:pointer; font-size:3rem; color:#D4AF37; transition:transform 0.3s; border:1px solid #333; border-radius:4px; text-shadow:0 0 10px #D4AF37;`;
                    n.innerText = isL ? '━' : '┏'; let rot = [0,90,180,270][Math.floor(Math.random()*4)]; n.style.transform = `rotate(${rot}deg)`; n.dataset.rot = rot; n.dataset.type = isL?'line':'corner';
                    n.onclick = () => { this.playSound('click'); let r = (parseInt(n.dataset.rot)+90)%360; n.dataset.rot = r; n.style.transform = `rotate(${r}deg)`; if(nodes.every(x=>{ if(x.dataset.type==='line') return [0,180].includes(parseInt(x.dataset.rot)); return [0,90,180,270].includes(parseInt(x.dataset.rot)); })) setTimeout(()=>this.winInteractive(), 400); };
                    nodes.push(n); grid.appendChild(n);
                } inner.appendChild(grid); break;
            }
            case 7: { // 7. الميزان الفيزيائي (أعمدة طاقة)
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:flex; align-items:flex-end; gap:20px; height:220px; border-bottom:4px solid #D4AF37; padding-bottom:10px;';
                let vals = [25, 40, 15, 35, 10]; let target = 90; let activeSum = 0;
                vals.forEach(v => {
                    let c = document.createElement('div'); c.style.cssText = `width:50px; height:${v*3}px; background:#111; border:2px solid #444; border-radius:4px 4px 0 0; cursor:pointer; position:relative; overflow:hidden; transition:0.3s; box-shadow:inset 0 -10px 20px #000;`;
                    let g = document.createElement('div'); g.style.cssText = 'position:absolute; bottom:0; width:100%; height:0%; background:linear-gradient(0deg,#D4AF37,transparent); transition:0.4s; opacity:0;'; c.appendChild(g);
                    c.onclick = () => { this.playSound('click'); let act = c.dataset.act==='1'; c.dataset.act = act?'0':'1'; g.style.height = act?'0%':'100%'; g.style.opacity = act?'0':'1'; c.style.borderColor = act?'#444':'#D4AF37'; activeSum += act?-v:v; if(activeSum===target) setTimeout(()=>this.winInteractive(), 500); };
                    wrap.appendChild(c);
                }); inner.appendChild(wrap); break;
            }
            case 8: { // 8. الرادار (دائرة مسح)
                let radar = document.createElement('div'); radar.style.cssText = 'position:relative; width:300px; height:300px; border-radius:50%; background:radial-gradient(circle, #001a00, #000); border:4px solid #00ff66; overflow:hidden; box-shadow:0 0 30px rgba(0,255,102,0.2); cursor:crosshair;';
                let sweep = document.createElement('div'); sweep.style.cssText = 'position:absolute; top:50%; left:50%; width:150px; height:2px; background:linear-gradient(90deg, #00ff66, transparent); transform-origin:0 50%; animation:spin 3s linear infinite;';
                let style = document.createElement('style'); style.innerHTML = '@keyframes spin { 100% { transform: rotate(360deg); } }'; document.head.appendChild(style);
                let blip = document.createElement('div'); blip.style.cssText = 'position:absolute; width:10px; height:10px; background:#fff; border-radius:50%; box-shadow:0 0 10px #fff; left:200px; top:220px; opacity:0; transition:opacity 0.2s;';
                radar.append(sweep, blip); inner.appendChild(radar);
                setInterval(()=> { let rect = sweep.getBoundingClientRect(); let bRect = blip.getBoundingClientRect(); /* Pseudo collision for visual */ blip.style.opacity='1'; setTimeout(()=>blip.style.opacity='0', 500); }, 3000);
                radar.onclick = (e) => { this.playSound('click'); let r = radar.getBoundingClientRect(); let x = e.clientX-r.left, y = e.clientY-r.top; let dist = Math.hypot(x-205, y-225); if(dist < 30) this.winInteractive(); else this.failRoom(); };
                break;
            }
            case 9: { // 9. منصة الماسترمايند (ألوان سداسية)
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:20px;';
                let docks = document.createElement('div'); docks.style.cssText = 'display:flex; gap:15px;'; let cols = ['#D4AF37','#8a7322','#555','#222']; let boxes=[];
                for(let i=0; i<4; i++){ let d=document.createElement('div'); d.style.cssText='width:60px;height:70px;clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);background:#111;cursor:pointer;border:2px solid #555;transition:0.3s;'; d.dataset.v=-1; d.onclick=()=>{this.playSound('click'); let v=(parseInt(d.dataset.v)+1)%4; d.dataset.v=v; d.style.background=cols[v];}; docks.appendChild(d); boxes.push(d); }
                let hist = document.createElement('div'); hist.style.cssText = 'width:100%; max-width:350px; height:120px; background:rgba(0,0,0,0.5); border:1px solid #333; overflow-y:auto; padding:10px; display:flex; flex-direction:column; gap:8px;';
                let btn = createBtn('SCAN SEQUENCE', ()=>{ let g = boxes.map(b=>parseInt(b.dataset.v)); if(g.includes(-1))return; let r=document.createElement('div'); r.style.cssText='display:flex; justify-content:space-between; background:#0a0a0a; padding:5px; border-radius:4px;'; let pw=document.createElement('div'); pw.style.cssText='display:flex;gap:5px;'; g.forEach(c=>{let p=document.createElement('div'); p.style.cssText=`width:15px;height:15px;background:${cols[c]}`;pw.appendChild(p);}); let rw=document.createElement('div'); rw.style.cssText='display:flex;gap:5px;'; let ex=0; let ans=[1,3,0,2]; for(let i=0;i<4;i++){let d=document.createElement('div');d.style.cssText='width:10px;height:10px;border-radius:50%;'; if(g[i]===ans[i]){d.style.background='#0f6';ex++;}else if(ans.includes(g[i])){d.style.background='#DAA520';}else{d.style.background='#f33';} rw.appendChild(d);} r.append(pw,rw); hist.prepend(r); if(ex===4) this.winInteractive(); else this.playSound('error'); });
                wrap.append(docks, btn, hist); inner.appendChild(wrap); break;
            }
            case 10: { // 10. التروس الميكانيكية (تدوير)
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:flex; gap:20px; align-items:center;';
                let angs = [45, 135, 225];
                for(let i=0; i<3; i++) {
                    let g = document.createElement('div'); g.style.cssText = `width:100px; height:100px; border-radius:50%; border:8px dashed #555; display:flex; justify-content:center; align-items:center; cursor:pointer; transition:0.5s cubic-bezier(0.4,0,0.2,1); transform:rotate(${angs[i]}deg); background:radial-gradient(circle,#111,#000); box-shadow:0 0 15px #000;`;
                    let c = document.createElement('div'); c.style.cssText = 'width:30px; height:30px; background:#333; border-radius:50%; border:4px solid #111;';
                    let m = document.createElement('div'); m.style.cssText = 'position:absolute; width:10px; height:10px; background:#D4AF37; top:5px; border-radius:50%; box-shadow:0 0 5px #D4AF37;';
                    g.append(c, m);
                    g.onclick = () => { this.playSound('click'); angs[i]=(angs[i]+45)%360; g.style.transform=`rotate(${angs[i]}deg)`; if(angs.every(a=>a===0)) setTimeout(()=>this.winInteractive(), 400); };
                    wrap.appendChild(g);
                } inner.appendChild(wrap); break;
            }
            case 11: { // 11. النبض الضوئي (مورس SUN)
                let lens = document.createElement('div'); lens.style.cssText = 'width:140px; height:140px; border-radius:50%; background:#000; border:10px solid #222; display:flex; justify-content:center; align-items:center; box-shadow:0 10px 30px #000; margin-bottom:30px;';
                let core = document.createElement('div'); core.style.cssText = 'width:50px; height:50px; border-radius:50%; background:#050505; transition:0.1s; box-shadow:inset 0 0 20px #000;'; lens.appendChild(core); inner.appendChild(lens);
                let seq = [200,200,200, 800, 200,200,600, 800, 600,200]; let step = 0; // SUN
                this.stageState.timer = setInterval(()=>{ core.style.background='#D4AF37'; core.style.boxShadow='0 0 50px #D4AF37'; setTimeout(()=>{core.style.background='#050505'; core.style.boxShadow='inset 0 0 20px #000';}, seq[step]); step++; if(step>=seq.length)step=0; }, 1200);
                let inp = createInput('DECODE PULSE...'); let btn = createBtn('EXECUTE', ()=>{ if(inp.value.trim().toUpperCase()==='SUN'){ clearInterval(this.stageState.timer); this.winInteractive(); } else this.failRoom(); }); inner.append(inp, btn); break;
            }
            case 12: { // 12. شبكة سداسية (مسار)
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:5px;';
                let rows = [3, 4, 3]; let cells = []; let idx = 0;
                rows.forEach(r => { let row = document.createElement('div'); row.style.cssText = 'display:flex; gap:5px;'; for(let i=0; i<r; i++){ let c=document.createElement('div'); c.style.cssText='width:60px;height:70px;clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);background:#111;cursor:pointer;transition:0.3s;display:flex;justify-content:center;align-items:center;color:#444;font-weight:bold;'; c.innerText=idx; let curr = idx; c.onclick=()=>{this.playSound('click'); c.classList.toggle('a'); c.style.background=c.classList.contains('a')?'#D4AF37':'#111'; c.style.color=c.classList.contains('a')?'#000':'#444'; let act=cells.map((x,k)=>x.classList.contains('a')?k:-1).filter(x=>x!==-1); if(JSON.stringify(act)==='[3,4,5]') setTimeout(()=>this.winInteractive(), 300); }; row.appendChild(c); cells.push(c); idx++; } wrap.appendChild(row); }); inner.appendChild(wrap); break;
            }
            case 13: { // 13. خلط الألوان (منزلقات RGB للذهبي)
                let wrap = document.createElement('div'); wrap.style.cssText = 'width:100%; max-width:400px; display:flex; flex-direction:column; gap:20px; align-items:center;';
                let disp = document.createElement('div'); disp.style.cssText = 'width:100px; height:100px; background:#000; border:4px solid #333; border-radius:8px; transition:0.3s; margin-bottom:10px; box-shadow:inset 0 0 20px rgba(0,0,0,0.8);'; wrap.appendChild(disp);
                let sls = []; ['RED','GREEN'].forEach(c=>{ let r=document.createElement('div'); r.style.cssText='width:100%; display:flex; gap:15px; align-items:center; background:#0a0a0a; padding:15px; border:1px solid #222; border-radius:4px;'; let l=document.createElement('span'); l.innerText=c; l.style.cssText='color:#888; font-family:monospace; width:50px; font-weight:bold;'; let s=document.createElement('input'); s.type='range'; s.min=0; s.max=255; s.value=0; s.style.flexGrow='1'; s.oninput=()=>{ disp.style.background=`rgb(${sls[0].value}, ${sls[1].value}, 55)`; }; r.append(l,s); wrap.appendChild(r); sls.push(s); });
                let btn = createBtn('FUSE', ()=>{ if(Math.abs(sls[0].value-212)<20 && Math.abs(sls[1].value-175)<20) this.winInteractive(); else this.failRoom(); }); wrap.appendChild(btn); inner.appendChild(wrap); break;
            }
            case 14: { // 14. متاهة خفية (شبكة 6x6)
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:grid; grid-template-columns:repeat(6, 45px); gap:2px; background:#111; padding:5px; border:2px solid #333;';
                let path = [0,6,12,13,14,20,26,32,33,34,35];
                for(let i=0; i<36; i++) { let c = document.createElement('div'); c.style.cssText='height:45px; background:#050505; cursor:pointer; transition:0.2s;'; c.onclick=()=>{ if(path[this.stageState.clicks]===i){ c.style.background='#D4AF37'; this.stageState.clicks++; if(this.stageState.clicks===path.length) setTimeout(()=>this.winInteractive(), 300); } else { this.failRoom(); this.setupStage(); } }; wrap.appendChild(c); } inner.appendChild(wrap); break;
            }
            case 15: { // 15. الكريبتكس (أسطوانة أرقام عمودية)
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:flex; gap:10px; background:#111; padding:20px; border:4px solid #222; border-radius:8px; box-shadow:0 10px 30px #000;';
                let vals = [0,0,0,0]; let ans = [7,3,9,2];
                for(let i=0; i<4; i++){ let col = document.createElement('div'); col.style.cssText='display:flex; flex-direction:column; gap:5px; align-items:center;'; let up=document.createElement('div'); up.innerText='▲'; up.style.cssText='cursor:pointer; color:#555; font-size:1.5rem; user-select:none;'; let num=document.createElement('div'); num.innerText=0; num.style.cssText='width:60px; height:80px; background:linear-gradient(180deg,#333,#111); border:2px solid #D4AF37; display:flex; justify-content:center; align-items:center; font-size:2.5rem; color:#D4AF37; font-family:monospace; box-shadow:inset 0 0 10px #000;'; let dn=document.createElement('div'); dn.innerText='▼'; dn.style.cssText='cursor:pointer; color:#555; font-size:1.5rem; user-select:none;'; up.onclick=()=>{this.playSound('click'); vals[i]=(vals[i]+1)%10; num.innerText=vals[i]; if(JSON.stringify(vals)===JSON.stringify(ans)) setTimeout(()=>this.winInteractive(), 300); }; dn.onclick=()=>{this.playSound('click'); vals[i]=(vals[i]-1+10)%10; num.innerText=vals[i]; if(JSON.stringify(vals)===JSON.stringify(ans)) setTimeout(()=>this.winInteractive(), 300); }; col.append(up,num,dn); wrap.appendChild(col); } inner.appendChild(wrap); break;
            }
            case 16: { // 16. الكؤوس المعدنية (تتبع الكرة)
                let wrap = document.createElement('div'); wrap.style.cssText = 'position:relative; width:300px; height:150px; display:flex; align-items:center;';
                let cups = []; let target = Math.floor(Math.random()*3);
                for(let i=0; i<3; i++){ let c=document.createElement('div'); c.style.cssText=`position:absolute; width:70px; height:90px; background:linear-gradient(180deg, #444, #111); border-radius:10px 10px 4px 4px; border-bottom:8px solid #222; left:${i*100+15}px; top:30px; transition:left 0.4s ease-in-out; cursor:pointer; display:flex; justify-content:center; align-items:flex-end; color:transparent; font-size:2rem; padding-bottom:10px; box-shadow:0 15px 20px rgba(0,0,0,0.8);`; c.innerText = (i===target) ? '⚙' : ''; c.onclick=()=>{ if(this.stageState.playing) return; if(i===target) { c.style.color='#D4AF37'; c.style.transform='translateY(-30px)'; this.playSound('success'); setTimeout(()=>this.winInteractive(), 800); } else { c.style.transform='translateY(-30px)'; this.failRoom(); setTimeout(()=>this.setupStage(), 1000); } }; wrap.appendChild(c); cups.push(c); } inner.appendChild(wrap);
                setTimeout(()=>{ cups.forEach(c=>c.style.color='transparent'); let shuffles=0; let iv=setInterval(()=>{ let a=Math.floor(Math.random()*3), b=Math.floor(Math.random()*3); let tl=cups[a].style.left; cups[a].style.left=cups[b].style.left; cups[b].style.left=tl; shuffles++; if(shuffles>10){ clearInterval(iv); this.stageState.playing=false; } }, 450); }, 1500); break;
            }
            case 17: { // 17. الباركود المعطوب (تبديل أعمدة)
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:flex; gap:4px; height:120px; background:#fff; padding:10px; border-radius:4px; margin-bottom:20px; box-shadow:0 0 20px rgba(255,255,255,0.1);';
                let target = [1,0,1,0,0,1,0,1,0,1]; let curr = [1,0,0,0,0,0,0,0,0,1];
                for(let i=0; i<10; i++){ let b=document.createElement('div'); b.style.cssText=`width:18px; height:100%; background:${curr[i]?'#000':'#ccc'}; cursor:pointer; transition:0.2s;`; b.onclick=()=>{ this.playSound('click'); curr[i]=curr[i]?0:1; b.style.background=curr[i]?'#000':'#ccc'; }; wrap.appendChild(b); }
                let btn = createBtn('VERIFY SCAN', ()=>{ if(JSON.stringify(curr)===JSON.stringify(target)) this.winInteractive(); else this.failRoom(); }); inner.append(wrap, btn); break;
            }
            case 18: { // 18. قرص الراديو (موجة وتدوير)
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:flex; flex-direction:column; align-items:center; width:100%;';
                let wave = document.createElement('div'); wave.style.cssText = 'width:80%; height:80px; background:#000; border:2px solid #333; margin-bottom:30px; position:relative; overflow:hidden; border-radius:4px;';
                let line = document.createElement('div'); line.style.cssText = 'position:absolute; width:100%; height:100%; background:repeating-linear-gradient(90deg, transparent, transparent 10px, #D4AF37 10px, #D4AF37 12px); opacity:0.3; transition:0.3s;'; wave.appendChild(line);
                let dial = document.createElement('div'); dial.style.cssText = 'width:120px; height:120px; border-radius:50%; background:conic-gradient(#222,#000,#222,#000,#222); border:4px solid #444; cursor:pointer; display:flex; justify-content:center; box-shadow:0 10px 20px #000; transition:transform 0.1s;';
                let tick = document.createElement('div'); tick.style.cssText = 'width:4px; height:20px; background:#fff; margin-top:5px; border-radius:2px;'; dial.appendChild(tick);
                let txt = document.createElement('div'); txt.style.cssText = 'font-family:monospace; font-size:2rem; color:#D4AF37; margin-top:20px;'; txt.innerText = '000.0';
                let ang = 0; dial.onclick = () => { this.playSound('click'); ang+=15; dial.style.transform=`rotate(${ang}deg)`; let f = ang%360; txt.innerText = f+'.0'; let diff = Math.abs(f-195); line.style.background = `repeating-linear-gradient(90deg, transparent, transparent ${diff/2}px, #D4AF37 ${diff/2}px, #D4AF37 ${diff/2+2}px)`; if(f===195){ line.style.background='#D4AF37'; setTimeout(()=>this.winInteractive(), 500); } };
                wrap.append(wave, dial, txt); inner.appendChild(wrap); break;
            }
            case 19: { // 19. إطفاء الأنوار (Lights Out 3x3)
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:6px;'; let cells = [];
                for(let i=0; i<9; i++){ let c=document.createElement('div'); c.style.cssText = 'width:80px; height:80px; background:#D4AF37; border-radius:6px; cursor:pointer; box-shadow:0 0 20px #D4AF37; transition:0.1s;'; c.dataset.on='1'; c.onclick=()=>{ this.playSound('click'); let tg=(idx)=>{let el=cells[idx]; let st=el.dataset.on==='1'; el.dataset.on=st?'0':'1'; el.style.background=st?'#111':'#D4AF37'; el.style.boxShadow=st?'inset 0 0 15px #000':'0 0 20px #D4AF37';}; tg(i); let r=Math.floor(i/3), cl=i%3; if(r>0)tg(i-3); if(r<2)tg(i+3); if(cl>0)tg(i-1); if(cl<2)tg(i+1); if(cells.every(x=>x.dataset.on==='0')) setTimeout(()=>this.winInteractive(), 400); }; cells.push(c); wrap.appendChild(c); } inner.appendChild(wrap); break;
            }
            case 20: { // 20. الشذوذ البصري (مربع واحد لونه مختلف بدرجة)
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:grid; grid-template-columns:repeat(6, 45px); gap:3px;'; let target = Math.floor(Math.random()*36);
                for(let i=0; i<36; i++){ let c=document.createElement('div'); c.style.cssText=`width:45px; height:45px; background:${i===target?'#2a2a2a':'#222'}; cursor:pointer; border-radius:2px; transition:0.2s;`; c.onclick=()=>{ if(i===target){ c.style.background='#D4AF37'; this.playSound('success'); setTimeout(()=>this.winInteractive(), 400); } else { this.failRoom(); this.setupStage(); } }; wrap.appendChild(c); } inner.appendChild(wrap); break;
            }
            case 21: { // 21. الانزلاق الفسيفسائي (3x3 ترتيب أرقام)
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 85px); gap:4px; background:#222; padding:8px; border:2px solid #555; border-radius:6px; box-shadow:0 15px 25px rgba(0,0,0,0.9);';
                let state = [1,2,3,4,6,8,7,5,0]; const draw = () => { wrap.innerHTML=''; state.forEach((n,i)=>{ let t=document.createElement('div'); if(n===0) t.style.cssText='width:85px;height:85px;border:1px dashed #444;'; else { t.style.cssText='width:85px;height:85px;background:linear-gradient(135deg,#D4AF37,#8a7322);display:flex;justify-content:center;align-items:center;font-size:2.5rem;font-weight:bold;color:#000;cursor:pointer;border-radius:4px;box-shadow:inset 0 0 10px rgba(0,0,0,0.3);user-select:none;'; t.innerText=n; t.onclick=()=>{ let z=state.indexOf(0); let v=[z-1,z+1,z-3,z+3]; if(z%3===0 && i===z-1)return; if(z%3===2 && i===z+1)return; if(v.includes(i)){ this.playSound('click'); state[z]=n; state[i]=0; draw(); if(state.join('')==='123456780') setTimeout(()=>this.winInteractive(),300); } }; } wrap.appendChild(t); }); }; draw(); inner.appendChild(wrap); break;
            }
            case 22: { // 22. روابط الجينات (DNA مطابقة عمودية)
                let wrap = document.createElement('div'); wrap.style.cssText='display:flex; flex-direction:column; gap:10px; align-items:center;'; let bases = ['A','C','G','T']; let target = ['T','G','A','C']; let curr = ['A','A','A','A'];
                target.forEach((t, i) => { let row = document.createElement('div'); row.style.cssText='display:flex; gap:30px; position:relative;'; let lLine = document.createElement('div'); lLine.style.cssText='position:absolute; top:50%; left:25px; width:40px; height:2px; background:#333; z-index:0;'; let l=document.createElement('div'); l.style.cssText='width:50px;height:50px;border-radius:50%;background:#111;border:2px solid #444;display:flex;justify-content:center;align-items:center;color:#666;font-weight:bold;font-size:1.5rem;z-index:1;'; l.innerText=(t==='T'?'A':(t==='G'?'C':(t==='A'?'T':'G'))); let r=document.createElement('div'); r.style.cssText='width:50px;height:50px;border-radius:50%;background:#000;border:2px solid #D4AF37;color:#D4AF37;display:flex;justify-content:center;align-items:center;font-weight:bold;font-size:1.5rem;cursor:pointer;z-index:1;box-shadow:inset 0 0 10px #000;'; r.innerText='A'; r.onclick=()=>{ this.playSound('click'); let idx=(bases.indexOf(r.innerText)+1)%4; r.innerText=bases[idx]; curr[i]=bases[idx]; }; row.append(lLine, l, r); wrap.appendChild(row); });
                let btn = createBtn('SYNTHESIZE', ()=>{ if(JSON.stringify(curr)===JSON.stringify(target)) this.winInteractive(); else this.failRoom(); }); inner.append(wrap, btn); break;
            }
            case 23: { // 23. خطوط الطاقة (أنابيب)
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); background:#111; padding:10px; border:4px solid #222; border-radius:8px;';
                let pipes = ['┗','━','┛','┃','╋','┃','┏','━','┓']; let rots = [0,90,0, 90,0,90, 0,90,0];
                for(let i=0; i<9; i++){ let p = document.createElement('div'); p.style.cssText = `width:80px;height:80px;background:#050505;border:1px solid #1a1a1a;display:flex;justify-content:center;align-items:center;font-size:3.5rem;color:#D4AF37;cursor:pointer;user-select:none;transition:transform 0.2s;transform:rotate(${rots[i]}deg);text-shadow:0 0 10px #D4AF37;`; p.innerText=pipes[i]; p.onclick=()=>{ this.playSound('click'); rots[i]=(rots[i]+90)%360; p.style.transform=`rotate(${rots[i]}deg)`; if(rots.every(x=>x===0)) setTimeout(()=>this.winInteractive(), 400); }; wrap.appendChild(p); } inner.appendChild(wrap); break;
            }
            case 24: { // 24. المربع السحري (مجموع 15)
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:grid; grid-template-columns:repeat(3, 70px); gap:6px; margin-bottom:20px;';
                let grid = [8,1,6, 3,0,7, 4,9,2];
                for(let i=0; i<9; i++){ let b=document.createElement('div'); b.style.cssText=`width:70px; height:70px; background:#0a0a0a; border:2px solid ${i===4?'#D4AF37':'#333'}; display:flex; justify-content:center; align-items:center; font-size:2rem; font-family:monospace; font-weight:bold; color:${i===4?'#D4AF37':'#555'}; border-radius:4px; ${i===4?'cursor:pointer; box-shadow:inset 0 0 15px rgba(212,175,55,0.2);':''}`; b.innerText=grid[i]; if(i===4){ b.onclick=()=>{ this.playSound('click'); grid[i]=grid[i]>=9?1:grid[i]+1; b.innerText=grid[i]; }; } wrap.appendChild(b); }
                let btn = createBtn('CALCULATE SUM', ()=>{ if(grid[4]===5) this.winInteractive(); else this.failRoom(); }); inner.append(wrap, btn); break;
            }
            case 25: { // 25. الخريطة الحرارية (ترتيب الألوان)
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:flex; gap:10px; margin-bottom:20px;';
                let cols = ['#ff0000', '#ff8800', '#ffcc00', '#ffff66']; let order = [3,1,0,2]; // عشوائي
                order.forEach(idx => { let b=document.createElement('div'); b.style.cssText=`width:70px; height:70px; background:${cols[idx]}; border-radius:6px; cursor:pointer; box-shadow:inset 0 0 20px rgba(0,0,0,0.5); border:2px solid #111;`; b.onclick=()=>{ this.playSound('click'); b.style.opacity='0.2'; b.style.pointerEvents='none'; this.stageState.arr.push(idx); if(this.stageState.arr.length===4){ if(JSON.stringify(this.stageState.arr)==='[0,1,2,3]') this.winInteractive(); else { this.failRoom(); this.setupStage(); } } }; wrap.appendChild(b); });
                let lbl = document.createElement('div'); lbl.style.cssText='color:#888; letter-spacing:2px; font-family:monospace; margin-top:20px;'; lbl.innerText='SEQUENCE: HOT TO COLD'; inner.append(wrap, lbl); break;
            }
            case 26: { // 26. شفرات الماتريكس (التقاط النص)
                let wrap = document.createElement('div'); wrap.style.cssText = 'position:relative; width:100%; max-width:400px; height:300px; background:#000; border:2px solid #333; overflow:hidden;'; inner.appendChild(wrap);
                this.stageState.timer = setInterval(()=>{ let w=document.createElement('div'); let isT=Math.random()>0.8; w.innerText=isT?'SOLAR':Math.random().toString(36).substring(2,7).toUpperCase(); w.style.cssText=`position:absolute; left:${Math.random()*80}%; top:-20px; color:${isT?'#fff':'#0f6'}; font-family:monospace; font-weight:bold; font-size:1.2rem; cursor:pointer; user-select:none;`; w.onclick=()=>{ if(isT){ clearInterval(this.stageState.timer); this.winInteractive(); } else this.failRoom(); }; wrap.appendChild(w); let p=-20; let iv=setInterval(()=>{ p+=3; w.style.top=p+'px'; if(p>320){ clearInterval(iv); w.remove(); } }, 50); }, 700); break;
            }
            case 27: { // 27. لوحة المصعد (دوران وحفظ)
                let wrap = document.createElement('div'); wrap.style.cssText = 'width:280px; height:280px; transition:transform 0.8s cubic-bezier(0.68,-0.55,0.27,1.55); background:#111; border:4px solid #D4AF37; border-radius:50%; display:grid; grid-template-columns:repeat(4,1fr); padding:20px; gap:5px; box-shadow:0 0 30px rgba(212,175,55,0.2);';
                let cells=[]; for(let i=0; i<16; i++){ let c=document.createElement('div'); c.style.cssText='background:#000; border:1px solid #333; border-radius:50%; cursor:pointer; transition:0.2s;'; c.onclick=()=>{ if(this.stageState.playing)return; this.playSound('click'); c.style.background='#D4AF37'; c.style.boxShadow='0 0 15px #D4AF37'; this.stageState.arr.push(i); if(this.stageState.arr.length===4){ let ans=[12,9,6,3]; if(JSON.stringify([...this.stageState.arr].sort())===JSON.stringify([...ans].sort())) this.winInteractive(); else { this.failRoom(); setTimeout(()=>this.setupStage(), 800); } } }; cells.push(c); wrap.appendChild(c); } inner.appendChild(wrap);
                setTimeout(()=>{ [0,5,10,15].forEach(i=>{cells[i].style.background='#fff'; cells[i].style.boxShadow='0 0 20px #fff';}); this.playSound('success'); setTimeout(()=>{ cells.forEach(c=>{c.style.background='#000'; c.style.boxShadow='none';}); wrap.style.transform='rotate(90deg)'; this.stageState.playing=false; }, 2000); }, 800); break;
            }
            case 28: { // 28. تحكم الماستر (مفاتيح فيزيائية)
                let wrap = document.createElement('div'); wrap.style.cssText = 'display:flex; gap:25px; margin-bottom:30px;';
                for(let i=0; i<3; i++){ let sw = document.createElement('div'); sw.style.cssText='position:relative; width:70px; height:110px; background:#111; border:2px solid #333; border-radius:6px; cursor:pointer; box-shadow:0 10px 20px #000;'; let h=document.createElement('div'); h.style.cssText='position:absolute; width:50px; height:45px; background:linear-gradient(180deg,#333,#111); border:1px solid #555; border-radius:4px; top:10px; left:8px; transition:0.3s; box-shadow:0 5px 10px #000;'; sw.appendChild(h); sw.onclick=()=>{ this.playSound('click'); sw.classList.toggle('a'); if(sw.classList.contains('a')){ h.style.top='53px'; h.style.background='linear-gradient(180deg,#D4AF37,#8a7322)'; h.style.boxShadow='0 -5px 15px rgba(212,175,55,0.5)'; } else { h.style.top='10px'; h.style.background='linear-gradient(180deg,#333,#111)'; h.style.boxShadow='0 5px 10px #000'; } }; wrap.appendChild(sw); }
                let inp = createInput('AUTHORIZATION CODE'); let btn = createBtn('INITIATE OVERRIDE', ()=>{ if(Array.from(wrap.children).every(x=>x.classList.contains('a')) && inp.value.trim().toUpperCase()==='GOLDEN') this.winInteractive(); else this.failRoom(); }); btn.style.borderColor='#ff0000'; btn.style.color='#ff0000'; inner.append(wrap, inp, btn); break;
            }
            case 29: { // 29. شاشة الدوس (المنفذ الرقمي Hex)
                let disp = document.createElement('div'); disp.style.cssText = 'width:100%; max-width:400px; height:120px; background:#050505; border:2px solid #333; border-radius:6px; margin-bottom:20px; display:flex; justify-content:center; align-items:center; font-family:monospace; font-size:4rem; color:#D4AF37; text-shadow:0 0 15px #D4AF37; position:relative; overflow:hidden; box-shadow:inset 0 0 30px #000;'; disp.innerText='0x1A';
                let scan = document.createElement('div'); scan.style.cssText = 'position:absolute; width:100%; height:2px; background:rgba(212,175,55,0.4); top:0; pointer-events:none;'; disp.appendChild(scan); inner.appendChild(disp);
                let p=0; this.stageState.timer = setInterval(()=>{ p+=2; if(p>100)p=0; scan.style.top=p+'%'; }, 40);
                let inp = createInput('DECIMAL FORMAT'); let btn = createBtn('BYPASS PORT', ()=>{ if(inp.value.trim()==='26'){ clearInterval(this.stageState.timer); this.winInteractive(); } else this.failRoom(); }); inner.append(inp, btn); break;
            }
            case 30: { // 30. النواة (حقل إدخال فقط، الباب الأخير)
                let icon = document.createElement('div'); icon.innerText='👑'; icon.style.cssText='font-size:6rem; margin-bottom:20px; filter:drop-shadow(0 0 20px #D4AF37);'; inner.appendChild(icon);
                let inp = createInput('ENTER FINAL PROTOCOL'); let btn = createBtn('ACCESS CORE', ()=>{ if(inp.value.trim().toUpperCase()==='GOLDEN') this.winInteractive(); else this.failRoom(); }); inner.append(inp, btn); break;
            }
        }
    }

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
            this.playSound('success'); this.solvedGates.add(this.activeGate.id); this.addCoins(15);
            this.showToast('تم اختراق الروم بنجاح! +15 بيانات', '#00ff66'); this.returnToLobby();
        } else { this.failRoom(); }
    }
    
    failRoom() { this.playSound('error'); this.triggerVisualGlitch(); this.showToast('فشل الاختراق! أعد المحاولة.', '#ff3333'); }

    toggleAdminSidebar(open) { this.playSound('click'); const s = document.getElementById('admin-sidebar'); open ? s.classList.add('open') : s.classList.remove('open'); }
    adminInstantSolveGate() { this.playSound('click'); if(!this.activeGate) return; this.toggleAdminSidebar(false); this.solvedGates.add(this.activeGate.id); this.addCoins(15); this.showToast('تم تخطي الروم إجبارياً بواسطة الآدمن!', '#00ff66'); this.returnToLobby(); }
    returnToLobby() { if(this.stageState.timer) clearInterval(this.stageState.timer); this.playSound('click'); this.switchScreen('lobby'); this.renderLobby(); }
}

const game = new SolarGamesEngine();
