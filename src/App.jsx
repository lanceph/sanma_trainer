import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BookOpen, Trophy, Lightbulb, Target, Library, Swords, Clock, Cpu, User, Settings, Activity, Puzzle, Layers, Shield, ShieldAlert, AlertTriangle, TrendingUp, XOctagon } from 'lucide-react';

// ============================================================================
// [1] CONSTANTS, TYPES & HELPERS (基礎常數與輔助函數)
// ============================================================================
const SANMA_TILE_SET = [
  '1m', '9m',
  '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p',
  '1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s',
  '1z', '2z', '3z', '4z', '5z', '6z', '7z'
];

const TILE_LABELS = {
  '1z': '東', '2z': '南', '3z': '西', '4z': '北',
  '5z': '白', '6z': '發', '7z': '中'
};

const getTileName = (tile) => {
  if (!tile) return '';
  const r = tile.charAt(0);
  const s = tile.charAt(1);
  if (r === '0') return `赤5${s === 'p' ? '筒' : '索'}`; 
  if (s === 'm') return `${r}萬`;
  if (s === 'p') return `${r}筒`;
  if (s === 's') return `${r}索`;
  return TILE_LABELS[tile] || tile;
};

// ============================================================================
// [2] TERMINOLOGY & TACTICS DATA (百科與戰術數據庫)
// ============================================================================

// --- 戰術百科 (Terminology) ---
const TERM_CATEGORIES = [
  {
    title: '🌱 基礎牌型與單位 (新手基礎)',
    icon: Puzzle,
    color: 'emerald',
    items: [
      { name: '面子：順子 (Shuntsu)', tiles: ['2p', '3p', '4p'], desc: '由三張連續數字組成的完成牌型。相較於刻子，順子是最容易湊成的基本單位。' },
      { name: '面子：刻子 (Koutsu)', tiles: ['5s', '5s', '5s'], desc: '由三張完全相同的牌組成的完成牌型。' },
      { name: '雀頭 / 將牌 (Jantou)', tiles: ['7z', '7z'], desc: '和牌必備的條件，由「一對」相同的牌組成。' },
      { name: '兩面搭子 (Ryanmen)', tiles: ['4s', '5s'], desc: '最優質的半完成品，聽兩邊的頭尾(此例為3,6索)，最多有 8 張進張機會。' },
      { name: '嵌張搭子 (Kanchan)', tiles: ['3p', '5p'], desc: '卡在中間的搭子，只能聽單一數字(此例為4筒，共4張)。但摸到相鄰牌(如2或6)可改良成兩面。' },
      { name: '邊張搭子 (Penchan)', tiles: ['1s', '2s'], desc: '最弱的搭子，只能聽邊緣的單一數字(此例為3索，共4張)，且極難改良，通常在拆搭時優先捨棄。' },
      { name: '對子搭子 (Toitsu)', tiles: ['8p', '8p'], desc: '兩張相同的牌，等待第三張碰牌或自己摸到變成刻子。' },
      { name: '孤張 / 浮牌 (Koritsu)', tiles: ['1m'], desc: '與手牌毫無關聯的單張牌。《數據制勝》特別指出，三麻中的 1萬、9萬 是絕對的廢牌孤張，應在序盤第一時間打出。' }
    ]
  },
  {
    title: '🧬 進階複合形 (高手理論 - 79博客精華)',
    icon: Layers,
    color: 'blue',
    items: [
      { name: '中膨 (Nakabure)', tiles: ['3p', '4p', '4p', '5p'], desc: '極度靈活的形狀！摸到 2, 3, 5, 6 都能形成好搭子，擁有高達 4 種進張改良可能，價值遠高於普通兩面，切勿過早拆解。' },
      { name: '兩嵌 (Ryankan)', tiles: ['3s', '5s', '7s'], desc: '由兩個嵌張(35與57)共用一張5組成。可聽4或6。進張數量(8張)等同於一個完美的兩面搭子，是非常強的過渡結構。' },
      { name: '延單騎 (Nobetan)', tiles: ['4p', '5p', '6p', '7p'], desc: '四張連續牌。看似是完成的順子多一張，實則是在聽兩端(此例為4或7)當作「雀頭」。在缺將牌時是極佳的聽牌型。' },
      { name: '亞兩面 (Aryamen)', tiles: ['3p', '4p', '4p', '4p'], desc: '暗刻黏著單張。可視為 34搭子 + 44對子。能聽 2, 5, 3筒，進張面非常廣。' },
      { name: '煙囪形 / 暗刻帶兩面 (Entotsu)', tiles: ['3s', '3s', '3s', '4s', '5s'], desc: '暗刻連著兩面搭子。包含三面聽的種子，若手牌其他部分湊齊，這個形狀可以聽 2, 3, 6索 三個洞。' },
      { name: '帶凸嵌張', tiles: ['3p', '3p', '5p'], desc: '對子加上隔一張的牌。摸到 4 可成順子，摸到 3 可成暗刻。是過渡期極為常見且有用的強搭。' },
      { name: '三面張 / 鋼琴面 (Sanmen)', tiles: ['3s', '4s', '5s', '6s', '7s'], desc: '最強的聽牌形狀之一，高達 11 張的進張機會 (此例聽 2, 5, 8索)，若形成此聽牌通常具備立直的絕對自信。' }
    ]
  },
  {
    title: '📐 大局理論與牌效 (Macro Theory)',
    icon: Lightbulb,
    color: 'indigo',
    items: [
      { name: '五搭子理論 (5-Block Theory)', tiles: [], desc: '麻將和牌需要 4面子+1雀頭 (共計5個區塊)。打牌時應在腦中將手牌嚴格劃分為 5 個區塊來構建，多餘的皆為廢牌。' },
      { name: '六搭子溢出 (6-Block Overflow)', tiles: [], desc: '當手牌出現 6 個潛在搭子時，進張效率反而會互相卡死。此時必須果斷「拆除最弱的搭子」(如邊張、無用客風對子)。' },
      { name: '完全一向聽 (Kanzen Ishanten)', tiles: [], desc: '一向聽的最強型態。同時擁有「兩面」與「雙碰」等多重進張可能，進張數往往高達 15 張以上，是牌效追求的極致。' },
      { name: '牌效平移改良', tiles: ['1s', '2s'], desc: '保留進張數相同，但將靠邊的牌換成中張。例如將手上的 12 換成 23，進張數雖同為 4 張，但後續變化為「兩面」的機率將大幅提高。' }
    ]
  },
  {
    title: '🛡️ 防守迷思與三麻特化 (Defense & Sanma)',
    icon: Shield,
    color: 'red',
    items: [
      { name: '筋牌 (Suji)', tiles: ['4p', '7p'], desc: '基於兩面聽牌的基礎防守理論。若對手打過 4，則 1 和 7 會相對安全 (因為對手無法用 23 或 56 雙面聽牌來和 1/7)。' },
      { name: '裡筋的迷思 (Urasuji)', tiles: ['5p'], desc: '指打出 5 的相鄰筋牌(14或69)。《79博客》詳細分析百萬局數據後證實：裡筋的危險度被嚴重誇大，與無關的生張危險度相差無幾，實戰中不需盲目恐懼。' },
      { name: '間四間的幻想 (Aida Yonken)', tiles: ['2s', '7s'], desc: '對手打出 2 和 7，中間的 36 稱為間四間。同樣被《79博客》以數據打臉證實這只是心理作用，其危險度僅比普通牌微幅高出 1.1 倍。' },
      { name: '壁 / No Chance (Kabe)', tiles: ['7p', '7p', '7p', '7p'], desc: '若場上與自己手中已經看到四張 7，代表對手絕對無法用 89 湊成 789 順子，因此 8 和 9 變得極度安全 (除非是單騎或雙碰聽牌)。' },
      { name: '拔北 (Nuki Kita)', tiles: ['4z'], desc: '三人麻將特有規則。北風可作為客風牌拔出放在一旁，每拔一張計 1 翻寶牌，並可從嶺上牌補摸一張。' },
      { name: '自摸損 (Tsumo Loss)', tiles: [], desc: '三麻重要算分機制。自摸時只收取兩家的分數，導致自摸的總收入比榮和(放銃者全包)還要少。因此三麻的戰術更鼓勵積極尋求榮和。' }
    ]
  }
];

// --- 攻防判斷與局收支 (Attack vs Defense Tactics) ---
const TACTICS_DATA = [
  {
    category: '🧠 攻防核心心法 (Core Mindset)',
    items: [
      {
        title: '局收支絕對論 (EV is King)',
        situation: '每次需要決定是否要硬拼對手的立直時。',
        action: '數據化決策', actionColor: 'bg-indigo-600',
        desc: '《數據制勝》的核心精神：「不要憑感覺，要看局收支(Expected Value)」。將自己和牌的機率與點數，扣除放銃的機率與失分。若期望值為正(>0)則攻，為負(<0)則守。',
        tiles: []
      },
      {
        title: '拒絕兜牌/半吊子防守 (No Half-Measures)',
        situation: '面對對手立直，自己手牌還不錯，想一邊打「稍微安全」的牌一邊推進手牌。',
        action: '嚴格禁止', actionColor: 'bg-red-600',
        desc: '這是在三麻中最容易大量失分的壞習慣！在三麻中，要攻就打出效率最高的牌（無管多危險），要守就 100% 打出現物或絕對安全牌。打「無筋生張」來兜牌只會慢性死亡。',
        tiles: []
      }
    ]
  },
  {
    category: '⚔️ 先制攻擊判斷 (Preemptive Attack)',
    items: [
      {
        title: '先制好型立直 (Good Wait Preemptive)',
        situation: '場上無人立直，你聽牌了，且是兩面以上的好型。',
        action: '⚡ 絕對立直', actionColor: 'bg-emerald-600',
        desc: '毫無懸念。三麻的先制立直具備極強的壓制力。即使只有 1 翻，只要是好型，局收支絕對是巨大的正數。千萬不要為了「等變化」而默聽。',
        tiles: ['4p', '5p']
      },
      {
        title: '先制愚型立直 (Bad Wait Preemptive)',
        situation: '場上無人立直，你聽牌了，但只是嵌張或邊張，且有 1~2 翻（含寶牌）。',
        action: '⚡ 積極立直', actionColor: 'bg-emerald-600',
        desc: '新手常犯的錯是「愚型不敢立直」。《數據制勝》指出，只要你不是 0 翻，先制愚型立直的局收支依然為正。立直的威懾力能逼迫對手棄和，從而增加你的自摸率。',
        tiles: ['3s', '5s']
      },
      {
        title: '一向聽的極限等待 (Waiting for Tenpai)',
        situation: '手牌是一向聽，且擁有多面進張的「完全一向聽」形狀。',
        action: '🔥 追求最大牌效', actionColor: 'bg-orange-500',
        desc: '在沒有受到威脅時，不要隨意拆解強力的複合形（如中膨或兩嵌）。最大化進張數，以最快速度進入先制立直的狀態。',
        tiles: ['3p', '5p', '7p']
      }
    ]
  },
  {
    category: '🛡️ 面對立直的被動應對 (Facing Riichi)',
    items: [
      {
        title: '聽牌對決：好型 ＆ 中高打點',
        situation: '對手已立直。你也聽牌了，聽兩面，且預估打點在滿貫(4翻)左右。',
        action: '🔥 強勢對攻', actionColor: 'bg-red-600',
        desc: '這就是所謂的「對攻局」。根據數據，好型聽牌且具備滿貫打點時，追立直或硬拼危險牌的局收支為正，絕對不能退縮。',
        tiles: ['6m', '7m', '0p', '1z'] 
      },
      {
        title: '聽牌對決：愚型 ＆ 低打點',
        situation: '對手已立直。你聽牌了，但只聽嵌張/邊張，且只有 1 翻。',
        action: '🛑 果斷棄和', actionColor: 'bg-slate-700',
        desc: '局收支為嚴重的負數！你和牌率極低，放銃卻可能包賠滿貫以上的點數。此時請立刻放棄聽牌，打出絕對安全的現物。',
        tiles: ['1s', '2s']
      },
      {
        title: '一向聽面對立直 (1-Shanten vs Riichi)',
        situation: '對手立直，你還差一張才聽牌 (一向聽)。',
        action: '🛑 預設棄和', actionColor: 'bg-slate-700',
        desc: '《數據制勝》的鐵則：在三麻中，從「一向聽」硬拼別人的「立直」，期望值幾乎永遠是負的（除非你確定自己聽牌後是跳滿以上的神牌）。預設動作就是拆牌防守。',
        tiles: []
      }
    ]
  },
  {
    category: '🛑 三麻特化防禦與迷思 (Sanma Defense)',
    items: [
      {
        title: '徹底防守優先序 (Betaori Priority)',
        situation: '決定棄和時，選擇打哪張牌。',
        action: '🛡️ 100% 安全牌', actionColor: 'bg-blue-600',
        desc: '只打絕對安全的牌。順序為：1. 該家立直後的現物 2. 兩家共同的現物 3. 場上已出現 3 張以上的客風字牌。絕不打「感覺比較安全」的生張數牌。',
        tiles: ['1z', '2z']
      },
      {
        title: '拔北寶牌的威脅通膨 (Kita Inflation)',
        situation: '對手拔了 2 張北風，然後宣告立直。',
        action: '⚠️ 防禦標準提高', actionColor: 'bg-yellow-600',
        desc: '三麻的打點極易膨脹。對手每拔一張北，其平均打點就增加約 1.5 翻。面對拔北多次的對手，你的對攻門檻必須大幅提高（例如要求自己也必須是滿貫好型才敢拼）。',
        tiles: ['4z', '4z']
      },
      {
        title: '筋牌 (Suji) 的可靠度下降',
        situation: '對手打過 4筒，你想跟打 1筒 來防守。',
        action: '⚠️ 謹慎使用', actionColor: 'bg-yellow-600',
        desc: '在四麻中，筋牌相對安全。但在三麻中，因為去除了 2~8萬，剩下的牌很容易形成「嵌張」、「邊張」或「雙碰」聽牌。筋牌(Suji)只能防兩面聽，在三麻的防禦力大打折扣。',
        tiles: ['4p', '1p']
      }
    ]
  }
];

