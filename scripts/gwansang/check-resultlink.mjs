// 관상 결과 링크 왕복 + 예전 링크(#w1) 열기 + 잘못된 링크 거르기 회귀 테스트
import { encodeGwansangLink, decodeGwansangLink } from "../../lib/gwansang/resultLink.js";
import { PARTS, DIM_COUNT } from "../../lib/gwansang/classify.js";

let fail = 0;
let count = 0;
function check(label, cond) {
  count++;
  if (!cond) {
    fail++;
    console.log(`[FAIL] ${label}`);
  }
}
const same = (a, b) => a && PARTS.every((p) => a[p][0] === b[p][0] && a[p][1] === b[p][1]);

// 1) 모든 조합을 왕복 (9*9*9*6*6*9 = 236,196가지)
const combos = PARTS.map((p) => {
  const out = [];
  for (let a = 0; a < DIM_COUNT[p][0]; a++) for (let b = 0; b < DIM_COUNT[p][1]; b++) out.push([a, b]);
  return out;
});
let n = 0;
let roundFail = 0;
(function walk(i, acc) {
  if (i === PARTS.length) {
    n++;
    const link = encodeGwansangLink(acc);
    if (!same(decodeGwansangLink(link), acc) || !/^#w2(\.\d\d){6}$/.test(link)) roundFail++;
    return;
  }
  for (const pair of combos[i]) walk(i + 1, { ...acc, [PARTS[i]]: pair });
})(0, {});
check(`왕복 ${n}가지 전부 같게 돌아옴(실패 ${roundFail})`, roundFail === 0 && n === 236196);

// 2) 링크에 사진·좌표가 담기지 않는지(형식이 두 자리 숫자 여섯 개뿐인지)
{
  const link = encodeGwansangLink({ eye: [1, 2], brow: [0, 1], nose: [2, 0], mouth: [1, 1], jaw: [0, 2], layout: [1, 1] });
  check("링크 형식 #w2.12.01.20.11.02.11", link === "#w2.12.01.20.11.02.11");
  check("링크 길이가 짧음(좌표 등 큰 데이터 없음)", link.length < 24);
}

// 3) 예전 링크(#w1)도 열림 — 예전 번호를 지금 칸으로 옮기고, 둘째 값은 가운데 칸
{
  // 예전: 눈 1(부드러운) · 눈썹 0(아치형) · 코 1(콧대 곧은) · 입 0(도톰한) · 턱 0(각진) · 배치 1(오밀조밀)
  const got = decodeGwansangLink("#w1.1.0.1.0.0.1");
  const want = { eye: [1, 1], brow: [2, 1], nose: [0, 1], mouth: [2, 0], jaw: [1, 1], layout: [0, 1] };
  check(`예전 링크 #w1.1.0.1.0.0.1 → ${JSON.stringify(got)}`, same(got, want));
  let v1 = 0;
  for (let e = 0; e < 3; e++) for (let b = 0; b < 3; b++) for (let no = 0; no < 3; no++)
    for (let m = 0; m < 3; m++) for (let j = 0; j < 2; j++) for (let l = 0; l < 3; l++) {
      const c = decodeGwansangLink(`#w1.${e}.${b}.${no}.${m}.${j}.${l}`);
      if (c && PARTS.every((p) => c[p].every((x, d) => x >= 0 && x < DIM_COUNT[p][d]))) v1++;
    }
  check(`예전 링크 486가지 전부 열림(${v1})`, v1 === 486);
}

// 4) 잘못된 링크는 전부 null
const bad = [
  "", null, undefined,
  "#w2.00.00.00.00.00", // 자리 수 부족
  "#w2.00.00.00.00.00.00.00", // 자리 수 초과
  "#w2.30.00.00.00.00.00", // 눈 첫째 값 범위 초과
  "#w2.03.00.00.00.00.00", // 눈 둘째 값 범위 초과
  "#w2.00.00.00.02.00.00", // 입꼬리는 0~1
  "#w2.00.00.00.00.20.00", // 턱선은 0~1
  "#w2.00.00.00.00.03.00", // 얼굴형 범위 초과
  "#w2.0.00.00.00.00.00", // 한 자리
  "#w2.000.00.00.00.00.00", // 세 자리
  "#w2.-1.00.00.00.00.00", // 음수
  "#w2.a0.00.00.00.00.00", // 숫자 아님
  "#w1.3.0.0.0.0.0", // 예전 링크 범위 초과
  "#w1.0.0.0.0.2.0", // 예전 턱 범위 초과
  "#w1.0.0.0.0.0", // 예전 자리 수 부족
  "#w1.00.0.0.0.0.0", // 예전 두 자리
  "#f1.20260101.5.3", // 다른 코너
  "#g2.1.2.3.4.11111.22222.3",
  "w2.00.00.00.00.00.00", // "#" 없음
];
for (const h of bad) check(`잘못된 링크 거름: ${JSON.stringify(h)}`, decodeGwansangLink(h) === null);

console.log(fail === 0 ? `통과 (${count}건 확인)` : `${fail}건 실패`);
if (fail > 0) process.exit(1);
