import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// 🌟 將 duration 預設值縮短為 1000ms (1秒)
export const CutInEffect = ({
  type,
  text,
  color = "text-yellow-400",
  duration = 1000,
  onComplete,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!visible) return null;

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none animate-cut-in-overlay">
      {/* 壓暗背景：稍微調降一點黑度，從 60% 降到 50%，讓底下的牌桌更透一點 */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* 閃電特效 (專屬立直使用) */}
      {type === "riichi" && (
        <div className="absolute inset-0 animate-lightning mix-blend-overlay"></div>
      )}

      {/* 砸入文字：加入 font-serif (襯線體), italic (傾斜), tracking-[0.2em] (拉開字距) */}
      <div
        className={`relative z-10 font-serif italic font-black text-8xl md:text-9xl tracking-[0.2em] ${color} animate-cut-in-text drop-shadow-[0_0_30px_rgba(0,0,0,0.9)]`}
        style={{ WebkitTextStroke: "2px black" }}
      >
        {text}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
