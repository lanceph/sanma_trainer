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
  Home, // 🌟 新增：首頁/返回大廳圖示
  Gamepad2, // 🌟 新增：遊戲手把圖示 (裝飾用)
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

// 🌟 擴充 AudioContext
export const AudioContext = React.createContext({
  isMuted: false,
  setIsRiichiBgmActive: () => {},
  sfxVolume: 0.35,
});

// 🌟 修改 AppHeader：加入 activeTab 與 onGoHome Props，用來渲染「返回大廳」按鈕
const AppHeader = ({ activeTab, onGoHome, isMuted, toggleMute, onOpenSettings }) => (
  <header className="bg-slate-900 text-white p-4 shadow-xl z-50 shrink-0 relative border-b border-slate-700">
    <div className="max-w-5xl mx-auto flex justify-between items-center">
      <div className="flex items-center gap-3 md:gap-4">
        {/* 🌟 當不在大廳時，顯示返回按鈕 */}
        {activeTab !== "home" && (
          <button
            onClick={onGoHome}
            className="p-2 md:px-3 md:py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all shadow-lg border border-slate-600 flex items-center gap-2 group"
            title="返回大廳"
          >
            <Home size={20} className="group-hover:-translate-y-0.5 transition-transform" /> 
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
            <span className="tracking-widest">三麻進階訓練場</span>
            <span className="text-[10px] md:text-xs text-slate-400 font-normal md:ml-2 tracking-widest hidden sm:inline-block">
              (by zonesky)
            </span>
          </div>
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="text-xs md:text-sm text-slate-400 hidden md:block">
          基於《數據制勝》與《79博客》理論
        </div>

        {/* 音訊設定按鈕 */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shadow-inner"
          title="音訊設定"
        >
          <Settings size={20} />
        </button>

        {/* 靜音切換按鈕 */}
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

// 🌟 專屬的音訊設定彈出視窗 (Modal)
const AudioSettingsModal = ({ isOpen, onClose, bgmVolume, setBgmVolume, sfxVolume, setSfxVolume }) => {
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
            <span className="text-emerald-400">{Math.round(bgmVolume * 100)}%</span>
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
            <span className="text-emerald-400">{Math.round(sfxVolume * 100)}%</span>
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

// =========================================================================
// 🌟 新增：大型遊戲大廳 UI (取代原本的 TabNavigation)
// =========================================================================
const GameLobby = ({ onSelectMode }) => {
  const modes = [
    {
      id: "simulation",
      icon: Swords,
      label: "單機特訓 (Sandbox)",
      desc: "與 AI 進行實戰演練，結合戰術雷達提升攻防判斷能力。",
      color: "from-blue-600 to-indigo-800",
      shadow: "shadow-blue-500/30",
      colSpan: "md:col-span-1",
    },
    {
      id: "tournamentLobby",
      icon: Trophy,
      label: "多人競技 (Tournament)",
      desc: "建立房間與好友即時連線，在相同的牌山下進行複式麻將 PK。",
      color: "from-red-600 to-rose-800",
      shadow: "shadow-red-500/30",
      colSpan: "md:col-span-1",
    },
    {
      id: "tactics",
      icon: ShieldAlert,
      label: "戰術學院 (Tactics)",
      desc: "收錄 11 種常見的三麻實戰情境，提供詳細的點數期望值與局收支分析。",
      color: "from-emerald-600 to-teal-800",
      shadow: "shadow-emerald-500/30",
      colSpan: "md:col-span-2",
    },
    {
      id: "terminology",
      icon: Library,
      label: "術語百科 (Glossary)",
      desc: "日麻三麻特有規則與麻將術語快速查閱。",
      color: "from-purple-600 to-fuchsia-800",
      shadow: "shadow-purple-500/30",
      colSpan: "md:col-span-1",
    },
    {
      id: "changelog",
      icon: History,
      label: "更新歷程 (Changelog)",
      desc: "查看版本更新與新功能介紹。",
      color: "from-slate-600 to-slate-800",
      shadow: "shadow-slate-500/30",
      colSpan: "md:col-span-1",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-10 text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-widest drop-shadow-sm flex items-center justify-center gap-4">
          <Gamepad2 size={40} className="text-indigo-600" />
          選擇模式
          <Gamepad2 size={40} className="text-indigo-600" />
        </h2>
        <p className="text-slate-500 font-bold tracking-widest text-sm md:text-base">
          SELECT YOUR GAME MODE
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={`relative group overflow-hidden rounded-3xl p-6 md:p-8 text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl bg-gradient-to-br ${mode.color} ${mode.shadow} ${mode.colSpan} border border-white/10`}
            >
              {/* 背景大型裝飾圖示 */}
              <div className="absolute top-0 right-0 -mt-6 -mr-6 text-white/10 transition-transform duration-500 group-hover:scale-125 group-hover:-rotate-12">
                <Icon size={160} />
              </div>
              <div className="relative z-10 text-white">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md shadow-inner">
                    <Icon size={32} className="text-white" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black tracking-wider drop-shadow-md">
                    {mode.label}
                  </h3>
                </div>
                <p className="text-white/80 font-medium text-sm md:text-base leading-relaxed drop-shadow-sm">
                  {mode.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};


export default function App() {
  const [activeTab, setActiveTab] = useState("home"); // 🌟 預設啟動畫面改為 "home" 大廳
  const [tournamentContext, setTournamentContext] = useState({
    isInRoom: false,
    tid: null,
    myPlayerId: null,
  });

  const [isMuted, setIsMuted] = useState(() => localStorage.getItem("sanma_muted") === "true");
  const [bgmVolume, setBgmVolume] = useState(() => parseFloat(localStorage.getItem("sanma_bgm_vol")) || 0.15);
  const [sfxVolume, setSfxVolume] = useState(() => parseFloat(localStorage.getItem("sanma_sfx_vol")) || 0.35);
  const [isRiichiBgmActive, setIsRiichiBgmActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => localStorage.setItem("sanma_bgm_vol", bgmVolume), [bgmVolume]);
  useEffect(() => localStorage.setItem("sanma_sfx_vol", sfxVolume), [sfxVolume]);

  const toggleMute = () => {
    setIsMuted((prev) => {
      const newVal = !prev;
      localStorage.setItem("sanma_muted", String(newVal));
      return newVal;
    });
  };

  const [playClick] = useSound(clickSound, { soundEnabled: !isMuted, volume: sfxVolume });
  const [playLobby, { stop: stopLobby }] = useSound(lobbyBgm, { loop: true, volume: bgmVolume, soundEnabled: !isMuted });
  const [playGame, { stop: stopGame }] = useSound(gameBgm, { loop: true, volume: bgmVolume, soundEnabled: !isMuted });
  const [playRiichi, { stop: stopRiichi }] = useSound(riichiBgm, { loop: true, volume: bgmVolume, soundEnabled: !isMuted });

  useEffect(() => {
    stopLobby(); stopGame(); stopRiichi();
    if (isMuted) return;

    // 🌟 在遊戲內 (沙盒或連線中) 才播遊戲音樂，在大廳 (home 或 tournamentLobby 等待區) 播大廳音樂
    const isPlayingGame = activeTab === "simulation" || (activeTab === "tournamentLobby" && tournamentContext.isInRoom);
    
    if (isPlayingGame) {
      if (isRiichiBgmActive) playRiichi();
      else playGame();
    } else {
      playLobby();
    }

    return () => { stopLobby(); stopGame(); stopRiichi(); };
  }, [activeTab, tournamentContext.isInRoom, isMuted, isRiichiBgmActive, playLobby, stopLobby, playGame, stopGame, playRiichi, stopRiichi, bgmVolume]);

  const handleTabSwitch = async (targetTabId) => {
    playClick();

    if (activeTab === "tournamentLobby" && targetTabId !== "tournamentLobby" && tournamentContext.isInRoom) {
      const confirmLeave = window.confirm(
        "🚨 警告！您目前正在錦標賽房間內！\n\n如果返回大廳，將視同「棄權」並直接退出比賽，確定要離開嗎？"
      );
      if (!confirmLeave) return;
      await abandonTournament(tournamentContext.tid, tournamentContext.myPlayerId);
      setTournamentContext({ isInRoom: false, tid: null, myPlayerId: null });
    }
    setActiveTab(targetTabId);
  };

  return (
    <div className="h-screen w-screen font-sans text-slate-900 flex flex-col overflow-hidden relative bg-slate-100">
      
      <AppHeader
        activeTab={activeTab}
        onGoHome={() => handleTabSwitch("home")}
        isMuted={isMuted}
        toggleMute={toggleMute}
        onOpenSettings={() => setShowSettings(true)}
      />

      <AudioSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        bgmVolume={bgmVolume}
        setBgmVolume={setBgmVolume}
        sfxVolume={sfxVolume}
        setSfxVolume={setSfxVolume}
      />

      {/* 🌟 背景加上輕微的漸層感，讓畫面更立體 */}
      <AudioContext.Provider value={{ isMuted, setIsRiichiBgmActive, sfxVolume }}>
        <main className="flex-1 overflow-y-auto w-full touch-pan-y relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-200 to-slate-300">
          <div className="max-w-5xl mx-auto px-2 md:px-4 py-6 pb-24 h-full">
            
            {/* 🌟 取代原本的 TabNavigation，首頁直接渲染大廳卡片 */}
            {activeTab === "home" && <GameLobby onSelectMode={handleTabSwitch} />}
            
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