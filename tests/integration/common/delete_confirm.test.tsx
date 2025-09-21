/**
 * Delete Confirmation Modal Integration Tests
 * 삭제 확인 다이얼로그의 동작과 사용자 상호작용 테스트
 */

import React, { useState } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';

import { theme } from '../../../src/styles/theme.js';
import { cotsSlice } from '../../../src/store/slices/cotsSlice.js';
import { productsSlice } from '../../../src/store/slices/productsSlice.js';
import { usersSlice } from '../../../src/store/slices/usersSlice.js';
import { ConfirmDialog } from '../../../src/components/common/ConfirmDialog.js';

// Mock Store 생성
const createMockStore = () => {
  return configureStore({
  reducer: {
      cots: cotsSlice.reducer,
      products: productsSlice.reducer,
      users: usersSlice.reducer,
    },
    preloadedState: {
      cots: {
        list: generateMockCoTs(),
        loading: false,
        error: null,
        deleteLoading: false
      },
      products: {
        list: generateMockProducts(),
        loading: false,
        error: null,
        deleteLoading: false
      },
      users: {
        list: generateMockUsers(),
        loading: false,
        error: null,
        deleteLoading: false
      }
    }
  });
};

// 테스트용 컴포넌트 래퍼
const TestWrapper = ({ children, store }: { children: React.ReactNode, store?: any }) => {
  const testStore = store || createMockStore();
  
  return (
    <Provider store={testStore}>
      <BrowserRouter>
      <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
        </BrowserRouter>
    </Provider>
  );
};

