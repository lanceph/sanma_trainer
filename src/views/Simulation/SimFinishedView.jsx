import React, { useState, useEffect, useContext } from "react";
import { Trophy, AlertTriangle, Eye, Maximize2 } from "lucide-react";
import { getTileName } from "../../constants/mahjong";
import useSound from "use-sound";
import { AudioContext } from "../../App";
import tickSound from "../../assets/sounds/tick.mp3";
import winSound from "../../assets/sounds/win.mp3";
import Tile from "../../components/Tile";

// 🌟 已刪除會產生 "3405200" bug 的 extractScoreNumber！

const extractRank = (str) => {
  if (!str) return "";
  const ranks = ["役滿", "倍滿", "跳滿", "滿貫", "倍満", "跳満", "満貫"];
  return ranks.find((r) => str.includes(r)) || "";
};

export const SimFinishedView = ({ state, actions }) => {
  const { winner, scoreResult, config } = state;
  const isDoubleRon = winner?.type === "double_ron";
  const [isMinimized, setIsMinimized] = useState(false);

  const [revealedYakuCount, setRevealedYakuCount] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [isScoreRolling, setIsScoreRolling] = useState(false);
  const [isStampVisible, setIsStampVisible] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const { isMuted, sfxVolume } = useContext(AudioContext);
  const [playTick] = useSound(tickSound, {
    volume: sfxVolume,
    soundEnabled: !isMuted,
  });
  const [playWin] = useSound(winSound, {
    volume: sfxVolume,
    soundEnabled: !isMuted,
  });

  const maxYakuCount = scoreResult?.isDouble
    ? Math.max(...scoreResult.results.map((r) => r.scoreData.yakuList.length))
    : scoreResult?.yakuList?.length || 0;

  useEffect(() => {
    if (!scoreResult || winner?.type === "draw") {
      setIsStampVisible(true);
      return;
    }
    if (revealedYakuCount < maxYakuCount) {
      const timer = setTimeout(() => {
        playTick();
        setRevealedYakuCount((prev) => prev + 1);
      }, 400);
      return () => clearTimeout(timer);
    } else if (
      revealedYakuCount === maxYakuCount &&
      !isScoreRolling &&
      !isStampVisible
    ) {
      const timer = setTimeout(() => setIsScoreRolling(true), 500);
      return () => clearTimeout(timer);
    }
  }, [
    revealedYakuCount,
    maxYakuCount,
    scoreResult,
    winner,
    playTick,
    isScoreRolling,
    isStampVisible,
  ]);

  useEffect(() => {
    if (isScoreRolling) {
      // 🌟 核心修正：直接使用引擎算好的 totalScore，從此分數由小滾到大，極度滑順！
      const targetScore = scoreResult.isDouble
        ? (scoreResult.results[0].scoreData.totalScore || 0) +
          (scoreResult.results[1].scoreData.totalScore || 0)
        : scoreResult.totalScore || 0;

      if (targetScore === 0) {
        setIsScoreRolling(false);
        setIsStampVisible(true);
        return;
      }

      let startTime;
      const duration = 1000;
      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        setCurrentScore(Math.floor(targetScore * easeProgress));

        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          setIsScoreRolling(false);
          setIsStampVisible(true);
          const rank = scoreResult.isDouble
            ? extractRank(scoreResult.results[0].scoreData.scoreStr)
            : extractRank(scoreResult.scoreStr);

          if (rank || targetScore >= 8000) {
            playWin();
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 300);
          }
        }
      };
      window.requestAnimationFrame(step);
    }
  }, [isScoreRolling, scoreResult, playWin]);

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

  const renderWinningHand = (hand, melds, kitas, winTile) => {
    if (!hand || !winTile) return null;
    const displayHand = [...hand];
    const winIdx = displayHand.indexOf(winTile);
    if (winIdx !== -1) displayHand.splice(winIdx, 1);

    return (
      <div className="flex flex-wrap items-end justify-center gap-1.5 md:gap-2 mb-6 bg-black/40 p-3 rounded-xl border border-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] w-full relative z-10">
        {kitas?.length > 0 && (
          <div className="flex gap-0.5 border-r border-white/20 pr-2">
            {kitas.map((t, i) => (
              <Tile
                key={`k-${i}`}
                tile={t}
                small={true}
                className="!w-5 !h-7 md:!w-7 md:!h-10 opacity-80"
                isDora={true}
              />
            ))}
          </div>
        )}

        <div className="flex gap-0.5">
          {displayHand.map((t, i) => (
            <Tile
              key={`h-${i}`}
              tile={t}
              small={true}
              className="!w-6 !h-9 md:!w-8 md:!h-11"
            />
          ))}
        </div>

        <div className="ml-1 pl-2 border-l border-white/20 relative">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-[9px] md:text-[10px] text-yellow-400 font-black whitespace-nowrap drop-shadow-[0_0_2px_rgba(0,0,0,1)]">
            和牌
          </div>
          <Tile
            tile={winTile}
            small={true}
            className="!w-6 !h-9 md:!w-8 md:!h-11 ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)] scale-110 z-10 relative"
          />
        </div>

        {melds?.length > 0 && (
          <div className="flex gap-1.5 ml-1 border-l border-white/20 pl-2">
            {melds.map((m, mIdx) => (
              <div key={`m-${mIdx}`} className="flex gap-0.5">
                {Array(m.type.includes("kan") ? 4 : 3)
                  .fill(m.tile)
                  .map((t, i) => (
                    <Tile
                      key={`m-${mIdx}-${i}`}
                      tile={t}
                      small={true}
                      className={`!w-6 !h-9 md:!w-8 md:!h-11 ${
                        m.type === "ankan" && (i === 0 || i === 3)
                          ? "brightness-50"
                          : ""
                      }`}
                    />
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

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

  const rankStr =
    scoreResult && !scoreResult.isDouble
      ? extractRank(scoreResult.scoreStr)
      : "";

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-all ${
        isShaking ? "animate-shake" : "animate-in fade-in duration-300"
      }`}
    >
      <div
        className={`relative w-full max-w-3xl bg-slate-900 border-4 ${themeColor.border} rounded-3xl p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto`}
      >
        {/* 🌟 修正：將印章移至右下角，並套用 animate-stamp 的 -45 度傾斜效果 */}
        {isStampVisible && rankStr && winner?.type !== "draw" && (
          <div className="absolute bottom-6 right-6 md:bottom-12 md:right-10 z-50 pointer-events-none opacity-90 drop-shadow-2xl">
            {/* 字體稍微縮小一點點 (text-5xl md:text-6xl) 確保不突兀 */}
            <div
              className="text-5xl md:text-6xl font-black text-yellow-500 border-[6px] md:border-8 border-yellow-500 rounded-2xl px-4 md:px-6 py-1 md:py-2 tracking-widest animate-stamp shadow-[0_0_40px_rgba(234,179,8,0.5)] bg-black/50 backdrop-blur-sm"
              style={{ WebkitTextStroke: "2px #854d0e" }}
            >
              {rankStr}
            </div>
          </div>
        )}

        {config.tournamentConfig?.tid && (
          <button
            onClick={() => setIsMinimized(true)}
            className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 p-2.5 rounded-xl transition-all border border-slate-700 hover:border-emerald-500 shadow-lg"
            title="暫時隱藏以觀看對手"
          >
            <Eye size={22} />
          </button>
        )}

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

        {scoreResult && (
          <div
            className={`rounded-2xl p-5 mb-8 border border-slate-700 relative overflow-hidden ${themeColor.bg}`}
          >
            {!scoreResult.isDouble ? (
              <>
                {renderWinningHand(
                  scoreResult.hand,
                  scoreResult.melds,
                  scoreResult.kitas,
                  scoreResult.winTile
                )}

                <div className="flex justify-between items-center border-b border-slate-700 pb-3 mb-4 min-h-[40px]">
                  <span
                    className={`text-3xl font-black font-mono tracking-wider ${themeColor.title}`}
                  >
                    {/* 🌟 數字穩穩地從小滾到大！ */}
                    {isStampVisible
                      ? scoreResult.scoreStr
                      : currentScore > 0
                      ? `${currentScore} 點`
                      : "計算中..."}
                  </span>
                  {isStampVisible && (
                    <span className="text-slate-400 font-mono animate-in fade-in zoom-in duration-300">
                      {scoreResult.han} 番 {scoreResult.fu} 符
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mb-4">
                  {scoreResult.yakuList.map((y, idx) => (
                    <div
                      key={idx}
                      className={`flex justify-between border-b border-slate-800 py-1 transition-opacity duration-300 ${
                        idx < revealedYakuCount
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-4"
                      }`}
                    >
                      <span className="text-slate-300 font-bold">{y.name}</span>
                      <span className="text-yellow-500 font-bold">
                        {y.han} 番
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {scoreResult.results.map((r, rIdx) => (
                  <div
                    key={r.playerIdx}
                    className="bg-slate-900/80 p-4 rounded-xl border border-red-900/50 relative z-10"
                  >
                    <div className="text-sm font-bold text-red-400 mb-2">
                      {r.playerIdx === 1 ? "下家 (AI)" : "上家 (AI)"} 和牌
                    </div>

                    {renderWinningHand(
                      r.scoreData.hand,
                      r.scoreData.melds,
                      r.scoreData.kitas,
                      r.scoreData.winTile
                    )}

                    <div className="text-lg font-black text-emerald-400 mb-2 border-b border-slate-700 pb-1 font-mono">
                      {isStampVisible
                        ? r.scoreData.scoreStr
                        : currentScore > 0
                        ? `${currentScore} 點`
                        : "計算中..."}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 text-xs opacity-80 mt-2">
                      {r.scoreData.yakuList.map((y, i) => (
                        <div
                          key={i}
                          className={`flex justify-between border-b border-slate-800/50 py-0.5 transition-all duration-300 ${
                            i < revealedYakuCount ? "opacity-100" : "opacity-0"
                          }`}
                        >
                          <span>{y.name}</span>
                          <span className="text-yellow-500">{y.han}番</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div
              className={`mt-4 pt-4 border-t border-slate-700 space-y-3 transition-opacity duration-500 ${
                isStampVisible ? "opacity-100" : "opacity-0"
              }`}
            >
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
              {(scoreResult.isDouble
                ? scoreResult.results[0].scoreData.uraIndicators
                : scoreResult.uraIndicators
              )?.length > 0 && (
                <div className="flex items-center gap-3">
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

        <div
          className={`flex flex-col items-center gap-4 transition-opacity duration-500 relative z-20 ${
            isStampVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
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
        </div>
      </div>
    </div>
  );
};
