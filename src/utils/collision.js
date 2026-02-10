export const checkCollision = (cursor, targets) => {
    if (!cursor) return null;

    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        const dx = cursor.x - target.x;
        const dy = cursor.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < target.radius) {
            return i; // Return index of hit target
        }
    }
    return null;
};
