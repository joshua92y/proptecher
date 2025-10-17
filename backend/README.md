# 이주메이트 백엔드 (Django)

## 🚀 빠른 시작 (Quick Start)

### 1. Docker Compose로 전체 환경 시작

```bash
# backend 디렉토리에서
docker-compose up -d
```

이 명령어로 다음 서비스들이 시작됩니다:
- PostgreSQL (PostGIS) - 포트 5432
- Dragonfly (Redis 호환) - 포트 6379
- Django Web Server - 포트 8000
- Celery Worker
- Celery Beat
- Celery Flower - 포트 5555

### 2. 데이터베이스 초기화 (처음 한 번만)

```bash
# DB 덤프 파일로 데이터 복원
docker-compose exec -T postgres psql -U postgres -d postgres < db_dump.sql
```

이 명령어로:
- ✅ 테이블 스키마 생성
- ✅ 전국 2,562개 매물 데이터 로드
- ✅ 사용자, 지역 등 기본 데이터 로드

### 3. 접속 확인

- **Django API**: http://localhost:8000/api/
- **Admin 페이지**: http://localhost:8000/admin/
  - ID: `admin` (덤프 파일에 포함)
  - PW: `admin1234`
- **Celery Flower**: http://localhost:5555/

---

## 📁 프로젝트 구조

```
backend/
├── config/              # Django 설정
│   ├── settings.py      # 메인 설정 파일
│   ├── urls.py          # URL 라우팅
│   └── celery.py        # Celery 설정
├── listings/            # 매물 앱
│   ├── models.py        # 매물 모델 (50개 필드)
│   ├── serializers.py   # API 시리얼라이저
│   ├── views.py         # API 뷰
│   └── urls.py          # 매물 URL 라우팅
├── users/               # 사용자 관리
├── agents/              # 중개사 관리
├── regions/             # 지역 정보
├── locations/           # 위치 데이터
├── docker-compose.yml   # Docker 설정
├── Dockerfile           # Docker 이미지 정의
├── requirements.txt     # Python 패키지
├── db_dump.sql          # DB 덤프 파일 (초기 데이터)
└── manage.py            # Django 관리 스크립트
```

---

## 🔧 개발 명령어

### Docker 컨테이너 관리

```bash
# 전체 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 특정 서비스 로그 확인
docker-compose logs -f web

# 전체 중지
docker-compose down

# 컨테이너 + 볼륨 삭제 (데이터 초기화)
docker-compose down -v
```

### Django 명령어 실행

```bash
# 마이그레이션 생성
docker-compose exec web python manage.py makemigrations

# 마이그레이션 적용
docker-compose exec web python manage.py migrate

# Django 쉘 접속
docker-compose exec web python manage.py shell

# Superuser 생성
docker-compose exec web python manage.py createsuperuser

# 정적 파일 수집
docker-compose exec web python manage.py collectstatic
```

### 데이터베이스 관리

```bash
# DB 덤프 생성 (백업)
docker-compose exec -T postgres pg_dump -U postgres --clean --if-exists postgres > db_dump_backup.sql

# DB 복원
docker-compose exec -T postgres psql -U postgres -d postgres < db_dump.sql

# DB 직접 접속
docker-compose exec postgres psql -U postgres
```

---

## 🗄️ 데이터베이스 정보

### 연결 정보
- **Host**: localhost (외부) / postgres (Docker 내부)
- **Port**: 5432
- **Database**: postgres
- **User**: postgres
- **Password**: yoon1992

### 포함된 데이터 (db_dump.sql)
- **매물 데이터**: 2,562개
  - 서울 75개, 경기 620개, 부산 48개 등
  - 전국 17개 시/도 커버리지
- **사용자**: admin 계정 포함
- **지역 정보**: 시/도, 시/군/구 데이터

---

## 🔌 API 엔드포인트

### 매물 API
- `GET /api/listings/` - 매물 목록 조회
  - Query Parameters:
    - `bounds`: 지도 영역 필터링 (예: `37.5,127.0,37.6,127.1`)
- `GET /api/listings/{id}/` - 매물 상세 조회

### Swagger 문서
- **Swagger UI**: http://localhost:8000/api/schema/swagger-ui/
- **ReDoc**: http://localhost:8000/api/schema/redoc/

---

## 🛠️ 환경변수

Docker Compose가 자동으로 설정하는 환경변수:
```
DEBUG=True
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USER=postgres
DATABASE_PASSWORD=yoon1992
REDIS_HOST=dragonfly
REDIS_PORT=6379
```

---

## 🐛 트러블슈팅

### 포트 충돌 문제
```bash
# 5432 포트가 이미 사용 중인 경우
netstat -ano | findstr :5432
# 해당 프로세스 종료 또는 docker-compose.yml에서 포트 변경
```

### 데이터 초기화가 필요한 경우
```bash
# 1. 전체 중지 및 볼륨 삭제
docker-compose down -v

# 2. 재시작
docker-compose up -d

# 3. DB 덤프 복원
docker-compose exec -T postgres psql -U postgres -d postgres < db_dump.sql
```

### 마이그레이션 오류
```bash
# 마이그레이션 재적용
docker-compose exec web python manage.py migrate --fake-initial
```

---

## 📦 Python 패키지 추가

```bash
# requirements.txt에 패키지 추가 후
docker-compose exec web pip install -r requirements.txt

# 또는 컨테이너 재빌드
docker-compose up -d --build
```

---

## 🎯 다음 단계

- [ ] 사용자 인증 API 개발
- [ ] 매물 검색 필터 API
- [ ] 임장 신청 시스템
- [ ] 전문가 매칭 API
- [ ] 실시간 알림 (WebSocket)

---

**버전**: v0.1 (Alpha)  
**개발 팀**: 이주메이트  
**최종 업데이트**: 2025.10.17
