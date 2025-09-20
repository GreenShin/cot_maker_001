# 상품 (Product) 스키마

금융 상품 데이터의 구조와 검증 규칙을 정의합니다.

## 📋 기본 구조

```typescript
interface Product {
  id: string;                    // 고유 식별자
  productSource: '증권' | '보험'; // 상품 출처
  productName: string;           // 상품명
  productCategory: string;       // 상품 카테고리
  taxType: string;              // 세금 유형
  riskLevel: string;            // 위험 등급
  createdAt?: string;           // 생성일시 (ISO 8601)
  updatedAt?: string;           // 수정일시 (ISO 8601)
}
```

## 🏷️ 상품 출처별 확장

### 증권 상품 (SecuritiesProduct)
```typescript
interface SecuritiesProduct extends Product {
  productSource: '증권';
  description?: string;  // 상품 설명 (증권 상품만 해당)
}
```

### 보험 상품 (InsuranceProduct)
```typescript
interface InsuranceProduct extends Product {
  productSource: '보험';
  // 보험 상품은 기본 구조만 사용
}
```

## 📊 카테고리 정의

### 증권 상품 카테고리
- **ETF**: 상장지수펀드
- **펀드**: 뮤추얼 펀드, 투자신탁
- **주식**: 개별 주식, 주식형 상품
- **채권**: 국채, 회사채, 채권형 상품
- **ELS**: 주가연계증권
- **DLS**: 파생결합증권

### 보험 상품 카테고리
- **종신보험**: 평생 보장하는 보험
- **정기보험**: 일정 기간 보장하는 보험
- **변액보험**: 투자 성과에 따라 보험금이 변하는 보험
- **연금보험**: 노후 자금 마련을 위한 보험
- **실손보험**: 의료비 실손을 보상하는 보험
- **암보험**: 암 진단 시 보장하는 보험

## 💰 세금 유형

- **일반과세**: 일반적인 세금 부과
- **비과세**: 세금 면제
- **세금우대**: 세금 혜택 제공
- **연금저축**: 연금저축 세제 혜택

## ⚠️ 위험 등급

- **1등급(매우낮음)**: 원금 손실 위험이 매우 낮음
- **2등급(낮음)**: 원금 손실 위험이 낮음
- **3등급(보통)**: 원금 손실 위험이 보통
- **4등급(높음)**: 원금 손실 위험이 높음
- **5등급(매우높음)**: 원금 손실 위험이 매우 높음
- **6등급(매우높음)**: 원금 손실 위험이 극도로 높음

## ✅ Zod 검증 스키마

```typescript
import { z } from 'zod';

// 기본 타입들
const productSourceSchema = z.enum(['증권', '보험']);

const securitiesCategorySchema = z.enum([
  'ETF', '펀드', '주식', '채권', 'ELS', 'DLS'
]);

const insuranceCategorySchema = z.enum([
  '종신보험', '정기보험', '변액보험', '연금보험', '실손보험', '암보험'
]);

const taxTypeSchema = z.enum([
  '일반과세', '비과세', '세금우대', '연금저축'
]);

const riskLevelSchema = z.enum([
  '1등급(매우낮음)', '2등급(낮음)', '3등급(보통)', 
  '4등급(높음)', '5등급(매우높음)', '6등급(매우높음)'
]);

// 기본 상품 스키마
const baseProductSchema = z.object({
  id: z.string().min(1, 'ID는 필수입니다'),
  productSource: productSourceSchema,
  productName: z.string().min(1, '상품명은 필수입니다'),
  productCategory: z.string().min(1, '상품 카테고리는 필수입니다'),
  taxType: taxTypeSchema,
  riskLevel: riskLevelSchema,
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

// 증권 상품 스키마
const securitiesProductSchema = baseProductSchema.extend({
  productSource: z.literal('증권'),
  productCategory: securitiesCategorySchema,
  description: z.string().optional()
});

// 보험 상품 스키마
const insuranceProductSchema = baseProductSchema.extend({
  productSource: z.literal('보험'),
  productCategory: insuranceCategorySchema
});

// 통합 상품 스키마
export const productSchema = z.discriminatedUnion('productSource', [
  securitiesProductSchema,
  insuranceProductSchema
]);

// 타입 추출
export type Product = z.infer<typeof productSchema>;
export type SecuritiesProduct = z.infer<typeof securitiesProductSchema>;
export type InsuranceProduct = z.infer<typeof insuranceProductSchema>;
```

