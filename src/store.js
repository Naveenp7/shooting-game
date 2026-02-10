import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useGameStore = create(
    persist(
        (set, get) => ({
            score: 0,
            highScores: [],
            gameStatus: 'start', // 'start', 'countdown', 'playing', 'paused', 'gameover'
            gameMode: 'arcade',  // 'arcade', 'freeplay', 'survival'
            playerName: '',
            timeLeft: 60,
            soundEnabled: true,

            // Stats tracking
            stats: {
                shotsFired: 0,
                targetsHit: 0,
                targetsMissed: 0,
                bestCombo: 0,
                bonusHit: 0,
                bombsHit: 0,
                powerUpsCollected: 0,
            },

            // Difficulty
            difficulty: 1, // Increases over time

            setScore: (score) => set({ score }),
            incrementScore: (amount) => set((state) => ({ score: state.score + amount })),
            setGameStatus: (status) => set({ gameStatus: status }),
            setGameMode: (mode) => set({ gameMode: mode }),
            setPlayerName: (name) => set({ playerName: name }),
            setTimeLeft: (time) => set({ timeLeft: time }),
            decrementTime: () => set((state) => ({ timeLeft: Math.max(0, state.timeLeft - 1) })),
            setDifficulty: (d) => set({ difficulty: d }),
            toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

            updateStats: (updates) => set((state) => ({
                stats: { ...state.stats, ...updates },
            })),
            incrementStat: (key, amount = 1) => set((state) => ({
                stats: { ...state.stats, [key]: (state.stats[key] || 0) + amount },
            })),

            addHighScore: (score, name) => set((state) => {
                const newScore = { score, name, date: new Date().toISOString() };
                const newHighScores = [...state.highScores, newScore]
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 10);
                return { highScores: newHighScores };
            }),

            resetGame: () => {
                const mode = get().gameMode;
                set({
                    score: 0,
                    timeLeft: mode === 'freeplay' ? 9999 : 60,
                    gameStatus: 'countdown',
                    difficulty: 1,
                    stats: {
                        shotsFired: 0,
                        targetsHit: 0,
                        targetsMissed: 0,
                        bestCombo: 0,
                        bonusHit: 0,
                        bombsHit: 0,
                        powerUpsCollected: 0,
                    },
                });
            },
        }),
        {
            name: 'hand-shooting-storage',
            partialize: (state) => ({
                highScores: state.highScores,
                playerName: state.playerName,
                soundEnabled: state.soundEnabled,
            }),
        }
    )
);
