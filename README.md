# 닮음테스트 (dalmum-test)

사진 두 장(내 사진 + 비교 대상)을 올리면 눈·눈썹·코·입·얼굴형·이목구비 배치까지
**부위별 닮음도**와 **전체 닮음 %**를 보여주는 재미용 웹서비스입니다.

- 얼굴 분석은 **100% 브라우저 안에서** 실행됩니다. 업로드한 사진은 서버로 전송되거나 저장되지 않습니다.
- 사용 라이브러리: [@vladmandic/face-api](https://github.com/vladmandic/face-api) (무료 오픈소스, face-api.js 유지보수 포크)
- 프레임워크: Next.js 15 (App Router) + React 19

## 폴더 구조

| 경로 | 설명 |
| --- | --- |
| `app/page.js` | 메인 화면. 업로드 → 위치맞추기 → 로딩 → 결과 4단계 흐름 |
| `app/page.module.css` | 화면 스타일 (디자인 토큰은 `app/globals.css`) |
| `app/layout.js` | 공통 레이아웃 + 검색엔진 노출(SEO)용 메타데이터 |
| `lib/faceAnalysis.js` | 얼굴 인식·부위별 유사도 계산 (브라우저 전용) |
| `lib/shareCard.js` | 결과를 SNS 공유용 PNG 이미지로 그리는 코드 |
| `public/models/` | face-api 모델 파일 (약 7MB, 최초 1회만 다운로드됨) |
| `app/(content)/` | 소개·사용법·FAQ·약관·문의·읽을거리 등 콘텐츠 페이지 (공통 헤더/푸터 레이아웃) |
| `components/` | 공통 헤더·푸터, 콘텐츠 페이지 부품 |
| `lib/site.js` | 사이트 이름·도메인·문의 이메일 등 공통 설정 (배포 시 수정) |
| `app/robots.js`, `app/sitemap.js` | robots.txt / sitemap.xml 자동 생성 |
| `design_handoff_face_match/` | 디자인 참고 원본 (수정하지 않음) |

## 로컬에서 실행하기

> 사전 준비: [Node.js](https://nodejs.org) 20 버전 이상 설치

```bash
npm install      # 처음 한 번만
npm run dev      # 개발 서버 실행 → http://localhost:3000
```

빌드 확인:

```bash
npm run build    # 배포 전 오류 점검
npm start        # 빌드 결과 실행
```

## 배포 (Vercel, 무료)

1. 이 폴더를 GitHub 저장소로 올립니다.
2. [vercel.com](https://vercel.com) 로그인 → **Add New → Project** → 저장소 선택.
3. **Environment Variables**에 아래 두 개를 넣습니다. (안 넣어도 배포는 되지만 주소·이메일이 임시값으로 나옵니다.)
   - `NEXT_PUBLIC_SITE_URL` = 실제 도메인 (예: `https://내도메인.com`)
   - `NEXT_PUBLIC_CONTACT_EMAIL` = 문의 받을 이메일 주소
4. 설정 변경 없이 **Deploy**. Next.js 프로젝트로 자동 인식되고 HTTPS 주소가 발급됩니다.
5. 이후 GitHub에 push하면 자동으로 다시 배포됩니다.

## 완료된 것

- [x] 얼굴 비교 핵심 기능 (업로드 → 위치맞추기 → 로딩 → 결과 → 저장/공유)
- [x] 서비스 소개 / 사용법 / FAQ 페이지
- [x] 개인정보처리방침 / 이용약관 / 문의하기 페이지
- [x] 읽을거리 글 3편 (`/reads`)
- [x] `robots.txt`, `sitemap.xml`, 커스텀 404, 검색엔진용 메타데이터

## 남은 것 (배포 전/후 체크)

- [ ] `lib/site.js`의 도메인·문의 이메일을 실제 값으로 (또는 위 환경 변수 사용)
- [ ] 개인정보처리방침·이용약관 문구 검토 (현재는 표준 양식 기반 초안)
- [ ] 광고 슬롯 배치 (애드센스 승인 후, 콘텐츠를 가리지 않는 위치)
- [ ] SNS/커뮤니티 공유 테스트 → 어느 정도 트래픽이 쌓인 뒤 애드센스 신청

## 참고

- 부위별 수치는 얼굴 특징점(랜드마크) 위치를 비교한 **재미 목적의 값**이며, 신원 확인·친자 판별 등
  어떤 공식적 용도로도 쓸 수 없습니다. (UI에도 명시되어 있습니다.)
- 유료 얼굴 분석 API로의 전환은 트래픽·수익 검증 후 별도 검토 (`CLAUDE.md` 참고).
