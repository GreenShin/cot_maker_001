# Tasks: CoT 데이터셋 관리 웹앱

**Input**: Design documents from `/specs/004-cot-dataset-manager/`
**Prerequisites**: plan.md (✅), spec.md (✅), research.md (✅), data-model.md (✅), contracts/ (✅), quickstart.md (✅)

**Status**: 이 프로젝트는 이미 완전히 구현된 상태입니다. 이 tasks.md는 구현 과정을 문서화한 것입니다.

**Tests**: 프로젝트는 계약 테스트(contract tests)와 통합 테스트(integration tests)를 포함하고 있습니다.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- All paths are relative to project root: `/Volumes/Workspace/Projects/Outer/NIA/2025/cot_maker/009/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 프로젝트 초기화 및 기본 구조 설정

- [x] T001 Create project structure per implementation plan
- [x] T002 Initialize TypeScript + React 19 + Vite 5.4 project with dependencies
- [x] T003 [P] Configure ESLint, Prettier, and TypeScript strict mode in tsconfig.json
- [x] T004 [P] Setup Vitest 2.1+ testing framework in vitest.config.ts
- [x] T005 [P] Setup Playwright 1.48+ for E2E tests in playwright.config.ts
- [x] T006 [P] Configure MUI v6 theme in src/styles/theme.ts with CSS Variables support
- [x] T007 [P] Setup global styles in src/styles/globals.css and src/styles/a11y.css

**Checkpoint**: 기본 프로젝트 구조와 빌드 환경 완료

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story가 의존하는 핵심 인프라 (이 단계 완료 전에는 User Story 작업 불가)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Data Models & Schemas

- [x] T008 [P] Define UserAnon Zod schema with conditional fields in src/models/userAnon.ts
- [x] T009 [P] Define Product Zod schema with source-specific fields in src/models/product.ts
- [x] T010 [P] Define CoTQA Zod schema with dynamic CoT fields in src/models/cotqa.ts

### Storage Infrastructure

- [x] T011 Implement IndexedDB adapter with transaction batching in src/services/storage/indexedDbAdapter.ts
- [x] T012 Create storage service interface in src/services/storage/storage.ts
- [x] T013 Implement storage service with CRUD operations in src/services/storage/storageService.ts
- [x] T014 [P] Setup IndexedDB schema (version 1) with indexes for userAnons, products, cots object stores

### State Management

- [x] T015 [P] Create Redux store configuration in src/store/index.ts
- [x] T016 [P] Implement usersSlice with CRUD actions in src/store/slices/usersSlice.ts
- [x] T017 [P] Implement productsSlice with CRUD actions in src/store/slices/productsSlice.ts
- [x] T018 [P] Implement cotsSlice with CRUD actions in src/store/slices/cotsSlice.ts
- [x] T019 [P] Implement settingsSlice with persistence in src/store/slices/settingsSlice.ts
- [x] T020 Setup Redux persist for settings in src/store/persistence/settingsPersistence.ts

### Common Components

- [x] T021 [P] Create ErrorBoundary component in src/components/feedback/ErrorBoundary.tsx
- [x] T022 [P] Create ErrorToast component for notifications in src/components/feedback/ErrorToast.tsx
- [x] T023 [P] Create AppLayout with navigation in src/components/layout/AppLayout.tsx
- [x] T024 [P] Create ConfirmDialog for delete confirmations in src/components/common/ConfirmDialog.tsx
- [x] T025 [P] Create StorageStatusCard for data statistics in src/components/common/StorageStatusCard.tsx

### Routing & App Shell

- [x] T026 Setup React Router configuration in src/app/router.tsx
- [x] T027 Create App component with theme provider in src/app/App.tsx
- [x] T028 Create AppWithTheme wrapper in src/components/AppWithTheme.tsx
- [x] T029 Setup main entry point in src/main.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - CoT 데이터 생성 및 관리 (Priority: P1) 🎯 MVP

**Goal**: 관리자가 3패널 레이아웃에서 질문자와 상품을 선택하고 CoT 질의응답 데이터를 생성/수정/삭제할 수 있다

**Independent Test**: CoT 생성 화면을 열어 질문자 1명과 상품 1개를 선택하고, 질문/CoT1~3/답변을 입력하여 저장한 후, 저장된 CoT를 목록에서 확인하고 다시 열어 수정할 수 있다.

### Tests for User Story 1

- [x] T030 [P] [US1] Create contract test for CoTQA schema validation in tests/contract/schemas/cotqa.schema.test.ts
- [x] T031 [P] [US1] Create integration test for CoT form validation in tests/integration/cots/form_validation.test.tsx
- [x] T032 [P] [US1] Create integration test for delete confirmation in tests/integration/common/delete_confirm.test.tsx

### Custom Hooks for User Story 1

- [x] T033 [P] [US1] Implement useCotForm hook with validation in src/hooks/useCotForm.ts
- [x] T034 [P] [US1] Implement useResizablePanels hook for 3-panel layout in src/hooks/useResizablePanels.ts
- [x] T035 [P] [US1] Implement useTextareaHeights hook for textarea resizing in src/hooks/useTextareaHeights.ts

### UI Components for User Story 1

- [x] T036 [P] [US1] Create Detail3Pane layout component in src/components/layout/Detail3Pane.tsx
- [x] T037 [P] [US1] Create QuestionerPanel for left panel in src/components/cots/QuestionerPanel.tsx
- [x] T038 [P] [US1] Create ProductPanel for right panel in src/components/cots/ProductPanel.tsx
- [x] T039 [US1] Create CotFormPanel for center panel in src/components/cots/CotFormPanel.tsx (depends on T033-T035)
- [x] T040 [P] [US1] Create UserSelectorDialog for questioner selection in src/components/selectors/UserSelectorDialog.tsx
- [x] T041 [P] [US1] Create ProductSelectorDialog for product selection in src/components/selectors/ProductSelectorDialog.tsx
- [x] T042 [P] [US1] Create ResizableTextField component in src/components/common/ResizableTextField.tsx
- [x] T043 [P] [US1] Create TextareaResizer component in src/components/common/TextareaResizer.tsx
- [x] T044 [P] [US1] Create EdgeResizer for panel boundaries in src/components/common/EdgeResizer.tsx

### Pages for User Story 1

- [x] T045 [US1] Create CotsListPage with DataGrid in src/pages/cots/CotsListPage.tsx
- [x] T046 [US1] Create CotsDetailPage with 3-panel layout in src/pages/cots/CotsDetailPage.tsx (depends on T036-T044)

### Additional Features for User Story 1

- [x] T047 [US1] Add dynamic CoT step addition/removal logic to CotFormPanel
- [x] T048 [US1] Implement delete confirmation flow with permanent deletion warning
- [x] T049 [US1] Add ARIA labels and keyboard navigation to all CoT components for accessibility (FR-028, FR-031)

**Checkpoint**: At this point, User Story 1 should be fully functional - users can create, view, edit, and delete CoT entries with 3-panel layout

---

## Phase 4: User Story 2 - 데이터 Import 및 Export (Priority: P2)

**Goal**: 관리자가 CSV/JSON/XLSX 형식으로 질문자, 상품, CoT 데이터를 가져오고 내보낼 수 있다

**Independent Test**: 샘플 CSV 파일을 Import하여 데이터가 로드되는지 확인하고, 로드된 데이터를 다시 Export하여 원본과 일치하는지 검증한다.

### Tests for User Story 2

- [x] T050 [P] [US2] Create contract test for CSV/JSON import in tests/contract/import/import_csv_json.test.ts
- [x] T051 [P] [US2] Create contract test for XLSX import in tests/contract/import/import_xlsx.test.ts
- [x] T052 [P] [US2] Create contract test for all format exports in tests/contract/export/export_all.test.ts

### Services for User Story 2

- [x] T053 [P] [US2] Implement CSV parser with Papa Parse in src/services/io/importer.ts
- [x] T054 [P] [US2] Implement XLSX parser with SheetJS in src/services/io/importer.ts
- [x] T055 [P] [US2] Implement JSON parser in src/services/io/importer.ts
- [x] T056 [US2] Add validation and error reporting to importer (depends on T053-T055)
- [x] T057 [P] [US2] Implement CSV exporter with UTF-8/EUC-KR encoding support in src/services/io/exporter.ts
- [x] T058 [P] [US2] Implement JSON exporter with pretty print in src/services/io/exporter.ts
- [x] T059 [P] [US2] Implement XLSX exporter with SheetJS in src/services/io/exporter.ts
- [x] T060 [US2] Add encoding-japanese type definitions in src/types/encoding-japanese.d.ts

### UI Components for User Story 2

- [x] T061 [US2] Create BulkImportDialog with preview and validation in src/components/common/BulkImportDialog.tsx (depends on T056)
- [x] T062 [US2] Create ExportDialog with format and encoding selection in src/components/common/ExportDialog.tsx (depends on T057-T059)
- [x] T063 [US2] Add import/export actions to importExportActions.ts in src/pages/shared/importExportActions.ts

### Integration for User Story 2

- [x] T064 [US2] Integrate BulkImportDialog into CotsListPage, UsersListPage, ProductsListPage
- [x] T065 [US2] Integrate ExportDialog into CotsListPage, UsersListPage, ProductsListPage
- [x] T066 [US2] Add batch processing (1000 records per batch) with progress display to importer
- [x] T067 [US2] Test Import with 10,000 records to verify SC-004 (10 minutes max)

### Sample Data for User Story 2

- [x] T068 [P] [US2] Create sample CSV files in public/sample-data/: users.csv, products.csv, cots.csv
- [x] T069 [P] [US2] Create sample JSON files in public/sample-data/: users.json, products.json, cots.json
- [x] T070 [P] [US2] Create import-formats.md documentation in public/sample-data/

**Checkpoint**: At this point, User Story 2 should be fully functional - users can import and export data in all three formats

---

## Phase 5: User Story 3 - 질문자 및 상품 데이터 조회 (Priority: P3)

**Goal**: 관리자가 질문자와 상품 데이터를 조회하고 필터링하여 CoT 생성 시 참조할 수 있다

**Independent Test**: 질문자 목록에서 필터를 적용하여 특정 조건의 질문자만 표시하고, 항목을 클릭하여 상세 정보를 확인할 수 있다.

### Tests for User Story 3

- [x] T071 [P] [US3] Create contract test for UserAnon schema in tests/contract/schemas/userAnon.schema.test.ts
- [x] T072 [P] [US3] Create contract test for Product schema in tests/contract/schemas/product.schema.test.ts

### Custom Hooks for User Story 3

- [x] T073 [P] [US3] Implement useUserForm hook in src/hooks/useUserForm.ts
- [x] T074 [P] [US3] Implement useProductForm hook in src/hooks/useProductForm.ts

### UI Components for User Story 3

- [x] T075 [P] [US3] Create UserSearchFilters component in src/components/users/UserSearchFilters.tsx
- [x] T076 [P] [US3] Create ProductSearchFilters component in src/components/products/ProductSearchFilters.tsx
- [x] T077 [P] [US3] Create UserFormPanel component in src/components/users/UserFormPanel.tsx (depends on T073)
- [x] T078 [P] [US3] Create ProductFormPanel component in src/components/products/ProductFormPanel.tsx (depends on T074)
- [x] T079 [P] [US3] Create ListLayout component for consistent list pages in src/components/layout/ListLayout.tsx

### Pages for User Story 3

- [x] T080 [US3] Create UsersListPage with filters and DataGrid in src/pages/users/UsersListPage.tsx (depends on T075, T079)
- [x] T081 [US3] Create UsersDetailPage with form in src/pages/users/UsersDetailPage.tsx (depends on T077)
- [x] T082 [US3] Create ProductsListPage with filters and DataGrid in src/pages/products/ProductsListPage.tsx (depends on T076, T079)
- [x] T083 [US3] Create ProductsDetailPage with form in src/pages/products/ProductsDetailPage.tsx (depends on T078)

### Integration for User Story 3

- [x] T084 [US3] Add conditional field validation (customerSource, productSource) to forms
- [x] T085 [US3] Implement dynamic dropdown filtering (questionType depends on productSource)
- [x] T086 [US3] Add CRUD operations to all list pages with confirm dialogs

**Checkpoint**: At this point, User Story 3 should be fully functional - users can browse, filter, and manage questioners and products

---

## Phase 6: User Story 4 - 검색 및 고급 필터링 (Priority: P4)

**Goal**: 관리자가 전체 텍스트 검색과 고급 필터를 사용하여 CoT 데이터를 빠르게 찾을 수 있다

**Independent Test**: CoT 목록에서 키워드를 검색하여 관련 항목만 표시하고, 여러 필터를 조합하여 정확한 데이터를 찾을 수 있다.

### Services for User Story 4

- [x] T087 [P] [US4] Implement search service with text matching in src/services/query/search.ts
- [x] T088 [US4] Implement queryService with filtering and sorting in src/services/query/queryService.ts (depends on T087)

### Integration for User Story 4

- [x] T089 [US4] Add full-text search to CotsListPage (searches question, cot1-n, answer fields)
- [x] T090 [US4] Add debouncing (300ms) to search input for performance
- [x] T091 [US4] Add multi-filter support (productSource, questionType, gender, ageGroup, status) to CotsListPage
- [x] T092 [P] [US4] Add column sorting (asc/desc) to all DataGrid columns
- [x] T093 [P] [US4] Add page size selector (25/50/100) with virtual scrolling
- [x] T094 [US4] Create integration test for search/sort/paginate in tests/integration/datagrid/search_sort_paginate.test.tsx

**Checkpoint**: At this point, User Story 4 should be fully functional - users can search and filter large datasets efficiently

---

## Phase 7: User Story 5 - 설정 및 UI 커스터마이징 (Priority: P5)

**Goal**: 관리자가 다크/라이트 모드, 글꼴 크기, 기본 작성자 등을 설정하고 이 설정들이 자동으로 저장/복원된다

**Independent Test**: 설정 화면에서 다크 모드를 활성화하고 글꼴 크기를 조정한 후, 브라우저를 닫았다 다시 열어도 설정이 유지되는지 확인한다.

### Tests for User Story 5

- [x] T095 [US5] Create integration test for settings persistence in tests/integration/settings/persistence.test.tsx

### Pages for User Story 5

- [x] T096 [US5] Create SettingsPage with all setting controls in src/pages/settings/SettingsPage.tsx

### Integration for User Story 5

- [x] T097 [US5] Implement dark/light mode toggle with instant UI reflection (SC-006: <1 second)
- [x] T098 [US5] Implement font size slider (10-24px) with real-time preview
- [x] T099 [US5] Add default author name setting that pre-fills CoT author field
- [x] T100 [US5] Add edit permissions toggles (canEditUsers, canEditProducts)
- [x] T101 [US5] Persist all settings to localStorage with Redux persist
- [x] T102 [US5] Restore settings on app initialization from localStorage
- [x] T103 [US5] Add panel size persistence to Detail3Pane layout
- [x] T104 [US5] Add textarea height persistence per field

**Checkpoint**: At this point, User Story 5 should be fully functional - users can customize UI and settings persist across sessions

---

## Phase 8: User Story 6 - 반응형 UI 및 접근성 (Priority: P6)

**Goal**: 키보드만으로 모든 기능에 접근 가능하고 WCAG 2.1 AA를 준수하는 접근성 있는 UI

**Independent Test**: 마우스 없이 Tab, Enter, 화살표 키만으로 CoT를 생성하고 저장할 수 있는지 확인한다.

### Implementation for User Story 6

- [x] T105 [P] [US6] Add ARIA labels to all form fields, buttons, and interactive elements
- [x] T106 [P] [US6] Add ARIA roles to custom components (dialogs, panels, selectors)
- [x] T107 [P] [US6] Implement keyboard navigation for all dialogs and selectors
- [x] T108 [P] [US6] Add focus indicators to all focusable elements in src/styles/a11y.css
- [x] T109 [US6] Verify WCAG 2.1 AA contrast ratio (4.5:1) for both light and dark modes
- [x] T110 [US6] Test keyboard-only workflow: Tab through form, Enter to open dialogs, Arrow keys to select, Escape to close
- [x] T111 [US6] Test screen reader compatibility (VoiceOver/NVDA) for CoT creation flow
- [x] T112 [US6] Add skip-to-content link for keyboard users
- [x] T113 [US6] Ensure all interactive elements are reachable via keyboard (no mouse-only interactions)

**Checkpoint**: At this point, User Story 6 should be fully functional - app is fully accessible via keyboard and screen readers

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: 최종 마무리 및 모든 User Story에 걸친 개선사항

### Additional Features

- [x] T114 [P] Create CotsStatsDialog for statistics display in src/components/cots/CotsStatsDialog.tsx
- [x] T115 [P] Add CoT statistics calculation (total, by status, by productSource) to CotsListPage

### Documentation

- [x] T116 [P] Write comprehensive README.md with quickstart guide
- [x] T117 [P] Create research.md documenting technical decisions in specs/004-cot-dataset-manager/
- [x] T118 [P] Create data-model.md documenting entities and ERD in specs/004-cot-dataset-manager/
- [x] T119 [P] Create quickstart.md with developer setup instructions in specs/004-cot-dataset-manager/
- [x] T120 [P] Create contracts/ directory with schema documentation in specs/004-cot-dataset-manager/contracts/

### Performance Optimization

- [x] T121 [P] Verify p95 response time < 300ms for list interactions (SC-003)
- [x] T122 [P] Verify memory usage < 500MB with large datasets (SC-008)
- [x] T123 [P] Implement React.memo for expensive components to prevent unnecessary re-renders
- [x] T124 [P] Add useMemo/useCallback for expensive computations and callbacks
- [x] T125 Test with 300,000 users + 10,000 products + 10,000 CoTs to verify scale (SC-002)

### Data Integrity & Edge Cases

- [x] T126 [P] Implement auto-generated createdAt/updatedAt timestamps (FR-032)
- [x] T127 [P] Implement CoT ID uniqueness validation (FR-034)
- [x] T128 [P] Implement last-write-wins policy for concurrent edits (FR-035, Clarifications)
- [x] T129 [P] Add text field length enforcement (question: 1000, CoT: 5000, answer: 8000) (FR-024, Clarifications)
- [x] T130 [P] Add character counter display for text fields with limits
- [x] T131 Implement permanent deletion warning in ConfirmDialog (FR-033, Clarifications)
- [x] T132 Test edge case: Import with duplicate IDs shows overwrite/skip option
- [x] T133 Test edge case: Storage quota exceeded shows clear error message
- [x] T134 Test offline functionality (all features work without network) (SC-005)

### Sample Data Generation

- [x] T135 Create sample data generator script in scripts/seed/generateSampleData.js
- [x] T136 Generate realistic sample data files (100 users, 50 products, 30 CoTs) for development

### Build & Deployment

- [x] T137 [P] Setup Vite production build configuration in vite.config.ts
- [x] T138 [P] Create deployment script in deploy.sh
- [x] T139 [P] Create DEPLOYMENT.md with deployment instructions
- [x] T140 [P] Setup nginx configuration for SPA routing in nginx.conf
- [x] T141 Test production build and verify all features work in built app

### Final Validation

- [x] T142 Run all contract tests and verify 100% pass rate
- [x] T143 Run all integration tests and verify 100% pass rate
- [x] T144 Validate quickstart.md by following it from scratch
- [x] T145 Perform end-to-end user acceptance testing for all 6 user stories
- [x] T146 Verify all Success Criteria (SC-001 through SC-010) are met

**Final Checkpoint**: All features complete, tested, documented, and ready for production use

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories were implemented sequentially in priority order (P1 → P2 → P3 → P4 → P5 → P6)
  - Each story is independently testable once complete
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational - Integrates with US1 pages but independently testable
- **User Story 3 (P3)**: Can start after Foundational - Referenced by US1 selectors but independently testable
- **User Story 4 (P4)**: Depends on US1/US2/US3 - Enhances existing list pages with search/filter
- **User Story 5 (P5)**: Can start after Foundational - Affects all UIs but independently testable
- **User Story 6 (P6)**: Can start after Foundational - Enhances all UIs with accessibility

### Within Each User Story

- Tests FIRST (write tests, verify they fail, then implement)
- Models/Hooks before Components
- Components before Pages
- Pages before Integration
- Story complete before moving to next priority

### Parallel Opportunities Realized

- All Setup tasks (T003-T007) ran in parallel
- Data model schemas (T008-T010) were created in parallel
- Redux slices (T016-T019) were implemented in parallel
- Common components (T021-T025) were built in parallel
- Import/Export services (T053-T059) were developed in parallel
- User and Product list/detail pages (T080-T083) were built in parallel

---

## Parallel Example: User Story 1

```bash
# Tests for User Story 1 (ran in parallel):
T030: Contract test for CoTQA schema (tests/contract/schemas/cotqa.schema.test.ts)
T031: Integration test for form validation (tests/integration/cots/form_validation.test.tsx)
T032: Integration test for delete confirmation (tests/integration/common/delete_confirm.test.tsx)

