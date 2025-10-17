import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { createCoT, updateCoT, deleteCoT, fetchCoTById } from '../store/slices/cotsSlice';
import { fetchUserById } from '../store/slices/usersSlice';
import { fetchProductById } from '../store/slices/productsSlice';
import { UserAnon } from '../models/userAnon';
import { Product } from '../models/product';
import type { CoTQA } from '../models/cotqa';

// 폼 검증 스키마 - 필수: 상품분류, 질문유형, 질문, CoT 상태만
const cotFormSchema = z.object({
  productSource: z.enum(['증권', '보험']), // 필수
  questionType: z.string()
    .transform(val => val?.trim() || '')
    .refine(val => val.length > 0, '질문유형을 선택해 주세요'), // 필수
  question: z.string()
    .transform(val => val?.trim() || '')
    .refine(val => val.length > 0, '질문을 입력해 주세요'), // 필수
  cot1: z.string().transform(val => val?.trim() || '').default(''), // 기본값 빈 문자열
  cot2: z.string().transform(val => val?.trim() || '').default(''), // 기본값 빈 문자열
  cot3: z.string().transform(val => val?.trim() || '').default(''), // 기본값 빈 문자열
  answer: z.string().transform(val => val?.trim() || '').default(''), // 기본값 빈 문자열
  datasetStatus: z.string(), // 필수 (기본값 '초안')
  author: z.string().transform(val => val?.trim() || '').default(''), // 기본값 빈 문자열
});

export type CotFormData = z.infer<typeof cotFormSchema>;

interface UseCotFormProps {
  isEditMode: boolean;
}

