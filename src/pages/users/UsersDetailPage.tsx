import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Container, Box } from '@mui/material';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { UserFormPanel } from '../../components/users/UserFormPanel';
import { useUserForm } from '../../hooks/useUserForm';
import { initializeSettings } from '../../store/slices/settingsSlice';

export function UsersDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const isEditMode = id !== 'new';
  
  // 커스텀 훅으로 폼 로직 분리
  const {
    // 폼 관련
    control,
    errors,
    isSubmitting,
    watchedCustomerSource,
    onSubmit,
    
    // 보유상품 관리
    ownedProductFields,
    handleAddOwnedProduct,
    handleRemoveOwnedProduct,
    
    // 팝업 상태
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    
    // 핸들러
    handleDeleteConfirm,
  } = useUserForm({ isEditMode });

  // 설정 초기화
  React.useEffect(() => {
    dispatch(initializeSettings());
  }, [dispatch]);

  // 네비게이션 핸들러
  const handleBack = () => {
    navigate('/users');
  };

  const handleDelete = () => {
    if (isEditMode) {
      setDeleteConfirmOpen(true);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
  };

  return (
    <>
      <Box sx={{ height: '100%', overflow: 'hidden' }}>
        <Container maxWidth="lg" sx={{ py: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <UserFormPanel
          isEditMode={isEditMode}
          control={control}
          errors={errors}
          isSubmitting={isSubmitting}
          watchedCustomerSource={watchedCustomerSource}
          ownedProductFields={ownedProductFields}
          onSubmit={onSubmit}
          onBack={handleBack}
          onDelete={handleDelete}
          onAddOwnedProduct={handleAddOwnedProduct}
          onRemoveOwnedProduct={handleRemoveOwnedProduct}
        />
        </Container>
      </Box>
      
      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="질문자 삭제"
        message="정말 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}
