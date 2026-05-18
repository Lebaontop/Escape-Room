class MajesticEscape {
    constructor() {
        this.coins = 60;
        this.activeGate = null;
        this.timer = null;
        this.timeLeft = 0;
        this.isPaused = false;
        this.solvedGates = new Set();
        this.wireSequence = [];

        this.puzzles = this.buildPuzzles();
        this.init();
    }

    init() {
        this.renderLobby();
        this.updateStats();
    }

    buildPuzzles() {
        const types = ["TEXT", "WIRE", "MORSE", "IMAGE"];
        return Array.from({ length: 30 }, (_, i) => ({
            id: i + 1,
            type: i % 4 === 1 ? "WIRE" : "TEXT",
            title: `القطاع الإستراتيجي #${i + 1}`,
            desc: i % 4 === 1 ? "⚠️ نظام تفجير: اقطع السلك الأحمر ثم الأزرق." : `فك شفرة القطاع ${i+1} (win${i+1})`,
            answer: `win${i+1}`,
            seq: ["red", "blue"],
            hint: `الجواب هو win${i+1}`
        }));
    }

    switchScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(`screen-${id}`).classList.remove('hidden');
        document.getElementById('main-nav').classList.toggle('hidden', id === 'welcome');
    }

    startLobby() { this.switchScreen('lobby'); }

    renderLobby() {
        const container = document.getElementById('gates-container');
        container.innerHTML = '';
        for (let i = 1; i <= 30; i++) {
            const gate = document.createElement('div');
            gate.className = `gate-card ${this.solvedGates.has(i) ? 'solved' : ''}`;
            gate.innerHTML = `<small>SECTOR</small><h3>${i}</h3>`;
            gate.onclick = () => this.handleGateClick(i);
            container.appendChild(gate);
        }
    }

    handleGateClick(id) {
        if(this.solvedGates.has(id)) return;
        let mins = prompt("حدد وقت الباب بالدقائق:", "5");
        if(!mins) return;
        
        this.activeGate = this.puzzles.find(p => p.id === id);
        this.timeLeft = parseInt(mins) * 60;
        this.wireSequence = [];
        this.setupPuzzleUI();
        this.startTimer();
        this.switchScreen('puzzle');
    }

    setupPuzzleUI() {
        const p = this.activeGate;
        document.getElementById('puzzle-title').innerText = p.title;
        document.getElementById('puzzle-desc').innerText = p.desc;
        document.getElementById('wire-stage').classList.toggle('hidden', p.type !== 'WIRE');
        document.getElementById('input-area').classList.toggle('hidden', p.type === 'WIRE');
        document.getElementById('user-input').value = '';
        document.querySelectorAll('.wire').forEach(w => w.classList.remove('cut'));
    }

    cutWire(color) {
        event.target.classList.add('cut');
        this.wireSequence.push(color);
        const correct = this.activeGate.seq;
        const currentIdx = this.wireSequence.length - 1;

        if (this.wireSequence[currentIdx] !== correct[currentIdx]) {
            this.notify("🚨 خطأ! السلك خطأ!", "error");
            this.timeLeft -= 20;
            this.wireSequence = [];
            document.querySelectorAll('.wire').forEach(w => w.classList.remove('cut'));
        } else if (this.wireSequence.length === correct.length) {
            this.onSolved();
        }
    }

    startTimer() {
        clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (!this.isPaused && this.timeLeft > 0) {
                this.timeLeft--;
                this.updateTimerUI();
            } else if (this.timeLeft === 0) {
                this.onFail();
            }
        }, 1000);
    }

    updateTimerUI() {
        const m = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
        const s = (this.timeLeft % 60).toString().padStart(2, '0');
        document.getElementById('timer-display').innerText = `${m}:${s}`;
    }

    checkResult() {
        if (document.getElementById('user-input').value.trim().toLowerCase() === this.activeGate.answer) {
            this.onSolved();
        } else {
            this.notify("الشفرة خاطئة!", "error");
        }
    }

    onSolved() {
        clearInterval(this.timer);
        this.coins += 15;
        this.solvedGates.add(this.activeGate.id);
        this.notify("✅ تم الاختراق!");
        this.updateStats();
        this.renderLobby();
        this.switchScreen('lobby');
    }

    onFail() { alert("انتهى الوقت!"); this.switchScreen('lobby'); }

    toggleAdmin() { document.getElementById('panel-admin').classList.toggle('hidden'); }
    adminUpdateCoins(v) { this.coins += v; this.updateStats(); }
    adminUpdateTime(v) { this.timeLeft += v; this.updateTimerUI(); }

    openMarket() { document.getElementById('panel-market').classList.remove('hidden'); }
    closeMarket() { document.getElementById('panel-market').classList.add('hidden'); }
    buy(type) {
        let cost = type === 'hint' ? 30 : 60;
        if(this.coins < cost) return this.notify("الرصيد لا يكفي", "error");
        this.coins -= cost;
        if(type === 'hint') alert(`تلميح: ${this.activeGate.hint}`);
        else this.timeLeft += 60;
        this.updateStats();
        this.closeMarket();
    }

    returnToLobby() { if(confirm("تراجع؟")) this.switchScreen('lobby'); }
    updateStats() { document.getElementById('coin-val').innerText = this.coins; }
    notify(m, t="success") {
        const c = document.getElementById('toast-container');
        const n = document.createElement('div');
        n.className = 'toast';
        if(t==='error') n.style.borderRightColor = 'red';
        n.innerText = m;
        c.appendChild(n);
        setTimeout(()=>n.remove(), 3000);
    }
}

const game = new MajesticEscape();