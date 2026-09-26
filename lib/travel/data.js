import japan from "./data/japan.json";
import vietnam from "./data/vietnam.json";
import thailand from "./data/thailand.json";
import china from "./data/china.json";
import taiwan from "./data/taiwan.json";
import hongkong from "./data/hongkong.json";
import macau from "./data/macau.json";
import philippines from "./data/philippines.json";
import malaysia from "./data/malaysia.json";
import indonesia from "./data/indonesia.json";
import laos from "./data/laos.json";
import mongolia from "./data/mongolia.json";

// 나라 데이터 파일을 추가하면 여기 목록에만 넣으면 됩니다. (순서 = 목록 표시 순서)
const RAW = [
  japan,
  vietnam,
  thailand,
  china,
  taiwan,
  hongkong,
  macau,
  philippines,
  malaysia,
  indonesia,
  laos,
  mongolia,
];

export const COUNTRIES = RAW.map(({ country, cities }) => ({ ...country, cities }));

export function getCountry(code) {
  return COUNTRIES.find((c) => c.code === code) || null;
}

export function getCity(countryCode, cityCode) {
  const country = getCountry(countryCode);
  const city = country?.cities.find((c) => c.city_code === cityCode) || null;
  return country && city ? { country, city } : null;
}

export function cityPath(countryCode, cityCode) {
  return `/travel/${countryCode}/${cityCode}`;
}

export function mapLink(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
