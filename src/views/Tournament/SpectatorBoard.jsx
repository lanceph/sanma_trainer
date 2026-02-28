import React from "react";
import Tile from "../../components/Tile";
import { X, Eye, User, Zap, Swords } from "lucide-react";

export const SpectatorBoard = ({ playerName, boardState, onClose }) => {
  if (!boardState) return null;

  const {
    hands = [],
    rivers = [[], [], []],
    openMelds = [[], [], []],
    kitas = [[], [], []],
    isRiichi = [false, false, false],
  } = boardState;

  return (
    // 🌟 改為 fixed inset-0，覆蓋整個螢幕，就像切換了一個分頁
    <div className="fixed inset-0 bg-slate-900 z-[120] flex flex-col overflow-hidden animate-in fade-in duration-300">
      {/* 🌟 頂部專屬導覽列 */}
      <header className="bg-slate-950 text-white p-4 shadow-xl shrink-0 flex justify-between items-center border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20">
            <Eye size={18} className="animate-pulse" />{" "}
            <span className="hidden md:inline">觀戰模式</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-emerald-400 flex items-center gap-2">
            {playerName}{" "}
            <span className="text-sm font-bold text-slate-400">的牌桌</span>
          </h2>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-600 text-slate-200 hover:text-white rounded-xl transition-all duration-300 font-bold shadow-lg border border-slate-700 hover:border-red-500 hover:scale-105"
        >
          <X size={20} /> <span className="hidden md:inline">結束觀戰</span>
        </button>
      </header>

      {/* 🌟 牌桌內容區 (模擬真實遊戲背景) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950 flex flex-col">
        <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col relative">
          {/* 牌桌中央：三家捨牌區 */}
          <div className="flex-1 flex flex-col justify-center items-center gap-8 mb-8 mt-4">
            <div className="flex items-center gap-2 text-slate-500 font-black tracking-widest opacity-50 mb-2">
              <Swords size={24} /> LIVE MATCH
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full">
              {/* 下家 (AI) 河牌 */}
              <div className="bg-slate-900/60 p-5 rounded-3xl border border-slate-700 shadow-inner flex flex-col items-center">
                <div className="text-xs font-bold text-slate-400 mb-4 tracking-widest flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full">
                  下家 (AI){" "}
                  {isRiichi[1] && (
                    <Zap size={14} className="text-red-500 fill-red-500" />
                  )}
                </div>
                <div className="grid grid-cols-6 gap-1 md:gap-1.5">
                  {rivers[1]?.map((t, i) => (
                    <Tile
                      key={`r1-${i}`}
                      tile={t}
                      small
                      isRiver
                      className="!w-8 !h-12 md:!w-9 md:!h-14 opacity-70"
                    />
                  ))}
                </div>
              </div>

              {/* 上家 (AI) 河牌 */}
              <div className="bg-slate-900/60 p-5 rounded-3xl border border-slate-700 shadow-inner flex flex-col items-center md:order-last">
                <div className="text-xs font-bold text-slate-400 mb-4 tracking-widest flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full">
                  上家 (AI){" "}
                  {isRiichi[2] && (
                    <Zap size={14} className="text-red-500 fill-red-500" />
                  )}
                </div>
                <div className="grid grid-cols-6 gap-1 md:gap-1.5">
                  {rivers[2]?.map((t, i) => (
                    <Tile
                      key={`r2-${i}`}
                      tile={t}
                      small
                      isRiver
                      className="!w-8 !h-12 md:!w-9 md:!h-14 opacity-70"
                    />
                  ))}
                </div>
              </div>

              {/* 自家 (被觀戰者) 河牌 */}
              <div className="bg-slate-800/80 p-5 rounded-3xl border-2 border-slate-600 shadow-2xl flex flex-col items-center transform md:scale-105 md:-translate-y-4">
                <div className="text-sm font-bold text-emerald-400 mb-4 tracking-widest flex items-center gap-2 bg-slate-900 px-4 py-1.5 rounded-full shadow-inner">
                  {playerName} 的捨牌{" "}
                  {isRiichi[0] && (
                    <Zap size={16} className="text-red-500 fill-red-500" />
                  )}
                </div>
                <div className="grid grid-cols-6 gap-1.5 md:gap-2">
                  {rivers[0]?.map((t, i) => (
                    <Tile
                      key={`r0-${i}`}
                      tile={t}
                      small
                      isRiver
                      className="!w-9 !h-14 md:!w-11 md:!h-16 shadow-sm"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 🌟 觀戰玩家手牌與鳴牌區 (強制置底對齊) */}
          <div className="bg-slate-900 p-6 md:p-8 rounded-3xl border-t-4 border-emerald-500 shadow-[0_-20px_40px_rgba(0,0,0,0.4)] mt-auto relative">
            {/* 立直標籤 */}
            {isRiichi[0] && (
              <div className="absolute -top-5 left-8 bg-red-600 text-white text-sm font-black px-6 py-1.5 rounded-full shadow-lg transform -rotate-2">
                ⚡ 立直中
              </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              {/* 手牌區 */}
              <div className="w-full">
                <div className="text-sm font-bold text-slate-400 mb-4 tracking-widest flex items-center gap-2">
                  <User size={18} className="text-emerald-500" /> {playerName}{" "}
                  的手牌
                </div>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {hands?.map((t, i) => (
                    <Tile
                      key={`h-${i}`}
                      tile={t}
                      className="!w-10 !h-14 md:!w-12 md:!h-16 lg:!w-14 lg:!h-20 shadow-xl transition-transform hover:-translate-y-2 cursor-pointer"
                    />
                  ))}
                </div>
              </div>

              {/* 鳴牌與拔北區 */}
              {(openMelds[0]?.length > 0 || kitas[0]?.length > 0) && (
                <div className="shrink-0 bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-inner">
                  <div className="text-xs font-bold text-slate-500 mb-3 tracking-widest text-right">
                    MELDS / 副露 & 拔北
                  </div>
                  <div className="flex gap-4">
                    {kitas[0]?.length > 0 && (
                      <div className="flex gap-1.5 border-r border-slate-700 pr-4">
                        {kitas[0].map((t, i) => (
                          <Tile
                            key={`k-${i}`}
                            tile={t}
                            small
                            className="!w-8 !h-12 md:!w-10 md:!h-14 opacity-90"
                          />
                        ))}
                      </div>
                    )}
                    {openMelds[0]?.map((m, i) => (
                      <div
                        key={`m-${i}`}
                        className="flex gap-0.5 bg-slate-800 p-2 rounded-xl shadow-md border border-slate-700"
                      >
                        <Tile
                          tile={m.tile}
                          small
                          className="!w-8 !h-12 md:!w-10 md:!h-14"
                        />
                        <Tile
                          tile={m.tile}
                          small
                          className="!w-8 !h-12 md:!w-10 md:!h-14"
                        />
                        <Tile
                          tile={m.tile}
                          small
                          className="!w-8 !h-12 md:!w-10 md:!h-14"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
