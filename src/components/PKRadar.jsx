import React, { useState } from "react";
import {
  Swords,
  Clock,
  Zap,
  User,
  UserX,
  Eye,
  ChevronRight,
} from "lucide-react"; // 🌟 引入 ChevronRight 用於收合
import { SpectatorBoard } from "../views/Tournament/SpectatorBoard";

export default function PKRadar({ tournamentData, myPlayerId }) {
  const [spectatingId, setSpectatingId] = useState(null);
  // 🌟 Phase 1 新增：控制雷達收合狀態
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!tournamentData || !tournamentData.players) return null;

  const players = Object.entries(tournamentData.players)
    .filter(([id]) => id !== myPlayerId)
    .map(([id, data]) => ({ id, ...data }));

  return (
    // 🌟 修改外層容器：改為 flex-col 且靠右對齊，寬度隨狀態變化
    <div
      className={`absolute top-4 right-4 z-50 flex flex-col items-end gap-2 transition-all duration-300 ${
        isCollapsed ? "w-10" : "w-64"
      }`}
    >
      {/* 🌟 Phase 1 新增：雷達收合切換按鈕 */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="bg-slate-900/90 border border-slate-700 p-2 rounded-full text-indigo-400 hover:text-white shadow-lg backdrop-blur-sm transition-all active:scale-90"
        title={isCollapsed ? "展開雷達" : "隱藏雷達"}
      >
        {isCollapsed ? <Swords size={20} /> : <ChevronRight size={18} />}
      </button>

      {/* 🌟 判斷是否顯示雷達本體 */}
      {!isCollapsed && (
        <div className="w-full bg-slate-900/85 backdrop-blur-sm border-2 border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-right-5 duration-300">
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
              const isAbandoned =
                live.action === "abandoned" || p.progress === "abandoned";
              const hasBoardState = !!live.boardState;

              return (
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
                      {isAbandoned ? <UserX size={12} /> : <User size={12} />}
                      {p.name}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-slate-400 text-[10px]">
                        {isAbandoned
                          ? "已棄權 (斷線)"
                          : isFinished
                          ? "已完賽"
                          : `第 ${live.turn} 巡`}
                      </div>

                      {hasBoardState && !isFinished && !isAbandoned && (
                        <button
                          onClick={() => setSpectatingId(p.id)}
                          className="p-1 bg-slate-700 hover:bg-emerald-500 text-slate-300 hover:text-white rounded transition-colors shadow-sm"
                          title="點擊觀戰"
                        >
                          <Eye size={12} />
                        </button>
                      )}
                    </div>
                  </div>

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
      )}

      {/* 觀戰視窗邏輯保持不變 */}
      {spectatingId &&
        tournamentData.players[spectatingId]?.liveState?.boardState && (
          <SpectatorBoard
            playerName={tournamentData.players[spectatingId].name}
            boardState={
              tournamentData.players[spectatingId].liveState.boardState
            }
            onClose={() => setSpectatingId(null)}
          />
        )}
    </div>
  );
}
