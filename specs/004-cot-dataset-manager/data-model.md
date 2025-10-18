# Data Model: CoT 데이터셋 관리 웹앱

**Date**: 2025-10-17  
**Feature**: CoT 데이터셋 관리 웹앱 (004-cot-dataset-manager)

## 개요

이 문서는 CoT 데이터셋 관리 웹앱의 데이터 모델을 정의합니다. 모든 엔티티는 Zod 스키마로 정의되어 타입 안전성과 런타임 유효성 검사를 보장합니다.

## 핵심 엔티티

### 1. 질문자 (UserAnon)

익명화된 금융 고객 정보. 개인 식별 정보(PII)는 포함하지 않습니다.

**목적**: CoT 생성 시 질문자 컨텍스트 제공

**저장 위치**: IndexedDB `userAnons` object store

**ID 생성**: UUID v4

**인덱스**:
- `customerSource`: 고객출처로 빠른 필터링
- `ageGroup`: 연령대로 빠른 필터링
- `gender`: 성별로 빠른 필터링

**필드**:

| 필드명 | 타입 | 필수 | 설명 | 제약 |
|--------|------|------|------|------|
| `id` | string | ✅ | 고유 식별자 (UUID) | 중복 불가 |
| `customerSource` | enum | ✅ | 고객출처 | `'증권'` \| `'보험'` |
| `ageGroup` | enum | ✅ | 연령대 | `'10대'` ~ `'80대 이상'` |
| `gender` | enum | ✅ | 성별 | `'남'` \| `'여'` |
| `investmentAmount` | enum | ❌ | 투자액 | `'1000만원 이하'` ~ `'1억원 초과'` |
| `investmentTendency` | enum | ❌ | 투자성향 (증권 only) | `'공격투자형'` ~ `'전문투자가형'` |
| `insuranceCrossRatio` | enum | ❌ | 보험가입교차비율 (보험 only) | `'보장only'` ~ `'보장+변액+기타'` |
| `ownedProducts` | array | ❌ | 보유상품 목록 | `OwnedProduct[]` |
| `createdAt` | string | ❌ | 등록일 (ISO 8601) | 자동 생성 |
| `updatedAt` | string | ❌ | 수정일 (ISO 8601) | 자동 업데이트 |

**중첩 타입: OwnedProduct**

| 필드명 | 타입 | 필수 | 설명 | 제약 |
|--------|------|------|------|------|
| `productName` | string | ✅ | 상품명 | - |
| `purchaseDate` | string | ✅ | 구매년월 | `YYYY-MM` 형식 |

**조건부 필드**:
- `investmentTendency`: `customerSource === '증권'` 시에만 적용
- `insuranceCrossRatio`: `customerSource === '보험'` 시에만 적용

**비즈니스 규칙**:
1. 이름, 주소, 주민등록번호 등 PII는 절대 저장하지 않음
2. `ownedProducts`는 선택적이지만 빈 배열로 초기화
3. `createdAt`, `updatedAt`은 시스템이 자동 관리

**데이터 규모**: 최대 30만 건

### 2. 금융상품 (Product)

추천 대상 금융상품 정보.

**목적**: CoT 생성 시 상품 선택 및 참조

**저장 위치**: IndexedDB `products` object store

**ID 생성**: UUID v4

**인덱스**:
- `productSource`: 상품출처로 빠른 필터링
- `productCategory`: 상품분류로 빠른 필터링
- `riskLevel`: 위험등급으로 빠른 필터링

**필드**:

