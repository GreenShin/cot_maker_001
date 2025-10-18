# Implementation Plan: CoT 데이터셋 관리 웹앱

**Branch**: `004-cot-dataset-manager` | **Date**: 2025-10-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-cot-dataset-manager/spec.md`

## Summary

LLM 학습용 Chain of Thought 데이터셋을 생성하고 관리하는 로컬 실행 웹 애플리케이션. 관리자는 3패널 레이아웃에서 질문자(30만), 금융상품(1만), CoT 질의응답(1만)을 생성/조회/수정/삭제할 수 있으며, CSV/JSON/XLSX 형식의 Import/Export를 지원한다. IndexedDB 로컬 스토리지를 사용하여 오프라인 환경에서 동작하며, 가상 스크롤과 배치 처리로 대용량 데이터를 효율적으로 관리한다.

**기술 접근 방식**: React 19 + TypeScript + Vite 기반 SPA, MUI v6 컴포넌트 라이브러리, Redux Toolkit 상태 관리, IndexedDB 로컬 스토리지, Zod 스키마 유효성 검사, Vitest + Playwright 테스트 프레임워크.

## Technical Context

**Language/Version**: TypeScript 5.6+ (strict mode), ES2022 target  
**Primary Dependencies**: 
  - React 19.0 (UI 라이브러리)
  - MUI v6 (Material-UI 컴포넌트, CSS Variables)
  - Redux Toolkit 2.2+ (상태 관리)
  - React Hook Form 7.53+ + Zod 3.23+ (폼 처리 및 유효성 검사)
  - MUI X Data Grid 7.20+ (가상 스크롤 지원 테이블)
  - Papa Parse 5.4+ (CSV 스트리밍 파서)
  - SheetJS (XLSX) 0.18+ (Excel 파일 처리)
  - encoding-japanese 2.2+ (EUC-KR 인코딩 지원)
  
**Storage**: IndexedDB (브라우저 내장 NoSQL 데이터베이스)  
  - 30만+ 질문자, 1만+ 상품, 1만+ CoT 데이터 저장
  - 인덱싱: 각 엔티티별 검색 필드 (성별, 연령대, 상품분류, 상태 등)
  - 배치 트랜잭션: 1000건 단위 처리
  
**Testing**: 
  - Vitest 2.1+ (단위 및 통합 테스트)
  - React Testing Library 16.0+ (컴포넌트 테스트)
  - Playwright 1.48+ (E2E 테스트)
  
**Target Platform**: 모던 웹 브라우저 (Chrome 90+, Safari 14+, Firefox 88+)  
**Project Type**: 단일 웹 애플리케이션 (Frontend-only SPA)  
**Build Tool**: Vite 5.4+ (빠른 개발 서버 및 최적화된 프로덕션 빌드)  

**Performance Goals**: 
  - 리스트 상호작용 응답: p95 < 300ms
  - CoT 생성/저장: < 5분 (사용자 작업 시간 포함)
  - Import 1만 건: < 10분
  - 브라우저 메모리: < 500MB

**Constraints**: 
  - 오프라인 우선: 네트워크 연결 불필요
  - 로컬 스토리지만 사용: 서버 통신 금지
  - 데이터 프라이버시: 외부 전송 금지
  - 대용량 데이터: 30만/1만/1만 건 처리
  - 접근성: WCAG 2.1 AA 준수

**Scale/Scope**: 
  - 사용자: 단일 관리자 (로그인 불필요)
  - 데이터: 질문자 30만 건, 상품 1만 건, CoT 1만 건
  - 화면: 9개 주요 페이지 (목록 3개 + 상세 3개 + 설정 1개 + 통계 2개)
  - 코드: ~15,000 LOC (TypeScript + TSX)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. 데이터 프라이버시 우선 ✅ PASS
- ✅ IndexedDB 로컬 스토리지만 사용
- ✅ 외부 네트워크 전송 금지
- ✅ 익명화 데이터만 취급
- ✅ Import/Export는 사용자 명시적 선택

### II. 사용자 경험 우선 ✅ PASS
- ✅ WCAG 2.1 AA 준수 계획
- ✅ 키보드 접근성 요구사항 명시
- ✅ 다크/라이트 모드 지원
- ✅ 설정 자동 저장/복원
- ✅ 300ms 응답 시간 목표

### III. 성능 최적화 ✅ PASS
- ✅ MUI X Data Grid 가상 스크롤
- ✅ 검색 디바운싱
- ✅ IndexedDB 배치 처리 (1000건)
- ✅ 스트리밍 Import/Export
- ✅ React.memo/useMemo/useCallback 활용 계획

### IV. 계약 기반 개발 ✅ PASS
- ✅ Zod 스키마 정의
- ✅ Import/Export 계약 명시
- ✅ 필드 유효성 검사
- ✅ 오류 메시지 표준화

### V. 테스트 가능성 ✅ PASS
- ✅ 계약 테스트 계획 (Zod 스키마)
- ✅ 통합 테스트 (User Story 기반)
- ✅ 서비스 레이어 분리
- ✅ 실제 시나리오 테스트

### VI. 단순성 유지 ✅ PASS
- ✅ 명확한 폴더 구조 (models/services/components/pages/store)
- ✅ 단일 책임 원칙
- ✅ YAGNI 준수
- ✅ 불필요한 추상화 회피

### VII. 오프라인 우선 ✅ PASS
- ✅ 네트워크 불필요
- ✅ 로컬 번들링
- ✅ IndexedDB/localStorage만 사용
- ✅ CDN 의존성 최소화

**Gate Status**: ✅ ALL PASSED - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```
specs/004-cot-dataset-manager/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (데이터 스키마)
│   ├── cotqa.schema.md
│   ├── product.schema.md
│   ├── userAnon.schema.md
│   └── README.md
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code (repository root)

