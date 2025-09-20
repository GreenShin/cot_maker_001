# Tasks: 로컬 CoT 데이터셋 생성/관리 관리자 웹앱

**Input**: Design documents from `/specs/001-specify-llm-ai/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, storage, UI
   → Integration: wiring, accessibility, performance
   → Polish: docs, examples, seed
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Validate task completeness
7. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions (single project)
- Source: `src/`
- Tests: `tests/`

## Phase 3.1: Setup
- [ ] T001.1 Setup SQLite-WASM database schema and migration scripts in `src/services/storage/migrations/`
- [x] T001 Initialize Vite React TS project and base structure in `src/`, `tests/`
- [x] T002 Install dependencies in `package.json`: React Router, Redux Toolkit, React-Redux, React Hook Form, Zod, @mui/material, @mui/icons-material, @mui/x-data-grid, date-fns, papaparse, xlsx, @sqlite.org/sqlite-wasm, clsx, @types deps
- [x] T003 [P] Configure ESLint + Prettier + TypeScript strict settings in `/.eslintrc`, `/.prettierrc`, `tsconfig.json`
- [x] T004 [P] Configure Vitest + React Testing Library + Playwright in `vitest.config.ts`, `playwright.config.ts`
- [x] T005 Bootstrap app shell and routes in `src/app/App.tsx`, `src/app/router.tsx`, `src/main.tsx`
- [x] T006 Setup Redux store/slices scaffolding in `src/store/index.ts`, `src/store/slices/*`
- [x] T007 Create MUI theme and css variables in `src/styles/theme.ts`, `src/styles/cssVars.ts`

## Phase 3.2: Tests First (TDD)
- [ ] T008 [P] Zod schemas contract tests for entities in `tests/contract/schemas/userAnon.schema.test.ts`
- [ ] T009 [P] Zod schemas contract tests for products in `tests/contract/schemas/product.schema.test.ts`
- [ ] T010 [P] Zod schemas contract tests for CoTQA in `tests/contract/schemas/cotqa.schema.test.ts`
- [ ] T011 [P] Import pipeline contract test (CSV/JSON) with Papa Parse streaming in `tests/contract/import/import_csv_json.test.ts`
- [ ] T012 [P] Import pipeline contract test (XLSX) with SheetJS streaming in `tests/contract/import/import_xlsx.test.ts`
- [ ] T013 [P] Export pipeline contract test (CSV/JSON/XLSX) in `tests/contract/export/export_all.test.ts`
- [ ] T014 Integration test: Data Grid filtering/sorting/pagination responsiveness in `tests/integration/datagrid/search_sort_paginate.test.tsx`
- [ ] T015 Integration test: CoTs detail form validation (RHF+Zod) including dynamic CoTn in `tests/integration/cots/form_validation.test.tsx`
- [ ] T016 Integration test: Settings persistence to localStorage (theme, font size, toggles) in `tests/integration/settings/persistence.test.tsx`
- [ ] T017 Integration test: Delete confirmation modal behavior in `tests/integration/common/delete_confirm.test.tsx`

## Phase 3.3: Core Implementation
- [x] T018 [P] Define domain types and Zod schemas in `src/models/{userAnon,product,cotqa}.ts`
- [x] T019 [P] Storage abstraction interface and SQLite-WASM adapter in `src/services/storage/storage.ts`, `src/services/storage/sqliteAdapter.ts`
- [x] T020 Implement import/export services with streaming + SQLite-WASM integration in `src/services/io/{importer.ts, exporter.ts}`
- [x] T021 Query service with SQL-based search/sort/paginate utilities in `src/services/query/queryService.ts`
- [x] T022 Redux slices: `settingsSlice`, `cotsSlice`, `usersSlice`, `productsSlice` in `src/store/slices/*`
- [x] T023 Routes and pages skeleton: `CoTs`, `Settings`, `Users`, `Products` under `src/pages/*`
- [x] T024 Layout components: AppLayout, ListLayout, Detail3Pane in `src/components/layout/*`
- [x] T025 CoTs list page with MUI X Data Grid virtualization in `src/pages/cots/CotsListPage.tsx`
- [x] T026 CoTs detail page with 3-panels and dynamic CoTn in `src/pages/cots/CotsDetailPage.tsx`
- [x] T027 Users list/detail pages in `src/pages/users/{UsersListPage.tsx, UserDetailPage.tsx}`
- [x] T028 Products list/detail pages in `src/pages/products/{ProductsListPage.tsx, ProductDetailPage.tsx}`
- [x] T029 Settings page (author, toggles, font slider, theme mode) in `src/pages/settings/SettingsPage.tsx`
- [x] T030 Common components: SearchBar, Filters, ConfirmDialog in `src/components/common/*`
- [x] T031 Form hooks with RHF + Zod for CoTs in `src/forms/useCotForm.ts`

## Phase 3.4: Integration
- [x] T032 Wire import/export to lists (toolbar actions) in `src/pages/shared/importExportActions.ts`
- [x] T033 Enforce required fields and error toasts/snackbars in `src/components/feedback/*`
- [x] T034 Implement text search across question/CoT1~n/answer in `src/services/query/search.ts`
- [x] T035 Persist settings to OPFS + SQLite and hydrate on boot in `src/store/persistence/settingsPersistence.ts`
- [x] T036 Connect selection popups (users/products) with filters and accordion in `src/components/selectors/*`
- [x] T037 Accessibility pass: keyboard nav, focus ring, color contrast in `src/styles/a11y.css` and components
- [ ] T037.1 OPFS compatibility and fallback handling for unsupported browsers in `src/services/storage/opfsCompat.ts`

## Phase 3.5: Polish
- [x] T038 [P] Performance tuning: Data Grid rowBuffer/pageSize/overscan configs in `src/pages/*/*ListPage.tsx`
- [x] T039 [P] ErrorBoundary and fallback UIs in `src/components/feedback/ErrorBoundary.tsx`
- [x] T040 [P] Seed sample data and quick import scripts in `scripts/seed/` and docs
- [x] T041 Update `specs/001-specify-llm-ai/quickstart.md` with run/seed/import steps
- [x] T042 Update docs for schemas and import/export formats in `specs/001-specify-llm-ai/contracts/`

## Dependencies
- Tests (T008–T017) before implementation (T018–T031)
- T018 blocks T019–T021, T022
- T022 blocks pages using store
- T025–T029 depend on layout/components(T024) and store(T022)
- Integration (T032–T037) after core
- Polish (T038–T042) last; [P] tasks are independent files only

## Parallel Example
```
# Launch these in parallel after setup:
T008 Zod userAnon schema tests
T009 Zod product schema tests
T010 Zod CoTQA schema tests
T011 Import CSV/JSON contract test
```

## Validation Checklist
- [ ] All contracts have corresponding tests
- [ ] All entities have model tasks
- [ ] All tests come before implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
