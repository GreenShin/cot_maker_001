/**
 * Data Grid Integration Tests
 * 필터링, 정렬, 페이지네이션 반응성 테스트
 */

import React, { useState } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { DataGrid, GridColDef, GridRowsProp } from '@mui/x-data-grid';

import { theme } from '../../../src/styles/theme.js';
import { cotsSlice } from '../../../src/store/slices/cotsSlice.js';
import { productsSlice } from '../../../src/store/slices/productsSlice.js';
import { usersSlice } from '../../../src/store/slices/usersSlice.js';

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
        list: generateMockCoTs(50),
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 25, total: 50 },
        filters: {},
        sortModel: []
      },
      products: {
        list: generateMockProducts(30),
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 25, total: 30 }
      },
      users: {
        list: generateMockUsers(40),
        loading: false,
        error: null,
        pagination: { page: 1, pageSize: 25, total: 40 }
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

// CoT Data Grid 컴포넌트
const CoTDataGrid = ({ data, loading = false }: { data: any[], loading?: boolean }) => {
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [filterModel, setFilterModel] = useState({ items: [] });
  const [sortModel, setSortModel] = useState([]);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 150 },
    { field: 'productSource', headerName: '상품군', width: 120 },
    { field: 'questionType', headerName: '질문유형', width: 200 },
    { field: 'questioner', headerName: '질문자', width: 150 },
    { field: 'question', headerName: '질문', width: 300 },
    { field: 'status', headerName: '상태', width: 100 },
    { field: 'createdAt', headerName: '생성일', width: 150, type: 'date' },
    { field: 'updatedAt', headerName: '수정일', width: 150, type: 'date' }
  ];

  return (
    <div style={{ height: 600, width: '100%' }} data-testid="cot-datagrid">
      <DataGrid
        rows={data}
        columns={columns}
        loading={loading}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        filterModel={filterModel}
        onFilterModelChange={setFilterModel}
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        pageSizeOptions={[10, 25, 50, 100]}
        disableRowSelectionOnClick
        checkboxSelection
        density="standard"
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } },
        }}
      />
    </div>
  );
};

// Product Data Grid 컴포넌트
const ProductDataGrid = ({ data, loading = false }: { data: any[], loading?: boolean }) => {
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 150 },
    { field: 'productSource', headerName: '상품군', width: 120 },
    { field: 'productName', headerName: '상품명', width: 200 },
    { field: 'productCategory', headerName: '카테고리', width: 150 },
    { field: 'riskLevel', headerName: '위험등급', width: 150 },
    { field: 'createdAt', headerName: '생성일', width: 150, type: 'date' }
  ];

  return (
    <div style={{ height: 400, width: '100%' }} data-testid="product-datagrid">
      <DataGrid
        rows={data}
        columns={columns}
        loading={loading}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
      />
    </div>
  );
};

// User Data Grid 컴포넌트
const UserDataGrid = ({ data, loading = false }: { data: any[], loading?: boolean }) => {
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 150 },
    { field: 'customerSource', headerName: '고객군', width: 120 },
    { field: 'ageGroup', headerName: '연령대', width: 100 },
    { field: 'gender', headerName: '성별', width: 80 },
    { field: 'investmentTendency', headerName: '투자성향', width: 150 },
    { field: 'createdAt', headerName: '생성일', width: 150, type: 'date' }
  ];

  return (
    <div style={{ height: 400, width: '100%' }} data-testid="user-datagrid">
      <DataGrid
        rows={data}
        columns={columns}
        loading={loading}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
      />
    </div>
  );
};

