import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { createUser, updateUser, deleteUser, fetchUserById } from '../store/slices/usersSlice';
import type { UserAnon } from '../models/userAnon';

// 폼 검증 스키마
const userFormSchema = z.object({
  customerSource: z.enum(['증권', '보험']),
  ageGroup: z.enum(['10대', '20대', '30대', '40대', '50대', '60대', '70대', '80대 이상']),
  gender: z.enum(['남', '여']),
  investmentAmount: z.enum([
    '1000만원 이하', '3000만원 이하', '5000만원 이하', '1억원 이하', '1억원 초과'
  ]).optional(),
  investmentTendency: z.enum([
    '미정의', '공격투자형', '적극투자형', '위험중립형', '안정추구형', '전문투자가형'
  ]).optional(),
  insuranceCrossRatio: z.enum([
    '미정의', '보장only', '변액only', '기타only', 
    '보장+변액', '보장+기타', '변액+기타', '보장+변액+기타'
  ]).optional(),
  ownedProducts: z.array(z.object({
    productName: z.string(),
    purchaseDate: z.string()
  })).optional().default([])
});

export type UserFormData = z.infer<typeof userFormSchema>;

interface UseUserFormProps {
  isEditMode: boolean;
}

export function useUserForm({ isEditMode }: UseUserFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { currentUser, loading, error } = useSelector((state: RootState) => state.users);
  
  // 팝업 상태
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  // React Hook Form 설정
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      customerSource: '증권',
      ageGroup: '30대',
      gender: '남',
      investmentAmount: '1000만원 이하',
      investmentTendency: '미정의',
      insuranceCrossRatio: '미정의',
      ownedProducts: []
    },
  });

  const { control, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = form;
  const watchedCustomerSource = watch('customerSource');

  // 보유상품 필드 배열 관리
  const { fields: ownedProductFields, append: appendOwnedProduct, remove: removeOwnedProduct } = useFieldArray({
    control,
    name: 'ownedProducts'
  });

  // 수정 모드일 때 기존 데이터 로드
  React.useEffect(() => {
    if (isEditMode && id && id !== 'new') {
      dispatch(fetchUserById(id));
    }
  }, [dispatch, id, isEditMode]);

  // 기존 사용자 데이터로 폼 초기화
  React.useEffect(() => {
    if (currentUser && isEditMode) {
      reset({
        customerSource: currentUser.customerSource,
        ageGroup: currentUser.ageGroup,
        gender: currentUser.gender,
        investmentAmount: currentUser.investmentAmount,
        investmentTendency: 'investmentTendency' in currentUser ? currentUser.investmentTendency : '미정의',
        insuranceCrossRatio: 'insuranceCrossRatio' in currentUser ? currentUser.insuranceCrossRatio : '미정의',
        ownedProducts: currentUser.ownedProducts || []
      });
    }
  }, [currentUser, isEditMode, reset]);

  // 고객출처 변경시 종속 필드 초기화
  React.useEffect(() => {
    if (watchedCustomerSource === '증권') {
      setValue('insuranceCrossRatio', '미정의');
    } else {
      setValue('investmentTendency', '미정의');
    }
  }, [watchedCustomerSource, setValue]);

  // 보유상품 추가
  const handleAddOwnedProduct = () => {
    const currentDate = new Date();
    const defaultDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    appendOwnedProduct({ productName: '', purchaseDate: defaultDate });
  };

  // 보유상품 삭제
  const handleRemoveOwnedProduct = (index: number) => {
    removeOwnedProduct(index);
  };

  // 폼 제출 - 실제 저장 로직 구현
  const onSubmit = async (data: UserFormData) => {
    try {
      console.log('Form data received:', data);

      // 보유상품 데이터 정제 및 검증
      const validOwnedProducts = (data.ownedProducts || [])
        .filter(product => 
          product.productName && product.productName.trim() !== '' &&
          product.purchaseDate && product.purchaseDate.trim() !== ''
        )
        .map(product => {
          // YYYY-MM 형식 검증
          const datePattern = /^\d{4}-\d{2}$/;
          if (!datePattern.test(product.purchaseDate)) {
            throw new Error(`구매년월이 YYYY-MM 형식이 아닙니다: ${product.purchaseDate}`);
          }
          return {
            productName: product.productName.trim(),
            purchaseDate: product.purchaseDate.trim()
          };
        });

      // UserAnon 형식으로 데이터 변환
      const userData: any = {
        customerSource: data.customerSource,
        ageGroup: data.ageGroup,
        gender: data.gender,
        ownedProducts: validOwnedProducts
      };

      // 선택적 필드들 추가 (undefined가 아닌 경우만)
      if (data.investmentAmount) {
        userData.investmentAmount = data.investmentAmount;
      }

      // 고객출처에 따른 종속 필드 추가
      if (data.customerSource === '증권' && data.investmentTendency && data.investmentTendency !== '미정의') {
        userData.investmentTendency = data.investmentTendency;
      }
      if (data.customerSource === '보험' && data.insuranceCrossRatio && data.insuranceCrossRatio !== '미정의') {
        userData.insuranceCrossRatio = data.insuranceCrossRatio;
      }

      console.log('Processed user data:', userData);

      let result;
      if (isEditMode && id && id !== 'new') {
        // 수정 모드
        console.log('Updating user:', id);
        result = await dispatch(updateUser({ id, data: userData }));
      } else {
        // 생성 모드
        console.log('Creating new user');
        result = await dispatch(createUser(userData));
      }

      console.log('Redux action result:', result);

      if (createUser.fulfilled.match(result) || updateUser.fulfilled.match(result)) {
        // 성공시 목록 페이지로 이동
        console.log('Save successful, navigating to /users');
        navigate('/users');
      } else {
        // 실패시 오류 메시지 표시
        console.error('Save failed:', result);
        const errorMessage = result.payload || result.error?.message || '저장 중 오류가 발생했습니다.';
        alert(`저장 실패: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert(`저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 삭제 핸들러
  const handleDeleteConfirm = async () => {
    if (isEditMode && id && id !== 'new') {
      try {
        const result = await dispatch(deleteUser(id));
        if (deleteUser.fulfilled.match(result)) {
          navigate('/users');
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
    watchedCustomerSource,
    onSubmit: handleSubmit(onSubmit),
    
    // 보유상품 관리
    ownedProductFields,
    handleAddOwnedProduct,
    handleRemoveOwnedProduct,
    
    // 팝업 상태
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    
    // 핸들러
    handleDeleteConfirm,
  };
}
