// 숫자 야구 컴퓨터와 대결 한 판: 앱의 "서로 숨기기"(duel.ts)와 같은 규칙을 시계 없이 옮겼어요.
//  - 나와 컴퓨터가 각자 숫자를 숨기고, 번갈아 상대 숫자를 불러요. 선은 판마다 무작위
//  - 공평하게: 먼저 부른 쪽이 맞히면 나중 쪽에게 한 번 더 기회. 그때 같이 맞히면 무승부
//    나중 쪽이 먼저 맞히면 (부른 횟수가 같으니) 바로 나중 쪽 승
//  - 둘 다 20번씩 불러도 아무도 못 맞히면 승자 없이 끝
// 컴퓨터가 부를 숫자는 ai.js가 기록만 보고 정해요(내 숫자는 보지 않아요).
import { botCount } from "./ai.js";
import { isValidNumber, judge, randomNumber } from "./baseball.js";

export const ME = "me";
export const BOT = "bot";
/** 한쪽이 이만큼 불러도 아무도 못 맞히면 승자 없이 끝 */
export const MAX_VS_CALLS = 20;
/** 컴퓨터와 대결 단계 수 */
export const VS_LEVELS = 10;

const other = (who) => (who === ME ? BOT : ME);

/**
 * 새 판. level 1~10, 0은 무한 연승(가장 센 10단계 컴퓨터). 컴퓨터는 바로 숫자를 숨겨요.
 * result: null(하는 중) · { winner: ME|BOT } · { draw: true } · { none: true }(아무도 못 맞힘)
 */
export function newVs(level, random = Math.random) {
  const skill = level === 0 ? VS_LEVELS : level;
  const count = botCount(skill);
  const first = random() < 0.5 ? ME : BOT;
  return {
    level,
    skill,
    count,
    secrets: { [ME]: null, [BOT]: randomNumber(count, random) },
    first,
    turn: first,
    calls: { [ME]: [], [BOT]: [] },
    lastChance: false,
    result: null,
  };
}

/** 내 숫자를 숨김. 받을 수 없으면 null */
export function hideMine(state, secret) {
  if (state.secrets[ME] || !isValidNumber(secret, state.count)) return null;
  return { ...state, secrets: { ...state.secrets, [ME]: secret } };
}

export const isHiding = (state) => !state.secrets[ME];

/** 지금 차례인 쪽이 부름. 차례가 아니거나 모양이 틀리거나 이미 부른 숫자면 null */
export function vsCall(state, who, guess) {
  if (state.result || isHiding(state) || state.turn !== who) return null;
  if (!isValidNumber(guess, state.count) || state.calls[who].some((c) => c.guess === guess)) return null;
  const target = state.secrets[other(who)];
  const j = judge(target, guess);
  const hit = j.strike === state.count;
  const calls = { ...state.calls, [who]: [...state.calls[who], { guess, judge: j }] };
  const next = { ...state, calls };
  if (state.lastChance) return { ...next, result: hit ? { draw: true } : { winner: state.first } };
  if (hit) {
    if (who !== state.first) return { ...next, result: { winner: who } };
    return { ...next, lastChance: true, turn: other(who) };
  }
  if (calls[ME].length >= MAX_VS_CALLS && calls[BOT].length >= MAX_VS_CALLS) return { ...next, result: { none: true } };
  return { ...next, turn: other(who) };
}
