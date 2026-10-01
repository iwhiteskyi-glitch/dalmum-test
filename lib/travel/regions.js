// 나라 고르기 화면의 대륙 탭. 나라 데이터(JSON)를 불러오지 않는 가벼운 파일이라
// 화면 쪽(클라이언트) 코드에서도 부담 없이 쓸 수 있어요.
// 새 나라를 추가하면 여기에도 그 나라 코드를 넣어 주세요. (빠지면 "기타" 탭에 나옵니다.)
export const REGIONS = [
  {
    key: "asia",
    label: "아시아",
    codes: [
      "japan", "vietnam", "thailand", "china", "taiwan", "hongkong", "macau",
      "singapore", "philippines", "malaysia", "indonesia", "laos", "mongolia",
    ],
  },
  {
    // 튀르키예는 아시아·유럽에 걸쳐 있지만, 여행 상품·항공편에서 보통 유럽으로 묶여서 유럽에 둡니다.
    key: "europe",
    label: "유럽",
    codes: ["italy", "spain", "france", "germany", "switzerland", "austria", "czech", "uk", "turkey"],
  },
  {
    key: "americas",
    label: "미주·대양주",
    codes: ["usa", "canada", "australia"],
  },
];

/** 나라 목록을 대륙별로 나누고, 대륙 안에서는 가나다순으로 정렬합니다. */
export function groupByRegion(countries) {
  const byName = (a, b) => a.name.localeCompare(b.name, "ko");
  const groups = REGIONS.map((r) => ({
    ...r,
    countries: countries.filter((c) => r.codes.includes(c.code)).sort(byName),
  }));
  const rest = countries.filter((c) => !REGIONS.some((r) => r.codes.includes(c.code)));
  if (rest.length) groups.push({ key: "etc", label: "기타", countries: rest.sort(byName) });
  return groups.filter((g) => g.countries.length);
}
