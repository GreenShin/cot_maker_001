# Data Contract Quality Checklist: CoT 데이터셋 관리 웹앱

**Purpose**: 데이터 계약(Import/Export + 스키마) 명세의 품질 검증 - 파일 형식, 유효성 검사, 오류 처리, 스키마 일관성
**Created**: 2025-10-18
**Feature**: [spec.md](../spec.md) | [data-model.md](../data-model.md) | [contracts/](../contracts/)
**Focus**: 데이터 계약 (Import/Export + Schema + Validation)
**Depth**: Standard (40-60 items)
**Priority**: Exception/Error Flows (오류 처리 명세 우선)

**Note**: 이 체크리스트는 **데이터 계약 요구사항 자체**의 품질을 검증합니다. 구현이 아닌 "명세가 명확하게 작성되었는가?"를 검증합니다.

---

## Import Format Requirements

### CSV Format Specification
- [ ] CHK001 - CSV 인코딩 요구사항(UTF-8/EUC-KR)이 명확히 정의되어 있는가? [Clarity, Spec §FR-019]
- [ ] CHK002 - CSV 헤더 행 필수 여부가 명시되어 있는가? [Completeness, Contracts §README]
- [ ] CHK003 - CSV 구분자(쉼표, 세미콜론 등) 요구사항이 정의되어 있는가? [Gap]
- [ ] CHK004 - CSV 따옴표 처리 규칙(이스케이핑)이 명시되어 있는가? [Gap]
- [ ] CHK005 - CSV 내 줄바꿈 문자(\n, \r\n) 처리 요구사항이 정의되어 있는가? [Gap]
- [ ] CHK006 - CSV 배열 필드(ownedProducts, products) 직렬화 형식이 명확히 문서화되어 있는가? [Clarity, import-formats.md]

### JSON Format Specification
- [ ] CHK007 - JSON 배열 형태 요구사항(각 객체 = 엔티티)이 명시되어 있는가? [Completeness, Contracts §README]
- [ ] CHK008 - JSON 날짜 형식(ISO 8601) 요구사항이 정의되어 있는가? [Completeness, Contracts §README]
- [ ] CHK009 - JSON pretty print 여부가 Export 요구사항에 포함되어 있는가? [Clarity, data-model.md]
- [ ] CHK010 - JSON 중첩 객체(ownedProducts) 구조 요구사항이 명확한가? [Clarity, import-formats.md]

### XLSX Format Specification
- [ ] CHK011 - XLSX 헤더 위치(첫 행) 요구사항이 명시되어 있는가? [Completeness, Contracts §README]
- [ ] CHK012 - XLSX 빈 셀 처리 규칙(undefined/빈 문자열)이 정의되어 있는가? [Clarity, Contracts §README]
- [ ] CHK013 - XLSX 셀 타입 자동 감지 규칙이 명시되어 있는가? [Gap]
- [ ] CHK014 - XLSX 시트명 규칙(엔티티명)이 Export 요구사항에 포함되어 있는가? [Completeness, data-model.md]
- [ ] CHK015 - XLSX 다중 시트 Import 시나리오 요구사항이 정의되어 있는가? [Gap]

### Dynamic Field Handling
- [ ] CHK016 - 동적 CoT 필드(cot4~cotn) Import 시 컬럼 매핑 규칙이 명시되어 있는가? [Completeness, data-model.md]
- [ ] CHK017 - 동적 필드 명명 규칙(정규식 `/^cot\d+$/`)이 요구사항에 문서화되어 있는가? [Clarity, data-model.md]
- [ ] CHK018 - 동적 필드 최대 개수 제한이 정의되어 있는가? [Gap]

---

## Schema Validation Requirements

### Field-Level Validation
- [ ] CHK019 - 모든 필수 필드(Required fields) 검증 요구사항이 명시되어 있는가? [Completeness, Spec §FR-020]
- [ ] CHK020 - 타입 검증(문자열/숫자/불리언) 불일치 시 오류 처리 요구사항이 정의되어 있는가? [Completeness, Contracts §README]
- [ ] CHK021 - Enum 검증 시 허용 값 목록이 각 엔티티별로 명확히 문서화되어 있는가? [Clarity, Spec §FR-022]
- [ ] CHK022 - 텍스트 필드 길이 제한(1000/5000/8000자) 검증 요구사항이 명시되어 있는가? [Completeness, Spec §FR-024, Clarifications]
- [ ] CHK023 - 날짜 형식 검증(YYYY-MM, ISO 8601) 요구사항이 정의되어 있는가? [Completeness, data-model.md]
- [ ] CHK024 - UUID 형식 검증 요구사항이 명시되어 있는가? [Gap]

