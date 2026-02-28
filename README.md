這是一份為您整合後的完整 README.md 內容。這份文件結合了專案的技術特性、最新版本組態（React 19 / Vite 6）、深入的檔案架構分析，以及針對維護者的除錯指引。
🀄 日麻三麻進階訓練場 (Sanma Advanced Trainer)

一個專為日本麻將（三人麻將）愛好者打造的進階 Web 訓練與競技平台。
整合了「防守權重分析」、「AI 模擬對局」與「即時多人連線錦標賽 (Duplicate Mahjong)」，旨在幫助玩家透過科學化的數據與實戰演練，提升攻防判斷能力。
✨ 核心特色 (Key Features)
🏆 複式多人連線賽 (Multiplayer Duplicate Tournament)

採用「複式麻將 (Duplicate Mahjong)」概念，旨在考驗玩家在相同進張下的攻防選擇。

    公平競技：所有參賽者在相同的牌山種子 (Seed) 下分別與 AI 對戰，解決麻將運氣成分問題。

    即時對戰雷達 (PK Radar)：透過 Firebase 即時同步，隨時掌握對手的巡目、立直狀態與思考時間。

    高可靠性機制：支援斷線自動棄權、房主權限自動繼承 (Host Migration) 以及回合結束自動倒數推進。

🤖 深度實戰模擬引擎 (Mahjong Engine)

核心邏輯位於 src/engine/MahjongEngine.js，提供精確的判斷支援：

    防守權重引擎：根據敵方立直與鳴牌狀態，動態計算手牌的「危險度分數」（0-100分）與進張效率。

    戰術立場建議 (Tactical Stance)：結合《數據制勝》理論，根據己方打點與敵方威脅度，提供「強勢對攻」或「絕對防守」等即時建議。

    精準算番系統：支援 DFS 遞迴算番、一砲雙響、流局罰符、以及三麻特有的「拔北」寶牌與裏寶牌機制。

🎵 沉浸式音訊與 QoL (Immersive Audio & QoL)

    動態音訊系統：實裝摸切、鳴牌、立直閃電及和牌爆發音效；BGM 會根據大廳、一般對局與「立直激戰」情境無縫切換。

    自訂設定：提供獨立音訊設定面板，支援 BGM 與 SFX 獨立音量調整並自動記憶偏好。

    常駐提示：手牌上方即時顯示聽牌種類、剩餘枚數與寶牌發光特效。

🏗️ 專案架構與檔案分析 (Architecture Analysis)

本專案採用 React 19 + Vite 6 構建，狀態管理採用純 React Hooks，並遵循「邏輯與表現分離」原則。
📂 目錄職責詳解
Plaintext

src/
├── assets/            # 靜態資源、圖示與遊戲音效檔 (.mp3)
├── components/        # 🎮 共用 UI 元件
│   ├── Tile.jsx             # 高度客製化的麻將牌 SVG 元件，支援危險度與寶牌標記
│   ├── PKRadar.jsx          # 即時對戰雷達 UI，用於錦標賽數據對比
│   └── TacticalAdvisor.jsx  # 戰術雷達與狀態提示資訊
├── constants/         # ⚙️ 靜態常數 (如：麻將牌組定義、預設值)
├── data/              # 📖 靜態資料庫
│   ├── changelogData.js     # 版本更新歷程
│   └── tacticsData.js       # 收錄 11 種實戰情境的局收支題庫
├── engine/            # 🧠 核心邏輯引擎 (純 JS 邏輯)
│   └── MahjongEngine.js     # 掌管向聽數、理牌、算番、危險度評估
├── hooks/             # 🎣 自定義 Hooks (狀態管理核心)
│   ├── useSimulation.js     # 掌管單局遊戲狀態機 (發牌、摸切、鳴牌、結算)
│   └── useTournamentSync.js # 掌管 Firebase 房間資料即時監聽與同步
├── services/          # 🌐 外部服務 API
│   └── tournamentService.js # 封裝 Firebase 建立房間、分數上傳、房主轉移操作
├── utils/             # 🛠️ 工具函式
│   ├── firebase.js          # Firebase 初始化設定
│   └── rng.js               # 亂數生成器 (確保牌山 Seed 與房間代碼一致性)
└── views/             # 🖥️ 主要頁面視圖
    ├── Tournament/          # 錦標賽大廳、等待室、結算板
    ├── Simulation/          # 實戰模擬沙盒 (含 ActionMenu, 結算畫面)
    ├── AttackDefenseTactics.jsx # 戰術學院介面
    └── TerminologyGlossary.jsx  # 術語百科介面

🔄 資料同步設計 (Data Flow)

    單機沙盒：完全依賴 useSimulation 在 Client-side 運作，結合 MahjongEngine 實現零延遲對弈。

    錦標賽連線：

        Seed 共享：透過共用 RNG Seed，確保在無 Server 端發牌情況下，各 Client 生成一致的牌山。

        即時推播：玩家摸切動作觸發內部結算後，透過 tournamentService 將分數或 Live 動作同步至 Firebase。

        即時監聽：useTournamentSync 負責監聽 Firebase 更新，渲染 PK 雷達與排行榜。

🛠️ 維護與除錯指引 (Debugging Guide)

    邏輯除錯：若發現和牌判定、算番或牌效有誤，應優先檢查 src/engine/MahjongEngine.js，此檔案不依賴 React 狀態。

    同步異常：若錦標賽中對手數據未更新，請檢查 useTournamentSync.js 的監聽邏輯與 Firebase 資料庫權限。

    狀態流轉：遊戲操作卡死（如無法摸牌）通常與 useSimulation.js 中的 gameState 鎖定有關。

    RNG 一致性：若發生玩家牌山不一致，請檢查 src/utils/rng.js 的 seedString 是否正確傳遞至各個客戶端。

🚀 本地啟動指南 (Setup)

    安裝依賴 (推薦使用 pnpm)：
    Bash

    pnpm install

    環境變數設定：在根目錄建立 .env 並填入您的 Firebase 設定。

    啟動開發伺服器：
    Bash

    pnpm dev

本專案採 MIT License 授權。基於《數據制勝》與《79博客》理論開發。

希望這份完整的 README 能幫助您更好地管理與開發專案！如果您需要針對特定功能（如 Firebase 設定細節）進行補充，隨時跟我說。