export function useCotForm({ isEditMode }: UseCotFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const settings = useSelector((state: RootState) => state.settings);
  const { currentCoT, loading, error } = useSelector((state: RootState) => state.cots);
  
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
  const form = useForm({
    resolver: zodResolver(cotFormSchema),
    defaultValues: {
      productSource: '증권',
      questionType: '',
      question: '',
      cot1: '',
      cot2: '',
      cot3: '',
      answer: '',
      datasetStatus: '초안',
      author: '',
    },
  });

  const { control, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = form;
  const watchedProductSource = watch('productSource');

  // 폼 에러를 콘솔에 로깅
  React.useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('=== Form Validation Errors ===');
      console.log('Errors:', errors);
    }
  }, [errors]);

  // 수정 모드일 때 기존 데이터 로드
  React.useEffect(() => {
    if (isEditMode && id && id !== 'new') {
      dispatch(fetchCoTById(id));
    }
  }, [dispatch, id, isEditMode]);

  // 기존 CoT 데이터로 폼 초기화
  React.useEffect(() => {
    if (currentCoT && isEditMode) {
      console.log('=== Loading existing CoT for edit ===');
      console.log('Current CoT:', currentCoT);
      
      const cotSteps = Object.keys(currentCoT)
        .filter(key => key.startsWith('cot') && key !== 'cot1' && key !== 'cot2' && key !== 'cot3')
        .sort((a, b) => {
          const aNum = parseInt(a.replace('cot', ''));
          const bNum = parseInt(b.replace('cot', ''));
          return aNum - bNum;
        });

      // CoT 필드 설정
      const allCotFields = ['CoT1', 'CoT2', 'CoT3', ...cotSteps.map(step => `CoT${step.replace('cot', '')}`)];
      setCotFields(allCotFields);

      // 동적 CoT 필드 설정
      const cotNData: Record<string, string> = {};
      cotSteps.forEach(step => {
        cotNData[`CoT${step.replace('cot', '')}`] = (currentCoT as any)[step] || '';
      });
      setCotNFields(cotNData);

      // 폼 데이터 설정 (undefined/null을 빈 문자열로 변환)
      reset({
        productSource: currentCoT.productSource,
        questionType: currentCoT.questionType,
        question: currentCoT.question || '',
        cot1: currentCoT.cot1 || '',
        cot2: currentCoT.cot2 || '',
        cot3: currentCoT.cot3 || '',
        answer: currentCoT.answer || '',
        datasetStatus: currentCoT.status,
        author: currentCoT.author || '',
      });

      // 기존 선택된 질문자/상품 정보 설정
      const questionerId = currentCoT.questioner;
      console.log('Questioner field:', questionerId, 'Type:', typeof questionerId);
      
      if (questionerId && typeof questionerId === 'string' && questionerId.trim() !== '') {
        // 질문자 ID로부터 사용자 정보 가져오기
        dispatch(fetchUserById(questionerId))
          .unwrap()
          .then(user => {
            console.log('Loaded questioner successfully:', user);
            setSelectedUser(user);
          })
          .catch(error => {
            console.warn('Failed to load questioner:', error);
            setSelectedUser(null);
          });
      } else {
        console.log('No valid questioner - setting to null');
        setSelectedUser(null);
      }

      // products 필드 정규화 - 배열이 아니면 빈 배열로 변환
      const productIds = Array.isArray(currentCoT.products) ? currentCoT.products : [];
      console.log('Products field:', currentCoT.products, 'Normalized:', productIds, 'Type:', typeof currentCoT.products);
      
      if (productIds.length > 0) {
        // 상품 ID 배열로부터 상품 정보 가져오기
        const validProductIds = productIds.filter(id => id && typeof id === 'string' && id.trim() !== '');
        console.log('Valid product IDs:', validProductIds);
        
        const productPromises = validProductIds.map(productId =>
          dispatch(fetchProductById(productId)).unwrap()
        );
        
        Promise.allSettled(productPromises)
          .then(results => {
            const loadedProducts = results
              .filter((result): result is PromiseFulfilledResult<Product> => 
                result.status === 'fulfilled'
              )
              .map(result => result.value);
            console.log('Loaded products successfully:', loadedProducts);
            setSelectedProducts(loadedProducts);
          })
          .catch(error => {
            console.warn('Failed to load products:', error);
            setSelectedProducts([]);
          });
      } else {
        console.log('No valid products - setting to empty array');
        setSelectedProducts([]);
      }
    }
  }, [currentCoT, isEditMode, reset]);

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

  // 폼 제출 - 실제 저장 로직 구현
  const onSubmit = async (data: CotFormData) => {
    console.log('=== CoT Form Submit Started ===');
    console.log('Form data:', data);
    console.log('Selected user:', selectedUser);
    console.log('Selected products:', selectedProducts);
    console.log('CoT N fields:', cotNFields);
    
    try {
      // CoTQA 형식으로 데이터 변환 (빈 값은 undefined로)
      const cotData: any = {
        productSource: data.productSource,
        questionType: data.questionType,
        questioner: selectedUser?.id || undefined,
        questionerGender: selectedUser?.gender || undefined, // 질문자 성별 저장
        questionerAgeGroup: selectedUser?.ageGroup || undefined, // 질문자 연령대 저장
        products: selectedProducts.length > 0 ? selectedProducts.map(p => p.id) : [],
        question: data.question,
        cot1: data.cot1 || undefined,
        cot2: data.cot2 || undefined,
        cot3: data.cot3 || undefined,
        answer: data.answer || undefined,
        status: data.datasetStatus,
        author: data.author || undefined,
        // 동적 CoT 필드 추가 (빈 값은 제외)
        ...Object.entries(cotNFields).reduce((acc, [key, value]) => {
          const trimmedValue = value?.trim();
          if (trimmedValue) {
            const cotNum = key.replace('CoT', '');
            acc[`cot${cotNum}`] = trimmedValue;
          }
          return acc;
        }, {} as Record<string, any>)
      };

      console.log('Prepared CoT data for save:', cotData);
      console.log('Is edit mode:', isEditMode);
      console.log('CoT ID:', id);

      let result;
      if (isEditMode && id && id !== 'new') {
        // 수정 모드
        console.log('Dispatching updateCoT...');
        result = await dispatch(updateCoT({ id, data: cotData }));
      } else {
        // 생성 모드
        console.log('Dispatching createCoT...');
        result = await dispatch(createCoT(cotData));
      }

      console.log('Redux action result:', result);

      if (createCoT.fulfilled.match(result) || updateCoT.fulfilled.match(result)) {
        // 성공시 목록 페이지로 이동
        console.log('Save successful! Navigating to /...');
        navigate('/');
      } else {
        // 실패시 오류 메시지 표시
        console.error('Save failed:', result);
        const errorMessage = result.payload || '저장 중 오류가 발생했습니다.';
        alert(`저장 실패: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('저장 중 오류가 발생했습니다.');
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
    if (isEditMode && id && id !== 'new') {
      try {
        const result = await dispatch(deleteCoT(id));
        if (deleteCoT.fulfilled.match(result)) {
          navigate('/');
        } else {
          alert('삭제 중 오류가 발생했습니다.');
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
    setDeleteConfirmOpen(false);
  };

  return {
    // 폼 관련
    control,
    errors,
    isSubmitting: isSubmitting || loading,
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