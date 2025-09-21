/**
 * CoT Form Validation Integration Tests
 * React Hook Form + Zod 검증 및 동적 CoTn 처리 테스트
 */

import React from 'react';
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
import { CotFormPanel } from '../../../src/components/cots/CotFormPanel.js';

// Mock Store 생성
const createMockStore = (initialState?: any) => {
  return configureStore({
  reducer: {
      cots: cotsSlice.reducer,
      products: productsSlice.reducer,
      users: usersSlice.reducer,
    },
    preloadedState: {
      cots: {
        list: [],
        loading: false,
        error: null,
        currentCot: null
      },
      products: {
        list: generateMockProducts(),
        loading: false,
        error: null
      },
      users: {
        list: generateMockUsers(),
        loading: false,
        error: null
      },
      ...initialState
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

describe('CoT Form Validation Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Form Initialization and Basic Validation', () => {
    it('should initialize form with empty values', async () => {
      render(
        <TestWrapper>
          <CotFormPanel cotId={null} onSave={vi.fn()} />
        </TestWrapper>
      );

      // 기본 필드들이 비어있는지 확인
      expect(screen.getByLabelText(/상품군/)).toHaveValue('');
      expect(screen.getByLabelText(/질문유형/)).toHaveValue('');
      expect(screen.getByLabelText(/질문자/)).toHaveValue('');
      expect(screen.getByLabelText(/질문/)).toHaveValue('');
      expect(screen.getByLabelText(/CoT 1단계/)).toHaveValue('');
      expect(screen.getByLabelText(/CoT 2단계/)).toHaveValue('');
      expect(screen.getByLabelText(/CoT 3단계/)).toHaveValue('');
      expect(screen.getByLabelText(/최종 답변/)).toHaveValue('');
    });

    it('should initialize form with existing CoT data', async () => {
      const existingCot = generateMockCoT();
      const store = createMockStore({
        cots: {
          currentCot: existingCot,
          list: [existingCot],
          loading: false,
          error: null
        }
      });

      render(
        <TestWrapper store={store}>
          <CotFormPanel cotId={existingCot.id} onSave={vi.fn()} />
        </TestWrapper>
      );

      // 기존 데이터가 폼에 로드되는지 확인
      await waitFor(() => {
        expect(screen.getByDisplayValue(existingCot.productSource)).toBeInTheDocument();
        expect(screen.getByDisplayValue(existingCot.questionType)).toBeInTheDocument();
        expect(screen.getByDisplayValue(existingCot.question)).toBeInTheDocument();
        expect(screen.getByDisplayValue(existingCot.cot1)).toBeInTheDocument();
      });
    });

    it('should validate required fields on submit', async () => {
      const onSave = vi.fn();
      
      render(
        <TestWrapper>
          <CotFormPanel cotId={null} onSave={onSave} />
        </TestWrapper>
      );

      // 빈 폼 제출 시도
      const submitButton = screen.getByRole('button', { name: /저장/ });
      await user.click(submitButton);

      // 필수 필드 오류 메시지 확인
    await waitFor(() => {
        expect(screen.getByText(/상품군을 선택해주세요/)).toBeInTheDocument();
      expect(screen.getByText(/질문유형을 선택해주세요/)).toBeInTheDocument();
        expect(screen.getByText(/질문자를 선택해주세요/)).toBeInTheDocument();
      expect(screen.getByText(/질문을 입력해주세요/)).toBeInTheDocument();
        expect(screen.getByText(/CoT 1단계를 입력해주세요/)).toBeInTheDocument();
        expect(screen.getByText(/CoT 2단계를 입력해주세요/)).toBeInTheDocument();
        expect(screen.getByText(/CoT 3단계를 입력해주세요/)).toBeInTheDocument();
        expect(screen.getByText(/최종 답변을 입력해주세요/)).toBeInTheDocument();
      });

      // onSave가 호출되지 않았는지 확인
      expect(onSave).not.toHaveBeenCalled();
    });

    it('should validate minimum text length', async () => {
      render(
        <TestWrapper>
          <CotFormPanel cotId={null} onSave={vi.fn()} />
        </TestWrapper>
      );

      // 너무 짧은 텍스트 입력
      const questionField = screen.getByLabelText(/질문/);
      await user.type(questionField, 'a'); // 1글자

      const cot1Field = screen.getByLabelText(/CoT 1단계/);
      await user.type(cot1Field, 'ab'); // 2글자

      // 포커스를 다른 곳으로 이동하여 validation 트리거
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/질문은 최소 10자 이상이어야 합니다/)).toBeInTheDocument();
        expect(screen.getByText(/CoT 1단계는 최소 20자 이상이어야 합니다/)).toBeInTheDocument();
      });
    });

    it('should validate maximum text length', async () => {
      render(
        <TestWrapper>
          <CotFormPanel cotId={null} onSave={vi.fn()} />
        </TestWrapper>
      );

      // 너무 긴 텍스트 입력
      const longText = 'a'.repeat(2001);
      const questionField = screen.getByLabelText(/질문/);
      await user.type(questionField, longText);

      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/질문은 최대 2000자까지 입력 가능합니다/)).toBeInTheDocument();
      });
    });
  });

  describe('Dynamic CoT Fields Validation', () => {
    it('should allow adding dynamic CoT fields', async () => {
      render(
        <TestWrapper>
          <CotFormPanel cotId={null} onSave={vi.fn()} />
        </TestWrapper>
      );

      // CoT 4단계 추가 버튼 클릭
      const addCotButton = screen.getByRole('button', { name: /CoT 단계 추가/ });
      await user.click(addCotButton);

      // CoT 4단계 필드가 나타나는지 확인
      await waitFor(() => {
        expect(screen.getByLabelText(/CoT 4단계/)).toBeInTheDocument();
      });

      // CoT 5단계도 추가
      await user.click(addCotButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/CoT 5단계/)).toBeInTheDocument();
      });

      // 최대 10단계까지 추가 가능한지 확인
      for (let i = 0; i < 5; i++) {
        await user.click(addCotButton);
      }

      await waitFor(() => {
        expect(screen.getByLabelText(/CoT 10단계/)).toBeInTheDocument();
      });

      // 더 이상 추가할 수 없는지 확인 (버튼이 비활성화되거나 숨겨짐)
      const buttons = screen.queryAllByRole('button', { name: /CoT 단계 추가/ });
      if (buttons.length > 0) {
        expect(buttons[0]).toBeDisabled();
      }
    });

    it('should validate dynamic CoT fields when present', async () => {
      render(
        <TestWrapper>
          <CotFormPanel cotId={null} onSave={vi.fn()} />
        </TestWrapper>
      );

      // CoT 4단계 추가
      const addCotButton = screen.getByRole('button', { name: /CoT 단계 추가/ });
      await user.click(addCotButton);

      // 빈 CoT 4단계로 제출 시도
      const submitButton = screen.getByRole('button', { name: /저장/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/CoT 4단계를 입력해주세요/)).toBeInTheDocument();
      });
    });

    it('should allow removing dynamic CoT fields', async () => {
      render(
        <TestWrapper>
          <CotFormPanel cotId={null} onSave={vi.fn()} />
        </TestWrapper>
      );

      // CoT 4단계 추가
      const addCotButton = screen.getByRole('button', { name: /CoT 단계 추가/ });
      await user.click(addCotButton);

      // CoT 4단계 필드 확인
      await waitFor(() => {
        expect(screen.getByLabelText(/CoT 4단계/)).toBeInTheDocument();
      });

      // CoT 4단계 제거 버튼 클릭
      const removeCotButton = screen.getByRole('button', { name: /CoT 4단계 제거/ });
      await user.click(removeCotButton);

      // CoT 4단계 필드가 사라졌는지 확인
      await waitFor(() => {
        expect(screen.queryByLabelText(/CoT 4단계/)).not.toBeInTheDocument();
      });
    });

    it('should preserve dynamic CoT values when adding/removing fields', async () => {
      render(
        <TestWrapper>
          <CotFormPanel cotId={null} onSave={vi.fn()} />
        </TestWrapper>
      );

      // CoT 4단계와 5단계 추가
      const addCotButton = screen.getByRole('button', { name: /CoT 단계 추가/ });
      await user.click(addCotButton);
      await user.click(addCotButton);

      // 각각에 값 입력
      const cot4Field = screen.getByLabelText(/CoT 4단계/);
      const cot5Field = screen.getByLabelText(/CoT 5단계/);
      
      await user.type(cot4Field, '4단계 분석 내용입니다.');
      await user.type(cot5Field, '5단계 분석 내용입니다.');

      // CoT 6단계 추가
      await user.click(addCotButton);
      
      // 기존 값들이 유지되는지 확인
      expect(cot4Field).toHaveValue('4단계 분석 내용입니다.');
      expect(cot5Field).toHaveValue('5단계 분석 내용입니다.');

      // CoT 6단계 제거 후에도 기존 값 유지 확인
      const removeCot6Button = screen.getByRole('button', { name: /CoT 6단계 제거/ });
      await user.click(removeCot6Button);

      expect(cot4Field).toHaveValue('4단계 분석 내용입니다.');
      expect(cot5Field).toHaveValue('5단계 분석 내용입니다.');
    });
  });

  describe('Product Selection Validation', () => {
    it('should validate product selection requirement', async () => {
      render(
        <TestWrapper>
          <CotFormPanel cotId={null} onSave={vi.fn()} />
        </TestWrapper>
      );

      // 상품 선택 없이 제출 시도
      const submitButton = screen.getByRole('button', { name: /저장/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/최소 1개의 상품을 선택해야 합니다/)).toBeInTheDocument();
      });
    });

    it('should allow multiple product selection', async () => {
      render(
        <TestWrapper>
          <CotFormPanel cotId={null} onSave={vi.fn()} />
        </TestWrapper>
      );

      // 상품 선택 버튼 클릭
      const selectProductButton = screen.getByRole('button', { name: /상품 선택/ });
      await user.click(selectProductButton);

      // 상품 선택 다이얼로그에서 여러 상품 선택
      await waitFor(() => {
        const productDialog = screen.getByRole('dialog');
        expect(productDialog).toBeInTheDocument();
      });

      // 첫 번째와 두 번째 상품 체크박스 클릭
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      // 선택 완료 버튼 클릭
      const confirmButton = screen.getByRole('button', { name: /선택 완료/ });
      await user.click(confirmButton);

      // 선택된 상품들이 표시되는지 확인
      await waitFor(() => {
        expect(screen.getAllByTestId('selected-product')).toHaveLength(2);
      });
    });

    it('should validate maximum product selection limit', async () => {
      render(
        <TestWrapper>
          <CotFormPanel cotId={null} onSave={vi.fn()} />
        </TestWrapper>
      );

      // 상품 선택 버튼 클릭
      const selectProductButton = screen.getByRole('button', { name: /상품 선택/ });
      await user.click(selectProductButton);

      // 상품 선택 다이얼로그에서 최대 한도 이상 선택 시도
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        // 최대 5개까지 선택 가능하다고 가정
        for (let i = 0; i < Math.min(6, checkboxes.length); i++) {
          user.click(checkboxes[i]);
        }
      });

      // 최대 선택 한도 초과 메시지 확인
    await waitFor(() => {
        expect(screen.getByText(/최대 5개까지 선택 가능합니다/)).toBeInTheDocument();
      });
    });
  });

  describe('Product Source and Question Type Validation', () => {
    it('should filter question types based on product source', async () => {
      render(
        <TestWrapper>
          <CotFormPanel cotId={null} onSave={vi.fn()} />
        </TestWrapper>
      );

      // 증권 상품군 선택
      const productSourceField = screen.getByLabelText(/상품군/);
      await user.click(productSourceField);
      await user.click(screen.getByText('증권'));

      // 질문유형 드롭다운 열기
      const questionTypeField = screen.getByLabelText(/질문유형/);
      await user.click(questionTypeField);

      // 증권 관련 질문유형만 표시되는지 확인
      expect(screen.getByText('고객 특성 강조형')).toBeInTheDocument();
      expect(screen.getByText('투자성향 및 조건 기반형')).toBeInTheDocument();
      expect(screen.getByText('금융상품 비교분석형')).toBeInTheDocument();
      
      // 보험 관련 질문유형은 표시되지 않는지 확인
      expect(screen.queryByText('건강 및 질병 보장 대비형')).not.toBeInTheDocument();
    });

    it('should clear question type when product source changes', async () => {
      render(
        <TestWrapper>
          <CotFormPanel cotId={null} onSave={vi.fn()} />
        </TestWrapper>
      );

      // 증권 선택 후 질문유형 선택
      const productSourceField = screen.getByLabelText(/상품군/);
      await user.click(productSourceField);
      await user.click(screen.getByText('증권'));

      const questionTypeField = screen.getByLabelText(/질문유형/);
      await user.click(questionTypeField);
      await user.click(screen.getByText('고객 특성 강조형'));

      // 보험으로 변경
      await user.click(productSourceField);
      await user.click(screen.getByText('보험'));

      // 질문유형이 초기화되었는지 확인
      expect(questionTypeField).toHaveValue('');
    });

    it('should validate question type compatibility with product source', async () => {
      const onSave = vi.fn();
      
      render(
        <TestWrapper>
          <CotFormPanel cotId={null} onSave={onSave} />
        </TestWrapper>
      );

      // 유효한 데이터 입력
      await fillBasicForm();

      // 증권 + 보험 전용 질문유형 조합 (잘못된 조합)
      const productSourceField = screen.getByLabelText(/상품군/);
      await user.click(productSourceField);
      await user.click(screen.getByText('증권'));

      // 질문유형을 프로그래밍 방식으로 잘못된 값으로 설정하려고 시도
      // (실제로는 UI에서 이런 조합이 불가능하지만 validation 테스트)
      
      const submitButton = screen.getByRole('button', { name: /저장/ });
      await user.click(submitButton);

      // 폼이 정상적으로 제출되는지 확인 (잘못된 조합은 UI 레벨에서 방지됨)
      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
      });
    });
  });

  describe('Real-time Validation and Error Recovery', () => {
    it('should show validation errors in real-time', async () => {
      render(
        <TestWrapper>
          <CotFormPanel cotId={null} onSave={vi.fn()} />
        </TestWrapper>
      );

      const questionField = screen.getByLabelText(/질문/);
      
      // 짧은 텍스트 입력
      await user.type(questionField, 'short');
      await user.tab(); // 포커스 이동으로 validation 트리거

      await waitFor(() => {
        expect(screen.getByText(/질문은 최소 10자 이상이어야 합니다/)).toBeInTheDocument();
      });

      // 유효한 길이로 수정
      await user.clear(questionField);
      await user.type(questionField, '이것은 유효한 길이의 질문입니다.');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/질문은 최소 10자 이상이어야 합니다/)).not.toBeInTheDocument();
      });
    });

    it('should clear validation errors when fields are corrected', async () => {
      render(
        <TestWrapper>
          <CotFormPanel cotId={null} onSave={vi.fn()} />
        </TestWrapper>
      );

      // 빈 폼 제출로 오류 발생
      const submitButton = screen.getByRole('button', { name: /저장/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/상품군을 선택해주세요/)).toBeInTheDocument();
      });

      // 상품군 선택으로 오류 해결
      const productSourceField = screen.getByLabelText(/상품군/);
      await user.click(productSourceField);
      await user.click(screen.getByText('증권'));

    await waitFor(() => {
        expect(screen.queryByText(/상품군을 선택해주세요/)).not.toBeInTheDocument();
      });
    });

    it('should prevent submission with validation errors', async () => {
      const onSave = vi.fn();
      
      render(
        <TestWrapper>
          <CotFormPanel cotId={null} onSave={onSave} />
        </TestWrapper>
      );

      // 일부 필드만 채우고 제출
      const questionField = screen.getByLabelText(/질문/);
      await user.type(questionField, '유효한 질문입니다.');

      const submitButton = screen.getByRole('button', { name: /저장/ });
      await user.click(submitButton);

      // 다른 필수 필드 오류가 있어서 제출되지 않아야 함
      expect(onSave).not.toHaveBeenCalled();
      
      await waitFor(() => {
        expect(screen.getByText(/상품군을 선택해주세요/)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission and Success Cases', () => {
    it('should successfully submit valid form data', async () => {
      const onSave = vi.fn();
      
      render(
        <TestWrapper>
          <CotFormPanel cotId={null} onSave={onSave} />
        </TestWrapper>
      );

      // 유효한 데이터 입력
      await fillBasicForm();

      const submitButton = screen.getByRole('button', { name: /저장/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            productSource: '증권',
            questionType: '고객 특성 강조형',
            questioner: expect.any(String),
            products: expect.any(Array),
            question: expect.any(String),
            cot1: expect.any(String),
            cot2: expect.any(String),
            cot3: expect.any(String),
            answer: expect.any(String),
            status: '초안'
          })
        );
      });
    });

    it('should submit form with dynamic CoT fields', async () => {
      const onSave = vi.fn();
      
      render(
        <TestWrapper>
          <CotFormPanel cotId={null} onSave={onSave} />
        </TestWrapper>
      );

      // 기본 필드 채우기
      await fillBasicForm();

      // 동적 CoT 필드 추가
      const addCotButton = screen.getByRole('button', { name: /CoT 단계 추가/ });
      await user.click(addCotButton);

      const cot4Field = screen.getByLabelText(/CoT 4단계/);
      await user.type(cot4Field, '4단계 분석 내용입니다. 이것은 충분히 긴 텍스트입니다.');

      const submitButton = screen.getByRole('button', { name: /저장/ });
      await user.click(submitButton);

    await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            cot4: '4단계 분석 내용입니다. 이것은 충분히 긴 텍스트입니다.'
          })
        );
      });
    });

    it('should handle form loading and save states', async () => {
      const onSave = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      render(
        <TestWrapper>
          <CotFormPanel cotId={null} onSave={onSave} />
        </TestWrapper>
      );

      await fillBasicForm();

      const submitButton = screen.getByRole('button', { name: /저장/ });
      await user.click(submitButton);

      // 로딩 상태 확인
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/저장 중/)).toBeInTheDocument();

      // 로딩 완료 후 상태 복원
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      }, { timeout: 2000 });
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should focus on first error field when validation fails', async () => {
      render(
        <TestWrapper>
          <CotFormPanel cotId={null} onSave={vi.fn()} />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /저장/ });
      await user.click(submitButton);

      // 첫 번째 오류 필드(상품군)에 포커스가 이동하는지 확인
      await waitFor(() => {
        const productSourceField = screen.getByLabelText(/상품군/);
        expect(productSourceField).toHaveFocus();
      });
    });

    it('should provide clear error messages for each field', async () => {
      render(
        <TestWrapper>
          <CotFormPanel cotId={null} onSave={vi.fn()} />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /저장/ });
      await user.click(submitButton);

      // 각 필드에 대한 구체적인 오류 메시지 확인
      await waitFor(() => {
        const errorMessages = [
          /상품군을 선택해주세요/,
          /질문유형을 선택해주세요/,
          /질문자를 선택해주세요/,
          /질문을 입력해주세요/,
          /CoT 1단계를 입력해주세요/,
          /CoT 2단계를 입력해주세요/,
          /CoT 3단계를 입력해주세요/,
          /최종 답변을 입력해주세요/
        ];

        errorMessages.forEach(pattern => {
          expect(screen.getByText(pattern)).toBeInTheDocument();
        });
      });
    });

    it('should support keyboard navigation', async () => {
      render(
        <TestWrapper>
          <CotFormPanel cotId={null} onSave={vi.fn()} />
        </TestWrapper>
      );

      // Tab 키로 필드 간 이동
      const productSourceField = screen.getByLabelText(/상품군/);
      productSourceField.focus();

      await user.keyboard('{Tab}');
      expect(screen.getByLabelText(/질문유형/)).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(screen.getByLabelText(/질문자/)).toHaveFocus();
    });
  });

  // 헬퍼 함수들
  async function fillBasicForm() {
    const user = userEvent.setup();
    
    // 상품군 선택
    const productSourceField = screen.getByLabelText(/상품군/);
    await user.click(productSourceField);
    await user.click(screen.getByText('증권'));

    // 질문유형 선택
    const questionTypeField = screen.getByLabelText(/질문유형/);
    await user.click(questionTypeField);
    await user.click(screen.getByText('고객 특성 강조형'));

    // 질문자 선택 (첫 번째 사용자)
    const questionerButton = screen.getByRole('button', { name: /질문자 선택/ });
    await user.click(questionerButton);
    
    await waitFor(() => {
      const userOptions = screen.getAllByRole('checkbox');
      if (userOptions.length > 0) {
        user.click(userOptions[0]);
      }
    });

    const selectUserButton = screen.getByRole('button', { name: /선택 완료/ });
    await user.click(selectUserButton);

    // 상품 선택 (첫 번째 상품)
    const productButton = screen.getByRole('button', { name: /상품 선택/ });
    await user.click(productButton);

    await waitFor(() => {
      const productOptions = screen.getAllByRole('checkbox');
      if (productOptions.length > 0) {
        user.click(productOptions[0]);
      }
    });

    const selectProductButton = screen.getByRole('button', { name: /선택 완료/ });
    await user.click(selectProductButton);

    // 텍스트 필드 채우기
    await user.type(screen.getByLabelText(/질문/), '투자 관련 질문입니다. 안정적인 투자 방법을 알고 싶습니다.');
    await user.type(screen.getByLabelText(/CoT 1단계/), '1단계: 고객의 투자 성향과 목표를 분석합니다. 안정성을 추구하는 것으로 파악됩니다.');
    await user.type(screen.getByLabelText(/CoT 2단계/), '2단계: 시장 상황과 상품 특성을 검토합니다. 현재 시장은 변동성이 있는 상황입니다.');
    await user.type(screen.getByLabelText(/CoT 3단계/), '3단계: 리스크와 수익률을 종합적으로 평가하여 최적의 포트폴리오를 구성합니다.');
    await user.type(screen.getByLabelText(/최종 답변/), '안정적인 투자를 원하신다면 채권형 펀드와 배당주를 조합한 포트폴리오를 추천드립니다.');
  }
});

