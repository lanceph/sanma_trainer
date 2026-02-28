import React, { useState } from "react";
// 🌟 引入 Eye 與 Maximize2 圖示
import { Trophy, AlertTriangle, Eye, Maximize2 } from "lucide-react";
// 🌟 引入麻將牌名轉換函式
import { getTileName } from "../../constants/mahjong";

export const SimFinishedView = ({ state, actions }) => {
  const { winner, scoreResult, config } = state;
  const isDoubleRon = winner?.type === "double_ron";
  const [isMinimized, setIsMinimized] = useState(false);

  // 🌟 核心邏輯：根據勝負狀態決定主題顏色
  let themeColor = {
    border: "border-emerald-500 shadow-emerald-500/40",
    title: "text-emerald-400",
    bg: "bg-emerald-500/10",
  };

  if (winner?.type === "draw") {
    themeColor = {
      border: "border-yellow-500 shadow-yellow-500/40",
      title: "text-yellow-400",
      bg: "bg-yellow-500/10",
    };
  } else if (winner?.playerIdx !== 0 || isDoubleRon) {
    themeColor = {
      border: "border-red-500 shadow-red-500/40",
      title: "text-red-400",
      bg: "bg-red-500/10",
    };
  }

  // 🌟 縮小模式：浮動按鈕
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-10 right-10 z-[100] bg-slate-900 border-2 border-emerald-500 px-6 py-4 rounded-full text-white font-bold shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center gap-3 hover:bg-slate-800 transition-all hover:scale-105 animate-in slide-in-from-bottom-10"
      >
        <Maximize2 size={24} className="text-emerald-400" />
        <span className="tracking-widest">展開結算並結束此局</span>
      </button>
    );
  }

  return (
    // 🌟 全螢幕遮罩層：確保玩家專注於結算
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      {/* 🌟 結算主卡片：單一容器結構 */}
      <div
        className={`relative w-full max-w-2xl bg-slate-900 border-4 ${themeColor.border} rounded-3xl p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto`}
      >
        {/* 右上角縮小按鈕 (僅限錦標賽) */}
        {config.tournamentConfig?.tid && (
          <button
            onClick={() => setIsMinimized(true)}
            className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 p-2.5 rounded-xl transition-all border border-slate-700 hover:border-emerald-500 shadow-lg"
            title="暫時隱藏以觀看對手"
          >
            <Eye size={22} />
          </button>
        )}

        {/* 頂部圖示與標題 */}
        <div className="text-center mb-6">
          {isDoubleRon ? (
            <AlertTriangle
              size={64}
              className="mx-auto text-red-500 mb-4 animate-pulse"
            />
          ) : (
            <Trophy
              size={64}
              className={`mx-auto mb-4 ${
                winner?.type === "draw" ? "text-yellow-500" : "text-yellow-400"
              }`}
            />
          )}

          <h2
            className={`text-3xl font-black tracking-[0.2em] mb-2 ${themeColor.title}`}
          >
            {winner?.type === "draw"
              ? "流局 (荒牌平局)"
              : isDoubleRon
              ? "一砲雙響 (Double Ron)!"
              : winner?.type === "tsumo"
              ? "自摸 (Tsumo)"
              : "榮和 (Ron)"}
          </h2>

          <p className="text-xl text-slate-300 font-medium">
            {isDoubleRon
              ? "放銃給: 下家 & 上家 (AI)"
              : winner?.type !== "draw" && (
                  <span>
                    贏家:{" "}
                    <span className="text-yellow-400 font-bold">
                      {winner?.playerIdx === 0
                        ? "您 (自家)"
                        : winner?.playerIdx === 1
                        ? "下家 (AI)"
                        : "上家 (AI)"}
                    </span>
                  </span>
                )}
          </p>
        </div>

        {/* --- 結算卡片內容 (與原邏輯一致，僅優化 UI 質感) --- */}
        {scoreResult && (
          <div
            className={`rounded-2xl p-5 mb-8 border border-slate-700 ${themeColor.bg}`}
          >
            {!scoreResult.isDouble ? (
              // 單人榮和/自摸
              <>
                <div className="flex justify-between items-center border-b border-slate-700 pb-3 mb-4">
                  <span className={`text-2xl font-black ${themeColor.title}`}>
                    {scoreResult.scoreStr}
                  </span>
                  <span className="text-slate-400 font-mono">
                    {scoreResult.han} 翻 {scoreResult.fu} 符
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mb-4">
                  {scoreResult.yakuList.map((y, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between border-b border-slate-800 py-1"
                    >
                      <span className="text-slate-300">{y.name}</span>
                      <span className="text-yellow-500 font-bold">
                        {y.han} 翻
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              // 一砲雙響模式
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scoreResult.results.map((r) => (
                  <div
                    key={r.playerIdx}
                    className="bg-slate-900/80 p-4 rounded-xl border border-red-900/50"
                  >
                    <div className="text-sm font-bold text-red-400 mb-1">
                      {r.playerIdx === 1 ? "下家 (AI)" : "上家 (AI)"}
                    </div>
                    <div className="text-lg font-black text-emerald-400 mb-2 border-b border-slate-700 pb-1">
                      {r.scoreData.scoreStr}
                    </div>
                    <div className="text-xs space-y-1 opacity-80">
                      {r.scoreData.yakuList.map((y, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{y.name}</span>
                          <span>{y.han}翻</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 寶牌展示區 */}
            <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
              {/* 表寶牌 (Dora) */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider w-16 text-right">
                  寶牌
                </span>
                <div className="flex gap-1.5">
                  {(scoreResult.isDouble
                    ? scoreResult.results[0].scoreData.doraIndicators
                    : scoreResult.doraIndicators
                  )?.map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-slate-100 text-slate-900 rounded-md font-bold text-sm border-b-2 border-slate-400 shadow-sm"
                    >
                      {getTileName(t)}
                    </span>
                  ))}
                </div>
              </div>

              {/* 裏寶牌 (Ura Dora) - 修正：獨立判斷是否存在裏寶數據 */}
              {(scoreResult.isDouble
                ? scoreResult.results[0].scoreData.uraIndicators
                : scoreResult.uraIndicators
              )?.length > 0 && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-500">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider w-16 text-right">
                    裏寶牌
                  </span>
                  <div className="flex gap-1.5">
                    {(scoreResult.isDouble
                      ? scoreResult.results[0].scoreData.uraIndicators
                      : scoreResult.uraIndicators
                    ).map((t, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-slate-700 text-emerald-50 rounded-md font-bold text-sm border-b-2 border-slate-900 shadow-inner"
                      >
                        {getTileName(t)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 底部按鈕區 */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() =>
              actions.proceedToNextPhase
                ? actions.proceedToNextPhase()
                : actions.setGameState("setup")
            }
            className={`w-full max-w-sm py-4 rounded-full font-black text-xl transition-all transform hover:scale-105 active:scale-95 shadow-xl ${
              config.tournamentConfig?.tid
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "bg-yellow-500 hover:bg-yellow-400 text-slate-900"
            }`}
          >
            {config.tournamentConfig?.tid
              ? "✅ 確認並等待下一局"
              : "再來一局 (New Game)"}
          </button>

          {config.tournamentConfig?.tid && (
            <button
              onClick={() => setIsMinimized(true)}
              className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors text-sm font-bold"
            >
              <Eye size={18} /> 暫時隱藏以觀察牌局現況
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
