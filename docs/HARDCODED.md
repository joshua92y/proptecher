## 하드코딩/모크/폴백 정리 (프로젝트 전역)

아래는 현재 코드베이스에서 확인된 하드코딩/모크/폴백 사용 지점과 맥락, 개선 제안입니다.

### 프론트엔드

- `frontend/src/lib/data/listings.ts`
  - 매물 목록: 실제 API 호출 사용 (`GET ${NEXT_PUBLIC_API_URL}/api/properties/`, `bounds` 지원).
  - 매물 상세: 실제 API 호출 사용 (`GET ${NEXT_PUBLIC_API_URL}/api/properties/{id}/`). 실패 시 개발 편의용 모크 데이터로 폴백.
  - `apt.summary` / `life.summary`는 고정 플레이스홀더 문자열을 반환.
  - BASE URL 환경변수 중복: 이 파일은 `NEXT_PUBLIC_API_URL` 사용, 반면 `src/lib/utils/api.ts`는 `NEXT_PUBLIC_API_BASE` 사용. 통일 권장.

- `frontend/src/lib/mocks/listingDetail.mock.ts`
  - 고정된 상세 뷰모델 모크 데이터.

- `frontend/src/lib/utils/randomImage.ts`
  - `public/images`의 정적 이미지 목록에서 랜덤/타입별 선택. 백엔드 이미지가 없을 때 대체용으로 사용.

- `frontend/src/app/api/listings/[id]/route.ts`
  - `BACKEND_BASE_URL`이 설정되어 있으면 프록시, 미설정 시 의도적으로 404 반환하여 클라이언트 측 모크 폴백 유도.

- `frontend/src/lib/repos/inspections/local.ts`
  - 임장 요청/진행 상태를 `localStorage`에 저장하는 로컬(모의) 저장소 구현.

- `frontend/src/app/api/inspections/route.ts`, `frontend/src/app/api/inspections/[id]/route.ts`
  - 인메모리 배열(`MEMORY`)을 사용하는 개발용 API(모의 백엔드).

- `frontend/src/app/(consumer)/listings/[id]/page.tsx`
  - 상세 화면에서 `heroImages`가 없으면 `getListingImageByType` 기반의 정적 이미지로 대체 표시.

### 백엔드

- 실제 매물 API 제공
  - `backend/properties/urls.py` — DRF Router로 `/api/properties/` 노출.
  - `backend/properties/views.py` — 목록/상세/버스점수 엔드포인트 구현.
  - `backend/properties/serializers.py` — 목록/상세 직렬화. 상세 `listing_type`은 내부 choice 값(`sale|jeonse|monthly`)이 그대로 출력됨.

- 더미/시드 스크립트
  - `backend/add_dummy_properties.py`
  - `backend/add_more_properties.py`
  - `backend/add_real_dummy_data.py`

- 개발 편의 폴백
  - `backend/locations/signals.py` — Celery 미존재 시 `MockCelery`로 대체 호출.

### 실데이터 연동 상태 및 사용 방법

- 프런트엔드 `listings.ts`는 이미 실제 백엔드 API를 호출함.
  - 목록: `GET /api/properties/?bounds=sw_lat,sw_lng,ne_lat,ne_lng`
  - 상세: `GET /api/properties/{id}/`
  - 다만 상세 호출 실패 시에만 모크 데이터로 폴백.

- 환경변수 설정(예: `frontend/.env.local`):
  - `NEXT_PUBLIC_API_URL=http://localhost:8000` (현재 `listings.ts`에서 사용)
  - 또는 통일을 위해 `NEXT_PUBLIC_API_BASE=http://localhost:8000`로 맞추고, 코드에서 공용 유틸(`src/lib/utils/api.ts`)을 쓰도록 정리 권장

- 백엔드 CORS 허용 확인:
  - `backend/config/settings.py`에 `django-cors-headers` 설정 존재. 프런트 포트(`http://localhost:3000` 등)가 허용 목록에 포함됨.

### 개선 제안

- 상세 폴백 모크 제거 또는 환경 플래그(예: `NEXT_PUBLIC_USE_MOCK=false`)로 비활성화.
- API Base 환경변수 통일: `NEXT_PUBLIC_API_BASE` 하나로 표준화하고 `src/lib/utils/api.ts`의 헬퍼를 모든 API 호출에서 사용.
- 타입 정합화: `ApiListing.listing_type` 타입을 실제 백엔드 출력값(`'sale' | 'jeonse' | 'monthly'`)과 일치시키고, 뷰모델 변환 시 한국어 표기로 매핑.
- 이미지 전략: 백엔드 `images` 필드 채우기(업로드/저장) 후, `randomImage` 의존도 점감.


