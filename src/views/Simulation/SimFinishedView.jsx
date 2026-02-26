import React from "react";
import { Trophy } from "lucide-react";

export const SimFinishedView = ({ state, actions }) => (
  <div className="bg-slate-900 border-4 border-yellow-500 p-6 rounded-2xl shadow-2xl text-center animate-in fade-in zoom-in z-50 relative">
    <Trophy size={56} className="mx-auto text-yellow-400 mb-2 drop-shadow-lg" />
    <h2 className="text-3xl font-black text-white mb-2 tracking-widest">
      {state.winner.type === "draw"
        ? "流局 (荒牌平局)"
        : `${state.winner.type === "tsumo" ? "自摸 (Tsumo)" : "榮和 (Ron)"}`}
    </h2>
    <p className="text-xl text-yellow-300 font-bold mb-6">
      {state.winner.type !== "draw" &&
        `贏家: ${
          state.winner.playerIdx === 0
            ? "您 (自家)"
            : state.winner.playerIdx === 1
            ? "下家 (AI)"
            : "上家 (AI)"
        }`}
    </p>
    {state.scoreResult && (
      <div className="bg-slate-800 p-4 rounded-xl text-left max-w-md mx-auto mb-6 border border-slate-700">
        <div className="flex justify-between items-end border-b border-slate-600 pb-2 mb-3">
          <div className="text-2xl font-black text-emerald-400">
            {state.scoreResult.scoreStr}
          </div>
        </div>
        <div className="space-y-1 mb-4">
          {state.scoreResult.yakuList.map((y, idx) => (
            <div key={idx} className="flex justify-between text-slate-200">
              <span>{y.name}</span>
              <span className="font-mono text-yellow-400">{y.han} 翻</span>
            </div>
          ))}
        </div>
        <div className="text-right text-sm text-slate-400 font-mono pt-2 border-t border-slate-700">
          總計: {state.scoreResult.han} 翻 {state.scoreResult.fu} 符
        </div>
      </div>
    )}
    <button
      onClick={() => actions.setGameState("setup")}
      className="px-10 py-4 bg-yellow-500 text-slate-900 rounded-full font-black text-lg hover:bg-yellow-400 transition transform hover:scale-105 shadow-lg shadow-yellow-500/20"
    >
      再來一局
    </button>
  </div>
);
