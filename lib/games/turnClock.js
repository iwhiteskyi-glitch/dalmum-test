// 차례 시간에 함께 쓰는 계산. 폰마다 시계가 달라서, 방장은 시각이 아니라 남은 시간을 보낸다.
/** 받은 설정의 차례 시간이 맞는지. 차례 시간이 없던 예전 앱의 방장도 받아 준다 */
export const isTurnChoice = (value, options) => value === undefined || options.includes(value);
/** 끝나는 시각까지 남은 시간(ms). 제한이 없으면 null */
export const leftOf = (endsAt, now) => (endsAt === null || endsAt === undefined ? null : Math.max(0, endsAt - now));
