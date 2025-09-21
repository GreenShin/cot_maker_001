# CoT (CoTQA) 스키마

Chain of Thought 질문-답변 데이터의 구조와 검증 규칙을 정의합니다.

## 📋 기본 구조

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
  createdAt?: string;           // 생성일시 (ISO 8601)
  updatedAt?: string;           // 수정일시 (ISO 8601)
  
  // 동적 CoT 필드 (cot4, cot5, cot6, ...)
  [key: `cot${number}`]: string;
}
```

## 🏷️ 타입 정의

### CoT 상태 (CoTStatus)
```typescript
type CoTStatus = 
  | '초안'      // 작성 중인 상태
  | '검토중'    // 검토 대기 중
  | '완료'      // 검토 완료, 사용 가능
  | '보류';     // 일시 보류
```

### 질문 유형별 정의

#### 증권 질문 유형
```typescript
type SecuritiesQuestionType = 
  | '고객 특성 강조형'           // 고객의 개인적 특성을 중심으로 한 추천
  | '투자성향 및 조건 기반형'     // 투자 성향과 조건을 분석한 추천
  | '상품비교 추천형';           // 여러 상품을 비교하여 추천
```

#### 보험 질문 유형
```typescript
type InsuranceQuestionType = 
  | '연령별 및 생애주기 저축성 상품 추천형'  // 연령과 생애주기 기반 저축성 상품
  | '투자성 상품 추천형'                   // 투자 성격의 보험 상품
  | '건강 및 질병 보장 대비형';             // 건강 보장 중심 상품
```

## 🔗 참조 관계

### 질문자 참조
- `questioner` 필드는 `UserAnon.id`를 참조
- 질문자 정보를 통해 개인화된 추천 가능

### 상품 참조
- `products` 배열의 각 요소는 `Product.id`를 참조
- 다중 상품 추천 시나리오 지원
- 최소 1개 이상의 상품 필요

## ✅ Zod 검증 스키마

```typescript
import { z } from 'zod';

// 기본 타입들
const productSourceSchema = z.enum(['증권', '보험']);

const cotStatusSchema = z.enum(['초안', '검토중', '완료', '보류']);

const securitiesQuestionTypeSchema = z.enum([
  '고객 특성 강조형',
  '투자성향 및 조건 기반형', 
  '상품비교 추천형'
]);

const insuranceQuestionTypeSchema = z.enum([
  '연령별 및 생애주기 저축성 상품 추천형',
  '투자성 상품 추천형',
  '건강 및 질병 보장 대비형'
]);

// 동적 CoT 단계를 위한 스키마
const dynamicCoTSchema = z.object({
  cot1: z.string().min(1, 'CoT1을 입력해주세요'),
  cot2: z.string().min(1, 'CoT2를 입력해주세요'),
  cot3: z.string().min(1, 'CoT3을 입력해주세요'),
}).catchall(z.string().optional()); // cot4, cot5, ... 동적 필드 허용

