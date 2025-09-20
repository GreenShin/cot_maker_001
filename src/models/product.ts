import { z } from 'zod';

// 상품출처별 카테고리 정의
const securitiesCategories = z.enum([
  '주식형', '채권형', '재간접', '단기금융', '파생형', '신탁/퇴직연금'
]);

const insuranceCategories = z.enum([
  '연금', '종신', '정기', '질병', '건강', '암', '변액'
]);

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
    productCategory: securitiesCategories
  }),
  // 보험 상품
  baseProductSchema.extend({
    productSource: z.literal('보험'),
    productCategory: insuranceCategories
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
