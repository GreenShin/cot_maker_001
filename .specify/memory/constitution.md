<!--
  Sync Impact Report:
  - Version change: [NEW CONSTITUTION] → 1.0.0
  - Modified principles: N/A (initial version)
  - Added sections: All (initial creation)
  - Removed sections: N/A
  - Templates requiring updates:
    ✅ plan-template.md - verified compatibility
    ✅ spec-template.md - verified compatibility
    ✅ tasks-template.md - verified compatibility
  - Follow-up TODOs: None
-->

# CoT 데이터셋 관리 웹앱 Constitution

## Core Principles

### I. 데이터 프라이버시 우선 (Data Privacy First)

**규칙**:
- 모든 데이터는 로컬 브라우저 내에서만 저장되어야 한다 (IndexedDB)
- 외부 네트워크로의 데이터 전송은 금지된다
- 익명화된 데이터만 취급하며, 개인 식별 정보(PII)는 저장하지 않는다
- Import/Export는 사용자가 명시적으로 선택한 파일에만 적용된다

**근거**: LLM 학습용 데이터셋은 민감한 금융 정보를 포함하므로, 데이터 유출 위험을 원천 차단하기 위해 로컬 우선 접근 방식이 필수적이다.

### II. 사용자 경험 우선 (User Experience First)

**규칙**:
- 모든 UI 컴포넌트는 WCAG 2.1 AA 접근성 기준을 준수해야 한다
- 키보드만으로 모든 기능에 접근 가능해야 한다
- 다크/라이트 모드를 완전히 지원해야 한다
- 사용자 설정(글꼴 크기, 패널 크기, 테마 등)은 자동으로 저장/복원되어야 한다
- 대용량 데이터(30만 질문자, 1만 상품, 1만 CoT) 처리 시에도 반응성을 유지해야 한다 (목표: p95 < 300ms)

**근거**: 관리자가 장시간 데이터를 입력/편집하는 도구이므로, 편의성과 접근성이 생산성에 직접적인 영향을 미친다.

### III. 성능 최적화 (Performance Optimization)

**규칙**:
- 대용량 리스트는 가상 스크롤(virtualization)을 사용해야 한다
- 검색/필터링은 디바운싱을 적용해야 한다
- IndexedDB 트랜잭션은 배치 처리(1000건 단위)로 최적화해야 한다
- Import/Export는 스트리밍 방식으로 처리하여 메모리 사용량을 제한해야 한다 (목표: < 500MB)
- 불필요한 리렌더링을 방지하기 위해 React.memo, useMemo, useCallback을 적절히 활용해야 한다

**근거**: 30만 행 이상의 데이터를 원활히 처리하려면 메모리와 성능 최적화가 필수적이다.

### IV. 계약 기반 개발 (Contract-Based Development)

**규칙**:
- 모든 데이터 모델은 Zod 스키마로 정의되어야 한다
- Import/Export 형식은 명확한 계약(contract)을 가져야 한다
- 필수 필드 누락, 타입 불일치, 사전정의 값 외 입력은 명확한 오류 메시지와 함께 거부되어야 한다
- 계약 변경 시 버전을 명시하고 이전 버전과의 호환성을 문서화해야 한다

**근거**: 다양한 형식의 데이터 Import/Export를 안정적으로 처리하려면 명확한 데이터 계약이 필수적이다.

### V. 테스트 가능성 (Testability)

**규칙**:
- 계약 테스트(Contract Tests)로 데이터 스키마 유효성을 검증해야 한다
- 통합 테스트(Integration Tests)로 사용자 시나리오를 검증해야 한다
- 복잡한 비즈니스 로직은 독립적인 서비스로 분리하여 테스트 가능하게 만들어야 한다
- 테스트는 실제 사용자 시나리오를 반영해야 한다

**근거**: 데이터 무결성이 중요한 프로젝트이므로, 자동화된 테스트로 품질을 보장해야 한다.

### VI. 단순성 유지 (Simplicity)