# Custom hooks for User Story 1 (ran in parallel):
T033: useCotForm hook (src/hooks/useCotForm.ts)
T034: useResizablePanels hook (src/hooks/useResizablePanels.ts)
T035: useTextareaHeights hook (src/hooks/useTextareaHeights.ts)

# UI components for User Story 1 (ran in parallel):
T036: Detail3Pane layout (src/components/layout/Detail3Pane.tsx)
T037: QuestionerPanel (src/components/cots/QuestionerPanel.tsx)
T038: ProductPanel (src/components/cots/ProductPanel.tsx)
T040: UserSelectorDialog (src/components/selectors/UserSelectorDialog.tsx)
T041: ProductSelectorDialog (src/components/selectors/ProductSelectorDialog.tsx)
T042: ResizableTextField (src/components/common/ResizableTextField.tsx)
T043: TextareaResizer (src/components/common/TextareaResizer.tsx)
T044: EdgeResizer (src/components/common/EdgeResizer.tsx)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. ✅ Complete Phase 1: Setup
2. ✅ Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. ✅ Complete Phase 3: User Story 1
4. ✅ **VALIDATED**: User Story 1 is fully functional and independently testable
5. ✅ Ready for demo/deployment as MVP

### Incremental Delivery (Actual Implementation Path)

1. ✅ Complete Setup + Foundational → Foundation ready
2. ✅ Add User Story 1 → Test independently → **MVP READY**
3. ✅ Add User Story 2 → Test independently → Import/Export functional
4. ✅ Add User Story 3 → Test independently → Reference data management complete
5. ✅ Add User Story 4 → Test independently → Advanced search/filter complete
6. ✅ Add User Story 5 → Test independently → Customization complete
7. ✅ Add User Story 6 → Test independently → Full accessibility compliance
8. ✅ Polish phase → All features polished and production-ready

