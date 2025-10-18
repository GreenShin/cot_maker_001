# Data Contracts

이 디렉토리는 CoT 데이터셋 관리 웹앱의 데이터 계약(스키마)을 정의합니다.

## 개요

모든 데이터 엔티티는 Zod 스키마로 정의되어 타입 안전성과 런타임 유효성 검사를 보장합니다. 계약은 Import/Export 시 데이터 무결성을 검증하는 기준이 됩니다.

## 계약 문서

1. **[userAnon.schema.md](./userAnon.schema.md)** - 질문자 (익명 금융 고객)
2. **[product.schema.md](./product.schema.md)** - 금융상품
3. **[cotqa.schema.md](./cotqa.schema.md)** - CoT 질의응답

## 구현 위치

실제 Zod 스키마 구현:
- `src/models/userAnon.ts`
- `src/models/product.ts`
- `src/models/cotqa.ts`

## 계약 테스트

계약 준수 여부는 다음 테스트로 검증:
- `tests/contract/schemas/userAnon.schema.test.ts`
- `tests/contract/schemas/product.schema.test.ts`
- `tests/contract/schemas/cotqa.schema.test.ts`

## 버전 관리

- **현재 버전**: 1.0.0
- **변경 정책**: 스키마 변경 시 버전 업데이트 필수
  - MAJOR: 호환성 깨지는 필드 제거/타입 변경
  - MINOR: 새 필드 추가 (선택적)
  - PATCH: 문서 수정, 유효성 검사 규칙 강화

## Import/Export 형식

### CSV
- UTF-8 또는 EUC-KR 인코딩 지원
- 헤더 행 필수
- 동적 필드 (예: cot4~cotn) 지원

### JSON
- 배열 형태
- 각 객체는 스키마와 정확히 일치해야 함
- 날짜는 ISO 8601 형식

### XLSX
- 첫 행: 헤더
- 셀 타입 자동 감지
- 빈 셀은 undefined 또는 빈 문자열

## 유효성 검사 규칙

1. **필수 필드**: 누락 시 오류
2. **타입 검증**: 문자열/숫자/불리언 타입 불일치 시 오류
3. **Enum 검증**: 사전 정의되지 않은 값 입력 시 오류
4. **길이 검증**: 텍스트 필드 최대 길이 초과 시 오류
5. **포맷 검증**: 날짜/이메일 등 포맷 불일치 시 오류

## 오류 처리

Import 시 유효하지 않은 행:
1. 건너뛰기 (skip)
2. 오류 리포트 생성 (행 번호 + 오류 메시지)
3. 유효한 행만 저장

## 참고 문서

- [data-model.md](../data-model.md) - 전체 데이터 모델 설명
- [spec.md](../spec.md) - 기능 명세
- [research.md](../research.md) - 기술 스택 선정 근거

