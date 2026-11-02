/**
 * 읽을거리(짧은 소개/안내 글) 목록. 실제 본문은 app/(content)/reads/<slug>/page.js 에 있습니다.
 * corner: 글과 관련된 코너(lib/site.js의 CORNERS key). 글 아래 "바로 해볼까요?" 안내와
 * 목록의 코너 표시에 씁니다. 새 글은 목록 맨 위에 추가하세요(첫 화면엔 앞의 3개가 나옵니다).
 */
export const READS = [
  {
    slug: "typical-dreams",
    title: "쫓기는 꿈·떨어지는 꿈은 왜 그렇게 흔할까? 누구나 꾸는 '전형적인 꿈' 이야기",
    description:
      "쫓기는 꿈, 떨어지는 꿈, 시험 보는 꿈은 왜 많은 사람이 꿀까요? 전형적인 꿈을 조사한 연구와 가설, 같은 꿈의 해몽 풀이를 함께 봤어요.",
    date: "2026-11-02",
    corner: "dream",
  },
  {
    slug: "dream-symbols-stats",
    title: "꿈해몽 120가지를 나눠 보니, 좋은 흐름과 조심할 흐름의 비율",
    description:
      "꿈해몽 120가지를 분류별로 세어 좋은·무난한·조심할 흐름의 비율을 정리하고, 여러 장면을 고를 때 종합 풀이가 어떻게 나오는지 계산했어요.",
    date: "2026-11-02",
    corner: "dream",
  },
  {
    slug: "omok-first-move",
    title: "오목은 왜 흑이 유리할까? 먼저 두는 쪽의 힘과 쌍삼 금지",
    description:
      "오목은 먼저 두는 흑이 유리하다는 말, 사실일까요? 오목이 컴퓨터로 풀린 이야기, 렌주와 쌍삼 금지 규칙, 컴퓨터끼리 둔 흑·백 승률과 두는 요령을 정리했어요.",
    date: "2026-11-02",
    corner: "games",
  },
  {
    slug: "tti-year-differences",
    title: "같은 띠인데 왜 년생마다 한마디가 다를까? 띠별 운세가 계산되는 방법",
    description:
      "띠 글자 속 천간(본기)으로 보는 띠별 운세의 계산 방법, 같은 말띠라도 90년생·02년생 한마디가 갈리는 이유를 1년 치 계산으로 정리했어요.",
    date: "2026-11-02",
    corner: "fortune",
  },
  {
    slug: "reversi-tips",
    title: "돌 뒤집기(리버시) 잘 두는 법, 귀를 잡고 적게 뒤집어요",
    description:
      "많이 뒤집을수록 좋을 것 같은 돌 뒤집기, 사실은 귀와 둘 곳의 수가 승부를 가려요. 리버시의 역사와 기본 요령을 컴퓨터끼리 둔 결과와 함께 정리했어요.",
    date: "2026-11-02",
    corner: "games",
  },
  {
    slug: "how-game-ai-thinks",
    title: "컴퓨터는 어떻게 다음 수를 고를까? 게임 컴퓨터의 단계가 갈리는 원리",
    description:
      "오목·장기·체스 컴퓨터가 몇 수 앞을 내다보고 점수를 매기는 원리를 쉽게 풀고, 이 사이트 1~10단계가 실제로 얼마나 차이 나는지 대국 결과로 보여 드려요.",
    date: "2026-11-02",
    corner: "games",
  },
  {
    slug: "janggi-chess-xiangqi",
    title: "장기·체스·샹치, 닮은 듯 다른 세 게임 비교",
    description:
      "차와 룩, 포와 대포, 상과 비숍은 어떻게 다를까요? 장기·체스·중국 장기(샹치)의 판과 말, 규칙을 하나씩 견주고 먼저 두는 쪽이 유리한지도 살펴봤어요.",
    date: "2026-11-02",
    corner: "games",
  },
  {
    slug: "daily-puzzle-guide",
    title: "묘수풀이란? 오목·장기·체스 문제 푸는 요령",
    description:
      "정해진 수 안에 이기는 길을 찾는 묘수풀이. 오목 연속 4, 장기 외통, 체스 메이트 문제의 차이와 푸는 요령, 오늘의 문제를 만드는 방법을 정리했어요.",
    date: "2026-11-02",
    corner: "games",
  },
  {
    slug: "why-we-dream",
    title: "사람은 왜 꿈을 꿀까? 렘수면의 발견부터 꿈 연구의 가설까지",
    description:
      "꿈은 잠의 어느 단계에서 꾸는지, 1953년 렘수면은 어떻게 발견됐는지, 꿈의 이유를 설명하는 대표 가설들과 꿈해몽과의 관계를 정리했어요.",
    date: "2026-10-15",
    corner: "dream",
  },
  {
    slug: "korean-dream-culture",
    title: "태몽·돼지꿈·조상 꿈, 한국의 꿈 문화와 꿈을 사고판 옛이야기",
    description:
      "태몽, 돼지꿈과 똥꿈, 돌아가신 분이 나오는 꿈, 삼국유사 속 꿈 매매 이야기까지 한국 사람들이 꿈을 대해 온 방식을 풀어봤어요.",
    date: "2026-10-15",
    corner: "dream",
  },
  {
    slug: "reverse-dreams",
    title: "꿈은 반대? 겉모습과 달리 반가운 꿈으로 풀이되는 해몽 이야기",
    description:
      "죽는 꿈, 시체를 보는 꿈처럼 겉보기와 달리 반가운 꿈으로 풀이되는 해몽 전통을 알아보고, 왜 그런 풀이가 생겼는지 짚어 봤어요.",
    date: "2026-10-15",
    corner: "dream",
  },
  {
    slug: "dream-journal",
    title: "꿈을 잘 기억하는 방법과 꿈 일기 쓰는 법",
    description:
      "꿈은 왜 눈 뜨자마자 사라질까요? 꿈을 붙잡는 생활 속 요령과 꿈 일기 쓰는 순서, 일기를 꿈해몽에 활용하는 방법을 정리했어요.",
    date: "2026-10-15",
    corner: "dream",
  },
  {
    slug: "name-in-other-languages",
    title: "내 이름을 영어·일본어·중국어로 쓰면? 나라별 이름 표기 이야기",
    description:
      "한글 이름의 로마자 표기 규칙과 여권 표기, 일본어 가타카나와 중국어 한자 발음까지, 내 이름이 다른 언어에서 어떻게 달라지는지 정리했어요.",
    date: "2026-10-15",
    corner: "travel",
  },
  {
    slug: "travel-name-card",
    title: "여행 이름 카드는 어떻게 만들어질까? 720개 이름과 가중치 추첨의 원리",
    description:
      "재미로봄 '여행가면 내 이름은?'에서 이름 3장이 뽑히는 원리를 풀어 봤어요. 이름 후보 720개, 분위기 가중치 추첨, 같은 결과가 나오는 조건까지.",
    date: "2026-10-15",
    corner: "travel",
  },
  {
    slug: "gunghap-types",
    title: "겉궁합·속궁합, 띠 궁합과 사주 궁합은 무엇이 다를까",
    description:
      "겉궁합·속궁합이라는 말부터 띠 궁합 속설, 사주 궁합이 보는 곳, 이 사이트 궁합 점수의 구성까지 궁합의 종류를 차근차근 정리했어요.",
    date: "2026-10-15",
    corner: "gunghap",
  },
  {
    slug: "ilji-gunghap",
    title: "일지 궁합이란? 태어난 날의 지지로 보는 관계",
    description:
      "일지는 태어난 날의 아랫글자예요. 같은 글자·합·충이 무슨 뜻인지, 날짜 차이로 알아보는 법과 이 사이트 점수에서의 비중을 정리했어요.",
    date: "2026-10-15",
    corner: "gunghap",
  },
  {
    slug: "gwansang-basics",
    title: "관상의 기본, 오관과 삼정으로 얼굴 읽기",
    description:
      "관상은 얼굴 생김새에서 인상을 읽는 오래된 전통이에요. 오관과 삼정, 고전 마의상법, 이 사이트가 여섯 부위만 다루는 이유를 정리했어요.",
    date: "2026-10-15",
    corner: "gwansang",
  },
  {
    slug: "gwansang-science",
    title: "관상은 과학일까? 얼굴 인상 연구와 관상의 차이",
    description:
      "관상은 과학일까요? 0.1초 만에 생기는 첫인상 연구와 얼굴로 성격을 맞히는 정확도의 한계를 소개하고, 관상과 인상 연구의 차이를 알아봤어요.",
    date: "2026-10-15",
    corner: "gwansang",
  },
  {
    slug: "gwansang-features",
    title: "관상 여섯 부위별 인상 풀이 모음, 눈·눈썹·코·입·턱·이목구비 배치",
    description:
      "눈·눈썹·코·입·턱·이목구비 배치를 부위마다 두 가지씩 재서 어떻게 나누고 어떤 인상으로 풀어 주는지, 종합 18가지까지 서열 없이 정리했어요.",
    date: "2026-10-15",
    corner: "gwansang",
  },
  {
    slug: "saju-accuracy-check",
    title: "사주 계산이 맞는지 5만 5천 일을 대조해 본 이야기",
    description:
      "만세력이 틀리기 쉬운 입춘 시각·옛 표준시·자시·음력 문제를 짚고, 재미로봄이 외부 계산 도구와 5만 5천 일을 대조한 방법과 한계를 풀어 썼어요.",
    date: "2026-10-15",
    corner: "fortune",
  },
  {
    slug: "gunghap-score-distribution",
    title: "궁합 점수는 어떻게 나뉠까? 무작위 1만 쌍으로 본 점수 분포",
    description:
      "재미로봄 궁합 점수의 계산식을 풀어 보고, 무작위 1만 쌍을 직접 계산해 평균·구간별 비율·100점 비율을 확인했어요. 점수보다 풀이를 읽는 법도 담았어요.",
    date: "2026-10-15",
    corner: "gunghap",
  },
  {
    slug: "gunghap-birth-time",
    title: "태어난 시간을 바꾸면 궁합이 얼마나 달라질까",
    description:
      "궁합에서 태어난 시간이 점수에 영향을 주는 부분과 주지 않는 부분을 나누고, 시간만 바꿔 본 300쌍 실험 결과로 시간을 모를 때 어떻게 볼지 정리했어요.",
    date: "2026-10-15",
    corner: "gunghap",
  },
  {
    slug: "fortune-year-stats",
    title: "오늘의 운세 1년 치를 계산해 보니",
    description:
      "오늘의 운세를 36만 5천 번 계산해 별점 분포와 십신이 고르게 나온 이유, 10일 주기를 확인하고 매일 볼 때 알아 둘 점을 정리했어요.",
    date: "2026-10-15",
    corner: "fortune",
  },
  {
    slug: "face-in-browser",
    title: "사진을 서버로 보내지 않고 얼굴을 비교하는 방법",
    description:
      "닮은꼴 테스트가 사진을 서버로 보내지 않고 내 브라우저 안에서 얼굴을 찾고 비교하는 과정과, 처음 로딩이 있는 이유, 장단점과 개인정보 측면을 쉽게 정리했어요.",
    date: "2026-10-15",
    corner: "face",
  },
  {
    slug: "saju-basics",
    title: "사주팔자란? 여덟 글자로 읽는 태어난 순간",
    description:
      "생년월일시로 만들어지는 여덟 글자, 사주팔자의 기본 구조와 네 기둥, 일간이 '나'인 이유, 만세력과의 관계까지 쉽게 풀어봤어요.",
    date: "2026-10-02",
    corner: "fortune",
  },
  {
    slug: "five-elements",
    title: "오행 쉽게 이해하기, 목화토금수와 상생·상극",
    description:
      "나무·불·흙·쇠·물 다섯 기운 오행의 성질과 상생·상극 관계, 색과 방향·계절과의 연결, 내 사주의 오행 분포까지 쉽게 정리했어요.",
    date: "2026-10-02",
    corner: "fortune",
  },
  {
    slug: "zodiac-ipchun",
    title: "띠는 설날이 아니라 입춘에 바뀐다?",
    description:
      "1~2월생이 자기 띠를 헷갈려 하는 이유, 사주에서 띠가 바뀌는 진짜 기준인 입춘 날짜와 설날 기준과의 차이를 자세히 알아봤어요.",
    date: "2026-10-02",
    corner: "fortune",
  },
  {
    slug: "solar-terms",
    title: "24절기와 사주, 사주의 달은 왜 절기로 바뀔까",
    description:
      "입춘부터 동지까지 24절기의 이름과 뜻, 태양 황경 15도 간격의 원리, 사주의 월주가 절기로 바뀌는 이유까지 자세히 정리했어요.",
    date: "2026-10-02",
    corner: "fortune",
  },
  {
    slug: "sixty-ganji",
    title: "을사년·병오년, 해 이름은 어떻게 정해질까",
    description:
      "2025년 을사년, 2026년 병오년처럼 해마다 붙는 간지 이름의 원리와 60갑자가 만들어지는 계산법, 환갑의 뜻을 풀어봤어요.",
    date: "2026-10-02",
    corner: "fortune",
  },
  {
    slug: "ten-gods",
    title: "십신이란? 오늘의 운세가 정해지는 원리",
    description:
      "비견부터 정인까지 열 가지 십신이 무엇이고 어떻게 정해지는지, 오늘의 운세 계산 원리와 행운 색·숫자가 나오는 원리까지 풀어드려요.",
    date: "2026-10-02",
    corner: "fortune",
  },
  {
    slug: "lunar-birthday",
    title: "음력 생일이 해마다 바뀌는 이유와 윤달 이야기",
    description:
      "음력 생일의 양력 날짜가 해마다 달라지는 이유, 지금도 음력 생일을 챙기는 이유, 19년에 7번 윤달이 끼는 원리와 윤달생의 생일, 한중 음력 차이를 정리했어요.",
    date: "2026-10-02",
    corner: "fortune",
  },
  {
    slug: "birth-time",
    title: "태어난 시간을 모를 때, 그리고 30분 보정 이야기",
    description:
      "사주의 시주는 어떻게 정해지는지, 표준시 기준과 30분 보정이 왜 필요한지, 태어난 시간을 모를 때는 어떻게 보는지 정리했어요.",
    date: "2026-10-02",
    corner: "fortune",
  },
  {
    slug: "zodiac-animals",
    title: "12띠 동물 이야기, 나라마다 다른 띠",
    description:
      "쥐띠가 첫 번째가 된 유래 설화, 발가락 수로 설명하는 이야기, 베트남의 고양이띠와 일본의 멧돼지띠까지 나라별 차이를 모아봤어요.",
    date: "2026-10-02",
    corner: "fortune",
  },
  {
    slug: "hap-chung",
    title: "합과 충, 지지끼리 어울리고 부딪히는 관계",
    description:
      "지지 열두 글자 사이의 육합·삼합·충 관계를 쉽게 풀어보고, 흔히 말하는 띠 궁합 속설과 이 사이트 별점 계산 방식의 차이를 정리했어요.",
    date: "2026-10-02",
    corner: "fortune",
  },
  {
    slug: "why-fortunes-feel-right",
    title: "운세가 유독 잘 맞는 것 같은 이유",
    description:
      "운세나 성격 풀이가 내 얘기처럼 느껴지는 바넘 효과와 포러 실험, 확증 편향까지, 심리학으로 풀어보는 이유와 재미있게 즐기는 법이에요.",
    date: "2026-10-02",
    corner: "fortune",
  },
  {
    slug: "family-resemblance",
    title: "가족은 왜 닮을까? 얼굴 닮음과 유전 이야기",
    description:
      "가족은 왜 닮을까요? 쌍둥이 연구와 유전학, '아기는 아빠를 닮는다'는 말을 확인한 연구, 가족끼리 비교하는 요령까지 풀었어요.",
    date: "2026-10-01",
    corner: "face",
  },
  {
    slug: "travel-greetings",
    title: "여행 가서 꼭 쓰는 현지 인사말, 나라별 비교와 발음 팁",
    description:
      "25개 나라의 안녕하세요·감사합니다를 비교하고, 이거 주세요·얼마예요·맛있어요 같은 여행 표현과 발음할 때 주의할 점을 모았어요.",
    date: "2026-10-01",
    corner: "travel",
  },
  {
    slug: "couples-look-alike",
    title: "오래 산 부부는 정말 닮아갈까? 연구로 본 진실",
    description:
      "오래 산 부부는 정말 닮아갈까요? 1987년과 2020년 연구를 비교하고, 반려견이 주인을 닮는 이유와 직접 비교하는 법까지 살펴봤어요.",
    date: "2026-10-01",
    corner: "face",
  },
  {
    slug: "japanese-names",
    title: "일본 이름은 어떻게 지을까? 한자 뜻과 읽는 법 이야기",
    description:
      "일본 이름의 순서와 한자 읽는 법이 여러 개인 까닭, 이름에 쓰는 한자, 요즘 인기 이름과 이 사이트 일본 이름 36개의 특징을 정리했어요.",
    date: "2026-10-01",
    corner: "travel",
  },
  {
    slug: "vietnam-thai-names",
    title: "베트남 이름 순서, 성이 먼저일까? 베트남·태국 이름 문화",
    description:
      "베트남은 성이 맨 앞, 태국은 성이 생긴 지 110여 년이에요. 두 나라의 이름 구조와 별명 문화, 이름 묻는 말과 로마자 읽는 법을 정리했어요.",
    date: "2026-10-01",
    corner: "travel",
  },
  {
    slug: "english-nicknames",
    title: "알렉산더는 왜 알렉스가 될까? 영어 이름 애칭 모음",
    description:
      "알렉스(Alex)는 알렉산더(Alexander)·알렉산드라의 애칭이에요. 로버트→밥, 윌리엄→빌처럼 자주 쓰는 영어 이름 애칭을 영어 철자와 함께 모았어요.",
    date: "2026-10-01",
    corner: "travel",
  },
  {
    slug: "how-similarity-works",
    title: "닮은꼴은 어떻게 판단할까? 얼굴 유사도 분석의 원리",
    description:
      "닮은꼴 테스트는 '눈 82%' 같은 숫자를 어떻게 만들까요? 얼굴 점 68개와 부위별 비교, 전체 점수 계산을 실제 코드 순서대로 풀었어요.",
    date: "2026-09-10",
    corner: "face",
  },
  {
    slug: "photo-tips",
    title: "닮은꼴 테스트, 이런 사진으로 하면 결과가 잘 나와요",
    description:
      "같은 두 사람인데 사진마다 닮은꼴 점수가 다른 이유와, 결과가 안정적으로 나오는 사진 고르는 법을 계산 원리와 함께 정리했어요.",
    date: "2026-09-10",
    corner: "face",
  },
  {
    slug: "ways-to-enjoy",
    title: "가족·커플·반려동물… 닮은꼴 테스트 재밌게 즐기는 방법",
    description:
      "가족·연인·친구·반려동물까지 닮은꼴 테스트를 더 재밌게 즐기는 조합과 결과 화면 읽는 법, 모임 놀이와 공유 매너를 모았어요.",
    date: "2026-09-10",
    corner: "face",
  },
];

export const getRead = (slug) => READS.find((r) => r.slug === slug);
