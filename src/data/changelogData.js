// --- 版本更新歷程資料 (Changelog Data) ---
export const CHANGELOG_DATA = [
  {
    version: "v2.1.1",
    date: "最新更新",
    changes: [
      "修復手機版螢幕過窄導致對手手牌被截斷的問題，新增隱藏捲軸的水平滑動支援 (Bugfix)",
      "修復自家手牌在手機版會斷行且被上層危險度標籤遮蔽的問題，優化為單行流暢滑動與內部邊距 (Padding) 配置 (Bugfix)",
    ],
  },
  {
    version: "v2.1.0",
    date: "近期更新",
    changes: ["新增版本更新歷程模組 (Feature)", "加入版權宣告 (Enhance)"],
  },
  {
    version: "v2.0.0",
    date: "大版本更新",
    changes: [
      "移除不穩定的隨機何切題庫，轉化為靜態視覺化百科 (Breaking Change)",
      "整合《數據制勝》與《79博客》理論 (Enhance)",
      "新增「攻防與局收支」專屬分頁，提供 11 種實戰情境解析 (Feature)",
    ],
  },
  {
    version: "v1.3.0",
    date: "早期更新",
    changes: [
      "UI/UX 全面升級：改為 App-like 固定視窗，解決畫面上下跳動問題 (Refactor)",
      "修復玩家河牌區的牌池重疊問題，改用 6 欄網格排列 (Bugfix)",
      "戰術雷達位置優化，移至牌桌下方避免誤觸 (Enhance)",
    ],
  },
  {
    version: "v1.2.0",
    date: "早期更新",
    changes: [
      "重寫計分核心引擎：實裝 DFS 遞迴拆牌演算法 (Refactor)",
      "支援平和、一盃口等標準面子役種精準判斷 (Feature)",
      "修復榮和時誤判「海底撈月」的 Bug，並補上「河底撈魚」判定 (Bugfix)",
    ],
  },
  {
    version: "v1.1.0",
    date: "早期更新",
    changes: [
      "實裝「動態戰術雷達」與防守權重評估引擎 (Feature)",
      "AI 邏輯推演可視化，清楚列出決策過程 (Feature)",
    ],
  },
  {
    version: "v1.0.0",
    date: "初始版本",
    changes: [
      "三麻進階訓練場基礎架構建立",
      "實戰模擬沙盒與麻將牌 SVG 繪圖系統上線",
    ],
  },
];
