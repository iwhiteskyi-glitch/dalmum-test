"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./travel.module.css";

export default function CountryPicker({ countries }) {
  const [q, setQ] = useState("");
  const query = q.trim();
  const list = query
    ? countries.filter(
        (c) => c.name.includes(query) || c.cities.some((city) => city.city_name.includes(query))
      )
    : countries;

  return (
    <div>
      <input
        className={styles.search}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="나라·도시 검색 (예: 일본, 다낭)"
        aria-label="나라 또는 도시 검색"
      />
      {list.length ? (
        <div className={styles.countryGrid}>
          {list.map((c) => (
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
      ) : (
        <p className={styles.emptySearch}>검색 결과가 없어요. 다른 이름으로 찾아보세요.</p>
      )}
    </div>
  );
}
