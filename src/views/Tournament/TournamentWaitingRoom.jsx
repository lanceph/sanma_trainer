import React from "react";
import { Users, Crown, PlayCircle, Loader2 } from "lucide-react";
import { startTournament } from "../../services/tournamentService";

export default function TournamentWaitingRoom({ tid, myPlayerId, data }) {
  const players = Object.values(data.players || {});
  const maxPlayers = data.config.maxPlayers;
  const myData = data.players[myPlayerId];
  const isHost = myData?.isHost;

  const handleStart = async () => {
    if (players.length < 1) return alert("至少需要 1 人才能開始 (單人測試)");
    await startTournament(tid);
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-700 text-white">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-amber-400 tracking-widest mb-2">
          賽事等待室
        </h2>
        <p className="text-slate-400">
          房間代碼:{" "}
          <span className="text-white font-mono text-xl tracking-widest bg-slate-800 px-3 py-1 rounded ml-2">
            {tid}
          </span>
        </p>
      </div>

      <div className="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-600">
          <h3 className="font-bold flex items-center gap-2">
            <Users size={18} className="text-indigo-400" /> 參賽選手
          </h3>
          <span className="text-sm text-slate-400">
            {players.length} / {maxPlayers} 人
          </span>
        </div>
        <div className="space-y-2">
          {players.map((p, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {p.isHost ? (
                  <Crown size={16} className="text-amber-400" />
                ) : (
                  <div className="w-4" />
                )}
                <span className="font-bold">
                  {p.name}{" "}
                  {p.name === myData?.name && (
                    <span className="text-xs text-indigo-400 ml-1">(你)</span>
                  )}
                </span>
              </div>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-900/30 px-2 py-1 rounded">
                已準備
              </span>
            </div>
          ))}
          {/* 顯示等待中的空位 */}
          {Array.from({ length: maxPlayers - players.length }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="flex items-center justify-center bg-slate-800 p-3 rounded-lg border border-dashed border-slate-600 text-slate-500 text-sm"
            >
              等待玩家加入...
            </div>
          ))}
        </div>
      </div>

      {isHost ? (
        <button
          onClick={handleStart}
          className="w-full flex justify-center items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-black py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
        >
          <PlayCircle size={22} /> 開始錦標賽
        </button>
      ) : (
        <div className="w-full flex justify-center items-center gap-2 bg-slate-800 text-slate-400 font-bold py-4 rounded-xl border border-slate-700">
          <Loader2 size={20} className="animate-spin" /> 等待房主開始遊戲...
        </div>
      )}
    </div>
  );
}
