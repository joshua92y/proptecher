# Listings API 개발 완료 가이드

## ✅ 완료된 작업

### 1. 모델 업데이트
- ✅ `Listing` 모델에 프론트엔드 요구 필드 추가
  - `대중교통점수` (Integer, 0-10)
  - `노선다양성점수` (Integer, 0-5)
  - `버스정류장정보` (JSONField)
  - `지하철역정보` (JSONField)
  - `편의시설요약` (TextField)
  - `이미지URLs` (JSONField)
  - `QA정보` (JSONField)

### 2. Serializers 작성
- ✅ `ListingListSerializer`: 지도용 간단한 매물 정보
  - 자동 제목 생성 (매물타입 + 가격)
  - 가격 텍스트 포맷팅
  - 대표 이미지 선택
  
- ✅ `ListingDetailSerializer`: 상세 정보용 완전한 매물 정보
  - 프론트엔드 필드명으로 매핑
  - 모든 JSON 필드 지원

### 3. ViewSet 구현
- ✅ `ListingViewSet`
  - **목록 조회 (list)**: `/api/listings/`
    - 지도 범위 필터링 지원 (`?bounds=sw_lat,sw_lng,ne_lat,ne_lng`)
    - 페이지네이션 지원
    - 매물타입/주택종류 필터링
    - 주소 검색
  - **상세 조회 (retrieve)**: `/api/listings/{id}/`
    - 조회수 자동 증가
    - 완전한 매물 정보 반환
  - **권한**: 공개 API (AllowAny)

### 4. URL 라우팅
- ✅ `/api/listings/` - 매물 목록
- ✅ `/api/listings/{id}/` - 매물 상세
- ✅ Swagger UI 통합

### 5. 테스트 데이터
- ✅ 4개의 테스트 매물 생성
  - 전세 2건 (강남, 무주)
  - 월세 1건 (마포 DMC)
  - 매매 1건 (잠실)

### 6. Admin 패널
- ✅ Django Admin 패널 업데이트
  - 새로운 필드 표시
  - Fieldsets 구조화
  - 검색/필터링 개선

---

## 📡 API 엔드포인트

### 1. 매물 목록 조회

```http
GET /api/listings/
GET /api/listings/?bounds=34.9,126.9,35.1,127.1
GET /api/listings/?매물타입=jeonse
GET /api/listings/?search=강남구
```

**응답 예시:**
```json
{
  "listings": [
    {
      "id": "1",
      "title": "전세 3.2억",
      "price": "3.20억",
      "addr": "서울특별시 강남구 테헤란로 123",
      "lat": "37.50489600",
      "lng": "127.04832600",
      "img": "/images/house1.jpg"
    }
  ]
}
```

### 2. 매물 상세 조회

```http
GET /api/listings/{id}/
```

**응답 예시:**
```json
{
  "listing_type": "jeonse",
  "jeonse_price": 320000000,
  "address": "서울특별시 강남구 테헤란로 123",
  "maintenance_fee_monthly": 120000,
  "parking_info": "주차 1대",
  "exclusive_area_sqm": 84.97,
  "exclusive_area_pyeong": 25.72,
  "rooms": 3,
  "bathrooms": 2,
  "floor": "12/25",
  "built_year": 2008,
  "supply_area_sqm": 109.23,
  "orientation": "남동",
  "household_total": 512,
  "parking_total": 600,
  "entrance_type": "계단식",
  "move_in_date": "즉시",
  "building_use": "공동주택(아파트)",
  "approval_date": "2008-09-15",
  "first_registered_at": "2025-10-03",
  "contract_term_months": 24,
  "renewable": true,
  "public_transport_score": 8,
  "line_variety_score": 4,
  "bus_stops": [
    {
      "stop_name": "선릉역.르네상스호텔",
      "distance_m": 180,
      "bus_numbers": ["146", "341", "360"]
    }
  ],
  "stations": [
    {
      "station_name": "선릉역",
      "line_names": ["2호선", "수인분당선"],
      "distance_m": 420
    }
  ],
  "images": ["/images/house1.jpg", "/images/house2.jpg"],
  "amenity_summary": "도보 5분 내 편의점, 카페, 식당 밀집",
  "qa": []
}
```

---

## 🧪 테스트 방법

### 1. 터미널에서 테스트

```bash
# 목록 조회
curl http://localhost:8000/api/listings/

# 상세 조회
curl http://localhost:8000/api/listings/1/

# 지도 범위 필터링 (무주 지역)
curl "http://localhost:8000/api/listings/?bounds=34.9,126.9,35.1,127.1"

# 매물 타입 필터링
curl "http://localhost:8000/api/listings/?매물타입=jeonse"
```

