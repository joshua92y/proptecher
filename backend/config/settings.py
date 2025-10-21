# backend/config/settings.py
import os
import re
from pathlib import Path

# ============================================================================
# GeoDjango 환경변수 설정 (로컬 Windows 개발 환경용)
# ============================================================================
# Docker 환경에서는 자동으로 GDAL이 설정되므로 Windows 로컬 환경에서만 설정
import sys
if sys.platform == 'win32' and os.path.exists(r'G:\OSGeo4W'):
    # OSGeo4W 경로를 시스템 PATH에 추가 (Windows 로컬 개발 환경)
    os.environ['OSGEO4W_ROOT'] = r'G:\OSGeo4W'
    os.environ['GDAL_DATA'] = r'G:\OSGeo4W\share\gdal'
    os.environ['PROJ_LIB'] = r'G:\OSGeo4W\share\proj'
    os.environ['PATH'] = r'G:\OSGeo4W\bin;' + os.environ.get('PATH', '')

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/


# ============================================================================
# 보안 설정
# ============================================================================

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = "django-insecure-$!5$-f$b$c6rk9#qkbg$l$ujwt!u=f2q-9a5io*_+)ap)o$y$t"

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []


# ============================================================================
# 애플리케이션 및 미들웨어 설정
# ============================================================================

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",  # GeoDjango 지원
]
THIRD_PARTY_APPS = [
    "rest_framework",  # Django REST Framework
    "corsheaders",  # CORS 헤더 지원
    "channels",  # WebSocket 지원
    "django_filters", # 필터링
    "taggit",  # 태그 기능
    'django_extensions', # 확장
    "drf_spectacular", # 스웨거 UI
]

LOCAL_APPS = [
    "locations",       # 지도, 폴리곤, 지역 정보 관리 (Region 통합)
    "accounts",        # 계정 관리
    "properties",      # 부동산 db 관리
    "users",          # 사용자 관리
    "agents",         # 중개사 관리
    "listings",       # 매물 관리
    "inspections",    # 임장 관리
    "notices",        # 공지사항 관리
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend'
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

# 미들웨어 설정
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",  # CORS - 최상단에 위치해야 함
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",  # 다국어 지원 미들웨어 추가
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# URL 설정
ROOT_URLCONF = "config.urls"

# WSGI/ASGI 애플리케이션
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# ============================================================================
# CORS 설정 (프론트엔드 연동)
# ============================================================================

# 개발 환경에서 프론트엔드 허용
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",  # 추가 포트
    "http://127.0.0.1:3001",
    "http://localhost:3005",  # 추가 포트
    "http://127.0.0.1:3005",
]

# 개발 환경에서는 localhost의 모든 포트 허용 (개발 편의성)
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = False  # 보안상 False로 유지하되 아래에서 패턴 허용
    # localhost와 127.0.0.1의 모든 포트를 허용하는 정규식 패턴
    CORS_ALLOWED_ORIGIN_REGEXES = [
        r"^http://localhost:\d+$",
        r"^http://127\.0\.0\.1:\d+$",
    ]

# 프로덕션 환경에서는 환경 변수로 관리
if os.environ.get('FRONTEND_URL'):
    CORS_ALLOWED_ORIGINS.append(os.environ.get('FRONTEND_URL'))

# CORS 허용 헤더
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# 인증 정보 포함 허용
CORS_ALLOW_CREDENTIALS = True

# ============================================================================
# 템플릿 설정
# ============================================================================

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [
            BASE_DIR / "templates",
        ],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# ============================================================================
# 데이터베이스 설정
# ============================================================================

# 개발 환경: SQLite 사용
# Docker/프로덕션 환경: PostgreSQL + PostGIS 사용
USE_POSTGRESQL = os.environ.get("DATABASE_HOST", "").lower() not in ["", "localhost"]

