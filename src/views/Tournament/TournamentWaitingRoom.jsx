import React, { useState } from "react";
import {
  Users,
  Play,
  AlertCircle,
  Crown,
  LogOut,
  Copy,
  Check,
  PlayCircle,
  Loader2,
} from "lucide-react";
import { startTournament } from "../../services/tournamentService";

export default function TournamentWaitingRoom({ tid, myPlayerId, data }) {
  const players = Object.values(data.players || {});
  const maxPlayers = data.config.maxPlayers;
  const myData = data.players[myPlayerId];
  const isHost = myData?.isHost;

  // 🌟 新增：複製狀態管理
  const [copied, setCopied] = useState(false);

  // 🌟 新增：複製代碼函式
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(tid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // 2 秒後恢復原狀
    } catch (err) {
      console.error("複製失敗:", err);
    }
  };

  const handleStart = async () => {
    // 🌟 這裡保留您原本的單人模式警告邏輯
    if (players.length === 1) {
      const confirmSingle = window.confirm(
        "目前只有您 1 人！\n若按下確定，將作為「單人錦標賽練習模式」開始 (對手將皆為 AI)。\n\n確定要開始嗎？"
      );
      if (!confirmSingle) return; // 如果玩家按取消，就不要開始
    }

    await startTournament(tid);
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-700 text-white">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-amber-400 tracking-widest mb-4">
          賽事等待室
        </h2>

        {/* 🌟 修改這裡：將房間代碼與複製按鈕橫排置中 */}
        <div className="flex items-center justify-center gap-3">
          <span className="text-slate-400 font-bold">房間代碼:</span>
          <span className="text-white font-mono text-2xl tracking-widest bg-slate-800 px-4 py-2 rounded-xl border border-slate-600 shadow-inner">
            {tid}
          </span>
          <button
            onClick={handleCopyCode}
            className={`p-2.5 rounded-xl transition-all duration-300 shadow-md flex items-center justify-center ${
              copied
                ? "bg-emerald-500 text-white scale-110 shadow-emerald-500/40"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white hover:scale-105"
            }`}
            title="複製房間代碼"
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>
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
