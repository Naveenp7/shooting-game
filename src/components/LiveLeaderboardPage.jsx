import { useState, useEffect } from 'react';
import { subscribeToLeaderboard } from '../utils/firebaseLeaderboard';

const LiveLeaderboardPage = () => {
    const [scores, setScores] = useState([]);
    const [filteredScores, setFilteredScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMode, setFilterMode] = useState('all');
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        try {
            const cached = localStorage.getItem('leaderboard_cache');
            if (cached) { setScores(JSON.parse(cached)); setLoading(false); }
        } catch (e) { }

        const unsubscribe = subscribeToLeaderboard((data) => {
            setScores(data || []);
            setLoading(false);
            localStorage.setItem('leaderboard_cache', JSON.stringify(data || []));
        }, 100);

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        let result = scores || [];
        if (filterMode !== 'all') {
            result = result.filter(s => s.gameMode === filterMode);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(s => s && s.name && s.name.toLowerCase().includes(q));
        }
        setFilteredScores(result);
    }, [scores, filterMode, searchQuery]);

    const medalColors = ['#ffd700', '#c0c0c0', '#cd7f32']; // Gold, Silver, Bronze

    // FORCE SCROLL & LAYOUT FIX
    useEffect(() => {
        // Save original styles
        const originalOverflow = document.body.style.overflow;
        const originalDisplay = document.body.style.display;
        const originalPlaceItems = document.body.style.placeItems;

        // Apply Leaderboard styles
        document.body.style.overflow = 'auto';
        document.body.style.display = 'block'; // Disable flex centering
        document.body.style.placeItems = 'unset';

        return () => {
            // Revert
            document.body.style.overflow = originalOverflow;
            document.body.style.display = originalDisplay;
            document.body.style.placeItems = originalPlaceItems;
        };
    }, []);

    return (
        <div className="leaderboard-page">
            <style>{`
                .leaderboard-page {
                    min-height: 100vh;
                    background-color: #050508;
                    color: #fff;
                    font-family: 'Segoe UI', system-ui, sans-serif;
                    background-image: 
                        linear-gradient(rgba(0, 243, 255, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 243, 255, 0.03) 1px, transparent 1px);
                    background-size: 30px 30px;
                    padding-bottom: 40px;
                }
                .lb-container {
                    max-width: 1600px;
                    margin: 0 auto;
                    padding: 20px;
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 24px;
                }
                @media (min-width: 768px) {
                    .lb-container {
                        grid-template-columns: 320px 1fr;
                        align-items: start;
                    }
                    .sidebar {
                        position: sticky;
                        top: 20px;
                    }
                }
                .glass-panel {
                    background: rgba(20, 20, 25, 0.8);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 20px;
                }
                .search-input {
                    width: 100%;
                    padding: 12px;
                    border-radius: 8px;
                    border: 1px solid #333;
                    background: #111;
                    color: white;
                    margin-bottom: 12px;
                    font-family: inherit;
                }
                .filter-btn {
                    flex: 1;
                    padding: 8px;
                    border-radius: 6px;
                    border: none;
                    font-size: 11px;
                    font-weight: bold;
                    cursor: pointer;
                    text-transform: uppercase;
                    transition: all 0.2s;
                }
                .score-card {
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    cursor: pointer;
                    transition: transform 0.2s, background 0.2s;
                }
                .score-card:hover {
                    background: rgba(255, 255, 255, 0.06);
                    transform: translateX(4px);
                }
                .score-card.expanded {
                    background: rgba(0, 243, 255, 0.05);
                    border-color: rgba(0, 243, 255, 0.3);
                    transform: none;
                }
                .stat-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }
                .stat-box {
                    background: rgba(0,0,0,0.3);
                    padding: 8px;
                    border-radius: 6px;
                    text-align: center;
                }
                .rank-badge {
                    width: 36px; height: 36px;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-weight: bold;
                }
                .glow-text {
                    text-shadow: 0 0 10px rgba(0, 243, 255, 0.5);
                }
            `}</style>

            {/* Header / Hero */}
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'linear-gradient(to bottom, rgba(0,243,255,0.05), transparent)' }}>
                <h1 style={{
                    fontSize: '48px', fontWeight: 900, margin: '0 0 10px',
                    background: 'linear-gradient(90deg, #00f3ff, #e056fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    textTransform: 'uppercase', letterSpacing: '-2px'
                }}>
                    Hand Shoot Arena
                </h1>
                <div style={{ fontSize: '12px', letterSpacing: '3px', color: '#00f3ff', opacity: 0.8 }}>
                    LIVE LEADERBOARD • TECH FEST 2026
                </div>
            </div>

            <div className="lb-container">
                {/* Sidebar (Search & Stats) */}
                <div className="sidebar">
                    <div className="glass-panel" style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 12, color: '#888', marginBottom: 10, letterSpacing: 1 }}>FILTER AGENTS</div>
                        <input
                            className="search-input"
                            type="text" placeholder="Search by name..."
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: 6 }}>
                            {['all', 'arcade', 'survival'].map(mode => (
                                <button key={mode} className="filter-btn"
                                    onClick={() => setFilterMode(mode)}
                                    style={{
                                        background: filterMode === mode ? '#00f3ff' : '#222',
                                        color: filterMode === mode ? '#000' : '#888',
                                    }}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="glass-panel">
                        <div style={{ fontSize: 12, color: '#888', marginBottom: 15, letterSpacing: 1 }}>MISSION STATS</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <SummaryStat label="PLAYERS" value={new Set(scores.map(s => s.name)).size} />
                            <SummaryStat label="GAMES" value={scores.length} />
                            <div style={{ gridColumn: 'span 2' }}>
                                <SummaryStat label="TOP SCORE" value={scores[0]?.score || 0} highlight />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main List */}
                <div className="list-section">
                    {loading && !scores.length ? (
                        <div style={{ textAlign: 'center', padding: 60, color: '#444' }}>
                            <div style={{ marginBottom: 10 }}>📡</div>
                            CONNECTING TO DATABASE...
                        </div>
                    ) : filteredScores.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 60, color: '#444' }}>
                            NO SCORES FOUND
                        </div>
                    ) : (
                        filteredScores.map((s, i) => (
                            <div key={s.id || i}
                                className={`score-card ${expandedId === s.id ? 'expanded' : ''}`}
                                onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        {/* Rank */}
                                        <div className="rank-badge" style={{
                                            background: i < 3 ? medalColors[i] + '22' : '#222',
                                            color: i < 3 ? medalColors[i] : '#666',
                                            border: i < 3 ? `1px solid ${medalColors[i]}` : 'none'
                                        }}>
                                            {i + 1}
                                        </div>

                                        {/* Name & Info */}
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 16, color: i === 0 ? '#ffd700' : '#fff' }}>
                                                {s.name}
                                                {i === 0 && <span style={{ marginLeft: 8, fontSize: 12 }}>👑</span>}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#666', display: 'flex', gap: 8, marginTop: 4 }}>
                                                <span style={{
                                                    color: s.gameMode === 'arcade' ? '#00f3ff' : s.gameMode === 'survival' ? '#ff4444' : '#0f0',
                                                    background: s.gameMode === 'arcade' ? '#00f3ff11' : s.gameMode === 'survival' ? '#ff444411' : '#0f011',
                                                    padding: '2px 6px', borderRadius: 4
                                                }}>
                                                    {s.gameMode?.toUpperCase()}
                                                </span>
                                                <span>{s.timestamp ? new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 22, fontWeight: 900, color: i === 0 ? '#ffd700' : '#00f3ff', letterSpacing: -1 }}>
                                            {s.score}
                                        </div>
                                        <div style={{ fontSize: 10, color: '#555' }}>
                                            {expandedId === s.id ? '▲ hide' : '▼ stats'}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Detail */}
                                {expandedId === s.id && s.stats && (
                                    <div className="stat-grid">
                                        <StatBox label="ACCURACY" value={s.stats.accuracy + '%'} color={s.stats.accuracy > 80 ? '#0f0' : '#fff'} />
                                        <StatBox label="TARGETS" value={s.stats.targetsHit} />
                                        <StatBox label="COMBO" value={'x' + s.stats.bestCombo} color="#d0f" />
                                        <StatBox label="BONUS" value={s.stats.bonusHit} color="#ffd700" />
                                        <StatBox label="BOMBS" value={s.stats.bombsHit} color="#f44" />
                                        <StatBox label="SHOTS" value={s.stats.shotsFired} color="#aaa" />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// Subcomponents
const SummaryStat = ({ label, value, highlight }) => (
    <div style={{ background: highlight ? 'rgba(0, 243, 255, 0.1)' : 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8, textAlign: 'center', border: highlight ? '1px solid rgba(0, 243, 255, 0.3)' : 'none' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: highlight ? '#00f3ff' : '#fff' }}>{value}</div>
        <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>{label}</div>
    </div>
);

const StatBox = ({ label, value, color = '#fff' }) => (
    <div className="stat-box">
        <div style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 'bold', color: color, fontFamily: 'monospace' }}>{value}</div>
    </div>
);

export default LiveLeaderboardPage;
