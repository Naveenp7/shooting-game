let audioCtx = null;

const getCtx = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
};

export const playSound = (type) => {
    try {
        const ctx = getCtx();

        if (type === 'shoot') {
            // Punchy laser shot — layered oscillators
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);

            // High sweep
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(1200, ctx.currentTime);
            osc1.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);

            // Low thump
            osc2.type = 'square';
            osc2.frequency.setValueAtTime(200, ctx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.05);

            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

            osc1.start();
            osc2.start();
            osc1.stop(ctx.currentTime + 0.1);
            osc2.stop(ctx.currentTime + 0.1);
        } else if (type === 'hit') {
            // Satisfying explosion — noise-like burst + falling tone
            const osc = ctx.createOscillator();
            const noise = ctx.createOscillator();
            const gain = ctx.createGain();
            const noiseGain = ctx.createGain();

            osc.connect(gain);
            noise.connect(noiseGain);
            noiseGain.connect(gain);
            gain.connect(ctx.destination);

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

            osc.start();
            noise.start();
            osc.stop(ctx.currentTime + 0.3);
            noise.stop(ctx.currentTime + 0.3);
        }
    } catch (e) {
        // Silently ignore audio errors (user hasn't interacted yet, etc.)
    }
};
