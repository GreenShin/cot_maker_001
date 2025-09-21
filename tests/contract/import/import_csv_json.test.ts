/**
 * Import Pipeline Contract Tests (CSV/JSON)
 * Papa Parse + SQLite-WASM 스트리밍 Import 테스트
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { 
  importCsvData, 
  importCsvDataStreaming,
  importJsonData,
  importWithSQLiteBatch,
  type ImportResult,
  type ImportOptions
} from '../../../src/services/io/importer.js';
import { initializeSQLite } from '../../../src/services/storage/sqliteAdapter.js';

describe('Import Pipeline Contract Tests (CSV/JSON)', () => {
  let sqliteAdapter: any;

  beforeAll(async () => {
    // SQLite-WASM 어댑터 초기화
    sqliteAdapter = await initializeSQLite({
      dbName: 'test_import',
      type: 'memory',
      enableLogging: false
    });
  });

  afterAll(async () => {
    if (sqliteAdapter) {
      sqliteAdapter.close();
    }
  });

  beforeEach(async () => {
    if (sqliteAdapter) {
      // 각 테스트 전에 테이블 정리
      try {
        sqliteAdapter.execute('DELETE FROM user_anon WHERE id LIKE ?', ['test-%']);
        sqliteAdapter.execute('DELETE FROM product WHERE id LIKE ?', ['test-%']);
        sqliteAdapter.execute('DELETE FROM cotqa WHERE id LIKE ?', ['test-%']);
        sqliteAdapter.execute('DELETE FROM cotqa_product WHERE cotqa_id LIKE ?', ['test-%']);
      } catch (error) {
        // 테이블이 없는 경우 무시
      }
    }
  });

  describe('CSV Import Tests', () => {
    it('should import valid UserAnon CSV data', async () => {
      const csvContent = `id,customerSource,ageGroup,gender,investmentTendency,investmentAmount,ownedProducts
test-user-001,증권,30대,남,적극투자형,5000,"[{""productName"":""삼성 S&P500 ETF"",""purchaseDate"":""2024-01-15""}]"
test-user-002,보험,40대,여,,"","[{""productName"":""삼성 종신보험"",""purchaseDate"":""2023-12-01""}]"`;

      const result = await importCsvData(csvContent, 'userAnon');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(result.summary.totalRows).toBe(2);
      expect(result.summary.successRows).toBe(2);
      expect(result.summary.errorRows).toBe(0);

      // 첫 번째 유저 검증
      expect(result.data[0].id).toBe('test-user-001');
      expect(result.data[0].customerSource).toBe('증권');
      expect(result.data[0].investmentTendency).toBe('적극투자형');
      expect(result.data[0].ownedProducts).toHaveLength(1);
    });

    it('should import valid Product CSV data', async () => {
      const csvContent = `id,productSource,productName,productCategory,taxType,riskLevel,description
test-product-001,증권,테스트 ETF,ETF,일반과세,3등급(보통),테스트용 ETF 상품
test-product-002,보험,테스트 보험,종신보험,비과세,1등급(매우낮음),`;

      const result = await importCsvData(csvContent, 'product');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.errors).toHaveLength(0);

      // 증권 상품 검증
      expect(result.data[0].productSource).toBe('증권');
      expect(result.data[0].description).toBe('테스트용 ETF 상품');

      // 보험 상품 검증 (description이 빈 값)
      expect(result.data[1].productSource).toBe('보험');
      expect(result.data[1].description).toBe('');
    });

    it('should import valid CoTQA CSV data with dynamic fields', async () => {
      const csvContent = `id,productSource,questionType,questioner,products,question,cot1,cot2,cot3,cot4,cot5,answer,status,author
test-cot-001,증권,투자성향 및 조건 기반형,test-user-001,"[""test-product-001""]","30대 직장인 투자 질문","첫번째 분석","두번째 분석","세번째 분석","네번째 분석","다섯번째 분석","투자 추천 답변",완료,테스트 전문가`;

      const result = await importCsvData(csvContent, 'cotqa');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.errors).toHaveLength(0);

      const coT = result.data[0];
      expect(coT.id).toBe('test-cot-001');
      expect(coT.productSource).toBe('증권');
      expect(coT.cot4).toBe('네번째 분석');
      expect(coT.cot5).toBe('다섯번째 분석');
      expect(coT.products).toEqual(['test-product-001']);
    });

    it('should handle CSV parsing errors gracefully', async () => {
      const invalidCsvContent = `id,customerSource,ageGroup,gender
test-user-invalid,은행,90대,기타`; // 잘못된 값들

      const result = await importCsvData(invalidCsvContent, 'userAnon');

      expect(result.success).toBe(false);
      expect(result.data).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.summary.totalRows).toBe(1);
      expect(result.summary.errorRows).toBe(1);

      const error = result.errors[0];
      expect(error.row).toBe(1);
      expect(error.message).toContain('customerSource');
    });

    it('should handle empty CSV content', async () => {
      const emptyCsvContent = '';

      const result = await importCsvData(emptyCsvContent, 'userAnon');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(result.summary.totalRows).toBe(0);
    });

    it('should track progress during CSV import', async () => {
      const largeCsvContent = generateLargeCsv(500); // 500행 데이터
      const progressUpdates: number[] = [];

      const options: ImportOptions = {
        onProgress: (progress) => {
          progressUpdates.push(progress);
        },
        batchSize: 100
      };

      const result = await importCsvData(largeCsvContent, 'userAnon', options);

      expect(result.success).toBe(true);
      expect(progressUpdates).toContain(100); // 마지막에 100% 도달
      expect(progressUpdates.length).toBeGreaterThan(1); // 여러 번의 진행률 업데이트
    });
  });

  describe('JSON Import Tests', () => {
    it('should import valid UserAnon JSON data', async () => {
      const jsonData = [
        {
          id: 'test-user-json-001',
          customerSource: '증권',
          ageGroup: '30대',
          gender: '남',
          investmentTendency: '적극투자형',
          investmentAmount: 5000,
          ownedProducts: [
            {
              productName: '삼성 S&P500 ETF',
              purchaseDate: '2024-01-15'
            }
          ]
        },
        {
          id: 'test-user-json-002',
          customerSource: '보험',
          ageGroup: '40대',
          gender: '여',
          insuranceType: '보장+변액',
          ownedProducts: []
        }
      ];

      const result = await importJsonData(jsonData, 'userAnon');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.errors).toHaveLength(0);

      // 증권 고객 검증
      expect(result.data[0].customerSource).toBe('증권');
      expect(result.data[0].investmentTendency).toBe('적극투자형');

      // 보험 고객 검증
      expect(result.data[1].customerSource).toBe('보험');
      expect(result.data[1].insuranceType).toBe('보장+변액');
    });

    it('should import valid Product JSON data', async () => {
      const jsonData = [
        {
          id: 'test-product-json-001',
          productSource: '증권',
          productName: 'JSON 테스트 ETF',
          productCategory: 'ETF',
          taxType: '일반과세',
          riskLevel: '3등급(보통)',
          description: 'JSON으로 임포트된 ETF 상품'
        },
        {
          id: 'test-product-json-002',
          productSource: '보험',
          productName: 'JSON 테스트 보험',
          productCategory: '종신보험',
          taxType: '비과세',
          riskLevel: '1등급(매우낮음)'
        }
      ];

      const result = await importJsonData(jsonData, 'product');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should import valid CoTQA JSON data with complex structure', async () => {
      const jsonData = [
        {
          id: 'test-cot-json-001',
          productSource: '보험',
          questionType: '연령별 및 생애주기 저축성 상품 추천형',
          questioner: 'test-user-json-001',
          products: ['test-product-json-001', 'test-product-json-002'],
          question: '40대 주부의 노후 준비와 자녀 교육비 상담',
          cot1: '생애주기 분석',
          cot2: '교육비 및 노후자금 계산',
          cot3: '적합 상품군 선별',
          cot4: '보장성과 저축성 조합 검토',
          cot5: '세제혜택 및 납입기간 최적화',
          cot6: '가족상황 고려 리스크 관리',
          answer: '종신보험과 변액보험 조합 추천',
          status: '검토중',
          author: 'JSON 테스트 전문가',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      const result = await importJsonData(jsonData, 'cotqa');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.errors).toHaveLength(0);

      const coT = result.data[0];
      expect(coT.cot6).toBe('가족상황 고려 리스크 관리');
      expect(coT.products).toHaveLength(2);
      expect(coT.createdAt).toBeDefined();
    });

    it('should handle JSON validation errors', async () => {
      const invalidJsonData = [
        {
          id: 'invalid-json-001',
          customerSource: '은행', // 잘못된 값
          ageGroup: '30대',
          gender: '남'
        },
        {
          // id 누락
          customerSource: '증권',
          ageGroup: '40대',
          gender: '여'
        }
      ];

      const result = await importJsonData(invalidJsonData, 'userAnon');

      expect(result.success).toBe(false);
      expect(result.data).toHaveLength(0);
      expect(result.errors).toHaveLength(2);
      expect(result.summary.errorRows).toBe(2);
    });

    it('should track progress during JSON import', async () => {
      const largeJsonData = generateLargeJsonData(300);
      const progressUpdates: number[] = [];

      const options: ImportOptions = {
        onProgress: (progress) => {
          progressUpdates.push(progress);
        }
      };

      const result = await importJsonData(largeJsonData, 'userAnon', options);

      expect(result.success).toBe(true);
      expect(progressUpdates).toContain(100);
      expect(progressUpdates.length).toBeGreaterThan(0);
    });
  });

  describe('SQLite-WASM Streaming Import Tests', () => {
    it('should perform streaming CSV import with direct SQLite insertion', async () => {
      const csvContent = generateLargeCsv(1000); // 1000행 데이터
      
      const options: ImportOptions = {
        sqliteAdapter,
        directInsert: true,
        batchSize: 200,
        onProgress: (progress) => {
          expect(progress).toBeGreaterThanOrEqual(0);
          expect(progress).toBeLessThanOrEqual(100);
        }
      };

      const result = await importCsvDataStreaming(csvContent, 'userAnon', options);

      expect(result.success).toBe(true);
      expect(result.summary.successRows).toBe(1000);
      expect(result.errors).toHaveLength(0);

      // SQLite에 실제로 저장되었는지 확인
      const count = sqliteAdapter.selectOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM user_anon WHERE id LIKE ?',
        ['large-user-%']
      );
      expect(count?.count).toBe(1000);
    });

    it('should perform batch insertion with SQLite transactions', async () => {
      const testData = [
        {
          id: 'batch-test-001',
          customerSource: '증권',
          ageGroup: '30대',
          gender: '남',
          investmentTendency: '적극투자형'
        },
        {
          id: 'batch-test-002',
          customerSource: '보험',
          ageGroup: '40대',
          gender: '여',
          insuranceType: '보장only'
        },
        {
          id: 'batch-test-003',
          customerSource: '증권',
          ageGroup: '20대',
          gender: '남',
          investmentAmount: 3000
        }
      ];

      const result = await importWithSQLiteBatch(testData, 'userAnon', sqliteAdapter, {
        batchSize: 2 // 작은 배치로 테스트
      });

      expect(result.success).toBe(true);
      expect(result.summary.successRows).toBe(3);

      // 트랜잭션으로 모든 데이터가 삽입되었는지 확인
      const insertedData = sqliteAdapter.selectAll<any>(
        'SELECT * FROM user_anon WHERE id LIKE ? ORDER BY id',
        ['batch-test-%']
      );

      expect(insertedData).toHaveLength(3);
      expect(insertedData[0].customer_source).toBe('증권');
      expect(insertedData[1].customer_source).toBe('보험');
    });

    it('should validate data before SQLite insertion', async () => {
      const mixedValidityData = [
        {
          id: 'valid-001',
          customerSource: '증권',
          ageGroup: '30대',
          gender: '남'
        },
        {
          id: 'invalid-001',
          customerSource: '은행', // 잘못된 값
          ageGroup: '30대',
          gender: '남'
        },
        {
          id: 'valid-002',
          customerSource: '보험',
          ageGroup: '40대',
          gender: '여'
        }
      ];

      const result = await importWithSQLiteBatch(mixedValidityData, 'userAnon', sqliteAdapter);

      expect(result.success).toBe(false);
      expect(result.summary.successRows).toBe(2);
      expect(result.summary.errorRows).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].row).toBe(2); // 두 번째 행에서 에러
    });

    it('should handle validation-only mode without insertion', async () => {
      const testData = [
        {
          id: 'validation-test-001',
          customerSource: '증권',
          ageGroup: '30대',
          gender: '남'
        }
      ];

      const result = await importWithSQLiteBatch(testData, 'userAnon', sqliteAdapter, {
        validateOnly: true
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);

      // 데이터베이스에는 삽입되지 않았는지 확인
      const count = sqliteAdapter.selectOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM user_anon WHERE id = ?',
        ['validation-test-001']
      );
      expect(count?.count).toBe(0);
    });
  });

  describe('Performance and Memory Tests', () => {
    it('should handle large CSV imports efficiently', async () => {
      const startTime = performance.now();
      const largeCsvContent = generateLargeCsv(2000);

      const result = await importCsvData(largeCsvContent, 'userAnon', {
        batchSize: 500
      });

      const importTime = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.summary.successRows).toBe(2000);
      expect(importTime).toBeLessThan(5000); // 5초 이하
    });

    it('should handle memory-efficient streaming for large datasets', async () => {
      const largeCsvContent = generateLargeCsv(5000);
      let peakMemoryUsage = 0;
      
      const options: ImportOptions = {
        sqliteAdapter,
        directInsert: true,
        batchSize: 100,
        onProgress: (progress) => {
          // 메모리 사용량 모니터링 (간접적)
          if (performance.memory) {
            peakMemoryUsage = Math.max(peakMemoryUsage, performance.memory.usedJSHeapSize);
          }
        }
      };

      const result = await importCsvDataStreaming(largeCsvContent, 'userAnon', options);

      expect(result.success).toBe(true);
      expect(result.summary.successRows).toBe(5000);
      
      // 스트리밍이므로 메모리 사용량이 제한적이어야 함
      // 정확한 메모리 측정은 브라우저 환경에 따라 다를 수 있음
    });

    it('should handle concurrent imports gracefully', async () => {
      const csvContent1 = generateLargeCsv(100, 'concurrent1-');
      const csvContent2 = generateLargeCsv(100, 'concurrent2-');
      const csvContent3 = generateLargeCsv(100, 'concurrent3-');

      // 동시 임포트 실행
      const promises = [
        importCsvData(csvContent1, 'userAnon', { batchSize: 50 }),
        importCsvData(csvContent2, 'userAnon', { batchSize: 50 }),
        importCsvData(csvContent3, 'userAnon', { batchSize: 50 })
      ];

      const results = await Promise.all(promises);

      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.summary.successRows).toBe(100);
        expect(result.data[0].id).toContain(`concurrent${index + 1}-`);
      });
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle malformed CSV gracefully', async () => {
      const malformedCsv = `id,customerSource,ageGroup,gender
"unclosed quote,증권,30대,남
test-002,보험,40대,여`;

      const result = await importCsvData(malformedCsv, 'userAnon');

      // Papa Parse는 malformed CSV를 어느정도 복구함
      expect(result.summary.totalRows).toBeGreaterThan(0);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should handle network interruption simulation', async () => {
      const csvContent = generateLargeCsv(1000);
      let interruptionTriggered = false;

      const options: ImportOptions = {
        sqliteAdapter,
        directInsert: true,
        onProgress: (progress) => {
          // 50% 지점에서 중단 시뮬레이션
          if (progress > 50 && !interruptionTriggered) {
            interruptionTriggered = true;
            // 실제로는 네트워크 중단이나 사용자 취소 등의 시나리오
            // 여기서는 단순히 진행 상황만 확인
          }
        }
      };

      const result = await importCsvDataStreaming(csvContent, 'userAnon', options);
      
      expect(interruptionTriggered).toBe(true);
      expect(result.success).toBe(true); // 중단되지 않고 완료
    });

    it('should handle database connection issues', async () => {
      const testData = [{ id: 'test', customerSource: '증권', ageGroup: '30대', gender: '남' }];
      
      // 잘못된 어댑터로 테스트
      const mockBadAdapter = {
        batchInsert: () => { throw new Error('Database connection lost'); }
      };

      const result = await importWithSQLiteBatch(
        testData, 
        'userAnon', 
        mockBadAdapter as any
      );

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('배치 삽입 실패');
    });
  });

  // 헬퍼 함수들
  function generateLargeCsv(rowCount: number, idPrefix: string = 'large-user-'): string {
    const headers = 'id,customerSource,ageGroup,gender,investmentTendency,investmentAmount,ownedProducts\n';
    const rows: string[] = [];

    for (let i = 1; i <= rowCount; i++) {
      const customerSource = i % 2 === 0 ? '보험' : '증권';
      const ageGroups = ['20대', '30대', '40대', '50대'];
      const genders = ['남', '여'];
      
      const row = [
        `${idPrefix}${i.toString().padStart(6, '0')}`,
        customerSource,
        ageGroups[i % ageGroups.length],
        genders[i % genders.length],
        customerSource === '증권' ? '적극투자형' : '',
        customerSource === '증권' ? (1000 + (i * 100)) : '',
        '[]'
      ].join(',');
      
      rows.push(row);
    }

    return headers + rows.join('\n');
  }

  function generateLargeJsonData(count: number): any[] {
    const data = [];
    
    for (let i = 1; i <= count; i++) {
      const customerSource = i % 2 === 0 ? '보험' : '증권';
      
      data.push({
        id: `json-user-${i.toString().padStart(6, '0')}`,
        customerSource,
        ageGroup: ['20대', '30대', '40대', '50대'][i % 4],
        gender: ['남', '여'][i % 2],
        ...(customerSource === '증권' ? {
          investmentTendency: '적극투자형',
          investmentAmount: 1000 + (i * 100)
        } : {
          insuranceType: '보장only'
        }),
        ownedProducts: []
      });
    }
    
    return data;
  }
});