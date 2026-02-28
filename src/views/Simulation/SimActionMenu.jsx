import React from "react";
import Tile from "../../components/Tile";
import { MahjongEngine } from "../../engine/MahjongEngine";

export const SimActionMenu = ({ state, actions }) => {
  // 🌟 安全檢查：如果 actionMenu 為空，直接不渲染
  if (!state.actionMenu) return null;

  const checkDora = (t) => MahjongEngine.isTileDora(t, state.context.doraInd);
  const getPlayerName = (idx) =>
    idx === 0 ? "您 (自家)" : idx === 1 ? "下家 (AI)" : "上家 (AI)";

  // 🌟 Phase 3 新增：檢查是否有任何有效的行動選項（避免出現空選單）
  const hasValidOptions =
    state.actionMenu.type === "discard_reaction"
      ? state.actionMenu.canRon ||
        state.actionMenu.canPon ||
        state.actionMenu.canKan
      : state.actionMenu.canKita || state.actionMenu.canAnkan;

  // 🌟 如果沒有任何有效動作可按，直接回傳 null，避免擋住玩家視線
  if (!hasValidOptions) return null;

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 p-8 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] z-50 flex flex-col items-center border-2 border-slate-600 animate-in zoom-in-90 min-w-[320px]">
      {state.actionMenu.type === "discard_reaction" ? (
        <>
          {state.actionMenu.canRon && (
            <div className="absolute -top-4 bg-red-600 text-white font-black px-6 py-1.5 rounded-full shadow-lg animate-bounce text-sm tracking-widest">
              絕佳機會！
            </div>
          )}
          <h3 className="text-slate-300 font-bold mb-4 text-sm md:text-base text-center">
            {getPlayerName(state.actionMenu.sourceIdx)} 打出了
          </h3>
          <div className="mb-6 transform scale-125">
            <Tile
              tile={state.actionMenu.tile}
              isDora={checkDora(state.actionMenu.tile)}
            />
          </div>
          <div className="flex gap-3 w-full justify-center">
            {state.actionMenu.canRon && (
              <button
                onClick={() => actions.executeAction("ron")}
                className="flex-1 py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-500 shadow-lg transition-transform hover:scale-105"
              >
                榮和
              </button>
            )}
            {state.actionMenu.canPon && (
              <button
                onClick={() => actions.executeAction("pon")}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-transform hover:scale-105"
              >
                碰
              </button>
            )}
            {state.actionMenu.canKan && (
              <button
                onClick={() => actions.executeAction("kan_minkan")}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-transform hover:scale-105"
              >
                大明槓
              </button>
            )}
          </div>
          <button
            onClick={() => actions.executeAction("skip")}
            className="mt-6 px-8 py-2 bg-slate-700 text-slate-300 font-bold rounded-full hover:bg-slate-600 w-full"
          >
            跳過
          </button>
        </>
      ) : (
        <>
          <h3 className="text-yellow-400 font-bold mb-6 text-lg tracking-widest">
            特殊行動
          </h3>
          <div className="flex flex-col gap-3 w-full">
            {state.actionMenu.canKita && (
              <button
                onClick={() => actions.executeAction("kita")}
                className="w-full py-3 bg-yellow-600 text-slate-900 font-black rounded-xl hover:bg-yellow-500 transition-transform hover:scale-105"
              >
                拔北
              </button>
            )}
            {state.actionMenu.canAnkan && (
              <button
                onClick={() => actions.executeAction("ankan")}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-transform hover:scale-105"
              >
                暗槓 / 加槓
              </button>
            )}
            <button
              onClick={() => actions.executeAction("skip")}
              className="w-full mt-2 py-3 bg-slate-700 text-slate-300 font-bold rounded-xl hover:bg-slate-600"
            >
              取消
            </button>
          </div>
        </>
      )}
    </div>
  );
};
