# 이주메이트 (Ijumate)

> 지도 기반 부동산 매물 검색 및 임장 서비스

## 📋 프로젝트 개요

이주메이트는 사용자가 지도에서 직관적으로 부동산 매물을 찾아보고, 전문가와 연결하여 임장 서비스를 받을 수 있는 모바일 웹 플랫폼입니다.

---

## 🚀 빠른 시작 (팀원용)

### 1. 저장소 클론

```bash
git clone <repository-url>
cd proptecher
git checkout ssh
```

### 2. 백엔드 설정 (Django)

```bash
cd backend

# Docker Compose로 전체 환경 시작
docker-compose up -d

# DB 덤프 파일로 데이터 복원 (2,562개 매물 포함)
docker-compose exec -T postgres psql -U postgres -d postgres < db_dump.sql
```

**접속 정보**:
- Django API: http://localhost:8000/api/
- Admin: http://localhost:8000/admin/ (ID: admin, PW: admin1234)
- Celery Flower: http://localhost:5555/

### 3. 프론트엔드 설정 (Next.js)

```bash
cd ../frontend

# 환경변수 설정
cp env.local.example .env.local
# .env.local 파일을 열어 카카오맵 API 키 입력 필수!

# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

**접속**: http://localhost:3000

---

## 🎯 주요 기능 (v0.1)

### ✅ 구현 완료
- **지도 기반 매물 검색**
  - 카카오맵 API 활용
  - 지도 영역 기반 실시간 필터링
  - 마커 클러스터링 (10개 이상 자동 그룹화)
  - 실시간 주소 표시

- **드래그 가능한 매물 목록**
  - 3단계 높이 조절 (10%, 30%, 70%)
  - 터치/마우스 통합 지원
  - 매물 카드 (이미지, 가격, 주소)

- **매물 상세 정보**
  - 탭 기반 UI (기본정보/교통/편의시설)
  - 이미지 슬라이더
  - 50개 필드 상세 정보

- **홈 화면**
  - 자동 배너 슬라이더
  - 서비스 메뉴 (부동산 찾기, 전문가 매칭, 정책 정보)
  - 정책 뉴스 섹션
  - 인기 매물 섹션

- **데이터**
  - 전국 2,562개 매물 데이터
  - 17개 시/도 커버리지
  - 실제 좌표 기반 배치

### ⏳ 개발 예정 (v0.2)
- 사용자 회원가입/로그인 (JWT)
- 매물 찜하기 기능
- 검색 필터 (가격, 면적, 방 개수)
- 임장 신청 시스템
- 전문가 매칭 시스템

---

## 🏗️ 프로젝트 구조

```
proptecher/
├── backend/                 # Django 백엔드
│   ├── config/              # Django 설정
│   ├── listings/            # 매물 앱
│   ├── users/               # 사용자 관리
│   ├── agents/              # 중개사 관리
│   ├── regions/             # 지역 정보
│   ├── locations/           # 위치 데이터
│   ├── docker-compose.yml   # Docker 설정
│   ├── Dockerfile           # Docker 이미지
│   ├── db_dump.sql          # DB 덤프 (초기 데이터)
│   ├── requirements.txt     # Python 패키지
│   └── README.md            # 백엔드 가이드
│
├── frontend/                # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   ├── components/      # 공통 컴포넌트
│   │   ├── lib/             # 유틸리티 & API 클라이언트
│   │   └── types/           # TypeScript 타입
│   ├── public/              # 정적 파일
│   ├── env.local.example    # 환경변수 템플릿
│   ├── package.json         # NPM 패키지
│   └── README.md            # 프론트엔드 가이드
│
└── README.md                # 이 파일
```

---

## 🛠️ 기술 스택

### 백엔드
- **Django 5.2.6** - 웹 프레임워크
- **Django REST Framework 3.16.1** - API
- **PostgreSQL 15 + PostGIS 3.3** - 지리공간 데이터베이스
- **Celery 5.4.0** - 비동기 작업
- **Dragonfly** - Redis 호환 캐시
- **Docker Compose** - 컨테이너 오케스트레이션

### 프론트엔드
- **Next.js 12.3.4** - React 프레임워크
- **React 18.2.0** - UI 라이브러리
- **TypeScript 5** - 타입 안전성
- **styled-components 6.1.14** - CSS-in-JS
- **Zustand 5.0.3** - 상태 관리
- **카카오맵 API** - 지도 서비스

---

## 📊 데이터 구조

### 매물 데이터 (Listing Model)
- 50개 필드: 가격, 면적, 교통, 편의시설 등
- 매물 유형: 매매, 전세, 월세
- 주택 종류: 아파트, 오피스텔, 빌라, 원룸, 투룸

### 지역 커버리지
- **서울**: 25개 구, 75개 매물
- **경기**: 31개 시/군, 620개 매물
- **부산**: 16개 구/군, 48개 매물
- **대구**: 8개 구/군, 24개 매물
- **인천**: 10개 구/군, 30개 매물
- **그 외**: 강원, 충청, 전라, 경상, 제주 등

**총 2,562개 매물**

---

## 🔌 API 문서

### 주요 엔드포인트

#### 매물 API
```
GET /api/listings/
- Query: ?bounds=남서위도,남서경도,북동위도,북동경도
- Response: 매물 목록 (ID, 제목, 가격, 주소, 좌표 등)

GET /api/listings/{id}/
- Response: 매물 상세 정보 (50개 필드)
```

### Swagger UI
- http://localhost:8000/api/schema/swagger-ui/
- http://localhost:8000/api/schema/redoc/

---

## 🧪 개발 명령어

### 백엔드
```bash
cd backend

# Docker 컨테이너 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# Django 명령어 실행
docker-compose exec web python manage.py <command>

# DB 백업
docker-compose exec -T postgres pg_dump -U postgres --clean --if-exists postgres > db_backup.sql
```

### 프론트엔드
```bash
cd frontend

# 개발 서버
npm run dev

# 빌드
npm run build

# 린트
npm run lint
```

---

## 🐛 트러블슈팅

### 포트 충돌
```bash
# 5432 포트 (PostgreSQL)
netstat -ano | findstr :5432

# 8000 포트 (Django)
netstat -ano | findstr :8000

# 3000 포트 (Next.js)
netstat -ano | findstr :3000
```

### Docker 초기화
```bash
cd backend
docker-compose down -v  # 볼륨 포함 전체 삭제
docker-compose up -d
docker-compose exec -T postgres psql -U postgres -d postgres < db_dump.sql
```

### 프론트엔드 재설치
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 커밋 컨벤션

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 코드
chore: 빌드 설정 등
```

---

## 👥 팀 정보

**개발 팀**: 이주메이트 개발팀  
**버전**: v0.1 (Alpha)  
**최종 업데이트**: 2025.10.17

---

## 📚 상세 문서

- [백엔드 개발 가이드](backend/README.md)
- [프론트엔드 개발 가이드](frontend/README.md)
- [개발일지 2025.10.17](DEVELOPMENT_LOG_2025_10_17.md)

---

## 🎯 로드맵

### Phase 1: MVP (v0.1) ✅ 완료
- 지도 기반 매물 검색
- 매물 상세 정보
- 모바일 최적화 UI

### Phase 2: 사용자 기능 (v0.2)
- 회원 시스템
- 찜하기
- 검색 필터

### Phase 3: 임장 시스템 (v0.3)
- 임장 신청
- 중개사 배정
- 임장 현황 추적

### Phase 4: 전문가 매칭 (v0.4)
- 전문가 프로필
- 1:1 상담
- 채팅 시스템

---

**🚀 Happy Coding!**
