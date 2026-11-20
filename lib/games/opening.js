// 첫 판 선공을 정하는 룰렛의 시간과 침의 각도. 게임 규칙(방장)은 SPIN_MS만큼 시작을 미루고, 화면은 침을 돌린다.
// 누가 먼저인지는 방장이 정해서 알려 주므로 폰마다 같은 사람에게 멈춘다. 침은 언제나 맨 위에서 출발해서 결과를 미리 알 수 없다.
/** 원판과 이름을 볼 틈 (침이 돌기 전) */
export const SPIN_WAIT_MS = 600;
/** 침이 도는 시간 */
export const SPIN_TURN_MS = 3600;
/** 멈춘 뒤 "○○ 먼저!"를 보여주는 시간 */
export const SPIN_HOLD_MS = 900;
/** 룰렛 전체 시간. 이 시간 뒤에 게임이 시작된다 */
export const SPIN_MS = SPIN_WAIT_MS + SPIN_TURN_MS + SPIN_HOLD_MS;
/** 멈추기 전에 도는 바퀴 수 */
const SPIN_TURNS = 4;
/** 칸 안에서 침이 흔들리는 폭 (칸 절반 대비). 칸 경계에 걸쳐 보이지 않게 끝까지는 안 간다 */
const NEEDLE_WOBBLE = 0.7;
/** 침이 멈출 각도 (맨 위가 0, 시계 방향). nudge는 -1~1로 칸 안의 어디에 멈출지를 정한다 */
export function needleAngle(count, target, nudge) {
  const slice = 360 / count;
  return SPIN_TURNS * 360 + (target + 0.5) * slice + (nudge * NEEDLE_WOBBLE * slice) / 2;
}
/** 칸 안에서 멈출 자리(-1~1). 모두에게 같은 글자(처음 뒤집은 카드 등)로 정해서 폰마다 침이 같은 곳에 선다 */
export function nudgeOf(seed) {
  const sum = [...seed].reduce((total, char, i) => total + char.charCodeAt(0) * (i + 3), 0);
  return (sum % 21) / 10 - 1;
}
/** 첫 판 선공을 뽑는다 (방장이 한 번 뽑아 모두에게 알린다) */
export const pickOpener = (players, random) => players[Math.floor(random() * players.length)];
/** 이 각도의 침이 가리키는 칸 번호 */
export function sliceAt(count, angle) {
  const turned = ((angle % 360) + 360) % 360;
  return Math.floor(turned / (360 / count));
}
