import { useState, useEffect } from 'react';
import { subscribeToLeaderboard } from '../utils/firebaseLeaderboard';

const Leaderboard = ({ compact = false }) => {
    const [scores, setScores] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setError("Connection timeout. Check Firebase Rules/Config.");
            setLoading(false);
        }, 5000);

        const unsubscribe = subscribeToLeaderboard((data) => {
            setScores(data);
            setLoading(false);
            clearTimeout(timeout);
        }, compact ? 10 : 50);

        return () => {
            unsubscribe();
            clearTimeout(timeout);
        };
    }, [compact]);

    const medalColors = ['#ffd700', '#c0c0c0', '#cd7f32'];

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const d = new Date(timestamp);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={{
            width: '100%', maxWidth: compact ? 360 : 500,
            backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid rgba(0,243,255,0.25)',
            borderRadius: 8, padding: compact ? 16 : 24,
            boxShadow: '0 0 20px rgba(0,243,255,0.1)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: compact ? 12 : 20 }}>
                <span style={{ fontSize: 20 }}>🏆</span>
                <h2 style={{ fontSize: compact ? 16 : 20, fontWeight: 700, color: '#fff', letterSpacing: 4, margin: 0 }}>
                    LIVE LEADERBOARD
                </h2>
                <div style={{
                    width: 8, height: 8, borderRadius: '50%', backgroundColor: '#00ff88',
                    animation: 'livePulse 2s ease-in-out infinite',
                }} />
            </div>

            <style>{`@keyframes livePulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>

            {error ? (
                <div style={{ textAlign: 'center', color: '#ff3333', padding: 20, fontSize: 13, fontFamily: 'monospace' }}>
                    ⚠️ {error}
                </div>
            ) : loading ? (
                <div style={{ textAlign: 'center', color: '#666', padding: 24, fontFamily: 'monospace', fontSize: 13 }}>
                    <div style={{
                        width: 24, height: 24, border: '2px solid #00f3ff', borderTopColor: 'transparent',
                        borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 8px',
                    }} />
                    SYNCING...
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            ) : scores.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#444', fontStyle: 'italic', padding: 20, fontSize: 13 }}>
                    No scores yet. Be the first!
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: compact ? 280 : 400, overflowY: 'auto' }}>
                    {scores.slice(0, compact ? 10 : 50).map((entry, index) => (
                        <div key={entry.id || index}>
                            {/* Main Row */}
                            <div
                                onClick={() => toggleExpand(entry.id)}
                                style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '10px 12px', borderRadius: 4, cursor: 'pointer',
                                    backgroundColor: expandedId === entry.id
                                        ? 'rgba(0,243,255,0.1)'
                                        : index < 3 ? `${medalColors[index]}12` : 'rgba(255,255,255,0.02)',
                                    borderLeft: index < 3 ? `3px solid ${medalColors[index]}` : '3px solid transparent',
                                    transition: 'background-color 0.2s',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{
                                        fontFamily: 'monospace', fontWeight: 700, width: 28, textAlign: 'center', fontSize: 13,
                                        color: index < 3 ? medalColors[index] : '#555',
                                    }}>
                                        {index === 0 ? '👑' : `#${index + 1}`}
                                    </span>
                                    <div>
                                        <span style={{ color: '#fff', fontWeight: 600, fontSize: compact ? 13 : 14 }}>{entry.name}</span>
                                        {!compact && entry.gameMode && (
                                            <span style={{
                                                marginLeft: 8, fontSize: 9, padding: '2px 6px', borderRadius: 3,
                                                backgroundColor: entry.gameMode === 'arcade' ? '#00f3ff22' : entry.gameMode === 'survival' ? '#ff333322' : '#00ff8822',
                                                color: entry.gameMode === 'arcade' ? '#00f3ff' : entry.gameMode === 'survival' ? '#ff3333' : '#00ff88',
                                            }}>
                                                {entry.gameMode.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span style={{
                                    color: '#00f3ff', fontWeight: 700, fontFamily: 'monospace',
                                    fontSize: compact ? 16 : 20, textShadow: '0 0 5px #00f3ff',
                                }}>
                                    {entry.score}
                                </span>
                            </div>

                            {/* Expanded Stats Row */}
                            {expandedId === entry.id && entry.stats && (
                                <div style={{
                                    padding: '12px 16px', marginTop: 2, borderRadius: 4,
                                    backgroundColor: 'rgba(0,243,255,0.05)', border: '1px solid rgba(0,243,255,0.1)',
                                }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                        {[
                                            { label: 'Accuracy', value: `${entry.stats.accuracy || 0}%`, color: '#00ff88' },
                                            { label: 'Hits', value: entry.stats.targetsHit || 0, color: '#00f3ff' },
                                            { label: 'Shots', value: entry.stats.shotsFired || 0, color: '#a855f6' },
                                            { label: 'Best Combo', value: `x${entry.stats.bestCombo || 0}`, color: '#ff00ff' },
                                            { label: 'Bonus', value: entry.stats.bonusHit || 0, color: '#ffd700' },
                                            { label: 'Bombs', value: entry.stats.bombsHit || 0, color: '#ff3333' },
                                        ].map((s, i) => (
                                            <div key={i} style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: 9, color: '#555', fontFamily: 'monospace', letterSpacing: 1 }}>{s.label}</div>
                                                <div style={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {entry.timestamp && (
                                        <div style={{ marginTop: 8, fontSize: 10, color: '#444', fontFamily: 'monospace', textAlign: 'center' }}>
                                            {formatTime(entry.timestamp)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