| 필드명 | 타입 | 필수 | 설명 | 제약 |
|--------|------|------|------|------|
| `id` | string | ✅ | 고유 식별자 (UUID) | 중복 불가 |
| `productSource` | enum | ✅ | 상품출처 | `'증권'` \| `'보험'` |
| `productName` | string | ✅ | 상품명 | 최소 1자 |
| `productCategory` | enum | ✅ | 상품분류 (출처별) | 증권: `'주식형'` ~ `'신탁/퇴직연금'` <br> 보험: `'연금'` ~ `'변액'` |
| `taxType` | enum | ✅ | 세금유형 | `'과세'` \| `'비과세'` |
| `riskLevel` | enum | ✅ | 위험등급 | `'1'` \| `'2'` \| `'3'` (1=높음) |
| `description` | string | ❌ | 상품 설명 | - |
| `managementCompany` | string | ❌ | 운용사 | - |
| `expectedReturn` | string | ❌ | 설정수익률 | 예: "연 5%" |
| `protectedType` | enum | ❌ | 원금보장형/비보장형 (증권 only) | - |
| `maturityType` | enum | ❌ | 만기 유무 (증권 only) | `'없음'` \| `'있음'` |
| `maturityPeriod` | string | ❌ | 만기기간 (증권 only) | 예: "3년" |
| `incomeRate6m` | string | ❌ | 최근 6개월 누적 수익률 (증권 only) | - |
| `riskGrade` | enum | ❌ | 위험등급 라벨 (증권 only) | `'1등급(매우높은위험)'` ~ `'6등급(매우낮은위험)'` |
| `paymentType` | enum | ❌ | 납입형태 | `'일시납'` \| `'월납'` \| `'혼합'` |
| `lossRate` | enum | ❌ | 손실한도 유무 (증권 only) | `'유'` \| `'무'` |
| `liquidityConditions` | string | ❌ | 유동성 조건 (증권 only) | - |
| `motherProductName` | string | ❌ | 모상품명 (보험 only) | - |
| `riderType` | enum | ❌ | 특약 유형 (보험 only) | `'사망'` ~ `'재물'` |
| `productPeriod` | enum | ❌ | 보험기간 (보험 only) | `'종신'` \| `'비종신'` |
| `disclosureType` | enum | ❌ | 고지형태 (보험 only) | `'간편고지'` ~ `'일반 심사'` |
| `renewableType` | enum | ❌ | 갱신형 여부 (보험 only) | `'갱신형'` \| `'미갱신형'` |
| `refundType` | enum | ❌ | 해약환급금 유무 (보험 only) | `'유'` \| `'무'` |
| `exclusionItems` | string | ❌ | 면책항목 (보험 only) | - |
| `paymentConditions` | string | ❌ | 특정 지급조건 (보험 only) | - |
| `eligibleAge` | string | ❌ | 자격연령 (보험 only) | 예: "20-65세" |
| `createdAt` | string | ❌ | 등록일 (ISO 8601) | 자동 생성 |
| `updatedAt` | string | ❌ | 수정일 (ISO 8601) | 자동 업데이트 |

**조건부 필드**:
- `productCategory`: `productSource`에 따라 허용 값 다름
- 증권 전용 필드: `protectedType`, `maturityType`, `maturityPeriod`, `incomeRate6m`, `riskGrade`, `lossRate`, `liquidityConditions`
- 보험 전용 필드: `motherProductName`, `riderType`, `productPeriod`, `disclosureType`, `renewableType`, `refundType`, `exclusionItems`, `paymentConditions`, `eligibleAge`

**비즈니스 규칙**:
1. `productName`은 중복 가능 (동일 상품의 다른 버전)
2. `riskLevel`은 1(높음), 2(중간), 3(낮음)
3. 출처별 필드는 UI에서 조건부로만 표시

**데이터 규모**: 최대 1만 건

### 3. CoT 질의응답 (CoTQA)

LLM 학습용 Chain of Thought 데이터.

**목적**: LLM fine-tuning을 위한 학습 데이터셋

**저장 위치**: IndexedDB `cots` object store

**ID 생성**: UUID v4

**인덱스**:
- `productSource`: 상품분류로 빠른 필터링
- `questionType`: 질문유형으로 빠른 필터링
- `status`: 데이터셋 상태로 빠른 필터링
- `questioner`: 질문자 ID로 참조 조회
- `products` (multi-entry): 상품 ID로 참조 조회

**필드**:

