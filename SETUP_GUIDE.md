# 🚀 이주메이트 팀원 온보딩 가이드

> 새로운 팀원이 개발 환경을 설정하는 단계별 가이드입니다.

---

## ⏱️ 예상 소요 시간

- **전체**: 약 30분 ~ 1시간
- Docker 다운로드 및 설치: 10분
- 저장소 클론 및 백엔드 설정: 10분
- 프론트엔드 설정: 10분
- 카카오 API 키 발급: 10분

---

## 📋 사전 준비물

### 필수 설치
- [ ] **Git**: https://git-scm.com/downloads
- [ ] **Docker Desktop**: https://www.docker.com/products/docker-desktop/
- [ ] **Node.js v16+**: https://nodejs.org/ (LTS 버전 권장)

### 계정 준비
- [ ] **GitHub 계정** (저장소 접근용)
- [ ] **카카오 개발자 계정**: https://developers.kakao.com/

---

## 🔧 단계별 설정

### Step 1: 저장소 클론

```bash
# 저장소 클론
git clone <repository-url>
cd proptecher

# ssh 브랜치로 체크아웃
git checkout ssh
```

---

### Step 2: 백엔드 설정 (5분)

```bash
# backend 디렉토리로 이동
cd backend

# Docker Compose로 모든 서비스 시작
# (PostgreSQL, Dragonfly, Django, Celery 등)
docker-compose up -d

# 서비스 시작 확인 (약 30초 소요)
docker-compose ps
```

**예상 출력**:
```
NAME                     STATUS
codelab_postgres         Up
codelab_dragonfly        Up
codelab_web              Up
codelab_celery_worker    Up
codelab_celery_beat      Up
codelab_celery_flower    Up
```

```bash
# DB 데이터 복원 (2,562개 매물 데이터 포함)
docker-compose exec -T postgres psql -U postgres -d postgres < db_dump.sql
```

**성공 메시지**: `COPY`, `CREATE`, `ALTER` 등의 SQL 명령어가 출력됩니다.

---

### Step 3: 백엔드 접속 확인

브라우저에서 다음 URL 접속:

1. **Django API**: http://localhost:8000/api/
   - 매물 API 목록이 보이면 성공!

2. **Admin 페이지**: http://localhost:8000/admin/
   - 로그인 정보:
     - ID: `admin`
     - PW: `admin1234`
   - 로그인 후 매물 목록 확인 가능

3. **Swagger UI**: http://localhost:8000/api/schema/swagger-ui/
   - API 문서 확인

4. **Celery Flower**: http://localhost:5555/
   - Celery 작업 모니터링

---

### Step 4: 카카오 API 키 발급 (10분)

#### 4-1. 카카오 개발자 콘솔 접속
1. https://developers.kakao.com/console/app 접속
2. 카카오 계정으로 로그인

#### 4-2. 애플리케이션 생성
1. "애플리케이션 추가하기" 클릭
2. 앱 이름: "이주메이트 개발" (또는 원하는 이름)
3. 사업자명: 개인 이름 입력
4. "저장" 클릭

#### 4-3. 앱 키 복사
1. 생성된 앱 클릭
2. **앱 키** 탭 선택
3. 다음 두 개 키 복사:
   - **JavaScript 키** (예: `1234567890abcdef1234567890abcdef`)
   - **REST API 키** (예: `abcdef1234567890abcdef1234567890`)

#### 4-4. 플랫폼 등록
1. **플랫폼** 탭 선택
2. "Web 플랫폼 등록" 클릭
3. 사이트 도메인 입력:
   - `http://localhost:3000`
4. "저장" 클릭

---

### Step 5: 프론트엔드 설정 (5분)

```bash
# 프로젝트 루트에서 frontend 디렉토리로 이동
cd ../frontend

# 환경변수 파일 생성
cp env.local.example .env.local
```

**중요**: `.env.local` 파일을 열어 다음 내용 수정:

