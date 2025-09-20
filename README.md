# CoT 데이터셋 관리 웹앱

로컬 PC에서 실행되는 Chain of Thought (CoT) 데이터셋 생성/관리 관리자 웹앱입니다.

## 🚀 빠른 시작

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

### 3. 샘플 데이터 생성 (선택사항)
```bash
npm run seed
```

생성된 샘플 데이터는 `public/sample-data/` 폴더에 저장됩니다.

## 📋 주요 기능

### 🎯 CoT 관리
- **3패널 레이아웃**: 질문자 선택 | CoT 폼 | 상품 선택
- **동적 CoT 단계**: CoT1~3 필수 + CoTn 동적 추가
- **드래그 리사이징**: 각 textarea 높이 개별 조절 및 저장
- **패널 크기 조절**: 좌우 패널 너비 드래그 조절 및 저장

### 📊 데이터 관리
- **대용량 처리**: 가상 스크롤로 질문자 30만, 상품 1만, CoT 1만 지원
- **Import/Export**: CSV, JSON, XLSX 형식 지원
- **실시간 검색**: 질문/CoT1~n/답변 전체 텍스트 검색
- **고급 필터링**: 상품분류, 질문유형, 성별, 연령대 등

### ⚙️ 설정 및 사용성
- **다크/라이트 모드**: GitHub 다크모드 색상 팔레트 적용
- **동적 글꼴 크기**: 10px~24px 슬라이더 조절
- **접근성**: WCAG 2.1 AA 준수, 키보드 네비게이션
- **설정 저장**: localStorage 자동 저장/복원

## 🛠️ 기술 스택

### 프론트엔드
- **React 19** + **TypeScript** + **Vite**
- **MUI v6** (Material-UI + CSS Variables)
- **Redux Toolkit** (상태 관리)
- **React Hook Form** + **Zod** (폼 처리/검증)

### 데이터 처리
- **OPFS + SQLite-WASM** (대용량 로컬 데이터베이스)
- **MUI X Data Grid** (가상 스크롤)
- **Papa Parse** (CSV 스트리밍)
- **SheetJS** (XLSX 처리)
- **date-fns** (날짜 처리)

### 개발/테스트
- **Vitest** + **React Testing Library**
- **Playwright** (E2E 테스트)
- **ESLint** + **Prettier**

## 📁 프로젝트 구조

```
src/
├── app/                 # 라우팅/앱 셸
├── components/          # 공용 UI 컴포넌트
│   ├── common/         # 공통 컴포넌트
│   ├── cots/           # CoT 관련 컴포넌트
│   ├── layout/         # 레이아웃 컴포넌트
│   └── selectors/      # 선택 다이얼로그
├── hooks/              # 커스텀 훅
├── models/             # 데이터 모델 (Zod 스키마)
├── pages/              # 페이지 컴포넌트
├── services/           # 데이터 서비스
├── store/              # Redux 스토어
└── styles/             # 테마/스타일
```

## 🎨 UI/UX 특징

### 반응형 레이아웃
- **3패널 레이아웃**: 리사이즈 가능한 패널
- **고정 헤더**: 스크롤 중에도 패널 식별 가능
- **독립 스크롤**: 각 패널별 독립적인 스크롤

### 접근성
- **키보드 네비게이션**: 모든 기능 키보드로 접근 가능
- **고대비 모드**: 시각 장애인 지원
- **스크린 리더**: ARIA 레이블 및 역할 정의
- **터치 지원**: 최소 44px 터치 타겟

### 성능 최적화
- **가상 스크롤**: 대용량 데이터 처리
- **지연 로딩**: 필요시에만 데이터 로드
- **메모이제이션**: React.memo, useCallback 활용
- **청크 분할**: 코드 스플리팅으로 초기 로드 최적화

## 📊 데이터 모델

### 저장소 아키텍처
- **OPFS (Origin Private File System)**: 브라우저 내 안전한 파일 시스템
- **SQLite-WASM**: 고성능 SQL 데이터베이스 엔진
- **대용량 데이터 지원**: 30만+ 질문자, 1만+ 상품, 1만+ CoT 효율적 처리
- **고급 쿼리**: SQL 기반 인덱싱, 조인, 집계 지원

### 질문자 (UserAnon)
```typescript
interface UserAnon {
  id: string;
  customerSource: '증권' | '보험';
  ageGroup: '10대' | '20대' | ... | '80대 이상';
  gender: '남' | '여';
  ownedProducts: { productName: string; purchaseDate: string; }[];
  // 증권 고객 전용
  investmentTendency?: '공격투자형' | '적극투자형' | ...;
  investmentAmount?: number;
  // 보험 고객 전용
  insuranceType?: '보장only' | '변액only' | ...;
}
```

