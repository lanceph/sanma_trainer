import React, { useState, useEffect } from "react";
import TournamentLobby from "./TournamentLobby";
import TournamentWaitingRoom from "./TournamentWaitingRoom";
import RoundResultView from "./RoundResultView";
import { useTournamentSync } from "../../hooks/useTournamentSync";
import { SimulationMode } from "../Simulation/SimulationMode";
import PKRadar from "../../components/PKRadar";

export default function TournamentManager({ onContextUpdate }) {
  const [tid, setTid] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(null);

  // 透過 Hook 監聽這個房間的狀態
  const tournamentData = useTournamentSync(tid);

  // ==========================================
  // 🌟 修正：把 useEffect 移到所有的 return 前面！(最上層)
  // ==========================================
  useEffect(() => {
    if (onContextUpdate) {
      // 因為 tournamentData 可能還是 null，這裡要用 ?. 安全讀取
      const status = tournamentData?.state?.status;
      const myProgress = tournamentData?.players?.[myPlayerId]?.progress;

      const isInRoom = !!(
        tid &&
        status &&
        status !== "finished" &&
        myProgress !== "abandoned"
      );
      onContextUpdate({ isInRoom, tid, myPlayerId });
    }
  }, [tid, tournamentData, myPlayerId, onContextUpdate]);

  // ==========================================
  // 下面開始才是條件渲染 (Conditional Rendering)
  // ==========================================

  // 1. 如果還沒有加入房間，顯示大廳
  if (!tid || !tournamentData) {
    return (
      <TournamentLobby
        onJoinSuccess={(id, playerId) => {
          setTid(id);
          setMyPlayerId(playerId);
        }}
      />
    );
  }

  // 確定有資料後，再把它們解構出來給下面用
  const status = tournamentData.state?.status;
  const myProgress = tournamentData.players[myPlayerId]?.progress;

  // 2. 如果賽事徹底結束，顯示最終總排名
  if (status === "finished") {
    return (
      <div className="text-center mt-10">
        <h1 className="text-4xl font-black text-amber-400 mb-4 animate-bounce">
          🏆 錦標賽圓滿結束 🏆
        </h1>
        <RoundResultView
          tournamentData={tournamentData}
          myPlayerId={myPlayerId}
          tid={tid}
        />
      </div>
    );
  }

  // 3. 局間結算 (🌟 記得加上 tid={tid})
  if (myProgress === "finished" || status === "round_result") {
    return (
      <RoundResultView
        tournamentData={tournamentData}
        myPlayerId={myPlayerId}
        tid={tid}
      />
    );
  }

  // 4. 如果狀態是 lobby，顯示等待室
  if (status === "lobby") {
    return (
      <TournamentWaitingRoom
        tid={tid}
        myPlayerId={myPlayerId}
        data={tournamentData}
      />
    );
  }

  // 5. 如果房主按下了開始 (status 變成 playing)
  if (status === "playing") {
    const currentRound = tournamentData.state.currentRound;
    // 取得當前局數的 Seed
    const currentSeed = tournamentData.config.seeds[currentRound - 1];

    return (
      <div className="relative h-full w-full">
        {/* 載入真實的麻將桌，並把錦標賽參數傳進去 */}
        <SimulationMode
          tournamentConfig={{
            tid,
            myPlayerId,
            seed: currentSeed,
            currentRound: currentRound - 1,
          }}
        />

        {/* 懸浮在右上角的 PK 雷達 */}
        <PKRadar tournamentData={tournamentData} myPlayerId={myPlayerId} />
      </div>
    );
  }

  return null;
}