현재 프로젝트는 이미 구현된 상태이며, 다음 구조를 따릅니다:

```
src/
├── app/
│   ├── App.tsx              # 루트 애플리케이션 컴포넌트
│   └── router.tsx           # React Router 설정
├── components/
│   ├── AppWithTheme.tsx     # 테마 Provider 래퍼
│   ├── common/              # 공통 재사용 컴포넌트
│   │   ├── BulkImportDialog.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── EdgeResizer.tsx
│   │   ├── ExportDialog.tsx
│   │   ├── ResizableTextField.tsx
│   │   ├── StorageStatusCard.tsx
│   │   └── TextareaResizer.tsx
│   ├── cots/                # CoT 관련 컴포넌트
│   │   ├── CotFormPanel.tsx
│   │   ├── CotsStatsDialog.tsx
│   │   ├── ProductPanel.tsx
│   │   └── QuestionerPanel.tsx
│   ├── feedback/            # 오류 처리 컴포넌트
│   │   ├── ErrorBoundary.tsx
│   │   └── ErrorToast.tsx
│   ├── layout/              # 레이아웃 컴포넌트
│   │   ├── AppLayout.tsx
│   │   ├── Detail3Pane.tsx
│   │   └── ListLayout.tsx
│   ├── products/            # 상품 관련 컴포넌트
│   │   ├── ProductFormPanel.tsx
│   │   └── ProductSearchFilters.tsx
│   ├── selectors/           # 선택 다이얼로그
│   │   ├── ProductSelectorDialog.tsx
│   │   └── UserSelectorDialog.tsx
│   └── users/               # 질문자 관련 컴포넌트
│       ├── UserFormPanel.tsx
│       └── UserSearchFilters.tsx
├── forms/                   # 폼 훅 (deprecated, 현재 hooks/로 이동)
│   └── useCotForm.ts
├── hooks/                   # 커스텀 React 훅
│   ├── useCotForm.ts
│   ├── useProductForm.ts
│   ├── useResizablePanels.ts
│   ├── useTextareaHeights.ts
│   └── useUserForm.ts
├── main.tsx                 # 애플리케이션 진입점
├── models/                  # Zod 스키마 정의
│   ├── cotqa.ts
│   ├── product.ts
│   └── userAnon.ts
├── pages/                   # 페이지 컴포넌트
│   ├── cots/
│   │   ├── CotsDetailPage.tsx
│   │   └── CotsListPage.tsx
│   ├── products/
│   │   ├── ProductsDetailPage.tsx
│   │   └── ProductsListPage.tsx
│   ├── settings/
│   │   └── SettingsPage.tsx
│   ├── shared/
│   │   └── importExportActions.ts
│   └── users/
│       ├── UsersDetailPage.tsx
│       └── UsersListPage.tsx
├── services/                # 비즈니스 로직 서비스
│   ├── io/
│   │   ├── exporter.ts     # Export 로직
│   │   └── importer.ts     # Import 로직
│   ├── query/
│   │   ├── queryService.ts # 검색/필터링
│   │   └── search.ts       # 텍스트 검색
│   └── storage/
│       ├── indexedDbAdapter.ts  # IndexedDB 추상화
│       ├── storage.ts          # 스토리지 인터페이스
│       └── storageService.ts   # 스토리지 서비스
├── store/                   # Redux Toolkit 스토어
│   ├── index.ts            # 스토어 설정
│   ├── persistence/
│   │   └── settingsPersistence.ts
│   └── slices/
│       ├── cotsSlice.ts
│       ├── productsSlice.ts
│       ├── settingsSlice.ts
│       └── usersSlice.ts
├── styles/                  # 글로벌 스타일
│   ├── a11y.css
│   ├── globals.css
│   └── theme.ts
└── types/                   # TypeScript 타입 정의
    └── encoding-japanese.d.ts

tests/
├── contract/                # 계약 테스트 (Zod 스키마)
│   ├── export/
│   │   └── export_all.test.ts
│   ├── import/
│   │   ├── import_csv_json.test.ts
│   │   └── import_xlsx.test.ts
│   └── schemas/
│       ├── cotqa.schema.test.ts
│       ├── product.schema.test.ts
│       └── userAnon.schema.test.ts
└── integration/             # 통합 테스트 (User Story)
    ├── common/
    │   └── delete_confirm.test.tsx
    ├── cots/
    │   └── form_validation.test.tsx
    ├── datagrid/
    │   └── search_sort_paginate.test.tsx
    └── settings/
        └── persistence.test.tsx

public/
└── sample-data/             # 샘플 데이터 (개발/테스트용)
    ├── cots.csv
    ├── cots.json
    ├── products.csv
    ├── products.json
    ├── users.csv
    └── users.json
```

**Structure Decision**: 단일 웹 애플리케이션 (Frontend-only) 구조를 채택. 서버가 없으므로 backend/ 디렉토리는 불필요하며, 모든 로직이 브라우저 내에서 실행됩니다. 프로젝트는 이미 완전히 구현된 상태이므로 새로운 구조 설계는 불필요하고, 기존 구조를 유지합니다.

## Complexity Tracking

*Constitution Check passed - no violations to justify*

이 섹션은 비어 있습니다. 모든 Constitution 원칙이 충족되었으며 정당화가 필요한 위반 사항이 없습니다.
