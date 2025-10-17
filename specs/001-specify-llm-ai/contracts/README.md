# 데이터 계약 및 스키마 문서

CoT 데이터셋 관리 웹앱의 데이터 모델, Import/Export 형식, API 계약을 정의합니다.

## 📋 목차

1. [데이터 모델](#데이터-모델)
2. [Import/Export 형식](#importexport-형식)
3. [검증 규칙](#검증-규칙)
4. [파일 형식 예제](#파일-형식-예제)

## 🏗️ 데이터 모델

### 질문자 (UserAnon)

**기본 구조**:
```typescript
interface UserAnon {
  id: string;                    // 고유 식별자
  customerSource: '증권' | '보험'; // 고객 출처
  ageGroup: AgeGroup;            // 연령대
  gender: '남' | '여';           // 성별
  ownedProducts: OwnedProduct[]; // 보유 상품 목록
  createdAt?: string;            // 생성일시 (ISO 8601)
  updatedAt?: string;            // 수정일시 (ISO 8601)
}
```

**연령대 타입**:
```typescript
type AgeGroup = '10대' | '20대' | '30대' | '40대' | '50대' | '60대' | '70대' | '80대 이상';
```

**보유 상품 구조**:
```typescript
interface OwnedProduct {
  productName: string;    // 상품명
  purchaseDate: string;   // 구매일 (YYYY-MM-DD)
}
```

**증권 고객 전용 필드**:
```typescript
interface SecuritiesUser extends UserAnon {
  customerSource: '증권';
  investmentTendency?: InvestmentTendency; // 투자성향
  investmentAmount?: number;               // 투자금액 (만원)
}

type InvestmentTendency = 
  | '미정의'
  | '공격투자형'
  | '적극투자형' 
  | '위험중립형'
  | '안정추구형'
  | '전문투자가형';
```

**보험 고객 전용 필드**:
```typescript
interface InsuranceUser extends UserAnon {
  customerSource: '보험';
  insuranceType?: InsuranceType; // 보험 유형
}

type InsuranceType = 
  | '미정의'
  | '보장only'
  | '변액only'
  | '기타only'
  | '보장+변액'
  | '보장+기타'
  | '변액+기타'
  | '보장+변액+기타';
```

### 상품 (Product)

**기본 구조**:
```typescript
interface Product {
  id: string;                    // 고유 식별자
  productSource: '증권' | '보험'; // 상품 출처
  productName: string;           // 상품명
  productCategory: string;       // 상품 카테고리
  taxType: string;              // 세금 유형
  riskLevel: string;            // 위험 등급
  createdAt?: string;           // 생성일시
  updatedAt?: string;           // 수정일시
}
```

**증권 상품 전용 필드**:
```typescript
interface SecuritiesProduct extends Product {
  productSource: '증권';
  description?: string;  // 상품 설명
}
```

**상품 카테고리**:
- **증권**: ETF, 펀드, 주식, 채권, ELS, DLS
- **보험**: 종신보험, 정기보험, 변액보험, 연금보험, 실손보험, 암보험

**세금 유형**: 일반과세, 비과세, 세금우대, 연금저축

**위험 등급**: 1등급(매우낮음) ~ 6등급(매우높음)

### CoT (CoTQA)

**기본 구조**:
```typescript
interface CoTQA {
  id: string;                    // 고유 식별자
  productSource: '증권' | '보험'; // 상품 분류
  questionType: string;          // 질문 유형
  questioner: string;            // 질문자 ID (UserAnon.id 참조)
  products: string[];            // 관련 상품 ID 목록 (Product.id 참조)
  question: string;              // 질문 내용
  cot1: string;                 // CoT 1단계 (필수)
  cot2: string;                 // CoT 2단계 (필수)
  cot3: string;                 // CoT 3단계 (필수)
  answer: string;               // 최종 답변
  status: CoTStatus;            // 상태
  author?: string;              // 작성자
  createdAt?: string;           // 생성일시
  updatedAt?: string;           // 수정일시
  
  // 동적 CoT 필드 (cot4, cot5, cot6, ...)
  [key: `cot${number}`]: string;
}
```

**질문 유형**:
- **증권**: 고객 특성 강조형, 투자성향 및 조건 기반형, 상품비교 추천형
- **보험**: 연령별 및 생애주기 저축성 상품 추천형, 투자성 상품 추천형, 건강 및 질병 보장 대비형

**CoT 상태**:
```typescript
type CoTStatus = '초안' | '검토중' | '완료' | '보류';
```

## 📥📤 Import/Export 형식

### 지원 형식

1. **JSON**: 완전한 데이터 구조 지원
2. **CSV**: 플랫 구조, 배열 필드는 JSON 문자열로 저장
3. **XLSX**: Excel 호환, 각 시트별로 엔티티 분리

### JSON 형식

**완전한 타입 정보 보존**:
```json
{
  "users": [
    {
      "id": "user-0001",
      "customerSource": "증권",
      "ageGroup": "30대",
      "gender": "남",
      "investmentTendency": "적극투자형",
      "investmentAmount": 5000,
      "ownedProducts": [
        {
          "productName": "삼성 S&P500 ETF",
          "purchaseDate": "2024-01-15"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### CSV 형식

**헤더 행 + 데이터 행**:
```csv
id,customerSource,ageGroup,gender,investmentTendency,investmentAmount,ownedProducts,createdAt,updatedAt
user-0001,증권,30대,남,적극투자형,5000,"[{""productName"":""삼성 S&P500 ETF"",""purchaseDate"":""2024-01-15""}]",2024-01-01T00:00:00.000Z,2024-01-01T00:00:00.000Z
```

**CSV 특별 규칙**:
- 배열/객체 필드는 JSON 문자열로 직렬화
- 쉼표 포함 텍스트는 따옴표로 감싸기
- 빈 값은 빈 문자열로 표현

### XLSX 형식

**시트 구조**:
- **Users**: 질문자 데이터
- **Products**: 상품 데이터  
- **CoTs**: CoT 데이터

**각 시트는 CSV와 동일한 컬럼 구조 사용**

## ✅ 검증 규칙

### Zod 스키마 기반 검증

**모든 데이터는 Import 시점에 엄격한 검증 수행**:

```typescript
// 필수 필드 검증
const userAnonSchema = z.object({
  id: z.string().min(1, 'ID는 필수입니다'),
  customerSource: z.enum(['증권', '보험']),
  ageGroup: z.enum(['10대', '20대', '30대', '40대', '50대', '60대', '70대', '80대 이상']),
  gender: z.enum(['남', '여']),
  ownedProducts: z.array(ownedProductSchema).min(0),
  // ... 기타 필드
});
```

### 비즈니스 규칙

1. **ID 유일성**: 각 엔티티의 ID는 고유해야 함
2. **참조 무결성**: CoTQA.questioner는 유효한 UserAnon.id여야 함
3. **참조 무결성**: CoTQA.products의 각 ID는 유효한 Product.id여야 함
4. **조건부 필드**: 증권 고객은 investmentTendency, 보험 고객은 insuranceType
5. **동적 CoT**: cot1~cot3는 필수, cot4 이상은 선택적
6. **날짜 형식**: ISO 8601 형식 (YYYY-MM-DDTHH:mm:ss.sssZ)

### 에러 처리

**Import 실패 시 상세한 에러 메시지 제공**:
```typescript
interface ImportError {
  row: number;           // 에러 발생 행 번호
  field: string;         // 에러 필드명
  value: any;           // 잘못된 값
  message: string;      // 에러 메시지
  code: string;         // 에러 코드
}
```

## 📄 파일 형식 예제

### users.json
```json
[
  {
    "id": "user-0001",
    "customerSource": "증권",
    "ageGroup": "30대", 
    "gender": "남",
    "investmentTendency": "적극투자형",
    "investmentAmount": 5000,
    "ownedProducts": [
      {
        "productName": "삼성 S&P500 ETF",
        "purchaseDate": "2024-01-15"
      },
      {
        "productName": "KODEX 200 ETF", 
        "purchaseDate": "2024-02-01"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": "user-0002",
    "customerSource": "보험",
    "ageGroup": "40대",
    "gender": "여", 
    "insuranceType": "보장+변액",
    "ownedProducts": [
      {
        "productName": "삼성 종신보험",
        "purchaseDate": "2023-12-01"
      }
    ],
    "createdAt": "2024-01-02T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
]
```

### products.json
```json
[
  {
    "id": "product-001",
    "productSource": "증권",
    "productName": "삼성 S&P500 ETF",
    "productCategory": "ETF",
    "taxType": "일반과세",
    "riskLevel": "3등급(보통)",
    "description": "미국 S&P500 지수를 추종하는 ETF 상품입니다.",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": "product-002", 
    "productSource": "보험",
    "productName": "삼성 종신보험",
    "productCategory": "종신보험",
    "taxType": "비과세",
    "riskLevel": "1등급(매우낮음)",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### cots.json (Export 형식)

**주의**: Export 시에는 필드명이 변환됩니다.

```json
[
  {
    "question_key": "cot-001",
    "product_type": "증권",
    "question_type": "투자성향 및 조건 기반형",
    "question": "30대 직장인으로 안정적인 해외 투자를 원합니다. 어떤 상품을 추천하시나요?",
    "cot1": "먼저 고객의 투자 목적과 위험 성향을 파악해보겠습니다. 30대 직장인으로 안정적인 해외 투자를 원한다고 하셨습니다.",
    "cot2": "고객의 투자성향이 '적극투자형'이지만 안정성을 중시한다고 하셨으므로, 분산투자가 가능한 해외 ETF 상품을 고려해보겠습니다.",
    "cot3": "S&P500 ETF는 미국 대형주 500개 기업에 분산투자하여 안정성과 성장성을 동시에 추구할 수 있는 상품입니다.",
    "cot4": "또한 달러 자산으로 환율 헤지 효과도 기대할 수 있어 포트폴리오 다변화에 도움이 됩니다.",
    "answer": "고객님의 투자 성향과 목적을 고려할 때, 삼성 S&P500 ETF를 추천드립니다. 이 상품은 미국 우량 기업들에 분산투자하여 안정성을 확보하면서도 장기적인 성장 가능성을 제공합니다."
  }
]
```

**필드명 매핑 (Export)**:
- `id` → `question_key`
- `productSource` → `product_type`
- `questionType` → `question_type`
- `questioner`, `products`, `status`, `author`, `createdAt`, `updatedAt` → 삭제됨

### users.csv
```csv
id,customerSource,ageGroup,gender,investmentTendency,investmentAmount,insuranceType,ownedProducts,createdAt,updatedAt
user-0001,증권,30대,남,적극투자형,5000,,"[{""productName"":""삼성 S&P500 ETF"",""purchaseDate"":""2024-01-15""},{""productName"":""KODEX 200 ETF"",""purchaseDate"":""2024-02-01""}]",2024-01-01T00:00:00.000Z,2024-01-01T00:00:00.000Z
user-0002,보험,40대,여,,,"보장+변액","[{""productName"":""삼성 종신보험"",""purchaseDate"":""2023-12-01""}]",2024-01-02T00:00:00.000Z,2024-01-02T00:00:00.000Z
```

## 🔧 Import/Export API

### Import 함수 시그니처

```typescript
// CSV Import
async function importCsvData<T>(
  file: File,
  entityType: 'userAnon' | 'product' | 'cotqa'
): Promise<ImportResult<T>>

// JSON Import  
async function importJsonData<T>(
  file: File,
  entityType: 'userAnon' | 'product' | 'cotqa'
): Promise<ImportResult<T>>

// XLSX Import
async function importXlsxData<T>(
  file: ArrayBuffer,
  entityType: 'userAnon' | 'product' | 'cotqa'
): Promise<ImportResult<T>>

interface ImportResult<T> {
  success: boolean;
  data: T[];
  errors: ImportError[];
  summary: {
    total: number;
    imported: number;
    failed: number;
  };
}
```

### Export 함수 시그니처

```typescript
// CSV Export
async function exportToCsv<T>(
  data: T[],
  filename: string
): Promise<void>

// JSON Export
async function exportToJson<T>(
  data: T[],
  filename: string  
): Promise<void>

// XLSX Export
async function exportToXlsx<T>(
  data: T[],
  filename: string
): Promise<void>
```

## 🧪 테스트 계약

### 스키마 검증 테스트

각 엔티티의 Zod 스키마가 올바르게 동작하는지 검증:

```typescript
describe('UserAnon Schema', () => {
  it('should validate valid securities user', () => {
    const validUser = { /* ... */ };
    expect(() => userAnonSchema.parse(validUser)).not.toThrow();
  });
  
  it('should reject invalid age group', () => {
    const invalidUser = { ageGroup: '90대' /* ... */ };
    expect(() => userAnonSchema.parse(invalidUser)).toThrow();
  });
});
```

### Import/Export 테스트

파일 형식별 Import/Export가 데이터 무결성을 보장하는지 검증:

```typescript
describe('CSV Import/Export', () => {
  it('should preserve data integrity in round-trip', async () => {
    const originalData = [/* sample users */];
    
    // Export to CSV
    await exportToCsv(originalData, 'test.csv');
    
    // Import from CSV
    const result = await importCsvData(csvFile, 'userAnon');
    
    // Verify data integrity
    expect(result.data).toEqual(originalData);
  });
});
```

---

이 문서는 CoT 데이터셋 관리 웹앱의 모든 데이터 계약을 정의하며, 개발자와 사용자가 데이터 구조를 이해하고 올바른 형식으로 Import/Export할 수 있도록 안내합니다.