### 상품 (Product)
```typescript
interface Product {
  id: string;
  productSource: '증권' | '보험';
  productName: string;
  productCategory: string;
  taxType: string;
  riskLevel: string;
  description?: string; // 증권 상품만
}
```

### CoT (CoTQA)
```typescript
interface CoTQA {
  id: string;
  productSource: '증권' | '보험';
  questionType: string;
  questioner: string;
  products: string[];
  question: string;
  cot1: string;
  cot2: string;
  cot3: string;
  answer: string;
  status: '초안' | '검토중' | '완료' | '보류';
  author?: string;
  // 동적 CoT 필드 (cot4, cot5, ...)
  [key: string]: any;
}
```

## 🔧 개발 명령어

```bash
# 개발 서버 시작
npm run dev

# 빌드
npm run build

# 테스트 실행
npm run test

# E2E 테스트
npm run test:e2e

# 린트 검사
npm run lint

# 코드 포맷팅
npm run format

# 샘플 데이터 생성
npm run seed
```

## 📦 샘플 데이터

`npm run seed` 명령으로 생성되는 샘플 데이터:

- **질문자**: 100명 (증권/보험 고객 혼합)
- **상품**: 50개 (ETF, 펀드, 보험 등)
- **CoT**: 30개 (다양한 시나리오)

생성된 파일:
- `public/sample-data/users.json` / `users.csv`
- `public/sample-data/products.json` / `products.csv`
- `public/sample-data/cots.json` / `cots.csv`

## 🎯 사용 시나리오

### 1. 새 CoT 생성
1. **CoTs** 메뉴 → **새 CoT 생성**
2. **질문자 선택** (좌측 패널)
3. **CoT 폼 작성** (중앙 패널)
   - 상품분류, 질문유형 선택
   - 질문 입력
   - CoT1~3 단계 작성
   - 필요시 CoT 단계 추가
   - 답변 작성
4. **상품 선택** (우측 패널)
5. **저장**

### 2. 데이터 Import
1. **Import** 버튼 클릭
2. CSV/JSON/XLSX 파일 선택
3. 데이터 미리보기 확인
4. Import 실행

### 3. 설정 조정
1. **설정** 메뉴
2. **글꼴 크기** 슬라이더 조정
3. **다크 모드** 토글
4. **수정 권한** 설정
5. 자동 저장

## 🔍 검색 및 필터링

### 텍스트 검색
- **전체 텍스트**: 질문, CoT1~n, 답변 전체 검색
- **실시간 검색**: 입력과 동시에 결과 업데이트
- **하이라이팅**: 검색어 강조 표시

### 고급 필터
- **상품분류**: 증권/보험
- **질문유형**: 각 분류별 세부 유형
- **성별/연령**: 질문자 특성
- **상태**: CoT 진행 상태

## 🎨 테마 및 스타일

### 다크 모드
- **GitHub 다크 팔레트** 적용
- **자동 테마 전환** 지원
- **고대비 모드** 호환

### 반응형 디자인
- **데스크톱 우선** (1200px+)
- **태블릿 지원** (768px+)
- **터치 친화적** 인터페이스

## 📈 성능 지표

### 목표 성능
- **초기 로드**: < 3초 (로컬)
- **상호작용**: < 300ms (p95)
- **대용량 처리**: 300k+ 행 지원
- **메모리 사용량**: < 500MB

### 최적화 기법
- **가상 스크롤**: 10,000+ 행 처리
- **디바운싱**: 검색 입력 최적화
- **청크 로딩**: 필요시에만 로드
- **캐싱**: 중복 요청 방지

## 🛡️ 보안 및 제약사항

### 로컬 우선
- **오프라인 동작**: 네트워크 불필요
- **데이터 보호**: 외부 전송 금지
- **OPFS + SQLite**: 브라우저 내 안전한 파일 시스템 기반 데이터베이스

### 브라우저 지원
- **Chromium**: Chrome, Edge (권장)
- **Safari**: 최신 버전
- **Firefox**: 최신 버전

## 🤝 기여하기

1. 이슈 생성 또는 기능 제안
2. 포크 및 브랜치 생성
3. 변경사항 구현
4. 테스트 추가/업데이트
5. Pull Request 생성

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

**개발자**: NIA CoT 데이터셋 팀  
**버전**: 1.0.0  
**최종 업데이트**: 2025-09-20