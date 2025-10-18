# Research: CoT 데이터셋 관리 웹앱

**Date**: 2025-10-17  
**Feature**: CoT 데이터셋 관리 웹앱 (004-cot-dataset-manager)

## 목적

이 문서는 implementation plan의 기술적 결정사항에 대한 연구 결과와 근거를 기록합니다. 프로젝트는 이미 구현되어 있으므로, 기존 선택의 타당성을 검증하고 문서화하는 데 초점을 맞춥니다.

## 기술 스택 결정

### 1. Frontend Framework: React 19

**결정**: React 19.0 사용

**근거**:
- 최신 React 19의 개선된 성능 (자동 배칭, 동시성 렌더링)
- 대규모 데이터 처리에 유리한 Virtual DOM 및 메모이제이션
- 풍부한 생태계와 커뮤니티 지원
- MUI, Redux Toolkit 등 주요 라이브러리와의 완벽한 호환성

**고려한 대안**:
- Vue 3: 러닝 커브가 낮지만 생태계가 React보다 작음
- Svelte: 성능 우수하지만 데이터 그리드 등 엔터프라이즈 라이브러리 부족
- Angular: 과도한 복잡도, 단일 사용자 로컬 앱에 과잉

**리스크**: React 19는 비교적 최신 버전이므로 일부 라이브러리와 호환성 문제 가능성 있으나, 주요 의존성(MUI v6, Redux Toolkit)은 React 19 지원 확인됨.

### 2. Language: TypeScript 5.6+ (Strict Mode)

**결정**: TypeScript strict mode 사용

**근거**:
- 컴파일 타임 타입 안전성으로 런타임 오류 사전 방지
- IDE 자동완성 및 리팩토링 지원 향상
- Zod 스키마와의 타입 추론 통합
- 대규모 코드베이스 유지보수성 향상
- `noUncheckedIndexedAccess`: 인덱스 접근 시 undefined 체크 강제

**고려한 대안**:
- JavaScript: 빠른 프로토타이핑 가능하나 대규모 프로젝트에서 버그 발생률 높음
- Flow: Facebook의 정적 타입 체커이지만 생태계 축소 중

### 3. Build Tool: Vite 5.4+

**결정**: Vite 사용

**근거**:
- 빠른 개발 서버 시작 (ESBuild 기반 사전 번들링)
- Hot Module Replacement (HMR) 성능 우수
- Rollup 기반 최적화된 프로덕션 빌드
- TypeScript 네이티브 지원
- React Fast Refresh 내장

**고려한 대안**:
- Create React App (CRA): 느린 빌드 속도, 커스터마이징 어려움, 공식 지원 중단
- Webpack: 강력하지만 설정 복잡도 높음, Vite 대비 느림
- Parcel: 제로 설정이지만 커스터마이징 제한적

### 4. UI Library: MUI v6 (Material-UI)

**결정**: MUI (Material-UI) v6 with CSS Variables 사용

**근거**:
- 풍부한 엔터프라이즈 컴포넌트 (Data Grid, Dialogs, Forms)
- WCAG 2.1 AA 접근성 기본 지원
- 다크 모드 네이티브 지원 (CSS Variables)
- 커스터마이징 가능한 테마 시스템
- TypeScript 타입 정의 우수
- MUI X Data Grid: 가상 스크롤, 대용량 데이터 처리 최적화

**고려한 대안**:
- Ant Design: 중국어 중심 문서, 한국어 UI 지원 부족
- Chakra UI: 가볍지만 Data Grid 등 엔터프라이즈 컴포넌트 부족
- Shadcn/ui: 커스터마이징 자유도 높지만 컴포넌트 직접 구축 필요

### 5. State Management: Redux Toolkit 2.2+

**결정**: Redux Toolkit 사용

**근거**:
- 예측 가능한 상태 관리 (단방향 데이터 흐름)
- Redux DevTools로 상태 디버깅 용이
- 비동기 로직 처리 (createAsyncThunk)
- 불변성 자동 처리 (Immer 내장)
- 대규모 애플리케이션에서 검증됨

**고려한 대안**:
- Context API: 간단하지만 성능 문제 (불필요한 리렌더링), 대규모 앱에 부적합
- Zustand: 가볍고 간단하지만 시간 여행 디버깅 등 고급 기능 부족
- Jotai/Recoil: Atomic 패턴이지만 생태계가 Redux보다 작음

### 6. Form Management: React Hook Form 7.53+ + Zod 3.23+

**결정**: React Hook Form + Zod 조합 사용