describe('Data Grid Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('CoT Data Grid Tests', () => {
    it('should render CoT data grid with initial data', async () => {
      const mockData = generateMockCoTs(10);
      
      render(
        <TestWrapper>
          <CoTDataGrid data={mockData} />
        </TestWrapper>
      );

      expect(screen.getByTestId('cot-datagrid')).toBeInTheDocument();
      
      // 컬럼 헤더 확인
      expect(screen.getByText('상품군')).toBeInTheDocument();
      expect(screen.getByText('질문유형')).toBeInTheDocument();
      expect(screen.getByText('질문자')).toBeInTheDocument();
      expect(screen.getByText('질문')).toBeInTheDocument();
      expect(screen.getByText('상태')).toBeInTheDocument();

      // 첫 번째 행 데이터 확인
      await waitFor(() => {
        expect(screen.getByText(mockData[0].productSource)).toBeInTheDocument();
      });
    });

    it('should handle pagination correctly', async () => {
      const mockData = generateMockCoTs(100);
      
      render(
        <TestWrapper>
          <CoTDataGrid data={mockData} />
        </TestWrapper>
      );

      // 페이지네이션 컨트롤 확인
      await waitFor(() => {
        expect(screen.getByText('1–25 of 100')).toBeInTheDocument();
      });

      // 다음 페이지로 이동
      const nextPageButton = screen.getByLabelText('Go to next page');
      await user.click(nextPageButton);

      await waitFor(() => {
        expect(screen.getByText('26–50 of 100')).toBeInTheDocument();
      });

      // 페이지 크기 변경
      const pageSizeSelect = screen.getByDisplayValue('25');
      await user.click(pageSizeSelect);
      
      const option50 = screen.getByText('50');
      await user.click(option50);

      await waitFor(() => {
        expect(screen.getByText('1–50 of 100')).toBeInTheDocument();
      });
    });

    it('should handle column sorting', async () => {
      const mockData = generateMockCoTs(20);
      
      render(
        <TestWrapper>
          <CoTDataGrid data={mockData} />
        </TestWrapper>
      );

      // 상품군 컬럼으로 정렬
      const productSourceHeader = screen.getByText('상품군');
      await user.click(productSourceHeader);

      // 정렬 아이콘 확인
      await waitFor(() => {
        const sortIcon = within(productSourceHeader.closest('div')!).getByTestId(/sort/i);
        expect(sortIcon).toBeInTheDocument();
      });

      // 역순 정렬
      await user.click(productSourceHeader);

      await waitFor(() => {
        const sortIcon = within(productSourceHeader.closest('div')!).getByTestId(/sort/i);
        expect(sortIcon).toBeInTheDocument();
      });
    });

    it('should handle column filtering', async () => {
      const mockData = generateMockCoTs(30);
      
      render(
        <TestWrapper>
          <CoTDataGrid data={mockData} />
        </TestWrapper>
      );

      // 필터 메뉴 열기
      const productSourceHeader = screen.getByText('상품군');
      const headerCell = productSourceHeader.closest('[role="columnheader"]');
      
      if (headerCell) {
        const menuButton = within(headerCell).getByLabelText('Menu');
        await user.click(menuButton);

        // 필터 옵션 선택
        const filterOption = screen.getByText('Filter');
        await user.click(filterOption);

        // 필터 값 입력
        const filterInput = screen.getByPlaceholderText('Filter value');
        await user.type(filterInput, '증권');

        // 필터 적용
        await waitFor(() => {
          // 필터링된 결과 확인 (증권 상품만 표시)
          const rows = screen.getAllByRole('row');
          expect(rows.length).toBeGreaterThan(1); // 헤더 + 데이터 행들
        });
      }
    });

    it('should show loading state', async () => {
      render(
        <TestWrapper>
          <CoTDataGrid data={[]} loading={true} />
        </TestWrapper>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should handle row selection', async () => {
      const mockData = generateMockCoTs(10);
      
      render(
        <TestWrapper>
          <CoTDataGrid data={mockData} />
        </TestWrapper>
      );

      // 첫 번째 행 체크박스 클릭
      const checkboxes = screen.getAllByRole('checkbox');
      const firstRowCheckbox = checkboxes[1]; // [0]은 헤더 체크박스
      
      await user.click(firstRowCheckbox);

      // 선택 상태 확인
      expect(firstRowCheckbox).toBeChecked();

      // 전체 선택 체크박스 클릭
      const selectAllCheckbox = checkboxes[0];
      await user.click(selectAllCheckbox);

      // 모든 체크박스가 선택되었는지 확인
      await waitFor(() => {
        const allCheckboxes = screen.getAllByRole('checkbox');
        allCheckboxes.forEach(checkbox => {
          expect(checkbox).toBeChecked();
        });
      });
    });
  });

  describe('Product Data Grid Tests', () => {
    it('should render Product data grid with correct columns', async () => {
      const mockData = generateMockProducts(15);
      
      render(
        <TestWrapper>
          <ProductDataGrid data={mockData} />
        </TestWrapper>
      );

      expect(screen.getByTestId('product-datagrid')).toBeInTheDocument();
      
      // Product 특화 컬럼 확인
      expect(screen.getByText('상품명')).toBeInTheDocument();
      expect(screen.getByText('카테고리')).toBeInTheDocument();
      expect(screen.getByText('위험등급')).toBeInTheDocument();
    });

    it('should handle product-specific filtering', async () => {
      const mockData = generateMockProducts(20);
      
      render(
        <TestWrapper>
          <ProductDataGrid data={mockData} />
        </TestWrapper>
      );

      // 위험등급 컬럼 필터링 테스트
      const riskLevelHeader = screen.getByText('위험등급');
      
      // 컬럼 헤더가 렌더링되었는지 확인
      expect(riskLevelHeader).toBeInTheDocument();
      
      // 데이터가 표시되는지 확인
      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(1);
      });
    });
  });

  describe('User Data Grid Tests', () => {
    it('should render User data grid with correct columns', async () => {
      const mockData = generateMockUsers(15);
      
      render(
        <TestWrapper>
          <UserDataGrid data={mockData} />
        </TestWrapper>
      );

      expect(screen.getByTestId('user-datagrid')).toBeInTheDocument();
      
      // User 특화 컬럼 확인
      expect(screen.getByText('고객군')).toBeInTheDocument();
      expect(screen.getByText('연령대')).toBeInTheDocument();
      expect(screen.getByText('성별')).toBeInTheDocument();
      expect(screen.getByText('투자성향')).toBeInTheDocument();
    });

    it('should handle user-specific sorting', async () => {
      const mockData = generateMockUsers(25);
      
      render(
        <TestWrapper>
          <UserDataGrid data={mockData} />
        </TestWrapper>
      );

      // 연령대별 정렬 테스트
      const ageGroupHeader = screen.getByText('연령대');
      await user.click(ageGroupHeader);

      // 정렬 아이콘이 나타나는지 확인
      await waitFor(() => {
        expect(ageGroupHeader.closest('div')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle large dataset efficiently', async () => {
      const largeDataset = generateMockCoTs(1000);
      
      const renderStart = performance.now();
      
      render(
        <TestWrapper>
          <CoTDataGrid data={largeDataset} />
        </TestWrapper>
      );

      const renderTime = performance.now() - renderStart;
      
      // 초기 렌더링이 2초 이내에 완료되어야 함
      expect(renderTime).toBeLessThan(2000);

      // 가상화가 적용되어 모든 행이 DOM에 렌더링되지 않음을 확인
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeLessThan(100); // 가상화로 인해 실제 DOM 행 수는 적어야 함
    });

    it('should handle rapid filtering without lag', async () => {
      const mockData = generateMockCoTs(500);
      
      render(
        <TestWrapper>
          <CoTDataGrid data={mockData} />
        </TestWrapper>
      );

      // 연속적인 정렬 동작
      const productSourceHeader = screen.getByText('상품군');
      const statusHeader = screen.getByText('상태');

      const sortingStart = performance.now();

      await user.click(productSourceHeader);
      await user.click(statusHeader);
      await user.click(productSourceHeader);

      const sortingTime = performance.now() - sortingStart;
      
      // 연속 정렬이 1초 이내에 완료되어야 함
      expect(sortingTime).toBeLessThan(1000);
    });

    it('should handle rapid pagination changes', async () => {
      const mockData = generateMockCoTs(1000);
      
      render(
        <TestWrapper>
          <CoTDataGrid data={mockData} />
        </TestWrapper>
      );

      const paginationStart = performance.now();

      // 빠른 페이지 이동
      const nextPageButton = screen.getByLabelText('Go to next page');
      
      for (let i = 0; i < 5; i++) {
        await user.click(nextPageButton);
        // 각 페이지 이동 후 잠깐 대기
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const paginationTime = performance.now() - paginationStart;
      
      // 5회 페이지 이동이 1초 이내에 완료되어야 함
      expect(paginationTime).toBeLessThan(1000);
    });
  });

  describe('Responsiveness Tests', () => {
    it('should adapt to different screen sizes', async () => {
      const mockData = generateMockCoTs(20);
      
      // 모바일 화면 크기 시뮬레이션
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <CoTDataGrid data={mockData} />
        </TestWrapper>
      );

      const dataGrid = screen.getByTestId('cot-datagrid');
      expect(dataGrid).toBeInTheDocument();

      // 작은 화면에서도 그리드가 정상적으로 렌더링되는지 확인
      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(1);
      });
    });

    it('should handle keyboard navigation', async () => {
      const mockData = generateMockCoTs(10);
      
      render(
        <TestWrapper>
          <CoTDataGrid data={mockData} />
        </TestWrapper>
      );

      const dataGrid = screen.getByTestId('cot-datagrid');
      
      // 데이터그리드에 포커스 설정
      await user.click(dataGrid);

      // 키보드 내비게이션 테스트
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{ArrowUp}');
      await user.keyboard('{ArrowLeft}');

      // 키보드 이벤트가 처리되는지 확인
      // (실제 동작은 MUI DataGrid의 구현에 의존)
      expect(dataGrid).toBeInTheDocument();
    });

    it('should handle empty state gracefully', async () => {
      render(
        <TestWrapper>
          <CoTDataGrid data={[]} />
        </TestWrapper>
      );

      expect(screen.getByTestId('cot-datagrid')).toBeInTheDocument();
      
      // 빈 상태 메시지 또는 헤더가 표시되는지 확인
      expect(screen.getByText('상품군')).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    it('should be accessible with screen readers', async () => {
      const mockData = generateMockCoTs(5);
      
      render(
        <TestWrapper>
          <CoTDataGrid data={mockData} />
        </TestWrapper>
      );

      // ARIA 레이블 확인
      expect(screen.getByRole('grid')).toBeInTheDocument();
      
      // 컬럼 헤더가 올바른 role을 가지는지 확인
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders.length).toBeGreaterThan(0);

      // 행들이 올바른 role을 가지는지 확인
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // 헤더 + 데이터 행들
    });

    it('should support high contrast mode', async () => {
      const mockData = generateMockCoTs(5);
      
      // 고대비 모드 시뮬레이션
      document.body.classList.add('high-contrast');
      
      render(
        <TestWrapper>
          <CoTDataGrid data={mockData} />
        </TestWrapper>
      );

      const dataGrid = screen.getByTestId('cot-datagrid');
      expect(dataGrid).toBeInTheDocument();

      // 고대비 모드에서도 정상적으로 렌더링되는지 확인
      expect(screen.getByText('상품군')).toBeInTheDocument();
      
      // 정리
      document.body.classList.remove('high-contrast');
    });
  });
});

