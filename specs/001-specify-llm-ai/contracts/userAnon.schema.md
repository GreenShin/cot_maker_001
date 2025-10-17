# 질문자 (UserAnon) 스키마

익명화된 질문자 데이터의 구조와 검증 규칙을 정의합니다.

## 📋 기본 구조

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

## 🏷️ 타입 정의

### 연령대 (AgeGroup)
```typescript
type AgeGroup = 
  | '10대' 
  | '20대' 
  | '30대' 
  | '40대' 
  | '50대' 
  | '60대' 
  | '70대' 
  | '80대 이상';
```

### 보유 상품 (OwnedProduct)
```typescript
interface OwnedProduct {
  productName: string;    // 상품명
  purchaseDate: string;   // 구매일 (YYYY-MM-DD 형식)
}
```

## 🎯 고객 출처별 확장

### 증권 고객 (SecuritiesUser)
```typescript
interface SecuritiesUser extends UserAnon {
  customerSource: '증권';
  investmentTendency?: InvestmentTendency; // 투자성향
  investmentAmount?: number;               // 투자금액 (만원 단위)
}

type InvestmentTendency = 
  | '미정의'
  | '공격투자형'    // 고위험 고수익 선호
  | '적극투자형'    // 중위험 중수익 선호  
  | '위험중립형'    // 균형 잡힌 투자
  | '안정추구형'    // 저위험 안정 수익
  | '전문투자가형'; // 전문적 투자 지식 보유
```

### 보험 고객 (InsuranceUser)
```typescript
interface InsuranceUser extends UserAnon {
  customerSource: '보험';
  insuranceType?: InsuranceType; // 보험 유형 선호도
}

type InsuranceType = 
  | '미정의'
  | '보장only'      // 순수 보장성 보험만
  | '변액only'      // 변액 보험만
  | '기타only'      // 기타 보험 상품만
  | '보장+변액'     // 보장성 + 변액 조합
  | '보장+기타'     // 보장성 + 기타 조합
  | '변액+기타'     // 변액 + 기타 조합
  | '보장+변액+기타'; // 모든 유형 조합
```

## ✅ Zod 검증 스키마

```typescript
import { z } from 'zod';

// 기본 타입들
const ageGroupSchema = z.enum([
  '10대', '20대', '30대', '40대', '50대', '60대', '70대', '80대 이상'
]);

const genderSchema = z.enum(['남', '여']);

const customerSourceSchema = z.enum(['증권', '보험']);

const investmentTendencySchema = z.enum([
  '미정의', '공격투자형', '적극투자형', '위험중립형', '안정추구형', '전문투자가형'
]);

const insuranceTypeSchema = z.enum([
  '미정의', '보장only', '변액only', '기타only', 
  '보장+변액', '보장+기타', '변액+기타', '보장+변액+기타'
]);

// 보유 상품 스키마
const ownedProductSchema = z.object({
  productName: z.string().min(1, '상품명은 필수입니다'),
  purchaseDate: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/, 
    '구매일은 YYYY-MM-DD 형식이어야 합니다'
  )
});

// 기본 질문자 스키마
const baseUserAnonSchema = z.object({
  id: z.string().min(1, 'ID는 필수입니다'),
  customerSource: customerSourceSchema,
  ageGroup: ageGroupSchema,
  gender: genderSchema,
  ownedProducts: z.array(ownedProductSchema).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

// 증권 고객 스키마
const securitiesUserSchema = baseUserAnonSchema.extend({
  customerSource: z.literal('증권'),
  investmentTendency: investmentTendencySchema.optional(),
  investmentAmount: z.number().min(0).optional()
});

// 보험 고객 스키마  
const insuranceUserSchema = baseUserAnonSchema.extend({
  customerSource: z.literal('보험'),
  insuranceType: insuranceTypeSchema.optional()
});

// 통합 질문자 스키마
export const userAnonSchema = z.discriminatedUnion('customerSource', [
  securitiesUserSchema,
  insuranceUserSchema
]);

// 타입 추출
export type UserAnon = z.infer<typeof userAnonSchema>;
export type SecuritiesUser = z.infer<typeof securitiesUserSchema>;
export type InsuranceUser = z.infer<typeof insuranceUserSchema>;
```

## 📝 검증 규칙

### 필수 필드
- `id`: 빈 문자열 불가
- `customerSource`: '증권' 또는 '보험'만 허용
- `ageGroup`: 정의된 연령대만 허용
- `gender`: '남' 또는 '여'만 허용