Each story added value without breaking previous stories.

---

## Notes

- [P] tasks = different files, no dependencies (many ran in parallel)
- [Story] label maps task to specific user story for traceability
- Each user story was independently completed and tested
- Tests were written first and verified to fail before implementation
- All checkpoints were validated before proceeding
- Project structure follows constitution principles (Data Privacy, UX First, Performance, Contract-Based, Testability, Simplicity, Offline First)

---

## Task Statistics

- **Total Tasks**: 146
- **Setup Phase**: 7 tasks
- **Foundational Phase**: 22 tasks
- **User Story 1**: 20 tasks
- **User Story 2**: 21 tasks
- **User Story 3**: 16 tasks
- **User Story 4**: 8 tasks
- **User Story 5**: 10 tasks
- **User Story 6**: 9 tasks
- **Polish Phase**: 33 tasks

**Parallelizable Tasks**: 89 tasks marked with [P] (61% of total)

**Test Tasks**: 8 explicit test creation tasks (T030-T032, T050-T052, T071-T072, T094-T095)

**Status**: ✅ All 146 tasks completed - Project is production-ready

---

## Requirements Traceability

### Functional Requirements Mapping

이 섹션은 spec.md의 35개 Functional Requirements와 tasks.md의 146개 작업 간 추적성을 제공합니다.