## 📝 검증 규칙

### 필수 필드
- `id`: 빈 문자열 불가
- `productSource`: '증권' 또는 '보험'만 허용
- `productName`: 빈 문자열 불가
- `productCategory`: 상품 출처에 따른 유효한 카테고리만 허용
- `taxType`: 정의된 세금 유형만 허용
- `riskLevel`: 정의된 위험 등급만 허용

### 선택적 필드
- `description`: 증권 상품만 해당
- `createdAt`, `updatedAt`: ISO 8601 형식 권장

### 비즈니스 규칙
1. **상품 출처별 카테고리**: 증권/보험에 따라 허용되는 카테고리가 다름
2. **ID 유일성**: 시스템 내에서 고유해야 함
3. **상품명 중복**: 동일한 상품명이 여러 개 존재할 수 있음 (ID로 구분)

## 📄 JSON 예제

### 증권 상품
```json
{
  "id": "product-sec-001",
  "productSource": "증권",
  "productName": "삼성 S&P500 ETF",
  "productCategory": "ETF",
  "taxType": "일반과세",
  "riskLevel": "3등급(보통)",
  "description": "미국 S&P500 지수를 추종하는 ETF 상품으로, 미국 대형주 500개 기업에 분산투자합니다.",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

```json
{
  "id": "product-sec-002", 
  "productSource": "증권",
  "productName": "미래에셋 글로벌 펀드",
  "productCategory": "펀드",
  "taxType": "세금우대",
  "riskLevel": "4등급(높음)",
  "description": "전 세계 주식에 투자하는 액티브 펀드로, 높은 수익률을 추구합니다.",
  "createdAt": "2024-01-02T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

### 보험 상품
```json
{
  "id": "product-ins-001",
  "productSource": "보험", 
  "productName": "삼성 종신보험",
  "productCategory": "종신보험",
  "taxType": "비과세",
  "riskLevel": "1등급(매우낮음)",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

```json
{
  "id": "product-ins-002",
  "productSource": "보험",
  "productName": "KB 변액보험",
  "productCategory": "변액보험", 
  "taxType": "세금우대",
  "riskLevel": "3등급(보통)",
  "createdAt": "2024-01-03T00:00:00.000Z",
  "updatedAt": "2024-01-03T00:00:00.000Z"
}
```

## 📊 CSV 형식

### 헤더
```csv
id,productSource,productName,productCategory,taxType,riskLevel,description,createdAt,updatedAt
```

### 데이터 행 예제
```csv
product-sec-001,증권,삼성 S&P500 ETF,ETF,일반과세,3등급(보통),"미국 S&P500 지수를 추종하는 ETF 상품으로, 미국 대형주 500개 기업에 분산투자합니다.",2024-01-01T00:00:00.000Z,2024-01-01T00:00:00.000Z
product-ins-001,보험,삼성 종신보험,종신보험,비과세,1등급(매우낮음),,2024-01-01T00:00:00.000Z,2024-01-01T00:00:00.000Z
```

### CSV 특별 규칙
- `description`: 쉼표 포함 시 따옴표로 감싸기
- 빈 값: 빈 문자열로 표현
- 보험 상품의 `description`: 빈 문자열

## 🧪 테스트 케이스

### 유효한 데이터
```typescript
const validSecuritiesProduct = {
  id: 'product-001',
  productSource: '증권',
  productName: '삼성 S&P500 ETF',
  productCategory: 'ETF',
  taxType: '일반과세',
  riskLevel: '3등급(보통)',
  description: 'ETF 상품 설명'
};

const validInsuranceProduct = {
  id: 'product-002',
  productSource: '보험',
  productName: '삼성 종신보험', 
  productCategory: '종신보험',
  taxType: '비과세',
  riskLevel: '1등급(매우낮음)'
};
```

### 무효한 데이터
```typescript
// 잘못된 상품 카테고리
const invalidCategory = {
  id: 'product-003',
  productSource: '증권',
  productName: '상품명',
  productCategory: '종신보험', // ❌ 증권 상품에 보험 카테고리
  taxType: '일반과세',
  riskLevel: '3등급(보통)'
};

// 잘못된 세금 유형
const invalidTaxType = {
  id: 'product-004',
  productSource: '보험',
  productName: '상품명',
  productCategory: '종신보험',
  taxType: '면세', // ❌ 정의되지 않은 세금 유형
  riskLevel: '1등급(매우낮음)'
};

// 잘못된 위험 등급
const invalidRiskLevel = {
  id: 'product-005', 
  productSource: '증권',
  productName: '상품명',
  productCategory: 'ETF',
  taxType: '일반과세',
  riskLevel: '7등급' // ❌ 정의되지 않은 위험 등급
};
```

## 🔧 유틸리티 함수

### 빈 상품 생성
```typescript
export const createEmptyProduct = (productSource: '증권' | '보험'): Partial<Product> => ({
  productSource,
  productName: '',
  productCategory: productSource === '증권' ? 'ETF' : '종신보험',
  taxType: '일반과세',
  riskLevel: '3등급(보통)',
  ...(productSource === '증권' && {
    description: ''
  })
});
```

### 검증 함수
```typescript
export const validateProduct = (data: unknown): Product => {
  return productSchema.parse(data);
};

export const isValidProduct = (data: unknown): data is Product => {
  return productSchema.safeParse(data).success;
};
```

### 카테고리 필터링
```typescript
export const getProductCategories = (productSource: '증권' | '보험'): string[] => {
  if (productSource === '증권') {
    return ['ETF', '펀드', '주식', '채권', 'ELS', 'DLS'];
  } else {
    return ['종신보험', '정기보험', '변액보험', '연금보험', '실손보험', '암보험'];
  }
};

export const isValidCategoryForSource = (
  category: string, 
  productSource: '증권' | '보험'
): boolean => {
  return getProductCategories(productSource).includes(category);
};
```

### 위험 등급 비교
```typescript
export const compareRiskLevel = (level1: string, level2: string): number => {
  const riskOrder = [
    '1등급(매우낮음)', '2등급(낮음)', '3등급(보통)', 
    '4등급(높음)', '5등급(매우높음)', '6등급(매우높음)'
  ];
  
  const index1 = riskOrder.indexOf(level1);
  const index2 = riskOrder.indexOf(level2);
  
  return index1 - index2;
};

export const getRiskLevelNumber = (riskLevel: string): number => {
  const match = riskLevel.match(/^(\d+)등급/);
  return match ? parseInt(match[1]) : 0;
};
```

## 📈 상품 통계

### 카테고리별 분포
```typescript
export const getProductCategoryStats = (products: Product[]) => {
  const stats = products.reduce((acc, product) => {
    acc[product.productCategory] = (acc[product.productCategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return stats;
};
```

### 위험 등급별 분포
```typescript
export const getRiskLevelStats = (products: Product[]) => {
  const stats = products.reduce((acc, product) => {
    acc[product.riskLevel] = (acc[product.riskLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return stats;
};
```

---

이 스키마는 금융 상품 데이터의 구조적 무결성과 비즈니스 규칙 준수를 보장하며, 증권과 보험 상품의 특성을 정확히 반영합니다.
