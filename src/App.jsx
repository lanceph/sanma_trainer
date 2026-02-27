import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Library,
  Swords,
  History,
  Volume2,
  VolumeX,
  Trophy,
  Settings, // 🌟 新增設定 Icon
} from "lucide-react";
import appIcon from "./assets/icon.svg";
import useSound from "use-sound";

import clickSound from "./assets/sounds/click.mp3";
import lobbyBgm from "./assets/sounds/bgm-lobby.mp3";
import gameBgm from "./assets/sounds/bgm-game.mp3";
import riichiBgm from "./assets/sounds/bgm-riichi.mp3";

import { AttackDefenseTactics } from "./views/AttackDefenseTactics";
import { TerminologyGlossary } from "./views/TerminologyGlossary";
import { SimulationMode } from "./views/Simulation/SimulationMode";
import { ChangelogView } from "./views/ChangelogView";
import TournamentManager from "./views/Tournament/TournamentManager";
import { abandonTournament } from "./services/tournamentService";

// 🌟 擴充 AudioContext，加入 sfxVolume 讓子元件可以讀取
export const AudioContext = React.createContext({
  isMuted: false,
  setIsRiichiBgmActive: () => {},
  sfxVolume: 0.35,
});

// 🌟 修改 AppHeader：加入打開設定的按鈕
const AppHeader = ({ isMuted, toggleMute, onOpenSettings }) => (
  <header className="bg-slate-900 text-white p-4 shadow-md z-50 shrink-0 relative">
    <div className="max-w-5xl mx-auto flex justify-between items-center">
      <h1 className="text-xl md:text-2xl font-bold flex items-center gap-3">
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
      <div className="flex items-center gap-2 md:gap-4">
        <div className="text-xs md:text-sm text-slate-400 hidden md:block">
          基於《數據制勝》與《79博客》理論
        </div>

        {/* 音訊設定按鈕 */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="音訊設定"
        >
          <Settings size={20} />
        </button>

        {/* 靜音切換按鈕 */}
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
    </div>
  </header>
);

// 🌟 新增：專屬的音訊設定彈出視窗 (Modal)
const AudioSettingsModal = ({
  isOpen,
  onClose,
  bgmVolume,
  setBgmVolume,
  sfxVolume,
  setSfxVolume,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm text-white shadow-2xl border border-slate-700 zoom-in-95 animate-in">
        <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-emerald-400">
          <Settings size={24} /> 音訊設定
        </h2>

        <div className="mb-6">
          <label className="flex justify-between text-sm font-bold text-slate-300 mb-2">
            <span>背景音樂 (BGM)</span>
            <span className="text-emerald-400">
              {Math.round(bgmVolume * 100)}%
            </span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={bgmVolume}
            onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="mb-8">
          <label className="flex justify-between text-sm font-bold text-slate-300 mb-2">
            <span>遊戲音效 (SFX)</span>
            <span className="text-emerald-400">
              {Math.round(sfxVolume * 100)}%
            </span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={sfxVolume}
            onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black transition-colors shadow-lg"
        >
          完成
        </button>
      </div>
    </div>
  );
};

const TabNavigation = ({ tabs, activeTab, setActiveTab }) => (
  // ... 保持不變
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
  const [activeTab, setActiveTab] = useState("simulation");
  const [tournamentContext, setTournamentContext] = useState({
    isInRoom: false,
    tid: null,
    myPlayerId: null,
  });

  // 🌟 音效狀態管理 (從 localStorage 讀取預設值)
  const [isMuted, setIsMuted] = useState(
    () => localStorage.getItem("sanma_muted") === "true"
  );
  const [bgmVolume, setBgmVolume] = useState(
    () => parseFloat(localStorage.getItem("sanma_bgm_vol")) || 0.15
  );
  const [sfxVolume, setSfxVolume] = useState(
    () => parseFloat(localStorage.getItem("sanma_sfx_vol")) || 0.35
  );
  const [isRiichiBgmActive, setIsRiichiBgmActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false); // 控制 Modal 顯示

  // 🌟 當音量改變時，自動存入 localStorage
  useEffect(
    () => localStorage.setItem("sanma_bgm_vol", bgmVolume),
    [bgmVolume]
  );
  useEffect(
    () => localStorage.setItem("sanma_sfx_vol", sfxVolume),
    [sfxVolume]
  );

  const toggleMute = () => {
    setIsMuted((prev) => {
      const newVal = !prev;
      localStorage.setItem("sanma_muted", String(newVal));
      return newVal;
    });
  };

  // 🌟 將動態音量綁定到 useSound
  const [playClick] = useSound(clickSound, {
    soundEnabled: !isMuted,
    volume: sfxVolume,
  });
  const [playLobby, { stop: stopLobby }] = useSound(lobbyBgm, {
    loop: true,
    volume: bgmVolume,
    soundEnabled: !isMuted,
  });
  const [playGame, { stop: stopGame }] = useSound(gameBgm, {
    loop: true,
    volume: bgmVolume,
    soundEnabled: !isMuted,
  });
  const [playRiichi, { stop: stopRiichi }] = useSound(riichiBgm, {
    loop: true,
    volume: bgmVolume,
    soundEnabled: !isMuted,
  });

  useEffect(() => {
    stopLobby();
    stopGame();
    stopRiichi();

    if (isMuted) return;

    const isPlayingGame =
      activeTab === "simulation" ||
      (activeTab === "tournamentLobby" && tournamentContext.isInRoom);
    if (isPlayingGame) {
      if (isRiichiBgmActive) playRiichi();
      else playGame();
    } else {
      playLobby();
    }

    return () => {
      stopLobby();
      stopGame();
      stopRiichi();
    };
  }, [
    activeTab,
    tournamentContext.isInRoom,
    isMuted,
    isRiichiBgmActive,
    playLobby,
    stopLobby,
    playGame,
    stopGame,
    playRiichi,
    stopRiichi,
    bgmVolume,
  ]); // 🌟 依賴加入 bgmVolume 讓切換音量即時生效

  const handleTabSwitch = async (targetTabId) => {
    playClick();

    if (
      activeTab === "tournamentLobby" &&
      targetTabId !== "tournamentLobby" &&
      tournamentContext.isInRoom
    ) {
      const confirmLeave = window.confirm(
        "🚨 警告！您目前正在錦標賽房間內！\n\n如果切換分頁，將視同「棄權」並直接退出比賽，確定要離開嗎？"
      );
      if (!confirmLeave) return;
      await abandonTournament(
        tournamentContext.tid,
        tournamentContext.myPlayerId
      );
      setTournamentContext({ isInRoom: false, tid: null, myPlayerId: null });
    }
    setActiveTab(targetTabId);
  };

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
    <div className="h-screen w-screen bg-slate-100 font-sans text-slate-900 flex flex-col overflow-hidden relative">
      <AppHeader
        isMuted={isMuted}
        toggleMute={toggleMute}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* 🌟 渲染設定 Modal */}
      <AudioSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        bgmVolume={bgmVolume}
        setBgmVolume={setBgmVolume}
        sfxVolume={sfxVolume}
        setSfxVolume={setSfxVolume}
      />

      <TabNavigation
        tabs={TABS}
        activeTab={activeTab}
        setActiveTab={handleTabSwitch}
      />

      {/* 🌟 將 sfxVolume 也傳入 Context 交給下層控制 */}
      <AudioContext.Provider
        value={{ isMuted, setIsRiichiBgmActive, sfxVolume }}
      >
        <main className="flex-1 overflow-y-auto w-full touch-pan-y">
          <div className="max-w-5xl mx-auto px-2 md:px-4 py-6 pb-24">
            {activeTab === "simulation" && <SimulationMode />}
            {activeTab === "tournamentLobby" && (
              <TournamentManager onContextUpdate={setTournamentContext} />
            )}
            {activeTab === "tactics" && <AttackDefenseTactics />}
            {activeTab === "terminology" && <TerminologyGlossary />}            
            {activeTab === "changelog" && <ChangelogView />}
            
          </div>
        </main>
      </AudioContext.Provider>
    </div>
  );
}
