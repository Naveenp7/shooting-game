import { db } from './firebase';
import {
    ref,
    push,
    set,
    onValue,
    query,
    orderByChild,
    limitToLast,
    get,
    serverTimestamp,
} from 'firebase/database';

const LEADERBOARD_REF = 'leaderboard';

/**
 * Save a score entry to Firebase.
 * Each entry stores: name, score, stats, gameMode, timestamp.
 */
export const saveScoreToFirebase = async (playerName, score, stats, gameMode) => {
    try {
        const scoresRef = ref(db, LEADERBOARD_REF);
        const newScoreRef = push(scoresRef);

        const entry = {
            name: playerName,
            score,
            gameMode: gameMode || 'arcade',
            stats: {
                shotsFired: stats.shotsFired || 0,
                targetsHit: stats.targetsHit || 0,
                targetsMissed: stats.targetsMissed || 0,
                bestCombo: stats.bestCombo || 0,
                bonusHit: stats.bonusHit || 0,
                bombsHit: stats.bombsHit || 0,
                powerUpsCollected: stats.powerUpsCollected || 0,
                accuracy: stats.shotsFired > 0
                    ? Math.round((stats.targetsHit / stats.shotsFired) * 100)
                    : 0,
            },
            timestamp: Date.now(),
            id: newScoreRef.key,
        };

        await set(newScoreRef, entry);
        return entry;
    } catch (error) {
        console.error('Error saving score to Firebase:', error);
        return null;
    }
};

/**
 * Subscribe to live leaderboard updates.
 * Calls the callback with sorted scores whenever data changes.
 * Returns an unsubscribe function.
 */
export const subscribeToLeaderboard = (callback, limit = 50) => {
    try {
        const scoresRef = ref(db, LEADERBOARD_REF);
        // Firebase queries: orderByChild + limitToLast gets top scores
        const scoresQuery = query(scoresRef, orderByChild('score'), limitToLast(limit));

        const unsubscribe = onValue(scoresQuery, (snapshot) => {
            const scores = [];
            snapshot.forEach((child) => {
                scores.push({ ...child.val(), id: child.key });
            });
            // Sort descending by score
            scores.sort((a, b) => b.score - a.score);
            callback(scores);
        }, (error) => {
            console.error('Error subscribing to leaderboard:', error);
            callback([]);
        });

        return unsubscribe;
    } catch (error) {
        console.error('Error setting up leaderboard subscription:', error);
        return () => { };
    }
};

/**
 * Get a single score entry by ID.
 */
export const getScoreById = async (scoreId) => {
    try {
        const scoreRef = ref(db, `${LEADERBOARD_REF}/${scoreId}`);
        const snapshot = await get(scoreRef);
        if (snapshot.exists()) {
            return { ...snapshot.val(), id: scoreId };
        }
        return null;
    } catch (error) {
        console.error('Error getting score:', error);
        return null;
    }
};
