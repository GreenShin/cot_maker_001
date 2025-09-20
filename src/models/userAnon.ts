import { z } from 'zod';

// 고객출처별 종속 필드 정의
const securitiesInvestmentTendency = z.enum([
  '미정의', '공격투자형', '적극투자형', '위험중립형', '안정추구형', '전문투자가형'
]);

const insuranceCrossRatio = z.enum([
  '미정의', 'ㅗ장only', '변액only', '기타only', 
  '보장+변액', '보장+기타', '변액+기타', '보장+변액+기타'
]);

// 보유 상품 스키마
const ownedProductSchema = z.object({
  productName: z.string(),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}$/, '구매년월은 YYYY-MM 형식이어야 합니다')
});

// 기본 질문자 스키마
const baseUserAnonSchema = z.object({
  id: z.string(),
  customerSource: z.enum(['증권', '보험']),
  ageGroup: z.enum(['10대', '20대', '30대', '40대', '50대', '60대', '70대', '80대 이상']),
  gender: z.enum(['남', '여']),
  investmentAmount: z.enum([
    '1000만원 이하', '3000만원 이하', '5000만원 이하', '1억원 이하', '1억원 초과'
  ]).optional(),
  ownedProducts: z.array(ownedProductSchema).optional().default([]),
  // 메타데이터
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

// 고객출처별 조건부 스키마
export const userAnonSchema = z.discriminatedUnion('customerSource', [
  // 증권 고객
  baseUserAnonSchema.extend({
    customerSource: z.literal('증권'),
    investmentTendency: securitiesInvestmentTendency.optional()
  }),
  // 보험 고객
  baseUserAnonSchema.extend({
    customerSource: z.literal('보험'),
    insuranceCrossRatio: insuranceCrossRatio.optional()
  })
]);

export type UserAnon = z.infer<typeof userAnonSchema>;

// 유틸리티 함수들
export const createEmptyUserAnon = (customerSource: '증권' | '보험'): Partial<UserAnon> => ({
  customerSource,
  ageGroup: '30대',
  gender: '남',
  ownedProducts: []
});

export const validateUserAnon = (data: unknown): UserAnon => {
  return userAnonSchema.parse(data);
};