**근거**:
- 비제어 컴포넌트로 리렌더링 최소화 (성능 우수)
- Zod 스키마 기반 유효성 검사 (타입 안전성)
- 필드별 오류 처리 및 사용자 피드백
- MUI TextField와의 원활한 통합

**고려한 대안**:
- Formik: 제어 컴포넌트 기반으로 성능 저하, React Hook Form 대비 느림
- Final Form: 강력하지만 러닝 커브 높음

### 7. Storage: IndexedDB

**결정**: IndexedDB 사용 (Adapter 패턴으로 추상화)

**근거**:
- 브라우저 네이티브 NoSQL 데이터베이스
- 대용량 데이터 저장 가능 (30만+ 행)
- 인덱싱 지원으로 빠른 쿼리
- 트랜잭션 및 배치 처리 지원
- 오프라인 우선 설계에 최적

**고려한 대안**:
- localStorage: 5MB 제한, 동기 API로 성능 저하
- WebSQL: deprecated, 브라우저 지원 중단
- OPFS (Origin Private File System): 실험적 기능, 브라우저 지원 제한적
- SQLite WASM: 추가 번들 크기, IndexedDB로 충분

**구현 패턴**: Adapter 패턴으로 IndexedDB를 추상화하여 향후 다른 스토리지로 전환 가능성 확보.

### 8. Data Processing Libraries

#### CSV: Papa Parse 5.4+

**결정**: Papa Parse 사용

**근거**:
- 스트리밍 파싱 지원 (메모리 효율적)
- 대용량 파일 처리 최적화
- 에러 처리 및 유효성 검사
- 널리 사용되고 안정적

#### XLSX: SheetJS 0.18+

**결정**: SheetJS (xlsx) 사용

**근거**:
- 가장 널리 사용되는 Excel 처리 라이브러리
- 읽기/쓰기 모두 지원
- 다양한 Excel 형식 지원

**고려한 대안**:
- ExcelJS: 더 많은 기능이지만 번들 크기 큼, 읽기에는 SheetJS로 충분

#### 인코딩: encoding-japanese 2.2+

**결정**: encoding-japanese 사용

**근거**:
- EUC-KR 인코딩 지원 (한국 Excel 호환)
- UTF-8 ↔ EUC-KR 변환
- 가벼운 번들 크기

### 9. Testing Framework

#### Unit/Integration: Vitest 2.1+

**결정**: Vitest 사용

**근거**:
- Vite 네이티브 통합 (설정 최소화)
- Jest 호환 API (러닝 커브 낮음)
- 빠른 실행 속도 (ESBuild)
- TypeScript 네이티브 지원

**고려한 대안**:
- Jest: 느린 실행 속도, Vite와 통합 복잡

#### E2E: Playwright 1.48+

**결정**: Playwright 사용

**근거**:
- 다중 브라우저 테스트 (Chromium, Firefox, WebKit)
- 자동 대기 및 안정적인 테스트
- 강력한 디버깅 도구
- TypeScript 네이티브 지원

**고려한 대안**:
- Cypress: 단일 브라우저 제한 (Chromium만), Playwright 대비 느림
- Selenium: 구식 API, 유지보수 어려움

## 아키텍처 패턴

### 1. 폴더 구조: Feature-Based + Layered Hybrid

**결정**: 
```
src/
├── models/          # 데이터 스키마 (Zod)
├── services/        # 비즈니스 로직 계층
├── store/           # 상태 관리 (Redux)
├── components/      # UI 컴포넌트 (Feature별 그룹화)
├── pages/           # 라우팅 페이지
├── hooks/           # 커스텀 React 훅
└── styles/          # 글로벌 스타일
```

**근거**:
- 명확한 계층 분리 (Presentation, Business Logic, Data)
- Feature별 컴포넌트 그룹화로 관련 코드 근접 배치
- 단일 책임 원칙 (SRP) 준수
- 테스트 용이성

### 2. 상태 관리 패턴: Redux Slices

**결정**: Feature별 Redux Slice 분리 (cotsSlice, productsSlice, usersSlice, settingsSlice)

**근거**:
- 도메인별 상태 격리
- 리듀서 로직 모듈화
- 액션 및 셀렉터 공존 배치

### 3. Storage 패턴: Adapter + Service Layer

**결정**: 
```
storageService.ts (고수준 API)
    ↓
storage.ts (인터페이스)
    ↓
indexedDbAdapter.ts (구현)
```

