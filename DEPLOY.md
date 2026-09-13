# 배포 가이드 (비전공자용, 순서대로 따라 하기)

이 문서는 컴퓨터에 만든 사이트를 인터넷에 올리는 방법을 단계별로 설명합니다.
용어가 낯설어도 그대로 따라 하면 됩니다.

> **지금까지 진행 상황**: 1~3단계(GitHub · Vercel 배포 · 환경 변수 2개)는 이미 끝나서
> 사이트가 실제로 떠 있는 상태입니다. 지금부터는 4단계(검색 등록)와 5~6단계(애드센스)가
> 남았습니다 — 트래픽이 좀 쌓인 뒤에 진행하기로 한 부분입니다.

---

## 큰 그림

1. **GitHub**에 코드를 올린다 (코드 보관 창고)
2. **Vercel**에 GitHub 창고를 연결한다 → 자동으로 인터넷 주소가 생긴다 (무료, HTTPS 자동)
3. (선택) **도메인**을 사서 연결한다 (연 1~2만 원)
4. **구글 서치콘솔**에 사이트를 등록한다 (검색 노출 + sitemap 제출)
5. 트래픽이 어느 정도 쌓이면 **애드센스**를 신청한다
6. 승인되면 **환경 변수 3개**를 넣고 다시 배포하면 광고가 나온다

---

## 0. 준비물 (한 번만)