### Conditional Field Validation
- [ ] CHK025 - `investmentTendency` 조건부 검증(customerSource === '증권') 규칙이 명확한가? [Completeness, data-model.md]
- [ ] CHK026 - `insuranceCrossRatio` 조건부 검증(customerSource === '보험') 규칙이 명시되어 있는가? [Completeness, data-model.md]
- [ ] CHK027 - 상품 출처별 조건부 필드(증권/보험 전용) 검증 요구사항이 정의되어 있는가? [Completeness, data-model.md]
- [ ] CHK028 - `questionType`의 `productSource` 종속 검증 규칙이 명시되어 있는가? [Completeness, Spec §FR-023]

### Cross-Field Validation
- [ ] CHK029 - CoTQA의 필수 조합(질문자 + 상품 + CoT1~3) 검증 요구사항이 명확한가? [Completeness, Spec §FR-003, FR-004]
- [ ] CHK030 - ID 중복 검증(CoT ID 고유성) 요구사항이 명시되어 있는가? [Completeness, Spec §FR-034]
- [ ] CHK031 - 외래키 참조 검증(questioner/products ID 존재 여부) 요구사항이 정의되어 있는가? [Gap, data-model.md]

---

## Exception & Error Handling Requirements (Priority)

### Import Error Scenarios
- [ ] CHK032 - 파일 형식 불일치(확장자 vs 실제 형식) 시 오류 처리 요구사항이 정의되어 있는가? [Gap, Exception Flow]
- [ ] CHK033 - 파일 크기 초과 시 오류 메시지 요구사항이 명시되어 있는가? [Gap, Exception Flow]
- [ ] CHK034 - 파일 파싱 실패(손상된 CSV/JSON/XLSX) 시 처리 요구사항이 정의되어 있는가? [Gap, Exception Flow]
- [ ] CHK035 - 인코딩 감지 실패 시 기본 인코딩 또는 오류 처리 요구사항이 명시되어 있는가? [Gap, Exception Flow]
- [ ] CHK036 - 빈 파일 Import 시 처리 요구사항이 정의되어 있는가? [Gap, Exception Flow]
- [ ] CHK037 - 헤더 누락 시 오류 처리 요구사항이 명시되어 있는가? [Gap, Exception Flow]

### Row-Level Error Handling
- [ ] CHK038 - 유효성 검사 실패 행 건너뛰기 정책이 명확히 정의되어 있는가? [Completeness, Spec §FR-016]
- [ ] CHK039 - 오류 리포트 형식(행 번호 + 오류 내용)이 구체적으로 명시되어 있는가? [Clarity, Spec §FR-016]
- [ ] CHK040 - 오류 메시지의 다국어 요구사항이 정의되어 있는가? [Gap]
- [ ] CHK041 - 필드별 오류 메시지 내용/형식이 명시되어 있는가? [Ambiguity, Spec §FR-021]
- [ ] CHK042 - 부분 성공(일부 행 성공, 일부 실패) 시 사용자 피드백 요구사항이 정의되어 있는가? [Gap, Alternate Flow]

### Duplicate Handling
- [ ] CHK043 - Import 파일 내 중복 ID 처리 정책(덮어쓰기/건너뛰기 선택)이 명확한가? [Completeness, Edge Cases]
- [ ] CHK044 - 기존 데이터와 중복 ID 충돌 시 처리 요구사항이 명시되어 있는가? [Clarity, Edge Cases]
- [ ] CHK045 - 중복 처리 옵션 UI 요구사항이 정의되어 있는가? [Gap]

### Batch Processing Errors
- [ ] CHK046 - 배치 처리(1000건 단위) 중 일부 배치 실패 시 롤백 정책이 정의되어 있는가? [Gap, Recovery Flow]
- [ ] CHK047 - 트랜잭션 실패 시 재시도 요구사항이 명시되어 있는가? [Gap, Recovery Flow]
- [ ] CHK048 - Import 중도 취소 시 데이터 롤백 요구사항이 정의되어 있는가? [Gap, Recovery Flow]

---

## Export Requirements

### Export Data Selection
- [ ] CHK049 - 선택적 Export(현재 필터링된 데이터만) 범위 정의가 명확한가? [Completeness, Spec §FR-018]
- [ ] CHK050 - Export 시 동적 CoT 필드 포함 여부 요구사항이 명시되어 있는가? [Gap]
- [ ] CHK051 - Export 파일명 생성 규칙(날짜/시간 포함)이 정의되어 있는가? [Gap]

