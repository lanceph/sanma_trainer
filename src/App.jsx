import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Library,
  Swords,
  History,
  Volume2,
  VolumeX,
  Trophy,
  Settings,
  Home,
  ChevronRight,
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

export const AudioContext = React.createContext({
  isMuted: false,
  setIsRiichiBgmActive: () => {},
  sfxVolume: 0.35,
});

const AppHeader = ({
  activeTab,
  onGoHome,
  isMuted,
  toggleMute,
  onOpenSettings,
  onOpenChangelog,
}) => (
  <header className="bg-slate-900/95 backdrop-blur-md text-white p-4 shadow-xl z-50 shrink-0 relative border-b border-slate-700/80">
    {/* 🌟 讓頂部導覽列也支援超寬螢幕滿版，僅保留安全的水平 padding */}
    <div className="w-full px-2 md:px-8 mx-auto flex justify-between items-center">
      <div className="flex items-center gap-3 md:gap-4">
        {activeTab !== "home" && (
          <button
            onClick={onGoHome}
            className="p-2 md:px-3 md:py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all shadow-lg border border-slate-600 flex items-center gap-2 group"
            title="返回大廳"
          >
            <Home
              size={20}
              className="group-hover:-translate-y-0.5 transition-transform"
            />
            <span className="hidden md:inline font-bold text-sm">返回大廳</span>
          </button>
        )}

        <h1 className="text-xl md:text-2xl font-black flex items-center gap-3">
          <img
            src={appIcon}
            alt="SanmaTrainer Pro Logo"
            className="w-8 h-8 md:w-10 md:h-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
          />
          <div className="flex flex-col md:flex-row md:items-baseline">
            <span className="tracking-widest drop-shadow-md">
              三麻進階訓練場
            </span>
            <span className="text-[10px] md:text-xs text-emerald-400 font-bold md:ml-2 tracking-widest hidden sm:inline-block">
              by ZoneSky(阿宏)
            </span>
          </div>
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="text-xs md:text-sm text-slate-400 hidden lg:block font-medium">
          基於《數據制勝》與《79博客》理論
        </div>

        <button
          onClick={onOpenChangelog}
          className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shadow-inner"
          title="更新歷程"
        >
          <History size={20} />
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shadow-inner"
          title="音訊設定"
        >
          <Settings size={20} />
        </button>

        <button
          onClick={toggleMute}
          className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shadow-inner"
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

const GameLobby = ({ onSelectMode }) => {
  const mainModes = [
    {
      id: "simulation",
      icon: Swords,
      label: "單機特訓",
      subLabel: "SANDBOX MODE",
      desc: "與 AI 進行實戰演練，結合戰術雷達提升攻防判斷能力。",
      color: "from-blue-600/90 to-indigo-900/90",
      border: "border-blue-400/50",
      glow: "group-hover:shadow-[0_0_40px_rgba(37,99,235,0.6)]",
    },
    {
      id: "tournamentLobby",
      icon: Trophy,
      label: "複式競技賽",
      subLabel: "DUPLICATE PK",
      desc: "同牌山競技！考驗誰能在完全一樣的進張下做出最佳攻防判斷，獲取最高總分。",
      color: "from-red-600/90 to-rose-900/90",
      border: "border-red-400/50",
      glow: "group-hover:shadow-[0_0_40px_rgba(220,38,38,0.6)]",
    },
  ];

  const subModes = [
    {
      id: "tactics",
      icon: ShieldAlert,
      label: "戰術學院",
      desc: "11 種實戰情境期望值分析",
    },
    {
      id: "terminology",
      icon: Library,
      label: "術語百科",
      desc: "日麻三麻特有規則查閱",
    },
  ];

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col overflow-hidden animate-in fade-in duration-700 bg-slate-950">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1611996575749-79a3a250f948?q=80&w=2070&auto=format&fit=crop')",
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent"></div>
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950 to-transparent"></div>

      <div className="relative z-10 w-full h-full flex flex-col md:flex-row p-6 md:p-12 lg:p-16 w-full mx-auto">
        <div className="flex flex-col justify-between w-full md:w-1/2 h-full pb-8">
          <div className="mt-4 md:mt-12 space-y-2 animate-in slide-in-from-left-8 duration-700">
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight drop-shadow-2xl">
              CHOOSE YOUR <br />
              BATTLEFIELD.
            </h2>
            <p className="text-emerald-400 font-bold tracking-[0.3em] text-sm md:text-base mt-4 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-emerald-400"></span> SELECT GAME
              MODE
            </p>
          </div>

          <div className="mt-auto flex flex-col sm:flex-row gap-4 animate-in slide-in-from-bottom-8 duration-700 delay-200">
            {subModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => onSelectMode(mode.id)}
                className="group flex items-center gap-4 bg-white/5 hover:bg-white/15 border border-white/10 backdrop-blur-md p-4 rounded-2xl transition-all hover:-translate-y-1 shadow-lg w-full sm:w-64"
              >
                <div className="p-2.5 bg-slate-800/80 rounded-xl text-slate-300 group-hover:text-emerald-400 transition-colors shadow-inner">
                  <mode.icon size={24} />
                </div>
                <div className="text-left">
                  <h4 className="text-white font-bold tracking-wide">
                    {mode.label}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                    {mode.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col justify-center gap-6 mt-12 md:mt-0 md:pl-12 lg:pl-24 animate-in slide-in-from-right-8 duration-700 delay-100">
          {mainModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={`group relative overflow-hidden rounded-3xl p-6 md:p-8 lg:p-10 text-left transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br ${mode.color} border-2 ${mode.border} ${mode.glow} shadow-2xl flex items-center justify-between`}
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-30 mix-blend-overlay"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 -mr-8 text-white/10 transition-transform duration-700 group-hover:scale-125 group-hover:-rotate-12">
                <mode.icon size={180} />
              </div>
              <div className="relative z-10 w-4/5">
                <p className="text-white/70 font-black tracking-[0.2em] text-xs md:text-sm mb-1">
                  {mode.subLabel}
                </p>
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-widest drop-shadow-lg mb-3">
                  {mode.label}
                </h3>
                <p className="text-white/80 font-medium text-sm md:text-base leading-relaxed drop-shadow-sm pr-4">
                  {mode.desc}
                </p>
              </div>
              <div className="relative z-10 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20 group-hover:bg-white group-hover:text-slate-900 transition-all duration-300 shrink-0">
                <ChevronRight
                  size={24}
                  className="transform group-hover:translate-x-1 transition-transform"
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [tournamentContext, setTournamentContext] = useState({
    isInRoom: false,
    tid: null,
    myPlayerId: null,
  });
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
  const [showSettings, setShowSettings] = useState(false);

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
  ]);

  const handleTabSwitch = async (targetTabId) => {
    playClick();
    if (
      activeTab === "tournamentLobby" &&
      targetTabId !== "tournamentLobby" &&
      tournamentContext.isInRoom
    ) {
      const confirmLeave = window.confirm(
        "🚨 警告！您目前正在錦標賽房間內！\n\n如果返回大廳，將視同「棄權」並直接退出比賽，確定要離開嗎？"
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

  return (
    <div className="h-screen w-screen font-sans text-slate-900 flex flex-col overflow-hidden relative bg-slate-950">
      <AppHeader
        activeTab={activeTab}
        onGoHome={() => handleTabSwitch("home")}
        isMuted={isMuted}
        toggleMute={toggleMute}
        onOpenSettings={() => setShowSettings(true)}
        onOpenChangelog={() => handleTabSwitch("changelog")}
      />

      <AudioSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        bgmVolume={bgmVolume}
        setBgmVolume={setBgmVolume}
        sfxVolume={sfxVolume}
        setSfxVolume={setSfxVolume}
      />

      <AudioContext.Provider
        value={{ isMuted, setIsRiichiBgmActive, sfxVolume }}
      >
        <main
          className={`flex-1 overflow-y-auto w-full touch-pan-y relative ${
            activeTab === "home"
              ? "bg-slate-950"
              : "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-200 to-slate-300"
          }`}
        >
          {/* 🌟 核心修改：針對「遊戲對戰模式」與「靜態閱讀模式」採取不同的排版策略 */}

          {activeTab === "home" && <GameLobby onSelectMode={handleTabSwitch} />}

          {/* 🎯 遊戲對戰模式 (全滿版 Full-Bleed)：解除 max-w 限制，讓綠色牌桌能徹底延伸 */}
          {(activeTab === "simulation" || activeTab === "tournamentLobby") && (
            <div className="w-full h-full p-2 md:p-4 pb-24 md:pb-4 animate-in fade-in">
              {activeTab === "simulation" && <SimulationMode />}
              {activeTab === "tournamentLobby" && (
                <TournamentManager onContextUpdate={setTournamentContext} />
              )}
            </div>
          )}

          {/* 📚 靜態閱讀模式：保留 max-w-[1400px]，確保文字可讀性不會因為螢幕過大而失焦 */}
          {(activeTab === "tactics" ||
            activeTab === "terminology" ||
            activeTab === "changelog") && (
            <div className="max-w-[1400px] mx-auto px-4 py-8 pb-24 h-full animate-in fade-in">
              {activeTab === "tactics" && <AttackDefenseTactics />}
              {activeTab === "terminology" && <TerminologyGlossary />}
              {activeTab === "changelog" && <ChangelogView />}
            </div>
          )}
        </main>
      </AudioContext.Provider>
    </div>
  );
}
