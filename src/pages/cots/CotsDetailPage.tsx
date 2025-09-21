import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { Detail3Pane } from '../../components/layout/Detail3Pane';
import { UserSelectorDialog } from '../../components/selectors/UserSelectorDialog';
import { ProductSelectorDialog } from '../../components/selectors/ProductSelectorDialog';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { QuestionerPanel } from '../../components/cots/QuestionerPanel';
import { CotFormPanel } from '../../components/cots/CotFormPanel';
import { ProductPanel } from '../../components/cots/ProductPanel';
import { useCotForm } from '../../hooks/useCotForm';
import { initializeSettings } from '../../store/slices/settingsSlice';
import { fetchCoTById } from '../../store/slices/cotsSlice';

interface CotsDetailPageProps {}

export function CotsDetailPage({}: CotsDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const isEditMode = id !== 'new';
  
  // 커스텀 훅으로 폼 로직 분리
  const {
    // 폼 관련
    control,
    errors,
    isSubmitting,
    watchedProductSource,
    onSubmit,
    
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
  } = useCotForm({ isEditMode, cotId: id });

  // 설정 초기화
  React.useEffect(() => {
    dispatch(initializeSettings());
  }, [dispatch]);

  // 수정 모드일 때 CoT 데이터 로드
  React.useEffect(() => {
    if (isEditMode && id) {
      dispatch(fetchCoTById(id));
    }
  }, [dispatch, isEditMode, id]);

  // 네비게이션 핸들러
  const handleBack = () => {
    navigate('/');
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
      <Detail3Pane
        leftPanel={
          <QuestionerPanel
            selectedUser={selectedUser}
            onOpenUserSelector={() => setUserSelectorOpen(true)}
          />
        }
        centerPanel={
          <CotFormPanel
            isEditMode={isEditMode}
            control={control}
            errors={errors}
            isSubmitting={isSubmitting}
            watchedProductSource={watchedProductSource}
            cotFields={cotFields}
            cotNFields={cotNFields}
            onSubmit={onSubmit}
            onBack={handleBack}
            onDelete={handleDelete}
            onAddCotField={handleAddCotField}
            onRemoveCotField={handleRemoveCotField}
            onCotNFieldChange={handleCotNFieldChange}
          />
        }
        rightPanel={
          <ProductPanel
            selectedProducts={selectedProducts}
            onOpenProductSelector={() => setProductSelectorOpen(true)}
          />
        }
      />
      
      {/* 질문자 선택 팝업 */}
      <UserSelectorDialog
        open={userSelectorOpen}
        onClose={() => setUserSelectorOpen(false)}
        onSelect={handleUserSelect}
        selectedUserId={selectedUser?.id}
      />
      
      {/* 상품 선택 팝업 */}
      <ProductSelectorDialog
        open={productSelectorOpen}
        onClose={() => setProductSelectorOpen(false)}
        onSelect={handleProductsSelect}
        selectedProductIds={selectedProducts.map(p => p.id)}
      />
      
      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="CoT 삭제"
        message="정말 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}
