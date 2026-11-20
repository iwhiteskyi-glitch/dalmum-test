"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { actFromMe, finishBots, sendFromMe, startRoom, tickRoom } from "@/lib/games/localRoom";

/** 시계를 맞추는 간격(앱의 방장 폰과 같아요) */
const TICK_MS = 250;

/**
 * 혼자 하기 방을 화면에 붙여요(lib/games/localRoom.js). 방이 있는 동안 0.25초마다 시계를 돌려 컴퓨터가 움직여요.
 * room.view가 내 화면 상태, room.game이 방장 상태(컴퓨터 판 등 끝난 뒤에 보여 줄 때만 써요).
 */
export function useLocalRoom() {
  const [room, setRoom] = useState(null);
  const ref = useRef(null);
  const update = useCallback((change) => {
    const next = change(ref.current);
    if (next === ref.current) return;
    ref.current = next;
    setRoom(next);
  }, []);

  const active = room !== null;
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => update((r) => r && tickRoom(r, Date.now())), TICK_MS);
    return () => clearInterval(t);
  }, [active, update]);

  return {
    room,
    start: useCallback((logic, settings, players) => update(() => startRoom(logic, settings, players, Date.now())), [update]),
    send: useCallback((message) => update((r) => r && sendFromMe(r, message, Date.now())), [update]),
    act: useCallback((change) => update((r) => r && actFromMe(r, change, Date.now())), [update]),
    finish: useCallback(() => update((r) => r && finishBots(r, Date.now())), [update]),
    stop: useCallback(() => update(() => null), [update]),
  };
}
