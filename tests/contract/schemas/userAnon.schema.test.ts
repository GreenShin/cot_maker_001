import { describe, it, expect } from 'vitest';
import { userAnonSchema } from '../../../src/models/userAnon';

describe('UserAnon Schema Contract', () => {
  it('should validate valid user data', () => {
    const validUser = {
      id: 'user-1',
      customerSource: '증권' as const,
      ageGroup: '30대' as const,
      gender: '남' as const,
      investmentTendency: '적극투자형' as const,
      investmentAmount: '1000만원 이하' as const,
      ownedProducts: [
        { productName: '삼성전자', purchaseDate: '2023-01' }
      ]
    };

    expect(() => userAnonSchema.parse(validUser)).not.toThrow();
  });

  it('should reject invalid customer source', () => {
    const invalidUser = {
      id: 'user-1',
      customerSource: 'invalid' as any,
      ageGroup: '30대' as const,
      gender: '남' as const,
    };

    expect(() => userAnonSchema.parse(invalidUser)).toThrow();
  });

  it('should validate insurance-specific fields', () => {
    const insuranceUser = {
      id: 'user-1',
      customerSource: '보험' as const,
      ageGroup: '40대' as const,
      gender: '여' as const,
      insuranceCrossRatio: '보장+변액' as const,
    };

    expect(() => userAnonSchema.parse(insuranceUser)).not.toThrow();
  });
});
