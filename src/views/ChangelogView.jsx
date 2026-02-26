import React from "react";
import { History } from "lucide-react";
import { CHANGELOG_DATA } from "../data/changelogData";

export const ChangelogView = () => (
  <div className="space-y-8 animate-in fade-in zoom-in-95">
    <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-6 md:p-8 rounded-2xl shadow-xl text-white">
      <h2 className="text-2xl md:text-3xl font-black mb-3 flex items-center gap-3">
        <History className="text-slate-300 w-6 h-6 md:w-8 md:h-8" />{" "}
        版本更新歷程
      </h2>
      <p className="text-slate-200 text-sm md:text-base leading-relaxed max-w-3xl">
        紀錄本訓練平台的演進與功能升級。感謝您使用本系統精進三麻技術！
      </p>
    </div>
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
      <div className="space-y-6">
        {CHANGELOG_DATA.map((log, idx) => (
          <div
            key={idx}
            className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 last:border-transparent pb-6 last:pb-0"
          >
            <div
              className={`absolute w-3 h-3 md:w-4 md:h-4 rounded-full -left-[7px] md:-left-[9px] top-1.5 border-2 border-white ${
                idx === 0
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                  : "bg-slate-300"
              }`}
            ></div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
              <h3 className="text-lg md:text-xl font-black text-slate-800">
                {log.version}
              </h3>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-md w-max ${
                  idx === 0
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {log.date}
              </span>
            </div>
            <ul className="list-disc list-outside ml-4 space-y-1.5 text-sm md:text-base text-slate-600">
              {log.changes.map((change, cIdx) => (
                <li key={cIdx} className="leading-relaxed pl-1">
                  {change}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </div>
);
