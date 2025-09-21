/**
 * Product Schema Contract Tests
 * OPFS + SQLite-WASM 통합 테스트
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { productSchema, type Product } from '../../../src/models/product.js';
import { initializeSQLite } from '../../../src/services/storage/sqliteAdapter.js';
import { StorageFactory } from '../../../src/services/storage/storage.js';

describe('Product Schema Contract Tests', () => {
  let sqliteAdapter: any;
  let productStorage: any;

  beforeAll(async () => {
    // SQLite-WASM 어댑터 초기화
    sqliteAdapter = await initializeSQLite({
      dbName: 'test_product',
      type: 'memory',
      enableLogging: false
    });

    productStorage = await StorageFactory.createAdapter('product', {}, 'sqlite');
  });

  afterAll(async () => {
    if (sqliteAdapter) {
      sqliteAdapter.close();
    }
  });

  describe('Basic Schema Validation', () => {
    it('should validate valid securities product', () => {
      const validSecuritiesProduct = {
        id: 'product-sec-001',
        productSource: '증권' as const,
        productName: '삼성 S&P500 ETF',
        productCategory: 'ETF' as const,
        taxType: '일반과세' as const,
        riskLevel: '3등급(보통)' as const,
        description: '미국 S&P500 지수를 추종하는 ETF 상품입니다.',
        managementCompany: '삼성자산운용',
        expectedReturn: '연 8-12%'
      };

      const result = productSchema.safeParse(validSecuritiesProduct);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.productSource).toBe('증권');
        expect(result.data.productCategory).toBe('ETF');
        expect(result.data.description).toBeDefined();
      }
    });

    it('should validate valid insurance product', () => {
      const validInsuranceProduct = {
        id: 'product-ins-001',
        productSource: '보험' as const,
        productName: '삼성 종신보험',
        productCategory: '종신보험' as const,
        taxType: '비과세' as const,
        riskLevel: '1등급(매우낮음)' as const,
        managementCompany: '삼성생명',
        expectedReturn: '연 3-5%'
      };

      const result = productSchema.safeParse(validInsuranceProduct);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.productSource).toBe('보험');
        expect(result.data.productCategory).toBe('종신보험');
        expect(result.data.description).toBeUndefined();
      }
    });

    it('should reject invalid product source', () => {
      const invalidProduct = {
        id: 'product-001',
        productSource: '은행', // 잘못된 값
        productName: '상품명',
        productCategory: 'ETF',
        taxType: '일반과세',
        riskLevel: '3등급(보통)'
      };

      const result = productSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it('should require all mandatory fields', () => {
      const incompleteProduct = {
        id: 'product-002',
        productSource: '증권',
        productName: '상품명'
        // 필수 필드들 누락
      };

      const result = productSchema.safeParse(incompleteProduct);
      expect(result.success).toBe(false);
    });
  });

  describe('Securities Product Category Validation', () => {
    const securitiesCategories = ['ETF', '펀드', '주식', '채권', 'ELS', 'DLS'];

    securitiesCategories.forEach(category => {
      it(`should validate securities product with category: ${category}`, () => {
        const product = {
          id: `product-sec-${category}`,
          productSource: '증권' as const,
          productName: `${category} 상품`,
          productCategory: category,
          taxType: '일반과세' as const,
          riskLevel: '3등급(보통)' as const,
          description: `${category} 상품 설명`
        };

        const result = productSchema.safeParse(product);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid securities category', () => {
      const invalidProduct = {
        id: 'product-sec-invalid',
        productSource: '증권',
        productName: '상품명',
        productCategory: '종신보험', // 보험 카테고리를 증권에 사용
        taxType: '일반과세',
        riskLevel: '3등급(보통)'
      };

      const result = productSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });
  });

  describe('Insurance Product Category Validation', () => {
    const insuranceCategories = ['종신보험', '정기보험', '변액보험', '연금보험', '실손보험', '암보험'];

    insuranceCategories.forEach(category => {
      it(`should validate insurance product with category: ${category}`, () => {
        const product = {
          id: `product-ins-${category}`,
          productSource: '보험' as const,
          productName: `${category} 상품`,
          productCategory: category,
          taxType: '비과세' as const,
          riskLevel: '1등급(매우낮음)' as const
        };

        const result = productSchema.safeParse(product);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid insurance category', () => {
      const invalidProduct = {
        id: 'product-ins-invalid',
        productSource: '보험',
        productName: '상품명',
        productCategory: 'ETF', // 증권 카테고리를 보험에 사용
        taxType: '비과세',
        riskLevel: '1등급(매우낮음)'
      };

      const result = productSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });
  });

  describe('Tax Type Validation', () => {
    const validTaxTypes = ['일반과세', '비과세', '세금우대', '연금저축'];

    validTaxTypes.forEach(taxType => {
      it(`should validate tax type: ${taxType}`, () => {
        const product = {
          id: `product-tax-${taxType}`,
          productSource: '증권' as const,
          productName: '테스트 상품',
          productCategory: 'ETF' as const,
          taxType: taxType as any,
          riskLevel: '3등급(보통)' as const
        };

        const result = productSchema.safeParse(product);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid tax type', () => {
      const invalidProduct = {
        id: 'product-invalid-tax',
        productSource: '증권',
        productName: '상품명',
        productCategory: 'ETF',
        taxType: '면세', // 잘못된 값
        riskLevel: '3등급(보통)'
      };

      const result = productSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });
  });

  describe('Risk Level Validation', () => {
    const validRiskLevels = [
      '1등급(매우낮음)',
      '2등급(낮음)',
      '3등급(보통)',
      '4등급(높음)',
      '5등급(매우높음)',
      '6등급(매우높음)'
    ];

    validRiskLevels.forEach(riskLevel => {
      it(`should validate risk level: ${riskLevel}`, () => {
        const product = {
          id: `product-risk-${riskLevel}`,
          productSource: '증권' as const,
          productName: '테스트 상품',
          productCategory: 'ETF' as const,
          taxType: '일반과세' as const,
          riskLevel: riskLevel as any
        };

        const result = productSchema.safeParse(product);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid risk level', () => {
      const invalidProduct = {
        id: 'product-invalid-risk',
        productSource: '증권',
        productName: '상품명',
        productCategory: 'ETF',
        taxType: '일반과세',
        riskLevel: '7등급' // 잘못된 값
      };

      const result = productSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });
  });

  describe('Optional Fields Validation', () => {
    it('should validate product without optional fields', () => {
      const minimalProduct = {
        id: 'product-minimal',
        productSource: '보험' as const,
        productName: '최소 보험상품',
        productCategory: '종신보험' as const,
        taxType: '비과세' as const,
        riskLevel: '1등급(매우낮음)' as const
      };

      const result = productSchema.safeParse(minimalProduct);
      expect(result.success).toBe(true);
    });

    it('should validate product with all optional fields', () => {
      const fullProduct = {
        id: 'product-full',
        productSource: '증권' as const,
        productName: '완전한 증권상품',
        productCategory: '펀드' as const,
        taxType: '세금우대' as const,
        riskLevel: '4등급(높음)' as const,
        description: '상세한 상품 설명입니다.',
        managementCompany: '테스트 운용사',
        expectedReturn: '연 10-15%',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const result = productSchema.safeParse(fullProduct);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('상세한 상품 설명입니다.');
        expect(result.data.managementCompany).toBe('테스트 운용사');
      }
    });
  });

  describe('SQLite Integration Tests', () => {
    it('should store and retrieve product data correctly', async () => {
      const testProduct: Product = {
        id: 'test-product-001',
        productSource: '증권',
        productName: 'SQLite 테스트 ETF',
        productCategory: 'ETF',
        taxType: '일반과세',
        riskLevel: '3등급(보통)',
        description: 'SQLite 통합 테스트용 ETF 상품',
        managementCompany: '테스트 운용',
        expectedReturn: '연 8%',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 스키마 검증
      const validationResult = productSchema.safeParse(testProduct);
      expect(validationResult.success).toBe(true);

      if (sqliteAdapter) {
        // SQLite에 저장
        const insertSql = `
          INSERT INTO product (id, product_source, product_name, product_category, tax_type, risk_level, description, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        sqliteAdapter.insert(insertSql, [
          testProduct.id,
          testProduct.productSource,
          testProduct.productName,
          testProduct.productCategory,
          testProduct.taxType,
          testProduct.riskLevel,
          testProduct.description,
          testProduct.createdAt,
          testProduct.updatedAt
        ]);

        // 검색 및 검증
        const retrievedProduct = sqliteAdapter.selectOne<any>(
          'SELECT * FROM product WHERE id = ?',
          [testProduct.id]
        );

        expect(retrievedProduct).toBeTruthy();
        expect(retrievedProduct.product_source).toBe(testProduct.productSource);
        expect(retrievedProduct.product_name).toBe(testProduct.productName);
        expect(retrievedProduct.product_category).toBe(testProduct.productCategory);
      }
    });

    it('should perform product category filtering', async () => {
      if (sqliteAdapter) {
        // 테스트 데이터 삽입
        const testProducts = [
          {
            id: 'filter-test-etf',
            product_source: '증권',
            product_name: 'Filter Test ETF',
            product_category: 'ETF',
            tax_type: '일반과세',
            risk_level: '3등급(보통)',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'filter-test-fund',
            product_source: '증권',
            product_name: 'Filter Test Fund',
            product_category: '펀드',
            tax_type: '세금우대',
            risk_level: '4등급(높음)',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'filter-test-insurance',
            product_source: '보험',
            product_name: 'Filter Test Insurance',
            product_category: '종신보험',
            tax_type: '비과세',
            risk_level: '1등급(매우낮음)',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        await sqliteAdapter.batchInsert('product', testProducts);

        // 카테고리별 필터링 테스트
        const etfProducts = sqliteAdapter.selectAll<any>(
          'SELECT * FROM product WHERE product_category = ?',
          ['ETF']
        );

        const insuranceProducts = sqliteAdapter.selectAll<any>(
          'SELECT * FROM product WHERE product_source = ?',
          ['보험']
        );

        expect(etfProducts.length).toBeGreaterThan(0);
        expect(insuranceProducts.length).toBeGreaterThan(0);
        
        etfProducts.forEach(product => {
          expect(product.product_category).toBe('ETF');
        });

        insuranceProducts.forEach(product => {
          expect(product.product_source).toBe('보험');
        });
      }
    });

    it('should perform risk level sorting and filtering', async () => {
      if (sqliteAdapter) {
        // 위험등급별 정렬 테스트
        const riskSortedProducts = sqliteAdapter.selectAll<any>(`
          SELECT * FROM product 
          WHERE risk_level IN ('1등급(매우낮음)', '3등급(보통)', '4등급(높음)')
          ORDER BY 
            CASE risk_level
              WHEN '1등급(매우낮음)' THEN 1
              WHEN '2등급(낮음)' THEN 2
              WHEN '3등급(보통)' THEN 3
              WHEN '4등급(높음)' THEN 4
              WHEN '5등급(매우높음)' THEN 5
              WHEN '6등급(매우높음)' THEN 6
            END
        `);

        if (riskSortedProducts.length >= 2) {
          // 정렬이 올바르게 되었는지 확인
          const firstRisk = riskSortedProducts[0].risk_level;
          const lastRisk = riskSortedProducts[riskSortedProducts.length - 1].risk_level;
          
          const riskOrder = ['1등급(매우낮음)', '2등급(낮음)', '3등급(보통)', '4등급(높음)', '5등급(매우높음)', '6등급(매우높음)'];
          const firstIndex = riskOrder.indexOf(firstRisk);
          const lastIndex = riskOrder.indexOf(lastRisk);
          
          expect(firstIndex).toBeLessThanOrEqual(lastIndex);
        }
      }
    });

    it('should handle product name text search', async () => {
      if (sqliteAdapter) {
        // 텍스트 검색 테스트
        const searchResults = sqliteAdapter.selectAll<any>(
          'SELECT * FROM product WHERE product_name LIKE ? OR description LIKE ?',
          ['%Test%', '%Test%']
        );

        expect(Array.isArray(searchResults)).toBe(true);
        
        searchResults.forEach(product => {
          const hasTestInName = product.product_name?.includes('Test');
          const hasTestInDesc = product.description?.includes('Test');
          expect(hasTestInName || hasTestInDesc).toBe(true);
        });
      }
    });
  });

  describe('Data Integrity and Constraints', () => {
    it('should enforce unique product IDs', async () => {
      if (sqliteAdapter) {
        const duplicateProduct1 = {
          id: 'duplicate-product-id',
          product_source: '증권',
          product_name: 'First Product',
          product_category: 'ETF',
          tax_type: '일반과세',
          risk_level: '3등급(보통)',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const duplicateProduct2 = {
          id: 'duplicate-product-id', // 같은 ID
          product_source: '보험',
          product_name: 'Second Product',
          product_category: '종신보험',
          tax_type: '비과세',
          risk_level: '1등급(매우낮음)',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // 첫 번째 상품 삽입
        const insertSql = `
          INSERT INTO product (id, product_source, product_name, product_category, tax_type, risk_level, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        sqliteAdapter.insert(insertSql, Object.values(duplicateProduct1));

        // 두 번째 상품 삽입 (같은 ID) - 실패해야 함
        expect(() => {
          sqliteAdapter.insert(insertSql, Object.values(duplicateProduct2));
        }).toThrow(); // UNIQUE constraint 위반
      }
    });

    it('should handle NULL values in optional fields', () => {
      const productWithNulls = {
        id: 'product-with-nulls',
        productSource: '증권' as const,
        productName: '널값 테스트 상품',
        productCategory: 'ETF' as const,
        taxType: '일반과세' as const,
        riskLevel: '3등급(보통)' as const,
        description: null,
        managementCompany: undefined,
        expectedReturn: null
      };

      const result = productSchema.safeParse(productWithNulls);
      expect(result.success).toBe(true);
    });
  });
});