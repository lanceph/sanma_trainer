import React, { useState } from "react";
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

const AppHeader = () => (
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

  const TABS = [
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
    { id: "simulation", icon: Swords, label: "實戰對局模擬", color: "blue" },
    { id: "changelog", icon: History, label: "更新歷程", color: "slate" },
    { id: "tournamentLobby", icon: Trophy, label: "多人PK賽", color: "red" },
  ];

  return (
    <div className="h-screen w-screen bg-slate-100 font-sans text-slate-900 flex flex-col overflow-hidden">
      <AppHeader />
      <TabNavigation
        tabs={TABS}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <main className="flex-1 overflow-y-auto w-full touch-pan-y">
        <div className="max-w-5xl mx-auto px-2 md:px-4 py-6 pb-24">
          {activeTab === "tactics" && <AttackDefenseTactics />}
          {activeTab === "terminology" && <TerminologyGlossary />}
          {activeTab === "simulation" && <SimulationMode />}
          {activeTab === "changelog" && <ChangelogView />}
          {activeTab === "tournamentLobby" && <TournamentManager />}
        </div>
      </main>
    </div>
  );
}
