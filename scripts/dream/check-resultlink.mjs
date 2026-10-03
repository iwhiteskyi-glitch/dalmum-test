// 꿈해몽 결과 링크(encode/decode) 왕복 + 잘못된 링크 거르기 검사.
// 실행: node scripts/dream/check-resultlink.mjs
import { encodeDreamLink, decodeDreamLink } from "../../lib/dream/resultLink.js";
import { SYMBOL_IDS, MAX_SELECT } from "../../lib/dream/select.js";

let fail = 0;
function check(name, cond) {
  if (!cond) {
    fail++;
    console.log(`FAIL: ${name}`);
  }
}

// 1) 왕복: 단일 선택 전부 + 무작위 조합 다수
for (const id of SYMBOL_IDS) {
  const link = encodeDreamLink([id]);
  const back = decodeDreamLink(link);
  check(`왕복(단일) ${id}`, JSON.stringify(back) === JSON.stringify([id]));
}

let seed = 1;
function rand() {
  seed = (seed * 48271) % 2147483647;
  return seed / 2147483647;
}
for (let i = 0; i < 500; i++) {
  const n = 1 + Math.floor(rand() * MAX_SELECT);
  const pool = [...SYMBOL_IDS];
  const pick = [];
  for (let k = 0; k < n; k++) {
    const idx = Math.floor(rand() * pool.length);
    pick.push(pool.splice(idx, 1)[0]);
  }
  const link = encodeDreamLink(pick);
  const back = decodeDreamLink(link);
  check(`왕복(조합 ${i}) ${pick.join(",")}`, JSON.stringify(back) === JSON.stringify(pick));
}

// 2) 잘못된 링크는 전부 null
const bad = [
  "", "#", "#d1", "#d1.", "#w1.snake", // 다른 코너 키
  "#d1.unknown-symbol", "#d1.snake-unknown",
  `#d1.${SYMBOL_IDS.slice(0, MAX_SELECT + 1).join("-")}`, // 7개(최대 초과)
  `#d1.snake-snake`, // 중복
  "#d1.snake-", "#d1.-snake",
  "#d1.SNAKE", // 대소문자 다름
];
for (const h of bad) {
  check(`거름: "${h}"`, decodeDreamLink(h) === null);
}

console.log(fail === 0 ? "전부 통과" : `${fail}건 실패`);
process.exit(fail === 0 ? 0 : 1);
