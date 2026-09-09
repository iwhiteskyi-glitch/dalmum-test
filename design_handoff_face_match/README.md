# Handoff: 닮음 분석(Face Match) 웹서비스

## Overview
사진 두 장(내 사진 + 비교 대상 사진)을 업로드하면 부위별(눈/눈썹/코/입/얼굴형/이목구비 배치 비율) 닮음도와 전체 닮음 %를 보여주는 재미용 서비스. 대상은 연예인/가족/친구/반려동물 등 제한 없음. 톤은 밝고 팝한 유머 중심.

## About the Design Files
The file in this bundle (`Hi-Fi Mockup.dc.html`) is a **design reference built in HTML** — a working prototype of look, layout, and interaction, not production code to copy verbatim. Recreate this design in the target codebase's existing framework (React, Vue, native, etc.), following its established component patterns and libraries. If no framework exists yet, choose the most appropriate one and implement there.

## Fidelity
**High-fidelity.** Colors, typography, spacing, copy, and interaction states shown are final-intent. Recreate pixel-close using the target codebase's design system/libraries.

## Screens / Views

### 1. Upload (`step 0`)
- **Purpose**: user picks their own photo + the photo of the person/animal to compare against.
- **Layout**: single column, max-width 520px, centered. Vertical stack, 20px gap.
  - Title "사진 두 장을 올려주세요" (26px/800 weight) + subtitle "누구랑 닮았는지 확인해봐요 👀" (14px, muted).
  - 2-up image grid: `grid-template-columns: repeat(auto-fit, minmax(180px,1fr))`, 16px gap. Each cell: square (aspect-ratio 1) rounded (20px radius) drop-target with label below ("내 사진" / "비교 대상").
  - Primary CTA button "다음" full width, 16px radius, 16px padding, white text on accent color.
- **States**: no validation shown in mock (button always enabled) — real build should disable CTA until both photos are present.

### 2. Crop / Confirm (`step 1`)
- **Purpose**: confirm/align face position before analysis.
- **Layout**: same shell as Upload. Each photo shown in a rounded square with a dashed circular guide overlay (3px dashed, accent2 color, inset 10%) centered over the face area.
- **Buttons**: 뒤로 (secondary, outlined) + 분석 시작 (primary, flex 2:1 ratio with back button).
- **Behavior**: tapping 분석 시작 starts the loading step.

### 3. Loading (`step 2`)
- **Purpose**: perceived-progress screen while "analysis" runs.
- **Layout**: centered column, max-width 400px, starts 60px from top.
  - 64px spinner ring (6px border, accent color on top edge, spin animation ~0.9s linear infinite).
  - Rotating caption text (16px/800), cycles every ~650ms through: "눈 뜯어보는 중...", "코 스캔중...", "입 모양 비교중...", "얼굴형 계산중...".
  - Checklist of 4 rows (눈/코/입/얼굴형), each a bordered pill row showing 대기 → 분석중... → 완료 ✓ (green) as it completes in sequence.
  - Auto-advances to Result ~500ms after the last item completes (~3s total).

### 4. Result (`step 3`)
- **Purpose**: show overall match % and per-part breakdown.
- **Layout**: vertical stack, 28px gap, full width (max 920px container).
  - **Summary card**: white card, 2px border, 24px radius, 28px padding, flex-wrap row, centered content:
    - Two 88px circular photo avatars with a "×" between them.
    - Big overall percentage (56px/800, accent color) + "전체 닮음도" label (13px muted).
    - Comment pill (14px/800, accent2 background) — copy varies by score band: ≥85 "이 정도면 쌍둥이 아니야?", ≥70 "이 정도면 남매급 ㅋㅋ", ≥50 "살짝 닮은 듯?", else "음... 그래도 재밌었죠?".
  - **Part cards grid**: `grid-template-columns: repeat(auto-fit, minmax(240px,1fr))`, 16px gap. 6 cards: 눈, 눈썹, 코, 입, 얼굴형(윤곽), 이목구비 배치 비율. Each card:
    - White bg, 2px border (18px radius, 16px padding).
    - Header row: part name (15px/800) + score % (15px/800, accent color).
    - Progress bar: 8px track (ink @ 8% opacity), filled portion in accent color, width = score%.
    - 2-up mini photo grid (crop of that part, "내" vs "대상").
    - Two description lines (12px, muted): "나 · <short trait>" / "대상 · <short trait>".
    - **Highest-scoring card is emphasized**: 3px accent-colored border (vs 2px ink border on others), extra box-shadow (`0 0 0 4px accent2, 0 8px 20px ink@13%`), and a 🏆 appended to its name.
  - **Action row**: 3 equal-width buttons — 다시하기 (outline, resets to step 0), 저장 (accent2 fill), 공유하기 (accent fill, white text).

## Interactions & Behavior
- Step state machine: `upload(0) → crop(1) → loading(2) → result(3)`, plus a `restart()` back to 0.
- Header shows 4 small dots (one per step) that are clickable in the mock to jump directly to a step — this is a prototype convenience for review, not intended as a real nav control; the shipped product should not expose free step-jumping.
- Loading auto-advances (no button); all other steps are user-driven via buttons.
- "가장 닮은 부위" (best-matching part) is computed as `max(score)` across the 6 parts and drives the card highlight — no separate banner element (a banner variant was tried and removed per feedback; card emphasis only).

## State Management
- `step`: 0–3 int.
- `chip`/category selection was explored then removed from Upload — not part of final flow.
- `loadingIdx`: 0–4, drives which checklist rows show done/in-progress and which caption displays; advances on an interval (~650ms) then triggers transition to Result.
- Real app additionally needs: uploaded image references (me/target), computed scores per part (from actual analysis, not hardcoded), overall %, and the derived comment/highlight logic already described above.

## Design Tokens
- **Accent (primary)**: `#FF3B5C` (tweakable prop in the mock; pick one final value for production) — coral/pink, bright & pop.
- **Accent 2 (secondary)**: `#FFD23F` — yellow, used for comment pill, save button, and best-card shadow.
- **Ink (text/borders)**: `#1A1A1A`.
- **Muted text**: `rgba(26,26,26,.55)`.
- **Background**: `#FFFBF3` (warm off-white).
- **Success green** (loading checklist done state): `#1AAE6F`.
- **Typography**: system font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`). Weight 800 for headings/emphasis, 700 for labels/buttons, regular for descriptions.
- **Radius scale**: 12px (small chips/images), 16–18px (cards/buttons), 20–24px (photo slots, summary card).
- **Spacing scale used**: 8, 10, 14, 16, 18, 20, 24, 28px gaps/padding.

## Assets
All photos are placeholders (drag-and-drop image slots in the prototype) — no real photography or icons used. One emoji used intentionally per requested "bright/pop" tone: 👀 (upload subtitle) and 🏆 (best-part badge).

## Files
- `Hi-Fi Mockup.dc.html` — the full interactive prototype (all 4 screens + state logic) referenced above.
