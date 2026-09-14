import Link from "next/link";
import ReadArticle, { readMetadata } from "@/components/ReadArticle";

const SLUG = "ways-to-enjoy";
export const metadata = readMetadata(SLUG);

export default function Page() {
  return (
    <ReadArticle slug={SLUG}>
      <p>
        닮았네는 대상에 제한이 없습니다. 사람이 아니어도, 굳이 닮았을 것 같지 않은
        조합이어도 괜찮아요. 오히려 예상 밖의 결과가 나올 때 가장 재밌습니다. 아래는
        사람들이 많이 해보는 조합들입니다.
      </p>

      <h2>가족 닮은꼴 테스트</h2>
      <ul>
        <li>
          <strong>부모 vs 자녀</strong> — 누구를 더 닮았는지 눈·코·입 점수로 확인해
          보세요. 명절에 온 가족이 돌아가며 하면 이야깃거리가 끊이지 않습니다.
        </li>
        <li>
          <strong>형제·자매</strong> — 어릴 때 사진과 지금 사진을 비교해도 재밌습니다.
        </li>
        <li>
          <strong>어릴 적 나 vs 지금 나</strong> — 얼마나 그대로인지, 어디가 변했는지.
        </li>
      </ul>

      <h2>커플 닮은꼴 테스트</h2>
      <ul>
        <li>
          <strong>연인끼리</strong> — "오래 사귀면 닮는다"는 말, 점수로 확인해 보세요.
        </li>
        <li>
          <strong>친구끼리</strong> — 닮았다는 소리를 자주 듣는 친구와 실제 점수를
          맞춰보기.
        </li>
      </ul>

      <h2>재미로 해보는 조합</h2>
      <ul>
        <li>
          <strong>나 vs 닮은꼴 연예인</strong> — 평소 닮았다는 소리를 듣던 연예인과
          비교. (공개 게시 시 초상권은 올린 사람 책임이라는 점,{" "}
          <Link href="/terms">이용약관</Link>을 확인하세요.)
        </li>
        <li>
          <strong>반려동물 닮은꼴 테스트</strong> — 나와 반려동물을 비교해 보는
          것으로, 얼굴 인식이 될 때도 안 될 때도 있지만 되면 결과가 아주 웃깁니다.
        </li>
        <li>
          <strong>부부 → 미래의 아이 상상</strong> — 두 사람을 비교해 보고 어느 부위가
          닮았는지 상상해 보기.
        </li>
      </ul>

      <hr />

      <h2>결과 공유 팁</h2>
      <ul>
        <li>
          결과 화면의 <strong>저장</strong> 버튼을 누르면 전체 %와 부위별 점수가 담긴
          이미지 한 장이 만들어집니다. 그대로 스토리·피드에 올리기 좋아요.
        </li>
        <li>
          <strong>공유하기</strong> 버튼은 메신저로 바로 전송됩니다. 친구에게 보내면서
          "너도 해봐"라고 하면 자연스럽게 이어집니다.
        </li>
        <li>
          가장 높게 나온 부위(🏆 표시)를 캡션으로 뽑으면 반응이 좋습니다. 예: "우리 눈만
          91% 닮음ㅋㅋ"
        </li>
      </ul>

      <p>
        사진을 고르기 전에 <Link href="/reads/photo-tips">좋은 사진 고르는 법</Link>을
        먼저 보면 결과가 더 잘 나옵니다.
      </p>
    </ReadArticle>
  );
}
