import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { CoTQA } from '../../models/cotqa';
import type { PaginatedResult, QueryOptions } from '../../services/storage/storage';
import { InMemoryStorageAdapter } from '../../services/storage/storage';
import { QueryService, type SearchFilters } from '../../services/query/queryService';

export interface CoTsState {
  items: CoTQA[];
  currentCoT: CoTQA | null;
  loading: boolean;
  error: string | null;
  // 페이지네이션
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  // 필터 및 검색
  filters: SearchFilters;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const initialState: CoTsState = {
  items: [],
  currentCoT: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0
  },
  filters: {},
  sortBy: 'updatedAt',
  sortOrder: 'desc'
};

// 스토리지 어댑터 (실제 구현에서는 의존성 주입)
const storage = new InMemoryStorageAdapter<CoTQA>('cot');

// 비동기 액션들
export const fetchCoTs = createAsyncThunk(
  'cots/fetchCoTs',
  async (options: Partial<QueryOptions> = {}) => {
    const result = await storage.getPaginated(options);
    return result;
  }
);

export const fetchCoTById = createAsyncThunk(
  'cots/fetchCoTById',
  async (id: string) => {
    const cot = await storage.getById(id);
    if (!cot) {
      throw new Error(`CoT with id ${id} not found`);
    }
    return cot;
  }
);

export const createCoT = createAsyncThunk(
  'cots/createCoT',
  async (cotData: Omit<CoTQA, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCoT = await storage.create(cotData);
    return newCoT;
  }
);

export const updateCoT = createAsyncThunk(
  'cots/updateCoT',
  async ({ id, data }: { id: string; data: Partial<CoTQA> }) => {
    const updatedCoT = await storage.update(id, data);
    return updatedCoT;
  }
);

export const deleteCoT = createAsyncThunk(
  'cots/deleteCoT',
  async (id: string) => {
    const success = await storage.delete(id);
    if (!success) {
      throw new Error(`Failed to delete CoT with id ${id}`);
    }
    return id;
  }
);

export const searchCoTs = createAsyncThunk(
  'cots/searchCoTs',
  async (params: { filters: SearchFilters; page?: number; pageSize?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }) => {
    const { filters, page = 1, pageSize = 50, sortBy = 'updatedAt', sortOrder = 'desc' } = params;
    
    const queryOptions = QueryService.buildQueryOptions(filters, page, pageSize, sortBy, sortOrder);
    const result = await storage.getPaginated(queryOptions);
    
    return { result, filters, sortBy, sortOrder };
  }
);

export const cotsSlice = createSlice({
  name: 'cots',
  initialState,
  reducers: {
    // 필터 설정
    setFilters: (state, action: PayloadAction<SearchFilters>) => {
      state.filters = action.payload;
    },

    // 정렬 설정
    setSorting: (state, action: PayloadAction<{ sortBy: string; sortOrder: 'asc' | 'desc' }>) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },

    // 페이지 변경
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },

    // 페이지 크기 변경
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.pageSize = action.payload;
      state.pagination.page = 1; // 페이지 크기 변경 시 첫 페이지로
    },

    // 현재 CoT 설정
    setCurrentCoT: (state, action: PayloadAction<CoTQA | null>) => {
      state.currentCoT = action.payload;
    },

    // 에러 클리어
    clearError: (state) => {
      state.error = null;
    },

    // 필터 초기화
    clearFilters: (state) => {
      state.filters = {};
    },

    // 로컬 아이템 업데이트 (낙관적 업데이트용)
    updateLocalCoT: (state, action: PayloadAction<CoTQA>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      if (state.currentCoT?.id === action.payload.id) {
        state.currentCoT = action.payload;
      }
    }
  },

  extraReducers: (builder) => {
    // fetchCoTs
    builder
      .addCase(fetchCoTs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoTs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = {
          page: action.payload.page,
          pageSize: action.payload.pageSize,
          total: action.payload.total,
          totalPages: action.payload.totalPages
        };
      })
      .addCase(fetchCoTs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'CoT 목록 조회 실패';
      });

    // fetchCoTById
    builder
      .addCase(fetchCoTById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoTById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCoT = action.payload;
      })
      .addCase(fetchCoTById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'CoT 조회 실패';
      });

    // createCoT
    builder
      .addCase(createCoT.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCoT.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload); // 새 항목을 맨 앞에 추가
        state.currentCoT = action.payload;
      })
      .addCase(createCoT.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'CoT 생성 실패';
      });

    // updateCoT
    builder
      .addCase(updateCoT.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCoT.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.currentCoT?.id === action.payload.id) {
          state.currentCoT = action.payload;
        }
      })
      .addCase(updateCoT.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'CoT 수정 실패';
      });

    // deleteCoT
    builder
      .addCase(deleteCoT.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCoT.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => item.id !== action.payload);
        if (state.currentCoT?.id === action.payload) {
          state.currentCoT = null;
        }
      })
      .addCase(deleteCoT.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'CoT 삭제 실패';
      });

    // searchCoTs
    builder
      .addCase(searchCoTs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchCoTs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.result.items;
        state.pagination = {
          page: action.payload.result.page,
          pageSize: action.payload.result.pageSize,
          total: action.payload.result.total,
          totalPages: action.payload.result.totalPages
        };
        state.filters = action.payload.filters;
        state.sortBy = action.payload.sortBy;
        state.sortOrder = action.payload.sortOrder;
      })
      .addCase(searchCoTs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'CoT 검색 실패';
      });
  }
});

export const {
  setFilters,
  setSorting,
  setPage,
  setPageSize,
  setCurrentCoT,
  clearError,
  clearFilters,
  updateLocalCoT
} = cotsSlice.actions;

export default cotsSlice.reducer;
