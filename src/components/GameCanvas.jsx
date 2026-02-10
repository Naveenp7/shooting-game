import { useRef, useEffect } from 'react';
import { useGameStore } from '../store';
import { useHandTracking } from '../hooks/useHandTracking';
import { useGameLoop } from '../hooks/useGameLoop';

const GameCanvas = () => {
    const canvasRef = useRef(null);
    const { score, timeLeft, gameStatus } = useGameStore();
    const { videoRef, landmarksRef, gestureRef, isLoaded } = useHandTracking();

    // Pass landmarksRef AND gestureRef to game loop
    const isPlaying = gameStatus === 'playing' && isLoaded;
    useGameLoop(canvasRef, landmarksRef, gestureRef, isPlaying);

    // Resize canvas to fullscreen on mount and when isLoaded changes
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        const timer = setTimeout(handleResize, 300);

        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timer);
        };
    }, [isLoaded]);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black cursor-none">
            {/* Background Video Feed (Flipped for mirror effect) */}
            <video
                ref={videoRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.25,
                    transform: 'scaleX(-1)',
                    filter: 'grayscale(100%) contrast(1.2) brightness(0.7)',
                    pointerEvents: 'none',
                }}
                playsInline
            />

            {/* Grid Overlay */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                        'linear-gradient(rgba(0, 243, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.08) 1px, transparent 1px)',
                    backgroundSize: '50px 50px',
                    pointerEvents: 'none',
                }}
            />

            {/* Main Game Canvas */}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 10,
                    width: '100%',
                    height: '100%',
                    display: 'block',
                }}
            />

            {/* Loading State */}
            {!isLoaded && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 50,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#000',
                        color: '#00f3ff',
                    }}
                >
                    <div
                        style={{
                            width: 48,
                            height: 48,
                            border: '4px solid #00f3ff',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            marginBottom: 16,
                        }}
                    />
                    <p style={{ fontFamily: 'monospace', fontSize: 20, letterSpacing: 4 }}>
                        INITIALIZING SENSORS...
                    </p>
                    <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                        Allow camera access to play
                    </p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {/* HUD: Score & Timer */}
            {gameStatus === 'playing' && isLoaded && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        padding: 24,
                        display: 'flex',
                        justifyContent: 'space-between',
                        zIndex: 20,
                        pointerEvents: 'none',
                        userSelect: 'none',
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span
                            style={{
                                fontSize: 12,
                                fontFamily: 'monospace',
                                color: '#00f3ff',
                                textTransform: 'uppercase',
                                letterSpacing: 4,
                            }}
                        >
                            Score
                        </span>
                        <span
                            style={{
                                fontSize: 56,
                                fontWeight: 900,
                                color: '#fff',
                                fontFamily: 'monospace',
                                textShadow: '0 0 10px #00f3ff',
                            }}
                        >
                            {score.toString().padStart(6, '0')}
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span
                            style={{
                                fontSize: 12,
                                fontFamily: 'monospace',
                                color: '#ff3333',
                                textTransform: 'uppercase',
                                letterSpacing: 4,
                            }}
                        >
                            Time
                        </span>
                        <span
                            style={{
                                fontSize: 56,
                                fontWeight: 900,
                                fontFamily: 'monospace',
                                color: timeLeft <= 10 ? '#ff3333' : '#fff',
                                textShadow: '0 0 10px rgba(255,0,0,0.8)',
                                animation: timeLeft <= 10 ? 'pulse 1s ease-in-out infinite' : 'none',
                            }}
                        >
                            {timeLeft}
                        </span>
                    </div>
                </div>
            )}

            {/* Instructions Overlay (early game) */}
            {gameStatus === 'playing' && isLoaded && timeLeft > 55 && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 40,
                        left: 0,
                        width: '100%',
                        textAlign: 'center',
                        pointerEvents: 'none',
                    }}
                >
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: 14 }}>
                        ⬆ JERK HAND UP TO SHOOT
                    </p>
                </div>
            )}

            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
        </div>
    );
};

export default GameCanvas;