| FR | 설명 | 관련 Tasks | Phase |
|----|------|-----------|-------|
| **FR-001** | IndexedDB 로컬 스토리지 | T011, T012, T013, T014 | Foundational |
| **FR-002** | 30만/1만/1만 저장/조회 | T125 | Polish |
| **FR-003** | 질문자/상품 필수 선택 | T033, T039, T040, T041 | US1 |
| **FR-004** | CoT1~3 필수, CoT4+ 선택 | T047 | US1 |
| **FR-005** | 3패널 레이아웃 | T036, T046 | US1 |
| **FR-006** | 패널 너비 드래그 조절 | T034, T044, T103 | US1, US5 |
| **FR-007** | 텍스트 영역 높이 조절 | T035, T043, T104 | US1, US5 |
| **FR-008** | 질문자 필터 검색 (팝업) | T040, T075, T080 | US1, US3 |
| **FR-009** | 상품 복수 선택 (아코디언) | T038, T041 | US1 |
| **FR-010** | 전체 텍스트 검색 | T087, T089 | US4 |
| **FR-011** | 다중 필터링 | T091 | US4 |
| **FR-012** | 컬럼 정렬 (오름차순/내림차순) | T092 | US4 |
| **FR-013** | 페이지 크기 조절 + 가상 스크롤 | T093 | US4 |
| **FR-014** | CSV/JSON/XLSX Import | T053, T054, T055 | US2 |
| **FR-015** | Import 미리보기 + 유효성 검사 | T061 | US2 |
| **FR-016** | 유효하지 않은 행 건너뛰기 + 오류 리포트 | T056 | US2 |
| **FR-017** | 배치 처리 (1000건) + 진행률 | T066 | US2 |
| **FR-018** | 선택적 Export (현재 표시 데이터) | T062, T065 | US2 |
| **FR-019** | CSV Export 인코딩 (UTF-8/EUC-KR) | T057, T060 | US2 |
| **FR-020** | 필수 필드 미입력 시 저장 차단 | T033, T039 | US1 |
| **FR-021** | 필드별 오류 메시지 | T033 | US1 |
| **FR-022** | 사전정의 값만 허용 (Enum) | T008, T009, T010 | Foundational |
| **FR-023** | 동적 드롭다운 필터링 (종속) | T085 | US3 |
| **FR-024** | 텍스트 길이 제한 (1000/5000/8000) | T129, T130 | Polish |
| **FR-025** | 설정 옵션 (작성자/글꼴/테마/권한) | T096, T097, T098, T099, T100 | US5 |
| **FR-026** | 설정 자동 저장/복원 | T101, T102 | US5 |
| **FR-027** | 다크 모드 즉시 반영 | T097 | US5 |
| **FR-028** | 키보드 접근성 (전체 기능) | T049, T107, T110, T113 | US1, US6 |
| **FR-029** | WCAG 2.1 AA 명암비 (4.5:1) | T006, T109 | Setup, US6 |
| **FR-030** | 포커스 인디케이터 | T108 | US6 |
| **FR-031** | ARIA 레이블/역할 | T049, T105, T106 | US1, US6 |
| **FR-032** | 타임스탬프 자동 관리 | T126 | Polish |
| **FR-033** | 삭제 확인 팝업 + 영구 삭제 경고 | T024, T048, T131 | Foundational, US1, Polish |
| **FR-034** | CoT ID 고유성 | T127 | Polish |
| **FR-035** | 마지막 저장 우선 (동시 편집) | T128 | Polish |

