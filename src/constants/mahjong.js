export const SANMA_TILE_SET = [
  "1m",
  "9m",
  "1p",
  "2p",
  "3p",
  "4p",
  "5p",
  "6p",
  "7p",
  "8p",
  "9p",
  "1s",
  "2s",
  "3s",
  "4s",
  "5s",
  "6s",
  "7s",
  "8s",
  "9s",
  "1z",
  "2z",
  "3z",
  "4z",
  "5z",
  "6z",
  "7z",
];

export const TILE_LABELS = {
  "1z": "東",
  "2z": "南",
  "3z": "西",
  "4z": "北",
  "5z": "白",
  "6z": "發",
  "7z": "中",
};

export const getTileName = (tile) => {
  if (!tile) return "";
  const r = tile.charAt(0);
  const s = tile.charAt(1);
  if (r === "0") return `赤5${s === "p" ? "筒" : "索"}`;
  if (s === "m") return `${r}萬`;
  if (s === "p") return `${r}筒`;
  if (s === "s") return `${r}索`;
  return TILE_LABELS[tile] || tile;
};
