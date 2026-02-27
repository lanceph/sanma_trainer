import React, { useState, useEffect } from "react";
import useSound from "use-sound";
import clickSound from "./assets/sounds/click.mp3";
// 🌟 新增引入 BGM
import lobbyBgm from "./assets/sounds/bgm-lobby.mp3";
import gameBgm from "./assets/sounds/bgm-game.mp3";
import riichiBgm from "./assets/sounds/bgm-riichi.mp3"; // 🌟 新增立直 BGM
import {
  ShieldAlert,
  Library,
  Swords,
  History,
  Volume2,
  VolumeX,
  Trophy,
} from "lucide-react";
import appIcon from "./assets/icon.svg";

// 引入拆分後的各個頁面視圖
import { AttackDefenseTactics } from "./views/AttackDefenseTactics";
import { TerminologyGlossary } from "./views/TerminologyGlossary";
import { SimulationMode } from "./views/Simulation/SimulationMode";
import { ChangelogView } from "./views/ChangelogView";
import TournamentManager from "./views/Tournament/TournamentManager";
import { abandonTournament } from "./services/tournamentService";

// 🌟 建立全域 AudioContext
export const AudioContext = React.createContext({
  isMuted: false,
  setIsRiichiBgmActive: () => {},
});

const AppHeader = ({ isMuted, toggleMute }) => (
  <header className="bg-slate-900 text-white p-4 shadow-md z-50 shrink-0 relative">
    <div className="max-w-5xl mx-auto flex justify-between items-center">
      <h1 className="text-xl md:text-2xl font-bold flex items-center gap-3">
        {/* ✨ 這裡使用新的 SVG Icon 取代原本的 🀄 */}
        <img
          src={appIcon}
          alt="SanmaTrainer Pro Logo"
          className="w-8 h-8 md:w-10 md:h-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
        />
        <div className="flex items-baseline">
          三麻進階訓練場
          <span className="text-[10px] md:text-xs text-slate-400 font-normal ml-2 tracking-widest hidden sm:inline-block">
            (by zonesky)
          </span>
        </div>
      </h1>
      <div className="text-xs md:text-sm text-slate-400 hidden md:block">
        基於《數據制勝》與《79博客》理論
      </div>
      {/* 🌟 新增：全域靜音切換按鈕 */}
      <button
        onClick={toggleMute}
        className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        title={isMuted ? "取消靜音" : "靜音"}
      >
        {isMuted ? (
          <VolumeX size={20} className="text-red-400" />
        ) : (
          <Volume2 size={20} className="text-emerald-400" />
        )}
      </button>
    </div>
  </header>
);

