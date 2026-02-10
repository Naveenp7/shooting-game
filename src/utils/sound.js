let audioCtx = null;
let _soundEnabled = true;

const getCtx = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
};

export const setSoundEnabled = (enabled) => {
    _soundEnabled = enabled;
};

export const playSound = (type) => {
    if (!_soundEnabled) return;
    try {
        const ctx = getCtx();

        if (type === 'shoot') {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(1200, ctx.currentTime);
            osc1.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);
            osc2.type = 'square';
            osc2.frequency.setValueAtTime(200, ctx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            osc1.start(); osc2.start();
            osc1.stop(ctx.currentTime + 0.1); osc2.stop(ctx.currentTime + 0.1);

        } else if (type === 'hit') {
            const osc = ctx.createOscillator();
            const noise = ctx.createOscillator();
            const gain = ctx.createGain();
            const noiseGain = ctx.createGain();
            osc.connect(gain); noise.connect(noiseGain); noiseGain.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.25);
            noise.type = 'sawtooth';
            noise.frequency.setValueAtTime(800, ctx.currentTime);
            noise.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.15);
            noiseGain.gain.setValueAtTime(0.08, ctx.currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start(); noise.start();
            osc.stop(ctx.currentTime + 0.3); noise.stop(ctx.currentTime + 0.3);

        } else if (type === 'bomb') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.4);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.start(); osc.stop(ctx.currentTime + 0.4);

        } else if (type === 'powerup') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            osc.start(); osc.stop(ctx.currentTime + 0.25);

        } else if (type === 'countdown') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.start(); osc.stop(ctx.currentTime + 0.15);

        } else if (type === 'go') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start(); osc.stop(ctx.currentTime + 0.3);

        } else if (type === 'streak') {
            // Rising arpeggio for kill streaks
            [0, 100, 200].forEach((delay, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(500 + i * 200, ctx.currentTime + delay / 1000);
                gain.gain.setValueAtTime(0.08, ctx.currentTime + delay / 1000);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay / 1000 + 0.15);
                osc.start(ctx.currentTime + delay / 1000);
                osc.stop(ctx.currentTime + delay / 1000 + 0.15);
            });
        }
    } catch (e) {
        // Silently ignore audio errors
    }
};
