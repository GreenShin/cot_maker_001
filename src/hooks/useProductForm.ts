import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { createProduct, updateProduct, deleteProduct, fetchProductById } from '../store/slices/productsSlice';
import { createEmptyProduct } from '../models/product';
import type { Product } from '../models/product';

// 폼 검증을 위한 스키마 (baseProductSchema 기반)
const productFormSchema = z.object({
  id: z.string().optional(),
  productSource: z.enum(['증권', '보험']),
  productName: z.string().min(1, '상품명을 입력해주세요'),
  productCategory: z.string().min(1, '상품분류를 선택해주세요'),
  taxType: z.enum(['과세', '비과세']),
  riskLevel: z.enum(['1', '2', '3']),
  description: z.string().optional(),
  managementCompany: z.string().optional(),
  expectedReturn: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;

interface UseProductFormProps {
  isEditMode: boolean;
}

export function useProductForm({ isEditMode }: UseProductFormProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const currentProduct = useSelector((state: RootState) => state.products.currentProduct);
  const loading = useSelector((state: RootState) => state.products.loading);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: createEmptyProduct('증권'), // 기본값 설정
  });

  const { control, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = form;
  const watchedProductSource = watch('productSource');

  // 편집 모드 시 데이터 로드
  React.useEffect(() => {
    if (isEditMode && id && id !== 'new') {
      dispatch(fetchProductById(id));
    } else {
      dispatch(fetchProductById('')); // Clear current product for new form
      reset(createEmptyProduct('증권')); // Reset for new product
    }
  }, [isEditMode, id, dispatch, reset]);

  // currentProduct가 로드되면 폼에 값 설정
  React.useEffect(() => {
    if (isEditMode && currentProduct && currentProduct.id === id) {
      reset(currentProduct);
    }
  }, [isEditMode, currentProduct, id, reset]);

  // 상품출처 변경 시 종속 필드 초기화
  React.useEffect(() => {
    if (watchedProductSource === '증권') {
      setValue('productCategory', '주식형');
    } else {
      setValue('productCategory', '연금');
    }
  }, [watchedProductSource, setValue]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      console.log('Product form data received:', data);

      // Product 형식으로 데이터 변환
      const productData: any = {
        productSource: data.productSource,
        productName: data.productName,
        productCategory: data.productCategory,
        taxType: data.taxType,
        riskLevel: data.riskLevel,
        description: data.description || '',
        managementCompany: data.managementCompany || '',
        expectedReturn: data.expectedReturn || '',
      };

      console.log('Processed product data:', productData);

      let result;
      if (isEditMode && id && id !== 'new') {
        // 수정 모드
        console.log('Updating product:', id);
        result = await dispatch(updateProduct({ id, data: productData }));
      } else {
        // 생성 모드
        console.log('Creating new product');
        result = await dispatch(createProduct(productData));
      }

      console.log('Redux action result:', result);

      if (createProduct.fulfilled.match(result) || updateProduct.fulfilled.match(result)) {
        // 성공시 목록 페이지로 이동
        console.log('Save successful, navigating to /products');
        navigate('/products');
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
        const result = await dispatch(deleteProduct(id));
        if (result.meta.requestStatus === 'fulfilled') {
          alert('삭제되었습니다!');
          navigate('/products');
        } else {
          alert(`삭제 실패: ${result.payload || '알 수 없는 오류'}`);
        }
      } catch (e: any) {
        alert(`오류 발생: ${e.message}`);
      }
    }
    setDeleteConfirmOpen(false);
  };

  return {
    control,
    errors,
    isSubmitting,
    watchedProductSource,
    onSubmit: handleSubmit(onSubmit),
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    handleDeleteConfirm,
    loading,
    currentProduct,
  };
}
