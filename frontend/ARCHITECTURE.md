## Frontend 구조 가이드 (제안)

요청하신 도메인별 폴더 구성을 App Router 기준으로 정리했습니다. 라우트 생성 충돌을 피하기 위해 우선 디렉터리 스캐폴딩만 생성하고, page.tsx는 점진적으로 이관할 것을 권장합니다.

### app (페이지/데이터)
- 메인: `src/app/page.tsx`
- 상세페이지: `src/app/(consumer)/listings/[id]/page.tsx` (기존 유지)
- 임장리포트: `src/app/(consumer)/reports/` (스캐폴딩)
- 주변환경: `src/app/(consumer)/environment/` (스캐폴딩)
- 평가사 대시보드: `src/app/(admin)/dashboard/` (스캐폴딩)
- 임장요청 상세: `src/app/(consumer)/requests/[id]/` (스캐폴딩)
- 진행중 임장: `src/app/(consumer)/in-progress/` (스캐폴딩)
- 임장: `src/app/(consumer)/inspections/` (기존 일부 페이지 존재)
- 평면도: `src/app/(consumer)/floorplan/` (스캐폴딩)

메모: 한글 디렉터리 대신 일관된 영문 슬러그를 권장합니다(SEO/경로 안정성).

### components (페이지 기능)
- 상세: `src/components/detail/`
- 임장리포트: `src/components/reports/`
- 주변환경: `src/components/environment/`
- 평가사 대시보드: `src/components/admin-dashboard/`
- 임장요청 상세: `src/components/request-detail/`
- 진행중 임장: `src/components/in-progress/`
- 임장: `src/components/inspections/`
- 평면도: `src/components/floorplan/`

각 디렉터리에는 도메인 컴포넌트와 훅/유틸을 배치하고, `index.ts`로 바렐(exports) 패턴을 사용합니다.

### hooks (이벤트 감지)
- 공통 훅: `src/hooks/useAuth.ts`, `src/hooks/useVisibility.ts` 등

### 이관 가이드
1) 새 디렉터리를 기준으로 컴포넌트 분리 → import 경로 정리
2) 기존 `app/(consumer)/listings/...` 등 페이지에서 새 컴포넌트를 사용하도록 치환
3) 필요 시 라우트 경로 변경(page.tsx 생성) → redirect/링크 업데이트



