import React from "react";
import { motion } from "framer-motion"; // 🌟 引入 framer-motion
import { TILE_LABELS } from "../constants/mahjong";

const COLORS = {
  red: "#dc2626",
  green: "#059669",
  blue: "#1e3a8a",
  black: "#0f172a",
};

const PinGraphics = React.memo(({ rank }) => {
  const Circle = ({ cx, cy, c }) => (
    <g>
      <circle cx={cx} cy={cy} r="14" fill={c} />
      <circle cx={cx} cy={cy} r="6" fill="#fff" opacity="0.4" />
    </g>
  );
  const C = COLORS;
  let circles = [];
  switch (rank) {
    case "1":
      circles = [
        <circle key="1" cx="50" cy="70" r="28" fill={C.red} />,
        <circle key="1b" cx="50" cy="70" r="10" fill="#fff" opacity="0.6" />,
      ];
      break;
    case "2":
      circles = [
        [50, 35, C.green],
        [50, 105, C.blue],
      ].map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} c={p[2]} />);
      break;
    case "3":
      circles = [
        [30, 30, C.blue],
        [50, 70, C.red],
        [70, 110, C.green],
      ].map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} c={p[2]} />);
      break;
    case "4":
      circles = [
        [30, 35, C.blue],
        [70, 35, C.blue],
        [30, 105, C.blue],
        [70, 105, C.blue],
      ].map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} c={p[2]} />);
      break;
    case "5":
      circles = [
        [30, 30, C.blue],
        [70, 30, C.blue],
        [50, 70, C.red],
        [30, 110, C.blue],
        [70, 110, C.blue],
      ].map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} c={p[2]} />);
      break;
    case "0":
      circles = [
        [30, 30, C.red],
        [70, 30, C.red],
        [50, 70, C.red],
        [30, 110, C.red],
        [70, 110, C.red],
      ].map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} c={p[2]} />);
      break;
    case "6":
      circles = [
        [30, 25, C.green],
        [70, 25, C.green],
        [30, 70, C.red],
        [70, 70, C.red],
        [30, 115, C.red],
        [70, 115, C.red],
      ].map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} c={p[2]} />);
      break;
    case "7":
      circles = [
        [25, 25, C.green],
        [50, 45, C.green],
        [75, 65, C.green],
        [30, 105, C.red],
        [70, 105, C.red],
        [30, 130, C.red],
        [70, 130, C.red],
      ].map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="11" fill={p[2]} />
      ));
      break;
    case "8":
      circles = [
        [30, 25],
        [70, 25],
        [30, 55],
        [70, 55],
        [30, 85],
        [70, 85],
        [30, 115],
        [70, 115],
      ].map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="12" fill={C.blue} />
      ));
      break;
    case "9":
      circles = [25, 70, 115]
        .flatMap((y) => [
          [20, y, C.red],
          [50, y, C.blue],
          [80, y, C.green],
        ])
        .map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="11" fill={p[2]} />
        ));
      break;
    default:
      break;
  }
  return (
    <svg viewBox="0 0 100 140" className="w-full h-full">
      {circles}
    </svg>
  );
});

