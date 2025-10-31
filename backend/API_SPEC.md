## Proptecher Backend API (Mock) 사양서

본 문서는 목업(Mock) 환경 기준으로 정리된 백엔드 API 사양입니다. 인증·계정은 비활성/무시하고 누구나 호출 가능하다는 전제로 기술합니다.

### 개요
- **Base URL**: `/api`
- **인증**: 없음 (mock)
- **콘텐츠 타입**: `application/json`
- **문서/도구**: Swagger `/api/swagger/`, OpenAPI `/api/schema/`
- **활성 앱**: `properties`, `inspections` (참고: `locations`는 현재 라우팅 비활성화)

### 구현 상태 요약
- **완료**
  - 임장: 요청 생성, 상태 조회, 관리자 수락/거절/취소, 진행 저장/조회, 보고서 확정/조회, 평면도 저장/조회
  - 매물: 목록(지도 범위), 단건 조회
- **보완 필요**
  - 임장: 요청자/평가사 기준 목록 필터, 요청 수정, 평면도 삭제, 사용자 의존 로직의 mock 안전성
- **미구현**
  - 계정(accounts) API, 중개사(agents) API, locations 범위 조회군, 버스/생활 점수 API, 채팅(chat), 챗봇(chatbot)

---

### 임장 Inspections

#### 소비자용
- POST `/api/inspections/requests`
  - **설명**: 임장 요청 생성
  - **Body 예시**:
    ```json
    {
      "listingId": "매물PK",
      "매물제목": "전세 2억5500",
      "매물주소": "서울시 …",
      "가격정보": "전세 2.55억",
      "매물이미지URL": "/images/house1.jpg",
      "희망일자": "2025-11-15",
      "연락처": "010-1234-5678",
      "요청사항": "채광 확인 부탁"
    }
    ```
  - **201 응답**:
    ```json
    { "request_id": "요청PK", "status": "requested" }
    ```

- GET `/api/inspections/status?listing_id={id}`
  - **설명**: 특정 매물에 대한 나의 최근 임장 상태 조회
  - **주의**: mock 환경에서 사용자 미존재 시 `{ "status": null }` 또는 404가 반환될 수 있음
  - **200 응답 예시**:
    ```json
    { "status": "requested" }
    ```

- GET `/api/inspections/my-reports`
  - **설명**: 완료된 임장 보고서 목록 (현 구현은 사용자 필터 약함)
  - **200 응답**:
    ```json
    {
      "reports": [
        {
          "id": "요청PK",
          "inspectionId": "임장PK",
          "title": "전세 2억5500",
          "address": "서울시 …",
          "priceText": "전세 2.55억",
          "recommendation": true,
          "confirmedAt": "2025-10-25T12:34:56",
          "img": "/images/house1.jpg",
          "agentName": "홍길동"
        }
      ]
    }
    ```

- GET `/api/inspections/{inspection_id}/view-report`
  - **설명**: 내 임장 보고서 단건 조회
  - **200 응답**:
    ```json
    {
      "title": "전세 2억5500",
      "address": "서울시 …",
      "priceText": "전세 2.55억",
      "finalOpinion": "양호",
      "recommendation": true,
      "checklistData": { "bathroom": "ok" },
      "floorplanURL": "data:image/png;base64,...",
      "confirmedAt": "2025-10-25T12:34:56",
      "agentName": "홍길동",
      "agentCompany": "OO중개"
    }
    ```

#### 관리자/평가사용
- GET `/api/admin/inspections/requests`
  - **설명**: 요청 상태의 임장 요청 목록
  - **200 응답**:
    ```json
    { "requests": [ /* 요청 카드 배열 */ ] }
    ```

- GET `/api/admin/inspections/requests/{request_id}`
  - **설명**: 임장 요청 상세
  - **200 응답**: 요청 상세 JSON

- POST `/api/admin/inspections/{request_id}/accept`
  - **설명**: 요청 수락 → ActiveInspection 생성
  - **200 응답**:
    ```json
    { "inspectionId": "임장PK", "status": "active" }
    ```

- POST `/api/admin/inspections/{request_id}/reject`
  - **설명**: 요청 거절
  - **200 응답**: `{ "status": "rejected" }`

- GET `/api/admin/inspections/active`
  - **설명**: 진행 중 임장 목록
  - **200 응답**:
    ```json
    { "active": [ /* 진행중 배열 */ ] }
    ```

- GET `/api/admin/inspections/completed`
  - **설명**: 완료된 임장 목록
  - **200 응답**:
    ```json
    { "completed": [ /* 완료 배열 */ ] }
    ```

- POST `/api/admin/inspections/{inspection_id}/cancel`
  - **설명**: 임장 취소 (`requeue`가 true면 원 요청 상태를 requested로 복귀)
  - **Body 예시**:
    ```json
    { "reason": "일정 불가", "requeue": true }
    ```
  - **200 응답**:
    ```json
    { "status": "cancelled", "requeued": true }
    ```

- POST `/api/admin/inspections/{inspection_id}/floorplan`
  - **설명**: 평면도 저장/수정 (JSON + Base64 이미지)
  - **Body 예시**:
    ```json
    {
      "floorplanData": { "rooms": 3, "area": 84 },
      "floorplanImage": "data:image/png;base64,..."
    }
    ```
  - **200 응답**: `{ "success": true, "floorplanURL": "data:image/png;base64,...", "message": "평면도가 저장되었습니다." }`

