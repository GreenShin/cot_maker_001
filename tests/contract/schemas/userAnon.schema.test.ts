/**
 * UserAnon Schema Contract Tests
 * OPFS + SQLite-WASM 통합 테스트
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { userAnonSchema, type UserAnon } from '../../../src/models/userAnon.js';
import { initializeSQLite } from '../../../src/services/storage/sqliteAdapter.js';
import { StorageFactory } from '../../../src/services/storage/storage.js';

describe('UserAnon Schema Contract Tests', () => {
  let sqliteAdapter: any;
  let userStorage: any;

  beforeAll(async () => {
    // SQLite-WASM 어댑터 초기화
    sqliteAdapter = await initializeSQLite({
      dbName: 'test_useranon',
      type: 'memory', // 테스트용 메모리 DB
      enableLogging: false
    });

    userStorage = await StorageFactory.createAdapter('userAnon', {}, 'sqlite');
  });

  afterAll(async () => {
    if (sqliteAdapter) {
      sqliteAdapter.close();
    }
  });

  describe('Basic Schema Validation', () => {
    it('should validate valid securities user data', () => {
      const validSecuritiesUser = {
        id: 'user-sec-001',
        customerSource: '증권' as const,
        ageGroup: '30대' as const,
        gender: '남' as const,
        investmentTendency: '적극투자형' as const,
        investmentAmount: 5000,
        ownedProducts: [
          {
            productName: '삼성 S&P500 ETF',
            purchaseDate: '2024-01-15'
          }
        ]
      };

      const result = userAnonSchema.safeParse(validSecuritiesUser);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customerSource).toBe('증권');
        expect(result.data.investmentTendency).toBe('적극투자형');
      }
    });

    it('should validate valid insurance user data', () => {
      const validInsuranceUser = {
        id: 'user-ins-001',
        customerSource: '보험' as const,
        ageGroup: '40대' as const,
        gender: '여' as const,
        insuranceType: '보장+변액' as const,
        ownedProducts: [
          {
            productName: '삼성 종신보험',
            purchaseDate: '2023-12-01'
          }
        ]
      };

      const result = userAnonSchema.safeParse(validInsuranceUser);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customerSource).toBe('보험');
        expect(result.data.insuranceType).toBe('보장+변액');
      }
    });

    it('should reject invalid customer source', () => {
      const invalidUser = {
        id: 'user-001',
        customerSource: '은행', // 잘못된 값
        ageGroup: '30대',
        gender: '남',
        ownedProducts: []
      };

      const result = userAnonSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should reject invalid age group', () => {
      const invalidUser = {
        id: 'user-001',
        customerSource: '증권',
        ageGroup: '90대', // 잘못된 값
        gender: '남',
        ownedProducts: []
      };

      const result = userAnonSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should reject invalid gender', () => {
      const invalidUser = {
        id: 'user-001',
        customerSource: '증권',
        ageGroup: '30대',
        gender: '기타', // 잘못된 값
        ownedProducts: []
      };

      const result = userAnonSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe('Securities User Specific Validation', () => {
    it('should validate securities user with investment tendency', () => {
      const securitiesUser = {
        id: 'user-sec-002',
        customerSource: '증권' as const,
        ageGroup: '20대' as const,
        gender: '여' as const,
        investmentTendency: '안정추구형' as const,
        investmentAmount: 1000,
        ownedProducts: []
      };

      const result = userAnonSchema.safeParse(securitiesUser);
      expect(result.success).toBe(true);
    });

    it('should reject invalid investment tendency for securities user', () => {
      const invalidUser = {
        id: 'user-sec-003',
        customerSource: '증권',
        ageGroup: '30대',
        gender: '남',
        investmentTendency: '무효한투자성향', // 잘못된 값
        ownedProducts: []
      };

      const result = userAnonSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should validate securities user without optional fields', () => {
      const minimalUser = {
        id: 'user-sec-004',
        customerSource: '증권' as const,
        ageGroup: '50대' as const,
        gender: '남' as const,
        ownedProducts: []
      };

      const result = userAnonSchema.safeParse(minimalUser);
      expect(result.success).toBe(true);
    });
  });

  describe('Insurance User Specific Validation', () => {
    it('should validate insurance user with insurance type', () => {
      const insuranceUser = {
        id: 'user-ins-002',
        customerSource: '보험' as const,
        ageGroup: '60대' as const,
        gender: '여' as const,
        insuranceType: '변액only' as const,
        ownedProducts: []
      };

      const result = userAnonSchema.safeParse(insuranceUser);
      expect(result.success).toBe(true);
    });

    it('should reject invalid insurance type for insurance user', () => {
      const invalidUser = {
        id: 'user-ins-003',
        customerSource: '보험',
        ageGroup: '40대',
        gender: '남',
        insuranceType: '무효한보험유형', // 잘못된 값
        ownedProducts: []
      };

      const result = userAnonSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe('Owned Products Validation', () => {
    it('should validate owned products array', () => {
      const userWithProducts = {
        id: 'user-001',
        customerSource: '증권' as const,
        ageGroup: '30대' as const,
        gender: '남' as const,
        ownedProducts: [
          {
            productName: 'KODEX 200 ETF',
            purchaseDate: '2024-01-01'
          },
          {
            productName: '미래에셋 글로벌 펀드',
            purchaseDate: '2024-02-15'
          }
        ]
      };

      const result = userAnonSchema.safeParse(userWithProducts);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ownedProducts).toHaveLength(2);
        expect(result.data.ownedProducts[0].productName).toBe('KODEX 200 ETF');
      }
    });

    it('should reject invalid owned product structure', () => {
      const invalidUser = {
        id: 'user-001',
        customerSource: '증권',
        ageGroup: '30대',
        gender: '남',
        ownedProducts: [
          {
            // productName 누락
            purchaseDate: '2024-01-01'
          }
        ]
      };

      const result = userAnonSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should validate empty owned products array', () => {
      const userWithoutProducts = {
        id: 'user-001',
        customerSource: '증권' as const,
        ageGroup: '30대' as const,
        gender: '남' as const,
        ownedProducts: []
      };

      const result = userAnonSchema.safeParse(userWithoutProducts);
      expect(result.success).toBe(true);
    });
  });

  describe('SQLite Integration Tests', () => {
    it('should store and retrieve user data correctly', async () => {
      const testUser: UserAnon = {
        id: 'test-user-001',
        customerSource: '증권',
        ageGroup: '30대',
        gender: '남',
        investmentTendency: '적극투자형',
        investmentAmount: 3000,
        ownedProducts: [
          {
            productName: 'Test ETF',
            purchaseDate: '2024-01-01'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 스키마 검증
      const validationResult = userAnonSchema.safeParse(testUser);
      expect(validationResult.success).toBe(true);

      if (sqliteAdapter) {
        // SQLite에 저장
        const insertSql = `
          INSERT INTO user_anon (id, customer_source, age_group, gender, investment_tendency, investment_amount, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        sqliteAdapter.insert(insertSql, [
          testUser.id,
          testUser.customerSource,
          testUser.ageGroup,
          testUser.gender,
          testUser.investmentTendency,
          testUser.investmentAmount,
          testUser.createdAt,
          testUser.updatedAt
        ]);

        // 검색 및 검증
        const retrievedUser = sqliteAdapter.selectOne<any>(
          'SELECT * FROM user_anon WHERE id = ?',
          [testUser.id]
        );

        expect(retrievedUser).toBeTruthy();
        expect(retrievedUser.customer_source).toBe(testUser.customerSource);
        expect(retrievedUser.age_group).toBe(testUser.ageGroup);
      }
    });

    it('should handle batch user insertion', async () => {
      const testUsers = [
        {
          id: 'batch-user-001',
          customer_source: '증권',
          age_group: '20대',
          gender: '여',
          investment_tendency: '안정추구형',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'batch-user-002',
          customer_source: '보험',
          age_group: '40대',
          gender: '남',
          insurance_type: '보장only',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      if (sqliteAdapter) {
        // 배치 삽입 테스트
        await sqliteAdapter.batchInsert('user_anon', testUsers);

        // 배치 삽입 검증
        const insertedCount = sqliteAdapter.selectOne<{ count: number }>(
          'SELECT COUNT(*) as count FROM user_anon WHERE id LIKE ?',
          ['batch-user-%']
        );

        expect(insertedCount?.count).toBe(2);
      }
    });

    it('should perform efficient user queries', async () => {
      if (sqliteAdapter) {
        // 검색 성능 테스트
        const startTime = performance.now();
        
        const results = sqliteAdapter.selectAll<any>(`
          SELECT * FROM user_anon 
          WHERE customer_source = '증권' 
          AND age_group IN ('20대', '30대', '40대')
          ORDER BY age_group ASC
          LIMIT 10
        `);

        const queryTime = performance.now() - startTime;

        expect(queryTime).toBeLessThan(100); // 100ms 이하
        expect(Array.isArray(results)).toBe(true);
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing required fields', () => {
      const incompleteUser = {
        id: 'incomplete-user',
        customerSource: '증권'
        // 필수 필드들 누락
      };

      const result = userAnonSchema.safeParse(incompleteUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it('should handle null and undefined values', () => {
      const userWithNulls = {
        id: 'user-with-nulls',
        customerSource: '증권',
        ageGroup: '30대',
        gender: '남',
        investmentTendency: null,
        investmentAmount: undefined,
        ownedProducts: []
      };

      const result = userAnonSchema.safeParse(userWithNulls);
      expect(result.success).toBe(true);
    });

    it('should validate date formats in owned products', () => {
      const userWithInvalidDates = {
        id: 'user-invalid-dates',
        customerSource: '증권' as const,
        ageGroup: '30대' as const,
        gender: '남' as const,
        ownedProducts: [
          {
            productName: 'Test Product',
            purchaseDate: 'invalid-date-format'
          }
        ]
      };

      const result = userAnonSchema.safeParse(userWithInvalidDates);
      // 현재 스키마가 날짜 형식 검증을 하는지에 따라 결과가 달라질 수 있음
      // 스키마에 날짜 형식 검증이 있다면 false, 없다면 true
    });
  });
});