**근거**:
- 구현 세부사항 추상화
- 향후 스토리지 교체 가능성 (예: OPFS)
- 테스트 모킹 용이

### 4. Form 패턴: Custom Hooks

**결정**: useCoTForm, useProductForm, useUserForm 커스텀 훅

**근거**:
- 폼 로직 재사용성
- 컴포넌트에서 비즈니스 로직 분리
- React Hook Form + Zod 통합 캡슐화

## 성능 최적화 전략

### 1. 가상 스크롤

**구현**: MUI X Data Grid의 내장 가상 스크롤 활용

**효과**: 30만 행 데이터에서도 부드러운 스크롤

### 2. 디바운싱

**구현**: 검색 입력에 300ms 디바운싱 적용

**효과**: 불필요한 검색 쿼리 감소, UI 반응성 향상

### 3. React 메모이제이션

**구현**: 
- React.memo: 컴포넌트 리렌더링 방지
- useMemo: 비싼 계산 결과 캐싱
- useCallback: 함수 참조 안정화

**효과**: 불필요한 리렌더링 최소화

### 4. IndexedDB 배치 처리

**구현**: 1000건 단위 트랜잭션 배치

**효과**: Import 성능 향상, 메모리 사용량 제한

### 5. 코드 스플리팅

**구현**: React Router 기반 페이지별 코드 스플리팅

**효과**: 초기 로드 시간 단축

## 데이터 무결성 보장

### 1. Zod 스키마 유효성 검사

**적용**: 모든 데이터 입력/Import에서 Zod parse 실행

**효과**: 타입 안전성, 런타임 유효성 검사

### 2. 계약 테스트

**적용**: 각 엔티티(CoTQA, Product, UserAnon) 스키마 테스트

**효과**: 스키마 변경 시 회귀 방지

### 3. 트랜잭션 무결성

**적용**: IndexedDB 트랜잭션 단위 저장

**효과**: 부분 저장 방지, 원자성 보장

## 접근성 (a11y) 전략

### 1. WCAG 2.1 AA 준수

**적용**:
- 명암비 4.5:1 (텍스트), 3:1 (UI 컴포넌트)
- 키보드 네비게이션 (Tab, Enter, Arrow keys)
- 포커스 인디케이터 명확히 표시
- ARIA 레이블 및 역할 제공

### 2. MUI 접근성 기능 활용

**적용**:
- TextField autoComplete, label
- Button aria-label
- Dialog role="dialog", aria-labelledby

### 3. 커스텀 CSS

**적용**: 고대비 모드 지원 (a11y.css)

## 보안 및 프라이버시

### 1. 로컬 우선 설계

**적용**: 모든 데이터는 브라우저 내에서만 처리

**효과**: 외부 유출 위험 제거

### 2. 익명화 데이터

**적용**: UserAnon 엔티티 (이름, 주소 등 PII 제외)

**효과**: 개인정보 보호

### 3. XSS 방지

**적용**: React의 자동 이스케이핑

**효과**: Cross-Site Scripting 공격 방지

## 향후 개선 가능성

### 1. 백엔드 통합

**시나리오**: 다중 사용자 협업 필요 시

**고려사항**:
- REST API 서버 추가
- 인증/인가 시스템
- 실시간 동기화 (WebSocket)

**준비사항**: Service Layer 추상화로 전환 용이

### 2. PWA (Progressive Web App)

**시나리오**: 모바일 앱처럼 설치 가능하도록

**고려사항**:
- Service Worker 등록
- manifest.json 추가
- 오프라인 캐싱 전략

**준비사항**: 오프라인 우선 설계로 PWA 전환 쉬움

### 3. 고급 검색

**시나리오**: 복잡한 쿼리 필요 시

**고려사항**:
- Full-text search 엔진 (예: Lunr.js, FlexSearch)
- 필터 조합 쿼리 빌더

### 4. 데이터 분석

**시나리오**: CoT 품질 분석 필요 시

**고려사항**:
- 텍스트 길이 통계
- 질문 유형별 분포
- 작성자별 생산성

## 결론

현재 기술 스택은 Constitution의 7가지 원칙을 모두 충족하며, 대용량 데이터 처리, 오프라인 동작, 접근성을 균형있게 달성합니다. 프로젝트는 이미 완전히 구현되어 있으며, 선택된 기술들은 요구사항을 충족하는 것으로 검증되었습니다.

**권장사항**: 현재 구조를 유지하고, 향후 기능 추가 시에도 Constitution 원칙을 준수하는 것을 권장합니다.

