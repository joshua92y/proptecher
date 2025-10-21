# 임장(Inspection) API 가이드

## 📋 목차
1. [소비자용 API](#소비자용-api)
2. [평가사용 API](#평가사용-api)
3. [데이터 모델](#데이터-모델)

---

## 소비자용 API

### 1. 임장 요청 생성
**POST** `/api/inspections/requests`

임장을 요청합니다.

**Request Body:**
```json
{
  "listing_id": "1",
  "title": "서울 강남구 아파트",
  "address": "서울특별시 강남구 테헤란로 123",
  "priceText": "매매 10억원",
  "img": "https://example.com/image.jpg",
  "preferred_date": "2025-11-01",
  "contact_phone": "010-1234-5678",
  "request_note": "주말 오후 방문 희망합니다"
}
```

**Response:** `201 Created`
```json
{
  "request_id": "a1b2c3d4-...",
  "status": "requested"
}
```

---

### 2. 임장 상태 조회
**GET** `/api/inspections/status?listing_id={listing_id}`

특정 매물에 대한 사용자의 임장 상태를 조회합니다.

**Query Parameters:**
- `listing_id` (required): 매물 ID

**Response:** `200 OK`
```json
{
  "status": "requested"  // 또는 "active", null
}
```

**상태 설명:**
- `null`: 임장 요청 없음
- `"requested"`: 임장 요청됨 (평가사 수락 대기 중)
- `"active"`: 임장 진행 중

---

## 평가사용 API

### 1. 임장 요청 목록 조회
**GET** `/api/admin/inspections/requests`

접수된 임장 요청 목록을 조회합니다.

**Response:** `200 OK`
```json
{
  "requests": [
    {
      "id": "a1b2c3d4-...",
      "title": "서울 강남구 아파트",
      "address": "서울특별시 강남구 테헤란로 123",
      "priceText": "매매 10억원",
      "img": "https://example.com/image.jpg"
    }
  ]
}
```

---

### 2. 임장 요청 상세 조회
**GET** `/api/admin/inspections/requests/{request_id}`

특정 임장 요청의 상세 정보를 조회합니다.

**Response:** `200 OK`
```json
{
  "id": "a1b2c3d4-...",
  "listing_id": "1",
  "title": "서울 강남구 아파트",
  "address": "서울특별시 강남구 테헤란로 123",
  "priceText": "매매 10억원",
  "fee_won": 150000,
  "preferred_date": "2025-11-01",
  "contact_phone": "010-1234-5678",
  "request_note": "주말 오후 방문 희망합니다",
  "description": "매물 상세 설명...",
  "highlights": ["feature1", "feature2"],
  "photos": ["url1", "url2"],
  "requested_at": 1729436400000,
  "img": "https://example.com/image.jpg"
}
```

---

### 3. 임장 요청 수락
**POST** `/api/admin/inspections/{request_id}/accept`

임장 요청을 수락하고 진행중인 임장으로 등록합니다.

**Response:** `200 OK`
```json
{
  "inspectionId": "x1y2z3...",
  "status": "active"
}
```

---

### 4. 임장 요청 거절
**POST** `/api/admin/inspections/{request_id}/reject`

임장 요청을 거절합니다.

**Response:** `200 OK`
```json
{
  "status": "rejected"
}
```

---

### 5. 진행중인 임장 목록 조회
**GET** `/api/admin/inspections/active`

현재 진행 중인 임장 목록을 조회합니다.

**Response:** `200 OK`
```json
{
  "active": [
    {
      "id": "x1y2z3...",
      "requestId": "a1b2c3d4-...",
      "title": "서울 강남구 아파트",
      "address": "서울특별시 강남구 테헤란로 123",
      "priceText": "매매 10억원",
      "progress": 50,
      "img": "https://example.com/image.jpg"
    }
  ]
}
```

---

### 6. 임장 취소
**POST** `/api/admin/inspections/{inspection_id}/cancel`

진행중인 임장을 취소합니다.

**Request Body:**
```json
{
  "reason": "고객 요청으로 취소",
  "requeue": true  // true: 재요청 가능, false: 완전 취소
}
```

**Response:** `200 OK`
```json
{
  "status": "cancelled",
  "requeued": true
}
```

---

## 데이터 모델

### InspectionRequest (임장 요청)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 고유 ID |
| 매물ID | FK | 연결된 매물 |
| 요청자ID | FK | 요청한 사용자 |
| 담당평가사ID | FK | 배정된 평가사 (nullable) |
| 희망날짜 | Date | 임장 희망 날짜 |
| 연락처 | String | 연락처 |
| 요청사항 | Text | 요청 사항 |
| 매물제목 | String | 매물 제목 (스냅샷) |
| 매물주소 | Text | 매물 주소 (스냅샷) |
| 가격정보 | String | 가격 텍스트 (스냅샷) |
| 임장비 | Integer | 임장비 (기본 150,000원) |
| 상태 | Choice | requested/accepted/rejected/cancelled/completed |
| 요청일시 | DateTime | 요청 시각 |
| 수락일시 | DateTime | 수락 시각 (nullable) |
| 완료일시 | DateTime | 완료 시각 (nullable) |

---

### ActiveInspection (진행중인 임장)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 고유 ID |
| 요청ID | OneToOne | 연결된 임장 요청 |
| 평가사ID | FK | 담당 평가사 |
| 진행률 | Integer | 진행률 (0-100%) |
| 평면도URL | Text | 평면도 이미지 URL (nullable) |
| 리포트URL | Text | 리포트 URL (nullable) |
| 평가사메모 | Text | 평가사 메모 (nullable) |
| 시작일시 | DateTime | 시작 시각 |
| 수정일시 | DateTime | 마지막 수정 시각 |

---

### InspectionCancellation (임장 취소)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 고유 ID |
| 임장ID | FK | 취소된 임장 |
| 평가사ID | FK | 취소한 평가사 |
| 취소사유 | Text | 취소 사유 |
| 재요청여부 | Boolean | 재요청 가능 여부 |
| 취소일시 | DateTime | 취소 시각 |

---

## 📊 워크플로우

### 소비자 측
```
1. 매물 상세 페이지에서 "임장 요청" 클릭
2. POST /api/inspections/requests (임장 요청 생성)
3. GET /api/inspections/status (상태 확인)
   - null → "임장 요청하기" 버튼 표시
   - requested → "요청됨" 배지 표시
   - active → "진행중" 배지 표시
```

### 평가사 측
```
1. GET /api/admin/inspections/requests (요청 목록 조회)
2. GET /api/admin/inspections/requests/{id} (상세 확인)
3-A. POST /api/admin/inspections/{id}/accept (수락)
     → ActiveInspection 생성
3-B. POST /api/admin/inspections/{id}/reject (거절)
4. GET /api/admin/inspections/active (진행중인 임장 조회)
5. POST /api/admin/inspections/{id}/cancel (필요시 취소)
```

---

## 🔐 인증

모든 API는 **JWT 인증**이 필요합니다.

**Header:**
```
Authorization: Bearer <access_token>
```

**평가사용 API**는 추가로 Agent 권한이 필요합니다.

---

## ⚠️ 에러 응답

**400 Bad Request**
```json
{
  "error": "listing_id is required"
}
```

**403 Forbidden**
```json
{
  "error": "Agent only"
}
```

**404 Not Found**
```json
{
  "error": "Request not found or already processed"
}
```

---

## 🧪 테스트 데이터 생성

```bash
# 15개의 샘플 임장 데이터 생성
docker-compose exec web python manage.py create_inspection_data --count=15
```

---

## 📱 프론트엔드 연동 예시

### 임장 요청 (소비자)
```typescript
const requestInspection = async (listingId: string, data: InspectionRequestData) => {
  const response = await fetch('/api/inspections/requests', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      listing_id: listingId,
      ...data
    })
  });
  return response.json();
};
```

### 임장 상태 확인
```typescript
const checkInspectionStatus = async (listingId: string) => {
  const response = await fetch(`/api/inspections/status?listing_id=${listingId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const { status } = await response.json();
  return status; // null, "requested", "active"
};
```

---

**임장 API 가이드 작성 완료** ✅