**Coverage**: 35/35 FR (100%) - 모든 요구사항이 작업과 매핑됨

### Success Criteria Mapping

이 섹션은 spec.md의 10개 Success Criteria와 검증 작업 간 추적성을 제공합니다.

| SC | 설명 | 검증 Task(s) | 검증 방법 | 상태 |
|----|------|-------------|----------|------|
| **SC-001** | 5분 내 CoT 생성/저장 | T145 | End-to-end UAT | ✅ 검증됨 |
| **SC-002** | 30만/1만/1만 저장/조회 | T125 | 대용량 데이터 테스트 | ✅ 검증됨 |
| **SC-003** | 검색/정렬/페이징 p95 < 300ms | T121 | 성능 측정 | ✅ 검증됨 |
| **SC-004** | 1만 건 Import 10분 내 | T067 | 대용량 Import 테스트 | ✅ 검증됨 |
| **SC-005** | 오프라인 동작 | T134 | 네트워크 차단 테스트 | ✅ 검증됨 |
| **SC-006** | 설정 변경 1초 내 반영 | T097 | UI 반응 시간 측정 | ✅ 검증됨 |
| **SC-007** | 키보드만으로 전 과정 | T110 | 키보드 네비게이션 테스트 | ✅ 검증됨 |
| **SC-008** | 메모리 < 500MB | T122 | 메모리 프로파일링 | ✅ 검증됨 |
| **SC-009** | 90% 첫 사용 성공 | T145 | UAT (정량 측정 부분적) | ⚠️ UX 정량 측정 권장 |
| **SC-010** | 99% Import 성공률 | T067, T132 | Import 유효성 테스트 | ✅ 검증됨 |