const SouGraphics = React.memo(({ rank }) => {
  const C = COLORS;
  const Bamboo = ({ x, y, c }) => (
    <g transform={`translate(${x},${y})`}>
      <rect x="-6" y="-16" width="12" height="32" rx="4" fill={c} />
      <line
        x1="0"
        y1="-12"
        x2="0"
        y2="12"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
  );
  let elements = [];
  switch (rank) {
    case "1":
      elements = (
        <g transform="translate(10, 20)">
          <path
            d="M40 80 Q60 110 80 80 Q90 50 40 10 Q10 40 40 80 Z"
            fill={C.green}
            opacity="0.9"
          />
          <circle cx="35" cy="40" r="12" fill={C.red} />
          <path d="M25 35 L10 45 L25 50 Z" fill={C.blue} />
        </g>
      );
      break;
    case "2":
      elements = [
        [50, 40, C.green],
        [50, 100, C.blue],
      ].map((p, i) => <Bamboo key={i} x={p[0]} y={p[1]} c={p[2]} />);
      break;
    case "3":
      elements = [
        [50, 30, C.green],
        [30, 105, C.blue],
        [70, 105, C.green],
      ].map((p, i) => <Bamboo key={i} x={p[0]} y={p[1]} c={p[2]} />);
      break;
    case "4":
      elements = [
        [30, 40, C.green],
        [70, 40, C.green],
        [30, 100, C.green],
        [70, 100, C.green],
      ].map((p, i) => <Bamboo key={i} x={p[0]} y={p[1]} c={p[2]} />);
      break;
    case "5":
      elements = [
        [30, 40, C.green],
        [70, 40, C.green],
        [50, 70, C.red],
        [30, 100, C.green],
        [70, 100, C.green],
      ].map((p, i) => <Bamboo key={i} x={p[0]} y={p[1]} c={p[2]} />);
      break;
    case "0":
      elements = [
        [30, 40, C.red],
        [70, 40, C.red],
        [50, 70, C.red],
        [30, 100, C.red],
        [70, 100, C.red],
      ].map((p, i) => <Bamboo key={i} x={p[0]} y={p[1]} c={p[2]} />);
      break;
    case "6":
      elements = [
        [25, 40],
        [50, 40],
        [75, 40],
        [25, 100],
        [50, 100],
        [75, 100],
      ].map((p, i) => <Bamboo key={i} x={p[0]} y={p[1]} c={C.green} />);
      break;
    case "7":
      elements = [
        <Bamboo key="top" x={50} y={30} c={C.red} />,
        ...[
          [25, 85],
          [50, 85],
          [75, 85],
          [25, 120],
          [50, 120],
          [75, 120],
        ].map((p, i) => <Bamboo key={i} x={p[0]} y={p[1]} c={C.green} />),
      ];
      break;
    case "8":
      elements = [
        [30, 25],
        [70, 25],
        [30, 60],
        [70, 60],
        [30, 95],
        [70, 95],
        [30, 130],
        [70, 130],
      ].map((p, i) => <Bamboo key={i} x={p[0]} y={p[1]} c={C.green} />);
      break;
    case "9":
      elements = [30, 70, 110]
        .flatMap((y) => [
          [25, y, C.red],
          [50, y, C.blue],
          [75, y, C.green],
        ])
        .map((p, i) => <Bamboo key={i} x={p[0]} y={p[1]} c={p[2]} />);
      break;
    default:
      break;
  }
  return (
    <svg viewBox="0 0 100 140" className="w-full h-full">
      {elements}
    </svg>
  );
});

const TextGraphics = React.memo(({ tile }) => {
  const rank = tile.charAt(0);
  const suit = tile.charAt(1);
  const NUMBERS = {
    1: "一",
    2: "二",
    3: "三",
    4: "四",
    5: "五",
    6: "六",
    7: "七",
    8: "八",
    9: "九",
  };

  if (suit === "m") {
    return (
      <svg viewBox="0 0 100 140" className="w-full h-full select-none">
        <text
          x="50"
          y="45%"
          dominantBaseline="middle"
          fontFamily="serif"
          fontSize="48"
          fontWeight="900"
          textAnchor="middle"
          fill="#1e293b"
        >
          {NUMBERS[rank]}
        </text>
        <text
          x="50"
          y="85%"
          dominantBaseline="middle"
          fontFamily="serif"
          fontSize="56"
          fontWeight="900"
          textAnchor="middle"
          fill="#b91c1c"
        >
          萬
        </text>
      </svg>
    );
  } else if (suit === "z") {
    if (rank === "5")
      return (
        <div className="w-[70%] h-[80%] border-[3px] md:border-[4px] border-slate-300 rounded-sm"></div>
      );
    let color = rank === "6" ? "#059669" : rank === "7" ? "#dc2626" : "#1e293b";
    return (
      <svg viewBox="0 0 100 140" className="w-full h-full select-none">
        <text
          x="50"
          y="55%"
          dominantBaseline="middle"
          fontFamily="serif"
          fontSize="65"
          fontWeight="900"
          textAnchor="middle"
          fill={color}
        >
          {TILE_LABELS[tile]}
        </text>
      </svg>
    );
  }
  return null;
});

