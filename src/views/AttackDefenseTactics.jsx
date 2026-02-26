import React from "react";
import { ShieldAlert, Lightbulb } from "lucide-react";
import Tile from "../components/Tile";
import { TACTICS_DATA } from "../data/tacticsData";

export const AttackDefenseTactics = () => (
  <div className="space-y-8 animate-in fade-in zoom-in-95">
    <div className="bg-gradient-to-r from-orange-600 to-red-700 p-6 md:p-8 rounded-2xl shadow-xl text-white">
      <h2 className="text-2xl md:text-3xl font-black mb-3 flex items-center gap-3">
        <ShieldAlert className="text-orange-200 w-6 h-6 md:w-8 md:h-8" />{" "}
        攻防與局收支判斷
      </h2>
      <p className="text-orange-100 text-sm md:text-base leading-relaxed max-w-3xl">
        麻將不是只比誰和牌快，更比誰懂得「避險」。本區塊深入解析《數據制勝》中「局收支
        (EV)」的觀念。在三麻的高打點環境下，猶豫不決的「兜牌」是致命傷，要攻就攻到底，要守就徹底棄和！
      </p>
    </div>

    <div className="space-y-8">
      {TACTICS_DATA.map((section, idx) => (
        <div
          key={idx}
          className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200"
        >
          <h3 className="text-xl md:text-2xl font-black mb-6 text-slate-800 border-b pb-4">
            {section.category}
          </h3>
          <div className="space-y-6">
            {section.items.map((item, i) => (
              <div
                key={i}
                className="flex flex-col lg:flex-row gap-4 lg:gap-6 bg-slate-50 p-5 md:p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* 左側：情境與動作 */}
                <div className="lg:w-1/3 flex flex-col gap-3">
                  <h4 className="text-lg font-black text-slate-800 leading-tight">
                    {item.title}
                  </h4>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-600">
                    <span className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                      面對情境
                    </span>
                    {item.situation}
                  </div>
                  <div
                    className={`mt-auto w-max px-4 py-2 rounded-lg text-white font-black text-sm tracking-widest shadow-sm ${item.actionColor}`}
                  >
                    {item.action}
                  </div>
                </div>

                {/* 右側：解析與牌例 */}
                <div className="lg:w-2/3 flex flex-col justify-center">
                  <div className="flex items-start gap-2 mb-3 text-slate-700 text-sm md:text-base leading-relaxed">
                    <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p>{item.desc}</p>
                  </div>

                  {item.tiles && item.tiles.length > 0 && (
                    <div className="mt-2">
                      <span className="block text-xs font-bold text-slate-400 mb-2">
                        牌型範例：
                      </span>
                      <div className="flex gap-1 bg-white p-2 md:p-3 rounded-lg border border-slate-200 shadow-inner w-max">
                        {item.tiles.map((t, tidx) => (
                          <Tile key={tidx} tile={t} small={true} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);
