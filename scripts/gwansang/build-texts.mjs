// 관상 풀이 원문(texts-parts.mjs·texts-synthesis.mjs)을 lib/gwansang/texts.json 하나로 묶습니다.
// 문장을 고칠 때는 원문 두 파일을 고치고 이 스크립트를 다시 돌리세요: node scripts/gwansang/build-texts.mjs
import fs from "node:fs";
import parts from "./texts-parts.mjs";
import synthesis from "./texts-synthesis.mjs";

const out = {
  intro:
    "사진 한 장으로 눈·눈썹·코·입·턱·이목구비 배치를 부위마다 두 가지씩 재서, 전통 관상학 방식으로 인상을 풀어 드려요. 정확한 운명 판단이 아니라 재미로 보는 인상 풀이예요.",
  resultLead: "사진 속 얼굴의 비율을 재서, 전통 관상에서 그런 생김새를 어떻게 풀이하는지 모았어요.",
  disclaimer:
    "전통 관상학의 해석을 바탕으로 재미로 보는 인상 풀이예요. 사람의 기질과 분위기는 얼굴 생김새 하나로 정해지지 않고, 같은 사람도 사진의 각도·표정·조명에 따라 결과가 달라질 수 있어요.",
  synthesisLead: "얼굴형·턱선·두 눈 사이 간격, 얼굴 전체의 짜임새를 함께 묶어서 본 인상이에요.",
  // 종합 이름 아래 한 줄 — 칸 번호 순서(값이 작은 쪽부터)
  synthesisFeatures: {
    face: ["갸름한 얼굴형", "계란형 얼굴", "둥근 얼굴형"],
    jaw: ["부드러운 턱선", "각진 턱선"],
    eyes: ["두 눈 사이 가까운 편", "두 눈 사이 보통", "두 눈 사이 넓은 편"],
  },
  parts,
  synthesis,
};

fs.writeFileSync(new URL("../../lib/gwansang/texts.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log("lib/gwansang/texts.json 저장");
