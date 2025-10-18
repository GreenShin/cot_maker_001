import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Detail3Pane } from '../../components/layout/Detail3Pane';
import { UserSelectorDialog } from '../../components/selectors/UserSelectorDialog';
import { ProductSelectorDialog } from '../../components/selectors/ProductSelectorDialog';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { QuestionerPanel } from '../../components/cots/QuestionerPanel';
import { CotFormPanel } from '../../components/cots/CotFormPanel';
import { ProductPanel } from '../../components/cots/ProductPanel';
import { useCotForm } from '../../hooks/useCotForm';
import { initializeSettings } from '../../store/slices/settingsSlice';
import type { RootState } from '../../store';

interface CotsDetailPageProps {}

export function CotsDetailPage({}: CotsDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings);
  
  const isEditMode = id !== 'new';
  
  // 핀으로 고정된 필드 상태 관리
  const [pinnedField, setPinnedField] = React.useState<{
    fieldName: string;
    fieldLabel: string;
  } | null>(null);
  
  // 커스텀 훅으로 폼 로직 분리
  const {
    // 폼 관련
    control,
    errors,
    isSubmitting,
    watchedProductSource,
    watchedQuestionType,
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
  } = useCotForm({ isEditMode });

  // 설정 초기화
  React.useEffect(() => {
    dispatch(initializeSettings());
  }, [dispatch]);

  // 핀으로 고정된 필드 가이드 가져오기
  const getFocusedFieldGuide = (): { title: string; content: string } | null => {
    if (!pinnedField || !watchedProductSource || !watchedQuestionType) {
      return null;
    }

    // 질문유형을 설정의 탭 키로 변환
    const tabKeyMap: Record<string, string> = {
      // 증권
      '고객 특성 강조형': '고객특성강조형',
      '투자성향 및 조건 기반형': '투자성향조건기반형',
      '상품비교 추천형': '상품비교추천형',
      // 보험
      '연령별 및 생애주기 저축성 상품 추천형': '연령별생애주기저축성',
      '투자성 상품 추천형': '투자성상품추천형',
      '건강 및 질병 보장 대비형': '건강질병보장대비형'
    };

    const tabKey = tabKeyMap[watchedQuestionType];
    if (!tabKey) {
      return null;
    }

    let content = '';
    if (watchedProductSource === '증권') {
      const tab = settings.tabs.증권[tabKey as keyof typeof settings.tabs.증권];
      content = tab?.[pinnedField.fieldName as keyof typeof tab] || '';
    } else {
      const tab = settings.tabs.보험[tabKey as keyof typeof settings.tabs.보험];
      content = tab?.[pinnedField.fieldName as keyof typeof tab] || '';
    }

    if (!content) {
      return null;
    }

    return {
      title: `${pinnedField.fieldLabel} 가이드`,
      content
    };
  };

  const handlePinnedFieldToggle = (fieldName: string, fieldLabel: string) => {
    // 같은 필드를 다시 클릭하면 핀 해제
    if (pinnedField?.fieldName === fieldName) {
      setPinnedField(null);
    } else {
      // 다른 필드를 클릭하면 새로 핀 고정
      setPinnedField({ fieldName, fieldLabel });
    }
  };

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
            productSource={watchedProductSource}
            questionType={watchedQuestionType}
          />
        }
        centerPanel={
          <CotFormPanel
            isEditMode={isEditMode}
            control={control}
            errors={errors}
            isSubmitting={isSubmitting}
            watchedProductSource={watchedProductSource}
            watchedQuestionType={watchedQuestionType}
            cotFields={cotFields}
            cotNFields={cotNFields}
            onSubmit={onSubmit}
            onBack={handleBack}
            onDelete={handleDelete}
            onAddCotField={handleAddCotField}
            onRemoveCotField={handleRemoveCotField}
            onCotNFieldChange={handleCotNFieldChange}
            onPinnedFieldToggle={handlePinnedFieldToggle}
            pinnedFieldName={pinnedField?.fieldName || null}
          />
        }
        rightPanel={
          <ProductPanel
            selectedProducts={selectedProducts}
            onOpenProductSelector={() => setProductSelectorOpen(true)}
            focusedFieldGuide={getFocusedFieldGuide()}
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
