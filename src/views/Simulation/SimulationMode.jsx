import React, { useState, useEffect } from "react";
import { Cpu, User, Zap, Eye } from "lucide-react";
import useSound from "use-sound";
import { AudioContext } from "../../App"; // 取得靜音狀態
import tickSound from "../../assets/sounds/tick.mp3";
import Tile from "../../components/Tile";
import TacticalAdvisor from "../../components/TacticalAdvisor";
import { useSimulation } from "../../hooks/useSimulation";
import { SimSetupView } from "./SimSetupView";
import { SimFinishedView } from "./SimFinishedView";
import { SimActionMenu } from "./SimActionMenu";
import { MahjongEngine } from "../../engine/MahjongEngine";
import { TILE_LABELS, getTileName } from "../../constants/mahjong";

export const SimulationMode = ({ tournamentConfig }) => {
  const { state, actions } = useSimulation();

  // 🌟 新增：判斷目前是否在錦標賽模式中
  const isTournament =
    !!tournamentConfig || !!state.config.tournamentConfig?.tid;

  // 🌟 1. 取得全域 AudioContext，並拿出 sfxVolume
  const { setIsRiichiBgmActive, isMuted, sfxVolume } =
    React.useContext(AudioContext);
  // 🌟 把 volume 綁定為 sfxVolume
  const [playTick, { stop: stopTick }] = useSound(tickSound, {
    volume: sfxVolume,
    soundEnabled: !isMuted,
  });

  // 🌟 實作倒數警告音效
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

  // 🌟 新增：當玩家打出牌(換人)、立直、出現選單或遊戲結束時，立刻停止倒數音效
  React.useEffect(() => {
    if (
      state.currentTurn !== 0 || // 已經不是我的回合了
      state.isRiichi[0] || // 我已經立直了（會自動摸切，不該有倒數聲）
      state.actionMenu || // 畫面上跳出吃碰槓選單了
      state.gameState !== "playing" // 遊戲已經結束了
    ) {
      stopTick();
    }

    // 離開頁面時也確保聲音被關掉
    return () => stopTick();
  }, [
    state.currentTurn,
    state.isRiichi,
    state.actionMenu,
    state.gameState,
    stopTick,
  ]);

  // 🌟 修正版：監控立直狀態，切換專屬 BGM (不包含 unmount 清理)
  React.useEffect(() => {
    if (setIsRiichiBgmActive) {
      // 只要三家裡面有任何一家立直了
      const hasAnyRiichi = state.isRiichi.some((r) => r);
      // 且目前局數還在進行中 (如果有人和牌或流局，gameState 會變成 "finished")
      const isStillPlaying = state.gameState === "playing";

      setIsRiichiBgmActive(hasAnyRiichi && isStillPlaying);
    }
  }, [state.isRiichi, state.gameState, setIsRiichiBgmActive]);

  // 🌟 獨立的清理 Effect：只有在「真正離開對局模擬頁面」時才觸發關閉
  React.useEffect(() => {
    return () => {
      if (setIsRiichiBgmActive) setIsRiichiBgmActive(false);
    };
  }, [setIsRiichiBgmActive]);

  // 🌟 新增：自動同步錦標賽設定，並自動開始遊戲
  useEffect(() => {
    // 只有在初始設定畫面 (setup) 且有錦標賽參數時才執行
    if (tournamentConfig && state.gameState === "setup") {
      // 1. 如果設定裡的 Seed 跟錦標賽目前的 Seed 不一樣，先更新設定
      if (state.config.seed !== tournamentConfig.seed) {
        actions.setConfig((prev) => ({
          ...prev,
          seed: tournamentConfig.seed,
          tournamentConfig: tournamentConfig,
          timeLimit: 15, // 強制鎖定思考時間 15 秒
        }));
      }
      // 2. 確定 Seed 已經更新進 config 後，立刻自動開始遊戲！
      else if (state.config.seed === tournamentConfig.seed) {
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
    return state.openMelds[idx].map((m, i) => (
      <div key={i} className="flex gap-0.5 bg-black/20 p-1 rounded items-end">
        <Tile
          tile={m.tile}
          small={true}
          isDora={checkDora(m.tile)}
          className={tileClass}
        />
        <Tile
          tile={m.tile}
          small={true}
          isDora={checkDora(m.tile)}
          className={tileClass}
        />
        <Tile
          tile={m.tile}
          small={true}
          isDora={checkDora(m.tile)}
          className={tileClass}
        />
        {(m.type === "kan" || m.type === "ankan") && (
          <Tile
            tile={m.tile}
            small={true}
            isDora={checkDora(m.tile)}
            faceDown={m.type === "ankan"}
            className={tileClass}
          />
        )}
      </div>
    ));
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

  return (
    <div className="space-y-4">
      {/* 🌟 修改：簡化頂部資訊列，並支援顯示多張寶牌指示牌 */}
      <div className="bg-slate-800 text-white p-3 md:p-4 rounded-xl shadow-lg flex justify-between items-center gap-4">
        <div className="flex gap-4 items-center">
          <div className="bg-slate-700 px-3 py-1 rounded-lg text-sm font-bold border border-slate-600">
            {TILE_LABELS[state.context.pWind]}風場 /{" "}
            {TILE_LABELS[state.context.sWind]}家
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">寶牌指示</span>
            <div className="flex gap-1">
              {(Array.isArray(state.context.doraInd)
                ? state.context.doraInd
                : [state.context.doraInd]
              ).map((d, i) => (
                <Tile
                  key={i}
                  tile={d}
                  small={true}
                  className="!w-6 !h-9 !border-b-2"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {state.gameState === "finished" && (
        <SimFinishedView state={state} actions={actions} />
      )}

      <div className="bg-emerald-800 p-4 rounded-xl shadow-inner relative min-h-[500px] flex flex-col justify-between overflow-hidden">
        {/* Opponents Area */}
        <div className="w-full overflow-x-auto scrollbar-hide">
          <div className="flex justify-between items-start min-w-[550px] md:min-w-full pb-2">
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
                      className="!w-5 !h-8 md:!w-6 md:!h-9"
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
                    className="!w-5 !h-8 md:!w-6 md:!h-9 !border-b-2"
                  />
                ))}
              </div>
              <div className="grid grid-cols-6 gap-0.5 md:gap-1 mt-2 w-max">
                {state.rivers[2].map((t, i) => (
                  <Tile
                    key={`r2-${i}`}
                    tile={t}
                    small={true}
                    isRiver={true}
                    isDora={checkDora(t)}
                    className="!w-6 !h-9 md:!w-7 md:!h-10 !border-b-2 opacity-80"
                  />
                ))}
              </div>
            </div>
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
                      className="!w-5 !h-8 md:!w-6 md:!h-9"
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
                    className="!w-5 !h-8 md:!w-6 md:!h-9 !border-b-2"
                  />
                ))}
              </div>
              <div
                className="grid grid-cols-6 gap-0.5 md:gap-1 mt-2 w-max"
                dir="ltr"
              >
                {state.rivers[1].map((t, i) => (
                  <Tile
                    key={`r1-${i}`}
                    tile={t}
                    small={true}
                    isRiver={true}
                    isDora={checkDora(t)}
                    className="!w-6 !h-9 md:!w-7 md:!h-10 !border-b-2 opacity-80"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {state.gameState === "playing" && state.actionMenu && (
          <SimActionMenu state={state} actions={actions} />
        )}

        {/* Player Area */}
        <div className="flex justify-center mt-8 mb-4">
          <div className="grid grid-cols-6 gap-0.5 md:gap-1 w-max">
            {state.rivers[0].map((t, i) => (
              <Tile
                key={`r0-${i}`}
                tile={t}
                small={true}
                isRiver={true}
                isDora={checkDora(t)}
                className="!w-7 !h-10 md:!w-8 !h-11 opacity-90"
              />
            ))}
          </div>
        </div>

        <div
          className={`relative p-4 pt-10 rounded-xl border-t-4 mt-2 ${
            state.currentTurn === 0 && state.gameState !== "finished"
              ? "bg-white/10 border-yellow-400 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]"
              : "border-transparent"
          }`}
        >
          <div className="absolute -top-5 left-4 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-md flex items-center gap-1 z-30">
            <User size={14} /> 自家手牌{" "}
            {state.currentTurn === 0 &&
              !state.actionMenu &&
              state.gameState !== "finished" && (
                <span className="text-yellow-400 ml-1 animate-pulse">
                  您的回合
                </span>
              )}{" "}
            {state.isRiichi[0] && (
              <span className="bg-red-600 text-white ml-2 px-2 py-0.5 rounded-full shadow-sm">
                立直中
              </span>
            )}
          </div>

          {/* 🌟 新增：置右的牌山數量與倒數計時 */}
          <div className="absolute -top-5 right-4 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-md flex items-center gap-3 z-30 border border-slate-700">
            <div className="text-slate-300">
              剩餘{" "}
              <span className="text-emerald-400 font-black text-sm">
                {state.deck.length}
              </span>{" "}
              張
            </div>
            {state.currentTurn === 0 &&
              state.config.timeLimit > 0 &&
              !state.actionMenu &&
              !state.isRiichi[0] &&
              state.gameState !== "finished" && (
                <div
                  className={`flex items-center gap-1 font-mono font-black ${
                    state.timeLeft <= 5
                      ? "text-red-400 animate-pulse"
                      : "text-yellow-400"
                  }`}
                >
                  ⏱ {state.timeLeft}s
                </div>
              )}
          </div>

          {(state.openMelds[0].length > 0 || state.kitas[0].length > 0) && (
            <div className="flex justify-end gap-2 mb-6 pr-2">
              {state.kitas[0].length > 0 && (
                <div className="flex gap-0.5 mr-2 self-end border-r border-white/20 pr-3">
                  {state.kitas[0].map((t, i) => (
                    <Tile
                      key={`k0-${i}`}
                      tile={t}
                      small={true}
                      isDora={true}
                      className="!w-6 !h-9 md:!w-7 md:!h-10"
                    />
                  ))}
                </div>
              )}
              {renderMelds(0, true)}
            </div>
          )}
          {/* 🌟 加上 !isTournament，錦標賽不顯示進張預測 */}
          {activeTenpaiInfo && (
            <div className="flex justify-center mb-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-emerald-900/80 border border-emerald-500 p-2 px-4 rounded-xl shadow-lg flex items-center gap-3">
                <div className="bg-emerald-500 text-white text-xs font-black px-2 py-1 rounded">
                  聽牌預測
                </div>
                <div className="flex gap-1">
                  {activeTenpaiInfo.waitingTiles.map((wt, i) => (
                    <Tile
                      key={i}
                      tile={wt}
                      isDora={checkDora(wt)}
                      small={true}
                      className="!w-6 !h-9"
                    />
                  ))}
                </div>
                <div className="text-emerald-300 text-sm font-bold font-mono ml-2 border-l border-emerald-700 pl-3">
                  剩餘 {activeTenpaiInfo.ukeire} 張
                </div>
              </div>
            </div>
          )}

          {/* 🌟 新增：聽牌/立直常駐提示區 */}
          {state.currentWaits && state.currentWaits.length > 0 && (
            <div className="flex justify-center mb-8 relative z-30 animate-in fade-in zoom-in-95 duration-300">
              <div
                className={`px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 backdrop-blur-md border-2 ${
                  state.isRiichi[0]
                    ? "bg-red-950/90 border-red-500/60 shadow-[0_0_25px_rgba(239,68,68,0.3)]"
                    : "bg-slate-900/90 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.2)]"
                }`}
              >
                {/* 左側狀態文字 */}
                <div
                  className={`text-sm font-black flex items-center gap-1.5 ${
                    state.isRiichi[0] ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {state.isRiichi[0] ? (
                    <>
                      <Zap size={18} className="fill-red-400 animate-pulse" />{" "}
                      立直聽牌
                    </>
                  ) : (
                    <>
                      <Eye size={18} /> 默聽中
                    </>
                  )}
                </div>

                <div className="w-px h-8 bg-slate-600/50"></div>

                {/* 右側聽牌麻將圖示 (直接使用 Tile 元件) */}
                <div className="flex gap-1.5 items-center">
                  {state.currentWaits.map((tile, idx) => (
                    <div key={idx} className="relative">
                      {/* 如果聽的牌是寶牌，上面可以多一個小光暈 */}
                      {checkDora(tile) && (
                        <div className="absolute -inset-1 bg-yellow-400/20 blur-sm rounded-full"></div>
                      )}
                      <Tile
                        tile={tile}
                        isDora={checkDora(tile)}
                        small={true}
                        className="!w-7 !h-10 md:!w-8 md:!h-11 shadow-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 外層滾動容器：用負 margin (-mt-6) 抵銷掉上移的空間 */}
          <div className="w-full overflow-x-auto scrollbar-hide -mt-6 mb-2">
            {/* 重點修復：
                1. pt-12 與 pb-6：把空間留在「可滑動容器」的內部，讓上方標籤與牌浮起時有足夠空間，不會被切頭。
                2. justify-start md:justify-center：手機版(空間不足)靠左排，保證滑動正常；電腦版(空間充足)維持置中。
                3. min-w-full w-max：保證寬度至少滿版（才能置中），且能根據內容無限撐大（才能滑動）。
              */}
            <div className="flex justify-start md:justify-center gap-1 md:gap-2 px-4 pt-12 pb-6 min-w-full w-max">
              {state.hands[0].map((t, i) => {
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
                  <div key={`p-${t}-${i}`} className="relative mt-2">
                    {/* 🌟 錦標賽中僅允許顯示「聽牌」與「破聽」標籤，隱藏防守危險度以防作弊 */}
                    {wScore !== undefined &&
                      state.currentTurn === 0 &&
                      !state.actionMenu &&
                      state.gameState !== "finished" &&
                      !state.isRiichi[0] &&
                      (!isTournament || wScore <= -1000) && (
                        <div
                          className={`absolute -top-7 left-1/2 transform -translate-x-1/2 text-[10px] md:text-xs px-1.5 py-0.5 rounded shadow-sm z-20 font-mono whitespace-nowrap ${badgeClass}`}
                        >
                          {displayScore}
                        </div>
                      )}
                    <Tile
                      tile={t}
                      isSelected={isSelected && !state.isRiichi[0]}
                      isDora={checkDora(t)}
                      isJustDrawn={isJustDrawn}
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

          <div className="flex justify-between items-center h-12 mt-6">
            <div className="text-xs text-emerald-100 bg-black/40 p-2 px-3 rounded-lg max-w-[50%] leading-tight border border-white/10 shadow-inner hidden md:block">
              {state.currentTurn === 0 &&
              !state.actionMenu &&
              state.gameState !== "finished" &&
              !state.isRiichi[0]
                ? isTournament
                  ? "⚔️ 錦標賽對戰中！請相信自己的判斷..."
                  : currentReason // 🌟 如果是錦標賽，顯示對戰台詞
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
                    className={`px-5 py-2 rounded-full font-black shadow-lg transition-all flex items-center gap-1 animate-pulse ${
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
                    className={`px-8 py-2 rounded-full font-bold shadow-lg transition-all ${
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

      {/* 戰術雷達移至牌桌下方，避免畫面跳動影響出牌 */}
      {/* 🌟 加上 !isTournament，錦標賽不顯示上帝視角的戰術雷達 */}
      {!isTournament &&
        state.currentTurn === 0 &&
        state.gameState === "playing" &&
        state.tacticalInfo && <TacticalAdvisor info={state.tacticalInfo} />}
    </div>
  );
};
