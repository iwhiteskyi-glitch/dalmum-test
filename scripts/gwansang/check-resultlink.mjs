// 관상 결과 링크 왕복 + 잘못된 링크 거르기 회귀 테스트
import { encodeGwansangLink, decodeGwansangLink } from "../../lib/gwansang/resultLink.js";
import { PARTS, PART_CATEGORY_COUNT } from "../../lib/gwansang/classify.js";

let fail = 0;
function check(label, cond) {
  if (!cond) {
    fail++;
    console.log(`[FAIL] ${label}`);
  }
}

// 1) 모든 카테고리 조합을 왕복시켜 똑같이 돌아오는지 확인 (3*3*3*3*2*3 = 486가지)
let n = 0;
for (let eye = 0; eye < 3; eye++)
  for (let brow = 0; brow < 3; brow++)
    for (let nose = 0; nose < 3; nose++)
      for (let mouth = 0; mouth < 3; mouth++)
        for (let jaw = 0; jaw < 2; jaw++)
          for (let layout = 0; layout < 3; layout++) {
            n++;
            const original = { eye, brow, nose, mouth, jaw, layout };
            const link = encodeGwansangLink(original);
            const back = decodeGwansangLink(link);
            check(
              `왕복 ${JSON.stringify(original)}`,
              back && PARTS.every((p) => back[p] === original[p])
            );
          }
console.log(`왕복 테스트 ${n}가지 완료`);

// 2) 링크에 사진·좌표가 담기지 않는지(형식이 숫자 6자리뿐인지) 확인
{
  const link = encodeGwansangLink({ eye: 1, brow: 2, nose: 0, mouth: 1, jaw: 1, layout: 2 });
  check("링크 형식이 w1.숫자.숫자... 뿐", /^#w1(\.\d+){6}$/.test(link));
  check("링크 길이가 짧음(좌표 등 큰 데이터 없음)", link.length < 20);
}

// 3) 잘못된 링크는 전부 null로 거르는지
const bad = [
  "",
  null,
  undefined,
  "#w1.0.0.0.0.0", // 자리 수 부족(5개)
  "#w1.0.0.0.0.0.0.0", // 자리 수 초과(7개)
  "#w1.3.0.0.0.0.0", // eye는 0~2인데 3
  "#w1.0.3.0.0.0.0", // brow 범위 초과
  "#w1.0.0.3.0.0.0", // nose 범위 초과
  "#w1.0.0.0.3.0.0", // mouth 범위 초과
  "#w1.0.0.0.0.2.0", // jaw는 0~1인데 2
  "#w1.0.0.0.0.0.3", // layout 범위 초과
  "#w1.-1.0.0.0.0.0", // 음수
  "#w1.a.0.0.0.0.0", // 숫자가 아님
  "#f1.20260101.5.3", // 다른 코너(오늘의 운세) 링크
  "#g1.1.2.3.4.11111.22222.3", // 다른 코너(궁합) 링크
  "w1.0.0.0.0.0.0", // "#" 없음
];
for (const h of bad) {
  check(`잘못된 링크 거름: ${JSON.stringify(h)}`, decodeGwansangLink(h) === null);
}

// 4) 다른 코너 사이즈로 착각하지 않는지 — 부위 개수·카테고리 개수가 바뀌면 바로 알 수 있게
check("부위 6개", PARTS.length === 6);
check(
  "카테고리 합계(3+3+3+3+2+3=17)",
  PARTS.reduce((s, p) => s + PART_CATEGORY_COUNT[p], 0) === 17
);

console.log(fail === 0 ? `통과 (${n + bad.length + 4}건 확인)` : `${fail}건 실패`);
if (fail > 0) process.exit(1);
