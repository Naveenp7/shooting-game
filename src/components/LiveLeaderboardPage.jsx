import { useState, useEffect } from 'react';
import { subscribeToLeaderboard } from '../utils/firebaseLeaderboard';
import { Search, Filter, Trophy, Target, Zap, Clock } from 'lucide-react';

const LiveLeaderboardPage = () => {
    const [scores, setScores] = useState([]);
    const [filteredScores, setFilteredScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMode, setFilterMode] = useState('all'); // all, arcade, survival

    useEffect(() => {
        const timeout = setTimeout(() => {
            setError("Connection timeout. Check Firebase Rules.");
            setLoading(false);
        }, 5000);

        const unsubscribe = subscribeToLeaderboard((data) => {
            setScores(data);
            setLoading(false);
            setLastUpdate(new Date());
            setError(null);
            clearTimeout(timeout);
        }, 100);

        return () => {
            unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    // Initial filter apply
    useEffect(() => {
        let result = scores;
        if (filterMode !== 'all') {
            result = result.filter(s => s.gameMode === filterMode);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(s => s.name.toLowerCase().includes(q));
        }
        setFilteredScores(result);
    }, [scores, filterMode, searchQuery]);

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const d = new Date(timestamp);
        const now = new Date();
        const diff = now - d;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const medalColors = ['#ffd700', '#c0c0c0', '#cd7f32'];
    const medalEmojis = ['👑', '🥈', '🥉'];

    const topPlayer = scores[0];
    const tickerText = topPlayer
        ? `🏆 CURRENT CHAMPION: ${topPlayer.name} [${topPlayer.score}] • CAN YOU BEAT THEM? • SCAN QR TO PLAY • `
        : `🚨 WELCOME TO HAND SHOOT ARENA • USE YOUR HAND TO AIM & SHOOT • BONUS TARGETS +50 PTS • `;

    return (
        <div style={{
            minHeight: '100vh', backgroundColor: '#050508', color: '#fff',
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            backgroundImage: `
                radial-gradient(circle at 50% 0%, rgba(0,243,255,0.1) 0%, transparent 50%),
                linear-gradient(rgba(0,243,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,243,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 40px 40px, 40px 40px',
            overflowX: 'hidden',
        }}>
            <style>{`
                @keyframes livePulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }
                @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes glowText { 0%,100% { text-shadow: 0 0 10px rgba(0,243,255,0.5); } 50% { text-shadow: 0 0 20px rgba(0,243,255,0.8); } }
                @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #0a0a0f; }
                ::-webkit-scrollbar-thumb { background: #333; borderRadius: 3px; }
            `}</style>

            {/* Ticker Tape */}
            <div style={{ background: '#00f3ff11', borderBottom: '1px solid #00f3ff22', padding: '8px 0', overflow: 'hidden', display: 'flex' }}>
                <div style={{ whiteSpace: 'nowrap', animation: 'marquee 20s linear infinite', fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: '#00f3ff', letterSpacing: 2 }}>
                    {tickerText.repeat(10)}
                </div>
            </div>

            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 40px' }}>
                {/* Header Section */}
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '40px 0 20px', textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 900, fontStyle: 'italic',
                        background: 'linear-gradient(90deg, #00f3ff, #a855f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        letterSpacing: -2, lineHeight: 1, textTransform: 'uppercase', marginBottom: 8,
                        animation: 'glowText 3s infinite',
                    }}>
                        Leaderboard
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,255,136,0.1)', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(0,255,136,0.2)' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 10px #00ff88', animation: 'livePulse 2s infinite' }} />
                        <span style={{ fontSize: 12, color: '#00ff88', fontWeight: 600, letterSpacing: 1 }}>LIVE UPDATES</span>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24,
                    alignItems: 'start'
                }}>

                    {/* Left Column: Stats & Filters (Sticky on Desktop) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Stats Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                            <StatCard label="PLAYERS" value={new Set(scores.map(s => s.name)).size} icon={<Trophy size={14} />} color="#ffd700" />
                            <StatCard label="GAMES" value={scores.length} icon={<Target size={14} />} color="#00f3ff" />
                            <StatCard label="BEST" value={scores[0]?.score || 0} icon={<Zap size={14} />} color="#ff00ff" />
                        </div>

                        {/* Search & Filter */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ position: 'relative', marginBottom: 12 }}>
                                <Search size={16} color="#666" style={{ position: 'absolute', left: 12, top: 12 }} />
                                <input
                                    type="text" placeholder="Search Agent..."
                                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                                        padding: '10px 10px 10px 36px', borderRadius: 8, color: '#fff', outline: 'none',
                                        fontFamily: 'monospace', fontSize: 14
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <FilterButton active={filterMode === 'all'} onClick={() => setFilterMode('all')} label="ALL" />
                                <FilterButton active={filterMode === 'arcade'} onClick={() => setFilterMode('arcade')} label="ARCADE" color="#00f3ff" />
                                <FilterButton active={filterMode === 'survival'} onClick={() => setFilterMode('survival')} label="SURVIVAL" color="#ff3333" />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: List */}
                    <div style={{ background: 'rgba(255,255,255,0.015)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)', padding: 4 }}>
                        {loading ? (
                            <div style={{ padding: 60, textAlign: 'center' }}>
                                <div style={{ width: 40, height: 40, border: '3px solid #00f3ff', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
                                <div style={{ fontSize: 12, letterSpacing: 2, color: '#666' }}>SYNCING DATA...</div>
                            </div>
                        ) : error ? (
                            <div style={{ padding: 40, textAlign: 'center', color: '#ff3333' }}>
                                ⚠️ {error}
                            </div>
                        ) : filteredScores.length === 0 ? (
                            <div style={{ padding: 60, textAlign: 'center', color: '#444' }}>
                                NO RECORDS FOUND
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: 4 }}>
                                {filteredScores.map((entry, index) => (
                                    <div key={entry.id || index}
                                        onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                                        style={{
                                            background: expandedId === entry.id ? 'rgba(0,243,255,0.05)' : 'rgba(255,255,255,0.03)',
                                            borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                                            border: `1px solid ${expandedId === entry.id ? 'rgba(0,243,255,0.3)' : 'rgba(255,255,255,0.05)'}`,
                                            borderLeft: index < 3 ? `4px solid ${medalColors[index]}` : '1px solid rgba(255,255,255,0.05)',
                                            transition: 'all 0.2s',
                                            animation: `slideIn 0.3s ease-out ${Math.min(index * 0.05, 1)}s both`
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                {/* Rank Badge */}
                                                <div style={{
                                                    width: 40, height: 40, borderRadius: '50%', background: index < 3 ? medalColors[index] + '22' : 'rgba(255,255,255,0.05)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: index < 3 ? 20 : 14, fontWeight: 700,
                                                    color: index < 3 ? medalColors[index] : '#666', border: index < 3 ? `1px solid ${medalColors[index]}44` : 'none'
                                                }}>
                                                    {index < 3 ? medalEmojis[index] : index + 1}
                                                </div>

                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 16, color: index === 0 ? '#fff' : '#ddd' }}>{entry.name}</div>
                                                    <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                                                        <ModeBadge mode={entry.gameMode} />
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#555' }}>
                                                            <Clock size={10} /> {formatTime(entry.timestamp)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{
                                                    fontSize: 24, fontWeight: 800, fontFamily: 'monospace', letterSpacing: -1,
                                                    color: index === 0 ? '#ffd700' : '#00f3ff',
                                                    filter: index === 0 ? 'drop-shadow(0 0 8px rgba(255,215,0,0.3))' : 'none'
                                                }}>
                                                    {entry.score.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Stats */}
                                        {expandedId === entry.id && entry.stats && (
                                            <div style={{
                                                marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)',
                                                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 12
                                            }}>
                                                <DetailStat label="ACCURACY" value={entry.stats.accuracy + '%'} color={entry.stats.accuracy > 80 ? '#00ff88' : '#fff'} />
                                                <DetailStat label="HITS" value={entry.stats.targetsHit} />
                                                <DetailStat label="COMBO" value={'x' + entry.stats.bestCombo} color="#ff00ff" />
                                                <DetailStat label="BONUS" value={entry.stats.bonusHit} color="#ffd700" />
                                                <DetailStat label="BOMBS" value={entry.stats.bombsHit} color="#ff3333" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

// --- Subcomponents ---

const StatCard = ({ label, value, icon, color }) => (
    <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, border: `1px solid ${color}22`, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6, color: color, opacity: 0.8 }}>{icon}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{value}</div>
        <div style={{ fontSize: 10, letterSpacing: 1, color: '#666', marginTop: 2 }}>{label}</div>
    </div>
);

const FilterButton = ({ label, active, onClick, color }) => (
    <button
        onClick={onClick}
        style={{
            flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: active ? (color || '#fff') : 'rgba(255,255,255,0.05)',
            color: active ? '#000' : '#666', fontWeight: 700, fontSize: 10, letterSpacing: 1,
            transition: 'all 0.2s'
        }}
    >
        {label}
    </button>
);

const ModeBadge = ({ mode }) => {
    const colors = { arcade: '#00f3ff', survival: '#ff3333', freeplay: '#00ff88' };
    const color = colors[mode] || '#fff';
    return (
        <span style={{
            fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 700, letterSpacing: 0.5,
            background: color + '15', color: color, border: `1px solid ${color}33`
        }}>
            {mode?.toUpperCase() || 'ARCADE'}
        </span>
    );
};

const DetailStat = ({ label, value, color = '#fff' }) => (
    <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 9, color: '#555', marginBottom: 2, letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</div>
    </div>
);

export default LiveLeaderboardPage;