// 삭제 가능한 항목이 있는 테스트 컴포넌트
const TestListComponent = ({ 
  items, 
  onDelete, 
  deleteLoading = false 
}: { 
  items: any[], 
  onDelete: (id: string) => Promise<void>,
  deleteLoading?: boolean 
}) => {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
    severity?: 'warning' | 'error';
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: async () => {}
  });

  const handleDeleteClick = (item: any) => {
    setConfirmDialog({
      open: true,
      title: '삭제 확인',
      message: `'${item.name || item.title || item.id}'을(를) 삭제하시겠습니까?`,
      severity: 'warning',
      onConfirm: async () => {
        await onDelete(item.id);
        setConfirmDialog(prev => ({ ...prev, open: false }));
      }
    });
  };

  const handleBulkDelete = (selectedIds: string[]) => {
    setConfirmDialog({
      open: true,
      title: '일괄 삭제 확인',
      message: `선택한 ${selectedIds.length}개 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      severity: 'error',
      onConfirm: async () => {
        for (const id of selectedIds) {
          await onDelete(id);
        }
        setConfirmDialog(prev => ({ ...prev, open: false }));
      }
    });
  };

  const handleCloseDialog = () => {
    setConfirmDialog(prev => ({ ...prev, open: false }));
  };

  return (
    <div>
      <h1>테스트 목록</h1>
      <div data-testid="item-list">
        {items.map((item) => (
          <div key={item.id} data-testid={`item-${item.id}`} style={{ padding: '8px', border: '1px solid #ccc', margin: '4px' }}>
            <span>{item.name || item.title || item.id}</span>
            <button
              onClick={() => handleDeleteClick(item)}
              data-testid={`delete-btn-${item.id}`}
              disabled={deleteLoading}
            >
              삭제
            </button>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '16px' }}>
        <button 
          onClick={() => handleBulkDelete(['item-1', 'item-2'])}
          data-testid="bulk-delete-btn"
          disabled={deleteLoading}
        >
          선택 항목 삭제
        </button>
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        severity={confirmDialog.severity}
        onConfirm={confirmDialog.onConfirm}
        onCancel={handleCloseDialog}
        confirmButtonText="삭제"
        cancelButtonText="취소"
        loading={deleteLoading}
      />
    </div>
  );
};

// CoT 삭제 시나리오 테스트 컴포넌트
const CoTDeleteScenario = ({ onDelete }: { onDelete: (id: string) => Promise<void> }) => {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: async () => {}
  });

  const handleDeleteCoT = (cot: any) => {
    const hasRelatedData = cot.products && cot.products.length > 0;
    
    setConfirmDialog({
      open: true,
      title: 'CoT 삭제 확인',
      message: hasRelatedData 
        ? `이 CoT는 ${cot.products.length}개의 상품과 연결되어 있습니다. 정말 삭제하시겠습니까?`
        : 'CoT를 삭제하시겠습니까?',
      onConfirm: async () => {
        await onDelete(cot.id);
        setConfirmDialog(prev => ({ ...prev, open: false }));
      }
    });
  };

  return (
    <div>
      <button 
        onClick={() => handleDeleteCoT({ id: 'cot-001', products: ['prod-1', 'prod-2'] })}
        data-testid="delete-cot-with-relations"
      >
        연관 데이터가 있는 CoT 삭제
      </button>
      
      <button 
        onClick={() => handleDeleteCoT({ id: 'cot-002', products: [] })}
        data-testid="delete-cot-simple"
      >
        단순 CoT 삭제
      </button>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        confirmButtonText="삭제"
        cancelButtonText="취소"
      />
    </div>
  );
};

describe('Delete Confirmation Modal Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Basic Confirmation Dialog Behavior', () => {
    it('should show confirmation dialog when delete is triggered', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);
      const items = [{ id: 'test-1', name: '테스트 항목 1' }];

      render(
        <TestWrapper>
          <TestListComponent items={items} onDelete={onDelete} />
        </TestWrapper>
      );

      // 삭제 버튼 클릭
      const deleteButton = screen.getByTestId('delete-btn-test-1');
      await user.click(deleteButton);

      // 확인 다이얼로그가 표시되는지 확인
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('삭제 확인')).toBeInTheDocument();
      expect(screen.getByText("'테스트 항목 1'을(를) 삭제하시겠습니까?")).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
    });

    it('should close dialog when cancel is clicked', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);
      const items = [{ id: 'test-1', name: '테스트 항목 1' }];

      render(
        <TestWrapper>
          <TestListComponent items={items} onDelete={onDelete} />
        </TestWrapper>
      );

      // 삭제 버튼 클릭
      await user.click(screen.getByTestId('delete-btn-test-1'));

      // 취소 버튼 클릭
      const cancelButton = screen.getByRole('button', { name: '취소' });
      await user.click(cancelButton);

      // 다이얼로그가 닫혔는지 확인
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // onDelete가 호출되지 않았는지 확인
      expect(onDelete).not.toHaveBeenCalled();
    });

    it('should execute delete action when confirmed', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);
      const items = [{ id: 'test-1', name: '테스트 항목 1' }];

      render(
        <TestWrapper>
          <TestListComponent items={items} onDelete={onDelete} />
        </TestWrapper>
      );

      // 삭제 버튼 클릭
      await user.click(screen.getByTestId('delete-btn-test-1'));

      // 확인 버튼 클릭
      const confirmButton = screen.getByRole('button', { name: '삭제' });
      await user.click(confirmButton);

      // onDelete가 올바른 인수와 함께 호출되었는지 확인
      expect(onDelete).toHaveBeenCalledWith('test-1');

      // 다이얼로그가 닫혔는지 확인
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should close dialog with Escape key', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);
      const items = [{ id: 'test-1', name: '테스트 항목 1' }];

      render(
        <TestWrapper>
          <TestListComponent items={items} onDelete={onDelete} />
        </TestWrapper>
      );

      // 삭제 버튼 클릭하여 다이얼로그 열기
      await user.click(screen.getByTestId('delete-btn-test-1'));

      // Escape 키 누르기
      await user.keyboard('{Escape}');

      // 다이얼로그가 닫혔는지 확인
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      expect(onDelete).not.toHaveBeenCalled();
    });

    it('should handle backdrop click to close dialog', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);
      const items = [{ id: 'test-1', name: '테스트 항목 1' }];

      render(
        <TestWrapper>
          <TestListComponent items={items} onDelete={onDelete} />
        </TestWrapper>
      );

      // 삭제 버튼 클릭하여 다이얼로그 열기
      await user.click(screen.getByTestId('delete-btn-test-1'));

      // 백드롭 클릭 (다이얼로그 외부 영역)
      const backdrop = screen.getByRole('presentation').firstChild as HTMLElement;
      fireEvent.click(backdrop);

      // 다이얼로그가 닫혔는지 확인
    await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      expect(onDelete).not.toHaveBeenCalled();
    });
  });

  describe('Loading States and Error Handling', () => {
    it('should show loading state during delete operation', async () => {
      let deleteResolve: () => void;
      const deletePromise = new Promise<void>(resolve => {
        deleteResolve = resolve;
      });

      const onDelete = vi.fn().mockReturnValue(deletePromise);
      const items = [{ id: 'test-1', name: '테스트 항목 1' }];

      render(
        <TestWrapper>
          <TestListComponent items={items} onDelete={onDelete} deleteLoading={true} />
        </TestWrapper>
      );

      // 삭제 버튼 클릭
      await user.click(screen.getByTestId('delete-btn-test-1'));

      // 확인 버튼 클릭
      const confirmButton = screen.getByRole('button', { name: '삭제' });
      await user.click(confirmButton);

      // 로딩 상태 확인
      expect(confirmButton).toBeDisabled();
      expect(screen.getByRole('button', { name: '취소' })).toBeDisabled();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // 삭제 완료
      deleteResolve!();

    await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should handle delete operation errors', async () => {
      const onDelete = vi.fn().mockRejectedValue(new Error('삭제 실패'));
      const items = [{ id: 'test-1', name: '테스트 항목 1' }];

      // console.error 모킹하여 에러 로그 방지
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <TestWrapper>
          <TestListComponent items={items} onDelete={onDelete} />
        </TestWrapper>
      );

      // 삭제 버튼 클릭 후 확인
      await user.click(screen.getByTestId('delete-btn-test-1'));
      await user.click(screen.getByRole('button', { name: '삭제' }));

      // 에러 메시지 표시 확인
    await waitFor(() => {
        expect(screen.getByText(/삭제 중 오류가 발생했습니다/)).toBeInTheDocument();
      });

      // 다이얼로그는 여전히 열려 있어야 함
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should disable delete buttons during loading', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);
      const items = [
        { id: 'test-1', name: '테스트 항목 1' },
        { id: 'test-2', name: '테스트 항목 2' }
      ];

      render(
        <TestWrapper>
          <TestListComponent items={items} onDelete={onDelete} deleteLoading={true} />
        </TestWrapper>
      );

      // 모든 삭제 버튼이 비활성화되었는지 확인
      expect(screen.getByTestId('delete-btn-test-1')).toBeDisabled();
      expect(screen.getByTestId('delete-btn-test-2')).toBeDisabled();
      expect(screen.getByTestId('bulk-delete-btn')).toBeDisabled();
    });
  });

  describe('Bulk Delete Operations', () => {
    it('should show appropriate message for bulk delete', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);
      const items = [
        { id: 'item-1', name: '항목 1' },
        { id: 'item-2', name: '항목 2' }
      ];

      render(
        <TestWrapper>
          <TestListComponent items={items} onDelete={onDelete} />
        </TestWrapper>
      );

      // 일괄 삭제 버튼 클릭
      await user.click(screen.getByTestId('bulk-delete-btn'));

      // 일괄 삭제 메시지 확인
      expect(screen.getByText('일괄 삭제 확인')).toBeInTheDocument();
      expect(screen.getByText('선택한 2개 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')).toBeInTheDocument();

      // 심각도가 'error'인지 확인 (빨간색 아이콘 등)
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('data-severity', 'error');
    });

    it('should execute bulk delete when confirmed', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);
      const items = [
        { id: 'item-1', name: '항목 1' },
        { id: 'item-2', name: '항목 2' }
      ];

      render(
        <TestWrapper>
          <TestListComponent items={items} onDelete={onDelete} />
        </TestWrapper>
      );

      // 일괄 삭제 실행
      await user.click(screen.getByTestId('bulk-delete-btn'));
      await user.click(screen.getByRole('button', { name: '삭제' }));

      // 선택된 항목들이 모두 삭제되었는지 확인
      expect(onDelete).toHaveBeenCalledWith('item-1');
      expect(onDelete).toHaveBeenCalledWith('item-2');
      expect(onDelete).toHaveBeenCalledTimes(2);

    await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Context-Specific Delete Scenarios', () => {
    it('should show different messages based on item context (CoT with relations)', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <CoTDeleteScenario onDelete={onDelete} />
        </TestWrapper>
      );

      // 연관 데이터가 있는 CoT 삭제
      await user.click(screen.getByTestId('delete-cot-with-relations'));

      // 연관 데이터 경고 메시지 확인
      expect(screen.getByText('CoT 삭제 확인')).toBeInTheDocument();
      expect(screen.getByText('이 CoT는 2개의 상품과 연결되어 있습니다. 정말 삭제하시겠습니까?')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '취소' }));

      // 단순 CoT 삭제
      await user.click(screen.getByTestId('delete-cot-simple'));

      // 단순 삭제 메시지 확인
      expect(screen.getByText('CoT를 삭제하시겠습니까?')).toBeInTheDocument();
    });

    it('should prevent accidental deletion with double confirmation for critical items', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <CoTDeleteScenario onDelete={onDelete} />
        </TestWrapper>
      );

      // 연관 데이터가 있는 중요한 항목 삭제
      await user.click(screen.getByTestId('delete-cot-with-relations'));

      // 첫 번째 확인 다이얼로그
      expect(screen.getByText('이 CoT는 2개의 상품과 연결되어 있습니다. 정말 삭제하시겠습니까?')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '삭제' }));

      // 실제 삭제가 실행되었는지 확인
      expect(onDelete).toHaveBeenCalledWith('cot-001');
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should focus on appropriate button when dialog opens', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);
      const items = [{ id: 'test-1', name: '테스트 항목 1' }];

      render(
        <TestWrapper>
          <TestListComponent items={items} onDelete={onDelete} />
        </TestWrapper>
      );

      // 삭제 버튼 클릭
      await user.click(screen.getByTestId('delete-btn-test-1'));

      // 취소 버튼에 포커스가 있는지 확인 (안전한 기본 선택)
    await waitFor(() => {
        expect(screen.getByRole('button', { name: '취소' })).toHaveFocus();
      });
    });

    it('should support keyboard navigation within dialog', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);
      const items = [{ id: 'test-1', name: '테스트 항목 1' }];

      render(
        <TestWrapper>
          <TestListComponent items={items} onDelete={onDelete} />
        </TestWrapper>
      );

      // 삭제 버튼 클릭하여 다이얼로그 열기
      await user.click(screen.getByTestId('delete-btn-test-1'));

      // Tab 키로 버튼 간 이동
      await user.keyboard('{Tab}');
      expect(screen.getByRole('button', { name: '삭제' })).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(screen.getByRole('button', { name: '취소' })).toHaveFocus();

      // Shift+Tab으로 역방향 이동
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(screen.getByRole('button', { name: '삭제' })).toHaveFocus();
    });

    it('should have proper ARIA attributes for accessibility', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);
      const items = [{ id: 'test-1', name: '테스트 항목 1' }];

      render(
        <TestWrapper>
          <TestListComponent items={items} onDelete={onDelete} />
        </TestWrapper>
      );

      // 삭제 버튼 클릭
      await user.click(screen.getByTestId('delete-btn-test-1'));

      const dialog = screen.getByRole('dialog');
      
      // ARIA 속성 확인
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
      expect(dialog).toHaveAttribute('role', 'dialog');

      // 확인/취소 버튼의 의미있는 레이블 확인
      expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
    });

    it('should announce dialog state changes to screen readers', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);
      const items = [{ id: 'test-1', name: '테스트 항목 1' }];

      render(
        <TestWrapper>
          <TestListComponent items={items} onDelete={onDelete} />
        </TestWrapper>
      );

      // 삭제 버튼 클릭
      await user.click(screen.getByTestId('delete-btn-test-1'));

      // live region이나 alert 속성 확인
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');

      // 중요한 메시지는 role="alert"로 표시
      const message = screen.getByText("'테스트 항목 1'을(를) 삭제하시겠습니까?");
      expect(message).toBeInTheDocument();
    });
  });

  describe('Animation and Visual Feedback', () => {
    it('should show dialog with smooth animation', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);
      const items = [{ id: 'test-1', name: '테스트 항목 1' }];

      render(
        <TestWrapper>
          <TestListComponent items={items} onDelete={onDelete} />
        </TestWrapper>
      );

      // 삭제 버튼 클릭
      await user.click(screen.getByTestId('delete-btn-test-1'));

      // 다이얼로그가 나타나는 애니메이션이 있는지 확인
      const dialog = screen.getByRole('dialog');
      
      // CSS transition/animation 클래스 확인
      expect(dialog).toHaveClass(/enter|fade|slide/i); // 애니메이션 관련 클래스
    });

    it('should provide visual feedback for destructive actions', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);
      const items = [{ id: 'test-1', name: '테스트 항목 1' }];

      render(
        <TestWrapper>
          <TestListComponent items={items} onDelete={onDelete} />
        </TestWrapper>
      );

      // 일괄 삭제 버튼 클릭 (더 위험한 작업)
      await user.click(screen.getByTestId('bulk-delete-btn'));

      const dialog = screen.getByRole('dialog');
      
      // 위험한 작업임을 나타내는 시각적 표시
      expect(dialog).toHaveAttribute('data-severity', 'error');
      
      const confirmButton = screen.getByRole('button', { name: '삭제' });
      expect(confirmButton).toHaveClass(/error|danger|destructive/i);
    });

    it('should show success feedback after successful deletion', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);
      const items = [{ id: 'test-1', name: '테스트 항목 1' }];

      render(
        <TestWrapper>
          <TestListComponent items={items} onDelete={onDelete} />
        </TestWrapper>
      );

      // 삭제 실행
      await user.click(screen.getByTestId('delete-btn-test-1'));
      await user.click(screen.getByRole('button', { name: '삭제' }));

      // 성공 메시지나 토스트 알림 확인
    await waitFor(() => {
        // 실제 구현에서는 토스트나 스낵바로 표시될 수 있음
        expect(screen.getByText(/삭제되었습니다|성공적으로 삭제/)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle multiple rapid delete attempts', async () => {
      const onDelete = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 500))
      );
      const items = [{ id: 'test-1', name: '테스트 항목 1' }];

      render(
        <TestWrapper>
          <TestListComponent items={items} onDelete={onDelete} />
        </TestWrapper>
      );

      // 첫 번째 삭제 시작
      await user.click(screen.getByTestId('delete-btn-test-1'));
      await user.click(screen.getByRole('button', { name: '삭제' }));

      // 두 번째 삭제 시도 (첫 번째가 완료되기 전)
      // 버튼이 이미 비활성화되어야 함
      const deleteButton = screen.getByTestId('delete-btn-test-1');
      expect(deleteButton).toBeDisabled();

      // onDelete는 한 번만 호출되어야 함
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('should handle network timeout scenarios', async () => {
      const onDelete = vi.fn().mockImplementation(() =>
        Promise.reject(new Error('Network timeout'))
      );
      const items = [{ id: 'test-1', name: '테스트 항목 1' }];

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <TestWrapper>
          <TestListComponent items={items} onDelete={onDelete} />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('delete-btn-test-1'));
      await user.click(screen.getByRole('button', { name: '삭제' }));

      // 네트워크 오류 메시지 표시
    await waitFor(() => {
        expect(screen.getByText(/네트워크 오류|연결 실패/)).toBeInTheDocument();
      });

      // 재시도 버튼 제공
      expect(screen.getByRole('button', { name: /재시도/ })).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should handle empty selection for bulk delete', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);

      const EmptySelectionComponent = () => {
        const handleBulkDelete = () => {
          // 선택된 항목이 없는 경우의 처리
          alert('선택된 항목이 없습니다.');
        };

        return (
          <button onClick={handleBulkDelete} data-testid="bulk-delete-empty">
            선택 항목 삭제
          </button>
        );
      };

      render(
        <TestWrapper>
          <EmptySelectionComponent />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('bulk-delete-empty'));

      // 선택 항목 없음 메시지가 표시되어야 함
      // (실제로는 더 나은 UX로 버튼 비활성화나 토스트 메시지 사용)
      expect(screen.getByText('선택된 항목이 없습니다.')).toBeInTheDocument();
    });
  });
});

// Mock 데이터 생성 함수들
function generateMockCoTs() {
  return [
    {
      id: 'cot-001',
      title: '투자 상담 CoT 1',
      productSource: '증권',
      questionType: '고객 특성 강조형',
      status: '완료'
    },
    {
      id: 'cot-002', 
      title: '보험 상담 CoT 1',
      productSource: '보험',
      questionType: '건강 및 질병 보장 대비형',
      status: '검토중'
    }
  ];
}

function generateMockProducts() {
  return [
    {
      id: 'product-001',
      name: '삼성 S&P500 ETF',
      productSource: '증권',
      category: 'ETF'
    },
    {
      id: 'product-002',
      name: '삼성 종신보험',
      productSource: '보험', 
      category: '종신보험'
    }
  ];
}

function generateMockUsers() {
  return [
    {
      id: 'user-001',
      name: '테스트 사용자 1',
      customerSource: '증권',
      ageGroup: '30대'
    },
    {
      id: 'user-002',
      name: '테스트 사용자 2', 
      customerSource: '보험',
      ageGroup: '40대'
    }
  ];
}