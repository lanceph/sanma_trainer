import React, { useState, useRef } from "react";
import {
  Activity,
  Lightbulb,
  ChevronDown,
  BrainCircuit,
  GripHorizontal,
} from "lucide-react";

let persistentMinimized = false;
let persistentPos = { x: 0, y: 0 };

const TacticalAdvisor = ({ info }) => {
  const [isMinimized, setIsMinimized] = useState(persistentMinimized);
  const [pos, setPos] = useState(persistentPos);
  const [isDragging, setIsDragging] = useState(false);

  // 🌟 新增：用來取得面板實體大小的 Ref，藉此計算邊界
  const containerRef = useRef(null);
  const dragLimits = useRef({ minX: 0, maxX: 0, minY: 0, maxY: 0 });

  const dragStart = useRef({ x: 0, y: 0 });
  const clickStart = useRef({ x: 0, y: 0 });

  const handleToggle = (val) => {
    persistentMinimized = val;
    setIsMinimized(val);
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);

    // 🌟 核心防護機制：在按下的瞬間，計算出當下允許拖曳的最大與最小範圍
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const margin = 10; // 預留 10px 的安全邊距，不要讓它完全貼死螢幕邊緣

      dragLimits.current = {
        minX: -rect.left + pos.x + margin,
        maxX: window.innerWidth - rect.right + pos.x - margin,
        minY: -rect.top + pos.y + margin,
        maxY: window.innerHeight - rect.bottom + pos.y - margin,
      };
    }

    dragStart.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    clickStart.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;

    let nextX = e.clientX - dragStart.current.x;
    let nextY = e.clientY - dragStart.current.y;

    // 🌟 數學鉗制 (Clamping)：強制把座標鎖在我們剛剛計算好的邊界內！
    nextX = Math.max(
      dragLimits.current.minX,
      Math.min(nextX, dragLimits.current.maxX)
    );
    nextY = Math.max(
      dragLimits.current.minY,
      Math.min(nextY, dragLimits.current.maxY)
    );

    const newPos = { x: nextX, y: nextY };
    setPos(newPos);
    persistentPos = newPos; // 同步更新記憶體
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleFabClick = (e) => {
    const dx = Math.abs(e.clientX - clickStart.current.x);
    const dy = Math.abs(e.clientY - clickStart.current.y);
    if (dx < 5 && dy < 5) {
      handleToggle(false);
    }
  };

  if (!info) return null;

  const colorMap = {
    "red-500":
      "bg-red-950/85 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]",
    "yellow-500":
      "bg-yellow-950/85 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]",
    "emerald-500":
      "bg-emerald-950/85 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]",
    "blue-500":
      "bg-blue-950/85 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]",
  };
  const iconColor = info.color.split("-")[0];

  if (isMinimized) {
    return (
      <div
        ref={containerRef} // 🌟 掛載 Ref，讓系統知道小按鈕的大小
        className="fixed bottom-4 left-4 md:bottom-8 md:left-8 z-50 touch-none"
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      >
        <button
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={handleFabClick}
          className={`p-3 md:p-4 rounded-full border backdrop-blur-md shadow-lg transition-all duration-300 animate-in zoom-in group bg-${iconColor}-950/90 border-${iconColor}-500/50 ${
            isDragging
              ? "cursor-grabbing scale-110"
              : "cursor-grab hover:scale-110"
          }`}
          title="拖曳移動或點擊展開"
        >
          <BrainCircuit
            size={24}
            className={`text-${iconColor}-400 ${
              !isDragging && "group-hover:animate-pulse"
            }`}
          />
          {info.threats && info.threats.length > 0 && (
            <span className="absolute top-0 right-0 flex h-3 w-3 -mt-1 -mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef} // 🌟 掛載 Ref，讓系統知道大面板的大小
      className="fixed bottom-4 left-4 md:bottom-8 md:left-8 z-50 pointer-events-none touch-none"
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
    >
      <div
        className={`pointer-events-auto w-80 md:w-96 p-4 rounded-xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-left-8 ${
          colorMap[info.color]
        }`}
      >
        <div className="flex-1 w-full relative">
          <div
            className={`flex justify-between items-center mb-3 border-b pb-2 border-white/20 -mx-2 px-2 rounded-t-lg transition-colors ${
              isDragging
                ? "cursor-grabbing bg-white/10"
                : "cursor-grab hover:bg-white/5"
            }`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            title="按住此處拖曳面板"
          >
            <h4
              className={`font-black text-base md:text-lg flex items-center gap-1.5 text-${iconColor}-400 drop-shadow-[0_0_5px_currentColor]`}
            >
              <GripHorizontal size={18} className="opacity-70" />
              戰術雷達系統
            </h4>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold text-white bg-${iconColor}-600/80 border border-${iconColor}-400/50 shadow-sm`}
              >
                {info.label}
              </span>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(true);
                }}
                className="p-1 rounded bg-black/40 hover:bg-white/20 text-slate-300 transition-colors cursor-pointer z-10 relative"
                title="縮小雷達面板"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          <p className="text-xs md:text-sm font-medium leading-relaxed mb-3 text-slate-200">
            {info.desc}
          </p>

          <div className="grid grid-cols-2 gap-2 text-[10px] md:text-xs mb-3">
            <div className="bg-black/40 p-2 rounded border border-white/10">
              <strong className="block text-slate-300 mb-1">自家狀態</strong>
              <span className="font-mono text-emerald-300">
                {info.isTenpai ? "✅ 已聽牌" : "❌ 未聽牌"} | 預估 {info.estHan}{" "}
                番
              </span>
            </div>
            <div className="bg-black/40 p-2 rounded border border-white/10">
              <strong className="block text-slate-300 mb-1">
                敵方威脅分析
              </strong>
              {info.threats.length === 0 ? (
                <span className="text-emerald-400 font-bold">
                  目前無明顯威脅
                </span>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {info.threats.map((t, i) => (
                    <span key={i} className="text-red-400 font-bold">
                      {t.name}: {t.reasons.join(", ")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {info.logicSteps && info.logicSteps.length > 0 && (
            <div className="bg-black/50 p-3 rounded-lg border border-white/10 text-[10px] md:text-xs mt-2">
              <strong className="flex items-center gap-1.5 text-slate-200 mb-2 border-b border-white/10 pb-1.5">
                <Lightbulb size={12} className="text-amber-400" /> AI
                判斷邏輯推演
              </strong>
              <ul className="space-y-2">
                {info.logicSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5 opacity-80 text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded font-mono">
                      {idx + 1}
                    </span>
                    <span className="text-slate-300 leading-relaxed font-medium">
                      {step}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div
            className={`absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-${iconColor}-400/50 rounded-tl opacity-0 group-hover:opacity-100 transition-opacity`}
          ></div>
          <div
            className={`absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-${iconColor}-400/50 rounded-br opacity-0 group-hover:opacity-100 transition-opacity`}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default TacticalAdvisor;
