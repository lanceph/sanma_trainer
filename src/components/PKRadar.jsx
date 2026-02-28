import React, { useState, useRef, useEffect } from "react";
import {
  Swords,
  Clock,
  Zap,
  User,
  UserX,
  Eye,
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import { SpectatorBoard } from "../views/Tournament/SpectatorBoard";

export default function PKRadar({ tournamentData, myPlayerId }) {
  const [spectatingId, setSpectatingId] = useState(null);
  // 🌟 狀態：控制雷達收合
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 🌟 狀態：拖移位置（預設在左側中央）
  const [position, setPosition] = useState({ x: 20, y: 150 });
  const [isDragging, setIsDragging] = useState(false);

  // 用於計算拖移偏移量
  const dragStartPos = useRef({ x: 0, y: 0 });
  const radarRef = useRef(null);

  if (!tournamentData || !tournamentData.players) return null;

  const players = Object.entries(tournamentData.players)
    .filter(([id]) => id !== myPlayerId)
    .map(([id, data]) => ({ id, ...data }));

  // 🌟 拖移邏輯處理
  const handleMouseDown = (e) => {
    // 只有點擊拖移手把或標題列時才觸發拖移
    if (e.target.closest(".drag-handle")) {
      setIsDragging(true);
      dragStartPos.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      // 計算新位置並限制不超出視窗邊界
      const newX = Math.max(
        0,
        Math.min(
          window.innerWidth - (isCollapsed ? 50 : 260),
          e.clientX - dragStartPos.current.x
        )
      );
      const newY = Math.max(
        0,
        Math.min(window.innerHeight - 100, e.clientY - dragStartPos.current.y)
      );

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isCollapsed]);

  return (
    <>
      <div
        ref={radarRef}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? "grabbing" : "default",
        }}
        className={`absolute z-50 transition-shadow duration-200 ${
          isDragging
            ? "shadow-[0_20px_50px_rgba(0,0,0,0.5)] scale-[1.02]"
            : "shadow-2xl"
        }`}
      >
        <div className="flex items-start gap-1">
          {/* 🌟 側邊拖移手把與收合按鈕組 */}
          <div className="flex flex-col gap-1 items-center">
            <div
              className="drag-handle p-1.5 bg-slate-800 border border-slate-700 rounded-lg cursor-grab active:cursor-grabbing text-slate-400 hover:text-indigo-400 transition-colors shadow-lg backdrop-blur-md"
              title="按住拖移"
            >
              <GripVertical size={16} />
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-indigo-400 hover:text-white shadow-lg backdrop-blur-md transition-all active:scale-90"
              title={isCollapsed ? "展開雷達" : "收合雷達"}
            >
              {isCollapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )}
            </button>
          </div>

          {/* 🌟 雷達主體內容 */}
          {!isCollapsed && (
            <div
              className="w-64 bg-slate-900/90 backdrop-blur-md border-2 border-slate-700 rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
              onMouseDown={handleMouseDown}
            >
              {/* 標題列（兼具拖移功能） */}
              <div className="drag-handle bg-gradient-to-r from-indigo-900 to-purple-900 px-3 py-2 flex items-center justify-between border-b border-slate-700 cursor-grab active:cursor-grabbing">
                <h3 className="text-white font-black text-xs flex items-center gap-1 pointer-events-none">
                  <Swords size={14} className="text-indigo-400" /> 對戰雷達
                </h3>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>

              {/* 對手列表 */}
              <div className="divide-y divide-slate-700/50 bg-slate-800/40 max-h-60 overflow-y-auto">
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
                          {isAbandoned ? (
                            <UserX size={12} />
                          ) : (
                            <User size={12} />
                          )}
                          {p.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-slate-400 text-[10px]">
                            {isAbandoned
                              ? "已棄權"
                              : isFinished
                              ? "已完賽"
                              : `第 ${live.turn} 巡`}
                          </div>
                          {hasBoardState && !isFinished && !isAbandoned && (
                            <button
                              onClick={() => setSpectatingId(p.id)}
                              className="p-1 bg-slate-700 hover:bg-emerald-500 text-slate-300 hover:text-white rounded transition-colors shadow-sm"
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
        </div>
      </div>

      {/* 觀戰板彈窗 */}
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
    </>
  );
}
