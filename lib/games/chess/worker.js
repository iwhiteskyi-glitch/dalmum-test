// 체스 컴퓨터 생각(높은 단계는 2초 넘게 걸릴 수 있어서 화면과 따로 계산해요)
import { pickMove } from "./ai.js";

self.onmessage = (e) => {
  const { id, state, level } = e.data;
  let move = null;
  try {
    move = pickMove(state, level);
  } catch {
    move = null;
  }
  self.postMessage({ id, move });
};
