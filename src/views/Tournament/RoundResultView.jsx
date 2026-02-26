import React, { useState, useEffect } from "react";
import {
  Trophy,
  Loader2,
  CheckCircle2,
  PlayCircle,
  XCircle,
} from "lucide-react";
import {
  advanceToNextRound,
  claimHost,
} from "../../services/tournamentService";

export default function RoundResultView({ tournamentData, myPlayerId, tid }) {
  const [countdown, setCountdown] = useState(30); // 🌟 設定 30 秒自動推進倒數

  if (!tournamentData) return null;

  // 取得帶有 ID 的玩家陣列，方便後續做繼承判斷
  const playersWithId = Object.entries(tournamentData.players || {}).map(
    ([id, p]) => ({ id, ...p })
  );
  const players = [...playersWithId].sort(
    (a, b) => b.totalScore - a.totalScore
  );

  const currentRound = tournamentData.state.currentRound;
  const totalRounds = tournamentData.config.totalRounds;
  const status = tournamentData.state?.status;

  // 🌟 判斷是否所有人都完賽或棄權了
  const isAllFinished = players.every(
    (p) => p.progress === "finished" || p.progress === "abandoned"
  );

  const myData = tournamentData.players[myPlayerId];
  const isHost = myData?.isHost;
  const isFinalRound = currentRound === totalRounds;

  // ==========================================
  // 🛡️ 核心防卡關邏輯 1：房主繼承 (Host Migration)
  // ==========================================
  useEffect(() => {
    const currentHost = playersWithId.find((p) => p.isHost);
    const isHostAbandoned = currentHost?.progress === "abandoned";

    if (isHostAbandoned) {
      // 找出還沒棄權的玩家，用 ID 排序確保大家選出同一個人當新房主
      const eligiblePlayers = playersWithId
        .filter((p) => p.progress !== "abandoned")
        .sort((a, b) => a.id.localeCompare(b.id));

      // 如果我就是那個天選之人，我就去資料庫宣告我是新房主
      if (eligiblePlayers.length > 0 && eligiblePlayers[0].id === myPlayerId) {
        claimHost(tid, myPlayerId, currentHost.id);
      }
    }
  }, [playersWithId, myPlayerId, tid]);

  // ==========================================
  // 🛡️ 核心防卡關邏輯 2：全員完賽自動倒數推進
  // ==========================================
  useEffect(() => {
    // 只有在「全員完賽」且「比賽還沒結束」時才啟動倒數
    if (isAllFinished && status !== "finished") {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // 時間到！如果我是房主，自動幫大家按下一局
            if (tournamentData.players[myPlayerId]?.isHost) {
              advanceToNextRound(tid);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isAllFinished, status, myPlayerId, tid, tournamentData.players]);

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-700 text-white animate-in zoom-in-95">
      {/* 標題區 */}
      <div className="text-center mb-8">
        <Trophy size={56} className="mx-auto text-amber-400 mb-4" />
        <h2 className="text-3xl font-black text-white tracking-widest">
          第 {currentRound} 局結算板
        </h2>
        <p className="text-slate-400 mt-2">
          {isAllFinished
            ? "全員完賽！準備進入下一階段"
            : "等待其他玩家完成對局..."}
        </p>
      </div>

      {/* 積分表 */}
      <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 mb-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/50 text-slate-400 text-sm border-b border-slate-700">
              <th className="p-4 font-bold">排名</th>
              <th className="p-4 font-bold">玩家</th>
              <th className="p-4 font-bold text-right">本局得分</th>
              <th className="p-4 font-bold text-right">總積分</th>
              <th className="p-4 font-bold text-center">狀態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {players.map((p, idx) => {
              const isMe = p.id === myPlayerId;
              const isFinished = p.progress === "finished";
              const isAbandoned = p.progress === "abandoned";
              const roundScore = p.roundScores[currentRound - 1] || 0;

              return (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    isMe ? "bg-indigo-900/20" : "hover:bg-slate-700/20"
                  }`}
                >
                  <td className="p-4 font-black text-amber-400">#{idx + 1}</td>
                  <td className="p-4 font-bold flex items-center gap-2">
                    {p.name}{" "}
                    {isMe && (
                      <span className="text-xs text-indigo-400 border border-indigo-400/30 px-1.5 py-0.5 rounded">
                        你
                      </span>
                    )}
                    {/* 如果他是房主，給他一個小小皇冠圖示 */}
                    {p.isHost && (
                      <span className="text-xs text-amber-400 ml-1">👑</span>
                    )}
                  </td>
                  <td
                    className={`p-4 font-mono text-right font-bold ${
                      isAbandoned
                        ? "text-slate-500"
                        : roundScore > 0
                        ? "text-emerald-400"
                        : roundScore < 0
                        ? "text-red-400"
                        : "text-slate-400"
                    }`}
                  >
                    {roundScore > 0 ? `+${roundScore}` : roundScore}
                  </td>
                  <td className="p-4 font-mono text-right font-black text-amber-400">
                    {p.totalScore}
                  </td>
                  <td className="p-4 flex justify-center">
                    {isAbandoned ? (
                      <div className="flex items-center gap-1 text-red-500 font-bold text-xs bg-red-900/20 px-2 py-1 rounded">
                        <XCircle size={14} /> 棄權
                      </div>
                    ) : isFinished ? (
                      <CheckCircle2 size={20} className="text-emerald-500" />
                    ) : (
                      <Loader2
                        size={20}
                        className="text-amber-500 animate-spin"
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 🌟 房主推進賽程按鈕 & 倒數計時 */}
      {isAllFinished && status !== "finished" && (
        <div className="mt-8 flex flex-col items-center animate-in slide-in-from-bottom-4">
          {isHost ? (
            <button
              onClick={() => advanceToNextRound(tid)}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-black py-4 px-8 rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
            >
              <PlayCircle size={22} />{" "}
              {isFinalRound
                ? "結算最終總排名"
                : `進入第 ${currentRound + 1} 局`}
              <span className="ml-2 bg-amber-900/30 text-amber-100 px-2 py-0.5 rounded text-sm">
                自動推進: {countdown}s
              </span>
            </button>
          ) : (
            <div className="text-slate-400 font-bold flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={18} />{" "}
                等待房主開始下一局...
              </div>
              <span className="text-sm text-slate-500">
                自動推進倒數: {countdown}s
              </span>
            </div>
          )}
        </div>
      )}

      {/* 賽事結束後的返回按鈕 */}
      {status === "finished" && (
        <div className="mt-8 flex justify-center animate-in zoom-in">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-black py-4 px-8 rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
          >
            離開賽事並返回首頁
          </button>
        </div>
      )}
    </div>
  );
}
