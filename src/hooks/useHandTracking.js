import { useEffect, useRef, useState } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

/**
 * Calculates distance between two 3D landmarks.
 */
const dist = (a, b) =>
    Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + ((a.z || 0) - (b.z || 0)) ** 2);

/**
 * Advanced hand tracking hook with RECOIL-based shooting.
 *
 * Shooting gesture: Quick upward jerk of the hand (like gun recoil).
 * - Track the Y velocity of the index finger tip
 * - When velocity spikes upward past a threshold → FIRE
 * - Cooldown prevents rapid re-triggers
 * - No pinching required!
 *
 * Aiming: Index finger tip position → cursor position
 */
export const useHandTracking = () => {
    const videoRef = useRef(null);
    const landmarksRef = useRef(null);
    const gestureRef = useRef({
        // Smoothed cursor position (normalized 0-1)
        cursorX: 0.5,
        cursorY: 0.5,
        // Velocity tracking
        velocityY: 0,
        smoothedVelocityY: 0,
        // Trigger state
        isTriggerDown: false,
        triggerCooldown: 0,      // frames remaining before next shot allowed
        // Raw Y history for velocity calculation
        prevRawY: 0.5,
        prevPrevRawY: 0.5,
        // Gun pose confidence (for display)
        gunPoseConfidence: 0,
        // Recoil animation state (for visual feedback)
        recoilAmount: 0,
    });
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        let camera = null;
        let hands = null;
        let loadedOnce = false;

        const init = async () => {
            hands = new Hands({
                locateFile: (file) =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
            });

            hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.6,
                minTrackingConfidence: 0.6,
            });

            hands.onResults((results) => {
                if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                    const lm = results.multiHandLandmarks[0];
                    landmarksRef.current = lm;

                    const g = gestureRef.current;

                    // --- 1. Get raw index finger tip position ---
                    const indexTip = lm[8];
                    const rawX = 1 - indexTip.x; // Mirror horizontally
                    const rawY = indexTip.y;

                    // --- 2. Compute Y velocity (how fast the hand moves up/down) ---
                    // Negative velocity = moving UP (in screen coords, Y decreases going up)
                    const instantVelocityY = rawY - g.prevRawY;

                    // Smooth the velocity with EMA to reduce noise
                    const alpha = 0.5;
                    g.smoothedVelocityY = g.smoothedVelocityY * (1 - alpha) + instantVelocityY * alpha;

                    // Also track second derivative (acceleration) for sharper detection
                    const prevVelocity = g.prevRawY - g.prevPrevRawY;
                    const acceleration = instantVelocityY - prevVelocity;

                    // Update history
                    g.prevPrevRawY = g.prevRawY;
                    g.prevRawY = rawY;

                    // --- 3. Smooth cursor for aiming ---
                    const dx = rawX - g.cursorX;
                    const dy = rawY - g.cursorY;
                    const moveDist = Math.sqrt(dx * dx + dy * dy);
                    const lerpFactor = Math.min(0.5, 0.15 + moveDist * 3);

                    g.cursorX += dx * lerpFactor;
                    g.cursorY += dy * lerpFactor;

                    // --- 4. Recoil detection ---
                    // A "recoil" is a quick UPWARD jerk: velocity goes negative (hand moves up)
                    // Then the hand naturally comes back down.
                    //
                    // Threshold tuning:
                    //  - Too sensitive = false triggers from normal hand movement
                    //  - Too strict = hard to trigger
                    //
                    // We look for: velocity suddenly goes negative (upward) past threshold

                    const RECOIL_VELOCITY_THRESHOLD = -0.015; // Upward velocity threshold
                    const RECOIL_COOLDOWN_FRAMES = 12;         // ~400ms at 30fps

                    // Decay cooldown
                    if (g.triggerCooldown > 0) {
                        g.triggerCooldown--;
                    }

                    // Detect recoil: quick upward movement
                    if (
                        g.smoothedVelocityY < RECOIL_VELOCITY_THRESHOLD &&
                        g.triggerCooldown <= 0
                    ) {
                        g.isTriggerDown = true;
                        g.triggerCooldown = RECOIL_COOLDOWN_FRAMES;
                        g.recoilAmount = 1.0; // Start recoil animation
                    } else {
                        g.isTriggerDown = false;
                    }

                    // Decay recoil animation
                    g.recoilAmount *= 0.85;

                    // --- 5. Optional: Gun pose confidence (for display) ---
                    // Just check if index is extended (tip further from wrist than PIP)
                    const wrist = lm[0];
                    const indexPIP = lm[6];
                    const indexExtended = dist(indexTip, wrist) > dist(indexPIP, wrist) * 1.05;
                    g.gunPoseConfidence = indexExtended ? 1.0 : 0.3;

                    g.velocityY = g.smoothedVelocityY;
                } else {
                    landmarksRef.current = null;
                }

                if (!loadedOnce) {
                    loadedOnce = true;
                    setIsLoaded(true);
                }
            });

            if (videoRef.current) {
                camera = new Camera(videoRef.current, {
                    onFrame: async () => {
                        if (hands && videoRef.current) {
                            await hands.send({ image: videoRef.current });
                        }
                    },
                    width: 1280,
                    height: 720,
                });
                camera.start();
            }
        };

        init();

        return () => {
            if (camera) camera.stop();
            if (hands) hands.close();
        };
    }, []);

    return { videoRef, landmarksRef, gestureRef, isLoaded };
};
