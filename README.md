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
3. 설정 변경 없이 **Deploy**. Next.js 프로젝트로 자동 인식되고 HTTPS 주소가 발급됩니다.
4. 이후 GitHub에 push하면 자동으로 다시 배포됩니다.

## 아직 안 만든 것 (다음 단계)

핵심 기능(사진 2장 비교)만 먼저 완성한 상태입니다. 애드센스 신청 전에 아래가 필요합니다.

- [ ] 서비스 소개 / 사용법 / FAQ 페이지
- [ ] 개인정보처리방침 / 이용약관 / 문의하기 페이지
- [ ] `robots.txt`, `sitemap.xml`
- [ ] 광고 슬롯 배치 (콘텐츠를 가리지 않는 위치)

> 화면 하단 링크(`/about`, `/faq` 등)는 위 페이지를 만들면 연결됩니다. 지금은 클릭 시 404가 납니다.

## 참고

- 부위별 수치는 얼굴 특징점(랜드마크) 위치를 비교한 **재미 목적의 값**이며, 신원 확인·친자 판별 등
  어떤 공식적 용도로도 쓸 수 없습니다. (UI에도 명시되어 있습니다.)
- 유료 얼굴 분석 API로의 전환은 트래픽·수익 검증 후 별도 검토 (`CLAUDE.md` 참고).