- [Node.js](https://nodejs.org) 20 이상 설치 (이미 설치돼 있으면 생략)
- [Git](https://git-scm.com/download/win) 설치
- [GitHub](https://github.com) 계정
- [Vercel](https://vercel.com) 계정 (GitHub 계정으로 바로 로그인 가능)

---

## 1. GitHub에 올리기

### 1-1. GitHub에서 빈 저장소 만들기
1. GitHub 로그인 → 오른쪽 위 **+** → **New repository**
2. Repository name: 예) `dalmum-test`
3. **Public**(공개) 선택 — 애드센스 심사와 무관하며 무료
4. 나머지 옵션은 건드리지 말고 **Create repository**
5. 다음 화면에 나오는 주소(예: `https://github.com/내아이디/dalmum-test.git`)를 복사

### 1-2. 내 컴퓨터에서 코드 올리기
`얼굴비교` 폴더에서 터미널(PowerShell)을 열고 아래를 한 줄씩 실행합니다.
(이미 `git init`과 첫 커밋은 되어 있는 상태입니다.)

```bash
git branch -M main
git remote add origin https://github.com/내아이디/dalmum-test.git
git push -u origin main
```

> `git push`에서 로그인을 요구하면 GitHub 아이디/토큰을 입력합니다.
> 비밀번호 대신 [Personal Access Token](https://github.com/settings/tokens)이 필요할 수 있습니다.

이후 코드를 고칠 때마다:

```bash
git add -A
git commit -m "수정 내용 한 줄 설명"
git push
```

---

## 2. Vercel로 배포하기

1. [vercel.com](https://vercel.com) 로그인 → **Add New...** → **Project**
2. 방금 올린 GitHub 저장소(`dalmum-test`) 옆의 **Import** 클릭
3. **Framework Preset**이 `Next.js`로 자동 인식되는지 확인 (그대로 두면 됨)
4. **Environment Variables** 섹션을 펼치고 아래 2개를 추가 (지금 단계에서는 임시로 넣어도 됨)

   | Name | Value 예시 |
   | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | `https://dalmum-test.vercel.app` (배포 후 실제 주소로 다시 수정) |
   | `NEXT_PUBLIC_CONTACT_EMAIL` | 문의 받을 이메일 주소 |

5. **Deploy** 클릭 → 1~2분 뒤 `https://프로젝트이름.vercel.app` 주소가 생깁니다.
6. 생성된 실제 주소를 확인한 뒤, **Settings → Environment Variables**에서
   `NEXT_PUBLIC_SITE_URL` 값을 그 주소로 정확히 바꾸고 **Redeploy**(재배포) 합니다.
   (이 값이 맞아야 `sitemap.xml`, 공유 미리보기 등이 정상 동작합니다.)

> 앞으로 GitHub에 `git push` 할 때마다 Vercel이 **자동으로 다시 배포**합니다.

### ⚠️ 배포했는데 접속하면 로그인 화면이 뜨는 경우

Vercel 팀이 Pro 요금제 등일 경우, **Deployment Protection(=Vercel Authentication)**
이라는 설정이 기본적으로 켜져 있어서 사이트 주인 외에는 아무도 접속할 수 없습니다
(들어가면 `vercel.com/sso-api`로 튕겨나감). 이건 애드센스 심사는커녕 일반 방문객도
못 들어오게 막는 설정이라 **꼭 꺼야 합니다**.

1. Vercel 프로젝트 → **Settings → Deployment Protection**
2. **Vercel Authentication**(또는 "Require Log In") 토글을 **끄기(Off)**
3. 저장 확인 창이 뜨면 확인 → 잠시 뒤 재접속해서 로그인 없이 열리는지 확인

---

## 3. 내 도메인 연결하기 — `dalmum.com` (가비아에서 구매 완료)

현재 이 프로젝트가 실제로 쓰는 도메인은 **`dalmum.com`**(가비아 구매)입니다. 아래 순서대로
진행하세요.

### 3.1 Vercel에 도메인 추가

1. Vercel → 프로젝트(`dalmum-test`) → **Settings → Domains**
2. 입력창에 `dalmum.com` 입력 → **Add**
3. 이어서 `www.dalmum.com`도 똑같이 **Add** (사람들이 `www.`를 붙여 입력해도 접속되게)
4. 두 개 중 하나를 "기본 도메인(Primary)"으로 지정하면, Vercel이 나머지 하나는
   자동으로 그쪽으로 리다이렉트해줍니다. **`dalmum.com`(www 없는 쪽)을 기본으로
   설정**하는 걸 추천합니다 — 더 짧고, 지금까지 문구/도메인 안내도 이 형태로 되어 있음.
5. Vercel이 화면에 "이 도메인을 쓰려면 아래 DNS 레코드를 등록하세요"라며
   **A 레코드**(`dalmum.com`용)와 **CNAME 레코드**(`www.dalmum.com`용) 값을 보여줍니다.
   이 값은 프로젝트마다 조금씩 다를 수 있으니 **화면에 나온 값을 그대로 사용**하세요.

### 3.2 가비아 DNS 설정에 등록

1. 가비아 로그인 → **My가비아 → 서비스 관리 → 도메인 → `dalmum.com`의 [관리] 또는
   [DNS 관리]** 클릭
2. **DNS 정보(네임서버는 가비아 기본값 그대로 두고, 아래는 레코드 추가)** 화면에서
   레코드를 새로 추가:
   - 타입 `A`, 호스트 `@`(또는 공백 = 도메인 자체), 값 = Vercel이 알려준 IP 주소
   - 타입 `CNAME`, 호스트 `www`, 값 = Vercel이 알려준 주소(예: `cname.vercel-dns.com`)
3. 기존에 다른 A/CNAME 레코드가 이미 있다면(예: 가비아 기본 파킹 페이지 레코드)
   충돌하지 않도록 **지우고** 위 값으로 교체하세요.
4. 저장 후 반영까지 보통 10분~몇 시간 걸립니다(가비아 안내상 최대 24~48시간이지만
   실제로는 대부분 빠르게 반영됨). Vercel의 Domains 화면에서 상태가
   "Valid Configuration"으로 바뀌면 완료된 것입니다. HTTPS(자물쇠 표시)는 자동으로 붙습니다.

### 3.3 사이트 주소 환경 변수 변경

1. Vercel → 프로젝트 → **Settings → Environment Variables**
2. `NEXT_PUBLIC_SITE_URL` 값을 `https://dalmum.com` 으로 수정
3. **Deployments** 탭 → 가장 최근 배포 옆 **⋯ → Redeploy** (환경 변수는 재배포해야 반영됩니다)

이 값이 바뀌면 `sitemap.xml`, 로고/미리보기 이미지 링크, 카카오톡 공유 카드에 찍히는
주소가 전부 `dalmum.com`으로 자동으로 바뀝니다(코드 수정 불필요).

### 3.4 확인

위 3단계까지 마치면 알려주세요 — `https://dalmum.com`이 정상적으로 열리는지,
`sitemap.xml`/`robots.txt`/공유 이미지가 새 도메인으로 잘 나오는지 제가 확인해드릴게요.

> 참고: 도메인을 새로 연결하면 이전에 `dalmum-test.vercel.app`으로 공유했던 링크는
> 계속 그 주소로 살아있긴 하지만, 앞으로는 `dalmum.com`으로 공유하는 걸 추천합니다.
> 새 도메인은 카카오톡 등에 한 번도 공유된 적이 없어서, 예전에 겪었던 "미리보기 이미지
> 캐시" 문제 없이 처음부터 사진이 포함된 미리보기가 바로 뜹니다.

---

## 4. 구글 검색 등록 (Search Console)

1. [search.google.com/search-console](https://search.google.com/search-console) 접속 → 속성 추가
2. "URL 접두어"에 사이트 주소 입력 → 소유권 확인
   (가장 쉬운 방법: **HTML 태그** 방식 → `<meta>` 태그를 받아서
   `app/layout.js`의 `metadata` 안 `verification: { google: "받은코드" }`로 추가 후 재배포)
3. 확인되면 **Sitemaps** 메뉴 → `sitemap.xml` 입력 → 제출
4. `robots.txt`, `sitemap.xml`이 `사이트주소/robots.txt`, `사이트주소/sitemap.xml`에서
   열리는지 눈으로 확인

---

## 5. 애드센스 신청 (트래픽이 어느 정도 쌓인 뒤)

> `CLAUDE.md`의 체크리스트대로 필수 페이지·콘텐츠는 이미 갖춰져 있습니다.
> **완전히 빈 사이트보다, 실제 방문 흔적이 있을 때 승인 확률이 높습니다.**

1. [www.google.com/adsense](https://www.google.com/adsense) → 사이트 주소로 가입 신청
2. 안내에 따라 사이트 확인 코드(스니펫)를 넣습니다.
   - 이 프로젝트는 게시자 ID만 넣으면 자동으로 스크립트가 삽입됩니다 → 아래 6번 참고
3. 심사(보통 며칠~몇 주) → 승인 메일 대기

---

## 6. 승인 후: 광고 켜기

Vercel → **Settings → Environment Variables**에 아래를 추가하고 재배포하면
사이트의 "광고 영역" 자리표시가 실제 광고로 바뀝니다.

| Name | 설명 |
| --- | --- |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | `ca-pub-` 로 시작하는 게시자 ID (AdSense 계정 정보에 있음) |
| `NEXT_PUBLIC_AD_SLOT_CONTENT` | 콘텐츠 페이지 하단용 광고 단위의 10자리 슬롯 ID |
| `NEXT_PUBLIC_AD_SLOT_RESULT` | 결과 화면 하단용 광고 단위의 10자리 슬롯 ID |

### 광고 단위(슬롯 ID) 만드는 법
AdSense 대시보드 → **광고 → 광고 단위 기준** → **디스플레이 광고** →
이름 입력(예: `content-bottom`) → 만들기 → 나오는 코드에서
`data-ad-slot="1234567890"` 의 숫자가 슬롯 ID입니다. 2개(콘텐츠용/결과용) 만드세요.

- 게시자 ID만 넣고 슬롯 ID를 비워두면, 여전히 자리표시만 보입니다(안전).
- `ads.txt`는 게시자 ID를 넣는 순간 `사이트주소/ads.txt`에서 자동 생성됩니다.

### 광고 배치 원칙 (정책 위반 방지)
- 지금 배치는 **버튼·콘텐츠와 충분히 떨어진 하단**입니다. 위치를 함부로 옮기지 마세요.
- 한 화면에 광고를 너무 많이 넣거나, 버튼처럼 보이게 하거나, "여기를 클릭" 같은
  유도 문구를 넣으면 계정이 정지될 수 있습니다.

---

## 자주 겪는 문제

| 증상 | 해결 |
| --- | --- |
| 배포는 됐는데 `sitemap.xml`에 `example.com`이 나옴 | `NEXT_PUBLIC_SITE_URL` 환경 변수를 실제 주소로 넣고 재배포 |
| 사이트 접속하면 Vercel 로그인 화면으로 넘어감 | Settings → Deployment Protection → Vercel Authentication 끄기 (위 참고) |
| `git push`가 로그인 오류 | GitHub Personal Access Token 발급해서 비밀번호 대신 입력 |
| 로컬에서 `npm run build`를 돌렸더니 `npm run dev` 서버가 이상해짐 | 개발 서버를 껐다가 다시 `npm run dev` (빌드가 `.next` 폴더를 덮어써서 생기는 현상) |
| 광고가 안 나옴 | 승인 완료 + 환경 변수 3개 모두 입력 + 재배포 되었는지 확인. 승인 직후 몇 시간 걸릴 수 있음 |
