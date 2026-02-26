import { useState, useEffect, useCallback } from "react";
import { MahjongEngine } from "../engine/MahjongEngine";
import {
  submitRoundScore,
  updateLiveState,
} from "../services/tournamentService";

export const useSimulation = () => {
  const [config, setConfig] = useState({
    aiDiff: 3,
    timeLimit: 0,
    pWind: "1z",
    playerWind: "1z",
    seed: "",
  });
  const [gameState, setGameState] = useState("setup");
  const [deck, setDeck] = useState([]);
  const [hands, setHands] = useState([[], [], []]);
  const [openMelds, setOpenMelds] = useState([[], [], []]);
  const [kitas, setKitas] = useState([[], [], []]);
  const [rivers, setRivers] = useState([[], [], []]);
  const [context, setContext] = useState({
    pWind: "1z",
    sWind: "1z",
    doraInd: "1p",
  });
  const [currentTurn, setCurrentTurn] = useState(0);
  const [winner, setWinner] = useState(null);
  const [scoreResult, setScoreResult] = useState(null);
  const [selectedTileIndex, setSelectedTileIndex] = useState(null);
  const [weights, setWeights] = useState({});
  const [tenpaiMap, setTenpaiMap] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [actionMenu, setActionMenu] = useState(null);
  const [isRiichi, setIsRiichi] = useState([false, false, false]);
  const [canRiichi, setCanRiichi] = useState(false);
  const [pendingRiichi, setPendingRiichi] = useState(false);
  const [tacticalInfo, setTacticalInfo] = useState(null);
  const [lastDrawnTile, setLastDrawnTile] = useState(null);

  const startGame = useCallback(() => {
    // 這裡傳入 config.seed
    const fullDeck = MahjongEngine.generateRandomDeck(config.seed);
    const pWind = config.pWind;
    const playerSeat = config.playerWind;
    const ai1Seat =
      playerSeat === "1z" ? "2z" : playerSeat === "2z" ? "3z" : "1z";
    const ai2Seat =
      playerSeat === "1z" ? "3z" : playerSeat === "2z" ? "1z" : "2z";
    const h0 = MahjongEngine.sortHand(fullDeck.splice(0, 13));
    const h1 = MahjongEngine.sortHand(fullDeck.splice(0, 13));
    const h2 = MahjongEngine.sortHand(fullDeck.splice(0, 13));
    const dora = fullDeck.pop();

    setDeck(fullDeck);
    setHands([h0, h1, h2]);
    setOpenMelds([[], [], []]);
    setKitas([[], [], []]);
    setRivers([[], [], []]);
    setIsRiichi([false, false, false]);
    setCanRiichi(false);
    setPendingRiichi(false);
    setTacticalInfo(null);
    setLastDrawnTile(null);
    setContext({
      pWind,
      sWind: playerSeat,
      ai1Wind: ai1Seat,
      ai2Wind: ai2Seat,
      doraInd: dora,
    });
    setCurrentTurn(0);
    setWinner(null);
    setScoreResult(null);
    setActionMenu(null);
    setGameState("playing");

    drawTile(
      0,
      fullDeck,
      [h0, h1, h2],
      [[], [], []],
      [[], [], []],
      [[], [], []],
      [false, false, false],
      {
        pWind,
        sWind: playerSeat,
        ai1Wind: ai1Seat,
        ai2Wind: ai2Seat,
        doraInd: dora,
      }
    );
  }, [config]);

  const checkSelfActions = (hand, openMeld, playerIsRiichi) => {
    const counts = {};
    hand.forEach((t) => (counts[t] = (counts[t] || 0) + 1));
    const canKita = counts["4z"] > 0;
    const canAnkan =
      !playerIsRiichi && Object.keys(counts).some((t) => counts[t] === 4);
    const canKakan =
      !playerIsRiichi &&
      openMeld.some((m) => m.type === "pon" && counts[m.tile] > 0);
    return { canKita, canAnkan, canKakan };
  };

  const drawTile = (
    playerIdx,
    currentDeck,
    currentHands,
    currentKitas,
    currentRivers,
    currentOpenMelds,
    currentIsRiichi,
    ctxOverride = null
  ) => {
    // ==========================================
    // 🌟 Phase 7: 處理流局 (Draw) 與 罰符結算
    // ==========================================
    if (currentDeck.length === 0) {
      setGameState("finished");

      // 1. 利用引擎分析三家的聽牌狀態
      const tenpaiStatus = [false, false, false];
      for (let i = 0; i < 3; i++) {
        // 如果已經立直，必定是聽牌狀態；如果沒立直，讓引擎偷偷算一下
        if (currentIsRiichi[i]) {
          tenpaiStatus[i] = true;
        } else {
          const mockCtx = {
            rivers: currentRivers,
            openMelds: currentOpenMelds,
            kitas: currentKitas,
            openMeldCount: currentOpenMelds[i].length,
          };
          const analysis = MahjongEngine.analyzeDiscard(
            currentHands[i],
            null,
            mockCtx,
            "attack",
            [],
            currentOpenMelds[i].length
          );
          tenpaiStatus[i] = analysis.isTenpai;
        }
      }

      // 2. 計算三麻流局罰符 (總池 2000 點)
      const tenpaiCount = tenpaiStatus.filter((t) => t).length;
      let bappuScore = 0; // 玩家 (0號位) 的罰符得失分

      if (tenpaiCount === 1 || tenpaiCount === 2) {
        if (tenpaiStatus[0]) {
          // 玩家【有】聽牌：
          // 若 1 人聽牌，拿 2000 (另外兩家各扣 1000)
          // 若 2 人聽牌，拿 1000 (沒聽的扣 2000)
          bappuScore = tenpaiCount === 1 ? 2000 : 1000;
        } else {
          // 玩家【沒】聽牌：
          // 若 1 人聽牌，扣 1000 給他
          // 若 2 人聽牌，扣 2000 (各給 1000)
          bappuScore = tenpaiCount === 1 ? -1000 : -2000;
        }
      }

      // 將結果存入 winner state (未來可以讓 UI 顯示「流局聽牌/未聽牌」)
      setWinner({ type: "draw", bappuScore, tenpaiStatus });

      // 3. 上傳錦標賽流局分數
      if (config.tournamentConfig?.tid) {
        const { tid, myPlayerId, currentRound } = config.tournamentConfig;
        submitRoundScore(tid, myPlayerId, currentRound, bappuScore);
      }
      return;
    }
    let d = [...currentDeck],
      h = [...currentHands],
      k = [...currentKitas],
      drawn = d.pop();
    while (playerIdx !== 0 && drawn === "4z" && d.length > 0) {
      k[playerIdx].push(drawn);
      drawn = d.pop();
    }

    if (playerIdx === 0) setLastDrawnTile(drawn);
    h[playerIdx] = MahjongEngine.sortHand([...h[playerIdx], drawn]);

    if (
      MahjongEngine.isAgari(h[playerIdx], currentOpenMelds[playerIdx].length)
    ) {
      setDeck(d);
      setHands(h);
      setKitas(k);
      handleWin(
        playerIdx,
        "tsumo",
        drawn,
        h[playerIdx],
        currentOpenMelds[playerIdx],
        k[playerIdx],
        currentIsRiichi[playerIdx],
        null,
        ctxOverride,
        d.length
      );
      return;
    }

    setDeck(d);
    setHands(h);
    setKitas(k);
    if (playerIdx === 0) {
      const activeCtx = ctxOverride || context;
      const fullCtx = {
        ...activeCtx,
        rivers: currentRivers,
        openMelds: currentOpenMelds,
        kitas: currentKitas,
        openMeldCount: currentOpenMelds[0].length,
      };
      const aiStates = [
        {
          isRiichi: currentIsRiichi[1],
          melds: currentOpenMelds[1],
          kitas: currentKitas[1],
          river: currentRivers[1],
        },
        {
          isRiichi: currentIsRiichi[2],
          melds: currentOpenMelds[2],
          kitas: currentKitas[2],
          river: currentRivers[2],
        },
      ];
      const tacInfo = MahjongEngine.evaluateTacticalStance(
        h[0],
        currentOpenMelds[0],
        currentKitas[0],
        aiStates,
        fullCtx
      );
      setTacticalInfo(tacInfo);

      const threatRivers = [];
      if (tacInfo.stance === "defend" || tacInfo.stance === "caution") {
        if (aiStates[0].isRiichi || aiStates[0].melds.length >= 2)
          threatRivers.push(aiStates[0].river);
        if (aiStates[1].isRiichi || aiStates[1].melds.length >= 2)
          threatRivers.push(aiStates[1].river);
        if (threatRivers.length === 0) {
          threatRivers.push(aiStates[0].river);
          threatRivers.push(aiStates[1].river);
        }
      }
      updatePlayerWeights(
        h[0],
        fullCtx,
        currentOpenMelds,
        currentIsRiichi,
        tacInfo.stance,
        threatRivers
      );

      if (config.timeLimit > 0) setTimeLeft(config.timeLimit);

      const selfActs = checkSelfActions(
        h[0],
        currentOpenMelds[0],
        currentIsRiichi[0]
      );
      if (selfActs.canKita || selfActs.canAnkan || selfActs.canKakan)
        setActionMenu({ type: "self_action", ...selfActs });
    }
  };

  const proceedToNextTurn = (currentPlayerIdx, d, h, r, om, k, currRiichi) => {
    const nextTurn = (currentPlayerIdx + 1) % 3;
    setCurrentTurn(nextTurn);
    drawTile(nextTurn, d, h, k, r, om, currRiichi);
  };

  const discardTile = (playerIdx, tileIndex) => {
    if (playerIdx === 0) setLastDrawnTile(null);
    if (playerIdx === 0 && pendingRiichi) {
      setIsRiichi((prev) => {
        const n = [...prev];
        n[0] = true;
        return n;
      });
      setPendingRiichi(false);
      setCanRiichi(false);
    }

    const newHands = [...hands],
      newRivers = [...rivers];
    const discarded = newHands[playerIdx].splice(tileIndex, 1)[0];
    newHands[playerIdx] = MahjongEngine.sortHand(newHands[playerIdx]);
    newRivers[playerIdx] = [...newRivers[playerIdx], discarded];
    setHands(newHands);
    setRivers(newRivers);
    setSelectedTileIndex(null);

    const latestRiichi =
      playerIdx === 0 && pendingRiichi
        ? [true, isRiichi[1], isRiichi[2]]
        : isRiichi;

    if (playerIdx !== 0) {
      const canRon = MahjongEngine.isAgari(
        [...newHands[0], discarded],
        openMelds[0].length
      );
      const countInHand = newHands[0].filter((t) => t === discarded).length;
      const canPon = !latestRiichi[0] && countInHand >= 2;
      const canKan = !latestRiichi[0] && countInHand === 3;
      if (canRon || canPon || canKan) {
        setActionMenu({
          type: "discard_reaction",
          sourceIdx: playerIdx,
          tile: discarded,
          canRon,
          canPon,
          canKan,
          latestRiichi,
        });
        return;
      }
    } else {
      // 🌟 Phase 7: 一砲雙響支援 (收集所有能和牌的 AI)
      const ronPlayers = [];
      for (let i = 1; i <= 2; i++) {
        if (
          MahjongEngine.isAgari(
            [...newHands[i], discarded],
            openMelds[i].length
          )
        ) {
          ronPlayers.push(i);
        }
      }

      if (ronPlayers.length === 1) {
        handleWin(
          ronPlayers[0],
          "ron",
          discarded,
          [...newHands[ronPlayers[0]], discarded],
          openMelds[ronPlayers[0]],
          kitas[ronPlayers[0]],
          latestRiichi[ronPlayers[0]],
          0,
          null,
          deck.length
        );
        return;
      } else if (ronPlayers.length === 2) {
        // 如果有兩家同時和牌，呼叫專屬的雙響處理函式
        handleDoubleWin(ronPlayers, discarded, 0, latestRiichi, newHands);
        return;
      }
    }
    proceedToNextTurn(
      playerIdx,
      deck,
      newHands,
      newRivers,
      openMelds,
      kitas,
      latestRiichi
    );
  };

  const handleWin = (
    playerIdx,
    type,
    winTile,
    hand,
    melds,
    playerKitas,
    riichiStat,
    fromIdx = null,
    ctxOverride = null,
    remainDeck = 10
  ) => {
    setActionMenu(null);
    setGameState("finished");
    setWinner({ playerIdx, type, from: fromIdx });
    const activeCtx = ctxOverride || context;
    const isDealer =
      (playerIdx === 0 && activeCtx.sWind === "1z") ||
      (playerIdx === 1 && activeCtx.ai1Wind === "1z") ||
      (playerIdx === 2 && activeCtx.ai2Wind === "1z");
    const pWind = activeCtx.pWind;
    const sWind =
      playerIdx === 0
        ? activeCtx.sWind
        : playerIdx === 1
        ? activeCtx.ai1Wind
        : activeCtx.ai2Wind;
    const scoreData = MahjongEngine.calculateScore(
      hand,
      melds,
      playerKitas,
      winTile,
      type === "tsumo",
      riichiStat,
      isDealer,
      pWind,
      sWind,
      activeCtx.doraInd,
      remainDeck
    );
    setScoreResult(scoreData);

    // ★ 新增：錦標賽和牌/放銃上傳分數
    if (config.tournamentConfig?.tid) {
      const { tid, myPlayerId, currentRound } = config.tournamentConfig;
      let myScoreChange = 0;

      if (playerIdx === 0) {
        // 情況 A：玩家自己和牌 (加分)
        myScoreChange = scoreData.total || 0;
      } else if (fromIdx === 0) {
        // 情況 B：玩家放銃給 AI (扣分)
        myScoreChange = -(scoreData.total || 0);
      } else if (type === "tsumo") {
        // 情況 C：AI 自摸，玩家被扣點 (扣除非莊家或莊家的支付額)
        // 這裡依照你的 calculateScore 回傳結構來決定，暫時用扣除 dealerPay/nonDealerPay 代表
        myScoreChange = -(
          scoreData.dealerPay ||
          scoreData.nonDealerPay ||
          Math.floor(scoreData.total / 2) ||
          0
        );
      }

      submitRoundScore(tid, myPlayerId, currentRound, myScoreChange);
    }
  };

  // 🌟 新增：雙響專用結算處理
  const handleDoubleWin = (
    winnerIndices,
    winTile,
    fromIdx,
    currentIsRiichi,
    currentHands
  ) => {
    setActionMenu(null);
    setGameState("finished");
    setWinner({ type: "double_ron", winners: winnerIndices, from: fromIdx });

    const activeCtx = context;
    const pWind = activeCtx.pWind;
    let myScoreChange = 0;
    const doubleScoreResults = [];

    // 分別計算兩家 AI 的得分
    winnerIndices.forEach((idx) => {
      const isDealer =
        (idx === 1 && activeCtx.ai1Wind === "1z") ||
        (idx === 2 && activeCtx.ai2Wind === "1z");
      const sWind = idx === 1 ? activeCtx.ai1Wind : activeCtx.ai2Wind;

      const scoreData = MahjongEngine.calculateScore(
        [...currentHands[idx], winTile],
        openMelds[idx],
        kitas[idx],
        winTile,
        false,
        currentIsRiichi[idx],
        isDealer,
        pWind,
        sWind,
        activeCtx.doraInd,
        deck.length
      );

      doubleScoreResults.push({ playerIdx: idx, scoreData });
      myScoreChange -= scoreData.total || 0; // 將兩家的打點相加，就是玩家要扣的總分
    });

    setScoreResult({ isDouble: true, results: doubleScoreResults });

    // 上傳 Firebase (扣除雙倍分數)
    if (config.tournamentConfig?.tid) {
      const { tid, myPlayerId, currentRound } = config.tournamentConfig;
      submitRoundScore(tid, myPlayerId, currentRound, myScoreChange);
    }
  };

  const executeAction = (action) => {
    const newHands = [...hands],
      newMelds = [...openMelds],
      newKitas = [...kitas],
      newRivers = [...rivers];
    if (action === "ron") {
      handleWin(
        0,
        "ron",
        actionMenu.tile,
        [...newHands[0], actionMenu.tile],
        newMelds[0],
        newKitas[0],
        isRiichi[0],
        actionMenu.sourceIdx,
        null,
        deck.length
      );
      return;
    }
    if (action === "pon") {
      const t = actionMenu.tile;
      newHands[0].splice(newHands[0].indexOf(t), 1);
      newHands[0].splice(newHands[0].indexOf(t), 1);
      newMelds[0] = [
        ...newMelds[0],
        { type: "pon", tile: t, source: actionMenu.sourceIdx },
      ];
      newRivers[actionMenu.sourceIdx].pop();
      setHands(newHands);
      setOpenMelds(newMelds);
      setRivers(newRivers);
      setActionMenu(null);
      setCurrentTurn(0);
      updatePlayerWeights(
        newHands[0],
        {
          ...context,
          rivers: newRivers,
          openMelds: newMelds,
          kitas: newKitas,
          openMeldCount: newMelds[0].length,
        },
        newMelds,
        isRiichi,
        tacticalInfo?.stance || "attack",
        []
      );
      return;
    }
    if (action === "kan_minkan") {
      const t = actionMenu.tile;
      newHands[0] = newHands[0].filter((tile) => tile !== t);
      newMelds[0] = [
        ...newMelds[0],
        { type: "kan", tile: t, source: actionMenu.sourceIdx },
      ];
      newRivers[actionMenu.sourceIdx].pop();
      setHands(newHands);
      setOpenMelds(newMelds);
      setRivers(newRivers);
      setActionMenu(null);
      setCurrentTurn(0);
      drawTile(0, deck, newHands, kitas, newRivers, newMelds, isRiichi);
      return;
    }
    if (action === "ankan") {
      const counts = {};
      newHands[0].forEach((t) => (counts[t] = (counts[t] || 0) + 1));
      let kanTile = Object.keys(counts).find((t) => counts[t] === 4);
      let isKakan = false;
      if (!kanTile) {
        kanTile = newMelds[0].find(
          (m) => m.type === "pon" && counts[m.tile] > 0
        )?.tile;
        isKakan = true;
      }
      if (kanTile) {
        if (isKakan) {
          newHands[0].splice(newHands[0].indexOf(kanTile), 1);
          newMelds[0][
            newMelds[0].findIndex((m) => m.type === "pon" && m.tile === kanTile)
          ].type = "kan";
        } else {
          newHands[0] = newHands[0].filter((t) => t !== kanTile);
          newMelds[0].push({ type: "ankan", tile: kanTile });
        }
        setHands(newHands);
        setOpenMelds(newMelds);
        setActionMenu(null);
        drawTile(0, deck, newHands, kitas, rivers, newMelds, isRiichi);
        return;
      }
    }
    if (action === "kita") {
      newHands[0].splice(newHands[0].indexOf("4z"), 1);
      newKitas[0] = [...newKitas[0], "4z"];
      setHands(newHands);
      setKitas(newKitas);
      setActionMenu(null);
      drawTile(0, deck, newHands, newKitas, rivers, openMelds, isRiichi);
      return;
    }
    if (action === "skip") {
      const currRiichi = actionMenu.latestRiichi || isRiichi;
      setActionMenu(null);
      if (actionMenu.type === "discard_reaction")
        proceedToNextTurn(
          actionMenu.sourceIdx,
          deck,
          hands,
          rivers,
          openMelds,
          kitas,
          currRiichi
        );
      return;
    }
  };

  const updatePlayerWeights = (
    hand,
    fullCtx,
    currentOpenMelds,
    currentIsRiichi,
    stance,
    threatRivers
  ) => {
    const analysis = MahjongEngine.analyzeDiscard(
      hand,
      null,
      fullCtx,
      stance,
      threatRivers,
      currentOpenMelds[0].length
    );
    setWeights(analysis.allScores);
    setTenpaiMap(analysis.tenpaiData || {});
    if (analysis.isTenpai) {
      if (currentOpenMelds[0].length === 0 && !currentIsRiichi[0])
        setCanRiichi(true);
    } else {
      setCanRiichi(false);
    }
  };

  useEffect(() => {
    if (
      gameState === "playing" &&
      currentTurn === 0 &&
      config.timeLimit > 0 &&
      !actionMenu &&
      !isRiichi[0]
    ) {
      const timerId = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerId);
            // ★ 超時懲罰：強制自動摸切 (Tsumogiri)
            // 打出陣列的最後一張牌 (通常是剛摸進來的那張)
            const lastTileIndex = hands[0].length - 1;
            discardTile(0, lastTileIndex);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [
    gameState,
    currentTurn,
    config.timeLimit,
    hands,
    context,
    actionMenu,
    rivers,
    openMelds,
    kitas,
    isRiichi,
    weights,
  ]);

  useEffect(() => {
    if (
      gameState === "playing" &&
      currentTurn === 0 &&
      isRiichi[0] &&
      !actionMenu
    ) {
      const timer = setTimeout(() => discardTile(0, hands[0].length - 1), 800);
      return () => clearTimeout(timer);
    }
  }, [gameState, currentTurn, isRiichi, actionMenu, hands]);

  useEffect(() => {
    if (gameState === "playing" && currentTurn !== 0 && !actionMenu) {
      const timer = setTimeout(() => {
        const aiHand = hands[currentTurn];
        const fullCtx = {
          ...context,
          rivers,
          openMelds,
          kitas,
          openMeldCount: openMelds[currentTurn].length,
        };
        let discardIdx = 0;

        if (isRiichi[currentTurn]) discardIdx = aiHand.length - 1;
        else {
          if (config.aiDiff === 1)
            discardIdx = Math.floor(Math.random() * aiHand.length);
          else {
            const isThreatened =
              isRiichi[(currentTurn + 1) % 3] ||
              isRiichi[(currentTurn + 2) % 3];
            const aiStance = isThreatened ? "defend" : "attack";
            const aiThreats = isThreatened
              ? [rivers[(currentTurn + 1) % 3], rivers[(currentTurn + 2) % 3]]
              : [];
            const analysis = MahjongEngine.analyzeDiscard(
              aiHand,
              0,
              fullCtx,
              aiStance,
              aiThreats,
              openMelds[currentTurn].length
            );

            if (config.aiDiff === 2)
              discardIdx =
                Math.random() > 0.3
                  ? analysis.bestDiscards[0]
                  : Math.floor(Math.random() * aiHand.length);
            else {
              discardIdx = analysis.bestDiscards[0];
              if (
                openMelds[currentTurn].length === 0 &&
                analysis.isTenpai &&
                Math.random() > 0.1
              )
                setIsRiichi((prev) => {
                  const n = [...prev];
                  n[currentTurn] = true;
                  return n;
                });
            }
          }
        }
        discardTile(currentTurn, discardIdx);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [
    gameState,
    currentTurn,
    hands,
    config,
    context,
    actionMenu,
    rivers,
    openMelds,
    kitas,
    isRiichi,
  ]);

  return {
    state: {
      config,
      gameState,
      deck,
      hands,
      openMelds,
      kitas,
      rivers,
      context,
      currentTurn,
      winner,
      scoreResult,
      selectedTileIndex,
      weights,
      tenpaiMap,
      timeLeft,
      actionMenu,
      isRiichi,
      canRiichi,
      pendingRiichi,
      tacticalInfo,
      lastDrawnTile,
    },
    actions: {
      setConfig,
      startGame,
      setSelectedTileIndex,
      setPendingRiichi,
      discardTile,
      executeAction,
      setGameState,
    },
  };
};
