/**
 * Import Pipeline Contract Tests (XLSX)
 * SheetJS + SQLite-WASM 스트리밍 Import 테스트
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import { 
  importXlsxData,
  importWithSQLiteBatch,
  type ImportResult,
  type ImportOptions
} from '../../../src/services/io/importer.js';
import { initializeSQLite } from '../../../src/services/storage/sqliteAdapter.js';

describe('Import Pipeline Contract Tests (XLSX)', () => {
  let sqliteAdapter: any;

  beforeAll(async () => {
    sqliteAdapter = await initializeSQLite({
      dbName: 'test_import_xlsx',
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
      try {
        sqliteAdapter.execute('DELETE FROM user_anon WHERE id LIKE ?', ['xlsx-test-%']);
        sqliteAdapter.execute('DELETE FROM product WHERE id LIKE ?', ['xlsx-test-%']);
        sqliteAdapter.execute('DELETE FROM cotqa WHERE id LIKE ?', ['xlsx-test-%']);
      } catch (error) {
        // 테이블이 없는 경우 무시
      }
    }
  });

  describe('XLSX Basic Import Tests', () => {
    it('should import UserAnon XLSX data successfully', async () => {
      const xlsxBuffer = createTestXLSXBuffer([
        {
          id: 'xlsx-test-user-001',
          customerSource: '증권',
          ageGroup: '30대',
          gender: '남',
          investmentTendency: '적극투자형',
          investmentAmount: 5000,
          ownedProducts: JSON.stringify([{
            productName: '삼성 S&P500 ETF',
            purchaseDate: '2024-01-15'
          }])
        }
      ]);

      const result = await importXlsxData<any>(xlsxBuffer, 'userAnon');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.data[0].id).toBe('xlsx-test-user-001');
    });

    it('should import Product XLSX data successfully', async () => {
      const xlsxBuffer = createTestXLSXBuffer([
        {
          id: 'xlsx-test-product-001',
          productSource: '증권',
          productName: 'XLSX 테스트 ETF',
          productCategory: 'ETF',
          taxType: '일반과세',
          riskLevel: '3등급(보통)',
          description: 'XLSX로 임포트된 ETF 상품'
        }
      ]);

      const result = await importXlsxData<any>(xlsxBuffer, 'product');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].productSource).toBe('증권');
      expect(result.data[0].description).toBe('XLSX로 임포트된 ETF 상품');
    });

    it('should handle empty XLSX files', async () => {
      const emptyXlsxBuffer = createTestXLSXBuffer([]);

      const result = await importXlsxData<any>(emptyXlsxBuffer, 'userAnon');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.summary.totalRows).toBe(0);
    });

    it('should handle validation errors in XLSX data', async () => {
      const invalidXlsxBuffer = createTestXLSXBuffer([
        {
          id: 'invalid-001',
          customerSource: '은행', // 잘못된 값
          ageGroup: '30대',
          gender: '남'
        },
        {
          id: 'valid-001',
          customerSource: '증권',
          ageGroup: '30대',
          gender: '남'
        }
      ]);

      const result = await importXlsxData<any>(invalidXlsxBuffer, 'userAnon');

      expect(result.success).toBe(false);
      expect(result.summary.successRows).toBe(1);
      expect(result.summary.errorRows).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('XLSX Format Handling Tests', () => {
    it('should handle Excel number formats', async () => {
      const xlsxBuffer = createTestXLSXBuffer([
        {
          id: 'number-test-001',
          customerSource: '증권',
          ageGroup: '30대',
          gender: '남',
          investmentAmount: 5000.50
        }
      ]);

      const result = await importXlsxData<any>(xlsxBuffer, 'userAnon');

      expect(result.success).toBe(true);
      expect(typeof result.data[0].investmentAmount).toBe('number');
      expect(result.data[0].investmentAmount).toBe(5000.5);
    });

    it('should handle worksheet selection', async () => {
      const multiSheetBuffer = createMultiSheetXLSXBuffer({
        'Users': [
          { id: 'user-sheet-001', customerSource: '증권', ageGroup: '30대', gender: '남' }
        ],
        'Products': [
          { id: 'product-sheet-001', productSource: '증권', productName: '테스트', productCategory: 'ETF', taxType: '일반과세', riskLevel: '3등급(보통)' }
        ]
      });

      const result = await importXlsxData<any>(multiSheetBuffer, 'product', {
        worksheetName: 'Products'
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('product-sheet-001');
    });

    it('should handle missing worksheet gracefully', async () => {
      const xlsxBuffer = createTestXLSXBuffer([
        { id: 'test-001', customerSource: '증권', ageGroup: '30대', gender: '남' }
      ]);

      const result = await importXlsxData<any>(xlsxBuffer, 'userAnon', {
        worksheetName: 'NonExistentSheet'
      });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('NonExistentSheet');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large XLSX files efficiently', async () => {
      const largeDataset = generateLargeDataset(1000);
      const xlsxBuffer = createTestXLSXBuffer(largeDataset);

      const startTime = performance.now();
      const result = await importXlsxData<any>(xlsxBuffer, 'userAnon');
      const importTime = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1000);
      expect(importTime).toBeLessThan(5000); // 5초 이하
    });

    it('should track progress during import', async () => {
      const largeDataset = generateLargeDataset(500);
      const xlsxBuffer = createTestXLSXBuffer(largeDataset);
      
      const progressUpdates: number[] = [];
      
      const result = await importXlsxData<any>(xlsxBuffer, 'userAnon', {
        onProgress: (progress) => {
          progressUpdates.push(progress);
        }
      });

      expect(result.success).toBe(true);
      expect(progressUpdates).toContain(100);
      expect(progressUpdates.length).toBeGreaterThan(1);
    });
  });

  // 헬퍼 함수들
  function createTestXLSXBuffer(data: any[], sheetName: string = 'Sheet1'): ArrayBuffer {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  }

  function createMultiSheetXLSXBuffer(sheets: Record<string, any[]>): ArrayBuffer {
    const workbook = XLSX.utils.book_new();
    
    Object.entries(sheets).forEach(([sheetName, data]) => {
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    
    return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  }

  function generateLargeDataset(count: number): any[] {
    const data = [];
    
    for (let i = 1; i <= count; i++) {
      const customerSource = i % 2 === 0 ? '보험' : '증권';
      
      data.push({
        id: `large-xlsx-${i.toString().padStart(6, '0')}`,
        customerSource,
        ageGroup: ['20대', '30대', '40대', '50대'][i % 4],
        gender: ['남', '여'][i % 2],
        ownedProducts: '[]'
      });
    }
    
    return data;
  }
});