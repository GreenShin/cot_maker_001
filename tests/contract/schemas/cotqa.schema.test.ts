import { describe, it, expect } from 'vitest';
import { cotQASchema } from '../../../src/models/cotqa';

describe('CoTQA Schema Contract', () => {
  it('should validate complete CoT with required fields', () => {
    const validCoT = {
      id: 'cot-1',
      productSource: '증권' as const,
      questionType: '고객 특성 강조형' as const,
      questioner: 'user-1',
      products: ['prod-1', 'prod-2'],
      question: '투자 상품을 추천해 주세요.',
      cot1: '고객의 투자 성향을 파악합니다.',
      cot2: '적합한 상품을 선별합니다.',
      cot3: '리스크를 고려합니다.',
      answer: '다음 상품을 추천합니다.',
      status: '완료' as const,
      author: '관리자',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    expect(() => cotQASchema.parse(validCoT)).not.toThrow();
  });

  it('should validate CoT with additional CoTn steps', () => {
    const cotWithExtra = {
      id: 'cot-2',
      productSource: '보험' as const,
      questionType: '건강 및 질병 보장 대비형' as const,
      questioner: 'user-2',
      products: ['prod-3'],
      question: '건강보험을 추천해 주세요.',
      cot1: '고객의 건강 상태를 확인합니다.',
      cot2: '보장 범위를 검토합니다.',
      cot3: '보험료를 계산합니다.',
      cot4: '추가 특약을 검토합니다.',
      cot5: '최종 검증을 수행합니다.',
      answer: '다음 보험을 추천합니다.',
      status: '초안' as const,
      author: '관리자'
    };

    expect(() => cotQASchema.parse(cotWithExtra)).not.toThrow();
  });

  it('should reject invalid question type for product source', () => {
    const invalidCoT = {
      id: 'cot-3',
      productSource: '증권' as const,
      questionType: '건강 및 질병 보장 대비형' as any, // 보험 질문 유형을 증권에 적용
      questioner: 'user-1',
      products: ['prod-1'],
      question: '질문',
      cot1: 'CoT1',
      cot2: 'CoT2',
      cot3: 'CoT3',
      answer: '답변',
      status: '완료' as const
    };

    expect(() => cotQASchema.parse(invalidCoT)).toThrow();
  });

  it('should allow optional CoT1, CoT2, CoT3, answer, author fields', () => {
    const minimalCoT = {
      id: 'cot-4',
      productSource: '증권' as const,
      questionType: '고객 특성 강조형' as const,
      question: '질문만 있는 CoT',
      status: '초안' as const
      // cot1, cot2, cot3, answer, author, questioner, products 모두 선택사항
    };

    expect(() => cotQASchema.parse(minimalCoT)).not.toThrow();
  });

  it('should require productSource, questionType, question, and status', () => {
    const missingRequiredFields = {
      id: 'cot-5',
      productSource: '증권' as const,
      questionType: '고객 특성 강조형' as const,
      // question 누락
      status: '완료' as const
    };

    expect(() => cotQASchema.parse(missingRequiredFields)).toThrow();
  });

  it('should trim whitespace from string fields', () => {
    const cotWithWhitespace = {
      id: 'cot-6',
      productSource: '증권' as const,
      questionType: '고객 특성 강조형' as const,
      question: '  질문  ',
      cot1: '  CoT1  ',
      answer: '  답변  ',
      author: '  작성자  ',
      status: '완료' as const
    };

    const result = cotQASchema.parse(cotWithWhitespace);
    expect(result.question).toBe('질문');
    expect(result.cot1).toBe('CoT1');
    expect(result.answer).toBe('답변');
    expect(result.author).toBe('작성자');
  });
});