- GET `/api/admin/inspections/{inspection_id}/floorplan`
  - **설명**: 평면도 조회
  - **200 응답**:
    ```json
    { "floorplanData": {}, "floorplanURL": "data:image/png;base64,..." }
    ```

- POST `/api/admin/inspections/{inspection_id}/save-progress`
  - **설명**: 체크리스트/진행률 저장
  - **Body 예시**:
    ```json
    { "checklistData": { "bathroom": "ok" }, "progress": 60 }
    ```
  - **200 응답**: `{ "success": true, "message": "진행 상황이 저장되었습니다." }`

- GET `/api/admin/inspections/{inspection_id}/progress`
  - **설명**: 진행 상황 조회
  - **200 응답**:
    ```json
    { "checklistData": {}, "progress": 60 }
    ```

- POST `/api/admin/inspections/{inspection_id}/submit-report`
  - **설명**: 보고서 확정(임장 완료 처리)
  - **Body 예시**:
    ```json
    {
      "finalOpinion": "매수 권장",
      "recommendation": true,
      "checklistData": { "bathroom": "ok" }
    }
    ```
  - **200 응답**:
    ```json
    { "success": true, "message": "보고서가 확정되었습니다.", "confirmedAt": "2025-10-25T12:34:56" }
    ```

> 상태: 위 명시 엔드포인트는 대부분 구현됨. 보완 필요 항목은 목록 필터(요청자/평가사), 요청 수정, 평면도 삭제(DELETE).

---

### 매물 Properties

- GET `/api/properties?bounds=sw_lat,sw_lng,ne_lat,ne_lng`
  - **설명**: 지도 범위 내 매물 목록
  - **예시**: `/api/properties?bounds=34.999,126.999,35.002,127.001`
  - **200 응답**:
    ```json
    {
      "properties": [
        {
          "id": "1",
          "title": "전세 2억 5500",
          "price": "2.55억",
          "addr": "무주읍 적천로 343",
          "lat": 35.0,
          "lng": 127.0,
          "img": "/images/house1.jpg"
        }
      ]
    }
    ```

- GET `/api/properties/{id}`
  - **설명**: 매물 상세
  - **200 응답(발췌)**:
    ```json
    {
      "listing_type": "sale",
      "house_type": "apartment",
      "sale_price": 255000000,
      "address": "서울시 …",
      "exclusive_area_sqm": 84.0,
      "rooms": 3,
      "bathrooms": 2,
      "public_transport_score": 78,
      "images": ["/images/house1.jpg"],
      "qa": { "관리비": "12만원" }
    }
    ```

> 상태: 목록/단건 구현됨. 버스 환경/생활 편의 점수 API는 미구현.

---

### 지역 Locations

- **현재**: 라우팅 비활성화(주석 처리). 시/도 TopoJSON API는 코드 존재하나 외부 노출 안 됨.
- **준비된(비활성)**
  - GET `/api/topojson/sido/` — 시/도 TopoJSON
  - GET `/api/topojson/sido/status/` — TopoJSON 생성 상태
- **계획(목업)**
  - GET `/api/locations/bus/list?lat=..&lng=..&buffer=..`
  - GET `/api/locations/subway/list?lat=..&lng=..&buffer=..`
  - GET `/api/locations/amenities/list?lat=..&lng=..&buffer=..`
  - GET `/api/locations/safety/list?lat=..&lng=..&buffer=..`
  - GET `/api/locations/culture?region_id=..`
  - GET `/api/locations/policy?region_id=..`
  - GET `/api/locations/jobs?region_id=..`

---

### 중개사 Agents

- **현재**: 모델/관리자 등록만 존재, 공개 API 없음
- **계획(목업)**
  - GET `/api/agents/me`
  - POST `/api/agents`
  - PATCH `/api/agents/{id}`

### 계정 Accounts

- **현재**: 미구현 (목업 목적상 인증 없이 모든 엔드포인트 호출 가능)

### 채팅 Chat (목업 계획)

- POST `/api/chat` — 채팅 생성
- PATCH `/api/chat/{id}/match` — 매칭
- POST `/api/chat/{id}/send` — 메시지 전송

### 챗봇 Chatbot (목업 계획)

- POST `/api/homechat` — 주거지 RAG(임장 보고서+문화/정책/일자리)
- POST `/api/medison` — 의료 정보 + LLM
- POST `/api/psych` — 심리상담소 + LLM
- POST `/api/law` — 법률 QA + 정책 + LLM

---

### 에러 포맷(예시)
```json
{ "error": "Not found" }
```

---

### 권장 워크플로우(우선순위)
1. 임장 보완: 요청자/평가사 기준 목록, 요청 수정/삭제, 평면도 삭제, `/status`의 mock-safe 응답 정리
2. 지역 활성화: `locations` URL 활성화 및 버스/지하철/시설/치안 범위 조회 구현
3. 매물 확장: 버스/생활 편의 점수 산출 API 추가(거리 가중/임계값 규칙 문서화)
4. 중개사/계정: 중개사 프로필 API 추가, 계정은 목업 유지
5. 채팅/챗봇: 채팅 CRUD+매칭/전송, 홈챗봇 RAG 최소 구현 후 확장



