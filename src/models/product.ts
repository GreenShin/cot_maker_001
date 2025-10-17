import { z } from 'zod';

// 상품출처별 카테고리 정의
const securitiesCategories = z.enum([
  '주식형', '채권형', '재간접', '단기금융', '파생형', '신탁/퇴직연금'
]);

const insuranceCategories = z.enum([
  '연금', '종신', '정기', '질병', '건강', '암', '변액'
]);

// 공통 선택 옵션들 (신규 스키마 관련)
const protectedTypeEnum = z.enum(['원금보장형', '원금비보장형']);
const maturityTypeEnum = z.enum(['없음', '있음']);
const paymentTypeEnum = z.enum(['일시납', '월납', '혼합']);
const riskGradeLabelEnum = z.enum([
  '1등급(매우높은위험)',
  '2등급(높은위험)',
  '3등급(다소높은위험)',
  '4등급(보통위험)',
  '5등급(낮은위험)',
  '6등급(매우낮은위험)'
]);

const riderTypeEnum = z.enum([
  '사망', '후유장해', '간병', '진단비', '수술비', '의료비', '일당', '배책', '운전자', '재물'
]);
const productPeriodEnum = z.enum(['종신', '비종신']);
const disclosureTypeEnum = z.enum(['간편고지', '초간편고지', '일반 심사']);
const renewableTypeEnum = z.enum(['갱신형', '미갱신형']);
const yesNoEnum = z.enum(['유', '무']);

// 기본 상품 스키마
const baseProductSchema = z.object({
  id: z.string(),
  productSource: z.enum(['증권', '보험']),
  productName: z.string().min(1, '상품명을 입력해주세요'),
  taxType: z.enum(['과세', '비과세']),
  description: z.string().optional(),
  riskLevel: z.enum(['1', '2', '3']),
  // 선택적 필드들
  managementCompany: z.string().optional(),
  expectedReturn: z.string().optional(),
  // 메타데이터
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

// 상품출처별 조건부 스키마
export const productSchema = z.discriminatedUnion('productSource', [
  // 증권 상품
  baseProductSchema.extend({
    productSource: z.literal('증권'),
    productCategory: securitiesCategories,
    // 신규 스키마 필드 (선택적): 제품 특성
    protectedType: protectedTypeEnum.optional(), // 원금보장형/원금비보장형
    maturityType: maturityTypeEnum.optional(),   // 만기: 없음/있음
    maturityPeriod: z.string().optional(),       // 예: 1개월, 3개월, 1년, 2년, 3~10년 등
    incomeRate6m: z.string().optional(),         // 최근 6개월 누적 수익률
    riskGrade: riskGradeLabelEnum.optional(),    // 위험등급(라벨)
    paymentType: paymentTypeEnum.optional(),     // 납입형태
    lossRate: yesNoEnum.optional(),              // 손실한도 유무
    liquidityConditions: z.string().optional()   // 유동성 조건
  }),
  // 보험 상품
  baseProductSchema.extend({
    productSource: z.literal('보험'),
    productCategory: insuranceCategories,
    // 신규 스키마 필드 (선택적): 특약/보장 관련
    motherProductName: z.string().optional(),    // 모상품명
    riderType: riderTypeEnum.optional(),         // 특약 유형
    productPeriod: productPeriodEnum.optional(), // 보험기간
    disclosureType: disclosureTypeEnum.optional(), // 고지형태
    renewableType: renewableTypeEnum.optional(), // 갱신형 여부
    refundType: yesNoEnum.optional(),            // 해약환급금 유/무
    paymentType: paymentTypeEnum.optional(),     // 납입형태
    exclusionItems: z.string().optional(),       // 면책항목
    paymentConditions: z.string().optional(),    // 특정 지급조건
    eligibleAge: z.string().optional()           // 자격연령
  })
]);

export type Product = z.infer<typeof productSchema>;

// 유틸리티 타입들
export type SecuritiesProduct = Extract<Product, { productSource: '증권' }>;
export type InsuranceProduct = Extract<Product, { productSource: '보험' }>;

// 유틸리티 함수들
export const createEmptyProduct = (productSource: '증권' | '보험'): Omit<Product, 'id' | 'createdAt' | 'updatedAt'> => ({
  productSource,
  productName: '',
  productCategory: productSource === '증권' ? '주식형' : '연금',
  taxType: '과세',
  riskLevel: '2'
});

export const validateProduct = (data: unknown): Product => {
  return productSchema.parse(data);
};

export const getProductCategoriesBySource = (productSource: '증권' | '보험') => {
  return productSource === '증권' 
    ? securitiesCategories.options 
    : insuranceCategories.options;
};

// UI에서 사용할 옵션 배열들
export const productSourceOptions = ['증권', '보험'] as const;
export const securitiesCategoryOptions = [
  '주식형', '채권형', '재간접', '단기금융', '파생형', '신탁/퇴직연금'
] as const;
export const insuranceCategoryOptions = [
  '연금', '종신', '정기', '질병', '건강', '암', '변액'
] as const;
export const taxTypeOptions = ['과세', '비과세'] as const;
export const riskLevelOptions = ['1', '2', '3'] as const;
