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

// 폼 검증 스키마
const cotFormSchema = z.object({
  productSource: z.enum(['증권', '보험']),
  questionType: z.string().min(1, '질문유형을 선택해 주세요'),
  question: z.string().min(1, '질문을 입력해 주세요'),
  cot1: z.string().min(1, 'CoT1을 입력해 주세요'),
  cot2: z.string().min(1, 'CoT2를 입력해 주세요'),
  cot3: z.string().min(1, 'CoT3을 입력해 주세요'),
  answer: z.string().min(1, '답변을 입력해 주세요'),
  datasetStatus: z.string(),
  author: z.string().min(1, '작성자를 입력해 주세요'),
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
      datasetStatus: '초안',
      author: '',
    },
  });

  const { control, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = form;
  const watchedProductSource = watch('productSource');

  // 수정 모드일 때 기존 데이터 로드
  React.useEffect(() => {
    if (isEditMode && id && id !== 'new') {
      dispatch(fetchCoTById(id));
    }
  }, [dispatch, id, isEditMode]);

  // 기존 CoT 데이터로 폼 초기화
  React.useEffect(() => {
    if (currentCoT && isEditMode) {
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

      // 폼 데이터 설정
      reset({
        productSource: currentCoT.productSource,
        questionType: currentCoT.questionType,
        question: currentCoT.question,
        cot1: currentCoT.cot1,
        cot2: currentCoT.cot2,
        cot3: currentCoT.cot3,
        answer: currentCoT.answer,
        datasetStatus: currentCoT.status,
        author: currentCoT.author || '',
      });

      // 기존 선택된 질문자/상품 정보 설정
      if (currentCoT.questioner) {
        // 질문자 ID로부터 사용자 정보 가져오기
        dispatch(fetchUserById(currentCoT.questioner))
          .unwrap()
          .then(user => {
            setSelectedUser(user);
          })
          .catch(error => {
            console.warn('Failed to load questioner:', error);
          });
      } else {
        setSelectedUser(null);
      }

      if (currentCoT.products && currentCoT.products.length > 0) {
        // 상품 ID 배열로부터 상품 정보 가져오기
        const productPromises = currentCoT.products.map(productId =>
          dispatch(fetchProductById(productId)).unwrap()
        );
        
        Promise.allSettled(productPromises)
          .then(results => {
            const loadedProducts = results
              .filter((result): result is PromiseFulfilledResult<Product> => 
                result.status === 'fulfilled'
              )
              .map(result => result.value);
            setSelectedProducts(loadedProducts);
          })
          .catch(error => {
            console.warn('Failed to load products:', error);
          });
      } else {
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
    try {
      // CoTQA 형식으로 데이터 변환  
      const cotData: any = {
        productSource: data.productSource,
        questionType: data.questionType,
        questioner: selectedUser?.id || undefined, // 선택사항으로 변경
        products: selectedProducts.length > 0 ? selectedProducts.map(p => p.id) : [], // 선택사항으로 변경
        question: data.question,
        cot1: data.cot1,
        cot2: data.cot2,
        cot3: data.cot3,
        answer: data.answer,
        status: data.datasetStatus,
        author: data.author,
        // 동적 CoT 필드 추가
        ...Object.entries(cotNFields).reduce((acc, [key, value]) => {
          if (value.trim()) {
            const cotNum = key.replace('CoT', '');
            acc[`cot${cotNum}`] = value;
          }
          return acc;
        }, {} as Record<string, any>)
      };

      let result;
      if (isEditMode && id && id !== 'new') {
        // 수정 모드
        result = await dispatch(updateCoT({ id, data: cotData }));
      } else {
        // 생성 모드
        result = await dispatch(createCoT(cotData));
      }

      if (createCoT.fulfilled.match(result) || updateCoT.fulfilled.match(result)) {
        // 성공시 목록 페이지로 이동
        navigate('/');
      } else {
        // 실패시 오류 메시지 표시
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