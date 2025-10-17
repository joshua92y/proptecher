# 이주메이트 프론트엔드 (Next.js)

## 🚀 빠른 시작 (Quick Start)

### 1. 환경변수 설정

```bash
# env.local.example을 복사하여 .env.local 생성
cp env.local.example .env.local

# .env.local 파일을 열어 실제 API 키 입력
# 필수: 카카오맵 JavaScript 키, REST API 키
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

개발 서버가 http://localhost:3000 에서 시작됩니다.

---

## 📋 필수 환경변수

`.env.local` 파일에 다음 변수들을 설정해야 합니다:

| 변수명 | 설명 | 필수 여부 |
|--------|------|-----------|
| `NEXT_PUBLIC_KAKAO_MAP_APP_KEY` | 카카오맵 JavaScript SDK 앱 키 | ✅ 필수 |
| `NEXT_PUBLIC_KAKAO_MAP_API_KEY` | 카카오맵 REST API 키 | ✅ 필수 |
| `NEXT_PUBLIC_API_URL` | 백엔드 API URL (기본값: http://localhost:8000) | ✅ 필수 |

### 카카오맵 API 키 발급 방법

1. [카카오 개발자 콘솔](https://developers.kakao.com/console/app) 접속
2. 애플리케이션 추가
3. 앱 키 탭에서 **JavaScript 키** 및 **REST API 키** 복사
4. 플랫폼 설정에서 웹 플랫폼 추가 (http://localhost:3000)

---

## 📁 프로젝트 구조

```
frontend/
├── src/
│   ├── app/                    # Next.js 13+ App Router
│   │   ├── (consumer)/         # 일반 사용자 페이지
│   │   │   └── listings/       # 매물 검색/상세
│   │   ├── (admin)/            # 관리자 페이지
│   │   ├── page.tsx            # 홈 페이지
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   └── globals.css         # 전역 스타일
│   ├── components/             # 공통 컴포넌트
│   │   ├── KakaoMap.tsx        # 카카오맵 컴포넌트
│   │   ├── TopNav.tsx          # 상단 네비게이션
│   │   ├── BottomNav.tsx       # 하단 네비게이션
│   │   └── MobileLayout.tsx    # 모바일 레이아웃
│   ├── lib/                    # 유틸리티 함수
│   │   ├── data/               # API 호출 함수
│   │   │   └── listings.ts     # 매물 API 클라이언트
│   │   └── utils/              # 헬퍼 함수
│   └── types/                  # TypeScript 타입 정의
├── public/                     # 정적 파일
│   └── images/                 # 이미지 파일
├── .env.local.example          # 환경변수 템플릿
├── package.json                # NPM 패키지 설정
├── tsconfig.json               # TypeScript 설정
└── next.config.ts              # Next.js 설정
```

---

## 🎨 주요 페이지

### 사용자 페이지
- `/` - 홈 (배너, 서비스 메뉴, 인기 매물)
- `/listings` - 지도 기반 매물 검색
- `/listings/[id]` - 매물 상세 정보
- `/experts` - 전문가 매칭 (준비 중)
- `/policy` - 정책 정보
- `/mypage` - 마이페이지 (준비 중)

### 관리자 페이지 (준비 중)
- `/admin` - 관리자 대시보드
- `/admin/inspections` - 임장 관리

---

## 🔧 개발 명령어

```bash
# 개발 서버 실행 (http://localhost:3000)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 린트 검사
npm run lint

# TypeScript 타입 체크
npx tsc --noEmit
```

---

## 🛠️ 기술 스택

### 프레임워크
- **Next.js 12.3.4** - React 프레임워크
- **React 18.2.0** - UI 라이브러리
- **TypeScript 5** - 타입 안전성

### 스타일링
- **styled-components 6.1.14** - CSS-in-JS

### 상태 관리
- **Zustand 5.0.3** - 경량 상태 관리
- **React Hooks** - 컴포넌트 상태

### 지도
- **카카오맵 JavaScript SDK v2** - 지도 표시 및 마커
- **카카오 지오코더 API** - 좌표↔주소 변환

### API 통신
- **Fetch API** - HTTP 클라이언트

---

## 📱 주요 기능

### 1. 지도 기반 매물 검색
- 카카오맵에서 실시간 매물 검색
- 지도 영역 이동 시 자동 필터링
- 마커 클러스터링 (10개 이상 자동 그룹화)
- 실시간 주소 표시

### 2. 드래그 가능한 매물 목록
- 3단계 높이 조절 (10%, 30%, 70%)
- 터치/마우스 이벤트 통합
- 스냅 포인트 자동 고정

### 3. 매물 상세 정보
- 탭 기반 정보 구분
- 이미지 슬라이더
- 교통 정보 (버스/지하철)
- 편의시설 정보

### 4. 모바일 최적화
- 반응형 디자인
- 터치 제스처 지원
- 40px 이상 터치 영역

---

## 🔌 백엔드 연동

### API 엔드포인트

프론트엔드는 다음 백엔드 API를 사용합니다:

```typescript
// 매물 목록 조회
GET /api/listings/
Query: ?bounds=37.5,127.0,37.6,127.1

// 매물 상세 조회
GET /api/listings/{id}/
```

### 데이터 흐름

```
1. 사용자가 지도 이동
   ↓
2. 현재 bounds 좌표 추출
   ↓
3. GET /api/listings/?bounds=...
   ↓
4. 백엔드에서 해당 영역 매물 반환
   ↓
5. 지도에 마커 표시
```

---

## 🐛 트러블슈팅

### 지도가 표시되지 않는 경우
1. `.env.local` 파일에 `NEXT_PUBLIC_KAKAO_MAP_APP_KEY` 확인
2. 카카오 개발자 콘솔에서 플랫폼 설정 확인 (http://localhost:3000)
3. 브라우저 콘솔에서 에러 메시지 확인

### API 호출 실패
1. 백엔드 서버가 실행 중인지 확인 (http://localhost:8000)
2. CORS 설정 확인 (백엔드 settings.py)
3. `.env.local`의 `NEXT_PUBLIC_API_URL` 확인

### 빌드 오류
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

---

## 🎯 다음 단계

- [ ] 사용자 로그인/회원가입 UI
- [ ] 매물 찜하기 기능
- [ ] 검색 필터 UI
- [ ] 임장 신청 모달
- [ ] 마이페이지 구현
- [ ] 실시간 알림

---

## 📦 패키지 추가

```bash
# 패키지 설치
npm install package-name

# 개발 의존성 설치
npm install -D package-name

# package.json 업데이트 후
npm install
```

---

**버전**: v0.1 (Alpha)  
**개발 팀**: 이주메이트  
**최종 업데이트**: 2025.10.17
