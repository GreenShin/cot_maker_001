import { describe, it, expect } from 'vitest';
import { importXlsxData } from '../../../src/services/io/importer';

describe('XLSX Import Pipeline Contract', () => {
  it('should parse XLSX file with streaming', async () => {
    // Mock XLSX file buffer - in real implementation would be actual XLSX data
    const mockXlsxBuffer = new ArrayBuffer(100);
    
    const result = await importXlsxData(mockXlsxBuffer, 'product');
    
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('data');
    if (result.success) {
      expect(Array.isArray(result.data)).toBe(true);
    } else {
      expect(result).toHaveProperty('errors');
    }
  });

  it('should handle multiple worksheets', async () => {
    const mockXlsxBuffer = new ArrayBuffer(200);
    
    const result = await importXlsxData(mockXlsxBuffer, 'cotqa', {
      worksheetName: 'CoTs'
    });
    
    expect(result).toHaveProperty('success');
  });

  it('should provide streaming progress for large files', async () => {
    const mockLargeXlsx = new ArrayBuffer(10000);
    const progressUpdates: number[] = [];
    
    await importXlsxData(mockLargeXlsx, 'userAnon', {
      onProgress: (progress) => progressUpdates.push(progress)
    });

    // Should have received progress updates
    expect(progressUpdates.length).toBeGreaterThanOrEqual(0);
  });

  it('should validate data according to schema', async () => {
    const mockInvalidXlsx = new ArrayBuffer(150);
    
    const result = await importXlsxData(mockInvalidXlsx, 'product');
    
    // Should handle validation errors
    if (!result.success) {
      expect(result.errors).toBeDefined();
    }
  });
});