// ============================================================================
// [3] MAHJONG ENGINE (核心算分與推演引擎)
// ============================================================================
const MahjongEngine = {
  sortHand: (hand) => {
    if (!hand || !Array.isArray(hand)) return [];
    const suitOrder = { 'm': 0, 'p': 1, 's': 2, 'z': 3 };
    const getVal = (t) => { let v = parseInt(t[0]); return v === 0 ? 5.5 : v; };
    return [...hand].sort((a, b) => {
      const suitA = a.slice(-1);
      const suitB = b.slice(-1);
      if (suitOrder[suitA] !== suitOrder[suitB]) return suitOrder[suitA] - suitOrder[suitB];
      return getVal(a) - getVal(b);
    });
  },

  isTileDora: (tile, indicators) => {
    if (!tile) return false;
    if (tile[0] === '0') return true;
    if (!indicators) return false;
    const indArray = Array.isArray(indicators) ? indicators : [indicators];
    for (let ind of indArray) {
       const doraTile = MahjongEngine.getDoraTile(ind);
       if (tile === doraTile) return true;
       if (doraTile && doraTile[0] === '5' && tile[0] === '0' && tile[1] === doraTile[1]) return true;
    }
    return false;
  },

  isAgari: (hand, openMeldCount = 0) => {
    if (hand.length + openMeldCount * 3 !== 14) return false;
    const counts = {};
    hand.forEach(t => {
       const normT = t[0] === '0' ? `5${t[1]}` : t;
       counts[normT] = (counts[normT] || 0) + 1;
    });
    if (openMeldCount === 0 && Object.values(counts).filter(c => c === 2).length === 7) return true;

    const targetMentsu = 4 - openMeldCount;
    const checkMentsu = (dict, depth) => {
      if (depth === targetMentsu) return true;
      let firstTile = null;
      for (let s of ['m', 'p', 's', 'z']) {
        for (let r = 1; r <= 9; r++) {
          const t = `${r}${s}`;
          if (dict[t] > 0) { firstTile = t; break; }
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

      if (s === 'p' || s === 's') {
        if (r <= 7) {
          const t2 = `${r+1}${s}`;
          const t3 = `${r+2}${s}`;
          if (dict[firstTile] > 0 && dict[t2] > 0 && dict[t3] > 0) {
            dict[firstTile]--;
            dict[t2]--; dict[t3]--;
            if (checkMentsu(dict, depth + 1)) return true;
            dict[firstTile]++; dict[t2]++; dict[t3]++;
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
    
    if (context?.rivers) context.rivers.forEach(r => r.forEach(t => visibleCounts[t] = (visibleCounts[t] || 0) + 1));
    if (context?.openMelds) context.openMelds.forEach(mList => mList.forEach(m => visibleCounts[m.tile] = (visibleCounts[m.tile] || 0) + (m.type.includes('kan')?4:3)));
    if (context?.kitas) context.kitas.forEach(kList => kList.forEach(t => visibleCounts[t] = (visibleCounts[t] || 0) + 1));
    if (context?.doraInd) visibleCounts[context.doraInd] = (visibleCounts[context.doraInd] || 0) + 1;

    hand13.forEach(t => visibleCounts[t] = (visibleCounts[t] || 0) + 1);
    const getRem = (r, s) => {
        if (r < 1 || r > 9) return 0;
        if (r === 5 && (s === 'p' || s === 's')) {
            const normalRem = Math.max(0, 2 - (visibleCounts[`5${s}`] || 0));
            const redRem = Math.max(0, 2 - (visibleCounts[`0${s}`] || 0));
            return normalRem + redRem;
        }
        const t = `${r}${s}`;
        return Math.max(0, 4 - (visibleCounts[t] || 0));
    };
    for (let s of ['m', 'p', 's', 'z']) {
        for (let r = 1; r <= 9; r++) {
            if (s === 'm' && r > 1 && r < 9) continue;
            if (s === 'z' && r > 7) continue;
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

  generateRandomDeck: () => {
    let deck = [];
    SANMA_TILE_SET.forEach(t => { 
        if (t === '5p' || t === '5s') {
            deck.push(t); deck.push(t); 
            const redT = `0${t[1]}`;
            deck.push(redT); deck.push(redT); 
        } else {
            for(let i=0; i<4; i++) deck.push(t); 
        }
    });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  },

  getDoraTile: (indicator) => {
    if (!indicator) return null;
    const rank = parseInt(indicator[0]);
    const suit = indicator[1];
    if (suit === 'm') return rank === 1 ? '9m' : '1m';
    if (suit === 'p' || suit === 's') return rank === 9 ? `1${suit}` : `${rank + 1}${suit}`;
    if (suit === 'z') {
      if (rank <= 4) return rank === 4 ? '1z' : `${rank + 1}z`; 
      return rank === 7 ? '5z' : `${rank + 1}z`;
    }
    return null;
  },

  estimateHandValue: (hand, melds, kitas, doraInd) => {
     let han = 0;
     const counts = {};
     hand.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
     melds.forEach(m => { counts[m.tile] = (counts[m.tile] || 0) + 3; });
     
     const doraTile = MahjongEngine.getDoraTile(doraInd);
     hand.forEach(t => {
        if (t[0] === '0') han++;
        if (doraTile && (t === doraTile || (doraTile[0] === '5' && t[0] === '0' && t[1] === doraTile[1]))) han++;
     });
     melds.forEach(m => {
        if (m.tile[0] === '0') han += 3;
        if (doraTile && (m.tile === doraTile || (doraTile[0] === '5' && m.tile[0] === '0' && m.tile[1] === doraTile[1]))) han += 3;
     });
     han += kitas.length; 
     if (melds.length === 0) han += 1; 
     return han;
  },

  evaluateTacticalStance: (playerHand, playerMelds, playerKitas, aiStates, context) => {
     let maxThreat = 0;
     let threatDetails = [];
     let logicSteps = []; 
     
     aiStates.forEach((ai, idx) => {
        let threat = 0;
        let reasons = [];
        if (ai.isRiichi) { threat += 100; reasons.push('立直'); }
        if (ai.melds.length >= 2) { threat += 40; reasons.push('多次副露'); }
        
        let visibleDora = ai.kitas.length;
        ai.melds.forEach(m => {
           if (m.tile[0] === '0') visibleDora++;
           if (MahjongEngine.isTileDora(m.tile, context.doraInd)) visibleDora += 3;
        });
        if (visibleDora >= 3) { threat += 50; reasons.push(`寶牌滿載(${visibleDora}張)`); }

        if (threat > 0) {
            maxThreat = Math.max(maxThreat, threat);
            threatDetails.push({ name: idx === 0 ? '下家' : '上家', reasons });
        }
     });

     const isTenpaiInfo = MahjongEngine.getTenpaiUkeire(playerHand, playerMelds.length, context);
     const estHan = MahjongEngine.estimateHandValue(playerHand, playerMelds, playerKitas, context.doraInd);

     logicSteps.push(`🔍 己方狀態：${isTenpaiInfo.isTenpai ? '已聽牌' : '未聽牌'}，潛在打點預估 ${estHan} 翻。`);
     if (threatDetails.length > 0) {
         const threatDesc = threatDetails.map(t => `${t.name}(${t.reasons.join(' + ')})`).join('、');
         logicSteps.push(`⚠️ 敵方動向：偵測到威脅來源 [${threatDesc}]。`);
     } else {
         logicSteps.push(`✅ 敵方動向：目前無人立直或明顯大牌副露，場況平穩。`);
     }

     let stance = 'attack';
     let label = '🏃 推進牌效'; 
     let color = 'emerald-500';
     let desc = `目前無明顯威脅，請專注於最大化進張數，盡快推進至聽牌。`;

     if (maxThreat >= 100) {
        if (isTenpaiInfo.isTenpai && estHan >= 3) {
            stance = 'attack';
            label = '🔥 強勢對攻'; color = 'red-500';
            desc = `敵方立直！但我方已聽牌且打點足夠 (${estHan}翻+)，局收支為正，建議硬拼對攻！`;
            logicSteps.push(`💡 決策理論：《數據制勝》指出，聽牌且具備滿貫級別打點時，與先制立直對攻的局收支期望值為正。`);
        } else if (isTenpaiInfo.isTenpai) {
            stance = 'caution';
            label = '⚠️ 條件對攻'; color = 'yellow-500';
            desc = `敵方立直。我方雖聽牌但打點偏低 (預估 ${estHan} 翻)，請視巡目與危險牌決定是否硬拼。`;
            logicSteps.push(`💡 決策理論：我方雖聽牌但打點不足，硬拼風險偏高。若摸入生張或無筋危險牌，應隨時準備轉為防守。`);
        } else {
            stance = 'defend';
            label = '🛡️ 絕對防守'; color = 'blue-500';
            desc = `敵方強烈威脅！我方尚未聽牌且局收支極差，根據《數據制勝》強烈建議棄和防守 (Fold)。`;
            logicSteps.push(`💡 決策理論：《數據制勝》強調「未聽牌面對先制立直，局收支為嚴重負數」。此時應徹底放棄自身牌效，優先打出安全牌 (現物 > 兩家安全牌 > 字牌)。`);
        }
     } else if (maxThreat >= 40) {
        if (isTenpaiInfo.isTenpai || estHan >= 4) {
            stance = 'attack';
            label = '⚔️ 保持進攻'; color = 'emerald-500';
            desc = `敵方有一定威脅 (${threatDetails[0]?.reasons.join(',')})，但我方牌力佳，維持進攻。`;
            logicSteps.push(`💡 決策理論：敵方疑似染手或有寶牌，但我方手牌價值極高，具備對攻資本，不應輕易退縮拆牌。`);
        } else {
            stance = 'caution';
            label = '👀 謹慎行事'; color = 'yellow-500';
            desc = `敵方副露或寶牌較多，注意防守染手或大牌，不宜隨意打生張危險牌。`;
            logicSteps.push(`💡 決策理論：我方尚未聽牌且價值普通。敵方已有大牌徵兆，應開始扣留危險的生張牌，避免放銃。`);
        }
     } else if (isTenpaiInfo.isTenpai) {
        stance = 'attack';
        label = '🎯 準備收網'; color = 'emerald-500';
        desc = `場況平穩，我方已聽牌！隨時準備立直或和牌。`;
        logicSteps.push(`💡 決策理論：我方先制聽牌，擁有主動權。請考慮是否滿足立直條件以壓制對手。`);
     } else {
        logicSteps.push(`💡 決策理論：目前為序盤或平穩期，核心策略為落實「五搭子理論」，快速將手牌整理至一向聽。`);
     }

     return { stance, label, color, desc, estHan, isTenpai: isTenpaiInfo.isTenpai, threats: threatDetails, logicSteps };
  },

  getSafetyScore: (hand, threatRivers, context) => {
    const scores = {};
    const visibleCounts = {};
    if (context?.doraInd) visibleCounts[context.doraInd] = 1;
    if (context?.rivers) context.rivers.forEach(r => r.forEach(t => visibleCounts[t] = (visibleCounts[t] || 0) + 1));
    if (context?.openMelds) context.openMelds.forEach(mList => mList.forEach(m => visibleCounts[m.tile] = (visibleCounts[m.tile] || 0) + (m.type.includes('kan')?4:3)));
    if (context?.kitas) context.kitas.forEach(kList => kList.forEach(t => visibleCounts[t] = (visibleCounts[t] || 0) + 1));
    
    hand.forEach((tile, idx) => {
        let danger = 50;
        const rank = tile[0] === '0' ? 5 : parseInt(tile[0]);
        const suit = tile.slice(-1);
        const normTile = `${rank}${suit}`;

        const inAllThreats = threatRivers.length > 0 && threatRivers.every(r => r.includes(normTile) || r.includes(tile) || (rank===5 && r.includes(`0${suit}`)));
        const inSomeThreats = threatRivers.length > 0 && threatRivers.some(r => r.includes(normTile) || r.includes(tile) || (rank===5 && r.includes(`0${suit}`)));

        if (inAllThreats) danger = 0;
        else if (inSomeThreats) danger = 10;
        else if (suit === 'z') {
            const rem = 4 - (visibleCounts[tile] || 0) - hand.filter(t => t === tile).length;
            danger = rem === 0 ? 5 : (rem === 1 ? 15 : 30);
        } else {
            let isSuji = false;
            if (rank === 1 && threatRivers.some(r => r.includes(`4${suit}`))) isSuji = true;
            if (rank === 2 && threatRivers.some(r => r.includes(`5${suit}`) || r.includes(`0${suit}`))) isSuji = true;
            if (rank === 3 && threatRivers.some(r => r.includes(`6${suit}`))) isSuji = true;
            if (rank === 4 && threatRivers.some(r => r.includes(`7${suit}`))) isSuji = true;
            if (rank === 5 && threatRivers.some(r => r.includes(`2${suit}`)) && threatRivers.some(r => r.includes(`8${suit}`))) isSuji = true;
            if (rank === 6 && threatRivers.some(r => r.includes(`3${suit}`))) isSuji = true;
            if (rank === 7 && threatRivers.some(r => r.includes(`4${suit}`))) isSuji = true;
            if (rank === 8 && threatRivers.some(r => r.includes(`5${suit}`) || r.includes(`0${suit}`))) isSuji = true;
            if (rank === 9 && threatRivers.some(r => r.includes(`6${suit}`))) isSuji = true;
            
            if (isSuji) danger = (rank === 1 || rank === 9) ? 15 : (rank === 2 || rank === 8 ? 20 : 35);
            else danger = (rank === 1 || rank === 9) ? 40 : (rank === 2 || rank === 8 ? 50 : 75);
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
    if (context?.rivers) context.rivers.forEach(r => r.forEach(t => visibleCounts[t] = (visibleCounts[t] || 0) + 1));
    if (context?.openMelds) context.openMelds.forEach(mList => mList.forEach(m => visibleCounts[m.tile] = (visibleCounts[m.tile] || 0) + (m.type.includes('kan')?4:3)));
    if (context?.kitas) context.kitas.forEach(kList => kList.forEach(t => visibleCounts[t] = (visibleCounts[t] || 0) + 1));
    
    const getRem = (r, s) => {
        if (r < 1 || r > 9) return 0;
        if (r === 5 && (s === 'p' || s === 's')) {
            const normalRem = Math.max(0, 2 - (visibleCounts[`5${s}`] || 0) - hand.filter(x => x === `5${s}`).length);
            const redRem = Math.max(0, 2 - (visibleCounts[`0${s}`] || 0) - hand.filter(x => x === `0${s}`).length);
            return normalRem + redRem;
        }
        return Math.max(0, 4 - (visibleCounts[`${r}${s}`] || 0) - hand.filter(x => x === `${r}${s}`).length);
    };

    hand.forEach((tile, idx) => {
      let score = 0;
      const rank = tile[0] === '0' ? 5 : parseInt(tile[0]);
      const suit = tile.slice(-1);
      const selfRem = tile[0] === '0' || rank === 5 ? getRem(5, suit) : Math.max(0, 4 - (visibleCounts[tile] || 0) - hand.filter(x => x === tile).length);

      if (suit === 'z') {
         const isYakuhai = tile === context?.pWind || tile === context?.sWind || rank >= 5;
         score += isYakuhai ? (0.5 + selfRem * 0.2) : (0.1 + selfRem * 0.1); 
      } else if (suit === 'm') {
         score += 0.0;
      } else {
         if (rank >= 3 && rank <= 7) score += 0.3 + selfRem * 0.1; 
         else if (rank === 2 || rank === 8) score += 0.1 + selfRem * 0.05; 
         else score += 0.05 + selfRem * 0.05; 
      }

      if (tile[0] === '0') score += 1.5; 
      if (doraTile && (tile === doraTile || (doraTile[0] === '5' && tile[0] === '0' && tile[1] === doraTile[1]))) score += 3.5; 

      const c = hand.filter(t => (t[0] === '0' ? 5 : parseInt(t[0])) === rank && t.slice(-1) === suit).length;
      const has = (r) => hand.some(t => (t[0] === '0' ? 5 : parseInt(t[0])) === r && t.slice(-1) === suit);
      
      if (suit === 'z') {
         const isYakuhai = tile === context?.pWind || tile === context?.sWind || rank >= 5;
         if (c >= 3) score += 8.0;
         else if (c === 2) score += (isYakuhai ? 6.0 : 4.0) * (selfRem > 0 ? 1 : 0.5);
      } else if (suit === 'm') {
         if (c >= 3) score += 6.0;
         else if (c === 2) score += 2.0 * (selfRem > 0 ? 1 : 0.5);
      } else {
         const isShuntsu = (has(rank - 1) && has(rank - 2)) || (has(rank - 1) && has(rank + 1)) || (has(rank + 1) && has(rank + 2));
         if (isShuntsu) score = Math.max(score, 8.0); 
         if (c >= 3) score = Math.max(score, 6.0);
         else if (c === 2) score = Math.max(score, 3.5 * (selfRem > 0 ? 1 : 0.4));
         
         if (has(rank - 1)) {
            const targetRem = getRem(rank - 2, suit) + getRem(rank + 1, suit);
            score = Math.max(score, (rank - 1 === 1 || rank === 9 ? 1.0 : 1.5) + targetRem * 0.5);
         }
         if (has(rank + 1)) {
            const targetRem = getRem(rank - 1, suit) + getRem(rank + 2, suit);
            score = Math.max(score, (rank === 1 || rank + 1 === 9 ? 1.0 : 1.5) + targetRem * 0.5);
         }
         if (has(rank - 2)) {
            const targetRem = getRem(rank - 1, suit);
            score = Math.max(score, (rank - 2 === 1 || rank === 9 ? 0.8 : 1.2) + targetRem * 0.5);
         }
         if (has(rank + 2)) {
            const targetRem = getRem(rank + 1, suit);
            score = Math.max(score, (rank === 1 || rank + 2 === 9 ? 0.8 : 1.2) + targetRem * 0.5);
         }
      }
      scores[idx] = score;
    });
    return scores;
  },

  analyzeDiscard: (hand, discardIndex, context, stance = 'attack', threatRivers = [], openMeldCount = 0) => {
    let finalScores = {};
    let anyTenpai = false;
    let tenpaiData = {};

    if (stance === 'defend') {
        finalScores = MahjongEngine.getSafetyScore(hand, threatRivers, context);
    } else {
        finalScores = MahjongEngine.getAdjacencyScore(hand, context);
        hand.forEach((tile, idx) => {
           const hand13 = [...hand];
           hand13.splice(idx, 1);
           const res = MahjongEngine.getTenpaiUkeire(hand13, openMeldCount, context);
           if (res.isTenpai) {
               anyTenpai = true;
               tenpaiData[idx] = { ukeire: res.ukeire, waitingTiles: res.waitingTiles };
           }
        });
        
        if (anyTenpai) {
           hand.forEach((_, idx) => {
              if (tenpaiData[idx] !== undefined) finalScores[idx] = -1000 - tenpaiData[idx].ukeire; 
              else finalScores[idx] = 1000; 
           });
        }
    }

    let minScore = Infinity;
    let bestDiscards = [];
    Object.entries(finalScores).forEach(([idx, score]) => {
      if (score < minScore) { minScore = score; bestDiscards = [parseInt(idx)]; } 
      else if (score === minScore) { bestDiscards.push(parseInt(idx)); }
    });
    const userScore = discardIndex !== null ? finalScores[discardIndex] : 0;
    const isOptimal = (userScore - minScore) < 0.05;
    
    return { 
      isOptimal, bestDiscards, userScore, optimalScore: minScore, allScores: finalScores,
      isTenpai: anyTenpai, tenpaiData, stance
    };
  },

  calculateScore: (hand, melds, kitas, winTile, isTsumo, isRiichi, isDealer, pWind, sWind, doraInd, deckRemainder = 10) => {
     let isYakuman = false;
     const normHand = hand.map(t => t[0] === '0' ? `5${t[1]}` : t);
     const normWinTile = winTile[0] === '0' ? `5${winTile[1]}` : winTile;
     const counts = {};
     normHand.forEach(t => counts[t] = (counts[t] || 0) + 1);
     const fullCounts = { ...counts };
     melds.forEach(m => {
        const t = m.tile[0] === '0' ? `5${m.tile[1]}` : m.tile;
        fullCounts[t] = (fullCounts[t] || 0) + (m.type.includes('kan') ? 4 : 3);
     });
     
     const yaochu = ['1m','9m','1p','9p','1s','9s','1z','2z','3z','4z','5z','6z','7z'];
     if (melds.length === 0) {
        let isKokushiLocal = true, hasKokushiPair = false;
        for (let y of yaochu) {
           if (!counts[y]) { isKokushiLocal = false; break; }
           if (counts[y] === 2) hasKokushiPair = true;
        }
        if (isKokushiLocal && hasKokushiPair) return MahjongEngine._buildScoreResult([{name: '國士無雙', han: 13}], 13, 20, isTsumo, isDealer, true);
        
        const checkChuuren = (suit) => {
           const req = {1:3, 2:1, 3:1, 4:1, 5:1, 6:1, 7:1, 8:1, 9:3};
           for (let r=1; r<=9; r++) if ((counts[`${r}${suit}`] || 0) < req[r]) return false;
           return true;
        };
        if (checkChuuren('p') || checkChuuren('s')) return MahjongEngine._buildScoreResult([{name: '九蓮寶燈', han: 13}], 13, 20, isTsumo, isDealer, true);
     }

     let isChiitoitsu = melds.length === 0 && Object.values(counts).filter(c => c === 2).length === 7;
     let partitions = [];
     const dfs = (dict, currentPart, depth) => {
        if (depth === 0) { partitions.push([...currentPart]); return; }
        let firstT = null;
        for (let s of ['m', 'p', 's', 'z']) {
           for (let r=1; r<=9; r++) if (dict[`${r}${s}`] > 0) { firstT = `${r}${s}`; break; }
           if (firstT) break;
        }
        if (!firstT) return;
        const r = parseInt(firstT[0]), s = firstT[1];
        
        if (dict[firstT] >= 3) {
           dict[firstT] -= 3;
           dfs(dict, [...currentPart, { type: 'koutsu', tile: firstT, isAnkou: true }], depth - 1);
           dict[firstT] += 3;
        }
        if ((s === 'p' || s === 's') && r <= 7) {
           const t2 = `${r+1}${s}`, t3 = `${r+2}${s}`;
           if (dict[firstT] > 0 && dict[t2] > 0 && dict[t3] > 0) {
               dict[firstT]--; dict[t2]--; dict[t3]--;
               dfs(dict, [...currentPart, { type: 'shuntsu', tiles: [firstT, t2, t3], isAnkou: false }], depth - 1);
               dict[firstT]++; dict[t2]++; dict[t3]++;
           }
        }
     };
     
     if (!isChiitoitsu) {
        for (let t in counts) {
           if (counts[t] >= 2) {
              counts[t] -= 2;
              dfs(counts, [{ type: 'jantou', tile: t }], 4 - melds.length);
              counts[t] += 2;
           }
        }
     }

     const formattedMelds = melds.map(m => {
        const t = m.tile[0] === '0' ? `5${m.tile[1]}` : m.tile;
        return { type: m.type.includes('kan') ? 'kantsu' : 'koutsu', tile: t, isAnkou: m.type === 'ankan' };
     });
     
     const evaluatePartition = (part) => {
        let y = [], h = 0, f = 20, isYkm = false;
        const full = [...part, ...formattedMelds];
        
        let isPinfu = false;
        if (melds.length === 0 && part.filter(p => p.type === 'shuntsu').length === 4) {
           const jTile = part.find(p => p.type === 'jantou').tile;
           if (jTile !== pWind && jTile !== sWind && !(parseInt(jTile[0])>=5 && jTile[1]==='z')) {
              for (let p of part) {
                 if (p.type === 'shuntsu' && p.tiles.includes(normWinTile)) {
                    const r = parseInt(p.tiles[0][0]), wR = parseInt(normWinTile[0]);
                    if ((wR === r+2 && r>=2) || (wR === r && r+2<=8)) { isPinfu = true; break; }
                 }
              }
           }
        }
        if (isPinfu) { y.push({name: '平和', han: 1}); h += 1; }

        ['1z','2z','3z','4z','5z','6z','7z'].forEach(z => {
           if (fullCounts[z] >= 3 && (z===pWind || z===sWind || parseInt(z[0])>=5)) {
              y.push({name: `役牌：${TILE_LABELS[z]}`, han: 1}); h += 1;
           }
        });
        if (Object.keys(fullCounts).every(t => !t.includes('1') && !t.includes('9') && !t.includes('z'))) { y.push({name: '斷么九', han: 1}); h += 1; }

        if (melds.length === 0) {
           const sStrs = part.filter(p => p.type === 'shuntsu').map(p => p.tiles.join(''));
           let pCount = 0;
           [...new Set(sStrs)].forEach(s => { const c = sStrs.filter(x=>x===s).length; pCount += (c>=4 ? 2 : (c>=2 ? 1 : 0)); });
           if (pCount === 2) { y.push({name: '兩盃口', han: 3}); h += 3; }
           else if (pCount === 1) { y.push({name: '一盃口', han: 1}); h += 1; }
        }

        if (full.filter(p => p.type.includes('kou') || p.type.includes('kan')).length === 4) { y.push({name: '對對和', han: 2}); h += 2; }

        let aCount = full.filter(p => p.isAnkou).length;
        if (!isTsumo) {
           for (let p of part) if (p.type === 'koutsu' && p.tile === normWinTile && p.isAnkou) { aCount--; break; }
        }
        if (aCount === 4) { y.push({name: '四暗刻', han: 13}); isYkm = true; }
        else if (aCount === 3) { y.push({name: '三暗刻', han: 2}); h += 2; }

        const hasP = Object.keys(fullCounts).some(t => t.includes('p')), hasS = Object.keys(fullCounts).some(t => t.includes('s')), hasZ = Object.keys(fullCounts).some(t => t.includes('z'));
        if ((hasP && !hasS) || (!hasP && hasS)) { y.push({name: hasZ ? '混一色' : '清一色', han: hasZ ? (melds.length?2:3) : (melds.length?5:6)}); h += hasZ ? (melds.length?2:3) : (melds.length?5:6); }

        if (Object.keys(fullCounts).every(t => t.includes('1') || t.includes('9') || t.includes('z'))) {
           if (hasZ) { y.push({name: '混老頭', han: 2}); h += 2; } else { y.push({name: '清老頭', han: 13}); isYkm = true; }
        }

        let zTrip=0, zPair=0;
        ['5z','6z','7z'].forEach(z => { if(fullCounts[z]>=3)zTrip++; else if(fullCounts[z]===2)zPair++; });
        if(zTrip===3){ y.push({name: '大三元', han: 13}); isYkm=true; } else if(zTrip===2&&zPair===1){ y.push({name: '小三元', han: 2}); h+=2; }

        if (Object.keys(fullCounts).every(t => t.includes('z'))) { y.push({name: '字一色', han: 13}); isYkm = true; }
        if (Object.keys(fullCounts).every(t => ['2s','3s','4s','6s','8s','6z'].includes(t))) { y.push({name: '綠一色', han: 13}); isYkm = true; }

        for (let n=1; n<=9; n++) if (fullCounts[`${n}m`]>=3 && fullCounts[`${n}p`]>=3 && fullCounts[`${n}s`]>=3) { y.push({name: '三色同刻', han: 2}); h+=2; break; }

        let kCount = full.filter(p => p.type==='kantsu').length;
        if(kCount===4){ y.push({name: '四槓子', han: 13}); isYkm=true; } else if(kCount===3){ y.push({name: '三槓子', han: 2}); h+=2; }

        let wTrip=0, wPair=0; ['1z','2z','3z','4z'].forEach(z => { if(fullCounts[z]>=3)wTrip++; else if(fullCounts[z]===2)wPair++; });
        if(wTrip===4){ y.push({name: '大四喜', han: 13}); isYkm=true; } else if(wTrip===3&&wPair===1){ y.push({name: '小四喜', han: 13}); isYkm=true; }

        if (!isTsumo && melds.length === 0 && isPinfu) f = 30;
        else if (isTsumo && isPinfu) f = 20;
        else {
           f = 20;
           if (!isTsumo && melds.length === 0) f += 10;
           if (!isPinfu) f += 2;
           const jt = full.find(p=>p.type==='jantou')?.tile;
           if (jt===pWind||jt===sWind||(jt&&parseInt(jt[0])>=5)) { f+=2; if(jt===pWind&&jt===sWind)f+=2; }
           full.forEach(p => {
              if (p.type.includes('kou')||p.type.includes('kan')) {
                 let pf = p.type==='kantsu'?8:2;
                 if (p.tile.includes('1')||p.tile.includes('9')||p.tile.includes('z')) pf*=2;
                 if (p.isAnkou && (isTsumo || p.tile!==normWinTile)) pf*=2;
                 f += pf;
              }
           });
           if (isTsumo) f += 2;
           f = Math.ceil(f/10)*10; if (f<30) f=30;
        }
        return { yaku: y, han: h, fu: f, isYakuman: isYkm };
     };
     
     let best = { yaku: [], han: 0, fu: 0, isYakuman: false };
     if (isChiitoitsu) {
        let y=[{name:'七對子', han:2}], h=2, isYkm=false;
        if (Object.keys(fullCounts).every(t=>!t.includes('1')&&!t.includes('9')&&!t.includes('z'))){y.push({name:'斷么九',han:1});h+=1;}
        const hasP = Object.keys(fullCounts).some(t=>t.includes('p')), hasS = Object.keys(fullCounts).some(t=>t.includes('s')), hasZ = Object.keys(fullCounts).some(t=>t.includes('z'));
        if((hasP&&!hasS)||(!hasP&&hasS)){ y.push({name:hasZ?'混一色':'清一色', han:hasZ?3:6}); h+=hasZ?3:6; }
        if (Object.keys(fullCounts).every(t=>t.includes('1')||t.includes('9')||t.includes('z'))) { if(hasZ){y.push({name:'混老頭',han:2});h+=2;} else{y.push({name:'清老頭',han:13});isYkm=true;} }
        if (Object.keys(fullCounts).every(t=>t.includes('z'))) { y.push({name:'字一色',han:13}); isYkm=true; }
        if (Object.keys(fullCounts).every(t=>['2s','3s','4s','6s','8s','6z'].includes(t))) { y.push({name:'綠一色',han:13}); isYkm=true; }
        best = { yaku: y, han: h, fu: 25, isYakuman: isYkm };
     }

     partitions.forEach(part => {
        const res = evaluatePartition(part);
        if (res.isYakuman) { if (!best.isYakuman || res.han > best.han) best = res; }
        else if (!best.isYakuman && res.han > best.han) best = res;
        else if (!best.isYakuman && res.han === best.han && res.fu > best.fu) best = res;
     });
     
     let { yaku: fYaku, han: fHan, fu: fFu, isYakuman: fYkm } = best;
     if (!fYkm) {
        if (deckRemainder === 0) { fYaku.push({name: isTsumo?'海底撈月':'河底撈魚', han: 1}); fHan+=1; }
        if (isRiichi) { fYaku.unshift({name: '立直', han: 1}); fHan+=1; }
        if (isTsumo && melds.length === 0) { fYaku.unshift({name: '門前清自摸和', han: 1}); fHan+=1; }

        let dC = kitas.length, dT = MahjongEngine.getDoraTile(doraInd);
        if (dT && fullCounts[dT]) dC += fullCounts[dT];
        let rC = hand.filter(t=>t[0]==='0').length + melds.filter(m=>m.tile[0]==='0').length;
        if (rC>0) { fYaku.push({name: '赤寶牌', han: rC}); fHan+=rC; }
        if (dC>0) { fYaku.push({name: '寶牌 (含拔北)', han: dC}); fHan+=dC; }
        
        if (fHan === 0 || fHan === dC + rC) { fYaku = [{name: '基礎役種 (補償)', han: 1}, ...fYaku]; fHan = 1 + dC + rC; }
     }

     return MahjongEngine._buildScoreResult(fYaku, fHan, fFu, isTsumo, isDealer, fYkm);
  },

  _buildScoreResult: (yakuList, han, fu, isTsumo, isDealer, isYakuman) => {
     let b=0, sStr="";
     if (isYakuman) {
         const yc = Math.floor(han/13) || 1;
         b = 8000 * yc; sStr = yc>1 ? `${yc}倍役滿` : `役滿 (Yakuman)`;
     } else {
         if(han>=13){ b=8000; sStr="累計役滿 (Kazeyakuman)"; }
         else if(han>=11){ b=6000; sStr="三倍滿 (Sanbaiman)"; }
         else if(han>=8){ b=4000; sStr="倍滿 (Baiman)"; }
         else if(han>=6){ b=3000; sStr="跳滿 (Haneman)"; }
         else if(han>=5||(han===4&&fu>=40)){ b=2000; sStr="滿貫 (Mangan)"; }
         else { b = fu*Math.pow(2,2+han); if(b>2000){ b=2000; sStr="滿貫 (Mangan)"; } else sStr=`${han} 翻 ${fu} 符`; }
     }
     let tS=0;
     if(isTsumo){
         if(isDealer){ const p=Math.ceil(b*2/100)*100; tS=p*2; sStr+=` (${p} ALL)`; }
         else { const pD=Math.ceil(b*2/100)*100, pN=Math.ceil(b/100)*100; tS=pD+pN; sStr+=` (莊 ${pD} / 子 ${pN})`; }
     } else {
         tS = Math.ceil(b*(isDealer?6:4)/100)*100;
         sStr+=` (${tS} 點)`;
     }
     return { yakuList, han, fu, totalScore: tS, scoreStr: sStr };
  }
};

// ============================================================================
// [4] UI COMPONENTS (圖形與基礎視圖)
// ============================================================================
const COLORS = { red: '#dc2626', green: '#059669', blue: '#1e3a8a', black: '#0f172a' };

const PinGraphics = React.memo(({ rank }) => {
  const Circle = ({ cx, cy, c }) => <g><circle cx={cx} cy={cy} r="14" fill={c} /><circle cx={cx} cy={cy} r="6" fill="#fff" opacity="0.4" /></g>;
  const C = COLORS; let circles = [];
  switch (rank) {
    case '1': circles = [<circle key="1" cx="50" cy="70" r="28" fill={C.red} />, <circle key="1b" cx="50" cy="70" r="10" fill="#fff" opacity="0.6" />]; break;
    case '2': circles = [[50,35,C.green], [50,105,C.blue]].map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} c={p[2]} />); break;
    case '3': circles = [[30,30,C.blue], [50,70,C.red], [70,110,C.green]].map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} c={p[2]} />); break;
    case '4': circles = [[30,35,C.blue], [70,35,C.blue], [30,105,C.blue], [70,105,C.blue]].map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} c={p[2]} />); break;
    case '5': circles = [[30,30,C.blue], [70,30,C.blue], [50,70,C.red], [30,110,C.blue], [70,110,C.blue]].map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} c={p[2]} />); break;
    case '0': circles = [[30,30,C.red], [70,30,C.red], [50,70,C.red], [30,110,C.red], [70,110,C.red]].map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} c={p[2]} />); break;
    case '6': circles = [[30,25,C.green], [70,25,C.green], [30,70,C.red], [70,70,C.red], [30,115,C.red], [70,115,C.red]].map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} c={p[2]} />); break;
    case '7': circles = [[25,25,C.green], [50,45,C.green], [75,65,C.green], [30,105,C.red], [70,105,C.red], [30,130,C.red], [70,130,C.red]].map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="11" fill={p[2]} />); break;
    case '8': circles = [[30,25], [70,25], [30,55], [70,55], [30,85], [70,85], [30,115], [70,115]].map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="12" fill={C.blue} />); break;
    case '9': circles = [25,70,115].flatMap(y => [[20,y,C.red], [50,y,C.blue], [80,y,C.green]]).map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="11" fill={p[2]} />); break;
    default: break;
  }
  return <svg viewBox="0 0 100 140" className="w-full h-full">{circles}</svg>;
});

