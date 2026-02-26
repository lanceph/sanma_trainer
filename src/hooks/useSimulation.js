import { useState, useEffect, useCallback } from "react";
import { MahjongEngine } from "../engine/MahjongEngine";

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
    if (currentDeck.length === 0) {
      setGameState("finished");
      setWinner({ type: "draw" });
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
      for (let i = 1; i <= 2; i++) {
        if (
          MahjongEngine.isAgari(
            [...newHands[i], discarded],
            openMelds[i].length
          )
        ) {
          handleWin(
            i,
            "ron",
            discarded,
            [...newHands[i], discarded],
            openMelds[i],
            kitas[i],
            latestRiichi[i],
            0,
            null,
            deck.length
          );
          return;
        }
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
