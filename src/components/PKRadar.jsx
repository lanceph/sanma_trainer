import React from "react";
import { Swords, Clock, Zap, User, UserX } from "lucide-react";

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
          // 🌟 2. 新增棄權判斷 (不管是 liveState 還是 progress 只要是 abandoned 就當作斷線)
          const isAbandoned =
            live.action === "abandoned" || p.progress === "abandoned";

          return (
            // 🌟 3. 如果斷線了，整個區塊加上半透明與灰階效果 (opacity-50 grayscale)
            <div
              key={p.id}
              className={`p-2 flex flex-col gap-1 relative ${
                isRiichi ? "bg-red-900/20" : ""
              } ${isAbandoned ? "opacity-50 grayscale" : ""}`}
            >
              <div className="flex items-center justify-between text-xs">
                <div
                  className={`font-bold flex items-center gap-1 ${
                    isRiichi
                      ? "text-red-400"
                      : isAbandoned
                      ? "text-slate-500"
                      : "text-slate-300"
                  }`}
                >
                  {/* 🌟 4. 斷線換成 UserX 圖示 */}
                  {isAbandoned ? <UserX size={12} /> : <User size={12} />}
                  {p.name}
                </div>

                <div className="text-slate-400 text-[10px]">
                  {/* 🌟 5. 狀態文字顯示 */}
                  {isAbandoned
                    ? "已棄權 (斷線)"
                    : isFinished
                    ? "已完賽"
                    : `第 ${live.turn} 巡`}
                </div>
              </div>

              {/* 🌟 6. 只有在「沒完賽」且「沒棄權」的情況下，才顯示思考中與時間 */}
              {!isFinished && !isAbandoned && (
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
