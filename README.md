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

## 배포

단계별 안내는 **[DEPLOY.md](DEPLOY.md)** 를 보세요 (비전공자용, 순서대로 따라 하기).
요약: GitHub에 push → Vercel에서 Import → 환경 변수 입력 → Deploy. 이후 push하면 자동 재배포.

### 환경 변수

| 이름 | 용도 | 없을 때 |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 사이트 실제 주소 (sitemap·공유 미리보기) | `https://example.com` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | 문의 이메일 | `your-email@example.com` |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | `ca-pub-…` 게시자 ID | 광고 대신 자리표시 |
| `NEXT_PUBLIC_AD_SLOT_CONTENT` | 콘텐츠 하단 광고 슬롯 ID | 자리표시 |
| `NEXT_PUBLIC_AD_SLOT_RESULT` | 결과 하단 광고 슬롯 ID | 자리표시 |

## 완료된 것

- [x] 얼굴 비교 핵심 기능 (업로드 → 위치맞추기 → 로딩 → 결과 → 저장/공유)
- [x] 서비스 소개 / 사용법 / FAQ 페이지
- [x] 개인정보처리방침 / 이용약관 / 문의하기 페이지
- [x] 읽을거리 글 3편 (`/reads`)
- [x] `robots.txt`, `sitemap.xml`, `ads.txt`(게시자 ID 입력 시 자동), 커스텀 404, 검색엔진용 메타데이터
- [x] 광고 자리 2곳 (콘텐츠 페이지 하단 / 결과 화면 하단) — 버튼·콘텐츠와 떨어진 위치, 승인 전에는 자리표시만 표시

## 남은 것 (배포 전/후 체크)

- [ ] `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_EMAIL` 실제 값 설정
- [ ] 개인정보처리방침·이용약관 문구 검토 (현재는 표준 양식 기반 초안)
- [ ] Vercel 배포 → 구글 서치콘솔 등록 → sitemap 제출 ([DEPLOY.md](DEPLOY.md))
- [ ] SNS/커뮤니티 공유 테스트 → 트래픽이 쌓인 뒤 애드센스 신청 → 승인되면 광고 환경 변수 3개 입력

## 참고

- 부위별 수치는 얼굴 특징점(랜드마크) 위치를 비교한 **재미 목적의 값**이며, 신원 확인·친자 판별 등
  어떤 공식적 용도로도 쓸 수 없습니다. (UI에도 명시되어 있습니다.)
- 유료 얼굴 분석 API로의 전환은 트래픽·수익 검증 후 별도 검토 (`CLAUDE.md` 참고).
