import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { Detail3Pane } from '../../components/layout/Detail3Pane';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ProductFormPanel } from '../../components/products/ProductFormPanel';
import { useProductForm } from '../../hooks/useProductForm';

interface ProductsDetailPageProps {}

export function ProductsDetailPage({}: ProductsDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isEditMode = id !== 'new';

  const {
    control,
    errors,
    isSubmitting,
    watchedProductSource,
    onSubmit,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    handleDeleteConfirm,
    loading,
    currentProduct,
  } = useProductForm({ isEditMode });

  const handleBack = () => {
    navigate('/products');
  };

  const handleDelete = () => {
    if (isEditMode) {
      setDeleteConfirmOpen(true);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
  };

  // 로딩 중이거나 데이터가 없으면 (편집 모드에서) 로딩 스피너 등을 표시할 수 있음
  if (isEditMode && loading && !currentProduct) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        Loading...
      </Box>
    );
  }

  return (
    <>
      <Detail3Pane
        centerPanel={
          <ProductFormPanel
            isEditMode={isEditMode}
            control={control}
            errors={errors}
            isSubmitting={isSubmitting}
            watchedProductSource={watchedProductSource}
            onSubmit={onSubmit}
            onBack={handleBack}
            onDelete={handleDelete}
          />
        }
        // 상품 상세는 1패널로 구성되므로,
        // 여기서는 centerPanel만 사용하고 left/rightPanel은 비워둠.
        // 필요에 따라 다른 정보 패널을 추가할 수 있음.
        leftPanel={<Box />}
        rightPanel={<Box />}
      />

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="상품 삭제"
        message="정말 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}
