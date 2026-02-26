import { useState, useEffect } from "react";
import { db, ref, onValue } from "../utils/firebase";

export function useTournamentSync(tid) {
  const [tournamentData, setTournamentData] = useState(null);

  useEffect(() => {
    if (!tid) return;

    // 指向 Firebase 中該房間的節點
    const tournamentRef = ref(db, `tournaments/${tid}`);

    // onValue 會持續監聽，只要有玩家加入或狀態改變，就會自動觸發更新
    const unsubscribe = onValue(tournamentRef, (snapshot) => {
      if (snapshot.exists()) {
        setTournamentData(snapshot.val());
      }
    });

    // 元件卸載時清除監聽器，避免 Memory Leak
    return () => unsubscribe();
  }, [tid]);

  return tournamentData;
}