const SouGraphics = React.memo(({ rank }) => {
  const C = COLORS;
  const Bamboo = ({ x, y, c }) => <g transform={`translate(${x},${y})`}><rect x="-6" y="-16" width="12" height="32" rx="4" fill={c} /><line x1="0" y1="-12" x2="0" y2="12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></g>;
  let elements = [];
  switch (rank) {
    case '1': elements = (<g transform="translate(10, 20)"><path d="M40 80 Q60 110 80 80 Q90 50 40 10 Q10 40 40 80 Z" fill={C.green} opacity="0.9" /><circle cx="35" cy="40" r="12" fill={C.red} /><path d="M25 35 L10 45 L25 50 Z" fill={C.blue} /></g>); break;
    case '2': elements = [[50,40,C.green], [50,100,C.blue]].map((p, i) => <Bamboo key={i} x={p[0]} y={p[1]} c={p[2]} />); break;
    case '3': elements = [[50,30,C.green], [30,105,C.blue], [70,105,C.green]].map((p, i) => <Bamboo key={i} x={p[0]} y={p[1]} c={p[2]} />); break;
    case '4': elements = [[30,40,C.green], [70,40,C.green], [30,100,C.green], [70,100,C.green]].map((p, i) => <Bamboo key={i} x={p[0]} y={p[1]} c={p[2]} />); break;
    case '5': elements = [[30,40,C.green], [70,40,C.green], [50,70,C.red], [30,100,C.green], [70,100,C.green]].map((p, i) => <Bamboo key={i} x={p[0]} y={p[1]} c={p[2]} />); break;
    case '0': elements = [[30,40,C.red], [70,40,C.red], [50,70,C.red], [30,100,C.red], [70,100,C.red]].map((p, i) => <Bamboo key={i} x={p[0]} y={p[1]} c={p[2]} />); break;
    case '6': elements = [[25,40], [50,40], [75,40], [25,100], [50,100], [75,100]].map((p, i) => <Bamboo key={i} x={p[0]} y={p[1]} c={C.green} />); break;
    case '7': elements = [<Bamboo key="top" x={50} y={30} c={C.red} />, ...[[25,85], [50,85], [75,85], [25,120], [50,120], [75,120]].map((p, i) => <Bamboo key={i} x={p[0]} y={p[1]} c={C.green} />)]; break;
    case '8': elements = [[30,25], [70,25], [30,60], [70,60], [30,95], [70,95], [30,130], [70,130]].map((p, i) => <Bamboo key={i} x={p[0]} y={p[1]} c={C.green} />); break;
    case '9': elements = [30,70,110].flatMap(y => [[25,y,C.red], [50,y,C.blue], [75,y,C.green]]).map((p, i) => <Bamboo key={i} x={p[0]} y={p[1]} c={p[2]} />); break;
    default: break;
  }
  return <svg viewBox="0 0 100 140" className="w-full h-full">{elements}</svg>;
});

