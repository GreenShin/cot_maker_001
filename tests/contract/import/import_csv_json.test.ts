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

  describe('CoT Import with Field Mapping', () => {
    it('should import CoT CSV with new field names', async () => {
      const csvContent = `question_key,product_type,question_type,questioner,products,question,cot1,cot2,cot3,answer,status,author,created_at,updated_at
cot-001,증권,투자성향 및 조건 기반형,user-001,product-001|product-002,투자 질문입니다.,CoT 1단계,CoT 2단계,CoT 3단계,최종 답변입니다.,완료,관리자,2024-01-01T00:00:00.000Z,2024-01-01T00:00:00.000Z`;

      const result = await importCsvData(csvContent, 'cotqa');
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      
      const importedCot = result.data[0] as any;
      
      // Check that internal field names are used
      expect(importedCot).toHaveProperty('id', 'cot-001');
      expect(importedCot).toHaveProperty('productSource', '증권');
      expect(importedCot).toHaveProperty('questionType', '투자성향 및 조건 기반형');
      expect(importedCot).toHaveProperty('questioner', 'user-001');
      expect(importedCot).toHaveProperty('products');
      expect(Array.isArray(importedCot.products)).toBe(true);
      expect(importedCot.products).toEqual(['product-001', 'product-002']);
      expect(importedCot).toHaveProperty('status', '완료');
      expect(importedCot).toHaveProperty('author', '관리자');
      expect(importedCot).toHaveProperty('createdAt', '2024-01-01T00:00:00.000Z');
      expect(importedCot).toHaveProperty('updatedAt', '2024-01-01T00:00:00.000Z');
    });

    it('should import CoT JSON with new field names', async () => {
      const jsonData = [
        {
          question_key: 'cot-002',
          product_type: '보험',
          question_type: '연령별 및 생애주기 저축성 상품 추천형',
          questioner: 'user-002',
          products: 'product-003|product-004',
          question: '보험 질문입니다.',
          cot1: 'CoT 1단계',
          cot2: 'CoT 2단계',
          cot3: 'CoT 3단계',
          answer: '보험 답변입니다.',
          status: '검토중',
          author: '보험전문가',
          created_at: '2024-01-02T00:00:00.000Z',
          updated_at: '2024-01-02T00:00:00.000Z'
        }
      ];

      const result = await importJsonData(jsonData, 'cotqa');
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      
      const importedCot = result.data[0] as any;
      
      // Check that internal field names are used
      expect(importedCot).toHaveProperty('id', 'cot-002');
      expect(importedCot).toHaveProperty('productSource', '보험');
      expect(importedCot).toHaveProperty('questionType', '연령별 및 생애주기 저축성 상품 추천형');
      expect(importedCot).toHaveProperty('questioner', 'user-002');
      expect(importedCot).toHaveProperty('products');
      expect(Array.isArray(importedCot.products)).toBe(true);
      expect(importedCot.products).toEqual(['product-003', 'product-004']);
      expect(importedCot).toHaveProperty('status', '검토중');
      expect(importedCot).toHaveProperty('author', '보험전문가');
      expect(importedCot).toHaveProperty('createdAt', '2024-01-02T00:00:00.000Z');
      expect(importedCot).toHaveProperty('updatedAt', '2024-01-02T00:00:00.000Z');
    });

    it('should support backward compatibility with old field names', async () => {
      const jsonData = [
        {
          id: 'cot-003',
          productSource: '증권',
          questionType: '고객 특성 강조형',
          questioner: 'user-003',
          products: ['product-005', 'product-006'],
          question: '레거시 질문입니다.',
          cot1: 'CoT 1단계',
          cot2: 'CoT 2단계',
          cot3: 'CoT 3단계',
          answer: '레거시 답변입니다.',
          status: '초안',
          author: '작성자',
          createdAt: '2024-01-03T00:00:00.000Z',
          updatedAt: '2024-01-03T00:00:00.000Z'
        }
      ];

      const result = await importJsonData(jsonData, 'cotqa');
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      
      const importedCot = result.data[0] as any;
      
      // Check that old field names are correctly mapped
      expect(importedCot).toHaveProperty('id', 'cot-003');
      expect(importedCot).toHaveProperty('productSource', '증권');
      expect(importedCot).toHaveProperty('questionType', '고객 특성 강조형');
      expect(importedCot.products).toEqual(['product-005', 'product-006']);
      expect(importedCot).toHaveProperty('createdAt', '2024-01-03T00:00:00.000Z');
      expect(importedCot).toHaveProperty('updatedAt', '2024-01-03T00:00:00.000Z');
    });

    it('should import CoT with dynamic CoT fields', async () => {
      const csvContent = `question_key,product_type,question_type,questioner,products,question,cot1,cot2,cot3,cot4,cot5,answer,status,author,created_at,updated_at
cot-004,보험,건강 및 질병 보장 대비형,user-004,product-007,확장 질문입니다.,CoT 1단계,CoT 2단계,CoT 3단계,CoT 4단계,CoT 5단계,확장 답변입니다.,완료,전문가,2024-01-04T00:00:00.000Z,2024-01-04T00:00:00.000Z`;

      const result = await importCsvData(csvContent, 'cotqa');
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      
      const importedCot = result.data[0] as any;
      
      expect(importedCot).toHaveProperty('cot4', 'CoT 4단계');
      expect(importedCot).toHaveProperty('cot5', 'CoT 5단계');
    });
  });
});
