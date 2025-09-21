import { describe, it, expect } from 'vitest';
import { importCsvData, importJsonData } from '../../../src/services/io/importer';

describe('CSV/JSON Import Pipeline Contract', () => {
  it('should parse valid CSV with streaming', async () => {
    const csvContent = `id,customerSource,ageGroup,gender
user-1,증권,30대,남
user-2,보험,40대,여`;

    const result = await importCsvData(csvContent, 'userAnon');
    
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toMatchObject({
      id: 'user-1',
      customerSource: '증권',
      ageGroup: '30대',
      gender: '남'
    });
  });

  it('should parse valid JSON data', async () => {
    const jsonData = [
      {
        id: 'prod-1',
        productSource: '증권',
        productName: '삼성전자',
        productCategory: '주식형',
        taxType: '과세',
        riskLevel: '3'
      }
    ];

    const result = await importJsonData(jsonData, 'product');
    
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  it('should handle validation errors gracefully', async () => {
    const invalidCsv = `id,customerSource,ageGroup,gender
user-1,invalid,30대,남`;

    const result = await importCsvData(invalidCsv, 'userAnon');
    
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should provide progress callback for streaming', async () => {
    const largeCsv = Array.from({ length: 1000 }, (_, i) => 
      `user-${i},증권,30대,남`
    ).join('\n');
    const csvWithHeader = `id,customerSource,ageGroup,gender\n${largeCsv}`;

    const progressUpdates: number[] = [];
    
    await importCsvData(csvWithHeader, 'userAnon', {
      onProgress: (progress) => progressUpdates.push(progress)
    });

    expect(progressUpdates.length).toBeGreaterThan(0);
    expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
  });
});
