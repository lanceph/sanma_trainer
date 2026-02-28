import React, { useState, useEffect } from "react";
import { Cpu, User, Zap, Eye } from "lucide-react";
import useSound from "use-sound";
import { AudioContext } from "../../App";
import tickSound from "../../assets/sounds/tick.mp3";
import Tile from "../../components/Tile";
import TacticalAdvisor from "../../components/TacticalAdvisor";
// 🌟 1. 確保成功引入羅盤組件
import { CentralCompass } from "../../components/CentralCompass";
import { useSimulation } from "../../hooks/useSimulation";
import { SimSetupView } from "./SimSetupView";
import { SimFinishedView } from "./SimFinishedView";
import { SimActionMenu } from "./SimActionMenu";
import { MahjongEngine } from "../../engine/MahjongEngine";
import { TILE_LABELS, getTileName } from "../../constants/mahjong";

export const SimulationMode = ({ tournamentConfig }) => {
  const { state, actions } = useSimulation();
  const [hoveredTileType, setHoveredTileType] = useState(null);

  const isTournament =
    !!tournamentConfig || !!state.config.tournamentConfig?.tid;

  const { setIsRiichiBgmActive, isMuted, sfxVolume } =
    React.useContext(AudioContext);
  const [playTick, { stop: stopTick }] = useSound(tickSound, {
    volume: sfxVolume,
    soundEnabled: !isMuted,
  });

  React.useEffect(() => {
    if (
      state.currentTurn === 0 &&
      state.gameState === "playing" &&
      !state.actionMenu &&
      !state.isRiichi[0] &&
      state.config.timeLimit > 0 &&
      state.timeLeft === 5
    ) {
      playTick();
    }
  }, [
    state.timeLeft,
    state.currentTurn,
    state.gameState,
    state.actionMenu,
    state.isRiichi,
    state.config.timeLimit,
    playTick,
  ]);

  React.useEffect(() => {
    if (
      state.currentTurn !== 0 ||
      state.isRiichi[0] ||
      state.actionMenu ||
      state.gameState !== "playing"
    ) {
      stopTick();
    }
    return () => stopTick();
  }, [
    state.currentTurn,
    state.isRiichi,
    state.actionMenu,
    state.gameState,
    stopTick,
  ]);

  React.useEffect(() => {
    if (setIsRiichiBgmActive) {
      const hasAnyRiichi = state.isRiichi.some((r) => r);
      const isStillPlaying = state.gameState === "playing";
      setIsRiichiBgmActive(hasAnyRiichi && isStillPlaying);
    }
  }, [state.isRiichi, state.gameState, setIsRiichiBgmActive]);

  React.useEffect(() => {
    return () => {
      if (setIsRiichiBgmActive) setIsRiichiBgmActive(false);
    };
  }, [setIsRiichiBgmActive]);

  useEffect(() => {
    if (tournamentConfig && state.gameState === "setup") {
      if (state.config.seed !== tournamentConfig.seed) {
        actions.setConfig((prev) => ({
          ...prev,
          seed: tournamentConfig.seed,
          tournamentConfig: tournamentConfig,
          timeLimit: 15,
        }));
      } else if (state.config.seed === tournamentConfig.seed) {
        actions.startGame();
      }
    }
  }, [tournamentConfig, state.gameState, state.config.seed, actions]);

  if (state.gameState === "setup")
    return <SimSetupView state={state} actions={actions} />;

  const checkDora = (t) => MahjongEngine.isTileDora(t, state.context.doraInd);

  const renderMelds = (idx, isPlayer = false) => {
    const tileClass = isPlayer
      ? "!w-6 !h-9 md:!w-7 md:!h-10"
      : "!w-5 !h-8 md:!w-6 md:!h-9";
    return state.openMelds[idx].map((m, i) => {
      const isMatched = hoveredTileType === m.tile;
      const highlightClass = isMatched
        ? "ring-2 ring-yellow-400 scale-110 shadow-[0_0_10px_rgba(250,204,21,0.6)] !opacity-100 relative z-10"
        : "";

      return (
        <div key={i} className="flex gap-0.5 bg-black/20 p-1 rounded items-end">
          <Tile
            tile={m.tile}
            small={true}
            isDora={checkDora(m.tile)}
            className={`${tileClass} transition-all duration-300 ${highlightClass}`}
          />
          <Tile
            tile={m.tile}
            small={true}
            isDora={checkDora(m.tile)}
            className={`${tileClass} transition-all duration-300 ${highlightClass}`}
          />
          <Tile
            tile={m.tile}
            small={true}
            isDora={checkDora(m.tile)}
            className={`${tileClass} transition-all duration-300 ${highlightClass}`}
          />
          {(m.type === "kan" || m.type === "ankan") && (
            <Tile
              tile={m.tile}
              small={true}
              isDora={checkDora(m.tile)}
              faceDown={m.type === "ankan"}
              className={`${tileClass} transition-all duration-300 ${highlightClass}`}
            />
          )}
        </div>
      );
    });
  };

  let activeTenpaiInfo = null;
  let currentReason = "";
  let lastDrawnIdx = -1;

  if (
    state.currentTurn === 0 &&
    !state.actionMenu &&
    state.gameState !== "finished" &&
    !state.isRiichi[0]
  ) {
    const minScore = Math.min(...Object.values(state.weights));
    let targetIdx = state.selectedTileIndex;
    if (targetIdx === null)
      targetIdx = Object.keys(state.weights).find(
        (k) => Math.abs(state.weights[k] - minScore) < 0.05
      );

    if (targetIdx !== undefined && state.tenpaiMap[targetIdx])
      activeTenpaiInfo = state.tenpaiMap[targetIdx];

    const bestIndices = Object.keys(state.weights)
      .filter((k) => Math.abs(state.weights[k] - minScore) < 0.05)
      .map(Number);
    const bestTiles = [
      ...new Set(bestIndices.map((i) => getTileName(state.hands[0][i]))),
    ];
    const isDefense =
      state.tacticalInfo?.stance === "defend" ||
      state.tacticalInfo?.stance === "caution";

    if (state.selectedTileIndex !== null) {
      const selScore = state.weights[state.selectedTileIndex];
      if (isDefense) {
        if (Math.abs(selScore - minScore) < 0.05)
          currentReason = `🛡️ 防守推薦：此牌危險度最低 (危 ${selScore}%)，是最安全的選擇。`;
        else
          currentReason = `⚠️ 危險警告：此牌危險度高達 ${selScore}%，打出有放銃風險！最安全選擇是 ${bestTiles.join(
            "/"
          )}。`;
      } else {
        if (Math.abs(selScore - minScore) < 0.05)
          currentReason = `✅ 最佳選擇：此牌關聯分最低，打出能最大化進張效率。`;
        else if (selScore <= -1000)
          currentReason = `✅ 維持聽牌：打出此牌可聽牌，進張數為 ${Math.round(
            Math.abs(selScore + 1000)
          )} 張。`;
        else if (selScore >= 1000)
          currentReason = `❌ 嚴重失誤：打出此牌將破壞聽牌或已完成的面子！`;
        else
          currentReason = `❌ 效率不佳：此牌關聯分為 ${selScore.toFixed(
            1
          )}，會損失部分進張。推薦打出 ${bestTiles.join("/")}。`;
      }
    } else {
      if (isDefense)
        currentReason = `👉 防守模式：敵方威脅極大！請優先打出危險度最低的安全牌。`;
      else if (activeTenpaiInfo)
        currentReason = `👉 推薦打出 ${bestTiles.join(
          " / "
        )} 即可維持最大面聽牌。`;
      else
        currentReason = `👉 推薦打出 ${bestTiles.join(
          " / "
        )}：系統綜合關聯分數最低，效率最差。`;
    }
  }

  if (
    state.currentTurn === 0 &&
    state.lastDrawnTile &&
    state.hands[0].length % 3 === 2
  ) {
    lastDrawnIdx = state.hands[0].lastIndexOf(state.lastDrawnTile);
  }

  const handTileCounts = {};

  return (
    // 🌟 2. 最外層改為 min-h-full，確保螢幕太小時會出現捲軸，不壓扁羅盤
    <div className="min-h-full flex flex-col gap-3 md:gap-4 pb-2 relative">
      {state.gameState === "finished" && (
        <SimFinishedView state={state} actions={actions} />
      )}

      {/* 🌟 3. 綠色桌面：加入 flex-1 填滿高度，並設定 min-h-[550px] 保護羅盤生存空間 */}
      <div className="bg-emerald-800 p-2 md:p-4 rounded-xl shadow-[inset_0_0_50px_rgba(0,0,0,0.4)] relative flex-1 flex flex-col justify-between overflow-hidden min-h-[550px] md:min-h-[600px]">
        {/* 🌟 4. 補回消失的中央羅盤 (CentralCompass) */}
        {state.gameState !== "setup" && (
          <CentralCompass state={state} checkDora={checkDora} />
        )}

        {/* 🌟 5. 補回右上角的 AR 浮空倒數計時器 */}
        {state.currentTurn === 0 &&
          state.config.timeLimit > 0 &&
          !state.actionMenu &&
          !state.isRiichi[0] &&
          state.gameState !== "finished" && (
            <div
              className={`absolute top-6 right-6 px-4 py-2 rounded-lg font-mono font-black text-2xl z-40 backdrop-blur-sm border-2 transition-colors ${
                state.timeLeft <= 5
                  ? "bg-red-900/80 border-red-500 text-red-400 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.6)]"
                  : "bg-slate-900/60 border-slate-600 text-yellow-400"
              }`}
            >
              ⏱ {state.timeLeft}s
            </div>
          )}

        {/* Opponents Area (加入 shrink-0 固定在上方) */}
        <div className="w-full overflow-visible shrink-0 pointer-events-auto">
          <div className="flex justify-between items-start min-w-[550px] md:min-w-full pb-2">
            {/* 上家 AI 區域 */}
            <div
              className={`p-2 rounded-lg ${
                state.currentTurn === 2 && state.gameState !== "finished"
                  ? "bg-white/20 ring-2 ring-yellow-400"
                  : ""
              }`}
            >
              <div className="text-white text-xs font-bold mb-1 flex items-center gap-2">
                <Cpu size={12} />
                上家 ({TILE_LABELS[state.context.ai2Wind]})
                {state.isRiichi[2] && (
                  <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded shadow-sm animate-pulse">
                    立直
                  </span>
                )}
              </div>
              <div className="flex gap-0.5 mb-1">{renderMelds(2)}</div>
              {state.kitas[2].length > 0 && (
                <div className="flex gap-0.5 mb-1 pl-1 border-l border-white/20">
                  {state.kitas[2].map((t, i) => (
                    <Tile
                      key={`k2-${i}`}
                      tile={t}
                      small={true}
                      isDora={true}
                      className={`!w-5 !h-8 md:!w-6 md:!h-9 transition-all duration-300 ${
                        hoveredTileType === t
                          ? "ring-2 ring-yellow-400 scale-110 shadow-lg relative z-10 !opacity-100"
                          : ""
                      }`}
                    />
                  ))}
                </div>
              )}
              <div className="flex gap-0.5">
                {state.hands[2].map((_, i) => (
                  <Tile
                    key={i}
                    faceDown={state.gameState === "playing"}
                    tile={
                      state.gameState === "finished" ? state.hands[2][i] : null
                    }
                    isDora={
                      state.gameState === "finished"
                        ? checkDora(state.hands[2][i])
                        : false
                    }
                    small={true}
                    className={`!w-5 !h-8 md:!w-6 md:!h-9 !border-b-2 transition-all duration-300 ${
                      hoveredTileType === state.hands[2][i]
                        ? "ring-2 ring-yellow-400 scale-110 shadow-lg relative z-10"
                        : ""
                    }`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-6 gap-0.5 md:gap-1 mt-2 w-max relative overflow-visible">
                {state.rivers[2].map((t, i) => (
                  <Tile
                    key={`r2-${i}`}
                    tile={t}
                    small={true}
                    isRiver={true}
                    isDora={checkDora(t)}
                    className={`!w-6 !h-9 md:!w-7 md:!h-10 !border-b-2 transition-all duration-300 ${
                      state.shakingPlayer === 2 &&
                      i === state.rivers[2].length - 1
                        ? "animate-tile-slam !z-50 !opacity-100"
                        : "z-0"
                    } ${
                      hoveredTileType === t
                        ? "ring-2 ring-yellow-400 scale-110 shadow-[0_0_10px_rgba(250,204,21,0.6)] !opacity-100 relative z-10"
                        : "opacity-80"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 下家 AI 區域 */}
            <div
              className={`p-2 rounded-lg text-right flex flex-col items-end ${
                state.currentTurn === 1 && state.gameState !== "finished"
                  ? "bg-white/20 ring-2 ring-yellow-400"
                  : ""
              }`}
            >
              <div className="text-white text-xs font-bold mb-1 justify-end flex items-center gap-2">
                {state.isRiichi[1] && (
                  <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded shadow-sm animate-pulse">
                    立直
                  </span>
                )}
                下家 ({TILE_LABELS[state.context.ai1Wind]})<Cpu size={12} />
              </div>
              <div className="flex gap-0.5 mb-1 justify-end">
                {renderMelds(1)}
              </div>
              {state.kitas[1].length > 0 && (
                <div className="flex gap-0.5 mb-1 pr-1 border-r border-white/20 justify-end">
                  {state.kitas[1].map((t, i) => (
                    <Tile
                      key={`k1-${i}`}
                      tile={t}
                      small={true}
                      isDora={true}
                      className={`!w-5 !h-8 md:!w-6 md:!h-9 transition-all duration-300 ${
                        hoveredTileType === t
                          ? "ring-2 ring-yellow-400 scale-110 shadow-lg relative z-10 !opacity-100"
                          : ""
                      }`}
                    />
                  ))}
                </div>
              )}
              <div className="flex gap-0.5 justify-end">
                {state.hands[1].map((_, i) => (
                  <Tile
                    key={i}
                    faceDown={state.gameState === "playing"}
                    tile={
                      state.gameState === "finished" ? state.hands[1][i] : null
                    }
                    isDora={
                      state.gameState === "finished"
                        ? checkDora(state.hands[1][i])
                        : false
                    }
                    small={true}
                    className={`!w-5 !h-8 md:!w-6 md:!h-9 !border-b-2 transition-all duration-300 ${
                      hoveredTileType === state.hands[1][i]
                        ? "ring-2 ring-yellow-400 scale-110 shadow-lg relative z-10"
                        : ""
                    }`}
                  />
                ))}
              </div>
              <div
                className="grid grid-cols-6 gap-0.5 md:gap-1 mt-2 w-max relative overflow-visible"
                dir="ltr"
              >
                {state.rivers[1].map((t, i) => (
                  <Tile
                    key={`r1-${i}`}
                    tile={t}
                    className={`!w-6 !h-9 md:!w-7 md:!h-10 !border-b-2 transition-all duration-300 ${
                      state.shakingPlayer === 1 &&
                      i === state.rivers[1].length - 1
                        ? "animate-tile-slam !z-50 !opacity-100"
                        : "z-0"
                    } ${
                      hoveredTileType === t
                        ? "ring-2 ring-yellow-400 scale-110 shadow-[0_0_10px_rgba(250,204,21,0.6)] !opacity-100 relative z-10"
                        : "opacity-80"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 🌟 選單浮層：不受牌桌高低影響，永遠絕對置中 */}
        {state.gameState === "playing" && state.actionMenu && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
            <div className="pointer-events-auto">
              <SimActionMenu state={state} actions={actions} />
            </div>
          </div>
        )}

        {/* 🌟 6. 自家區域：套用 mt-auto，死死釘在牌桌底部不亂飄 */}
        <div className="w-full flex flex-col mt-auto shrink-0 relative z-10 pointer-events-none">
          <div className="flex justify-center mb-2 md:mb-4 pointer-events-auto">
            <div className="grid grid-cols-6 gap-0.5 md:gap-1 w-max">
              {state.rivers[0].map((t, i) => (
                <Tile
                  key={`r0-${i}`}
                  tile={t}
                  small={true}
                  isRiver={true}
                  isDora={checkDora(t)}
                  className={`!w-7 !h-10 md:!w-8 md:!h-11 transition-all duration-300 ${
                    state.shakingPlayer === 0 &&
                    i === state.rivers[0].length - 1
                      ? "animate-tile-slam !z-50 !opacity-100"
                      : "z-0"
                  } ${
                    hoveredTileType === t
                      ? "ring-2 ring-yellow-400 scale-110 shadow-[0_0_10px_rgba(250,204,21,0.6)] relative z-10 !opacity-100"
                      : "opacity-90"
                  }`}
                />
              ))}
            </div>
          </div>

          <div
            className={`relative p-2 pt-5 rounded-xl transition-colors mt-0 pointer-events-auto ${
              state.currentTurn === 0 && state.gameState !== "finished"
                ? "bg-gradient-to-t from-black/40 to-transparent shadow-[0_-15px_30px_rgba(0,0,0,0.15)]"
                : "bg-transparent"
            }`}
          >
            {/* 左上角精簡標籤 */}
            <div className="absolute -top-3 left-4 bg-slate-900/90 text-slate-300 text-[10px] md:text-xs px-3 py-1 rounded-full shadow-md flex items-center gap-1 z-30 border border-slate-700">
              <User size={12} /> 自家
              {state.currentTurn === 0 &&
                !state.actionMenu &&
                state.gameState !== "finished" && (
                  <span className="text-yellow-400 ml-1 font-bold animate-pulse">
                    您的回合
                  </span>
                )}
              {state.isRiichi[0] && (
                <span className="bg-red-600 text-white ml-2 px-1.5 py-0.5 rounded-full shadow-sm text-[10px]">
                  立直中
                </span>
              )}
            </div>

            {(state.openMelds[0].length > 0 || state.kitas[0].length > 0) && (
              <div className="flex justify-end gap-2 mb-3 pr-2">
                {state.kitas[0].length > 0 && (
                  <div className="flex gap-0.5 mr-2 self-end border-r border-white/20 pr-3">
                    {state.kitas[0].map((t, i) => (
                      <Tile
                        key={`k0-${i}`}
                        tile={t}
                        small={true}
                        isDora={true}
                        className={`!w-6 !h-9 md:!w-7 md:!h-10 transition-all duration-300 ${
                          hoveredTileType === t
                            ? "ring-2 ring-yellow-400 scale-110 shadow-lg relative z-10 !opacity-100"
                            : ""
                        }`}
                      />
                    ))}
                  </div>
                )}
                {renderMelds(0, true)}
              </div>
            )}

            {activeTenpaiInfo && (
              <div className="flex justify-center mb-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-emerald-900/80 border border-emerald-500 p-1.5 px-3 rounded-xl shadow-lg flex items-center gap-3">
                  <div className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                    聽牌預測
                  </div>
                  <div className="flex gap-1">
                    {activeTenpaiInfo.waitingTiles.map((wt, i) => (
                      <Tile
                        key={i}
                        tile={wt}
                        isDora={checkDora(wt)}
                        small={true}
                        className="!w-5 !h-7 md:!w-6 md:!h-9"
                      />
                    ))}
                  </div>
                  <div className="text-emerald-300 text-xs font-bold font-mono ml-1 border-l border-emerald-700 pl-2">
                    剩 {activeTenpaiInfo.ukeire} 張
                  </div>
                </div>
              </div>
            )}

            {state.currentWaits && state.currentWaits.length > 0 && (
              <div className="flex justify-center mb-4 relative z-30 animate-in fade-in zoom-in-95 duration-300">
                <div
                  className={`px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 backdrop-blur-md border-2 ${
                    state.isRiichi[0]
                      ? "bg-red-950/90 border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                      : "bg-slate-900/90 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                  }`}
                >
                  <div className="flex gap-1 items-center">
                    {state.currentWaits.map((tile, idx) => (
                      <div key={idx} className="relative">
                        {checkDora(tile) && (
                          <div className="absolute -inset-1 bg-yellow-400/20 blur-sm rounded-full"></div>
                        )}
                        <Tile
                          tile={tile}
                          isDora={checkDora(tile)}
                          small={true}
                          className="!w-6 !h-9 md:!w-7 md:!h-10 shadow-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="w-full overflow-x-auto scrollbar-hide -mt-2 mb-1">
              <div className="flex justify-start md:justify-center gap-1 md:gap-2 px-2 pt-12 pb-2 min-w-full w-max">
                {state.hands[0].map((t, i) => {
                  const currentCount = handTileCounts[t] || 0;
                  handTileCounts[t] = currentCount + 1;
                  const stableKey = `hand0-${t}-${currentCount}`;
                  const isSelected = state.selectedTileIndex === i;
                  const isJustDrawn =
                    i === lastDrawnIdx && state.currentTurn === 0;
                  const wScore = state.weights[i];
                  const isDefenseMode =
                    state.tacticalInfo?.stance === "defend" ||
                    state.tacticalInfo?.stance === "caution";
                  let badgeClass = "bg-slate-700 text-slate-200",
                    displayScore = "";

                  if (
                    wScore !== undefined &&
                    state.currentTurn === 0 &&
                    state.gameState !== "finished" &&
                    !state.isRiichi[0]
                  ) {
                    const minScore = Math.min(...Object.values(state.weights));
                    if (isDefenseMode) {
                      displayScore = `危 ${wScore}%`;
                      if (wScore <= 15)
                        badgeClass =
                          "bg-emerald-500 text-white font-bold ring-2 ring-emerald-300";
                      else if (wScore >= 50)
                        badgeClass = "bg-red-500 text-white font-bold";
                      else badgeClass = "bg-yellow-500 text-white font-bold";
                      if (Math.abs(wScore - minScore) < 0.05)
                        badgeClass += " scale-110 -translate-y-1";
                    } else {
                      if (wScore <= -1000) {
                        displayScore = `聽牌`;
                        if (Math.abs(wScore - minScore) < 0.05)
                          badgeClass =
                            "bg-emerald-500 text-white ring-2 ring-emerald-300 scale-110 -translate-y-1 font-bold";
                      } else if (wScore >= 1000) {
                        displayScore = `破聽`;
                        badgeClass = "bg-red-500 text-white font-bold";
                      } else {
                        displayScore = wScore.toFixed(1);
                        if (Math.abs(wScore - minScore) < 0.05)
                          badgeClass =
                            "bg-emerald-500 text-white ring-2 ring-emerald-300 scale-110 -translate-y-1 font-bold";
                      }
                    }
                  }

                  return (
                    <div key={stableKey} className="relative flex-shrink-0">
                      {wScore !== undefined &&
                        state.currentTurn === 0 &&
                        !state.actionMenu &&
                        state.gameState !== "finished" &&
                        !state.isRiichi[0] &&
                        (!isTournament || wScore <= -1000) && (
                          <div
                            className={`absolute -top-7 left-1/2 transform -translate-x-1/2 text-[9px] md:text-[10px] px-1.5 py-0.5 rounded shadow-sm z-20 font-mono whitespace-nowrap ${badgeClass}`}
                          >
                            {displayScore}
                          </div>
                        )}
                      <Tile
                        tile={t}
                        isSelected={isSelected && !state.isRiichi[0]}
                        isDora={checkDora(t)}
                        isJustDrawn={isJustDrawn}
                        onMouseEnter={() => {
                          if (
                            state.gameState === "playing" &&
                            !state.isRiichi[0]
                          )
                            setHoveredTileType(t);
                        }}
                        onMouseLeave={() => setHoveredTileType(null)}
                        onClick={() =>
                          state.currentTurn === 0 &&
                          !state.actionMenu &&
                          state.gameState !== "finished" &&
                          !state.isRiichi[0] &&
                          actions.setSelectedTileIndex(i)
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center h-10 mt-2">
              <div className="text-[10px] md:text-xs text-emerald-100 bg-black/40 p-1.5 px-3 rounded-lg max-w-[50%] leading-tight border border-white/10 shadow-inner hidden md:block">
                {state.currentTurn === 0 &&
                !state.actionMenu &&
                state.gameState !== "finished" &&
                !state.isRiichi[0]
                  ? isTournament
                    ? "⚔️ 錦標賽對戰中！請相信自己的判斷..."
                    : currentReason
                  : state.isRiichi[0]
                  ? "立直自動摸切中..."
                  : "等待進行中..."}
              </div>
              <div className="flex gap-2 ml-auto">
                {state.canRiichi &&
                  !state.isRiichi[0] &&
                  state.currentTurn === 0 &&
                  !state.actionMenu &&
                  state.gameState !== "finished" && (
                    <button
                      onClick={() =>
                        actions.setPendingRiichi(!state.pendingRiichi)
                      }
                      className={`px-4 py-1.5 md:py-2 rounded-full font-black text-sm shadow-lg transition-all flex items-center gap-1 animate-pulse ${
                        state.pendingRiichi
                          ? "bg-red-600 text-white scale-105"
                          : "bg-white text-red-600 hover:bg-red-50 border-2 border-red-600"
                      }`}
                    >
                      ⚡ {state.pendingRiichi ? "取消立直" : "立直!"}
                    </button>
                  )}
                {state.currentTurn === 0 &&
                  !state.actionMenu &&
                  state.gameState !== "finished" &&
                  !state.isRiichi[0] && (
                    <button
                      disabled={state.selectedTileIndex === null}
                      onClick={() =>
                        actions.discardTile(0, state.selectedTileIndex)
                      }
                      className={`px-6 md:px-8 py-1.5 md:py-2 text-sm rounded-full font-bold shadow-lg transition-all ${
                        state.selectedTileIndex !== null
                          ? (state.pendingRiichi
                              ? "bg-red-600 hover:bg-red-500 text-white"
                              : "bg-blue-600 hover:bg-blue-500 text-white") +
                            " transform hover:scale-105"
                          : "bg-slate-700 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {state.pendingRiichi ? "宣告並打出" : "打出"}
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isTournament &&
        state.currentTurn === 0 &&
        state.gameState === "playing" &&
        state.tacticalInfo && <TacticalAdvisor info={state.tacticalInfo} />}
    </div>
  );
};
