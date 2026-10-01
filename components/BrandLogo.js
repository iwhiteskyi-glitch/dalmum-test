// 재미로봄 로고(새싹 두 잎). 두 잎은 "나와 우리" 두 사람을, 새싹은 "봄"을 뜻합니다.
// 예전 "닮았네" 로고의 두 알 모양을 이어받았어요.
// 탭 아이콘(app/icon.png 등)도 같은 모양을 라즈베리 바탕에 흰색으로 그린 것입니다.
export default function BrandLogo({ size = 26, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M32 55 V35" stroke="#22816b" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M29.5 37 C13 39 5.5 26.5 7.5 11.5 C22 11.5 32 20 29.5 37Z" fill="#ce2857" />
      <path d="M34.5 37 C51 39 58.5 26.5 56.5 11.5 C42 11.5 32 20 34.5 37Z" fill="#ef6f93" />
    </svg>
  );
}
