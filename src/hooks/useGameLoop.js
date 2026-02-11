import { useEffect, useRef } from 'react';
import { useGameStore } from '../store';
import { checkCollision } from '../utils/collision';
import { spawnTarget, updateTargets, TARGET_TYPES, POWERUP_TYPES, spawnWave } from '../utils/spawnTargets';
import { playSound, setSoundEnabled } from '../utils/sound';
import { saveScoreToFirebase } from '../utils/firebaseLeaderboard';

/**
 * Main game loop with all features:
 * - Difficulty scaling
 * - Target types (normal, bonus, bomb, power-up)
 * - Power-ups (slow-mo, multi-shot, time-freeze)
 * - Cursor trail
 * - Kill streak effects
 * - Shatter animations
 * - Survival mode (max targets)
 * - Pause on hand loss
 * - Background particles
 * - Stats tracking
 */
export const useGameLoop = (canvasRef, landmarksRef, gestureRef, isPlaying) => {
    const storeRef = useRef({});
    const gameState = useRef({
        targets: [],
        particles: [],
        muzzleFlashes: [],
        bgParticles: [],       // Floating background particles
        cursorTrail: [],       // Trail positions
        screenShake: { x: 0, y: 0, intensity: 0 },
        borderFlash: 0,        // Kill streak border flash
        cursor: { x: 0, y: 0 },
        wasTriggerDown: false,
        lastShotTime: 0,
        shootCooldown: 250,
        lastTimeDec: Date.now(),
        score: 0,
        combo: 0,
        comboTimer: 0,
        initialized: false,
        frameCount: 0,
        // Difficulty
        difficultyTimer: 0,
        currentDifficulty: 1,
        // Power-ups
        activePowerUps: {
            slow_mo: 0,       // frames remaining
            multi_shot: 0,
            time_freeze: 0,
        },
        // Survival mode
        survivalLives: 3,
        maxTargetsOnScreen: 12,
        // Pause
        handLostFrames: 0,
        // Stats
        shotsFired: 0,
        targetsHit: 0,
        targetsMissed: 0,
        bestCombo: 0,
        bonusHit: 0,
        bombsHit: 0,
        powerUpsCollected: 0,
        // Streak
        streakText: '',
        streakTimer: 0,
        // Kill streak messages
        streakMessages: ['', '', '', 'TRIPLE KILL!', 'QUAD KILL!', 'UNSTOPPABLE!', 'GODLIKE!', 'LEGENDARY!'],
    });

    const store = useGameStore();
    storeRef.current = store;

    // Sync sound toggle
    setSoundEnabled(store.soundEnabled);

    useEffect(() => {
        if (!canvasRef.current || !isPlaying) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let running = true;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const gs = gameState.current;
        const mode = storeRef.current.gameMode;

        if (!gs.initialized) {
            gs.targets = [];
            gs.particles = [];
            gs.muzzleFlashes = [];
            gs.cursorTrail = [];
            gs.cursor = { x: canvas.width / 2, y: canvas.height / 2 };
            gs.lastTimeDec = Date.now();
            gs.score = 0;
            gs.combo = 0;
            gs.comboTimer = 0;
            gs.wasTriggerDown = false;
            gs.frameCount = 0;
            gs.difficultyTimer = 0;
            gs.currentDifficulty = 1;
            gs.activePowerUps = { slow_mo: 0, multi_shot: 0, time_freeze: 0 };
            gs.survivalLives = 3;
            gs.handLostFrames = 0;
            gs.shotsFired = 0;
            gs.targetsHit = 0;
            gs.targetsMissed = 0;
            gs.bestCombo = 0;
            gs.borderFlash = 0;
            gs.streakText = '';
            gs.streakTimer = 0;

            // Spawn initial background particles
            gs.bgParticles = [];
            for (let i = 0; i < 40; i++) {
                gs.bgParticles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 2 + 0.5,
                    speed: Math.random() * 0.5 + 0.1,
                    alpha: Math.random() * 0.3 + 0.05,
                    color: ['#00f3ff', '#a855f6', '#ff00ff'][Math.floor(Math.random() * 3)],
                });
            }

            // Spawn initial targets
            const initialCount = mode === 'survival' ? 3 : 5;
            gs.targets = spawnWave(initialCount, canvas.width, canvas.height, 1);
            gs.initialized = true;
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

            gs.frameCount++;

            // ---- Screen shake ----
            ctx.save();
            if (gs.screenShake.intensity > 0.1) {
                gs.screenShake.x = (Math.random() - 0.5) * gs.screenShake.intensity;
                gs.screenShake.y = (Math.random() - 0.5) * gs.screenShake.intensity;
                gs.screenShake.intensity *= 0.85;
                ctx.translate(gs.screenShake.x, gs.screenShake.y);
            } else {
                gs.screenShake.intensity = 0;
            }

            ctx.clearRect(-10, -10, width + 20, height + 20);

            // ---- 0. Draw background particles ----
            gs.bgParticles.forEach(p => {
                p.y -= p.speed;
                if (p.y < 0) { p.y = height; p.x = Math.random() * width; }
                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // ---- 1. Process gesture input ----
            const g = gestureRef.current;
            const hasHand = g && landmarksRef.current;

            if (hasHand) {
                gs.handLostFrames = 0;
                gs.cursor.x = g.cursorX * width;
                gs.cursor.y = g.cursorY * height;

                // Cursor trail
                gs.cursorTrail.push({ x: gs.cursor.x, y: gs.cursor.y, life: 1.0 });
                if (gs.cursorTrail.length > 20) gs.cursorTrail.shift();

                const isTriggerDown = g.isTriggerDown;
                const now = Date.now();

                if (isTriggerDown && !gs.wasTriggerDown && now - gs.lastShotTime > gs.shootCooldown) {
                    gs.lastShotTime = now;
                    gs.shotsFired++;
                    playSound('shoot');
                    gs.screenShake.intensity = 8;

                    gs.muzzleFlashes.push({ x: gs.cursor.x, y: gs.cursor.y, life: 1.0, radius: 35 });

                    // Multi-shot: check larger area
                    const hitRadius = gs.activePowerUps.multi_shot > 0 ? 80 : 0;
                    let hitAny = false;

                    // Check all targets for hits
                    const hitIndices = [];
                    gs.targets.forEach((target, idx) => {
                        const dx = gs.cursor.x - target.x;
                        const dy = gs.cursor.y - target.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < target.radius + hitRadius) {
                            hitIndices.push(idx);
                        }
                    });

                    // Single shot without multi: only closest
                    if (gs.activePowerUps.multi_shot <= 0 && hitIndices.length > 0) {
                        // Use normal collision
                        const singleHit = checkCollision(gs.cursor, gs.targets);
                        if (singleHit !== null) {
                            hitIndices.length = 0;
                            hitIndices.push(singleHit);
                        } else {
                            hitIndices.length = 0;
                        }
                    }

                    if (hitIndices.length > 0) {
                        hitAny = true;
                        // Process hits in reverse order to splice correctly
                        hitIndices.sort((a, b) => b - a).forEach(hitIndex => {
                            const hitTarget = gs.targets[hitIndex];

                            if (hitTarget.type === TARGET_TYPES.BOMB) {
                                // BOMB: lose points, red flash
                                gs.score = Math.max(0, gs.score - 20);
                                storeRef.current.setScore(gs.score);
                                storeRef.current.setScore(gs.score);
                                storeRef.current.incrementStat('bombsHit');
                                gs.bombsHit++;
                                playSound('bomb');
                                gs.screenShake.intensity = 25;
                                gs.combo = 0;

                                // Red explosion
                                for (let i = 0; i < 25; i++) {
                                    const angle = (Math.PI * 2 * i) / 25;
                                    gs.particles.push({
                                        x: hitTarget.x, y: hitTarget.y,
                                        dx: Math.cos(angle) * (Math.random() * 12 + 4),
                                        dy: Math.sin(angle) * (Math.random() * 12 + 4),
                                        life: 1.0, color: '#ff0000', radius: Math.random() * 5 + 3, type: 'explosion',
                                    });
                                }
                                gs.particles.push({
                                    x: hitTarget.x, y: hitTarget.y - 20, dx: 0, dy: -2,
                                    life: 1.0, color: '#ff0000', radius: 0, type: 'score', text: '-20', combo: '',
                                });

                            } else if (hitTarget.type === TARGET_TYPES.POWERUP) {
                                // POWER-UP
                                const puType = hitTarget.powerUpType;
                                playSound('powerup');
                                storeRef.current.incrementStat('powerUpsCollected');
                                gs.powerUpsCollected++;

                                if (puType === POWERUP_TYPES.SLOW_MO) {
                                    gs.activePowerUps.slow_mo = 300; // ~5 seconds
                                } else if (puType === POWERUP_TYPES.MULTI_SHOT) {
                                    gs.activePowerUps.multi_shot = 300;
                                } else if (puType === POWERUP_TYPES.TIME_FREEZE) {
                                    gs.activePowerUps.time_freeze = 300;
                                    storeRef.current.setTimeLeft(storeRef.current.timeLeft + 10);
                                }

                                gs.score += 5;
                                storeRef.current.setScore(gs.score);

                                // Green sparkle
                                for (let i = 0; i < 12; i++) {
                                    const angle = (Math.PI * 2 * i) / 12;
                                    gs.particles.push({
                                        x: hitTarget.x, y: hitTarget.y,
                                        dx: Math.cos(angle) * 5, dy: Math.sin(angle) * 5,
                                        life: 1.0, color: '#00ff88', radius: 3, type: 'explosion',
                                    });
                                }
                                // Power-up name popup
                                const puNames = { slow_mo: 'SLOW-MO!', multi_shot: 'MULTI-SHOT!', time_freeze: '+10 SEC!' };
                                gs.particles.push({
                                    x: hitTarget.x, y: hitTarget.y - 20, dx: 0, dy: -1.5,
                                    life: 1.5, color: '#00ff88', radius: 0, type: 'score', text: puNames[puType], combo: '',
                                });

                            } else {
                                // NORMAL or BONUS hit
                                gs.combo++;
                                gs.comboTimer = 120;
                                const comboMultiplier = Math.min(gs.combo, 5);
                                const basePoints = hitTarget.points;
                                const points = basePoints * comboMultiplier;
                                gs.score += points;
                                gs.targetsHit++;
                                if (gs.combo > gs.bestCombo) gs.bestCombo = gs.combo;
                                storeRef.current.setScore(gs.score);

                                if (hitTarget.type === TARGET_TYPES.BONUS) {
                                    playSound('powerup');
                                    storeRef.current.incrementStat('bonusHit');
                                    gs.bonusHit++;
                                } else {
                                    playSound('hit');
                                    storeRef.current.incrementStat('targetsHit');
                                }

                                gs.screenShake.intensity = 15;

                                // Kill streak check
                                if (gs.combo >= 3 && gs.combo < gs.streakMessages.length) {
                                    gs.streakText = gs.streakMessages[gs.combo];
                                    gs.streakTimer = 90;
                                    gs.borderFlash = 1.0;
                                    if (gs.combo >= 5) playSound('streak');
                                }

                                // Explosion
                                const numP = 20 + gs.combo * 2;
                                for (let i = 0; i < numP; i++) {
                                    const angle = (Math.PI * 2 * i) / numP + (Math.random() - 0.5) * 0.3;
                                    const speed = Math.random() * 10 + 3;
                                    gs.particles.push({
                                        x: hitTarget.x, y: hitTarget.y,
                                        dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed,
                                        life: 1.0, color: hitTarget.color, radius: Math.random() * 5 + 2, type: 'explosion',
                                    });
                                }

                                // Shockwave ring
                                gs.particles.push({
                                    x: hitTarget.x, y: hitTarget.y, dx: 0, dy: 0,
                                    life: 1.0, color: hitTarget.color, radius: hitTarget.radius, type: 'shockwave',
                                });

                                // Shatter fragments (triangular debris)
                                for (let i = 0; i < 6; i++) {
                                    const angle = (Math.PI * 2 * i) / 6;
                                    gs.particles.push({
                                        x: hitTarget.x, y: hitTarget.y,
                                        dx: Math.cos(angle) * (Math.random() * 6 + 2),
                                        dy: Math.sin(angle) * (Math.random() * 6 + 2) - 3,
                                        life: 1.0, color: hitTarget.color, radius: hitTarget.radius * 0.3,
                                        type: 'shard', rotation: Math.random() * Math.PI * 2, spin: (Math.random() - 0.5) * 0.2,
                                    });
                                }

                                // Score popup
                                gs.particles.push({
                                    x: hitTarget.x, y: hitTarget.y - 20, dx: 0, dy: -2,
                                    life: 1.0, color: hitTarget.type === TARGET_TYPES.BONUS ? '#ffd700' : '#fff', radius: 0,
                                    type: 'score', text: `+${points}`, combo: gs.combo > 1 ? `x${gs.combo}` : '',
                                });
                            }

                            gs.targets.splice(hitIndex, 1);
                        });

                        // Respawn targets
                        hitIndices.forEach(() => {
                            gs.targets.push(spawnTarget(width, height, gs.currentDifficulty));
                        });
                    }

                    if (!hitAny) {
                        gs.combo = 0;
                        gs.targetsMissed++;
                    }
                }

                gs.wasTriggerDown = isTriggerDown;
            } else {
                // Hand lost — auto-pause after 90 frames (~3s)
                gs.handLostFrames++;
            }

            // ---- Combo timer decay ----
            if (gs.comboTimer > 0) { gs.comboTimer--; if (gs.comboTimer <= 0) gs.combo = 0; }
            if (gs.streakTimer > 0) gs.streakTimer--;
            if (gs.borderFlash > 0) gs.borderFlash *= 0.95;

            // ---- Power-up timers ----
            Object.keys(gs.activePowerUps).forEach(key => {
                if (gs.activePowerUps[key] > 0) gs.activePowerUps[key]--;
            });

            // ---- Difficulty scaling ----
            gs.difficultyTimer++;
            if (gs.difficultyTimer % 600 === 0) { // Every ~10s at 60fps
                gs.currentDifficulty = Math.min(gs.currentDifficulty + 1, 8);
                storeRef.current.setDifficulty(gs.currentDifficulty);
            }

            // ---- Survival mode: spawn more targets ----
            if (mode === 'survival') {
                const maxTargets = 5 + gs.currentDifficulty * 2;
                if (gs.targets.length < maxTargets && gs.frameCount % 120 === 0) {
                    gs.targets.push(spawnTarget(width, height, gs.currentDifficulty));
                }
                // Game over if too many targets
                if (gs.targets.length > gs.maxTargetsOnScreen) {
                    gs.survivalLives--;
                    if (gs.survivalLives <= 0) {
                        finishGame();
                        return;
                    }
                    // Remove excess targets
                    while (gs.targets.length > gs.maxTargetsOnScreen - 3) {
                        gs.targets.pop();
                    }
                }
            }

            // ---- 2. Update Game Objects ----
            const isSlowMo = gs.activePowerUps.slow_mo > 0;
            gs.targets = updateTargets(gs.targets, width, height, isSlowMo);

            // Update cursor trail
            gs.cursorTrail = gs.cursorTrail.map(p => ({ ...p, life: p.life - 0.06 })).filter(p => p.life > 0);

            // Update Particles
            gs.particles = gs.particles.map(p => {
                if (p.type === 'shockwave') return { ...p, radius: p.radius + 8, life: p.life - 0.06 };
                if (p.type === 'shard') return {
                    ...p, x: p.x + p.dx, y: p.y + p.dy, dy: p.dy + 0.3,
                    life: p.life - 0.02, rotation: (p.rotation || 0) + (p.spin || 0),
                };
                return {
                    ...p, x: p.x + p.dx, y: p.y + p.dy,
                    dy: p.dy + (p.type === 'explosion' ? 0.15 : 0),
                    life: p.life - (p.type === 'score' ? 0.012 : 0.025),
                };
            }).filter(p => p.life > 0);

            gs.muzzleFlashes = gs.muzzleFlashes.map(f => ({ ...f, life: f.life - 0.15 })).filter(f => f.life > 0);

            // ---- 3. Draw Everything ----

            // Draw Targets
            gs.targets.forEach(target => {
                const pulse = 1 + Math.sin(gs.frameCount * 0.05 + target.id) * 0.05;
                const r = target.radius * pulse;

                ctx.save();

                if (target.type === TARGET_TYPES.BOMB) {
                    // Bomb: pulsing red with skull-like inner
                    ctx.shadowBlur = 40;
                    ctx.shadowColor = '#ff0000';
                    ctx.globalAlpha = 0.5 + Math.sin(gs.frameCount * 0.1) * 0.3;
                    ctx.beginPath(); ctx.arc(target.x, target.y, r + 5, 0, Math.PI * 2);
                    ctx.fillStyle = '#ff0000'; ctx.fill();
                    ctx.globalAlpha = 1;
                    ctx.beginPath(); ctx.arc(target.x, target.y, r, 0, Math.PI * 2);
                    ctx.fillStyle = '#330000'; ctx.fill();
                    ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 2; ctx.stroke();
                    // X mark
                    ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 3;
                    const s = r * 0.4;
                    ctx.beginPath();
                    ctx.moveTo(target.x - s, target.y - s); ctx.lineTo(target.x + s, target.y + s);
                    ctx.moveTo(target.x + s, target.y - s); ctx.lineTo(target.x - s, target.y + s);
                    ctx.stroke();

                } else if (target.type === TARGET_TYPES.BONUS) {
                    // Gold bonus: star-like shimmer
                    ctx.shadowBlur = 50;
                    ctx.shadowColor = '#ffd700';
                    const goldGrad = ctx.createRadialGradient(target.x, target.y, 0, target.x, target.y, r);
                    goldGrad.addColorStop(0, '#fff');
                    goldGrad.addColorStop(0.3, '#ffd700');
                    goldGrad.addColorStop(1, '#ff8c00');
                    ctx.beginPath(); ctx.arc(target.x, target.y, r, 0, Math.PI * 2);
                    ctx.fillStyle = goldGrad; ctx.fill();
                    // Star sparkle
                    ctx.fillStyle = '#fff';
                    for (let i = 0; i < 4; i++) {
                        const a = (gs.frameCount * 0.03) + (Math.PI / 2) * i;
                        ctx.beginPath();
                        ctx.arc(target.x + Math.cos(a) * r * 0.6, target.y + Math.sin(a) * r * 0.6, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    // Points label
                    ctx.font = 'bold 12px monospace';
                    ctx.fillStyle = '#ffd700';
                    ctx.textAlign = 'center';
                    ctx.fillText('50', target.x, target.y + 4);

                } else if (target.type === TARGET_TYPES.POWERUP) {
                    // Power-up: green glowing diamond
                    ctx.shadowBlur = 30;
                    ctx.shadowColor = '#00ff88';
                    ctx.beginPath(); ctx.arc(target.x, target.y, r, 0, Math.PI * 2);
                    ctx.fillStyle = '#00ff8833'; ctx.fill();
                    ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 2; ctx.stroke();
                    // Icon based on type
                    ctx.font = 'bold 14px monospace';
                    ctx.fillStyle = '#00ff88';
                    ctx.textAlign = 'center';
                    const icons = { slow_mo: '⏱', multi_shot: '◎', time_freeze: '⏸' };
                    ctx.fillText(icons[target.powerUpType] || '★', target.x, target.y + 5);

                } else {
                    // Normal target
                    ctx.shadowBlur = 40;
                    ctx.shadowColor = target.color;
                    ctx.globalAlpha = 0.4;
                    ctx.beginPath(); ctx.arc(target.x, target.y, r + 5, 0, Math.PI * 2);
                    ctx.fillStyle = target.color; ctx.fill();
                    ctx.globalAlpha = 1;
                    const grad = ctx.createRadialGradient(target.x, target.y, 0, target.x, target.y, r);
                    grad.addColorStop(0, 'white');
                    grad.addColorStop(0.3, target.color);
                    grad.addColorStop(1, target.color + '44');
                    ctx.beginPath(); ctx.arc(target.x, target.y, r, 0, Math.PI * 2);
                    ctx.fillStyle = grad; ctx.fill();
                    ctx.beginPath(); ctx.arc(target.x, target.y, r * 0.55, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
                    ctx.beginPath(); ctx.arc(target.x, target.y, r * 0.2, 0, Math.PI * 2);
                    ctx.fillStyle = 'white'; ctx.fill();
                }

                ctx.restore();
            });

            // Draw Shockwaves
            gs.particles.filter(p => p.type === 'shockwave').forEach(p => {
                ctx.save();
                ctx.globalAlpha = p.life * 0.6;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.strokeStyle = p.color; ctx.lineWidth = 3 * p.life;
                ctx.shadowBlur = 15; ctx.shadowColor = p.color;
                ctx.stroke(); ctx.restore();
            });

            // Draw Shards (triangular debris)
            gs.particles.filter(p => p.type === 'shard').forEach(p => {
                ctx.save();
                ctx.globalAlpha = p.life;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation || 0);
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.moveTo(0, -p.radius);
                ctx.lineTo(-p.radius * 0.6, p.radius * 0.5);
                ctx.lineTo(p.radius * 0.6, p.radius * 0.5);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            });

            // Draw Explosion Particles
            gs.particles.filter(p => p.type === 'explosion').forEach(p => {
                ctx.save();
                ctx.globalAlpha = p.life;
                ctx.shadowBlur = 8; ctx.shadowColor = p.color;
                ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * (0.5 + p.life * 0.5), 0, Math.PI * 2);
                ctx.fill(); ctx.restore();
            });

            // Draw Score Popups
            gs.particles.filter(p => p.type === 'score').forEach(p => {
                ctx.save();
                ctx.globalAlpha = Math.min(1, p.life);
                ctx.font = `bold ${24 + (1 - p.life) * 10}px monospace`;
                ctx.fillStyle = p.color;
                ctx.textAlign = 'center';
                ctx.shadowBlur = 10; ctx.shadowColor = p.color;
                ctx.fillText(p.text, p.x, p.y);
                if (p.combo) {
                    ctx.font = 'bold 16px monospace';
                    ctx.fillStyle = '#ff00ff'; ctx.shadowColor = '#ff00ff';
                    ctx.fillText(p.combo, p.x, p.y + 22);
                }
                ctx.restore();
            });

            // Draw Muzzle Flashes
            gs.muzzleFlashes.forEach(f => {
                ctx.save(); ctx.globalAlpha = f.life;
                const flashGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius * f.life);
                flashGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
                flashGrad.addColorStop(0.3, 'rgba(255,200,50,0.6)');
                flashGrad.addColorStop(1, 'rgba(255,50,0,0)');
                ctx.fillStyle = flashGrad;
                ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
                ctx.fill(); ctx.restore();
            });

            // Draw Cursor Trail
            gs.cursorTrail.forEach((pt, i) => {
                ctx.save();
                ctx.globalAlpha = pt.life * 0.4;
                ctx.fillStyle = '#00f3ff';
                ctx.shadowBlur = 8; ctx.shadowColor = '#00f3ff';
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 3 * pt.life, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // Draw Cursor / Crosshair
            const { x, y } = gs.cursor;
            const recoilAmount = gestureRef.current?.recoilAmount || 0;
            const recoilOffsetY = -recoilAmount * 40;
            const drawX = x;
            const drawY = y + recoilOffsetY;
            const cursorColor = recoilAmount > 0.3 ? '#ff3333' : (gs.activePowerUps.multi_shot > 0 ? '#ffaa00' : '#00f3ff');
            const outerRadius = 22 - recoilAmount * 8;

            ctx.save();
            ctx.strokeStyle = cursorColor;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 20; ctx.shadowColor = cursorColor;

            const rotAngle = gs.frameCount * 0.02;
            ctx.beginPath(); ctx.arc(drawX, drawY, outerRadius, rotAngle, rotAngle + Math.PI * 1.5); ctx.stroke();
            ctx.beginPath(); ctx.arc(drawX, drawY, outerRadius, rotAngle + Math.PI, rotAngle + Math.PI * 2.5); ctx.stroke();

            // Multi-shot range indicator
            if (gs.activePowerUps.multi_shot > 0) {
                ctx.globalAlpha = 0.15;
                ctx.beginPath(); ctx.arc(drawX, drawY, 80, 0, Math.PI * 2);
                ctx.strokeStyle = '#ffaa00'; ctx.lineWidth = 1; ctx.stroke();
                ctx.globalAlpha = 1;
            }

            const dotR = 2 + recoilAmount * 6;
            ctx.beginPath(); ctx.arc(drawX, drawY, dotR, 0, Math.PI * 2);
            ctx.fillStyle = cursorColor; ctx.fill();

            const lineLen = 28; const gap = outerRadius + 4;
            ctx.beginPath();
            ctx.moveTo(drawX - lineLen - gap, drawY); ctx.lineTo(drawX - gap, drawY);
            ctx.moveTo(drawX + gap, drawY); ctx.lineTo(drawX + lineLen + gap, drawY);
            ctx.moveTo(drawX, drawY - lineLen - gap); ctx.lineTo(drawX, drawY - gap);
            ctx.moveTo(drawX, drawY + gap); ctx.lineTo(drawX, drawY + lineLen + gap);
            ctx.stroke();
            ctx.restore();

            // ---- Kill Streak flash & text ----
            if (gs.borderFlash > 0.01) {
                ctx.save();
                ctx.globalAlpha = gs.borderFlash * 0.3;
                ctx.strokeStyle = '#ff00ff';
                ctx.lineWidth = 6;
                ctx.shadowBlur = 30; ctx.shadowColor = '#ff00ff';
                ctx.strokeRect(0, 0, width, height);
                ctx.restore();
            }

            if (gs.streakTimer > 0 && gs.streakText) {
                ctx.save();
                ctx.globalAlpha = Math.min(1, gs.streakTimer / 30);
                ctx.font = `bold ${48 + Math.sin(gs.frameCount * 0.1) * 4}px monospace`;
                ctx.fillStyle = '#ff00ff';
                ctx.textAlign = 'center';
                ctx.shadowBlur = 20; ctx.shadowColor = '#ff00ff';
                ctx.fillText(gs.streakText, width / 2, height / 2 - 60);
                ctx.restore();
            }

            // Combo display
            if (gs.combo > 1) {
                ctx.save();
                ctx.globalAlpha = Math.min(1, gs.comboTimer / 30);
                ctx.font = 'bold 32px monospace';
                ctx.fillStyle = '#ff00ff'; ctx.textAlign = 'center';
                ctx.shadowBlur = 15; ctx.shadowColor = '#ff00ff';
                ctx.fillText(`COMBO x${gs.combo}`, width / 2, height - 50);
                ctx.restore();
            }

            // Active power-ups display (top center)
            const activePUs = Object.entries(gs.activePowerUps).filter(([, v]) => v > 0);
            if (activePUs.length > 0) {
                ctx.save();
                const puLabels = { slow_mo: '⏱ SLOW-MO', multi_shot: '◎ MULTI-SHOT', time_freeze: '⏸ TIME FREEZE' };
                activePUs.forEach(([key, frames], i) => {
                    const secs = Math.ceil(frames / 60);
                    ctx.globalAlpha = 0.8;
                    ctx.font = 'bold 14px monospace';
                    ctx.fillStyle = key === 'slow_mo' ? '#00f3ff' : key === 'multi_shot' ? '#ffaa00' : '#00ff88';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${puLabels[key]} ${secs}s`, width / 2, 80 + i * 22);
                });
                ctx.restore();
            }

            // Slow-mo vignette
            if (isSlowMo) {
                ctx.save();
                const vigGrad = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.7);
                vigGrad.addColorStop(0, 'transparent');
                vigGrad.addColorStop(1, 'rgba(0,100,255,0.12)');
                ctx.fillStyle = vigGrad;
                ctx.fillRect(0, 0, width, height);
                ctx.restore();
            }

            // Bottom-left hint
            ctx.save(); ctx.globalAlpha = 0.3;
            ctx.font = '11px monospace'; ctx.fillStyle = '#00f3ff';
            ctx.fillText('⬆ JERK UP TO SHOOT', 20, height - 20);
            ctx.restore();

            // Survival mode: lives display
            if (mode === 'survival') {
                ctx.save();
                ctx.font = '16px monospace'; ctx.fillStyle = '#ff3333';
                ctx.textAlign = 'right';
                ctx.fillText(`♥ ${gs.survivalLives}`, width - 20, 90);
                ctx.restore();
            }

            // Difficulty level indicator
            if (gs.currentDifficulty > 1) {
                ctx.save(); ctx.globalAlpha = 0.4;
                ctx.font = '11px monospace'; ctx.fillStyle = '#ffaa00';
                ctx.fillText(`LVL ${gs.currentDifficulty}`, 20, height - 40);
                ctx.restore();
            }

            ctx.restore(); // End screen shake transform

            // ---- 4. Timer Logic ----
            if (mode !== 'freeplay' && gs.activePowerUps.time_freeze <= 0) {
                const now = Date.now();
                if (now - gs.lastTimeDec > 1000) {
                    storeRef.current.decrementTime();
                    gs.lastTimeDec = now;
                }
            }

            const currentTimeLeft = storeRef.current.timeLeft;
            if (mode === 'arcade' && currentTimeLeft !== undefined && currentTimeLeft <= 0) {
                finishGame();
                return;
            }

            animationFrameId = requestAnimationFrame(render);
        };

        const finishGame = () => {
            // Save final stats locally
            const finalStats = {
                shotsFired: gs.shotsFired,
                targetsHit: gs.targetsHit,
                targetsMissed: gs.targetsMissed,
                bestCombo: gs.bestCombo,
                bonusHit: gs.bonusHit,
                bombsHit: gs.bombsHit,
                powerUpsCollected: gs.powerUpsCollected
            };

            storeRef.current.updateStats(finalStats);
            storeRef.current.addHighScore(gs.score, storeRef.current.playerName);

            // Save to Firebase Leaderboard
            saveScoreToFirebase(
                storeRef.current.playerName || 'AGENT',
                gs.score,
                finalStats,
                storeRef.current.gameMode
            );

            storeRef.current.setGameStatus('gameover');
            gs.initialized = false;
            running = false;
        };

        render();

        return () => {
            running = false;
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, [canvasRef, isPlaying]);
};
