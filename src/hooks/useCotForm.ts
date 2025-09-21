import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { UserAnon } from '../models/userAnon';
import { Product } from '../models/product';
import { CoTQA, cotQASchema } from '../models/cotqa';
import { createCoT, updateCoT, deleteCoT } from '../store/slices/cotsSlice';

// 폼 검증 스키마
const cotFormSchema = z.object({
  productSource: z.enum(['증권', '보험']),
  questionType: z.string().min(1, '질문유형을 선택해 주세요'),
  question: z.string().min(1, '질문을 입력해 주세요'),
  cot1: z.string().min(1, 'CoT1을 입력해 주세요'),
  cot2: z.string().min(1, 'CoT2를 입력해 주세요'),
  cot3: z.string().min(1, 'CoT3을 입력해 주세요'),
  answer: z.string().min(1, '답변을 입력해 주세요'),
  status: z.enum(['초안', '검토중', '완료', '보류']),
  author: z.string().optional(),
}).catchall(z.string().optional()); // 동적 CoT 필드들 허용

export type CotFormData = z.infer<typeof cotFormSchema>;

interface UseCotFormProps {
  isEditMode: boolean;
  cotId?: string; // 수정 모드일 때 CoT ID
}

export function useCotForm({ isEditMode, cotId }: UseCotFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const settings = useSelector((state: RootState) => state.settings);
  const currentCoT = useSelector((state: RootState) => state.cots.currentCoT);
  
  // 상태 관리
  const [selectedUser, setSelectedUser] = React.useState<UserAnon | null>(null);
  const [selectedProducts, setSelectedProducts] = React.useState<Product[]>([]);
  const [cotFields, setCotFields] = React.useState(['CoT1', 'CoT2', 'CoT3']);
  const [cotNFields, setCotNFields] = React.useState<Record<string, string>>({});
  
  // 팝업 상태
  const [userSelectorOpen, setUserSelectorOpen] = React.useState(false);
  const [productSelectorOpen, setProductSelectorOpen] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  // React Hook Form 설정
  const form = useForm<CotFormData>({
    resolver: zodResolver(cotFormSchema),
    defaultValues: {
      productSource: '증권',
      questionType: '',
      question: '',
      cot1: '',
      cot2: '',
      cot3: '',
      answer: '',
      status: '초안',
      author: settings.author || '',
    },
  });

  const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = form;
  const watchedProductSource = watch('productSource');

  // 상품분류 변경시 질문유형 초기화
  React.useEffect(() => {
    setValue('questionType', '');
  }, [watchedProductSource, setValue]);

  // 설정 로드 후 작성자 업데이트
  React.useEffect(() => {
    if (!isEditMode && settings.author) {
      setValue('author', settings.author);
    }
  }, [settings.author, isEditMode, setValue]);

  // 수정 모드일 때 기존 CoT 데이터 로드
  React.useEffect(() => {
    if (isEditMode && currentCoT) {
      setValue('productSource', currentCoT.productSource);
      setValue('questionType', currentCoT.questionType);
      setValue('question', currentCoT.question);
      setValue('cot1', currentCoT.cot1);
      setValue('cot2', currentCoT.cot2);
      setValue('cot3', currentCoT.cot3);
      setValue('answer', currentCoT.answer);
      setValue('status', currentCoT.status);
      setValue('author', currentCoT.author || '');

      // 동적 CoT 필드들 로드
      const dynamicFields: Record<string, string> = {};
      const allCotFields = ['CoT1', 'CoT2', 'CoT3'];
      
      Object.keys(currentCoT).forEach(key => {
        if (key.match(/^cot[4-9]$/) || key.match(/^cot\d{2,}$/)) {
          const value = (currentCoT as any)[key];
          if (value) {
            setValue(key as keyof CotFormData, value);
            dynamicFields[key] = value;
            allCotFields.push(key.replace('cot', 'CoT'));
          }
        }
      });
      
      setCotFields(allCotFields);
      setCotNFields(dynamicFields);

      // 선택된 사용자 설정 (questioner ID로 찾아야 함)
      // TODO: 사용자 조회 로직 구현 필요
      
      // 선택된 상품들 설정 (product IDs로 찾아야 함)
      // TODO: 상품 조회 로직 구현 필요
    }
  }, [isEditMode, currentCoT, setValue]);

  // CoT 필드 관리
  const handleAddCotField = () => {
    const nextIndex = cotFields.length + 1;
    setCotFields([...cotFields, `CoT${nextIndex}`]);
  };

  const handleRemoveCotField = (index: number) => {
    if (index >= 3) { // CoT1-3은 필수이므로 삭제 불가
      const newFields = cotFields.filter((_, i) => i !== index);
      setCotFields(newFields);
      // CoTn 데이터에서도 제거
      const newCotN = { ...cotNFields };
      delete newCotN[`CoT${index + 1}`];
      setCotNFields(newCotN);
    }
  };

  const handleCotNFieldChange = (fieldName: string, value: string) => {
    setCotNFields({
      ...cotNFields,
      [fieldName]: value,
    });
  };

  // 폼 제출
  const onSubmit = async (data: CotFormData) => {
    try {
      // CoTQA 데이터 구성 (질문자와 상품은 선택사항)
      const cotData: Omit<CoTQA, 'id' | 'createdAt' | 'updatedAt'> = {
        productSource: data.productSource,
        questionType: data.questionType,
        questioner: selectedUser?.id, // 선택사항: undefined 가능
        products: selectedProducts.map(p => p.id), // 빈 배열 허용
        question: data.question,
        cot1: data.cot1,
        cot2: data.cot2,
        cot3: data.cot3,
        answer: data.answer,
        status: data.status,
        author: data.author,
        // 동적 CoT 필드들 추가
        ...cotNFields
      };

      let result;
      if (isEditMode && cotId) {
        // 수정 모드
        result = await dispatch(updateCoT({ 
          id: cotId, 
          data: { 
            ...cotData,
            id: cotId,
            createdAt: currentCoT?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } 
        })).unwrap();
      } else {
        // 생성 모드
        result = await dispatch(createCoT(cotData)).unwrap();
      }

      // 성공시 목록으로 이동
      navigate('/');
    } catch (error: any) {
      console.error('CoT 저장 실패:', error);
      // TODO: 에러 토스트 메시지 표시
      alert(error.message || 'CoT 저장에 실패했습니다');
    }
  };

  // 사용자 선택 핸들러
  const handleUserSelect = (user: UserAnon) => {
    setSelectedUser(user);
    setUserSelectorOpen(false);
  };

  // 상품 선택 핸들러
  const handleProductsSelect = (products: Product[]) => {
    setSelectedProducts(products);
    setProductSelectorOpen(false);
  };

  // 삭제 핸들러
  const handleDeleteConfirm = async () => {
    try {
      if (!isEditMode || !cotId) {
        throw new Error('삭제할 CoT가 없습니다');
      }

      // Redux action dispatch
      await dispatch(deleteCoT(cotId)).unwrap();

      // 삭제 성공시 목록으로 이동
      navigate('/');
    } catch (error: any) {
      console.error('CoT 삭제 실패:', error);
      // TODO: 에러 토스트 메시지 표시
      alert(error.message || 'CoT 삭제에 실패했습니다');
    } finally {
      // 팝업 닫기 (성공/실패 관계없이)
      setDeleteConfirmOpen(false);
    }
  };

  return {
    // 폼 관련
    control,
    errors,
    isSubmitting,
    watchedProductSource,
    onSubmit: handleSubmit(onSubmit),
    
    // 상태 관리
    selectedUser,
    selectedProducts,
    cotFields,
    cotNFields,
    
    // 팝업 상태
    userSelectorOpen,
    setUserSelectorOpen,
    productSelectorOpen,
    setProductSelectorOpen,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    
    // 핸들러
    handleUserSelect,
    handleProductsSelect,
    handleAddCotField,
    handleRemoveCotField,
    handleCotNFieldChange,
    handleDeleteConfirm,
  };
}
