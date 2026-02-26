// src/services/tournamentService.js
import { db, ref, set, get, update } from "../utils/firebase";
import { generateRoomSeed } from "../utils/rng"; // 使用我們 Phase 1 寫好的亂數產生器

// 1. 建立錦標賽房間
export const createTournament = async (hostName, totalRounds = 3) => {
  const tid = generateRoomSeed(); // 產生 6 碼大寫字母代碼
  // 一次性產生所有局數需要的 Seed
  const seeds = Array.from({ length: totalRounds }, () => generateRoomSeed());
  const hostId = `player_${Date.now()}`; // 用時間戳記產生唯一玩家 ID

  const tournamentRef = ref(db, `tournaments/${tid}`);
  await set(tournamentRef, {
    config: { maxPlayers: 8, totalRounds, seeds },
    state: { status: "lobby", currentRound: 1 },
    players: {
      [hostId]: {
        name: hostName,
        isHost: true,
        progress: "waiting", // waiting, playing, finished
        roundScores: Array(totalRounds).fill(0),
        totalScore: 0,
      },
    },
  });

  return { tid, myPlayerId: hostId };
};

// 2. 加入錦標賽房間
export const joinTournament = async (tid, playerName) => {
  const tournamentRef = ref(db, `tournaments/${tid}`);
  const snapshot = await get(tournamentRef);

  if (!snapshot.exists()) throw new Error("找不到該錦標賽代碼！");

  const data = snapshot.val();
  if (data.state.status !== "lobby")
    throw new Error("錦標賽已經開始或已結束！");

  const playerCount = Object.keys(data.players || {}).length;
  if (playerCount >= data.config.maxPlayers)
    throw new Error("房間已滿 (8/8)！");

  const newPlayerId = `player_${Date.now()}`;

  // 只更新該房間的 players 節點，加入新玩家
  await update(ref(db, `tournaments/${tid}/players`), {
    [newPlayerId]: {
      name: playerName,
      isHost: false,
      progress: "waiting",
      roundScores: Array(data.config.totalRounds).fill(0),
      totalScore: 0,
    },
  });

  return { tid, myPlayerId: newPlayerId };
};

// 3. 房主開始錦標賽
export const startTournament = async (tid) => {
  // 將房間狀態從 'lobby' 改為 'playing'
  await update(ref(db, `tournaments/${tid}/state`), {
    status: "playing",
  });
};
