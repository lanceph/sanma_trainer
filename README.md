🀄 三麻進階訓練場 (Sanma Trainer)

三麻進階訓練場 是一個專為日本三人麻將 (Sanma) 玩家設計的進階戰術與牌效訓練 Web 應用程式。本專案不僅提供對局模擬，更深度整合了頂尖玩家的數據理論，旨在透過系統化的視覺引導，幫助玩家克服防守迷思、建立以「局收支 (EV)」為核心的攻防判斷基準。

本系統的核心戰術理論嚴格萃取自兩大日麻權威文獻：

    《數據制勝：三人麻將》 (みーにん 著)

    《79博客》 (Seventh9 日麻教程)

✨ 核心功能 (Features)

    🛡️ 攻防與局收支雷達：內建動態防守權重評估引擎，將敵方立直、副露、拔北寶牌數量等威脅數據化，給出「強勢對攻」、「條件對攻」或「絕對防守」的實時建議。

    ⚔️ 實戰對局模擬 (沙盒模式)：

        支援 1v2 的 AI 對戰模擬，可自訂 AI 難度（初級、進階、高段）與思考時間限制。

        完整實裝三人麻將特殊規則，包含「拔北」、「自摸損」考量，以及完整的牌理計分引擎（支援平和、一盃口等役種精準判斷及 DFS 遞迴拆牌演算法）。

    📚 戰術與牌理百科：將進階理論轉化為靜態視覺化百科，收錄從基礎面子到高階複合形（如中膨、兩嵌、煙囪形）的拆解邏輯。

    📱 響應式 UI 設計：App-like 介面，完美適配手機與桌面端，支援單行流暢的水平滑動 (Horizontal Scroll)，解決小螢幕卡牌重疊與截斷問題。

🛠️ 技術棧 (Tech Stack)

    前端框架: React.js (Hooks 狀態管理)

    建置工具: Vite

    樣式處理: Tailwind CSS (Utility-first CSS) / 原生 CSS 輔助

    圖示庫: Lucide React

    繪圖系統: 內部自建純 SVG 動態麻將牌繪圖系統 (免依賴外部圖片)

📂 專案架構 (Project Structure)

專案基於標準的 Vite + React 結構建立：
Plaintext

sanma_trainer/
├── public/                 # 靜態資源 (Vite logo 等)
├── src/                    # 原始碼目錄
│   ├── assets/             # 圖片或靜態資源 (React logo)
│   ├── App.jsx             # 🟢 核心應用程式：包含所有組件、狀態管理與麻將引擎
│   ├── App.css             # 全域共用樣式
│   ├── index.css           # Tailwind 引入與底層 CSS (包含 scrollbar-hide)
│   └── main.jsx            # React 進入點，掛載 App 組件
├── index.html              # 應用程式入口 HTML
├── package.json            # npm 依賴與腳本設定
├── vite.config.js          # Vite 伺服器與打包設定
└── eslint.config.js        # Linter 規範設定

🧠 App.jsx 內部模組解析

目前為求快速迭代，所有功能集中於 App.jsx，其內部依邏輯切分為以下區塊：

    CONSTANTS & DATA: 基礎常數 (SANMA_TILE_SET)、更新歷程 (CHANGELOG_DATA)、百科資料 (TERM_CATEGORIES) 與戰術情境資料 (TACTICS_DATA)。

    MAHJONG ENGINE: 遊戲底層引擎，包含向聽數與進張計算 (getTenpaiUkeire)、DFS 算分系統 (calculateScore)、安全度評估 (getSafetyScore) 以及 AI 戰術判斷 (evaluateTacticalStance)。

    UI COMPONENTS: 包含 SVG 麻將牌元件 (Tile, PinGraphics, SouGraphics) 與戰術雷達面板 (TacticalAdvisor)。

    CUSTOM HOOKS: useSimulation 負責封裝整個對局沙盒的 State 與遊戲迴圈 (Game Loop)。

    VIEWS & TABS: 負責渲染四大分頁視圖 (AttackDefenseTactics, TerminologyGlossary, SimulationMode, ChangelogView)。

🚀 快速開始 (Getting Started)

    安裝依賴套件:
    Bash

    npm install
    # 或使用 pnpm
    pnpm install

    啟動開發伺服器:
    Bash

    npm run dev
    # 或使用 pnpm
    pnpm dev

    開啟瀏覽器訪問控制台輸出的本地網址 (通常為 http://localhost:5173) 即可開始使用。

🏷️ 版本控制原則 (Versioning)

本專案更新歷程 (Changelog) 遵循 Semantic Versioning (a.b.c 原則)：

    a (Major): 包含不向下兼容的修改 (Breaking Change) 或核心架構的重大翻新。

    b (Minor): 新增功能 (Feature)、大幅度重構 (Refactor) 或強化現有邏輯 (Enhance)。

    c (Patch): 錯誤修復 (Bugfix) 與介面微調。

版權宣告：本系統採用之麻將理論與數據解析，其原著版權歸屬於《數據制勝：三人麻將》作者みーにん及《79博客》作者 Seventh9 所有。本專案僅供學術交流與個人訓練使用。