| 필드명 | 타입 | 필수 | 설명 | 제약 |
|--------|------|------|------|------|
| `id` | string | ✅ | 고유 식별자 (UUID) | 중복 불가 |
| `productSource` | enum | ✅ | 상품분류 | `'증권'` \| `'보험'` |
| `questionType` | enum | ✅ | 질문유형 (출처별) | 증권: `'고객 특성 강조형'` ~ `'상품비교 추천형'` <br> 보험: `'연령별 및 생애주기 저축성 상품 추천형'` ~ `'건강 및 질병 보장 대비형'` |
| `questioner` | string | ❌ | 질문자 ID (UserAnon.id) | 외래키 |
| `questionerGender` | enum | ❌ | 질문자 성별 (캐시) | `'남'` \| `'여'` |
| `questionerAgeGroup` | enum | ❌ | 질문자 연령대 (캐시) | `'10대'` ~ `'80대 이상'` |
| `products` | array | ❌ | 상품 ID 목록 (Product.id[]) | 최소 1개 권장 |
| `question` | string | ✅ | 질문 | 최소 1자, 최대 1000자 |
| `cot1` | string | ❌ | CoT 단계 1 (필수 권장) | 최대 5000자 |
| `cot2` | string | ❌ | CoT 단계 2 (필수 권장) | 최대 5000자 |
| `cot3` | string | ❌ | CoT 단계 3 (필수 권장) | 최대 5000자 |
| `cot4~cotn` | string | ❌ | 동적 CoT 단계 (선택) | 최대 5000자 |
| `answer` | string | ❌ | 최종 답변 | 최대 8000자 |
| `status` | enum | ✅ | 데이터셋 상태 | `'초안'` \| `'검토중'` \| `'완료'` \| `'보류'` |
| `author` | string | ❌ | 작성자 이름 | - |
| `reviewComment` | string | ❌ | 리뷰어의 의견/검토 메모 | - |
| `createdAt` | string | ❌ | 등록일 (ISO 8601) | 자동 생성 |
| `updatedAt` | string | ❌ | 수정일 (ISO 8601) | 자동 업데이트 |

**동적 필드**:
- `cot1`, `cot2`, `cot3`는 필수 권장 (UI에서 강제)
- `cot4`, `cot5`, ... 는 사용자가 동적으로 추가 가능
- 동적 CoT 필드는 정규식 `/^cot\d+$/`로 매칭

**조건부 필드**:
- `questionType`: `productSource`에 따라 허용 값 다름
- `questioner`, `questionerGender`, `questionerAgeGroup`: 질문자 선택 시 자동 저장 (비정규화)

**비즈니스 규칙**:
1. `cot1~3`는 UI에서 필수로 강제 (스키마에서는 선택적)
2. `products` 배열은 최소 1개 권장
3. 텍스트 필드 길이 제한: `question` (1000자), `cot*` (5000자), `answer` (8000자)
4. `status`가 '완료'일 때만 Export 권장
5. `questionerGender`, `questionerAgeGroup`는 비정규화 (검색 최적화)

**관계**:
- `questioner` → UserAnon (다대일)
- `products` → Product (다대다)

**데이터 규모**: 최대 1만 건

### 4. 설정 (Settings)

사용자별 UI 설정 정보.

**목적**: 사용자 경험 개인화

**저장 위치**: localStorage (Redux persist)

**ID**: 단일 설정 객체 (ID 불필요)

**필드**:

| 필드명 | 타입 | 기본값 | 설명 | 제약 |
|--------|------|--------|------|------|
| `defaultAuthor` | string | `"관리자"` | 기본 작성자 이름 | - |
| `fontSize` | number | `14` | 글꼴 크기 (px) | 10~24 |
| `themeMode` | enum | `"light"` | 테마 모드 | `'light'` \| `'dark'` |
| `canEditUsers` | boolean | `true` | 질문자 수정 권한 | - |
| `canEditProducts` | boolean | `true` | 상품 수정 권한 | - |
| `panelSizes` | object | `{ left: 300, right: 300 }` | 패널 너비 (px) | - |
| `textareaHeights` | object | `{}` | 텍스트 영역 높이 (px) | 필드별 저장 |

**비즈니스 규칙**:
1. 모든 설정은 localStorage에 자동 저장
2. 브라우저 재시작 시 자동 복원
3. 설정 초기화 시 기본값으로 리셋

**데이터 규모**: 단일 객체

## 엔티티 관계 다이어그램 (ERD)

