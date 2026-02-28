import React, { useState } from "react";
// 🌟 記得引入 Eye 與 Maximize2 這兩個新圖示
import { Trophy, AlertTriangle, Eye, Maximize2 } from "lucide-react";

export const SimFinishedView = ({ state, actions }) => {
  const isDoubleRon = state.winner.type === "double_ron";

  // 🌟 新增：控制結算畫面是否被縮小隱藏的狀態
  const [isMinimized, setIsMinimized] = useState(false);

  // 🌟 新增：如果被縮小了，只顯示右下角的一顆浮動按鈕
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-[100] bg-slate-900 border-2 border-emerald-500 px-6 py-3 rounded-full text-white font-bold shadow-2xl shadow-emerald-500/30 flex items-center gap-2 hover:bg-slate-800 transition-all hover:scale-105 animate-in slide-in-from-bottom-5"
      >
        <Maximize2 size={20} className="text-emerald-400" />
        展開結算並上傳分數
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div
        className={`bg-slate-900 border-4 ${
          isDoubleRon ? "border-red-500" : "border-emerald-500"
        } p-6 rounded-2xl shadow-2xl text-center animate-in fade-in zoom-in relative max-h-[90vh] overflow-y-auto w-full max-w-2xl`}
      >
        {/* 🌟 新增：右上角的快速隱藏觀戰按鈕 */}
        {state.config.tournamentConfig?.tid && (
          <button
            onClick={() => setIsMinimized(true)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg transition-colors border border-slate-700 shadow-md"
            title="暫時隱藏以觀看其他玩家現況"
          >
            <Eye size={20} />
          </button>
        )}

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

        {/* --- 渲染結算卡片邏輯 (保持不變) --- */}
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
        {/* --- 渲染結算卡片邏輯結束 --- */}

        {/* 🌟 修改：將按鈕區塊整合，加入「觀看其他人狀態」的純文字按鈕 */}
        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={() =>
              actions.proceedToNextPhase
                ? actions.proceedToNextPhase()
                : actions.setGameState("setup")
            }
            className={`px-10 py-4 rounded-full font-black text-lg transition transform hover:scale-105 shadow-lg w-full md:w-auto mx-auto ${
              state.config.tournamentConfig?.tid
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20"
                : "bg-yellow-500 hover:bg-yellow-400 text-slate-900 shadow-yellow-500/20"
            }`}
          >
            {state.config.tournamentConfig?.tid
              ? "✅ 確認結算並等待下一局"
              : "再來一局"}
          </button>

          {/* 錦標賽限定：結算畫面下方的隱藏按鈕 */}
          {state.config.tournamentConfig?.tid && (
            <button
              onClick={() => setIsMinimized(true)}
              className="text-slate-400 hover:text-emerald-400 transition-colors font-bold text-sm flex justify-center items-center gap-1.5 mt-2"
            >
              <Eye size={16} /> 暫時隱藏結算畫面，觀看其他玩家現況
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