### Export Error Scenarios
- [ ] CHK052 - Export 데이터 없음(빈 결과) 시 처리 요구사항이 정의되어 있는가? [Gap, Exception Flow]
- [ ] CHK053 - 브라우저 다운로드 권한 거부 시 오류 처리 요구사항이 명시되어 있는가? [Gap, Exception Flow]
- [ ] CHK054 - 대용량 Export 시 메모리 부족 오류 처리 요구사항이 정의되어 있는가? [Gap, Exception Flow]
- [ ] CHK055 - Export 중단(사용자 취소) 시 처리 요구사항이 명시되어 있는가? [Gap, Exception Flow]

---

## Schema Consistency & Traceability

### Schema Documentation
- [ ] CHK056 - 모든 엔티티의 필수/선택 필드 구분이 명확히 문서화되어 있는가? [Clarity, data-model.md]
- [ ] CHK057 - 각 필드의 타입, 제약조건, 기본값이 일관되게 정의되어 있는가? [Consistency, data-model.md]
- [ ] CHK058 - 스키마 버전 관리 정책이 요구사항에 포함되어 있는가? [Gap, Contracts §README]
- [ ] CHK059 - 스키마 변경 시 마이그레이션 요구사항이 정의되어 있는가? [Gap, data-model.md]

### Contract-to-Implementation Mapping
- [ ] CHK060 - 모든 스키마 요구사항이 Zod 스키마 구현 위치(src/models/)와 매핑되는가? [Traceability, Contracts §README]
- [ ] CHK061 - Import/Export 형식 요구사항이 서비스 구현(src/services/io/)과 매핑되는가? [Traceability]
- [ ] CHK062 - 계약 테스트 위치(tests/contract/schemas/)가 명시되어 있는가? [Traceability, Contracts §README]

---

## Data Integrity & Business Rules

### Referential Integrity
- [ ] CHK063 - 외래키 참조 무결성 검증 정책(선택적 확인)이 명확히 정의되어 있는가? [Clarity, data-model.md]
- [ ] CHK064 - 참조 데이터 삭제 시 orphaned reference 처리 정책이 명시되어 있는가? [Completeness, data-model.md]
- [ ] CHK065 - 데이터 히스토리 보존 우선 정책이 요구사항에 문서화되어 있는가? [Clarity, data-model.md]

### Data Denormalization
- [ ] CHK066 - CoTQA의 비정규화 필드(questionerGender/AgeGroup) 동기화 요구사항이 정의되어 있는가? [Gap, data-model.md]
- [ ] CHK067 - 비정규화 데이터 불일치 시 처리 요구사항이 명시되어 있는가? [Gap]

---

## Performance & Scale Requirements

### Import Performance
- [ ] CHK068 - 대용량 Import(1만 건) 성능 목표(10분)가 측정 가능하게 정의되어 있는가? [Measurability, Spec §SC-004]
- [ ] CHK069 - 배치 크기(1000건 단위) 선택 근거가 문서화되어 있는가? [Clarity, Spec §FR-017]
- [ ] CHK070 - 진행률 표시 업데이트 주기 요구사항이 명시되어 있는가? [Gap, Spec §FR-017]

### Data Scale Validation
- [ ] CHK071 - 최대 데이터 규모(30만/1만/1만) 검증 요구사항이 정의되어 있는가? [Completeness, Spec §SC-002]
- [ ] CHK072 - IndexedDB quota 초과 시 오류 처리 요구사항이 명시되어 있는가? [Gap, Edge Cases]

---

## Notes

- 체크리스트 항목을 완료하면 `[x]`로 표시하세요
- 발견된 문제는 해당 항목에 인라인 코멘트로 추가하세요
- `[Gap]` 표시는 명세에 누락된 요구사항을 의미합니다
- `[Ambiguity]` 표시는 명확화가 필요한 요구사항을 의미합니다
- `[Spec §X]`, `[data-model.md]`, `[Contracts §X]`는 해당 문서의 관련 섹션을 참조합니다

## Summary

- **Total Items**: 72
- **With Traceability**: 61 (85%)
- **Gaps Identified**: 35
- **Focus Areas**:
  - Import Format Requirements (18 items)
  - Schema Validation (13 items)
  - Exception & Error Handling (17 items, Priority)
  - Export Requirements (7 items)
  - Schema Consistency (7 items)
  - Data Integrity (5 items)
  - Performance (5 items)

## Priority Checklist (Exception Flows)

이 항목들은 예외/오류 처리 명세의 품질을 검증하는 **최우선 항목**입니다:

1. CHK032-CHK037: Import 오류 시나리오
2. CHK038-CHK042: 행 단위 오류 처리
3. CHK043-CHK045: 중복 처리
4. CHK046-CHK048: 배치 처리 오류
5. CHK052-CHK055: Export 오류 시나리오
6. CHK072: IndexedDB quota 초과

이 20개 항목을 우선 검토하여 데이터 계약의 오류 처리 명세 품질을 신속히 평가할 수 있습니다.

