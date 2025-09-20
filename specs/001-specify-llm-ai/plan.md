
# Implementation Plan: 로컬 CoT 데이터셋 생성/관리 관리자 웹앱

**Branch**: `001-specify-llm-ai` | **Date**: 2025-09-20 | **Spec**: `/Volumes/Workspace/Projects/Outer/NIA/2025/cot_maker/008/cursor/specs/001-specify-llm-ai/spec.md`
**Input**: Feature specification from `/specs/001-specify-llm-ai/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
- **핵심 요구**: 로컬 PC에서 실행되는 관리자 웹앱으로 CoT 데이터셋을 생성/관리. 대용량(질문자 30만, 상품 1만, CoT 1만) 리스트에서 검색/정렬/페이징/Import/Export를 제공.
- **기술 접근**: React 19 + TypeScript + Vite. 라우팅은 React Router, 상태관리는 Redux Toolkit, 폼/검증은 React Hook Form + Zod, UI는 MUI v6(+ cssVariables) + MUI X Data Grid(가상 스크롤). CSV/JSON은 Papa Parse(Web Worker + streaming), XLSX는 SheetJS(Web Worker + streaming), 날짜는 date-fns. 대용량 표는 반드시 가상 스크롤 사용, 전행 렌더 금지.

- **네비게이션 레이아웃**: 좌측 고정 드로어를 기본으로 사용하며, 화면 공간 활용을 위해 접기/펼치기 가능한 미니 변형(collapsible mini-variant)을 적용한다. 접힘 상태에서는 아이콘만, 펼침 상태에서는 아이콘+라벨을 표시하고 토글 버튼으로 전환한다.

- **스코프 정합성(사양 대비)**
  - 메뉴: CoTs, 설정, 질문자 리스트, 상품 리스트(각 상세 포함)
  - CoTs 리스트: 텍스트·상품분류·질문유형·성별·연령 필터, 텍스트 검색 범위=질문/CoT1~n/답변
  - CoTs 상세: 3패널(왼쪽=질문자 검색/상세, 중앙=CoT 폼 CoT1~3 필수+CoTn 동적, 답변·상태·작성자 규칙, 오른쪽=상품 검색/다중선택/아코디언 상세)
  - 설정: 작성자 텍스트, 질문자/상품 수정가능 토글, 글꼴 크기 슬라이더, 라이트/다크 모드, 로컬 스토리지 저장·기본값 적용
  - 리스트 공통: CSV/JSON Import/Export, 검색/정렬/페이징, 삭제 확인 팝업, 필수값 유효성 검사
  - 데이터셋: 질문자/금융상품/CoT 엔티티 속성 및 옵션 종속성(상품출처↔질문유형) 반영

## Technical Context
**Language/Version**: TypeScript 5.x, React 19, Vite 5.x [NEEDS CLARIFICATION: 정확한 마이너 버전 고정]
**Primary Dependencies**: React Router, Redux Toolkit(+ React-Redux), React Hook Form, Zod, MUI v6(@mui/material, @mui/icons), MUI X Data Grid(@mui/x-data-grid), Papa Parse, SheetJS (xlsx), date-fns
**Storage**: 로컬 우선. [NEEDS CLARIFICATION: 저장소 선택 — IndexedDB(예: Dexie) vs SQLite WASM vs 파일 기반]
**Testing**: Vitest + React Testing Library + Playwright [제안]
**Target Platform**: 데스크톱 브라우저(Chromium/Edge/Chrome, Safari 최신), macOS/Windows 로컬 실행, 오프라인 가능
**Project Type**: single/web
**Performance Goals**:
- 초기 로드(개발/로컬 기준) 합리적 범위 내, 상호작용 p95 < 300ms [NEEDS CLARIFICATION]
- 데이터 그리드: 가상 스크롤 필수, 전행 렌더 금지, 페이징/서치/정렬 즉시 반응
**Constraints**:
- 오프라인 동작, 외부 전송 금지
- 수십만 행 처리 시 메모리/CPU 예산 준수(스트리밍 파싱 필수)
**Scale/Scope**:
- 질문자 300k, 상품 10k, CoT 10k. 메뉴 4개(CoTs/설정/질문자 리스트/상품 리스트), 각 상세 포함

## Constitution Check
- I. Code Quality First: 린트/포맷/명명 기준 준수 계획. PASS(도구 설정 필요)
- II. Test Discipline & TDD: Vitest/RTL/Playwright로 TDD 적용 계획. PASS(도구 확정 필요)
- III. UX Consistency: MUI 테마/토큰, 일관 용어 적용. PASS
- IV. Local-first DX: `npm run dev` 단일 명령, 핫 리로드. PASS
- V. Performance & Security Budgets: LCP/상호작용 지연 최소화, 의존성 스캔. PASS

[Notes]
- 저장소 선택/테스트 도구 버전 고정 등 일부는 NEEDS CLARIFICATION로 남아 Phase 0에서 해소

## Project Structure

### Documentation (this feature)
```
specs/001-specify-llm-ai/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── app/               # 라우팅/앱 셸
├── features/          # 도메인 단위(CoTs, 질문자, 상품, 설정)
├── components/        # 공용 UI 컴포넌트
├── store/             # Redux Toolkit store/slices
├── forms/             # RHF 폼 훅/스키마(Zod)
├── services/          # 데이터 서비스(저장소 추상화)
├── utils/             # 헬퍼(date-fns 등)
└── styles/            # MUI 테마/토큰(css variables)

