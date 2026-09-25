import { avatarSvg } from "@/lib/travel/avatar";

// 실사진 대신 쓰는 단순한 SVG 캐릭터. 그림은 lib/travel/avatar.js 한 곳에서만 만듭니다.
export default function Avatar({ avatar, size = 64, bg, title }) {
  return (
    <span
      style={{ display: "inline-block", width: size, height: size, lineHeight: 0 }}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      dangerouslySetInnerHTML={{ __html: avatarSvg(avatar, { size, bg }) }}
    />
  );
}
