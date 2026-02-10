import { useEffect, useRef } from 'react';
import { useGameStore } from '../store';
import { checkCollision } from '../utils/collision';
import { spawnTarget, updateTargets } from '../utils/spawnTargets';
import { playSound } from '../utils/sound';

/**
 * Main game loop hook.
 * Uses gestureRef from useHandTracking for smooth, pre-processed input.
 */
export const useGameLoop = (canvasRef, landmarksRef, gestureRef, isPlaying) => {
    const storeRef = useRef({});
    const gameState = useRef({
        targets: [],
        particles: [],
        muzzleFlashes: [],    // Muzzle flash effects
        screenShake: { x: 0, y: 0, intensity: 0 },
        cursor: { x: 0, y: 0 },
        wasTriggerDown: false,
        lastShotTime: 0,
        shootCooldown: 250,   // Slightly faster for better feel
        lastTimeDec: Date.now(),
        score: 0,
        combo: 0,             // Combo counter for consecutive hits
        comboTimer: 0,
        initialized: false,
        frameCount: 0,
    });

    const store = useGameStore();
    storeRef.current = store;

    useEffect(() => {
        if (!canvasRef.current || !isPlaying) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let running = true;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        if (!gameState.current.initialized) {
            gameState.current.targets = [];
            gameState.current.particles = [];
            gameState.current.muzzleFlashes = [];
            gameState.current.cursor = { x: canvas.width / 2, y: canvas.height / 2 };
            gameState.current.lastTimeDec = Date.now();
            gameState.current.score = 0;
            gameState.current.combo = 0;
            gameState.current.comboTimer = 0;
            gameState.current.wasTriggerDown = false;
            gameState.current.frameCount = 0;
            for (let i = 0; i < 5; i++) {
                gameState.current.targets.push(spawnTarget(canvas.width, canvas.height));
            }
            gameState.current.initialized = true;
        }

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        const render = () => {
            if (!running) return;

            const { width, height } = canvas;
            if (width === 0 || height === 0) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                animationFrameId = requestAnimationFrame(render);
                return;
            }

            gameState.current.frameCount++;
            const gs = gameState.current;

            // Apply screen shake offset
            ctx.save();
            if (gs.screenShake.intensity > 0.1) {
                gs.screenShake.x = (Math.random() - 0.5) * gs.screenShake.intensity;
                gs.screenShake.y = (Math.random() - 0.5) * gs.screenShake.intensity;
                gs.screenShake.intensity *= 0.85; // Decay
                ctx.translate(gs.screenShake.x, gs.screenShake.y);
            } else {
                gs.screenShake.intensity = 0;
            }

            ctx.clearRect(-10, -10, width + 20, height + 20);

            // ---- 1. Process gesture input ----
            const g = gestureRef.current;
            if (g) {
                // Map normalized cursor to canvas pixels
                gs.cursor.x = g.cursorX * width;
                gs.cursor.y = g.cursorY * height;

                const isTriggerDown = g.isTriggerDown;
                const now = Date.now();

                // FIRE on trigger down edge (was up, now down)
                if (isTriggerDown && !gs.wasTriggerDown && now - gs.lastShotTime > gs.shootCooldown) {
                    gs.lastShotTime = now;
                    playSound('shoot');

                    // Screen shake on shoot
                    gs.screenShake.intensity = 8;

                    // Muzzle flash
                    gs.muzzleFlashes.push({
                        x: gs.cursor.x,
                        y: gs.cursor.y,
                        life: 1.0,
                        radius: 35,
                    });

                    // Check collision
                    const hitIndex = checkCollision(gs.cursor, gs.targets);
                    if (hitIndex !== null) {
                        const hitTarget = gs.targets[hitIndex];

                        // Combo scoring
                        gs.combo++;
                        gs.comboTimer = 120; // frames to maintain combo
                        const comboMultiplier = Math.min(gs.combo, 5);
                        const points = 10 * comboMultiplier;
                        gs.score += points;
                        storeRef.current.setScore(gs.score);
                        playSound('hit');

                        // Bigger screen shake on hit
                        gs.screenShake.intensity = 15;

                        // Explosion particles (more particles, radial burst)
                        const numParticles = 20 + gs.combo * 3;
                        for (let i = 0; i < numParticles; i++) {
                            const angle = (Math.PI * 2 * i) / numParticles + (Math.random() - 0.5) * 0.3;
                            const speed = Math.random() * 10 + 3;
                            gs.particles.push({
                                x: hitTarget.x,
                                y: hitTarget.y,
                                dx: Math.cos(angle) * speed,
                                dy: Math.sin(angle) * speed,
                                life: 1.0,
                                color: hitTarget.color,
                                radius: Math.random() * 5 + 2,
                                type: 'explosion',
                            });
                        }

                        // Score popup particle
                        gs.particles.push({
                            x: hitTarget.x,
                            y: hitTarget.y - 20,
                            dx: 0,
                            dy: -2,
                            life: 1.0,
                            color: '#fff',
                            radius: 0,
                            type: 'score',
                            text: `+${points}`,
                            combo: gs.combo > 1 ? `x${gs.combo}` : '',
                        });

                        // Ring shockwave
                        gs.particles.push({
                            x: hitTarget.x,
                            y: hitTarget.y,
                            dx: 0,
                            dy: 0,
                            life: 1.0,
                            color: hitTarget.color,
                            radius: hitTarget.radius,
                            type: 'shockwave',
                        });

                        gs.targets.splice(hitIndex, 1);
                        gs.targets.push(spawnTarget(width, height));
                    } else {
                        // Missed — reset combo
                        gs.combo = 0;
                    }
                }

                gs.wasTriggerDown = isTriggerDown;
            }

            // Combo timer decay
            if (gs.comboTimer > 0) {
                gs.comboTimer--;
                if (gs.comboTimer <= 0) gs.combo = 0;
            }

            // ---- 2. Update Game Objects ----
            gs.targets = updateTargets(gs.targets, width, height);

            // Update Particles
            gs.particles = gs.particles
                .map(p => {
                    if (p.type === 'shockwave') {
                        return { ...p, radius: p.radius + 8, life: p.life - 0.06 };
                    }
                    return {
                        ...p,
                        x: p.x + p.dx,
                        y: p.y + p.dy,
                        dy: p.dy + (p.type === 'explosion' ? 0.15 : 0), // gravity for explosions
                        life: p.life - (p.type === 'score' ? 0.015 : 0.025),
                    };
                })
                .filter(p => p.life > 0);

            // Update Muzzle Flashes
            gs.muzzleFlashes = gs.muzzleFlashes
                .map(f => ({ ...f, life: f.life - 0.15 }))
                .filter(f => f.life > 0);

            // ---- 3. Draw Everything ----

            // Draw Targets
            gs.targets.forEach(target => {
                const pulse = 1 + Math.sin(gs.frameCount * 0.05 + target.id) * 0.05;
                const r = target.radius * pulse;

                // Outer glow
                ctx.save();
                ctx.shadowBlur = 40;
                ctx.shadowColor = target.color;
                ctx.globalAlpha = 0.4;
                ctx.beginPath();
                ctx.arc(target.x, target.y, r + 5, 0, Math.PI * 2);
                ctx.fillStyle = target.color;
                ctx.fill();
                ctx.restore();

                // Main body
                const grad = ctx.createRadialGradient(target.x, target.y, 0, target.x, target.y, r);
                grad.addColorStop(0, 'white');
                grad.addColorStop(0.3, target.color);
                grad.addColorStop(1, target.color + '44');
                ctx.beginPath();
                ctx.arc(target.x, target.y, r, 0, Math.PI * 2);
                ctx.fillStyle = grad;
                ctx.fill();

                // Inner rings
                ctx.beginPath();
                ctx.arc(target.x, target.y, r * 0.55, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(target.x, target.y, r * 0.2, 0, Math.PI * 2);
                ctx.fillStyle = 'white';
                ctx.fill();
            });

            // Draw Shockwaves
            gs.particles.filter(p => p.type === 'shockwave').forEach(p => {
                ctx.save();
                ctx.globalAlpha = p.life * 0.6;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 3 * p.life;
                ctx.shadowBlur = 15;
                ctx.shadowColor = p.color;
                ctx.stroke();
                ctx.restore();
            });

            // Draw Explosion Particles
            gs.particles.filter(p => p.type === 'explosion').forEach(p => {
                ctx.save();
                ctx.globalAlpha = p.life;
                ctx.shadowBlur = 8;
                ctx.shadowColor = p.color;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * (0.5 + p.life * 0.5), 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // Draw Score Popups
            gs.particles.filter(p => p.type === 'score').forEach(p => {
                ctx.save();
                ctx.globalAlpha = p.life;
                ctx.font = `bold ${24 + (1 - p.life) * 10}px monospace`;
                ctx.fillStyle = '#00f3ff';
                ctx.textAlign = 'center';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#00f3ff';
                ctx.fillText(p.text, p.x, p.y);
                if (p.combo) {
                    ctx.font = 'bold 16px monospace';
                    ctx.fillStyle = '#ff00ff';
                    ctx.shadowColor = '#ff00ff';
                    ctx.fillText(p.combo, p.x, p.y + 22);
                }
                ctx.restore();
            });

            // Draw Muzzle Flashes
            gs.muzzleFlashes.forEach(f => {
                ctx.save();
                ctx.globalAlpha = f.life;
                const flashGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius * f.life);
                flashGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                flashGrad.addColorStop(0.3, 'rgba(255, 200, 50, 0.6)');
                flashGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
                ctx.fillStyle = flashGrad;
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // Draw Cursor / Crosshair with recoil animation
            const { x, y } = gs.cursor;
            const recoilAmount = gestureRef.current?.recoilAmount || 0;
            const isTrigger = gestureRef.current?.isTriggerDown;
            // Recoil kicks cursor visually upward
            const recoilOffsetY = -recoilAmount * 40;
            const drawX = x;
            const drawY = y + recoilOffsetY;
            const cursorColor = recoilAmount > 0.3 ? '#ff3333' : '#00f3ff';
            const outerRadius = 22 - recoilAmount * 8;

            ctx.save();
            ctx.strokeStyle = cursorColor;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 20;
            ctx.shadowColor = cursorColor;

            // Rotating outer ring
            const rotAngle = gs.frameCount * 0.02;
            ctx.beginPath();
            ctx.arc(drawX, drawY, outerRadius, rotAngle, rotAngle + Math.PI * 1.5);
            ctx.stroke();

            // Second arc (opposite)
            ctx.beginPath();
            ctx.arc(drawX, drawY, outerRadius, rotAngle + Math.PI, rotAngle + Math.PI * 2.5);
            ctx.stroke();

            // Inner dot (pulses on recoil)
            const dotR = 2 + recoilAmount * 6;
            ctx.beginPath();
            ctx.arc(drawX, drawY, dotR, 0, Math.PI * 2);
            ctx.fillStyle = cursorColor;
            ctx.fill();

            // Crosshair lines
            const lineLen = 28;
            const gap = outerRadius + 4;
            ctx.beginPath();
            ctx.moveTo(drawX - lineLen - gap, drawY); ctx.lineTo(drawX - gap, drawY);
            ctx.moveTo(drawX + gap, drawY); ctx.lineTo(drawX + lineLen + gap, drawY);
            ctx.moveTo(drawX, drawY - lineLen - gap); ctx.lineTo(drawX, drawY - gap);
            ctx.moveTo(drawX, drawY + gap); ctx.lineTo(drawX, drawY + lineLen + gap);
            ctx.stroke();

            ctx.restore();

            // Combo display (bottom center)
            if (gs.combo > 1) {
                ctx.save();
                ctx.globalAlpha = Math.min(1, gs.comboTimer / 30);
                ctx.font = 'bold 36px monospace';
                ctx.fillStyle = '#ff00ff';
                ctx.textAlign = 'center';
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#ff00ff';
                ctx.fillText(`COMBO x${gs.combo}`, width / 2, height - 60);
                ctx.restore();
            }

            // Aim assist indicator (bottom-left) — shows readiness
            if (gestureRef.current) {
                ctx.save();
                ctx.globalAlpha = 0.4;
                ctx.font = '11px monospace';
                ctx.fillStyle = '#00f3ff';
                ctx.fillText('⬆ JERK UP TO SHOOT', 20, height - 20);
                ctx.restore();
            }

            ctx.restore(); // End screen shake transform

            // ---- 4. Timer Logic ----
            const now = Date.now();
            if (now - gs.lastTimeDec > 1000) {
                storeRef.current.decrementTime();
                gs.lastTimeDec = now;
            }

            const currentTimeLeft = storeRef.current.timeLeft;
            if (currentTimeLeft !== undefined && currentTimeLeft <= 0) {
                storeRef.current.addHighScore(gs.score, storeRef.current.playerName);
                storeRef.current.setGameStatus('gameover');
                gs.initialized = false;
                running = false;
                return;
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            running = false;
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, [canvasRef, isPlaying]);
};
