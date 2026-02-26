Markdown

# 🀄 三麻進階訓練場 (Sanma Trainer)

![React](https://img.shields.io/badge/React-18.x-blue?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=flat-square&logo=tailwind-css)

**三麻進階訓練場** 是一個專為日本三人麻將 (Sanma) 玩家設計的進階戰術與牌效訓練 Web 應用程式。本專案不僅提供對局模擬，更深度整合了頂尖玩家的數據理論，旨在透過系統化的視覺引導，幫助玩家克服防守迷思、建立以「局收支 (EV)」為核心的攻防判斷基準。

本系統的戰術演算法與理論嚴格萃取自兩大日麻權威文獻：
* 《數據制勝：三人麻將》 (みーにん 著)
* 《79博客》 (Seventh9 日麻教程)

---

## ✨ 核心功能 (Features)

* **🛡️ 攻防與局收支雷達**：內建動態防守權重評估引擎，將敵方立直、副露、拔北寶牌數量等威脅數據化，給出「強勢對攻」、「條件對攻」或「絕對防守」的實時建議。
* **⚔️ 實戰對局模擬 (沙盒模式)**：
  * 支援 1v2 的 AI 對戰模擬，可自訂 AI 難度（初級、進階、高段）與思考時間限制。
  * 完整實裝三人麻將特殊規則，包含「拔北」、「自摸損」考量，以及完整的牌理計分引擎（支援 DFS 遞迴拆牌演算法）。
* **📚 戰術與牌理百科**：將進階理論轉化為靜態視覺化百科，收錄從基礎面子到高階複合形（如中膨、兩嵌、煙囪形）的拆解邏輯。
* **📱 響應式 UI 與原生滑動體驗**：App-like 介面，完美適配手機與桌面端。支援單行流暢的水平滑動 (Horizontal Scroll)，隱藏原生捲軸，解決小螢幕卡牌重疊與截斷問題。

---

## 🛠️ 技術棧 (Tech Stack)

* **前端框架**: [React.js](https://react.dev/) (Hooks 狀態管理)
* **建置工具**: [Vite](https://vitejs.dev/)
* **樣式處理**: [Tailwind CSS](https://tailwindcss.com/) + Custom CSS (隱藏捲軸等特殊處理)
* **套件管理**: pnpm 
* **繪圖系統**: 內部自建純 SVG 動態麻將牌繪圖系統，無外部圖片依賴。
* **雲端開發**: 支援 `.devcontainer` 與 `.codesandbox` 快速啟動開發環境。

---

## 📂 專案架構 (Project Structure)

專案已進行深度模組化重構，採用高內聚、低耦合的目錄設計，職責劃分明確：

```text
sanma_trainer/
├── .codesandbox/           # 雲端開發環境設定
├── .devcontainer/          # VS Code DevContainers 設定檔
├── public/                 # 靜態資源
├── src/                    
│   ├── assets/             # 圖片資源 (如 SVG icon)
│   ├── components/         # 🧩 共用 UI 元件 (如 Tile 麻將牌、TacticalAdvisor 雷達面板)
│   ├── constants/          # ⚙️ 系統常數設定 (mahjong.js)
│   ├── data/               # 🗄️ 靜態資料庫 (changelogData.js, tacticsData.js)
│   ├── engine/             # 🧠 核心算分與推演引擎 (MahjongEngine.js)
│   ├── hooks/              # 🪝 自訂 React Hooks (useSimulation.js 負責 Game Loop)
│   ├── views/              # 🖥️ 各大分頁視圖
│   │   ├── Simulation/     # 實戰對局沙盒專屬視圖 (Setup, ActionMenu, Finished 等)
│   │   ├── AttackDefenseTactics.jsx
│   │   ├── ChangelogView.jsx
│   │   └── TerminologyGlossary.jsx
│   ├── App.jsx             # 🟢 應用程式外框、標頭與 Tab 導航切換
│   ├── App.css / index.css # 全域樣式設定
│   └── main.jsx            # React 掛載點
├── eslint.config.js        # Linter 規範設定
├── package.json            # npm 腳本
├── pnpm-lock.yaml          # pnpm 依賴鎖定檔
└── vite.config.js          # Vite 打包設定

🚀 快速開始 (Getting Started)
前置需求

請確保您的開發環境已安裝 Node.js 以及 pnpm。
安裝與運行

    複製專案到本地
    Bash

    git clone <你的_REPO_URL>
    cd sanma_trainer

    安裝依賴套件
    Bash

    pnpm install

    啟動開發伺服器
    Bash

    pnpm dev

    開啟瀏覽器訪問控制台輸出的本地網址 (通常為 http://localhost:5173) 即可開始使用。

🏷️ 版本控制原則 (Versioning)

本專案更新歷程遵循 Semantic Versioning (語意化版本控制) 的 a.b.c 原則：

    a (Major): 包含不向下兼容的修改 (Breaking Change) 或核心架構的重大翻新 (例如：模組化重構)。

    b (Minor): 新增功能 (Feature) 或強化現有邏輯 (Enhance)。

    c (Patch): 錯誤修復 (Bugfix) 與介面微調。

詳細的歷史版本記錄可於應用程式內的 「更新歷程」 分頁中查看。
⚖️ 聲明與版權 (Disclaimer & Credits)

    本系統採用之麻將理論與數據解析，其原著版權歸屬於《數據制勝：三人麻將》作者みーにん及《79博客》作者 Seventh9 所有。

    本專案為獨立開發，僅供學術交流、演算法研究與個人訓練使用，請勿用於任何商業用途。
