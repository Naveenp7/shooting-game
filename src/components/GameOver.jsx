import { useGameStore } from '../store';
import Leaderboard from './Leaderboard';

const GameOver = () => {
    const { score, resetGame, setGameStatus } = useGameStore();

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
                backgroundColor: 'rgba(0,0,0,0.95)',
                color: '#fff',
                fontFamily: 'system-ui, sans-serif',
            }}
        >
            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <h1
                    style={{
                        fontSize: 56,
                        fontWeight: 900,
                        color: '#ff3333',
                        textShadow: '0 0 20px rgba(255,0,0,0.8)',
                        textTransform: 'uppercase',
                        letterSpacing: -1,
                        margin: '0 0 8px',
                    }}
                >
                    MISSION OVER
                </h1>
                <p style={{ fontSize: 18, color: '#999', fontFamily: 'monospace', letterSpacing: 4, margin: 0 }}>
                    FINAL SCORE
                </p>
                <div
                    style={{
                        fontSize: 80,
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: '#fff',
                        textShadow: '0 0 30px rgba(255,255,255,0.5)',
                        marginTop: 8,
                    }}
                >
                    {score}
                </div>
            </div>

            {/* Actions + Leaderboard */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 48,
                    width: '100%',
                    maxWidth: 800,
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
                    <button
                        onClick={() => {
                            resetGame();
                            setGameStatus('playing');
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 12,
                            width: '100%',
                            backgroundColor: '#00f3ff',
                            color: '#000',
                            fontWeight: 700,
                            padding: '16px 0',
                            fontSize: 18,
                            border: 'none',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = '#fff')}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = '#00f3ff')}
                    >
                        ↻ RETRY MISSION
                    </button>
                    <button
                        onClick={() => setGameStatus('start')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 12,
                            width: '100%',
                            backgroundColor: 'transparent',
                            color: '#fff',
                            fontWeight: 700,
                            padding: '16px 0',
                            fontSize: 18,
                            border: '2px solid rgba(255,255,255,0.2)',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            transition: 'border-color 0.2s',
                        }}
                        onMouseEnter={(e) => (e.target.style.borderColor = '#fff')}
                        onMouseLeave={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.2)')}
                    >
                        ⌂ MAIN MENU
                    </button>
                </div>
                <Leaderboard />
            </div>
        </div>
    );
};

export default GameOver;