### 선택적 필드
- `ownedProducts`: 빈 배열 허용
- `investmentTendency`: 증권 고객만 해당
- `investmentAmount`: 증권 고객만 해당, 0 이상
- `insuranceType`: 보험 고객만 해당
- `createdAt`, `updatedAt`: ISO 8601 형식 권장

### 비즈니스 규칙
1. **고객 출처별 필드**: 증권 고객은 투자 관련 필드, 보험 고객은 보험 관련 필드만 사용
2. **ID 유일성**: 시스템 내에서 고유해야 함
3. **구매일 형식**: YYYY-MM-DD 형식 엄격 준수
4. **투자금액**: 만원 단위, 음수 불가

## 📄 JSON 예제

### 증권 고객
```json
{
  "id": "user-sec-001",
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
}
```

### 보험 고객
```json
{
  "id": "user-ins-001", 
  "customerSource": "보험",
  "ageGroup": "40대",
  "gender": "여",
  "insuranceType": "보장+변액",
  "ownedProducts": [
    {
      "productName": "삼성 종신보험",
      "purchaseDate": "2023-12-01"
    },
    {
      "productName": "KB 변액보험",
      "purchaseDate": "2024-01-10"
    }
  ],
  "createdAt": "2024-01-02T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

## 📊 CSV 형식

### 헤더
```csv
id,customerSource,ageGroup,gender,investmentTendency,investmentAmount,insuranceType,ownedProducts,createdAt,updatedAt
```

### 데이터 행 예제
```csv
user-sec-001,증권,30대,남,적극투자형,5000,,"[{""productName"":""삼성 S&P500 ETF"",""purchaseDate"":""2024-01-15""},{""productName"":""KODEX 200 ETF"",""purchaseDate"":""2024-02-01""}]",2024-01-01T00:00:00.000Z,2024-01-01T00:00:00.000Z
user-ins-001,보험,40대,여,,,"보장+변액","[{""productName"":""삼성 종신보험"",""purchaseDate"":""2023-12-01""},{""productName"":""KB 변액보험"",""purchaseDate"":""2024-01-10""}]",2024-01-02T00:00:00.000Z,2024-01-02T00:00:00.000Z
```

### CSV 특별 규칙
- `ownedProducts`: JSON 문자열로 직렬화
- 빈 값: 빈 문자열로 표현
- 쉼표 포함 텍스트: 따옴표로 감싸기

## 🧪 테스트 케이스

### 유효한 데이터
```typescript
const validSecuritiesUser = {
  id: 'user-001',
  customerSource: '증권',
  ageGroup: '30대', 
  gender: '남',
  investmentTendency: '적극투자형',
  investmentAmount: 5000,
  ownedProducts: []
};

const validInsuranceUser = {
  id: 'user-002',
  customerSource: '보험',
  ageGroup: '40대',
  gender: '여', 
  insuranceType: '보장only',
  ownedProducts: []
};
```

### 무효한 데이터
```typescript
// 잘못된 연령대
const invalidAgeGroup = {
  id: 'user-003',
  customerSource: '증권',
  ageGroup: '90대', // ❌ 정의되지 않은 연령대
  gender: '남'
};

// 잘못된 고객 출처별 필드
const invalidCustomerField = {
  id: 'user-004', 
  customerSource: '보험',
  ageGroup: '30대',
  gender: '남',
  investmentTendency: '적극투자형' // ❌ 보험 고객에게 투자성향 필드
};

// 잘못된 구매일 형식
const invalidPurchaseDate = {
  id: 'user-005',
  customerSource: '증권', 
  ageGroup: '30대',
  gender: '남',
  ownedProducts: [{
    productName: '상품명',
    purchaseDate: '2024/01/15' // ❌ 잘못된 날짜 형식
  }]
};
```

## 🔧 유틸리티 함수

### 빈 질문자 생성
```typescript
export const createEmptyUserAnon = (customerSource: '증권' | '보험'): Partial<UserAnon> => ({
  customerSource,
  ageGroup: '30대',
  gender: '남',
  ownedProducts: [],
  ...(customerSource === '증권' && {
    investmentTendency: '미정의',
    investmentAmount: 1000
  }),
  ...(customerSource === '보험' && {
    insuranceType: '미정의'
  })
});
```

### 검증 함수
```typescript
export const validateUserAnon = (data: unknown): UserAnon => {
  return userAnonSchema.parse(data);
};

export const isValidUserAnon = (data: unknown): data is UserAnon => {
  return userAnonSchema.safeParse(data).success;
};
```

---

이 스키마는 질문자 데이터의 구조적 무결성과 비즈니스 규칙 준수를 보장하며, Import/Export 과정에서 데이터 품질을 유지합니다.
