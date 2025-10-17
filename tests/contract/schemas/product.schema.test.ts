import { describe, it, expect } from 'vitest';
import { productSchema } from '../../../src/models/product';

describe('Product Schema Contract', () => {
  it('should validate securities product', () => {
    const securitiesProduct = {
      id: 'prod-1',
      productSource: '증권' as const,
      productName: '삼성전자',
      productCategory: '주식형' as const,
      taxType: '과세' as const,
      description: '삼성전자 주식',
      riskLevel: '3' as const,
      managementCompany: '삼성증권',
      expectedReturn: '5%'
    };

    expect(() => productSchema.parse(securitiesProduct)).not.toThrow();
  });

  it('should validate insurance product', () => {
    const insuranceProduct = {
      id: 'prod-2',
      productSource: '보험' as const,
      productName: '종신보험',
      productCategory: '종신' as const,
      taxType: '비과세' as const,
      description: '종신보험 상품',
      riskLevel: '1' as const,
    };

    expect(() => productSchema.parse(insuranceProduct)).not.toThrow();
  });

  it('should reject invalid product category for source', () => {
    const invalidProduct = {
      id: 'prod-3',
      productSource: '증권' as const,
      productName: '잘못된 상품',
      productCategory: '연금' as any, // 보험 카테고리를 증권에 적용
      taxType: '과세' as const,
      riskLevel: '2' as const,
    };

    expect(() => productSchema.parse(invalidProduct)).toThrow();
  });
});
