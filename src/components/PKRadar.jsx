import React from "react";
import { Swords, Clock, Zap, User } from "lucide-react";

export default function PKRadar({ tournamentData, myPlayerId }) {
  if (!tournamentData || !tournamentData.players) return null;

  const players = Object.entries(tournamentData.players)
    .filter(([id]) => id !== myPlayerId) // 只顯示對手
    .map(([id, data]) => ({ id, ...data }));

  return (
    <div className="absolute top-4 right-4 w-64 bg-slate-900/85 backdrop-blur-sm border-2 border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
      {/* 標題列 */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 px-3 py-2 flex items-center justify-between border-b border-slate-700">
        <h3 className="text-white font-black text-xs flex items-center gap-1">
          <Swords size={14} className="text-indigo-400" /> 對戰雷達
        </h3>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </div>

      {/* 對手列表 */}
      <div className="divide-y divide-slate-700/50 bg-slate-800/50 max-h-60 overflow-y-auto">
        {players.length === 0 && (
          <div className="p-3 text-xs text-slate-400 text-center">
            單人測試中...
          </div>
        )}
        {players.map((p) => {
          const live = p.liveState || {
            turn: 0,
            action: "waiting",
            timeLeft: 15,
          };
          const isRiichi = live.action === "riichi";
          const isFinished = live.action === "finished";

          return (
            <div
              key={p.id}
              className={`p-2 flex flex-col gap-1 relative ${
                isRiichi ? "bg-red-900/20" : ""
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <div
                  className={`font-bold flex items-center gap-1 ${
                    isRiichi ? "text-red-400" : "text-slate-300"
                  }`}
                >
                  <User size={12} /> {p.name}
                </div>
                <div className="text-slate-400 text-[10px]">
                  {isFinished ? "已完賽" : `第 ${live.turn} 巡`}
                </div>
              </div>

              {!isFinished && (
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1">
                    {isRiichi ? (
                      <>
                        <Zap
                          size={10}
                          className="text-red-500 fill-red-500 animate-bounce"
                        />
                        <span className="text-[10px] text-red-400 font-black">
                          立直中
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        <span className="text-[10px] text-slate-400">
                          思考中
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock size={10} /> {live.timeLeft}s
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