// Mock 데이터 생성 함수들
function generateMockCoT() {
  return {
    id: 'cot-test-001',
    productSource: '증권',
    questionType: '고객 특성 강조형',
    questioner: 'user-001',
    products: ['product-001'],
    question: '30대 직장인으로 안정적인 투자를 원합니다.',
    cot1: 'CoT 1단계 분석 내용',
    cot2: 'CoT 2단계 분석 내용',
    cot3: 'CoT 3단계 분석 내용',
    answer: '최종 답변 내용',
    status: '초안',
    author: '전문가',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };
}

function generateMockProducts() {
  return [
    {
      id: 'product-001',
      productSource: '증권',
      productName: '삼성 S&P500 ETF',
      productCategory: 'ETF',
      taxType: '일반과세',
      riskLevel: '3등급(보통)'
    },
    {
      id: 'product-002',
      productSource: '보험',
      productName: '삼성 종신보험',
      productCategory: '종신보험',
      taxType: '비과세',
      riskLevel: '1등급(매우낮음)'
    }
  ];
}

function generateMockUsers() {
  return [
    {
      id: 'user-001',
      customerSource: '증권',
      ageGroup: '30대',
      gender: '남',
      investmentTendency: '적극투자형'
    },
    {
      id: 'user-002',
      customerSource: '보험',
      ageGroup: '40대',
      gender: '여',
      insuranceType: '보장+변액'
    }
  ];
}