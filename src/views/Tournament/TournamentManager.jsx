import React, { useState } from "react";
import TournamentLobby from "./TournamentLobby";
import TournamentWaitingRoom from "./TournamentWaitingRoom";
import { useTournamentSync } from "../../hooks/useTournamentSync";

export default function TournamentManager() {
  const [tid, setTid] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(null);

  // 透過剛才寫好的 Hook 監聽這個房間的狀態
  const tournamentData = useTournamentSync(tid);

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

  const status = tournamentData.state?.status;

  // 2. 如果狀態是 lobby，顯示等待室
  if (status === "lobby") {
    return (
      <TournamentWaitingRoom
        tid={tid}
        myPlayerId={myPlayerId}
        data={tournamentData}
      />
    );
  }

  // 3. 如果房主按下了開始 (status 變成 playing)
  if (status === "playing") {
    return (
      <div className="text-center mt-20 text-white">
        <h2 className="text-2xl font-bold">遊戲開始！</h2>
        <p className="text-slate-400 mt-4">
          我們下一步會把麻將桌 (SimulationMode) 載入進來，並傳入種子{" "}
          {tournamentData.config.seeds[0]}...
        </p>
      </div>
    );
  }

  return null;
}
