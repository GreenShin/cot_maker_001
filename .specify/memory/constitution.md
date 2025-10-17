<!--
Sync Impact Report:
Version change: 0.0.0 → 1.0.0
Modified principles: N/A (initial adoption)
Added sections: Core Principles, Quality Standards, Development Workflow & Quality Gates, Governance
Removed sections: None
Templates requiring updates:
  ✅ .specify/templates/plan-template.md (footer version/path)
  ✅ .specify/templates/spec-template.md (no change required, aligned)
  ✅ .specify/templates/tasks-template.md (no change required, aligned)
  ✅ README.md (no change required, aligned)
Follow-up TODOs: None
-->

# CoT Maker Constitution

## Core Principles

### I. Code Quality First (NON-NEGOTIABLE)
코드는 최고 품질 기준을 충족해야 한다. 린터/포매터 경고는 허용되지 않으며,
함수·클래스는 단일 책임 원칙을 따른다. 명확한 네이밍과 필요 충분한 문서화를
반드시 제공하고, 불필요한 복잡성은 금지한다(YAGNI, KISS).

### II. Test Discipline & TDD (NON-NEGOTIABLE)
테스트 우선 원칙을 적용한다. 최소 커버리지 80%를 유지하며(Unit/Integration/E2E
균형), 플래키(비결정적) 테스트는 금지한다. Red-Green-Refactor 사이클을 따른다.

### III. UX Consistency for Local Admin Web App
관리자용 로컬 웹 앱은 일관된 디자인 시스템과 용어를 사용해야 한다. WCAG 2.1 AA
접근성을 준수하고, 반응형 레이아웃과 일관된 로딩/에러/성공 피드백을 제공한다.
핵심 사용자 흐름은 3클릭 이내로 완수 가능해야 한다(합리적 예외 문서화).

### IV. Local-first Developer Experience
로컬 실행은 단일 명령으로 가능해야 한다(예: `make dev` 또는 `npm run dev`).
개발 환경은 재현 가능해야 하며(Docker/Devcontainer 등 권장), 핫 리로드와
진단 로그가 기본 제공되어야 한다.

### V. Performance & Security Budgets
초기 로드(LCP) < 2.5s(개발/로컬 기준 합리적 범위), 상호작용 지연은 최소화한다.
의존성은 주기적으로 업데이트하고, 보안 스캔을 통과해야 한다. 민감정보는 로컬
환경에서도 안전하게 취급(.env, 비밀관리)한다.

## Quality Standards

### Code Quality Metrics
- 린팅/포매팅: ESLint/Prettier(웹) 또는 동급 도구 설정, 경고 0
- 복잡도: 함수 순환복잡도 10 이하 권장, 과다 분기 시 분리
- 중복: 의미 없는 코드 중복 5% 이하 유지
- 문서화: 공개 API/컴포넌트에 최소 사용 예시/설명 제공

### Testing Requirements
- 단위 테스트: 핵심 로직 전부 커버, 순수 함수 우선
- 통합 테스트: 계약/데이터 경계 검증, 주요 플로우 커버
- E2E: 관리자 핵심 시나리오 100% 커버(로그인, 설정 저장, 데이터 조회 등)
- 커버리지: 전체 80%+, 변경 파일 90%+ 권장
- CI: 테스트는 병렬 실행 가능, 실패 시 머지 차단

### UX Standards
- 디자인 시스템: 일관된 컴포넌트/토큰 사용(타이포·색상·간격)
- 접근성: WCAG 2.1 AA 목표, 자동 점검(axE 등) 통과, 키보드 내비게이션 가능
- 반응형: 모바일 ≥320px, 태블릿 ≥768px, 데스크톱 ≥1024px 기준
- 피드백: 로딩 스켈레톤/스피너, 에러 메시지 가이드, 성공 토스트 일관화

## Development Workflow & Quality Gates

### Code Review
- 최소 1인 이상의 승인 필요(자기 승인 금지)
- 리뷰 체크: 품질(린트/복잡도), 테스트(존재·의미), UX(일관성/접근성)

### Quality Gates (머지 전)
- 린트/타입 검사 0 경고
- 테스트 통과 및 커버리지 기준 충족
- 접근성 자동 점검 통과
- 성능 예산 위반 없음(주요 페이지 기준)
- 보안/의존성 스캔 통과

### Release & Environments
- 로컬=스테이징 설정과 가급적 동일한 구성(환경변수로 구분)
- 변경사항은 체인지로그에 기록(Conventional Commits 권장)

## Governance

이 헌법은 개발 전 과정에 우선한다. 위반 시 문서화된 예외와 만회 계획을 포함한
승인을 받아야 한다. 개정은 PR로 제안하고, 영향 분석·마이그레이션 계획을 포함
해야 한다.

Versioning Policy:
- MAJOR: 원칙 제거·재정의 등 하위호환 불가 변경
- MINOR: 원칙/섹션 추가 또는 실질적 가이드 확장
- PATCH: 표현 명확화, 오타 수정 등 비본질 변경

Compliance:
- 모든 PR은 본 헌법 준수 여부를 검증한다(Plan 템플릿의 Constitution Check 반영).
- 주기적(분기) 자체 감사로 지표·테스트·UX 기준 충족 여부를 점검한다.

**Version**: 1.0.0 | **Ratified**: 2025-09-20 | **Last Amended**: 2025-09-20