const TextGraphics = React.memo(({ tile }) => {
  const rank = tile.charAt(0);
  const suit = tile.charAt(1);
  const NUMBERS = { '1': '一', '2': '二', '3': '三', '4': '四', '5': '五', '6': '六', '7': '七', '8': '八', '9': '九' };
  
  if (suit === 'm') {
    return (
      <svg viewBox="0 0 100 140" className="w-full h-full select-none">
        <text x="50" y="45%" dominantBaseline="middle" fontFamily="serif" fontSize="48" fontWeight="900" textAnchor="middle" fill="#1e293b">{NUMBERS[rank]}</text>
        <text x="50" y="85%" dominantBaseline="middle" fontFamily="serif" fontSize="56" fontWeight="900" textAnchor="middle" fill="#b91c1c">萬</text>
      </svg>
    );
  } else if (suit === 'z') {
    if (rank === '5') return <div className="w-[70%] h-[80%] border-[3px] md:border-[4px] border-slate-300 rounded-sm"></div>;
    let color = rank === '6' ? "#059669" : (rank === '7' ? "#dc2626" : "#1e293b");
    return (
      <svg viewBox="0 0 100 140" className="w-full h-full select-none">
        <text x="50" y="55%" dominantBaseline="middle" fontFamily="serif" fontSize="65" fontWeight="900" textAnchor="middle" fill={color}>{TILE_LABELS[tile]}</text>
      </svg>
    );
  }
  return null;
});