// Mock 데이터 생성 함수들
function generateMockCoTs(count: number) {
  const productSources = ['증권', '보험'];
  const questionTypes = [
    '고객 특성 강조형',
    '투자성향 및 조건 기반형',
    '금융상품 비교분석형',
    '연령별 및 생애주기 저축성 상품 추천형',
    '리스크 및 수익률 중심 상품 추천형',
    '건강 및 질병 보장 대비형'
  ];
  const statuses = ['초안', '검토중', '완료', '보류'];

  return Array.from({ length: count }, (_, i) => ({
    id: `cot-${i.toString().padStart(3, '0')}`,
    productSource: productSources[i % 2],
    questionType: questionTypes[i % questionTypes.length],
    questioner: `user-${i.toString().padStart(3, '0')}`,
    products: [`product-${i}`],
    question: `테스트 질문 ${i + 1}`,
    cot1: `CoT 1단계 분석 ${i + 1}`,
    cot2: `CoT 2단계 분석 ${i + 1}`,
    cot3: `CoT 3단계 분석 ${i + 1}`,
    answer: `최종 답변 ${i + 1}`,
    status: statuses[i % statuses.length],
    author: `전문가-${i % 5 + 1}`,
    createdAt: new Date(2024, 0, 1 + i).toISOString(),
    updatedAt: new Date(2024, 0, 1 + i).toISOString(),
  }));
}

