export const spawnTarget = (width, height) => {
    const radius = Math.random() * 20 + 30; // Random size 30-50

    // Ensure target spawns within bounds
    const x = Math.random() * (width - radius * 2) + radius;
    const y = Math.random() * (height - radius * 2) + radius;

    // Random color from neon palette
    const colors = ['#FF00FF', '#00FFFF', '#FFFF00', '#FF0000', '#00FF00'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    return {
        id: Date.now() + Math.random(),
        x,
        y,
        radius,
        color,
        dx: (Math.random() - 0.5) * 4, // Random horizontal movement
        dy: (Math.random() - 0.5) * 4, // Random vertical movement
        life: 100, // For potential fading/shrinking effects
    };
};

export const updateTargets = (targets, width, height) => {
    return targets.map(target => {
        let { x, y, dx, dy, radius } = target;

        // Move
        x += dx;
        y += dy;

        // Bounce off walls
        if (x + radius > width || x - radius < 0) dx = -dx;
        if (y + radius > height || y - radius < 0) dy = -dy;

        return { ...target, x, y, dx, dy };
    });
};
