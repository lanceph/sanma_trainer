import React from "react";
import { Trophy, AlertTriangle } from "lucide-react";

export const SimFinishedView = ({ state, actions }) => {
  const isDoubleRon = state.winner.type === "double_ron";

  return (
    // 🌟 加上了 fixed 與 backdrop-blur 讓它變成彈出視窗
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div
        className={`bg-slate-900 border-4 ${
          isDoubleRon ? "border-red-500" : "border-yellow-500"
        } p-6 rounded-2xl shadow-2xl text-center animate-in fade-in zoom-in relative max-h-[90vh] overflow-y-auto w-full max-w-2xl`}
      >
        {isDoubleRon ? (
          <AlertTriangle
            size={56}
            className="mx-auto text-red-500 mb-2 drop-shadow-lg animate-pulse"
          />
        ) : (
          <Trophy
            size={56}
            className="mx-auto text-yellow-400 mb-2 drop-shadow-lg"
          />
        )}

        <h2
          className={`text-3xl font-black mb-2 tracking-widest ${
            isDoubleRon ? "text-red-400" : "text-white"
          }`}
        >
          {state.winner.type === "draw"
            ? "流局 (荒牌平局)"
            : isDoubleRon
            ? "一砲雙響 (Double Ron)!"
            : `${
                state.winner.type === "tsumo" ? "自摸 (Tsumo)" : "榮和 (Ron)"
              }`}
        </h2>

        <p className="text-xl text-yellow-300 font-bold mb-6">
          {isDoubleRon
            ? "贏家: 下家 (AI) & 上家 (AI)"
            : state.winner.type !== "draw" &&
              `贏家: ${
                state.winner.playerIdx === 0
                  ? "您 (自家)"
                  : state.winner.playerIdx === 1
                  ? "下家 (AI)"
                  : "上家 (AI)"
              }`}
        </p>

        {/* 單人榮和/自摸/流局 的渲染 */}
        {state.scoreResult && !state.scoreResult.isDouble && (
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
            {/* 🌟 新增：寶牌指示牌展示區 */}
            <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700 text-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-500 font-bold w-16 text-right">
                  寶牌指示:
                </span>
                <div className="flex gap-1">
                  {state.scoreResult.doraIndicators?.map((t, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 bg-slate-200 text-slate-900 rounded font-black border-b-2 border-slate-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* 只有立直且有裏寶牌時才顯示 */}
              {state.scoreResult.uraIndicators &&
                state.scoreResult.uraIndicators.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold w-16 text-right">
                      裏寶指示:
                    </span>
                    <div className="flex gap-1">
                      {state.scoreResult.uraIndicators.map((t, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 bg-slate-700 text-slate-100 rounded font-black border-b-2 border-slate-900"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
            <div className="text-right text-sm text-slate-400 font-mono pt-2 border-t border-slate-700">
              總計: {state.scoreResult.han} 翻 {state.scoreResult.fu} 符
            </div>
          </div>
        )}

        {/* 🌟 雙響專用渲染 (兩張卡片並排) */}
        {state.scoreResult && state.scoreResult.isDouble && (
          <div className="flex flex-col md:flex-row gap-4 justify-center mb-6">
            {state.scoreResult.results.map((r) => (
              <div
                key={r.playerIdx}
                className="bg-slate-800 p-4 rounded-xl text-left w-full md:w-64 border border-red-900 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              >
                <div className="text-sm font-bold text-red-400 mb-2">
                  {r.playerIdx === 1 ? "下家 (AI)" : "上家 (AI)"}
                </div>
                <div className="text-xl font-black text-emerald-400 border-b border-slate-600 pb-2 mb-2">
                  {r.scoreData.scoreStr}
                </div>
                <div className="space-y-1 mb-2 text-sm">
                  {r.scoreData.yakuList.map((y, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-slate-200"
                    >
                      <span>{y.name}</span>
                      <span className="font-mono text-yellow-400">
                        {y.han} 翻
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-right text-xs text-slate-400 font-mono pt-1 border-t border-slate-700">
                  總計: {r.scoreData.han} 翻 {r.scoreData.fu} 符
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 🌟 修改：錦標賽也能顯示確認按鈕，點擊後會呼叫 proceedToNextPhase 推進遊戲 */}
        <button
          onClick={() =>
            actions.proceedToNextPhase
              ? actions.proceedToNextPhase()
              : actions.setGameState("setup")
          }
          className={`px-10 py-4 mt-4 rounded-full font-black text-lg transition transform hover:scale-105 shadow-lg w-full md:w-auto ${
            state.config.tournamentConfig?.tid
              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20"
              : "bg-yellow-500 hover:bg-yellow-400 text-slate-900 shadow-yellow-500/20"
          }`}
        >
          {state.config.tournamentConfig?.tid
            ? "✅ 確認結算並等待下一局"
            : "再來一局"}
        </button>
      </div>
    </div>
  );
};