if USE_POSTGRESQL:
    # PostgreSQL + PostGIS (클라우드/프로덕션)
    DATABASES = {
        "default": {
            "ENGINE": "django.contrib.gis.db.backends.postgis",
            "NAME": os.environ.get("DATABASE_NAME", "propdb"),
            "USER": os.environ.get("DATABASE_USER", "postgres"),
            "PASSWORD": os.environ.get("DATABASE_PASSWORD", "yoon1992"),
            "HOST": os.environ.get("DATABASE_HOST", "133.186.155.85"),
            "PORT": os.environ.get("DATABASE_PORT", "5432"),
        }
    }
else:
    # SQLite (로컬 개발)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# ============================================================================
# Dragonfly 캐시 설정
# ============================================================================

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": f"redis://{os.environ.get('REDIS_HOST', '127.0.0.1')}:{os.environ.get('REDIS_PORT', '6379')}/0",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}

# ============================================================================
# Celery 설정
# ============================================================================

# Celery 브로커 및 결과 백엔드 (Dragonfly 사용)
CELERY_BROKER_URL = f"redis://{os.environ.get('REDIS_HOST', '127.0.0.1')}:{os.environ.get('REDIS_PORT', '6379')}/1"
CELERY_RESULT_BACKEND = f"redis://{os.environ.get('REDIS_HOST', '127.0.0.1')}:{os.environ.get('REDIS_PORT', '6379')}/2"

# Celery 설정
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "Asia/Seoul"
CELERY_ENABLE_UTC = True

# Task 설정
CELERY_TASK_ALWAYS_EAGER = False  # 실제 비동기 실행
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30분
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60  # 25분

# Worker 설정
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000

# 패스워드 검증
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# ============================================================================
# GeoDjango 및 공간정보 설정
# ============================================================================

# GDAL/GEOS 라이브러리 경로 (Windows 로컬 환경에서만 설정)
if sys.platform == 'win32' and os.path.exists(r'G:\OSGeo4W'):
    GDAL_LIBRARY_PATH = r"G:\OSGeo4W\bin\gdal308.dll"
    GEOS_LIBRARY_PATH = r"G:\OSGeo4W\bin\geos_c.dll"
# Docker/Linux 환경에서는 시스템 GDAL 사용 (자동 검색)

# ============================================================================
# Django Admin 지도 위젯 설정 (OpenStreetMap 사용)
# ============================================================================

# Django Admin GeoDjango 지도 위젯 설정 (OpenStreetMap 사용)
# GeoDjango admin에서 OpenLayers 기반 지도 위젯 설정

# OpenLayers 위젯 기본 옵션 - OpenStreetMap 사용
OLWIDGET_DEFAULT_OPTIONS = {
    'default_lat': 37.5665,    # 서울 위도
    'default_lon': 126.9780,   # 서울 경도
    'default_zoom': 10,        # 기본 줌 레벨
    'map_srid': 4326,         # WGS84 좌표계
    'map_width': 640,         # 지도 너비
    'map_height': 480,        # 지도 높이
    'num_zoom': 18,           # 최대 줌 레벨
}

# OpenStreetMap 레이어 설정
OLWIDGET_LAYERS = {
    'osm': {
        'source': 'osm',  # OpenStreetMap 소스 사용
    }
}

# 기본 레이어를 OpenStreetMap으로 설정
OLWIDGET_DEFAULT_BASE_LAYERS = ['osm']

# ============================================================================
# 국제화 및 현지화 설정
# ============================================================================

LANGUAGE_CODE = "ko-kr"
# 지원 언어 설정
LANGUAGES = [
    ('ko', 'Korean'),
    ('en', 'English'),
    ('es', 'Spanish'),
]

TIME_ZONE = "Asia/Seoul"

USE_I18N = True

USE_TZ = True

# ============================================================================
# 정적 파일 및 미디어 설정
# ============================================================================

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [
    BASE_DIR / "static",
]

# 미디어 파일 설정
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ============================================================================
# 인증 설정
# ============================================================================

# 기본 Django User 모델 사용 (AUTH_USER_MODEL 충돌 해결)
# AUTH_USER_MODEL = "users.User"
