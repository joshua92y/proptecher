# Django + Celery + PostGIS + Dragonfly + Mapshaper TopoJSON 생성 시스템 (Docker)

이 프로젝트는 Sido 모델의 PostGIS geometry 데이터를 기반으로 **Mapshaper**를 사용하여 TopoJSON 파일을 자동 생성하는 **Docker 기반** 시스템입니다.

## 주요 기능

- **자동 TopoJSON 생성**: DB 변경 시 자동으로 TopoJSON 파일 재생성
- **비동기 처리**: Celery를 통한 백그라운드 작업
- **캐시 관리**: Dragonfly를 통한 고성능 캐시 시스템
- **RESTful API**: TopoJSON 데이터 제공 API

## 시스템 아키텍처

```
Django App → PostGIS DB → Signals → Celery Task → TopoJSON File
     ↓              ↓         ↓         ↓           ↓
Dragonfly Cache ← REST API ← ViewSet ← Cache ← Static Files
```

## 설치 및 실행 (Docker)

### 1. 사전 요구사항

- **Docker Desktop** 설치 (Windows/Mac)
- **Docker Compose** 설치 (Docker Desktop에 포함)

### 2. 빠른 시작

```bash
# Windows
start_docker.bat

# Linux/Mac
docker-compose -f docker-compose.dev.yml up --build -d
```

### 3. 서비스 중지

```bash
# Windows
stop_docker.bat

# Linux/Mac
docker-compose -f docker-compose.dev.yml down
```

### 4. 로그 확인

```bash
# Windows
docker-logs.bat [서비스명]

# Linux/Mac
docker-compose -f docker-compose.dev.yml logs -f [서비스명]
```

### 5. 수동 실행 (개발용)

```bash
# 1. 이미지 빌드
docker-compose -f docker-compose.dev.yml build

# 2. 서비스 시작
docker-compose -f docker-compose.dev.yml up -d

# 3. 특정 서비스 재시작
docker-compose -f docker-compose.dev.yml restart web

# 4. 컨테이너 내부 접속
docker-compose -f docker-compose.dev.yml exec web bash
```

## API 엔드포인트

### TopoJSON API

- `GET /api/topojson/sido/` - TopoJSON 데이터 조회
- `GET /api/topojson/sido/status/` - TopoJSON 생성 상태 확인

### Sido 관리 API

- `GET /api/locations/sido/` - Sido 목록 조회
- `POST /api/locations/sido/` - Sido 생성
- `GET /api/locations/sido/{id}/` - Sido 상세 조회
- `PUT /api/locations/sido/{id}/` - Sido 수정
- `DELETE /api/locations/sido/{id}/` - Sido 삭제
- `POST /api/locations/sido/regenerate-topojson/` - TopoJSON 수동 재생성

## 파일 구조

```
backend/
├── config/
│   ├── settings.py      # Django + Celery + Dragonfly 설정 (환경변수 지원)
│   ├── celery.py        # Celery 앱 설정
│   └── urls.py          # URL 라우팅
├── locations/
│   ├── models.py        # Sido 모델 (이미 정의됨)
│   ├── views.py         # REST API + TopoJSON API
│   ├── tasks.py         # Celery Tasks (Mapshaper 사용)
│   ├── signals.py       # DB 변경 감지
│   ├── serializers.py   # DRF 시리얼라이저
│   ├── apps.py          # 앱 설정 (Signal 등록)
│   └── urls.py          # 앱 URL 설정
├── static/
│   └── data/
│       └── locations/
│           └── sido_topo.json  # 생성된 TopoJSON 파일
├── docker-compose.yml           # 프로덕션용 Docker Compose
├── docker-compose.dev.yml       # 개발용 Docker Compose
├── Dockerfile                   # Docker 이미지 설정
├── .dockerignore               # Docker 빌드 제외 파일
├── init.sql                    # PostgreSQL 초기화 스크립트
├── start_docker.bat            # Docker 서비스 시작 (Windows)
├── stop_docker.bat             # Docker 서비스 중지 (Windows)
├── docker-logs.bat             # Docker 로그 확인 (Windows)
├── requirements.txt            # Python 의존성 패키지
└── README.md                   # 프로젝트 문서
```

## 캐시 키

- `sido_topojson_ready`: TopoJSON 준비 상태 (True/False)
- `sido_topojson_file`: TopoJSON 파일 경로
- `sido_topojson_time`: 마지막 생성 시간
- `sido_topojson_feature_count`: Feature 개수
- `sido_topojson_error`: 오류 메시지 (있는 경우)

## 동작 흐름

1. **DB 변경 감지**: Sido 모델의 post_save/post_delete 신호
2. **캐시 무효화**: Dragonfly에서 TopoJSON 관련 캐시 삭제
3. **Task 실행**: Celery Worker가 TopoJSON 재생성 작업 수행
4. **파일 생성**: `static/data/locations/sido_topo.json`에 저장
5. **캐시 업데이트**: 생성 완료 상태를 Dragonfly에 저장
6. **API 응답**: 클라이언트가 TopoJSON 데이터 조회 가능

## 개발 및 디버깅

### 서비스 접속 정보

- **Django 웹 서버**: http://localhost:8000
- **Celery Flower (모니터링)**: http://localhost:5555
- **PostgreSQL**: localhost:5432
- **Dragonfly**: localhost:6379

### Celery Task 모니터링

```bash
# Celery Flower 웹 인터페이스
# http://localhost:5555 에서 Task 상태 확인 가능

# Docker 컨테이너 내부에서 직접 실행
docker-compose -f docker-compose.dev.yml exec web celery -A config flower
```

### 캐시 상태 확인

```bash
# Docker 컨테이너 내부에서 Django Shell 실행
docker-compose -f docker-compose.dev.yml exec web python manage.py shell

# Python Shell에서 실행
from django.core.cache import cache
print(cache.get('sido_topojson_ready'))
print(cache.get('sido_topojson_file'))
print(cache.get('sido_topojson_time'))
```

### 수동 TopoJSON 생성

```bash
# Docker 컨테이너 내부에서 실행
docker-compose -f docker-compose.dev.yml exec web python manage.py shell

# Python Shell에서 실행
from locations.tasks import generate_sido_topojson
result = generate_sido_topojson.delay()
print(result.get())
```

### 로그 확인

```bash
# 특정 서비스 로그 확인
docker-logs.bat web          # Django 웹 서버
docker-logs.bat celery_worker # Celery Worker
docker-logs.bat postgres     # PostgreSQL
docker-logs.bat dragonfly    # Dragonfly

# 모든 서비스 로그
docker-logs.bat all
```

### 컨테이너 내부 접속

```bash
# Django 웹 컨테이너 접속
docker-compose -f docker-compose.dev.yml exec web bash

# Celery Worker 컨테이너 접속
docker-compose -f docker-compose.dev.yml exec celery_worker bash

# PostgreSQL 접속
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d postgres
```