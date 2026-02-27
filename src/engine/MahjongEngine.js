import { SANMA_TILE_SET, TILE_LABELS } from "../constants/mahjong";
import { mulberry32 } from "../utils/rng"; // 記得在檔案最上方引入

export const MahjongEngine = {
  sortHand: (hand) => {
    if (!hand || !Array.isArray(hand)) return [];
    const suitOrder = { m: 0, p: 1, s: 2, z: 3 };
    const getVal = (t) => {
      let v = parseInt(t[0]);
      return v === 0 ? 5.5 : v;
    };
    return [...hand].sort((a, b) => {
      const suitA = a.slice(-1);
      const suitB = b.slice(-1);
      if (suitOrder[suitA] !== suitOrder[suitB])
        return suitOrder[suitA] - suitOrder[suitB];
      return getVal(a) - getVal(b);
    });
  },

  isTileDora: (tile, indicators) => {
    if (!tile) return false;
    if (tile[0] === "0") return true;
    if (!indicators) return false;
    const indArray = Array.isArray(indicators) ? indicators : [indicators];
    for (let ind of indArray) {
      const doraTile = MahjongEngine.getDoraTile(ind);
      if (tile === doraTile) return true;
      if (
        doraTile &&
        doraTile[0] === "5" &&
        tile[0] === "0" &&
        tile[1] === doraTile[1]
      )
        return true;
    }
    return false;
  },

  isAgari: (hand, openMeldCount = 0) => {
    if (hand.length + openMeldCount * 3 !== 14) return false;
    const counts = {};
    hand.forEach((t) => {
      const normT = t[0] === "0" ? `5${t[1]}` : t;
      counts[normT] = (counts[normT] || 0) + 1;
    });
    if (
      openMeldCount === 0 &&
      Object.values(counts).filter((c) => c === 2).length === 7
    )
      return true;

    const targetMentsu = 4 - openMeldCount;
    const checkMentsu = (dict, depth) => {
      if (depth === targetMentsu) return true;
      let firstTile = null;
      for (let s of ["m", "p", "s", "z"]) {
        for (let r = 1; r <= 9; r++) {
          const t = `${r}${s}`;
          if (dict[t] > 0) {
            firstTile = t;
            break;
          }
        }
        if (firstTile) break;
      }
      if (!firstTile) return depth === targetMentsu;

      const r = parseInt(firstTile[0]);
      const s = firstTile[1];
      if (dict[firstTile] >= 3) {
        dict[firstTile] -= 3;
        if (checkMentsu(dict, depth + 1)) return true;
        dict[firstTile] += 3;
      }

      if (s === "p" || s === "s") {
        if (r <= 7) {
          const t2 = `${r + 1}${s}`;
          const t3 = `${r + 2}${s}`;
          if (dict[firstTile] > 0 && dict[t2] > 0 && dict[t3] > 0) {
            dict[firstTile]--;
            dict[t2]--;
            dict[t3]--;
            if (checkMentsu(dict, depth + 1)) return true;
            dict[firstTile]++;
            dict[t2]++;
            dict[t3]++;
          }
        }
      }
      return false;
    };

    for (let tile in counts) {
      if (counts[tile] >= 2) {
        const dictCopy = { ...counts };
        dictCopy[tile] -= 2;
        if (checkMentsu(dictCopy, 0)) return true;
      }
    }
    return false;
  },

  getTenpaiUkeire: (hand13, openMeldCount, context) => {
    let ukeire = 0;
    let isTenpai = false;
    let waitingTiles = [];
    const visibleCounts = {};

    if (context?.rivers)
      context.rivers.forEach((r) =>
        r.forEach((t) => (visibleCounts[t] = (visibleCounts[t] || 0) + 1))
      );
    if (context?.openMelds)
      context.openMelds.forEach((mList) =>
        mList.forEach(
          (m) =>
            (visibleCounts[m.tile] =
              (visibleCounts[m.tile] || 0) + (m.type.includes("kan") ? 4 : 3))
        )
      );
    if (context?.kitas)
      context.kitas.forEach((kList) =>
        kList.forEach((t) => (visibleCounts[t] = (visibleCounts[t] || 0) + 1))
      );
    if (context?.doraInd)
      visibleCounts[context.doraInd] =
        (visibleCounts[context.doraInd] || 0) + 1;

    hand13.forEach((t) => (visibleCounts[t] = (visibleCounts[t] || 0) + 1));
    const getRem = (r, s) => {
      if (r < 1 || r > 9) return 0;
      if (r === 5 && (s === "p" || s === "s")) {
        const normalRem = Math.max(0, 2 - (visibleCounts[`5${s}`] || 0));
        const redRem = Math.max(0, 2 - (visibleCounts[`0${s}`] || 0));
        return normalRem + redRem;
      }
      const t = `${r}${s}`;
      return Math.max(0, 4 - (visibleCounts[t] || 0));
    };
    for (let s of ["m", "p", "s", "z"]) {
      for (let r = 1; r <= 9; r++) {
        if (s === "m" && r > 1 && r < 9) continue;
        if (s === "z" && r > 7) continue;
        const t = `${r}${s}`;
        if (MahjongEngine.isAgari([...hand13, t], openMeldCount)) {
          isTenpai = true;
          ukeire += getRem(r, s);
          waitingTiles.push(t);
        }
      }
    }
    return { isTenpai, ukeire, waitingTiles };
  },

  generateRandomDeck: (seedString = "") => {
    let deck = [];
    const SANMA_TILE_SET = [
      "1m",
      "9m",
      "1p",
      "2p",
      "3p",
      "4p",
      "5p",
      "6p",
      "7p",
      "8p",
      "9p",
      "1s",
      "2s",
      "3s",
      "4s",
      "5s",
      "6s",
      "7s",
      "8s",
      "9s",
      "1z",
      "2z",
      "3z",
      "4z",
      "5z",
      "6z",
      "7z",
    ];

    SANMA_TILE_SET.forEach((t) => {
      if (t === "5p" || t === "5s") {
        deck.push(t);
        deck.push(t);
        const redT = `0${t[1]}`;
        deck.push(redT);
        deck.push(redT);
      } else {
        for (let i = 0; i < 4; i++) deck.push(t);
      }
    });

    // 將字串 Seed 轉換為數字
    let seedNum = Math.floor(Math.random() * 4294967296); // 預設隨機
    if (seedString) {
      seedNum = 0;
      for (let i = 0; i < seedString.length; i++) {
        seedNum = (Math.imul(31, seedNum) + seedString.charCodeAt(i)) | 0;
      }
    }

    // 初始化 RNG
    const random = mulberry32(seedNum);

    // Fisher-Yates 洗牌演算法 (使用 custom random)
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  },

  getDoraTile: (indicator) => {
    if (!indicator) return null;
    const rank = parseInt(indicator[0]);
    const suit = indicator[1];
    if (suit === "m") return rank === 1 ? "9m" : "1m";
    if (suit === "p" || suit === "s")
      return rank === 9 ? `1${suit}` : `${rank + 1}${suit}`;
    if (suit === "z") {
      if (rank <= 4) return rank === 4 ? "1z" : `${rank + 1}z`;
      return rank === 7 ? "5z" : `${rank + 1}z`;
    }
    return null;
  },

  estimateHandValue: (hand, melds, kitas, doraInd) => {
    let han = 0;
    const counts = {};
    hand.forEach((t) => {
      counts[t] = (counts[t] || 0) + 1;
    });
    melds.forEach((m) => {
      counts[m.tile] = (counts[m.tile] || 0) + 3;
    });

    const doraTile = MahjongEngine.getDoraTile(doraInd);
    hand.forEach((t) => {
      if (t[0] === "0") han++;
      if (
        doraTile &&
        (t === doraTile ||
          (doraTile[0] === "5" && t[0] === "0" && t[1] === doraTile[1]))
      )
        han++;
    });
    melds.forEach((m) => {
      if (m.tile[0] === "0") han += 3;
      if (
        doraTile &&
        (m.tile === doraTile ||
          (doraTile[0] === "5" &&
            m.tile[0] === "0" &&
            m.tile[1] === doraTile[1]))
      )
        han += 3;
    });
    han += kitas.length;
    if (melds.length === 0) han += 1;
    return han;
  },

  evaluateTacticalStance: (
    playerHand,
    playerMelds,
    playerKitas,
    aiStates,
    context
  ) => {
    let maxThreat = 0;
    let threatDetails = [];
    let logicSteps = [];

    aiStates.forEach((ai, idx) => {
      let threat = 0;
      let reasons = [];
      if (ai.isRiichi) {
        threat += 100;
        reasons.push("立直");
      }
      if (ai.melds.length >= 2) {
        threat += 40;
        reasons.push("多次副露");
      }

      let visibleDora = ai.kitas.length;
      ai.melds.forEach((m) => {
        if (m.tile[0] === "0") visibleDora++;
        if (MahjongEngine.isTileDora(m.tile, context.doraInd)) visibleDora += 3;
      });
      if (visibleDora >= 3) {
        threat += 50;
        reasons.push(`寶牌滿載(${visibleDora}張)`);
      }

      if (threat > 0) {
        maxThreat = Math.max(maxThreat, threat);
        threatDetails.push({ name: idx === 0 ? "下家" : "上家", reasons });
      }
    });

    const isTenpaiInfo = MahjongEngine.getTenpaiUkeire(
      playerHand,
      playerMelds.length,
      context
    );
    const estHan = MahjongEngine.estimateHandValue(
      playerHand,
      playerMelds,
      playerKitas,
      context.doraInd
    );

    logicSteps.push(
      `🔍 己方狀態：${
        isTenpaiInfo.isTenpai ? "已聽牌" : "未聽牌"
      }，潛在打點預估 ${estHan} 翻。`
    );
    if (threatDetails.length > 0) {
      const threatDesc = threatDetails
        .map((t) => `${t.name}(${t.reasons.join(" + ")})`)
        .join("、");
      logicSteps.push(`⚠️ 敵方動向：偵測到威脅來源 [${threatDesc}]。`);
    } else {
      logicSteps.push(`✅ 敵方動向：目前無人立直或明顯大牌副露，場況平穩。`);
    }

    let stance = "attack";
    let label = "🏃 推進牌效";
    let color = "emerald-500";
    let desc = `目前無明顯威脅，請專注於最大化進張數，盡快推進至聽牌。`;

    if (maxThreat >= 100) {
      if (isTenpaiInfo.isTenpai && estHan >= 3) {
        stance = "attack";
        label = "🔥 強勢對攻";
        color = "red-500";
        desc = `敵方立直！但我方已聽牌且打點足夠 (${estHan}翻+)，局收支為正，建議硬拼對攻！`;
        logicSteps.push(
          `💡 決策理論：《數據制勝》指出，聽牌且具備滿貫級別打點時，與先制立直對攻的局收支期望值為正。`
        );
      } else if (isTenpaiInfo.isTenpai) {
        stance = "caution";
        label = "⚠️ 條件對攻";
        color = "yellow-500";
        desc = `敵方立直。我方雖聽牌但打點偏低 (預估 ${estHan} 翻)，請視巡目與危險牌決定是否硬拼。`;
        logicSteps.push(
          `💡 決策理論：我方雖聽牌但打點不足，硬拼風險偏高。若摸入生張或無筋危險牌，應隨時準備轉為防守。`
        );
      } else {
        stance = "defend";
        label = "🛡️ 絕對防守";
        color = "blue-500";
        desc = `敵方強烈威脅！我方尚未聽牌且局收支極差，根據《數據制勝》強烈建議棄和防守 (Fold)。`;
        logicSteps.push(
          `💡 決策理論：《數據制勝》強調「未聽牌面對先制立直，局收支為嚴重負數」。此時應徹底放棄自身牌效，優先打出安全牌 (現物 > 兩家安全牌 > 字牌)。`
        );
      }
    } else if (maxThreat >= 40) {
      if (isTenpaiInfo.isTenpai || estHan >= 4) {
        stance = "attack";
        label = "⚔️ 保持進攻";
        color = "emerald-500";
        desc = `敵方有一定威脅 (${threatDetails[0]?.reasons.join(
          ","
        )})，但我方牌力佳，維持進攻。`;
        logicSteps.push(
          `💡 決策理論：敵方疑似染手或有寶牌，但我方手牌價值極高，具備對攻資本，不應輕易退縮拆牌。`
        );
      } else {
        stance = "caution";
        label = "👀 謹慎行事";
        color = "yellow-500";
        desc = `敵方副露或寶牌較多，注意防守染手或大牌，不宜隨意打生張危險牌。`;
        logicSteps.push(
          `💡 決策理論：我方尚未聽牌且價值普通。敵方已有大牌徵兆，應開始扣留危險的生張牌，避免放銃。`
        );
      }
    } else if (isTenpaiInfo.isTenpai) {
      stance = "attack";
      label = "🎯 準備收網";
      color = "emerald-500";
      desc = `場況平穩，我方已聽牌！隨時準備立直或和牌。`;
      logicSteps.push(
        `💡 決策理論：我方先制聽牌，擁有主動權。請考慮是否滿足立直條件以壓制對手。`
      );
    } else {
      logicSteps.push(
        `💡 決策理論：目前為序盤或平穩期，核心策略為落實「五搭子理論」，快速將手牌整理至一向聽。`
      );
    }

    return {
      stance,
      label,
      color,
      desc,
      estHan,
      isTenpai: isTenpaiInfo.isTenpai,
      threats: threatDetails,
      logicSteps,
    };
  },

  getSafetyScore: (hand, threatRivers, context) => {
    const scores = {};
    const visibleCounts = {};
    if (context?.doraInd) visibleCounts[context.doraInd] = 1;
    if (context?.rivers)
      context.rivers.forEach((r) =>
        r.forEach((t) => (visibleCounts[t] = (visibleCounts[t] || 0) + 1))
      );
    if (context?.openMelds)
      context.openMelds.forEach((mList) =>
        mList.forEach(
          (m) =>
            (visibleCounts[m.tile] =
              (visibleCounts[m.tile] || 0) + (m.type.includes("kan") ? 4 : 3))
        )
      );
    if (context?.kitas)
      context.kitas.forEach((kList) =>
        kList.forEach((t) => (visibleCounts[t] = (visibleCounts[t] || 0) + 1))
      );

    hand.forEach((tile, idx) => {
      let danger = 50;
      const rank = tile[0] === "0" ? 5 : parseInt(tile[0]);
      const suit = tile.slice(-1);
      const normTile = `${rank}${suit}`;

      const inAllThreats =
        threatRivers.length > 0 &&
        threatRivers.every(
          (r) =>
            r.includes(normTile) ||
            r.includes(tile) ||
            (rank === 5 && r.includes(`0${suit}`))
        );
      const inSomeThreats =
        threatRivers.length > 0 &&
        threatRivers.some(
          (r) =>
            r.includes(normTile) ||
            r.includes(tile) ||
            (rank === 5 && r.includes(`0${suit}`))
        );

      if (inAllThreats) danger = 0;
      else if (inSomeThreats) danger = 10;
      else if (suit === "z") {
        const rem =
          4 -
          (visibleCounts[tile] || 0) -
          hand.filter((t) => t === tile).length;
        danger = rem === 0 ? 5 : rem === 1 ? 15 : 30;
      } else {
        let isSuji = false;
        if (rank === 1 && threatRivers.some((r) => r.includes(`4${suit}`)))
          isSuji = true;
        if (
          rank === 2 &&
          threatRivers.some(
            (r) => r.includes(`5${suit}`) || r.includes(`0${suit}`)
          )
        )
          isSuji = true;
        if (rank === 3 && threatRivers.some((r) => r.includes(`6${suit}`)))
          isSuji = true;
        if (rank === 4 && threatRivers.some((r) => r.includes(`7${suit}`)))
          isSuji = true;
        if (
          rank === 5 &&
          threatRivers.some((r) => r.includes(`2${suit}`)) &&
          threatRivers.some((r) => r.includes(`8${suit}`))
        )
          isSuji = true;
        if (rank === 6 && threatRivers.some((r) => r.includes(`3${suit}`)))
          isSuji = true;
        if (rank === 7 && threatRivers.some((r) => r.includes(`4${suit}`)))
          isSuji = true;
        if (
          rank === 8 &&
          threatRivers.some(
            (r) => r.includes(`5${suit}`) || r.includes(`0${suit}`)
          )
        )
          isSuji = true;
        if (rank === 9 && threatRivers.some((r) => r.includes(`6${suit}`)))
          isSuji = true;

        if (isSuji)
          danger =
            rank === 1 || rank === 9 ? 15 : rank === 2 || rank === 8 ? 20 : 35;
        else
          danger =
            rank === 1 || rank === 9 ? 40 : rank === 2 || rank === 8 ? 50 : 75;
      }
      if (MahjongEngine.isTileDora(tile, context.doraInd)) danger += 20;
      scores[idx] = Math.min(100, Math.max(0, danger));
    });
    return scores;
  },

  getAdjacencyScore: (hand, context) => {
    const scores = {};
    const doraTile = MahjongEngine.getDoraTile(context?.doraInd);
    const visibleCounts = {};
    if (context?.doraInd) visibleCounts[context.doraInd] = 1;
    if (context?.rivers)
      context.rivers.forEach((r) =>
        r.forEach((t) => (visibleCounts[t] = (visibleCounts[t] || 0) + 1))
      );
    if (context?.openMelds)
      context.openMelds.forEach((mList) =>
        mList.forEach(
          (m) =>
            (visibleCounts[m.tile] =
              (visibleCounts[m.tile] || 0) + (m.type.includes("kan") ? 4 : 3))
        )
      );
    if (context?.kitas)
      context.kitas.forEach((kList) =>
        kList.forEach((t) => (visibleCounts[t] = (visibleCounts[t] || 0) + 1))
      );

    const getRem = (r, s) => {
      if (r < 1 || r > 9) return 0;
      if (r === 5 && (s === "p" || s === "s")) {
        const normalRem = Math.max(
          0,
          2 -
            (visibleCounts[`5${s}`] || 0) -
            hand.filter((x) => x === `5${s}`).length
        );
        const redRem = Math.max(
          0,
          2 -
            (visibleCounts[`0${s}`] || 0) -
            hand.filter((x) => x === `0${s}`).length
        );
        return normalRem + redRem;
      }
      return Math.max(
        0,
        4 -
          (visibleCounts[`${r}${s}`] || 0) -
          hand.filter((x) => x === `${r}${s}`).length
      );
    };

    hand.forEach((tile, idx) => {
      let score = 0;
      const rank = tile[0] === "0" ? 5 : parseInt(tile[0]);
      const suit = tile.slice(-1);
      const selfRem =
        tile[0] === "0" || rank === 5
          ? getRem(5, suit)
          : Math.max(
              0,
              4 -
                (visibleCounts[tile] || 0) -
                hand.filter((x) => x === tile).length
            );

      if (suit === "z") {
        const isYakuhai =
          tile === context?.pWind || tile === context?.sWind || rank >= 5;
        score += isYakuhai ? 0.5 + selfRem * 0.2 : 0.1 + selfRem * 0.1;
      } else if (suit === "m") {
        score += 0.0;
      } else {
        if (rank >= 3 && rank <= 7) score += 0.3 + selfRem * 0.1;
        else if (rank === 2 || rank === 8) score += 0.1 + selfRem * 0.05;
        else score += 0.05 + selfRem * 0.05;
      }

      if (tile[0] === "0") score += 1.5;
      if (
        doraTile &&
        (tile === doraTile ||
          (doraTile[0] === "5" && tile[0] === "0" && tile[1] === doraTile[1]))
      )
        score += 3.5;

      const c = hand.filter(
        (t) =>
          (t[0] === "0" ? 5 : parseInt(t[0])) === rank && t.slice(-1) === suit
      ).length;
      const has = (r) =>
        hand.some(
          (t) =>
            (t[0] === "0" ? 5 : parseInt(t[0])) === r && t.slice(-1) === suit
        );

      if (suit === "z") {
        const isYakuhai =
          tile === context?.pWind || tile === context?.sWind || rank >= 5;
        if (c >= 3) score += 8.0;
        else if (c === 2)
          score += (isYakuhai ? 6.0 : 4.0) * (selfRem > 0 ? 1 : 0.5);
      } else if (suit === "m") {
        if (c >= 3) score += 6.0;
        else if (c === 2) score += 2.0 * (selfRem > 0 ? 1 : 0.5);
      } else {
        const isShuntsu =
          (has(rank - 1) && has(rank - 2)) ||
          (has(rank - 1) && has(rank + 1)) ||
          (has(rank + 1) && has(rank + 2));
        if (isShuntsu) score = Math.max(score, 8.0);
        if (c >= 3) score = Math.max(score, 6.0);
        else if (c === 2)
          score = Math.max(score, 3.5 * (selfRem > 0 ? 1 : 0.4));

        if (has(rank - 1)) {
          const targetRem = getRem(rank - 2, suit) + getRem(rank + 1, suit);
          score = Math.max(
            score,
            (rank - 1 === 1 || rank === 9 ? 1.0 : 1.5) + targetRem * 0.5
          );
        }
        if (has(rank + 1)) {
          const targetRem = getRem(rank - 1, suit) + getRem(rank + 2, suit);
          score = Math.max(
            score,
            (rank === 1 || rank + 1 === 9 ? 1.0 : 1.5) + targetRem * 0.5
          );
        }
        if (has(rank - 2)) {
          const targetRem = getRem(rank - 1, suit);
          score = Math.max(
            score,
            (rank - 2 === 1 || rank === 9 ? 0.8 : 1.2) + targetRem * 0.5
          );
        }
        if (has(rank + 2)) {
          const targetRem = getRem(rank + 1, suit);
          score = Math.max(
            score,
            (rank === 1 || rank + 2 === 9 ? 0.8 : 1.2) + targetRem * 0.5
          );
        }
      }
      scores[idx] = score;
    });
    return scores;
  },

  analyzeDiscard: (
    hand,
    discardIndex,
    context,
    stance = "attack",
    threatRivers = [],
    openMeldCount = 0
  ) => {
    let finalScores = {};
    let anyTenpai = false;
    let tenpaiData = {};

    if (stance === "defend") {
      finalScores = MahjongEngine.getSafetyScore(hand, threatRivers, context);
    } else {
      finalScores = MahjongEngine.getAdjacencyScore(hand, context);
      hand.forEach((tile, idx) => {
        const hand13 = [...hand];
        hand13.splice(idx, 1);
        const res = MahjongEngine.getTenpaiUkeire(
          hand13,
          openMeldCount,
          context
        );
        if (res.isTenpai) {
          anyTenpai = true;
          tenpaiData[idx] = {
            ukeire: res.ukeire,
            waitingTiles: res.waitingTiles,
          };
        }
      });

      if (anyTenpai) {
        hand.forEach((_, idx) => {
          if (tenpaiData[idx] !== undefined)
            finalScores[idx] = -1000 - tenpaiData[idx].ukeire;
          else finalScores[idx] = 1000;
        });
      }
    }

    let minScore = Infinity;
    let bestDiscards = [];
    Object.entries(finalScores).forEach(([idx, score]) => {
      if (score < minScore) {
        minScore = score;
        bestDiscards = [parseInt(idx)];
      } else if (score === minScore) {
        bestDiscards.push(parseInt(idx));
      }
    });
    const userScore = discardIndex !== null ? finalScores[discardIndex] : 0;
    const isOptimal = userScore - minScore < 0.05;

    return {
      isOptimal,
      bestDiscards,
      userScore,
      optimalScore: minScore,
      allScores: finalScores,
      isTenpai: anyTenpai,
      tenpaiData,
      stance,
    };
  },

  calculateScore: (
    hand,
    melds,
    kitas,
    winTile,
    isTsumo,
    isRiichi,
    isDealer,
    pWind,
    sWind,
    doraInd,
    deckRemainder = 10,
    uraDoraInd = []
  ) => {
    let isYakuman = false;
    const normHand = hand.map((t) => (t[0] === "0" ? `5${t[1]}` : t));
    const normWinTile = winTile[0] === "0" ? `5${winTile[1]}` : winTile;
    const counts = {};
    normHand.forEach((t) => (counts[t] = (counts[t] || 0) + 1));
    const fullCounts = { ...counts };
    melds.forEach((m) => {
      const t = m.tile[0] === "0" ? `5${m.tile[1]}` : m.tile;
      fullCounts[t] = (fullCounts[t] || 0) + (m.type.includes("kan") ? 4 : 3);
    });

    const yaochu = [
      "1m",
      "9m",
      "1p",
      "9p",
      "1s",
      "9s",
      "1z",
      "2z",
      "3z",
      "4z",
      "5z",
      "6z",
      "7z",
    ];
    if (melds.length === 0) {
      let isKokushiLocal = true,
        hasKokushiPair = false;
      for (let y of yaochu) {
        if (!counts[y]) {
          isKokushiLocal = false;
          break;
        }
        if (counts[y] === 2) hasKokushiPair = true;
      }
      if (isKokushiLocal && hasKokushiPair)
        return MahjongEngine._buildScoreResult(
          [{ name: "國士無雙", han: 13 }],
          13,
          20,
          isTsumo,
          isDealer,
          true
        );

      const checkChuuren = (suit) => {
        const req = { 1: 3, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 3 };
        for (let r = 1; r <= 9; r++)
          if ((counts[`${r}${suit}`] || 0) < req[r]) return false;
        return true;
      };
      if (checkChuuren("p") || checkChuuren("s"))
        return MahjongEngine._buildScoreResult(
          [{ name: "九蓮寶燈", han: 13 }],
          13,
          20,
          isTsumo,
          isDealer,
          true
        );
    }

    let isChiitoitsu =
      melds.length === 0 &&
      Object.values(counts).filter((c) => c === 2).length === 7;
    let partitions = [];
    const dfs = (dict, currentPart, depth) => {
      if (depth === 0) {
        partitions.push([...currentPart]);
        return;
      }
      let firstT = null;
      for (let s of ["m", "p", "s", "z"]) {
        for (let r = 1; r <= 9; r++)
          if (dict[`${r}${s}`] > 0) {
            firstT = `${r}${s}`;
            break;
          }
        if (firstT) break;
      }
      if (!firstT) return;
      const r = parseInt(firstT[0]),
        s = firstT[1];

      if (dict[firstT] >= 3) {
        dict[firstT] -= 3;
        dfs(
          dict,
          [...currentPart, { type: "koutsu", tile: firstT, isAnkou: true }],
          depth - 1
        );
        dict[firstT] += 3;
      }
      if ((s === "p" || s === "s") && r <= 7) {
        const t2 = `${r + 1}${s}`,
          t3 = `${r + 2}${s}`;
        if (dict[firstT] > 0 && dict[t2] > 0 && dict[t3] > 0) {
          dict[firstT]--;
          dict[t2]--;
          dict[t3]--;
          dfs(
            dict,
            [
              ...currentPart,
              { type: "shuntsu", tiles: [firstT, t2, t3], isAnkou: false },
            ],
            depth - 1
          );
          dict[firstT]++;
          dict[t2]++;
          dict[t3]++;
        }
      }
    };

    if (!isChiitoitsu) {
      for (let t in counts) {
        if (counts[t] >= 2) {
          counts[t] -= 2;
          dfs(counts, [{ type: "jantou", tile: t }], 4 - melds.length);
          counts[t] += 2;
        }
      }
    }

    const formattedMelds = melds.map((m) => {
      const t = m.tile[0] === "0" ? `5${m.tile[1]}` : m.tile;
      return {
        type: m.type.includes("kan") ? "kantsu" : "koutsu",
        tile: t,
        isAnkou: m.type === "ankan",
      };
    });

    const evaluatePartition = (part) => {
      let y = [],
        h = 0,
        f = 20,
        isYkm = false;
      const full = [...part, ...formattedMelds];

      let isPinfu = false;
      if (
        melds.length === 0 &&
        part.filter((p) => p.type === "shuntsu").length === 4
      ) {
        const jTile = part.find((p) => p.type === "jantou").tile;
        if (
          jTile !== pWind &&
          jTile !== sWind &&
          !(parseInt(jTile[0]) >= 5 && jTile[1] === "z")
        ) {
          for (let p of part) {
            if (p.type === "shuntsu" && p.tiles.includes(normWinTile)) {
              const r = parseInt(p.tiles[0][0]),
                wR = parseInt(normWinTile[0]);
              if ((wR === r + 2 && r >= 2) || (wR === r && r + 2 <= 8)) {
                isPinfu = true;
                break;
              }
            }
          }
        }
      }
      if (isPinfu) {
        y.push({ name: "平和", han: 1 });
        h += 1;
      }

      ["1z", "2z", "3z", "4z", "5z", "6z", "7z"].forEach((z) => {
        if (
          fullCounts[z] >= 3 &&
          (z === pWind || z === sWind || parseInt(z[0]) >= 5)
        ) {
          y.push({ name: `役牌：${TILE_LABELS[z]}`, han: 1 });
          h += 1;
        }
      });
      if (
        Object.keys(fullCounts).every(
          (t) => !t.includes("1") && !t.includes("9") && !t.includes("z")
        )
      ) {
        y.push({ name: "斷么九", han: 1 });
        h += 1;
      }

      if (melds.length === 0) {
        const sStrs = part
          .filter((p) => p.type === "shuntsu")
          .map((p) => p.tiles.join(""));
        let pCount = 0;
        [...new Set(sStrs)].forEach((s) => {
          const c = sStrs.filter((x) => x === s).length;
          pCount += c >= 4 ? 2 : c >= 2 ? 1 : 0;
        });
        if (pCount === 2) {
          y.push({ name: "兩盃口", han: 3 });
          h += 3;
        } else if (pCount === 1) {
          y.push({ name: "一盃口", han: 1 });
          h += 1;
        }
      }

      if (
        full.filter((p) => p.type.includes("kou") || p.type.includes("kan"))
          .length === 4
      ) {
        y.push({ name: "對對和", han: 2 });
        h += 2;
      }

      let aCount = full.filter((p) => p.isAnkou).length;
      if (!isTsumo) {
        for (let p of part)
          if (p.type === "koutsu" && p.tile === normWinTile && p.isAnkou) {
            aCount--;
            break;
          }
      }
      if (aCount === 4) {
        y.push({ name: "四暗刻", han: 13 });
        isYkm = true;
      } else if (aCount === 3) {
        y.push({ name: "三暗刻", han: 2 });
        h += 2;
      }

      const hasP = Object.keys(fullCounts).some((t) => t.includes("p")),
        hasS = Object.keys(fullCounts).some((t) => t.includes("s")),
        hasZ = Object.keys(fullCounts).some((t) => t.includes("z"));
      if ((hasP && !hasS) || (!hasP && hasS)) {
        y.push({
          name: hasZ ? "混一色" : "清一色",
          han: hasZ ? (melds.length ? 2 : 3) : melds.length ? 5 : 6,
        });
        h += hasZ ? (melds.length ? 2 : 3) : melds.length ? 5 : 6;
      }

      if (
        Object.keys(fullCounts).every(
          (t) => t.includes("1") || t.includes("9") || t.includes("z")
        )
      ) {
        if (hasZ) {
          y.push({ name: "混老頭", han: 2 });
          h += 2;
        } else {
          y.push({ name: "清老頭", han: 13 });
          isYkm = true;
        }
      }

      let zTrip = 0,
        zPair = 0;
      ["5z", "6z", "7z"].forEach((z) => {
        if (fullCounts[z] >= 3) zTrip++;
        else if (fullCounts[z] === 2) zPair++;
      });
      if (zTrip === 3) {
        y.push({ name: "大三元", han: 13 });
        isYkm = true;
      } else if (zTrip === 2 && zPair === 1) {
        y.push({ name: "小三元", han: 2 });
        h += 2;
      }

      if (Object.keys(fullCounts).every((t) => t.includes("z"))) {
        y.push({ name: "字一色", han: 13 });
        isYkm = true;
      }
      if (
        Object.keys(fullCounts).every((t) =>
          ["2s", "3s", "4s", "6s", "8s", "6z"].includes(t)
        )
      ) {
        y.push({ name: "綠一色", han: 13 });
        isYkm = true;
      }

      for (let n = 1; n <= 9; n++)
        if (
          fullCounts[`${n}m`] >= 3 &&
          fullCounts[`${n}p`] >= 3 &&
          fullCounts[`${n}s`] >= 3
        ) {
          y.push({ name: "三色同刻", han: 2 });
          h += 2;
          break;
        }

      let kCount = full.filter((p) => p.type === "kantsu").length;
      if (kCount === 4) {
        y.push({ name: "四槓子", han: 13 });
        isYkm = true;
      } else if (kCount === 3) {
        y.push({ name: "三槓子", han: 2 });
        h += 2;
      }

      let wTrip = 0,
        wPair = 0;
      ["1z", "2z", "3z", "4z"].forEach((z) => {
        if (fullCounts[z] >= 3) wTrip++;
        else if (fullCounts[z] === 2) wPair++;
      });
      if (wTrip === 4) {
        y.push({ name: "大四喜", han: 13 });
        isYkm = true;
      } else if (wTrip === 3 && wPair === 1) {
        y.push({ name: "小四喜", han: 13 });
        isYkm = true;
      }

      if (!isTsumo && melds.length === 0 && isPinfu) f = 30;
      else if (isTsumo && isPinfu) f = 20;
      else {
        f = 20;
        if (!isTsumo && melds.length === 0) f += 10;
        if (!isPinfu) f += 2;
        const jt = full.find((p) => p.type === "jantou")?.tile;
        if (jt === pWind || jt === sWind || (jt && parseInt(jt[0]) >= 5)) {
          f += 2;
          if (jt === pWind && jt === sWind) f += 2;
        }
        full.forEach((p) => {
          if (p.type.includes("kou") || p.type.includes("kan")) {
            let pf = p.type === "kantsu" ? 8 : 2;
            if (
              p.tile.includes("1") ||
              p.tile.includes("9") ||
              p.tile.includes("z")
            )
              pf *= 2;
            if (p.isAnkou && (isTsumo || p.tile !== normWinTile)) pf *= 2;
            f += pf;
          }
        });
        if (isTsumo) f += 2;
        f = Math.ceil(f / 10) * 10;
        if (f < 30) f = 30;
      }
      return { yaku: y, han: h, fu: f, isYakuman: isYkm };
    };

    let best = { yaku: [], han: 0, fu: 0, isYakuman: false };
    if (isChiitoitsu) {
      let y = [{ name: "七對子", han: 2 }],
        h = 2,
        isYkm = false;
      if (
        Object.keys(fullCounts).every(
          (t) => !t.includes("1") && !t.includes("9") && !t.includes("z")
        )
      ) {
        y.push({ name: "斷么九", han: 1 });
        h += 1;
      }
      const hasP = Object.keys(fullCounts).some((t) => t.includes("p")),
        hasS = Object.keys(fullCounts).some((t) => t.includes("s")),
        hasZ = Object.keys(fullCounts).some((t) => t.includes("z"));
      if ((hasP && !hasS) || (!hasP && hasS)) {
        y.push({ name: hasZ ? "混一色" : "清一色", han: hasZ ? 3 : 6 });
        h += hasZ ? 3 : 6;
      }
      if (
        Object.keys(fullCounts).every(
          (t) => t.includes("1") || t.includes("9") || t.includes("z")
        )
      ) {
        if (hasZ) {
          y.push({ name: "混老頭", han: 2 });
          h += 2;
        } else {
          y.push({ name: "清老頭", han: 13 });
          isYkm = true;
        }
      }
      if (Object.keys(fullCounts).every((t) => t.includes("z"))) {
        y.push({ name: "字一色", han: 13 });
        isYkm = true;
      }
      if (
        Object.keys(fullCounts).every((t) =>
          ["2s", "3s", "4s", "6s", "8s", "6z"].includes(t)
        )
      ) {
        y.push({ name: "綠一色", han: 13 });
        isYkm = true;
      }
      best = { yaku: y, han: h, fu: 25, isYakuman: isYkm };
    }

    partitions.forEach((part) => {
      const res = evaluatePartition(part);
      if (res.isYakuman) {
        if (!best.isYakuman || res.han > best.han) best = res;
      } else if (!best.isYakuman && res.han > best.han) best = res;
      else if (!best.isYakuman && res.han === best.han && res.fu > best.fu)
        best = res;
    });

    let { yaku: fYaku, han: fHan, fu: fFu, isYakuman: fYkm } = best;
    if (!fYkm) {
      if (deckRemainder === 0) {
        fYaku.push({ name: isTsumo ? "海底撈月" : "河底撈魚", han: 1 });
        fHan += 1;
      }
      if (isRiichi) {
        fYaku.unshift({ name: "立直", han: 1 });
        fHan += 1;
      }
      if (isTsumo && melds.length === 0) {
        fYaku.unshift({ name: "門前清自摸和", han: 1 });
        fHan += 1;
      }

      let dC = kitas.length,
        dT = MahjongEngine.getDoraTile(doraInd);
      if (dT && fullCounts[dT]) dC += fullCounts[dT];
      let rC =
        hand.filter((t) => t[0] === "0").length +
        melds.filter((m) => m.tile[0] === "0").length;
      if (rC > 0) {
        fYaku.push({ name: "赤寶牌", han: rC });
        fHan += rC;
      }
      if (dC > 0) {
        fYaku.push({ name: "寶牌 (含拔北)", han: dC });
        fHan += dC;
      }

      if (fHan === 0 || fHan === dC + rC) {
        fYaku = [{ name: "基礎役種 (補償)", han: 1 }, ...fYaku];
        fHan = 1 + dC + rC;
      }
    }

    // 🌟 1. 確保指示牌是陣列
    const doraIndicators = Array.isArray(doraInd) ? doraInd : [doraInd];
    const uraIndicators = Array.isArray(uraDoraInd) ? uraDoraInd : [];

    // 🌟 2. 三麻專用：從「指示牌」推算「真正的寶牌」
    const getActualDora = (indicator) => {
      const num = parseInt(indicator[0]);
      const suit = indicator[1];
      if (suit === "z") {
        if (num === 4) return "1z"; // 北風 -> 東風
        if (num === 7) return "5z"; // 白板 -> 發財
        return `${num + 1}z`;
      }
      if (suit === "m") return num === 1 ? "9m" : "1m"; // 三麻萬子只有 1, 9
      return `${num === 9 ? 1 : num + 1}${suit}`;
    };

    const actualDoras = doraIndicators.map(getActualDora);
    const actualUraDoras = uraIndicators.map(getActualDora);

    // 🌟 3. 計算手牌中含有幾張寶牌
    const countDoraInHand = (doraList) => {
      let count = 0;
      const allTiles = [
        ...hand,
        ...melds.flatMap((m) =>
          Array(m.type === "kan" || m.type === "ankan" ? 4 : 3).fill(m.tile)
        ),
      ];
      doraList.forEach((dora) => {
        count += allTiles.filter((t) => t === dora).length;
      });
      return count;
    };

    // 🌟 修正：原本誤用了 yakuList 與 han，必須改為 fYaku 與 fHan
    // 表寶牌加番
    const doraHan = countDoraInHand(actualDoras);
    if (doraHan > 0) {
      fYaku.push({ name: "寶牌 (Dora)", han: doraHan });
      fHan += doraHan;
    }

    // 裏寶牌加番 (僅限立直)
    if (isRiichi) {
      const uraHan = countDoraInHand(actualUraDoras);
      if (uraHan > 0) {
        fYaku.push({ name: "裏寶牌 (Ura)", han: uraHan });
        fHan += uraHan;
      }
    }

    return MahjongEngine._buildScoreResult(
      fYaku,
      fHan,
      fFu,
      isTsumo,
      isDealer,
      fYkm
    );
  },

  _buildScoreResult: (fYaku, fHan, fu, isTsumo, isDealer, isYakuman) => {
    let b = 0,
      sStr = "";
    if (isYakuman) {
      const yc = Math.floor(han / 13) || 1;
      b = 8000 * yc;
      sStr = yc > 1 ? `${yc}倍役滿` : `役滿 (Yakuman)`;
    } else {
      if (han >= 13) {
        b = 8000;
        sStr = "累計役滿 (Kazeyakuman)";
      } else if (han >= 11) {
        b = 6000;
        sStr = "三倍滿 (Sanbaiman)";
      } else if (han >= 8) {
        b = 4000;
        sStr = "倍滿 (Baiman)";
      } else if (han >= 6) {
        b = 3000;
        sStr = "跳滿 (Haneman)";
      } else if (han >= 5 || (han === 4 && fu >= 40)) {
        b = 2000;
        sStr = "滿貫 (Mangan)";
      } else {
        b = fu * Math.pow(2, 2 + han);
        if (b > 2000) {
          b = 2000;
          sStr = "滿貫 (Mangan)";
        } else sStr = `${han} 翻 ${fu} 符`;
      }
    }
    let tS = 0;
    let payment = {}; // 新增 payment 物件

    if (isTsumo) {
      if (isDealer) {
        const p = Math.ceil((b * 2) / 100) * 100;
        tS = p * 2;
        sStr += ` (${p} ALL)`;
        payment = { all: p };
      } else {
        const pD = Math.ceil((b * 2) / 100) * 100,
          pN = Math.ceil(b / 100) * 100;
        tS = pD + pN;
        sStr += ` (莊 ${pD} / 子 ${pN})`;
        payment = { dealer: pD, nonDealer: pN };
      }
    } else {
      tS = Math.ceil((b * (isDealer ? 6 : 4)) / 100) * 100;
      sStr += ` (${tS} 點)`;
    }
    
    // 🌟 將 totalScore 與 payment 一併回傳
    return { fYaku, fhan, fu, totalScore: tS, scoreStr: sStr, payment };
  },
};
