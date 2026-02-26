import React from "react";
import { Activity, Lightbulb } from "lucide-react";

const TacticalAdvisor = ({ info }) => {
  if (!info) return null;
  const colorMap = {
    "red-500": "bg-red-50 border-red-500 text-red-900",
    "yellow-500": "bg-yellow-50 border-yellow-500 text-yellow-900",
    "emerald-500": "bg-emerald-50 border-emerald-500 text-emerald-900",
    "blue-500": "bg-blue-50 border-blue-500 text-blue-900",
  };
  const iconColor = info.color.split("-")[0];

  return (
    <div
      className={`p-4 rounded-xl border-l-4 shadow-md mb-4 flex flex-col sm:flex-row gap-4 items-start animate-in fade-in slide-in-from-left-4 ${
        colorMap[info.color]
      }`}
    >
      <div className="flex-1 w-full">
        <div className="flex justify-between items-center mb-2 border-b pb-2 border-black/10">
          <h4 className="font-black text-lg flex items-center gap-2">
            <Activity size={20} className={`text-${iconColor}-600`} />{" "}
            數據制勝：戰術雷達
          </h4>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-${iconColor}-600 shadow-sm`}
          >
            {info.label}
          </span>
        </div>
        <p className="text-sm font-medium leading-relaxed mb-3">{info.desc}</p>
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="bg-white/60 p-2 rounded border border-black/5">
            <strong className="block text-slate-800 mb-1">自家狀態</strong>
            <span className="font-mono text-slate-600">
              {info.isTenpai ? "✅ 已聽牌" : "❌ 未聽牌"} | 預估 {info.estHan}{" "}
              翻
            </span>
          </div>
          <div className="bg-white/60 p-2 rounded border border-black/5">
            <strong className="block text-slate-800 mb-1">敵方威脅分析</strong>
            {info.threats.length === 0 ? (
              <span className="text-emerald-600 font-bold">目前無明顯威脅</span>
            ) : (
              <div className="flex flex-col gap-0.5">
                {info.threats.map((t, i) => (
                  <span key={i} className="text-red-600 font-bold">
                    {t.name}: {t.reasons.join(", ")}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {info.logicSteps && info.logicSteps.length > 0 && (
          <div className="bg-white/80 p-3 rounded-lg border border-black/10 text-xs mt-2">
            <strong className="flex items-center gap-1.5 text-slate-800 mb-2 border-b border-black/5 pb-1.5">
              <Lightbulb size={14} className="text-amber-500" /> AI 判斷邏輯推演
            </strong>
            <ul className="space-y-2">
              {info.logicSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 opacity-70 text-[10px] bg-black/10 px-1.5 py-0.5 rounded font-mono text-slate-700">
                    {idx + 1}
                  </span>
                  <span className="text-slate-700 leading-relaxed font-medium">
                    {step}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default TacticalAdvisor;
