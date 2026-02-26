import React from "react";
import { Trophy, Loader2, CheckCircle2, PlayCircle } from "lucide-react";
import { advanceToNextRound } from "../../services/tournamentService";

export default function RoundResultView({ tournamentData, myPlayerId, tid }) {
  if (!tournamentData) return null;

  const players = Object.values(tournamentData.players || {}).sort(
    (a, b) => b.totalScore - a.totalScore
  );
  const currentRound = tournamentData.state.currentRound;
  const totalRounds = tournamentData.config.totalRounds;
  const isAllFinished = players.every((p) => p.progress === "finished");

  // 🌟 新增：取得目前玩家是不是房主，以及賽事代碼
  const isHost = tournamentData.players[myPlayerId]?.isHost;
  const isFinalRound = currentRound === totalRounds;

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
              const isMe = p.name === tournamentData.players[myPlayerId]?.name;
              const isFinished = p.progress === "finished";
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
                  </td>
                  <td
                    className={`p-4 font-mono text-right font-bold ${
                      roundScore > 0
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
                    {isFinished ? (
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

      {/* 🌟 房主推進賽程按鈕 (僅在還沒正式結束時顯示) */}
      {isAllFinished && status !== "finished" && (
        <div className="mt-8 flex justify-center animate-in slide-in-from-bottom-4">
          {isHost ? (
            <button
              onClick={() => advanceToNextRound(tid)}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-black py-4 px-8 rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
            >
              <PlayCircle size={22} />{" "}
              {isFinalRound
                ? "結算最終總排名"
                : `進入第 ${currentRound + 1} 局`}
            </button>
          ) : (
            <div className="text-slate-400 font-bold flex items-center gap-2">
              <Loader2 className="animate-spin" size={18} />{" "}
              等待房主開始下一局...
            </div>
          )}
        </div>
      )}

      {/* 🌟 賽事結束後的返回按鈕 */}
      {status === "finished" && (
        <div className="mt-8 flex justify-center animate-in zoom-in">
          <button
            onClick={() => window.location.reload()} // 簡單粗暴：重整網頁回到大廳
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-black py-4 px-8 rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
          >
            離開賽事並返回首頁
          </button>
        </div>
      )}
    </div>
  );
}