// 기본 CoTQA 스키마
const baseCotQASchema = z.object({
  id: z.string().min(1, 'ID는 필수입니다'),
  productSource: productSourceSchema,
  questioner: z.string().min(1, '질문자를 선택해주세요'),
  products: z.array(z.string()).min(1, '상품을 최소 1개 선택해주세요'),
  question: z.string().min(1, '질문을 입력해주세요'),
  answer: z.string().min(1, '답변을 입력해주세요'),
  status: cotStatusSchema,
  author: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

// 증권 CoTQA 스키마
const securitiesCotQASchema = baseCotQASchema
  .merge(dynamicCoTSchema)
  .extend({
    productSource: z.literal('증권'),
    questionType: securitiesQuestionTypeSchema
  });

// 보험 CoTQA 스키마  
const insuranceCotQASchema = baseCotQASchema
  .merge(dynamicCoTSchema)
  .extend({
    productSource: z.literal('보험'),
    questionType: insuranceQuestionTypeSchema
  });

// 통합 CoTQA 스키마
export const cotQASchema = z.discriminatedUnion('productSource', [
  securitiesCotQASchema,
  insuranceCotQASchema
]);

// 타입 추출
export type CoTQA = z.infer<typeof cotQASchema>;
export type SecuritiesCoTQA = z.infer<typeof securitiesCotQASchema>;
export type InsuranceCoTQA = z.infer<typeof insuranceCotQASchema>;
```

## 📝 검증 규칙

### 필수 필드
- `id`: 빈 문자열 불가
- `productSource`: '증권' 또는 '보험'만 허용
- `questionType`: 상품 분류에 따른 유효한 질문 유형만 허용
- `questioner`: 빈 문자열 불가, 유효한 UserAnon.id여야 함
- `products`: 최소 1개 이상, 유효한 Product.id들이어야 함
- `question`: 빈 문자열 불가
- `cot1`, `cot2`, `cot3`: 빈 문자열 불가 (필수 CoT 단계)
- `answer`: 빈 문자열 불가
- `status`: 정의된 상태값만 허용

### 선택적 필드
- `cot4`, `cot5`, `cot6`, ...: 동적으로 추가 가능한 CoT 단계
- `author`: 작성자 정보
- `createdAt`, `updatedAt`: ISO 8601 형식 권장

### 비즈니스 규칙
1. **참조 무결성**: questioner와 products는 실제 존재하는 ID여야 함
2. **상품 분류 일치**: 선택된 상품들의 productSource와 CoT의 productSource가 일치해야 함
3. **질문 유형 제한**: 상품 분류에 따라 허용되는 질문 유형이 다름
4. **CoT 단계 순서**: cot1~cot3는 필수, cot4 이상은 순차적으로 추가
5. **ID 유일성**: 시스템 내에서 고유해야 함

## 📄 JSON 예제

### 증권 CoT (기본 3단계)
```json
{
  "id": "cot-sec-001",
  "productSource": "증권",
  "questionType": "투자성향 및 조건 기반형",
  "questioner": "user-sec-001",
  "products": ["product-sec-001", "product-sec-002"],
  "question": "30대 직장인으로 안정적인 해외 투자를 원합니다. 월 100만원씩 투자할 예정인데, 어떤 상품을 추천하시나요?",
  "cot1": "먼저 고객의 투자 목적과 위험 성향을 파악해보겠습니다. 30대 직장인으로 안정적인 해외 투자를 원하시고, 월 100만원의 정기 투자가 가능하다고 하셨습니다.",
  "cot2": "고객의 투자성향이 '적극투자형'이지만 안정성을 중시한다고 하셨으므로, 분산투자가 가능한 해외 ETF 상품을 고려해보겠습니다. 정기 투자에 적합한 상품을 찾아보겠습니다.",
  "cot3": "S&P500 ETF와 글로벌 펀드를 조합하면 미국 대형주와 전 세계 주식에 분산투자하여 안정성과 성장성을 동시에 추구할 수 있습니다. 월 정기투자로 달러코스트 평균법 효과도 기대할 수 있습니다.",
  "answer": "고객님의 투자 성향과 목적을 고려할 때, 삼성 S&P500 ETF(월 60만원)와 미래에셋 글로벌 펀드(월 40만원)의 조합을 추천드립니다. 이 조합은 미국과 전 세계 우량 기업들에 분산투자하여 안정성을 확보하면서도 장기적인 성장 가능성을 제공합니다.",
  "status": "완료",
  "author": "투자전문가",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 보험 CoT (확장 5단계)
```json
{
  "id": "cot-ins-001", 
  "productSource": "보험",
  "questionType": "연령별 및 생애주기 저축성 상품 추천형",
  "questioner": "user-ins-001",
  "products": ["product-ins-001", "product-ins-002"],
  "question": "40대 주부로 두 자녀가 있습니다. 노후 준비와 자녀 교육비를 동시에 마련할 수 있는 보험 상품이 있나요?",
  "cot1": "40대 주부 고객의 상황을 분석해보겠습니다. 두 자녀의 교육비와 본인의 노후 준비라는 두 가지 목적을 동시에 달성해야 하는 상황입니다.",
  "cot2": "생애주기상 40대는 교육비 부담이 큰 시기이면서 동시에 노후 준비를 본격적으로 시작해야 하는 시기입니다. 보장과 저축 기능을 모두 갖춘 상품이 적합할 것 같습니다.",
  "cot3": "종신보험은 평생 보장과 함께 해약환급금을 통한 목돈 마련이 가능하고, 변액보험은 투자 수익을 통해 인플레이션에 대응할 수 있습니다.",
  "cot4": "두 상품을 조합하면 안정적인 보장(종신보험)과 성장 가능성(변액보험)을 모두 확보할 수 있어, 교육비와 노후자금 마련에 효과적입니다.",
  "cot5": "납입 기간과 보험료를 고객의 경제적 여건에 맞게 설계하여 부담을 최소화하면서도 목표를 달성할 수 있도록 해야 합니다.",
  "answer": "고객님의 상황에는 삼성 종신보험과 KB 변액보험의 조합을 추천드립니다. 종신보험으로 안정적인 보장과 목돈 마련을, 변액보험으로 인플레이션 대응과 추가 수익을 추구할 수 있어 교육비와 노후 준비를 동시에 해결할 수 있습니다.",
  "status": "검토중",
  "author": "보험전문가",
  "createdAt": "2024-01-02T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

## 📊 CSV 형식

### 헤더
```csv
id,productSource,questionType,questioner,products,question,cot1,cot2,cot3,cot4,cot5,answer,status,author,createdAt,updatedAt
```

### 데이터 행 예제
```csv
cot-sec-001,증권,투자성향 및 조건 기반형,user-sec-001,"[""product-sec-001"",""product-sec-002""]","30대 직장인으로 안정적인 해외 투자를 원합니다. 월 100만원씩 투자할 예정인데, 어떤 상품을 추천하시나요?","먼저 고객의 투자 목적과 위험 성향을 파악해보겠습니다...","고객의 투자성향이 '적극투자형'이지만 안정성을 중시한다고 하셨으므로...","S&P500 ETF와 글로벌 펀드를 조합하면...",,,"고객님의 투자 성향과 목적을 고려할 때, 삼성 S&P500 ETF(월 60만원)와 미래에셋 글로벌 펀드(월 40만원)의 조합을 추천드립니다...",완료,투자전문가,2024-01-01T00:00:00.000Z,2024-01-01T00:00:00.000Z
```

### CSV 특별 규칙
- `products`: JSON 배열 문자열로 직렬화
- 긴 텍스트: 따옴표로 감싸기
- 빈 CoT 단계: 빈 문자열로 표현
- 쉼표/따옴표 포함 텍스트: 이스케이프 처리

## 🧪 테스트 케이스

### 유효한 데이터
```typescript
const validSecuritiesCoT = {
  id: 'cot-001',
  productSource: '증권',
  questionType: '고객 특성 강조형',
  questioner: 'user-001',
  products: ['product-001'],
  question: '투자 질문입니다.',
  cot1: 'CoT 1단계 분석',
  cot2: 'CoT 2단계 분석', 
  cot3: 'CoT 3단계 분석',
  answer: '최종 답변입니다.',
  status: '완료'
};

const validInsuranceCoTWithExtended = {
  id: 'cot-002',
  productSource: '보험',
  questionType: '건강 및 질병 보장 대비형',
  questioner: 'user-002',
  products: ['product-002', 'product-003'],
  question: '보험 질문입니다.',
  cot1: 'CoT 1단계',
  cot2: 'CoT 2단계',
  cot3: 'CoT 3단계',
  cot4: 'CoT 4단계 추가',
  cot5: 'CoT 5단계 추가',
  answer: '보험 상품 추천',
  status: '초안'
};
```

### 무효한 데이터
```typescript
// 잘못된 질문 유형
const invalidQuestionType = {
  id: 'cot-003',
  productSource: '증권',
  questionType: '건강 및 질병 보장 대비형', // ❌ 보험 질문 유형을 증권에 사용
  questioner: 'user-001',
  products: ['product-001'],
  question: '질문',
  cot1: 'CoT1', cot2: 'CoT2', cot3: 'CoT3',
  answer: '답변',
  status: '완료'
};

// 빈 상품 배열
const emptyProducts = {
  id: 'cot-004',
  productSource: '보험',
  questionType: '연령별 및 생애주기 저축성 상품 추천형',
  questioner: 'user-002',
  products: [], // ❌ 최소 1개 상품 필요
  question: '질문',
  cot1: 'CoT1', cot2: 'CoT2', cot3: 'CoT3',
  answer: '답변',
  status: '완료'
};

// 필수 CoT 단계 누락
const missingRequiredCoT = {
  id: 'cot-005',
  productSource: '증권',
  questionType: '상품비교 추천형',
  questioner: 'user-001',
  products: ['product-001'],
  question: '질문',
  cot1: 'CoT1',
  cot2: 'CoT2',
  // cot3: 누락 ❌
  answer: '답변',
  status: '완료'
};
```

## 🔧 유틸리티 함수

### 빈 CoT 생성
```typescript
export const createEmptyCoTQA = (productSource: '증권' | '보험'): Partial<CoTQA> => ({
  productSource,
  questionType: productSource === '증권' ? '고객 특성 강조형' : '연령별 및 생애주기 저축성 상품 추천형',
  questioner: '',
  products: [],
  question: '',
  cot1: '',
  cot2: '',
  cot3: '',
  answer: '',
  status: '초안'
});
```

### 검증 함수
```typescript
export const validateCoTQA = (data: unknown): CoTQA => {
  return cotQASchema.parse(data);
};

export const isValidCoTQA = (data: unknown): data is CoTQA => {
  return cotQASchema.safeParse(data).success;
};
```

### 동적 CoT 필드 관리
```typescript
export const getDynamicCoTFields = (cotData: CoTQA): string[] => {
  const dynamicFields: string[] = [];
  let index = 4;
  
  while (cotData[`cot${index}` as keyof CoTQA]) {
    dynamicFields.push(`cot${index}`);
    index++;
  }
  
  return dynamicFields;
};

export const addCoTStep = (cotData: CoTQA, content: string): CoTQA => {
  const dynamicFields = getDynamicCoTFields(cotData);
  const nextIndex = dynamicFields.length + 4;
  
  return {
    ...cotData,
    [`cot${nextIndex}`]: content
  };
};

export const removeLastCoTStep = (cotData: CoTQA): CoTQA => {
  const dynamicFields = getDynamicCoTFields(cotData);
  if (dynamicFields.length === 0) return cotData;
  
  const lastField = dynamicFields[dynamicFields.length - 1];
  const { [lastField]: removed, ...rest } = cotData;
  
  return rest as CoTQA;
};
```

### 질문 유형 필터링
```typescript
export const getQuestionTypes = (productSource: '증권' | '보험'): string[] => {
  if (productSource === '증권') {
    return ['고객 특성 강조형', '투자성향 및 조건 기반형', '상품비교 추천형'];
  } else {
    return ['연령별 및 생애주기 저축성 상품 추천형', '투자성 상품 추천형', '건강 및 질병 보장 대비형'];
  }
};
```

### 텍스트 검색
```typescript
export const searchCoTContent = (cotData: CoTQA, searchTerm: string): boolean => {
  const searchableFields = [
    cotData.question,
    cotData.cot1,
    cotData.cot2, 
    cotData.cot3,
    cotData.answer
  ];
  
  // 동적 CoT 필드도 검색 대상에 포함
  const dynamicFields = getDynamicCoTFields(cotData);
  dynamicFields.forEach(field => {
    searchableFields.push(cotData[field as keyof CoTQA] as string);
  });
  
  const searchText = searchableFields.join(' ').toLowerCase();
  return searchText.includes(searchTerm.toLowerCase());
};
```

---

이 스키마는 CoT 데이터의 구조적 무결성과 비즈니스 규칙 준수를 보장하며, 동적 CoT 단계와 참조 관계를 정확히 관리합니다.
