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
    
    // Convert Uint8Array to string if needed
    const csvString = result.data instanceof Uint8Array 
      ? new TextDecoder().decode(result.data)
      : result.data as string;
    
    expect(csvString).toContain('id,customerSource,ageGroup,gender');
    expect(csvString).toContain('user-1,증권,30대,남');
    expect(result.filename).toMatch(/userAnon_\d{8}_\d{6}\.csv/);
  });

  it('should export data to JSON format', async () => {
    const result = await exportToJson(mockData, 'userAnon');
    
    expect(result.success).toBe(true);
    expect(typeof result.data).toBe('string');
    const parsedData = JSON.parse(result.data as string);
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
    
    // Convert Uint8Array to string if needed
    const csvString = result.data instanceof Uint8Array 
      ? new TextDecoder().decode(result.data)
      : result.data as string;
    
    expect(csvString).toContain('id,customerSource,ageGroup,gender'); // Header only
  });

  describe('CoT Export with Field Mapping', () => {
    const mockCotData = [
      {
        id: 'cot-001',
        productSource: '증권',
        questionType: '투자성향 및 조건 기반형',
        questioner: 'user-001',
        products: ['product-001', 'product-002'],
        question: '투자 질문입니다.',
        cot1: 'CoT 1단계 분석',
        cot2: 'CoT 2단계 분석',
        cot3: 'CoT 3단계 분석',
        answer: '최종 답변입니다.',
        status: '완료',
        author: '관리자',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ];

    it('should export CoT data with correct field name mapping to CSV', async () => {
      const result = await exportToCsv(mockCotData, 'cotqa');
      
      expect(result.success).toBe(true);
      
      // Convert Uint8Array to string if needed
      const csvString = result.data instanceof Uint8Array 
        ? new TextDecoder().decode(result.data)
        : result.data as string;
      
      // Check that export field names are used
      expect(csvString).toContain('question_key');
      expect(csvString).toContain('product_type');
      expect(csvString).toContain('question_type');
      expect(csvString).toContain('created_at');
      expect(csvString).toContain('updated_at');
      expect(csvString).toContain('questioner');
      expect(csvString).toContain('products');
      expect(csvString).toContain('status');
      expect(csvString).toContain('author');
      
      // Check that internal field names are NOT used
      expect(csvString).not.toContain('productSource');
      expect(csvString).not.toContain('questionType');
      expect(csvString).not.toContain('createdAt');
      expect(csvString).not.toContain('updatedAt');
      
      // Check that products array is converted to pipe-separated string
      expect(csvString).toContain('product-001|product-002');
    });

    it('should export CoT data with correct field name mapping to JSON', async () => {
      const result = await exportToJson(mockCotData, 'cotqa');
      
      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('string');
      const parsedData = JSON.parse(result.data as string);
      expect(Array.isArray(parsedData)).toBe(true);
      expect(parsedData).toHaveLength(1);
      
      const exportedCot = parsedData[0];
      
      // Check that export field names are used
      expect(exportedCot).toHaveProperty('question_key', 'cot-001');
      expect(exportedCot).toHaveProperty('product_type', '증권');
      expect(exportedCot).toHaveProperty('question_type', '투자성향 및 조건 기반형');
      expect(exportedCot).toHaveProperty('questioner', 'user-001');
      expect(exportedCot).toHaveProperty('products', 'product-001|product-002');
      expect(exportedCot).toHaveProperty('status', '완료');
      expect(exportedCot).toHaveProperty('author', '관리자');
      expect(exportedCot).toHaveProperty('created_at', '2024-01-01T00:00:00.000Z');
      expect(exportedCot).toHaveProperty('updated_at', '2024-01-01T00:00:00.000Z');
      
      // Check that internal field names are NOT present
      expect(exportedCot).not.toHaveProperty('id');
      expect(exportedCot).not.toHaveProperty('productSource');
      expect(exportedCot).not.toHaveProperty('questionType');
      expect(exportedCot).not.toHaveProperty('createdAt');
      expect(exportedCot).not.toHaveProperty('updatedAt');
    });

    it('should export CoT data with dynamic CoT fields', async () => {
      const mockCotDataWithDynamic = [
        {
          ...mockCotData[0],
          cot4: 'CoT 4단계 추가',
          cot5: 'CoT 5단계 추가'
        }
      ];

      const result = await exportToCsv(mockCotDataWithDynamic, 'cotqa');
      
      expect(result.success).toBe(true);
      
      // Convert Uint8Array to string if needed
      const csvString = result.data instanceof Uint8Array 
        ? new TextDecoder().decode(result.data)
        : result.data as string;
      
      expect(csvString).toContain('cot4');
      expect(csvString).toContain('cot5');
      expect(csvString).toContain('CoT 4단계 추가');
      expect(csvString).toContain('CoT 5단계 추가');
    });
  });
});
