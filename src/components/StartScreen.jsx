import { useState } from 'react';
import { useGameStore } from '../store';
import Leaderboard from './Leaderboard';
import { QRCodeSVG } from 'qrcode.react';

const MODES = [
    { id: 'arcade', label: 'ARCADE', desc: '60s • Score Attack', color: '#00f3ff' },
    { id: 'survival', label: 'SURVIVAL', desc: 'Survive the swarm', color: '#ff3333' },
    { id: 'freeplay', label: 'FREEPLAY', desc: 'Practice • No timer', color: '#00ff88' },
];

const StartScreen = () => {
    const { setPlayerName, setGameStatus, resetGame, playerName, setGameMode, gameMode, toggleSound, soundEnabled } = useGameStore();
    const [name, setName] = useState(playerName || '');
    const [error, setError] = useState('');
    const [selectedMode, setSelectedMode] = useState(gameMode || 'arcade');

    const handleStart = (e) => {
        e.preventDefault();
        if (!name.trim()) { setError('ENTER NAME AGENT'); return; }
        setPlayerName(name.toUpperCase());
        setGameMode(selectedMode);
        resetGame();
        setGameStatus('countdown');
    };

    return (
        <div style={{
            position: 'absolute', inset: 0, zIndex: 200,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 16, backgroundColor: 'rgba(0,0,0,0.95)', color: '#fff', fontFamily: 'system-ui, sans-serif',
        }}>
            {/* Sound Toggle */}
            <button
                onClick={toggleSound}
                style={{
                    position: 'absolute', top: 20, right: 20,
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff', padding: '8px 14px', cursor: 'pointer', fontFamily: 'monospace', fontSize: 14,
                }}
            >
                {soundEnabled ? '🔊 ON' : '🔇 OFF'}
            </button>

            {/* Title */}
            <div style={{ marginBottom: 36, textAlign: 'center' }}>
                <h1 style={{
                    fontSize: 'clamp(36px, 7vw, 72px)', fontWeight: 900, fontStyle: 'italic', letterSpacing: -2,
                    background: 'linear-gradient(90deg, #00f3ff, #a855f6)', WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent', margin: 0,
                }}>HAND SHOOT</h1>
                <h2 style={{
                    fontSize: 'clamp(24px, 4vw, 44px)', fontWeight: 700, color: '#ff00ff', letterSpacing: 8,
                    textShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff', margin: '4px 0 0',
                }}>ARENA</h2>
            </div>

            {/* Content */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, width: '100%', maxWidth: 900, alignItems: 'start' }}>
                {/* Left: Form + Mode Select */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
                    <form onSubmit={handleStart} style={{ width: '100%', maxWidth: 360 }}>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 11, fontFamily: 'monospace', color: '#00f3ff', letterSpacing: 4, marginBottom: 6 }}>
                                AGENT NAME
                            </label>
                            <input type="text" value={name}
                                onChange={(e) => { setName(e.target.value); setError(''); }}
                                maxLength={10} autoFocus
                                style={{
                                    width: '100%', backgroundColor: '#000', border: '2px solid rgba(255,255,255,0.2)',
                                    padding: 14, textAlign: 'center', fontSize: 24, fontWeight: 700, fontFamily: 'monospace',
                                    color: '#fff', outline: 'none', textTransform: 'uppercase', boxSizing: 'border-box',
                                }}
                                placeholder="TYPE NAME"
                            />
                            {error && <p style={{ color: '#ff3333', fontFamily: 'monospace', textAlign: 'center', marginTop: 6, fontSize: 12 }}>{error}</p>}
                        </div>

                        {/* Game Mode Selector */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 11, fontFamily: 'monospace', color: '#00f3ff', letterSpacing: 4, marginBottom: 8 }}>
                                GAME MODE
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {MODES.map(m => (
                                    <button key={m.id} type="button"
                                        onClick={() => setSelectedMode(m.id)}
                                        style={{
                                            flex: 1, padding: '12px 8px', cursor: 'pointer', fontFamily: 'monospace', fontSize: 11,
                                            backgroundColor: selectedMode === m.id ? m.color + '22' : 'transparent',
                                            border: `2px solid ${selectedMode === m.id ? m.color : 'rgba(255,255,255,0.1)'}`,
                                            color: selectedMode === m.id ? m.color : '#666', textAlign: 'center',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <div style={{ fontWeight: 700, fontSize: 13 }}>{m.label}</div>
                                        <div style={{ fontSize: 9, marginTop: 4, opacity: 0.7 }}>{m.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button type="submit" style={{
                            width: '100%', backgroundColor: '#fff', color: '#000', fontWeight: 900, fontSize: 18,
                            padding: '14px 0', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 2,
                            transition: 'background-color 0.2s',
                        }}
                            onMouseEnter={(e) => (e.target.style.backgroundColor = '#00f3ff')}
                            onMouseLeave={(e) => (e.target.style.backgroundColor = '#fff')}
                        >▶ START MISSION</button>
                    </form>

                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'monospace', textAlign: 'center' }}>
                        <p style={{ margin: '0 0 6px', fontSize: 10, letterSpacing: 2 }}>CONTROLS</p>
                        <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#00f3ff', fontSize: 10 }}>POINT HAND</div>
                                <div>AIM</div>
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.15)' }}>|</div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#ff00ff', fontSize: 10 }}>⬆ JERK UP</div>
                                <div>SHOOT</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Leaderboard */}
                {/* Right: Leaderboard + QR */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
                    <Leaderboard />

                    <div style={{
                        display: 'flex', gap: 16, alignItems: 'center',
                        padding: '12px 16px', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8
                    }}>
                        <div style={{ background: '#fff', padding: 4, borderRadius: 4 }}>
                            <QRCodeSVG
                                value={`${window.location.origin}/leaderboard`}
                                size={64}
                                fgColor="#000"
                                bgColor="#fff"
                            />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 10, color: '#00f3ff', fontFamily: 'monospace', letterSpacing: 1, marginBottom: 2 }}>
                                SCAN FOR
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
                                LIVE SCORES
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StartScreen;