const TabNavigation = ({ tabs, activeTab, setActiveTab }) => (
  <div className="bg-white shadow-sm z-40 overflow-x-auto shrink-0 relative">
    <div className="max-w-5xl mx-auto flex min-w-max">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const colorClass =
          activeTab === tab.id
            ? `border-${tab.color}-600 text-${tab.color}-600 bg-${tab.color}-50`
            : "border-transparent text-slate-500 hover:bg-slate-50";
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 md:py-4 text-center font-bold border-b-2 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 text-sm md:text-base transition-colors ${colorClass}`}
          >
            <Icon size={18} /> <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState("tactics");
  // 🌟 1. 新增一個 State 來記錄目前是不是卡在錦標賽裡面
  const [tournamentContext, setTournamentContext] = useState({
    isInRoom: false,
    tid: null,
    myPlayerId: null,
  });

  // 🌟 新增：音效靜音狀態，預設從 localStorage 讀取 (如果沒設定過，預設為 false 有聲音)
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem("sanma_muted");
    return saved === "true";
  });

  // 🌟 新增：追蹤現在是否需要播放立直 BGM
  const [isRiichiBgmActive, setIsRiichiBgmActive] = useState(false);
  // 🌟 註冊點擊音效
  const [playClick] = useSound(clickSound, { soundEnabled: !isMuted });
  // 🌟 註冊兩首 BGM，設定迴圈播放 (loop: true) 與較低的背景音量 (volume)
  const [playLobby, { stop: stopLobby }] = useSound(lobbyBgm, {
    loop: true,
    volume: 0.15,
    soundEnabled: !isMuted,
  });
  const [playGame, { stop: stopGame }] = useSound(gameBgm, {
    loop: true,
    volume: 0.15,
    soundEnabled: !isMuted,
  });
  // 🌟 註冊立直 BGM
  const [playRiichi, { stop: stopRiichi }] = useSound(riichiBgm, {
    loop: true,
    volume: 0.15,
    soundEnabled: !isMuted,
  });

  // 🌟 新增：當狀態改變時，存回 localStorage
  const toggleMute = () => {
    setIsMuted((prev) => {
      const newVal = !prev;
      localStorage.setItem("sanma_muted", String(newVal));
      return newVal;
    });
  };

  // 🌟 2. 實作攔截分頁切換的邏輯
  const handleTabSwitch = async (targetTabId) => {
    playClick(); // 🌟 播放點擊音效

    // 如果是從錦標賽切去別的地方，且正在房間內
    if (
      activeTab === "tournamentLobby" &&
      targetTabId !== "tournamentLobby" &&
      tournamentContext.isInRoom
    ) {
      const confirmLeave = window.confirm(
        "🚨 警告！您目前正在錦標賽房間內！\n\n如果切換分頁，將視同「棄權」並直接退出比賽，確定要離開嗎？"
      );

      if (!confirmLeave) return; // 玩家按取消，什麼都不做，留在原畫面

      // 玩家狠心按了確定，主動幫他宣告棄權
      await abandonTournament(
        tournamentContext.tid,
        tournamentContext.myPlayerId
      );
      setTournamentContext({ isInRoom: false, tid: null, myPlayerId: null });
    }

    // 正常切換分頁
    setActiveTab(targetTabId);
  };

  // 🌟 自動根據場景切換 BGM
  useEffect(() => {
    // 每次狀態改變時，先暫停所有音樂
    stopLobby();
    stopGame();
    stopRiichi(); // 🌟 記得暫停立直 BGM

    // 如果玩家設定了靜音，就什麼都不播
    if (isMuted) return;

    // 判斷玩家現在是不是正在「打牌」
    // 條件：在對局模擬器中，或是在錦標賽且已經進入房間
    const isPlayingGame =
      activeTab === "simulation" ||
      (activeTab === "tournamentLobby" && tournamentContext.isInRoom);

    if (isPlayingGame) {
      // 🌟 如果遊戲中且有人立直，播激戰音樂；否則播一般對局音樂
      if (isRiichiBgmActive) {
        playRiichi();
      } else {
        playGame();
      }
    } else {
      playLobby();
    }

    // 當元件卸載或狀態改變時的清理動作
    return () => {
      stopLobby();
      stopGame();
      stopRiichi();
    };
  }, [
    activeTab,
    tournamentContext.isInRoom,
    isMuted,
    playLobby,
    stopLobby,
    playGame,
    stopGame,
    playRiichi,
    stopRiichi,
  ]);

  const TABS = [
    { id: "simulation", icon: Swords, label: "實戰對局模擬", color: "blue" },
    { id: "tournamentLobby", icon: Trophy, label: "多人PK賽", color: "red" },
    {
      id: "tactics",
      icon: ShieldAlert,
      label: "攻防與局收支",
      color: "orange",
    },
    {
      id: "terminology",
      icon: Library,
      label: "術語與牌理百科",
      color: "purple",
    },
    { id: "changelog", icon: History, label: "更新歷程", color: "slate" },
  ];

  return (
    <div className="h-screen w-screen bg-slate-100 font-sans text-slate-900 flex flex-col overflow-hidden">
      {/* 🌟 傳遞屬性給 Header */}
      <AppHeader isMuted={isMuted} toggleMute={toggleMute} />
      <TabNavigation
        tabs={TABS}
        activeTab={activeTab}
        setActiveTab={handleTabSwitch}
      />

      {/* 🌟 用 AudioContext 包住主要內容區 */}
      <AudioContext.Provider value={{ isMuted, setIsRiichiBgmActive }}>
        <main className="flex-1 overflow-y-auto w-full touch-pan-y">
          <div className="max-w-5xl mx-auto px-2 md:px-4 py-6 pb-24">
            {activeTab === "tactics" && <AttackDefenseTactics />}
            {activeTab === "terminology" && <TerminologyGlossary />}
            {activeTab === "simulation" && <SimulationMode />}
            {activeTab === "changelog" && <ChangelogView />}
            {activeTab === "tournamentLobby" && (
              <TournamentManager onContextUpdate={setTournamentContext} />
            )}
          </div>
        </main>
      </AudioContext.Provider>
    </div>
  );
}
