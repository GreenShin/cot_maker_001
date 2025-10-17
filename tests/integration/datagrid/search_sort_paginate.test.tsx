import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { CoTsListPage } from '../../../src/pages/cots/CotsListPage';
import { theme } from '../../../src/styles/theme';

// Mock store for testing
const createMockStore = () => configureStore({
  reducer: {
    cots: (state = { items: [], loading: false, filters: {} }, action) => state,
    settings: (state = { theme: 'light' }, action) => state
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

describe('Data Grid Search/Sort/Paginate Integration', () => {
  beforeEach(() => {
    // Mock large dataset
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          items: Array.from({ length: 1000 }, (_, i) => ({
            id: `cot-${i}`,
            productSource: i % 2 === 0 ? '증권' : '보험',
            questionType: '고객 특성 강조형',
            questioner: `user-${i}`,
            question: `질문 ${i}`,
            author: '관리자',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })),
          total: 1000,
          page: 1,
          pageSize: 50
        })
      })
    ) as any;
  });

  it('should render data grid with virtualization', async () => {
    renderWithProviders(<CoTsListPage />);
    
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    // Should not render all 1000 rows at once (virtualization)
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeLessThan(100); // Only visible rows + buffer
  });

  it('should filter by text search across question/CoT/answer', async () => {
    renderWithProviders(<CoTsListPage />);
    
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/검색/);
    fireEvent.change(searchInput, { target: { value: '질문 100' } });

    await waitFor(() => {
      // Should show filtered results
      expect(screen.getByText('질문 100')).toBeInTheDocument();
    });
  });

  it('should filter by product source dropdown', async () => {
    renderWithProviders(<CoTsListPage />);
    
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    const productSourceFilter = screen.getByLabelText(/상품분류/);
    fireEvent.mouseDown(productSourceFilter);
    
    const securitiesOption = screen.getByText('증권');
    fireEvent.click(securitiesOption);

    await waitFor(() => {
      // Should show only securities products
      const rows = screen.getAllByRole('row');
      rows.forEach(row => {
        if (row.textContent?.includes('증권') || row.textContent?.includes('보험')) {
          expect(row.textContent).toContain('증권');
        }
      });
    });
  });

  it('should sort columns when header is clicked', async () => {
    renderWithProviders(<CoTsListPage />);
    
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    const createdAtHeader = screen.getByText('등록일');
    fireEvent.click(createdAtHeader);

    await waitFor(() => {
      // Should show sort indicator
      expect(screen.getByRole('columnheader', { name: /등록일/ }))
        .toHaveAttribute('aria-sort');
    });
  });

  it('should handle pagination controls', async () => {
    renderWithProviders(<CoTsListPage />);
    
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    const nextPageButton = screen.getByLabelText(/다음 페이지/);
    fireEvent.click(nextPageButton);

    await waitFor(() => {
      // Should load next page
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
    });
  });

  it('should maintain responsive performance with large datasets', async () => {
    const startTime = performance.now();
    
    renderWithProviders(<CoTsListPage />);
    
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    const renderTime = performance.now() - startTime;
    
    // Should render within reasonable time (< 1000ms for initial load)
    expect(renderTime).toBeLessThan(1000);
  });
});
