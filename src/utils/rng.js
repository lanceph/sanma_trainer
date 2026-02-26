// Mulberry32 亂數演算法：給定相同的 seed 數字，會產生相同的亂數序列
export function mulberry32(a) {
  return function () {
    var t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 產生隨機的 6 碼房間代碼/種子
export function generateRoomSeed() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