```bash
# .env.local 파일 (메모장 또는 VS Code로 열기)

# Step 4-3에서 복사한 JavaScript 키 붙여넣기
NEXT_PUBLIC_KAKAO_MAP_APP_KEY=여기에_JavaScript_키_붙여넣기

# Step 4-3에서 복사한 REST API 키 붙여넣기
NEXT_PUBLIC_KAKAO_MAP_API_KEY=여기에_REST_API_키_붙여넣기

# 백엔드 URL (변경하지 않음)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**예시**:
```
NEXT_PUBLIC_KAKAO_MAP_APP_KEY=1234567890abcdef1234567890abcdef
NEXT_PUBLIC_KAKAO_MAP_API_KEY=abcdef1234567890abcdef1234567890
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
# NPM 패키지 설치 (약 2분 소요)
npm install

# 개발 서버 실행
npm run dev
```

---

### Step 6: 프론트엔드 접속 확인

브라우저에서 http://localhost:3000 접속

**확인 사항**:
- ✅ 홈 화면 배너 슬라이더가 보임
- ✅ "부동산 찾기" 버튼 클릭 시 지도 표시
- ✅ 지도에 매물 마커가 표시됨
- ✅ 매물 마커 클릭 시 하단 목록이 올라옴

---

## ✅ 설정 완료 체크리스트

### 백엔드
- [ ] Docker 컨테이너 6개 모두 실행 중
- [ ] http://localhost:8000/api/ 접속 가능
- [ ] Admin 페이지 로그인 성공
- [ ] Swagger UI에서 API 문서 확인

### 프론트엔드
- [ ] .env.local 파일 생성 및 API 키 입력
- [ ] npm install 완료
- [ ] http://localhost:3000 접속 가능
- [ ] 지도에 매물 마커 표시
- [ ] 매물 클릭 시 상세 정보 표시

---

## 🐛 문제 해결

### 1. Docker 컨테이너가 시작되지 않는 경우

**포트 충돌 확인**:
```bash
# Windows
netstat -ano | findstr :5432
netstat -ano | findstr :8000

# Mac/Linux
lsof -i :5432
lsof -i :8000
```

**해결 방법**: 
- 해당 포트를 사용하는 프로세스 종료
- 또는 docker-compose.yml에서 포트 변경

### 2. DB 복원 실패

**에러 메시지**: `psql: error: connection to server failed`

**해결 방법**:
```bash
# 컨테이너 재시작
docker-compose restart postgres

# 30초 대기 후 재시도
docker-compose exec -T postgres psql -U postgres -d postgres < db_dump.sql
```

### 3. 지도가 표시되지 않는 경우

**원인**: 카카오 API 키 문제

**확인 사항**:
1. `.env.local` 파일이 `frontend/` 디렉토리에 있는지 확인
2. API 키가 올바르게 입력되었는지 확인 (공백 없음)
3. 브라우저 개발자 도구(F12) → Console 탭에서 에러 확인
4. 카카오 개발자 콘솔에서 플랫폼 등록 확인

**해결 후**: 개발 서버 재시작 (`Ctrl+C` 후 `npm run dev`)

### 4. 프론트엔드 빌드 오류

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### 5. API 호출 실패

**원인**: 백엔드가 실행되지 않음

**확인**:
```bash
cd backend
docker-compose ps
# 모든 서비스가 "Up" 상태인지 확인
```

---

## 💡 추가 팁

### VS Code 추천 확장 프로그램
- Python
- Pylance
- Django
- ESLint
- Prettier
- Docker

### 개발 서버 시작 스크립트

**백엔드**:
```bash
# backend/start_dev.bat (Windows)
docker-compose up -d
docker-compose logs -f
```

**프론트엔드**:
```bash
# frontend/start_dev.bat (Windows)
npm run dev
```

---

## 📞 도움 요청

설정 중 문제가 발생하면:
1. 에러 메시지 전체 복사
2. 실행한 명령어 기록
3. 팀 채팅방에 공유

---

## 🎉 설정 완료!

모든 체크리스트를 완료했다면, 이제 개발을 시작할 수 있습니다!

**다음 단계**:
- [개발일지 2025.10.17](DEVELOPMENT_LOG_2025_10_17.md) 읽기
- [백엔드 개발 가이드](backend/README.md) 참고
- [프론트엔드 개발 가이드](frontend/README.md) 참고

**Happy Coding! 🚀**






