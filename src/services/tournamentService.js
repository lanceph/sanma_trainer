// src/services/tournamentService.js
import { db, ref, set, get, update, onDisconnect } from "../utils/firebase";
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

  // 🌟 新增：房主註冊斷線自動棄權
  const myPlayerRef = ref(db, `tournaments/${tid}/players/${hostId}`);
  onDisconnect(myPlayerRef).update({
    progress: "abandoned",
    "liveState/action": "abandoned",
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

  // 🌟 新增：加入者註冊斷線自動棄權
  const myPlayerRef = ref(db, `tournaments/${tid}/players/${newPlayerId}`);
  onDisconnect(myPlayerRef).update({
    progress: "abandoned",
    "liveState/action": "abandoned",
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

// 4. 更新玩家即時狀態 (給 PK Radar 用)
export const updateLiveState = async (
  tid,
  playerId,
  turn,
  action,
  timeLeft = 15
) => {
  if (!tid || !playerId) return;
  await update(ref(db, `tournaments/${tid}/players/${playerId}/liveState`), {
    turn,
    action, // 例如: 'playing', 'riichi', 'finished'
    timeLeft,
  });
};

// 5. 上傳單局結算分數
export const submitRoundScore = async (tid, playerId, roundIndex, score) => {
  const playerRef = ref(db, `tournaments/${tid}/players/${playerId}`);
  const snapshot = await get(playerRef);
  if (!snapshot.exists()) return;

  const playerData = snapshot.val();
  const newRoundScores = [...(playerData.roundScores || [])];
  newRoundScores[roundIndex] = score; // 寫入這局的分數

  const newTotalScore = newRoundScores.reduce((a, b) => a + b, 0);

  await update(playerRef, {
    progress: "finished",
    roundScores: newRoundScores,
    totalScore: newTotalScore,
    "liveState/action": "finished",
  });
};

// 6. 房主推進賽程 (進入下一局，或結束賽事)
export const advanceToNextRound = async (tid) => {
  const tournamentRef = ref(db, `tournaments/${tid}`);
  const snapshot = await get(tournamentRef);
  if (!snapshot.exists()) return;

  const data = snapshot.val();
  const currentRound = data.state.currentRound;
  const totalRounds = data.config.totalRounds;

  const updates = {};

  if (currentRound < totalRounds) {
    // 還有下一局：推進局數，並把所有人的狀態改回 'playing'
    updates["state/currentRound"] = currentRound + 1;
    updates["state/status"] = "playing";
    Object.keys(data.players).forEach((playerId) => {
      updates[`players/${playerId}/progress`] = "playing";
      updates[`players/${playerId}/liveState/action`] = "waiting";
    });
  } else {
    // 已經是最後一局：賽事結束
    updates["state/status"] = "finished";
  }

  await update(tournamentRef, updates);
};
