import { useState } from 'react';
import { useGameStore } from '../store';
import Leaderboard from './Leaderboard';

const StartScreen = () => {
    const { setPlayerName, setGameStatus, resetGame, playerName } = useGameStore();
    const [name, setName] = useState(playerName || '');
    const [error, setError] = useState('');

    const handleStart = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('ENTER NAME AGENT');
            return;
        }
        setPlayerName(name.toUpperCase());
        resetGame();
        setGameStatus('playing');
    };

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
                backgroundColor: 'rgba(0,0,0,0.95)',
                color: '#fff',
                fontFamily: 'system-ui, sans-serif',
            }}
        >
            {/* Title */}
            <div style={{ marginBottom: 48, textAlign: 'center' }}>
                <h1
                    style={{
                        fontSize: 'clamp(40px, 8vw, 80px)',
                        fontWeight: 900,
                        fontStyle: 'italic',
                        letterSpacing: -2,
                        background: 'linear-gradient(90deg, #00f3ff, #a855f6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: 'none',
                        margin: 0,
                    }}
                >
                    HAND SHOOT
                </h1>
                <h2
                    style={{
                        fontSize: 'clamp(28px, 5vw, 48px)',
                        fontWeight: 700,
                        color: '#ff00ff',
                        letterSpacing: 8,
                        textTransform: 'uppercase',
                        textShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff',
                        margin: '8px 0 0',
                    }}
                >
                    ARENA
                </h2>
            </div>

            {/* Content Grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 48,
                    width: '100%',
                    maxWidth: 900,
                    alignItems: 'start',
                }}
            >
                {/* Left: Form */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
                    <form onSubmit={handleStart} style={{ width: '100%', maxWidth: 360 }}>
                        <div style={{ marginBottom: 24 }}>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: 12,
                                    fontFamily: 'monospace',
                                    color: '#00f3ff',
                                    letterSpacing: 4,
                                    marginBottom: 8,
                                }}
                            >
                                AGENT NAME
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setError('');
                                }}
                                maxLength={10}
                                autoFocus
                                style={{
                                    width: '100%',
                                    backgroundColor: '#000',
                                    border: '2px solid rgba(255,255,255,0.2)',
                                    padding: 16,
                                    textAlign: 'center',
                                    fontSize: 28,
                                    fontWeight: 700,
                                    fontFamily: 'monospace',
                                    color: '#fff',
                                    outline: 'none',
                                    textTransform: 'uppercase',
                                    boxSizing: 'border-box',
                                }}
                                placeholder="TYPE NAME"
                            />
                            {error && (
                                <p style={{ color: '#ff3333', fontFamily: 'monospace', textAlign: 'center', marginTop: 8 }}>
                                    {error}
                                </p>
                            )}
                        </div>
                        <button
                            type="submit"
                            style={{
                                width: '100%',
                                backgroundColor: '#fff',
                                color: '#000',
                                fontWeight: 900,
                                fontSize: 20,
                                padding: '16px 0',
                                border: 'none',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: 2,
                                transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => (e.target.style.backgroundColor = '#00f3ff')}
                            onMouseLeave={(e) => (e.target.style.backgroundColor = '#fff')}
                        >
                            ▶ START MISSION
                        </button>
                    </form>

                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'monospace', textAlign: 'center' }}>
                        <p style={{ margin: '0 0 8px' }}>INSTRUCTIONS:</p>
                        <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#00f3ff', fontSize: 11 }}>POINT HAND</div>
                                <div>AIM</div>
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.15)' }}>|</div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#ff00ff', fontSize: 11 }}>⬆ JERK UP</div>
                                <div>SHOOT</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Leaderboard */}
                <Leaderboard />
            </div>
        </div>
    );
};

export default StartScreen;