### 2. Swagger UI에서 테스트

브라우저에서 접속:
```
http://localhost:8000/api/swagger/
```

**Listings 섹션에서:**
- `GET /api/listings/` - Try it out 클릭
- `GET /api/listings/{id}/` - ID: 1 입력 후 Execute

### 3. 프론트엔드 연동 테스트

프론트엔드 `.env.local` 파일:
```bash
BACKEND_BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

프론트엔드에서 API 호출:
```typescript
// 목록 조회
const response = await fetch('/api/listings?bounds=34.9,126.9,35.1,127.1');
const data = await response.json();

// 상세 조회
const response = await fetch('/api/listings/1');
const data = await response.json();
```

---

## 📊 데이터베이스 스키마

### Listing 모델 주요 필드

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `매물타입` | CharField | sale, jeonse, monthly |
| `주택종류` | CharField | apartment, officetel, villa, etc. |
| `매매가` | BigIntegerField | 매매가(원) |
| `전세보증금` | BigIntegerField | 전세보증금(원) |
| `월세보증금` | BigIntegerField | 월세보증금(원) |
| `월세` | BigIntegerField | 월세(원) |
| `주소` | TextField | 전체 주소 |
| `위도` | DecimalField | 위도 좌표 |
| `경도` | DecimalField | 경도 좌표 |
| `대중교통점수` | IntegerField | 0-10점 |
| `노선다양성점수` | IntegerField | 0-5점 |
| `버스정류장정보` | JSONField | 배열 |
| `지하철역정보` | JSONField | 배열 |
| `이미지URLs` | JSONField | 배열 |
| `QA정보` | JSONField | 배열 |

---

## 🔧 추가 개발 가능 항목

### 우선순위 높음
- [ ] 매물 등록 API (POST /api/listings/)
- [ ] 매물 수정 API (PUT/PATCH /api/listings/{id}/)
- [ ] 매물 삭제 API (DELETE /api/listings/{id}/)
- [ ] 찜하기 기능 API
- [ ] 이미지 업로드 API

### 우선순위 중간
- [ ] 매물 조회 기록 API
- [ ] 추천 매물 API
- [ ] 유사 매물 API
- [ ] 가격 비교 API

### 우선순위 낮음
- [ ] 매물 통계 API
- [ ] 지역별 평균 가격 API
- [ ] 인기 검색어 API

---

## 🚀 배포 체크리스트

### 프로덕션 환경 설정
- [ ] SECRET_KEY 환경변수 설정
- [ ] DEBUG=False 설정
- [ ] ALLOWED_HOSTS 설정
- [ ] CORS 설정
- [ ] PostgreSQL 연결 확인
- [ ] Celery Worker 실행 확인
- [ ] Redis/Dragonfly 연결 확인

### 성능 최적화
- [ ] 데이터베이스 인덱스 추가 (위도, 경도)
- [ ] 쿼리 최적화 (select_related, prefetch_related)
- [ ] 캐싱 구현 (Redis)
- [ ] 이미지 CDN 설정

### 보안
- [ ] Rate Limiting 설정
- [ ] SQL Injection 방지 확인
- [ ] XSS 방지 확인
- [ ] CSRF 보호 확인

---

## 📝 마이그레이션 기록

```bash
# 마이그레이션 생성
docker-compose -f docker-compose.dev.yml exec web python manage.py makemigrations listings

# 마이그레이션 실행
docker-compose -f docker-compose.dev.yml exec web python manage.py migrate

# 테스트 데이터 생성
docker-compose -f docker-compose.dev.yml exec web python create_test_listings.py
```

---

## 🐛 알려진 이슈 및 해결

### 1. 인증 오류 (403 Forbidden)
**문제**: 기본 REST_FRAMEWORK 설정이 `IsAuthenticated`  
**해결**: `ListingViewSet`에 `permission_classes = [AllowAny]` 추가

### 2. JSON 필드 기본값 오류
**문제**: JSONField의 default=list가 mutable object 경고  
**해결**: 마이그레이션 파일에서 `default=list` 사용 (Django가 자동 처리)

### 3. 한글 깨짐 (Windows PowerShell)
**문제**: curl 출력 시 한글 깨짐  
**해결**: `chcp 65001` 실행 또는 Swagger UI 사용

---

## 📞 문의 및 지원

**개발 완료일**: 2025-10-17  
**개발자**: AI Assistant  
**문서 버전**: 1.0.0

**다음 단계**: Inspection API 개발 (BACKEND_DEVELOPMENT_WORKFLOW.md Phase 3 참조)






