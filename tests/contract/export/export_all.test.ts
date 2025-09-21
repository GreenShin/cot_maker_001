import { describe, it, expect } from 'vitest';
import { exportToCsv, exportToJson, exportToXlsx } from '../../../src/services/io/exporter';

describe('Export Pipeline Contract', () => {
  const mockData = [
    {
      id: 'user-1',
      customerSource: '증권',
      ageGroup: '30대',
      gender: '남'
    },
    {
      id: 'user-2',
      customerSource: '보험',
      ageGroup: '40대',
      gender: '여'
    }
  ];

  it('should export data to CSV format', async () => {
    const result = await exportToCsv(mockData, 'userAnon');
    
    expect(result.success).toBe(true);
    expect(result.data).toContain('id,customerSource,ageGroup,gender');
    expect(result.data).toContain('user-1,증권,30대,남');
    expect(result.filename).toMatch(/userAnon_\d{8}_\d{6}\.csv/);
  });

  it('should export data to JSON format', async () => {
    const result = await exportToJson(mockData, 'userAnon');
    
    expect(result.success).toBe(true);
    const parsedData = JSON.parse(result.data);
    expect(Array.isArray(parsedData)).toBe(true);
    expect(parsedData).toHaveLength(2);
    expect(result.filename).toMatch(/userAnon_\d{8}_\d{6}\.json/);
  });

  it('should export data to XLSX format', async () => {
    const result = await exportToXlsx(mockData, 'userAnon');
    
    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(ArrayBuffer);
    expect(result.filename).toMatch(/userAnon_\d{8}_\d{6}\.xlsx/);
  });

  it('should handle large datasets with streaming', async () => {
    const largeData = Array.from({ length: 10000 }, (_, i) => ({
      id: `user-${i}`,
      customerSource: i % 2 === 0 ? '증권' : '보험',
      ageGroup: '30대',
      gender: i % 2 === 0 ? '남' : '여'
    }));

    const progressUpdates: number[] = [];
    
    const result = await exportToCsv(largeData, 'userAnon', {
      onProgress: (progress) => progressUpdates.push(progress)
    });

    expect(result.success).toBe(true);
    expect(progressUpdates.length).toBeGreaterThan(0);
  });

  it('should handle empty datasets', async () => {
    const result = await exportToCsv([], 'userAnon');
    
    expect(result.success).toBe(true);
    expect(result.data).toContain('id,customerSource,ageGroup,gender'); // Header only
  });
});
