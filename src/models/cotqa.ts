import { z } from 'zod';

// 상품출처별 질문유형 정의
const securitiesQuestionTypes = z.enum([
  '고객 특성 강조형', '투자성향 및 조건 기반형', '상품비교 추천형'
]);

const insuranceQuestionTypes = z.enum([
  '연령별 및 생애주기 저축성 상품 추천형', '투자성 상품 추천형', '건강 및 질병 보장 대비형'
]);

// CoT 상태 정의
const cotStatus = z.enum(['초안', '검토중', '완료', '보류']);

// 동적 CoT 단계를 위한 스키마
const dynamicCoTSchema = z.object({
  cot1: z.string().min(1, 'CoT1을 입력해주세요'),
  cot2: z.string().min(1, 'CoT2를 입력해주세요'),
  cot3: z.string().min(1, 'CoT3을 입력해주세요'),
}).catchall(z.string().optional()); // cot4, cot5, ... 동적 필드 허용

// 기본 CoTQA 스키마
const baseCotQASchema = z.object({
  id: z.string(),
  productSource: z.enum(['증권', '보험']),
  questioner: z.string().optional(), // 질문자 선택 사항으로 변경
  products: z.array(z.string()).optional().default([]), // 상품 선택 사항으로 변경
  question: z.string().min(1, '질문을 입력해주세요'),
  answer: z.string().min(1, '답변을 입력해주세요'),
  status: cotStatus,
  author: z.string().optional(),
  // 메타데이터
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
}).merge(dynamicCoTSchema);

// 상품출처별 조건부 스키마
export const cotQASchema = z.discriminatedUnion('productSource', [
  // 증권 CoT
  baseCotQASchema.extend({
    productSource: z.literal('증권'),
    questionType: securitiesQuestionTypes
  }),
  // 보험 CoT
  baseCotQASchema.extend({
    productSource: z.literal('보험'),
    questionType: insuranceQuestionTypes
  })
]);

export type CoTQA = z.infer<typeof cotQASchema>;

// 유틸리티 타입들
export type SecuritiesCoTQA = Extract<CoTQA, { productSource: '증권' }>;
export type InsuranceCoTQA = Extract<CoTQA, { productSource: '보험' }>;

// 유틸리티 함수들
export const createEmptyCoTQA = (productSource: '증권' | '보험'): any => ({
  productSource,
  questionType: productSource === '증권' ? '고객 특성 강조형' : '연령별 및 생애주기 저축성 상품 추천형',
  questioner: undefined, // 선택 사항으로 변경
  products: [], // 빈 배열로 기본값 설정
  question: '',
  cot1: '',
  cot2: '',
  cot3: '',
  answer: '',
  status: '초안'
});

export const validateCoTQA = (data: unknown): CoTQA => {
  return cotQASchema.parse(data);
};

export const getQuestionTypesBySource = (productSource: '증권' | '보험') => {
  return productSource === '증권' 
    ? securitiesQuestionTypes.options 
    : insuranceQuestionTypes.options;
};

// CoT 단계 관리 유틸리티
export const getCoTSteps = (cotqa: CoTQA): Array<{ key: string; value: string; required: boolean }> => {
  const steps = [
    { key: 'cot1', value: cotqa.cot1, required: true },
    { key: 'cot2', value: cotqa.cot2, required: true },
    { key: 'cot3', value: cotqa.cot3, required: true }
  ];

  // 동적 CoT 단계들 추가
  Object.keys(cotqa).forEach(key => {
    if (key.match(/^cot[4-9]$/) || key.match(/^cot\d{2,}$/)) {
      steps.push({ 
        key, 
        value: (cotqa as any)[key] || '', 
        required: false 
      });
    }
  });

  return steps.sort((a, b) => {
    const aNum = parseInt(a.key.replace('cot', ''));
    const bNum = parseInt(b.key.replace('cot', ''));
    return aNum - bNum;
  });
};

export const addCoTStep = (cotqa: CoTQA): CoTQA => {
  const steps = getCoTSteps(cotqa);
  const nextStepNum = steps.length + 1;
  const nextStepKey = `cot${nextStepNum}`;
  
  return {
    ...cotqa,
    [nextStepKey]: ''
  };
};

export const removeCoTStep = (cotqa: CoTQA, stepKey: string): CoTQA => {
  if (stepKey === 'cot1' || stepKey === 'cot2' || stepKey === 'cot3') {
    throw new Error('CoT1, CoT2, CoT3는 필수 단계로 삭제할 수 없습니다');
  }

  const { [stepKey]: removed, ...rest } = cotqa;
  return rest as CoTQA;
};
