import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useGameStore } from './store';
import StartScreen from './components/StartScreen';
import GameCanvas from './components/GameCanvas';
import GameOver from './components/GameOver';
import LiveLeaderboardPage from './components/LiveLeaderboardPage';

const GameScreen = () => {
  const { gameStatus } = useGameStore();

  useEffect(() => {
    const preventDefault = (e) => e.preventDefault();
    document.addEventListener('touchmove', preventDefault, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefault);
  }, []);

  useEffect(() => {
    const handleTouch = (e) => {
      if (gameStatus !== 'playing') return;
      window.dispatchEvent(new CustomEvent('touch-shoot', {
        detail: { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }));
    };
    window.addEventListener('touchstart', handleTouch);
    return () => window.removeEventListener('touchstart', handleTouch);
  }, [gameStatus]);

  return (
    <div style={{
      width: '100vw', height: '100vh', backgroundColor: '#000',
      overflow: 'hidden', userSelect: 'none', fontFamily: 'system-ui, sans-serif',
      color: '#fff', position: 'relative',
    }}>
      <GameCanvas />
      {gameStatus === 'start' && <StartScreen />}
      {gameStatus === 'gameover' && <GameOver />}
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GameScreen />} />
        <Route path="/leaderboard" element={<LiveLeaderboardPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
