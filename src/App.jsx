import { useGameStore } from './store';
import StartScreen from './components/StartScreen';
import GameCanvas from './components/GameCanvas';
import GameOver from './components/GameOver';
import { useEffect } from 'react';

function App() {
  const { gameStatus } = useGameStore();

  // Prevent default touch actions (for tablet/arcade screens)
  useEffect(() => {
    const preventDefault = (e) => e.preventDefault();
    document.addEventListener('touchmove', preventDefault, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefault);
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
        overflow: 'hidden',
        userSelect: 'none',
        fontFamily: 'system-ui, sans-serif',
        color: '#fff',
        position: 'relative',
      }}
    >
      {/* GameCanvas always mounts so camera stays active */}
      <GameCanvas />

      {gameStatus === 'start' && <StartScreen />}
      {gameStatus === 'gameover' && <GameOver />}
    </div>
  );
}

export default App;
