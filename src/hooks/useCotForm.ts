import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { UserAnon } from '../models/userAnon';
import { Product } from '../models/product';

// 폼 검증 스키마
const cotFormSchema = z.object({
  productSource: z.enum(['securities', 'insurance']),
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
  const settings = useSelector((state: RootState) => state.settings);
  
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
      productSource: 'securities',
      questionType: '',
      question: '',
      cot1: '',
      cot2: '',
      cot3: '',
      answer: '',
      datasetStatus: 'draft',
      author: '',
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
  const onSubmit = (data: CotFormData) => {
    // TODO: 저장 로직 구현
    const formDataWithCotN = {
      ...data,
      cotN: cotNFields,
      selectedUser,
      selectedProducts,
    };
    console.log('Save CoT:', formDataWithCotN);
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
  const handleDeleteConfirm = () => {
    // TODO: 실제 삭제 로직 구현
    console.log('Delete CoT');
    setDeleteConfirmOpen(false);
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
