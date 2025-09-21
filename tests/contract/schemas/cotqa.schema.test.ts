/**
 * CoTQA Schema Contract Tests
 * OPFS + SQLite-WASM 통합 테스트
 * 동적 CoT 필드 및 FTS 검색 테스트 포함
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { cotQASchema, type CoTQA } from '../../../src/models/cotqa.js';
import { initializeSQLite } from '../../../src/services/storage/sqliteAdapter.js';
import { StorageFactory } from '../../../src/services/storage/storage.js';

describe('CoTQA Schema Contract Tests', () => {
  let sqliteAdapter: any;
  let cotStorage: any;

  beforeAll(async () => {
    // SQLite-WASM 어댑터 초기화
    sqliteAdapter = await initializeSQLite({
      dbName: 'test_cotqa',
      type: 'memory',
      enableLogging: false,
      enableFTS: true
    });

    cotStorage = await StorageFactory.createAdapter('cotqa', {}, 'sqlite');
  });

  afterAll(async () => {
    if (sqliteAdapter) {
      sqliteAdapter.close();
    }
  });

  describe('Basic Schema Validation', () => {
    it('should validate valid securities CoT with minimum required fields', () => {
      const validSecuritiesCoT = {
        id: 'cot-sec-001',
      productSource: '증권' as const,
      questionType: '고객 특성 강조형' as const,
        questioner: 'user-sec-001',
        products: ['product-sec-001'],
        question: '30대 직장인으로 안정적인 투자를 원합니다.',
        cot1: '고객의 나이와 직업을 고려해보겠습니다.',
        cot2: '안정성을 중시한다고 하셨으므로 리스크를 분석하겠습니다.',
        cot3: '적합한 상품군을 선별해보겠습니다.',
        answer: '고객님께는 ETF 상품을 추천드립니다.',
      status: '완료' as const,
        author: '투자전문가'
      };

      const result = cotQASchema.safeParse(validSecuritiesCoT);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.productSource).toBe('증권');
        expect(result.data.questionType).toBe('고객 특성 강조형');
        expect(result.data.products).toHaveLength(1);
      }
    });

    it('should validate valid insurance CoT with extended CoT steps', () => {
      const validInsuranceCoT = {
        id: 'cot-ins-001',
        productSource: '보험' as const,
        questionType: '연령별 및 생애주기 저축성 상품 추천형' as const,
        questioner: 'user-ins-001',
        products: ['product-ins-001', 'product-ins-002'],
        question: '40대 주부로 노후 준비와 자녀 교육비를 마련하고 싶습니다.',
        cot1: '40대 주부의 생애주기를 분석해보겠습니다.',
        cot2: '노후 준비와 교육비라는 두 목적을 파악했습니다.',
        cot3: '적합한 보험 상품을 선별해보겠습니다.',
        cot4: '보장성과 저축성을 조합한 상품을 고려하겠습니다.',
        cot5: '납입 기간과 보험료를 최적화하겠습니다.',
        answer: '종신보험과 변액보험의 조합을 추천드립니다.',
        status: '검토중' as const,
        author: '보험전문가'
      };

      const result = cotQASchema.safeParse(validInsuranceCoT);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.productSource).toBe('보험');
        expect(result.data.cot4).toBeDefined();
        expect(result.data.cot5).toBeDefined();
        expect(result.data.products).toHaveLength(2);
      }
    });

    it('should reject invalid product source', () => {
      const invalidCoT = {
        id: 'cot-invalid-001',
        productSource: '은행', // 잘못된 값
        questionType: '고객 특성 강조형',
        questioner: 'user-001',
        products: ['product-001'],
        question: '질문',
        cot1: 'CoT1', cot2: 'CoT2', cot3: 'CoT3',
        answer: '답변',
        status: '완료'
      };

      const result = cotQASchema.safeParse(invalidCoT);
      expect(result.success).toBe(false);
    });

    it('should require all mandatory fields', () => {
      const incompleteCoT = {
        id: 'cot-incomplete',
        productSource: '증권',
        questioner: 'user-001',
        products: ['product-001'],
        question: '질문'
        // cot1, cot2, cot3, answer, status 누락
      };

      const result = cotQASchema.safeParse(incompleteCoT);
      expect(result.success).toBe(false);
    });
  });

  describe('Securities Question Type Validation', () => {
    const securitiesQuestionTypes = [
      '고객 특성 강조형',
      '투자성향 및 조건 기반형',
      '상품비교 추천형'
    ];

    securitiesQuestionTypes.forEach(questionType => {
      it(`should validate securities question type: ${questionType}`, () => {
        const coT = {
          id: `cot-sec-${questionType}`,
          productSource: '증권' as const,
          questionType: questionType as any,
          questioner: 'user-sec-001',
          products: ['product-sec-001'],
          question: `${questionType} 관련 질문입니다.`,
          cot1: 'CoT1 분석',
          cot2: 'CoT2 분석',
          cot3: 'CoT3 분석',
          answer: '적절한 답변입니다.',
          status: '완료' as const
        };

        const result = cotQASchema.safeParse(coT);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid securities question type', () => {
      const invalidCoT = {
        id: 'cot-sec-invalid',
        productSource: '증권',
        questionType: '건강 및 질병 보장 대비형', // 보험 질문 유형
        questioner: 'user-001',
        products: ['product-001'],
        question: '질문',
        cot1: 'CoT1', cot2: 'CoT2', cot3: 'CoT3',
        answer: '답변',
        status: '완료'
      };

      const result = cotQASchema.safeParse(invalidCoT);
      expect(result.success).toBe(false);
    });
  });

  describe('Insurance Question Type Validation', () => {
    const insuranceQuestionTypes = [
      '연령별 및 생애주기 저축성 상품 추천형',
      '투자성 상품 추천형',
      '건강 및 질병 보장 대비형'
    ];

    insuranceQuestionTypes.forEach(questionType => {
      it(`should validate insurance question type: ${questionType}`, () => {
        const coT = {
          id: `cot-ins-${questionType}`,
      productSource: '보험' as const,
          questionType: questionType as any,
          questioner: 'user-ins-001',
          products: ['product-ins-001'],
          question: `${questionType} 관련 질문입니다.`,
          cot1: 'CoT1 분석',
          cot2: 'CoT2 분석',
          cot3: 'CoT3 분석',
          answer: '적절한 답변입니다.',
          status: '완료' as const
        };

        const result = cotQASchema.safeParse(coT);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('CoT Status Validation', () => {
    const validStatuses = ['초안', '검토중', '완료', '보류'];

    validStatuses.forEach(status => {
      it(`should validate status: ${status}`, () => {
        const coT = {
          id: `cot-status-${status}`,
          productSource: '증권' as const,
          questionType: '고객 특성 강조형' as const,
          questioner: 'user-001',
          products: ['product-001'],
          question: '상태 테스트 질문',
          cot1: 'CoT1', cot2: 'CoT2', cot3: 'CoT3',
          answer: '답변',
          status: status as any
        };

        const result = cotQASchema.safeParse(coT);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid status', () => {
    const invalidCoT = {
        id: 'cot-invalid-status',
        productSource: '증권',
        questionType: '고객 특성 강조형',
        questioner: 'user-001',
        products: ['product-001'],
        question: '질문',
        cot1: 'CoT1', cot2: 'CoT2', cot3: 'CoT3',
        answer: '답변',
        status: '승인됨' // 잘못된 값
      };

      const result = cotQASchema.safeParse(invalidCoT);
      expect(result.success).toBe(false);
    });
  });

  describe('Dynamic CoT Fields Validation', () => {
    it('should validate CoT with extended steps (cot4-cot10)', () => {
      const extendedCoT = {
        id: 'cot-extended-001',
      productSource: '증권' as const,
        questionType: '상품비교 추천형' as const,
        questioner: 'user-001',
        products: ['product-001', 'product-002', 'product-003'],
        question: '복잡한 상품 비교 분석을 원합니다.',
        cot1: '첫 번째 상품을 분석하겠습니다.',
        cot2: '두 번째 상품을 분석하겠습니다.',
        cot3: '세 번째 상품을 분석하겠습니다.',
        cot4: '수익률을 비교해보겠습니다.',
        cot5: '리스크를 비교해보겠습니다.',
        cot6: '비용구조를 비교해보겠습니다.',
        cot7: '세금 효율성을 비교해보겠습니다.',
        cot8: '유동성을 비교해보겠습니다.',
        cot9: '시장 전망을 고려해보겠습니다.',
        cot10: '최종 종합 분석을 진행하겠습니다.',
        answer: '종합적으로 고려할 때 두 번째 상품을 추천드립니다.',
        status: '완료' as const,
        author: '시니어 투자전문가'
      };

      const result = cotQASchema.safeParse(extendedCoT);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cot4).toBeDefined();
        expect(result.data.cot10).toBeDefined();
        expect(result.data.products).toHaveLength(3);
      }
    });

    it('should handle missing intermediate CoT steps', () => {
      const skipCoT = {
        id: 'cot-skip-001',
        productSource: '보험' as const,
        questionType: '투자성 상품 추천형' as const,
        questioner: 'user-001',
        products: ['product-001'],
        question: '스킵 테스트 질문',
      cot1: 'CoT1',
      cot2: 'CoT2',
      cot3: 'CoT3',
        // cot4 스킵
        cot5: 'CoT5 바로 진행',
        answer: '답변',
        status: '완료' as const
      };

      const result = cotQASchema.safeParse(skipCoT);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cot5).toBeDefined();
        expect(result.data.cot4).toBeUndefined();
      }
    });
  });

  describe('Products Array Validation', () => {
    it('should require at least one product', () => {
      const noProductCoT = {
        id: 'cot-no-product',
        productSource: '증권',
        questionType: '고객 특성 강조형',
        questioner: 'user-001',
        products: [], // 빈 배열
        question: '질문',
        cot1: 'CoT1', cot2: 'CoT2', cot3: 'CoT3',
        answer: '답변',
        status: '완료'
      };

      const result = cotQASchema.safeParse(noProductCoT);
      expect(result.success).toBe(false);
    });

    it('should validate multiple products', () => {
      const multiProductCoT = {
        id: 'cot-multi-product',
        productSource: '증권' as const,
        questionType: '상품비교 추천형' as const,
        questioner: 'user-001',
        products: ['product-001', 'product-002', 'product-003', 'product-004', 'product-005'],
        question: '5개 상품 비교 질문',
        cot1: 'CoT1', cot2: 'CoT2', cot3: 'CoT3',
        answer: '다중 상품 추천 답변',
        status: '완료' as const
      };

      const result = cotQASchema.safeParse(multiProductCoT);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.products).toHaveLength(5);
      }
    });

    it('should validate product ID format', () => {
      const validCoT = {
        id: 'cot-product-format',
        productSource: '증권' as const,
        questionType: '고객 특성 강조형' as const,
        questioner: 'user-001',
        products: ['product-sec-001', 'product-sec-002'],
        question: '상품 ID 형식 테스트',
        cot1: 'CoT1', cot2: 'CoT2', cot3: 'CoT3',
      answer: '답변',
      status: '완료' as const
    };

      const result = cotQASchema.safeParse(validCoT);
      expect(result.success).toBe(true);
    });
  });

  describe('SQLite Integration Tests', () => {
    it('should store and retrieve CoT data with dynamic fields', async () => {
      const testCoT = {
        id: 'test-cot-001',
        productSource: '증권' as const,
        questionType: '투자성향 및 조건 기반형' as const,
        questioner: 'test-user-001',
        products: ['test-product-001', 'test-product-002'],
        question: 'SQLite 통합 테스트용 질문입니다.',
        cot1: 'SQLite 첫 번째 분석 단계',
        cot2: 'SQLite 두 번째 분석 단계',
        cot3: 'SQLite 세 번째 분석 단계',
        cot4: 'SQLite 네 번째 확장 분석',
        cot5: 'SQLite 다섯 번째 심화 분석',
        answer: 'SQLite 통합 테스트 최종 답변',
        status: '완료' as const,
        author: 'SQLite 테스터',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 스키마 검증
      const validationResult = cotQASchema.safeParse(testCoT);
      expect(validationResult.success).toBe(true);

      if (sqliteAdapter) {
        // 동적 CoT 필드 JSON 변환
        const dynamicCots = JSON.stringify({
          cot4: testCoT.cot4,
          cot5: testCoT.cot5
        });

        // SQLite에 저장
        const insertSql = `
          INSERT INTO cotqa (id, product_source, question_type, questioner_id, question, cot1, cot2, cot3, dynamic_cots, answer, status, author, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        sqliteAdapter.insert(insertSql, [
          testCoT.id,
          testCoT.productSource,
          testCoT.questionType,
          testCoT.questioner,
          testCoT.question,
          testCoT.cot1,
          testCoT.cot2,
          testCoT.cot3,
          dynamicCots,
          testCoT.answer,
          testCoT.status,
          testCoT.author,
          testCoT.createdAt,
          testCoT.updatedAt
        ]);

        // CoT-Product 관계 저장
        for (const productId of testCoT.products) {
          sqliteAdapter.insert(
            'INSERT INTO cotqa_product (cotqa_id, product_id) VALUES (?, ?)',
            [testCoT.id, productId]
          );
        }

        // 검색 및 검증
        const retrievedCoT = (sqliteAdapter as any).selectOne(`
          SELECT c.*, GROUP_CONCAT(cp.product_id) as product_ids
          FROM cotqa c
          LEFT JOIN cotqa_product cp ON c.id = cp.cotqa_id
          WHERE c.id = ?
          GROUP BY c.id
        `, [testCoT.id]);

        expect(retrievedCoT).toBeTruthy();
        expect(retrievedCoT.product_source).toBe(testCoT.productSource);
        expect(retrievedCoT.question_type).toBe(testCoT.questionType);
        
        // 동적 CoT 필드 복원
        const parsedDynamicCots = JSON.parse(retrievedCoT.dynamic_cots);
        expect(parsedDynamicCots.cot4).toBe(testCoT.cot4);
        expect(parsedDynamicCots.cot5).toBe(testCoT.cot5);

        // 관련 상품 검증
        const productIds = retrievedCoT.product_ids.split(',');
        expect(productIds).toContain('test-product-001');
        expect(productIds).toContain('test-product-002');
      }
    });

    it('should perform full-text search on CoT content', async () => {
      if (sqliteAdapter) {
        // FTS 테스트 데이터 삽입
        const ftsTestCoT = {
          id: 'fts-test-001',
          product_source: '증권',
          question_type: '고객 특성 강조형',
          questioner_id: 'fts-user-001',
          question: '안정적인 해외투자 ETF 추천 부탁드립니다',
          cot1: '고객님의 투자 성향을 분석해보겠습니다',
          cot2: '해외투자의 장단점을 검토하겠습니다',
          cot3: 'ETF 상품군의 특성을 살펴보겠습니다',
          dynamic_cots: '{}',
          answer: 'S&P500 ETF와 글로벌 펀드를 추천드립니다',
          status: '완료',
          author: 'FTS 테스터',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const insertSql = `
          INSERT INTO cotqa (id, product_source, question_type, questioner_id, question, cot1, cot2, cot3, dynamic_cots, answer, status, author, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        sqliteAdapter.insert(insertSql, Object.values(ftsTestCoT));

        // FTS 검색 테스트
        const searchResults = (sqliteAdapter as any).selectAll(`
          SELECT cotqa.*, rank
          FROM cotqa_fts
          JOIN cotqa ON cotqa.id = cotqa_fts.id
          WHERE cotqa_fts MATCH 'ETF 추천'
          ORDER BY rank
          LIMIT 10
        `);

        expect(searchResults.length).toBeGreaterThan(0);
        
        const foundCoT = searchResults.find((result: Record<string, any>) => result.id === 'fts-test-001');
        expect(foundCoT).toBeTruthy();
        expect(foundCoT.question).toContain('ETF');
        expect(foundCoT.answer).toContain('ETF');
      }
    });

    it('should handle complex CoT queries with joins', async () => {
      if (sqliteAdapter) {
        // 복합 쿼리 테스트
        const complexQueryResults = (sqliteAdapter as any).selectAll(`
          SELECT 
            c.id,
            c.question,
            c.answer,
            c.status,
            COUNT(cp.product_id) as product_count,
            GROUP_CONCAT(cp.product_id) as related_products
          FROM cotqa c
          JOIN cotqa_product cp ON c.id = cp.cotqa_id
          WHERE c.product_source = '증권'
          AND c.status IN ('완료', '검토중')
          GROUP BY c.id
          HAVING product_count >= 1
          ORDER BY c.updated_at DESC
          LIMIT 5
        `);

        expect(Array.isArray(complexQueryResults)).toBe(true);
        
        complexQueryResults.forEach((result: Record<string, any>) => {
          expect(result.product_count).toBeGreaterThan(0);
          expect(result.related_products).toBeDefined();
          expect(['완료', '검토중']).toContain(result.status);
        });
      }
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large CoT content efficiently', async () => {
      const largeContent = 'A'.repeat(10000); // 10KB 문자열
      
      const largeCoT = {
        id: 'large-content-test',
        productSource: '증권' as const,
        questionType: '상품비교 추천형' as const,
        questioner: 'user-001',
        products: ['product-001'],
        question: largeContent,
        cot1: largeContent,
        cot2: largeContent,
        cot3: largeContent,
        answer: largeContent,
        status: '완료' as const
      };

      const startTime = performance.now();
      const result = cotQASchema.safeParse(largeCoT);
      const validationTime = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(validationTime).toBeLessThan(100); // 100ms 이하
    });

    it('should handle special characters and Unicode', () => {
      const unicodeCoT = {
        id: 'unicode-test-001',
      productSource: '증권' as const,
      questionType: '고객 특성 강조형' as const,
        questioner: 'user-한국어-001',
        products: ['product-🚀-001'],
        question: '이모지 😊 와 특수문자 @#$% 테스트입니다.',
        cot1: '한글 🇰🇷 과 영어 🇺🇸 혼용 테스트',
        cot2: 'JSON 특수문자 테스트: {"key": "value", "array": [1,2,3]}',
        cot3: 'SQL 이스케이프 테스트: \' " \\ / 등',
        answer: '유니코드 답변: ∑∆∏∫ 수학기호 포함',
        status: '완료' as const
      };

      const result = cotQASchema.safeParse(unicodeCoT);
      expect(result.success).toBe(true);
    });

    it('should validate extreme dynamic CoT scenarios', () => {
      const extremeCoT: any = {
        id: 'extreme-dynamic-test',
        productSource: '보험' as const,
        questionType: '건강 및 질병 보장 대비형' as const,
        questioner: 'user-001',
        products: ['product-001'],
        question: '극한 동적 CoT 테스트',
      cot1: 'CoT1',
      cot2: 'CoT2',
        cot3: 'CoT3',
        answer: '최종 답변',
        status: '완료' as const
      };

      // 동적 CoT 필드 50개 추가
      for (let i = 4; i <= 50; i++) {
        extremeCoT[`cot${i}`] = `동적 CoT 단계 ${i}번째 내용`;
      }

      const result = cotQASchema.safeParse(extremeCoT);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cot4).toBeDefined();
        expect(result.data.cot50).toBeDefined();
      }
    });

    it('should handle malformed product references', () => {
      const malformedCoT = {
        id: 'malformed-test',
        productSource: '증권' as const,
        questionType: '고객 특성 강조형' as const,
        questioner: 'user-001',
        products: ['', null, undefined, 'valid-product-001'].filter(Boolean),
        question: '잘못된 상품 참조 테스트',
        cot1: 'CoT1', cot2: 'CoT2', cot3: 'CoT3',
      answer: '답변',
      status: '완료' as const
    };

      const result = cotQASchema.safeParse(malformedCoT);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.products).toEqual(['valid-product-001']);
      }
    });
  });
});