const Tile = React.memo(({ tile, onClick, isSelected, isDiscard, highlight, isDora, isJustDrawn, isRiver, className = "", small = false, faceDown = false, rotated = false }) => {
  const sizeClasses = small ? "w-8 h-11 md:w-10 md:h-14 border-b-[3px]" : "w-10 h-14 md:w-12 md:h-16 border-b-[4px]";
  const rotateClass = rotated ? "transform -rotate-90 origin-center" : "";

  if (faceDown) {
    return (
      <div className={`relative flex items-center justify-center ${sizeClasses} bg-orange-400 rounded shadow-sm border border-orange-500 border-b-orange-700 ${className}`}>
        <div className="w-full h-full opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiAvPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMDAwIiAvPgo8L3N2Zz4=')]"></div>
      </div>
    );
  }

  if (!tile) return <div className={`bg-transparent ${sizeClasses} ${className}`} />;
  const suit = tile.slice(-1);
  let bgClass = isDora ? "bg-gradient-to-br from-yellow-50 to-[#fff3c7]" : "bg-gradient-to-br from-white to-slate-50";
  let borderClass = isDora ? "border-amber-300 border-b-amber-500" : "border-slate-300 border-b-slate-400";
  let shadowClass = isRiver ? "shadow-sm" : (isDora ? "shadow-[0_0_6px_rgba(251,191,36,0.8)]" : "shadow-[0_2px_4px_rgba(0,0,0,0.2)]");
  
  if (isSelected && !small && !isRiver) {
     borderClass = "border-yellow-400 border-b-yellow-500 ring-2 ring-yellow-400";
     shadowClass = "shadow-[0_8px_10px_rgba(0,0,0,0.3)]";
  }

  return (
    <div className={`relative ${rotateClass} ${isRiver ? 'z-0' : ''}`}>
      {isJustDrawn && !small && !isRiver && (
        <div className="absolute -top-3 -right-2 bg-blue-500 text-white text-[9px] md:text-[11px] px-1.5 py-0.5 rounded shadow-md z-30 font-black border border-blue-300 animate-bounce">摸</div>
      )}
      <div onClick={() => !isRiver && onClick && onClick(tile)}
        className={`relative flex items-center justify-center ${sizeClasses} ${bgClass} rounded ${shadowClass} ${borderClass} cursor-pointer select-none transition-transform duration-100 overflow-hidden
          ${isSelected && !small && !isRiver ? 'transform -translate-y-4' : (!small && !isRiver ? 'hover:-translate-y-1 hover:z-20' : '')}
          ${isDiscard ? 'opacity-50 grayscale' : ''} ${highlight ? 'ring-2 ring-green-500 bg-green-50' : ''} ${className}`}>
        {isDora && !faceDown && <div className="absolute top-1 right-1 w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-400 rounded-full shadow-sm border-[0.5px] border-white z-0"></div>}
        <div className="w-[85%] h-[85%] flex items-center justify-center relative z-0">
          {suit === 'p' && <PinGraphics rank={tile.charAt(0)} />}
          {suit === 's' && <SouGraphics rank={tile.charAt(0)} />}
          {(suit === 'm' || suit === 'z') && <TextGraphics tile={tile} />}
        </div>
      </div>
    </div>
  );
});

