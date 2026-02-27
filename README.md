# 🀄 日麻三麻進階訓練場 (Sanma Advanced Trainer)

一個專為日本麻將（三人麻將）愛好者打造的進階 Web 訓練與競技平台。
整合了「防守權重分析」、「AI 模擬對局」與「即時多人連線錦標賽 (Duplicate Mahjong)」，旨在幫助玩家透過科學化的數據與實戰演練，提升攻防判斷能力。

![Version](https://img.shields.io/badge/version-v3.1.0-emerald)
![React](https://img.shields.io/badge/React-18-blue)
![Vite](https://img.shields.io/badge/Vite-5-purple)
![Firebase](https://img.shields.io/badge/Firebase-Realtime_Database-yellow)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3-cyan)

## ✨ 核心特色 (Key Features)

### 🎵 沉浸式音訊系統 (Immersive Audio System) 
* **全域遊戲音效 (SFX)**：實裝摸切牌、鳴牌 (碰槓拔北)、立直閃電及和牌爆發等專屬音效，大幅提升打牌打擊感。
* **動態背景音樂 (BGM)**：根據大廳、一般對局與「立直激戰」等情境無縫切換專屬音樂，營造沉浸式對局氛圍。
* **自訂音訊與超時警告**：提供獨立音訊設定面板，支援 BGM 與 SFX 獨立音量滑桿並自動記憶玩家偏好；當思考時間倒數至 5 秒時將精準觸發警告音。

### 🏆 多人連線錦標賽 (Multiplayer Duplicate Tournament)
採用「複式麻將 (Duplicate Mahjong)」概念，所有參賽者在相同的牌山 (Seed) 下與 AI 對戰，考驗誰能做出最佳的攻防選擇。
* **即時對戰雷達 (PK Radar)**：透過 Firebase 即時同步，隨時掌握對手的巡目、立直狀態與思考時間。
* **完善的防卡關機制**：支援斷線自動棄權、房主權限自動繼承 (Host Migration) 以及回合結束自動倒數推進。
* **防作弊競技模式**：進入錦標賽後，系統會自動隱藏上帝視角的危險度標籤與進張提示，確保絕對公平。

### 🤖 實戰對局模擬 (Simulation Mode)
* **防守權重引擎**：根據敵方立直與鳴牌狀態，動態計算每張手牌的「危險度分數」與「進張效率」。
* **常駐聽牌提示 (QoL)**：實裝精美的立直/默聽提示 UI，自動於手牌上方顯示目前的聽牌種類與寶牌發光特效。
* **深度麻將引擎 (Mahjong Engine)**：支援 DFS 遞迴算番、一砲雙響 (Double Ron) 合併結算、流局罰符 (No-ten Bappu) 以及開槓/立直裏寶牌翻開機制。

### 📚 戰術分析與百科 (Knowledge Base)
* **攻防與局收支**：收錄 11 種常見的三麻實戰情境，提供詳細的點數期望值分析。
* **術語百科**：整理三麻特有的規則與日麻術語，適合新手快速查閱。

---

## 🏗️ 專案架構 (Architecture)

本專案採用 React + Vite 構建，狀態管理採用純 React Hooks，並搭配 Firebase Realtime Database 實現輕量級的後端同步。

```text
src/
├── assets/            # 靜態資源與圖示 (包含 sounds 音效檔)
├── components/        # 🎮 共用 UI 元件
│   ├── Tile.jsx             # 高度客製化的麻將牌 SVG 元件
│   ├── PKRadar.jsx          # 即時對戰雷達 UI
│   └── TacticalAdvisor.jsx  # 戰術雷達與狀態提示
├── constants/         # ⚙️ 靜態常數 (麻將對應表、預設值)
├── data/              # 📖 靜態資料庫
│   ├── changelogData.js     # 版本更新歷程
│   └── tacticsData.js       # 攻防局收支題庫
├── engine/            # 🧠 核心邏輯引擎
│   └── MahjongEngine.js     # 掌管向聽數計算、理牌、算番、防守權重評估
├── hooks/             # 🎣 自定義 Hooks (狀態管理核心)
│   ├── useSimulation.js     # 掌管單局遊戲狀態 (發牌、摸切、鳴牌、結算)
│   └── useTournamentSync.js # 掌管 Firebase 房間資料即時監聽與同步
├── services/          # 🌐 外部服務 API
│   └── tournamentService.js # 封裝 Firebase 的建立/加入房間、分數上傳、房主轉移等操作
├── utils/             # 🛠️ 工具函式
│   ├── firebase.js          # Firebase 初始化與設定
│   └── rng.js               # 亂數生成器 (用於產生牌山 Seed 與房間代碼)
└── views/             # 🖥️ 主要頁面視圖
    ├── Tournament/          # 錦標賽大廳、等待室、結算板
    ├── Simulation/          # 實戰模擬沙盒 (含 ActionMenu, 結算畫面)
    ├── AttackDefenseTactics.jsx
    └── TerminologyGlossary.jsx

🔄 資料流設計 (Data Flow)

    單機沙盒：完全依賴 useSimulation 在 Client-side 運作，結合 MahjongEngine 實現零延遲的 AI 對弈與算分。

    錦標賽連線：

        useTournamentSync 負責單向接收 Firebase 的 players 與 state 更新，渲染 PK 雷達與排行榜。

        玩家的摸切動作觸發 useSimulation 的內部結算，隨後由 tournamentService 將結果 (submitRoundScore) 或即時動作 (updateLiveState) 單向推播至 Firebase。

        透過共用 RNG Seed，確保在完全沒有 Server 端發牌的情況下，各個 Client 依然能生成完全一致的起手牌與牌山。

🚀 本地啟動指南 (Setup & Installation)
1. 安裝依賴 (Install Dependencies)

請確保您已安裝 Node.js。本專案推薦使用 pnpm 進行套件管理。
Bash

npm install -g pnpm
pnpm install

2. 環境變數設定 (Environment Variables)

請在專案根目錄建立一個 .env 檔案，並填入您的 Firebase 專案設定：
程式碼片段

VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-auth-domain"
VITE_FIREBASE_DATABASE_URL="your-database-url"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"

3. 啟動開發伺服器 (Start Dev Server)
Bash

pnpm dev

啟動後，開啟瀏覽器瀏覽 http://localhost:5173 即可開始使用。
📜 授權條款 (License)

本專案為開源專案，採用 MIT License 授權。歡迎提交 Issue 或 Pull Request 來幫助我們變得更好！