**규칙**:
- YAGNI(You Aren't Gonna Need It) 원칙을 따른다
- 명확한 폴더 구조를 유지한다: models, services, components, pages, store
- 한 파일은 하나의 책임만 가진다 (Single Responsibility Principle)
- 복잡도가 증가하는 변경은 명확한 정당화가 필요하다

**근거**: 로컬 실행 웹앱이므로 불필요한 추상화를 피하고 명확한 구조를 유지해야 유지보수가 용이하다.

### VII. 오프라인 우선 (Offline First)

**규칙**:
- 모든 기능은 네트워크 연결 없이 동작해야 한다
- 외부 CDN 의존성을 최소화해야 한다
- 에셋은 로컬에 번들링되어야 한다
- 브라우저 스토리지(IndexedDB, localStorage)만 사용해야 한다

**근거**: 로컬 PC에서 독립적으로 실행되는 것이 핵심 요구사항이므로, 네트워크 의존성을 제거해야 한다.

## 데이터 무결성 규칙

### 유효성 검사
- 모든 사용자 입력은 저장 전에 Zod 스키마로 검증되어야 한다
- 필수 필드 누락 시 저장을 차단하고 명확한 오류 메시지를 표시해야 한다
- 사전정의된 값(예: 상품분류, 질문유형)은 엄격히 검증되어야 한다

### Import/Export 정책
- Import 전 데이터 미리보기와 유효성 검사 결과를 제공해야 한다
- 유효하지 않은 행은 건너뛰고 상세 오류 리포트를 제공해야 한다
- Export는 UTF-8 인코딩을 사용하며, CSV는 EUC-KR 변환 옵션을 제공해야 한다

### 트랜잭션 무결성
- IndexedDB 트랜잭션은 원자성(atomicity)을 보장해야 한다
- 배치 처리 중 오류 발생 시 롤백 또는 부분 적용 정책을 명확히 해야 한다

## 개발 워크플로우

### 계획 및 명세
- 모든 기능은 `/specs/###-feature-name/` 디렉토리에 명세를 작성해야 한다
- 명세는 기술 구현이 아닌 사용자 가치에 집중해야 한다
- 불명확한 요구사항은 `[NEEDS CLARIFICATION]`로 표시하고 해결 후 진행해야 한다

### 코드 품질
- TypeScript strict 모드를 사용해야 한다
- ESLint 규칙을 준수해야 한다
- 코드 리뷰 시 Constitution 준수 여부를 확인해야 한다
- 복잡한 로직은 주석으로 의도를 명확히 해야 한다

### 버전 관리
- 데이터 스키마 변경은 MAJOR 버전 업데이트로 간주한다
- 새 기능 추가는 MINOR 버전 업데이트로 간주한다
- 버그 수정 및 개선은 PATCH 버전 업데이트로 간주한다

## Governance

### 헌법 우선 원칙
- 이 Constitution은 모든 개발 관행보다 우선한다
- Constitution 위반 시 명확한 정당화가 필요하며, 복잡도 추적 테이블에 기록해야 한다

### 개정 절차
- Constitution 개정은 문서화되어야 하며, 버전을 업데이트해야 한다
- 원칙 추가/제거는 MINOR 버전 업데이트로 간주한다
- 원칙의 근본적인 변경은 MAJOR 버전 업데이트로 간주한다
- 개정 시 영향받는 모든 템플릿과 가이드를 함께 업데이트해야 한다

### 컴플라이언스 검증
- 모든 PR/커밋은 Constitution 준수를 검증해야 한다
- `/speckit.checklist` 명령으로 준수 여부를 확인해야 한다
- Constitution 위반 시 구현을 중단하고 명세 단계로 돌아가야 한다

### 런타임 가이드
- `.specify/memory/constitution.md` (이 파일)은 프로젝트의 불변 원칙을 정의한다
- 구체적인 개발 가이드는 `/specs/###-feature-name/` 내 문서를 참조한다
- 명령어별 워크플로우는 `.cursor/commands/speckit.*.md`를 참조한다

**Version**: 1.0.0 | **Ratified**: 2025-10-17 | **Last Amended**: 2025-10-17
