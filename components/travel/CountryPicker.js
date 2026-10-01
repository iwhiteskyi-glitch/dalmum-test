"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./travel.module.css";
import { groupByRegion } from "@/lib/travel/regions";

// 나라 고르기: 대륙 탭을 누르면 그 대륙의 나라만 가나다순으로 보여줍니다.
// 다른 대륙의 나라도 화면에서 숨길 뿐 페이지에는 들어 있어서, 검색엔진이 모든 나라 페이지로
// 가는 링크를 찾을 수 있어요.
export default function CountryPicker({ countries }) {
  const groups = groupByRegion(countries);
  const [active, setActive] = useState(groups[0]?.key);

  return (
    <div>
      <div className={styles.regionTabs} role="group" aria-label="대륙 선택">
        {groups.map((g) => (
          <button
            key={g.key}
            type="button"
            aria-pressed={active === g.key}
            className={`${styles.regionTab} ${active === g.key ? styles.regionTabOn : ""}`}
            onClick={() => setActive(g.key)}
          >
            {g.label}
            <span className={styles.regionCount}>{g.countries.length}</span>
          </button>
        ))}
      </div>
      {groups.map((g) => (
        <div key={g.key} className={styles.countryGrid} hidden={active !== g.key}>
          {g.countries.map((c) => (
            <Link key={c.code} href={`/travel/${c.code}`} className={styles.countryCard}>
              <span className={styles.countryIcon} aria-hidden="true">
                {c.name.slice(0, 1)}
              </span>
              <span className={styles.countryName}>{c.name}</span>
              <span className={styles.countryMeta}>
                {c.cities.map((city) => city.city_name).join(" · ")}
              </span>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
