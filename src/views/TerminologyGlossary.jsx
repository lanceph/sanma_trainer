import React from "react";
import { Library } from "lucide-react";
import Tile from "../components/Tile";
import { TERM_CATEGORIES } from "../data/tacticsData";

export const TerminologyGlossary = () => (
  <div className="space-y-8 animate-in fade-in zoom-in-95">
    <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-8 rounded-2xl shadow-xl text-white">
      <h2 className="text-3xl font-black mb-3 flex items-center gap-3">
        <Library className="text-purple-300 w-8 h-8" /> 三麻戰術與牌理百科
      </h2>
      <p className="text-purple-100 text-sm md:text-base leading-relaxed max-w-3xl">
        本百科完整收錄並萃取自《79博客》與《數據制勝：三人麻將》的核心理論。從新手必備的基礎單位，到高階的複合形拆解與防守迷思。配合實際牌型範例，幫助您快速建立強大的牌效邏輯與防守判斷。
      </p>
    </div>

    <div className="space-y-8">
      {TERM_CATEGORIES.map((cat, idx) => {
        const CatIcon = cat.icon;
        return (
          <div
            key={idx}
            className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200"
          >
            <h3
              className={`text-xl md:text-2xl font-black mb-6 flex items-center gap-3 text-${cat.color}-700 border-b pb-4`}
            >
              <CatIcon className={`text-${cat.color}-500`} size={28} />{" "}
              {cat.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cat.items.map((item, i) => (
                <div
                  key={i}
                  className="bg-slate-50 p-5 rounded-xl border border-slate-100 shadow-inner flex flex-col"
                >
                  <strong className="text-lg text-slate-800 mb-3 block">
                    {item.name}
                  </strong>
                  {item.tiles && item.tiles.length > 0 && (
                    <div className="flex gap-1 mb-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm w-max">
                      {item.tiles.map((t, tidx) => (
                        <Tile key={tidx} tile={t} small={true} />
                      ))}
                    </div>
                  )}
                  <p className="text-slate-600 text-sm leading-relaxed mt-auto">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);
