import React from "react";
import { Swords, Settings, User, Cpu, Clock } from "lucide-react";

export const SimSetupView = ({ state, actions }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center animate-in fade-in zoom-in-95">
    <Swords size={48} className="mx-auto text-blue-600 mb-4" />
    <h2 className="text-2xl font-bold text-slate-800 mb-2">實戰對局模擬</h2>
    <p className="text-slate-600 mb-8">
      模擬真實三人麻將，包含鳴牌、拔北，考驗時間壓力下的牌效判斷。
      <br />
      <span className="text-emerald-600 font-bold text-sm">
        ✨ 最新升級：防守權重引擎與摸牌標示優化
      </span>
    </p>
    <div className="max-w-md mx-auto space-y-6 text-left">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-bold text-slate-700 block mb-2 flex items-center gap-2">
            <Settings size={18} /> 場風
          </label>
          <div className="flex bg-slate-100 rounded-lg p-1">
            {["1z", "2z"].map((w) => (
              <button
                key={w}
                onClick={() => actions.setConfig({ ...state.config, pWind: w })}
                className={`flex-1 py-2 text-sm font-bold rounded-md ${
                  state.config.pWind === w
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-500 hover:bg-slate-200"
                }`}
              >
                {w === "1z" ? "東風場" : "南風場"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-2 flex items-center gap-2">
            <User size={18} /> 您的座位
          </label>
          <div className="flex bg-slate-100 rounded-lg p-1">
            {["1z", "2z", "3z"].map((w) => (
              <button
                key={w}
                onClick={() =>
                  actions.setConfig({ ...state.config, playerWind: w })
                }
                className={`flex-1 py-2 text-xs font-bold rounded-md ${
                  state.config.playerWind === w
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-500 hover:bg-slate-200"
                }`}
              >
                {w === "1z" ? "莊家(東)" : w === "2z" ? "子家(南)" : "子家(西)"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className="font-bold text-slate-700 block mb-2 flex items-center gap-2">
          <Cpu size={18} /> 對手 AI 難度
        </label>
        <div className="flex bg-slate-100 rounded-lg p-1">
          {[1, 2, 3].map((lvl) => (
            <button
              key={lvl}
              onClick={() =>
                actions.setConfig({ ...state.config, aiDiff: lvl })
              }
              className={`flex-1 py-2 text-sm font-bold rounded-md ${
                state.config.aiDiff === lvl
                  ? "bg-slate-800 text-white shadow"
                  : "text-slate-500 hover:bg-slate-200"
              }`}
            >
              {lvl === 1 ? "初級" : lvl === 2 ? "進階" : "高段"}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="font-bold text-slate-700 block mb-2 flex items-center gap-2">
          <Clock size={18} /> 思考時間限制
        </label>
        <div className="grid grid-cols-5 gap-2">
          {[0, 5, 10, 20, 30].map((time) => (
            <button
              key={time}
              onClick={() =>
                actions.setConfig({ ...state.config, timeLimit: time })
              }
              className={`py-2 text-xs font-bold rounded-md border ${
                state.config.timeLimit === time
                  ? "bg-orange-500 text-white border-orange-600 shadow"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {time === 0 ? "無限" : `${time}秒`}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={actions.startGame}
        className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl text-lg hover:bg-slate-800 shadow-lg transform hover:scale-105 transition-all mt-4"
      >
        開始對局
      </button>
    </div>
  </div>
);
