# Quickstart: CoT 데이터셋 관리 웹앱

**Feature**: CoT 데이터셋 관리 웹앱 (004-cot-dataset-manager)  
**Date**: 2025-10-17

## 목적

이 문서는 개발자가 프로젝트를 빠르게 이해하고 시작할 수 있도록 핵심 정보를 제공합니다.

## 프로젝트 개요

LLM 학습용 Chain of Thought 데이터셋을 생성/관리하는 로컬 실행 웹 애플리케이션입니다.

**핵심 기능**:
- 질문자(30만), 금융상품(1만), CoT(1만) 데이터 관리
- 3패널 레이아웃으로 CoT 생성/편집
- CSV/JSON/XLSX Import/Export
- 가상 스크롤로 대용량 데이터 처리
- 오프라인 동작 (IndexedDB)
- 다크 모드, 접근성 (WCAG 2.1 AA)

## 빠른 시작

### 1. 환경 요구사항

- Node.js 18.0+
- npm 9.0+ 또는 yarn 1.22+
- 모던 브라우저 (Chrome 90+, Safari 14+, Firefox 88+)

### 2. 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 브라우저에서 http://localhost:5173 열림
```

### 3. 샘플 데이터 생성

```bash
# 샘플 데이터 생성 (100 질문자, 50 상품, 30 CoT)
npm run seed

# 생성 위치: public/sample-data/*.{csv,json}
```

### 4. 샘플 데이터 Import

1. 브라우저에서 "질문자 리스트" 메뉴 클릭
2. "Import" 버튼 클릭
3. `public/sample-data/users.json` 선택
4. Import 실행

상품과 CoT도 동일한 방식으로 Import합니다.

## 주요 디렉토리 구조

```
src/
├── models/          # Zod 스키마 (data contracts)
├── services/        # 비즈니스 로직
│   ├── storage/     # IndexedDB 추상화
│   ├── io/          # Import/Export
│   └── query/       # 검색/필터링
├── store/           # Redux Toolkit 슬라이스
├── components/      # UI 컴포넌트 (feature별)
├── pages/           # 라우팅 페이지
└── hooks/           # 커스텀 React 훅

tests/
├── contract/        # 계약 테스트 (스키마)
└── integration/     # 통합 테스트 (User Story)
```

## 핵심 기술 스택

| 레이어 | 기술 |
|--------|------|
| **Language** | TypeScript 5.6+ (strict mode) |
| **Framework** | React 19 + Vite 5.4 |
| **UI Library** | MUI v6 (Material-UI) |
| **State** | Redux Toolkit 2.2+ |
| **Forms** | React Hook Form 7.53 + Zod 3.23 |
| **Storage** | IndexedDB (Adapter 패턴) |
| **Data Grid** | MUI X Data Grid 7.20+ (가상 스크롤) |
| **CSV** | Papa Parse 5.4+ |
| **XLSX** | SheetJS 0.18+ |
| **Testing** | Vitest 2.1 + Playwright 1.48 |

## 개발 명령어

```bash
# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 테스트 실행
npm run test

# E2E 테스트
npm run test:e2e

# 린트 검사
npm run lint

# 샘플 데이터 생성
npm run seed
```

## 데이터 모델

### 1. 질문자 (UserAnon)
- 익명 금융 고객 정보
- 고객출처 (증권/보험), 성별, 연령대, 투자성향
- IndexedDB `userAnons` store

### 2. 금융상품 (Product)
- 추천 대상 상품 정보
- 상품출처 (증권/보험), 상품분류, 위험등급
- IndexedDB `products` store

### 3. CoT 질의응답 (CoTQA)
- LLM 학습 데이터
- 질문자 참조, 상품 참조, 질문, CoT1~n, 답변
- IndexedDB `cots` store

상세 스키마는 [data-model.md](./data-model.md) 참조.

## 주요 컴포넌트

### CoT 생성 화면
- **파일**: `src/pages/cots/CotsDetailPage.tsx`
- **레이아웃**: 3패널 (질문자 | CoT 폼 | 상품)
- **기능**: CoT 생성/수정, 동적 CoT 단계 추가

### 데이터 그리드
- **컴포넌트**: MUI X Data Grid
- **기능**: 가상 스크롤, 검색, 정렬, 페이징
- **성능**: 30만 행 원활 처리

### Import/Export
- **파일**: `src/services/io/importer.ts`, `exporter.ts`
- **형식**: CSV, JSON, XLSX
- **유효성 검사**: Zod 스키마 기반

## 테스트 전략

### 계약 테스트 (Contract Tests)
- **위치**: `tests/contract/schemas/`
- **목적**: Zod 스키마 유효성 검증
- **실행**: `npm run test`

```typescript
// 예시: tests/contract/schemas/cotqa.schema.test.ts
import { cotQASchema } from '@/models/cotqa';