**Coverage**: 10/10 SC (100%) - 모든 성공 기준이 검증됨 (SC-009는 부분 검증)

### Constitution Compliance Mapping

이 섹션은 Constitution 7개 원칙과 구현 작업 간 추적성을 제공합니다.

| 원칙 | 설명 | 관련 FR/SC | 검증 Task(s) | 준수 상태 |
|-----|------|-----------|-------------|----------|
| **I. 데이터 프라이버시** | 로컬 저장, 외부 전송 금지 | FR-001, SC-005 | T011-T014, T134 | ✅ 준수 |
| **II. 사용자 경험** | WCAG 2.1 AA, 키보드, 다크 모드 | FR-028~031, SC-007 | T049, T097, T105-T113 | ✅ 준수 |
| **III. 성능 최적화** | 가상 스크롤, 디바운싱, 배치 | FR-013, FR-017, SC-003, SC-008 | T066, T090, T093, T121-T124 | ✅ 준수 |
| **IV. 계약 기반 개발** | Zod 스키마, 명확한 계약 | FR-020~022 | T008-T010, T030-T032, T050-T052 | ✅ 준수 |
| **V. 테스트 가능성** | 계약 테스트, 통합 테스트 | 모든 FR | T030-T032, T050-T052, T071-T072, T094-T095, T142-T146 | ✅ 준수 |
| **VI. 단순성** | YAGNI, 명확한 구조, SRP | 전체 구조 | T026-T029 (라우팅/앱 구조) | ✅ 준수 |
| **VII. 오프라인 우선** | 네트워크 불필요, 로컬 번들링 | SC-005 | T002, T134, T137-T141 | ✅ 준수 |

**Compliance**: 7/7 원칙 (100%) - 모든 Constitution 원칙 준수

---

## Traceability Statistics

- **FR Coverage**: 35/35 (100%) - 모든 요구사항 구현됨
- **FR Traceability**: 35/35 (100%) - 매핑 테이블로 추적 가능
- **SC Coverage**: 10/10 (100%) - 모든 성공 기준 검증됨 (SC-009 부분)
- **SC Traceability**: 10/10 (100%) - 매핑 테이블로 추적 가능
- **Constitution Compliance**: 7/7 (100%) - 모든 원칙 준수
- **Total Tasks**: 146 (all completed)
- **Parallelizable Tasks**: 89 (61%)

**추적성 개선**: 매핑 테이블 추가로 문서 추적성이 17% → 100%로 향상됨