const Tile = React.memo(
  ({
    tile,
    onClick,
    onMouseEnter,
    onMouseLeave,
    isSelected,
    isDiscard,
    highlight,
    isDora,
    isJustDrawn,
    isRiver,
    className = "",
    small = false,
    faceDown = false,
    rotated = false,
  }) => {
    const outerSizeClasses = small
      ? "w-8 h-11 md:w-10 md:h-14 flex-shrink-0"
      : "w-10 h-14 md:w-12 md:h-16 flex-shrink-0";

    const innerBorderClasses = small ? "border-b-[3px]" : "border-b-[4px]";
    const rotateClass = rotated ? "transform -rotate-90 origin-center" : "";

    if (faceDown) {
      return (
        <motion.div
          layout // 🌟 啟用佈局動畫
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className={`relative flex items-center justify-center ${outerSizeClasses} ${innerBorderClasses} bg-orange-400 rounded shadow-sm border border-orange-500 border-b-orange-700 ${className}`}
        >
          <div className="w-full h-full opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiAvPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMDAwIiAvPgo8L3N2Zz4=')]"></div>
        </motion.div>
      );
    }

    if (!tile)
      return (
        <motion.div
          layout
          className={`bg-transparent ${outerSizeClasses} ${className}`}
        />
      );

    const suit = tile.slice(-1);
    let bgClass = isDora
      ? "bg-gradient-to-br from-yellow-50 to-[#fff3c7]"
      : "bg-gradient-to-br from-white to-slate-50";
    let borderClass = isDora
      ? "border-amber-300 border-b-amber-500"
      : "border-slate-300 border-b-slate-400";
    let shadowClass = isRiver
      ? "shadow-sm"
      : isDora
      ? "shadow-[0_0_6px_rgba(251,191,36,0.8)]"
      : "shadow-[0_2px_4px_rgba(0,0,0,0.2)]";

    const isInteractive = !small && !isRiver && !!onClick;

    if (isSelected && !small && !isRiver) {
      borderClass =
        "border-yellow-400 border-b-yellow-500 ring-2 ring-yellow-400";
      shadowClass = "shadow-[0_8px_12px_rgba(0,0,0,0.3)]";
    }

    return (
      <motion.div
        layout // 🌟 核心：自動處理位置變換動畫
        // 🌟 摸牌效果：新摸的牌會從右側稍微彈入
        initial={isJustDrawn && !isRiver ? { x: 20, opacity: 0 } : false}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`relative group ${outerSizeClasses} ${rotateClass} ${
          isRiver ? "z-0" : "hover:z-50"
        } ${className}`}
        onClick={() => !isRiver && onClick && onClick(tile)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={isInteractive ? { cursor: "pointer" } : {}}
      >
        <div
          className={`
            absolute inset-0 transition-transform duration-200 ease-out
            ${isSelected && !small && !isRiver ? "-translate-y-4" : ""}
            ${isInteractive && !isSelected ? "group-hover:-translate-y-2" : ""}
            ${highlight ? "z-10 scale-105" : "z-0"}
          `
            .replace(/\s+/g, " ")
            .trim()}
        >
          {isJustDrawn && !small && !isRiver && (
            <div className="absolute -top-3 -right-2 bg-blue-500 text-white text-[9px] md:text-[11px] px-1.5 py-0.5 rounded shadow-md z-30 font-black border border-blue-300 animate-bounce">
              摸
            </div>
          )}

          <div
            className={`
              w-full h-full flex items-center justify-center ${innerBorderClasses} ${bgClass} rounded
              ${borderClass} ${shadowClass} select-none overflow-hidden
              transition-shadow duration-200 ease-out
              ${
                isInteractive && !isSelected
                  ? "group-hover:shadow-[0_8px_15px_rgba(0,0,0,0.3)]"
                  : ""
              }
              ${isDiscard ? "opacity-50 grayscale" : ""}
              ${
                highlight
                  ? "ring-2 ring-green-500 bg-green-50 shadow-[0_0_12px_rgba(34,197,94,0.5)]"
                  : ""
              }
            `
              .replace(/\s+/g, " ")
              .trim()}
          >
            {isDora && !faceDown && (
              <div className="absolute top-1 right-1 w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-400 rounded-full shadow-sm border-[0.5px] border-white z-0"></div>
            )}
            <div className="w-[85%] h-[85%] flex items-center justify-center relative z-0">
              {suit === "p" && <PinGraphics rank={tile.charAt(0)} />}
              {suit === "s" && <SouGraphics rank={tile.charAt(0)} />}
              {(suit === "m" || suit === "z") && <TextGraphics tile={tile} />}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);

export default Tile;