```
┌──────────────┐         ┌──────────────┐
│   UserAnon   │         │   Product    │
│──────────────│         │──────────────│
│ id (PK)      │         │ id (PK)      │
│ customerSource│        │ productSource│
│ ageGroup     │         │ productName  │
│ gender       │         │ category     │
│ ...          │         │ ...          │
└──────┬───────┘         └──────┬───────┘
       │                        │
       │ 1                  N   │
       │                        │
       └───────┐       ┌────────┘
               │       │
            N  │       │  N
         ┌─────┴───────┴─────┐
         │      CoTQA         │
         │────────────────────│
         │ id (PK)            │
         │ questioner (FK)    │ ──→ UserAnon.id
         │ products[] (FK)    │ ──→ Product.id[]
         │ question           │
         │ cot1, cot2, cot3   │
         │ answer             │
         │ status             │
         └────────────────────┘

┌──────────────┐
│   Settings   │
│──────────────│
│ (singleton)  │
│ defaultAuthor│
│ fontSize     │
│ themeMode    │
│ ...          │
└──────────────┘
```

## IndexedDB 스키마

**데이터베이스 이름**: `cotDatasetDB`
**버전**: 1

**Object Stores**:

1. **userAnons**
   - Key path: `id`
   - Indexes:
     - `customerSource`
     - `ageGroup`
     - `gender`

2. **products**
   - Key path: `id`
   - Indexes:
     - `productSource`
     - `productCategory`
     - `riskLevel`

3. **cots**
   - Key path: `id`
   - Indexes:
     - `productSource`
     - `questionType`
     - `status`
     - `questioner`
     - `products` (multi-entry)

## 데이터 마이그레이션

현재 버전: 1

**향후 마이그레이션 전략**:
1. 버전 번호 증가
2. `onupgradeneeded` 이벤트에서 스키마 변경
3. 기존 데이터 마이그레이션 로직 추가

**예시** (버전 2로 업그레이드 시):
```typescript
if (oldVersion < 2) {
  // 새 인덱스 추가
  const cotStore = transaction.objectStore('cots');
  cotStore.createIndex('author', 'author', { unique: false });
}
```

## 유효성 검사 규칙

모든 엔티티는 Zod 스키마로 유효성 검사:

1. **필수 필드 검증**: Required fields must not be empty
2. **타입 검증**: Type safety ensured at runtime
3. **Enum 검증**: Only predefined values allowed
4. **길이 검증**: Text fields respect max length
5. **포맷 검증**: Date formats (YYYY-MM), ID formats (UUID)

**에러 처리**:
- 유효성 검사 실패 시 Zod error 반환
- UI에서 필드별 오류 메시지 표시
- Import 시 잘못된 행은 건너뛰고 오류 리포트 생성

## 성능 고려사항

1. **인덱싱**: 자주 쿼리되는 필드에 인덱스 생성
2. **배치 처리**: 1000건 단위 트랜잭션 배치
3. **비정규화**: `questionerGender`, `questionerAgeGroup` 캐시 (조인 회피)
4. **가상 스크롤**: UI에서 대용량 리스트 처리

## 참조 무결성

**외래키 검증**:
- `CoTQA.questioner` → `UserAnon.id`: 저장 시 존재 여부 확인 (선택적)
- `CoTQA.products[]` → `Product.id`: 저장 시 존재 여부 확인 (선택적)

**삭제 정책**:
- UserAnon 삭제: CoTQA의 `questioner` 필드는 그대로 유지 (orphaned reference)
- Product 삭제: CoTQA의 `products` 배열에서 해당 ID 유지 (orphaned reference)
- **근거**: 데이터 무결성보다 히스토리 보존 우선 (분석 목적)

## 데이터 Export 형식

**CSV**:
- 헤더 행 포함
- UTF-8 또는 EUC-KR 인코딩
- 동적 CoT 필드는 별도 컬럼으로 표현

**JSON**:
- 배열 형태 (각 객체는 엔티티)
- Pretty print (가독성)

**XLSX**:
- 첫 행: 헤더
- 각 행: 엔티티
- 시트명: 엔티티 이름 (예: "질문자", "상품", "CoT")

## 요약

- **3개 주요 엔티티**: UserAnon, Product, CoTQA
- **1개 설정 객체**: Settings
- **Zod 스키마 기반 유효성 검사**
- **IndexedDB 로컬 스토리지**
- **최대 데이터 규모**: 30만 + 1만 + 1만 = 31만 건
- **관계**: 다대일 (CoTQA → UserAnon), 다대다 (CoTQA ↔ Product)

