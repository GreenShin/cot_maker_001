import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { CotsDetailPage } from '../../../src/pages/cots/CotsDetailPage';
import { theme } from '../../../src/styles/theme';

const createMockStore = () => configureStore({
  reducer: {
    cots: (state = { currentCoT: null, loading: false }, action) => state,
    users: (state = { items: [], selectedUser: null }, action) => state,
    products: (state = { items: [], selectedProducts: [] }, action) => state,
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

describe('CoTs Form Validation Integration', () => {
  beforeEach(() => {
    // Reset any previous state
    vi.clearAllMocks();
  });

  it('should show validation errors for required fields', async () => {
    renderWithProviders(<CotsDetailPage />);
    
    // Try to save without filling required fields
    const saveButton = screen.getByText(/저장/);
    fireEvent.click(saveButton);

    await waitFor(() => {
      // Should show validation errors
      expect(screen.getByText(/상품분류를 선택해주세요/)).toBeInTheDocument();
      expect(screen.getByText(/질문유형을 선택해주세요/)).toBeInTheDocument();
      expect(screen.getByText(/질문을 입력해주세요/)).toBeInTheDocument();
      expect(screen.getByText(/CoT1을 입력해주세요/)).toBeInTheDocument();
      expect(screen.getByText(/CoT2를 입력해주세요/)).toBeInTheDocument();
      expect(screen.getByText(/CoT3을 입력해주세요/)).toBeInTheDocument();
      expect(screen.getByText(/답변을 입력해주세요/)).toBeInTheDocument();
    });
  });

  it('should validate question type based on product source', async () => {
    renderWithProviders(<CotsDetailPage />);
    
    // Select 증권 as product source
    const productSourceSelect = screen.getByLabelText(/상품분류/);
    fireEvent.mouseDown(productSourceSelect);
    fireEvent.click(screen.getByText('증권'));

    // Question type should only show securities options
    const questionTypeSelect = screen.getByLabelText(/질문유형/);
    fireEvent.mouseDown(questionTypeSelect);

    await waitFor(() => {
      expect(screen.getByText('고객 특성 강조형')).toBeInTheDocument();
      expect(screen.getByText('투자성향 및 조건 기반형')).toBeInTheDocument();
      expect(screen.getByText('상품비교 추천형')).toBeInTheDocument();
      
      // Should not show insurance question types
      expect(screen.queryByText('건강 및 질병 보장 대비형')).not.toBeInTheDocument();
    });
  });

  it('should manage dynamic CoTn fields correctly', async () => {
    renderWithProviders(<CotsDetailPage />);
    
    // Should have CoT1, CoT2, CoT3 by default
    expect(screen.getByLabelText(/CoT1/)).toBeInTheDocument();
    expect(screen.getByLabelText(/CoT2/)).toBeInTheDocument();
    expect(screen.getByLabelText(/CoT3/)).toBeInTheDocument();
    
    // Add CoT4
    const addCoTButton = screen.getByText(/CoT 단계 추가/);
    fireEvent.click(addCoTButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/CoT4/)).toBeInTheDocument();
    });

    // Should be able to delete CoT4 but not CoT1-3
    const deleteCoT4Button = screen.getByLabelText(/CoT4 삭제/);
    expect(deleteCoT4Button).toBeInTheDocument();
    
    expect(screen.queryByLabelText(/CoT1 삭제/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/CoT2 삭제/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/CoT3 삭제/)).not.toBeInTheDocument();
  });

  it('should require questioner and at least one product selection', async () => {
    renderWithProviders(<CotsDetailPage />);
    
    // Fill required form fields but skip questioner/product selection
    fireEvent.change(screen.getByLabelText(/질문/), { target: { value: '테스트 질문' } });
    fireEvent.change(screen.getByLabelText(/CoT1/), { target: { value: 'CoT1 내용' } });
    fireEvent.change(screen.getByLabelText(/CoT2/), { target: { value: 'CoT2 내용' } });
    fireEvent.change(screen.getByLabelText(/CoT3/), { target: { value: 'CoT3 내용' } });
    fireEvent.change(screen.getByLabelText(/답변/), { target: { value: '답변 내용' } });

    const saveButton = screen.getByText(/저장/);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/질문자를 선택해주세요/)).toBeInTheDocument();
      expect(screen.getByText(/상품을 최소 1개 선택해주세요/)).toBeInTheDocument();
    });
  });

  it('should show author from settings for new CoT', async () => {
    renderWithProviders(<CotsDetailPage />);
    
    // Should show author from settings (not editable)
    const authorField = screen.getByDisplayValue('관리자');
    expect(authorField).toBeInTheDocument();
    expect(authorField).toBeDisabled();
  });

  it('should validate text length limits', async () => {
    renderWithProviders(<CotsDetailPage />);
    
    // Try to enter text exceeding limits
    const longText = 'a'.repeat(10001); // Assuming 10000 char limit
    
    const questionField = screen.getByLabelText(/질문/);
    fireEvent.change(questionField, { target: { value: longText } });
    
    const saveButton = screen.getByText(/저장/);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/질문은 10000자를 초과할 수 없습니다/)).toBeInTheDocument();
    });
  });
});
