// 카카오톡 안 브라우저 → 기기 기본 브라우저로 넘어갈 때 결과를 잃지 않도록, 결과를 주소의
// "#card=..." 부분에 담아 넘깁니다. # 뒷부분은 서버로 전송되지 않아 어디에도 저장되지 않습니다.
// 받는 쪽에서는 준비된 이름 목록·분위기 목록·캐릭터 번호에 있는 값만 받아들입니다.
import { MOODS } from "./texts";
import { avatarToCode, avatarFromCode } from "./recommend";

const KEY = "card=";
const LIMITS = { nick: 12, blurb: 80, title: 40 };

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** members: [{ nick, moods, card }] → 주소에 붙일 "#card=..." */
export function encodeResultHash(members) {
  const data = members.map((m) => [
    m.nick,
    m.moods,
    m.card.name_local,
    m.card.vibe,
    m.card.blurb,
    m.card.title,
    avatarToCode(m.card.avatar),
  ]);
  return `#${KEY}${toBase64Url(JSON.stringify(data))}`;
}

const cleanText = (v, max) =>
  typeof v === "string" && v.trim() && v.length <= max ? v.trim() : null;

/** "#card=..." → [{ nick, moods, card }] 또는 null(형식이 틀리면 무시) */
export function decodeResultHash(hash, namePool) {
  if (!hash || !hash.startsWith(`#${KEY}`)) return null;
  let data;
  try {
    data = JSON.parse(fromBase64Url(hash.slice(KEY.length + 1)));
  } catch {
    return null;
  }
  if (!Array.isArray(data) || data.length < 1 || data.length > 5) return null;

  const members = [];
  for (const row of data) {
    if (!Array.isArray(row) || row.length !== 7) return null;
    const [nick, moods, nameLocal, vibe, blurb, title, avatarCode] = row;
    const entry = namePool.find((n) => n.name_local === nameLocal);
    const avatar = avatarFromCode(avatarCode);
    const cleanNick = cleanText(nick, LIMITS.nick);
    const cleanBlurb = cleanText(blurb, LIMITS.blurb);
    const cleanTitle = cleanText(title, LIMITS.title);
    if (!entry || !avatar || !cleanNick || !cleanBlurb || !cleanTitle) return null;
    if (!MOODS.includes(vibe) || !Array.isArray(moods) || !moods.every((m) => MOODS.includes(m)))
      return null;
    members.push({
      nick: cleanNick,
      moods: [...new Set(moods)],
      card: { ...entry, vibe, blurb: cleanBlurb, title: cleanTitle, avatar },
    });
  }
  return members;
}
