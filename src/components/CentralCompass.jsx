import React from "react";
import Tile from "./Tile";
import { TILE_LABELS } from "../constants/mahjong";

export const CentralCompass = ({ state, checkDora }) => {
  const doraIndicators = Array.isArray(state.context.doraInd)
    ? state.context.doraInd
    : [state.context.doraInd];

  return (
    // 🌟 修正：位置上提至 top-[20%]，並全面縮小寬高 (w-36 md:w-44) 與邊框厚度
    <div className="absolute top-[20%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 md:w-44 md:h-44 rounded-full bg-slate-900/85 border-[4px] border-slate-700/80 shadow-[0_0_30px_rgba(0,0,0,0.6),inset_0_0_15px_rgba(0,0,0,0.8)] z-0 flex flex-col items-center justify-center backdrop-blur-md pointer-events-none transition-all duration-300">
      {/* 局數與場風 */}
      <div className="text-emerald-400 font-black text-base md:text-lg tracking-widest drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]">
        {TILE_LABELS[state.context.pWind]}風場
      </div>

      {/* 剩餘牌數：字體微調縮小 */}
      <div className="text-slate-300 text-[10px] md:text-xs my-0.5 font-bold flex items-center gap-1">
        剩餘{" "}
        <span className="text-yellow-400 font-black text-xl md:text-2xl font-mono drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">
          {state.deck.length}
        </span>{" "}
        張
      </div>

      {/* 寶牌指示器：縮減間距與字體 */}
      <div className="mt-1 md:mt-1.5 text-[9px] md:text-[10px] text-slate-400 font-bold mb-0.5">
        寶牌指示
      </div>
      <div className="flex gap-0.5 md:gap-1 bg-black/60 p-1 md:p-1.5 rounded-lg border border-slate-600/50 shadow-inner">
        {doraIndicators.map((d, i) => (
          <Tile
            key={i}
            tile={d}
            small={true}
            className="!w-4 !h-6 md:!w-5 md:!h-7 opacity-90"
          />
        ))}
      </div>
    </div>
  );
};