const TacticalAdvisor = ({ info }) => {
  if (!info) return null;
  const colorMap = {
      'red-500': 'bg-red-50 border-red-500 text-red-900',
      'yellow-500': 'bg-yellow-50 border-yellow-500 text-yellow-900',
      'emerald-500': 'bg-emerald-50 border-emerald-500 text-emerald-900',
      'blue-500': 'bg-blue-50 border-blue-500 text-blue-900'
  };
  const iconColor = info.color.split('-')[0];
  
  return (
      <div className={`p-4 rounded-xl border-l-4 shadow-md mb-4 flex flex-col sm:flex-row gap-4 items-start animate-in fade-in slide-in-from-left-4 ${colorMap[info.color]}`}>
          <div className="flex-1 w-full">
              <div className="flex justify-between items-center mb-2 border-b pb-2 border-black/10">
                  <h4 className="font-black text-lg flex items-center gap-2"><Activity size={20} className={`text-${iconColor}-600`} /> 數據制勝：戰術雷達</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-${iconColor}-600 shadow-sm`}>{info.label}</span>
              </div>
              <p className="text-sm font-medium leading-relaxed mb-3">{info.desc}</p>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="bg-white/60 p-2 rounded border border-black/5">
                      <strong className="block text-slate-800 mb-1">自家狀態</strong>
                      <span className="font-mono text-slate-600">{info.isTenpai ? '✅ 已聽牌' : '❌ 未聽牌'} | 預估 {info.estHan} 翻</span>
                  </div>
                  <div className="bg-white/60 p-2 rounded border border-black/5">
                      <strong className="block text-slate-800 mb-1">敵方威脅分析</strong>
                      {info.threats.length === 0 ? (<span className="text-emerald-600 font-bold">目前無明顯威脅</span>) : (
                          <div className="flex flex-col gap-0.5">
                             {info.threats.map((t, i) => <span key={i} className="text-red-600 font-bold">{t.name}: {t.reasons.join(', ')}</span>)}
                          </div>
                      )}
                  </div>
              </div>
              
              {info.logicSteps && info.logicSteps.length > 0 && (
                <div className="bg-white/80 p-3 rounded-lg border border-black/10 text-xs mt-2">
                   <strong className="flex items-center gap-1.5 text-slate-800 mb-2 border-b border-black/5 pb-1.5">
                     <Lightbulb size={14} className="text-amber-500" /> AI 判斷邏輯推演
                   </strong>
                   <ul className="space-y-2">
                      {info.logicSteps.map((step, idx) => (
                         <li key={idx} className="flex items-start gap-2">
                           <span className="shrink-0 mt-0.5 opacity-70 text-[10px] bg-black/10 px-1.5 py-0.5 rounded font-mono text-slate-700">{idx + 1}</span>
                           <span className="text-slate-700 leading-relaxed font-medium">{step}</span>
                         </li>
                      ))}
                   </ul>
                </div>
              )}
          </div>
      </div>
  );
};

// ============================================================================
// [5] CUSTOM HOOKS (邏輯分離)
// ============================================================================
const useSimulation = () => {
  const [config, setConfig] = useState({ aiDiff: 3, timeLimit: 0, pWind: '1z', playerWind: '1z' });
  const [gameState, setGameState] = useState('setup');
  const [deck, setDeck] = useState([]);
  const [hands, setHands] = useState([[], [], []]);
  const [openMelds, setOpenMelds] = useState([[], [], []]); 
  const [kitas, setKitas] = useState([[], [], []]);
  const [rivers, setRivers] = useState([[], [], []]);
  const [context, setContext] = useState({ pWind: '1z', sWind: '1z', doraInd: '1p' });
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
    const fullDeck = MahjongEngine.generateRandomDeck();
    const pWind = config.pWind;
    const playerSeat = config.playerWind;
    const ai1Seat = playerSeat === '1z' ? '2z' : (playerSeat === '2z' ? '3z' : '1z');
    const ai2Seat = playerSeat === '1z' ? '3z' : (playerSeat === '2z' ? '1z' : '2z');
    const h0 = MahjongEngine.sortHand(fullDeck.splice(0, 13));
    const h1 = MahjongEngine.sortHand(fullDeck.splice(0, 13));
    const h2 = MahjongEngine.sortHand(fullDeck.splice(0, 13));
    const dora = fullDeck.pop();

    setDeck(fullDeck); 
    setHands([h0, h1, h2]); setOpenMelds([[], [], []]); setKitas([[], [], []]); setRivers([[], [], []]);
    setIsRiichi([false, false, false]); setCanRiichi(false); setPendingRiichi(false); setTacticalInfo(null); setLastDrawnTile(null);
    setContext({ pWind, sWind: playerSeat, ai1Wind: ai1Seat, ai2Wind: ai2Seat, doraInd: dora });
    setCurrentTurn(0); setWinner(null); setScoreResult(null); setActionMenu(null);
    setGameState('playing');
    
    drawTile(0, fullDeck, [h0, h1, h2], [[],[],[]], [[],[],[]], [[],[],[]], [false, false, false], { pWind, sWind: playerSeat, ai1Wind: ai1Seat, ai2Wind: ai2Seat, doraInd: dora });
  }, [config]);

  const checkSelfActions = (hand, openMeld, playerIsRiichi) => {
    const counts = {};
    hand.forEach(t => counts[t] = (counts[t] || 0) + 1);
    const canKita = counts['4z'] > 0;
    const canAnkan = !playerIsRiichi && Object.keys(counts).some(t => counts[t] === 4);
    const canKakan = !playerIsRiichi && openMeld.some(m => m.type === 'pon' && counts[m.tile] > 0);
    return { canKita, canAnkan, canKakan };
  };

  const drawTile = (playerIdx, currentDeck, currentHands, currentKitas, currentRivers, currentOpenMelds, currentIsRiichi, ctxOverride = null) => {
    if (currentDeck.length === 0) { setGameState('finished'); setWinner({ type: 'draw' }); return; }
    let d = [...currentDeck], h = [...currentHands], k = [...currentKitas], drawn = d.pop();
    while (playerIdx !== 0 && drawn === '4z' && d.length > 0) { k[playerIdx].push(drawn); drawn = d.pop(); }

    if (playerIdx === 0) setLastDrawnTile(drawn); 
    h[playerIdx] = MahjongEngine.sortHand([...h[playerIdx], drawn]);
    
    if (MahjongEngine.isAgari(h[playerIdx], currentOpenMelds[playerIdx].length)) {
      setDeck(d); setHands(h); setKitas(k);
      handleWin(playerIdx, 'tsumo', drawn, h[playerIdx], currentOpenMelds[playerIdx], k[playerIdx], currentIsRiichi[playerIdx], null, ctxOverride, d.length); return;
    }

    setDeck(d); setHands(h); setKitas(k);
    if (playerIdx === 0) {
       const activeCtx = ctxOverride || context;
       const fullCtx = { ...activeCtx, rivers: currentRivers, openMelds: currentOpenMelds, kitas: currentKitas, openMeldCount: currentOpenMelds[0].length };
       const aiStates = [
           { isRiichi: currentIsRiichi[1], melds: currentOpenMelds[1], kitas: currentKitas[1], river: currentRivers[1] },
           { isRiichi: currentIsRiichi[2], melds: currentOpenMelds[2], kitas: currentKitas[2], river: currentRivers[2] }
       ];
       const tacInfo = MahjongEngine.evaluateTacticalStance(h[0], currentOpenMelds[0], currentKitas[0], aiStates, fullCtx);
       setTacticalInfo(tacInfo);

       const threatRivers = [];
       if (tacInfo.stance === 'defend' || tacInfo.stance === 'caution') {
          if (aiStates[0].isRiichi || aiStates[0].melds.length >= 2) threatRivers.push(aiStates[0].river);
          if (aiStates[1].isRiichi || aiStates[1].melds.length >= 2) threatRivers.push(aiStates[1].river);
          if (threatRivers.length === 0) { threatRivers.push(aiStates[0].river); threatRivers.push(aiStates[1].river); }
       }
       updatePlayerWeights(h[0], fullCtx, currentOpenMelds, currentIsRiichi, tacInfo.stance, threatRivers);
       
       if (config.timeLimit > 0) setTimeLeft(config.timeLimit);
       
       const selfActs = checkSelfActions(h[0], currentOpenMelds[0], currentIsRiichi[0]);
       if (selfActs.canKita || selfActs.canAnkan || selfActs.canKakan) setActionMenu({ type: 'self_action', ...selfActs });
    }
  };

  const proceedToNextTurn = (currentPlayerIdx, d, h, r, om, k, currRiichi) => {
    const nextTurn = (currentPlayerIdx + 1) % 3;
    setCurrentTurn(nextTurn);
    drawTile(nextTurn, d, h, k, r, om, currRiichi);
  };

  const discardTile = (playerIdx, tileIndex) => {
    if (playerIdx === 0) setLastDrawnTile(null);
    if (playerIdx === 0 && pendingRiichi) { setIsRiichi(prev => { const n = [...prev]; n[0] = true; return n; }); setPendingRiichi(false); setCanRiichi(false); }

    const newHands = [...hands], newRivers = [...rivers];
    const discarded = newHands[playerIdx].splice(tileIndex, 1)[0];
    newHands[playerIdx] = MahjongEngine.sortHand(newHands[playerIdx]); 
    newRivers[playerIdx] = [...newRivers[playerIdx], discarded];
    setHands(newHands); setRivers(newRivers); setSelectedTileIndex(null);

    const latestRiichi = playerIdx === 0 && pendingRiichi ? [true, isRiichi[1], isRiichi[2]] : isRiichi;

    if (playerIdx !== 0) {
       const canRon = MahjongEngine.isAgari([...newHands[0], discarded], openMelds[0].length);
       const countInHand = newHands[0].filter(t => t === discarded).length;
       const canPon = !latestRiichi[0] && countInHand >= 2;
       const canKan = !latestRiichi[0] && countInHand === 3;
       if (canRon || canPon || canKan) { 
           setActionMenu({ type: 'discard_reaction', sourceIdx: playerIdx, tile: discarded, canRon, canPon, canKan, latestRiichi });
           return; 
       }
    } else {
       for (let i = 1; i <= 2; i++) {
         if (MahjongEngine.isAgari([...newHands[i], discarded], openMelds[i].length)) {
             handleWin(i, 'ron', discarded, [...newHands[i], discarded], openMelds[i], kitas[i], latestRiichi[i], 0, null, deck.length);
             return;
         }
       }
    }
    proceedToNextTurn(playerIdx, deck, newHands, newRivers, openMelds, kitas, latestRiichi);
  };

  const handleWin = (playerIdx, type, winTile, hand, melds, playerKitas, riichiStat, fromIdx = null, ctxOverride = null, remainDeck = 10) => {
      setActionMenu(null);
      setGameState('finished'); setWinner({ playerIdx, type, from: fromIdx });
      const activeCtx = ctxOverride || context;
      const isDealer = (playerIdx === 0 && activeCtx.sWind === '1z') || (playerIdx === 1 && activeCtx.ai1Wind === '1z') || (playerIdx === 2 && activeCtx.ai2Wind === '1z');
      const pWind = activeCtx.pWind;
      const sWind = playerIdx === 0 ? activeCtx.sWind : (playerIdx === 1 ? activeCtx.ai1Wind : activeCtx.ai2Wind);
      const scoreData = MahjongEngine.calculateScore(hand, melds, playerKitas, winTile, type === 'tsumo', riichiStat, isDealer, pWind, sWind, activeCtx.doraInd, remainDeck);
      setScoreResult(scoreData);
  };

  const executeAction = (action) => {
    const newHands = [...hands], newMelds = [...openMelds], newKitas = [...kitas], newRivers = [...rivers];
    if (action === 'ron') { handleWin(0, 'ron', actionMenu.tile, [...newHands[0], actionMenu.tile], newMelds[0], newKitas[0], isRiichi[0], actionMenu.sourceIdx, null, deck.length); return; }
    if (action === 'pon') {
       const t = actionMenu.tile;
       newHands[0].splice(newHands[0].indexOf(t), 1); newHands[0].splice(newHands[0].indexOf(t), 1);
       newMelds[0] = [...newMelds[0], { type: 'pon', tile: t, source: actionMenu.sourceIdx }]; newRivers[actionMenu.sourceIdx].pop();
       setHands(newHands); setOpenMelds(newMelds); setRivers(newRivers); setActionMenu(null);
       setCurrentTurn(0); 
       updatePlayerWeights(newHands[0], { ...context, rivers: newRivers, openMelds: newMelds, kitas: newKitas, openMeldCount: newMelds[0].length }, newMelds, isRiichi, tacticalInfo?.stance || 'attack', []); return;
    }
    if (action === 'kan_minkan') {
       const t = actionMenu.tile;
       newHands[0] = newHands[0].filter(tile => tile !== t); 
       newMelds[0] = [...newMelds[0], { type: 'kan', tile: t, source: actionMenu.sourceIdx }]; newRivers[actionMenu.sourceIdx].pop();
       setHands(newHands);
       setOpenMelds(newMelds); setRivers(newRivers); setActionMenu(null); setCurrentTurn(0); drawTile(0, deck, newHands, kitas, newRivers, newMelds, isRiichi); return;
    }
    if (action === 'ankan') {
       const counts = {};
       newHands[0].forEach(t => counts[t] = (counts[t] || 0) + 1);
       let kanTile = Object.keys(counts).find(t => counts[t] === 4);
       let isKakan = false;
       if (!kanTile) { kanTile = newMelds[0].find(m => m.type === 'pon' && counts[m.tile] > 0)?.tile; isKakan = true; }
       if (kanTile) {
           if (isKakan) {
               newHands[0].splice(newHands[0].indexOf(kanTile), 1);
               newMelds[0][newMelds[0].findIndex(m => m.type === 'pon' && m.tile === kanTile)].type = 'kan';
           } else {
               newHands[0] = newHands[0].filter(t => t !== kanTile);
               newMelds[0].push({ type: 'ankan', tile: kanTile });
           }
           setHands(newHands); setOpenMelds(newMelds); setActionMenu(null);
           drawTile(0, deck, newHands, kitas, rivers, newMelds, isRiichi); return;
       }
    }
    if (action === 'kita') {
       newHands[0].splice(newHands[0].indexOf('4z'), 1);
       newKitas[0] = [...newKitas[0], '4z'];
       setHands(newHands); setKitas(newKitas); setActionMenu(null); drawTile(0, deck, newHands, newKitas, rivers, openMelds, isRiichi); return;
    }
    if (action === 'skip') {
       const currRiichi = actionMenu.latestRiichi || isRiichi; setActionMenu(null);
       if (actionMenu.type === 'discard_reaction') proceedToNextTurn(actionMenu.sourceIdx, deck, hands, rivers, openMelds, kitas, currRiichi);
       return;
    }
  };

  const updatePlayerWeights = (hand, fullCtx, currentOpenMelds, currentIsRiichi, stance, threatRivers) => {
    const analysis = MahjongEngine.analyzeDiscard(hand, null, fullCtx, stance, threatRivers, currentOpenMelds[0].length);
    setWeights(analysis.allScores); setTenpaiMap(analysis.tenpaiData || {}); 
    if (analysis.isTenpai) { if (currentOpenMelds[0].length === 0 && !currentIsRiichi[0]) setCanRiichi(true); } 
    else { setCanRiichi(false); }
  };

  useEffect(() => {
    if (gameState === 'playing' && currentTurn === 0 && config.timeLimit > 0 && !actionMenu && !isRiichi[0]) {
      const timerId = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
             clearInterval(timerId);
             let minScore = Infinity, bestIdx = 0;
             Object.entries(weights).forEach(([idx, score]) => { if (score < minScore) { minScore = score; bestIdx = parseInt(idx); } });
             discardTile(0, bestIdx); return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [gameState, currentTurn, config.timeLimit, hands, context, actionMenu, rivers, openMelds, kitas, isRiichi, weights]);

  useEffect(() => {
    if (gameState === 'playing' && currentTurn === 0 && isRiichi[0] && !actionMenu) {
       const timer = setTimeout(() => discardTile(0, hands[0].length - 1), 800);
       return () => clearTimeout(timer);
    }
  }, [gameState, currentTurn, isRiichi, actionMenu, hands]);

  useEffect(() => {
    if (gameState === 'playing' && currentTurn !== 0 && !actionMenu) {
      const timer = setTimeout(() => {
        const aiHand = hands[currentTurn];
        const fullCtx = { ...context, rivers, openMelds, kitas, openMeldCount: openMelds[currentTurn].length };
        let discardIdx = 0;
        
        if (isRiichi[currentTurn]) discardIdx = aiHand.length - 1; 
        else {
           if (config.aiDiff === 1) discardIdx = Math.floor(Math.random() * aiHand.length);
           else {
              const isThreatened = isRiichi[(currentTurn+1)%3] || isRiichi[(currentTurn+2)%3];
              const aiStance = isThreatened ? 'defend' : 'attack';
              const aiThreats = isThreatened ? [rivers[(currentTurn+1)%3], rivers[(currentTurn+2)%3]] : [];
              const analysis = MahjongEngine.analyzeDiscard(aiHand, 0, fullCtx, aiStance, aiThreats, openMelds[currentTurn].length);
              
              if (config.aiDiff === 2) discardIdx = Math.random() > 0.3 ? analysis.bestDiscards[0] : Math.floor(Math.random() * aiHand.length);
              else {
                 discardIdx = analysis.bestDiscards[0];
                 if (openMelds[currentTurn].length === 0 && analysis.isTenpai && Math.random() > 0.1) setIsRiichi(prev => { const n = [...prev]; n[currentTurn] = true; return n; });
              }
           }
        }
        discardTile(currentTurn, discardIdx);
      }, 1200); 
      return () => clearTimeout(timer);
    }
  }, [gameState, currentTurn, hands, config, context, actionMenu, rivers, openMelds, kitas, isRiichi]);

  return {
    state: { config, gameState, deck, hands, openMelds, kitas, rivers, context, currentTurn, winner, scoreResult, selectedTileIndex, weights, tenpaiMap, timeLeft, actionMenu, isRiichi, canRiichi, pendingRiichi, tacticalInfo, lastDrawnTile },
    actions: { setConfig, startGame, setSelectedTileIndex, setPendingRiichi, discardTile, executeAction, setGameState }
  };
};

// ============================================================================
// [6] VIEW COMPONENTS (視圖分離)
// ============================================================================

const SimSetupView = ({ state, actions }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center animate-in fade-in zoom-in-95">
    <Swords size={48} className="mx-auto text-blue-600 mb-4" />
    <h2 className="text-2xl font-bold text-slate-800 mb-2">實戰對局模擬</h2>
    <p className="text-slate-600 mb-8">模擬真實三人麻將，包含鳴牌、拔北，考驗時間壓力下的牌效判斷。<br/><span className="text-emerald-600 font-bold text-sm">✨ 最新升級：防守權重引擎與摸牌標示優化</span></p>
    <div className="max-w-md mx-auto space-y-6 text-left">
      <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-2 flex items-center gap-2"><Settings size={18}/> 場風</label>
            <div className="flex bg-slate-100 rounded-lg p-1">
              {['1z', '2z'].map(w => <button key={w} onClick={() => actions.setConfig({...state.config, pWind: w})} className={`flex-1 py-2 text-sm font-bold rounded-md ${state.config.pWind === w ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-200'}`}>{w === '1z' ? '東風場' : '南風場'}</button>)}
            </div>
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-2 flex items-center gap-2"><User size={18}/> 您的座位</label>
            <div className="flex bg-slate-100 rounded-lg p-1">
              {['1z', '2z', '3z'].map(w => <button key={w} onClick={() => actions.setConfig({...state.config, playerWind: w})} className={`flex-1 py-2 text-xs font-bold rounded-md ${state.config.playerWind === w ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:bg-slate-200'}`}>{w === '1z' ? '莊家(東)' : (w==='2z' ? '子家(南)' : '子家(西)')}</button>)}
            </div>
          </div>
      </div>
      <div>
        <label className="font-bold text-slate-700 block mb-2 flex items-center gap-2"><Cpu size={18}/> 對手 AI 難度</label>
        <div className="flex bg-slate-100 rounded-lg p-1">
          {[1, 2, 3].map(lvl => <button key={lvl} onClick={() => actions.setConfig({...state.config, aiDiff: lvl})} className={`flex-1 py-2 text-sm font-bold rounded-md ${state.config.aiDiff === lvl ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-200'}`}>{lvl === 1 ? '初級' : (lvl === 2 ? '進階' : '高段')}</button>)}
        </div>
      </div>
      <div>
        <label className="font-bold text-slate-700 block mb-2 flex items-center gap-2"><Clock size={18}/> 思考時間限制</label>
        <div className="grid grid-cols-5 gap-2">
          {[0, 5, 10, 20, 30].map(time => <button key={time} onClick={() => actions.setConfig({...state.config, timeLimit: time})} className={`py-2 text-xs font-bold rounded-md border ${state.config.timeLimit === time ? 'bg-orange-500 text-white border-orange-600 shadow' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>{time === 0 ? '無限' : `${time}秒`}</button>)}
        </div>
      </div>
      <button onClick={actions.startGame} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl text-lg hover:bg-slate-800 shadow-lg transform hover:scale-105 transition-all mt-4">開始對局</button>
    </div>
  </div>
);

const SimFinishedView = ({ state, actions }) => (
  <div className="bg-slate-900 border-4 border-yellow-500 p-6 rounded-2xl shadow-2xl text-center animate-in fade-in zoom-in z-50 relative">
    <Trophy size={56} className="mx-auto text-yellow-400 mb-2 drop-shadow-lg" />
    <h2 className="text-3xl font-black text-white mb-2 tracking-widest">{state.winner.type === 'draw' ? '流局 (荒牌平局)' : `${state.winner.type === 'tsumo' ? '自摸 (Tsumo)' : '榮和 (Ron)'}`}</h2>
    <p className="text-xl text-yellow-300 font-bold mb-6">{state.winner.type !== 'draw' && `贏家: ${state.winner.playerIdx === 0 ? "您 (自家)" : (state.winner.playerIdx === 1 ? "下家 (AI)" : "上家 (AI)")}`}</p>
    {state.scoreResult && (
      <div className="bg-slate-800 p-4 rounded-xl text-left max-w-md mx-auto mb-6 border border-slate-700">
          <div className="flex justify-between items-end border-b border-slate-600 pb-2 mb-3"><div className="text-2xl font-black text-emerald-400">{state.scoreResult.scoreStr}</div></div>
          <div className="space-y-1 mb-4">{state.scoreResult.yakuList.map((y, idx) => <div key={idx} className="flex justify-between text-slate-200"><span>{y.name}</span><span className="font-mono text-yellow-400">{y.han} 翻</span></div>)}</div>
          <div className="text-right text-sm text-slate-400 font-mono pt-2 border-t border-slate-700">總計: {state.scoreResult.han} 翻 {state.scoreResult.fu} 符</div>
      </div>
    )}
    <button onClick={() => actions.setGameState('setup')} className="px-10 py-4 bg-yellow-500 text-slate-900 rounded-full font-black text-lg hover:bg-yellow-400 transition transform hover:scale-105 shadow-lg shadow-yellow-500/20">再來一局</button>
  </div>
);

const SimActionMenu = ({ state, actions }) => {
  const checkDora = (t) => MahjongEngine.isTileDora(t, state.context.doraInd);
  const getPlayerName = (idx) => idx === 0 ? "您 (自家)" : (idx === 1 ? "下家 (AI)" : "上家 (AI)");
  
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 p-8 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] z-50 flex flex-col items-center border-2 border-slate-600 animate-in zoom-in-90 min-w-[320px]">
        {state.actionMenu.type === 'discard_reaction' ? (
          <>
              {state.actionMenu.canRon && <div className="absolute -top-4 bg-red-600 text-white font-black px-6 py-1.5 rounded-full shadow-lg animate-bounce text-sm tracking-widest">絕佳機會！</div>}
              <h3 className="text-slate-300 font-bold mb-4 text-sm md:text-base text-center">{getPlayerName(state.actionMenu.sourceIdx)} 打出了</h3>
              <div className="mb-6 transform scale-125"><Tile tile={state.actionMenu.tile} isDora={checkDora(state.actionMenu.tile)} /></div>
              <div className="flex gap-3 w-full justify-center">
                {state.actionMenu.canRon && <button onClick={() => actions.executeAction('ron')} className="flex-1 py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-500 shadow-lg transition-transform hover:scale-105">榮和</button>}
                {state.actionMenu.canPon && <button onClick={() => actions.executeAction('pon')} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-transform hover:scale-105">碰</button>}
                {state.actionMenu.canKan && <button onClick={() => actions.executeAction('kan_minkan')} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-transform hover:scale-105">大明槓</button>}
              </div>
              <button onClick={() => actions.executeAction('skip')} className="mt-6 px-8 py-2 bg-slate-700 text-slate-300 font-bold rounded-full hover:bg-slate-600 w-full">跳過</button>
          </>
        ) : (
          <>
              <h3 className="text-yellow-400 font-bold mb-6 text-lg tracking-widest">特殊行動</h3>
              <div className="flex flex-col gap-3 w-full">
                {state.actionMenu.canKita && <button onClick={() => actions.executeAction('kita')} className="w-full py-3 bg-yellow-600 text-slate-900 font-black rounded-xl hover:bg-yellow-500 transition-transform hover:scale-105">拔北</button>}
                {state.actionMenu.canAnkan && <button onClick={() => actions.executeAction('ankan')} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-transform hover:scale-105">暗槓 / 加槓</button>}
                <button onClick={() => actions.executeAction('skip')} className="w-full mt-2 py-3 bg-slate-700 text-slate-300 font-bold rounded-xl hover:bg-slate-600">取消</button>
              </div>
          </>
        )}
    </div>
  );
};

// ============================================================================
// [7] MODULE CONTAINERS (各分頁模組)
// ============================================================================

const TerminologyGlossary = () => (
  <div className="space-y-8 animate-in fade-in zoom-in-95">
    <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-8 rounded-2xl shadow-xl text-white">
      <h2 className="text-3xl font-black mb-3 flex items-center gap-3"><Library className="text-purple-300 w-8 h-8"/> 三麻戰術與牌理百科</h2>
      <p className="text-purple-100 text-sm md:text-base leading-relaxed max-w-3xl">
        本百科完整收錄並萃取自《79博客》與《數據制勝：三人麻將》的核心理論。從新手必備的基礎單位，到高階的複合形拆解與防守迷思。配合實際牌型範例，幫助您快速建立強大的牌效邏輯與防守判斷。
      </p>
    </div>

    <div className="space-y-8">
      {TERM_CATEGORIES.map((cat, idx) => {
        const CatIcon = cat.icon;
        return (
          <div key={idx} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
            <h3 className={`text-xl md:text-2xl font-black mb-6 flex items-center gap-3 text-${cat.color}-700 border-b pb-4`}>
              <CatIcon className={`text-${cat.color}-500`} size={28} /> {cat.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cat.items.map((item, i) => (
                <div key={i} className="bg-slate-50 p-5 rounded-xl border border-slate-100 shadow-inner flex flex-col">
                  <strong className="text-lg text-slate-800 mb-3 block">{item.name}</strong>
                  {item.tiles && item.tiles.length > 0 && (
                    <div className="flex gap-1 mb-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm w-max">
                      {item.tiles.map((t, tidx) => <Tile key={tidx} tile={t} small={true} />)}
                    </div>
                  )}
                  <p className="text-slate-600 text-sm leading-relaxed mt-auto">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  </div>
);

const AttackDefenseTactics = () => (
  <div className="space-y-8 animate-in fade-in zoom-in-95">
    <div className="bg-gradient-to-r from-orange-600 to-red-700 p-6 md:p-8 rounded-2xl shadow-xl text-white">
      <h2 className="text-2xl md:text-3xl font-black mb-3 flex items-center gap-3"><ShieldAlert className="text-orange-200 w-6 h-6 md:w-8 md:h-8"/> 攻防與局收支判斷</h2>
      <p className="text-orange-100 text-sm md:text-base leading-relaxed max-w-3xl">
        麻將不是只比誰和牌快，更比誰懂得「避險」。本區塊深入解析《數據制勝》中「局收支 (EV)」的觀念。在三麻的高打點環境下，猶豫不決的「兜牌」是致命傷，要攻就攻到底，要守就徹底棄和！
      </p>
    </div>

    <div className="space-y-8">
      {TACTICS_DATA.map((section, idx) => (
        <div key={idx} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-xl md:text-2xl font-black mb-6 text-slate-800 border-b pb-4">
            {section.category}
          </h3>
          <div className="space-y-6">
            {section.items.map((item, i) => (
              <div key={i} className="flex flex-col lg:flex-row gap-4 lg:gap-6 bg-slate-50 p-5 md:p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                
                {/* 左側：情境與動作 */}
                <div className="lg:w-1/3 flex flex-col gap-3">
                  <h4 className="text-lg font-black text-slate-800 leading-tight">{item.title}</h4>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-600">
                    <span className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">面對情境</span>
                    {item.situation}
                  </div>
                  <div className={`mt-auto w-max px-4 py-2 rounded-lg text-white font-black text-sm tracking-widest shadow-sm ${item.actionColor}`}>
                    {item.action}
                  </div>
                </div>

                {/* 右側：解析與牌例 */}
                <div className="lg:w-2/3 flex flex-col justify-center">
                  <div className="flex items-start gap-2 mb-3 text-slate-700 text-sm md:text-base leading-relaxed">
                    <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p>{item.desc}</p>
                  </div>
                  
                  {item.tiles && item.tiles.length > 0 && (
                    <div className="mt-2">
                      <span className="block text-xs font-bold text-slate-400 mb-2">牌型範例：</span>
                      <div className="flex gap-1 bg-white p-2 md:p-3 rounded-lg border border-slate-200 shadow-inner w-max">
                        {item.tiles.map((t, tidx) => <Tile key={tidx} tile={t} small={true} />)}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SimulationMode = () => {
  const { state, actions } = useSimulation();
  
  if (state.gameState === 'setup') return <SimSetupView state={state} actions={actions} />;

  const checkDora = (t) => MahjongEngine.isTileDora(t, state.context.doraInd);
  
  const renderMelds = (idx, isPlayer = false) => {
    const tileClass = isPlayer ? "!w-6 !h-9 md:!w-7 md:!h-10" : "!w-5 !h-8 md:!w-6 md:!h-9";
    return state.openMelds[idx].map((m, i) => (
      <div key={i} className="flex gap-0.5 bg-black/20 p-1 rounded items-end">
        <Tile tile={m.tile} small={true} isDora={checkDora(m.tile)} className={tileClass} />
        <Tile tile={m.tile} small={true} isDora={checkDora(m.tile)} className={tileClass} />
        <Tile tile={m.tile} small={true} isDora={checkDora(m.tile)} className={tileClass} />
        {(m.type === 'kan' || m.type === 'ankan') && <Tile tile={m.tile} small={true} isDora={checkDora(m.tile)} faceDown={m.type==='ankan'} className={tileClass} />}
      </div>
    ));
  };

  let activeTenpaiInfo = null;
  let currentReason = "";
  let lastDrawnIdx = -1;
  
  if (state.currentTurn === 0 && !state.actionMenu && state.gameState !== 'finished' && !state.isRiichi[0]) {
      const minScore = Math.min(...Object.values(state.weights));
      let targetIdx = state.selectedTileIndex;
      if (targetIdx === null) targetIdx = Object.keys(state.weights).find(k => Math.abs(state.weights[k] - minScore) < 0.05);
      
      if (targetIdx !== undefined && state.tenpaiMap[targetIdx]) activeTenpaiInfo = state.tenpaiMap[targetIdx];

      const bestIndices = Object.keys(state.weights).filter(k => Math.abs(state.weights[k] - minScore) < 0.05).map(Number);
      const bestTiles = [...new Set(bestIndices.map(i => getTileName(state.hands[0][i])))];
      const isDefense = state.tacticalInfo?.stance === 'defend' || state.tacticalInfo?.stance === 'caution';
      
      if (state.selectedTileIndex !== null) {
          const selScore = state.weights[state.selectedTileIndex];
          if (isDefense) {
              if (Math.abs(selScore - minScore) < 0.05) currentReason = `🛡️ 防守推薦：此牌危險度最低 (危 ${selScore}%)，是最安全的選擇。`;
              else currentReason = `⚠️ 危險警告：此牌危險度高達 ${selScore}%，打出有放銃風險！最安全選擇是 ${bestTiles.join('/')}。`;
          } else {
              if (Math.abs(selScore - minScore) < 0.05) currentReason = `✅ 最佳選擇：此牌關聯分最低，打出能最大化進張效率。`;
              else if (selScore <= -1000) currentReason = `✅ 維持聽牌：打出此牌可聽牌，進張數為 ${Math.round(Math.abs(selScore + 1000))} 張。`;
              else if (selScore >= 1000) currentReason = `❌ 嚴重失誤：打出此牌將破壞聽牌或已完成的面子！`;
              else currentReason = `❌ 效率不佳：此牌關聯分為 ${selScore.toFixed(1)}，會損失部分進張。推薦打出 ${bestTiles.join('/')}。`;
          }
      } else {
          if (isDefense) currentReason = `👉 防守模式：敵方威脅極大！請優先打出危險度最低的安全牌。`;
          else if (activeTenpaiInfo) currentReason = `👉 推薦打出 ${bestTiles.join(' / ')} 即可維持最大面聽牌。`;
          else currentReason = `👉 推薦打出 ${bestTiles.join(' / ')}：系統綜合關聯分數最低，效率最差。`;
      }
  }

  if (state.currentTurn === 0 && state.lastDrawnTile && state.hands[0].length % 3 === 2) { 
      lastDrawnIdx = state.hands[0].lastIndexOf(state.lastDrawnTile);
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 text-white p-3 md:p-4 rounded-xl shadow-lg flex flex-wrap justify-between items-center gap-4">
        <div className="flex gap-4 items-center">
          <div className="bg-slate-700 px-3 py-1 rounded-lg text-sm font-bold border border-slate-600">{TILE_LABELS[state.context.pWind]}風場 / {TILE_LABELS[state.context.sWind]}家</div>
          <div className="flex items-center gap-2"><span className="text-xs text-slate-400 font-bold">寶牌指示</span><Tile tile={state.context.doraInd} small={true} className="!w-6 !h-9 !border-b-2" /></div>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-sm font-bold text-slate-300">剩餘 <span className="text-emerald-400 text-lg">{state.deck.length}</span> 張</div>
           {state.currentTurn === 0 && state.config.timeLimit > 0 && !state.actionMenu && !state.isRiichi[0] && (
             <div className={`text-lg font-mono font-bold ${state.timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>⏱ {state.timeLeft}s</div>
           )}
        </div>
      </div>

      {state.currentTurn === 0 && state.gameState === 'playing' && state.tacticalInfo && <TacticalAdvisor info={state.tacticalInfo} />}
      {state.gameState === 'finished' && <SimFinishedView state={state} actions={actions} />}

      <div className="bg-emerald-800 p-4 rounded-xl shadow-inner relative min-h-[500px] flex flex-col justify-between overflow-hidden">
        
        {/* Opponents Area */}
        <div className="flex justify-between items-start">
          <div className={`p-2 rounded-lg ${state.currentTurn === 2 && state.gameState !== 'finished' ? 'bg-white/20 ring-2 ring-yellow-400' : ''}`}>
             <div className="text-white text-xs font-bold mb-1 flex items-center gap-2"><Cpu size={12}/>上家 ({TILE_LABELS[state.context.ai2Wind]}){state.isRiichi[2] && <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded shadow-sm animate-pulse">立直</span>}</div>
             <div className="flex gap-0.5 mb-1">{renderMelds(2)}</div>
             {state.kitas[2].length > 0 && <div className="flex gap-0.5 mb-1 pl-1 border-l border-white/20">{state.kitas[2].map((t, i) => <Tile key={`k2-${i}`} tile={t} small={true} isDora={true} className="!w-5 !h-8 md:!w-6 md:!h-9" />)}</div>}
             <div className="flex gap-0.5">{state.hands[2].map((_, i) => <Tile key={i} faceDown={state.gameState==='playing'} tile={state.gameState==='finished'?state.hands[2][i]:null} isDora={state.gameState==='finished'?checkDora(state.hands[2][i]):false} small={true} className="!w-5 !h-8 md:!w-6 md:!h-9 !border-b-2" />)}</div>
             <div className="grid grid-cols-6 gap-0.5 md:gap-1 mt-2 w-max">{state.rivers[2].map((t, i) => <Tile key={`r2-${i}`} tile={t} small={true} isRiver={true} isDora={checkDora(t)} className="!w-6 !h-9 md:!w-7 md:!h-10 !border-b-2 opacity-80" />)}</div>
          </div>
          <div className={`p-2 rounded-lg text-right flex flex-col items-end ${state.currentTurn === 1 && state.gameState !== 'finished' ? 'bg-white/20 ring-2 ring-yellow-400' : ''}`}>
             <div className="text-white text-xs font-bold mb-1 justify-end flex items-center gap-2">{state.isRiichi[1] && <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded shadow-sm animate-pulse">立直</span>}下家 ({TILE_LABELS[state.context.ai1Wind]})<Cpu size={12}/></div>
             <div className="flex gap-0.5 mb-1 justify-end">{renderMelds(1)}</div>
             {state.kitas[1].length > 0 && <div className="flex gap-0.5 mb-1 pr-1 border-r border-white/20 justify-end">{state.kitas[1].map((t, i) => <Tile key={`k1-${i}`} tile={t} small={true} isDora={true} className="!w-5 !h-8 md:!w-6 md:!h-9" />)}</div>}
             <div className="flex gap-0.5 justify-end">{state.hands[1].map((_, i) => <Tile key={i} faceDown={state.gameState==='playing'} tile={state.gameState==='finished'?state.hands[1][i]:null} isDora={state.gameState==='finished'?checkDora(state.hands[1][i]):false} small={true} className="!w-5 !h-8 md:!w-6 md:!h-9 !border-b-2" />)}</div>
             <div className="grid grid-cols-6 gap-0.5 md:gap-1 mt-2 w-max" dir="ltr">{state.rivers[1].map((t, i) => <Tile key={`r1-${i}`} tile={t} small={true} isRiver={true} isDora={checkDora(t)} className="!w-6 !h-9 md:!w-7 md:!h-10 !border-b-2 opacity-80" />)}</div>
          </div>
        </div>

        {state.gameState === 'playing' && state.actionMenu && <SimActionMenu state={state} actions={actions} />}

        {/* Player Area */}
        <div className="flex justify-center mt-8 mb-4">
           <div className="grid grid-cols-6 gap-0.5 md:gap-1 w-max">
             {state.rivers[0].map((t, i) => <Tile key={`r0-${i}`} tile={t} small={true} isRiver={true} isDora={checkDora(t)} className="!w-7 !h-10 md:!w-8 !h-11 opacity-90" />)}
           </div>
        </div>

        <div className={`relative p-4 pt-10 rounded-xl border-t-4 mt-2 ${state.currentTurn === 0 && state.gameState !== 'finished' ? 'bg-white/10 border-yellow-400 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]' : 'border-transparent'}`}>
          <div className="absolute -top-5 left-4 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-md flex items-center gap-1 z-30">
            <User size={14}/> 自家手牌 {state.currentTurn === 0 && !state.actionMenu && state.gameState !== 'finished' && <span className="text-yellow-400 ml-1 animate-pulse">您的回合</span>} {state.isRiichi[0] && <span className="bg-red-600 text-white ml-2 px-2 py-0.5 rounded-full shadow-sm">立直中</span>}
          </div>
          
          {(state.openMelds[0].length > 0 || state.kitas[0].length > 0) && (
            <div className="flex justify-end gap-2 mb-6 pr-2">
              {state.kitas[0].length > 0 && <div className="flex gap-0.5 mr-2 self-end border-r border-white/20 pr-3">{state.kitas[0].map((t, i) => <Tile key={`k0-${i}`} tile={t} small={true} isDora={true} className="!w-6 !h-9 md:!w-7 md:!h-10" />)}</div>}
              {renderMelds(0, true)}
            </div>
          )}

          {activeTenpaiInfo && (
            <div className="flex justify-center mb-6 animate-in fade-in slide-in-from-bottom-2">
               <div className="bg-emerald-900/80 border border-emerald-500 p-2 px-4 rounded-xl shadow-lg flex items-center gap-3">
                  <div className="bg-emerald-500 text-white text-xs font-black px-2 py-1 rounded">聽牌預測</div>
                  <div className="flex gap-1">{activeTenpaiInfo.waitingTiles.map((wt, i) => <Tile key={i} tile={wt} isDora={checkDora(wt)} small={true} className="!w-6 !h-9" />)}</div>
                  <div className="text-emerald-300 text-sm font-bold font-mono ml-2 border-l border-emerald-700 pl-3">剩餘 {activeTenpaiInfo.ukeire} 張</div>
               </div>
            </div>
          )}

          <div className="flex justify-center gap-1 md:gap-2 mb-2 flex-wrap mt-8">
            {state.hands[0].map((t, i) => {
               const isSelected = state.selectedTileIndex === i;
               const isJustDrawn = i === lastDrawnIdx && state.currentTurn === 0; 
               const wScore = state.weights[i];
               const isDefenseMode = state.tacticalInfo?.stance === 'defend' || state.tacticalInfo?.stance === 'caution';
               let badgeClass = "bg-slate-700 text-slate-200", displayScore = "";
               
               if (wScore !== undefined && state.currentTurn === 0 && state.gameState !== 'finished' && !state.isRiichi[0]) {
                  const minScore = Math.min(...Object.values(state.weights));
                  if (isDefenseMode) {
                      displayScore = `危 ${wScore}%`;
                      if (wScore <= 15) badgeClass = "bg-emerald-500 text-white font-bold ring-2 ring-emerald-300";
                      else if (wScore >= 50) badgeClass = "bg-red-500 text-white font-bold";
                      else badgeClass = "bg-yellow-500 text-white font-bold";
                      if (Math.abs(wScore - minScore) < 0.05) badgeClass += " scale-110 -translate-y-1";
                  } else {
                      if (wScore <= -1000) { displayScore = `聽牌`;
                          if (Math.abs(wScore - minScore) < 0.05) badgeClass = "bg-emerald-500 text-white ring-2 ring-emerald-300 scale-110 -translate-y-1 font-bold";
                      } 
                      else if (wScore >= 1000) { displayScore = `破聽`; badgeClass = "bg-red-500 text-white font-bold"; } 
                      else { displayScore = wScore.toFixed(1);
                          if (Math.abs(wScore - minScore) < 0.05) badgeClass = "bg-emerald-500 text-white ring-2 ring-emerald-300 scale-110 -translate-y-1 font-bold";
                      }
                  }
               }
               return (
                 <div key={`p-${t}-${i}`} className="relative mt-2">
                    {wScore !== undefined && state.currentTurn === 0 && !state.actionMenu && state.gameState !== 'finished' && !state.isRiichi[0] && (
                      <div className={`absolute -top-7 left-1/2 transform -translate-x-1/2 text-[10px] md:text-xs px-1.5 py-0.5 rounded shadow-sm z-20 font-mono whitespace-nowrap ${badgeClass}`}>{displayScore}</div>
                    )}
                    <Tile tile={t} isSelected={isSelected && !state.isRiichi[0]} isDora={checkDora(t)} isJustDrawn={isJustDrawn} onClick={() => state.currentTurn === 0 && !state.actionMenu && state.gameState !== 'finished' && !state.isRiichi[0] && actions.setSelectedTileIndex(i)} />
                 </div>
               )
            })}
          </div>

          <div className="flex justify-between items-center h-12 mt-6">
             <div className="text-xs text-emerald-100 bg-black/40 p-2 px-3 rounded-lg max-w-[50%] leading-tight border border-white/10 shadow-inner hidden md:block">
                 {state.currentTurn === 0 && !state.actionMenu && state.gameState !== 'finished' && !state.isRiichi[0] ? currentReason : (state.isRiichi[0] ? '立直自動摸切中...' : '等待進行中...')}
             </div>
             <div className="flex gap-2 ml-auto">
                 {state.canRiichi && !state.isRiichi[0] && state.currentTurn === 0 && !state.actionMenu && state.gameState !== 'finished' && (
                   <button onClick={() => actions.setPendingRiichi(!state.pendingRiichi)} className={`px-5 py-2 rounded-full font-black shadow-lg transition-all flex items-center gap-1 animate-pulse ${state.pendingRiichi ? 'bg-red-600 text-white scale-105' : 'bg-white text-red-600 hover:bg-red-50 border-2 border-red-600'}`}>⚡ {state.pendingRiichi ? '取消立直' : '立直!'}</button>
                 )}
                 {state.currentTurn === 0 && !state.actionMenu && state.gameState !== 'finished' && !state.isRiichi[0] && (
                   <button disabled={state.selectedTileIndex === null} onClick={() => actions.discardTile(0, state.selectedTileIndex)} className={`px-8 py-2 rounded-full font-bold shadow-lg transition-all ${state.selectedTileIndex !== null ? (state.pendingRiichi ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white') + ' transform hover:scale-105' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}>{state.pendingRiichi ? '宣告並打出' : '打出'}</button>
                 )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// [8] MAIN APP & TABS (主程式渲染)
// ============================================================================

const AppHeader = () => (
  <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
    <div className="max-w-5xl mx-auto flex justify-between items-center">
      <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2"><span className="text-2xl md:text-3xl">🀄</span> 三麻進階訓練場</h1>
      <div className="text-xs md:text-sm text-slate-400 hidden sm:block">基於《數據制勝》與《79博客》理論</div>
    </div>
  </header>
);

const TabNavigation = ({ tabs, activeTab, setActiveTab }) => (
  <div className="bg-white shadow-sm mb-6 z-40 overflow-x-auto">
    <div className="max-w-5xl mx-auto flex min-w-max">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const colorClass = activeTab === tab.id ? `border-${tab.color}-600 text-${tab.color}-600 bg-${tab.color}-50` : 'border-transparent text-slate-500 hover:bg-slate-50';
        return (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 px-4 py-3 md:py-4 text-center font-bold border-b-2 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 text-sm md:text-base transition-colors ${colorClass}`}>
            <Icon size={18} /> <span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  </div>
);

export default function SanmaTrainer() {
  const [activeTab, setActiveTab] = useState('tactics');

  const TABS = [
    { id: 'tactics', icon: ShieldAlert, label: '攻防與局收支', color: 'orange' },
    { id: 'terminology', icon: Library, label: '術語與牌理百科', color: 'purple' },
    { id: 'simulation', icon: Swords, label: '實戰對局模擬', color: 'blue' }
  ];

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-20">
      <AppHeader />
      <TabNavigation tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="max-w-5xl mx-auto px-2 md:px-4">
        {activeTab === 'tactics' && <AttackDefenseTactics />}
        {activeTab === 'terminology' && <TerminologyGlossary />}
        {activeTab === 'simulation' && <SimulationMode />}
      </main>
    </div>
  );
}