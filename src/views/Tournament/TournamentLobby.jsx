// src/views/Tournament/TournamentLobby.jsx
import React, { useState } from "react";
import {
  Swords,
  User,
  KeyRound,
  PlusCircle,
  LogIn,
  Trophy,
} from "lucide-react";
import {
  createTournament,
  joinTournament,
} from "../../services/tournamentService";

export default function TournamentLobby({ onJoinSuccess }) {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [rounds, setRounds] = useState(3);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!playerName.trim()) return setError("請先輸入玩家名稱！");
    setError("");
    setIsLoading(true);
    try {
      const { tid, myPlayerId } = await createTournament(playerName, rounds);
      onJoinSuccess(tid, myPlayerId); // 成功後通知外層元件切換畫面
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!playerName.trim()) return setError("請先輸入玩家名稱！");
    if (roomCode.length !== 6) return setError("請輸入 6 碼房間代碼！");
    setError("");
    setIsLoading(true);
    try {
      const { tid, myPlayerId } = await joinTournament(
        roomCode.toUpperCase(),
        playerName
      );
      onJoinSuccess(tid, myPlayerId);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-700">
      <div className="text-center mb-6">
        <Trophy size={48} className="mx-auto text-amber-400 mb-4" />
        <h2 className="text-2xl font-black text-white tracking-widest">
          鏡像錦標賽
        </h2>
        <p className="text-slate-400 text-sm mt-2">最高 8 人同源牌局對決</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-slate-300 font-bold mb-2 flex items-center gap-2 text-sm">
            <User size={16} className="text-emerald-400" /> 您的專屬名稱
          </label>
          <input
            type="text"
            maxLength={10}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-600 focus:border-emerald-500 outline-none text-center font-bold"
            placeholder="例如: 雀死大神"
          />
        </div>

        {error && (
          <div className="text-red-400 text-sm font-bold text-center bg-red-900/20 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="pt-4 border-t border-slate-700/50">
          {!isJoining ? (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center bg-slate-800 px-4 py-2 rounded-lg mb-2">
                <span className="text-slate-300 text-sm font-bold">
                  賽制 (局數)
                </span>
                <select
                  value={rounds}
                  onChange={(e) => setRounds(Number(e.target.value))}
                  className="bg-slate-700 text-white border-none rounded p-1 outline-none font-bold"
                >
                  <option value={1}>一局定勝負</option>
                  <option value={3}>三戰兩勝</option>
                  <option value={5}>五局大戰</option>
                </select>
              </div>
              <button
                onClick={handleCreate}
                disabled={isLoading}
                className="w-full flex justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl"
              >
                <PlusCircle size={20} />{" "}
                {isLoading ? "建立中..." : "建立新賽事"}
              </button>
              <button
                onClick={() => setIsJoining(true)}
                className="w-full flex justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 rounded-xl border border-slate-600"
              >
                <LogIn size={20} /> 我有賽事代碼
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-slate-300 font-bold mb-2 flex items-center gap-2 text-sm">
                  <KeyRound size={16} className="text-amber-400" /> 賽事代碼
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-800 text-amber-400 font-mono text-xl tracking-[0.25em] px-4 py-3 rounded-xl border border-slate-600 focus:border-amber-500 outline-none text-center uppercase"
                  placeholder="輸入 6 碼"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setIsJoining(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl"
                >
                  返回
                </button>
                <button
                  onClick={handleJoin}
                  disabled={isLoading}
                  className="flex-[2] flex justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-black py-3 rounded-xl"
                >
                  <LogIn size={20} /> {isLoading ? "連線中..." : "立即加入"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
