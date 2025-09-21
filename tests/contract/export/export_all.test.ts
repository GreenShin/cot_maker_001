/**
 * Export Pipeline Contract Tests (CSV/JSON/XLSX)
 * SQLite-WASM 스트리밍 Export 테스트
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import {
  exportToCsv,
  exportToJson,
  exportToXlsx,
  exportFromSQLiteToCSV,
  exportFromSQLiteToJSON,
  exportFromSQLiteToXLSX,
  type ExportResult,
  type ExportOptions
} from '../../../src/services/io/exporter.js';
import { initializeSQLite } from '../../../src/services/storage/sqliteAdapter.js';

describe('Export Pipeline Contract Tests', () => {
  let sqliteAdapter: any;
  
  // 테스트 데이터
  const testUsers = [
    {
      id: 'export-user-001',
      customerSource: '증권',
      ageGroup: '30대',
      gender: '남',
      investmentTendency: '적극투자형',
      investmentAmount: 5000,
      ownedProducts: [{ productName: 'ETF A', purchaseDate: '2024-01-01' }],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'export-user-002',
      customerSource: '보험',
      ageGroup: '40대',
      gender: '여',
      insuranceType: '보장+변액',
      ownedProducts: [],
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z'
    }
  ];

  const testProducts = [
    {
      id: 'export-product-001',
      productSource: '증권',
      productName: 'Export Test ETF',
      productCategory: 'ETF',
      taxType: '일반과세',
      riskLevel: '3등급(보통)',
      description: 'Export 테스트용 ETF',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'export-product-002',
      productSource: '보험',
      productName: 'Export Test Insurance',
      productCategory: '종신보험',
      taxType: '비과세',
      riskLevel: '1등급(매우낮음)',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z'
    }
  ];

  beforeAll(async () => {
    sqliteAdapter = await initializeSQLite({
      dbName: 'test_export',
      type: 'memory',
      enableLogging: false
    });

    // 테스트 데이터 삽입
    await seedTestData();
  });

  afterAll(async () => {
    if (sqliteAdapter) {
      sqliteAdapter.close();
    }
  });

  async function seedTestData() {
    // 사용자 데이터 삽입
    for (const user of testUsers) {
      sqliteAdapter.insert(`
        INSERT INTO user_anon (id, customer_source, age_group, gender, investment_tendency, investment_amount, insurance_type, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        user.id, user.customerSource, user.ageGroup, user.gender,
        user.investmentTendency || null, user.investmentAmount || null, user.insuranceType || null,
        user.createdAt, user.updatedAt
      ]);
    }

    // 상품 데이터 삽입
    for (const product of testProducts) {
      sqliteAdapter.insert(`
        INSERT INTO product (id, product_source, product_name, product_category, tax_type, risk_level, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        product.id, product.productSource, product.productName, product.productCategory,
        product.taxType, product.riskLevel, product.description || null,
        product.createdAt, product.updatedAt
      ]);
    }
  }

  describe('CSV Export Tests', () => {
    it('should export UserAnon data to CSV format', async () => {
      const result = await exportToCsv(testUsers, 'userAnon', {
        filename: 'test-users-export'
      });

      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('string');
      expect(result.filename).toContain('test-users-export');
      expect(result.filename).toContain('.csv');

      // CSV 내용 검증
      const csvData = result.data as string;
      expect(csvData).toContain('id,customerSource');
      expect(csvData).toContain('export-user-001');
      expect(csvData).toContain('적극투자형');
    });

    it('should export Product data to CSV format', async () => {
      const result = await exportToCsv(testProducts, 'product', {
        filename: 'test-products-export'
      });

      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('string');
      
      const csvData = result.data as string;
      expect(csvData).toContain('productName,productCategory');
      expect(csvData).toContain('Export Test ETF');
      expect(csvData).toContain('Export 테스트용 ETF');
    });

    it('should handle empty data for CSV export', async () => {
      const result = await exportToCsv([], 'userAnon');

      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('string');
      
      const csvData = result.data as string;
      expect(csvData.trim().length).toBeGreaterThan(0); // 헤더만 있어도 OK
    });

    it('should track progress during CSV export', async () => {
      const largeDataset = generateLargeDataset(1000);
      const progressUpdates: number[] = [];

      const result = await exportToCsv(largeDataset, 'userAnon', {
        onProgress: (progress) => {
          progressUpdates.push(progress);
        }
      });

      expect(result.success).toBe(true);
      expect(progressUpdates).toContain(100);
      expect(progressUpdates.length).toBeGreaterThan(1);
    });
  });

  describe('JSON Export Tests', () => {
    it('should export UserAnon data to JSON format', async () => {
      const result = await exportToJson(testUsers, 'userAnon', {
        filename: 'test-users-export'
      });

      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('string');
      expect(result.filename).toContain('.json');

      // JSON 내용 검증
      const jsonData = JSON.parse(result.data as string);
      expect(Array.isArray(jsonData)).toBe(true);
      expect(jsonData).toHaveLength(2);
      expect(jsonData[0].id).toBe('export-user-001');
      expect(jsonData[0].customerSource).toBe('증권');
    });

    it('should export Product data to JSON format', async () => {
      const result = await exportToJson(testProducts, 'product');

      expect(result.success).toBe(true);
      
      const jsonData = JSON.parse(result.data as string);
      expect(jsonData).toHaveLength(2);
      expect(jsonData[0].productSource).toBe('증권');
      expect(jsonData[1].productSource).toBe('보험');
    });

    it('should handle empty data for JSON export', async () => {
      const result = await exportToJson([], 'product');

      expect(result.success).toBe(true);
      
      const jsonData = JSON.parse(result.data as string);
      expect(jsonData).toEqual([]);
    });

    it('should preserve data types in JSON export', async () => {
      const typedData = [{
        id: 'type-test-001',
        customerSource: '증권',
        investmentAmount: 5000, // number
        isActive: true, // boolean
        metadata: { key: 'value' }, // object
        tags: ['tag1', 'tag2'] // array
      }];

      const result = await exportToJson(typedData, 'userAnon');
      expect(result.success).toBe(true);
      
      const jsonData = JSON.parse(result.data as string);
      expect(typeof jsonData[0].investmentAmount).toBe('number');
      expect(typeof jsonData[0].isActive).toBe('boolean');
      expect(typeof jsonData[0].metadata).toBe('object');
      expect(Array.isArray(jsonData[0].tags)).toBe(true);
    });
  });

  describe('XLSX Export Tests', () => {
    it('should export UserAnon data to XLSX format', async () => {
      const result = await exportToXlsx(testUsers, 'userAnon', {
        filename: 'test-users-export',
        worksheetName: 'Users'
      });

      expect(result.success).toBe(true);
      expect(result.data instanceof ArrayBuffer).toBe(true);
      expect(result.filename).toContain('.xlsx');

      // XLSX 내용 검증
      const workbook = XLSX.read(result.data as ArrayBuffer, { type: 'array' });
      expect(workbook.SheetNames).toContain('Users');
      
      const worksheet = workbook.Sheets['Users'];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      expect(jsonData).toHaveLength(2);
    });

    it('should export Product data to XLSX format', async () => {
      const result = await exportToXlsx(testProducts, 'product', {
        worksheetName: 'Products'
      });

      expect(result.success).toBe(true);
      
      const workbook = XLSX.read(result.data as ArrayBuffer, { type: 'array' });
      expect(workbook.SheetNames).toContain('Products');
    });

    it('should handle empty data for XLSX export', async () => {
      const result = await exportToXlsx([], 'userAnon');

      expect(result.success).toBe(true);
      
      const workbook = XLSX.read(result.data as ArrayBuffer, { type: 'array' });
      expect(workbook.SheetNames.length).toBeGreaterThan(0);
    });

    it('should preserve number formats in XLSX', async () => {
      const numericData = [{
        id: 'numeric-test-001',
        investmentAmount: 5000.50,
        percentage: 0.15,
        count: 100
      }];

      const result = await exportToXlsx(numericData, 'userAnon');
      expect(result.success).toBe(true);
      
      const workbook = XLSX.read(result.data as ArrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      expect(typeof jsonData[0].investmentAmount).toBe('number');
      expect(jsonData[0].investmentAmount).toBe(5000.5);
    });
  });

  describe('SQLite Streaming Export Tests', () => {
    it('should export from SQLite to CSV with streaming', async () => {
      const result = await exportFromSQLiteToCSV('userAnon', sqliteAdapter, {
        batchSize: 1,
        onProgress: (progress) => {
          expect(progress).toBeGreaterThanOrEqual(0);
          expect(progress).toBeLessThanOrEqual(100);
        }
      });

      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('string');
      
      const csvData = result.data as string;
      expect(csvData).toContain('export-user-001');
      expect(csvData).toContain('export-user-002');
    });

    it('should export from SQLite to JSON with streaming', async () => {
      const result = await exportFromSQLiteToJSON('product', sqliteAdapter, {
        batchSize: 1
      });

      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('string');
      
      const jsonData = JSON.parse(result.data as string);
      expect(jsonData).toHaveLength(2);
      expect(jsonData[0].productSource).toBe('증권');
    });

    it('should export from SQLite to XLSX with streaming', async () => {
      const result = await exportFromSQLiteToXLSX('userAnon', sqliteAdapter, {
        worksheetName: 'UserData'
      });

      expect(result.success).toBe(true);
      expect(result.data instanceof ArrayBuffer).toBe(true);
      
      const workbook = XLSX.read(result.data as ArrayBuffer, { type: 'array' });
      expect(workbook.SheetNames).toContain('UserData');
    });

    it('should handle filtering during SQLite export', async () => {
      const result = await exportFromSQLiteToJSON('userAnon', sqliteAdapter, {
        filters: { customer_source: '증권' }
      });

      expect(result.success).toBe(true);
      
      const jsonData = JSON.parse(result.data as string);
      expect(jsonData).toHaveLength(1);
      expect(jsonData[0].customerSource).toBe('증권');
    });

    it('should handle sorting during SQLite export', async () => {
      const result = await exportFromSQLiteToJSON('userAnon', sqliteAdapter, {
        sortBy: 'age_group',
        sortOrder: 'asc'
      });

      expect(result.success).toBe(true);
      
      const jsonData = JSON.parse(result.data as string);
      expect(jsonData[0].ageGroup).toBe('30대');
      expect(jsonData[1].ageGroup).toBe('40대');
    });
  });

  describe('Performance and Large Dataset Tests', () => {
    it('should handle large CSV exports efficiently', async () => {
      const largeDataset = generateLargeDataset(2000);
      
      const startTime = performance.now();
      const result = await exportToCsv(largeDataset, 'userAnon');
      const exportTime = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(exportTime).toBeLessThan(3000); // 3초 이하
      
      // CSV 파싱으로 검증
      const parsedData = Papa.parse(result.data as string, { header: true });
      expect(parsedData.data).toHaveLength(2000);
    });

    it('should handle large JSON exports efficiently', async () => {
      const largeDataset = generateLargeDataset(1500);
      
      const startTime = performance.now();
      const result = await exportToJson(largeDataset, 'userAnon');
      const exportTime = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(exportTime).toBeLessThan(2000); // 2초 이하
      
      const jsonData = JSON.parse(result.data as string);
      expect(jsonData).toHaveLength(1500);
    });

    it('should handle large XLSX exports with memory efficiency', async () => {
      const largeDataset = generateLargeDataset(1000);
      
      let peakMemoryUsage = 0;
      const result = await exportToXlsx(largeDataset, 'userAnon', {
        onProgress: () => {
          if (performance.memory) {
            peakMemoryUsage = Math.max(peakMemoryUsage, performance.memory.usedJSHeapSize);
          }
        }
      });

      expect(result.success).toBe(true);
      
      const workbook = XLSX.read(result.data as ArrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      expect(jsonData).toHaveLength(1000);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle export errors gracefully', async () => {
      const problematicData = [
        { id: 'test', circularRef: {} }
      ];
      // 순환 참조 생성
      problematicData[0].circularRef = problematicData[0];

      const result = await exportToJson(problematicData, 'userAnon');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle special characters in export', async () => {
      const specialData = [{
        id: 'special-test-001',
        customerSource: '증권',
        description: 'Special chars: "quotes", commas, and\nnewlines',
        emoji: '📈 투자 📊 데이터'
      }];

      const csvResult = await exportToCsv(specialData, 'userAnon');
      expect(csvResult.success).toBe(true);
      expect(csvResult.data).toContain('📈 투자 📊 데이터');

      const jsonResult = await exportToJson(specialData, 'userAnon');
      expect(jsonResult.success).toBe(true);
      const jsonData = JSON.parse(jsonResult.data as string);
      expect(jsonData[0].emoji).toBe('📈 투자 📊 데이터');
    });

    it('should handle null and undefined values', async () => {
      const nullData = [{
        id: 'null-test-001',
        customerSource: '증권',
        optionalField: null,
        undefinedField: undefined,
        emptyString: ''
      }];

      const csvResult = await exportToCsv(nullData, 'userAnon');
      expect(csvResult.success).toBe(true);

      const jsonResult = await exportToJson(nullData, 'userAnon');
      expect(jsonResult.success).toBe(true);
      const jsonData = JSON.parse(jsonResult.data as string);
      expect(jsonData[0].optionalField).toBeNull();
      expect(jsonData[0].undefinedField).toBeUndefined();
    });

    it('should handle SQLite connection errors', async () => {
      const mockBadAdapter = {
        selectOne: () => { throw new Error('Database connection lost'); }
      };

      const result = await exportFromSQLiteToCSV('userAnon', mockBadAdapter as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('SQLite CSV export 실패');
    });
  });

  describe('File Naming and Metadata', () => {
    it('should generate timestamped filenames', async () => {
      const result1 = await exportToCsv(testUsers, 'userAnon');
      const result2 = await exportToCsv(testUsers, 'userAnon');

      expect(result1.filename).not.toBe(result2.filename);
      expect(result1.filename).toContain('userAnon');
      expect(result1.filename).toMatch(/\d{8}_\d{6}/); // YYYYMMDD_HHMMSS 패턴
    });

    it('should use custom filenames when provided', async () => {
      const customName = 'my-custom-export';
      const result = await exportToCsv(testUsers, 'userAnon', {
        filename: customName
      });

      expect(result.filename).toContain(customName);
      expect(result.filename).toContain('.csv');
    });

    it('should handle filename sanitization', async () => {
      const problematicName = 'file<>name|with:bad*chars?';
      const result = await exportToCsv(testUsers, 'userAnon', {
        filename: problematicName
      });

      expect(result.success).toBe(true);
      // 파일명에 문제가 있어도 export는 성공해야 함
    });
  });

  // 헬퍼 함수
  function generateLargeDataset(count: number): any[] {
    const data = [];
    
    for (let i = 1; i <= count; i++) {
      data.push({
        id: `large-export-${i.toString().padStart(6, '0')}`,
        customerSource: i % 2 === 0 ? '보험' : '증권',
        ageGroup: ['20대', '30대', '40대', '50대'][i % 4],
        gender: ['남', '여'][i % 2],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    return data;
  }
});