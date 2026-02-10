import { useGameStore } from '../store';

const Leaderboard = () => {
    const { highScores } = useGameStore();

    const medalColors = ['#ffd700', '#c0c0c0', '#cd7f32'];

    return (
        <div
            style={{
                width: '100%',
                maxWidth: 400,
                backgroundColor: 'rgba(0,0,0,0.8)',
                border: '1px solid rgba(0,243,255,0.3)',
                borderRadius: 8,
                padding: 24,
                boxShadow: '0 0 20px rgba(0,243,255,0.15)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
                <span style={{ fontSize: 24 }}>🏆</span>
                <h2
                    style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#fff',
                        textTransform: 'uppercase',
                        letterSpacing: 4,
                        margin: 0,
                    }}
                >
                    Leaderboard
                </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {highScores.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', padding: 16 }}>
                        No scores yet. Be the first!
                    </div>
                ) : (
                    highScores.map((entry, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 12px',
                                borderRadius: 4,
                                backgroundColor: index < 3 ? `${medalColors[index]}15` : 'rgba(255,255,255,0.03)',
                                borderLeft: index < 3 ? `3px solid ${medalColors[index]}` : '3px solid transparent',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span
                                    style={{
                                        fontFamily: 'monospace',
                                        fontWeight: 700,
                                        width: 24,
                                        textAlign: 'center',
                                        color: index < 3 ? medalColors[index] : '#666',
                                    }}
                                >
                                    #{index + 1}
                                </span>
                                <span style={{ color: '#fff', fontWeight: 500 }}>{entry.name}</span>
                            </div>
                            <span
                                style={{
                                    color: '#00f3ff',
                                    fontWeight: 700,
                                    fontFamily: 'monospace',
                                    fontSize: 18,
                                    textShadow: '0 0 5px #00f3ff',
                                }}
                            >
                                {entry.score}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
