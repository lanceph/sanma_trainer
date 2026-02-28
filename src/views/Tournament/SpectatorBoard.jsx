import React from "react";
import Tile from "../../components/Tile";
import { X, Eye } from "lucide-react";

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
    <div className="fixed inset-0 bg-black/90 z-[120] flex flex-col p-4 md:p-8 overflow-y-auto backdrop-blur-md animate-in fade-in zoom-in-95">
      <div className="max-w-4xl mx-auto w-full relative mt-10">
        {/* 關閉按鈕 */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl shadow-lg border border-slate-600 transition-transform hover:scale-110"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-black text-emerald-400 mb-8 flex items-center gap-3 bg-slate-900/80 p-4 rounded-2xl border border-emerald-900 shadow-lg inline-flex">
          <Eye size={28} className="animate-pulse" /> 正在觀戰: {playerName}
        </h2>

        {/* 渲染觀戰玩家的狀態 */}
        <div className="bg-slate-800 p-6 md:p-10 rounded-3xl border-2 border-slate-700 shadow-2xl relative">
          {isRiichi[0] && (
            <div className="absolute -top-5 left-8 bg-red-600 text-white text-lg font-black px-6 py-1.5 rounded-full shadow-lg transform -rotate-3">
              ⚡ 立直中
            </div>
          )}

          {/* 捨牌池 */}
          <div className="mb-8">
            <div className="text-sm font-bold text-slate-400 mb-3 tracking-widest">
              DISCARD POOL / 捨牌池
            </div>
            <div className="grid grid-cols-6 md:grid-cols-10 gap-1 md:gap-2">
              {rivers[0]?.map((t, i) => (
                <Tile
                  key={`r0-${i}`}
                  tile={t}
                  small
                  isRiver
                  className="!w-8 !h-12 md:!w-10 md:!h-14 opacity-90 shadow-sm"
                />
              ))}
            </div>
          </div>

          {/* 手牌與鳴牌區 */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mt-12 border-t border-slate-700 pt-8 gap-6">
            <div className="w-full">
              <div className="text-sm font-bold text-slate-400 mb-3 tracking-widest">
                HAND / 手牌
              </div>
              <div className="flex flex-wrap gap-1 md:gap-2">
                {hands?.map((t, i) => (
                  <Tile
                    key={`h-${i}`}
                    tile={t}
                    className="!w-10 !h-14 md:!w-12 md:!h-16 shadow-lg"
                  />
                ))}
              </div>
            </div>

            {(openMelds[0]?.length > 0 || kitas[0]?.length > 0) && (
              <div className="shrink-0 bg-slate-900/50 p-3 rounded-2xl border border-slate-700">
                <div className="text-xs font-bold text-slate-500 mb-2 tracking-widest">
                  MELDS / 鳴牌與拔北
                </div>
                <div className="flex gap-3">
                  {kitas[0]?.length > 0 && (
                    <div className="flex gap-1 border-r border-slate-700 pr-3">
                      {kitas[0].map((t, i) => (
                        <Tile
                          key={`k-${i}`}
                          tile={t}
                          small
                          className="!w-8 !h-12"
                        />
                      ))}
                    </div>
                  )}
                  {openMelds[0]?.map((m, i) => (
                    <div
                      key={`m-${i}`}
                      className="flex gap-0.5 bg-black/40 p-1.5 rounded-xl shadow-inner"
                    >
                      <Tile tile={m.tile} small className="!w-8 !h-12" />
                      <Tile tile={m.tile} small className="!w-8 !h-12" />
                      <Tile tile={m.tile} small className="!w-8 !h-12" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
