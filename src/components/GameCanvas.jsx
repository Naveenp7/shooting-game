import { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../store';
import { useHandTracking } from '../hooks/useHandTracking';
import { useGameLoop } from '../hooks/useGameLoop';
import { playSound } from '../utils/sound';

const GameCanvas = () => {
    const canvasRef = useRef(null);
    const { score, timeLeft, gameStatus, gameMode, toggleSound, soundEnabled } = useGameStore();
    const { videoRef, landmarksRef, gestureRef, isLoaded } = useHandTracking();

    // Countdown state
    const [countdown, setCountdown] = useState(null);
    const setGameStatus = useGameStore(s => s.setGameStatus);

    // Pass landmarksRef AND gestureRef to game loop
    const isPlaying = gameStatus === 'playing' && isLoaded;
    useGameLoop(canvasRef, landmarksRef, gestureRef, isPlaying);

    // Handle countdown
    useEffect(() => {
        if (gameStatus !== 'countdown') { setCountdown(null); return; }

        setCountdown(3);
        playSound('countdown');

        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    playSound('go');
                    setTimeout(() => setGameStatus('playing'), 200);
                    return 'GO!';
                }
                playSound('countdown');
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [gameStatus]);

    // Resize canvas
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
        return () => { window.removeEventListener('resize', handleResize); clearTimeout(timer); };
    }, [isLoaded]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', backgroundColor: '#000', cursor: 'none' }}>
            {/* Video Feed */}
            <video ref={videoRef}
                style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                    opacity: 0.2, transform: 'scaleX(-1)', filter: 'grayscale(100%) contrast(1.2) brightness(0.6)', pointerEvents: 'none',
                }}
                playsInline
            />

            {/* Grid Overlay */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: 'linear-gradient(rgba(0,243,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.06) 1px, transparent 1px)',
                backgroundSize: '50px 50px',
            }} />

            {/* Canvas */}
            <canvas ref={canvasRef}
                style={{ position: 'absolute', inset: 0, zIndex: 10, width: '100%', height: '100%', display: 'block' }}
            />

            {/* Loading */}
            {!isLoaded && (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 50,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: '#000', color: '#00f3ff',
                }}>
                    <div style={{
                        width: 48, height: 48, border: '4px solid #00f3ff', borderTopColor: 'transparent',
                        borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 16,
                    }} />
                    <p style={{ fontFamily: 'monospace', fontSize: 20, letterSpacing: 4 }}>INITIALIZING SENSORS...</p>
                    <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>Allow camera access to play</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {/* Countdown Overlay */}
            {gameStatus === 'countdown' && countdown !== null && (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 60,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.8)', pointerEvents: 'none',
                }}>
                    <div style={{
                        fontSize: countdown === 'GO!' ? 120 : 160,
                        fontWeight: 900, fontFamily: 'monospace',
                        color: countdown === 'GO!' ? '#00ff88' : '#fff',
                        textShadow: countdown === 'GO!'
                            ? '0 0 40px #00ff88, 0 0 80px #00ff88'
                            : '0 0 30px #00f3ff, 0 0 60px #00f3ff',
                        animation: 'countPop 0.5s ease-out',
                    }}>
                        {countdown}
                    </div>
                    <style>{`
            @keyframes countPop {
              0% { transform: scale(2); opacity: 0; }
              50% { transform: scale(1.1); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
                </div>
            )}

            {/* HUD */}
            {gameStatus === 'playing' && isLoaded && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', padding: '16px 24px',
                    display: 'flex', justifyContent: 'space-between', zIndex: 20, pointerEvents: 'none', userSelect: 'none',
                }}>
                    {/* Score */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#00f3ff', letterSpacing: 4 }}>SCORE</span>
                        <span style={{ fontSize: 48, fontWeight: 900, color: '#fff', fontFamily: 'monospace', textShadow: '0 0 10px #00f3ff' }}>
                            {score.toString().padStart(6, '0')}
                        </span>
                    </div>

                    {/* Sound Toggle - interactive */}
                    <div style={{ pointerEvents: 'all', position: 'absolute', top: 16, right: 140, zIndex: 30 }}>
                        <button onClick={toggleSound}
                            style={{
                                background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
                                color: '#fff', padding: '6px 10px', cursor: 'pointer', fontFamily: 'monospace', fontSize: 12,
                            }}
                        >{soundEnabled ? '🔊' : '🔇'}</button>
                    </div>

                    {/* Timer (or mode label for freeplay) */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#ff3333', letterSpacing: 4 }}>
                            {gameMode === 'freeplay' ? 'FREEPLAY' : (gameMode === 'survival' ? 'SURVIVE' : 'TIME')}
                        </span>
                        {gameMode !== 'freeplay' ? (
                            <span style={{
                                fontSize: 48, fontWeight: 900, fontFamily: 'monospace',
                                color: timeLeft <= 10 ? '#ff3333' : '#fff',
                                textShadow: '0 0 10px rgba(255,0,0,0.8)',
                                animation: timeLeft <= 10 ? 'pulse 1s ease-in-out infinite' : 'none',
                            }}>{timeLeft}</span>
                        ) : (
                            <span style={{ fontSize: 48, fontWeight: 900, fontFamily: 'monospace', color: '#00ff88' }}>∞</span>
                        )}
                    </div>
                </div>
            )}

            {/* Early game instruction */}
            {gameStatus === 'playing' && isLoaded && timeLeft > 55 && gameMode !== 'freeplay' && (
                <div style={{ position: 'absolute', bottom: 40, left: 0, width: '100%', textAlign: 'center', pointerEvents: 'none', zIndex: 20 }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: 13 }}>⬆ JERK HAND UP TO SHOOT</p>
                </div>
            )}

            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
        </div>
    );
};

export default GameCanvas;