test('valid CoTQA passes schema validation', () => {
  const valid Data = { /* ... */ };
  expect(() => cotQASchema.parse(validData)).not.toThrow();
});
```

### 통합 테스트 (Integration Tests)
- **위치**: `tests/integration/`
- **목적**: User Story 시나리오 검증
- **도구**: Vitest + React Testing Library

```typescript
// 예시: tests/integration/cots/form_validation.test.tsx
test('CoT form shows validation errors for empty required fields', () => {
  render(<CotsDetailPage />);
  fireEvent.click(screen.getByText('저장'));
  expect(screen.getByText('질문을 입력해주세요')).toBeInTheDocument();
});
```

### E2E 테스트
- **위치**: `tests/e2e/` (미생성, 필요 시 추가)
- **도구**: Playwright
- **실행**: `npm run test:e2e`

## 성능 최적화

1. **가상 스크롤**: MUI X Data Grid 내장 기능
2. **디바운싱**: 검색 입력 300ms 지연
3. **메모이제이션**: `React.memo`, `useMemo`, `useCallback`
4. **배치 처리**: IndexedDB 1000건 단위 트랜잭션
5. **코드 스플리팅**: React Router lazy loading

## 접근성 (a11y)

- WCAG 2.1 AA 준수
- 키보드 네비게이션 (Tab, Enter, Arrow keys)
- 포커스 인디케이터 명확
- ARIA 레이블 및 역할
- 명암비 4.5:1 (텍스트), 3:1 (UI)

## Constitution 준수

프로젝트는 7가지 Constitution 원칙을 준수합니다:

1. ✅ **데이터 프라이버시 우선**: IndexedDB 로컬 저장, 외부 전송 금지
2. ✅ **사용자 경험 우선**: WCAG 2.1 AA, 300ms 응답
3. ✅ **성능 최적화**: 가상 스크롤, 디바운싱, 배치 처리
4. ✅ **계약 기반 개발**: Zod 스키마, Import/Export 계약
5. ✅ **테스트 가능성**: 계약 테스트, 통합 테스트
6. ✅ **단순성 유지**: 명확한 폴더 구조, YAGNI
7. ✅ **오프라인 우선**: 네트워크 불필요, 로컬 실행

## 자주 묻는 질문 (FAQ)

### Q: 데이터는 어디에 저장되나요?
A: 브라우저의 IndexedDB에 로컬로 저장됩니다. 서버로 전송되지 않습니다.

### Q: 데이터를 다른 PC로 옮기려면?
A: Export 기능으로 CSV/JSON/XLSX 파일로 내보내고, 다른 PC에서 Import하세요.

### Q: 브라우저를 닫으면 데이터가 사라지나요?
A: 아니요, IndexedDB는 영구 저장소이므로 브라우저를 닫아도 데이터가 유지됩니다.

### Q: 여러 탭에서 동시에 편집하면?
A: 마지막 저장 우선(last write wins) 정책이 적용됩니다.

### Q: 성능이 느려요.
A: 데이터가 너무 많으면 Export 후 불필요한 데이터를 삭제하세요. 브라우저 캐시를 비우고 재시작해 보세요.

## 다음 단계

1. [spec.md](./spec.md) - 전체 기능 명세 확인
2. [data-model.md](./data-model.md) - 데이터 모델 상세 이해
3. [research.md](./research.md) - 기술 스택 선정 근거 파악
4. [contracts/](./contracts/) - 데이터 계약 스키마 검토
5. 코드 탐색: `src/models/` → `src/services/` → `src/components/`

## 도움이 필요하면

- Constitution: `.specify/memory/constitution.md`
- README: `README.md`
- Issues: GitHub Issues (if applicable)

프로젝트는 이미 완전히 구현되어 있으므로, 코드를 읽고 이해하는 데 집중하세요.

