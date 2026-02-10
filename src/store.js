import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useGameStore = create(
    persist(
        (set) => ({
            score: 0,
            highScores: [],
            gameStatus: 'start', // 'start', 'playing', 'gameover'
            gameMode: 'arcade', // 'arcade', 'freeplay'
            playerName: '',
            timeLeft: 60,

            setScore: (score) => set({ score }),
            incrementScore: (amount) => set((state) => ({ score: state.score + amount })),
            setGameStatus: (status) => set({ gameStatus: status }),
            setGameMode: (mode) => set({ gameMode: mode }),
            setPlayerName: (name) => set({ playerName: name }),
            setTimeLeft: (time) => set({ timeLeft: time }),
            decrementTime: () => set((state) => ({ timeLeft: Math.max(0, state.timeLeft - 1) })),

            addHighScore: (score, name) => set((state) => {
                const newScore = { score, name, date: new Date().toISOString() };
                const newHighScores = [...state.highScores, newScore]
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 10); // Keep top 10
                return { highScores: newHighScores };
            }),

            resetGame: () => set({ score: 0, timeLeft: 60, gameStatus: 'playing' }),
        }),
        {
            name: 'hand-shooting-storage',
            partialize: (state) => ({ highScores: state.highScores, playerName: state.playerName }),
        }
    )
);
