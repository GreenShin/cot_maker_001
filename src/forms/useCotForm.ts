import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CoTQA, cotQASchema } from '../models/cotqa';

// Form 데이터 타입 (동적 CoT 필드 포함)
export interface CotFormData {
  productSource: '증권' | '보험';
  questionType: string;
  questioner: string;
  products: string[];
  question: string;
  cot1: string;
  cot2: string;
  cot3: string;
  answer: string;
  status: '초안' | '검토중' | '완료' | '보류';
  author?: string;
  // 동적 CoT 필드들
  [key: string]: any;
}

// Form 검증 스키마 (기본 필드만)
const baseCotFormSchema = z.object({
  productSource: z.enum(['증권', '보험']),
  questionType: z.string().min(1, '질문유형을 선택해주세요'),
  questioner: z.string().min(1, '질문자를 선택해주세요'),
  products: z.array(z.string()).min(1, '상품을 최소 1개 선택해주세요'),
  question: z.string().min(1, '질문을 입력해주세요'),
  cot1: z.string().min(1, 'CoT1을 입력해주세요'),
  cot2: z.string().min(1, 'CoT2를 입력해주세요'),
  cot3: z.string().min(1, 'CoT3를 입력해주세요'),
  answer: z.string().min(1, '답변을 입력해주세요'),
  status: z.enum(['초안', '검토중', '완료', '보류']),
  author: z.string().optional(),
}).catchall(z.string().optional()); // 동적 CoT 필드들 허용

export const cotFormSchema = baseCotFormSchema;

// CoTQA 데이터를 Form 데이터로 변환
export const cotqaToFormData = (cotqa: CoTQA): CotFormData => {
  const formData: CotFormData = {
    productSource: cotqa.productSource,
    questionType: cotqa.questionType,
    questioner: cotqa.questioner,
    products: cotqa.products,
    question: cotqa.question,
    cot1: cotqa.cot1,
    cot2: cotqa.cot2,
    cot3: cotqa.cot3,
    answer: cotqa.answer,
    status: cotqa.status,
    author: cotqa.author,
  };

  // 동적 CoT 필드들 추가
  Object.keys(cotqa).forEach(key => {
    if (key.match(/^cot[4-9]$/) || key.match(/^cot\d{2,}$/)) {
      formData[key] = (cotqa as any)[key] || '';
    }
  });

  return formData;
};

// Form 데이터를 CoTQA로 변환
export const formDataToCotqa = (formData: CotFormData, id?: string): CoTQA => {
  const baseData = {
    id: id || crypto.randomUUID(),
    productSource: formData.productSource,
    questionType: formData.questionType,
    questioner: formData.questioner,
    products: formData.products,
    question: formData.question,
    cot1: formData.cot1,
    cot2: formData.cot2,
    cot3: formData.cot3,
    answer: formData.answer,
    status: formData.status,
    author: formData.author,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 동적 CoT 필드들 추가
  Object.keys(formData).forEach(key => {
    if (key.match(/^cot[4-9]$/) || key.match(/^cot\d{2,}$/)) {
      (baseData as any)[key] = formData[key];
    }
  });

  return cotQASchema.parse(baseData);
};

// CoT Form Hook
export const useCotForm = (initialData?: CoTQA) => {
  const defaultValues: CotFormData = initialData 
    ? cotqaToFormData(initialData)
    : {
        productSource: '증권',
        questionType: '',
        questioner: '',
        products: [],
        question: '',
        cot1: '',
        cot2: '',
        cot3: '',
        answer: '',
        status: '초안',
        author: '',
      };

  const form = useForm<CotFormData>({
    resolver: zodResolver(cotFormSchema),
    defaultValues,
  });

  // 동적 CoT 필드 관리
  const addCotField = () => {
    const currentData = form.getValues();
    const cotKeys = Object.keys(currentData).filter(key => key.startsWith('cot'));
    const nextIndex = cotKeys.length + 1;
    const nextKey = `cot${nextIndex}`;
    
    form.setValue(nextKey, '');
    return nextKey;
  };

  const removeCotField = (fieldKey: string) => {
    if (fieldKey === 'cot1' || fieldKey === 'cot2' || fieldKey === 'cot3') {
      throw new Error('CoT1, CoT2, CoT3는 필수 필드로 삭제할 수 없습니다');
    }
    
    form.unregister(fieldKey);
  };

  // 현재 CoT 필드들 가져오기
  const getCurrentCotFields = () => {
    const currentData = form.getValues();
    const cotFields = Object.keys(currentData)
      .filter(key => key.startsWith('cot'))
      .sort((a, b) => {
        const aNum = parseInt(a.replace('cot', ''));
        const bNum = parseInt(b.replace('cot', ''));
        return aNum - bNum;
      });
    
    return cotFields.map(key => ({
      key,
      value: currentData[key] || '',
      required: ['cot1', 'cot2', 'cot3'].includes(key),
    }));
  };

  // Form 데이터를 CoTQA로 변환
  const convertToCoTQA = (formData: CotFormData, id?: string) => {
    return formDataToCotqa(formData, id);
  };

  return {
    ...form,
    addCotField,
    removeCotField,
    getCurrentCotFields,
    convertToCoTQA,
  };
};

// 유틸리티 함수들
export const getInitialCotFormData = (productSource: '증권' | '보험' = '증권'): CotFormData => ({
  productSource,
  questionType: '',
  questioner: '',
  products: [],
  question: '',
  cot1: '',
  cot2: '',
  cot3: '',
  answer: '',
  status: '초안',
  author: '',
});

export const validateCotFormData = (data: CotFormData): boolean => {
  try {
    cotFormSchema.parse(data);
    return true;
  } catch {
    return false;
  }
};
