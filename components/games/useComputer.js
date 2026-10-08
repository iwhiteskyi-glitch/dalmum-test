"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * 컴퓨터 생각: 게임별 작업자(Web Worker)에서 계산해서 화면이 멈추지 않게 해요.
 * 작업자를 못 쓰는 환경이면 화면 쪽에서 직접 계산해요(그동안 잠깐 멈출 수 있어요).
 * 반환: (state, level) → Promise<수 | null>
 */
export default function useComputer(rules) {
  const workerRef = useRef(null);
  const seq = useRef(0);
  useEffect(
    () => () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    []
  );
  return useCallback(
    (state, level) => {
      const id = ++seq.current;
      return new Promise((resolve) => {
        let worker = workerRef.current;
        if (!worker && typeof Worker !== "undefined") {
          try {
            worker = rules.createWorker();
            workerRef.current = worker;
          } catch {
            worker = null;
          }
        }
        if (worker) {
          const onMessage = (e) => {
            if (e.data.id !== id) return;
            worker.removeEventListener("message", onMessage);
            resolve(e.data.move ?? null);
          };
          worker.addEventListener("message", onMessage);
          worker.postMessage({ id, state, level });
          return;
        }
        rules
          .loadAi()
          .then(({ pickMove }) =>
            setTimeout(() => {
              try {
                resolve(pickMove(state, level));
              } catch {
                resolve(null);
              }
            }, 0)
          )
          .catch(() => resolve(null));
      });
    },
    [rules]
  );
}