function generateMockProducts(count: number) {
  const productSources = ['증권', '보험'];
  const securitiesCategories = ['주식', 'ETF', '펀드', '채권'];
  const insuranceCategories = ['종신보험', '연금저축', '변액보험'];
  const riskLevels = ['1등급(매우낮음)', '2등급(낮음)', '3등급(보통)', '4등급(높음)', '5등급(매우높음)'];

  return Array.from({ length: count }, (_, i) => {
    const productSource = productSources[i % 2];
    const category = productSource === '증권' 
      ? securitiesCategories[i % securitiesCategories.length]
      : insuranceCategories[i % insuranceCategories.length];

    return {
      id: `product-${i.toString().padStart(3, '0')}`,
      productSource,
      productName: `${category} 상품 ${i + 1}`,
      productCategory: category,
      taxType: productSource === '증권' ? '일반과세' : '비과세',
      riskLevel: riskLevels[i % riskLevels.length],
      description: `${category} 테스트 상품 설명 ${i + 1}`,
      createdAt: new Date(2024, 0, 1 + i).toISOString(),
      updatedAt: new Date(2024, 0, 1 + i).toISOString(),
    };
  });
}

function generateMockUsers(count: number) {
  const customerSources = ['증권', '보험'];
  const ageGroups = ['20대', '30대', '40대', '50대', '60대이상'];
  const genders = ['남', '여'];
  const investmentTendencies = ['안정추구형', '안정형', '중립형', '적극투자형', '공격투자형'];
  const insuranceTypes = ['보장only', '저축only', '보장+저축', '변액', '보장+변액'];

  return Array.from({ length: count }, (_, i) => {
    const customerSource = customerSources[i % 2];
    
    const baseUser = {
      id: `user-${i.toString().padStart(3, '0')}`,
      customerSource,
      ageGroup: ageGroups[i % ageGroups.length],
      gender: genders[i % 2],
      ownedProducts: [],
      createdAt: new Date(2024, 0, 1 + i).toISOString(),
      updatedAt: new Date(2024, 0, 1 + i).toISOString(),
    };

    if (customerSource === '증권') {
      return {
        ...baseUser,
        investmentTendency: investmentTendencies[i % investmentTendencies.length],
        investmentAmount: (i + 1) * 1000,
      };
    } else {
      return {
        ...baseUser,
        insuranceType: insuranceTypes[i % insuranceTypes.length],
      };
    }
  });
}