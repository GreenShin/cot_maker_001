import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { CotsDetailPage } from '../../../src/pages/cots/CotsDetailPage';
import { UsersListPage } from '../../../src/pages/users/UsersListPage';
import { ProductsListPage } from '../../../src/pages/products/ProductsListPage';
import { theme } from '../../../src/styles/theme';

const createMockStore = () => configureStore({
  reducer: {
    cots: (state = { 
      currentCoT: { 
        id: 'cot-1', 
        question: '테스트 질문',
        author: '관리자' 
      }, 
      loading: false 
    }, action) => state,
    users: (state = { 
      items: [{ id: 'user-1', customerSource: '증권', ageGroup: '30대' }], 
      loading: false 
    }, action) => state,
    products: (state = { 
      items: [{ id: 'prod-1', productName: '삼성전자', productSource: '증권' }], 
      loading: false 
    }, action) => state,
    settings: (state = { author: '관리자' }, action) => state
  }
});

const renderWithProviders = (component: React.ReactElement) => {
  const store = createMockStore();
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
};

describe('Delete Confirmation Modal Integration', () => {
  beforeEach(() => {
    // Mock window.confirm and fetch
    global.confirm = vi.fn();
    global.fetch = vi.fn();
  });

  it('should show confirmation dialog when deleting CoT', async () => {
    renderWithProviders(<CotsDetailPage />);
    
    const deleteButton = screen.getByText(/삭제/);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/정말 삭제하시겠습니까?/)).toBeInTheDocument();
      expect(screen.getByText(/확인/)).toBeInTheDocument();
      expect(screen.getByText(/취소/)).toBeInTheDocument();
    });
  });

  it('should proceed with deletion when confirmed', async () => {
    const mockDelete = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = mockDelete;

    renderWithProviders(<CotsDetailPage />);
    
    const deleteButton = screen.getByText(/삭제/);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/정말 삭제하시겠습니까?/)).toBeInTheDocument();
    });

    const confirmButton = screen.getByText(/확인/);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(
        expect.stringContaining('/api/cots/cot-1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  it('should cancel deletion when cancelled', async () => {
    const mockDelete = vi.fn();
    global.fetch = mockDelete;

    renderWithProviders(<CotsDetailPage />);
    
    const deleteButton = screen.getByText(/삭제/);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/정말 삭제하시겠습니까?/)).toBeInTheDocument();
    });

    const cancelButton = screen.getByText(/취소/);
    fireEvent.click(cancelButton);

    await waitFor(() => {
      // Dialog should be closed
      expect(screen.queryByText(/정말 삭제하시겠습니까?/)).not.toBeInTheDocument();
      // Delete API should not be called
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });

  it('should show confirmation dialog for user deletion from list', async () => {
    renderWithProviders(<UsersListPage />);
    
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    // Click delete button on first row
    const deleteButton = screen.getByLabelText(/삭제/);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/정말 삭제하시겠습니까?/)).toBeInTheDocument();
      expect(screen.getByText(/이 질문자를 삭제하면 관련된 모든 CoT도 함께 삭제됩니다/)).toBeInTheDocument();
    });
  });

  it('should show confirmation dialog for product deletion from list', async () => {
    renderWithProviders(<ProductsListPage />);
    
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    // Click delete button on first row
    const deleteButton = screen.getByLabelText(/삭제/);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/정말 삭제하시겠습니까?/)).toBeInTheDocument();
      expect(screen.getByText(/이 상품을 삭제하면 관련된 모든 CoT에서 제거됩니다/)).toBeInTheDocument();
    });
  });

  it('should handle deletion errors gracefully', async () => {
    const mockDelete = vi.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = mockDelete;

    renderWithProviders(<CotsDetailPage />);
    
    const deleteButton = screen.getByText(/삭제/);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/정말 삭제하시겠습니까?/)).toBeInTheDocument();
    });

    const confirmButton = screen.getByText(/확인/);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/삭제 중 오류가 발생했습니다/)).toBeInTheDocument();
    });
  });

  it('should prevent multiple deletion attempts', async () => {
    const mockDelete = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ ok: true }), 1000))
    );
    global.fetch = mockDelete;

    renderWithProviders(<CotsDetailPage />);
    
    const deleteButton = screen.getByText(/삭제/);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/정말 삭제하시겠습니까?/)).toBeInTheDocument();
    });

    const confirmButton = screen.getByText(/확인/);
    
    // Click multiple times rapidly
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      // Should only call delete once
      expect(mockDelete).toHaveBeenCalledTimes(1);
      // Confirm button should be disabled during deletion
      expect(confirmButton).toBeDisabled();
    });
  });
});
