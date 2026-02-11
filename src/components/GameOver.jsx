import { useGameStore } from '../store';
import Leaderboard from './Leaderboard';
import { QRCodeSVG } from 'qrcode.react';

const GameOver = () => {
    const { score, stats, gameMode, resetGame, setGameStatus, setGameMode, toggleSound, soundEnabled } = useGameStore();

    const accuracy = stats.shotsFired > 0
        ? Math.round((stats.targetsHit / stats.shotsFired) * 100)
        : 0;

    const statItems = [
        { label: 'ACCURACY', value: `${accuracy}%`, color: accuracy > 70 ? '#00ff88' : accuracy > 40 ? '#ffaa00' : '#ff3333' },
        { label: 'TARGETS HIT', value: stats.targetsHit, color: '#00f3ff' },
        { label: 'SHOTS FIRED', value: stats.shotsFired, color: '#a855f6' },
        { label: 'BEST COMBO', value: `x${stats.bestCombo}`, color: '#ff00ff' },
        { label: 'BONUS HIT', value: stats.bonusHit, color: '#ffd700' },
        { label: 'BOMBS HIT', value: stats.bombsHit, color: '#ff3333' },
        { label: 'POWER-UPS', value: stats.powerUpsCollected, color: '#00ff88' },
    ];

    return (
        <div style={{
            position: 'absolute', inset: 0, zIndex: 200,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.95)', color: '#fff', fontFamily: 'system-ui, sans-serif',
            overflowY: 'auto', padding: '40px 16px',
        }}>
            {/* Sound Toggle */}
            <button onClick={toggleSound}
                style={{
                    position: 'absolute', top: 20, right: 20,
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff', padding: '8px 14px', cursor: 'pointer', fontFamily: 'monospace', fontSize: 14,
                }}
            >{soundEnabled ? '🔊 ON' : '🔇 OFF'}</button>

            {/* Title & Score */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h1 style={{
                    fontSize: 48, fontWeight: 900, color: '#ff3333',
                    textShadow: '0 0 20px rgba(255,0,0,0.8)', margin: '0 0 4px',
                }}>MISSION OVER</h1>
                <p style={{ fontSize: 14, color: '#666', fontFamily: 'monospace', letterSpacing: 4, margin: 0 }}>
                    {gameMode.toUpperCase()} MODE
                </p>
                <div style={{
                    fontSize: 72, fontFamily: 'monospace', fontWeight: 700, color: '#fff',
                    textShadow: '0 0 30px rgba(255,255,255,0.5)', marginTop: 4,
                }}>{score}</div>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
                width: '100%', maxWidth: 600, marginBottom: 28,
            }}>
                {statItems.map((s, i) => (
                    <div key={i} style={{
                        textAlign: 'center', padding: '12px 8px',
                        backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 4,
                    }}>
                        <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#666', letterSpacing: 2, marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'monospace', color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Actions + Leaderboard */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, width: '100%', maxWidth: 750 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
                    <button
                        onClick={() => { resetGame(); setGameStatus('countdown'); }}
                        style={{
                            width: '100%', backgroundColor: '#00f3ff', color: '#000', fontWeight: 700,
                            padding: '14px 0', fontSize: 16, border: 'none', cursor: 'pointer', textTransform: 'uppercase',
                            transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = '#fff')}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = '#00f3ff')}
                    >↻ RETRY MISSION</button>

                    <button
                        onClick={() => setGameStatus('start')}
                        style={{
                            width: '100%', backgroundColor: 'transparent', color: '#fff', fontWeight: 700,
                            padding: '14px 0', fontSize: 16, border: '2px solid rgba(255,255,255,0.2)',
                            cursor: 'pointer', textTransform: 'uppercase', transition: 'border-color 0.2s',
                        }}
                        onMouseEnter={(e) => (e.target.style.borderColor = '#fff')}
                        onMouseLeave={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.2)')}
                    >⌂ MAIN MENU</button>
                </div>
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

export default GameOver;
