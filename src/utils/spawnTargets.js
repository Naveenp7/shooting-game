// Target types
export const TARGET_TYPES = {
    NORMAL: 'normal',
    BONUS: 'bonus',     // Gold, +50 points, smaller
    BOMB: 'bomb',       // Red/black, -20 points if shot
    POWERUP: 'powerup', // Green, grants power-up
};

// Movement patterns
export const MOVE_PATTERNS = {
    LINEAR: 'linear',
    ZIGZAG: 'zigzag',
    ORBIT: 'orbit',
    STATIC: 'static',
};

// Power-up types
export const POWERUP_TYPES = {
    SLOW_MO: 'slow_mo',       // Slow all targets
    MULTI_SHOT: 'multi_shot',  // Area damage
    TIME_FREEZE: 'time_freeze', // +10 seconds
};

let nextId = 0;

/**
 * Spawn a target with type based on difficulty and randomness.
 */
export const spawnTarget = (width, height, difficulty = 1) => {
    const id = nextId++;

    // Determine target type based on probability
    const roll = Math.random();
    let type;
    if (roll < 0.08) {
        type = TARGET_TYPES.BOMB;
    } else if (roll < 0.15) {
        type = TARGET_TYPES.BONUS;
    } else if (roll < 0.18) {
        type = TARGET_TYPES.POWERUP;
    } else {
        type = TARGET_TYPES.NORMAL;
    }

    // Determine movement pattern (harder patterns at higher difficulty)
    let pattern;
    const patternRoll = Math.random();
    if (difficulty >= 3 && patternRoll < 0.15) {
        pattern = MOVE_PATTERNS.ORBIT;
    } else if (difficulty >= 2 && patternRoll < 0.3) {
        pattern = MOVE_PATTERNS.ZIGZAG;
    } else {
        pattern = MOVE_PATTERNS.LINEAR;
    }

    // Scale properties with difficulty
    const speedMultiplier = 1 + (difficulty - 1) * 0.2;
    const sizeReduction = Math.min(difficulty * 2, 15);

    // Base properties per type
    const configs = {
        [TARGET_TYPES.NORMAL]: {
            radius: Math.random() * 15 + (35 - sizeReduction),
            color: ['#00f3ff', '#a855f6', '#22d3ee', '#3b82f6', '#8b5cf6'][Math.floor(Math.random() * 5)],
            points: 10,
            speed: (Math.random() * 2 + 1) * speedMultiplier,
        },
        [TARGET_TYPES.BONUS]: {
            radius: Math.random() * 8 + 18, // Smaller = harder
            color: '#ffd700',
            points: 50,
            speed: (Math.random() * 3 + 2) * speedMultiplier, // Faster
        },
        [TARGET_TYPES.BOMB]: {
            radius: Math.random() * 12 + 30,
            color: '#ff2222',
            points: -20,
            speed: (Math.random() * 1.5 + 0.5) * speedMultiplier,
        },
        [TARGET_TYPES.POWERUP]: {
            radius: 22,
            color: '#00ff88',
            points: 5,
            speed: (Math.random() * 1 + 1) * speedMultiplier,
            powerUpType: [POWERUP_TYPES.SLOW_MO, POWERUP_TYPES.MULTI_SHOT, POWERUP_TYPES.TIME_FREEZE][Math.floor(Math.random() * 3)],
        },
    };

    const config = configs[type];
    const margin = config.radius + 20;
    const x = Math.random() * (width - margin * 2) + margin;
    const y = Math.random() * (height - margin * 2) + margin;

    // Velocity direction
    const angle = Math.random() * Math.PI * 2;

    return {
        id,
        x,
        y,
        radius: config.radius,
        color: config.color,
        points: config.points,
        type,
        pattern,
        speed: config.speed,
        dx: Math.cos(angle) * config.speed,
        dy: Math.sin(angle) * config.speed,
        // For zigzag/orbit
        originX: x,
        originY: y,
        phase: Math.random() * Math.PI * 2,
        age: 0,
        // Power-up type (if applicable)
        powerUpType: config.powerUpType || null,
    };
};

/**
 * Update all targets based on their movement patterns.
 */
export const updateTargets = (targets, width, height, slowMo = false) => {
    const speedFactor = slowMo ? 0.3 : 1;

    return targets.map(t => {
        const newT = { ...t, age: t.age + 1, phase: t.phase + 0.03 };

        switch (t.pattern) {
            case MOVE_PATTERNS.LINEAR:
                newT.x += t.dx * speedFactor;
                newT.y += t.dy * speedFactor;
                // Bounce off walls
                if (newT.x < t.radius || newT.x > width - t.radius) {
                    newT.dx = -t.dx;
                    newT.x = Math.max(t.radius, Math.min(width - t.radius, newT.x));
                }
                if (newT.y < t.radius || newT.y > height - t.radius) {
                    newT.dy = -t.dy;
                    newT.y = Math.max(t.radius, Math.min(height - t.radius, newT.y));
                }
                break;

            case MOVE_PATTERNS.ZIGZAG:
                newT.x += t.dx * speedFactor;
                newT.y += Math.sin(t.phase * 3) * t.speed * 2 * speedFactor;
                if (newT.x < t.radius || newT.x > width - t.radius) {
                    newT.dx = -t.dx;
                }
                if (newT.y < t.radius) newT.y = t.radius;
                if (newT.y > height - t.radius) newT.y = height - t.radius;
                break;

            case MOVE_PATTERNS.ORBIT: {
                const orbitRadius = 80 + Math.sin(t.phase * 0.5) * 30;
                newT.x = t.originX + Math.cos(t.phase) * orbitRadius;
                newT.y = t.originY + Math.sin(t.phase) * orbitRadius;
                // Keep in bounds
                newT.x = Math.max(t.radius, Math.min(width - t.radius, newT.x));
                newT.y = Math.max(t.radius, Math.min(height - t.radius, newT.y));
                break;
            }

            default:
                break;
        }

        return newT;
    });
};

/**
 * Spawn initial wave of targets.
 */
export const spawnWave = (count, width, height, difficulty = 1) => {
    const targets = [];
    for (let i = 0; i < count; i++) {
        targets.push(spawnTarget(width, height, difficulty));
    }
    return targets;
};
