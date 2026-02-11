import { useState, useEffect } from 'react';
import { subscribeToLeaderboard } from '../utils/firebaseLeaderboard';

/**
 * Standalone Live Leaderboard Page (mobile-friendly)
 * This is the page that opens when someone scans the QR code.
 * It auto-updates in real-time via Firebase.
 */
const LiveLeaderboardPage = () => {
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setError("Connection timeout. Check Firebase Rules.");
            setLoading(false);
        }, 5000);

        const unsubscribe = subscribeToLeaderboard((data) => {
            setScores(data);
            setLoading(false);
            setLastUpdate(new Date());
            clearTimeout(timeout);
        }, 100);

        return () => {
            unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    const medalColors = ['#ffd700', '#c0c0c0', '#cd7f32'];
    const medalEmojis = ['👑', '🥈', '🥉'];

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const d = new Date(timestamp);
        const now = new Date();
        const diff = now - d;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={{
            minHeight: '100vh', backgroundColor: '#0a0a0f', color: '#fff',
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            padding: '0 0 40px',
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(180deg, rgba(0,243,255,0.15) 0%, transparent 100%)',
                padding: '32px 20px 24px', textAlign: 'center',
                borderBottom: '1px solid rgba(0,243,255,0.15)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 28 }}>🎯</span>
                    <h1 style={{
                        fontSize: 28, fontWeight: 900, fontStyle: 'italic', letterSpacing: -1, margin: 0,
                        background: 'linear-gradient(90deg, #00f3ff, #a855f6)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>HAND SHOOT ARENA</h1>
                </div>
                <h2 style={{
                    fontSize: 14, fontWeight: 600, color: '#ff00ff', letterSpacing: 6,
                    textTransform: 'uppercase', margin: '4px 0 0',
                }}>LIVE LEADERBOARD</h2>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
                    <div style={{
                        width: 8, height: 8, borderRadius: '50%', backgroundColor: '#00ff88',
                        animation: 'livePulse 2s ease-in-out infinite',
                    }} />
                    <span style={{ fontSize: 11, color: '#00ff88', fontFamily: 'monospace', letterSpacing: 2 }}>LIVE</span>
                    {lastUpdate && (
                        <span style={{ fontSize: 10, color: '#444', marginLeft: 8 }}>
                            Updated {formatTime(lastUpdate.getTime())}
                        </span>
                    )}
                </div>
            </div>

            <style>{`
        @keyframes livePulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        body { margin: 0; background: #0a0a0f; }
      `}</style>

            {/* Stats Summary */}
            {!loading && scores.length > 0 && (
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
                    padding: '16px 16px 0', maxWidth: 500, margin: '0 auto',
                }}>
                    {[
                        { label: 'PLAYERS', value: new Set(scores.map(s => s.name)).size, color: '#00f3ff' },
                        { label: 'TOP SCORE', value: scores[0]?.score || 0, color: '#ffd700' },
                        { label: 'GAMES', value: scores.length, color: '#a855f6' },
                    ].map((s, i) => (
                        <div key={i} style={{
                            textAlign: 'center', padding: '12px 8px',
                            backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 8,
                        }}>
                            <div style={{ fontSize: 8, color: '#555', fontFamily: 'monospace', letterSpacing: 2, marginBottom: 2 }}>{s.label}</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Leaderboard List */}
            <div style={{ padding: '16px', maxWidth: 500, margin: '0 auto' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 60, color: '#444' }}>
                        <div style={{
                            width: 40, height: 40, border: '3px solid #00f3ff', borderTopColor: 'transparent',
                            borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px',
                        }} />
                        <div style={{ fontFamily: 'monospace', letterSpacing: 4, fontSize: 13 }}>CONNECTING...</div>
                    </div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: 60, color: '#ff3333' }}>
                        <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 13 }}>{error}</div>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>The database might be locked.</div>
                    </div>
                ) : scores.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 60, color: '#444' }}>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>🎮</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 14 }}>No scores yet</div>
                        <div style={{ fontSize: 12, color: '#333', marginTop: 8 }}>Play at the booth to get on the board!</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {scores.map((entry, index) => (
                            <div key={entry.id || index} style={{ animation: `slideIn 0.3s ease-out ${index * 0.03}s both` }}>
                                {/* Main Row */}
                                <div
                                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '14px 14px', borderRadius: 8, cursor: 'pointer',
                                        backgroundColor: expandedId === entry.id
                                            ? 'rgba(0,243,255,0.08)'
                                            : index < 3 ? `${medalColors[index]}0a` : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${expandedId === entry.id ? 'rgba(0,243,255,0.2)' : index < 3 ? medalColors[index] + '20' : 'rgba(255,255,255,0.04)'}`,
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        {/* Rank */}
                                        <div style={{
                                            width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            backgroundColor: index < 3 ? medalColors[index] + '20' : 'rgba(255,255,255,0.05)',
                                            fontSize: index < 3 ? 18 : 13, fontWeight: 700, fontFamily: 'monospace',
                                            color: index < 3 ? medalColors[index] : '#555',
                                        }}>
                                            {index < 3 ? medalEmojis[index] : index + 1}
                                        </div>

                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{entry.name}</div>
                                            <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                                                {entry.gameMode && (
                                                    <span style={{
                                                        fontSize: 9, padding: '1px 6px', borderRadius: 3,
                                                        backgroundColor: entry.gameMode === 'arcade' ? '#00f3ff15' : entry.gameMode === 'survival' ? '#ff333315' : '#00ff8815',
                                                        color: entry.gameMode === 'arcade' ? '#00f3ff' : entry.gameMode === 'survival' ? '#ff3333' : '#00ff88',
                                                    }}>{entry.gameMode.toUpperCase()}</span>
                                                )}
                                                <span style={{ fontSize: 10, color: '#444' }}>{formatTime(entry.timestamp)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            fontSize: 22, fontWeight: 800, fontFamily: 'monospace',
                                            color: index === 0 ? '#ffd700' : '#00f3ff',
                                            textShadow: index === 0 ? '0 0 10px #ffd700' : '0 0 5px #00f3ff',
                                        }}>{entry.score}</div>
                                        <div style={{ fontSize: 10, color: '#444' }}>▼ details</div>
                                    </div>
                                </div>

                                {/* Expanded Detail */}
                                {expandedId === entry.id && entry.stats && (
                                    <div style={{
                                        margin: '4px 0 0', padding: '16px', borderRadius: 8,
                                        backgroundColor: 'rgba(0,243,255,0.04)', border: '1px solid rgba(0,243,255,0.1)',
                                    }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                            {[
                                                { label: 'Accuracy', value: `${entry.stats.accuracy || 0}%`, color: (entry.stats.accuracy || 0) > 70 ? '#00ff88' : (entry.stats.accuracy || 0) > 40 ? '#ffaa00' : '#ff3333' },
                                                { label: 'Targets Hit', value: entry.stats.targetsHit || 0, color: '#00f3ff' },
                                                { label: 'Shots Fired', value: entry.stats.shotsFired || 0, color: '#a855f6' },
                                                { label: 'Best Combo', value: `x${entry.stats.bestCombo || 0}`, color: '#ff00ff' },
                                                { label: 'Bonus Hit', value: entry.stats.bonusHit || 0, color: '#ffd700' },
                                                { label: 'Bombs Hit', value: entry.stats.bombsHit || 0, color: '#ff3333' },
                                            ].map((s, i) => (
                                                <div key={i} style={{
                                                    textAlign: 'center', padding: '8px 4px',
                                                    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 6,
                                                }}>
                                                    <div style={{ fontSize: 8, color: '#555', fontFamily: 'monospace', letterSpacing: 1, marginBottom: 2 }}>{s.label}</div>
                                                    <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{
                textAlign: 'center', padding: '24px 16px 0', color: '#333',
                fontSize: 11, fontFamily: 'monospace',
            }}>
                HAND SHOOT ARENA • TECH FEST 2026
            </div>
        </div>
    );
};

export default LiveLeaderboardPage;
