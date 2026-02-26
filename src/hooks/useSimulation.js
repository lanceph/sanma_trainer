import { useState, useEffect, useCallback, useContext } from "react";
import useSound from "use-sound"; // 🌟 引入音效套件
import { AudioContext } from "../App"; // 🌟 引入全域靜音狀態
// 🌟 引入你的音檔
import drawSound from "../assets/sounds/draw.mp3";
import discardSound from "../assets/sounds/discard.mp3";
import clickSound from "../assets/sounds/click.mp3";
import { MahjongEngine } from "../engine/MahjongEngine";
import {
  submitRoundScore,
  updateLiveState,
} from "../services/tournamentService";

export const useSimulation = () => {
  // 🌟 取得目前是否靜音
  const { isMuted } = useContext(AudioContext);
  // 🌟 註冊音效 (soundEnabled 會自動幫我們處理靜音邏輯)
  const [playDraw] = useSound(drawSound, { soundEnabled: !isMuted });
  const [playDiscard] = useSound(discardSound, { soundEnabled: !isMuted });
  const [playClick] = useSound(clickSound, { soundEnabled: !isMuted });
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
  const [currentWaits, setCurrentWaits] = useState([]); // 🌟 新增：用來記錄現在正在聽哪些牌

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
    // 🌟 修改這裡：抽出第一張寶牌與裏寶牌指示牌
    const dora = fullDeck.pop();
    const ura = fullDeck.pop();

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
    setCurrentWaits([]); // 🌟 新增：新局開始時清空聽牌
    setContext({
      pWind,
      sWind: playerSeat,
      ai1Wind: ai1Seat,
      ai2Wind: ai2Seat,
      doraInd: [dora], // 🌟 改為陣列
      uraDoraInd: [ura], // 🌟 新增裏寶牌陣列
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

    playDraw(); // 🌟 播放摸牌音效

    let d = [...currentDeck],
      h = [...currentHands],
      k = [...currentKitas],
      drawn = d.pop();
    while (playerIdx !== 0 && drawn === "4z" && d.length > 0) {
      k[playerIdx].push(drawn);
      drawn = d.pop();
    }

    // 🌟 修正 2：AI 遊戲中不理牌，確保 .length - 1 永遠是剛摸進來的牌
    if (playerIdx === 0) {
      setLastDrawnTile(drawn);
      h[playerIdx] = MahjongEngine.sortHand([...h[playerIdx], drawn]);
    } else {
      h[playerIdx] = [...h[playerIdx], drawn];
    }

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
    playDiscard(); // 🌟 播放打牌音效

    if (playerIdx === 0) setLastDrawnTile(null);

    // 🌟 1. 新增這段：在真正扣除手牌前，把「打出這張牌後的聽牌結果」存起來！
    if (playerIdx === 0) {
      if (
        tenpaiMap &&
        tenpaiMap[tileIndex] &&
        tenpaiMap[tileIndex].waitingTiles
      ) {
        setCurrentWaits(tenpaiMap[tileIndex].waitingTiles);
      } else {
        setCurrentWaits([]);
      }
    }
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
    // 找到 handleWin 裡面的 calculateScore
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
      activeCtx.doraInd, // 這個現在會是陣列
      remainDeck,
      riichiStat ? activeCtx.uraDoraInd : [] // 🌟 新增第 12 個參數：如果是立直，就把裏寶牌指示牌傳給引擎
    );

    // 🌟 將指示牌結果綁定到 scoreData 上，讓結算畫面可以畫出來
    scoreData.doraIndicators = Array.isArray(activeCtx.doraInd)
      ? activeCtx.doraInd
      : [activeCtx.doraInd];
    scoreData.uraIndicators = riichiStat ? activeCtx.uraDoraInd : [];

    // 🌟 修正 4：結算前統一幫所有人的手牌排序，讓 UI 顯示整齊
    setHands((prev) => prev.map((h) => MahjongEngine.sortHand(h)));

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

  // 🌟 新增/更新：雙響專用結算處理 (支援多張寶牌與裏寶牌)
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

    // 1. 確保目前的表寶牌指示牌是陣列
    const currentDoraInd = Array.isArray(activeCtx.doraInd)
      ? activeCtx.doraInd
      : [activeCtx.doraInd];

    // 2. 分別計算兩家 AI 的得分
    winnerIndices.forEach((idx) => {
      const isDealer =
        (idx === 1 && activeCtx.ai1Wind === "1z") ||
        (idx === 2 && activeCtx.ai2Wind === "1z");
      const sWind = idx === 1 ? activeCtx.ai1Wind : activeCtx.ai2Wind;

      // 🌟 判斷這家 AI 有沒有立直，決定要不要給他裏寶牌
      const aiRiichiStat = currentIsRiichi[idx];
      const currentUraInd = aiRiichiStat ? activeCtx.uraDoraInd || [] : [];

      // 呼叫引擎算分
      const scoreData = MahjongEngine.calculateScore(
        [...currentHands[idx], winTile],
        openMelds[idx],
        kitas[idx],
        winTile,
        false, // isTsumo = false (雙響絕對是榮和)
        aiRiichiStat, // 是否立直
        isDealer,
        pWind,
        sWind,
        currentDoraInd, // 第 10 個參數：表寶牌陣列
        deck.length, // 第 11 個參數：剩餘牌數
        currentUraInd // 第 12 個參數：裏寶牌陣列
      );

      // 🌟 將指示牌結果綁定到 scoreData，讓 UI 知道怎麼畫寶牌圖示
      scoreData.doraIndicators = currentDoraInd;
      scoreData.uraIndicators = currentUraInd;

      doubleScoreResults.push({ playerIdx: idx, scoreData });

      // 玩家被雙響，扣分是兩家打點的總和
      myScoreChange -= scoreData.total || 0;
    });

    setScoreResult({ isDouble: true, results: doubleScoreResults });

    // 3. 上傳 Firebase 錦標賽分數
    if (config.tournamentConfig?.tid) {
      const { tid, myPlayerId, currentRound } = config.tournamentConfig;
      submitRoundScore(tid, myPlayerId, currentRound, myScoreChange);
    }
  };

  const executeAction = (action) => {
    playClick(); // 🌟 播放按鈕點擊音效

    // 🌟 修正 1：只有在真正改變手牌結構(吃碰槓)時才清空聽牌。跳過或拔北不應清空。
    if (action !== "skip" && action !== "kita") {
      setCurrentWaits([]);
    }
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

      // 🌟 新增：開槓翻新寶牌與裏寶牌
      const newDora = deck.pop();
      const newUra = deck.pop();
      const newCtx = {
        ...context,
        doraInd: [
          ...(Array.isArray(context.doraInd)
            ? context.doraInd
            : [context.doraInd]),
          newDora,
        ],
        uraDoraInd: [...(context.uraDoraInd || []), newUra],
      };
      setContext(newCtx);

      setHands(newHands);
      setOpenMelds(newMelds);
      setRivers(newRivers);
      setActionMenu(null);
      setCurrentTurn(0);
      drawTile(0, deck, newHands, kitas, newRivers, newMelds, isRiichi, newCtx); // 🌟 記得最後一個參數傳入 newCtx
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

        // 🌟 新增：開槓翻新寶牌與裏寶牌
        const newDora = deck.pop();
        const newUra = deck.pop();
        const newCtx = {
          ...context,
          doraInd: [
            ...(Array.isArray(context.doraInd)
              ? context.doraInd
              : [context.doraInd]),
            newDora,
          ],
          uraDoraInd: [...(context.uraDoraInd || []), newUra],
        };
        setContext(newCtx);

        setHands(newHands);
        setOpenMelds(newMelds);
        setActionMenu(null);
        drawTile(
          0,
          deck,
          newHands,
          kitas,
          newRivers,
          newMelds,
          isRiichi,
          newCtx
        ); // 🌟 記得最後一個參數傳入 newCtx
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
            // 🌟 修正 3A：超時強制摸切，必須丟出「剛摸進來的那張牌」
            const idx = hands[0].lastIndexOf(lastDrawnTile);
            const discardIdx = idx !== -1 ? idx : hands[0].length - 1;
            discardTile(0, discardIdx);
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
    lastDrawnTile,
  ]);

  useEffect(() => {
    if (
      gameState === "playing" &&
      currentTurn === 0 &&
      isRiichi[0] &&
      !actionMenu
    ) {
      const timer = setTimeout(() => {
        // 🌟 修正 3B：立直後的自動摸切，必須精準丟出「剛摸進來的那張牌」
        const idx = hands[0].lastIndexOf(lastDrawnTile);
        const discardIdx = idx !== -1 ? idx : hands[0].length - 1;
        discardTile(0, discardIdx);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [gameState, currentTurn, isRiichi, actionMenu, hands, lastDrawnTile]);

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
      currentWaits,
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
