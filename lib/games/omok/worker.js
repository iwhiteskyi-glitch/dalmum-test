// 컴퓨터 생각은 별도 작업자(Web Worker)에서 해요. 높은 단계는 한 수에 1초 넘게 걸릴 수 있어서,
// 그동안 화면이 멈추지 않게 하려는 거예요.
import { chooseMove } from "./ai.js";

self.onmessage = (e) => {
  const { id, moves, level } = e.data;
  let cell = -1;
  try {
    cell = chooseMove(moves, level);
  } catch {
    cell = -1;
  }
  self.postMessage({ id, cell });
};