tests/
├── unit/
├── integration/
└── e2e/
```

**Structure Decision**: DEFAULT Option 1(single project). 백엔드 없음, 로컬 저장소 사용.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context**
   - 저장소 선택: IndexedDB vs SQLite WASM vs 파일(성능/용량/트랜잭션) [NEEDS CLARIFICATION]
   - 페이지 크기/버퍼: Data Grid pageSize, rowBuffer, overscan 권장치 [NEEDS CLARIFICATION]
   - Import/Export 한도: 파일 크기/행 수/스트리밍 청크 크기 [NEEDS CLARIFICATION]
   - 접근성 기준: WCAG 2.1 AA 세부 적용 범위 [NEEDS CLARIFICATION]
   - 삭제 정책: 소프트 삭제 vs 영구 삭제 [NEEDS CLARIFICATION]
   - 날짜/로캘/타임존 표기 규칙 [NEEDS CLARIFICATION]
   - 정렬 기본값/다국어 여부/텍스트 최대 길이/CSV 구분자 [NEEDS CLARIFICATION]
2. **Research tasks** (예)
   - "로컬 대용량 CRUD를 위한 IndexedDB vs SQLite WASM 비교"
   - "Papa Parse/SheetJS 스트리밍+Web Worker 성능 베스트 프랙티스"
   - "MUI X Data Grid 가상 스크롤 튜닝(rowBuffer/columnBuffer/keepNonExistentRowsVisible)"
   - "WCAG 2.1 AA 체크리스트와 MUI 컴포넌트 적용"
3. **Consolidate findings** in `research.md`
   - Decision / Rationale / Alternatives

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Data model 설계** → `data-model.md`
   - 엔티티: 질문자, 금융상품, CoT질의응답
   - 필드/제약: 사양 요구사항 및 용어 표준 반영
   - 상태: CoT 상태 전이(초안)
2. **Contracts**
   - 로컬 저장소 경계 정의(스토리지 인터페이스), Import/Export 계약(JSON/CSV/XLSX 스키마)
   - UI 상호작용 계약(검색/정렬/페이징/가상 스크롤 매개변수)
   - `/contracts/`에 명세 문서화
3. **Contract tests**
   - 스키마 검증(Zod) 및 파서 동작 테스트(Vitest)
4. **Quickstart**
   - 의존성 설치, `npm run dev`, 데이터 시드/Import 샘플, 주요 플로우 검증 지침

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- `.specify/templates/tasks-template.md` 기반
- Phase 1 산출물(contracts, data model, quickstart)로부터 생성
- 각 계약 → 계약 테스트 [P]
- 각 엔티티 → 모델/검증 스키마 [P]
- 각 사용자 스토리 → 통합 테스트 시나리오
- 테스트를 통과시키기 위한 구현 태스크 생성

**Ordering Strategy**:
- TDD: 테스트 선행
- 의존성 순서: 모델 → 서비스 → UI
- [P] 표기는 병렬 가능 태스크

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (없음) | - | - |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [ ] Phase 0: Research complete (/plan command)
- [ ] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [ ] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*
