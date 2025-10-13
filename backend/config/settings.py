# backend/config/settings.py
import os
from pathlib import Path

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
    "channels",  # WebSocket 지원
    "django_filters", # 필터링
    "taggit",  # 태그 기능
    'django_extensions', # 확장
    "drf_spectacular", # 스웨거 UI
]

LOCAL_APPS = [
    "locations",       # 지도 및 폴리곤 관리
    "accounts",        # 계정 관리
    "properties",      # 부동산 db 관리
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
                #"django.template.context_processors.i18n",  # 다국어 지원 컨텍스트 프로세서 추가
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                #"AI_Analyzer.context_processors.api_keys",  # 카카오 API 키
            ],
        },
    },
]


# ============================================================================
# 데이터베이스 설정
# ============================================================================
#DATABASES = {
#   "default": {
#        "ENGINE": "django.contrib.gis.db.backends.postgis",
#        "NAME": "postgres",
#        "USER": "postgres",
#        "PASSWORD": "!!Yoon1992",
#        "HOST": "34.64.52.68",
#        "PORT": "5432",
#    },
#}
DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": os.environ.get("DATABASE_NAME", "postgres"),
        "USER": os.environ.get("DATABASE_USER", "postgres"),
        "PASSWORD": os.environ.get("DATABASE_PASSWORD", "yoon1992"),
        "HOST": os.environ.get("DATABASE_HOST", "localhost"),
        "PORT": os.environ.get("DATABASE_PORT", "5432"),
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

GDAL_LIBRARY_PATH=r"C:\Program Files\QGIS 3.40.11\bin\gdal311.dll"
GEOS_LIBRARY_PATH=r"C:\Program Files\QGIS 3.40.11\bin\geos_c.dll"
PROJ_LIB = r"C:\Program Files\QGIS 3.40.11\share\proj"
PROJ_NETWORK = "OFF"
PROJ_SKIP_READ_USER_WRITABLE_DIRECTORY = "YES"
PROJ_CURL_ENABLED = "NO"
PROJ_DEBUG = "0"
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
# 인증 및 세션 설정
# ============================================================================